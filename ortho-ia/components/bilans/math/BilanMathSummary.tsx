'use client'

import Pastille from './Pastille'
import { computeParentColor } from '@/lib/bilans/math/parent-color'
import type { GrilleBilan, BilanMathDraft, PastilleEtat } from '@/lib/bilans/math/types'

/**
 * Rendu READ-ONLY de la grille colorée d'un bilan math, pour insertion en
 * tête du CRBO généré (preview + historique).
 *
 * Reprend fidèlement la structure de la grille (Domaine → Épreuve → Sous-épreuves)
 * avec les pastilles colorées d'après l'état saisi par l'ortho. Aucune
 * interaction : pas de clic, pas de notes textarea, pas de bouton IA. Juste
 * un coup d'œil rapide sur le profil de cotations.
 *
 * Utilisé dans :
 *   - BilanMathForm preview après "Générer le CRBO"
 *   - app/dashboard/historique/[id]/page.tsx (pour bilan_subtype b-cm/b-cmado)
 */

interface BilanMathSummaryProps {
  grille: GrilleBilan
  /** État des épreuves (le sous-arbre `epreuves` de BilanMathDraft). */
  epreuves: BilanMathDraft['epreuves']
  /** Si true, on affiche aussi les épreuves non cotées (gris). Par défaut false :
   *  on ne montre que les épreuves avec au moins une cotation non-gris. */
  showEmpty?: boolean
}

export default function BilanMathSummary({
  grille,
  epreuves,
  showEmpty = false,
}: BilanMathSummaryProps) {
  /** Couleur calculée d'une épreuve (parent color depuis ses sous-épreuves
   *  OU pastille directe pour les mono-épreuves). */
  const colorOf = (epreuve: GrilleBilan['domaines'][number]['epreuves'][number]): PastilleEtat => {
    const state = epreuves[epreuve.id]
    if (!state) return 'gris'
    if (epreuve.sousEpreuves.length === 0) return state.direct ?? 'gris'
    const colors = epreuve.sousEpreuves.map(se => (state.sousEpreuves[se.id] ?? 'gris') as PastilleEtat)
    return computeParentColor(colors)
  }

  return (
    <div
      style={{
        background: 'var(--bg-surface-1)',
        border: '1px solid var(--border-ds)',
        borderRadius: 12,
        padding: 16,
      }}
    >
      <header style={{ marginBottom: 12 }}>
        <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'var(--fg-1)' }}>
          {grille.label} — Profil de cotations
        </h3>
        <p style={{ margin: '4px 0 0', fontSize: 11, color: 'var(--fg-3)' }}>
          Grille colorée reprise fidèlement depuis la saisie. Rouge &gt; Orange &gt; Vert sur la couleur parent.
        </p>
      </header>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {grille.domaines.map(domaine => {
          // Détermine quelles épreuves afficher : par défaut on cache les
          // épreuves totalement non renseignées pour réduire le bruit visuel.
          const epreuvesToShow = domaine.epreuves.filter(epreuve => {
            if (showEmpty) return true
            const parent = colorOf(epreuve)
            const state = epreuves[epreuve.id]
            const hasNotes = state?.notes && state.notes.trim().length > 0
            return parent !== 'gris' || hasNotes
          })
          if (epreuvesToShow.length === 0) return null
          return (
            <section key={domaine.id}>
              <h4
                style={{
                  margin: '0 0 6px',
                  fontSize: 11,
                  fontWeight: 700,
                  color: 'var(--fg-3)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                {domaine.label}
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {epreuvesToShow.map(epreuve => {
                  const parent = colorOf(epreuve)
                  const state = epreuves[epreuve.id]
                  const isMono = epreuve.sousEpreuves.length === 0
                  return (
                    <div
                      key={epreuve.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        flexWrap: 'wrap',
                        padding: '6px 8px',
                        background: 'var(--bg-surface-2)',
                        borderRadius: 6,
                      }}
                    >
                      <Pastille
                        etat={parent}
                        readonly
                        size={16}
                        ariaPrefix={`${epreuve.label} (couleur globale)`}
                      />
                      <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--fg-1)', flexShrink: 0 }}>
                        {epreuve.label}
                      </span>
                      {!isMono && (
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginLeft: 'auto' }}>
                          {epreuve.sousEpreuves.map(se => {
                            const c = (state?.sousEpreuves[se.id] ?? 'gris') as PastilleEtat
                            return (
                              <span
                                key={se.id}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 4,
                                  fontSize: 11,
                                  color: 'var(--fg-2)',
                                }}
                              >
                                <Pastille
                                  etat={c}
                                  readonly
                                  size={10}
                                  ariaPrefix={`${epreuve.label} — ${se.label}`}
                                />
                                {se.label}
                              </span>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </section>
          )
        })}
      </div>
    </div>
  )
}
