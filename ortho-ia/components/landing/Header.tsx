'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { Button, Container } from './Primitives'
import { Logo } from '@/components/ui'

const NAV_LINKS = [
  { label: 'Comment ça marche', href: '/#comment-ca-marche' },
  { label: 'Tarifs',            href: '/#tarifs' },
  { label: 'Témoignages',       href: '/#temoignages' },
  { label: 'FAQ',               href: '/#faq' },
]

const RESSOURCES = [
  { label: '📝 Blog',      href: '/blog' },
  { label: '📚 Glossaire', href: '/glossaire' },
  { label: '🛠️ Outils',   href: '/outils' },
]

export default function Header() {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const firstItemRef = useRef<HTMLAnchorElement>(null)

  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setOpen(false)
        buttonRef.current?.focus()
      }
    }
    document.addEventListener('mousedown', onMouseDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onMouseDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [])

  useEffect(() => {
    if (open) firstItemRef.current?.focus()
  }, [open])

  return (
    <header style={{
      position: 'sticky', top: 0, zIndex: 50,
      background: 'rgba(250, 246, 239, 0.85)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      borderBottom: '1px solid var(--border-ds)',
    }}>
      <Container style={{ display: 'flex', alignItems: 'center', height: 72, gap: 24 }}>
        <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', textDecoration: 'none' }} aria-label="Accueil Ortho.ia">
          <Logo variant="light" height={46} withoutTagline />
        </Link>

        <nav style={{ display: 'flex', gap: 28, marginLeft: 32, alignItems: 'center' }} className="hidden md:flex">
          {NAV_LINKS.map(l => (
            <a key={l.href} href={l.href} style={{
              fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 500,
              color: 'var(--fg-2)', textDecoration: 'none',
            }}>{l.label}</a>
          ))}

          <div ref={containerRef} style={{ position: 'relative' }}>
            <button
              ref={buttonRef}
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              aria-haspopup="true"
              style={{
                fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 500,
                color: 'var(--fg-2)', background: 'none', border: 'none',
                cursor: 'pointer', padding: 0,
                display: 'inline-flex', alignItems: 'center', gap: 4,
              }}
            >
              Ressources
              <svg
                width="10" height="6" viewBox="0 0 10 6" fill="none" aria-hidden="true"
                style={{ transition: 'transform 150ms', transform: open ? 'rotate(180deg)' : 'none' }}
              >
                <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>

            {open && (
              <div
                role="menu"
                style={{
                  position: 'absolute', top: 'calc(100% + 10px)', left: '50%',
                  transform: 'translateX(-50%)',
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-ds)',
                  borderRadius: 14,
                  padding: 6,
                  minWidth: 180,
                  boxShadow: '0 8px 24px rgba(31,42,42,0.10)',
                  zIndex: 100,
                }}
              >
                {RESSOURCES.map((r, i) => (
                  <Link
                    key={r.href}
                    href={r.href}
                    role="menuitem"
                    ref={i === 0 ? firstItemRef : undefined}
                    onClick={() => setOpen(false)}
                    style={{
                      display: 'block',
                      padding: '9px 14px',
                      borderRadius: 9,
                      fontSize: 14, fontWeight: 500,
                      color: 'var(--fg-1)',
                      textDecoration: 'none',
                    }}
                    onFocus={e => (e.currentTarget.style.background = 'var(--bg-canvas)')}
                    onBlur={e => (e.currentTarget.style.background = 'transparent')}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-canvas)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >{r.label}</Link>
                ))}
              </div>
            )}
          </div>
        </nav>

        <div style={{ marginLeft: 'auto', display: 'flex', gap: 10, alignItems: 'center' }}>
          <Button variant="ghost" size="sm" href="/auth/login">Se connecter</Button>
          <Button variant="primary" size="sm" href="/auth/register">Essayer gratuitement</Button>
        </div>
      </Container>
    </header>
  )
}
