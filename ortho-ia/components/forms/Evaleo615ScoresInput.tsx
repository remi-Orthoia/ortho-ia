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

import { useEffect, useMemo, useRef, useState } from 'react'
import { Brain, BookOpen, ChevronDown, FileUp, Info, Loader2, GitCompare } from 'lucide-react'
import MicButton from '../MicButton'
import type { CRBOStructure } from '@/lib/prompts'

interface Props {
  notes: string
  onNotesChange: (v: string) => void
  onResultatsChange: (normalized: string) => void
  onError?: (msg: string) => void
  /** MODE RENOUVELLEMENT — structure du bilan précédent extraite depuis le
   *  bouton d'import "bilan précédent" de l'étape 4 du wizard. Si présente,
   *  le form affiche un encart d'évolution dans le panneau "Comparaison" et
   *  sérialise les épreuves précédentes pour que Claude calcule les flèches
   *  d'évolution dans le CRBO généré (et que le rendu Word produise son
   *  tableau comparatif avec ↑↓→). */
  bilanPrecedentStructure?: CRBOStructure | null
  /** Date du bilan précédent (ISO) — affichée dans l'encart d'évolution. */
  bilanPrecedentDate?: string | null
}

/**
 * GRILLE OFFICIELLE EVALEO 6-15 — 7 CLASSES (Launay, Maeder, Roustit, Touzin,
 * Ortho Edition 2018). Source visuelle : grille de cotation officielle EVALEO
 * (image fournie par Laurie). Distribution attendue (population de reference) :
 *
 *  | Classe | Centiles | % population | Couleur officielle | Interpretation        |
 *  |--------|----------|--------------|---------------------|----------------------|
 *  |   1    |   < 7    |    7 %       | rouge               | pathologique          |
 *  |   2    |   7-20   |   13 %       | orange              | fragilite (zone risque)|
 *  |   3    |  21-38   |   18 %       | vert clair          | norme                 |
 *  |   4    |  39-62   |   24 %       | vert moyen          | norme                 |
 *  |   5    |  63-80   |   18 %       | vert fonce          | norme                 |
 *  |   6    |  81-93   |   13 %       | bleu clair          | superieure a la moy.  |
 *  |   7    |   > 93   |    7 %       | bleu fonce          | tres superieure       |
 *
 * Les classes 3, 4 et 5 totalisent **60 %** de la population et sont toutes
 * regroupees sous l'etiquette "norme". On NE PARLE PAS de "norme faible /
 * mediane / superieure" en clinique EVALEO — ces 3 classes sont toutes des
 * performances normees attendues. La nuance vert clair/moyen/fonce est juste
 * indicative pour l'ortho qui veut situer dans la moitie basse/centre/haute
 * de la norme.
 *
 * `value` = mediane de la fourchette de centiles → pilote la couleur de fond
 * cellule Word via lib/word-export.ts seuilFor(). Couleur du chip = palette
 * officielle EVALEO (rouge/orange/vert/bleu).
 */
type PercentileKey =
  | '' | 'classe_7' | 'classe_6' | 'classe_5' | 'classe_4' | 'classe_3' | 'classe_2' | 'classe_1'

const PERCENTILE_OPTIONS: Array<{
  key: Exclude<PercentileKey, ''>
  /** Label court "Classe X" affiche dans le chip. */
  label: string
  /** Libelle officiel EVALEO transmis a Claude (pour 3-4-5 : "Norme"). */
  fullLabel: string
  /** Fourchette de centiles correspondant a la classe. */
  range: string
  /** Pourcentage de la population dans cette classe. */
  pop: string
  /** Hint sous-titre pour le chip (situe la nuance interne aux 3 classes de norme). */
  hint?: string
  /** Mediane de la fourchette → pilote la couleur Word via seuilFor(). */
  value: number
  /** Couleur de fond du chip — palette officielle EVALEO. */
  chip: string
  text: string
}> = [
  { key: 'classe_1', label: 'Classe 1', fullLabel: 'Pathologique',            range: '< P7',      pop: '7 %',  value: 3,  chip: 'bg-red-500',    text: 'text-white' },
  { key: 'classe_2', label: 'Classe 2', fullLabel: 'Fragilite',               range: 'P7 - P20',  pop: '13 %', value: 13, chip: 'bg-orange-400', text: 'text-white' },
  { key: 'classe_3', label: 'Classe 3', fullLabel: 'Norme',                   range: 'P21 - P38', pop: '18 %', hint: 'norme (moitie basse)',   value: 30, chip: 'bg-green-300', text: 'text-green-900' },
  { key: 'classe_4', label: 'Classe 4', fullLabel: 'Norme',                   range: 'P39 - P62', pop: '24 %', hint: 'norme (centre)',         value: 50, chip: 'bg-green-500', text: 'text-white' },
  { key: 'classe_5', label: 'Classe 5', fullLabel: 'Norme',                   range: 'P63 - P80', pop: '18 %', hint: 'norme (moitie haute)',   value: 71, chip: 'bg-green-700', text: 'text-white' },
  { key: 'classe_6', label: 'Classe 6', fullLabel: 'Superieure a la moyenne', range: 'P81 - P93', pop: '13 %', value: 87, chip: 'bg-sky-400',    text: 'text-white' },
  { key: 'classe_7', label: 'Classe 7', fullLabel: 'Tres superieure',         range: '> P93',     pop: '7 %',  value: 96, chip: 'bg-sky-600',    text: 'text-white' },
]

function classeEvaleoLabel(k: PercentileKey): string {
  return PERCENTILE_OPTIONS.find(o => o.key === k)?.label ?? ''
}
function classeEvaleoFullLabel(k: PercentileKey): string {
  return PERCENTILE_OPTIONS.find(o => o.key === k)?.fullLabel ?? ''
}
function classeEvaleoRange(k: PercentileKey): string {
  return PERCENTILE_OPTIONS.find(o => o.key === k)?.range ?? ''
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

/** Structure VERBATIM du cahier de passation EVALEO 6-15.
 *
 * ORDRE DES SECTIONS — calque sur l'exemple type Justine Peyre (bilan EVALEO
 * langage ecrit complet) :
 *   1. Langage Ecrit (Lecture id → Comprehension → Ecriture → Production
 *      orthographe → Recit ecrit)
 *   2. Competences sous-jacentes (Inhibition → MdT → Gnosies → Praxies →
 *      Raisonnement)
 *   3. Langage Oral (Morphosyntaxe d'abord — cohrent avec Justine qui finit
 *      le bilan par cette section — puis Phonologie / Metaphonologie /
 *      Lexique / Recit / Pragmatique pour les bilans LO+LE complets)
 *
 * Les libelles correspondent aux titres officiels EVALEO — ne pas reformuler. */
const SECTIONS: Section[] = [
  {
    id: 'le',
    label: 'Langage Écrit',
    description: 'Lecture (identification + compréhension), Écriture, Production orthographe, Récit écrit.',
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
        label: 'Production orthographe',
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
    label: 'Compétences sous-jacentes',
    description: 'Visuo-attentionnel & Inhibition, Mémoire à court terme, Gnosies, Praxies, Raisonnement logique.',
    subdomains: [
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
        id: 'gnosies',
        label: 'Gnosies',
        description: 'Discrimination phonologique + gnosies visuelles.',
        epreuves: [
          { key: 'discrim_phono',   label: 'Discrimination phonologique', hint: 'Gnosies auditivo-phonologiques' },
          { key: 'gnosies_visuelles', label: 'Gnosies visuelles de figures' },
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
  {
    id: 'lo',
    label: 'Langage Oral',
    description: 'Morphosyntaxe en premier (cf. exemple Justine), puis Phonologie, Métaphonologie, Lexique-sémantique, Récit oral, Pragmatique.',
    subdomains: [
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
  /** Classe EVALEO de la VITESSE (uniquement pour `lecture_mots` et
   *  `lecture_pseudomots`, ou autre epreuve a double sous-score
   *  precision/vitesse declaree dans EPREUVES_AVEC_VITESSE_PRECISION).
   *  `percentile` ci-dessus encode la classe de la PRECISION (Score total).
   *  Ce champ encode la classe du TEMPS total. Quand les 2 sont renseignes,
   *  le form serialise les 2 separement et Claude emet 2 lignes distinctes
   *  dans le rapport Word ("Lecture de mots (precision)" / "Lecture de
   *  mots (vitesse)"). Sinon, une seule ligne sans suffixe. Ajoute 2026-06
   *  apres retour Cindy (Anna-Jane lit tres vite mais avec une precision
   *  en zone d'alerte — le mono-percentile masquait cette dissociation). */
  percentile_vitesse?: PercentileKey
  /** Niveau scolaire equivalent EVALEO (uniquement Evalouette / Mouette /
   *  Pingouin — lecture de texte signifiant ou non signifiant). Texte libre
   *  type "CE1 T1", "CM2 T3" recopie de la ligne sous le tableau de cotation
   *  EVALEO : "Resultat <Test> correspondant au niveau de la classe :
   *  CE1 1". Le chiffre apres CE1/CE2 est le TRIMESTRE du niveau scolaire
   *  equivalent — PAS la classe sept-classes (qui reste dans `percentile`).
   *  Claude l'inclut dans le champ `score` du tableau Word sous forme
   *  "<score brut> (equivalent CE1 T1)". Ajoute 2026-06 apres retour Cindy. */
  niveau_equivalent?: string
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
/** Cle des epreuves a DOUBLE sous-score principal (Score total + Temps total)
 *  selon le tableau officiel EVALEO. Pour ces epreuves, l'ortho peut saisir
 *  DEUX classes distinctes (precision via `percentile`, vitesse via
 *  `percentile_vitesse`). Si les 2 sont renseignees, le Word rendra 2 lignes
 *  separees. */
const EPREUVES_AVEC_VITESSE_PRECISION = new Set(['lecture_mots', 'lecture_pseudomots'])
/** Cle des epreuves de lecture de texte produisant un "niveau scolaire
 *  equivalent" sous le tableau de cotation EVALEO. Cf. cahier EVALEO p. ~,
 *  ligne du type "Resultat Mouette correspondant au niveau de la classe :
 *  CE1 1". */
const EPREUVES_AVEC_NIVEAU_EQUIVALENT = new Set(['evalouette', 'mouette_test', 'pingouin_retest'])

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

type TrimestreKey = '' | 'T1' | 'T2' | 'T3'

/**
 * Fiche d'anamnese type EVALEO 6-15. 8 jalons normes que la batterie demande
 * de renseigner en priorite avant l'interpretation des resultats.
 * Source : doc `Etudes de cas CRBO/anamnèse evaleo 6-15.pdf`. Chaque champ est
 * un textarea court optionnel — si rempli, il est serialise et transmis a
 * Claude comme version structuree de l'anamnese (en complement du textarea
 * anamnese libre du wizard general). Si vide, on n'envoie rien.
 */
interface FicheAnamnese {
  antecedents_familiaux: string
  antecedents_medicaux: string
  developpement_langage: string
  scolarite: string
  plainte_lecture: string
  plainte_orthographe: string
  plainte_graphisme: string
  comorbidites_suivi: string
}

const ANAMNESE_CHAMPS: Array<{ key: keyof FicheAnamnese; label: string; placeholder: string }> = [
  { key: 'antecedents_familiaux', label: 'Antecedents familiaux', placeholder: 'Troubles du langage en famille (dyslexie, dysphasie), bilinguisme, fratrie suivie...' },
  { key: 'antecedents_medicaux',  label: 'Antecedents medicaux',  placeholder: 'Prematurite, hospitalisation, otites a repetition, troubles ORL, neurologie...' },
  { key: 'developpement_langage', label: 'Developpement du langage oral', placeholder: 'Babillage, 1er mot, phrase 3 elements, intelligibilite, comparaison aux freres et soeurs...' },
  { key: 'scolarite',             label: 'Scolarite',             placeholder: 'Entree maternelle, redoublement, maintien, classe specialisee (ULIS, SEGPA), comportement en classe...' },
  { key: 'plainte_lecture',       label: 'Plainte lecture',       placeholder: 'Lenteur, confusions visuelles ou phonologiques, dechiffrage laborieux, comprehension reduite, evite la lecture...' },
  { key: 'plainte_orthographe',   label: 'Plainte orthographe',   placeholder: 'Types d\'erreurs (phonetiques, lexicales, grammaticales), fatigabilite, ecart oral/ecrit...' },
  { key: 'plainte_graphisme',     label: 'Plainte graphisme',     placeholder: 'Lenteur, lisibilite, douleur, fatigabilite, tenue du crayon, copie laborieuse...' },
  { key: 'comorbidites_suivi',    label: 'Comorbidites / suivi en cours', placeholder: 'TDAH (diagnostique ou suspecte), TSA, dyspraxie, dyscalculie, suivi orthophonique anterieur, psychomotricite, ergotherapie, psychotherapie, traitement medicamenteux...' },
]

function emptyAnamnese(): FicheAnamnese {
  return {
    antecedents_familiaux: '',
    antecedents_medicaux: '',
    developpement_langage: '',
    scolarite: '',
    plainte_lecture: '',
    plainte_orthographe: '',
    plainte_graphisme: '',
    comorbidites_suivi: '',
  }
}

type TrajectoireKey = '' | 'progres' | 'stagnation' | 'regression'

const TRAJECTOIRE_OPTIONS: Array<{ key: Exclude<TrajectoireKey, ''>; label: string; chip: string }> = [
  { key: 'progres',     label: 'Progres',     chip: 'bg-emerald-500 text-white' },
  { key: 'stagnation',  label: 'Stagnation',  chip: 'bg-yellow-300 text-yellow-900' },
  { key: 'regression',  label: 'Regression',  chip: 'bg-red-600 text-white' },
]

/**
 * Donnees de comparaison avec un bilan precedent — active le MODE
 * RENOUVELLEMENT cote prompt EVALEO. Si l'ortho remplit ces champs, le
 * bloc est serialise avec un en-tete dedie qui declenche un traitement
 * specifique par Claude (synthese d'evolution, conclusion sur la PEC,
 * recommandation poursuite/intensification/arret).
 */
interface ComparaisonPrecedent {
  date_precedent: string  // YYYY-MM-DD
  test_precedent: string  // libre ('EVALEO 6-15 2024', 'Exalang 8-11 2023', ...)
  trajectoire_lo: TrajectoireKey
  commentaire_lo: string
  trajectoire_le: TrajectoireKey
  commentaire_le: string
  trajectoire_autres: TrajectoireKey
  commentaire_autres: string
  evolution_globale: string  // textarea long pour synthese narrative
  pec_anterieure: string     // type / frequence / duree de la PEC entre les 2 bilans
}

function emptyComparaison(): ComparaisonPrecedent {
  return {
    date_precedent: '',
    test_precedent: '',
    trajectoire_lo: '',
    commentaire_lo: '',
    trajectoire_le: '',
    commentaire_le: '',
    trajectoire_autres: '',
    commentaire_autres: '',
    evolution_globale: '',
    pec_anterieure: '',
  }
}

interface State {
  niveau: typeof NIVEAU_OPTIONS[number]['key']
  trimestre: TrimestreKey
  anamnese: FicheAnamnese
  comparaison: ComparaisonPrecedent
  epreuves: Record<string, EpreuveState>
}

function emptyState(): State {
  const ep: Record<string, EpreuveState> = {}
  for (const s of SECTIONS) for (const sd of s.subdomains) for (const e of sd.epreuves) {
    const base: EpreuveState = { percentile: '', score_brut: '', temps: '', observation: '', non_passee: false }
    if (EPREUVES_AVEC_EFFETS.has(e.key)) base.effets = emptyEffets()
    if (EPREUVES_AVEC_ERREURS.has(e.key)) base.erreurs = emptyErreurs()
    if (EPREUVES_AVEC_VITESSE_PRECISION.has(e.key)) base.percentile_vitesse = ''
    if (EPREUVES_AVEC_NIVEAU_EQUIVALENT.has(e.key)) base.niveau_equivalent = ''
    ep[e.key] = base
  }
  return { niveau: '', trimestre: '', anamnese: emptyAnamnese(), comparaison: emptyComparaison(), epreuves: ep }
}

function comparaisonHasData(c: ComparaisonPrecedent): boolean {
  return !!(
    c.date_precedent || c.test_precedent ||
    c.trajectoire_lo || c.trajectoire_le || c.trajectoire_autres ||
    c.commentaire_lo.trim() || c.commentaire_le.trim() || c.commentaire_autres.trim() ||
    c.evolution_globale.trim() || c.pec_anterieure.trim()
  )
}

/**
 * Selecteur de classe EVALEO (7 classes officielles, ordre 1 → 7).
 * Chip affiche la classe + libelle officiel + (pour classes 3-4-5) une
 * nuance "norme basse/centre/haute" en sous-titre. Tooltip donne la plage
 * de centiles + le pourcentage de population de la classe.
 */
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
            title={`${o.label} - ${o.fullLabel} (${o.range}, ${o.pop} de la population)${o.hint ? ` — ${o.hint}` : ''}`}
            className={`px-2 py-1 rounded text-[10px] font-medium transition ${o.chip} ${o.text} ${active ? 'ring-2 ring-offset-1 ring-gray-700' : 'opacity-55 hover:opacity-100'}`}
          >
            <span className="font-bold">{o.label}</span>
            <span className="ml-1 opacity-90">{o.hint ?? o.fullLabel}</span>
          </button>
        )
      })}
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          className="px-2 py-1 rounded text-[10px] text-gray-500 hover:text-gray-900 underline decoration-dotted"
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

export default function Evaleo615ScoresInput({
  notes, onNotesChange, onResultatsChange, onError,
  bilanPrecedentStructure, bilanPrecedentDate,
}: Props) {
  const [state, setState] = useState<State>(emptyState)
  // Defaut : LE ouvert (focus principal des bilans EVALEO langage ecrit comme
  // l'exemple Justine), Competences sous-jacentes ouvert (Stroop / MdT
  // frequents), LO ferme (Morphosyntaxe + autres LO uniquement si bilan
  // complet langage oral+ecrit).
  const [expandedSection, setExpandedSection] = useState<Record<string, boolean>>({ le: true, autres: true, lo: false })
  const [expandedSub, setExpandedSub] = useState<Record<string, boolean>>({})

  // L3 : import PDF EVALEO
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [importing, setImporting] = useState(false)
  const [importInfo, setImportInfo] = useState<string | null>(null)

  async function handleImportFile(file: File) {
    setImporting(true)
    setImportInfo(null)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/extract-evaleo-pdf', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok || !data?.success) {
        const msg = data?.error ?? 'Echec de l\'import PDF.'
        onError?.(msg)
        setImportInfo(`Erreur : ${msg}`)
        return
      }
      const ex = data.extracted as {
        niveau: string
        trimestre: string
        anamnese: FicheAnamnese
        epreuves: Array<{
          key: string
          percentile: string
          score_brut: string
          temps: string
          observation: string
          non_passee: boolean
          effets?: EpreuveEffets
          erreurs?: EpreuveErreurs
          percentile_vitesse?: string
          niveau_equivalent?: string
        }>
      }
      // Fusion : ecrase le state avec les donnees extraites (l'ortho peut
      // toujours modifier apres). Seuls les champs renseignes par Claude
      // ecrasent l'existant.
      setState(prev => {
        const next: State = {
          niveau: (ex.niveau || prev.niveau) as State['niveau'],
          trimestre: (ex.trimestre || prev.trimestre) as TrimestreKey,
          anamnese: { ...prev.anamnese },
          comparaison: prev.comparaison,
          epreuves: { ...prev.epreuves },
        }
        // Anamnese : ne remplace que les champs non vides
        for (const c of ANAMNESE_CHAMPS) {
          const v = ex.anamnese?.[c.key]
          if (typeof v === 'string' && v.trim()) {
            next.anamnese[c.key] = v.trim()
          }
        }
        // Epreuves : merge par cle
        for (const item of ex.epreuves ?? []) {
          if (!next.epreuves[item.key]) continue  // cle inconnue → ignorer
          const cur = next.epreuves[item.key]
          next.epreuves[item.key] = {
            percentile: (item.percentile as PercentileKey) || cur.percentile,
            score_brut: item.score_brut || cur.score_brut,
            temps:      item.temps      || cur.temps,
            observation: item.observation || cur.observation,
            non_passee: !!item.non_passee,
            ...(EPREUVES_AVEC_EFFETS.has(item.key)
              ? { effets: { ...(cur.effets ?? emptyEffets()), ...(item.effets ?? {}) } }
              : {}),
            ...(EPREUVES_AVEC_ERREURS.has(item.key)
              ? { erreurs: { ...(cur.erreurs ?? emptyErreurs()), ...(item.erreurs ?? {}) } }
              : {}),
            ...(EPREUVES_AVEC_VITESSE_PRECISION.has(item.key)
              ? { percentile_vitesse: (item.percentile_vitesse as PercentileKey) || cur.percentile_vitesse || '' }
              : {}),
            ...(EPREUVES_AVEC_NIVEAU_EQUIVALENT.has(item.key)
              ? { niveau_equivalent: (item.niveau_equivalent ?? cur.niveau_equivalent ?? '').toString().trim() }
              : {}),
          }
        }
        return next
      })
      const epreuvesImported = (ex.epreuves ?? []).length
      setImportInfo(`Import reussi : ${epreuvesImported} epreuve${epreuvesImported > 1 ? 's' : ''} pre-remplie${epreuvesImported > 1 ? 's' : ''}. Verifiez et completez si besoin.`)
    } catch (err: any) {
      const msg = err?.message ?? 'Erreur reseau durant l\'import.'
      onError?.(msg)
      setImportInfo(`Erreur : ${msg}`)
    } finally {
      setImporting(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const totalSaisies = useMemo(() => {
    let n = 0
    for (const s of SECTIONS) for (const sd of s.subdomains) for (const e of sd.epreuves) {
      const st = state.epreuves[e.key]
      if (st.non_passee) continue
      // Une epreuve est consideree saisie des qu'une classe est selectionnee
      // (precision OU vitesse pour les epreuves a double sous-score).
      if (st.percentile !== '' || !!st.percentile_vitesse) n++
    }
    return n
  }, [state.epreuves])

  /** Compteurs par classe EVALEO (7 classes officielles). Pour les epreuves
   *  a double sous-score precision/vitesse, chaque dimension renseignee
   *  compte pour 1 dans la repartition (coherent avec le fait que le rapport
   *  Word affichera 2 lignes distinctes). */
  const classeCounts = useMemo(() => {
    const c: Record<Exclude<PercentileKey, ''>, number> = {
      classe_7: 0, classe_6: 0, classe_5: 0, classe_4: 0, classe_3: 0, classe_2: 0, classe_1: 0,
    }
    for (const s of SECTIONS) for (const sd of s.subdomains) for (const e of sd.epreuves) {
      const st = state.epreuves[e.key]
      if (st.non_passee) continue
      if (st.percentile && st.percentile in c) c[st.percentile as Exclude<PercentileKey, ''>]++
      if (st.percentile_vitesse && st.percentile_vitesse in c) c[st.percentile_vitesse as Exclude<PercentileKey, ''>]++
    }
    return c
  }, [state.epreuves])

  /**
   * Audit 2026-05-29 (amelioration #6) — live preview deltas en mode
   * renouvellement. Calcule en temps reel les compteurs d'evolution
   * AVANT la generation du CRBO, pour que l'ortho voit ce qui ressortira
   * dans le tableau comparatif Word et ajuste sa saisie si besoin.
   *
   * Matching epreuve actuelle ↔ precedente : par label lowercased+trimmed.
   * Si le bilan precedent vient d'un CRBO ortho.ia EVALEO, les labels
   * matchent exactement (Claude utilise les libelles officiels). Pour
   * un PDF importe, le matching peut etre fuzzy — couvert par le fix #3
   * cote word-export.
   *
   * Seuil delta ±10 sur percentile_value, identique au calcul cote prompt
   * Claude et cote rendu Word (lib/word-export.ts:716). Garantit que ce
   * que l'ortho voit ici = ce qui sortira dans le Word.
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

    for (const s of SECTIONS) {
      for (const sd of s.subdomains) {
        for (const e of sd.epreuves) {
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
          if (delta >= 10) {
            progres++
            progresList.push(e.label)
          } else if (delta <= -10) {
            regression++
            regressionList.push(e.label)
          } else {
            stable++
          }
        }
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
    const anamneseHasData = ANAMNESE_CHAMPS.some(c => state.anamnese[c.key].trim().length > 0)
    const compHasData = comparaisonHasData(state.comparaison)
    const hasBilanPrecedent = !!(bilanPrecedentStructure && bilanPrecedentStructure.domains && bilanPrecedentStructure.domains.length > 0)
    if (totalSaisies === 0 && !state.niveau && !anamneseHasData && !compHasData && !hasBilanPrecedent) {
      onResultatsChange('')
      return
    }
    const lines: string[] = []
    lines.push('=== EVALEO 6-15 (Launay, Maeder, Roustit, Touzin — Ortho Édition 2018) ===')
    if (state.niveau) {
      const niveauLabel = NIVEAU_OPTIONS.find(o => o.key === state.niveau)?.label
      // Trimestre additionnel applicable UNIQUEMENT au CE1 (le CP encode son
      // trimestre dans le niveau via CP_1tr / CP_3tr ; CE2 et au-dela n'ont
      // pas de distinction trimestrielle dans l'etalonnage EVALEO).
      const showTrimestre = state.trimestre && state.niveau === 'CE1'
      lines.push(`Niveau scolaire : ${niveauLabel}${showTrimestre ? ` — ${state.trimestre}` : ''}`)
      lines.push('')
    }
    // L2 : fiche anamnese EVALEO serialisee (8 jalons normes)
    if (anamneseHasData) {
      lines.push('=== Fiche anamnese EVALEO (jalons normes) ===')
      for (const c of ANAMNESE_CHAMPS) {
        const v = state.anamnese[c.key].trim()
        if (v) lines.push(`${c.label} : ${v}`)
      }
      lines.push('')
    }
    // L4 : comparaison bilan precedent → active le MODE RENOUVELLEMENT prompt
    if (compHasData || hasBilanPrecedent) {
      const c = state.comparaison
      lines.push('=== COMPARAISON BILAN PRECEDENT (mode renouvellement) ===')
      const dateToUse = c.date_precedent || (bilanPrecedentDate ?? '')
      if (dateToUse) lines.push(`Date bilan precedent : ${dateToUse}`)
      if (c.test_precedent.trim()) lines.push(`Test precedent : ${c.test_precedent.trim()}`)
      if (c.pec_anterieure.trim()) lines.push(`PEC entre les 2 bilans : ${c.pec_anterieure.trim()}`)
      const dumpTraj = (label: string, traj: TrajectoireKey, comm: string) => {
        if (!traj && !comm.trim()) return
        const trajLabel = TRAJECTOIRE_OPTIONS.find(o => o.key === traj)?.label ?? ''
        const parts: string[] = []
        if (trajLabel) parts.push(trajLabel)
        if (comm.trim()) parts.push(comm.trim())
        lines.push(`${label} : ${parts.join(' — ')}`)
      }
      dumpTraj('Trajectoire LO', c.trajectoire_lo, c.commentaire_lo)
      dumpTraj('Trajectoire LE', c.trajectoire_le, c.commentaire_le)
      dumpTraj('Trajectoire Autres', c.trajectoire_autres, c.commentaire_autres)
      if (c.evolution_globale.trim()) {
        lines.push(`Synthese evolution globale : ${c.evolution_globale.trim()}`)
      }
      // Tableau structure du bilan precedent (epreuve par epreuve) si importe :
      // Claude exploitera ces percentile_value pour calculer les evolutions
      // chiffrees et produire son synthese_evolution.
      if (hasBilanPrecedent) {
        lines.push('')
        lines.push('--- Tableau brut du bilan precedent (epreuves + classe/percentile importe via /api/extract-previous-bilan) ---')
        lines.push('Format : "<Domaine> | <Epreuve> | classe/percentile precedent | percentile_value precedent"')
        for (const d of bilanPrecedentStructure!.domains) {
          for (const ep of d.epreuves) {
            const interp = (ep.interpretation || '').trim()
            const perc = (ep.percentile || '').trim()
            const pv = typeof ep.percentile_value === 'number' ? ep.percentile_value : null
            lines.push(`${d.nom} | ${ep.nom} | ${interp || perc || '—'} | ${pv != null ? pv : '—'}`)
          }
        }
        lines.push('--- fin tableau bilan precedent ---')
      }
      lines.push('')
    }
    for (const s of SECTIONS) {
      let sectionPrinted = false
      for (const sd of s.subdomains) {
        let subPrinted = false
        for (const e of sd.epreuves) {
          const st = state.epreuves[e.key]
          if (st.non_passee) continue
          const hasVitesse = !!st.percentile_vitesse
          const hasNiveauEq = !!(st.niveau_equivalent && st.niveau_equivalent.trim())
          const hasData = st.percentile !== '' || st.score_brut.trim() || st.temps.trim() || st.observation.trim() || hasVitesse || hasNiveauEq
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
          // Si l'epreuve a 2 classes distinctes (precision + vitesse), on
          // labelise chacune pour que Claude emette 2 lignes separees dans
          // la sortie structuree (cf. evaleo-6-15.ts section DUAL LECTURE).
          const splitVitesse = EPREUVES_AVEC_VITESSE_PRECISION.has(e.key) && hasVitesse
          if (st.percentile !== '') {
            // Format EVALEO natif officiel : "Classe 4 (Norme) — P39-P62".
            // Pour les classes 3, 4, 5 le libelle est "Norme" tout court
            // (jamais "Norme faible/mediane/haute" — ce serait une fabrication
            // non officielle). Pour les classes 6/7 : "Superieure a la moyenne"
            // / "Tres superieure". Pour 1/2 : "Pathologique" / "Fragilite".
            // Claude DOIT recopier exactement ce label dans `interpretation`.
            const lbl = classeEvaleoLabel(st.percentile)
            const full = classeEvaleoFullLabel(st.percentile)
            const range = classeEvaleoRange(st.percentile)
            const labelClasse = splitVitesse ? 'Classe EVALEO (precision)' : 'Classe EVALEO'
            lines.push(`  ${labelClasse} : ${lbl} (${full}) — ${range}`)
          }
          if (splitVitesse) {
            const lblV = classeEvaleoLabel(st.percentile_vitesse!)
            const fullV = classeEvaleoFullLabel(st.percentile_vitesse!)
            const rangeV = classeEvaleoRange(st.percentile_vitesse!)
            lines.push(`  Classe EVALEO (vitesse) : ${lblV} (${fullV}) — ${rangeV}`)
          }
          if (st.score_brut.trim()) lines.push(`  Score brut : ${st.score_brut.trim()}`)
          if (st.temps.trim()) lines.push(`  Temps : ${st.temps.trim()}`)
          // Niveau scolaire equivalent EVALEO (Evalouette / Mouette / Pingouin).
          // Claude doit le concatener dans le champ `score` du tableau Word
          // sous forme "<score brut> (equivalent CE1 T1)".
          if (hasNiveauEq) {
            lines.push(`  Niveau scolaire equivalent EVALEO : ${st.niveau_equivalent!.trim()}`)
          }
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
    // Synthèse — repartition par CLASSES EVALEO officielles (7 classes)
    const tot = Object.values(classeCounts).reduce((a, b) => a + b, 0)
    if (tot > 0) {
      lines.push('--- Synthese classes EVALEO ---')
      for (const opt of PERCENTILE_OPTIONS) {
        const n = classeCounts[opt.key]
        if (n > 0) lines.push(`${opt.label} - ${opt.fullLabel} (${opt.range}) : ${n}`)
      }
    }
    onResultatsChange(lines.join('\n'))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, totalSaisies, classeCounts])

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

      {/* L3 : import PDF EVALEO uniquement (rapport HappyNeuron ou scan du cahier).
          Le .docx et l'image sont volontairement exclus : la position des X de
          classe dans les tableaux EVALEO est perdue lors de l'extraction texte
          (mammoth) ou de la Vision image, ce qui fausse la cotation des
          epreuves multi-sous-scores (Evalouette, Mouette, Stroop, Lecture de
          pseudomots). Seul le PDF preserve la grille tabulaire. */}
      <div className="rounded-lg border border-sky-200 bg-sky-50/60 p-3">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="flex items-start gap-2 min-w-0">
            <FileUp size={18} className="text-sky-700 shrink-0 mt-0.5" />
            <div className="text-sm min-w-0">
              <p className="font-semibold text-sky-900">Importer un document EVALEO (optionnel)</p>
              <p className="text-sky-800 text-xs mt-0.5 leading-relaxed">
                Format accepte : <strong>PDF uniquement</strong> (rapport de cotation HappyNeuron, scan
                du cahier de passation rempli, ou bilan deja redige exporte en PDF). Si vous avez un
                Word, exportez-le en PDF avant import (Fichier &gt; Exporter &gt; PDF).
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

      {/* Niveau scolaire + trimestre */}
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <label className="flex items-center gap-2 text-sm font-semibold text-gray-900 mb-2">
          <Info size={14} className="text-indigo-600" />
          Niveau scolaire au moment de la passation
        </label>
        <div className="flex flex-wrap gap-2 items-center">
          <select
            value={state.niveau}
            onChange={(e) => {
              const nextNiveau = e.target.value as State['niveau']
              setState(s => ({
                ...s,
                niveau: nextNiveau,
                // Reset trimestre si le nouveau niveau ne supporte plus le
                // selecteur (uniquement CE1 le supporte), pour eviter qu'une
                // valeur fantome ne fuite dans la serialisation au LLM.
                trimestre: nextNiveau === 'CE1' ? s.trimestre : '',
              }))
            }}
            className="w-full sm:w-72 px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          >
            {NIVEAU_OPTIONS.map(o => (
              <option key={o.key} value={o.key}>{o.label}</option>
            ))}
          </select>
          {/* L2 : dropdown trimestre additionnel UNIQUEMENT pour le CE1
              (CP encode son trimestre via CP_1tr / CP_3tr dans la liste
              niveaux). Pour CE2 et au-dela, l'etalonnage EVALEO ne distingue
              pas les trimestres — pas de selecteur. Seuls le 1er et le 3e
              trimestre sont proposes (le 2e n'apporte pas d'info clinique
              dans le CE1 selon les exemples de reference). */}
          {state.niveau === 'CE1' && (
            <select
              value={state.trimestre}
              onChange={(e) => setState(s => ({ ...s, trimestre: e.target.value as TrimestreKey }))}
              className="w-full sm:w-44 px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            >
              <option value="">— trimestre —</option>
              <option value="T1">T1 (oct-dec)</option>
              <option value="T3">T3 (avril-juin)</option>
            </select>
          )}
        </div>
        <p className="text-[11px] text-gray-500 mt-1">
          8 niveaux d&apos;étalonnage officiels EVALEO. Trimestre proposé uniquement
          pour le CE1 (1er et 3e trimestre), CP encodant deja son trimestre dans
          la liste des niveaux.
        </p>
      </div>

      {/* L2 : Fiche anamnese EVALEO — 8 jalons normes optionnels */}
      <div className="rounded-lg border border-purple-200 bg-purple-50/40">
        <details className="group" open={false}>
          <summary className="cursor-pointer px-4 py-3 flex items-center justify-between gap-3 hover:bg-purple-50">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-purple-900">Fiche anamnese EVALEO (optionnelle, 8 jalons normes)</p>
              <p className="text-[11px] text-purple-700 mt-0.5 leading-relaxed">
                Si vous saisissez ces champs, ils sont transmis a l&apos;IA en complement de l&apos;anamnese
                libre du wizard general. Permet de respecter le canevas anamnese officiel EVALEO sans
                contraindre la saisie habituelle.
              </p>
            </div>
            <ChevronDown size={16} className="shrink-0 transition-transform group-open:rotate-180" />
          </summary>
          <div className="border-t border-purple-200 px-4 py-3 grid sm:grid-cols-2 gap-2.5">
            {ANAMNESE_CHAMPS.map(c => (
              <div key={c.key} className="flex flex-col">
                <label className="text-[11px] font-medium text-purple-900 mb-0.5">{c.label}</label>
                <textarea
                  value={state.anamnese[c.key]}
                  onChange={(e) => setState(s => ({ ...s, anamnese: { ...s.anamnese, [c.key]: e.target.value } }))}
                  rows={2}
                  placeholder={c.placeholder}
                  className="px-2 py-1.5 border border-purple-200 rounded text-[11px] leading-relaxed resize-y bg-white focus:outline-none focus:ring-2 focus:ring-purple-300"
                />
              </div>
            ))}
          </div>
        </details>
      </div>

      {/* L4 : Comparaison bilan precedent — active le mode renouvellement */}
      <div className="rounded-lg border border-teal-200 bg-teal-50/40">
        <details className="group" open={!!bilanPrecedentStructure}>
          <summary className="cursor-pointer px-4 py-3 flex items-center justify-between gap-3 hover:bg-teal-50">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-teal-900">Comparaison avec un bilan precedent (renouvellement)</p>
              <p className="text-[11px] text-teal-700 mt-0.5 leading-relaxed">
                Remplissez ces champs UNIQUEMENT si c&apos;est un renouvellement de bilan. L&apos;IA structurera
                alors la synthese comme une comparaison aux resultats anterieurs (progres / stagnation /
                regression par domaine) et conclura sur l&apos;efficacite de la prise en charge.
              </p>
            </div>
            <ChevronDown size={16} className="shrink-0 transition-transform group-open:rotate-180" />
          </summary>
          <div className="border-t border-teal-200 px-4 py-3 space-y-3">

            {/* Encart bilan precedent importe ou message d'aide */}
            {bilanPrecedentStructure ? (
              <div className="rounded border border-emerald-300 bg-emerald-50/70 p-2.5 flex items-start gap-2">
                <GitCompare size={16} className="text-emerald-700 shrink-0 mt-0.5" />
                <div className="text-[11px] text-emerald-900 leading-relaxed min-w-0">
                  <p className="font-semibold">Bilan precedent importe et detecte</p>
                  <p className="mt-0.5">
                    {bilanPrecedentStructure.domains.length} domaine{bilanPrecedentStructure.domains.length > 1 ? 's' : ''} ·{' '}
                    {bilanPrecedentStructure.domains.reduce((acc, d) => acc + d.epreuves.length, 0)} epreuves precedentes
                    {bilanPrecedentDate ? ` · ${new Date(bilanPrecedentDate).toLocaleDateString('fr-FR')}` : ''}.
                    L&apos;IA va calculer automatiquement les evolutions epreuve par epreuve et le rendu Word
                    affichera un tableau comparatif avec fleches d&apos;evolution (↑ progres / → stable /
                    ↓ regression).
                  </p>
                </div>
              </div>
            ) : (
              <div className="rounded border border-amber-200 bg-amber-50/60 p-2.5 flex items-start gap-2">
                <Info size={14} className="text-amber-700 shrink-0 mt-0.5" />
                <p className="text-[11px] text-amber-900 leading-relaxed">
                  <strong>Astuce :</strong> pour comparer automatiquement aux scores d&apos;un bilan
                  precedent (PDF ou Word), utilisez le bouton <em>« Importer un bilan precedent »</em> a
                  l&apos;etape 4 du wizard. Une fois importe, l&apos;IA produira un tableau comparatif
                  avec fleches d&apos;evolution dans le CRBO final. Vous pouvez aussi remplir manuellement
                  les champs ci-dessous (trajectoires par domaine + commentaires libres).
                </p>
              </div>
            )}
            <div className="grid sm:grid-cols-2 gap-2.5">
              <div className="flex flex-col">
                <label className="text-[11px] font-medium text-teal-900 mb-0.5">Date du bilan precedent</label>
                <input
                  type="date"
                  value={state.comparaison.date_precedent}
                  onChange={(e) => setState(s => ({ ...s, comparaison: { ...s.comparaison, date_precedent: e.target.value } }))}
                  className="px-2 py-1.5 border border-teal-200 rounded text-[11px] bg-white"
                />
              </div>
              <div className="flex flex-col">
                <label className="text-[11px] font-medium text-teal-900 mb-0.5">Test precedent (intitule)</label>
                <input
                  type="text"
                  value={state.comparaison.test_precedent}
                  onChange={(e) => setState(s => ({ ...s, comparaison: { ...s.comparaison, test_precedent: e.target.value } }))}
                  placeholder="ex. EVALEO 6-15 (decembre 2024), Exalang 8-11..."
                  className="px-2 py-1.5 border border-teal-200 rounded text-[11px] bg-white"
                />
              </div>
            </div>

            <div className="flex flex-col">
              <label className="text-[11px] font-medium text-teal-900 mb-0.5">Prise en charge anterieure (entre les 2 bilans)</label>
              <textarea
                value={state.comparaison.pec_anterieure}
                onChange={(e) => setState(s => ({ ...s, comparaison: { ...s.comparaison, pec_anterieure: e.target.value } }))}
                rows={2}
                placeholder="Type de PEC (orthophonie hebdomadaire 45 min, axes cibles), duree, assiduite, autres suivis (psychomotricite, ergotherapie)..."
                className="px-2 py-1.5 border border-teal-200 rounded text-[11px] leading-relaxed resize-y bg-white"
              />
            </div>

            {(['lo', 'le', 'autres'] as const).map(dom => {
              const trajKey = `trajectoire_${dom}` as 'trajectoire_lo' | 'trajectoire_le' | 'trajectoire_autres'
              const commKey = `commentaire_${dom}` as 'commentaire_lo' | 'commentaire_le' | 'commentaire_autres'
              const domLabel = { lo: 'Langage Oral', le: 'Langage Ecrit', autres: 'Autres (memoire, visuo-att., praxies)' }[dom]
              const traj = state.comparaison[trajKey]
              return (
                <div key={dom} className="rounded border border-teal-200 bg-white p-2">
                  <p className="text-[11px] font-semibold text-teal-900 mb-1">{domLabel}</p>
                  <div className="flex flex-wrap gap-1 mb-1.5">
                    {TRAJECTOIRE_OPTIONS.map(o => {
                      const active = traj === o.key
                      return (
                        <button
                          key={o.key}
                          type="button"
                          onClick={() => setState(s => ({ ...s, comparaison: { ...s.comparaison, [trajKey]: active ? '' : o.key } }))}
                          className={`px-2 py-0.5 rounded text-[10px] font-medium transition ${o.chip} ${active ? 'ring-2 ring-offset-1 ring-gray-700' : 'opacity-50 hover:opacity-100'}`}
                        >
                          {o.label}
                        </button>
                      )
                    })}
                  </div>
                  <textarea
                    value={state.comparaison[commKey]}
                    onChange={(e) => setState(s => ({ ...s, comparaison: { ...s.comparaison, [commKey]: e.target.value } }))}
                    rows={1}
                    placeholder="Commentaire libre sur l'evolution de ce domaine..."
                    className="w-full px-2 py-1 border border-teal-200 rounded text-[11px] leading-relaxed resize-y bg-white"
                  />
                </div>
              )
            })}

            <div className="flex flex-col">
              <label className="text-[11px] font-medium text-teal-900 mb-0.5">Synthese narrative de l&apos;evolution globale (optionnelle)</label>
              <textarea
                value={state.comparaison.evolution_globale}
                onChange={(e) => setState(s => ({ ...s, comparaison: { ...s.comparaison, evolution_globale: e.target.value } }))}
                rows={3}
                placeholder="Synthese narrative libre sur l'evolution globale entre les 2 bilans : faits saillants, leviers, freins, ressenti de l'enfant et de la famille..."
                className="px-2 py-1.5 border border-teal-200 rounded text-[11px] leading-relaxed resize-y bg-white"
              />
            </div>
          </div>
        </details>
      </div>

      {/* Live preview deltas (amelioration #6) — visible seulement si un
          bilan precedent est importe ET que l'ortho a deja saisi des
          epreuves. Donne un apercu temps reel de ce qui ressortira dans
          le tableau comparatif Word. Sert d'autodiagnostic : si "0 progres
          + 0 stable + 0 regression + X nouvelles", c'est que le matching
          par label ne fonctionne pas (titres differents entre les 2 bilans). */}
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
                <span className="font-bold">✨ {evolutionStats.nouvelles}</span>
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
              Si la majorité devraient être comparables, vérifiez que les titres d&apos;épreuves du bilan précédent correspondent aux libellés EVALEO officiels.
            </p>
          )}
        </div>
      )}

      {/* Synthèse — repartition par CLASSE EVALEO (7 classes officielles) */}
      {totalSaisies > 0 && (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
          <p className="text-xs font-semibold text-gray-700 mb-2">
            Repartition par classe EVALEO — {totalSaisies}/{totalEpreuves} epreuves saisies
          </p>
          <div className="flex flex-wrap gap-1.5">
            {PERCENTILE_OPTIONS.map(opt => {
              const n = classeCounts[opt.key]
              if (n === 0) return null
              return (
                <span key={opt.key} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${opt.chip} ${opt.text}`}>
                  <span className="font-bold">{n}</span>
                  <span>{opt.label} - {opt.fullLabel}</span>
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
                  const hasData = sd.epreuves.some(e => {
                    const st = state.epreuves[e.key]
                    return st.percentile !== ''
                      || !!st.percentile_vitesse
                      || !!(st.niveau_equivalent && st.niveau_equivalent.trim())
                      || !!st.observation.trim()
                      || st.non_passee
                  })
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
                                    {EPREUVES_AVEC_VITESSE_PRECISION.has(e.key) ? (
                                      <div className="space-y-1.5">
                                        <div>
                                          <p className="text-[10px] font-semibold text-gray-700 mb-0.5">
                                            Précision (Score total)
                                          </p>
                                          <PercentileChips value={st.percentile} onChange={(v) => setField(e.key, 'percentile', v)} />
                                        </div>
                                        <div>
                                          <p className="text-[10px] font-semibold text-gray-700 mb-0.5">
                                            Vitesse (Temps total)
                                          </p>
                                          <PercentileChips
                                            value={st.percentile_vitesse ?? ''}
                                            onChange={(v) => setField(e.key, 'percentile_vitesse', v)}
                                          />
                                        </div>
                                        <p className="text-[10px] text-gray-500 italic leading-tight">
                                          EVALEO fournit deux classes distinctes pour cette épreuve. Saisissez les deux pour qu&apos;elles apparaissent en lignes séparées dans le rapport Word.
                                        </p>
                                      </div>
                                    ) : (
                                      <PercentileChips value={st.percentile} onChange={(v) => setField(e.key, 'percentile', v)} />
                                    )}
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
                                    {/* Niveau scolaire equivalent EVALEO (Evalouette / Mouette / Pingouin).
                                        Cf. ligne sous le tableau de cotation EVALEO : "Resultat <Test>
                                        correspondant au niveau de la classe : CE1 1" (= "CE1 T1"). */}
                                    {EPREUVES_AVEC_NIVEAU_EQUIVALENT.has(e.key) && (
                                      <div className="mt-1.5">
                                        <input
                                          type="text"
                                          value={st.niveau_equivalent ?? ''}
                                          onChange={(ev) => setField(e.key, 'niveau_equivalent', ev.target.value)}
                                          placeholder="Niveau scolaire équivalent EVALEO (ex. CE1 T1, CM2 T3), lu sous le tableau"
                                          className="w-full px-2 py-1 border border-gray-200 rounded text-[11px]"
                                        />
                                      </div>
                                    )}
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
