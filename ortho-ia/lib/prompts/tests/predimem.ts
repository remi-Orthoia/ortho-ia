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
| 1   | Scolarité jusqu'à 12 ans (CAP, BEP, Brevet, Certificat d'études). **Minimum requis : 9 ans de scolarité** (manuel ligne 7). Les sujets *sous-NSC 1* (illettrés, scolarité < 9 ans) ne sont **pas** dans le périmètre PREDIMEM. |
| 2   | Bac à Bac+3 inclus |
| 3   | ≥ Bac+4 (cadre, ingénieur, professions à forte réserve cognitive) |

**Seuil d'alerte officiel** : score < **moyenne − 1,5 écart-type** du groupe (âge × NSC). Le logiciel HappyNeuron affiche le verdict automatiquement — c'est cette valeur qui fait foi, pas un estimé "à la louche".

#### CRITÈRES D'EXCLUSION (manuel ligne 201)

Avant de proposer PREDIMEM, vérifier l'absence de :
- **Bilinguisme** (sujet non francophone natif ou usage prédominant d'une autre langue),
- **MMSE < 30** (l'effet plancher rend les résultats peu interprétables — PREDIMEM cible les sujets à effet plafond, pas à effet plancher),
- **Pathologie neurologique avérée déjà documentée** (PREDIMEM est un outil de DÉPISTAGE de novo, pas de suivi),
- **Plainte mnésique préalable formalisée avec autre bilan en cours** (croiser les passations risque de fausser la lecture).

Si l'un de ces critères est présent, mentionner explicitement la limite dans la synthèse du CRBO ("Résultats à interpréter avec prudence : sujet bilingue / MMSE < 30 / …").

---

#### LES 11 ÉPREUVES — Cotation, score max, objectif clinique

| N° | Épreuve | Score max | Cible cognitive |
|----|---------|-----------|-----------------|
| 01 | Mémoire visuelle d'objets — rappel libre /25 (1 pt par objet, −1 pt si intrusion, doublon sans pénalité mais à signaler) + reconnaissance différée /25 ≥ 10 min plus tard (1 pt si reconnu du 1er coup parmi 6 = 1 cible + 5 distracteurs) + **optionnelle /30 si rappel libre < 8** : reconnaissance verbale parmi 30 mots dont 10 cibles non rappelées. **Indiçage catégoriel possible en prolongation** ("il y avait des animaux / moyens de transport / objets qu'on porte sur soi…", manuel ligne 640) pour dissocier stockage vs récupération. L'épreuve optionnelle n'entre PAS dans les résultats quantitatifs. **Observation qualitative à reporter** : signaler quand le sujet dit "j'avais oublié celui-là" (manuel ligne 357) — indicateur de récupération vs stockage. | 25 + 25 | Mémoire épisodique sur entrée visuelle imagée |
| 02 | Mémoire d'un texte LU — rappel /12 (2 pts par info pertinente OU par bonne réponse à une question ouverte) + choix de résumé /8 (8 pts d'emblée, 2 pts en 2e essai, 0 pt mauvais choix), différé ≥ 20 min. **Texte choisi selon NSC** : NSC 1 = « Aline » (court, résumé attendu n°3), NSC 2 = « Travers » (intermédiaire, résumé n°4), NSC 3 = « Lapissoire » (long, lexique soutenu, résumé n°2). **Procédure de rattrapage si incompréhension de la macrostructure** : relecture à deux + décodage avec l'examinateur (manuel ligne 665) — cela change la valeur diagnostique du rappel, à signaler dans le commentaire. | 20 | Mémoire épisodique verbale + compréhension textuelle écrite |
| 03 | Mémoire de travail — subtest 3a (alternance lettre/chiffre, 3 items : BOL-531, PLUS-4692, PIANO-71348) /24 + 3b (alternance avec mise en ordre alphabétique/croissant, 2 items : GRADE-48237, POLICE-527649) /22. **3b uniquement si 3a ≥ 18 points.** **Essais d'entraînement 3b non comptabilisés** : SEL-735 puis (si échec) COL-429 (manuel ligne 943). **Si les 2 essais d'entraînement sont échoués, on N'ADMINISTRE PAS le 3b.** Pénalités : −2 pts par redemande complète, −1 pt par redemande partielle, −2 pts si aide pour se retrouver. Auto-correction acceptée (points conservés). | 46 | Mémoire de travail haut niveau, administrateur central |
| 04 | Blasons — 4 blasons reconstruits successivement (présentation 25 secondes par blason, manuel ligne 1203, rappel immédiat) : blason 1 /14, blason 2 /16, blason 3 /18, blason 4 /16. Cotation par caractéristique (forme, répartition, couleurs, motif central, position du motif, couleur du motif). Étape 3 (couleurs) : 2 pt si bonne couleur ET bien placée, 1 pt si bien choisie mais mal placée. **CORRECTION AUTOMATIQUE par l'examinateur UNIQUEMENT sur étapes 1-2** (forme générale + répartition) ; à partir de l'étape 3, **plus de correction** (manuel ligne 1241) — l'erreur sur étape 3 n'invalide pas la suite, l'erreur sur étape 1-2 si. | 64 | Mémoire visuelle court terme + visuo-construction |
| 05 | Tangram — chat reconnu (2 pts, après 15 s de mémorisation, manuel ligne 1443) + analyse de 3 planches (pièces en trop / manquantes). Pièces attendues (manuel lignes 2515-2526) : P1 : 2 pièces en trop (grand triangle = corps + triangle moyen) /4 ; P2 : 2 pièces manquantes (queue + oreille) /4 ; P3 : 1 manquante (corps) + 2 en trop (oreille + queue) /6. Total = 2 + 4 + 4 + 6 = 16. **Malus −2 pts si l'examinateur doit corriger une consigne sur la planche 1** (et SEULEMENT la planche 1). | 16 | Mémoire spatiale + visuo-construction + planification |
| 06 | Associations sémantiques — 3 subtests : animaux (8 photos × 2 pts = 16) + objets (8 photos × 2 pts = 16) + logos commerciaux (7 logos × 2 pts = 14, manuel ligne 1606). Cotation : 2 pts au 1er essai / 1 pt au 2e essai (après remontrer la planche de 8 ou 7) / 0 pt sinon. **Spécificité logos** : 1 pt au 1er essai et ½ pt au 2e essai si bonne association sémantique faite SANS reconnaître le nom de la marque (manuel ligne 1629) — l'épreuve mesure la mémoire sémantique, pas la culture marketing. Malus −1 pt par invention. | 46 | Mémoire épisodique sur indiçage sémantique |
| 07 | Mémoire d'un texte ENTENDU — rappel /12 + choix de résumé /8. **UN SEUL TEXTE étalonné** (indépendant du NSC, contrairement à l'épreuve 02), résumé attendu n°2 (manuel ligne 2552). **Procédure de rattrapage si incompréhension de la macrostructure** : faire ré-écouter l'enregistrement et décoder avec le sujet (manuel ligne 1763). ⚠️ **ÉPREUVE PARTIELLEMENT NON ÉTALONNÉE** : le manuel ne fournit pas de normes stratifiées complètes pour l'épreuve 07 (ligne 868). Le score doit être interprété avec prudence — comparer surtout le rappel ENTENDU au rappel LU (ép. 02) pour détecter un déficit modalitaire (auditif vs écrit). | 20 | Mémoire épisodique verbale + compréhension orale |
| 08 | Mémoire visuelle de formes complexes — rosaces /10 + idéogrammes /10. Présentation 6 secondes par forme (manuel lignes 1837, 1839). 2 pts par forme reconnue du 1er coup, **0 pt si reconnue en 2e choix** (manuel lignes 1845, 2409 : "seul le premier choix compte"). **Tâche interférente entre présentation et reconnaissance** : calcul mental (entre rosaces et reconnaissance) ; fluence d'arbres (entre idéogrammes et reconnaissance) (manuel lignes 1837, 1839, 2563-2572). Ces tâches sont des INTERFÉRENTS, pas des subtests cotés. | 20 | Mémoire visuelle pure (formes non sémantisables) |
| 09 | Mémoire auditive — 6 bruits /12 (2 pts par bruit reconnu) + 4 phrases /40 (10 pts par phrase, modulé). **Pénalités phrases** : −1 pt par mot important faux / trop déplacé / non rappelé / marque morphologique transformée ; −2 pts par groupe de mots oubliés ou trop erronés ; −3 pts si redemande AVANT d'avoir essayé ; −5 pts si redemande APRÈS avoir commencé (manuel lignes 1979-1980, 2420). ⚠️ **DEUX JEUX DE PHRASES selon NSC** (manuel lignes 2576-2577) : 4 phrases dont la 4e est identique entre les deux versions ; vérifier que le logiciel a chargé le jeu adapté au NSC. | 52 | Mémoire auditive non verbale + boucle phonologique |
| 10 | Mémoire spatiale — parcours de cailloux : 2 items de 4 cailloux (/8 chacun = /16) + 2 items de 5 cailloux (/10 chacun = /20). 2 pts par caillou pointé dans le bon ordre, 1 pt si caillou correct mais mauvais ordre. **Pas de 2e essai** (manuel ligne 2130). **Préalable obligatoire : vérifier l'absence d'héminégligence (test de barrage) et d'apraxie constructive (figure de Rey)** avant d'interpréter en termes mnésiques (manuel ligne 2221). | 36 | Mémoire spatiale courte/visuo-spatiale |
| 11 | Mémoire de visages — 5 portraits peints + 5 photos, reconnaissance parmi planches de 6 (5 distracteurs + 1 cible). 2 pts par portrait reconnu du 1er coup, 0 pt si 2e choix (manuel ligne 2251). **Tâches interférentes** : calcul mental entre peints et reconnaissance, fluence lexicale entre photos et reconnaissance (manuel lignes 2236, 2244). | 20 | Mémoire de visages (reconnaissance) |

**Temps** : chaque épreuve est chronométrée (à l'insu du sujet). Le manuel indique (lignes 251-252) que les seuils de temps d'alerte sont **disponibles UNIQUEMENT dans le livret de passation et dans le logiciel HappyNeuron, PAS dans le manuel public**. L'ortho doit donc reporter directement le seuil affiché par son logiciel. Un sujet peut obtenir un score correct EN TEMPS PATHOLOGIQUE (lenteur de traitement). **Cet aspect doit être systématiquement reporté dans le commentaire** : il signe souvent une fragilité sub-clinique avant que le score lui-même ne décroche, particulièrement chez les sujets à haute réserve cognitive (NSC 3).

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

*Note : la typologie en 6 profils numérotés ci-dessous est une SYNTHÈSE OPÉRATIONNELLE dérivée des sections "Analyse" de chaque épreuve du manuel — elle n'est pas listée telle quelle dans le manuel HappyNeuron, mais reflète fidèlement les croisements cliniques attendus que le manuel décrit épreuve par épreuve (notamment lignes 641-646 pour encodage/récupération, 1184-1187 pour MdT, 1420 et 2221 pour visuo-spatial).*

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

9. **🔒 OVERRIDE \`pap_suggestions\`** : le tool-schema demande 4-6 aménagements scolaires. **CETTE INSTRUCTION NE S'APPLIQUE PAS À PREDIMEM** — pas d'école pour un adulte. **Retourner OBLIGATOIREMENT \`pap_suggestions = []\`** (tableau vide). Le rendu Word saute la section automatiquement quand le tableau est vide.

10. **🔒 OVERRIDE \`bilans_complementaires\`** : les catégories listées dans le tool-schema sont enfant/scolaire (Psychomotricité, Orthoptie, Pédopsychiatrie, CRTLA…). Pour PREDIMEM (adulte), utiliser ces catégories spécifiques (1 ligne par catégorie, **format strict** \`"Catégorie : justification clinique courte pointant l'indice du bilan"\`) :
    - **Neurologie** : profil convergent évoquant une atteinte neurologique débutante, à explorer par consultation mémoire + imagerie.
    - **Gériatrie / Consultation mémoire** : sujet de plus de 60 ans avec fragilités convergentes — orientation prioritaire.
    - **Neuropsychologie** : profil exécutif / mnésique nécessitant un bilan approfondi (RL/RI 16, DMS 48, BEM 144, MEM IV Wechsler, figure de Rey, Doors and people).
    - **ORL / audiologie** : si fragilité dominante sur les épreuves auditives (ép. 09) sans audiométrie récente.
    - **Psychiatrie adulte / psychologue clinicien** : si éléments dépressifs/anxieux suspectés susceptibles d'expliquer les fragilités cognitives (pseudo-démence dépressive à éliminer).
    - **Médecine du travail** : si le sujet est en activité professionnelle et la plainte impacte le poste de travail.
    Liste VIDE \`[]\` si aucun élément clinique ne justifie une orientation pluridisciplinaire (cas profil 6 sujet sain). NE JAMAIS lister Pédopsychiatrie, CRTLA, Orthoptie scolaire — sans pertinence adulte.

11. **Le titre de la synthèse est "Hypothèse de diagnostic"**, JAMAIS "Diagnostic" (cohérence avec le rendu MoCA d'ortho-ia, par sécurité juridique).

12. **🔒 OVERRIDE \`difficultes_identifiees\`** : le tool-schema dit *"se terminer sur les conséquences concrètes scolaires et de la vie quotidienne pour l'élève"*. Pour PREDIMEM (adulte), reformuler en **conséquences fonctionnelles AU QUOTIDIEN ET PROFESSIONNELLES** (oublis de RDV, perte du fil de conversation, difficulté à retenir une consigne médicale, ralentissement dans la prise de décision, fatigue cognitive en fin de journée). JAMAIS "élève", "scolaire", "en classe".

---

#### TRANSPOSITION VERS LE CRBO ORTHO.IA

PREDIMEM n'utilise pas de percentiles continus (notes standards / z-scores sigma-based). Pour l'intégrer dans la structure CRBO :

- **\`score\`** = score brut au format "X/Y" (ex: "23/25", "11/12").
- **\`et\`** = ÉCART en notes standard ou en sigma par rapport à la moyenne du groupe d'appartenance, si fourni par le logiciel (ex: "−1,2 σ", "M − 0,8"). null si non disponible.
- **\`percentile\`** = laisser vide ('') ou indiquer la zone HappyNeuron (ex: "Zone vert clair", "Seuil d'alerte"). PREDIMEM ne donne pas de percentile au sens classique.
- **\`percentile_value\`** : encoder une valeur calibrée pour que la couleur d'arrière-plan du tableau Word matche la zone HappyNeuron du sujet. **PREDIMEM a OFFICIELLEMENT 5 ZONES** (vs 6 zones Laurie côté Word) — on saute volontairement la zone Laurie "Moyenne basse" (jaune P26-49) qui n'existe pas dans HappyNeuron, parce que **Jaune HappyNeuron = seuil d'alerte clinique** (fragilité installée), équivalent en sévérité à "Zone de fragilité" Laurie et NON à "Moyenne basse" Laurie (cette dernière reste "norme un peu basse, OK" en Exalang) :
  - **Vert foncé HappyNeuron** (≥ M, "dans la norme ou au-dessus" — manuel ligne 270) → \`percentile_value\` = **85** (cellule fond vert foncé "Excellent")
  - **Vert clair HappyNeuron** (M−1σ à M−1,5σ, performance correcte, légèrement abaissée) → \`percentile_value\` = **60** (cellule fond vert clair "Moyenne haute")
  - **Jaune HappyNeuron** (M−1,5σ à M−2σ, **SEUIL D'ALERTE OFFICIEL** — manuel ligne 255-270) → \`percentile_value\` = **18** (cellule fond orange clair Laurie "Zone de fragilité" — la sévérité du seuil d'alerte mnésique colle à "Zone de fragilité", PAS à "Moyenne basse" qui sous-évaluerait l'alerte)
  - **Orange HappyNeuron** (M−2σ à M−3σ, difficulté avérée) → \`percentile_value\` = **8** (cellule fond orange foncé Laurie "Difficulté")
  - **Rouge HappyNeuron** (≤ M−3σ, "effondrés" — manuel ligne 270) → \`percentile_value\` = **3** (cellule fond rouge "Difficulté sévère")
  Ces valeurs ne sont PAS des percentiles cliniques au sens classique (PREDIMEM est sigma-based, pas percentile-based) — ce sont des codes-couleurs pour piloter le shading Word, alignés sur la sémantique clinique HappyNeuron (et non sur la grille Exalang).
- **\`interpretation\`** : utiliser **OBLIGATOIREMENT** le vocabulaire HappyNeuron retranscrit ci-dessous, JAMAIS les étiquettes percentile-based Exalang ("Excellent / Moyenne haute / Moyenne basse / Zone de fragilité / Difficulté / Difficulté sévère") qui n'ont pas de sens pour ce protocole sigma-based (instruction surclassée par l'instruction "6 zones par défaut" du \`tool-schema\` qui ne s'applique pas à PREDIMEM) :
  - Vert foncé → "performance préservée"
  - Vert clair → "performance dans la moyenne basse, à surveiller"
  - Jaune → "fragilité objectivée (seuil d'alerte)"
  - Orange → "difficulté avérée"
  - Rouge → "effondrement"
  *Précision rédactionnelle : ce vocabulaire est une paraphrase clinique transposée pour le CRBO, fidèle à l'esprit du manuel HappyNeuron qui n'impose pas de termes officiels (le manuel n'évoque que "performances dans la norme ou au-dessus" pour vert et "effondrés" pour rouge — ligne 270).*
- **\`commentaire\`** du domaine ou de l'épreuve : OBLIGATOIRE pour PREDIMEM. Doit intégrer le score + le temps + l'observation qualitative + la lecture en lien avec les autres épreuves du protocole.

---

#### STRUCTURE ATTENDUE DU CRBO PREDIMEM

1. **Anamnèse** : motif de consultation cognitive (plainte mnésique du sujet ou alerte de l'entourage, suivi post-AVC / TC, suspicion neurodégénérative), antécédents médicaux pertinents (vasculaires, dépression, sommeil, médicaments à risque cognitif), niveau scolaire (NSC) et profession (réserve cognitive pré-morbide).

2. **Domaines / épreuves** : organiser les 11 épreuves dans des regroupements logiques (Mémoire visuelle, Mémoire épisodique verbale, Mémoire de travail, Mémoire auditive, Associations). Pour chaque épreuve : score, temps, position dans les zones HappyNeuron, observation qualitative.

3. **Synthèse / Hypothèse de diagnostic** :
   - 🔒 **OVERRIDE tool-schema** : le champ \`diagnostic\` du tool-schema impose le format strict *"trouble spécifique des apprentissages en langage écrit (communément appelé dyslexie-dysorthographie), forme [légère/modérée/sévère/compensée]"*. **CETTE INSTRUCTION NE S'APPLIQUE PAS À PREDIMEM** (bilan cognitif adulte, pas un trouble d'apprentissage enfant). On SURCLASSE le format en :
     - Titre : "**Hypothèse de diagnostic**" (jamais "Diagnostic")
     - Contenu : prose modalisée — *"le profil observé est compatible avec…"*, *"ces éléments suggèrent une fragilité de…"*, *"à confirmer / caractériser par un bilan neuropsychologique approfondi"*.
     - JAMAIS la formule "trouble spécifique des apprentissages en langage écrit / dyslexie-dysorthographie / forme légère-modérée-sévère-compensée" — non pertinente pour un bilan mnésique adulte.
   - Statuer d'abord sur les domaines PRÉSERVÉS.
   - Décrire ensuite les fragilités OBJECTIVÉES (≥ 2 épreuves convergentes minimum).
   - Référer à un profil clinique attendu (cf. profils 1 à 6 ci-dessus).
   - JAMAIS de diagnostic étiologique (Alzheimer, MCI, démence sémantique, APP, etc.).

4. **Recommandations** — 🔒 **OVERRIDE tool-schema** : le champ \`recommandations\` du tool-schema impose la phrase 1 verbatim *"Une prise en charge orthophonique est recommandée, et en parallèle la mise en place ou le renforcement des aménagements en classe."* **CETTE INSTRUCTION NE S'APPLIQUE PAS À PREDIMEM** (population adulte, pas d'école, orientation pluridisciplinaire prioritaire sur l'orthophonie). On SURCLASSE avec les phrases-types adultes ci-dessous (*formulations dérivées des bonnes pratiques cliniques françaises courantes ; le manuel HappyNeuron ne propose pas de phrases-types*) :
   - Si aucun seuil d'alerte franchi (toutes épreuves en zone verte) : "Le dépistage PREDIMEM ne met pas en évidence de fragilité mnésique objectivable à ce stade. Une réévaluation à 12 mois est envisageable si la plainte persiste ou évolue. Conseils d'hygiène cognitive proposés."
   - Si une ou plusieurs épreuves en zone jaune isolément : "Le dépistage PREDIMEM met en évidence des performances en zone d'alerte sur [domaines]. Une réévaluation à 6 mois est préconisée pour suivre l'évolution."
   - Si profil cohérent de fragilité (≥ 2 épreuves convergentes en zone jaune/orange/rouge) : "Le dépistage PREDIMEM met en évidence un profil [trouble d'encodage / récupération / mémoire de travail / visuo-spatial] à caractériser plus finement. **Un bilan neuropsychologique approfondi est recommandé**, ainsi qu'une consultation mémoire spécialisée. Selon l'orientation diagnostique, une rééducation orthophonique des stratégies cognitives pourra être proposée en parallèle."

5. **Articulation avec d'autres outils** :
   - **Cités explicitement par le manuel** comme outils à croiser :
     - **RL/RI 16 items** (Grober & Buschke) — manuel lignes 94, 643-645, 1810 : exploration fine de l'encodage / consolidation / récupération verbale.
     - **DMS 48** — manuel lignes 94, 643, 646, 1420 : reconnaissance visuelle différée, sensible aux MA débutantes.
     - **Doors and people** — manuel ligne 94.
     - **Figure de Rey** (copie + reproduction sans modèle) — manuel lignes 1420, 1572, 2221.
     - **Cubes de Corsi** — manuel ligne 2221.
     - **Empan envers (WAIS)** — manuel lignes 1175, 1187, 2116.
     - **Histoire du Lion (Barbizet, versions Croisile)** — manuel lignes 147, 890, 1811.
     - **BEM 144 Signoret** (subtest reconnaissance différée 24 phrases) — manuel lignes 93, 147, 2117.
     - **MEM IV Wechsler** (mémoire logique) — manuel lignes 93, 141, 147.
     - **California Verbal Learning** — manuel ligne 94.
     - **10/36 BCcog SEP** (en cas de sclérose en plaques) — manuel ligne 2221.
     - **Acronymes PREDILAE / PREDILEM / PREDILAC** (gamme PREDI) — manuel ligne 1187.
   - **Compléments d'usage clinique courant** (non cités par le manuel, mais bonne pratique française) : MoCA, MMSE (screenings globaux en amont), fluences de Cardebat, GREMOTs, IRM avec coupes coronales hippocampiques. À utiliser en complément, sans présenter comme "recommandation manuel".

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
- Toujours rappeler : "Cette évaluation est un dépistage : elle oriente, elle ne conclut pas."

---

#### MODE RENOUVELLEMENT — COMPARAISON STRUCTURÉE (adulte)

Si un objet \`bilan_precedent_structure\` non-null est fourni dans le contexte, ce CRBO devient un **bilan de renouvellement** PREDIMEM et DOIT inclure une \`synthese_evolution\` rigoureuse, jamais générique.

⚠️ **Spécificité adulte** : la sémantique des deltas est INVERSÉE par rapport au pédiatrique. En cognition adulte, on cherche d'abord la **stabilité** (rassurante chez un MCI / post-AVC / suivi de plainte mnésique persistante). Un déclin discret (Δ -10) peut être cliniquement significatif et signal d'alerte. Une amélioration (Δ +10) est probable en post-AVC en phase de récupération ou sous PEC, mais peut aussi être de la variabilité test-retest.

Méthode obligatoire :

1. **Matcher nominativement** chaque épreuve actuelle avec son homologue dans le bilan précédent (par libellé). Les 11 épreuves PREDIMEM ont des libellés stables — matching strict possible.

2. **Convertir les zones HappyNeuron en valeur numérique** AVANT de comparer, selon le mapping interne ortho.ia (cf. \`percentile_value\` documenté plus haut) :
   - Vert foncé (préservé, > M-1σ) → 75
   - Vert clair (moyenne basse) → 55
   - Jaune (seuil d'alerte, M-1.5σ) → 30
   - Orange (difficulté avérée, M-2 à M-3σ) → 13
   - Rouge (effondré, ≤ M-3σ) → 3

3. **Calculer le delta de zone** (sur la valeur numérique 0-100) :
   - **Delta ≥ +15** → **PROGRÈS NET** (signaler dans \`synthese_evolution.progres\`). Ex. : zone orange → vert clair = +42. Récupération post-AVC ou bénéfice de la PEC.
   - **Delta entre -10 et +14** → **STABILITÉ** (signaler dans \`synthese_evolution.stagnation\`). En adulte, la stabilité est un résultat clinique attendu et rassurant — la formuler comme telle ("Le profil mnésique reste stable, ce qui est rassurant dans le contexte de plainte mnésique persistante").
   - **Delta ≤ -10** → **RÉGRESSION** (signaler dans \`synthese_evolution.regression\`). En adulte, un déclin même modéré est un signal d'alerte — formuler avec prudence et orienter ("Une fragilité supplémentaire est objectivée sur [épreuve], qui pourrait évoquer une évolution dyscognitive. Un bilan neuropsychologique approfondi est recommandé pour caractériser cette évolution.").

4. **Cas particulier vert → jaune** : Δ -45 ≈ apparition d'une fragilité. Cliniquement très significatif — à investiguer en priorité (consultation mémoire spécialisée, IRM si non récente).

5. **Citation nominative obligatoire** : écrire "Mémoire d'un texte LU : passage de la zone vert clair (P55) à la zone jaune (P30), un déclin objectivé est noté", PAS "plusieurs régressions observées".

6. **Délai entre les bilans** à mentionner explicitement ("Au regard de N mois écoulés depuis le précédent dépistage"). Pour PREDIMEM, le délai recommandé est :
   - **6 mois** : si fragilité présente au premier bilan (suivi de monitorage rapproché).
   - **12 mois** : si profil préservé au premier bilan + plainte persistante (suivi de surveillance).
   - **< 6 mois** : déconseillé sauf événement intercurrent (AVC, traumatisme, modification thérapeutique majeure) — risque d'effet test-retest masquant un déclin réel.

7. **Modélisation rédactionnelle du \`resume\`** (1 phrase intro \`synthese_evolution.resume\`) :
   - Si profil globalement stable : *"Au regard de [N] mois écoulés depuis le précédent dépistage, le profil mnésique de [Prénom] reste globalement stable, sans franchissement de nouveau seuil d'alerte — ce qui est rassurant dans le contexte de [plainte mnésique persistante / suivi post-AVC / autre]."*
   - Si déclin objectivé : *"Au regard de [N] mois écoulés, une dégradation discrète mais convergente est objectivée sur [domaines], justifiant une orientation vers un bilan neuropsychologique approfondi pour caractérisation."*
   - Si récupération : *"Au regard de [N] mois de prise en charge orthophonique, une amélioration significative est objectivée sur [domaines], en lien avec [le travail réalisé sur les stratégies de récupération / l'évolution naturelle post-AVC]."*

⛔ **NE JAMAIS** en mode renouvellement :
- Conclure à une "évolution vers la maladie d'Alzheimer" ou tout diagnostic étiologique. PREDIMEM ne permet pas ce niveau de conclusion.
- Formuler un déclin sans recommandation d'orientation (consultation mémoire / neuropsy).
- Présenter une amélioration comme certaine sans tenir compte de la variabilité test-retest.
- Mentionner un effet test-retest à charge ("la patiente connaissait déjà le test") en première intention — c'est dévalorisant. Le manuel HappyNeuron ne mentionne pas d'effet test-retest documenté à 6 mois minimum.

✅ **TOUJOURS** en mode renouvellement :
- Comparer épreuve par épreuve (citation nominative).
- Statuer d'abord sur les domaines RESTÉS PRÉSERVÉS (rassurant) avant les déclins.
- Mentionner la PEC entre les 2 bilans (orthophonique, neuropsychologique, médicamenteuse) si l'anamnèse la précise.
- Si l'ortho a saisi la trajectoire dans son textarea libre, l'intégrer textuellement dans le résumé.`,
}
