# Audit exhaustif — Generation de CRBO par bilan

**Date** : 2026-05-24
**Methode** : lecture seule du codebase, cross-check registry / modules prompt / forms / route API / export Word, advisors structurels.
**Perimetre** : 22 bilans declares dans le registry (+ 'Autre' fallback).
**Important** : aucune reference au kanban dans ce rapport — il a ete supprime. Le statut CRBO est gere par la colonne `crbos.statut` (a_rediger / a_relire / termine) et affiche dans la liste historique du dashboard.

---

## 🎯 Tableau de bord

| Bilan | Route | Module Prompt | Formulaire | Word | Qualite prompt | Risques |
|-------|-------|---------------|------------|------|----------------|---------|
| **MoCA** | ✅ generate-crbo | ✅ moca.ts | ✅ MocaScoresInput | ✅ renderer 'moca' dedie | 4/5 | Interdiction diagnostique sevère (Alzheimer/MCI) bien cadree, complexite redactionnelle elevee |
| **BETL** | ✅ generate-crbo | ✅ betl.ts | ✅ BetlScoresInput | ✅ standard | 4/5 | Seuils stratifies (age × NSC × 8 epreuves), peu de few-shots |
| **PREDIMEM** | ✅ generate-crbo | ✅ predimem.ts | ✅ PredimemScoresInput | ✅ standard | 5/5 | Stratification 5 tranches × 3 NSC = 15 cellules de seuils ; zone HappyNeuron auto-reportee form->Claude OK |
| **PrediFex** | ✅ generate-crbo | ✅ predifex.ts | ✅ PrediFexScoresInput | ✅ standard | 5/5 | NSC1 deconseille (warning UI present) |
| **PrediLac** | ✅ generate-crbo | ⚠️ predilac.ts | ✅ PrediLacScoresInput | ✅ standard | 3.5/5 | **`[A COMPLETER PAR LAURIE]` sur liste epreuves officielles** (manuel scanne non OCR-able) |
| **BECD** | ✅ generate-crbo | ✅ becd.ts | ✅ BecdScoresInput | ✅ standard | 4/5 | Pas de seuils percentile (dysarthrie n'en utilise pas) ; classification Darley sans risque hallucinatoire si form structure bien |
| **BIA** | ✅ generate-crbo | ✅ bia.ts | ✅ BiaScoresInput | ✅ standard | 4/5 | Pas de seuils percentile (aphasie : scores /100 par module) ; **localStorage absent** sur le form |
| **EVALEO 6-15** | ✅ generate-crbo | ✅ evaleo-6-15.ts | ✅ Evaleo615ScoresInput | ✅ standard | 5/5 | Module de reference (410 lignes, ~30 few-shots, grille 6 zones Laurie integree) |
| **Exalang 3-6** | ✅ generate-crbo | ✅ exalang-3-6.ts | ✅ Exalang36ScoresInput | ✅ standard | 5/5 | 5 profils types (alerte TSA explicite) |
| **Exalang 5-8** | ✅ generate-crbo | ✅ exalang-5-8.ts | ❌ formPath=null (textarea) | ✅ standard | 5/5 | Form retire 2026-05-21 (decision Laurie) — saisie libre |
| **Exalang 8-11** | ✅ generate-crbo | ✅ exalang-8-11.ts | ❌ formPath=null (textarea) | ✅ standard | **5/5 etalon** | **NE PAS TOUCHER** — valide par Laurie comme reference qualite |
| **Exalang 11-15** | ✅ generate-crbo | ✅ exalang-11-15.ts | ❌ formPath=null (textarea) | ✅ standard | **5/5 etalon** | **NE PAS TOUCHER** — valide par Laurie |
| **Exalang Lyfac** | ✅ generate-crbo | ✅ exalang-lyfac.ts | ✅ ExalangLyfacScoresInput | ✅ standard | 4.5/5 | Leximetrie (vitesse mots/min) mise en avant — critere amenagements lycee/fac |
| **EVALO 2-6** | ✅ generate-crbo | ✅ evalo-2-6.ts | ✅ Evalo26ScoresInput | ✅ standard | 5/5 | **Alerte TSA automatique** dans le form si Communication precoce + Interaction ludique = Difficulte/Severe |
| **ELO** | ✅ generate-crbo | ✅ elo.ts | ❌ textarea | ✅ standard | 5/5 | 4 profils types |
| **BALE** | ✅ generate-crbo | ✅ bale.ts | ❌ textarea | ✅ standard | 5/5 | 3 profils dys (phono/surface/mixte) |
| **N-EEL** | ✅ generate-crbo | ✅ n-eel.ts | ❌ textarea | ✅ standard | 5/5 | 4 profils TDL |
| **BILO** | ✅ generate-crbo | ✅ bilo.ts | ❌ textarea | ✅ standard | 5/5 | 4 profils TDL retard simple → severe |
| **BELEC** | ✅ generate-crbo | ✅ belec.ts | ❌ textarea | ✅ standard | 5/5 | Matrice frequence × regularite |
| **Examath** | ✅ generate-crbo | ✅ examath.ts | ✅ ExamathScoresInput | ✅ standard | 5/5 | Dyscalculie / comorbidite / anxiete = 4 profils |
| **OMF / Deglutition** | ✅ generate-crbo | ✅ omf-deglutition.ts | ❌ textarea | ✅ standard | 3/5 | Pas de seuils chiffres (observation qualitative pure) ; conforme a la nature du bilan |
| **B-CM** (math enfant) | ✅ generate-bilan-math | ✅ bilan-math-crbo.ts | ✅ BilanMathForm (matrice 2D) | ✅ renderer 'math' dedie | n/a | Parcours dedie hors flux CRBO standard, OK |
| **B-CMado** (math ado) | ✅ generate-bilan-math | ✅ bilan-math-crbo.ts (partage) | ✅ BilanMathForm (matrice 2D) | ✅ renderer 'math' dedie | n/a | Idem B-CM |
| **'Autre'** | ⚠️ generate-crbo | ❌ pas de module | ❌ textarea | ⚠️ standard sans groupes | n/a | **Fallback prompt generique sans referentiel** (cf. §2) |

---

## 1. Inventaire des bilans declares

`lib/types.ts` → `TESTS_OPTIONS` : 21 entrees (+ 'Autre' = 22)
`lib/types.ts` → `TESTS_SCREENING_OPTIONS` : 1 entree (`MoCA`)
`lib/bilan-registry.ts` → `BILAN_REGISTRY` : 22 entrees (TESTS_OPTIONS sauf 'Autre' + B-CM + B-CMado)

**Asymetries detectees** :
- `'Autre'` ∈ TESTS_OPTIONS mais ∉ registry → fallback prompt generique
- `'B-CM'` et `'B-CMado'` ∈ registry mais ∉ TESTS_OPTIONS → normal (parcours dedie via UI math, pas via le selecteur de tests standard)
- `'Exalang 5-8'` ∈ registry avec `formPath=null` → composant `Exalang58ScoresInput.tsx` existe (170+ lignes) mais retire du registry actif depuis 2026-05-21 sur demande utilisateur. Code mort a archiver ou re-brancher (decision produit).

---

## 2. Audit du routing `buildSystemPrompt()`

Fichier : `lib/prompts/system-base.ts:571`

```ts
export function buildSystemPrompt(tests: string[], phase, format, scores) {
  const activeModules = tests
    .map((t) => getTestModule(t))
    .filter((m): m is NonNullable<typeof m> => m !== null)
  // ...
  if (activeModules.length === 0) return SYSTEM_BASE + phaseSuffix + formatSuffix + knowledgeBlock
  // sinon concatenation des referentiels par test + bloc multi-test si >=2
}
```

**Comportement** :
- Pour chaque `test_utilise[i]`, lookup dans `TEST_REGISTRY` via `getTestModule(t)` (`lib/prompts/tests/index.ts`)
- Si retourne null (test inconnu), il est silencieusement ignore
- Si TOUS retournent null → prompt generique (SYSTEM_BASE seul) avec scores + format mais sans nomenclature des domaines obligatoires

**Routes par bilan** : aucun mapping hardcode `if (test === 'X')` — registry-driven via le mapping `TEST_REGISTRY` dans `tests/index.ts`. ✅ Architecture propre.

**Bilans sans route** : **uniquement `'Autre'`** (21 tests TESTS_OPTIONS hors 'Autre' + 2 math ont tous une entree).

**Risque pratique 'Autre'** :
- CRBO genere sans nomenclature de domaines → Claude invente les noms de groupes → graphique Word desorganise + tableaux mal regroupes
- Pas de few-shots specifiques → formulations potentiellement generiques
- Mitigation possible : afficher un toast UI "Bilan generique selectionne, qualite reduite" ou retirer 'Autre' du selecteur

**Routes orphelines** : aucune (tous les modules dans `tests/index.ts` ont leur entree dans le registry et le `TESTS_OPTIONS`).

---

## 3. Audit des modules prompt

Detail par bilan (cf. tableau de bord §0 pour les scores). Points saillants :

### Modules de reference (5/5)
- **Exalang 8-11**, **Exalang 11-15** : etalon, valides par Laurie, **interdiction de modifier**
- **EVALEO 6-15** : 410 lignes, grille 6 zones explicitee, ~30 few-shots, transposition CRBO complete
- **Exalang 3-6**, **EVALO 2-6** : 5 profils types chacun, alertes TSA correctement cadrees
- **Examath** : 4 profils dyscalculie (pure, secondaire, comorbide, anxieuse)
- **BALE**, **BELEC**, **BILO**, **N-EEL**, **ELO** : 3-4 profils types chacun, seuils explicites
- **PREDIMEM** (270 lignes), **PrediFex** (221 lignes) : 6 profils chacun, stratification age × NSC, regles cliniques absolues exhaustives

### Modules adultes / aphasie (4/5)
- **MoCA**, **BETL**, **BECD**, **BIA**, **Exalang Lyfac** : structure clinique solide, peu/pas de seuils percentile (conforme a la nature des tests : MoCA = /30, dysarthrie = qualitative, aphasie = /100 par module). Pas de risque hallucinatoire majeur si le form contraint bien la saisie.

### Modules a completer
- **PrediLac** : `[A COMPLETER PAR LAURIE]` explicite sur la liste des epreuves officielles + leurs scores max. Le manuel PDF est scanne (image-based, non OCR-able). Le module utilise le framework commun PREDI (stratification age × NSC, 5 zones HappyNeuron, seuil M-1.5σ) en attendant. **A completer manuellement depuis le manuel papier — bloquant si on veut une qualite 5/5 sur ce bilan.**

### Modules a la fonction speciale
- **OMF / Deglutition** (3/5) : 141 lignes, observation qualitative pure, pas de seuils chiffres. C'est CONFORME a la nature du bilan (la deglutition ne se cote pas en percentile). Note descriptive grille 6 zones uniquement.

### Zones `[ORTHO:...]` vides dans le repo entier
Aucune detectee dans les 21 modules prompt. Le rapport precedent (audit math 2026-05-22) signalait un hot spot dans `tool-schema.ts` qui force le format percentile a tous les bilans — c'est toujours present mais MoCA et B-CM contournent en mettant `percentile=""`. Non bloquant.

---

## 4. Audit des formulaires de saisie

13 forms dedies + 1 form math (`BilanMathForm.tsx` partage par B-CM et B-CMado).

### Cross-check form ↔ module prompt
**Aucune divergence de naming detectee** entre epreuves form et epreuves prompt sur les 13 forms audites. Les noms sont copies verbatim depuis les cahiers officiels :
- BETL : 8 epreuves I-VIII ✅
- EVALEO 6-15 : ~58 epreuves ✅
- Examath : 6 modules × 18 epreuves ✅
- BIA : 4 modules × 18 subtests ✅
- EVALO 2-6 : 5 sections × 10 epreuves ✅
- MoCA : 7 domaines ✅
- PREDIMEM : 11 epreuves (e01-e11) ✅
- PrediFex : 10 epreuves ✅
- BECD : 6 domaines ✅
- Exalang 3-6 : 9-10 epreuves ✅
- Exalang Lyfac : 15 epreuves ✅
- PrediLac : 8 epreuves (a valider contre manuel)

### Types de champs
- **Percentile-based** (Exalang 3-6, Exalang Lyfac, EVALEO 6-15, EVALO 2-6, Examath) : dropdown 8 zones + score_brut text + non_passee checkbox. ✅ Coherent avec `scoreSchema='percentile'`.
- **MoCA** : score brut /max par sous-domaine + accordeon regles + total /30 auto. ✅ Coherent avec `scoreSchema='moca'`.
- **HappyNeuron stratifie** (PREDIMEM, PrediFex, PrediLac, BETL) : zone HappyNeuron (dropdown 5 couleurs) + score brut + temps + observation. ✅ Coherent avec leur logique propre.
- **BIA** : score text decimal + observation textarea par subtest + totaux par module.
- **BECD** : dropdown severite + pourcentages SI/TPI + champs perceptifs.
- **B-CM / B-CMado** : matrice 2D × pastilles qualitatives + notes + iaText par epreuve. ✅ Coherent avec `scoreSchema='pastille'`.

### Validation min/max
- ✅ BETL, MoCA, PREDIMEM : clamp 0-max strict
- ⚠️ Examath, BIA : score text libre, pas de clamping numerique explicite (relies on dropdown)
- ⚠️ BilanMathForm : pas de validation numerique (pastilles qualitatives uniquement)

### Tooltip / aide par epreuve
- ✅ Excellents : BETL (hint + accordeon regles + interpretation clinique), PREDIMEM (hint per subtest + 6 profils), MoCA (accordeons par domaine)
- ✅ Bons : EVALEO, Exalang Lyfac, BECD, EVALO 2-6, Examath
- ⚠️ Minimaux : Exalang 3-6 (hint par epreuve mais pas de regle d'interpretation deployee), PrediLac (bandeau avertissement seul)

### Dictee vocale Whisper (`MicButton`)
- ✅ Per-epreuve : MoCA, PREDIMEM, BilanMathForm
- ⚠️ Notes globales uniquement : tous les autres (Examath, BIA, EVALO 2-6, EVALEO 6-15, Exalang 3-6, Exalang Lyfac, PrediFex, BECD, PrediLac, BETL)

Impact : ergonomie sous-optimale sur 10 forms (l'ortho doit dicter en bloc a la fin au lieu d'observation par epreuve). Pas un bug fonctionnel.

### localStorage / auto-save
- ✅ MoCA, BilanMathForm, ExamathScoresInput : localStorage + debounce 400ms
- ⚠️ Etat React seul (perte au refresh) : tous les autres forms (BIA, EVALO 2-6, BETL, EVALEO 6-15, Exalang 3-6, Exalang Lyfac, PREDIMEM, PrediFex, BECD, PrediLac)

**RISQUE** : ortho qui ferme l'onglet ou refresh sans avoir cliquer "Generer" perd tout. Le brouillon global `nouveau-crbo/page.tsx` sauve `formData.resultats_manuels` (le bloc texte serialise) toutes les Xs, mais les inputs intermediaires des forms ScoresInput (avant submit) ne sont pas dans `formData`. Donc partial. A traiter comme un fix d'infrastructure transverse (hors regle d'isolation bilan-par-bilan).

---

## 5. Audit de la route `app/api/generate-crbo/route.ts`

Fichier : 732 lignes.

| Critere | Etat | Detail |
|---------|------|--------|
| Routing par bilan | ✅ registry-driven | `buildSystemPrompt(tests)` map sur `getTestModule`, fallback SYSTEM_BASE si vide. Aucun hardcode test-specifique. |
| Anonymisation RGPD | ✅ exhaustive | `anonymize(formData)` + `buildScrubList()` + `scrubText()` + `scrubObjectStrings()` (lignes 275-314). DDN jamais transmise (age calendaire calcule `computePatientAge()`). Anonymisation aussi sur `extracted` (phase 2), `edits` (commentaires ortho), `bilan_precedent_structure`. |
| Prompt caching Anthropic | ✅ actif | `cache_control: { type: 'ephemeral' }` sur systemBlocks (lignes 442/447/454). Bloc few-shot en cache separe pour varier par patient. ~80% economie estimee. |
| Gestion erreur | ✅ robuste | `withRetry()` 3 tentatives sur 429/5xx/reseau. AbortController 90s/180s. `handleAnthropicError()` mapping detaille. Fallback 503 si Supabase down. Logging PII-scrubbed. |
| Modele Anthropic | ✅ Sonnet 4.6 | `claude-sonnet-4-6` (lignes 503, 608). Conforme a la consigne globale (cf. memoire feedback). |
| Quota mensuel | ✅ server-side | `get_monthly_crbo_count` RPC avant Claude, log abuse_signal si depassement, 429. |
| Sauvegarde DB CRBO | ❌ pas dans la route | Design 2-phases (extract + synthesize) volontairement client-only pour le commit DB. Le formulaire `/nouveau-crbo` fait `supabase.from('crbos').insert()` apres reception. |
| Sauvegarde patient | ❌ pas dans la route | Idem. Le formulaire `nouveau-crbo/resultats/page.tsx` fait l'insert/update patient autonome (lignes 434, 445). |
| Statut CRBO post-generation | ❌ pas dans la route | Le client positionne `statut='a_relire'` a l'insert. Pas de kanban. |

---

## 6. Audit de l'export Word

**Fichiers** :
- `lib/word-export.ts` (1453 lignes) — renderer standard + MoCA
- `lib/bilan-math-word-export.ts` (497 lignes) — renderer math dedie

**Detection par bilan** :
```ts
const isMocaOnly = testList.length === 1 && testList[0] === 'MoCA'
```
**5 occurrences** de `isMocaOnly` dans word-export.ts (l'audit 2026-05-22 mentionnait 23 — corrige). Seul cas hardcode actuel. Pas de `testName === 'X'` ailleurs (architecture propre).

**Graphique HappyNeuron** :
- ✅ Genere pour tous les bilans `wordRenderer='standard'` SAUF si `isMocaOnly`
- `generateGroupedBarChart()` (ligne 744) → canvas → PNG → injection docx
- Fallback texte si echec generation

**Tableaux colores — grille 6 zones Laurie** :
- ✅ Conformes : array SEUILS (lignes 97-104) avec P76+ Excellent / P50-75 Moy haute / P26-49 Moy basse / P11-25 Fragilite / P6-10 Difficulte / P1-5 Difficulte severe
- ✅ Shading Word hex + CSS hex + textColor blanc/noir
- ✅ Normalisation legacy interpretations (lignes 128-150)
- ✅ Applique systematiquement via `seuilFor(percentile_value)` (ligne 106)

**MoCA dedie** :
- Mini-tableaux par epreuve + bandeau Total /30 severite (lignes 830-942)
- Pas de graphique percentile (n'a pas de sens)
- 3 zones : ratio 80%+ / 50-80% / <50%

**B-CM / B-CMado dedie** (`bilan-math-word-export.ts`) :
- Grille 2D coloriee par cellule (niveau × critere)
- 4 pastilles : vert / orange / rouge / gris
- Pas de tableau percentile

**Format synthetique vs complet** : `points_forts` / `difficultes_identifiees` / `axes_therapeutiques` supprimes du rendu en mode synthetique (ligne 304).

**Risques** :
- ⚠️ Migration `isMocaOnly` → `wordRenderer` du registry pas faite (hot spot connu, audit 2026-05-22). Si on ajoute un autre bilan a wordRenderer='moca' (ex. MMSE), il faudra etendre la detection. Non bloquant aujourd'hui.

---

## 7. Synthese des risques par priorite

### 🔴 P0 — Bloquant
1. **Aucun.** Toutes les routes existent, tous les modules sont presents, aucun bilan ne plante en generation.

### 🟠 P1 — Qualite degradee
1. **PrediLac** : `[A COMPLETER PAR LAURIE]` sur liste epreuves + scores max officiels. Le framework PREDI generique fonctionne mais le bilan n'a pas la richesse des autres modules 5/5.
   - **Action** : Laurie a fournir les noms officiels d'epreuves et leurs scores max depuis le manuel papier. Une fois fait, mise a jour `lib/prompts/tests/predilac.ts` uniquement (regle d'isolation respectee).

2. **Bilan 'Autre'** : fallback prompt generique sans nomenclature de domaines obligatoires → graphique Word desordonne + tableaux mal regroupes possibles.
   - **Action recommandee** : soit retirer 'Autre' de `TESTS_OPTIONS` (`lib/types.ts:189`), soit afficher un warning UI explicite "qualite reduite si aucun bilan correspondant n'est selectionne".

### 🟡 P2 — Ergonomie sous-optimale
3. **localStorage absent sur 10 forms** (BIA, EVALO 2-6, BETL, EVALEO 6-15, Exalang 3-6, Exalang Lyfac, PREDIMEM, PrediFex, BECD, PrediLac). Refresh = perte des inputs intermediaires des forms ScoresInput.
   - **Action transverse** (hors regle d'isolation) : ajouter un wrapper `useFormPersist(key, state)` dans `lib/hooks/`. Touche tous les forms mais n'est pas une modification "specifique a un bilan" — c'est une feature infrastructure.

4. **Dictee vocale Whisper per-epreuve absente sur 10 forms** (idem).
   - **Action** : etendre `MicButton` per-input. Pareil transverse.

### 🟢 P3 — Refacto qualitative (hot spots heritage)
5. **`lib/word-export.ts:313`** : `isMocaOnly` toujours hardcode (5 occurrences). Migrer vers `wordRenderer` du registry.
6. **`lib/prompts/system-base.ts`** : contient encore des regles specifiques langage ecrit (dyslexie, ordonnancement A/B/C Exalang, classement RAN) imposees a tous. A extraire dans `lib/prompts/rules/<nom>.ts` que chaque module test inclut explicitement.
7. **`lib/prompts/tool-schema.ts`** : force le format percentile a tous les bilans (MoCA et B-CM contournent en `percentile=""`). A splitter en `tool-schema-percentile` / `tool-schema-moca` / `tool-schema-math`.

Ces 3 hot spots etaient deja listes dans `lib/bilan-registry.ts` en tete de fichier (audit 2026-05-22). Statut inchange.

### 🔵 P4 — Code mort / nettoyage
8. **`components/forms/Exalang58ScoresInput.tsx`** : existe (170+ lignes) mais `formPath=null` dans le registry depuis 2026-05-21. Soit re-brancher, soit archiver/supprimer.

---

## 8. Conclusion

**Verdict global** : **architecture solide, generation fiable sur 21/22 bilans listes.**

- Registry-driven : aucun hardcode test-specifique dans la route API ni le buildSystemPrompt
- Anonymisation RGPD exhaustive
- Prompt caching actif
- Word export adapte par renderer (standard/moca/math)
- Modules prompt majoritairement 4-5/5 avec few-shots
- Forms generalement coherents avec les modules prompt (zero divergence de naming detectee)

**Points d'attention** :
- 1 bilan a completer manuellement (PrediLac — bloqueur : manuel scanne)
- 1 bilan generique 'Autre' = qualite reduite (decision UX a prendre)
- 10 forms sans localStorage (risque perte de donnees au refresh)
- 3 hot spots heritage (system-base, tool-schema, word-export) connus et non bloquants

**Aucune correction obligatoire par bilan individuel n'a ete identifiee** au-dela des points P1 listes. La phase 9 de corrections se limite donc a :
- Decision UX sur 'Autre' (retirer ou warning)
- Ouverture d'une issue pour Laurie sur PrediLac

Les fixes transverses (localStorage, Whisper per-epreuve, hot spots) sortent du perimetre "modifications specifiques a UN bilan" impose par la regle d'isolation de CLAUDE.md. Ils meritent leur PR propre.
