'use client'

import { useEffect, useState } from 'react'
import { Lightbulb, X } from 'lucide-react'

/**
 * Astuce contextuelle discrète selon le nombre de CRBO déjà générés
 * (workflow de l'ortho). Persiste les "vus" sur 24h en localStorage.
 */

interface Tip {
  id: string
  /** Condition d'affichage basée sur le nombre de CRBO total de l'ortho. */
  minCrbo: number
  maxCrbo?: number
  text: React.ReactNode
}

const TIPS: Tip[] = [
  {
    id: 'welcome-profile',
    minCrbo: 0,
    maxCrbo: 0,
    text: (
      <>
        Avant votre premier CRBO, pensez à <strong>compléter votre profil</strong> — cela
        évitera de retaper votre adresse et téléphone à chaque bilan.
      </>
    ),
  },
  {
    id: 'carnet-patients',
    minCrbo: 1,
    maxCrbo: 2,
    text: (
      <>
        Astuce : ajoutez vos patients dans le <strong>Carnet</strong> pour retrouver leur fiche
        en un clic à chaque bilan de renouvellement.
      </>
    ),
  },
  {
    id: 'import-pdf',
    minCrbo: 2,
    maxCrbo: 4,
    text: (
      <>
        Vous avez testé l&apos;<strong>import PDF</strong> ? Ortho.ia lit votre PDF
        Exalang en 10 secondes et extrait tous les scores avec les bons percentiles.
      </>
    ),
  },
  {
    id: 'timeline-patient',
    minCrbo: 3,
    maxCrbo: 10,
    text: (
      <>
        Pour les bilans de renouvellement, consultez la <strong>timeline d&apos;évolution</strong>{' '}
        dans la fiche du patient — vous voyez les progrès bilan après bilan.
      </>
    ),
  },
  {
    id: 'partage-24h',
    minCrbo: 5,
    text: (
      <>
        Besoin de relire un CRBO sur tablette ? Générez un <strong>lien de partage
        sécurisé 24h</strong> depuis l&apos;aperçu, copiez-le et relisez tranquillement.
      </>
    ),
  },
  {
    id: 'raccourci',
    minCrbo: 3,
    text: (
      <>
        Raccourci pro : <kbd
          style={{
            padding: '2px 6px',
            background: 'var(--bg-surface-2)',
            color: 'var(--fg-2)',
            borderRadius: 'var(--radius-xs)',
            fontFamily: 'var(--font-mono)',
            fontSize: 12,
          }}
        >⌘ + Entrée</kbd> pour
        lancer la génération depuis l&apos;étape 5, sans bouger la souris.
      </>
    ),
  },
  {
    id: 'severite-kanban',
    minCrbo: 5,
    text: (
      <>
        Sur le <strong>Kanban</strong>, un coup d&apos;œil aux badges de sévérité (Léger /
        Modéré / Sévère) vous aide à prioriser vos relectures.
      </>
    ),
  },
  // ============================================================================
  // Tips contextualisés sur les features avancées — proposés une fois que
  // l'ortho a pris ses marques (≥ 4 CRBOs). Découverte progressive plutôt
  // qu'overload au début.
  // ============================================================================
  {
    id: 'voice-command',
    minCrbo: 4,
    text: (
      <>
        Saviez-vous que vous pouvez <strong>dicter une commande</strong> pour démarrer un bilan ?
        Cliquez sur <em>« Démarrer en vocal »</em> en haut du tableau de bord et dites <em>« Nouveau bilan
        Léa CE2, motif lenteur lecture, Exalang 8-11 »</em>, le formulaire se pré-remplit tout seul.
      </>
    ),
  },
  {
    id: 'snippets',
    minCrbo: 4,
    text: (
      <>
        Économisez de la frappe : tapez <kbd
          style={{
            padding: '2px 6px',
            background: 'var(--bg-surface-2)',
            color: 'var(--fg-2)',
            borderRadius: 'var(--radius-xs)',
            fontFamily: 'var(--font-mono)',
            fontSize: 12,
          }}>/fatigue</kbd>, <kbd
          style={{
            padding: '2px 6px',
            background: 'var(--bg-surface-2)',
            color: 'var(--fg-2)',
            borderRadius: 'var(--radius-xs)',
            fontFamily: 'var(--font-mono)',
            fontSize: 12,
          }}>/empan-faible</kbd> dans l&apos;anamnèse pour réinjecter vos formulations habituelles.
        Gérez vos snippets dans <strong>Mon profil</strong>.
      </>
    ),
  },
  {
    id: 'calendar',
    minCrbo: 5,
    text: (
      <>
        Connectez votre <strong>agenda Google</strong> au tableau de bord : vos prochains RDV s&apos;affichent et un
        bouton <em>« Démarrer »</em> apparaît à côté du patient matché dans votre carnet. Un clic, le
        bilan démarre.
      </>
    ),
  },
  {
    id: 'patient-notes',
    minCrbo: 6,
    text: (
      <>
        Sur chaque fiche patient, un <strong>fil de notes</strong> personnel pour vos observations
        entre séances, retours médecin, ou rappels de renouvellement. Plus de post-its perdus.
      </>
    ),
  },
  {
    id: 'one-click-renouv',
    minCrbo: 8,
    text: (
      <>
        Pour un patient déjà suivi, cliquez <strong>« Refaire un bilan »</strong> sur sa fiche : anamnèse
        stable, médecin, test précédent et lien bilan initial sont pré-remplis en 1 clic.
      </>
    ),
  },
  {
    id: 'pdf-export',
    minCrbo: 6,
    text: (
      <>
        Besoin d&apos;envoyer le CRBO au médecin prescripteur en PDF ? Cliquez l&apos;icône <strong>PDF</strong> à côté
        du téléchargement Word, l&apos;aperçu d&apos;impression s&apos;ouvre, choisissez <em>« Enregistrer au format PDF »</em>.
      </>
    ),
  },
  {
    id: 'focus-mode',
    minCrbo: 5,
    text: (
      <>
        À l&apos;étape <strong>Anamnèse</strong>, le mode focus s&apos;active automatiquement : sidebar et header
        disparaissent pour que vous puissiez écrire sans distraction. Pressez <kbd
          style={{
            padding: '2px 6px',
            background: 'var(--bg-surface-2)',
            color: 'var(--fg-2)',
            borderRadius: 'var(--radius-xs)',
            fontFamily: 'var(--font-mono)',
            fontSize: 12,
          }}>Échap</kbd> à tout moment pour quitter.
      </>
    ),
  },
]

const STORAGE_KEY = 'orthoia.daily-tip.seen'

function getSeenTips(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return new Set()
    const parsed = JSON.parse(raw) as { tips: string[]; date: string }
    // Reset chaque jour — nouveau jour → toutes les astuces peuvent revenir
    const today = new Date().toISOString().slice(0, 10)
    if (parsed.date !== today) return new Set()
    return new Set(parsed.tips)
  } catch {
    return new Set()
  }
}

function markSeen(tipId: string) {
  try {
    const today = new Date().toISOString().slice(0, 10)
    const seen = getSeenTips()
    seen.add(tipId)
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ tips: Array.from(seen), date: today }))
  } catch {}
}

interface Props {
  /** Nombre de CRBO déjà générés par l'ortho — détermine quelle astuce afficher. */
  crboCount: number
}

export default function DailyTip({ crboCount }: Props) {
  const [tip, setTip] = useState<Tip | null>(null)

  useEffect(() => {
    const seen = getSeenTips()
    const candidates = TIPS.filter(t =>
      crboCount >= t.minCrbo &&
      (t.maxCrbo === undefined || crboCount <= t.maxCrbo) &&
      !seen.has(t.id),
    )
    if (candidates.length === 0) return
    // Sélection pseudo-aléatoire stable sur la journée pour ne pas changer
    // de tip à chaque re-render. Hash basé sur la date du jour.
    const today = new Date().toISOString().slice(0, 10)
    let hash = 0
    for (let i = 0; i < today.length; i++) hash = (hash * 31 + today.charCodeAt(i)) | 0
    const idx = Math.abs(hash) % candidates.length
    setTip(candidates[idx])
  }, [crboCount])

  if (!tip) return null

  const dismiss = () => {
    markSeen(tip.id)
    setTip(null)
  }

  return (
    <div
      className="animate-scale-in flex items-start gap-3"
      style={{
        padding: 16,
        background: `linear-gradient(135deg, var(--ds-warning-soft) 0%, color-mix(in srgb, var(--ds-warning-soft) 60%, var(--bg-surface)) 100%)`,
        border: '1px solid color-mix(in srgb, var(--ds-warning) 25%, transparent)',
        borderRadius: 'var(--radius-md)',
        fontFamily: 'var(--font-body)',
      }}
    >
      <div
        className="shrink-0 flex items-center justify-center"
        style={{
          width: 36, height: 36,
          borderRadius: 'var(--radius-md)',
          background: 'color-mix(in srgb, var(--ds-warning) 22%, transparent)',
          color: 'var(--ds-warning)',
        }}
      >
        <Lightbulb size={16} />
      </div>
      <div className="flex-1 min-w-0" style={{ fontSize: 14, color: 'var(--fg-1)' }}>
        <p
          style={{
            fontSize: 11,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            fontWeight: 700,
            color: 'var(--ds-warning)',
            marginBottom: 2,
          }}
        >
          Astuce du jour
        </p>
        {tip.text}
      </div>
      <button
        onClick={dismiss}
        aria-label="Masquer l'astuce"
        className="shrink-0"
        style={{
          padding: 4,
          borderRadius: 'var(--radius-sm)',
          background: 'transparent',
          color: 'var(--fg-3)',
          border: 0,
          cursor: 'pointer',
          transition: 'background 180ms, color 180ms',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'var(--bg-surface)'
          e.currentTarget.style.color = 'var(--fg-1)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'transparent'
          e.currentTarget.style.color = 'var(--fg-3)'
        }}
      >
        <X size={14} />
      </button>
    </div>
  )
}
