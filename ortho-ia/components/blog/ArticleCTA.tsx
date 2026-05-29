import Link from 'next/link'

interface ArticleCTAProps {
  title?: string
  description?: string
  ctaLabel?: string
  ctaHref?: string
}

export function ArticleCTA({
  title = 'Générez votre CRBO en 5 minutes',
  description = "Importez vos résultats de bilan : Ortho.ia rédige le compte rendu complet, prêt à signer. Essai gratuit, sans engagement.",
  ctaLabel = 'Essayer gratuitement',
  ctaHref = '/auth/register',
}: ArticleCTAProps) {
  return (
    <aside
      style={{
        margin: '40px 0',
        padding: '24px 28px',
        background: 'var(--ds-primary-soft)',
        borderLeft: '4px solid var(--ds-primary)',
        borderRadius: '0 16px 16px 0',
      }}
      aria-label="Appel à l'action Ortho.ia"
    >
      <p style={{
        fontFamily: 'var(--font-display)',
        fontSize: 20, fontWeight: 500,
        margin: '0 0 8px',
        color: 'var(--fg-1)',
        letterSpacing: '-0.01em',
      }}>{title}</p>
      <p style={{
        fontSize: 14, lineHeight: 1.6,
        color: 'var(--fg-2)',
        margin: '0 0 16px',
      }}>{description}</p>
      <Link
        href={ctaHref}
        style={{
          display: 'inline-block',
          background: 'var(--ds-accent)',
          color: 'white',
          padding: '10px 20px',
          borderRadius: 10,
          fontSize: 14, fontWeight: 600,
          textDecoration: 'none',
        }}
      >
        {ctaLabel}
      </Link>
    </aside>
  )
}
