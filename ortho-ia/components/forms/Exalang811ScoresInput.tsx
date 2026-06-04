'use client'

/**
 * Saisie structurée Exalang 8-11 (Helloin, Lenfant, Thibault — HappyNeuron 2012).
 *
 * Population : enfants du CE2 au CM2 (8 à 11 ans). Outil le plus utilisé en
 * France pour le dépistage des troubles spécifiques des apprentissages (TSA).
 *
 * Scoring : percentile HappyNeuron (P5 / P10 / P25 / P50 / P75 / P90 / P95).
 * Étalonnage par niveau scolaire (CE2 / CM1 / CM2).
 *
 * Groupes officiels HappyNeuron (en-têtes alphanumériques de la feuille de
 * résultats — DOIVENT être utilisés tels quels comme `domains[].nom` du JSON
 * CRBO pour que le rendu Word ordonne correctement les sections) :
 *   - A.1 Langage oral
 *   - A.2 Métaphonologie
 *   - B.1 Lecture
 *   - B.2 Orthographe (closure incluse — règle Laurie)
 *   - C.1 Mémoire
 *
 * Couplage : nouveau-crbo/page.tsx, test_utilise === ['Exalang 8-11'].
 *
 * Pattern aligné sur Exalang58ScoresInput.tsx (même structure de zones, état,
 * niveau scolaire). Les épreuves listées ci-dessous suivent strictement
 * lib/prompts/tests/exalang-8-11.ts (22 épreuves officielles).
 */

import { useEffect, useMemo, useRef, useState } from 'react'
import { BookOpen, ChevronDown, FileUp, GitCompare, Info, Loader2 } from 'lucide-react'
import MicButton from '../MicButton'
import type { CRBOStructure } from '@/lib/prompts'

interface Props {
  notes: string
  onNotesChange: (v: string) => void
  onResultatsChange: (normalized: string) => void
  onError?: (msg: string) => void
  /** MODE RENOUVELLEMENT — structure du bilan précédent extraite depuis le
   *  bouton d'import "bilan précédent" de l'étape 4 du wizard. Si présente,
   *  encart d'évolution live + autodiagnostic du matching (cf. Evaleo615
   *  ScoresInput.tsx pour le pattern de référence). */
  bilanPrecedentStructure?: CRBOStructure | null
  /** Date du bilan précédent (ISO yyyy-mm-dd). */
  bilanPrecedentDate?: string | null
}

type PercentileKey =
  | '' | 'p_sup_95' | 'p_90_95' | 'p_75_90' | 'p_50_75' | 'p_25_50' | 'p_10_25' | 'p_5_10' | 'p_inf_5'

// Grille 6 zones imposée Laurie (refonte 2026-05-ter).
// Exalang n'affiche JAMAIS de bande <P5 — la bande la plus basse est P1-P5.
const PERCENTILE_OPTIONS: Array<{
  key: Exclude<PercentileKey, ''>
  label: string
  value: number
  zone: 'excellent' | 'moyenne_haute' | 'moyenne_basse' | 'fragilite' | 'difficulte' | 'difficulte_severe'
  chip: string
  text: string
}> = [
  { key: 'p_sup_95', label: '> P95',     value: 97, zone: 'excellent',         chip: 'bg-emerald-700', text: 'text-white' },
  { key: 'p_90_95',  label: 'P91 — P95', value: 92, zone: 'excellent',         chip: 'bg-emerald-600', text: 'text-white' },
  { key: 'p_75_90',  label: 'P76 — P90', value: 80, zone: 'excellent',         chip: 'bg-emerald-500', text: 'text-white' },
  { key: 'p_50_75',  label: 'P50 — P75', value: 60, zone: 'moyenne_haute',     chip: 'bg-emerald-300', text: 'text-emerald-900' },
  { key: 'p_25_50',  label: 'P26 — P49', value: 35, zone: 'moyenne_basse',     chip: 'bg-yellow-300',  text: 'text-yellow-900' },
  { key: 'p_10_25',  label: 'P11 — P25', value: 18, zone: 'fragilite',         chip: 'bg-orange-300',  text: 'text-orange-900' },
  { key: 'p_5_10',   label: 'P6 — P10',  value: 7,  zone: 'difficulte',        chip: 'bg-orange-500',  text: 'text-white' },
  { key: 'p_inf_5',  label: 'P1 — P5',   value: 3,  zone: 'difficulte_severe', chip: 'bg-red-600',     text: 'text-white' },
]

function percentileLabel(k: PercentileKey): string {
  return PERCENTILE_OPTIONS.find(o => o.key === k)?.label ?? ''
}
function zoneLabel(k: PercentileKey): string {
  const z = PERCENTILE_OPTIONS.find(o => o.key === k)?.zone
  switch (z) {
    case 'excellent': return 'Excellent'
    case 'moyenne_haute': return 'Moyenne haute'
    case 'moyenne_basse': return 'Moyenne basse'
    case 'fragilite': return 'Zone de fragilité'
    case 'difficulte': return 'Difficulté'
    case 'difficulte_severe': return 'Difficulté sévère'
    default: return ''
  }
}

interface Epreuve {
  key: string
  label: string
  hint?: string
  tag?: string
}

interface Groupe {
  code: string
  label: string
  description: string
  epreuves: Epreuve[]
}

/** 5 groupes officiels HappyNeuron Exalang 8-11 + 22 épreuves selon le cahier
 *  de passation et le module prompt `lib/prompts/tests/exalang-8-11.ts`. */
const GROUPES: Groupe[] = [
  {
    code: 'A.1',
    label: 'Langage oral',
    description: 'Compréhension orale, lexique, fluences verbales — versants réceptif et expressif.',
    epreuves: [
      { key: 'comp_orale_phrases',    label: 'Compréhension orale de phrases',     hint: 'Prédicteur de la compréhension écrite' },
      { key: 'comp_orale_textes',     label: 'Compréhension orale de textes',      hint: 'Inférences, modèle mental du texte' },
      { key: 'denomination_images',   label: 'Dénomination d\'images',             hint: 'Lexique expressif imagé — décalage avec désignation = manque du mot' },
      { key: 'designation_sur_def',   label: 'Désignation sur définition',         hint: 'Lexique réceptif fin' },
      { key: 'lexique_reception',     label: 'Lexique en réception',               hint: 'Stock lexical passif' },
      { key: 'fluence_phonemique',    label: 'Fluence phonémique (lettre, 1 min)', hint: 'Profil dysexécutif si > sémantique' },
      { key: 'fluence_semantique',    label: 'Fluence sémantique (animaux, 1 min)', hint: 'Profil dysexécutif si < phonémique. Analyser clusters + switches' },
    ],
  },
  {
    code: 'A.2',
    label: 'Métaphonologie',
    description: 'Conscience phonologique fine — prédicteur n°1 de la réussite en langage écrit.',
    epreuves: [
      { key: 'meta_acronymes',        label: 'Métaphonologie — acronymes',          hint: 'Manipulation explicite de phonèmes' },
      { key: 'meta_rimes',            label: 'Métaphonologie — rimes',              hint: 'Acquises dès la MS-GS' },
      { key: 'meta_suppression',      label: 'Métaphonologie — suppression phonémique', hint: 'La plus sensible et la plus prédictive. Déficit = marqueur fort dyslexie' },
    ],
  },
  {
    code: 'B.1',
    label: 'Lecture',
    description: 'Voies d\'assemblage et d\'adressage, leximétrie, compréhension écrite.',
    epreuves: [
      { key: 'lecture_mots_freq',     label: 'Lecture de mots fréquents',            hint: 'Voie d\'adressage — doit être rapide et exacte au CE2+' },
      { key: 'lecture_mots_irreg',    label: 'Lecture de mots irréguliers',          hint: 'Voie d\'adressage / mémoire orthographique. Déficit = dyslexie de surface' },
      { key: 'lecture_non_mots',      label: 'Lecture de non-mots (logatomes écrits)', hint: 'Voie d\'assemblage. Déficit = dyslexie phonologique (marqueur central)' },
      { key: 'leximetrie',            label: 'Leximétrie (vitesse de lecture en contexte)', hint: 'CE2 90-120 / CM1 110-140 / CM2 130-160 mots/min' },
      { key: 'decision_lexico',       label: 'Décision lexico-morphologique',         hint: 'Accès au lexique orthographique sans lecture à voix haute' },
      { key: 'comp_ecrite_texte',     label: 'Compréhension écrite de texte',         hint: 'À croiser avec comp. orale (préservée = trouble spécifique langage écrit)' },
    ],
  },
  {
    code: 'B.2',
    label: 'Orthographe',
    description: 'Dictée, closure de texte, copie différée — production écrite.',
    epreuves: [
      { key: 'dra_dictee',            label: 'DRA — Dictée de Rédaction Abrégée',     hint: 'Analyse qualitative : erreurs phonologiques / lexicales / grammaticales' },
      { key: 'closure_texte',         label: 'Closure de texte',                       hint: 'À CLASSER EN B.2 ORTHOGRAPHE (règle Laurie). Mobilise compréhension écrite + production' },
      { key: 'copie_differee',        label: 'Copie différée',                         hint: 'Transcription, buffer graphémique, mémoire orthographique court terme' },
    ],
  },
  {
    code: 'C.1',
    label: 'Mémoire',
    description: 'Mémoire de travail verbale — boucle phonologique + administrateur central.',
    epreuves: [
      { key: 'empan_endroit',         label: 'Empan auditif endroit',                  hint: 'Boucle phonologique. Seuil vigilance < 4 à 8 ans, < 5 à 10 ans' },
      { key: 'empan_envers',          label: 'Empan auditif envers',                   hint: 'Administrateur central. Envers très inférieur à endroit = TDAH possible' },
      { key: 'rep_logatomes',         label: 'Répétition de logatomes',                hint: 'Distingue atteinte boucle phonologique vs trouble articulatoire' },
    ],
  },
]

const NIVEAU_OPTIONS = [
  { key: '',     label: '— choisir —' },
  { key: 'CE2',  label: 'CE2 (~8-9 ans)' },
  { key: 'CM1',  label: 'CM1 (~9-10 ans)' },
  { key: 'CM2',  label: 'CM2 (~10-11 ans)' },
] as const

interface EpreuveState {
  percentile: PercentileKey
  score_brut: string
  temps: string
  observation: string
  non_passee: boolean
}

interface State {
  niveau: typeof NIVEAU_OPTIONS[number]['key']
  epreuves: Record<string, EpreuveState>
}

function emptyState(): State {
  const ep: Record<string, EpreuveState> = {}
  for (const g of GROUPES) for (const e of g.epreuves) {
    ep[e.key] = { percentile: '', score_brut: '', temps: '', observation: '', non_passee: false }
  }
  return { niveau: '', epreuves: ep }
}

function PercentileChips({ value, onChange }: { value: PercentileKey; onChange: (v: PercentileKey) => void }) {
  return (
    <div className="flex flex-wrap gap-1">
      {PERCENTILE_OPTIONS.map(o => {
        const active = value === o.key
        return (
          <button
            key={o.key}
            type="button"
            onClick={() => onChange(active ? '' : o.key)}
            className={`px-2 py-1 rounded text-xs font-medium transition ${o.chip} ${o.text} ${active ? 'ring-2 ring-offset-1 ring-gray-700' : 'opacity-60 hover:opacity-100'}`}
          >
            {o.label}
          </button>
        )
      })}
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          className="px-2 py-1 rounded text-xs text-gray-500 hover:text-gray-900 underline decoration-dotted"
        >
          effacer
        </button>
      )}
    </div>
  )
}

export default function Exalang811ScoresInput({
  notes,
  onNotesChange,
  onResultatsChange,
  onError,
  bilanPrecedentStructure,
  bilanPrecedentDate,
}: Props) {
  const [state, setState] = useState<State>(emptyState)
  const [expanded, setExpanded] = useState<Record<string, boolean>>({ 'A.1': true, 'A.2': true, 'B.1': true, 'B.2': false, 'C.1': false })

  // Import PDF Exalang 8-11 — route /api/extract-exalang-8-11-pdf.
  // Pre-remplit l'etat du form depuis un rapport informatise HappyNeuron Pro
  // ou un scan de cahier de passation.
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [importing, setImporting] = useState(false)
  const [importInfo, setImportInfo] = useState<string | null>(null)

  async function handleImportFile(file: File) {
    setImporting(true)
    setImportInfo(null)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/extract-exalang-8-11-pdf', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok || !data?.success) {
        const msg = data?.error ?? 'Échec de l\'import PDF.'
        onError?.(msg)
        setImportInfo(`Erreur : ${msg}`)
        return
      }
      const ex = data.extracted as {
        niveau: string
        epreuves: Array<{
          key: string
          percentile: string
          score_brut: string
          temps: string
          observation: string
          non_passee: boolean
        }>
      }
      setState(prev => {
        const next: State = {
          niveau: (ex.niveau || prev.niveau) as State['niveau'],
          epreuves: { ...prev.epreuves },
        }
        for (const item of ex.epreuves ?? []) {
          if (!next.epreuves[item.key]) continue
          const cur = next.epreuves[item.key]
          next.epreuves[item.key] = {
            percentile: (item.percentile as PercentileKey) || cur.percentile,
            score_brut: item.score_brut || cur.score_brut,
            temps: item.temps || cur.temps,
            observation: item.observation || cur.observation,
            non_passee: !!item.non_passee,
          }
        }
        return next
      })
      const epreuvesImported = (ex.epreuves ?? []).length
      setImportInfo(
        `Import réussi : ${epreuvesImported} épreuve${epreuvesImported > 1 ? 's' : ''} pré-remplie${epreuvesImported > 1 ? 's' : ''}. Vérifiez et complétez si besoin.`,
      )
    } catch (err: any) {
      const msg = err?.message ?? 'Erreur réseau durant l\'import.'
      onError?.(msg)
      setImportInfo(`Erreur : ${msg}`)
    } finally {
      setImporting(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const totalSaisies = useMemo(() => {
    let n = 0
    for (const g of GROUPES) for (const e of g.epreuves) {
      const st = state.epreuves[e.key]
      if (st.non_passee) continue
      if (st.percentile !== '') n++
    }
    return n
  }, [state.epreuves])

  const zoneCounts = useMemo(() => {
    const c = { excellent: 0, moyenne_haute: 0, moyenne_basse: 0, fragilite: 0, difficulte: 0, difficulte_severe: 0 }
    for (const g of GROUPES) for (const e of g.epreuves) {
      const st = state.epreuves[e.key]
      if (st.non_passee) continue
      const z = PERCENTILE_OPTIONS.find(o => o.key === st.percentile)?.zone
      if (z) c[z]++
    }
    return c
  }, [state.epreuves])

  /**
   * Live preview deltas — mode renouvellement. Pattern aligné sur EVALEO
   * (cf. Evaleo615ScoresInput.tsx:873-924). Matching épreuve actuelle ↔
   * précédente par label lowercase+trim, seuil ±10 sur percentile_value.
   */
  const evolutionStats = useMemo(() => {
    const hasPrev = !!(bilanPrecedentStructure
      && bilanPrecedentStructure.domains
      && bilanPrecedentStructure.domains.length > 0)
    if (!hasPrev) return null

    const prevIndex = new Map<string, number>()
    for (const d of bilanPrecedentStructure!.domains) {
      for (const e of d.epreuves) {
        const pv = typeof e.percentile_value === 'number' ? e.percentile_value : null
        if (pv != null) prevIndex.set(e.nom.toLowerCase().trim(), pv)
      }
    }

    let progres = 0, stable = 0, regression = 0, nouvelles = 0
    const progresList: string[] = []
    const regressionList: string[] = []
    const nouvellesList: string[] = []

    for (const g of GROUPES) {
      for (const e of g.epreuves) {
        const st = state.epreuves[e.key]
        if (st.non_passee || st.percentile === '') continue
        const currOpt = PERCENTILE_OPTIONS.find(o => o.key === st.percentile)
        if (!currOpt) continue
        const prevValue = prevIndex.get(e.label.toLowerCase().trim())
        if (prevValue == null) {
          nouvelles++
          nouvellesList.push(e.label)
          continue
        }
        const delta = currOpt.value - prevValue
        if (delta >= 10) { progres++; progresList.push(e.label) }
        else if (delta <= -10) { regression++; regressionList.push(e.label) }
        else { stable++ }
      }
    }

    const totalCompared = progres + stable + regression
    return {
      progres, stable, regression, nouvelles,
      progresList, regressionList, nouvellesList,
      totalCompared,
      verdict: (() => {
        if (progres > regression * 2 && progres >= 3) return 'progress' as const
        if (regression > progres && regression >= 2) return 'regression' as const
        return 'stable' as const
      })(),
    }
  }, [state.epreuves, bilanPrecedentStructure])

  useEffect(() => {
    if (totalSaisies === 0 && !state.niveau) {
      onResultatsChange('')
      return
    }
    const lines: string[] = []
    lines.push('=== Exalang 8-11 (Helloin, Lenfant, Thibault — HappyNeuron 2012) ===')
    if (state.niveau) {
      lines.push(`Niveau scolaire : ${NIVEAU_OPTIONS.find(o => o.key === state.niveau)?.label}`)
      lines.push('')
    }
    for (const g of GROUPES) {
      let printed = false
      for (const e of g.epreuves) {
        const st = state.epreuves[e.key]
        if (st.non_passee) continue
        const has = st.percentile !== '' || st.observation.trim() || st.score_brut.trim() || st.temps.trim()
        if (!has) continue
        if (!printed) { lines.push(`--- ${g.code} ${g.label} ---`); printed = true }
        const tag = e.tag ? ` (${e.tag})` : ''
        lines.push(`Épreuve : ${e.label}${tag}`)
        if (st.percentile !== '') lines.push(`  Percentile : ${percentileLabel(st.percentile)} — ${zoneLabel(st.percentile)}`)
        if (st.score_brut.trim()) lines.push(`  Score brut : ${st.score_brut.trim()}`)
        if (st.temps.trim()) lines.push(`  Temps : ${st.temps.trim()}`)
        if (st.observation.trim()) lines.push(`  Observation : ${st.observation.trim()}`)
      }
      if (printed) lines.push('')
    }
    const tot = zoneCounts.excellent + zoneCounts.moyenne_haute + zoneCounts.moyenne_basse + zoneCounts.fragilite + zoneCounts.difficulte + zoneCounts.difficulte_severe
    if (tot > 0) {
      lines.push('--- Synthèse zones ---')
      lines.push(`Excellent (P76-100) : ${zoneCounts.excellent}`)
      lines.push(`Moyenne haute (P50-P75) : ${zoneCounts.moyenne_haute}`)
      lines.push(`Moyenne basse (P26-P49) : ${zoneCounts.moyenne_basse}`)
      lines.push(`Zone de fragilité (P11-P25) : ${zoneCounts.fragilite}`)
      lines.push(`Difficulté (P6-P10) : ${zoneCounts.difficulte}`)
      lines.push(`Difficulté sévère (P1-P5) : ${zoneCounts.difficulte_severe}`)
    }
    onResultatsChange(lines.join('\n'))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, totalSaisies, zoneCounts])

  const setField = (key: string, field: keyof EpreuveState, v: any) => {
    setState(s => ({ ...s, epreuves: { ...s.epreuves, [key]: { ...s.epreuves[key], [field]: v } } }))
  }

  const totalEpreuves = GROUPES.reduce((acc, g) => acc + g.epreuves.length, 0)

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-2 p-3 rounded-lg border border-indigo-200 bg-indigo-50">
        <BookOpen size={18} className="text-indigo-600 shrink-0 mt-0.5" />
        <div className="text-sm">
          <p className="font-semibold text-indigo-900">Saisie structurée Exalang 8-11 — 5 groupes officiels (A.1, A.2, B.1, B.2, C.1)</p>
          <p className="text-indigo-700 text-xs mt-0.5 leading-relaxed">
            Reportez la zone HappyNeuron lue sur la feuille de résultats. Étalonnage par niveau (CE2 / CM1 / CM2).
            Cochez « non passée » pour exclure une épreuve. Q1 = P25 = NORMAL, jamais déficitaire.
          </p>
        </div>
      </div>

      {/* Import PDF Exalang 8-11 — rapport HappyNeuron Pro ou scan cahier. */}
      <div className="rounded-lg border border-sky-200 bg-sky-50/60 p-3">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="flex items-start gap-2 min-w-0">
            <FileUp size={18} className="text-sky-700 shrink-0 mt-0.5" />
            <div className="text-sm min-w-0">
              <p className="font-semibold text-sky-900">Importer un document Exalang 8-11 (optionnel)</p>
              <p className="text-sky-800 text-xs mt-0.5 leading-relaxed">
                Format accepté : <strong>PDF uniquement</strong> (rapport HappyNeuron Pro, scan du cahier de passation, ou bilan rédigé exporté en PDF). Pour un Word, exportez-le en PDF d&apos;abord.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,application/pdf"
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) handleImportFile(f)
              }}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={importing}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded text-sm font-medium bg-sky-600 text-white hover:bg-sky-700 disabled:bg-sky-300 disabled:cursor-wait transition"
            >
              {importing ? <Loader2 size={14} className="animate-spin" /> : <FileUp size={14} />}
              {importing ? 'Extraction en cours…' : 'Choisir un fichier'}
            </button>
          </div>
        </div>
        {importInfo && (
          <p className={`mt-2 text-xs ${importInfo.startsWith('Erreur') ? 'text-red-700' : 'text-emerald-700'}`}>
            {importInfo}
          </p>
        )}
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <label className="flex items-center gap-2 text-sm font-semibold text-gray-900 mb-2">
          <Info size={14} className="text-indigo-600" />
          Niveau scolaire au moment de la passation
        </label>
        <select
          value={state.niveau}
          onChange={(e) => setState(s => ({ ...s, niveau: e.target.value as State['niveau'] }))}
          className="w-full sm:w-64 px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
        >
          {NIVEAU_OPTIONS.map(o => (<option key={o.key} value={o.key}>{o.label}</option>))}
        </select>
      </div>

      {/* Bandeau bilan précédent détecté (mode renouvellement). */}
      {bilanPrecedentStructure && bilanPrecedentStructure.domains && bilanPrecedentStructure.domains.length > 0 && (
        <div className="rounded border border-emerald-300 bg-emerald-50/70 p-2.5 flex items-start gap-2">
          <GitCompare size={16} className="text-emerald-700 shrink-0 mt-0.5" />
          <div className="text-[11px] text-emerald-900 leading-relaxed min-w-0">
            <p className="font-semibold">Bilan précédent importé et détecté</p>
            <p className="mt-0.5">
              {bilanPrecedentStructure.domains.length} domaine
              {bilanPrecedentStructure.domains.length > 1 ? 's' : ''} ·{' '}
              {bilanPrecedentStructure.domains.reduce((acc, d) => acc + d.epreuves.length, 0)} épreuves précédentes
              {bilanPrecedentDate ? ` · ${new Date(bilanPrecedentDate).toLocaleDateString('fr-FR')}` : ''}.
              L&apos;IA calculera les évolutions épreuve par épreuve et le rendu Word affichera un tableau comparatif avec flèches (↑ progrès / → stable / ↓ régression).
            </p>
          </div>
        </div>
      )}

      {/* Live preview deltas (mode renouvellement). */}
      {evolutionStats && (evolutionStats.totalCompared > 0 || evolutionStats.nouvelles > 0) && (
        <div className="rounded-lg border border-teal-300 bg-gradient-to-br from-teal-50 to-emerald-50 p-3">
          <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
            <p className="text-xs font-semibold text-teal-900">
              Évolution prévue dans le CRBO — recalcul live
            </p>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
              evolutionStats.verdict === 'progress'
                ? 'bg-green-200 text-green-900'
                : evolutionStats.verdict === 'regression'
                  ? 'bg-red-200 text-red-900'
                  : 'bg-gray-200 text-gray-800'
            }`}>
              {evolutionStats.verdict === 'progress'
                ? '✓ Progression'
                : evolutionStats.verdict === 'regression'
                  ? '↓ Régression'
                  : '≈ Stable'}
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5 mb-2">
            {evolutionStats.progres > 0 && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-green-100 text-green-800 border border-green-300">
                <span className="font-bold">↑ {evolutionStats.progres}</span>
                <span>progrès</span>
              </span>
            )}
            {evolutionStats.stable > 0 && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-gray-100 text-gray-700 border border-gray-300">
                <span className="font-bold">→ {evolutionStats.stable}</span>
                <span>stable</span>
              </span>
            )}
            {evolutionStats.regression > 0 && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-red-100 text-red-800 border border-red-300">
                <span className="font-bold">↓ {evolutionStats.regression}</span>
                <span>régression</span>
              </span>
            )}
            {evolutionStats.nouvelles > 0 && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-blue-100 text-blue-800 border border-blue-300">
                <span className="font-bold">✦ {evolutionStats.nouvelles}</span>
                <span>nouvelle{evolutionStats.nouvelles > 1 ? 's' : ''}</span>
              </span>
            )}
          </div>
          {evolutionStats.progresList.length > 0 && (
            <p className="text-[10px] text-green-900 leading-relaxed">
              <strong>Progrès :</strong> {evolutionStats.progresList.slice(0, 5).join(' · ')}
              {evolutionStats.progresList.length > 5 ? ` · +${evolutionStats.progresList.length - 5} autres` : ''}
            </p>
          )}
          {evolutionStats.regressionList.length > 0 && (
            <p className="text-[10px] text-red-900 leading-relaxed mt-0.5">
              <strong>Régressions :</strong> {evolutionStats.regressionList.slice(0, 5).join(' · ')}
              {evolutionStats.regressionList.length > 5 ? ` · +${evolutionStats.regressionList.length - 5} autres` : ''}
            </p>
          )}
          {evolutionStats.nouvelles > evolutionStats.totalCompared && evolutionStats.totalCompared <= 2 && (
            <p className="text-[10px] text-amber-800 mt-1 leading-relaxed bg-amber-50 border border-amber-200 rounded px-1.5 py-0.5">
              ⚠ Peu d&apos;épreuves matchent entre les 2 bilans ({evolutionStats.totalCompared} comparées vs {evolutionStats.nouvelles} nouvelles).
              Vérifiez que les titres d&apos;épreuves du bilan précédent correspondent aux libellés Exalang 8-11 officiels.
            </p>
          )}
        </div>
      )}

      {/* Synthèse zones — affichée dès qu'une épreuve est saisie. */}
      {totalSaisies > 0 && (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
          <p className="text-xs font-semibold text-gray-700 mb-2">
            Synthèse — {totalSaisies}/{totalEpreuves} épreuves saisies
          </p>
          <div className="flex flex-wrap gap-1.5 text-xs">
            {zoneCounts.excellent > 0 && <span className="bg-emerald-600 text-white px-2 py-0.5 rounded font-medium">{zoneCounts.excellent} Excellent</span>}
            {zoneCounts.moyenne_haute > 0 && <span className="bg-emerald-300 text-emerald-900 px-2 py-0.5 rounded font-medium">{zoneCounts.moyenne_haute} Moy. haute</span>}
            {zoneCounts.moyenne_basse > 0 && <span className="bg-yellow-300 text-yellow-900 px-2 py-0.5 rounded font-medium">{zoneCounts.moyenne_basse} Moy. basse</span>}
            {zoneCounts.fragilite > 0 && <span className="bg-orange-300 text-orange-900 px-2 py-0.5 rounded font-medium">{zoneCounts.fragilite} Fragilité</span>}
            {zoneCounts.difficulte > 0 && <span className="bg-orange-500 text-white px-2 py-0.5 rounded font-medium">{zoneCounts.difficulte} Difficulté</span>}
            {zoneCounts.difficulte_severe > 0 && <span className="bg-red-600 text-white px-2 py-0.5 rounded font-medium">{zoneCounts.difficulte_severe} Difficulté sévère</span>}
          </div>
        </div>
      )}

      {/* Groupes en accordéons */}
      {GROUPES.map(g => {
        const open = expanded[g.code]
        const gSaisies = g.epreuves.filter(e => {
          const st = state.epreuves[e.key]
          return !st.non_passee && st.percentile !== ''
        }).length
        return (
          <div key={g.code} className="rounded-lg border border-gray-200 bg-white">
            <button
              type="button"
              onClick={() => setExpanded(prev => ({ ...prev, [g.code]: !prev[g.code] }))}
              className="w-full flex items-center justify-between gap-3 px-4 py-3 hover:bg-gray-50"
            >
              <div className="flex-1 min-w-0 text-left">
                <p className="text-sm font-semibold text-gray-900">
                  <span className="font-mono text-indigo-600 mr-2">{g.code}</span>
                  {g.label}
                  <span className="ml-2 text-xs font-normal text-gray-500">
                    · {gSaisies}/{g.epreuves.length} saisies
                  </span>
                </p>
                <p className="text-xs text-gray-500 mt-0.5">{g.description}</p>
              </div>
              <ChevronDown size={16} className={`text-gray-400 shrink-0 transition-transform ${open ? '' : '-rotate-90'}`} />
            </button>

            {open && (
              <div className="border-t border-gray-100 p-4 space-y-3">
                {g.epreuves.map(e => {
                  const st = state.epreuves[e.key]
                  return (
                    <div key={e.key} className={`rounded border ${st.non_passee ? 'border-gray-200 bg-gray-50 opacity-60' : 'border-gray-200 bg-white'} p-3`}>
                      <div className="flex items-start justify-between gap-3 flex-wrap mb-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 flex items-center gap-2 flex-wrap">
                            {e.label}
                            {e.tag && <span className="text-[10px] uppercase tracking-wide bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded">{e.tag}</span>}
                          </p>
                          {e.hint && <p className="text-xs text-gray-500 mt-0.5">{e.hint}</p>}
                        </div>
                        <label className="text-xs text-gray-600 flex items-center gap-1.5 shrink-0 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={st.non_passee}
                            onChange={(ev) => setField(e.key, 'non_passee', ev.target.checked)}
                            className="rounded"
                          />
                          Non passée
                        </label>
                      </div>

                      {!st.non_passee && (
                        <div className="space-y-2">
                          {/* Chip percentile */}
                          <div>
                            <p className="text-[11px] font-medium text-gray-600 mb-1">Percentile / zone HappyNeuron :</p>
                            <PercentileChips
                              value={st.percentile}
                              onChange={(v) => setField(e.key, 'percentile', v)}
                            />
                          </div>

                          {/* Champs optionnels */}
                          <div className="grid sm:grid-cols-2 gap-2">
                            <input
                              type="text"
                              value={st.score_brut}
                              onChange={(ev) => setField(e.key, 'score_brut', ev.target.value)}
                              placeholder="Score brut (optionnel)"
                              className="px-2 py-1 border border-gray-300 rounded text-xs"
                            />
                            <input
                              type="text"
                              value={st.temps}
                              onChange={(ev) => setField(e.key, 'temps', ev.target.value)}
                              placeholder="Temps (optionnel)"
                              className="px-2 py-1 border border-gray-300 rounded text-xs"
                            />
                          </div>

                          {/* Observation */}
                          <div className="flex items-start gap-2">
                            <textarea
                              value={st.observation}
                              onChange={(ev) => setField(e.key, 'observation', ev.target.value)}
                              rows={2}
                              placeholder="Observation : stratégies, type d'erreurs, attitude…"
                              className="flex-1 px-2 py-1 border border-gray-300 rounded text-xs leading-relaxed resize-y"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}

      {/* Notes globales (comportement, fatigabilité, etc.) */}
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <div className="flex items-center justify-between mb-1">
          <label className="text-sm font-medium text-gray-800">
            Notes globales sur la séance (comportement, fatigabilité, stratégies)
          </label>
          <MicButton value={notes} onChange={onNotesChange} />
        </div>
        <textarea
          value={notes}
          onChange={(e) => onNotesChange(e.target.value)}
          rows={3}
          placeholder="Ex. élève coopératif, fatigue notable sur l'épreuve de leximétrie, stratégie de relecture spontanée…"
          className="w-full px-3 py-2 border border-gray-300 rounded text-sm leading-relaxed resize-y focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />
      </div>
    </div>
  )
}
