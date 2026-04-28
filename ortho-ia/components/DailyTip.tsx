'use client'

import { useEffect, useState } from 'react'
import { Lightbulb, X } from 'lucide-react'

/**
 * Astuce contextuelle discrète selon le nombre de CRBO déjà générés
 * (workflow de l'ortho). Persiste les "vus" sur 24h en localStorage.
 */

interface Tip {
  id: string
  /** Condition d'affichage basée sur le nombre de CRBO total de l'ortho. */
  minCrbo: number
  maxCrbo?: number
  text: React.ReactNode
}

const TIPS: Tip[] = [
  {
    id: 'welcome-profile',
    minCrbo: 0,
    maxCrbo: 0,
    text: (
      <>
        Avant votre premier CRBO, pensez à <strong>compléter votre profil</strong> — cela
        évitera de retaper votre adresse et téléphone à chaque bilan.
      </>
    ),
  },
  {
    id: 'carnet-patients',
    minCrbo: 1,
    maxCrbo: 2,
    text: (
      <>
        Astuce : ajoutez vos patients dans le <strong>Carnet</strong> pour retrouver leur fiche
        en un clic à chaque bilan de renouvellement.
      </>
    ),
  },
  {
    id: 'import-pdf',
    minCrbo: 2,
    maxCrbo: 4,
    text: (
      <>
        Vous avez testé l&apos;<strong>import PDF</strong> ? Notre IA lit votre PDF
        Exalang en 10 secondes et extrait tous les scores avec les bons percentiles.
      </>
    ),
  },
  {
    id: 'timeline-patient',
    minCrbo: 3,
    maxCrbo: 10,
    text: (
      <>
        Pour les bilans de renouvellement, consultez la <strong>timeline d&apos;évolution</strong>{' '}
        dans la fiche du patient — vous voyez les progrès bilan après bilan.
      </>
    ),
  },
  {
    id: 'partage-24h',
    minCrbo: 5,
    text: (
      <>
        Besoin de relire un CRBO sur tablette ? Générez un <strong>lien de partage
        sécurisé 24h</strong> depuis l&apos;aperçu, copiez-le et relisez tranquillement.
      </>
    ),
  },
  {
    id: 'raccourci',
    minCrbo: 3,
    text: (
      <>
        Raccourci pro : <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-surface-dark-muted rounded text-xs font-mono">⌘ + Entrée</kbd> pour
        lancer la génération depuis l&apos;étape 5, sans bouger la souris.
      </>
    ),
  },
  {
    id: 'severite-kanban',
    minCrbo: 5,
    text: (
      <>
        Sur le <strong>Kanban</strong>, un coup d&apos;œil aux badges de sévérité (Léger /
        Modéré / Sévère) vous aide à prioriser vos relectures.
      </>
    ),
  },
]

const STORAGE_KEY = 'orthoia.daily-tip.seen'

function getSeenTips(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return new Set()
    const parsed = JSON.parse(raw) as { tips: string[]; date: string }
    // Reset chaque jour — nouveau jour → toutes les astuces peuvent revenir
    const today = new Date().toISOString().slice(0, 10)
    if (parsed.date !== today) return new Set()
    return new Set(parsed.tips)
  } catch {
    return new Set()
  }
}

function markSeen(tipId: string) {
  try {
    const today = new Date().toISOString().slice(0, 10)
    const seen = getSeenTips()
    seen.add(tipId)
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ tips: Array.from(seen), date: today }))
  } catch {}
}

interface Props {
  /** Nombre de CRBO déjà générés par l'ortho — détermine quelle astuce afficher. */
  crboCount: number
}

export default function DailyTip({ crboCount }: Props) {
  const [tip, setTip] = useState<Tip | null>(null)

  useEffect(() => {
    const seen = getSeenTips()
    const candidates = TIPS.filter(t =>
      crboCount >= t.minCrbo &&
      (t.maxCrbo === undefined || crboCount <= t.maxCrbo) &&
      !seen.has(t.id),
    )
    if (candidates.length === 0) return
    // Choisit le premier candidat (tips triés par pertinence implicite)
    setTip(candidates[0])
  }, [crboCount])

  if (!tip) return null

  const dismiss = () => {
    markSeen(tip.id)
    setTip(null)
  }

  return (
    <div className="card-modern p-4 flex items-start gap-3 bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 border-amber-200 dark:border-amber-800/40 animate-scale-in">
      <div className="shrink-0 w-9 h-9 rounded-lg bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center">
        <Lightbulb className="text-amber-600 dark:text-amber-400" size={16} />
      </div>
      <div className="flex-1 min-w-0 text-sm text-gray-800 dark:text-gray-200">
        <p className="text-[11px] uppercase tracking-wider font-bold text-amber-700 dark:text-amber-400 mb-0.5">
          Astuce du jour
        </p>
        {tip.text}
      </div>
      <button
        onClick={dismiss}
        className="shrink-0 p-1 rounded text-gray-400 hover:bg-white dark:hover:bg-surface-dark-muted hover:text-gray-700 dark:hover:text-gray-200"
        aria-label="Masquer l'astuce"
      >
        <X size={14} />
      </button>
    </div>
  )
}
