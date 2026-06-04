'use client'

/**
 * Saisie structurée Exalang 3-6 (Thibault, Helloin, Lenfant — HappyNeuron 2006).
 *
 * Population : maternelle (PS, MS, GS). Premier outil HappyNeuron pour le
 * langage oral, idéal pour les bilans de début de scolarisation et le dépistage
 * précoce du TDL.
 *
 * Scoring : percentile HappyNeuron (P5 / P10 / P25 / P50 / P75 / P90 / P95).
 * Étalonnage par niveau scolaire (PS / MS / GS).
 *
 * Domaines officiels : Langage oral réceptif, expressif, phonologie,
 * métaphonologie émergente, mémoire de travail verbale.
 *
 * Couplage : nouveau-crbo/page.tsx, test_utilise === ['Exalang 3-6'].
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
  tag?: string
}

interface Groupe {
  code: string
  label: string
  description: string
  epreuves: Epreuve[]
}

const GROUPES: Groupe[] = [
  {
    code: 'A.1',
    label: 'Langage oral — Réceptif',
    description: 'Lexique passif et compréhension des structures de phrases.',
    epreuves: [
      { key: 'designation_lexique',     label: 'Désignation (lexique réceptif)', hint: 'Stock lexical passif — sensible à la sous-exposition' },
      { key: 'comp_phrases_courtes',    label: 'Compréhension de phrases courtes', hint: 'Prédictrice de la compréhension écrite future' },
      { key: 'comp_morphosyntaxique',   label: 'Compréhension morphosyntaxique', hint: 'Marqueur TDL si déficit sévère' },
    ],
  },
  {
    code: 'A.2',
    label: 'Langage oral — Expressif',
    description: 'Dénomination, production syntaxique, répétition.',
    epreuves: [
      { key: 'denomination_lexique',    label: 'Dénomination (lexique expressif)', hint: 'Stock lexical actif. Décalage marqué désignation/dénomination = manque du mot' },
      { key: 'production_syntaxique',   label: 'Production syntaxique (phrases à partir d\'images)', hint: 'Pauvreté syntaxique = marqueur TDL' },
      { key: 'repetition_mots_phrases', label: 'Répétition de mots et phrases',  hint: 'Encodage phonologique + MdT' },
      { key: 'repetition_logatomes',    label: 'Répétition de logatomes',         hint: 'Marqueur le plus sensible des difficultés phonologiques futures — prédicteur dyslexie' },
    ],
  },
  {
    code: 'B.1',
    label: 'Métaphonologie émergente',
    description: 'Conscience phonologique émergente : rimes (acquises MS-GS), syllabes (acquises GS).',
    epreuves: [
      { key: 'meta_rimes',              label: 'Métaphonologie — rimes',          hint: 'Acquises en MS-GS (3.5-5.5 ans)', tag: 'MS-GS' },
      { key: 'meta_syllabes',           label: 'Métaphonologie — syllabes (segmentation, fusion)', hint: 'Acquises en GS. Absence GS = alerte langage écrit', tag: 'GS' },
      { key: 'conscience_ecrit',        label: 'Conscience de l\'écrit émergente', hint: 'Concept de lettre, mot, phrase, orientation' },
    ],
  },
  {
    code: 'C.1',
    label: 'Mémoire de travail verbale',
    description: 'Empan auditif endroit, boucle phonologique.',
    epreuves: [
      { key: 'empan_auditif_endroit',   label: 'Empan auditif endroit',           hint: 'Boucle phonologique, MdT verbale' },
    ],
  },
]

const NIVEAU_OPTIONS = [
  { key: '',   label: '— choisir —' },
  { key: 'PS', label: 'Petite Section (~3 ans)' },
  { key: 'MS', label: 'Moyenne Section (~4 ans)' },
  { key: 'GS', label: 'Grande Section (~5 ans)' },
] as const

interface EpreuveState {
  percentile: PercentileKey
  score_brut: string
  temps: string
  observation: string
  non_passee: boolean
}

interface State {
  niveau: typeof NIVEAU_OPTIONS[number]['key']
  epreuves: Record<string, EpreuveState>
}

function emptyState(): State {
  const ep: Record<string, EpreuveState> = {}
  for (const g of GROUPES) for (const e of g.epreuves) {
    ep[e.key] = { percentile: '', score_brut: '', temps: '', observation: '', non_passee: false }
  }
  return { niveau: '', epreuves: ep }
}

function PercentileChips({ value, onChange }: { value: PercentileKey; onChange: (v: PercentileKey) => void }) {
  return (
    <div className="flex flex-wrap gap-1">
      {PERCENTILE_OPTIONS.map(o => {
        const active = value === o.key
        return (
          <button
            key={o.key}
            type="button"
            onClick={() => onChange(active ? '' : o.key)}
            className={`px-2 py-1 rounded text-xs font-medium transition ${o.chip} ${o.text} ${active ? 'ring-2 ring-offset-1 ring-gray-700' : 'opacity-60 hover:opacity-100'}`}
          >
            {o.label}
          </button>
        )
      })}
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          className="px-2 py-1 rounded text-xs text-gray-500 hover:text-gray-900 underline decoration-dotted"
        >
          effacer
        </button>
      )}
    </div>
  )
}

export default function Exalang36ScoresInput({
  notes,
  onNotesChange,
  onResultatsChange,
  onError,
  bilanPrecedentStructure,
  bilanPrecedentDate,
}: Props) {
  const [state, setState] = useState<State>(emptyState)
  const [expanded, setExpanded] = useState<Record<string, boolean>>({ 'A.1': true, 'A.2': true, 'B.1': true, 'C.1': false })

  // Import PDF Exalang 3-6 — route /api/extract-exalang-3-6-pdf.
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [importing, setImporting] = useState(false)
  const [importInfo, setImportInfo] = useState<string | null>(null)

  async function handleImportFile(file: File) {
    setImporting(true)
    setImportInfo(null)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/extract-exalang-3-6-pdf', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok || !data?.success) {
        const msg = data?.error ?? 'Échec de l\'import PDF.'
        onError?.(msg)
        setImportInfo(`Erreur : ${msg}`)
        return
      }
      const ex = data.extracted as {
        niveau: string
        epreuves: Array<{
          key: string
          percentile: string
          score_brut: string
          temps: string
          observation: string
          non_passee: boolean
        }>
      }
      setState(prev => {
        const next: State = {
          niveau: (ex.niveau || prev.niveau) as State['niveau'],
          epreuves: { ...prev.epreuves },
        }
        for (const item of ex.epreuves ?? []) {
          if (!next.epreuves[item.key]) continue
          const cur = next.epreuves[item.key]
          next.epreuves[item.key] = {
            percentile: (item.percentile as PercentileKey) || cur.percentile,
            score_brut: item.score_brut || cur.score_brut,
            temps: item.temps || cur.temps,
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
    for (const g of GROUPES) for (const e of g.epreuves) {
      const st = state.epreuves[e.key]
      if (st.non_passee) continue
      if (st.percentile !== '') n++
    }
    return n
  }, [state.epreuves])

  const zoneCounts = useMemo(() => {
    const c = { excellent: 0, moyenne_haute: 0, moyenne_basse: 0, fragilite: 0, difficulte: 0, difficulte_severe: 0 }
    for (const g of GROUPES) for (const e of g.epreuves) {
      const st = state.epreuves[e.key]
      if (st.non_passee) continue
      const z = PERCENTILE_OPTIONS.find(o => o.key === st.percentile)?.zone
      if (z) c[z]++
    }
    return c
  }, [state.epreuves])

  /**
   * Live preview deltas — mode renouvellement. Pattern aligné sur EVALEO
   * (cf. Evaleo615ScoresInput.tsx:873-924). Matching par label, ±10.
   */
  const evolutionStats = useMemo(() => {
    const hasPrev = !!(bilanPrecedentStructure
      && bilanPrecedentStructure.domains
      && bilanPrecedentStructure.domains.length > 0)
    if (!hasPrev) return null

    const prevIndex = new Map<string, number>()
    for (const d of bilanPrecedentStructure!.domains) {
      for (const e of d.epreuves) {
        const pv = typeof e.percentile_value === 'number' ? e.percentile_value : null
        if (pv != null) prevIndex.set(e.nom.toLowerCase().trim(), pv)
      }
    }

    let progres = 0, stable = 0, regression = 0, nouvelles = 0
    const progresList: string[] = []
    const regressionList: string[] = []
    const nouvellesList: string[] = []

    for (const g of GROUPES) {
      for (const e of g.epreuves) {
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
    if (totalSaisies === 0 && !state.niveau) {
      onResultatsChange('')
      return
    }
    const lines: string[] = []
    lines.push('=== Exalang 3-6 (Thibault, Helloin, Lenfant — HappyNeuron 2006) ===')
    if (state.niveau) {
      lines.push(`Niveau scolaire : ${NIVEAU_OPTIONS.find(o => o.key === state.niveau)?.label}`)
      lines.push('')
    }
    for (const g of GROUPES) {
      let printed = false
      for (const e of g.epreuves) {
        const st = state.epreuves[e.key]
        if (st.non_passee) continue
        const has = st.percentile !== '' || st.observation.trim() || st.score_brut.trim() || st.temps.trim()
        if (!has) continue
        if (!printed) { lines.push(`--- ${g.code} ${g.label} ---`); printed = true }
        const tag = e.tag ? ` (${e.tag})` : ''
        lines.push(`Épreuve : ${e.label}${tag}`)
        if (st.percentile !== '') lines.push(`  Percentile : ${percentileLabel(st.percentile)} — ${zoneLabel(st.percentile)}`)
        if (st.score_brut.trim()) lines.push(`  Score brut : ${st.score_brut.trim()}`)
        if (st.temps.trim()) lines.push(`  Temps : ${st.temps.trim()}`)
        if (st.observation.trim()) lines.push(`  Observation : ${st.observation.trim()}`)
      }
      if (printed) lines.push('')
    }
    const tot = zoneCounts.excellent + zoneCounts.moyenne_haute + zoneCounts.moyenne_basse + zoneCounts.fragilite + zoneCounts.difficulte + zoneCounts.difficulte_severe
    if (tot > 0) {
      lines.push('--- Synthèse zones ---')
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

  const totalEpreuves = GROUPES.reduce((acc, g) => acc + g.epreuves.length, 0)

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-2 p-3 rounded-lg border border-indigo-200 bg-indigo-50">
        <BookOpen size={18} className="text-indigo-600 shrink-0 mt-0.5" />
        <div className="text-sm">
          <p className="font-semibold text-indigo-900">Saisie structurée Exalang 3-6 — maternelle (PS / MS / GS)</p>
          <p className="text-indigo-700 text-xs mt-0.5 leading-relaxed">
            Reportez la zone HappyNeuron lue sur la feuille de résultats. Étalonnage par niveau (PS / MS / GS).
            Cochez « non passée » pour exclure une épreuve. Q1 = P25 = NORMAL, jamais déficitaire.
            <strong> Pas de diagnostic de dyslexie à cet âge</strong> — préférer « fragilité émergente » et réévaluation.
          </p>
        </div>
      </div>

      {/* Import PDF Exalang 3-6. */}
      <div className="rounded-lg border border-sky-200 bg-sky-50/60 p-3">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="flex items-start gap-2 min-w-0">
            <FileUp size={18} className="text-sky-700 shrink-0 mt-0.5" />
            <div className="text-sm min-w-0">
              <p className="font-semibold text-sky-900">Importer un document Exalang 3-6 (optionnel)</p>
              <p className="text-sky-800 text-xs mt-0.5 leading-relaxed">
                Format accepté : <strong>PDF uniquement</strong> (rapport HappyNeuron Pro ou scan cahier). Pour un Word, exportez-le en PDF d&apos;abord.
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

      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <label className="flex items-center gap-2 text-sm font-semibold text-gray-900 mb-2">
          <Info size={14} className="text-indigo-600" />
          Niveau scolaire au moment de la passation
        </label>
        <select
          value={state.niveau}
          onChange={(e) => setState(s => ({ ...s, niveau: e.target.value as State['niveau'] }))}
          className="w-full sm:w-64 px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
        >
          {NIVEAU_OPTIONS.map(o => (
            <option key={o.key} value={o.key}>{o.label}</option>
          ))}
        </select>
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
          {evolutionStats.nouvelles > evolutionStats.totalCompared && evolutionStats.totalCompared <= 2 && (
            <p className="text-[10px] text-amber-800 mt-1 leading-relaxed bg-amber-50 border border-amber-200 rounded px-1.5 py-0.5">
              ⚠ Peu d&apos;épreuves matchent ({evolutionStats.totalCompared} comparées vs {evolutionStats.nouvelles} nouvelles). Vérifiez les libellés du bilan précédent.
            </p>
          )}
          {evolutionStats.nouvelles > 0 && (
            <p className="text-[10px] text-gray-600 italic mt-1.5 leading-tight">
              ⓘ Si le bilan précédent vient d&apos;une autre batterie (Exalang 5-8 par ex. après passage en CP), l&apos;IA fera la comparaison sémantique côté CRBO généré — le tableau d&apos;évolution Word sera complet même si certaines épreuves apparaissent ici comme &laquo;&nbsp;nouvelles&nbsp;&raquo;.
            </p>
          )}
        </div>
      )}

      {totalSaisies > 0 && (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
          <p className="text-xs font-semibold text-gray-700 mb-2">
            Répartition par zone — {totalSaisies}/{totalEpreuves} épreuves saisies
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

      {GROUPES.map(g => {
        const open = expanded[g.code]
        return (
          <div key={g.code} className="rounded-lg border border-gray-200 bg-white">
            <button
              type="button"
              onClick={() => setExpanded(prev => ({ ...prev, [g.code]: !prev[g.code] }))}
              className="w-full px-4 py-3 flex items-center justify-between gap-3 text-left hover:bg-gray-50"
            >
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-900">
                  <span className="text-indigo-600 font-mono mr-2">{g.code}</span>
                  {g.label}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">{g.description}</p>
              </div>
              <ChevronDown size={16} className={`shrink-0 transition-transform ${open ? '' : '-rotate-90'}`} />
            </button>

            {open && (
              <div className="border-t border-gray-100 px-4 py-3 space-y-2">
                {g.epreuves.map(e => {
                  const st = state.epreuves[e.key]
                  return (
                    <div key={e.key} className="rounded bg-gray-50/50 border border-gray-100 p-2">
                      <div className="flex items-start justify-between gap-2 flex-wrap mb-1.5">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-gray-800 flex items-center gap-1.5">
                            {e.label}
                            {e.tag && (
                              <span className="text-[9px] font-medium text-gray-500 px-1 py-0.5 rounded bg-white border border-gray-200">
                                {e.tag}
                              </span>
                            )}
                          </p>
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
                          <PercentileChips value={st.percentile} onChange={(v) => setField(e.key, 'percentile', v)} />
                          <div className="grid sm:grid-cols-2 gap-1.5 mt-1.5">
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
            Notes globales sur la séance (comportement, communication non verbale, attention)
          </label>
          <MicButton value={notes} onChange={onNotesChange} />
        </div>
        <textarea
          value={notes}
          onChange={(e) => onNotesChange(e.target.value)}
          rows={3}
          placeholder="Ex. enfant intéressé par les images, pointage présent, peu de communication spontanée. Premiers mots tardifs signalés par les parents (> 24 mois)…"
          className="w-full px-3 py-2 border border-gray-300 rounded text-sm leading-relaxed resize-y focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />
      </div>

      <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
        <div className="flex items-start gap-2">
          <Brain size={16} className="text-amber-700 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-900 leading-relaxed">
            <p className="font-semibold mb-1">Rappels cliniques Exalang 3-6</p>
            <ul className="list-disc list-inside space-y-0.5">
              <li><strong>Pas de diagnostic de TDL définitif avant 5 ans</strong> — préférer « retard simple » avec réévaluation à 6 mois.</li>
              <li><strong>Bilan ORL impératif</strong> à cet âge (otites séro-muqueuses fréquentes).</li>
              <li>Multiples composantes Déficitaire + premiers mots tardifs (au-delà de 24 mois) + phrases tardives (au-delà de 36 mois) → orientation CRTLA.</li>
              <li>Langage oral déficitaire + interaction / pragmatique atteintes (pointage, attention conjointe) → orientation CRA ou pédopsychiatrie pour suspicion TSA.</li>
              <li>Répétition de logatomes très sensible — marqueur précoce de fragilité phonologique / dyslexie future.</li>
              <li>Coordination PMI, crèche, école maternelle, orthoptie systématique.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
