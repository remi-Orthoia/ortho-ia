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
      <div
        style={{
          padding: 16,
          background: `
            radial-gradient(ellipse at 0% 0%, var(--ds-info-soft) 0%, transparent 70%),
            var(--bg-surface)
          `,
          border: '1px solid color-mix(in srgb, var(--ds-info) 25%, transparent)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-md)',
          fontFamily: 'var(--font-body)',
        }}
      >
        <div className="flex items-start gap-3">
          <div
            className="shrink-0"
            style={{
              width: 36, height: 36, borderRadius: 999,
              background: 'var(--ds-info-soft)',
              color: 'var(--ds-info)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <Share2 size={18} />
          </div>
          <div className="flex-1 min-w-0">
            <p style={{ fontWeight: 600, color: 'var(--fg-1)', fontSize: 14 }}>
              Lien de partage généré · valide 24h
            </p>
            <p style={{ fontSize: 12, color: 'var(--fg-2)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
              <Clock size={11} />
              Expire le {expiresAt && new Date(expiresAt).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })}
            </p>
            <div className="mt-2 flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={shareUrl}
                onFocus={(e) => e.target.select()}
                className="flex-1"
                style={{
                  padding: '6px 12px',
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-ds-strong)',
                  borderRadius: 'var(--radius-sm)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: 12,
                  color: 'var(--fg-2)',
                  outline: 'none',
                }}
              />
              <button
                onClick={copyUrl}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '6px 12px',
                  background: 'var(--ds-primary)',
                  color: 'var(--fg-on-brand)',
                  border: 0,
                  borderRadius: 'var(--radius-sm)',
                  fontFamily: 'var(--font-body)',
                  fontSize: 12, fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'background 180ms',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--ds-primary-hover)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--ds-primary)')}
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
    <div className="flex items-center justify-end gap-2" style={{ fontFamily: 'var(--font-body)' }}>
      {error && <span style={{ fontSize: 12, color: 'var(--ds-danger)' }}>{error}</span>}
      <button
        onClick={handleShare}
        disabled={loading || !crboId}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '8px 14px',
          background: 'var(--bg-surface)',
          color: 'var(--fg-1)',
          border: '1px solid var(--border-ds-strong)',
          borderRadius: 'var(--radius-md)',
          fontFamily: 'var(--font-body)',
          fontSize: 14, fontWeight: 500,
          cursor: (loading || !crboId) ? 'not-allowed' : 'pointer',
          opacity: (loading || !crboId) ? 0.6 : 1,
          transition: 'background 180ms',
        }}
        onMouseEnter={(e) => { if (!loading && crboId) e.currentTarget.style.background = 'var(--bg-surface-2)' }}
        onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--bg-surface)')}
      >
        {loading ? <Loader2 className="animate-spin" size={14} /> : <Share2 size={14} />}
        {loading ? 'Création…' : 'Partager (24h)'}
      </button>
    </div>
  )
}
