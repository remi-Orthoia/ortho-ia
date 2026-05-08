'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { ArrowLeft, Sparkles, CheckCircle, Loader2 } from 'lucide-react'
import { AppButton } from '@/components/ui'

export default function BetaPage() {
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({
    nom: '',
    email: '',
    ville: '',
    tests_principaux: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!form.nom.trim() || !form.email.trim()) {
      setError('Merci de renseigner votre nom et votre email.')
      return
    }
    setSubmitting(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.from('beta_signups').insert({
        nom: form.nom.trim(),
        email: form.email.trim().toLowerCase(),
        ville: form.ville.trim() || null,
        tests_principaux: form.tests_principaux.trim() || null,
      })
      if (error) {
        if (error.message?.includes('duplicate')) {
          setError('Cet email est déjà inscrit sur la liste beta — on vous contactera très bientôt.')
        } else {
          setError('Une erreur est survenue. Réessayez ou écrivez à remi.berrio@gmail.com')
        }
        return
      }
      setSuccess(true)
    } catch {
      setError('Erreur réseau — réessayez.')
    } finally {
      setSubmitting(false)
    }
  }

  // Gradient soft sage→cream→terracotta typique de la palette Stéphanie
  const pageBg = `
    radial-gradient(ellipse at 0% 0%, var(--ds-primary-soft) 0%, transparent 55%),
    radial-gradient(ellipse at 100% 100%, var(--ds-accent-soft) 0%, transparent 55%),
    var(--bg-canvas)
  `

  if (success) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: pageBg,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 16,
          fontFamily: 'var(--font-body)', color: 'var(--fg-1)',
        }}
      >
        <div
          style={{
            maxWidth: 520, width: '100%',
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
              background: 'var(--ds-primary-soft)', color: 'var(--ds-primary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 20px',
            }}
          >
            <CheckCircle size={32} />
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 500, letterSpacing: '-0.01em', color: 'var(--fg-1)' }}>
            Merci pour votre inscription 🙌
          </h1>
          <p style={{ marginTop: 12, color: 'var(--fg-2)', lineHeight: 1.6 }}>
            Vous êtes sur la liste des beta testeurs. Nous vous enverrons vos identifiants
            d&apos;accès dans les 48 heures. Surveillez votre boîte mail (pensez à vérifier les
            spams).
          </p>
          <p style={{ marginTop: 16, fontSize: 14, color: 'var(--fg-3)' }}>
            Les <strong>3 premiers mois sont offerts</strong> pour les beta testeurs.
          </p>
          <div style={{ marginTop: 24 }}>
            <AppButton href="/" variant="primary" icon={<ArrowLeft size={16} />}>
              Retour à l&apos;accueil
            </AppButton>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: pageBg,
        padding: '48px 16px',
        fontFamily: 'var(--font-body)', color: 'var(--fg-1)',
      }}
    >
      <div className="max-w-2xl mx-auto">
        <Link
          href="/"
          className="inline-flex items-center gap-2"
          style={{ color: 'var(--fg-2)', textDecoration: 'none', fontSize: 14, marginBottom: 24 }}
        >
          <ArrowLeft size={16} />
          Retour à l&apos;accueil
        </Link>

        <div
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-ds)',
            borderRadius: 'var(--radius-lg)',
            padding: '40px 28px',
            boxShadow: 'var(--shadow-lg)',
          }}
        >
          <div
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              color: 'var(--ds-primary-hover)',
              fontSize: 12, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase',
            }}
          >
            <Sparkles size={14} />
            Beta fermée — Accès gratuit 3 mois
          </div>
          <h1
            style={{
              marginTop: 12,
              fontFamily: 'var(--font-display)', fontSize: 'clamp(28px, 4vw, 38px)',
              fontWeight: 500, letterSpacing: '-0.015em', color: 'var(--fg-1)',
            }}
          >
            Rejoignez la beta Ortho.ia
          </h1>
          <p style={{ marginTop: 12, color: 'var(--fg-2)', lineHeight: 1.6 }}>
            Vous êtes orthophoniste diplômé·e et vous voulez tester l&apos;outil qui transforme
            vos bilans Exalang, Examath, MoCA ou BETL en CRBO professionnels en 20 secondes ?
            Inscrivez-vous : <strong>accès gratuit illimité pendant 3 mois</strong>, en échange
            de vos retours réguliers sur le produit.
          </p>

          <form onSubmit={handleSubmit} style={{ marginTop: 32, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Nom et prénom *" required>
                <input
                  type="text"
                  value={form.nom}
                  onChange={(e) => setForm({ ...form, nom: e.target.value })}
                  placeholder="Marie Durand"
                  autoComplete="name"
                  style={inputStyle}
                />
              </Field>
              <Field label="Email *" required>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="vous@exemple.fr"
                  autoComplete="email"
                  style={inputStyle}
                />
              </Field>
            </div>

            <Field label="Ville d'exercice">
              <input
                type="text"
                value={form.ville}
                onChange={(e) => setForm({ ...form, ville: e.target.value })}
                placeholder="Lyon, Paris, Marseille…"
                style={inputStyle}
              />
            </Field>

            <Field label="Tests que vous utilisez principalement">
              <textarea
                value={form.tests_principaux}
                onChange={(e) => setForm({ ...form, tests_principaux: e.target.value })}
                placeholder="Ex : Exalang 8-11, Examath, BALE, ELO, MoCA…"
                rows={2}
                style={{ ...inputStyle, resize: 'none', lineHeight: 1.55 }}
              />
              <p style={{ marginTop: 4, fontSize: 12, color: 'var(--fg-3)' }}>
                Nous priorisons les profils qui utilisent les tests déjà supportés par l&apos;outil
              </p>
            </Field>

            {error && (
              <div
                style={{
                  background: 'var(--ds-danger-soft)',
                  border: '1px solid color-mix(in srgb, var(--ds-danger) 30%, transparent)',
                  color: 'var(--ds-danger)',
                  padding: '12px 16px',
                  borderRadius: 'var(--radius-md)',
                  fontSize: 14,
                }}
              >
                {error}
              </div>
            )}

            <div
              style={{
                paddingTop: 8,
                display: 'flex', flexDirection: 'column', gap: 12,
                alignItems: 'flex-start',
              }}
            >
              <AppButton
                type="submit"
                variant="primary"
                size="lg"
                disabled={submitting}
                loading={submitting}
                icon={!submitting ? <Sparkles size={16} /> : undefined}
              >
                {submitting ? 'Envoi en cours…' : 'Rejoindre la beta'}
              </AppButton>
              <p style={{ fontSize: 12, color: 'var(--fg-3)' }}>
                Pas de carte bancaire · réponse sous 48h · données chiffrées
              </p>
            </div>
          </form>

          <div
            style={{
              marginTop: 32, paddingTop: 24,
              borderTop: '1px solid var(--border-ds)',
              fontSize: 14, color: 'var(--fg-3)',
            }}
          >
            <p>En nous rejoignant, vous acceptez de recevoir nos emails liés au produit.</p>
            <p style={{ marginTop: 4 }}>
              Consultez notre{' '}
              <Link href="/confidentialite" style={{ color: 'var(--fg-link)', textDecoration: 'underline' }}>
                politique de confidentialité
              </Link>{' '}
              et nos{' '}
              <Link href="/cgu" style={{ color: 'var(--fg-link)', textDecoration: 'underline' }}>
                CGU
              </Link>
              . Désinscription possible à tout moment.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '12px 14px',
  background: 'var(--bg-surface)',
  border: '1px solid var(--border-ds-strong)',
  borderRadius: 'var(--radius-md)',
  fontFamily: 'var(--font-body)',
  fontSize: 15,
  color: 'var(--fg-1)',
  outline: 'none',
  transition: 'border-color 180ms, box-shadow 180ms',
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label style={{ display: 'block' }}>
      <span
        style={{
          display: 'block', fontSize: 14, fontWeight: 500,
          color: 'var(--fg-2)', marginBottom: 6,
        }}
      >
        {label}
        {required && <span style={{ color: 'var(--ds-danger)', marginLeft: 2 }}>*</span>}
      </span>
      {children}
    </label>
  )
}
