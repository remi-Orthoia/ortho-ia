'use client'

/**
 * Saisie structurée BECD — Batterie d'Évaluation Clinique de la Dysarthrie
 * (Auzou & Rolland-Monnoury, Ortho Édition 2019).
 *
 * Bilan adulte de la dysarthrie. 6 domaines :
 *   1. Sévérité (SP / SI / TPI)
 *   2. Analyse perceptive (Grille perceptive 33 items)
 *   3. Analyse phonétique (Répétitions phonèmes / mots simples / mots complexes)
 *   4. Motricité de la parole
 *   5. Auto-évaluation SHI
 *   6. Analyse acoustique (optionnel)
 *
 * Couplage : nouveau-crbo/page.tsx, test_utilise === ['BECD'].
 */

import { useEffect, useState } from 'react'
import { Brain, ChevronDown, Info, Mic } from 'lucide-react'
import MicButton from '../MicButton'

interface Props {
  notes: string
  onNotesChange: (v: string) => void
  onResultatsChange: (normalized: string) => void
  onError?: (msg: string) => void
}

const SP_OPTIONS = [
  { key: '', label: '— choisir —' },
  { key: '0', label: '0 — Pas de dysarthrie / parole normale' },
  { key: '1', label: '1 — Légère (peu altérée, intelligibilité préservée)' },
  { key: '2', label: '2 — Modérée (nettement altérée, intelligible en contexte)' },
  { key: '3', label: '3 — Sévère (très altérée, intelligibilité compromise)' },
] as const

const ETIOLOGIE_OPTIONS = [
  { key: '',                 label: '— pathologie sous-jacente —' },
  { key: 'parkinson',         label: 'Maladie de Parkinson / syndrome parkinsonien' },
  { key: 'avc',               label: 'AVC (hémisphérique / troncullaire / cérébelleux)' },
  { key: 'sla',               label: 'SLA / maladie de Charcot' },
  { key: 'sep',               label: 'Sclérose en plaques' },
  { key: 'tc',                label: 'Traumatisme crânien' },
  { key: 'maladie_cerebell',  label: 'Maladie cérébelleuse' },
  { key: 'paralysie_bulbaire', label: 'Paralysie bulbaire / pseudobulbaire' },
  { key: 'autre',             label: 'Autre étiologie' },
] as const

interface SectionState {
  /** Pour chaque section, on stocke des champs spécifiques + une observation libre. */
  [key: string]: any
}

interface State {
  etiologie: typeof ETIOLOGIE_OPTIONS[number]['key']
  sp: typeof SP_OPTIONS[number]['key']
  // Score d'Intelligibilité
  si_mots: string
  si_phrases: string
  si_observation: string
  // Test Phonétique d'Intelligibilité
  tpi_score: string
  tpi_observation: string
  // Grille perceptive — 5 axes qualitatifs
  perceptif_phonation: string
  perceptif_articulation: string
  perceptif_resonance: string
  perceptif_prosodie: string
  perceptif_respiration: string
  // Analyse phonétique
  phon_phonemes: string
  phon_mots_simples: string
  phon_mots_complexes: string
  phon_observation: string
  // Motricité
  motricite_levres: string
  motricite_langue: string
  motricite_velaire: string
  motricite_mandibule: string
  motricite_laryngee: string
  // SHI
  shi_total: string
  shi_observation: string
  // Acoustique (optionnelle)
  mpt: string
  f0: string
  jitter: string
  shimmer: string
  intensite: string
  acoustique_observation: string
}

const emptyState = (): State => ({
  etiologie: '', sp: '',
  si_mots: '', si_phrases: '', si_observation: '',
  tpi_score: '', tpi_observation: '',
  perceptif_phonation: '', perceptif_articulation: '', perceptif_resonance: '',
  perceptif_prosodie: '', perceptif_respiration: '',
  phon_phonemes: '', phon_mots_simples: '', phon_mots_complexes: '', phon_observation: '',
  motricite_levres: '', motricite_langue: '', motricite_velaire: '',
  motricite_mandibule: '', motricite_laryngee: '',
  shi_total: '', shi_observation: '',
  mpt: '', f0: '', jitter: '', shimmer: '', intensite: '', acoustique_observation: '',
})

export default function BecdScoresInput({ notes, onNotesChange, onResultatsChange }: Props) {
  const [state, setState] = useState<State>(emptyState)
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    severite: true, perceptive: false, phonetique: false, motricite: false, shi: false, acoustique: false,
  })

  useEffect(() => {
    const nonEmpty = Object.entries(state).some(([k, v]) => k !== 'etiologie' && typeof v === 'string' && v.trim() !== '')
    if (!nonEmpty && !state.etiologie) {
      onResultatsChange('')
      return
    }
    const lines: string[] = []
    lines.push('=== BECD — Batterie d\'Évaluation Clinique de la Dysarthrie (Auzou & Rolland-Monnoury, Ortho Édition 2019) ===')
    if (state.etiologie) {
      lines.push(`Étiologie suspectée : ${ETIOLOGIE_OPTIONS.find(o => o.key === state.etiologie)?.label}`)
      lines.push('')
    }

    // 1. Sévérité
    const sevLines: string[] = []
    if (state.sp) sevLines.push(`Score Perceptif (SP) : ${SP_OPTIONS.find(o => o.key === state.sp)?.label}`)
    if (state.si_mots.trim()) sevLines.push(`Score d'Intelligibilité — mots : ${state.si_mots.trim()}%`)
    if (state.si_phrases.trim()) sevLines.push(`Score d'Intelligibilité — phrases : ${state.si_phrases.trim()}%`)
    if (state.si_observation.trim()) sevLines.push(`SI — observation : ${state.si_observation.trim()}`)
    if (state.tpi_score.trim()) sevLines.push(`Test Phonétique d'Intelligibilité (TPI) : ${state.tpi_score.trim()}%`)
    if (state.tpi_observation.trim()) sevLines.push(`TPI — observation : ${state.tpi_observation.trim()}`)
    if (sevLines.length) { lines.push('--- 1. Sévérité ---'); lines.push(...sevLines); lines.push('') }

    // 2. Perceptive
    const perceptifLines: string[] = []
    if (state.perceptif_phonation.trim()) perceptifLines.push(`Phonation / voix : ${state.perceptif_phonation.trim()}`)
    if (state.perceptif_articulation.trim()) perceptifLines.push(`Articulation : ${state.perceptif_articulation.trim()}`)
    if (state.perceptif_resonance.trim()) perceptifLines.push(`Résonance : ${state.perceptif_resonance.trim()}`)
    if (state.perceptif_prosodie.trim()) perceptifLines.push(`Prosodie : ${state.perceptif_prosodie.trim()}`)
    if (state.perceptif_respiration.trim()) perceptifLines.push(`Respiration : ${state.perceptif_respiration.trim()}`)
    if (perceptifLines.length) { lines.push('--- 2. Analyse perceptive (grille 33 items) ---'); lines.push(...perceptifLines); lines.push('') }

    // 3. Phonétique
    const phonLines: string[] = []
    if (state.phon_phonemes.trim()) phonLines.push(`Phonèmes isolés : ${state.phon_phonemes.trim()}`)
    if (state.phon_mots_simples.trim()) phonLines.push(`Mots simples : ${state.phon_mots_simples.trim()}`)
    if (state.phon_mots_complexes.trim()) phonLines.push(`Mots complexes : ${state.phon_mots_complexes.trim()}`)
    if (state.phon_observation.trim()) phonLines.push(`Observation : ${state.phon_observation.trim()}`)
    if (phonLines.length) { lines.push('--- 3. Analyse phonétique ---'); lines.push(...phonLines); lines.push('') }

    // 4. Motricité
    const motLines: string[] = []
    if (state.motricite_levres.trim()) motLines.push(`Lèvres : ${state.motricite_levres.trim()}`)
    if (state.motricite_langue.trim()) motLines.push(`Langue : ${state.motricite_langue.trim()}`)
    if (state.motricite_velaire.trim()) motLines.push(`Voile du palais : ${state.motricite_velaire.trim()}`)
    if (state.motricite_mandibule.trim()) motLines.push(`Mandibule : ${state.motricite_mandibule.trim()}`)
    if (state.motricite_laryngee.trim()) motLines.push(`Larynx (toux volontaire, tenue /a/) : ${state.motricite_laryngee.trim()}`)
    if (motLines.length) { lines.push('--- 4. Examen de la motricité ---'); lines.push(...motLines); lines.push('') }

    // 5. SHI
    if (state.shi_total.trim() || state.shi_observation.trim()) {
      lines.push('--- 5. Auto-évaluation (SHI) ---')
      if (state.shi_total.trim()) lines.push(`Score SHI total : ${state.shi_total.trim()}/120`)
      if (state.shi_observation.trim()) lines.push(`Observation : ${state.shi_observation.trim()}`)
      lines.push('')
    }

    // 6. Acoustique
    const acLines: string[] = []
    if (state.mpt.trim()) acLines.push(`MPT (Maximum Phonation Time) : ${state.mpt.trim()} s`)
    if (state.f0.trim()) acLines.push(`F0 (fréquence fondamentale) : ${state.f0.trim()} Hz`)
    if (state.jitter.trim()) acLines.push(`Jitter : ${state.jitter.trim()} %`)
    if (state.shimmer.trim()) acLines.push(`Shimmer : ${state.shimmer.trim()} %`)
    if (state.intensite.trim()) acLines.push(`Intensité moyenne : ${state.intensite.trim()} dB`)
    if (state.acoustique_observation.trim()) acLines.push(`Observation : ${state.acoustique_observation.trim()}`)
    if (acLines.length) { lines.push('--- 6. Analyse acoustique (optionnelle) ---'); lines.push(...acLines); lines.push('') }

    onResultatsChange(lines.join('\n'))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state])

  const setField = (k: keyof State, v: any) => setState(s => ({ ...s, [k]: v }))
  const toggleSection = (id: string) => setExpanded(p => ({ ...p, [id]: !p[id] }))

  const sectionHeader = (id: string, title: string, description: string) => (
    <button
      type="button"
      onClick={() => toggleSection(id)}
      className="w-full px-4 py-3 flex items-center justify-between gap-3 text-left hover:bg-gray-50"
    >
      <div className="min-w-0">
        <p className="text-sm font-semibold text-gray-900">{title}</p>
        <p className="text-xs text-gray-500 mt-0.5">{description}</p>
      </div>
      <ChevronDown size={16} className={`shrink-0 transition-transform ${expanded[id] ? '' : '-rotate-90'}`} />
    </button>
  )

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-2 p-3 rounded-lg border border-indigo-200 bg-indigo-50">
        <Mic size={18} className="text-indigo-600 shrink-0 mt-0.5" />
        <div className="text-sm">
          <p className="font-semibold text-indigo-900">Saisie structurée BECD — bilan dysarthrie adulte (6 domaines)</p>
          <p className="text-indigo-700 text-xs mt-0.5 leading-relaxed">
            Adaptez le choix des épreuves à la sévérité observée d&apos;emblée. Le Score Perceptif (SP) est <strong>toujours
            renseigné</strong>. Si dysarthrie majeure : préférer TPI plutôt que SI ; mots simples plutôt que complexes.
          </p>
        </div>
      </div>

      {/* Étiologie suspectée */}
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <label className="flex items-center gap-2 text-sm font-semibold text-gray-900 mb-2">
          <Info size={14} className="text-indigo-600" />
          Étiologie / pathologie sous-jacente du patient
        </label>
        <select
          value={state.etiologie}
          onChange={(e) => setField('etiologie', e.target.value as State['etiologie'])}
          className="w-full sm:w-96 px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
        >
          {ETIOLOGIE_OPTIONS.map(o => (<option key={o.key} value={o.key}>{o.label}</option>))}
        </select>
        <p className="text-[11px] text-gray-500 mt-1">Information clinique de base — oriente l&apos;hypothèse de profil dysarthrique.</p>
      </div>

      {/* 1. Sévérité */}
      <div className="rounded-lg border border-gray-200 bg-white">
        {sectionHeader('severite', '1. Sévérité globale', 'Score Perceptif (toujours) + Score d\'Intelligibilité (mots + phrases) + TPI selon sévérité.')}
        {expanded.severite && (
          <div className="border-t border-gray-100 px-4 py-3 space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Score Perceptif (SP) — toujours renseigné</label>
              <select
                value={state.sp}
                onChange={(e) => setField('sp', e.target.value as State['sp'])}
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              >
                {SP_OPTIONS.map(o => (<option key={o.key} value={o.key}>{o.label}</option>))}
              </select>
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">SI — mots (% de réussite)</label>
                <input
                  type="text"
                  value={state.si_mots}
                  onChange={(e) => setField('si_mots', e.target.value)}
                  placeholder="ex. 88"
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">SI — phrases (% de réussite)</label>
                <input
                  type="text"
                  value={state.si_phrases}
                  onChange={(e) => setField('si_phrases', e.target.value)}
                  placeholder="ex. 75"
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                />
              </div>
            </div>
            <textarea
              value={state.si_observation}
              onChange={(e) => setField('si_observation', e.target.value)}
              rows={2}
              placeholder="Observation SI : conditions de passation, auditeur naïf, contexte sonore…"
              className="w-full px-3 py-2 border border-gray-300 rounded text-xs leading-relaxed resize-y"
            />

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">TPI — score phonétique (%)</label>
              <input
                type="text"
                value={state.tpi_score}
                onChange={(e) => setField('tpi_score', e.target.value)}
                placeholder="ex. 65"
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
              />
            </div>
            <textarea
              value={state.tpi_observation}
              onChange={(e) => setField('tpi_observation', e.target.value)}
              rows={2}
              placeholder="Observation TPI : carnets utilisés, phonèmes les plus altérés…"
              className="w-full px-3 py-2 border border-gray-300 rounded text-xs leading-relaxed resize-y"
            />
          </div>
        )}
      </div>

      {/* 2. Analyse perceptive */}
      <div className="rounded-lg border border-gray-200 bg-white">
        {sectionHeader('perceptive', '2. Analyse perceptive (grille 33 items)', 'Description qualitative des altérations sur 5 axes : phonation, articulation, résonance, prosodie, respiration.')}
        {expanded.perceptive && (
          <div className="border-t border-gray-100 px-4 py-3 space-y-2">
            {([
              ['perceptif_phonation', 'Phonation / voix', 'Intensité, qualité vocale, hauteur, attaques, fin de phrase'],
              ['perceptif_articulation', 'Articulation', 'Précision consonantique, voyelles, déformations'],
              ['perceptif_resonance', 'Résonance', 'Hypernasalité, hyponasalité, émissions nasales'],
              ['perceptif_prosodie', 'Prosodie', 'Intonation, accentuation, rythme, vitesse'],
              ['perceptif_respiration', 'Respiration', 'Appui phonatoire, capacité respiratoire, coordination phono-respiratoire'],
            ] as const).map(([key, label, hint]) => (
              <div key={key}>
                <label className="block text-xs font-medium text-gray-700">{label}</label>
                <p className="text-[10px] text-gray-500 mb-1">{hint}</p>
                <textarea
                  value={state[key]}
                  onChange={(e) => setField(key, e.target.value)}
                  rows={2}
                  placeholder="Notation qualitative depuis la grille perceptive…"
                  className="w-full px-2 py-1 border border-gray-300 rounded text-xs leading-relaxed resize-y"
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 3. Analyse phonétique */}
      <div className="rounded-lg border border-gray-200 bg-white">
        {sectionHeader('phonetique', '3. Analyse phonétique', 'Répétitions de phonèmes isolés / mots simples / mots complexes.')}
        {expanded.phonetique && (
          <div className="border-t border-gray-100 px-4 py-3 space-y-2">
            {([
              ['phon_phonemes', 'Phonèmes isolés', 'Voyelles, consonnes occlusives, fricatives… → noter les phonèmes déformés'],
              ['phon_mots_simples', 'Mots simples (1-2 syllabes)', 'Contexte CV / VC'],
              ['phon_mots_complexes', 'Mots complexes (3+ syllabes, groupes consonantiques)', 'Coarticulation'],
            ] as const).map(([key, label, hint]) => (
              <div key={key}>
                <label className="block text-xs font-medium text-gray-700">{label}</label>
                <p className="text-[10px] text-gray-500 mb-1">{hint}</p>
                <textarea
                  value={state[key]}
                  onChange={(e) => setField(key, e.target.value)}
                  rows={2}
                  placeholder="Description / scores observés…"
                  className="w-full px-2 py-1 border border-gray-300 rounded text-xs leading-relaxed resize-y"
                />
              </div>
            ))}
            <textarea
              value={state.phon_observation}
              onChange={(e) => setField('phon_observation', e.target.value)}
              rows={2}
              placeholder="Synthèse de l'analyse phonétique…"
              className="w-full px-2 py-1 border border-gray-300 rounded text-xs leading-relaxed resize-y"
            />
          </div>
        )}
      </div>

      {/* 4. Motricité */}
      <div className="rounded-lg border border-gray-200 bg-white">
        {sectionHeader('motricite', '4. Examen de la motricité', 'Mobilité des effecteurs : lèvres, langue, voile, mandibule, larynx (toux volontaire, tenue /a/).')}
        {expanded.motricite && (
          <div className="border-t border-gray-100 px-4 py-3 space-y-2">
            {([
              ['motricite_levres',     'Lèvres',         'Étirement, projection'],
              ['motricite_langue',     'Langue',         'Protrusion, élévation, latéralité, mouvements alternés'],
              ['motricite_velaire',    'Voile du palais', 'Élévation lors du /a/'],
              ['motricite_mandibule',  'Mandibule',      'Ouverture, fermeture, latéralité'],
              ['motricite_laryngee',   'Larynx',         'Toux volontaire, tenue du /a/'],
            ] as const).map(([key, label, hint]) => (
              <div key={key}>
                <label className="block text-xs font-medium text-gray-700">{label}</label>
                <p className="text-[10px] text-gray-500 mb-1">{hint}</p>
                <textarea
                  value={state[key]}
                  onChange={(e) => setField(key, e.target.value)}
                  rows={1}
                  placeholder="Observation motrice…"
                  className="w-full px-2 py-1 border border-gray-300 rounded text-xs leading-relaxed resize-y"
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 5. SHI */}
      <div className="rounded-lg border border-gray-200 bg-white">
        {sectionHeader('shi', '5. Speech Handicap Index (auto-évaluation, 30 items)', 'Échelle Likert 5 points. Total ≥ 30 = retentissement significatif sur la qualité de vie.')}
        {expanded.shi && (
          <div className="border-t border-gray-100 px-4 py-3 space-y-2">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Score SHI total (sur 120)</label>
              <input
                type="text"
                value={state.shi_total}
                onChange={(e) => setField('shi_total', e.target.value)}
                placeholder="ex. 45"
                className="w-full sm:w-48 px-3 py-2 border border-gray-300 rounded text-sm"
              />
            </div>
            <textarea
              value={state.shi_observation}
              onChange={(e) => setField('shi_observation', e.target.value)}
              rows={3}
              placeholder="Observation : items les plus cotés, ressenti du patient, retentissement social…"
              className="w-full px-3 py-2 border border-gray-300 rounded text-xs leading-relaxed resize-y"
            />
          </div>
        )}
      </div>

      {/* 6. Acoustique (optionnel) */}
      <div className="rounded-lg border border-gray-200 bg-white">
        {sectionHeader('acoustique', '6. Analyse acoustique (optionnelle)', 'Relevés instrumentaux Praat / autres. MPT, F0, jitter, shimmer, intensité.')}
        {expanded.acoustique && (
          <div className="border-t border-gray-100 px-4 py-3 space-y-2">
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">MPT (Maximum Phonation Time, en secondes)</label>
                <input
                  type="text"
                  value={state.mpt}
                  onChange={(e) => setField('mpt', e.target.value)}
                  placeholder="ex. 12 (normale ≥ 15 s adulte)"
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">F0 (fréquence fondamentale, Hz)</label>
                <input
                  type="text"
                  value={state.f0}
                  onChange={(e) => setField('f0', e.target.value)}
                  placeholder="ex. 110"
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Jitter (%, anormal &gt; 1)</label>
                <input
                  type="text"
                  value={state.jitter}
                  onChange={(e) => setField('jitter', e.target.value)}
                  placeholder="ex. 0.8"
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Shimmer (%, anormal &gt; 3)</label>
                <input
                  type="text"
                  value={state.shimmer}
                  onChange={(e) => setField('shimmer', e.target.value)}
                  placeholder="ex. 2.5"
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-gray-700 mb-1">Intensité moyenne (dB, hypophonie &lt; 65)</label>
                <input
                  type="text"
                  value={state.intensite}
                  onChange={(e) => setField('intensite', e.target.value)}
                  placeholder="ex. 60"
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                />
              </div>
            </div>
            <textarea
              value={state.acoustique_observation}
              onChange={(e) => setField('acoustique_observation', e.target.value)}
              rows={2}
              placeholder="Observation acoustique : logiciel utilisé, conditions d'enregistrement…"
              className="w-full px-2 py-1 border border-gray-300 rounded text-xs leading-relaxed resize-y"
            />
          </div>
        )}
      </div>

      {/* Notes globales */}
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <div className="flex items-center justify-between mb-1">
          <label className="text-sm font-medium text-gray-800">
            Notes globales sur la séance (comportement, fatigabilité, retentissement social)
          </label>
          <MicButton value={notes} onChange={onNotesChange} />
        </div>
        <textarea
          value={notes}
          onChange={(e) => onNotesChange(e.target.value)}
          rows={3}
          placeholder="Ex. patient coopératif, fatigue marquée après 30 min, gêne sociale rapportée par le conjoint, contexte évolutif à 6 mois…"
          className="w-full px-3 py-2 border border-gray-300 rounded text-sm leading-relaxed resize-y focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />
      </div>

      {/* Rappels cliniques */}
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
        <div className="flex items-start gap-2">
          <Brain size={16} className="text-amber-700 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-900 leading-relaxed">
            <p className="font-semibold mb-1">Rappels cliniques BECD</p>
            <ul className="list-disc list-inside space-y-0.5">
              <li><strong>SP toujours renseigné</strong> en première intention, quelle que soit la sévérité.</li>
              <li>Dysarthrie majeure → privilégier TPI (carnets 52 mots) et mots simples plutôt que SI et mots complexes.</li>
              <li>5 profils Darley : hypokinétique (Parkinson), spastique, ataxique (cérébelleux), flasque (motoneurone inférieur), mixte (SLA/SEP).</li>
              <li><strong>Bilan déglutition systématique</strong> en parallèle (atteintes souvent conjointes).</li>
              <li>Pathologie évolutive (SLA, SEP) : refaire la BECD à 3-6 mois pour suivre l&apos;évolution.</li>
              <li>Ne pas confondre dysarthrie (atteinte motrice de la parole) avec aphasie (langage) ni apraxie de la parole (programmation motrice).</li>
              <li>L&apos;étiologie est posée par le neurologue — ortho.ia formule en hypothèse de profil.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
