'use client'

import { useEffect, useState } from 'react'
import { Sparkles, FileText, Brain, PenLine, CheckCircle2 } from 'lucide-react'

/**
 * Overlay plein écran affiché pendant la génération du CRBO (15-40s).
 * Séquence visuelle d'étapes pour rassurer l'ortho pendant l'attente Claude API.
 */

interface Step {
  icon: React.ElementType
  label: string
  detail: string
}

const STEPS: Step[] = [
  { icon: FileText, label: 'Lecture des résultats',     detail: 'Interprétation des percentiles et scores bruts' },
  { icon: Brain,    label: 'Analyse clinique',          detail: 'Corrélations inter-domaines, patterns diagnostiques' },
  { icon: PenLine,  label: 'Rédaction du CRBO',         detail: 'Anamnèse en prose, commentaires, diagnostic différentiel' },
  { icon: Sparkles, label: 'Recommandations',           detail: 'PAP, comorbidités, glossaire' },
]

export default function GenerationLoader({ visible }: { visible: boolean }) {
  const [stepIndex, setStepIndex] = useState(0)
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    if (!visible) {
      setStepIndex(0)
      setElapsed(0)
      return
    }
    // Avance d'étape toutes les 5-7 secondes (visuel approximatif)
    const stepInterval = setInterval(() => {
      setStepIndex(prev => Math.min(prev + 1, STEPS.length - 1))
    }, 6_000)
    // Compteur temps
    const timeInterval = setInterval(() => {
      setElapsed(prev => prev + 1)
    }, 1_000)
    return () => {
      clearInterval(stepInterval)
      clearInterval(timeInterval)
    }
  }, [visible])

  if (!visible) return null

  return (
    <div className="fixed inset-0 z-50 bg-white/80 dark:bg-surface-dark/80 backdrop-blur-md flex items-center justify-center p-6 animate-fade-in">
      <div className="max-w-md w-full card-lifted p-8 text-center">
        {/* Icône animée */}
        <div className="relative w-16 h-16 mx-auto">
          <div className="absolute inset-0 rounded-full bg-primary-100 dark:bg-primary-900/40 animate-ping opacity-75" />
          <div className="relative w-16 h-16 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-lg">
            <Sparkles className="text-white animate-sparkle" size={28} />
          </div>
        </div>

        <h2 className="mt-6 text-xl font-bold text-gray-900 dark:text-gray-100">
          Génération en cours…
        </h2>
        <p className="mt-1.5 text-sm text-gray-500 dark:text-gray-400">
          Claude rédige votre CRBO. Comptez 30 à 150 secondes selon la richesse du bilan.
        </p>

        {/* Étapes */}
        <div className="mt-6 space-y-2.5 text-left">
          {STEPS.map((step, idx) => {
            const Icon = step.icon
            const done = idx < stepIndex
            const active = idx === stepIndex
            return (
              <div
                key={idx}
                className={`flex items-start gap-3 p-2.5 rounded-lg transition-all duration-300 ${
                  active ? 'bg-primary-50 dark:bg-primary-900/20' : ''
                }`}
              >
                <div
                  className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
                    done
                      ? 'bg-primary-600 text-white'
                      : active
                      ? 'bg-primary-100 dark:bg-primary-900/50 text-primary-700 dark:text-primary-300 ring-2 ring-primary-300 dark:ring-primary-700'
                      : 'bg-gray-100 dark:bg-surface-dark-muted text-gray-400 dark:text-gray-600'
                  }`}
                >
                  {done ? <CheckCircle2 size={16} /> : <Icon size={14} />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium transition-colors ${
                    done || active ? 'text-gray-900 dark:text-gray-100' : 'text-gray-400 dark:text-gray-600'
                  }`}>
                    {step.label}
                    {active && (
                      <span className="inline-flex items-center ml-2 gap-0.5">
                        <span className="w-1 h-1 rounded-full bg-primary-600 animate-dot-1" />
                        <span className="w-1 h-1 rounded-full bg-primary-600 animate-dot-2" />
                        <span className="w-1 h-1 rounded-full bg-primary-600 animate-dot-3" />
                      </span>
                    )}
                  </p>
                  <p className={`text-xs transition-colors ${
                    done || active ? 'text-gray-600 dark:text-gray-400' : 'text-gray-400 dark:text-gray-600'
                  }`}>
                    {step.detail}
                  </p>
                </div>
              </div>
            )
          })}
        </div>

        {/* Barre de progression shimmer */}
        <div className="mt-6 h-1 rounded-full bg-gray-100 dark:bg-surface-dark-muted overflow-hidden">
          <div className="h-full shimmer-bg animate-shimmer bg-[length:200%_100%]" />
        </div>
        <p className="mt-2 text-xs text-gray-400 dark:text-gray-600">
          {elapsed}s écoulées · données anonymisées avant envoi
        </p>
      </div>
    </div>
  )
}
