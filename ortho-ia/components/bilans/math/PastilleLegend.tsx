'use client'

import Pastille from './Pastille'

/**
 * Légende affichée en haut de la grille pour que l'ortho comprenne le
 * code couleur sans avoir à hovers chaque pastille.
 */
export default function PastilleLegend() {
  const items: Array<{ etat: 'vert' | 'orange' | 'rouge'; label: string }> = [
    { etat: 'vert', label: 'Réussite spontanée' },
    { etat: 'orange', label: 'Réussite après étayage' },
    { etat: 'rouge', label: 'Échec' },
  ]
  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 16,
        alignItems: 'center',
        padding: '10px 14px',
        background: 'var(--bg-surface-2)',
        border: '1px solid var(--border-ds)',
        borderRadius: 10,
        fontSize: 12,
        color: 'var(--fg-2)',
      }}
    >
      <span style={{ fontWeight: 600, color: 'var(--fg-3)' }}>Cotation :</span>
      {items.map((it) => (
        <span key={it.etat} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <Pastille etat={it.etat} readonly size={14} />
          {it.label}
        </span>
      ))}
      <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--fg-3)' }}>
        Clic sur la pastille pour cycler · Rouge &gt; Orange &gt; Vert sur l&apos;épreuve parent
      </span>
    </div>
  )
}
