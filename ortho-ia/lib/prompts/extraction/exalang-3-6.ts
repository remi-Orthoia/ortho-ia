/**
 * Extraction PDF dediee Exalang 3-6 (Thibault, Helloin, Lenfant — HappyNeuron 2006).
 *
 * Cible : rapport de cotation PDF du module resultats HappyNeuron Pro
 * (Exalang 3-6) OU scan du cahier de passation rempli. La sortie est
 * calibree pour pre-remplir directement le state de
 * components/forms/Exalang36ScoresInput.tsx :
 *  - niveau d'etalonnage (PS / MS / GS)
 *  - 11 epreuves : percentile (8 bandes), score brut, temps, observation
 *
 * Respecte la regle d'isolation CLAUDE.md : specifique a Exalang 3-6.
 */

import type Anthropic from '@anthropic-ai/sdk'

/** 11 cles d'epreuves valides — DOIVENT matcher Exalang36ScoresInput.tsx. */
export const EXALANG36_EPREUVE_KEYS = [
  // A.1 Langage oral receptif (3)
  'designation_lexique', 'comp_phrases_courtes', 'comp_morphosyntaxique',
  // A.2 Langage oral expressif (4)
  'denomination_lexique', 'production_syntaxique',
  'repetition_mots_phrases', 'repetition_logatomes',
  // B.1 Metaphonologie emergente (3)
  'meta_rimes', 'meta_syllabes', 'conscience_ecrit',
  // C.1 Memoire (1)
  'empan_auditif_endroit',
] as const

export type Exalang36EpreuveKey = typeof EXALANG36_EPREUVE_KEYS[number]

export interface Exalang36Extracted {
  niveau: string  // '' | 'PS' | 'MS' | 'GS'
  epreuves: Array<{
    key: string
    percentile: string
    score_brut: string
    temps: string
    observation: string
    non_passee: boolean
  }>
}

export const EXALANG36_EXTRACT_TOOL: Anthropic.Tool = {
  name: 'extract_exalang_3_6_results',
  description: 'Extrait les resultats d\'un bilan Exalang 3-6 depuis un rapport PDF HappyNeuron Pro ou scan du cahier de passation rempli a la main. Retourne le niveau (PS / MS / GS) et les scores par epreuve.',
  input_schema: {
    type: 'object',
    properties: {
      niveau: {
        type: 'string',
        enum: ['', 'PS', 'MS', 'GS'],
        description: 'Niveau scolaire maternelle. "Petite Section" / "PS" → PS. "Moyenne Section" / "MS" → MS. "Grande Section" / "GS" → GS. Vide si non determinable.',
      },
      epreuves: {
        type: 'array',
        description: 'Une entree par epreuve passee. Ne PAS inclure les epreuves non passees.',
        items: {
          type: 'object',
          properties: {
            key: {
              type: 'string',
              enum: [...EXALANG36_EPREUVE_KEYS],
              description: 'Cle technique de l\'epreuve.',
            },
            percentile: {
              type: 'string',
              enum: ['', 'p_sup_95', 'p_90_95', 'p_75_90', 'p_50_75', 'p_25_50', 'p_10_25', 'p_5_10', 'p_inf_5'],
              description: 'Bande de percentile Exalang (Q1 = P25 = Zone de fragilite, jamais Difficulte).',
            },
            score_brut: { type: 'string', description: 'Format libre.' },
            temps: { type: 'string', description: 'Temps pour les epreuves chronometrees. Format libre.' },
            observation: { type: 'string', description: 'Annotations qualitatives recopiees verbatim : observations sur articulation, paraphasies, jargon, attitude (anxiete, refus, fatigue), strategies, types d\'erreurs.' },
            non_passee: { type: 'boolean', description: 'true si explicitement "NP" / "—" / non realisee. Adapt aux PS/MS qui ne passent pas toutes les epreuves (notamment metaphonologie, conscience de l\'ecrit).' },
          },
          required: ['key', 'percentile', 'score_brut', 'temps', 'observation', 'non_passee'],
        },
      },
    },
    required: ['niveau', 'epreuves'],
  },
}

export const EXALANG36_EXTRACT_PROMPT = `Tu es un expert en extraction de donnees de bilans orthophoniques Exalang 3-6 (Thibault, Helloin, Lenfant — HappyNeuron 2006). Tu recois soit un rapport informatise du module resultats HappyNeuron Pro, soit un scan du cahier de passation rempli a la main.

# OBJECTIF

Extraire les donnees brutes pour pre-remplir le formulaire ortho.ia. **N'INVENTE RIEN.** Mieux vaut un champ vide qu'une hallucination.

Tu DOIS appeler l'outil \`extract_exalang_3_6_results\`.

# 1. NIVEAU MATERNELLE

- "Petite Section" / "PS" → \`PS\`
- "Moyenne Section" / "MS" → \`MS\`
- "Grande Section" / "GS" → \`GS\`
- Vide si non determinable.

# 2. EPREUVES — 11 epreuves, 4 groupes A.1 / A.2 / B.1 / C.1

## A.1 Langage oral receptif
- "Designation" / "Lexique receptif" → \`designation_lexique\`
- "Comprehension de phrases courtes" → \`comp_phrases_courtes\`
- "Comprehension morphosyntaxique" → \`comp_morphosyntaxique\`

## A.2 Langage oral expressif
- "Denomination" / "Lexique expressif" → \`denomination_lexique\`
- "Production syntaxique" / "Phrases a partir d'images" → \`production_syntaxique\`
- "Repetition de mots et phrases" → \`repetition_mots_phrases\`
- "Repetition de logatomes" → \`repetition_logatomes\`

## B.1 Metaphonologie emergente
- "Metaphonologie — rimes" / "Rimes" → \`meta_rimes\` (acquises MS-GS)
- "Metaphonologie — syllabes" / "Segmentation syllabique" → \`meta_syllabes\` (acquises GS)
- "Conscience de l'ecrit" / "Concept de lettre/mot/phrase" → \`conscience_ecrit\`

## C.1 Memoire
- "Empan auditif endroit" / "Empan endroit" → \`empan_auditif_endroit\`

# 3. PERCENTILE — bandes Exalang

- "> P95" → \`p_sup_95\` (Tres superieur)
- "P95" → \`p_90_95\`
- "P90" → \`p_75_90\`
- "Q3" / "P50-P75" → \`p_50_75\` (Moyenne haute)
- "Med" / "P26-P49" → \`p_25_50\` (Moyenne basse)
- "Q1" / "P11-P25" → \`p_10_25\` (Zone de fragilite)
- "P10" / "P6-P10" → \`p_5_10\` (Difficulte)
- "P5" / "P1-P5" → \`p_inf_5\` (Difficulte severe)

⚠️ **Q1 = P25 = Zone de fragilite**. Bornes inclusives. NE PAS recalculer depuis l'ecart-type.

# 4. OBSERVATION

A recopier au verbatim :
1. **Annotations sur l'articulation** (paraphasies, deformations, troubles de sortie).
2. **Annotations sur le langage** (jargon, structures simplifiees, abandons de mots).
3. **Attitudes** (refus, anxiete separation parent, fatigue, decrochage attentionnel — frequents en maternelle).
4. **Strategies** (recours aux gestes, evitement, parent souffleur).
5. **Types d'erreurs** verbatim si notes ("dit /pato/ pour /chapeau/").

# 5. NON_PASSEE

Important : en PS et MS, certaines epreuves sont normalement non passees ou marquees "non applicable a cet age" :
- B.1 Metaphonologie : rimes possibles en MS, syllabes en GS, conscience de l'ecrit en GS-CP. Avant cela : \`non_passee = true\`.
- A.2 Production syntaxique : peut etre limitee en PS.

Si le PDF montre "—" / "NP" / "X" / "non realisee" / "non applicable" → \`non_passee = true\`.

# 6. PRINCIPES GENERAUX

- Conservateur : doute → vide.
- Une entree par epreuve.
- Pas d'epreuve absente.

Si le PDF n'est PAS un bilan Exalang 3-6, retourne niveau='', epreuves=[].`
