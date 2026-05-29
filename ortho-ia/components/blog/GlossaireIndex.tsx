import Link from 'next/link'

export interface GlossaireTerm {
  slug: string
  label: string
  definition: string
}

interface GlossaireIndexProps {
  terms: GlossaireTerm[]
}

export function GlossaireIndex({ terms }: GlossaireIndexProps) {
  const grouped = terms.reduce<Record<string, GlossaireTerm[]>>((acc, t) => {
    const letter = t.label[0].toUpperCase()
    if (!acc[letter]) acc[letter] = []
    acc[letter].push(t)
    return acc
  }, {})

  const letters = Object.keys(grouped).sort()

  return (
    <div>
      <nav aria-label="Navigation alphabétique" style={{
        display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 48,
      }}>
        {letters.map((l) => (
          <a
            key={l}
            href={`#lettre-${l}`}
            style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              width: 36, height: 36, borderRadius: 8,
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-ds)',
              fontSize: 14, fontWeight: 700,
              color: 'var(--ds-primary)',
              textDecoration: 'none',
            }}
          >{l}</a>
        ))}
      </nav>

      {letters.map((letter) => (
        <section key={letter} id={`lettre-${letter}`} style={{ marginBottom: 48 }}>
          <h2 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 36, fontWeight: 500,
            color: 'var(--ds-primary)',
            margin: '0 0 20px',
            paddingBottom: 10,
            borderBottom: '2px solid var(--ds-primary-soft)',
          }}>{letter}</h2>
          <dl style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {grouped[letter].map((term) => (
              <div
                key={term.slug}
                style={{
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-ds)',
                  borderRadius: 16,
                  padding: '20px 24px',
                }}
              >
                <dt style={{ marginBottom: 4 }}>
                  <Link
                    href={`/glossaire/${term.slug}`}
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: 18, fontWeight: 500,
                      color: 'var(--fg-1)', textDecoration: 'none',
                    }}
                  >
                    {term.label}
                  </Link>
                </dt>
                <dd style={{
                  fontSize: 14, lineHeight: 1.6, color: 'var(--fg-2)', margin: 0,
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                } as React.CSSProperties}>{term.definition}</dd>
              </div>
            ))}
          </dl>
        </section>
      ))}
    </div>
  )
}
