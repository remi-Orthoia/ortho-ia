'use client'

/**
 * Saisie structurée EVALEO 6-15 (Launay, Maeder, Roustit, Touzin —
 * Ortho Édition 2018).
 *
 * EVALEO couvre le CP à la 3e (étalonnage par niveau scolaire) sur 3 axes :
 *  - LANGAGE ORAL (Phonologie, Métaphonologie, Lexique-sémantique,
 *    Morphosyntaxe, Récit, Pragmatique).
 *  - LANGAGE ÉCRIT (Lecture identification, Lecture compréhension, Écriture,
 *    Orthographe, Récit).
 *  - AUTRES (Gnosies, Visuo-attentionnel, Inhibition, MdT, Praxies,
 *    Raisonnement logique).
 *
 * L'ortho saisit pour chaque épreuve le percentile (ou la zone) recopié depuis
 * la cotation informatisée EVALEO + un observation libre. Le niveau scolaire
 * du patient est demandé en tête pour que l'IA puisse ancrer le commentaire
 * dans le bon étalonnage.
 *
 * Couplage : utilisé dans nouveau-crbo/page.tsx quand
 * test_utilise === ['EVALEO 6-15'].
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
  /** Tag spécial (épreuve restreinte à certains niveaux, en ms, etc.). */
  tag?: string
}

interface SubDomain {
  id: string
  label: string
  description: string
  epreuves: Epreuve[]
}

interface Section {
  id: 'lo' | 'le' | 'autres'
  label: string
  description: string
  subdomains: SubDomain[]
}

/** Structure VERBATIM du cahier de passation EVALEO 6-15 (LO + LE + Autres).
 *  Les libellés correspondent aux titres officiels — ne pas reformuler. */
const SECTIONS: Section[] = [
  {
    id: 'lo',
    label: 'Langage Oral',
    description: 'Phonologie, Métaphonologie, Lexique-sémantique, Morphosyntaxe, Récit oral, Pragmatique.',
    subdomains: [
      {
        id: 'lo_phono',
        label: 'Phonologie',
        description: 'Répertoire, répétition, fluence, dénomination rapide (RAN — marqueur dyslexique).',
        epreuves: [
          { key: 'repertoire_phonetique',  label: 'Répertoire phonétique',        hint: 'Inventaire des phonèmes maîtrisés' },
          { key: 'rep_mots_complexes',     label: 'Répétition de mots complexes', hint: 'Encodage phonologique' },
          { key: 'rep_pseudomots',         label: 'Répétition de pseudomots',     hint: 'Boucle phonologique pure (cible dyslexie phonologique)' },
          { key: 'fluence_phono',          label: 'Fluence phonologique',         hint: 'Accès lexical sur critère phonémique' },
          { key: 'denom_rapide_couleurs', label: 'Dénomination rapide — couleurs', hint: 'RAN couleur (vitesse de dénomination automatique)' },
          { key: 'denom_rapide_chiffres', label: 'Dénomination rapide — chiffres', hint: 'RAN chiffres (vitesse de dénomination automatique)' },
        ],
      },
      {
        id: 'lo_meta',
        label: 'Métaphonologie',
        description: 'Conscience articulatoire, manipulation des unités phonologiques — prédicteur fort de la dyslexie.',
        epreuves: [
          { key: 'conscience_articulatoire', label: 'Conscience articulatoire' },
          { key: 'epiphonologie',            label: 'Epiphonologie',            hint: 'Manipulation implicite (rimes, syllabes)' },
          { key: 'metaphonologie',           label: 'Métaphonologie',           hint: 'Manipulation explicite (segmentation, élision, ajout)' },
        ],
      },
      {
        id: 'lo_lex',
        label: 'Lexique-sémantique',
        description: 'Dénomination, désignation, fluences, antonymes, métaphores et néologismes.',
        epreuves: [
          { key: 'denom_lex_phono',     label: 'Dénomination Lexique — phonologie', hint: 'Voie d\'évocation lexicale (3 niveaux de difficulté)' },
          { key: 'designation_images',  label: 'Désignation d\'images',             hint: 'Lexique réceptif (3 niveaux)' },
          { key: 'prod_termes_gen',     label: 'Production de termes génériques' },
          { key: 'comp_termes_gen',     label: 'Compréhension de termes génériques' },
          { key: 'fluence_sem',         label: 'Fluence sémantique' },
          { key: 'fluence_morpho',      label: 'Fluence morphologique' },
          { key: 'antonymes',           label: 'Antonymes' },
          { key: 'metaphores_idiomes',  label: 'Métaphores & expressions idiomatiques', hint: 'Sens figuré — marqueur trouble pragmatique si déficit isolé' },
          { key: 'jugement_derivations', label: 'Jugement de dérivations' },
          { key: 'creation_neologismes', label: 'Création de néologismes' },
        ],
      },
      {
        id: 'lo_morpho',
        label: 'Morphosyntaxe',
        description: 'Programmation, répétition, compréhension, jugement de grammaticalité.',
        epreuves: [
          { key: 'prog_orale_phrases',  label: 'Programmation orale de phrases',  hint: 'Syntaxe expressive' },
          { key: 'rep_phrases_complexes', label: 'Répétition de phrases complexes', hint: 'MdT + syntaxe' },
          { key: 'comp_orale_phrases',  label: 'Compréhension orale de phrases',  hint: 'Prédicteur de la compréhension écrite' },
          { key: 'jugement_grammatical', label: 'Jugement de grammaticalité et reformulation' },
        ],
      },
      {
        id: 'lo_recit',
        label: 'Récit oral',
        description: 'Discours narratif à partir d\'une histoire en images, compréhension narrative longue.',
        epreuves: [
          { key: 'recit_oral_images',   label: 'Récit à l\'oral à partir d\'une histoire en images' },
          { key: 'comp_orale_paragraphe', label: 'Compréhension orale de paragraphe', hint: 'Test + Retest selon niveau' },
        ],
      },
      {
        id: 'lo_prag',
        label: 'Pragmatique',
        description: 'Adéquation au contexte — apport unique d\'EVALEO en français.',
        epreuves: [
          { key: 'pragmatique_communication', label: 'Pragmatique et communication', hint: 'Marqueur de trouble de la communication sociale (TCS)' },
        ],
      },
    ],
  },
  {
    id: 'le',
    label: 'Langage Écrit',
    description: 'Lecture (identification + compréhension), Écriture, Orthographe, Récit écrit.',
    subdomains: [
      {
        id: 'le_lecture_id',
        label: 'Lecture identification',
        description: 'Décodage, voies d\'adressage et d\'assemblage, vitesse de lecture.',
        epreuves: [
          { key: 'conv_grapho_phon',    label: 'Conversion Grapho-Phonémique', tag: 'CP' },
          { key: 'lecture_syllabes',    label: 'Lecture de syllabes',           tag: 'CP-CE1' },
          { key: 'lecture_mots',        label: 'Lecture de mots',               hint: 'Voie d\'adressage', tag: 'CP 3e trim → 3e' },
          { key: 'lecture_pseudomots',  label: 'Lecture de pseudomots',         hint: 'Voie d\'assemblage', tag: 'CP 3e trim → 3e' },
          { key: 'eval2m',              label: 'EVAL2M — Lecture de mots en 2 min', hint: 'Vitesse de lecture', tag: 'CE1 3e trim → 3e' },
          { key: 'evalouette',          label: 'Evalouette — Lecture de texte non signifiant', hint: 'Décodage pur', tag: 'CP 3e trim → 3e' },
          { key: 'mouette_test',        label: 'La Mouette — Lecture de texte signifiant (test)', tag: 'CP 3e trim → 3e' },
          { key: 'pingouin_retest',     label: 'Le Pingouin — Lecture de texte signifiant (retest)', tag: 'CE1 → 3e' },
        ],
      },
      {
        id: 'le_comprehension',
        label: 'Lecture compréhension',
        description: 'Compréhension en lecture vs en écoute, niveaux phrase / paragraphe / texte.',
        epreuves: [
          { key: 'comp_ecrite_orale_mots', label: 'Compréhension écrite et orale de mots' },
          { key: 'comp_ecrite_phrases',    label: 'Compréhension écrite de phrases', tag: 'CP 3e trim → 3e' },
          { key: 'comp_ecrite_paragraphe', label: 'Compréhension écrite de paragraphe', hint: 'Test + Retest selon niveau' },
          { key: 'comp_ecrite_texte',      label: 'Compréhension écrite de texte', hint: 'Test + Retest', tag: '6e → 3e' },
        ],
      },
      {
        id: 'le_ecriture',
        label: 'Écriture',
        description: 'Copie, accélération, transcription, buffer graphémique, comportement scripteur.',
        epreuves: [
          { key: 'copie_mots',           label: 'Copie de mots',                 tag: 'CP' },
          { key: 'copie_texte',          label: 'Copie de texte',                tag: 'CE1 → 3e' },
          { key: 'acceleration_phrase',  label: 'Accélération sur l\'écriture d\'une phrase', tag: 'CE2 → 3e' },
          { key: 'transcription_buffer', label: 'Transcription & buffer graphémique', tag: 'CP 3e trim → 3e' },
        ],
      },
      {
        id: 'le_ortho',
        label: 'Orthographe',
        description: 'Dictée à tous les niveaux (syllabes, pseudomots, mots, phrases) + décision orthographique + fluence.',
        epreuves: [
          { key: 'dictee_syllabes',     label: 'Dictée de syllabes',     tag: 'CP' },
          { key: 'dictee_pseudomots',   label: 'Dictée de pseudomots',   hint: 'Voie d\'assemblage en écriture', tag: 'CE2 → 3e' },
          { key: 'dictee_mots',         label: 'Dictée de mots',         hint: 'Voie d\'adressage / orthographe lexicale', tag: 'CP 3e trim → 3e' },
          { key: 'fluence_ortho',       label: 'Fluence orthographique', hint: 'Vitesse d\'évocation orthographique' },
          { key: 'dictee_phrases',      label: 'Dictée de phrases',      hint: 'Orthographe lexicale + grammaticale', tag: 'CE1 3e trim → 3e' },
          { key: 'decision_ortho',      label: 'Décision orthographique', hint: 'Mémoire orthographique en reconnaissance', tag: 'CE2 → 3e' },
        ],
      },
      {
        id: 'le_recit',
        label: 'Récit écrit',
        description: 'Discours narratif écrit à partir d\'images.',
        epreuves: [
          { key: 'recit_ecrit_images', label: 'Récit à l\'écrit à partir d\'une histoire en images', tag: 'CM1 → 3e' },
        ],
      },
    ],
  },
  {
    id: 'autres',
    label: 'Autres',
    description: 'Gnosies, Visuo-attentionnel, Mémoire à court terme, Praxies, Raisonnement logique.',
    subdomains: [
      {
        id: 'gnosies',
        label: 'Gnosies',
        description: 'Discrimination phonologique + gnosies visuelles.',
        epreuves: [
          { key: 'discrim_phono',   label: 'Discrimination phonologique', hint: 'Gnosies auditivo-phonologiques' },
          { key: 'gnosies_visuelles', label: 'Gnosies visuelles de figures' },
        ],
      },
      {
        id: 'visuo_inhib',
        label: 'Visuo-attentionnel & Inhibition',
        description: 'Empan visuo-attentionnel (en ms) + Stroop.',
        epreuves: [
          { key: 'empan_visuo_attentionnel', label: 'Empan visuo-attentionnel', hint: 'Fenêtre attentionnelle visuelle — score en MILLISECONDES', tag: 'ms' },
          { key: 'stroop',                   label: 'Effet Stroop',             hint: 'Inhibition d\'automatismes' },
        ],
      },
      {
        id: 'mct',
        label: 'Mémoire à court terme',
        description: 'Empans verbal et visuo-spatial.',
        epreuves: [
          { key: 'rep_chiffres_endroit_envers', label: 'Répétition de chiffres endroit et envers', hint: 'Empan verbal' },
          { key: 'rep_logatomes',               label: 'Répétition de logatomes',                  hint: 'Boucle phonologique' },
          { key: 'rappel_item',                 label: 'Rappel — Item' },
          { key: 'rappel_seriel',               label: 'Rappel — sériel' },
          { key: 'localisation_jetons',         label: 'Reproduction de localisation de jetons',  hint: 'Mémoire visuo-spatiale' },
        ],
      },
      {
        id: 'praxies',
        label: 'Praxies',
        description: 'Habiletés manuelles, praxies bucco-faciales et linguales.',
        epreuves: [
          { key: 'habiletes_manuelles', label: 'Habiletés manuelles et digitales sur imitation' },
          { key: 'praxies_bucco',       label: 'Praxies bucco-faciales et linguales' },
        ],
      },
      {
        id: 'raisonnement',
        label: 'Raisonnement logique',
        description: 'Inclusion, classification, quantification.',
        epreuves: [
          { key: 'inclusion_classification', label: 'Inclusion — Classification' },
          { key: 'classification',           label: 'Classification' },
          { key: 'quantification_inclusion', label: 'Quantification de l\'inclusion' },
        ],
      },
    ],
  },
]

const NIVEAU_OPTIONS = [
  { key: '',            label: '— choisir —' },
  { key: 'CP_1tr',      label: 'CP 1er trimestre (~6 ans)' },
  { key: 'CP_3tr',      label: 'CP 3e trimestre (~6-7 ans)' },
  { key: 'CE1',         label: 'CE1 (~7-8 ans)' },
  { key: 'CE2',         label: 'CE2 (~8-9 ans)' },
  { key: 'CM1',         label: 'CM1 (~9-10 ans)' },
  { key: 'CM2',         label: 'CM2 (~10-11 ans)' },
  { key: '6e_5e',       label: '6e-5e (~11-13 ans)' },
  { key: '4e_3e',       label: '4e-3e (~13-15 ans)' },
] as const

interface EpreuveState {
  percentile: PercentileKey
  score_brut: string
  temps: string
  observation: string
  non_passee: boolean
  /** Effets en lecture (uniquement pour `lecture_mots` et `lecture_pseudomots`). */
  effets?: EpreuveEffets
  /** Qualification des erreurs (uniquement pour les dictees). */
  erreurs?: EpreuveErreurs
}

/**
 * Effets en lecture EVALEO (mots / pseudomots).
 * Chaque effet est code en zone (excellent / moyenne / classe1-2 deficitaire),
 * comme affiche par la plateforme HappyNeuron en sortie de cotation.
 * C'est ce qui distingue dyslexie phono vs surface vs mixte.
 */
interface EpreuveEffets {
  effet_frequence: EffetKey         // F+ vs F-
  effet_consistance: EffetKey       // C+ vs C-
  effet_longueur_score: EffetKey    // L1 vs L3 sur score
  effet_longueur_temps: EffetKey    // L1 vs L3 sur temps
  effet_lexicalite: EffetKey        // mots vs pseudomots (score ou temps)
}

type EffetKey = '' | 'absent_normal' | 'leger' | 'marque' | 'tres_marque'

const EFFET_OPTIONS: Array<{ key: Exclude<EffetKey, ''>; label: string; chip: string; hint: string }> = [
  { key: 'absent_normal', label: 'Absent / Normal', chip: 'bg-emerald-500 text-white', hint: 'Pas d effet significatif (developpement normal a partir de CE2)' },
  { key: 'leger',         label: 'Leger',           chip: 'bg-yellow-300 text-yellow-900', hint: 'Effet present mais limite, sans impact pathologique' },
  { key: 'marque',        label: 'Marque',          chip: 'bg-orange-400 text-white', hint: 'Effet net, en zone de fragilite ou difficulte (classe 2)' },
  { key: 'tres_marque',   label: 'Tres marque',     chip: 'bg-red-600 text-white', hint: 'Effet massif (classe 1) = signature dyslexique' },
]

/**
 * Qualification des erreurs en dictee EVALEO (mots / pseudomots / phrases).
 * Compteurs ONPP / OL / ODM / ODNM / FV / FNP / FA / Seg / Hom.
 * Ce qui distingue dysorthographie phono vs lexicale vs morpho.
 */
interface EpreuveErreurs {
  onpp: string   // Orthographe Non Phonetiquement Plausible (voie d'assemblage en ecriture)
  ol: string     // Orthographe Lexicale (voie d'adressage en ecriture)
  odm: string    // Orthographe Derivable Morphologiquement
  odnm: string   // Orthographe Derivable Non Morphologiquement
  fv: string     // Flexion Verbale
  fnp: string    // Flexion Nominale et Pronominale
  fa: string     // Flexion Adjectivale
  seg: string    // Segmentation
  hom: string    // Homophone
}

const ERREURS_CHAMPS: Array<{ key: keyof EpreuveErreurs; label: string; hint: string; pour: ('dictee_mots' | 'dictee_pseudomots' | 'dictee_phrases')[] }> = [
  { key: 'onpp', label: 'ONPP', hint: 'Orthographe Non Phonetiquement Plausible (voie d\'assemblage altereee)', pour: ['dictee_mots', 'dictee_pseudomots', 'dictee_phrases'] },
  { key: 'ol',   label: 'OL',   hint: 'Orthographe Lexicale (voie d\'adressage altereee)', pour: ['dictee_mots', 'dictee_phrases'] },
  { key: 'odm',  label: 'ODM',  hint: 'Orthographe Derivable Morphologiquement (affixes previsibles)', pour: ['dictee_mots', 'dictee_phrases'] },
  { key: 'odnm', label: 'ODNM', hint: 'Orthographe Derivable Non Morphologiquement (racines, lettres muettes)', pour: ['dictee_mots', 'dictee_phrases'] },
  { key: 'fv',   label: 'FV',   hint: 'Flexion Verbale (conjugaisons)', pour: ['dictee_phrases'] },
  { key: 'fnp',  label: 'FNP',  hint: 'Flexion Nominale et Pronominale (genre, nombre)', pour: ['dictee_phrases'] },
  { key: 'fa',   label: 'FA',   hint: 'Flexion Adjectivale (accords)', pour: ['dictee_phrases'] },
  { key: 'seg',  label: 'Seg',  hint: 'Erreurs de segmentation des mots', pour: ['dictee_phrases'] },
  { key: 'hom',  label: 'Hom',  hint: 'Homophones (a/a, et/est, son/sont)', pour: ['dictee_phrases'] },
]

/** Cle des epreuves qui declenchent la saisie des EFFETS de lecture. */
const EPREUVES_AVEC_EFFETS = new Set(['lecture_mots', 'lecture_pseudomots'])
/** Cle des epreuves qui declenchent la saisie des ERREURS qualifiees. */
const EPREUVES_AVEC_ERREURS = new Set(['dictee_mots', 'dictee_pseudomots', 'dictee_phrases'])

function emptyEffets(): EpreuveEffets {
  return {
    effet_frequence: '',
    effet_consistance: '',
    effet_longueur_score: '',
    effet_longueur_temps: '',
    effet_lexicalite: '',
  }
}

function emptyErreurs(): EpreuveErreurs {
  return { onpp: '', ol: '', odm: '', odnm: '', fv: '', fnp: '', fa: '', seg: '', hom: '' }
}

interface State {
  niveau: typeof NIVEAU_OPTIONS[number]['key']
  epreuves: Record<string, EpreuveState>
}

function emptyState(): State {
  const ep: Record<string, EpreuveState> = {}
  for (const s of SECTIONS) for (const sd of s.subdomains) for (const e of sd.epreuves) {
    const base: EpreuveState = { percentile: '', score_brut: '', temps: '', observation: '', non_passee: false }
    if (EPREUVES_AVEC_EFFETS.has(e.key)) base.effets = emptyEffets()
    if (EPREUVES_AVEC_ERREURS.has(e.key)) base.erreurs = emptyErreurs()
    ep[e.key] = base
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

/**
 * Saisie des EFFETS en lecture (epreuve `lecture_mots` ou `lecture_pseudomots`).
 * 4 effets coute par dropdown :
 *  - Effet de frequence (mots frequents vs rares)
 *  - Effet de consistance (mots consistants vs inconsistants)
 *  - Effet de longueur sur score
 *  - Effet de longueur sur temps
 *  - Effet de lexicalite (mots vs pseudomots, surtout pertinent sur `lecture_pseudomots`)
 *
 * Chaque effet = absent_normal / leger / marque / tres_marque. Cette structuration
 * cible directement la cle du diagnostic dyslexie phono / surface / mixte sans
 * laisser Claude le deviner depuis du texte libre.
 */
function EffetsEditor({
  value, onChange, epreuveKey,
}: { value: EpreuveEffets; onChange: (v: EpreuveEffets) => void; epreuveKey: string }) {
  const setEffet = (k: keyof EpreuveEffets, v: EffetKey) => onChange({ ...value, [k]: v })
  const showLexicalite = epreuveKey === 'lecture_pseudomots'
  const lines: Array<{ key: keyof EpreuveEffets; label: string; hint: string }> = [
    { key: 'effet_frequence',       label: 'Effet frequence',        hint: 'Difference mots frequents F+ vs rares F-. Marque = lexique orthographique insuffisamment constitue.' },
    { key: 'effet_consistance',     label: 'Effet consistance',      hint: 'Difference mots reguliers C+ vs irreguliers C-. Marque = sensible a l\'opacite, voie d\'adressage perturbee.' },
    { key: 'effet_longueur_score',  label: 'Effet longueur (score)', hint: 'L1 courts vs L3 longs sur la precision. Marque = voie phonologique encore couteuse.' },
    { key: 'effet_longueur_temps',  label: 'Effet longueur (temps)', hint: 'L1 courts vs L3 longs sur la vitesse. Marque = lecture analytique persistante.' },
  ]
  if (showLexicalite) {
    lines.push({ key: 'effet_lexicalite', label: 'Effet lexicalite', hint: 'Difference mots vs pseudomots. Marque sur pseudomots = voie phonologique deficitaire.' })
  }
  return (
    <div className="mt-2 rounded border border-indigo-200 bg-indigo-50/50 p-2">
      <p className="text-[10px] font-semibold text-indigo-900 mb-1.5 uppercase tracking-wide">Effets HappyNeuron — saisir le niveau d&apos;effet observe</p>
      <div className="space-y-1.5">
        {lines.map(line => (
          <div key={line.key} className="flex flex-col gap-1">
            <div>
              <span className="text-[11px] font-medium text-gray-800">{line.label}</span>
              <span className="text-[10px] text-gray-500 ml-1">{line.hint}</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {EFFET_OPTIONS.map(o => {
                const active = value[line.key] === o.key
                return (
                  <button
                    key={o.key}
                    type="button"
                    onClick={() => setEffet(line.key, active ? '' : o.key)}
                    className={`px-2 py-0.5 rounded text-[10px] font-medium transition ${o.chip} ${active ? 'ring-2 ring-offset-1 ring-gray-700' : 'opacity-50 hover:opacity-100'}`}
                    title={o.hint}
                  >
                    {o.label}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/**
 * Saisie de la QUALIFICATION DES ERREURS pour une dictee EVALEO.
 * Compteurs ONPP / OL / ODM / ODNM (mots) + FV / FNP / FA / Seg / Hom (phrases).
 * Cible directement le sous-type de dysorthographie (phonologique / lexicale / morpho).
 */
function ErreursDicteeEditor({
  value, onChange, epreuveKey,
}: { value: EpreuveErreurs; onChange: (v: EpreuveErreurs) => void; epreuveKey: string }) {
  const setErreur = (k: keyof EpreuveErreurs, v: string) => onChange({ ...value, [k]: v })
  // Pseudomots : uniquement ONPP. Mots : ONPP/OL/ODM/ODNM. Phrases : tout.
  const champsActifs = ERREURS_CHAMPS.filter(c => c.pour.includes(epreuveKey as any))
  return (
    <div className="mt-2 rounded border border-rose-200 bg-rose-50/50 p-2">
      <p className="text-[10px] font-semibold text-rose-900 mb-1.5 uppercase tracking-wide">Qualification des erreurs — nombre par type</p>
      <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
        {champsActifs.map(c => (
          <div key={c.key} className="flex flex-col">
            <label className="text-[10px] font-medium text-gray-700 flex items-center gap-0.5" title={c.hint}>
              {c.label}
            </label>
            <input
              type="text"
              inputMode="numeric"
              value={value[c.key]}
              onChange={(e) => setErreur(c.key, e.target.value.replace(/[^0-9]/g, '').slice(0, 3))}
              placeholder="0"
              className="px-1.5 py-0.5 border border-gray-300 rounded text-[11px] text-center"
            />
          </div>
        ))}
      </div>
      <p className="text-[10px] text-rose-700 mt-1.5 leading-tight">
        Astuce : la plateforme HappyNeuron affiche directement ces compteurs en sortie de cotation. Reportez tels quels.
      </p>
    </div>
  )
}

export default function Evaleo615ScoresInput({ notes, onNotesChange, onResultatsChange }: Props) {
  const [state, setState] = useState<State>(emptyState)
  const [expandedSection, setExpandedSection] = useState<Record<string, boolean>>({ lo: true, le: true, autres: false })
  const [expandedSub, setExpandedSub] = useState<Record<string, boolean>>({})

  const totalSaisies = useMemo(() => {
    let n = 0
    for (const s of SECTIONS) for (const sd of s.subdomains) for (const e of sd.epreuves) {
      const st = state.epreuves[e.key]
      if (st.non_passee) continue
      if (st.percentile !== '') n++
    }
    return n
  }, [state.epreuves])

  const zoneCounts = useMemo(() => {
    const c = { excellent: 0, moyenne_haute: 0, moyenne_basse: 0, fragilite: 0, difficulte: 0, difficulte_severe: 0 }
    for (const s of SECTIONS) for (const sd of s.subdomains) for (const e of sd.epreuves) {
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
    lines.push('=== EVALEO 6-15 (Launay, Maeder, Roustit, Touzin — Ortho Édition 2018) ===')
    if (state.niveau) {
      lines.push(`Niveau scolaire : ${NIVEAU_OPTIONS.find(o => o.key === state.niveau)?.label}`)
      lines.push('')
    }
    for (const s of SECTIONS) {
      let sectionPrinted = false
      for (const sd of s.subdomains) {
        let subPrinted = false
        for (const e of sd.epreuves) {
          const st = state.epreuves[e.key]
          if (st.non_passee) continue
          const hasData = st.percentile !== '' || st.score_brut.trim() || st.temps.trim() || st.observation.trim()
          if (!hasData) continue
          if (!sectionPrinted) {
            lines.push(`=== ${s.label} ===`)
            sectionPrinted = true
          }
          if (!subPrinted) {
            lines.push(`--- ${sd.label} ---`)
            subPrinted = true
          }
          const tag = e.tag ? ` (${e.tag})` : ''
          lines.push(`Épreuve : ${e.label}${tag}`)
          if (st.percentile !== '') {
            lines.push(`  Percentile : ${percentileLabel(st.percentile)} — ${zoneLabel(st.percentile)}`)
          }
          if (st.score_brut.trim()) lines.push(`  Score brut : ${st.score_brut.trim()}`)
          if (st.temps.trim()) lines.push(`  Temps : ${st.temps.trim()}`)
          // L1 : effets de lecture serialises de facon structuree pour Claude
          if (st.effets) {
            const e_ = st.effets
            const effetLabels: Array<[string, string]> = []
            const fmt = (k: EffetKey) => EFFET_OPTIONS.find(o => o.key === k)?.label ?? ''
            if (e_.effet_frequence)      effetLabels.push(['Frequence', fmt(e_.effet_frequence)])
            if (e_.effet_consistance)    effetLabels.push(['Consistance', fmt(e_.effet_consistance)])
            if (e_.effet_longueur_score) effetLabels.push(['Longueur (score)', fmt(e_.effet_longueur_score)])
            if (e_.effet_longueur_temps) effetLabels.push(['Longueur (temps)', fmt(e_.effet_longueur_temps)])
            if (e_.effet_lexicalite)     effetLabels.push(['Lexicalite', fmt(e_.effet_lexicalite)])
            if (effetLabels.length > 0) {
              lines.push(`  Effets HappyNeuron : ${effetLabels.map(([k, v]) => `${k}=${v}`).join(' | ')}`)
            }
          }
          // L1 : qualification des erreurs en dictee serialisee
          if (st.erreurs) {
            const errLabels: string[] = []
            for (const c of ERREURS_CHAMPS) {
              const v = st.erreurs[c.key].trim()
              if (v && c.pour.includes(e.key as any)) errLabels.push(`${c.label}=${v}`)
            }
            if (errLabels.length > 0) {
              lines.push(`  Qualification erreurs : ${errLabels.join(' | ')}`)
            }
          }
          if (st.observation.trim()) lines.push(`  Observation : ${st.observation.trim()}`)
        }
        if (subPrinted) lines.push('')
      }
    }
    // Synthèse
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

  const totalEpreuves = SECTIONS.reduce((acc, s) => acc + s.subdomains.reduce((a, sd) => a + sd.epreuves.length, 0), 0)

  return (
    <div className="space-y-4">
      {/* Bandeau EVALEO */}
      <div className="flex items-start gap-2 p-3 rounded-lg border border-indigo-200 bg-indigo-50">
        <BookOpen size={18} className="text-indigo-600 shrink-0 mt-0.5" />
        <div className="text-sm">
          <p className="font-semibold text-indigo-900">Saisie structurée EVALEO 6-15 — bilan langage oral + écrit complet</p>
          <p className="text-indigo-700 text-xs mt-0.5 leading-relaxed">
            Couvre du CP à la 3e. Reportez la zone (ou le percentile) lue sur la cotation informatisée EVALEO pour
            chaque épreuve passée. Cochez « non passée » pour exclure une épreuve. Les normes sont stratifiées par
            niveau scolaire — sélectionnez-le ci-dessous. Q1 = P25 = NORMAL, jamais déficitaire.
          </p>
        </div>
      </div>

      {/* Niveau scolaire */}
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
          8 niveaux d&apos;étalonnage officiels (CP 1er trim, CP 3e trim, CE1, CE2, CM1, CM2, 6e-5e, 4e-3e).
        </p>
      </div>

      {/* Synthèse */}
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

      {/* 3 grandes sections en accordéon — sous-sections incluses */}
      {SECTIONS.map(s => {
        const open = expandedSection[s.id]
        return (
          <div key={s.id} className="rounded-lg border border-gray-200 bg-white">
            <button
              type="button"
              onClick={() => setExpandedSection(prev => ({ ...prev, [s.id]: !prev[s.id] }))}
              className="w-full px-4 py-3 flex items-center justify-between gap-3 text-left hover:bg-gray-50"
            >
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-900">{s.label}</p>
                <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{s.description}</p>
              </div>
              <ChevronDown size={16} className={`shrink-0 transition-transform ${open ? '' : '-rotate-90'}`} />
            </button>

            {open && (
              <div className="border-t border-gray-100 px-4 py-3 space-y-3">
                {s.subdomains.map(sd => {
                  const subKey = `${s.id}_${sd.id}`
                  const subOpen = expandedSub[subKey] ?? false
                  // Auto-open si une épreuve a déjà une donnée
                  const hasData = sd.epreuves.some(e => state.epreuves[e.key].percentile !== '' || state.epreuves[e.key].observation.trim() || state.epreuves[e.key].non_passee)
                  const effOpen = subOpen || hasData
                  return (
                    <div key={sd.id} className="rounded border border-gray-200 bg-gray-50/50">
                      <button
                        type="button"
                        onClick={() => setExpandedSub(prev => ({ ...prev, [subKey]: !effOpen }))}
                        className="w-full px-3 py-2 flex items-center justify-between gap-3 text-left hover:bg-gray-100/50"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-indigo-700">{sd.label}</p>
                          <p className="text-[11px] text-gray-500 mt-0.5">{sd.description}</p>
                        </div>
                        <ChevronDown size={14} className={`shrink-0 transition-transform ${effOpen ? '' : '-rotate-90'}`} />
                      </button>

                      {effOpen && (
                        <div className="border-t border-gray-100 px-3 py-2 space-y-2">
                          {sd.epreuves.map(e => {
                            const st = state.epreuves[e.key]
                            return (
                              <div key={e.key} className="rounded bg-white border border-gray-100 p-2">
                                <div className="flex items-start justify-between gap-2 flex-wrap mb-1.5">
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs font-semibold text-gray-800 flex items-center gap-1.5">
                                      {e.label}
                                      {e.tag && (
                                        <span className="text-[9px] font-medium text-gray-500 px-1 py-0.5 rounded bg-gray-50 border border-gray-200">
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
                                        placeholder={e.tag === 'ms' ? 'Temps (ms)' : 'Temps (sec.)'}
                                        className="px-2 py-1 border border-gray-200 rounded text-[11px]"
                                      />
                                    </div>
                                    {/* L1 : effets en lecture (mots / pseudomots) */}
                                    {st.effets && EPREUVES_AVEC_EFFETS.has(e.key) && (
                                      <EffetsEditor
                                        value={st.effets}
                                        onChange={(v) => setField(e.key, 'effets', v)}
                                        epreuveKey={e.key}
                                      />
                                    )}
                                    {/* L1 : qualification des erreurs en dictee */}
                                    {st.erreurs && EPREUVES_AVEC_ERREURS.has(e.key) && (
                                      <ErreursDicteeEditor
                                        value={st.erreurs}
                                        onChange={(v) => setField(e.key, 'erreurs', v)}
                                        epreuveKey={e.key}
                                      />
                                    )}
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
          placeholder="Ex. élève attentif, fatigue marquée en fin de bilan, stratégies de devinette en lecture, anxiété visible sur les épreuves chronométrées…"
          className="w-full px-3 py-2 border border-gray-300 rounded text-sm leading-relaxed resize-y focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />
      </div>

      {/* Rappels cliniques */}
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
        <div className="flex items-start gap-2">
          <Brain size={16} className="text-amber-700 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-900 leading-relaxed">
            <p className="font-semibold mb-1">Rappels cliniques EVALEO 6-15</p>
            <ul className="list-disc list-inside space-y-0.5">
              <li><strong>Q1 = P25</strong> = zone moyenne basse, NORMAL. Jamais déficitaire.</li>
              <li><strong>Dyslexie phonologique</strong> : croiser Métaphonologie + Répétition de pseudomots + Lecture de pseudomots (≥ 3 épreuves convergentes).</li>
              <li><strong>Dyslexie de surface</strong> : croiser Lecture de mots irréguliers + Dictée de mots + Décision orthographique.</li>
              <li><strong>RAN (dénomination rapide)</strong> ralenti = marqueur indépendant de dyslexie (théorie du double déficit).</li>
              <li><strong>Pragmatique</strong> déficitaire isolée → orientation pluridisciplinaire (TCS / spectre).</li>
              <li>Toujours préciser le <strong>sous-type</strong> (phonologique / surface / mixte) pour la dyslexie-dysorthographie.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
