'use client'

import { useState } from 'react'
import { MessageCircle, X, Loader2, Check, Bug, Lightbulb, Heart } from 'lucide-react'
import { createClient } from '@/lib/supabase'

/**
 * Bouton flottant en bas à droite du dashboard → ouvre une modal
 * avec type + message libre. Envoie dans la table feedbacks.
 */

type FeedbackType = 'bug' | 'feature' | 'praise' | 'other'

export default function FeedbackButton() {
  const [open, setOpen] = useState(false)
  const [type, setType] = useState<FeedbackType>('other')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async () => {
    if (!message.trim()) return
    setSubmitting(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      await supabase.from('feedbacks').insert({
        user_id: user?.id ?? null,
        type,
        message: message.trim(),
        url: typeof window !== 'undefined' ? window.location.pathname : null,
        user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
      })
      setSent(true)
      setTimeout(() => {
        setOpen(false)
        setSent(false)
        setMessage('')
        setType('other')
      }, 2000)
    } catch (err) {
      console.error('Feedback error:', err)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      {/* Floating button — pilule desktop avec label, rond compact sur mobile */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex items-center justify-center gap-2"
        aria-label="Envoyer un feedback"
        title="Un retour pour nous améliorer ?"
        style={{
          height: 48,
          padding: '0 16px',
          borderRadius: 999,
          background: 'var(--ds-primary)',
          color: 'var(--fg-on-brand)',
          border: 0,
          fontFamily: 'var(--font-body)',
          boxShadow: 'var(--shadow-md)',
          transition: 'background 180ms, box-shadow 180ms, transform 180ms',
          cursor: 'pointer',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'var(--ds-primary-hover)'
          e.currentTarget.style.boxShadow = 'var(--shadow-lg)'
          e.currentTarget.style.transform = 'scale(1.05)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'var(--ds-primary)'
          e.currentTarget.style.boxShadow = 'var(--shadow-md)'
          e.currentTarget.style.transform = 'scale(1)'
        }}
      >
        <MessageCircle size={18} />
        <span className="text-sm hidden sm:inline" style={{ fontWeight: 500 }}>Feedback</span>
      </button>

      {/* Modal */}
      {open && (
        <div
          className="fixed inset-0 z-50 backdrop-blur-sm flex items-end sm:items-center justify-center p-4 animate-fade-in"
          onClick={() => !submitting && setOpen(false)}
          style={{
            background: 'color-mix(in srgb, var(--bg-inverse) 50%, transparent)',
            fontFamily: 'var(--font-body)',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="max-w-md w-full animate-scale-in"
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-ds)',
              borderRadius: 'var(--radius-lg)',
              padding: 24,
              boxShadow: 'var(--shadow-lg)',
            }}
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 18, fontWeight: 600,
                    color: 'var(--fg-1)',
                  }}
                >
                  {sent ? 'Merci 🙌' : 'Un retour sur Ortho.ia ?'}
                </h3>
                {!sent && (
                  <p style={{ fontSize: 14, color: 'var(--fg-3)', marginTop: 2 }}>
                    Bug, suggestion, ou juste un mot : chaque retour compte.
                  </p>
                )}
              </div>
              <button
                onClick={() => setOpen(false)}
                disabled={submitting}
                aria-label="Fermer"
                style={{
                  padding: 4,
                  background: 'transparent',
                  color: 'var(--fg-3)',
                  border: 0,
                  borderRadius: 'var(--radius-sm)',
                  cursor: 'pointer',
                  transition: 'color 180ms',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--fg-1)')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--fg-3)')}
              >
                <X size={18} />
              </button>
            </div>

            {sent ? (
              <div className="py-6 text-center">
                <div
                  style={{
                    width: 48, height: 48, borderRadius: 999,
                    background: 'var(--ds-primary-soft)',
                    color: 'var(--ds-primary)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 12px',
                  }}
                >
                  <Check size={24} />
                </div>
                <p style={{ color: 'var(--fg-2)' }}>
                  Retour bien reçu. Nous vous tiendrons au courant s&apos;il s&apos;agit d&apos;un bug.
                </p>
              </div>
            ) : (
              <>
                {/* Type selector */}
                <div className="grid grid-cols-4 gap-2 mb-4">
                  {[
                    { t: 'bug' as const,     label: 'Bug',     icon: Bug },
                    { t: 'feature' as const, label: 'Idée',    icon: Lightbulb },
                    { t: 'praise' as const,  label: 'Merci',   icon: Heart },
                    { t: 'other' as const,   label: 'Autre',   icon: MessageCircle },
                  ].map(({ t, label, icon: Icon }) => {
                    const active = type === t
                    return (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setType(t)}
                        className="flex flex-col items-center gap-1"
                        style={{
                          padding: 10,
                          borderRadius: 'var(--radius-md)',
                          border: `1px solid ${active ? 'color-mix(in srgb, var(--ds-primary) 50%, transparent)' : 'var(--border-ds)'}`,
                          background: active ? 'var(--ds-primary-soft)' : 'var(--bg-surface)',
                          color: active ? 'var(--ds-primary-hover)' : 'var(--fg-2)',
                          fontFamily: 'var(--font-body)',
                          fontSize: 12, fontWeight: 500,
                          cursor: 'pointer',
                          transition: 'all 180ms',
                        }}
                      >
                        <Icon size={16} />
                        {label}
                      </button>
                    )
                  })}
                </div>

                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={
                    type === 'bug'
                      ? "Décrivez ce qui s'est passé… (URL ou capture d'écran bienvenus)"
                      : type === 'feature'
                      ? "Qu'aimeriez-vous voir arriver dans Ortho.ia ?"
                      : type === 'praise'
                      ? 'On adore vous lire !'
                      : 'Dites-nous tout…'
                  }
                  rows={5}
                  autoFocus
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-ds-strong)',
                    borderRadius: 'var(--radius-md)',
                    fontFamily: 'var(--font-body)',
                    fontSize: 15,
                    lineHeight: 1.55,
                    color: 'var(--fg-1)',
                    outline: 'none',
                    resize: 'none',
                  }}
                />

                <div className="mt-4 flex items-center justify-between gap-2">
                  <p style={{ fontSize: 12, color: 'var(--fg-3)' }}>
                    {message.length}/1000 caractères
                  </p>
                  <button
                    onClick={handleSubmit}
                    disabled={submitting || !message.trim() || message.length > 1000}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 6,
                      padding: '8px 16px',
                      background: 'var(--ds-primary)',
                      color: 'var(--fg-on-brand)',
                      border: 0,
                      borderRadius: 'var(--radius-pill)',
                      fontFamily: 'var(--font-body)',
                      fontSize: 14, fontWeight: 500,
                      cursor: (submitting || !message.trim() || message.length > 1000) ? 'not-allowed' : 'pointer',
                      opacity: (submitting || !message.trim() || message.length > 1000) ? 0.6 : 1,
                      transition: 'background 180ms',
                    }}
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="animate-spin" size={14} />
                        Envoi…
                      </>
                    ) : (
                      'Envoyer'
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}
