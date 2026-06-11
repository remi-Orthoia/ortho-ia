/**
 * Barre horizontale des 5 catégories du blog.
 *
 * - Affiche un onglet "Tous les articles" + 1 onglet par cocon.
 * - L'onglet correspondant à `activeCocon` est mis en avant.
 *   Passer `activeCocon=null` met "Tous" en avant (page /blog).
 * - Pas de cocon actif → tous les onglets sont neutres.
 */

import Link from 'next/link'
import { COCON_LIST } from '@/lib/cocons'
import { CoconChip } from './CoconChip'

interface CoconNavProps {
  /** Slug du cocon actif, ou 'all' pour la page /blog, ou undefined si neutre. */
  activeCocon?: string | 'all'
}

export function CoconNav({ activeCocon }: CoconNavProps) {
  const allActive = activeCocon === 'all'

  return (
    <nav
      aria-label="Catégories du blog"
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 32,
        paddingBottom: 24,
        borderBottom: '1px solid var(--border-ds)',
      }}
    >
      <Link
        href="/blog"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          padding: '4px 12px',
          borderRadius: 999,
          fontSize: 12,
          fontWeight: 600,
          letterSpacing: '0.01em',
          textDecoration: 'none',
          border: '1px solid transparent',
          background: allActive ? 'var(--fg-1)' : 'var(--bg-surface)',
          color: allActive ? 'var(--bg-canvas)' : 'var(--fg-2)',
          borderColor: allActive ? 'var(--fg-1)' : 'var(--border-ds)',
          transition: 'background 160ms ease, color 160ms ease',
        }}
      >
        Tous les articles
      </Link>

      {COCON_LIST.map((cocon) => (
        <CoconChip
          key={cocon.slug}
          cocon={cocon}
          variant={activeCocon === cocon.slug ? 'active' : 'default'}
        />
      ))}
    </nav>
  )
}
