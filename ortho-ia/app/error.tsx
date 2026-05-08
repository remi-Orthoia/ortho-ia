'use client'

/**
 * Error boundary global Next.js — évite la page blanche.
 * Affiche un message clair + boutons Réessayer / Retour dashboard.
 */

import { useEffect } from 'react'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'
import { AppButton } from '@/components/ui'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log l'erreur (sans payload sensible)
    console.error('GlobalError:', {
      name: error?.name,
      message: error?.message?.slice(0, 200),
      digest: error?.digest,
    })
  }, [error])

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--bg-canvas)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16,
        fontFamily: 'var(--font-body)', color: 'var(--fg-1)',
      }}
    >
      <div
        style={{
          maxWidth: 460, width: '100%',
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-ds)',
          borderRadius: 'var(--radius-lg)',
          padding: 32,
          boxShadow: 'var(--shadow-lg)',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            width: 64, height: 64, borderRadius: 'var(--radius-lg)',
            background: 'var(--ds-danger-soft)', color: 'var(--ds-danger)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 20px',
          }}
        >
          <AlertTriangle size={28} />
        </div>
        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 26, fontWeight: 500, letterSpacing: '-0.01em',
            color: 'var(--fg-1)',
          }}
        >
          Oups, quelque chose s&apos;est mal passé
        </h1>
        <p style={{ marginTop: 8, color: 'var(--fg-2)', lineHeight: 1.6 }}>
          Une erreur inattendue est survenue. Vos données sont en sécurité.
          Essayez de recharger la page, ou revenez au tableau de bord.
        </p>
        {error?.digest && (
          <p
            style={{
              marginTop: 8,
              fontSize: 12, color: 'var(--fg-3)',
              fontFamily: 'var(--font-mono)',
            }}
          >
            Code : {error.digest}
          </p>
        )}
        <div style={{ marginTop: 24, display: 'flex', justifyContent: 'center', gap: 12 }}>
          <AppButton onClick={() => reset()} variant="primary" icon={<RefreshCw size={16} />}>
            Réessayer
          </AppButton>
          <AppButton href="/dashboard" variant="secondary" icon={<Home size={16} />}>
            Tableau de bord
          </AppButton>
        </div>
        <p style={{ marginTop: 24, fontSize: 12, color: 'var(--fg-3)' }}>
          Si le problème persiste, contactez{' '}
          <a
            href="mailto:remi.berrio@gmail.com"
            style={{ color: 'var(--fg-link)', textDecoration: 'underline' }}
          >
            remi.berrio@gmail.com
          </a>
        </p>
      </div>
    </div>
  )
}
