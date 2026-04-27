'use client'

import { useEffect, useRef, useState } from 'react'
import { Mic, MicOff, Loader2, Square } from 'lucide-react'
import { useWhisper } from '@/lib/use-whisper'

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

  // Styles
  const baseGhost = 'inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium transition'
  const baseFilled = 'inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition'
  const base = variant === 'ghost' ? baseGhost : baseFilled

  const colors =
    isRec ? 'bg-red-100 text-red-700 hover:bg-red-200 ring-2 ring-red-300 animate-pulse' :
    isTranscribing ? 'bg-amber-100 text-amber-800' :
    isError ? 'bg-orange-50 text-orange-700 hover:bg-orange-100' :
    'bg-gray-100 text-gray-700 hover:bg-gray-200'

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
      <Icon size={variant === 'filled' ? 16 : 14} className={isTranscribing ? 'animate-spin' : ''} />
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
