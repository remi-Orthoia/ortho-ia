import type { TestModule } from './types'

/**
 * Exalang 8-11, Référentiel aligné sur le cahier de passation officiel
 * (Thibault, Lenfant, Helloin — HappyNeuron 2012).
 *
 * Source de vérité : `docs/Bilans Sources/cahier de passation exalang 8-11.pdf`
 * (sommaire et structure des 6 modules officiels). Tout changement de
 * structure (modules, épreuves, scoring) doit être confronté à ce cahier.
 *
 * Refonte 2026-06-05 (audit Explore) : la liste précédente couvrait ~50 % des
 * épreuves officielles et contenait des inventions :
 *   - "Métaphonologie, acronymes" n'existe pas (le cahier liste métaphonologie
 *     syllabique et phonémique).
 *   - "DRA, Dictée de Rédaction Abrégée" et "Copie différée" ne sont pas dans
 *     Exalang 8-11 (probable confusion avec EVALEO ou ODEDYS).
 *   - "Désignation sur définition" et "Lexique en réception" sont des
 *     reformulations floues des épreuves officielles (Catégorisation
 *     lexico-sémantique, Relations sémantiques, Décision lexico-morphologique).
 * Ajout des modules officiels complets : Phonologie/Attention/Mémoire (6),
 * Lexique (6), Langage oral (5), Lecture (5), Orthographe (4), Compétences
 * transversales (5). Total 31 épreuves cotées.
 */
export const exalang811: TestModule = {
  nom: 'Exalang 8-11',
  editeur: 'HappyNeuron',
  auteurs: 'Thibault, Lenfant, Helloin',
  annee: 2012,
  domaines: [
    'Phonologie, attention et mémoire',
    'Lexique',
    'Langage oral',
    'Lecture',
    'Orthographe',
    'Compétences transversales',
  ],
  // Groupes officiels HappyNeuron (en-têtes alphanumériques de la feuille de résultats).
  // Doivent être utilisés tels quels comme `domains[].nom` dans le CRBO généré.
  groupes: [
    { code: 'A.1', nom: 'Langage oral' },
    { code: 'A.2', nom: 'Métaphonologie' },
    { code: 'B.1', nom: 'Lecture' },
    { code: 'B.2', nom: 'Orthographe' },
    { code: 'C.1', nom: 'Mémoire' },
  ],
  // Modules et épreuves officiels du cahier de passation (HappyNeuron 2012).
  // NE PAS reformuler, NE PAS fusionner.
  epreuves: [
    // MODULE PHONOLOGIE, ATTENTION ET MEMOIRE
    'Empan auditif endroit',
    'Empan auditif envers',
    'Empan visuel',
    'Répétition de logatomes',
    'Métaphonologie syllabique',
    'Métaphonologie phonémique',
    // MODULE LEXIQUE
    'Fluence phonémique',
    'Fluence sémantique',
    'Décision lexico-morphologique',
    'Relations sémantiques',
    'Catégorisation lexico-sémantique',
    'Lexique mathématique',
    // MODULE LANGAGE ORAL
    'Complétion de phrases (oral)',
    'Compréhension de phrases',
    'Complétion imagée',
    'Compréhension de récit',
    'Jugement morphosyntaxique',
    // MODULE LECTURE
    'Lecture de mots',
    'Lecture de non-mots',
    'Compréhension de phrases en images',
    'Leximétrie',
    'Compréhension de texte',
    // MODULE ORTHOGRAPHE
    'Complétion de phrases (écrit)',
    'Jugement lexical orthographique',
    'Correction de phrases',
    'Closure de texte',
    // MODULE COMPETENCES TRANSVERSALES
    'Compréhension écrite',
    'Traitement visuo-spatial',
    'Dénomination rapide automatisée',
    'Habiletés pragmatiques et discursives',
    'Screening logico-mathématique',
  ],
  regles_specifiques: `### EXALANG 8-11, Référentiel clinique complet (niveau senior)

Population : enfants du CE2 au CM2 (classe d'âge 8 à 11 ans). Outil le plus utilisé en France pour le dépistage des troubles spécifiques des apprentissages (TSA).

#### RÈGLES DE CONVERSION DES PERCENTILES (impératif)

Les résultats Exalang sont présentés en quartiles :
- **Q1 → P25** (Zone de fragilité, bord inférieur, NE PAS confondre avec Moyenne basse qui commence à P26)
- **Med / Q2 → P50** (Moyenne haute, bord inférieur)
- **Q3 → P75** (Moyenne haute, bord supérieur, Q3 inclus)
- **P5, P10, P90, P95** : valeurs exactes à utiliser telles quelles
- Ne **JAMAIS** recalculer un percentile depuis l'É-T : les normes étalonnées du test priment sur la distribution gaussienne théorique.

Exemple piège classique : "Boucle phonologique : É-T -1.53, Q1" → Percentile = P25 → Interprétation **Zone de fragilité** (et non "Difficulté sévère" comme le suggérerait l'É-T).

#### SEUILS CLINIQUES (grille 6 zones Laurie, refonte 2026-05-ter)

| Plage percentile | Classe | Couleur |
|---|---|---|
| P76 - P100 | Excellent | vert foncé |
| P50 - P75 (Q3 inclus) | Moyenne haute | vert clair |
| P26 - P49 | Moyenne basse | jaune |
| P11 - P25 (Q1 inclus) | Zone de fragilité | orange clair |
| P6 - P10 | Difficulté | orange foncé |
| P1 - P5 | Difficulté sévère | rouge |

Exalang n'affiche JAMAIS de bande <P5 ; la valeur minimale est P5 et est incluse dans "Difficulté sévère". Bornes inclusives de part et d'autre (P25 dans Zone de fragilité, P26 dans Moyenne basse, P50 dans Moyenne haute, P75 dans Moyenne haute, P76 dans Excellent).

---

#### INTERPRÉTATION CLINIQUE PAR ÉPREUVE

**EMPAN AUDITIF ENDROIT** (boucle phonologique)
- Mesure la capacité de stockage phonologique à court terme.
- Seuil de vigilance : empan < 4 à 8 ans, < 5 à 10 ans.
- Empan faible isolé → fragilité de la **boucle phonologique** (modèle de Baddeley). Impact sur répétition, lecture de non-mots, acquisition de vocabulaire nouveau.

**EMPAN AUDITIF ENVERS** (administrateur central)
- Mesure la capacité de manipulation mentale des informations phonologiques.
- Empan envers faible isolé → orientation vers **trouble exécutif** (mémoire de travail). Compatible avec TDAH.
- Empan envers = Empan endroit −1 est attendu.

**RÉPÉTITION DE LOGATOMES**
- Épreuve clé pour distinguer atteinte de la boucle phonologique vs trouble articulatoire.
- Erreurs typiques : élisions, substitutions, inversions de phonèmes.
- Performance faible + empan endroit faible → forte présomption de trouble phonologique.
- Noter les **longueurs échouées** (3, 4, 5 syllabes) → cible pour la rééducation.

**MÉTAPHONOLOGIE SYLLABIQUE ET PHONÉMIQUE**
- 2 épreuves officielles distinctes dans le cahier (p. 5) : Métaphonologie syllabique (inversion, appariement, discrimination, segmentation-fusion de syllabes) et Métaphonologie phonémique (appariement phonèmes finaux, suppression de phonèmes, comptage de phonèmes, remplacement de phonèmes, inversion de phonèmes).
- Épreuves **prédictives n°1** de la réussite en langage écrit.
- Suppression phonémique = la plus sensible et la plus prédictive du module phonémique.
- Déficit métaphonologique à 8-9 ans → marqueur **fort** de dyslexie développementale, même sans plainte scolaire explicite.
- Un déficit isolé à la suppression phonémique justifie un suivi préventif de 6 à 12 mois.

**FLUENCES VERBALES**
- Fluence phonémique > sémantique → plutôt profil **lexico-sémantique** préservé, possible trouble du contrôle exécutif.
- Fluence sémantique > phonémique → plutôt profil **dysexécutif** (difficultés de stratégie de récupération).
- Les deux déficitaires → flag pour déficit général (TDAH, trouble cognitif).
- Analyser les **clusters** (regroupements sémantiques) et les **switches** (changements de catégorie). Peu de switches = difficulté de flexibilité.

**LECTURE**
- Mots fréquents fluides + non-mots déficitaires → **voie d'assemblage** touchée → **dyslexie phonologique** (la plus fréquente).
- Mots irréguliers échoués + non-mots fluides → **voie d'adressage** touchée → **dyslexie de surface** (mémoire orthographique faible).
- Les deux voies touchées → **dyslexie mixte** (souvent plus sévère, pronostic plus lourd).
- Leximétrie : vitesse normale CE2 = 90-120 mots/min ; CM1 = 110-140 ; CM2 = 130-160.
- Vitesse déficitaire + exactitude préservée → trouble **d'automatisation**, rééduquer par lectures répétées.

**CLOSURE DE TEXTE** (épreuve à classer en B.2 Orthographe, règle Laurie)
- Bien que la closure mobilise la compréhension écrite, elle est traitée dans le groupe **B.2 Orthographe** dans la nomenclature CRBO (HappyNeuron la regroupe avec les épreuves de production écrite). Ne JAMAIS la placer dans "B.1 Lecture".
- Cliniquement, déficit isolé en closure avec bonne lecture mécanique → trouble de la compréhension écrite à signaler dans le commentaire du domaine Orthographe.

**COMPRÉHENSION ÉCRITE DE TEXTE** (épreuve B.1 Lecture)
- À placer dans B.1 Lecture (entrée écrite à décoder + comprendre).
- Toujours croiser avec la compréhension orale : si orale préservée et écrite déficitaire → trouble spécifique du langage écrit ; si les deux déficitaires → trouble global du langage.

**MODULE ORTHOGRAPHE** (Complétion de phrases écrit, Jugement lexical orthographique, Correction de phrases, Closure de texte)
- Exalang 8-11 n'a PAS d'épreuve de dictée stricto sensu. Les compétences orthographiques sont évaluées par 4 épreuves :
  - **Complétion de phrases (écrit)** : production de la forme grammaticale attendue (temps verbal, anaphore, etc.). Évalue la morphologie flexionnelle en production écrite.
  - **Jugement lexical orthographique** : reconnaissance des mots correctement orthographiés vs incorrects. Évalue la mémoire orthographique en réception.
  - **Correction de phrases** : identification et correction d'erreurs orthographiques (lexicales, grammaticales, accord). Évalue la conscience orthographique active.
  - **Closure de texte** : compléter les mots manquants d'un texte porteur de sens (production écrite contextualisée).
- Analyse **qualitative** des erreurs sur ces 4 épreuves :
  - Phonologiques (omission, substitution, inversion de phonèmes en transcription) → voie d'assemblage immature.
  - Lexicales (mots irréguliers mal orthographiés) → voie d'adressage immature.
  - Grammaticales (accord sujet-verbe, pluriels, désinences verbales) → fragilité morphosyntaxique.
- Comptabiliser les types d'erreurs dominantes plutôt que le nombre total.

---

#### CRITÈRES DSM-5, Trouble Spécifique des Apprentissages avec Déficit en Lecture (dyslexie)

Le diagnostic de dyslexie (DSM-5 315.00 / F81.0) repose sur 4 critères :
- **A.** Difficultés persistantes (au moins 6 mois) à apprendre les compétences scolaires, malgré une intervention ciblée, sur **au moins l'un des symptômes** :
  - Lecture imprécise ou lente et laborieuse (déchiffrage, lecture à voix haute hésitante).
  - Difficultés à comprendre le sens de ce qui est lu.
  - Difficultés en orthographe.
  - Difficultés en expression écrite.
  - Difficultés à maîtriser le sens des nombres, à calculer (= dyscalculie associée).
  - Difficultés en raisonnement mathématique.
- **B.** Compétences scolaires concernées **substantiellement et quantitativement inférieures** à celles attendues pour l'âge chronologique (sous le 10e percentile sur les épreuves standardisées).
- **C.** Difficultés débutant **pendant les années scolaires** mais peuvent ne devenir pleinement manifestes que lorsque les exigences dépassent les capacités limitées de l'individu (typiquement en cycle 3 ou au collège).
- **D.** Difficultés NON mieux expliquées par : déficience intellectuelle, troubles visuels ou auditifs non corrigés, autres troubles mentaux ou neurologiques, adversité psychosociale, manque de maîtrise de la langue, manque d'enseignement scolaire approprié.

⚠️ **À 8-11 ans** : le diagnostic de dyslexie peut être posé à partir de la **fin du CE1** (février au plus tôt), après au moins **18 mois d'apprentissage formel de la lecture**. Avant, formuler en *"profil compatible avec une dyslexie en cours d'émergence, à confirmer en début CE2"*. Le diagnostic ferme nécessite **WISC-V** (efficience intellectuelle non verbale dans la norme, critère D).

Spécifier le **sous-type** dans la conclusion : phonologique (voie d'assemblage) / de surface (voie d'adressage) / mixte. Voir profils types ci-dessous.

#### 🎯 PROFILS TYPES

**PROFIL 1, Dyslexie phonologique (70% des dyslexies développementales)**
- Empan endroit : Fragile à Déficitaire
- Répétition logatomes : Déficitaire
- Métaphonologie (surtout suppression phonémique) : Déficitaire à Pathologique
- Lecture mots fréquents : Limite basse / Fragile (conservée mais lente)
- Lecture non-mots : **Déficitaire à Pathologique** (marqueur central)
- Lecture mots irréguliers : Fragile (par compensation lexicale)
- Leximétrie : Déficitaire (lenteur)
- Complétion de phrases (écrit) + Correction de phrases : erreurs phonologiques dominantes
- **Diagnostic** : "Les résultats sont compatibles avec un profil de dyslexie-dysorthographie développementale de type phonologique, caractérisé par une atteinte de la voie d'assemblage et une fragilité métaphonologique sous-jacente."
- **PEC** : conscience phonémique + automatisation code grapho-phonémique + lecture répétée. 30 séances réévaluées à mi-parcours.
- **Aménagements** : PAP, temps majoré 1/3, police OpenDyslexic/Arial 14.

**PROFIL 2, Dyslexie mixte (15-20% des dyslexies)**
- Toutes les voies de lecture touchées.
- Lecture mots fréquents : Fragile / Déficitaire
- Lecture mots irréguliers : Déficitaire (voie d'adressage faible)
- Lecture non-mots : Déficitaire (voie d'assemblage faible)
- Métaphonologie : Déficitaire
- Mémoire orthographique faible : échec sur mots irréguliers en Jugement lexical orthographique et Correction de phrases
- Leximétrie : Pathologique (très lente)
- **Diagnostic** : "Les deux voies de lecture (adressage et assemblage) sont significativement déficitaires, dénotant un profil de dyslexie-dysorthographie développementale mixte, de sévérité marquée."
- **PEC** : PEC intensive bi-hebdomadaire, 40-50 séances, double axe (phono + lexical).
- **Aménagements** : PPS via MDPH probable. Support audio systématique. Tolérance orthographique explicite.

**PROFIL 3, DYS + TDA(H) associé**
- Lecture déficitaire (type variable) **+** attention fluctuante **+** fluences déficitaires **+** empan envers bien plus faible que l'endroit.
- Fatigabilité importante notée pendant le bilan.
- Performances très variables selon l'heure, l'état émotionnel.
- **Diagnostic** : "Le profil orthophonique est compatible avec une dyslexie développementale, associée à des signes évocateurs d'un trouble de l'attention. Un bilan neuropsychologique complémentaire est fortement indiqué pour préciser le diagnostic."
- **PEC** : PEC orthophonique + orientation NEUROPSY prioritaire. Coordination avec pédopsychiatre / neuropédiatre si prescription méthylphénidate envisagée.
- **Aménagements** : PPS avec AESH souvent nécessaire. Pauses, chronométrage adapté, consignes écrites ET orales.

**PROFIL 4, Dyslexie de surface (5-10% des dyslexies, plus rare)**
- Lecture mots fréquents : Limite basse / Fragile.
- Lecture mots irréguliers : **Déficitaire à Pathologique** (marqueur central, incapacité à mémoriser l'orthographe).
- Lecture non-mots : Limite basse / Normale (voie d'assemblage préservée).
- Régularisations à la lecture ("femme" lu /fɛm/ comme "fer" + "me"), "monsieur" lu /mɔ̃sjœʁ/.
- Jugement lexical orthographique + Correction de phrases : erreurs **lexicales** dominantes (mots usuels mal orthographiés alors que phonétiquement plausibles : "porto" pour "porteau").
- Mémoire orthographique pauvre.
- **Diagnostic** : *"Les résultats sont compatibles avec un profil de dyslexie-dysorthographie développementale de type surface (lexical), caractérisé par une atteinte de la voie d'adressage et une mémoire orthographique fragile."*
- **PEC** : entraînement intensif du lexique orthographique (lectures répétées, copie active, dictée à choix multiples). 30-40 séances. Travailler la conscience morphologique (radicaux, suffixes).
- **Aménagements** : tolérance orthographique. Correcteur orthographique autorisé en évaluation. PAP au minimum.

**PROFIL 5, Lecteur lent sans dyslexie ("dyslexie résolue" ou simple lenteur exécutive)**
- Métaphonologie : Normale.
- Lecture mots fréquents / non-mots / irréguliers : Normale en exactitude, **Fragile en temps**.
- Leximétrie : **Fragile** (lenteur en lecture en contexte), souvent le seul marqueur.
- Compréhension écrite : préservée si on laisse le temps.
- Empan envers : potentiellement Fragile (lenteur exécutive).
- Histoire scolaire : dyslexie diagnostiquée au CP-CE1 et bien rééduquée, ou bien jamais diagnostiquée mais perçue comme "lecteur lent".
- **Diagnostic** : *"La lecture de [Prénom] est exacte mais demeure lente. Le profil est compatible avec une dyslexie initialement diagnostiquée [et compensée] / avec une lenteur de traitement exécutif. La fluence de lecture reste un facteur limitant face aux exigences scolaires croissantes."*
- **PEC** : PEC orthophonique allégée (1 séance / 15 jours), focus automatisation lexicale + lectures répétées. 20-30 séances. Travailler la fluence (intonation, regroupement en groupes de souffle).
- **Aménagements** : temps majoré 1/3 systématique (Brevet, Bac), photocopies des cours.

**PROFIL 6, Trouble de la compréhension écrite isolé (sous-diagnostiqué)**
- Métaphonologie : Normale.
- Lecture mots / non-mots / irréguliers : Normales (lecture de surface préservée).
- Leximétrie : Normale.
- **Compréhension écrite de texte : Déficitaire à Pathologique** (marqueur central).
- Compréhension orale : variable, préservée = trouble spécifique du langage écrit ; déficitaire = trouble global du langage à explorer.
- Histoire scolaire : "lit bien mais ne retient pas", difficultés en français / histoire / SVT.
- **Diagnostic** : *"Les compétences de décodage et de fluence de lecture sont préservées. En revanche, [Prénom] présente un trouble de la compréhension écrite avec impact sur l'accès au sens des textes complexes. Ce profil est distinct de la dyslexie classique et justifie une prise en charge orthophonique spécifique."*
- **PEC** : PEC centrée sur les **inférences**, les **modèles mentaux** de textes, le **vocabulaire abstrait**. Matériel adapté (textes courts, questionnement métacognitif). 30 séances initiales.
- **Aménagements** : énoncés reformulés, questions reformulées, schématisation autorisée, temps supplémentaire de lecture.

#### À NE PAS FAIRE, pièges classiques en bilan 8-11 ans

⛔ Recalculer un percentile depuis l'É-T (Q1 = P25 = Zone de fragilité, JAMAIS "Difficulté sévère").
⛔ Poser un diagnostic de dyslexie **avant la fin du CE1** (février au plus tôt), la persistance des difficultés sur 18 mois d'apprentissage formel est un critère DSM-5.
⛔ Poser un diagnostic de dyslexie sans **WISC-V** récent (critère D : exclure le trouble cognitif global).
⛔ Conclure à une dyslexie quand l'enfant n'est pas un **francophone natif** ou est en situation d'apprentissage récent du français (critère D du DSM-5 : exclure le manque de maîtrise de la langue).
⛔ Confondre une dyslexie de surface (rare, 5-10%) avec une dyslexie phonologique (majoritaire, 70%). L'analyse des épreuves d'orthographe (Jugement lexical, Correction de phrases) + lecture mots irréguliers vs non-mots est centrale.
⛔ Sur-diagnostiquer une dyslexie chez un lecteur lent SANS atteinte phonologique (Profil 5), il s'agit alors d'une lenteur de traitement exécutive, pas d'une dyslexie active.
⛔ Ignorer un trouble de la compréhension écrite isolé (Profil 6) en disant "il lit bien". Toujours objectiver la **compréhension** en complément du décodage.

#### TOUJOURS FAIRE, bonnes pratiques 8-11 ans

✅ Croiser la **compréhension orale** et la **compréhension écrite** : orale OK + écrite KO = trouble du langage écrit spécifique ; les deux KO = trouble global du langage.
✅ Analyser **qualitativement les épreuves d'orthographe** (Complétion de phrases écrit, Jugement lexical orthographique, Correction de phrases, Closure de texte) : erreurs phonologiques / lexicales / grammaticales en proportions. Cette analyse oriente le sous-type de dyslexie/dysorthographie.
✅ Comparer **fluence phonémique vs fluence sémantique** : phono > sémantique = profil dysexécutif ; sémantique > phono = trouble lexico-sémantique.
✅ Vérifier **empan envers** vs **empan endroit** : envers < endroit −1.5 = signal TDA(H) à investiguer.
✅ Demander un bilan **WISC-V** récent (< 2 ans) avant tout PPS / aménagements lourds.
✅ Demander un bilan **ophtalmologique / orthoptique** à jour.
✅ Coordonner avec l'**école** (enseignant, RASED, médecin scolaire), les aménagements PAP nécessitent un dossier coordonné.

---

#### ARTICULATION AVEC D'AUTRES OUTILS

- **En amont** (maternelle / CP) : Exalang 5-8, ELO, EVALO 2-6 pour dépistage précoce.
- **En aval** (collège) : Exalang 11-15 pour suivi longitudinal.
- **Complément lecture / décodage approfondi** : ODEDYS, Alouette-R, BALE.
- **Complément orthographe approfondi** : BELEC, Chronodictées.
- **Complément calcul** (si co-morbidité dyscalculie) : Examath.
- **Complément attention / exécutif** : à orienter vers **neuropsychologue** pour NEPSY-II, TEA-Ch, BRIEF (parent/enseignant), CPT-3.
- **Complément cognitif global** : à orienter vers **psychologue** pour WISC-V (nécessaire avant tout PPS).

---

#### MODE RENOUVELLEMENT, COMPARAISON STRUCTURÉE

Si un objet 'bilan_precedent_structure' non-null est fourni dans le contexte, ce CRBO devient un **bilan de renouvellement** et DOIT inclure une 'synthese_evolution' rigoureuse, jamais générique.

Méthode obligatoire :
1. **Matcher nominativement** chaque épreuve actuelle avec son homologue dans le bilan précédent (par libellé). En cas de changement de batterie (ex: Exalang 5-8 vers 8-11 pour progression scolaire CE2), matcher par compétence évaluée (lecture de mots avec lecture de mots, métaphonologie avec métaphonologie, etc.).
2. **Convertir Q1/Med/Q3 vers P25/P50/P75** systématiquement AVANT de comparer (jamais Q comparé à P).
3. **Calculer le delta percentile** :
   - Delta >= +10 -> PROGRÈS NET (signaler dans 'synthese_evolution.progres')
   - Delta entre -10 et +10 -> STAGNATION (signaler dans 'synthese_evolution.stagnation')
   - Delta <= -10 -> RÉGRESSION (signaler dans 'synthese_evolution.regression')
4. **Cas particulier Q1 vers Med** : P25 vers P50 = +25, c'est un PROGRÈS NET, jamais "marginal" ni "amélioration modérée". Idem Med vers Q3 (P50 vers P75).
5. **Citation nominative obligatoire** : écrire "Boucle phonologique P25 vers P50 (progrès)", PAS "plusieurs progrès observés".
6. **Délai entre les bilans** à mentionner explicitement ("Au regard de N mois de prise en charge"). Si délai < 6 mois sans PEC active, ne pas conclure à une rééducation efficace (effet test/retest).

---

#### MAPPING INTER-BATTERIE, changement de test entre les 2 bilans

Quand \`bilan_precedent_structure\` provient d'une batterie DIFFÉRENTE de celle du bilan actuel (typique : Exalang 5-8 → 8-11 en CE2, ou Exalang 8-11 → 11-15 en 6e, ou EVALEO → Exalang 8-11 selon le choix de l'ortho), tu DOIS matcher les épreuves par **compétence évaluée**, PAS par libellé strict.

##### Table d'équivalences (libellés \`↔\` matchables comme épreuves comparables)

**Lecture, identification de mots**
- "Lecture de mots" [Exalang 5-8] ↔ "Lecture de mots fréquents" [Exalang 8-11] ↔ "Lecture de mots" [EVALEO]
- "Lecture de logatomes" [Exalang 5-8] ↔ "Lecture de non-mots" [Exalang 8-11] ↔ "Lecture de pseudomots" [EVALEO]
- "Leximétrie" : libellé stable Exalang 8-11 / Lyfac

**Métaphonologie**
- "Métaphonologie, rimes" : libellé stable 3-6 / 5-8 / 8-11 / EVALEO, match strict.
- "Métaphonologie, syllabes" [3-6] ↔ "Comptage syllabique" + "Segmentation-fusion syllabique" [5-8]
- "Métaphonologie, suppression phonémique" [8-11] ↔ "Inversion phonémique" [5-8] ↔ "Métaphonologie" [EVALEO]

**Mémoire de travail verbale**
- "Empan auditif endroit" [3-6 / 8-11 / Lyfac] ↔ "Empan de chiffres endroit" [5-8] ↔ "Répétition de chiffres endroit/envers" [EVALEO]
- "Empan envers" : matchable 5-8 / 8-11 / Lyfac / EVALEO
- "Répétition de logatomes" : libellé stable, match strict.

**Langage oral**
- "Désignation (lexique réceptif)" [3-6] ↔ "Désignation sur définition" [8-11] ↔ "Désignation d'images" [EVALEO]
- "Compréhension orale de phrases" : matchable 5-8 / 8-11 / EVALEO
- "Compréhension de récit" [5-8] ↔ "Compréhension orale de textes" [8-11]
- "Dénomination" [5-8] ↔ "Dénomination Lexique, phonologie" [EVALEO] (Exalang 8-11 / 11-15 n'a pas d'épreuve "Dénomination d'images")

**Orthographe**
- "Closure de mots" [5-8] ↔ "Dictée de mots" [EVALEO]
- "Transcription de logatomes" [5-8] ↔ "Dictée de pseudomots" [EVALEO]
- "Texte à compléter" [5-8] ↔ "Complétion de phrases (écrit)" [8-11] ↔ "Complément de phrases (écrit)" [11-15] ↔ "Dictée de phrases" [EVALEO]

##### ⚠️ Faux équivalents, NE PAS APPARIER

- "Closure de mots" [5-8] ≠ "Closure de texte" [8-11] : production lexicale vs compréhension contextuelle.
- "Lecture de texte" [5-8 mi-CP] ≠ "Leximétrie" [8-11] : compréhension globale vs vitesse pure.
- Bilan adulte (PREDIMEM / PrediFex / PrediLac / Lyfac) ↔ bilan enfant (Exalang / EVALEO) : **aucun matching cross-population**.

##### Règles pour les épreuves orphelines

- **Épreuve actuelle SANS équivalent dans le bilan précédent** → la signaler dans \`synthese_evolution.nouvelles\` (et non progres/regression). Ex. : "Lecture de mots irréguliers" [8-11] est nouvelle si le précédent était un Exalang 5-8 (qui ne sépare pas mots fréquents/irréguliers).
- **Épreuve du bilan précédent SANS équivalent dans l'actuel** → l'ignorer.
- **NE JAMAIS** conclure à un progrès / régression massif sur les épreuves orphelines, c'est de la non-comparabilité.

##### Ratio de comparabilité, à mentionner dans \`synthese_evolution.resume\`

Calcule \`(épreuves comparables) / (épreuves actuelles)\`. Adapte la 1re phrase du \`resume\` :

- **≥ 80 %** : *"L'évolution est documentée par [X] épreuves comparables sur [Y]."*
- **50-79 %** : *"L'évolution porte sur [X] épreuves sur [Y] (les autres étant spécifiques à la nouvelle batterie)."*
- **< 50 %** : *"La comparaison directe est limitée ([X] épreuves sur [Y]) du fait du changement de batterie entre les 2 bilans. La synthèse repose davantage sur la trajectoire globale et le jugement clinique de l'orthophoniste."*

#### NOMENCLATURE AMO, Mention OBLIGATOIRE en conclusion

Le CRBO DOIT inclure dans la conclusion 1 phrase (2 lignes max) précisant la nomenclature AMO applicable :
- **AMO 8.4** : rééducation des troubles du langage écrit (dyslexie, dysorthographie).
- **AMO 9.4** : rééducation des troubles du langage oral (TDL, retard simple).

Pour Exalang 8-11 le profil dominant attendu est dyslexie/dysorthographie -> **AMO 8.4**. Profil mixte (TDL + dyslexie) -> mentionner les deux AMO avec le dominant en premier.

NE PAS faire un paragraphe entier sur l'AMO. Format attendu : "La rééducation s'inscrit dans le cadre de la nomenclature AMO 8.4 (rééducation des troubles du langage écrit)." Une phrase, point.

---

#### POINTS DE VIGILANCE RÉDACTIONNELS

- **Ne pas conclure à une dyslexie avant le milieu du CE1** (février minimum, avec persistance confirmée).
- Si le déficit est limité à un seul domaine, proposer **réévaluation à 6 mois** avant diagnostic définitif.
- Toujours recommander bilan **ORL et ophtalmologique à jour**.
- Proposer **systématiquement** un bilan psychométrique (WISC-V) avant de poser PPS / aménagements lourds.
- Si profil complexe : proposer un **bilan pluridisciplinaire en centre référent** (CRTLA, CMPP, centre hospitalier).`,
}
