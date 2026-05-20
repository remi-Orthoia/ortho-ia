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
 * SPARSE — les cellules ne sont pas systématiques, chaque test n'a de
 * critère qu'à certains niveaux (ex: "Classification jetons" a 3 critères
 * gradués à 6/7/8 ans, pas un par niveau).
 *
 * Layout :
 *   - Colonne 1 : libellés des niveaux (âge ou classe)
 *   - Colonnes suivantes : tests groupés par épreuve macro (double en-tête)
 *   - Cellules : EMPTY si aucun critère, sinon critère(s) avec pastille(s)
 *
 * Seules les CELLULES de critère sont cliquables. Les niveaux et les noms
 * d'épreuves macro sont en lecture seule.
 */

interface MatriceSectionProps {
  section: SectionMatrix
  epreuves: BilanMathDraft['epreuves']
  interactive?: boolean
  onCellChange?: (epreuveId: string, next: EpreuveState) => void
}

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
   * Index : pour chaque (epreuveId, sousEpreuveId, niveauId), liste les
   * critères placés à ce niveau. Permet de rendre la matrice en parcourant
   * niveau × test et en récupérant les critères du bon "groupe".
   */
  const criteresByCell = useMemo(() => {
    const map = new Map<string, Criterion[]>()
    for (const ep of section.epreuves) {
      for (const se of ep.sousEpreuves) {
        for (const cr of se.criteres) {
          const key = `${ep.id}:${se.id}:${cr.niveauId}`
          const arr = map.get(key) ?? []
          arr.push(cr)
          map.set(key, arr)
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
            minWidth: 110 + totalCols * 110,
            borderCollapse: 'separate',
            borderSpacing: 0,
            fontSize: 11,
          }}
        >
          <thead>
            {/* En-tête niveau de macro-épreuve (colspan = nb tests) */}
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
            {/* Sous-en-tête : nom de chaque test */}
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
                    const criteresAtCell = criteresByCell.get(`${ep.id}:${se.id}:${niv.id}`) ?? []
                    return (
                      <td
                        key={`${niv.id}:${ep.id}:${se.id}`}
                        style={{
                          ...CELL_STYLE,
                          background: rIdx % 2 === 0 ? 'var(--bg-surface-1)' : 'var(--bg-surface-2)',
                        }}
                      >
                        {criteresAtCell.length === 0 ? (
                          // Cellule vide — pas de critère à ce niveau pour ce test.
                          <span aria-hidden="true" style={{ display: 'inline-block', width: 6, height: 6, opacity: 0.15, background: 'var(--fg-3)', borderRadius: '50%' }} />
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                            {criteresAtCell.map((cr) => {
                              const color: PastilleEtat = state?.cells[cellKey(se.id, cr.id)] ?? 'gris'
                              return (
                                <div
                                  key={cr.id}
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 6,
                                    padding: '2px 4px',
                                    borderRadius: 4,
                                  }}
                                >
                                  <Pastille
                                    etat={color}
                                    readonly={!interactive}
                                    onClick={
                                      interactive
                                        ? () => handleCellClick(ep.id, se, cr)
                                        : undefined
                                    }
                                    size={interactive ? 14 : 12}
                                    ariaPrefix={`${niv.label} — ${ep.label} — ${se.label} — ${cr.label}`}
                                  />
                                  <span style={{ fontSize: 10, color: 'var(--fg-2)', lineHeight: 1.25, textAlign: 'left' }}>
                                    {cr.label}
                                  </span>
                                </div>
                              )
                            })}
                          </div>
                        )}
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
  minWidth: 110,
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
  verticalAlign: 'top',
}

const CELL_STYLE: React.CSSProperties = {
  padding: '4px 6px',
  textAlign: 'left',
  borderLeft: '1px solid var(--border-ds)',
  borderTop: '1px solid var(--border-ds)',
  verticalAlign: 'top',
  minWidth: 110,
}
