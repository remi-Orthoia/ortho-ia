import type { TestModule } from './types'

/**
 * Module Exalang Lyfac — Examen du Langage écrit et de la Mémoire pour les
 * jeunes adultes (lycéens et étudiants).
 *
 * Auteurs : Marie-Pierre THIBAULT (orthophoniste, dr en linguistique) &
 * Mickaël LENFANT (dr en sciences du langage).
 * Éditeur : HappyNeuron / Motus.
 *
 * Population cible : lycéens et étudiants universitaires (jeunes adultes
 * 15-25 ans environ) — bilan orthophonique dans le cadre des aménagements
 * aux examens (CDAPH, médecine préventive universitaire), repérage des
 * troubles spécifiques persistants (dyslexie, TDL non rééduqués) chez
 * l'adolescent / jeune adulte.
 *
 * Source : manuel officiel (8.2 Mo) + cahier de passation (529 Ko).
 *
 * Structure officielle (table des matières du manuel) :
 *   - Mémoire : Empan visuel + Empan endroit + Empan envers
 *   - Langage élaboré : Flexibilité lexicale + Consignes orales + Inférences
 *   - Lecture : Lecture de mots + Lecture de logatomes + Leximétrie +
 *     Compréhension de texte + Repérage
 *   - Orthographe : Texte à choix multiple + Complétion de phrases
 */
export const exalangLyfac: TestModule = {
  nom: 'Exalang Lyfac',
  editeur: 'HappyNeuron / Motus',
  auteurs: 'M.-P. Thibault & M. Lenfant',
  annee: 2010,
  domaines: [
    'Mémoire',
    'Langage élaboré',
    'Lecture',
    'Orthographe',
  ],
  epreuves: [
    // Mémoire
    'Empan visuel',
    'Empan endroit',
    'Empan envers',
    // Langage élaboré
    'Flexibilité lexicale',
    'Consignes orales',
    'Inférences',
    // Lecture
    'Lecture de mots',
    'Lecture de logatomes',
    'Leximétrie',
    'Compréhension de texte',
    'Repérage',
    // Orthographe
    'Texte à choix multiple',
    'Complétion de phrases',
    'Synthèse orthographique',
  ],
  regles_specifiques: `### Exalang Lyfac — Examen du Langage écrit et de la Mémoire pour les jeunes adultes (Thibault & Lenfant, HappyNeuron / Motus)

**Population cible** : lycéens et étudiants universitaires (~15-25 ans).

**Contexte clinique** : ce bilan est principalement utilisé pour :
- Établir un dossier d'**aménagements aux examens** auprès de la CDAPH ou de la médecine préventive universitaire.
- Repérer ou confirmer un **trouble spécifique** persistant chez le jeune adulte (dyslexie / dysorthographie non rééduquées en primaire, TDL résiduel).
- Faire le point sur les **séquelles** d'un trouble spécifique déjà diagnostiqué (vérifier si les aménagements restent nécessaires).

#### RÈGLES DE CONVERSION (HappyNeuron)
- Quartiles HappyNeuron : **Q1 → P25** (Zone de fragilité, bord inférieur), **Med → P50** (Moyenne haute, bord inférieur), **Q3 → P75** (Moyenne haute, bord supérieur).
- Valeurs explicites (P5, P10, P90, P95) à utiliser telles quelles.
- Ne JAMAIS recalculer depuis l'É-T : les normes étalonnées du test priment sur la distribution gaussienne théorique.

Exemple piège classique : "Empan endroit : É-T -1.53, Q1" → Percentile = P25 → Interprétation **Zone de fragilité** (et non "Difficulté sévère" comme le suggérerait l'É-T).

#### SEUILS CLINIQUES (grille 6 zones Laurie, refonte 2026-05-ter)
- P76-100 : Excellent
- P50-P75 : Moyenne haute (Q3 inclus)
- P26-P49 : Moyenne basse
- P11-P25 : Zone de fragilité (Q1 inclus)
- P6-P10  : Difficulté
- P1-P5   : Difficulté sévère (Exalang n'affiche jamais <P5)

---

#### STRUCTURE OFFICIELLE DES DOMAINES

**MÉMOIRE**
- Empan visuel : MdT visuo-spatiale.
- Empan endroit : MdT verbale, boucle phonologique.
- Empan envers : MdT verbale + manipulation, administrateur central.

**LANGAGE ÉLABORÉ**
- Flexibilité lexicale : variation lexicale, synonymes, paraphrase.
- Consignes orales : compréhension de consignes complexes (souvent dans contexte d'examen).
- Inférences : compréhension implicite / sous-entendu.

**LECTURE**
- Lecture de mots : voie d'adressage (lexique orthographique).
- Lecture de logatomes : voie d'assemblage (phonologique).
- Leximétrie : vitesse de lecture (mots/min) — marqueur central chez le jeune adulte (élément déterminant pour aménagements aux examens).
- Compréhension de texte : compréhension narrative / argumentative.
- Repérage : prise d'informations rapide dans un texte (compétence académique).

**ORTHOGRAPHE**
- Texte à choix multiple : détection d'erreurs orthographiques en reconnaissance.
- Complétion de phrases : production orthographique guidée.
- Synthèse orthographique : score global de la composante orthographe.

---

#### INTERPRÉTATION CLINIQUE

**Vitesse de lecture (Leximétrie)** = critère majeur chez le jeune adulte
- Étudiant universitaire normal : 200-300 mots/min en lecture silencieuse.
- < 150 mots/min en lecture silencieuse à l'âge adulte = **fort impact académique** (volume de lecture impossible à absorber pour le cursus).
- Justifie à elle seule le **tiers-temps majoré** aux examens si confirmée par d'autres marqueurs.

**Pattern lecture mots / logatomes**
- Logatomes déficitaires + mots préservés (compensation) → dyslexie phonologique persistante mais compensée par voie lexicale.
- Mots ET logatomes déficitaires → dyslexie mixte persistante.
- Mots déficitaires + logatomes préservés → dyslexie de surface persistante (rare chez l'adulte).

**Compréhension de texte**
- Déficit isolé en compréhension (lecture mots OK) → trouble de la compréhension, à différencier d'un trouble du raisonnement.
- Croiser avec Inférences pour confirmer.

**Orthographe**
- Dysorthographie persistante très fréquente chez les jeunes adultes anciennement dyslexiques.
- Texte à choix multiple : si déficit + complétion préservée → trouble de la mémoire orthographique (reconnaissance) > production.

**Mémoire de travail**
- Empans verbal et visuo-spatial déficitaires → atteinte de la MdT, fréquente en comorbidité TDAH (à orienter vers bilan neuropsy / psychiatre si suspicion).
- Empan envers très déficitaire isolément → atteinte de l'administrateur central / fonctions exécutives.

---

#### 🎯 PROFILS CLINIQUES TYPES

**PROFIL 1 — Dyslexie / dysorthographie persistante chez l'étudiant**
- Lecture de logatomes : Fragile à Déficitaire.
- Lecture de mots : Fragile (souvent compensée par stratégie lexicale).
- Leximétrie : Fragile à Déficitaire (< 200 mots/min en lecture silencieuse).
- Orthographe : Déficitaire (souvent le marqueur le plus visible à l'âge adulte).
- Mémoire : variable.
- **Diagnostic** : "Trouble spécifique des apprentissages en langage écrit (dyslexie-dysorthographie) **persistant** à l'âge adulte. Les compensations mises en place au cours de la scolarité ont permis une lecture fonctionnelle mais la vitesse de lecture et l'orthographe restent significativement déficitaires, justifiant des aménagements aux examens (tiers-temps, calculatrice, secrétaire-correcteur)."
- **Aménagements** : tiers-temps majoré (1/3), correcteur orthographique autorisé, sujet agrandi si déficit visuel associé, ordinateur, dispense de notation orthographique en langues vivantes.

**PROFIL 2 — Trouble de la compréhension écrite isolé**
- Lecture (mots + logatomes + leximétrie) : Préservée.
- Compréhension de texte : Déficitaire.
- Inférences : Déficitaire.
- Repérage : variable.
- **Diagnostic** : "Trouble de la compréhension écrite chez un jeune adulte par ailleurs bon décodeur. À explorer en bilan neuropsychologique pour différencier trouble du raisonnement, hyperlexie inversée, ou trouble de la communication sociale."

**PROFIL 3 — Trouble de la mémoire de travail isolé (suspicion TDAH)**
- Lecture + Orthographe : Préservées.
- Empans (endroit + envers + visuel) : Fragiles à Déficitaires.
- Compréhension de texte : Fragile (consécutif à la MdT).
- **Diagnostic** : "Profil de fragilité de la mémoire de travail, à confronter à une évaluation des fonctions attentionnelles. Hypothèse d'un TDAH non diagnostiqué à explorer (bilan neuropsy + consultation psychiatrique)."

**PROFIL 4 — Jeune adulte tout-venant avec plainte (souvent stress / surcharge)**
- Toutes les épreuves dans la moyenne ou la moyenne haute.
- Plainte d'inefficience scolaire / universitaire.
- **Diagnostic** : "Aucun trouble spécifique orthophonique objectivable. Performances dans la norme attendue. La plainte d'inefficience peut être en lien avec une surcharge cognitive (charge de travail, sommeil insuffisant), une difficulté méthodologique, ou un trouble anxieux à explorer."
- PEC : pas d'indication orthophonique. Orienter vers psychologue / médecin universitaire pour évaluation globale.

---

#### ⛔ RÈGLES CLINIQUES

1. **Vitesse de lecture (Leximétrie)** = critère majeur à reporter pour toute demande d'aménagement aux examens.
2. **TOUJOURS situer le bilan** dans son contexte (CDAPH, médecine préventive, suivi post-PEC enfance).
3. **TOUJOURS croiser au moins 3 épreuves convergentes** pour confirmer un trouble persistant.
4. **NE PAS diagnostiquer un TDL** à l'âge adulte sans antécédents d'enfance (le TDL est par définition développemental).
5. **TDAH** : ne pas poser le diagnostic depuis Exalang Lyfac — orienter vers neuropsy / psychiatre. Mais signaler le profil compatible.
6. **Dyslexie compensée** : utiliser ce terme avec précaution — préférer "trouble spécifique persistant avec compensations efficaces sur [domaines], déficit résiduel sur [domaines]".

#### RECOMMANDATIONS / AMÉNAGEMENTS

**Aménagements types aux examens (CDAPH / médecine universitaire)** :
- Tiers-temps majoré (1/3) sur toutes les épreuves écrites.
- Sujet agrandi (corps 14-16) si fatigue visuelle.
- Correcteur orthographique informatique autorisé.
- Ordinateur portable (sans accès internet) pour la prise de notes ou la rédaction.
- Secrétaire-lecteur ou secrétaire-correcteur si déficit sévère.
- Salle calme, sortie autorisée pour fatigue.
- Dispense de notation orthographique en langues étrangères.

**PEC** : selon la sévérité — souvent pas de PEC orthophonique nouvelle à cet âge, mais accompagnement méthodologique + aménagements + recours technologiques.

---

#### À NE JAMAIS FAIRE EN Exalang Lyfac

- ❌ Conclure depuis une seule épreuve.
- ❌ Diagnostiquer un TDL chez un adulte sans antécédent d'enfance.
- ❌ Poser un diagnostic de TDAH (réservé au psychiatre).
- ❌ Ignorer la leximétrie — c'est le critère le plus utilisé pour justifier les aménagements universitaires.
- ❌ Confondre fragilité orthographique persistante et dysorthographie nouvelle.

#### TOUJOURS FAIRE

- ✅ Reporter le **percentile** de chaque épreuve, en particulier la leximétrie en mots/min.
- ✅ Préciser l'**historique** (PEC orthophonique en enfance ? aménagements antérieurs ? collège/lycée ?).
- ✅ Croiser au moins 3 épreuves pour confirmer un trouble persistant.
- ✅ Formuler des recommandations d'**aménagements aux examens** précises et chiffrées.
- ✅ Mentionner les **compensations** mises en place par le jeune adulte (stratégies de lecture rapide, recours au correcteur orthographique, etc.).
- ✅ Orienter vers psy / neuropsy / médecin universitaire si profil non orthophonique.

---

#### MODE RENOUVELLEMENT — COMPARAISON STRUCTURÉE

Si un objet 'bilan_precedent_structure' non-null est fourni dans le contexte, ce CRBO devient un **bilan de renouvellement** et DOIT inclure une 'synthese_evolution' rigoureuse, jamais générique.

Méthode obligatoire :
1. **Matcher nominativement** chaque épreuve actuelle avec son homologue précédent (par libellé). En cas de changement de batterie (Exalang 11-15 vers Lyfac pour passage au lycée/fac), matcher par compétence évaluée (lecture de mots avec lecture de mots, leximétrie avec leximétrie, empan avec empan).
2. **Convertir Q1/Med/Q3 vers P25/P50/P75** systématiquement AVANT de comparer.
3. **Calculer le delta percentile** :
   - Delta >= +10 -> PROGRÈS NET (signaler dans 'synthese_evolution.progres')
   - Delta entre -10 et +10 -> STAGNATION (signaler dans 'synthese_evolution.stagnation')
   - Delta <= -10 -> RÉGRESSION (signaler dans 'synthese_evolution.regression')
4. **Cas particulier Q1 vers Med** : P25 vers P50 = +25, PROGRÈS NET. Idem Med vers Q3.
5. **Citation nominative obligatoire** : "Leximétrie P25 vers P50 (progrès, 280 mots/min)", PAS "plusieurs progrès observés".
6. **Spécificité jeune adulte** : à cet âge, les troubles installés sont peu réversibles ; un renouvellement Lyfac vise davantage à **objectiver la stabilité du trouble** pour le maintien des aménagements aux examens qu'à mesurer une rééducation active. Tenir compte de ce contexte dans la formulation de la 'synthese_evolution.resume'.
7. **Délai entre les bilans** à mentionner explicitement ("Au regard de N mois écoulés depuis le précédent bilan").

---

#### MAPPING INTER-BATTERIE — changement de test entre les 2 bilans

Quand \`bilan_precedent_structure\` provient d'une batterie DIFFÉRENTE de celle du bilan actuel (typique pour Lyfac : passage d'un Exalang 11-15 → Lyfac à 15 ans+ pour aménagements d'examens, ou suivi post-PEC enfance avec changement de batterie), tu DOIS matcher les épreuves par **compétence évaluée**, PAS par libellé strict.

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

**Orthographe**
- "Texte à choix multiple" / "Complétion de phrases" [Lyfac] ↔ "Texte à compléter" [Exalang 5-8] ↔ "DRA — Dictée de Rédaction Abrégée" [Exalang 8-11] ↔ "Dictée de phrases" [EVALEO]
- "Synthèse orthographique" [Lyfac] : score global, pas d'équivalent direct.

##### ⚠️ Faux équivalents — NE PAS APPARIER

- Bilan adulte (PREDIMEM / PrediFex / PrediLac) ↔ Lyfac : **les protocoles adultes n'ont pas la même cible clinique**. PREDIMEM = mémoire dépistage adulte ; PrediFex = exécutif adulte ; PrediLac = lecture adulte aphasie / APP. Lyfac = lycéens / étudiants suivi langage écrit. Pas de matching automatique.
- "Repérage" [Lyfac] ≠ "Compréhension de texte" — la première est prise d'informations rapide, la seconde est compréhension narrative.

##### Règles pour les épreuves orphelines

- **Épreuve actuelle SANS équivalent dans le bilan précédent** → la signaler dans \`synthese_evolution.nouvelles\`.
- **Épreuve du bilan précédent SANS équivalent dans l'actuel** → l'ignorer.
- **NE JAMAIS** conclure à un progrès / régression massif sur les épreuves orphelines.

##### Ratio de comparabilité — à mentionner dans \`synthese_evolution.resume\`

Pour Lyfac, ce ratio est souvent **inférieur à 80 %** car la batterie a des épreuves spécifiques (Repérage, Empan visuel, Synthèse orthographique) sans équivalent dans les batteries enfant. C'est attendu, à signaler dans le \`resume\`.

- **≥ 80 %** : *"L'évolution est documentée par [X] épreuves comparables sur [Y]."*
- **50-79 %** : *"L'évolution porte sur [X] épreuves sur [Y] (les autres étant spécifiques à Lyfac)."*
- **< 50 %** : *"La comparaison directe est limitée ([X] épreuves sur [Y]) du fait du passage à la batterie Lyfac. La synthèse repose davantage sur la trajectoire globale et le jugement clinique."*

#### NOMENCLATURE AMO — Mention OBLIGATOIRE en conclusion

Le CRBO DOIT inclure dans la conclusion 1 phrase (2 lignes max) précisant la nomenclature AMO applicable, OU mentionner explicitement l'absence de PEC active si le bilan vise uniquement à objectiver les aménagements :
- **AMO 8.4** : rééducation des troubles du langage écrit (dyslexie/dysorthographie persistante).
- **AMO 9.4** : rééducation des troubles du langage oral (rare à cet âge).

Pour Exalang Lyfac le profil dominant attendu est dyslexie/dysorthographie persistante -> **AMO 8.4** si reprise/maintien de PEC. Si l'évaluation vise uniquement la justification d'aménagements aux examens sans reprise de PEC, mentionner explicitement : "Pas de reprise de prise en charge orthophonique indiquée à ce stade. Le bilan vise à objectiver les aménagements aux examens auprès de la CDAPH / médecine préventive universitaire."

Format attendu pour AMO : "La rééducation s'inscrit dans le cadre de la nomenclature AMO 8.4 (rééducation des troubles du langage écrit)." Une phrase, point.`,
}
