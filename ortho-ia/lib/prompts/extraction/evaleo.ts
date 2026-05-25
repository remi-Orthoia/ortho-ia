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
    percentile: string  // 'p_sup_95' | 'p_90_95' | 'p_75_90' | 'p_50_75' | 'p_25_50' | 'p_10_25' | 'p_5_10' | 'p_inf_5' | ''
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
              enum: ['', 'p_sup_95', 'p_90_95', 'p_75_90', 'p_50_75', 'p_25_50', 'p_10_25', 'p_5_10', 'p_inf_5'],
              description: 'Zone percentile : p_sup_95 (>P95), p_90_95 (P91-P95), p_75_90 (P76-P90), p_50_75 (P50-P75, Q3 inclus), p_25_50 (P26-P49), p_10_25 (P11-P25, Q1 inclus), p_5_10 (P6-P10), p_inf_5 (P1-P5). Convertir depuis la classe HappyNeuron (1-7) ou le percentile affiche.',
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

**percentile** : convertir depuis l'affichage HappyNeuron (classe 1-7 OU percentile
direct) vers les 8 zones ortho.ia :
- Classe 7 (>P93) → p_sup_95
- Classe 6 (P81-P93) → p_90_95 (si ≥P91) ou p_75_90 (P81-P90)
- Classe 5 (P63-P80) → p_75_90 (P76-P80) ou p_50_75 (P63-P75)
- Classe 4 (P39-P62) → p_50_75
- Classe 3 (P21-P38) → p_25_50 (P26-P38) ou p_10_25 (P21-P25)
- Classe 2 (P7-P20) → p_10_25 (P11-P20) ou p_5_10 (P7-P10)
- Classe 1 (<P7) → p_5_10 (P6) ou p_inf_5 (P1-P5)

⚠️ **Q1 = P25 = NORMAL** (zone p_10_25 "Zone de fragilite") — JAMAIS deficitaire.
Si le PDF affiche "Q1", utiliser p_10_25. Si "Med" ou "Q2", utiliser p_50_75.
Si "Q3", utiliser p_50_75 (Q3=P75 inclus dans P50-P75).

Si percentile pas clair → ''.

**score_brut** : tel qu'affiche, format libre. Ex. "23/30", "78%", "12.5".
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
