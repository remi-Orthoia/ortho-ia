'use client'

import BilanMathForm from '@/components/bilans/math/BilanMathForm'
import { GRILLE_B_CM } from '@/lib/bilans/math/grille-b-cm'

/**
 * Route /dashboard/bilan/b-cm
 *
 * Bilan de Cognition Mathématique — enfant (cycles II-III).
 * Auth gérée par le layout parent (dashboard/layout.tsx).
 */
export default function BilanBCMPage() {
  return <BilanMathForm grille={GRILLE_B_CM} />
}
