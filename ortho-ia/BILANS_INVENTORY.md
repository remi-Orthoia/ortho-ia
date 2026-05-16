# Inventaire des bilans — sources officielles vs modules ortho.ia

État au 2026-05-16. Croisement entre `docs/Bilans Sources/` et `lib/prompts/tests/`.

## Légende statut

- ✅ **OK validé** — module dense + validé Laurie, NE PAS TOUCHER
- 🟢 **Complet à enrichir** — module existe et est dense, peut bénéficier d'un passage sources
- 🟡 **Squelette à reprendre** — module existe mais court (≤ 110 lignes), à reconstruire depuis sources
- 🔴 **À créer** — sources présentes, module absent
- ⚫ **Pas de source** — module présent sans manuel dans `docs/`, on laisse en l'état

## Tableau récapitulatif

| # | Bilan | Sources disponibles | Module | Lignes | Form UI guidé | Statut | Priorité |
|---|---|---|---|---|---|---|---|
| 1 | **Exalang 3-6** | manuel + cahier | `exalang-3-6.ts` | 105 | ❌ | 🟡 Squelette | P2 |
| 2 | **Exalang 5-8** | manuel + cahier | `exalang-5-8.ts` | 129 | ❌ | 🟡 Squelette | P2 |
| 3 | **Exalang 8-11** | manuel + cahier | `exalang-8-11.ts` | 184 | ❌ | ✅ Validé Laurie | — (ne pas toucher) |
| 4 | **Exalang 11-15** | manuel + cahier | `exalang-11-15.ts` | 147 | ❌ | ✅ Validé Laurie | — (ne pas toucher) |
| 5 | **Exalang Lyfac** | manuel + cahier | absent | — | ❌ | 🔴 À créer | P3 |
| 6 | **BETL** | manuel PDF (13 Mo) + .txt + cahier + 2 annexes | `betl.ts` | 349 | ✅ `BetlScoresInput` | 🟢 Complet à enrichir | P2 |
| 7 | **PREDIMEM** | manuel PDF (4.6 Mo) + .txt | `predimem.ts` | 268 | ❌ | 🟢 Complet à enrichir | P2 |
| 8 | **Examath 8-15** | manuel + cahier | `examath.ts` | 180 | ❌ | 🟡 Squelette à reprendre | **P1** |
| 9 | **EVALEO 6-15** | manuel cotation + cahier LO + cahier LE + 2 exemples bilan | `evaleo-6-15.ts` | 108 | ❌ | 🟡 Squelette à reprendre | **P1** |
| 10 | **GreMots** | manuel + cahier | absent | — | ❌ | 🔴 À créer | P2 |
| 11 | **BECD** | manuel + cahier + 2 annexes | absent | — | ❌ | 🔴 À créer | P3 |
| 12 | **BIA** | manuel court + manuel long + cahier court + cahier long + annexe | absent | — | ❌ | 🔴 À créer | P3 |
| 13 | **PREDILAC** | manuel (16.8 Mo) + cahier (24 Mo) | absent | — | ❌ | 🔴 À créer | P3 |
| 14 | **PrediFex** | manuel pratique utilisateur | absent | — | ❌ | 🔴 À créer | P3 |
| 15 | **MoCA** | (pas de source ici, déjà construit avec règles officielles) | `moca.ts` | 216 | ✅ `MocaScoresInput` | 🟢 Complet (modifié aujourd'hui) | — |
| 16 | EVALO 2-6 | aucune source dans `docs/` | `evalo-2-6.ts` | 107 | ❌ | ⚫ Pas de source | — |
| 17 | ELO | aucune source dans `docs/` | `elo.ts` | 98 | ❌ | ⚫ Pas de source | — |
| 18 | BALE | aucune source dans `docs/` | `bale.ts` | 102 | ❌ | ⚫ Pas de source | — |
| 19 | N-EEL | aucune source dans `docs/` | `n-eel.ts` | 99 | ❌ | ⚫ Pas de source | — |
| 20 | BILO | aucune source dans `docs/` | `bilo.ts` | 108 | ❌ | ⚫ Pas de source | — |
| 21 | BELEC | aucune source dans `docs/` | `belec.ts` | 91 | ❌ | ⚫ Pas de source | — |
| 22 | OMF / Déglutition | aucune source dans `docs/` | `omf-deglutition.ts` | 140 | ❌ | ⚫ Pas de source | — |

## Détail des fichiers par bilan

### Sources avec manuel + cahier complets (chantier solide possible)

- **BETL** — `BETL manuel.pdf` (13 Mo), `BETL manuel.txt` (163 Ko, déjà OCR), `BETL.pdf` (résumé 77 Ko), `cahier de passation BETL.pdf` (3.5 Mo), `BETL annexe 1.pdf` (dénomination — qualification erreurs), `BETL annexe 2.pdf` (commentaires dénomination)
- **PREDIMEM** — `predimem.pdf` (4.6 Mo) + `Manuel.pdf` (1.3 Mo, doublon) + `predimem.txt` (182 Ko, déjà OCR)
- **Examath 8-15** — `Manuel examath 8-15.pdf` (2.5 Mo) + `Cahier de passation examath 8-15.pdf` (315 Ko)
- **EVALEO 6-15** — `Evaleo 6-15 livret de cotation avec exemples.pdf` (27 Mo, ENORME), `Cahier passation LE.pdf` (3.5 Mo), `Cahier passation LO.pdf` (1.3 Mo), `exemple bilan evaleo 1.pdf` + `exemple bilan evaleo 2 (renouvellement).pdf`
- **GreMots** — `GreMots-Manuel.pdf` (889 Ko) + `GreMots-Cahier-passation.pdf` (474 Ko)
- **BECD** — `manuel BECD.pdf` (1.2 Mo) + `cahier de passation BECD.pdf` (417 Ko) + 2 annexes (tableau synthèse + consignes plateforme)
- **BIA** — `manuel BIA version courte.pdf` (574 Ko) + `manuel BIA version longue.pdf` (796 Ko) + `cahier de passation BIA version courte.pdf` + `cahier de passation BIA version longue.pdf` + annexe logiciel
- **PREDILAC** — `manuel predilac.pdf` (16.9 Mo) + `cahier de passation predilac.pdf` (24 Mo)
- **PrediFex** — `PrediFex-Manuel-Pratique-utilisateur.pdf` (1.1 Mo) — pas de cahier de passation
- **Exalang 3-6 / 5-8 / Lyfac** — manuels + cahiers présents

### Modules ortho.ia sans source dans `docs/`

EVALO 2-6, ELO, BALE, N-EEL, BILO, BELEC, OMF/Déglutition — modules existent (squelettes ~100 lignes) mais aucun manuel n'est dans `docs/Bilans Sources/`. **Décision suggérée :** laisser en l'état tant qu'on n'a pas les sources officielles (sinon on risque d'inventer = casse la règle absolue "jamais de données inventées").

## Critères de priorisation

**P1 — Très utilisés, sources solides, squelette actuel à reprendre :**
- **Examath 8-15** — test très répandu (langage écrit / maths), module actuel 180 lignes peut être doublé
- **EVALEO 6-15** — bilan langage complet 6-15 ans, sources énormes (livret 27 Mo + cahiers + exemples), module actuel 108 lignes trop léger

**P2 — À enrichir / squelettes à reprendre / créer (bilans courants) :**
- BETL (déjà dense, à valider section par section depuis manuel + annexes)
- PREDIMEM (déjà dense, à confronter au manuel)
- GreMots (à créer — dénomination très utilisée en gériatrie)
- Exalang 3-6 et 5-8 (squelettes — manuels disponibles)

**P3 — Création depuis zéro (bilans plus spécialisés ou plus rares) :**
- Exalang Lyfac (lycéens / fac — moins fréquent)
- BECD (cognition adulte)
- BIA (aphasie — long et complexe, deux versions)
- PREDILAC (lecture adulte — manuel + cahier très lourds)
- PrediFex (fonctions exécutives — manuel utilisateur uniquement)

## Estimation grossière de portée

Par bilan, le chantier complet (lecture sources → module prompt complet → form UI guidé → graphique → test génération → commit) représente entre **3 et 8 heures** selon la taille du manuel et la complexité (BETL/EVALEO ≈ 8h, GreMots/PrediFex ≈ 3h).

- 2 bilans P1 : ≈ 12-16 h
- 5 bilans P2 : ≈ 20-30 h
- 5 bilans P3 : ≈ 25-40 h
- **Total estimé : 60-85 heures** pour traiter les 12 bilans avec sources, en ne touchant pas Exalang 8-11 / 11-15 / MoCA (validés / récemment retravaillés)

## Risques identifiés

1. **Tables d'étalonnage par âge/classe** : la plupart des bilans ont des seuils qui varient par tranche d'âge. Extraire ça correctement du PDF demande une lecture rigoureuse (parfois page par page) — risque d'erreur d'OCR sur les tableaux.
2. **PDF gros volume** : PREDILAC (24 Mo cahier), EVALEO livret cotation (27 Mo) — peuvent nécessiter découpe avant lecture pour ne pas saturer le contexte.
3. **Formulaires UI guidés** : 1 form spécifique par bilan ≈ 500-1000 lignes TSX. Pour 12 bilans = 6 000-12 000 lignes UI à écrire et tester visuellement.
4. **Règle "jamais de données inventées"** : tient la qualité mais ralentit (chaque seuil doit être sourcé). Beaucoup de champs vont finir en `[À COMPLÉTER PAR LAURIE]`.
5. **Tests visuels** : impossibles à faire en ligne de commande — chaque form doit être ouvert dans le navigateur, ce qui demande des allers-retours entre `npm run dev` et la prod.

## Recommandation de séquençage

Commencer petit pour caler la méthode sur 1 bilan, puis industrialiser :

1. **Itération 0** — Examath 8-15 (P1, manuel raisonnable 2.5 Mo) comme bilan-pilote complet (lecture sources → module enrichi → form UI guidé → test génération → commit)
2. **Itération 1** — EVALEO 6-15 en appliquant la méthode rodée
3. **Pause + retour utilisateur** sur les deux premiers livrables avant de continuer (qualité, ergonomie du form, fidélité aux sources)
4. **Itération 2+** — BETL/PREDIMEM enrichis, puis GreMots, puis le reste P3

---

**Stop demandé par les consignes** (« Montre-moi cet inventaire avant de continuer »).
