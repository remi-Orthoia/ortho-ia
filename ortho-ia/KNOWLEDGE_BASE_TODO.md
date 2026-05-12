# KNOWLEDGE BASE — Plan d'enrichissement

Ce fichier est l'aide-mémoire pour les sessions avec Laurie (et les autres
orthos beta). Il liste, par zone de la knowledge base et par type de bilan,
ce qui doit être collecté / validé / enrichi pour que la qualité des CRBO
générés monte d'un cran.

À chaque session : on imprime cette liste, on coche au fur et à mesure, et
ce qui en sort va directement dans `lib/prompts/knowledge-base.ts` ou en
base `bilan_references` (pour les few-shots).

---

## 1. Règles diagnostiques par profil — à valider et compléter

### EXALANG (lecture / écrit / oral)

#### `dyslexie_phonologique`
- [ ] Critères validés par Laurie ? (P≤10 non-mots + lecture mots normaux ou proches)
- [ ] Sévérité validée ? (légère P10-16, modérée P5-9, sévère P2-4, très sévère <P2)
- [ ] Formulation diagnostique validée mot pour mot ?
- [ ] Points forts typiques à ajouter ?
- [ ] **Observations types** : on a une phrase template, mais on a besoin de
      3-5 reformulations variées pour éviter que tous les CRBOs sortent
      identiques. Demander à Laurie 3-5 exemples.
- [ ] Axes thérapeutiques typiques à ajouter (4 max, libellés Laurie) ?
- [ ] PAP types à ajouter (6 max, libellés Laurie) ?

#### `dyslexie_adressage` (de surface)
- [ ] Critères validés ? (P≤10 mots irréguliers + P≥25 non-mots)
- [ ] Sévérité validée ?
- [ ] Formulation diagnostique validée ?
- [ ] **3-5 observations types variées** à collecter (régularisations, lenteur,
      lecture phonétique, ortho phonétique...).
- [ ] Axes thérapeutiques + PAP types.

#### `dyslexie_mixte`
- [ ] Critères validés ? (les deux voies ≤P10)
- [ ] Sévérité validée ?
- [ ] **3-5 observations types** (tableau plus massif).
- [ ] Axes thérapeutiques + PAP types.

#### `dyslexie_compensee`
- [ ] Critères validés ? (antécédents documentés + scores remontés mais lenteur
      / coût attentionnel persistant)
- [ ] **3-5 observations types** spécifiques à la compensation (autocorrections,
      lecture maintenue mais coûteuse, fatigabilité signalée…).
- [ ] Comment Laurie formule la "forme compensée" dans le diagnostic ?

#### `profil_normal`
- [ ] Quelle formulation Laurie utilise quand le bilan ne pose pas de diagnostic ?
      ("Bilan ne met pas en évidence…" vs "Pas de trouble identifié…" vs autre ?)
- [ ] À quel seuil cesse-t-elle de dire "fragilité" pour passer à "norme" ?
      (Aujourd'hui P25 = fragilité ; mais en pratique, ≥P30 = normal ?)
- [ ] **Recommandations si profil normal** : pas de prise en charge ? Vigilance ?
      Conseils prévention ? Formulation à fixer.

#### `tdl` (trouble développemental du langage)
- [ ] Critères validés ? (déficits multiples en oral, sans cause sensorielle
      ni déficit cognitif global)
- [ ] Sévérité validée ?
- [ ] **3-5 observations types** (lexique, morphosyntaxe, compréhension, narration…).
- [ ] Axes thérapeutiques + PAP types.
- [ ] Diagnostic différentiel avec retard simple : comment Laurie distingue ?

#### Profils MANQUANTS à créer
- [ ] **TDA(H) co-morbide diagnostiqué ailleurs** : comment Laurie le mentionne
      en fin de diagnostic ? Y a-t-il des observations spécifiques à intégrer ?
- [ ] **Profil hétérogène, plusieurs petites fragilités** sans tableau clair :
      formulation Laurie ?
- [ ] **Bégaiement** : critères + formulation diagnostique. Bilan oral, scores
      moins déterminants, observation clinique prime.
- [ ] **Trouble de la communication sociale** (sans déficit langage formel) :
      profil + formulation.
- [ ] **Adulte aphasique post-AVC** : profil dédié à ajouter quand on aura
      des cas de référence.
- [ ] **Adulte / senior MCI** : profil léger cognitif (MoCA + BETL) à intégrer.

### EXAMATH (mathématiques)

#### `dyscalculie_developpementale`
- [ ] Critères validés ? (atteinte sens du nombre : dénombrement, subitizing,
      ligne numérique, comparaison de grandeurs ≤P10)
- [ ] Sévérité validée ?
- [ ] Formulation diagnostique validée ?
- [ ] **3-5 observations types** (manipulation du nombre, comptage, estimation,
      sens des opérations…).
- [ ] Axes thérapeutiques + PAP types.

#### `difficultes_arithmetiques`
- [ ] Quand Laurie pose ce diagnostic vs "pas de trouble" ?
      Critère plancher sur les épreuves de procédures ?
- [ ] **3-5 observations types** (faits numériques, procédures de calcul,
      résolution de problèmes…).
- [ ] Recommandations / axes thérapeutiques.

#### `anxiete_maths`
- [ ] Critères validés ? (variabilité chronométré vs non, évitement signalé)
- [ ] Comment Laurie formule cette dimension dans le diagnostic ?
      (En contexte / en plus d'un autre diagnostic / sans diagnostic ?)
- [ ] Recommandations spécifiques (suivi psy ? aménagements anti-pression ?).

#### Profils MANQUANTS à créer pour Examath
- [ ] **Dyscalculie + dyslexie comorbide** (très fréquent — 30-40% des dyscalculies)
- [ ] **Dyscalculie spatiale** vs **dyscalculie symbolique** : distinction utile ?
- [ ] **Retard simple de mathématiques** (sans dyscalculie) : critères de
      distinction avec la dyscalculie.

---

## 2. Style Laurie — à collecter et valider

### `formulations_types` (formulations à privilégier)
On a 9 formulations capturées. Cible : **30+ formulations** pour éviter la
répétition entre CRBOs.

- [ ] Liste à compléter avec Laurie : faire défiler 10 CRBOs récents et
      surligner toutes les formulations récurrentes / signature.
- [ ] Regrouper par section : observations / diagnostic / projet thérapeutique / aménagements.
- [ ] Versions variées pour chaque "intention" (dire qu'un score est limite,
      qu'une compensation est efficace, qu'une difficulté impacte la
      scolarité…).

### `mots_a_eviter`
On a 12 mots/expressions. À compléter avec ce que Laurie ne supporte PAS
de lire dans un CRBO.

- [ ] Formulations IA fréquentes à bannir (Laurie en repère vite — elle
      sait quoi).
- [ ] Tics de l'ancienne IA qu'on a corrigés mais qui peuvent revenir
      (ex : "il faudrait", "on recommande", "pathologique", "sévèrement
      atteint", "grave").
- [ ] Anglicismes / abréviations interdits.

### `structure_observations` (longueur selon performance)
On a la règle 1/2/3-4 phrases. À valider :

- [ ] Confirme-t-on les seuils ? (Score normal = 1 phrase ; limite = 2 ;
      déficitaire = 3-4)
- [ ] La phrase d'impact scolaire est-elle systématique ?
- [ ] Comment Laurie ouvre / clôt un commentaire de domaine ?
      (Pattern type : verbe d'observation + nuance + conséquence scolaire ?)

### Templates à ajouter
- [ ] **Template d'anamnèse** par profil (parents séparés, ATCD familiaux,
      hospitalisations multiples, scolarité atypique…) — sans hallucination.
- [ ] **Template de diagnostic compensé** : la nuance "forme compensée" est-elle
      systématique quand les scores remontent ?
- [ ] **Template de projet thérapeutique synthétique** (2 phrases) : objectifs
      les plus fréquents à lister.

---

## 3. Few-shots manquants par profil (table `bilan_references`)

L'idée : 2 cas de référence MINIMUM par profil. La fonction `getFewShots`
les remontera automatiquement dès qu'ils sont en base.

### Exalang 8-11
- [ ] 2 cas dyslexie phonologique légère (CE2)
- [ ] 2 cas dyslexie phonologique modérée (CE2/CM1)
- [ ] 2 cas dyslexie phonologique sévère (CM1/CM2)
- [ ] 2 cas dyslexie de surface (rares, mais bien représentatifs)
- [ ] 2 cas dyslexie mixte (CM1/CM2)
- [ ] 2 cas dyslexie compensée (CM2/6ème)
- [ ] 2 cas profil normal (CP/CE1, faux positifs initiaux)
- [ ] 2 cas TDL (CE1/CE2)
- [ ] 1 cas avec TDAH comorbide diagnostiqué (mention type)

### Exalang 11-15
- [ ] 2 cas dyslexie modérée collège
- [ ] 2 cas dyslexie compensée collège
- [ ] 1 cas TDL ado

### Examath 8-15
- [ ] 2 cas dyscalculie développementale CM/6ème
- [ ] 2 cas difficultés arithmétiques sans dyscalculie
- [ ] 1 cas dyscalculie + dyslexie comorbide

### EVALEO 6-15
- [ ] 2 cas dyslexie cycle 3
- [ ] 1 cas trouble du langage écrit + TDA

### Autres (bas volume, à voir avec usage)
- [ ] 1 cas MoCA (MCI léger)
- [ ] 1 cas BETL (post-AVC ou démence sémantique)
- [ ] 1 cas OMF (déglutition primaire persistante)

**Workflow de collecte** : voir `GUIDE_BETA_TESTERS.md` section 2. Pour
chaque cas, l'ortho envoie un ZIP {PDF résultats anonymisé + notes anamnèse
brutes + CRBO final.docx}. Rémi (ou un script) insère en base
`bilan_references` avec `qualite_score = 5`, `valide_par` renseigné.

---

## 4. Règles diagnostiques à valider transverse

### Seuils numériques
- [ ] Le seuil ≤P10 pour dire "atteinte" est-il bon, ou Laurie utilise P15 ?
- [ ] À partir de quel percentile Laurie écrit "préservé" vs "limite" ?
- [ ] Quand une seule épreuve est ≤P10 et tout le reste normal — fragilité
      ponctuelle ou pas de diagnostic ?

### Détection mécanique de profil — limites actuelles
La fonction `getKnowledgeForTest` détecte aujourd'hui :

- Dyslexie phonologique / surface / mixte → via `lecture non-mots` / `mots irréguliers`
- Dyscalculie développementale → via `sens du nombre`
- Profil normal → si toutes les épreuves de langage écrit ≥P25

Ce qu'elle NE détecte PAS encore (à compléter) :

- [ ] **TDL** depuis les scores oraux (lexique + morphosyntaxe + compréhension
      orale).
- [ ] **Dyscalculie + dyslexie comorbide** depuis Examath + Exalang dans le
      même bilan.
- [ ] **Forme compensée** depuis l'historique d'un bilan précédent (existe
      déjà dans la DB via `bilan_precedent_*`).
- [ ] **TDA(H) suspecté** depuis fluences + flexibilité + inhibition ≤P10
      (on doit suggérer d'orienter vers neuropsy, pas poser le diagnostic).

### Sévérité globale (pondération)
- [ ] Quand Laurie écrit "sévère" vs "modéré" : c'est le percentile le plus
      bas, ou le nombre d'épreuves atteintes, ou le retentissement scolaire ?
- [ ] Faut-il que `getKnowledgeForTest` pondère la sévérité par le NOMBRE
      d'épreuves atteintes (et pas seulement le percentile minimum) ?

---

## 5. Comment alimenter ce fichier

Workflow concret :

1. **Session avec Laurie** (1h max, hebdomadaire) :
   - On prend 1-2 cas qu'elle a corrigé via le bandeau feedback.
   - On regarde quels champs de la knowledge base auraient évité la correction.
   - On annote les TODO ci-dessus avec ce qu'on doit ajouter / changer.

2. **Édition entre sessions** (Rémi) :
   - On édite `lib/prompts/knowledge-base.ts` directement avec les
     formulations validées.
   - On insère les cas de référence en base `bilan_references` (qualité 5).
   - Pour chaque modif : commit + push, déploiement immédiat (Vercel).

3. **Validation** :
   - Après chaque enrichissement, on régénère un CRBO du même type
     (script `scripts/regen-chandra.ts` ou équivalent) et on vérifie que
     la sortie est plus proche de ce que Laurie aurait écrit.

4. **Décrochage** :
   - Si une modif fait régresser un autre cas, on log dans
     `KNOWLEDGE_BASE_TODO.md` section "Régressions à corriger" (à créer
     quand on en croisera une).

---

## 6. État au démarrage (2026-05-12)

- ✅ Architecture en place : `lib/prompts/knowledge-base.ts` créé, câblé
  dans `buildSystemPrompt` (phase synthèse), profil détecté depuis les
  scores réels.
- ✅ Few-shots : table `bilan_references` + loader `getFewShots`. Vide en
  base — 0 exemple injecté pour l'instant.
- ✅ Style Laurie : 9 formulations capturées initialement (extraites du
  système-base). À enrichir massivement.
- ⏳ À faire en priorité : **session 1 avec Laurie** sur 2-3 cas Exalang
  8-11 récents pour valider les formulations / sévérités / observations
  types.

---

*Dernière édition : 2026-05-12 — création du squelette.*
