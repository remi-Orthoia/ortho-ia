import type { TestModule } from './types'

export const exalang1115: TestModule = {
  nom: 'Exalang 11-15',
  editeur: 'HappyNeuron',
  auteurs: 'Helloin, Lenfant, Thibault',
  annee: 2009,
  domaines: [
    'Langage oral, réceptif et expressif',
    'Langage écrit, lecture fluente',
    'Langage écrit, compréhension écrite complexe',
    'Orthographe lexicale et grammaticale',
    'Mémoire de travail verbale',
    'Fonctions exécutives (fluences, flexibilité)',
    'Raisonnement verbal',
    'Production écrite',
  ],
  // Groupes officiels HappyNeuron Exalang 11-15 (en-têtes de la feuille de résultats).
  groupes: [
    { code: 'A.1', nom: 'Langage oral' },
    { code: 'A.2', nom: 'Métaphonologie / phonologie complexe' },
    { code: 'B.1', nom: 'Lecture' },
    { code: 'B.2', nom: 'Orthographe / production écrite' },
    { code: 'C.1', nom: 'Mémoire et fonctions exécutives' },
  ],
  epreuves: [
    'Empan auditif endroit et envers',
    'Répétition de logatomes complexes',
    'Fluences phonémique et sémantique',
    'Compréhension orale de textes abstraits',
    'Dénomination rapide de mots complexes',
    // Lecture (B.1)
    'Lecture de mots fréquents',
    'Lecture de mots irréguliers',
    'Lecture de non-mots / logatomes écrits',
    'Leximétrie en contexte (texte long)',
    'Compréhension écrite inférentielle',
    // Orthographe / production écrite (B.2, closure incluse)
    'Dictée de mots, de phrases, de texte',
    'Closure de texte complexe',
    'Production écrite narrative',
    'Raisonnement verbal (analogies, métaphores)',
  ],
  regles_specifiques: `### EXALANG 11-15, Référentiel clinique complet

Population : **collège (6e à 3e)**. Outil de référence pour le suivi des troubles des apprentissages au collège et le dépistage tardif chez des élèves non diagnostiqués au primaire.

#### RÈGLES DE CONVERSION DES PERCENTILES (impératif)
Identique à Exalang 8-11 : **Q1 → P25** (Zone de fragilité, bord inférieur), **Med → P50** (Moyenne haute, bord inférieur), **Q3 → P75** (Moyenne haute, bord supérieur).
Valeurs explicites (P5, P10, P90, P95) à utiliser telles quelles.
Ne JAMAIS recalculer depuis l'É-T : les normes étalonnées du test priment sur la distribution gaussienne théorique.

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

---

#### SPÉCIFICITÉS AU COLLÈGE

**Complexité accrue** : les épreuves de l'Exalang 11-15 testent des compétences plus fines que celles du primaire :
- Compréhension inférentielle (lire entre les lignes).
- Raisonnement verbal (analogies, métaphores).
- Production écrite structurée (récit, argumentation).
- Orthographe lexicale complexe (mots irréguliers, homophones grammaticaux).

**Mécanismes de compensation** : les dyslexiques diagnostiqués au primaire peuvent apparaître **subcliniques** sur les épreuves simples mais **décompensés** sur les épreuves complexes ou chronométrées.

---

#### INTERPRÉTATION PAR DOMAINE

**LECTURE** (mots, non-mots, leximétrie)
- À cet âge, la lecture de mots fréquents DOIT être rapide et exacte.
- Vitesse de lecture normale 6e = 140-180 mots/min ; 3e = 180-220 mots/min.
- Leximétrie déficitaire au collège → **flag majeur** pour dyslexie non diagnostiquée ou dyslexie avec sévérité résiduelle.
- Lecture de non-mots toujours sensible à la voie d'assemblage, même chez l'ado.

**COMPRÉHENSION ÉCRITE INFÉRENTIELLE**
- Évalue la capacité à construire un modèle mental du texte.
- Déficit isolé (avec bonne lecture de surface) → trouble de la **compréhension écrite** (hyperlexie inversée) → orienter vers bilan neuropsy + orthophonique spécifique.
- Souvent sous-diagnostiqué : adolescents "lisent" mais ne comprennent pas, prennent du retard en français / histoire / SVT.

**ORTHOGRAPHE** (dictée, production écrite)
- Les **homophones grammaticaux** (a/à, ou/où, est/et, ses/ces) sont des marqueurs.
- Orthographe lexicale déficitaire + orthographe grammaticale préservée → **dyslexie/dysorthographie de surface** (voie lexicale faible).
- Orthographe grammaticale très faible → **trouble morphosyntaxique** ou surcharge cognitive (à croiser avec mémoire de travail).

**FLUENCES et MÉMOIRE DE TRAVAIL**
- Empan envers très inférieur à l'empan endroit → forte présomption de **trouble dysexécutif** ou TDAH.
- Fluence sémantique > phonémique → pattern dysexécutif.
- Flag pour orientation neuropsychologie.

**PRODUCTION ÉCRITE**
- Épreuve clé au collège : évalue l'ensemble des compétences langagières.
- Critères : cohérence du récit, densité lexicale, correction orthographique, complexité syntaxique.
- Production pauvre (peu de mots, syntaxe simpliste, récit sans structure) → indicateur d'un trouble langagier global, même chez des ados qui parlent couramment.

---

#### 🎯 PROFILS TYPES

**PROFIL 1, Dyslexie compensée / résiduelle (diagnostiquée au primaire)**
- Lecture mots fréquents : Normale (compensée)
- Lecture non-mots : Fragile (trace résiduelle)
- Leximétrie : Fragile (lenteur persistante)
- Orthographe lexicale : Fragile (fautes sur mots irréguliers)
- Compréhension écrite : Normale (si lit lentement)
- Fatigabilité scolaire notée, notes en baisse en 6e
- **Diagnostic** : "La dyslexie-dysorthographie initialement diagnostiquée en [CM2] reste présente sous une forme compensée, avec une trace résiduelle sur la lecture de non-mots et la leximétrie. L'entrée au collège réactive des difficultés d'automatisation, notamment face à l'augmentation des volumes de lecture et d'écriture."
- **PEC** : maintien PEC orthophonique allégée (1 séance / 2 semaines), focus stratégies métacognitives (prise de notes, surlignage, organisation).
- **Aménagements** : PAP maintenu ou PPS si pas encore en place. Temps majoré 1/3 aux épreuves du **Brevet des Collèges**. Ordinateur possible avec logiciel de lecture vocale.

**PROFIL 2, Dyslexie non diagnostiquée jusqu'au collège**
- Lecture non-mots : Déficitaire
- Leximétrie : Déficitaire (très lente)
- Orthographe : Déficitaire (nombreuses erreurs)
- Compréhension écrite : Fragile (surcharge cognitive)
- Production écrite : pauvre, peu structurée
- Histoire scolaire : difficultés "traînantes" au primaire, considérées comme flemme ou manque de travail
- Parfois élève "doué" qui a compensé jusqu'au collège par intelligence et effort.
- **Diagnostic** : "Le profil orthophonique de [Prénom] est compatible avec une **dyslexie-dysorthographie développementale** qui n'avait pas été identifiée au primaire. La complexification des exigences scolaires au collège révèle un trouble jusque-là masqué par des stratégies de compensation."
- **PEC** : PEC intensive à démarrage, 40-50 séances. Restauration de la confiance (ado souvent en échec scolaire chronique). Stratégies métacognitives essentielles.
- **Aménagements** : PPS via MDPH à initier immédiatement. Ordinateur autorisé aux évaluations. Temps 1/3 systématique. Discussion pour le Brevet et l'orientation post-3e.

**PROFIL 3, Trouble de la compréhension écrite isolé**
- Lecture mots, non-mots, leximétrie : Normales
- Orthographe : Normale à Limite basse
- Compréhension écrite inférentielle : Déficitaire à Pathologique
- Raisonnement verbal : Fragile (analogies)
- Production écrite : pauvre sémantiquement
- Histoire : élève qui "lit bien" mais ne retient pas, difficultés en français, histoire, géographie.
- **Diagnostic** : "Les compétences de lecture de surface sont préservées, mais [Prénom] présente un **trouble de la compréhension écrite inférentielle** avec impact sur l'accès au sens des textes complexes. Ce profil est distinct de la dyslexie classique et justifie une prise en charge spécifique."
- **PEC** : PEC orthophonique centrée sur la compréhension fine, les inférences, les modèles mentaux de textes. Matériel adapté (textes courts, questionnement métacognitif).
- **Aménagements** : PAP avec énoncés reformulés, questions reformulées, temps de lecture supplémentaire, schématisation autorisée.

---

#### RECOMMANDATIONS AU COLLÈGE

- **PPS via MDPH** fortement conseillé pour tous les profils sévères (permet l'AESH, matériel adapté, temps majoré au Brevet et au Bac).
- **Aménagements Brevet et Bac** : à demander via le médecin scolaire au moins 6 mois avant les épreuves.
- **Orientation post-3e** : anticiper le choix de filière avec l'adolescent·e, vérifier la compatibilité avec ses capacités.
- **Discussion dyslexie/orientation pro** : voies pro et technologiques souvent mieux adaptées aux profils dys sévères.

#### ARTICULATION AVEC D'AUTRES OUTILS

- **Amont** : Exalang 8-11, ODEDYS, BALE.
- **Complément écrit** : BELEC (orthographe approfondie), Alouette-R (lecture rapide).
- **Complément calcul** : Examath 8-15 si dyscalculie associée.
- **Cognitif** : WISC-V ou WAIS (au-delà de 16 ans).
- **Exécutif / attention** : NEPSY-II, TEA-Ch (jusqu'à 16 ans), CPT-3, BRIEF.

---

#### MODE RENOUVELLEMENT, COMPARAISON STRUCTURÉE

Si un objet 'bilan_precedent_structure' non-null est fourni dans le contexte, ce CRBO devient un **bilan de renouvellement** et DOIT inclure une 'synthese_evolution' rigoureuse, jamais générique.

Méthode obligatoire :
1. **Matcher nominativement** chaque épreuve actuelle avec son homologue précédent (par libellé). En cas de changement de batterie (Exalang 8-11 vers 11-15 pour passage en 6e), matcher par compétence évaluée (lecture de mots avec lecture de mots, fluence avec fluence).
2. **Convertir Q1/Med/Q3 vers P25/P50/P75** systématiquement AVANT de comparer (jamais Q comparé à P).
3. **Calculer le delta percentile** :
   - Delta >= +10 -> PROGRÈS NET (signaler dans 'synthese_evolution.progres')
   - Delta entre -10 et +10 -> STAGNATION (signaler dans 'synthese_evolution.stagnation')
   - Delta <= -10 -> RÉGRESSION (signaler dans 'synthese_evolution.regression')
4. **Cas particulier Q1 vers Med** : P25 vers P50 = +25, PROGRÈS NET, jamais "marginal" ni "amélioration modérée". Idem Med vers Q3.
5. **Citation nominative obligatoire** : "Leximétrie P25 vers P50 (progrès)", PAS "plusieurs progrès observés".
6. **Délai entre les bilans** à mentionner explicitement ("Au regard de N mois de prise en charge"). Au collège, un délai >= 6-12 mois est attendu pour observer des progrès significatifs (la rééducation des troubles installés est plus lente qu'au primaire).
7. **Spécificité collège** : si décompensation observée à l'entrée 6e (dyslexie compensée qui se révèle), mentionner explicitement le changement de demande scolaire comme facteur.

---

#### MAPPING INTER-BATTERIE, changement de test entre les 2 bilans

Quand \`bilan_precedent_structure\` provient d'une batterie DIFFÉRENTE de celle du bilan actuel (typique : Exalang 8-11 → 11-15 en 6e, ou EVALEO 6-15 → Exalang 11-15 en 6e+, ou Exalang 11-15 → Lyfac à 15 ans+), tu DOIS matcher les épreuves par **compétence évaluée**, PAS par libellé strict.

##### Table d'équivalences (libellés \`↔\` matchables)

**Lecture**
- "Lecture de mots" [Exalang 5-8] ↔ "Lecture de mots fréquents" [Exalang 8-11] ↔ "Lecture de mots" [EVALEO / Lyfac]
- "Lecture de logatomes" [Exalang 5-8 / Lyfac] ↔ "Lecture de non-mots" [Exalang 8-11] ↔ "Lecture de pseudomots" [EVALEO]
- "Leximétrie" : libellé stable Exalang 8-11 / 11-15 / Lyfac

**Métaphonologie**
- "Métaphonologie, rimes" / "Rimes" : libellé stable 3-6 / 5-8 / 8-11 / EVALEO, match strict.
- "Métaphonologie, suppression phonémique" [8-11] ↔ "Inversion phonémique" [5-8] ↔ "Métaphonologie" [EVALEO]

**Mémoire de travail verbale**
- "Empan auditif endroit" [3-6 / 8-11 / 11-15 / Lyfac] ↔ "Empan de chiffres endroit" [5-8] ↔ "Répétition de chiffres endroit/envers" [EVALEO]
- "Empan envers" / "Chiffres à l'envers" : matchable 5-8 / 8-11 / 11-15 / Lyfac / EVALEO
- "Répétition de logatomes" : libellé stable, match strict.

**Langage oral**
- "Compréhension orale de phrases" : matchable 5-8 / 8-11 / 11-15 / EVALEO
- "Compréhension de récit" [5-8] ↔ "Compréhension orale de textes" [8-11 / 11-15]
- "Dénomination" [5-8] ↔ "Dénomination d'images" [8-11] ↔ "Dénomination Lexique, phonologie" [EVALEO]
- "Fluence sémantique" / "Fluence phonémique" : matchable 5-8 / 8-11 / 11-15 / EVALEO

**Orthographe**
- "Texte à compléter" [5-8] ↔ "DRA, Dictée de Rédaction Abrégée" [8-11] ↔ "Dictée de phrases" [EVALEO] ↔ "Texte à choix multiple" / "Complétion de phrases" [Lyfac]
- "Closure de mots" [5-8] ↔ "Dictée de mots" [EVALEO]

##### ⚠️ Faux équivalents, NE PAS APPARIER

- "Closure de mots" [5-8] ≠ "Closure de texte" [8-11].
- "Lecture de texte" [5-8 mi-CP] ≠ "Leximétrie" [8-11 / 11-15].
- Bilan adulte (PREDIMEM / PrediFex / PrediLac / Lyfac) ↔ bilan enfant (Exalang / EVALEO) : **aucun matching cross-population**.

##### Règles pour les épreuves orphelines

- **Épreuve actuelle SANS équivalent dans le bilan précédent** → la signaler dans \`synthese_evolution.nouvelles\`.
- **Épreuve du bilan précédent SANS équivalent dans l'actuel** → l'ignorer.
- **NE JAMAIS** conclure à un progrès / régression massif sur les épreuves orphelines.

##### Ratio de comparabilité, à mentionner dans \`synthese_evolution.resume\`

- **≥ 80 %** : *"L'évolution est documentée par [X] épreuves comparables sur [Y]."*
- **50-79 %** : *"L'évolution porte sur [X] épreuves sur [Y] (les autres étant spécifiques à la nouvelle batterie)."*
- **< 50 %** : *"La comparaison directe est limitée ([X] épreuves sur [Y]) du fait du changement de batterie entre les 2 bilans. La synthèse repose davantage sur la trajectoire globale et le jugement clinique de l'orthophoniste."*

#### NOMENCLATURE AMO, Mention OBLIGATOIRE en conclusion

Le CRBO DOIT inclure dans la conclusion 1 phrase (2 lignes max) précisant la nomenclature AMO applicable :
- **AMO 8.4** : rééducation des troubles du langage écrit (dyslexie, dysorthographie).
- **AMO 9.4** : rééducation des troubles du langage oral (TDL résiduel, troubles morphosyntaxiques).

Pour Exalang 11-15 le profil dominant attendu est dyslexie/dysorthographie persistante ou compensée -> **AMO 8.4**. Profil mixte (TDL + dyslexie) -> mentionner les deux AMO avec le dominant en premier.

Format attendu : "La rééducation s'inscrit dans le cadre de la nomenclature AMO 8.4 (rééducation des troubles du langage écrit)." Une phrase, point.`,
}
