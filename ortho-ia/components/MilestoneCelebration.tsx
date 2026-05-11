'use client'

/**
 * Célébration des paliers de CRBO générés.
 *
 * Déclenchée quand l'utilisateur·rice franchit un seuil (1er, 10e, 25e, 50e,
 * 100e, 250e, 500e, 1000e). Affiche un confetti coloré contextuel + un toast
 * de félicitations + joue le son milestone.
 *
 * Pourquoi ces seuils précis : étude UX classique des onboarding produits B2B —
 * le 1er, le 10e et le 50e sont des étapes psychologiques fortes ; les paliers
 * suivants (100, 250, 500, 1000) maintiennent l'engagement long-terme.
 *
 * Détection : le composant lit le compteur de CRBOs dans crbos.length au
 * moment du mount, et compare avec la valeur précédemment fêtée (localStorage).
 * Si le compteur courant a franchi un palier non encore célébré → trigger.
 */

import { useEffect, useState } from 'react'
import { Sparkles, Trophy } from 'lucide-react'
import ConfettiBurst from './ConfettiBurst'
import { useToast } from './Toast'
import { playMilestone, isSoundEnabled } from '@/lib/sounds'

const MILESTONES: Array<{
  threshold: number
  emoji: string
  message: string
  /** Palette confetti spécifique (override les couleurs par défaut). */
  colors?: string[]
}> = [
  { threshold: 1,    emoji: '🎉', message: 'Bravo pour votre premier CRBO ! Bienvenue dans Ortho.ia.' },
  { threshold: 10,   emoji: '🌱', message: '10 CRBOs déjà — vous prenez le rythme !', colors: ['#22c55e', '#10b981', '#84cc16'] },
  { threshold: 25,   emoji: '⭐', message: '25 CRBOs. Vos patients sont chanceux.', colors: ['#fbbf24', '#f59e0b', '#facc15'] },
  { threshold: 50,   emoji: '🏆', message: '50 CRBOs ! Vous avez économisé ~35h cette saison.', colors: ['#a855f7', '#9333ea', '#c084fc'] },
  { threshold: 100,  emoji: '🌟', message: '100 CRBOs. Officiellement, vous maîtrisez Ortho.ia.', colors: ['#3b82f6', '#06b6d4', '#0ea5e9'] },
  { threshold: 250,  emoji: '🚀', message: '250 CRBOs — c\'est ~190h gagnées. Continuez à transformer vos bilans !', colors: ['#ef4444', '#f97316', '#fbbf24'] },
  { threshold: 500,  emoji: '👑', message: '500 CRBOs. Quelle régularité ! Merci de faire grandir Ortho.ia avec nous.', colors: ['#f43f5e', '#ec4899', '#d946ef'] },
  { threshold: 1000, emoji: '💎', message: '1 000 CRBOs. Vous êtes une légende. Ortho.ia s\'incline.', colors: ['#fde047', '#facc15', '#fbbf24'] },
]

const STORAGE_KEY = 'orthoia.milestones-celebrated'

function loadCelebrated(): number[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.filter((n) => typeof n === 'number') : []
  } catch {
    return []
  }
}

function saveCelebrated(thresholds: number[]) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(thresholds))
  } catch {}
}

interface Props {
  /** Nombre total de CRBOs de l'utilisateur courant. */
  crboCount: number
}

export default function MilestoneCelebration({ crboCount }: Props) {
  const toast = useToast()
  const [triggerKey, setTriggerKey] = useState(0)
  const [colors, setColors] = useState<string[] | undefined>(undefined)

  useEffect(() => {
    if (crboCount <= 0) return
    const celebrated = loadCelebrated()
    // Cherche le plus haut palier que le user vient de franchir mais qui n'a
    // pas encore été célébré. On célèbre 1 seul palier à la fois (le plus
    // haut) — évite de spammer si l'utilisateur a réimporté un gros volume.
    const toCelebrate = MILESTONES
      .filter((m) => m.threshold <= crboCount && !celebrated.includes(m.threshold))
      .pop()
    if (!toCelebrate) return

    // Délai 600ms après mount pour laisser la page se stabiliser.
    const t = setTimeout(() => {
      setColors(toCelebrate.colors)
      setTriggerKey((k) => k + 1)
      toast.success(`${toCelebrate.emoji} ${toCelebrate.message}`, { duration: 8000 })
      if (isSoundEnabled()) playMilestone()
      saveCelebrated([...celebrated, toCelebrate.threshold])
    }, 600)

    return () => clearTimeout(t)
  }, [crboCount, toast])

  return <ConfettiBurst trigger={triggerKey} count={120} colors={colors} />
}
