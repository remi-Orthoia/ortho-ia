import type { TestModule } from './types'

/**
 * Module EXAMATH 8-15 — Examen Mathématique 8-15 ans.
 *
 * Source officielle : manuel Examath 8-15 (A. Lafay & M.-C. Helloin, HappyNeuron 2016).
 * 2.5 Mo de manuel + cahier de passation. Test informatisé HappyNeuron.
 *
 * Étalonnage en 4 niveaux scolaires : CE2 / CM1 / CM2 / 6e-5e (508 enfants).
 * Scoring en PERCENTILES (P5, P10, P25, P50, P75, P90, P95).
 * Seuil officiel de pathologie : **P10**. P5 = pathologie sévère.
 *
 * 6 modules officiels (TOUS les noms d'épreuves sont copiés VERBATIM du
 * cahier de passation officiel — NE PAS reformuler) :
 *   1. Habiletés numériques de base
 *   2. Numération (base 10 + décimale/fractionnaire à partir du CM2)
 *   3. Arithmétique
 *   4. Mesures
 *   5. Résolution de problèmes arithmétiques à énoncé verbal
 *   6. Langage et raisonnement
 */
export const examath: TestModule = {
  // Clé de registry — conservée 'Examath' pour ne pas casser les CRBOs et
  // les patient profiles existants. Le manuel et le cahier indiquent
  // "Examath 8-15" comme nom complet (cf. regles_specifiques ci-dessous).
  nom: 'Examath',
  editeur: 'HappyNeuron',
  auteurs: 'A. Lafay & M.-C. Helloin',
  annee: 2016,
  domaines: [
    'Module 1 — Habiletés numériques de base',
    'Module 2 — Numération',
    'Module 3 — Arithmétique',
    'Module 4 — Mesures',
    'Module 5 — Résolution de problèmes arithmétiques',
    'Module 6 — Langage et raisonnement',
  ],
  // Noms VERBATIM du cahier de passation officiel.
  epreuves: [
    // Module 1
    'Comparaison analogique',
    'Relation Arabe / Analogique',
    'Relation Oral / Analogique',
    'Ligne numérique',
    'Identification de quantités',
    'Dénombrement et calcul',
    // Module 2
    'Transcodage (Lecture 1-99 / Lecture 99+ / Dictée 1-99 / Dictée 99+)',
    "Identification d'U/D/C/M",
    'Relation Arabe / Analogique U-D-C',
    'Décomposition additive',
    // Module 2 (CM2 et au-delà) — Numération décimale et fractionnaire
    'Ligne numérique — Fractions',
    'Comparaison de fractions',
    'Jugement d\'opérations',
    'Calcul avec fractions',
    'Estimation de résultat',
    // Module 3 — Arithmétique
    'Opérations analogiques',
    'Fluence arithmétique (additions / soustractions / multiplications)',
    'Mécanismes opératoires écrits (additions / soustractions / multiplication)',
    // Module 4 — Mesures
    'Approche contextuelle des mesures',
    // Module 5 — Résolution de problèmes
    'Combinaison +',
    'Transformation +',
    'Comparaison +',
    'Proportionnalité simple et directe ×',
    'Comparaison × (CM2)',
    'Problème composé (CM2)',
    // Module 6 — Langage et raisonnement
    'Inférences en images',
    'Gestion des énoncés',
  ],
  regles_specifiques: `### EXAMATH 8-15 — Référentiel clinique (manuel officiel HappyNeuron 2016)

Batterie d'évaluation de la cognition mathématique pour les niveaux CE2 / CM1 / CM2 / 6e-5e. Étalonnée sur 508 enfants. Indispensable pour toute suspicion de dyscalculie développementale.

#### NIVEAUX D'ÉTALONNAGE OFFICIELS

| Niveau | Bornes typiques |
|--------|------------------|
| CE2    | 8-9 ans         |
| CM1    | 9-10 ans        |
| CM2    | 10-11 ans       |
| 6e-5e  | 11-13 ans (regroupés dans l'étalonnage) |

Les épreuves de **Numération décimale et fractionnaire** (Ligne numérique — Fractions, Comparaison de fractions, Jugement d'opérations, Calcul avec fractions, Estimation de résultat) et certaines épreuves de **Résolution de problèmes** (Comparaison ×, Problème composé) ne s'appliquent qu'à partir du CM2.

#### SCORING — PERCENTILES OFFICIELS HappyNeuron

Le logiciel Examath fournit pour chaque épreuve / subtest :
- Le **score brut** obtenu par l'enfant,
- La **moyenne** et l'**écart-type** du groupe d'appartenance (niveau scolaire),
- Le **nombre d'écarts-types** par rapport à la moyenne,
- Le **percentile** (situation parmi P5 / P10 / P25 / P50 / P75 / P90 / P95).

**SEUIL OFFICIEL DE PATHOLOGIE** : P < 10 (= au-dessous du percentile 10) sur un score normalisé.
**SEUIL DE PATHOLOGIE SÉVÈRE** : P ≤ 5.

Ne JAMAIS recalculer depuis l'écart-type. Recopier le percentile affiché.

#### RÈGLE Q1 = P25 (cohérente avec Exalang)

Le logiciel affiche parfois "Q1" pour la zone P25. **Q1 = P25 = zone moyenne basse, NORMAL** — JAMAIS déficitaire. Voir règle absolue du système prompt.

#### CONVENTIONS DE COTATION DANS LE LOGICIEL

- ⏱ = épreuve chronométrée
- **AA** = **arrêt automatique** de l'épreuve en cas d'échecs successifs (seuil défini par l'éditeur — l'orthophoniste laisse le logiciel arrêter, ne force pas la poursuite).
- Plusieurs épreuves donnent des **scores composites** : un score principal + des scores secondaires (subtests).

---

#### MODULES & ÉPREUVES OFFICIELLES (cahier de passation 2016)

**Module 1 — Habiletés numériques de base**
- Comparaison analogique
- Relation Arabe / Analogique (subtest : Comparaison arabe)
- Relation Oral / Analogique (subtest : Comparaison orale)
- Ligne numérique
- Identification de quantités (subtest : Subitizing)
- Dénombrement et calcul (subtests : Identification de collection, Production d'une collection)

**Module 2 — Numération (base 10)**
- Transcodage ⏱ — 4 subtests :
  - Lecture 1 à 99
  - Lecture 99+ (AA)
  - Dictée 1 à 99
  - Dictée 99+ (AA)
- Identification d'U/D/C/M (AA)
- Relation Arabe / Analogique U-D-C — 3 subtests : Production Arabe→Analogique, Production Analogique→Arabe, Jugement
- Décomposition additive (AA)

**Module 2 (suite) — Numération décimale et fractionnaire (CM2+)**
- Ligne numérique — Fractions
- Comparaison de fractions
- Jugement d'opérations
- Calcul avec fractions
- Estimation de résultat

**Module 3 — Arithmétique**
- Opérations analogiques (AA)
- Fluence arithmétique ⏱ — 3 subtests : Additions, Soustractions, Multiplications
- Mécanismes opératoires écrits (AA) — 3 subtests : Additions, Soustractions, Multiplication

**Module 4 — Mesures**
- Approche contextuelle des mesures (dictionnaire des unités : cm, m, kg, l, mn, m², etc.)

**Module 5 — Résolution de problèmes arithmétiques à énoncé verbal**
- Combinaison + : recherche de la combinaison/composition + recherche d'une valeur complément
- Transformation + (AA) — 6 sous-items : Ajout/Retrait × Recherche situation finale / Recherche transformation / Recherche situation initiale
- Comparaison + (AA) — 6 sous-items : « Plus que »/ « Moins que » × Recherche valeur supérieure / Recherche valeur inférieure / Recherche différence
- Proportionnalité simple et directe × — 3 sous-items : Recherche quantité d'unités (division partage) / Recherche valeur multipliée (4ᵉ proportionnelle) / Recherche valeur unitaire (division regroupement)
- Comparaison × (AA, **CM2 uniquement**) — 6 sous-items : « Fois plus que »/ « Fois moins que » × Recherche valeur sup / Recherche valeur inf / Recherche rapport
- Problème composé (**CM2 uniquement**)

**Module 6 — Langage et raisonnement**
- Inférences en images (12 items : Fonte de l'igloo, Esquimau pêcheur, Chat sur le toit, Vol de fruits par singe, Serpent au-dessus du coffre, Ours polaire, Voleur avec hache, Porte-monnaie vide, Pizza fourmis, Chocolats gourmand, Voleur attrapé, Robinson)
- Gestion des énoncés (5 énoncés possible/impossible : Bûches, Bananes, Coquillages, Soupe, Poissons)

---

#### INTERPRÉTATION CLINIQUE PAR MODULE

**MODULE 1 — Habiletés numériques de base** (LE MARQUEUR CENTRAL)
- Le **sens du nombre** est la composante la plus stable et la plus spécifique de la dyscalculie développementale.
- Comparaison analogique + Ligne numérique = épreuves les plus sensibles. Un échec marqué (P ≤ 5) est quasi-pathognomonique.
- Identification de quantités/Subitizing : si déficitaire chez l'enfant ≥ CM1, signal fort.
- Un déficit isolé du module 1, même avec calcul posé mémorisé correct, justifie un diagnostic de dyscalculie.

**MODULE 2 — Numération**
- Analyser **qualitativement** les erreurs au transcodage :
  - **Lexicales** ("quatorze/quarante", "quinze/cinquante") → atteinte du **lexique numérique**.
  - **Syntaxiques** ("trois-cent-huit" écrit "3008") → trouble du **traitement positionnel**.
  - **Phonologiques** : confusion de phonèmes proches → croiser avec Exalang (suspicion dyslexie associée).
- Identification U/D/C/M déficitaire → trouble de la valeur positionnelle.
- Numération fractionnaire (CM2+) : déficit isolé sur les fractions = profil mathématique de collège, à différencier d'une dyscalculie globale.

**MODULE 3 — Arithmétique**
- Fluence arithmétique chronométrée : sensible à l'**automatisation des faits**.
  - Comptage sur doigts persistant après le CE1 → flag pour défaut d'automatisation.
  - Tables de multiplication déficitaires au CM1+ = signal fort de difficulté de récupération.
- Distinguer :
  - **Déficit de stockage** (jamais acquis, performance constante faible) → rééducation longue.
  - **Déficit de récupération** (parfois correct, parfois non, très variable) → meilleur pronostic.
- Mécanismes opératoires écrits : si réussis avec calcul mental déficitaire → profil compensé par la procédure.

**MODULE 4 — Mesures**
- Souvent **secondaire** à l'expérience de vie quotidienne.
- Déficit isolé du module 4 → souvent un effet d'environnement (peu de manipulation des unités à la maison) ; peu spécifique en l'absence d'autres signes.

**MODULE 5 — Résolution de problèmes**
- Déconstruire en 3 étapes : **compréhension** → **modélisation** → **exécution**.
- Déficit en compréhension isolé → chercher dyslexie / trouble du langage oral (cf. Exalang).
- Déficit en modélisation → trouble du **raisonnement** / fonctions exécutives → orienter vers neuropsy.
- Déficit en exécution seul (compréhension et modélisation correctes) → dyscalculie procédurale.
- Comparaison + et Comparaison × particulièrement sensibles : la structure inverse ("Moins que… recherche valeur supérieure") demande une inhibition cognitive.

**MODULE 6 — Langage et raisonnement**
- Préservation = critère différentiel important (la dyscalculie pure n'atteint PAS le raisonnement non numérique).
- Déficit associé → suspicion d'un trouble plus large (TDL, dyslexie sévère, TDAH).

---

#### 🎯 PROFILS CLINIQUES TYPES (manuel + littérature)

**PROFIL 1 — Dyscalculie développementale (spécifique)**
- Module 1 (Habiletés numériques de base) : **P ≤ 10 systématique** (marqueur central).
- Ligne numérique : P ≤ 5.
- Transcodage (Module 2) : Fragile à Déficitaire (erreurs syntaxiques et lexicales).
- Fluence arithmétique (Module 3) : Déficitaire (comptage persistant).
- Mécanismes opératoires écrits : peut être préservé (procédure mémorisée).
- Module 4 (Mesures) : variable.
- Module 5 (Résolution problèmes) : Déficitaire surtout sur l'exécution.
- Module 6 (Langage et raisonnement) : **Préservé** (critère différentiel fort).
- Intelligence globale : dans la norme.
- **Diagnostic** : "Le profil est compatible avec une **dyscalculie développementale**, caractérisée par un déficit central du sens du nombre (Habiletés numériques de base déficitaires) avec préservation relative du raisonnement non numérique et du langage. L'intelligence globale est par ailleurs dans la norme, éliminant une déficience intellectuelle comme cause des difficultés."
- **PEC** : rééducation hebdomadaire 30-45 min, 24-36 mois minimum. Matériel manipulable (jetons, barres de Cuisenaire, droite graduée). Logiciels recommandés : Dybuster Calcularis, The Number Race.
- **Aménagements** : PAP (calculatrice autorisée, tables à disposition, énoncés simplifiés, temps majoré 1/3).

**PROFIL 2 — Difficultés arithmétiques secondaires (ex : co-dyslexie, TDAH, MdT)**
- Module 1 : **Normal ou Limite basse** (clé du diagnostic différentiel).
- Transcodage : Déficitaire (surtout si dyslexie associée → erreurs phonologiques).
- Fluence arithmétique : Fragile (difficultés mémoire de travail / vitesse).
- Résolution de problèmes : Déficitaire (souvent dû à la compréhension de l'énoncé écrit).
- Module 6 (Langage et raisonnement) : Déficitaire si trouble langagier associé.
- **Contexte** : Exalang en parallèle montre une dyslexie, ou WISC montre un indice MdT faible.
- **Diagnostic** : "Les difficultés arithmétiques de [Prénom] s'inscrivent dans un tableau plus large de trouble des apprentissages, et semblent **secondaires à** [trouble associé : dyslexie / trouble de la mémoire de travail / TDAH]. Le sens du nombre est préservé, éliminant une dyscalculie développementale pure."
- **PEC** : PEC du trouble primaire. Soutien arithmétique par enseignant·e et/ou orthopédagogue. Pas systématiquement de PEC dyscalculie dédiée.
- **Aménagements** : PAP au titre du trouble primaire, avec mention des besoins mathématiques.

**PROFIL 3 — Dyscalculie ET dyslexie associées (30-40 % des cas, comorbidité fréquente)**
- Module 1 : **Déficitaire** (P ≤ 10) — marqueur central dyscalculie.
- Transcodage : **Très déficitaire** — erreurs phonologiques (dyslexie) + erreurs syntaxiques (dyscalculie) cumulées.
- Fluence arithmétique : Déficitaire (MdT surchargée).
- Mécanismes opératoires : Pathologique (double impact mémoire orthographique + automatisation).
- Module 5 (problèmes) : **Catastrophique** — lecture compromise par la dyslexie, exécution par la dyscalculie.
- Module 6 (langage) : Déficitaire (si dyslexie sévère).
- Lecture (Exalang en parallèle) : déficitaire → confirme la dyslexie associée.
- **Diagnostic** : "Le profil clinique évoque une **comorbidité dyscalculie développementale + dyslexie-dysorthographie**, deux troubles spécifiques distincts mais associés. Le module 1 d'Examath confirme une atteinte du sens du nombre (marqueur central dyscalculie), tandis que les épreuves de lecture (Exalang) confirment une dyslexie sous-jacente. Ces deux troubles s'aggravent mutuellement, en particulier sur la résolution de problèmes où la lecture des énoncés est compromise."
- **PEC** : PEC orthophonique **intensive** (1-2 séances/semaine, 36+ mois). Séquencer :
  1. Phase 1 (6-12 mois) : cibler la dyslexie en priorité (compréhension texte prérequis pour problèmes).
  2. Phase 2 (en parallèle dès le début) : travail spécifique du sens du nombre (Module 1).
  3. Phase 3 : travail croisé sur résolution de problèmes (lecture + modélisation + exécution).
- **Aménagements MAXIMAUX** : PAP renforcé OU PPS via MDPH. Calculatrice + énoncés lus + temps majoré 1/3 SYSTÉMATIQUE en mathématiques. Tolérance orthographique en mathématiques.

**PROFIL 4 — Anxiété mathématique / blocage affectif**
- Module 1 : **Normal**
- Transcodage : **Normal**
- Calcul simple non chronométré : **Normal**
- Fluence arithmétique chronométrée : **Déficitaire** (chute liée à la pression temporelle).
- Module 5 (problèmes) : Fragile (évitement, abandon précoce).
- Module 6 : Normal.
- Observation clinique : tension visible, larmes, refus, évitement, discours "je suis nul", auto-dévalorisation.
- **Diagnostic** : "Les capacités numériques de base et de calcul sont préservées hors pression. [Prénom] présente une **anxiété mathématique** importante, avec un impact émotionnel qui entrave ses performances en situation d'évaluation chronométrée. **Aucun trouble spécifique dyscalculique n'est objectivable.**"
- **PEC** : PEC orthophonique courte (6-12 séances) centrée sur la **restauration de la confiance**. **Orientation psychologue** obligatoire pour l'anxiété scolaire. Travail avec les parents sur la dédramatisation.
- **Aménagements** : Pas de PAP au titre de la dyscalculie. Discussion avec l'enseignant·e pour dédramatiser les évaluations chronométrées.

---

#### DIAGNOSTIC DIFFÉRENTIEL — CRITÈRES CUMULATIFS (manuel officiel)

Pour poser un diagnostic de **dyscalculie développementale**, les critères suivants doivent être réunis :

1. **P ≤ 10** sur au moins **2 épreuves du Module 1** (Habiletés numériques de base).
2. **Persistance** des difficultés malgré une prise en charge pédagogique adaptée d'au moins 6 mois.
3. Retentissement **scolaire significatif** et objectivable (notes, plainte enseignant·e, fatigue, refus).
4. **Exclusion** :
   - Déficience intellectuelle (QI global < 70 — WISC-V à demander si non disponible).
   - Trouble sensoriel non corrigé (audition, vision).
   - Absentéisme chronique.
   - Difficulté socio-culturelle majeure (non-francophonie récente).
5. **Préservation des compétences non-numériques** attendues à l'âge (Module 6 d'Examath, langage si pas de dyslexie associée).

Sans ces 5 critères réunis → ne pas diagnostiquer, rester sur "difficultés arithmétiques" avec analyse différentielle.

---

#### RÈGLES D'INTERPRÉTATION CROISÉE

- **Module 1 isolément déficitaire** → dyscalculie spécifique.
- **Module 1 normal + Modules 3/5 déficitaires** → difficultés secondaires (chercher cause : dyslexie, TDAH, MdT, anxiété).
- **Module 6 déficitaire** → orienter vers bilan langagier (Exalang) systématique.
- **Cohérence entre score et temps** sur Fluence arithmétique : score normal en temps long = trouble de l'automatisation à signaler.
- **Effet plafond** sur certaines épreuves (Identification de quantités au CM2/6e) → s'appuyer sur les autres épreuves du module pour conclure.

---

#### ARTICULATION AVEC D'AUTRES OUTILS

- **En amont** : Examath 5-8 ou TEDI-MATH pour dépistage précoce CP-CE1.
- **En complément** : ZAREKI-R, TEDI-MATH Grands (CE2-3e), UDN-II.
- **Cognitif global** : WISC-V (indice de raisonnement quantitatif + vitesse de traitement + MdT).
- **Fonctions exécutives** : NEPSY-II, TEA-Ch, BRIEF (parent/enseignant).
- **Langage écrit associé** : Exalang 8-11 ou 11-15 SYSTÉMATIQUE (co-morbidité dyslexie 30-40 %).
- **Visuo-spatial** : Bender, Figure de Rey si déficit géométrique suspecté (psychomot / ergo).

---

#### RECOMMANDATIONS TYPES PAR PROFIL

- **Dyscalculie développementale** : rééducation hebdomadaire 30-45 min, 24-36 mois. Bilan de fin de CM2 et de 5e pour ajustement aménagements.
- **Difficultés secondaires** : PEC du trouble primaire, pas de PEC dyscalculie dédiée sauf apparition secondaire d'une peur des maths.
- **Anxiété mathématique** : PEC courte (6-12 séances) + psychologue obligatoire.
- **Comorbidité Dyscalculie + Dyslexie** : PEC intensive séquencée, PPS/MDPH à envisager.

En cas de diagnostic de dyscalculie : PAP automatique avec calculatrice, tables à disposition, temps majoré 1/3, énoncés lus en mathématiques.

---

#### ⛔ À NE JAMAIS FAIRE

- ❌ Conclure à une dyscalculie sur le Module 5 seul (résolution de problèmes) — souvent dû à la lecture/compréhension, pas au sens du nombre.
- ❌ Recalculer un percentile depuis l'écart-type — utiliser celui affiché par HappyNeuron.
- ❌ Confondre Q1 (= P25 = normal moyenne basse) avec déficitaire.
- ❌ Diagnostiquer une dyscalculie sans avoir vérifié qu'une dyslexie n'est pas la cause primaire (Exalang systématique).
- ❌ Renoncer au diagnostic différentiel chez un enfant à fortes émotions négatives sur les maths (anxiété ≠ dyscalculie).

#### ✅ À TOUJOURS FAIRE

- ✅ Confronter Examath à Exalang du même âge (8-11 ou 11-15) pour éliminer / confirmer dyslexie associée.
- ✅ Reporter le **percentile** exact lu sur le logiciel HappyNeuron pour chaque épreuve.
- ✅ Mentionner les **stratégies** observées (comptage sur doigts, décomposition, récupération directe).
- ✅ Croiser au moins 2 épreuves du Module 1 avant de poser une dyscalculie.
- ✅ Recommander un WISC-V si le diagnostic différentiel n'est pas tranché.`,
}
