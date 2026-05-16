'use client'

/**
 * Saisie structurée PrediFex (Duchêne & Jaillard, HappyNeuron 2019).
 *
 * 10 épreuves ciblant les fonctions exécutives (flexibilité, mise à jour,
 * planification, inhibition, raisonnement). Population adulte NSC 2 et 3
 * prioritairement (NSC 1 déconseillé par les auteures).
 *
 * Scoring : notes standard + zone HappyNeuron à 5 paliers (vert foncé / vert
 * clair / jaune / orange / rouge), seuil d'alerte officiel à M − 1,5 σ.
 *
 * Couplage : nouveau-crbo/page.tsx, test_utilise === ['PrediFex'].
 */

import { useEffect, useMemo, useState } from 'react'
import { Brain, ChevronDown, AlertCircle, Info } from 'lucide-react'
import MicButton from '../MicButton'

interface Props {
  notes: string
  onNotesChange: (v: string) => void
  onResultatsChange: (normalized: string) => void
  onError?: (msg: string) => void
}

type ZoneKey = '' | 'vert_fonce' | 'vert_clair' | 'jaune' | 'orange' | 'rouge'

const ZONES: Array<{ key: Exclude<ZoneKey, ''>; label: string; sigma: string; chipBg: string; chipText: string; chipRing: string }> = [
  { key: 'vert_fonce', label: 'Vert foncé', sigma: '≥ moyenne', chipBg: 'bg-emerald-600', chipText: 'text-white',     chipRing: 'ring-emerald-700' },
  { key: 'vert_clair', label: 'Vert clair', sigma: 'M−1σ à M−1,5σ', chipBg: 'bg-emerald-300', chipText: 'text-emerald-900', chipRing: 'ring-emerald-500' },
  { key: 'jaune',      label: 'Jaune',      sigma: 'M−1,5σ à M−2σ (seuil d\'alerte)', chipBg: 'bg-amber-300',   chipText: 'text-amber-900',   chipRing: 'ring-amber-500' },
  { key: 'orange',     label: 'Orange',     sigma: 'M−2σ à M−3σ',  chipBg: 'bg-orange-500', chipText: 'text-white',     chipRing: 'ring-orange-600' },
  { key: 'rouge',      label: 'Rouge',      sigma: '< M−3σ (effondrement)', chipBg: 'bg-red-600',    chipText: 'text-white',     chipRing: 'ring-red-700' },
]

const ZONE_LABEL_CLINIQUE: Record<Exclude<ZoneKey, ''>, string> = {
  vert_fonce:  'performance préservée',
  vert_clair:  'performance dans la moyenne basse, à surveiller',
  jaune:       'fragilité objectivée (seuil d\'alerte)',
  orange:      'difficulté avérée',
  rouge:       'effondrement',
}

interface Epreuve {
  key: string
  num: string
  label: string
  description: string
  cible: string
}

const EPREUVES: Epreuve[] = [
  { key: 'e01_fluences_alternees',  num: '01', label: 'Fluences alternées',        description: 'Production alternée entre 2 catégories. Mesure la flexibilité mentale et l\'inhibition d\'une réponse automatique.',                  cible: 'Flexibilité + inhibition' },
  { key: 'e02_texte_mettre_ordre',  num: '02', label: 'Texte à mettre en ordre',   description: 'Réorganiser des phrases pour reconstituer un texte cohérent. Planification + cohérence textuelle + MdT.',                              cible: 'Planification + MdT' },
  { key: 'e03_textes_executifs',    num: '03', label: 'Textes « exécutifs »',      description: 'Compréhension de texte exigeante en attention soutenue, inhibition de distracteurs, inférences.',                                       cible: 'Attention + inférences' },
  { key: 'e04_syllabe_sur_deux',    num: '04', label: 'Une syllabe sur deux',      description: 'Lire / dire seulement une syllabe sur deux. Inhibition + flexibilité (alternance syllabique).',                                          cible: 'Inhibition + flexibilité' },
  { key: 'e05_mise_a_jour',         num: '05', label: 'Mise à jour',               description: 'Suivre la dernière information dans une suite (mise à jour de la MdT).',                                                                  cible: 'Mise à jour MdT' },
  { key: 'e06_probleme_arith',      num: '06', label: 'Problème arithmétique',     description: 'Résolution de problèmes mathématiques à énoncé verbal. Planification + MdT en numérique.',                                               cible: 'Planification numérique' },
  { key: 'e07_probleme_luria',      num: '07', label: 'Problème logique « Luria »', description: 'Raisonnement abstrait avec énoncé piégeant — inhibition d\'une réponse intuitive en faveur d\'une analyse logique.',                     cible: 'Raisonnement + inhibition' },
  { key: 'e08_sudofex',             num: '08', label: 'Sudofex',                   description: 'Type sudoku adapté — inhibition + raisonnement logique en grille.',                                                                       cible: 'Inhibition + raisonnement' },
  { key: 'e09_equivalences',        num: '09', label: 'Équivalences',              description: 'Trouver l\'équivalent dans un autre registre (raisonnement analogique + inhibition).',                                                   cible: 'Raisonnement analogique' },
  { key: 'e10_itineraire',          num: '10', label: 'Itinéraire',                description: 'Planification spatiale + MdT visuo-spatiale (élaboration d\'un trajet selon contraintes).',                                              cible: 'Planification spatiale' },
]

const TRANCHE_AGE_OPTIONS: Array<{ key: '1' | '2' | '3' | '4' | '5'; label: string }> = [
  { key: '1', label: '1 — 18-49 ans' },
  { key: '2', label: '2 — 50-59 ans' },
  { key: '3', label: '3 — 60-69 ans' },
  { key: '4', label: '4 — 70-79 ans' },
  { key: '5', label: '5 — 80-90 ans' },
]
const NSC_OPTIONS: Array<{ key: '2' | '3'; label: string; warn?: boolean }> = [
  { key: '2', label: 'NSC 2 — Bac à Bac+3' },
  { key: '3', label: 'NSC 3 — ≥ Bac+4 (haute réserve cognitive)' },
]

interface EpreuveState {
  zone: ZoneKey
  score_brut: string
  temps: string
  observation: string
  non_passee: boolean
}

interface State {
  trancheAge: '' | '1' | '2' | '3' | '4' | '5'
  nsc: '' | '2' | '3'
  epreuves: Record<string, EpreuveState>
}

function emptyState(): State {
  const ep: Record<string, EpreuveState> = {}
  for (const e of EPREUVES) ep[e.key] = { zone: '', score_brut: '', temps: '', observation: '', non_passee: false }
  return { trancheAge: '', nsc: '', epreuves: ep }
}

export default function PrediFexScoresInput({ notes, onNotesChange, onResultatsChange }: Props) {
  const [state, setState] = useState<State>(emptyState)

  const totalSaisies = useMemo(() => {
    let n = 0
    for (const e of EPREUVES) {
      const st = state.epreuves[e.key]
      if (st.non_passee) continue
      if (st.zone !== '') n++
    }
    return n
  }, [state.epreuves])

  const zoneCounts = useMemo(() => {
    const c: Record<Exclude<ZoneKey, ''>, number> = { vert_fonce: 0, vert_clair: 0, jaune: 0, orange: 0, rouge: 0 }
    for (const e of EPREUVES) {
      const st = state.epreuves[e.key]
      if (st.non_passee) continue
      if (st.zone) c[st.zone]++
    }
    return c
  }, [state.epreuves])

  useEffect(() => {
    if (totalSaisies === 0 && !state.trancheAge && !state.nsc) {
      onResultatsChange('')
      return
    }
    const lines: string[] = []
    lines.push('=== PrediFex — Protocole d\'évaluation et de dépistage des insuffisances des fonctions exécutives (Duchêne & Jaillard, HappyNeuron 2019) ===')
    if (state.trancheAge || state.nsc) {
      const trancheLabel = TRANCHE_AGE_OPTIONS.find(o => o.key === state.trancheAge)?.label || '(non précisée)'
      const nscLabel = NSC_OPTIONS.find(o => o.key === state.nsc)?.label || '(non précisé)'
      lines.push(`Stratification : ${trancheLabel} — ${nscLabel}`)
      lines.push('')
    }
    for (const e of EPREUVES) {
      const st = state.epreuves[e.key]
      if (st.non_passee) continue
      if (!st.zone && !st.observation.trim() && !st.score_brut.trim() && !st.temps.trim()) continue
      lines.push(`--- Épreuve ${e.num} — ${e.label} ---`)
      if (st.score_brut.trim()) lines.push(`Score brut : ${st.score_brut.trim()}`)
      if (st.temps.trim()) lines.push(`Temps : ${st.temps.trim()}`)
      if (st.zone) {
        const z = ZONES.find(zz => zz.key === st.zone)!
        lines.push(`Zone HappyNeuron : ${z.label} (${z.sigma}) — ${ZONE_LABEL_CLINIQUE[st.zone]}`)
      }
      if (st.observation.trim()) lines.push(`Observation : ${st.observation.trim()}`)
      lines.push('')
    }
    const tot = zoneCounts.vert_fonce + zoneCounts.vert_clair + zoneCounts.jaune + zoneCounts.orange + zoneCounts.rouge
    if (tot > 0) {
      lines.push('--- Synthèse zones HappyNeuron ---')
      lines.push(`Vert foncé (préservé) : ${zoneCounts.vert_fonce}`)
      lines.push(`Vert clair (moyenne basse) : ${zoneCounts.vert_clair}`)
      lines.push(`Jaune (seuil d'alerte) : ${zoneCounts.jaune}`)
      lines.push(`Orange (difficulté avérée) : ${zoneCounts.orange}`)
      lines.push(`Rouge (effondrement) : ${zoneCounts.rouge}`)
    }
    onResultatsChange(lines.join('\n'))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, totalSaisies, zoneCounts])

  const setField = (key: string, field: keyof EpreuveState, v: any) => {
    setState(s => ({ ...s, epreuves: { ...s.epreuves, [key]: { ...s.epreuves[key], [field]: v } } }))
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-2 p-3 rounded-lg border border-indigo-200 bg-indigo-50">
        <Brain size={18} className="text-indigo-600 shrink-0 mt-0.5" />
        <div className="text-sm">
          <p className="font-semibold text-indigo-900">Saisie structurée PrediFex — 10 épreuves de fonctions exécutives</p>
          <p className="text-indigo-700 text-xs mt-0.5 leading-relaxed">
            Reportez la <strong>zone HappyNeuron</strong> (5 couleurs) directement lue sur le logiciel pour chaque épreuve.
            Seuil d&apos;alerte officiel : M − 1,5 σ. Population cible : adultes NSC 2 et 3. <strong>NSC 1 déconseillé</strong> par les auteures
            (épreuves trop difficiles, résultats reflètent le NSC plus que la pathologie).
          </p>
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-4 space-y-3">
        <p className="text-sm font-semibold text-gray-900 flex items-center gap-1.5">
          <Info size={14} className="text-indigo-600" />
          Stratification obligatoire — âge × NSC
        </p>
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Tranche d&apos;âge</label>
            <select
              value={state.trancheAge}
              onChange={(e) => setState(s => ({ ...s, trancheAge: e.target.value as State['trancheAge'] }))}
              className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            >
              <option value="">— choisir —</option>
              {TRANCHE_AGE_OPTIONS.map(o => (
                <option key={o.key} value={o.key}>{o.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Niveau socio-culturel (NSC)</label>
            <select
              value={state.nsc}
              onChange={(e) => setState(s => ({ ...s, nsc: e.target.value as State['nsc'] }))}
              className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            >
              <option value="">— choisir —</option>
              {NSC_OPTIONS.map(o => (
                <option key={o.key} value={o.key}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>
        <p className="text-[11px] text-amber-800 bg-amber-50 border border-amber-200 rounded px-2 py-1.5">
          <strong>⚠️ NSC 1 non listé volontairement.</strong> Les auteures déconseillent PrediFex aux NSC très bas
          (scolarité &lt; 8 ans sans activité compensatoire) car les épreuves sont trop difficiles et reflètent le
          NSC plutôt que des déficits pathologiques. Préférer BREF, MoCA ou un bilan neuropsy adapté.
        </p>
      </div>

      {totalSaisies > 0 && (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
          <p className="text-xs font-semibold text-gray-700 mb-2">
            Répartition par zone — {totalSaisies}/10 épreuves saisies
          </p>
          <div className="flex flex-wrap gap-1.5">
            {ZONES.map(z => {
              const n = zoneCounts[z.key]
              if (n === 0) return null
              return (
                <span key={z.key} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded ${z.chipBg} ${z.chipText} text-xs font-medium`}>
                  <span className="font-bold">{n}</span>
                  <span>{z.label}</span>
                </span>
              )
            })}
          </div>
        </div>
      )}

      <div className="space-y-3">
        {EPREUVES.map(e => {
          const st = state.epreuves[e.key]
          return (
            <div key={e.key} className="rounded-lg border border-gray-200 bg-white p-4">
              <div className="flex items-start justify-between gap-3 flex-wrap mb-2">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-mono text-gray-400">Épreuve {e.num}</p>
                  <h4 className="text-sm font-semibold text-gray-900">{e.label}</h4>
                  <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{e.description}</p>
                  <p className="text-[10px] text-indigo-600 mt-0.5">Cible : {e.cible}</p>
                </div>
                <label className="text-xs text-gray-600 flex items-center gap-1.5 shrink-0">
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
                <div className="space-y-2 mt-2">
                  <div className="grid sm:grid-cols-2 gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-gray-600 w-20 shrink-0">Score brut :</span>
                      <input
                        type="text"
                        value={st.score_brut}
                        onChange={(ev) => setField(e.key, 'score_brut', ev.target.value)}
                        placeholder="(optionnel)"
                        className="flex-1 px-2 py-1 border border-gray-300 rounded text-xs"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-gray-600 w-20 shrink-0">Temps :</span>
                      <input
                        type="text"
                        value={st.temps}
                        onChange={(ev) => setField(e.key, 'temps', ev.target.value)}
                        placeholder="ex. 2 min 30"
                        className="flex-1 px-2 py-1 border border-gray-300 rounded text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-gray-700 mb-1">
                      Zone HappyNeuron (reportée du logiciel) :
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {ZONES.map(z => {
                        const active = st.zone === z.key
                        return (
                          <button
                            key={z.key}
                            type="button"
                            onClick={() => setField(e.key, 'zone', active ? '' : z.key)}
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium transition ${z.chipBg} ${z.chipText} ${active ? `ring-2 ${z.chipRing}` : 'opacity-60 hover:opacity-100'}`}
                            title={z.sigma}
                          >
                            {z.label}
                          </button>
                        )
                      })}
                      {st.zone && (
                        <button
                          type="button"
                          onClick={() => setField(e.key, 'zone', '')}
                          className="text-[11px] text-gray-600 hover:text-gray-900 underline decoration-dotted px-2 py-1"
                        >
                          effacer
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <span className="text-[11px] text-gray-600 w-20 shrink-0 pt-1">Observation :</span>
                    <textarea
                      value={st.observation}
                      onChange={(ev) => setField(e.key, 'observation', ev.target.value)}
                      rows={2}
                      placeholder="Stratégies, type d'erreurs, attitudes…"
                      className="flex-1 px-2 py-1 border border-gray-300 rounded text-xs leading-relaxed resize-y focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    />
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

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
          placeholder="Ex. patient coopératif, lenteur d'exécution marquée, abandonne facilement sur les épreuves piégeantes, persévération sur la consigne initiale en flexibilité…"
          className="w-full px-3 py-2 border border-gray-300 rounded text-sm leading-relaxed resize-y focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />
      </div>

      <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
        <div className="flex items-start gap-2">
          <AlertCircle size={16} className="text-amber-700 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-900 leading-relaxed">
            <p className="font-semibold mb-1">Rappels cliniques PrediFex</p>
            <ul className="list-disc list-inside space-y-0.5">
              <li>PrediFex est un <strong>dépistage</strong>, jamais un diagnostic. Aucune étiologie nommée (Alzheimer, démence FT, MCI, syndrome dysexécutif fronto-sous-cortical, etc.).</li>
              <li>Ne pas conclure sur une <strong>épreuve isolée</strong> — croiser au moins 2-3 épreuves convergentes pour retenir une fragilité.</li>
              <li>Reporter les <strong>temps</strong> systématiquement : score normal en temps pathologique = marqueur sub-clinique majeur, surtout en NSC 3.</li>
              <li>Mentionner les <strong>domaines préservés en premier</strong>. Vocabulaire fonctionnel quotidien, jamais alarmant.</li>
              <li><strong>NSC 1 (scolarité &lt; 8 ans)</strong> : ne pas faire passer PrediFex — préférer BREF, MoCA ou bilan neuropsy adapté.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
