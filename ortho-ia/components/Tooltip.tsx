'use client'

import { useState, type ReactNode } from 'react'

interface Props {
  content: ReactNode
  children: ReactNode
  /** Position du tooltip par rapport au trigger. */
  placement?: 'top' | 'bottom' | 'right'
}

/**
 * Tooltip minimaliste sans dépendance — hover + focus (clavier).
 * Pour termes techniques (É-T, percentile, dyslexie...) : survole et définition apparaît.
 */
export default function Tooltip({ content, children, placement = 'top' }: Props) {
  const [open, setOpen] = useState(false)

  const placementClass = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  }[placement]

  return (
    <span
      className="relative inline-flex group"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
    >
      <span
        tabIndex={0}
        className="inline-flex items-center cursor-help focus:outline-none"
        style={{
          textDecoration: 'underline dotted',
          textDecorationColor: 'var(--fg-3)',
          textUnderlineOffset: 2,
        }}
      >
        {children}
      </span>
      {open && (
        <span
          role="tooltip"
          className={`absolute z-50 ${placementClass} pointer-events-none animate-scale-in`}
          style={{
            padding: '8px 12px',
            width: 'max-content', maxWidth: 320,
            background: 'var(--bg-inverse)',
            color: 'var(--fg-on-brand)',
            fontFamily: 'var(--font-body)',
            fontSize: 12,
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-md)',
          }}
        >
          {content}
        </span>
      )}
    </span>
  )
}
