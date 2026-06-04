'use client'

/**
 * Saisie structurée des scores PREDIMEM (PRotocole d'Evaluation et de
 * Dépistage des Insuffisances de la MEMoire, Duchêne & Jaillard,
 * HappyNeuron 2019).
 *
 * Pourquoi un composant dédié plutôt que le textarea "résultats manuels"
 * standard : PREDIMEM a 11 épreuves avec des subtests, des scores bruts
 * non-percentiles, des temps chronométrés, et un système d'interprétation
 * en 5 zones colorées HappyNeuron (vert foncé / vert clair / jaune /
 * orange / rouge) qui dépend du couple (âge × NSC) du sujet. Une saisie
 * libre exposerait l'ortho à des erreurs de saisie et empêcherait
 * l'IA générant le CRBO de bien interpréter les zones.
 *
 * Stratégie de saisie : le logiciel HappyNeuron officiel calcule
 * automatiquement la zone du sujet à partir de la moyenne et de l'écart-
 * type du groupe d'appartenance (âge × NSC). On NE recalcule PAS cette
 * stratification ici — c'est l'ortho qui REPORTE la zone visible sur son
 * écran HappyNeuron (5 zones). Sinon il faudrait embarquer 5×3×11×2 ≈ 330
 * valeurs de normes dans le client.
 *
 * Pour chaque épreuve, l'ortho saisit :
 *   - le score brut obtenu (avec validation min/max),
 *   - éventuellement le temps (chronométré par le logiciel),
 *   - la zone HappyNeuron visible à l'écran (vert foncé → rouge),
 *   - une observation libre (stratégies, attitudes, type d'erreurs).
 *
 * Le composant écrit un texte normalisé dans `resultats_manuels` à chaque
 * changement, lisible par l'IA générant le CRBO.
 *
 * Couplage : utilisé dans `app/dashboard/nouveau-crbo/page.tsx` quand
 * `test_utilise === ['PREDIMEM']`.
 */

import { useEffect, useMemo, useRef, useState } from 'react'
import { Brain, ChevronDown, AlertCircle, FileUp, GitCompare, Info, Loader2 } from 'lucide-react'
import MicButton from '../MicButton'
import type { CRBOStructure } from '@/lib/prompts'

interface Props {
  /** Notes globales (comportement, fatigabilité, stratégies générales). */
  notes: string
  onNotesChange: (v: string) => void
  /** Écrit le résultat normalisé dans `resultats_manuels`. */
  onResultatsChange: (normalized: string) => void
  /** Callback erreur (remonte au parent). */
  onError?: (msg: string) => void
  /** MODE RENOUVELLEMENT — structure du bilan précédent (extraite depuis le
   *  bouton d'import "bilan précédent" de l'étape 4 du formulaire). Si
   *  présente, encart d'évolution live + tableau comparatif côté Word.
   *  Mapping zone HappyNeuron → percentile_value identique au prompt
   *  (vert_fonce=85, vert_clair=60, jaune=18, orange=8, rouge=3). */
  bilanPrecedentStructure?: CRBOStructure | null
  /** Date du bilan précédent (ISO yyyy-mm-dd). */
  bilanPrecedentDate?: string | null
}

/** Mapping zone HappyNeuron PREDIMEM → percentile_value, identique au
 *  prompt clinique (lib/prompts/tests/predimem.ts) pour cohérence entre
 *  le calcul de delta live côté form et le mode renouvellement IA. */
const ZONE_TO_PCT_VALUE: Record<string, number> = {
  vert_fonce: 85,
  vert_clair: 60,
  jaune: 18,
  orange: 8,
  rouge: 3,
}

/** Identifiant stable d'une épreuve (utilisé comme clé d'état et dans la
 *  sortie normalisée). Ne PAS renommer une fois en prod (clés mémorisées
 *  dans le localStorage `crbo-draft`). */
type EpreuveKey =
  | 'e01_objets'
  | 'e02_texte_lu'
  | 'e03_mdt'
  | 'e04_blasons'
  | 'e05_tangram'
  | 'e06_assoc'
  | 'e07_texte_entendu'
  | 'e08_formes'
  | 'e09_auditive'
  | 'e10_spatiale'
  | 'e11_visages'

/** Zone d'interprétation officielle HappyNeuron (5 paliers σ).
 *  Reportée par l'ortho depuis son écran HappyNeuron (= source de vérité
 *  pour le seuil d'alerte stratifié par âge × NSC). */
type ZoneKey = '' | 'vert_fonce' | 'vert_clair' | 'jaune' | 'orange' | 'rouge'

const ZONES: Array<{ key: Exclude<ZoneKey, ''>; label: string; sigma: string; chipBg: string; chipText: string; chipRing: string }> = [
  { key: 'vert_fonce', label: 'Vert foncé', sigma: '≥ moyenne', chipBg: 'bg-emerald-600', chipText: 'text-white',     chipRing: 'ring-emerald-700' },
  { key: 'vert_clair', label: 'Vert clair', sigma: 'M−1σ à M−1,5σ', chipBg: 'bg-emerald-300', chipText: 'text-emerald-900', chipRing: 'ring-emerald-500' },
  { key: 'jaune',      label: 'Jaune',      sigma: 'M−1,5σ à M−2σ (seuil d\'alerte)', chipBg: 'bg-amber-300',   chipText: 'text-amber-900',   chipRing: 'ring-amber-500' },
  { key: 'orange',     label: 'Orange',     sigma: 'M−2σ à M−3σ',  chipBg: 'bg-orange-500', chipText: 'text-white',     chipRing: 'ring-orange-600' },
  { key: 'rouge',      label: 'Rouge',      sigma: '< M−3σ (effondrement)', chipBg: 'bg-red-600',    chipText: 'text-white',     chipRing: 'ring-red-700' },
]

/** Mapping zone → libellé clinique cohérent avec le module prompt
 *  predimem.ts (vocabulaire HappyNeuron utilisé dans le CRBO). */
const ZONE_LABEL_CLINIQUE: Record<Exclude<ZoneKey, ''>, string> = {
  vert_fonce:  'performance préservée',
  vert_clair:  'performance dans la moyenne basse, à surveiller',
  jaune:       'fragilité objectivée (seuil d\'alerte)',
  orange:      'difficulté avérée',
  rouge:       'effondrement',
}

/** Définition d'un subtest = un score brut à saisir (ex. "Rappel libre",
 *  "Reconnaissance", "Subtest 3a"). Une épreuve PREDIMEM a entre 1 et 4
 *  subtests. */
interface Subtest {
  /** Identifiant stable (sérialisé). */
  key: string
  /** Libellé court affiché à côté de l'input. */
  label: string
  /** Score maximum (utilisé pour validation et %). */
  max: number
  /** Texte d'aide affiché en gris sous le label. */
  hint?: string
}

/** Case à cocher d'observation rapide — gain UX majeur en passation :
 *  l'ortho coche les patterns observés (ex. "intrusions présentes", "stratégie
 *  de catégorisation spontanée") au lieu de re-taper la même formulation à
 *  chaque bilan. Les textes des cases cochées sont concaténés dans la sortie
 *  normalisée (à côté de l'observation libre). N'écrasent PAS le champ
 *  observation libre — coexistent avec.
 *  Cf. mémo Bug fix 2026-06-04 : seules les 5 épreuves prioritaires
 *  (01, 03, 06, 09, 10) en sont équipées en v1, par retour ortho. */
interface QuickObs {
  /** Identifiant stable (sérialisé dans l'état) — ne PAS renommer en prod. */
  key: string
  /** Libellé court affiché dans la chip-checkbox. */
  label: string
  /** Texte inséré dans la sortie normalisée si cochée. Doit être une
   *  proposition complète (avec ponctuation finale gérée à la concaténation). */
  text: string
  /** Couleur de la chip selon la valence clinique :
   *  - 'positive' (vert) = signe favorable (stratégie observée, bon bénéfice indiçage)
   *  - 'neutral'  (gris) = observation factuelle sans valence (verbalisation, hésitation)
   *  - 'negative' (rouge clair) = signe défavorable (intrusions, redemande, aide nécessaire) */
  tone?: 'positive' | 'neutral' | 'negative'
}

interface Epreuve {
  key: EpreuveKey
  /** Numéro officiel HappyNeuron (01 à 11). */
  num: string
  /** Libellé court affiché en titre de carte. */
  label: string
  /** Description courte (ce que l'épreuve mesure). */
  description: string
  /** 1 à 4 subtests à saisir. */
  subtests: Subtest[]
  /** Si true, on affiche un champ temps en plus (la plupart des épreuves). */
  hasTemps: boolean
  /** Règles de cotation officielles (manuel HappyNeuron 2019) — accordéon. */
  rules: string[]
  /** Aide à l'interprétation clinique (optionnel) — accordéon ambre. */
  interpretation?: string[]
  /** Placeholder pour la zone observation. */
  obsPlaceholder: string
  /** Cases d'observation rapide à cocher (optionnel). Dérivées du manuel +
   *  bonnes pratiques cliniques. Cocher → texte ajouté à la sortie normalisée. */
  quickObservations?: QuickObs[]
}

const EPREUVES: Epreuve[] = [
  {
    key: 'e01_objets',
    num: '01',
    label: 'Mémoire visuelle d\'objets',
    description: 'Mémoire épisodique sur entrée visuelle imagée. 25 photos défilent (encodage par dénomination), puis rappel libre immédiat. Reconnaissance différée après ≥ 10 min.',
    subtests: [
      { key: 'rappel',       label: 'Rappel libre (1a)',           max: 25, hint: '1 pt par objet rappelé. −1 pt par intrusion (objet non présenté).' },
      { key: 'reconnaissance', label: 'Reconnaissance différée (1b)', max: 25, hint: '1 pt par objet reconnu du 1er coup parmi 6 (5 distracteurs).' },
      { key: 'optionnel_30', label: 'Optionnel /30 (si rappel < 8)', max: 30, hint: 'Reconnaissance verbale parmi 30 mots dont 10 cibles. NON comptabilisé — sert à dissocier encodage/récupération.' },
    ],
    hasTemps: true,
    rules: [
      'Étape 1 (présentation/dénomination) : NON notée. Si le sujet ne dénomme pas, on lui donne le nom et on note la difficulté.',
      'Rappel libre : arrêter quand "je ne sais plus" ou au bout de 3 min. Périphrase / geste acceptés.',
      'Intrusion = un objet nommé qui n\'était PAS dans les 25 → −1 pt (malus). Doublons = pas de pénalité mais à signaler.',
      'Optionnelle 1a (/30) UNIQUEMENT si rappel libre < 8. L\'examinateur choisit 10 objets non rappelés mêlés à 20 distracteurs verbaux.',
      'Prolongation possible : indiçage catégoriel ("il y avait des animaux / moyens de transport / objets qu\'on porte sur soi…") — dissocie stockage vs récupération.',
      'Reconnaissance 1b : différée d\'au moins 10 min (intercaler épreuve 02 « mémoire d\'un texte lu »). 25 planches de 6 objets (1 cible + 5 distracteurs), 1 pt par objet reconnu du 1er coup.',
      'À noter qualitativement : signaler quand le sujet dit "j\'avais oublié celui-là" → indicateur récupération vs stockage.',
    ],
    interpretation: [
      'Rappel + reconnaissance bons → mémoire épisodique visuelle préservée.',
      'Rappel libre faible MAIS reconnaissance préservée → suggère un trouble de RÉCUPÉRATION (encodage et stockage OK).',
      'Rappel + reconnaissance + optionnelle TOUS faibles, peu sensible à l\'indiçage → suggère un trouble d\'ENCODAGE / consolidation.',
      'Croiser avec les épreuves 02 et 07 (textes) et 06 (associations sémantiques) pour confirmer le profil. Jamais conclure sur cette épreuve isolée.',
    ],
    obsPlaceholder: 'Complément libre (au-delà des cases cochées). Ex. décroche après le 7e objet, périphrases sur "marteau", revient sur "hache" en différé.',
    quickObservations: [
      { key: 'strat_cat',     label: 'Stratégie de catégorisation spontanée',  text: 'Stratégie de catégorisation spontanée observée (regroupements animaux / objets / etc.).', tone: 'positive' },
      { key: 'pas_strat',     label: 'Aucune stratégie spontanée',             text: 'Pas de stratégie de mémorisation spontanée.', tone: 'negative' },
      { key: 'intrusions',    label: 'Intrusions',                             text: 'Intrusions observées (objets nommés non présentés, −1 pt chacun).', tone: 'negative' },
      { key: 'doublons',      label: 'Doublons signalés',                      text: 'Doublons signalés spontanément (pas de pénalité, à noter).', tone: 'neutral' },
      { key: 'jai_oublie',    label: '"J\'avais oublié celui-là"',             text: 'Verbalisations type « j\'avais oublié celui-là » à la reconnaissance — indicateur de récupération vs stockage.', tone: 'neutral' },
      { key: 'opt_30',        label: 'Optionnelle /30 passée',                 text: 'Épreuve optionnelle /30 administrée (rappel libre < 8).', tone: 'neutral' },
      { key: 'indicage_cat',  label: 'Indiçage catégoriel utilisé',            text: 'Indiçage catégoriel utilisé en prolongation (« il y avait des animaux / objets qu\'on porte sur soi… »).', tone: 'neutral' },
      { key: 'benef_indicage', label: 'Bénéfice net à l\'indiçage',            text: 'Bon bénéfice à l\'indiçage / reconnaissance — oriente vers un trouble de récupération plutôt que d\'encodage.', tone: 'positive' },
      { key: 'peu_benef',     label: 'Peu de bénéfice à l\'indiçage',          text: 'Peu de bénéfice à l\'indiçage / reconnaissance — évoque plutôt un trouble d\'encodage / consolidation.', tone: 'negative' },
    ],
  },
  {
    key: 'e02_texte_lu',
    num: '02',
    label: 'Mémoire d\'un texte LU',
    description: 'Mémoire épisodique verbale + compréhension écrite. 3 textes différents selon NSC (Aline /NSC1, Travers /NSC2, Lapissoire /NSC3). Rappel immédiat puis choix de résumé en différé.',
    subtests: [
      { key: 'rappel',  label: 'Rappel immédiat (2a)',     max: 12, hint: '2 pts par information pertinente. Questions ouvertes posées seulement si l\'info manque.' },
      { key: 'resume',  label: 'Choix du résumé (2b)',     max: 8,  hint: '8 pts d\'emblée, 2 pts en 2e choix, 0 pt mauvais choix.' },
    ],
    hasTemps: true,
    rules: [
      'Texte sélectionné par le logiciel selon NSC : NSC 1 = Aline (temps de lecture étalonné 3 min, résumé n°3), NSC 2 = Travers (5 min, résumé n°4), NSC 3 = Lapissoire (6 min, résumé n°2).',
      'Lecture silencieuse libre, temps chronométré ; au-delà du seuil étalonné, alerte « gestion textuelle » à signaler dans l\'observation.',
      'Rappel : 2 pts par information importante donnée spontanément ou en réponse à une question ouverte. 0 pt par info manquante ou erronée. 0 pt par erreur sur personnage.',
      'Si rappel d\'emblée correct : 12 pts sans poser les questions.',
      'Choix de résumé : différé d\'au moins 20 min. 4 résumés présentés. Bon choix d\'emblée = 8 pts, hésite et trouve en 2e = 2 pts, mauvais = 0.',
      'Procédure de rattrapage : si le sujet n\'a pas compris la macrostructure, faire une RELECTURE À DEUX et décoder le texte avec lui — cette procédure change la valeur diagnostique du rappel, à signaler dans le commentaire.',
    ],
    interpretation: [
      'Temps de lecture > seuil + rappel correct → fragilité de gestion textuelle, pas mnésique pure.',
      'Rappel pauvre + bonnes réponses aux questions ouvertes → difficulté de formulation discursive plutôt que mnésique.',
      'Rappel immédiat OK + choix résumé faux → difficulté de maintien en mémoire à moyen terme (consolidation).',
      'Rappel ET choix résumé faux → encodage ou compréhension défaillants (à confronter avec épreuve 07 texte entendu).',
    ],
    obsPlaceholder: 'Ex. temps lecture 4 min (long), revient 2× sur le passage central. Rappel : reformule mal le but de l\'action principale. Choix résumé : hésite entre 2 et 3.',
  },
  {
    key: 'e03_mdt',
    num: '03',
    label: 'Mémoire de travail',
    description: 'Alternance lettre/chiffre — administrateur central. 3a = restitution dans l\'ordre de présentation. 3b (plus coûteux) = restitution lettres en ordre alphabétique, chiffres en ordre croissant. 3b uniquement si 3a ≥ 18 pts.',
    subtests: [
      { key: 'subtest_3a', label: 'Subtest 3a (alternance)',     max: 24, hint: 'Items : BOL-531, PLUS-4692, PIANO-71348. 1 pt par lettre + 1 pt par chiffre en bon ordre.' },
      { key: 'subtest_3b', label: 'Subtest 3b (avec mise en ordre)', max: 22, hint: 'Items : GRADE-48237, POLICE-527649. Lettres alphabétique + chiffres croissant. UNIQUEMENT si 3a ≥ 18.' },
    ],
    hasTemps: true,
    rules: [
      'Subtest 3a — 3 items chronométrés : "BOL et 531" → B-5 O-3 L-1 ; "PLUS et 4692" → P-4 L-6 U-9 S-2 ; "PIANO et 71348" → P-7 I-1 A-3 N-4 O-8.',
      'Subtest 3b — 2 items chronométrés : "GRADE et 48237" → A-2 D-3 E-4 G-7 R-8 ; "POLICE et 527649" → C-2 E-4 I-5 L-6 O-7 P-9.',
      'Pénalités : −2 pts par redemande complète du mot/nombre ; −1 pt par redemande partielle (1-3 chiffres) ; −2 pts si aide pour se retrouver.',
      'Auto-correction acceptée (points conservés).',
      'Le subtest 3b n\'est proposé QUE si le sujet a obtenu ≥ 18 pts au 3a.',
      'Si le 3b est proposé : essais d\'entraînement NON comptabilisés (SEL-735 puis, en cas d\'échec, COL-429). Si les DEUX essais d\'entraînement sont échoués, on N\'ADMINISTRE PAS le 3b.',
    ],
    interpretation: [
      '3a faible (< 18) → fragilité de boucle phonologique / encodage immédiat.',
      '3a réussi MAIS 3b effondré → fragilité spécifique de manipulation en mémoire de travail (administrateur central).',
      'Comparer aux résultats à l\'empan envers classique (WAIS), aux Acronymes PREDILAE et à la séquence Lettres-Chiffres.',
    ],
    obsPlaceholder: 'Complément libre (au-delà des cases cochées). Ex. essoufflement après le 2e item, mots-clés inventés pour mémoriser.',
    quickObservations: [
      { key: 'auto_corr',       label: 'Auto-corrections (points conservés)', text: 'Auto-corrections spontanées (points conservés).', tone: 'positive' },
      { key: 'voix_basse',      label: 'Répète à voix basse',                 text: 'Répète mot et nombre à voix basse avant de répondre (stratégie de subvocalisation).', tone: 'neutral' },
      { key: 'ordre_mental',    label: 'Mise en ordre mentale (3b)',          text: 'Stratégie de mise en ordre mentale observée au 3b avant restitution.', tone: 'positive' },
      { key: 'redem_partielle', label: 'Redemande partielle (−1 pt)',         text: 'Redemande partielle (1-3 chiffres) sur au moins un item (−1 pt).', tone: 'neutral' },
      { key: 'redem_complete',  label: 'Redemande complète (−2 pt)',          text: 'Redemande complète du mot/nombre sur au moins un item (−2 pts).', tone: 'negative' },
      { key: 'aide_perdu',      label: 'Aide pour se retrouver (−2 pt)',      text: 'Aide examinateur nécessaire pour se retrouver dans la séquence (−2 pts).', tone: 'negative' },
      { key: 'persev',          label: 'Persévération sur item précédent',    text: 'Persévération sur la lettre / chiffre du 1er item lors du passage au suivant.', tone: 'negative' },
      { key: 'sel_col_echec',   label: 'Essais SEL/COL ratés (3b non admin.)', text: 'Essais d\'entraînement SEL puis COL ratés — subtest 3b NON administré (consigne manuel).', tone: 'negative' },
      { key: 'fatigue_3b',      label: 'Fatigue cognitive sur 3b',            text: 'Fatigue cognitive observable sur le 3b (effort prolongé visible).', tone: 'neutral' },
    ],
  },
  {
    key: 'e04_blasons',
    num: '04',
    label: 'Blasons',
    description: 'Mémoire visuelle à court terme + visuo-construction. 4 blasons présentés successivement, reconstruction immédiate après chaque blason en choisissant forme générale, couleurs, dessin, position.',
    subtests: [
      { key: 'blason_1', label: 'Blason 1', max: 14, hint: 'Forme + répartition + couleurs + dessin + position + couleur du dessin.' },
      { key: 'blason_2', label: 'Blason 2', max: 16 },
      { key: 'blason_3', label: 'Blason 3', max: 18 },
      { key: 'blason_4', label: 'Blason 4', max: 16 },
    ],
    hasTemps: true,
    rules: [
      'Chaque blason est présenté seul pendant 25 secondes, puis le sujet le reconstruit de mémoire à partir d\'éléments à choisir (forme, couleurs, dessin, position).',
      'Reconstruction immédiate (pas de différé entre présentation et rappel).',
      'Points attribués par caractéristique correcte (forme générale, répartition des couleurs, dessin central, position du dessin, couleurs spécifiques).',
      'Étape 3 (couleurs) : 2 pts si bonne couleur ET bien placée, 1 pt si bonne couleur choisie mais mal placée, 0 pt sinon.',
      'CORRECTION par l\'examinateur AUTORISÉE uniquement sur les étapes 1 et 2 (forme + répartition). À partir de l\'étape 3, plus de correction — l\'erreur sur étape 3 n\'invalide pas la suite, l\'erreur sur étape 1-2 si.',
      'Le sujet peut verbaliser pour s\'aider à mémoriser ("ovale, rouge en haut, étoile au centre…").',
    ],
    interpretation: [
      'Échec ↗ à mesure des blasons (4 > 3 > 2 > 1) = effet de complexité normal, à pondérer.',
      'Échec dès blason 1 et 2 → fragilité de mémoire visuelle court terme OU déficit visuo-perceptif.',
      'Pertes spécifiques sur les couleurs vs les formes vs les positions → orienter vers tests visuo-perceptifs ciblés.',
      'Croiser avec épreuves 01 (objets), 05 (tangram), 08 (formes complexes), 10 (spatiale) — convergence sur le visuel = signal fort.',
    ],
    obsPlaceholder: 'Ex. verbalise systématiquement la couleur dominante. Échec progressif sur la position du dessin à partir du blason 3. Pas de stratégie de récapitulation.',
  },
  {
    key: 'e05_tangram',
    num: '05',
    label: 'Tangram',
    description: 'Mémoire spatiale + visuo-construction + planification. Reconnaissance d\'un chat formé en tangram + analyse de 3 planches (pièces en trop ou manquantes).',
    subtests: [
      { key: 'total', label: 'Score total', max: 16, hint: 'Chat reconnu (2 pts) + 3 planches d\'analyse pièces en trop/manquantes.' },
    ],
    hasTemps: true,
    rules: [
      'Reconnaissance du chat (forme tangram complète) : 2 pts si reconnu spontanément après 15 secondes de mémorisation.',
      'Analyse de 3 planches : pour chaque planche, identifier les pièces EN TROP ou MANQUANTES par rapport au modèle.',
      'Pièces attendues : P1 (/4) — 2 pièces en trop (grand triangle = corps + triangle moyen). P2 (/4) — 2 pièces manquantes (queue + oreille). P3 (/6) — 1 manquante (corps) + 2 en trop (oreille + queue).',
      'Malus : −2 pts si l\'examinateur doit corriger une consigne sur la planche 1 UNIQUEMENT (signale une difficulté de compréhension de la tâche).',
    ],
    interpretation: [
      'Échec à la reconnaissance du chat → suspicion d\'agnosie de forme ou de fragilité visuo-perceptive.',
      'Échec à l\'analyse des planches → planification visuo-spatiale ou mémoire de travail visuelle.',
      'À croiser avec épreuves 04 (blasons), 10 (parcours cailloux) pour confirmer un profil visuo-spatial.',
    ],
    obsPlaceholder: 'Ex. reconnaît le chat après quelques secondes ("c\'est un chat assis"). Sur la 2e planche, identifie 2/3 pièces manquantes mais en ajoute une fictive.',
  },
  {
    key: 'e06_assoc',
    num: '06',
    label: 'Associations sémantiques',
    description: 'Mémoire épisodique sur indiçage sémantique. 3 subtests indépendants : animaux, objets, logos commerciaux.',
    subtests: [
      { key: 'animaux', label: 'Associations animaux',  max: 16 },
      { key: 'objets',  label: 'Associations objets',   max: 16 },
      { key: 'logos',   label: 'Associations logos',    max: 14 },
    ],
    hasTemps: true,
    rules: [
      'Pour chaque subtest, le sujet doit associer des éléments selon une catégorie sémantique présentée.',
      'Cotation animaux/objets : 2 pts au 1er essai, 1 pt au 2e essai (après remontrer la planche de 8), 0 pt sinon. 8 photos × 2 pts = 16 pour chaque subtest.',
      'Cotation logos : 7 logos × 2 pts = 14. Cas particulier : 1 pt au 1er essai (et ½ pt au 2e essai) si bonne association sémantique faite SANS reconnaître le nom de la marque — l\'épreuve mesure la mémoire sémantique, pas la culture marketing.',
      'Malus : −1 pt par invention (association inexistante).',
      'L\'indiçage sémantique (catégorie) facilite la récupération — c\'est précisément ce que l\'épreuve mesure.',
      'Logos commerciaux : épreuve culturellement marquée, attention aux sujets éloignés de la consommation moderne.',
    ],
    interpretation: [
      'Score correct sur les 3 subtests → mémoire sémantique préservée, bon bénéfice à l\'indiçage.',
      'Score faible sur animaux/objets MAIS correct sur logos → suggère une fragilité d\'accès lexical/sémantique abstraite, à explorer.',
      'Score faible sur logos isolé → souvent un effet culturel (sujet âgé, peu de TV/pub), à ne pas surinterpréter.',
      'Échec global → fragilité d\'encodage non rattrapée par indiçage sémantique (profil compatible avec atteinte sémantique débutante).',
    ],
    obsPlaceholder: 'Complément libre (au-delà des cases cochées). Ex. associations rapides en animaux, hésite sur l\'enseigne X qu\'elle finit par reconnaître au geste de la mascotte.',
    quickObservations: [
      { key: 'benef_indicage',    label: 'Bénéfice net à l\'indiçage sémantique', text: 'Bénéfice net à l\'indiçage sémantique (catégorie) — mémoire sémantique préservée.', tone: 'positive' },
      { key: 'echec_animaux',     label: 'Échec sur animaux',                     text: 'Échec d\'indiçage sur le subtest Animaux.', tone: 'negative' },
      { key: 'echec_objets',      label: 'Échec sur objets',                      text: 'Échec d\'indiçage sur le subtest Objets.', tone: 'negative' },
      { key: 'echec_logos',       label: 'Échec sur logos',                       text: 'Échec sur le subtest Logos.', tone: 'negative' },
      { key: 'logos_culturel',    label: 'Logos non reconnus (effet culturel)',   text: 'Logos non reconnus par effet culturel/générationnel (à ne pas surinterpréter cliniquement).', tone: 'neutral' },
      { key: 'logos_sans_marque', label: 'Reconnaît logos sans nommer la marque', text: 'Reconnaît certaines marques par leur logo sans pouvoir les nommer (1 pt au 1er essai / ½ pt au 2e).', tone: 'neutral' },
      { key: 'inventions',        label: 'Inventions (−1 pt chacune)',            text: 'Inventions observées — associations inexistantes (−1 pt par invention).', tone: 'negative' },
      { key: 'hesite',            label: 'Hésitations marquées',                  text: 'Hésitations marquées avant association — temps de récupération allongé.', tone: 'neutral' },
      { key: 'deux_essais',       label: 'Bénéfice du 2e essai',                  text: 'Bénéfice net du 2e essai (planche remontrée) — accès lexical aidé par la présentation visuelle.', tone: 'positive' },
    ],
  },
  {
    key: 'e07_texte_entendu',
    num: '07',
    label: 'Mémoire d\'un texte ENTENDU',
    description: 'Mémoire épisodique verbale + compréhension orale. Mêmes 3 textes que l\'épreuve 02 mais entendus (lecture par l\'examinateur) — comparaison modalité écrite vs orale.',
    subtests: [
      { key: 'rappel', label: 'Rappel immédiat (7a)', max: 12, hint: '2 pts par information pertinente.' },
      { key: 'resume', label: 'Choix du résumé (7b)', max: 8,  hint: '8 pts d\'emblée, 2 pts en 2e choix.' },
    ],
    hasTemps: true,
    rules: [
      'Lecture du texte par l\'examinateur, à débit naturel, une seule fois.',
      'Texte étalonné (unique pour cette épreuve, indépendant du NSC) — la réponse attendue au choix de résumé est le n°2.',
      'Cotation identique à l\'épreuve 02 : 2 pts par information pertinente (rappel) ; 8/2/0 pour le choix de résumé.',
      'Choix de résumé différé d\'au moins 20 min.',
      'Procédure de rattrapage : si le sujet n\'a pas compris la macrostructure, FAIRE RÉÉCOUTER l\'enregistrement et décoder le texte avec lui — à signaler dans le commentaire (change la valeur diagnostique du rappel).',
      '⚠️ Épreuve PARTIELLEMENT NON ÉTALONNÉE : le manuel ne fournit pas de normes stratifiées complètes pour le 07. Interpréter avec prudence — comparer surtout le rappel ENTENDU (07) au rappel LU (02) pour détecter un déficit modalitaire.',
    ],
    interpretation: [
      'Comparer texte LU vs ENTENDU pour ce sujet : un écart marqué oriente vers un déficit modalitaire (compréhension écrite vs orale).',
      'Si écrit nettement meilleur qu\'entendu : suspicion d\'atteinte auditivo-verbale (à confronter à l\'épreuve 09 mémoire auditive).',
      'Si entendu nettement meilleur qu\'écrit : suspicion de difficulté de lecture/dyslexie acquise.',
      'Dégradation parallèle sur les deux modalités → fragilité mnésique épisodique générale.',
    ],
    obsPlaceholder: 'Ex. perte de fil après la 2e phrase, redemande "qui ?" en cours d\'écoute. Rappel : 3 infos seulement, choix de résumé : 2e essai correct.',
  },
  {
    key: 'e08_formes',
    num: '08',
    label: 'Mémoire visuelle de formes complexes',
    description: 'Mémoire visuelle pure (matériel non sémantisable). Reconnaissance de rosaces géométriques + idéogrammes.',
    subtests: [
      { key: 'rosaces',    label: 'Rosaces',     max: 10, hint: '2 pts par forme reconnue du 1er coup. Seul le 1er choix compte.' },
      { key: 'ideogrammes', label: 'Idéogrammes', max: 10, hint: '2 pts par idéogramme reconnu du 1er coup.' },
    ],
    hasTemps: true,
    rules: [
      'Présentation 6 secondes par forme, puis reconnaissance parmi des distracteurs visuels (formes proches).',
      '2 pts par forme reconnue du 1er coup. 0 pt si reconnu en 2e choix (seul le 1er choix compte).',
      'Tâches interférentes (NON cotées) entre présentation et reconnaissance : calcul mental (entre rosaces et reconnaissance) puis fluence d\'arbres (entre idéogrammes et reconnaissance).',
      'Matériel choisi pour son absence de sémantique (impossible de "nommer" pour aider à mémoriser).',
    ],
    interpretation: [
      'Échec à cette épreuve isolément (mémoire visuelle des objets 01 préservée) → fragilité de mémoire visuelle PURE (non médiée par le langage).',
      'Échec parallèle aux rosaces ET idéogrammes → mémoire visuelle non-verbale globale fragilisée.',
      'À croiser avec épreuves 04 (blasons) et 11 (visages).',
    ],
    obsPlaceholder: 'Ex. rosaces : 6/10, hésite sur les formes très similaires. Idéogrammes : 4/10, semble se laisser influencer par le 1er distracteur de chaque planche.',
  },
  {
    key: 'e09_auditive',
    num: '09',
    label: 'Mémoire auditive',
    description: 'Mémoire auditive non verbale (bruits) + boucle phonologique (phrases). Composante très peu évaluée par les batteries classiques.',
    subtests: [
      { key: 'bruits',  label: 'Bruits (6 bruits)',    max: 12, hint: '2 pts par bruit reconnu. Sons d\'environnement à identifier puis à reconnaître en différé.' },
      { key: 'phrases', label: 'Phrases (4 phrases)', max: 40 },
    ],
    hasTemps: true,
    rules: [
      'Bruits : 6 sons d\'environnement (animaux, transports, objets…) à identifier puis reconnaître parmi des distracteurs sonores. 2 pts par bruit reconnu.',
      'Phrases : 4 phrases à répéter exactement (boucle phonologique allongée). Cotation 10 pts par phrase, modulée par les pertes.',
      'Pénalités phrases : −1 pt par mot ou morphème omis/modifié, −2 pts par groupe de mots, −3 pts si la phrase doit être redite AVANT le 1er essai, −5 pts si redite APRÈS un essai.',
      '⚠️ DEUX JEUX DE PHRASES selon NSC (4 phrases dont la 4e identique entre les versions). Le logiciel charge le jeu adapté — vérifier la cohérence avec le NSC saisi.',
    ],
    interpretation: [
      'Bruits OK + phrases altérées → fragilité de boucle phonologique (composante verbale), à confronter à l\'empan endroit classique.',
      'Bruits altérés + phrases OK → fragilité auditivo-perceptive non verbale, à explorer (audition ? agnosie auditive ?).',
      'Pertes morphologiques ou lexicales sur les phrases → croiser avec épreuve 03 (MdT) et 07 (texte entendu).',
    ],
    obsPlaceholder: 'Complément libre (au-delà des cases cochées). Ex. bruit du chien confondu avec le loup, phrase 3 inversée syntaxiquement.',
    quickObservations: [
      { key: 'bruits_ok',         label: 'Bruits parfaitement reconnus',          text: 'Bruits parfaitement reconnus — mémoire auditive non verbale préservée.', tone: 'positive' },
      { key: 'bruits_hes',        label: 'Hésitation sur bruits proches',         text: 'Hésitations sur des bruits acoustiquement proches.', tone: 'neutral' },
      { key: 'phr_morpho',        label: 'Phrases : pertes morphologiques',       text: 'Pertes morphologiques sur les phrases (déterminants omis, marques verbales modifiées).', tone: 'negative' },
      { key: 'phr_lexique',       label: 'Phrases : pertes lexicales',            text: 'Pertes lexicales sur les phrases (mots oubliés ou substitués).', tone: 'negative' },
      { key: 'phr_ordre',         label: 'Phrases : ordre modifié',               text: 'Ordre des mots modifié dans la restitution des phrases.', tone: 'negative' },
      { key: 'phr_groupes',       label: 'Pertes par groupes (−2 pts)',           text: 'Pertes par groupes de mots (−2 pts par groupe omis).', tone: 'negative' },
      { key: 'phr_redem_avant',   label: 'Redemande AVANT essai (−3)',            text: 'Redemande de la phrase AVANT le 1er essai (−3 pts par phrase concernée).', tone: 'negative' },
      { key: 'phr_redem_apres',   label: 'Redemande APRÈS essai (−5)',            text: 'Redemande APRÈS un essai entamé (−5 pts par phrase concernée).', tone: 'negative' },
      { key: 'fatigue',           label: 'Fatigue auditive en fin',               text: 'Fatigue audible / décrochage sur les dernières phrases.', tone: 'neutral' },
    ],
  },
  {
    key: 'e10_spatiale',
    num: '10',
    label: 'Mémoire spatiale',
    description: 'Mémoire visuo-spatiale courte. Reproduction de parcours de cailloux (4 puis 5 cailloux). Préalable : exclure héminégligence et apraxie constructive.',
    subtests: [
      { key: 'cailloux_4', label: 'Parcours 4 cailloux', max: 16 },
      { key: 'cailloux_5', label: 'Parcours 5 cailloux', max: 20 },
    ],
    hasTemps: true,
    rules: [
      'Présentation d\'un parcours animé (cailloux qui s\'allument dans un ordre donné) puis reproduction par le sujet.',
      'Structure : 2 items de 4 cailloux (/8 chacun = /16) + 2 items de 5 cailloux (/10 chacun = /20). Total /36.',
      'Cotation : 2 pts par caillou correctement pointé dans le bon ordre ; 1 pt si caillou correct mais mauvais ordre.',
      'Pas de 2e essai par item.',
      '⚠️ PRÉALABLE : s\'assurer de l\'absence d\'héminégligence (test de barrage) et d\'apraxie constructive (figure de Rey) — sinon l\'interprétation mnésique est faussée.',
    ],
    interpretation: [
      'Échec sur cette épreuve sans atteinte des autres mémoires visuelles → fragilité spécifique de mémoire visuo-spatiale, à confronter aux cubes de Corsi.',
      'Échec en convergence avec épreuves 04, 05, 08, 11 → fragilité visuelle globale.',
      'Si héminégligence suspectée : invalider l\'interprétation et orienter vers neuropsy.',
    ],
    obsPlaceholder: 'Complément libre (au-delà des cases cochées). Ex. décroche après le 3e caillou du 5-cailloux, ré-essaie spontanément avant l\'arrêt.',
    quickObservations: [
      { key: 'barrage_ok',    label: 'Préalable barrage OK (pas d\'héminégligence)', text: 'Préalable test de barrage effectué — pas d\'héminégligence détectée.', tone: 'positive' },
      { key: 'rey_ok',        label: 'Préalable Rey OK (pas d\'apraxie)',           text: 'Préalable figure de Rey effectué — pas d\'apraxie constructive détectée.', tone: 'positive' },
      { key: 'prealable_skip', label: '⚠ Préalables non effectués',                 text: '⚠ Préalables (barrage / figure de Rey) NON effectués — interprétation mnésique à pondérer (peut refléter héminégligence ou apraxie constructive).', tone: 'negative' },
      { key: 'inversions',    label: 'Inversions d\'ordre (1 pt chacun)',           text: 'Inversions d\'ordre observées (caillou correct pointé mais à mauvaise position dans la séquence, 1 pt au lieu de 2).', tone: 'neutral' },
      { key: 'decroche_5c',   label: 'Décrochage marqué sur cailloux 5',            text: 'Décrochage marqué dès le parcours à 5 cailloux (effet de charge).', tone: 'negative' },
      { key: 'strat_verb',    label: 'Stratégie verbale ("haut-bas-gauche")',       text: 'Stratégie verbale de mémorisation observée (« haut-bas-gauche-droite », codage verbal du parcours).', tone: 'positive' },
      { key: 'pas_strat',     label: 'Aucune stratégie spontanée',                  text: 'Aucune stratégie de mémorisation spontanée observée.', tone: 'negative' },
      { key: 'plainte_spatiale', label: 'Plainte spontanée d\'orientation',         text: 'Le sujet signale spontanément des difficultés d\'orientation (se perdre dans des lieux familiers, etc.).', tone: 'neutral' },
    ],
  },
  {
    key: 'e11_visages',
    num: '11',
    label: 'Mémoire de visages',
    description: 'Reconnaissance de visages (portraits peints + photos). Modalité spécifique souvent atteinte précocement dans certaines pathologies temporales.',
    subtests: [
      { key: 'peints', label: 'Portraits peints', max: 10, hint: '2 pts par visage reconnu du 1er coup parmi des distracteurs.' },
      { key: 'photos', label: 'Portraits photos', max: 10 },
    ],
    hasTemps: true,
    rules: [
      'Présentation d\'une série de 5 portraits peints + 5 portraits photos, puis reconnaissance parmi des planches de 6 (1 cible + 5 distracteurs).',
      '2 pts par visage reconnu du 1er coup. 0 pt si reconnaissance en 2e choix (seul le 1er choix compte).',
      'Tâches interférentes (NON cotées) entre présentation et reconnaissance : calcul mental (entre peints et reconnaissance) puis fluence lexicale (entre photos et reconnaissance).',
      'Distinguer la modalité "peinte" (stylisée) de la modalité "photo" (réaliste) — peut révéler des dissociations.',
    ],
    interpretation: [
      'Échec global → fragilité de reconnaissance des visages (prosopagnosie acquise ?) — à explorer avec batterie dédiée (Benton, BFRT).',
      'Asymétrie peints vs photos → souvent un effet d\'exposition (familiarité culturelle) plutôt qu\'un trouble structurel.',
      'Échec en convergence avec épreuves 04, 08 → fragilité visuelle globale, pas spécifique aux visages.',
    ],
    obsPlaceholder: 'Ex. peints : 8/10, hésitation sur les visages de profil. Photos : 6/10, confond 2 portraits féminins. Pas de plainte spontanée de difficulté à reconnaître les proches.',
  },
]

/** État interne du composant : pour chaque épreuve, on garde les scores
 *  (par clé de subtest, en string pour permettre la saisie progressive),
 *  un temps optionnel, une zone HappyNeuron, une observation libre, et la
 *  liste des `quickObservations` actuellement cochées (clés stables des
 *  cases pré-rédigées — leurs textes sont concaténés à la sortie normalisée
 *  À CÔTÉ de l'observation libre, sans collision possible).
 *
 *  `non_passee` permet à l'ortho de marquer explicitement une épreuve non
 *  passée (fatigue patient, hypothèse clinique ciblée, contrainte de temps).
 *  Aligné sur le pattern PrediFex/PrediLac. Cache les sous-champs en UI,
 *  exclut l'épreuve des compteurs de zones, et sort une ligne explicite à
 *  l'IA pour qu'elle n'interprète pas l'absence comme un échec. */
interface EpreuveState {
  scores: Record<string, string>
  temps: string
  zone: ZoneKey
  observation: string
  cochedQuickObs: string[]
  non_passee: boolean
}

type State = {
  /** Tranche d'âge (1 à 5) — stratification obligatoire. */
  trancheAge: '' | '1' | '2' | '3' | '4' | '5'
  /** Niveau socio-culturel (1 à 3) — stratification obligatoire. */
  nsc: '' | '1' | '2' | '3'
  /** État de chaque épreuve, par clé. */
  epreuves: Record<EpreuveKey, EpreuveState>
}

const TRANCHE_AGE_OPTIONS: Array<{ key: '1' | '2' | '3' | '4' | '5'; label: string }> = [
  { key: '1', label: '1 — 18-49 ans' },
  { key: '2', label: '2 — 50-59 ans' },
  { key: '3', label: '3 — 60-69 ans' },
  { key: '4', label: '4 — 70-79 ans' },
  { key: '5', label: '5 — 80-90 ans' },
]

const NSC_OPTIONS: Array<{ key: '1' | '2' | '3'; label: string }> = [
  { key: '1', label: 'NSC 1 — ≤ scolarité 12 ans (CAP, Brevet, Cert. d\'études)' },
  { key: '2', label: 'NSC 2 — Bac à Bac+3' },
  { key: '3', label: 'NSC 3 — ≥ Bac+4 (haute réserve cognitive)' },
]

function emptyEpreuveState(epreuve: Epreuve): EpreuveState {
  const scores: Record<string, string> = {}
  for (const st of epreuve.subtests) scores[st.key] = ''
  return { scores, temps: '', zone: '', observation: '', cochedQuickObs: [], non_passee: false }
}

function emptyState(): State {
  const ep: any = {}
  for (const e of EPREUVES) ep[e.key] = emptyEpreuveState(e)
  return { trancheAge: '', nsc: '', epreuves: ep as Record<EpreuveKey, EpreuveState> }
}

function parseScoreInt(raw: string, max: number): number {
  const trimmed = (raw || '').trim()
  if (!trimmed) return 0
  const n = parseInt(trimmed, 10)
  if (isNaN(n) || n < 0) return 0
  return Math.min(max, n)
}

export default function PredimemScoresInput({
  notes,
  onNotesChange,
  onResultatsChange,
  onError,
  bilanPrecedentStructure,
  bilanPrecedentDate,
}: Props) {
  const [state, setState] = useState<State>(emptyState)

  // Import PDF PREDIMEM — route /api/extract-predimem-pdf.
  // Pre-remplit tranche d'age + NSC + 11 epreuves (zone HappyNeuron + sous-scores
  // + temps + observation) depuis un rapport HappyNeuron Pro ou scan cahier.
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [importing, setImporting] = useState(false)
  const [importInfo, setImportInfo] = useState<string | null>(null)

  async function handleImportFile(file: File) {
    setImporting(true)
    setImportInfo(null)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/extract-predimem-pdf', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok || !data?.success) {
        const msg = data?.error ?? 'Échec de l\'import PDF.'
        onError?.(msg)
        setImportInfo(`Erreur : ${msg}`)
        return
      }
      const ex = data.extracted as {
        trancheAge: string
        nsc: string
        epreuves: Array<{
          key: string
          zone: string
          scores: Record<string, string>
          temps: string
          observation: string
          non_passee: boolean
        }>
      }
      setState(prev => {
        const next: State = {
          trancheAge: (ex.trancheAge || prev.trancheAge) as State['trancheAge'],
          nsc: (ex.nsc || prev.nsc) as State['nsc'],
          epreuves: { ...prev.epreuves },
        }
        for (const item of ex.epreuves ?? []) {
          if (!(item.key in next.epreuves)) continue
          const cur = next.epreuves[item.key as EpreuveKey]
          // Merge scores : ne pas ecraser les saisies existantes si le PDF est vide.
          const mergedScores: Record<string, string> = { ...cur.scores }
          for (const [k, v] of Object.entries(item.scores ?? {})) {
            if (v && v.toString().trim()) mergedScores[k] = v.toString()
          }
          next.epreuves[item.key as EpreuveKey] = {
            scores: mergedScores,
            zone: (item.zone as ZoneKey) || cur.zone,
            temps: item.temps || cur.temps,
            observation: item.observation || cur.observation,
            cochedQuickObs: cur.cochedQuickObs,
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

  const totalEpreuvesSaisies = useMemo(() => {
    let count = 0
    for (const e of EPREUVES) {
      const st = state.epreuves[e.key]
      if (st.non_passee) continue
      const anyScore = e.subtests.some(s => st.scores[s.key]?.trim() !== '')
      if (anyScore) count++
    }
    return count
  }, [state.epreuves])

  /** Live preview deltas — mode renouvellement PREDIMEM. Mapping zone →
   *  percentile_value identique au prompt (ZONE_TO_PCT_VALUE). Matching
   *  par label d'épreuve, seuil ±10 sur percentile_value. */
  const evolutionStats = useMemo(() => {
    const hasPrev = !!(bilanPrecedentStructure
      && bilanPrecedentStructure.domains
      && bilanPrecedentStructure.domains.length > 0)
    if (!hasPrev) return null

    const prevIndex = new Map<string, number>()
    for (const d of bilanPrecedentStructure!.domains) {
      for (const ep of d.epreuves) {
        const pv = typeof ep.percentile_value === 'number' ? ep.percentile_value : null
        if (pv != null) prevIndex.set(ep.nom.toLowerCase().trim(), pv)
      }
    }

    let progres = 0, stable = 0, regression = 0, nouvelles = 0
    const progresList: string[] = []
    const regressionList: string[] = []
    const nouvellesList: string[] = []

    for (const e of EPREUVES) {
      const st = state.epreuves[e.key]
      if (st.non_passee || !st.zone) continue
      const currValue = ZONE_TO_PCT_VALUE[st.zone]
      if (currValue == null) continue
      const prevValue = prevIndex.get(e.label.toLowerCase().trim())
      if (prevValue == null) {
        nouvelles++
        nouvellesList.push(e.label)
        continue
      }
      const delta = currValue - prevValue
      if (delta >= 10) { progres++; progresList.push(e.label) }
      else if (delta <= -10) { regression++; regressionList.push(e.label) }
      else { stable++ }
    }

    const totalCompared = progres + stable + regression
    return {
      progres, stable, regression, nouvelles,
      progresList, regressionList, nouvellesList,
      totalCompared,
      verdict: (() => {
        if (progres > regression * 2 && progres >= 2) return 'progress' as const
        if (regression > progres && regression >= 2) return 'regression' as const
        return 'stable' as const
      })(),
    }
  }, [state.epreuves, bilanPrecedentStructure])

  /** Compte des épreuves dans chaque zone HappyNeuron pour le badge global.
   *  Les épreuves marquées non_passee sont exclues (elles n'ont pas de zone
   *  cliniquement significative). */
  const zoneCounts = useMemo(() => {
    const counts: Record<Exclude<ZoneKey, ''>, number> = {
      vert_fonce: 0, vert_clair: 0, jaune: 0, orange: 0, rouge: 0,
    }
    for (const e of EPREUVES) {
      const st = state.epreuves[e.key]
      if (st.non_passee) continue
      if (st.zone) counts[st.zone]++
    }
    return counts
  }, [state.epreuves])

  /** Compte des épreuves explicitement marquées non passées (pour info à l'IA). */
  const nonPasseesCount = useMemo(() => {
    let count = 0
    for (const e of EPREUVES) {
      if (state.epreuves[e.key].non_passee) count++
    }
    return count
  }, [state.epreuves])

  /** Émet la string normalisée à chaque changement. Format lisible par
   *  l'IA générant le CRBO : bloc par épreuve avec score(s), temps, zone
   *  et observation. */
  useEffect(() => {
    if (totalEpreuvesSaisies === 0 && !state.trancheAge && !state.nsc) {
      onResultatsChange('')
      return
    }
    const lines: string[] = []
    lines.push('=== PREDIMEM — Protocole d\'évaluation et de dépistage des insuffisances de la mémoire ===')
    if (state.trancheAge || state.nsc) {
      const trancheLabel = TRANCHE_AGE_OPTIONS.find(o => o.key === state.trancheAge)?.label || '(non précisée)'
      const nscLabel = NSC_OPTIONS.find(o => o.key === state.nsc)?.label || '(non précisé)'
      lines.push(`Stratification : ${trancheLabel} — ${nscLabel}`)
      lines.push('')
    }

    for (const e of EPREUVES) {
      const st = state.epreuves[e.key]
      // Épreuve explicitement non passée : on l'indique à l'IA pour qu'elle
      // n'interprète pas l'absence comme un échec (cf. PrediFex/PrediLac).
      if (st.non_passee) {
        lines.push(`--- Épreuve ${e.num} — ${e.label} ---`)
        lines.push('Non passée (passation écourtée / hypothèse clinique ciblée — ne pas interpréter).')
        lines.push('')
        continue
      }
      const anyScore = e.subtests.some(s => st.scores[s.key]?.trim() !== '')
      const hasQuickObs = (st.cochedQuickObs?.length ?? 0) > 0
      if (!anyScore && !st.zone && !st.observation.trim() && !hasQuickObs) continue

      lines.push(`--- Épreuve ${e.num} — ${e.label} ---`)
      for (const sub of e.subtests) {
        const raw = st.scores[sub.key]?.trim()
        if (raw) {
          const v = parseScoreInt(raw, sub.max)
          lines.push(`${sub.label} : ${v}/${sub.max}`)
        }
      }
      if (st.temps.trim()) {
        lines.push(`Temps : ${st.temps.trim()}`)
      }
      if (st.zone) {
        const z = ZONES.find(zz => zz.key === st.zone)!
        lines.push(`Zone HappyNeuron : ${z.label} (${z.sigma}) — ${ZONE_LABEL_CLINIQUE[st.zone]}`)
      }
      // Concaténation observations rapides cochées + observation libre.
      // Format : "Observation : <coché 1> <coché 2> ... <libre>". Les textes
      // des cocheboxes sont déjà ponctués (point final), la jointure les
      // sépare par un espace simple. L'observation libre suit, séparée par
      // un espace si présente. L'IA voit un seul bloc cohérent.
      const cochedTexts = (st.cochedQuickObs ?? [])
        .map(k => e.quickObservations?.find(q => q.key === k)?.text)
        .filter(Boolean) as string[]
      const obsLibre = st.observation.trim()
      if (cochedTexts.length > 0 || obsLibre) {
        const combined = [...cochedTexts, obsLibre].filter(Boolean).join(' ')
        lines.push(`Observation : ${combined}`)
      }
      lines.push('')
    }

    // Synthèse zones
    const totalZones = zoneCounts.vert_fonce + zoneCounts.vert_clair + zoneCounts.jaune + zoneCounts.orange + zoneCounts.rouge
    if (totalZones > 0) {
      lines.push('--- Synthèse zones HappyNeuron ---')
      lines.push(`Vert foncé (préservé) : ${zoneCounts.vert_fonce}`)
      lines.push(`Vert clair (moyenne basse) : ${zoneCounts.vert_clair}`)
      lines.push(`Jaune (seuil d'alerte) : ${zoneCounts.jaune}`)
      lines.push(`Orange (difficulté avérée) : ${zoneCounts.orange}`)
      lines.push(`Rouge (effondrement) : ${zoneCounts.rouge}`)
    }

    onResultatsChange(lines.join('\n'))
    // onResultatsChange est intentionnellement omis (cf. MocaScoresInput) : si
    // le parent ne le mémorise pas, il changerait à chaque render → boucle.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, totalEpreuvesSaisies, zoneCounts])

  const handleScoreChange = (epreuveKey: EpreuveKey, subKey: string, value: string, max: number) => {
    if (value === '') {
      setState(s => ({
        ...s,
        epreuves: {
          ...s.epreuves,
          [epreuveKey]: { ...s.epreuves[epreuveKey], scores: { ...s.epreuves[epreuveKey].scores, [subKey]: '' } },
        },
      }))
      return
    }
    const n = parseInt(value, 10)
    if (isNaN(n)) return
    const clamped = Math.min(max, Math.max(0, n))
    setState(s => ({
      ...s,
      epreuves: {
        ...s.epreuves,
        [epreuveKey]: { ...s.epreuves[epreuveKey], scores: { ...s.epreuves[epreuveKey].scores, [subKey]: String(clamped) } },
      },
    }))
  }

  const handleTempsChange = (epreuveKey: EpreuveKey, value: string) => {
    setState(s => ({
      ...s,
      epreuves: { ...s.epreuves, [epreuveKey]: { ...s.epreuves[epreuveKey], temps: value } },
    }))
  }

  const handleZoneChange = (epreuveKey: EpreuveKey, zone: ZoneKey) => {
    setState(s => ({
      ...s,
      epreuves: { ...s.epreuves, [epreuveKey]: { ...s.epreuves[epreuveKey], zone } },
    }))
  }

  const handleObservationChange = (epreuveKey: EpreuveKey, value: string) => {
    setState(s => ({
      ...s,
      epreuves: { ...s.epreuves, [epreuveKey]: { ...s.epreuves[epreuveKey], observation: value } },
    }))
  }

  /** Toggle "Épreuve non passée" : marque explicitement une épreuve volontairement
   *  écourtée (fatigue / hypothèse ciblée / temps). Aligné PrediFex/PrediLac. */
  const handleNonPasseeToggle = (epreuveKey: EpreuveKey, checked: boolean) => {
    setState(s => ({
      ...s,
      epreuves: { ...s.epreuves, [epreuveKey]: { ...s.epreuves[epreuveKey], non_passee: checked } },
    }))
  }

  /** Toggle d'une case d'observation rapide pour une épreuve donnée.
   *  Inverse l'appartenance de `obsKey` à `cochedQuickObs`. Le texte de la
   *  case sera ensuite injecté (ou retiré) automatiquement dans la sortie
   *  normalisée par le useEffect. Pas de mutation du champ observation libre. */
  const handleQuickObsToggle = (epreuveKey: EpreuveKey, obsKey: string) => {
    setState(s => {
      const current = s.epreuves[epreuveKey].cochedQuickObs ?? []
      const next = current.includes(obsKey)
        ? current.filter(k => k !== obsKey)
        : [...current, obsKey]
      return {
        ...s,
        epreuves: {
          ...s.epreuves,
          [epreuveKey]: { ...s.epreuves[epreuveKey], cochedQuickObs: next },
        },
      }
    })
  }

  return (
    <div className="space-y-4">
      {/* Bandeau informatif PREDIMEM */}
      <div className="flex items-start gap-2 p-3 rounded-lg border border-indigo-200 bg-indigo-50">
        <Brain size={18} className="text-indigo-600 shrink-0 mt-0.5" />
        <div className="text-sm">
          <p className="font-semibold text-indigo-900">Saisie structurée PREDIMEM — 11 épreuves</p>
          <p className="text-indigo-700 text-xs mt-0.5">
            Pour chaque épreuve, reportez le score brut obtenu, le temps si pertinent, et la <strong>zone HappyNeuron</strong>
            {' '}(5 couleurs : vert foncé / vert clair / jaune / orange / rouge) directement lue sur le logiciel. Les normes
            stratifiées (âge × NSC) sont gérées par HappyNeuron — ortho.ia ne recalcule pas le seuil d&apos;alerte.
          </p>
        </div>
      </div>

      {/* Import PDF PREDIMEM — rapport HappyNeuron Pro ou scan cahier. */}
      <div className="rounded-lg border border-sky-200 bg-sky-50/60 p-3">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="flex items-start gap-2 min-w-0">
            <FileUp size={18} className="text-sky-700 shrink-0 mt-0.5" />
            <div className="text-sm min-w-0">
              <p className="font-semibold text-sky-900">Importer un document PREDIMEM (optionnel)</p>
              <p className="text-sky-800 text-xs mt-0.5 leading-relaxed">
                Format accepté : <strong>PDF uniquement</strong> (rapport HappyNeuron Pro ou scan cahier rempli). L&apos;extracteur dédié pré-remplit tranche d&apos;âge + NSC + zones HappyNeuron + sous-scores des 11 épreuves.
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

      {/* Bandeau bilan précédent détecté (mode renouvellement). */}
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
              L&apos;IA calculera les passages de zone HappyNeuron épreuve par épreuve et le Word affichera un tableau comparatif avec flèches (↑ progrès / → stable / ↓ régression).
            </p>
          </div>
        </div>
      )}

      {/* Live preview deltas (mode renouvellement). */}
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
        </div>
      )}

      {/* Stratification obligatoire (âge × NSC) */}
      <div className="rounded-lg border border-gray-200 bg-white p-4 space-y-3">
        <p className="text-sm font-semibold text-gray-900 flex items-center gap-1.5">
          <Info size={14} className="text-indigo-600" />
          Stratification obligatoire — âge × NSC
        </p>
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Tranche d&apos;âge</label>
            <select
              value={state.trancheAge}
              onChange={(e) => setState(s => ({ ...s, trancheAge: e.target.value as State['trancheAge'] }))}
              className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            >
              <option value="">— choisir —</option>
              {TRANCHE_AGE_OPTIONS.map(o => (
                <option key={o.key} value={o.key}>{o.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Niveau socio-culturel (NSC)</label>
            <select
              value={state.nsc}
              onChange={(e) => setState(s => ({ ...s, nsc: e.target.value as State['nsc'] }))}
              className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            >
              <option value="">— choisir —</option>
              {NSC_OPTIONS.map(o => (
                <option key={o.key} value={o.key}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>
        <p className="text-[11px] text-gray-500 leading-relaxed">
          La stratification est <strong>obligatoire pour PREDIMEM</strong> : un sujet NSC 3 doit être comparé au groupe NSC 3 (effet
          réserve cognitive). Sans elle, le seuil d&apos;alerte HappyNeuron n&apos;a pas de sens.
        </p>
        {state.nsc === '1' && (
          <p className="text-[11px] text-amber-900 bg-amber-50 border border-amber-200 rounded px-2 py-1.5">
            <strong>NSC 1 — minimum requis : 9 ans de scolarité.</strong> Les sujets *sous-NSC 1* (illettrés, scolarité &lt; 9 ans)
            ne sont pas dans le périmètre PREDIMEM — préférer un bilan neuropsychologique adapté.
          </p>
        )}
        {state.nsc === '3' && (
          <p className="text-[11px] text-indigo-900 bg-indigo-50 border border-indigo-200 rounded px-2 py-1.5">
            <strong>NSC 3 — haute réserve cognitive :</strong> population prototype PREDIMEM. Lire systématiquement le{' '}
            <strong>TEMPS</strong> en plus du score : un score correct avec temps {'>'}{' '} seuil est un marqueur sub-clinique majeur.
          </p>
        )}
        <div className="text-[11px] text-gray-600 bg-gray-50 border border-gray-200 rounded px-2 py-1.5">
          <strong>Critères d&apos;exclusion à vérifier avant passation</strong> (manuel) : bilinguisme, MMSE &lt; 30 (effet plancher),
          pathologie neurologique avérée déjà documentée, autre bilan mnésique en cours.
        </div>
      </div>

      {/* Synthèse zones en bandeau (visible dès la 1ère épreuve saisie) */}
      {(totalEpreuvesSaisies > 0 || nonPasseesCount > 0) && (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
          <p className="text-xs font-semibold text-gray-700 mb-2">
            Répartition par zone — {totalEpreuvesSaisies}/11 épreuves saisies
            {nonPasseesCount > 0 && (
              <span className="ml-2 font-normal text-gray-500">({nonPasseesCount} non passée{nonPasseesCount > 1 ? 's' : ''})</span>
            )}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {ZONES.map(z => {
              const n = zoneCounts[z.key]
              if (n === 0) return null
              return (
                <span key={z.key} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded ${z.chipBg} ${z.chipText} text-xs font-medium`}>
                  <span className="font-bold">{n}</span>
                  <span>{z.label}</span>
                </span>
              )
            })}
            {totalEpreuvesSaisies > 0 && Object.values(zoneCounts).every(v => v === 0) && (
              <span className="text-xs text-gray-500 italic">Aucune zone HappyNeuron renseignée — pensez à reporter la zone affichée par le logiciel pour chaque épreuve.</span>
            )}
          </div>
        </div>
      )}

      {/* Cartes par épreuve (11 cartes) */}
      <div className="space-y-3">
        {EPREUVES.map(e => {
          const st = state.epreuves[e.key]

          // Indicateur NSC pour les textes (épreuves 02 et 07) — affiche le
          // texte sélectionné par le logiciel selon le NSC saisi en tête.
          const texteParNsc: Record<string, string> = {
            '1': 'Aline (court, temps étalonné 3 min, résumé attendu n°3)',
            '2': 'Travers (intermédiaire, 5 min, résumé n°4)',
            '3': 'Lapissoire (long, lexique soutenu, 6 min, résumé n°2)',
          }
          const showTexteNscHint = (e.key === 'e02_texte_lu' || e.key === 'e07_texte_entendu') && !!state.nsc
          // Note : le texte de l'épreuve 07 est étalonné indépendamment du NSC
          // (un seul texte, résumé attendu n°2) — donc on n'affiche le mapping
          // que pour l'épreuve 02.
          const showTexte02NscHint = e.key === 'e02_texte_lu' && !!state.nsc

          // Alertes conditionnelles — pour guider l'ortho sur les bascules
          // entre subtests (optionnelle 1a, subtest 3b).
          const rappelLibre01 = parseInt(state.epreuves['e01_objets'].scores['rappel'] || '', 10)
          const optionnelle01Suggeree = e.key === 'e01_objets' && !isNaN(rappelLibre01) && rappelLibre01 < 8

          const subtest3a = parseInt(state.epreuves['e03_mdt'].scores['subtest_3a'] || '', 10)
          const subtest3bAutorise = e.key === 'e03_mdt' && !isNaN(subtest3a) && subtest3a >= 18
          const subtest3bBloque = e.key === 'e03_mdt' && !isNaN(subtest3a) && subtest3a < 18

          return (
            <div key={e.key} className={`rounded-lg border bg-white p-4 ${st.non_passee ? 'border-gray-300 opacity-60' : 'border-gray-200'}`}>
              <div className="flex items-start justify-between gap-3 flex-wrap mb-2">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-mono text-gray-400">Épreuve {e.num}</p>
                  <h4 className="text-sm font-semibold text-gray-900">{e.label}</h4>
                  {!st.non_passee && (
                    <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{e.description}</p>
                  )}
                  {st.non_passee && (
                    <p className="text-xs italic text-gray-500 mt-0.5">Épreuve marquée non passée — pas d&apos;interprétation par l&apos;IA.</p>
                  )}
                </div>
                <label className="text-xs text-gray-600 flex items-center gap-1.5 shrink-0 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={st.non_passee}
                    onChange={(ev) => handleNonPasseeToggle(e.key, ev.target.checked)}
                    className="rounded"
                  />
                  Épreuve non passée
                </label>
              </div>

              {!st.non_passee && (
              <>
              {/* Hint texte selon NSC (épreuve 02 — texte lu) */}
              {showTexte02NscHint && (
                <div className="mt-2 px-2 py-1.5 rounded bg-indigo-50 border border-indigo-100 text-[11px] text-indigo-800">
                  <span className="font-semibold">Texte sélectionné par HappyNeuron :</span>{' '}
                  {texteParNsc[state.nsc]}
                </div>
              )}
              {/* Hint texte épreuve 07 — un seul texte étalonné, indépendant du NSC */}
              {e.key === 'e07_texte_entendu' && showTexteNscHint && (
                <div className="mt-2 px-2 py-1.5 rounded bg-indigo-50 border border-indigo-100 text-[11px] text-indigo-800">
                  <span className="font-semibold">Texte étalonné unique</span> (indépendant du NSC) — résumé attendu n°2.
                </div>
              )}

              {/* Alertes pour subtests conditionnels */}
              {optionnelle01Suggeree && (
                <div className="mt-2 px-2 py-1.5 rounded bg-amber-50 border border-amber-200 text-[11px] text-amber-900">
                  <strong>Rappel libre &lt; 8</strong> → l&apos;épreuve <strong>optionnelle /30</strong> est indiquée (dissocie encodage / récupération). Non comptabilisée dans le total.
                </div>
              )}
              {subtest3bAutorise && (
                <div className="mt-2 px-2 py-1.5 rounded bg-emerald-50 border border-emerald-200 text-[11px] text-emerald-900">
                  <strong>Subtest 3a ≥ 18</strong> → le subtest <strong>3b</strong> peut être proposé.
                </div>
              )}
              {subtest3bBloque && (
                <div className="mt-2 px-2 py-1.5 rounded bg-gray-50 border border-gray-200 text-[11px] text-gray-700">
                  <strong>Subtest 3a &lt; 18</strong> → le subtest 3b ne doit PAS être passé (consigne officielle).
                </div>
              )}

              {/* Subtests = scores bruts à saisir */}
              <div className="grid gap-2 mt-3">
                {e.subtests.map(sub => (
                  <div key={sub.key} className="flex items-center justify-between gap-3 flex-wrap py-1.5 px-2 rounded bg-gray-50">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-800">{sub.label}</p>
                      {sub.hint && <p className="text-[11px] text-gray-500">{sub.hint}</p>}
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <input
                        type="number"
                        min={0}
                        max={sub.max}
                        step={1}
                        value={st.scores[sub.key]}
                        onChange={(ev) => handleScoreChange(e.key, sub.key, ev.target.value, sub.max)}
                        placeholder="—"
                        className="w-16 px-2 py-1 border border-gray-300 rounded text-center text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-400"
                      />
                      <span className="text-xs text-gray-500">/ {sub.max}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Temps (optionnel) */}
              {e.hasTemps && (
                <div className="mt-3 flex items-center gap-2">
                  <label className="text-xs font-medium text-gray-700 shrink-0">Temps (optionnel) :</label>
                  <input
                    type="text"
                    value={st.temps}
                    onChange={(ev) => handleTempsChange(e.key, ev.target.value)}
                    placeholder="Ex. 3 min 20"
                    className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  />
                </div>
              )}

              {/* Zone HappyNeuron — 5 boutons radio en chips colorées */}
              <div className="mt-3">
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Zone HappyNeuron (reportée du logiciel) :
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {ZONES.map(z => {
                    const active = st.zone === z.key
                    return (
                      <button
                        key={z.key}
                        type="button"
                        onClick={() => handleZoneChange(e.key, active ? '' : z.key)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium transition ${z.chipBg} ${z.chipText} ${active ? `ring-2 ${z.chipRing}` : 'opacity-60 hover:opacity-100'}`}
                        title={z.sigma}
                      >
                        {z.label}
                      </button>
                    )
                  })}
                  {st.zone && (
                    <button
                      type="button"
                      onClick={() => handleZoneChange(e.key, '')}
                      className="inline-flex items-center px-2 py-1 rounded text-[11px] text-gray-600 hover:text-gray-900 underline decoration-dotted"
                    >
                      effacer
                    </button>
                  )}
                </div>
              </div>

              {/* Règles de cotation (accordéon) */}
              <details className="group mt-3 rounded-md border border-indigo-100 bg-indigo-50/50">
                <summary className="flex items-center gap-1.5 px-3 py-2 cursor-pointer select-none text-xs font-medium text-indigo-800 hover:bg-indigo-50">
                  <ChevronDown size={14} className="transition-transform group-open:rotate-0 -rotate-90" />
                  Règles de cotation officielles (HappyNeuron 2019)
                </summary>
                <ul className="px-3 pb-3 pt-1 space-y-1 text-xs text-gray-700">
                  {e.rules.map((r, i) => (
                    <li key={i} className="leading-relaxed">{r}</li>
                  ))}
                </ul>
              </details>

              {/* Aide à l'interprétation clinique (accordéon ambre) */}
              {e.interpretation && e.interpretation.length > 0 && (
                <details className="group mt-2 rounded-md border border-amber-200 bg-amber-50/60">
                  <summary className="flex items-center gap-1.5 px-3 py-2 cursor-pointer select-none text-xs font-medium text-amber-900 hover:bg-amber-100/50">
                    <ChevronDown size={14} className="transition-transform group-open:rotate-0 -rotate-90" />
                    Aide à l&apos;interprétation clinique
                  </summary>
                  <ul className="px-3 pb-3 pt-1 space-y-1 text-xs text-gray-700">
                    {e.interpretation.map((r, i) => (
                      <li key={i} className="leading-relaxed">{r}</li>
                    ))}
                  </ul>
                </details>
              )}

              {/* Observations rapides (cases pré-rédigées) — gain UX majeur en
                  passation. Cocher = texte ajouté à la sortie pour l'IA, SANS
                  toucher au champ observation libre. */}
              {e.quickObservations && e.quickObservations.length > 0 && (
                <div className="mt-3">
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Observations rapides (cocher pour ajouter) :
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {e.quickObservations.map(qo => {
                      const active = (st.cochedQuickObs ?? []).includes(qo.key)
                      // Couleur des chips selon valence clinique. Quand active :
                      //   - positive → fond vert plein, texte blanc
                      //   - neutral  → fond gris plein, texte blanc
                      //   - negative → fond rouge plein, texte blanc
                      // Quand inactive : fond très clair + texte de la valence.
                      const palette = qo.tone === 'positive'
                        ? { active: 'bg-emerald-600 text-white ring-emerald-700', idle: 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200' }
                        : qo.tone === 'negative'
                        ? { active: 'bg-rose-600 text-white ring-rose-700', idle: 'bg-rose-50 text-rose-800 hover:bg-rose-100 border border-rose-200' }
                        : { active: 'bg-gray-700 text-white ring-gray-800', idle: 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200' }
                      return (
                        <button
                          key={qo.key}
                          type="button"
                          onClick={() => handleQuickObsToggle(e.key, qo.key)}
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium transition ${active ? `${palette.active} ring-1` : palette.idle}`}
                          title={qo.text}
                        >
                          {active && <span aria-hidden="true">✓</span>}
                          {qo.label}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Observation libre (au-delà des cases cochées) */}
              <div className="mt-3">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-medium text-gray-700">
                    {e.quickObservations && e.quickObservations.length > 0
                      ? 'Observation libre (complément aux cases cochées)'
                      : 'Observation clinique (stratégies, attitudes, types d\'erreurs)'}
                  </label>
                  <MicButton
                    value={st.observation}
                    onChange={(v) => handleObservationChange(e.key, v)}
                  />
                </div>
                <textarea
                  value={st.observation}
                  onChange={(ev) => handleObservationChange(e.key, ev.target.value)}
                  rows={2}
                  placeholder={e.obsPlaceholder}
                  className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm leading-relaxed resize-y focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
              </div>
              </>
              )}
            </div>
          )
        })}
      </div>

      {/* Notes globales (comportement / fatigabilité) */}
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <div className="flex items-center justify-between mb-1">
          <label className="text-sm font-medium text-gray-800">
            Notes globales sur la séance (comportement, fatigabilité, stratégies générales)
          </label>
          <MicButton value={notes} onChange={onNotesChange} />
        </div>
        <textarea
          value={notes}
          onChange={(e) => onNotesChange(e.target.value)}
          rows={3}
          placeholder="Ex. patient coopératif, fatigue marquée en fin de protocole, stratégies de catégorisation spontanées, demande beaucoup d'aide à la consigne sur l'épreuve 03 mais bonne récupération une fois engagé."
          className="w-full px-3 py-2 border border-gray-300 rounded text-sm leading-relaxed resize-y focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />
      </div>

      {/* Rappel règles cliniques PREDIMEM */}
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
        <div className="flex items-start gap-2">
          <AlertCircle size={16} className="text-amber-700 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-900 leading-relaxed">
            <p className="font-semibold mb-1">Rappels cliniques PREDIMEM</p>
            <ul className="list-disc list-inside space-y-0.5">
              <li>PREDIMEM est un <strong>dépistage</strong>, jamais un diagnostic. Aucune étiologie ne sera nommée (Alzheimer, MCI, démence, etc.).</li>
              <li>Ne jamais conclure sur une <strong>épreuve isolée</strong> — croiser au moins 2-3 épreuves convergentes.</li>
              <li>Reporter les <strong>temps</strong> : un score normal en temps pathologique est un marqueur sub-clinique majeur.</li>
              <li>Mentionner les <strong>domaines préservés en premier</strong>. Vocabulaire fonctionnel (impact quotidien), jamais alarmant.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
