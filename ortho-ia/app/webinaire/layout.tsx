import type { Metadata, Viewport } from 'next'
import type { ReactNode } from 'react'

/**
 * Layout dédié pour /webinaire — sert uniquement à exposer les métadonnées SEO
 * (impossible depuis page.tsx qui est un client component à cause du modal
 * d'inscription). Le rendu visuel est entièrement dans page.tsx.
 */

export const metadata: Metadata = {
  title: 'Webinaire Ortho.ia — Rédigez vos CRBO en 2 minutes',
  description:
    "Webinaire gratuit d'1 heure début juillet 2026. Démo live d'Ortho.ia, témoignages d'orthophonistes, questions/réponses et offre exclusive réservée aux participantes. Inscription limitée.",
  openGraph: {
    title: 'Webinaire Ortho.ia — Rédigez vos CRBO en 2 minutes',
    description:
      "Démo live, témoignages d'orthophonistes, offre exclusive. 1 heure, gratuit, sans engagement.",
    type: 'website',
    locale: 'fr_FR',
  },
  robots: { index: true, follow: true },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
}

export default function WebinaireLayout({ children }: { children: ReactNode }) {
  return <>{children}</>
}
