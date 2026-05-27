'use client'

/**
 * Bouton d'auto-remplissage du formulaire CRBO. Visible dans 2 cas :
 *  1. Compte démo (demo@ortho-ia.fr) : libellé "Auto-remplir (démo)" pour
 *     les passages Rémi/Sophie qui testent rapidement.
 *  2. Nouvelle ortho (0 CRBO en DB) : libellé "Voir un exemple pré-rempli"
 *     pour découvrir l'outil sans saisir ses propres données. Disparait
 *     automatiquement au 1er CRBO généré.
 *
 * Logique d'affichage centralisée dans le hook useShouldShowDemoButton de
 * lib/demo-autofill.ts (1 call auth + 1 count crbos).
 */

import { Zap, PlayCircle } from 'lucide-react'
import { useShouldShowDemoButton } from '@/lib/demo-autofill'

interface Props {
  onFill: () => void
  /** Libellé override. Si non fourni, libellé adapté au mode (demo ou
   *  firstTime). */
  label?: string
  /** Style "discret" par défaut. `prominent` rend un bouton plus visible
   *  utile en haut d'un formulaire. */
  variant?: 'discreet' | 'prominent'
}

export default function DemoAutofillButton({ onFill, label, variant = 'discreet' }: Props) {
  const { show, mode } = useShouldShowDemoButton()
  if (!show) return null

  const isDemo = mode === 'demo'
  const isProminent = variant === 'prominent'
  // Couleurs et libellés differents selon le mode :
  //  - demo (interne) : violet, "Auto-remplir (démo)", icone Zap (rapide)
  //  - firstTime (decouverte) : sage cohérent avec la palette du dashboard,
  //    "Voir un exemple pré-rempli", icone PlayCircle (decouverte)
  const colorMain = isDemo ? '#7c3aed' : '#3F5E52'
  const colorBorder = isDemo ? '#c4b5fd' : '#A8BBB1'
  const effectiveLabel = label ?? (isDemo ? 'Auto-remplir (démo)' : 'Voir un exemple pré-rempli')
  const Icon = isDemo ? Zap : PlayCircle
  const tooltip = isDemo
    ? 'Remplit le formulaire avec des données fictives pour tester rapidement la génération de CRBO.'
    : "Pré-remplit le formulaire avec un exemple fictif pour découvrir l'outil. Vous pourrez l'effacer et saisir vos propres données ensuite."

  return (
    <button
      type="button"
      onClick={onFill}
      title={tooltip}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: isProminent ? '8px 14px' : '6px 12px',
        background: isProminent ? colorMain : 'transparent',
        color: isProminent ? 'white' : colorMain,
        border: `1px ${isProminent ? `solid ${colorMain}` : `dashed ${colorBorder}`}`,
        borderRadius: 8,
        fontSize: isProminent ? 13 : 12,
        fontWeight: 600,
        cursor: 'pointer',
        fontFamily: 'inherit',
      }}
    >
      <Icon size={isProminent ? 14 : 12} />
      {effectiveLabel}
    </button>
  )
}
