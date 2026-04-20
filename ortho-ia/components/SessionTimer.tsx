'use client'

import { useEffect, useRef, useState } from 'react'
import { Play, Pause, RotateCcw, Clock } from 'lucide-react'

interface SessionTimerProps {
  /** Durée enregistrée dans le formData (minutes). */
  durationMinutes?: number
  /** Callback au stop ou reset. */
  onChange: (minutes: number) => void
}

function formatHMS(totalSec: number): string {
  const h = Math.floor(totalSec / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const s = totalSec % 60
  const pad = (n: number) => String(n).padStart(2, '0')
  if (h > 0) return `${h}:${pad(m)}:${pad(s)}`
  return `${pad(m)}:${pad(s)}`
}

/**
 * Chronomètre de séance — l'ortho lance au début du bilan, met en pause
 * au besoin, et la durée totale est injectée dans le CRBO pour faciliter
 * la facturation (et documentée dans le prompt).
 *
 * Persiste en localStorage pour résister à un F5 pendant la séance.
 */
const STORAGE_KEY = 'orthoia.session-timer.v1'

export default function SessionTimer({ durationMinutes, onChange }: SessionTimerProps) {
  const [running, setRunning] = useState(false)
  const [elapsedSec, setElapsedSec] = useState(() => (durationMinutes ? durationMinutes * 60 : 0))
  const lastTickRef = useRef<number | null>(null)

  // Restore from localStorage at mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) return
      const parsed = JSON.parse(raw) as { elapsedSec: number; running: boolean; lastTick: number | null }
      let restoredElapsed = parsed.elapsedSec || 0
      if (parsed.running && parsed.lastTick) {
        // Si le timer tournait, compenser le temps écoulé hors-page
        restoredElapsed += Math.floor((Date.now() - parsed.lastTick) / 1000)
      }
      setElapsedSec(restoredElapsed)
      setRunning(!!parsed.running)
    } catch {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Tick every second when running
  useEffect(() => {
    if (!running) {
      lastTickRef.current = null
      return
    }
    lastTickRef.current = Date.now()
    const interval = setInterval(() => {
      setElapsedSec(prev => prev + 1)
      lastTickRef.current = Date.now()
    }, 1000)
    return () => clearInterval(interval)
  }, [running])

  // Sync formData via onChange (par pas de minute entière pour limiter les updates)
  useEffect(() => {
    const minutes = Math.floor(elapsedSec / 60)
    if (minutes !== (durationMinutes ?? 0)) {
      onChange(minutes)
    }
    // Save to localStorage
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        elapsedSec,
        running,
        lastTick: running ? lastTickRef.current : null,
      }))
    } catch {
      // ignore
    }
  }, [elapsedSec, running, durationMinutes, onChange])

  const handleReset = () => {
    setRunning(false)
    setElapsedSec(0)
    onChange(0)
    try { localStorage.removeItem(STORAGE_KEY) } catch {}
  }

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Clock className="text-amber-700" size={20} />
          <div>
            <p className="font-semibold text-amber-900 text-sm">Chronomètre de séance</p>
            <p className="text-xs text-amber-700">Pour la facturation — s'injecte dans le CRBO</p>
          </div>
        </div>
        <div className="font-mono text-2xl font-bold text-amber-900 tabular-nums">
          {formatHMS(elapsedSec)}
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2">
        {!running ? (
          <button
            type="button"
            onClick={() => setRunning(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg text-sm font-medium hover:bg-amber-700 transition"
          >
            <Play size={14} />
            {elapsedSec === 0 ? 'Démarrer' : 'Reprendre'}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setRunning(false)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg text-sm font-medium hover:bg-amber-700 transition"
          >
            <Pause size={14} />
            Pause
          </button>
        )}
        <button
          type="button"
          onClick={handleReset}
          className="inline-flex items-center gap-2 px-3 py-2 bg-white border border-amber-200 text-amber-700 rounded-lg text-sm font-medium hover:bg-amber-100 transition"
        >
          <RotateCcw size={14} />
          Reset
        </button>
        <div className="ml-auto flex items-center gap-2">
          <label className="text-xs text-amber-800 font-medium">Saisie manuelle</label>
          <input
            type="number"
            min={0}
            max={600}
            value={Math.floor(elapsedSec / 60)}
            onChange={(e) => {
              const mins = Math.max(0, parseInt(e.target.value, 10) || 0)
              setElapsedSec(mins * 60)
              onChange(mins)
            }}
            className="w-16 px-2 py-1 border border-amber-300 rounded text-sm text-center"
          />
          <span className="text-xs text-amber-800">min</span>
        </div>
      </div>
    </div>
  )
}
