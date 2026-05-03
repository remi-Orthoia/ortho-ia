'use client'

import Link from 'next/link'
import { Button, Container } from './Primitives'

const NAV_LINKS = [
  { label: 'Comment ça marche', href: '#comment-ca-marche' },
  { label: 'Tarifs',            href: '#tarifs' },
  { label: 'Témoignages',       href: '#temoignages' },
  { label: 'FAQ',               href: '#faq' },
]

export default function Header() {
  return (
    <header style={{
      position: 'sticky', top: 0, zIndex: 50,
      background: 'rgba(250, 246, 239, 0.85)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      borderBottom: '1px solid var(--border-ds)',
    }}>
      <Container style={{ display: 'flex', alignItems: 'center', height: 72, gap: 24 }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <Logo />
          <span style={{
            fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 500,
            letterSpacing: '-0.02em', color: 'var(--fg-1)',
          }}>
            Ortho<span style={{ color: 'var(--ds-primary)' }}>.</span><span style={{ color: 'var(--ds-accent)' }}>ia</span>
          </span>
        </Link>
        <nav style={{ display: 'flex', gap: 28, marginLeft: 32 }} className="hidden md:flex">
          {NAV_LINKS.map(l => (
            <a key={l.href} href={l.href} style={{
              fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 500,
              color: 'var(--fg-2)', textDecoration: 'none',
            }}>{l.label}</a>
          ))}
        </nav>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 10, alignItems: 'center' }}>
          <Button variant="ghost" size="sm" href="/auth/login">Se connecter</Button>
          <Button variant="primary" size="sm" href="/auth/register">Essayer gratuitement</Button>
        </div>
      </Container>
    </header>
  )
}

// Logo SVG inline — sage 600 + terracotta 600 selon direction A
function Logo() {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" aria-hidden="true">
      <circle cx="16" cy="16" r="14" fill="var(--ds-primary)" />
      <path d="M10 16c0-3.3 2.7-6 6-6s6 2.7 6 6-2.7 6-6 6" stroke="var(--fg-on-brand)" strokeWidth="2.4" fill="none" strokeLinecap="round" />
      <circle cx="22" cy="22" r="3" fill="var(--ds-accent)" />
    </svg>
  )
}
