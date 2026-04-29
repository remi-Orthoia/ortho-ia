'use client'

import { useEffect, useRef, useState } from 'react'
import { Mic, MicOff, Loader2, Square } from 'lucide-react'
import { useWhisper } from '@/hooks/useWhisper'

interface Props {
  /** Valeur courante du textarea cible. */
  value: string
  /** Setter qui reçoit la nouvelle valeur (concat de l'existant + transcription). */
  onChange: (newValue: string) => void
  /** Label accessible (aria) — par défaut "Dicter". */
  ariaLabel?: string
  /** Variant visuel : "ghost" (icône seule, transparent) ou "filled" (avec fond). */
  variant?: 'ghost' | 'filled'
  /** Affichage compact (juste l'icône) ou avec libellé "Dicter". */
  compact?: boolean
  /** Désactive le bouton (ex: parent en cours de chargement). */
  disabled?: boolean
  /** Callback erreur — affichage typique via parent. */
  onError?: (msg: string) => void
}

/**
 * Bouton micro générique pour dicter du texte dans n'importe quel textarea.
 * Click pour démarrer/arrêter l'enregistrement. Au stop, l'audio part vers
 * /api/transcribe (Whisper) et le texte transcrit est appended à `value`.
 */
export default function MicButton({
  value,
  onChange,
  ariaLabel = 'Dicter à la voix',
  variant = 'ghost',
  compact = false,
  disabled = false,
  onError,
}: Props) {
  const [elapsed, setElapsed] = useState(0)
  const startedAt = useRef<number | null>(null)
  const valueRef = useRef(value)
  useEffect(() => { valueRef.current = value }, [value])

  const { state, error, start, stop } = useWhisper({
    onResult: (text) => {
      if (!text) return
      const prev = valueRef.current
      const sep = prev && !/\s$/.test(prev) ? ' ' : ''
      onChange((prev + sep + text).trim())
    },
    onError: (msg) => onError?.(msg),
  })

  // Compteur secondes pendant l'enregistrement
  useEffect(() => {
    if (state === 'recording') {
      startedAt.current = Date.now()
      setElapsed(0)
      const id = setInterval(() => {
        if (startedAt.current) {
          setElapsed(Math.floor((Date.now() - startedAt.current) / 1000))
        }
      }, 500)
      return () => clearInterval(id)
    }
    startedAt.current = null
    setElapsed(0)
  }, [state])

  const isRec = state === 'recording'
  const isTranscribing = state === 'transcribing'
  const isError = state === 'error'

  const handleClick = () => {
    if (isTranscribing || disabled) return
    if (isRec) stop()
    else start()
  }

  // Styles — un seul rendu, prominent + dark-mode safe.
  // Avant : `bg-gray-100 text-gray-700` sans variante dark → invisible sur
  // un thème sombre ou contre une carte légèrement grise. Maintenant on
  // utilise toujours du primary-600 / primary-700 hover, en blanc texte/icône.
  const base = variant === 'filled'
    ? 'inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-semibold transition shadow-sm'
    : 'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition shadow-sm'

  const colors =
    isRec ? 'bg-red-600 text-white hover:bg-red-700 ring-2 ring-red-300 animate-pulse' :
    isTranscribing ? 'bg-amber-500 text-white' :
    isError ? 'bg-orange-500 text-white hover:bg-orange-600' :
    'bg-primary-600 text-white hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600'

  const Icon = isRec ? Square : isTranscribing ? Loader2 : isError ? MicOff : Mic

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isTranscribing || disabled}
      aria-label={ariaLabel}
      title={
        isRec ? 'Cliquez pour arrêter et transcrire' :
        isTranscribing ? 'Transcription en cours…' :
        isError ? error || 'Erreur micro' :
        'Cliquez pour dicter à la voix (Whisper)'
      }
      className={`${base} ${colors} disabled:opacity-60 disabled:cursor-not-allowed`}
    >
      <Icon size={variant === 'filled' ? 18 : 15} className={isTranscribing ? 'animate-spin' : ''} aria-hidden="true" />
      {!compact && (
        <span>
          {isRec ? `Stop ${elapsed}s` :
           isTranscribing ? 'Transcription…' :
           isError ? 'Réessayer' :
           'Dicter'}
        </span>
      )}
    </button>
  )
}
