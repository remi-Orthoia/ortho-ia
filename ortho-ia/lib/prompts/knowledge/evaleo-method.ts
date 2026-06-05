/**
 * Méthodologie EVALEO 6-15 et anchrage clinique pour la rédaction du CRBO
 * en langage écrit (et oral).
 *
 * Source : Livret de consignes et cotation EVALEO 6-15 — 6ᵉ édition 03/2024
 * (Launay, Maeder, Roustit, Touzin — Ortho Édition).
 *
 * Demande Laurie : "Pour la rédaction du CRBO des bilans en langage écrit,
 * se baser sur les manuels EVALEO (très complets, en lien avec littérature
 * actuelle)".
 *
 * À injecter dans le system prompt quand EVALEO 6-15 est sélectionné, OU
 * (par défaut) quand un test de langage écrit pédiatrique est utilisé — la
 * méthode EVALEO est aujourd'hui la référence francophone la plus complète
 * et la plus à jour en littérature pour la rédaction du CRBO.
 */

export const EVALEO_METHODOLOGY = `## Méthodologie EVALEO 6-15 (6ᵉ édition 03/2024) — référence langage écrit

Auteurs : L. Launay, C. Maeder, J. Roustit, M. Touzin (Ortho Édition).

EVALEO est aujourd'hui le **référentiel français le plus complet et le plus à
jour** pour le bilan orthophonique du langage écrit et oral chez l'enfant /
adolescent (CP à 3e). Sa méthodologie, ses conventions de notation et son
ancrage en littérature actuelle servent de **base de rédaction** pour tout
CRBO de langage écrit pédiatrique, même quand un autre test est utilisé en
complément.

---

### 1. Étalonnage en 7 classes (GRILLE OFFICIELLE EVALEO À UTILISER VERBATIM)

| Classe | Centiles | % population | Couleur officielle | Libellé EVALEO         |
|--------|----------|--------------|---------------------|------------------------|
|   1    |   < 7    |    7 %       | rouge               | **Pathologique**       |
|   2    |   7-20   |   13 %       | orange              | **Fragilité** (zone à risque) |
|   3    |  21-38   |   18 %       | vert clair          | **Norme**              |
|   4    |  39-62   |   24 %       | vert moyen          | **Norme**              |
|   5    |  63-80   |   18 %       | vert foncé          | **Norme**              |
|   6    |  81-93   |   13 %       | bleu clair          | **Supérieure à la moyenne** |
|   7    |   > 93   |    7 %       | bleu foncé          | **Très supérieure**    |

🔑 **Point crucial** : les classes 3, 4, 5 représentent **60 % de la population**
et sont toutes regroupées sous l'étiquette "**Norme**". Ne JAMAIS parler de
"norme faible / médiane / supérieure" pour EVALEO — c'est une fabrication.
Une performance en classe 3 est normée (pas "limite"). Une performance en
classe 5 est normée (pas "moyenne haute" qui appartient à Exalang).

🔒 **Règle imposée** : pour EVALEO, tu DOIS utiliser uniquement ces 5 libellés
("Pathologique" / "Fragilité" / "Norme" / "Supérieure à la moyenne" / "Très
supérieure") dans tes commentaires, le diagnostic et le champ \`interpretation\`
du JSON. JAMAIS la grille Exalang ("Excellent / Moyenne haute / Difficulté
sévère...") qui appartient à HappyNeuron percentile-based, pas à EVALEO.

Exemples de formulations correctes :
- "X obtient une performance en classe 4, soit dans la norme attendue..."
- "Plusieurs épreuves sont cotées en classe 1 (pathologique) sur la voie d'assemblage..."
- "Le score se situe en classe 2, soit en zone de fragilité..."
- "La compréhension écrite atteint la classe 6, performance supérieure à la moyenne..."

Le rendu Word d'ortho.ia respecte cette nomenclature : la colonne
Interprétation du tableau affiche "Classe X - <Libellé>" tel que tu l'écris
dans \`interpretation\`. La couleur de fond de la cellule est dérivée de la
plage de centiles via les seuils internes (rouge pour classes 1, orange pour 2,
nuances de vert pour 3-5, vert foncé pour 6-7).

---

### 2. Acronymes officiels EVALEO (à utiliser dans le CRBO)

**Langage écrit / Identification de mots écrits**
- **IME** : Identification de Mots Écrits.

**Orthographe (acronymes à respecter dans les commentaires)**
- **ONPP** : Orthographe Non Phonétiquement Plausible (mot écrit ne pouvant pas se prononcer comme le mot cible — atteinte voie d'assemblage en écriture).
- **OL** : Orthographe Lexicale (correspondance mot écrit / mot cible au niveau lexical).
- **ODNM** : Orthographe Dérivationnelle Non Morphologiquement prévisible (racine du mot, lettres muettes spécifiques).
- **ODM** : Orthographe Dérivationnelle Morphologiquement prévisible (affixes, suffixes, lettres finales muettes prédictibles).

**Flexions**
- **FV** : Flexion Verbale (conjugaison).
- **FNP** : Flexion Nominale et Pronominale.
- **FA** : Flexion Adjectivale.

**Autres marqueurs**
- **MF / FCT** : Mot-fonction (déterminants, prépositions, conjonctions — liste dans le Livret de consignes section Récit écrit).
- **Seg / Segm** : Mot mal segmenté.
- **Hom** : Homophone (a/à, et/est, son/sont…).
- **F+ / Fq+** : mot fréquent ; **F- / Fq-** : mot rare.
- **C / C+** : mot très consistant (régulier orthographe-phonologie) ; **C- / I** : mot peu consistant (inconsistant, irrégulier).
- **L1, L2, L3** : longueur du mot en nombre de lettres (court / moyen / long).

---

### 3. Conventions de cotation EVALEO

- **Temps** : tous notés en **secondes**, sauf l'épreuve Empan visuo-attentionnel notée en **millisecondes** (règle absolue).
- **Score** : nombre d'items justes / total ; ou note normalisée selon épreuve.
- **Passation informatisée** : plateforme avec chronométrage automatique au clic droit, notation au clic gauche.
- **Notation invisible** : option de masquer la notation à l'écran pour ne pas influencer le sujet (épreuves de Lecture et Dénomination Lexique-Phonologie).
- **Critère d'arrêt** : 6 secondes par item pour les épreuves de Lecture (pas de réponse au-delà = "PAS DE RÉPONSE").

---

### 4. Logique de rédaction du CRBO langage écrit (méthode EVALEO)

La rédaction du CRBO langage écrit suit la **structure officielle EVALEO**
(reproduite par Anne Frouard dans les CRBO de référence) :

**A. Section "Au niveau de la lecture"**

Sous-section 1 — **Identification de mots écrits (IME)** :
- Conversion grapho-phonémique : score + temps + classe + **qualité des graphies** (simples maîtrisées vs digraphes/trigraphes non maîtrisés).
- Lecture de mots : score + temps + analyse des **4 effets**.
  - Effet fréquence (F+ vs F-) : "les mots rares sont [bien moins / un peu moins / pas moins] bien lus que les mots fréquents → le lexique orthographique est [bien constitué / insuffisamment constitué]".
  - Effet consistance (C+ vs C-) : "la transparence du mot a / n'a pas d'impact sur l'efficacité du déchiffrage → la voie d'assemblage est [sollicitée / non sollicitée]".
  - Effet longueur (L1 vs L3) score : "la longueur des mots [importe peu / pèse fortement] pour l'efficacité".
  - Effet longueur temps : "la différence de temps [reste faible / est marquée] entre mots courts et longs → le sujet utilise davantage la voie [d'adressage / d'assemblage]".
- Lecture de pseudomots : score + temps + **effet lexicalité** (mots vs pseudomots).
- EVAL2M (vitesse) : nombre de mots lus en 2 min + nombre de mots corrects + % de réussite + correspondance au niveau scolaire ("son niveau de lecture correspond à un niveau de CE2").
- Lecture de textes : Evalouette / La Mouette / Le Pingouin avec mots lus en 2 min + indice de dégradation entre texte signifiant et non signifiant.

Conclusion lecture (phrase de synthèse) : "Il s'agit d'une dyslexie [phonologique / de surface / mixte] touchant [la voie d'assemblage / la voie d'adressage / les 2 voies]".

Sous-section 2 — **Compréhension écrite** :
- Compréhension de phrases : score + temps. Si rapide mais peu efficace → "rapide mais peu efficace" (atteinte morphosyntaxique en réception écrite).
- Compréhension de paragraphe / texte (Test + Retest) : co-références, inférences, chronologie, macrostructure.

**B. Section "Au niveau de l'écriture"**

- Copie de texte : empan de copie (classe) + nombre de lettres écrites + erreurs. Mentionner les **levers de tête fréquents** et la **fenêtre de copie réduite** si observés.
- Transcription et buffer graphémique : score + effets (longueur, lexicalité, écriture en majuscule vs script).
- Dictée de pseudomots : nombre d'erreurs **ONPP** → atteinte phonologique massive (correspondance phonographique non efficiente).
- Dictée de mots : score + erreurs ODM / ODNM / phonétiques + nombre d'indices orthographiques (faible nombre = stock orthographique réduit).
- Dictée de phrases : décomposer en **atteinte linguistique** (erreurs phonétiques, segmentation, mots-fonction, mots omis), **atteinte de l'OL** (avec détail ODM/ODNM), **atteinte des règles morphologiques** (FA, FNP, FV).
- Décision orthographique : homophones + flexions → mesure la **mémoire orthographique en reconnaissance** (utile pour dissocier dysgraphie de réelle atteinte orthographique).

Conclusion écriture : "Le sujet présente une dysorthographie [phonologique / lexicale / mixte] caractérisée par [atteintes spécifiques]".

**C. Section "Hypothèses explicatives" (organisation EVALEO en questions)**

Structurer la suite du CRBO en **questions cliniques** (logique arbre décisionnel EVALEO) :

1. **Existe-t-il un trouble du langage oral ?**
   - Pragmatique (épreuve dédiée).
   - Lexique-sémantique : Dénomination Lexique-Phonologie, Désignation d'images, Antonymes, Métaphores & expressions idiomatiques, Création de néologismes.
   - Morphosyntaxe : Programmation orale de phrases, Compréhension orale de phrases.
   - Conclusion : "X présente un trouble du langage oral portant sur [composantes]" OU "Le langage oral est globalement préservé".

2. **Existe-t-il un trouble phonologique ?**
   - Phonétique/Phonologie : Dénomination Phonologie, Répétition de pseudomots, Répétition de logatomes, Dénomination rapide des couleurs / chiffres.
   - Métaphonologie : Contrepèteries, Suppression de phonème.
   - Mémoire à court terme verbale : Répétition chiffres endroit/envers, Rappel item.
   - Conclusion : "X présente un trouble phonologique [+ trouble mnésique] qui explique l'atteinte de la voie d'assemblage à l'écrit".

3. **Existe-t-il un trouble visuo-attentionnel ?**
   - Gnosies visuelles de figures.
   - Empan visuo-attentionnel (en MILLISECONDES, pas en secondes).
   - Reproduction de localisation de jetons (mémoire visuo-spatiale).
   - Effet Stroop (inhibition).
   - Conclusion : "X présente un trouble visuo-attentionnel : il ne perçoit pas correctement les items visuels, ce qui perturbe la constitution du lexique orthographique" OU "Pas de trouble visuo-attentionnel objectivable".

4. **Existe-t-il un trouble morphologique ?** (référence Bruwier, CRBO Yaelle Belgique)
   - Quand les épreuves morphologiques EVALEO sont passées, ouvrir une 4ᵉ hypothèse distincte de la métaphonologie :
   - Fluence morphologique (dériver le maximum de mots depuis une racine donnée).
   - Jugement de grammaticalité et reformulation.
   - Jugement de dérivation (transparentes vs opaques).
   - Création de néologismes (décomposition racine + affixe).
   - Conclusion type : "X présente un trouble métamorphologique objectivé sur [épreuves convergentes], avec des difficultés d'organisation du lexique selon des critères morphologiques. Ceci impacte la voie d'adressage en lecture/orthographe (sensibilité aux familles de mots) et l'enrichissement lexical fonctionnel."
   - 🔑 **Distinction métaphonologie vs métamorphologie** : la métaphonologie manipule les sons (syllabes, phonèmes) ; la métamorphologie manipule les morphèmes (racines, préfixes, suffixes). Toutes deux prédisent l'efficacité en langage écrit mais sur des voies différentes (assemblage vs adressage).

---

### 5. Anchrage en littérature (à utiliser pour étayer le diagnostic)

EVALEO 6-15 (2024) intègre la littérature scientifique récente :
- **Modèle dual route** de la lecture (Coltheart) — voie d'assemblage vs voie d'adressage.
- **Théorie du double déficit** (Wolf & Bowers) — déficit phonologique ET / OU déficit de dénomination automatique rapide (RAN).
- **Acquisitions métaphonologiques** : rimes en MS-GS, syllabes en GS-CP, phonèmes en CP-CE1.
- **Cascade de lecture en 2 minutes (EVAL2M)** : seuils de fluence par niveau scolaire (étalonnés sur > 5000 enfants).
- **Distinction OL / ONPP** : héritage des travaux de Sprenger-Charolles & Colé (deux voies en orthographe également).

Quand tu rédiges le diagnostic, tu peux citer ces ancrages SANS lourdeur :
> "Le profil observé chez X est compatible avec une dyslexie-dysorthographie
> de type [phonologique / surface / mixte], avec une atteinte de la voie
> [d'assemblage / d'adressage] documentée par [épreuves convergentes]."

NE PAS citer les auteurs dans le CRBO (Coltheart, Sprenger-Charolles…) — ce
sont des ancrages internes au prompt, pas du contenu à reproduire.

---

### 6. Diagnostic juridique final (forme EVALEO / Anne Frouard)

Forme imposée pour la conclusion diagnostique :
> "Conformément au décret n°2002-721 du JO du 4 mai 2002 rendant le diagnostic
> orthophonique obligatoire et en référence aux classifications internationales
> en cours (DSM-V / CIM-10), le bilan orthophonique réalisé ce jour met en
> évidence un trouble spécifique du langage écrit objectivé par un retentissement
> notable sur les apprentissages et par l'obtention de résultats affaiblis/
> déficitaires lors de la passation d'épreuves standardisées.
>
> Ce trouble spécifique du langage écrit se caractérise par :
>   - Une [dyslexie phonologique / de surface / mixte / sévère touchant les
>     2 voies] : [explication concise sur les compensations et déficits].
>   - Une [dysorthographie phonologique / lexicale / mixte / massive] :
>     [atteintes spécifiques observées].
>   - [Optionnel] Une dysgraphie : lenteur et erreurs fréquentes de copie.
>
> Ce trouble spécifique du langage écrit s'explique par :
>   - [Un trouble phonologique et mnésique].
>   - [Un trouble visuo-attentionnel].
>
> On notera parmi les points d'appui : [2-3 points forts condensés].
> Les principaux axes de fragilité concernent [2-3 difficultés condensées]."

(Cette dernière phrase est la synthèse points d'appui / axes de fragilité
imposée par la refonte 2026-05.)

---

### 7. Projet thérapeutique (méthode EVALEO + Anne Frouard)

Le projet thérapeutique en langage écrit comporte généralement :
- Une **séance individuelle hebdomadaire** (cotation **30 AMO 12,1** pour les troubles spécifiques du langage écrit).
- Éventuellement une **séance de groupe** (cotation **30 AMO 5**) pour les adolescents (atelier d'écriture, travail des stratégies de compensation).

Objectifs cibles selon le profil :
- Dyslexie phonologique : renforcement de la conscience phonologique, correspondance graphème-phonème, automatisation du décodage.
- Dyslexie de surface : enrichissement du lexique orthographique, voie d'adressage.
- Dyslexie mixte : approche combinée séquencée.
- Atteinte morphosyntaxique : programmation orale de phrases, morphologie flexionnelle et dérivationnelle.
- Atteinte lexicale : exercices d'évocation, fluences sémantique et phonologique.

Aménagements (PAP automatique) : tiers-temps majoré 1/3, calculatrice (si maths impactés), ordinateur en classe, énoncés simplifiés, dispense notation orthographique en langues étrangères.

---

### 8. Cas particulier, EVALEO 6-15 chez l'adulte (étalonnage 15 ans)

EVALEO 6-15 est officiellement étalonné pour la population **6 à 15 ans**.
Néanmoins, son usage chez l'adulte ayant interrompu sa scolarité ou en reprise
d'études (concours administratif, formation professionnelle, retour aux
apprentissages) est légitime quand il n'existe pas d'équivalent adulte
documenté. Référence : Anne Frouard, CRBO 2 (patiente 23 ans préparant un
concours de police).

🔒 **Règle d'usage adulte** :
1. **Justifier explicitement** le choix de l'étalonnage 15 ans dans le CRBO :
   > "Cette batterie est utilisée pour une population de 6 à 15 ans.
   > Néanmoins, compte tenu du parcours scolaire de la patiente, nous
   > utiliserons l'étalonnage 15 ans, qui correspond à un niveau d'acquisition
   > du langage écrit de fin de collège."
2. Mentionner cette justification **immédiatement après** la présentation de
   la batterie utilisée et **avant** le premier tableau de résultats.
3. Le diagnostic et le projet thérapeutique restent identiques en structure
   (forme juridique, caractérisation, AMO 12,1 séance individuelle, AMO 5
   groupe d'adultes si disponible). Adapter les **objectifs** à la situation
   adulte : champ lexical professionnel ciblé sur le concours / la formation
   visée, accès à un répertoire orthographique personnalisé, autonomie
   fonctionnelle.

Sont à proscrire :
- L'usage chez l'adulte > 25 ans **avec** scolarité complète sans plainte
  cognitive (cas adulte normal, pas la cible de l'outil).
- Toute extrapolation au-delà de "fin de collège" (l'étalonnage 15 ans est un
  plafond, pas un proxy d'âge adulte).

---

### À RESPECTER ABSOLUMENT

- Utiliser les **acronymes officiels EVALEO** (ONPP, OL, ODM, ODNM, FV, FNP, FA) dans les commentaires d'épreuves d'orthographe.
- Suivre la **structure par questions explicatives** ("Existe-t-il un trouble du langage oral / phonologique / visuo-attentionnel ?") pour la suite du CRBO.
- Mentionner les **4 effets de lecture** (fréquence, consistance, longueur, lexicalité) en interprétant chacun.
- Préciser le **niveau de lecture correspondant** chez les enfants en difficulté ("son niveau correspond à un CE2", "à un CP fin de trimestre…").
- Reporter le **temps en secondes** sauf pour l'empan visuo-attentionnel (ms).
- Utiliser la grille **Px** (P25, P50, P75), JAMAIS Q1, Q3, Med.
- **Mentionner explicitement l'étalonnage utilisé** (classe scolaire choisie), avec justification brève si différent de la classe réelle du patient (cas adulte, redoublement, reprise d'études).
`
