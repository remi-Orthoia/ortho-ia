/**
 * Extraction PDF dediee Exalang 11-15 (Helloin, Lenfant, Thibault — HappyNeuron 2009).
 *
 * Cible : rapport de cotation PDF du module resultats HappyNeuron Pro
 * (Exalang 11-15) OU scan du cahier de passation rempli. La sortie est
 * calibree pour pre-remplir directement le state de
 * components/forms/Exalang1115ScoresInput.tsx :
 *  - niveau d'etalonnage (6e / 5e / 4e / 3e)
 *  - 16 epreuves officielles : percentile (8 bandes), score brut, temps, observation
 *
 * Population : college (6e a 3e). Outil de reference pour le suivi des
 * troubles des apprentissages au college et le depistage tardif d'eleves
 * non diagnostiques au primaire.
 *
 * Respecte la regle d'isolation CLAUDE.md : ce module est specifique a
 * Exalang 11-15, n'est ni reference ni utilise par les autres bilans.
 */

import type Anthropic from '@anthropic-ai/sdk'

/** 16 cles d'epreuves valides — DOIVENT matcher Exalang1115ScoresInput.tsx
 *  (constante GROUPES, e.key). Si tu modifies l'une, modifie l'autre. */
export const EXALANG1115_EPREUVE_KEYS = [
  // A.1 Langage oral (4)
  'fluence_phonemique', 'fluence_semantique',
  'comp_orale_textes', 'denomination_rapide',
  // A.2 Metaphonologie / phonologie complexe (1)
  'rep_logatomes',
  // B.1 Lecture (5)
  'lecture_mots_freq', 'lecture_mots_irreg', 'lecture_non_mots',
  'leximetrie', 'comp_ecrite_inferentielle',
  // B.2 Orthographe / production ecrite (4)
  'dictee', 'closure_texte', 'production_ecrite', 'raisonnement_verbal',
  // C.1 Memoire et fonctions executives (2)
  'empan_endroit', 'empan_envers',
] as const

export type Exalang1115EpreuveKey = typeof EXALANG1115_EPREUVE_KEYS[number]

export interface Exalang1115Extracted {
  niveau: string  // '' | '6e' | '5e' | '4e' | '3e'
  epreuves: Array<{
    key: string
    percentile: string  // bande Exalang : p_sup_95 / p_90_95 / ... / p_inf_5
    score_brut: string
    temps: string
    observation: string
    non_passee: boolean
  }>
}

export const EXALANG1115_EXTRACT_TOOL: Anthropic.Tool = {
  name: 'extract_exalang_11_15_results',
  description: 'Extrait les resultats d\'un bilan Exalang 11-15 depuis un rapport PDF du logiciel HappyNeuron Pro (module resultats) ou un scan du cahier de passation rempli. Retourne le niveau scolaire (6e / 5e / 4e / 3e) et les scores par epreuve avec percentile, score brut, temps et observation.',
  input_schema: {
    type: 'object',
    properties: {
      niveau: {
        type: 'string',
        enum: ['', '6e', '5e', '4e', '3e'],
        description: 'Niveau scolaire au moment de la passation. Mapping : "6eme"/"sixieme"/"6e" → 6e. "5eme"/"5e" → 5e. "4eme"/"4e" → 4e. "3eme"/"3e" → 3e. Vide si non determinable.',
      },
      epreuves: {
        type: 'array',
        description: 'Une entree par epreuve passee. Ne PAS inclure les epreuves non passees ou absentes du PDF — uniquement celles avec au moins une donnee chiffree ou qualitative.',
        items: {
          type: 'object',
          properties: {
            key: {
              type: 'string',
              enum: [...EXALANG1115_EPREUVE_KEYS],
              description: 'Cle technique de l\'epreuve. DOIT matcher la liste fournie.',
            },
            percentile: {
              type: 'string',
              enum: ['', 'p_sup_95', 'p_90_95', 'p_75_90', 'p_50_75', 'p_25_50', 'p_10_25', 'p_5_10', 'p_inf_5'],
              description: 'Bande de percentile Exalang (logique d\'affichage HappyNeuron) :\n- Score < P5 → p_inf_5 ("P1 — P5", Difficulte severe)\n- P5 ≤ score < P10 → p_5_10 ("P6 — P10", Difficulte)\n- P10 ≤ score < Q1 → p_10_25 ("P11 — P25", Zone de fragilite)\n- Q1 ≤ score < Med → p_25_50 ("P26 — P49", Moyenne basse)\n- Med ≤ score < Q3 → p_50_75 ("P50 — P75", Moyenne haute)\n- Q3 ≤ score < P90 → p_75_90 ("P76 — P90", Excellent)\n- P90 ≤ score < P95 → p_90_95 ("P91 — P95", Excellent)\n- Score ≥ P95 → p_sup_95 ("> P95", Tres superieur)\n\n**NE PAS recalculer depuis l\'ecart-type**. Q1 = P25 = Zone de fragilite. Bornes inclusives.',
            },
            score_brut: { type: 'string', description: 'Score brut tel qu\'affiche, format libre.' },
            temps: { type: 'string', description: 'Temps pour les epreuves chronometrees (Fluences 1 min, Leximetrie, Lecture de mots freq/irreg/non-mots, Denomination rapide, Dictee, Production ecrite, parfois Empans). Format libre.' },
            observation: { type: 'string', description: 'Annotations qualitatives recopiees verbatim : analyse typologique des erreurs en dictee (phono/lexicale/grammaticale, homophones a/a, ses/ces), strategies de lecture, types d\'erreurs en marge ("decode lentement", "saute des lignes", "confusion b/d"), comportement, fatigabilite. Recopie ce que tu vois — pas d\'interpretation.' },
            non_passee: { type: 'boolean', description: 'true si epreuve explicitement marquee "NP", "non passee", "—", etc. Defaut false.' },
          },
          required: ['key', 'percentile', 'score_brut', 'temps', 'observation', 'non_passee'],
        },
      },
    },
    required: ['niveau', 'epreuves'],
  },
}

export const EXALANG1115_EXTRACT_PROMPT = `Tu es un expert en extraction de donnees de bilans orthophoniques Exalang 11-15 (Helloin, Lenfant, Thibault — HappyNeuron 2009). Tu recois soit un rapport informatise du module resultats HappyNeuron Pro, soit un scan du cahier de passation rempli a la main, soit un document Word/PDF contenant les resultats d'un bilan Exalang 11-15.

# CONTEXTE EXALANG 11-15 (specificites college)

Exalang 11-15 est la batterie HappyNeuron pour les eleves du college (6e a 3e). Outil de reference pour :
- le suivi des troubles des apprentissages diagnostiques au primaire (dyslexie compensee residuelle),
- le depistage tardif d'eleves non diagnostiques au primaire (dyslexie qui se revele a l'entree 6e par decompensation),
- les profils de trouble de la comprehension ecrite isole (lit bien mais ne comprend pas).

Etalonnage par niveau scolaire : **6e / 5e / 4e / 3e**.

# OBJECTIF

Extraire les donnees brutes du bilan pour pre-remplir le formulaire de saisie ortho.ia. **N'INVENTE RIEN.** Si une donnee n'est pas presente dans le document, laisse le champ vide.

Tu DOIS appeler l'outil \`extract_exalang_11_15_results\` pour retourner ta sortie.

# 1. NIVEAU SCOLAIRE

- "6eme" / "sixieme" / "6e" → \`6e\`
- "5eme" / "cinquieme" / "5e" → \`5e\`
- "4eme" / "quatrieme" / "4e" → \`4e\`
- "3eme" / "troisieme" / "3e" → \`3e\`
- Si la classe n'est pas claire : laisser \`niveau=''\`.

# 2. EPREUVES — 16 epreuves officielles, 5 groupes A.1 / A.2 / B.1 / B.2 / C.1

## Mapping libelles PDF → cles

### A.1 Langage oral
- "Fluence phonemique" / "Fluence (lettre)" / "Fluence verbale phonemique" → \`fluence_phonemique\`
- "Fluence semantique" / "Fluence (categorie)" / "Fluence verbale semantique" → \`fluence_semantique\`
- "Comprehension orale de textes" / "Comprehension orale de textes abstraits" / "Comprehension de textes entendus" → \`comp_orale_textes\`
- "Denomination rapide" / "Denomination rapide de mots complexes" / "Denomination orale" → \`denomination_rapide\`

### A.2 Metaphonologie / phonologie complexe
- "Repetition de logatomes" / "Logatomes complexes" / "Repetition de pseudo-mots" → \`rep_logatomes\`

### B.1 Lecture
- "Lecture de mots frequents" / "Mots reels" / "Lecture de mots" → \`lecture_mots_freq\`
- "Lecture de mots irreguliers" / "Mots irreguliers" → \`lecture_mots_irreg\`
- "Lecture de non-mots" / "Logatomes ecrits" / "Lecture de pseudo-mots" → \`lecture_non_mots\`
- "Leximetrie" / "Leximetrie en contexte" / "Vitesse de lecture en contexte" / "Lecture de texte" → \`leximetrie\`
- "Comprehension ecrite inferentielle" / "Comprehension ecrite de texte" / "Comprehension ecrite" → \`comp_ecrite_inferentielle\`

### B.2 Orthographe / production ecrite
- "Dictee" / "Dictee de mots" / "Dictee de phrases" / "Dictee de texte" → \`dictee\`
- "Closure de texte" / "Closure de texte complexe" / "Closure" → \`closure_texte\`
- "Production ecrite" / "Production ecrite narrative" / "Redaction" → \`production_ecrite\`
- "Raisonnement verbal" / "Analogies" / "Metaphores" / "Raisonnement (analogies / metaphores)" → \`raisonnement_verbal\`

### C.1 Memoire et fonctions executives
- "Empan auditif endroit" / "Empan endroit" / "Chiffres endroit" → \`empan_endroit\`
- "Empan auditif envers" / "Empan envers" / "Chiffres envers" → \`empan_envers\`

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

🔒 **VALIDATION DENOMINATEURS — Exalang 11-15 cibles** :
- Leximetrie : score = nombre de mots lus correctement en 1 ou 2 min. Normes : 6e 140-180 mots/min ; 3e 180-220 mots/min.
- Lecture mots freq/irreg/non-mots : nombre lu correctement.
- Production ecrite : criteres scorings = nombre de mots, complexite syntaxique, correction orthographique, coherence narrative.
- Dictee : score combine ou ventilation phonologique / lexicale / grammaticale.
- Empan endroit/envers : longueur de la suite reussie.

**temps** : Fluences 1 min (60s). Leximetrie chronometree. Denomination rapide chronometree. Lecture de mots/non-mots typiquement 2 min. Production ecrite : duree de redaction. Recopier le temps tel qu'affiche.

**observation** : ATTENTION particuliere a recopier :
1. **Dictee — analyse typologique** : Exalang 11-15 produit une analyse qualitative des erreurs en phonologie / lexique / grammaire. Au college, les **homophones grammaticaux** (a/a, ou/ou, est/et, ses/ces) sont des marqueurs centraux. Recopier la ventilation des erreurs si elle est presente.
2. **Lecture de mots freq/irreg/non-mots** : croisement voie d'adressage vs assemblage. Recopier types d'erreurs (paralexies visuelles, regularisations, omissions de phonemes).
3. **Leximetrie** : vitesse en mots/min, normes 140-180 (6e) a 180-220 (3e). Si le rapport precise, recopier.
4. **Production ecrite** : commentaires sur la cohesion du recit, densite lexicale, correction syntaxique, longueur. Recopier verbatim.
5. **Comprehension ecrite inferentielle** : nombre d'inferences reussies, type de questions ratees (litterales vs inferentielles).
6. **Empans** : empan envers tres inferieur a endroit = signal TDAH / dysexecutif a recopier.
7. **Annotations qualitatives en marge** : strategies, attitudes, fatigabilite, decompensation observee a l'entree 6e, contexte scolaire (demande PPS, AESH), exemples d'erreurs verbatim.

**non_passee** : true si explicitement "NP" / "—" / non realisee.

# 5. PRINCIPES GENERAUX

- Conservateur : doute → vide.
- Pas d'invention.
- Format strict (enums).
- Une entree par epreuve.
- Pas d'epreuve absente.

Si le PDF n'est PAS un bilan Exalang 11-15 (autre batterie, page blanche, document non pertinent), retourne niveau='', epreuves=[].`
