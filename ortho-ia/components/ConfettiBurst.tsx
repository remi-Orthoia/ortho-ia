'use client'

import { useEffect, useState } from 'react'

/**
 * Burst de confettis pur CSS/SVG — pas de dépendance.
 * S'affiche pendant 2.5s puis se retire automatiquement.
 * Déclenche via la prop `trigger` qui incrémente (ex: useState number) pour rejouer.
 */

interface Props {
  trigger: number
  /** Nombre de particules. Défaut : 60. */
  count?: number
}

const COLORS = [
  '#22c55e', // primary
  '#10b981', // emerald
  '#f5a142', // warm
  '#fbbf24', // amber
  '#60a5fa', // blue
  '#c084fc', // purple
]

export default function ConfettiBurst({ trigger, count = 60 }: Props) {
  const [visible, setVisible] = useState(false)
  const [particles, setParticles] = useState<Array<{ id: number; left: number; delay: number; color: string; size: number; duration: number; rotation: number; drift: number }>>([])

  useEffect(() => {
    if (!trigger) return
    // Générer les particules
    const next = Array.from({ length: count }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 0.4,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      size: 6 + Math.random() * 6,
      duration: 2 + Math.random() * 1.2,
      rotation: Math.random() * 720 - 360,
      drift: (Math.random() - 0.5) * 40,
    }))
    setParticles(next)
    setVisible(true)
    const t = setTimeout(() => setVisible(false), 3200)
    return () => clearTimeout(t)
  }, [trigger, count])

  if (!visible) return null

  return (
    <div className="fixed inset-0 pointer-events-none z-[100] overflow-hidden" aria-hidden="true">
      {particles.map(p => (
        <span
          key={p.id}
          className="absolute top-0 block rounded-sm"
          style={{
            left: `${p.left}%`,
            width: `${p.size}px`,
            height: `${p.size * 0.6}px`,
            backgroundColor: p.color,
            animation: `confetti-fall ${p.duration}s cubic-bezier(0.2, 0.6, 0.3, 1) ${p.delay}s forwards`,
            // Utilisation de CSS variables pour personnaliser l'animation par particule
            ['--rot' as any]: `${p.rotation}deg`,
            ['--drift' as any]: `${p.drift}vw`,
          }}
        />
      ))}
      <style jsx>{`
        @keyframes confetti-fall {
          0% {
            transform: translateY(-10vh) translateX(0) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(110vh) translateX(var(--drift)) rotate(var(--rot));
            opacity: 0.2;
          }
        }
      `}</style>
    </div>
  )
}
