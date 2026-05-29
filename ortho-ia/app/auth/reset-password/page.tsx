'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, Loader2, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { AppButton, AppInput, Logo } from '@/components/ui'

/**
 * Page de reinitialisation de mot de passe.
 *
 * Flow :
 *  1. L'ortho clique sur le lien de recuperation envoye par Supabase
 *     (mail genere par /auth/forgot-password). Le lien contient un access_token
 *     dans le hash (#access_token=...&type=recovery) que le SDK Supabase
 *     transforme automatiquement en session "recovery" via onAuthStateChange.
 *  2. Cette page detecte l'evenement PASSWORD_RECOVERY puis demande le nouveau
 *     mot de passe. Sans cet evenement (lien expire/casse), on bloque la
 *     soumission avec un message clair plutot que de laisser updateUser planter.
 *  3. supabase.auth.updateUser({ password }) → redirection /dashboard.
 *
 * Le lien Supabase est valable 1h par defaut. On affiche un message explicite
 * si l'ortho arrive sans token recovery actif (ex. ouverture differee, lien
 * deja consomme).
 */

function ResetPasswordContent() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  // ready = on a bien detecte un evenement PASSWORD_RECOVERY ou une session
  // active avec aud=recovery. Tant que false, on affiche un loader puis un
  // message si l'event n'arrive jamais (lien casse/expire).
  const [ready, setReady] = useState(false)
  const [linkError, setLinkError] = useState('')

  useEffect(() => {
    const supabase = createClient()
    // Le SDK Supabase parse le hash de l'URL (#access_token=...&type=recovery)
    // au mount et emet PASSWORD_RECOVERY. On ecoute jusqu'a 4s avant de
    // basculer sur le mode "lien casse" — au-dela, l'utilisatrice est mieux
    // servie par un message clair que par un loader infini.
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') {
        setReady(true)
      }
    })

    // Cas ou la session est deja active avant l'ecoute (refresh / 2e ouverture)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setReady(true)
    })

    const timer = setTimeout(() => {
      if (!ready) {
        setLinkError('Lien expire ou deja utilise. Demandez un nouveau lien depuis "Mot de passe oublie".')
      }
    }, 4000)

    return () => {
      sub.subscription.unsubscribe()
      clearTimeout(timer)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caracteres.')
      return
    }
    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas.')
      return
    }

    setLoading(true)
    try {
      const supabase = createClient()
      const { error: updateErr } = await supabase.auth.updateUser({ password })
      if (updateErr) {
        setError(updateErr.message || 'Impossible de mettre a jour le mot de passe.')
        return
      }
      setSuccess(true)
      // Court delai pour que la bêta-testeuse voie le check vert avant le
      // redirect — moins brutal qu'un push instant.
      setTimeout(() => router.push('/dashboard'), 1200)
    } catch {
      setError('Une erreur est survenue. Reessayez.')
    } finally {
      setLoading(false)
    }
  }

  // ============ Ecran de succes ============
  if (success) {
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
            Mot de passe mis a jour.
          </h2>
          <p style={{ fontSize: 15, color: 'var(--fg-2)', margin: '0 0 24px', lineHeight: 1.55 }}>
            Redirection vers votre tableau de bord…
          </p>
          <Loader2 className="animate-spin" size={20} style={{ color: 'var(--ds-primary)' }} />
        </div>
      </div>
    )
  }

  // ============ Lien casse / expire ============
  if (linkError) {
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
          padding: '40px 32px', maxWidth: 440, width: '100%',
          textAlign: 'center',
          boxShadow: 'var(--shadow-md)',
        }}>
          <div style={{
            width: 64, height: 64, borderRadius: 999,
            background: 'var(--ds-warning-soft)', color: 'var(--ds-warning)',
            display: 'grid', placeItems: 'center', margin: '0 auto 20px',
          }}>
            <AlertCircle size={32} />
          </div>
          <h2 style={{
            fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 500,
            letterSpacing: '-0.015em', margin: '0 0 12px', color: 'var(--fg-1)',
          }}>
            Lien invalide ou expire.
          </h2>
          <p style={{ fontSize: 15, color: 'var(--fg-2)', margin: '0 0 24px', lineHeight: 1.55 }}>
            {linkError}
          </p>
          <AppButton
            variant="primary"
            size="lg"
            href="/auth/forgot-password"
            style={{ width: '100%', justifyContent: 'center' }}
          >
            Demander un nouveau lien
          </AppButton>
          <p style={{ fontSize: 13, color: 'var(--fg-3)', marginTop: 16 }}>
            <Link href="/auth/login" style={{ color: 'var(--fg-link)' }}>
              <ArrowLeft size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />
              Retour a la connexion
            </Link>
          </p>
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
            Choisissez un nouveau mot de passe pour proteger vos bilans.
          </p>
          <p style={{ marginTop: 18, fontSize: 14, color: 'rgba(250,246,239,0.7)' }}>
            Vos donnees patients restent chiffrees a tout moment.
          </p>
        </div>
        <p style={{ fontSize: 13, color: 'rgba(250,246,239,0.5)', margin: 0 }}>
          Donnees chiffrees · RGPD · Secret medical
        </p>
      </div>

      <div style={{ display: 'grid', placeItems: 'center', padding: 32 }}>
        <form onSubmit={handleSubmit} style={{ width: '100%', maxWidth: 380 }}>
          <h1 style={{
            fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 500,
            letterSpacing: '-0.015em', margin: '0 0 8px', color: 'var(--fg-1)',
          }}>
            Nouveau mot de passe.
          </h1>
          <p style={{ fontSize: 15, color: 'var(--fg-2)', margin: '0 0 28px' }}>
            Minimum 8 caracteres. Choisissez quelque chose dont vous vous souviendrez.
          </p>

          {!ready && (
            <div style={{
              background: 'var(--bg-surface-2)', color: 'var(--fg-2)',
              padding: '10px 14px', borderRadius: 10,
              fontSize: 13, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <Loader2 className="animate-spin" size={14} />
              Verification du lien…
            </div>
          )}

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
            <div style={{ position: 'relative' }}>
              <AppInput
                label="Mot de passe"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 8 caracteres"
                style={{ paddingRight: 40 }}
                disabled={!ready}
              />
              <button
                type="button"
                onClick={() => setShowPassword(s => !s)}
                aria-label={showPassword ? 'Masquer' : 'Afficher'}
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
            <AppInput
              label="Confirmer le mot de passe"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              disabled={!ready}
            />

            <AppButton
              type="submit"
              variant="primary"
              size="lg"
              loading={loading}
              disabled={!ready || loading}
              style={{ width: '100%', justifyContent: 'center', marginTop: 6 }}
            >
              {loading ? 'Mise a jour…' : 'Mettre a jour mon mot de passe'}
            </AppButton>
          </div>

          <p style={{ fontSize: 13, color: 'var(--fg-3)', textAlign: 'center', marginTop: 18 }}>
            <Link href="/auth/login" style={{ color: 'var(--fg-link)' }}>
              <ArrowLeft size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />
              Retour a la connexion
            </Link>
          </p>
        </form>
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: 'var(--bg-canvas)' }}>
          <Loader2 className="animate-spin" size={28} style={{ color: 'var(--ds-primary)' }} />
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  )
}
