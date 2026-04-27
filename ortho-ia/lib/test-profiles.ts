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
    notes_analyse: string
    comportement_seance?: string
    duree_seance_minutes?: number
    evolution_notes?: string
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
      notes_analyse:
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
      notes_analyse:
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
      notes_analyse:
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
      notes_analyse:
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
      notes_analyse:
        'Bilan en 2 séances. Monsieur Bernard coopératif mais fatigabilité nette. Plusieurs recherches de mots observées dans le discours spontané ("cette chose qui…"). Paraphasies sémantiques (hippopotame au lieu de rhinocéros). Manque du mot à plusieurs reprises. Épouse confirme perte progressive d\'autonomie cognitive depuis 18 mois.',
    },
  },

  // =============================================================
  // PROFIL 6 — Retard simple langage (EVALO 2-6, MS 4 ans)
  // =============================================================
  {
    id: 'retard-simple-ms',
    label: 'Retard simple de langage (MS, garçon 4 ans)',
    hypothese_clinique:
      "Performances globalement sous la norme mais enfant évolutif, pas de trouble spécifique. Guidance + réévaluation 6 mois.",
    formData: {
      ...ORTHO_BASE,
      patient_prenom: 'Hugo',
      patient_nom: 'DELAUNAY',
      patient_ddn: '2022-02-15',
      patient_classe: 'MS',
      bilan_date: '2026-04-20',
      bilan_type: 'initial',
      medecin_nom: 'Dr Marie LAURENT',
      medecin_tel: '04 72 15 16 17',
      motif:
        "Maîtresse de MS signale un langage pauvre, phrases courtes, vocabulaire limité par rapport aux pairs. Pas d'inquiétude majeure, demande un avis orthophonique.",
      anamnese:
        "cadet fratrie 2 / grossesse normale / marche 14m / premiers mots 22m / phrases 3 ans / aîné 7 ans lecture OK / parents présents stimulants / otites à répétition drains à 2 ans / audio OK depuis / vision OK / frère à la maison, souvent livres et jeux / écrans limités",
      test_utilise: ['EVALO 2-6'],
      resultats_manuels: `# Communication précoce
Attention conjointe : préservée
Pointage : préservé
Tours de parole : adaptés

# Langage oral - réceptif
Désignation (lexique récep.) : P20, É-T -0.85
Compréhension consignes simples : P25, É-T -0.65

# Langage oral - expressif
Dénomination : P15, É-T -1.1
Production syntaxique : P15, É-T -1.15

# Phonologie
Répétition mots : P20, É-T -0.9
Répétition logatomes : P15, É-T -1.05

# Métaphonologie (émergente)
Rimes : P25, É-T -0.7`,
      notes_analyse:
        'Bilan en 1 séance de 40 min. Hugo coopératif mais timide. Phrases courtes, syntaxe simple. Interaction adaptée. Pas de trouble articulatoire majeur.',
    },
  },

  // =============================================================
  // PROFIL 7 — Dyslexie compensée au collège (Exalang 11-15, 5e)
  // =============================================================
  {
    id: 'dyslexie-compensee-5e',
    label: 'Dyslexie compensée collège (5e, garçon 13 ans)',
    hypothese_clinique:
      "Dyslexie diagnostiquée en CM1, PAP en place. Trace résiduelle visible, aménagements pour le Brevet à discuter.",
    formData: {
      ...ORTHO_BASE,
      patient_prenom: 'Théo',
      patient_nom: 'ROSSI',
      patient_ddn: '2013-06-10',
      patient_classe: '5ème',
      bilan_date: '2026-04-20',
      bilan_type: 'renouvellement',
      medecin_nom: 'Dr Paul GARNIER',
      medecin_tel: '01 42 99 88 77',
      motif:
        "Bilan de renouvellement pour ajuster le PAP et anticiper les aménagements pour les épreuves du Brevet. PEC orthophonique allégée depuis 2 ans. Moyenne générale 14/20 au collège, difficultés persistantes en orthographe et en langues vivantes.",
      anamnese:
        "dyslexie diagnostiquée CM1 / PAP en place / PEC orthophonique hebdo CE2-CM2, puis 1/15j depuis 6e / classe europe pour anglais compensé par bon oral / aime sport et histoire / famille coopérante / audio/visuel OK",
      test_utilise: ['Exalang 11-15'],
      resultats_manuels: `# Mémoire de travail
Empan endroit : 5/7, É-T -0.4, Med (P50)
Empan envers : 4/6, É-T -0.3, Med (P50)

# Lecture
Lecture mots fréquents : 29/30, É-T 0.1, Med (P50)
Lecture mots irréguliers : 27/30, É-T -0.5, Med (P50)
Lecture non-mots : 24/30, É-T -0.9, Q1 (P25)
Leximétrie 5e : 145 mots/min, É-T -0.8, Q1 (P25)

# Compréhension écrite
Compréhension inférentielle : 16/20, É-T -0.25, Med (P50)

# Orthographe
DRA lexicale : 14/20, É-T -1.15, P15
DRA grammaticale : 11/15, É-T -0.85, Q1 (P25)
Production écrite : correct, syntaxe riche`,
      notes_analyse:
        'Bilan 45 min. Théo à l\'aise, bon oral, stratégies métacognitives développées. Conscient de ses difficultés, demande aménagements Brevet. Fatigabilité à la fin.',
      // Simule une anamnèse déjà pré-remplie depuis le dernier bilan
      evolution_notes: "Progrès nets en lecture depuis le dernier bilan il y a 2 ans. Vitesse de lecture désormais dans la norme. Orthographe reste le point faible résiduel. Stratégies métacognitives bien installées.",
    },
  },

  // =============================================================
  // PROFIL 8 — OMF / Déglutition atypique (CE1, 7 ans)
  // =============================================================
  {
    id: 'omf-deglutition',
    label: 'Déglutition atypique + sigmatisme (CE1, fille 7 ans)',
    hypothese_clinique:
      "Déglutition primaire infantile persistante avec interposition linguale, sigmatisme interdental. Orthodontie à venir.",
    formData: {
      ...ORTHO_BASE,
      patient_prenom: 'Sarah',
      patient_nom: 'BENSAID',
      patient_ddn: '2018-11-05',
      patient_classe: 'CE1',
      bilan_date: '2026-04-20',
      bilan_type: 'initial',
      medecin_nom: 'Dr Orthodontiste BERGER',
      medecin_tel: '04 72 44 55 66',
      motif:
        "Orthodontiste adresse pour bilan OMF avant pose d'appareil multi-attaches. Sigmatisme interdental persistant. Succion du pouce abandonnée à 5 ans.",
      anamnese:
        "fille unique / allaitement 12 mois / tétine jusqu'à 3 ans puis pouce jusqu'à 5 ans / otites 2 ans drain / audio OK / prononciation imparfaite des sifflantes / scolarité sans difficulté / lecture et écriture acquises CP normalement / musique (piano 1 an)",
      test_utilise: ['OMF / Déglutition'],
      resultats_manuels: `# Observation morpho-statique au repos
Lèvres : béance labiale notée, langue apparente entre incisives au repos
Langue : position basse, pas de spot palatin identifié
Voûte palatine : ogivale

# Praxies BLF
Protrusion langue : réalisée
Latéralité langue : limitée (difficulté à toucher les commissures)
Claquement : faible intensité

# Tonicité
Lèvres : hypotoniques
Langue : hypotonique
Joues : normales

# Déglutition (eau, semi-liquide, solide)
Interposition linguale systématique
Participation forte musculature péri-orale
Absence de serrage dentaire
Bruit de déglutition audible
→ Déglutition atypique / primaire persistante

# Ventilation
Mode dominant : MIXTE avec tendance buccale
Bouche ouverte au repos
Ronflements rapportés

# Articulation
Sigmatisme interdental [s], [z], [∫], [ʒ]
Autres phonèmes acquis`,
      notes_analyse:
        'Bilan 45 min. Sarah coopérative. Sensible au regard sur sa bouche. Consciente du défaut articulatoire, en souffre à l\'école. Maman attentive, collaboration orthodontiste confirmée.',
    },
  },

  // =============================================================
  // PROFIL 9 — Anxiété mathématique sans dyscalculie (CM2, 10 ans)
  // =============================================================
  {
    id: 'anxiete-math',
    label: 'Anxiété mathématique sans dyscalculie (CM2, fille 10 ans)',
    hypothese_clinique:
      "Capacités numériques de base préservées. Blocage affectif massif en situation d'évaluation chronométrée. Orientation psy indiquée.",
    formData: {
      ...ORTHO_BASE,
      patient_prenom: 'Inès',
      patient_nom: 'MOREAU',
      patient_ddn: '2016-01-20',
      patient_classe: 'CM2',
      bilan_date: '2026-04-20',
      bilan_type: 'initial',
      medecin_nom: 'Dr Marc TISSERAND',
      medecin_tel: '04 78 80 90 00',
      motif:
        "Difficultés majeures en mathématiques rapportées par les parents depuis le CE2. Pleurs quotidiens aux devoirs de maths. En français : excellent profil (17/20). Parents demandent un bilan dyscalculie.",
      anamnese:
        "aînée fratrie / lecture CP fluide / CE1 : première évaluation maths avec note rouge, maîtresse sévère / depuis : évitement massif / écran : dessins et écriture / rêve d'être écrivain / parents professeurs (lettres) pression indirecte / pas de bilan psy",
      test_utilise: ['Examath'],
      resultats_manuels: `# Cognition numérique de base
Subitizing : 9/10, É-T 0.3, Med (P50)
Comparaison grandeurs symboliques : 28/30, É-T 0.15, Med (P50)
Comparaison grandeurs non-symboliques : 26/30, É-T 0.05, Med (P50)

# Transcodage
Chiffres → mots : 19/20, É-T 0.2, Med (P50)
Mots → chiffres : 18/20, É-T -0.1, Med (P50)

# Calcul mental (sans pression)
Additions simples : 14/15, É-T 0.3, Med (P50)
Soustractions : 9/10, É-T 0.1, Med (P50)
Tables multiplication : 16/20, É-T -0.45, Med (P50)

# Calcul mental CHRONOMÉTRÉ (condition évaluation scolaire simulée)
Additions chronométrées : 6/15, É-T -1.9, P5
Tables chronométrées : 4/20, É-T -2.1, P3
→ Chute massive en condition de pression

# Résolution de problèmes
Problèmes simples (sans chrono) : 8/10, Med (P50)
Problèmes à étapes (sans chrono) : 5/8, P25

# Géométrie
Reproduction figure complexe : 19/20, Med (P50)`,
      notes_analyse:
        'Bilan 2 séances. Inès en larmes à l\'annonce de l\'épreuve chronométrée. A fallu couper le chrono et reprendre à froid. Dit "je déteste les maths, je suis nulle". Mère confirme que les notes chutent précisément aux évaluations chronométrées, alors qu\'en devoirs maison les résultats sont corrects.',
    },
  },

  // =============================================================
  // PROFIL 10 — TDL sévère suspecté (GS, 5 ans)
  // =============================================================
  {
    id: 'tdl-severe-gs',
    label: 'TDL sévère suspecté (GS, garçon 5 ans)',
    hypothese_clinique:
      "Langage oral très altéré, pronostic lourd. Orientation CRTLA urgente et bilan pluridisciplinaire (psychomot, pédopsychiatrie).",
    formData: {
      ...ORTHO_BASE,
      patient_prenom: 'Noé',
      patient_nom: 'VASSEUR',
      patient_ddn: '2020-06-12',
      patient_classe: 'GS',
      bilan_date: '2026-04-20',
      bilan_type: 'initial',
      medecin_nom: 'Dr Pédiatre LACROIX',
      medecin_tel: '04 72 88 99 11',
      motif:
        "Enseignante de GS très inquiète : Noé s'exprime avec des phrases de 2-3 mots, vocabulaire très pauvre, compréhension limitée. Difficultés d'intégration en classe. Adressé en urgence par le pédiatre.",
      anamnese:
        "cadet 3 enfants / marche 18m / premiers mots vers 2;6 ans (alerte parents différée) / phrases courtes à 4 ans / CAMSP contacté à 3 ans, pas de suite / PMI jamais signalé / famille allophone à la maison (mélange français-arabe) / audio OK bilan ORL récent / vision suspecte pas de bilan / psychomotricité pas évaluée / pas d'interaction sociale problématique rapportée / aîné frère aucun problème langage",
      test_utilise: ['Exalang 3-6', 'N-EEL'],
      resultats_manuels: `# Exalang 3-6 - Langage oral réceptif
Désignation (lexique récep.) : 18/30, P3, É-T -2.1
Compréhension phrases courtes : 8/15, P5, É-T -1.85

# Langage oral expressif
Dénomination : 10/30, P2, É-T -2.3
Production syntaxique : 3/15, P2, É-T -2.4
Récit sur image : 4 mots totaux, agrammatique

# Phonologie
Répétition mots : 12/25, P5, É-T -1.75
Répétition logatomes : 3/20, P2, É-T -2.5

# Métaphonologie
Rimes : 2/10, P5, É-T -1.8
Syllabes : 1/10, P2, É-T -2.1

# N-EEL (complément)
Compréhension morphosyntaxique : score pathologique
Empan auditif : 2/6, P2`,
      notes_analyse:
        'Bilan 2 séances 30 min. Noé coopératif mais fatigabilité rapide. Communication non verbale adaptée (pointage, intérêt pour autrui, tours de parole). Interaction préservée, pas de signes autistiques (éliminés par pédiatre). Prononciation très déformée, plusieurs phonèmes non acquis. Souffrance scolaire palpable.',
    },
  },
]
