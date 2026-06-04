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
      description:
        "Interprétation clinique COURTE — la nomenclature dépend du test utilisé. " +
        "Par DÉFAUT (Exalang, BETL, Examath, EVALO, BALE, etc.) — grille 6 zones imposée Laurie (refonte 2026-05-ter) : " +
        "'Excellent' pour P76-P100 ; " +
        "'Moyenne haute' pour P50-P75 (Q3 inclus) ; " +
        "'Moyenne basse' pour P26-P49 ; " +
        "'Zone de fragilité' pour P11-P25 (Q1 = P25 inclus) ; " +
        "'Difficulté' pour P6-P10 ; " +
        "'Difficulté sévère' pour P1-P5 (Exalang n'affiche JAMAIS de bande <P5). " +
        "EXCEPTION EVALEO 6-15 — utiliser la grille officielle 7 classes Launay et al. 2018 : " +
        "'Classe 1 - Pathologique' (<P7) ; " +
        "'Classe 2 - Fragilité' (P7-P20) ; " +
        "'Classe 3 - Norme' / 'Classe 4 - Norme' / 'Classe 5 - Norme' (P21-P38 / P39-P62 / P63-P80, totalisent 60 % de la population) ; " +
        "'Classe 6 - Supérieure à la moyenne' (P81-P93) ; " +
        "'Classe 7 - Très supérieure' (>P93). " +
        "EXCEPTION MoCA — laisser '' (le rendu Word MoCA n'affiche pas de colonne Interprétation par épreuve). " +
        "EXCEPTION B-CM / B-CMado — laisser '' (rendu math pastilles qualitatives, pas de percentile). " +
        "EXCEPTION HappyNeuron sigma-based (PREDIMEM, PrediFex, PrediLac) — utiliser le vocabulaire HappyNeuron, PAS la grille Laurie 6 zones : 'performance préservée' (zone Vert ≥ M − 1,5σ), 'performance dans la moyenne basse, à surveiller' (zone Vert clair — PREDIMEM uniquement, M − 1σ à M − 1,5σ, n'existe pas en PrediFex/PrediLac), 'fragilité objectivée (seuil d'alerte)' (zone Jaune M − 1,5σ à M − 2σ), 'difficulté avérée' (zone Orange M − 2σ à M − 3σ), 'effondrement' (zone Rouge < M − 3σ). Le module prompt de chaque bilan donne les règles exactes — les surclasser sur cette consigne générique en cas de doute.",
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
        "Commentaire clinique DÉDIÉ pour cette épreuve spécifique (2-3 phrases, ≈ 30-50 mots). " +
        "**OBLIGATOIRE si percentile_value < 50** (épreuve 'dans le rouge', en dessous de la médiane) — " +
        "le commentaire décrit qualitativement la performance et son retentissement fonctionnel concret " +
        "(en classe, en lecture, en compréhension). Rendu dans le CRBO sous la forme " +
        "« **Nom épreuve** — commentaire » juste après le tableau du domaine. " +
        "Pour MoCA (scoring hiérarchique), utilisé pour chaque domaine cognitif. " +
        "Vide ('') pour les épreuves avec percentile_value >= 50 (couvertes par le commentaire de domaine).",
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
      'pap_suggestions', 'bilans_complementaires', 'conclusion', 'domain_commentaires',
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
          "Phrase imposée Laurie, VERBATIM, une seule phrase : " +
          "'Une prise en charge orthophonique est recommandée, et en parallèle la mise en place ou le renforcement des aménagements en classe.' " +
          "Refonte 2026-06-05 : la mention AMO a été déplacée vers le champ `conclusion` (où elle s'affiche dans le Word, alors que ce champ `recommandations` reste retiré du rendu par décision Laurie 2026-05). NE PAS ajouter l'AMO ici. " +
          "JAMAIS de mention de réévaluation, fréquence séances, orientation, ni paragraphe d'analyse. " +
          "Pour un bilan de renouvellement, le format ne change PAS.",
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
          "Maximum 6 aménagements scolaires, 1 par grande catégorie. Format OBLIGATOIRE : 'Catégorie : description concrète' (la catégorie + ' : ' + description, sans markdown ni tiret cadratin). Catégories autorisées : Temps, Évaluations, Outils numériques, Pédagogie, Environnement, Oral, Valorisation. " +
          "Adapter au profil — ne pas systématiquement remplir les 6. Restez généraux : pas de polices ni logiciels nominatifs. " +
          "RÈGLE TEMPS : toute mention de 'temps majoré' / 'tiers-temps' / 'temps supplémentaire' DOIT inclure dans la même phrase 'et/ou réduire la quantité de données à traiter sur le temps imparti' (alternative équivalente). " +
          "RÈGLE VALORISATION : TOUJOURS inclure un item de catégorie 'Valorisation' sur l'estime de soi — valoriser/féliciter les efforts et les progrès pour soutenir la motivation. " +
          "Exemples : 'Temps : temps majoré aux évaluations écrites, et/ou réduire la quantité de données à traiter sur le temps imparti', 'Valorisation : valoriser et féliciter régulièrement les efforts fournis, mettre en avant les progrès pour soutenir l'estime de soi et la motivation'.",
        items: { type: 'string' },
      },
      bilans_complementaires: {
        type: 'array',
        description:
          "Orientations vers d'autres bilans pluridisciplinaires, **CONDITIONNEL** (0 à 4 items max). Inclure UNIQUEMENT si au moins un indice clinique du tableau justifie l'orientation — JAMAIS systématiquement. Liste VIDE [] si le bilan ne montre aucune comorbidité ni dissociation appelant un autre regard professionnel. " +
          "Format STRICT par item : 'Catégorie : justification clinique courte (1 ligne, ~15-25 mots) qui pointe l'indice du bilan'. " +
          "**Catégories AUTORISÉES (enfant/scolaire — Exalang, EVALEO, BETL pédiatrique, B-CM/B-CMado, etc.)** : 'Neuropsychologie' (suspicion TDAH, fonctions exécutives, attention/mémoire de travail effondrée < P10, fatigabilité majeure), 'Psychomotricité' (troubles graphiques, motricité fine/globale, latéralité, dyspraxie), 'Neurovisuel' (empan visuo-attentionnel déficitaire, suspicion DVS, hypothèses TVA), 'Orthoptie' (bilan langage écrit sans bilan visuel récent, troubles oculomoteurs, copie déficitaire), 'Ergothérapie' (compensation manuelle/numérique, dysgraphie sévère, adaptation matériel), 'ORL' (audition non vérifiée + déficit phonologique ou comprehension auditive, otites séro-muqueuses récidivantes), 'Pédopsychiatrie' (signaux dépressifs/anxieux, troubles de l'attachement, suspicion TSA), 'CRTLA / Centre référent' (profil TDL sévère, comorbidités multiples à coordonner). " +
          "**Catégories AUTORISÉES (adulte — PREDIMEM, PrediFex, PrediLac, BETL adulte, BIA, BECD)** : 'Neurologie' (profil convergent évoquant atteinte neurologique débutante — démence frontotemporale, Parkinson cognitif, lésions sous-corticales, à explorer par consultation spécialisée + imagerie), 'Gériatrie / Consultation mémoire' (sujet > 60 ans avec fragilités convergentes, orientation prioritaire), 'Neuropsychologie' (profil exécutif/mnésique nécessitant un bilan approfondi — TMT, WCST, Stroop, RL/RI 16, BEM 144, figure de Rey, etc.), 'ORL / audiologie adulte' (fragilité dominante sur épreuves auditives sans audiométrie récente, presbyacousie), 'Psychiatrie adulte / psychologue clinicien' (éléments dépressifs/anxieux susceptibles d'expliquer le tableau — pseudo-démence dépressive à éliminer), 'Médecine du travail' (sujet en activité avec plainte impactant le poste de travail). " +
          "RÈGLES ABSOLUES : (1) chaque item DOIT pointer un indice concret du bilan dans la justification (ex: 'empan envers déficitaire'). (2) NE PAS lister 'bilan psychométrique / WISC' ici sauf si lié à TDAH ou TSA — sinon c'est dans recommandations. (3) NE PAS recommander un autre orthophoniste ni un re-bilan orthophonique. (4) Liste TRIÉE par priorité clinique (le plus pertinent en premier). (5) **JAMAIS mélanger catégories enfant et adulte sur un même CRBO** — utiliser la liste enfant pour les bilans enfant et la liste adulte pour les bilans adulte (la nature du bilan dicte le périmètre). " +
          "Exemples enfant : ['Neuropsychologie : empan envers à P5 + fatigabilité marquée + fluences déficitaires → suspicion de trouble exécutif / TDAH à explorer.', 'Orthoptie : bilan visuel à actualiser, leximétrie déficitaire pouvant aussi traduire un trouble oculomoteur associé.']. " +
          "Exemples adulte : ['Neurologie / Consultation mémoire : profil de fragilité d\\'encodage convergent sur 3 épreuves + temps allongés — à caractériser par bilan neuropsychologique approfondi et imagerie cérébrale.', 'Psychiatrie adulte : signaux dépressifs subjectifs notés en anamnèse, à éliminer comme cause de la plainte cognitive avant toute conclusion étiologique.'].",
        items: { type: 'string' },
      },
      conclusion: {
        type: 'string',
        description:
          "Champ conclusion = 1 OU 2 paragraphes séparés par une ligne vide (\\n\\n) — refonte 2026-06-05. " +
          "PARAGRAPHE 1 (CONDITIONNEL, nomenclature) : si le module impose une nomenclature, écris UNE seule phrase courte (2 lignes max). " +
          "🔒 CODES PAR BILAN — UTILISER UNIQUEMENT le code de la liste ci-dessous, JAMAIS inventer un code voisin : " +
          "* Exalang 3-6 / 5-8 / 8-11 / 11-15 / Lyfac → 'AMO 8.4 (rééducation des troubles du langage écrit)' OU 'AMO 9.4 (rééducation des troubles du langage oral)' selon profil dominant. " +
          "* Examath, B-CM, B-CMado → 'AMO 11.7 (rééducation des troubles spécifiques des apprentissages — cognition mathématique)'. JAMAIS 12.6 / 11.4 / 12.1 — la cotation est UNIQUEMENT 11.7 (verbatim). " +
          "* BETL pédiatrique → 'AMO 8.4' ou '9.4' selon profil. " +
          "* EVALEO 6-15 → ⚠️ EXCEPTION : EVALEO utilise la grille NGAP propre (PAS la grille AMO 8.4/9.4). " +
          "  Codes EVALEO : 'AMO 12,1' (dyslexie/dysorthographie) / 'AMO 13,5' (TDL ou TDL+dyslexie) / 'AMO 13,8' (trouble neurologique sévère) / 'AMO 10,1' (surveillance). " +
          "  Format EVALEO : 'La prise en charge orthophonique est cotée selon la NGAP AMO [code] ([libellé]).' " +
          "OMETTRE cette phrase pour les bilans adulte (PREDIMEM, PrediFex, PrediLac, BETL adulte, BIA, BECD, MoCA) — pas de nomenclature pour la cognition adulte. " +
          "PARAGRAPHE 2 (OBLIGATOIRE, médico-légal, VERBATIM) : " +
          "'Compte rendu remis en main propre à l\\'assuré(e) pour servir et faire valoir ce que de droit. (Copie au médecin prescripteur).' " +
          "Pour les bilans avec nomenclature : 2 paragraphes (nomenclature + \\n\\n + formule juridique). Pour les bilans sans nomenclature : 1 seul paragraphe (formule juridique). " +
          "Le rendu Word affiche le paragraphe nomenclature en taille normale (gauche), le paragraphe juridique en italique petit gris centré.",
      },
      synthese_evolution: {
        type: ['object', 'null'],
        description: "Section comparative UNIQUEMENT pour les bilans de renouvellement, null pour les bilans initiaux.",
        properties: {
          resume: {
            type: 'string',
            description:
              "UNE SEULE phrase introductive TRÈS COURTE (10-25 mots max) qui caractérise globalement l'évolution depuis le bilan précédent. " +
              "Ex : 'Le bilan de contrôle met en évidence une évolution globalement favorable.' ou 'Évolution mitigée, avec des progrès en lecture mais une stagnation persistante en orthographe.' " +
              "INTERDIT : plus d'une phrase, chiffres de percentile, mention de rééducation passée. Les détails ligne-par-ligne vont dans les listes domaines_progres / stagnation / regression — le résumé est juste une accroche.",
          },
          domaines_progres: {
            type: 'array',
            items: { type: 'string' },
            description:
              "Liste de bullets COURTS (5-15 mots chacun) — un item par épreuve / domaine en progrès depuis le bilan précédent. " +
              "Ex : 'Boucle phonologique : passage de difficulté sévère à zone de fragilité'. Vide [] si aucun progrès objectif.",
          },
          domaines_stagnation: {
            type: 'array',
            items: { type: 'string' },
            description:
              "Liste de bullets COURTS (5-15 mots chacun) — un item par épreuve / domaine qui stagne (même niveau d'interprétation qu'au bilan précédent). " +
              "Ex : 'Orthographe lexicale : maintien des erreurs phonologiquement plausibles'. Vide [] si aucune stagnation à signaler.",
          },
          domaines_regression: {
            type: 'array',
            items: { type: 'string' },
            description:
              "Liste de bullets COURTS (5-15 mots chacun) — un item par épreuve / domaine en régression. " +
              "Ex : 'Empan auditif : passage de moyenne à zone de fragilité'. Vide [] si aucune régression.",
          },
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
    "Produit un Compte Rendu de Bilan Orthophonique (CRBO) structuré complet en une seule passe. Utilisé pour les flows legacy et les scripts de test ; le flow nominal en prod utilise EXTRACT_CRBO_TOOL puis SYNTHESIZE_TOOL.",
  input_schema: {
    type: 'object',
    required: [
      'anamnese_redigee', 'motif_reformule', 'domains',
      'points_forts', 'difficultes_identifiees',
      'diagnostic', 'recommandations', 'axes_therapeutiques',
      'conclusion', 'pap_suggestions', 'bilans_complementaires',
    ],
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
      points_forts: _synthesizeProps.points_forts as any,
      difficultes_identifiees: _synthesizeProps.difficultes_identifiees as any,
      diagnostic: _synthesizeProps.diagnostic as any,
      recommandations: _synthesizeProps.recommandations as any,
      axes_therapeutiques: _synthesizeProps.axes_therapeutiques as any,
      conclusion: _synthesizeProps.conclusion as any,
      severite_globale: _synthesizeProps.severite_globale as any,
      comorbidites_detectees: _synthesizeProps.comorbidites_detectees as any,
      pap_suggestions: _synthesizeProps.pap_suggestions as any,
      bilans_complementaires: _synthesizeProps.bilans_complementaires as any,
      synthese_evolution: _synthesizeProps.synthese_evolution as any,
      reasoning_clinical: _synthesizeProps.reasoning_clinical as any,
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
   * Commentaire clinique DÉDIÉ par épreuve. Rempli par l'IA pour :
   *  - chaque épreuve avec `percentile_value < 50` ("dans le rouge") —
   *    rendu sous forme de paragraphe « **Nom épreuve** — commentaire »
   *    juste après le tableau du domaine (Word + PDF + preview UI) ;
   *  - chaque domaine cognitif MoCA (scoring hiérarchique).
   * Vide pour les épreuves >= P50 (couvertes par le commentaire de domaine).
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
  /** Orientations bilans complémentaires (neuropsy / psychomot / neurovisuel / orthoptie / ergothérapie / ORL / pédopsy / CRTLA), 0-4 items. Conditionnel : liste vide si aucune comorbidité observée. Format "Catégorie : justification clinique courte". */
  bilans_complementaires: string[]
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
  /** Orientations bilans complémentaires (neuropsy / psychomot / neurovisuel / etc.), 0-4 items. Conditionnel — peut être vide pour les CRBO sans comorbidité. CRBO antérieurs au champ : valeur undefined. */
  bilans_complementaires?: string[]
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
