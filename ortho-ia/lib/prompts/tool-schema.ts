import type Anthropic from '@anthropic-ai/sdk'

export const CRBO_TOOL: Anthropic.Tool = {
  name: 'generate_crbo',
  description:
    "Produit un Compte Rendu de Bilan Orthophonique (CRBO) structuré à partir des données de bilan fournies (patient, anamnèse, tests, résultats). Chaque épreuve est classée par domaine, avec percentile numérique et interprétation clinique normalisée. Inclut un score de sévérité global, la détection des comorbidités, des suggestions PAP automatiques et une synthèse d'évolution si c'est un renouvellement.",
  input_schema: {
    type: 'object',
    required: ['anamnese_redigee', 'motif_reformule', 'domains', 'diagnostic', 'recommandations', 'conclusion', 'severite_globale', 'comorbidites_detectees', 'pap_suggestions'],
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
                'Commentaire clinique du domaine, 3-4 lignes max (≈40-70 mots) : interprétation concise, analyse croisée pertinente, orientation thérapeutique en une phrase. Pas de paraphrase des scores.',
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
          "Aménagements scolaires (PAP / PPS) adaptés au profil clinique. **FORMAT IMPÉRATIF** de chaque entrée : '**Catégorie** — détail concret', avec catégorie en gras Markdown séparée du détail par un tiret cadratin (—). Catégories autorisées : Temps, Outils numériques, Présentation des supports, Évaluations, Pédagogie, Environnement, Oral. Exemples : '**Temps** — Temps majoré 1/3 à toutes les évaluations écrites', '**Outils numériques** — Ordinateur autorisé avec logiciel de lecture vocale', '**Environnement** — Place préférentielle au calme'. Le rendu Word groupe automatiquement par catégorie.",
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
  motif_reformule?: string
  severite_globale?: SeveriteGlobale
  comorbidites_detectees?: string[]
  pap_suggestions?: string[]
  synthese_evolution?: SyntheseEvolution | null
}
