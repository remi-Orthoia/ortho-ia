'use client'

import { useEffect, useRef, useState } from 'react'
import { Mic, MicOff, Loader2, Square } from 'lucide-react'
import { useWhisper } from '@/hooks/useWhisper'
import { applyGlossaire } from '@/lib/glossaire'
import { normalizePatientName } from '@/lib/patient-name-normalizer'

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
  /**
   * Prenom du patient saisi dans le form. Sert a :
   *  1. Biaiser Whisper via le `prompt` pour qu'il prefere cette orthographe
   *  2. Normaliser le texte transcrit post-Whisper (Levenshtein) au cas ou
   *     le biasing n'a pas suffi (ex: prenom rare, voix etouffee).
   * Optionnel — sans, comportement identique a l'ancien (texte brut Whisper).
   */
  patientPrenom?: string
  /** Nom du patient — meme role que patientPrenom. */
  patientNom?: string
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
  patientPrenom,
  patientNom,
}: Props) {
  const [elapsed, setElapsed] = useState(0)
  const startedAt = useRef<number | null>(null)
  const valueRef = useRef(value)
  useEffect(() => { valueRef.current = value }, [value])

  // Contexte envoye a Whisper pour biaiser le decodage vers le prenom/nom
  // exact du patient. Garde court (< 100 chars) pour ne pas saturer le prompt.
  const extraContext = ((): string | undefined => {
    const p = (patientPrenom || '').trim()
    const n = (patientNom || '').trim()
    if (!p && !n) return undefined
    return `Patient: ${[p, n].filter(Boolean).join(' ')}.`
  })()

  const { state, error, start, stop } = useWhisper({
    extraContext,
    onResult: (text) => {
      if (!text) return
      // Pipeline de nettoyage post-Whisper :
      //  1. applyGlossaire : rattrape les termes cliniques (ULIS, AESH,
      //     Exalang, EVALO...) que Whisper aurait mal transcrits.
      //  2. normalizePatientName : detecte les variantes phonetiques du
      //     prenom/nom patient ("Melina" → "Méline") via Levenshtein, en
      //     filet de securite si le biasing Whisper n'a pas suffi.
      const afterGlossaire = applyGlossaire(text)
      const { text: corrected } = normalizePatientName(afterGlossaire, patientPrenom, patientNom)
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
