import Anthropic from '@anthropic-ai/sdk'

/**
 * Prompt de contexte pour l'extraction PDF/image de résultats de tests.
 * Insiste sur le respect strict des percentiles écrits (pas de recalcul).
 */
export const EXTRACTION_PROMPT = `Tu es un assistant spécialisé dans l'extraction de résultats de tests orthophoniques. Tu dois analyser le document fourni (PDF ou image de résultats) et remplir l'outil \`extract_test_results\` avec une structure JSON PROPRE et COMPLÈTE.

## CONTEXTE DES DOCUMENTS HAPPYNEURON (Exalang, Examath)

Les feuilles de résultats HappyNeuron ont une structure classique :
- Un en-tête avec le nom du test (Exalang 8-11, Exalang 11-15, Examath 8-15…) et parfois les informations du patient.
- Un ou plusieurs tableaux listant les épreuves avec colonnes :
  - Nom de l'épreuve (et éventuellement sous-épreuve : temps / score / ratio)
  - Score brut (ex: "16/25", "480s", "7/10")
  - É-T (Écart-Type) — peut être positif ou négatif
  - Percentiles exprimés en **quartiles** : **Q1, Med, Q3** ou en valeurs explicites **P5, P10, P90, P95**.
- Parfois un graphique à barres récapitulatif (ignore-le, ne recompose pas depuis les barres).

## RÈGLES CRITIQUES (à ne JAMAIS enfreindre)

### 1. Respect strict des percentiles écrits
- Si le PDF indique **Q1** → retourner percentile_raw = "Q1" et percentile_value = **25**
- Si le PDF indique **Med** ou **Q2** → retourner "Med" et percentile_value = **50**
- Si le PDF indique **Q3** → retourner "Q3" et percentile_value = **75**
- Si le PDF indique **P5** → "P5" et percentile_value = **5**
- Si le PDF indique **P10** → "P10" et percentile_value = **10**
- Si le PDF indique **P90** → "P90" et percentile_value = **90**
- Si le PDF indique **P95** → "P95" et percentile_value = **95**

### 2. Ne JAMAIS recalculer un percentile depuis l'É-T
L'É-T peut paraître "mauvais" (ex: -1.53) mais si le percentile écrit est Q1 (P25), c'est Q1 qui fait foi. La norme du test prime sur la distribution gaussienne théorique.

### 3. Extraire TOUTES les épreuves du document
- Chaque ligne du tableau → une entrée.
- Inclure les sous-épreuves (temps, ratio, score partiel).
- Ne rien omettre, même les lignes qui semblent redondantes.

### 4. Valeurs manquantes
- Si une colonne est vide : utiliser \`null\`, pas "N/A" ni "—".
- Si tu n'es pas certain de la lecture d'une valeur (flou, chiffre illisible), préfère \`null\` et le signaler dans \`warnings[]\`.

### 5. Détection du test
Identifier le test dans le champ \`test_name\` parmi :
- "Exalang 3-6", "Exalang 5-8", "Exalang 8-11", "Exalang 11-15"
- "EVALO 2-6", "ELO", "BALE", "EVALEO 6-15", "N-EEL"
- "BILO", "BELEC", "Examath", "BETL", "MoCA"
Si aucun test ne correspond avec certitude, utiliser \`null\` et signaler dans warnings.

### 6. Classer les épreuves par domaine
Lors du remplissage, assigner un domaine (ex: "Mémoire de travail", "Métaphonologie", "Langage écrit — lecture", etc.) à chaque épreuve en te basant sur la structure du test. Si tu hésites, utiliser "Autre".

## INFORMATIONS PATIENT
Si le document contient des infos patient (prénom, âge, classe, date de bilan), les extraire dans \`patient_info\`. **N'invente rien**.

## EXEMPLE DE SORTIE ATTENDUE

{
  "test_name": "Exalang 8-11",
  "patient_info": { "prenom": "Léa", "classe": "CE2", "age": "8 ans et 6 mois", "bilan_date": "15/03/2026" },
  "epreuves": [
    { "nom": "Empan auditif endroit", "domaine": "Mémoire de travail", "score": "6/7", "et": "0.45", "percentile_raw": "P90", "percentile_value": 90 },
    { "nom": "Boucle phonologique", "domaine": "Mémoire de travail", "score": "16/25", "et": "-1.53", "percentile_raw": "Q1", "percentile_value": 25 },
    { "nom": "Lecture de non-mots", "domaine": "Langage écrit — lecture", "score": "14/30", "et": "-1.75", "percentile_raw": "P5", "percentile_value": 5 }
  ],
  "warnings": [],
  "notes_extraction": "Tableau principal extrait. Le graphique récapitulatif a été ignoré."
}

Remplis maintenant l'outil \`extract_test_results\`.`

/**
 * Tool Anthropic pour forcer un JSON structuré de sortie.
 */
export const EXTRACT_TOOL: Anthropic.Tool = {
  name: 'extract_test_results',
  description:
    "Extrait et structure les résultats d'un test orthophonique (PDF ou image) en JSON propre avec épreuves, scores, É-T et percentiles respectant la notation du document source.",
  input_schema: {
    type: 'object',
    properties: {
      test_name: {
        type: ['string', 'null'],
        description:
          "Nom exact du test identifié (ex: 'Exalang 8-11', 'Examath', 'BETL'). null si non identifiable avec certitude.",
      },
      patient_info: {
        type: 'object',
        description:
          'Informations patient extraites du document (si présentes). Ne PAS inventer.',
        properties: {
          prenom: { type: ['string', 'null'] },
          nom: { type: ['string', 'null'] },
          age: { type: ['string', 'null'], description: "Âge formaté (ex: '8 ans et 4 mois')" },
          classe: { type: ['string', 'null'] },
          bilan_date: { type: ['string', 'null'], description: 'Date du bilan (DD/MM/YYYY)' },
        },
      },
      epreuves: {
        type: 'array',
        description:
          "Liste de TOUTES les épreuves extraites du document, dans l'ordre d'apparition.",
        items: {
          type: 'object',
          properties: {
            nom: {
              type: 'string',
              description: "Nom complet de l'épreuve tel qu'écrit dans le document.",
            },
            domaine: {
              type: 'string',
              description:
                "Domaine clinique (ex: 'Mémoire de travail', 'Métaphonologie', 'Langage écrit — lecture').",
            },
            score: {
              type: ['string', 'null'],
              description: "Score brut tel qu'écrit (ex: '16/25', '480s', '7/10').",
            },
            et: {
              type: ['string', 'null'],
              description: "Écart-type tel qu'écrit (ex: '-1.53', '0.45'). null si absent.",
            },
            percentile_raw: {
              type: ['string', 'null'],
              description:
                "Percentile tel qu'écrit dans le document : 'Q1', 'Med', 'Q3', 'P5', 'P10', 'P90', 'P95'.",
            },
            percentile_value: {
              type: ['number', 'null'],
              description:
                'Valeur numérique correspondante (0-100). Q1=25, Med=50, Q3=75, P5=5, etc. null si non déterminable.',
              minimum: 0,
              maximum: 100,
            },
          },
          required: ['nom', 'domaine'],
        },
      },
      warnings: {
        type: 'array',
        description:
          "Avertissements sur les extractions incertaines (valeurs floues, tableau partiel, etc.).",
        items: { type: 'string' },
      },
      notes_extraction: {
        type: ['string', 'null'],
        description: "Notes générales sur l'extraction (ex: 'Tableau principal extrait').",
      },
    },
    required: ['epreuves', 'warnings'],
  },
}

/**
 * Type de la structure retournée par l'outil d'extraction.
 */
export interface ExtractedResults {
  test_name: string | null
  patient_info?: {
    prenom?: string | null
    nom?: string | null
    age?: string | null
    classe?: string | null
    bilan_date?: string | null
  }
  epreuves: Array<{
    nom: string
    domaine: string
    score: string | null
    et: string | null
    percentile_raw: string | null
    percentile_value: number | null
  }>
  warnings: string[]
  notes_extraction?: string | null
}

/**
 * Reconstitue un format texte legacy-compatible à partir de la structure extraite.
 * Utilisé pour remplir le champ texte "resultats_manuels" afin de garder
 * une compatibilité avec l'UI existante.
 */
export function extractedToLegacyText(result: ExtractedResults): string {
  const lines: string[] = []
  if (result.test_name) lines.push(`# Test : ${result.test_name}`)

  const byDomain = new Map<string, ExtractedResults['epreuves']>()
  for (const e of result.epreuves) {
    if (!byDomain.has(e.domaine)) byDomain.set(e.domaine, [])
    byDomain.get(e.domaine)!.push(e)
  }

  for (const [domaine, epreuves] of Array.from(byDomain.entries())) {
    lines.push('')
    lines.push(`## ${domaine}`)
    for (const e of epreuves) {
      const parts = [e.nom]
      if (e.score) parts.push(`Score : ${e.score}`)
      if (e.et) parts.push(`É-T : ${e.et}`)
      if (e.percentile_raw) parts.push(e.percentile_raw)
      lines.push(parts.join(', '))
    }
  }

  if (result.warnings.length > 0) {
    lines.push('')
    lines.push('# Avertissements extraction')
    for (const w of result.warnings) lines.push(`- ${w}`)
  }

  return lines.join('\n')
}
