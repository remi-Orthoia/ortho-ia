/**
 * Régénère le CRBO de renouvellement de Chandra BARTHE en simulant que
 * l'extraction du bilan précédent (2024) a bien capturé les 31 épreuves de
 * l'Exalang 8-11 — comme c'est désormais le cas après le fix
 * `extract-previous-bilan` (commit c2c04fb + ab36759).
 *
 * Données :
 *   - Bilan actuel (2026) : 31 épreuves recopiées de la section BILAN du
 *     Word original "CRBO - BARTHE Chandra - 3 avril 2026.docx"
 *   - Bilan précédent (2024) : pour les 12 épreuves présentes dans la table
 *     comparative du Word original on utilise les vraies valeurs 2024 ; pour
 *     les 19 sous-épreuves manquantes on utilise les MÊMES valeurs que 2026
 *     (apparaîtront donc en "→ Stable" — réaliste pour un trouble
 *     spécifique stable, et surtout AUCUNE n'apparaît à tort en "✦ Nouvelle")
 *
 * Sortie : `Downloads/CRBO - BARTHE Chandra - FIX EXTRACTION.docx`
 */
import { writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { generateCRBOWord } from '../lib/word-export'
import type { CRBOStructure } from '../lib/prompts'

// Stub canvas no-op : on ne génère pas le graphique HappyNeuron côté Node
// (binaire @napi-rs/canvas instable sur win32-arm64 — crash ICU sur le texte).
// Le bloc try/catch dans word-export.ts capture l'échec et insère un
// placeholder texte à la place du PNG : la table comparative et toutes les
// autres sections sont rendues normalement.
const TINY_PNG = Buffer.from(
  '89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c489' +
  '0000000d49444154789c63600002000005000119fadcd800000000049454e44ae426082',
  'hex',
)
;(globalThis as any).document = {
  createElement: (tag: string) => {
    if (tag !== 'canvas') throw new Error(`stub: ${tag} unsupported`)
    const stub: any = {
      width: 1,
      height: 1,
      getContext: () => {
        // Toutes les méthodes de dessin sont des no-op — le rendu word-export
        // appelle ces méthodes mais le résultat est inutilisé puisque le
        // PNG sortant est précalculé.
        return new Proxy({}, {
          get: () => () => undefined,
        })
      },
      toBlob: (cb: (b: any) => void, mime = 'image/png') => {
        cb(new Blob([TINY_PNG], { type: mime }))
      },
    }
    return stub
  },
}

// ============================================================================
// MÉTADONNÉES
// ============================================================================

const formData = {
  ortho_nom: 'Laurie Berrio',
  ortho_adresse: '10 Chemin de la Barque',
  ortho_cp: '81100',
  ortho_ville: 'Castres',
  ortho_tel: '07 49 31 41 08',
  ortho_email: 'demo@ortho-ia.fr',
  patient_prenom: 'Chandra',
  patient_nom: 'BARTHE',
  patient_ddn: '2014-09-10',
  patient_classe: 'CM2',
  bilan_date: '2026-04-03',
  bilan_type: 'renouvellement',
  medecin_nom: 'Dr FONTES Jérôme',
  medecin_tel: '',
  motif:
    "Chandra est adressée pour un renouvellement de bilan orthophonique " +
    "portant sur le langage oral et le langage écrit, dans un contexte de " +
    "difficultés persistantes en lecture et en compréhension écrite.",
  test_utilise: ['Exalang 8-11'],
  anamnese: '',
  resultats_manuels: '',
}

// ============================================================================
// BILAN ACTUEL (3 avril 2026) — 31 épreuves recopiées du Word original
// ============================================================================

const ep = (
  nom: string, score: string, et: string | null, p: string, pv: number, interp: string,
) => ({ nom, score, et, percentile: p, percentile_value: pv, interpretation: interp })

const currentStructure: CRBOStructure = {
  motif_reformule: formData.motif,
  anamnese_redigee:
    "Chandra est scolarisée en CM2 à Notre Dame à Castres. " +
    "On réalise aujourd'hui son renouvellement de bilan, en lien avec des " +
    "difficultés persistantes en lecture et en compréhension écrite signalées " +
    "depuis le bilan précédent.",
  domains: [
    {
      nom: 'A.1 Langage oral',
      epreuves: [
        ep('Compréhension de phrases', '14/16', '0.42', 'P75', 75, 'Moyenne haute'),
        ep('Complétion de phrases', '10/12', '-0.88', 'P50', 50, 'Moyenne basse'),
        ep('Complétion imagée', '10/13', '-1.46', 'P25', 25, 'Fragilité'),
        ep('Catégorisation lexico-sémantique — score', '12/13', '-0.34', 'P50', 50, 'Moyenne basse'),
        ep('Catégorisation lexico-sémantique — temps', '197s', '-3.2', 'P5', 5, 'Difficulté sévère'),
        ep('Fluence phonémique', '9/31', '-1.5', 'P10', 10, 'Fragilité'),
        ep('Fluence sémantique', '19/47', '-1.47', 'P10', 10, 'Fragilité'),
      ],
      commentaire:
        "La compréhension orale de phrases est bien préservée, et la complétion " +
        "de phrases se situe dans la moyenne. On note toutefois une fragilité " +
        "sur la complétion imagée. Les fluences verbales se situent en zone " +
        "de fragilité, ce ralentissement dans l'évocation et l'organisation " +
        "du lexique pénalise les activités scolaires contraintes en temps.",
    },
    {
      nom: 'A.2 Métaphonologie',
      epreuves: [
        ep('Métaphonologie et MdT - traitement syllabique', '11/11', '0.62', 'P95', 95, 'Excellent'),
        ep('Métaphonologie et MdT - traitement phonémique', '8/11', '-0.42', 'P50', 50, 'Moyenne basse'),
        ep('Répétition de logatomes', '10/12', '-1.23', 'P25', 25, 'Fragilité'),
      ],
      commentaire:
        "Le traitement syllabique se situe à un niveau excellent, témoignant " +
        "d'une conscience syllabique solidement acquise. La répétition de " +
        "logatomes reste en zone de fragilité, suggérant une certaine " +
        "vulnérabilité de la boucle phonologique pour le stockage et la " +
        "manipulation de séquences phonologiques nouvelles.",
    },
    {
      nom: 'B.1 Lecture',
      epreuves: [
        ep('Lecture de mots — score', '29/100', '-28.7', 'P5', 5, 'Difficulté sévère'),
        ep('Lecture de mots — temps', '180s', '-1.9', 'P10', 10, 'Fragilité'),
        ep('Lecture de mots — ratio', '16.11/113.64', '-4.52', 'P5', 5, 'Difficulté sévère'),
        ep('Lecture de mots — erreurs', '9', '-2.96', 'P5', 5, 'Difficulté sévère'),
        ep('Lecture de non-mots — score', '11/16', '-5.28', 'P5', 5, 'Difficulté sévère'),
        ep('Lecture de non-mots — temps', '208s', '-24.98', 'P5', 5, 'Difficulté sévère'),
        ep('Lecture de non-mots — ratio', '5.29/84.21', '-3.82', 'P5', 5, 'Difficulté sévère'),
        ep('Leximétrie — mots lus correctement', '92/153', '-29.8', 'P5', 5, 'Difficulté sévère'),
        ep('Leximétrie — temps', '286s', '-15.38', 'P5', 5, 'Difficulté sévère'),
        ep('Leximétrie — note pondérée', '302', '-14.33', 'P5', 5, 'Difficulté sévère'),
        ep('Compréhension de phrases en images — score', '8/12', '-1.51', 'P25', 25, 'Fragilité'),
        ep('Compréhension de phrases en images — temps', '511s', '-11.35', 'P5', 5, 'Difficulté sévère'),
        ep('Compréhension de phrases en images — ratio', '1.57/11.34', '-2.87', 'P5', 5, 'Difficulté sévère'),
      ],
      commentaire:
        "Le profil de lecture demeure sévèrement déficitaire sur l'ensemble " +
        "des épreuves de décodage. La lecture de mots et de non-mots se situe " +
        "en zone de difficulté sévère, tant en exactitude qu'en vitesse, " +
        "témoignant d'une atteinte marquée des deux voies de lecture. " +
        "En leximétrie, la lecture est hachée et très lente. Ces difficultés " +
        "ont des répercussions directes sur l'accès aux supports écrits.",
    },
    {
      nom: 'B.2 Orthographe',
      epreuves: [
        ep('Closure de texte — phonologie', '—', null, 'P5', 5, 'Difficulté sévère'),
        ep('Closure de texte — lexical', '—', null, 'P5', 5, 'Difficulté sévère'),
        ep('Closure de texte — grammatical', '—', null, 'P5', 5, 'Difficulté sévère'),
      ],
      commentaire:
        "Les compétences orthographiques se situent en zone de difficulté " +
        "sévère sur l'ensemble des dimensions évaluées (phonologie, lexique, " +
        "grammaire), traduisant une atteinte profonde de la voie d'adressage " +
        "et de la mémoire orthographique. Conséquences scolaires directes : " +
        "production écrite très coûteuse, copie laborieuse.",
    },
    {
      nom: 'C.1 Mémoire',
      epreuves: [
        ep('Empan auditif endroit', '—', null, 'P25', 25, 'Fragilité'),
        ep('Empan auditif envers', '—', null, 'P25', 25, 'Fragilité'),
        ep('Empan visuel', '—', null, 'P5', 5, 'Difficulté sévère'),
        ep('Traitement visuo-spatial', '—', null, 'P50', 50, 'Moyenne basse'),
        ep('Dénomination rapide automatisée — lettres/minute', '—', null, 'P5', 5, 'Difficulté sévère'),
      ],
      commentaire:
        "La mémoire de travail verbale (empans endroit et envers) est " +
        "fragile. La mémoire visuelle est en zone de difficulté sévère. " +
        "La dénomination rapide automatisée, marqueur clé de l'automatisation " +
        "lexicale, est également effondrée — facteur pronostique défavorable " +
        "pour l'automatisation de la lecture.",
    },
  ],
  diagnostic:
    "Le profil clinique est compatible avec un trouble spécifique des " +
    "apprentissages en langage écrit (communément appelé dyslexie-" +
    "dysorthographie), forme sévère.",
  recommandations:
    "Une prise en charge orthophonique est recommandée, et en parallèle " +
    "la mise en place ou le renforcement des aménagements en classe.",
  axes_therapeutiques: [
    "Renforcement du décodage et de la conscience phonémique",
    "Travail de la voie d'adressage et de l'orthographe lexicale",
    "Soutien à la fluence et à l'automatisation de la lecture",
    "Stratégies métacognitives pour la compréhension écrite",
  ],
  pap_suggestions: [
    "Temps : temps majoré aux évaluations écrites",
    "Outils numériques : recours à un outil numérique de lecture vocale",
    "Présentation des supports : police lisible, interligne aéré, énoncés courts",
    "Évaluations : tolérance orthographique hors cours de français",
    "Pédagogie : consignes courtes, segmentées et reformulées si besoin",
    "Oral : restitution orale autorisée si l'écrit est trop coûteux",
  ],
  conclusion:
    "Compte rendu remis en main propre à l'assuré(e) pour servir et faire " +
    "valoir ce que de droit. (Copie au médecin prescripteur).",
  synthese_evolution: {
    resume:
      "Depuis le bilan initial de novembre 2024, le profil orthophonique de " +
      "Chandra reste globalement stable, dominé par une dyslexie-dysorthographie " +
      "sévère. On observe quelques évolutions ponctuelles favorables (compréhension " +
      "de phrases, complétion imagée, traitement syllabique, empan endroit) ainsi " +
      "que des fragilités persistantes voire accentuées sur les fluences et " +
      "l'empan envers. L'ensemble du décodage écrit demeure en zone de difficulté " +
      "sévère malgré la prise en charge.",
    domaines_progres: [
      'Compréhension de phrases', 'Complétion imagée',
      'Métaphonologie traitement syllabique', 'Empan auditif endroit',
    ],
    domaines_stagnation: [
      'Lecture de mots', 'Lecture de non-mots', 'Leximétrie',
      'Closure de texte', 'Dénomination rapide automatisée',
    ],
    domaines_regression: [
      'Complétion de phrases', 'Fluence phonémique', 'Fluence sémantique',
      'Métaphonologie traitement phonémique', 'Empan auditif envers', 'Traitement visuo-spatial',
    ],
  },
}

// ============================================================================
// BILAN PRÉCÉDENT (12 nov 2024) — 31 épreuves
//
// Pour les 12 dont la valeur 2024 figure dans la table comparative du Word
// original, on utilise les vraies valeurs. Pour les 19 sous-épreuves
// "manquantes" (= celles que l'extraction d'origine avait sautées), on
// utilise les MÊMES valeurs que 2026 — la table comparative les marquera
// "→ Stable" au lieu de "✦ Nouvelle".
//
// Conséquence visible vs Word original :
//   - 5 domaines au lieu de 3 (B.1 Lecture + B.2 Orthographe apparaissent)
//   - 31 lignes dans la table comparative au lieu de 12
//   - 0 "✦ Nouvelle" au lieu de 19
// ============================================================================

const previousStructure: CRBOStructure = {
  anamnese_redigee:
    "Bilan initial réalisé en novembre 2024, alors que Chandra était en CM1, " +
    "dans un contexte de difficultés en lecture et orthographe.",
  diagnostic:
    "Trouble spécifique des apprentissages en langage écrit (communément " +
    "appelé dyslexie-dysorthographie), forme sévère.",
  recommandations: '',
  conclusion: '',
  domains: [
    {
      nom: 'A.1 Langage oral',
      epreuves: [
        ep('Compréhension de phrases', '—', null, 'P25', 25, 'Fragilité'),
        ep('Complétion de phrases', '—', null, 'P95', 95, 'Excellent'),
        ep('Complétion imagée', '—', null, 'P10', 10, 'Fragilité'),
        ep('Catégorisation lexico-sémantique — score', '—', null, 'P50', 50, 'Moyenne basse'),
        ep('Catégorisation lexico-sémantique — temps', '—', null, 'P5', 5, 'Difficulté sévère'),
        ep('Fluence phonémique', '—', null, 'P50', 50, 'Moyenne basse'),
        ep('Fluence sémantique', '—', null, 'P25', 25, 'Fragilité'),
      ],
      commentaire: '',
    },
    {
      nom: 'A.2 Métaphonologie',
      epreuves: [
        ep('Métaphonologie et MdT - traitement syllabique', '—', null, 'P75', 75, 'Moyenne haute'),
        ep('Métaphonologie et MdT - traitement phonémique', '—', null, 'P75', 75, 'Moyenne haute'),
        ep('Répétition de logatomes', '—', null, 'P25', 25, 'Fragilité'),
      ],
      commentaire: '',
    },
    {
      nom: 'B.1 Lecture',
      // Ces 13 épreuves manquaient toutes dans le rendu d'origine (extraction
      // tronquée). Sur un trouble spécifique sévère, leur présence en zone
      // de difficulté sévère depuis 2024 est cliniquement plausible.
      epreuves: [
        ep('Lecture de mots — score', '—', null, 'P5', 5, 'Difficulté sévère'),
        ep('Lecture de mots — temps', '—', null, 'P10', 10, 'Fragilité'),
        ep('Lecture de mots — ratio', '—', null, 'P5', 5, 'Difficulté sévère'),
        ep('Lecture de mots — erreurs', '—', null, 'P5', 5, 'Difficulté sévère'),
        ep('Lecture de non-mots — score', '—', null, 'P5', 5, 'Difficulté sévère'),
        ep('Lecture de non-mots — temps', '—', null, 'P5', 5, 'Difficulté sévère'),
        ep('Lecture de non-mots — ratio', '—', null, 'P5', 5, 'Difficulté sévère'),
        ep('Leximétrie — mots lus correctement', '—', null, 'P5', 5, 'Difficulté sévère'),
        ep('Leximétrie — temps', '—', null, 'P5', 5, 'Difficulté sévère'),
        ep('Leximétrie — note pondérée', '—', null, 'P5', 5, 'Difficulté sévère'),
        ep('Compréhension de phrases en images — score', '—', null, 'P25', 25, 'Fragilité'),
        ep('Compréhension de phrases en images — temps', '—', null, 'P5', 5, 'Difficulté sévère'),
        ep('Compréhension de phrases en images — ratio', '—', null, 'P5', 5, 'Difficulté sévère'),
      ],
      commentaire: '',
    },
    {
      nom: 'B.2 Orthographe',
      epreuves: [
        ep('Closure de texte — phonologie', '—', null, 'P5', 5, 'Difficulté sévère'),
        ep('Closure de texte — lexical', '—', null, 'P5', 5, 'Difficulté sévère'),
        ep('Closure de texte — grammatical', '—', null, 'P5', 5, 'Difficulté sévère'),
      ],
      commentaire: '',
    },
    {
      nom: 'C.1 Mémoire',
      epreuves: [
        ep('Empan auditif endroit', '—', null, 'P5', 5, 'Difficulté sévère'),
        ep('Empan auditif envers', '—', null, 'P50', 50, 'Moyenne basse'),
        ep('Empan visuel', '—', null, 'P5', 5, 'Difficulté sévère'),
        ep('Traitement visuo-spatial', '—', null, 'P90', 90, 'Excellent'),
        ep('Dénomination rapide automatisée — lettres/minute', '—', null, 'P5', 5, 'Difficulté sévère'),
      ],
      commentaire: '',
    },
  ],
  pap_suggestions: [],
}

// ============================================================================
// GÉNÉRATION
// ============================================================================

;(async () => {
  console.log('🛠️  Génération du Word démo Chandra avec extraction corrigée…')
  console.log(`   Bilan actuel    : ${currentStructure.domains.length} domaines · ${currentStructure.domains.reduce((s, d) => s + d.epreuves.length, 0)} épreuves`)
  console.log(`   Bilan précédent : ${previousStructure.domains.length} domaines · ${previousStructure.domains.reduce((s, d) => s + d.epreuves.length, 0)} épreuves`)

  const blob = await generateCRBOWord({
    formData,
    structure: currentStructure,
    previousStructure,
    previousBilanDate: '2024-11-12',
  })

  const buf = Buffer.from(await blob.arrayBuffer())
  const outPath = join(homedir(), 'Downloads', 'CRBO - BARTHE Chandra - FIX EXTRACTION.docx')
  writeFileSync(outPath, buf)
  console.log(`\n✅ Word généré : ${outPath}`)
  console.log(`   Taille : ${(buf.length / 1024).toFixed(1)} Ko`)
  console.log(`\nOuvrez-le pour voir la table comparative avec 31 épreuves alignées (vs 12 + 19 "✦ Nouvelle" dans la version buggée).`)
})().catch((e) => {
  console.error('❌', e?.stack ?? e?.message ?? e)
  process.exit(1)
})
