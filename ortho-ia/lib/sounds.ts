/**
 * Petite bibliothèque de sons UX — Web Audio synthétisé (zéro asset à charger).
 *
 * Pourquoi pas d'assets : un fichier mp3 ajoute ~10-50 KB par son et casse le
 * chargement instantané. Tous les sons sont générés à la volée par Web Audio
 * API à partir d'oscillateurs sinusoïdaux + enveloppes douces — autour de
 * 200 lignes de code, totalement portable, mute par défaut respecté.
 *
 * Tous les sons sont :
 *   - sub-seconde (50-400ms)
 *   - volume max très bas (0.04-0.10) pour rester discret
 *   - opt-out via localStorage (clé `orthoia.success-sound`)
 *   - silencieux côté serveur (no-op si typeof window === 'undefined')
 *
 * Le système respecte aussi `prefers-reduced-motion` : si l'utilisateur a
 * activé la réduction d'animations OS, on ne joue rien (souvent activé en
 * cas d'hypersensibilité auditive — mêmes profils).
 */

const STORAGE_KEY = 'orthoia.success-sound'

export function isSoundEnabled(): boolean {
  if (typeof window === 'undefined') return false
  if (localStorage.getItem(STORAGE_KEY) === 'off') return false
  // Respect du système OS pour les utilisateur·rice·s sensibles
  try {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false
  } catch {}
  return true
}

export function setSoundEnabled(enabled: boolean) {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, enabled ? 'on' : 'off')
}

// ============================================================================
// Helpers Web Audio
// ============================================================================

let ctxCache: AudioContext | null = null
function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null
  if (ctxCache && ctxCache.state !== 'closed') return ctxCache
  try {
    const AudioContextCtor =
      (window as any).AudioContext || (window as any).webkitAudioContext
    if (!AudioContextCtor) return null
    ctxCache = new AudioContextCtor()
    return ctxCache
  } catch {
    return null
  }
}

interface NoteOpts {
  freq: number
  offset?: number
  dur?: number
  /** Volume max (0-1). Défaut 0.08 — discret. */
  gain?: number
  type?: OscillatorType
}

function playNotes(notes: NoteOpts[]) {
  if (!isSoundEnabled()) return
  const ctx = getCtx()
  if (!ctx) return
  try {
    for (const { freq, offset = 0, dur = 0.2, gain = 0.08, type = 'sine' } of notes) {
      const osc = ctx.createOscillator()
      const g = ctx.createGain()
      osc.type = type
      osc.frequency.value = freq
      const t = ctx.currentTime + offset
      // Enveloppe ADSR douce : 20ms attack, exponential decay sur la durée.
      g.gain.setValueAtTime(0, t)
      g.gain.linearRampToValueAtTime(gain, t + 0.015)
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
      osc.connect(g).connect(ctx.destination)
      osc.start(t)
      osc.stop(t + dur + 0.05)
    }
  } catch (err) {
    console.debug('playNotes error', err)
  }
}

/** Glide de fréquence linéaire (utilisé pour le "swoosh" de download). */
function playGlide(opts: {
  fromFreq: number
  toFreq: number
  dur: number
  gain?: number
  type?: OscillatorType
}) {
  if (!isSoundEnabled()) return
  const ctx = getCtx()
  if (!ctx) return
  try {
    const { fromFreq, toFreq, dur, gain = 0.06, type = 'sine' } = opts
    const osc = ctx.createOscillator()
    const g = ctx.createGain()
    osc.type = type
    const t = ctx.currentTime
    osc.frequency.setValueAtTime(fromFreq, t)
    osc.frequency.exponentialRampToValueAtTime(toFreq, t + dur)
    g.gain.setValueAtTime(0, t)
    g.gain.linearRampToValueAtTime(gain, t + 0.02)
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
    osc.connect(g).connect(ctx.destination)
    osc.start(t)
    osc.stop(t + dur + 0.05)
  } catch (err) {
    console.debug('playGlide error', err)
  }
}

// ============================================================================
// Sons disponibles — chacun a une "personnalité" sonore distincte
// ============================================================================

/**
 * Triade ascendante satisfaisante (C5-E5-G5).
 * À utiliser pour : génération CRBO terminée, sauvegarde profil réussie.
 */
export function playSuccessSound() {
  playNotes([
    { freq: 523.25, offset: 0.00, dur: 0.20, gain: 0.08 },  // C5
    { freq: 659.25, offset: 0.08, dur: 0.22, gain: 0.08 },  // E5
    { freq: 783.99, offset: 0.16, dur: 0.35, gain: 0.08 },  // G5
  ])
}

/**
 * "Ding" léger sur 2 notes — pour les micro-actions (changement d'étape,
 * sauvegarde brouillon). Plus court et discret que le success.
 */
export function playDing() {
  playNotes([
    { freq: 880.00, offset: 0.00, dur: 0.12, gain: 0.05 },  // A5
    { freq: 1108.73, offset: 0.04, dur: 0.18, gain: 0.05 }, // C#6
  ])
}

/**
 * "Swoosh" descendant — pour les téléchargements, l'export Word, etc.
 * Imite une feuille qui sort de l'imprimante. Glide d'aigu vers grave.
 */
export function playSwoosh() {
  playGlide({
    fromFreq: 1600,
    toFreq: 400,
    dur: 0.32,
    gain: 0.05,
    type: 'triangle',
  })
}

/**
 * "Pop" très bref — pour les drops kanban réussis. Idéal pour les actions
 * répétées 50× par jour (statut change) où un son long deviendrait pénible.
 */
export function playPop() {
  playNotes([
    { freq: 660, offset: 0.00, dur: 0.06, gain: 0.04, type: 'triangle' },
    { freq: 990, offset: 0.02, dur: 0.06, gain: 0.04, type: 'triangle' },
  ])
}

/**
 * Triade festive à 5 notes — réservée aux paliers (10e, 25e, 50e, 100e CRBO).
 * Plus longue, légèrement plus forte. Joue avec le confetti contextuel.
 */
export function playMilestone() {
  playNotes([
    { freq: 523.25, offset: 0.00, dur: 0.18, gain: 0.10 }, // C5
    { freq: 659.25, offset: 0.10, dur: 0.18, gain: 0.10 }, // E5
    { freq: 783.99, offset: 0.20, dur: 0.18, gain: 0.10 }, // G5
    { freq: 1046.50, offset: 0.30, dur: 0.18, gain: 0.10 }, // C6
    { freq: 1318.51, offset: 0.40, dur: 0.55, gain: 0.10 }, // E6
  ])
}

/**
 * Note d'erreur basse et brève — feedback négatif discret.
 * Utiliser parcimonieusement, surtout via toast.error qui se suffit déjà.
 */
export function playError() {
  playNotes([
    { freq: 220, offset: 0.00, dur: 0.14, gain: 0.06, type: 'sine' },
    { freq: 196, offset: 0.06, dur: 0.20, gain: 0.06, type: 'sine' },
  ])
}
