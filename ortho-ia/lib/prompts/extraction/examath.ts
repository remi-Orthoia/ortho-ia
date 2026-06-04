/**
 * Extraction PDF dediee Examath 8-15 (Lafay & Helloin, HappyNeuron 2016).
 *
 * Cible : rapport de cotation PDF du logiciel HappyNeuron Pro (Examath) OU
 * scan du cahier de passation rempli a la main.
 *
 * Examath est **percentile-based** comme les batteries Exalang/EVALEO : le
 * logiciel HappyNeuron Pro affiche pour chaque epreuve / subtest le score
 * brut + l'ecart-type + le percentile (P5 / P10 / Q1 / Med / Q3 / P90 / P95)
 * + le temps si chronometre.
 *
 * 40 epreuves officielles reparties en 6 modules. Stratification par niveau
 * scolaire (CE2 / CM1 / CM2 / 6e-5e / 4e-3e).
 *
 * Respecte la regle d'isolation CLAUDE.md : module specifique a Examath,
 * route consommatrice unique : /api/extract-examath-pdf.
 */

import type Anthropic from '@anthropic-ai/sdk'

/** 40 cles d'epreuves valides — DOIVENT matcher ExamathScoresInput.tsx
 *  (constante MODULES, e.key). Si tu modifies l'une, modifie l'autre. */
export const EXAMATH_EPREUVE_KEYS = [
  // M1 — Habiletes numeriques de base (6)
  'm1_comparaison_analogique',
  'm1_relation_arabe_analogique',
  'm1_relation_oral_analogique',
  'm1_ligne_numerique',
  'm1_identification_quantites',
  'm1_denombrement_calcul',
  // M2 — Numeration base 10 (5)
  'm2_transcodage',
  'm2_repetition_grands_nombres',
  'm2_identification_udcm',
  'm2_relation_arabe_analogique_udc',
  'm2_decomposition_additive',
  // M2 — Numeration decimale et fractionnaire (4, CM2+)
  'm2_fractions_images',
  'm2_ligne_numerique_fractions',
  'm2_jugement_ecriture_decimale',
  'm2_comparaison_fractions',
  // M3 — Arithmetique (7)
  'm3_operations_analogiques',
  'm2_jugement_operations',  // historiquement prefixe m2_, reclassse M3 cote manuel
  'm3_fluence_arithmetique',
  'm3_calcul_mental_complexe',
  'm3_mecanismes_operatoires',
  'm2_calcul_fractions',     // idem
  'm2_estimation_resultat',  // idem
  // M4 — Mesures (3)
  'm4_approche_mesures',
  'm4_equivalence_comparaison',
  'm4_problemes_mesures',
  // M5 — Resolution de problemes (9)
  'm5_combinaison_plus',
  'm5_transformation_plus',
  'm5_comparaison_plus',
  'm5_proportionnalite',
  'm5_proportionnalite_composee',
  'm5_proportionnalite_multiple',
  'm5_comparaison_x',
  'm5_probleme_compose',
  'm5_problemes_composes',
  // M6 — Langage et raisonnement (6)
  'm6_inferences_images',
  'm6_inferences_logiques',
  'm6_inferences_verbales',
  'm6_inferences_lexicales',
  'm6_lexique_math',
  'm6_gestion_enonces',
] as const

export type ExamathEpreuveKey = typeof EXAMATH_EPREUVE_KEYS[number]

/** Subtests valides par epreuve Examath — DOIVENT matcher
 *  ExamathScoresInput.tsx (constante MODULES, e.subtests[].key). */
const EXAMATH_SUBTEST_KEYS: Partial<Record<ExamathEpreuveKey, string[]>> = {
  m1_relation_arabe_analogique:        ['comparaison_arabe'],
  m1_relation_oral_analogique:         ['comparaison_orale'],
  m1_identification_quantites:         ['subitizing'],
  m1_denombrement_calcul:              ['identification_collection', 'production_collection'],
  m2_transcodage:                      ['lecture_1_99', 'lecture_99p', 'dictee_1_99', 'dictee_99p'],
  m2_relation_arabe_analogique_udc:    ['production_arabe_analogique', 'production_analogique_arabe', 'jugement'],
  m3_fluence_arithmetique:             ['additions', 'soustractions', 'multiplications'],
  m3_mecanismes_operatoires:           ['additions', 'soustractions', 'multiplication'],
}

function examathSubtestsHint(): string {
  return Object.entries(EXAMATH_SUBTEST_KEYS)
    .map(([k, v]) => `  - ${k}: [${(v as string[]).join(', ')}]`)
    .join('\n')
}

export interface ExamathExtracted {
  niveau: string  // '' | 'CE2' | 'CM1' | 'CM2' | '6e_5e' | '4e_3e'
  epreuves: Array<{
    key: string
    /** Bande de percentile Exalang/Examath : >P95 / P91-P95 / P76-P90 /
     *  P50-P75 / P26-P49 / P11-P25 / P6-P10 / P1-P5. Vide si non determinable. */
    percentile: string
    /** Sous-scores par subtest. Vide si pas de subtests. */
    subtests: Record<string, { percentile: string; score_brut: string; temps: string }>
    score_brut: string
    temps: string
    observation: string
    non_passee: boolean
  }>
}

export const EXAMATH_EXTRACT_TOOL: Anthropic.Tool = {
  name: 'extract_examath_results',
  description: 'Extrait les resultats d\'un bilan Examath 8-15 (Lafay & Helloin, HappyNeuron 2016) depuis un rapport PDF HappyNeuron Pro ou scan du cahier de passation rempli a la main. Retourne le niveau d\'etalonnage (CE2 / CM1 / CM2 / 6e-5e / 4e-3e) et les 40 epreuves officielles avec percentile + sous-scores + temps + observations.',
  input_schema: {
    type: 'object',
    properties: {
      niveau: {
        type: 'string',
        enum: ['', 'CE2', 'CM1', 'CM2', '6e_5e', '4e_3e'],
        description: 'Niveau d\'etalonnage Examath. "CE2" → CE2. "CM1" → CM1. "CM2" → CM2. "6e" ou "5e" → 6e_5e. "4e" ou "3e" → 4e_3e. Vide si non determinable.',
      },
      epreuves: {
        type: 'array',
        description: 'Une entree par epreuve passee. Ne PAS inclure les epreuves non passees ou absentes du PDF.',
        items: {
          type: 'object',
          properties: {
            key: {
              type: 'string',
              enum: [...EXAMATH_EPREUVE_KEYS],
              description: 'Cle technique de l\'epreuve. Mapping libelles PDF → cles dans le prompt.',
            },
            percentile: {
              type: 'string',
              enum: ['', 'p_sup_95', 'p_90_95', 'p_75_90', 'p_50_75', 'p_25_50', 'p_10_25', 'p_5_10', 'p_inf_5'],
              description: 'Bande de percentile Examath (logique d\'affichage HappyNeuron) : Score < P5 → p_inf_5 ("P1-P5", Difficulte severe, SEUIL PATHOLOGIE SEVERE). P5 ≤ score < P10 → p_5_10 ("P6-P10", Difficulte, SEUIL PATHOLOGIE). P10 ≤ score < Q1 → p_10_25 ("P11-P25", Zone de fragilite). Q1 ≤ score < Med → p_25_50 ("P26-P49", Moyenne basse). Med ≤ score < Q3 → p_50_75 ("P50-P75", Moyenne haute). Q3 ≤ score < P90 → p_75_90 ("P76-P90", Excellent). P90 ≤ score < P95 → p_90_95 ("P91-P95"). Score ≥ P95 → p_sup_95 ("> P95"). NE PAS recalculer depuis l\'ecart-type.',
            },
            subtests: {
              type: 'object',
              description: 'Sous-scores par subtest. Cles autorisees par epreuve :\n' + examathSubtestsHint() + '\nChaque entree = { percentile, score_brut, temps }. Vide si pas de subtests pour cette epreuve. Inclure UNIQUEMENT les subtests presents dans le PDF.',
              additionalProperties: {
                type: 'object',
                properties: {
                  percentile: { type: 'string', enum: ['', 'p_sup_95', 'p_90_95', 'p_75_90', 'p_50_75', 'p_25_50', 'p_10_25', 'p_5_10', 'p_inf_5'] },
                  score_brut: { type: 'string' },
                  temps: { type: 'string' },
                },
                required: ['percentile', 'score_brut', 'temps'],
              },
            },
            score_brut: { type: 'string', description: 'Score brut tel qu\'affiche, format libre (ex. "18/22", "27", "8/10"). Vide si absent ou si scores deja saisis dans subtests.' },
            temps: { type: 'string', description: 'Temps en secondes ou format libre pour les epreuves chronometrees (Transcodage, Fluence arithmetique, certaines proportionnalites). Vide si non chronometree.' },
            observation: { type: 'string', description: 'Annotations qualitatives verbatim du PDF : strategies (comptage doigts, par groupes), types d\'erreurs (lexicales vs syntaxiques en transcodage, oubli retenue), comportements (refus, anxiete, decrochage). Recopie integrale.' },
            non_passee: { type: 'boolean', description: 'true si epreuve explicitement "NP" / "non passee" / "—" / non realisee. Defaut false.' },
          },
          required: ['key', 'percentile', 'subtests', 'score_brut', 'temps', 'observation', 'non_passee'],
        },
      },
    },
    required: ['niveau', 'epreuves'],
  },
}

export const EXAMATH_EXTRACT_PROMPT = `Tu es un expert en extraction de donnees de bilans orthophoniques Examath 8-15 (Anne Lafay & Marie-Christel Helloin — HappyNeuron 2016). Tu recois un rapport informatise du module resultats HappyNeuron Pro, ou un scan du cahier de passation rempli a la main, ou un bilan deja redige integrant les resultats.

# CONTEXTE EXAMATH (specificites)

Examath 8-15 est la batterie informatisee de reference francophone pour le diagnostic de **dyscalculie developpementale** (DSM-5). Etalonnee sur 508 enfants et adolescents en France. 40 epreuves reparties en 6 modules officiels :
1. Habiletes numeriques de base (6 epreuves) — coeur du diagnostic dyscalculie primaire
2. Numeration (9 epreuves : base 10 + decimale/fractionnaire CM2+)
3. Arithmetique (7 epreuves)
4. Mesures (3 epreuves)
5. Resolution de problemes arithmetiques a enonce verbal (9 epreuves)
6. Langage et raisonnement (6 epreuves)

5 niveaux d'etalonnage : CE2 / CM1 / CM2 / 6e-5e / 4e-3e.

Cotation : score brut + ecart-type + **percentile** (P5, P10, Q1, Med, Q3, P90, P95) + temps si chronometre.

**Seuil officiel de pathologie : P ≤ 10. Pathologie severe : P ≤ 5.**

# OBJECTIF

Extraire les donnees brutes du bilan Examath pour pre-remplir le formulaire ortho.ia. **N'INVENTE RIEN.** Si une donnee n'est pas presente, laisse vide.

Tu DOIS appeler l'outil \`extract_examath_results\`. N'ecris aucun texte hors de l'appel d'outil.

# 1. NIVEAU D'ETALONNAGE

Cherche dans l'en-tete du rapport ou l'anamnese :
- "CE2" → \`CE2\`
- "CM1" → \`CM1\`
- "CM2" → \`CM2\`
- "6e" / "5e" / "6eme" / "5eme" → \`6e_5e\`
- "4e" / "3e" / "4eme" / "3eme" → \`4e_3e\`

Si non determinable, laisse vide.

# 2. EPREUVES — 40 epreuves officielles

## Mapping libelles PDF → cles

### Module 1 — Habiletes numeriques de base
- "Comparaison analogique" → \`m1_comparaison_analogique\`
- "Relation Arabe / Analogique" (sans U-D-C) → \`m1_relation_arabe_analogique\` (subtest \`comparaison_arabe\`)
- "Relation Oral / Analogique" → \`m1_relation_oral_analogique\` (subtest \`comparaison_orale\`)
- "Ligne numerique" / "Ligne numerique 0-100" / "Ligne numerique 0-1000" → \`m1_ligne_numerique\`
- "Identification de quantites" / "Subitizing" → \`m1_identification_quantites\` (subtest \`subitizing\`)
- "Denombrement et calcul" / "Denombrement" → \`m1_denombrement_calcul\` (subtests \`identification_collection\`, \`production_collection\`)

### Module 2 — Numeration base 10
- "Transcodage" → \`m2_transcodage\` (4 subtests : \`lecture_1_99\`, \`lecture_99p\`, \`dictee_1_99\`, \`dictee_99p\`)
- "Repetition de grands nombres" → \`m2_repetition_grands_nombres\`
- "Identification d'U/D/C/M" / "U/D/C/M" → \`m2_identification_udcm\`
- "Relation Arabe / Analogique U-D-C" → \`m2_relation_arabe_analogique_udc\` (subtests \`production_arabe_analogique\`, \`production_analogique_arabe\`, \`jugement\`)
- "Decomposition additive" → \`m2_decomposition_additive\`

### Module 2 — Numeration decimale et fractionnaire (CM2+)
- "Fractions en images" → \`m2_fractions_images\`
- "Ligne numerique — Fractions" / "Ligne numerique fractions" → \`m2_ligne_numerique_fractions\`
- "Jugement d'ecriture decimale" → \`m2_jugement_ecriture_decimale\`
- "Comparaison de fractions" → \`m2_comparaison_fractions\`

### Module 3 — Arithmetique
- "Operations analogiques" → \`m3_operations_analogiques\`
- "Jugement d'operations" → \`m2_jugement_operations\` (cle historiquement prefixee m2_ mais cote manuel reclasse en M3)
- "Fluence arithmetique" → \`m3_fluence_arithmetique\` (3 subtests : \`additions\`, \`soustractions\`, \`multiplications\`)
- "Calcul mental complexe" → \`m3_calcul_mental_complexe\`
- "Mecanismes operatoires ecrits" / "Mecanismes operatoires" / "Operations posees" → \`m3_mecanismes_operatoires\` (3 subtests : \`additions\`, \`soustractions\`, \`multiplication\`)
- "Calcul avec fractions" → \`m2_calcul_fractions\` (cle historique m2_)
- "Estimation de resultat" → \`m2_estimation_resultat\` (cle historique m2_)

### Module 4 — Mesures
- "Approche contextuelle des mesures" → \`m4_approche_mesures\`
- "Equivalence et Comparaison" / "Equivalence" → \`m4_equivalence_comparaison\`
- "Problemes de mesures" → \`m4_problemes_mesures\`

### Module 5 — Resolution de problemes arithmetiques
- "Combinaison +" → \`m5_combinaison_plus\`
- "Transformation +" → \`m5_transformation_plus\`
- "Comparaison +" → \`m5_comparaison_plus\`
- "Proportionnalite simple et directe" / "Proportionnalite simple" → \`m5_proportionnalite\`
- "Proportionnalite simple composee" → \`m5_proportionnalite_composee\`
- "Proportionnalite multiple" → \`m5_proportionnalite_multiple\`
- "Comparaison ×" / "Comparaison x" → \`m5_comparaison_x\`
- "Probleme compose" (singulier) → \`m5_probleme_compose\`
- "Problemes composes" (pluriel) → \`m5_problemes_composes\`

### Module 6 — Langage et raisonnement
- "Inferences en images" → \`m6_inferences_images\`
- "Inferences logiques non verbales" / "Inferences logiques" → \`m6_inferences_logiques\`
- "Inferences verbales" → \`m6_inferences_verbales\`
- "Inferences lexicales et semantiques" / "Inferences lexicales" → \`m6_inferences_lexicales\`
- "Mathematique — Lexique" / "Lexique mathematique" / "Vocabulaire mathematique" → \`m6_lexique_math\`
- "Gestion des enonces" / "Gestion d'enonces" → \`m6_gestion_enonces\`

# 3. PERCENTILE

Bandes Examath / HappyNeuron Pro standard :
- "> P95" → \`p_sup_95\` (Tres superieur)
- "P95" / "P91-P95" → \`p_90_95\`
- "P90" / "P76-P90" → \`p_75_90\`
- "Q3" / "P50-P75" → \`p_50_75\` (Moyenne haute, Q3 inclus)
- "Med" / "Mediane" / "P26-P49" → \`p_25_50\` (Moyenne basse)
- "Q1" / "P11-P25" → \`p_10_25\` (Zone de fragilite, Q1 inclus)
- "P10" / "P6-P10" → \`p_5_10\` (Difficulte) ⚠️ **SEUIL PATHOLOGIE**
- "P5" / "P1-P5" → \`p_inf_5\` (Difficulte severe) ⚠️ **PATHOLOGIE SEVERE**

⚠️ **NE PAS recalculer un percentile depuis l'ecart-type seul**. Les normes etalonnees Examath priment sur la distribution gaussienne theorique. Recopier ce que le logiciel HappyNeuron affiche.

# 4. SUBTESTS

Pour les epreuves a sous-scores, recopier chaque subtest separement dans \`subtests\` :

\`\`\`json
{
  "key": "m2_transcodage",
  "percentile": "",
  "subtests": {
    "lecture_1_99": { "percentile": "p_75_90", "score_brut": "30/30", "temps": "45s" },
    "lecture_99p":  { "percentile": "p_25_50", "score_brut": "12/20", "temps": "120s" },
    "dictee_1_99":  { "percentile": "p_75_90", "score_brut": "28/30", "temps": "60s" },
    "dictee_99p":   { "percentile": "p_10_25", "score_brut": "10/20", "temps": "180s" }
  }
}
\`\`\`

Le \`percentile\` global de l'epreuve peut etre laisse vide si chaque subtest a son propre percentile (Examath fournit en general un percentile par subtest, pas un score global d'epreuve agrégé).

# 5. TEMPS

Format libre (ex. "45s", "2min", "120"). Vide si l'epreuve n'est pas chronometree ou si le temps n'est pas affiche. Epreuves chronometrees :
- Transcodage (tous subtests)
- Fluence arithmetique (additions, soustractions, multiplications)
- Quelques epreuves de proportionnalite

# 6. OBSERVATION

Recopie verbatim TOUTES les annotations qualitatives presentes dans le PDF. Sources :

1. **Marge du tableau de cotation** : "compte sur les doigts", "saute des etapes", "confusion lexicale quatorze/quarante", "oubli retenue", "lit le nombre a l'envers".
2. **Stratégies observées** : comptage sur doigts persistant après CE1, comptage par groupes (de 2, 3, 5), recours systematique aux operations posees au lieu du mental.
3. **Types d'erreurs en Transcodage** :
   - **Lexicales** : quatorze ↔ quarante, soixante-dix ↔ soixante (defaut etiquette verbale)
   - **Syntaxiques** : 3008 ecrit pour 308, 100020 pour 120 (defaut conversion arabe ↔ verbal)
4. **Comportements** : refus epreuve, anxiete, lenteur, fatigue, decrochage attentionnel.
5. **Strategies en problemes** : modelisation par dessin/schemas, recours visuel.

🔒 **CRITIQUE** : Examath a \`showAllEpreuveComments: true\` actif → TOUTES les observations remontent dans le Word genere, pas seulement les epreuves fragiles. Recopie integrale.

# 7. NON_PASSEE

\`true\` si :
- "NP" / "non passee" / "non realisee" / "—" / "X" / "non applicable"
- Epreuve niveau-specifique non proposee (ex. Fractions en images sur un CE2 — pas applicable, le manuel reserve aux CM2+)
- "abandonnee" / "refusee"

# 8. PRINCIPES GENERAUX

- **Conservateur** : doute → vide. Mieux vaut un champ vide qu'une hallucination.
- **Pas d'invention** : zero champ par defaut.
- **Format strict** : enums respectes (niveau, cles d'epreuves, cles de subtests, bandes percentile).
- **Une entree par epreuve** : ne pas dupliquer.
- **Pas d'epreuve absente** : si l'epreuve n'est pas dans le PDF, ne PAS l'inclure.

Si le PDF n'est PAS un bilan Examath 8-15 (autre test, page blanche, document non pertinent), retourne niveau='', epreuves=[].`
