/**
 * Vocabulaire des items utilisés dans les vrais tests orthophoniques
 * (extraits des cahiers de passation officiels). Utilisé pour :
 *   1. Améliorer la reconnaissance Whisper (injection dans le `prompt` audio)
 *      → l'ortho qui dicte "Léa a lu 'paon' comme 'pan'" voit "paon" correctement
 *        retranscrit grâce à l'amorçage Whisper.
 *   2. Aider l'IA de génération CRBO à reconnaître/corriger un mot d'item de test
 *      dans les notes typées ou dictées (mistranscription homophonique).
 *
 * Sources extraites :
 *   - Exalang 5-8 / 8-11 / 11-15 / Lyfac (Thibault, Helloin, Lenfant — HappyNeuron)
 *   - EVALEO 6-15 LE + LO (Cogi-Act / De Boeck)
 *   - BETL (Dénomination écrite Bachy-Langedock)
 *   - BIA versions courte & longue (Bilan Informatisé Aphasie)
 *   - Examath 8-15
 *
 * Maintenance : tout enrichissement passe par les cahiers de passation
 * officiels dans `docs/Bilans Sources/`. JAMAIS d'invention de mot.
 */

export interface TestVocabularyList {
  /** Identifiant du test source (ex: "exalang_8_11"). */
  test: string
  /** Type d'épreuve (lecture / non-mots / dictée / dénomination / métaphono / répétition). */
  epreuve: string
  /** Items du test (un mot par entrée). */
  items: string[]
}

// ============================================================================
// LECTURE DE MOTS (mots réguliers + irréguliers + fréquents + rares)
// ============================================================================

export const LECTURE_MOTS: TestVocabularyList[] = [
  {
    test: 'exalang_8_11',
    epreuve: 'Lecture de mots (100 items, mots réguliers/irréguliers, fréquents/rares)',
    items: [
      'judo', 'temps', 'vétérinaire', 'asseoir', 'club', 'chercher', 'pied', 'écoute', 'sixième', 'couleur',
      'mer', 'gloire', 'chorale', 'long', 'hiver', 'marge', 'pain', 'femme', 'république', 'camping',
      'finir', 'outil', 'amoureuse', 'village', 'soixante', 'lendemain', 'acrobatie', 'papillon', 'super', 'sculpteur',
      'clair', 'doigt', 'prière', 'colle', 'paon', 'corps', 'payer', 'équitation', 'compteur', 'sept',
      'déraciner', 'sport', 'podium', 'huit', 'costume', 'pétanque', 'ours', 'taille', 'hier', 'accusé',
      'dessus', 'paragraphe', 'dehors', 'terrine', 'moustache', 'mille', 'fendu', 'marcheur', 'équipe', 'vingt',
      'pénalité', 'capable', 'second', 'dix', 'publication', 'wagon', 'automne', 'léguer', 'époque', 'ver',
      'confondu', 'nu', 'aiguille', 'tragédie', 'crapaud', 'orchestre', 'bavure', 'impression', 'parfum', 'coque',
      'jouable', 'tracer', 'herbe', 'parasol', 'portable', 'sud', 'parenthèse', 'victime', 'palmier', 'album',
      'logiciel', 'orteil', 'prévisible', 'généralement', 'soie', 'cavalier', 'description', 'perche', 'écrivain', 'aquarelle',
    ],
  },
  {
    test: 'exalang_11_15',
    epreuve: 'Lecture de mots (100 items)',
    items: [
      'ami', 'sept', 'lenteur', 'doigté', 'privé', 'net', 'endormir', 'paysage', 'campagne', 'monsieur',
      'gouvernement', 'archéologie', 'réserver', 'aquatique', 'chien', 'stop', 'fleuri', 'accord', 'écart', 'moyen',
      'chevalier', 'printemps', 'appareil', 'aiguille', 'documentaire', 'lycéen', 'esquiver', 'examen', 'beau', 'hiver',
      'refait', 'martien', 'degré', 'tabac', 'emporter', 'longtemps', 'numéro', 'automne', 'enjamber', 'évidemment',
      'généreux', 'maximum', 'bonjour', 'femme', 'impair', 'toit', 'seuil', 'nerf', 'télévision', 'assez',
      'ensemble', 'piscine', 'ensoleillé', 'condamnation', 'résidence', 'technique', 'souvent', 'faim', 'terreau', 'spectacle',
      'essai', 'oignon', 'finalement', 'deuxième', 'attention', 'seconde', 'malentendu', 'ennuyeux', 'innocent', 'baptême',
      'pain', 'ville', 'envol', 'gaieté', 'million', 'jury', 'fer', 'puzzle', 'retrouver', 'difficilement',
      'merci', 'gentil', 'rejet', 'affiche', 'gîte', 'cirque', 'inconnu', 'tellement', 'éclaircir', 'euphorie',
      'danger', 'hier', 'gelée', 'mercredi', 'félicitation', 'aussitôt', 'autrefois', 'interdit', 'exotique', 'esprit',
    ],
  },
  {
    test: 'exalang_lyfac',
    epreuve: 'Lecture de mots (100 items adolescents/adultes)',
    items: [
      'esprit', 'long', 'pied', 'sixième', 'paillette', 'dimanche', 'gentil', 'accroc', 'membrane', 'gens',
      'aspect', 'biceps', 'sceptique', 'présent', 'tabac', 'hareng', 'seuil', 'crapaud', 'aiguille', 'asthme',
      'prévisible', 'payer', 'orchestre', 'acrobatie', 'gloire', 'terrine', 'endormir', 'sœur', 'examen', 'hamster',
      'république', 'scène', 'parfum', 'cactus', 'orteil', 'vraiment', 'asseoir', 'igloo', 'esquiver', 'guéridon',
      'abaisser', 'cirque', 'village', 'chronologie', 'bombardier', 'écrivain', 'colle', 'danger', 'corps', 'quatuor',
      'impair', 'accord', 'paysage', 'menhir', 'jasmin', 'sport', 'outil', 'paon', 'malentendu', 'vétérinaire',
      'chenil', 'voyage', 'seconde', 'prudemment', 'exotique', 'spectacle', 'doigt', 'chercher', 'déraciner', 'pétanque',
      'affiche', 'taille', 'longtemps', 'équateur', 'enjamber', 'écart', 'papillon', 'impression', 'hiver', 'sculpteur',
      'déployer', 'préserver', 'appareil', 'interdit', 'dessus', 'baptême', 'euphorie', 'léguer', 'herbe', 'salle',
      'sept', 'album', 'lenteur', 'époque', 'médecin', 'hier', 'club', 'éclaircir', 'ensemble', 'aquarelle',
    ],
  },
  {
    test: 'bia_long',
    epreuve: 'Lecture à haute voix de mots (adultes aphasiques, mots irréguliers fréquents)',
    items: [
      'buse', 'chaton', 'limonade', 'alinéa', 'acidulé', 'style', 'lire', 'amuser', 'communauté', 'police',
      'lichen', 'plomb', 'chrome', 'septième', 'doigt', 'automne', 'estomac', 'sang', 'chaos',
    ],
  },
  {
    test: 'evaleo_cp',
    epreuve: 'Lecture de mots CP 3e trim',
    items: [
      'grenouille', 'caissier', 'fleur', 'monsieur', 'toupet', 'montagne', 'toboggan', 'dôme', 'ours', 'nez',
      'action', 'main', 'trac', 'bravo', 'gigot', 'contraire', 'juge', 'mer', 'paysanne', 'cil', 'champagne',
    ],
  },
]

// ============================================================================
// LECTURE DE NON-MOTS / PSEUDO-MOTS / LOGATOMES
// ============================================================================
// Ces items sont des INVENTIONS lexicales. Whisper a ZÉRO chance de les
// reconnaître sans amorçage. Très prioritaires dans WHISPER_HOT_WORDS.

export const LECTURE_NON_MOTS: TestVocabularyList[] = [
  {
    test: 'exalang_8_11',
    epreuve: 'Lecture de non-mots',
    items: [
      'notion', 'plame', 'chaussoire', 'mercadi', 'manoteur', 'camot', 'rapuette', 'mallot',
      'grubien', 'marabule', 'bradougon', 'chifournaire', 'plan frole', 'silantruc', 'versifalu', 'drolamoire',
    ],
  },
  {
    test: 'exalang_lyfac',
    epreuve: 'Lecture de logatomes',
    items: [
      'détrabilaire', 'iportamicave', 'saintibolucle', 'gencarmouille', 'rindécourche',
      'scarbidoule', 'estrabuleuse', 'constrivatoire', 'festivalire', 'champominien',
    ],
  },
  {
    test: 'evaleo_cp',
    epreuve: 'Lecture de pseudomots CP 3e trim',
    items: ['baban', 'chantigne', 'pondagne', 'bleur', 'tez', 'hain', 'pruc', 'druvi', 'podogan'],
  },
  {
    test: 'evaleo_ce1_3eme',
    epreuve: 'Lecture de pseudomots CE1-3ème',
    items: [
      'chantigne', 'foupet', 'pondagne', 'bleur', 'vome', 'hain', 'pruc', 'druvi', 'tonfraile', 'podogan',
      'zeu', 'vrotail', 'hortaneur', 'ufno', 'toère', 'mironche', 'noile', 'binthéan', 'prein', 'tuney',
      'camblumont', 'flin',
    ],
  },
  {
    test: 'bia_long',
    epreuve: 'Lecture à haute voix de pseudo-mots',
    items: ['gule', 'matu', 'prafo', 'nutaleur', 'abiclo', 'chopisfuqué'],
  },
]

// ============================================================================
// RÉPÉTITION DE LOGATOMES (oral)
// ============================================================================

export const REPETITION_LOGATOMES: TestVocabularyList[] = [
  {
    test: 'exalang_8_11',
    epreuve: 'Répétition de logatomes',
    items: [
      'spictoleur', 'us carde', 'gropilloir', 'scoribal', 'castilbaroi', 'stratusforique',
      'xébracoul', 'tronspircable', 'flimardeur', 'ascoridel', 'topridactil', 'sorgustaclair',
    ],
  },
]

// ============================================================================
// DICTÉE DE MOTS (orthographe lexicale)
// ============================================================================

export const DICTEE_MOTS: TestVocabularyList[] = [
  {
    test: 'evaleo_cp',
    epreuve: 'Dictée de mots CP 3e trim',
    items: ['nez', 'écrire', 'feu', 'lion', 'ordre', 'vent', 'fille', 'livre', 'place', 'voiture'],
  },
  {
    test: 'bia_long',
    epreuve: 'Dictée de mots (adultes — mots irréguliers exigeants)',
    items: [
      'abdomen', 'fœtus', 'orchidée', 'gong', 'oignon', 'parfum', 'monsieur', 'sept',
      'radiateur', 'taupe', 'scout', 'pirogue', 'pélican', 'chirurgien', 'étage', 'escalier',
      'cabane', 'pâté',
    ],
  },
  {
    test: 'bia_long',
    epreuve: 'Dictée de pseudo-mots',
    items: ['vul', 'pitan', 'batilo', 'gufissou', 'vrin', 'prichoi', 'stocbal', 'asdriché', 'glondibu'],
  },
]

// ============================================================================
// DÉNOMINATION D'IMAGES (BETL — 54 items canoniques)
// ============================================================================

export const DENOMINATION_IMAGES: TestVocabularyList[] = [
  {
    test: 'betl',
    epreuve: "Dénomination écrite (et orale) — 54 items canoniques de la BETL",
    items: [
      'banane', 'sapin', 'téléphone', 'clou', 'oreille', 'tomate', 'squelette', 'caravane',
      'coq', 'chaise', 'pyramide', 'araignée', 'cravate', 'œil', 'avocat', 'harpe',
      'pomme de terre', 'trombone', 'puits', 'écureuil', 'baignoire', 'larme', 'cactus',
      'église', 'courgette', 'chien', 'louche', 'éventail', 'gâteau', 'paon', 'ambulance',
      'poisson', 'fourchette', 'zèbre', 'chaussure', 'igloo', 'champignon', 'menottes',
      'palmier', 'échelle', 'peigne', 'huître', 'artichaut', 'pied', 'papillon', 'tente',
      'hippopotame', 'tournevis', 'verre', 'poing', 'entonnoir', 'ananas', 'moufle',
      'serpent', 'escalier', 'pantalon',
    ],
  },
]

// ============================================================================
// MÉTAPHONOLOGIE (mots à manipuler)
// ============================================================================

export const METAPHONOLOGIE_ITEMS: TestVocabularyList[] = [
  {
    test: 'exalang_8_11',
    epreuve: 'Métaphonologie syllabique et phonémique (items support)',
    items: [
      'loupi', 'tutor', 'roir', 'dragon', 'bou', 'car', 'ra',
      'chocolat', 'perroquet', 'bouger', 'talon',
      'cinq', 'bol', 'tambour', 'aise', 'oru', 'jounal',
      'ononos', 'fafillon', 'rida', 'alpin',
    ],
  },
]

// ============================================================================
// MOTS PROBLÉMATIQUES POUR WHISPER
// ============================================================================
// Sous-ensemble curé pour le `prompt` Whisper (limite ~244 tokens / ~1500 chars).
// Priorité :
//   1. Tous les logatomes / non-mots Exalang (Whisper a 0% de chance sans amorçage)
//   2. Homophones connus problématiques (paon→pan, sang→sans, sceau→seau, etc.)
//   3. Mots irréguliers à graphie rare (femme, monsieur, automne, chaos, dolmen, hier)
//   4. Items dénomination BETL fréquemment rates (œil, écureuil, huître, hippopotame)

export const WHISPER_HOT_WORDS: string[] = [
  // Logatomes Exalang 8-11 répétition
  'spictoleur', 'us carde', 'gropilloir', 'scoribal', 'castilbaroi', 'stratusforique',
  'xébracoul', 'tronspircable', 'flimardeur', 'ascoridel', 'topridactil', 'sorgustaclair',
  // Logatomes Exalang Lyfac
  'détrabilaire', 'iportamicave', 'saintibolucle', 'gencarmouille', 'rindécourche',
  'scarbidoule', 'estrabuleuse', 'constrivatoire', 'festivalire', 'champominien',
  // Pseudomots Exalang 8-11 lecture
  'plame', 'chaussoire', 'mercadi', 'manoteur', 'camot', 'rapuette', 'mallot',
  'grubien', 'marabule', 'bradougon', 'chifournaire', 'silantruc', 'versifalu', 'drolamoire',
  // Pseudomots EVALEO
  'baban', 'chantigne', 'pondagne', 'bleur', 'druvi', 'podogan', 'foupet', 'tonfraile',
  'vrotail', 'hortaneur', 'mironche', 'binthéan', 'camblumont',
  // Pseudomots BIA
  'nutaleur', 'abiclo', 'chopisfuqué', 'gufissou', 'asdriché', 'glondibu', 'stocbal', 'prichoi',
  // Homophones et mots irréguliers piégeux (paon→pan, sang→sans, etc.)
  'paon', 'faon', 'taon', 'sang', 'sans', 'cent', 'sent', 'sceau', 'seau', 'sot',
  'monsieur', 'messieurs', 'femme', 'femmes', 'automne', 'hier', 'chaos', 'dolmen', 'rhum',
  'oignon', 'œuf', 'œufs', 'œil', 'yeux', 'sœur', 'cœur', 'nœud', 'bœuf',
  'fœtus', 'orchidée', 'pélican', 'chirurgien', 'taupe', 'pirogue', 'pâté', 'gong', 'gîte',
  'doigt', 'doigts', 'sept', 'huit', 'mille', 'million',
  // Items dénomination BETL fréquemment rates
  'écureuil', 'squelette', 'araignée', 'huître', 'hippopotame', 'tournevis', 'menottes',
  'éventail', 'entonnoir', 'artichaut', 'pyramide', 'baignoire',
  // Exalang lexique scolaire pointu
  'aiguille', 'crapaud', 'parenthèse', 'aquarelle', 'orchestre', 'baptême', 'euphorie',
  'généralement', 'condamnation', 'évidemment', 'éclaircir', 'malentendu', 'tellement',
  'aussitôt', 'autrefois', 'mercredi', 'félicitation', 'sceptique', 'asthme',
]

// ============================================================================
// AGRÉGAT DÉDUPLIQUÉ — utilisé par le contexte IA de génération CRBO
// ============================================================================

/**
 * Liste agrégée de TOUS les items (dédupliquée, normalisée en minuscule)
 * pour injection dans le system prompt de l'IA — permet de reconnaître un
 * mot dans les notes user qui se réfère à un item de test, même si la
 * transcription est imparfaite.
 */
export const ALL_TEST_ITEMS: ReadonlyArray<string> = (() => {
  const seen = new Set<string>()
  const out: string[] = []
  const buckets: TestVocabularyList[][] = [
    LECTURE_MOTS, LECTURE_NON_MOTS, REPETITION_LOGATOMES,
    DICTEE_MOTS, DENOMINATION_IMAGES, METAPHONOLOGIE_ITEMS,
  ]
  for (const bucket of buckets) {
    for (const list of bucket) {
      for (const item of list.items) {
        const key = item.toLowerCase().trim()
        if (!key || seen.has(key)) continue
        seen.add(key)
        out.push(item)
      }
    }
  }
  // Ajoute WHISPER_HOT_WORDS qui peuvent ne pas être dans les listes ci-dessus
  for (const w of WHISPER_HOT_WORDS) {
    const key = w.toLowerCase().trim()
    if (!key || seen.has(key)) continue
    seen.add(key)
    out.push(w)
  }
  return Object.freeze(out)
})()

/**
 * Phrase d'amorçage Whisper (français) intégrant un sous-ensemble compact
 * du vocabulaire. Conçue pour rester sous la limite ~244 tokens du paramètre
 * `prompt` de l'API Whisper-1 d'OpenAI.
 *
 * Importée par `app/api/transcribe/route.ts`.
 */
export const WHISPER_PROMPT_CONTEXT: string = (() => {
  // Tronque la liste des mots chauds à ~200 entrées max pour éviter de
  // déborder la fenêtre du paramètre `prompt`.
  const hotWordsTrimmed = WHISPER_HOT_WORDS.slice(0, 180).join(', ')
  return (
    "Transcription d'une dictée d'orthophoniste pour un compte rendu de bilan orthophonique (CRBO). " +
    "Vocabulaire clinique : anamnèse, bilan, motif de consultation, langage oral, langage écrit, phonologie, " +
    "métaphonologie, lexique, syntaxe, conscience phonologique, mémoire de travail, boucle phonologique, " +
    "dyslexie, dysorthographie, dysphasie, dyspraxie, Exalang, EVALEO, Examath, BETL, BIA, BECD, MoCA, " +
    "écart-type, percentile, déficitaire, pathologique, normé, Q1, Q3, médiane. " +
    "Patient, médecin prescripteur, école, classe, CP, CE1, CE2, CM1, CM2, maternelle, 6ème, 5ème, 4ème, 3ème. " +
    "Items de test fréquemment cités (mots réels, logatomes inventés et homophones piégeux) : " +
    hotWordsTrimmed + "."
  )
})()
