import type { TestModule } from './types'

/**
 * Module Exalang Lyfac — Examen du Langage écrit et de la Mémoire pour les
 * jeunes adultes (lycéens et étudiants).
 *
 * Auteurs : Marie-Pierre THIBAULT (orthophoniste, dr en linguistique) &
 * Mickaël LENFANT (dr en sciences du langage).
 * Éditeur : HappyNeuron / Motus.
 *
 * Population cible : lycéens et étudiants universitaires (jeunes adultes
 * 15-25 ans environ) — bilan orthophonique dans le cadre des aménagements
 * aux examens (CDAPH, médecine préventive universitaire), repérage des
 * troubles spécifiques persistants (dyslexie, TDL non rééduqués) chez
 * l'adolescent / jeune adulte.
 *
 * Source : manuel officiel (8.2 Mo) + cahier de passation (529 Ko).
 *
 * Structure officielle (table des matières du manuel) :
 *   - Mémoire : Empan visuel + Empan endroit + Empan envers
 *   - Langage élaboré : Flexibilité lexicale + Consignes orales + Inférences
 *   - Lecture : Lecture de mots + Lecture de logatomes + Leximétrie +
 *     Compréhension de texte + Repérage
 *   - Orthographe : Texte à choix multiple + Complétion de phrases
 */
export const exalangLyfac: TestModule = {
  nom: 'Exalang Lyfac',
  editeur: 'HappyNeuron / Motus',
  auteurs: 'M.-P. Thibault & M. Lenfant',
  annee: 2010,
  domaines: [
    'Mémoire',
    'Langage élaboré',
    'Lecture',
    'Orthographe',
  ],
  epreuves: [
    // Mémoire
    'Empan visuel',
    'Empan endroit',
    'Empan envers',
    // Langage élaboré
    'Flexibilité lexicale',
    'Consignes orales',
    'Inférences',
    // Lecture
    'Lecture de mots',
    'Lecture de logatomes',
    'Leximétrie',
    'Compréhension de texte',
    'Repérage',
    // Orthographe
    'Texte à choix multiple',
    'Complétion de phrases',
    'Synthèse orthographique',
  ],
  regles_specifiques: `### Exalang Lyfac — Examen du Langage écrit et de la Mémoire pour les jeunes adultes (Thibault & Lenfant, HappyNeuron / Motus)

**Population cible** : lycéens et étudiants universitaires (~15-25 ans).

**Contexte clinique** : ce bilan est principalement utilisé pour :
- Établir un dossier d'**aménagements aux examens** auprès de la CDAPH ou de la médecine préventive universitaire.
- Repérer ou confirmer un **trouble spécifique** persistant chez le jeune adulte (dyslexie / dysorthographie non rééduquées en primaire, TDL résiduel).
- Faire le point sur les **séquelles** d'un trouble spécifique déjà diagnostiqué (vérifier si les aménagements restent nécessaires).

#### RÈGLES DE CONVERSION (HappyNeuron)
- Quartiles HappyNeuron : **Q1 → P25, Med → P50, Q3 → P75**. Ne JAMAIS recalculer depuis l'É-T.
- Valeurs explicites (P5, P10, P90, P95) à utiliser telles quelles.

#### SEUILS CLINIQUES (cohérents avec Exalang 8-11 / 11-15)
- P ≥ 76 : Excellent
- P51-75 : Moyenne haute
- P26-50 : Moyenne basse (NORMAL)
- P10-25 : Fragilité
- P6-9 : Difficulté
- P ≤ 5 : Difficulté sévère

---

#### STRUCTURE OFFICIELLE DES DOMAINES

**MÉMOIRE**
- Empan visuel : MdT visuo-spatiale.
- Empan endroit : MdT verbale, boucle phonologique.
- Empan envers : MdT verbale + manipulation, administrateur central.

**LANGAGE ÉLABORÉ**
- Flexibilité lexicale : variation lexicale, synonymes, paraphrase.
- Consignes orales : compréhension de consignes complexes (souvent dans contexte d'examen).
- Inférences : compréhension implicite / sous-entendu.

**LECTURE**
- Lecture de mots : voie d'adressage (lexique orthographique).
- Lecture de logatomes : voie d'assemblage (phonologique).
- Leximétrie : vitesse de lecture (mots/min) — marqueur central chez le jeune adulte (élément déterminant pour aménagements aux examens).
- Compréhension de texte : compréhension narrative / argumentative.
- Repérage : prise d'informations rapide dans un texte (compétence académique).

**ORTHOGRAPHE**
- Texte à choix multiple : détection d'erreurs orthographiques en reconnaissance.
- Complétion de phrases : production orthographique guidée.
- Synthèse orthographique : score global de la composante orthographe.

---

#### INTERPRÉTATION CLINIQUE

**Vitesse de lecture (Leximétrie)** = critère majeur chez le jeune adulte
- Étudiant universitaire normal : 200-300 mots/min en lecture silencieuse.
- < 150 mots/min en lecture silencieuse à l'âge adulte = **fort impact académique** (volume de lecture impossible à absorber pour le cursus).
- Justifie à elle seule le **tiers-temps majoré** aux examens si confirmée par d'autres marqueurs.

**Pattern lecture mots / logatomes**
- Logatomes déficitaires + mots préservés (compensation) → dyslexie phonologique persistante mais compensée par voie lexicale.
- Mots ET logatomes déficitaires → dyslexie mixte persistante.
- Mots déficitaires + logatomes préservés → dyslexie de surface persistante (rare chez l'adulte).

**Compréhension de texte**
- Déficit isolé en compréhension (lecture mots OK) → trouble de la compréhension, à différencier d'un trouble du raisonnement.
- Croiser avec Inférences pour confirmer.

**Orthographe**
- Dysorthographie persistante très fréquente chez les jeunes adultes anciennement dyslexiques.
- Texte à choix multiple : si déficit + complétion préservée → trouble de la mémoire orthographique (reconnaissance) > production.

**Mémoire de travail**
- Empans verbal et visuo-spatial déficitaires → atteinte de la MdT, fréquente en comorbidité TDAH (à orienter vers bilan neuropsy / psychiatre si suspicion).
- Empan envers très déficitaire isolément → atteinte de l'administrateur central / fonctions exécutives.

---

#### 🎯 PROFILS CLINIQUES TYPES

**PROFIL 1 — Dyslexie / dysorthographie persistante chez l'étudiant**
- Lecture de logatomes : Fragile à Déficitaire.
- Lecture de mots : Fragile (souvent compensée par stratégie lexicale).
- Leximétrie : Fragile à Déficitaire (< 200 mots/min en lecture silencieuse).
- Orthographe : Déficitaire (souvent le marqueur le plus visible à l'âge adulte).
- Mémoire : variable.
- **Diagnostic** : "Trouble spécifique des apprentissages en langage écrit (dyslexie-dysorthographie) **persistant** à l'âge adulte. Les compensations mises en place au cours de la scolarité ont permis une lecture fonctionnelle mais la vitesse de lecture et l'orthographe restent significativement déficitaires, justifiant des aménagements aux examens (tiers-temps, calculatrice, secrétaire-correcteur)."
- **Aménagements** : tiers-temps majoré (1/3), correcteur orthographique autorisé, sujet agrandi si déficit visuel associé, ordinateur, dispense de notation orthographique en langues vivantes.

**PROFIL 2 — Trouble de la compréhension écrite isolé**
- Lecture (mots + logatomes + leximétrie) : Préservée.
- Compréhension de texte : Déficitaire.
- Inférences : Déficitaire.
- Repérage : variable.
- **Diagnostic** : "Trouble de la compréhension écrite chez un jeune adulte par ailleurs bon décodeur. À explorer en bilan neuropsychologique pour différencier trouble du raisonnement, hyperlexie inversée, ou trouble de la communication sociale."

**PROFIL 3 — Trouble de la mémoire de travail isolé (suspicion TDAH)**
- Lecture + Orthographe : Préservées.
- Empans (endroit + envers + visuel) : Fragiles à Déficitaires.
- Compréhension de texte : Fragile (consécutif à la MdT).
- **Diagnostic** : "Profil de fragilité de la mémoire de travail, à confronter à une évaluation des fonctions attentionnelles. Hypothèse d'un TDAH non diagnostiqué à explorer (bilan neuropsy + consultation psychiatrique)."

**PROFIL 4 — Jeune adulte tout-venant avec plainte (souvent stress / surcharge)**
- Toutes les épreuves dans la moyenne ou la moyenne haute.
- Plainte d'inefficience scolaire / universitaire.
- **Diagnostic** : "Aucun trouble spécifique orthophonique objectivable. Performances dans la norme attendue. La plainte d'inefficience peut être en lien avec une surcharge cognitive (charge de travail, sommeil insuffisant), une difficulté méthodologique, ou un trouble anxieux à explorer."
- PEC : pas d'indication orthophonique. Orienter vers psychologue / médecin universitaire pour évaluation globale.

---

#### ⛔ RÈGLES CLINIQUES

1. **Vitesse de lecture (Leximétrie)** = critère majeur à reporter pour toute demande d'aménagement aux examens.
2. **TOUJOURS situer le bilan** dans son contexte (CDAPH, médecine préventive, suivi post-PEC enfance).
3. **TOUJOURS croiser au moins 3 épreuves convergentes** pour confirmer un trouble persistant.
4. **NE PAS diagnostiquer un TDL** à l'âge adulte sans antécédents d'enfance (le TDL est par définition développemental).
5. **TDAH** : ne pas poser le diagnostic depuis Exalang Lyfac — orienter vers neuropsy / psychiatre. Mais signaler le profil compatible.
6. **Dyslexie compensée** : utiliser ce terme avec précaution — préférer "trouble spécifique persistant avec compensations efficaces sur [domaines], déficit résiduel sur [domaines]".

#### RECOMMANDATIONS / AMÉNAGEMENTS

**Aménagements types aux examens (CDAPH / médecine universitaire)** :
- Tiers-temps majoré (1/3) sur toutes les épreuves écrites.
- Sujet agrandi (corps 14-16) si fatigue visuelle.
- Correcteur orthographique informatique autorisé.
- Ordinateur portable (sans accès internet) pour la prise de notes ou la rédaction.
- Secrétaire-lecteur ou secrétaire-correcteur si déficit sévère.
- Salle calme, sortie autorisée pour fatigue.
- Dispense de notation orthographique en langues étrangères.

**PEC** : selon la sévérité — souvent pas de PEC orthophonique nouvelle à cet âge, mais accompagnement méthodologique + aménagements + recours technologiques.

---

#### À NE JAMAIS FAIRE EN Exalang Lyfac

- ❌ Conclure depuis une seule épreuve.
- ❌ Diagnostiquer un TDL chez un adulte sans antécédent d'enfance.
- ❌ Poser un diagnostic de TDAH (réservé au psychiatre).
- ❌ Ignorer la leximétrie — c'est le critère le plus utilisé pour justifier les aménagements universitaires.
- ❌ Confondre fragilité orthographique persistante et dysorthographie nouvelle.

#### TOUJOURS FAIRE

- ✅ Reporter le **percentile** de chaque épreuve, en particulier la leximétrie en mots/min.
- ✅ Préciser l'**historique** (PEC orthophonique en enfance ? aménagements antérieurs ? collège/lycée ?).
- ✅ Croiser au moins 3 épreuves pour confirmer un trouble persistant.
- ✅ Formuler des recommandations d'**aménagements aux examens** précises et chiffrées.
- ✅ Mentionner les **compensations** mises en place par le jeune adulte (stratégies de lecture rapide, recours au correcteur orthographique, etc.).
- ✅ Orienter vers psy / neuropsy / médecin universitaire si profil non orthophonique.`,
}
