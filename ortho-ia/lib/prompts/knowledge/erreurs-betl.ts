/**
 * Qualification des erreurs en dénomination BETL.
 *
 * Source : Manuel BETL (T. M. Tran, Ortho Édition 2015), pages 40-41
 * (typologie des paraphasies, conduites d'approche, approches) + Annexe 2
 * (Profil dénominatif dans le discours et la conversation, grille 5 axes
 * graduels).
 *
 * À injecter dans le system prompt quand BETL est sélectionné, en complément
 * du fragment BETL_HILLIS_CARAMAZZA. Sert à analyser QUALITATIVEMENT les
 * erreurs reportées par l'orthophoniste dans la dénomination d'images et
 * à les classer dans la bonne catégorie aphasiologique.
 *
 * 🔑 Demande Laurie : "Pour BETL, le commentaire des erreurs de dénomination
 * doit être très précis car c'est lui qui oriente le diagnostic du
 * niveau atteint (sémantique vs phonologique vs accès)."
 */

export const ERREURS_BETL = `## Typologie des erreurs en dénomination BETL (Tran, Ortho Édition 2015)

Référence : Manuel BETL pages 40-41, Annexe 2 "Profil dénominatif dans le
discours et la conversation".

Quand l'orthophoniste a saisi des erreurs de dénomination dans sa textarea
libre, il faut les **classer dans la bonne catégorie** aphasiologique. Cette
classification est centrale dans le diagnostic BETL : elle oriente le
**niveau atteint** dans le modèle de Caramazza & Hillis (1990).

---

### 1. Réponses non-verbales

- **Bruits / onomatopées** : "wouh wouh" pour chien. Signale une difficulté
  d'accès lexical mais préservation de la reconnaissance sémantique.
- **Geste déictique** : montrer l'objet ou son équivalent (la chaise, son
  pantalon). Communication compensatoire conservée, accès phonologique
  défaillant.
- **Geste référentiel** : geste décrivant la forme ou l'usage. Noté + si
  adapté, − si erroné ou imprécis. Indicateur de la qualité des
  représentations sémantiques sous-jacentes.

🔑 Les réponses non-verbales témoignent d'une **préservation du système
sémantique** mais d'un **blocage de l'accès phonologique**. Profil typique
de l'aphasie anomique.

---

### 2. Paraphasies lexicales (atteinte du lexique de sortie phonologique)

**Paraphasie lexicale formelle** : production d'un mot apparenté
**formellement** à la cible (mais pas sémantiquement).
- Exemple : "lapin" pour "sapin", "table" pour "câble", "porte" pour "perte".
- Interprétation : trouble de la **sélection lexicale** dans le lexique
  phonologique de sortie. Niveau phonologique du modèle.

**Paraphasie lexicale sémantique** : production d'un mot apparenté
**sémantiquement** à la cible.
- Cohyponyme : "tabouret" pour chaise / "chien" pour chat / "âne" pour cheval.
- Hyperonyme : "animal" pour zèbre / "fruit" pour ananas / "outil" pour
  tournevis (= **dénomination générique**).
- Associé : "table" pour chaise.
- Interprétation : trouble de la **sélection lexicale** par déficit
  sémantique. Niveau lexico-sémantique du modèle Caramazza-Hillis.

**Paraphasie lexicale (sans rapport)** : production d'un mot sans rapport
de sens ni de forme avec la cible.
- Interprétation : si non-persévération, déficit profond de l'accès lexical
  combiné à un déficit sémantique.

**Paraphasie mixte** : production simultanément apparentée formellement ET
sémantiquement.
- Exemple : "biche" pour chèvre (forme proche + sémantique animal).
- Interprétation : double atteinte lexico-phonologique. Souvent observé en
  aphasie sévère.

---

### 3. Paraphasies segmentales (atteinte phonologique ou phonétique)

**Paraphasie segmentale** : erreur dénominative résultant d'un trouble de
la **sélection, agencement ou articulation des phonèmes** du mot-cible.
- Exemples : /taty/ ou /katyk/ pour "cactus" ; /ʃapo/ → /ʃato/ ; /tʁɛ̃/ → /pɛ̃/.
- Sous-types :
  - Substitution phonémique (un phonème par un autre proche).
  - Élision (omission d'un phonème).
  - Addition (ajout).
  - Métathèse (inversion de l'ordre des phonèmes).
- Interprétation : atteinte phonologique pure si forme cible reste
  reconnaissable. Atteinte phonétique si articulation altérée.

**Logatome** : suite de phonèmes sans signification, non identifiable à un
mot de la langue.
- Exemple : /savipa/ pour chien.
- Interprétation : effondrement de l'accès au lexique phonologique de
  sortie. Niveau phonologique très sévèrement atteint. Marqueur d'aphasie
  jargonaphasique ou de Wernicke.

🔑 Le terme **logatome** est privilégié sur "néologisme" en BETL (référence
Tran & Corbin 2001) car plus adéquat linguistiquement.

---

### 4. Conduites d'approche (stratégies de compensation)

**Conduite d'approche formelle** : approches successives de la **forme**
du mot-cible.
- Exemple : "un archi, un ati, architau, un artichaut" pour artichaut.
- Interprétation : recherche phonologique active, le patient connaît la
  forme cible mais ne peut pas l'extraire d'emblée. Cliniquement favorable
  (préservation de la voie d'assemblage).

**Conduite d'approche sémantique** : paraphasies lexicales sémantiques
successives.
- Exemple : "un cheval non, pas un âne, un mulet peut-être ?" pour zèbre.
- Interprétation : recherche dans le champ sémantique, accès sémantique
  partiellement préservé mais sélection lexicale précaire.

**Circonlocution formelle** : commentaire portant sur la **forme** du
mot-cible.
- Exemple : "ça commence par i", "ça commence par h", "il y a plusieurs
  syllabes" pour hippopotame.
- Interprétation : accès partiel au lexique phonologique (savoir
  graphémique ou syllabique partiel).

**Circonlocution sémantique (référent)** : description du référent, sa
fonction ou des situations associées.
- Exemple : "c'est petit, c'est pour rassembler des papiers, dans les
  bureaux" pour trombone.
- Interprétation : représentation sémantique préservée, accès phonologique
  défaillant. Marqueur du **manque du mot** dans l'aphasie anomique.

🔑 Quand les stratégies s'appuient sur des représentations correctes
(phonologiques ou sémantiques), elles sont notées **+**. Quand les savoirs
mobilisés sont inexacts ou flous, elles sont notées **−**. C'est cette
nuance qui qualifie la **qualité** de la conduite d'approche.

---

### 5. Approches flexionnelles, combinatoires, constructionnelles

**Approche flexionnelle** : conduite d'approche s'appuyant sur le genre
et/ou le nombre du mot-cible.
- Exemple : "des..." pour menottes / "du..." pour riz / "une..." pour table.
- Interprétation : accès à l'information morphologique (genre, nombre)
  sans accès au mot lui-même.

**Approche combinatoire** : conduite d'approche s'appuyant sur les
propriétés combinatoires du mot-cible (collocations, expressions figées).
- Exemple : "une rampe d'escalier" pour escalier / "un coup de poing" pour
  poing.
- Interprétation : accès au réseau de cooccurrences plus rapide que l'accès
  au mot isolé. Fréquent en aphasie sévère, suggère un travail rééducatif
  par les expressions usuelles.

**Approche constructionnelle** : conduite d'approche faisant appel à des
procédures de construction de mot (préfixes, suffixes).
- Paraphasie constructionnelle : "*éventeur" pour éventail (ne respecte
  pas les règles de construction du français).
- Paraphasie morphologique : "chausseur" pour chaussure (construit mais
  inadéquat).
- Néologisme constructionnel : "°passe-liquide" pour entonnoir (respecte
  les règles de construction).
- Interprétation : créativité morphologique préservée, ressource à
  exploiter en rééducation.

---

### 6. Persévérations et dénominations vides

**Persévération** : production qui correspond à un item précédemment
dénommé (l'enfant ou patient répète un mot déjà dit).
- Interprétation : trouble de l'inhibition, fréquent dans les aphasies
  sous-corticales et en début d'aphasie de Broca.

**Dénomination vide** : production d'un mot vide de sens ou de contenu
("truc", "chose", "machin").
- Interprétation : manque du mot avec compensation lexicale très pauvre.
  Profil typique d'aphasie anomique évoluée ou de démence sémantique
  débutante.

🔑 Ces 2 catégories figurent **en tête** de la grille BETL d'erreurs car
elles sont les plus marquantes cliniquement et nécessitent une analyse
spécifique du contexte (motivation, fatigue, comorbidité).

---

### 7. Profil dénominatif en discours et conversation (Annexe 2 BETL)

Au-delà des erreurs sur l'épreuve cotée, **observer le comportement
verbal en discours libre**. La BETL propose une grille à **5 axes graduels**
(de "sévère" à "absent") :

1. **Recherches lexicales** : très fréquentes / fréquentes / régulières /
   occasionnelles / absentes.
2. **Productions déviantes** (paraphasies en discours) : très fréquentes /
   fréquentes / régulières / occasionnelles / absentes.
3. **Déroulement du discours** : discours réduit / nombreuses interruptions /
   interruptions régulières / quelques hésitations / déroulement normal.
4. **Informativité du discours** : nulle / réduite / moyenne / bonne / très
   bonne.
5. **Comportement verbal et handicap communicationnel** : non-conscience du
   trouble et absence de stratégies / conscience du trouble et absence de
   stratégies / stratégies peu efficaces / stratégies souvent efficaces /
   stratégies efficaces.

→ Cotation globale du handicap communicationnel : **sévère / important /
modéré / léger / absent**.

🔑 Cette grille de discours doit être citée explicitement dans le CRBO BETL
quand l'orthophoniste a observé le patient en conversation libre (anamnèse,
échange spontané). Elle complète le score chiffré de dénomination et est
**décisive pour graduer la sévérité de l'aphasie** au-delà des seuls items
cotés.

---

### 8. Pattern de citation en CRBO BETL

Quand l'ortho a saisi des erreurs concrètes, les reprendre au pattern :
> "Ex. : « cible » → « production patient » : [catégorie BETL] / [niveau
> du modèle Caramazza-Hillis atteint]."

Exemples authentiques :
- "Ex. : « artichaut » → « un archi, un ati, architau, un artichaut » :
  conduite d'approche formelle (+), accès phonologique précaire mais
  voie d'assemblage préservée."
- "Ex. : « zèbre » → « animal » : paraphasie lexicale sémantique
  (dénomination générique hyperonyme), fragilité de la sélection lexicale
  par déficit sémantique."
- "Ex. : « cactus » → « /katyk/ » : paraphasie segmentale par métathèse,
  atteinte phonologique de surface."
- "Ex. : « entonnoir » → « °passe-liquide » : néologisme constructionnel,
  créativité morphologique préservée."

🔒 **NE JAMAIS inventer une erreur non rapportée** par l'orthophoniste. Si
aucune erreur précise n'a été saisie, ne pas écrire de "Ex." factice.

---

### 9. Articulation avec le modèle Caramazza-Hillis (3 niveaux)

Synthèse de **où** chaque type d'erreur situe le déficit dans le modèle :

| Niveau du modèle | Erreurs typiques |
|---|---|
| **Système sémantique** (concept) | Paraphasie sémantique cohyponyme/hyperonyme, dénomination générique, perte des connaissances encyclopédiques sur l'objet |
| **Lexique sémantique → phonologique** (accès) | Manque du mot, circonlocution sémantique, conduite d'approche sémantique, dénomination vide, paraphasie mixte |
| **Lexique phonologique de sortie** (forme) | Paraphasie lexicale formelle, conduite d'approche formelle, circonlocution formelle, paraphasie segmentale, logatome, néologisme |

Cette correspondance erreurs → niveau est **OBLIGATOIRE** dans la conclusion
du CRBO BETL. Elle constitue le diagnostic clinique propre à la BETL au-delà
des scores.
`
