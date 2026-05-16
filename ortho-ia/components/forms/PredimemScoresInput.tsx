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

import { useEffect, useMemo, useState } from 'react'
import { Brain, ChevronDown, AlertCircle, Info } from 'lucide-react'
import MicButton from '../MicButton'

interface Props {
  /** Notes globales (comportement, fatigabilité, stratégies générales). */
  notes: string
  onNotesChange: (v: string) => void
  /** Écrit le résultat normalisé dans `resultats_manuels`. */
  onResultatsChange: (normalized: string) => void
  /** Callback erreur (remonte au parent). */
  onError?: (msg: string) => void
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
      'Reconnaissance 1b : différée après ≥ 10 min (intercaler épreuve 02 « mémoire d\'un texte lu »). 25 planches de 6 objets, 1 pt par objet reconnu du 1er coup.',
    ],
    interpretation: [
      'Rappel + reconnaissance bons → mémoire épisodique visuelle préservée.',
      'Rappel libre faible MAIS reconnaissance préservée → suggère un trouble de RÉCUPÉRATION (encodage et stockage OK).',
      'Rappel + reconnaissance + optionnelle TOUS faibles, peu sensible à l\'indiçage → suggère un trouble d\'ENCODAGE / consolidation.',
      'Croiser avec les épreuves 02 et 07 (textes) et 06 (associations sémantiques) pour confirmer le profil. Jamais conclure sur cette épreuve isolée.',
    ],
    obsPlaceholder: 'Ex. rappelle vite les 5 premiers objets puis décroche. Stratégie par catégories (animaux, objets…). Intrusion : "marteau" pour "hache".',
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
      'Texte sélectionné par le logiciel selon NSC : NSC 1 = Aline (court), NSC 2 = Travers (intermédiaire), NSC 3 = Lapissoire (long, lexique soutenu).',
      'Lecture silencieuse libre, temps chronométré (l\'ortho peut comparer au seuil HappyNeuron).',
      'Rappel : 2 pts par information importante donnée spontanément ou en réponse à une question ouverte. 0 pt par info manquante ou erronée. 0 pt par erreur sur personnage.',
      'Si rappel d\'emblée correct : 12 pts sans poser les questions.',
      'Choix de résumé : différé d\'au moins 20 min. 4 résumés présentés. Bon choix d\'emblée = 8 pts, hésite et trouve en 2e = 2 pts, mauvais = 0.',
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
    ],
    interpretation: [
      '3a faible (< 18) → fragilité de boucle phonologique / encodage immédiat.',
      '3a réussi MAIS 3b effondré → fragilité spécifique de manipulation en mémoire de travail (administrateur central).',
      'Comparer aux résultats à l\'empan envers classique (WAIS), aux Acronymes PREDILAE et à la séquence Lettres-Chiffres.',
    ],
    obsPlaceholder: 'Ex. répète le mot et le nombre à voix basse avant de répondre. Au 3b : range mentalement les chiffres avant l\'alternance. Persévération sur la 1ère lettre du 3e item.',
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
      'Chaque blason est présenté seul, puis le sujet le reconstruit de mémoire à partir d\'éléments à choisir (forme, couleurs, dessin, position).',
      'Reconstruction immédiate (pas de différé entre présentation et rappel).',
      'Points attribués par caractéristique correcte (forme générale, répartition des couleurs, dessin central, position du dessin, couleurs spécifiques).',
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
      'Reconnaissance du chat (forme tangram complète) : 2 pts si reconnu spontanément.',
      'Analyse de 3 planches : pour chaque planche, identifier les pièces EN TROP ou MANQUANTES par rapport au modèle.',
      'Cotation détaillée par planche selon les pièces correctement identifiées (cf. logiciel HappyNeuron).',
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
      'L\'indiçage sémantique (catégorie) facilite la récupération — c\'est précisément ce que l\'épreuve mesure.',
      'Logos commerciaux : épreuve culturellement marquée, attention aux sujets éloignés de la consommation moderne.',
    ],
    interpretation: [
      'Score correct sur les 3 subtests → mémoire sémantique préservée, bon bénéfice à l\'indiçage.',
      'Score faible sur animaux/objets MAIS correct sur logos → suggère une fragilité d\'accès lexical/sémantique abstraite, à explorer.',
      'Score faible sur logos isolé → souvent un effet culturel (sujet âgé, peu de TV/pub), à ne pas surinterpréter.',
      'Échec global → fragilité d\'encodage non rattrapée par indiçage sémantique (profil compatible avec atteinte sémantique débutante).',
    ],
    obsPlaceholder: 'Ex. animaux et objets : associations rapides et catégorisation spontanée. Logos : ne reconnaît pas 3 enseignes contemporaines (sujet âgé).',
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
      'Mêmes 3 textes que l\'épreuve 02 (Aline / Travers / Lapissoire selon NSC) — mais entendus au lieu de lus.',
      'Cotation identique à l\'épreuve 02 : 2 pts par information pertinente (rappel) ; 8/2/0 pour le choix de résumé.',
      'Choix de résumé différé d\'au moins 20 min.',
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
      'Reconnaissance parmi des distracteurs visuels (formes proches).',
      '2 pts par forme reconnue du 1er coup. 0 pt si reconnu en 2e choix.',
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
      'Phrases : 4 phrases à répéter exactement (boucle phonologique allongée).',
      'Cotation phrases : 10 pts par phrase, modulé selon les pertes (mots oubliés, ordre modifié, paraphasies).',
    ],
    interpretation: [
      'Bruits OK + phrases altérées → fragilité de boucle phonologique (composante verbale), à confronter à l\'empan endroit classique.',
      'Bruits altérés + phrases OK → fragilité auditivo-perceptive non verbale, à explorer (audition ? agnosie auditive ?).',
      'Pertes morphologiques ou lexicales sur les phrases → croiser avec épreuve 03 (MdT) et 07 (texte entendu).',
    ],
    obsPlaceholder: 'Ex. bruits : 5/6 reconnus, hésitation sur "chien aboie" vs "loup hurle". Phrases : pertes des connecteurs sur la 3e et 4e (substitutions).',
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
      'Cotation : points par caillou correctement pointé dans le bon ordre.',
      '⚠️ PRÉALABLE : s\'assurer de l\'absence d\'héminégligence (test de barrage) et d\'apraxie constructive (figure de Rey) — sinon l\'interprétation mnésique est faussée.',
    ],
    interpretation: [
      'Échec sur cette épreuve sans atteinte des autres mémoires visuelles → fragilité spécifique de mémoire visuo-spatiale, à confronter aux cubes de Corsi.',
      'Échec en convergence avec épreuves 04, 05, 08, 11 → fragilité visuelle globale.',
      'Si héminégligence suspectée : invalider l\'interprétation et orienter vers neuropsy.',
    ],
    obsPlaceholder: 'Ex. parcours 4 cailloux : 14/16, inversion entre cailloux 2 et 3. Parcours 5 : décroche après le 3e caillou. Aucun signe d\'héminégligence sur barrage préalable.',
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
      'Présentation d\'une série de visages (peints ou photos), puis reconnaissance parmi des distracteurs.',
      '2 pts par visage reconnu du 1er coup. 0 pt si reconnaissance en 2e choix.',
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
 *  un temps optionnel, une zone HappyNeuron, et une observation. */
interface EpreuveState {
  scores: Record<string, string>
  temps: string
  zone: ZoneKey
  observation: string
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
  return { scores, temps: '', zone: '', observation: '' }
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

export default function PredimemScoresInput({ notes, onNotesChange, onResultatsChange, onError: _onError }: Props) {
  const [state, setState] = useState<State>(emptyState)

  const totalEpreuvesSaisies = useMemo(() => {
    let count = 0
    for (const e of EPREUVES) {
      const st = state.epreuves[e.key]
      const anyScore = e.subtests.some(s => st.scores[s.key]?.trim() !== '')
      if (anyScore) count++
    }
    return count
  }, [state.epreuves])

  /** Compte des épreuves dans chaque zone HappyNeuron pour le badge global. */
  const zoneCounts = useMemo(() => {
    const counts: Record<Exclude<ZoneKey, ''>, number> = {
      vert_fonce: 0, vert_clair: 0, jaune: 0, orange: 0, rouge: 0,
    }
    for (const e of EPREUVES) {
      const z = state.epreuves[e.key].zone
      if (z) counts[z]++
    }
    return counts
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
      const anyScore = e.subtests.some(s => st.scores[s.key]?.trim() !== '')
      if (!anyScore && !st.zone && !st.observation.trim()) continue

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
      const obs = st.observation.trim()
      if (obs) {
        lines.push(`Observation : ${obs}`)
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
      </div>

      {/* Synthèse zones en bandeau (visible dès la 1ère épreuve saisie) */}
      {totalEpreuvesSaisies > 0 && (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
          <p className="text-xs font-semibold text-gray-700 mb-2">
            Répartition par zone — {totalEpreuvesSaisies}/11 épreuves saisies
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
          return (
            <div key={e.key} className="rounded-lg border border-gray-200 bg-white p-4">
              <div className="flex items-start justify-between gap-3 flex-wrap mb-2">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-mono text-gray-400">Épreuve {e.num}</p>
                  <h4 className="text-sm font-semibold text-gray-900">{e.label}</h4>
                  <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{e.description}</p>
                </div>
              </div>

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

              {/* Observation */}
              <div className="mt-3">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-medium text-gray-700">
                    Observation clinique (stratégies, attitudes, types d&apos;erreurs)
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
