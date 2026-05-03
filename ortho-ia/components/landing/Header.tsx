'use client'

import Link from 'next/link'
import { Button, Container } from './Primitives'
import { Logo } from '@/components/ui'

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
        <Link href="/" style={{ display: 'inline-block', textDecoration: 'none' }} aria-label="Ortho.ia — accueil">
          <Logo variant="light" height={42} withoutTagline />
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

