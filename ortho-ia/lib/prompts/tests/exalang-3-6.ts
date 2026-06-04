import type { TestModule } from './types'

export const exalang36: TestModule = {
  nom: 'Exalang 3-6',
  editeur: 'HappyNeuron',
  auteurs: 'Helloin, Lenfant, Thibault',
  annee: 2006,
  domaines: [
    'Langage oral réceptif',
    'Langage oral expressif',
    'Lexique',
    'Morphosyntaxe',
    'Phonologie',
    'Métaphonologie (émergente)',
    'Mémoire de travail verbale',
  ],
  epreuves: [
    'Désignation (lexique réceptif)',
    'Dénomination (lexique expressif)',
    'Compréhension de phrases courtes',
    'Production syntaxique (phrases à partir d\'images)',
    'Répétition de mots et phrases',
    'Répétition de logatomes',
    'Empan auditif endroit',
    'Rimes, syllabes (pré-requis langage écrit)',
    'Conscience de l\'écrit émergente',
  ],
  regles_specifiques: `### EXALANG 3-6 — Référentiel clinique complet (niveau senior)

Population : **maternelle (PS, MS, GS)**. Premier outil HappyNeuron en langage oral, idéal pour les bilans de début de scolarisation et les dépistages de TDL.

#### RÈGLES DE CONVERSION DES PERCENTILES (impératif)
- Notation quartiles HappyNeuron : **Q1 → P25** (Zone de fragilité, bord inférieur), **Med → P50** (Moyenne haute, bord inférieur), **Q3 → P75** (Moyenne haute, bord supérieur).
- Valeurs explicites (P5, P10, P90, P95) à utiliser telles quelles.
- Ne JAMAIS recalculer depuis l'É-T : les normes étalonnées du test priment sur la distribution gaussienne théorique.

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

Exalang n'affiche JAMAIS de bande <P5. Bornes inclusives de part et d'autre (P25 dans Zone de fragilité, P26 dans Moyenne basse, P50 dans Moyenne haute, P75 dans Moyenne haute, P76 dans Excellent).

#### INTERPRÉTATION PAR ÉPREUVE

**LEXIQUE RÉCEPTIF** — désignation d'images
- Normes attendues à 3-6 ans, stock lexical passif.
- Décalage marqué entre désignation et dénomination = manque du mot.
- Sous-exposition langagière à considérer (multilinguisme, écrans excessifs).

**LEXIQUE EXPRESSIF** — dénomination
- Stock lexical actif.
- Dénomination très pauvre → TDL expressif probable.

**COMPRÉHENSION MORPHOSYNTAXIQUE**
- Prédictive des capacités futures de compréhension écrite.
- Déficit sévère = marqueur TDL.

**PRODUCTION SYNTAXIQUE**
- Pauvreté syntaxique = marqueur TDL.
- Inversions, omissions de morphèmes grammaticaux attendues jusqu'à 4 ans, pathologiques après.

**RÉPÉTITION DE LOGATOMES**
- Épreuve la plus sensible des difficultés phonologiques futures.
- Marqueur prédictif de dyslexie chez les enfants à risque.

**MÉTAPHONOLOGIE ÉMERGENTE**
- Rimes : acquises en MS-GS (3.5-5.5 ans).
- Syllabes (segmentation) : acquises en GS.
- Absence à la GS = alerte langage écrit.

#### CRITÈRES DSM-5 — TDL (Trouble Développemental du Langage)

Le **TDL** (anciennement "dysphasie") est défini par 4 critères DSM-5 (309.39 / F80.2) :
- **A.** Difficultés persistantes d'acquisition et d'utilisation du langage (vocabulaire réduit, structures syntaxiques pauvres, capacités narratives limitées).
- **B.** Capacités langagières substantiellement et quantitativement inférieures à celles attendues pour l'âge (sous le 10e percentile sur les épreuves standardisées, persistance > 6 mois).
- **C.** Apparition des symptômes en période de développement précoce.
- **D.** Difficultés non attribuables à un déficit auditif, à un trouble moteur, à un trouble neurologique ou à un déficit cognitif global (efficience intellectuelle non verbale dans la norme).

⚠️ **À 3-6 ans, le diagnostic différentiel central** : Retard Simple de Langage (évolutif) vs TDL persistant. Ne PAS conclure à un TDL définitif avant 5 ans révolus, sauf profil sévère et persistant malgré stimulation. Avant 5 ans, formuler en **"évocateur d'un TDL"** ou **"profil compatible avec un TDL à confirmer"**.

#### TRAJECTOIRE DÉVELOPPEMENTALE — attendus par âge

Cadre de référence pour situer les performances de l'enfant dans son couloir développemental (manuel HappyNeuron Exalang 3-6 + DSM-5 + Bishop 2017) :

**3 ans révolus (PS)** :
- Phrases de 3 mots minimum, intelligibilité ~75% par un étranger.
- Stock lexical ~ 500 mots productifs, 1000+ réceptifs.
- Compréhension de consignes simples à 2 étapes.
- Émergence des rimes simples.

**4 ans révolus (MS)** :
- Phrases complexes, "parce que", "quand", emploi des temps (présent + passé).
- Stock lexical ~ 1500 mots productifs.
- Récit court avec ordre temporel.
- Rimes acquises, syllabes en perspective.

**5 ans révolus (GS)** :
- Récits structurés (introduction / développement / fin).
- Conscience phonologique : rimes + syllabes acquises (segmentation et fusion).
- Émergence des phonèmes (commence sur les attaques).
- Lexique productif > 2000 mots, compréhension complexe (consignes 3-4 étapes).

**6 ans révolus (CP)** :
- Conscience phonémique active (suppression de phonème, premier graphème → premier phonème).
- Récit narratif fluide.
- **Tout déficit métaphonologique majeur en début CP est un drapeau rouge pour la dyslexie à venir.**

#### FACTEURS DE RISQUE — à intégrer dans l'analyse

Si l'anamnèse mentionne un ou plusieurs facteurs, le pondérer dans la conclusion (NE PAS le rendre déterministe — un enfant peut avoir des facteurs de risque sans pathologie, et vice-versa) :

- **Antécédents familiaux** de troubles du langage / dyslexie / TDA — pondère vers TDL persistant ou risque dyslexie.
- **Sexe masculin** (ratio 3:1 pour le TDL).
- **Prématurité** (< 37 SA) ou faible poids de naissance.
- **Otites séro-muqueuses à répétition** dans les 18 premiers mois — toujours demander statut audiométrique récent.
- **Bilinguisme** : ne PAS sur-diagnostiquer un TDL chez un enfant bilingue. Demander si **les deux langues sont touchées** (critère DSM-5). Si une seule langue déficitaire et l'autre préservée → c'est une question d'exposition, pas un TDL.
- **Sous-exposition langagière** (écrans excessifs, faible interaction adulte-enfant) — pondérer la sévérité du tableau et privilégier la guidance avant la PEC intensive.

#### 🎯 PROFILS TYPES

**Profil 1 — Développement normal avec fragilité isolée**
- Performances globalement dans la norme, 1 composante en limite basse (P11-P25).
- Pas de retard global, pas de plainte forte des parents.
- **Conclusion** : variation interindividuelle, surveillance.
- **Conduite à tenir** : guidance parentale (livres, jeux symboliques, qualité d'interaction), pas de PEC immédiate. Réévaluation à 6-12 mois si la fragilité persiste ou s'aggrave.

**Profil 2 — Retard Simple de Langage (3-4 ans)**
- Plusieurs composantes en Zone de fragilité ou Moyenne basse, profil homogène (toutes les composantes au même niveau, sans creux brutal).
- Enfant évolutif, plaintes parentales mais bonne compréhension globale, communication non verbale préservée.
- Anamnèse : premiers mots vers 18-24 mois, phrases vers 30-36 mois.
- **Conclusion formulation prudente** : *"Le profil de [Prénom] évoque un retard simple de langage, sans argument à ce stade pour un trouble développemental persistant. Une guidance orthophonique et une réévaluation à 6 mois permettront de préciser la trajectoire évolutive."*
- **Conduite à tenir** : guidance parentale renforcée + 6-10 séances orthophonie à visée diagnostique. Réévaluation à 6 mois impérative avant conclusion définitive.

**Profil 3 — TDL persistant émergent (4-6 ans)**
- Multi-composantes en Difficulté ou Difficulté sévère, profil hétérogène (creux marqués sur certains domaines).
- Premiers mots tardifs (> 24 mois) et/ou phrases tardives (> 36 mois).
- Persistance malgré stimulation antérieure (guidance ou PEC déjà initiée).
- Plainte scolaire à l'école maternelle, isolement social possible.
- **Conclusion** : *"Les résultats sont compatibles avec un Trouble Développemental du Langage (TDL) émergent, à confirmer lors d'une réévaluation à 12 mois. Les critères DSM-5 (A) difficultés persistantes, (B) sous le 10e percentile, (C) apparition précoce, sont aujourd'hui réunis."*
- **Conduite à tenir** : PEC orthophonique hebdomadaire 45 min, 30 séances initiales puis bilan d'étape. Orientation CRTLA si sévérité importante ou tableau atypique. Anticiper le diagnostic différentiel TSA (cf. Profil 5).

**Profil 4 — Trouble phonologique isolé**
- Phonologie / Répétition de logatomes : Difficulté sévère.
- Autres domaines (lexique, morphosyntaxe, métaphonologie, mémoire de travail) préservés.
- Intelligibilité réduite par les pairs et les enseignants (~ 50-60% à 4 ans).
- Phonèmes attendus à 4 ans encore non acquis (/r/, /ʃ/, /ʒ/, groupes consonantiques).
- Pas d'inquiétude sur la compréhension orale.
- **Conclusion** : *"[Prénom] présente un trouble phonologique isolé, caractérisé par une intelligibilité réduite secondaire à des difficultés d'organisation et de production des phonèmes. Les autres composantes du langage sont préservées."*
- **Conduite à tenir** : PEC phonologique ciblée (méthodes type Borel-Maisonny, gestes Borel, paires minimales, conscience phonologique), 20-30 séances. Vigilance pré-CP : si la phonologie reste fragile en GS, anticipation d'un risque dyslexie phonologique.

**Profil 5 — Alerte trouble de la communication sociale / TSA**
- Langage oral atteint **+ pragmatique altérée** (pas de question, écholalie, langage stéréotypé, néologismes).
- Communication non verbale aussi atteinte : pointage protodéclaratif absent ou tardif, attention conjointe pauvre, contact oculaire fuyant, gestes peu utilisés.
- Anamnèse : intérêts restreints, routines rigides, hypersensibilités sensorielles.
- Pendant le bilan : difficulté de coopération, comportements répétitifs, langage non communicatif.
- **Conclusion** : *"Au-delà du tableau langagier, [Prénom] présente des signes évocateurs d'un trouble de la communication sociale, à investiguer en priorité. Une orientation vers un CRA (Centre Ressources Autisme) ou une consultation de pédopsychiatrie spécialisée est recommandée avant la mise en place d'une PEC orthophonique isolée."*
- **Conduite à tenir** : **orientation CRA / pédopsychiatrie URGENTE** (délai 6-18 mois). NE PAS rester sur un diagnostic de TDL simple. La PEC orthophonique peut démarrer en parallèle mais sera secondaire à l'évaluation TSA. Coordination obligatoire avec l'école et la PMI.

**Profil 6 — Trouble pragmatique isolé (rare à cet âge mais à connaître)**
- Composantes formelles (lexique, syntaxe, phonologie) préservées.
- Pragmatique altérée : difficultés conversationnelles, peu de respect des tours de parole, persévérations thématiques.
- Pas de comportements TSA marqués (à différencier).
- **Conduite à tenir** : PEC orthophonique pragmatique (jeux de rôle, scripts sociaux). Bilan psychologique pour éliminer un TSA léger / Asperger.

#### À NE PAS FAIRE — pièges classiques en bilan 3-6 ans

⛔ Poser un diagnostic de TDL **avant 5 ans révolus** sauf profil sévère et persistant. Avant 5 ans, l'enfant est dans une fenêtre d'évolution maximale — privilégier "évocateur de TDL" et la réévaluation à 6 mois.
⛔ Recalculer un percentile depuis l'É-T (Q1 = P25, jamais "Difficulté sévère").
⛔ Conclure à un TDL chez un enfant bilingue sans avoir vérifié si **les deux langues** sont touchées.
⛔ Confondre un trouble phonologique isolé (intelligibilité réduite, lexique préservé) avec un TDL global.
⛔ Ignorer les signes pragmatiques évocateurs de TSA. La PEC orthophonique seule ne suffit pas si le tableau est mixte.
⛔ Recommander une PEC intensive avant 4 ans sans avoir tenté la guidance parentale (en cas de profil léger / retard simple).

#### TOUJOURS FAIRE — bonnes pratiques 3-6 ans

✅ Demander un bilan **ORL avec audiogramme récent** (les otites séro-muqueuses sont fréquentes à cet âge et impactent l'acquisition phonologique).
✅ Demander un examen ophtalmologique / orthoptique (vision = condition préalable à la lecture).
✅ Coordonner avec l'**école maternelle** (enseignante, ATSEM) et la **PMI** si pertinent.
✅ Si bilinguisme, documenter explicitement le statut linguistique des 2 langues (langue dominante, exposition, niveau dans chaque langue).
✅ Mentionner la **trajectoire développementale attendue** dans le rapport ("à 4 ans, on attend X ; ici on observe Y").
✅ Proposer une **réévaluation à 6 mois** si profil incertain ou émergent.

#### ARTICULATION
- **Complément** : EVALO 2-6, BILO 3-6, N-EEL pour les 3-6 ans.
- **Avant le CP** : Exalang 5-8 ou Exalang 8-11 selon progression.
- **Cognitif** : WPPSI-IV (2;6-7;7 ans) si doute efficience.
- **Médical** : neuropédiatre, ORL systématique, orthoptie.

#### RECOMMANDATIONS
- Retard simple < 5 ans : guidance intensive + suivi 6 mois.
- TDL confirmé : PEC hebdomadaire immédiate, 30 min.
- Bilan **ORL impératif** à cet âge (otites séro-muqueuses).
- Coordination PMI, crèche, école maternelle.
- Suivi préventif au CP (risque de dyslexie).

---

#### MODE RENOUVELLEMENT — COMPARAISON STRUCTURÉE

Si un objet 'bilan_precedent_structure' non-null est fourni dans le contexte, ce CRBO devient un **bilan de renouvellement** et DOIT inclure une 'synthese_evolution' rigoureuse, jamais générique.

Méthode obligatoire :
1. **Matcher nominativement** chaque épreuve actuelle avec son homologue précédent (par libellé). En cas de changement de batterie (Exalang 3-6 vers 5-8 pour passage en GS/CP), matcher par compétence (lexique réceptif avec lexique réceptif, métaphonologie avec métaphonologie).
2. **Convertir Q1/Med/Q3 vers P25/P50/P75** systématiquement AVANT de comparer.
3. **Calculer le delta percentile** :
   - Delta >= +10 -> PROGRÈS NET (signaler dans 'synthese_evolution.progres')
   - Delta entre -10 et +10 -> STAGNATION (signaler dans 'synthese_evolution.stagnation')
   - Delta <= -10 -> RÉGRESSION (signaler dans 'synthese_evolution.regression')
4. **Cas particulier Q1 vers Med** : P25 vers P50 = +25, PROGRÈS NET. Idem Med vers Q3.
5. **Citation nominative obligatoire** : "Lexique réceptif P25 vers P50 (progrès)", PAS "plusieurs progrès observés".
6. **Délai entre les bilans** à mentionner ("Au regard de N mois de prise en charge / de guidance"). Chez l'enfant en maternelle, tenir compte de la maturation développementale (les progrès spontanés sont attendus avant 5 ans).

---

#### MAPPING INTER-BATTERIE — changement de test entre les 2 bilans

Quand \`bilan_precedent_structure\` provient d'une batterie DIFFÉRENTE de celle du bilan actuel (typique en pédiatrie sur plusieurs années : Exalang 3-6 → 5-8 en GS-CP, Exalang 5-8 → 8-11 en CE2, Exalang vers EVALEO entre 6 et 15 ans, ou EVALEO 6-15 → Exalang 8-11 selon le choix de l'ortho), tu DOIS matcher les épreuves par **compétence évaluée**, PAS par libellé strict.

##### Table d'équivalences (libellés \`↔\` matchables comme épreuves comparables)

**Lecture — identification de mots**
- "Lecture de mots" [Exalang 5-8] ↔ "Lecture de mots fréquents" [Exalang 8-11] ↔ "Lecture de mots" [EVALEO]
- "Lecture de logatomes" [Exalang 5-8] ↔ "Lecture de non-mots" [Exalang 8-11] ↔ "Lecture de pseudomots" [EVALEO]
- "Leximétrie" : libellé stable sur Exalang 8-11 / Lyfac

**Métaphonologie**
- "Métaphonologie — rimes" / "Rimes" : libellé stable Exalang 3-6 / 5-8 / 8-11 / EVALEO — match strict possible.
- "Métaphonologie — syllabes" [Exalang 3-6] ↔ "Comptage syllabique" + "Segmentation-fusion syllabique" [Exalang 5-8]
- "Métaphonologie — suppression phonémique" [Exalang 8-11] ↔ "Inversion phonémique" [Exalang 5-8] ↔ "Métaphonologie" [EVALEO]

**Mémoire de travail verbale**
- "Empan auditif endroit" [Exalang 3-6 / 8-11 / Lyfac] ↔ "Empan de chiffres endroit" [Exalang 5-8] ↔ "Répétition de chiffres endroit/envers" [EVALEO, contient les 2 dimensions]
- "Empan envers" / "Chiffres à l'envers" : matchable Exalang 5-8 / 8-11 / Lyfac / EVALEO
- "Répétition de logatomes" : libellé stable Exalang 3-6 / 5-8 / 8-11 / EVALEO — match strict possible.

**Langage oral — réceptif**
- "Désignation (lexique réceptif)" [Exalang 3-6] ↔ "Désignation sur définition" [Exalang 8-11] ↔ "Désignation d'images" [EVALEO]
- "Compréhension morphosyntaxique" [Exalang 3-6] ↔ "Compréhension orale de phrases" [Exalang 5-8 / 8-11] ↔ "Compréhension orale de phrases" [EVALEO]
- "Compréhension de récit" [Exalang 5-8] ↔ "Compréhension orale de textes" [Exalang 8-11]

**Langage oral — expressif**
- "Dénomination (lexique expressif)" [Exalang 3-6] ↔ "Dénomination" [Exalang 5-8] ↔ "Dénomination d'images" [Exalang 8-11] ↔ "Dénomination Lexique — phonologie" [EVALEO]
- "Fluence sémantique" : libellé stable Exalang 5-8 / 8-11 / EVALEO (équivalent : "Flexibilité lexicale" [Lyfac])
- "Fluence phonémique" : libellé stable Exalang 5-8 / 8-11 / EVALEO

**Orthographe**
- "Closure de mots" [Exalang 5-8] ↔ "Dictée de mots" [EVALEO]
- "Transcription de logatomes" [Exalang 5-8] ↔ "Dictée de pseudomots" [EVALEO]
- "Texte à compléter" [Exalang 5-8] ↔ "DRA — Dictée de Rédaction Abrégée" [Exalang 8-11] ↔ "Dictée de phrases" [EVALEO]

##### ⚠️ Faux équivalents — NE PAS APPARIER

- "Closure de mots" [Exalang 5-8] ≠ "Closure de texte" [Exalang 8-11] : la première est une production lexicale, la seconde une compréhension contextuelle.
- "Lecture de texte" [Exalang 5-8 mi-CP] ≠ "Leximétrie" [Exalang 8-11] : la première est une lecture compréhension globale, la seconde est purement vitesse.
- "Approche implicite de la lecture" [Exalang 5-8] ≠ "Conscience de l'écrit" [Exalang 3-6] : recouvrement partiel seulement, pas d'équivalence directe.
- Bilan adulte (PREDIMEM / PrediFex / PrediLac / Lyfac) ↔ bilan enfant (Exalang / EVALEO) : **aucun matching cross-population**. Si le bilan précédent est d'une autre tranche d'âge, considérer toutes les épreuves comme nouvelles.

##### Règles pour les épreuves orphelines

- **Épreuve actuelle SANS équivalent dans le bilan précédent** → la signaler dans \`synthese_evolution.nouvelles\` (et non dans progres/regression).
- **Épreuve du bilan précédent SANS équivalent dans l'actuel** → l'ignorer (le bilan actuel ne mesure plus cette compétence, pas pertinent de la commenter).
- **NE JAMAIS** conclure à un progrès ou une régression massive sur les épreuves orphelines — c'est de la non-comparabilité, pas une évolution clinique.

##### Ratio de comparabilité — à mentionner dans \`synthese_evolution.resume\`

Calcule \`(nombre d'épreuves comparables) / (nombre d'épreuves actuelles)\`. Adapte la 1re phrase du \`resume\` :

- **≥ 80 %** : *"L'évolution est documentée par [X] épreuves comparables sur [Y]."*
- **50-79 %** : *"L'évolution porte sur [X] épreuves sur [Y] (les autres étant spécifiques à la nouvelle batterie)."*
- **< 50 %** : *"La comparaison directe est limitée ([X] épreuves sur [Y]) du fait du changement de batterie entre les 2 bilans. La synthèse repose davantage sur la trajectoire globale et le jugement clinique de l'orthophoniste."*

#### NOMENCLATURE AMO — Mention OBLIGATOIRE en conclusion

Le CRBO DOIT inclure dans la conclusion 1 phrase (2 lignes max) précisant la nomenclature AMO applicable :
- **AMO 9.4** : rééducation des troubles du langage oral (TDL, retard simple, troubles articulatoires).
- **AMO 8.4** : rééducation des troubles du langage écrit (rare à cet âge, sauf prévention pré-CP).

Pour Exalang 3-6 le profil dominant est langage oral -> **AMO 9.4**. Profil avec déficit phonologique sévère pré-CP -> AMO 9.4 (puis transition vers 8.4 si dyslexie confirmée plus tard).

Format attendu : "La rééducation s'inscrit dans le cadre de la nomenclature AMO 9.4 (rééducation des troubles du langage oral)." Une phrase, point.`,
}
