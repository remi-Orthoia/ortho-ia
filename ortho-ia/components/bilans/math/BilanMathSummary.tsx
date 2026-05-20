'use client'

import MatriceSection from './MatriceSection'
import type { GrilleBilan, BilanMathDraft } from '@/lib/bilans/math/types'

/**
 * Rendu read-only des matrices d'un bilan math, pour insertion en tête du
 * CRBO généré (preview + historique). Réutilise MatriceSection en mode
 * `interactive={false}` pour garantir une cohérence visuelle parfaite avec
 * la saisie.
 */

interface BilanMathSummaryProps {
  grille: GrilleBilan
  /** État des épreuves (le sous-arbre `epreuves` de BilanMathDraft). */
  epreuves: BilanMathDraft['epreuves']
  /** Libellé alternatif pour le header (par défaut "{label} — Profil de cotations"). */
  titleOverride?: string
}

export default function BilanMathSummary({
  grille,
  epreuves,
  titleOverride,
}: BilanMathSummaryProps) {
  return (
    <div
      style={{
        background: 'var(--bg-surface-1)',
        border: '1px solid var(--border-ds)',
        borderRadius: 12,
        padding: 16,
      }}
    >
      <header style={{ marginBottom: 14 }}>
        <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'var(--fg-1)' }}>
          {titleOverride ?? `${grille.label} — Profil de cotations`}
        </h3>
        <p style={{ margin: '4px 0 0', fontSize: 11, color: 'var(--fg-3)' }}>
          Matrice colorée reprise fidèlement depuis la saisie.
        </p>
      </header>

      {grille.sections.map((section) => (
        <MatriceSection
          key={section.id}
          section={section}
          epreuves={epreuves}
          interactive={false}
        />
      ))}
    </div>
  )
}
