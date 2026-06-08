import Link from 'next/link'

interface OutilCardProps {
  title: string
  description: string
  icon: string
  status: 'available' | 'coming-soon'
  href?: string
  tag?: string
}

export function OutilCard({ title, description, icon, status, href, tag }: OutilCardProps) {
  const isAvailable = status === 'available'

  const inner = (
    <div
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-ds)',
        borderRadius: 20,
        padding: 28,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        opacity: isAvailable ? 1 : 0.65,
        boxSizing: 'border-box',
        transition: 'transform 180ms cubic-bezier(0.32,0.72,0,1), box-shadow 180ms',
      }}
      className={isAvailable ? 'ds-card-interactive' : undefined}
    >
      <div style={{ fontSize: 38 }} aria-hidden="true">{icon}</div>

      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <h3 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 18, fontWeight: 500,
          margin: 0, color: 'var(--fg-1)',
        }}>{title}</h3>
        {tag && (
          <span style={{
            background: isAvailable ? 'var(--ds-accent-soft)' : 'var(--bg-surface-2)',
            color: isAvailable ? 'var(--ds-accent)' : 'var(--fg-3)',
            padding: '2px 8px', borderRadius: 999,
            fontSize: 11, fontWeight: 600,
          }}>{tag}</span>
        )}
      </div>

      <p style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--fg-2)', margin: 0, flex: 1 }}>
        {description}
      </p>

      {isAvailable ? (
        <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--ds-primary)' }}>
          Découvrir →
        </span>
      ) : (
        <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--fg-3)' }}>
          Bientôt disponible
        </span>
      )}
    </div>
  )

  if (isAvailable && href) {
    return (
      <Link href={href} style={{ textDecoration: 'none', color: 'inherit', display: 'block', height: '100%' }}>
        {inner}
      </Link>
    )
  }
  return inner
}
