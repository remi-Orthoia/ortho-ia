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
      <span tabIndex={0} className="inline-flex items-center underline decoration-dotted decoration-gray-400 underline-offset-2 cursor-help focus:outline-none focus:ring-2 focus:ring-primary-500 focus:rounded">
        {children}
      </span>
      {open && (
        <span
          role="tooltip"
          className={`absolute z-50 ${placementClass} px-3 py-2 w-max max-w-xs bg-gray-900 dark:bg-surface-dark-muted text-white text-xs rounded-lg shadow-lg pointer-events-none animate-scale-in`}
        >
          {content}
        </span>
      )}
    </span>
  )
}
