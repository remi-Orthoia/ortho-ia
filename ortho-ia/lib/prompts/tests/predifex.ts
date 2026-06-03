import type { TestModule } from './types'

/**
 * Module PrediFex — PRotocole d'Evaluation et de Dépistage des Insuffisances
 * des Fonctions Exécutives (Duchêne & Jaillard, HappyNeuron 2019).
 *
 * Source : manuel utilisateur officiel (pas de cahier de passation séparé).
 * Échantillon de validation : 542 adultes répartis en 5 classes d'âge × 3 NSC.
 *
 * Population cible : **adultes NSC 1 à 3** (étalonnage manuel p. 1, 16). Les
 * auteures déconseillent PrediFex pour les sujets *sous-NSC 1* (scolarité
 * < 9 ans sans activité compensatoire) — les épreuves sont trop difficiles
 * et reflètent davantage le NSC que des déficits pathologiques. L'épreuve 09
 * Équivalences nécessite spécifiquement ≥ 10 ans de scolarité (p. 75-76).
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

**Population cible** : adultes 18-90 ans, **NSC 1, 2 ou 3** (étalonnage complet sur les 3 niveaux). Le manuel déconseille la passation aux sujets *sous-NSC 1* (scolarité < 9 ans sans activité compensatoire) — les épreuves restent trop difficiles. Cas d'usage prototype : **plainte cognitive subjective avec MMS=30 et bilan neuropsy classique normal** (effet plafond), typiquement sujet à haute réserve cognitive.

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
| 1   | scolarité 9-12 ans (CAP, BEP, Brevet, Certificat d'études) — VALIDE, étalonnage présent. ⚠️ épreuve 09 Équivalences nécessite ≥ 10 ans scolarité. |
| 2   | Bac à Bac+3 inclus |
| 3   | ≥ Bac+4 (cadre, ingénieur, professions à forte réserve cognitive) — population prototype, attention au plafonnement sur 02/03/06 (lire le temps plutôt que le score) |

**Seuil d'alerte officiel** : score < **moyenne − 1,5 écart-type** du groupe (âge × NSC). Le logiciel HappyNeuron affiche le verdict automatiquement.

---

#### LES 10 ÉPREUVES — Scores max, cotation, cibles cognitives

| N° | Épreuve | Max | Cotation clé | Cible exécutive |
|----|---------|-----|--------------|------------------|
| 01 | Fluences alternées | 30 | 1 pt / mot correct, plafond 30. Pas de malus. 2 mots de la même catégorie à la suite = 1 pt seulement. | Flexibilité + inhibition d'une réponse automatique |
| 02 | Texte à mettre en ordre | 12 | −2 pt / segment mal placé sans casser la cohérence, −4 pt si casse la cohérence, −3 pt si aide examinateur. | Planification + cohérence textuelle + MdT |
| 03 | Textes « exécutifs » | 10 (4 + 6) | 3a Résumé /4 (tout ou rien). 3b Ordre des événements /6 : −1 pt / épisode mal placé, −2 pt sur épisode à astérisque (plus exécutif), −3 pt si aide. | Compréhension exigeante en attention / inhibition / inférences |
| 04 | Une syllabe sur deux | 42 (8+18+16) | 4 pt mot 2 syl / 6 pt mot 3 syl / 8 pt mot 4 syl. −2 pt / répétition audio. Arrêt après 2 items échoués. | Inhibition + flexibilité (alternance syllabique) |
| 05 | Mise à jour | 45 (5a 21 + 5b 24) | 5a Chiffres /21 (3 pt/série, −1 pt par chiffre manquant). 5b Syllabes /24 (3 pt/série). 5c Stroop lettres /32 **optionnel et non comptabilisé** — déclenché uniquement si 5a < 12 ou 5b < 14. | Mise à jour de la MdT |
| 06 | Problème arithmétique | 10 (6 raisonnement + 4 calcul) | −2 pt / erreur de raisonnement ou omission d'info, −3 pt si aide examinateur. | Planification + MdT en numérique |
| 07 | Problème logique « Luria » | 10 (4+2+2+2) | 4 pt Q1, 2 pt chacune Q2/Q3/Q4. −3 pt si aide. | Raisonnement abstrait + inhibition (énoncé piégeant « avoir X ans de plus que ») |
| 08 | Sudofex | 22 | Essai MIREILLE obligatoire (non scoré). Puis examinateur choisit Annick (max 8) / Marie (max 16) / Guillaume (max 22). **Seule la meilleure grille compte.** 1-2 pt / case (contenu + couleur séparés), −3/−6 pt selon aide. | Inhibition + raisonnement logique en grille |
| 09 | Équivalences | 20 | Essai LUNES obligatoire (non scoré). Si LUNES non compris → renoncer à l'épreuve. Puis subtests : Formes (max 8) / Feux (max 12) / Étoiles (max 18) / Flèches (max 20). **Seul le meilleur subtest compte.** 2-3 pt / item, −3/−6 pt selon aide. Nécessite ≥ 10 ans scolarité. | Raisonnement analogique + inhibition |
| 10 | Itinéraire | 20 | 2 pt par consigne respectée (passages + sens interdits + école + labo). Malus libre si aide ou trajet trop long. Ciblée pour NSC 1 (alternative à l'ép. 09) et NSC 3 en confirmation. | Planification spatiale + MdT visuo-spatiale |

**Temps d'alerte par tranche d'âge** (minutes — donnés explicitement dans le manuel) :

| Épreuve | 18-49 | 50-59 | 60-69 | 70-79 | ≥80 |
|---------|-------|-------|-------|-------|-----|
| 02 Texte ordre | 4 | 5 | 7 | 11 | 18 |
| 03 Textes exé | 5 | 6 | 8 | 10 | 15 |
| 06 Pb arith   | 5 | 6 | 6 | 8 | 16 |
| 07 Luria      | 5 | 6 | 7 | 9 | 18 |
| 08 Sudofex    | 7 | 8 | 9 | 15 | 30 |
| 09 Équiv      | 5 | 6 | 8 | 10 | 20 |
| 10 Itinéraire | 6 | 6 | 7 | 8 | 10 |

**Pas de seuil temps** pour 01 (chrono fixe 1 min), 04 (variabilité trop élevée), 05 (auto). Un sujet peut obtenir un score correct EN TEMPS PATHOLOGIQUE — c'est le marqueur sub-clinique majeur, particulièrement chez NSC 3 (plafonnement attendu sur 02/03/06). **À reporter systématiquement dans le commentaire.**

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

9. **NSC 1 valide mais vigilance** : PrediFex est étalonné NSC 1 (9-12 ans scolarité). Pour les sujets *sous-NSC 1* (scolarité < 9 ans sans activité compensatoire), l'outil reste trop exigeant — préférer BREF, MoCA, ou un bilan neuropsychologique adapté. L'épreuve 09 Équivalences nécessite ≥ 10 ans scolarité (auteures recommandent de la sauter sinon, et de privilégier l'épreuve 10 Itinéraire).

10. **Le titre de la synthèse est "Hypothèse de diagnostic"**, JAMAIS "Diagnostic".

---

#### TRANSPOSITION VERS LE CRBO ORTHO.IA

PrediFex n'utilise pas de percentiles continus (notes standard / z-scores sigma-based). Pour l'intégrer dans la structure CRBO :

- **\`score\`** = score brut au format "X/Y" (ex: "23/30").
- **\`et\`** = écart en notes standard ou en sigma par rapport à la moyenne du groupe (ex: "−1,8 σ"). null si non disponible.
- **\`percentile\`** = laisser vide ('') ou indiquer la zone HappyNeuron (ex: "Zone jaune", "Seuil d'alerte"). PrediFex ne donne pas de percentile au sens classique.
- **\`percentile_value\`** : valeur calibrée pour la couleur d'arrière-plan du tableau Word. **PrediFex a OFFICIELLEMENT 5 ZONES** (vs 6 zones Laurie côté Word) — on saute volontairement la zone Laurie "Moyenne basse" (jaune P26-49) qui n'existe pas dans HappyNeuron, parce que **Jaune HappyNeuron = seuil d'alerte clinique** (fragilité installée), équivalent en sévérité à "Zone de fragilité" Laurie et NON à "Moyenne basse" Laurie (cette dernière reste "norme un peu basse, OK" en Exalang) :
  - **Vert foncé HappyNeuron** (≥ M) → \`percentile_value\` = **85** (cellule fond vert foncé Laurie "Excellent")
  - **Vert clair HappyNeuron** (M−1σ à M−1,5σ, performance correcte, légèrement abaissée) → \`percentile_value\` = **60** (cellule fond vert clair Laurie "Moyenne haute")
  - **Jaune HappyNeuron** (M−1,5σ à M−2σ, **SEUIL D'ALERTE OFFICIEL**) → \`percentile_value\` = **18** (cellule fond orange clair Laurie "Zone de fragilité" — la sévérité du seuil d'alerte exécutif colle à "Zone de fragilité", PAS à "Moyenne basse" qui sous-évaluerait l'alerte)
  - **Orange HappyNeuron** (M−2σ à M−3σ, difficulté avérée) → \`percentile_value\` = **8** (cellule fond orange foncé Laurie "Difficulté")
  - **Rouge HappyNeuron** (< M−3σ, effondrement) → \`percentile_value\` = **3** (cellule fond rouge Laurie "Difficulté sévère")
  Ces valeurs ne sont PAS des percentiles cliniques au sens classique (PrediFex est sigma-based, pas percentile-based) — ce sont des codes-couleurs pour piloter le shading Word, alignés sur la sémantique clinique HappyNeuron (et non sur la grille Exalang).
- **\`interpretation\`** : utiliser **OBLIGATOIREMENT** le vocabulaire HappyNeuron retranscrit ci-dessous, JAMAIS les étiquettes percentile-based Exalang ("Excellent / Moyenne haute / Moyenne basse / Zone de fragilité / Difficulté / Difficulté sévère") qui n'ont pas de sens pour ce protocole sigma-based (instruction surclassée par l'instruction "6 zones par défaut" du \`tool-schema\` qui ne s'applique pas à PrediFex) :
  - Vert foncé → "performance préservée"
  - Vert clair → "performance dans la moyenne basse, à surveiller"
  - Jaune → "fragilité objectivée (seuil d'alerte)"
  - Orange → "difficulté avérée"
  - Rouge → "effondrement"
  *Précision rédactionnelle : ce vocabulaire est une paraphrase clinique transposée pour le CRBO, fidèle à l'esprit du manuel HappyNeuron qui n'impose pas de termes officiels.*
- **\`commentaire\`** du domaine ou de l'épreuve : OBLIGATOIRE pour PrediFex. Doit intégrer le score + le temps + l'observation qualitative + la lecture en lien avec les autres épreuves du protocole.

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
- ❌ Faire passer PrediFex à un sujet *sous-NSC 1* (< 9 ans scolarité) — résultats non interprétables (effet de niveau).
- ❌ Faire passer l'épreuve 09 Équivalences à un sujet < 10 ans scolarité (sauter et proposer l'épreuve 10 Itinéraire à la place).
- ❌ Conclure à un déficit chez un NSC 3 sur la base d'un score plafond (12/12 en 02 Texte ordre, par exemple) — lire le TEMPS, qui révèle la vraie performance dans ces cas.
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
