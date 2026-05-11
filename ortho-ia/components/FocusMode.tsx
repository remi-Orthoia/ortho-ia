'use client'

/**
 * Hook + composant pour basculer le dashboard en "Mode focus" — sidebar et
 * header se replient, seule la zone d'édition reste visible. Inspiré d'iA
 * Writer / Bear / Notion Focus.
 *
 * Mécanique : on pose un attribut `data-focus="true"` sur <body>, et le
 * layout dashboard a un CSS qui cache les éléments chrome dans cet état.
 *
 * Usage côté page :
 *   import { useFocusMode } from '@/components/FocusMode'
 *   useFocusMode(currentStep === 4)  // actif uniquement à l'étape anamnèse
 *
 * Le hook nettoie automatiquement à l'unmount.
 */

import { useEffect } from 'react'

const ATTR = 'data-focus-mode'

export function useFocusMode(active: boolean) {
  useEffect(() => {
    if (typeof document === 'undefined') return
    if (active) {
      document.body.setAttribute(ATTR, 'true')
    } else {
      document.body.removeAttribute(ATTR)
    }
    return () => {
      document.body.removeAttribute(ATTR)
    }
  }, [active])
}

/**
 * Petit bouton discret pour basculer manuellement le mode focus.
 * Optionnel — l'activation principale reste automatique via useFocusMode.
 */
export function FocusModeToggle({ onToggle, isActive }: { onToggle: () => void; isActive: boolean }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      title={isActive ? 'Quitter le mode focus (Esc)' : 'Mode focus — masquer les distractions'}
      aria-label={isActive ? 'Quitter le mode focus' : 'Activer le mode focus'}
      style={{
        position: 'fixed',
        bottom: 24,
        left: 24,
        zIndex: 60,
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-ds-strong)',
        borderRadius: 999,
        width: 40, height: 40,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer',
        boxShadow: 'var(--shadow-sm)',
        transition: 'all 180ms',
        color: isActive ? 'var(--ds-primary)' : 'var(--fg-3)',
      }}
    >
      {isActive ? '◉' : '○'}
    </button>
  )
}
