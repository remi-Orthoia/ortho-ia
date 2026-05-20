'use client'

import { useMemo } from 'react'
import Pastille from './Pastille'
import { cellKey, cyclePastille } from '@/lib/bilans/math/parent-color'
import type {
  SectionMatrix,
  BilanMathDraft,
  EpreuveState,
  PastilleEtat,
} from '@/lib/bilans/math/types'

/**
 * Rend une SECTION de la grille B-CM/B-CMado en tableau matrice 2D :
 *
 *   - Colonne 1 : libellés des niveaux (âge ou classe)
 *   - Colonnes 2+ : tests groupés par épreuve macro (double en-tête)
 *   - Cellules : pastilles cliquables qui cyclent gris → vert → orange → rouge
 *
 * Seules les CELLULES sont cliquables. Les noms d'épreuves macro et les
 * niveaux sont des en-têtes en lecture seule.
 *
 * Le composant gère lui-même le scroll horizontal sur mobile. Sur desktop,
 * la première colonne (niveaux) reste sticky.
 */

interface MatriceSectionProps {
  section: SectionMatrix
  /** État des épreuves indexé par epreuve.id (toutes sections confondues). */
  epreuves: BilanMathDraft['epreuves']
  /** Mode interactif (true) ou lecture seule (false). */
  interactive?: boolean
  /** Callback appelé quand une cellule est cliquée (mode interactif). */
  onCellChange?: (epreuveId: string, next: EpreuveState) => void
}

export default function MatriceSection({
  section,
  epreuves,
  interactive = true,
  onCellChange,
}: MatriceSectionProps) {
  // Précalcul des cellules pour rendre la lecture rapide.
  const totalCols = useMemo(
    () => section.epreuves.reduce((acc, ep) => acc + ep.sousEpreuves.length, 0),
    [section.epreuves],
  )

  const handleCellClick = (epreuveId: string, niveauId: string, sousEpreuveId: string) => {
    if (!interactive || !onCellChange) return
    const state: EpreuveState = epreuves[epreuveId] ?? { cells: {}, notes: '' }
    const key = cellKey(niveauId, sousEpreuveId)
    const current = state.cells[key] ?? 'gris'
    onCellChange(epreuveId, {
      ...state,
      cells: { ...state.cells, [key]: cyclePastille(current) },
    })
  }

  return (
    <section style={{ marginBottom: 28 }}>
      <header style={{ marginBottom: 10 }}>
        <h3
          style={{
            margin: 0,
            fontSize: 14,
            fontWeight: 700,
            color: 'var(--fg-2)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}
        >
          {section.label}
        </h3>
        {section.description && (
          <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--fg-3)' }}>
            {section.description}
          </p>
        )}
      </header>

      <div
        style={{
          overflowX: 'auto',
          border: '1px solid var(--border-ds)',
          borderRadius: 12,
          background: 'var(--bg-surface-1)',
        }}
      >
        <table
          style={{
            width: '100%',
            minWidth: 100 + totalCols * 64,
            borderCollapse: 'separate',
            borderSpacing: 0,
            fontSize: 11,
          }}
        >
          <thead>
            {/* Ligne 1 : épreuves macro (colspan = nb sous-épreuves) */}
            <tr>
              <th
                rowSpan={2}
                style={{
                  ...HEADER_NIVEAU_STYLE,
                  background: 'var(--bg-surface-2)',
                  borderBottom: '2px solid var(--border-ds-strong)',
                }}
              >
                Niveau
              </th>
              {section.epreuves.map((ep) => (
                <th
                  key={ep.id}
                  colSpan={ep.sousEpreuves.length}
                  style={{
                    ...HEADER_EPREUVE_STYLE,
                    background: 'var(--bg-surface-2)',
                  }}
                >
                  {ep.label}
                </th>
              ))}
            </tr>
            {/* Ligne 2 : sous-épreuves (1 colonne chacune) */}
            <tr>
              {section.epreuves.flatMap((ep) =>
                ep.sousEpreuves.map((se) => (
                  <th
                    key={`${ep.id}:${se.id}`}
                    style={{
                      ...HEADER_SOUS_EPREUVE_STYLE,
                      background: 'var(--bg-surface-1)',
                      borderBottom: '2px solid var(--border-ds-strong)',
                    }}
                    title={`${ep.label} — ${se.label}`}
                  >
                    {se.label}
                  </th>
                )),
              )}
            </tr>
          </thead>
          <tbody>
            {section.niveaux.map((niv, rIdx) => (
              <tr key={niv.id}>
                <th
                  scope="row"
                  style={{
                    ...CELL_NIVEAU_STYLE,
                    background: rIdx % 2 === 0 ? 'var(--bg-surface-1)' : 'var(--bg-surface-2)',
                    borderRight: '2px solid var(--border-ds-strong)',
                  }}
                >
                  <span style={{ fontWeight: 600, color: 'var(--fg-1)' }}>{niv.label}</span>
                  {niv.subLabel && (
                    <span style={{ display: 'block', fontSize: 10, color: 'var(--fg-3)', fontWeight: 400 }}>
                      {niv.subLabel}
                    </span>
                  )}
                </th>
                {section.epreuves.flatMap((ep) =>
                  ep.sousEpreuves.map((se) => {
                    const state = epreuves[ep.id]
                    const key = cellKey(niv.id, se.id)
                    const color: PastilleEtat = state?.cells[key] ?? 'gris'
                    return (
                      <td
                        key={`${niv.id}:${ep.id}:${se.id}`}
                        style={{
                          ...CELL_STYLE,
                          background: rIdx % 2 === 0 ? 'var(--bg-surface-1)' : 'var(--bg-surface-2)',
                        }}
                      >
                        <Pastille
                          etat={color}
                          readonly={!interactive}
                          onClick={
                            interactive
                              ? () => handleCellClick(ep.id, niv.id, se.id)
                              : undefined
                          }
                          size={interactive ? 18 : 14}
                          ariaPrefix={`${niv.label}${niv.subLabel ? ` (${niv.subLabel})` : ''} — ${ep.label} — ${se.label}`}
                        />
                      </td>
                    )
                  }),
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

// ============================================================================
// Styles (inline pour éviter les conflits avec le design system)
// ============================================================================

const HEADER_NIVEAU_STYLE: React.CSSProperties = {
  position: 'sticky',
  left: 0,
  zIndex: 2,
  padding: '8px 12px',
  fontSize: 11,
  fontWeight: 600,
  color: 'var(--fg-2)',
  textAlign: 'left',
  minWidth: 90,
  borderRight: '2px solid var(--border-ds-strong)',
}

const HEADER_EPREUVE_STYLE: React.CSSProperties = {
  padding: '6px 8px',
  fontSize: 12,
  fontWeight: 700,
  color: 'var(--fg-1)',
  textAlign: 'center',
  borderBottom: '1px solid var(--border-ds)',
  borderLeft: '1px solid var(--border-ds)',
}

const HEADER_SOUS_EPREUVE_STYLE: React.CSSProperties = {
  padding: '6px 4px',
  fontSize: 10,
  fontWeight: 500,
  color: 'var(--fg-3)',
  textAlign: 'center',
  minWidth: 56,
  borderLeft: '1px solid var(--border-ds)',
  // wrap des libellés longs
  whiteSpace: 'normal',
  lineHeight: 1.2,
}

const CELL_NIVEAU_STYLE: React.CSSProperties = {
  position: 'sticky',
  left: 0,
  zIndex: 1,
  padding: '6px 12px',
  textAlign: 'left',
  whiteSpace: 'nowrap',
  minWidth: 90,
}

const CELL_STYLE: React.CSSProperties = {
  padding: '4px',
  textAlign: 'center',
  borderLeft: '1px solid var(--border-ds)',
  borderTop: '1px solid var(--border-ds)',
}
