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

  // Mapping severity → tokens DS (palette Stéphanie)
  const palette =
    severity === 'error'
      ? { bg: 'var(--ds-danger-soft)', fg: 'var(--ds-danger)', border: 'color-mix(in srgb, var(--ds-danger) 30%, transparent)' }
      : severity === 'warning'
        ? { bg: 'var(--ds-warning-soft)', fg: 'var(--ds-warning)', border: 'color-mix(in srgb, var(--ds-warning) 30%, transparent)' }
        : { bg: 'var(--ds-info-soft)', fg: 'var(--ds-info)', border: 'color-mix(in srgb, var(--ds-info) 30%, transparent)' }

  const Icon = icon === 'clock' ? Clock : icon === 'wifi' ? Wifi : AlertCircle

  return (
    <div
      role="alert"
      style={{
        background: palette.bg,
        border: `1px solid ${palette.border}`,
        color: palette.fg,
        borderRadius: 'var(--radius-md)',
        padding: '12px 16px',
        display: 'flex', alignItems: 'flex-start', gap: 12,
        fontFamily: 'var(--font-body)',
      }}
    >
      <Icon className="shrink-0" size={20} style={{ marginTop: 2 }} />
      <div className="flex-1 min-w-0">
        <p style={{ fontWeight: 600 }}>{title}</p>
        <p style={{ fontSize: 14, marginTop: 2 }}>{message}</p>
        {advice && <p style={{ fontSize: 14, marginTop: 4, fontStyle: 'italic', opacity: 0.85 }}>{advice}</p>}
      </div>
      <div className="flex gap-2 shrink-0">
        {canRetry && onRetry && (
          <button
            onClick={onRetry}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              padding: '4px 12px',
              background: 'var(--bg-surface)',
              color: 'var(--fg-1)',
              border: '1px solid var(--border-ds-strong)',
              borderRadius: 'var(--radius-sm)',
              fontSize: 14, fontWeight: 500,
              cursor: 'pointer',
              transition: 'background 180ms',
            }}
          >
            <RefreshCw size={14} /> Réessayer
          </button>
        )}
        {onDismiss && (
          <button
            onClick={onDismiss}
            aria-label="Fermer"
            style={{
              padding: '4px 8px', fontSize: 16,
              background: 'transparent', border: 0, color: 'currentColor',
              opacity: 0.7, cursor: 'pointer', transition: 'opacity 180ms',
            }}
          >
            ×
          </button>
        )}
      </div>
    </div>
  )
}
