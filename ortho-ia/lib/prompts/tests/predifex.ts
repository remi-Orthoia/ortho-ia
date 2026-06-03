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
| 1   | **≥ 9 ans de scolarité, sans Bac** (CAP, BEP, Brevet, Certificat d'études — manuel p. 16). VALIDE, étalonnage présent. ⚠️ épreuve 09 Équivalences nécessite ≥ 10 ans scolarité — si < 10 ans, renoncer à l'ép. 09 (manuel p. 75) et privilégier l'ép. 10 Itinéraire. |
| 2   | Bac à Bac+3 inclus (manuel p. 16) |
| 3   | ≥ Bac+4 (cadre, ingénieur, professions à forte réserve cognitive) — population prototype, attention au plafonnement sur 02/03/06 (lire le temps plutôt que le score) |

**Seuil d'alerte officiel** : score < **moyenne − 1,5 écart-type** du groupe (âge × NSC). Le logiciel HappyNeuron affiche le verdict automatiquement.

#### CRITÈRES D'EXCLUSION (manuel p. 15 — appliqués à l'échantillon de validation, à reporter en clinique)

Avant de proposer PrediFex, vérifier l'absence de :
- **Bilinguisme** (sujet non francophone natif ou usage prédominant d'une autre langue),
- **MMSE < 30** (l'effet plancher rend les résultats peu interprétables — PrediFex cible l'effet plafond, pas l'effet plancher),
- **Pathologie neurologique avérée déjà documentée** (même asymptomatique),
- **Plainte cognitive du sujet ou de l'entourage formalisée avec autre bilan en cours**.

Si l'un de ces critères est présent, mentionner explicitement la limite dans la synthèse du CRBO.

#### FORMAT DE PASSATION (manuel p. 4, 15)

- **Ordre libre et modulable** : "les épreuves sont indépendantes les unes des autres et certains sujets n'ont pas réalisé la totalité du protocole" (p. 15). Le manuel parle de "combinaisons variées selon les sujets testés, les besoins de l'analyse et les objectifs de l'examinateur" (p. 4).
- **Fractionnable** sur plusieurs séances.
- **Pas de durée totale officielle** dans le manuel.
- **Cas clinique cible** : "tests classiques normaux malgré plainte cognitive du sujet ou de l'entourage" (p. 12) — typiquement un sujet à haute réserve cognitive avec effet plafond.

---

#### LES 10 ÉPREUVES — Scores max, cotation, cibles cognitives

| N° | Épreuve | Max | Cotation clé | Cible exécutive |
|----|---------|-----|--------------|------------------|
| 01 | Fluences alternées | 30 | **Catégories selon NSC (manuel p. 24, 88)** : NSC 1 = Outils / Ustensiles de cuisine ; NSC 2 et NSC 3 = Villes françaises / Pays étrangers. Chrono fixe 1 min. 1 pt / mot correct, plafond 30. Pas de malus. 2 mots de la même catégorie à la suite = 1 pt seulement. Exemples donnés dans la consigne NON comptabilisés s'ils sont redonnés (p. 27). Possibilité d'une "2e minute" non comptabilisée pour observation qualitative (p. 25). | Flexibilité + inhibition d'une réponse automatique |
| 02 | Texte à mettre en ordre | 12 | **3 textes selon NSC (manuel p. 30, 88)** : NSC 1 = Fanny ; NSC 2 = Voilier ; NSC 3 = Molly. Grille de notation balisée 12 / 10 / 8 / 6 / 4 / 0 (p. 32). Malus : −2 pt / segment mal placé sans casser la cohérence, −4 pt si casse la cohérence, −3 pt si aide examinateur. **Plafond temps absolu : on arrête au bout d'un quart d'heure** (p. 30). | Planification + cohérence textuelle + MdT |
| 03 | Textes « exécutifs » | 10 (4 + 6) | **3 textes par subtest selon NSC (manuel p. 89-90)** : 3a Résumé — Gallon (NSC 1, rép. n°4) / Serin (NSC 2, rép. n°3) / Dépression (NSC 3, rép. n°3). 3b Ordre des événements (5 épisodes à numéroter) — Dégât des eaux (NSC 1) / Julie (NSC 2) / Jean (NSC 3). 3a /4 : tout ou rien. 3b /6 : −1 pt / épisode mal placé, **−2 pt sur l'épisode à astérisque** (le plus exécutif, varie selon NSC, manuel p. 38), −3 pt si aide. | Compréhension exigeante en attention / inhibition / inférences |
| 04 | Une syllabe sur deux | 42 (8+18+16) | **7 items totaux (manuel p. 45, 90)** : items 1-2 mots de 2 syl. (Gâteau-Bonjour ; Lancer-Ranger) → 2 × 4 pt = 8 ; items 3-5 mots de 3 syl. (Chocolat-Boulanger ; Caméra-Cinéma ; Châtiment-Matelot) → 3 × 6 pt = 18 ; items 6-7 mots de 4 syl. (Rapidement-Procuration ; Poissonnerie-Figuration) → 2 × 8 pt = 16. −2 pt / répétition audio. **Arrêt après 2 items consécutivement échoués.** **Consigne examinateur obligatoire sur items 6-7** : "ne recomposer qu'un mot à la fois" (p. 43). **Règle "écrire = 0"** : si le sujet écrit pour s'aider, l'épreuve est considérée comme échouée même s'il réussit (p. 43). | Inhibition + flexibilité (alternance syllabique) |
| 05 | Mise à jour | 45 (5a 21 + 5b 24) | **Consigne : redire les 3 DERNIERS éléments entendus** (manuel p. 47-48). 5a Chiffres /21 (7 séries × 3 pt, −1 pt par chiffre manquant). 5b Syllabes /24 (8 séries × 3 pt). **Abandon possible** : si après 3 items le sujet répète moins de 4 chiffres/syllabes (p. 49). 5c Stroop lettres /32 (10+12+10, JUPON vert / FRAISE rouge / 15879 rouge) **complémentaire (qualitatif, ne fait pas partie du score d'épreuve)** — déclenché si 5a < 12 OU 5b < 14 OU abandon en cours (p. 49). | Mise à jour de la MdT |
| 06 | Problème arithmétique | 10 (6 raisonnement + 4 calcul) | **3 problèmes selon NSC (manuel p. 53, 91)** : NSC 1 = La Voiture (essence, réponse "26 litres de trop") ; NSC 2 = Le Restaurant (réponse "15 € le menu") ; NSC 3 = La Fondue (Gruyère 600g / Comté 600g / Vacherin 300g). −2 pt / erreur de raisonnement ou omission d'info, −3 pt si aide. **Calcul + raisonnement notés à l'appréciation de l'examinateur** (p. 54). | Planification + MdT en numérique |
| 07 | Problème logique « Luria » | 10 (4+2+2+2) | **3 problèmes selon NSC (manuel p. 58, 92)** : NSC 1 = Léo (Q1 = 14 ans, Q2 = Non, Q3 = Oui, Q4 = Non) ; NSC 2 = Cédric & Diane ; NSC 3 = Hélène. 4 pt Q1, 2 pt chacune Q2/Q3/Q4. −3 pt si aide. **Piège textuel exact** (manuel p. 60) : *"le terme 'plus' est associé à une opération d'addition alors que dans la phrase 'avoir 10 ans de plus que', il faut soustraire les 10 ans quand on calcule l'année de naissance"*. | Raisonnement abstrait + inhibition |
| 08 | Sudofex | 22 | Essai MIREILLE obligatoire (non scoré, fait à deux). Puis grille MARIE en entrée par défaut. **ANNICK n'est PAS le point d'entrée par défaut** — c'est un repli si MIREILLE pas compris OU plus de 5 erreurs / abandon sur MARIE (p. 63). **GUILLAUME** = niveau supérieur si MARIE bien réussie. Scoring : Annick = 0,5 (contenu) + 0,5 (couleur) = 1 pt × 8 cases = **8 pt** ; Marie = 1 + 1 = 2 pt × 8 cases = **16 pt** ; Guillaume = 1 + 1 = 2 pt × 11 cases = **22 pt**. **Effet Stroop** : sur MARIE chaque nom de couleur est écrit dans une couleur FIXE (mapping mot→couleur stable, p. 64) ; sur GUILLAUME chaque nom n'est jamais écrit deux fois dans la même couleur (mapping VARIABLE → effet Stroop majoré, p. 65). **Seule la meilleure grille compte** (p. 65). −3 pt aide partielle, −6 pt aide majeure. | Inhibition + raisonnement logique en grille |
| 09 | Équivalences | 20 | Essai LUNES obligatoire (réponses : 6 lunes / 12 nuages / Faux / Faux). **Si scolarité < 10 ans → renoncer à l'épreuve, même si LUNES est OK** (manuel p. 75 — la scolarité prime sur l'essai). Subtests : Formes (4 items × 2 pt = 8) / Feux (6 items × 2 pt = 12) / Étoiles (6 items × 3 pt = **18**) / Flèches (4 items, scoring **PROGRESSIF** : item 1 = 2 pt, item 2 = 4 pt, item 3 = 6 pt, item 4 = 8 pt, total 20 pt — manuel p. 74, 86). **Seul le meilleur subtest compte.** −3 pt aide partielle, −6 pt aide majeure. | Raisonnement analogique + inhibition |
| 10 | Itinéraire | 20 | Contexte : plan du village de Buxy, infirmière qui doit faire des prélèvements, passe par école pour son fils, dépose les analyses au labo (manuel p. 78). 2 pt par consigne respectée (passages + sens interdits + école + labo). Malus libre si aide ou trajet trop long. Ciblée pour NSC 1 (alternative à l'ép. 09) et NSC 3 en confirmation seulement (peu sensible chez NSC 3 par effet de compensation). | Planification spatiale + MdT visuo-spatiale |

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

#### ZONES D'INTERPRÉTATION — Code couleur officiel HappyNeuron PrediFex (p. 17)

⚠️ **Le manuel PrediFex définit 4 zones** (vs 5 zones du manuel PREDIMEM). Citation manuel p. 17 : *"vert quand les performances se situent dans la norme ou au-dessus de celle-ci, jaune quand les performances se situent entre la moyenne moins un écart-type et demi et la moyenne moins deux écarts-types, orange pour des résultats qui se situent entre la moyenne moins deux écarts-types et la moyenne moins trois écarts types, et rouge pour des résultats effondrés (à partir de la moyenne moins trois écarts-types)"*.

| Zone | Bornes officielles | Interprétation clinique |
|------|--------------------|--------------------------|
| Vert | ≥ M − 1,5σ | Performance dans la norme ou au-dessus |
| Jaune | M − 1,5σ à M − 2σ | **Seuil d'alerte officiel** — fragilité installée |
| Orange | M − 2σ à M − 3σ | Difficulté avérée |
| Rouge | < M − 3σ | Effondrement, difficulté sévère |

**Vocabulaire à utiliser dans le CRBO** (paraphrase clinique ortho.ia, le manuel HappyNeuron ne prescrit pas de vocabulaire officiel autre que "norme ou au-dessus" / "seuil d'alerte" / "effondrés") :
- Vert → "performance préservée"
- Jaune → "fragilité objectivée (seuil d'alerte)"
- Orange → "difficulté avérée"
- Rouge → "effondrement"

---

#### CROISEMENTS D'ÉPREUVES — Profils exécutifs attendus

*Note : la typologie en 6 profils numérotés ci-dessous est une **SYNTHÈSE OPÉRATIONNELLE ortho.ia** dérivée des sections "Analyse" épreuve par épreuve du manuel — le manuel HappyNeuron ne nomme PAS de profils numérotés. Le manuel insiste sur "la cohérence d'ensemble ou la discordance" (p. 18) et propose un "histogramme regroupant tous les résultats" (p. 18) ; il décrit pour chaque épreuve plusieurs types de difficulté à observer mais ne propose pas de typologie clinique fermée.*

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
- **Hypothèse** : fragilité de planification, à compléter par Tour de Londres (cité par le manuel p. 10 ; Tour de Hanoï N'est PAS dans la liste du manuel).

**Profil 4 — Trouble du raisonnement exécutif / inhibition**
- Problème logique Luria + Équivalences + Une syllabe sur deux : Déficitaire.
- Difficulté à inhiber les réponses automatiques en faveur d'un raisonnement analytique.
- **Hypothèse** : fragilité d'inhibition / raisonnement abstrait, à explorer par Stroop, Hayling, TMT.

**Profil 5 — Sujet à haute réserve cognitive (NSC 3) avec plainte subjective**
- Score global dans la zone Vert MAIS proche du seuil M − 1,5σ sur plusieurs épreuves.
- TEMPS d'exécution allongés (au-delà des seuils âge) sur la moitié des épreuves.
- **Hypothèse** : profil compatible avec une fragilité débutante chez un sujet de haute réserve cognitive (population cible PrediFex — manuel p. 1, 11-12 parle textuellement de "réserve cognitive importante" et d'"effet plafond dans la plupart des tests"). Cas clinique typique : *tests classiques normaux malgré plainte cognitive du sujet ou de l'entourage*. Réévaluation à 6-12 mois préconisée (*formulation ortho.ia, le manuel ne propose pas de délai*).

**Profil 6 — Plainte exécutive chez sujet sain (cluster cohérent dans la norme)**
- Toutes les épreuves en zone Vert, temps dans la norme.
- **Hypothèse** : pas de fragilité exécutive objectivée. Rassurer + conseils d'hygiène cognitive. Réévaluation à 12 mois si plainte persiste (*formulation ortho.ia*).

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

8. **Vocabulaire à BANNIR dans le CRBO ortho.ia** (*règle ortho.ia, plus restrictive que le manuel qui utilise lui-même "pathologique" et "syndrome dysexécutif" librement à destination des cliniciens — manuel p. 16, 21, 33, 60*) : "démence", "déclin cognitif", "détérioration", "dégénérescence", "Alzheimer", "syndrome frontal", "syndrome dysexécutif", "pathologique". Préférer "fragilité installée", "difficulté avérée", "performance abaissée par rapport à la norme du groupe".

9. **NSC 1 valide mais vigilance** : PrediFex est étalonné NSC 1 (9-12 ans scolarité). Pour les sujets *sous-NSC 1* (scolarité < 9 ans sans activité compensatoire), l'outil reste trop exigeant — préférer BREF, MoCA, ou un bilan neuropsychologique adapté. L'épreuve 09 Équivalences nécessite ≥ 10 ans scolarité (auteures recommandent de la sauter sinon, et de privilégier l'épreuve 10 Itinéraire).

10. **Le titre de la synthèse est "Hypothèse de diagnostic"**, JAMAIS "Diagnostic" (*convention rédactionnelle ortho.ia ; le manuel parle textuellement d'"hypothèses diagnostiques" p. 14 mais n'impose pas de titre figé*).

---

#### 🔒 OVERRIDES TOOL-SCHEMA — Sections CRBO standard adaptées adulte

Le tool-schema impose des formats centrés enfant/scolaire. Pour PrediFex (dépistage exécutif adulte, NSC 1 à 3, sans école), les sections suivantes du CRBO sont SURCLASSÉES :

**1. \`diagnostic\` — OVERRIDE** : le tool-schema impose le format strict *"trouble spécifique des apprentissages en langage écrit (communément appelé dyslexie-dysorthographie), forme [légère/modérée/sévère/compensée]"*. **CETTE INSTRUCTION NE S'APPLIQUE PAS À PrediFex** (bilan cognitif adulte, pas un trouble d'apprentissage enfant). On SURCLASSE en :
- Titre : "**Hypothèse de diagnostic**" (jamais "Diagnostic").
- Contenu : prose modalisée — *"le profil exécutif observé est compatible avec…"*, *"ces éléments suggèrent une fragilité de…"*, *"à confirmer / caractériser par un bilan neuropsychologique approfondi"*.
- JAMAIS la formule "trouble spécifique des apprentissages en langage écrit / dyslexie-dysorthographie / forme légère-modérée-sévère-compensée" — non pertinente pour un bilan exécutif adulte.
- JAMAIS de diagnostic étiologique (Alzheimer, démence frontotemporale, MCI, etc. — règle clinique absolue n°1).

**2. \`recommandations\` — OVERRIDE** : le tool-schema impose la phrase 1 verbatim *"Une prise en charge orthophonique est recommandée, et en parallèle la mise en place ou le renforcement des aménagements en classe."* **CETTE INSTRUCTION NE S'APPLIQUE PAS À PrediFex** (adulte, pas d'école). On SURCLASSE avec ces phrases-types adultes (*formulations dérivées des bonnes pratiques cliniques françaises*) :
- **Aucun seuil d'alerte franchi (toutes zones Vert)** : *"Le dépistage PrediFex ne met pas en évidence de fragilité exécutive objectivable à ce stade. Une réévaluation à 12 mois est envisageable si la plainte persiste ou évolue. Conseils d'hygiène cognitive proposés."*
- **Une ou plusieurs épreuves en zone Jaune isolément** : *"Le dépistage PrediFex met en évidence des performances en zone d'alerte sur [composantes exécutives concernées]. Une réévaluation à 6 mois est préconisée pour suivre l'évolution."*
- **Profil cohérent de fragilité (≥ 2 épreuves convergentes en Jaune/Orange/Rouge)** : *"Le dépistage PrediFex met en évidence un profil [flexibilité / mise à jour / planification / inhibition / raisonnement exécutif] à caractériser plus finement. **Un bilan neuropsychologique approfondi est recommandé**, ainsi qu'une consultation mémoire spécialisée. Selon l'orientation diagnostique, une rééducation orthophonique des stratégies cognitives pourra être proposée en parallèle."*

**3. \`pap_suggestions\` — OVERRIDE OBLIGATOIRE** : le tool-schema demande 4-6 aménagements scolaires. **CETTE INSTRUCTION NE S'APPLIQUE PAS À PrediFex** — pas d'école pour un adulte. **Retourner OBLIGATOIREMENT \`pap_suggestions = []\`** (tableau vide). Le rendu Word saute la section automatiquement quand le tableau est vide.

**4. \`bilans_complementaires\` — OVERRIDE catégories adultes** : les catégories listées dans le tool-schema sont enfant/scolaire (Psychomotricité, Orthoptie, Pédopsychiatrie, CRTLA…). Pour PrediFex (adulte), utiliser ces catégories spécifiques (1 ligne par catégorie, **format strict** \`"Catégorie : justification clinique courte pointant l'indice du bilan"\`) :
- **Neurologie** : profil exécutif convergent évoquant une atteinte neurologique débutante (démence frontotemporale, Parkinson cognitif, lésions sous-corticales à explorer par consultation spécialisée + imagerie).
- **Gériatrie / Consultation mémoire** : sujet > 60 ans avec fragilités convergentes — orientation prioritaire.
- **Neuropsychologie** : profil exécutif nécessitant un bilan approfondi (TMT A/B, WCST, Stroop, Hayling, Tour de Londres, BADS, Brixton, doubles tâches TAP, California Sorting Test).
- **Psychiatrie adulte / psychologue clinicien** : si éléments dépressifs/anxieux suspectés susceptibles d'expliquer le tableau exécutif (pseudo-démence dépressive à éliminer).
- **Médecine du travail** : si le sujet est en activité professionnelle et la plainte exécutive impacte le poste de travail (décisions complexes, planification, multitâche).
- **PREDIMEM** : complémentaire si fragilité mnésique suspectée associée (gamme PREDI cohérente pour un bilan adulte complet).
Liste VIDE \`[]\` si aucun élément clinique ne justifie une orientation pluridisciplinaire (cas profil 6 sujet sain). **NE JAMAIS lister** Pédopsychiatrie, CRTLA, Orthoptie scolaire, Ergothérapie scolaire — sans pertinence adulte.

**5. \`difficultes_identifiees\` — OVERRIDE conséquences adultes** : le tool-schema dit *"se terminer sur les conséquences concrètes scolaires et de la vie quotidienne pour l'élève"*. Pour PrediFex (adulte), reformuler en **conséquences fonctionnelles AU QUOTIDIEN ET PROFESSIONNELLES** : ralentissement dans la prise de décision complexe, difficulté à planifier les tâches longues, oubli des étapes d'une recette ou d'un dossier, fatigue cognitive en fin de journée, gestion compromise des situations de multitâche, baisse de performance au travail sur des dossiers exigeants. JAMAIS "élève", "scolaire", "en classe", "écolier".

---

#### TRANSPOSITION VERS LE CRBO ORTHO.IA

PrediFex n'utilise pas de percentiles continus (notes standard / z-scores sigma-based). Pour l'intégrer dans la structure CRBO :

- **\`score\`** = score brut au format "X/Y" (ex: "23/30").
- **\`et\`** = écart en notes standard ou en sigma par rapport à la moyenne du groupe (ex: "−1,8 σ"). null si non disponible.
- **\`percentile\`** = laisser vide ('') ou indiquer la zone HappyNeuron (ex: "Zone jaune", "Seuil d'alerte"). PrediFex ne donne pas de percentile au sens classique.
- **\`percentile_value\`** : valeur calibrée pour la couleur d'arrière-plan du tableau Word. **PrediFex a OFFICIELLEMENT 4 ZONES** (manuel p. 17, contrairement à PREDIMEM qui en a 5) — on saute volontairement la zone Laurie "Moyenne haute" (vert clair P50-75) ET la zone "Moyenne basse" (jaune P26-49) qui n'existent pas dans HappyNeuron PrediFex. **Jaune HappyNeuron = seuil d'alerte clinique** (fragilité installée), équivalent en sévérité à "Zone de fragilité" Laurie et NON à "Moyenne basse" Laurie (cette dernière reste "norme un peu basse, OK" en Exalang) :
  - **Vert HappyNeuron** (≥ M − 1,5σ, "dans la norme ou au-dessus" — manuel p. 17) → \`percentile_value\` = **85** (cellule fond vert foncé Laurie "Excellent")
  - **Jaune HappyNeuron** (M−1,5σ à M−2σ, **SEUIL D'ALERTE OFFICIEL**) → \`percentile_value\` = **18** (cellule fond orange clair Laurie "Zone de fragilité" — la sévérité du seuil d'alerte exécutif colle à "Zone de fragilité", PAS à "Moyenne basse" qui sous-évaluerait l'alerte)
  - **Orange HappyNeuron** (M−2σ à M−3σ, difficulté avérée) → \`percentile_value\` = **8** (cellule fond orange foncé Laurie "Difficulté")
  - **Rouge HappyNeuron** (< M−3σ, effondrement) → \`percentile_value\` = **3** (cellule fond rouge Laurie "Difficulté sévère")
  Ces valeurs ne sont PAS des percentiles cliniques au sens classique (PrediFex est sigma-based, pas percentile-based) — ce sont des codes-couleurs pour piloter le shading Word, alignés sur la sémantique clinique HappyNeuron (et non sur la grille Exalang).
- **\`interpretation\`** : utiliser **OBLIGATOIREMENT** le vocabulaire HappyNeuron retranscrit ci-dessous, JAMAIS les étiquettes percentile-based Exalang ("Excellent / Moyenne haute / Moyenne basse / Zone de fragilité / Difficulté / Difficulté sévère") qui n'ont pas de sens pour ce protocole sigma-based (instruction surclassée par l'instruction "6 zones par défaut" du \`tool-schema\` qui ne s'applique pas à PrediFex) :
  - Vert → "performance préservée"
  - Jaune → "fragilité objectivée (seuil d'alerte)"
  - Orange → "difficulté avérée"
  - Rouge → "effondrement"
  *Précision rédactionnelle : ce vocabulaire est une paraphrase clinique transposée pour le CRBO, fidèle à l'esprit du manuel HappyNeuron qui n'évoque textuellement que "norme ou au-dessus" (vert), "seuil d'alerte" (jaune) et "effondrés" (rouge) — manuel p. 17.*
- **\`commentaire\`** du domaine ou de l'épreuve : OBLIGATOIRE pour PrediFex. Doit intégrer le score + le temps + l'observation qualitative + la lecture en lien avec les autres épreuves du protocole.

---

#### ARTICULATION AVEC D'AUTRES OUTILS

**Cités explicitement par le manuel PrediFex (p. 10)** :
- **Inhibition** : Stroop, Go/No-go, Hayling
- **Flexibilité** : Fluences (Cardebat), TMT A/B
- **Catégorisation** : Wisconsin Card Sorting Test, California Sorting Test
- **Déduction de règles** : Test de Brixton
- **Attention / MdT** : Doubles tâches TAP, Empan envers / croissant
- **Planification** : Tour de Londres (*Tour de Hanoï N'EST PAS dans la liste manuel*)
- **Tests écologiques** : BADS (Tâche 6 éléments, test du zoo), Tâche d'organisation d'une soirée, Test des commissions
- **Gamme PREDI complémentaire** (manuel p. 27, 33, 41, 61) : **PREDILAC** (langage), **PREDILEM** (mémoire — souvent confondu, c'est l'ancien nom de la version Lecture/Mémoire ; à ne pas confondre avec PREDIMEM mémoire), **PREDIMEM** (mémoire).

**Compléments d'usage clinique courant (non cités par le manuel)** : MoCA, MMSE, BREF (Frontal Assessment Battery) en amont comme screenings globaux ; bilan neuropsychologique complet, IRM avec analyse frontale et sous-corticale, bilan biologique en aval. À utiliser en complément, sans présenter comme "recommandation manuel".

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
