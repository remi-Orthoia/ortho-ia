/**
 * Qualification des erreurs en lecture/dictée EVALEO 6-15.
 *
 * Source : Livret de consignes et cotation EVALEO 6-15 (Launay, Maeder,
 * Roustit, Touzin — Ortho Édition 2018, réédition 03/2024), chapitres
 * "Lecture de mots", "Lecture de pseudomots", "Dictée de mots", "Dictée
 * de pseudomots", "Dictée de phrases", "Conversion grapho-phonémique" +
 * docs/Bilans Sources/Evaleo 6-15 livret de cotation avec exemples pour
 * qualification des erreurs.pdf.
 *
 * À injecter dans le system prompt quand EVALEO 6-15 est sélectionné, en
 * complément du fragment EVALEO_METHODOLOGY. Sert à analyser
 * QUALITATIVEMENT les erreurs reportées par l'orthophoniste dans sa saisie
 * libre et à les classer dans le bon paradigme.
 *
 * 🔑 Demande Laurie : "Pour les bilans langage écrit, exploiter les
 * exemples du livret EVALEO et qualifier finement les erreurs, ça permet
 * d'orienter la rééducation sur le bon levier (voie d'assemblage vs
 * adressage, lexique vs morphologie)."
 */

export const ERREURS_EVALEO = `## Typologie des erreurs EVALEO 6-15 (qualification fine)

Référence : Livret de cotation EVALEO 6-15 (Launay et al. 2018/2024).

Quand l'orthophoniste a saisi des erreurs concrètes dans sa textarea libre
(épreuves de Lecture de mots/pseudomots, Dictée de mots/pseudomots/phrases,
Conversion grapho-phonémique), il faut les **classer dans la bonne
catégorie** EVALEO et **interpréter ce que cela révèle cliniquement**.

---

### 1. Substitutions (catégorie ONPP la plus fine)

**Substitution acoustique** : 2 phonèmes/graphies qui se différencient par
**un trait acoustique** (voisement, mode, lieu).
- Exemples : s → z, ch, f / t → d, p, k / p → t, k / v → f, j, z / b → m, g.
- Interprétation clinique : **discrimination auditive insuffisante**.
  Marqueur d'une représentation phonologique floue, voire d'un trouble
  auditif central. À croiser avec ELDP (Exalang 8-11) et répétition de
  logatomes.

**Substitution visuelle** : 2 graphies qui se différencient par **l'orientation
de la lettre** ou par **la forme**.
- Exemples : f/t, p/q, b/d, b/p, p/b, m/n, n/u, u/n.
- Interprétation clinique : **fragilité visuo-attentionnelle ou trouble
  visuel persistant**. Marqueur fort si associé à un empan visuo-attentionnel
  < classe 4. Penser bilan orthoptique neurovisuel.

**Substitution mixte** : 2 graphies qui se différencient à la fois par un
trait acoustique ET l'orientation visuelle.
- Exemples : m/n, b/d, b/p.
- Interprétation clinique : **double fragilité** auditive + visuelle, profil
  particulièrement vulnérable. À ne PAS confondre avec une simple
  inattention.

**Substitution "autre"** : substitution sans ressemblance acoustique ni
visuelle.
- Exemples : eu → ou, oeu → eau, ein → en, ion → ian.
- Interprétation : déficit plus profond de la **représentation phonologique**
  ou de la **mémoire graphémique**. Stock orthographique pauvre.

🔑 **Pour qualifier**, comparer la cible et la production phonème par
phonème. Si plusieurs erreurs sur une même graphie, coter "Autre".

---

### 2. Omissions et ajouts (catégorie ONPP)

**Omission stricte d'un phonème** :
- Exemples : ion → on / oeu → o / voc → oc / explorateur → exporateur.
- Interprétation clinique : **fragilité de la boucle phonologique** ou
  défaillance dans la représentation séquentielle du mot. Croiser avec
  empan endroit et répétition de pseudomots.

**Ajout strict d'un phonème** :
- Exemples : oeu → we / chausseur (au lieu de chaussure) / sere → soeur
  ajout du o ; seore → soer ajout du o.
- Interprétation : sur-régulation, parfois compensation d'une difficulté
  d'évocation lexicale (l'enfant rajoute une graphie "par sécurité").

🔑 1 point par phonème omis OU ajouté, max 1 point. Erreur cumulable avec
les autres catégories (si dans le même mot il y a omission ET substitution,
les deux comptent dans leur colonne respective).

---

### 3. Erreurs séquentielles (inversions)

**Inversion entre 2 phonèmes/lettres** :
- Exemples : oi → io / ai → ia / in → ni / on → no.
- Interprétation clinique : **trouble du traitement séquentiel** dans la
  boucle phonologique. Atteinte sur l'ordre temporel des phonèmes plutôt
  que sur leur identité. Marqueur récurrent en dyslexie phonologique
  développementale (Ramus, 2003).

🔑 Cette erreur **prime sur "substitution autre"** dans le scoring : si
deux phonèmes sont substitués mais que leur position échangée donne le mot
cible, c'est une erreur séquentielle, pas 2 substitutions.

---

### 4. Catégorie OL (Orthographe Lexicale) en dictée de mots

**Erreur OL** : tout mot écrit qui n'est pas le mot-cible exact (même si
phonétiquement plausible).
- Si le mot est morphologiquement décomposable, distinguer :
  - **ODM** (Orthographe Dérivationnelle Morphologiquement prévisible) :
    erreur sur l'affixe / la lettre finale muette prédictible par la
    morphologie (vent → ven, lait → lai, etc.).
  - **ODNM** (Orthographe Dérivationnelle Non Morphologiquement prévisible) :
    erreur sur la **racine** du mot, non prédictible par la dérivation
    (vent → vant, lait → lez).

**Exemples concrets (référence livret) :**
- "vent" → "ven" : OL + ODM (omission du t final, prédictible par "venteux").
- "vent" → "vant" : OL + ODNM (substitution dans la racine).
- "vent" → "van" : OL + ODM + ODNM (atteinte mixte).
- "vent" → "fen" : OL + ODM + 1 ONPP (atteinte phonétique + morphologique).
- "assemblage" → "assamblage" : OL + ODNM (racine atteinte).
- "assemblage" → "asemblage" : OL + ODM + 1 ONPP (affixe).
- "soeur" → "ser" : OL + 1 ONPP (un monosyllabe se prononce -ère).
- "soeur" → "sere" : OL (sans atteinte phonétique).

🔑 **OL ≠ ONPP** : OL est toujours coché si le mot n'est pas exact ;
ONPP est coché en plus si la production ne se prononce pas comme le mot
cible. Un mot phonétiquement plausible mais lexicalement faux (porto vs
porteau) est OL sans ONPP.

---

### 5. Erreurs de segmentation

Le mot dicté est écrit en plusieurs morceaux séparés par un espace.
- Exemples : "lion" → "l'ion" / "lion" → "l'on" (OL + 1 ONPP : se lit /lɔ̃/) ;
  "assemblage" → "assem blage" (OL pur, segmentation propre) ; "boîte en fer"
  → "boite enver" (segmentation au mauvais endroit).
- Interprétation : difficulté à isoler les **frontières de mots** dans le
  flux oral, souvent associée à une fragilité métaphonologique syllabique.

🔑 La segmentation est cotée uniquement **qualitativement** (pas
d'étalonnage). À mentionner dans la prose en complément de OL/ONPP.

---

### 6. Cas particuliers (dictée de mots/phrases)

**Accent diacritique** (é, è, ê) :
- Ne PAS compter d'erreur ONPP pour un accent placé sur "e" avant une
  consonne (ex. "éxplorateur"), mais compter OL.
- Erreur de sens d'accent (é/è/ê) ne compte pas en ONPP, seulement en OL.

**Substitution e/é** :
- Si "e" est écrit à la place de "é" → 1 erreur ONPP (phonétiquement non
  plausible).
- Si "ai" pour "é" ou "er" pour "é" → juste (production phonétiquement
  plausible).

**Mot non produit** :
- Mettre une croix dans la colonne "mot non produit". Cela coche
  automatiquement OL + ODNM + ODM + score max ONPP (2). Marqueur fort
  d'un déficit d'évocation ou de représentation graphémique.

**Flexions verbales/nominales** :
- Si le sujet produit une flexion (jeux, médecins), lui demander **aussitôt**
  le sens : "pourquoi mets-tu un s ?". Si "c'est au pluriel" → coter juste.
  Sinon coter faux. Cette demande active distingue **connaissance
  morphologique réelle vs hasard**.

---

### 7. Dictée de phrases : ventilation par sous-score

Les erreurs en Dictée de phrases sont **ventilées** dans 8-10 sous-scores :
- **ONPP** : erreurs phonétiquement non plausibles (voir typologie 1-3 ci-dessus).
- **OL** : erreurs d'orthographe lexicale.
- **ODNM** + **ODM** : décomposition morphologique de OL.
- **FV** (Flexion Verbale) : accord verbal incorrect (conjugaison, temps,
  personne, nombre).
- **FNP** (Flexion Nominale et Pronominale) : accord du nom et du pronom
  (genre, nombre).
- **FA** (Flexion Adjectivale) : accord de l'adjectif (genre, nombre).
- **MF / FCT** (Mots-Fonction) : déterminants, prépositions, conjonctions
  mal orthographiés.
- **Seg** : erreurs de segmentation.
- **Mots omis/substitués** : mots non écrits ou remplacés par un autre.
- **Hom** : confusion d'homophones grammaticaux (a/à, et/est, son/sont,
  ses/ces/c'est, on/ont, ou/où…).

🔑 Lors de la rédaction du CRBO, **structurer l'analyse de dictée de phrases
en 4 grands axes** :

1. **Atteinte linguistique** : ONPP + Seg + MF + Mots omis (correspondance
   phonographique).
2. **Atteinte de l'OL** : OL + ODM + ODNM (stock lexical orthographique).
3. **Atteinte des règles morphologiques (flexions)** : FA + FNP + FV
   (grammaire de surface).
4. **Atteinte des homophones grammaticaux** : Hom (grammaire de profondeur,
   décision orthographique).

Cette structure permet d'orienter la rééducation sur le **bon levier** :
- ONPP fort → voie d'assemblage immature → travail métaphonologique.
- OL fort → voie d'adressage immature → travail lexique orthographique.
- Flexions/Hom forts → trouble de la grammaire → travail morphologique.

---

### 8. Pattern de citation en CRBO

Quand l'ortho a saisi des erreurs précises, les reprendre dans la prose
au pattern :
> "Ex. : « [cible] » → « [production] », illustrant une [catégorie d'erreur
> ci-dessus] / [interprétation clinique]."

Exemples concrets :
- "Ex. : « car » → « quarre » (mot-fonction très fréquent mal orthographié,
  illustrant la fragilité du stock lexical orthographique sur les mots
  outils)."
- "Ex. : « boîte en fer » → « boite enver » (erreur de segmentation au
  mauvais endroit, fragilité métaphonologique syllabique)."
- "Ex. : « assemblage » → « asenblage » (1 OL + 1 ODM + 1 ODNM + 1 ONPP,
  atteinte mixte phonétique + morphologique sur un mot fréquent)."

🔒 **NE JAMAIS inventer une erreur non rapportée** par l'orthophoniste.
Si aucune erreur précise n'a été saisie, ne pas écrire de "Ex." factice.
`
