# AUDIT MODULES `lib/prompts/tests/`

**Date** : 2026-05-11
**Objectif** : évaluer honnêtement la profondeur clinique de chaque module avant la beta avec les 3 orthophonistes, identifier les manques pour la prod, prioriser les enrichissements.

**Note préalable** : contrairement à ce qui était attendu dans le brief, aucun module ne contient explicitement de placeholders `[ORTHO:...]` à remplir. Tous ont du contenu rédigé. L'audit porte donc sur la **profondeur clinique réelle** (profils déployés, dissociations explicitées, articulations entre outils, couverture des populations).

---

## Tableau récapitulatif

| Module | Lignes regles | Profils types déployés | Couverture pop. | Spécificité étalonnage | Confiance clinique (1-5) | Manque principal pour prod |
|---|---:|---:|---|---|---:|---|
| **Exalang 8-11** | 127 | 3 (phono / mixte / DYS+TDA) | CE2-CM2 | Q1/Med/Q3 + valeurs P | **5** | RAS — module phare, modèle pour les autres |
| **Exalang 11-15** | 104 | 3 (compensée / non-diag / compréhension) | 6e-3e | Q1/Med/Q3 | **4.5** | Profil "post-3e orientation" mince |
| **EVALEO 6-15** | 75 | 4 (TDL / dyslexie / pragmatique / global) | CP-3e | Centiles + standards | 4 | Profil pragmatique mériterait + détail |
| **Examath** | 127 | 3 (dyscalculie / secondaire / anxiété) | CP-3e | Q1/Med/Q3 | 4 | **DYS+dyscalculie mixte** peu déployé ; pas d'adulte |
| **BALE** | 71 | 3 (phono / surface / mixte+visuoattn) | CE1-CM2 | Centiles + Z-scores | 4 | Visuo-attentionnel (Valdois) survolé |
| **BELEC** | 65 | 3 (surface / phono / mixte) | CE1-5e | Centiles | 4 | Pas de profil bilan renouvellement détaillé |
| **EVALO 2-6** | 78 | 4 (RSL / TDL / alerte TSA / motrice) | 2;3-6;3 | Centiles fins / 6 mois | 4 | OK pour son périmètre |
| **BILO** | 78 | 4 (RSL / phono / sémantico / mixte) | 3-12 | Standards + centiles | 4 | Versions BILO-1/2/3 pas différenciées |
| **Exalang 5-8** | 90 | 3 (RSL / dyslexie débutante / TDL) | GS-CE1 | Q1/Med/Q3 | 3.5 | **Marqueurs précoces** dyslexie peu déployés |
| **N-EEL** | 70 | 4 (RSL / TDL exp / dysphasie / phono) | 3;7-8;7 | Standards (M=100, ÉT=15) | 3.5 | Outil daté (2001), profils brefs |
| **ELO** | 73 | 4 (retard / phono / TDL / TDL sévère) | 3-11 | Centiles + ÉT | 3.5 | Pas de discrimination claire âge-dépendante |
| **Exalang 3-6** | 79 | 5 mais brefs | PS-GS | Q1/Med/Q3 | 3.5 | Profils types courts (5-8 lignes chacun) |
| **Examath (math)** | (cf. 4 plus haut) | | | | | _voir Examath_ |
| **BETL** | **44** | **0 profils déployés** | Adulte 60+ | Seuils standards | **2.5** | ⚠️ **Aphasie progressive / Alzheimer / vieillissement normal pas différenciés** |
| **MoCA** | **39** | **0 profils déployés** | Adulte / senior | Scores /30 + cutoffs | **2.5** | ⚠️ **MCI / Alzheimer débutant / profil normal pas différenciés** |
| **OMF / Déglutition** | **27** | **0 profils déployés** | Tous âges | Observationnel (pas de % réel) | **2** | ⚠️ **Déglutition atypique vs primaire vs adulte SLA pas différenciés** |

---

## Analyse détaillée

### 🟢 Niveau 5/5 — production-ready

**Exalang 8-11** (le module de référence)
- 3 profils types très déployés (10-15 lignes chacun) avec arbre décisionnel diagnostic / PEC / aménagements.
- Articulation avec 7 autres outils.
- Points de vigilance rédactionnels explicites.
- Anti-pattern bien documenté (Q1 = P25 = Fragilité, pas Moyenne basse).
- **Sert de gabarit pour tous les autres modules.**

### 🟡 Niveau 4/5 — solide, marges d'amélioration limitées

Modules **Exalang 11-15**, **EVALEO 6-15**, **Examath**, **BALE**, **BELEC**, **EVALO 2-6**, **BILO**.

Tous ont :
- ✅ 3-4 profils types nommés et différenciés
- ✅ Règles de conversion explicites
- ✅ Articulation avec autres outils
- ✅ Au moins 60 lignes de contenu clinique

Manques typiques :
- Pas de couverture des profils "limites" (entre 2 catégories)
- Articulation entre versions internes (BILO-1/2/3, Examath 5-8/8-15) survolée

### 🟠 Niveau 3-3.5/5 — solide structure, profils types brefs

**Exalang 5-8**, **N-EEL**, **ELO**, **Exalang 3-6**.

Patterns observés :
- Les profils types existent mais ne dépassent pas 5-8 lignes (vs 10-15 pour les modules niveau 5)
- Manque de cas mixtes / co-morbides
- Pas toujours de critère différentiel explicite entre 2 profils proches
- Recommandations de PEC pas toujours quantifiées (fréquence / durée)

### 🔴 Niveau 2-2.5/5 — incomplets, à enrichir AVANT la beta

#### **BETL** (44 lignes utiles)
- ❌ **ZÉRO profil type déployé**
- ❌ Pas de différenciation vieillissement normal / MCI / aphasie / démence
- ❌ Pas de cas concrets pour guider la rédaction
- ✅ Bonnes spécificités générales (temps de dénomination, dissociation fluences)
- **Manque critique** : un orthophoniste qui utilise la BETL le fait pour distinguer un vieillissement normal d'une APP (aphasie progressive primaire) ou d'un MCI — exactement ce qui n'est PAS dans le module.

#### **MoCA** (39 lignes utiles)
- ❌ **ZÉRO profil type**
- ❌ Pas de discrimination MCI (mild cognitive impairment) vs Alzheimer débutant vs profil normal post-Covid
- ✅ Scoring /30 bien documenté, cutoffs corrects
- **Manque critique** : la MoCA est un outil de **dépistage** qui doit orienter vers du bilan approfondi. Le module liste ce qu'il ne faut PAS faire mais ne dit pas comment interpréter les patterns observés (sous-scores attention vs mémoire vs visuo-exécutif).

#### **OMF / Déglutition** (27 lignes utiles)
- ❌ **ZÉRO profil type**
- ❌ Pas de différenciation enfant / adulte / personne âgée
- ❌ Pas de cas SLA, AVC, Parkinson (cas adultes typiques)
- ❌ Pas de différenciation déglutition atypique persistante (enfant) vs presbyphagie (senior) vs dysphagie post-AVC
- ✅ Reconnaissance que les scores ne sont pas étalonnés (observationnels)
- **Manque critique** : C'est l'unique module pour les troubles oro-myo-faciaux. Si une ortho beta fait un bilan de déglutition adulte post-AVC, le draft IA sera générique. C'est inutilisable en l'état pour ces cas.

#### **Examath (DYS+dyscalculie mixte)** — partiel
- Le module Examath général est noté 4/5, mais le **profil 4 "DYS + dyscalculie mixte"** est absent (alors qu'il représente 30-40% des cas selon la littérature, cf. ligne 151 du module).
- Le profil "anxiété mathématique" existe mais mériterait + de marqueurs comportementaux observables.
- Pas de profil adulte (étudiant·e en filière scientifique en échec, par exemple).

---

## Priorisation pour enrichissement

D'après le brief utilisateur + cet audit, l'ordre de priorité est :

1. **OMF / Déglutition** (passer 2 → 4) — le plus pauvre, et utilisable sur populations très diverses
2. **MoCA** (passer 2.5 → 4) — discriminations cliniques cruciales pour la pop. senior
3. **BETL** (passer 2.5 → 4) — adulte 60+, dissociations APP / Alzheimer / vieillissement normal
4. **Examath** (passer 4 → 4.5) — ajouter profil mixte DYS+dyscalculie + anxiété détaillée
5. **Exalang 5-8** (passer 3.5 → 4) — déployer marqueurs précoces dyslexie

Les autres modules sont suffisants pour démarrer la beta. Les feedbacks ortho via `bilan_references` permettront de les calibrer post-launch sur des cas concrets.

---

## Risques en l'état (sans enrichissement)

Si la beta tourne avec les modules actuels :

- ⚠️ Une ortho qui fait un **bilan de déglutition adulte post-AVC** aura un draft générique inutilisable.
- ⚠️ Une ortho qui fait une **MoCA chez un senior avec MCI** aura un draft sans discrimination MCI vs vieillissement normal.
- ⚠️ Une ortho qui fait une **BETL pour suspicion d'aphasie progressive primaire** aura un draft qui ne mentionnera pas l'APP comme hypothèse à explorer.

Recommandation : **enrichir les 3 modules rouges AVANT le démarrage beta**, ou alors signaler explicitement aux beta testeuses qu'elles ne devraient PAS utiliser ces 3 tests en priorité.

---

## Plan d'action

| Étape | Action |
|---|---|
| 1 | Migration `bilan_references` + `ortho_feedbacks` (collecte des corrections orthos) |
| 2 | Écran feedback post-génération (capture qualitative des corrections sur le draft) |
| 3 | Few-shot injection conditionnelle (si exemples validés disponibles pour le test_type) |
| 4 | Enrichissement modules **OMF, MoCA, BETL** en priorité, puis Examath, puis Exalang 5-8 |
| 5 | Guide beta testeurs pour cadrer les retours utiles |
