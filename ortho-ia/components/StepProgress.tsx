'use client'

import { Check } from 'lucide-react'

/**
 * Progress bar visuelle pour les 4 étapes du formulaire CRBO.
 * Le profil ortho est récupéré automatiquement depuis Supabase (table profiles)
 * — il n'apparaît plus comme étape du formulaire.
 */

interface Step {
  index: number
  label: string
  phase: 'pre' | 'en-seance' | 'post-seance'
  estimatedMinutes: number
}

const STEPS: Step[] = [
  { index: 1, label: 'Patient',            phase: 'pre',          estimatedMinutes: 1 },
  { index: 2, label: 'Médecin & Motif',    phase: 'pre',          estimatedMinutes: 1 },
  { index: 3, label: 'Anamnèse',           phase: 'en-seance',    estimatedMinutes: 4 },
  { index: 4, label: 'Résultats',          phase: 'post-seance',  estimatedMinutes: 5 },
]

const PHASE_LABEL: Record<Step['phase'], { label: string; color: string }> = {
  'pre':          { label: 'Préparation',   color: 'var(--fg-3)' },
  'en-seance':    { label: 'En séance',     color: 'var(--ds-warning)' },
  'post-seance':  { label: 'Après séance',  color: 'var(--ds-primary)' },
}

interface Props {
  currentStep: number
  /** Callback pour cliquer sur une étape (optionnel, si backward-nav autorisé). */
  onStepClick?: (step: number) => void
}

export default function StepProgress({ currentStep, onStepClick }: Props) {
  const currentStepData = STEPS.find(s => s.index === currentStep)
  const phaseLabel = currentStepData ? PHASE_LABEL[currentStepData.phase] : null

  return (
    <div className="mb-6" style={{ fontFamily: 'var(--font-body)' }}>
      {/* Info phase courante */}
      <div className="flex items-center mb-3" style={{ fontSize: 12 }}>
        <div className="flex items-center gap-2">
          <span style={{ color: 'var(--fg-3)' }}>Étape {currentStep}/{STEPS.length}</span>
          {phaseLabel && (
            <>
              <span style={{ color: 'var(--border-ds-strong)' }}>•</span>
              <span
                style={{
                  fontWeight: 600,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  color: phaseLabel.color,
                }}
              >
                {phaseLabel.label}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Stepper visuel */}
      <div className="flex items-center gap-1 sm:gap-2">
        {STEPS.map((step, idx) => {
          const isDone = step.index < currentStep
          const isActive = step.index === currentStep
          const isPast = isDone || isActive
          const isClickable = isDone && !!onStepClick

          const buttonBg = isDone || isActive ? 'var(--ds-primary)' : 'var(--bg-surface-2)'
          const buttonColor = isDone || isActive ? 'var(--fg-on-brand)' : 'var(--fg-3)'

          return (
            <div key={step.index} className="flex-1 flex items-center gap-1 sm:gap-2 min-w-0">
              <button
                type="button"
                onClick={() => isClickable && onStepClick!(step.index)}
                disabled={!isClickable}
                aria-label={`Étape ${step.index} : ${step.label}`}
                className={isActive ? 'animate-scale-in' : ''}
                style={{
                  position: 'relative',
                  flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  width: 32, height: 32,
                  borderRadius: 999,
                  fontSize: 12, fontWeight: 700,
                  background: buttonBg,
                  color: buttonColor,
                  border: 0,
                  cursor: isClickable ? 'pointer' : 'default',
                  transition: 'all 200ms var(--ease-out)',
                  boxShadow: isActive
                    ? '0 0 0 4px var(--ds-primary-soft)'
                    : 'none',
                }}
              >
                {isDone ? <Check size={14} /> : step.index}
              </button>

              {/* Connector (sauf dernier) */}
              {idx < STEPS.length - 1 && (
                <div
                  className="flex-1 overflow-hidden"
                  style={{
                    height: 4,
                    borderRadius: 999,
                    background: 'var(--bg-surface-2)',
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      background: 'var(--ds-primary)',
                      width: isPast ? '100%' : 0,
                      transition: 'width 500ms var(--ease-out)',
                    }}
                  />
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Label étape courante (visible sur mobile seulement, desktop a son titre propre) */}
      {currentStepData && (
        <p
          className="mt-3 sm:hidden"
          style={{ fontSize: 14, fontWeight: 500, color: 'var(--fg-2)' }}
        >
          {currentStepData.label}
        </p>
      )}
    </div>
  )
}
