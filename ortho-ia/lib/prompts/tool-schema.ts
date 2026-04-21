import type Anthropic from '@anthropic-ai/sdk'

export const CRBO_TOOL: Anthropic.Tool = {
  name: 'generate_crbo',
  description:
    "Produit un Compte Rendu de Bilan Orthophonique (CRBO) structuré à partir des données de bilan fournies (patient, anamnèse, tests, résultats). Chaque épreuve est classée par domaine, avec percentile numérique et interprétation clinique normalisée. Inclut un score de sévérité global, la détection des comorbidités, des suggestions PAP automatiques et une synthèse d'évolution si c'est un renouvellement.",
  input_schema: {
    type: 'object',
    required: ['anamnese_redigee', 'domains', 'diagnostic', 'recommandations', 'conclusion', 'severite_globale', 'comorbidites_detectees', 'pap_suggestions'],
    properties: {
      anamnese_redigee: {
        type: 'string',
        description:
          "Paragraphe fluide d'anamnèse rédigé en 3e personne (150-400 mots). JAMAIS de notes brutes, toujours en prose professionnelle.",
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
                'Commentaire clinique du domaine (3-6 phrases) : observations, interprétation, analyse croisée inter-domaines, orientation thérapeutique.',
            },
          },
        },
      },
      diagnostic: {
        type: 'string',
        description:
          'Synthèse globale 200-500 mots : comportement en bilan, points forts, difficultés, analyse croisée, diagnostic orthophonique, diagnostic différentiel, facteurs aggravants/protecteurs.',
      },
      recommandations: {
        type: 'string',
        description:
          'Recommandations 150-300 mots : fréquence/durée séances, axes thérapeutiques, aménagements scolaires, démarches administratives (PAP/PPS/MDPH/RQTH), collaboration pluridisciplinaire.',
      },
      conclusion: {
        type: 'string',
        description: 'Phrase de clôture standard du CRBO.',
      },
      severite_globale: {
        type: ['string', 'null'],
        enum: ['Léger', 'Modéré', 'Sévère', null],
        description:
          "Score de sévérité global du profil clinique. 'Léger' = difficultés ponctuelles sans retentissement scolaire majeur ; 'Modéré' = retentissement scolaire avéré, prise en charge indiquée ; 'Sévère' = retentissement majeur, PEC indispensable avec aménagements lourds (PPS/MDPH). null si profil dans la norme ou non évaluable.",
      },
      comorbidites_detectees: {
        type: 'array',
        description:
          "Liste des comorbidités ou profils associés suspectés à partir des résultats. Format : 'Nom du trouble — brève justification'. Ex: 'Trouble de l'attention suspecté — fluences déficitaires + empan envers très faible + fatigabilité'. Tableau vide [] si aucune comorbidité détectée.",
        items: { type: 'string' },
      },
      pap_suggestions: {
        type: 'array',
        description:
          "Suggestions concrètes d'aménagements scolaires (PAP / PPS) adaptées au profil clinique détecté. Ex: 'Temps majoré 1/3 aux évaluations', 'Ordinateur autorisé avec logiciel de lecture vocale', 'Tolérance orthographique', 'Place préférentielle au calme', 'Consignes reformulées oralement'. Prioriser les aménagements pertinents pour les troubles spécifiques détectés (dyslexie, dyscalculie, TDA).",
        items: { type: 'string' },
      },
      synthese_evolution: {
        type: ['object', 'null'],
        description:
          "Section comparative présente UNIQUEMENT pour les bilans de renouvellement, null pour les bilans initiaux. Compare les scores actuels aux scores du bilan précédent (fourni dans le contexte).",
        properties: {
          resume: {
            type: 'string',
            description:
              "Synthèse narrative de l'évolution depuis le dernier bilan (100-300 mots). Souligne les progrès, stagnations, régressions et l'impact de la rééducation.",
          },
          domaines_progres: {
            type: 'array',
            description: 'Domaines ayant progressé significativement.',
            items: { type: 'string' },
          },
          domaines_stagnation: {
            type: 'array',
            description: 'Domaines sans évolution notable.',
            items: { type: 'string' },
          },
          domaines_regression: {
            type: 'array',
            description: 'Domaines en régression (à surveiller).',
            items: { type: 'string' },
          },
        },
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

export type SeveriteGlobale = 'Léger' | 'Modéré' | 'Sévère' | null

export interface SyntheseEvolution {
  resume: string
  domaines_progres: string[]
  domaines_stagnation: string[]
  domaines_regression: string[]
}

export interface CRBOStructure {
  anamnese_redigee: string
  domains: CRBODomain[]
  diagnostic: string
  recommandations: string
  conclusion: string
  // Champs étendus (CRBOs antérieurs à l'extension de schéma peuvent ne pas les avoir)
  severite_globale?: SeveriteGlobale
  comorbidites_detectees?: string[]
  pap_suggestions?: string[]
  synthese_evolution?: SyntheseEvolution | null
}
