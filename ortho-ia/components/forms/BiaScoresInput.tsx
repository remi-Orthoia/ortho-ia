'use client'

/**
 * Saisie structurée BIA — Bilan Informatisé d'Aphasie (Weill-Chounlamountry,
 * Oudry, Gatignol, Jutteau — Ortho Édition 2023).
 *
 * 4 modules officiels (version courte, score total /100) :
 *   1. Expression orale (5 subtests)
 *   2. Compréhension orale (4 subtests)
 *   3. Expression écrite (5 subtests)
 *   4. Compréhension écrite (4 subtests)
 *
 * Couplage : nouveau-crbo/page.tsx, test_utilise === ['BIA'].
 */

import { useEffect, useMemo, useState } from 'react'
import { Brain, ChevronDown, Info, MessageSquare } from 'lucide-react'
import MicButton from '../MicButton'

interface Props {
  notes: string
  onNotesChange: (v: string) => void
  onResultatsChange: (normalized: string) => void
  onError?: (msg: string) => void
}

const VERSION_OPTIONS = [
  { key: '',       label: '— version BIA —' },
  { key: 'courte', label: 'Version courte (4 modules, /100, phase aiguë ou séquellaire)' },
  { key: 'longue', label: 'Version longue (analyse approfondie post-aigu / chronique)' },
] as const

const ETIOLOGIE_OPTIONS = [
  { key: '',                    label: '— étiologie —' },
  { key: 'avc_gauche',           label: 'AVC hémisphérique gauche' },
  { key: 'avc_droit',            label: 'AVC hémisphérique droit' },
  { key: 'tc',                   label: 'Traumatisme crânien' },
  { key: 'app',                  label: 'Aphasie progressive primaire (APP)' },
  { key: 'demence_semantique',   label: 'Démence sémantique' },
  { key: 'demence_alzheimer',    label: 'Démence Alzheimer (avec trouble du langage)' },
  { key: 'autre',                label: 'Autre étiologie' },
] as const

const PHASE_OPTIONS = [
  { key: '',           label: '— phase clinique —' },
  { key: 'aigue',      label: 'Phase aiguë (< 1 mois)' },
  { key: 'post_aigue', label: 'Phase post-aiguë (1-6 mois)' },
  { key: 'chronique',  label: 'Phase chronique (≥ 6 mois)' },
] as const

interface Subtest {
  key: string
  label: string
  max?: number
  hint?: string
}

interface Module {
  id: string
  num: number
  label: string
  description: string
  subtests: Subtest[]
}

const MODULES: Module[] = [
  {
    id: 'm1', num: 1,
    label: 'Expression orale',
    description: 'Langage spontané, séries automatiques, fluences, dénomination, répétition. ~28 points.',
    subtests: [
      { key: 'm1_langage_spontane',  label: 'Langage oral spontané',                    max: 2,  hint: '4 questions : nom, prénom, adresse, date. 0.5 pt si sémantique ET syntaxique corrects' },
      { key: 'm1_series_automatiques', label: 'Séries automatiques (compter 1-20 + jours)',     hint: 'Langage récurrent — souvent préservé en aphasie sévère' },
      { key: 'm1_fluence_semantique',  label: 'Fluence sémantique (animaux, 1 min)',           hint: 'Nombre de mots produits — noter persévérations séparément' },
      { key: 'm1_fluence_phonologique', label: 'Fluence phonologique ([v], 1 min)',            hint: 'Mots commençant par [v], pas de noms propres' },
      { key: 'm1_denomination',        label: 'Dénomination (visuel /10 + auditif /2 + tactile)', max: 12, hint: 'Analyser type d\'erreur : paraphasie sémantique / phonologique / visuelle / verbale, manque du mot, néologismes' },
      { key: 'm1_repetition',          label: 'Répétition (mots / pseudomots / phrases)',       hint: 'Réécoute = 0.5 pt, au-delà = 0' },
    ],
  },
  {
    id: 'm2', num: 2,
    label: 'Compréhension orale',
    description: 'Désignation, appariements sémantiques, exécution d\'ordres, compréhension syntaxique. ~17 points.',
    subtests: [
      { key: 'm2_designation_images',     label: 'Désignation d\'images',          max: 6, hint: '6 items, distracteurs visuels/sémantiques/phonologiques. Comparer à dénomination orale (vocabulaire actif vs passif)' },
      { key: 'm2_appariements_semantiques', label: 'Appariements sémantiques',     max: 5, hint: 'Triade image — choisir le lien sémantique' },
      { key: 'm2_execution_ordres',        label: 'Exécution d\'ordres (simples + complexes)', hint: 'Inclut praxies bucco-linguo-faciales si parties du corps' },
      { key: 'm2_comp_syntaxique_orale',   label: 'Compréhension syntaxique orale (jugement + correction)', max: 4, hint: '(a) jugement auditif (b) choix d\'image. Phrases à contre-usage' },
    ],
  },
  {
    id: 'm3', num: 3,
    label: 'Expression écrite',
    description: 'Expression spontanée, dénomination, lecture haute voix, dictée, copie. ~30 points.',
    subtests: [
      { key: 'm3_expression_spontanee', label: 'Expression écrite spontanée (nom + prénom)', max: 1 },
      { key: 'm3_denomination_ecrite',  label: 'Dénomination écrite',           max: 4,  hint: '2 substantifs + 2 verbes' },
      { key: 'm3_lecture_haute_voix',   label: 'Lecture à haute voix (mots / phrases / pseudomots)', max: 9, hint: 'Mots réguliers/irréguliers, 1-4 syllabes. Temps enregistré (voie lexicale vs assemblage)' },
      { key: 'm3_dictee_lettres_syll',  label: 'Dictée — lettres & syllabes',   max: 4 },
      { key: 'm3_dictee_mots',          label: 'Dictée — mots',                 max: 6,  hint: 'Irréguliers et réguliers — comparer voies' },
      { key: 'm3_dictee_pseudomots',    label: 'Dictée — pseudomots',           max: 3,  hint: 'Voie d\'assemblage en écriture' },
      { key: 'm3_dictee_phrase',        label: 'Dictée — phrase',               max: 1 },
      { key: 'm3_copie',                label: 'Copie de mots (1 régulier + 1 irrégulier)', max: 2 },
    ],
  },
  {
    id: 'm4', num: 4,
    label: 'Compréhension écrite',
    description: 'Désignation mots écrits, appariement mots-images, sériation, compréhension syntaxique. ~9 points.',
    subtests: [
      { key: 'm4_designation_mots_ecrits', label: 'Désignation de mots écrits', max: 4, hint: 'Choix multiple 4-6-9 propositions, distracteurs visuo-sémantiques/phonologiques/sémantiques/neutres' },
      { key: 'm4_appariement_mots_images', label: 'Appariement mots-images',    max: 1, hint: '2 séries de 4 images + 4 mots à associer' },
      { key: 'm4_seriation_phrases',       label: 'Sériation (phrases + mots)', max: 2 },
      { key: 'm4_comp_syntaxique_ecrite',  label: 'Compréhension syntaxique écrite', max: 2, hint: 'Jugement sans demander correction — prépositions, conjonctions, concordance' },
    ],
  },
]

interface SubtestState {
  score: string
  observation: string
}

interface State {
  version: typeof VERSION_OPTIONS[number]['key']
  etiologie: typeof ETIOLOGIE_OPTIONS[number]['key']
  phase: typeof PHASE_OPTIONS[number]['key']
  subtests: Record<string, SubtestState>
}

function emptyState(): State {
  const st: Record<string, SubtestState> = {}
  for (const m of MODULES) for (const s of m.subtests) st[s.key] = { score: '', observation: '' }
  return { version: '', etiologie: '', phase: '', subtests: st }
}

export default function BiaScoresInput({ notes, onNotesChange, onResultatsChange }: Props) {
  const [state, setState] = useState<State>(emptyState)
  const [expanded, setExpanded] = useState<Record<string, boolean>>({ m1: true, m2: false, m3: false, m4: false })

  const totalParModule = useMemo(() => {
    const totals: Record<string, { obtenu: number; max: number; count: number }> = {}
    for (const m of MODULES) {
      let obtenu = 0
      let max = 0
      let count = 0
      for (const s of m.subtests) {
        const raw = (state.subtests[s.key]?.score || '').trim()
        if (raw === '') continue
        const v = parseFloat(raw.replace(',', '.'))
        if (isNaN(v)) continue
        obtenu += v
        if (s.max) max += s.max
        count++
      }
      totals[m.id] = { obtenu, max, count }
    }
    return totals
  }, [state.subtests])

  const totalGlobal = useMemo(() => {
    let obtenu = 0
    let max = 0
    for (const m of MODULES) {
      obtenu += totalParModule[m.id]?.obtenu ?? 0
      max += totalParModule[m.id]?.max ?? 0
    }
    return { obtenu, max }
  }, [totalParModule])

  useEffect(() => {
    const hasAny = Object.values(state.subtests).some(s => s.score.trim() || s.observation.trim())
    if (!hasAny && !state.etiologie && !state.phase && !state.version) {
      onResultatsChange('')
      return
    }
    const lines: string[] = []
    lines.push('=== BIA — Bilan Informatisé d\'Aphasie (Weill-Chounlamountry, Oudry, Gatignol, Jutteau — Ortho Édition 2023) ===')
    if (state.version) lines.push(`Version : ${VERSION_OPTIONS.find(o => o.key === state.version)?.label}`)
    if (state.etiologie) lines.push(`Étiologie : ${ETIOLOGIE_OPTIONS.find(o => o.key === state.etiologie)?.label}`)
    if (state.phase) lines.push(`Phase clinique : ${PHASE_OPTIONS.find(o => o.key === state.phase)?.label}`)
    lines.push('')

    for (const m of MODULES) {
      const hasData = m.subtests.some(s => state.subtests[s.key]?.score.trim() || state.subtests[s.key]?.observation.trim())
      if (!hasData) continue
      const tot = totalParModule[m.id]
      lines.push(`--- Module ${m.num} — ${m.label}${tot?.max ? ` (${tot.obtenu.toFixed(1)}/${tot.max})` : ''} ---`)
      for (const s of m.subtests) {
        const st = state.subtests[s.key]
        if (!st.score.trim() && !st.observation.trim()) continue
        const suffix = s.max ? `/${s.max}` : ''
        lines.push(`${s.label} : ${st.score.trim()}${suffix}`)
        if (st.observation.trim()) lines.push(`  Observation : ${st.observation.trim()}`)
      }
      lines.push('')
    }

    if (totalGlobal.max > 0) {
      lines.push(`TOTAL global : ${totalGlobal.obtenu.toFixed(1)}/${totalGlobal.max}`)
    }
    onResultatsChange(lines.join('\n'))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, totalParModule, totalGlobal])

  const setField = (key: string, field: 'score' | 'observation', v: string) => {
    setState(s => ({ ...s, subtests: { ...s.subtests, [key]: { ...s.subtests[key], [field]: v } } }))
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-2 p-3 rounded-lg border border-indigo-200 bg-indigo-50">
        <MessageSquare size={18} className="text-indigo-600 shrink-0 mt-0.5" />
        <div className="text-sm">
          <p className="font-semibold text-indigo-900">Saisie structurée BIA — bilan aphasie adulte (4 modules)</p>
          <p className="text-indigo-700 text-xs mt-0.5 leading-relaxed">
            Reportez les scores partiels de chaque subtest. Le logiciel BIA calcule automatiquement les totaux et les
            écarts à la norme. <strong>Analyse qualitative cruciale</strong> en dénomination (type de paraphasie,
            manque du mot, néologismes). Ne pas confondre aphasie / dysarthrie (BECD) / démence (MoCA).
          </p>
        </div>
      </div>

      {/* Contexte clinique (version + étiologie + phase) */}
      <div className="rounded-lg border border-gray-200 bg-white p-4 space-y-3">
        <p className="text-sm font-semibold text-gray-900 flex items-center gap-1.5">
          <Info size={14} className="text-indigo-600" />
          Contexte clinique
        </p>
        <div className="grid sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Version BIA</label>
            <select
              value={state.version}
              onChange={(e) => setState(s => ({ ...s, version: e.target.value as State['version'] }))}
              className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:ring-2 focus:ring-indigo-400"
            >
              {VERSION_OPTIONS.map(o => (<option key={o.key} value={o.key}>{o.label}</option>))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Étiologie</label>
            <select
              value={state.etiologie}
              onChange={(e) => setState(s => ({ ...s, etiologie: e.target.value as State['etiologie'] }))}
              className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:ring-2 focus:ring-indigo-400"
            >
              {ETIOLOGIE_OPTIONS.map(o => (<option key={o.key} value={o.key}>{o.label}</option>))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Phase clinique</label>
            <select
              value={state.phase}
              onChange={(e) => setState(s => ({ ...s, phase: e.target.value as State['phase'] }))}
              className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:ring-2 focus:ring-indigo-400"
            >
              {PHASE_OPTIONS.map(o => (<option key={o.key} value={o.key}>{o.label}</option>))}
            </select>
          </div>
        </div>
      </div>

      {/* Synthèse totaux par module */}
      {totalGlobal.max > 0 && (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
          <p className="text-xs font-semibold text-gray-700 mb-2">
            Total global : <span className="text-base text-indigo-700">{totalGlobal.obtenu.toFixed(1)}/{totalGlobal.max}</span>
          </p>
          <div className="grid sm:grid-cols-4 gap-2 text-xs">
            {MODULES.map(m => {
              const t = totalParModule[m.id]
              if (!t || t.count === 0) return null
              return (
                <div key={m.id} className="px-2 py-1.5 rounded bg-white border border-gray-200">
                  <p className="text-[10px] text-gray-500 font-mono">Module {m.num}</p>
                  <p className="text-sm font-semibold text-gray-900">
                    {t.obtenu.toFixed(1)}{t.max ? `/${t.max}` : ''}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* 4 modules en accordéon */}
      {MODULES.map(m => {
        const open = expanded[m.id]
        return (
          <div key={m.id} className="rounded-lg border border-gray-200 bg-white">
            <button
              type="button"
              onClick={() => setExpanded(p => ({ ...p, [m.id]: !p[m.id] }))}
              className="w-full px-4 py-3 flex items-center justify-between gap-3 text-left hover:bg-gray-50"
            >
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-900">Module {m.num} — {m.label}</p>
                <p className="text-xs text-gray-500 mt-0.5">{m.description}</p>
              </div>
              <ChevronDown size={16} className={`shrink-0 transition-transform ${open ? '' : '-rotate-90'}`} />
            </button>

            {open && (
              <div className="border-t border-gray-100 px-4 py-3 space-y-3">
                {m.subtests.map(s => {
                  const st = state.subtests[s.key]
                  return (
                    <div key={s.key} className="rounded bg-gray-50/50 border border-gray-100 p-2">
                      <p className="text-xs font-semibold text-gray-800">{s.label}</p>
                      {s.hint && <p className="text-[10px] text-gray-500 mb-1">{s.hint}</p>}
                      <div className="flex items-center gap-2 mt-1">
                        <input
                          type="text"
                          value={st.score}
                          onChange={(e) => setField(s.key, 'score', e.target.value)}
                          placeholder="Score"
                          className="w-24 px-2 py-1 border border-gray-300 rounded text-xs font-mono text-center"
                        />
                        {s.max && <span className="text-xs text-gray-500">/ {s.max}</span>}
                      </div>
                      <textarea
                        value={st.observation}
                        onChange={(e) => setField(s.key, 'observation', e.target.value)}
                        rows={2}
                        placeholder={s.key === 'm1_denomination'
                          ? 'Ex. 4 paraphasies sémantiques, 2 phonologiques, manque du mot massif…'
                          : 'Observation qualitative : type d\'erreurs, stratégies, latences, persévérations…'}
                        className="w-full mt-1.5 px-2 py-1 border border-gray-300 rounded text-xs leading-relaxed resize-y"
                      />
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}

      {/* Notes globales */}
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <div className="flex items-center justify-between mb-1">
          <label className="text-sm font-medium text-gray-800">
            Notes globales sur la séance (fluence, anosognosie, sévérité, type d&apos;aphasie suspecté)
          </label>
          <MicButton value={notes} onChange={onNotesChange} />
        </div>
        <textarea
          value={notes}
          onChange={(e) => onNotesChange(e.target.value)}
          rows={3}
          placeholder="Ex. patient fluent avec jargon et paraphasies sémantiques, anosognosie marquée. Profil compatible avec Wernicke. Bilan déglutition à prévoir…"
          className="w-full px-3 py-2 border border-gray-300 rounded text-sm leading-relaxed resize-y focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />
      </div>

      {/* Rappels cliniques */}
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
        <div className="flex items-start gap-2">
          <Brain size={16} className="text-amber-700 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-900 leading-relaxed">
            <p className="font-semibold mb-1">Rappels cliniques BIA</p>
            <ul className="list-disc list-inside space-y-0.5">
              <li>Le <strong>type d&apos;erreur</strong> en dénomination (paraphasie sémantique / phonologique / visuelle, manque du mot, néologismes) est aussi diagnostique que le score.</li>
              <li>Comparer <strong>Dénomination (M1) vs Désignation (M2)</strong> : préservation désignation = manque du mot pur ; effondrement des deux = atteinte sémantique.</li>
              <li>Croiser <strong>Oral vs Écrit</strong> et <strong>Expression vs Compréhension</strong> pour orienter le type d&apos;aphasie (Broca / Wernicke / conduction / transcorticale / globale / anomique).</li>
              <li><strong>Bilan déglutition + bilan dysarthrie (BECD) systématiques</strong> en cas d&apos;aphasie post-AVC.</li>
              <li>Aggravation progressive du langage chez l&apos;adulte → suspicion <strong>APP</strong>, orientation neurologie + IRM.</li>
              <li>Ne JAMAIS poser l&apos;étiologie (AVC vs APP vs démence) — relève du neurologue.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
