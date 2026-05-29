import { Eyebrow } from '@/components/landing/Primitives'
import type { LocaleCode } from '@/lib/locales'
import { LOCALE_CONFIGS } from '@/lib/locales'

interface BlogHeroProps {
  locale?: LocaleCode
}

export function BlogHero({ locale = 'fr' }: BlogHeroProps) {
  const { professionLabel } = LOCALE_CONFIGS[locale]

  return (
    <section style={{ padding: '80px 0 32px' }}>
      <Eyebrow>Le Blog</Eyebrow>
      <h1
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(32px, 5vw, 52px)',
          fontWeight: 500,
          lineHeight: 1.1,
          letterSpacing: '-0.015em',
          margin: '12px 0 16px',
          textWrap: 'balance',
          color: 'var(--fg-1)',
        } as React.CSSProperties}
      >
        Penser, écrire, transmettre.
      </h1>
      <p style={{
        fontSize: 18,
        lineHeight: 1.6,
        color: 'var(--fg-2)',
        margin: 0,
        maxWidth: 600,
      }}>
        Pratique clinique, étalonnages, neurosciences cognitives, écriture du CRBO,
        outils numériques. Par des {professionLabel}s en exercice, sans bullshit.
      </p>
    </section>
  )
}
