'use client'

import { useEffect, useState } from 'react'
import { Sparkles, FileText, Brain, PenLine, CheckCircle2 } from 'lucide-react'

/**
 * Overlay plein écran affiché pendant la génération du CRBO (15-40s).
 * Séquence visuelle d'étapes pour rassurer l'ortho pendant l'attente Claude API.
 */

interface Step {
  icon: React.ElementType
  label: string
  detail: string
}

const STEPS: Step[] = [
  { icon: FileText, label: 'Lecture des résultats',     detail: 'Interprétation des percentiles et scores bruts' },
  { icon: Brain,    label: 'Analyse clinique',          detail: 'Corrélations inter-domaines, patterns diagnostiques' },
  { icon: PenLine,  label: 'Rédaction du CRBO',         detail: 'Anamnèse en prose, commentaires, diagnostic différentiel' },
  { icon: Sparkles, label: 'Recommandations',           detail: 'PAP, comorbidités, aménagements scolaires' },
]

export default function GenerationLoader({ visible }: { visible: boolean }) {
  const [stepIndex, setStepIndex] = useState(0)
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    if (!visible) {
      setStepIndex(0)
      setElapsed(0)
      return
    }
    const stepInterval = setInterval(() => {
      setStepIndex(prev => Math.min(prev + 1, STEPS.length - 1))
    }, 6_000)
    const timeInterval = setInterval(() => {
      setElapsed(prev => prev + 1)
    }, 1_000)
    return () => {
      clearInterval(stepInterval)
      clearInterval(timeInterval)
    }
  }, [visible])

  if (!visible) return null

  return (
    <div
      className="animate-fade-in"
      style={{
        position: 'fixed', inset: 0, zIndex: 50,
        background: 'color-mix(in srgb, var(--bg-canvas) 82%, transparent)',
        backdropFilter: 'blur(12px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 24,
        fontFamily: 'var(--font-body)',
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
        {/* Icône animée — halo + disque sage */}
        <div style={{ position: 'relative', width: 64, height: 64, margin: '0 auto' }}>
          <div
            className="animate-ping"
            style={{
              position: 'absolute', inset: 0, borderRadius: 999,
              background: 'var(--ds-primary-soft)', opacity: 0.75,
            }}
          />
          <div
            style={{
              position: 'relative', width: 64, height: 64, borderRadius: 999,
              background: `linear-gradient(135deg, var(--ds-primary) 0%, var(--brand-sage-700, var(--ds-primary-hover)) 100%)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: 'var(--shadow-md)',
            }}
          >
            <Sparkles className="animate-sparkle" size={28} style={{ color: 'var(--fg-on-brand)' }} />
          </div>
        </div>

        <h2
          style={{
            marginTop: 24,
            fontFamily: 'var(--font-display)',
            fontSize: 22, fontWeight: 500, letterSpacing: '-0.01em',
            color: 'var(--fg-1)',
          }}
        >
          Génération en cours…
        </h2>
        <p style={{ marginTop: 6, fontSize: 14, color: 'var(--fg-2)', lineHeight: 1.55 }}>
          Notre IA rédige votre CRBO. Comptez 30 à 150 secondes selon la richesse du bilan.
        </p>

        {/* Étapes */}
        <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 10, textAlign: 'left' }}>
          {STEPS.map((step, idx) => {
            const Icon = step.icon
            const done = idx < stepIndex
            const active = idx === stepIndex
            const labelColor = done || active ? 'var(--fg-1)' : 'var(--fg-3)'
            const detailColor = done || active ? 'var(--fg-2)' : 'var(--fg-3)'
            return (
              <div
                key={idx}
                style={{
                  display: 'flex', alignItems: 'flex-start', gap: 12,
                  padding: 10,
                  borderRadius: 'var(--radius-md)',
                  background: active ? 'var(--ds-primary-soft)' : 'transparent',
                  transition: 'background var(--duration) var(--ease-out)',
                }}
              >
                <div
                  style={{
                    flexShrink: 0,
                    width: 32, height: 32, borderRadius: 999,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: done
                      ? 'var(--ds-primary)'
                      : active
                      ? 'var(--ds-primary-soft)'
                      : 'var(--bg-surface-2)',
                    color: done
                      ? 'var(--fg-on-brand)'
                      : active
                      ? 'var(--ds-primary-hover)'
                      : 'var(--fg-3)',
                    boxShadow: active ? '0 0 0 2px color-mix(in srgb, var(--ds-primary) 40%, transparent)' : 'none',
                    transition: 'all var(--duration) var(--ease-out)',
                  }}
                >
                  {done ? <CheckCircle2 size={16} /> : <Icon size={14} />}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 14, fontWeight: 500, color: labelColor, transition: 'color var(--duration)' }}>
                    {step.label}
                    {active && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', marginLeft: 8, gap: 2 }}>
                        <span className="animate-dot-1" style={{ width: 4, height: 4, borderRadius: 999, background: 'var(--ds-primary)' }} />
                        <span className="animate-dot-2" style={{ width: 4, height: 4, borderRadius: 999, background: 'var(--ds-primary)' }} />
                        <span className="animate-dot-3" style={{ width: 4, height: 4, borderRadius: 999, background: 'var(--ds-primary)' }} />
                      </span>
                    )}
                  </p>
                  <p style={{ fontSize: 12, color: detailColor, transition: 'color var(--duration)' }}>
                    {step.detail}
                  </p>
                </div>
              </div>
            )
          })}
        </div>

        {/* Barre de progression shimmer */}
        <div
          style={{
            marginTop: 24, height: 4, borderRadius: 999,
            background: 'var(--bg-surface-2)',
            overflow: 'hidden',
          }}
        >
          <div
            className="shimmer-bg"
            style={{
              height: '100%', width: '100%',
              backgroundSize: '200% 100%',
              animation: 'shimmer 1.6s linear infinite',
            }}
          />
        </div>
        <p style={{ marginTop: 8, fontSize: 12, color: 'var(--fg-3)' }}>
          {elapsed}s écoulées · données anonymisées avant envoi
        </p>
      </div>
    </div>
  )
}
