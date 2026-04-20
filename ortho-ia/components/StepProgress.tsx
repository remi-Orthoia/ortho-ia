'use client'

import { Check } from 'lucide-react'

/**
 * Progress bar visuelle pour les 5 étapes du formulaire CRBO.
 * Affiche les étapes (terminée, actuelle, à venir), le temps estimé restant
 * et un résumé de la phase (En séance vs Après séance).
 */

interface Step {
  index: number
  label: string
  phase: 'pre' | 'en-seance' | 'post-seance'
  estimatedMinutes: number
}

const STEPS: Step[] = [
  { index: 1, label: 'Vos coordonnées',    phase: 'pre',          estimatedMinutes: 1 },
  { index: 2, label: 'Patient',            phase: 'pre',          estimatedMinutes: 1 },
  { index: 3, label: 'Médecin & Motif',    phase: 'pre',          estimatedMinutes: 1 },
  { index: 4, label: 'Anamnèse',           phase: 'en-seance',    estimatedMinutes: 4 },
  { index: 5, label: 'Résultats',          phase: 'post-seance',  estimatedMinutes: 5 },
]

const PHASE_LABEL: Record<Step['phase'], { label: string; color: string }> = {
  'pre':          { label: 'Préparation',   color: 'text-gray-500 dark:text-gray-400' },
  'en-seance':    { label: 'En séance',     color: 'text-amber-600 dark:text-amber-400' },
  'post-seance':  { label: 'Après séance',  color: 'text-primary-600 dark:text-primary-400' },
}

interface Props {
  currentStep: number
  /** Callback pour cliquer sur une étape (optionnel, si backward-nav autorisé). */
  onStepClick?: (step: number) => void
}

export default function StepProgress({ currentStep, onStepClick }: Props) {
  const remainingMinutes = STEPS
    .filter(s => s.index >= currentStep)
    .reduce((acc, s) => acc + s.estimatedMinutes, 0)

  const currentStepData = STEPS.find(s => s.index === currentStep)
  const phaseLabel = currentStepData ? PHASE_LABEL[currentStepData.phase] : null

  return (
    <div className="mb-6">
      {/* Info phase + temps estimé */}
      <div className="flex items-center justify-between mb-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-gray-500 dark:text-gray-400">Étape {currentStep}/5</span>
          {phaseLabel && (
            <>
              <span className="text-gray-300 dark:text-gray-700">•</span>
              <span className={`font-semibold uppercase tracking-wider ${phaseLabel.color}`}>
                {phaseLabel.label}
              </span>
            </>
          )}
        </div>
        <span className="text-gray-500 dark:text-gray-400">
          ≈ {remainingMinutes} min restantes
        </span>
      </div>

      {/* Stepper visuel */}
      <div className="flex items-center gap-1 sm:gap-2">
        {STEPS.map((step, idx) => {
          const isDone = step.index < currentStep
          const isActive = step.index === currentStep
          const isPast = isDone || isActive
          const isClickable = isDone && !!onStepClick

          return (
            <div key={step.index} className="flex-1 flex items-center gap-1 sm:gap-2 min-w-0">
              <button
                type="button"
                onClick={() => isClickable && onStepClick!(step.index)}
                disabled={!isClickable}
                className={`relative shrink-0 flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full text-xs font-bold transition-all duration-200 ${
                  isDone
                    ? 'bg-primary-600 text-white cursor-pointer hover:bg-primary-700 hover:scale-110'
                    : isActive
                    ? 'bg-primary-600 text-white ring-4 ring-primary-200 dark:ring-primary-900/50 animate-scale-in'
                    : 'bg-gray-200 dark:bg-surface-dark-muted text-gray-500 dark:text-gray-500'
                }`}
                aria-label={`Étape ${step.index} : ${step.label}`}
              >
                {isDone ? <Check size={14} /> : step.index}
              </button>

              {/* Connector (sauf dernier) */}
              {idx < STEPS.length - 1 && (
                <div className="flex-1 h-1 rounded-full bg-gray-200 dark:bg-surface-dark-muted overflow-hidden">
                  <div
                    className={`h-full bg-primary-600 transition-all duration-500 ease-smooth ${
                      isPast ? 'w-full' : 'w-0'
                    }`}
                  />
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Label étape courante (visible sur mobile seulement, desktop a son titre propre) */}
      {currentStepData && (
        <p className="mt-3 text-sm font-medium text-gray-700 dark:text-gray-300 sm:hidden">
          {currentStepData.label}
        </p>
      )}
    </div>
  )
}
