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

import { useEffect, useMemo, useState } from 'react'
import { Brain, BookOpen, ChevronDown, Info } from 'lucide-react'
import MicButton from '../MicButton'

interface Props {
  notes: string
  onNotesChange: (v: string) => void
  onResultatsChange: (normalized: string) => void
  onError?: (msg: string) => void
}

type PercentileKey =
  | '' | 'p_sup_95' | 'p_90_95' | 'p_75_90' | 'p_50_75' | 'p_25_50' | 'p_10_25' | 'p_5_10' | 'p_inf_5'

const PERCENTILE_OPTIONS: Array<{
  key: Exclude<PercentileKey, ''>
  label: string
  value: number
  zone: 'excellent' | 'moyenne_haute' | 'moyenne_basse' | 'fragilite' | 'difficulte' | 'difficulte_severe'
  chip: string
  text: string
}> = [
  { key: 'p_sup_95', label: '> P95',     value: 97, zone: 'excellent',         chip: 'bg-emerald-600', text: 'text-white' },
  { key: 'p_90_95',  label: 'P90 — P95', value: 92, zone: 'excellent',         chip: 'bg-emerald-500', text: 'text-white' },
  { key: 'p_75_90',  label: 'P75 — P90', value: 80, zone: 'moyenne_haute',     chip: 'bg-emerald-400', text: 'text-emerald-900' },
  { key: 'p_50_75',  label: 'P50 — P75', value: 60, zone: 'moyenne_haute',     chip: 'bg-emerald-300', text: 'text-emerald-900' },
  { key: 'p_25_50',  label: 'P25 — P50', value: 35, zone: 'moyenne_basse',     chip: 'bg-yellow-300',  text: 'text-yellow-900' },
  { key: 'p_10_25',  label: 'P10 — P25', value: 18, zone: 'fragilite',         chip: 'bg-orange-400',  text: 'text-white' },
  { key: 'p_5_10',   label: 'P5 — P10',  value: 7,  zone: 'difficulte',        chip: 'bg-red-500',     text: 'text-white' },
  { key: 'p_inf_5',  label: '< P5',      value: 3,  zone: 'difficulte_severe', chip: 'bg-red-700',     text: 'text-white' },
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
    case 'fragilite': return 'Fragilité'
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

export default function Exalang36ScoresInput({ notes, onNotesChange, onResultatsChange }: Props) {
  const [state, setState] = useState<State>(emptyState)
  const [expanded, setExpanded] = useState<Record<string, boolean>>({ 'A.1': true, 'A.2': true, 'B.1': true, 'C.1': false })

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
      lines.push(`Excellent : ${zoneCounts.excellent}`)
      lines.push(`Moyenne haute : ${zoneCounts.moyenne_haute}`)
      lines.push(`Moyenne basse : ${zoneCounts.moyenne_basse}`)
      lines.push(`Fragilité : ${zoneCounts.fragilite}`)
      lines.push(`Difficulté : ${zoneCounts.difficulte}`)
      lines.push(`Difficulté sévère : ${zoneCounts.difficulte_severe}`)
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

      {totalSaisies > 0 && (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
          <p className="text-xs font-semibold text-gray-700 mb-2">
            Répartition par zone — {totalSaisies}/{totalEpreuves} épreuves saisies
          </p>
          <div className="flex flex-wrap gap-1.5">
            {(['excellent', 'moyenne_haute', 'moyenne_basse', 'fragilite', 'difficulte', 'difficulte_severe'] as const).map(z => {
              const n = zoneCounts[z]
              if (n === 0) return null
              const label = { excellent: 'Excellent', moyenne_haute: 'Moyenne haute', moyenne_basse: 'Moyenne basse', fragilite: 'Fragilité', difficulte: 'Difficulté', difficulte_severe: 'Difficulté sévère' }[z]
              const chip = { excellent: 'bg-emerald-600 text-white', moyenne_haute: 'bg-emerald-400 text-white', moyenne_basse: 'bg-yellow-300 text-yellow-900', fragilite: 'bg-orange-400 text-white', difficulte: 'bg-red-500 text-white', difficulte_severe: 'bg-red-700 text-white' }[z]
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
              <li>Multiples composantes Déficitaire + premiers mots tardifs (> 24 mois) + phrases tardives (> 36 mois) → orientation CRTLA.</li>
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
