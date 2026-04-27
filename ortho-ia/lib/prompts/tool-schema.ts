import type Anthropic from '@anthropic-ai/sdk'

// ============================================================================
// SCHÉMAS PARTAGÉS (épreuves, domaines)
// ============================================================================

const EPREUVE_SCHEMA = {
  type: 'object' as const,
  required: ['nom', 'score', 'percentile', 'percentile_value', 'interpretation'],
  properties: {
    nom: { type: 'string' as const, description: "Nom de l'épreuve." },
    score: { type: 'string' as const, description: 'Score brut (ex: "16/25", "TPS 480").' },
    et: {
      type: ['string', 'null'] as ('string' | 'null')[],
      description: "Écart-type tel qu'indiqué dans le test, ou null si absent.",
    },
    percentile: {
      type: 'string' as const,
      description:
        'Notation percentile telle qu\'utilisée par le test (ex: "Q1 (P25)", "P10", "Med (P50)").',
    },
    percentile_value: {
      type: 'number' as const,
      description:
        'Valeur numérique du percentile entre 0 et 100. Q1→25, Med→50, Q3→75. Jamais recalculé depuis l\'É-T.',
      minimum: 0,
      maximum: 100,
    },
    interpretation: {
      type: 'string' as const,
      enum: ['Dans la norme', 'Zone de fragilité', 'Zone de difficulté', 'Zone de difficulté sévère'],
      description:
        "Interprétation clinique selon la grille officielle Exalang/HappyNeuron : " +
        "'Dans la norme' pour P > 25 (strictement) ; 'Zone de fragilité' pour P10-P25 (Q1 inclus, **PAS** dans la norme) ; " +
        "'Zone de difficulté' pour P5-P9 ; 'Zone de difficulté sévère' pour P < 5.",
    },
  },
}

const DOMAIN_SCHEMA_EXTRACT = {
  type: 'object' as const,
  required: ['nom', 'epreuves'],
  properties: {
    nom: {
      type: 'string' as const,
      description: 'Nom du domaine (ex: "A.1 Boucle phonologique", "B.2 Lecture").',
    },
    epreuves: {
      type: 'array' as const,
      items: EPREUVE_SCHEMA,
    },
  },
}

// ============================================================================
// PHASE 1 — EXTRACTION : reformulation anamnèse + motif + parsing scores
// ============================================================================
//
// L'IA reçoit : formulaire complet (anamnèse brute, motif brut, résultats bruts).
// L'IA renvoie : anamnèse rédigée, motif reformulé, domaines structurés (épreuves
// uniquement, sans commentaire — celui-ci sera saisi par l'orthophoniste sur la
// page de visualisation).
// AUCUN diagnostic ni recommandation à ce stade.

export const EXTRACT_CRBO_TOOL: Anthropic.Tool = {
  name: 'extract_crbo_data',
  description:
    "Extrait et structure les données du bilan : reformule l'anamnèse et le motif en prose professionnelle, puis classe les résultats des tests par domaine et épreuve avec leur percentile et interprétation. NE PRODUIT PAS de diagnostic ni de recommandations à ce stade — ces éléments seront générés en phase 2 (synthèse) après validation par l'orthophoniste.",
  input_schema: {
    type: 'object',
    required: ['anamnese_redigee', 'motif_reformule', 'domains'],
    properties: {
      anamnese_redigee: {
        type: 'string',
        description:
          "Paragraphe fluide d'anamnèse rédigé en 3e personne. JAMAIS de notes brutes, toujours en prose professionnelle. Anti-hallucination stricte : ne couvrir QUE les rubriques pour lesquelles l'orthophoniste a fourni des notes — ne JAMAIS inférer composition familiale, profession parentale, antécédents, suivis, classe, etc. si non mentionnés.",
      },
      motif_reformule: {
        type: 'string',
        description:
          "Motif de consultation reformulé en 1-2 phrases professionnelles à la 3ème personne, à partir des notes brutes du champ 'Motif de consultation'. JAMAIS recopié tel quel. Vide ('') si aucun motif fourni. Anti-hallucination : ne pas ajouter d'élément non mentionné.",
      },
      domains: {
        type: 'array',
        description:
          'Résultats groupés par domaine cognitif/langagier testé. Utiliser la nomenclature officielle des tests fournis dans le système (groupes A.1, A.2, B.1...).',
        items: DOMAIN_SCHEMA_EXTRACT,
      },
    },
  },
}

// ============================================================================
// PHASE 2 — SYNTHÈSE : diagnostic + recommandations + comorbidités + PAP
// ============================================================================
//
// L'IA reçoit : anamnèse éditée par l'ortho, motif édité, domaines structurés
// (déjà extraits en phase 1), commentaires qualitatifs par domaine saisis par
// l'ortho, infos patient/médecin.
// L'IA renvoie : diagnostic + recommandations + comorbidités + PAP suggestions
// + conclusion. PAS de domains, PAS d'anamnèse — déjà figés.

export const SYNTHESIZE_TOOL: Anthropic.Tool = {
  name: 'synthesize_crbo',
  description:
    "Génère la synthèse narrative du CRBO : diagnostic orthophonique avec terminologie DSM-5/CIM-10, recommandations de prise en charge, comorbidités suspectées, suggestions d'aménagements scolaires (PAP), et le cas échéant la synthèse d'évolution pour un bilan de renouvellement. Les scores et l'anamnèse sont déjà structurés en entrée : ne PAS les régénérer.",
  input_schema: {
    type: 'object',
    required: ['diagnostic', 'recommandations', 'conclusion', 'comorbidites_detectees', 'pap_suggestions'],
    properties: {
      diagnostic: {
        type: 'string',
        description:
          'Synthèse globale 200-300 mots : comportement en bilan, points forts, difficultés, analyse croisée, diagnostic orthophonique avec terminologie DSM-5 + code CIM-10. Structuré avec sous-titres Markdown **Titre**.',
      },
      recommandations: {
        type: 'string',
        description:
          "Recommandations 150-250 mots structurées : phrase d'introduction de la PEC, axes thérapeutiques en liste numérotée, réévaluation, orientations vers autres professionnels (en suggestion). PAS de fréquence/durée chiffrée des séances. PAS de paragraphe MDPH/PPS automatique.",
      },
      conclusion: {
        type: 'string',
        description: 'Phrase de clôture standard du CRBO ("Compte rendu remis en main propre…").',
      },
      severite_globale: {
        type: ['string', 'null'],
        enum: ['Léger', 'Modéré', 'Sévère', null],
        description:
          "Score de sévérité global du profil clinique (informatif, non affiché dans le Word). null si profil dans la norme ou non évaluable.",
      },
      comorbidites_detectees: {
        type: 'array',
        description:
          "Liste des comorbidités suspectées. Format : 'Libellé du trouble — code CIM-10 — justification clinique courte (sans percentile cité)'. Tableau vide [] si aucune.",
        items: { type: 'string' },
      },
      pap_suggestions: {
        type: 'array',
        description:
          "Liste d'aménagements scolaires conseillés (max 10, priorisés). Format de chaque entrée : '**Catégorie** — détail concret'. Catégories autorisées : Temps, Outils numériques, Présentation des supports, Évaluations, Pédagogie, Environnement, Oral. Restez généraux : pas de polices/logiciels nominatifs.",
        items: { type: 'string' },
      },
      synthese_evolution: {
        type: ['object', 'null'],
        description:
          "Section comparative présente UNIQUEMENT pour les bilans de renouvellement, null pour les bilans initiaux.",
        properties: {
          resume: {
            type: 'string',
            description:
              "Synthèse narrative de l'évolution depuis le dernier bilan (100-300 mots).",
          },
          domaines_progres: { type: 'array', items: { type: 'string' } },
          domaines_stagnation: { type: 'array', items: { type: 'string' } },
          domaines_regression: { type: 'array', items: { type: 'string' } },
        },
      },
    },
  },
}

// ============================================================================
// LEGACY : full single-shot (compat — utilisé encore par certains chemins)
// ============================================================================

const _extractProps = EXTRACT_CRBO_TOOL.input_schema.properties as Record<string, unknown>
const _synthesizeProps = SYNTHESIZE_TOOL.input_schema.properties as Record<string, unknown>

export const CRBO_TOOL: Anthropic.Tool = {
  name: 'generate_crbo',
  description:
    "Produit un Compte Rendu de Bilan Orthophonique (CRBO) structuré complet en une seule passe. Utilisé pour les flows legacy ; le flow nominal utilise EXTRACT_CRBO_TOOL puis SYNTHESIZE_TOOL.",
  input_schema: {
    type: 'object',
    required: ['anamnese_redigee', 'motif_reformule', 'domains', 'diagnostic', 'recommandations', 'conclusion', 'severite_globale', 'comorbidites_detectees', 'pap_suggestions'],
    properties: {
      anamnese_redigee: _extractProps.anamnese_redigee as any,
      motif_reformule: _extractProps.motif_reformule as any,
      domains: {
        type: 'array',
        description: 'Résultats groupés par domaine cognitif/langagier testé.',
        items: {
          type: 'object',
          required: ['nom', 'epreuves', 'commentaire'],
          properties: {
            nom: DOMAIN_SCHEMA_EXTRACT.properties.nom,
            epreuves: DOMAIN_SCHEMA_EXTRACT.properties.epreuves,
            commentaire: {
              type: 'string',
              description:
                'Commentaire clinique du domaine (legacy, désormais saisi par l\'ortho dans la nouvelle UI).',
            },
          },
        },
      },
      diagnostic: _synthesizeProps.diagnostic as any,
      recommandations: _synthesizeProps.recommandations as any,
      conclusion: _synthesizeProps.conclusion as any,
      severite_globale: _synthesizeProps.severite_globale as any,
      comorbidites_detectees: _synthesizeProps.comorbidites_detectees as any,
      pap_suggestions: _synthesizeProps.pap_suggestions as any,
      synthese_evolution: _synthesizeProps.synthese_evolution as any,
    },
  },
}

// ============================================================================
// TYPES TS
// ============================================================================

export interface CRBOEpreuve {
  nom: string
  score: string
  et: string | null
  percentile: string
  percentile_value: number
  /**
   * Nouvelle nomenclature Exalang/HappyNeuron. Les CRBO legacy stockent
   * encore les anciens labels ('Normal' | 'Limite basse' | 'Fragile' |
   * 'Déficitaire' | 'Pathologique'), c'est pourquoi le type accepte string.
   * Au rendu, normalizeInterpretation() de lib/word-export les remappe.
   */
  interpretation: string
}

export interface CRBODomain {
  nom: string
  epreuves: CRBOEpreuve[]
  /** Commentaire qualitatif saisi par l'orthophoniste sur la page de visualisation (phase 1.5).
   *  Optionnel : peut être vide si l'ortho n'a rien noté. Affiché sous le tableau dans le Word. */
  commentaire: string
}

export type SeveriteGlobale = 'Léger' | 'Modéré' | 'Sévère' | null

export interface SyntheseEvolution {
  resume: string
  domaines_progres: string[]
  domaines_stagnation: string[]
  domaines_regression: string[]
}

/** Résultat de la phase 1 (extract) : ce que l'IA produit avant l'édition ortho. */
export interface ExtractedCRBO {
  anamnese_redigee: string
  motif_reformule: string
  domains: CRBODomain[]
}

/** Résultat de la phase 2 (synthesize) : ce que l'IA produit à partir des données validées. */
export interface SynthesizedCRBO {
  diagnostic: string
  recommandations: string
  conclusion: string
  comorbidites_detectees: string[]
  pap_suggestions: string[]
  severite_globale?: SeveriteGlobale
  synthese_evolution?: SyntheseEvolution | null
}

/** Structure complète du CRBO (résultat fusionné des 2 phases ou flow legacy). */
export interface CRBOStructure {
  anamnese_redigee: string
  domains: CRBODomain[]
  diagnostic: string
  recommandations: string
  conclusion: string
  // Champs étendus (CRBOs antérieurs à l'extension de schéma peuvent ne pas les avoir)
  motif_reformule?: string
  severite_globale?: SeveriteGlobale
  comorbidites_detectees?: string[]
  pap_suggestions?: string[]
  synthese_evolution?: SyntheseEvolution | null
}
