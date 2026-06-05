'use client'

/**
 * Saisie structurée GréMots (Béziy, Pariente, Tran, Macoir et al., collectif
 * GréMots, De Boeck Supérieur 2016 / HappyNeuron 2021).
 *
 * 22 épreuves officielles du cahier de passation HappyNeuron 2021.
 * Population : adultes 50+ avec suspicion ou diagnostic de pathologie
 * neurodégénérative (MA, APP sémantique / non fluente / logopénique, DLFT).
 * Stratification : NSC (1/2/3) × tranche d'âge (50-59 / 60-69 / 70-79 / 80+).
 *
 * Scoring officiel (manuel section 2.4) :
 * - Score Strict (vert) : 1 pt, réponse correcte en 1ère intention.
 * - Score Large (orange) : 1 pt, réponse correcte en 2e intention
 *   (autocorrection, relecture consigne).
 * - Erreur (rouge) : 0 pt.
 * - Score Strict TOTAL = Strict + Large (les 2 catégories réussies comptent).
 *
 * L'ortho saisit pour chaque épreuve :
 * - Score Strict, Score Large, Erreur (max selon épreuve).
 * - Temps en secondes (épreuves chronométrées).
 * - Percentile observé sur le logiciel HappyNeuron (P1-P5, P6-P10, P11-P25,
 *   P26-P49, P50-P75, P76-P100). La grille suit la convention 6 zones Laurie
 *   (refonte ortho.ia 2026-05-ter) cohérente avec les autres bilans HappyNeuron.
 * - Observation qualitative libre (types d'erreurs, paraphasies, conduites
 *   d'approche).
 *
 * L'épreuve 1 (Entretien / Langage spontané) est purement qualitative,
 * uniquement une textarea.
 *
 * Couplage : nouveau-crbo/page.tsx, test_utilise === ['GréMots'].
 *
 * V2 livrée 2026-06-05 (après V1 free_text textarea générique).
 */

import { useEffect, useMemo, useRef, useState } from 'react'
import { Brain, ChevronDown, FileUp, Loader2 } from 'lucide-react'

interface Props {
  notes: string
  onNotesChange: (v: string) => void
  onResultatsChange: (normalized: string) => void
  onError?: (msg: string) => void
}

type Nsc = '' | '1' | '2' | '3'
type TrancheAge = '' | '50-59' | '60-69' | '70-79' | '80+'

const NSC_OPTIONS: Array<{ key: Nsc; label: string; help: string }> = [
  { key: '1', label: 'NSC 1', help: 'Niveau primaire (scolarité ≤ 9 ans)' },
  { key: '2', label: 'NSC 2', help: 'Niveau secondaire (Bac / CAP / BEP)' },
  { key: '3', label: 'NSC 3', help: 'Niveau supérieur (post-Bac)' },
]
const TRANCHE_OPTIONS: Array<{ key: TrancheAge; label: string }> = [
  { key: '50-59', label: '50-59 ans' },
  { key: '60-69', label: '60-69 ans' },
  { key: '70-79', label: '70-79 ans' },
  { key: '80+',   label: '80 ans et plus' },
]

/** Grille percentile alignée sur les autres bilans HappyNeuron (Exalang,
 *  PREDIMEM, Examath) — grille 6 zones Laurie refonte 2026-05-ter. */
type Percentile = '' | 'p76-100' | 'p50-75' | 'p26-49' | 'p11-25' | 'p6-10' | 'p1-5'

const PERCENTILE_OPTIONS: Array<{ key: Exclude<Percentile, ''>; label: string; clinical: string; bg: string; text: string }> = [
  { key: 'p76-100', label: 'P76 - P100', clinical: 'Excellent',          bg: 'bg-emerald-600',  text: 'text-white' },
  { key: 'p50-75',  label: 'P50 - P75',  clinical: 'Moyenne haute',      bg: 'bg-emerald-400',  text: 'text-emerald-900' },
  { key: 'p26-49',  label: 'P26 - P49',  clinical: 'Moyenne basse',      bg: 'bg-yellow-300',   text: 'text-yellow-900' },
  { key: 'p11-25',  label: 'P11 - P25',  clinical: 'Zone de fragilité',  bg: 'bg-amber-400',    text: 'text-amber-900' },
  { key: 'p6-10',   label: 'P6 - P10',   clinical: 'Difficulté',         bg: 'bg-orange-500',   text: 'text-white' },
  { key: 'p1-5',    label: 'P1 - P5',    clinical: 'Difficulté sévère',  bg: 'bg-red-600',      text: 'text-white' },
]

/** Identifiants stables des 22 épreuves GréMots. Ne PAS renommer une fois
 *  en prod (la sortie normalisée s'appuie sur les labels visibles). */
type EpreuveKey =
  | 'e01_langage_spontane'
  | 'e02_repetition_mots'
  | 'e03_repetition_phrases'
  | 'e04_fluences_verbes'
  | 'e05_fluences_fruits'
  | 'e06_fluences_lettre_v'
  | 'e07_execution_ordres'
  | 'e08_denomination_objets'
  | 'e09_denomination_actions'
  | 'e10_denomination_personnes'
  | 'e11_elaboration_phrases'
  | 'e12_discours_narratif'
  | 'e13_comprehension_syntaxique'
  | 'e14_lecture_mots'
  | 'e15_lecture_logatomes'
  | 'e16_verification_oral_photo'
  | 'e17_ecriture_automatique'
  | 'e18_ecriture_mots'
  | 'e19_ecriture_logatomes'
  | 'e20_ecriture_phrases'
  | 'e21_comprehension_texte_ecrit'
  | 'e22_verification_ecrit_photo'

interface Epreuve {
  key: EpreuveKey
  num: number
  /** Libellé exact du cahier de passation HappyNeuron 2021. */
  label: string
  /** Domaine officiel GréMots (manuel section 2). */
  domaine: string
  /** Score brut maximum si défini (sert au pre-fill du placeholder). Optionnel. */
  scoreMax?: number
  /** L'épreuve a-t-elle un temps chronométré à reporter ? */
  chronometree?: boolean
  /** Épreuve purement qualitative (1) — pas de scoring chiffré. */
  qualitative?: boolean
}

const EPREUVES: Epreuve[] = [
  { key: 'e01_langage_spontane',           num: 1,  label: 'Entretien / Langage spontané',              domaine: 'Discursif',                              qualitative: true },
  { key: 'e02_repetition_mots',            num: 2,  label: 'Répétition de mots',                         domaine: 'Répétition',                             scoreMax: 20, chronometree: true },
  { key: 'e03_repetition_phrases',         num: 3,  label: 'Répétition de phrases',                      domaine: 'Répétition',                             scoreMax: 15, chronometree: true },
  { key: 'e04_fluences_verbes',            num: 4,  label: 'Fluences, verbes (1 min)',                   domaine: 'Production lexicale',                    chronometree: true },
  { key: 'e05_fluences_fruits',            num: 5,  label: 'Fluences, fruits (1 min)',                   domaine: 'Production lexicale',                    chronometree: true },
  { key: 'e06_fluences_lettre_v',          num: 6,  label: 'Fluences, lettre V (1 min)',                 domaine: 'Production lexicale',                    chronometree: true },
  { key: 'e07_execution_ordres',           num: 7,  label: 'Exécution d\'ordres',                        domaine: 'Compréhension syntaxique',               scoreMax: 30 },
  { key: 'e08_denomination_objets',        num: 8,  label: 'Dénomination orale, objets',                 domaine: 'Production lexicale',                    scoreMax: 40, chronometree: true },
  { key: 'e09_denomination_actions',       num: 9,  label: 'Dénomination orale, actions',                domaine: 'Production lexicale',                    scoreMax: 40, chronometree: true },
  { key: 'e10_denomination_personnes',     num: 10, label: 'Dénomination orale, personnes célèbres',    domaine: 'Production lexicale',                    scoreMax: 30, chronometree: true },
  { key: 'e11_elaboration_phrases',        num: 11, label: 'Élaboration de phrases',                    domaine: 'Production syntaxique',                  scoreMax: 15 },
  { key: 'e12_discours_narratif',          num: 12, label: 'Discours narratif',                          domaine: 'Discursif',                              scoreMax: 30 },
  { key: 'e13_comprehension_syntaxique',   num: 13, label: 'Compréhension syntaxique',                   domaine: 'Compréhension syntaxique',               scoreMax: 30 },
  { key: 'e14_lecture_mots',               num: 14, label: 'Lecture à voix haute de mots',               domaine: 'Lecture',                                scoreMax: 40, chronometree: true },
  { key: 'e15_lecture_logatomes',          num: 15, label: 'Lecture à voix haute de logatomes',          domaine: 'Lecture',                                scoreMax: 20, chronometree: true },
  { key: 'e16_verification_oral_photo',    num: 16, label: 'Vérification mot oral, photo',               domaine: 'Compréhension lexicale',                 scoreMax: 40 },
  { key: 'e17_ecriture_automatique',       num: 17, label: 'Écriture automatique',                       domaine: 'Écriture',                               scoreMax: 10 },
  { key: 'e18_ecriture_mots',              num: 18, label: 'Écriture sous dictée de mots',               domaine: 'Écriture',                               scoreMax: 40 },
  { key: 'e19_ecriture_logatomes',         num: 19, label: 'Répétition et écriture sous dictée de logatomes', domaine: 'Écriture',                      scoreMax: 20 },
  { key: 'e20_ecriture_phrases',           num: 20, label: 'Écriture sous dictée de phrases',            domaine: 'Écriture',                               scoreMax: 30 },
  { key: 'e21_comprehension_texte_ecrit',  num: 21, label: 'Compréhension de texte écrit',               domaine: 'Discursif',                              scoreMax: 20 },
  { key: 'e22_verification_ecrit_photo',   num: 22, label: 'Vérification mot écrit, photo',              domaine: 'Compréhension lexicale',                 scoreMax: 40 },
]

interface EpreuveState {
  /** Score Strict (réponse en 1ère intention). */
  strict: string
  /** Score Large (réponse en 2e intention après autocorrection ou relecture). */
  large: string
  /** Erreur (réponse incorrecte ou absence). */
  erreur: string
  /** Temps en secondes (épreuves chronométrées). */
  temps: string
  /** Percentile observé sur le logiciel HappyNeuron. */
  percentile: Percentile
  /** Observation qualitative libre (paraphasies, conduites d'approche, etc.). */
  observation: string
  /** Pour épreuve 1 (Entretien) : description du langage spontané. */
  qualitative_only: string
}

const emptyEpreuveState = (): EpreuveState => ({
  strict: '',
  large: '',
  erreur: '',
  temps: '',
  percentile: '',
  observation: '',
  qualitative_only: '',
})

interface State {
  nsc: Nsc
  trancheAge: TrancheAge
  epreuves: Record<EpreuveKey, EpreuveState>
}

const initialState: State = {
  nsc: '',
  trancheAge: '',
  epreuves: EPREUVES.reduce((acc, e) => {
    acc[e.key] = emptyEpreuveState()
    return acc
  }, {} as Record<EpreuveKey, EpreuveState>),
}

const parseInt0 = (s: string): number => {
  const n = parseInt(s, 10)
  return Number.isFinite(n) && n >= 0 ? n : 0
}

export default function GremotsScoresInput({ notes, onNotesChange, onResultatsChange, onError }: Props) {
  const [state, setState] = useState<State>(initialState)
  const [expanded, setExpanded] = useState<Record<EpreuveKey, boolean>>(() =>
    EPREUVES.reduce((acc, e) => {
      acc[e.key] = false
      return acc
    }, {} as Record<EpreuveKey, boolean>)
  )

  // Import PDF GréMots — route /api/extract-gremots-pdf.
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [importing, setImporting] = useState(false)
  const [importInfo, setImportInfo] = useState<string | null>(null)

  async function handleImportFile(file: File) {
    setImporting(true)
    setImportInfo(null)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/extract-gremots-pdf', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok || !data?.success) {
        const msg = data?.error ?? "Échec de l'import PDF."
        onError?.(msg)
        setImportInfo(`Erreur : ${msg}`)
        return
      }
      const ex = data.extracted as {
        nsc: string
        trancheAge: string
        epreuves: Array<{
          key: string
          strict: string
          large: string
          erreur: string
          temps: string
          percentile: string
          observation: string
          qualitative_only: string
        }>
      }
      setState((prev) => {
        const next: State = {
          nsc: (ex.nsc || prev.nsc) as State['nsc'],
          trancheAge: (ex.trancheAge || prev.trancheAge) as State['trancheAge'],
          epreuves: { ...prev.epreuves },
        }
        for (const item of ex.epreuves ?? []) {
          if (!(item.key in next.epreuves)) continue
          const cur = next.epreuves[item.key as EpreuveKey]
          next.epreuves[item.key as EpreuveKey] = {
            strict: item.strict || cur.strict,
            large: item.large || cur.large,
            erreur: item.erreur || cur.erreur,
            temps: item.temps || cur.temps,
            percentile: (item.percentile as Percentile) || cur.percentile,
            observation: item.observation || cur.observation,
            qualitative_only: item.qualitative_only || cur.qualitative_only,
          }
        }
        return next
      })
      const epreuvesImported = (ex.epreuves ?? []).length
      setImportInfo(
        `Import réussi : ${epreuvesImported} épreuve${epreuvesImported > 1 ? 's' : ''} pré-remplie${epreuvesImported > 1 ? 's' : ''}. Vérifiez et complétez si besoin.`,
      )
    } catch (err: any) {
      const msg = err?.message ?? "Erreur réseau durant l'import."
      onError?.(msg)
      setImportInfo(`Erreur : ${msg}`)
    } finally {
      setImporting(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const updateEpreuve = (key: EpreuveKey, patch: Partial<EpreuveState>) => {
    setState((s) => ({
      ...s,
      epreuves: { ...s.epreuves, [key]: { ...s.epreuves[key], ...patch } },
    }))
  }

  /** Score Strict TOTAL = Σ(strict) + Σ(large) — convention GréMots officielle. */
  const scoreStrictTotal = useMemo(() => {
    let total = 0
    let max = 0
    for (const e of EPREUVES) {
      if (e.qualitative) continue
      const st = state.epreuves[e.key]
      total += parseInt0(st.strict) + parseInt0(st.large)
      if (e.scoreMax) max += e.scoreMax
    }
    return { total, max }
  }, [state.epreuves])

  /** Compte les épreuves cotées par percentile (pour affichage synthétique). */
  const percentileCounts = useMemo(() => {
    const counts: Record<Exclude<Percentile, ''>, number> = {
      'p76-100': 0, 'p50-75': 0, 'p26-49': 0, 'p11-25': 0, 'p6-10': 0, 'p1-5': 0,
    }
    for (const e of EPREUVES) {
      const p = state.epreuves[e.key].percentile
      if (p) counts[p as Exclude<Percentile, ''>]++
    }
    return counts
  }, [state.epreuves])

  /** Émet la string normalisée. Format lisible par l'IA, aligné sur le
   *  pattern PrediFex / PREDIMEM (bloc par épreuve avec score + temps +
   *  percentile + observation). */
  useEffect(() => {
    const hasAnyInput =
      state.nsc !== '' ||
      state.trancheAge !== '' ||
      EPREUVES.some((e) => {
        const st = state.epreuves[e.key]
        return (
          st.strict || st.large || st.erreur || st.temps || st.percentile ||
          st.observation || st.qualitative_only
        )
      })
    if (!hasAnyInput) {
      onResultatsChange('')
      return
    }

    const lines: string[] = []
    lines.push("=== GréMots (Béziy, Pariente, Tran, Macoir et al., collectif GréMots, De Boeck Supérieur 2016 / HappyNeuron 2021) ===")
    const nscLabel = NSC_OPTIONS.find((o) => o.key === state.nsc)?.label || '(NSC non précisé)'
    const trancheLabel = TRANCHE_OPTIONS.find((o) => o.key === state.trancheAge)?.label || '(tranche d\'âge non précisée)'
    lines.push(`Stratification : ${nscLabel} × ${trancheLabel}`)
    lines.push('')

    for (const e of EPREUVES) {
      const st = state.epreuves[e.key]
      if (e.qualitative) {
        if (st.qualitative_only.trim()) {
          lines.push(`--- Épreuve ${e.num}, ${e.label} (qualitatif) ---`)
          lines.push(st.qualitative_only.trim())
          lines.push('')
        }
        continue
      }
      const strict = parseInt0(st.strict)
      const large = parseInt0(st.large)
      const erreur = parseInt0(st.erreur)
      const hasScore = strict > 0 || large > 0 || erreur > 0 || st.strict || st.large || st.erreur
      const hasTemps = st.temps.trim() !== ''
      const hasPercentile = st.percentile !== ''
      const hasObs = st.observation.trim() !== ''
      if (!hasScore && !hasTemps && !hasPercentile && !hasObs) continue

      lines.push(`--- Épreuve ${e.num}, ${e.label} ---`)
      if (hasScore) {
        const scoreStrictTotalEpreuve = strict + large
        const max = e.scoreMax ? `/${e.scoreMax}` : ''
        lines.push(
          `Score Strict ${strict}${max}, Score Large ${large}${max}, Erreur ${erreur}${max} ` +
          `(Score Strict TOTAL = Strict + Large = ${scoreStrictTotalEpreuve}${max})`
        )
      }
      if (hasTemps) {
        lines.push(`Temps : ${st.temps.trim()} sec`)
      }
      if (hasPercentile) {
        const p = PERCENTILE_OPTIONS.find((po) => po.key === st.percentile)!
        lines.push(`Percentile (logiciel HappyNeuron) : ${p.label} (${p.clinical})`)
      }
      if (hasObs) {
        lines.push(`Observation : ${st.observation.trim()}`)
      }
      lines.push('')
    }

    if (scoreStrictTotal.max > 0) {
      lines.push('--- Synthèse Score Strict GréMots (convention manuel section 2.4) ---')
      lines.push(`Score Strict TOTAL = ${scoreStrictTotal.total}/${scoreStrictTotal.max}`)
    }

    const totalPct = (Object.values(percentileCounts) as number[]).reduce((a, b) => a + b, 0)
    if (totalPct > 0) {
      lines.push('--- Synthèse percentiles ---')
      lines.push(`Excellent (P76-P100) : ${percentileCounts['p76-100']}`)
      lines.push(`Moyenne haute (P50-P75) : ${percentileCounts['p50-75']}`)
      lines.push(`Moyenne basse (P26-P49) : ${percentileCounts['p26-49']}`)
      lines.push(`Zone de fragilité (P11-P25) : ${percentileCounts['p11-25']}`)
      lines.push(`Difficulté (P6-P10) : ${percentileCounts['p6-10']}`)
      lines.push(`Difficulté sévère (P1-P5) : ${percentileCounts['p1-5']}`)
    }

    onResultatsChange(lines.join('\n'))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, scoreStrictTotal, percentileCounts])

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-blue-200 bg-blue-50/60 p-4">
        <div className="flex items-center gap-2 mb-2">
          <Brain size={18} className="text-blue-700" />
          <h3 className="font-semibold text-blue-900">GréMots, saisie structurée</h3>
        </div>
        <p className="text-sm text-blue-800/90">
          Batterie de référence pour l&apos;évaluation du langage dans les pathologies neurodégénératives
          (MA, APP sémantique / non fluente / logopénique, DLFT). 22 épreuves officielles.
          Cotation 3 scores : <strong>Score Strict</strong> (1ère intention), <strong>Score Large</strong> (2e intention),
          <strong> Erreur</strong>. Score Strict TOTAL = Strict + Large (manuel section 2.4).
        </p>
      </div>

      {/* Import PDF / Word (converti en PDF) */}
      <div className="rounded-lg border border-sky-200 bg-sky-50/60 p-4">
        <div className="flex items-start gap-3">
          <FileUp size={18} className="text-sky-700 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-sky-900 mb-1">
              Importer un rapport PDF HappyNeuron ou un cahier de passation scanné
            </p>
            <p className="text-xs text-sky-800/90 mb-3">
              L&apos;IA extrait automatiquement la stratification NSC × tranche d&apos;âge et les scores
              des 22 épreuves (Strict / Large / Erreur + temps + percentile + observations). Vérifiez
              et complétez après import. Les documents Word doivent être convertis en PDF préalablement.
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,application/pdf"
              className="hidden"
              onChange={(ev) => {
                const f = ev.target.files?.[0]
                if (f) void handleImportFile(f)
              }}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={importing}
              className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium bg-sky-600 text-white rounded-md hover:bg-sky-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {importing ? <Loader2 size={14} className="animate-spin" /> : <FileUp size={14} />}
              {importing ? 'Extraction en cours…' : 'Importer un PDF'}
            </button>
            {importInfo && (
              <p
                className={`mt-2 text-xs ${
                  importInfo.startsWith('Erreur') ? 'text-red-700' : 'text-emerald-700'
                }`}
              >
                {importInfo}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Stratification NSC × tranche d'âge */}
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <label className="block text-sm font-semibold text-gray-900 mb-2">
          Stratification (étalonnage NSC × tranche d&apos;âge)
        </label>
        <p className="text-xs text-gray-600 mb-3">
          Les percentiles GréMots sont stratifiés par NSC ET tranche d&apos;âge. Renseignez les deux pour
          permettre à l&apos;IA d&apos;ancrer le diagnostic sur la bonne population de référence.
        </p>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Niveau socio-culturel (NSC)</label>
            <div className="flex flex-col gap-1">
              {NSC_OPTIONS.map((opt) => (
                <label key={opt.key} className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="radio"
                    name="nsc"
                    checked={state.nsc === opt.key}
                    onChange={() => setState((s) => ({ ...s, nsc: opt.key }))}
                    className="h-4 w-4"
                  />
                  <span><strong>{opt.label}</strong> <span className="text-gray-500">— {opt.help}</span></span>
                </label>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Tranche d&apos;âge</label>
            <div className="flex flex-col gap-1">
              {TRANCHE_OPTIONS.map((opt) => (
                <label key={opt.key} className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="radio"
                    name="trancheAge"
                    checked={state.trancheAge === opt.key}
                    onChange={() => setState((s) => ({ ...s, trancheAge: opt.key }))}
                    className="h-4 w-4"
                  />
                  <span>{opt.label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 22 épreuves */}
      <div className="space-y-2">
        {EPREUVES.map((e) => {
          const st = state.epreuves[e.key]
          const isOpen = expanded[e.key]
          const hasInput =
            st.strict || st.large || st.erreur || st.temps || st.percentile ||
            st.observation || st.qualitative_only
          return (
            <div
              key={e.key}
              className={`rounded-lg border ${hasInput ? 'border-blue-300 bg-blue-50/30' : 'border-gray-200 bg-white'}`}
            >
              <button
                type="button"
                onClick={() => setExpanded((x) => ({ ...x, [e.key]: !x[e.key] }))}
                className="w-full px-4 py-2.5 flex items-center justify-between text-left hover:bg-gray-50 rounded-lg"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <span className="text-xs font-mono bg-gray-100 text-gray-700 rounded px-1.5 py-0.5">
                    {String(e.num).padStart(2, '0')}
                  </span>
                  <span className="text-sm font-medium text-gray-900 truncate">{e.label}</span>
                  <span className="text-xs text-gray-500 hidden sm:inline">{e.domaine}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {hasInput && (
                    <span className="text-xs text-blue-700 font-medium">saisi</span>
                  )}
                  <ChevronDown
                    size={16}
                    className={`text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                  />
                </div>
              </button>

              {isOpen && (
                <div className="px-4 pb-4 pt-1 space-y-3 border-t border-gray-100">
                  {e.qualitative ? (
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Description du langage spontané
                      </label>
                      <textarea
                        value={st.qualitative_only}
                        onChange={(ev) => updateEpreuve(e.key, { qualitative_only: ev.target.value })}
                        rows={4}
                        placeholder="Fluidité, débit, prosodie, recherches lexicales, paraphasies en spontané, cohérence du discours, manque du mot, circonlocutions, persévérations..."
                        className="w-full text-sm rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                      />
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Score Strict {e.scoreMax ? `(/${e.scoreMax})` : ''}
                          </label>
                          <input
                            type="number"
                            min="0"
                            max={e.scoreMax}
                            value={st.strict}
                            onChange={(ev) => updateEpreuve(e.key, { strict: ev.target.value })}
                            className="w-full text-sm rounded-md border border-gray-300 px-2 py-1.5 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Score Large {e.scoreMax ? `(/${e.scoreMax})` : ''}
                          </label>
                          <input
                            type="number"
                            min="0"
                            max={e.scoreMax}
                            value={st.large}
                            onChange={(ev) => updateEpreuve(e.key, { large: ev.target.value })}
                            className="w-full text-sm rounded-md border border-gray-300 px-2 py-1.5 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Erreur {e.scoreMax ? `(/${e.scoreMax})` : ''}
                          </label>
                          <input
                            type="number"
                            min="0"
                            max={e.scoreMax}
                            value={st.erreur}
                            onChange={(ev) => updateEpreuve(e.key, { erreur: ev.target.value })}
                            className="w-full text-sm rounded-md border border-gray-300 px-2 py-1.5 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                          />
                        </div>
                        {e.chronometree && (
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Temps (sec)
                            </label>
                            <input
                              type="number"
                              min="0"
                              value={st.temps}
                              onChange={(ev) => updateEpreuve(e.key, { temps: ev.target.value })}
                              className="w-full text-sm rounded-md border border-gray-300 px-2 py-1.5 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                            />
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Percentile (logiciel HappyNeuron)
                        </label>
                        <div className="flex flex-wrap gap-1.5">
                          {PERCENTILE_OPTIONS.map((p) => {
                            const selected = st.percentile === p.key
                            return (
                              <button
                                key={p.key}
                                type="button"
                                onClick={() => updateEpreuve(e.key, { percentile: selected ? '' : p.key })}
                                className={`text-xs px-2 py-1 rounded-md font-medium transition ${
                                  selected ? `${p.bg} ${p.text} ring-2 ring-offset-1 ring-gray-400` : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                                title={p.clinical}
                              >
                                {p.label}
                              </button>
                            )
                          })}
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Observation qualitative
                        </label>
                        <textarea
                          value={st.observation}
                          onChange={(ev) => updateEpreuve(e.key, { observation: ev.target.value })}
                          rows={2}
                          placeholder="Types d'erreurs, paraphasies sémantiques/formelles/mixtes, conduites d'approche, persévérations, dénominations vides..."
                          className="w-full text-sm rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                        />
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Notes globales orthophoniste */}
      <div>
        <label className="block text-sm font-medium text-gray-900 mb-1">
          Notes libres complémentaires (comportement séance, anamnèse, observations transversales)
        </label>
        <textarea
          value={notes}
          onChange={(ev) => onNotesChange(ev.target.value)}
          rows={4}
          placeholder="Coopération, fatigabilité, conscience du trouble, stratégies de compensation, contexte familial, retentissement quotidien..."
          className="w-full text-sm rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
        />
      </div>

      {/* Synthèse Score Strict TOTAL */}
      {scoreStrictTotal.max > 0 && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50/60 p-3 text-sm">
          <strong className="text-emerald-900">Score Strict TOTAL (convention GréMots) : </strong>
          <span className="text-emerald-800">
            {scoreStrictTotal.total} / {scoreStrictTotal.max} (Strict + Large additionnés, manuel section 2.4)
          </span>
        </div>
      )}
    </div>
  )
}
