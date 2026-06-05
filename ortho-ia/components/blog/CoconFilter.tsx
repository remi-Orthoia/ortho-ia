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

  const ghostStyle: React.CSSProperties = {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    padding: '7px 16px', borderRadius: 999,
    fontSize: 13, fontWeight: 500, textDecoration: 'none',
    whiteSpace: 'nowrap',
  }

  return (
    <nav aria-label="Filtrer par thème">
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {/* "Tout" — ghost, moins appuyé */}
        <Link
          href={blogPath}
          style={{
            ...ghostStyle,
            background: !activeCocon ? 'var(--bg-surface-2)' : 'transparent',
            color: !activeCocon ? 'var(--fg-1)' : 'var(--fg-3)',
            border: '1px solid',
            borderColor: !activeCocon ? 'var(--border-ds-strong)' : 'var(--border-ds)',
            fontWeight: !activeCocon ? 600 : 400,
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
                ...ghostStyle,
                background: isActive ? 'var(--ds-primary)' : 'var(--bg-surface)',
                color: isActive ? 'white' : 'var(--fg-2)',
                border: '1px solid',
                borderColor: isActive ? 'transparent' : 'var(--border-ds)',
                fontWeight: isActive ? 600 : 500,
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
