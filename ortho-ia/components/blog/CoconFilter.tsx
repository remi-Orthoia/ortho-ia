import Link from 'next/link'
import { COCONS } from '@/lib/blog-cocons'
import type { CoconId } from '@/lib/blog-cocons'
import type { LocaleCode } from '@/lib/locales'
import { getCoconPath, getBlogBasePath } from '@/lib/locales'

interface CoconFilterProps {
  locale?: LocaleCode
  activeCocon?: CoconId
}

export function CoconFilter({ locale = 'fr', activeCocon }: CoconFilterProps) {
  const blogPath = getBlogBasePath(locale)

  return (
    <nav aria-label="Filtrer par thème" style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
      <div style={{ display: 'flex', gap: 8, paddingBottom: 4, minWidth: 'max-content' }}>
        <Link
          href={blogPath}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '8px 18px', borderRadius: 999,
            fontSize: 14, fontWeight: 500, textDecoration: 'none',
            background: !activeCocon ? 'var(--ds-primary)' : 'var(--bg-surface)',
            color: !activeCocon ? 'white' : 'var(--fg-2)',
            border: '1px solid',
            borderColor: !activeCocon ? 'transparent' : 'var(--border-ds)',
            whiteSpace: 'nowrap',
            transition: 'all 150ms',
          }}
        >
          Tout
        </Link>

        {COCONS.map((cocon) => {
          const isActive = activeCocon === cocon.id
          return (
            <Link
              key={cocon.id}
              href={getCoconPath(locale, cocon.id)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '8px 18px', borderRadius: 999,
                fontSize: 14, fontWeight: 500, textDecoration: 'none',
                background: isActive ? 'var(--ds-primary)' : 'var(--bg-surface)',
                color: isActive ? 'white' : 'var(--fg-2)',
                border: '1px solid',
                borderColor: isActive ? 'transparent' : 'var(--border-ds)',
                whiteSpace: 'nowrap',
                transition: 'all 150ms',
              }}
            >
              <span aria-hidden="true">{cocon.icon}</span>
              {cocon.label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
