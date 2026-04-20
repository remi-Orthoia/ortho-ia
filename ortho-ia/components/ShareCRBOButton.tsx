'use client'

import { useState } from 'react'
import { Share2, Check, Copy, Loader2, Clock } from 'lucide-react'

interface Props {
  /** ID du CRBO (null si pas encore sauvegardé en DB). */
  crboId: string | null
}

/**
 * Bouton + dialogue pour générer un lien de partage temporaire (24h).
 * Copie automatique dans le presse-papier au succès.
 */
export default function ShareCRBOButton({ crboId }: Props) {
  const [loading, setLoading] = useState(false)
  const [shareUrl, setShareUrl] = useState<string | null>(null)
  const [expiresAt, setExpiresAt] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleShare = async () => {
    if (!crboId) {
      setError("CRBO pas encore sauvegardé — réessayez dans un instant.")
      return
    }
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/crbo/${crboId}/share`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erreur création lien')
      setShareUrl(data.url)
      setExpiresAt(data.expires_at)
      // Auto-copy au presse-papier
      try {
        await navigator.clipboard.writeText(data.url)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      } catch {
        // Navigator clipboard indisponible (HTTP non-sécurisé) — c'est OK, l'URL est affichée
      }
    } catch (err: any) {
      setError(err.message || 'Erreur')
    } finally {
      setLoading(false)
    }
  }

  const copyUrl = async () => {
    if (!shareUrl) return
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setError('Impossible de copier automatiquement — sélectionnez manuellement.')
    }
  }

  if (shareUrl) {
    return (
      <div className="card-lifted p-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800/40">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center shrink-0">
            <Share2 className="text-blue-600 dark:text-blue-400" size={18} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-blue-900 dark:text-blue-200 text-sm">
              Lien de partage généré · valide 24h
            </p>
            <p className="text-xs text-blue-700 dark:text-blue-300 mt-0.5 flex items-center gap-1">
              <Clock size={11} />
              Expire le {expiresAt && new Date(expiresAt).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })}
            </p>
            <div className="mt-2 flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={shareUrl}
                onFocus={(e) => e.target.select()}
                className="flex-1 px-3 py-1.5 bg-white dark:bg-surface-dark-subtle border border-blue-200 dark:border-blue-800/50 rounded text-xs font-mono text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
              <button
                onClick={copyUrl}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold transition"
              >
                {copied ? <Check size={12} /> : <Copy size={12} />}
                {copied ? 'Copié' : 'Copier'}
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-end gap-2">
      {error && <span className="text-xs text-red-600 dark:text-red-400">{error}</span>}
      <button
        onClick={handleShare}
        disabled={loading || !crboId}
        className="btn-secondary text-sm"
      >
        {loading ? <Loader2 className="animate-spin" size={14} /> : <Share2 size={14} />}
        {loading ? 'Création…' : 'Partager (24h)'}
      </button>
    </div>
  )
}
