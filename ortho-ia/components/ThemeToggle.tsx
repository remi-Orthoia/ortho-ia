'use client'

import { useEffect, useState } from 'react'
import { Sun, Moon } from 'lucide-react'

/**
 * Toggle light/dark — classe sur <html>, persisté en localStorage.
 * Respecte prefers-color-scheme au premier chargement.
 */
const STORAGE_KEY = 'orthoia.theme'

type Theme = 'light' | 'dark'

function getInitialTheme(): Theme {
  if (typeof window === 'undefined') return 'light'
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored === 'light' || stored === 'dark') return stored
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function applyTheme(theme: Theme) {
  if (theme === 'dark') {
    document.documentElement.classList.add('dark')
  } else {
    document.documentElement.classList.remove('dark')
  }
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>('light')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const t = getInitialTheme()
    setTheme(t)
    applyTheme(t)
    setMounted(true)
  }, [])

  const toggle = () => {
    const next: Theme = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    applyTheme(next)
    try { localStorage.setItem(STORAGE_KEY, next) } catch {}
  }

  if (!mounted) {
    // Éviter hydration mismatch
    return <div className="w-9 h-9" />
  }

  return (
    <button
      onClick={toggle}
      className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-surface-dark-muted hover:text-gray-900 dark:hover:text-gray-100 transition-all duration-200 focus-ring"
      aria-label={theme === 'dark' ? 'Passer en mode clair' : 'Passer en mode sombre'}
      title={theme === 'dark' ? 'Mode clair' : 'Mode sombre'}
    >
      {theme === 'dark' ? (
        <Sun size={18} className="animate-scale-in" />
      ) : (
        <Moon size={18} className="animate-scale-in" />
      )}
    </button>
  )
}
