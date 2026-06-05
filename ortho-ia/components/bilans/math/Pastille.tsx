'use client'

import type { PastilleEtat } from '@/lib/bilans/math/types'

/**
 * Pastille cliquable à 4 niveaux (bleu / vert / orange / rouge) + état neutre gris.
 *
 * Cliquer cycle : gris → bleu → vert → orange → rouge → gris.
 * Utilisée à la fois pour les sous-épreuves (cliquables) et pour afficher
 * la couleur calculée d'une épreuve parent (mode readonly).
 *
 * Niveau bleu (OK+, performance supérieure à l'âge) ajouté 2026-06-05 sur
 * référence Elsa DALL'AGNOL. Permet de marquer une compétence MIEUX que
 * le niveau attendu (équivalent du "OK+" dans les CRBO Elsa).
 */

const COLORS: Record<PastilleEtat, { bg: string; ring: string; label: string }> = {
  gris:   { bg: '#e5e7eb', ring: '#d1d5db', label: 'Non renseigné' },
  bleu:   { bg: '#3b82f6', ring: '#2563eb', label: 'Performance supérieure à l\'âge' },
  vert:   { bg: '#22c55e', ring: '#16a34a', label: 'Réussite spontanée' },
  orange: { bg: '#f59e0b', ring: '#d97706', label: 'Réussite après étayage' },
  rouge:  { bg: '#ef4444', ring: '#dc2626', label: 'Échec' },
}

interface PastilleProps {
  etat: PastilleEtat
  onClick?: () => void
  /** Mode readonly : la pastille est juste un indicateur, pas cliquable.
   *  Utilisé pour afficher la couleur calculée d'une épreuve parent. */
  readonly?: boolean
  /** Taille en pixels (par défaut 22). Utiliser 28+ pour les épreuves parent. */
  size?: number
  /** Texte additionnel pour l'aria-label (préfixe avant l'état). */
  ariaPrefix?: string
}

export default function Pastille({
  etat,
  onClick,
  readonly = false,
  size = 22,
  ariaPrefix,
}: PastilleProps) {
  const { bg, ring, label } = COLORS[etat]
  const ariaLabel = ariaPrefix ? `${ariaPrefix} — ${label}` : label

  if (readonly) {
    return (
      <span
        role="img"
        aria-label={ariaLabel}
        title={label}
        style={{
          display: 'inline-block',
          width: size,
          height: size,
          borderRadius: '50%',
          background: bg,
          boxShadow: `inset 0 0 0 2px ${ring}`,
          flexShrink: 0,
        }}
      />
    )
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      title={`${label} — clic pour changer`}
      style={{
        display: 'inline-grid',
        placeItems: 'center',
        width: size,
        height: size,
        borderRadius: '50%',
        background: bg,
        border: `2px solid ${ring}`,
        cursor: 'pointer',
        padding: 0,
        transition: 'transform 120ms ease, box-shadow 120ms ease',
        flexShrink: 0,
      }}
      onMouseDown={(e) => { e.currentTarget.style.transform = 'scale(0.92)' }}
      onMouseUp={(e) => { e.currentTarget.style.transform = 'scale(1)' }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)' }}
    />
  )
}
