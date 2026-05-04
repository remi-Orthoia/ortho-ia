'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Eye, EyeOff, Loader2, CheckCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { AppButton, AppInput, Badge, Logo } from '@/components/ui'

function RegisterForm() {
  const searchParams = useSearchParams()
  const plan = searchParams.get('plan') || 'free'
  // Code de parrainage venant de /ref/[code] ou /auth/register?ref=[code].
  // On le normalise en majuscules + on retire les espaces/quotes pour
  // tolérer les copies-collées approximatives.
  const referralCode = (searchParams.get('ref') || '').trim().toUpperCase().slice(0, 32) || null

  const [formData, setFormData] = useState({
    email: '', password: '', confirmPassword: '',
    nom: '', prenom: '',
  })
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [referrerPrenom, setReferrerPrenom] = useState<string | null>(null)

  // Au mount : si on a un code de parrainage, on récupère le prénom du
  // parrain pour personnaliser l'écran ("Vous avez été parrainée par X 🌿").
  // RPC publique lookup_referrer_by_code — renvoie {prenom} ou rien si invalide.
  useEffect(() => {
    if (!referralCode) return
    const supabase = createClient()
    let cancelled = false
    supabase.rpc('lookup_referrer_by_code', { p_code: referralCode })
      .then(({ data }: { data: Array<{ prenom: string | null }> | null }) => {
        if (cancelled) return
        const prenom = data?.[0]?.prenom
        if (prenom) setReferrerPrenom(prenom)
      })
    return () => { cancelled = true }
  }, [referralCode])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (formData.password !== formData.confirmPassword) {
      setError('Les mots de passe ne correspondent pas')
      setLoading(false); return
    }
    if (formData.password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères')
      setLoading(false); return
    }
    if (!termsAccepted) {
      setError('Vous devez accepter les CGU et la politique de confidentialité')
      setLoading(false); return
    }

    try {
      const supabase = createClient()
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: { data: { nom: formData.nom, prenom: formData.prenom } },
      })
      if (signUpError) {
        setError(signUpError.message.includes('already registered')
          ? 'Cette adresse email est déjà utilisée'
          : signUpError.message)
        return
      }
      if (data.user) {
        // Génère le code de parrainage de la nouvelle ortho via RPC SQL
        // (LAURIE → "LAUR3942"). Si ça échoue (rare), on laisse à null —
        // un cron ultérieur pourra backfill.
        let myReferralCode: string | null = null
        try {
          const { data: codeData } = await supabase.rpc('generate_referral_code', {
            prenom: formData.prenom,
          })
          if (typeof codeData === 'string' && codeData.length > 0) {
            myReferralCode = codeData
          }
        } catch (e) {
          console.warn('referral_code generation failed:', e)
        }

        await supabase.from('profiles').insert({
          id: data.user.id,
          email: formData.email,
          nom: formData.nom,
          prenom: formData.prenom,
          referral_code: myReferralCode,
        })
        await supabase.from('subscriptions').insert({
          user_id: data.user.id,
          plan: 'free',
          status: 'active',
          crbo_count: 0,
          crbo_limit: 3,
        })

        // Si la nouvelle ortho s'inscrit via un code de parrainage, on
        // crée la relation referrals (status pending — passera en active
        // automatiquement via le trigger DB quand elle souscrira un plan
        // payant).
        if (referralCode) {
          try {
            const { data: refOwners } = await supabase
              .from('profiles')
              .select('id')
              .eq('referral_code', referralCode)
              .limit(1)
            const referrerId = refOwners?.[0]?.id
            if (referrerId && referrerId !== data.user.id) {
              await supabase.from('referrals').insert({
                referrer_id: referrerId,
                referred_id: data.user.id,
                referral_code: referralCode,
                status: 'pending',
              })
            }
          } catch (e) {
            // Best-effort — l'inscription réussit même si le referral échoue.
            console.warn('referral relation insert failed:', e)
          }
        }
      }
      setSuccess(true)
    } catch {
      setError('Une erreur est survenue. Veuillez réessayer.')
    } finally {
      setLoading(false)
    }
  }

  // ============ Écran de succès ============
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
            Compte créé.
          </h2>
          <p style={{ fontSize: 15, color: 'var(--fg-2)', margin: '0 0 24px', lineHeight: 1.55 }}>
            Vérifiez votre boîte mail pour confirmer votre adresse, puis connectez-vous.
          </p>
          <AppButton variant="primary" size="lg" href="/auth/login" style={{ width: '100%', justifyContent: 'center' }}>
            Aller à la connexion
          </AppButton>
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
          <Logo variant="dark" height={126} />
        </Link>
        <div>
          <p style={{
            fontFamily: 'var(--font-display)', fontSize: 'clamp(28px, 3.4vw, 40px)', fontWeight: 500,
            lineHeight: 1.15, letterSpacing: '-0.015em', margin: 0, textWrap: 'balance',
          }}>
            « En 3 mois, j&apos;ai récupéré 10 soirées et toute ma sérénité du jeudi soir. »
          </p>
          <p style={{ marginTop: 18, fontSize: 14, color: 'rgba(250,246,239,0.7)' }}>
            Camille L., orthophoniste libérale, Bordeaux
          </p>
        </div>
        <p style={{ fontSize: 13, color: 'rgba(250,246,239,0.5)', margin: 0 }}>
          3 CRBO offerts · Sans carte bancaire · Sans engagement
        </p>
      </div>

      <div style={{ display: 'grid', placeItems: 'center', padding: 32 }}>
        <form onSubmit={handleRegister} style={{ width: '100%', maxWidth: 420 }}>
          <h1 style={{
            fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 500,
            letterSpacing: '-0.015em', margin: '0 0 8px', color: 'var(--fg-1)',
          }}>
            Créer votre compte.
          </h1>
          <p style={{ fontSize: 15, color: 'var(--fg-2)', margin: '0 0 16px' }}>
            Vos 3 premiers CRBO sont offerts.
          </p>

          <div style={{ marginBottom: 18, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            <Badge tone={plan === 'pro' ? 'accent' : 'success'}>
              {plan === 'pro' ? '🚀 Essai Pro · 14 jours gratuits' : '✨ 3 CRBO gratuits inclus'}
            </Badge>
            {referralCode && (
              <Badge tone="primary">
                🌿 Parrainée
                {referrerPrenom ? <> par <strong style={{ marginLeft: 4 }}>{referrerPrenom}</strong></> : null}
                {' '}· 14,90€/mois au lieu de 19,90€
              </Badge>
            )}
          </div>

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
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <AppInput
                label="Prénom"
                name="prenom"
                required
                value={formData.prenom}
                onChange={handleChange}
                placeholder="Marie"
              />
              <AppInput
                label="Nom"
                name="nom"
                required
                value={formData.nom}
                onChange={handleChange}
                placeholder="Dupont"
              />
            </div>
            <AppInput
              label="Email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={formData.email}
              onChange={handleChange}
              placeholder="vous@exemple.com"
            />
            <div style={{ position: 'relative' }}>
              <AppInput
                label="Mot de passe"
                name="password"
                type={showPassword ? 'text' : 'password'}
                required
                value={formData.password}
                onChange={handleChange}
                placeholder="Minimum 8 caractères"
                style={{ paddingRight: 40 }}
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
              required
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="••••••••"
            />

            <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 13, color: 'var(--fg-2)', lineHeight: 1.5 }}>
              <input
                type="checkbox"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                style={{ marginTop: 3, accentColor: 'var(--ds-primary)' }}
              />
              <span>
                J&apos;accepte les{' '}
                <Link href="/cgu" target="_blank" style={{ color: 'var(--fg-link)' }}>conditions d&apos;utilisation</Link>
                {' '}et la{' '}
                <Link href="/confidentialite" target="_blank" style={{ color: 'var(--fg-link)' }}>politique de confidentialité</Link>.
                Je reconnais que les comptes-rendus générés sont des brouillons nécessitant une relecture clinique avant transmission.
              </span>
            </label>

            <AppButton
              type="submit"
              variant="primary"
              size="lg"
              loading={loading}
              style={{ width: '100%', justifyContent: 'center', marginTop: 6 }}
            >
              {loading ? 'Création du compte…' : 'Créer mon compte'}
            </AppButton>
          </div>

          <p style={{ fontSize: 13, color: 'var(--fg-3)', textAlign: 'center', marginTop: 18 }}>
            Déjà inscrit·e ? <Link href="/auth/login" style={{ color: 'var(--fg-link)' }}>Se connecter</Link>
          </p>
        </form>
      </div>
    </div>
  )
}

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: 'var(--bg-canvas)' }}>
        <Loader2 className="animate-spin" size={28} style={{ color: 'var(--ds-primary)' }} />
      </div>
    }>
      <RegisterForm />
    </Suspense>
  )
}
