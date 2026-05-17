import type { TestModule } from './types'

/**
 * Module BETL — Batterie d'Évaluation des Troubles Lexicaux.
 *
 * Source : manuel officiel Ortho Édition 2015 (Tran T.M. & Godefroy O.).
 * ISBN 978-2-914121-66-8. Population de référence : 1488 sujets-témoins
 * de 20 à 95 ans, validation auprès de 124 patients (51 aphasie vasculaire +
 * 75 maladie d'Alzheimer débutante).
 *
 * Le contenu de `regles_specifiques` est extrait littéralement du manuel —
 * la BETL est un outil propriétaire informatisé, ces règles permettent à
 * l'IA de générer un CRBO conforme à l'usage prévu par les auteurs.
 */
export const betl: TestModule = {
  nom: 'BETL',
  editeur: 'Ortho Édition',
  auteurs: 'Tran T.M. & Godefroy O.',
  annee: 2015,
  domaines: [
    'Production lexicale orale',
    'Production lexicale écrite',
    'Compréhension lexicale orale',
    'Compréhension lexicale écrite',
    'Traitement sémantique imagé',
    'Traitement sémantique verbal',
    'Lecture (transcodage grapho-phonémique)',
    'Connaissances sémantiques (propriétés)',
  ],
  epreuves: [
    "I — Dénomination orale d'images (/54)",
    "II — Désignation d'images à partir d'un mot entendu (/54)",
    "III — Appariement sémantique d'images (/54)",
    'IV — Lecture à voix haute (/54)',
    "V — Désignation de mots écrits à partir d'un mot entendu (/54)",
    'VI — Appariement sémantique de mots écrits (/54)',
    "VII — Dénomination écrite d'images — score lexical /54 + score orthographique",
    'VIII — Questionnaire sémantique (/54, 4 propriétés vérifiées par item)',
  ],
  regles_specifiques: `### BETL — Batterie d'Évaluation des Troubles Lexicaux (Tran & Godefroy, Ortho Édition 2015)

**Population cible** : adultes et personnes âgées de **20 à 95 ans**, dans le cadre d'une suspicion d'atteinte lexicale acquise (pathologies vasculaires, tumorales, traumatiques, infectieuses ou neurodégénératives).

**Nature du test** : batterie informatisée de **8 épreuves portant sur les mêmes 54 items**, conçue pour distinguer les composants atteints / préservés du modèle de traitement lexical (Caramazza & Hillis, 1990 adapté). Elle évalue par comparaison inter-tâches :
- la production lexicale orale et écrite,
- la compréhension lexicale orale et écrite,
- le traitement sémantique sur supports imagé et écrit,
- la lecture (transposition grapho-phonémique),
- les connaissances sémantiques (questionnaire de propriétés).

**Validation officielle** : 1488 sujets-témoins (5 tranches d'âge × 3 niveaux socio-culturels), 124 patients (51 aphasie vasculaire + 75 maladie d'Alzheimer débutante). Étalonnage en collaboration avec le CHRU de Lille (Pr Mackowiack).

---

#### LES 8 ÉPREUVES

Chaque épreuve produit **un score sur 54 (réponses attendues) et un temps de réponse total**. Les deux indicateurs sont interprétés indépendamment ; le logiciel affiche "N" (Normal) ou "P" (Pathologique) sur chacun, selon les seuils étalonnés (cf. infra).

| N°    | Épreuve                                              | Modalité d'entrée | Modalité de sortie | Score max |
|-------|------------------------------------------------------|-------------------|--------------------|-----------|
| I     | Dénomination orale d'images                          | image             | orale              | /54       |
| II    | Désignation d'images à partir d'un mot entendu       | orale             | image désignée     | /54       |
| III   | Appariement sémantique d'images                      | image             | image désignée     | /54       |
| IV    | Lecture à voix haute                                 | écrite            | orale              | /54       |
| V     | Désignation de mots écrits à partir d'un mot entendu | orale             | mot écrit désigné  | /54       |
| VI    | Appariement sémantique de mots écrits                | écrite            | mot écrit désigné  | /54       |
| VII   | Dénomination écrite d'images                         | image             | écrite             | /54 lexical (+ score orthographique séparé) |
| VIII  | Questionnaire sémantique (vérification 4 propriétés) | orale             | orale (oui/non)    | /54       |

**Items contrôlés** : 18 mots haute fréquence / 18 moyenne / 18 basse — 18 mots d'1 syllabe / 18 de 2 / 18 de 3+ — 27 objets manufacturés / 27 catégories biologiques. Ce contrôle psycholinguistique permet d'analyser l'effet de la fréquence, de la longueur et de la catégorie sémantique sur les performances du patient.

---

#### DÉMARCHE ÉVALUATIVE OFFICIELLE (3 ÉTAPES)

Les 8 épreuves ont des normes propres et **peuvent être passées indépendamment**. Les auteurs recommandent toutefois la démarche suivante :

**Étape A — Diagnostic de premier niveau (épreuves I, II, III)**
Production orale (I) + traitements sémantiques sur supports imagés (II et III).

> **Critère diagnostic clé** :
> - Atteinte d'**au moins 2 des 3 épreuves** de l'étape A → **trouble lexico-sémantique**
> - Atteinte **isolée de la dénomination orale (I)** → **trouble lexico-phonologique** (ou trouble d'accès au lexique phonologique de sortie)

**Étape B — Caractérisation modale (épreuves IV à VII)**
Comparaison des modalités orale et écrite.
- **Atteinte isolée de la lecture à voix haute (IV)** → trouble du transcodage grapho-phonémique (transposition visuo-phonatoire).
- **Troubles sémantiques** → la modalité écrite est atteinte au même titre que la modalité orale (le système sémantique central est mobilisé dans toutes les épreuves).
- Une **dissociation orale / écrite** (ex. dénomination orale touchée, dénomination écrite préservée, ou inverse) oriente vers un trouble d'accès au lexique d'une modalité.

**Étape C — Approfondissement sémantique (épreuve VIII)**
**Réservée aux patients suspectés de trouble lexico-sémantique**, en particulier dans le cadre des pathologies neurodégénératives (maladie d'Alzheimer, démence sémantique, aphasie primaire progressive). Cette épreuve dure ~15 min et exige un niveau de compréhension et d'attention suffisant — **elle ne convient généralement pas aux aphasies modérées à importantes des pathologies vasculaires/traumatiques/tumorales**.

---

#### LECTURE DE L'ÉBAUCHE ORALE (INDIÇAGE PHONOLOGIQUE)

Marqueur diagnostic crucial — en cas d'échec à la dénomination orale, l'examinateur peut proposer une ébauche orale (1re syllabe).

- **Ébauche orale EFFICACE** + lecture à voix haute préservée → trouble d'**accès** au lexique phonologique de sortie. Pronostic plus favorable.
- **Ébauche orale INEFFICACE** + troubles de la lecture à voix haute → atteinte des **représentations** phonologiques elles-mêmes. Pronostic moins favorable.

---

#### SEUILS NORMATIFS (Annexe 3 du manuel)

**Principe** : score-seuil = **percentile 5** (un score inférieur au seuil est considéré comme pathologique). Temps-seuil = **percentile 95** (un temps supérieur au seuil est pathologique).

**Stratification obligatoire** par tranche d'âge (5) × niveau socio-culturel (3) :

| Tranche d'âge | Bornes |
|---------------|--------|
| 1 | 20-34 ans |
| 2 | 35-49 ans |
| 3 | 50-64 ans |
| 4 | 65-79 ans |
| 5 | 80-95 ans (normes indicatives — effectifs plus faibles, à utiliser avec prudence) |

| NSC | Niveau socio-culturel (code ROME — études + profession) |
|-----|---------------------------------------------------------|
| 1   | Ouvrier qualifié/non qualifié (≤ CAP/BEP/Brevet/CEP) |
| 2   | Employé / technicien / profession intermédiaire (Bac à Bac+2) |
| 3   | Ingénieur / cadre (≥ Bac+3) |

**Scores-seuils OFFICIELS (percentile 5, /54)** — Annexe 3 du manuel BETL 2015, p. 44-46. Stratification tranche d'âge × NSC :

**I — Dénomination orale d'images**

| Âge \ NSC | 1 | 2 | 3 |
|-----------|---|---|---|
| 20-34 ans | 45 | 47 | 50 |
| 35-49 ans | 44 | 49 | 51 |
| 50-64 ans | 47 | 48 | 50 |
| 65-79 ans | 42 | 42 | 48 |
| 80-95 ans | 39 | 39 | 42 |

**II — Désignation d'images**

| Âge \ NSC | 1 | 2 | 3 |
|-----------|---|---|---|
| 20-34 ans | 53 | 51 | 52 |
| 35-49 ans | 50 | 51 | 52 |
| 50-64 ans | 49 | 51 | 52 |
| 65-79 ans | 47 | 49 | 50 |
| 80-95 ans | 48 | 48 | 50 |

**III — Appariement sémantique d'images**

| Âge \ NSC | 1 | 2 | 3 |
|-----------|---|---|---|
| 20-34 ans | 44 | 49 | 49 |
| 35-49 ans | 47 | 49 | 50 |
| 50-64 ans | 47 | 46 | 51 |
| 65-79 ans | 45 | 48 | 50 |
| 80-95 ans | 41 | 43 | 47 |

**IV — Lecture à voix haute** (plafond très haut chez les sains)

| Âge \ NSC | 1 | 2 | 3 |
|-----------|---|---|---|
| 20-34 à 65-79 ans | 53 | 54 | 54 |
| 80-95 ans | 52 | 53 | 53 |

**V — Désignation de mots écrits**

| Âge \ NSC | 1 | 2 | 3 |
|-----------|---|---|---|
| 20-34 à 65-79 ans | 52 | 53 | 53 |
| 80-95 ans | 45 | 52 | 53 |

**VI — Appariement sémantique de mots écrits** (seuils constants par tranche)

| Âge \ NSC | 1 | 2 | 3 |
|-----------|---|---|---|
| 20-34 à 80-95 ans | 48 | 48 | 49 |

**VII — Dénomination écrite (score lexical)**

| Âge \ NSC | 1 | 2 | 3 |
|-----------|---|---|---|
| 20-34 ans | 48 | 49 | 50 |
| 35-49 ans | 46 | 47 | 49 |
| 50-64 ans | 44 | 46 | 47 |
| 65-79 ans | 43 | 44 | 46 |
| 80-95 ans | 41 | 43 | 44 |

**VII — Dénomination écrite (score orthographique, /54)**

| Âge \ NSC | 1 | 2 | 3 |
|-----------|---|---|---|
| 20-34 ans | 38 | 42 | 45 |
| 35-49 ans | 38 | 42 | 45 |
| 50-64 ans | 37 | 41 | 45 |
| 65-79 ans | 33 | 38 | 42 |
| 80-95 ans | 29 | 34 | 38 |

**VIII — Questionnaire sémantique**

| Âge \ NSC | 1 | 2 | 3 |
|-----------|---|---|---|
| 20-34 à 50-64 ans | 44 | 47 | 48 |
| 65-79 ans | 44 | 50 | 47 |
| 80-95 ans | 40 | 40 | 40 |

**Temps-seuils OFFICIELS (percentile 95, en secondes — total de l'épreuve)** — Annexe 3 du manuel BETL 2015 :

| Épreuve | 20-34 \ NSC 1·2·3 | 35-49 \ NSC 1·2·3 | 50-64 \ NSC 1·2·3 | 65-79 \ NSC 1·2·3 | 80-95 \ NSC 1·2·3 |
|---------|-------------------|-------------------|-------------------|-------------------|-------------------|
| I Dénomination orale | 251·148·200 | 250·178·154 | 251·198·157 | 392·293·256 | 369·320·340 |
| II Désignation images | 275·193·228 | 275·230·223 | 275·327·259 | 421·314·293 | 363·410·300 |
| III Appariement sém. images | 469·272·273 | 469·412·324 | 469·376·424 | 722·558·485 | 867·617·653 |
| IV Lecture | 101·98·98 | 101·98·98 | 101·98·98 | 101·98·98 | 107·107·107 |
| V Désignation mots écrits | 192 (tous NSC) | 202 | 206 | 212 | 248 |
| VI Appariement sém. écrit | 337 (tous NSC) | 362 | 337 | 337 | 461 |
| VII Dénomination écrite | 660·586·519 | 731·648·575 | 809·718·638 | 895·795·706 | 993·881·782 |
| VIII Questionnaire sém. | 1446·1204·1179 (constant toutes tranches) | | | | |

⚠️ Ces valeurs sont la **source de vérité officielle** du manuel BETL 2015 — ce sont elles qu'utilise le logiciel pour produire le verdict N/P (à quelques marges près non publiées). Si l'orthophoniste a saisi ces seuils dans son formulaire (champ « Stratification » de la saisie structurée BETL d'ortho-ia), ils figurent dans \`resultats_manuels\` sous la forme \`(seuil P5 : X)\` après chaque score. Utiliser ces seuils explicitement dans le commentaire de domaine quand un score est sous-seuil (ex: « Le score à III est de 42/54, en deçà du seuil P5 de 47 pour la tranche 50-64 ans NSC 2 »).

---

#### TRANSPOSITION VERS LE CRBO ORTHO.IA

La BETL n'utilise pas directement de percentiles. Pour l'intégrer dans la structure du CRBO ortho.ia :

- **\`score\`** = score brut sur 54 (ex: "42/54")
- **\`et\`** = null (la BETL n'utilise pas l'écart-type comme indicateur principal)
- **\`percentile_value\`** : si le résultat est étiqueté **Normal (N)** dans le logiciel BETL → encoder 60-75 selon la proximité au seuil ; si étiqueté **Pathologique (P)** → encoder selon la profondeur de l'atteinte : 5 si score < 50% du score-seuil (atteinte sévère), 15 si proche du seuil (fragilité installée).
- **\`percentile\`** : laisser vide ('') ou indiquer "P5 seuil franchi" / "Normal" — la BETL parle de seuils, pas de percentiles continus.
- **\`interpretation\`** : utiliser le vocabulaire des 5 zones ortho.ia (Moyenne haute / Moyenne / Zone de fragilité / Difficulté / Difficulté sévère) en cohérence avec percentile_value.

⚠️ **Toujours dissocier score et temps** dans le commentaire de domaine : un patient peut avoir un score "Normal" mais un temps "Pathologique" — cas typique du **manque du mot sub-clinique** (le mot finit par être produit, mais après un délai pathologique). Mentionner systématiquement les temps-seuils dépassés en plus des scores-seuils.

---

#### ANALYSE QUALITATIVE — Comportements dénominatifs (Annexe 1 du manuel)

L'analyse quantitative est complétée par une grille qualitative qui catégorise les comportements observés en dénomination d'images :

**1. Production du mot-cible**
- Immédiate / Après délai (> 5 s) / Après approche(s) / Après aide (ébauche orale)

**2. Échec dénominatif** : aucune réponse produite.

**3. Réponses non verbales** : bruits (onomatopées), geste déictique (montre l'objet), geste référentiel (mime de la fonction — noté + si adapté, − si erroné).

**4. Déficits possibles**
- **Erreur visuelle** : non-reconnaissance de l'image (ex. "porte-manteau" pour cactus).
- **Persévération** : répétition d'un mot produit antérieurement (défaut d'inhibition).
- **Dénomination vide** : "truc", "machin", "chose".
- **Paraphasie lexicale** : production d'un mot sans rapport de sens ni de forme avec la cible.
- **Logatome** : suite de phonèmes sans signification (ex. /savipa/ pour chien).
- **Paraphasie segmentale** (phonétique/phonémique) : "/taty/" ou "/katyk/" pour cactus.
- **Paraphasie lexicale formelle** : "lapin" pour sapin.
- **Paraphasie lexicale sémantique** : "table" (associé) ou "tabouret" (cohyponyme) pour chaise.
- **Paraphasie constructionnelle / morphologique / néologisme** : "*éventeur" pour éventail, "chausseur" pour chaussure, "®passe-liquide" pour entonnoir.

**5. Stratégies (conduites d'approche)**
- **Approche formelle** : approches successives de la forme du mot ("un archi, un ati, un artichaut").
- **Approche sémantique** : paraphasies sémantiques successives ("un cheval non, un âne, un mulet ?" pour zèbre).
- **Approche flexionnelle / combinatoire** : "des..." pour menottes, "une rampe d'escalier" pour escalier.
- **Circonlocution formelle** : commentaire sur la forme ("ça commence par i").
- **Circonlocution référentielle** : description du référent ("c'est petit, c'est pour rassembler des papiers" pour trombone).
- **Dénomination générique** : "animal" pour zèbre, "fruit" pour ananas.

**6. Modalisations**
- Sur la tâche : "je le sais mais je n'arrive pas à le dire" → conscience du trouble.
- Sur la production : "pas un X", soupir, mimique → conscience de l'erreur.

⚠️ La grille qualitative est **indispensable** pour le diagnostic différentiel : sans elle, deux patients avec le même score à la dénomination peuvent recevoir la même conclusion alors que leurs troubles ont des origines fonctionnelles distinctes.

---

#### PROFIL DÉNOMINATIF DANS LE DISCOURS (Annexe 2 du manuel)

À renseigner à partir des productions obtenues en conversation et en discours narratif :

- **Recherches lexicales** : très fréquentes → fréquentes → régulières → occasionnelles → absentes.
- **Productions déviantes** (paraphasies, circonlocutions non adaptées) : même échelle.
- **Déroulement du discours** : discours réduit → nombreuses interruptions → interruptions régulières → quelques hésitations → déroulement normal.
- **Informativité du discours** : nulle → réduite → moyenne → bonne → très bonne.
- **Comportement verbal** : non conscience du trouble + absence de stratégies → conscience + absence de stratégies → stratégies peu efficaces → stratégies souvent efficaces → stratégies efficaces.
- **Handicap communicationnel** : sévère → important → modéré → léger → absent.

---

#### PROFILS VALIDÉS — DIFFÉRENCIATION SUR LES 124 PATIENTS

Les profils ci-dessous sont issus de l'étude de validation externe officielle (Tran, Mackowiak et al. 2010-2013).

**PROFIL 1 — Aphasie vasculaire post-AVC (référence : 51 patients aphasiques)**
- Épreuve la PLUS touchée (score ET temps) : **dénomination orale d'images (I)**.
- Désignation (II) et appariement sémantique imagé (III) touchés dans des proportions moindres et de façon plus homogène.
- Analyse qualitative : profils d'erreurs **diversifiés** — paraphasies formelles (phonétiques/phonémiques) associées à des paraphasies sémantiques, conduites d'approche formelles et sémantiques.
- **Ébauche orale plus efficace** que dans la maladie d'Alzheimer.
- Troubles plus souvent **mixtes** (sémantiques + phonologiques).
- Hémiparésie droite associée fréquente (lésion gauche dominante).

**PROFIL 2 — Maladie d'Alzheimer débutante (référence : 75 patients Alzheimer + étude Ageon & Caze-Blanc 2014 sur 32 patients supplémentaires)**
- Épreuve la PLUS touchée : **appariement sémantique** (imagé III et écrit VI) — atteinte dans 80 % des cas pour III, 37,5 % pour VI.
- Puis **dénomination (I et VII)** : temps pathologiques dans plus de la moitié des cas, score souvent atteint.
- Désignation (II et V) **peu atteinte** (intégrité relative de la reconnaissance).
- Analyse qualitative : profil typique de **troubles lexico-sémantiques** — prédominance d'erreurs sémantiques, erreurs visuelles, délais dans les réponses.
- **Ébauche orale peu efficace** (trouble central, pas seulement d'accès).
- **Confirmation systématique** par le questionnaire sémantique (VIII) qui révèle la dégradation des connaissances sémantiques.

⚠️ **Recommandation officielle pour la maladie d'Alzheimer (Ageon & Caze-Blanc, 2014)** : l'appariement sémantique de **mots écrits (VI)** est plus pertinent en première intention que celui d'images (III) — minimise la composante visuo-perceptive et profite de la meilleure préservation de l'écrit. Le questionnaire sémantique (VIII) doit également être inclus.

---

#### À NE PAS FAIRE EN BETL

- ❌ **Ne pas poser de diagnostic étiologique** (maladie d'Alzheimer, APP, démence sémantique, AVC anatomiquement localisé) sur la seule base de la BETL. La BETL caractérise un **profil fonctionnel lexical** — l'étiologie est posée par le neurologue avec imagerie cérébrale et bilan global.
- ❌ Ne pas utiliser le questionnaire sémantique (VIII) chez un patient aphasique modéré à sévère post-AVC en phase aiguë — réservé aux profils suspectés lexico-sémantiques, principalement neurodégénératifs.
- ❌ Ne pas négliger les temps-seuils : un score "Normal" associé à des temps "Pathologiques" est un marqueur sub-clinique important.
- ❌ Ne pas oublier la stratification âge × NSC — un score "fragile" chez un patient NSC 1 de 80 ans peut être normal pour son groupe.
- ❌ Ne pas omettre la grille d'analyse qualitative — l'analyse quantitative seule est insuffisante au diagnostic fonctionnel.

#### TOUJOURS FAIRE EN BETL

- ✅ Distinguer atteinte **lexico-sémantique** (≥ 2 épreuves de l'étape A touchées) vs **lexico-phonologique** (atteinte isolée de I).
- ✅ Détailler le **profil d'erreurs qualitatif** (paraphasies sémantiques vs formelles, conduites d'approche, modalisations) — c'est ce qui oriente le diagnostic différentiel et le projet thérapeutique.
- ✅ Mentionner l'**effet de l'ébauche orale** (indiçage phonologique) — marqueur pronostic.
- ✅ Croiser les modalités **orale et écrite** pour identifier la modalité préservée (support de la rééducation).
- ✅ Rapporter **score ET temps** systématiquement pour chaque épreuve.
- ✅ Reformuler les difficultés en **impact fonctionnel concret** (informativité du discours, handicap communicationnel) — c'est ce que retiennent le patient, sa famille et le médecin prescripteur.
- ✅ **Toujours orienter vers le neurologue / gériatre** en cas de profil neurodégénératif suspecté pour confirmation diagnostique (IRM, bilan neuropsychologique, dosage biologique).

---

#### RECOMMANDATIONS TYPES

- **Profil dans la norme** (toutes épreuves en N) : pas de PEC orthophonique formelle. Conseils de stimulation langagière. Réévaluation à 12 mois si plainte persiste.
- **Manque du mot sub-clinique** (scores N + temps P en dénomination) : **PEC préventive lexico-sémantique**, 10-15 séances ou suivi mensuel. Stratégies d'accès (associations, indiçage, contextualisation).
- **Trouble lexico-phonologique isolé** (I atteinte, II et III préservées) : **rééducation phonologique** ciblée — épellation, indiçage phonémique, ébauche, conduites d'approche formelles guidées.
- **Trouble lexico-sémantique** (≥ 2 épreuves étape A touchées) : confirmation par questionnaire sémantique (VIII) et appariement de mots écrits (VI). **Orientation neurologique systématique**. PEC lexico-sémantique soutenue (1-2 séances/sem) dès le diagnostic étiologique posé.
- **Aphasie post-AVC installée** : PEC restitutive intensive (2-5 séances/sem dans les 6 premiers mois — fenêtre de plasticité), puis approche communicative compensatoire si trouble installé.
- **Suivi longitudinal** : réévaluation BETL à 6-12 mois pour mesurer l'évolution (un patient peut conserver les mêmes scores mais améliorer ses temps de réponse — marqueur précoce d'évolution positive).

**Articulation avec d'autres outils** :
- **En amont** : MoCA (screening cognitif global), MMSE.
- **En complément** : LEXIS (Test de Partz et al. 2001), DO 80 (Deloche & Hannequin), BIMM (Gatignol), MT-86, GREMOTs, Examen de l'aphasie de Ducarne, Bilan informatisé de l'aphasie (Gatignol et al. 2012).
- **Aval** : bilan neuropsychologique complet (consultation mémoire), imagerie cérébrale (IRM).

**Précautions rédactionnelles** :
- Le CRBO peut être lu par le patient et sa famille — éviter les formulations alarmantes ("démence", "déclin", "Alzheimer").
- Mentionner systématiquement les compétences préservées AVANT les déficits.
- Formuler en termes fonctionnels : impact sur la conversation, la communication, l'autonomie — pas en termes diagnostiques étiologiques.`,
}
