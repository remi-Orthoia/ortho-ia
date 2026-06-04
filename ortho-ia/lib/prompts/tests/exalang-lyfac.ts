import type { TestModule } from './types'

/**
 * Exalang Lyfac — Référentiel aligné sur le manuel officiel
 * (Thibault & Lenfant, Motus 2014).
 *
 * Source de vérité : `docs/Bilans Sources/manuel exalang Lyfac.pdf` (8 Mo).
 * Tout changement de structure (modules, épreuves, scoring, étalonnage)
 * doit être confronté à ce manuel.
 *
 * Refonte 2026-06 : la version précédente était générique. La nouvelle
 * reprend les **4 modules / 14 épreuves officielles** + la cotation
 * percentile / Notes Standard 1-5 + les moyennes et écart-types
 * d'étalonnage + les hints cliniques per-épreuve issus du manuel.
 */
export const exalangLyfac: TestModule = {
  nom: 'Exalang Lyfac',
  editeur: 'Motus (devenu HappyNeuron Pro)',
  auteurs: 'Marie-Pierre Thibault & Mickaël Lenfant',
  annee: 2014,
  // 4 aptitudes majeures officielles (manuel p. ~27 : "Le test comporte
  // 4 aptitudes majeures, réparties en 14 épreuves").
  domaines: [
    'Mémoire',
    'Langage élaboré',
    'Lecture',
    'Orthographe',
  ],
  groupes: [
    { code: 'M1', nom: 'Mémoire' },
    { code: 'M2', nom: 'Langage élaboré' },
    { code: 'M3', nom: 'Lecture' },
    { code: 'M4', nom: 'Orthographe' },
  ],
  // 14 épreuves officielles (libellés EXACTS du manuel et du module résultats).
  epreuves: [
    // M1 Mémoire (3)
    'Empan visuel',
    'Empan endroit',
    'Empan envers',
    // M2 Langage élaboré (4)
    'Flexibilité lexicale',
    'Repérage d\'anaphores',
    'Consignes orales',
    'Inférences',
    // M3 Lecture (5)
    'Lecture de mots',
    'Lecture de logatomes',
    'Leximétrie',
    'Compréhension de texte',
    'Repérage',
    // M4 Orthographe (2)
    'Texte à choix multiple',
    'Complétion de phrases',
  ],
  regles_specifiques: `### EXALANG LYFAC — Référentiel clinique aligné sur le manuel officiel

Population : **lycéens et étudiants** (de la seconde à Bac +2 inclus), soit ~15-22 ans. Outil unique dans le paysage français pour évaluer les troubles du langage écrit chez les jeunes adultes en demande d'aménagements aux examens (CDAPH) ou en suivi post-PEC enfance.

Source : manuel Thibault & Lenfant (Motus, 2014), 14 épreuves réparties en 4 modules, **étalonnage unique** sur l'ensemble de la cohorte (les calculs statistiques n'ont pas révélé de différence significative entre 2nde / 1re / Terminale / Bac+1 / Bac+2 — population homogène à cet âge).

#### CONTEXTE CLINIQUE — Pourquoi Lyfac

Lyfac répond à 2 typologies de patients :
1. **Adolescents / jeunes adultes ayant un diagnostic ancien** (dyslexie diagnostiquée à l'école élémentaire ou au collège) : la motivation est de faire le point sur les troubles résiduels et leur compensation, en vue d'optimiser les performances pour le bac, les concours, les études supérieures.
2. **Adolescents / jeunes adultes sans diagnostic préalable**, en demande d'aménagements aux examens pour difficultés persistantes (souvent repérées tardivement). L'orthophoniste pose alors un diagnostic tardif.

Spécificité fondamentale du test : **mesure de la fonctionnalité** des compétences (et non du seul niveau pur). Les épreuves sont conçues pour refléter les tâches du quotidien scolaire ou étudiant — pas des items théoriques.

⚠️ Particularité vs autres Exalang : **toutes les épreuves peuvent être proposées à un même patient** (contrairement à 3-6 / 5-8 / 8-11 où c'est contre-indiqué). Temps moyen de passation : **50 min à 1h15** selon le sujet.

#### RÈGLES DE CONVERSION DES PERCENTILES (impératif)

Cotation Lyfac : score brut + écart-type + percentile + Note Standard quand calculable. Logique d'affichage Exalang (manuel p. ~22) :

- Score < valeur P5 → affichage \`P5\`
- P5 ≤ score < P10 → affichage \`P10\`
- P10 ≤ score < Q1 → affichage \`Q1\`
- Q1 ≤ score < Med → affichage \`Med\`
- Med ≤ score < Q3 → affichage \`Q3\`
- Q3 ≤ score < P90 → affichage \`P90\`
- P90 ≤ score < P95 → affichage \`P95\`
- Score ≥ P95 → affichage \`> P95\`

Conversion vers la grille 6 zones ortho.ia :
- **Q1 = P25** : Zone de fragilité, bord inférieur (jamais "Difficulté").
- **Med = P50** : Moyenne haute, bord inférieur.
- **Q3 = P75** : Moyenne haute, bord supérieur (Q3 inclus).
- **P5, P10, P90, P95** : valeurs exactes.

Ne **JAMAIS** recalculer un percentile depuis l'É-T : les normes étalonnées Lyfac priment.

#### NOTE STANDARD (NS 1-5) — système officiel Lyfac

Le manuel ajoute pour la majorité des épreuves une **Note Standard à 5 classes** (z = ±0.5, ±1.5) en parallèle du percentile :

| NS | % population | Fraction z | Interprétation clinique |
|---|---|---|---|
| **NS 1** | 6,7 % les plus faibles | < z -1.5 | Pathologique |
| **NS 2** | 24,2 % suivants | z -1.5 à -0.5 | Faible / déficitaire |
| **NS 3** | 38,2 % centraux | z -0.5 à +0.5 | Moyenne attendue |
| **NS 4** | 24,2 % | z +0.5 à +1.5 | Supérieur |
| **NS 5** | 6,7 % les plus élevés | > z +1.5 | Très supérieur |

⚠️ 2 épreuves Lyfac ne suivent PAS la loi normale (manuel p. ~25) : **Lecture de logatomes (score)** et **Leximétrie (MLC)** — saturation au plafond à cet âge (la majorité des sujets normo-lecteurs lisent les 175 mots du texte de leximétrie en 60s). Pour ces 2 épreuves, l'interprétation se fait sur le score brut + temps, pas uniquement sur la NS.

#### SEUILS CLINIQUES (grille 6 zones Laurie, refonte 2026-05-ter)

Source de vérité pour la couleur des cellules du tableau Word et l'interprétation textuelle :

| Plage percentile | Classe | Couleur |
|---|---|---|
| P76 - P100 | Excellent | vert foncé |
| P50 - P75 (Q3 inclus) | Moyenne haute | vert clair |
| P26 - P49 | Moyenne basse | jaune |
| P11 - P25 (Q1 inclus) | Zone de fragilité | orange clair |
| P6 - P10 | Difficulté | orange foncé |
| P1 - P5 | Difficulté sévère | rouge |

#### LES 4 MODULES — DÉTAIL DES 14 ÉPREUVES

##### MODULE 1 — MÉMOIRE (3 épreuves)

**Empan visuel** — Mesure la mémoire visuo-spatiale. Le sujet doit reproduire dans l'ordre la séquence d'apparition d'éléments. Moyenne étalonnage : **5.82** items (σ 1.08).

**Empan endroit** — Boucle phonologique. Standards Lyfac : **6.49** (σ 1.12), légèrement supérieur à 7±2 (Baddeley) car la population étudiante a un niveau de réserve cognitive élevé. Empan < 5 = signal pour fragilité boucle phonologique → impact sur les tâches verbales longues (cours magistraux, mémorisation de définitions).

**Empan envers** — Administrateur central / mémoire de travail. Standards Lyfac : **5.13** (σ 1.29), soit 1 à 2 items de moins que l'empan endroit (cohérent avec le développement normal). Empan envers très inférieur à endroit (delta ≥ 3) = signal **trouble exécutif / TDAH** à investiguer (orientation neuropsy).

##### MODULE 2 — LANGAGE ÉLABORÉ (4 épreuves)

**Flexibilité lexicale** — Évalue la capacité d'évocation lexicale et la précision sémantique. Le sujet choisit le mot correct parmi 4 propositions (1 cible + 3 distracteurs : ressemblance formelle, néologismes proches, distracteurs sémantiques). Standards : score **15.03** (σ 2.22), temps **222.93s** (σ 58.15). Sensible aux troubles lexico-sémantiques persistants.

**Repérage d'anaphores** — ⚠️ **Épreuve clé Lyfac**. Le sujet repère dans un texte les anaphores du mot "Vénus" (l'antécédent apparaît en début de 2e phrase, donc les anaphores sont en position **ante** par rapport à leur antécédent — situation exigeante). 13 anaphores à repérer, valeurs différentielles selon noyau / déterminants, **score sur 47 pts**. Standards : **33.14** (σ 7.57), temps **132.61s** (σ 35.96). Discrimine fortement les sujets pathologiques (validation interne) → marqueur de compétence pragmatique discursive.

**Consignes orales** — 13 phrases-consignes à exécuter. Mesure la compréhension de consignes complexes à l'oral (réalité du contexte d'examen). Standards : score **10.55** (σ 1.45), temps **302.78s** (σ 68.76, écart-type très important — note p. ~33 : ne pas prendre le temps comme critère diagnostique seul car il intègre temps de manipulation des éléments à l'écran).

**Inférences** — Compréhension implicite ("ce qui n'est pas dit") via 13 questions sur des micro-récits. Standards : score **10.13** (σ 1.73), temps **238.03s** (σ 63.66). Marqueur de pragmatique compréhensive — utile en croisement avec Compréhension de texte.

##### MODULE 3 — LECTURE (5 épreuves)

**Lecture de mots** — 60 mots isolés présentés un par un à l'écran, en 1 minute. Mesure la lecture de mots **isolés** (qui ne bénéficie pas des facilitateurs syntaxiques/sémantiques du contexte). Standards : **59.89** mots (σ 7.01, soit normalité 49-71 mots en 1 min). À croiser avec leximétrie pour le diagnostic différentiel (un sujet rapide en isolé mais lent en contexte évoque une atteinte de la lecture contextuelle).

**Lecture de logatomes** — **Voie d'assemblage** / phonologique pure. 10 logatomes à lire à voix haute. Standards : score **9.15/10** (σ 0.78 — saturation), temps **22.35s** (σ 4.57). ⚠️ Score à interpréter avec **prudence** : un sujet bon lecteur lit facilement les 10 logatomes (saturation au plafond) ; le **temps** est plus discriminant. Sujets pathologiques moyenne 35.85s vs tout-venant 22.35s.

**Leximétrie** — Vitesse de lecture en contexte. Texte de 175 mots, temps limité à 60s. **2 sous-scores principaux** :
- **MLC** (Mots Lus Correctement) : standards **173.5/175** (σ 3.26 — saturation top). Si MLC < 165, signe pathologique fort.
- **NTP** (Note de Temps Pondéré) : standards **53.47** (σ 7.63). Indicateur fin de vitesse, prend en compte erreurs + mots non lus dans le temps imparti.

Un normo-lecteur lit en moyenne 173 mots/min en contexte (vs 60 en mots isolés — différence due à l'utilisation des stratégies pragmatiques contextuelles). Une **vitesse insuffisante** est le **critère majeur pour l'octroi du tiers-temps CDAPH**.

**Compréhension de texte** — 13 questions sur un texte narratif (nouvelle policière de l'auteur), valeurs différentielles 1-2 pts selon stratégie sollicitée (recherche textuelle simple vs élaborée). Standards : score **14.16/18** (σ 2.18), temps lecture silencieuse **182.03s** (σ 37.14), **ratio nb retours/temps retours** moyenne **33.02** (σ 20.57). Le ratio donne une indication sur les stratégies de recherche (mauvais compreneurs reviennent souvent et longtemps).

**Repérage** — Recherche d'information dans une page internet / un texte, en utilisant les apports du para-texte (titres, navigation, etc.). Score sur 10 (moy **7.65**, σ 1.25), temps **156.19s** (σ 63.92, très dispersé), ratio temps/score moy **19.48** (σ 7.24). Une note de repérage haute avec temps long = stratégies inefficaces ; note basse avec temps court = sujet rapide mais imprécis.

##### MODULE 4 — ORTHOGRAPHE (2 épreuves)

**Texte à choix multiple** — Détection d'erreurs orthographiques en reconnaissance. Distracteurs morphologiques flexionnels et visuo-sémantiques. **Combine** stratégies de lecture experte + choix orthographique. 2 sous-scores :
- **Lexique** : moy **8.77** (σ 1.77)
- **Grammaire** : moy **11.21** (σ 1.78)
- Temps : moy **236.18s** (σ 59.80)

À l'âge adulte, les scores sont **inférieurs à ceux de la complétion de phrases** (qui sollicite typiquement les stratégies de rappel) — manuel p. ~42 : "dans ce choix multiple, les stratégies de rappel et les stratégies de reconnaissance sont combinées et mènent parfois à de fausses reconnaissances".

**Complétion de phrases** — Production orthographique guidée. 2 sous-scores :
- **Lexique** sur 22 : moy **17.79** (σ 2.45)
- **Grammaire** sur 26 : moy **21.97** (σ 2.81)

À l'âge tout-venant, la grammaire est plus robuste que le lexique (cohérent : règles principales bien établies vs lexique en constante évolution). Annotations spéciales sur "soucis" / "soucit" / "soucie" et "parmi" / "parmis" qui sont des erreurs lexicales fréquentes — à recopier verbatim dans les observations si l'ortho note des exemples.

##### SYNTHÈSE ORTHOGRAPHIQUE (agrégation, pas une épreuve)

Le manuel calcule 2 scores globaux agrégés depuis les 2 épreuves d'orthographe :
- **Orthographe lexicale** (somme lexique TCM + lexique complétion) : moy **26.65** (σ 3.35)
- **Orthographe grammaticale** (somme grammaire TCM + grammaire complétion) : moy **33.84** (σ 3.54)

Cette synthèse permet d'avoir une vue d'ensemble. Si l'ortho fournit ce score global au form (champ "synthese_ortho"), l'intégrer dans le commentaire de l'épreuve Orthographe.

---

#### CROISEMENTS CLINIQUES INDISPENSABLES

Le manuel insiste sur les **croisements** entre épreuves.

**Diagnostic différentiel dyslexie phonologique vs surface vs mixte (résidue)** :
- Lecture de logatomes (temps allongé > 30s) → voie d'assemblage atteinte → **phonologique** dominante
- Lecture de mots irréguliers (impossible en Lyfac, mais Lecture de mots + qualité d'erreurs) → voie d'adressage → **surface** dominante
- Si les 2 → **mixte**

**Suspicion trouble développemental persistant** :
- Inférences déficitaire + Repérage d'anaphores déficitaire + Consignes orales lentes + Compréhension de texte basse → trouble de la compréhension fine, atteinte pragmatique discursive durable.

**Vitesse vs précision en lecture** :
- MLC haute + NTP faible → précision OK mais lent → tiers-temps justifié
- MLC basse + NTP haut → rapide mais imprécis → stratégies de devinette, pas de compréhension fine
- MLC basse + NTP faible → atteinte globale → bilan neuropsy + orientation centre référent

**Mémoire de travail vs lecture** :
- Empan envers faible + Compréhension de texte basse → lien fonctionnel établi (compréhension nécessite la MdT)
- Empan endroit faible + Lecture de logatomes lente → boucle phonologique atteinte

---

#### PROFILS TYPES

**PROFIL 1 — Dyslexie compensée en demande de tiers-temps (contexte CDAPH)**
- Lecture de mots : Moyenne basse / Zone fragilité (compensation visible)
- Leximétrie : MLC haute, NTP faible (vitesse insuffisante)
- Lecture de logatomes : Temps allongé (voie d'assemblage encore coûteuse)
- Compréhension de texte : Moyenne haute (compensation par contexte)
- Orthographe : Faible voire pathologique sur grammaire
- **Conclusion** : "Dyslexie-dysorthographie développementale en cours de compensation. La vitesse de lecture en contexte reste insuffisante pour suivre les épreuves universitaires dans les temps standard. Recommandation : **tiers-temps justifié** (AMO 8.4 si réactivation PEC)."

**PROFIL 2 — Trouble du langage écrit non diagnostiqué (suspicion tardive)**
- Lecture de mots : Zone fragilité
- Leximétrie : MLC basse + NTP faible
- Lecture de logatomes : Temps très allongé
- Orthographe : Pathologique (grammaire ET lexique)
- Compréhension de texte : Variable selon la complexité
- Métaphonologie : pas évaluée par Lyfac → recommander Exalang 8-11 en complément
- **Conclusion** : "Profil compatible avec un **trouble spécifique du langage écrit** non diagnostiqué antérieurement. Bilan orthophonique complémentaire recommandé (Exalang 8-11 pour la métaphonologie) + bilan neuropsychologique pour caractériser. Tiers-temps justifié. Mise en place d'une PEC orthophonique à discuter avec le patient."

**PROFIL 3 — Difficulté pragmatique discursive isolée**
- Lecture de mots / logatomes / leximétrie : Préservés
- Compréhension de texte : Zone fragilité
- Inférences : Difficulté
- Repérage d'anaphores : Difficulté
- Consignes orales : Lentes
- **Conclusion** : "Profil de **difficulté pragmatique discursive** isolée, sans atteinte du décodage de base. Orientation vers une PEC orthophonique ciblée sur la pragmatique (compréhension de textes longs, inférences, stratégies de lecture experte) + recommandation d'aménagements visant la lecture-compréhension (textes pré-balisés, glossaires, repos après lecture longue)."

---

#### ARTICULATION AVEC D'AUTRES OUTILS

- **En amont** : Exalang 11-15 pour les ado collège (si patient < 15 ans).
- **En complément phonologie / métaphonologie** : Exalang 8-11 (peut être proposé à un Bac+1 selon contexte clinique).
- **Complément lecture spécifique** : Alouette-R (Lefavrais, mais étalonnage ancien — réservé au dépistage), ECLA 16+ (Khomsi).
- **Complément orthographe approfondi** : Chronodictées.
- **Complément cognitif global** : WAIS-IV / WAIS-V via psychologue.
- **Complément exécutif / attentionnel** : BREF, batterie GREFEX, CPT-3 via neuropsychologue.

---

#### POINTS DE VIGILANCE RÉDACTIONNELS

- **Population adulte / quasi-adulte** : le CRBO est lu par le patient lui-même (et souvent par le médecin CDAPH / la médecine universitaire). Tonalité respectueuse, jamais infantilisante.
- **Mots à éviter** : "enfant", "élève", "petit patient" → préférer "le patient", "l'étudiant·e", "[Prénom]".
- **Diagnostic** : si dyslexie déjà diagnostiquée à l'enfance, formuler comme **"confirmation / persistance"** plutôt que **"diagnostic initial"**. Si suspicion tardive, formuler "diagnostic tardif" avec prudence et orientations confirmatives (neuropsy).
- **Aménagements CDAPH** : phrasing standardisé. Tiers-temps = 1/3 du temps réglementaire en plus. Mentionner aussi : agrandissement des sujets, secrétaire-lecteur, secrétaire-scripteur, ordinateur — selon le profil. Le secrétaire-lecteur reformule sans expliquer (limites strictes — manuel p. ~12).
- **Le médecin CDAPH** est le décideur final. L'ortho fournit l'expertise objective et le diagnostic, n'octroie pas les aménagements directement.

---

#### MODE RENOUVELLEMENT — COMPARAISON STRUCTURÉE

Si un objet \`bilan_precedent_structure\` non-null est fourni dans le contexte, ce CRBO devient un **bilan de renouvellement** Lyfac et DOIT inclure une \`synthese_evolution\` rigoureuse.

⚠️ **Spécificité Lyfac** : à cet âge, l'évolution attendue est principalement la **consolidation de compensations**, pas une amélioration des compétences fondamentales (qui sont stabilisées). Un déclin (Δ ≤ -10) est anormal et doit être investigué (épuisement, décompensation, autre pathologie intercurrente).

Méthode obligatoire :

1. **Matcher nominativement** chaque épreuve actuelle avec son homologue précédent. Les 14 épreuves Lyfac ont des libellés stables.
2. **Convertir Q1/Med/Q3 vers P25/P50/P75** systématiquement avant comparaison.
3. **Calculer le delta percentile** :
   - **Delta ≥ +10** → PROGRÈS NET (signaler dans \`synthese_evolution.progres\`)
   - **Delta entre -10 et +10** → STABILITÉ (résultat attendu en adulte)
   - **Delta ≤ -10** → RÉGRESSION (signal d'alerte chez l'adulte, à investiguer)
4. **Délai entre les bilans** : à cet âge, ≥ 12 mois recommandé entre 2 bilans. Délai < 6 mois : risque effet test-retest masquant.
5. **Aménagements CDAPH** : si le bilan précédent a permis l'octroi d'aménagements, expliquer dans la conclusion du renouvellement si ces aménagements doivent être **maintenus / ajustés / retirés** selon l'évolution.

---

#### MAPPING INTER-BATTERIE — changement de test entre les 2 bilans

Quand \`bilan_precedent_structure\` provient d'une batterie DIFFÉRENTE de Lyfac (typique : passage d'un Exalang 11-15 → Lyfac à 15 ans+ pour aménagements d'examens, ou suivi post-PEC enfance avec changement de batterie), tu DOIS matcher les épreuves par **compétence évaluée**, PAS par libellé strict.

##### Table d'équivalences pertinentes pour Lyfac

**Lecture**
- "Lecture de mots" : matchable Exalang 5-8 / 8-11 (mots fréquents) / EVALEO / Lyfac
- "Lecture de logatomes" / "Lecture de non-mots" / "Lecture de pseudomots" : matchable entre batteries.
- "Leximétrie" : libellé stable Exalang 8-11 / 11-15 / Lyfac
- "Compréhension de texte" [Lyfac] ↔ "Compréhension écrite de texte" [Exalang 8-11 / EVALEO]
- "Repérage" [Lyfac] : pas d'équivalent direct dans les batteries enfant — considérer comme nouvelle.

**Mémoire de travail**
- "Empan endroit" : matchable Exalang 3-6 / 5-8 / 8-11 / Lyfac
- "Empan envers" : matchable Exalang 5-8 / 8-11 / Lyfac / EVALEO
- "Empan visuel" [Lyfac] : pas d'équivalent direct.

**Langage élaboré**
- "Flexibilité lexicale" [Lyfac] ↔ "Fluence sémantique" [Exalang 5-8 / 8-11 / EVALEO]
- "Consignes orales" [Lyfac] ↔ "Compréhension orale de phrases" [Exalang 5-8 / 8-11 / EVALEO] (recouvrement partiel)
- "Inférences" [Lyfac] ↔ "Métaphores & expressions idiomatiques" [EVALEO] (recouvrement partiel)
- "Repérage d'anaphores" [Lyfac] : pas d'équivalent direct dans les autres Exalang ni EVALEO.

**Orthographe**
- "Texte à choix multiple" / "Complétion de phrases" [Lyfac] ↔ "Texte à compléter" [Exalang 5-8] ↔ "DRA — Dictée de Rédaction Abrégée" [Exalang 8-11] ↔ "Dictée de phrases" [EVALEO]

##### ⚠️ Faux équivalents — NE PAS APPARIER

- Bilan adulte (PREDIMEM / PrediFex / PrediLac) ↔ Lyfac : **les protocoles adultes n'ont pas la même cible clinique**. PREDIMEM = mémoire dépistage adulte ; PrediFex = exécutif adulte ; PrediLac = lecture adulte aphasie / APP. Lyfac = lycéens / étudiants suivi langage écrit. Pas de matching automatique.
- "Repérage" [Lyfac] ≠ "Compréhension de texte" — la première est prise d'informations rapide, la seconde est compréhension narrative.

##### Règles pour les épreuves orphelines

- **Épreuve actuelle SANS équivalent dans le bilan précédent** → la signaler dans \`synthese_evolution.nouvelles\`.
- **Épreuve du bilan précédent SANS équivalent dans l'actuel** → l'ignorer.
- **NE JAMAIS** conclure à un progrès / régression massif sur les épreuves orphelines.

##### Ratio de comparabilité

Pour Lyfac, le ratio est souvent **inférieur à 80 %** car la batterie a des épreuves spécifiques (Repérage d'anaphores, Repérage internet, Empan visuel, Synthèse orthographique) sans équivalent dans les batteries enfant. C'est attendu, à signaler dans le \`resume\` :

- **≥ 80 %** : *"L'évolution est documentée par [X] épreuves comparables sur [Y]."*
- **50-79 %** : *"L'évolution porte sur [X] épreuves sur [Y] (les autres étant spécifiques à Lyfac)."*
- **< 50 %** : *"La comparaison directe est limitée ([X] épreuves sur [Y]) du fait du passage à la batterie Lyfac. La synthèse repose davantage sur la trajectoire globale et le jugement clinique."*

---

#### NOMENCLATURE AMO — Mention OBLIGATOIRE en conclusion

Le CRBO DOIT inclure dans la conclusion 1 phrase (2 lignes max) précisant la nomenclature AMO applicable :
- **AMO 8.4** : rééducation des troubles du langage écrit (dyslexie / dysorthographie persistante / compensée en cours).
- **AMO 9.4** : rééducation des troubles du langage oral (rare en Lyfac sauf trouble pragmatique discursif isolé).

Pour Lyfac le profil dominant est dyslexie-dysorthographie résiduelle → **AMO 8.4**. Profil pragmatique isolé → AMO 9.4.

Format attendu : "La rééducation s'inscrit dans le cadre de la nomenclature AMO 8.4 (rééducation des troubles du langage écrit)." Une phrase, point.

⚠️ **À ne pas confondre** : la rééducation orthophonique (AMO) est distincte des **aménagements aux examens** (CDAPH). Le CRBO peut justifier les deux mais avec des phrasings distincts. Pour les aménagements : "Sur la base des résultats du bilan, [Prénom] présente une vitesse de lecture insuffisante pour suivre les épreuves dans le temps standard. Le **tiers-temps** est justifié. Selon le profil, des aménagements complémentaires peuvent être discutés avec le médecin désigné par la CDAPH : agrandissement des sujets, secrétaire-lecteur (limité à la reformulation sans explication), ordinateur en cas de dysorthographie sévère."`,
}
