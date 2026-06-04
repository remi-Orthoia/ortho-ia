import type { TestModule } from './types'

/**
 * Module EVALEO 6-15 — Évaluation du Langage Écrit et du Langage Oral 6-15 ans.
 *
 * Auteurs : Laurence LAUNAY, Christine MAEDER, Jacques ROUSTIT, Monique TOUZIN.
 * Éditeur : Ortho Édition. Année : 2018.
 *
 * Source officielle : 2 cahiers de passation (Langage Oral + Langage Écrit/Autres)
 * + 1 livret de cotation avec exemples qualification d'erreurs (27 Mo) + 2 exemples
 * de bilans (initial + renouvellement).
 *
 * Couverture : **du CP à la 3e** (rare en français — la plupart des batteries
 * sont scindées CP-CM2 / 6e-3e). Étalonnage français récent (2018).
 *
 * Structure officielle :
 *  - **LANGAGE ORAL** : Phonologie, Métaphonologie, Lexique-sémantique,
 *    Morphosyntaxe, Récit oral, Pragmatique.
 *  - **LANGAGE ÉCRIT** : Lecture identification, Lecture compréhension, Écriture,
 *    Orthographe, Récit écrit.
 *  - **AUTRES** : Gnosies, Visuo-attentionnel, Contrôle inhibition, Mémoire à
 *    court terme, Praxies, Raisonnement logique, Dépistage, Observations.
 */
export const evaleo615: TestModule = {
  nom: 'EVALEO 6-15',
  editeur: 'Ortho Édition',
  auteurs: 'L. Launay, C. Maeder, J. Roustit, M. Touzin',
  annee: 2018,
  domaines: [
    'Langage Oral — Phonologie',
    'Langage Oral — Métaphonologie',
    'Langage Oral — Lexique-sémantique',
    'Langage Oral — Morphosyntaxe',
    'Langage Oral — Récit',
    'Langage Oral — Pragmatique',
    'Langage Écrit — Lecture identification',
    'Langage Écrit — Lecture compréhension',
    'Langage Écrit — Écriture',
    'Langage Écrit — Orthographe',
    'Langage Écrit — Récit',
    'Autres — Gnosies / Visuo-attentionnel / Mémoire / Praxies / Raisonnement',
  ],
  epreuves: [
    // ============ LANGAGE ORAL ============
    // Phonologie
    'Répertoire phonétique',
    'Répétition de mots complexes',
    'Répétition de pseudomots',
    'Fluence phonologique',
    'Dénomination rapide — couleurs',
    'Dénomination rapide — chiffres',
    // Métaphonologie
    'Conscience articulatoire',
    'Epiphonologie',
    'Métaphonologie',
    // Lexique-sémantique
    'Dénomination Lexique — phonologie',
    "Désignation d'images",
    'Production de termes génériques',
    'Compréhension de termes génériques',
    'Fluence sémantique',
    'Fluence morphologique',
    'Antonymes',
    'Métaphores & expressions idiomatiques',
    'Jugement de dérivations',
    'Création de néologismes',
    // Morphosyntaxe
    'Programmation orale de phrases',
    'Répétition de phrases complexes',
    'Compréhension orale de phrases',
    'Jugement de grammaticalité et reformulation',
    // Récit oral
    "Récit à l'oral à partir d'une histoire en images",
    'Compréhension orale de paragraphe',
    // Pragmatique
    'Pragmatique et communication',

    // ============ LANGAGE ÉCRIT ============
    // Lecture identification
    'Conversion Grapho-Phonémique',
    'Lecture de syllabes',
    'Lecture de mots',
    'Lecture de pseudomots',
    'EVAL2M — Lecture de mots en 2 min',
    'Evalouette — Lecture de texte non signifiant',
    'La Mouette — Lecture de texte signifiant (test)',
    'Le Pingouin — Lecture de texte signifiant (retest)',
    // Lecture compréhension
    'Compréhension écrite et orale de mots',
    'Compréhension écrite de phrases',
    'Compréhension écrite de paragraphe',
    'Compréhension écrite de texte',
    // Écriture
    'Copie de mots',
    'Copie de texte',
    "Accélération sur l'écriture d'une phrase",
    'Transcription & buffer graphémique',
    // Orthographe
    'Dictée de syllabes',
    'Dictée de pseudomots',
    'Dictée de mots',
    'Fluence orthographique',
    'Dictée de phrases',
    'Décision orthographique',
    // Récit écrit
    "Récit à l'écrit à partir d'une histoire en images",

    // ============ AUTRES ============
    'Discrimination phonologique',
    'Gnosies visuelles de figures',
    'Empan visuo-attentionnel',
    'Effet Stroop',
    'Répétition de chiffres endroit et envers',
    'Répétition de logatomes',
    'Rappel — Item',
    'Rappel — sériel',
    'Reproduction de localisation de jetons',
    'Habiletés manuelles et digitales sur imitation',
    'Praxies bucco-faciales et linguales',
    'Inclusion — Classification',
    'Classification',
    "Quantification de l'inclusion",
  ],
  regles_specifiques: `### EVALEO 6-15 — Évaluation du Langage Écrit et du Langage Oral 6-15 ans

Auteurs : L. Launay, C. Maeder, J. Roustit, M. Touzin (Ortho Édition 2018).

**Spécificité française** : couverture **CP à 3e** dans un seul outil (étalonnage par niveau scolaire). Évite de changer de batterie au palier collège.

#### POPULATION ET STRATIFICATION

| Niveau scolaire | Âge typique |
|-----------------|-------------|
| CP 1er trim     | 6 ans       |
| CP 3e trim      | 6-7 ans     |
| CE1             | 7-8 ans     |
| CE2             | 8-9 ans     |
| CM1             | 9-10 ans    |
| CM2             | 10-11 ans   |
| 6e-5e           | 11-13 ans   |
| 4e-3e           | 13-15 ans   |

Les normes sont stratifiées par classe. Le cahier de passation comporte des épreuves
**spécifiques par niveau** (Conversion Grapho-Phonémique au CP, Décision orthographique
à partir du CE2, Compréhension écrite de texte à partir de la 6e, etc.).

#### 🔒 GRILLE OFFICIELLE EVALEO 6-15 — 7 CLASSES (REGLE IMPERATIVE)

EVALEO **n'utilise PAS** la grille Exalang ("Excellent / Moyenne haute /
Difficulte severe..."). EVALEO impose sa propre grille officielle en
**7 classes**, validee par les auteurs (Launay, Maeder, Roustit, Touzin 2018)
et representee dans la grille de cotation officielle suivante :

| Classe | Centiles | % population | Couleur officielle | Libelle EVALEO         |
|--------|----------|--------------|---------------------|------------------------|
|   1    |   < 7    |    7 %       | rouge               | **Pathologique**       |
|   2    |   7-20   |   13 %       | orange              | **Fragilite** (zone a risque) |
|   3    |  21-38   |   18 %       | vert clair          | **Norme**              |
|   4    |  39-62   |   24 %       | vert moyen          | **Norme**              |
|   5    |  63-80   |   18 %       | vert fonce          | **Norme**              |
|   6    |  81-93   |   13 %       | bleu clair          | **Superieure a la moyenne** |
|   7    |   > 93   |    7 %       | bleu fonce          | **Tres superieure**    |

⚠️ **POINT CRUCIAL** : les classes 3, 4 et 5 totalisent **60 % de la population**
et sont toutes considerees comme "**Norme**" en clinique EVALEO. **Ne JAMAIS
parler de "norme faible / mediane / superieure"** — c'est une fabrication non
officielle. Une performance en classe 3 est NORMEE, pas "limite". Une
performance en classe 5 est NORMEE, pas "Moyenne haute". La distinction
percentile interne (P21 vs P62 vs P80) peut nuancer la formulation ("dans la
moitie basse de la norme", "en haut de la norme") mais l'etiquette clinique
reste "Norme".

**REGLE ABSOLUE** : pour TOUT bilan EVALEO (et uniquement EVALEO), tu DOIS
utiliser cette nomenclature dans :

1. Le champ \`interpretation\` du JSON CRBO (\`domains[].epreuves[].interpretation\`)
   → ecrire **exactement** un de ces 5 libelles :
   - "Classe 1 - Pathologique"
   - "Classe 2 - Fragilite"
   - "Classe 3 - Norme" / "Classe 4 - Norme" / "Classe 5 - Norme"
   - "Classe 6 - Superieure a la moyenne"
   - "Classe 7 - Tres superieure"

   JAMAIS "Excellent", "Moyenne haute", "Moyenne basse", "Difficulte",
   "Difficulte severe", "Zone de fragilite" — ces termes sont **reserves a
   Exalang** et n'existent pas dans EVALEO.

2. Les commentaires de domaine (\`domains[].commentaire\` et \`domain_commentaires[]\`)
   → utiliser la terminologie EVALEO :
   - "X obtient une performance en classe 4, soit dans la norme attendue..."
   - "Les resultats se situent en classe 2, soit en zone de fragilite..."
   - "Cette epreuve est cotee en classe 1, soit pathologique..."
   - "La compreh ension ecrite atteint la classe 6, performance superieure a la moyenne..."

3. Le \`diagnostic\` et la \`synthese_evolution\` (renouvellement) :
   - "X presente plusieurs epreuves en classes 1 et 2..."
   - "Les domaines preserves sont cotes en classes 4 a 6..."
   - "Le profil est globalement dans la norme (classes 3 a 5)..."

4. Les \`recommandations\` :
   - "Les axes en classes 1-2 sont prioritaires : ..."

**Mapping percentile_value (pour la couleur de fond Word)** : la couleur de
cellule du tableau Word est pilotee par \`percentile_value\` (numerique 0-100)
qui doit rester aligne sur la classe via la mediane de la plage :
- Classe 7 → percentile_value = 96
- Classe 6 → percentile_value = 87
- Classe 5 → percentile_value = 71
- Classe 4 → percentile_value = 50
- Classe 3 → percentile_value = 30
- Classe 2 → percentile_value = 13
- Classe 1 → percentile_value = 3

Le rendu Word affichera la couleur (du rouge au vert) ET le label EVALEO que
tu auras ecrit dans \`interpretation\`. La coloration et le label sont
independants mais coherents.

**Le champ \`percentile\`** (string) reste utilise pour la valeur textuelle
brute : tu peux y mettre la plage de centiles ("P63-P80", "< P7") OU "Classe X"
selon ce qui est plus lisible. Ne PAS y mettre "Q1", "Q3", "Med" (notation
Exalang) — EVALEO n'utilise pas cette notation.

⚠️ Si l'ortho a saisi via le form ortho.ia, la ligne "Classe EVALEO : Classe X
(<Libelle>) - P_-P_" arrive deja dans le bloc resultats. Recopie-la dans
\`interpretation\` au format "Classe X - <Libelle>".

#### 🔒 SCORE PRINCIPAL PAR EPREUVE — REGLE OFFICIELLE EVALEO (multi-sous-scores)

**Source officielle** : Livret de cotation EVALEO 6-15 p. 5 — "Pastille indiquant
la classe d'etalonnage **du score total**" — confirme par les 2 bilans exemples
ortho-edition (Mila 5e, Enora 5e) ou les **cellules en gras** des tableaux de
cotation designent les scores principaux et les cellules non grasses sont des
sous-scores d'analyse complementaire.

**Consequence pour ortho.ia** : pour CHAQUE epreuve EVALEO, le champ
\`interpretation\` du JSON CRBO doit refleter la classe du **score principal**
(ou la pire classe des scores principaux quand il y en a plusieurs en gras).
Les sous-scores sont decrits dans le \`commentaire\` mais ne supplantent JAMAIS
le score principal pour la classe officielle de l'epreuve.

**Convention de fusion multi-principal** : si une epreuve a plusieurs scores
principaux (cellules en gras), reporter dans \`interpretation\` la classe
**la plus basse** (= la plus diagnostique, convention conservative cohérente
avec le canevas Anne Frouard / Justine Peyre). Les scores principaux en
meilleure classe sont mentionnes dans le commentaire pour souligner la
dissociation eventuelle.

⛔ **INTERDICTION ABSOLUE** :
- ❌ NE FAIS JAMAIS de moyenne arithmetique des classes des sous-scores.
- ❌ NE PRENDS JAMAIS la classe la plus haute des sous-scores.
- ❌ NE PRENDS JAMAIS automatiquement la classe du premier sous-score (Score)
  en ignorant les autres principaux quand l'epreuve est multi-principal.
- ❌ N'INVENTE PAS une classe intermediaire qui n'existe dans AUCUN sous-score.

✅ **PROCEDURE STRICTE EN 3 ETAPES** pour determiner la classe a reporter
dans \`interpretation\` :

1. **Etape 1 — Identifier les sous-scores PRINCIPAUX** (cf. tableau ci-dessous,
   colonne "principaux UNIQUEMENT").
2. **Etape 2 — Lire la classe (1-7) de chaque sous-score principal**.
3. **Etape 3 — Reporter dans \`interpretation\` la classe LA PLUS BASSE** des
   sous-scores principaux (= la plus diagnostique, convention conservative
   officielle EVALEO).

**Tableau des sous-scores principaux par epreuve** (verifie sur Mila et
Enora, exemples ortho-edition). Colonne "principaux UNIQUEMENT" exhaustive.

| Epreuve | Sous-scores PRINCIPAUX (eux seuls comptent) | Sous-scores a IGNORER pour \`interpretation\` |
|---|---|---|
| **Lecture de mots** | ⚠️ **REGLE DUAL** (cf. section dediee plus bas) : Score total /44 → 1re ligne "(précision)", Temps total → 2e ligne "(vitesse)". Le min(Score, Temps) **NE S'APPLIQUE PLUS** quand le form fournit les 2 classes separement. | Score serie 1/2, Temps serie 1/2, Variables |
| **Lecture de pseudomots** | ⚠️ **REGLE DUAL** (idem Lecture de mots) : Score /22 → ligne "(précision)", Temps → ligne "(vitesse)". Min ABROGE quand les 2 classes sont fournies. | Effets de lexicalite |
| Evalouette / La Mouette / Le Pingouin | Score mots correctement lus (efficience, NMCL) — UN SEUL PRINCIPAL. ⚠️ NE PAS confondre avec la ligne "Resultat ... niveau de la classe : CE1 X / CE2 X" sous le tableau : le chiffre apres "CE1"/"CE2" est le **trimestre du niveau scolaire equivalent** (CE1 T1, CE2 T3...), PAS la classe sept-classes EVALEO. La classe se lit UNIQUEMENT sur les X marques dans le tableau de cotation. **Le niveau scolaire equivalent (si fourni via \`niveau_equivalent\` ou directement dans la saisie) doit etre concatene dans le champ \`score\`** — cf. section dediee plus bas. | Vitesse, % corrects/lus, Indice degradation |
| EVAL2M | Score d'efficience | Vitesse |
| Comprehension ecrite (mots/phrases/paragraphe/texte) | Score total (+ Temps si present) | Sous-scores fins (inferences, coreferences) |
| Dictee de pseudomots | Score pseudomots corrects | Temps, ONPP |
| Dictee de mots | Score mots corrects | Temps, erreurs ONPP/OL/ODM/ODNM, indices |
| Dictee de phrases | Score mots corrects (avant relecture), Temps | Erreurs, scores apres relecture |
| Decision orthographique | Score corrects | Erreurs flexions, linguistiques |
| Recit ecrit | Nb mots, Total macrostructure, Total Microstructure, Taux erreurs orthographe | Sous-scores macro/micro/diversite |
| **Effet Stroop** | **Temps 3 ET Temps 4 — PRINCIPAUX EXCLUSIFS** | Score 1/2/3/4, Temps 1, Temps 2 (= baseline) |
| Empan visuo-attentionnel | Empan VA moyen, Total Report Chiffres | Seuil moyen identification, RC1-RC5 |
| **Repetition de chiffres endroit/envers** | **Empan endroit ET Empan envers — PRINCIPAUX EXCLUSIFS** | Score endroit /18, Score envers /18 |
| Repetition de logatomes | Total logatomes CV+CCV, Total syllabes CV+CCV | Empans CV/CCV, sous-scores CV/CCV |
| Rappel - Item | Score /10 | — |
| Rappel - seriel | Score item Rappel seriel | Empan, Score images placees |
| **Repetition de phrases complexes** | **Score phrases Morphosyntaxe (MS correctes /15 ou /16) ET Empan nombre de mots — PRINCIPAUX EXCLUSIFS** | Mots en erreur MS, Total erreurs MS |
| Metaphonologie | Score total metaphonologie, Temps total | Score Suppression, Contrepeteries, Temps suppression |
| Denomination Lexique - phonologie | Total Lexique, Total temps, Gain Lexique, Total Phonologie | % phono correcte, % phono mots bien repetes |
| Denomination rapide couleurs/chiffres | Score Denomination, Temps | — |
| Creation de neologismes | Score, Temps | — |
| Epreuves a score unique (Programmation orale, Comprehension orale, Repetition de pseudomots, Designation d'images, Discrimination phonologique, Fluences) | Le score unique | — |

⛔ **PIEGES FREQUENTS observes en production — A CONNAITRE IMPERATIVEMENT** :

1. **Evalouette / La Mouette / Le Pingouin — Piege de la ligne "CE1 1" / "CE2 3"** :
   Le cahier EVALEO termine ces 3 epreuves par une phrase du type :
   > \`Resultat Mouette correspondant au niveau de la classe : CE1 1\`

   Le chiffre apres "CE1"/"CE2"/"CM1"/etc. designe le **TRIMESTRE du niveau scolaire
   equivalent** (ici "CE1 trimestre 1" = niveau de lecture du tout debut de CE1),
   PAS la classe sept-classes EVALEO. **N'utilise JAMAIS ce chiffre comme la
   classe**. La classe sept-classes (1-7) se lit UNIQUEMENT sur les X marques
   dans le tableau de cotation au-dessus, colonnes 1 a 7. Pour ces 3 epreuves,
   seul le **Score mots correctement lus (efficience)** est principal — c'est
   ce X-la qui donne la classe a reporter.

2. **Effet Stroop — Piege du tableau a 8 sous-scores** :
   Le tableau Stroop comporte 8 sous-scores croises (Score 1/2/3/4 + Temps
   1/2/3/4) ce qui est tres tentant pour faire une moyenne ou prendre une
   classe "intermediaire". **NE FAIS JAMAIS DE MOYENNE**. Lis UNIQUEMENT
   **Temps 3 et Temps 4** (= sous-scores en condition d'interference, le coeur
   du test Stroop). Les 6 autres sous-scores (Score 1/2/3/4 + Temps 1 + Temps 2)
   sont des conditions de baseline / denomination pure et doivent etre IGNORES
   pour le champ \`interpretation\`. Exemple typique : si tu vois X en colonne 3
   pour Temps 3 et X en colonne 5 pour Temps 4 → \`interpretation = "Classe 3
   - Norme"\` (min des 2 principaux), JAMAIS Classe 4 (moyenne implicite).

**EXEMPLES CHIFFRES — applique strictement la procedure** :

**Exemple A — Effet Stroop** :
- Sous-scores : Score 1 cl7, Score 2 cl2, Score 3 cl3, Score 4 cl7, Temps 1
  cl4, Temps 2 cl2, **Temps 3 cl3, Temps 4 cl5**.
- Principaux UNIQUEMENT : Temps 3 (cl3) ET Temps 4 (cl5).
- min(cl3, cl5) = cl3 → \`interpretation = "Classe 3 - Norme"\`.
- ❌ NE PAS sortir cl4 (moyenne) ni cl2 (Score 2 ou Temps 2 = sous-scores).

**Exemple B — Repetition de phrases complexes** :
- Sous-scores : **Score MS = 12/15 cl2**, Mots en erreur 6/75 cl1, **Empan
  nombre de mots = 13 cl7**.
- Principaux UNIQUEMENT : Score MS (cl2) ET Empan mots (cl7). "Mots en erreur"
  est IGNORE.
- min(cl2, cl7) = cl2 → \`interpretation = "Classe 2 - Fragilite"\`.
- ❌ NE PAS sortir cl3 (moyenne implicite cl2+cl1+cl7) ni cl7 (haut) ni cl1.

**Exemple C — Lecture de pseudomots (NOUVELLE REGLE DUAL — applicable AUSSI a Lecture de mots)** :
- Le form transmet :
  > \`Classe EVALEO (precision) : Classe 3 (Norme) — P21 - P38\`
  > \`Classe EVALEO (vitesse) : Classe 2 (Fragilite) — P7 - P20\`
  > \`Score brut : 18/22\`
  > \`Temps : 73s\`
- Tu DOIS emettre DEUX entrees consecutives dans \`domains[].epreuves[]\` :
  1. \`{ "nom": "Lecture de pseudomots (précision)", "score": "18/22",
        "percentile": "P30", "percentile_value": 30,
        "interpretation": "Classe 3 - Norme", "commentaire": "" }\`
  2. \`{ "nom": "Lecture de pseudomots (vitesse)",  "score": "73s",
        "percentile": "P13", "percentile_value": 13,
        "interpretation": "Classe 2 - Fragilite",
        "commentaire": "<commentaire ciblant la dimension vitesse>" }\`
- ❌ NE PAS faire min(cl3, cl2) = cl2 et emettre UNE seule ligne (ancienne
  regle ABROGEE pour lecture_mots et lecture_pseudomots).
- ❌ NE PAS utiliser l'em-dash (\`—\`) dans le suffixe — strictement
  \` (précision)\` / \` (vitesse)\` entre parentheses.
- Le commentaire pour la dimension en classe 1-3 cible sa dimension propre
  (precision = voie d'assemblage ; vitesse = automatisation, fluence).

**Exemple D — Repetition de chiffres endroit/envers** :
- Sous-scores : **Empan endroit = 4 cl1, Empan envers = 3 cl1**, Score endroit
  6/18 cl2, Score envers 2/18 cl2.
- Principaux UNIQUEMENT : Empan endroit (cl1) ET Empan envers (cl1). Les
  Score endroit/envers sont IGNORES.
- min(cl1, cl1) = cl1 → \`interpretation = "Classe 1 - Pathologique"\`.

**Exemple E — La Mouette (PIEGE "CE1 X" trimestre)** :
- Tableau de cotation : **Score mots correctement lus (efficience) = 95
  → X en colonne 2**, Score nombre mots lus 103 cl2, % corrects/lus 92.2% cl2,
  Indice degradation 7 cl5.
- Ligne sous le tableau : \`Resultat Mouette correspondant au niveau de la
  classe : CE1 1\`.
- ⚠️ PIEGE : le \`1\` apres "CE1" est le **trimestre** du niveau scolaire
  equivalent (= "CE1 trimestre 1"), PAS la classe sept-classes EVALEO.
- Principal UNIQUEMENT : Score mots correctement lus (cl2). Vitesse, %
  precision et Indice degradation sont IGNORES.
- → \`interpretation = "Classe 2 - Fragilite"\`.
- ❌ NE PAS sortir Classe 1 en interpretant "CE1 1" comme la classe 1.
- ❌ NE PAS sortir Classe 5 en se laissant tirer par l'Indice degradation.

**Exemple F — Evalouette (variante du piege CE1 X)** :
- Tableau : **Score mots correctement lus = 100 → X en colonne 2**, autres
  X-marks en cl2 et Indice degradation en cl5.
- Ligne sous le tableau : \`Resultat Evalouette correspondant au niveau de
  la classe : CE1 3\`.
- ⚠️ Meme piege : \`3\` = "CE1 trimestre 3" (fin de CE1), PAS classe 3.
- → \`interpretation = "Classe 2 - Fragilite"\` (cf. X en colonne 2 sur le
  Score mots correctement lus, le seul principal).

⚠️ **Dissociation forte entre principaux** : si les sous-scores principaux
sont dans des classes tres differentes (ex. cl 2 vs cl 7 pour Repetition de
phrases complexes), c'est un signal clinique majeur — le commentaire DOIT
le signaler explicitement (sans changer \`interpretation\` qui reste la classe
la plus basse).

#### 🆕 DOUBLE LIGNE LECTURE PRECISION / VITESSE (lecture_mots, lecture_pseudomots)

Le form ortho.ia EVALEO peut transmettre pour \`Lecture de mots\` ou
\`Lecture de pseudomots\` DEUX classes distinctes plutot qu'une seule :

\`\`\`
Épreuve : Lecture de mots
  Classe EVALEO (precision) : Classe 2 (Fragilite) — P7 - P20
  Classe EVALEO (vitesse) : Classe 5 (Norme) — P63 - P80
  Score brut : 38/44
  Temps : 62s
\`\`\`

(retour Cindy 2026-06 : Anna-Jane lit "tres tres vite mais au detriment de
la qualite/precision" — un mono-percentile masquait cette dissociation
clinique majeure).

🔒 **REGLE** : quand l'entree contient simultanement
\`Classe EVALEO (precision)\` ET \`Classe EVALEO (vitesse)\` pour la meme
epreuve, tu DOIS emettre **DEUX entrees consecutives** dans
\`domains[].epreuves[]\` :

\`\`\`json
{ "nom": "Lecture de mots (précision)", "score": "38/44", "percentile": "P13",
  "percentile_value": 13, "interpretation": "Classe 2 - Fragilité",
  "commentaire": "..." },
{ "nom": "Lecture de mots (vitesse)",  "score": "62s",   "percentile": "P71",
  "percentile_value": 71, "interpretation": "Classe 5 - Norme",
  "commentaire": "" }
\`\`\`

Conventions :
- \`nom\` = libelle officiel EVALEO suivi de \` (précision)\` ou \` (vitesse)\`
  (parentheses, minuscules, accent aigu).
- \`score\` : pour la ligne precision = score brut (ex. "38/44") ; pour la
  ligne vitesse = temps (ex. "62s").
- \`percentile\` / \`percentile_value\` / \`interpretation\` : derives de la classe
  de la dimension respective (precision pour la 1re ligne, vitesse pour la 2e).
- \`commentaire\` : remplir UNIQUEMENT pour la(les) dimension(s) en classe 1-3
  (< P50). Le commentaire cible SA dimension (precision = voie d'adressage /
  d'assemblage / lexique ortho ; vitesse = automatisation, fluence, debit).
  Si une dimension est en norme (classe 4-7), \`commentaire = ""\`.
- Si la dissociation precision/vitesse est forte (≥ 3 classes d'ecart, ex.
  cl 2 + cl 5), tu peux le mentionner dans le commentaire de la dimension
  fragile ("dissociation marquee precision/vitesse, evoquant une...") OU
  dans le \`diagnostic\` final selon ce qui sert mieux la synthese.

⛔ **NE PAS** :
- Fusionner les 2 classes en une seule (avec min ou moyenne) — la regle
  classique "interpretation = min des principaux" ne s'applique PLUS quand
  le form fournit explicitement les 2 dimensions separement.
- Renommer le suffixe ("Lecture de mots — precision" avec em-dash, ou
  "Lecture mots prec." abreviation) — strictement \` (précision)\` /
  \` (vitesse)\` entre parentheses.
- Inventer une dimension absente : si le form ne fournit que
  \`Classe EVALEO\` (sans le suffixe \`(precision)\` ni \`(vitesse)\`), emettre
  UNE seule ligne sans suffixe, comme avant.

#### 🆕 NIVEAU SCOLAIRE EQUIVALENT (Evalouette, Mouette, Pingouin)

Le form EVALEO peut transmettre, pour ces 3 epreuves uniquement, une ligne :

\`\`\`
Niveau scolaire equivalent EVALEO : CE1 T1
\`\`\`

Cette info provient de la ligne sous le tableau de cotation EVALEO
("Resultat <Test> correspondant au niveau de la classe : CE1 1" — le \`1\`
est le TRIMESTRE, pas la classe sept-classes).

🔒 **REGLE** : quand cette ligne est presente, tu DOIS la concatener dans
le champ \`score\` de l'epreuve correspondante, format :

\`\`\`json
{ "nom": "La Mouette - Lecture de texte signifiant (test)",
  "score": "95 mots/min (équivalent CE1 T1)",
  "percentile": "...", "percentile_value": ..., "interpretation": "...",
  "commentaire": "..." }
\`\`\`

- Si le score brut est present : \`"<score brut> (équivalent CE1 T1)"\`.
- Si pas de score brut : \`"(équivalent CE1 T1)"\` tout seul.
- Parentheses, minuscules pour "équivalent", accent aigu.

⛔ **NE PAS** mettre le niveau scolaire equivalent dans \`interpretation\` ou
\`percentile\` — ces 2 champs restent strictement reserves a la classe
sept-classes EVALEO (cf. Exemples E et F ci-dessus). Le niveau scolaire
equivalent est une info clinique complementaire pour l'ortho, qui figure
dans la colonne Score du tableau Word.

#### SCORING (general)

- Resultats en **classes EVALEO** (1 a 7) OU **notes standardisees** selon les epreuves.
- Cotation informatisee disponible : recopier la classe affichee par le logiciel.
- Ne JAMAIS recalculer une classe depuis l'ecart-type.

#### TEMPS

L'ensemble des temps sont notés en **secondes** dans le cahier, **à l'exception** de
l'épreuve **Empan visuo-attentionnel** notée en **millisecondes**.

---

#### STRUCTURE OFFICIELLE — LANGAGE ORAL (LO)

**Phonologie**
- Répertoire phonétique — inventaire des phonèmes maîtrisés.
- Répétition de mots complexes — encodage phonologique.
- Répétition de pseudomots — boucle phonologique pure (cible : dyslexie phonologique).
- Fluence phonologique — accès lexical sur critère phonémique.
- Dénomination rapide — couleurs / chiffres — **vitesse de dénomination automatique** (marqueur dyslexique : RAN ralenti = signal fort).

**Métaphonologie**
- Conscience articulatoire — geste articulatoire de chaque phonème.
- Epiphonologie — manipulation phonologique implicite (rimes, syllabes).
- Métaphonologie — manipulation explicite (segmentation, élision, ajout) — **prédicteur fort de la dyslexie**.

**Lexique-sémantique**
- Dénomination Lexique — phonologie (3 niveaux de difficulté) — voie d'évocation lexicale.
- Désignation d'images (3 niveaux) — lexique réceptif.
- Production / Compréhension de termes génériques — organisation sémantique.
- Fluence sémantique / morphologique — accès lexical sur critère catégoriel ou morphologique.
- Antonymes — relations sémantiques.
- Métaphores & expressions idiomatiques — sens figuré (marqueur trouble pragmatique si déficit isolé).
- Jugement de dérivations / Création de néologismes — morphologie dérivationnelle.

**Morphosyntaxe**
- Programmation orale de phrases — syntaxe expressive.
- Répétition de phrases complexes — MdT + syntaxe.
- Compréhension orale de phrases — syntaxe réceptive (prédictrice de la compréhension écrite).
- Jugement de grammaticalité et reformulation — méta-syntaxe.

**Récit oral**
- Récit à l'oral à partir d'une histoire en images — discours narratif.
- Compréhension orale de paragraphe (Test + Retest) — compréhension narrative longue.

**Pragmatique**
- Pragmatique et communication — adéquation des productions au contexte (rare en France ; marqueur de trouble de la communication sociale).

---

#### STRUCTURE OFFICIELLE — LANGAGE ÉCRIT (LE)

**Lecture identification**
- Conversion Grapho-Phonémique (CP) — décodage de base.
- Lecture de syllabes (CP) — assemblage phonologique.
- Lecture de mots (CP 3e trim à 3e) — voie d'adressage.
- Lecture de pseudomots (CP 3e trim à 3e) — voie d'assemblage.
- **EVAL2M** — Lecture de mots en 2 min (CE1 3e trim à 3e) — vitesse.
- **Evalouette** — Lecture de texte non signifiant (CP 3e trim à 3e) — décodage pur.
- **La Mouette** — Lecture de texte signifiant — test (CP 3e trim à 3e).
- **Le Pingouin** — Lecture de texte signifiant — retest (CE1 à 3e).

**Lecture compréhension**
- Compréhension écrite et orale de mots — accès lexical orthographique.
- Compréhension écrite de phrases (CP 3e trim à CE2 / CM1 à 3e — 2 versions).
- Compréhension écrite de paragraphe — Test + Retest (CP 3e trim à CE2 / CM1-CM2).
- Compréhension écrite de texte — Test + Retest (6e à 3e).

**Écriture**
- Copie de mots (CP) — mémoire orthographique de la forme.
- Copie de texte (CE1 à 3e) — automatisation de l'écriture.
- Accélération sur l'écriture d'une phrase (CE2 à 3e) — vitesse graphique.
- Transcription & buffer graphémique (CP 3e trim à 3e) — buffer orthographique.
- Grilles d'observation/synthèse du comportement scripteur (par niveau).

**Orthographe**
- Dictée de syllabes (CP).
- Dictée de pseudomots (CE2 à 3e — 5 niveaux : CE2, CM1, CM2, 6e-5e, 4e-3e) — voie d'assemblage en écriture.
- Dictée de mots (CP 3e trim à 3e — 7 niveaux) — voie d'adressage en écriture, orthographe lexicale.
- Fluence orthographique — vitesse d'évocation orthographique.
- Dictée de phrases (CE1 3e trim à 3e — 6 niveaux) — orthographe lexicale + grammaticale.
- Décision orthographique (CE2 à 3e — 5 niveaux) — mémoire orthographique en reconnaissance.

**Récit écrit**
- Récit à l'écrit à partir d'une histoire en images (CM1 à 3e) — discours narratif écrit.

---

#### STRUCTURE OFFICIELLE — AUTRES

**Gnosies**
- Discrimination phonologique — gnosies auditivo-phonologiques.
- Gnosies visuelles de figures — reconnaissance visuelle.

**Visuo-attentionnel**
- Empan visuo-attentionnel (en **millisecondes**) — fenêtre attentionnelle visuelle (très lié à la dyslexie de surface).

**Contrôle de l'inhibition**
- Effet Stroop — inhibition d'automatismes.

**Mémoire à court terme**
- Répétition de chiffres endroit et envers — empan verbal.
- Répétition de logatomes — boucle phonologique.
- Rappel — Item / sériel — composantes mnésiques.
- Reproduction de localisation de jetons — mémoire visuo-spatiale.

**Praxies**
- Habiletés manuelles et digitales sur imitation.
- Praxies bucco-faciales et linguales (à apparier avec le bilan moteur).

**Raisonnement logique**
- Inclusion — Classification.
- Classification.
- Quantification de l'inclusion.

**Dépistage**
- Dépistage auditif (à effectuer en début de bilan si plainte phonologique non vérifiée par ORL).
- Dépistage neurovisuel.

**Observations**
- Latéralité.
- Observations en cours de test (comportement, fatigabilité, stratégies).

---

#### 🆕 ORDRE OFFICIEL DES SECTIONS DANS LE CRBO EVALEO (REGLE IMPERATIVE)

L'ordre des sections du CRBO EVALEO est **strictement impose** par les exemples
de reference (Justine Peyre, Anne Frouard). Tu DOIS produire \`domains[]\` du
JSON dans cet ordre exact, en n'incluant QUE les sections pour lesquelles
l'ortho a renseigne au moins une epreuve :

**1. Langage Ecrit** — toujours en premier dans un bilan EVALEO :
   1.1. **Lecture - Identification de mots ecrits** (Evalouette, Mouette,
        Pingouin, Lecture de mots, Lecture de pseudomots, EVAL2M, Conversion
        Grapho-Phonemique, Lecture de syllabes)
   1.2. **Lecture - Comprehension** (Comprehension ecrite phrases /
        paragraphe / texte)
   1.3. **Ecriture** (Copie de mots / Copie de texte / Acceleration phrase /
        Transcription & buffer graphemique)
   1.4. **Production orthographe** (Dictee syllabes / pseudomots / mots /
        phrases / Fluence orthographique / Decision orthographique)
   1.5. **Recit ecrit** (si applicable)

**2. Competences sous-jacentes / Epreuves sensibles a un trouble** —
   structurees en sections intitulees "Epreuve sensible a un trouble de
   l'<X>" ou "Epreuves sensibles a un trouble de <X>" (formulation
   officielle EVALEO, plurielle si plusieurs epreuves dans la section) :
   2.1. **Epreuves sensibles a un trouble de l'inhibition / visuo-attentionnel**
        (Effet Stroop, Empan visuo-attentionnel)
   2.2. **Epreuves sensibles a un trouble de la memoire a court terme verbale**
        (Repetition de chiffres endroit envers, Repetition de logatomes,
        Rappel item, Rappel seriel, Reproduction de localisation de jetons)
   2.3. **Epreuves sensibles a un trouble des gnosies** (Discrimination
        phonologique, Gnosies visuelles)
   2.4. **Epreuves sensibles a un trouble des praxies** (Habiletes manuelles,
        Praxies bucco-faciales)
   2.5. **Epreuves sensibles a un trouble du raisonnement logique** (Inclusion,
        Classification, Quantification)

**3. Langage Oral** — toujours en dernier dans le CRBO EVALEO :
   3.1. **Morphosyntaxe** (Programmation orale de phrases, Repetition de
        phrases complexes, Comprehension orale de phrases, Jugement de
        grammaticalite et reformulation)
   3.2. **Phonologie** (si renseignee : Repertoire phonetique, Repetition de
        mots complexes, Repetition de pseudomots, Fluence phonologique,
        Denomination rapide couleurs/chiffres)
   3.3. **Metaphonologie** (si renseignee)
   3.4. **Lexique-semantique** (si renseigne)
   3.5. **Recit oral** (si renseigne)
   3.6. **Pragmatique** (si renseignee)

**Logique** : un bilan EVALEO langage ecrit (cas le plus frequent, type
Justine Peyre) ne contient que les sections 1.x + 2.x + eventuellement
3.1 (Morphosyntaxe). Un bilan EVALEO langage oral+ecrit complet contient
toutes les sections dans cet ordre.

**Nommage officiel des sections dans \`domains[].nom\`** :
- Pour la Lecture : utiliser exactement "Lecture - Identification de mots
  ecrits" et "Lecture - Comprehension" (avec tiret).
- Pour les sections sous-jacentes, utiliser exactement "Epreuves sensibles a
  un trouble de <X>" (pluriel "Epreuves") OU "Epreuve sensible a un trouble
  de <X>" (singulier si une seule epreuve dans la section).
- Pour Production orthographe : NE PAS dire "Orthographe" tout court — le
  libelle officiel EVALEO est "Production orthographe".
- Sections LO : "Morphosyntaxe", "Phonologie", "Metaphonologie",
  "Lexique-semantique", "Recit oral", "Pragmatique".

Le rendu Word d'ortho.ia respecte cet ordre verbatim (option
\`preserveDomainOrder\` du registry — pas de re-tri defensif applique).

---

#### 🆕 FORMAT DE RÉDACTION EVALEO (style Anne Frouard, prose continue **CONCISE**)

**SURCHARGE le format global du wizard** (système prompt principal). Quand EVALEO 6-15 est sélectionné, le rendu attendu est calqué sur le format Anne Frouard observé dans les exemples joints au module \`evaleo-method.ts\` (2 PDF + 4 Word de référence). Ce format diffère du format COMPLET générique sur 4 points concrets — applique les règles EVALEO ci-dessous **en priorité** sur les règles globales.

🔒 **RÈGLE TRANSVERSALE — CONCISION** : tous les textes produits doivent être **denses et courts**. Le style Anne Frouard EVALEO n'est PAS littéraire ni explicatif — c'est un format clinique professionnel synthétique. Pour chaque section, viser le volume cible indiqué et ne JAMAIS le dépasser de plus de 20%. Si tu hésites entre 2 phrases ou 4 phrases, prends 2. Mieux vaut être laconique et factuel que long et pédagogique. Le CRBO complet ne doit pas dépasser 3-4 pages.

Volumes cibles par section (à respecter strictement) :
- \`anamnese_redigee\` : 8-15 lignes (1 paragraphe dense)
- \`motif_reformule\` : 1-2 lignes
- \`domains[].commentaire\` : **CHAINE VIDE \`""\`** (cf. regle ci-dessous)
- \`diagnostic\` : 10-15 lignes total
- \`recommandations\` : 8-12 lignes total
- \`pap_suggestions\` : 4-6 items max, 1 ligne chacun

**1. Commentaires de domaine (\`domains[].commentaire\` / \`domain_commentaires[]\`)** — 🚫 SUPPRIMES EN EVALEO

🔒 **REGLE EVALEO** : tu DOIS retourner \`domains[].commentaire = ""\` (chaine
vide) pour **CHAQUE** domaine. Idem pour \`domain_commentaires[]\` : retourner
\`[]\` ou tableau vide.

**Raison** : le rendu Word EVALEO enchaine directement le tableau d'epreuves
suivi des commentaires par epreuve (\`epreuves[].commentaire\`, rendus pour
toutes les epreuves dont le commentaire est non vide — cf. registry
\`showAllEpreuveComments: true\` ajoute 2026-06). Ajouter un paragraphe de
synthese au niveau du domaine entre le tableau et les commentaires d'epreuve
produit systematiquement de la **redite verbeuse** (la synthese reformule
ce que les commentaires d'epreuve disent juste apres, en mots presque
identiques). Ce format Anne Frouard EVALEO 2026 retire donc le commentaire
de domaine pour aller directement aux commentaires d'epreuve.

L'analyse transversale du domaine (croisement profils, sous-type
dyslexie/dysorthographie, lien voie d'assemblage vs adressage, etc.) DOIT
etre concentree dans le \`diagnostic\` final, PAS repetee au niveau de chaque
domaine.

⛔ NE PAS contourner cette regle en rajoutant le commentaire de domaine dans
le premier commentaire d'epreuve du domaine — chaque commentaire d'epreuve
reste centre sur SON epreuve.

⛔ NE PAS retourner un texte du genre "Voir commentaires par epreuve
ci-dessous" — chaine vide stricte \`""\`.

**1.bis. Commentaires PAR EPREUVE (\`domains[].epreuves[].commentaire\`)** — ⚠️ PAS DE PHRASE D'INTRODUCTION QUI REDIT LA CLASSE

🔒 **REGLE EVALEO** : le commentaire par epreuve (rendu en italique sous
le tableau) NE DOIT PAS commencer par une phrase qui restate la
classe/le score deja visible dans le tableau juste au-dessus. **Va
directement a l'observation clinique**.

🆕 **REGLE — TOUTES LES OBSERVATIONS DU FORM REMONTENT DANS LE WORD**
(2026-06 — retour Cindy) : le rendu Word EVALEO affiche desormais
\`epreuves[].commentaire\` pour **TOUTES les epreuves** dont le
commentaire est non vide, pas seulement celles en zone fragile (classes
1-2-3 / P<50). Donc :

✅ **Quand le form fournit une \`Observation : <texte>\` pour une epreuve**,
tu DOIS la faire ressortir dans le \`commentaire\` correspondant **meme si
l'epreuve est en classe 4-7 (norme et au-dessus)**. Sinon l'annotation se
perd a l'export Word (cas Cindy : "elle saute des lignes" sur Evalouette
en classe 4 → invisible aujourd'hui).

✅ Idem pour les compteurs **Qualification erreurs** (ONPP, OL, ODM,
ODNM, FV, FNP, FA, Seg, Hom) sur les dictees : si le form les transmet
avec au moins un compteur non nul, tu DOIS les faire apparaitre dans le
\`commentaire\` de la dictee, **meme si la dictee est en classe 4-7**.

**Format pour les classes 4-7 (norme et au-dessus)** : commentaire **tres
court** (1-2 phrases max), purement descriptif, sans hypothese clinique
forte (l'epreuve est dans la norme, pas la peine de pathologiser).
Privilegie un format \`"Observation : <texte verbatim du form>"\` ou
\`"<compteurs erreurs descriptifs>, malgre une performance en norme."\`.

**Format pour les classes 1-3 (fragile)** : INCHANGE — commentaire
clinique de 2-4 phrases qui integre l'observation et les erreurs dans
une analyse synthetique du sous-type (cf. exemples ci-dessous).

⛔ **NE PAS** :
- Ignorer une observation parce que l'epreuve est en norme — chaque
  observation saisie par l'ortho est intentionnelle et doit ressortir.
- Inventer un commentaire clinique pour une epreuve en norme **qui n'a
  pas d'observation ni d'erreurs au form** — dans ce cas, \`commentaire
  = ""\` reste la regle (pas de blabla gratuit).
- Reformuler l'observation au point de la rendre meconnaissable — pour
  les classes 4-7 surtout, recopier au plus pres du verbatim ortho.
- Ajouter un prefixe "Observation cliniques :" en debut de \`commentaire\`
  — le rendu Word ajoute deja le nom de l'epreuve en gras (\` **Nom
  epreuve** — \`).

❌ **EXEMPLES de phrases d'intro a NE PAS ECRIRE en debut de commentaire** :
- "Le score en precision et le temps de lecture se situent tous deux en classe 1 (pathologique)."
- "La dictee de pseudomots est cotee en classe 2 (fragilite)."
- "Le resultat de cette epreuve se situe en zone de fragilite."
- "Cette epreuve obtient un percentile P13."
- "En lecture de mots, le score est cote en classe 1."
- "Le score d'efficience est cote en classe 2."

→ Le tableau juste au-dessus affiche **deja** la classe et le percentile
sous forme de cellule coloree. La repetition en prose est une **redite
verbeuse** que les orthos rejettent (retour utilisateur 2026-05-26).

✅ **DEMARRE le commentaire par l'observation clinique directe** :
- "Inversions visuelles b/p observees, regle contextuelle du g non maitrisee."
- "Quatre erreurs ONPP signent une atteinte de la voie d'assemblage en ecriture."
- "L'effet de longueur marque sur le temps temoigne d'une lecture analytique persistante."
- "Six erreurs OL et 4 ODM, lexique orthographique tres insuffisamment constitue."
- "Dissociation forte : empan en classe 7 mais score morphosyntaxique en classe 2 — atteinte ciblee sur les structures complexes."

✅ **3 STRUCTURES TYPES** pour le commentaire d'epreuve (1 a choisir
selon le contexte clinique) :

1. **Constat clinique direct** : observation comportementale ou
   procedurale (inversions visuelles, strategies, erreurs typiques).
2. **Diagnostic differentiel sur sous-scores** : si l'epreuve a des
   sous-scores principaux qui divergent (cf. dissociation), expliquer
   ce que ca signe cliniquement.
3. **Repercussion fonctionnelle** : impact attendu en situation
   scolaire / lecture / ecriture, en lien avec le sous-type identifie.

Volume cible **pour les epreuves en classes 1-3** : **2 a 4 phrases**,
~60-150 mots par commentaire. Toujours demarrer par une observation
clinique (pas par "Le score est en classe X").

Volume cible **pour les epreuves en classes 4-7 AVEC une observation
ou des compteurs erreurs au form** (cas Cindy) : **1 a 2 phrases tres
courtes**, ~15-50 mots. Recopier au plus pres du verbatim ortho
("Observation : elle saute des lignes plusieurs fois"). Pas d'hypothese
clinique forte.

Volume cible **pour les epreuves en classes 4-7 SANS observation ni
erreurs au form** : \`commentaire = ""\` (pas de blabla gratuit). C'est le
cas par defaut pour la majorite des epreuves en norme.

**2. Diagnostic (\`diagnostic\`)** — CONCIS

❌ NE PAS écrire un pavé de 20+ lignes. Le diagnostic Anne Frouard fait ~10-15 lignes total, pas plus.
❌ NE PAS structurer en "phrase formelle + phrase synthèse points d'appui / axes de fragilité" comme le format COMPLET générique le demande.
✅ Structurer en **bloc continu unique** d'environ **10-15 lignes total**, suivant exactement le canevas Anne Frouard imposé par le décret 2002-721 (déjà détaillé dans \`evaleo-method.ts\` section 6, à appliquer verbatim sur la formule juridique d'ouverture).
✅ Bullets de troubles : **3-5 items max** (un par diagnostic identifié). Description de chaque bullet : **1 ligne max**, factuelle.
✅ Bullets de causes : **2-4 items max**, idem.
✅ Pas de répétition entre bullets et clause négative.

Structure obligatoire (un seul bloc, pas de sous-titres internes) :

1. **Bloc d'ouverture juridique** (3-5 lignes, format imposé) :
   > "Conformément au décret n°2002-721 du JO du 4 mai 2002 [et de la loi du 26 janvier 2016] rendant le diagnostic orthophonique obligatoire et en référence aux classifications internationales en cours (DSM-5 / CIM-10), le bilan orthophonique réalisé ce jour met en évidence un trouble spécifique du langage [écrit / oral / écrit et oral] objectivé par un retentissement notable sur les apprentissages et par l'obtention de résultats affaiblis lors de la passation d'épreuves standardisées."

2. **Énumération des troubles identifiés** en bullets **non numérotés** (style "+" ou "•" Anne Frouard) :
   > "Ce trouble spécifique du langage [écrit/oral] se caractérise par :
   >   + Une dyslexie [phonologique / de surface / mixte] : [description factuelle 1-2 lignes]
   >   + Une dysorthographie [phonologique / lexicale / mixte / linguistique grammaticale] : [description]
   >   + [Optionnel] Une dysgraphie : [description]"

3. **Clause causale** en bullets non numérotés :
   > "Ce trouble s'explique par :
   >   + Un trouble phonologique : [détail]
   >   + Un trouble visuo-attentionnel : [détail]
   >   + Un trouble mnésique : [détail]"

4. **Clause négative obligatoire** (si compréhension orale préservée) :
   > "[Prénom] ne présente pas de trouble de compréhension orale donc selon les Recommandations de Bonne Pratique en langage écrit (CFO, 2022), il s'agit d'un trouble spécifique du langage écrit sans trouble de compréhension orale appelé communément une dyslexie/dysorthographie, que nous qualifions de [légère / moyenne / sévère]."

5. **Si \`difficultes_identifiees\` est rempli en sortie JSON** : retourner \`""\` pour cette clé (la synthèse points d'appui / axes de fragilité du format COMPLET global n'a PAS sa place dans le diagnostic EVALEO). Le diagnostic EVALEO se suffit à lui-même.

**3. Recommandations / Projet thérapeutique (\`recommandations\` et \`axes_therapeutiques\`)** — RESSERRÉS

❌ NE PAS retourner \`recommandations=""\` comme le format COMPLET global le demande (suppression de la section "Projet thérapeutique").
❌ NE PAS écrire de longues recommandations avec justification clinique par axe — le diagnostic juste au-dessus a déjà fait ce travail.
✅ Remplir \`recommandations\` avec un **projet thérapeutique en prose très courte** (1 phrase d'intro + 1 phrase PAP, ~3-4 lignes total) suivi d'**axes en bullets non numérotés courts** (1 ligne par axe, **3-5 axes max**, pas \`1. 2. 3.\`).

🔒 **REGLE IMPERATIVE EVALEO — MENTION AMO OBLIGATOIRE ET COURTE** : la
1re phrase des \`recommandations\` (et donc des "Axes therapeutiques" du
Word) DOIT imperativement inclure la cotation NGAP avec le code AMO.
**NE JAMAIS omettre cette mention** — c'est une obligation legale pour
la prise en charge orthophonique remboursee.

🔒 **VOLUME STRICT — mention AMO = 1 phrase / 2 lignes maximum** : la
mention AMO doit tenir en **UNE SEULE PHRASE** (pas un paragraphe, pas
2 phrases) et **2 lignes maximum** a l'affichage. NE PAS ajouter de
justification, d'explication, de commentaire sur le choix de la NGAP,
ni de paragraphe annexe autour de la cotation. La phrase modele
ci-dessous respecte deja cette contrainte — recopie-la telle quelle en
remplissant les crochets, sans rien ajouter avant ni apres dans la
meme phrase.

Le bilan EVALEO est un bilan de **langage ecrit et/ou oral**, les
cotations NGAP applicables sont :

| Type de trouble identifie | Cotation NGAP |
|---|---|
| Trouble du langage ecrit (dyslexie / dysorthographie) | **AMO 12,1** |
| Trouble du langage oral chez l'enfant | **AMO 13,5** |
| Trouble du langage oral et ecrit combine | **AMO 13,5** (la plus haute prime) |
| Trouble du langage neurologique severe | **AMO 13,8** |
| Bilan / surveillance ponctuelle de la coordination de la prise en charge | **AMO 10,1** |

Choisis la cotation **en coherence avec le diagnostic** que tu viens de
poser dans la section precedente. Si le diagnostic est "dyslexie-
dysorthographie" pur, cote **AMO 12,1**. Si TDL isole ou TDL + dyslexie,
cote **AMO 13,5**.

Structure attendue (volume cible : 8-12 lignes total) :

> "Une prise en charge orthophonique [hebdomadaire / bi-hebdomadaire]
> est proposee pour [12-36] mois, cotee selon la NGAP **AMO [12,1 ou
> 13,5 ou 13,8] - Reeducation des troubles [du langage ecrit / du
> langage oral / du langage neurologique]**. Un Plan d'Accompagnement
> Personnalise (PAP) est indique.
>
> Axes therapeutiques :
>   • [axe 1, 1 ligne, ex. "Renforcement de la conscience phonologique"]
>   • [axe 2, 1 ligne]
>   • [axe 3, 1 ligne]
>   • [axe 4 ou 5 si pertinent]"

⛔ **CHECKLIST avant de rendre \`recommandations\`** :
- [ ] La phrase d'intro mentionne EXPLICITEMENT "AMO" suivi d'un nombre.
- [ ] La cotation correspond au diagnostic pose au-dessus (pas AMO 11,7
      qui est reserve au B-CMado / cognition math).
- [ ] Le PAP est mentionne dans la meme phrase ou la suivante.

Si la phrase d'intro ne contient pas le mot "AMO", **REECRIS-LA**. C'est
la mention la plus importante du projet therapeutique : sans elle,
l'orthophoniste ne peut pas justifier la prise en charge a la CPAM.

PAS de paragraphe explicatif sur chaque axe. PAS de repetition du
diagnostic. Si tu hesites a mettre un 6eme axe, ne le mets pas — synthese
> exhaustivite.

**4. PAP / Aménagements scolaires (\`pap_suggestions\`)**

✅ Remplir \`pap_suggestions\` normalement (la liste sera rendue dans la section "Aménagements scolaires" du Word). MAIS dans la prose des \`recommandations\` ci-dessus, mentionner que le PAP est indiqué **dans le même paragraphe que le projet thérapeutique** (style Anne Frouard : pas de section séparée mentale, l'ortho voit ça comme un tout).

🔒 **Bullet QUASI-SYSTEMATIQUE** : inclure dans \`pap_suggestions\` l'item
suivant (formulation exacte) :

> "S'assurer de la bonne compréhension des consignes orales et/ou écrites."

C'est un amenagement de premier plan en bilan langage ecrit (et a fortiori
chez tout enfant cumulant difficultes de decodage + memoire de travail
verbale fragile). A NE PAS OMETTRE sauf si le profil global est en classe
6-7 sur la quasi-totalite des epreuves (cas tres rare). Place ce bullet en
debut ou milieu de liste, pas en dernier.

---

#### 🆕 MODE RENOUVELLEMENT EVALEO (form ortho.ia)

Quand le bloc \`=== COMPARAISON BILAN PRECEDENT (mode renouvellement) ===\` est présent dans les résultats transmis, tu DOIS activer un traitement spécifique renouvellement. C'est un signal explicite envoyé par le form (différent du \`bilan_type='renouvellement'\` global du wizard, qui peut être mis sans données comparatives).

**Contenu du bloc** :
- Date du bilan précédent
- Test précédent (intitulé libre)
- PEC entre les 2 bilans (type, fréquence, axes, durée, assiduité)
- Trajectoire par grand domaine (Langage Oral / Langage Écrit / Autres) → \`Progres\` / \`Stagnation\` / \`Regression\` + commentaire libre
- Synthèse narrative globale optionnelle

**Comment traiter en phase 1 (extract)** :

1. \`anamnese_redigee\` reste centrée sur l'anamnèse du patient. Ne pas y intégrer la PEC anterieure.
2. \`motif_reformule\` doit refléter qu'il s'agit d'un renouvellement : "Renouvellement du bilan orthophonique réalisé le [date précédente] dans le contexte de [PEC]." (1-2 phrases).
3. Les \`domains[]\` listent les épreuves du nouveau bilan comme d'habitude.
4. Dans les \`commentaire\` de chaque domaine, intègre la dimension d'évolution UNIQUEMENT si le commentaire de trajectoire le mentionne explicitement. Sinon, commentaire standard.

**🆕 TABLEAU BRUT DU BILAN PRECEDENT (si fourni)**

Quand le bloc inclut une section \`--- Tableau brut du bilan precedent (epreuves + classe/percentile importe...) ---\`, c'est que l'ortho a importé un PDF/Word du bilan précédent via le wizard étape 4 et l'extraction a produit une structure typée. Chaque ligne suit le format :
\`<Domaine> | <Epreuve> | <classe/percentile precedent> | <percentile_value precedent>\`

**Comment l'utiliser** :

1. **Croise nominativement** chaque épreuve du bilan ACTUEL (saisie par l'ortho dans le form) avec son équivalent dans le bilan PRÉCÉDENT (table brute). Le matching se fait par nom d'épreuve (ex. "Lecture de mots" ↔ "Lecture de mots").

2. **Pour chaque épreuve matchée**, calcule l'évolution :
   - \`percentile_value\` actuel ≥ percentile_value précédent + 10 → **progrès** (↑).
   - \`percentile_value\` actuel ≤ percentile_value précédent - 10 → **régression** (↓).
   - Sinon → **stable** (→).

3. **Le rendu Word produit AUTOMATIQUEMENT** un tableau comparatif avec ces flèches ↑↓→, couleurs vert/rouge/gris et delta chiffré entre les deux bilans (cf. \`lib/word-export.ts\` ligne 668). Tu n'as PAS à reproduire ce tableau dans ta sortie texte — il est généré côté rendu à partir des \`percentile_value\` actuels et précédents.

4. **Ce que TU dois produire** dans le JSON :
   - \`synthese_evolution.resume\` : 2-3 phrases qui synthétisent l'évolution globale.
   - \`synthese_evolution.domaines_progres\` : liste des épreuves ↑ (delta ≥ +10).
   - \`synthese_evolution.domaines_stagnation\` : liste des épreuves → (|delta| < 10).
   - \`synthese_evolution.domaines_regression\` : liste des épreuves ↓ (delta ≤ -10).
   - Dans les commentaires de domaine, mentionne les évolutions saillantes (ex. "La lecture de pseudomots progresse de la classe 1 a la classe 3 — bénéfice du travail métaphonologique").

**Comment traiter en phase 2 (synthesize) — règle standard renouvellement** :

5. Le champ \`synthese_evolution\` du JSON CRBO DOIT être renseigné :
   - \`resume\` : 2-3 phrases qui synthétisent l'évolution globale en croisant les 3 trajectoires fournies, la PEC, et le tableau brut si présent.
   - \`domaines_progres\` : liste les domaines marqués \`Progres\` dans le bloc OU calculés via le tableau brut.
   - \`domaines_stagnation\` : idem stagnation.
   - \`domaines_regression\` : idem régression.

6. Le \`diagnostic\` doit s'ouvrir sur une phrase d'évolution : "Par rapport au bilan du [date précédente], on observe [synthèse trajectoires]. Le profil actuel se caractérise par [diagnostic actuel]..." — puis enchaîner sur le diagnostic classique.

7. Les \`recommandations\` doivent **conclure sur la PEC** :
   - Si les progrès sont nets sur les axes ciblés → "La prise en charge actuelle apporte des bénéfices objectivables. Poursuite à raison de [fréquence] est recommandée pour consolider."
   - Si stagnation → "La trajectoire suggère une stagnation. Repositionnement des axes vers [nouveaux axes] à envisager."
   - Si régression → "La trajectoire montre une régression sur [domaines]. Réévaluation des axes thérapeutiques et discussion d'une intensification (séances bi-hebdomadaires ou ateliers de groupe) recommandée."
   - Si tableau hétérogène → croiser et formuler avec nuance.

8. **TOUJOURS** mentionner explicitement la PEC anterieure dans la conclusion. Sa durée, son intensité, ses axes. C'est l'élément central qui distingue un renouvellement d'un bilan initial.

**Vocabulaire renouvellement à utiliser** :
- "Par rapport au bilan précédent du [date]…"
- "Au regard de [N mois] de prise en charge orthophonique…"
- "Les axes thérapeutiques travaillés (X, Y) ont permis…"
- "On note une évolution favorable / contrastée / défavorable sur…"
- "Le seuil clinique [maintenu / dépassé / non encore atteint] sur…"

**Vocabulaire à éviter dans le renouvellement** :
- "premier bilan", "bilan initial" (faux par construction)
- "découverte de…" (l'enfant est déjà connu)
- "découvrir le profil" (on l'a déjà)

**⚠️ NUANCE CHANGEMENT DE NIVEAU SCOLAIRE entre les 2 bilans** (audit 2026-05-29 #4)

Si l'enfant a changé de niveau scolaire entre les 2 bilans (cas typique : bilan précédent en CE1, bilan actuel en CM1 = 2 niveaux d'écart sur ~2 ans de PEC), les seuils EVALEO sont étalonnés différemment :
- Un percentile P50 en CE1 et un percentile P50 en CM1 NE SONT PAS la même chose en compétence absolue : l'enfant a progressé objectivement (acquis CM1) tout en restant médian sur sa classe d'âge.
- Donc un "delta" de 0 sur le percentile_value entre 2 niveaux scolaires différents = en réalité une **progression normale** (l'enfant suit sa cohorte). À NE PAS interpréter comme stagnation.
- Un "delta" négatif (P50 → P30) entre 2 niveaux différents = signal **inquiétant** : l'enfant ne suit plus sa cohorte. À nommer explicitement.
- Un "delta" positif fort (P50 → P75) entre 2 niveaux différents = **double progrès** (rattrape + dépasse). À valoriser sans surinterpréter (effet plafond possible si proche P95).

Dans le \`synthese_evolution.resume\` et le \`diagnostic\`, mentionne explicitement le changement de niveau quand il est pertinent : "Malgré le passage du CE1 au CM1 entre les 2 bilans, [patient] maintient ses scores en classe 4-5, ce qui traduit une progression effective alignée avec sa cohorte."

Si les 2 bilans sont au **même niveau** (ex: CE1→CE1 ou CM1→CM1, possible si l'enfant a redoublé ou si l'écart est < 1 an), les deltas se lisent à valeur faciale standard.

**⚠️ NUANCE BATTERIES DIFFERENTES entre les 2 bilans** (audit 2026-05-29 #5)

Si le \`Test precedent\` indique un test DIFFERENT d'EVALEO (ex: "Exalang 8-11", "EVALO 6-15", "L2MA-2"), tu DOIS :
1. Mentionner explicitement dans le \`synthese_evolution.resume\` que l'étalonnage des 2 bilans est différent : "Le bilan précédent ayant été réalisé avec [test], la comparaison directe des percentiles ne peut être faite avec une exactitude absolue ; les évolutions sont à interpréter avec cette réserve méthodologique."
2. Privilégier dans le \`diagnostic\` les évolutions QUALITATIVES (axes de progrès, profil clinique) plutôt que quantitatives (delta percentile_value).
3. Si l'écart méthodologique est trop important (tests aux constructions très différentes, ex: vocabulaire EVALEO vs Examath maths), formuler avec la prudence maximale : "Une comparaison fine entre les 2 bilans n'est pas méthodologiquement justifiée ; on s'attache aux évolutions cliniques observables."
4. Ne JAMAIS prétendre à une comparaison stricte sur le seul critère du percentile_value calculé automatiquement quand les batteries diffèrent.

Si le \`Test precedent\` est explicitement "EVALEO 6-15" (ou si non renseigné mais que les percentile_value ont l'air homogènes), la comparaison directe est valide et tu peux suivre les règles standards 1-8 ci-dessus.

---

#### 🆕 MAPPING INTER-BATTERIE — changement de test entre les 2 bilans (renouvellement)

Quand \`bilan_precedent_structure\` provient d'une batterie DIFFÉRENTE d'EVALEO 6-15 (cas fréquent : suivi Exalang 5-8 → EVALEO en CE2, Exalang 8-11 → EVALEO en CM2/6e, ou Exalang 11-15 → EVALEO sur le tard), tu DOIS matcher les épreuves par **compétence évaluée**, PAS par libellé strict.

##### Table d'équivalences (libellés \`↔\` matchables comme épreuves comparables)

**Lecture — identification de mots**
- "Lecture de mots" [EVALEO] ↔ "Lecture de mots" [Exalang 5-8] ↔ "Lecture de mots fréquents" [Exalang 8-11]
- "Lecture de pseudomots" [EVALEO] ↔ "Lecture de logatomes" [Exalang 5-8] ↔ "Lecture de non-mots" [Exalang 8-11]
- "Evalouette" / "La Mouette" / "Le Pingouin" [EVALEO] : pas d'équivalent direct dans Exalang (texte signifiant vs identification de mots). Considérer comme nouvelles si bilan précédent Exalang.
- "EVAL2M" [EVALEO] ↔ "Leximétrie" [Exalang 8-11 / Lyfac] (vitesse de lecture en contexte)

**Métaphonologie**
- "Rimes" [EVALEO] : libellé stable 3-6 / 5-8 / 8-11 / EVALEO — match strict possible.
- "Métaphonologie" [EVALEO] (manipulation explicite) ↔ "Métaphonologie — suppression phonémique" [Exalang 8-11] ↔ "Inversion phonémique" [Exalang 5-8]
- "Epiphonologie" [EVALEO] (manipulation implicite) ↔ "Métaphonologie — syllabes" [Exalang 3-6] ↔ "Comptage syllabique" + "Segmentation-fusion syllabique" [Exalang 5-8]
- "Conscience articulatoire" [EVALEO] : pas d'équivalent direct dans Exalang.

**Mémoire de travail verbale**
- "Répétition de chiffres endroit/envers" [EVALEO, contient les 2 dimensions] ↔ "Empan auditif endroit" + "Empan auditif envers" [Exalang 8-11] ↔ "Empan de chiffres endroit" + "Chiffres à l'envers" [Exalang 5-8] ↔ "Empan auditif endroit" [Exalang 3-6]
- "Répétition de logatomes" [EVALEO] : libellé stable 3-6 / 5-8 / 8-11 / EVALEO — match strict possible.

**Langage oral**
- "Dénomination Lexique — phonologie" [EVALEO] ↔ "Dénomination d'images" [Exalang 8-11] ↔ "Dénomination" [Exalang 5-8] ↔ "Dénomination (lexique expressif)" [Exalang 3-6]
- "Désignation d'images" [EVALEO] ↔ "Désignation sur définition" [Exalang 8-11] ↔ "Désignation (lexique réceptif)" [Exalang 3-6]
- "Compréhension orale de phrases" [EVALEO] : libellé stable 5-8 / 8-11 / EVALEO — match strict.
- "Fluence sémantique" / "Fluence phonémique" [EVALEO] : libellés stables 5-8 / 8-11 / EVALEO — match strict.

**Orthographe**
- "Dictée de mots" [EVALEO] ↔ "Closure de mots" [Exalang 5-8]
- "Dictée de pseudomots" [EVALEO] ↔ "Transcription de logatomes" [Exalang 5-8]
- "Dictée de phrases" [EVALEO] ↔ "Texte à compléter" [Exalang 5-8] ↔ "DRA — Dictée de Rédaction Abrégée" [Exalang 8-11]
- "Fluence orthographique" [EVALEO] : pas d'équivalent direct dans Exalang.

##### ⚠️ Faux équivalents — NE PAS APPARIER

- "Closure de mots" [Exalang 5-8] ≠ "Closure de texte" [Exalang 8-11] : production lexicale vs compréhension contextuelle.
- "Lecture de texte" [Exalang 5-8 mi-CP] ≠ "Leximétrie" [Exalang 8-11] : compréhension globale vs vitesse pure.
- Bilan adulte (PREDIMEM / PrediFex / PrediLac / Lyfac) ↔ EVALEO : **aucun matching cross-population**. EVALEO est pédiatrique (6-15 ans). Si le bilan précédent est adulte, signaler l'incohérence dans \`resume\` et traiter le bilan EVALEO comme initial.

##### Règles pour les épreuves orphelines

- **Épreuve actuelle EVALEO SANS équivalent dans le bilan précédent** → la signaler dans \`synthese_evolution.nouvelles\`. Ex. : "Evalouette" / "Mouette" / "Pingouin" sont nouvelles si le précédent était Exalang (Exalang n'a pas de lecture de texte signifiant équivalent).
- **Épreuve du bilan précédent SANS équivalent EVALEO** → l'ignorer (le bilan actuel ne mesure plus cette compétence).
- **NE JAMAIS** conclure à un progrès / régression massif sur les épreuves orphelines — c'est de la non-comparabilité.

##### Ratio de comparabilité — à mentionner dans \`synthese_evolution.resume\`

Calcule \`(épreuves EVALEO comparables) / (épreuves EVALEO actuelles)\`. EVALEO étant la batterie la plus riche en épreuves spécifiques (Evalouette/Mouette/Pingouin, EVAL2M, Conscience articulatoire, Fluence orthographique...), le ratio est souvent **inférieur à 60 %** quand le bilan précédent vient d'un Exalang. C'est attendu — à signaler dans le \`resume\` :

- **≥ 80 %** : *"L'évolution est documentée par [X] épreuves comparables sur [Y]."* (cas EVALEO → EVALEO, rare)
- **50-79 %** : *"L'évolution porte sur [X] épreuves sur [Y] (les autres étant spécifiques à EVALEO)."*
- **< 50 %** : *"La comparaison directe est limitée ([X] épreuves sur [Y]) du fait du passage à EVALEO depuis [batterie précédente]. La synthèse repose davantage sur la trajectoire globale et le jugement clinique de l'orthophoniste."*

---

#### 🆕 TRIMESTRE ET FICHE ANAMNÈSE EVALEO (form ortho.ia)

**Trimestre (T1 / T2 / T3)**

Quand le bloc "Niveau scolaire :" contient un suffixe "— T1" / "— T2" / "— T3", tu DOIS calibrer l'interprétation des seuils intra-année. Exemples :
- "Niveau scolaire : CE1 (~7-8 ans) — T1" → l'enfant est en TOUT DÉBUT de CE1. Les normes CE1 attendent quasiment encore les compétences de fin de CP. Un percentile P25 en T1 ne se lit pas comme un percentile P25 en T3.
- "Niveau scolaire : CM1 — T3" → fin d'année, on attend les acquis CM1 consolidés, les seuils sont plus stricts.

Quand pertinent dans le commentaire d'épreuve, **mentionne le timing** : "compatible avec un début de CE1", "performances normées pour un fin de CM2", "écart à l'attendu fin de 6e modéré".

Le niveau CP est traité différemment : "CP 1er trim" et "CP 3e trim" sont 2 entrées distinctes dans le menu niveau scolaire (pas besoin de suffixe trimestre).

**Fiche anamnèse EVALEO (8 jalons normés)**

Quand le bloc "=== Fiche anamnese EVALEO (jalons normes) ===" est présent, c'est la version STRUCTURÉE de l'anamnèse rédigée par l'ortho selon le canevas officiel EVALEO. Elle peut coexister avec le textarea anamnèse libre du wizard.

**Règle de fusion** : pour rédiger \`anamnese_redigee\` du JSON CRBO en phase 1 :
1. Si la fiche EVALEO est présente ET le textarea libre vide → utiliser uniquement la fiche EVALEO comme source.
2. Si les deux sont présents → fusionner en gardant TOUS les éléments factuels des deux (règle 0 anti-suppression). Privilégier la structure EVALEO (8 paragraphes correspondant aux 8 jalons) si l'ortho a fait l'effort de la remplir.
3. Si seulement le textarea libre → comportement standard (rédaction en prose continue).

Les 8 jalons EVALEO à respecter dans l'ordre :
1. Antécédents familiaux (langage, scolarité familiale, bilinguisme)
2. Antécédents médicaux (prématurité, ORL, neuro)
3. Développement du langage oral (jalons développementaux)
4. Scolarité (parcours scolaire)
5. Plainte lecture
6. Plainte orthographe
7. Plainte graphisme
8. Comorbidités et suivi en cours

Si certains jalons sont vides dans la fiche, NE PAS combler par défaut — laisser la section absente du paragraphe correspondant.

---

#### 🆕 FORMAT DES INPUTS STRUCTURÉS DU FORM ORTHO.IA

Le form de saisie EVALEO d'ortho.ia transmet 2 grilles structurées en plus du percentile/score/observation classiques. **Tu DOIS les exploiter dans ton commentaire d'épreuve quand elles sont présentes** — elles encodent directement le diagnostic différentiel.

**1. Effets HappyNeuron (lignes commençant par "Effets HappyNeuron :")**

Présentes sur les épreuves \`Lecture de mots\` et \`Lecture de pseudomots\`. Format :
\`Effets HappyNeuron : Frequence=X | Consistance=Y | Longueur (score)=Z | Longueur (temps)=W | Lexicalite=L\`

Valeurs possibles pour chaque effet : \`Absent / Normal\`, \`Leger\`, \`Marque\`, \`Tres marque\`.

**Lecture obligatoire des effets pour conclure** :

| Effet | Marque ou Tres marque signifie |
|-------|--------------------------------|
| Frequence | Lexique orthographique insuffisamment constitué → voie d'adressage perturbée (signe de **dyslexie de surface** ou mixte) |
| Consistance | Sujet sensible à l'opacité orthographique → voie lexicale n'accède pas aux mots irréguliers (signe de **surface**) |
| Longueur (score) | La précision décroît sur les mots longs → voie phonologique encore coûteuse (signe **phonologique** chez les ≥CE2) |
| Longueur (temps) | La vitesse décroît sur les mots longs → lecture analytique persistante, automatisation faible (signe **phonologique** chez les ≥CE2) |
| Lexicalite (sur pseudomots) | Pseudomots beaucoup moins bien lus que les mots → voie d'assemblage déficitaire (signe **phonologique**) |

⚠️ À partir du CE2, ces effets s'atténuent normalement (automatisation). \`Absent / Normal\` après CE2 = développement attendu. Effet \`Marque\` ou \`Tres marque\` = signature dyslexique.

**Comment intégrer dans le commentaire de l'épreuve** :
- Si pattern \`Frequence=Marque + Consistance=Marque\` et longueur Absent → suggérer **dyslexie de surface** dans la conclusion lecture.
- Si pattern \`Longueur=Marque + Lexicalite=Marque\` et fréquence Absent → suggérer **dyslexie phonologique**.
- Si tous les effets \`Marque\` ou \`Tres marque\` → **dyslexie mixte**.

NE PAS lister les effets verbatim dans le CRBO — synthétiser : "Sa lecture est marquée par un effet de fréquence et de consistance, traduisant une voie d'adressage insuffisamment constituée."

**2. Qualification des erreurs en dictée (lignes commençant par "Qualification erreurs :")**

Présentes sur \`Dictée de mots\`, \`Dictée de pseudomots\`, \`Dictée de phrases\`. Format :
\`Qualification erreurs : ONPP=3 | OL=2 | ODM=1 | ODNM=0 | FV=2 | FNP=1 | FA=0 | Seg=1 | Hom=0\`

Acronymes (cf. méthode EVALEO) :
- **ONPP** : Orthographe Non Phonétiquement Plausible → atteinte **voie d'assemblage en écriture** (signe dysorthographie **phonologique** si majoritaire).
- **OL** : Orthographe Lexicale → atteinte **voie d'adressage en écriture** (signe dysorthographie **lexicale / de surface**).
- **ODM** : Orthographe Dérivable Morphologiquement (affixes prévisibles) → atteinte de la **morphologie dérivationnelle**.
- **ODNM** : Orthographe Dérivable Non Morphologiquement (racines, lettres muettes) → atteinte du **stock orthographique fin**.
- **FV / FNP / FA** : Flexions Verbale / Nominale-Pronominale / Adjectivale → atteinte de l'**orthographe grammaticale** (accord) — signe dysorthographie **morphologique**.
- **Seg** : Segmentation des mots → atteinte de la frontière lexicale (mot fonction collé, mot rare segmenté).
- **Hom** : Homophones (a/à, et/est, son/sont) → atteinte de la décision lexicale en contexte.

**Comment intégrer dans le commentaire de l'épreuve** :
- ONPP majoritaire → "atteinte dominante de la voie d'assemblage, traduisant un déficit de la correspondance phonographique".
- OL + ODM + ODNM majoritaires → "atteinte dominante de la voie d'adressage, lexique orthographique insuffisamment constitué".
- FV + FNP + FA majoritaires → "atteinte dominante de l'orthographe grammaticale, accords morphologiques non automatisés".
- Mélange ONPP + OL + Flexions → dysorthographie **mixte**.

**Synthèse dans le diagnostic** : utiliser le sous-type (phonologique / lexicale / mixte / linguistique grammaticale) inféré du croisement effets lecture + erreurs dictée.

---

#### INTERPRÉTATION CLINIQUE — DOMAINES CLÉS

**PHONOLOGIE & MÉTAPHONOLOGIE**
- Métaphonologie + Répétition de pseudomots déficitaires → **marqueur fort de dyslexie phonologique**.
- Dénomination rapide ralentie (RAN) → **marqueur indépendant de dyslexie** (théorie du double déficit Wolf & Bowers).

**LECTURE IDENTIFICATION**
- Pattern classique :
  - Mots ≥ Pseudomots déficitaires → **dyslexie phonologique** (voie d'assemblage atteinte).
  - Mots déficitaires ≥ Pseudomots préservés → **dyslexie de surface** (voie d'adressage atteinte).
  - Mots ET Pseudomots déficitaires → **dyslexie mixte**.
- EVAL2M : seuils de vitesse (à recopier depuis le logiciel) — vitesse est aussi importante que la précision.

**ORTHOGRAPHE**
- Dictée de pseudomots déficitaire → voie d'assemblage en orthographe altérée (dysorthographie phonologique).
- Dictée de mots irréguliers déficitaire → voie d'adressage altérée (dysorthographie de surface).
- Dictée de phrases : croiser orthographe lexicale (mots) et grammaticale (accords, homophones).
- Décision orthographique : mémoire orthographique en reconnaissance — précise le sous-type.

**COMPRÉHENSION ÉCRITE**
- Compréhension écrite < Compréhension orale → trouble du décodage (pas de la compréhension).
- Compréhension écrite ET orale altérées → trouble de la compréhension globale (TDL / hyperlexie inversée à creuser).

**LEXIQUE-SÉMANTIQUE**
- Vocabulaire réceptif déficitaire + expressif préservé → suspicion sous-exposition (multilinguisme à explorer).
- Les deux déficitaires + Métaphores/Idiomes déficitaires → trouble lexico-sémantique (TDL).
- Métaphores/Idiomes isolément déficitaires → trouble pragmatique.

**MORPHOSYNTAXE**
- Compréhension morphosyntaxique déficitaire → prédictive de la compréhension écrite.
- Production morphosyntaxique pauvre → marqueur TDL.

**PRAGMATIQUE**
- Déficit pragmatique isolé → orientation **trouble de la communication sociale** (TCS, spectre autistique de haut niveau, TCL).
- Croiser avec métaphores/idiomes et compréhension inférentielle.

---

#### 🎯 PROFILS CLINIQUES TYPES

**PROFIL 1 — Dyslexie-dysorthographie développementale (phonologique)**
- Métaphonologie + Répétition de pseudomots : Déficitaire.
- Lecture de pseudomots : Très déficitaire.
- Lecture de mots : Déficitaire (ralenti).
- Dictée de pseudomots : Déficitaire.
- Compréhension orale : Préservée.
- Compréhension écrite : Déficitaire (consécutive au déficit de décodage).
- **Diagnostic** : "Trouble spécifique des apprentissages en langage écrit (communément appelé **dyslexie-dysorthographie**), de forme **phonologique**, caractérisé par un déficit central des compétences métaphonologiques et de la voie d'assemblage."

**PROFIL 2 — Dyslexie de surface**
- Métaphonologie : Préservée ou Limite basse.
- Lecture de pseudomots : Préservée (décodage assemblé OK).
- Lecture de mots irréguliers : Déficitaire.
- Dictée de mots irréguliers : Déficitaire.
- Décision orthographique : Déficitaire.
- **Diagnostic** : forme **lexicale (de surface)** — voie d'adressage atteinte.

**PROFIL 3 — Dyslexie mixte**
- Métaphonologie + Pseudomots + Mots irréguliers tous déficitaires.
- **Diagnostic** : forme **mixte**, atteinte des deux voies.

**PROFIL 4 — Trouble Développemental du Langage (TDL) isolé**
- Langage oral : Déficitaire (lexique, morphosyntaxe en réception et/ou production).
- Métaphonologie : peut être préservée ou fragile.
- Langage écrit : retard léger consécutif au TDL, mais pas l'épicentre du tableau.
- Pragmatique : préservée.
- **Diagnostic** : "Trouble Développemental du Langage à prédominance [phonologique / morphosyntaxique / lexico-sémantique]." Orientation **CRTLA** si sévère.

**PROFIL 5 — Trouble de la Communication Sociale / spectre autistique**
- Lexique et morphosyntaxe : Normal.
- Pragmatique : Déficitaire.
- Métaphores & expressions idiomatiques : Déficitaire.
- Compréhension inférentielle : Déficitaire.
- **Diagnostic** : "Profil compatible avec un trouble de la communication sociale. Orientation **bilan pluridisciplinaire** (neuropsy + pédopsychiatrie / CRA si suspicion spectre autistique) pour préciser le diagnostic."

**PROFIL 6 — Dyslexie + TDL associés (comorbidité)**
- Langage oral ET langage écrit tous deux déficitaires.
- **Diagnostic** : "Comorbidité **TDL + dyslexie-dysorthographie**. PEC orthophonique intensive et soutenue, PPS via MDPH à envisager."

**PROFIL 7 — Trouble cognitif global / suspicion déficience intellectuelle**
- Déficits homogènes sur TOUTES les dimensions (oral, écrit, raisonnement logique).
- **Diagnostic** : "Pattern compatible avec une atteinte cognitive globale. **WISC-V à demander avant toute conclusion orthophonique** pour caractériser le niveau intellectuel."

---

#### ARTICULATION AVEC D'AUTRES OUTILS

- **Bilan complet en autonomie** : EVALEO permet à lui seul une évaluation oral + écrit + autres (gnosies, MdT, praxies).
- **Compléments éventuels** :
  - BELEC (Mousty & Leybaert) pour une analyse orthographique fine.
  - Examath 8-15 si dyscalculie associée suspectée.
  - BALE pour les épreuves de lecture spécifiques (Leximétrie spécifique).
  - MoCA / BETL en transition adolescent → jeune adulte.
- **Cognitif** : WISC-V **systématique** si profil très hétérogène ou suspicion trouble cognitif global.
- **Pluridisciplinaire** : neuropsy + pédopsychiatrie si pragmatique touchée.

---

#### RECOMMANDATIONS TYPES PAR PROFIL

- **Dyslexie phonologique** : PEC orthophonique 1 séance / semaine 45 min, 24-36 mois. Renforcement métaphonologique + voie d'assemblage. PAP automatique.
- **Dyslexie de surface** : PEC ciblée mémoire orthographique. Logiciels d'aide (correcteur orthographique). PAP.
- **TDL isolé** : PEC hebdomadaire ciblée sur la composante touchée. Orientation CRTLA si sévère.
- **TCS / spectre autistique** : orientation pluridisciplinaire **avant** PEC orthophonique seule.
- **Comorbidité** : PEC intensive + PPS/MDPH.

PAP automatique en cas de dyslexie ou TDL confirmé. PPS pour profils sévères ou comorbidités.

---

#### ⛔ À NE JAMAIS FAIRE

- ❌ Conclure à une dyslexie sur la seule épreuve de Lecture de mots — toujours croiser avec pseudomots, métaphonologie, RAN.
- ❌ Confondre vitesse de lecture (EVAL2M) et compréhension : un enfant peut lire vite mal et inversement.
- ❌ Ignorer la pragmatique — c'est UN apport majeur d'EVALEO vs autres batteries.
- ❌ Diagnostiquer un TDL si seule l'écrit est touché — toujours vérifier la composante orale d'abord.
- ❌ Renoncer au WISC-V si tout est homogènement bas (suspicion déficience intellectuelle).
- ❌ Confondre Q1 (P25 normal) et déficitaire.

#### ✅ À TOUJOURS FAIRE

- ✅ Reporter le **percentile** OU la zone affichée par le logiciel pour chaque épreuve passée.
- ✅ Croiser au minimum **3 épreuves convergentes** par hypothèse diagnostique (ex. dyslexie phonologique = métaphonologie + pseudomots + dictée pseudomots).
- ✅ Mentionner les **stratégies** observées en lecture (recours à l'analogie, décodage segmenté, prédiction sur contexte).
- ✅ Adapter le **niveau scolaire** : sélectionner le niveau exact de l'enfant pour les normes.
- ✅ Recommander un WISC-V si le diagnostic différentiel n'est pas tranché.
- ✅ Préciser le **sous-type** (phonologique / surface / mixte) pour la dyslexie-dysorthographie.`,
}
