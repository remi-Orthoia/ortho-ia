'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { CheckCircle, Clock, X } from 'lucide-react'

/**
 * Bandeau status pose sur la home en reponse a un signal cote URL :
 *  - ?account-deleted=1       : suppression RGPD reussie
 *  - ?account-deleted=pending : suppression cote DB ok, auth en attente d'admin
 *  - ?logged-out=idle         : deconnexion auto apres 60 min d'inactivite
 *
 * Auto-dismiss apres 10s. Clean l'URL pour eviter qu'un refresh re-affiche.
 */

type Variant = 'done' | 'pending' | 'idle'

function BannerInner() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [visible, setVisible] = useState(false)
  const [variant, setVariant] = useState<Variant>('done')

  useEffect(() => {
    const accountDeleted = searchParams.get('account-deleted')
    const loggedOut = searchParams.get('logged-out')
    let v: Variant | null = null
    if (accountDeleted === '1') v = 'done'
    else if (accountDeleted === 'pending') v = 'pending'
    else if (loggedOut === 'idle') v = 'idle'
    if (v) {
      setVariant(v)
      setVisible(true)
      const timer = setTimeout(() => dismiss(), 10000)
      return () => clearTimeout(timer)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const dismiss = () => {
    setVisible(false)
    const url = new URL(window.location.href)
    url.searchParams.delete('account-deleted')
    url.searchParams.delete('logged-out')
    router.replace(url.pathname + (url.search || ''))
  }

  if (!visible) return null

  const config = {
    done: {
      bg: 'var(--ds-success-soft, #D1FAE5)',
      fg: '#065F46',
      icon: <CheckCircle size={18} />,
      text: 'Votre compte et toutes vos donnees ont ete supprimes definitivement. Merci d\'avoir teste Ortho.ia.',
    },
    pending: {
      bg: 'var(--ds-warning-soft, #FEF3C7)',
      fg: '#92400E',
      icon: <CheckCircle size={18} />,
      text: 'Vos donnees ont ete supprimees. La finalisation cote auth est en cours — vous recevrez un email de confirmation sous 24h.',
    },
    idle: {
      bg: 'var(--ds-warning-soft, #FEF3C7)',
      fg: '#92400E',
      icon: <Clock size={18} />,
      text: 'Vous avez ete deconnectee apres 60 min d\'inactivite (secret medical). Reconnectez-vous pour reprendre.',
    },
  }[variant]

  return (
    <div
      role="status"
      style={{
        background: config.bg,
        color: config.fg,
        padding: '12px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        fontSize: 14,
        fontWeight: 500,
        position: 'relative',
      }}
    >
      {config.icon}
      <span>{config.text}</span>
      <button
        type="button"
        onClick={dismiss}
        aria-label="Fermer"
        style={{
          background: 'transparent', border: 0, padding: 4,
          color: 'inherit', cursor: 'pointer',
          display: 'grid', placeItems: 'center',
          marginLeft: 8, opacity: 0.7,
        }}
      >
        <X size={16} />
      </button>
    </div>
  )
}

export default function AccountDeletedBanner() {
  return (
    <Suspense fallback={null}>
      <BannerInner />
    </Suspense>
  )
}
