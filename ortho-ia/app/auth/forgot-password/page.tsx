'use client'

import { useState } from 'react'
import Link from 'next/link'
import { CheckCircle, ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { AppButton, AppInput, Logo } from '@/components/ui'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      })
      if (error) {
        setError(error.message)
        return
      }
      setSent(true)
    } catch {
      setError('Une erreur est survenue. Veuillez réessayer.')
    } finally {
      setLoading(false)
    }
  }

  // ============ Écran de succès ============
  if (sent) {
    return (
      <div style={{
        minHeight: '100vh', background: 'var(--bg-canvas)',
        display: 'grid', placeItems: 'center', padding: 24,
        fontFamily: 'var(--font-body)',
      }}>
        <div style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-ds)',
          borderRadius: 20,
          padding: '40px 32px', maxWidth: 420, width: '100%',
          textAlign: 'center',
          boxShadow: 'var(--shadow-md)',
        }}>
          <div style={{
            width: 64, height: 64, borderRadius: 999,
            background: 'var(--ds-success-soft)', color: 'var(--ds-success)',
            display: 'grid', placeItems: 'center', margin: '0 auto 20px',
          }}>
            <CheckCircle size={32} />
          </div>
          <h2 style={{
            fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 500,
            letterSpacing: '-0.015em', margin: '0 0 12px', color: 'var(--fg-1)',
          }}>
            Email envoyé.
          </h2>
          <p style={{ fontSize: 15, color: 'var(--fg-2)', margin: '0 0 24px', lineHeight: 1.55 }}>
            Si un compte existe avec l&apos;adresse <strong>{email}</strong>, vous recevrez un lien
            pour réinitialiser votre mot de passe.
          </p>
          <Link
            href="/auth/login"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              fontSize: 14, fontWeight: 500, color: 'var(--fg-link)',
              textDecoration: 'none',
            }}
          >
            <ArrowLeft size={16} />
            Retour à la connexion
          </Link>
        </div>
      </div>
    )
  }

  // ============ Formulaire ============
  return (
    <div
      className="auth-split"
      style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr',
        minHeight: '100vh',
        background: 'var(--bg-canvas)', color: 'var(--fg-1)',
        fontFamily: 'var(--font-body)',
      }}
    >
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
            Récupérez l&apos;accès à vos bilans en quelques secondes.
          </p>
          <p style={{ marginTop: 18, fontSize: 14, color: 'rgba(250,246,239,0.7)' }}>
            Un lien sécurisé vous sera envoyé par email.
          </p>
        </div>
        <p style={{ fontSize: 13, color: 'rgba(250,246,239,0.5)', margin: 0 }}>
          Données chiffrées · RGPD · Secret médical
        </p>
      </div>

      <div style={{ display: 'grid', placeItems: 'center', padding: 32 }}>
        <form onSubmit={handleSubmit} style={{ width: '100%', maxWidth: 360 }}>
          <h1 style={{
            fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 500,
            letterSpacing: '-0.015em', margin: '0 0 8px', color: 'var(--fg-1)',
          }}>
            Mot de passe oublié.
          </h1>
          <p style={{ fontSize: 15, color: 'var(--fg-2)', margin: '0 0 28px' }}>
            Entrez votre email pour recevoir un lien de réinitialisation.
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
            <AppButton
              type="submit"
              variant="primary"
              size="lg"
              loading={loading}
              style={{ width: '100%', justifyContent: 'center', marginTop: 6 }}
            >
              {loading ? 'Envoi en cours…' : 'Envoyer le lien'}
            </AppButton>
          </div>

          <p style={{ fontSize: 13, color: 'var(--fg-3)', textAlign: 'center', marginTop: 18 }}>
            <Link href="/auth/login" style={{ color: 'var(--fg-link)' }}>
              ← Retour à la connexion
            </Link>
          </p>
        </form>
      </div>
    </div>
  )
}

