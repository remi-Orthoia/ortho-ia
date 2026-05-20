'use client'

import { useMemo } from 'react'
import Pastille from './Pastille'
import { cellKey, cyclePastille } from '@/lib/bilans/math/parent-color'
import type {
  SectionMatrix,
  BilanMathDraft,
  EpreuveState,
  PastilleEtat,
  Criterion,
  SousEpreuve,
} from '@/lib/bilans/math/types'

/**
 * Rend une SECTION de la grille B-CM/B-CMado comme tableau matrice 2D
 * fidèle au PDF :
 *   - colonne 1 : niveaux (âge ou classe)
 *   - colonnes 2+ : tests groupés par épreuve macro (double en-tête)
 *   - cellules : EMPTY si aucun critère, GRISÉE si non applicable, ou
 *     critère(s) avec pastille(s) cotable(s)
 *   - cellules FUSIONNÉES verticalement quand un critère couvre plusieurs
 *     niveaux consécutifs (rowspan).
 *
 * Seuls les critères (cellules pleines) sont cliquables.
 */

interface MatriceSectionProps {
  section: SectionMatrix
  epreuves: BilanMathDraft['epreuves']
  interactive?: boolean
  onCellChange?: (epreuveId: string, next: EpreuveState) => void
}

type CellAction =
  | { kind: 'criterion'; criterion: Criterion; rowspan: number }
  | { kind: 'continue' } // cellule déjà émise par un rowspan d'au-dessus
  | { kind: 'grise' }
  | { kind: 'empty' }

export default function MatriceSection({
  section,
  epreuves,
  interactive = true,
  onCellChange,
}: MatriceSectionProps) {
  const totalCols = useMemo(
    () => section.epreuves.reduce((acc, ep) => acc + ep.sousEpreuves.length, 0),
    [section.epreuves],
  )

  /**
   * Pré-calcule pour chaque (epreuveId, sousEpreuveId, niveauId) l'action de
   * rendu. Permet de savoir s'il faut émettre un <td> (criterion / grise /
   * empty) ou le sauter (continue, déjà absorbé par un rowspan).
   */
  const cellActions = useMemo(() => {
    const map = new Map<string, CellAction>()
    for (const ep of section.epreuves) {
      for (const se of ep.sousEpreuves) {
        // 1) Critères : pose un 'criterion' sur le premier niveau, 'continue'
        //    sur les suivants pour rowspan.
        for (const cr of se.criteres) {
          if (cr.niveauIds.length === 0) continue
          const [first, ...rest] = cr.niveauIds
          map.set(`${ep.id}:${se.id}:${first}`, {
            kind: 'criterion',
            criterion: cr,
            rowspan: cr.niveauIds.length,
          })
          for (const niv of rest) {
            map.set(`${ep.id}:${se.id}:${niv}`, { kind: 'continue' })
          }
        }
        // 2) Niveaux grisés (seulement si pas déjà occupés par un critère).
        for (const niv of se.niveauxGrises ?? []) {
          if (!map.has(`${ep.id}:${se.id}:${niv}`)) {
            map.set(`${ep.id}:${se.id}:${niv}`, { kind: 'grise' })
          }
        }
      }
    }
    return map
  }, [section.epreuves])

  const handleCellClick = (
    epreuveId: string,
    sousEpreuve: SousEpreuve,
    criterion: Criterion,
  ) => {
    if (!interactive || !onCellChange) return
    const state: EpreuveState = epreuves[epreuveId] ?? { cells: {}, notes: '' }
    const key = cellKey(sousEpreuve.id, criterion.id)
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
            minWidth: 100 + totalCols * 115,
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
            {/* Ligne 2 : nom de chaque test */}
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
                    const action = cellActions.get(`${ep.id}:${se.id}:${niv.id}`) ?? { kind: 'empty' }
                    if (action.kind === 'continue') {
                      // <td> absorbé par le rowspan du critère du dessus.
                      return null
                    }
                    if (action.kind === 'grise') {
                      return (
                        <td
                          key={`${niv.id}:${ep.id}:${se.id}`}
                          aria-label="Cellule non applicable"
                          style={{
                            ...CELL_STYLE,
                            background: GRISE_BG,
                            opacity: 0.6,
                          }}
                        />
                      )
                    }
                    if (action.kind === 'empty') {
                      return (
                        <td
                          key={`${niv.id}:${ep.id}:${se.id}`}
                          style={{
                            ...CELL_STYLE,
                            background: rIdx % 2 === 0 ? 'var(--bg-surface-1)' : 'var(--bg-surface-2)',
                          }}
                        >
                          <span aria-hidden="true" style={{ display: 'inline-block', width: 4, height: 4, opacity: 0.18, background: 'var(--fg-3)', borderRadius: '50%' }} />
                        </td>
                      )
                    }
                    // action.kind === 'criterion'
                    const cr = action.criterion
                    const state = epreuves[ep.id]
                    const color: PastilleEtat = state?.cells[cellKey(se.id, cr.id)] ?? 'gris'
                    return (
                      <td
                        key={`${niv.id}:${ep.id}:${se.id}`}
                        rowSpan={action.rowspan}
                        style={{
                          ...CELL_STYLE,
                          background: rIdx % 2 === 0 ? 'var(--bg-surface-1)' : 'var(--bg-surface-2)',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '2px 4px' }}>
                          <Pastille
                            etat={color}
                            readonly={!interactive}
                            onClick={interactive ? () => handleCellClick(ep.id, se, cr) : undefined}
                            size={interactive ? 14 : 12}
                            ariaPrefix={`${niv.label} — ${ep.label} — ${se.label} — ${cr.label}`}
                          />
                          <span style={{ fontSize: 10, color: 'var(--fg-2)', lineHeight: 1.25, textAlign: 'left' }}>
                            {cr.label}
                          </span>
                        </div>
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
// Styles
// ============================================================================

const GRISE_BG = '#E5E5E5'

const HEADER_NIVEAU_STYLE: React.CSSProperties = {
  position: 'sticky',
  left: 0,
  zIndex: 2,
  padding: '8px 12px',
  fontSize: 11,
  fontWeight: 600,
  color: 'var(--fg-2)',
  textAlign: 'left',
  minWidth: 80,
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
  minWidth: 115,
  borderLeft: '1px solid var(--border-ds)',
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
  minWidth: 80,
  verticalAlign: 'middle',
}

const CELL_STYLE: React.CSSProperties = {
  padding: '4px 6px',
  textAlign: 'left',
  borderLeft: '1px solid var(--border-ds)',
  borderTop: '1px solid var(--border-ds)',
  verticalAlign: 'middle',
  minWidth: 115,
}
