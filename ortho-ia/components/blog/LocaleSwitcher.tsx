import Link from 'next/link'
import type { LocaleCode } from '@/lib/locales'
import { ALL_LOCALE_CODES, LOCALE_CONFIGS, getArticlePath } from '@/lib/locales'

interface LocaleSwitcherProps {
  currentLocale: LocaleCode
  slug: string
  canonicalSlug?: string
}

export function LocaleSwitcher({ currentLocale, slug, canonicalSlug }: LocaleSwitcherProps) {
  const targetSlug = canonicalSlug ?? slug

  return (
    <div
      style={{ display: 'inline-flex', gap: 4, alignItems: 'center', padding: '4px', borderRadius: 10, background: 'var(--bg-surface)', border: '1px solid var(--border-ds)' }}
      aria-label="Changer de pays"
    >
      {ALL_LOCALE_CODES.map((code) => {
        const config = LOCALE_CONFIGS[code]
        const isActive = code === currentLocale
        return (
          <Link
            key={code}
            href={getArticlePath(code, targetSlug)}
            hrefLang={config.hreflang}
            aria-current={isActive ? 'page' : undefined}
            style={{
              padding: '4px 10px',
              borderRadius: 7,
              fontSize: 12, fontWeight: 600,
              textDecoration: 'none',
              background: isActive ? 'var(--ds-primary)' : 'transparent',
              color: isActive ? 'white' : 'var(--fg-3)',
              transition: 'all 120ms',
            }}
          >
            {config.label}
          </Link>
        )
      })}
    </div>
  )
}
