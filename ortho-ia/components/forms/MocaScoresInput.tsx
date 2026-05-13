'use client'

/**
 * Saisie structurée des scores MoCA (Montreal Cognitive Assessment).
 *
 * La MoCA est un screening cognitif adulte/senior — score total /30 avec 7
 * sous-domaines (Visuospatial/Exécutif /5, Dénomination /3, Mémoire /5,
 * Attention /6, Langage /3, Abstraction /2, Orientation /6).
 *
 * Pourquoi un composant dédié plutôt que le textarea "résultats manuels"
 * standard : la MoCA n'a pas d'écart-type ni de percentile ; elle a un score
 * brut par domaine + un seuil officiel sur le total. Une saisie libre serait
 * une perte de temps et exposerait l'ortho à des erreurs de calcul de total.
 *
 * Le composant écrit un texte normalisé dans le champ `resultats_manuels` de
 * `CRBOFormData` à chaque changement (déterministe, parsable par l'IA).
 *
 * Couplage : utilisé uniquement dans `app/dashboard/nouveau-crbo/page.tsx`
 * quand `test_utilise` contient "MoCA".
 */

import { useEffect, useMemo, useState } from 'react'
import { Brain, CheckCircle2, AlertCircle } from 'lucide-react'
import MicButton from '../MicButton'

interface Props {
  /** Notes d'observation (comportement, fatigabilité). Optionnel. */
  notes: string
  onNotesChange: (v: string) => void
  /** Écrit le résultat normalisé dans `resultats_manuels`. */
  onResultatsChange: (normalized: string) => void
  /** Callback erreur micro (remonte au parent). */
  onError?: (msg: string) => void
}

interface MocaState {
  visuospatial: string  // /5
  denomination: string  // /3
  memoire: string       // /5
  attention: string     // /6
  langage: string       // /3
  abstraction: string   // /2
  orientation: string   // /6
  scolariteCourte: boolean
}

const DOMAINS: Array<{
  key: keyof Omit<MocaState, 'scolariteCourte'>
  label: string
  max: number
  hint: string
}> = [
  { key: 'visuospatial', label: 'Visuospatial / Exécutif', max: 5, hint: 'Trail Making B, cube, horloge' },
  { key: 'denomination', label: 'Dénomination',            max: 3, hint: 'Lion, rhinocéros, chameau' },
  { key: 'memoire',      label: 'Mémoire (rappel différé)', max: 5, hint: 'Rappel libre des 5 mots' },
  { key: 'attention',    label: 'Attention',               max: 6, hint: 'Empan chiffres, vigilance, soustraction' },
  { key: 'langage',      label: 'Langage',                 max: 3, hint: 'Répétition de phrases, fluence F' },
  { key: 'abstraction',  label: 'Abstraction',             max: 2, hint: 'Similitudes' },
  { key: 'orientation',  label: 'Orientation',             max: 6, hint: 'Date, mois, année, jour, lieu, ville' },
]

interface Severity {
  label: string
  bg: string
  ring: string
  text: string
}

/**
 * Seuils officiels MoCA — Nasreddine et al. 2005.
 * S'applique au TOTAL CORRIGÉ (après +1 si scolarité ≤ 12 ans).
 */
function severityFor(totalCorrige: number): Severity {
  if (totalCorrige >= 26) return { label: 'Pas d\'atteinte',     bg: 'bg-emerald-50',  ring: 'border-emerald-300',  text: 'text-emerald-800' }
  if (totalCorrige >= 18) return { label: 'Atteinte légère',     bg: 'bg-amber-50',    ring: 'border-amber-300',    text: 'text-amber-800' }
  if (totalCorrige >= 10) return { label: 'Atteinte modérée',    bg: 'bg-orange-50',   ring: 'border-orange-300',   text: 'text-orange-800' }
  return                         { label: 'Atteinte sévère',    bg: 'bg-red-50',      ring: 'border-red-300',      text: 'text-red-800' }
}

/**
 * Parse "" ou "3" ou "5" en nombre, clampé à [0, max]. "" → 0.
 * Tolère les espaces / virgules. Tout ce qui n'est pas un entier propre → 0.
 */
function parseScore(raw: string, max: number): number {
  const trimmed = (raw || '').trim()
  if (!trimmed) return 0
  const n = parseInt(trimmed, 10)
  if (isNaN(n) || n < 0) return 0
  return Math.min(max, n)
}

export default function MocaScoresInput({ notes, onNotesChange, onResultatsChange, onError }: Props) {
  const [state, setState] = useState<MocaState>({
    visuospatial: '', denomination: '', memoire: '',
    attention: '', langage: '', abstraction: '', orientation: '',
    scolariteCourte: false,
  })

  // Total brut (somme des 7 domaines, sans ajustement).
  const totalBrut = useMemo(() =>
    DOMAINS.reduce((acc, d) => acc + parseScore(state[d.key], d.max), 0),
    [state],
  )
  const ajustement = state.scolariteCourte ? 1 : 0
  const totalCorrige = Math.min(30, totalBrut + ajustement)
  const severity = useMemo(() => severityFor(totalCorrige), [totalCorrige])

  // Au moins un score saisi pour considérer le formulaire "actif".
  const hasAnyScore = useMemo(
    () => DOMAINS.some(d => state[d.key].trim() !== ''),
    [state],
  )

  // Émet la string normalisée à chaque changement.
  // Format inspiré de la convention `resultats_manuels` du reste de l'app :
  // une ligne par épreuve avec "Domaine : score/max", puis bloc TOTAL.
  useEffect(() => {
    if (!hasAnyScore) {
      onResultatsChange('')
      return
    }
    const lines: string[] = []
    lines.push('=== MoCA — Screening cognitif ===')
    for (const d of DOMAINS) {
      const v = parseScore(state[d.key], d.max)
      const pct = Math.round((v / d.max) * 100)
      lines.push(`${d.label} : ${v}/${d.max} (${pct}%)`)
    }
    lines.push('---')
    lines.push(`TOTAL brut : ${totalBrut}/30`)
    if (state.scolariteCourte) {
      lines.push(`Scolarité ≤ 12 ans : +1 → TOTAL CORRIGÉ : ${totalCorrige}/30`)
    } else {
      lines.push(`Scolarité > 12 ans : pas d'ajustement → TOTAL : ${totalCorrige}/30`)
    }
    lines.push(`Interprétation : ${severity.label}`)
    onResultatsChange(lines.join('\n'))
  // onResultatsChange est intentionnellement omis : si le parent ne le mémorise pas,
  // il changerait à chaque render → boucle. Les valeurs qui comptent sont les scores.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, totalBrut, totalCorrige, hasAnyScore, severity.label])

  const handleScoreChange = (key: keyof MocaState, value: string, max?: number) => {
    if (key === 'scolariteCourte') return  // protégé par toggle
    // On garde la chaîne brute pour permettre la saisie progressive ("" → "1" → "12" → "1")
    // mais on clamp à max si l'utilisateur tape un nombre supérieur.
    if (value === '') {
      setState(s => ({ ...s, [key]: '' }))
      return
    }
    const n = parseInt(value, 10)
    if (isNaN(n)) return  // refuse les caractères non-numériques
    const clamped = max !== undefined ? Math.min(max, Math.max(0, n)) : Math.max(0, n)
    setState(s => ({ ...s, [key]: String(clamped) }))
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-2 p-3 rounded-lg border border-indigo-200 bg-indigo-50">
        <Brain size={18} className="text-indigo-600 shrink-0 mt-0.5" />
        <div className="text-sm">
          <p className="font-semibold text-indigo-900">Saisie structurée MoCA</p>
          <p className="text-indigo-700 text-xs mt-0.5">
            Saisissez le score obtenu pour chacun des 7 domaines. Le total et
            l&apos;interprétation sont calculés automatiquement selon les seuils officiels.
          </p>
        </div>
      </div>

      {/* Grille des 7 domaines */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {DOMAINS.map(d => {
          const value = parseScore(state[d.key], d.max)
          const pct = state[d.key].trim() !== '' ? Math.round((value / d.max) * 100) : null
          return (
            <div
              key={d.key}
              className="rounded-lg border border-gray-200 bg-white p-3"
            >
              <label className="block text-sm font-medium text-gray-900">
                {d.label}
              </label>
              <p className="text-xs text-gray-500 mt-0.5 mb-2">{d.hint}</p>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={0}
                  max={d.max}
                  step={1}
                  value={state[d.key]}
                  onChange={(e) => handleScoreChange(d.key, e.target.value, d.max)}
                  placeholder="0"
                  className="w-16 px-2 py-1.5 border border-gray-300 rounded text-center text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
                <span className="text-sm text-gray-500">/ {d.max}</span>
                {pct !== null && (
                  <span
                    className={`ml-auto text-xs font-medium ${
                      pct >= 80 ? 'text-emerald-700'
                      : pct >= 50 ? 'text-amber-700'
                      : 'text-red-700'
                    }`}
                  >
                    {pct}%
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Ajustement scolarité */}
      <label className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 bg-gray-50 cursor-pointer hover:border-gray-300">
        <input
          type="checkbox"
          checked={state.scolariteCourte}
          onChange={(e) => setState(s => ({ ...s, scolariteCourte: e.target.checked }))}
          className="mt-0.5 w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
        />
        <div className="text-sm">
          <p className="font-medium text-gray-900">Scolarité ≤ 12 ans (ajout +1 point)</p>
          <p className="text-xs text-gray-500 mt-0.5">
            Ajustement officiel pour ne pas surestimer une atteinte chez les patients à
            faible niveau scolaire. À cocher si le patient a au plus le niveau collège.
          </p>
        </div>
      </label>

      {/* Total + badge sévérité */}
      <div className={`rounded-lg border-2 ${severity.ring} ${severity.bg} p-4`}>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <p className="text-xs text-gray-600 uppercase tracking-wide font-semibold">
              Total {state.scolariteCourte ? 'corrigé' : 'MoCA'}
            </p>
            <p className="text-3xl font-bold text-gray-900 mt-1 font-mono">
              {totalCorrige}<span className="text-xl text-gray-500">/30</span>
            </p>
            {state.scolariteCourte && (
              <p className="text-xs text-gray-600 mt-1">
                ({totalBrut}/30 brut + 1 point scolarité)
              </p>
            )}
          </div>
          <div className="text-right">
            <p className={`text-sm font-semibold ${severity.text} flex items-center gap-1.5`}>
              {totalCorrige >= 26 ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
              {severity.label}
            </p>
            <p className="text-xs text-gray-600 mt-1">
              {totalCorrige >= 26 ? 'Seuil officiel ≥ 26/30' :
               totalCorrige >= 18 ? '18 – 25/30' :
               totalCorrige >= 10 ? '10 – 17/30' :
                                    '< 10/30'}
            </p>
          </div>
        </div>
        {totalCorrige < 26 && hasAnyScore && (
          <p className="mt-3 text-xs text-gray-700 bg-white/60 rounded px-3 py-2 border border-gray-200">
            Le screening met en évidence une atteinte des fonctions cognitives. Un
            <strong> bilan neuropsychologique approfondi </strong>
            sera recommandé pour caractériser le profil cognitif et orienter la prise en charge.
          </p>
        )}
      </div>

      {/* Notes d'observation (optionnel, dictée) */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="block text-sm font-medium text-gray-700">
            Notes d&apos;observation (optionnel)
          </label>
          <MicButton
            value={notes}
            onChange={onNotesChange}
            onError={onError}
          />
        </div>
        <p className="text-xs text-gray-500 mb-2">
          Comportement pendant la passation, fatigabilité, anxiété, collaboration, conditions
          de passation (lunettes, audition, langue maternelle…).
        </p>
        <textarea
          value={notes}
          onChange={(e) => onNotesChange(e.target.value)}
          rows={4}
          placeholder="Madame X collabore volontiers, sans signe de fatigue durant les 10 minutes du test. Lunettes portées. Plainte mnésique active rapportée par l'entourage."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm resize-none"
        />
      </div>
    </div>
  )
}
