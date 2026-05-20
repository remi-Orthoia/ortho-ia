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
   * Calcule les groupes de niveaux consécutifs partageant le même `label`,
   * uniquement si `section.mergeNiveauxByLabel` est activé. Sert à fusionner
   * verticalement la colonne Niveau dans B-CMado (Collège / Cycle III /
   * Cycle II en cellules fusionnées).
   *
   * Retourne pour chaque niveauId : { firstInGroup: boolean, rowspan: number }
   * - firstInGroup: true sur la première ligne d'un groupe (où on émet le <th>)
   * - rowspan: nombre de lignes du groupe (utilisé sur la première seulement)
   */
  const niveauGroups = useMemo(() => {
    const map = new Map<string, { firstInGroup: boolean; rowspan: number }>()
    if (!section.mergeNiveauxByLabel) {
      // Mode classique : chaque niveau est son propre groupe
      for (const niv of section.niveaux) {
        map.set(niv.id, { firstInGroup: true, rowspan: 1 })
      }
      return map
    }
    let i = 0
    while (i < section.niveaux.length) {
      const label = section.niveaux[i].label
      let j = i + 1
      while (j < section.niveaux.length && section.niveaux[j].label === label) j++
      const span = j - i
      // Première ligne du groupe : reçoit le rowspan
      map.set(section.niveaux[i].id, { firstInGroup: true, rowspan: span })
      // Lignes suivantes : pas de <th> (absorbées par le rowspan)
      for (let k = i + 1; k < j; k++) {
        map.set(section.niveaux[k].id, { firstInGroup: false, rowspan: 0 })
      }
      i = j
    }
    return map
  }, [section.niveaux, section.mergeNiveauxByLabel])

  /** Couleur de fond par cycle, activée quand section.cycleBackgrounds est vrai. */
  const cycleBackgroundFor = (label: string): string | undefined => {
    if (!section.cycleBackgrounds) return undefined
    // Vert très clair (Collège) / sable très clair (Cycle II) / surface
    // normale (Cycle III). Couleurs alignées sur le design system Direction A.
    if (label === 'Collège') return '#EEF2EE'
    if (label === 'Cycle II') return '#F2EAD8'
    return undefined // Cycle III ou autre → fallback default
  }

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
            {section.niveaux.map((niv, rIdx) => {
              const group = niveauGroups.get(niv.id) ?? { firstInGroup: true, rowspan: 1 }
              // Couleur de fond : priorité au cycle background si activé,
              // sinon zebra alternée (mode B-CM par défaut).
              const cycleBg = cycleBackgroundFor(niv.label)
              const rowBg = cycleBg ?? (rIdx % 2 === 0 ? 'var(--bg-surface-1)' : 'var(--bg-surface-2)')
              return (
              <tr key={niv.id}>
                {/* Cellule Niveau : émise UNIQUEMENT sur la première ligne du
                    groupe quand mergeNiveauxByLabel est actif (rowspan).
                    Sinon une cellule par ligne (mode classique B-CM). */}
                {group.firstInGroup && (
                  <th
                    scope="row"
                    rowSpan={group.rowspan}
                    style={{
                      ...CELL_NIVEAU_STYLE,
                      background: cycleBg ?? rowBg,
                      borderRight: '2px solid var(--border-ds-strong)',
                      verticalAlign: 'middle',
                      textAlign: 'center',
                    }}
                  >
                    <span style={{ fontWeight: 600, color: 'var(--fg-1)' }}>{niv.label}</span>
                    {/* Sous-libellé masqué quand on fusionne par label
                        (cas B-CMado : "1"/"2"/"3" supprimés). */}
                    {niv.subLabel && !section.mergeNiveauxByLabel && (
                      <span style={{ display: 'block', fontSize: 10, color: 'var(--fg-3)', fontWeight: 400 }}>
                        {niv.subLabel}
                      </span>
                    )}
                  </th>
                )}
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
                            background: rowBg,
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
                          background: rowBg,
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
              )
            })}
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
