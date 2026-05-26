/**
 * Extraction PDF dediee EVALEO 6-15.
 *
 * Cible : le rapport de cotation PDF produit par la plateforme HappyNeuron
 * (ou un scan du cahier de passation rempli a la main). Le format de sortie
 * est calibre pour pre-remplir directement le state du form
 * components/forms/Evaleo615ScoresInput.tsx :
 *  - niveau scolaire + trimestre
 *  - 8 jalons anamnese (si presents dans le doc)
 *  - 56+ epreuves : percentile, score brut, temps, observation, effets,
 *    qualification erreurs dictee
 *
 * Respecte la regle d'isolation CLAUDE.md : ce module est specifique a
 * EVALEO, n'est ni reference ni utilise par les autres bilans. La route
 * /api/extract-evaleo-pdf est l'unique consommateur.
 */

import type Anthropic from '@anthropic-ai/sdk'

/** Cles d'epreuves valides — DOIVENT matcher Evaleo615ScoresInput.tsx
 *  (constante SECTIONS, e.key). Si tu modifies l'une, modifie l'autre. */
export const EVALEO_EPREUVE_KEYS = [
  // Langage Oral - Phonologie
  'repertoire_phonetique', 'rep_mots_complexes', 'rep_pseudomots',
  'fluence_phono', 'denom_rapide_couleurs', 'denom_rapide_chiffres',
  // LO - Metaphonologie
  'conscience_articulatoire', 'epiphonologie', 'metaphonologie',
  // LO - Lexique-semantique
  'denom_lex_phono', 'designation_images', 'prod_termes_gen', 'comp_termes_gen',
  'fluence_sem', 'fluence_morpho', 'antonymes', 'metaphores_idiomes',
  'jugement_derivations', 'creation_neologismes',
  // LO - Morphosyntaxe
  'prog_orale_phrases', 'rep_phrases_complexes', 'comp_orale_phrases',
  'jugement_grammatical',
  // LO - Recit oral
  'recit_oral_images', 'comp_orale_paragraphe',
  // LO - Pragmatique
  'pragmatique_communication',
  // Langage Ecrit - Lecture identification
  'conv_grapho_phon', 'lecture_syllabes', 'lecture_mots', 'lecture_pseudomots',
  'eval2m', 'evalouette', 'mouette_test', 'pingouin_retest',
  // LE - Lecture comprehension
  'comp_ecrite_orale_mots', 'comp_ecrite_phrases',
  'comp_ecrite_paragraphe', 'comp_ecrite_texte',
  // LE - Ecriture
  'copie_mots', 'copie_texte', 'acceleration_phrase', 'transcription_buffer',
  // LE - Orthographe
  'dictee_syllabes', 'dictee_pseudomots', 'dictee_mots',
  'fluence_ortho', 'dictee_phrases', 'decision_ortho',
  // LE - Recit ecrit
  'recit_ecrit_images',
  // Autres
  'discrim_phono', 'gnosies_visuelles',
  'empan_visuo_attentionnel', 'stroop',
  'rep_chiffres_endroit_envers', 'rep_logatomes',
  'rappel_item', 'rappel_seriel', 'localisation_jetons',
  'habiletes_manuelles', 'praxies_bucco',
  'inclusion_classification', 'classification', 'quantification_inclusion',
] as const

export type EvaleoEpreuveKey = typeof EVALEO_EPREUVE_KEYS[number]

/** Cles d'epreuves portant des effets de lecture (cf. form). */
export const EVALEO_EPREUVES_AVEC_EFFETS: EvaleoEpreuveKey[] = ['lecture_mots', 'lecture_pseudomots']

/** Cles d'epreuves portant une qualification d'erreurs (cf. form). */
export const EVALEO_EPREUVES_AVEC_ERREURS: EvaleoEpreuveKey[] = ['dictee_mots', 'dictee_pseudomots', 'dictee_phrases']

/** Sortie typee de l'extraction EVALEO. */
export interface EvaleoExtracted {
  niveau: string  // '' | 'CP_1tr' | 'CP_3tr' | 'CE1' | 'CE2' | 'CM1' | 'CM2' | '6e_5e' | '4e_3e'
  trimestre: string  // '' | 'T1' | 'T2' | 'T3'
  anamnese: {
    antecedents_familiaux: string
    antecedents_medicaux: string
    developpement_langage: string
    scolarite: string
    plainte_lecture: string
    plainte_orthographe: string
    plainte_graphisme: string
    comorbidites_suivi: string
  }
  epreuves: Array<{
    key: string  // EvaleoEpreuveKey
    percentile: string  // 'classe_7' | 'classe_6' | 'classe_5' | 'classe_4' | 'classe_3' | 'classe_2' | 'classe_1' | ''
    score_brut: string
    temps: string
    observation: string
    non_passee: boolean
    effets?: {
      effet_frequence: string  // '' | 'absent_normal' | 'leger' | 'marque' | 'tres_marque'
      effet_consistance: string
      effet_longueur_score: string
      effet_longueur_temps: string
      effet_lexicalite: string
    }
    erreurs?: {
      onpp: string  // compteur numerique en string ('', '0', '1', '2'...)
      ol: string
      odm: string
      odnm: string
      fv: string
      fnp: string
      fa: string
      seg: string
      hom: string
    }
  }>
}

/** Schema Anthropic tool_use pour forcer Claude a sortir le JSON structure. */
export const EVALEO_EXTRACT_TOOL: Anthropic.Tool = {
  name: 'extract_evaleo_results',
  description: 'Extrait les resultats d\'un bilan EVALEO 6-15 depuis un rapport PDF de la plateforme HappyNeuron ou un scan de cahier de passation rempli. Retourne le niveau scolaire, trimestre, anamnese si presente, et les scores par epreuve avec percentile, score brut, temps, effets de lecture et qualification d\'erreurs en dictee.',
  input_schema: {
    type: 'object',
    properties: {
      niveau: {
        type: 'string',
        enum: ['', 'CP_1tr', 'CP_3tr', 'CE1', 'CE2', 'CM1', 'CM2', '6e_5e', '4e_3e'],
        description: 'Niveau scolaire au moment de la passation. Vide si non determinable.',
      },
      trimestre: {
        type: 'string',
        enum: ['', 'T1', 'T2', 'T3'],
        description: 'Trimestre. Vide si non determinable, ou si le niveau est CP_1tr/CP_3tr (deja encode).',
      },
      anamnese: {
        type: 'object',
        description: 'Fiche anamnese EVALEO 8 jalons. Chaque champ est un resume court (1-3 phrases) base UNIQUEMENT sur ce qui est explicitement ecrit dans le PDF. Ne JAMAIS inventer. Si l\'info n\'est pas dans le PDF, retourner chaine vide.',
        properties: {
          antecedents_familiaux: { type: 'string' },
          antecedents_medicaux:  { type: 'string' },
          developpement_langage: { type: 'string' },
          scolarite:             { type: 'string' },
          plainte_lecture:       { type: 'string' },
          plainte_orthographe:   { type: 'string' },
          plainte_graphisme:     { type: 'string' },
          comorbidites_suivi:    { type: 'string' },
        },
        required: ['antecedents_familiaux', 'antecedents_medicaux', 'developpement_langage', 'scolarite', 'plainte_lecture', 'plainte_orthographe', 'plainte_graphisme', 'comorbidites_suivi'],
      },
      epreuves: {
        type: 'array',
        description: 'Une entree par epreuve passee. Ne PAS inclure les epreuves non passees ou absentes du PDF — uniquement celles avec au moins une donnee chiffree ou qualitative.',
        items: {
          type: 'object',
          properties: {
            key: {
              type: 'string',
              enum: [...EVALEO_EPREUVE_KEYS],
              description: 'Cle technique de l\'epreuve. DOIT matcher la liste fournie.',
            },
            percentile: {
              type: 'string',
              enum: ['', 'classe_7', 'classe_6', 'classe_5', 'classe_4', 'classe_3', 'classe_2', 'classe_1'],
              description: 'Classe EVALEO officielle (grille 7 classes Launay et al. 2018). Mapping : classe_1 (Pathologique, <P7, rouge), classe_2 (Fragilite, P7-P20, orange), classe_3/classe_4/classe_5 (Norme, P21-P38/P39-P62/P63-P80, verts clair/moyen/fonce — totalisent 60 % de la population), classe_6 (Superieure a la moyenne, P81-P93, bleu clair), classe_7 (Tres superieure, >P93, bleu fonce). Recopier la classe affichee par la plateforme. Si seul un percentile est donne, convertir selon ces bornes. Les 3 classes de norme ne sont PAS sous-etiquetees "basse/mediane/haute" — toutes "Norme".',
            },
            score_brut: { type: 'string', description: 'Score brut tel qu\'affiche, format libre (ex. "23/30", "78", "12,5"). Vide si absent.' },
            temps:      { type: 'string', description: 'Temps en secondes (ou millisecondes pour empan_visuo_attentionnel). Vide si absent.' },
            observation:{ type: 'string', description: 'Observation qualitative associee (strategie, type d\'erreur, attitude). Vide si absente.' },
            non_passee: { type: 'boolean', description: 'true si l\'epreuve est explicitement marquee "non passee" / "NP" / "NT". Defaut false.' },
            effets: {
              type: 'object',
              description: 'UNIQUEMENT pour key in [lecture_mots, lecture_pseudomots]. Niveau d\'effet selon HappyNeuron : absent_normal / leger / marque / tres_marque. Vide si non determine. effet_lexicalite UNIQUEMENT sur lecture_pseudomots.',
              properties: {
                effet_frequence:       { type: 'string', enum: ['', 'absent_normal', 'leger', 'marque', 'tres_marque'] },
                effet_consistance:     { type: 'string', enum: ['', 'absent_normal', 'leger', 'marque', 'tres_marque'] },
                effet_longueur_score:  { type: 'string', enum: ['', 'absent_normal', 'leger', 'marque', 'tres_marque'] },
                effet_longueur_temps:  { type: 'string', enum: ['', 'absent_normal', 'leger', 'marque', 'tres_marque'] },
                effet_lexicalite:      { type: 'string', enum: ['', 'absent_normal', 'leger', 'marque', 'tres_marque'] },
              },
            },
            erreurs: {
              type: 'object',
              description: 'UNIQUEMENT pour key in [dictee_mots, dictee_pseudomots, dictee_phrases]. Compteurs numeriques en string ("0", "2", "5"). Vide si non determine. dictee_pseudomots porte UNIQUEMENT onpp. dictee_mots porte onpp/ol/odm/odnm. dictee_phrases porte tous les compteurs.',
              properties: {
                onpp: { type: 'string', description: 'Orthographe Non Phonetiquement Plausible' },
                ol:   { type: 'string', description: 'Orthographe Lexicale' },
                odm:  { type: 'string', description: 'Orthographe Derivable Morphologiquement' },
                odnm: { type: 'string', description: 'Orthographe Derivable Non Morphologiquement' },
                fv:   { type: 'string', description: 'Flexion Verbale' },
                fnp:  { type: 'string', description: 'Flexion Nominale et Pronominale' },
                fa:   { type: 'string', description: 'Flexion Adjectivale' },
                seg:  { type: 'string', description: 'Segmentation' },
                hom:  { type: 'string', description: 'Homophones' },
              },
            },
          },
          required: ['key', 'percentile', 'score_brut', 'temps', 'observation', 'non_passee'],
        },
      },
    },
    required: ['niveau', 'trimestre', 'anamnese', 'epreuves'],
  },
}

/**
 * Prompt systeme dedie a l'extraction EVALEO. Cale sur le format HappyNeuron
 * tel qu'affiche par la plateforme : tableaux par domaine + colonnes classe/
 * percentile/score/temps + sections specifiques pour effets de lecture et
 * qualification d'erreurs en dictee.
 */
export const EVALEO_EXTRACT_PROMPT = `Tu es un expert en extraction de donnees de bilans orthophoniques EVALEO 6-15
(Launay, Maeder, Roustit, Touzin — Ortho Edition 2018). Tu recois soit un
rapport PDF produit par la plateforme HappyNeuron (cotation informatisee), soit
un scan de cahier de passation rempli a la main, soit un document Word/PDF
contenant les resultats d'un bilan EVALEO.

# OBJECTIF

Extraire les donnees brutes du bilan pour pre-remplir le formulaire de saisie
ortho.ia. **N'INVENTE RIEN.** Si une donnee n'est pas presente dans le document,
laisse le champ vide ('' ou false selon le type). Mieux vaut un champ vide
qu'une hallucination.

Tu DOIS appeler l'outil \`extract_evaleo_results\` pour retourner ta sortie.
N'ecris aucun texte hors de l'appel d'outil.

# 1. NIVEAU SCOLAIRE ET TRIMESTRE

Cherche en tete du document (page 1 ou 2) la classe de l'enfant. Mappe-la sur
les codes ortho.ia :
- "CP 1er trimestre", "CP T1", "CP debut" → \`CP_1tr\`
- "CP 3e trimestre", "CP T3", "CP fin" → \`CP_3tr\`
- "CE1" → \`CE1\` (sans trimestre → laisser trimestre='')
- "CE1 T2" → \`CE1\` + \`T2\`
- "CE2", "CM1", "CM2" → idem
- "6e" ou "5e" → \`6e_5e\`
- "4e" ou "3e" → \`4e_3e\`

Si la classe n'est pas claire : laisser \`niveau=''\` (NE PAS deviner).

# 2. ANAMNESE (8 JALONS)

Si le PDF contient une section anamnese/identite/motif, extraire un resume court
(1-3 phrases) pour chacun des 8 jalons :
1. Antecedents familiaux (langage, scolarite, bilinguisme)
2. Antecedents medicaux (prematurite, ORL, neuro)
3. Developpement du langage oral (jalons)
4. Scolarite (parcours)
5. Plainte lecture
6. Plainte orthographe
7. Plainte graphisme
8. Comorbidites et suivi en cours (TDAH, TSA, ortho anterieure)

Si l'info n'est pas dans le PDF → chaine vide. **Pas d'invention.**

# 3. EPREUVES

Pour CHAQUE epreuve passee dans le PDF, creer une entree avec :

**key** : cle technique exacte (cf. liste de l'enum). Mappe les libelles du
PDF sur les cles. Exemples :
- "Lecture de mots" / "IME - lecture mots" / "Mots reels" → \`lecture_mots\`
- "Lecture de pseudomots" / "Logatomes en lecture" → \`lecture_pseudomots\`
- "Dictee de mots" → \`dictee_mots\`
- "Dictee de phrases" → \`dictee_phrases\`
- "Dictee de pseudomots" / "Dictee logatomes" → \`dictee_pseudomots\`
- "Repetition de pseudomots" / "Repetition logatomes" → \`rep_pseudomots\` (LO, distinct de la dictee)
- "Empan visuo-attentionnel" / "EVA" → \`empan_visuo_attentionnel\` (en MILLISECONDES)
- "Conversion grapho-phonemique" / "CGP" → \`conv_grapho_phon\`
- "EVAL2M" / "Lecture mots 2 min" → \`eval2m\`
- "Mouette" / "Texte signifiant test" → \`mouette_test\`
- "Pingouin" / "Texte retest" → \`pingouin_retest\`
- "Evalouette" / "Texte non signifiant" → \`evalouette\`
- Si une epreuve ne matche AUCUNE cle de l'enum, NE PAS la creer (l'enum est strict).

**percentile** : recopier la **classe EVALEO** affichee par la plateforme
HappyNeuron, en utilisant la grille officielle Launay et al. 2018 (7 classes).
Code couleur officiel : rouge (1), orange (2), vert clair/moyen/fonce (3-5),
bleu clair (6), bleu fonce (7).

- Classe 7 (>P93, 7 %)        → \`classe_7\` ("Tres superieure")
- Classe 6 (P81-P93, 13 %)    → \`classe_6\` ("Superieure a la moyenne")
- Classe 5 (P63-P80, 18 %)    → \`classe_5\` ("Norme")
- Classe 4 (P39-P62, 24 %)    → \`classe_4\` ("Norme")
- Classe 3 (P21-P38, 18 %)    → \`classe_3\` ("Norme")
- Classe 2 (P7-P20, 13 %)     → \`classe_2\` ("Fragilite", zone a risque)
- Classe 1 (<P7, 7 %)         → \`classe_1\` ("Pathologique")

⚠️ Les classes 3, 4, 5 sont TOUTES "Norme" (60 % de la population). Ne JAMAIS
les sous-etiqueter "norme faible/mediane/haute" — c'est une fabrication non
officielle.

Le PDF EVALEO peut presenter la classe sous forme de barre coloree (1-7), de
nombre, ou de label texte ("Pathologique", "Fragilite", "Norme", "Superieure
a la moyenne", "Tres superieure"). Tous ces formats mappent sur les 7 codes
ci-dessus. Si seul un percentile chiffre est disponible, convertir selon les
bornes ci-dessus.

⚠️ NE PAS utiliser la grille Exalang (Excellent / Moyenne haute / Difficulte
severe...) — c'est une autre batterie. EVALEO impose ses 7 classes officielles.

🔒 **EPREUVES MULTI-SOUS-SCORES — REGLE OFFICIELLE EVALEO (CRUCIALE)**

⛔ **INTERDICTION ABSOLUE** :
- ❌ NE FAIS JAMAIS de moyenne arithmetique des classes des sous-scores.
- ❌ NE PRENDS JAMAIS la classe la plus haute ni la "mediane" des sous-scores.
- ❌ NE PRENDS JAMAIS automatiquement la classe du premier sous-score (Score)
  en ignorant les autres principaux.
- ❌ N'INVENTE PAS une classe intermediaire qui n'existe dans AUCUN sous-score.

✅ **PROCEDURE STRICTE EN 3 ETAPES** pour chaque epreuve a sous-scores
multiples :

1. **Etape 1 — Identifier les sous-scores PRINCIPAUX** uniquement (cf. tableau
   ci-dessous). Les autres sous-scores du tableau de cotation DOIVENT etre
   ignores pour la determination de \`percentile\` (ils servent au commentaire).

2. **Etape 2 — Lire la classe (1-7) de CHAQUE sous-score principal** dans la
   grille de cotation du PDF (cellule cochee X).

3. **Etape 3 — Prendre la classe LA PLUS BASSE** parmi les sous-scores
   principaux identifies. C'est cette classe (et UNIQUEMENT cette classe)
   qui doit etre reportee dans \`percentile\`.

**Pourquoi "la plus basse"** : c'est la convention clinique conservative
officielle EVALEO (canevas Anne Frouard, Justine Peyre, bilans ortho-edition
Mila/Enora). Une dissociation entre 2 sous-scores principaux est un signal
clinique fort — on report le pire en \`percentile\` et on decrit la
dissociation dans le \`observation\` ou dans le commentaire genere.

**Tableau des sous-scores principaux par epreuve** — la colonne "principaux
UNIQUEMENT" est exhaustive : tout ce qui n'y est pas est un sous-score
complementaire a ignorer pour \`percentile\`.

| Epreuve (key) | Sous-scores PRINCIPAUX (et eux seuls) | Sous-scores a IGNORER pour \`percentile\` |
|---|---|---|
| \`lecture_mots\` | Score total /44, Temps total | Score serie 1/2, Temps serie 1/2, Variables (consistance, frequence, longueur) |
| \`lecture_pseudomots\` | **Score /22 ET Temps** (les 2 sont principaux — prendre la PIRE) | Effets de lexicalite (diff score, diff temps) |
| \`evalouette\`, \`mouette_test\`, \`pingouin_retest\` | Score mots correctement lus (efficience, NMCL) — **un seul principal** | Vitesse, % corrects/lus, Indice degradation |
| \`eval2m\` | Score d'efficience | Vitesse |
| \`comp_ecrite_phrases\` | Score total /15 | — (un seul) |
| \`comp_ecrite_paragraphe\`, \`comp_ecrite_texte\`, \`comp_ecrite_orale_mots\` | Score total (+ Temps si present) | Sous-scores lexicaux, inferences, coreferences, chronologie |
| \`dictee_pseudomots\` | Score pseudomots corrects | Temps, ONPP |
| \`dictee_mots\` | Score mots corrects | Temps, types d'erreurs (ONPP, OL, ODM, ODNM), indices |
| \`dictee_phrases\` | Score mots corrects (avant relecture), Temps | Tous types d'erreurs, scores apres relecture |
| \`decision_ortho\` | Score corrects | Erreurs flexions, linguistiques |
| \`recit_ecrit_images\` | Nb mots, Total macrostructure, Total Microstructure elements adaptes, Taux erreurs en orthographe | Tous sous-scores macro/micro/diversite/orthographe detaille |
| \`stroop\` | **Temps 3 ET Temps 4 — PRINCIPAUX EXCLUSIFS** | Score 1, Score 2, Score 3, Score 4, Temps 1, Temps 2 (= sous-scores de baseline et lecture simple) |
| \`empan_visuo_attentionnel\` | Empan VA moyen, Total Report Chiffres | Seuil moyen identification, Score Report global RC1-RC5 |
| \`rep_chiffres_endroit_envers\` | **Empan endroit ET Empan envers — PRINCIPAUX EXCLUSIFS** | Score endroit /18, Score envers /18 |
| \`rep_logatomes\` | Total logatomes CV+CCV, Total syllabes CV+CCV | Empans CV/CCV, Logatomes CV/CCV, Syllabes CV/CCV |
| \`rappel_item\` | Score /10 | — (un seul) |
| \`rappel_seriel\` | Score item Rappel seriel | Empan, Score images placees |
| \`rep_phrases_complexes\` | **Score phrases Morphosyntaxe (MS correctes /15 ou /16) ET Empan nombre de mots — PRINCIPAUX EXCLUSIFS** | Mots en erreur MS, Total erreurs MS |
| \`metaphonologie\` | Score total metaphonologie, Temps total | Score Suppression, Score Contrepeteries, Temps Suppression, Temps Contrepeteries |
| \`denom_lex_phono\` | Total Lexique, Total temps, Gain Lexique, Total Phonologie | % phono correcte, % phono mots bien repetes |
| \`denom_rapide_couleurs\`, \`denom_rapide_chiffres\` | Score Denomination, Temps | — |
| \`creation_neologismes\` | Score, Temps | — |
| Epreuves a score unique (\`prog_orale_phrases\`, \`comp_orale_phrases\`, \`rep_pseudomots\`, \`designation_images\`, \`discrim_phono\`, \`fluence_*\`, etc.) | Le score unique | — |

**EXEMPLES CHIFFRES — applique strictement la procedure** :

**Exemple A — \`stroop\`** :
- PDF montre : Score 1 cl7, Score 2 cl2, Score 3 cl3, Score 4 cl7, Temps 1 cl4,
  Temps 2 cl2, Temps 3 cl3, Temps 4 cl5.
- Etape 1 : principaux = Temps 3 et Temps 4 UNIQUEMENT. Tout le reste ignore.
- Etape 2 : Temps 3 = cl3, Temps 4 = cl5.
- Etape 3 : min(cl3, cl5) = cl3 → \`percentile = 'classe_3'\`.
- ❌ NE PAS prendre cl4 (qui serait une moyenne) ni cl2 (sous-score Temps 2).

**Exemple B — \`rep_phrases_complexes\`** :
- PDF montre : Score MS = 12/15 cl2, Mots en erreur = 6/75 cl1, Empan mots = 13 cl7.
- Etape 1 : principaux = Score MS et Empan mots. "Mots en erreur" est un
  sous-score IGNORE pour \`percentile\`.
- Etape 2 : Score MS = cl2, Empan mots = cl7.
- Etape 3 : min(cl2, cl7) = cl2 → \`percentile = 'classe_2'\`.
- ❌ NE PAS prendre cl3 (moyenne implicite des 3 sous-scores) ni cl7 (la classe
  haute) ni cl1 (sous-score Mots en erreur).

**Exemple C — \`lecture_pseudomots\`** :
- PDF montre : Score /22 = 18/22 cl3, Temps = 73 sec cl2.
- Etape 1 : principaux = Score ET Temps (les 2).
- Etape 2 : Score = cl3, Temps = cl2.
- Etape 3 : min(cl3, cl2) = cl2 → \`percentile = 'classe_2'\`.
- ❌ NE PAS prendre cl3 (en ignorant le Temps).

**Exemple D — \`rep_chiffres_endroit_envers\`** :
- PDF montre : Empan endroit cl1, Empan envers cl1, Score endroit cl2, Score
  envers cl2.
- Etape 1 : principaux = Empan endroit et Empan envers UNIQUEMENT.
- Etape 2 : les 2 empans en cl1.
- Etape 3 : min(cl1, cl1) = cl1 → \`percentile = 'classe_1'\`.

Si la classe n'est pas claire dans le PDF → ''.

**score_brut** : tel qu'affiche, format libre. Ex. "23/30", "78%", "12.5".

🔒 **VALIDATION DENOMINATEUR — sois TRES rigoureux sur le "/N"** : le
denominateur d'un score "X/N" est FIXE par la batterie EVALEO et ne
varie pas d'un enfant a l'autre. Tu DOIS verifier que le N que tu lis
sur le PDF correspond a la valeur attendue ci-dessous. Si tu lis un N
different, RELIS le PDF — c'est tres probablement une mauvaise
reconnaissance OCR / Vision (par exemple "6" lu comme "10").

| Epreuve EVALEO | Score principal | Denominateur fixe |
|---|---|---|
| Dictee de pseudomots | Score pseudomots corrects | **/6** (jamais /10) |
| Dictee de mots | Score mots corrects | **/18** (CE2 a 3e) |
| Dictee de phrases | Score mots corrects | **/40** (variable selon niveau, 30-50) |
| Lecture de mots | Score total | **/44** (22 + 22) |
| Lecture de mots | Score serie 1 ou serie 2 | **/22** chacune |
| Lecture de pseudomots | Score | **/22** |
| Comprehension ecrite de phrases | Score | **/15** ou **/17** selon niveau |
| Comprehension orale de phrases | Score | **/15** ou **/17** selon niveau |
| Programmation orale de phrases | Score | **/21** |
| Repetition de phrases complexes | Score MS | **/15** ou **/16** |
| Decision orthographique | Score corrects | **/7** |
| Decision orthographique | Erreurs linguistiques | **/4** |
| Decision orthographique | Erreurs sur flexions | **/3** |
| Rappel - Item | Score | **/10** |
| Repetition de chiffres endroit | Score endroit | **/18** |
| Repetition de chiffres envers | Score envers | **/18** |
| Stroop | Score 1 a 4 | **/45** chacun |

⚠️ Si tu lis un denominateur qui n'est PAS dans cette table pour
l'epreuve correspondante, c'est TRES PROBABLEMENT une erreur de Vision.
Privilegie le denominateur canonique de la table — l'utilisateur le
corrigera s'il y a une exception.

**temps** : en secondes (ms pour empan_visuo_attentionnel). Format libre.
**observation** : reprendre une eventuelle annotation qualitative ortho.

**non_passee** : true uniquement si explicitement marque "NP" / "non passee" /
"non realisee" / "NT" / "-". Defaut false.

# 4. EFFETS EN LECTURE (lecture_mots, lecture_pseudomots)

Si le PDF affiche des graphiques ou tableaux "Effets" pour ces 2 epreuves,
extraire les 4-5 effets et coder en niveau d'effet HappyNeuron :

| HappyNeuron | Code |
|-------------|------|
| Classe 4-5 (effet absent ou tres faible) | \`absent_normal\` |
| Classe 3 (effet present mais limite) | \`leger\` |
| Classe 2 (effet net) | \`marque\` |
| Classe 1 (effet massif) | \`tres_marque\` |

Les 4 effets standards : effet_frequence, effet_consistance, effet_longueur_score,
effet_longueur_temps. Le 5e (effet_lexicalite) UNIQUEMENT sur lecture_pseudomots.

Si l'effet n'est pas presente dans le PDF → ''.

# 5. QUALIFICATION DES ERREURS EN DICTEE

Si le PDF affiche les compteurs par type d'erreur pour les dictees, extraire :
- dictee_pseudomots : UNIQUEMENT \`onpp\`
- dictee_mots : \`onpp\`, \`ol\`, \`odm\`, \`odnm\`
- dictee_phrases : tous les compteurs (onpp/ol/odm/odnm/fv/fnp/fa/seg/hom)

Format : compteur numerique en string ("0", "1", "3", "12"). Vide si non
present dans le PDF.

# 6. PRINCIPES GENERAUX

- **Conservateur** : si un doute, laisser vide. L'ortho corrigera dans le form.
- **Pas d'invention** : zero champ rempli par defaut ou par interpolation.
- **Format strict** : respecter les enums (sinon le form rejette).
- **Une entree par epreuve** : ne pas dupliquer (une seule \`lecture_mots\` meme
  si le PDF detaille par categorie de mots).
- **Pas d'epreuve absente** : si une epreuve n'est pas dans le PDF, ne PAS
  l'inclure dans le tableau.

Si le PDF n'est PAS un bilan EVALEO (autre test, page blanche, document non
pertinent), retourne niveau='', trimestre='', anamnese vide, epreuves=[].`
