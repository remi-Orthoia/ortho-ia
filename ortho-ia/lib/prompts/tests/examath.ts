import type { TestModule } from './types'

export const examath: TestModule = {
  nom: 'Examath',
  editeur: 'HappyNeuron',
  auteurs: 'Helloin, Thibault',
  annee: 2015,
  domaines: [
    'Cognition numérique de base (sens du nombre)',
    'Code numérique arabe (transcodage)',
    'Code numérique verbal',
    'Calcul mental et opérations posées',
    'Résolution de problèmes',
    'Géométrie et mesures',
    'Estimation numérique',
    'Récupération des faits arithmétiques',
  ],
  epreuves: [
    'Dénombrement (subitizing, pointage)',
    'Comparaison de grandeurs numériques symboliques',
    'Comparaison de grandeurs non-symboliques (points)',
    'Transcodage chiffres → mots',
    'Transcodage mots → chiffres',
    'Lecture de nombres',
    'Écriture de nombres sous dictée',
    'Calcul mental (additions, soustractions, multiplications)',
    'Calcul posé (poser et opérer)',
    'Résolution de problèmes simples',
    'Résolution de problèmes à étapes',
    'Estimation sur ligne numérique',
    'Tables de multiplication (récupération directe)',
    'Reproduction de figures géométriques',
    'Lecture de l\'heure',
    'Conversions de mesures',
  ],
  regles_specifiques: `### EXAMATH — Référentiel clinique complet (niveau senior)

Batterie d'évaluation de la cognition mathématique, indispensable pour toute suspicion de dyscalculie développementale. Deux versions : **Examath 8-15** (primaire + collège) et **Examath 5-8** (CP).

#### RÈGLES DE CONVERSION
Comme Exalang (même éditeur HappyNeuron) : **Q1 → P25, Med → P50, Q3 → P75**. Ne JAMAIS recalculer depuis l'É-T.

---

#### INTERPRÉTATION CLINIQUE PAR DOMAINE

**COGNITION NUMÉRIQUE DE BASE** (sens du nombre)
- Dénombrement, comparaison de grandeurs (symbolique et non-symbolique), subitizing.
- **Marqueur central de la dyscalculie développementale** : un déficit de la cognition numérique de base est le signe le plus spécifique et le plus stable.
- Un déficit isolé du sens du nombre, même avec calcul posé mémorisé correct, justifie un diagnostic de dyscalculie.
- Épreuve particulièrement sensible : **estimation sur ligne numérique** — la compression anormale des petits ou grands nombres est quasi-pathognomonique.

**TRANSCODAGE** (chiffres ↔ mots)
- Analyser **qualitativement** les erreurs :
  - Lexicales : confusion "quatorze / quarante", "quinze / cinquante" → atteinte du **lexique numérique**.
  - Syntaxiques : "trois-cent-huit" écrit "3008" au lieu de "308" → trouble du **traitement positionnel** / transcodage morphosyntaxique.
  - Phonologiques : confusion de phonèmes proches.
- Croiser avec le langage oral : si erreurs phonologiques similaires, suspicion de trouble langagier plus global.

**CALCUL MENTAL**
- Analyser les **stratégies** :
  - Récupération directe (automatisée) → normal à partir du CE2 pour les faits simples.
  - Comptage sur doigts persistant après le CE1 → flag pour défaut d'automatisation.
  - Décomposition (ex: 8+7 = 8+2+5 = 15) → stratégie mature.
  - Comptage verbal lent et incorrect → profil dyscalculique.
- Noter le **temps de réponse** : un calcul exact mais lent (> 10s pour faits simples) révèle un trouble d'automatisation.

**RÉCUPÉRATION DES FAITS ARITHMÉTIQUES**
- Les tables de multiplication sont le test le plus simple d'automatisation.
- Tables déficitaires au CM1+ = signal fort.
- Distinguer :
  - **Déficit de stockage** (jamais acquis, performance constante faible) → difficile à récupérer.
  - **Déficit de récupération** (parfois correct, parfois non, très variable) → meilleur pronostic avec rééducation.

**RÉSOLUTION DE PROBLÈMES**
- Déconstruire en 3 étapes : **compréhension** énoncé → **modélisation** → **exécution** calcul.
- Déficit en compréhension isolé → chercher dyslexie / trouble de la compréhension écrite (cf. Exalang).
- Déficit en modélisation → trouble du **raisonnement** / fonctions exécutives → orienter vers neuropsy.
- Déficit en exécution seul (compréhension et modélisation correctes) → dyscalculie procédurale pure.

**ESTIMATION / LIGNE NUMÉRIQUE MENTALE**
- Épreuve très sensible, à faire systématiquement.
- Erreurs systématiques d'estimation sur ligne 0-100 ou 0-1000 → profil de **dyscalculie sévère**.

**GÉOMÉTRIE** (reproductions, symétries)
- Souvent **épargnée** dans la dyscalculie pure.
- Sa préservation aide au diagnostic différentiel.
- Déficit géométrique associé → orienter vers **trouble visuo-spatial** ou **dyspraxie visuo-constructive** (bilan psychomot / ergo).

---

#### 🎯 PROFILS TYPES

**PROFIL 1 — Dyscalculie développementale (spécifique)**
- Cognition numérique de base : Déficitaire à Pathologique (marqueur central)
- Estimation sur ligne numérique : Déficitaire
- Transcodage : Fragile à Déficitaire (erreurs syntaxiques et lexicales)
- Calcul mental : Déficitaire (stratégies immatures, comptage persistant)
- Tables multiplication : Déficitaire (déficit récupération et stockage)
- Géométrie : **Préservée** (critère différentiel fort)
- Intelligence globale : dans la norme (WISC-V normal, sauf sous-test quantitatif)
- **Diagnostic** : "Le profil est compatible avec une **dyscalculie développementale**, caractérisée par un déficit central du sens du nombre avec préservation relative des compétences visuo-spatiales et géométriques. L'intelligence globale est par ailleurs dans la norme, éliminant une déficience intellectuelle comme cause des difficultés."
- **PEC** : rééducation ciblée hebdomadaire, 24 mois minimum. Matériel manipulable (jetons, barres de Cuisenaire, droite graduée). Logiciels : Dybuster Calcularis, The Number Race.
- **Aménagements** : PAP (calculatrice autorisée, tables à disposition, énoncés simplifiés, temps majoré 1/3).

**PROFIL 2 — Difficultés arithmétiques secondaires (ex: co-dyslexie)**
- Cognition numérique de base : **Normale ou Limite basse** (clé du diagnostic différentiel)
- Transcodage : Déficitaire (surtout si dyslexie associée → erreurs phonologiques)
- Calcul mental : Fragile (difficultés mémoire de travail)
- Tables multiplication : Fragile (difficulté mémorisation globale)
- Résolution de problèmes : Déficitaire (souvent dû à la compréhension de l'énoncé écrit)
- **Contexte** : Exalang en parallèle montre une dyslexie, ou WISC montre un indice de mémoire de travail faible.
- **Diagnostic** : "Les difficultés arithmétiques de [Prénom] s'inscrivent dans un tableau plus large de trouble des apprentissages, et semblent **secondaires à** [trouble associé : dyslexie / trouble de la mémoire de travail / TDAH]. Le sens du nombre est préservé, éliminant une dyscalculie développementale pure."
- **PEC** : PEC du trouble primaire (dyslexie, attention). Soutien arithmétique par l'enseignant·e et/ou orthopédagogue. Pas systématiquement de PEC dyscalculie dédiée.
- **Aménagements** : PAP au titre du trouble primaire, avec mention des besoins mathématiques (énoncés lus, calculatrice).

**PROFIL 3 — Dyscalculie ET dyslexie associées (profil mixte DYS+DYS, 30-40% des cas)**
- Cognition numérique de base : **Déficitaire** (marqueur central dyscalculie).
- Transcodage : **Très déficitaire** — accumulation : erreurs phonologiques (dyslexie : "quatorze/quarante") + erreurs syntaxiques (dyscalculie : 308 → 3008).
- Calcul mental : Déficitaire (mémoire de travail surchargée).
- Tables multiplication : Pathologique (double impact : mémoire orthographique + automatisation arithmétique).
- Résolution problèmes : **Catastrophique** — la lecture/compréhension de l'énoncé est compromise par la dyslexie, l'exécution par la dyscalculie.
- Géométrie : préservée (critère différentiel diagnostic).
- Lecture (Exalang en parallèle) : déficitaire — confirme la dyslexie associée.
- **Diagnostic** : "Le profil clinique évoque une **comorbidité dyscalculie développementale + dyslexie-dysorthographie**, deux troubles spécifiques distincts mais associés. La cognition numérique de base est déficitaire (marqueur central de la dyscalculie), tandis que les épreuves de lecture et d'orthographe confirment une dyslexie sous-jacente. Ces deux troubles s'aggravent mutuellement, en particulier sur la résolution de problèmes mathématiques où la lecture des énoncés est compromise."
- **PEC** : **PEC orthophonique intensive et soutenue** (1-2 séances/semaine, 36+ mois). Travail séquencé :
  1. **Phase 1** (6-12 mois) : ciblage de la dyslexie en priorité (compréhension de texte est prérequis pour les problèmes mathématiques). Renforcement décodage + voie d'adressage.
  2. **Phase 2** (en parallèle dès le début) : travail spécifique du sens du nombre et de la cognition numérique de base (matériel manipulable, droite graduée, logiciels Dybuster Calcularis, The Number Race).
  3. **Phase 3** : travail croisé sur la résolution de problèmes (lecture + modélisation + exécution).
- **Aménagements MAXIMAUX** : PAP renforcé OU PPS via MDPH (recommandé vu la double atteinte). Calculatrice + énoncés lus + temps majoré 1/3 SYSTÉMATIQUE en mathématiques. Tolérance orthographique en mathématiques (ne pas pénaliser sur l'orthographe dans une copie de maths).
- **Coordination** : enseignant·e + parents + médecin scolaire + parfois ergothérapeute (outils numériques).
- **Pronostic** : plus lourd que dyscalculie ou dyslexie isolées. Investissement familial et scolaire indispensable. Bonne évolution possible avec PEC suivie, mais difficultés scolaires durables jusqu'au lycée minimum.

**PROFIL 4 — Anxiété mathématique / blocage affectif**
- Cognition numérique de base : **Normale**
- Transcodage : **Normal**
- Calcul simple sans pression : **Normal**
- Calcul chronométré : **Déficitaire** (chute de performance liée à la pression)
- Résolution de problèmes : Fragile (stratégies d'évitement)
- Observation clinique : **tension visible, larmes, refus, évitement**, discours "je suis nul", auto-dévalorisation, parents décrivent des pleurs quotidiens aux devoirs.
- Histoire scolaire : souvent une enseignante sévère ou un échec public qui a initié le blocage.
- **Diagnostic** : "Les capacités numériques de base et de calcul sont préservées hors pression. [Prénom] présente une **anxiété mathématique** importante, avec un impact émotionnel qui entrave ses performances en situation d'évaluation. **Aucun trouble spécifique dyscalculique n'est objectivable.**"
- **PEC** : PEC orthophonique courte (6-12 séances) centrée sur la **restauration de la confiance** numérique (matériel ludique, réussites accumulées). **Orientation psychologue** pour travail de l'anxiété scolaire. Travail avec les parents sur la dédramatisation.
- **Aménagements** : Pas de PAP au titre de la dyscalculie (pas justifié). Discussion avec l'enseignant·e pour dédramatiser l'évaluation chronométrée.

---

#### DIAGNOSTIC DIFFÉRENTIEL (critères cumulatifs pour dyscalculie développementale)

Pour poser un diagnostic de dyscalculie développementale, les critères suivants doivent être réunis :

1. Écart ≥ **-2 É-T** (ou P < 2) sur au moins **deux domaines** de la cognition numérique.
2. Persistance malgré une prise en charge pédagogique adaptée d'au moins 6 mois.
3. Retentissement **scolaire significatif** et objectivable.
4. **Exclusion** : déficience intellectuelle (QI global < 70), trouble sensoriel non corrigé, absentéisme chronique, difficulté socio-culturelle majeure (non-francophonie récente).
5. Préservation des compétences non-numériques attendues à l'âge.

Sans ces 5 critères réunis → ne pas diagnostiquer une dyscalculie, rester sur "difficultés arithmétiques" avec analyse différentielle.

---

#### ARTICULATION AVEC D'AUTRES OUTILS

- **En complément** : UDN-II (Utilisation du Nombre, étalonné CE2-4e), ZAREKI-R, TEDI-MATH (CP-CE1), TEDI-MATH Grands (CE2-3e).
- **En amont** : Examath 5-8 ou TEDI-MATH pour dépistage précoce CP.
- **Cognitif global** : WISC-V (indice de raisonnement quantitatif + vitesse de traitement).
- **Fonctions exécutives** : NEPSY-II, TEA-Ch, BRIEF (parent/enseignant).
- **Langage écrit associé** : Exalang 8-11 ou Exalang 11-15 systématique (co-morbidité dyslexie 30-40%).
- **Visuo-spatial** : Bender, Figure de Rey (psychomot / ergo).

---

#### RECOMMANDATIONS TYPES PAR PROFIL

- **Dyscalculie développementale** : rééducation hebdomadaire 30-45 min, 24-36 mois. Bilan de fin de CM2 et de 5e pour ajustement aménagements.
- **Difficultés secondaires** : PEC du trouble primaire, pas de PEC dyscalculie dédiée sauf si apparition secondaire d'une peur des maths.
- **Anxiété mathématique** : PEC courte + psychologue obligatoire.

En cas de diagnostic de dyscalculie : PAP automatique. PPS/MDPH à envisager si association avec d'autres DYS ou TDAH.`,
}
