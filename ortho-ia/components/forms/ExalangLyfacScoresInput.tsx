'use client'

/**
 * Saisie structurée Exalang Lyfac (Thibault & Lenfant, HappyNeuron / Motus).
 *
 * Bilan pour lycéens et étudiants universitaires (15-25 ans), souvent dans
 * le cadre des aménagements aux examens (CDAPH, médecine universitaire).
 *
 * 4 grands domaines officiels :
 *   - Mémoire (Empan visuel, endroit, envers)
 *   - Langage élaboré (Flexibilité lexicale, Consignes orales, Inférences)
 *   - Lecture (Mots, Logatomes, Leximétrie, Compréhension texte, Repérage)
 *   - Orthographe (Texte à choix multiple, Complétion phrases, Synthèse)
 *
 * Scoring HappyNeuron percentile.
 *
 * Couplage : nouveau-crbo/page.tsx, test_utilise === ['Exalang Lyfac'].
 */

import { useEffect, useMemo, useRef, useState } from 'react'
import { Brain, BookOpen, ChevronDown, FileUp, GitCompare, Info, Loader2 } from 'lucide-react'
import MicButton from '../MicButton'
import type { CRBOStructure } from '@/lib/prompts'

interface Props {
  notes: string
  onNotesChange: (v: string) => void
  onResultatsChange: (normalized: string) => void
  onError?: (msg: string) => void
  /** MODE RENOUVELLEMENT — structure du bilan précédent extraite depuis le
   *  bouton d'import "bilan précédent" de l'étape 4 du wizard. */
  bilanPrecedentStructure?: CRBOStructure | null
  /** Date du bilan précédent (ISO yyyy-mm-dd). */
  bilanPrecedentDate?: string | null
}

type PercentileKey =
  | '' | 'p_sup_95' | 'p_90_95' | 'p_75_90' | 'p_50_75' | 'p_25_50' | 'p_10_25' | 'p_5_10' | 'p_inf_5'

// Grille 6 zones imposée Laurie (refonte 2026-05-ter).
// Exalang n'affiche JAMAIS de bande <P5 — la bande la plus basse est P1-P5.
//
// `value` = médiane numérique de la bande (utilisée pour le calcul live des
// deltas en mode renouvellement). Aligné sur les autres forms Exalang.
const PERCENTILE_OPTIONS: Array<{
  key: Exclude<PercentileKey, ''>
  label: string
  value: number
  zone: 'excellent' | 'moyenne_haute' | 'moyenne_basse' | 'fragilite' | 'difficulte' | 'difficulte_severe'
  chip: string
  text: string
}> = [
  { key: 'p_sup_95', label: '> P95',     value: 97, zone: 'excellent',         chip: 'bg-emerald-700', text: 'text-white' },
  { key: 'p_90_95',  label: 'P91 — P95', value: 92, zone: 'excellent',         chip: 'bg-emerald-600', text: 'text-white' },
  { key: 'p_75_90',  label: 'P76 — P90', value: 80, zone: 'excellent',         chip: 'bg-emerald-500', text: 'text-white' },
  { key: 'p_50_75',  label: 'P50 — P75', value: 60, zone: 'moyenne_haute',     chip: 'bg-emerald-300', text: 'text-emerald-900' },
  { key: 'p_25_50',  label: 'P26 — P49', value: 35, zone: 'moyenne_basse',     chip: 'bg-yellow-300',  text: 'text-yellow-900' },
  { key: 'p_10_25',  label: 'P11 — P25', value: 18, zone: 'fragilite',         chip: 'bg-orange-300',  text: 'text-orange-900' },
  { key: 'p_5_10',   label: 'P6 — P10',  value: 7,  zone: 'difficulte',        chip: 'bg-orange-500',  text: 'text-white' },
  { key: 'p_inf_5',  label: 'P1 — P5',   value: 3,  zone: 'difficulte_severe', chip: 'bg-red-600',     text: 'text-white' },
]

function percentileLabel(k: PercentileKey): string {
  return PERCENTILE_OPTIONS.find(o => o.key === k)?.label ?? ''
}
function zoneLabel(k: PercentileKey): string {
  const z = PERCENTILE_OPTIONS.find(o => o.key === k)?.zone
  switch (z) {
    case 'excellent': return 'Excellent'
    case 'moyenne_haute': return 'Moyenne haute'
    case 'moyenne_basse': return 'Moyenne basse'
    case 'fragilite': return 'Zone de fragilité'
    case 'difficulte': return 'Difficulté'
    case 'difficulte_severe': return 'Difficulté sévère'
    default: return ''
  }
}

interface Epreuve {
  key: string
  label: string
  hint?: string
}

interface Domaine {
  id: string
  label: string
  description: string
  epreuves: Epreuve[]
}

const DOMAINES: Domaine[] = [
  {
    id: 'memoire',
    label: 'Mémoire',
    description: 'Empan visuel + verbal (endroit + envers) — MdT.',
    epreuves: [
      { key: 'empan_visuel',  label: 'Empan visuel',  hint: 'MdT visuo-spatiale' },
      { key: 'empan_endroit', label: 'Empan endroit', hint: 'MdT verbale, boucle phonologique' },
      { key: 'empan_envers',  label: 'Empan envers',  hint: 'MdT verbale + manipulation, administrateur central' },
    ],
  },
  {
    id: 'langage_elabore',
    label: 'Langage élaboré',
    description: 'Flexibilité lexicale, consignes orales, inférences.',
    epreuves: [
      { key: 'flexibilite_lexicale', label: 'Flexibilité lexicale', hint: 'Variation lexicale, synonymes, paraphrase' },
      { key: 'consignes_orales',     label: 'Consignes orales',     hint: 'Compréhension consignes complexes (contexte examen)' },
      { key: 'inferences',           label: 'Inférences',           hint: 'Compréhension implicite / sous-entendu' },
    ],
  },
  {
    id: 'lecture',
    label: 'Lecture',
    description: 'Voies d\'identification + leximétrie (vitesse) + compréhension texte + repérage.',
    epreuves: [
      { key: 'lecture_mots',      label: 'Lecture de mots',      hint: 'Voie d\'adressage (lexique orthographique)' },
      { key: 'lecture_logatomes', label: 'Lecture de logatomes', hint: 'Voie d\'assemblage (phonologique)' },
      { key: 'leximetrie',        label: 'Leximétrie',           hint: '⚡ Vitesse de lecture (mots/min) — critère majeur aménagements examens' },
      { key: 'comp_texte',        label: 'Compréhension de texte', hint: 'Compréhension narrative / argumentative' },
      { key: 'reperage',          label: 'Repérage',             hint: 'Prise d\'informations rapide dans texte' },
    ],
  },
  {
    id: 'orthographe',
    label: 'Orthographe',
    description: 'Détection (CMM) + production (complétion) + synthèse globale.',
    epreuves: [
      { key: 'texte_choix_multiple', label: 'Texte à choix multiple',   hint: 'Détection d\'erreurs orthographiques en reconnaissance' },
      { key: 'completion_phrases',   label: 'Complétion de phrases',    hint: 'Production orthographique guidée' },
      { key: 'synthese_ortho',       label: 'Synthèse orthographique', hint: 'Score global composante orthographe' },
    ],
  },
]

const CONTEXTE_OPTIONS = [
  { key: '',                       label: '— contexte du bilan —' },
  { key: 'cdaph_examens',          label: 'Demande d\'aménagements aux examens (CDAPH)' },
  { key: 'medecine_universitaire', label: 'Médecine préventive universitaire' },
  { key: 'suivi_post_pec',         label: 'Suivi post-PEC enfance / réévaluation' },
  { key: 'plainte_etudiant',       label: 'Plainte spontanée de l\'étudiant' },
  { key: 'autre',                  label: 'Autre contexte' },
] as const

interface EpreuveState {
  percentile: PercentileKey
  score_brut: string
  temps: string
  vitesse_mots_min: string
  observation: string
  non_passee: boolean
}

interface State {
  contexte: typeof CONTEXTE_OPTIONS[number]['key']
  niveau_etudes: string
  epreuves: Record<string, EpreuveState>
}

function emptyState(): State {
  const ep: Record<string, EpreuveState> = {}
  for (const d of DOMAINES) for (const e of d.epreuves) {
    ep[e.key] = { percentile: '', score_brut: '', temps: '', vitesse_mots_min: '', observation: '', non_passee: false }
  }
  return { contexte: '', niveau_etudes: '', epreuves: ep }
}

export default function ExalangLyfacScoresInput({
  notes,
  onNotesChange,
  onResultatsChange,
  onError,
  bilanPrecedentStructure,
  bilanPrecedentDate,
}: Props) {
  const [state, setState] = useState<State>(emptyState)
  const [expanded, setExpanded] = useState<Record<string, boolean>>({ memoire: true, langage_elabore: false, lecture: true, orthographe: true })

  // Import PDF Exalang Lyfac — route /api/extract-exalang-lyfac-pdf.
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [importing, setImporting] = useState(false)
  const [importInfo, setImportInfo] = useState<string | null>(null)

  async function handleImportFile(file: File) {
    setImporting(true)
    setImportInfo(null)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/extract-exalang-lyfac-pdf', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok || !data?.success) {
        const msg = data?.error ?? 'Échec de l\'import PDF.'
        onError?.(msg)
        setImportInfo(`Erreur : ${msg}`)
        return
      }
      const ex = data.extracted as {
        contexte: string
        niveau_etudes: string
        epreuves: Array<{
          key: string
          percentile: string
          score_brut: string
          temps: string
          vitesse_mots_min: string
          observation: string
          non_passee: boolean
        }>
      }
      setState(prev => {
        const next: State = {
          contexte: (ex.contexte || prev.contexte) as State['contexte'],
          niveau_etudes: (ex.niveau_etudes || prev.niveau_etudes).toString(),
          epreuves: { ...prev.epreuves },
        }
        for (const item of ex.epreuves ?? []) {
          if (!next.epreuves[item.key]) continue
          const cur = next.epreuves[item.key]
          next.epreuves[item.key] = {
            percentile: (item.percentile as PercentileKey) || cur.percentile,
            score_brut: item.score_brut || cur.score_brut,
            temps: item.temps || cur.temps,
            vitesse_mots_min: item.vitesse_mots_min || cur.vitesse_mots_min,
            observation: item.observation || cur.observation,
            non_passee: !!item.non_passee,
          }
        }
        return next
      })
      const epreuvesImported = (ex.epreuves ?? []).length
      setImportInfo(
        `Import réussi : ${epreuvesImported} épreuve${epreuvesImported > 1 ? 's' : ''} pré-remplie${epreuvesImported > 1 ? 's' : ''}. Vérifiez et complétez si besoin.`,
      )
    } catch (err: any) {
      const msg = err?.message ?? 'Erreur réseau durant l\'import.'
      onError?.(msg)
      setImportInfo(`Erreur : ${msg}`)
    } finally {
      setImporting(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const totalSaisies = useMemo(() => {
    let n = 0
    for (const d of DOMAINES) for (const e of d.epreuves) {
      const st = state.epreuves[e.key]
      if (st.non_passee) continue
      if (st.percentile !== '') n++
    }
    return n
  }, [state.epreuves])

  const zoneCounts = useMemo(() => {
    const c = { excellent: 0, moyenne_haute: 0, moyenne_basse: 0, fragilite: 0, difficulte: 0, difficulte_severe: 0 }
    for (const d of DOMAINES) for (const e of d.epreuves) {
      const st = state.epreuves[e.key]
      if (st.non_passee) continue
      const z = PERCENTILE_OPTIONS.find(o => o.key === st.percentile)?.zone
      if (z) c[z]++
    }
    return c
  }, [state.epreuves])

  /**
   * Live preview deltas — mode renouvellement. Pattern aligné sur EVALEO.
   */
  const evolutionStats = useMemo(() => {
    const hasPrev = !!(bilanPrecedentStructure
      && bilanPrecedentStructure.domains
      && bilanPrecedentStructure.domains.length > 0)
    if (!hasPrev) return null

    const prevIndex = new Map<string, number>()
    for (const dPrev of bilanPrecedentStructure!.domains) {
      for (const e of dPrev.epreuves) {
        const pv = typeof e.percentile_value === 'number' ? e.percentile_value : null
        if (pv != null) prevIndex.set(e.nom.toLowerCase().trim(), pv)
      }
    }

    let progres = 0, stable = 0, regression = 0, nouvelles = 0
    const progresList: string[] = []
    const regressionList: string[] = []
    const nouvellesList: string[] = []

    for (const d of DOMAINES) {
      for (const e of d.epreuves) {
        const st = state.epreuves[e.key]
        if (st.non_passee || st.percentile === '') continue
        const currOpt = PERCENTILE_OPTIONS.find(o => o.key === st.percentile)
        if (!currOpt) continue
        const prevValue = prevIndex.get(e.label.toLowerCase().trim())
        if (prevValue == null) {
          nouvelles++
          nouvellesList.push(e.label)
          continue
        }
        const delta = currOpt.value - prevValue
        if (delta >= 10) { progres++; progresList.push(e.label) }
        else if (delta <= -10) { regression++; regressionList.push(e.label) }
        else { stable++ }
      }
    }

    const totalCompared = progres + stable + regression
    return {
      progres, stable, regression, nouvelles,
      progresList, regressionList, nouvellesList,
      totalCompared,
      verdict: (() => {
        if (progres > regression * 2 && progres >= 3) return 'progress' as const
        if (regression > progres && regression >= 2) return 'regression' as const
        return 'stable' as const
      })(),
    }
  }, [state.epreuves, bilanPrecedentStructure])

  useEffect(() => {
    if (totalSaisies === 0 && !state.contexte && !state.niveau_etudes.trim()) {
      onResultatsChange('')
      return
    }
    const lines: string[] = []
    lines.push('=== Exalang Lyfac — Examen du Langage écrit et de la Mémoire pour les jeunes adultes (Thibault & Lenfant) ===')
    if (state.contexte) lines.push(`Contexte du bilan : ${CONTEXTE_OPTIONS.find(o => o.key === state.contexte)?.label}`)
    if (state.niveau_etudes.trim()) lines.push(`Niveau d'études actuel : ${state.niveau_etudes.trim()}`)
    if (state.contexte || state.niveau_etudes.trim()) lines.push('')

    for (const d of DOMAINES) {
      let printed = false
      for (const e of d.epreuves) {
        const st = state.epreuves[e.key]
        if (st.non_passee) continue
        const has = st.percentile !== '' || st.observation.trim() || st.score_brut.trim() || st.temps.trim() || st.vitesse_mots_min.trim()
        if (!has) continue
        if (!printed) { lines.push(`--- ${d.label} ---`); printed = true }
        lines.push(`Épreuve : ${e.label}`)
        if (st.percentile !== '') lines.push(`  Percentile : ${percentileLabel(st.percentile)} — ${zoneLabel(st.percentile)}`)
        if (st.score_brut.trim()) lines.push(`  Score brut : ${st.score_brut.trim()}`)
        if (st.temps.trim()) lines.push(`  Temps : ${st.temps.trim()}`)
        if (st.vitesse_mots_min.trim()) lines.push(`  Vitesse de lecture : ${st.vitesse_mots_min.trim()} mots/min`)
        if (st.observation.trim()) lines.push(`  Observation : ${st.observation.trim()}`)
      }
      if (printed) lines.push('')
    }

    const tot = zoneCounts.excellent + zoneCounts.moyenne_haute + zoneCounts.moyenne_basse + zoneCounts.fragilite + zoneCounts.difficulte + zoneCounts.difficulte_severe
    if (tot > 0) {
      lines.push('--- Synthèse zones percentiles ---')
      lines.push(`Excellent (P76-100) : ${zoneCounts.excellent}`)
      lines.push(`Moyenne haute (P50-P75) : ${zoneCounts.moyenne_haute}`)
      lines.push(`Moyenne basse (P26-P49) : ${zoneCounts.moyenne_basse}`)
      lines.push(`Zone de fragilité (P11-P25) : ${zoneCounts.fragilite}`)
      lines.push(`Difficulté (P6-P10) : ${zoneCounts.difficulte}`)
      lines.push(`Difficulté sévère (P1-P5) : ${zoneCounts.difficulte_severe}`)
    }
    onResultatsChange(lines.join('\n'))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, totalSaisies, zoneCounts])

  const setField = (key: string, field: keyof EpreuveState, v: any) => {
    setState(s => ({ ...s, epreuves: { ...s.epreuves, [key]: { ...s.epreuves[key], [field]: v } } }))
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-2 p-3 rounded-lg border border-indigo-200 bg-indigo-50">
        <BookOpen size={18} className="text-indigo-600 shrink-0 mt-0.5" />
        <div className="text-sm">
          <p className="font-semibold text-indigo-900">Saisie structurée Exalang Lyfac — lycéens et étudiants (15-25 ans)</p>
          <p className="text-indigo-700 text-xs mt-0.5 leading-relaxed">
            Souvent utilisé pour les <strong>aménagements aux examens</strong> (CDAPH, médecine universitaire) ou la
            réévaluation chez les adultes anciennement dyslexiques. La <strong>leximétrie (vitesse de lecture)</strong> est
            le critère majeur. Q1 = P25 = NORMAL.
          </p>
        </div>
      </div>

      {/* Import PDF Exalang Lyfac. */}
      <div className="rounded-lg border border-sky-200 bg-sky-50/60 p-3">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="flex items-start gap-2 min-w-0">
            <FileUp size={18} className="text-sky-700 shrink-0 mt-0.5" />
            <div className="text-sm min-w-0">
              <p className="font-semibold text-sky-900">Importer un document Exalang Lyfac (optionnel)</p>
              <p className="text-sky-800 text-xs mt-0.5 leading-relaxed">
                Format accepté : <strong>PDF uniquement</strong> (rapport HappyNeuron Pro ou scan cahier).
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,application/pdf"
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) handleImportFile(f)
              }}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={importing}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded text-sm font-medium bg-sky-600 text-white hover:bg-sky-700 disabled:bg-sky-300 disabled:cursor-wait transition"
            >
              {importing ? <Loader2 size={14} className="animate-spin" /> : <FileUp size={14} />}
              {importing ? 'Extraction en cours…' : 'Choisir un fichier'}
            </button>
          </div>
        </div>
        {importInfo && (
          <p className={`mt-2 text-xs ${importInfo.startsWith('Erreur') ? 'text-red-700' : 'text-emerald-700'}`}>
            {importInfo}
          </p>
        )}
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-4 space-y-3">
        <p className="text-sm font-semibold text-gray-900 flex items-center gap-1.5">
          <Info size={14} className="text-indigo-600" />
          Contexte du bilan
        </p>
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Contexte</label>
            <select
              value={state.contexte}
              onChange={(e) => setState(s => ({ ...s, contexte: e.target.value as State['contexte'] }))}
              className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            >
              {CONTEXTE_OPTIONS.map(o => (<option key={o.key} value={o.key}>{o.label}</option>))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Niveau d&apos;études actuel</label>
            <input
              type="text"
              value={state.niveau_etudes}
              onChange={(e) => setState(s => ({ ...s, niveau_etudes: e.target.value }))}
              placeholder="ex. Seconde, Terminale, Licence 1 Droit, Master Biologie…"
              className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm"
            />
          </div>
        </div>
      </div>

      {bilanPrecedentStructure && bilanPrecedentStructure.domains && bilanPrecedentStructure.domains.length > 0 && (
        <div className="rounded border border-emerald-300 bg-emerald-50/70 p-2.5 flex items-start gap-2">
          <GitCompare size={16} className="text-emerald-700 shrink-0 mt-0.5" />
          <div className="text-[11px] text-emerald-900 leading-relaxed min-w-0">
            <p className="font-semibold">Bilan précédent importé et détecté</p>
            <p className="mt-0.5">
              {bilanPrecedentStructure.domains.length} domaine
              {bilanPrecedentStructure.domains.length > 1 ? 's' : ''} ·{' '}
              {bilanPrecedentStructure.domains.reduce((acc, d) => acc + d.epreuves.length, 0)} épreuves précédentes
              {bilanPrecedentDate ? ` · ${new Date(bilanPrecedentDate).toLocaleDateString('fr-FR')}` : ''}.
              L&apos;IA calculera les évolutions épreuve par épreuve et le rendu Word affichera un tableau comparatif avec flèches.
            </p>
          </div>
        </div>
      )}

      {evolutionStats && (evolutionStats.totalCompared > 0 || evolutionStats.nouvelles > 0) && (
        <div className="rounded-lg border border-teal-300 bg-gradient-to-br from-teal-50 to-emerald-50 p-3">
          <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
            <p className="text-xs font-semibold text-teal-900">Évolution prévue dans le CRBO — recalcul live</p>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
              evolutionStats.verdict === 'progress' ? 'bg-green-200 text-green-900'
                : evolutionStats.verdict === 'regression' ? 'bg-red-200 text-red-900'
                : 'bg-gray-200 text-gray-800'
            }`}>
              {evolutionStats.verdict === 'progress' ? '✓ Progression'
                : evolutionStats.verdict === 'regression' ? '↓ Régression'
                : '≈ Stable'}
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5 mb-2">
            {evolutionStats.progres > 0 && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-green-100 text-green-800 border border-green-300">
                <span className="font-bold">↑ {evolutionStats.progres}</span><span>progrès</span>
              </span>
            )}
            {evolutionStats.stable > 0 && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-gray-100 text-gray-700 border border-gray-300">
                <span className="font-bold">→ {evolutionStats.stable}</span><span>stable</span>
              </span>
            )}
            {evolutionStats.regression > 0 && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-red-100 text-red-800 border border-red-300">
                <span className="font-bold">↓ {evolutionStats.regression}</span><span>régression</span>
              </span>
            )}
            {evolutionStats.nouvelles > 0 && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-blue-100 text-blue-800 border border-blue-300">
                <span className="font-bold">✦ {evolutionStats.nouvelles}</span>
                <span>nouvelle{evolutionStats.nouvelles > 1 ? 's' : ''}</span>
              </span>
            )}
          </div>
          {evolutionStats.progresList.length > 0 && (
            <p className="text-[10px] text-green-900 leading-relaxed">
              <strong>Progrès :</strong> {evolutionStats.progresList.slice(0, 5).join(' · ')}
              {evolutionStats.progresList.length > 5 ? ` · +${evolutionStats.progresList.length - 5} autres` : ''}
            </p>
          )}
          {evolutionStats.regressionList.length > 0 && (
            <p className="text-[10px] text-red-900 leading-relaxed mt-0.5">
              <strong>Régressions :</strong> {evolutionStats.regressionList.slice(0, 5).join(' · ')}
              {evolutionStats.regressionList.length > 5 ? ` · +${evolutionStats.regressionList.length - 5} autres` : ''}
            </p>
          )}
        </div>
      )}

      {totalSaisies > 0 && (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
          <p className="text-xs font-semibold text-gray-700 mb-2">
            Répartition par zone — {totalSaisies}/{DOMAINES.reduce((acc, d) => acc + d.epreuves.length, 0)} épreuves saisies
          </p>
          <div className="flex flex-wrap gap-1.5">
            {(['excellent', 'moyenne_haute', 'moyenne_basse', 'fragilite', 'difficulte', 'difficulte_severe'] as const).map(z => {
              const n = zoneCounts[z]
              if (n === 0) return null
              const label = { excellent: 'Excellent', moyenne_haute: 'Moyenne haute', moyenne_basse: 'Moyenne basse', fragilite: 'Zone de fragilité', difficulte: 'Difficulté', difficulte_severe: 'Difficulté sévère' }[z]
              const chip = { excellent: 'bg-emerald-700 text-white', moyenne_haute: 'bg-emerald-400 text-white', moyenne_basse: 'bg-yellow-300 text-yellow-900', fragilite: 'bg-orange-300 text-orange-900', difficulte: 'bg-orange-500 text-white', difficulte_severe: 'bg-red-600 text-white' }[z]
              return (
                <span key={z} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${chip}`}>
                  <span className="font-bold">{n}</span>
                  <span>{label}</span>
                </span>
              )
            })}
          </div>
        </div>
      )}

      {DOMAINES.map(d => {
        const open = expanded[d.id]
        return (
          <div key={d.id} className="rounded-lg border border-gray-200 bg-white">
            <button
              type="button"
              onClick={() => setExpanded(prev => ({ ...prev, [d.id]: !prev[d.id] }))}
              className="w-full px-4 py-3 flex items-center justify-between gap-3 text-left hover:bg-gray-50"
            >
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-900">{d.label}</p>
                <p className="text-xs text-gray-500 mt-0.5">{d.description}</p>
              </div>
              <ChevronDown size={16} className={`shrink-0 transition-transform ${open ? '' : '-rotate-90'}`} />
            </button>

            {open && (
              <div className="border-t border-gray-100 px-4 py-3 space-y-2">
                {d.epreuves.map(e => {
                  const st = state.epreuves[e.key]
                  const isLeximetrie = e.key === 'leximetrie'
                  return (
                    <div key={e.key} className="rounded bg-gray-50/50 border border-gray-100 p-2">
                      <div className="flex items-start justify-between gap-2 flex-wrap mb-1.5">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-gray-800">{e.label}</p>
                          {e.hint && <p className="text-[10px] text-gray-500">{e.hint}</p>}
                        </div>
                        <label className="text-[10px] text-gray-600 flex items-center gap-1 shrink-0">
                          <input
                            type="checkbox"
                            checked={st.non_passee}
                            onChange={(ev) => setField(e.key, 'non_passee', ev.target.checked)}
                            className="rounded"
                          />
                          Non passée
                        </label>
                      </div>
                      {!st.non_passee && (
                        <>
                          <div className="flex flex-wrap gap-1 mb-1.5">
                            {PERCENTILE_OPTIONS.map(o => {
                              const active = st.percentile === o.key
                              return (
                                <button
                                  key={o.key}
                                  type="button"
                                  onClick={() => setField(e.key, 'percentile', active ? '' : o.key)}
                                  className={`px-2 py-1 rounded text-xs font-medium transition ${o.chip} ${o.text} ${active ? 'ring-2 ring-offset-1 ring-gray-700' : 'opacity-60 hover:opacity-100'}`}
                                >
                                  {o.label}
                                </button>
                              )
                            })}
                          </div>
                          <div className="grid sm:grid-cols-3 gap-1.5">
                            <input
                              type="text"
                              value={st.score_brut}
                              onChange={(ev) => setField(e.key, 'score_brut', ev.target.value)}
                              placeholder="Score brut (opt.)"
                              className="px-2 py-1 border border-gray-200 rounded text-[11px]"
                            />
                            <input
                              type="text"
                              value={st.temps}
                              onChange={(ev) => setField(e.key, 'temps', ev.target.value)}
                              placeholder="Temps (opt.)"
                              className="px-2 py-1 border border-gray-200 rounded text-[11px]"
                            />
                            {isLeximetrie && (
                              <input
                                type="text"
                                value={st.vitesse_mots_min}
                                onChange={(ev) => setField(e.key, 'vitesse_mots_min', ev.target.value)}
                                placeholder="⚡ Mots/min"
                                className="px-2 py-1 border border-amber-300 bg-amber-50 rounded text-[11px] font-semibold"
                              />
                            )}
                          </div>
                          <textarea
                            value={st.observation}
                            onChange={(ev) => setField(e.key, 'observation', ev.target.value)}
                            rows={1}
                            placeholder="Observation : stratégie, type d'erreurs, attitude…"
                            className="w-full mt-1.5 px-2 py-1 border border-gray-200 rounded text-[11px] leading-relaxed resize-y"
                          />
                        </>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}

      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <div className="flex items-center justify-between mb-1">
          <label className="text-sm font-medium text-gray-800">
            Notes globales (historique PEC, aménagements antérieurs, compensations mises en place)
          </label>
          <MicButton value={notes} onChange={onNotesChange} />
        </div>
        <textarea
          value={notes}
          onChange={(e) => onNotesChange(e.target.value)}
          rows={3}
          placeholder="Ex. dyslexie diagnostiquée en CE2, suivi orthophonique 6 ans (arrêt en 6e), tiers-temps obtenu au collège, utilise correcteur orthographique systématiquement, lecture lente reportée par l'étudiant…"
          className="w-full px-3 py-2 border border-gray-300 rounded text-sm leading-relaxed resize-y focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />
      </div>

      <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
        <div className="flex items-start gap-2">
          <Brain size={16} className="text-amber-700 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-900 leading-relaxed">
            <p className="font-semibold mb-1">Rappels cliniques Exalang Lyfac</p>
            <ul className="list-disc list-inside space-y-0.5">
              <li>La <strong>leximétrie (mots/min)</strong> est le critère majeur pour justifier les aménagements aux examens. &lt; 150 mots/min en lecture silencieuse = fort impact académique.</li>
              <li>Aménagements types CDAPH : tiers-temps 1/3, sujet agrandi, correcteur ortho autorisé, ordinateur, secrétaire-correcteur, dispense notation ortho en langues vivantes.</li>
              <li>Croiser <strong>au moins 3 épreuves convergentes</strong> pour confirmer un trouble persistant (lecture mots + logatomes + leximétrie pour dyslexie persistante).</li>
              <li>Ne PAS diagnostiquer un TDL chez l&apos;adulte sans antécédent d&apos;enfance (le TDL est par définition développemental).</li>
              <li>Suspicion <strong>TDAH</strong> (MdT déficitaire + plainte attentionnelle) → orienter vers neuropsy / psychiatre, ne pas poser le diagnostic.</li>
              <li>Préciser l&apos;<strong>historique</strong> (PEC enfance, aménagements antérieurs) — déterminant pour distinguer compensation vs trouble nouveau.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
