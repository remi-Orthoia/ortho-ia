import Link from 'next/link'
import { Container } from './Primitives'
import { Logo } from '@/components/ui'

const COLUMNS: Array<{ title: string; links: Array<{ label: string; href: string }> }> = [
  {
    title: 'Produit',
    links: [
      { label: 'Comment ça marche', href: '#comment-ca-marche' },
      { label: 'Tarifs',            href: '#tarifs' },
      { label: 'Sécurité & RGPD',   href: '/confidentialite' },
      { label: 'Roadmap',           href: '/roadmap' },
    ],
  },
  {
    title: 'Ressources',
    links: [
      { label: 'FAQ',           href: '#faq' },
      { label: 'Témoignages',   href: '#temoignages' },
      { label: 'Beta',          href: '/beta' },
    ],
  },
  {
    title: 'Légal',
    links: [
      { label: "Conditions générales (CGU)", href: '/cgu' },
      { label: "Politique de confidentialité", href: '/confidentialite' },
    ],
  },
]

export default function Footer() {
  return (
    <footer style={{ padding: '64px 0 40px', background: 'var(--bg-canvas)', borderTop: '1px solid var(--border-ds)' }}>
      <Container>
        <div className="footer-grid" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 48, marginBottom: 48 }}>
          <div>
            <div style={{ marginBottom: 14 }}>
              <Logo variant="light" height={36} withoutTagline />
            </div>
            <p style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--fg-2)', maxWidth: 320, margin: 0 }}>
              La plume rapide des orthophonistes — pour vous laisser plus de temps avec vos patients.
            </p>
          </div>
          {COLUMNS.map(col => (
            <div key={col.title}>
              <p style={{
                fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 600,
                letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--fg-3)',
                margin: '0 0 14px',
              }}>{col.title}</p>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {col.links.map(l => (
                  <li key={l.label}>
                    {l.href.startsWith('#') ? (
                      <a href={l.href} style={{ fontSize: 14, color: 'var(--fg-2)', textDecoration: 'none' }}>{l.label}</a>
                    ) : (
                      <Link href={l.href} style={{ fontSize: 14, color: 'var(--fg-2)', textDecoration: 'none' }}>{l.label}</Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          paddingTop: 24, borderTop: '1px solid var(--border-ds)',
          fontSize: 13, color: 'var(--fg-3)', flexWrap: 'wrap', gap: 12,
        }}>
          <span>© {new Date().getFullYear()} Ortho.ia · Données sécurisées · RGPD</span>
          <span>Fait à Paris, avec des orthophonistes en exercice.</span>
        </div>
      </Container>
    </footer>
  )
}

