'use client'

/**
 * Bouton + modal "Démarrer un CRBO en vocal".
 *
 * Flow :
 *  1. Ortho clique → modal s'ouvre avec un gros bouton micro
 *  2. Click micro → enregistrement (useWhisper)
 *  3. Click stop → Whisper transcrit
 *  4. Transcription envoyée à /api/voice-command/parse → fields structurés
 *  5. Aperçu des champs détectés + bouton "Démarrer le bilan"
 *  6. Click → sessionStorage.setItem('orthoia.voice-prefill', ...)
 *     → router.push('/dashboard/nouveau-crbo?voice=1')
 *  7. Le form lit le prefill et le pose dans formData
 *
 * Wake-word "Hé Ortho.ia" : juste un repère mnémotechnique pour l'ortho,
 * pas une vraie détection de wake-word (qui nécessiterait un modèle audio
 * always-on côté navigateur). Le prompt système strip les wake-words au
 * parsing.
 *
 * Pourquoi un modal et pas un bouton inline : la dictée d'une commande
 * complète prend 5-10s, il faut un espace dédié + un visuel de qualité
 * (l'effet "wow" tient à ça).
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Mic, Square, Loader2, Sparkles, X, Check, AlertCircle, ArrowRight } from 'lucide-react'
import { useWhisper } from '@/hooks/useWhisper'
import { useToast } from './Toast'
import { playSuccessSound, playDing } from '@/lib/sounds'

interface ExtractedVoiceCommand {
  patient_prenom: string | null
  patient_nom: string | null
  patient_classe: string | null
  bilan_type: 'initial' | 'renouvellement' | null
  motif: string | null
  tests_utilises: string[]
  confidence: 'high' | 'medium' | 'low'
  summary: string
}

const PREFILL_KEY = 'orthoia.voice-prefill'

export default function VoiceCommandButton() {
  const router = useRouter()
  const toast = useToast()
  const [open, setOpen] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [parsing, setParsing] = useState(false)
  const [extracted, setExtracted] = useState<ExtractedVoiceCommand | null>(null)
  const [parseError, setParseError] = useState<string | null>(null)

  const { state: micState, error: micError, start, stop } = useWhisper({
    onResult: async (text) => {
      const cleaned = text.trim()
      if (!cleaned) return
      setTranscript(cleaned)
      // Lance le parsing immédiatement
      setParsing(true)
      setParseError(null)
      try {
        const res = await fetch('/api/voice-command/parse', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: cleaned }),
        })
        const data = await res.json()
        if (!res.ok) {
          throw new Error(data.error || 'Erreur d\'analyse')
        }
        setExtracted(data.extracted as ExtractedVoiceCommand)
        playDing()
      } catch (err: any) {
        setParseError(err?.message || 'Impossible d\'analyser la commande')
      } finally {
        setParsing(false)
      }
    },
    onError: (msg) => toast.error(msg),
  })

  const handleClose = () => {
    setOpen(false)
    setTranscript('')
    setExtracted(null)
    setParseError(null)
  }

  const handleStart = () => {
    if (micState === 'recording') {
      stop()
    } else {
      setTranscript('')
      setExtracted(null)
      setParseError(null)
      start()
    }
  }

  const handleLaunch = () => {
    if (!extracted) return
    try {
      sessionStorage.setItem(PREFILL_KEY, JSON.stringify({
        ...extracted,
        // Posé pour ne pas se faire écraser par un brouillon localStorage existant
        // → le form lit la clé voice=1 dans l'URL et ignore le draft.
      }))
      playSuccessSound()
      router.push('/dashboard/nouveau-crbo?voice=1')
    } catch (e) {
      toast.error('Impossible de transférer la commande vers le formulaire.')
    }
  }

  const isRecording = micState === 'recording'
  const isTranscribing = micState === 'transcribing'
  const canLaunch = extracted && extracted.confidence !== 'low'

  return (
    <>
      <button
        type="button"
        onClick={() => { setOpen(true); playDing() }}
        title="Démarrer un nouveau bilan en dictant une commande vocale"
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '10px 16px',
          background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
          color: 'white',
          border: 0,
          borderRadius: 'var(--radius-md, 10px)',
          fontFamily: 'var(--font-body)',
          fontSize: 14, fontWeight: 600,
          cursor: 'pointer',
          boxShadow: '0 4px 12px rgba(99,102,241,0.30)',
          transition: 'transform 180ms, box-shadow 180ms',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 16px rgba(99,102,241,0.40)' }}
        onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(99,102,241,0.30)' }}
      >
        <Mic size={16} />
        <span>Démarrer en vocal</span>
        <span style={{
          fontSize: 10, fontWeight: 700,
          padding: '2px 6px',
          background: 'rgba(255,255,255,0.20)',
          borderRadius: 4, letterSpacing: 0.5,
        }}>
          NEW
        </span>
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Commande vocale Ortho.ia"
          style={{
            position: 'fixed', inset: 0, zIndex: 200,
            background: 'rgba(15, 23, 42, 0.55)',
            backdropFilter: 'blur(6px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 24,
            animation: 'voice-modal-in 220ms ease-out',
          }}
          onClick={(e) => { if (e.target === e.currentTarget) handleClose() }}
        >
          <div
            style={{
              background: 'var(--bg-surface, white)',
              borderRadius: 20,
              padding: 32,
              maxWidth: 520,
              width: '100%',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.40)',
              fontFamily: 'var(--font-body)',
              position: 'relative',
            }}
          >
            <button
              type="button"
              onClick={handleClose}
              aria-label="Fermer"
              style={{
                position: 'absolute', top: 16, right: 16,
                background: 'transparent', border: 0, padding: 6,
                color: 'var(--fg-3)', cursor: 'pointer',
              }}
            >
              <X size={18} />
            </button>

            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{
                width: 56, height: 56, borderRadius: 16,
                background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
                color: 'white',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: 14,
              }}>
                <Sparkles size={26} />
              </div>
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: 'var(--fg-1)' }}>
                Démarrez votre bilan à la voix
              </h2>
              <p style={{ margin: '6px 0 0', fontSize: 13.5, color: 'var(--fg-2)', lineHeight: 1.5 }}>
                Cliquez sur le micro et dites par exemple :
                <br />
                <em style={{ color: 'var(--fg-1)', fontStyle: 'normal', fontWeight: 500 }}>
                  « Nouveau bilan Léa CE2, motif lenteur en lecture, Exalang 8-11 »
                </em>
              </p>
            </div>

            {/* Bouton mic central */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
              <button
                type="button"
                onClick={handleStart}
                disabled={isTranscribing || parsing}
                aria-label={isRecording ? 'Arrêter l\'enregistrement' : 'Démarrer l\'enregistrement'}
                style={{
                  width: 88, height: 88, borderRadius: '50%',
                  border: 0,
                  background: isRecording
                    ? 'var(--ds-danger, #DC2626)'
                    : isTranscribing
                      ? 'var(--ds-warning, #D97706)'
                      : 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
                  color: 'white',
                  cursor: (isTranscribing || parsing) ? 'wait' : 'pointer',
                  boxShadow: isRecording
                    ? '0 0 0 12px rgba(220,38,38,0.18), 0 0 0 24px rgba(220,38,38,0.08)'
                    : '0 8px 24px rgba(99,102,241,0.35)',
                  transition: 'all 220ms',
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  animation: isRecording ? 'voice-pulse 1.4s ease-in-out infinite' : undefined,
                }}
              >
                {isRecording
                  ? <Square size={32} fill="currentColor" />
                  : isTranscribing || parsing
                    ? <Loader2 size={32} className="animate-spin" />
                    : <Mic size={36} />}
              </button>
            </div>

            <p style={{
              textAlign: 'center',
              fontSize: 13, color: 'var(--fg-2)',
              margin: '0 0 16px',
              minHeight: 18,
            }}>
              {isRecording && '🔴 Enregistrement en cours… cliquez pour arrêter'}
              {isTranscribing && 'Transcription audio…'}
              {parsing && 'Analyse de la commande…'}
              {!isRecording && !isTranscribing && !parsing && !transcript && 'Cliquez pour démarrer'}
              {!isRecording && !isTranscribing && !parsing && transcript && !extracted && !parseError && ' '}
            </p>

            {/* Transcription brute */}
            {transcript && !isRecording && !isTranscribing && (
              <div style={{
                background: 'var(--bg-surface-2, #F9FAFB)',
                border: '1px solid var(--border-ds, #E5E7EB)',
                borderRadius: 10,
                padding: '10px 14px',
                marginBottom: 16,
                fontSize: 13,
                color: 'var(--fg-2)',
                fontStyle: 'italic',
              }}>
                « {transcript} »
              </div>
            )}

            {/* Aperçu des champs extraits */}
            {extracted && !parsing && (
              <div style={{
                background: extracted.confidence === 'low'
                  ? 'var(--ds-warning-soft, #FFFBEB)'
                  : 'var(--ds-success-soft, #ECFDF5)',
                border: `1px solid ${extracted.confidence === 'low' ? 'var(--ds-warning, #D97706)' : 'var(--ds-success, #16a34a)'}`,
                borderRadius: 10,
                padding: 14,
                marginBottom: 16,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, fontSize: 13, fontWeight: 600, color: 'var(--fg-1)' }}>
                  {extracted.confidence === 'low'
                    ? <AlertCircle size={14} style={{ color: 'var(--ds-warning, #D97706)' }} />
                    : <Check size={14} style={{ color: 'var(--ds-success, #16a34a)' }} />}
                  {extracted.summary}
                </div>
                <ul style={{ margin: 0, padding: '0 0 0 8px', listStyle: 'none', fontSize: 13, color: 'var(--fg-2)' }}>
                  {extracted.patient_prenom && (
                    <li><strong>Patient :</strong> {extracted.patient_prenom}{extracted.patient_nom ? ` ${extracted.patient_nom}` : ''}</li>
                  )}
                  {extracted.patient_classe && <li><strong>Classe :</strong> {extracted.patient_classe}</li>}
                  {extracted.bilan_type && <li><strong>Type :</strong> bilan {extracted.bilan_type}</li>}
                  {extracted.motif && <li><strong>Motif :</strong> {extracted.motif}</li>}
                  {extracted.tests_utilises.length > 0 && (
                    <li><strong>Test{extracted.tests_utilises.length > 1 ? 's' : ''} :</strong> {extracted.tests_utilises.join(', ')}</li>
                  )}
                </ul>
                {extracted.confidence === 'low' && (
                  <p style={{ margin: '8px 0 0', fontSize: 11.5, color: 'var(--fg-3)' }}>
                    Commande peu claire — vous pourrez compléter les informations dans le formulaire.
                  </p>
                )}
              </div>
            )}

            {parseError && (
              <div style={{
                background: 'var(--ds-danger-soft, #FEF2F2)',
                border: '1px solid var(--ds-danger, #DC2626)',
                borderRadius: 10,
                padding: '10px 14px',
                marginBottom: 16,
                fontSize: 13,
                color: 'var(--ds-danger, #B91C1C)',
              }}>
                ⚠ {parseError}
              </div>
            )}

            {micError && (
              <div style={{
                fontSize: 12, color: 'var(--ds-danger, #B91C1C)',
                textAlign: 'center', marginBottom: 12,
              }}>
                {micError}
              </div>
            )}

            {/* Actions */}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
              <button
                type="button"
                onClick={handleClose}
                style={{
                  padding: '10px 16px',
                  background: 'transparent',
                  border: '1px solid var(--border-ds-strong, #D1D5DB)',
                  color: 'var(--fg-2)',
                  borderRadius: 8,
                  fontFamily: 'inherit', fontSize: 14, fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleLaunch}
                disabled={!canLaunch}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '10px 18px',
                  background: canLaunch
                    ? 'linear-gradient(135deg, #16a34a 0%, #10b981 100%)'
                    : 'var(--bg-surface-2, #E5E7EB)',
                  color: canLaunch ? 'white' : 'var(--fg-3)',
                  border: 0,
                  borderRadius: 8,
                  fontFamily: 'inherit', fontSize: 14, fontWeight: 600,
                  cursor: canLaunch ? 'pointer' : 'not-allowed',
                  boxShadow: canLaunch ? '0 4px 12px rgba(16,185,129,0.30)' : undefined,
                }}
              >
                Démarrer le bilan
                <ArrowRight size={14} />
              </button>
            </div>
          </div>

          <style jsx global>{`
            @keyframes voice-modal-in {
              from { opacity: 0; transform: scale(0.96); }
              to   { opacity: 1; transform: scale(1); }
            }
            @keyframes voice-pulse {
              0%, 100% { transform: scale(1); }
              50%      { transform: scale(1.06); }
            }
          `}</style>
        </div>
      )}
    </>
  )
}
