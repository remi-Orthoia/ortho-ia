'use client'

/**
 * Test visuel de l'export Word.
 *
 * Profil de référence : Lucile Andreaux, 4ème, Exalang 11-15 — cas clinique
 * communiqué par Laurie Berrio-Arberet (orthophoniste senior). Permet de
 * vérifier d'un coup TOUTES les règles cliniques Laurie + nouveaux seuils
 * Exalang/HappyNeuron + format Complet vs Synthétique sans avoir à passer
 * par l'API Anthropic + Supabase auth.
 *
 * Deux boutons : Complet et Synthétique. Mêmes scores, mêmes domaines —
 * seul le diagnostic / les recommandations / les PAP varient.
 */

import { useState } from 'react'
import type { CRBOStructure } from '@/lib/prompts'
import { downloadCRBOWord, SEUILS } from '@/lib/word-export'

const FORM_DATA_LUCILE = {
  ortho_nom: 'Laurie Berrio-Arberet',
  ortho_adresse: '10 Chemin de la Barque',
  ortho_cp: '81100',
  ortho_ville: 'Castres',
  ortho_tel: '07 49 31 41 08',
  ortho_email: 'Ortho.berrio@gmail.com',
  patient_prenom: 'Lucile',
  patient_nom: 'ANDREAUX',
  patient_ddn: '2011-04-19',
  patient_classe: '4ème',
  bilan_date: '2026-04-25',
  bilan_type: 'initial',
  medecin_nom: 'Dr Marie-Christine Ricard Hibert',
  medecin_tel: '07 84 53 32 10',
  motif:
    "difficultés compréhension écrit et oral, décodage lent, fautes orthographe, difficultés expression orale",
  anamnese:
    "grand frère 18 ans - vision audition RAS - bilan ortho 2019 Mme Baissac retard lecture orthographe - TDAH diagnostic pédiatre - psychomot Mme Clair 2022 terminé - ergo Mme Bilqué jan 2026 séances prévues - orthodontie bagues 2 ans - PAP en place",
  test_utilise: ['Exalang 11-15'] as string[],
  resultats_manuels:
    "Empan auditif endroit : 3/7, É-T -3.34, P5\nEmpan auditif envers : 4/6, É-T -0.47, Q3\nBoucle phonologique : 10/25, É-T -2.96, P5\nFluence phonétique : 5/17, É-T -1.25, Q1\nFluence sémantique : 8/18.5, É-T -1.85, P5\nMorphologie dérivationnelle score : 14/16, É-T -0.13, Q3\nMorphologie dérivationnelle temps : 225s, É-T -1.84, P10\nMorphologie dérivationnelle ratio : 6.22/20, É-T -1.24, P10\nCompréhension de consignes : 9/12, É-T -0.39, Med\nComplément de phrase oral : 14/18, É-T -1.62, Q1\nLecture de mots score : 73/100, É-T -20.84, P5\nLecture de mots temps : 180s, É-T -3.41, P5\nLecture de mots ratio : 40.56/86.5, É-T -2.62, P5\nLeximétrie erreurs non-mots : 0/13, É-T +1.00, P95\nLeximétrie temps : 269s, É-T -5.90, P5\nLeximétrie mots lus correctement : 224/225, É-T +0.76, P90\nLeximétrie note pondérée : 271, É-T -4.88, P5\nLecture recherche ratio : 5/30, É-T -1.35, P10\nLecture recherche réponses : 10/12, É-T -0.86, Med\nLecture recherche temps : 217s, É-T -3.86, P5\nDictée phonologie : 20/24, É-T -4.28, P5\nDictée lexique : 15/24, É-T -1.42, Q1\nDictée grammatical : 10/24, É-T -1.68, P10",
  notes_analyse:
    "Lucile s'est montrée coopérante et impliquée. Fatigabilité perceptible sur les épreuves longues. Nombreuses autocorrections en lecture témoignant d'une bonne conscience de ses difficultés.",
}

// ============================================================================
// ANAMNÈSE & MOTIF — partagés entre Complet et Synthétique (extraction phase 1).
// Anti-hallucination strict : aucune info inférée, on couvre uniquement les
// rubriques pour lesquelles l'orthophoniste a fourni des notes.
// ============================================================================

const ANAMNESE_REDIGEE =
  "Lucile est actuellement scolarisée en classe de 4ème. Elle est adressée pour un bilan orthophonique dans le cadre de difficultés persistantes en compréhension écrite et orale, en décodage et en expression orale. Elle a un grand frère âgé de 18 ans. La vision et l'audition ont été contrôlées sans particularité. Un premier bilan orthophonique réalisé en 2019 par Mme Baissac avait mis en évidence un retard en lecture et en orthographe. Un trouble déficit de l'attention avec ou sans hyperactivité a été diagnostiqué par le pédiatre. Lucile a bénéficié d'un suivi en psychomotricité avec Mme Clair, terminé en 2022, et d'un suivi en ergothérapie avec Mme Bilqué débuté en janvier 2026. Elle est suivie en orthodontie depuis deux ans. Un PAP est actuellement en place dans son établissement."

const MOTIF_REFORMULE =
  "Lucile est adressée pour un bilan orthophonique en raison de difficultés en compréhension écrite et orale, en décodage et en expression orale, signalées dans le cadre du suivi pluridisciplinaire."

// ============================================================================
// DOMAINS — communs aux deux formats (le contenu vient de la phase d'extraction
// et de l'orthophoniste, indépendant du format choisi). Le commentaire de
// chaque domaine reflète les observations qualitatives de l'orthophoniste.
// ============================================================================

const DOMAINS_LUCILE: CRBOStructure['domains'] = [
  {
    nom: 'A.1 Langage oral',
    commentaire:
      "Performances globalement préservées sur la morphologie dérivationnelle en exactitude, mais ralentissement notable sur les épreuves chronométrées. La capacité à compléter une phrase à l'oral apparaît fragile et peut occasionner des hésitations en classe lors des prises de parole et des reformulations.",
    epreuves: [
      { nom: 'Morphologie dérivationnelle (score)',  score: '14/16',     et: '-0.13', percentile: 'Q3 (P75)', percentile_value: 75, interpretation: 'Dans la norme' },
      { nom: 'Morphologie dérivationnelle (temps)',  score: '225s',      et: '-1.84', percentile: 'P10',       percentile_value: 10, interpretation: 'Zone de fragilité' },
      { nom: 'Morphologie dérivationnelle (ratio)',  score: '6.22/20',   et: '-1.24', percentile: 'P10',       percentile_value: 10, interpretation: 'Zone de fragilité' },
      { nom: 'Compréhension de consignes',           score: '9/12',      et: '-0.39', percentile: 'Med (P50)', percentile_value: 50, interpretation: 'Dans la norme' },
      { nom: 'Complément de phrase oral',            score: '14/18',     et: '-1.62', percentile: 'Q1 (P25)',  percentile_value: 25, interpretation: 'Zone de fragilité' },
    ],
  },
  {
    nom: 'B.1 Lecture',
    commentaire:
      "La lecture de mots révèle des erreurs systématiques sur les irréguliers avec régularisations caractéristiques (doigté lu phonologiquement, net lu nette, martien régularisé), traduisant une fragilité de la voie d'adressage. La leximétrie en contexte est sévèrement ralentie malgré une exactitude préservée et de fréquentes autocorrections, témoignant d'une lecture compensatoire mais coûteuse. Ces difficultés ralentissent l'accès au sens en classe et peuvent entraver la compréhension d'énoncés en histoire, sciences ou mathématiques.",
    epreuves: [
      { nom: 'Lecture de mots (score)',                  score: '73/100',     et: '-20.84', percentile: 'P5',        percentile_value: 5,  interpretation: 'Zone de difficulté' },
      { nom: 'Lecture de mots (temps)',                  score: '180s',       et: '-3.41',  percentile: 'P5',        percentile_value: 5,  interpretation: 'Zone de difficulté' },
      { nom: 'Lecture de mots (ratio)',                  score: '40.56/86.5', et: '-2.62',  percentile: 'P5',        percentile_value: 5,  interpretation: 'Zone de difficulté' },
      { nom: 'Leximétrie — erreurs non-mots',            score: '0/13',       et: '+1.00',  percentile: 'P95',       percentile_value: 95, interpretation: 'Dans la norme' },
      { nom: 'Leximétrie — temps',                       score: '269s',       et: '-5.90',  percentile: 'P5',        percentile_value: 5,  interpretation: 'Zone de difficulté' },
      { nom: 'Leximétrie — mots lus correctement',       score: '224/225',    et: '+0.76',  percentile: 'P90',       percentile_value: 90, interpretation: 'Dans la norme' },
      { nom: 'Leximétrie — note pondérée',               score: '271',        et: '-4.88',  percentile: 'P5',        percentile_value: 5,  interpretation: 'Zone de difficulté' },
      { nom: 'Lecture recherche (ratio)',                score: '5/30',       et: '-1.35',  percentile: 'P10',       percentile_value: 10, interpretation: 'Zone de fragilité' },
      { nom: 'Lecture recherche (réponses)',             score: '10/12',      et: '-0.86',  percentile: 'Med (P50)', percentile_value: 50, interpretation: 'Dans la norme' },
      { nom: 'Lecture recherche (temps)',                score: '217s',       et: '-3.86',  percentile: 'P5',        percentile_value: 5,  interpretation: 'Zone de difficulté' },
    ],
  },
  {
    nom: 'B.2 Orthographe / production écrite',
    commentaire:
      "L'analyse des productions met en évidence des erreurs systématiques sur les accords pluriels et les homophones grammaticaux (on/ont, ces/ses, est/et, à/a), des omissions d'accent, des erreurs sur la valeur du graphème s et des confusions c/g. Ce profil traduit une atteinte conjointe phonogrammique et grammaticale. Les répercussions sont attendues sur les rédactions, dictées et productions écrites longues, avec une charge cognitive élevée pour Lucile.",
    epreuves: [
      { nom: 'Dictée — phonologie',  score: '20/24', et: '-4.28', percentile: 'P5',       percentile_value: 5,  interpretation: 'Zone de difficulté' },
      { nom: 'Dictée — lexique',     score: '15/24', et: '-1.42', percentile: 'Q1 (P25)', percentile_value: 25, interpretation: 'Zone de fragilité' },
      { nom: 'Dictée — grammatical', score: '10/24', et: '-1.68', percentile: 'P10',      percentile_value: 10, interpretation: 'Zone de fragilité' },
    ],
  },
  {
    nom: 'C.1 Mémoire et fonctions exécutives',
    commentaire:
      "La mémoire de travail verbale en condition de stockage simple est sévèrement déficitaire alors que la condition de manipulation reste préservée. La boucle phonologique est en grande difficulté. Les fluences sont fragiles, particulièrement la fluence sémantique. Ces fragilités impactent la compréhension de consignes longues, la prise de notes et la mémorisation des leçons en classe.",
    epreuves: [
      { nom: 'Empan auditif endroit',  score: '3/7',     et: '-3.34', percentile: 'P5',        percentile_value: 5,  interpretation: 'Zone de difficulté' },
      { nom: 'Empan auditif envers',   score: '4/6',     et: '-0.47', percentile: 'Q3 (P75)',  percentile_value: 75, interpretation: 'Dans la norme' },
      { nom: 'Boucle phonologique',    score: '10/25',   et: '-2.96', percentile: 'P5',        percentile_value: 5,  interpretation: 'Zone de difficulté' },
      { nom: 'Fluence phonétique',     score: '5/17',    et: '-1.25', percentile: 'Q1 (P25)',  percentile_value: 25, interpretation: 'Zone de fragilité' },
      { nom: 'Fluence sémantique',     score: '8/18.5',  et: '-1.85', percentile: 'P5',        percentile_value: 5,  interpretation: 'Zone de difficulté' },
    ],
  },
]

// ============================================================================
// CRBO COMPLET — diagnostic 250-300 mots, recommandations 200-250 mots,
// jusqu'à 10 PAP.
// ============================================================================

const STRUCTURE_LUCILE_COMPLET: CRBOStructure = {
  anamnese_redigee: ANAMNESE_REDIGEE,
  motif_reformule: MOTIF_REFORMULE,
  domains: DOMAINS_LUCILE,
  diagnostic:
    "**Comportement pendant le bilan**\n\n" +
    "Lucile s'est montrée coopérante et impliquée durant l'ensemble de la passation. Une fatigabilité perceptible a été notée sur les épreuves longues. De nombreuses autocorrections en lecture témoignent d'une bonne conscience de ses difficultés.\n\n" +
    "**Points forts**\n\n" +
    "L'empan auditif envers, la compréhension orale de consignes, la précision de la lecture (exactitude des mots correctement lus, absence d'erreurs sur les non-mots) ainsi que la morphologie dérivationnelle en exactitude constituent des leviers importants. La conscience métacognitive de Lucile est un appui supplémentaire pour la prise en charge.\n\n" +
    "**Difficultés identifiées**\n\n" +
    "Les domaines en zone de difficulté regroupent la lecture (vitesse et exactitude des mots), la leximétrie chronométrée, la dictée phonologique et la mémoire de travail verbale en stockage simple. Les épreuves chronométrées sont systématiquement en zone de difficulté, sur les versants oral et écrit.\n\n" +
    "**Analyse croisée**\n\n" +
    "Le tableau associe une atteinte de la voie d'adressage (régularisations sur les mots irréguliers notées en passation) et une lenteur majeure de la voie d'assemblage (leximétrie temps en zone de difficulté). Cette atteinte des deux voies signe un profil mixte. Les fragilités de mémoire de travail verbale et de fluences participent au coût cognitif élevé du décodage. Le profil orthographique associe des erreurs phonogrammiques et grammaticales massives. La fatigabilité observée et les autocorrections fréquentes sont à pondérer dans l'interprétation des temps de réalisation.\n\n" +
    "**Diagnostic**\n\n" +
    "Le profil clinique est compatible avec un **trouble spécifique de la lecture** (F81.0 — communément appelé dyslexie) et un **trouble spécifique de l'orthographe** (F81.1 — communément appelé dysorthographie), présentant un profil mixte avec dysorthographie à dominante phonogrammique et grammaticale.",
  recommandations:
    "Une prise en charge orthophonique est recommandée, et en parallèle la mise en place d'aménagements en classe.\n\n" +
    "**Axes thérapeutiques :**\n\n" +
    "1. Renforcement de la voie d'adressage (lecture de mots irréguliers fréquents, listes orthographiques par familles morphologiques).\n" +
    "2. Travail de la fluence en lecture par lectures répétées, lectures chorales et entraînement systématique sur textes calibrés au niveau collège.\n" +
    "3. Travail conjoint sur les homophones grammaticaux et les marques morphosyntaxiques d'accord, en lien avec les supports scolaires de Lucile.\n" +
    "4. Soutien à la mémoire de travail verbale par stratégies de répétition, segmentation et étayage visuel des consignes longues.\n" +
    "5. Travail de la fluence sémantique et des accès lexicaux par catégorisation et association.\n" +
    "6. Développement de stratégies métacognitives de relecture orthographique et de gestion des homophones grammaticaux à l'écrit.\n\n" +
    "Une réévaluation orthophonique sera programmée à l'issue de la prise en charge pour objectiver les progrès. Une consultation neuropsychologique pourrait être envisagée avec la famille pour préciser le profil cognitif et croiser les données avec le diagnostic de TDAH posé par le pédiatre. Le suivi en ergothérapie débuté en janvier 2026 mérite d'être maintenu.",
  conclusion:
    "Compte rendu remis en main propre à l'assuré(e) pour servir et faire valoir ce que de droit. (Copie au médecin prescripteur).",
  severite_globale: 'Modéré',
  comorbidites_detectees: [
    "Trouble déficit de l'attention avec ou sans hyperactivité — F90.0/F90.1 — diagnostic posé par le pédiatre, à intégrer dans la prise en charge ; impact à pondérer dans l'interprétation des résultats chronométrés.",
  ],
  pap_suggestions: [
    "**Temps** — Temps majoré aux évaluations écrites",
    "**Outils numériques** — Recours à un outil numérique en classe si besoin",
    "**Présentation des supports** — Supports adaptés (police lisible, interligne aéré)",
    "**Évaluations** — Tolérance orthographique hors cours de français",
    "**Évaluations** — Lecture des énoncés à voix haute en début d'épreuve",
    "**Pédagogie** — Consignes reformulées et segmentées",
    "**Pédagogie** — Étayage visuel des consignes longues",
    "**Environnement** — Place préférentielle au calme",
    "**Oral** — Restitution orale autorisée si l'écrit est trop coûteux",
  ],
  synthese_evolution: null,
}

// ============================================================================
// CRBO SYNTHÉTIQUE — version condensée 2-3 pages :
// - Commentaires de domaine 2-3 lignes
// - Analyse croisée 3-4 lignes max
// - Recommandations 5-7 bullets
// - PAP 5-7 max
// ============================================================================

const STRUCTURE_LUCILE_SYNTHETIQUE: CRBOStructure = {
  anamnese_redigee: ANAMNESE_REDIGEE,
  motif_reformule: MOTIF_REFORMULE,
  domains: DOMAINS_LUCILE,
  diagnostic:
    "**Comportement pendant le bilan**\n\n" +
    "Lucile s'est montrée coopérante et impliquée. Fatigabilité notée sur les épreuves longues, nombreuses autocorrections en lecture (bonne conscience métacognitive).\n\n" +
    "**Points forts**\n\n" +
    "Empan auditif envers, compréhension de consignes orales et exactitude de lecture des mots correctement décodés.\n\n" +
    "**Difficultés identifiées**\n\n" +
    "Lecture (vitesse, exactitude des irréguliers), leximétrie chronométrée, dictée phonologique et mémoire de travail verbale en stockage.\n\n" +
    "**Analyse croisée**\n\n" +
    "Atteinte conjointe des voies d'adressage (régularisations) et d'assemblage (lenteur leximétrie) signant un profil mixte. La fatigabilité et les fragilités de mémoire de travail majorent le coût cognitif. L'orthographe associe erreurs phonogrammiques et grammaticales.\n\n" +
    "**Diagnostic**\n\n" +
    "Le profil est compatible avec un **trouble spécifique de la lecture** (F81.0 — communément appelé dyslexie) et un **trouble spécifique de l'orthographe** (F81.1 — communément appelé dysorthographie), profil mixte à dominante phonogrammique et grammaticale.",
  recommandations:
    "Une prise en charge orthophonique est recommandée, et en parallèle la mise en place d'aménagements en classe.\n\n" +
    "**Axes thérapeutiques :**\n\n" +
    "1. Renforcement de la voie d'adressage (mots irréguliers fréquents, familles morphologiques).\n" +
    "2. Travail de la fluence en lecture par lectures répétées sur textes calibrés.\n" +
    "3. Homophones grammaticaux et marques d'accord, en lien avec les supports scolaires.\n" +
    "4. Soutien à la mémoire de travail verbale (segmentation, étayage visuel).\n" +
    "5. Stratégies métacognitives de relecture orthographique.\n\n" +
    "Une réévaluation orthophonique sera programmée à l'issue de la prise en charge. Une consultation neuropsychologique pourrait être envisagée pour préciser le profil cognitif au regard du diagnostic de TDAH posé par le pédiatre.",
  conclusion:
    "Compte rendu remis en main propre à l'assuré(e) pour servir et faire valoir ce que de droit. (Copie au médecin prescripteur).",
  severite_globale: 'Modéré',
  comorbidites_detectees: [
    "Trouble déficit de l'attention avec ou sans hyperactivité — F90.0/F90.1 — diagnostic pédiatre, à intégrer dans la prise en charge.",
  ],
  pap_suggestions: [
    "**Temps** — Temps majoré aux évaluations écrites",
    "**Outils numériques** — Recours à un outil numérique en classe si besoin",
    "**Présentation des supports** — Supports adaptés (police lisible, interligne aéré)",
    "**Évaluations** — Tolérance orthographique hors cours de français",
    "**Évaluations** — Lecture des énoncés à voix haute",
    "**Environnement** — Place préférentielle au calme",
    "**Oral** — Restitution orale autorisée si l'écrit est trop coûteux",
  ],
  synthese_evolution: null,
}

export default function TestWordPage() {
  const [generating, setGenerating] = useState<'complet' | 'synthetique' | null>(null)
  const [error, setError] = useState('')

  const download = async (kind: 'complet' | 'synthetique') => {
    setGenerating(kind)
    setError('')
    try {
      const structure = kind === 'complet' ? STRUCTURE_LUCILE_COMPLET : STRUCTURE_LUCILE_SYNTHETIQUE
      const formData = { ...FORM_DATA_LUCILE, format_crbo: kind as 'complet' | 'synthetique' }
      await downloadCRBOWord({ formData, structure })
    } catch (err: any) {
      setError(err?.message || String(err))
      console.error(err)
    } finally {
      setGenerating(null)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
        <h1 className="text-2xl font-bold text-gray-900">Test export Word — profil Lucile (Exalang 11-15)</h1>
        <p className="mt-2 text-gray-600">
          Cas clinique communiqué par Laurie. 23 épreuves Exalang 11-15 réelles, profil mixte (atteinte des
          deux voies de lecture) avec TDAH déjà diagnostiqué par le pédiatre. Permet de vérifier le rendu
          Word complet sans passer par l&apos;API Anthropic / Supabase auth.
        </p>

        <div className="mt-6 grid grid-cols-4 gap-2 text-xs">
          {SEUILS.map(s => (
            <div key={s.label} className="rounded p-2 text-center border" style={{ backgroundColor: '#' + s.shading }}>
              <p className="font-bold text-gray-900">{s.label}</p>
              <p className="text-gray-700">{s.range}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 grid sm:grid-cols-2 gap-3">
          <button
            onClick={() => download('complet')}
            disabled={generating !== null}
            className="bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition disabled:opacity-50"
          >
            {generating === 'complet' ? 'Génération…' : '🔵 Télécharger version Complet'}
          </button>
          <button
            onClick={() => download('synthetique')}
            disabled={generating !== null}
            className="bg-green-600 text-white py-3 rounded-xl font-semibold hover:bg-green-700 transition disabled:opacity-50"
          >
            {generating === 'synthetique' ? 'Génération…' : '🟢 Télécharger version Synthétique'}
          </button>
        </div>

        {error && (
          <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            Erreur : {error}
          </div>
        )}

        <div className="mt-8 text-xs text-gray-600 border-t pt-4 space-y-2">
          <p className="font-semibold text-gray-800">Checklist rapide à vérifier sur le Word généré :</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>En-tête : Laurie Berrio-Arberet, Castres, mail / tél présents</li>
            <li>Sous-titre : <strong>centré</strong>, &ldquo;Bilan initial du <strong>25 avril 2026</strong>&rdquo; (date longue FR)</li>
            <li>Patient : Lucile ANDREAUX · âge calculé <strong>15 ans</strong> (vs 25/04/2026) · classe 4ème</li>
            <li>Médecin : Dr Marie-Christine Ricard Hibert · 07 84 53 32 10</li>
            <li>Motif : <strong>reformulé</strong> en 1-2 phrases pro (pas les notes brutes)</li>
            <li>Anamnèse : aucune info inférée (pas de profession parents, pas de fratrie inventée…)</li>
            <li>Page 1 : <strong>UN SEUL</strong> graphique HappyNeuron, médiane noire, ligne rouge à <strong>P7</strong></li>
            <li>Graphique : <strong>tous les labels visibles intégralement</strong> (pas de &ldquo;…&rdquo;) · titres groupes wrappés sur 2 lignes si besoin</li>
            <li>Q1 (P25) → cellules <strong>jaune (zone de fragilité)</strong>, PAS vert</li>
            <li>P10 → jaune (fragilité). P5 → orange (difficulté). Pas de cellule rouge sévère ici</li>
            <li>Tableaux par domaine : <strong>aucun graphique</strong> sous le tableau (uniquement page 1)</li>
            <li>Commentaires de domaine : aucune mention &ldquo;dyslexie/dysorthographie&rdquo;, aucun percentile cité, pas de tirets cadratins, observations scolaires si difficulté</li>
            <li>Diagnostic : terminologie DSM-5 en gras &ldquo;<strong>trouble spécifique de la lecture</strong> (F81.0 — communément appelé dyslexie)&rdquo;</li>
            <li>Recommandations : phrase d&apos;intro standard + axes <strong>numérotés 1-N</strong>, pas de &ldquo;X séances/30 min&rdquo;, pas de paragraphe MDPH</li>
            <li>Aménagements scolaires : libellés &ldquo;<strong>conseillés</strong>&rdquo; (pas &ldquo;proposés&rdquo;), bullets condensés, max 10</li>
            <li>Comorbidités : TDAH listé avec code F90.0/F90.1</li>
            <li>Conclusion : <strong>petite italique</strong> centrée tout en bas, après la signature</li>
            <li>Pas de badge &ldquo;Sévérité globale&rdquo; affiché en page 1</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
