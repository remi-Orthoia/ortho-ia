import type Anthropic from '@anthropic-ai/sdk'

export const CRBO_TOOL: Anthropic.Tool = {
  name: 'generate_crbo',
  description:
    "Produit un Compte Rendu de Bilan Orthophonique (CRBO) structuré à partir des données de bilan fournies (patient, anamnèse, tests, résultats). Chaque épreuve est classée par domaine, avec percentile numérique et interprétation clinique normalisée.",
  input_schema: {
    type: 'object',
    required: ['anamnese_redigee', 'domains', 'diagnostic', 'recommandations', 'conclusion'],
    properties: {
      anamnese_redigee: {
        type: 'string',
        description:
          "Paragraphe fluide d'anamnèse rédigé en 3e personne reprenant situation scolaire, fratrie, acquisitions, vision/audition, loisirs, suivis antérieurs.",
      },
      domains: {
        type: 'array',
        description: 'Résultats groupés par domaine cognitif/langagier testé.',
        items: {
          type: 'object',
          required: ['nom', 'epreuves', 'commentaire'],
          properties: {
            nom: {
              type: 'string',
              description: 'Nom du domaine (ex: "Langage oral", "Langage écrit", "Mémoire de travail").',
            },
            epreuves: {
              type: 'array',
              items: {
                type: 'object',
                required: ['nom', 'score', 'percentile', 'percentile_value', 'interpretation'],
                properties: {
                  nom: { type: 'string', description: "Nom de l'épreuve." },
                  score: { type: 'string', description: 'Score brut (ex: "16/25", "TPS 480").' },
                  et: {
                    type: ['string', 'null'],
                    description: "Écart-type tel qu'indiqué dans le test, ou null si absent.",
                  },
                  percentile: {
                    type: 'string',
                    description:
                      'Notation percentile telle qu\'utilisée par le test (ex: "Q1 (P25)", "P10", "Med (P50)").',
                  },
                  percentile_value: {
                    type: 'number',
                    description:
                      'Valeur numérique du percentile entre 0 et 100. Q1→25, Med→50, Q3→75. Jamais recalculé depuis l\'É-T.',
                    minimum: 0,
                    maximum: 100,
                  },
                  interpretation: {
                    type: 'string',
                    enum: ['Normal', 'Limite basse', 'Fragile', 'Déficitaire', 'Pathologique'],
                    description: 'Interprétation clinique basée sur les seuils officiels.',
                  },
                },
              },
            },
            commentaire: {
              type: 'string',
              description:
                'Commentaire clinique du domaine : observations, interprétation globale, éléments notables.',
            },
          },
        },
      },
      diagnostic: {
        type: 'string',
        description:
          'Synthèse globale : comportement pendant le bilan, points forts, difficultés, diagnostic orthophonique.',
      },
      recommandations: {
        type: 'string',
        description:
          'Recommandations : aménagements scolaires, indication de prise en charge, fréquence suggérée.',
      },
      conclusion: {
        type: 'string',
        description: 'Phrase de clôture standard du CRBO.',
      },
    },
  },
}

export interface CRBOEpreuve {
  nom: string
  score: string
  et: string | null
  percentile: string
  percentile_value: number
  interpretation: 'Normal' | 'Limite basse' | 'Fragile' | 'Déficitaire' | 'Pathologique'
}

export interface CRBODomain {
  nom: string
  epreuves: CRBOEpreuve[]
  commentaire: string
}

export interface CRBOStructure {
  anamnese_redigee: string
  domains: CRBODomain[]
  diagnostic: string
  recommandations: string
  conclusion: string
}
