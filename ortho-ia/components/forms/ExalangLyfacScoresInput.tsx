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

// Grille 5 zones alignée Exalang officiel (manuel Exalang 11-15 p. 65-67).
const PERCENTILE_OPTIONS: Array<{
  key: Exclude<PercentileKey, ''>
  label: string
  zone: 'moyenne_haute' | 'moyenne' | 'fragilite' | 'difficulte' | 'difficulte_severe'
  chip: string
  text: string
}> = [
  { key: 'p_sup_95', label: '> P95',     zone: 'moyenne_haute',     chip: 'bg-emerald-600', text: 'text-white' },
  { key: 'p_90_95',  label: 'P90 — P95', zone: 'moyenne_haute',     chip: 'bg-emerald-500', text: 'text-white' },
  { key: 'p_75_90',  label: 'P75 — P90', zone: 'moyenne_haute',     chip: 'bg-emerald-400', text: 'text-white' },
  { key: 'p_50_75',  label: 'P50 — P75', zone: 'moyenne',           chip: 'bg-emerald-300', text: 'text-emerald-900' },
  { key: 'p_25_50',  label: 'P25 — P50', zone: 'moyenne',           chip: 'bg-emerald-200', text: 'text-emerald-900' },
  { key: 'p_10_25',  label: 'P10 — P25', zone: 'fragilite',         chip: 'bg-yellow-300',  text: 'text-yellow-900' },
  { key: 'p_5_10',   label: 'P5 — P10',  zone: 'difficulte',        chip: 'bg-orange-400',  text: 'text-white' },
  { key: 'p_inf_5',  label: '< P5',      zone: 'difficulte_severe', chip: 'bg-red-600',     text: 'text-white' },
]

function percentileLabel(k: PercentileKey): string {
  return PERCENTILE_OPTIONS.find(o => o.key === k)?.label ?? ''
}
function zoneLabel(k: PercentileKey): string {
  const z = PERCENTILE_OPTIONS.find(o => o.key === k)?.zone
  switch (z) {
    case 'moyenne_haute': return 'Moyenne haute'
    case 'moyenne': return 'Moyenne'
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

export default function ExalangLyfacScoresInput({ notes, onNotesChange, onResultatsChange }: Props) {
  const [state, setState] = useState<State>(emptyState)
  const [expanded, setExpanded] = useState<Record<string, boolean>>({ memoire: true, langage_elabore: false, lecture: true, orthographe: true })

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
    const c = { moyenne_haute: 0, moyenne: 0, fragilite: 0, difficulte: 0, difficulte_severe: 0 }
    for (const d of DOMAINES) for (const e of d.epreuves) {
      const st = state.epreuves[e.key]
      if (st.non_passee) continue
      const z = PERCENTILE_OPTIONS.find(o => o.key === st.percentile)?.zone
      if (z) c[z]++
    }
    return c
  }, [state.epreuves])

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

    const tot = zoneCounts.moyenne_haute + zoneCounts.moyenne + zoneCounts.fragilite + zoneCounts.difficulte + zoneCounts.difficulte_severe
    if (tot > 0) {
      lines.push('--- Synthèse zones percentiles ---')
      lines.push(`Moyenne haute (P ≥ 75) : ${zoneCounts.moyenne_haute}`)
      lines.push(`Moyenne (P26-74) : ${zoneCounts.moyenne}`)
      lines.push(`Zone de fragilité (P10-25) : ${zoneCounts.fragilite}`)
      lines.push(`Difficulté (P5-9) : ${zoneCounts.difficulte}`)
      lines.push(`Difficulté sévère (< P5) : ${zoneCounts.difficulte_severe}`)
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

      {totalSaisies > 0 && (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
          <p className="text-xs font-semibold text-gray-700 mb-2">
            Répartition par zone — {totalSaisies}/{DOMAINES.reduce((acc, d) => acc + d.epreuves.length, 0)} épreuves saisies
          </p>
          <div className="flex flex-wrap gap-1.5">
            {(['moyenne_haute', 'moyenne', 'fragilite', 'difficulte', 'difficulte_severe'] as const).map(z => {
              const n = zoneCounts[z]
              if (n === 0) return null
              const label = { moyenne_haute: 'Moyenne haute', moyenne: 'Moyenne', fragilite: 'Zone de fragilité', difficulte: 'Difficulté', difficulte_severe: 'Difficulté sévère' }[z]
              const chip = { moyenne_haute: 'bg-emerald-600 text-white', moyenne: 'bg-emerald-300 text-emerald-900', fragilite: 'bg-yellow-300 text-yellow-900', difficulte: 'bg-orange-400 text-white', difficulte_severe: 'bg-red-600 text-white' }[z]
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
