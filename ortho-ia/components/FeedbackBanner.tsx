'use client'

/**
 * Bandeau discret affiché APRÈS téléchargement du Word, demandant à l'ortho
 * son retour sur la qualité du draft IA.
 *
 * Pas une modale bloquante — un panneau qui s'insère dans le flux naturel,
 * dismissable, persisté en localStorage pour ne pas réapparaître sur le même
 * CRBO.
 *
 * Collecte :
 *   - 5 étoiles (qualite_score 1-5)
 *   - corrections texte libre (≤ 1000 chars)
 *   - sections modifiées (multi-checkbox)
 *
 * Envoie vers /api/feedbacks. Si score ≤ 3 + corrections → le serveur copie
 * aussi dans bilan_references pour servir d'exemple négatif→positif au
 * few-shot. La beta capture ainsi du signal calibrage à chaque CRBO.
 */

import { useEffect, useState } from 'react'
import { Star, Send, X, CheckCircle2, Loader2 } from 'lucide-react'
import { useToast } from './Toast'

const SECTIONS: Array<{ id: string; label: string }> = [
  { id: 'anamnese',     label: 'Anamnèse' },
  { id: 'diagnostic',   label: 'Diagnostic' },
  { id: 'amenagements', label: 'Aménagements / PAP' },
  { id: 'observations', label: 'Observations cliniques par domaine' },
  { id: 'autre',        label: 'Autre' },
]

const DISMISSED_KEY = 'orthoia.feedback-dismissed'

function isDismissed(crboId: string): boolean {
  if (typeof window === 'undefined') return false
  try {
    const raw = localStorage.getItem(DISMISSED_KEY)
    if (!raw) return false
    const list = JSON.parse(raw) as string[]
    return Array.isArray(list) && list.includes(crboId)
  } catch {
    return false
  }
}

function markDismissed(crboId: string) {
  if (typeof window === 'undefined') return
  try {
    const raw = localStorage.getItem(DISMISSED_KEY)
    const list: string[] = raw ? JSON.parse(raw) : []
    if (!Array.isArray(list)) return
    if (!list.includes(crboId)) list.push(crboId)
    // Cap à 200 entrées — suffit pour ne pas re-spammer, et reste léger.
    localStorage.setItem(DISMISSED_KEY, JSON.stringify(list.slice(-200)))
  } catch {}
}

interface Props {
  /** ID du CRBO à noter. Le bandeau n'apparaît pas si null/absent. */
  crboId: string | null
}

export default function FeedbackBanner({ crboId }: Props) {
  const toast = useToast()
  const [visible, setVisible] = useState(false)
  const [score, setScore] = useState<number | null>(null)
  const [hoverScore, setHoverScore] = useState<number | null>(null)
  const [modifications, setModifications] = useState('')
  const [sections, setSections] = useState<Set<string>>(new Set())
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    if (!crboId) return
    if (isDismissed(crboId)) return
    // Petit délai pour ne pas s'afficher AVANT que l'utilisateur ait
    // reçu son Word (apparaît ~1.5s après le déclenchement du download).
    const t = setTimeout(() => setVisible(true), 1800)
    return () => clearTimeout(t)
  }, [crboId])

  if (!crboId || !visible) return null

  const dismiss = () => {
    markDismissed(crboId)
    setVisible(false)
  }

  const toggleSection = (id: string) => {
    setSections(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleSubmit = async () => {
    if (!score) {
      toast.error('Merci de donner une note avant d\'envoyer.')
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch('/api/feedbacks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          crbo_id: crboId,
          qualite_score: score,
          modifications: modifications.trim() || undefined,
          sections_modifiees: Array.from(sections),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erreur envoi feedback')
      setSubmitted(true)
      markDismissed(crboId)
      // Auto-fade après 3s
      setTimeout(() => setVisible(false), 3000)
    } catch (err: any) {
      toast.error(err?.message || "Échec de l'envoi du retour")
    } finally {
      setSubmitting(false)
    }
  }

  // État "merci" après envoi
  if (submitted) {
    return (
      <div
        role="status"
        style={{
          background: 'var(--ds-success-soft, #ECFDF5)',
          border: '1px solid var(--ds-success, #16a34a)',
          borderRadius: 12,
          padding: '14px 18px',
          marginTop: 16,
          display: 'flex', alignItems: 'center', gap: 10,
          fontFamily: 'var(--font-body)',
          fontSize: 14,
          color: 'var(--fg-1)',
          animation: 'fb-fade-in 300ms ease',
        }}
      >
        <CheckCircle2 size={18} style={{ color: 'var(--ds-success, #16a34a)' }} />
        <span>Merci pour votre retour, il nous aide à mieux calibrer Ortho.ia.</span>
        <style jsx>{`
          @keyframes fb-fade-in {
            from { opacity: 0; transform: translateY(-6px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}</style>
      </div>
    )
  }

  const displayScore = hoverScore ?? score ?? 0

  return (
    <div
      role="dialog"
      aria-label="Retour sur la qualité du CRBO"
      style={{
        background: 'linear-gradient(135deg, #F0F9FF 0%, #FAF5FF 100%)',
        border: '1px solid #C7D2FE',
        borderRadius: 14,
        padding: 20,
        marginTop: 20,
        fontFamily: 'var(--font-body)',
        position: 'relative',
        animation: 'fb-slide-in 320ms cubic-bezier(0.22, 1, 0.36, 1)',
      }}
    >
      <button
        type="button"
        onClick={dismiss}
        aria-label="Fermer sans envoyer"
        title="Passer"
        style={{
          position: 'absolute', top: 12, right: 12,
          background: 'transparent', border: 0, padding: 6,
          color: 'var(--fg-3, #6B7280)',
          cursor: 'pointer',
        }}
      >
        <X size={16} />
      </button>

      <h3 style={{
        margin: 0, marginBottom: 4,
        fontSize: 16, fontWeight: 700,
        color: 'var(--fg-1)',
      }}>
        Ce CRBO correspond-il à votre style&nbsp;?
      </h3>
      <p style={{
        margin: 0, marginBottom: 14,
        fontSize: 13, color: 'var(--fg-2)',
        lineHeight: 1.5,
      }}>
        Votre retour calibre Ortho.ia. Les notes basses + corrections explicites
        deviennent des exemples qui améliorent la qualité pour vos prochains CRBOs.
      </p>

      {/* Étoiles */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 14 }}>
        {[1, 2, 3, 4, 5].map(n => (
          <button
            key={n}
            type="button"
            onClick={() => setScore(n)}
            onMouseEnter={() => setHoverScore(n)}
            onMouseLeave={() => setHoverScore(null)}
            aria-label={`Note ${n} sur 5`}
            style={{
              background: 'transparent', border: 0, padding: 4, cursor: 'pointer',
              transition: 'transform 120ms',
            }}
            onMouseDown={(e) => { e.currentTarget.style.transform = 'scale(0.92)' }}
            onMouseUp={(e) => { e.currentTarget.style.transform = 'scale(1)' }}
          >
            <Star
              size={26}
              fill={n <= displayScore ? '#F59E0B' : 'none'}
              stroke={n <= displayScore ? '#F59E0B' : '#9CA3AF'}
              strokeWidth={1.8}
            />
          </button>
        ))}
        <span style={{ marginLeft: 8, fontSize: 12, color: 'var(--fg-3)' }}>
          {score === null
            ? '— choisissez une note —'
            : score === 5 ? 'Parfait, conforme à mon style'
            : score === 4 ? 'Très bien, peu d\'ajustements'
            : score === 3 ? 'Correct, quelques retouches'
            : score === 2 ? 'À retravailler significativement'
            : 'Pas exploitable en l\'état'}
        </span>
      </div>

      {/* Sections modifiées */}
      <div style={{ marginBottom: 14 }}>
        <p style={{
          margin: 0, marginBottom: 6,
          fontSize: 12, fontWeight: 600,
          color: 'var(--fg-2)',
          textTransform: 'uppercase', letterSpacing: 0.5,
        }}>
          Sections modifiées (optionnel)
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {SECTIONS.map(s => {
            const active = sections.has(s.id)
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => toggleSection(s.id)}
                aria-pressed={active}
                style={{
                  padding: '5px 12px',
                  fontSize: 12, fontWeight: 500,
                  background: active ? '#6366F1' : 'white',
                  color: active ? 'white' : 'var(--fg-2)',
                  border: '1px solid ' + (active ? '#6366F1' : '#D1D5DB'),
                  borderRadius: 999,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  transition: 'all 160ms',
                }}
              >
                {s.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Textarea corrections */}
      <div style={{ marginBottom: 14 }}>
        <label style={{
          display: 'block',
          marginBottom: 6,
          fontSize: 12, fontWeight: 600,
          color: 'var(--fg-2)',
          textTransform: 'uppercase', letterSpacing: 0.5,
        }}>
          Qu'avez-vous modifié ou corrigé&nbsp;? <span style={{ fontWeight: 400, textTransform: 'none', color: 'var(--fg-3)' }}>(optionnel)</span>
        </label>
        <textarea
          value={modifications}
          onChange={(e) => setModifications(e.target.value.slice(0, 1000))}
          rows={3}
          placeholder="Ex : J'ai retiré la mention de PAP qui n'était pas justifiée ; le diagnostic était trop sévère pour ce profil…"
          style={{
            width: '100%',
            padding: '10px 12px',
            fontSize: 13.5,
            fontFamily: 'inherit',
            color: 'var(--fg-1)',
            background: 'white',
            border: '1px solid #D1D5DB',
            borderRadius: 8,
            resize: 'vertical',
            outline: 'none',
          }}
          onFocus={(e) => { e.currentTarget.style.borderColor = '#6366F1' }}
          onBlur={(e) => { e.currentTarget.style.borderColor = '#D1D5DB' }}
        />
        <div style={{ textAlign: 'right', marginTop: 4, fontSize: 11, color: 'var(--fg-3)' }}>
          {modifications.length}/1000
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
        <button
          type="button"
          onClick={dismiss}
          style={{
            padding: '8px 16px',
            background: 'transparent',
            border: 0,
            color: 'var(--fg-2)',
            fontSize: 13, fontWeight: 500,
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          Passer
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!score || submitting}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '8px 18px',
            background: score
              ? 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)'
              : '#E5E7EB',
            color: score ? 'white' : 'var(--fg-3)',
            border: 0,
            borderRadius: 8,
            fontSize: 13, fontWeight: 600,
            cursor: score && !submitting ? 'pointer' : 'not-allowed',
            fontFamily: 'inherit',
            boxShadow: score ? '0 4px 12px rgba(99,102,241,0.30)' : 'none',
          }}
        >
          {submitting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
          Envoyer mes retours
        </button>
      </div>

      <style jsx>{`
        @keyframes fb-slide-in {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}
