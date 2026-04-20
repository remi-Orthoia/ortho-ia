'use client'

import { AlertCircle, RefreshCw, Clock, Wifi } from 'lucide-react'

/**
 * Banner d'erreur API avec message clair par type d'erreur.
 * À utiliser dans les formulaires qui appellent /api/generate-crbo et /api/extract-pdf.
 */
interface ApiErrorBannerProps {
  /** Message d'erreur reçu du backend */
  message: string
  /** Code HTTP si connu (401, 429, 503, 504, etc.) */
  statusCode?: number
  /** Callback pour retry */
  onRetry?: () => void
  /** Masquer le banner */
  onDismiss?: () => void
}

function classifyError(message: string, statusCode?: number): {
  title: string
  severity: 'warning' | 'error' | 'info'
  icon: 'alert' | 'clock' | 'wifi'
  canRetry: boolean
  advice: string
} {
  // Classification par status code d'abord
  if (statusCode === 401) {
    return {
      title: 'Session expirée',
      severity: 'warning',
      icon: 'alert',
      canRetry: false,
      advice: 'Reconnectez-vous pour continuer.',
    }
  }
  if (statusCode === 429) {
    return {
      title: 'Trop de demandes',
      severity: 'warning',
      icon: 'clock',
      canRetry: true,
      advice: 'Patientez une minute avant de réessayer.',
    }
  }
  if (statusCode === 503) {
    return {
      title: 'Service indisponible',
      severity: 'error',
      icon: 'wifi',
      canRetry: true,
      advice: 'Le service IA est temporairement indisponible. Réessayez dans quelques minutes.',
    }
  }
  if (statusCode === 504) {
    return {
      title: 'Délai dépassé',
      severity: 'warning',
      icon: 'clock',
      canRetry: true,
      advice: "La génération a pris trop de temps. Vérifiez la taille de vos données et réessayez.",
    }
  }
  if (statusCode === 413) {
    return {
      title: 'Fichier trop volumineux',
      severity: 'warning',
      icon: 'alert',
      canRetry: false,
      advice: 'Réduisez la taille du fichier (max 10 Mo) ou résumez le contenu.',
    }
  }

  // Classification par message
  const lower = message.toLowerCase()
  if (lower.includes('quota')) {
    return {
      title: 'Quota atteint',
      severity: 'warning',
      icon: 'alert',
      canRetry: false,
      advice: "Passez à l'offre Pro pour générer plus de CRBOs.",
    }
  }
  if (lower.includes('volumineu')) {
    return {
      title: 'Données trop lourdes',
      severity: 'warning',
      icon: 'alert',
      canRetry: false,
      advice: 'Résumez votre anamnèse et vos résultats.',
    }
  }

  return {
    title: 'Erreur',
    severity: 'error',
    icon: 'alert',
    canRetry: true,
    advice: '',
  }
}

export default function ApiErrorBanner({ message, statusCode, onRetry, onDismiss }: ApiErrorBannerProps) {
  const { title, severity, icon, canRetry, advice } = classifyError(message, statusCode)

  const bg =
    severity === 'error' ? 'bg-red-50 border-red-200 text-red-800'
      : severity === 'warning' ? 'bg-amber-50 border-amber-200 text-amber-800'
      : 'bg-blue-50 border-blue-200 text-blue-800'

  const Icon = icon === 'clock' ? Clock : icon === 'wifi' ? Wifi : AlertCircle

  return (
    <div className={`${bg} border rounded-lg px-4 py-3 flex items-start gap-3`} role="alert">
      <Icon className="shrink-0 mt-0.5" size={20} />
      <div className="flex-1 min-w-0">
        <p className="font-semibold">{title}</p>
        <p className="text-sm mt-0.5">{message}</p>
        {advice && <p className="text-sm mt-1 italic opacity-80">{advice}</p>}
      </div>
      <div className="flex gap-2 shrink-0">
        {canRetry && onRetry && (
          <button
            onClick={onRetry}
            className="inline-flex items-center gap-1 px-3 py-1 bg-white/80 hover:bg-white border rounded text-sm font-medium transition"
          >
            <RefreshCw size={14} /> Réessayer
          </button>
        )}
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="px-2 py-1 text-sm opacity-70 hover:opacity-100 transition"
            aria-label="Fermer"
          >
            ×
          </button>
        )}
      </div>
    </div>
  )
}
