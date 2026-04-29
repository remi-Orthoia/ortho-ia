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

/** Verbose log uniquement en dev local. Aide à diagnostiquer en console. */
const dlog = (...args: unknown[]) => {
  if (typeof window !== 'undefined' && (window as any).__ORTHO_IA_WHISPER_DEBUG__ !== false) {
    // eslint-disable-next-line no-console
    console.log('[whisper]', ...args)
  }
}

/** Choix d'un mime + extension supporté par MediaRecorder du navigateur courant. */
function pickMimeAndExt(): { mimeType: string; ext: string } {
  if (typeof MediaRecorder === 'undefined') return { mimeType: '', ext: 'webm' }
  const candidates: Array<[string, string]> = [
    ['audio/webm;codecs=opus', 'webm'],
    ['audio/webm', 'webm'],
    ['audio/ogg;codecs=opus', 'ogg'],
    ['audio/ogg', 'ogg'],
    ['audio/mp4', 'mp4'],     // Safari iOS / macOS
    ['audio/mp4;codecs=mp4a', 'mp4'],
    ['audio/mpeg', 'mp3'],
  ]
  for (const [mime, ext] of candidates) {
    try { if (MediaRecorder.isTypeSupported(mime)) return { mimeType: mime, ext } } catch { /* ignore */ }
  }
  return { mimeType: '', ext: 'webm' }
}

/** Déduit l'extension à partir d'un mimeType pour nommer le fichier envoyé à Whisper. */
function extOf(mimeType: string): string {
  const m = (mimeType || '').toLowerCase()
  if (m.includes('webm')) return 'webm'
  if (m.includes('ogg')) return 'ogg'
  if (m.includes('mp4')) return 'mp4'
  if (m.includes('mpeg') || m.includes('mp3')) return 'mp3'
  if (m.includes('wav')) return 'wav'
  return 'webm'
}

export function useWhisper(options: UseWhisperOptions = {}) {
  const [state, setState] = useState<WhisperState>('idle')
  const [error, setError] = useState<string | null>(null)
  const [lastText, setLastText] = useState<string>('')
  const recorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)
  // ⚠️ Important : on stocke les options dans une ref pour que `recorder.onstop`
  // capture toujours la version la plus récente des callbacks (sinon une
  // re-render entre `start()` et `onstop` ferait perdre la référence).
  const optionsRef = useRef(options)
  useEffect(() => { optionsRef.current = options }, [options])

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

  const startRecording = useCallback(async () => {
    setError(null)
    setLastText('')
    if (typeof window === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      const msg = "Le micro n'est pas disponible dans ce navigateur."
      setError(msg); setState('error'); optionsRef.current.onError?.(msg)
      return
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      const { mimeType: pickedMime } = pickMimeAndExt()
      const recorder = new MediaRecorder(stream, pickedMime ? { mimeType: pickedMime } : undefined)
      // Le MediaRecorder peut renvoyer un mimeType différent (ex: navigateur
      // ignore notre suggestion). On utilise CELUI du recorder à la fin.
      const actualMime = recorder.mimeType || pickedMime || 'audio/webm'
      dlog('start', { picked: pickedMime, actual: actualMime, state: recorder.state })
      chunksRef.current = []
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          dlog('ondataavailable', { size: e.data.size, type: e.data.type })
          chunksRef.current.push(e.data)
        }
      }
      recorder.onstop = async () => {
        // Coupe le stream micro proprement (sinon l'icône reste rouge)
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(t => t.stop())
          streamRef.current = null
        }
        const blob = new Blob(chunksRef.current, { type: actualMime })
        const ext = extOf(actualMime)
        dlog('onstop', { blobSize: blob.size, blobType: blob.type, ext })
        chunksRef.current = []
        if (blob.size === 0) {
          // Avant : on retombait silencieusement en idle → utilisateur voyait
          // RIEN, ni texte ni erreur. Maintenant on remonte un message clair.
          const msg = 'Aucun audio capté — recommencez en parlant un peu plus longtemps.'
          setError(msg); setState('error'); optionsRef.current.onError?.(msg)
          return
        }
        setState('transcribing')
        try {
          const fd = new FormData()
          // Le nom du fichier (avec l'extension réelle) est utilisé par Whisper
          // pour identifier le format. L'envoyer "audio.webm" alors que le
          // contenu est mp4 (Safari) cause un 400 côté API.
          fd.append('audio', blob, `audio.${ext}`)
          dlog('POST /api/transcribe', { size: blob.size, name: `audio.${ext}` })
          const res = await fetch('/api/transcribe', { method: 'POST', body: fd })
          let data: any = null
          try { data = await res.json() } catch { /* parsable ? */ }
          dlog('response', { status: res.status, ok: res.ok, data })
          if (!res.ok) {
            throw new Error(data?.error || `Erreur transcription (HTTP ${res.status})`)
          }
          const text = (data?.text || '').trim()
          if (!text) {
            const msg = "La transcription est vide — l'audio n'a pas pu être interprété. Réessayez."
            setError(msg); setState('error'); optionsRef.current.onError?.(msg)
            return
          }
          setLastText(text)
          dlog('result', { text })
          optionsRef.current.onResult?.(text)
          setState('idle')
        } catch (e: any) {
          const msg = e?.message || 'Erreur lors de la transcription.'
          dlog('error', msg)
          setError(msg); setState('error'); optionsRef.current.onError?.(msg)
        }
      }
      recorderRef.current = recorder
      recorder.start()
      setState('recording')
    } catch (e: any) {
      const msg =
        e?.name === 'NotAllowedError' ? 'Accès au micro refusé. Autorisez-le dans votre navigateur.' :
        e?.name === 'NotFoundError' ? 'Aucun micro détecté.' :
        e?.message || "Impossible d'accéder au micro."
      setError(msg); setState('error'); optionsRef.current.onError?.(msg)
    }
  }, [])

  const stopRecording = useCallback(() => {
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

  return {
    state, error, lastText,
    startRecording, stopRecording, cancel,
    // Aliases compat (utilisés par MicButton avec l'ancien naming)
    start: startRecording,
    stop: stopRecording,
  }
}
