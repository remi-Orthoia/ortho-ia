import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import mammoth from 'mammoth'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { withRetry } from '@/lib/retry'

/**
 * Extraction d'un compte-rendu de bilan orthophonique EXTERNE (rédigé en
 * dehors d'ortho-ia) au moment d'un renouvellement.
 *
 * Flow :
 *  1. L'ortho uploade un PDF ou DOCX du bilan initial.
 *  2. Côté serveur :
 *      - PDF → Claude Vision (block document, base64).
 *      - DOCX → mammoth extrait le texte brut, Claude le structure.
 *  3. Claude renvoie une structure compatible CRBOStructure (épreuves,
 *     percentiles, diagnostic, aménagements).
 *  4. On persiste dans `previous_bilans` (RLS user-scoped) et on renvoie
 *     l'extraction au client, qui la pose dans `formData.bilan_precedent_structure`.
 *  5. À la génération CRBO, le pipeline existant injecte cette structure
 *     dans le prompt + le rendu Word comparatif (déjà supporté).
 *
 * Sécurité : pas de PII nominatives extraites ni envoyées à Claude
 * autrement qu'à travers le document lui-même — l'orthophoniste reste
 * responsable de ce qu'elle uploade. Pas de logs avec payload.
 */

export const maxDuration = 90

const SUPPORTED_PDF = ['application/pdf']
const SUPPORTED_DOCX = [
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword', // .doc legacy — on tente quand même mammoth, sinon error
]
const MAX_BYTES = 10 * 1024 * 1024 // 10 MB

const EXTRACT_PREVIOUS_TOOL: Anthropic.Tool = {
  name: 'extract_previous_bilan',
  description:
    "Extrait d'un compte-rendu de bilan orthophonique externe (Word ou PDF) " +
    "les éléments structurés nécessaires à l'analyse comparative dans un " +
    "bilan de renouvellement : date, tests, scores, percentiles, diagnostic, " +
    "aménagements proposés.",
  input_schema: {
    type: 'object',
    required: ['bilan_date', 'tests_utilises', 'domains', 'diagnostic'],
    properties: {
      bilan_date: {
        type: 'string',
        description:
          "Date du bilan au format ISO YYYY-MM-DD (ex: '2024-09-15'). Si " +
          "ambiguë (juste 'septembre 2024'), le 1er du mois. Si introuvable, ''.",
      },
      tests_utilises: {
        type: 'array',
        items: { type: 'string' },
        description:
          "Noms des tests/batteries pratiqués (ex: ['Exalang 8-11', 'BALE']). " +
          "Liste vide si non indiqué.",
      },
      anamnese_redigee: {
        type: 'string',
        description:
          "Court résumé de l'anamnèse extraite du document, en prose. Max " +
          "3-4 phrases. Vide si rien d'exploitable.",
      },
      domains: {
        type: 'array',
        description:
          "Résultats groupés par domaine. Pour chaque domaine, lister les " +
          "épreuves avec leur score et percentile. Si le percentile n'est pas " +
          "fourni explicitement mais l'É-T oui, ne PAS recalculer — laisser " +
          "percentile_value=null. Respecter la grille 6 zones d'interprétation.",
        items: {
          type: 'object',
          required: ['nom', 'epreuves'],
          properties: {
            nom: {
              type: 'string',
              description:
                "Nom du domaine clinique (ex: 'A.1 Boucle phonologique', " +
                "'B.2 Lecture'). Utiliser la nomenclature officielle si " +
                "présente dans le document, sinon un libellé naturel.",
            },
            epreuves: {
              type: 'array',
              items: {
                type: 'object',
                required: ['nom', 'score', 'percentile', 'percentile_value', 'interpretation'],
                properties: {
                  nom: { type: 'string' },
                  score: { type: 'string', description: 'Score brut (ex: "16/25", "TPS 480").' },
                  et: { type: ['string', 'null'] },
                  percentile: {
                    type: 'string',
                    description: "Notation telle qu'utilisée dans le document (Q1, Med, P10...).",
                  },
                  percentile_value: {
                    type: 'number',
                    description:
                      'Valeur numérique 0-100. Q1→25, Med→50, Q3→75. ' +
                      'Si introuvable et ne peut pas être déduit du percentile texte, mettre 50 par défaut.',
                    minimum: 0,
                    maximum: 100,
                  },
                  interpretation: {
                    type: 'string',
                    enum: ['Excellent', 'Moyenne haute', 'Moyenne basse', 'Fragilité', 'Difficulté', 'Difficulté sévère'],
                    description:
                      "Grille 6 zones (étalonnage Happy Scribe) : 'Excellent' " +
                      "(P>75), 'Moyenne haute' (P51-75), 'Moyenne basse' (P26-50), " +
                      "'Fragilité' (P10-25 — Q1 inclus !), 'Difficulté' (P6-9), " +
                      "'Difficulté sévère' (P≤5).",
                  },
                },
              },
            },
            commentaire: { type: 'string' },
          },
        },
      },
      diagnostic: {
        type: 'string',
        description: "Diagnostic orthophonique tel qu'il figure dans le document. Pas de reformulation.",
      },
      amenagements: {
        type: 'array',
        items: { type: 'string' },
        description:
          "Aménagements scolaires/PAP listés dans le document (ex: 'Temps majoré', " +
          "'Tolérance orthographique'). Tableau vide si rien.",
      },
    },
  },
}

const EXTRACT_PROMPT_PDF = `# RÔLE

Tu es un assistant qui extrait des données structurées depuis un document orthophonique francophone. Le document peut être :
  - un compte-rendu de bilan orthophonique (CRBO) rédigé,
  - une feuille de résultats brute d'une batterie de tests (HappyNeuron Exalang, Examath, BALE, etc.),
  - un PDF natif ou scanné, mono ou **multi-pages**.

Tu utilises l'outil \`extract_previous_bilan\` pour rendre une structure JSON.

# OBJECTIF

Cette extraction nourrit la **synthèse comparative** d'un bilan de renouvellement : la chaîne en aval comparera ÉPREUVE PAR ÉPREUVE les scores actuels avec ceux que tu extraies. **Tout épreuve manquée sera marquée à tort comme "nouvelle"** dans le rendu final — c'est la pire erreur possible. L'exhaustivité prime sur tout le reste.

# CONSIGNES — EXHAUSTIVITÉ ABSOLUE

1. **Date** : repère "Bilan du X" / "Date : X" / la date en haut du document. Format ISO YYYY-MM-DD. Si introuvable, ''.
2. **Tests** : repère les batteries citées (Exalang 8-11, BALE, Examath, MoCA…).
3. 🚨 **Toutes les épreuves de toutes les pages** : un document HappyNeuron tient souvent sur 2-3 pages, parcours-les TOUTES sans exception. Chaque ligne d'un tableau d'épreuves = une entrée \`epreuves[]\`.
4. 🚨 **Sous-épreuves SÉPARÉES** : si une épreuve a plusieurs modalités (score, temps, ratio, erreurs, mots lus, note pondérée…), retourne une entrée DISTINCTE pour chacune avec son nom complet ("Lecture de mots — score", "Lecture de mots — temps", "Lecture de mots — ratio", "Lecture de mots — erreurs"). Ne JAMAIS fusionner.
5. Pour chaque épreuve : nom complet (avec la sous-modalité), score brut, écart-type si présent, percentile (Q1/Med/Q3/Pxx).
6. **Conversion quartiles** (HappyNeuron / Exalang) :
   - Q1 → percentile_value = 25, interpretation = "Fragilité" (PAS "Moyenne basse" !)
   - Med / Q2 → 50 / "Moyenne basse"
   - Q3 → 75 / "Moyenne haute"
   - Pxx → la valeur exacte
7. **Ne JAMAIS recalculer un percentile depuis un É-T**. Si le document ne donne que l'É-T sans percentile, marque \`percentile_value: null\` et laisse \`interpretation: "Moyenne basse"\` (valeur prudente par défaut).
8. **Préserver la hiérarchie des groupes** : si le document affiche un en-tête A.1/A.2/B.1/B.2/C.1, reporte ce code dans \`domains[].nom\` (ex: "A.1 Langage oral"). Ne mélange pas les groupes.
9. Diagnostic : repère "Diagnostic", "Conclusion clinique", "Trouble identifié". Garde la formulation exacte. Si le document est une feuille de résultats brute sans diagnostic, laisse \`diagnostic: ''\`.
10. Aménagements : extrais ceux mentionnés ("temps majoré", "tolérance orthographique", etc.) — pas d'invention. Tableau vide si absent.

# AUTOCONTRÔLE AVANT D'APPELER L'OUTIL

Avant de finaliser, compte mentalement le nombre d'épreuves visibles dans le document. Pour un Exalang 8-11 complet, tu dois trouver entre **25 et 40 épreuves** (sous-modalités incluses). Si tu n'en as listé que 10-15 alors que le document en contient plus, c'est que tu en as oubliées : reprends ta lecture page par page.

**Aucune hallucination** : on préfère manquer une donnée que l'inventer. Mais on préfère listée 35 vraies épreuves que d'en omettre 20.`

const EXTRACT_PROMPT_DOCX = `# RÔLE

Tu reçois le **texte brut** d'un document orthophonique extrait d'un fichier Word (.docx) — soit un compte-rendu de bilan rédigé, soit une transcription d'une feuille de résultats. Tu utilises l'outil \`extract_previous_bilan\` pour rendre une structure JSON.

# OBJECTIF

Cette extraction nourrit la **synthèse comparative** d'un bilan de renouvellement : la chaîne en aval comparera ÉPREUVE PAR ÉPREUVE les scores actuels avec ceux que tu extraies. **Toute épreuve manquée sera marquée à tort comme "nouvelle"** dans le rendu final — c'est la pire erreur possible. Sois exhaustif.

# CONSIGNES — EXHAUSTIVITÉ ABSOLUE

1. Date au format ISO YYYY-MM-DD ; tests pratiqués ; épreuves avec score + É-T + percentile + interprétation.
2. 🚨 **Toutes les épreuves** présentes dans le document, quelle que soit la longueur. Pour un Exalang 8-11 complet, attends-toi à 25-40 entrées (sous-modalités incluses).
3. 🚨 **Sous-épreuves SÉPARÉES** : "Lecture de mots — score", "Lecture de mots — temps", "Lecture de mots — ratio", "Lecture de mots — erreurs" sont 4 entrées distinctes. Ne JAMAIS fusionner.
4. **Préserver la hiérarchie des groupes** A.1 / A.2 / B.1 / B.2 / C.1 dans \`domains[].nom\`.
5. **Q1 = P25 = "Fragilité"** (pas "Moyenne basse"). Med = P50. Q3 = P75.
6. **Ne JAMAIS convertir É-T → percentile**. Si percentile manquant, \`percentile_value: null\`.
7. Diagnostic et aménagements : prendre la formulation littérale du document. Vide si absent.

# AUTOCONTRÔLE

Avant d'appeler l'outil, vérifie que tu as bien extrait CHAQUE ligne du tableau d'épreuves. Si le document liste 32 épreuves et que ton JSON n'en contient que 12, recommence : tu en as oubliées.

Aucune hallucination. Tableau vide si rubrique absente.`

function isSupabaseUnavailable(err: any): boolean {
  if (!err) return false
  const code = err?.code ?? err?.cause?.code
  if (['ENOTFOUND', 'ECONNREFUSED', 'ECONNRESET', 'ETIMEDOUT', 'EAI_AGAIN'].includes(code)) return true
  const msg = String(err?.message ?? '').toLowerCase()
  if (msg.includes('fetch failed') || msg.includes('network')) return true
  return false
}

export async function POST(request: NextRequest) {
  try {
    // ========== AUTH ==========
    const supabase = createServerSupabaseClient()
    let user
    try {
      const { data } = await supabase.auth.getUser()
      user = data.user
    } catch (err) {
      if (isSupabaseUnavailable(err)) {
        return NextResponse.json(
          { error: 'Service temporairement indisponible. Réessayez dans quelques minutes.' },
          { status: 503 },
        )
      }
      throw err
    }
    if (!user) {
      return NextResponse.json({ error: 'Authentification requise' }, { status: 401 })
    }

    // ========== FILE ==========
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const patientIdRaw = formData.get('patient_id')
    const patientId =
      typeof patientIdRaw === 'string' && /^[0-9a-f-]{36}$/i.test(patientIdRaw)
        ? patientIdRaw
        : null

    if (!file) {
      return NextResponse.json({ error: 'Aucun fichier fourni' }, { status: 400 })
    }

    const isPdf = SUPPORTED_PDF.includes(file.type) || /\.pdf$/i.test(file.name)
    const isDocx =
      SUPPORTED_DOCX.includes(file.type) ||
      /\.docx?$/i.test(file.name)

    if (!isPdf && !isDocx) {
      return NextResponse.json(
        { error: 'Format non supporté. Importez un PDF ou un document Word (.docx).' },
        { status: 400 },
      )
    }

    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        { error: 'Fichier trop volumineux (max 10 Mo).' },
        { status: 413 },
      )
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ error: 'Service de génération non configuré.' }, { status: 500 })
    }

    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

    // ========== CONTENU PASSÉ À CLAUDE ==========
    let content: Anthropic.MessageParam['content']
    let promptText: string

    if (isPdf) {
      const bytes = await file.arrayBuffer()
      const base64 = Buffer.from(bytes).toString('base64')
      content = [
        {
          type: 'document',
          source: { type: 'base64', media_type: 'application/pdf', data: base64 },
        },
        {
          type: 'text',
          text: EXTRACT_PROMPT_PDF,
          cache_control: { type: 'ephemeral' as const },
        },
      ]
      promptText = EXTRACT_PROMPT_PDF
    } else {
      // DOCX → mammoth → texte brut.
      const buffer = Buffer.from(await file.arrayBuffer())
      let text = ''
      try {
        const result = await mammoth.extractRawText({ buffer })
        text = (result?.value || '').trim()
      } catch (e: any) {
        console.error('[extract-previous-bilan] mammoth error:', e?.message?.slice(0, 200))
        return NextResponse.json(
          { error: "Le document Word n'a pas pu être lu. Réessayez avec un PDF." },
          { status: 422 },
        )
      }
      if (!text || text.length < 30) {
        return NextResponse.json(
          { error: 'Le document Word est vide ou illisible.' },
          { status: 422 },
        )
      }
      // Tronque à ~80k caractères (large marge sur la limite de tokens) pour
      // éviter qu'un document anormalement long ne fasse exploser le coût.
      const TRUNCATE = 80_000
      const truncated = text.length > TRUNCATE ? text.slice(0, TRUNCATE) + '\n\n[... document tronqué ...]' : text
      promptText = `${EXTRACT_PROMPT_DOCX}\n\n## DOCUMENT À ANALYSER\n\n${truncated}`
      content = [
        {
          type: 'text',
          text: promptText,
          cache_control: { type: 'ephemeral' as const },
        },
      ]
    }

    // ========== APPEL CLAUDE ==========
    const abortController = new AbortController()
    const timeoutId = setTimeout(() => abortController.abort(), 75_000)

    let message
    try {
      message = await withRetry(
        () => anthropic.messages.create(
          {
            model: 'claude-sonnet-4-6',
            // 32k pour absorber un Exalang 8-11 / 11-15 complet (30-40 épreuves
            // avec sous-modalités — ~15k tokens de JSON minimum). 8k tronquait
            // systématiquement les batteries longues, qui ressortaient ensuite
            // marquées "✦ Nouvelle" dans la synthèse comparative.
            max_tokens: 32_768,
            tools: [EXTRACT_PREVIOUS_TOOL],
            tool_choice: { type: 'tool', name: 'extract_previous_bilan' },
            messages: [{ role: 'user', content }],
          },
          { signal: abortController.signal },
        ),
        {
          maxAttempts: 2,
          initialDelayMs: 1500,
          signal: abortController.signal,
          onRetry: (attempt, error: any) => {
            console.log(`[retry ${attempt}/2] extract-previous-bilan — ${error?.status || error?.code || error?.message?.slice(0, 60)}`)
          },
        },
      )
    } finally {
      clearTimeout(timeoutId)
    }

    // Détection précoce d'une troncature de sortie : si Claude a atteint
    // max_tokens, le JSON est probablement coupé et le tool_use échouera ou
    // sera incomplet. On le logue explicitement pour debug.
    if (message.stop_reason === 'max_tokens') {
      console.warn('[extract-previous-bilan] ⚠ stop_reason=max_tokens — extraction probablement incomplète')
    }

    const toolUseBlock = message.content.find(
      (b): b is Anthropic.ToolUseBlock => b.type === 'tool_use',
    )
    if (!toolUseBlock || toolUseBlock.name !== 'extract_previous_bilan') {
      return NextResponse.json(
        { error: "Le bilan précédent n'a pas pu être structuré automatiquement." },
        { status: 502 },
      )
    }

    type ExtractedPreviousBilan = {
      bilan_date: string
      tests_utilises: string[]
      anamnese_redigee?: string
      domains: Array<{
        nom: string
        epreuves: Array<{
          nom: string
          score: string
          et: string | null
          percentile: string
          percentile_value: number
          interpretation: string
        }>
        commentaire?: string
      }>
      diagnostic: string
      amenagements?: string[]
    }
    const extracted = toolUseBlock.input as ExtractedPreviousBilan

    const totalEpreuves = (extracted.domains ?? []).reduce(
      (sum, d) => sum + (d.epreuves?.length ?? 0),
      0,
    )
    console.log(
      `[extract-previous-bilan] ${file.name?.slice(0, 80)} → ${extracted.domains?.length ?? 0} domaines, ` +
      `${totalEpreuves} épreuves (test=${extracted.tests_utilises?.[0] ?? 'inconnu'}, ` +
      `bilan_date=${extracted.bilan_date || 'inconnue'}, ` +
      `${(message.usage?.input_tokens ?? 0) + (message.usage?.output_tokens ?? 0)} tokens, ` +
      `stop=${message.stop_reason})`,
    )

    // ========== PERSISTANCE ==========
    const bilanDateForRow =
      extracted.bilan_date && /^\d{4}-\d{2}-\d{2}$/.test(extracted.bilan_date)
        ? extracted.bilan_date
        : null

    const { data: insertRows, error: insertErr } = await supabase
      .from('previous_bilans')
      .insert({
        user_id: user.id,
        patient_id: patientId,
        extracted_data: extracted,
        original_filename: file.name?.slice(0, 200) ?? null,
        source_format: isPdf ? 'pdf' : 'docx',
        bilan_date: bilanDateForRow,
      })
      .select('id, created_at')
      .single()

    if (insertErr) {
      console.error('[extract-previous-bilan] insert error:', insertErr.message?.slice(0, 200))
      // Best-effort : on renvoie quand même l'extraction si l'insert échoue —
      // l'ortho peut quand même générer son CRBO sans persistance.
    }

    return NextResponse.json({
      success: true,
      previousBilanId: insertRows?.id ?? null,
      extracted,
      tokensUsed:
        (message.usage?.input_tokens ?? 0) + (message.usage?.output_tokens ?? 0),
    })
  } catch (error: any) {
    console.error('Erreur extract-previous-bilan:', {
      name: error?.name,
      code: error?.code,
      status: error?.status,
      message: typeof error?.message === 'string' ? error.message.slice(0, 200) : undefined,
    })

    if (error?.name === 'AbortError') {
      return NextResponse.json(
        { error: "L'extraction a dépassé 75 secondes. Réessayez avec un document plus court." },
        { status: 504 },
      )
    }
    if (isSupabaseUnavailable(error)) {
      return NextResponse.json(
        { error: 'Service temporairement indisponible. Réessayez dans quelques minutes.' },
        { status: 503 },
      )
    }
    if (error?.status === 429) {
      return NextResponse.json(
        { error: 'Trop de demandes. Attendez une minute et réessayez.' },
        { status: 429 },
      )
    }
    return NextResponse.json(
      { error: "Erreur lors de l'extraction du bilan précédent." },
      { status: 500 },
    )
  }
}
