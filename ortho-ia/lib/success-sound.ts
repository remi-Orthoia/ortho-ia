/**
 * Son discret de succès — accord mineur → majeur (C4 → E4 → G4).
 * Utilise Web Audio API, aucun fichier à charger.
 * Respecte un opt-in/out stocké en localStorage.
 */

const STORAGE_KEY = 'orthoia.success-sound'

export function isSoundEnabled(): boolean {
  if (typeof window === 'undefined') return false
  // Activé par défaut, sauf si l'utilisateur l'a désactivé
  return localStorage.getItem(STORAGE_KEY) !== 'off'
}

export function setSoundEnabled(enabled: boolean) {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, enabled ? 'on' : 'off')
}

export function playSuccessSound() {
  if (typeof window === 'undefined') return
  if (!isSoundEnabled()) return

  try {
    const AudioContextCtor = (window as any).AudioContext || (window as any).webkitAudioContext
    if (!AudioContextCtor) return
    const ctx: AudioContext = new AudioContextCtor()

    // Accord ascendant doux : C4 (261.63), E4 (329.63), G4 (392.00)
    const notes = [
      { freq: 523.25, offset: 0.00, dur: 0.18 },    // C5
      { freq: 659.25, offset: 0.08, dur: 0.22 },    // E5
      { freq: 783.99, offset: 0.16, dur: 0.35 },    // G5
    ]

    notes.forEach(({ freq, offset, dur }) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.value = freq

      // Enveloppe ADSR très douce (volume max 0.1 → discret)
      const t = ctx.currentTime + offset
      gain.gain.setValueAtTime(0, t)
      gain.gain.linearRampToValueAtTime(0.08, t + 0.02)    // attack
      gain.gain.exponentialRampToValueAtTime(0.001, t + dur) // decay + release

      osc.connect(gain).connect(ctx.destination)
      osc.start(t)
      osc.stop(t + dur + 0.05)
    })

    // Fermer le contexte quand tout est joué (évite leaks)
    setTimeout(() => ctx.close().catch(() => {}), 1200)
  } catch (err) {
    // Silently fail — pas critique
    console.debug('playSuccessSound error', err)
  }
}
