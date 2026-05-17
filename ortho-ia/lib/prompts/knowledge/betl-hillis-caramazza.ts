/**
 * Modèle théorique BETL : adaptation du modèle de Caramazza & Hillis (1990)
 * pour l'analyse des troubles lexicaux.
 *
 * Source : Manuel officiel BETL — Tran T.M. (Ortho Édition 2015), section
 * "Contexte théorique" pages 8-10, "Logique d'utilisation" pages 11-12,
 * "Profils en fonction des pathologies" pages 24+.
 *
 * Demande Laurie : "Pour la rédaction des conclusions BETL, se baser
 * surtout sur le schéma d'Hillis et Caramazza présents dans le manuel BETL".
 *
 * À injecter dans le system prompt quand BETL est sélectionné. La logique
 * en 3 étapes (lexico-sémantique vs lexico-phonologique vs accès) doit
 * structurer le diagnostic et le commentaire des dissociations entre
 * épreuves.
 */

export const BETL_HILLIS_CARAMAZZA = `## Modèle de référence BETL — Caramazza & Hillis (1990) adapté

Source officielle : Manuel BETL (T.M. Tran, Ortho Édition 2015).

Le modèle théorique de référence de la BETL est une adaptation du modèle de
Caramazza et Hillis (1990), qui rend compte des principales tâches lexicales
utilisées au cours des évaluations orthophoniques (dénomination d'images,
répétition, lecture à voix haute, écriture sous dictée de mots).

⚠️ **Pour la rédaction des conclusions BETL, ce schéma DOIT être la grille
de lecture principale** — c'est la demande explicite Laurie. Toutes les
dissociations observées entre épreuves doivent être interprétées en référence
à ce modèle.

---

### Schéma I — Modèle des traitements lexicaux BETL

\`\`\`
Entrées :    Mot lu           Image           Mot entendu
              │                  │                  │
              ▼                  ▼                  ▼
       ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
       │   Lexique    │  │   Système    │  │   Lexique    │
       │ orthographique│ │  pictogène   │  │ phonologique │
       │   d'entrée   │  │              │  │   d'entrée   │
       └──────┬───────┘  └──────┬───────┘  └──────┬───────┘
              │                  │                  │
              └──────────────────┼──────────────────┘
                                 │
                                 ▼
                        ┌────────────────┐
                        │    Système     │
                        │   sémantique   │
                        └────────┬───────┘
                                 │
              ┌──────────────────┼──────────────────┐
              │                                     │
              ▼                                     ▼
       ┌──────────────┐                     ┌──────────────┐
       │   Lexique    │                     │   Lexique    │
       │ phonologique │                     │ orthographique│
       │  de sortie   │                     │  de sortie   │
       └──────┬───────┘                     └──────┬───────┘
              │                                     │
              ▼                                     ▼
Sorties :  Mot oral / Image désignée /     Mot écrit / Mot écrit désigné
\`\`\`

**Postulat de modularité** (Seron 2002) : le système lexical est un ensemble
de composants autonomes interconnectés. Les représentations lexicales
(sémantiques, phonologiques, orthographiques) et non lexicales (imagées)
sont stockées à long terme de façon spécifique dans chacun des composants.

---

### Correspondance épreuves BETL ↔ Composants du modèle

| Épreuve BETL | Entrée | Sortie | Composants mobilisés |
|--------------|--------|--------|----------------------|
| 1. Dénomination orale d'images | Imagée | Orale | Système pictogène → sémantique → lex. phonologique sortie |
| 2. Dénomination écrite d'images | Imagée | Écrite | Système pictogène → sémantique → lex. orthographique sortie |
| 3. Lecture à voix haute | Écrite | Orale | Lex. orthographique entrée → (sémantique) → lex. phonologique sortie |
| 4. Désignation d'images (mot entendu) | Orale | Imagée désignée | Lex. phonologique entrée → sémantique → système pictogène |
| 5. Désignation de mots écrits (mot entendu) | Orale | Écrite désignée | Lex. phonologique entrée → sémantique → lex. orthographique entrée |
| 6. Appariement sémantique d'images | Imagée | Imagée | Système pictogène → sémantique (2 entrées) |
| 7. Appariement sémantique de mots écrits | Écrite | Écrite | Lex. orthographique entrée → sémantique (2 entrées) |
| 8. Questionnaire sémantique | Orale | Orale | Lex. phonologique entrée → sémantique |

**Logique de comparaison inter-tâches** : pour identifier un **composant
atteint**, on confronte des épreuves qui partagent CERTAINS composants et
DIFFÈRENT par d'autres. Le matériel BETL est volontairement le MÊME (54 items)
à travers les épreuves, contrôlé en fréquence, longueur, catégorie sémantique
et régularité orthographique, ce qui permet ces comparaisons fines.

---

### Logique diagnostique en 3 étapes (manuel BETL pp. 11-12)

#### **Étape 1 — Modalité orale + imagée** (3 premières épreuves)

Comparer **Dénomination orale d'images** + **Désignation d'images** +
**Appariement sémantique d'images**.

- **Atteinte ≥ 2 / 3 de ces épreuves** → suspicion d'un **trouble
  lexico-sémantique** (atteinte du système sémantique ou de l'accès à ce
  système, indépendamment de la modalité).
- **Atteinte isolée de la dénomination orale d'images** → suspicion d'un
  **trouble lexico-phonologique** (atteinte spécifique du lexique
  phonologique de sortie, sémantique préservée).

#### **Étape 2 — Modalité écrite** (confirmation et caractérisation)

But : (1) confirmer / caractériser l'atteinte lexico-sémantique ET
(2) apprécier les possibilités de compensation entre modalités.

- **Atteinte isolée de la lecture à voix haute** → trouble du **traitement
  phonologique** et de la **transposition visuo-phonatoire** → confirme
  hypothèse trouble lexico-phonologique.
  - **Précision (note bas de page manuel)** : si lecture à voix haute préservée +
    production possible du mot-cible après ébauche orale → **trouble d'accès
    au lexique phonologique** envisageable.
  - À l'inverse, ébauche orale inefficace + troubles lecture à voix haute →
    plutôt en faveur d'une **atteinte des représentations phonologiques**
    elles-mêmes (et non d'un trouble d'accès).
- **En cas de troubles sémantiques** : la modalité écrite est touchée AU MÊME
  TITRE que la modalité orale. Compte-tenu de la place centrale du système
  sémantique, **TOUTES** les épreuves écrites seront touchées en cas
  d'atteinte de ce système.
- **En cas de troubles d'ACCÈS au système sémantique** (et non du système
  lui-même) : seule UNE PARTIE des épreuves écrites le sera, avec par
  exemple une **dissociation** possible entre dénomination orale et écrite,
  ou entre désignation orale et écrite.
- **Comparaison modalité préservée vs atteinte** : la modalité moins atteinte
  pourra servir de **support au processus de rééducation** (à mentionner dans
  le projet thérapeutique).

#### **Étape 3 — Questionnaire sémantique** (patients suspectés lexico-sémantiques)

Approfondit l'évaluation des troubles sémantiques par des questions orales sur
les propriétés sémantiques des items-cibles. Pas de support visuel mais
exigeant en compréhension et attention.

- Particulièrement préconisé pour les **pathologies neurodégénératives** :
  Maladie d'Alzheimer, Démence Sémantique, Aphasie Primaire Progressive (APP).
- **Ne convient pas** aux aphasies modérées à importantes en pathologies
  vasculaires, traumatiques, tumorales, infectieuses — à proposer plus à
  distance quand le tableau est moins sévère (ex. aphasie anomique modérée).

---

### Patterns d'erreurs en dénomination (à reporter dans le CRBO)

Distinction clé pour le diagnostic différentiel lexico-sémantique vs
lexico-phonologique :

**Erreurs typiques trouble lexico-sémantique** (atteinte sémantique) :
- **Paraphasies sémantiques prédominantes** (chat → chien, fourchette →
  couteau).
- Production préservée du mot-cible **rare** même après ébauche orale.
- Ébauche orale **peu efficace** (pas de récupération facilitée par phonème
  initial).
- Atteinte aussi en désignation et appariement sémantique.

**Erreurs typiques trouble lexico-phonologique** (atteinte phonologique
spécifique) :
- **Profil d'erreurs plus diversifié** : erreurs **formelles** (phonétiques :
  /bʁa/ pour /pʁa/, ou phonémiques : intervertis "lave" pour "valent") +
  erreurs sémantiques associées.
- **Ébauche orale plus efficace** : le phonème initial déclenche la
  récupération du mot-cible (preuve que le mot est dans le lexique
  phonologique mais difficile à accéder).
- Désignation et appariement sémantique **PRÉSERVÉS** (sémantique intacte).

---

### Profils en fonction des pathologies (manuel BETL pp. 24+)

**Maladie d'Alzheimer (modérée)** :
- Modalité orale : dénomination en difficulté (souvent associée à des temps
  pathologiques) puis désignation peu atteinte.
- Profil **lexico-sémantique typique** avec prédominance des paraphasies
  sémantiques en dénomination + ébauche orale peu efficace.
- Confirmation par les résultats en désignation et appariement d'images.

**Aphasie vasculaire (modérée)** :
- Profils d'erreurs **plus diversifiés** : erreurs formelles (phonétiques
  ou phonémiques) **associées** aux erreurs sémantiques.
- **Ébauche orale plus efficace** que dans la maladie d'Alzheimer.
- Témoignent d'un **trouble lexico-phonologique** (atteinte spécifique de
  l'accès au lexique phonologique de sortie).

**Démence Sémantique** :
- Atteinte sémantique **massive** dès les premières étapes (dénomination +
  désignation + appariement d'images tous touchés).
- Modalité écrite touchée AU MÊME TITRE que l'orale.
- Questionnaire sémantique très chuté (atteinte des représentations
  sémantiques elles-mêmes, pas seulement de leur accès).

**Aphasie Primaire Progressive (APP) variante logopénique** :
- Dénomination orale chutée mais désignation préservée.
- Lecture à voix haute relativement préservée.
- Profil compatible avec un **trouble d'accès au lexique phonologique**.

**Aphasie Primaire Progressive (APP) variante sémantique** :
- Désignation chutée (atteinte sémantique).
- Dénomination + Lecture chutées (toutes modalités touchées).
- Atteinte progressive du système sémantique lui-même.

---

### Structure recommandée du diagnostic BETL (refonte 2026-05)

Le diagnostic BETL doit articuler **explicitement** le schéma Hillis &
Caramazza et formaliser l'atteinte au niveau du composant :

> "L'analyse des résultats à la BETL, lue selon le modèle théorique de
> Caramazza & Hillis (1990), met en évidence [type d'atteinte] :
>
> [En cas de trouble lexico-sémantique]
> Le profil observé chez [Prénom] suggère une **atteinte du système
> sémantique** [OU d'accès au système sémantique], objectivée par
> [convergence des épreuves dénomination + désignation + appariement
> sémantique d'images en classe X]. La modalité écrite est [touchée au
> même titre que la modalité orale / partiellement préservée], ce qui
> [confirme une atteinte des représentations sémantiques / oriente vers
> un trouble d'accès].
>
> [En cas de trouble lexico-phonologique]
> Le profil observé chez [Prénom] suggère une **atteinte du lexique
> phonologique de sortie** [OU d'accès à ce lexique], objectivée par
> [chute isolée de la dénomination orale d'images + préservation
> relative de la désignation et appariement sémantique].
> [Si ébauche orale efficace : "L'efficacité de l'ébauche orale
> oriente vers un trouble d'ACCÈS au lexique phonologique
> (représentations préservées)".]
> [Si ébauche orale inefficace : "L'inefficacité de l'ébauche orale
> oriente plutôt vers une atteinte des REPRÉSENTATIONS phonologiques
> elles-mêmes."]
>
> Conformément au décret n°2002-721 du JO du 4 mai 2002 [...], le bilan
> orthophonique réalisé ce jour met en évidence un trouble [aphasique /
> dysphasique / de la communication], de sévérité [légère / légère à
> modérée / modérée / sévère] [+ contexte étiologique si déjà posé par
> le neurologue].
>
> On notera parmi les points d'appui : [composants préservés du modèle].
> Les principaux axes de fragilité concernent [composants atteints du
> modèle]."

---

### Projet thérapeutique motivé par le modèle

Le projet thérapeutique BETL doit s'appuyer sur les **composants préservés**
identifiés par le schéma Hillis & Caramazza, qui servent de support à la
rééducation :

- **Trouble lexico-sémantique** : appui sur les **modalités les moins
  atteintes** (écrite si oral plus touché, ou inverse). Travail de
  ré-élaboration sémantique (catégorisation, propriétés, associations).
- **Trouble lexico-phonologique (accès)** : travail d'ébauche orale et de
  facilitation phonologique. Si récupération efficace par phonème initial,
  approche de **dénomination avec indiçage progressif**.
- **Trouble lexico-phonologique (représentations)** : reconstruction des
  représentations phonologiques (travail d'analyse phonémique, répétition,
  segmentation). Approche **conduite d'approche phonologique** (TAP).

---

### À RESPECTER ABSOLUMENT pour les conclusions BETL

1. **TOUJOURS référer au schéma Hillis & Caramazza** dans la conclusion
   diagnostique — c'est la demande explicite Laurie.
2. **Distinguer lexico-sémantique vs lexico-phonologique** dès l'étape 1
   (comparaison épreuves orales + imagées).
3. **Confirmer en étape 2** avec la modalité écrite (dissociations).
4. **Préciser ACCÈS vs REPRÉSENTATIONS** quand pertinent (efficacité ou non
   de l'ébauche orale).
5. **Justifier le projet thérapeutique** par les composants préservés
   identifiés dans le modèle.
6. **Pour les profils neurodégénératifs** : ajouter le questionnaire
   sémantique (étape 3). Pour les aphasies vasculaires aiguës : reporter
   le questionnaire sémantique à distance.
7. **NE JAMAIS poser d'étiologie médicale** (Alzheimer, démence sémantique,
   APP, AVC) — relève du neurologue. Le rapport BETL formule en "profil
   compatible avec…", "oriente vers…".
`
