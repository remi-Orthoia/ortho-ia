'use client'

/**
 * Saisie structurée EVALO 2-6 (Coquet, Ferrand, Tardif — Ortho Édition 2009).
 *
 * Bilan langage oral très précoce, de 2 ans 3 mois à 6 ans 3 mois, étalonné
 * par tranches de 6 mois. Utilisé en CMPP / CAMSP / libéral pour le dépistage
 * des TDL, des retards de langage, et des signes précoces de TSA.
 *
 * 5 grands axes : Communication précoce, Langage oral réceptif, Langage oral
 * expressif, Phonologie, Capacités narratives & pragmatique. Total ~10 épreuves.
 *
 * Couplage : utilisé dans nouveau-crbo/page.tsx quand 'EVALO 2-6' est coché
 * (TESTS_WITH_SPECIFIC_FORM). Le prompt EVALO 2-6 (lib/prompts/tests/evalo-2-6.ts)
 * connaît les domaines et règles d'interprétation associées.
 */

import { useEffect, useMemo, useState } from 'react'
import { Baby, ChevronDown, Info, AlertCircle } from 'lucide-react'
import MicButton from '../MicButton'

interface Props {
  notes: string
  onNotesChange: (v: string) => void
  onResultatsChange: (normalized: string) => void
  onError?: (msg: string) => void
}

type PercentileKey =
  | '' | 'p_sup_95' | 'p_90_95' | 'p_75_90' | 'p_50_75' | 'p_25_50' | 'p_10_25' | 'p_5_10' | 'p_inf_5'

/** Grille 6 zones imposée Laurie (mêmes seuils que tous les bilans percentile
 *  du projet). EVALO étalonne explicitement P5/P10/P25/P50/P75/P90/P95 — on
 *  utilise tels quels, jamais de recalcul depuis l'É-T. */
const PERCENTILE_OPTIONS: Array<{
  key: Exclude<PercentileKey, ''>
  label: string
  value: number
  zone: 'excellent' | 'moyenne_haute' | 'moyenne_basse' | 'fragilite' | 'difficulte' | 'difficulte_severe'
  chip: string
  text: string
}> = [
  { key: 'p_sup_95', label: '> P95',     value: 97, zone: 'excellent',         chip: 'bg-emerald-700', text: 'text-white' },
  { key: 'p_90_95',  label: 'P90 — P95', value: 92, zone: 'excellent',         chip: 'bg-emerald-600', text: 'text-white' },
  { key: 'p_75_90',  label: 'P75 — P90', value: 80, zone: 'excellent',         chip: 'bg-emerald-500', text: 'text-white' },
  { key: 'p_50_75',  label: 'P50 — P75', value: 60, zone: 'moyenne_haute',     chip: 'bg-emerald-300', text: 'text-emerald-900' },
  { key: 'p_25_50',  label: 'P25 — P50', value: 35, zone: 'moyenne_basse',     chip: 'bg-yellow-300',  text: 'text-yellow-900' },
  { key: 'p_10_25',  label: 'P10 — P25', value: 18, zone: 'fragilite',         chip: 'bg-orange-300',  text: 'text-orange-900' },
  { key: 'p_5_10',   label: 'P5 — P10',  value: 7,  zone: 'difficulte',        chip: 'bg-orange-500',  text: 'text-white' },
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

interface Section {
  id: string
  label: string
  description: string
  epreuves: Epreuve[]
}

/** Structure tirée du prompt EVALO 2-6 (lib/prompts/tests/evalo-2-6.ts) et
 *  du manuel Coquet, Ferrand, Tardif 2009. Les libellés correspondent aux
 *  épreuves canoniques de la batterie — ne pas reformuler. */
const SECTIONS: Section[] = [
  {
    id: 'communication',
    label: 'Communication précoce',
    description: "Pointage, attention conjointe, tours de parole, compréhension de l'intention. Domaine clé pour le diagnostic différentiel TDL / TSA.",
    epreuves: [
      {
        key: 'comp_communicatifs',
        label: 'Évaluation des comportements communicatifs',
        hint: 'Pointage, attention conjointe, tours de parole — déficit sévère = alerte TSA, orientation CRA',
      },
    ],
  },
  {
    id: 'lo_receptif',
    label: 'Langage oral — versant réceptif',
    description: "Compréhension des consignes et lexique en désignation.",
    epreuves: [
      { key: 'comp_consignes',       label: 'Compréhension orale de consignes',  hint: 'Décodage des énoncés simples puis complexes' },
      { key: 'designation_lexique',  label: 'Désignation (lexique réceptif)',    hint: 'Identification d\'images sur consigne orale' },
      { key: 'comp_morphosyntaxe',   label: 'Compréhension morphosyntaxique',    hint: 'Clé du diagnostic différentiel TDL' },
    ],
  },
  {
    id: 'lo_expressif',
    label: 'Langage oral — versant expressif',
    description: "Production lexicale et syntaxique attendue selon la tranche d'âge.",
    epreuves: [
      { key: 'denomination_lexique',     label: 'Dénomination (lexique expressif)', hint: 'Pas de mots à 24 mois = signalement immédiat' },
      { key: 'production_syntaxique',    label: 'Production syntaxique',             hint: 'Phrases simples puis complexes. À 4-5 ans, S+V+C attendu' },
      { key: 'production_morphosyntaxe', label: 'Production morphosyntaxique',       hint: 'Accords, conjugaisons, pronoms — clé TDL' },
    ],
  },
  {
    id: 'phono',
    label: 'Phonologie',
    description: "Système phonologique productif. Erreurs attendues jusqu'à 4 ans, persistance après 5 ans = trouble spécifique.",
    epreuves: [
      { key: 'repetition_mots',         label: 'Répétition de mots',          hint: 'Encodage phonologique' },
      { key: 'repetition_logatomes',    label: 'Répétition de logatomes',     hint: 'Boucle phonologique pure — marqueur TDL phonologique' },
      { key: 'production_phonologique', label: 'Production phonologique',     hint: 'Inventaire phonémique, simplifications, processus' },
    ],
  },
  {
    id: 'narratif_pragmatique',
    label: 'Capacités narratives & Pragmatique',
    description: "Récit émergent + interaction sociale. Déficit pragmatique isolé = piste TCS/TSA.",
    epreuves: [
      { key: 'capacites_narratives', label: 'Capacités narratives émergentes',  hint: 'À partir d\'images, dès 4 ans' },
      { key: 'interaction_ludique',  label: 'Interaction en contexte ludique',  hint: 'Pragmatique : initiations, ajustement, intérêt pour autrui' },
    ],
  },
]

/** Tranches d'âge étalonnage EVALO 2-6 (par 6 mois, de 2;3 à 6;3 ans).
 *  Format ISO : "ans;mois". L'ortho choisit la tranche correspondant à
 *  l'âge réel du patient au jour du bilan. */
const AGE_OPTIONS = [
  { key: '',     label: '— choisir —' },
  { key: 'a23', label: '2 ans 3 mois → 2 ans 8 mois' },
  { key: 'a29', label: '2 ans 9 mois → 3 ans 2 mois' },
  { key: 'a33', label: '3 ans 3 mois → 3 ans 8 mois' },
  { key: 'a39', label: '3 ans 9 mois → 4 ans 2 mois' },
  { key: 'a43', label: '4 ans 3 mois → 4 ans 8 mois' },
  { key: 'a49', label: '4 ans 9 mois → 5 ans 2 mois' },
  { key: 'a53', label: '5 ans 3 mois → 5 ans 8 mois' },
  { key: 'a59', label: '5 ans 9 mois → 6 ans 3 mois' },
] as const

interface EpreuveState {
  percentile: PercentileKey
  score_brut: string
  observation: string
  non_passee: boolean
}

interface State {
  ageTranche: typeof AGE_OPTIONS[number]['key']
  epreuves: Record<string, EpreuveState>
}

function emptyState(): State {
  const ep: Record<string, EpreuveState> = {}
  for (const s of SECTIONS) for (const e of s.epreuves) {
    ep[e.key] = { percentile: '', score_brut: '', observation: '', non_passee: false }
  }
  return { ageTranche: '', epreuves: ep }
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

export default function Evalo26ScoresInput({ notes, onNotesChange, onResultatsChange }: Props) {
  const [state, setState] = useState<State>(emptyState)
  const [expandedSection, setExpandedSection] = useState<Record<string, boolean>>({
    communication: true, lo_receptif: true, lo_expressif: true, phono: false, narratif_pragmatique: false,
  })

  const totalEpreuves = SECTIONS.reduce((acc, s) => acc + s.epreuves.length, 0)

  const totalSaisies = useMemo(() => {
    let n = 0
    for (const s of SECTIONS) for (const e of s.epreuves) {
      const st = state.epreuves[e.key]
      if (st.non_passee) continue
      if (st.percentile !== '') n++
    }
    return n
  }, [state.epreuves])

  const zoneCounts = useMemo(() => {
    const c = { excellent: 0, moyenne_haute: 0, moyenne_basse: 0, fragilite: 0, difficulte: 0, difficulte_severe: 0 }
    for (const s of SECTIONS) for (const e of s.epreuves) {
      const st = state.epreuves[e.key]
      if (st.non_passee) continue
      const z = PERCENTILE_OPTIONS.find(o => o.key === st.percentile)?.zone
      if (z) c[z]++
    }
    return c
  }, [state.epreuves])

  /** Alerte TSA : déficit marqué simultané en communication précoce ET en pragmatique. */
  const alerteTSA = useMemo(() => {
    const commState = state.epreuves['comp_communicatifs']
    const interactState = state.epreuves['interaction_ludique']
    if (!commState || !interactState) return false
    if (commState.non_passee || interactState.non_passee) return false
    const commZone = PERCENTILE_OPTIONS.find(o => o.key === commState.percentile)?.zone
    const interactZone = PERCENTILE_OPTIONS.find(o => o.key === interactState.percentile)?.zone
    const isWeak = (z: typeof commZone) => z === 'difficulte' || z === 'difficulte_severe'
    return isWeak(commZone) && isWeak(interactZone)
  }, [state.epreuves])

  useEffect(() => {
    if (totalSaisies === 0 && !state.ageTranche) {
      onResultatsChange('')
      return
    }
    const lines: string[] = []
    lines.push('=== EVALO 2-6 (Coquet, Ferrand, Tardif — Ortho Édition 2009) ===')
    if (state.ageTranche) {
      lines.push(`Tranche d'âge étalonnage : ${AGE_OPTIONS.find(o => o.key === state.ageTranche)?.label}`)
      lines.push('')
    }
    for (const s of SECTIONS) {
      let sectionPrinted = false
      for (const e of s.epreuves) {
        const st = state.epreuves[e.key]
        if (st.non_passee) continue
        const hasData = st.percentile !== '' || st.score_brut.trim() || st.observation.trim()
        if (!hasData) continue
        if (!sectionPrinted) {
          lines.push(`=== ${s.label} ===`)
          sectionPrinted = true
        }
        lines.push(`Épreuve : ${e.label}`)
        if (st.percentile !== '') {
          lines.push(`  Percentile : ${percentileLabel(st.percentile)} — ${zoneLabel(st.percentile)}`)
        }
        if (st.score_brut.trim()) lines.push(`  Score brut : ${st.score_brut.trim()}`)
        if (st.observation.trim()) lines.push(`  Observation : ${st.observation.trim()}`)
      }
      if (sectionPrinted) lines.push('')
    }
    // Synthèse zones percentile
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
    if (alerteTSA) {
      lines.push('')
      lines.push('⚠ ALERTE CLINIQUE : déficit marqué simultané en communication précoce ET en pragmatique → piste TSA à explorer (orientation CRA / pédopsychiatrie).')
    }
    onResultatsChange(lines.join('\n'))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, totalSaisies, zoneCounts, alerteTSA])

  const setField = (key: string, field: keyof EpreuveState, v: any) => {
    setState(s => ({ ...s, epreuves: { ...s.epreuves, [key]: { ...s.epreuves[key], [field]: v } } }))
  }

  return (
    <div className="space-y-4">
      {/* Bandeau EVALO */}
      <div className="flex items-start gap-2 p-3 rounded-lg border border-pink-200 bg-pink-50">
        <Baby size={18} className="text-pink-600 shrink-0 mt-0.5" />
        <div className="text-sm">
          <p className="font-semibold text-pink-900">Saisie structurée EVALO 2-6 — bilan langage oral très précoce</p>
          <p className="text-pink-700 text-xs mt-0.5 leading-relaxed">
            De 2 ans 3 mois à 6 ans 3 mois, étalonné par tranches de 6 mois. Reportez la zone (ou le percentile)
            lue sur la cotation EVALO pour chaque épreuve passée. Cochez « non passée » pour exclure une épreuve.
            En cas de déficit en communication + pragmatique : <strong>orientation CRA / pédopsychiatrie</strong>.
          </p>
        </div>
      </div>

      {/* Tranche d'âge */}
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <label className="flex items-center gap-2 text-sm font-semibold text-gray-900 mb-2">
          <Info size={14} className="text-pink-600" />
          Tranche d&apos;âge au moment du bilan
        </label>
        <select
          value={state.ageTranche}
          onChange={(e) => setState(s => ({ ...s, ageTranche: e.target.value as State['ageTranche'] }))}
          className="w-full sm:w-80 px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-pink-400"
        >
          {AGE_OPTIONS.map(o => (
            <option key={o.key} value={o.key}>{o.label}</option>
          ))}
        </select>
        <p className="text-[11px] text-gray-500 mt-1">
          8 tranches d&apos;étalonnage de 6 mois (2;3 à 6;3 ans). Choisir la tranche qui contient l&apos;âge du patient.
        </p>
      </div>

      {/* Alerte TSA visible en haut si déclenchée */}
      {alerteTSA && (
        <div className="rounded-lg border border-red-300 bg-red-50 p-3 flex items-start gap-2">
          <AlertCircle size={18} className="text-red-600 shrink-0 mt-0.5" />
          <div className="text-sm text-red-900 leading-relaxed">
            <p className="font-semibold">⚠ Alerte clinique TSA</p>
            <p className="text-xs mt-0.5">
              Déficit marqué simultané en <strong>communication précoce</strong> ET en <strong>pragmatique</strong>.
              Ne pas rester sur un diagnostic de TDL simple : orientation vers le <strong>CRA</strong>
              (Centre Ressource Autisme) ou consultation <strong>pédopsychiatrique</strong> à envisager.
              Le CRBO IA mentionnera cette piste dans le diagnostic.
            </p>
          </div>
        </div>
      )}

      {/* Synthèse répartition zones */}
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

      {/* Sections en accordéon — auto-open dès qu'une épreuve a des données */}
      {SECTIONS.map(s => {
        const explicit = expandedSection[s.id]
        const hasData = s.epreuves.some(e => state.epreuves[e.key].percentile !== '' || state.epreuves[e.key].observation.trim() || state.epreuves[e.key].non_passee)
        const open = explicit || hasData
        return (
          <div key={s.id} className="rounded-lg border border-gray-200 bg-white">
            <button
              type="button"
              onClick={() => setExpandedSection(prev => ({ ...prev, [s.id]: !open }))}
              className="w-full px-4 py-3 flex items-center justify-between gap-3 text-left hover:bg-gray-50"
            >
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-900">{s.label}</p>
                <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{s.description}</p>
              </div>
              <ChevronDown size={16} className={`shrink-0 transition-transform ${open ? '' : '-rotate-90'}`} />
            </button>
            {open && (
              <div className="border-t border-gray-100 px-4 py-3 space-y-2">
                {s.epreuves.map(e => {
                  const st = state.epreuves[e.key]
                  return (
                    <div key={e.key} className="rounded bg-white border border-gray-100 p-2">
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
                          <PercentileChips value={st.percentile} onChange={(v) => setField(e.key, 'percentile', v)} />
                          <input
                            type="text"
                            value={st.score_brut}
                            onChange={(ev) => setField(e.key, 'score_brut', ev.target.value)}
                            placeholder="Score brut (optionnel)"
                            className="w-full sm:w-60 mt-1.5 px-2 py-1 border border-gray-200 rounded text-[11px]"
                          />
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

      {/* Notes globales */}
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <div className="flex items-center justify-between mb-1">
          <label className="text-sm font-medium text-gray-800">
            Notes globales sur la séance (interaction, attention, contexte)
          </label>
          <MicButton value={notes} onChange={onNotesChange} />
        </div>
        <textarea
          value={notes}
          onChange={(e) => onNotesChange(e.target.value)}
          rows={3}
          placeholder="Ex. enfant en présence d'un parent, fatigabilité après 20 min, refus de certaines épreuves, intérêt marqué pour le matériel…"
          className="w-full px-3 py-2 border border-gray-300 rounded text-sm leading-relaxed resize-y focus:outline-none focus:ring-2 focus:ring-pink-400"
        />
      </div>

      {/* Rappels cliniques */}
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
        <div className="flex items-start gap-2">
          <Baby size={16} className="text-amber-700 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-900 leading-relaxed">
            <p className="font-semibold mb-1">Rappels cliniques EVALO 2-6</p>
            <ul className="list-disc list-inside space-y-0.5">
              <li><strong>Pas de mots à 24 mois</strong> = signalement immédiat (PMI, ORL, pédiatre).</li>
              <li><strong>Communication précoce déficitaire</strong> isolément ou avec pragmatique = piste TSA, orientation CRA.</li>
              <li><strong>Phonologie</strong> : erreurs jusqu&apos;à 4 ans = maturation normale ; persistance après 5 ans = trouble spécifique.</li>
              <li><strong>ORL systématique</strong> : otites séro-muqueuses à éliminer en premier (très fréquentes 2-5 ans).</li>
              <li><strong>Guidance parentale</strong> systématique en parallèle de la PEC (lecture partagée, limitation écrans).</li>
              <li><strong>Coordination</strong> avec PMI, crèche, école maternelle pour le suivi longitudinal.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
