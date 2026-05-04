'use client'

import { useState, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { AppButton, AppInput, Logo } from '@/components/ui'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirect') || '/dashboard'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        setError(
          error.message.includes('Invalid login credentials')
            ? 'Email ou mot de passe incorrect'
            : error.message
        )
        return
      }
      router.push(redirectTo)
      router.refresh()
    } catch {
      setError('Une erreur est survenue. Veuillez réessayer.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="auth-split"
      style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr',
        minHeight: '100vh',
        background: 'var(--bg-canvas)',
        color: 'var(--fg-1)',
        fontFamily: 'var(--font-body)',
      }}
    >
      {/* Colonne gauche — fond sombre + quote */}
      <div
        className="auth-pane-dark"
        style={{
          background: 'var(--bg-inverse)', color: 'var(--fg-on-brand)',
          padding: '64px 56px',
          display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
        }}
      >
        <Link href="/" style={{ display: 'inline-block', textDecoration: 'none' }} aria-label="Ortho.ia — accueil">
          <Logo variant="dark" height={42} />
        </Link>
        <div>
          <p style={{
            fontFamily: 'var(--font-display)', fontSize: 'clamp(28px, 3.4vw, 40px)', fontWeight: 500,
            lineHeight: 1.15, letterSpacing: '-0.015em', margin: 0, textWrap: 'balance',
          }}>
            « Le rapport ressemble à ce que j&apos;aurais écrit moi-même —
            en plus rapide. »
          </p>
          <p style={{ marginTop: 18, fontSize: 14, color: 'rgba(250,246,239,0.7)' }}>
            Julie M., orthophoniste libérale, Lyon
          </p>
        </div>
        <p style={{ fontSize: 13, color: 'rgba(250,246,239,0.5)', margin: 0 }}>
          Données chiffrées · RGPD · Secret médical
        </p>
      </div>

      {/* Colonne droite — formulaire */}
      <div style={{ display: 'grid', placeItems: 'center', padding: 32 }}>
        <form onSubmit={handleLogin} style={{ width: '100%', maxWidth: 360 }}>
          <h1 style={{
            fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 500,
            letterSpacing: '-0.015em', margin: '0 0 8px', color: 'var(--fg-1)',
          }}>
            Bonjour !
          </h1>
          <p style={{ fontSize: 15, color: 'var(--fg-2)', margin: '0 0 28px' }}>
            Reconnectez-vous pour reprendre vos bilans.
          </p>

          {error && (
            <div style={{
              background: 'var(--ds-danger-soft)', color: 'var(--ds-danger)',
              padding: '10px 14px', borderRadius: 10,
              fontSize: 13, marginBottom: 14,
            }}>
              {error}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <AppInput
              label="Email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="vous@exemple.com"
            />
            <div style={{ position: 'relative' }}>
              <AppInput
                label="Mot de passe"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                style={{ paddingRight: 40 }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(s => !s)}
                aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                style={{
                  position: 'absolute', right: 10, bottom: 9,
                  background: 'transparent', border: 0, padding: 4,
                  color: 'var(--fg-3)', cursor: 'pointer',
                  display: 'grid', placeItems: 'center',
                }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            <AppButton
              type="submit"
              variant="primary"
              size="lg"
              loading={loading}
              style={{ width: '100%', justifyContent: 'center', marginTop: 6 }}
            >
              {loading ? 'Connexion…' : 'Se connecter'}
            </AppButton>
          </div>

          <p style={{ fontSize: 13, color: 'var(--fg-3)', textAlign: 'center', marginTop: 18 }}>
            <Link href="/auth/forgot-password" style={{ color: 'var(--fg-link)' }}>Mot de passe oublié ?</Link>
            {' · '}
            <Link href="/auth/register" style={{ color: 'var(--fg-link)' }}>Créer un compte</Link>
          </p>
        </form>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: 'var(--bg-canvas)' }}>
          <Loader2 className="animate-spin" size={28} style={{ color: 'var(--ds-primary)' }} />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  )
}
