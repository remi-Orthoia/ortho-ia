'use client'

/**
 * Affichage live de la génération CRBO en streaming SSE.
 *
 * Mécanique :
 *   - Reçoit un flux de strings `partial_json` envoyés par /api/generate-crbo?stream=1
 *   - Accumule pour reconstituer progressivement le JSON tool_use
 *   - Extrait par regex tolérante les valeurs des champs structurés (points_forts,
 *     diagnostic, recommandations, etc.) au fur et à mesure qu'elles arrivent
 *   - Render avec highlight des termes cliniques (dyslexie, percentiles, etc.)
 *
 * Pas de streaming JSON parser à proprement parler : on s'appuie sur le fait
 * que Claude écrit le JSON dans un ordre déterministe (champ par champ), et
 * que chaque chaîne de string JSON est délimitée par `"field":"...."`. Une
 * regex non-greedy suffit pour récupérer la valeur en construction.
 */

import { useEffect, useMemo, useRef } from 'react'
import { Sparkles, Loader2 } from 'lucide-react'

interface Props {
  /** Texte JSON accumulé envoyé par le serveur (somme des `partial` chunks). */
  accumulated: string
  /** Vrai pendant que la génération tourne, faux à `complete` ou `error`. */
  active: boolean
  /**
   * Vrai si le bilan ne contient QUE la MoCA — alors le label du champ
   * diagnostic devient "Hypothèse de diagnostic" (screening cognitif sans
   * diagnostic ferme).
   */
  isMoca?: boolean
}

// ============================================================================
// Extraction tolérante : récupère la valeur courante de champs string connus
// ============================================================================

function buildStreamFields(isMoca: boolean) {
  // Refonte 2026-05 : "Points forts" et "Difficultés identifiées" supprimés
  // comme sections séparées (intégrés dans le diagnostic via phrase synthèse).
  // "Recommandations" renommé "Projet thérapeutique" au rendu.
  return [
    { key: 'diagnostic',             label: isMoca ? 'Hypothèse de diagnostic' : 'Diagnostic' },
    { key: 'recommandations',        label: 'Projet thérapeutique' },
    { key: 'conclusion',             label: 'Conclusion' },
  ] as const
}

function extractField(accumulated: string, fieldKey: string): { value: string; complete: boolean } | null {
  // Match "<fieldKey>": " puis contenu jusqu'à un guillemet non-échappé.
  // Le regex tolère les sauts de ligne (.s en mode 's' polyfillé via [\s\S]).
  const startMarker = new RegExp(`"${fieldKey}"\\s*:\\s*"`)
  const startMatch = accumulated.match(startMarker)
  if (!startMatch || startMatch.index === undefined) return null
  const valStart = startMatch.index + startMatch[0].length

  // Cherche le guillemet de fin non échappé.
  let i = valStart
  let escape = false
  while (i < accumulated.length) {
    const c = accumulated[i]
    if (escape) {
      escape = false
    } else if (c === '\\') {
      escape = true
    } else if (c === '"') {
      // Fin du string trouvée
      return {
        value: decodeJsonString(accumulated.slice(valStart, i)),
        complete: true,
      }
    }
    i++
  }
  // Pas de guillemet de fin → champ encore en cours d'écriture
  return {
    value: decodeJsonString(accumulated.slice(valStart)),
    complete: false,
  }
}

function decodeJsonString(s: string): string {
  // Décode minimaliste \n \t \" \\ \/ \uXXXX dans une string JSON partielle.
  return s
    .replace(/\\n/g, '\n')
    .replace(/\\t/g, '\t')
    .replace(/\\r/g, '')
    .replace(/\\"/g, '"')
    .replace(/\\\\/g, '\\')
    .replace(/\\\//g, '/')
    .replace(/\\u([0-9a-fA-F]{4})/g, (_, h) => String.fromCharCode(parseInt(h, 16)))
}

// ============================================================================
// Highlight des termes cliniques
// ============================================================================

const CLINICAL_TERMS: Array<{ regex: RegExp; className: string; label: string }> = [
  // Troubles spécifiques (violet)
  { regex: /\b(dyslexie|dysorthographie|dyscalculie|dysphasie|dyspraxie|TDAH|TDA)\b/gi, className: 'highlight-trouble', label: 'trouble' },
  // Niveaux cliniques (orange/rouge)
  { regex: /\b(difficulté sévère|déficitaire|pathologique)\b/gi, className: 'highlight-severe', label: 'sévère' },
  { regex: /\b(fragilité|fragile|limite basse)\b/gi, className: 'highlight-warning', label: 'fragilité' },
  { regex: /\b(excellent|préservé(?:e|s|es)?|automatisé(?:e|s|es)?)\b/gi, className: 'highlight-success', label: 'préservé' },
  // Percentiles (bleu) — P5, P10, P25, P75... + Q1/Med/Q3
  { regex: /\b(P[0-9]{1,2}|Q[123]|Med)\b/g, className: 'highlight-percentile', label: 'percentile' },
  // Domaines cognitifs (gris-bleu)
  { regex: /\b(métaphonologie|phonologie|lexique|sémantique|morphosyntaxe|décodage|leximétrie|fluence(?:s)?)\b/gi, className: 'highlight-domain', label: 'domaine' },
]

function highlightClinicalTerms(text: string): string {
  // Échappement HTML d'abord, puis substitution des matches par <span>.
  let out = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
  for (const { regex, className } of CLINICAL_TERMS) {
    out = out.replace(regex, (m) => `<span class="${className}">${m}</span>`)
  }
  return out
}

// ============================================================================
// Composant principal
// ============================================================================

export default function StreamingCRBO({ accumulated, active, isMoca = false }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)

  // Champs affichés (labels ajustés selon le type de bilan).
  const streamFields = useMemo(() => buildStreamFields(isMoca), [isMoca])

  // Extrait les champs courants depuis le buffer accumulé.
  const fields = useMemo(() => {
    return streamFields.map((f) => {
      const extracted = extractField(accumulated, f.key)
      return {
        ...f,
        value: extracted?.value ?? '',
        complete: extracted?.complete ?? false,
        started: extracted !== null,
      }
    })
  }, [accumulated, streamFields])

  // Le champ courant = le dernier qui a démarré mais pas terminé.
  const currentFieldIndex = useMemo(() => {
    for (let i = fields.length - 1; i >= 0; i--) {
      if (fields[i].started && !fields[i].complete) return i
    }
    // Si tous sont complets ou aucun n'a démarré → -1
    return -1
  }, [fields])

  // Auto-scroll vers le bas pour suivre la dernière sortie.
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
  }, [accumulated])

  const startedCount = fields.filter(f => f.started).length
  const completedCount = fields.filter(f => f.complete).length

  return (
    <div
      style={{
        background: 'var(--bg-surface, white)',
        border: '1px solid var(--border-ds, #E5E7EB)',
        borderRadius: 16,
        padding: 24,
        fontFamily: 'var(--font-body, system-ui)',
        maxWidth: 760,
        margin: '0 auto',
      }}
    >
      <div className="flex items-center gap-3 mb-4">
        <div
          style={{
            width: 40, height: 40, borderRadius: 12,
            background: 'linear-gradient(135deg, #22c55e 0%, #10b981 100%)',
            color: 'white',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(34,197,94,0.30)',
          }}
        >
          {active
            ? <Loader2 size={20} className="animate-spin" />
            : <Sparkles size={20} />}
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ margin: 0, fontWeight: 600, fontSize: 15, color: 'var(--fg-1)' }}>
            {active ? "Ortho.ia rédige votre CRBO…" : 'Génération terminée'}
          </p>
          <p style={{ margin: 0, marginTop: 2, fontSize: 12, color: 'var(--fg-3)' }}>
            {completedCount}/{fields.length} sections finalisées
            {currentFieldIndex >= 0 && active && ` · en cours : ${fields[currentFieldIndex].label}`}
          </p>
        </div>
      </div>

      {/* Barre de progression simple */}
      <div
        style={{
          height: 3,
          background: 'var(--border-ds, #E5E7EB)',
          borderRadius: 999,
          overflow: 'hidden',
          marginBottom: 20,
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${Math.round((startedCount / fields.length) * 100)}%`,
            background: 'linear-gradient(90deg, #22c55e, #10b981)',
            transition: 'width 400ms ease',
          }}
        />
      </div>

      {/* Texte streamé section par section */}
      <div
        ref={containerRef}
        style={{
          maxHeight: '46vh',
          overflowY: 'auto',
          padding: '0 4px',
          scrollBehavior: 'smooth',
        }}
      >
        {fields.map((field, idx) => {
          if (!field.started) {
            // Section pas encore commencée — placeholder discret.
            return (
              <div key={field.key} style={{ marginBottom: 14, opacity: 0.35 }}>
                <h4 style={{ margin: 0, marginBottom: 4, fontSize: 13, fontWeight: 600, color: 'var(--fg-3)' }}>
                  {field.label}
                </h4>
                <p style={{ margin: 0, fontSize: 14, fontStyle: 'italic', color: 'var(--fg-3)' }}>
                  En attente…
                </p>
              </div>
            )
          }
          const isCurrent = idx === currentFieldIndex
          return (
            <div key={field.key} style={{ marginBottom: 18 }}>
              <h4 style={{
                margin: 0, marginBottom: 6,
                fontSize: 13, fontWeight: 600,
                color: field.complete ? '#16a34a' : 'var(--fg-2)',
                display: 'flex', alignItems: 'center', gap: 6,
              }}>
                {field.label}
                {field.complete && <span style={{ color: '#16a34a' }}>✓</span>}
                {isCurrent && active && (
                  <Loader2 size={11} className="animate-spin" style={{ color: '#22c55e' }} />
                )}
              </h4>
              <p
                className="streaming-paragraph"
                style={{
                  margin: 0, fontSize: 14.5, lineHeight: 1.6,
                  color: 'var(--fg-1)',
                  whiteSpace: 'pre-wrap',
                }}
                // Le contenu vient du serveur déjà rehydraté + highlight sécurisé
                // par escape HTML upstream. Pas de XSS possible (seules les
                // balises <span class="highlight-…"> sont injectées).
                dangerouslySetInnerHTML={{
                  __html: highlightClinicalTerms(field.value)
                    + (isCurrent && active ? '<span class="streaming-caret">▍</span>' : ''),
                }}
              />
            </div>
          )
        })}
      </div>

      {/* Styles inline pour les highlights cliniques et le caret */}
      <style jsx>{`
        :global(.highlight-trouble) {
          background: linear-gradient(180deg, transparent 60%, rgba(168,85,247,0.22) 60%);
          color: #6b21a8;
          font-weight: 500;
        }
        :global(.highlight-severe) {
          background: linear-gradient(180deg, transparent 60%, rgba(239,68,68,0.22) 60%);
          color: #b91c1c;
          font-weight: 500;
        }
        :global(.highlight-warning) {
          background: linear-gradient(180deg, transparent 60%, rgba(245,158,11,0.22) 60%);
          color: #b45309;
          font-weight: 500;
        }
        :global(.highlight-success) {
          background: linear-gradient(180deg, transparent 60%, rgba(34,197,94,0.22) 60%);
          color: #15803d;
          font-weight: 500;
        }
        :global(.highlight-percentile) {
          color: #2563eb;
          font-weight: 600;
          font-variant-numeric: tabular-nums;
        }
        :global(.highlight-domain) {
          color: #475569;
          font-weight: 500;
        }
        :global(.streaming-caret) {
          display: inline-block;
          margin-left: 2px;
          color: #22c55e;
          animation: blink-caret 1s steps(2) infinite;
        }
        @keyframes blink-caret {
          50% { opacity: 0; }
        }
      `}</style>
    </div>
  )
}
