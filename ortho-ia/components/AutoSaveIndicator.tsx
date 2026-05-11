'use client'

/**
 * Indicateur d'auto-save visible en permanence pendant la rédaction d'un
 * CRBO. Réduit l'anxiété "j'ai perdu mon travail" en confirmant que la
 * frappe est sécurisée toutes les 15 secondes.
 *
 * Trois états visuels :
 *   - "Sauvegarde…"            (pendant le tick, ~500ms, spinner)
 *   - "Enregistré il y a 12 s" (après chaque tick réussi)
 *   - rien                     (avant le 1er save = état initial vide)
 *
 * Pattern UX : aligné en haut à droite, gris-3, texte 12-13px. S'efface
 * naturellement sans capter l'attention — visible si on cherche, invisible
 * si on travaille.
 */

import { Loader2, Check } from 'lucide-react'

interface Props {
  /** Timestamp du dernier save réussi (ms epoch) ou null si jamais sauvegardé. */
  lastSavedAt: number | null
  /** Tick courant pour rafraîchir l'affichage relatif "il y a Xs". */
  nowTick: number
  /** Si true, affiche l'état transitoire "Sauvegarde…" (~500ms par tick). */
  saving?: boolean
}

function formatAgo(lastSavedAt: number, nowTick: number): string {
  const seconds = Math.max(0, Math.floor((nowTick - lastSavedAt) / 1000))
  if (seconds < 5) return "à l'instant"
  if (seconds < 60) return `il y a ${seconds} s`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `il y a ${minutes} min`
  const hours = Math.floor(minutes / 60)
  return `il y a ${hours} h`
}

export default function AutoSaveIndicator({ lastSavedAt, nowTick, saving }: Props) {
  if (!lastSavedAt && !saving) {
    // Pas encore de save → on ne montre rien plutôt qu'un "0s" creux.
    // Apparaîtra dès le 1er tick d'auto-save (après que l'ortho ait tapé
    // au moins prénom OU nom OU motif OU anamnèse OU résultats).
    return null
  }

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        fontSize: 12.5,
        color: 'var(--fg-3, #6B7280)',
        fontFamily: 'var(--font-body)',
        transition: 'color 240ms',
      }}
    >
      {saving ? (
        <>
          <Loader2 size={13} className="animate-spin" style={{ color: 'var(--ds-primary, #22c55e)' }} />
          <span>Sauvegarde…</span>
        </>
      ) : lastSavedAt ? (
        <>
          <Check size={14} strokeWidth={2.5} style={{ color: 'var(--ds-success, #22c55e)' }} />
          <span>Enregistré {formatAgo(lastSavedAt, nowTick)}</span>
        </>
      ) : null}
    </div>
  )
}
