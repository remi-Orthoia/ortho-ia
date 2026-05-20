'use client'

import Pastille from './Pastille'
import { computeParentColor, cyclePastille } from '@/lib/bilans/math/parent-color'
import type { GrilleBilan, BilanMathDraft, EpreuveState, PastilleEtat } from '@/lib/bilans/math/types'

/**
 * Rendu de la grille colorée d'un bilan math. Deux modes :
 *
 *  - **Read-only** (par défaut, sans `onEpreuveChange`) : affiche les pastilles
 *    en mode indicateur. Utilisé pour la preview CRBO + historique.
 *  - **Interactif** (avec `onEpreuveChange`) : les pastilles deviennent
 *    cliquables et cyclent gris → vert → orange → rouge → gris. Utilisé en
 *    tête du formulaire pour permettre la cotation rapide sur la grille globale.
 *
 * Pour les épreuves multi (avec sous-épreuves), la pastille parent reste
 * READ-ONLY même en mode interactif : c'est une couleur CALCULÉE qui ne peut
 * pas être éditée directement. L'ortho cote les sous-épreuves individuellement.
 *
 * Utilisé dans :
 *   - BilanMathForm en tête (interactif)
 *   - BilanMathForm preview après "Générer le CRBO" (read-only)
 *   - app/dashboard/historique/[id]/page.tsx (read-only)
 */

interface BilanMathSummaryProps {
  grille: GrilleBilan
  /** État des épreuves (le sous-arbre `epreuves` de BilanMathDraft). */
  epreuves: BilanMathDraft['epreuves']
  /** Si true, on affiche aussi les épreuves non cotées (gris). Par défaut false :
   *  on ne montre que les épreuves avec au moins une cotation non-gris. */
  showEmpty?: boolean
  /** Si fourni, active le mode interactif : les pastilles deviennent cliquables
   *  et appellent ce callback avec le nouvel état de l'épreuve. Sinon mode read-only. */
  onEpreuveChange?: (epreuveId: string, next: EpreuveState) => void
  /** Libellé alternatif pour le header (par défaut "{label} — Profil de cotations"). */
  titleOverride?: string
}

export default function BilanMathSummary({
  grille,
  epreuves,
  showEmpty = false,
  onEpreuveChange,
  titleOverride,
}: BilanMathSummaryProps) {
  const interactive = typeof onEpreuveChange === 'function'

  /** Couleur calculée d'une épreuve (parent color depuis ses sous-épreuves
   *  OU pastille directe pour les mono-épreuves). */
  const colorOf = (epreuve: GrilleBilan['domaines'][number]['epreuves'][number]): PastilleEtat => {
    const state = epreuves[epreuve.id]
    if (!state) return 'gris'
    if (epreuve.sousEpreuves.length === 0) return state.direct ?? 'gris'
    const colors = epreuve.sousEpreuves.map(se => (state.sousEpreuves[se.id] ?? 'gris') as PastilleEtat)
    return computeParentColor(colors)
  }

  const getOrEmptyState = (epreuveId: string): EpreuveState =>
    epreuves[epreuveId] ?? { sousEpreuves: {}, notes: '' }

  const handleDirectClick = (epreuveId: string) => {
    if (!onEpreuveChange) return
    const state = getOrEmptyState(epreuveId)
    onEpreuveChange(epreuveId, { ...state, direct: cyclePastille(state.direct ?? 'gris') })
  }

  const handleSousEpreuveClick = (epreuveId: string, sousEpreuveId: string) => {
    if (!onEpreuveChange) return
    const state = getOrEmptyState(epreuveId)
    const current = state.sousEpreuves[sousEpreuveId] ?? 'gris'
    onEpreuveChange(epreuveId, {
      ...state,
      sousEpreuves: { ...state.sousEpreuves, [sousEpreuveId]: cyclePastille(current) },
    })
  }

  return (
    <div
      style={{
        background: 'var(--bg-surface-1)',
        border: interactive ? '2px solid var(--ds-primary, #16a34a)' : '1px solid var(--border-ds)',
        borderRadius: 12,
        padding: 16,
      }}
    >
      <header style={{ marginBottom: 12 }}>
        <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'var(--fg-1)' }}>
          {titleOverride ?? `${grille.label} — Profil de cotations`}
        </h3>
        <p style={{ margin: '4px 0 0', fontSize: 11, color: 'var(--fg-3)' }}>
          {interactive
            ? 'Clique sur une pastille pour cycler gris → vert → orange → rouge → gris. Les notes par épreuve se saisissent plus bas.'
            : 'Grille colorée reprise fidèlement depuis la saisie. Rouge > Orange > Vert sur la couleur parent.'}
        </p>
      </header>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {grille.domaines.map(domaine => {
          // Mode interactif : afficher TOUTES les épreuves (sinon on ne peut
          // pas commencer à coter une épreuve vierge). En mode read-only, on
          // cache les épreuves totalement non renseignées pour réduire le bruit.
          const epreuvesToShow = domaine.epreuves.filter(epreuve => {
            if (interactive || showEmpty) return true
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
                      {/* Pastille parent : interactive uniquement pour les épreuves
                          mono (clic = cycle direct). Pour les multi, le parent est
                          CALCULÉ depuis les sous-épreuves, donc reste read-only. */}
                      <Pastille
                        etat={parent}
                        readonly={!interactive || !isMono}
                        onClick={interactive && isMono ? () => handleDirectClick(epreuve.id) : undefined}
                        size={isMono && interactive ? 20 : 16}
                        ariaPrefix={isMono ? epreuve.label : `${epreuve.label} (couleur globale)`}
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
                                  readonly={!interactive}
                                  onClick={interactive ? () => handleSousEpreuveClick(epreuve.id, se.id) : undefined}
                                  size={interactive ? 14 : 10}
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
