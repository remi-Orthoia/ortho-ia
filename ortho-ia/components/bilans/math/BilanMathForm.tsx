'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Sparkles, Download, Save, X, MessageSquare } from 'lucide-react'
import MatriceSection from './MatriceSection'
import PastilleLegend from './PastilleLegend'
import Pastille from './Pastille'
import { useToast } from '@/components/Toast'
import { createClient } from '@/lib/supabase'
import {
  epreuveColorFromState,
  countCotees,
  listCotees,
  sousEpreuveColorFromState,
} from '@/lib/bilans/math/parent-color'
import type {
  GrilleBilan,
  BilanMathDraft,
  EpreuveState,
  PastilleEtat,
} from '@/lib/bilans/math/types'

/**
 * Formulaire complet d'un bilan B-CM / B-CMado en mode MATRICE 2D.
 *
 * Layout :
 *   1. En-tête patient + mode (initial / renouvellement)
 *   2. Pour chaque SECTION de la grille : un tableau matrice
 *      (lignes = niveaux, colonnes = sous-épreuves groupées par épreuve macro)
 *   3. Pour chaque épreuve cotée (au moins 1 cellule) : un bloc compact avec
 *      notes brutes + bouton "Générer avec l'IA" + texte IA éditable
 *   4. Bouton "Générer le CRBO" + preview du CRBO complet
 *
 * Persistance localStorage par grille.id avec debounce 400ms.
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
  const [generatedCRBO, setGeneratedCRBO] = useState<string | null>(null)
  const [isGeneratingCRBO, setIsGeneratingCRBO] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // ===== Hydratation localStorage =====
  // La structure ayant changé (sousEpreuves → cells), les anciens drafts ne
  // se rechargent pas dans le nouveau format. On vérifie la présence de `cells`
  // pour distinguer un draft compatible d'un draft legacy.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(draftKey)
      if (raw) {
        const parsed = JSON.parse(raw) as BilanMathDraft
        if (parsed && parsed.type === grille.id && parsed.epreuves) {
          // Vérifie que les épreuves utilisent le nouveau format `cells`.
          // Si oui, on hydrate ; sinon on repart à vide (le draft legacy
          // serait incompatible avec la matrice).
          const epreuvesNouveau: Record<string, EpreuveState> = {}
          for (const [epreuveId, state] of Object.entries(parsed.epreuves)) {
            if (state && typeof state === 'object' && 'cells' in state) {
              epreuvesNouveau[epreuveId] = state as EpreuveState
            }
          }
          setDraft({ ...parsed, epreuves: epreuvesNouveau })
        }
      }
    } catch {
      // localStorage corrompu : on ignore et on garde le draft vide.
    }
    setHydrated(true)
  }, [draftKey, grille.id])

  // Persiste à chaque changement (debounce 400ms).
  useEffect(() => {
    if (!hydrated) return
    const handle = setTimeout(() => {
      try {
        localStorage.setItem(draftKey, JSON.stringify(draft))
      } catch {
        // Quota dépassé / navigation privée : pas de fallback.
      }
    }, 400)
    return () => clearTimeout(handle)
  }, [draft, draftKey, hydrated])

  // ===== Mutateurs =====
  const handleEpreuveChange = (epreuveId: string, next: EpreuveState) => {
    setDraft((prev) => ({
      ...prev,
      epreuves: { ...prev.epreuves, [epreuveId]: next },
      updatedAt: Date.now(),
    }))
  }

  const handleNotesChange = (epreuveId: string, notes: string) => {
    const current = draft.epreuves[epreuveId] ?? { cells: {}, notes: '' }
    handleEpreuveChange(epreuveId, { ...current, notes })
  }

  const handleIaTextChange = (epreuveId: string, iaText: string) => {
    const current = draft.epreuves[epreuveId] ?? { cells: {}, notes: '' }
    handleEpreuveChange(epreuveId, { ...current, iaText })
  }

  // ===== Génération IA par épreuve =====
  const handleGenerateEpreuve = async (
    epreuveId: string,
    sectionLabel: string,
    epreuveLabel: string,
  ) => {
    const epreuveDef = grille.sections
      .flatMap((s) => s.epreuves)
      .find((e) => e.id === epreuveId)
    if (!epreuveDef) {
      toast.error('Épreuve introuvable dans la grille.')
      return
    }

    const state = draft.epreuves[epreuveId] ?? { cells: {}, notes: '' }

    // Récupère les critères cotés (label + couleur). Map des niveaux pour
    // associer un critère à son niveau (utile pour le prompt IA).
    const niveauLabelById = new Map<string, string>()
    for (const s of grille.sections) {
      for (const n of s.niveaux) {
        niveauLabelById.set(n.id, n.subLabel ? `${n.label} (${n.subLabel})` : n.label)
      }
    }
    const cotees = listCotees(epreuveDef, state)
    const cellules = cotees.map((c) => {
      // Un critère peut couvrir plusieurs niveaux (rowspan). On affiche la
      // plage en concaténant les labels des niveaux concernés.
      const niveauxLabels = c.criterion.niveauIds.map(
        (nid) => niveauLabelById.get(nid) ?? nid,
      )
      return {
        niveau: niveauxLabels.join(' → ') || '—',
        test: c.sousEpreuve.label,
        critere: c.criterion.label,
        color: c.color,
      }
    })

    const parentColor = epreuveColorFromState(epreuveDef, state)

    // Contexte : autres épreuves cotées (couleur agrégée).
    const contexteBilan: Array<{ domaineLabel: string; epreuveLabel: string; color: PastilleEtat }> = []
    for (const section of grille.sections) {
      for (const ep of section.epreuves) {
        if (ep.id === epreuveId) continue
        const otherState = draft.epreuves[ep.id]
        if (!otherState) continue
        const otherColor = epreuveColorFromState(ep, otherState)
        if (otherColor !== 'gris') {
          contexteBilan.push({ domaineLabel: section.label, epreuveLabel: ep.label, color: otherColor })
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
            domaineLabel: sectionLabel,
            epreuveLabel,
            parentColor,
            // Nouveau format : liste de cellules (niveau + test + critère + couleur).
            cellules,
            // Compat legacy : couleur agrégée par sous-épreuve, attendue par
            // l'ancienne route serveur.
            sousEpreuves: epreuveDef.sousEpreuves.map((se) => ({
              label: se.label,
              color: sousEpreuveColorFromState(se, state),
            })),
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
      handleIaTextChange(epreuveId, text)
      toast.success(`"${epreuveLabel}" généré.`)
    } catch (e: any) {
      toast.error(e?.message || 'Erreur réseau.')
    } finally {
      setGeneratingEpreuveId(null)
    }
  }

  // ===== Compte d'avancement =====
  const completionCount = useMemo(() => {
    let renseignees = 0
    let total = 0
    for (const section of grille.sections) {
      for (const epreuve of section.epreuves) {
        total += 1
        const state = draft.epreuves[epreuve.id]
        if (!state) continue
        if (countCotees(epreuve, state) > 0) renseignees += 1
        else if (state.notes && state.notes.trim().length > 0) renseignees += 1
      }
    }
    return { renseignees, total }
  }, [grille.sections, draft.epreuves])

  const handleReset = () => {
    if (!confirm('Effacer toute la saisie de ce bilan ? Cette action est irréversible.')) return
    setDraft(makeEmptyDraft(grille))
    setGeneratedCRBO(null)
  }

  // ===== Génération CRBO complet =====
  const handleGenerateCRBO = async () => {
    if (!draft.patient.prenom.trim() || !draft.patient.nom.trim()) {
      toast.error('Renseigne au moins le prénom et le nom du patient.')
      return
    }
    if (completionCount.renseignees < 3) {
      const ok = confirm(
        `Seulement ${completionCount.renseignees} épreuve(s) renseignée(s). Le CRBO sera très court. Continuer ?`,
      )
      if (!ok) return
    }

    // Payload : pour chaque section, liste des épreuves cotées avec leurs cellules.
    const domainesPayload = grille.sections.map((section) => {
      const epreuves = section.epreuves
        .map((ep) => {
          const state = draft.epreuves[ep.id]
          if (!state) return null
          const parentColor = epreuveColorFromState(ep, state)
          const hasAny =
            parentColor !== 'gris' ||
            (state.notes && state.notes.trim().length > 0) ||
            (state.iaText && state.iaText.trim().length > 0)
          if (!hasAny) return null
          const sousEpreuves = ep.sousEpreuves.map((se) => ({
            label: se.label,
            color: sousEpreuveColorFromState(se, state),
          }))
          return {
            epreuveLabel: ep.label,
            parentColor,
            sousEpreuves,
            notes: state.notes ?? '',
            iaText: state.iaText ?? '',
          }
        })
        .filter((e): e is NonNullable<typeof e> => e !== null)
      return { domaineLabel: section.label, epreuves }
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
        toast.error(data?.error || 'Erreur lors de la génération.')
        return
      }
      const text = typeof data?.text === 'string' ? data.text : ''
      if (!text) {
        toast.error('Réponse IA vide.')
        return
      }
      setGeneratedCRBO(text)
      toast.success('CRBO généré — relis et sauvegarde quand tu es prête.')
      setTimeout(() => {
        document.getElementById('crbo-preview')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 100)
    } catch (e: any) {
      toast.error(e?.message || 'Erreur réseau.')
    } finally {
      setIsGeneratingCRBO(false)
    }
  }

  // ===== Sauvegarde Supabase + redirection =====
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
      try { localStorage.removeItem(draftKey) } catch {}
      router.push(`/dashboard/historique/${saved.id}`)
    } catch (e: any) {
      toast.error(e?.message || 'Erreur lors de la sauvegarde.')
    } finally {
      setIsSaving(false)
    }
  }

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

  // ===== Liste des épreuves cotées (pour la section notes/IA en dessous) =====
  const epreuvesCotees = useMemo(() => {
    const out: Array<{ sectionLabel: string; epreuveId: string; epreuveLabel: string; color: PastilleEtat }> = []
    for (const section of grille.sections) {
      for (const ep of section.epreuves) {
        const state = draft.epreuves[ep.id]
        if (!state) continue
        const color = epreuveColorFromState(ep, state)
        const hasNotes = state.notes && state.notes.trim().length > 0
        const hasIa = state.iaText && state.iaText.trim().length > 0
        if (color === 'gris' && !hasNotes && !hasIa) continue
        out.push({ sectionLabel: section.label, epreuveId: ep.id, epreuveLabel: ep.label, color })
      }
    }
    return out
  }, [grille.sections, draft.epreuves])

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', paddingBottom: 80 }}>
      {/* En-tête bilan */}
      <header style={{ marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: 'var(--fg-1)' }}>
          {grille.label} <span style={{ fontWeight: 400, color: 'var(--fg-3)' }}>— Bilan de cognition mathématique</span>
        </h1>
        <p style={{ margin: '6px 0 0', fontSize: 14, color: 'var(--fg-3)', lineHeight: 1.5 }}>
          {grille.description}
        </p>
      </header>

      {/* Patient */}
      <section
        style={{
          marginBottom: 16,
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
          <FormField label="Prénom" value={draft.patient.prenom} onChange={(v) => setDraft((d) => ({ ...d, patient: { ...d.patient, prenom: v }, updatedAt: Date.now() }))} />
          <FormField label="Nom" value={draft.patient.nom} onChange={(v) => setDraft((d) => ({ ...d, patient: { ...d.patient, nom: v }, updatedAt: Date.now() }))} />
          <FormField label="Date de naissance" type="date" value={draft.patient.date_naissance} onChange={(v) => setDraft((d) => ({ ...d, patient: { ...d.patient, date_naissance: v }, updatedAt: Date.now() }))} />
          <FormField label="Classe / niveau" placeholder="ex: 6ème, CM1" value={draft.patient.classe} onChange={(v) => setDraft((d) => ({ ...d, patient: { ...d.patient, classe: v }, updatedAt: Date.now() }))} />
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
              }}
            >
              Bilan {mode === 'initial' ? 'initial' : 'de renouvellement'}
            </button>
          ))}
        </div>
      </section>

      <div style={{ marginBottom: 16 }}>
        <PastilleLegend />
      </div>

      {/* Matrices — une par section */}
      {grille.sections.map((section) => (
        <MatriceSection
          key={section.id}
          section={section}
          epreuves={draft.epreuves}
          interactive
          onCellChange={handleEpreuveChange}
        />
      ))}

      {/* Notes & IA par épreuve cotée */}
      {epreuvesCotees.length > 0 && (
        <section style={{ marginTop: 32 }}>
          <h2 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 700, color: 'var(--fg-2)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            <MessageSquare size={14} style={{ display: 'inline', marginRight: 6, verticalAlign: -2 }} />
            Notes &amp; analyse IA par épreuve
          </h2>
          <p style={{ margin: '0 0 16px', fontSize: 12, color: 'var(--fg-3)' }}>
            Les épreuves cotées apparaissent ici. Ajoute des notes libres et génère un paragraphe clinique pour chacune.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {epreuvesCotees.map((item) => (
              <EpreuveNotesCard
                key={item.epreuveId}
                epreuveId={item.epreuveId}
                epreuveLabel={item.epreuveLabel}
                sectionLabel={item.sectionLabel}
                color={item.color}
                state={draft.epreuves[item.epreuveId] ?? { cells: {}, notes: '' }}
                onNotesChange={(notes) => handleNotesChange(item.epreuveId, notes)}
                onIaTextChange={(t) => handleIaTextChange(item.epreuveId, t)}
                onGenerate={() => handleGenerateEpreuve(item.epreuveId, item.sectionLabel, item.epreuveLabel)}
                isGenerating={generatingEpreuveId === item.epreuveId}
              />
            ))}
          </div>
        </section>
      )}

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

      {/* Preview CRBO */}
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
              aria-label="Fermer"
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
            Modifie le texte ci-dessous avant de sauvegarder. Format markdown :
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

// ============================================================================
// Sous-composant : carte notes + IA d'une épreuve
// ============================================================================

function EpreuveNotesCard({
  epreuveId,
  epreuveLabel,
  sectionLabel,
  color,
  state,
  onNotesChange,
  onIaTextChange,
  onGenerate,
  isGenerating,
}: {
  epreuveId: string
  epreuveLabel: string
  sectionLabel: string
  color: PastilleEtat
  state: EpreuveState
  onNotesChange: (notes: string) => void
  onIaTextChange: (text: string) => void
  onGenerate: () => void
  isGenerating: boolean
}) {
  return (
    <div
      style={{
        background: 'var(--bg-surface-1)',
        border: '1px solid var(--border-ds)',
        borderRadius: 10,
        padding: '12px 14px',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <Pastille etat={color} readonly size={18} ariaPrefix={`${epreuveLabel} (couleur globale)`} />
        <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--fg-1)' }}>{epreuveLabel}</span>
        <span style={{ fontSize: 11, color: 'var(--fg-3)' }}>· {sectionLabel}</span>
      </div>

      <textarea
        value={state.notes}
        onChange={(e) => onNotesChange(e.target.value)}
        placeholder="Notes brutes — observations pendant la passation…"
        rows={2}
        style={{
          width: '100%',
          padding: '8px 10px',
          border: '1px solid var(--border-ds)',
          borderRadius: 8,
          fontSize: 13,
          fontFamily: 'inherit',
          background: 'var(--bg-surface-2)',
          color: 'var(--fg-1)',
          resize: 'vertical',
          minHeight: 50,
        }}
      />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={onGenerate}
          disabled={isGenerating}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '6px 12px',
            background: 'var(--ds-primary)',
            color: 'var(--fg-on-brand)',
            border: 0,
            borderRadius: 8,
            fontSize: 12,
            fontWeight: 600,
            cursor: isGenerating ? 'not-allowed' : 'pointer',
            opacity: isGenerating ? 0.7 : 1,
          }}
        >
          {isGenerating ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
          {isGenerating ? 'Génération…' : state.iaText ? 'Régénérer' : "Générer avec l'IA"}
        </button>
        {state.iaText && (
          <span style={{ fontSize: 11, color: 'var(--fg-3)', fontStyle: 'italic' }}>
            Texte modifiable — l&apos;ortho a le dernier mot.
          </span>
        )}
      </div>

      {state.iaText !== undefined && state.iaText !== '' && (
        <textarea
          value={state.iaText}
          onChange={(e) => onIaTextChange(e.target.value)}
          rows={4}
          style={{
            width: '100%',
            padding: '10px 12px',
            border: '1px solid var(--ds-primary, #16a34a)',
            borderRadius: 8,
            fontSize: 13,
            lineHeight: 1.5,
            fontFamily: 'inherit',
            background: 'var(--ds-primary-soft, #f0f9f4)',
            color: 'var(--fg-1)',
            resize: 'vertical',
            minHeight: 70,
          }}
        />
      )}
    </div>
  )
}

// ============================================================================
// Helpers
// ============================================================================

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
      <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--fg-3)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 4 }}>
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
