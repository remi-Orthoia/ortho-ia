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

import { useEffect, useMemo, useRef, useState } from 'react'
import { Brain, Calculator, ChevronDown, FileUp, Info, Loader2 } from 'lucide-react'
import MicButton from '../MicButton'

interface Props {
  notes: string
  onNotesChange: (v: string) => void
  onResultatsChange: (normalized: string) => void
  onError?: (msg: string) => void
}

/** Identifiant stable d'une épreuve. Format : `m{module}_{slug}`. */
type EpreuveKey = string

/** Percentile officiel HappyNeuron + zone correspondante. La palette CRBO
 *  ortho.ia utilise 6 zones (refonte Laurie 2026-05-ter). Exalang n'affiche
 *  JAMAIS de bande <P5 — la bande la plus basse est P1-P5. */
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
  { key: 'p_sup_95', label: '> P95',     value: 97, zone: 'excellent',         chip: 'bg-emerald-700', text: 'text-white' },
  { key: 'p_90_95',  label: 'P91 — P95', value: 92, zone: 'excellent',         chip: 'bg-emerald-600', text: 'text-white' },
  { key: 'p_75_90',  label: 'P76 — P90', value: 80, zone: 'excellent',         chip: 'bg-emerald-500', text: 'text-white' },
  { key: 'p_50_75',  label: 'P50 — P75', value: 60, zone: 'moyenne_haute',     chip: 'bg-emerald-300', text: 'text-emerald-900' },
  { key: 'p_25_50',  label: 'P26 — P49', value: 35, zone: 'moyenne_basse',     chip: 'bg-yellow-300',  text: 'text-yellow-900' },
  { key: 'p_10_25',  label: 'P11 — P25', value: 18, zone: 'fragilite',         chip: 'bg-orange-300',  text: 'text-orange-900' },
  { key: 'p_5_10',   label: 'P6 — P10',  value: 7,  zone: 'difficulte',        chip: 'bg-orange-500',  text: 'text-white' },
  { key: 'p_inf_5',  label: 'P1 — P5',   value: 3,  zone: 'difficulte_severe', chip: 'bg-red-600',     text: 'text-white' },
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

// Refonte 2026-06 : alignement strict sur le manuel officiel Examath 8-15
// (Lafay & Helloin, HappyNeuron 2016). 40 épreuves officielles réparties
// en 6 modules + 1 sous-section "Numération décimale et fractionnaire"
// (CM2+) intégrée dans le M2.
//
// Backward compat : certaines clés conservent le préfixe historique m2_*
// même si elles ont été reclassées en M3 par le manuel (jugement_operations,
// calcul_fractions, estimation_resultat) — pour ne pas casser les drafts
// localStorage de l'ortho. Le rangement par MODULES dicte l'affichage UI.
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
        description: 'Comparer deux collections de points (sens du nombre non symbolique, SNA).',
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
        description: 'Estimer la position d\'un nombre sur une ligne 0-100 ou 0-1000. La compression logarithmique anormale après le CE2 est quasi-pathognomonique de la dyscalculie primaire.',
      },
      {
        key: 'm1_identification_quantites',
        label: 'Identification de quantités',
        description: 'Reconnaître rapidement de petites quantités sans dénombrement (subitizing, SNP).',
        subtests: [
          { key: 'subitizing', label: 'Subitizing' },
        ],
      },
      {
        key: 'm1_denombrement_calcul',
        label: 'Dénombrement et calcul',
        description: 'Dénombrer une collection jusqu\'à 25 + production de collection. Noter la stratégie : sur les doigts, par groupes, comptage 1 par 1.',
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
    description: 'Numération base 10 (transcodage, valeur positionnelle) + numération décimale/fractionnaire (CM2+). 9 épreuves au total.',
    epreuves: [
      // M2 - Numération base 10 (5 épreuves)
      {
        key: 'm2_transcodage',
        label: 'Transcodage',
        tag: 'chrono',
        description: 'Lire et écrire les nombres en chiffres et en lettres. Analyser les erreurs : lexicales (quatorze/quarante) vs syntaxiques (3008 pour 308 = défaut conversion arabe→verbal).',
        subtests: [
          { key: 'lecture_1_99',  label: 'Lecture 1 à 99',           tag: 'chrono' },
          { key: 'lecture_99p',   label: 'Lecture 99+',              tag: 'chrono+AA' },
          { key: 'dictee_1_99',   label: 'Dictée 1 à 99',            tag: 'chrono' },
          { key: 'dictee_99p',    label: 'Dictée 99+',               tag: 'chrono+AA' },
        ],
      },
      {
        key: 'm2_repetition_grands_nombres',
        label: 'Répétition de grands nombres',
        description: 'Répéter oralement un grand nombre lu par l\'examinateur. Mesure le code verbal du nombre + boucle phonologique. Échec = signal MdT verbale fragile (à croiser avec empan endroit Exalang).',
      },
      {
        key: 'm2_identification_udcm',
        label: "Identification d'U/D/C/M",
        tag: 'AA',
        description: 'Identifier les unités, dizaines, centaines, milliers d\'un nombre — valeur positionnelle. Échec massif au CM1+ = défaut central de représentation base 10.',
      },
      {
        key: 'm2_relation_arabe_analogique_udc',
        label: 'Relation Arabe / Analogique U-D-C',
        description: 'Représenter et lire des nombres en représentation U-D-C (base 10 imagée : cubes/barres/plaques).',
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
        description: 'Décomposer un nombre en somme de centaines, dizaines, unités. Marqueur de la maîtrise de la base 10.',
      },
      // M2 - Numération décimale et fractionnaire (4 épreuves, CM2+)
      {
        key: 'm2_fractions_images',
        label: 'Fractions en images',
        description: 'Identifier des fractions à partir de représentations imagées (parts d\'un tout colorées). Conceptualisation fractionnaire de base.',
        niveau_specifique: 'CM2+',
      },
      {
        key: 'm2_ligne_numerique_fractions',
        label: 'Ligne numérique — Fractions',
        description: 'Positionner une fraction sur une ligne 0-1. Plus exigeant qu\'images car nécessite la représentation analogique de la quantité fractionnaire.',
        niveau_specifique: 'CM2+',
      },
      {
        key: 'm2_jugement_ecriture_decimale',
        label: "Jugement d'écriture décimale",
        description: 'Juger si une écriture décimale est valide. Détecte les confusions classiques type "2,10 > 2,9".',
        niveau_specifique: 'CM2+',
      },
      {
        key: 'm2_comparaison_fractions',
        label: 'Comparaison de fractions',
        description: 'Comparer deux fractions. Croiser avec Ligne numérique fractions pour identifier le défaut de représentation analogique.',
        niveau_specifique: 'CM2+',
      },
    ],
  },
  {
    id: 'm3',
    num: 3,
    label: 'Arithmétique',
    description: 'Récupération des faits, mécanismes opératoires posés, calcul mental complexe, estimation, calcul avec fractions. 7 épreuves.',
    epreuves: [
      {
        key: 'm3_operations_analogiques',
        label: 'Opérations analogiques',
        tag: 'AA',
        description: 'Opérations sur représentations imagées (avant le passage au symbolique). Préservé = représentations préservées, l\'écart sur le calcul symbolique reflète un défaut d\'accès au sens du nombre.',
      },
      {
        key: 'm2_jugement_operations',
        label: "Jugement d'opérations",
        description: 'Estimer la plausibilité du résultat d\'une opération (réservé CM2+). Marqueur du sens du nombre opérationnel.',
        niveau_specifique: 'CM2+',
      },
      {
        key: 'm3_fluence_arithmetique',
        label: 'Fluence arithmétique',
        tag: 'chrono',
        description: 'Vitesse de récupération des faits arithmétiques. Tables défaillantes au CM1+ = signal fort dyscalculie. Comptage sur doigts persistant après le CE1 = défaut d\'automatisation.',
        subtests: [
          { key: 'additions',       label: 'Additions',       tag: 'chrono' },
          { key: 'soustractions',   label: 'Soustractions',   tag: 'chrono' },
          { key: 'multiplications', label: 'Multiplications', tag: 'chrono' },
        ],
      },
      {
        key: 'm3_calcul_mental_complexe',
        label: 'Calcul mental complexe',
        description: 'Calculs mentaux multi-étapes (ex. retenue, plusieurs opérations). Mobilise la MdT + automatisation des faits + procédures. Discriminant pour les profils compensés (faits OK mais MdT faible).',
      },
      {
        key: 'm3_mecanismes_operatoires',
        label: 'Mécanismes opératoires écrits',
        tag: 'AA',
        description: 'Opérations posées sur le papier. Procédure préservée = profil compensé même si calcul mental déficitaire. Erreurs systématiques (oubli retenue, sens posé inversé) = défaut procédural pur.',
        subtests: [
          { key: 'additions',     label: 'Additions',     tag: 'AA' },
          { key: 'soustractions', label: 'Soustractions', tag: 'AA' },
          { key: 'multiplication', label: 'Multiplication', tag: 'AA' },
        ],
      },
      {
        key: 'm2_calcul_fractions',
        label: 'Calcul avec fractions',
        description: 'Calculs avec fractions simples (addition, soustraction, multiplication). Plus complexe : sollicite la représentation fractionnaire + procédures.',
        niveau_specifique: 'CM2+',
      },
      {
        key: 'm2_estimation_resultat',
        label: 'Estimation de résultat',
        description: 'Estimer l\'ordre de grandeur d\'un résultat avant calcul. Forte sollicitation du sens du nombre — déficit = signal fort dyscalculie primaire.',
        niveau_specifique: 'CM2+',
      },
    ],
  },
  {
    id: 'm4',
    num: 4,
    label: 'Mesures',
    description: 'Approche contextuelle des unités (cm, m, kg, l, mn, m²) + équivalences + problèmes de mesures. 3 épreuves.',
    epreuves: [
      {
        key: 'm4_approche_mesures',
        label: 'Approche contextuelle des mesures',
        description: 'Associer une unité (cm, m, kg, l, mn, m²) à un objet ou un contexte usuel. Peu spécifique en isolé — dépend de l\'expérience de vie quotidienne.',
      },
      {
        key: 'm4_equivalence_comparaison',
        label: 'Équivalence et Comparaison',
        description: 'Convertir entre unités (cm ↔ m, g ↔ kg, ...) et comparer des mesures. Sollicite la base 10 + le sens du nombre.',
      },
      {
        key: 'm4_problemes_mesures',
        label: 'Problèmes de mesures',
        description: 'Problèmes verbalisés mobilisant des grandeurs et conversions. À croiser avec M5 pour différencier difficulté problème vs difficulté conversion d\'unités.',
      },
    ],
  },
  {
    id: 'm5',
    num: 5,
    label: 'Résolution de problèmes arithmétiques',
    description: 'Compréhension d\'énoncé verbal + modélisation + exécution. 9 épreuves. Déficit isolé sur ce module = souvent secondaire (dyslexie, trouble du langage, MdT verbale).',
    epreuves: [
      {
        key: 'm5_combinaison_plus',
        label: 'Combinaison +',
        description: 'Recherche d\'une combinaison/composition + valeur complément. Addition simple à élaborer depuis l\'énoncé.',
      },
      {
        key: 'm5_transformation_plus',
        label: 'Transformation +',
        tag: 'AA',
        description: 'Ajout / retrait avec recherche de la situation finale, transformation, ou situation initiale (6 sous-items). Plus exigeant que combinaison car nécessite la modélisation temporelle.',
      },
      {
        key: 'm5_comparaison_plus',
        label: 'Comparaison +',
        tag: 'AA',
        description: 'Comparaisons « Plus que » / « Moins que » avec recherche de valeur supérieure, inférieure, ou différence. Les structures inverses (« moins de X que Y, Y = ? ») exigent une forte inhibition du référent linguistique.',
      },
      {
        key: 'm5_proportionnalite',
        label: 'Proportionnalité simple et directe ×',
        description: 'Recherche de quantité d\'unités (division partage), valeur multipliée (4ᵉ proportionnelle), valeur unitaire (division regroupement).',
      },
      {
        key: 'm5_proportionnalite_composee',
        label: 'Proportionnalité simple composée ×',
        description: 'Proportionnalité avec étape intermédiaire de calcul. CM2 uniquement.',
        niveau_specifique: 'CM2+',
      },
      {
        key: 'm5_proportionnalite_multiple',
        label: 'Proportionnalité multiple ×',
        description: 'Proportionnalité à plusieurs niveaux de variables (ex. unités et débits). 6e+ uniquement.',
        niveau_specifique: '6e+',
      },
      {
        key: 'm5_comparaison_x',
        label: 'Comparaison ×',
        tag: 'AA',
        description: 'Multiplication / division avec comparaisons « Fois plus que » / « Fois moins que ». CM2 uniquement.',
        niveau_specifique: 'CM2+',
      },
      {
        key: 'm5_probleme_compose',
        label: 'Problème composé',
        description: 'Problème à plusieurs étapes nécessitant la coordination de plusieurs opérations. CM2 uniquement.',
        niveau_specifique: 'CM2+',
      },
      {
        key: 'm5_problemes_composes',
        label: 'Problèmes composés',
        description: 'Problèmes complexes coordonnant 3+ opérations / variables. 6e+ uniquement.',
        niveau_specifique: '6e+',
      },
    ],
  },
  {
    id: 'm6',
    num: 6,
    label: 'Langage et raisonnement',
    description: 'Préservation = critère différentiel important. Déficit associé = orienter vers bilan langagier (Exalang). 6 épreuves.',
    epreuves: [
      {
        key: 'm6_inferences_images',
        label: 'Inférences en images',
        description: '12 scènes images : déduction logique sans support verbal (Fonte de l\'igloo, Esquimau pêcheur, Chat sur le toit, Vol de fruits, Serpent, Ours polaire, Voleur, Porte-monnaie vide, Pizza fourmis, Chocolats gourmand, Voleur attrapé, Robinson).',
      },
      {
        key: 'm6_inferences_logiques',
        label: 'Inférences logiques non verbales',
        description: 'Raisonnement logique sur des supports non verbaux (suites, analogies). Aide à différencier difficulté logique pure vs difficulté verbale.',
      },
      {
        key: 'm6_inferences_verbales',
        label: 'Inférences verbales',
        description: 'Inférences à partir d\'énoncés verbaux. Échec ici + Inférences images préservées = orientation vers trouble du langage / compréhension.',
      },
      {
        key: 'm6_inferences_lexicales',
        label: 'Inférences lexicales et sémantiques',
        description: 'Inférences sur du vocabulaire et sens — accès lexical sémantique. Croiser avec Exalang Lexique-sémantique en cas de déficit.',
      },
      {
        key: 'm6_lexique_math',
        label: 'Mathématique — Lexique',
        description: 'Vocabulaire spécifique mathématique (somme, différence, produit, double, moitié...). Important pour le langage mathématique en classe — défaut isolé peut expliquer beaucoup de difficultés en problèmes.',
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
  { key: '4e_3e', label: '4e-3e (~13-15 ans)' },
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
    case 'fragilite': return 'Zone de fragilité'
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

export default function ExamathScoresInput({ notes, onNotesChange, onResultatsChange, onError }: Props) {
  const [state, setState] = useState<State>(emptyState)
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    m1: true, m2: false, m3: false, m4: false, m5: false, m6: false,
  })

  // Import PDF Examath — route /api/extract-examath-pdf.
  // Pre-remplit niveau + 40 epreuves (percentile + subtests + temps + observation)
  // depuis un rapport HappyNeuron Pro ou scan cahier.
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [importing, setImporting] = useState(false)
  const [importInfo, setImportInfo] = useState<string | null>(null)

  async function handleImportFile(file: File) {
    setImporting(true)
    setImportInfo(null)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/extract-examath-pdf', { method: 'POST', body: fd })
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
          subtests: Record<string, { percentile: string; score_brut: string; temps: string }>
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
          if (!(item.key in next.epreuves)) continue
          const cur = next.epreuves[item.key]
          // Merge subtests : ne pas ecraser les saisies existantes si le PDF est vide.
          const mergedSubs: Record<string, SubtestState> = { ...cur.subtests }
          for (const [k, v] of Object.entries(item.subtests ?? {})) {
            mergedSubs[k] = {
              percentile: ((v.percentile as PercentileKey) || mergedSubs[k]?.percentile || ''),
              score_brut: v.score_brut || mergedSubs[k]?.score_brut || '',
              temps: v.temps || mergedSubs[k]?.temps || '',
            }
          }
          next.epreuves[item.key] = {
            percentile: (item.percentile as PercentileKey) || cur.percentile,
            score_brut: item.score_brut || cur.score_brut,
            temps: item.temps || cur.temps,
            observation: item.observation || cur.observation,
            non_passee: !!item.non_passee,
            subtests: mergedSubs,
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
          <p className="font-semibold text-indigo-900">Saisie structurée Examath 8-15 — 6 modules officiels, 40 épreuves</p>
          <p className="text-indigo-700 text-xs mt-0.5 leading-relaxed">
            Reportez le <strong>percentile</strong> affiché par le logiciel HappyNeuron pour chaque épreuve / subtest.
            Seuil officiel de pathologie : <strong>P ≤ 10</strong>. P ≤ 5 = pathologie sévère.
            Cochez « non passée » pour exclure une épreuve du CRBO. Les normes sont stratifiées par niveau scolaire (CE2 → 3e) — sélectionnez-le ci-dessous.
          </p>
        </div>
      </div>

      {/* Import PDF Examath — rapport HappyNeuron Pro ou scan cahier. */}
      <div className="rounded-lg border border-sky-200 bg-sky-50/60 p-3">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="flex items-start gap-2 min-w-0">
            <FileUp size={18} className="text-sky-700 shrink-0 mt-0.5" />
            <div className="text-sm min-w-0">
              <p className="font-semibold text-sky-900">Importer un document Examath (optionnel)</p>
              <p className="text-sky-800 text-xs mt-0.5 leading-relaxed">
                Format accepté : <strong>PDF uniquement</strong> (rapport HappyNeuron Pro ou scan cahier rempli). L&apos;extracteur dédié pré-remplit niveau + percentiles + sous-scores des 40 épreuves.
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
