/**
 * Extraction PDF dediee Exalang 8-11 (Helloin, Lenfant, Thibault — HappyNeuron 2012).
 *
 * Cible : rapport de cotation PDF du module resultats HappyNeuron Pro
 * (Exalang 8-11) OU scan du cahier de passation rempli. La sortie est
 * calibree pour pre-remplir directement le state de
 * components/forms/Exalang811ScoresInput.tsx :
 *  - niveau d'etalonnage (CE2 / CM1 / CM2)
 *  - 22 epreuves officielles : percentile (8 bandes), score brut, temps, observation
 *
 * Respecte la regle d'isolation CLAUDE.md : ce module est specifique a
 * Exalang 8-11, n'est ni reference ni utilise par les autres bilans.
 */

import type Anthropic from '@anthropic-ai/sdk'

/** 22 cles d'epreuves valides — DOIVENT matcher Exalang811ScoresInput.tsx
 *  (constante GROUPES, e.key). Si tu modifies l'une, modifie l'autre. */
export const EXALANG811_EPREUVE_KEYS = [
  // A.1 Langage oral (7)
  'comp_orale_phrases', 'comp_orale_textes',
  'denomination_images', 'designation_sur_def', 'lexique_reception',
  'fluence_phonemique', 'fluence_semantique',
  // A.2 Metaphonologie (3)
  'meta_acronymes', 'meta_rimes', 'meta_suppression',
  // B.1 Lecture (6)
  'lecture_mots_freq', 'lecture_mots_irreg', 'lecture_non_mots',
  'leximetrie', 'decision_lexico', 'comp_ecrite_texte',
  // B.2 Orthographe (3)
  'dra_dictee', 'closure_texte', 'copie_differee',
  // C.1 Memoire (3)
  'empan_endroit', 'empan_envers', 'rep_logatomes',
] as const

export type Exalang811EpreuveKey = typeof EXALANG811_EPREUVE_KEYS[number]

export interface Exalang811Extracted {
  niveau: string  // '' | 'CE2' | 'CM1' | 'CM2'
  epreuves: Array<{
    key: string
    percentile: string  // bande Exalang : p_sup_95 / p_90_95 / ... / p_inf_5
    score_brut: string
    temps: string
    observation: string
    non_passee: boolean
  }>
}

export const EXALANG811_EXTRACT_TOOL: Anthropic.Tool = {
  name: 'extract_exalang_8_11_results',
  description: 'Extrait les resultats d\'un bilan Exalang 8-11 depuis un rapport PDF du logiciel HappyNeuron Pro (module resultats) ou un scan du cahier de passation rempli. Retourne le niveau scolaire (CE2 / CM1 / CM2) et les scores par epreuve avec percentile, score brut, temps et observation.',
  input_schema: {
    type: 'object',
    properties: {
      niveau: {
        type: 'string',
        enum: ['', 'CE2', 'CM1', 'CM2'],
        description: 'Niveau scolaire au moment de la passation. Mapping : "CE2" → CE2. "CM1" → CM1. "CM2" → CM2. Vide si non determinable.',
      },
      epreuves: {
        type: 'array',
        description: 'Une entree par epreuve passee. Ne PAS inclure les epreuves non passees ou absentes du PDF — uniquement celles avec au moins une donnee chiffree ou qualitative.',
        items: {
          type: 'object',
          properties: {
            key: {
              type: 'string',
              enum: [...EXALANG811_EPREUVE_KEYS],
              description: 'Cle technique de l\'epreuve. DOIT matcher la liste fournie.',
            },
            percentile: {
              type: 'string',
              enum: ['', 'p_sup_95', 'p_90_95', 'p_75_90', 'p_50_75', 'p_25_50', 'p_10_25', 'p_5_10', 'p_inf_5'],
              description: 'Bande de percentile Exalang (logique d\'affichage HappyNeuron) :\n- Score < P5 → p_inf_5 ("P1 — P5", Difficulte severe)\n- P5 ≤ score < P10 → p_5_10 ("P6 — P10", Difficulte)\n- P10 ≤ score < Q1 → p_10_25 ("P11 — P25", Zone de fragilite)\n- Q1 ≤ score < Med → p_25_50 ("P26 — P49", Moyenne basse)\n- Med ≤ score < Q3 → p_50_75 ("P50 — P75", Moyenne haute)\n- Q3 ≤ score < P90 → p_75_90 ("P76 — P90", Excellent)\n- P90 ≤ score < P95 → p_90_95 ("P91 — P95", Excellent)\n- Score ≥ P95 → p_sup_95 ("> P95", Tres superieur)\n\n**NE PAS recalculer depuis l\'ecart-type**. Q1 = P25 = Zone de fragilite. Bornes inclusives.',
            },
            score_brut: { type: 'string', description: 'Score brut tel qu\'affiche, format libre.' },
            temps: { type: 'string', description: 'Temps pour les epreuves chronometrees (Fluences 1 min, Leximetrie, Lecture de mots freq/irreg, DRA, Copie differee). Format libre.' },
            observation: { type: 'string', description: 'Annotations qualitatives : analyse DRA typologique (erreurs phono/lexicale/grammaticale), strategies de lecture observees, types d\'erreurs en marge ("decode lentement", "saute des lignes", "confusion b/d"), attitude. Recopie verbatim. Important : le rendu Word Exalang 8-11 affichera les commentaires d\'epreuve uniquement pour les epreuves en zone fragile (P<50) — donc privilegie la recopie verbatim quand l\'observation concerne une epreuve fragile.' },
            non_passee: { type: 'boolean', description: 'true si epreuve explicitement marquee "NP", "non passee", "—", etc. Defaut false.' },
          },
          required: ['key', 'percentile', 'score_brut', 'temps', 'observation', 'non_passee'],
        },
      },
    },
    required: ['niveau', 'epreuves'],
  },
}

export const EXALANG811_EXTRACT_PROMPT = `Tu es un expert en extraction de donnees de bilans orthophoniques Exalang 8-11 (Helloin, Lenfant, Thibault — HappyNeuron 2012). Tu recois soit un rapport informatise du module resultats HappyNeuron Pro, soit un scan du cahier de passation rempli a la main, soit un document Word/PDF contenant les resultats d'un bilan Exalang 8-11.

# OBJECTIF

Extraire les donnees brutes du bilan pour pre-remplir le formulaire de saisie ortho.ia. **N'INVENTE RIEN.** Si une donnee n'est pas presente dans le document, laisse le champ vide.

Tu DOIS appeler l'outil \`extract_exalang_8_11_results\` pour retourner ta sortie.

# 1. NIVEAU SCOLAIRE

- "CE2" → \`CE2\`
- "CM1" → \`CM1\`
- "CM2" → \`CM2\`
- Si la classe n'est pas claire : laisser \`niveau=''\`.

# 2. EPREUVES — 22 epreuves officielles, 5 groupes A.1 / A.2 / B.1 / B.2 / C.1

## Mapping libelles PDF → cles

### A.1 Langage oral
- "Comprehension orale de phrases" → \`comp_orale_phrases\`
- "Comprehension orale de textes" → \`comp_orale_textes\`
- "Denomination d'images" / "Denomination" → \`denomination_images\`
- "Designation sur definition" → \`designation_sur_def\`
- "Lexique en reception" / "Lexique receptif" → \`lexique_reception\`
- "Fluence phonemique" / "Fluence (lettre)" → \`fluence_phonemique\`
- "Fluence semantique" / "Fluence (animaux)" → \`fluence_semantique\`

### A.2 Metaphonologie
- "Metaphonologie — acronymes" / "Acronymes" → \`meta_acronymes\`
- "Metaphonologie — rimes" / "Rimes" → \`meta_rimes\`
- "Metaphonologie — suppression phonemique" / "Suppression" → \`meta_suppression\`

### B.1 Lecture
- "Lecture de mots frequents" / "Mots reels" → \`lecture_mots_freq\`
- "Lecture de mots irreguliers" / "Mots irreguliers" → \`lecture_mots_irreg\`
- "Lecture de non-mots" / "Logatomes ecrits" → \`lecture_non_mots\`
- "Leximetrie" / "Vitesse de lecture en contexte" → \`leximetrie\`
- "Decision lexico-morphologique" / "Decision lexico" → \`decision_lexico\`
- "Comprehension ecrite de texte" → \`comp_ecrite_texte\`

### B.2 Orthographe
- "DRA — Dictee de Redaction Abregee" / "DRA" / "Dictee abregee" → \`dra_dictee\`
- "Closure de texte" / "Closure" → \`closure_texte\`
- "Copie differee" → \`copie_differee\`

### C.1 Memoire
- "Empan auditif endroit" / "Empan endroit" → \`empan_endroit\`
- "Empan auditif envers" / "Empan envers" → \`empan_envers\`
- "Repetition de logatomes" → \`rep_logatomes\`

# 3. PERCENTILE — bandes Exalang

Recopier la bande affichee par le logiciel HappyNeuron Pro :
- "> P95" → \`p_sup_95\` (Tres superieur)
- "P95" / "P91-P95" → \`p_90_95\` (Excellent)
- "P90" / "P76-P90" → \`p_75_90\` (Excellent moitie basse)
- "Q3" / "P50-P75" → \`p_50_75\` (Moyenne haute)
- "Med" / "P26-P49" → \`p_25_50\` (Moyenne basse)
- "Q1" / "P11-P25" → \`p_10_25\` (Zone de fragilite)
- "P10" / "P6-P10" → \`p_5_10\` (Difficulte)
- "P5" / "P1-P5" → \`p_inf_5\` (Difficulte severe)

⚠️ **Q1 = P25 = Zone de fragilite, jamais Difficulte**. Bornes inclusives. NE PAS recalculer depuis l'ecart-type.

# 4. SCORE BRUT, TEMPS, OBSERVATION

**score_brut** : format libre.

🔒 **VALIDATION DENOMINATEUR — Exalang 8-11 cibles** :
- DRA : analyse typologique en marge (phono / lexicale / grammaticale)
- Leximetrie : score = nombre de mots lus correctement en X minutes
- Copie differee : score = mots correctement copies
- Empan endroit/envers : score = longueur de la suite reussie

**temps** : Fluences 1 min (60s). Leximetrie chronometree. Lecture de mots typiquement 2 min. DRA selon protocole.

**observation** : ATTENTION particuliere a recopier :
1. **DRA — analyse typologique** : Exalang 8-11 produit une analyse qualitative des erreurs en phonologie / lexique / grammaire. Si le rapport l'affiche, resume dans observation ("4 erreurs phonologiques, 2 lexicales, 6 grammaticales — dysorthographie a dominante grammaticale").
2. **Lecture de mots freq/irreg/non-mots** : croisement voie d'adressage vs assemblage. Si erreurs notees, recopier types (paralexies visuelles, regularisations, omissions de phonemes).
3. **Leximetrie** : vitesse en mots/min, normes attendues CE2 90-120 / CM1 110-140 / CM2 130-160. Si le rapport precise, recopier.
4. **Annotations qualitatives en marge** : stratégies, attitudes, fatigabilite, exemples d'erreurs verbatim.

**non_passee** : true si explicitement "NP" / "—" / non realisee.

# 5. PRINCIPES GENERAUX

- Conservateur : doute → vide.
- Pas d'invention.
- Format strict (enums).
- Une entree par epreuve.
- Pas d'epreuve absente.

Si le PDF n'est PAS un bilan Exalang 8-11, retourne niveau='', epreuves=[].`
