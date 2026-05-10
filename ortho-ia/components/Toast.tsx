'use client'

/**
 * Système de notifications toast non-bloquantes pour le dashboard.
 *
 * Pourquoi : remplace les `alert()` (modal bloquante, look système moche,
 * empilable seulement par défilement, pas dismissable au clavier sans Enter)
 * par un bandeau discret en bas à droite, dismissable, auto-fermé.
 *
 * Usage :
 *   import { useToast } from '@/components/Toast'
 *   const toast = useToast()
 *   toast.error("Suppression échouée")          // rouge, 6s
 *   toast.success("Patient enregistré")          // vert, 4s
 *   toast.info("Brouillon sauvegardé")           // gris, 4s
 *   toast.warning("Session expirée bientôt")     // orange, 6s
 *
 * Pas de dépendance externe : ~120 lignes, mounté une fois dans le
 * dashboard layout via <ToastProvider>.
 */

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { X, CheckCircle2, AlertCircle, AlertTriangle, Info } from 'lucide-react'

type ToastVariant = 'success' | 'error' | 'warning' | 'info'

interface ToastItem {
  id: number
  message: string
  variant: ToastVariant
  /** ms avant disparition automatique (0 = persistant). */
  duration: number
}

interface ToastApi {
  success: (message: string, opts?: { duration?: number }) => void
  error:   (message: string, opts?: { duration?: number }) => void
  warning: (message: string, opts?: { duration?: number }) => void
  info:    (message: string, opts?: { duration?: number }) => void
  /** Retire un toast par son id (rare — utile si un message ne doit plus
   *  être visible après une action utilisateur). */
  dismiss: (id: number) => void
}

const ToastContext = createContext<ToastApi | null>(null)

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext)
  if (!ctx) {
    // Fallback : si l'arbre React ne contient pas le provider (rare, ex.
    // composant rendu hors du dashboard layout), on dégrade vers alert()
    // plutôt que de planter le caller. Préserve la sémantique "feedback
    // utilisateur garanti" même si le wiring est cassé.
    return {
      success: (m) => { if (typeof window !== 'undefined') alert(m) },
      error:   (m) => { if (typeof window !== 'undefined') alert(m) },
      warning: (m) => { if (typeof window !== 'undefined') alert(m) },
      info:    (m) => { if (typeof window !== 'undefined') alert(m) },
      dismiss: () => {},
    }
  }
  return ctx
}

const VARIANT_STYLES: Record<ToastVariant, { bg: string; border: string; icon: ReactNode; iconColor: string }> = {
  success: { bg: 'var(--ds-success-soft, #ECFDF5)', border: 'var(--ds-success, #059669)', icon: <CheckCircle2 size={18} />,    iconColor: 'var(--ds-success, #059669)' },
  error:   { bg: 'var(--ds-danger-soft, #FEF2F2)',  border: 'var(--ds-danger, #DC2626)',  icon: <AlertCircle size={18} />,     iconColor: 'var(--ds-danger, #DC2626)' },
  warning: { bg: 'var(--ds-warning-soft, #FFFBEB)', border: 'var(--ds-warning, #D97706)', icon: <AlertTriangle size={18} />,   iconColor: 'var(--ds-warning, #D97706)' },
  info:    { bg: 'var(--bg-surface-2, #F3F4F6)',    border: 'var(--ds-primary, #6366F1)', icon: <Info size={18} />,            iconColor: 'var(--ds-primary, #6366F1)' },
}

const DEFAULT_DURATION: Record<ToastVariant, number> = {
  success: 4000,
  error:   6000,
  warning: 6000,
  info:    4000,
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const idRef = useRef(0)

  const dismiss = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const push = useCallback((variant: ToastVariant, message: string, opts?: { duration?: number }) => {
    const id = ++idRef.current
    const duration = opts?.duration ?? DEFAULT_DURATION[variant]
    setToasts(prev => [...prev, { id, message, variant, duration }])
    if (duration > 0) {
      setTimeout(() => dismiss(id), duration)
    }
  }, [dismiss])

  const api: ToastApi = {
    success: (m, o) => push('success', m, o),
    error:   (m, o) => push('error', m, o),
    warning: (m, o) => push('warning', m, o),
    info:    (m, o) => push('info', m, o),
    dismiss,
  }

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="true"
        style={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          maxWidth: 420,
          pointerEvents: 'none',
        }}
      >
        {toasts.map(t => {
          const s = VARIANT_STYLES[t.variant]
          return (
            <div
              key={t.id}
              role="status"
              style={{
                pointerEvents: 'auto',
                background: s.bg,
                borderLeft: `4px solid ${s.border}`,
                borderRadius: 8,
                padding: '12px 14px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.04)',
                display: 'flex',
                alignItems: 'flex-start',
                gap: 10,
                fontSize: 14,
                color: 'var(--fg-1, #111827)',
                animation: 'toast-slide-in 220ms cubic-bezier(0.32, 0.72, 0, 1)',
              }}
            >
              <span style={{ color: s.iconColor, flexShrink: 0, marginTop: 1 }}>{s.icon}</span>
              <span style={{ flex: 1, lineHeight: 1.4 }}>{t.message}</span>
              <button
                onClick={() => dismiss(t.id)}
                aria-label="Fermer la notification"
                style={{
                  background: 'transparent',
                  border: 0,
                  padding: 2,
                  color: 'var(--fg-3, #6B7280)',
                  cursor: 'pointer',
                  flexShrink: 0,
                  display: 'grid',
                  placeItems: 'center',
                  borderRadius: 4,
                }}
              >
                <X size={14} />
              </button>
            </div>
          )
        })}
      </div>
      <style>{`
        @keyframes toast-slide-in {
          from { opacity: 0; transform: translateX(20px); }
          to   { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </ToastContext.Provider>
  )
}
