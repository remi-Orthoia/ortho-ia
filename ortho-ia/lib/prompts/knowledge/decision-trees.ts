/**
 * Arbres décisionnels cliniques pour la rédaction du CRBO.
 *
 * Source : docs/Etudes de cas CRBO/arbre décisionnel langage oral.pdf
 * + docs/Etudes de cas CRBO/arbre décisionnel langage écrit.pdf
 *
 * Logique : quand le bilan inclut un test de langage écrit ou de langage
 * oral, on injecte ces arbres dans le prompt pour que Claude structure le
 * raisonnement diagnostique selon les hypothèses cliniques standard.
 *
 * Pattern typique observé dans les CRBO humains (Anne Frouard, EVALEO 6-15) :
 * la section "Hypothèses explicatives" du CRBO est ORGANISÉE en questions
 * cliniques ("Existe-t-il un trouble du langage oral ? un trouble
 * phonologique ? un trouble visuo-attentionnel ?") qui sont précisément
 * les noeuds des arbres décisionnels.
 */

export const DECISION_TREE_LANGAGE_ECRIT = `## Arbre décisionnel — Langage écrit (Anne Frouard / EVALEO 6-15)

Quand un bilan de **langage écrit** est inclus, le CRBO doit explorer
systématiquement les domaines suivants, puis formuler les hypothèses
explicatives sur la cause des difficultés.

### Domaines à évaluer (ordre clinique)

1. **Lecture**
   - Identification des mots : Conversion grapho-phonémique, Lecture de
     syllabes, Lecture de mots, Lecture de pseudo-mots, EVAL2M.
   - Lecture de textes : Evalouette (non signifiant), La Mouette (signifiant
     test), Le Pingouin (signifiant retest).
   - Vitesse et compréhension : Compréhension écrite de mots, phrases,
     paragraphe, texte (selon niveau).

2. **Production d'écrit / Orthographe**
   - Dictée de syllabes / pseudo-mots / mots / phrases.
   - Fluence orthographique.
   - Décision orthographique (CE2-3e).
   - Récit à l'écrit (CM1-3e).

3. **Écriture (geste graphique)**
   - Copie de mots / texte.
   - Accélération sur l'écriture d'une phrase.
   - Transcription et buffer graphémique.
   - Grille d'observation du comportement scripteur + Grille synthèse
     d'analyse de l'écriture + Latéralité.

### Hypothèses linguistiques explicatives (à explorer systématiquement)

Quand un trouble du langage écrit est suspecté, **toujours** explorer ces
hypothèses dans le CRBO (organisation en sous-sections « Existe-t-il un
trouble X ? ») :

- **Pragmatique** : trouble pragmatique.
- **Phonologie** : épiphonologie, métaphonologie, répétition de
  pseudo-mots, répétition de mots complexes, fluence phonologique,
  dénomination rapide des couleurs.
- **Lexique-sémantique** : dénomination lexique-phonologie, désignation
  d'images, métaphores et expressions idiomatiques (CM1-3e), antonymes.
- **Morphosyntaxe** : compréhension orale de phrases, programmation orale
  de phrases, répétition de phrases complexes, jugement de grammaticalité.
- **Récit** : compréhension orale de paragraphe / récit oral à partir
  d'images.
- **Métamorphologie** : fluence morphologique, jugement de dérivations,
  création de néologismes (CM1-3e).
- **Mémoire à court terme auditivo-verbale** : rappel item / sériel,
  répétition de logatomes, répétition de chiffres endroit et envers.

### Hypothèses autres (non linguistiques)

- **Visuo-attentionnel et inhibition** : empan visuo-attentionnel, effet
  Stroop.
- **Gnosies** : discrimination phonologique, gnosies visuelles de figures.
- **Praxies** : habiletés manuelles et digitales.
- **Mémoire visuo-spatiale** : reproduction de localisation de jetons.
- **Raisonnement logique** : inclusion-classification, classification (CE1-CE2),
  quantification de l'inclusion (6e-3e).

### Pattern d'écriture du CRBO (style Anne Frouard)

La section "Hypothèses explicatives" est structurée par questions :
> **Existe-t-il un trouble du langage oral ?**
> [...épreuves + scores + interprétation par épreuve...]
> [Phrase de synthèse — ex. "XYZ présente un trouble du langage oral portant
> à la fois sur le lexique (stock réduit + accès difficile) et sur la
> morphosyntaxe en production."]
>
> **Existe-t-il un trouble phonologique ?**
> [...épreuves...]
> [Phrase de synthèse — ex. "XYZ présente un trouble phonologique massif qui
> explique donc l'atteinte de la voie d'assemblage au niveau du langage
> écrit."]
>
> **Existe-t-il un trouble visuo-attentionnel ?**
> [...épreuves...]
> [Phrase de synthèse — orientation vers neuropsy si trouble suspecté].
`

export const DECISION_TREE_LANGAGE_ORAL = `## Arbre décisionnel — Langage oral

Pour un bilan de langage oral pur (Exalang 3-6 / 5-8, EVALO 2-6, ELO, N-EEL,
BILO, BELEC, ou composante orale d'EVALEO 6-15), les domaines à explorer :

### Domaines obligatoires

1. **Pragmatique et communication** : attention conjointe, tour de parole,
   adéquation contextuelle, théorie de l'esprit, métaphores et expressions
   idiomatiques (CM1+).

2. **Lexique-sémantique**
   - Production : dénomination d'images, fluence sémantique.
   - Réception : désignation d'images, compréhension de termes génériques.
   - Élaboré : antonymes, métaphores, création de néologismes.

3. **Morphosyntaxe**
   - Production : programmation orale de phrases.
   - Réception : compréhension orale de phrases, compréhension
     morphosyntaxique, jugement de grammaticalité.

4. **Phonologie**
   - Répertoire phonétique, répétition de mots complexes, répétition de
     pseudo-mots, fluence phonologique.
   - Métaphonologie : rimes (acquises MS-GS), syllabes (acquises GS-CP),
     phonèmes (CP-CE1+).

5. **Récit oral**
   - Récit à partir d'une histoire en images.
   - Compréhension orale de paragraphe.

6. **Composantes transverses**
   - Mémoire à court terme verbale : empan endroit / envers, répétition de
     logatomes.
   - Dénomination rapide automatisée (RAN) : couleurs, chiffres — marqueur
     fort dyslexie.

### Hypothèses à explorer

Comme pour le langage écrit, structurer en sous-sections :
- **Existe-t-il un Trouble Développemental du Langage (TDL) ?** (multi-composantes
  déficitaires, antécédents d'enfance, premiers mots tardifs > 24 mois, phrases
  tardives > 36 mois → orientation CRTLA).
- **Existe-t-il un trouble pragmatique isolé ?** (lexique et morphosyntaxe
  préservés mais pragmatique + métaphores + inférences déficitaires →
  orientation TSA / TCS).
- **Y a-t-il une comorbidité avec un trouble cognitif global ?** (profil
  homogène très bas → WISC-V / WPPSI-IV à demander avant conclusion).

### Pattern d'écriture

Même structure que pour le langage écrit : section par section avec
interprétation + phrase de synthèse pour chaque composante. Toujours
mentionner l'**impact fonctionnel** (intelligibilité, communication scolaire,
socialisation).
`

export const DECISION_TREE_COGNITIF_ADULTE = `## Arbre décisionnel — Cognitif adulte / senior (PREDI, MoCA, BECD, BIA)

Pour les bilans adulte/senior, structurer en CROISEMENTS plutôt qu'en
"hypothèses oui/non" — chaque test apporte une dimension.

### Tests et composantes ciblées

- **MoCA** (screening 10 min) → orientation des domaines à explorer.
- **PREDIMEM** → mémoire épisodique, MdT, mémoire visuelle/auditive.
- **PrediFex** → fonctions exécutives (flexibilité, mise à jour, planification,
  inhibition, raisonnement).
- **PrediLac** → lecture adulte (décodage, lexique orthographique,
  compréhension, vitesse).
- **BETL** → langage adulte (lexique, syntaxe, discours).
- **BIA** → aphasie (expression / compréhension orale / écrite, 4 modules).
- **BECD** → dysarthrie (sévérité, perceptif, phonétique, motricité, SHI).

### Profils à explorer (langage / mémoire / exécutif / parole)

- **Profil aphasique** (BIA prioritaire) → caractériser type (Broca, Wernicke,
  conduction, transcorticale, globale, anomique) — JAMAIS d'étiologie.
- **Profil dysarthrique** (BECD prioritaire) → caractériser type Darley
  (hypokinétique parkinson, spastique, ataxique, flasque, mixte).
- **Profil mnésique** (PREDIMEM) → trouble d'encodage / récupération / stockage.
  - Encodage : rappel + reconnaissance tous deux atteints.
  - Récupération : rappel atteint, reconnaissance préservée.
  - Stockage : tout atteint y compris reconnaissance.
- **Profil exécutif** (PrediFex) → flexibilité / mise à jour / planification /
  inhibition / raisonnement.
- **Profil lecture adulte** (PrediLac) → dyslexie phonologique acquise /
  surface / mixte / trouble compréhension isolé.

### Règle absolue : pas de diagnostic étiologique

Tous les tests adulte/senior produisent des HYPOTHÈSES, jamais des
diagnostics. Le diagnostic relève du neurologue, gériatre ou neuropsychologue.
Toujours formuler :
- "Profil compatible avec…"
- "Suggère une fragilité de…"
- "À explorer plus finement en bilan neuropsychologique"
- "Hypothèse à confirmer par imagerie cérébrale"
`
