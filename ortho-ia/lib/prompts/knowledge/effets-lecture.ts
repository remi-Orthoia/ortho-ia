/**
 * Concept des "effets" en lecture (fréquence, consistance, longueur,
 * lexicalité) et leurs interprétations cliniques officielles.
 *
 * Source : docs/Etudes de cas CRBO/Le concept "d'effets" en lecture et ses
 * interprétations.pdf + Les effets dans Lecture de mots et pseudomots.pdf.
 *
 * À injecter quand le bilan inclut des épreuves de lecture (mots,
 * pseudo-mots, leximétrie) — la lecture des "effets" est un point CENTRAL
 * du diagnostic différentiel dyslexie phonologique vs surface vs mixte.
 */

export const EFFETS_LECTURE = `## Concept des "effets" en lecture (référence officielle EVALEO / Exalang)

Les "effets" sont des **variables** mesurées sur les épreuves de lecture
(différences score entre conditions). Les conséquences de ces variables
sont **différentes selon l'âge** : plus le sujet est âgé, moins il devrait
y avoir de différence (Fq+ vs Fq-, C+ vs C-, L1 vs L3) puisque
l'automatisation de la lecture est moins conditionnée par ces effets.

### Modes de calcul

| Effet | Calcul |
|-------|--------|
| Effet consistance | score (consistants − inconsistants) |
| Effet fréquence | score (fréquents − rares) |
| Effet longueur | score (courts − longs) |
| Effet lexicalité | score (mots − non-mots) |

### Interprétations cliniques

#### Effet de consistance
- En **début d'apprentissage** : les mots consistants sont **mieux lus** que
  les inconsistants (prévalence de la procédure d'assemblage).
- La différence **s'amoindrit au cours du primaire**.
- **Pas d'évolution entre CM et 3e** — différence quasi nulle attendue.
- Effet anormalement élevé chez un grand : suggère un sur-recours persistant à
  la voie d'assemblage.

#### Effet de longueur
- En **tout début d'apprentissage** : plus facile de lire les mots courts que
  les longs (effet positif normal).
- Cette différence **disparaît quasiment au niveau du score en CE2**.
- Concernant le **temps de lecture** : la disparité entre enfants est plus
  grande jusqu'en CE2 qu'après. Les écarts de temps entre mots courts et
  longs sont plus importants en CE1-CE2 et deviennent plus faibles ensuite.
- Effet anormalement élevé chez un grand (score ET/OU temps) : suggère un
  recours persistant à la voie d'assemblage / défaut d'automatisation
  lexicale.

#### Effet de fréquence
- La fréquence est un **effet facilitateur** sur la lecture en CE1.
- **Diminue ensuite jusqu'à disparaître en CM**, ce qui traduit le passage
  progressif à la procédure d'adressage et le développement du stock
  orthographique.
- Effet anormalement élevé chez un grand : **le stock orthographique est
  insuffisamment constitué**, voie lexicale perturbée.

#### Effet de lexicalité (mots vs pseudo-mots)
- **Mots ≥ Pseudo-mots déficitaires** → suspicion dyslexie phonologique
  (voie d'assemblage atteinte).
- **Mots déficitaires + Pseudo-mots préservés** → suspicion dyslexie de
  surface (voie d'adressage atteinte).
- **Les deux atteints** → dyslexie mixte.
- Pour la temporalité (effet lexicalité-temps) : le sujet lit les mots
  COMME des mots nouveaux → voie lexicale perturbée.

### Règles d'interprétation absolues

1. **Toujours relativiser un effet par rapport au score à l'épreuve**. Si le
   score est très bas, il est difficile d'interpréter les effets puisqu'ils
   ne reposent pas sur suffisamment de mots correctement lus.

2. **Sensibilité aux variables = signal sur les procédures de lecture**.
   Chez le bon lecteur, les effets sont **très faibles et tendent vers 0
   à partir du CM**.

3. **Classes de référence (étalonnage EVALEO 7 classes)** :
   - Classe **3 et plus** = développement normal.
   - Classe **1** chez un sujet en âge scolaire = procédures non efficientes,
     à risque de difficultés persistantes de lecture fluente.
   - Classe **2** = à surveiller.

### Formulation dans le CRBO

Pattern observé chez les ortho expertes :
> "L'identification de mots est fragile : [Prénom] se situe dans la classe X
> pour l'ensemble des listes de mots, pour un temps Y : le déchiffrage est
> donc [imprécis / lent / les deux].
>
> On observe différents effets :
>   - Effet fréquence : classe X : les mots rares sont [bien moins / un peu
>     moins / pas moins] bien lus que les mots fréquents. Compte tenu de
>     l'âge attendu, ce contraste est [normal / trop important] : le lexique
>     orthographique est [bien constitué / insuffisamment constitué], ce qui
>     [n'altère pas / perturbe] la voie lexicale.
>   - Effet consistance : classe X : [...]
>   - Effet longueur : score classe X, temps classe Y : [...]
>
> La différence de temps mise pour lire ces deux listes suggère que [Prénom]
> passe par la voie [phonologique / d'adressage]."

Conclure systématiquement sur les **deux voies de lecture** (voie
d'assemblage / voie lexicale) — c'est le fondement du diagnostic dyslexie
phonologique / surface / mixte.
`

export const EFFETS_ORTHOGRAPHE = `## Concept des erreurs en orthographe (dictée de mots / phrases)

Pour les dictées (mots et phrases), la nomenclature officielle distingue :

### Erreurs en dictée de mots

- **Erreurs phonologiquement plausibles** (PHP) : le mot écrit pourrait
  se prononcer comme le mot cible (ex. "saidu" pour "cédu", ou "ortografe"
  pour "orthographe"). C'est une atteinte du stock lexical orthographique
  (voie d'adressage), pas de la phonologie.
- **Erreurs non phonologiquement plausibles** (PHP non plausibles) : le
  mot écrit ne pourrait pas se prononcer comme le mot cible (ex. "cévu"
  ou "sètiful"). C'est une atteinte de la voie phonologique
  d'orthographe (assemblage en écriture).

### Décomposition lexicale (au sein du score d'orthographe lexicale)

- **ODM (Orthographe Dérivable Morphologiquement)** : erreurs sur des
  parties du mot dérivables (ex. suffixes, préfixes accessibles par
  morphologie). Indique une faible sensibilité à la morphologie
  dérivationnelle.
- **ODNM (Orthographe Dérivable Non Morphologiquement)** : erreurs sur
  des parties non dérivables (racine, lettres muettes spécifiques).
  Indique une faiblesse du stock orthographique lexical brut.

### Indices orthographiques

Mesure (souvent /74 dans EVALEO) du nombre d'éléments orthographiques —
même partiels — que le sujet a mémorisés sur les mots. Un faible nombre
indique que peu d'éléments orthographiques sont stockés.

### En dictée de phrases — composantes à analyser

- **Atteinte linguistique** :
  - Erreurs phonétiques (non phonétiquement plausibles)
  - Erreurs de segmentation
  - Erreurs portant sur les mots-fonction
  - Mots omis
- **Atteinte de l'orthographe lexicale** :
  - Score global, puis détail ODM / ODNM.
- **Atteinte des règles morphologiques** :
  - Flexions des adjectifs (accords)
  - Flexions nominales et pronominales
  - Flexions verbales (conjugaison)

### Décision orthographique (CE2-3e)

Teste la **mémoire orthographique en reconnaissance** (pas en production —
le sujet n'a pas besoin de tenir le stylo). Permet de DISSOCIER :
- Atteinte de la production écrite seule (dysgraphie associée) → décision
  orthographique préservée.
- Atteinte de la mémoire orthographique elle-même → décision orthographique
  altérée même sans contrainte graphique.

Items typiquement explorés :
- Homophones grammaticaux (a/à, et/est, son/sont).
- Flexions (nominales, verbales, adjectivales).

### Formulation dans le CRBO

> "[Prénom] présente une dysorthographie caractérisée par :
>   - Des erreurs linguistiques [X erreurs PHP non plausibles + Y erreurs de
>     segmentation] → atteinte de la voie d'assemblage en écriture.
>   - Une restriction du lexique orthographique [X erreurs en orthographe
>     lexicale dont Y ODM + Z ODNM] → stock orthographique réduit, faible
>     sensibilité à la morphologie dérivationnelle.
>   - Des erreurs portant sur les accords [grammaticaux : nominaux,
>     verbaux, adjectivaux] → atteinte de la morphologie flexionnelle."

Toujours conclure sur le **sous-type dysorthographique** (phonologique,
lexicale/de surface, mixte) en cohérence avec le sous-type dyslexique du
même CRBO.
`
