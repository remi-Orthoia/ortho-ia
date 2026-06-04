/**
 * Extraction PDF dediee Exalang Lyfac (Thibault & Lenfant — HappyNeuron).
 *
 * Cible : rapport de cotation PDF du logiciel HappyNeuron Pro pour Lyfac
 * (population lyceens / etudiants / jeunes adultes) OU bilan deja redige.
 * Pre-remplit components/forms/ExalangLyfacScoresInput.tsx :
 *  - contexte du bilan + niveau d'etudes (texte libre)
 *  - 14 epreuves : percentile (8 bandes), score brut, temps, vitesse
 *    en mots/min (pour Leximetrie), observation
 *
 * Lyfac est typiquement passe en contexte de demande d'amenagements
 * d'examens (CDAPH) ou de suivi post-PEC enfance.
 *
 * Respecte la regle d'isolation CLAUDE.md : specifique a Exalang Lyfac.
 */

import type Anthropic from '@anthropic-ai/sdk'

/** 15 cles d'epreuves valides — DOIVENT matcher ExalangLyfacScoresInput.tsx.
 *  14 epreuves officielles du manuel Thibault & Lenfant 2014 + synthese_ortho
 *  (agregation lexicale/grammaticale optionnelle, ajoutee au form pour
 *  faciliter la saisie d'un score global module Orthographe). */
export const EXALANGLYFAC_EPREUVE_KEYS = [
  // Memoire (3)
  'empan_visuel', 'empan_endroit', 'empan_envers',
  // Langage elabore (4) — anaphores ajoute 2026-06 (alignement manuel)
  'flexibilite_lexicale', 'anaphores', 'consignes_orales', 'inferences',
  // Lecture (5)
  'lecture_mots', 'lecture_logatomes', 'leximetrie', 'comp_texte', 'reperage',
  // Orthographe (2 + synthese)
  'texte_choix_multiple', 'completion_phrases', 'synthese_ortho',
] as const

export type ExalangLyfacEpreuveKey = typeof EXALANGLYFAC_EPREUVE_KEYS[number]

export interface ExalangLyfacExtracted {
  contexte: string  // '' | 'cdaph_examens' | 'medecine_universitaire' | 'suivi_post_pec' | 'plainte_etudiant' | 'autre'
  niveau_etudes: string  // texte libre, ex. "Terminale S", "L1 droit", "M2 ingénieur"
  epreuves: Array<{
    key: string
    percentile: string
    score_brut: string
    temps: string
    vitesse_mots_min: string  // pour Leximetrie principalement
    observation: string
    non_passee: boolean
  }>
}

export const EXALANGLYFAC_EXTRACT_TOOL: Anthropic.Tool = {
  name: 'extract_exalang_lyfac_results',
  description: 'Extrait les resultats d\'un bilan Exalang Lyfac (lyceens / etudiants / jeunes adultes) depuis un rapport PDF HappyNeuron Pro ou scan du cahier. Retourne le contexte du bilan, le niveau d\'etudes et les scores par epreuve.',
  input_schema: {
    type: 'object',
    properties: {
      contexte: {
        type: 'string',
        enum: ['', 'cdaph_examens', 'medecine_universitaire', 'suivi_post_pec', 'plainte_etudiant', 'autre'],
        description: 'Contexte du bilan. "Amenagements examens" / "CDAPH" / "MDPH" → cdaph_examens. "Medecine preventive universitaire" / "SUMPPS" → medecine_universitaire. "Suivi post-PEC enfance" / "Reevaluation" → suivi_post_pec. "Plainte spontanee" → plainte_etudiant. Sinon "autre" ou vide.',
      },
      niveau_etudes: {
        type: 'string',
        description: 'Niveau d\'etudes actuel en texte libre. Ex. "Terminale S", "L1 Droit", "M2 ingenieur", "BTS Comptabilite". Vide si non determinable.',
      },
      epreuves: {
        type: 'array',
        description: 'Une entree par epreuve passee.',
        items: {
          type: 'object',
          properties: {
            key: {
              type: 'string',
              enum: [...EXALANGLYFAC_EPREUVE_KEYS],
              description: 'Cle technique.',
            },
            percentile: {
              type: 'string',
              enum: ['', 'p_sup_95', 'p_90_95', 'p_75_90', 'p_50_75', 'p_25_50', 'p_10_25', 'p_5_10', 'p_inf_5'],
              description: 'Bande de percentile Exalang. Q1 = P25 = Zone de fragilite.',
            },
            score_brut: { type: 'string', description: 'Format libre.' },
            temps: { type: 'string', description: 'Temps pour les epreuves chronometrees (toutes les lectures sont chronometrees).' },
            vitesse_mots_min: { type: 'string', description: 'UNIQUEMENT pour key=leximetrie : vitesse en mots par minute. Ex. "180 mots/min". Critere majeur pour les amenagements d\'examens (vitesse insuffisante = tiers-temps justifie). Vide pour les autres epreuves.' },
            observation: { type: 'string', description: 'Annotations verbatim : types d\'erreurs en lecture (paralexies, regularisations), strategies, attitudes (anxiete d\'examen, fatigabilite), retour sur la verbalisation (etudiant qui dit "j\'ai besoin de relire 3 fois").' },
            non_passee: { type: 'boolean', description: 'true si "NP" / "—". Defaut false.' },
          },
          required: ['key', 'percentile', 'score_brut', 'temps', 'vitesse_mots_min', 'observation', 'non_passee'],
        },
      },
    },
    required: ['contexte', 'niveau_etudes', 'epreuves'],
  },
}

export const EXALANGLYFAC_EXTRACT_PROMPT = `Tu es un expert en extraction de donnees de bilans orthophoniques Exalang Lyfac (Thibault & Lenfant — HappyNeuron). Population : lyceens, etudiants, jeunes adultes (15-25 ans), typiquement en contexte de demande d'amenagements d'examens (CDAPH) ou suivi post-PEC enfance.

# OBJECTIF

Extraire les donnees brutes pour pre-remplir le formulaire ortho.ia. **N'INVENTE RIEN.** Mieux vaut un champ vide qu'une hallucination.

Tu DOIS appeler l'outil \`extract_exalang_lyfac_results\`.

# 1. CONTEXTE DU BILAN

Cherche en tete du rapport ou dans l'anamnese le contexte qui justifie le bilan :
- "Demande d'amenagements" / "CDAPH" / "MDPH" / "Tiers-temps" / "Aménagements aux examens" → \`cdaph_examens\`
- "Medecine preventive universitaire" / "SUMPPS" / "Service de sante universitaire" → \`medecine_universitaire\`
- "Suivi post-PEC enfance" / "Reevaluation suite a dyslexie diagnostiquee enfant" → \`suivi_post_pec\`
- "Plainte spontanee" / "Demande de l'etudiant" → \`plainte_etudiant\`
- Sinon → \`autre\` ou vide si non determinable.

# 2. NIVEAU D'ETUDES

Texte libre. Recopier verbatim le niveau d'etudes mentionne (ex. "Terminale S", "L1 droit", "M2 ingenieur", "BTS Comptabilite", "Premiere annee de Medecine"). Vide si non mentionne.

# 3. EPREUVES — 14 epreuves, 4 domaines

## Memoire
- "Empan visuel" → \`empan_visuel\`
- "Empan endroit" / "Empan auditif endroit" → \`empan_endroit\`
- "Empan envers" / "Empan auditif envers" → \`empan_envers\`

## Langage elabore
- "Flexibilite lexicale" / "Flexibilite semantique" / "Synonymes" / "Paraphrase" → \`flexibilite_lexicale\`
- "Reperage d'anaphores" / "Anaphores" / "Anaphores du mot Venus" → \`anaphores\` (epreuve sur 47 pts, 13 anaphores du mot Venus, score moy 33.14)
- "Consignes orales" / "Comprehension de consignes" → \`consignes_orales\`
- "Inferences" / "Sous-entendu" → \`inferences\`

## Lecture
- "Lecture de mots" → \`lecture_mots\`
- "Lecture de logatomes" / "Non-mots" → \`lecture_logatomes\`
- "Leximetrie" / "Vitesse de lecture" → \`leximetrie\` (capter \`vitesse_mots_min\` separement)
- "Comprehension de texte" → \`comp_texte\`
- "Reperage" / "Prise d'informations" → \`reperage\`

## Orthographe
- "Texte a choix multiple" / "QCM orthographique" → \`texte_choix_multiple\`
- "Completion de phrases" → \`completion_phrases\`
- "Synthese orthographique" / "Score global ortho" → \`synthese_ortho\`

# 4. PERCENTILE

Bandes Exalang standard :
- "> P95" → \`p_sup_95\` (Tres superieur)
- "P95" / "P91-P95" → \`p_90_95\`
- "P90" / "P76-P90" → \`p_75_90\`
- "Q3" / "P50-P75" → \`p_50_75\` (Moyenne haute)
- "Med" / "P26-P49" → \`p_25_50\` (Moyenne basse)
- "Q1" / "P11-P25" → \`p_10_25\` (Zone de fragilite)
- "P10" / "P6-P10" → \`p_5_10\` (Difficulte)
- "P5" / "P1-P5" → \`p_inf_5\` (Difficulte severe)

⚠️ **Q1 = P25 = Zone de fragilite**. Bornes inclusives. NE PAS recalculer depuis l'ecart-type.

# 5. VITESSE_MOTS_MIN — CRITIQUE pour Lyfac

Pour \`leximetrie\` uniquement, capturer la **vitesse en mots/min** dans le champ \`vitesse_mots_min\`. C'est le critere majeur pour les amenagements d'examens : une vitesse insuffisante justifie le tiers-temps. Format libre, ex. "180 mots/min", "215", "164 m/min".

Pour les AUTRES epreuves, laisser \`vitesse_mots_min\` vide.

# 6. OBSERVATION

A recopier au verbatim :
1. Types d'erreurs en lecture (paralexies visuelles, regularisations de mots irreguliers, omissions phonemiques).
2. Strategies de l'etudiant (recours systematique au contexte, relecture multiple, "j'ai besoin de re-lire 3 fois").
3. Attitudes (anxiete d'examen, fatigabilite marquee, decrochage attentionnel, autocensure).
4. Analyse typologique de l'orthographe (erreurs phonologiques vs lexicales vs grammaticales) si fournie.

# 7. NON_PASSEE

true si explicitement marque "NP" / "non passee" / "—". Defaut false.

# 8. PRINCIPES GENERAUX

- Conservateur : doute → vide.
- Pas d'invention.
- Une entree par epreuve.
- Pas d'epreuve absente.

Si le PDF n'est PAS un bilan Exalang Lyfac, retourne contexte='', niveau_etudes='', epreuves=[].`
