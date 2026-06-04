import type { TestModule } from './types'

/**
 * EXAMATH 8-15 — Référentiel aligné sur le manuel officiel
 * (Lafay & Helloin, HappyNeuron 2016).
 *
 * Source de vérité : `docs/Bilans Sources/Manuel examath 8-15.pdf` + cahier
 * de passation officiel. Tout changement de structure (modules, épreuves,
 * scoring) doit être confronté à ce manuel.
 *
 * Examath est la seule batterie informatisée francophone validée pour le
 * diagnostic de dyscalculie développementale. Étalonnée sur 508 enfants
 * et adolescents (CE2 → 3e). 40 épreuves réparties en 6 modules officiels.
 *
 * Refonte 2026-06 : ajout des 10+ épreuves manquantes (Répétition grands
 * nombres, Fractions images, Jugement écriture décimale, Calcul mental
 * complexe, Équivalence/Comparaison mesures, Problèmes mesures,
 * Proportionnalité composée/multiple, Problèmes composés, Inférences
 * logiques/verbales/lexicales, Lexique mathématique). Restructuration des
 * modules selon manuel (Jugement opérations, Calcul fractions, Estimation
 * résultat reclassés dans M3 Arithmétique). Ajout du niveau 4e-3e.
 */
export const examath: TestModule = {
  nom: 'Examath',
  editeur: 'HappyNeuron',
  auteurs: 'Anne Lafay & Marie-Christel Helloin',
  annee: 2016,
  domaines: [
    'Module 1 — Habiletés numériques de base',
    'Module 2 — Numération (base 10 + décimale/fractionnaire)',
    'Module 3 — Arithmétique',
    'Module 4 — Mesures',
    'Module 5 — Résolution de problèmes arithmétiques',
    'Module 6 — Langage et raisonnement',
  ],
  // Libellés officiels EXACTS du cahier de passation — NE PAS reformuler.
  epreuves: [
    // M1 (6)
    'Comparaison analogique',
    'Relation Arabe / Analogique',
    'Relation Oral / Analogique',
    'Ligne numérique',
    'Identification de quantités',
    'Dénombrement et calcul',
    // M2 — Numération base 10 (5)
    'Transcodage',
    'Répétition de grands nombres',
    "Identification d'U/D/C/M",
    'Relation Arabe / Analogique U-D-C',
    'Décomposition additive',
    // M2 — Numération décimale et fractionnaire (4, CM2+)
    'Fractions en images',
    'Ligne numérique — Fractions',
    "Jugement d'écriture décimale",
    'Comparaison de fractions',
    // M3 — Arithmétique (7)
    'Opérations analogiques',
    "Jugement d'opérations",
    'Fluence arithmétique',
    'Calcul mental complexe',
    'Mécanismes opératoires écrits',
    'Calcul avec fractions',
    'Estimation de résultat',
    // M4 — Mesures (3)
    'Approche contextuelle des mesures',
    'Équivalence et Comparaison',
    'Problèmes de mesures',
    // M5 — Résolution de problèmes arithmétiques (9)
    'Combinaison +',
    'Transformation +',
    'Comparaison +',
    'Proportionnalité simple et directe ×',
    'Proportionnalité simple composée ×',
    'Proportionnalité multiple ×',
    'Comparaison ×',
    'Problème composé',
    'Problèmes composés',
    // M6 — Langage et raisonnement (6)
    'Inférences en images',
    'Inférences logiques non verbales',
    'Inférences verbales',
    'Inférences lexicales et sémantiques',
    'Mathématique — Lexique',
    'Gestion des énoncés',
  ],
  regles_specifiques: `### EXAMATH 8-15 — Référentiel clinique aligné sur le manuel officiel

Source : Anne Lafay & Marie-Christel Helloin (HappyNeuron, 2016). 508 enfants normés. Batterie informatisée de référence pour la cognition mathématique chez les 8-15 ans (CE2 → 3e).

#### POPULATION ET ÉTALONNAGES

5 niveaux d'étalonnage officiels :
| Niveau | Bornes typiques |
|--------|------------------|
| CE2    | 8-9 ans         |
| CM1    | 9-10 ans        |
| CM2    | 10-11 ans       |
| 6e-5e  | 11-13 ans       |
| 4e-3e  | 13-15 ans       |

Les épreuves de **Numération décimale et fractionnaire** (Fractions en images, Ligne numérique — Fractions, Jugement d'écriture décimale, Comparaison de fractions) et certaines épreuves de **Arithmétique** (Jugement d'opérations, Calcul avec fractions, Estimation de résultat) ne s'appliquent qu'à partir du **CM2**.

Les épreuves de **Résolution de problèmes** complexes (Proportionnalité simple composée, Proportionnalité multiple, Comparaison ×, Problème composé, Problèmes composés) sont également CM2+ ou 6e+ selon les cas.

#### SCORING — PERCENTILES OFFICIELS HappyNeuron

Le logiciel Examath fournit pour chaque épreuve / subtest :
- **Score brut** obtenu,
- **Moyenne** et **écart-type** du groupe d'appartenance (niveau scolaire),
- **Nombre d'écarts-types** par rapport à la moyenne,
- **Percentile** parmi P5 / P10 / P25 / P50 / P75 / P90 / P95.

**SEUILS OFFICIELS DE PATHOLOGIE** (manuel section 6.2.3) :
- **P ≤ 10** : pathologique (au-dessous du percentile 10).
- **P ≤ 5** : pathologie sévère.

⚠️ Examath fournit aussi un **temps** pour les épreuves chronométrées (Transcodage, Fluence arithmétique, certaines proportionnalités). Un temps anormalement long sur un score préservé reste un signal clinique — la rapidité est une dimension de l'expertise mathématique.

Conversion vers la grille 6 zones ortho.ia (mapping interne pour la couleur Word) :
- > P95 : Excellent (vert foncé)
- P91-P95 : Excellent (vert)
- P76-P90 : Excellent (vert clair)
- P50-P75 : Moyenne haute (vert pâle, Q3 inclus)
- P26-P49 : Moyenne basse (jaune)
- P11-P25 : Zone de fragilité (orange clair, Q1 inclus)
- P6-P10 : Difficulté (orange foncé) — **SEUIL PATHOLOGIE**
- P1-P5 : Difficulté sévère (rouge) — **PATHOLOGIE SÉVÈRE**

#### LES 6 MODULES — DÉTAIL DES 40 ÉPREUVES

##### MODULE 1 — HABILETÉS NUMÉRIQUES DE BASE (6 épreuves)

**Cœur du diagnostic dyscalculie primaire** : le manuel insiste sur le **sens du nombre** (Number sense, Dehaene 2010) comme atteinte cognitive centrale de la dyscalculie développementale. Système Numérique Approximatif (SNA) + Système Numérique Précis (SNP).

1. **Comparaison analogique** — Compare 2 collections de points (SNA non symbolique). Marqueur central de la dyscalculie primaire. Référence : Dehaene, Butterworth.
2. **Relation Arabe / Analogique** (subtest Comparaison arabe) — Mise en correspondance chiffre arabe ↔ quantité analogique. Atteinte = défaut d'accès au sens du nombre depuis le code arabe (hypothèse Noël & Rousselle 2011).
3. **Relation Oral / Analogique** (subtest Comparaison orale) — Mise en correspondance nombre oral ↔ quantité. Évalue le code verbal du nombre.
4. **Ligne numérique** — Estimer position d'un nombre sur ligne 0-100 / 0-1000. **Très sensible** : compression logarithmique anormale après CE2 = quasi-pathognomonique (Figure 3, 4, 5 du manuel).
5. **Identification de quantités** (subitizing) — Reconnaissance rapide de petites quantités sans dénombrement (1-4 objets). Le subitizing s'installe à 5 ans normalement.
6. **Dénombrement et calcul** (identification + production d'une collection) — Dénombrer jusqu'à 25, produire une collection à la demande. Stratégies à noter : doigts, par groupes, comptage 1 par 1.

##### MODULE 2 — NUMÉRATION (9 épreuves)

**Sous-section A — Numération base 10** (5 épreuves, tous niveaux) :

7. **Transcodage** (4 subtests chronométrés) — Lecture 1-99, Lecture 99+, Dictée 1-99, Dictée 99+. **Analyse qualitative des erreurs** :
   - Lexicales : quatorze/quarante (confusion d'étiquettes verbales)
   - Syntaxiques : 3008 écrit pour 308 (défaut de conversion arabe→verbal, fragilité positionnelle)
8. **Répétition de grands nombres** — Boucle phonologique + code verbal du nombre. Échec = signal MdT verbale (croiser avec empan endroit Exalang).
9. **Identification d'U/D/C/M** — Identifier unités, dizaines, centaines, milliers. Valeur positionnelle. Échec massif au CM1+ = défaut central de représentation base 10.
10. **Relation Arabe / Analogique U-D-C** (3 subtests : production Arabe→Analogique, Analogique→Arabe, Jugement) — Représentation imagée U-D-C (cubes/barres/plaques).
11. **Décomposition additive** — Décomposer un nombre en centaines+dizaines+unités. Maîtrise base 10.

**Sous-section B — Numération décimale et fractionnaire** (4 épreuves, CM2+) :

12. **Fractions en images** — Identifier fractions depuis représentations imagées (parts colorées). Conceptualisation fractionnaire de base.
13. **Ligne numérique — Fractions** — Positionner fraction sur ligne 0-1. Plus exigeant qu'images : représentation analogique de la quantité fractionnaire.
14. **Jugement d'écriture décimale** — Juger validité d'une écriture décimale. Détecte confusions "2,10 > 2,9".
15. **Comparaison de fractions** — Comparer 2 fractions. Croiser avec Ligne numérique fractions.

##### MODULE 3 — ARITHMÉTIQUE (7 épreuves)

16. **Opérations analogiques** — Opérations sur représentations imagées. Préservé + symbolique altéré = défaut d'accès au sens du nombre.
17. **Jugement d'opérations** (CM2+) — Estimer plausibilité d'un résultat d'opération. Sens du nombre opérationnel.
18. **Fluence arithmétique** (3 subtests chronométrés : Additions, Soustractions, Multiplications) — Vitesse de récupération des faits arithmétiques. **Tables défaillantes au CM1+ = signal fort dyscalculie**. Comptage sur doigts persistant après CE1 = défaut d'automatisation.
19. **Calcul mental complexe** — Calculs multi-étapes (retenue, plusieurs opérations). Mobilise MdT + automatisation + procédures. Discriminant pour profils compensés (faits OK mais MdT faible).
20. **Mécanismes opératoires écrits** (3 subtests : Additions, Soustractions, Multiplication) — Opérations posées sur papier. Procédure préservée = profil compensé même si calcul mental déficitaire. Erreurs systématiques (oubli retenue, sens posé inversé) = défaut procédural pur.
21. **Calcul avec fractions** (CM2+) — Additions, soustractions, multiplications de fractions simples.
22. **Estimation de résultat** (CM2+) — Estimer ordre de grandeur d'un résultat avant calcul. **Forte sollicitation du sens du nombre** — déficit = signal fort dyscalculie primaire.

##### MODULE 4 — MESURES (3 épreuves)

23. **Approche contextuelle des mesures** — Associer une unité (cm, m, kg, l, mn, m²) à un objet ou contexte usuel. Peu spécifique en isolé — dépend de l'expérience de vie.
24. **Équivalence et Comparaison** — Convertir entre unités (cm↔m, g↔kg) et comparer mesures. Sollicite base 10 + sens du nombre.
25. **Problèmes de mesures** — Problèmes verbalisés mobilisant grandeurs et conversions. Croiser avec M5 pour différencier difficulté problème vs conversion d'unités.

##### MODULE 5 — RÉSOLUTION DE PROBLÈMES ARITHMÉTIQUES À ÉNONCÉ VERBAL (9 épreuves)

⚠️ **Déficit isolé sur ce module = souvent secondaire** (dyslexie, trouble du langage, MdT verbale faible). Ne pas conclure à une dyscalculie primaire sur la seule base d'un échec en problèmes.

26. **Combinaison +** — Composition simple. Addition à élaborer depuis l'énoncé.
27. **Transformation +** — Ajout / retrait avec recherche d'état initial, final, ou transformation (6 sous-items). Plus exigeant que combinaison (modélisation temporelle).
28. **Comparaison +** — "Plus que" / "Moins que" avec recherche valeur supérieure, inférieure, différence. Structures inverses ("X moins de Y que Z, Y = ?") sollicitent fortement l'inhibition du référent linguistique.
29. **Proportionnalité simple et directe ×** — Quantité d'unités (division partage), valeur multipliée (4ᵉ proportionnelle), valeur unitaire (division regroupement).
30. **Proportionnalité simple composée ×** (CM2+) — Proportionnalité avec étape intermédiaire.
31. **Proportionnalité multiple ×** (6e+) — Plusieurs niveaux de variables (unités et débits).
32. **Comparaison ×** (CM2+) — "Fois plus que" / "Fois moins que".
33. **Problème composé** (CM2+) — Coordination de plusieurs opérations.
34. **Problèmes composés** (6e+) — Coordination de 3+ opérations/variables.

##### MODULE 6 — LANGAGE ET RAISONNEMENT (6 épreuves)

⚠️ **Préservation = critère différentiel important**. Déficit associé = orienter vers bilan langagier (Exalang).

35. **Inférences en images** — 12 scènes images, déduction logique sans support verbal (Fonte de l'igloo, Esquimau pêcheur, Chat sur le toit, Vol de fruits, Serpent, Ours polaire, Voleur, Porte-monnaie vide, Pizza fourmis, Chocolats gourmand, Voleur attrapé, Robinson).
36. **Inférences logiques non verbales** — Suites, analogies sur supports non verbaux. Distingue difficulté logique pure vs difficulté verbale.
37. **Inférences verbales** — Inférences depuis énoncés verbaux. Échec ici + Inférences images préservées = trouble du langage / compréhension.
38. **Inférences lexicales et sémantiques** — Accès lexical sémantique. Croiser avec Exalang Lexique-sémantique.
39. **Mathématique — Lexique** — Vocabulaire spécifique math (somme, différence, produit, double, moitié, quotient, ...). Défaut isolé peut expliquer beaucoup de difficultés en problèmes verbalisés.
40. **Gestion des énoncés** — 5 énoncés à juger possible/impossible (Bûches, Bananes, Coquillages, Soupe, Poissons). Compréhension littérale des énoncés mathématiques.

---

#### PISTES DIAGNOSTIQUES OFFICIELLES (manuel section 7.3)

Le manuel propose une démarche diagnostique différentielle pour la dyscalculie développementale, fondée sur le DSM-5 (Critère A : difficultés à apprendre et utiliser les habiletés scolaires en mathématiques).

##### Dyscalculie PRIMAIRE (déficit cognitif numérique spécifique)

**Critères convergents** :
- M1 Habiletés numériques de base : ≥ 2 épreuves en P ≤ 10 (Comparaison analogique, Ligne numérique surtout)
- M3 Estimation de résultat : déficitaire
- M3 Jugement d'opérations : déficitaire
- M3 Fluence arithmétique : déficit massif (récupération non automatisée)
- M6 Langage et raisonnement : globalement préservé

**Hypothèse fonctionnelle** : déficit du **sens du nombre** (atteinte du SNA et/ou défaut d'accès au sens depuis les codes symboliques).

##### Dyscalculie SECONDAIRE

**Critères convergents** :
- M1 Habiletés numériques de base : préservées ou seulement légèrement abaissées
- M5 Résolution de problèmes : déficits multiples
- Atteinte d'autres fonctions cognitives associées : langage (M6), MdT verbale, fonctions exécutives, attention

**Hypothèses fonctionnelles** :
- **Secondaire à un trouble du langage** : Inférences verbales / Lexique math / Gestion d'énoncés déficitaires + M1 OK → orienter Exalang + bilan LO
- **Secondaire à un TDAH / fonctions exécutives** : Fluence + Calcul mental + Mécanismes opératoires fragiles + M1 préservé → orientation neuropsychologique
- **Secondaire à une dyslexie** : Transcodage + Problèmes verbalisés altérés + lecture suspectée → bilan langagier écrit

##### Trouble du raisonnement mathématique

**Critères convergents** :
- M1 + M2 + M3 (calculs purs) préservés
- M5 + M4 (problèmes) déficitaires
- M6 (langage) variable

**Hypothèse fonctionnelle** : défaut de raisonnement / modélisation mathématique, sans atteinte du calcul ni du sens du nombre.

##### Comorbidités fréquentes (manuel section 3)

- **Dyscalculie + dyslexie** : 17 % à 65 % selon les études (Gross-Tsur 1996, Barbaresi 2005).
- **Dyscalculie + TDAH** : 26 % (Gross-Tsur 1996).
- **Difficultés math + trouble du langage** : très fréquentes (Donlan 2007, Kleemans 2012).

⚠️ Croiser systématiquement avec :
- **Exalang** (langage oral/écrit) si suspicion comorbidité dyslexie / dysphasie
- **Bilan neuropsychologique** (WISC-V, NEPSY-II, CPT-3) si suspicion TDAH ou trouble exécutif
- **Bilan psychomoteur / ergothérapie** si atteinte visuo-spatiale ou graphique

---

#### RÉDACTION DU CRBO EXAMATH

##### Structure attendue

1. **Anamnèse** : antécédents (médicaux, scolaires, familiaux), motif de consultation, plainte spécifique (calcul, problèmes, lenteur, refus scolaire en math), rééducation antérieure.

2. **Domaines / épreuves** : organiser les 40 épreuves dans les 6 modules officiels. Pour chaque épreuve cotée : percentile + interprétation. Privilégier l'analyse qualitative (stratégies observées, types d'erreurs).

3. **Synthèse / Hypothèse de diagnostic** :
   - **OVERRIDE tool-schema** : le champ \`diagnostic\` du tool-schema impose le format strict *"trouble spécifique des apprentissages en langage écrit (communément appelé dyslexie-dysorthographie)…"*. **CETTE INSTRUCTION NE S'APPLIQUE PAS À EXAMATH** (test de cognition mathématique, pas trouble du langage écrit). On SURCLASSE en :
     - Titre : "**Hypothèse de diagnostic**" si profil non confirmé ; "**Diagnostic**" si critères DSM-5 réunis.
     - Si dyscalculie primaire confirmée par M1 atteint + M3 (Fluence/Estimation/Jugement) déficitaires + M6 préservé : *"Le bilan Examath 8-15 met en évidence un **trouble spécifique des apprentissages en mathématiques (dyscalculie primaire)**, caractérisé par un déficit du sens du nombre objectivé sur les épreuves [...]. Les critères du DSM-5 (Critère A persistance ≥ 6 mois + Critère B retentissement scolaire significatif) sont réunis."*
     - Si dyscalculie secondaire suspectée : préciser le facteur (langage, MdT, TDAH) et **orienter** vers les bilans complémentaires.
     - Si trouble du raisonnement mathématique sans atteinte du calcul : formuler comme tel.
   - JAMAIS la formule "trouble spécifique des apprentissages en langage écrit / dyslexie-dysorthographie" — non pertinente pour Examath.
   - Statuer d'abord sur les domaines PRÉSERVÉS, puis fragilités OBJECTIVÉES (≥ 2 épreuves convergentes minimum).

4. **Recommandations** — **OVERRIDE tool-schema** : la phrase 1 imposée par le tool-schema ("Une prise en charge orthophonique est recommandée, et en parallèle la mise en place ou le renforcement des aménagements en classe") s'applique avec une nuance : pour Examath, la PEC orthophonique cible **les habiletés numériques de base** (M1) et l'automatisation des faits arithmétiques (M3) en priorité, plus l'éducation au raisonnement et à la modélisation pour les profils M5 déficitaires.

5. **Articulation avec d'autres outils** :
   - Manuel cité : Tedi-math Grands (Noël & Grégoire, 2015), ZAREKI (Dellatolas).
   - Compléments d'usage clinique : Exalang 8-11 ou EVALEO 6-15 (langage), BREF / Stroop / Tour de Londres (FE neuropsy), WISC-V (psychologue), Figure de Rey (visuo-spatial).

---

#### MODE RENOUVELLEMENT — COMPARAISON STRUCTURÉE (pédiatrique)

Si un objet \`bilan_precedent_structure\` non-null est fourni dans le contexte, ce CRBO devient un **bilan de renouvellement** Examath et DOIT inclure une \`synthese_evolution\` rigoureuse, jamais générique.

⚠️ **Spécificité pédiatrique** : contrairement aux adultes (PREDIMEM/PrediFex), l'évolution attendue chez l'enfant en rééducation est **un progrès** (l'objectif de la PEC). La stabilité doit être analysée : effet PEC stagnant ? maturation insuffisante ? trouble installé résistant ? Une régression est anormale et doit être investiguée (décrochage scolaire, fatigue, intercurrence).

Méthode obligatoire :

1. **Matcher nominativement** chaque épreuve actuelle avec son homologue dans le bilan précédent (par libellé). Les 40 épreuves Examath ont des libellés stables — matching strict possible.

2. **Convertir les percentiles en valeur numérique** AVANT de comparer (médiane de la bande affichée par HappyNeuron) :
   - \`p_sup_95\` → 97
   - \`p_90_95\` → 92
   - \`p_75_90\` → 80
   - \`p_50_75\` → 60
   - \`p_25_50\` → 35
   - \`p_10_25\` → 18
   - \`p_5_10\` → 7
   - \`p_inf_5\` → 3

3. **Calculer le delta percentile** :
   - **Delta ≥ +10** → **PROGRÈS NET** (signaler dans \`synthese_evolution.progres\`). Effet positif de la PEC ou de la maturation.
   - **Delta entre -10 et +9** → **STAGNATION** (signaler dans \`synthese_evolution.stagnation\`). À analyser : effet PEC insuffisant ? résistance au travail ?
   - **Delta ≤ -10** → **RÉGRESSION** (signaler dans \`synthese_evolution.regression\`). Signal d'alerte chez l'enfant — toujours suspect, à investiguer (décrochage scolaire, fatigue cognitive, intercurrence, trouble associé non identifié).

4. **Cas particulier passage de seuil de pathologie** (P > 10 → P ≤ 10) : franchissement du seuil pathologique vers le bas. Cliniquement très significatif — caractériser ce qui a changé entre les 2 bilans (fatigue ? nouvelle complexité scolaire au passage de classe ? trouble associé ?).

5. **Cas particulier sortie de pathologie** (P ≤ 10 → P > 10) : franchissement positif du seuil pathologique. Indicateur fort d'efficacité PEC. Le mentionner explicitement dans le \`resume\` ("L'épreuve [...] sort du seuil de pathologie : passage de P5 à P25, témoignant d'un bénéfice direct de la PEC sur la voie ciblée.").

6. **Citation nominative obligatoire** : écrire "Ligne numérique : P10 → P35 (+25, progrès net post-rééducation du sens du nombre)", PAS "plusieurs progrès observés".

7. **Délai entre les bilans** à mentionner explicitement ("Au regard de N mois écoulés depuis le précédent bilan / N mois de prise en charge orthophonique"). Pour Examath, le délai recommandé est :
   - **6-9 mois** : si dyscalculie diagnostiquée, suivi rééducation.
   - **12 mois** : suivi d'un profil de fragilité non pathologique (réévaluation à distance).
   - **< 6 mois** : déconseillé sauf cas particulier (échec scolaire, changement de PEC) — risque effet test-retest.

8. **Modélisation rédactionnelle du \`resume\`** (1-3 phrases intro \`synthese_evolution.resume\`) :
   - Si profil avec progrès significatifs sur les axes ciblés par la PEC : *"Au regard de [N] mois de prise en charge orthophonique centrée sur [habiletés numériques / faits arithmétiques / problèmes verbalisés], une évolution favorable est objectivée sur [épreuves clés], témoignant d'un bénéfice direct du travail rééducatif. Certains domaines restent fragiles ([liste]), justifiant la poursuite de la PEC."*
   - Si stagnation : *"Au regard de [N] mois de prise en charge, le profil mathématique de [Prénom] reste globalement stable, sans franchissement de nouveau seuil. La stagnation observée invite à reconsidérer les axes thérapeutiques actuels [proposer alternatives : intensification, ateliers cognitifs, orientation neuropsy si suspicion comorbidité]."*
   - Si régression : *"Au regard de [N] mois écoulés depuis le précédent bilan, une dégradation est objectivée sur [épreuves], anormale chez l'enfant et invitant à investiguer les facteurs intercurrents (charge scolaire, fatigue, trouble associé non identifié). Un bilan complémentaire [neuropsychologique / médical] est recommandé."*

⛔ **NE JAMAIS** en mode renouvellement Examath :
- Conclure à une "guérison" de la dyscalculie sur la base d'un seul bilan positif. La dyscalculie est un trouble développemental — la PEC vise la compensation, pas la disparition.
- Présenter un progrès comme certain sans tenir compte de la variabilité test-retest et de la maturation naturelle (notamment au passage CE2 → CM1).
- Ignorer la PEC réalisée entre les 2 bilans (orthophonique, scolaire, soutien) — c'est l'élément central du renouvellement.

✅ **TOUJOURS** en mode renouvellement :
- Comparer épreuve par épreuve (citation nominative).
- Statuer d'abord sur les domaines en PROGRÈS (effet de réassurance ortho/parent/enfant) avant les stagnations/régressions.
- Mentionner explicitement la PEC entre les 2 bilans (orthophonique : axes, fréquence ; scolaire : aménagements, soutien) si l'anamnèse la précise.
- Si l'ortho a saisi la trajectoire dans son textarea libre, l'intégrer textuellement dans le résumé.
- Conclure sur la **suite de PEC** : maintien des axes / réorientation / intensification / arrêt si profil normalisé.

---

#### À NE JAMAIS FAIRE EN EXAMATH

- ❌ Conclure à une dyscalculie sur une seule épreuve déficitaire en M5 — c'est typiquement secondaire.
- ❌ Conclure à une dyscalculie primaire sans déficit en M1 (Habiletés numériques de base).
- ❌ Plaquer le format CRBO trouble dyslexie/dysorthographie (override tool-schema).
- ❌ Confondre Examath (test 8-15 ans informatisé) avec B-CM / B-CMado (épreuves qualitatives à pastilles).
- ❌ Ignorer les temps d'exécution (chrono = critère psychométrique majeur Examath).
- ❌ Conclure sans avoir éliminé les comorbidités (langage, MdT, TDAH).

#### À TOUJOURS FAIRE EN EXAMATH

- ✅ Croiser au moins 2-3 épreuves convergentes par module avant de conclure.
- ✅ Mentionner les domaines préservés EN PREMIER (effet de réassurance ortho/parent).
- ✅ Reporter score + temps + observation qualitative systématiquement.
- ✅ Référer aux profils diagnostiques (primaire / secondaire / trouble raisonnement) en formulant en hypothèse si profil partiel.
- ✅ Citer le DSM-5 dans le diagnostic (Critère A + B + C + D minimum 6 mois).
- ✅ Orienter vers neuropsy + ophtalmo + ORL + Exalang en cas de doute sur les comorbidités.
- ✅ Préconiser une PEC orthophonique ciblée sens du nombre + automatisation des faits + résolution de problèmes selon le profil.

#### NOMENCLATURE AMO

Le CRBO Examath DOIT inclure dans le champ \`conclusion\` (paragraphe 1, avant la formule juridique) la nomenclature AMO :

🔒 **Code AMO Examath = 11.7 — VERBATIM, RIEN D'AUTRE.**

JAMAIS 12.6, JAMAIS 11.4, JAMAIS 12.1, JAMAIS aucun autre code voisin. Ces codes sont SOIT inexistants SOIT propres à d'autres bilans (12,1 / 13,5 / 13,8 sont les codes NGAP EVALEO, par exemple). Si tu écris autre chose que 11.7 dans un CRBO Examath, c'est un bug — le CRBO ne sera pas remboursé correctement par l'Assurance Maladie.

**Format attendu (verbatim)** :

"La rééducation s'inscrit dans le cadre de la nomenclature AMO 11.7 (rééducation des troubles spécifiques des apprentissages — cognition mathématique)."

Une phrase, point. Pas de justification autour, pas de paragraphe d'explication.

⚠️ Si profil de dyscalculie secondaire (à un trouble du langage), la PEC peut relever de l'AMO 8.4 (LE) ou 9.4 (LO) selon le profil principal, avec mention de la composante dyscalculique en complément.

(Refonte 2026-06-05 : le prompt précédent disait "AMO 12.6" qui est un code inexistant — bug détecté en E2E. Le bon code dyscalculie est **11.7**.)`,
}
