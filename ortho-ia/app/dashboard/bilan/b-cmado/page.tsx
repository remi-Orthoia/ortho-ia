'use client'

import BilanMathForm from '@/components/bilans/math/BilanMathForm'
import { GRILLE_B_CMADO } from '@/lib/bilans/math/grille-b-cmado'

/**
 * Route /dashboard/bilan/b-cmado
 *
 * Bilan de Cognition Mathématique — adolescent (collège).
 * Auth gérée par le layout parent (dashboard/layout.tsx).
 */
export default function BilanBCMadoPage() {
  return <BilanMathForm grille={GRILLE_B_CMADO} />
}
