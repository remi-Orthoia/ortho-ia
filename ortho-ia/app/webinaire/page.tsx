'use client'

import { useState, type FormEvent, type ReactNode } from 'react'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, CheckCircle, Loader2, Calendar, Clock, Video, X } from 'lucide-react'
import { Logo } from '@/components/ui'

/**
 * Landing page du webinaire de lancement Ortho.ia (début juillet 2026).
 *
 * Page autonome (header/footer minimaux, pas de header global du site) :
 * - Hero + 3 cartes "Ce que vous allez découvrir"
 * - 2 profils animateurs (Laurie + Rémi)
 * - Timeline programme
 * - FAQ 4 questions
 * - CTA final sur fond sauge sombre
 * - Modal d'inscription qui POST à /api/webinaire/subscribe
 *
 * Design : Direction A du design system (crème + sauge + terracotta).
 * Le ton est "pro mais chaleureux", aligné avec la landing principale.
 *
 * Métadonnées SEO dans app/webinaire/layout.tsx (la page est client component
 * à cause du modal, donc impossible d'exporter metadata directement ici).
 */

export default function WebinairePage() {
  const [modalOpen, setModalOpen] = useState(false)

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--bg-canvas)',
        color: 'var(--fg-1)',
        fontFamily: 'var(--font-body)',
      }}
    >
      <MinimalHeader />
      <main>
        <Hero onSubscribeClick={() => setModalOpen(true)} />
        <DiscoverSection />
        <AnimatorsSection />
        <ProgramSection />
        <WebinaireFAQ />
        <FinalCTA onSubscribeClick={() => setModalOpen(true)} />
      </main>
      <MinimalFooter />
      {modalOpen && <RegistrationModal onClose={() => setModalOpen(false)} />}
    </div>
  )
}

// ============================================================================
// Header / Footer minimaux
// ============================================================================

function MinimalHeader() {
  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        background: 'rgba(250, 246, 239, 0.85)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--border-ds)',
      }}
    >
      <Container
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: 72,
        }}
      >
        <Link
          href="/"
          aria-label="Ortho.ia — accueil"
          style={{ display: 'inline-flex', alignItems: 'center', textDecoration: 'none' }}
        >
          <Logo variant="light" height={42} withoutTagline />
        </Link>
        <Link
          href="/"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 14,
            fontWeight: 500,
            color: 'var(--fg-2)',
            textDecoration: 'none',
          }}
        >
          <ArrowLeft size={14} /> Retour au site
        </Link>
      </Container>
    </header>
  )
}

function MinimalFooter() {
  return (
    <footer
      style={{
        padding: '40px 0',
        borderTop: '1px solid var(--border-ds)',
        background: 'var(--bg-canvas)',
      }}
    >
      <Container
        style={{
          display: 'flex',
          justifyContent: 'center',
          fontSize: 13,
          color: 'var(--fg-3)',
          textAlign: 'center',
        }}
      >
        <p style={{ margin: 0 }}>
          Ortho.ia · <a href="mailto:contact@ortho-ia.fr" style={{ color: 'var(--fg-2)', textDecoration: 'underline' }}>contact@ortho-ia.fr</a> · Données protégées RGPD
        </p>
      </Container>
    </footer>
  )
}

// ============================================================================
// Hero
// ============================================================================

function Hero({ onSubscribeClick }: { onSubscribeClick: () => void }) {
  return (
    <section style={{ padding: '80px 0 96px', position: 'relative', overflow: 'hidden' }}>
      <Container style={{ maxWidth: 820, textAlign: 'center' }}>
        <Eyebrow accent>Webinaire gratuit — Inscription limitée</Eyebrow>
        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(36px, 5.5vw, 56px)',
            fontWeight: 500,
            lineHeight: 1.08,
            letterSpacing: '-0.02em',
            margin: '16px 0 20px',
            color: 'var(--fg-1)',
            textWrap: 'balance',
          }}
        >
          Rédigez vos CRBO en 2 minutes, on vous montre comment.
        </h1>
        <p
          style={{
            fontSize: 19,
            lineHeight: 1.55,
            color: 'var(--fg-2)',
            margin: '0 auto 32px',
            maxWidth: 680,
          }}
        >
          Un webinaire en direct d&apos;une heure pour découvrir Ortho.ia, poser
          vos questions, et repartir avec une offre exclusive réservée aux participantes.
        </p>

        {/* Métadonnées événement — bandeau pilule */}
        <div
          style={{
            display: 'inline-flex',
            flexWrap: 'wrap',
            gap: 8,
            justifyContent: 'center',
            marginBottom: 32,
          }}
        >
          <InfoPill icon={<Calendar size={14} />}>
            Début juillet 2026 — date exacte par email
          </InfoPill>
          <InfoPill icon={<Clock size={14} />}>1 heure</InfoPill>
          <InfoPill icon={<Video size={14} />}>En direct + replay</InfoPill>
        </div>

        <div>
          <button
            type="button"
            onClick={onSubscribeClick}
            style={{
              ...BTN_BASE,
              ...BTN_PRIMARY,
              padding: '16px 28px',
              fontSize: 16,
            }}
          >
            Je réserve ma place gratuitement <ArrowRight size={18} />
          </button>
        </div>
        <p style={{ marginTop: 14, fontSize: 13, color: 'var(--fg-3)' }}>
          Gratuit · Sans engagement · Offre exclusive à la fin
        </p>
      </Container>
    </section>
  )
}

// ============================================================================
// Section "Ce que vous allez découvrir"
// ============================================================================

function DiscoverSection() {
  const items = [
    {
      icon: '📋',
      title: 'La démo en live',
      body:
        "Nous vous montrons une génération de CRBO complet en temps réel, du bilan HappyNeuron au Word prêt à signer.",
    },
    {
      icon: '🎙',
      title: 'Des orthophonistes témoignent',
      body:
        "Vos consœurs qui utilisent Ortho.ia depuis la beta partagent leur expérience et répondent à vos questions.",
    },
    {
      icon: '🎁',
      title: 'Une offre exclusive',
      body:
        "Les participantes repartent avec une offre spéciale réservée au webinaire, non disponible ailleurs.",
    },
  ]
  return (
    <section style={{ padding: '96px 0', background: 'var(--bg-surface-2)' }}>
      <Container>
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <Eyebrow>Au programme</Eyebrow>
          <h2 style={H2_STYLE}>Ce que vous allez découvrir.</h2>
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 24,
          }}
        >
          {items.map((it) => (
            <div
              key={it.title}
              style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-ds)',
                borderRadius: 20,
                padding: 28,
              }}
            >
              <div style={{ fontSize: 36, marginBottom: 14 }}>{it.icon}</div>
              <h3
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 20,
                  fontWeight: 600,
                  margin: '0 0 10px',
                  color: 'var(--fg-1)',
                }}
              >
                {it.title}
              </h3>
              <p style={{ margin: 0, fontSize: 15, lineHeight: 1.55, color: 'var(--fg-2)' }}>
                {it.body}
              </p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  )
}

// ============================================================================
// Animateurs
// ============================================================================

function AnimatorsSection() {
  const animators = [
    {
      initials: 'LB',
      name: 'Laurie Berrio',
      role: 'Orthophoniste libérale, co-fondatrice clinique d\'Ortho.ia',
      quote: "J'ai conçu Ortho.ia pour qu'il rédige comme je le ferais moi-même.",
    },
    {
      initials: 'RB',
      name: 'Rémi Berrio',
      role: 'Fondateur & développeur d\'Ortho.ia',
      quote: null,
    },
  ]
  return (
    <section style={{ padding: '96px 0' }}>
      <Container style={{ maxWidth: 960 }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <Eyebrow>Qui anime</Eyebrow>
          <h2 style={H2_STYLE}>L&apos;équipe qui vous accueille.</h2>
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 28,
          }}
        >
          {animators.map((a) => (
            <div
              key={a.name}
              style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-ds)',
                borderRadius: 20,
                padding: 28,
                display: 'flex',
                flexDirection: 'column',
                gap: 14,
              }}
            >
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: '50%',
                  background: 'var(--ds-primary-soft)',
                  color: 'var(--ds-primary-hover)',
                  display: 'grid',
                  placeItems: 'center',
                  fontFamily: 'var(--font-display)',
                  fontWeight: 600,
                  fontSize: 22,
                }}
              >
                {a.initials}
              </div>
              <div>
                <h3
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 20,
                    fontWeight: 600,
                    margin: '0 0 4px',
                    color: 'var(--fg-1)',
                  }}
                >
                  {a.name}
                </h3>
                <p style={{ margin: 0, fontSize: 14, color: 'var(--fg-3)' }}>{a.role}</p>
              </div>
              {a.quote && (
                <p
                  style={{
                    margin: 0,
                    fontSize: 16,
                    lineHeight: 1.55,
                    color: 'var(--fg-2)',
                    fontStyle: 'italic',
                    borderLeft: '3px solid var(--ds-accent)',
                    paddingLeft: 14,
                  }}
                >
                  &laquo; {a.quote} &raquo;
                </p>
              )}
            </div>
          ))}
        </div>
      </Container>
    </section>
  )
}

// ============================================================================
// Programme (timeline)
// ============================================================================

function ProgramSection() {
  const steps = [
    { time: '0:00', title: 'Introduction & démo live d\'Ortho.ia' },
    { time: '0:20', title: 'Témoignages d\'orthophonistes beta' },
    { time: '0:40', title: 'Questions / Réponses' },
    { time: '0:50', title: 'Offre exclusive participantes' },
  ]
  return (
    <section style={{ padding: '96px 0', background: 'var(--bg-surface-2)' }}>
      <Container style={{ maxWidth: 720 }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <Eyebrow>Une heure, bien remplie</Eyebrow>
          <h2 style={H2_STYLE}>Le déroulé.</h2>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {steps.map((s, idx) => (
            <div
              key={s.time}
              style={{
                display: 'grid',
                gridTemplateColumns: '80px 1fr',
                gap: 24,
                alignItems: 'flex-start',
                padding: '20px 0',
                borderBottom: idx < steps.length - 1 ? '1px solid var(--border-ds)' : 'none',
              }}
            >
              <div
                style={{
                  fontFamily: 'var(--font-mono, monospace)',
                  fontSize: 16,
                  fontWeight: 600,
                  color: 'var(--ds-primary)',
                  padding: '4px 0',
                }}
              >
                {s.time}
              </div>
              <div
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 18,
                  fontWeight: 500,
                  color: 'var(--fg-1)',
                  lineHeight: 1.45,
                }}
              >
                {s.title}
              </div>
            </div>
          ))}
        </div>
      </Container>
    </section>
  )
}

// ============================================================================
// FAQ
// ============================================================================

function WebinaireFAQ() {
  const items: Array<{ q: string; a: ReactNode }> = [
    {
      q: 'Faut-il avoir un compte Ortho.ia pour participer ?',
      a: 'Non, le webinaire est ouvert à toutes les orthophonistes libérales.',
    },
    {
      q: 'Y aura-t-il un replay ?',
      a: 'Oui, envoyé par email à toutes les inscrites dans les 24h suivant le webinaire.',
    },
    {
      q: 'C\'est vraiment gratuit ?',
      a: 'Totalement gratuit, sans carte bancaire.',
    },
    {
      q: 'Combien de places disponibles ?',
      a: 'Places limitées pour garantir la qualité des échanges. Inscrivez-vous dès maintenant.',
    },
  ]
  return (
    <section style={{ padding: '96px 0' }}>
      <Container style={{ maxWidth: 720 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Eyebrow>Vos questions</Eyebrow>
          <h2 style={H2_STYLE}>On répond avant que vous demandiez.</h2>
        </div>
        {items.map((it, idx) => (
          <FAQItem key={idx} q={it.q} a={it.a} />
        ))}
      </Container>
    </section>
  )
}

function FAQItem({ q, a }: { q: string; a: ReactNode }) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{ borderBottom: '1px solid var(--border-ds)', padding: '20px 0' }}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        style={{
          background: 'none',
          border: 0,
          padding: 0,
          width: '100%',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          cursor: 'pointer',
          textAlign: 'left',
          gap: 24,
        }}
      >
        <span
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 18,
            fontWeight: 600,
            color: 'var(--fg-1)',
          }}
        >
          {q}
        </span>
        <span
          style={{
            fontSize: 22,
            color: 'var(--fg-3)',
            transform: open ? 'rotate(45deg)' : 'none',
            transition: 'transform 180ms',
            flex: '0 0 auto',
          }}
        >
          +
        </span>
      </button>
      {open && (
        <div
          style={{
            fontSize: 15,
            lineHeight: 1.6,
            color: 'var(--fg-2)',
            margin: '14px 0 0',
            maxWidth: 640,
          }}
        >
          {typeof a === 'string' ? <p style={{ margin: 0 }}>{a}</p> : a}
        </div>
      )}
    </div>
  )
}

// ============================================================================
// CTA final
// ============================================================================

function FinalCTA({ onSubscribeClick }: { onSubscribeClick: () => void }) {
  return (
    <section
      style={{
        padding: '96px 0',
        background: 'var(--bg-inverse)',
        color: 'var(--fg-on-brand)',
      }}
    >
      <Container style={{ maxWidth: 720, textAlign: 'center' }}>
        <h2
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(28px, 4vw, 40px)',
            fontWeight: 500,
            lineHeight: 1.15,
            letterSpacing: '-0.015em',
            margin: '0 0 16px',
            color: 'var(--fg-on-brand)',
            textWrap: 'balance',
          }}
        >
          Votre prochain CRBO pourrait prendre 2 minutes.
        </h2>
        <p
          style={{
            fontSize: 17,
            lineHeight: 1.55,
            color: 'var(--brand-sage-300, #A8BBB1)',
            margin: '0 auto 32px',
            maxWidth: 560,
          }}
        >
          Rejoignez les orthophonistes qui ont décidé de reprendre leur temps.
        </p>
        <button
          type="button"
          onClick={onSubscribeClick}
          style={{
            ...BTN_BASE,
            ...BTN_ACCENT,
            padding: '16px 28px',
            fontSize: 16,
          }}
        >
          Je réserve ma place <ArrowRight size={18} />
        </button>
        <p
          style={{
            marginTop: 14,
            fontSize: 13,
            color: 'var(--brand-sage-300, #A8BBB1)',
          }}
        >
          Gratuit · 1 heure · Début juillet 2026
        </p>
      </Container>
    </section>
  )
}

// ============================================================================
// Modal d'inscription
// ============================================================================

function RegistrationModal({ onClose }: { onClose: () => void }) {
  const [prenom, setPrenom] = useState('')
  const [email, setEmail] = useState('')
  const [ville, setVille] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [alreadyRegistered, setAlreadyRegistered] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!prenom.trim()) {
      setError('Merci d\'indiquer votre prénom.')
      return
    }
    if (!email.trim()) {
      setError('Merci d\'indiquer votre email professionnel.')
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch('/api/webinaire/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prenom, email, ville }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data?.error || 'Une erreur est survenue. Réessayez.')
        return
      }
      setSuccess(true)
      setAlreadyRegistered(!!data.alreadyRegistered)
    } catch {
      setError('Erreur réseau. Réessayez ou écrivez à contact@ortho-ia.fr')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        background: 'rgba(31, 42, 42, 0.55)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: 480,
          width: '100%',
          background: 'var(--bg-surface)',
          borderRadius: 20,
          padding: 32,
          boxShadow: '0 30px 60px -30px rgba(31, 42, 42, 0.35)',
          position: 'relative',
        }}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Fermer"
          style={{
            position: 'absolute',
            top: 12,
            right: 12,
            background: 'transparent',
            border: 0,
            padding: 8,
            cursor: 'pointer',
            color: 'var(--fg-3)',
            display: 'grid',
            placeItems: 'center',
            borderRadius: 999,
          }}
        >
          <X size={18} />
        </button>

        {success ? (
          <div style={{ textAlign: 'center', padding: '12px 0' }}>
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: '50%',
                background: 'var(--ds-success-soft)',
                color: 'var(--ds-success)',
                display: 'grid',
                placeItems: 'center',
                margin: '0 auto 16px',
              }}
            >
              <CheckCircle size={28} />
            </div>
            <h3
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 22,
                fontWeight: 600,
                margin: '0 0 10px',
                color: 'var(--fg-1)',
              }}
            >
              {alreadyRegistered ? 'Vous êtes déjà inscrite !' : "C'est noté !"}
            </h3>
            <p
              style={{
                margin: 0,
                fontSize: 15,
                lineHeight: 1.55,
                color: 'var(--fg-2)',
              }}
            >
              {alreadyRegistered
                ? 'Pas d\'inquiétude, votre place est confirmée. Vous recevrez la date exacte et le lien par email.'
                : 'Vous recevrez la date exacte et le lien de connexion par email avant le webinaire.'}
            </p>
            <button
              type="button"
              onClick={onClose}
              style={{
                ...BTN_BASE,
                ...BTN_SECONDARY,
                marginTop: 24,
                padding: '12px 20px',
                fontSize: 15,
              }}
            >
              Fermer
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <h3
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 22,
                fontWeight: 600,
                margin: '0 0 8px',
                color: 'var(--fg-1)',
              }}
            >
              Réservez votre place
            </h3>
            <p style={{ margin: '0 0 22px', fontSize: 14, color: 'var(--fg-3)' }}>
              Gratuit · 1 heure · Début juillet 2026
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <FormField
                label="Prénom"
                value={prenom}
                onChange={setPrenom}
                required
                autoFocus
              />
              <FormField
                label="Email professionnel"
                type="email"
                value={email}
                onChange={setEmail}
                required
              />
              <FormField
                label="Ville (optionnel)"
                value={ville}
                onChange={setVille}
              />
            </div>

            {error && (
              <p
                role="alert"
                style={{
                  marginTop: 14,
                  padding: '10px 12px',
                  background: 'var(--ds-danger-soft, #F2D6CD)',
                  color: 'var(--ds-danger, #B7503D)',
                  borderRadius: 10,
                  fontSize: 13,
                  lineHeight: 1.5,
                }}
              >
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              style={{
                ...BTN_BASE,
                ...BTN_PRIMARY,
                marginTop: 22,
                padding: '14px 24px',
                fontSize: 15,
                width: '100%',
                justifyContent: 'center',
                opacity: submitting ? 0.7 : 1,
                cursor: submitting ? 'not-allowed' : 'pointer',
              }}
            >
              {submitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Inscription...
                </>
              ) : (
                <>
                  Je m&apos;inscris <ArrowRight size={16} />
                </>
              )}
            </button>
            <p
              style={{
                marginTop: 12,
                fontSize: 12,
                color: 'var(--fg-3)',
                lineHeight: 1.45,
                textAlign: 'center',
              }}
            >
              Vos données restent confidentielles, jamais cédées à des tiers. Désinscription en 1 clic dans nos emails.
            </p>
          </form>
        )}
      </div>
    </div>
  )
}

// ============================================================================
// Primitives locales — Container, Eyebrow, InfoPill, FormField
// ============================================================================

const H2_STYLE = {
  fontFamily: 'var(--font-display)',
  fontSize: 'clamp(28px, 4vw, 40px)',
  fontWeight: 500,
  lineHeight: 1.15,
  letterSpacing: '-0.015em',
  margin: '12px 0 0',
  color: 'var(--fg-1)',
  textWrap: 'balance' as const,
}

function Container({ children, style }: { children: ReactNode; style?: React.CSSProperties }) {
  return <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', ...style }}>{children}</div>
}

function Eyebrow({ children, accent }: { children: ReactNode; accent?: boolean }) {
  return (
    <span
      style={{
        display: 'inline-block',
        fontFamily: 'var(--font-body)',
        fontSize: 12,
        fontWeight: 600,
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        color: accent ? 'var(--ds-accent-hover)' : 'var(--fg-2)',
        padding: accent ? '6px 12px' : 0,
        background: accent ? 'var(--ds-accent-soft)' : 'transparent',
        borderRadius: accent ? 999 : 0,
      }}
    >
      {children}
    </span>
  )
}

function InfoPill({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '6px 14px',
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-ds)',
        borderRadius: 999,
        fontSize: 13,
        color: 'var(--fg-2)',
        fontWeight: 500,
      }}
    >
      {icon}
      {children}
    </span>
  )
}

function FormField({
  label,
  value,
  onChange,
  type = 'text',
  required,
  autoFocus,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  type?: string
  required?: boolean
  autoFocus?: boolean
}) {
  return (
    <label style={{ display: 'block' }}>
      <span
        style={{
          display: 'block',
          fontSize: 12,
          fontWeight: 600,
          color: 'var(--fg-2)',
          marginBottom: 6,
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
        }}
      >
        {label}
        {required && <span style={{ color: 'var(--ds-accent)' }}> *</span>}
      </span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        autoFocus={autoFocus}
        style={{
          width: '100%',
          padding: '12px 14px',
          background: 'var(--bg-canvas)',
          border: '1px solid var(--border-ds-strong)',
          borderRadius: 12,
          fontSize: 15,
          fontFamily: 'var(--font-body)',
          color: 'var(--fg-1)',
          outline: 'none',
        }}
      />
    </label>
  )
}

// ============================================================================
// Boutons (styles inline pour éviter de toucher au design system global)
// ============================================================================

const BTN_BASE: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  border: 0,
  borderRadius: 999,
  cursor: 'pointer',
  fontFamily: 'var(--font-body)',
  fontWeight: 500,
  lineHeight: 1,
  transition: 'background 180ms cubic-bezier(0.32,0.72,0,1), transform 120ms',
  textDecoration: 'none',
}

const BTN_PRIMARY: React.CSSProperties = {
  background: 'var(--ds-primary)',
  color: 'var(--fg-on-brand)',
}

const BTN_ACCENT: React.CSSProperties = {
  background: 'var(--ds-accent)',
  color: 'var(--brand-sage-900, #1F2A2A)',
}

const BTN_SECONDARY: React.CSSProperties = {
  background: 'var(--bg-surface)',
  color: 'var(--fg-1)',
  border: '1px solid var(--border-ds-strong)',
}
