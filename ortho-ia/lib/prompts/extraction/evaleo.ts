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
    /** Classe EVALEO de la VITESSE (Temps total) pour `lecture_mots` et
     *  `lecture_pseudomots`. `percentile` ci-dessus reste la classe de la
     *  PRECISION (Score total). Quand les 2 sont presents, le rapport
     *  affichera 2 lignes distinctes. */
    percentile_vitesse?: string
    /** Niveau scolaire equivalent EVALEO pour `evalouette`, `mouette_test`,
     *  `pingouin_retest`. Format texte type "CE1 T1", "CM2 T3". */
    niveau_equivalent?: string
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
            percentile_vitesse: {
              type: 'string',
              enum: ['', 'classe_7', 'classe_6', 'classe_5', 'classe_4', 'classe_3', 'classe_2', 'classe_1'],
              description: 'UNIQUEMENT pour key in [lecture_mots, lecture_pseudomots]. Classe EVALEO de la VITESSE (Temps total). `percentile` reste la classe de la PRECISION (Score total). Recopier la classe affichee dans la colonne du Temps total (cf. tableau de cotation EVALEO). Si seul un sous-score est visible, laisser ce champ vide.',
            },
            niveau_equivalent: {
              type: 'string',
              description: 'UNIQUEMENT pour key in [evalouette, mouette_test, pingouin_retest]. Niveau scolaire equivalent EVALEO lu sous le tableau de cotation, ligne "Resultat <Test> correspondant au niveau de la classe : CE1 1" (= "CE1 trimestre 1"). FORMAT NORMALISE ortho.ia : "CP T1", "CP T3", "CE1 T1", "CE1 T2", "CE1 T3", "CE2 T1"...  → assembler la classe + " T" + numero de trimestre. Vide si la ligne est absente du document. ATTENTION : ne PAS confondre avec la classe sept-classes (qui est dans `percentile`).',
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
| \`lecture_mots\` | **PRECISION (Score total /44) → \`percentile\` ET VITESSE (Temps total) → \`percentile_vitesse\`** (ne PAS prendre le min — extraire les 2 classes separement, cf. section dediee §3.bis) | Score serie 1/2, Temps serie 1/2, Variables (consistance, frequence, longueur) |
| \`lecture_pseudomots\` | **PRECISION (Score /22) → \`percentile\` ET VITESSE (Temps) → \`percentile_vitesse\`** (idem : extraire les 2 separement, ne PAS prendre le min) | Effets de lexicalite (diff score, diff temps) |
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

**Exemple C — \`lecture_pseudomots\` (NOUVELLE REGLE — extraction DUAL)** :
- PDF montre : Score /22 = 18/22 cl3, Temps = 73 sec cl2.
- Extraction : \`percentile = 'classe_3'\` (precision) ET
  \`percentile_vitesse = 'classe_2'\` (vitesse).
- ⚠️ NE PAS prendre le min — extrais les 2 classes separement. Le rapport
  final affichera 2 lignes distinctes ("Lecture de pseudomots (precision)"
  et "Lecture de pseudomots (vitesse)"). Idem pour \`lecture_mots\`.

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

# 3.bis. DUAL PRECISION/VITESSE (lecture_mots, lecture_pseudomots) + NIVEAU SCOLAIRE EQUIVALENT (evalouette, mouette_test, pingouin_retest)

**Champs additionnels OPTIONNELS** (laisse vide si non determinable) :

## \`percentile_vitesse\` — UNIQUEMENT pour \`lecture_mots\` et \`lecture_pseudomots\`

EVALEO fournit pour ces 2 epreuves DEUX sous-scores principaux distincts : un
score de PRECISION (Score total /44 ou /22) et un score de VITESSE (Temps
total). Au lieu de fusionner les 2 en un seul \`percentile\` (ancienne regle
"min" — desormais ABROGEE pour ces 2 epreuves), tu DOIS extraire les 2 classes
separement :

- \`percentile\` = classe EVALEO du SCORE TOTAL (precision).
- \`percentile_vitesse\` = classe EVALEO du TEMPS TOTAL (vitesse).

Exemple : PDF montre Score 18/22 en colonne 3, Temps 73s en colonne 2 du
tableau de cotation \`lecture_pseudomots\` → \`percentile = 'classe_3'\` ET
\`percentile_vitesse = 'classe_2'\`.

Si seul UN des 2 sous-scores est visible/lisible dans le PDF, remplis ce
champ-la et laisse l'autre vide. Le form ortho.ia preremplira en consequence.

## \`niveau_equivalent\` — UNIQUEMENT pour \`evalouette\`, \`mouette_test\`, \`pingouin_retest\`

Le cahier EVALEO affiche pour ces 3 epreuves, **sous le tableau de cotation**,
une ligne du type :

> \`Resultat <Test> correspondant au niveau de la classe : CE1 1\`

Le chiffre apres le niveau scolaire (CE1/CE2/CM1...) est le **TRIMESTRE** du
niveau de lecture equivalent — il N'EST PAS la classe sept-classes EVALEO
(piege classique, cf. Exemples E et F ci-dessus).

🔒 **Tu DOIS** :
1. Extraire la classe sept-classes depuis le tableau de cotation (colonnes
   1-7) → \`percentile\` (typiquement "classe_2" pour un enfant en difficulte
   de lecture).
2. Extraire en PLUS la ligne du niveau scolaire equivalent et la convertir
   au format normalise ortho.ia → \`niveau_equivalent\`.

**Format normalise** : "\`<NIVEAU> T<N>\`" sans espaces autour du T.
- "CE1 1" → \`niveau_equivalent = 'CE1 T1'\`
- "CE2 3" → \`niveau_equivalent = 'CE2 T3'\`
- "CM1 2" → \`niveau_equivalent = 'CM1 T2'\`

Si la ligne "correspondant au niveau de la classe :" n'apparait pas dans le
PDF → \`niveau_equivalent = ''\`.

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


// ============================================================================
// CONVERTER : EvaleoExtracted → CRBOStructure
// ============================================================================
// Utilise par la route /api/extract-previous-bilan en mode "renouvellement
// EVALEO" pour produire une CRBOStructure compatible avec le rendu Word
// comparatif et le pipeline de generation existant.
//
// La CRBOStructure perd certaines specificites EVALEO (effets HappyNeuron
// detailles, qualification erreurs dictee par compteur), mais elle conserve :
//  - Les percentile_value (mappes depuis classe_X via medianes officielles)
//  - Les labels d'epreuves (libelles EVALEO standards, matchent le form)
//  - Les observations qualitatives + synthese effets/erreurs en commentaire
// C'est ce dont a besoin le rendu Word renouvellement pour produire son
// tableau comparatif avec fleches ↑→↓.

/** Mediane de la fourchette de percentiles pour chaque classe EVALEO.
 *  DOIT etre aligne avec PERCENTILE_OPTIONS dans
 *  components/forms/Evaleo615ScoresInput.tsx (champ `value`). */
const CLASSE_TO_PERCENTILE_VALUE: Record<string, number> = {
  classe_1: 3,
  classe_2: 13,
  classe_3: 30,
  classe_4: 50,
  classe_5: 71,
  classe_6: 87,
  classe_7: 96,
}

const CLASSE_TO_LABEL: Record<string, string> = {
  classe_1: 'Classe 1 (Pathologique)',
  classe_2: 'Classe 2 (Fragilite)',
  classe_3: 'Classe 3 (Norme)',
  classe_4: 'Classe 4 (Norme)',
  classe_5: 'Classe 5 (Norme)',
  classe_6: 'Classe 6 (Superieure a la moyenne)',
  classe_7: 'Classe 7 (Tres superieure)',
}

/** Mapping key EVALEO → domaine narratif pour la CRBOStructure. Aligne sur
 *  les SECTIONS du form (Langage Oral / Langage Ecrit / Autres) et leurs
 *  sous-domaines. Les keys non listees tombent dans "Autres". */
function evaleoKeyToDomainName(key: string): string {
  // Langage Oral
  if (['repertoire_phonetique', 'rep_mots_complexes', 'rep_pseudomots',
       'fluence_phono', 'denom_rapide_couleurs', 'denom_rapide_chiffres',
       'conscience_articulatoire', 'epiphonologie', 'metaphonologie'].includes(key)) {
    return 'Phonologie & Metaphonologie (LO)'
  }
  if (['denom_lex_phono', 'designation_images', 'prod_termes_gen', 'comp_termes_gen',
       'fluence_sem', 'fluence_morpho', 'antonymes', 'metaphores_idiomes',
       'jugement_derivations', 'creation_neologismes'].includes(key)) {
    return 'Lexique-semantique (LO)'
  }
  if (['prog_orale_phrases', 'rep_phrases_complexes', 'comp_orale_phrases',
       'jugement_grammatical'].includes(key)) {
    return 'Morphosyntaxe (LO)'
  }
  if (['recit_oral_images', 'comp_orale_paragraphe'].includes(key)) {
    return 'Recit oral (LO)'
  }
  if (key === 'pragmatique_communication') return 'Pragmatique (LO)'
  // Langage Ecrit
  if (['conv_grapho_phon', 'lecture_syllabes', 'lecture_mots', 'lecture_pseudomots',
       'eval2m', 'evalouette', 'mouette_test', 'pingouin_retest'].includes(key)) {
    return 'Lecture identification (LE)'
  }
  if (['comp_ecrite_orale_mots', 'comp_ecrite_phrases',
       'comp_ecrite_paragraphe', 'comp_ecrite_texte'].includes(key)) {
    return 'Lecture comprehension (LE)'
  }
  if (['copie_mots', 'copie_texte', 'acceleration_phrase', 'transcription_buffer'].includes(key)) {
    return 'Ecriture (LE)'
  }
  if (['dictee_syllabes', 'dictee_pseudomots', 'dictee_mots',
       'fluence_ortho', 'dictee_phrases', 'decision_ortho'].includes(key)) {
    return 'Production orthographe (LE)'
  }
  if (key === 'recit_ecrit_images') return 'Recit ecrit (LE)'
  // Autres
  return 'Competences sous-jacentes'
}

/** Label affiche d'une epreuve EVALEO depuis sa key. Reprend les libelles
 *  officiels EVALEO 6-15. */
const EVALEO_KEY_TO_LABEL: Record<string, string> = {
  // LO Phono
  repertoire_phonetique: 'Repertoire phonetique',
  rep_mots_complexes: 'Repetition de mots complexes',
  rep_pseudomots: 'Repetition de pseudomots',
  fluence_phono: 'Fluence phonologique',
  denom_rapide_couleurs: 'Denomination rapide couleurs',
  denom_rapide_chiffres: 'Denomination rapide chiffres',
  conscience_articulatoire: 'Conscience articulatoire',
  epiphonologie: 'Epiphonologie',
  metaphonologie: 'Metaphonologie',
  // LO Lexique-sem
  denom_lex_phono: 'Denomination lexico-phonologique',
  designation_images: "Designation d'images",
  prod_termes_gen: 'Production de termes generiques',
  comp_termes_gen: 'Comprehension de termes generiques',
  fluence_sem: 'Fluence semantique',
  fluence_morpho: 'Fluence morphologique',
  antonymes: 'Antonymes',
  metaphores_idiomes: 'Metaphores et idiomes',
  jugement_derivations: 'Jugement de derivations',
  creation_neologismes: 'Creation de neologismes',
  // LO Morphosyntaxe
  prog_orale_phrases: 'Production orale de phrases',
  rep_phrases_complexes: 'Repetition de phrases complexes',
  comp_orale_phrases: 'Comprehension orale de phrases',
  jugement_grammatical: 'Jugement grammatical',
  // LO Recit
  recit_oral_images: "Recit oral a partir d'images",
  comp_orale_paragraphe: 'Comprehension orale de paragraphe',
  // LO Pragmatique
  pragmatique_communication: 'Pragmatique de la communication',
  // LE Lecture id
  conv_grapho_phon: 'Conversion grapho-phonemique',
  lecture_syllabes: 'Lecture de syllabes',
  lecture_mots: 'Lecture de mots',
  lecture_pseudomots: 'Lecture de pseudomots',
  eval2m: 'EVAL2M - Lecture de mots en 2 min',
  evalouette: 'Evalouette - Lecture de texte non signifiant',
  mouette_test: 'La Mouette - Lecture de texte signifiant (test)',
  pingouin_retest: 'Le Pingouin - Lecture de texte signifiant (retest)',
  // LE Comprehension
  comp_ecrite_orale_mots: 'Comprehension ecrite et orale de mots',
  comp_ecrite_phrases: 'Comprehension ecrite de phrases',
  comp_ecrite_paragraphe: 'Comprehension ecrite de paragraphe',
  comp_ecrite_texte: 'Comprehension ecrite de texte',
  // LE Ecriture
  copie_mots: 'Copie de mots',
  copie_texte: 'Copie de texte',
  acceleration_phrase: "Acceleration sur l'ecriture d'une phrase",
  transcription_buffer: 'Transcription & buffer graphemique',
  // LE Orthographe
  dictee_syllabes: 'Dictee de syllabes',
  dictee_pseudomots: 'Dictee de pseudomots',
  dictee_mots: 'Dictee de mots',
  fluence_ortho: 'Fluence orthographique',
  dictee_phrases: 'Dictee de phrases',
  decision_ortho: 'Decision orthographique',
  // LE Recit
  recit_ecrit_images: "Recit a l'ecrit a partir d'images",
  // Autres
  discrim_phono: 'Discrimination phonologique',
  gnosies_visuelles: 'Gnosies visuelles',
  empan_visuo_attentionnel: 'Empan visuo-attentionnel',
  stroop: 'Effet Stroop',
  rep_chiffres_endroit_envers: 'Repetition de chiffres endroit/envers',
  rep_logatomes: 'Repetition de logatomes',
  rappel_item: 'Rappel item',
  rappel_seriel: 'Rappel seriel',
  localisation_jetons: 'Localisation de jetons',
  habiletes_manuelles: 'Habiletes manuelles',
  praxies_bucco: 'Praxies bucco-faciales',
  inclusion_classification: 'Inclusion/classification',
  classification: 'Classification',
  quantification_inclusion: 'Quantification/inclusion',
}

/** Synthese courte des effets HappyNeuron presents — utilisee comme
 *  commentaire d'epreuve sur lecture_mots / lecture_pseudomots. */
function summarizeEffets(effets: NonNullable<EvaleoExtracted['epreuves'][number]['effets']>): string {
  const labels: string[] = []
  const fmt = (v: string) => v === 'absent_normal' ? 'absent' : v.replace('_', ' ')
  if (effets.effet_frequence) labels.push(`frequence=${fmt(effets.effet_frequence)}`)
  if (effets.effet_consistance) labels.push(`consistance=${fmt(effets.effet_consistance)}`)
  if (effets.effet_longueur_score) labels.push(`longueur(score)=${fmt(effets.effet_longueur_score)}`)
  if (effets.effet_longueur_temps) labels.push(`longueur(temps)=${fmt(effets.effet_longueur_temps)}`)
  if (effets.effet_lexicalite) labels.push(`lexicalite=${fmt(effets.effet_lexicalite)}`)
  return labels.length > 0 ? `Effets HappyNeuron : ${labels.join(' · ')}.` : ''
}

/** Synthese courte de la qualification d'erreurs en dictee. */
function summarizeErreurs(erreurs: NonNullable<EvaleoExtracted['epreuves'][number]['erreurs']>): string {
  const labels: string[] = []
  for (const [k, v] of Object.entries(erreurs)) {
    if (v && v !== '0') labels.push(`${k.toUpperCase()}=${v}`)
  }
  return labels.length > 0 ? `Qualification erreurs : ${labels.join(' · ')}.` : ''
}

/**
 * Convertit une EvaleoExtracted en CRBOStructure pour usage par le pipeline
 * generique de renouvellement (rendu Word comparatif, calcul deltas, prompt
 * Claude). Best-effort : champs absents → vides, l'ortho peut completer.
 *
 * @param extracted - sortie de l'extraction EVALEO PDF/DOCX
 * @returns CRBOStructure compatible avec le rendu Word
 */
export function evaleoExtractedToCrboStructure(
  extracted: EvaleoExtracted,
): {
  anamnese_redigee: string
  domains: Array<{
    nom: string
    epreuves: Array<{
      nom: string
      score: string
      et: string | null
      percentile: string
      percentile_value: number
      interpretation: string
      commentaire?: string
    }>
    commentaire: string
  }>
  diagnostic: string
  recommandations: string
  conclusion: string
  pap_suggestions: string[]
} {
  // Regroupe les epreuves par domaine narratif
  const byDomain = new Map<string, EvaleoExtracted['epreuves']>()
  for (const ep of extracted.epreuves) {
    if (ep.non_passee) continue
    const dom = evaleoKeyToDomainName(ep.key)
    const list = byDomain.get(dom) ?? []
    list.push(ep)
    byDomain.set(dom, list)
  }

  const domains = Array.from(byDomain.entries()).map(([nom, eps]) => ({
    nom,
    epreuves: eps.flatMap(ep => {
      const label = EVALEO_KEY_TO_LABEL[ep.key] ?? ep.key
      const obsParts: string[] = []
      if (ep.observation?.trim()) obsParts.push(ep.observation.trim())
      if (ep.effets) {
        const s = summarizeEffets(ep.effets)
        if (s) obsParts.push(s)
      }
      if (ep.erreurs) {
        const s = summarizeErreurs(ep.erreurs)
        if (s) obsParts.push(s)
      }
      const baseCommentaire = obsParts.length > 0 ? obsParts.join(' ') : undefined

      // CAS DUAL — lecture_mots / lecture_pseudomots avec precision+vitesse :
      // emet 2 lignes distinctes pour matcher le rapport Word actuel.
      const hasDual = (ep.key === 'lecture_mots' || ep.key === 'lecture_pseudomots')
        && ep.percentile_vitesse && ep.percentile_vitesse in CLASSE_TO_PERCENTILE_VALUE
        && ep.percentile && ep.percentile in CLASSE_TO_PERCENTILE_VALUE
      if (hasDual) {
        return [
          {
            nom: `${label} (précision)`,
            score: ep.score_brut || '',
            et: null,
            percentile: ep.percentile,
            percentile_value: CLASSE_TO_PERCENTILE_VALUE[ep.percentile],
            interpretation: CLASSE_TO_LABEL[ep.percentile] ?? '',
            commentaire: baseCommentaire,
          },
          {
            nom: `${label} (vitesse)`,
            score: ep.temps ? `${ep.temps}` : '',
            et: null,
            percentile: ep.percentile_vitesse!,
            percentile_value: CLASSE_TO_PERCENTILE_VALUE[ep.percentile_vitesse!],
            interpretation: CLASSE_TO_LABEL[ep.percentile_vitesse!] ?? '',
            commentaire: undefined,
          },
        ]
      }

      // CAS NIVEAU EQUIVALENT — Evalouette / Mouette / Pingouin :
      // concatene le niveau scolaire equivalent dans le score field.
      const hasNiveauEq = (ep.key === 'evalouette' || ep.key === 'mouette_test' || ep.key === 'pingouin_retest')
        && ep.niveau_equivalent && ep.niveau_equivalent.trim()
      const scoreField = hasNiveauEq
        ? (ep.score_brut?.trim()
            ? `${ep.score_brut.trim()} (équivalent ${ep.niveau_equivalent!.trim()})`
            : `(équivalent ${ep.niveau_equivalent!.trim()})`)
        : (ep.score_brut || '')

      return [{
        nom: label,
        score: scoreField,
        et: null,
        percentile: ep.percentile,
        percentile_value: CLASSE_TO_PERCENTILE_VALUE[ep.percentile] ?? 50,
        interpretation: CLASSE_TO_LABEL[ep.percentile] ?? '',
        commentaire: baseCommentaire,
      }]
    }),
    commentaire: '',
  }))

  // Anamnese rapide : on concatene les 8 jalons non-vides
  const anamneseLines: string[] = []
  const a = extracted.anamnese
  if (a.antecedents_familiaux?.trim()) anamneseLines.push(`Antecedents familiaux : ${a.antecedents_familiaux.trim()}`)
  if (a.antecedents_medicaux?.trim()) anamneseLines.push(`Antecedents medicaux : ${a.antecedents_medicaux.trim()}`)
  if (a.developpement_langage?.trim()) anamneseLines.push(`Developpement du langage : ${a.developpement_langage.trim()}`)
  if (a.scolarite?.trim()) anamneseLines.push(`Scolarite : ${a.scolarite.trim()}`)
  if (a.plainte_lecture?.trim()) anamneseLines.push(`Plainte lecture : ${a.plainte_lecture.trim()}`)
  if (a.plainte_orthographe?.trim()) anamneseLines.push(`Plainte orthographe : ${a.plainte_orthographe.trim()}`)
  if (a.plainte_graphisme?.trim()) anamneseLines.push(`Plainte graphisme : ${a.plainte_graphisme.trim()}`)
  if (a.comorbidites_suivi?.trim()) anamneseLines.push(`Comorbidites / suivi : ${a.comorbidites_suivi.trim()}`)

  return {
    anamnese_redigee: anamneseLines.join('\n'),
    domains,
    diagnostic: '',         // pas extrait — laisse vide, l'ortho a deja le bilan precedent
    recommandations: '',
    conclusion: '',
    pap_suggestions: [],
  }
}
