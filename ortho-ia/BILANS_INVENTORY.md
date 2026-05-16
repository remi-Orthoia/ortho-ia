# Inventaire des bilans — sources officielles vs modules ortho.ia

État au 2026-05-16 — refresh après livraison du chantier preview/édition et de PREDIMEM (pilote).
Croisement entre `docs/Bilans Sources/` et `lib/prompts/tests/` + composants `components/forms/`.

## Légende statut

- ✅ **OK validé** — déjà au niveau cible, NE PAS TOUCHER
- 🟢 **Complet à enrichir** — module dense, peut bénéficier d'un passage sources
- 🟡 **Squelette à reprendre** — module court (≤ 130 lignes), à reconstruire depuis sources
- 🔴 **À créer** — sources présentes, module absent
- ⚫ **Pas de source** — module présent sans manuel dans `docs/`, on laisse en l'état

## Bilans en chantier (chantier en cours — autonomie totale)

Ordre d'exécution décidé : matériel sources le plus solide d'abord, fréquence clinique
ensuite, adulte/senior à la fin.

| # | Bilan | Sources | Module actuel | Form UI | Statut cible | Ordre |
|---|---|---|---|---|---|---|
| 1 | **Examath 8-15** | manuel (2.5 Mo) + cahier (315 Ko) | `examath.ts` (180 l.) | ❌ | 🟢 enrichi + form UI guidé + 5 zones | **1er** |
| 2 | **EVALEO 6-15** | livret cotation (27 Mo) + cahier LO (1.3 Mo) + cahier LE (3.5 Mo) + 2 exemples bilans | `evaleo-6-15.ts` (108 l.) | ❌ | 🟡→🟢 refondu + form UI guidé | **2ᵉ** |
| 3 | **Exalang 5-8** | manuel (4.7 Mo) + cahier (15.6 Mo) | `exalang-5-8.ts` (129 l.) | ❌ | 🟡→🟢 refondu + form UI guidé | **3ᵉ** |
| 4 | **Exalang 3-6** | manuel (12.8 Mo) + cahier (461 Ko) | `exalang-3-6.ts` (105 l.) | ❌ | 🟡→🟢 refondu + form UI guidé | **4ᵉ** |
| 5 | **PrediFex** | manuel utilisateur (1.1 Mo) — pas de cahier | absent | ❌ | 🔴→🟢 créé + form UI guidé | **5ᵉ** |
| 6 | **BECD** | manuel (1.2 Mo) + cahier (417 Ko) + 2 annexes | absent | ❌ | 🔴→🟢 créé + form UI guidé | **6ᵉ** |
| 7 | **BIA** | manuel court (574 Ko) + manuel long (796 Ko) + cahier court (1.2 Mo) + cahier long (1.5 Mo) + annexe logiciel | absent | ❌ | 🔴→🟢 créé + form UI guidé | **7ᵉ** |
| 8 | **PrediLac** | manuel (16.9 Mo) + cahier (24 Mo) | absent | ❌ | 🔴→🟢 créé + form UI guidé | **8ᵉ** |
| 9 | **Exalang Lyfac** | manuel (8.2 Mo) + cahier (529 Ko) | absent | ❌ | 🔴→🟢 créé + form UI guidé | **9ᵉ** |

## Bilans déjà OK — à NE PAS TOUCHER

| Bilan | Module | Form UI | Justification |
|---|---|---|---|
| **Exalang 8-11** | `exalang-8-11.ts` (184 l.) | ❌ | ✅ Validé Laurie, prompts dense et utilisé en prod |
| **Exalang 11-15** | `exalang-11-15.ts` (147 l.) | ❌ | ✅ Validé Laurie, prompts dense et utilisé en prod |
| **PREDIMEM** | `predimem.ts` (270 l.) | ✅ `PredimemScoresInput` (775 l.) | ✅ Pilote complet livré au commit `9c707a9` |
| **BETL** | `betl.ts` (349 l.) | ✅ `BetlScoresInput` (1091 l.) | ✅ Confirmé OK par l'utilisateur |
| **MoCA** | `moca.ts` (216 l.) | ✅ `MocaScoresInput` (725 l.) | ✅ Retravaillé récemment |
| **EVALO / Evalo 2-6** | `evalo-2-6.ts` (107 l.) | ❌ | ⏸ Reporté par l'utilisateur (« plus tard ») |

## Modules sans source — laissés en l'état

Modules existants sans manuel dans `docs/Bilans Sources/`. Règle absolue « jamais inventer »
oblige à les laisser tels quels jusqu'à ce que les sources soient fournies.

- `bale.ts` (102 l.) — BALE
- `belec.ts` (91 l.) — BELEC
- `bilo.ts` (108 l.) — BILO
- `elo.ts` (98 l.) — ELO
- `n-eel.ts` (99 l.) — N-EEL
- `omf-deglutition.ts` (140 l.) — OMF / Déglutition

## Process appliqué pour chaque bilan en chantier

Pour chaque bilan (process identique à celui rodé sur PREDIMEM) :

1. **Lecture sources** — manuel + cahier (+ annexes). OCR du PDF si pas déjà fait
   (fichiers .txt dans `docs/Bilans Sources/` si disponibles).
2. **Module prompt** `lib/prompts/tests/[nom].ts` — toutes les épreuves avec noms
   officiels EXACTS, seuils, règles de cotation, profils cliniques, formulations
   diagnostiques issues du manuel. Si info manquante → `[À COMPLÉTER PAR LAURIE]`.
3. **Form UI guidé** `components/forms/[Nom]ScoresInput.tsx` — grille de saisie
   structurée avec : tranche d'âge (stratification si applicable), inputs adaptés
   au type de score (brut / temps / ratio / percentile), tooltips depuis le manuel,
   indicateurs couleur immédiats selon seuils, checkbox « non passée », totaux
   automatiques. Pattern : `MocaScoresInput` (725 l.) et `PredimemScoresInput`
   (775 l.) comme références.
4. **Intégration** — `lib/prompts/tests/index.ts` (registre), `lib/types.ts`
   (TESTS_OPTIONS si nouveau), branchement dans `app/dashboard/nouveau-crbo/page.tsx`
   (pattern `formData.test_utilise.length === 1 && formData.test_utilise[0] === '[NOM]'`).
5. **Build** — `npm run build` doit passer sans erreur.
6. **Commit + push** — `feat([nom-bilan]): formulaire + module prompt depuis sources officielles`.

## Garanties qualité

- **Pas d'invention** — chaque épreuve / seuil / règle vient des sources officielles
  ou est marquée `[À COMPLÉTER PAR LAURIE]`.
- **Noms officiels EXACTS** — copie verbatim depuis le manuel, jamais reformulés.
- **Build vert obligatoire** entre chaque bilan — si rouge, on corrige avant suite.
- **Modules Exalang 8-11 / 11-15 NE PAS TOUCHER** — validés Laurie en prod.
- **Pas de régression du flow preview/édition** déjà livré (commits `b237ef4` et `022f76f`).
