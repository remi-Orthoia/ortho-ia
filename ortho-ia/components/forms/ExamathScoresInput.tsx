'use client'

/**
 * Saisie structurée des scores Examath 8-15 (A. Lafay & M.-C. Helloin,
 * HappyNeuron 2016).
 *
 * Examath produit pour chaque épreuve / subtest un PERCENTILE (P5, P10, P25,
 * P50, P75, P90, P95). On ne recalcule pas — l'ortho recopie le percentile
 * affiché par le logiciel HappyNeuron (étalonnage par niveau scolaire :
 * CE2 / CM1 / CM2 / 6e-5e, géré par le logiciel).
 *
 * Seuil officiel de pathologie : P ≤ 10. P ≤ 5 = pathologie sévère.
 *
 * Structure du formulaire (calquée sur le cahier de passation officiel) :
 *   1. Habiletés numériques de base
 *   2. Numération (base 10 + décimale/fractionnaire CM2+)
 *   3. Arithmétique
 *   4. Mesures
 *   5. Résolution de problèmes
 *   6. Langage et raisonnement
 *
 * Couplage : utilisé dans nouveau-crbo/page.tsx quand test_utilise === ['Examath'].
 */

import { useEffect, useMemo, useState } from 'react'
import { Brain, Calculator, ChevronDown, Info } from 'lucide-react'
import MicButton from '../MicButton'

interface Props {
  notes: string
  onNotesChange: (v: string) => void
  onResultatsChange: (normalized: string) => void
  onError?: (msg: string) => void
}

/** Identifiant stable d'une épreuve. Format : `m{module}_{slug}`. */
type EpreuveKey = string

/** Percentile officiel HappyNeuron + zone correspondante au seuil de pathologie
 *  P10 de l'éditeur (la palette CRBO existante utilise 6 zones — on reste
 *  cohérent avec elle pour la couleur). */
type PercentileKey =
  | '' | 'p_sup_95' | 'p_90_95' | 'p_75_90' | 'p_50_75' | 'p_25_50' | 'p_10_25' | 'p_5_10' | 'p_inf_5'

const PERCENTILE_OPTIONS: Array<{
  key: Exclude<PercentileKey, ''>
  label: string
  /** Valeur indicative à injecter dans le CRBO (percentile_value). */
  value: number
  /** Zone CRBO ortho.ia correspondante. */
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

interface Subtest {
  key: string
  label: string
  /** Tag optionnel : chronométrée ⏱ / arrêt automatique AA. */
  tag?: 'chrono' | 'AA' | 'chrono+AA'
  /** Si défini, hint courte affichée sous le libellé. */
  hint?: string
}

interface Epreuve {
  key: EpreuveKey
  /** Libellé EXACT du cahier de passation officiel (Lafay & Helloin 2016). */
  label: string
  tag?: 'chrono' | 'AA' | 'chrono+AA'
  /** Description courte de ce que mesure l'épreuve (depuis manuel). */
  description: string
  /** Sous-tests éventuels. Si vide, l'épreuve a un score unique. */
  subtests?: Subtest[]
  /** Si true : épreuve réservée à un niveau (CM2 seulement). */
  niveau_specifique?: string
}

interface Module {
  id: string
  num: number
  label: string
  description: string
  epreuves: Epreuve[]
}

const MODULES: Module[] = [
  {
    id: 'm1',
    num: 1,
    label: 'Habiletés numériques de base',
    description: 'Sens du nombre — marqueur central de la dyscalculie développementale. Comparaison, ligne numérique, identification de quantités, dénombrement.',
    epreuves: [
      {
        key: 'm1_comparaison_analogique',
        label: 'Comparaison analogique',
        description: 'Comparer deux collections de points (sens du nombre non symbolique).',
      },
      {
        key: 'm1_relation_arabe_analogique',
        label: 'Relation Arabe / Analogique',
        description: 'Mettre en correspondance un chiffre arabe et une quantité (collection de points).',
        subtests: [
          { key: 'comparaison_arabe', label: 'Comparaison arabe' },
        ],
      },
      {
        key: 'm1_relation_oral_analogique',
        label: 'Relation Oral / Analogique',
        description: 'Mettre en correspondance un nombre dit oralement et une quantité.',
        subtests: [
          { key: 'comparaison_orale', label: 'Comparaison orale' },
        ],
      },
      {
        key: 'm1_ligne_numerique',
        label: 'Ligne numérique',
        description: 'Estimer la position d\'un nombre sur une ligne 0-100 (très sensible : la compression anormale est quasi-pathognomonique).',
      },
      {
        key: 'm1_identification_quantites',
        label: 'Identification de quantités',
        description: 'Reconnaître rapidement de petites quantités (subitizing).',
        subtests: [
          { key: 'subitizing', label: 'Subitizing' },
        ],
      },
      {
        key: 'm1_denombrement_calcul',
        label: 'Dénombrement et calcul',
        description: 'Dénombrer une collection (jusqu\'à 25). Noter la stratégie : sur les doigts, sur l\'écran, par groupes.',
        subtests: [
          { key: 'identification_collection', label: 'Identification d\'une collection' },
          { key: 'production_collection',     label: 'Production d\'une collection' },
        ],
      },
    ],
  },
  {
    id: 'm2',
    num: 2,
    label: 'Numération',
    description: 'Numération base 10 (transcodage, valeur positionnelle) + numération décimale/fractionnaire (CM2+).',
    epreuves: [
      {
        key: 'm2_transcodage',
        label: 'Transcodage',
        tag: 'chrono',
        description: 'Lire et écrire les nombres en chiffres et en lettres. Analyser les erreurs : lexicales (quatorze/quarante) vs syntaxiques (3008 pour 308).',
        subtests: [
          { key: 'lecture_1_99',  label: 'Lecture 1 à 99',           tag: 'chrono' },
          { key: 'lecture_99p',   label: 'Lecture 99+',              tag: 'chrono+AA' },
          { key: 'dictee_1_99',   label: 'Dictée 1 à 99',            tag: 'chrono' },
          { key: 'dictee_99p',    label: 'Dictée 99+',               tag: 'chrono+AA' },
        ],
      },
      {
        key: 'm2_identification_udcm',
        label: "Identification d'U/D/C/M",
        tag: 'AA',
        description: 'Identifier les unités, dizaines, centaines, milliers d\'un nombre — valeur positionnelle.',
      },
      {
        key: 'm2_relation_arabe_analogique_udc',
        label: 'Relation Arabe / Analogique U-D-C',
        description: 'Représenter et lire des nombres en représentation U-D-C (base 10 imagée).',
        subtests: [
          { key: 'production_arabe_analogique', label: 'Production Arabe → Analogique' },
          { key: 'production_analogique_arabe', label: 'Production Analogique → Arabe' },
          { key: 'jugement',                    label: 'Jugement' },
        ],
      },
      {
        key: 'm2_decomposition_additive',
        label: 'Décomposition additive',
        tag: 'AA',
        description: 'Décomposer un nombre en somme de centaines, dizaines, unités.',
      },
      {
        key: 'm2_ligne_numerique_fractions',
        label: 'Ligne numérique — Fractions',
        description: 'Positionner une fraction sur une ligne 0-1. CM2 et au-delà.',
        niveau_specifique: 'CM2+',
      },
      {
        key: 'm2_comparaison_fractions',
        label: 'Comparaison de fractions',
        description: 'Comparer deux fractions. CM2 et au-delà.',
        niveau_specifique: 'CM2+',
      },
      {
        key: 'm2_jugement_operations',
        label: "Jugement d'opérations",
        description: 'Estimer la plausibilité du résultat d\'une opération. CM2 et au-delà.',
        niveau_specifique: 'CM2+',
      },
      {
        key: 'm2_calcul_fractions',
        label: 'Calcul avec fractions',
        description: 'Calculer avec des fractions simples. CM2 et au-delà.',
        niveau_specifique: 'CM2+',
      },
      {
        key: 'm2_estimation_resultat',
        label: 'Estimation de résultat',
        description: 'Estimer l\'ordre de grandeur d\'un résultat avant calcul. CM2 et au-delà.',
        niveau_specifique: 'CM2+',
      },
    ],
  },
  {
    id: 'm3',
    num: 3,
    label: 'Arithmétique',
    description: 'Fluence arithmétique chronométrée (récupération automatisée des faits) + mécanismes opératoires posés.',
    epreuves: [
      {
        key: 'm3_operations_analogiques',
        label: 'Opérations analogiques',
        tag: 'AA',
        description: 'Opérations sur représentations imagées (avant le passage au symbolique).',
      },
      {
        key: 'm3_fluence_arithmetique',
        label: 'Fluence arithmétique',
        tag: 'chrono',
        description: 'Vitesse de récupération des faits arithmétiques. Tables défaillantes au CM1+ = signal fort. Comptage sur doigts persistant après CE1 = défaut d\'automatisation.',
        subtests: [
          { key: 'additions',       label: 'Additions',       tag: 'chrono' },
          { key: 'soustractions',   label: 'Soustractions',   tag: 'chrono' },
          { key: 'multiplications', label: 'Multiplications', tag: 'chrono' },
        ],
      },
      {
        key: 'm3_mecanismes_operatoires',
        label: 'Mécanismes opératoires écrits',
        tag: 'AA',
        description: 'Opérations posées sur le papier. Procédure préservée = profil compensé même si calcul mental déficitaire.',
        subtests: [
          { key: 'additions',     label: 'Additions',     tag: 'AA' },
          { key: 'soustractions', label: 'Soustractions', tag: 'AA' },
          { key: 'multiplication', label: 'Multiplication', tag: 'AA' },
        ],
      },
    ],
  },
  {
    id: 'm4',
    num: 4,
    label: 'Mesures',
    description: 'Approche contextuelle des unités (cm, m, kg, l, mn, m²). Souvent secondaire à l\'expérience de vie quotidienne.',
    epreuves: [
      {
        key: 'm4_approche_mesures',
        label: 'Approche contextuelle des mesures',
        description: 'Associer une unité (cm, m, kg, l, mn, m²) à un objet ou un contexte usuel. Peu spécifique en isolé.',
      },
    ],
  },
  {
    id: 'm5',
    num: 5,
    label: 'Résolution de problèmes arithmétiques',
    description: 'Compréhension d\'énoncé verbal + modélisation + exécution. Déficit isolé sur ce module = souvent secondaire (dyslexie, MdT).',
    epreuves: [
      {
        key: 'm5_combinaison_plus',
        label: 'Combinaison +',
        description: 'Recherche d\'une combinaison/composition + recherche d\'une valeur complément. Addition simple à élaborer depuis l\'énoncé.',
      },
      {
        key: 'm5_transformation_plus',
        label: 'Transformation +',
        tag: 'AA',
        description: 'Ajout / retrait avec recherche de la situation finale, transformation, ou situation initiale (6 sous-items).',
      },
      {
        key: 'm5_comparaison_plus',
        label: 'Comparaison +',
        tag: 'AA',
        description: 'Comparaisons « Plus que » / « Moins que » avec recherche de valeur supérieure, inférieure, ou différence. Structures inverses = forte sollicitation inhibitrice.',
      },
      {
        key: 'm5_proportionnalite',
        label: 'Proportionnalité simple et directe ×',
        description: 'Recherche de quantité d\'unités (division partage), valeur multipliée (4ᵉ proportionnelle), valeur unitaire (division regroupement).',
      },
      {
        key: 'm5_comparaison_x',
        label: 'Comparaison ×',
        tag: 'AA',
        description: 'Multiplication / division avec comparaisons « Fois plus que » / « Fois moins que ». CM2 uniquement.',
        niveau_specifique: 'CM2',
      },
      {
        key: 'm5_probleme_compose',
        label: 'Problème composé',
        description: 'Problème à plusieurs étapes nécessitant la coordination de plusieurs opérations. CM2 uniquement.',
        niveau_specifique: 'CM2',
      },
    ],
  },
  {
    id: 'm6',
    num: 6,
    label: 'Langage et raisonnement',
    description: 'Préservation = critère différentiel important. Déficit associé = orienter vers bilan langagier (Exalang).',
    epreuves: [
      {
        key: 'm6_inferences_images',
        label: 'Inférences en images',
        description: '12 scènes images : déduction logique sans support verbal (Fonte de l\'igloo, Esquimau pêcheur, Chat sur le toit, Vol de fruits, Serpent, Ours polaire, Voleur, Porte-monnaie vide, Pizza fourmis, Chocolats gourmand, Voleur attrapé, Robinson).',
      },
      {
        key: 'm6_gestion_enonces',
        label: 'Gestion des énoncés',
        description: '5 énoncés à juger possible/impossible (Bûches, Bananes, Coquillages, Soupe, Poissons). Détecte la compréhension littérale des énoncés mathématiques.',
      },
    ],
  },
]

const NIVEAU_OPTIONS = [
  { key: '', label: '— choisir —' },
  { key: 'CE2',   label: 'CE2 (~8-9 ans)' },
  { key: 'CM1',   label: 'CM1 (~9-10 ans)' },
  { key: 'CM2',   label: 'CM2 (~10-11 ans)' },
  { key: '6e_5e', label: '6e-5e (~11-13 ans)' },
] as const

interface SubtestState {
  percentile: PercentileKey
  /** Score brut optionnel (pour traçabilité — non utilisé pour la couleur). */
  score_brut: string
  /** Temps si chrono (mm:ss ou s). */
  temps: string
}

interface EpreuveState {
  /** Percentile principal de l'épreuve (utilisé si pas de subtests). */
  percentile: PercentileKey
  score_brut: string
  temps: string
  observation: string
  non_passee: boolean
  /** État par subtest (clé = subtest.key). */
  subtests: Record<string, SubtestState>
}

interface State {
  niveau: typeof NIVEAU_OPTIONS[number]['key']
  epreuves: Record<EpreuveKey, EpreuveState>
}

function emptySubtest(): SubtestState {
  return { percentile: '', score_brut: '', temps: '' }
}

function emptyEpreuveState(e: Epreuve): EpreuveState {
  const subs: Record<string, SubtestState> = {}
  for (const st of e.subtests ?? []) subs[st.key] = emptySubtest()
  return { percentile: '', score_brut: '', temps: '', observation: '', non_passee: false, subtests: subs }
}

function emptyState(): State {
  const ep: Record<string, EpreuveState> = {}
  for (const m of MODULES) for (const e of m.epreuves) ep[e.key] = emptyEpreuveState(e)
  return { niveau: '', epreuves: ep }
}

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

/** Chip cliquable de saisie du percentile (8 options). */
function PercentileChips({
  value,
  onChange,
}: {
  value: PercentileKey
  onChange: (v: PercentileKey) => void
}) {
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

export default function ExamathScoresInput({ notes, onNotesChange, onResultatsChange }: Props) {
  const [state, setState] = useState<State>(emptyState)
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    m1: true, m2: false, m3: false, m4: false, m5: false, m6: false,
  })

  // Compte d'épreuves saisies (avec au moins un percentile).
  const totalSaisies = useMemo(() => {
    let n = 0
    for (const m of MODULES) for (const e of m.epreuves) {
      const st = state.epreuves[e.key]
      if (st.non_passee) continue
      const principal = st.percentile !== ''
      const sub = (e.subtests ?? []).some(s => st.subtests[s.key]?.percentile !== '')
      if (principal || sub) n++
    }
    return n
  }, [state.epreuves])

  /** Compteur par zone (pour le bandeau de synthèse). */
  const zoneCounts = useMemo(() => {
    const c = { excellent: 0, moyenne_haute: 0, moyenne_basse: 0, fragilite: 0, difficulte: 0, difficulte_severe: 0 }
    const bump = (k: PercentileKey) => {
      const z = PERCENTILE_OPTIONS.find(o => o.key === k)?.zone
      if (z) c[z]++
    }
    for (const m of MODULES) for (const e of m.epreuves) {
      const st = state.epreuves[e.key]
      if (st.non_passee) continue
      if (e.subtests && e.subtests.length > 0) {
        for (const s of e.subtests) bump(st.subtests[s.key]?.percentile)
      } else {
        bump(st.percentile)
      }
    }
    return c
  }, [state.epreuves])

  // Émet la string normalisée à chaque changement.
  useEffect(() => {
    if (totalSaisies === 0 && !state.niveau) {
      onResultatsChange('')
      return
    }
    const lines: string[] = []
    lines.push("=== Examath 8-15 — Examen Mathématique 8-15 ans (Lafay & Helloin, HappyNeuron 2016) ===")
    if (state.niveau) {
      lines.push(`Niveau scolaire : ${NIVEAU_OPTIONS.find(o => o.key === state.niveau)?.label || ''}`)
      lines.push('')
    }
    for (const m of MODULES) {
      // On ne sort le module que si au moins une épreuve a une donnée
      const hasAny = m.epreuves.some(e => {
        const st = state.epreuves[e.key]
        if (st.non_passee) return false
        return st.percentile !== '' || st.observation.trim() !== '' || (e.subtests ?? []).some(s => st.subtests[s.key]?.percentile !== '')
      })
      if (!hasAny) continue
      lines.push(`--- Module ${m.num} — ${m.label} ---`)
      for (const e of m.epreuves) {
        const st = state.epreuves[e.key]
        if (st.non_passee) continue
        const hasMainPct = st.percentile !== ''
        const subWithPct = (e.subtests ?? []).filter(s => st.subtests[s.key]?.percentile !== '')
        if (!hasMainPct && subWithPct.length === 0 && !st.observation.trim() && !st.temps.trim() && !st.score_brut.trim()) continue

        const tag = e.tag ? ` (${e.tag === 'AA' ? 'AA' : e.tag === 'chrono' ? 'chrono' : 'chrono + AA'})` : ''
        lines.push(`Épreuve : ${e.label}${tag}`)
        if (hasMainPct) {
          lines.push(`  Percentile : ${percentileLabel(st.percentile)} — ${zoneLabel(st.percentile)}`)
        }
        if (st.score_brut.trim()) lines.push(`  Score brut : ${st.score_brut.trim()}`)
        if (st.temps.trim()) lines.push(`  Temps : ${st.temps.trim()}`)
        for (const s of subWithPct) {
          const sub = st.subtests[s.key]
          const sline = `  Subtest "${s.label}" : ${percentileLabel(sub.percentile)} — ${zoneLabel(sub.percentile)}`
          lines.push(sline)
          if (sub.score_brut.trim()) lines.push(`    Score brut : ${sub.score_brut.trim()}`)
          if (sub.temps.trim()) lines.push(`    Temps : ${sub.temps.trim()}`)
        }
        if (st.observation.trim()) lines.push(`  Observation : ${st.observation.trim()}`)
      }
      lines.push('')
    }
    // Synthèse zones
    const total = zoneCounts.excellent + zoneCounts.moyenne_haute + zoneCounts.moyenne_basse + zoneCounts.fragilite + zoneCounts.difficulte + zoneCounts.difficulte_severe
    if (total > 0) {
      lines.push('--- Synthèse zones percentiles ---')
      lines.push(`Excellent (≥ P90) : ${zoneCounts.excellent}`)
      lines.push(`Moyenne haute (P50-P90) : ${zoneCounts.moyenne_haute}`)
      lines.push(`Moyenne basse (P25-P50) : ${zoneCounts.moyenne_basse}`)
      lines.push(`Fragilité (P10-P25) : ${zoneCounts.fragilite}`)
      lines.push(`Difficulté (P5-P10) : ${zoneCounts.difficulte}`)
      lines.push(`Difficulté sévère (< P5) : ${zoneCounts.difficulte_severe}`)
    }
    onResultatsChange(lines.join('\n'))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, totalSaisies, zoneCounts])

  const handleMainPercentile = (epKey: EpreuveKey, v: PercentileKey) => {
    setState(s => ({ ...s, epreuves: { ...s.epreuves, [epKey]: { ...s.epreuves[epKey], percentile: v } } }))
  }
  const handleSubPercentile = (epKey: EpreuveKey, subKey: string, v: PercentileKey) => {
    setState(s => ({
      ...s,
      epreuves: {
        ...s.epreuves,
        [epKey]: {
          ...s.epreuves[epKey],
          subtests: {
            ...s.epreuves[epKey].subtests,
            [subKey]: { ...s.epreuves[epKey].subtests[subKey], percentile: v },
          },
        },
      },
    }))
  }
  const handleField = (epKey: EpreuveKey, field: 'score_brut' | 'temps' | 'observation', value: string) => {
    setState(s => ({ ...s, epreuves: { ...s.epreuves, [epKey]: { ...s.epreuves[epKey], [field]: value } } }))
  }
  const handleSubField = (epKey: EpreuveKey, subKey: string, field: 'score_brut' | 'temps', value: string) => {
    setState(s => ({
      ...s,
      epreuves: {
        ...s.epreuves,
        [epKey]: {
          ...s.epreuves[epKey],
          subtests: {
            ...s.epreuves[epKey].subtests,
            [subKey]: { ...s.epreuves[epKey].subtests[subKey], [field]: value },
          },
        },
      },
    }))
  }
  const handleNonPassee = (epKey: EpreuveKey, v: boolean) => {
    setState(s => ({ ...s, epreuves: { ...s.epreuves, [epKey]: { ...s.epreuves[epKey], non_passee: v } } }))
  }

  return (
    <div className="space-y-4">
      {/* Bandeau Examath */}
      <div className="flex items-start gap-2 p-3 rounded-lg border border-indigo-200 bg-indigo-50">
        <Calculator size={18} className="text-indigo-600 shrink-0 mt-0.5" />
        <div className="text-sm">
          <p className="font-semibold text-indigo-900">Saisie structurée Examath 8-15 — 6 modules officiels</p>
          <p className="text-indigo-700 text-xs mt-0.5 leading-relaxed">
            Reportez le <strong>percentile</strong> affiché par le logiciel HappyNeuron pour chaque épreuve / subtest.
            Seuil officiel de pathologie : <strong>P ≤ 10</strong>. P ≤ 5 = pathologie sévère.
            Cochez « non passée » pour exclure une épreuve du CRBO. Les normes sont stratifiées par niveau scolaire — sélectionnez-le ci-dessous.
          </p>
        </div>
      </div>

      {/* Niveau scolaire (stratification officielle de l'étalonnage) */}
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <label className="flex items-center gap-2 text-sm font-semibold text-gray-900 mb-2">
          <Info size={14} className="text-indigo-600" />
          Niveau scolaire au moment de la passation
        </label>
        <select
          value={state.niveau}
          onChange={(e) => setState(s => ({ ...s, niveau: e.target.value as State['niveau'] }))}
          className="w-full sm:w-72 px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
        >
          {NIVEAU_OPTIONS.map(o => (
            <option key={o.key} value={o.key}>{o.label}</option>
          ))}
        </select>
        <p className="text-[11px] text-gray-500 mt-1">
          Étalonnage officiel HappyNeuron : CE2 / CM1 / CM2 / 6e-5e (508 enfants).
          Certaines épreuves ne s&apos;appliquent qu&apos;au CM2+ (numération fractionnaire, Comparaison ×, Problème composé).
        </p>
      </div>

      {/* Synthèse zones (visible dès la 1ère saisie) */}
      {totalSaisies > 0 && (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
          <p className="text-xs font-semibold text-gray-700 mb-2">
            Répartition par zone — {totalSaisies}/{MODULES.reduce((acc, m) => acc + m.epreuves.length, 0)} épreuves saisies
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

      {/* Modules en accordéon */}
      {MODULES.map(m => {
        const open = expanded[m.id]
        return (
          <div key={m.id} className="rounded-lg border border-gray-200 bg-white">
            <button
              type="button"
              onClick={() => setExpanded(prev => ({ ...prev, [m.id]: !prev[m.id] }))}
              className="w-full px-4 py-3 flex items-center justify-between gap-3 text-left hover:bg-gray-50"
            >
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-900">
                  Module {m.num} — {m.label}
                </p>
                <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{m.description}</p>
              </div>
              <ChevronDown size={16} className={`shrink-0 transition-transform ${open ? '' : '-rotate-90'}`} />
            </button>

            {open && (
              <div className="border-t border-gray-100 px-4 py-3 space-y-4">
                {m.epreuves.map(e => {
                  const st = state.epreuves[e.key]
                  const hasSubtests = (e.subtests?.length ?? 0) > 0
                  return (
                    <div key={e.key} className="rounded border border-gray-100 bg-gray-50/50 p-3">
                      <div className="flex items-start justify-between gap-3 flex-wrap">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                            {e.label}
                            {e.tag && (
                              <span className="text-[10px] font-medium text-gray-500 px-1.5 py-0.5 rounded bg-white border border-gray-200">
                                {e.tag === 'AA' ? 'arrêt auto' : e.tag === 'chrono' ? '⏱ chrono' : '⏱ + arrêt auto'}
                              </span>
                            )}
                            {e.niveau_specifique && (
                              <span className="text-[10px] font-medium text-amber-700 px-1.5 py-0.5 rounded bg-amber-50 border border-amber-200">
                                {e.niveau_specifique}
                              </span>
                            )}
                          </p>
                          <p className="text-[11px] text-gray-600 mt-0.5 leading-relaxed">{e.description}</p>
                        </div>
                        <label className="text-xs text-gray-600 flex items-center gap-1.5 shrink-0">
                          <input
                            type="checkbox"
                            checked={st.non_passee}
                            onChange={(ev) => handleNonPassee(e.key, ev.target.checked)}
                            className="rounded"
                          />
                          Non passée
                        </label>
                      </div>

                      {!st.non_passee && (
                        <div className="mt-2 space-y-2">
                          {/* Saisie principale (pas de subtests) ou subtests */}
                          {!hasSubtests ? (
                            <>
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-[11px] font-medium text-gray-700 w-24 shrink-0">Percentile :</span>
                                <PercentileChips value={st.percentile} onChange={(v) => handleMainPercentile(e.key, v)} />
                              </div>
                              <div className="grid sm:grid-cols-2 gap-2">
                                <div className="flex items-center gap-2">
                                  <span className="text-[11px] text-gray-600 w-24 shrink-0">Score brut :</span>
                                  <input
                                    type="text"
                                    value={st.score_brut}
                                    onChange={(ev) => handleField(e.key, 'score_brut', ev.target.value)}
                                    placeholder="(optionnel)"
                                    className="flex-1 px-2 py-1 border border-gray-300 rounded text-xs"
                                  />
                                </div>
                                {(e.tag === 'chrono' || e.tag === 'chrono+AA') && (
                                  <div className="flex items-center gap-2">
                                    <span className="text-[11px] text-gray-600 w-24 shrink-0">Temps :</span>
                                    <input
                                      type="text"
                                      value={st.temps}
                                      onChange={(ev) => handleField(e.key, 'temps', ev.target.value)}
                                      placeholder="ex. 2 min 30"
                                      className="flex-1 px-2 py-1 border border-gray-300 rounded text-xs"
                                    />
                                  </div>
                                )}
                              </div>
                            </>
                          ) : (
                            <div className="space-y-2">
                              {(e.subtests ?? []).map(s => {
                                const sub = st.subtests[s.key]
                                return (
                                  <div key={s.key} className="rounded bg-white border border-gray-200 p-2">
                                    <p className="text-[11px] font-semibold text-gray-800 mb-1 flex items-center gap-1.5">
                                      • {s.label}
                                      {s.tag && (
                                        <span className="text-[9px] font-medium text-gray-500 px-1 py-0.5 rounded bg-gray-50 border border-gray-200">
                                          {s.tag === 'AA' ? 'AA' : s.tag === 'chrono' ? '⏱' : '⏱+AA'}
                                        </span>
                                      )}
                                    </p>
                                    <PercentileChips value={sub.percentile} onChange={(v) => handleSubPercentile(e.key, s.key, v)} />
                                    <div className="grid sm:grid-cols-2 gap-1.5 mt-1.5">
                                      <input
                                        type="text"
                                        value={sub.score_brut}
                                        onChange={(ev) => handleSubField(e.key, s.key, 'score_brut', ev.target.value)}
                                        placeholder="Score brut (opt.)"
                                        className="px-2 py-1 border border-gray-200 rounded text-[11px]"
                                      />
                                      {(s.tag === 'chrono' || s.tag === 'chrono+AA') && (
                                        <input
                                          type="text"
                                          value={sub.temps}
                                          onChange={(ev) => handleSubField(e.key, s.key, 'temps', ev.target.value)}
                                          placeholder="Temps (opt.)"
                                          className="px-2 py-1 border border-gray-200 rounded text-[11px]"
                                        />
                                      )}
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          )}

                          {/* Observation */}
                          <div className="flex items-start gap-2 mt-2">
                            <span className="text-[11px] text-gray-600 w-24 shrink-0 pt-1">Observation :</span>
                            <textarea
                              value={st.observation}
                              onChange={(ev) => handleField(e.key, 'observation', ev.target.value)}
                              rows={2}
                              placeholder="Stratégies, type d'erreurs, attitudes…"
                              className="flex-1 px-2 py-1 border border-gray-300 rounded text-xs leading-relaxed resize-y focus:outline-none focus:ring-2 focus:ring-indigo-400"
                            />
                          </div>
                        </div>
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
            Notes globales sur la séance (comportement, fatigabilité, stratégies)
          </label>
          <MicButton value={notes} onChange={onNotesChange} />
        </div>
        <textarea
          value={notes}
          onChange={(e) => onNotesChange(e.target.value)}
          rows={3}
          placeholder="Ex. enfant attentif sur les 30 premières minutes puis fatigue marquée. Comptage sur les doigts persistant sur la fluence. Anxiété visible sur les épreuves chronométrées."
          className="w-full px-3 py-2 border border-gray-300 rounded text-sm leading-relaxed resize-y focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />
      </div>

      {/* Rappels cliniques */}
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
        <div className="flex items-start gap-2">
          <Brain size={16} className="text-amber-700 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-900 leading-relaxed">
            <p className="font-semibold mb-1">Rappels cliniques Examath</p>
            <ul className="list-disc list-inside space-y-0.5">
              <li><strong>Q1 = P25</strong> = zone moyenne basse, NORMAL. Jamais déficitaire.</li>
              <li><strong>Module 1</strong> (Habiletés numériques de base) = marqueur central de la dyscalculie. ≥ 2 épreuves P ≤ 10 = critère diagnostic.</li>
              <li><strong>Module 6 préservé</strong> = critère différentiel fort (élimine déficience intellectuelle / TDL global).</li>
              <li>Toujours croiser avec <strong>Exalang du même âge</strong> (8-11 ou 11-15) : co-morbidité dyscalculie + dyslexie dans 30-40 % des cas.</li>
              <li>Comptage sur doigts persistant après CE1, tables défaillantes au CM1+ = défaut d&apos;automatisation à signaler.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
