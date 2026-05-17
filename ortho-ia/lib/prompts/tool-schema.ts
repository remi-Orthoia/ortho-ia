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
        'Notation percentile au format Px UNIQUEMENT (ex: "P25", "P10", "P50", "P75"). ' +
        'JAMAIS "Q1", "Q3", "Med", "Med." — toujours convertir : Q1 → P25, Q3 → P75, Med → P50.',
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
      enum: ['Moyenne haute', 'Moyenne', 'Moyenne basse', 'Zone de fragilité', 'Difficulté', 'Difficulté sévère'],
      description:
        "Interprétation clinique COURTE — grille révisée 2026-05 imposée Laurie : " +
        "'Moyenne haute' pour P ≥ 51 (couvre > P75 et P51-75, plus de 'Excellent') ; " +
        "'Moyenne' pour P26-P50 ; " +
        "'Moyenne basse' pour P10-P25 (Q1 = P25 inclus, plus en Fragilité) ; " +
        "'Zone de fragilité' pour P5-P9 ; " +
        "'Difficulté' pour P2-P4 ; " +
        "'Difficulté sévère' pour < P2.",
    },
    sous_epreuves: {
      type: 'array' as const,
      description:
        "Décomposition de l'épreuve en sous-items pour les tests à scoring hiérarchique " +
        "(typique MoCA : chaque domaine /5 est décomposé en items à 1pt chacun). " +
        "Vide ou absent pour les tests sans hiérarchie (Exalang, BETL, etc.).",
      items: {
        type: 'object' as const,
        required: ['nom', 'score'],
        properties: {
          nom: { type: 'string' as const, description: "Nom du sous-item (ex: 'Cube', 'Horloge — aiguilles', '5 mots — rappel libre')." },
          score: { type: 'string' as const, description: "Score du sous-item (ex: '1/1', '0/1', '3/5')." },
        },
      },
    },
    commentaire: {
      type: 'string' as const,
      description:
        "Commentaire clinique pour cette épreuve spécifique (3-4 lignes max). " +
        "Utilisé pour les tests où le commentaire est par ÉPREUVE et pas par domaine — " +
        "typiquement MoCA, où chaque domaine cognitif mérite son propre paragraphe " +
        "clinique. Vide ('') si non applicable.",
    },
  },
}

const DOMAIN_SCHEMA_EXTRACT = {
  type: 'object' as const,
  required: ['nom', 'epreuves', 'commentaire'],
  properties: {
    nom: {
      type: 'string' as const,
      description: 'Nom du domaine (ex: "A.1 Boucle phonologique", "B.2 Lecture").',
    },
    epreuves: {
      type: 'array' as const,
      items: EPREUVE_SCHEMA,
    },
    commentaire: {
      type: 'string' as const,
      description:
        "Commentaire clinique INITIAL pour ce domaine (3-4 lignes max, ≈ 40-70 mots) — il sera affiché à l'orthophoniste comme une suggestion qu'elle pourra valider, modifier ou compléter avec ses propres observations. " +
        "Cette suggestion repose UNIQUEMENT sur les scores et l'interprétation des épreuves de ce domaine — elle décrit cliniquement la performance et, si elle est en zone de difficulté, les répercussions scolaires concrètes possibles. " +
        "Respecter strictement les RÈGLES CLINIQUES ABSOLUES : aucun chiffre de percentile (P5, P25, P90...), aucun tiret en début de phrase, aucune mention de la rééducation / des séances / du suivi (ces éléments sont réservés aux recommandations finales). " +
        "Si toutes les épreuves du domaine sont préservées, écrire une phrase courte type 'Les performances sont préservées sur l'ensemble du domaine.' Vide ('') autorisé uniquement si le domaine ne contient qu'une seule épreuve dans la moyenne haute / excellent.",
    },
  },
}

// ============================================================================
// PHASE 1 — EXTRACTION : reformulation anamnèse + motif + parsing scores
// ============================================================================
//
// L'IA reçoit : formulaire complet (anamnèse brute, motif brut, résultats bruts).
// L'IA renvoie : anamnèse rédigée, motif reformulé, domaines structurés avec
// pour chaque domaine un commentaire clinique INITIAL (3-4 lignes, suggestion
// que l'ortho validera/modifiera/complètera dans la textarea correspondante).
// AUCUN diagnostic ni recommandation à ce stade.

export const EXTRACT_CRBO_TOOL: Anthropic.Tool = {
  name: 'extract_crbo_data',
  description:
    "Extrait et structure les données du bilan : reformule l'anamnèse et le motif en prose professionnelle, classe les résultats par domaine, et propose pour chaque domaine un commentaire clinique INITIAL (3-4 lignes) qui pré-remplira la textarea d'observations qualitatives de l'orthophoniste. NE PRODUIT PAS de diagnostic ni de recommandations à ce stade — ces éléments seront générés en phase 2 (synthèse) après validation par l'orthophoniste.",
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
    "Génère la synthèse finale du CRBO selon les règles cliniques imposées par Laurie : points forts, difficultés identifiées, diagnostic au format strict (sans codes Fxxx), recommandations en phrase unique, axes thérapeutiques (max 4), aménagements scolaires (max 6), conclusion médico-légale, et reformulation pro des commentaires de domaine édités par l'ortho. AUCUNE section Comportement / Analyse croisée / Comorbidités / Réévaluation ne doit être produite — elles sont supprimées du CRBO.",
  input_schema: {
    type: 'object',
    required: [
      'points_forts', 'difficultes_identifiees',
      'diagnostic', 'recommandations', 'axes_therapeutiques',
      'pap_suggestions', 'conclusion', 'domain_commentaires',
    ],
    properties: {
      domain_commentaires: {
        type: 'array',
        description:
          "Commentaire FINAL professionnel pour CHAQUE domaine du bilan, dans le MÊME ordre que les domaines fournis en entrée. Reformule la textarea ortho (suggestion IA initiale + ajouts manuscrits) en prose pro fluide. Si textarea vide → commentaire court depuis les scores. RÈGLES ABSOLUES : aucun chiffre de percentile, aucune mention de rééducation/séances, aucun tiret en début de phrase, aucune mention de 'dyslexie/dysorthographie' (réservée au diagnostic). Toujours terminer par une phrase sur les répercussions concrètes scolaires/quotidiennes en cas de difficulté. Section Lecture spécifiquement : condenser de 30% mais GARDER les détails qualitatifs (régularisations sur mots irréguliers, autocorrections, lecture hachée, omissions). 3-4 lignes max.",
        items: {
          type: 'object',
          required: ['nom', 'commentaire'],
          properties: {
            nom: { type: 'string', description: 'Nom EXACT du domaine tel que reçu en entrée.' },
            commentaire: { type: 'string', description: 'Commentaire clinique reformulé pour ce domaine.' },
          },
        },
      },
      points_forts: {
        type: 'string',
        description:
          "Synthèse des compétences préservées (3-5 lignes max). Décrire en prose fluide professionnelle. JAMAIS mentionner la rééducation. Conséquences concrètes positives uniquement.",
      },
      difficultes_identifiees: {
        type: 'string',
        description:
          "Synthèse des difficultés observées (3-5 lignes max). Décrire en prose fluide. JAMAIS de chiffres de percentiles. JAMAIS le mot 'dyslexie/dysorthographie' (réservé au diagnostic). Toujours se terminer sur les conséquences concrètes scolaires et de la vie quotidienne pour l'élève.",
      },
      diagnostic: {
        type: 'string',
        description:
          "Diagnostic orthophonique au FORMAT STRICT imposé par Laurie : 'trouble spécifique des apprentissages en langage écrit (communément appelé dyslexie-dysorthographie), forme [légère / modérée / sévère / compensée]'. " +
          "TOUJOURS préciser la forme/sévérité. JAMAIS de codes CIM/DSM (F81.x, F90.x, etc.) — ni dans le diagnostic ni ailleurs. " +
          "Si un diagnostic associé est DÉJÀ POSÉ par un autre professionnel (TDAH par exemple), ajouter UNIQUEMENT en fin de diagnostic la phrase : 'Ce tableau s'inscrit dans un contexte de [diagnostic] préalablement diagnostiqué.' " +
          "JAMAIS de diagnostic hypothétique non confirmé. JAMAIS de section comorbidités séparée — si non posé, ne pas mentionner.",
      },
      recommandations: {
        type: 'string',
        description:
          "Phrase UNIQUE imposée Laurie : 'Une prise en charge orthophonique est recommandée, et en parallèle la mise en place ou le renforcement des aménagements en classe.' " +
          "JAMAIS de mention de réévaluation, de nouveau bilan, de délai, de fréquence de séances. JAMAIS d'orientation vers d'autres professionnels.",
      },
      axes_therapeutiques: {
        type: 'array',
        description:
          "Maximum 4 axes thérapeutiques numérotés (le numéro est ajouté automatiquement au rendu — n'écris PAS '1.' devant). 1 ligne par axe, sans détail des exercices. JAMAIS de mention d'autres professionnels. Exemple : 'Renforcement de la conscience phonologique et du décodage'.",
        items: { type: 'string' },
      },
      pap_suggestions: {
        type: 'array',
        description:
          "Maximum 6 aménagements scolaires, 1 par grande catégorie. Format OBLIGATOIRE : 'Catégorie : description concrète' (la catégorie + ' : ' + description, sans markdown ni tiret cadratin). Catégories autorisées : Temps, Évaluations, Outils numériques, Pédagogie, Environnement, Oral. " +
          "Adapter au profil — ne pas systématiquement remplir les 6. Restez généraux : pas de polices ni logiciels nominatifs.",
        items: { type: 'string' },
      },
      conclusion: {
        type: 'string',
        description: "Mention médico-légale standard (affichée en italique petit en bas) : 'Compte rendu remis en main propre à l'assuré(e) pour servir et faire valoir ce que de droit. (Copie au médecin prescripteur).'",
      },
      synthese_evolution: {
        type: ['object', 'null'],
        description: "Section comparative UNIQUEMENT pour les bilans de renouvellement, null pour les bilans initiaux.",
        properties: {
          resume: { type: 'string', description: "Synthèse narrative de l'évolution depuis le dernier bilan (100-300 mots)." },
          domaines_progres: { type: 'array', items: { type: 'string' } },
          domaines_stagnation: { type: 'array', items: { type: 'string' } },
          domaines_regression: { type: 'array', items: { type: 'string' } },
        },
      },
      reasoning_clinical: {
        type: 'object',
        description:
          "Raisonnement clinique structuré ayant conduit au diagnostic. Affiché à " +
          "l'orthophoniste sous un toggle 'Pourquoi cette conclusion ?' — construit " +
          "la confiance en désamorçant le côté 'boîte noire' de l'IA. Doit refléter " +
          "le raisonnement réel, pas un résumé du diagnostic.",
        properties: {
          indices_retenus: {
            type: 'array',
            description:
              "2 à 4 indices cliniques principaux qui orientent le diagnostic, formulés " +
              "comme des observations factuelles. Ex: 'Métaphonologie en difficulté sévère " +
              "(P5) → marqueur précurseur du décodage phonologique'. " +
              "AUCUN chiffre de percentile DANS le diagnostic narratif final, MAIS " +
              "autorisés ici car ce raisonnement reste interne — l'ortho l'ouvre " +
              "explicitement pour le voir.",
            items: { type: 'string' },
            minItems: 2,
            maxItems: 4,
          },
          dissociations: {
            type: 'array',
            description:
              "Dissociations cliniques notables qui orientent vers un sous-type. " +
              "Ex: 'Lecture de non-mots déficitaire + lecture de mots irréguliers " +
              "préservée → voie d'assemblage atteinte (profil phonologique)'. Tableau " +
              "vide si aucune dissociation marquante.",
            items: { type: 'string' },
          },
          sous_type: {
            type: ['string', 'null'],
            description:
              "Sous-type / forme du trouble retenu, si identifiable. Ex: 'phonologique', " +
              "'de surface', 'mixte', 'compensée'. null si pas de sous-type clair.",
          },
          contre_indices: {
            type: 'array',
            description:
              "Éléments du tableau qui POURRAIENT remettre en question le diagnostic " +
              "(transparence intellectuelle). Ex: 'Empan envers préservé → pas " +
              "d'argument fort pour TDA associé'. Tableau vide si tout converge.",
            items: { type: 'string' },
          },
        },
        required: ['indices_retenus'],
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
  /**
   * Décomposition hiérarchique de l'épreuve (MoCA principalement). Optionnel —
   * les tests percentile-based (Exalang…) ne l'utilisent pas.
   */
  sous_epreuves?: { nom: string; score: string }[]
  /**
   * Commentaire clinique par épreuve (MoCA — un commentaire par domaine
   * cognitif). Optionnel ; pour les autres tests, le commentaire reste au
   * niveau du domaine via CRBODomain.commentaire.
   */
  commentaire?: string
}

export interface CRBODomain {
  nom: string
  epreuves: CRBOEpreuve[]
  /** Commentaire qualitatif saisi par l'orthophoniste sur la page de visualisation (phase 1.5).
   *  Optionnel : peut être vide si l'ortho n'a rien noté. Affiché sous le tableau dans le Word. */
  commentaire: string
}

export type SeveriteGlobale = 'Léger' | 'Modéré' | 'Sévère' | null

/** Raisonnement clinique structuré affiché à l'ortho sous un toggle
 *  "Pourquoi cette conclusion ?". Construit la confiance en désamorçant
 *  le côté "boîte noire" de l'IA. */
export interface ReasoningClinical {
  /** 2-4 indices cliniques principaux qui orientent le diagnostic. */
  indices_retenus: string[]
  /** Dissociations cliniques notables (vide si aucune). */
  dissociations?: string[]
  /** Sous-type retenu (phonologique / surface / mixte / compensée…). */
  sous_type?: string | null
  /** Éléments qui pourraient remettre en cause le diagnostic. */
  contre_indices?: string[]
}

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
  /** Synthèse courte des points forts du patient (3-5 lignes). */
  points_forts: string
  /** Synthèse courte des difficultés identifiées (3-5 lignes). */
  difficultes_identifiees: string
  /** Diagnostic orthophonique au format imposé : "trouble spécifique des
   *  apprentissages en langage écrit (communément appelé dyslexie-dysorthographie),
   *  forme [légère/modérée/sévère/compensée]". JAMAIS de codes Fxxx. */
  diagnostic: string
  /** Phrase unique imposée Laurie. */
  recommandations: string
  /** Max 4 axes numérotés, 1 ligne chacun. */
  axes_therapeutiques: string[]
  /** Mention médico-légale (italique, en bas du Word). */
  conclusion: string
  /** Max 6 aménagements scolaires, format "Catégorie : description". */
  pap_suggestions: string[]
  /** Commentaires de domaine reformulés professionnellement (suggestion IA + notes ortho fusionnées). */
  domain_commentaires: { nom: string; commentaire: string }[]
  /** @deprecated — backend uniquement, plus rendu dans le Word. */
  severite_globale?: SeveriteGlobale
  /** @deprecated — section supprimée du Word, ne pas générer. */
  comorbidites_detectees?: string[]
  /** Renouvellements uniquement. */
  synthese_evolution?: SyntheseEvolution | null
  /** Raisonnement clinique structuré — affiché sous toggle "Pourquoi cette conclusion ?". */
  reasoning_clinical?: ReasoningClinical | null
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
  points_forts?: string
  difficultes_identifiees?: string
  axes_therapeutiques?: string[]
  /** @deprecated — backend uniquement. */
  severite_globale?: SeveriteGlobale
  /** @deprecated — section supprimée. */
  comorbidites_detectees?: string[]
  pap_suggestions?: string[]
  synthese_evolution?: SyntheseEvolution | null
  /** Raisonnement clinique structuré (optionnel — CRBO antérieurs n'en ont pas). */
  reasoning_clinical?: ReasoningClinical | null
  /**
   * Liste des champs CRBO que l'orthophoniste a explicitement édités sur la
   * page résultats (par opposition au draft IA brut). Utilisé par le Word
   * export pour surligner ces passages en bleu pâle, et par la preview pour
   * afficher un badge "édité".
   *
   * Valeurs possibles : "anamnese_redigee", "motif_reformule",
   * "domain_commentaire:<nom_domaine>" pour chaque commentaire de domaine.
   * Optionnel — CRBOs antérieurs n'ont pas ce champ.
   */
  edited_fields?: string[]
}
