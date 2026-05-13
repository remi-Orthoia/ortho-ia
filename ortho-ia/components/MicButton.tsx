'use client'

import { useEffect, useRef, useState } from 'react'
import { Mic, MicOff, Loader2, Square } from 'lucide-react'
import { useWhisper } from '@/hooks/useWhisper'
import { applyGlossaire } from '@/lib/glossaire'

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
      // Glossaire CRBO : rattrape les mistranscriptions Whisper sur les
      // termes spécifiques (ULIS, AESH, Exalang, EVALO...) AVANT que le
      // texte n'arrive dans le textarea, pour que l'ortho voie déjà le
      // texte propre et n'ait rien à corriger à la main.
      const corrected = applyGlossaire(text)
      const prev = valueRef.current
      const sep = prev && !/\s$/.test(prev) ? ' ' : ''
      onChange((prev + sep + corrected).trim())
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

  // Couleurs par état — tokens DS uniquement (palette Stéphanie).
  // - recording → danger (rouge sage), pulse + halo
  // - transcribing → warning (ambre)
  // - error → accent (terracotta)
  // - idle → primary (sage)
  const stateBg =
    isRec ? 'var(--ds-danger)' :
    isTranscribing ? 'var(--ds-warning)' :
    isError ? 'var(--ds-accent)' :
    'var(--ds-primary)'
  const stateBgHover =
    isRec ? 'color-mix(in srgb, var(--ds-danger) 85%, black)' :
    isTranscribing ? 'var(--ds-warning)' :
    isError ? 'var(--ds-accent-hover)' :
    'var(--ds-primary-hover)'

  const baseStyle: React.CSSProperties = variant === 'filled'
    ? { padding: '8px 14px', fontSize: 14, gap: 8 }
    : { padding: '6px 12px', fontSize: 12, gap: 6 }

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
      className={isRec ? 'animate-pulse' : ''}
      style={{
        display: 'inline-flex', alignItems: 'center',
        ...baseStyle,
        background: stateBg,
        color: 'var(--fg-on-brand)',
        fontFamily: 'var(--font-body)',
        fontWeight: 600,
        border: 0,
        borderRadius: 'var(--radius-md)',
        boxShadow: isRec
          ? '0 0 0 3px color-mix(in srgb, var(--ds-danger) 30%, transparent), var(--shadow-sm)'
          : 'var(--shadow-sm)',
        cursor: (isTranscribing || disabled) ? 'not-allowed' : 'pointer',
        opacity: (isTranscribing || disabled) ? 0.6 : 1,
        transition: 'background 180ms, box-shadow 180ms',
      }}
      onMouseEnter={(e) => { if (!disabled && !isTranscribing) e.currentTarget.style.background = stateBgHover }}
      onMouseLeave={(e) => { e.currentTarget.style.background = stateBg }}
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
