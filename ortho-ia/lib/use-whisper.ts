'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Hook React pour enregistrer de l'audio depuis le micro et le transcrire
 * via /api/transcribe (Whisper).
 *
 * Usage :
 *   const { state, error, start, stop, lastText } = useWhisper()
 *   <button onClick={state === 'idle' ? start : stop}>...</button>
 *
 * États :
 *   - 'idle' : prêt
 *   - 'recording' : enregistrement en cours
 *   - 'transcribing' : audio envoyé à Whisper, attente réponse
 *   - 'error' : voir `error`
 */

export type WhisperState = 'idle' | 'recording' | 'transcribing' | 'error'

export interface UseWhisperOptions {
  /** Callback appelé quand la transcription est prête (texte brut). */
  onResult?: (text: string) => void
  /** Callback appelé sur erreur — reçoit un message lisible. */
  onError?: (message: string) => void
}

export function useWhisper(options: UseWhisperOptions = {}) {
  const [state, setState] = useState<WhisperState>('idle')
  const [error, setError] = useState<string | null>(null)
  const [lastText, setLastText] = useState<string>('')
  const recorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)

  // Cleanup à l'unmount.
  useEffect(() => {
    return () => {
      if (recorderRef.current && recorderRef.current.state !== 'inactive') {
        try { recorderRef.current.stop() } catch {}
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop())
        streamRef.current = null
      }
    }
  }, [])

  const start = useCallback(async () => {
    setError(null)
    setLastText('')
    if (typeof window === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      const msg = 'Le micro n\'est pas disponible dans ce navigateur.'
      setError(msg); setState('error'); options.onError?.(msg)
      return
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      // Mime type négocié selon le support navigateur. Whisper accepte tout
      // (webm, ogg, mp4) mais "audio/webm" est le plus universel.
      const mimeType =
        MediaRecorder.isTypeSupported('audio/webm;codecs=opus') ? 'audio/webm;codecs=opus' :
        MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' :
        MediaRecorder.isTypeSupported('audio/ogg') ? 'audio/ogg' :
        ''
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined)
      chunksRef.current = []
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data)
      }
      recorder.onstop = async () => {
        // Coupe le stream micro proprement (sinon l'icône reste rouge)
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(t => t.stop())
          streamRef.current = null
        }
        const blob = new Blob(chunksRef.current, { type: mimeType || 'audio/webm' })
        chunksRef.current = []
        if (blob.size === 0) {
          setState('idle')
          return
        }
        setState('transcribing')
        try {
          const fd = new FormData()
          fd.append('audio', blob, 'audio.webm')
          const res = await fetch('/api/transcribe', { method: 'POST', body: fd })
          const data = await res.json()
          if (!res.ok) throw new Error(data?.error || 'Erreur transcription')
          const text = (data?.text || '').trim()
          setLastText(text)
          options.onResult?.(text)
          setState('idle')
        } catch (e: any) {
          const msg = e?.message || 'Erreur lors de la transcription.'
          setError(msg); setState('error'); options.onError?.(msg)
        }
      }
      recorderRef.current = recorder
      recorder.start()
      setState('recording')
    } catch (e: any) {
      const msg =
        e?.name === 'NotAllowedError' ? 'Accès au micro refusé. Autorisez-le dans votre navigateur.' :
        e?.name === 'NotFoundError' ? 'Aucun micro détecté.' :
        e?.message || 'Impossible d\'accéder au micro.'
      setError(msg); setState('error'); options.onError?.(msg)
    }
  }, [options])

  const stop = useCallback(() => {
    const rec = recorderRef.current
    if (rec && rec.state !== 'inactive') {
      try { rec.stop() } catch {}
    }
  }, [])

  const cancel = useCallback(() => {
    chunksRef.current = []
    if (recorderRef.current && recorderRef.current.state !== 'inactive') {
      try { recorderRef.current.stop() } catch {}
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
    setState('idle')
    setError(null)
  }, [])

  return { state, error, lastText, start, stop, cancel }
}
