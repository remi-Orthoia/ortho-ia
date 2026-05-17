import type { TestModule } from './types'

/**
 * Module PREDIMEM — PRotocole d'Evaluation et de Dépistage des
 * Insuffisances de la MEMoire.
 *
 * Source : manuel officiel HappyNeuron 2019 (Annick Duchêne & Marie
 * Jaillard, préface du Dr Bernard Croisile, Hôpital Neurologique de Lyon).
 *
 * Validation : 508 sujets-témoins (5 tranches d'âge × 3 niveaux
 * socio-culturels). Étalonnage statistique sur SPSS, seuil d'alerte à
 * **−1,5 écart-type** (M − 1,5 σ) de la moyenne du groupe d'appartenance
 * (âge × NSC) — c'est le seuil officiel ci-dessous duquel les performances
 * sont considérées pathologiques.
 *
 * PREDIMEM est un protocole de DÉPISTAGE conçu pour identifier des
 * insuffisances mnésiques SUBTILES chez l'adulte, y compris à haut niveau
 * de réserve cognitive (NSC 3). Il s'inscrit dans la gamme PREDI
 * (PREDILEM, PREDILAC, PREDIMEM) qui répond aux plaintes cognitives chez
 * des sujets dont les déficits ne sont pas encore objectivables par les
 * batteries classiques (effet plafond).
 */
export const predimem: TestModule = {
  nom: 'PREDIMEM',
  editeur: 'HappyNeuron',
  auteurs: 'Annick Duchêne & Marie Jaillard',
  annee: 2019,
  domaines: [
    'Mémoire visuelle (objets, formes, visages, spatiale)',
    'Mémoire épisodique verbale (texte lu / texte entendu)',
    'Mémoire de travail',
    'Mémoire auditive (bruits + auditivo-verbale)',
    'Associations sémantiques (épisodique sur entrée imagée)',
  ],
  epreuves: [
    "01 — Mémoire visuelle d'objets (rappel /25 + reconnaissance /25)",
    '02 — Mémoire d\'un texte LU (rappel /12 + choix du résumé /8)',
    '03 — Mémoire de travail (subtest 3a /24 + subtest 3b /22, total /46)',
    '04 — Blasons (mémoire visuelle constructive /64)',
    '05 — Tangram (mémoire visuo-spatiale + visuo-constructive /16)',
    '06 — Associations sémantiques (animaux + objets + logos /46)',
    '07 — Mémoire d\'un texte ENTENDU (rappel /12 + choix du résumé /8)',
    '08 — Mémoire visuelle de formes complexes (rosaces + idéogrammes /20)',
    '09 — Mémoire auditive (6 bruits /12 + 4 phrases /40)',
    '10 — Mémoire spatiale (parcours de cailloux /36)',
    '11 — Mémoire de visages (portraits peints + photos /20)',
  ],
  regles_specifiques: `### PREDIMEM — Protocole d'évaluation et de dépistage des insuffisances de la mémoire (Duchêne & Jaillard, HappyNeuron 2019)

**Nature du test (CRITIQUE)** : PREDIMEM est un **outil de DÉPISTAGE** orienté mnésique, destiné à identifier des **fragilités subtiles** chez l'adulte (18-90 ans). Il est conçu pour saisir des troubles qui échappent aux batteries classiques en raison de l'effet plafond — particulièrement pertinent chez les sujets à **haute réserve cognitive** (NSC 3). **PREDIMEM n'établit aucun diagnostic étiologique** (Alzheimer, MCI, démence sémantique, APP, etc.) ; il ouvre des **hypothèses cliniques** à confirmer par un bilan neuropsychologique approfondi et une imagerie cérébrale.

**Population cible** : adultes 18-90 ans, tous niveaux socio-culturels (NSC 1 à 3), présentant une plainte mnésique ou repérés cliniquement (suite d'AVC, TC, pathologies neurodégénératives débutantes, MCI suspecté, séquelles diverses).

**Compétences requises de l'examinateur** : orthophoniste, neuropsychologue ou neurologue. L'analyse repose sur le croisement de plusieurs épreuves — **JAMAIS un verdict sur une épreuve isolée**.

---

#### STRATIFICATION OBLIGATOIRE — Tranche d'âge × NSC

Toutes les normes PREDIMEM sont stratifiées :

| Tranche d'âge | Bornes |
|---------------|--------|
| 1 | 18 – 49 ans |
| 2 | 50 – 59 ans |
| 3 | 60 – 69 ans |
| 4 | 70 – 79 ans |
| 5 | 80 – 90 ans (effectifs plus faibles, prudence) |

| NSC | Niveau socio-culturel |
|-----|------------------------|
| 1   | ≤ scolarité 12 ans (CAP, BEP, Brevet, Certificat d'études) |
| 2   | Bac à Bac+3 inclus |
| 3   | ≥ Bac+4 (cadre, ingénieur, professions à forte réserve cognitive) |

**Seuil d'alerte officiel** : score < **moyenne − 1,5 écart-type** du groupe (âge × NSC). Le logiciel HappyNeuron affiche le verdict automatiquement — c'est cette valeur qui fait foi, pas un estimé "à la louche".

---

#### LES 11 ÉPREUVES — Cotation, score max, objectif clinique

| N° | Épreuve | Score max | Cible cognitive |
|----|---------|-----------|-----------------|
| 01 | Mémoire visuelle d'objets — rappel libre /25 (1 pt par objet, −1 pt si intrusion) + reconnaissance différée /25 (1 pt si reconnu du 1er coup) + **optionnelle /30 si rappel libre < 8** : reconnaissance verbale parmi 30 mots dont 10 cibles (10 objets non rappelés présentés oralement). Cette épreuve optionnelle n'entre PAS dans les résultats quantitatifs mais permet de dissocier encodage vs récupération. | 25 + 25 | Mémoire épisodique sur entrée visuelle imagée |
| 02 | Mémoire d'un texte LU — rappel /12 + choix de résumé /8. **Texte choisi selon NSC** : NSC 1 = « Aline » (court), NSC 2 = « Travers » (intermédiaire), NSC 3 = « Lapissoire » (long, lexique soutenu). Le logiciel sélectionne automatiquement le texte adapté. | 20 | Mémoire épisodique verbale + compréhension textuelle écrite |
| 03 | Mémoire de travail — subtest 3a (alternance lettre/chiffre, 3 items : BOL-531, PLUS-4692, PIANO-71348) /24 + 3b (alternance avec mise en ordre alphabétique/croissant, 2 items : GRADE-48237, POLICE-527649) /22. **3b uniquement si 3a ≥ 18 points.** Pénalités : −2 pts par redemande complète, −1 pt par redemande partielle, −2 pts si aide pour se retrouver. | 46 | Mémoire de travail haut niveau, administrateur central |
| 04 | Blasons — 4 blasons reconstruits successivement (rappel immédiat à chaque fois) : blason 1 /14, blason 2 /16, blason 3 /18, blason 4 /16 | 64 | Mémoire visuelle court terme + visuo-construction |
| 05 | Tangram — reconnaissance du chat (2 pts) + pièces en trop ou manquantes sur 3 planches | 16 | Mémoire spatiale + visuo-construction + planification |
| 06 | Associations sémantiques — animaux /16 + objets /16 + logos /14 (subtests indépendants). Indiçage sémantique progressif. | 46 | Mémoire épisodique sur indiçage sémantique |
| 07 | Mémoire d'un texte ENTENDU — rappel /12 + choix de résumé /8. **Texte choisi selon NSC** (mêmes 3 textes que l'épreuve 02 mais entendus au lieu de lus). | 20 | Mémoire épisodique verbale + compréhension orale |
| 08 | Mémoire visuelle de formes complexes — rosaces /10 + idéogrammes /10 | 20 | Mémoire visuelle pure (formes non sémantisables) |
| 09 | Mémoire auditive — 6 bruits /12 (2 pts par bruit reconnu) + 4 phrases /40 | 52 | Mémoire auditive non verbale + boucle phonologique |
| 10 | Mémoire spatiale — parcours de 4 cailloux /16 + 5 cailloux /20. **Préalable : vérifier l'absence d'héminégligence et d'apraxie constructive** avant d'interpréter en termes mnésiques. | 36 | Mémoire spatiale courte/visuo-spatiale |
| 11 | Mémoire de visages — portraits peints /10 + photos /10 (2 pts par visage reconnu du 1er coup, 0 pour 2e choix) | 20 | Mémoire de visages (reconnaissance) |

**Temps** : chaque épreuve est chronométrée (à l'insu du sujet). Un seuil de temps d'alerte est donné par le logiciel — un sujet peut obtenir un score correct EN TEMPS PATHOLOGIQUE (lenteur de traitement). **Cet aspect doit être systématiquement reporté dans le commentaire** : il signe souvent une fragilité sub-clinique avant que le score lui-même ne décroche.

---

#### ZONES D'INTERPRÉTATION — Code couleur officiel HappyNeuron

Le logiciel applique 5 zones colorées en fonction de l'écart à la moyenne du groupe :

| Zone | Bornes | Interprétation clinique |
|------|--------|--------------------------|
| Vert foncé | ≥ M | Performance dans la norme ou au-dessus |
| Vert clair | M − 1σ à M − 1,5σ | Performance correcte, légèrement abaissée |
| Jaune | M − 1,5σ à M − 2σ | **Seuil d'alerte officiel** — fragilité installée à explorer |
| Orange | M − 2σ à M − 3σ | Difficulté avérée |
| Rouge | < M − 3σ | Effondrement, difficulté sévère |

**Vocabulaire à utiliser dans le CRBO** (cohérent avec la palette du Word d'ortho-ia, sans plaquer les zones percentile-based) :
- Zone vert foncé → "performance préservée"
- Zone vert clair → "performance dans la moyenne basse, à surveiller"
- Zone jaune → "fragilité objectivée"
- Zone orange → "difficulté avérée"
- Zone rouge → "effondrement"

---

#### CROISEMENTS D'ÉPREUVES — Profils cliniques attendus

PREDIMEM se LIT en CROISÉ. Les profils suivants orientent l'**hypothèse de diagnostic** (jamais un diagnostic ferme).

**Profil 1 — Trouble d'encodage**
- Épreuves typiquement abaissées : 01 (rappel /25 ET reconnaissance /25), 02/07 (rappel des textes), 06 (associations).
- Si la reconnaissance ET le rappel sont touchés, on évoque un trouble d'**encodage / consolidation** (le sujet n'a pas réussi à stocker).
- Croisement à confirmer : pauvre bénéfice à l'indiçage sur la version optionnelle 1a (30 mots).
- **Hypothèse** : à explorer en bilan neuropsy approfondi pour caractériser une éventuelle atteinte hippocampique débutante. Aucun diagnostic à poser depuis PREDIMEM.

**Profil 2 — Trouble de récupération**
- Épreuve 01 rappel /25 abaissé MAIS reconnaissance /25 dans la norme.
- Épreuve 06 associations : score correct quand la planche b est sous les yeux (= indiçage visuel facilite le rappel).
- Épreuves 02/07 : rappel libre faible MAIS choix de résumé correct.
- **Hypothèse** : profil compatible avec un trouble de récupération, encodage préservé. Évoque cliniquement une fragilité sous-cortico-frontale, à caractériser en bilan neuropsy. Ne pas nommer d'étiologie.

**Profil 3 — Trouble de mémoire de travail**
- Épreuve 03 : score ≥ seuil d'alerte au subtest 3a OU effondrement au 3b.
- Épreuve 09 phrases : pertes morphologiques ou lexicales lors de la répétition.
- Épreuves 02/07 : le sujet "perd le fil" du texte au fur et à mesure.
- **Hypothèse** : profil de fragilité de la mémoire de travail, à confronter à l'empan envers classique. Souvent associé à des atteintes attentionnelles / exécutives.

**Profil 4 — Trouble visuo-spatial / visuo-constructif**
- Épreuves 04 (blasons), 05 (tangram), 10 (spatiale) significativement abaissées.
- Épreuve 08 (formes complexes) peut suivre.
- **Hypothèse** : difficulté de mémoire visuo-spatiale, à différencier d'une apraxie constructive ou d'une héminégligence par croisement avec figure de Rey et tests de gnosies. Référer en neuropsy.

**Profil 5 — Sujet à haute réserve cognitive (NSC 3) avec plainte subjective**
- Le sujet est dans la norme générale MAIS plusieurs épreuves se situent en zone vert clair (M − 1σ).
- TEMPS d'exécution allongés sur la moitié des épreuves.
- **Hypothèse** : profil compatible avec une fragilité débutante chez un sujet de haute réserve cognitive — c'est précisément la population cible de PREDIMEM. Préconiser une réévaluation à 6-12 mois et un bilan neuropsy si la plainte persiste.

**Profil 6 — Plainte mnésique chez sujet sain (cluster cohérent dans la norme)**
- Toutes les épreuves se situent en vert foncé.
- Les temps sont dans la norme.
- **Hypothèse** : pas de fragilité mnésique objectivée au protocole PREDIMEM. Rassurer la personne. Préconiser des conseils d'hygiène cognitive et une réévaluation à 12 mois si la plainte persiste.

---

#### ⛔ RÈGLES CLINIQUES ABSOLUES — PREDIMEM

Ces règles s'ajoutent aux règles cliniques globales du système.

1. **NE JAMAIS poser de diagnostic étiologique** : maladie d'Alzheimer, MCI (Mild Cognitive Impairment), démence sémantique, aphasie primaire progressive, démence frontotemporale, maladie à corps de Lewy, syndrome de Benson, Parkinson cognitif, SEP, etc. **PREDIMEM ne le permet pas seul** — la confirmation passe par le neurologue / gériatre avec imagerie cérébrale et bilan neuropsychologique étendu.
   - ❌ "Profil compatible avec une maladie d'Alzheimer débutante"
   - ❌ "Mild Cognitive Impairment probable"
   - ✅ "Le profil de mémoire épisodique observé ouvre la piste d'une fragilité d'encodage à explorer plus finement en bilan neuropsychologique."

2. **NE JAMAIS spéculer sur la localisation cérébrale** (hippocampique, frontale, sous-corticale, temporo-pariétale, etc.). Décrire le PROFIL FONCTIONNEL, pas la lésion suspectée.
   - ❌ "Atteinte hippocampique évocatrice"
   - ✅ "Difficultés au rappel libre comme à la reconnaissance évoquant une fragilité de consolidation, à caractériser."

3. **TOUJOURS rappeler le statut de DÉPISTAGE** dans la synthèse : "Cette évaluation est un dépistage : elle ouvre des hypothèses cliniques et oriente vers des investigations complémentaires."

4. **TOUJOURS croiser au moins 2-3 épreuves** avant de conclure à une fragilité. Un score isolé bas n'est pas un argument suffisant — particulièrement en NSC 3 où la variance interindividuelle est grande.

5. **TOUJOURS reporter les TEMPS d'exécution** dans le commentaire. Un score normal avec un temps pathologique est un marqueur sub-clinique majeur, surtout chez les sujets jeunes ou à haute réserve cognitive.

6. **TOUJOURS mentionner les domaines PRÉSERVÉS EN PREMIER**, puis les fragilités. Respect de la personne évaluée + lecture clinique équilibrée.

7. **Formuler en impact FONCTIONNEL concret** au quotidien : "difficulté à retenir une consigne médicale après quelques minutes", "lenteur d'organisation pour planifier une activité complexe", "ralentissement notable de la réponse en conversation". JAMAIS en vocabulaire diagnostique étiologique.

8. **Vocabulaire à BANNIR** (le CRBO peut être lu par le patient et sa famille) :
   - "démence", "déclin cognitif", "détérioration", "dégénérescence",
   - "Alzheimer", "MCI", "trouble neuro-cognitif majeur/léger",
   - "atteinte sévère" (préférer "difficulté avérée" / "fragilité installée"),
   - "pathologique" (préférer "abaissée par rapport à la norme du groupe").

9. **Pas de PAP / aménagements scolaires** : PREDIMEM concerne presque toujours des adultes hors cadre scolaire. Si la table \`pap_suggestions\` doit être remplie, la laisser vide (\`[]\`).

10. **Le titre de la synthèse est "Hypothèse de diagnostic"**, JAMAIS "Diagnostic" (cohérence avec le rendu MoCA d'ortho-ia, par sécurité juridique).

---

#### TRANSPOSITION VERS LE CRBO ORTHO.IA

PREDIMEM n'utilise pas de percentiles continus (notes standards / z-scores sigma-based). Pour l'intégrer dans la structure CRBO :

- **\`score\`** = score brut au format "X/Y" (ex: "23/25", "11/12").
- **\`et\`** = ÉCART en notes standard ou en sigma par rapport à la moyenne du groupe d'appartenance, si fourni par le logiciel (ex: "−1,2 σ", "M − 0,8"). null si non disponible.
- **\`percentile\`** = laisser vide ('') ou indiquer la zone HappyNeuron (ex: "Zone vert clair", "Seuil d'alerte"). PREDIMEM ne donne pas de percentile au sens classique.
- **\`percentile_value\`** : encoder une valeur calibrée pour que la couleur d'arrière-plan du tableau Word matche la zone HappyNeuron du sujet (les seuils du moteur Word sont alignés Exalang : ≥75 → Moyenne haute vert foncé, 26-74 → Moyenne vert clair, 10-25 → Zone de fragilité jaune, 5-9 → Difficulté orange, <5 → Difficulté sévère rouge) :
  - **Vert foncé HappyNeuron** (≥ M) → \`percentile_value\` = **85** (cellule fond vert foncé "Moyenne haute")
  - **Vert clair HappyNeuron** (M−1σ à M−1,5σ) → \`percentile_value\` = **50** (cellule fond vert clair "Moyenne")
  - **Jaune HappyNeuron** (M−1,5σ à M−2σ, seuil d'alerte) → \`percentile_value\` = **18** (cellule fond jaune "Zone de fragilité")
  - **Orange HappyNeuron** (M−2σ à M−3σ, difficulté avérée) → \`percentile_value\` = **7** (cellule fond orange "Difficulté")
  - **Rouge HappyNeuron** (< M−3σ, effondrement) → \`percentile_value\` = **3** (cellule fond rouge "Difficulté sévère")
  Ces valeurs ne sont PAS des percentiles cliniques au sens classique — ce sont des codes-couleurs pour aligner le rendu Word sur la palette HappyNeuron officielle.
- **\`interpretation\`** : utiliser le vocabulaire HappyNeuron retranscrit dans le tableau ci-dessus ("performance préservée", "fragilité objectivée", etc.). Ne PAS plaquer les étiquettes percentile-based "Excellent / Fragilité / Difficulté sévère" qui n'ont pas de sens pour ce protocole.
- **\`commentaire\`** du domaine ou de l'épreuve : OBLIGATOIRE pour PREDIMEM. Doit intégrer le score + le temps + l'observation qualitative + la lecture en lien avec les autres épreuves du protocole.

---

#### STRUCTURE ATTENDUE DU CRBO PREDIMEM

1. **Anamnèse** : motif de consultation cognitive (plainte mnésique du sujet ou alerte de l'entourage, suivi post-AVC / TC, suspicion neurodégénérative), antécédents médicaux pertinents (vasculaires, dépression, sommeil, médicaments à risque cognitif), niveau scolaire (NSC) et profession (réserve cognitive pré-morbide).

2. **Domaines / épreuves** : organiser les 11 épreuves dans des regroupements logiques (Mémoire visuelle, Mémoire épisodique verbale, Mémoire de travail, Mémoire auditive, Associations). Pour chaque épreuve : score, temps, position dans les zones HappyNeuron, observation qualitative.

3. **Synthèse / Hypothèse de diagnostic** :
   - Statuer d'abord sur les domaines PRÉSERVÉS.
   - Décrire ensuite les fragilités OBJECTIVÉES (≥ 2 épreuves convergentes minimum).
   - Référer à un profil clinique attendu (cf. profils 1 à 6 ci-dessus) en formulant avec un verbe de modalisation : "le profil observé est compatible avec…", "ces éléments suggèrent une fragilité de…", "à confirmer / caractériser par un bilan neuropsychologique approfondi".
   - JAMAIS de diagnostic étiologique.

4. **Recommandations** — phrases-types pour PREDIMEM :
   - Si aucun seuil d'alerte franchi (toutes épreuves en zone verte) : "Le dépistage PREDIMEM ne met pas en évidence de fragilité mnésique objectivable à ce stade. Une réévaluation à 12 mois est envisageable si la plainte persiste ou évolue. Conseils d'hygiène cognitive proposés."
   - Si une ou plusieurs épreuves en zone jaune isolément : "Le dépistage PREDIMEM met en évidence des performances en zone d'alerte sur [domaines]. Une réévaluation à 6 mois est préconisée pour suivre l'évolution."
   - Si profil cohérent de fragilité (≥ 2 épreuves convergentes en zone jaune/orange/rouge) : "Le dépistage PREDIMEM met en évidence un profil [trouble d'encodage / récupération / mémoire de travail / visuo-spatial] à caractériser plus finement. **Un bilan neuropsychologique approfondi est recommandé**, ainsi qu'une consultation mémoire spécialisée. Selon l'orientation diagnostique, une rééducation orthophonique des stratégies cognitives pourra être proposée en parallèle."

5. **Articulation avec d'autres outils** :
   - En amont : MoCA, MMSE (screenings globaux).
   - En complément : RL/RI 16, DMS 48, Doors and people, figure de Rey, cubes de Corsi, empan envers, fluences de Cardebat ou GREMOTs.
   - En aval : bilan neuropsychologique complet (consultation mémoire), imagerie cérébrale (IRM avec coupes coronales hippocampiques), bilan biologique selon orientation.

---

#### À NE JAMAIS FAIRE EN PREDIMEM

- ❌ Conclure depuis une seule épreuve isolée.
- ❌ Poser un diagnostic d'Alzheimer, MCI, démence sémantique, APP, démence frontotemporale, etc.
- ❌ Spéculer sur la localisation cérébrale (hippocampique, frontale, sous-corticale…).
- ❌ Ignorer les temps d'exécution — un score normal en temps pathologique est un marqueur sub-clinique.
- ❌ Plaquer les zones percentile-based Exalang "Excellent / Fragilité / Difficulté sévère" (zones distinctes du protocole HappyNeuron).
- ❌ Utiliser un vocabulaire alarmant ("démence", "déclin", "détérioration").
- ❌ Oublier la stratification âge × NSC — un sujet NSC 3 doit être comparé au groupe NSC 3, pas à la moyenne générale.
- ❌ Recommander une rééducation orthophonique sans orientation neuropsy préalable en cas de profil neurodégénératif suspecté.

#### TOUJOURS FAIRE EN PREDIMEM

- ✅ Croiser au moins 2-3 épreuves avant de retenir une fragilité.
- ✅ Mentionner les domaines préservés EN PREMIER.
- ✅ Reporter SCORE + TEMPS systématiquement.
- ✅ Référer au profil clinique attendu (1 à 6) en formulant en hypothèse.
- ✅ Adapter le ton : le CRBO est lu par le patient et sa famille — neutralité, respect, pédagogie.
- ✅ Orienter vers le neurologue / gériatre / neuropsy en cas de profil convergent.
- ✅ Préconiser une réévaluation à 6-12 mois quand la plainte persiste sans déficit objectif.

---

#### PRÉCAUTIONS RÉDACTIONNELLES

- Le CRBO peut être lu par le patient ET sa famille. Pas de formulation alarmante.
- Mentionner systématiquement les compétences préservées avant les déficits.
- Formuler en termes fonctionnels (impact sur la vie quotidienne, autonomie, communication).
- "Hypothèse de diagnostic" en titre de synthèse (PAS "Diagnostic").
- Verbes de modalisation systématiques : "est compatible avec…", "évoque…", "suggère…", "à explorer / caractériser / confirmer".
- Toujours rappeler : "Cette évaluation est un dépistage : elle oriente, elle ne conclut pas."`,
}
