/**
 * 5 profils de test cliniquement documentés pour valider la qualité
 * du CRBO généré par Claude. Chaque profil contient un formData complet
 * prêt à être envoyé à /api/generate-crbo.
 *
 * Objectif : vérifier que Claude
 *  - rédige une anamnèse fluide en prose (pas de notes brutes)
 *  - interprète correctement les percentiles (Q1=P25=Normal)
 *  - pose le bon diagnostic différentiel
 *  - propose des recommandations concrètes et adaptées (PAP/PPS/MDPH/RQTH)
 *  - articule les liens inter-domaines
 */

export interface TestProfile {
  id: string
  label: string
  hypothese_clinique: string
  formData: {
    ortho_nom: string
    ortho_adresse: string
    ortho_cp: string
    ortho_ville: string
    ortho_tel: string
    ortho_email: string
    patient_prenom: string
    patient_nom: string
    patient_ddn: string
    patient_classe: string
    bilan_date: string
    bilan_type: string
    medecin_nom: string
    medecin_tel: string
    motif: string
    anamnese: string
    test_utilise: string[]
    resultats_manuels: string
    notes_passation: string
  }
}

const ORTHO_BASE = {
  ortho_nom: 'Marie DURAND',
  ortho_adresse: '12 rue de la République',
  ortho_cp: '69001',
  ortho_ville: 'Lyon',
  ortho_tel: '04 72 00 00 00',
  ortho_email: 'marie.durand@ortho-test.fr',
}

export const TEST_PROFILES: TestProfile[] = [
  // =============================================================
  // PROFIL 1 — Dyslexie phonologique pure (Exalang 8-11, CE2)
  // =============================================================
  {
    id: 'dyslexie-phono',
    label: 'Dyslexie phonologique (CE2, fille 8 ans)',
    hypothese_clinique:
      "Déficit marqué voie d'assemblage + métaphonologie. Voie d'adressage préservée.",
    formData: {
      ...ORTHO_BASE,
      patient_prenom: 'Léa',
      patient_nom: 'MARTIN',
      patient_ddn: '2017-09-15',
      patient_classe: 'CE2',
      bilan_date: '2026-04-20',
      bilan_type: 'initial',
      medecin_nom: 'Dr Bernard LEROY',
      medecin_tel: '04 72 11 22 33',
      motif:
        "Difficultés persistantes en lecture et orthographe signalées par l'enseignante de CE2 depuis la rentrée. Fatigabilité accrue en fin de journée scolaire. Parents inquiets car l'aînée a le même profil.",
      anamnese:
        "marche 14m / premiers mots 22m / phrases 3 ans / CP : difficultés démarrage lecture / CE1 : redoublement évité mais soutien APC / aîné dyslexique diagnostiqué / audio-visuel ok / pas de trouble relationnel / aime le dessin et les jeux de société / fatigabilité scolaire importante surtout l'après-midi / maman fait répéter les leçons tous les soirs",
      test_utilise: ['Exalang 8-11'],
      resultats_manuels: `# Mémoire de travail
Empan auditif endroit : 5/7, É-T : -0.8, Q1 (P25)
Empan auditif envers : 3/6, É-T : -0.9, Q1 (P25)
Répétition de logatomes : 12/20, É-T : -1.65, P5

# Métaphonologie
Acronymes : 5/10, É-T : -1.4, P10
Rimes : 6/10, É-T : -1.1, P15
Suppression phonémique : 4/10, É-T : -1.85, P3

# Fluences
Fluence phonémique : 9/20, É-T : -0.85, Q1 (P25)
Fluence sémantique : 14/20, É-T : -0.25, Med (P50)

# Lecture
Lecture de mots fréquents : 28/30, É-T : -0.3, Med (P50)
Lecture de mots irréguliers : 24/30, É-T : -0.75, Q1 (P25)
Lecture de non-mots : 14/30, É-T : -1.75, P5
Leximétrie (CE2) : 58 mots/min, É-T : -1.55, P7

# Langage écrit — production
DRA orthographe lexicale : 12/20, É-T : -1.3, P10
DRA orthographe grammaticale : 8/15, É-T : -1.15, Q1 (P25)
Closure de texte : 15/20, É-T : -0.55, Med (P50)`,
      notes_passation:
        'Bilan en 2 séances de 45 min. Bonne coopération, Léa est appliquée. Pleurs lors de la dictée quand elle voit qu\'elle ne connaît pas l\'orthographe. Fatigabilité nette en fin de chaque séance.',
    },
  },

  // =============================================================
  // PROFIL 2 — Dyslexie mixte + TDA suspect (Exalang 11-15, 6e)
  // =============================================================
  {
    id: 'dyslexie-mixte-tda',
    label: 'Dyslexie mixte + TDA (6e, garçon 12 ans)',
    hypothese_clinique:
      "Les deux voies de lecture touchées + signaux TDA (empan envers très faible, fluences, fatigabilité, attention)",
    formData: {
      ...ORTHO_BASE,
      patient_prenom: 'Lucas',
      patient_nom: 'DUBOIS',
      patient_ddn: '2014-02-10',
      patient_classe: '6ème',
      bilan_date: '2026-04-20',
      bilan_type: 'initial',
      medecin_nom: 'Dr Claire MORIN',
      medecin_tel: '04 72 33 44 55',
      motif:
        "Passage en 6e catastrophique : moyenne générale 8/20, difficultés majeures en français, histoire, SVT. Enseignant·e·s signalent inattention, agitation, devoirs non faits. Parents épuisés.",
      anamnese:
        "fils unique / grossesse normale / développement psychomoteur dans la norme mais bébé très agité / CP : lecture acquise tardivement (fin CE1) / CE2 : signalé pour agitation mais jamais bilan / CM : baisse des notes progressive, redoublement refusé par les parents / 6e impossible : 4 convocations en 3 mois / pratique le foot 2x/semaine, calme dans ce contexte / conflit fréquent avec le père sur les devoirs / mère au foyer épuisée / aucun bilan psy / audio/visuel ok",
      test_utilise: ['Exalang 11-15'],
      resultats_manuels: `# Mémoire de travail
Empan auditif endroit : 4/7, É-T : -1.4, P10
Empan auditif envers : 2/6, É-T : -2.1, P2
Répétition de logatomes complexes : 8/20, É-T : -2.3, P2

# Fluences
Fluence phonémique (P, 1min) : 6 mots, É-T : -2.1, P3
Fluence sémantique (animaux, 1min) : 11 mots, É-T : -1.6, P5

# Lecture
Lecture de mots fréquents : 24/30, É-T : -1.45, P10
Lecture de mots irréguliers : 14/30, É-T : -2.1, P3
Lecture de non-mots : 11/30, É-T : -2.35, P2
Leximétrie (6e) : 82 mots/min, É-T : -2.5, P2

# Compréhension écrite
Compréhension inférentielle : 8/20, É-T : -1.85, P5
Closure de texte complexe : 10/20, É-T : -1.5, P10

# Production écrite
DRA orthographe lexicale : 6/20, É-T : -2.1, P3
DRA orthographe grammaticale : 4/15, É-T : -1.85, P5
Production écrite narrative : récit pauvre 45 mots, écart sévère

# Raisonnement verbal
Analogies : 4/12, É-T : -1.3, P10`,
      notes_passation:
        'Bilan très difficile à mener : Lucas se lève, fait autre chose, répond vite pour "finir". Fatigabilité majeure dès 20 min. A fallu 3 séances (vs 2 habituel). Semble intelligent dans les conversations libres, mais ne peut pas soutenir l\'effort attentionnel. Comportement d\'évitement : "de toute façon je suis nul".',
    },
  },

  // =============================================================
  // PROFIL 3 — Dyscalculie développementale (Examath, CM1)
  // =============================================================
  {
    id: 'dyscalculie',
    label: 'Dyscalculie développementale (CM1, fille 10 ans)',
    hypothese_clinique:
      'Déficit central du sens du nombre. Géométrie préservée. Pas de dyslexie associée.',
    formData: {
      ...ORTHO_BASE,
      patient_prenom: 'Emma',
      patient_nom: 'PETIT',
      patient_ddn: '2016-06-20',
      patient_classe: 'CM1',
      bilan_date: '2026-04-20',
      bilan_type: 'initial',
      medecin_nom: 'Dr Paul GARNIER',
      medecin_tel: '04 72 99 88 77',
      motif:
        "Enseignante signale des difficultés majeures et persistantes en mathématiques depuis le CP. Emma compte encore sur ses doigts au CM1. Lecture et compréhension normales.",
      anamnese:
        "3e enfant fratrie / parents ingénieurs / langage oral dans la norme / lecture acquise au CP sans difficulté majeure / CE1 : premières difficultés mathématiques, comptage sur doigts / CE2 : échec aux évaluations de numération / CM1 : incapacité à poser une soustraction avec retenue / aime lire, dessine beaucoup, très créative / audio/visuel ok / pas de bilan psy / soutien scolaire en maths depuis le CE2 sans progrès notable",
      test_utilise: ['Examath'],
      resultats_manuels: `# Cognition numérique de base
Subitizing : 6/10, É-T : -1.6, P5
Comparaison grandeurs symboliques : 18/30, É-T : -1.85, P3
Comparaison grandeurs non-symboliques (points) : 14/30, É-T : -2.1, P2

# Transcodage
Chiffres → mots : 14/20, É-T : -0.8, Q1 (P25)
Mots → chiffres : 11/20, É-T : -1.65, P5
Lecture de nombres : 16/25, É-T : -1.25, P10

# Calcul mental et posé
Additions simples : 8/15, É-T : -1.5, P7
Soustractions avec retenue : 3/10, É-T : -2.1, P3
Tables de multiplication : 4/20, É-T : -2.3, P2

# Résolution de problèmes
Problèmes simples à 1 étape : 4/10, É-T : -1.85, P5
Problèmes à étapes : 1/8, É-T : -2.2, P2

# Estimation
Estimation ligne 0-100 : erreur moyenne 18 points, É-T : -1.85, P5

# Géométrie (épargnée)
Reproduction figure simple : 9/10, É-T : 0.25, Med (P50)
Reproduction figure complexe : 15/20, É-T : -0.3, Med (P50)`,
      notes_passation:
        'Bilan en 2 séances. Emma participe bien mais dit "je suis nulle en maths" plusieurs fois. Compte sur les doigts systématiquement, même pour 2+3. Blocage émotionnel visible sur les énoncés de problèmes. Excellente sur la géométrie, travail soigné et précis.',
    },
  },

  // =============================================================
  // PROFIL 4 — TDL / retard langage (Exalang 5-8 + ELO, CP)
  // =============================================================
  {
    id: 'tdl-retard-langage',
    label: 'TDL suspecté (CP, garçon 6 ans)',
    hypothese_clinique:
      "Atteinte langage oral réceptif et expressif. Lexique et morphosyntaxe touchés. Potentiel TDL (dysphasie).",
    formData: {
      ...ORTHO_BASE,
      patient_prenom: 'Tom',
      patient_nom: 'ROUSSEAU',
      patient_ddn: '2020-01-15',
      patient_classe: 'CP',
      bilan_date: '2026-04-20',
      bilan_type: 'initial',
      medecin_nom: 'Dr Sophie LAMBERT',
      medecin_tel: '04 72 55 66 77',
      motif:
        "CP très difficile : Tom ne suit pas les consignes orales en classe, parle peu, lecture non démarrée. Maîtresse évoque un possible trouble du langage. Parents préoccupés depuis la maternelle mais n'osaient pas faire de bilan.",
      anamnese:
        "aîné fratrie 2 enfants / grossesse normale / marche 16m / premiers mots 24m (maman inquiète dès 18m) / phrases à 3,5 ans / PS : peu de mots, vocabulaire restreint / MS : orthophoniste évoquée mais parents différent / GS : meilleure intégration mais langage pauvre / à la maison : comprend mieux qu'il ne parle mais demande souvent de répéter / père anglophone (bilinguisme possible comme facteur ?) / otites à répétition 2-4 ans, drains posés à 5 ans / audio ok depuis drains / pas de plainte ophtalmologique",
      test_utilise: ['Exalang 5-8', 'ELO'],
      resultats_manuels: `# Langage oral — réceptif (Exalang 5-8)
Compréhension orale de phrases : 12/20, É-T : -1.85, P5
Compréhension morphosyntaxique : 8/15, É-T : -2.05, P3
Lexique en réception : 22/40, É-T : -1.65, P5
Désignation sur définition : 10/20, É-T : -1.75, P5

# Langage oral — expressif
Dénomination d'images : 14/30, É-T : -1.9, P3
Répétition de mots : 18/25, É-T : -1.2, P10

# Phonologie
Répétition de logatomes : 8/20, É-T : -2.3, P2
Empan auditif endroit : 3/6, É-T : -1.5, P7

# Métaphonologie
Rimes : 4/10, É-T : -1.7, P5
Syllabes (segmentation) : 5/10, É-T : -1.55, P7
Conscience phonémique : 2/10, É-T : -2.0, P3

# Lecture émergente (CP)
Lecture de lettres : 18/26, É-T : -1.55, P7
Lecture de syllabes simples : 3/15, É-T : -2.1, P3
Lecture de mots : 0/10, écart sévère

# Compléments ELO
Expression morphosyntaxique : 6/15, É-T : -1.9, P3
Récit d'image : pauvre, 5 phrases simples`,
      notes_passation:
        "Bilan en 3 séances. Tom est doux, coopératif, mais on voit bien qu'il ne comprend pas toujours les consignes. Il fait souvent répéter. Parle peu, phrases courtes et parfois agrammaticales. Bonne volonté mais fatigabilité rapide. Résultats très en deçà de l'attendu en CP.",
    },
  },

  // =============================================================
  // PROFIL 5 — Senior, suspicion trouble cognitif (MoCA + BETL)
  // =============================================================
  {
    id: 'senior-cognitif',
    label: 'Suspicion trouble cognitif (senior 72 ans, MoCA + BETL)',
    hypothese_clinique:
      "Profil compatible avec trouble cognitif léger (TCL) ou début de démence. Manque du mot, temps de dénomination allongés, mémoire mnésique altérée.",
    formData: {
      ...ORTHO_BASE,
      patient_prenom: 'Jacques',
      patient_nom: 'BERNARD',
      patient_ddn: '1954-03-10',
      patient_classe: 'Adulte',
      bilan_date: '2026-04-20',
      bilan_type: 'initial',
      medecin_nom: 'Dr Véronique CHEVALIER (gériatre)',
      medecin_tel: '04 72 78 90 12',
      motif:
        "Plainte mnésique progressive depuis 18 mois. Oublis de rendez-vous, recherche des mots dans les conversations, a renoncé à conduire seul. Épouse inquiète. Adressé par la gériatre consultation mémoire.",
      anamnese:
        "ancien cadre ingénieur retraité depuis 7 ans / scolarité Bac+5 / marié 2 enfants adultes / autonomie : encore autonome pour les AVQ simples mais épouse prend en charge l'administratif depuis 1 an / hypertension traitée / hypercholestérolémie traitée / pas d'AVC connu / pas de chute / audition : appareillé bilatéral depuis 5 ans / vision : DMLA débutante suivie / loisirs : jardinage, lecture en diminution progressive / humeur : tristesse notée par l'épouse, parfois irritable, sommeil fragmenté",
      test_utilise: ['MoCA', 'BETL'],
      resultats_manuels: `# MoCA (screening cognitif) — score global
Score brut : 22/30 (niveau d'étude >12 ans, pas d'ajustement)
Interprétation : Trouble cognitif léger suspecté

# MoCA — sous-scores par domaine
Fonctions visuo-exécutives (Trail B, cube, horloge) : 3/5, É-T : -1.2, P10
Dénomination (lion, rhinocéros, chameau) : 2/3, —, échec rhinocéros
Attention (répétition chiffres endroit/envers, série A, 100-7) : 4/6, É-T : -1.4, P7
Langage (répétition de phrases, fluence P/1min = 8 mots) : 2/3, —
Abstraction : 1/2, —
Rappel différé 5 mots : 2/5, É-T : -1.85, P5
Orientation (date/lieu) : 6/6

# BETL (langage adulte)
Dénomination orale (exactitude) : 32/40, É-T : -1.4, P10
Dénomination orale (temps moyen) : 2.8 sec/item, É-T : -1.85, P5
Fluence catégorielle (animaux, 1min) : 10 mots, É-T : -1.65, P5
Fluence phonémique (P, 1min) : 7 mots, É-T : -1.85, P5
Appariement sémantique : 18/20, É-T : -0.5, Med (P50)
Répétition de phrases : 8/10, É-T : -1.1, Q1 (P25)
Lecture à voix haute : préservée, 95/100, Med (P50)
Compréhension écrite : 12/15, É-T : -1.2, P10
Dictée de phrases : 14/20, É-T : -1.25, P10`,
      notes_passation:
        'Bilan en 2 séances. Monsieur Bernard coopératif mais fatigabilité nette. Plusieurs recherches de mots observées dans le discours spontané ("cette chose qui…"). Paraphasies sémantiques (hippopotame au lieu de rhinocéros). Manque du mot à plusieurs reprises. Épouse confirme perte progressive d\'autonomie cognitive depuis 18 mois.',
    },
  },
]
