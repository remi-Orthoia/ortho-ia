'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Sparkles, Download, Save, X } from 'lucide-react'
import DomaineSection from './DomaineSection'
import PastilleLegend from './PastilleLegend'
import { useToast } from '@/components/Toast'
import { createClient } from '@/lib/supabase'
import { computeParentColor } from '@/lib/bilans/math/parent-color'
import type {
  GrilleBilan,
  BilanMathDraft,
  EpreuveState,
  PastilleEtat,
} from '@/lib/bilans/math/types'

/**
 * Formulaire complet d'un bilan B-CM / B-CMado.
 *
 * Pris une `grille` (statique) en entrée, gère tout l'état local du bilan :
 * coordonnées patient, mode (initial / renouvellement), état des épreuves,
 * génération IA par épreuve, génération du CRBO complet, sauvegarde Supabase.
 */

const DRAFT_KEY_PREFIX = 'ortho-ia:bilan-math-draft:'

function makeEmptyDraft(grille: GrilleBilan): BilanMathDraft {
  return {
    type: grille.id,
    mode: 'initial',
    patient: { prenom: '', nom: '', date_naissance: '', classe: '' },
    epreuves: {},
    updatedAt: Date.now(),
  }
}

interface BilanMathFormProps {
  grille: GrilleBilan
}

export default function BilanMathForm({ grille }: BilanMathFormProps) {
  const draftKey = `${DRAFT_KEY_PREFIX}${grille.id}`
  const toast = useToast()
  const router = useRouter()
  const [draft, setDraft] = useState<BilanMathDraft>(() => makeEmptyDraft(grille))
  const [hydrated, setHydrated] = useState(false)
  const [generatingEpreuveId, setGeneratingEpreuveId] = useState<string | null>(null)
  // État du CRBO complet : null tant que pas généré, sinon le texte éditable.
  const [generatedCRBO, setGeneratedCRBO] = useState<string | null>(null)
  const [isGeneratingCRBO, setIsGeneratingCRBO] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Hydratation localStorage au mount uniquement (évite SSR mismatch).
  useEffect(() => {
    try {
      const raw = localStorage.getItem(draftKey)
      if (raw) {
        const parsed = JSON.parse(raw) as BilanMathDraft
        if (parsed && parsed.type === grille.id) {
          setDraft(parsed)
        }
      }
    } catch {
      // localStorage corrompu : on ignore et on garde le draft vide.
    }
    setHydrated(true)
  }, [draftKey, grille.id])

  // Persiste à chaque changement (debounce 400ms pour éviter de spammer
  // localStorage à chaque keystroke).
  useEffect(() => {
    if (!hydrated) return
    const handle = setTimeout(() => {
      try {
        localStorage.setItem(draftKey, JSON.stringify(draft))
      } catch {
        // Quota dépassé / navigation privée : pas de fallback ici.
      }
    }, 400)
    return () => clearTimeout(handle)
  }, [draft, draftKey, hydrated])

  const handleEpreuveChange = (epreuveId: string, next: EpreuveState) => {
    setDraft((prev) => ({
      ...prev,
      epreuves: { ...prev.epreuves, [epreuveId]: next },
      updatedAt: Date.now(),
    }))
  }

  /**
   * Appelle l'API IA pour une épreuve donnée. Assemble le payload avec :
   *  - les sous-épreuves résolues en {label, color}
   *  - le contexte du reste du bilan (autres épreuves non-grises)
   * Met à jour state.iaText au retour. Toast d'erreur en cas d'échec.
   */
  const handleGenerateEpreuve = async (epreuveId: string) => {
    // Résolution domaine + épreuve dans la grille.
    let domaineLabel = ''
    let epreuveDef: GrilleBilan['domaines'][number]['epreuves'][number] | null = null
    for (const dom of grille.domaines) {
      const found = dom.epreuves.find((e) => e.id === epreuveId)
      if (found) {
        domaineLabel = dom.label
        epreuveDef = found
        break
      }
    }
    if (!epreuveDef) {
      toast.error('Épreuve introuvable dans la grille.')
      return
    }

    const state = draft.epreuves[epreuveId] ?? { sousEpreuves: {}, notes: '' }
    const isMono = epreuveDef.sousEpreuves.length === 0

    const sousEpreuves = isMono
      ? []
      : epreuveDef.sousEpreuves.map((se) => ({
          label: se.label,
          color: (state.sousEpreuves[se.id] ?? 'gris') as PastilleEtat,
        }))

    const parentColor: PastilleEtat = isMono
      ? (state.direct ?? 'gris')
      : computeParentColor(sousEpreuves.map((s) => s.color))

    // Contexte : autres épreuves non-grises. On évite d'inclure l'épreuve courante.
    const contexteBilan: Array<{ domaineLabel: string; epreuveLabel: string; color: PastilleEtat }> = []
    for (const dom of grille.domaines) {
      for (const ep of dom.epreuves) {
        if (ep.id === epreuveId) continue
        const otherState = draft.epreuves[ep.id]
        if (!otherState) continue
        const isOtherMono = ep.sousEpreuves.length === 0
        const otherColor: PastilleEtat = isOtherMono
          ? (otherState.direct ?? 'gris')
          : computeParentColor(ep.sousEpreuves.map((se) => otherState.sousEpreuves[se.id] ?? 'gris'))
        if (otherColor !== 'gris') {
          contexteBilan.push({ domaineLabel: dom.label, epreuveLabel: ep.label, color: otherColor })
        }
      }
    }

    setGeneratingEpreuveId(epreuveId)
    try {
      const res = await fetch('/api/generate-bilan-math-epreuve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bilanType: grille.id,
          mode: draft.mode,
          patient: draft.patient,
          epreuve: {
            domaineLabel,
            epreuveLabel: epreuveDef.label,
            parentColor,
            sousEpreuves,
            direct: isMono ? state.direct : undefined,
            notes: state.notes,
          },
          contexteBilan,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(data?.error || 'Erreur lors de la génération.')
        return
      }
      const text = typeof data?.text === 'string' ? data.text : ''
      if (!text) {
        toast.error('Réponse IA vide.')
        return
      }
      handleEpreuveChange(epreuveId, { ...state, iaText: text })
      toast.success(`"${epreuveDef.label}" généré.`)
    } catch (e: any) {
      toast.error(e?.message || 'Erreur réseau.')
    } finally {
      setGeneratingEpreuveId(null)
    }
  }

  /** Compte des épreuves au moins partiellement renseignées. */
  const completionCount = useMemo(() => {
    let renseignees = 0
    let total = 0
    for (const domaine of grille.domaines) {
      for (const epreuve of domaine.epreuves) {
        total += 1
        const state = draft.epreuves[epreuve.id]
        if (!state) continue
        const hasSubScore = Object.values(state.sousEpreuves ?? {}).some(
          (s) => s && s !== 'gris',
        )
        const hasDirect = state.direct && state.direct !== 'gris'
        const hasNotes = state.notes && state.notes.trim().length > 0
        if (hasSubScore || hasDirect || hasNotes) renseignees += 1
      }
    }
    return { renseignees, total }
  }, [grille.domaines, draft.epreuves])

  const handleReset = () => {
    if (!confirm('Effacer toute la saisie de ce bilan ? Cette action est irréversible.')) return
    setDraft(makeEmptyDraft(grille))
    setGeneratedCRBO(null)
  }

  /**
   * Assemble le payload `domaines/epreuves` au format attendu par l'API et
   * lance la génération du CRBO complet. Le résultat est affiché dans une
   * section éditable plus bas, sans sauvegarder en base (l'ortho confirme
   * explicitement via "Sauvegarder en historique").
   */
  const handleGenerateCRBO = async () => {
    if (!draft.patient.prenom.trim() || !draft.patient.nom.trim()) {
      toast.error('Renseigne au moins le prénom et le nom du patient avant de générer.')
      return
    }
    if (completionCount.renseignees < 3) {
      const ok = confirm(
        `Seulement ${completionCount.renseignees} épreuve(s) renseignée(s). Le CRBO sera très court et peu informatif. Continuer quand même ?`,
      )
      if (!ok) return
    }

    // Construction du payload : pour chaque domaine on inclut les épreuves
    // qui ont au moins une cotation ou des notes (pas les épreuves vierges).
    const domainesPayload = grille.domaines.map((dom) => {
      const epreuves = dom.epreuves
        .map((ep) => {
          const state = draft.epreuves[ep.id]
          if (!state) return null
          const isMono = ep.sousEpreuves.length === 0
          const sousEpreuves = isMono
            ? []
            : ep.sousEpreuves.map((se) => ({
                label: se.label,
                color: (state.sousEpreuves[se.id] ?? 'gris') as PastilleEtat,
              }))
          const parentColor: PastilleEtat = isMono
            ? (state.direct ?? 'gris')
            : computeParentColor(sousEpreuves.map((s) => s.color))
          // Skip si totalement vierge (pas de cotation, pas de note, pas de iaText)
          const hasAny =
            parentColor !== 'gris' ||
            (state.notes && state.notes.trim().length > 0) ||
            (state.iaText && state.iaText.trim().length > 0)
          if (!hasAny) return null
          return {
            epreuveLabel: ep.label,
            parentColor,
            sousEpreuves,
            direct: isMono ? state.direct : undefined,
            notes: state.notes ?? '',
            iaText: state.iaText ?? '',
          }
        })
        .filter((e): e is NonNullable<typeof e> => e !== null)
      return { domaineLabel: dom.label, epreuves }
    })

    setIsGeneratingCRBO(true)
    try {
      const res = await fetch('/api/generate-bilan-math', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bilanType: grille.id,
          mode: draft.mode,
          patient: draft.patient,
          domaines: domainesPayload,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(data?.error || 'Erreur lors de la génération du CRBO.')
        return
      }
      const text = typeof data?.text === 'string' ? data.text : ''
      if (!text) {
        toast.error('Réponse IA vide.')
        return
      }
      setGeneratedCRBO(text)
      toast.success('CRBO généré — relis et sauvegarde quand tu es prête.')
      // Scroll smooth vers la section CRBO (qui apparaît en bas de page)
      setTimeout(() => {
        document.getElementById('crbo-preview')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 100)
    } catch (e: any) {
      toast.error(e?.message || 'Erreur réseau.')
    } finally {
      setIsGeneratingCRBO(false)
    }
  }

  /** Sauvegarde le CRBO en base + redirection vers /dashboard/historique/[id]. */
  const handleSaveCRBO = async () => {
    if (!generatedCRBO) return
    setIsSaving(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error('Session expirée — reconnecte-toi.')
        return
      }

      const { data: saved, error } = await supabase
        .from('crbos')
        .insert({
          user_id: user.id,
          patient_prenom: draft.patient.prenom.trim(),
          patient_nom: draft.patient.nom.trim(),
          patient_ddn: draft.patient.date_naissance || null,
          patient_classe: draft.patient.classe.trim() || null,
          bilan_date: new Date().toISOString().slice(0, 10),
          bilan_type: draft.mode,
          bilan_subtype: grille.id,
          test_utilise: grille.label,
          resultats: JSON.stringify({
            grilleId: grille.id,
            mode: draft.mode,
            epreuves: draft.epreuves,
          }),
          crbo_genere: generatedCRBO,
          statut: 'a_relire',
        })
        .select('id')
        .single()

      if (error || !saved?.id) {
        toast.error(error?.message || "L'enregistrement a échoué.")
        return
      }

      toast.success('CRBO sauvegardé.')
      // Nettoie le draft localStorage (il est maintenant en base, plus de risque
      // de perte ; on évite la confusion d'avoir un draft fantôme au retour).
      try { localStorage.removeItem(draftKey) } catch {}
      router.push(`/dashboard/historique/${saved.id}`)
    } catch (e: any) {
      toast.error(e?.message || 'Erreur lors de la sauvegarde.')
    } finally {
      setIsSaving(false)
    }
  }

  /** Téléchargement .txt local sans Word — Word arrivera en Phase 4 avec
   *  un export structuré (markdown → .docx via la lib docx du projet). */
  const handleDownloadCRBO = () => {
    if (!generatedCRBO) return
    const filename = `CRBO-${grille.label}-${draft.patient.prenom || 'patient'}-${draft.patient.nom || ''}-${new Date().toISOString().slice(0, 10)}.txt`
      .replace(/[^a-zA-Z0-9.-]/g, '_')
    const blob = new Blob([generatedCRBO], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div style={{ maxWidth: 920, margin: '0 auto', paddingBottom: 80 }}>
      {/* En-tête bilan */}
      <header style={{ marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: 'var(--fg-1)' }}>
          {grille.label} <span style={{ fontWeight: 400, color: 'var(--fg-3)' }}>— Bilan de cognition mathématique</span>
        </h1>
        <p style={{ margin: '6px 0 0', fontSize: 14, color: 'var(--fg-3)', lineHeight: 1.5 }}>
          {grille.description}
        </p>
      </header>

      {/* Coordonnées patient */}
      <section
        style={{
          marginBottom: 20,
          padding: 16,
          background: 'var(--bg-surface-1)',
          border: '1px solid var(--border-ds)',
          borderRadius: 12,
        }}
      >
        <h2 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 700, color: 'var(--fg-2)' }}>
          Patient
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10 }}>
          <FormField
            label="Prénom"
            value={draft.patient.prenom}
            onChange={(v) => setDraft((d) => ({ ...d, patient: { ...d.patient, prenom: v }, updatedAt: Date.now() }))}
          />
          <FormField
            label="Nom"
            value={draft.patient.nom}
            onChange={(v) => setDraft((d) => ({ ...d, patient: { ...d.patient, nom: v }, updatedAt: Date.now() }))}
          />
          <FormField
            label="Date de naissance"
            type="date"
            value={draft.patient.date_naissance}
            onChange={(v) => setDraft((d) => ({ ...d, patient: { ...d.patient, date_naissance: v }, updatedAt: Date.now() }))}
          />
          <FormField
            label="Classe / niveau"
            placeholder="ex: 6ème, CM1"
            value={draft.patient.classe}
            onChange={(v) => setDraft((d) => ({ ...d, patient: { ...d.patient, classe: v }, updatedAt: Date.now() }))}
          />
        </div>
      </section>

      {/* Toggle initial / renouvellement */}
      <section
        style={{
          marginBottom: 20,
          padding: 16,
          background: 'var(--bg-surface-1)',
          border: '1px solid var(--border-ds)',
          borderRadius: 12,
        }}
      >
        <h2 style={{ margin: '0 0 10px', fontSize: 14, fontWeight: 700, color: 'var(--fg-2)' }}>
          Type de bilan
        </h2>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {(['initial', 'renouvellement'] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setDraft((d) => ({ ...d, mode, updatedAt: Date.now() }))}
              style={{
                padding: '10px 18px',
                borderRadius: 10,
                border: draft.mode === mode ? '2px solid var(--ds-primary)' : '1px solid var(--border-ds)',
                background: draft.mode === mode ? 'var(--ds-primary-soft, #eef7ee)' : 'var(--bg-surface-2)',
                color: draft.mode === mode ? 'var(--ds-primary-hover, #166534)' : 'var(--fg-2)',
                fontSize: 14,
                fontWeight: draft.mode === mode ? 600 : 500,
                cursor: 'pointer',
                transition: 'all 140ms',
              }}
            >
              Bilan {mode === 'initial' ? 'initial' : 'de renouvellement'}
            </button>
          ))}
        </div>
      </section>

      <div style={{ marginBottom: 20 }}>
        <PastilleLegend />
      </div>

      {/* Grille des domaines / épreuves */}
      {grille.domaines.map((domaine) => (
        <DomaineSection
          key={domaine.id}
          domaine={domaine}
          epreuves={draft.epreuves}
          onEpreuveChange={handleEpreuveChange}
          onGenerateEpreuve={handleGenerateEpreuve}
          generatingEpreuveId={generatingEpreuveId}
        />
      ))}

      {/* Footer : avancement + actions */}
      <footer
        style={{
          marginTop: 32,
          padding: 16,
          background: 'var(--bg-surface-1)',
          border: '1px solid var(--border-ds)',
          borderRadius: 12,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          flexWrap: 'wrap',
        }}
      >
        <div style={{ fontSize: 13, color: 'var(--fg-2)' }}>
          <strong style={{ color: 'var(--fg-1)' }}>{completionCount.renseignees}</strong>
          {' / '}
          {completionCount.total} épreuves renseignées
          <span style={{ marginLeft: 12, fontSize: 11, color: 'var(--fg-3)' }}>
            Saisie auto-sauvegardée localement
          </span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            type="button"
            onClick={handleReset}
            style={{
              padding: '8px 14px',
              borderRadius: 8,
              border: '1px solid var(--border-ds)',
              background: 'var(--bg-surface-2)',
              color: 'var(--fg-2)',
              fontSize: 13,
              cursor: 'pointer',
            }}
          >
            Réinitialiser
          </button>
          <button
            type="button"
            onClick={handleGenerateCRBO}
            disabled={isGeneratingCRBO}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 16px',
              borderRadius: 8,
              border: 0,
              background: 'var(--ds-primary)',
              color: 'var(--fg-on-brand)',
              fontSize: 13,
              fontWeight: 600,
              cursor: isGeneratingCRBO ? 'not-allowed' : 'pointer',
              opacity: isGeneratingCRBO ? 0.7 : 1,
            }}
          >
            {isGeneratingCRBO ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
            {isGeneratingCRBO ? 'Génération du CRBO…' : 'Générer le CRBO'}
          </button>
        </div>
      </footer>

      {/* Section CRBO généré (visible uniquement après génération) */}
      {generatedCRBO !== null && (
        <section
          id="crbo-preview"
          style={{
            marginTop: 24,
            padding: 20,
            background: 'var(--ds-primary-soft, #f0f9f4)',
            border: '2px solid var(--ds-primary, #16a34a)',
            borderRadius: 16,
          }}
        >
          <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--fg-1)' }}>
              CRBO généré — relecture et édition
            </h2>
            <button
              type="button"
              onClick={() => setGeneratedCRBO(null)}
              aria-label="Fermer la prévisualisation"
              title="Fermer (le brouillon est conservé dans le formulaire)"
              style={{
                background: 'transparent', border: 0, padding: 6,
                color: 'var(--fg-3)', cursor: 'pointer',
                display: 'grid', placeItems: 'center', borderRadius: 8,
              }}
            >
              <X size={18} />
            </button>
          </header>
          <p style={{ margin: '0 0 12px', fontSize: 13, color: 'var(--fg-3)', lineHeight: 1.5 }}>
            Tu peux modifier le texte ci-dessous avant de sauvegarder. Le format est markdown :
            les <code>**titres**</code> seront rendus en gras dans l&apos;historique.
          </p>
          <textarea
            value={generatedCRBO}
            onChange={(e) => setGeneratedCRBO(e.target.value)}
            rows={24}
            style={{
              width: '100%',
              padding: '14px 16px',
              border: '1px solid var(--border-ds)',
              borderRadius: 10,
              fontSize: 14,
              lineHeight: 1.6,
              fontFamily: 'inherit',
              background: 'var(--bg-surface-1)',
              color: 'var(--fg-1)',
              resize: 'vertical',
              minHeight: 400,
            }}
          />
          <div style={{ marginTop: 14, display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={handleDownloadCRBO}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '8px 14px', borderRadius: 8,
                border: '1px solid var(--border-ds)',
                background: 'var(--bg-surface-2)',
                color: 'var(--fg-2)',
                fontSize: 13, fontWeight: 500, cursor: 'pointer',
              }}
            >
              <Download size={14} />
              Télécharger en .txt
            </button>
            <button
              type="button"
              onClick={handleSaveCRBO}
              disabled={isSaving}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '8px 18px', borderRadius: 8, border: 0,
                background: 'var(--ds-primary)',
                color: 'var(--fg-on-brand)',
                fontSize: 13, fontWeight: 600,
                cursor: isSaving ? 'not-allowed' : 'pointer',
                opacity: isSaving ? 0.7 : 1,
              }}
            >
              {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              {isSaving ? 'Sauvegarde…' : 'Sauvegarder en historique'}
            </button>
          </div>
        </section>
      )}
    </div>
  )
}

function FormField({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  type?: string
  placeholder?: string
}) {
  return (
    <div>
      <label
        style={{
          display: 'block',
          fontSize: 11,
          fontWeight: 600,
          color: 'var(--fg-3)',
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
          marginBottom: 4,
        }}
      >
        {label}
      </label>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: '100%',
          padding: '8px 10px',
          border: '1px solid var(--border-ds)',
          borderRadius: 8,
          fontSize: 14,
          fontFamily: 'inherit',
          background: 'var(--bg-surface-2)',
          color: 'var(--fg-1)',
        }}
      />
    </div>
  )
}
