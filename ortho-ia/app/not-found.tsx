import Link from 'next/link'
import { SearchX, Home } from 'lucide-react'
import { AppButton } from '@/components/ui'

export default function NotFound() {
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
            background: 'var(--bg-surface-2)', color: 'var(--fg-3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 20px',
          }}
        >
          <SearchX size={28} />
        </div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 500, letterSpacing: '-0.015em', color: 'var(--fg-1)' }}>
          404
        </h1>
        <p style={{ marginTop: 8, fontSize: 18, color: 'var(--fg-2)' }}>
          Cette page n&apos;existe pas
        </p>
        <p style={{ marginTop: 4, fontSize: 14, color: 'var(--fg-3)' }}>
          Le lien que vous avez suivi est peut-être obsolète ou incorrect.
        </p>
        <div style={{ marginTop: 24, display: 'flex', justifyContent: 'center', gap: 12 }}>
          <AppButton href="/" variant="secondary">Accueil</AppButton>
          <AppButton href="/dashboard" variant="primary" icon={<Home size={16} />}>
            Tableau de bord
          </AppButton>
        </div>
      </div>
    </div>
  )
}
