'use client'

/**
 * Saisie structurée PrediFex (PRotocole d'Evaluation et de Dépistage des
 * Insuffisances des Fonctions Exécutives, Duchêne & Jaillard, HappyNeuron
 * 2019).
 *
 * 10 épreuves ciblant les fonctions exécutives (flexibilité, mise à jour,
 * planification, inhibition, raisonnement). Population adulte 18-90 ans,
 * NSC 1 à 3 (étalonnage complet sur les 3 niveaux). Auteures déconseillent
 * la passation aux sujets *sous-NSC 1* (scolarité < 9 ans).
 *
 * Scoring : score brut /max + zone HappyNeuron à 5 paliers (vert foncé /
 * vert clair / jaune / orange / rouge), seuil d'alerte officiel à M − 1,5 σ.
 *
 * Stratégie de saisie : le logiciel HappyNeuron calcule automatiquement la
 * zone du sujet à partir des normes stratifiées (âge × NSC). L'ortho REPORTE
 * la zone visible à l'écran — on NE recalcule PAS la stratification ici.
 *
 * Particularités exposées dans le form :
 *  - Épreuve 05 Mise à jour : 5c Stroop lettres est optionnel et non scoré,
 *    déclenché si 5a < 12 ou 5b < 14 → alerte conditionnelle.
 *  - Épreuve 08 Sudofex : 3 niveaux (Annick /8, Marie /16, Guillaume /22),
 *    seule la meilleure grille compte → sélecteur de grille.
 *  - Épreuve 09 Équivalences : 4 subtests (Formes /8, Feux /12, Étoiles /18,
 *    Flèches /20), seul le meilleur compte → sélecteur de subtest.
 *  - Temps d'alerte affichés par âge sélectionné (donnés dans le manuel pour
 *    7 épreuves sur 10).
 *
 * Couplage : nouveau-crbo/page.tsx, test_utilise === ['PrediFex'].
 */

import { useEffect, useMemo, useState } from 'react'
import { Brain, ChevronDown, AlertCircle, Info, Clock } from 'lucide-react'
import MicButton from '../MicButton'

interface Props {
  notes: string
  onNotesChange: (v: string) => void
  onResultatsChange: (normalized: string) => void
  onError?: (msg: string) => void
}

/** Zone HappyNeuron officielle PrediFex — 4 paliers σ (manuel p. 17).
 *  Reportée par l'ortho depuis son écran HappyNeuron (source de vérité
 *  pour le seuil d'alerte stratifié âge × NSC).
 *
 *  Note : le manuel PrediFex définit 4 zones (Vert / Jaune / Orange / Rouge),
 *  contrairement au manuel PREDIMEM qui en définit 5. On reste fidèle à
 *  chaque manuel — le seuil bascule vert→jaune est M − 1,5σ (= seuil d'alerte
 *  officiel). */
type ZoneKey = '' | 'vert' | 'jaune' | 'orange' | 'rouge'

const ZONES: Array<{ key: Exclude<ZoneKey, ''>; label: string; sigma: string; chipBg: string; chipText: string; chipRing: string }> = [
  { key: 'vert',   label: 'Vert',   sigma: '≥ M − 1,5σ (norme ou au-dessus)', chipBg: 'bg-emerald-600', chipText: 'text-white',     chipRing: 'ring-emerald-700' },
  { key: 'jaune',  label: 'Jaune',  sigma: 'M−1,5σ à M−2σ (seuil d\'alerte)', chipBg: 'bg-amber-300',   chipText: 'text-amber-900',  chipRing: 'ring-amber-500' },
  { key: 'orange', label: 'Orange', sigma: 'M−2σ à M−3σ',                     chipBg: 'bg-orange-500',  chipText: 'text-white',      chipRing: 'ring-orange-600' },
  { key: 'rouge',  label: 'Rouge',  sigma: '< M−3σ (effondrement)',           chipBg: 'bg-red-600',     chipText: 'text-white',      chipRing: 'ring-red-700' },
]

const ZONE_LABEL_CLINIQUE: Record<Exclude<ZoneKey, ''>, string> = {
  vert:   'performance préservée',
  jaune:  'fragilité objectivée (seuil d\'alerte)',
  orange: 'difficulté avérée',
  rouge:  'effondrement',
}

/** Identifiant stable d'une épreuve (utilisé comme clé d'état et dans la
 *  sortie normalisée). Ne PAS renommer une fois en prod. */
type EpreuveKey =
  | 'e01_fluences_alternees'
  | 'e02_texte_mettre_ordre'
  | 'e03_textes_executifs'
  | 'e04_syllabe_sur_deux'
  | 'e05_mise_a_jour'
  | 'e06_probleme_arith'
  | 'e07_probleme_luria'
  | 'e08_sudofex'
  | 'e09_equivalences'
  | 'e10_itineraire'

type TrancheAge = '' | '1' | '2' | '3' | '4' | '5'
type Nsc = '' | '1' | '2' | '3'

interface Subtest {
  key: string
  label: string
  max: number
  hint?: string
}

/** Case à cocher d'observation rapide — gain UX en passation : l'ortho coche
 *  les patterns observés au lieu de re-taper. Les textes des cases cochées
 *  sont concaténés dans la sortie normalisée à CÔTÉ de l'observation libre.
 *  Pattern aligné PREDIMEM (cf. PredimemScoresInput.tsx). */
interface QuickObs {
  key: string
  label: string
  text: string
  /** 'positive' = signe favorable, 'neutral' = factuel, 'negative' = signe d'alerte. */
  tone?: 'positive' | 'neutral' | 'negative'
}

interface Epreuve {
  key: EpreuveKey
  num: string
  label: string
  description: string
  cible: string
  subtests: Subtest[]
  /** Si renseigné, temps d'alerte en minutes par tranche d'âge (manuel utilisateur).
   *  index 0 = 18-49, 1 = 50-59, 2 = 60-69, 3 = 70-79, 4 = ≥80. */
  tempsAlerteMinParAge?: number[]
  /** Règles de cotation officielles (manuel HappyNeuron 2019) — accordéon. */
  rules: string[]
  /** Aide à l'interprétation clinique (croisements). */
  interpretation: string[]
  /** Placeholder pour la zone observation. */
  obsPlaceholder: string
  /** Cases d'observation rapide à cocher (optionnel). Pas toutes les cartes
   *  équipées en v1 — les 5 prioritaires manuellement choisies (01, 04, 07,
   *  08, 09) par retour terrain. */
  quickObservations?: QuickObs[]
}

const EPREUVES: Epreuve[] = [
  {
    key: 'e01_fluences_alternees',
    num: '01',
    label: 'Fluences alternées',
    description: 'Production alternée de mots entre deux catégories. Chrono fixe 1 min. Catégories selon NSC (manuel p. 24, 88) : NSC 1 = Outils / Ustensiles de cuisine ; NSC 2 et 3 = Villes françaises / Pays étrangers. Mesure la flexibilité mentale et l\'inhibition d\'une réponse automatique catégorielle.',
    cible: 'Flexibilité + inhibition',
    subtests: [
      { key: 'score', label: 'Score total', max: 30, hint: '1 pt par mot correct (plafond 30). 2 mots de la même catégorie à la suite = 1 pt seulement.' },
    ],
    rules: [
      'Catégories selon NSC (manuel p. 24, 88) : NSC 1 = Outils / Ustensiles de cuisine ; NSC 2 et NSC 3 = Villes françaises / Pays étrangers.',
      'Consigne : alterner strictement entre les deux catégories pendant 1 min chronométrée.',
      '1 pt par mot correct, plafond 30. Pas de malus pour erreurs.',
      'Si le sujet donne 2 mots de la même catégorie consécutifs, on ne compte que 1 pt (l\'alternance est rompue).',
      'Exemples donnés dans la consigne NON comptabilisés s\'ils sont redonnés par le sujet (manuel p. 27).',
      'Possibilité d\'une "deuxième minute" non comptabilisée, à des fins d\'observation qualitative (manuel p. 25).',
      'Persévérations, mots hors catégorie, paraphrases : noter qualitativement.',
    ],
    interpretation: [
      'Score abaissé + persévérations sur la 1ère catégorie → fragilité de FLEXIBILITÉ (résistance au switch).',
      'Score abaissé sans persévération + lenteur d\'évocation → croiser avec PREDILAC / fluences classiques (peut-être déficit lexical sous-jacent).',
      'Le manuel (p. 27-28) distingue 4 types de difficulté à observer : compréhension verbale, lexico-sémantique, accès au lexique, processus exécutifs.',
      'À croiser avec épreuves 04 (Une syllabe sur deux) et 09 (Équivalences) pour confirmer un profil flexibilité.',
    ],
    obsPlaceholder: 'Complément libre (au-delà des cases cochées). Ex. NSC 2, 18 mots en 1 min, lenteur en milieu d\'épreuve.',
    quickObservations: [
      { key: 'alternance_rompue', label: 'Alternance rompue (≥ 2 mots même catégorie)', text: 'Alternance rompue à plusieurs reprises (2+ mots de la même catégorie consécutifs, 1 pt seulement).', tone: 'negative' },
      { key: 'persev_cat',        label: 'Persévérations sur une catégorie',           text: 'Persévérations marquées sur une des deux catégories.', tone: 'negative' },
      { key: 'exemples_redonnes', label: 'Exemples de la consigne redonnés',           text: 'Exemples donnés dans la consigne redonnés par le sujet (non comptabilisés — manuel p. 27).', tone: 'neutral' },
      { key: 'desequilibre',      label: 'Production très déséquilibrée entre cat.',    text: 'Production très déséquilibrée entre les deux catégories (une beaucoup plus productive).', tone: 'neutral' },
      { key: 'lenteur',           label: 'Lenteur d\'accès lexical',                    text: 'Lenteur d\'accès lexical observée (pauses longues entre mots).', tone: 'neutral' },
      { key: 'deuxieme_min',      label: '2e minute effectuée (qualitative)',           text: 'Deuxième minute proposée pour analyse qualitative (non comptabilisée — manuel p. 25).', tone: 'neutral' },
    ],
  },
  {
    key: 'e02_texte_mettre_ordre',
    num: '02',
    label: 'Texte à mettre en ordre',
    description: '3 textes selon NSC (manuel p. 30, 88) : NSC 1 = Fanny ; NSC 2 = Voilier ; NSC 3 = Molly. Réorganiser des segments de texte présentés en désordre pour reconstituer un récit cohérent. Planification + cohérence textuelle + MdT.',
    cible: 'Planification + MdT',
    subtests: [
      { key: 'score', label: 'Score total', max: 12, hint: 'Grille balisée 12 / 10 / 8 / 6 / 4 / 0 (manuel p. 32). −2 pt / segment mal placé sans casser cohérence, −4 pt si casse, −3 pt si aide.' },
    ],
    tempsAlerteMinParAge: [4, 5, 7, 11, 18],
    rules: [
      'Texte selon NSC : Fanny (NSC 1) / Voilier (NSC 2) / Molly (NSC 3).',
      'Présentation des segments en désordre, sujet réorganise sur écran ou papier.',
      'Cotation balisée (manuel p. 32) : 12 / 10 / 8 / 6 / 4 / 0. −2 pt par segment mal placé sans rupture de cohérence, −4 pt si rupture de cohérence, −3 pt si aide.',
      '⚠️ Plafond temps absolu : on arrête au bout d\'un quart d\'heure (manuel p. 30), au-delà du seuil d\'alerte indicatif par âge.',
      '⚠️ NSC 3 plafonne souvent (12/12, ET=0 pour 18-49 ans dans le manuel) → lire le TEMPS plutôt que le score.',
    ],
    interpretation: [
      'Score abaissé + temps long → fragilité de planification narrative ou de MdT textuelle.',
      'Score plafond MAIS temps > seuil chez NSC 3 → marqueur sub-clinique majeur (fragilité débutante).',
      'Croiser avec ép. 03 (Textes exécutifs), 06 (Pb arith), 10 (Itinéraire) pour un profil de planification.',
    ],
    obsPlaceholder: 'Ex. relit chaque segment plusieurs fois avant de placer. Saute le segment 3 et le place en fin par défaut. Temps : 6 min (NSC 2, 55 ans → > seuil 5 min).',
  },
  {
    key: 'e03_textes_executifs',
    num: '03',
    label: 'Textes « exécutifs »',
    description: 'Compréhension de texte exigeante. 3 textes 3a et 3 textes 3b selon NSC (manuel p. 89-90). 3a = choix du résumé. 3b = 5 épisodes à remettre dans l\'ordre réel (≠ ordre narratif).',
    cible: 'Attention + inhibition + inférences',
    subtests: [
      { key: 'resume',  label: '3a Choix du résumé', max: 4, hint: '4 pt bonne réponse OU 0 pt (tout ou rien). Distracteur phonétiquement proche piège la voie superficielle.' },
      { key: 'ordre',   label: '3b Ordre des événements (5 épisodes)', max: 6, hint: '−1 pt / épisode mal placé, −2 pt sur l\'épisode à astérisque (plus exécutif), −3 pt si aide.' },
    ],
    tempsAlerteMinParAge: [5, 6, 8, 10, 15],
    rules: [
      '3a — Textes selon NSC (manuel p. 89) : Gallon (NSC 1, rép. n°4) / Serin (NSC 2, rép. n°3) / Dépression (NSC 3, rép. n°3). Choisir parmi des résumés candidats — un seul correct sémantiquement, les autres pièges (phonétique, partiel, hors-sujet).',
      '3b — Textes selon NSC (manuel p. 90) : Dégât des eaux (NSC 1) / Julie (NSC 2) / Jean (NSC 3). Reclasser les 5 épisodes du récit dans l\'ordre RÉEL des faits (≠ ordre narratif du texte qui mélange flashbacks / anticipations).',
      'Cotation 3a : 4 pt si bon résumé d\'emblée, 0 sinon (tout ou rien).',
      'Cotation 3b : −1 pt par épisode mal placé, −2 pt sur l\'épisode à astérisque (plus exécutif, varie selon NSC — voir manuel p. 38), −3 pt si aide examinateur.',
    ],
    interpretation: [
      '3a échoué (choisit le distracteur phonétique) → fragilité d\'inhibition / contrôle superficiel.',
      '3b échoué avec ordre narratif maintenu → fragilité d\'inférence / reconstruction temporelle (NE PAS confondre avec déficit mnésique).',
      'Score correct MAIS temps > seuil chez NSC 3 → marqueur sub-clinique.',
      'À croiser avec ép. 02 et 07 (Luria) pour profil de raisonnement / inhibition.',
    ],
    obsPlaceholder: 'Ex. 3a : choisit la reformulation phonétique au 1er essai (« il a couru » au lieu de « il a déguerpi »). 3b : suit l\'ordre du texte au lieu de l\'ordre des faits, 2 épisodes mal placés dont 1 à astérisque.',
  },
  {
    key: 'e04_syllabe_sur_deux',
    num: '04',
    label: 'Une syllabe sur deux',
    description: '7 items totaux (manuel p. 45, 90) : items 1-2 mots 2 syl. (Gâteau-Bonjour ; Lancer-Ranger), items 3-5 mots 3 syl. (Chocolat-Boulanger ; Caméra-Cinéma ; Châtiment-Matelot), items 6-7 mots 4 syl. (Rapidement-Procuration ; Poissonnerie-Figuration). Inhibition + flexibilité (résister à la prononciation entière du mot).',
    cible: 'Inhibition + flexibilité',
    subtests: [
      { key: 'mots_2syl', label: 'Mots 2 syllabes (items 1-2)', max: 8,  hint: '4 pt par mot correct. Arrêt après 2 items consécutivement échoués.' },
      { key: 'mots_3syl', label: 'Mots 3 syllabes (items 3-5)', max: 18, hint: '6 pt par mot correct.' },
      { key: 'mots_4syl', label: 'Mots 4 syllabes (items 6-7)', max: 16, hint: '8 pt par mot correct. Consigne examinateur : "n\'en recomposer qu\'un à la fois" (p. 43).' },
    ],
    rules: [
      'Le sujet entend un mot et doit dire une syllabe sur deux (ex. « bateau » → « ba » ou « teau » selon consigne d\'amorçage).',
      'Cotation : 4 pt mot 2 syllabes, 6 pt mot 3 syllabes, 8 pt mot 4 syllabes.',
      'Pénalité : −2 pt par répétition audio demandée par le sujet.',
      'Arrêt : après 2 items consécutivement échoués dans une catégorie.',
      '⚠️ Consigne examinateur OBLIGATOIRE sur items 6-7 : "conseiller systématiquement au sujet de n\'en recomposer qu\'un à la fois" (manuel p. 43).',
      '⚠️ Règle "écrire = 0" : si le sujet écrit pour s\'aider, l\'épreuve est considérée comme ÉCHOUÉE et on compte 0, même s\'il parvient à la réaliser (manuel p. 43).',
      'Pas de seuil temps officiel (variabilité trop élevée).',
    ],
    interpretation: [
      'Erreur type : le sujet compose un mot avec 2 syllabes successives (au lieu d\'1 sur 2) = défaut d\'inhibition de l\'autre syllabe.',
      'Effondrement sur les mots 3-4 syllabes uniquement = surcharge MdT phonologique (croiser avec ép. 05 et empan envers).',
      'Échec dès les mots 2 syllabes = fragilité majeure d\'inhibition (croiser avec ép. 07 et 09).',
    ],
    obsPlaceholder: 'Complément libre (au-delà des cases cochées). Ex. fatigue audible sur les mots 4 syl, conscient de ses erreurs.',
    quickObservations: [
      { key: 'mot_entier_reprend',   label: 'Dit le mot entier puis se reprend',          text: 'Dit le mot entier puis se reprend sur certains items (conscience de l\'erreur).', tone: 'neutral' },
      { key: 'compose_2_successives', label: 'Compose avec 2 syllabes successives (défaut inhibition)', text: 'Compose un mot avec 2 syllabes successives (au lieu d\'1 sur 2) — défaut d\'inhibition de l\'autre syllabe (manuel p. 43).', tone: 'negative' },
      { key: 'repetition_audio',     label: 'Répétition audio demandée (−2 pts)',         text: 'Répétitions audio demandées par le sujet (−2 pts par répétition).', tone: 'negative' },
      { key: 'ecrit_aide',           label: '⚠ A écrit pour s\'aider → ÉCHEC (score = 0)', text: '⚠ Le sujet a écrit pour s\'aider — épreuve considérée comme ÉCHOUÉE et score = 0 (consigne manuel p. 43, règle "écrire = 0").', tone: 'negative' },
      { key: 'consigne_67',          label: 'Consigne « un à la fois » donnée (items 6-7)', text: 'Consigne officielle « ne recomposer qu\'un mot à la fois » donnée sur les items 6-7 (manuel p. 43).', tone: 'neutral' },
      { key: 'arret_2_echecs',       label: 'Arrêt après 2 items consécutifs échoués',    text: 'Arrêt déclenché après 2 items consécutivement échoués dans une catégorie (consigne manuel).', tone: 'neutral' },
      { key: 'decroche_complexite',  label: 'Décrochage progressif avec la complexité',    text: 'Décrochage progressif observable avec l\'augmentation de la complexité syllabique.', tone: 'negative' },
    ],
  },
  {
    key: 'e05_mise_a_jour',
    num: '05',
    label: 'Mise à jour',
    description: 'Suivre une suite de chiffres / syllabes et restituer les 3 DERNIERS éléments entendus (mise à jour permanente). Le sujet doit oublier les éléments précédents — c\'est précisément la mise à jour de la MdT.',
    cible: 'Mise à jour MdT',
    subtests: [
      { key: 'sub_5a_chiffres', label: '5a Chiffres', max: 21, hint: '7 séries × 3 pt. −1 pt par chiffre manquant.' },
      { key: 'sub_5b_syllabes', label: '5b Syllabes', max: 24, hint: '8 séries × 3 pt.' },
      { key: 'sub_5c_stroop',   label: '5c Stroop lettres (complémentaire)', max: 32, hint: '10+12+10 (JUPON vert, FRAISE rouge, 15879 rouge). Déclenché si 5a < 12 OU 5b < 14 OU abandon. NE fait PAS partie du score d\'épreuve — analyse qualitative.' },
    ],
    rules: [
      '⚠️ Consigne sujet (manuel p. 48) : "vous devez redire les 3 derniers chiffres/syllabes entendus" — TOUJOURS 3 derniers, pas un nombre variable.',
      '5a : on dicte des suites de chiffres ; le sujet restitue les 3 derniers à chaque pause.',
      '5b : même principe sur des syllabes (charge phonologique plus lourde).',
      '5c (complémentaire) : variante Stroop sur lettres colorées — DÉCLENCHÉ si 5a < 12 OU 5b < 14 OU abandon en cours. NE fait PAS partie du score d\'épreuve.',
      'Cotation : 3 pt par série correctement maintenue ; −1 pt par chiffre/syllabe manquant.',
      'Abandon possible (manuel p. 49) : si après 3 items le sujet a répété moins de 4 chiffres/syllabes.',
      'Pas de seuil temps officiel (auto).',
    ],
    interpretation: [
      '5a échoué + 5b OK → fragilité numérique spécifique (rare ; croiser avec ép. 06).',
      '5b nettement plus faible que 5a → surcharge phonologique de la MdT.',
      'Échec parallèle 5a + 5b → fragilité de mise à jour pure (administrateur central), croiser avec ép. 06 (Pb arith) et empan envers classique.',
      'Erreur type : le sujet répète plus de 3 chiffres « au cas où » = défaut de mise à jour (ne libère pas les anciens).',
    ],
    obsPlaceholder: 'Ex. 5a : 18/21, perd 1 chiffre sur les 2 dernières séries. 5b : 16/24, échec sur les séries longues, fatigue audible. 5c non passé (5a et 5b au-dessus du seuil).',
  },
  {
    key: 'e06_probleme_arith',
    num: '06',
    label: 'Problème arithmétique',
    description: '3 problèmes selon NSC (manuel p. 53, 91) : NSC 1 = La Voiture (essence) ; NSC 2 = Le Restaurant ; NSC 3 = La Fondue. Planification + MdT en numérique. Le calcul est secondaire — c\'est la structuration de l\'énoncé qui charge la fonction exécutive.',
    cible: 'Planification numérique',
    subtests: [
      { key: 'raisonnement', label: 'Raisonnement', max: 6, hint: '−2 pt par erreur de raisonnement ou omission d\'info de l\'énoncé.' },
      { key: 'calcul',       label: 'Calcul',       max: 4, hint: 'À l\'appréciation de l\'examinateur (manuel p. 54). Calcul chiffré exact = 4 pt.' },
    ],
    tempsAlerteMinParAge: [5, 6, 6, 8, 16],
    rules: [
      'Problème selon NSC : La Voiture (NSC 1, réponse "26 litres de trop") / Le Restaurant (NSC 2, "15 € le menu") / La Fondue (NSC 3, Gruyère 600g / Comté 600g / Vacherin 300g).',
      'Cotation décomposée : 6 pt pour le raisonnement (lecture + structuration + ordre des opérations) + 4 pt pour le calcul.',
      'Notes raisonnement et calcul sont à l\'APPRÉCIATION de l\'examinateur (manuel p. 54).',
      'Malus : −2 pt par erreur de raisonnement ou par omission d\'information de l\'énoncé, −3 pt si aide examinateur.',
      'On observe : le sujet RELIT-IL pour mémoriser ? Note-t-il les données ? Saute-t-il directement au calcul ?',
    ],
    interpretation: [
      'Raisonnement OK + calcul faux → fragilité numérique pure (à orienter vers Examath ou un bilan logico-mathématique adulte).',
      'Raisonnement faux + calcul correct sur les données mal sélectionnées → fragilité de MdT exécutive (omission de données).',
      'Échec global + temps long → croiser avec ép. 02, 03, 07 et 10 pour profil de planification globale.',
    ],
    obsPlaceholder: 'Ex. relit 3× l\'énoncé. Calcule correctement mais omet une donnée. Score : 4 raisonnement + 4 calcul = 8/10. Temps 7 min (NSC 2, 65 ans → > seuil 6 min).',
  },
  {
    key: 'e07_probleme_luria',
    num: '07',
    label: 'Problème logique « Luria »',
    description: '3 problèmes selon NSC (manuel p. 58, 92) : NSC 1 = Léo ; NSC 2 = Cédric & Diane ; NSC 3 = Hélène. Raisonnement abstrait avec énoncé piégeant — inhibition de la réponse intuitive en faveur d\'une analyse logique.',
    cible: 'Raisonnement + inhibition',
    subtests: [
      { key: 'q1', label: 'Question 1', max: 4 },
      { key: 'q2', label: 'Question 2', max: 2 },
      { key: 'q3', label: 'Question 3', max: 2 },
      { key: 'q4', label: 'Question 4', max: 2 },
    ],
    tempsAlerteMinParAge: [5, 6, 7, 9, 18],
    rules: [
      'Problème selon NSC : Léo (NSC 1 — Q1=14 ans, Q2=Non, Q3=Oui, Q4=Non) / Cédric & Diane (NSC 2) / Hélène (NSC 3).',
      '4 questions à difficulté croissante. Q1 = 4 pt, Q2 / Q3 / Q4 = 2 pt chacune. Max 10 pt.',
      'Malus : −3 pt si aide examinateur (reformulation de l\'énoncé).',
      'Piège textuel exact (manuel p. 60) : "le terme \'plus\' est associé à une opération d\'addition alors que dans la phrase \'avoir 10 ans de plus que\', il faut soustraire les 10 ans quand on calcule l\'année de naissance". Observer si le sujet tombe dans le piège et se reprend, ou ne se reprend pas (sensibilité à l\'interférence, défaut du SAS).',
    ],
    interpretation: [
      'Échec Q1 (la plus facile) → fragilité majeure d\'analyse logique ou de compréhension d\'énoncé.',
      'Échec Q2-Q4 avec Q1 OK → fragilité progressive sous charge.',
      'Réponse intuitive systématiquement maintenue malgré l\'erreur signalée → fragilité d\'inhibition (croiser avec ép. 04 et 09).',
      'À croiser avec ép. 09 (Équivalences) pour profil de raisonnement abstrait.',
    ],
    obsPlaceholder: 'Complément libre (au-delà des cases cochées). Ex. raisonnement à voix haute, dessine un axe temporel pour s\'aider.',
    quickObservations: [
      { key: 'piege_se_reprend',      label: 'Tombe dans le piège « plus que » puis se reprend', text: 'Tombe dans le piège « plus que » (additionne au lieu de soustraire) puis se reprend spontanément.', tone: 'neutral' },
      { key: 'piege_pas_reprend',     label: 'Tombe dans le piège et ne se reprend pas',          text: 'Tombe dans le piège « plus que » et ne se reprend pas (défaut du SAS / sensibilité à l\'interférence — manuel p. 60).', tone: 'negative' },
      { key: 'reformulation_aide',    label: 'Reformulation/aide examinateur (−3 pts)',           text: 'Reformulation ou aide examinateur sur l\'énoncé (−3 pts par item concerné).', tone: 'negative' },
      { key: 'q1_echec',              label: 'Q1 (la plus simple) échouée',                       text: 'Q1 (la plus simple) échouée — fragilité majeure d\'analyse logique ou de compréhension d\'énoncé.', tone: 'negative' },
      { key: 'voix_haute',            label: 'Raisonnement à voix haute',                         text: 'Raisonnement à voix haute observé (stratégie de désamorçage du piège).', tone: 'neutral' },
    ],
  },
  {
    key: 'e08_sudofex',
    num: '08',
    label: 'Sudofex',
    description: 'Type sudoku adapté (contenu + couleur). Essai d\'entraînement MIREILLE obligatoire (fait à deux), puis MARIE en entrée par défaut. Annick = repli si MIREILLE pas compris OU > 5 erreurs / abandon sur MARIE. Guillaume = niveau supérieur si MARIE bien réussie. SEULE la MEILLEURE grille compte.',
    cible: 'Inhibition + raisonnement logique en grille',
    subtests: [
      { key: 'grille_annick',    label: 'Grille Annick (repli)',  max: 8,  hint: '0,5 + 0,5 pt par case (contenu + couleur) × 8 cases = 8 pt. Choisie en REPLI si MIREILLE pas compris ou échec sur MARIE.' },
      { key: 'grille_marie',     label: 'Grille Marie (entrée par défaut)',    max: 16, hint: '1 + 1 pt par case × 8 cases = 16 pt. Mapping mot→couleur FIXE (chaque nom écrit toujours dans la même couleur, manuel p. 64).' },
      { key: 'grille_guillaume', label: 'Grille Guillaume (niveau supérieur)', max: 22, hint: '1 + 1 pt par case × 11 cases = 22 pt. Mapping mot→couleur VARIABLE (chaque nom n\'est jamais écrit 2× dans la même couleur — effet Stroop MAJORÉ, manuel p. 65).' },
    ],
    tempsAlerteMinParAge: [7, 8, 9, 15, 30],
    rules: [
      'Essai MIREILLE obligatoire (non scoré, fait à deux) pour vérifier la compréhension de la consigne.',
      'PARCOURS : MARIE est l\'entrée par défaut. ANNICK est un REPLI (si MIREILLE pas compris OU > 5 erreurs / abandon sur MARIE — manuel p. 63). GUILLAUME est le niveau supérieur si MARIE bien réussie.',
      'Cotation : Annick = 0,5 + 0,5 = 1 pt/case × 8 = 8 pt. Marie = 1 + 1 = 2 pt/case × 8 = 16 pt. Guillaume = 1 + 1 = 2 pt/case × 11 = 22 pt.',
      'Effet Stroop : MARIE = mapping mot→couleur FIXE (effet Stroop léger). GUILLAUME = mapping VARIABLE (effet Stroop majoré). ANNICK = pas d\'effet Stroop.',
      'Aide examinateur : −3 pt si aide partielle, −6 pt si aide majeure.',
      '⚠️ Reporter le score de la grille EFFECTIVEMENT réalisée — seule cette grille compte.',
      'Score chiffré à prendre AVEC PRÉCAUTION chez NSC 3 — toujours coupler analyse qualitative.',
    ],
    interpretation: [
      'Le sujet confond couleur du stylo et nom de couleur écrit → effet Stroop = défaut d\'inhibition (croiser avec ép. 04 et 07).',
      'Bascule MARIE → ANNICK (échec MARIE) → fragilité majeure de raisonnement en grille, orientation vers neuropsy.',
      'Réussite GUILLAUME avec temps > seuil → marqueur sub-clinique pour NSC 3.',
      'Le manuel décrit 6 stratégies de progression typiques (p. 66) à observer pour qualifier la performance.',
      'Croiser avec ép. 09 et 10 pour profil de raisonnement / planification globale.',
    ],
    obsPlaceholder: 'Complément libre (au-delà des cases cochées). Ex. MIREILLE OK d\'emblée, GUILLAUME non tentée par contrainte de temps.',
    quickObservations: [
      { key: 'mireille_pas_compris', label: 'MIREILLE non compris → bascule ANNICK',       text: 'Essai MIREILLE non compris fait à deux — bascule sur grille ANNICK (consigne manuel p. 63).', tone: 'negative' },
      { key: 'marie_echec',          label: 'Échec MARIE → bascule ANNICK',                text: 'Plus de 5 erreurs ou abandon sur la grille MARIE — bascule sur grille ANNICK (consigne manuel p. 63).', tone: 'negative' },
      { key: 'confusion_stroop',     label: 'Confusion couleur stylo vs nom écrit',         text: 'Confusion couleur du stylo vs nom de couleur écrit — défaut d\'inhibition (effet Stroop).', tone: 'negative' },
      { key: 'strategie_lignes',     label: 'Stratégie par lignes / colonnes observée',     text: 'Stratégie de résolution par lignes / colonnes observée (l\'une des 6 stratégies typiques manuel p. 66).', tone: 'positive' },
      { key: 'aide_partielle',       label: 'Aide partielle examinateur (−3)',              text: 'Aide partielle examinateur (−3 pts).', tone: 'negative' },
      { key: 'aide_majeure',         label: 'Aide majeure examinateur (−6)',                text: 'Aide majeure examinateur (−6 pts).', tone: 'negative' },
    ],
  },
  {
    key: 'e09_equivalences',
    num: '09',
    label: 'Équivalences',
    description: 'Raisonnement analogique + inhibition. Essai LUNES obligatoire (réponses : 6 lunes / 12 nuages / Faux / Faux), puis 4 subtests à difficulté croissante (Formes / Feux / Étoiles / Flèches). Seul le MEILLEUR subtest compte. ⚠️ Si scolarité < 10 ans → renoncer même si LUNES OK (manuel p. 75).',
    cible: 'Raisonnement analogique',
    subtests: [
      { key: 'sub_formes',  label: 'Formes (facile)',     max: 8,  hint: '4 items × 2 pt = 8.' },
      { key: 'sub_feux',    label: 'Feux',                max: 12, hint: '6 items × 2 pt = 12.' },
      { key: 'sub_etoiles', label: 'Étoiles',             max: 18, hint: '6 items × 3 pt = 18 (manuel p. 74).' },
      { key: 'sub_fleches', label: 'Flèches (difficile)', max: 20, hint: 'Scoring PROGRESSIF (manuel p. 74) : item 1 = 2 pt, item 2 = 4 pt, item 3 = 6 pt, item 4 = 8 pt. Total 20.' },
    ],
    tempsAlerteMinParAge: [5, 6, 8, 10, 20],
    rules: [
      'Essai LUNES obligatoire (réponses : 6 lunes / 12 nuages / Faux / Faux). Si LUNES non compris → RENONCER à l\'épreuve (orienter vers ép. 10 Itinéraire).',
      '⚠️ SCOLARITÉ PRIME sur LUNES : si scolarité < 10 ans, RENONCER même si LUNES est OK (manuel p. 75).',
      'Puis 4 subtests à difficulté croissante : Formes (4 items × 2 pt = 8) → Feux (6 × 2 = 12) → Étoiles (6 × 3 = 18) → Flèches (scoring progressif 2/4/6/8, total 20).',
      'Cotation Flèches : scoring PROGRESSIF (item 1 = 2 pt, item 2 = 4 pt, item 3 = 6 pt, item 4 = 8 pt) — pas un uniforme 2-3 pt/item.',
      'Aide examinateur : −3 pt si partielle, −6 pt si majeure.',
      '⚠️ Seul le MEILLEUR subtest est comptabilisé.',
      'Score chiffré à prendre AVEC PRÉCAUTION chez NSC 3 — toujours coupler analyse qualitative.',
    ],
    interpretation: [
      'Sujet bloque sur l\'abstraction des prémisses, ne peut raisonner sans valeurs concrètes → fragilité d\'abstraction (croiser avec ép. 07 et 08).',
      'Réussit Formes et Feux mais effondre sur Étoiles / Flèches → effet de complexité normal, à pondérer selon NSC.',
      'Réussit le subtest le plus dur sans aide → flexibilité analogique préservée, profil exécutif robuste.',
    ],
    obsPlaceholder: 'Complément libre (au-delà des cases cochées). Ex. LUNES OK, abandonne Flèches après item 2 — patient frustré.',
    quickObservations: [
      { key: 'lunes_pas_compris',      label: 'LUNES non compris → épreuve abandonnée',          text: 'Essai LUNES non compris — épreuve abandonnée (consigne manuel p. 71). Orienter vers ép. 10 Itinéraire.', tone: 'negative' },
      { key: 'scolarite_lt_10',        label: '⚠ Scolarité < 10 ans → épreuve sautée',           text: '⚠ Scolarité < 10 ans — épreuve SAUTÉE même si LUNES OK (consigne manuel p. 75 : la scolarité prime sur l\'essai).', tone: 'negative' },
      { key: 'bloque_abstraction',     label: 'Bloque sur abstraction des prémisses',            text: 'Bloque sur l\'abstraction des prémisses — fragilité d\'abstraction (croiser ép. 07 et 08).', tone: 'negative' },
      { key: 'demande_valeurs',        label: 'Demande des valeurs concrètes pour raisonner',    text: 'Demande des valeurs ou exemples concrets pour pouvoir raisonner (incapacité à manipuler l\'abstrait pur).', tone: 'negative' },
      { key: 'reussit_sans_aide',      label: 'Réussit le subtest le plus dur sans aide',        text: 'Réussit le subtest le plus dur sans aide — flexibilité analogique préservée, profil exécutif robuste.', tone: 'positive' },
      { key: 'aide_partielle_09',      label: 'Aide partielle examinateur (−3)',                 text: 'Aide partielle examinateur (−3 pts).', tone: 'negative' },
      { key: 'aide_majeure_09',        label: 'Aide majeure examinateur (−6)',                   text: 'Aide majeure examinateur (−6 pts).', tone: 'negative' },
    ],
  },
  {
    key: 'e10_itineraire',
    num: '10',
    label: 'Itinéraire',
    description: 'Contexte (manuel p. 78) : plan du village de Buxy, une infirmière doit faire des prélèvements à plusieurs patients, passer par l\'école pour son fils et déposer les analyses au labo. Planification spatiale + MdT visuo-spatiale. Ciblée NSC 1 (alternative à l\'ép. 09) et NSC 3 en confirmation.',
    cible: 'Planification spatiale',
    subtests: [
      { key: 'score', label: 'Score total', max: 20, hint: '2 pt par consigne respectée (passages obligés école + labo, sens interdits, ordre logique).' },
    ],
    tempsAlerteMinParAge: [6, 6, 7, 8, 10],
    rules: [
      'Le sujet doit dessiner un trajet sur le plan de Buxy pour visiter plusieurs patients, en respectant les passages obligés (école, labo) et les sens interdits.',
      'Cotation : 2 pt par consigne respectée (max 20 pt).',
      'Malus libre selon l\'aide apportée et la longueur excessive du trajet.',
      '⚠️ Peu sensible chez NSC 3 (compensation par réserve cognitive) — à proposer en CONFIRMATION seulement chez NSC 3 avec déficits ailleurs.',
      'Particulièrement utile chez NSC 1 incapables de faire l\'ép. 09 Équivalences (alternative recommandée par les auteures).',
    ],
    interpretation: [
      'Suit l\'ordre de la liste des patients au lieu d\'optimiser le trajet → fragilité de planification stratégique.',
      'Oublie une contrainte (passage école/labo) → fragilité de MdT visuo-spatiale (croiser avec cubes de Corsi).',
      'Échec convergent avec ép. 02 et 06 → profil de planification globale fragilisé, orienter vers neuropsy.',
    ],
    obsPlaceholder: 'Ex. trajet : suit l\'ordre de la liste, oublie le passage au labo, prend un sens interdit. Score 14/20. Temps 6 min (NSC 1, 70 ans → seuil 8 min).',
  },
]

const TRANCHE_AGE_OPTIONS: Array<{ key: '1' | '2' | '3' | '4' | '5'; label: string }> = [
  { key: '1', label: '1 — 18-49 ans' },
  { key: '2', label: '2 — 50-59 ans' },
  { key: '3', label: '3 — 60-69 ans' },
  { key: '4', label: '4 — 70-79 ans' },
  { key: '5', label: '5 — 80-90 ans' },
]

const NSC_OPTIONS: Array<{ key: '1' | '2' | '3'; label: string }> = [
  { key: '1', label: 'NSC 1 — scolarité 9-12 ans (CAP, Brevet, Cert. d\'études)' },
  { key: '2', label: 'NSC 2 — Bac à Bac+3' },
  { key: '3', label: 'NSC 3 — ≥ Bac+4 (haute réserve cognitive)' },
]

/** État d'une épreuve : scores par subtest, temps libre, zone, observation
 *  libre, liste des cases d'observation rapide cochées, toggle non passée. */
interface EpreuveState {
  scores: Record<string, string>
  temps: string
  zone: ZoneKey
  observation: string
  cochedQuickObs: string[]
  non_passee: boolean
}

interface State {
  trancheAge: TrancheAge
  nsc: Nsc
  epreuves: Record<EpreuveKey, EpreuveState>
}

function emptyEpreuveState(e: Epreuve): EpreuveState {
  const scores: Record<string, string> = {}
  for (const st of e.subtests) scores[st.key] = ''
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

export default function PrediFexScoresInput({ notes, onNotesChange, onResultatsChange }: Props) {
  const [state, setState] = useState<State>(emptyState)

  const totalSaisies = useMemo(() => {
    let n = 0
    for (const e of EPREUVES) {
      const st = state.epreuves[e.key]
      if (st.non_passee) continue
      const anyScore = e.subtests.some(s => st.scores[s.key]?.trim() !== '')
      if (anyScore || st.zone !== '' || st.observation.trim() !== '') n++
    }
    return n
  }, [state.epreuves])

  const zoneCounts = useMemo(() => {
    const c: Record<Exclude<ZoneKey, ''>, number> = { vert: 0, jaune: 0, orange: 0, rouge: 0 }
    for (const e of EPREUVES) {
      const st = state.epreuves[e.key]
      if (st.non_passee) continue
      if (st.zone) c[st.zone]++
    }
    return c
  }, [state.epreuves])

  /** Émet la string normalisée à chaque changement. Format lisible par
   *  l'IA générant le CRBO : bloc par épreuve avec score(s), temps, zone,
   *  observation. */
  useEffect(() => {
    if (totalSaisies === 0 && !state.trancheAge && !state.nsc) {
      onResultatsChange('')
      return
    }
    const lines: string[] = []
    lines.push('=== PrediFex — Protocole d\'évaluation et de dépistage des insuffisances des fonctions exécutives (Duchêne & Jaillard, HappyNeuron 2019) ===')
    if (state.trancheAge || state.nsc) {
      const trancheLabel = TRANCHE_AGE_OPTIONS.find(o => o.key === state.trancheAge)?.label || '(non précisée)'
      const nscLabel = NSC_OPTIONS.find(o => o.key === state.nsc)?.label || '(non précisé)'
      lines.push(`Stratification : ${trancheLabel} — ${nscLabel}`)
      lines.push('')
    }

    for (const e of EPREUVES) {
      const st = state.epreuves[e.key]
      // Épreuve explicitement non passée : ligne d'info à l'IA pour qu'elle
      // n'interprète pas l'absence comme un échec (aligné pattern PREDIMEM).
      if (st.non_passee) {
        lines.push(`--- Épreuve ${e.num} — ${e.label} ---`)
        lines.push('Non passée (passation écourtée / hypothèse clinique ciblée — ne pas interpréter).')
        lines.push('')
        continue
      }
      const anyScore = e.subtests.some(s => st.scores[s.key]?.trim() !== '')
      const hasQuickObs = (st.cochedQuickObs?.length ?? 0) > 0
      if (!anyScore && !st.zone && !st.observation.trim() && !st.temps.trim() && !hasQuickObs) continue

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
      // Combine textes des cases cochées + observation libre (aligné PREDIMEM).
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

    const tot = zoneCounts.vert + zoneCounts.jaune + zoneCounts.orange + zoneCounts.rouge
    if (tot > 0) {
      lines.push('--- Synthèse zones HappyNeuron (4 zones manuel PrediFex p. 17) ---')
      lines.push(`Vert (préservé, ≥ M − 1,5σ) : ${zoneCounts.vert}`)
      lines.push(`Jaune (seuil d'alerte, M−1,5σ à M−2σ) : ${zoneCounts.jaune}`)
      lines.push(`Orange (difficulté avérée, M−2σ à M−3σ) : ${zoneCounts.orange}`)
      lines.push(`Rouge (effondrement, < M−3σ) : ${zoneCounts.rouge}`)
    }

    onResultatsChange(lines.join('\n'))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, totalSaisies, zoneCounts])

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

  const setField = <K extends keyof EpreuveState>(epreuveKey: EpreuveKey, field: K, value: EpreuveState[K]) => {
    setState(s => ({
      ...s,
      epreuves: { ...s.epreuves, [epreuveKey]: { ...s.epreuves[epreuveKey], [field]: value } },
    }))
  }

  /** Toggle d'une case d'observation rapide — pattern aligné PREDIMEM. */
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

  // Index dans tempsAlerteMinParAge selon la tranche sélectionnée
  const ageIdx = state.trancheAge ? parseInt(state.trancheAge, 10) - 1 : -1

  // Alerte conditionnelle pour 5c (déclenché si 5a < 12 ou 5b < 14)
  const sub5a = parseInt(state.epreuves['e05_mise_a_jour'].scores['sub_5a_chiffres'] || '', 10)
  const sub5b = parseInt(state.epreuves['e05_mise_a_jour'].scores['sub_5b_syllabes'] || '', 10)
  const stroop5cIndique = (!isNaN(sub5a) && sub5a < 12) || (!isNaN(sub5b) && sub5b < 14)

  return (
    <div className="space-y-4">
      {/* Bandeau informatif PrediFex */}
      <div className="flex items-start gap-2 p-3 rounded-lg border border-indigo-200 bg-indigo-50">
        <Brain size={18} className="text-indigo-600 shrink-0 mt-0.5" />
        <div className="text-sm">
          <p className="font-semibold text-indigo-900">Saisie structurée PrediFex — 10 épreuves de fonctions exécutives</p>
          <p className="text-indigo-700 text-xs mt-0.5 leading-relaxed">
            Pour chaque épreuve, saisissez le score brut par subtest (validation /max), le temps, et reportez la{' '}
            <strong>zone HappyNeuron</strong> (4 zones — Vert / Jaune / Orange / Rouge — manuel p. 17) directement lue sur le logiciel.
            Seuil d&apos;alerte officiel : M − 1,5 σ. Population cible : adultes NSC 1 à 3. Cas d&apos;usage prototype :
            tests classiques normaux malgré plainte cognitive du sujet ou de l&apos;entourage (effet plafond), typique du NSC 3.
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
              onChange={(e) => setState(s => ({ ...s, trancheAge: e.target.value as TrancheAge }))}
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
              onChange={(e) => setState(s => ({ ...s, nsc: e.target.value as Nsc }))}
              className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            >
              <option value="">— choisir —</option>
              {NSC_OPTIONS.map(o => (
                <option key={o.key} value={o.key}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>
        {state.nsc === '1' && (
          <p className="text-[11px] text-amber-900 bg-amber-50 border border-amber-200 rounded px-2 py-1.5">
            <strong>NSC 1 — vigilance :</strong> l&apos;épreuve 09 Équivalences nécessite ≥ 10 ans de scolarité. Pour les
            sujets *sous-NSC 1* (&lt; 9 ans scolarité), l&apos;outil reste trop exigeant — préférer BREF, MoCA ou bilan neuropsy adapté.
            Privilégier l&apos;ép. 10 Itinéraire à la place de l&apos;ép. 09.
          </p>
        )}
        {state.nsc === '3' && (
          <p className="text-[11px] text-indigo-900 bg-indigo-50 border border-indigo-200 rounded px-2 py-1.5">
            <strong>NSC 3 — haute réserve cognitive :</strong> plafonnement attendu sur les ép. 02, 03, 06. Lire le{' '}
            <strong>TEMPS</strong> plutôt que le score (un score plafond avec temps {'>'}{' '} seuil = marqueur sub-clinique).
            L&apos;ép. 10 Itinéraire est peu sensible (à proposer en confirmation seulement).
          </p>
        )}
      </div>

      {/* Synthèse zones en bandeau */}
      {totalSaisies > 0 && (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
          <p className="text-xs font-semibold text-gray-700 mb-2">
            Répartition par zone — {totalSaisies}/10 épreuves saisies
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
            {totalSaisies > 0 && Object.values(zoneCounts).every(v => v === 0) && (
              <span className="text-xs text-gray-500 italic">
                Aucune zone HappyNeuron renseignée — pensez à reporter la zone affichée par le logiciel pour chaque épreuve.
              </span>
            )}
          </div>
        </div>
      )}

      {/* Cartes par épreuve (10) */}
      <div className="space-y-3">
        {EPREUVES.map(e => {
          const st = state.epreuves[e.key]
          const tempsAlerteMin =
            e.tempsAlerteMinParAge && ageIdx >= 0 && ageIdx < e.tempsAlerteMinParAge.length
              ? e.tempsAlerteMinParAge[ageIdx]
              : null

          // Alerte conditionnelle 5c (Stroop optionnel)
          const showStroop5cAlert = e.key === 'e05_mise_a_jour' && stroop5cIndique

          // Indicateur du matériel exact selon NSC (manuel) — affiché si NSC saisi.
          let nscMateriel: string | null = null
          if (state.nsc) {
            if (e.key === 'e01_fluences_alternees') {
              nscMateriel = state.nsc === '1'
                ? 'Catégories NSC 1 : Outils / Ustensiles de cuisine'
                : 'Catégories NSC 2 et 3 : Villes françaises / Pays étrangers'
            } else if (e.key === 'e02_texte_mettre_ordre') {
              const t = state.nsc === '1' ? 'Fanny' : state.nsc === '2' ? 'Voilier' : 'Molly'
              nscMateriel = `Texte NSC ${state.nsc} : ${t}`
            } else if (e.key === 'e03_textes_executifs') {
              const t3a = state.nsc === '1' ? 'Gallon (rép. n°4)' : state.nsc === '2' ? 'Serin (rép. n°3)' : 'Dépression (rép. n°3)'
              const t3b = state.nsc === '1' ? 'Dégât des eaux' : state.nsc === '2' ? 'Julie' : 'Jean'
              nscMateriel = `Textes NSC ${state.nsc} : 3a = ${t3a} ; 3b = ${t3b}`
            } else if (e.key === 'e06_probleme_arith') {
              const p = state.nsc === '1' ? 'La Voiture (essence, "26 L de trop")' : state.nsc === '2' ? 'Le Restaurant ("15 € le menu")' : 'La Fondue (600g / 600g / 300g)'
              nscMateriel = `Problème NSC ${state.nsc} : ${p}`
            } else if (e.key === 'e07_probleme_luria') {
              const p = state.nsc === '1' ? 'Léo (Q1 = 14 ans, Q2 = Non, Q3 = Oui, Q4 = Non)' : state.nsc === '2' ? 'Cédric & Diane' : 'Hélène'
              nscMateriel = `Problème NSC ${state.nsc} : ${p}`
            }
          }

          // Alerte conditionnelle ép. 09 — scolarité < 10 ans (NSC 1).
          const showEquivalencesAlert = e.key === 'e09_equivalences' && state.nsc === '1'

          return (
            <div key={e.key} className="rounded-lg border border-gray-200 bg-white p-4">
              <div className="flex items-start justify-between gap-3 flex-wrap mb-2">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-mono text-gray-400">Épreuve {e.num}</p>
                  <h4 className="text-sm font-semibold text-gray-900">{e.label}</h4>
                  <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{e.description}</p>
                  <p className="text-[10px] text-indigo-600 mt-0.5">Cible : {e.cible}</p>
                </div>
                <label className="text-xs text-gray-600 flex items-center gap-1.5 shrink-0">
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
                  {/* Banner matériel exact selon NSC (pour ép. 01, 02, 03, 06, 07) */}
                  {nscMateriel && (
                    <div className="mt-2 px-2 py-1.5 rounded bg-indigo-50 border border-indigo-100 text-[11px] text-indigo-800">
                      <span className="font-semibold">Matériel sélectionné par HappyNeuron :</span> {nscMateriel}
                    </div>
                  )}

                  {/* Alerte ép. 09 — scolarité < 10 ans (NSC 1) */}
                  {showEquivalencesAlert && (
                    <div className="mt-2 px-2 py-1.5 rounded bg-amber-50 border border-amber-200 text-[11px] text-amber-900">
                      <strong>NSC 1 → vérifier scolarité ≥ 10 ans</strong> avant de passer cette épreuve. Si scolarité &lt; 10 ans, renoncer à l&apos;ép. 09 (la scolarité prime sur l&apos;essai LUNES — manuel p. 75) et privilégier l&apos;ép. 10 Itinéraire.
                    </div>
                  )}

                  {/* Alerte 5c conditionnelle */}
                  {showStroop5cAlert && (
                    <div className="mt-2 px-2 py-1.5 rounded bg-amber-50 border border-amber-200 text-[11px] text-amber-900">
                      <strong>5a &lt; 12 ou 5b &lt; 14</strong> → le subtest <strong>5c Stroop lettres</strong> peut être proposé (analyse qualitative seulement, non comptabilisée).
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

                  {/* Temps + alerte conditionnelle âge */}
                  <div className="mt-3 flex items-center gap-2 flex-wrap">
                    <label className="text-xs font-medium text-gray-700 shrink-0">Temps :</label>
                    <input
                      type="text"
                      value={st.temps}
                      onChange={(ev) => setField(e.key, 'temps', ev.target.value)}
                      placeholder="Ex. 4 min 20"
                      className="flex-1 min-w-[120px] px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    />
                    {tempsAlerteMin !== null && (
                      <span className="inline-flex items-center gap-1 text-[11px] text-amber-800 bg-amber-50 border border-amber-200 rounded px-2 py-0.5">
                        <Clock size={11} /> Seuil d&apos;alerte ({TRANCHE_AGE_OPTIONS[ageIdx].label.split('—')[1]?.trim() || ''}) : {tempsAlerteMin} min
                      </span>
                    )}
                  </div>

                  {/* Zone HappyNeuron — 5 chips */}
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
                            onClick={() => setField(e.key, 'zone', active ? '' : z.key)}
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
                          onClick={() => setField(e.key, 'zone', '')}
                          className="text-[11px] text-gray-600 hover:text-gray-900 underline decoration-dotted px-2 py-1"
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

                  {/* Aide à l'interprétation (accordéon ambre) */}
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

                  {/* Observations rapides (cases pré-rédigées) — gain UX
                      passation. Pattern aligné PREDIMEM. */}
                  {e.quickObservations && e.quickObservations.length > 0 && (
                    <div className="mt-3">
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Observations rapides (cocher pour ajouter) :
                      </label>
                      <div className="flex flex-wrap gap-1.5">
                        {e.quickObservations.map(qo => {
                          const active = (st.cochedQuickObs ?? []).includes(qo.key)
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

                  {/* Observation libre (complément aux cases cochées si présentes) */}
                  <div className="mt-3">
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-medium text-gray-700">
                        {e.quickObservations && e.quickObservations.length > 0
                          ? 'Observation libre (complément aux cases cochées)'
                          : 'Observation clinique (stratégies, attitudes, types d\'erreurs)'}
                      </label>
                      <MicButton
                        value={st.observation}
                        onChange={(v) => setField(e.key, 'observation', v)}
                      />
                    </div>
                    <textarea
                      value={st.observation}
                      onChange={(ev) => setField(e.key, 'observation', ev.target.value)}
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
          placeholder="Ex. patient coopératif, lenteur d'exécution marquée sur les épreuves chronométrées, abandonne facilement sur les épreuves piégeantes, persévération sur la consigne initiale en flexibilité, fatigabilité notable en fin de protocole."
          className="w-full px-3 py-2 border border-gray-300 rounded text-sm leading-relaxed resize-y focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />
      </div>

      {/* Rappel règles cliniques */}
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
        <div className="flex items-start gap-2">
          <AlertCircle size={16} className="text-amber-700 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-900 leading-relaxed">
            <p className="font-semibold mb-1">Rappels cliniques PrediFex</p>
            <ul className="list-disc list-inside space-y-0.5">
              <li>PrediFex est un <strong>dépistage</strong>, jamais un diagnostic. Aucune étiologie nommée (Alzheimer, démence FT, MCI, syndrome dysexécutif fronto-sous-cortical, etc.).</li>
              <li>Ne pas conclure sur une <strong>épreuve isolée</strong> — croiser au moins 2-3 épreuves convergentes pour retenir une fragilité.</li>
              <li>Reporter les <strong>temps</strong> systématiquement : score normal en temps pathologique = marqueur sub-clinique majeur, surtout en NSC 3.</li>
              <li>Mentionner les <strong>domaines préservés en premier</strong>. Vocabulaire fonctionnel quotidien, jamais alarmant.</li>
              <li><strong>Sous-NSC 1</strong> (scolarité &lt; 9 ans) : ne pas faire passer PrediFex — préférer BREF, MoCA ou bilan neuropsy adapté. Ép. 09 Équivalences : nécessite ≥ 10 ans scolarité.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
