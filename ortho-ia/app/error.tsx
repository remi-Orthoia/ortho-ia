'use client'

/**
 * Error boundary global Next.js — évite la page blanche.
 * Affiche un message clair + boutons Réessayer / Retour dashboard.
 */

import { useEffect } from 'react'
import Link from 'next/link'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log l'erreur (sans payload sensible)
    console.error('GlobalError:', {
      name: error?.name,
      message: error?.message?.slice(0, 200),
      digest: error?.digest,
    })
  }, [error])

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-surface-dark flex items-center justify-center px-4">
      <div className="card-lifted max-w-md w-full p-8 text-center">
        <div className="mx-auto w-16 h-16 rounded-2xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-5">
          <AlertTriangle className="text-red-600 dark:text-red-400" size={28} />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Oups, quelque chose s&apos;est mal passé
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Une erreur inattendue est survenue. Vos données sont en sécurité.
          Essayez de recharger la page, ou revenez au tableau de bord.
        </p>
        {error?.digest && (
          <p className="mt-2 text-xs text-gray-400 dark:text-gray-500 font-mono">
            Code : {error.digest}
          </p>
        )}
        <div className="mt-6 flex items-center justify-center gap-3">
          <button onClick={() => reset()} className="btn-primary">
            <RefreshCw size={16} />
            Réessayer
          </button>
          <Link href="/dashboard" className="btn-secondary">
            <Home size={16} />
            Tableau de bord
          </Link>
        </div>
        <p className="mt-6 text-xs text-gray-500 dark:text-gray-500">
          Si le problème persiste, contactez{' '}
          <a href="mailto:remi.berrio@gmail.com" className="text-primary-600 dark:text-primary-400 hover:underline">
            remi.berrio@gmail.com
          </a>
        </p>
      </div>
    </div>
  )
}
