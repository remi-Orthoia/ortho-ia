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
  {
    // TODO Exalang 5-8 : le PDF cahier de passation est scanné (OCR illisible).
    // Les vraies listes "Lecture de mots", "Logatomes" et "Closure de mots"
    // nécessitent une extraction OCR ou saisie manuelle depuis l'app
    // Orthomotus. Ce qui suit est extrait des textes de compréhension
    // narrative présents dans docs/Bilans Sources/exalang-5-8-cahier.txt.
    test: 'exalang_5_8',
    epreuve: 'Compréhension de récit & lecture de texte (items narratifs)',
    items: [
      // Texte "Les vélos" (épreuve chronométrée, titre)
      'vélos',
      // Texte du chat anglais
      'cabane', 'chat', 'roux', 'journée', 'souris', 'rose', 'dîner', 'fleurs', 'pomme',
      'chapeau', 'rouge', 'pointu', 'anglais', 'zoo', 'voyage', 'avion', 'maison', 'neuve',
      // Texte du koala
      'koala', 'sapin', 'gardien', 'gâteaux', 'chocolats', 'oursons', 'caverne', 'arbres',
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
// MOTS À MÉMORISER (rappel libre / différé)
// ============================================================================
// Items fixes des protocoles de mémorisation à court/moyen terme. Ces mots
// sont les mêmes pour tous les patients (protocole standardisé) → l'ortho
// les cite très souvent dans ses notes ("a rappelé 3/5 mots : visage, église,
// rouge ; oublié : velours, marguerite").

export const MOTS_A_MEMORISER: TestVocabularyList[] = [
  {
    test: 'moca',
    epreuve: 'MoCA — 5 mots à mémoriser (rappel libre + différé)',
    // Protocole MoCA v8.3 français officiel (Nasreddine et al.) — invariant
    items: ['visage', 'velours', 'église', 'marguerite', 'rouge'],
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

/**
 * Mots-clés CRITIQUES à protéger contre la troncation Whisper.
 * Whisper-1 (OpenAI) limite le `prompt` à ~224 tokens et tronque depuis le
 * DÉBUT si on dépasse. On place donc les items les plus difficiles à
 * deviner (logatomes inventés, pseudomots) en FIN de prompt — c'est la
 * partie qui survit toujours. Les mots courants/scolaires (qui ont déjà
 * une chance correcte d'être transcrits sans amorçage) restent en début
 * et sont sacrifiés s'il y a troncation.
 *
 * Ordre = importance croissante (les derniers sont les plus protégés).
 */
export const WHISPER_HOT_WORDS: string[] = [
  // ⚠️ Section TÊTE (sacrifiable si troncation) — mots courants
  // Lexique scolaire Exalang à graphie pointue
  'aiguille', 'crapaud', 'parenthèse', 'aquarelle', 'orchestre', 'baptême', 'euphorie',
  'généralement', 'condamnation', 'évidemment', 'éclaircir', 'malentendu', 'tellement',
  'aussitôt', 'autrefois', 'mercredi', 'félicitation', 'sceptique', 'asthme',
  // Items dénomination BETL fréquemment rates
  'écureuil', 'squelette', 'araignée', 'huître', 'hippopotame', 'tournevis', 'menottes',
  'éventail', 'entonnoir', 'artichaut', 'pyramide', 'baignoire',
  // Mots irréguliers piégeux
  'monsieur', 'messieurs', 'femme', 'femmes', 'automne', 'hier', 'chaos', 'dolmen', 'rhum',
  'oignon', 'œuf', 'œufs', 'œil', 'yeux', 'sœur', 'cœur', 'nœud', 'bœuf',
  'fœtus', 'orchidée', 'pélican', 'chirurgien', 'taupe', 'pirogue', 'pâté', 'gong', 'gîte',
  'doigt', 'doigts', 'sept', 'huit', 'mille', 'million',
  // MoCA — 5 mots à mémoriser (protocole standardisé, immuables)
  'visage', 'velours', 'église', 'marguerite',
  // Homophones piégeux (très fréquents en dictée résultats)
  'paon', 'faon', 'taon', 'sang', 'sans', 'cent', 'sent', 'sceau', 'seau', 'sot',

  // ⚠️ Section QUEUE (protégée de la troncation) — mots IMPOSSIBLES sans amorçage
  // Pseudomots BIA (adultes aphasie)
  'nutaleur', 'abiclo', 'chopisfuqué', 'gufissou', 'asdriché', 'glondibu', 'stocbal', 'prichoi',
  // Pseudomots EVALEO (CP-3e)
  'baban', 'chantigne', 'pondagne', 'bleur', 'druvi', 'podogan', 'foupet', 'tonfraile',
  'vrotail', 'hortaneur', 'mironche', 'binthéan', 'camblumont',
  // Pseudomots Exalang 8-11 lecture
  'plame', 'chaussoire', 'mercadi', 'manoteur', 'camot', 'rapuette', 'mallot',
  'grubien', 'marabule', 'bradougon', 'chifournaire', 'silantruc', 'versifalu', 'drolamoire',
  // Logatomes Exalang Lyfac (les + critiques — adolescents/adultes)
  'détrabilaire', 'iportamicave', 'saintibolucle', 'gencarmouille', 'rindécourche',
  'scarbidoule', 'estrabuleuse', 'constrivatoire', 'festivalire', 'champominien',
  // Logatomes Exalang 8-11 répétition (LES PLUS CRITIQUES — répétés à l'oral)
  'spictoleur', 'us carde', 'gropilloir', 'scoribal', 'castilbaroi', 'stratusforique',
  'xébracoul', 'tronspircable', 'flimardeur', 'ascoridel', 'topridactil', 'sorgustaclair',
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
    MOTS_A_MEMORISER,
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
 * Phrase d'amorçage Whisper (français) optimisée pour la limite stricte
 * du paramètre `prompt` de l'API Whisper-1 OpenAI :
 *   - Limite réelle : ~224 tokens (≈ 800-900 chars FR)
 *   - Comportement si dépassée : Whisper TRONQUE SILENCIEUSEMENT DEPUIS LE DÉBUT
 *
 * Stratégie :
 *   1. Préfixe contextuel ultra-court (les mots "anamnèse, bilan, dyslexie"
 *      etc. sont déjà connus de Whisper, l'amorçage est inutile).
 *   2. Sacrifie volontiers les mots courants en début de WHISPER_HOT_WORDS.
 *   3. Garantit que les LOGATOMES (en fin de WHISPER_HOT_WORDS) sont
 *      toujours préservés — ce sont les mots impossibles à transcrire
 *      sans amorçage.
 *
 * Mesure du budget : viser ≤ 800 chars pour garder une marge en cas de
 * `extraContext` prepended ("Patient: <prénom> <nom>." ≈ 30 chars).
 *
 * Importée par `app/api/transcribe/route.ts`.
 */
export const WHISPER_PROMPT_CONTEXT: string = (() => {
  const BUDGET_CHARS = 780 // marge ~ 100 chars sous la limite token réelle
  const PREFIX = "Dictée d'orthophoniste, bilan (CRBO). Items de test : "

  // On joint depuis la FIN (mots les + critiques) jusqu'à atteindre le budget.
  // Chaque mot ajouté garantit qu'il survivra à la troncation OpenAI.
  const words: string[] = []
  let chars = PREFIX.length + 1 // +1 pour le "." final
  for (let i = WHISPER_HOT_WORDS.length - 1; i >= 0; i--) {
    const w = WHISPER_HOT_WORDS[i]
    const add = w.length + 2 // ", "
    if (chars + add > BUDGET_CHARS) break
    words.unshift(w)
    chars += add
  }
  return `${PREFIX}${words.join(', ')}.`
})()
