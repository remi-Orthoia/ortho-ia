/**
 * Fixtures patients — payloads de test représentatifs pour valider le
 * pipeline de génération sur les profils cliniques les plus courants.
 *
 * Chaque fixture est un cas clinique typique d'un bilan donné, avec :
 *  - patient (prénom anonymisé TESTUSER, ddn cohérente avec la classe)
 *  - médecin fictif (TESTMEDECIN)
 *  - anamnèse riche en faits factuels (pour tester la règle 0 anti-suppression)
 *  - résultats au FORMAT NATIF du bilan (verdict N/P pour BETL, zones
 *    HappyNeuron pour PREDIMEM/PrediFex, classes 1-7 pour EVALEO, percentiles
 *    6 zones Laurie pour Exalang, etc.)
 *
 * Le test E2E (`e2e/api-pipeline.spec.ts`) envoie les `resultats` en texte
 * libre dans `resultats_manuels` — la phase extract de l'IA accepte ce
 * format et le structure.
 */

export interface CRBOFixture {
  id: string
  description: string
  patient: {
    prenom: string
    nom: string
    ddn: string
    classe: string
  }
  bilanDate: string
  bilanType: 'initial' | 'renouvellement'
  motif: string
  medecin: {
    prenom: string
    nom: string
    specialite: string
    datePrescription: string
  }
  anamnese: string
  testUtilise: string
  resultats: string
  comportementSeance?: string
  notesAnalyse?: string
}

// ============================================================================
// 6e — Exalang 11-15 (dyslexie compensée révélée à l'entrée collège)
// ============================================================================
export const FIXTURE_EXALANG_1115_DYSLEXIE: CRBOFixture = {
  id: 'exalang-11-15-dyslexie-6e',
  description: '6e dyslexie compensée révélée à l\'entrée collège (Exalang 11-15)',
  patient: { prenom: 'Hugo', nom: 'TESTUSER', ddn: '2014-09-15', classe: '6ème' },
  bilanDate: '2026-06-05',
  bilanType: 'initial',
  motif: 'Langage écrit',
  medecin: { prenom: 'Marie', nom: 'TESTMEDECIN', specialite: 'Pédiatre', datePrescription: '2026-05-15' },
  anamnese:
    "Hugo est adressé en consultation orthophonique pour difficultés persistantes en lecture-orthographe "
    + "depuis l'entrée en 6e. Aucun diagnostic posé au primaire. Bilan ORL et ophtalmologique récents normaux. "
    + "Pas d'antécédents familiaux connus de troubles des apprentissages. Bonne entrée dans le langage oral. "
    + "Au primaire, lecture lente notée par les enseignants. Décompensation observée à l'entrée 6e : lenteur, "
    + "fatigabilité, baisse des notes en français et histoire-géo. Estime de soi fragilisée.",
  testUtilise: 'Exalang 11-15',
  resultats:
    "=== Exalang 11-15 (Helloin, Lenfant, Thibault — HappyNeuron 2009) ===\n"
    + "Niveau scolaire : 6e\n\n"
    + "A.1 Langage oral\n"
    + "Fluence phonémique : P26 — P49 (Moyenne basse)\n"
    + "Fluence sémantique : P50 — P75 (Moyenne haute)\n"
    + "Compréhension orale de textes abstraits : P50 — P75 (Moyenne haute)\n"
    + "Dénomination rapide de mots complexes : P11 — P25 (Zone de fragilité) — manque du mot subclinique\n\n"
    + "A.2 Métaphonologie / phonologie complexe\n"
    + "Répétition de logatomes complexes : P6 — P10 (Difficulté) — trace résiduelle\n\n"
    + "B.1 Lecture\n"
    + "Lecture de mots fréquents : P26 — P49 (Moyenne basse)\n"
    + "Lecture de mots irréguliers : P11 — P25 (Zone de fragilité)\n"
    + "Lecture de non-mots : P6 — P10 (Difficulté) — paralexies, décodage analytique\n"
    + "Leximétrie en contexte : P1 — P5 (Difficulté sévère) — 105 mots/min (norme 6e 140-180)\n"
    + "Compréhension écrite inférentielle : P26 — P49 (Moyenne basse)\n\n"
    + "B.2 Orthographe / production écrite\n"
    + "Dictée de mots, phrases, texte : P11 — P25 (Zone de fragilité) — erreurs phono + homophones a/à\n"
    + "Production écrite narrative : P11 — P25 (Zone de fragilité)\n\n"
    + "C.1 Mémoire et fonctions exécutives\n"
    + "Empan auditif endroit : P26 — P49 (Moyenne basse)\n"
    + "Empan auditif envers : P11 — P25 (Zone de fragilité)",
  comportementSeance: "Hugo coopératif mais visiblement anxieux face aux épreuves écrites. Fatigabilité importante sur les épreuves chronométrées.",
}

// ============================================================================
// CE2 — EVALEO 6-15 (dyslexie phonologique pure, format Anne Frouard 7 classes)
// ============================================================================
export const FIXTURE_EVALEO_DYSLEXIE: CRBOFixture = {
  id: 'evaleo-6-15-dyslexie-ce2',
  description: 'CE2 dyslexie phonologique (profil Anne Frouard, EVALEO 6-15)',
  patient: { prenom: 'Léa', nom: 'TESTUSER', ddn: '2017-04-12', classe: 'CE2' },
  bilanDate: '2026-06-05',
  bilanType: 'initial',
  motif: 'Langage écrit',
  medecin: { prenom: 'Marie', nom: 'TESTMEDECIN', specialite: 'Pédiatre', datePrescription: '2026-05-15' },
  anamnese:
    "Léa est adressée pour difficultés persistantes en lecture-orthographe depuis le CP. Premier signalement "
    + "par l'enseignante au CP. Bilan ORL normal (audiogramme avril 2026). Vision contrôlée annuellement, port "
    + "de lunettes depuis 2024. Pas d'antécédents familiaux. Bonne entrée dans le langage oral (premiers mots "
    + "vers 14 mois). Difficultés de décodage installées au CE1, persistantes en CE2. Fatigabilité scolaire, "
    + "baisse de motivation pour la lecture, estime de soi fragilisée selon les parents.",
  testUtilise: 'EVALEO 6-15',
  resultats:
    "=== EVALEO 6-15 (Launay, Maeder, Roustit, Touzin — Ortho Édition 2018) ===\n"
    + "Niveau scolaire : CE2\n\n"
    + "Lecture identification\n"
    + "Lecture de mots : Classe 2 (Fragilité) — précision 38/40, temps Classe 2\n"
    + "Lecture de pseudomots : Classe 1 (Pathologique) — 18/30, décodage syllabe-syllabe\n\n"
    + "Métaphonologie\n"
    + "Métaphonologie : Classe 2 (Fragilité) — suppression phonémique très difficile\n\n"
    + "Production orthographe\n"
    + "Dictée de mots : Classe 2 (Fragilité)\n"
    + "Dictée de pseudomots : Classe 1 (Pathologique) — 8 erreurs ONPP, voie d'assemblage immature\n"
    + "Dictée de phrases : Classe 2 (Fragilité) — erreurs ONPP, OL, ODM dominantes\n\n"
    + "Mémoire CT verbale\n"
    + "Répétition de chiffres endroit : Classe 3 (Normalité basse)\n"
    + "Répétition de chiffres envers : Classe 2 (Fragilité)",
  comportementSeance: "Léa coopérative et attentive. Anxiété visible sur les épreuves de lecture. Stratégies d'évitement sur dictée pseudomots.",
}

// ============================================================================
// 5 ans — Exalang 3-6 (TDL émergent en grande section)
// ============================================================================
export const FIXTURE_EXALANG_36_TDL: CRBOFixture = {
  id: 'exalang-3-6-tdl-gs',
  description: 'GS TDL émergent + intelligibilité réduite (Exalang 3-6)',
  patient: { prenom: 'Mathéo', nom: 'TESTUSER', ddn: '2020-11-08', classe: 'GS' },
  bilanDate: '2026-06-05',
  bilanType: 'initial',
  motif: 'Langage oral',
  medecin: { prenom: 'Sophie', nom: 'TESTMEDECIN', specialite: 'Pédiatre', datePrescription: '2026-05-20' },
  anamnese:
    "Mathéo est adressé par sa pédiatre pour bilan orthophonique devant une intelligibilité réduite "
    + "et un retard de langage signalé par l'enseignante de grande section. Premiers mots tardifs (24 mois), "
    + "phrases vers 36 mois. ORL : otites séro-muqueuses récurrentes 2023-2024, drainages bilatéraux posés "
    + "septembre 2024, audiogramme actuel normal. Pas d'antécédents familiaux. Famille monolingue francophone. "
    + "Frère aîné sans difficultés. L'enseignante note des difficultés à se faire comprendre par les pairs "
    + "et un isolement social naissant.",
  testUtilise: 'Exalang 3-6',
  resultats:
    "=== Exalang 3-6 (Helloin, Lenfant, Thibault — HappyNeuron 2006) ===\n"
    + "Niveau scolaire : GS\n\n"
    + "Lexique réceptif (désignation) : P26 — P49 (Moyenne basse)\n"
    + "Lexique expressif (dénomination) : P6 — P10 (Difficulté) — manque du mot évident\n"
    + "Compréhension de phrases courtes : P11 — P25 (Zone de fragilité)\n"
    + "Production syntaxique : P1 — P5 (Difficulté sévère) — phrases courtes, omissions de mots\n"
    + "Répétition de mots et phrases : P6 — P10 (Difficulté)\n"
    + "Répétition de logatomes : P1 — P5 (Difficulté sévère) — simplifications phono importantes\n"
    + "Empan auditif endroit : P11 — P25 (Zone de fragilité) — empan 3\n"
    + "Rimes : P26 — P49 (Moyenne basse)\n"
    + "Syllabes (segmentation) : P11 — P25 (Zone de fragilité)\n"
    + "Conscience de l'écrit émergente : P26 — P49 (Moyenne basse)",
  comportementSeance: "Mathéo coopératif. Stratégies d'évitement en dénomination (montre du doigt, gestes). Intelligibilité réduite à ~60% pour un examinateur non familier.",
}

// ============================================================================
// CE1 — Exalang 5-8 (dyslexie en émergence)
// ============================================================================
export const FIXTURE_EXALANG_58_DYSLEXIE: CRBOFixture = {
  id: 'exalang-5-8-dyslexie-ce1',
  description: 'CE1 dyslexie phonologique en émergence (Exalang 5-8)',
  patient: { prenom: 'Inès', nom: 'TESTUSER', ddn: '2018-03-22', classe: 'CE1' },
  bilanDate: '2026-06-05',
  bilanType: 'initial',
  motif: 'Langage écrit',
  medecin: { prenom: 'Marc', nom: 'TESTMEDECIN', specialite: 'Pédiatre', datePrescription: '2026-05-12' },
  anamnese:
    "Inès est adressée pour difficultés persistantes en lecture-orthographe depuis le CP. Signalement par "
    + "l'enseignante de CP en mai 2025 (difficultés de décodage). Bilan ORL normal (mars 2026). Vision ok. "
    + "Pas d'antécédents familiaux connus. Premiers mots à 14 mois, phrases à 24 mois. Au CP, conscience "
    + "phonologique acquise tardivement. Au CE1, déchiffrage lent et imprécis, orthographe phonétiquement "
    + "plausible mais lacunaire en lexique orthographique. Fatigabilité importante en fin de journée.",
  testUtilise: 'Exalang 5-8',
  resultats:
    "=== Exalang 5-8 (Thibault, Helloin, Croteau — Orthomotus 2010) ===\n"
    + "Niveau scolaire : CE1\n\n"
    + "Langage oral\n"
    + "Compréhension orale de phrases : P50 — P75 (Moyenne haute)\n"
    + "Dénomination : P26 — P49 (Moyenne basse)\n"
    + "Fluence sémantique : P26 — P49 (Moyenne basse)\n\n"
    + "Métaphonologie\n"
    + "Comptage syllabique : P26 — P49 (Moyenne basse)\n"
    + "Segmentation-fusion syllabique : P11 — P25 (Zone de fragilité)\n"
    + "Inversion phonémique : P6 — P10 (Difficulté) — très difficile sur phonèmes complexes\n\n"
    + "Lecture\n"
    + "Lecture de mots : P11 — P25 (Zone de fragilité) — lente\n"
    + "Lecture de logatomes : P1 — P5 (Difficulté sévère) — paralexies, décodage très laborieux\n"
    + "Lecture de texte : P6 — P10 (Difficulté)\n\n"
    + "Mémoire de travail\n"
    + "Empan de chiffres endroit : P11 — P25 (Zone de fragilité) — empan 4\n"
    + "Répétition de logatomes : P6 — P10 (Difficulté)\n\n"
    + "Orthographe\n"
    + "Closure de mots : P11 — P25 (Zone de fragilité)\n"
    + "Transcription de logatomes : P1 — P5 (Difficulté sévère) — voie d'assemblage immature",
  comportementSeance: "Inès coopérative, persévérante. Conduites d'approche en lecture, autocorrection partielle. Fatigabilité notable en fin de séance.",
}

// ============================================================================
// CM2 — Exalang 8-11 (dyslexie phonologique avérée, profil 1)
// ============================================================================
export const FIXTURE_EXALANG_811_DYSLEXIE: CRBOFixture = {
  id: 'exalang-8-11-dyslexie-cm2',
  description: 'CM2 dyslexie phonologique (profil 1 Coltheart, Exalang 8-11)',
  patient: { prenom: 'Lucas', nom: 'TESTUSER', ddn: '2014-09-15', classe: 'CM2' },
  bilanDate: '2026-06-05',
  bilanType: 'initial',
  motif: 'Langage écrit',
  medecin: { prenom: 'Marie', nom: 'TESTMEDECIN', specialite: 'Pédiatre', datePrescription: '2026-05-15' },
  anamnese:
    "Lucas est adressé pour difficultés persistantes en lecture-orthographe. Premier signalement par "
    + "l'enseignante en CE1. Aucun antécédent ORL. Pas d'antécédents familiaux. Bonne entrée dans le langage "
    + "oral. Difficultés de décodage installées en CE2, persistant en CM1 et CM2. Fatigabilité scolaire notée "
    + "par les parents. Estime de soi en baisse, refus progressif de la lecture du soir.",
  testUtilise: 'Exalang 8-11',
  resultats:
    "=== Exalang 8-11 (Helloin, Lenfant, Thibault — HappyNeuron 2012) ===\n"
    + "Niveau scolaire : CM2\n\n"
    + "A.1 Langage oral\n"
    + "Compréhension orale de phrases : P50 — P75 (Moyenne haute)\n"
    + "Compréhension orale de textes : P50 — P75 (Moyenne haute)\n"
    + "Fluence sémantique : P26 — P49 (Moyenne basse)\n\n"
    + "A.2 Métaphonologie\n"
    + "Suppression phonémique : P6 — P10 (Difficulté) — erreurs systématiques sur phonèmes complexes\n\n"
    + "B.1 Lecture\n"
    + "Lecture de mots fréquents : P11 — P25 (Zone de fragilité)\n"
    + "Lecture de mots irréguliers : P26 — P49 (Moyenne basse)\n"
    + "Lecture de non-mots : P1 — P5 (Difficulté sévère) — paralexies marquées, marqueur central\n"
    + "Leximétrie : P6 — P10 (Difficulté) — 92 mots/min (norme CM2 130-160)\n\n"
    + "B.2 Orthographe\n"
    + "DRA : P6 — P10 (Difficulté) — erreurs phonologiques dominantes\n\n"
    + "C.1 Mémoire\n"
    + "Empan auditif endroit : P11 — P25 (Zone de fragilité)\n"
    + "Répétition de logatomes : P6 — P10 (Difficulté)",
  comportementSeance: "Lucas coopératif, attentif. Fatigabilité notable sur les épreuves écrites. Stratégies d'évitement en fin de séance.",
}

// ============================================================================
// Terminale — Exalang Lyfac (dyslexie compensée, lecteur lent)
// ============================================================================
export const FIXTURE_EXALANG_LYFAC: CRBOFixture = {
  id: 'exalang-lyfac-compensee-terminale',
  description: 'Terminale dyslexie compensée, lenteur de lecture (Exalang Lyfac)',
  patient: { prenom: 'Sarah', nom: 'TESTUSER', ddn: '2009-01-20', classe: 'Terminale' },
  bilanDate: '2026-06-05',
  bilanType: 'initial',
  motif: 'Langage écrit',
  medecin: { prenom: 'Anne', nom: 'TESTMEDECIN', specialite: 'Médecin traitant', datePrescription: '2026-05-10' },
  anamnese:
    "Sarah est adressée pour bilan orthophonique en vue d'aménagements au Baccalauréat. Dyslexie diagnostiquée "
    + "en CE2 (2018), PAP en place depuis le CM1. Suivi orthophonique intensif 2018-2022, allégé à 1 séance/15j "
    + "depuis. Bilan WISC-V à 8 ans (QITT 110, profil hétérogène avec IRT et IMT déficitaires). Études "
    + "scientifiques (TS), envisage prépa scientifique. Plainte principale : lenteur de lecture qui rend "
    + "difficile la gestion du temps aux épreuves. Fatigabilité en fin de journée.",
  testUtilise: 'Exalang Lyfac',
  resultats:
    "=== Exalang Lyfac (Thibault & Lenfant — Motus 2014) ===\n"
    + "Niveau : Terminale\n\n"
    + "L.1 Lecture\n"
    + "Lecture de mots : P50 — P75 (Moyenne haute) — précision OK\n"
    + "Lecture de logatomes : P11 — P25 (Zone de fragilité) — trace résiduelle\n"
    + "Leximétrie : P6 — P10 (Difficulté) — 195 mots/min (norme 250-300)\n\n"
    + "L.2 Compréhension écrite\n"
    + "Compréhension de texte argumentatif : P26 — P49 (Moyenne basse)\n"
    + "Repérage d'anaphores : P26 — P49 (Moyenne basse)\n\n"
    + "L.3 Orthographe\n"
    + "Texte à choix multiple : P26 — P49 (Moyenne basse)\n"
    + "Complétion de phrases : P26 — P49 (Moyenne basse)\n"
    + "Synthèse orthographique : Note Standard 2/5 (en deçà de la moyenne)\n\n"
    + "L.4 Mémoire et raisonnement\n"
    + "Empan endroit : P26 — P49 (Moyenne basse) — empan 5\n"
    + "Empan envers : P11 — P25 (Zone de fragilité)\n"
    + "Raisonnement analogique : P50 — P75 (Moyenne haute)",
  comportementSeance: "Sarah présente, mature. Conscience claire de ses difficultés. Anxiété par rapport au Bac et à la prépa.",
}

// ============================================================================
// 68 ans — BETL (aphasie post-AVC, profil aphasie vasculaire)
// ============================================================================
export const FIXTURE_BETL_APHASIE: CRBOFixture = {
  id: 'betl-aphasie-vasculaire-68a',
  description: '68 ans aphasie post-AVC sylvien gauche (BETL profil 1 vasculaire)',
  patient: { prenom: 'Robert', nom: 'TESTUSER', ddn: '1958-02-14', classe: 'adulte' },
  bilanDate: '2026-06-05',
  bilanType: 'initial',
  motif: 'Cognitif',
  medecin: { prenom: 'Jean', nom: 'TESTMEDECIN', specialite: 'Neurologue', datePrescription: '2026-05-25' },
  anamnese:
    "Monsieur TESTUSER, 68 ans, droitier, ancien artisan menuisier (NSC 1). Adressé en consultation "
    + "orthophonique 3 mois après un AVC ischémique sylvien gauche (mars 2026). Atteinte initiale : aphasie "
    + "non-fluente avec anomie marquée. Hospitalisation 3 semaines en neurologie, prise en charge orthophonique "
    + "ambulatoire débutée à la sortie. Latéralité droite. Pas d'antécédents familiaux notables. Examen "
    + "neurologique actuel : hémiparésie droite résolutive, négligence non. État dépressif réactionnel modéré. "
    + "Plainte principale (et de l'épouse) : manque du mot persistant en conversation, frustration.",
  testUtilise: 'BETL',
  resultats:
    "=== BETL (Tran & Godefroy — Ortho Édition 2015) ===\n"
    + "Stratification : tranche d'âge 65-79 ans × NSC 1\n\n"
    + "Épreuves (Score /54, verdict N/P) :\n"
    + "I. Dénomination orale d'images : 32/54 (P) — paraphasies sémantiques (chat → chien) et formelles\n"
    + "II. Désignation d'images : 49/54 (N)\n"
    + "III. Appariement sémantique d'images : 46/54 (N)\n"
    + "IV. Lecture à voix haute : 38/54 (P) — paralexies, lenteur\n"
    + "V. Désignation de mots écrits : 50/54 (N)\n"
    + "VI. Appariement sémantique de mots écrits : 47/54 (N)\n"
    + "VII. Dénomination écrite d'images : 28/54 (P) — score orthographique 30/54 (P)\n"
    + "VIII. Questionnaire sémantique : non passée (état dépressif, fatigabilité)\n\n"
    + "Indices cliniques transversaux :\n"
    + "Ébauche orale : EFFICACE (facilitation par premier phonème → récupération mot-cible)\n"
    + "Comportements (Annexe 1) : paraphasies sémantiques dominantes, conduites d'approche formelles fréquentes, modalisations 'c'est sur le bout de la langue'\n"
    + "Profil discours (Annexe 2) : discours fluide globalement mais ralenti, manque du mot fréquent, recherches lexicales, conscience du trouble préservée, stratégies de circonlocution efficaces.",
  comportementSeance: "Monsieur TESTUSER coopératif, lucide sur ses difficultés. Fatigabilité notable en fin de séance. Épreuve VIII non administrée pour préserver la coopération.",
}

// ============================================================================
// 72 ans — PREDIMEM (plainte mnésique, profil mémoire de travail)
// ============================================================================
export const FIXTURE_PREDIMEM: CRBOFixture = {
  id: 'predimem-mdt-72a',
  description: '72 ans plainte mnésique avec fragilité MdT (PREDIMEM)',
  patient: { prenom: 'Mireille', nom: 'TESTUSER', ddn: '1954-08-30', classe: 'adulte' },
  bilanDate: '2026-06-05',
  bilanType: 'initial',
  motif: 'Cognitif',
  medecin: { prenom: 'Sylvie', nom: 'TESTMEDECIN', specialite: 'Médecin traitant', datePrescription: '2026-05-18' },
  anamnese:
    "Madame TESTUSER, 72 ans, droitière, ancienne enseignante (NSC 3). Adressée par son médecin traitant "
    + "devant des plaintes mnésiques depuis 18 mois, signalées par son mari et sa fille (oublis fréquents "
    + "de conversations récentes, répétitions, difficultés à retrouver des objets quotidiens). Pas "
    + "d'antécédents neurologiques. Pas d'antécédents familiaux de démence. Vit avec son époux, autonome "
    + "pour les actes de la vie quotidienne. Conduite automobile poursuivie sans accident. État dépressif "
    + "modéré récent (deuil de sa sœur, octobre 2025). Bilan biologique récent normal. Demande de bilan "
    + "neuropsychologique posée par le médecin pour orientation diagnostique.",
  testUtilise: 'PREDIMEM',
  resultats:
    "=== PREDIMEM (Duchêne & Jaillard — HappyNeuron 2019) ===\n"
    + "Stratification : 70-74 ans × NSC 3\n\n"
    + "Épreuves (zone HappyNeuron, scores sigma):\n"
    + "1. Mémoire d'objets (encodage incident) : Vert clair (M-1σ)\n"
    + "2. Mémoire d'un texte lu : Jaune (M-1,5σ, seuil d'alerte)\n"
    + "3. Mise à jour MdT : Orange (M-2σ) — boucle phonologique et administrateur central fragilisés\n"
    + "4. Blasons (mémoire visuelle) : Vert clair\n"
    + "5. Tangram : Vert foncé\n"
    + "6. Associations sémantiques : Vert clair\n"
    + "7. Mémoire d'un texte entendu : Jaune\n"
    + "8. Formes : Vert foncé\n"
    + "9. Mémoire auditive (sons) : Vert clair\n"
    + "10. Mémoire spatiale : Vert clair\n"
    + "11. Visages : Jaune (seuil d'alerte, oublis fréquents en MdLT visuel)\n\n"
    + "Comportements : Madame TESTUSER consciente de ses difficultés, autocorrection partielle, stratégies de répétition spontanées.",
  comportementSeance: "Mme TESTUSER coopérative, vigilance soutenue, fatigabilité notable sur les épreuves longues (MdT). Note l'effet de la séance prolongée sur ses performances.",
}

// ============================================================================
// 75 ans — PrediFex (fragilité exécutive subtile, suspicion MCI)
// ============================================================================
export const FIXTURE_PREDIFEX: CRBOFixture = {
  id: 'predifex-fragilite-exec-75a',
  description: '75 ans fragilité exécutive subtile, suspicion MCI (PrediFex)',
  patient: { prenom: 'Bernard', nom: 'TESTUSER', ddn: '1951-05-10', classe: 'adulte' },
  bilanDate: '2026-06-05',
  bilanType: 'initial',
  motif: 'Cognitif',
  medecin: { prenom: 'Pierre', nom: 'TESTMEDECIN', specialite: 'Neurologue', datePrescription: '2026-05-22' },
  anamnese:
    "Monsieur TESTUSER, 75 ans, droitier, ancien cadre commercial (NSC 3). Adressé par son neurologue suite "
    + "à une plainte d'organisation et de planification depuis ~12 mois. L'épouse signale une moindre "
    + "anticipation des tâches domestiques, des oublis de rendez-vous, une lenteur dans la gestion "
    + "administrative. Pas d'antécédents neurologiques. Pas d'AVC connu. IRM cérébrale récente : "
    + "leucoaraïose modérée fronto-pariétale, atrophie hippocampique discrète. Pas d'antécédents familiaux "
    + "de démence. Autonome pour les actes de la vie quotidienne. Le neurologue suspecte une atteinte "
    + "fronto-sous-corticale débutante et demande le bilan exécutif PrediFex.",
  testUtilise: 'PrediFex',
  resultats:
    "=== PrediFex (Duchêne & Jaillard — HappyNeuron 2019) ===\n"
    + "Stratification : 75-79 ans × NSC 3\n\n"
    + "Épreuves (zone HappyNeuron, 4 zones):\n"
    + "1. Fluences alternées : Jaune (M-1,5σ, seuil d'alerte) — flexibilité altérée\n"
    + "2. Texte à mettre en ordre : Orange (M-2σ) — planification narrative déficitaire\n"
    + "3. Textes exécutifs : Jaune — compréhension OK, gestion temporelle problématique\n"
    + "4. Syllabe sur deux : Vert (norme)\n"
    + "5. Mise à jour MdT (chiffres+syllabes) : Jaune — fragilité MdT exécutive\n"
    + "6. Problème arithmétique : Vert\n"
    + "7. Problème de Luria : Jaune — stratégies de résolution rigides\n"
    + "8. Sudofex : Orange — mise à jour de la grille difficile\n"
    + "9. Équivalences sémantiques : Vert clair\n"
    + "10. Closure inférentielle : Vert\n\n"
    + "Comportements : Monsieur TESTUSER lucide sur ses difficultés, frustration palpable sur les épreuves de planification. Stratégies de compensation tentées mais peu efficaces.",
  comportementSeance: "Mr TESTUSER coopératif, dignité notable. Fatigabilité après 45 min, demande de pause. Frustration sur épreuves exécutives.",
}

// ============================================================================
// CM1 — Examath (dyscalculie procédurale)
// ============================================================================
export const FIXTURE_EXAMATH: CRBOFixture = {
  id: 'examath-dyscalculie-cm1',
  description: 'CM1 dyscalculie procédurale (Examath 8-15)',
  patient: { prenom: 'Tom', nom: 'TESTUSER', ddn: '2015-12-03', classe: 'CM1' },
  bilanDate: '2026-06-05',
  bilanType: 'initial',
  motif: 'Maths',
  medecin: { prenom: 'Hélène', nom: 'TESTMEDECIN', specialite: 'Pédiatre', datePrescription: '2026-05-14' },
  anamnese:
    "Tom est adressé pour difficultés persistantes en mathématiques. Premier signalement par l'enseignante "
    + "au CE2 (mai 2024). Bilan orthophonique langage : effectué en CP, sans atteinte. Pas d'antécédents "
    + "familiaux. Bonne entrée dans le langage oral. À l'oral, les notions mathématiques sont comprises ; "
    + "les difficultés apparaissent dans la mise en œuvre procédurale (poses d'opérations, gestion des "
    + "retenues, mémorisation des tables). Fatigabilité scolaire, refus progressif des devoirs de maths. "
    + "L'enseignante remarque que Tom comprend les énoncés à l'oral mais commet des erreurs systématiques "
    + "en calcul écrit.",
  testUtilise: 'Examath',
  resultats:
    "=== Examath 8-15 (Lafay & Helloin — HappyNeuron 2016) ===\n"
    + "Niveau scolaire : CM1\n\n"
    + "Module 1 : Habiletés numériques de base\n"
    + "Subitizing : P50 — P75 (Moyenne haute)\n"
    + "Comparaison analogique de collections : P26 — P49 (Moyenne basse)\n"
    + "Comparaison de nombres écrits : P50 — P75 (Moyenne haute)\n"
    + "Ligne numérique : P26 — P49 (Moyenne basse)\n\n"
    + "Module 2 : Numération\n"
    + "Transcodage : P11 — P25 (Zone de fragilité) — confusions lexicales et syntaxiques\n"
    + "Décomposition canonique : P11 — P25 (Zone de fragilité)\n\n"
    + "Module 3 : Arithmétique\n"
    + "Faits numériques : P6 — P10 (Difficulté) — tables non automatisées\n"
    + "Calcul mental : P6 — P10 (Difficulté)\n"
    + "Calcul posé : P1 — P5 (Difficulté sévère) — erreurs procédurales massives (retenues, alignement)\n\n"
    + "Module 4 : Mesures\n"
    + "Conversions : P11 — P25 (Zone de fragilité)\n\n"
    + "Module 5 : Résolution de problèmes\n"
    + "Problème simple : P26 — P49 (Moyenne basse) — comprend l'énoncé mais erreurs de calcul\n"
    + "Problème composé : P6 — P10 (Difficulté)\n\n"
    + "Module 6 : Langage et raisonnement\n"
    + "Vocabulaire mathématique : P50 — P75 (Moyenne haute)\n"
    + "Raisonnement verbal : P50 — P75 (Moyenne haute)",
  comportementSeance: "Tom coopératif, comprend bien les consignes orales. Compte sur les doigts persistant. Anxiété sur le calcul posé, demande à passer à l'oral. Fatigabilité importante sur le module 3.",
}

/** Toutes les fixtures disponibles — accessibles par ID. */
export const FIXTURES: Record<string, CRBOFixture> = {
  [FIXTURE_EXALANG_1115_DYSLEXIE.id]: FIXTURE_EXALANG_1115_DYSLEXIE,
  [FIXTURE_EVALEO_DYSLEXIE.id]: FIXTURE_EVALEO_DYSLEXIE,
  [FIXTURE_EXALANG_36_TDL.id]: FIXTURE_EXALANG_36_TDL,
  [FIXTURE_EXALANG_58_DYSLEXIE.id]: FIXTURE_EXALANG_58_DYSLEXIE,
  [FIXTURE_EXALANG_811_DYSLEXIE.id]: FIXTURE_EXALANG_811_DYSLEXIE,
  [FIXTURE_EXALANG_LYFAC.id]: FIXTURE_EXALANG_LYFAC,
  [FIXTURE_BETL_APHASIE.id]: FIXTURE_BETL_APHASIE,
  [FIXTURE_PREDIMEM.id]: FIXTURE_PREDIMEM,
  [FIXTURE_PREDIFEX.id]: FIXTURE_PREDIFEX,
  [FIXTURE_EXAMATH.id]: FIXTURE_EXAMATH,
}
