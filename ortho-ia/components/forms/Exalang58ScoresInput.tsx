'use client'

/**
 * Saisie structurée Exalang 5-8 — Thibault, Helloin, Croteau (Orthomotus 2010).
 *
 * Refonte 2026-06 : alignement sur le manuel officiel (4 700 mots,
 * `docs/Bilans Sources/manuel exalang 5-8.pdf`). La version précédente
 * reprenait la nomenclature Exalang 8-11 (5 groupes A.1/A.2/B.1/B.2/C.1,
 * 14 épreuves) qui ne correspond PAS à la structure officielle Exalang 5-8.
 *
 * Source de vérité : manuel officiel Orthomotus 2010, qui décrit **7
 * modules / 35 épreuves** et étalonne sur **4 niveaux** : GSM, mi-CP,
 * CP-CE1 (fin CP), CE1-CE2 (fin CE1). Cotation parallèle percentile (P5 →
 * >P95) + Notes Standard 1-5 quand calculables.
 *
 * Couplage : nouveau-crbo/page.tsx, test_utilise === ['Exalang 5-8'].
 */

import { useEffect, useMemo, useRef, useState } from 'react'
import { BookOpen, ChevronDown, FileUp, GitCompare, Info, Loader2 } from 'lucide-react'
import MicButton from '../MicButton'
import type { CRBOStructure } from '@/lib/prompts'

interface Props {
  notes: string
  onNotesChange: (v: string) => void
  onResultatsChange: (normalized: string) => void
  onError?: (msg: string) => void
  /** MODE RENOUVELLEMENT — structure du bilan précédent extraite depuis le
   *  bouton d'import "bilan précédent" de l'étape 4 du wizard. Si présente,
   *  le form affiche un encart d'évolution live (compteurs progrès / stable /
   *  régression / nouvelles) qui reflète ce que produira le tableau comparatif
   *  Word. Matching par label, seuil ±10 sur percentile_value — aligné sur
   *  `lib/word-export.ts` et le prompt Exalang 5-8. */
  bilanPrecedentStructure?: CRBOStructure | null
  /** Date du bilan précédent (ISO yyyy-mm-dd) — affichée dans l'encart. */
  bilanPrecedentDate?: string | null
}

type PercentileKey =
  | '' | 'p_sup_95' | 'p_90_95' | 'p_75_90' | 'p_50_75' | 'p_25_50' | 'p_10_25' | 'p_5_10' | 'p_inf_5'

// Grille 6 zones imposée Laurie (refonte 2026-05-ter). Les bandes d'affichage
// du logiciel Exalang (manuel p. 12) sont projetées sur les 6 zones cliniques.
// Exalang n'affiche JAMAIS de bande < P5 — la bande la plus basse est P1-P5.
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

/** Notes Standard officielles Exalang 5-8 (manuel p. 13-15). Échelle à 5
 *  classes basées sur z = ±0.5, ±1.5. Certaines épreuves sont plafonnées
 *  (classes 4 et 5 confondues ou 3-4-5 confondues) à cause d'un effet de
 *  saturation, dans ce cas le manuel affiche L4 max. */
type NSKey = '' | 'ns_1' | 'ns_2' | 'ns_3' | 'ns_4' | 'ns_5'

const NS_OPTIONS: Array<{ key: Exclude<NSKey, ''>; label: string; hint: string; chip: string }> = [
  { key: 'ns_1', label: 'NS 1', hint: '6,7 % les plus faibles (z < -1.5) — Pathologique', chip: 'bg-red-600 text-white' },
  { key: 'ns_2', label: 'NS 2', hint: '24,2 % suivants (z -1.5 à -0.5) — Faible / déficitaire', chip: 'bg-orange-400 text-white' },
  { key: 'ns_3', label: 'NS 3', hint: '38,2 % centraux (z -0.5 à +0.5) — Moyenne attendue', chip: 'bg-emerald-300 text-emerald-900' },
  { key: 'ns_4', label: 'NS 4', hint: '24,2 % (z +0.5 à +1.5) — Supérieur', chip: 'bg-emerald-500 text-white' },
  { key: 'ns_5', label: 'NS 5', hint: '6,7 % les plus élevés (z > +1.5) — Très supérieur', chip: 'bg-emerald-700 text-white' },
]

interface Epreuve {
  key: string
  label: string
  hint?: string
  /** Tag de niveau si épreuve restreinte ou marquée (mi-CP, CP-CE1, etc.). */
  tag?: string
  /** Doc note manuel : épreuve "non significative" avant un certain niveau. */
  warning?: string
}

interface Module {
  code: string
  label: string
  description: string
  epreuves: Epreuve[]
}

/** 7 modules officiels Exalang 5-8 (manuel p. 18-44, structure verbatim).
 *  Les libellés des épreuves sont ceux du module résultats et du cahier
 *  de passation — ne pas reformuler. */
const MODULES: Module[] = [
  {
    code: 'M1',
    label: 'Langage oral',
    description: 'Langage semi-induit (dessin animé), dénomination, compréhension de récit, morpho-syntaxe en réception, lexique évoqué, métamorphologie.',
    epreuves: [
      { key: 'dessin_anime', label: 'Dessin animé', hint: 'Langage semi-induit, cotation cohérence (production, adéquation, informativité) + cohésion (syntaxe, formes verbales, expansions, anaphores). Score sur 22.' },
      { key: 'denomination', label: 'Dénomination', hint: 'Lexique imagé sur 44 + analyse qualitative articulatoire (troubles de sortie).' },
      { key: 'comprehension_recit', label: 'Compréhension de récit', hint: 'Récit "Mélina la Sorcière" : remise en ordre (0-2), reformulation, question ouverte. Score sur 5.' },
      { key: 'jugement_grammaticalite', label: 'Jugement de grammaticalité', hint: 'Morpho-syntaxe en réception, 16 items. Cotation de -2 (refus de phrase bonne) à +2 (correction d\'erreur).' },
      { key: 'comprehension_syntaxique', label: 'Compréhension syntaxique', hint: '12 questions sur 4 blocs de complexité croissante. Lexique + syntaxe.' },
      { key: 'fluence_semantique', label: 'Fluence sémantique', hint: 'Aliments/boissons, 1 minute. Accès lexical et rapidité d\'évocation.' },
      { key: 'metamorphologie', label: 'Métamorphologie', hint: 'Famille de mots ("plus petit de"). Prédicteur de l\'orthographe lexicale ultérieure.' },
    ],
  },
  {
    code: 'M2',
    label: 'Phonologie',
    description: 'Discrimination auditive, répétition de logatomes, fluence phonémique, conscience syllabique et phonémique.',
    epreuves: [
      { key: 'similarites_dissemblances', label: 'Similarités - dissemblances', hint: 'Discrimination auditive infra-segmentale, paires de non-mots phonologiquement voisins.' },
      { key: 'repetition_logatomes', label: 'Répétition de logatomes', hint: 'Boucle phonologique (Baddeley) + sortie articulatoire. Marqueur précoce dyslexie phonologique. Score sur 24.' },
      { key: 'fluence_phonemique', label: 'Fluence phonémique', hint: 'Mots commençant par /f/, 1 minute. Progression nette entre non-lecteurs et lecteurs.' },
      { key: 'comptage_syllabique', label: 'Comptage syllabique', hint: '"Bataille des animaux" : choisir le mot le plus long et compter les syllabes. Score sur 10. Croissance fin GSM → fin CP.' },
      { key: 'rimes', label: 'Rimes', hint: 'Conscience phonémique de la rime, 18 objets en 4 catégories (/i/, /on/, /o/, /l/).' },
      { key: 'segmentation_fusion_syllabique', label: 'Segmentation - fusion syllabique', tag: 'fin CP +', warning: 'Non significatif avant fin CP. Normalement échoué par les < 6 ans.', hint: 'Extraire 1re syllabe du mot A + 2e syllabe du mot B, fusionner. MdT + métaphonologie.' },
      { key: 'inversion_phonemique', label: 'Inversion phonémique', tag: 'fin CP +', warning: 'Non significatif avant fin CP. La conscience phonémique pure s\'installe avec la lecture.', hint: 'Manipulation phonémique. Confirme l\'installation de la conscience phonémique avec l\'apprentissage de la lecture.' },
    ],
  },
  {
    code: 'M3',
    label: 'Traitement visuo-attentionnel',
    description: 'Barrage de cibles, comparaison sérielle, complétion de formes, dénomination rapide (RAN).',
    epreuves: [
      { key: 'test_barrage', label: 'Test de barrage', hint: 'Recherche-cible (vélos parmi distracteurs). 2 sous-scores : temps + nombre de cibles trouvées.' },
      { key: 'comparaison_serielle', label: 'Comparaison sérielle', hint: 'Correspondance terme à terme. Croissance avec passage à la voie directe.' },
      { key: 'completion_formes', label: 'Complétion de formes', hint: 'Traitement visuo-spatial fin. Discrimination visuelle + représentations spatiales.' },
      { key: 'denomination_rapide', label: 'Dénomination rapide (RAN)', hint: '2 sous-scores : temps + erreurs. Marqueur dyslexie majeur (théorie du double déficit, Wolf & Bowers).' },
    ],
  },
  {
    code: 'M4',
    label: 'Entrées visuelle et auditive',
    description: 'Reconnaissance d\'objets superposés, reconnaissance de bruits.',
    epreuves: [
      { key: 'figures_entremelees', label: 'Figures entremêlées', hint: 'Perception visuelle. Réponse approximativement correcte sémantiquement acceptée.' },
      { key: 'loto_sonore', label: 'Loto sonore', hint: 'Perception auditive. **Normalement saturée dès 5 ans** : échec ici = signal ORL + audiologie + attention.' },
    ],
  },
  {
    code: 'M5',
    label: 'Mémoire',
    description: 'Mémoire de travail verbale et visuelle, rappel libre et reconnaissance.',
    epreuves: [
      { key: 'empan_chiffres_endroit', label: 'Empan de chiffres endroit', hint: 'Boucle phonologique pure. Empan moyen : 4 à 5 ans, 5 à 8 ans. Adulte = 7±2 (Baddeley).' },
      { key: 'chiffres_envers', label: 'Chiffres à l\'envers', hint: 'Administrateur central. Empan envers << empan endroit = signal trouble exécutif / TDAH (à étayer par neuropsy).' },
      { key: 'empan_mots_monosyllabiques', label: 'Empan de mots monosyllabiques', hint: 'Empan verbal ~1 point sous l\'empan chiffres (effet phonologique).' },
      { key: 'memoire_visuelle', label: 'Mémoire visuelle', hint: 'Stockage non verbal. Rappel immédiat d\'images.' },
      { key: 'rappel_differe', label: 'Rappel différé', hint: '2 épreuves intercalées. Rappel libre à distance. Croît entre 5 et 6 ans, stagne 7-8 ans.' },
      { key: 'rappel_differe_reconnaissance', label: 'Rappel différé : reconnaissance', hint: '**Saturée à cet âge**. Échec = investigations attentionnelles + vérification entrée visuelle.' },
    ],
  },
  {
    code: 'M6',
    label: 'Lecture',
    description: 'Approche implicite (pré-lecteurs), lecture émergente mi-CP, lecture de mots et de texte (CP et CE1).',
    epreuves: [
      { key: 'approche_implicite_lecture', label: 'Approche implicite de la lecture', tag: 'GSM / mi-CP', hint: 'Pré-lecteurs. Capacités visuo-attentionnelles + connaissance implicite (lettre/mot/phrase, orientation). Score sur 22 ; < 15 = signal difficulté d\'entrée.' },
      { key: 'syllabes_mots_mi_cp', label: 'Syllabes et mots mi-CP', tag: 'mi-CP', hint: 'Sous-tâches : reconnaissance syllabes, mots fréquents simples, logatomes bisyllabiques. Score sur 45.' },
      { key: 'lecture_phrases_mi_cp', label: 'Lecture de phrases mi-CP', tag: 'mi-CP', hint: 'Lecture de phrases simples + désignation. Compréhension pragmatique précoce. Score sur 80.' },
      { key: 'segmentation_mots', label: 'Segmentation de mots', tag: 'CP-CE1', hint: 'Identification visuelle de mots dans un texte non segmenté. Stock orthographique + voie d\'adressage.' },
      { key: 'lecture_logatomes', label: 'Lecture de logatomes', tag: 'CP-CE1', hint: '**Voie d\'assemblage**. Marqueur dyslexie phonologique. Ne pas enchaîner avec transcription / répétition de logatomes (artefact mémoire).' },
      { key: 'lecture_mots', label: 'Lecture de mots (2 minutes)', tag: 'CP-CE1', hint: 'Lecture chronométrée. Quantitatif (mots lus en 2 min) + tableau qualitatif (mots vs non-mots, courts vs longs, réguliers vs irréguliers).' },
      { key: 'lecture_texte', label: 'Lecture de texte', tag: 'A=CP / B=CE1', hint: '2 niveaux (A = fin CP, B = fin CE1). Voies d\'accès + vitesse + compréhension. **À croiser avec Lecture de mots**.' },
      { key: 'lecture_texte_qcm', label: 'Lecture de texte — QCM (compréhension)', tag: 'A=CP / B=CE1', hint: '4 questions niveau A + 3 questions niveau B. Compréhension en lecture.' },
    ],
  },
  {
    code: 'M7',
    label: 'Orthographe',
    description: 'Closure de mots, transcription de logatomes, texte à compléter — analyse typologique phono / lexique / grammaire.',
    epreuves: [
      { key: 'closure_mots', label: 'Closure de mots', tag: 'A=CP / B=CE1', hint: 'Niveau A : 9 mots ; A+B : 18 mots. Analyse typologique double : phonologie (CGP) + lexique (graphie acquise).' },
      { key: 'transcription_logatomes', label: 'Transcription de logatomes', tag: 'CP-CE1', hint: 'Conversion phonème-graphème pure. À comparer aux 2 autres épreuves logatomes (répétition, lecture).' },
      { key: 'texte_a_completer', label: 'Texte à compléter', tag: 'A=CP / B=CE1', hint: 'Niveau A = CP, A+B = CE1. Analyse typologique triple : phonologie + lexique + grammaire. Grammaire pauvre en fin CE1 (~35 % réussite).' },
    ],
  },
]

/** 4 niveaux d'étalonnage officiels (manuel p. 11) + option "autre" (le
 *  logiciel permet de choisir librement la classe de référence pour un
 *  patient hors-borne). */
const NIVEAU_OPTIONS = [
  { key: '',          label: '— choisir —' },
  { key: 'GSM',       label: 'GSM — fin de Grande Section (~6 ans)' },
  { key: 'mi_CP',     label: 'mi-CP (~6 ans 6 mois)' },
  { key: 'CP_CE1',    label: 'CP-CE1 — fin de CP (~7 ans)' },
  { key: 'CE1_CE2',   label: 'CE1-CE2 — fin de CE1 (~8 ans)' },
  { key: 'autre',     label: 'Autre (hors étalonnage, comparer à un niveau de référence)' },
] as const

interface EpreuveState {
  percentile: PercentileKey
  /** Note Standard officielle Exalang (1 à 5), parallèle au percentile.
   *  Optionnel — l'ortho la saisit si la feuille de résultats l'affiche. */
  note_standard: NSKey
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
  for (const m of MODULES) for (const e of m.epreuves) {
    ep[e.key] = { percentile: '', note_standard: '', score_brut: '', temps: '', observation: '', non_passee: false }
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

function NoteStandardChips({ value, onChange }: { value: NSKey; onChange: (v: NSKey) => void }) {
  return (
    <div className="flex flex-wrap gap-1">
      {NS_OPTIONS.map(o => {
        const active = value === o.key
        return (
          <button
            key={o.key}
            type="button"
            onClick={() => onChange(active ? '' : o.key)}
            title={o.hint}
            className={`px-2 py-1 rounded text-[11px] font-medium transition ${o.chip} ${active ? 'ring-2 ring-offset-1 ring-gray-700' : 'opacity-55 hover:opacity-100'}`}
          >
            {o.label}
          </button>
        )
      })}
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          className="px-2 py-1 rounded text-[11px] text-gray-500 hover:text-gray-900 underline decoration-dotted"
        >
          effacer
        </button>
      )}
    </div>
  )
}

export default function Exalang58ScoresInput({
  notes,
  onNotesChange,
  onResultatsChange,
  onError,
  bilanPrecedentStructure,
  bilanPrecedentDate,
}: Props) {
  const [state, setState] = useState<State>(emptyState)
  // Modules ouverts par défaut : Langage oral + Phonologie (les plus
  // saisies en pratique). Les autres en accordéon fermé.
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    M1: true, M2: true, M3: false, M4: false, M5: false, M6: false, M7: false,
  })

  // Import PDF Exalang 5-8 — route /api/extract-exalang-5-8-pdf.
  // Pré-remplit l'état du form depuis un rapport informatisé HappyNeuron Pro
  // ou un scan de cahier de passation. Mêmes contraintes que l'import EVALEO :
  // PDF uniquement (docx / image refusés côté route pour préserver la grille
  // tabulaire et les bandes de percentile).
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [importing, setImporting] = useState(false)
  const [importInfo, setImportInfo] = useState<string | null>(null)

  async function handleImportFile(file: File) {
    setImporting(true)
    setImportInfo(null)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/extract-exalang-5-8-pdf', { method: 'POST', body: fd })
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
          note_standard: string
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
          if (!next.epreuves[item.key]) continue // clé inconnue → ignorer
          const cur = next.epreuves[item.key]
          next.epreuves[item.key] = {
            percentile: (item.percentile as PercentileKey) || cur.percentile,
            note_standard: (item.note_standard as NSKey) || cur.note_standard,
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
    for (const m of MODULES) for (const e of m.epreuves) {
      const st = state.epreuves[e.key]
      if (st.non_passee) continue
      if (st.percentile !== '' || st.note_standard !== '') n++
    }
    return n
  }, [state.epreuves])

  const zoneCounts = useMemo(() => {
    const c = { excellent: 0, moyenne_haute: 0, moyenne_basse: 0, fragilite: 0, difficulte: 0, difficulte_severe: 0 }
    for (const m of MODULES) for (const e of m.epreuves) {
      const st = state.epreuves[e.key]
      if (st.non_passee) continue
      const z = PERCENTILE_OPTIONS.find(o => o.key === st.percentile)?.zone
      if (z) c[z]++
    }
    return c
  }, [state.epreuves])

  /**
   * Live preview deltas — mode renouvellement. Calcule en temps réel les
   * compteurs d'évolution AVANT la génération du CRBO, pour que l'ortho voie
   * ce qui ressortira dans le tableau comparatif Word et ajuste sa saisie.
   *
   * Matching épreuve actuelle ↔ précédente : par label lowercase + trim.
   * Seuil delta ±10 sur percentile_value, identique au calcul côté prompt et
   * côté rendu Word. Pattern aligné sur Evaleo615ScoresInput.tsx:873-924.
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

    for (const m of MODULES) {
      for (const e of m.epreuves) {
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
    lines.push('=== Exalang 5-8 (Thibault, Helloin, Croteau — Orthomotus 2010) ===')
    if (state.niveau) {
      lines.push(`Niveau scolaire d'étalonnage : ${NIVEAU_OPTIONS.find(o => o.key === state.niveau)?.label}`)
      lines.push('')
    }
    for (const m of MODULES) {
      let printed = false
      for (const e of m.epreuves) {
        const st = state.epreuves[e.key]
        if (st.non_passee) continue
        const has = st.percentile !== '' || st.note_standard !== '' || st.observation.trim() || st.score_brut.trim() || st.temps.trim()
        if (!has) continue
        if (!printed) { lines.push(`--- ${m.code} ${m.label} ---`); printed = true }
        const tag = e.tag ? ` (${e.tag})` : ''
        lines.push(`Épreuve : ${e.label}${tag}`)
        if (st.percentile !== '') lines.push(`  Percentile : ${percentileLabel(st.percentile)} — ${zoneLabel(st.percentile)}`)
        if (st.note_standard !== '') {
          const nsOpt = NS_OPTIONS.find(o => o.key === st.note_standard)
          if (nsOpt) lines.push(`  Note Standard : ${nsOpt.label} (${nsOpt.hint})`)
        }
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

  const totalEpreuves = MODULES.reduce((acc, m) => acc + m.epreuves.length, 0)

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-2 p-3 rounded-lg border border-indigo-200 bg-indigo-50">
        <BookOpen size={18} className="text-indigo-600 shrink-0 mt-0.5" />
        <div className="text-sm">
          <p className="font-semibold text-indigo-900">Saisie structurée Exalang 5-8 — 7 modules officiels, 35 épreuves</p>
          <p className="text-indigo-700 text-xs mt-0.5 leading-relaxed">
            Reportez la zone et / ou la Note Standard lues sur la feuille de résultats du logiciel. Étalonnage par niveau scolaire (GSM, mi-CP, CP-CE1, CE1-CE2). Q1 = P25 = Zone de fragilité, jamais Difficulté.
          </p>
        </div>
      </div>

      {/* Import PDF Exalang 5-8 — rapport HappyNeuron Pro ou scan du cahier
          de passation. Pre-remplit niveau d'etalonnage + percentile +
          Note Standard + score brut + temps + observation pour les 35
          epreuves. PDF uniquement (docx/image refuses cote route). */}
      <div className="rounded-lg border border-sky-200 bg-sky-50/60 p-3">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="flex items-start gap-2 min-w-0">
            <FileUp size={18} className="text-sky-700 shrink-0 mt-0.5" />
            <div className="text-sm min-w-0">
              <p className="font-semibold text-sky-900">Importer un document Exalang 5-8 (optionnel)</p>
              <p className="text-sky-800 text-xs mt-0.5 leading-relaxed">
                Format accepté : <strong>PDF uniquement</strong> (rapport de cotation HappyNeuron Pro, scan du cahier de passation rempli, ou bilan déjà rédigé exporté en PDF). Si vous avez un Word, exportez-le en PDF avant import (Fichier &gt; Exporter &gt; PDF).
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

      {/* Bandeau bilan précédent détecté (mode renouvellement). Affiché
          uniquement si le wizard a importé un bilan précédent (étape 4) et
          l'a converti en CRBOStructure. */}
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
              L&apos;IA calculera automatiquement les évolutions épreuve par épreuve et le rendu Word affichera un tableau comparatif avec flèches d&apos;évolution (↑ progrès / → stable / ↓ régression).
            </p>
          </div>
        </div>
      )}

      {/* Live preview deltas — visible si bilan précédent importé ET ortho
          a déjà saisi au moins une épreuve. Autodiagnostic du matching
          par label : si "0 progrès + 0 stable + 0 régression + X nouvelles",
          c'est que les libellés du bilan précédent ne matchent pas. */}
      {evolutionStats && (evolutionStats.totalCompared > 0 || evolutionStats.nouvelles > 0) && (
        <div className="rounded-lg border border-teal-300 bg-gradient-to-br from-teal-50 to-emerald-50 p-3">
          <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
            <p className="text-xs font-semibold text-teal-900">
              Évolution prévue dans le CRBO — recalcul live
            </p>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
              evolutionStats.verdict === 'progress'
                ? 'bg-green-200 text-green-900'
                : evolutionStats.verdict === 'regression'
                  ? 'bg-red-200 text-red-900'
                  : 'bg-gray-200 text-gray-800'
            }`}>
              {evolutionStats.verdict === 'progress'
                ? '✓ Progression'
                : evolutionStats.verdict === 'regression'
                  ? '↓ Régression'
                  : '≈ Stable'}
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5 mb-2">
            {evolutionStats.progres > 0 && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-green-100 text-green-800 border border-green-300">
                <span className="font-bold">↑ {evolutionStats.progres}</span>
                <span>progrès</span>
              </span>
            )}
            {evolutionStats.stable > 0 && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-gray-100 text-gray-700 border border-gray-300">
                <span className="font-bold">→ {evolutionStats.stable}</span>
                <span>stable</span>
              </span>
            )}
            {evolutionStats.regression > 0 && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-red-100 text-red-800 border border-red-300">
                <span className="font-bold">↓ {evolutionStats.regression}</span>
                <span>régression</span>
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
              ⚠ Peu d&apos;épreuves matchent entre les 2 bilans ({evolutionStats.totalCompared} comparées vs {evolutionStats.nouvelles} nouvelles).
              Si la majorité devraient être comparables, vérifiez que les titres d&apos;épreuves du bilan précédent correspondent aux libellés Exalang 5-8 officiels.
            </p>
          )}
          {evolutionStats.nouvelles > 0 && (
            <p className="text-[10px] text-gray-600 italic mt-1.5 leading-tight">
              ⓘ Si le bilan précédent vient d&apos;une autre batterie (Exalang 3-6 / 8-11 / EVALEO par ex.), l&apos;IA fera la comparaison sémantique côté CRBO généré — le tableau d&apos;évolution Word sera complet même si certaines épreuves apparaissent ici comme &laquo;&nbsp;nouvelles&nbsp;&raquo;.
            </p>
          )}
        </div>
      )}

      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <label className="flex items-center gap-2 text-sm font-semibold text-gray-900 mb-2">
          <Info size={14} className="text-indigo-600" />
          Niveau d&apos;étalonnage au moment de la passation
        </label>
        <select
          value={state.niveau}
          onChange={(e) => setState(s => ({ ...s, niveau: e.target.value as State['niveau'] }))}
          className="w-full sm:w-96 px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
        >
          {NIVEAU_OPTIONS.map(o => (
            <option key={o.key} value={o.key}>{o.label}</option>
          ))}
        </select>
        <p className="text-[11px] text-gray-500 mt-1">
          4 niveaux officiels (manuel p. 11). Le niveau mi-CP a été ajouté en 2010 pour mesurer plus finement la phase d&apos;entrée dans la lecture.
        </p>
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

      {MODULES.map(m => {
        const open = expanded[m.code]
        const mSaisies = m.epreuves.filter(e => {
          const st = state.epreuves[e.key]
          return !st.non_passee && (st.percentile !== '' || st.note_standard !== '')
        }).length
        return (
          <div key={m.code} className="rounded-lg border border-gray-200 bg-white">
            <button
              type="button"
              onClick={() => setExpanded(prev => ({ ...prev, [m.code]: !prev[m.code] }))}
              className="w-full flex items-center justify-between gap-3 px-4 py-3 hover:bg-gray-50 text-left"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900">
                  <span className="font-mono text-indigo-600 mr-2">{m.code}</span>
                  {m.label}
                  <span className="ml-2 text-xs font-normal text-gray-500">
                    · {mSaisies}/{m.epreuves.length} saisies
                  </span>
                </p>
                <p className="text-xs text-gray-500 mt-0.5">{m.description}</p>
              </div>
              <ChevronDown size={16} className={`text-gray-400 shrink-0 transition-transform ${open ? '' : '-rotate-90'}`} />
            </button>

            {open && (
              <div className="border-t border-gray-100 p-4 space-y-3">
                {m.epreuves.map(e => {
                  const st = state.epreuves[e.key]
                  return (
                    <div key={e.key} className={`rounded border ${st.non_passee ? 'border-gray-200 bg-gray-50 opacity-60' : 'border-gray-200 bg-white'} p-3`}>
                      <div className="flex items-start justify-between gap-3 flex-wrap mb-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 flex items-center gap-2 flex-wrap">
                            {e.label}
                            {e.tag && <span className="text-[10px] uppercase tracking-wide bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded">{e.tag}</span>}
                          </p>
                          {e.hint && <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{e.hint}</p>}
                          {e.warning && (
                            <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded px-1.5 py-0.5 mt-1 leading-relaxed">
                              ⚠ {e.warning}
                            </p>
                          )}
                        </div>
                        <label className="text-xs text-gray-600 flex items-center gap-1.5 shrink-0 cursor-pointer">
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
                        <div className="space-y-2">
                          <div>
                            <p className="text-[11px] font-medium text-gray-600 mb-1">Percentile (zone Exalang) :</p>
                            <PercentileChips
                              value={st.percentile}
                              onChange={(v) => setField(e.key, 'percentile', v)}
                            />
                          </div>

                          <div>
                            <p className="text-[11px] font-medium text-gray-600 mb-1">
                              Note Standard <span className="text-gray-400 font-normal">(optionnelle, si affichée par le logiciel)</span> :
                            </p>
                            <NoteStandardChips
                              value={st.note_standard}
                              onChange={(v) => setField(e.key, 'note_standard', v)}
                            />
                          </div>

                          <div className="grid sm:grid-cols-2 gap-2">
                            <input
                              type="text"
                              value={st.score_brut}
                              onChange={(ev) => setField(e.key, 'score_brut', ev.target.value)}
                              placeholder="Score brut (opt.)"
                              className="px-2 py-1 border border-gray-300 rounded text-xs"
                            />
                            <input
                              type="text"
                              value={st.temps}
                              onChange={(ev) => setField(e.key, 'temps', ev.target.value)}
                              placeholder="Temps (sec., opt.)"
                              className="px-2 py-1 border border-gray-300 rounded text-xs"
                            />
                          </div>

                          <textarea
                            value={st.observation}
                            onChange={(ev) => setField(e.key, 'observation', ev.target.value)}
                            rows={2}
                            placeholder="Observation : stratégies, type d'erreurs, attitude, types d'erreurs qualitatives, etc."
                            className="w-full px-2 py-1 border border-gray-300 rounded text-xs leading-relaxed resize-y"
                          />
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
          placeholder="Ex. élève attentif, fatigue marquée en fin de bilan, anxiété sur les épreuves chronométrées, stratégies de devinette en lecture…"
          className="w-full px-3 py-2 border border-gray-300 rounded text-sm leading-relaxed resize-y focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />
      </div>
    </div>
  )
}
