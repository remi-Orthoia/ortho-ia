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

/** Zone HappyNeuron officielle (5 paliers σ). Reportée par l'ortho depuis
 *  son écran HappyNeuron (source de vérité pour le seuil d'alerte
 *  stratifié âge × NSC). */
type ZoneKey = '' | 'vert_fonce' | 'vert_clair' | 'jaune' | 'orange' | 'rouge'

const ZONES: Array<{ key: Exclude<ZoneKey, ''>; label: string; sigma: string; chipBg: string; chipText: string; chipRing: string }> = [
  { key: 'vert_fonce', label: 'Vert foncé', sigma: '≥ moyenne', chipBg: 'bg-emerald-600', chipText: 'text-white',     chipRing: 'ring-emerald-700' },
  { key: 'vert_clair', label: 'Vert clair', sigma: 'M−1σ à M−1,5σ', chipBg: 'bg-emerald-300', chipText: 'text-emerald-900', chipRing: 'ring-emerald-500' },
  { key: 'jaune',      label: 'Jaune',      sigma: 'M−1,5σ à M−2σ (seuil d\'alerte)', chipBg: 'bg-amber-300',   chipText: 'text-amber-900',   chipRing: 'ring-amber-500' },
  { key: 'orange',     label: 'Orange',     sigma: 'M−2σ à M−3σ',  chipBg: 'bg-orange-500', chipText: 'text-white',     chipRing: 'ring-orange-600' },
  { key: 'rouge',      label: 'Rouge',      sigma: '< M−3σ (effondrement)', chipBg: 'bg-red-600',    chipText: 'text-white',     chipRing: 'ring-red-700' },
]

const ZONE_LABEL_CLINIQUE: Record<Exclude<ZoneKey, ''>, string> = {
  vert_fonce:  'performance préservée',
  vert_clair:  'performance dans la moyenne basse, à surveiller',
  jaune:       'fragilité objectivée (seuil d\'alerte)',
  orange:      'difficulté avérée',
  rouge:       'effondrement',
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
}

const EPREUVES: Epreuve[] = [
  {
    key: 'e01_fluences_alternees',
    num: '01',
    label: 'Fluences alternées',
    description: 'Production alternée de mots entre deux catégories (ex. fruit / animal). Chrono fixe 1 min. Mesure la flexibilité mentale et l\'inhibition d\'une réponse automatique catégorielle.',
    cible: 'Flexibilité + inhibition',
    subtests: [
      { key: 'score', label: 'Score total', max: 30, hint: '1 pt par mot correct (plafond 30). 2 mots de la même catégorie à la suite = 1 pt seulement.' },
    ],
    rules: [
      'Consigne : alterner strictement entre les deux catégories pendant 1 min.',
      '1 pt par mot correct, plafond 30. Pas de malus pour erreurs.',
      'Si le sujet donne 2 mots de la même catégorie consécutifs, on ne compte que 1 pt (l\'alternance est rompue).',
      'Persévérations, mots hors catégorie, paraphrases : noter qualitativement.',
    ],
    interpretation: [
      'Score abaissé + persévérations sur la 1ère catégorie → fragilité de FLEXIBILITÉ (résistance au switch).',
      'Score abaissé sans persévération + lenteur d\'évocation → croiser avec PREDILAC / fluences classiques (peut-être déficit lexical sous-jacent).',
      'À croiser avec épreuves 04 (Une syllabe sur deux) et 09 (Équivalences) pour confirmer un profil flexibilité.',
    ],
    obsPlaceholder: 'Ex. 18 mots en 1 min. 4 persévérations sur la catégorie « fruits » en début. Reprend après recadrage. Pas d\'erreur catégorielle.',
  },
  {
    key: 'e02_texte_mettre_ordre',
    num: '02',
    label: 'Texte à mettre en ordre',
    description: 'Réorganiser des segments de texte présentés en désordre pour reconstituer un récit cohérent. Planification + cohérence textuelle + MdT.',
    cible: 'Planification + MdT',
    subtests: [
      { key: 'score', label: 'Score total', max: 12, hint: '−2 pt / segment mal placé sans casser la cohérence, −4 pt si casse la cohérence, −3 pt si aide examinateur.' },
    ],
    tempsAlerteMinParAge: [4, 5, 7, 11, 18],
    rules: [
      'Présentation des segments en désordre, sujet réorganise sur écran ou papier.',
      'Cotation : départ /12. −2 pt par segment mal placé sans rupture de cohérence, −4 pt si rupture de cohérence, −3 pt si aide.',
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
    description: 'Compréhension de texte exigeante en attention soutenue, inhibition de distracteurs, inférences. 3a = choix du résumé, 3b = ordre des événements (l\'ordre du récit ≠ l\'ordre réel des faits).',
    cible: 'Attention + inhibition + inférences',
    subtests: [
      { key: 'resume',  label: '3a Choix du résumé', max: 4, hint: '4 pt bonne réponse OU 0 pt (tout ou rien). Distracteur phonétiquement proche piège la voie superficielle.' },
      { key: 'ordre',   label: '3b Ordre des événements', max: 6, hint: '−1 pt / épisode mal placé, −2 pt sur les épisodes à astérisque (plus exécutifs), −3 pt si aide.' },
    ],
    tempsAlerteMinParAge: [5, 6, 8, 10, 15],
    rules: [
      '3a (résumé) : choisir parmi des résumés candidats — un seul correct sémantiquement, les autres pièges (phonétique, partiel, hors-sujet).',
      '3b (ordre) : reclasser les épisodes du récit dans l\'ordre RÉEL des faits (≠ ordre narratif du texte qui mélange flashbacks / anticipations).',
      'Cotation 3a : 4 pt si bon résumé d\'emblée, 0 sinon.',
      'Cotation 3b : −1 pt par épisode mal placé (−2 pt sur épisodes à astérisque, plus exigeants), −3 pt si aide examinateur.',
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
    description: 'Dire à voix haute une syllabe sur deux dans des mots de 2/3/4 syllabes. Inhibition + flexibilité (résister à la prononciation entière du mot).',
    cible: 'Inhibition + flexibilité',
    subtests: [
      { key: 'mots_2syl', label: 'Mots 2 syllabes', max: 8,  hint: '4 pt par mot correct. Arrêt après 2 items échoués.' },
      { key: 'mots_3syl', label: 'Mots 3 syllabes', max: 18, hint: '6 pt par mot correct.' },
      { key: 'mots_4syl', label: 'Mots 4 syllabes', max: 16, hint: '8 pt par mot correct.' },
    ],
    rules: [
      'Le sujet entend un mot et doit dire une syllabe sur deux (ex. « bateau » → « ba » ou « teau » selon consigne d\'amorçage).',
      'Cotation : 4 pt mot 2 syllabes, 6 pt mot 3 syllabes, 8 pt mot 4 syllabes.',
      'Pénalité : −2 pt par répétition audio demandée par le sujet.',
      'Arrêt : après 2 items consécutivement échoués dans une catégorie.',
      'Pas de seuil temps officiel (variabilité trop élevée).',
    ],
    interpretation: [
      'Erreur type : le sujet compose un mot avec 2 syllabes successives (au lieu d\'1 sur 2) = défaut d\'inhibition de l\'autre syllabe.',
      'Effondrement sur les mots 3-4 syllabes uniquement = surcharge MdT phonologique (croiser avec ép. 05 et empan envers).',
      'Échec dès les mots 2 syllabes = fragilité majeure d\'inhibition (croiser avec ép. 07 et 09).',
    ],
    obsPlaceholder: 'Ex. mots 2 syl OK (8/8). Mots 3 syl : 12/18, dit le mot entier puis se reprend sur 3 items. Mots 4 syl : 8/16, demande répétition 2×.',
  },
  {
    key: 'e05_mise_a_jour',
    num: '05',
    label: 'Mise à jour',
    description: 'Suivre la dernière information dans une suite (chiffres, syllabes). Le sujet doit oublier les éléments précédents et ne garder que les N derniers — c\'est la mise à jour de la MdT.',
    cible: 'Mise à jour MdT',
    subtests: [
      { key: 'sub_5a_chiffres', label: '5a Chiffres', max: 21, hint: '3 pt par série de 7 chiffres correctement maintenue. −1 pt par chiffre manquant.' },
      { key: 'sub_5b_syllabes', label: '5b Syllabes', max: 24, hint: '3 pt par série de 8 syllabes correctement maintenue.' },
      { key: 'sub_5c_stroop',   label: '5c Stroop lettres (OPTIONNEL)', max: 32, hint: 'Déclenché UNIQUEMENT si 5a < 12 OU 5b < 14. NON comptabilisé — analyse qualitative seulement.' },
    ],
    rules: [
      '5a : on dicte une suite de chiffres ; le sujet doit restituer les N derniers (mise à jour permanente).',
      '5b : même principe sur des syllabes (charge phonologique plus lourde).',
      '5c (optionnel) : variante Stroop sur lettres colorées — DÉCLENCHÉ uniquement si 5a < 12 ou 5b < 14, ou en cas d\'abandon. Score qualitatif uniquement, NON comptabilisé.',
      'Cotation : 3 pt par série correctement maintenue ; −1 pt par chiffre/syllabe manquant.',
      'Pas de seuil temps officiel (auto).',
    ],
    interpretation: [
      '5a échoué + 5b OK → fragilité numérique spécifique (rare ; croiser avec ép. 06).',
      '5b nettement plus faible que 5a → surcharge phonologique de la MdT.',
      'Échec parallèle 5a + 5b → fragilité de mise à jour pure (administrateur central), croiser avec ép. 06 (Pb arith) et empan envers classique.',
      'Erreur type : le sujet répète plus de N chiffres « au cas où » = défaut de mise à jour (ne libère pas les anciens).',
    ],
    obsPlaceholder: 'Ex. 5a : 18/21, perd 1 chiffre sur les 2 dernières séries. 5b : 16/24, échec sur les séries longues, fatigue audible. 5c non passé (5a et 5b au-dessus du seuil).',
  },
  {
    key: 'e06_probleme_arith',
    num: '06',
    label: 'Problème arithmétique',
    description: 'Résolution de problèmes à énoncé verbal. Planification + MdT en numérique. Le calcul lui-même est secondaire — c\'est la lecture/mémorisation/structuration de l\'énoncé qui charge la fonction exécutive.',
    cible: 'Planification numérique',
    subtests: [
      { key: 'raisonnement', label: 'Raisonnement', max: 6, hint: '−2 pt par erreur de raisonnement ou omission d\'info de l\'énoncé.' },
      { key: 'calcul',       label: 'Calcul',       max: 4, hint: 'Calcul correct seul vaut ces 4 pts.' },
    ],
    tempsAlerteMinParAge: [5, 6, 6, 8, 16],
    rules: [
      'Cotation décomposée : 6 pt pour le raisonnement (lecture + structuration + ordre des opérations) + 4 pt pour le calcul.',
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
    description: 'Raisonnement abstrait avec énoncé piégeant — inhibition de la réponse intuitive en faveur d\'une analyse logique. Le piège classique : « avoir X ans de plus que » déclenche un + au lieu d\'un −.',
    cible: 'Raisonnement + inhibition',
    subtests: [
      { key: 'q1', label: 'Question 1', max: 4 },
      { key: 'q2', label: 'Question 2', max: 2 },
      { key: 'q3', label: 'Question 3', max: 2 },
      { key: 'q4', label: 'Question 4', max: 2 },
    ],
    tempsAlerteMinParAge: [5, 6, 7, 9, 18],
    rules: [
      '4 questions à difficulté croissante. Q1 = 4 pt, Q2 / Q3 / Q4 = 2 pt chacune. Max 10 pt.',
      'Malus : −3 pt si aide examinateur (reformulation de l\'énoncé).',
      'Piège classique : « avoir X ans de plus que » fait penser à une addition, alors qu\'il faut soustraire. Observer si le sujet tombe dans le piège et se reprend, ou ne se reprend pas.',
    ],
    interpretation: [
      'Échec Q1 (la plus facile) → fragilité majeure d\'analyse logique ou de compréhension d\'énoncé.',
      'Échec Q2-Q4 avec Q1 OK → fragilité progressive sous charge.',
      'Réponse intuitive systématiquement maintenue malgré l\'erreur signalée → fragilité d\'inhibition (croiser avec ép. 04 et 09).',
      'À croiser avec ép. 09 (Équivalences) pour profil de raisonnement abstrait.',
    ],
    obsPlaceholder: 'Ex. Q1 réussie d\'emblée. Q2 : tombe dans le piège « plus que » → additionne. Se reprend après reformulation. Q3 et Q4 échouées. Score 4+0+0+0 = 4/10.',
  },
  {
    key: 'e08_sudofex',
    num: '08',
    label: 'Sudofex',
    description: 'Type sudoku adapté (contenu + couleur). Essai d\'entraînement MIREILLE obligatoire, puis l\'examinateur choisit la grille (Annick / Marie / Guillaume) selon la maîtrise — seule la MEILLEURE grille compte.',
    cible: 'Inhibition + raisonnement logique en grille',
    subtests: [
      { key: 'grille_annick',    label: 'Grille Annick (facile)',  max: 8,  hint: 'Niveau d\'entrée — choisi si MIREILLE difficile.' },
      { key: 'grille_marie',     label: 'Grille Marie (moyen)',    max: 16, hint: 'Effet Stroop : nom de couleur écrit ≠ couleur du stylo.' },
      { key: 'grille_guillaume', label: 'Grille Guillaume (difficile)', max: 22, hint: 'Le plus exigeant — seul le score de la MEILLEURE grille comptabilisée est rapporté.' },
    ],
    tempsAlerteMinParAge: [7, 8, 9, 15, 30],
    rules: [
      'Essai MIREILLE obligatoire (non scoré) pour vérifier la compréhension de la consigne.',
      'Selon la maîtrise, l\'examinateur propose UNE des 3 grilles : Annick (facile, /8), Marie (moyenne, /16) ou Guillaume (difficile, /22).',
      'Cotation : 1-2 pt par case (contenu + couleur scorés séparément).',
      'Aide examinateur : −3 pt si aide partielle, −6 pt si aide majeure.',
      '⚠️ Reporter le score de la grille effectivement réalisée — c\'est le score qui apparaît dans le logiciel.',
      'Score chiffré à prendre AVEC PRÉCAUTION chez NSC 3 — toujours coupler analyse qualitative.',
    ],
    interpretation: [
      'Le sujet confond couleur du stylo et nom de couleur écrit → effet Stroop = défaut d\'inhibition (croiser avec ép. 04 et 07).',
      'Échec après MIREILLE (donc grille Annick non tentée ou ratée) → fragilité majeure de raisonnement en grille, orientation vers neuropsy.',
      'Réussite Guillaume avec temps > seuil → marqueur sub-clinique pour NSC 3.',
      'Croiser avec ép. 09 et 10 pour profil de raisonnement / planification globale.',
    ],
    obsPlaceholder: 'Ex. MIREILLE OK. Grille Marie choisie : 14/16, 1 erreur de couleur sur la dernière ligne (effet Stroop). Temps 9 min (NSC 3, 55 ans → > seuil 8 min).',
  },
  {
    key: 'e09_equivalences',
    num: '09',
    label: 'Équivalences',
    description: 'Raisonnement analogique + inhibition. Essai LUNES obligatoire, puis 4 subtests à difficulté croissante (Formes / Feux / Étoiles / Flèches). Seul le MEILLEUR subtest compte. Nécessite ≥ 10 ans de scolarité.',
    cible: 'Raisonnement analogique',
    subtests: [
      { key: 'sub_formes',  label: 'Formes (facile)',     max: 8,  hint: '2 pt / item.' },
      { key: 'sub_feux',    label: 'Feux',                max: 12, hint: '2-3 pt / item.' },
      { key: 'sub_etoiles', label: 'Étoiles',             max: 18, hint: '2-3 pt / item.' },
      { key: 'sub_fleches', label: 'Flèches (difficile)', max: 20, hint: 'Le plus exigeant — seul le score du MEILLEUR subtest est comptabilisé.' },
    ],
    tempsAlerteMinParAge: [5, 6, 8, 10, 20],
    rules: [
      'Essai LUNES obligatoire pour vérifier la compréhension. Si LUNES non compris → RENONCER à l\'épreuve (orienter vers ép. 10 Itinéraire).',
      'Puis 4 subtests à difficulté croissante : Formes (/8) → Feux (/12) → Étoiles (/18) → Flèches (/20).',
      'Cotation : 2-3 pt par item selon le subtest. Aide examinateur : −3 pt si partielle, −6 pt si majeure.',
      '⚠️ Nécessite ≥ 10 ans de scolarité. Pour les NSC 1 avec moins, sauter et proposer l\'ép. 10 Itinéraire.',
      'Score chiffré à prendre AVEC PRÉCAUTION chez NSC 3 — toujours coupler analyse qualitative.',
    ],
    interpretation: [
      'Sujet bloque sur l\'abstraction des prémisses, ne peut raisonner sans valeurs concrètes → fragilité d\'abstraction (croiser avec ép. 07 et 08).',
      'Réussit Formes et Feux mais effondre sur Étoiles / Flèches → effet de complexité normal, à pondérer selon NSC.',
      'Réussit le subtest le plus dur sans aide → flexibilité analogique préservée, profil exécutif robuste.',
    ],
    obsPlaceholder: 'Ex. LUNES OK. Formes 8/8 facile. Feux 10/12 (1 hésitation). Étoiles 12/18, bloque sur les analogies les plus abstraites. Flèches non tenté (échec annoncé).',
  },
  {
    key: 'e10_itineraire',
    num: '10',
    label: 'Itinéraire',
    description: 'Planification spatiale + MdT visuo-spatiale. Élaborer un trajet pour rendre visite à plusieurs patients en respectant les contraintes (sens interdits, passage obligé à l\'école et au labo). Ciblée NSC 1 (alternative à l\'ép. 09) et NSC 3 en confirmation.',
    cible: 'Planification spatiale',
    subtests: [
      { key: 'score', label: 'Score total', max: 20, hint: '2 pt par consigne respectée (passages obligés, sens interdits, ordre logique).' },
    ],
    tempsAlerteMinParAge: [6, 6, 7, 8, 10],
    rules: [
      'Le sujet doit dessiner un trajet sur une carte pour visiter plusieurs patients, en respectant les passages obligés (école, labo) et les sens interdits.',
      'Cotation : 2 pt par consigne respectée (max 20 pt).',
      'Malus libre selon l\'aide apportée et la longueur excessive du trajet.',
      '⚠️ Peu sensible chez NSC 3 (compensation par réserve cognitive) — à proposer en CONFIRMATION seulement chez NSC 3 avec déficits ailleurs.',
      'Particulièrement utile chez NSC 1 incapables de faire l\'ép. 09 Équivalences.',
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

/** État d'une épreuve : scores par subtest, temps libre, zone, observation,
 *  toggle non passée. */
interface EpreuveState {
  scores: Record<string, string>
  temps: string
  zone: ZoneKey
  observation: string
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
  return { scores, temps: '', zone: '', observation: '', non_passee: false }
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
    const c: Record<Exclude<ZoneKey, ''>, number> = { vert_fonce: 0, vert_clair: 0, jaune: 0, orange: 0, rouge: 0 }
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
      if (st.non_passee) continue
      const anyScore = e.subtests.some(s => st.scores[s.key]?.trim() !== '')
      if (!anyScore && !st.zone && !st.observation.trim() && !st.temps.trim()) continue

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
      if (obs) lines.push(`Observation : ${obs}`)
      lines.push('')
    }

    const tot = zoneCounts.vert_fonce + zoneCounts.vert_clair + zoneCounts.jaune + zoneCounts.orange + zoneCounts.rouge
    if (tot > 0) {
      lines.push('--- Synthèse zones HappyNeuron ---')
      lines.push(`Vert foncé (préservé) : ${zoneCounts.vert_fonce}`)
      lines.push(`Vert clair (moyenne basse) : ${zoneCounts.vert_clair}`)
      lines.push(`Jaune (seuil d'alerte) : ${zoneCounts.jaune}`)
      lines.push(`Orange (difficulté avérée) : ${zoneCounts.orange}`)
      lines.push(`Rouge (effondrement) : ${zoneCounts.rouge}`)
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
            <strong>zone HappyNeuron</strong> (5 couleurs) directement lue sur le logiciel. Seuil d&apos;alerte officiel : M − 1,5 σ.
            Population cible : adultes NSC 1 à 3. Cas d&apos;usage prototype : plainte cognitive subjective avec MMS=30 et bilans
            neuropsy classiques normaux (effet plafond), typique du NSC 3.
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

                  {/* Observation */}
                  <div className="mt-3">
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-medium text-gray-700">
                        Observation clinique (stratégies, attitudes, types d&apos;erreurs)
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
