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
        className="fixed bottom-6 right-6 z-40 h-12 rounded-full bg-primary-600 hover:bg-primary-700 text-white shadow-card-lg hover:shadow-xl transition-all duration-200 hover:scale-105 flex items-center justify-center gap-2 px-3 sm:px-4 group"
        aria-label="Envoyer un feedback"
        title="Un retour pour nous améliorer ?"
      >
        <MessageCircle size={18} />
        <span className="text-sm font-medium hidden sm:inline">Feedback</span>
      </button>

      {/* Modal */}
      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-4 animate-fade-in"
          onClick={() => !submitting && setOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="card-lifted max-w-md w-full p-6 animate-scale-in"
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                  {sent ? 'Merci 🙌' : 'Un retour sur Ortho.ia ?'}
                </h3>
                {!sent && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                    Bug, suggestion, ou juste un mot : chaque retour compte.
                  </p>
                )}
              </div>
              <button
                onClick={() => setOpen(false)}
                disabled={submitting}
                className="p-1 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 rounded"
                aria-label="Fermer"
              >
                <X size={18} />
              </button>
            </div>

            {sent ? (
              <div className="py-6 text-center">
                <div className="w-12 h-12 mx-auto rounded-full bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center mb-3">
                  <Check className="text-primary-600 dark:text-primary-400" size={24} />
                </div>
                <p className="text-gray-700 dark:text-gray-300">
                  Retour bien reçu. Nous vous tiendrons au courant s&apos;il s&apos;agit d&apos;un bug.
                </p>
              </div>
            ) : (
              <>
                {/* Type selector */}
                <div className="grid grid-cols-4 gap-2 mb-4">
                  {[
                    { t: 'bug' as const,     label: 'Bug',     icon: Bug,       color: 'red' },
                    { t: 'feature' as const, label: 'Idée',    icon: Lightbulb, color: 'amber' },
                    { t: 'praise' as const,  label: 'Merci',   icon: Heart,     color: 'pink' },
                    { t: 'other' as const,   label: 'Autre',   icon: MessageCircle, color: 'gray' },
                  ].map(({ t, label, icon: Icon }) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setType(t)}
                      className={`p-2.5 rounded-lg border transition text-xs font-medium flex flex-col items-center gap-1 ${
                        type === t
                          ? 'bg-primary-50 dark:bg-primary-900/30 border-primary-300 dark:border-primary-700 text-primary-700 dark:text-primary-300'
                          : 'bg-white dark:bg-surface-dark-subtle border-gray-200 dark:border-surface-dark-muted text-gray-600 dark:text-gray-400 hover:border-gray-300'
                      }`}
                    >
                      <Icon size={16} />
                      {label}
                    </button>
                  ))}
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
                  className="textarea-modern"
                  autoFocus
                />

                <div className="mt-4 flex items-center justify-between gap-2">
                  <p className="text-xs text-gray-500 dark:text-gray-500">
                    {message.length}/1000 caractères
                  </p>
                  <button
                    onClick={handleSubmit}
                    disabled={submitting || !message.trim() || message.length > 1000}
                    className="btn-primary text-sm"
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
