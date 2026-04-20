'use client'

import { useEffect, useRef, useState } from 'react'

interface Props {
  /** Valeur finale à atteindre. */
  target: number
  /** Durée de l'animation (ms). Défaut : 1500. */
  duration?: number
  /** Délai avant démarrage de l'animation (ms). */
  delay?: number
  /** Formatter optionnel (ex: 1234 → "1 234"). */
  format?: (n: number) => string
  className?: string
}

/**
 * Compteur animé qui démarre quand le composant entre dans le viewport.
 * Utilise IntersectionObserver pour éviter d'animer hors-écran.
 */
export default function AnimatedCounter({
  target,
  duration = 1500,
  delay = 0,
  format = (n) => n.toLocaleString('fr-FR'),
  className = '',
}: Props) {
  const [value, setValue] = useState(0)
  const [started, setStarted] = useState(false)
  const ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    if (!ref.current) return
    const el = ref.current
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !started) {
            setStarted(true)
          }
        })
      },
      { threshold: 0.2 },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [started])

  useEffect(() => {
    if (!started) return
    const t0 = performance.now() + delay
    let rafId = 0

    const step = (now: number) => {
      const elapsed = Math.max(0, now - t0)
      const progress = Math.min(1, elapsed / duration)
      // Easing cubic-out pour un ralenti naturel
      const eased = 1 - Math.pow(1 - progress, 3)
      setValue(Math.floor(eased * target))
      if (progress < 1) rafId = requestAnimationFrame(step)
      else setValue(target)
    }
    rafId = requestAnimationFrame(step)
    return () => cancelAnimationFrame(rafId)
  }, [started, target, duration, delay])

  return (
    <span ref={ref} className={className}>
      {format(value)}
    </span>
  )
}
