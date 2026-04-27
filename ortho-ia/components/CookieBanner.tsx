'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Cookie, X } from 'lucide-react'

/**
 * Bandeau RGPD au premier chargement.
 * Cookies essentiels uniquement (pas de tracking publicitaire). Le choix
 * "Accepter" est mémorisé en localStorage — pas de re-prompt aux visites
 * suivantes. Le bouton "Refuser" n'a pas lieu d'être : aucun cookie
 * non-essentiel n'est posé par l'app.
 */

const STORAGE_KEY = 'ortho-ia:cookie-consent'

export default function CookieBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (!stored) setVisible(true)
    } catch {
      // localStorage indisponible (mode privé strict, etc.) — on n'affiche pas
      // le bandeau plutôt que de bloquer l'UI : pas de cookie non-essentiel posé.
    }
  }, [])

  const handleAccept = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ accepted: true, ts: Date.now() }))
    } catch {}
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-3 sm:p-4 pointer-events-none">
      <div
        role="region"
        aria-label="Bandeau d'information RGPD"
        className="pointer-events-auto max-w-3xl mx-auto bg-white dark:bg-surface-dark border border-gray-200 dark:border-surface-dark-muted rounded-2xl shadow-card-lg p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4"
      >
        <div className="flex items-center gap-3 flex-1">
          <div className="shrink-0 w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 flex items-center justify-center">
            <Cookie size={18} />
          </div>
          <p className="text-sm text-gray-700 dark:text-gray-200 leading-relaxed">
            Ce site utilise des cookies essentiels uniquement (session, préférences) — pas de tracking publicitaire ni de cookies tiers.{' '}
            <Link href="/confidentialite" className="underline font-medium text-primary-700 dark:text-primary-400 hover:text-primary-800">
              Politique de confidentialité
            </Link>
          </p>
        </div>
        <div className="flex items-center gap-2 self-stretch sm:self-auto">
          <button
            type="button"
            onClick={handleAccept}
            className="btn-primary text-sm whitespace-nowrap"
          >
            Accepter
          </button>
          <button
            type="button"
            onClick={handleAccept}
            aria-label="Fermer le bandeau"
            className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-surface-dark-muted transition"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}
