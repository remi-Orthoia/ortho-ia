'use client'

/**
 * Bouton d'auto-remplissage visible uniquement pour le compte démo
 * (demo@ortho-ia.fr). Permet à Rémi/Sophie de tester rapidement la
 * génération de CRBO sans saisir patient + anamnèse + cotations.
 *
 * Le bouton se cache totalement pour tous les autres comptes via le hook
 * useIsDemoUser → pas de fuite de feature interne en prod.
 */

import { Zap } from 'lucide-react'
import { useIsDemoUser } from '@/lib/demo-autofill'

interface Props {
  onFill: () => void
  label?: string
  /** Style "discret" par défaut. `prominent` rend un bouton plus visible
   *  utile en haut d'un formulaire. */
  variant?: 'discreet' | 'prominent'
}

export default function DemoAutofillButton({ onFill, label = 'Auto-remplir (démo)', variant = 'discreet' }: Props) {
  const isDemo = useIsDemoUser()
  if (!isDemo) return null

  const isProminent = variant === 'prominent'
  return (
    <button
      type="button"
      onClick={onFill}
      title="Remplit le formulaire avec des données fictives pour tester rapidement la génération de CRBO."
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: isProminent ? '8px 14px' : '6px 12px',
        background: isProminent ? '#7c3aed' : 'transparent',
        color: isProminent ? 'white' : '#7c3aed',
        border: `1px ${isProminent ? 'solid #7c3aed' : 'dashed #c4b5fd'}`,
        borderRadius: 8,
        fontSize: isProminent ? 13 : 12,
        fontWeight: 600,
        cursor: 'pointer',
        fontFamily: 'inherit',
      }}
    >
      <Zap size={isProminent ? 14 : 12} />
      {label}
    </button>
  )
}
