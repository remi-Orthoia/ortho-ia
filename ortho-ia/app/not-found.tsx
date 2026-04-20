import Link from 'next/link'
import { SearchX, Home } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-surface-dark flex items-center justify-center px-4">
      <div className="card-lifted max-w-md w-full p-8 text-center">
        <div className="mx-auto w-16 h-16 rounded-2xl bg-gray-100 dark:bg-surface-dark-muted flex items-center justify-center mb-5">
          <SearchX className="text-gray-500 dark:text-gray-400" size={28} />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">404</h1>
        <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">
          Cette page n&apos;existe pas
        </p>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-500">
          Le lien que vous avez suivi est peut-être obsolète ou incorrect.
        </p>
        <div className="mt-6 flex items-center justify-center gap-3">
          <Link href="/" className="btn-secondary">
            Accueil
          </Link>
          <Link href="/dashboard" className="btn-primary">
            <Home size={16} />
            Tableau de bord
          </Link>
        </div>
      </div>
    </div>
  )
}
