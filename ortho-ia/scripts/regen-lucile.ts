/**
 * Régénère le CRBO de Lucile ANDREAUX en appliquant les NOUVELLES règles
 * Laurie. Reprend les données structurelles (patient, scores) du Word
 * existant + récrit les sections narratives au nouveau format.
 *
 * Suppressions (annotations "Ça dégage" du Word source) :
 *   - Comportement pendant le bilan
 *   - Analyse croisée
 *   - Comorbidités / profils associés suspectés
 *   - Réévaluation orthophonique programmée
 *   - Coordination ergothérapeute (autres pros au-delà de l'anamnèse)
 *
 * Reformulations :
 *   - Diagnostic : nouveau format strict (sans codes Fxxx)
 *   - Recommandations : phrase unique imposée
 *   - Axes : condensés de 5 → 4
 *   - PAP : regroupés par catégorie unique → 6 max
 *   - Section Lecture : condensée sans perdre le détail qualitatif
 */
import { writeFileSync } from 'node:fs'
import { generateCRBOWord } from '../lib/word-export'
import type { CRBOStructure } from '../lib/prompts'

// Vraie implémentation Canvas pour Node via @napi-rs/canvas — autrement
// le graphique HappyNeuron embarqué dans le Word serait un PNG 1×1 vide.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { createCanvas } = require('@napi-rs/canvas')

;(globalThis as any).document = {
  createElement: (tag: string) => {
    if (tag !== 'canvas') throw new Error(`stub: ${tag} unsupported`)
    const cv: any = createCanvas(1, 1)
    // Patch direct (pas de Proxy — sinon "Illegal invocation" car le `this`
    // est perdu quand getContext est appelé via le trap).
    cv.toBlob = (cb: (b: any) => void, mime = 'image/png') => {
      const buf = cv.toBuffer('image/png')
      cb(new Blob([buf], { type: mime }))
    }
    return cv
  },
}

// ============================================================================
// DONNÉES EXTRAITES DU WORD ORIGINAL (v1 du 28 avril 2026)
// ============================================================================

const formData = {
  ortho_nom: 'Laurie Berrio',
  ortho_adresse: '10 Chemin de la Barque',
  ortho_cp: '81100',
  ortho_ville: 'Castres',
  ortho_tel: '07 49 31 41 08',
  ortho_email: '',
  patient_prenom: 'Lucile',
  patient_nom: 'ANDREAUX',
  patient_ddn: '2011-04-19',
  patient_classe: '4ème',
  bilan_date: '2026-04-28',
  bilan_type: 'initial',
  medecin_nom: 'Dr Marie-Christine RICARD HIBERT',
  medecin_tel: '0784533210',
  motif: '',
  test_utilise: ['Exalang 11-15'],
  anamnese: '',
  resultats_manuels: '',
}

const structure: CRBOStructure = {
  motif_reformule:
    "Lucile est adressée pour un bilan orthophonique en raison de difficultés affectant à la fois le langage écrit et le langage oral, incluant des troubles du décodage en lecture, des difficultés orthographiques et des difficultés d'expression et de compréhension orales.",

  // ANAMNÈSE — restructurée en 5 thèmes courts (max 4 lignes/§)
  // Suppression des noms propres de pros (Mme Baissac, Mme Claire, Mme Bilqué).
  anamnese_redigee:
    "Lucile, âgée de 15 ans, est l'aînée d'une fratrie de deux enfants ; elle a un grand frère de 18 ans.\n\n" +
    "Les bilans visuels et auditifs sont sans particularité signalée. Un suivi orthodontique est en cours depuis deux ans.\n\n" +
    "Un bilan orthophonique réalisé en 2019 avait mis en évidence un manque de confiance associé à un retard en lecture et en orthographe. " +
    "Un trouble déficitaire de l'attention avec hyperactivité (TDAH) a été diagnostiqué par le pédiatre. " +
    "Un suivi en psychomotricité de deux ans, désormais terminé, a porté sur l'écriture, l'attention et les fonctions exécutives. " +
    "Un bilan ergothérapique a été conduit en janvier 2026, avec des séances en cours sur la dactylographie, l'utilisation de l'iPad et les fonctions exécutives.\n\n" +
    "Lucile est scolarisée en classe de 4ème. Ses enseignants soulignent une attitude sérieuse et de réelles capacités dans la plupart des matières. Un essoufflement notable a été observé en fin de trimestre. " +
    "Un Plan d'Accompagnement Personnalisé (PAP) est actuellement en place.\n\n" +
    "La plainte rapportée porte sur des difficultés de compréhension à l'écrit comme à l'oral, un décodage en lecture laborieux entraînant une lenteur significative, des fautes d'orthographe en copie comme en production spontanée, ainsi que des difficultés d'expression orale.",

  domains: [
    {
      nom: 'C.1 Mémoire et fonctions exécutives',
      epreuves: [
        { nom: 'Empan auditif (endroit)', score: '3/7',  et: '-3.34', percentile: 'P5',  percentile_value: 5,  interpretation: 'Difficulté' },
        { nom: 'Empan auditif (envers)',  score: '4/6',  et: '-0.47', percentile: 'P75', percentile_value: 75, interpretation: 'Moyenne haute' },
        { nom: 'Boucle phonologique',     score: '10/25', et: '-2.96', percentile: 'P5',  percentile_value: 5,  interpretation: 'Difficulté' },
      ],
      commentaire:
        "Le profil de mémoire de travail verbale est fortement dissocié : l'empan auditif endroit et la boucle phonologique se situent en zone de difficulté, contrastant nettement avec un empan envers préservé. " +
        "Cette dissociation traduit une fragilité spécifique du stockage phonologique à court terme plutôt qu'un déficit global des fonctions exécutives. " +
        "Sur le plan scolaire, cette limitation peut se manifester par des difficultés à retenir des consignes orales longues, à maintenir en mémoire un énoncé pendant sa copie ou à segmenter mentalement des mots complexes en lecture et en orthographe.",
    },
    {
      nom: 'A.1 Langage oral',
      epreuves: [
        { nom: 'Fluence phonétique',                       score: '5/17',     et: '-1.25', percentile: 'P25', percentile_value: 25, interpretation: 'Fragilité' },
        { nom: 'Fluence sémantique',                       score: '8/18.5',   et: '-1.85', percentile: 'P5',  percentile_value: 5,  interpretation: 'Difficulté' },
        { nom: 'Morphologie dérivationnelle — score',      score: '14/16',    et: '-0.13', percentile: 'P75', percentile_value: 75, interpretation: 'Moyenne haute' },
        { nom: 'Morphologie dérivationnelle — temps',      score: '225s',     et: '-1.84', percentile: 'P10', percentile_value: 10, interpretation: 'Fragilité' },
        { nom: 'Morphologie dérivationnelle — ratio',      score: '6.22/20',  et: '-1.24', percentile: 'P10', percentile_value: 10, interpretation: 'Fragilité' },
        { nom: 'Compréhension de consignes',               score: '9/12',     et: '-0.39', percentile: 'P50', percentile_value: 50, interpretation: 'Moyenne basse' },
        { nom: 'Complément de phrase (oral)',              score: '14/18',    et: '-1.62', percentile: 'P25', percentile_value: 25, interpretation: 'Fragilité' },
      ],
      commentaire:
        "Les compétences de langage oral présentent un profil hétérogène. La compréhension de consignes est préservée, et la morphologie dérivationnelle est correctement maîtrisée sur le plan de l'exactitude. " +
        "En revanche, la vitesse de traitement morphologique et le ratio associé se situent en zone de fragilité, témoignant d'un accès lexical ralenti. " +
        "Les fluences, particulièrement la fluence sémantique en zone de difficulté et la fluence phonétique en zone de fragilité, reflètent une mobilisation du lexique laborieuse et peu flexible. " +
        "Concrètement, ces difficultés peuvent se traduire par une participation orale hésitante en classe, des difficultés à trouver rapidement ses mots lors d'exposés et une tendance à formuler des réponses courtes et peu élaborées.",
    },
    {
      nom: 'B.1 Lecture',
      epreuves: [
        { nom: 'Lecture de mots — score',              score: '73/100',    et: '-20.84', percentile: 'P5',  percentile_value: 5,  interpretation: 'Difficulté' },
        { nom: 'Lecture de mots — temps',              score: '180s',      et: '-3.41',  percentile: 'P5',  percentile_value: 5,  interpretation: 'Difficulté' },
        { nom: 'Lecture de mots — ratio',              score: '40.56/86.5', et: '-2.62', percentile: 'P5',  percentile_value: 5,  interpretation: 'Difficulté' },
        { nom: 'Leximétrie — erreurs non-mots',        score: '0/13',      et: '+1.00',  percentile: 'P95', percentile_value: 95, interpretation: 'Excellent' },
        { nom: 'Leximétrie — temps',                   score: '269s',      et: '-5.90',  percentile: 'P5',  percentile_value: 5,  interpretation: 'Difficulté' },
        { nom: 'Leximétrie — mots lus correctement',   score: '224/225',   et: '+0.76',  percentile: 'P90', percentile_value: 90, interpretation: 'Excellent' },
        { nom: 'Leximétrie — note pondérée',           score: '271',       et: '-4.88',  percentile: 'P5',  percentile_value: 5,  interpretation: 'Difficulté' },
        { nom: 'Lecture recherche — ratio',            score: '5/30',      et: '-1.35',  percentile: 'P10', percentile_value: 10, interpretation: 'Fragilité' },
        { nom: 'Lecture recherche — réponses',         score: '10/12',     et: '-0.86',  percentile: 'P50', percentile_value: 50, interpretation: 'Moyenne basse' },
        { nom: 'Lecture recherche — temps',            score: '217s',      et: '-3.86',  percentile: 'P5',  percentile_value: 5,  interpretation: 'Difficulté' },
      ],
      // Section Lecture condensée de 30 % — détails qualitatifs préservés
      // (régularisations sur mots irréguliers, autocorrections, lecture hachée).
      commentaire:
        "Le profil de lecture est marqué par une dissociation nette entre exactitude et vitesse : l'exactitude est globalement préservée (quasi-absence d'erreurs sur les non-mots, score de mots lus correctement dans la norme), tandis que la vitesse de traitement se situe systématiquement en zone de difficulté. " +
        "Quelques erreurs de régularisation sur des mots irréguliers (doigté, net, martien) ont été observées, témoignant d'une voie d'adressage encore fragile. En leximétrie, de nombreuses autocorrections efficaces et une lecture hachée signent un décodage actif et coûteux. " +
        "La lecture-recherche révèle un ratio en zone de fragilité et un temps très déficitaire. Cette lenteur persistante impacte directement la capacité à terminer les évaluations dans les temps impartis, à lire des énoncés longs, à prendre des notes en cours et à traiter l'ensemble des documents proposés en classe.",
    },
    {
      nom: 'B.2 Orthographe / production écrite',
      epreuves: [
        { nom: 'Dictée — phonologie',  score: '20/24', et: '-4.28', percentile: 'P5',  percentile_value: 5,  interpretation: 'Difficulté' },
        { nom: 'Dictée — lexique',     score: '15/24', et: '-1.42', percentile: 'P25', percentile_value: 25, interpretation: 'Fragilité' },
        { nom: 'Dictée — grammatical', score: '10/24', et: '-1.68', percentile: 'P10', percentile_value: 10, interpretation: 'Fragilité' },
      ],
      commentaire:
        "Les trois versants de l'orthographe sont atteints à des degrés variables. Le versant phonologique se situe en zone de difficulté, traduisant une conversion grapho-phonémique insuffisamment automatisée pour une élève de 4ème. " +
        "Les versants lexical et grammatical se situent en zone de fragilité, avec des lacunes dans la mémorisation des formes orthographiques des mots et dans l'application des règles d'accord (homophones grammaticaux, accords au pluriel, omissions d'accent). " +
        "Ce profil global génère une charge cognitive élevée lors de toute production écrite, pouvant se manifester par de nombreuses fautes en copie comme en rédaction spontanée, une difficulté à se relire efficacement, et une expression écrite appauvrie par rapport aux capacités orales réelles.",
    },
  ],

  // POINTS FORTS — synthèse 3-5 lignes, prose fluide
  points_forts:
    "La compréhension de consignes orales est préservée, de même que la morphologie dérivationnelle sur le plan de l'exactitude. " +
    "En leximétrie, l'exactitude de lecture sur texte long est tout à fait satisfaisante, avec une quasi-absence d'erreurs sur les non-mots et un très bon score de mots lus correctement. " +
    "L'empan auditif envers est dans la norme haute, témoignant de capacités de manipulation séquentielle préservées. " +
    "Ces appuis solides pourront soutenir les apprentissages dès lors que les contraintes de temps et de charge cognitive sont allégées en classe.",

  // DIFFICULTÉS IDENTIFIÉES — terminer par les conséquences scolaires concrètes
  difficultes_identifiees:
    "Les principales difficultés portent sur la vitesse de traitement en lecture, systématiquement déficitaire quelle que soit la condition (mots isolés, texte long, lecture-recherche). " +
    "Le stockage phonologique à court terme est également déficitaire, avec des conséquences sur la mémorisation des consignes orales et sur l'encodage en orthographe. " +
    "L'orthographe présente des atteintes sur ses trois versants, et les fluences orales révèlent un accès lexical laborieux à l'origine d'une expression hésitante et peu élaborée. " +
    "Concrètement, ce profil se traduit par une incapacité à terminer les évaluations écrites dans les délais impartis, une fatigue cognitive importante face aux volumes de lecture au collège, de nombreuses fautes en production écrite et une participation orale en retrait.",

  // DIAGNOSTIC — format strict imposé Laurie, sans codes Fxxx
  diagnostic:
    "Le profil clinique est compatible avec un trouble spécifique des apprentissages en langage écrit (communément appelé dyslexie-dysorthographie), forme compensée sur le plan de l'exactitude mais avec une lenteur de traitement persistante. " +
    "Ce tableau s'inscrit dans un contexte de TDAH préalablement diagnostiqué.",

  // RECOMMANDATIONS — phrase unique imposée Laurie
  recommandations:
    "Une prise en charge orthophonique est recommandée, et en parallèle la mise en place ou le renforcement des aménagements en classe.",

  // AXES THÉRAPEUTIQUES — condensés de 5 → 4 (annotation Laurie "à condenser un peu")
  axes_therapeutiques: [
    "Consolidation et automatisation de la voie d'assemblage en lecture pour réduire le coût cognitif du décodage et libérer des ressources pour la compréhension.",
    "Renforcement de l'orthographe phonologique, lexicale et grammaticale (mémorisation des formes orthographiques, application des règles d'accord, homophones grammaticaux).",
    "Développement de la mémoire de travail verbale et de la boucle phonologique pour soutenir l'encodage en lecture et en dictée.",
    "Enrichissement lexical et amélioration de la fluence verbale au service de l'expression orale et écrite.",
  ],

  // PAP — regroupés par catégorie (annotation "Regrouper par familles")
  // Max 6 entrées, 1 par grande catégorie, regroupements en cas de chevauchement.
  pap_suggestions: [
    'Temps : tiers temps systématique aux évaluations écrites',
    "Évaluations : réduction de la quantité d'écrit exigée, tolérance orthographique dans les matières autres que le français, prise en compte de la fatigabilité en fin de trimestre",
    "Outils numériques : autorisation d'utiliser un ordinateur ou iPad en classe et lors des évaluations",
    'Pédagogie : consignes reformulées oralement et segmentées en étapes courtes, supports de cours fournis en amont ou sous format numérique, éviter les lectures à voix haute imposées sans préparation',
    'Environnement : place préférentielle au calme, à proximité du tableau',
    'Oral : valorisation des restitutions orales comme modalité d\'évaluation alternative',
  ],

  conclusion:
    "Compte rendu remis en main propre à l'assuré(e) pour servir et faire valoir ce que de droit. (Copie au médecin prescripteur).",
}

async function main() {
  console.log('[regen] Génération du Word avec les nouvelles règles…')
  const blob = await generateCRBOWord({ formData, structure })
  const bytes = Buffer.from(await blob.arrayBuffer())
  const outPath = "C:/Users/remib/Desktop/CRBO - ANDREAUX Lucile - 28 avril 2026 v7.docx"
  writeFileSync(outPath, bytes)
  console.log(`[regen] ✓ Écrit : ${outPath} (${bytes.length} bytes)`)
}

main().catch((e) => { console.error(e); process.exit(1) })
