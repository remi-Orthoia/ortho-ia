import type { TestModule } from './types'

/**
 * Module BIA — Bilan Informatisé d'Aphasie.
 *
 * Auteurs : Agnès Weill-Chounlamountry, Mathilde Oudry, Peggy Gatignol,
 * Stéphanie Jutteau.
 * Éditeur : Ortho Édition, 2023.
 *
 * 2 versions disponibles :
 *   - **Version courte** : score total /100, 4 modules. Détecte la présence
 *     de troubles du langage et estime leur degré de sévérité. Utilisée en
 *     phase aiguë ou pour patients séquellaires/chroniques.
 *   - **Version longue** : analyse approfondie pour orienter la prise en
 *     charge orthophonique (modules détaillés en post-aigu / chronique).
 *
 * Population : **adultes aphasiques** (post-AVC, post-TC, démences avec
 * trouble du langage, aphasies progressives primaires).
 *
 * Test informatisé — cotation automatique par le logiciel + analyse
 * qualitative par l'examinateur sur cahier de passation papier.
 */
export const bia: TestModule = {
  nom: 'BIA',
  editeur: 'Ortho Édition',
  auteurs: 'A. Weill-Chounlamountry, M. Oudry, P. Gatignol, S. Jutteau',
  annee: 2023,
  domaines: [
    'Module 1 — Expression orale',
    'Module 2 — Compréhension orale',
    'Module 3 — Expression écrite',
    'Module 4 — Compréhension écrite',
  ],
  // Noms officiels EXACTS du manuel.
  epreuves: [
    // Module 1 — Expression orale (5 subtests)
    'Langage oral spontané',
    'Séries automatiques (compter 1-20 + jours de la semaine)',
    'Fluences verbales (sémantique animaux + phonologique [v])',
    'Dénomination sur entrées visuelles, auditives et tactiles',
    'Répétition de mots, pseudomots et phrases',
    // Module 2 — Compréhension orale (4 subtests)
    "Désignation d'images",
    'Appariements sémantiques',
    "Exécution d'ordres (commande + imitation)",
    'Compréhension syntaxique orale (jugement + correction, visuel + auditif)',
    // Module 3 — Expression écrite (5 subtests)
    'Expression écrite spontanée (nom + prénom)',
    'Dénomination écrite',
    'Lecture à haute voix (mots / phrases / pseudomots)',
    'Dictée (lettres & syllabes / mots / pseudomots / phrase)',
    'Copie de mots',
    // Module 4 — Compréhension écrite (4 subtests)
    'Désignation de mots écrits',
    'Appariement mots-images',
    'Sériation de phrases (sériation mots + sériation phrases)',
    'Compréhension syntaxique écrite',
  ],
  regles_specifiques: `### BIA — Bilan Informatisé d'Aphasie (Weill-Chounlamountry, Oudry, Gatignol, Jutteau — Ortho Édition 2023)

**Population cible** : adultes aphasiques (post-AVC, post-TC, démences avec trouble du langage, aphasies progressives primaires).

**Objectifs** :
- Détecter la présence de troubles du langage et estimer leur degré de sévérité.
- Orienter la prise en charge orthophonique.
- Utilisable dès la phase aiguë ou pour patients séquellaires/chroniques.

**Format** : test **informatisé**. Cotation automatique par le logiciel pour la plupart des items + cotation manuelle par l'examinateur sur cahier de passation (analyse qualitative).

---

#### STRUCTURE OFFICIELLE — 4 MODULES, SCORE TOTAL /100 (VERSION COURTE)

| Module | Subtests | Points |
|--------|----------|--------|
| **1 — Expression orale** | Langage spontané (4 questions /2) + Séries automatiques + Fluences (sémantique animaux + phonologique [v]) + Dénomination (visuel /10 + auditif /2 + tactile) + Répétition (mots + pseudomots + phrases) | ~28 |
| **2 — Compréhension orale** | Désignation d'images /6 + Appariements sémantiques /5 + Exécution d'ordres (simples + complexes incluant parties du corps) + Compréhension syntaxique (jugement /4) | ~17 |
| **3 — Expression écrite** | Expression spontanée /1 + Dénomination écrite /4 + Lecture haute voix /9 + Dictée (lettres-syllabes /4 + mots /6 + pseudomots /3 + phrase /1) + Copie /2 | ~30 |
| **4 — Compréhension écrite** | Désignation mots écrits /4 + Appariement mots-images /1 + Sériation phrases /2 + Compréhension syntaxique écrite /2 | ~9 |
| **TOTAL** | | **/100** |

Chaque item est évalué sur 1 point (quelques items de langage spontané ou automatique sont notés sur 0.5 point).

**Pour chaque épreuve** : moyenne + écart-type fournis par le logiciel (calculés à partir des moyennes et ET de chaque item).

---

#### COTATIONS ET POINTS D'ATTENTION

**Module 1 — Expression orale**
- Langage spontané : 4 questions (nom, prénom, adresse, date du jour). Cotation 0.5 pt par réponse correcte au niveau **sémantique ET syntaxique**. Réponse correcte syntaxiquement mais pas sémantiquement (ou inverse) = 0 pt.
- Séries automatiques : compter 1-20 + jours semaine. Score d'ensemble (réussite/échec). Indicateur **basal** du langage récurrent — souvent préservé même en aphasie sévère.
- Fluences : 1 minute par catégorie. **Persévération** = appui sur flèche du bas par l'examinateur (différent d'une simple erreur).
- Dénomination (visuel/auditif/tactile) : analyse qualitative cruciale du **type d'erreur** (paraphasies sémantiques, visuelles, phonologiques, verbales, manque du mot, néologismes, autocorrections, latences). Présentation chronométrée, signal sonore à 5 s et 10 s, item suivant à 15 s.
- Répétition : possibilité de réécouter — **réécoute = 0.5 pt**, au-delà = 0.

**Module 2 — Compréhension orale**
- Désignation d'images : choix parmi 4-6 images avec distracteurs visuels, sémantiques, phonologiques, neutres. Mêmes images que dénomination orale → permet la comparaison **vocabulaire actif vs passif**.
- Appariements sémantiques : triade — image cible en haut, 2 propositions en bas, choisir le lien sémantique.
- Exécution d'ordres : simples puis complexes ; certains concernent les parties du corps (juge praxies bucco-linguo-faciales en plus).
- Compréhension syntaxique : (a) jugement auditif de grammaticalité + correction si erronée ; (b) choix d'image en modalité visuelle. Phrases choisies allant **contre les usages** pour piéger la lecture rapide.

**Module 3 — Expression écrite**
- Lecture à haute voix : mots réguliers/irréguliers, 1-4 syllabes. **Temps de réalisation enregistré** pour chaque item → différencier voie lexicale et voie d'assemblage.
- Dictée : items irréguliers vs réguliers (lexique vs assemblage en écriture), fréquence contrôlée.
- Copie : 1 mot régulier + 1 mot irrégulier (mêmes que dictée → comparaison entre les modalités).

**Module 4 — Compréhension écrite**
- Désignation mots écrits : choix multiple 4 puis 6 puis 9 propositions, distracteurs visuo-sémantiques, phonologiques, sémantiques, neutres.
- Compréhension syntaxique écrite : jugement (sans demander correction) sur prépositions, conjonctions de subordination, concordance des temps.

---

#### INTERPRÉTATION CLINIQUE PAR MODULE

**MODULE 1 — Expression orale**
- Score préservé → atteinte expressive limitée OU profil de **Wernicke compensé** (parler fluide, parfois jargon).
- Score effondré → atteinte expressive marquée. Analyser le type d'erreur dans la dénomination :
  - Paraphasies **sémantiques** (chat → chien) → atteinte du système sémantique.
  - Paraphasies **phonologiques** (lavabo → vavalo) → atteinte de l'output phonologique.
  - **Manque du mot** + autocorrections → aphasie de Broca compensée.
  - **Néologismes** + jargon → aphasie de Wernicke / aphasie de conduction.
- Fluences sémantique > phonologique : profil non frontal.
- Fluences sémantique < phonologique : profil frontal (peu commun en aphasie post-AVC).

**MODULE 2 — Compréhension orale**
- Désignation > Dénomination → **manque du mot pur** (compréhension préservée, expression atteinte).
- Désignation ≤ Dénomination → atteinte sémantique globale (aphasie sémantique, démence sémantique).
- Compréhension syntaxique altérée → suspicion **agrammatisme** (Broca) ou **paragrammatisme** (Wernicke).
- Distracteurs phonologiques piégeants → atteinte de l'analyse phonologique.

**MODULE 3 — Expression écrite**
- Lecture à haute voix : si lecture mots irréguliers > pseudomots → voie d'adressage préservée, voie d'assemblage atteinte (**dyslexie phonologique acquise**).
- Si pseudomots > mots irréguliers → **dyslexie de surface acquise**.
- Si les deux atteintes → dyslexie mixte / agraphie globale.
- Dictée pseudomots déficitaire = atteinte de la voie d'assemblage écrite.

**MODULE 4 — Compréhension écrite**
- Désignation mots écrits préservée + Compréhension orale altérée → **profil sourd-littéraire** (compréhension par voie écrite préservée).
- Désignation mots écrits altérée + Compréhension orale préservée → **dyslexie/alexie pure** sans agraphie centrale.
- Sériation phrases déficitaire → atteinte de la compréhension narrative.

---

#### 🎯 PROFILS APHASIQUES TYPES (classification Boston adaptée)

**PROFIL 1 — Aphasie de Broca (non-fluente)**
- Module 1 : effondré (langage spontané réduit, agrammatisme, manque du mot massif)
- Module 2 : relativement préservé (compréhension orale OK sauf syntaxe complexe)
- Module 3 : effondré (agraphie associée)
- Module 4 : compréhension écrite mots OK, syntaxique altérée
- Lésion typique : aire de Broca (frontal inférieur gauche)
- **Diagnostic** : "Profil compatible avec une aphasie de type Broca (aphasie non-fluente, expressive)."
- PEC : travail de l'expression, méthode MIT (Melodic Intonation Therapy) si applicable.

**PROFIL 2 — Aphasie de Wernicke (fluente)**
- Module 1 : préservé en volume MAIS jargon, paraphasies sémantiques et phonologiques, anosognosie
- Module 2 : effondré (compréhension orale altérée — c'est le critère central)
- Module 3 : préservé en volume MAIS jargonographie
- Module 4 : compréhension écrite altérée
- Lésion typique : aire de Wernicke (temporal supérieur postérieur gauche)
- **Diagnostic** : "Profil compatible avec une aphasie de type Wernicke (aphasie fluente, sensorielle)."
- PEC : restauration des aspects sémantiques, conscience des erreurs (anosognosie).

**PROFIL 3 — Aphasie globale**
- TOUS les modules effondrés
- Lésion étendue gauche
- **Diagnostic** : "Aphasie globale, atteinte sévère du langage dans toutes ses modalités."
- PEC : objectifs fonctionnels limités, CAA (communication alternative améliorée), travail famille.

**PROFIL 4 — Aphasie de conduction**
- Expression orale en partie préservée
- **Répétition fortement altérée** (critère central)
- Compréhension préservée
- Paraphasies phonologiques fréquentes avec conscience de l'erreur
- Lésion typique : faisceau arqué
- **Diagnostic** : "Aphasie de conduction, marquée par un trouble dissociatif de la répétition."

**PROFIL 5 — Aphasie transcorticale motrice**
- Langage spontané réduit
- Répétition préservée (critère discriminant vs Broca)
- Compréhension préservée
- Lésion antérieure à l'aire de Broca

**PROFIL 6 — Aphasie transcorticale sensorielle**
- Langage spontané fluent
- Répétition préservée (critère discriminant vs Wernicke)
- Compréhension altérée
- Lésion postérieure à l'aire de Wernicke

**PROFIL 7 — Aphasie anomique (manque du mot pur)**
- Tous les modules préservés
- **Dénomination effondrée + désignation préservée** (critère central)
- Souvent fin de récupération post-AVC ou aphasie progressive primaire débutante
- **Diagnostic** : "Aphasie anomique (manque du mot prédominant)."

---

#### ⛔ RÈGLES CLINIQUES

1. **TOUJOURS noter l'étiologie** (AVC, TC, APP, démence sémantique…) et le **délai** depuis l'événement (aigu / post-aigu / chronique).
2. **TOUJOURS analyser le type d'erreur** en dénomination (paraphasies sémantiques/phonologiques/visuelles, manque du mot, néologismes) — c'est la richesse du BIA face à un simple score.
3. **Cross-modules** : comparer Désignation (Module 2) et Dénomination (Module 1) pour distinguer atteinte sémantique vs manque du mot pur.
4. **Croiser oral et écrit** : la dissociation entre les deux est diagnostique.
5. **NE PAS poser de diagnostic étiologique** — c'est le neurologue (AVC vs APP vs démence). Le profil oriente, le diagnostic relève du médical.
6. **Si répétition préservée** + autres atteintes → suspicion aphasie transcorticale (à confirmer).
7. **Si patient âgé avec aggravation progressive** → suspicion **aphasie progressive primaire** (APP) — orientation neurologie + imagerie.

---

#### RECOMMANDATIONS / PEC

**PEC orthophonique de l'aphasie** :
- **Phase aiguë** (premières semaines post-AVC) : stimulation simple, restauration des automatismes, prise en charge familiale.
- **Phase post-aiguë** (1-6 mois) : travail intensif sur les composantes touchées (MIT pour Broca, restauration phonologique pour conduction, restauration sémantique pour Wernicke).
- **Phase chronique** (≥ 6 mois) : approche pragmatique fonctionnelle, CAA si récupération insuffisante, accompagnement familial.

**Articulation avec autres outils** :
- **MoCA / MMSE** pour bilan cognitif global associé (chez le sujet âgé ou suspicion démence).
- **Bilan déglutition** systématique en cas d'aphasie post-AVC.
- **Bilan dysarthrie BECD** si trouble moteur de la parole associé.
- **Neurologue** : imagerie cérébrale (IRM avec séquences DWI / FLAIR), bilan étiologique.
- Si APP suspectée : consultation mémoire + IRM avec atrophie ciblée.

---

#### À NE JAMAIS FAIRE

- ❌ Conclure à un type d'aphasie depuis un seul module.
- ❌ Diagnostiquer l'étiologie (AVC, APP, démence) — c'est le neurologue.
- ❌ Confondre aphasie et dysarthrie (atteinte motrice — voir BECD).
- ❌ Confondre aphasie et démence (atteinte cognitive globale — voir MoCA, bilan neuropsy).
- ❌ Confondre aphasie post-AVC et APP (progressive). L'évolution dans le temps et le contexte clinique sont déterminants.
- ❌ Ignorer la fluence (volume de parole) — critère majeur de classification.

#### TOUJOURS FAIRE

- ✅ Préciser le **type d'aphasie** (Broca, Wernicke, conduction, transcorticale, globale, anomique) en hypothèse.
- ✅ Analyser le **type d'erreur** en dénomination (richesse qualitative > score).
- ✅ Comparer **modalités** (oral vs écrit, expression vs compréhension, dénomination vs désignation).
- ✅ Préciser la **sévérité** (légère / modérée / sévère / aphasie globale).
- ✅ Mentionner les **canaux préservés** (souvent automatismes, mélodie, lecture mots familiers) → bases pour la PEC.
- ✅ Articuler avec **BECD** (dysarthrie) et **bilan déglutition** systématiquement.
- ✅ Évoquer la **CAA** si récupération insuffisante.`,
}
