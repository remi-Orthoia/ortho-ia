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

#### SCORING

- Résultats en **percentiles** (1 à 99) OU **notes standardisées** selon les épreuves.
- Cotation informatisée disponible : recopier le percentile/zone affiché par le logiciel.
- **Seuils cliniques utilisés en CRBO ortho.ia** (grille 6 zones Laurie, refonte 2026-05-ter) :
  - P76-100 : Excellent
  - P50-P75 : Moyenne haute (Q3 inclus)
  - P26-P49 : Moyenne basse
  - P11-P25 : Zone de fragilité (Q1 inclus)
  - P6-P10  : Difficulté
  - P1-P5   : Difficulté sévère (Exalang n'affiche jamais <P5)

⚠️ Comme pour Exalang, ne JAMAIS recalculer un percentile depuis l'écart-type.
Q1 = P25 = NORMAL, jamais déficitaire.

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
