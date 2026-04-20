'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { X, ArrowRight, Sparkles, Users, FilePlus } from 'lucide-react'

/**
 * Tour guidé 3 étapes, affiché au 1er login (une seule fois, persisté localStorage).
 * Skippable à tout moment. Non bloquant.
 */

const STORAGE_KEY = 'orthoia.onboarding-tour.v1'

interface Step {
  icon: React.ElementType
  title: string
  description: string
  cta: { label: string; href?: string }
}

const STEPS: Step[] = [
  {
    icon: Sparkles,
    title: 'Bienvenue sur Ortho.ia 👋',
    description:
      'Votre CRBO en 3 minutes au lieu de 45. Prenons 30 secondes pour vous montrer comment ça marche.',
    cta: { label: 'C\'est parti' },
  },
  {
    icon: Users,
    title: 'Complétez votre profil',
    description:
      'Renseignez vos coordonnées professionnelles (nom, adresse, téléphone). Elles seront pré-remplies automatiquement dans chaque CRBO — plus jamais à retaper.',
    cta: { label: 'Ouvrir mon profil', href: '/dashboard/profil' },
  },
  {
    icon: FilePlus,
    title: 'Créez votre premier CRBO',
    description:
      'Un formulaire guidé en 5 étapes : patient → médecin → anamnèse → résultats → génération IA. Importez un PDF Exalang ou saisissez à la main.',
    cta: { label: 'Démarrer un CRBO', href: '/dashboard/nouveau-crbo' },
  },
]

export default function OnboardingTour() {
  const [visible, setVisible] = useState(false)
  const [step, setStep] = useState(0)

  useEffect(() => {
    try {
      const seen = localStorage.getItem(STORAGE_KEY)
      if (!seen) {
        // Léger délai pour éviter de surgir instantanément
        const timer = setTimeout(() => setVisible(true), 600)
        return () => clearTimeout(timer)
      }
    } catch { /* SSR */ }
  }, [])

  const dismiss = (completed = false) => {
    try { localStorage.setItem(STORAGE_KEY, completed ? 'completed' : 'dismissed') } catch {}
    setVisible(false)
  }

  const next = () => {
    if (step < STEPS.length - 1) setStep(step + 1)
    else dismiss(true)
  }

  if (!visible) return null
  const current = STEPS[step]
  const Icon = current.icon

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center px-4 animate-fade-in">
      <div className="card-lifted max-w-md w-full p-6 sm:p-8 relative animate-scale-in">
        <button
          onClick={() => dismiss(false)}
          className="absolute top-3 right-3 p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-surface-dark-muted"
          aria-label="Fermer"
        >
          <X size={16} />
        </button>

        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white shadow-lg mb-5">
          <Icon size={26} />
        </div>

        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
          {current.title}
        </h2>
        <p className="mt-2 text-gray-600 dark:text-gray-400 leading-relaxed">
          {current.description}
        </p>

        {/* Progression */}
        <div className="mt-6 flex items-center gap-2">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === step ? 'w-8 bg-primary-600' : i < step ? 'w-1.5 bg-primary-300' : 'w-1.5 bg-gray-200 dark:bg-surface-dark-muted'
              }`}
            />
          ))}
        </div>

        <div className="mt-6 flex items-center gap-2 justify-end">
          <button
            onClick={() => dismiss(false)}
            className="btn-ghost text-sm"
          >
            Passer
          </button>
          {current.cta.href ? (
            <Link href={current.cta.href} onClick={() => dismiss(true)} className="btn-primary text-sm">
              {current.cta.label}
              <ArrowRight size={14} />
            </Link>
          ) : (
            <button onClick={next} className="btn-primary text-sm">
              {current.cta.label}
              <ArrowRight size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
