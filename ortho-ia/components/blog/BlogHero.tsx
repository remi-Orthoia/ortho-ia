import { Eyebrow } from '@/components/landing/Primitives'

export function BlogHero() {
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
        Tous les articles Ortho.ia : rédaction CRBO, logiciels, outils, IA, vie libérale.
      </p>
    </section>
  )
}
