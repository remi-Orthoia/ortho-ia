'use client'

/**
 * Saisie structurée Exalang 5-8 (Thibault, Helloin, Lenfant — HappyNeuron /
 * Orthomotus 2011).
 *
 * Population : GS à CE1. Étalonnage par niveau scolaire. Scoring percentile
 * HappyNeuron (P5 / P10 / P25 / P50 / P75 / P90 / P95).
 *
 * 5 groupes officiels HappyNeuron : A.1 Langage oral, A.2 Métaphonologie,
 * B.1 Lecture émergente, B.2 Production écrite émergente, C.1 Mémoire.
 *
 * Couplage : nouveau-crbo/page.tsx, test_utilise === ['Exalang 5-8'].
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
  /** Tag de niveau si épreuve restreinte. */
  tag?: string
}

interface Groupe {
  code: string
  label: string
  description: string
  epreuves: Epreuve[]
}

/** 5 groupes officiels HappyNeuron Exalang 5-8 (codes A.1, A.2, B.1, B.2, C.1
 *  visibles sur la feuille de résultats du logiciel). */
const GROUPES: Groupe[] = [
  {
    code: 'A.1',
    label: 'Langage oral',
    description: 'Lexique réceptif et expressif, compréhension morphosyntaxique, dénomination.',
    epreuves: [
      { key: 'denomination_images',     label: 'Dénomination d\'images',                hint: 'Lexique expressif imagé' },
      { key: 'designation_sur_def',     label: 'Désignation sur définition',            hint: 'Lexique réceptif' },
      { key: 'lexique_reception',       label: 'Lexique en réception',                  hint: 'Connaissance lexicale passive' },
      { key: 'comp_orale_phrases',      label: 'Compréhension orale de phrases',        hint: 'Syntaxe réceptive (prédicteur compréhension écrite ultérieure)' },
      { key: 'comp_morphosyntaxique',   label: 'Compréhension morphosyntaxique',        hint: 'Syntaxe complexe en réception' },
      { key: 'rep_mots',                label: 'Répétition de mots',                    hint: 'Encodage phonologique' },
      { key: 'rep_logatomes',           label: 'Répétition de logatomes',               hint: 'Boucle phonologique pure — marqueur précoce dyslexie' },
    ],
  },
  {
    code: 'A.2',
    label: 'Métaphonologie',
    description: 'Conscience phonologique — prédicteur fort de l\'entrée en lecture.',
    epreuves: [
      { key: 'meta_rimes',              label: 'Métaphonologie — rimes',                hint: 'Acquise en MS-GS' },
      { key: 'meta_syllabes_segm',      label: 'Métaphonologie — syllabes (segmentation)', hint: 'Acquise en GS-CP' },
      { key: 'meta_syllabes_fusion',    label: 'Métaphonologie — syllabes (fusion)',    hint: 'Acquise en GS-CP' },
      { key: 'meta_phonemes',           label: 'Métaphonologie — phonèmes',             hint: 'S\'installe en CP-CE1 avec apprentissage lecture', tag: 'CP-CE1' },
    ],
  },
  {
    code: 'B.1',
    label: 'Lecture émergente',
    description: 'Connaissance de l\'écrit + lecture de lettres / syllabes / mots (CP-CE1).',
    epreuves: [
      { key: 'conscience_ecrit',        label: 'Conscience de l\'écrit',                hint: 'Concept de lettre, mot, phrase, orientation' },
      { key: 'lecture_lettres',         label: 'Lecture de lettres',                    tag: 'CP-CE1' },
      { key: 'lecture_syllabes',        label: 'Lecture de syllabes',                   tag: 'CP-CE1' },
      { key: 'lecture_mots',            label: 'Lecture de mots',                       hint: 'Voie d\'adressage émergente', tag: 'CP-CE1' },
    ],
  },
  {
    code: 'B.2',
    label: 'Production écrite émergente',
    description: 'Écriture de mots (CP-CE1).',
    epreuves: [
      { key: 'ecriture_mots',           label: 'Écriture de mots',                      hint: 'Transcription, buffer graphémique', tag: 'CP-CE1' },
    ],
  },
  {
    code: 'C.1',
    label: 'Mémoire',
    description: 'Mémoire de travail verbale — empan auditif endroit.',
    epreuves: [
      { key: 'empan_auditif_endroit',   label: 'Empan auditif endroit',                 hint: 'MdT verbale, boucle phonologique' },
    ],
  },
]

const NIVEAU_OPTIONS = [
  { key: '',    label: '— choisir —' },
  { key: 'GS',  label: 'Grande Section (~5 ans)' },
  { key: 'CP',  label: 'CP (~6 ans)' },
  { key: 'CE1', label: 'CE1 (~7-8 ans)' },
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

export default function Exalang58ScoresInput({ notes, onNotesChange, onResultatsChange }: Props) {
  const [state, setState] = useState<State>(emptyState)
  const [expanded, setExpanded] = useState<Record<string, boolean>>({ 'A.1': true, 'A.2': true, 'B.1': false, 'B.2': false, 'C.1': false })

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
    lines.push('=== Exalang 5-8 (Thibault, Helloin, Lenfant — HappyNeuron 2011) ===')
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
          <p className="font-semibold text-indigo-900">Saisie structurée Exalang 5-8 — 5 groupes officiels (A.1, A.2, B.1, B.2, C.1)</p>
          <p className="text-indigo-700 text-xs mt-0.5 leading-relaxed">
            Reportez la zone HappyNeuron lue sur la feuille de résultats. Étalonnage par niveau (GS / CP / CE1).
            Cochez « non passée » pour exclure une épreuve. Q1 = P25 = NORMAL, jamais déficitaire.
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
            Notes globales sur la séance
          </label>
          <MicButton value={notes} onChange={onNotesChange} />
        </div>
        <textarea
          value={notes}
          onChange={(e) => onNotesChange(e.target.value)}
          rows={3}
          placeholder="Ex. enfant attentif sur la partie A, fatigue marquée à partir de la lecture, stratégie de devinette sur les mots inconnus…"
          className="w-full px-3 py-2 border border-gray-300 rounded text-sm leading-relaxed resize-y focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />
      </div>

      <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
        <div className="flex items-start gap-2">
          <Brain size={16} className="text-amber-700 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-900 leading-relaxed">
            <p className="font-semibold mb-1">Rappels cliniques Exalang 5-8</p>
            <ul className="list-disc list-inside space-y-0.5">
              <li>Population : GS à CE1 — <strong>pas de diagnostic de dyslexie avant milieu du CE1</strong> (février).</li>
              <li>Avant le CE1 : préférer « fragilité », « retard », « vigilance nécessaire » plutôt que « trouble spécifique ».</li>
              <li>Métaphonologie phonèmes déficitaire en fin CE1 + lecture en difficulté = dyslexie probable.</li>
              <li>Répétition de logatomes très sensible : marqueur précoce de fragilité phonologique.</li>
              <li>Si langage oral massivement déficitaire (lexique + morphosyntaxe + phonologie) → orienter CRTLA pour suspicion TDL.</li>
              <li><strong>Bilan ORL impératif</strong> si jamais réalisé (otites à répétition fréquentes à cet âge).</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
