/**
 * Fixtures patients — payloads de test représentatifs pour valider le
 * pipeline de génération sur les profils cliniques les plus courants.
 *
 * Chaque fixture est un cas clinique typique, calibré pour exercer une
 * branche spécifique des prompts (langage écrit primaire, langage écrit
 * collège, langage oral préscolaire, adulte/aphasie, etc.).
 *
 * Ajout d'une fixture : déclarer un nouvel objet avec un ID stable, le
 * patient + bilan + résultats. Le test E2E (`e2e/pipeline.spec.ts`) la
 * pickera via son ID.
 */

export interface CRBOFixture {
  id: string
  description: string
  patient: {
    prenom: string
    nom: string
    ddn: string           // ISO yyyy-mm-dd
    classe: string
  }
  bilanDate: string       // ISO yyyy-mm-dd
  bilanType: 'initial' | 'renouvellement'
  motif: string           // CSV des chips ("Langage écrit, Cognitif")
  medecin: {
    prenom: string
    nom: string
    specialite: string
    datePrescription: string  // ISO
  }
  anamnese: string
  testUtilise: string     // doit matcher TESTS_OPTIONS de @/lib/types
  /** Texte qui sera collé dans resultats_manuels (l'IA en phase extract
   *  reconnaitra les épreuves + percentiles à partir de ce texte). */
  resultats: string
  comportementSeance?: string
  notesAnalyse?: string
}

/** Cas typique CM2 — bilan langage écrit avec Exalang 8-11.
 *  Profil dyslexie phonologique modérée : non-mots P5, lecture mots
 *  fréquents P25, métaphonologie suppression P10. */
export const FIXTURE_EXALANG_811_DYSLEXIE: CRBOFixture = {
  id: 'exalang-8-11-dyslexie-cm2',
  description: 'CM2 dyslexie phonologique modérée (profil 1 Coltheart)',
  patient: {
    prenom: 'Lucas',
    nom: 'TESTUSER',
    ddn: '2014-09-15',
    classe: 'CM2',
  },
  bilanDate: '2026-06-04',
  bilanType: 'initial',
  motif: 'Langage écrit',
  medecin: {
    prenom: 'Marie',
    nom: 'TESTMEDECIN',
    specialite: 'Pédiatre',
    datePrescription: '2026-05-15',
  },
  anamnese:
    "Lucas est adressé pour difficultés persistantes en lecture-orthographe. "
    + "Premier signalement par l'enseignante en CE1. Aucun antécédent ORL. "
    + "Pas d'antécédents familiaux connus. Bonne entrée dans le langage oral. "
    + "Difficultés de décodage installées en CE2, persistant en CM1 et CM2. "
    + "Fatigabilité scolaire notée par les parents. Estime de soi en baisse.",
  testUtilise: 'Exalang 8-11',
  resultats:
    "=== Exalang 8-11 (Helloin, Lenfant, Thibault — HappyNeuron 2012) ===\n"
    + "Niveau scolaire : CM2 (~10-11 ans)\n\n"
    + "--- A.1 Langage oral ---\n"
    + "Épreuve : Compréhension orale de phrases\n"
    + "  Percentile : P50 — P75 — Moyenne haute\n"
    + "Épreuve : Compréhension orale de textes\n"
    + "  Percentile : P50 — P75 — Moyenne haute\n"
    + "Épreuve : Fluence sémantique (animaux, 1 min)\n"
    + "  Percentile : P26 — P49 — Moyenne basse\n\n"
    + "--- A.2 Métaphonologie ---\n"
    + "Épreuve : Métaphonologie — suppression phonémique\n"
    + "  Percentile : P6 — P10 — Difficulté\n"
    + "  Observation : Erreurs systématiques sur suppression de phonèmes complexes.\n\n"
    + "--- B.1 Lecture ---\n"
    + "Épreuve : Lecture de mots fréquents\n"
    + "  Percentile : P11 — P25 — Zone de fragilité\n"
    + "Épreuve : Lecture de mots irréguliers\n"
    + "  Percentile : P26 — P49 — Moyenne basse\n"
    + "Épreuve : Lecture de non-mots (logatomes écrits)\n"
    + "  Percentile : P1 — P5 — Difficulté sévère\n"
    + "  Observation : Décodage analytique très lent, paralexies fréquentes.\n"
    + "Épreuve : Leximétrie (vitesse de lecture en contexte)\n"
    + "  Percentile : P6 — P10 — Difficulté\n\n"
    + "--- B.2 Orthographe ---\n"
    + "Épreuve : DRA — Dictée de Rédaction Abrégée\n"
    + "  Percentile : P6 — P10 — Difficulté\n"
    + "  Observation : Dominante erreurs phonologiques (omissions, substitutions de phonèmes).\n\n"
    + "--- C.1 Mémoire ---\n"
    + "Épreuve : Empan auditif endroit\n"
    + "  Percentile : P11 — P25 — Zone de fragilité\n"
    + "Épreuve : Répétition de logatomes\n"
    + "  Percentile : P6 — P10 — Difficulté\n",
  comportementSeance:
    "Lucas est coopératif·ve, attentif aux consignes. Fatigabilité notable sur les épreuves écrites. "
    + "Stratégies d'évitement observées en fin de séance (demande pour aller aux toilettes).",
}

/** Cas typique CE2 — bilan langage écrit avec EVALEO 6-15.
 *  Profil dyslexie phonologique modérée + fragilité métaphonologique.
 *  Active la grille 7 classes officielle EVALEO (vs 6 zones Exalang),
 *  format Anne Frouard (décret 2002-721) au diagnostic. */
export const FIXTURE_EVALEO_DYSLEXIE: CRBOFixture = {
  id: 'evaleo-6-15-dyslexie-ce2',
  description: 'CE2 dyslexie phonologique (profil Anne Frouard, EVALEO 6-15)',
  patient: {
    prenom: 'Léa',
    nom: 'TESTUSER',
    ddn: '2017-04-12',
    classe: 'CE2',
  },
  bilanDate: '2026-06-04',
  bilanType: 'initial',
  motif: 'Langage écrit',
  medecin: {
    prenom: 'Marie',
    nom: 'TESTMEDECIN',
    specialite: 'Pédiatre',
    datePrescription: '2026-05-15',
  },
  anamnese:
    "Léa est adressée pour difficultés persistantes en lecture-orthographe depuis "
    + "le CP. Premier signalement par l'enseignante au CP-CE1. Bilan ORL normal "
    + "(audiogramme avril 2026). Vision contrôlée annuellement, port de lunettes "
    + "depuis 2024. Pas d'antécédents familiaux connus de troubles des apprentissages. "
    + "Bonne entrée dans le langage oral (premiers mots vers 14 mois). "
    + "Difficultés de décodage installées au CE1, persistantes en CE2. "
    + "Fatigabilité scolaire notée, baisse de motivation pour la lecture. "
    + "Estime de soi fragilisée selon les parents.",
  testUtilise: 'EVALEO 6-15',
  resultats:
    "=== EVALEO 6-15 (Launay, Maeder, Roustit, Touzin — Ortho Édition 2018) ===\n"
    + "Niveau scolaire : CE2 (~8-9 ans)\n\n"
    + "--- Lecture identification ---\n"
    + "Épreuve : Lecture de mots\n"
    + "  Classe : 2 — Fragilité\n"
    + "  Score : précision 38/40, temps classe 2\n"
    + "Épreuve : Lecture de pseudomots\n"
    + "  Classe : 1 — Pathologique\n"
    + "  Score : 18/30\n"
    + "  Observation : Décodage analytique, paralexies, lecture syllabe-syllabe.\n\n"
    + "--- Métaphonologie ---\n"
    + "Épreuve : Métaphonologie\n"
    + "  Classe : 2 — Fragilité\n"
    + "  Observation : Suppression phonémique très difficile.\n\n"
    + "--- Production orthographe ---\n"
    + "Épreuve : Dictée de mots\n"
    + "  Classe : 2 — Fragilité\n"
    + "Épreuve : Dictée de pseudomots\n"
    + "  Classe : 1 — Pathologique\n"
    + "  Observation : 8 erreurs ONPP (omission notation phonologique), voie d'assemblage très immature.\n"
    + "Épreuve : Dictée de phrases\n"
    + "  Classe : 2 — Fragilité\n"
    + "  Observation : Erreurs ONPP, OL (orthographe lexicale) et ODM dominantes.\n\n"
    + "--- Mémoire CT verbale ---\n"
    + "Épreuve : Répétition de chiffres endroit\n"
    + "  Classe : 3 — Normalité basse\n"
    + "Épreuve : Répétition de chiffres envers\n"
    + "  Classe : 2 — Fragilité\n",
  comportementSeance:
    "Léa est coopérative et attentive. Anxiété visible sur les épreuves de lecture. "
    + "Stratégies d'évitement observées (demande de pause sur dictée pseudomots).",
}

/** Toutes les fixtures disponibles — accessibles par ID. */
export const FIXTURES: Record<string, CRBOFixture> = {
  [FIXTURE_EXALANG_811_DYSLEXIE.id]: FIXTURE_EXALANG_811_DYSLEXIE,
  [FIXTURE_EVALEO_DYSLEXIE.id]: FIXTURE_EVALEO_DYSLEXIE,
}
