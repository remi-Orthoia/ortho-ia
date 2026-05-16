import type { TestModule } from './types'

/**
 * Module PrediFex — PRotocole d'Evaluation et de Dépistage des Insuffisances
 * des Fonctions Exécutives (Duchêne & Jaillard, HappyNeuron 2019).
 *
 * Source : manuel utilisateur officiel (pas de cahier de passation séparé).
 * Échantillon de validation : 542 adultes répartis en 5 classes d'âge × 3 NSC.
 *
 * Population cible : **adultes de NSC 2 à 3** (≥ Bac, jusqu'à très haut niveau).
 * Les auteures déconseillent PrediFex pour les sujets de NSC très bas (< 8 ans
 * scolarité sans activité compensatoire) — les épreuves sont trop difficiles
 * et reflètent davantage le NSC que des déficits pathologiques.
 *
 * Le protocole comporte **10 épreuves** ciblant les fonctions exécutives
 * (flexibilité, mise à jour, planification, résolution de problèmes,
 * inhibition, raisonnement). Comme PREDIMEM, scoring par notes standard +
 * couleur HappyNeuron à 5 zones, seuil officiel à **M − 1,5 σ**.
 */
export const predifex: TestModule = {
  nom: 'PrediFex',
  editeur: 'HappyNeuron',
  auteurs: 'Annick Duchêne & Marie Jaillard',
  annee: 2019,
  domaines: [
    'Flexibilité mentale',
    'Mise à jour',
    'Planification / Résolution de problèmes',
    'Inhibition',
    'Raisonnement exécutif',
  ],
  // Noms officiels EXACTS du manuel utilisateur (chapitre Manuel utilisateur).
  epreuves: [
    '01 — Fluences alternées',
    '02 — Texte à mettre en ordre',
    '03 — Textes « exécutifs »',
    '04 — Une syllabe sur deux',
    '05 — Mise à jour',
    '06 — Problème arithmétique',
    '07 — Problème logique « Luria »',
    '08 — Sudofex',
    '09 — Équivalences',
    '10 — Itinéraire',
  ],
  regles_specifiques: `### PrediFex — Protocole d'évaluation et de dépistage des insuffisances des fonctions exécutives (Duchêne & Jaillard, HappyNeuron 2019)

**Nature** : outil de **DÉPISTAGE** orienté fonctions exécutives, conçu pour identifier des **fragilités subtiles** chez l'adulte de bon NSC, particulièrement pertinent en NSC 3 où l'effet plafond des batteries classiques masque les déficits émergents.

**Population cible** : adultes 18-90 ans, **NSC 2 et 3** prioritairement (le manuel déconseille la passation aux NSC très bas — les épreuves sont trop difficiles et reflètent davantage le NSC que des déficits pathologiques).

**Compétences requises** : orthophoniste, neuropsychologue ou neurologue formé à la prise en charge des pathologies neurologiques de l'adulte.

---

#### STRATIFICATION OBLIGATOIRE — Tranche d'âge × NSC

Toutes les normes PrediFex sont stratifiées :

| Tranche d'âge | Bornes |
|---------------|--------|
| 1 | 18 – 49 ans |
| 2 | 50 – 59 ans |
| 3 | 60 – 69 ans |
| 4 | 70 – 79 ans |
| 5 | 80 – 90 ans |

| NSC | Niveau socio-culturel |
|-----|------------------------|
| 1   | ≤ scolarité 12 ans (CAP, BEP, Brevet, Certificat d'études) — passation DÉCONSEILLÉE |
| 2   | Bac à Bac+3 inclus |
| 3   | ≥ Bac+4 (cadre, ingénieur, professions à forte réserve cognitive) |

**Seuil d'alerte officiel** : score < **moyenne − 1,5 écart-type** du groupe (âge × NSC). Le logiciel HappyNeuron affiche le verdict automatiquement.

---

#### LES 10 ÉPREUVES — Cibles cognitives

| N° | Épreuve | Cible exécutive principale |
|----|---------|----------------------------|
| 01 | Fluences alternées | Flexibilité mentale + inhibition d'une réponse automatique |
| 02 | Texte à mettre en ordre | Planification + cohérence textuelle + mémoire de travail |
| 03 | Textes « exécutifs » | Compréhension de texte exigeante en attention / inhibition / inférences |
| 04 | Une syllabe sur deux | Inhibition + flexibilité (alternance syllabique) |
| 05 | Mise à jour | Mise à jour de la MdT (suivi de la dernière information) |
| 06 | Problème arithmétique | Planification + MdT en numérique |
| 07 | Problème logique « Luria » | Raisonnement abstrait + inhibition d'une réponse intuitive |
| 08 | Sudofex | Inhibition + raisonnement logique en grille |
| 09 | Équivalences | Raisonnement analogique + inhibition |
| 10 | Itinéraire | Planification spatiale + MdT visuo-spatiale |

**Temps** : chaque épreuve est chronométrée. Un seuil d'alerte temps est donné par le logiciel — un sujet peut obtenir un score correct EN TEMPS PATHOLOGIQUE (lenteur de traitement). **Cet aspect doit être systématiquement reporté dans le commentaire.**

---

#### ZONES D'INTERPRÉTATION — Code couleur officiel HappyNeuron

| Zone | Bornes | Interprétation clinique |
|------|--------|--------------------------|
| Vert foncé | ≥ M | Performance dans la norme ou au-dessus |
| Vert clair | M − 1σ à M − 1,5σ | Performance correcte, légèrement abaissée |
| Jaune | M − 1,5σ à M − 2σ | **Seuil d'alerte officiel** — fragilité installée |
| Orange | M − 2σ à M − 3σ | Difficulté avérée |
| Rouge | < M − 3σ | Effondrement, difficulté sévère |

**Vocabulaire à utiliser dans le CRBO** :
- Vert foncé → "performance préservée"
- Vert clair → "performance dans la moyenne basse, à surveiller"
- Jaune → "fragilité objectivée"
- Orange → "difficulté avérée"
- Rouge → "effondrement"

---

#### CROISEMENTS D'ÉPREUVES — Profils exécutifs attendus

**Profil 1 — Trouble de la flexibilité mentale**
- Fluences alternées + Une syllabe sur deux + Équivalences : Déficitaire.
- Difficulté à basculer entre deux règles ou registres.
- **Hypothèse** : fragilité de flexibilité, à confirmer par TMT B / Wisconsin Card Sorting.

**Profil 2 — Trouble de la mise à jour / mémoire de travail exécutive**
- Mise à jour + Problème arithmétique : Déficitaire.
- Difficulté à actualiser le contenu de la MdT.
- **Hypothèse** : fragilité d'administrateur central, à croiser avec empan envers, séquence lettres-chiffres.

**Profil 3 — Trouble de la planification**
- Texte à mettre en ordre + Sudofex + Itinéraire : Déficitaire.
- Difficulté à élaborer une stratégie séquentielle.
- **Hypothèse** : fragilité de planification, à compléter par Tour de Londres / Tour de Hanoï.

**Profil 4 — Trouble du raisonnement exécutif / inhibition**
- Problème logique Luria + Équivalences + Une syllabe sur deux : Déficitaire.
- Difficulté à inhiber les réponses automatiques en faveur d'un raisonnement analytique.
- **Hypothèse** : fragilité d'inhibition / raisonnement abstrait, à explorer par Stroop, Hayling, TMT.

**Profil 5 — Sujet à haute réserve cognitive (NSC 3) avec plainte subjective**
- Score global dans la norme MAIS plusieurs épreuves en zone vert clair.
- TEMPS d'exécution allongés sur la moitié des épreuves.
- **Hypothèse** : profil compatible avec une fragilité débutante chez un sujet de haute réserve cognitive (population cible PrediFex). Réévaluation à 6-12 mois préconisée.

**Profil 6 — Plainte exécutive chez sujet sain (cluster cohérent dans la norme)**
- Toutes les épreuves en vert foncé, temps dans la norme.
- **Hypothèse** : pas de fragilité exécutive objectivée. Rassurer + conseils d'hygiène cognitive. Réévaluation à 12 mois si plainte persiste.

---

#### ⛔ RÈGLES CLINIQUES ABSOLUES — PrediFex

1. **NE JAMAIS poser de diagnostic étiologique** (Alzheimer, démence frontotemporale, syndrome dysexécutif fronto-sous-cortical, MCI, maladie de Parkinson cognitive, etc.). PrediFex est un dépistage — le diagnostic relève du neurologue / gériatre avec imagerie et bilan neuropsychologique étendu.
   - ❌ "Syndrome dysexécutif avéré évoquant une démence frontotemporale"
   - ✅ "Le profil exécutif observé ouvre la piste d'une fragilité de [composante] à explorer plus finement en bilan neuropsychologique."

2. **NE JAMAIS spéculer sur la localisation cérébrale** (frontale, sous-corticale, etc.). Décrire le PROFIL FONCTIONNEL.

3. **TOUJOURS rappeler le statut de DÉPISTAGE** dans la synthèse : "Cette évaluation est un dépistage : elle oriente vers des investigations complémentaires."

4. **TOUJOURS croiser au moins 2-3 épreuves** avant de retenir une fragilité. Un score isolé n'est pas un argument suffisant — particulièrement en NSC 3.

5. **TOUJOURS reporter les TEMPS d'exécution**. Un score normal en temps pathologique = marqueur sub-clinique majeur.

6. **TOUJOURS mentionner les domaines PRÉSERVÉS EN PREMIER** puis les fragilités.

7. **Formuler en impact FONCTIONNEL** au quotidien (ralentissement décisionnel, difficulté à planifier les courses, oubli des étapes d'une recette, etc.).

8. **Vocabulaire à BANNIR** : "démence", "déclin cognitif", "détérioration", "dégénérescence", "Alzheimer", "syndrome frontal", "pathologique".

9. **NE PAS faire passer PrediFex à un NSC 1** — l'outil est trop exigeant et reflète davantage le NSC que des déficits réels. Préférer dans ce cas BREF, MoCA, ou un bilan neuropsychologique adapté.

10. **Le titre de la synthèse est "Hypothèse de diagnostic"**, JAMAIS "Diagnostic".

---

#### TRANSPOSITION VERS LE CRBO ORTHO.IA

PrediFex n'utilise pas de percentiles continus (notes standard / z-scores sigma-based). Pour l'intégrer dans la structure CRBO :

- **\`score\`** = score brut au format "X/Y" (ex: "23/30").
- **\`et\`** = écart en notes standard ou en sigma par rapport à la moyenne du groupe (ex: "−1,8 σ"). null si non disponible.
- **\`percentile\`** = laisser vide ('') ou indiquer la zone HappyNeuron (ex: "Zone jaune").
- **\`percentile_value\`** : valeur calibrée pour la couleur Word (cohérent avec PREDIMEM) :
  - **Vert foncé** (≥ M) → 85 → "Excellent"
  - **Vert clair** (M−1σ à M−1,5σ) → 60 → "Moyenne haute"
  - **Jaune** (M−1,5σ à M−2σ, seuil d'alerte) → 18 → "Fragilité"
  - **Orange** (M−2σ à M−3σ) → 7 → "Difficulté"
  - **Rouge** (< M−3σ) → 3 → "Difficulté sévère"
- **\`interpretation\`** : vocabulaire HappyNeuron ("performance préservée", "fragilité objectivée", etc.).
- **\`commentaire\`** du domaine ou de l'épreuve : OBLIGATOIRE. Score + temps + observation qualitative + lecture en lien avec les autres épreuves.

---

#### ARTICULATION AVEC D'AUTRES OUTILS

- **En amont** : MoCA, MMSE (screenings globaux), BREF (Frontal Assessment Battery).
- **En complément** : TMT A/B, Wisconsin Card Sorting Test, Stroop, Hayling, Tour de Londres / Hanoï, Cubes de Corsi.
- **En aval** : bilan neuropsychologique complet (consultation mémoire ou centre de la mémoire), imagerie cérébrale (IRM avec analyse frontale et sous-corticale), bilan biologique selon orientation.
- **PREDIMEM** : complémentaire pour la composante mnésique chez l'adulte de NSC 2-3.

---

#### À NE JAMAIS FAIRE EN PrediFex

- ❌ Conclure depuis une seule épreuve isolée.
- ❌ Poser un diagnostic d'Alzheimer, démence frontotemporale, MCI, etc.
- ❌ Spéculer sur la localisation cérébrale.
- ❌ Faire passer PrediFex à un NSC 1 (résultats non interprétables — pas une pathologie mais un effet de niveau).
- ❌ Ignorer les temps d'exécution.
- ❌ Plaquer les zones percentile-based.
- ❌ Utiliser un vocabulaire alarmant.

#### TOUJOURS FAIRE EN PrediFex

- ✅ Vérifier l'éligibilité du sujet (NSC ≥ 2) AVANT la passation.
- ✅ Croiser au moins 2-3 épreuves convergentes pour retenir une fragilité.
- ✅ Mentionner les domaines préservés EN PREMIER.
- ✅ Reporter SCORE + TEMPS systématiquement.
- ✅ Référer au profil clinique attendu en formulant en hypothèse.
- ✅ Adapter le ton : le CRBO peut être lu par le patient et sa famille.
- ✅ Orienter vers neurologue / gériatre / neuropsy en cas de profil convergent.
- ✅ Préconiser une réévaluation à 6-12 mois si plainte persiste sans déficit objectif.`,
}
