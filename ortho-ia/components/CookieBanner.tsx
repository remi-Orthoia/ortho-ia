'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Cookie, X } from 'lucide-react'

/**
 * Bandeau RGPD au premier chargement.
 * Cookies essentiels uniquement (pas de tracking publicitaire). Le choix
 * "Accepter" est mémorisé en localStorage — pas de re-prompt aux visites
 * suivantes. Le bouton "Refuser" n'a pas lieu d'être : aucun cookie
 * non-essentiel n'est posé par l'app.
 */

const STORAGE_KEY = 'ortho-ia:cookie-consent'

export default function CookieBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (!stored) setVisible(true)
    } catch {
      // localStorage indisponible (mode privé strict, etc.) — on n'affiche pas
      // le bandeau plutôt que de bloquer l'UI : pas de cookie non-essentiel posé.
    }
  }, [])

  const handleAccept = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ accepted: true, ts: Date.now() }))
    } catch {}
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-3 sm:p-4 pointer-events-none">
      <div
        role="region"
        aria-label="Bandeau d'information RGPD"
        className="pointer-events-auto max-w-3xl mx-auto flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4"
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-ds)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-lg)',
          padding: 20,
          fontFamily: 'var(--font-body)',
        }}
      >
        <div className="flex items-center gap-3 flex-1">
          <div
            className="shrink-0 flex items-center justify-center"
            style={{
              width: 40, height: 40, borderRadius: 999,
              background: 'var(--ds-primary-soft)',
              color: 'var(--ds-primary-hover)',
            }}
          >
            <Cookie size={18} />
          </div>
          <p style={{ fontSize: 14, color: 'var(--fg-2)', lineHeight: 1.55 }}>
            Ce site utilise des cookies essentiels uniquement (session, préférences) — pas de tracking publicitaire ni de cookies tiers.{' '}
            <Link
              href="/confidentialite"
              style={{
                textDecoration: 'underline',
                fontWeight: 500,
                color: 'var(--fg-link)',
              }}
            >
              Politique de confidentialité
            </Link>
          </p>
        </div>
        <div className="flex items-center gap-2 self-stretch sm:self-auto">
          <button
            type="button"
            onClick={handleAccept}
            style={{
              whiteSpace: 'nowrap',
              padding: '8px 16px',
              background: 'var(--ds-primary)',
              color: 'var(--fg-on-brand)',
              border: 0,
              borderRadius: 'var(--radius-pill)',
              fontFamily: 'var(--font-body)',
              fontSize: 14, fontWeight: 500,
              cursor: 'pointer',
              transition: 'background 180ms',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--ds-primary-hover)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--ds-primary)')}
          >
            Accepter
          </button>
          <button
            type="button"
            onClick={handleAccept}
            aria-label="Fermer le bandeau"
            style={{
              padding: 8,
              background: 'transparent',
              color: 'var(--fg-3)',
              border: 0,
              borderRadius: 'var(--radius-md)',
              cursor: 'pointer',
              transition: 'color 180ms, background 180ms',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'var(--fg-1)'
              e.currentTarget.style.background = 'var(--bg-surface-2)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--fg-3)'
              e.currentTarget.style.background = 'transparent'
            }}
          >
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}
