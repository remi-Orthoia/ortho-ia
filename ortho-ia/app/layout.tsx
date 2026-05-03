import type { Metadata } from 'next'
import { Fraunces, Inter_Tight, Inter, Manrope, Poppins } from 'next/font/google'
import './globals.css'
import CookieBanner from '@/components/CookieBanner'

// ===== Fonts du design system Stéphanie =====
// Chargées via next/font (self-hosted, zéro requête Google côté client).
// Les CSS variables --font-* sont consommées par var(--font-display) /
// var(--font-body) dans globals.css selon la direction active.
const fraunces = Fraunces({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-fraunces',
  display: 'swap',
})
const interTight = Inter_Tight({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-inter-tight',
  display: 'swap',
})
const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-inter',
  display: 'swap',
})
const manrope = Manrope({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-manrope',
  display: 'swap',
})
const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-poppins',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Ortho.ia - Génération de CRBO par IA',
  description: 'Réduisez votre temps de rédaction de comptes rendus de bilan orthophonique grâce à l\'intelligence artificielle.',
  keywords: 'orthophonie, CRBO, compte rendu, bilan orthophonique, IA, intelligence artificielle',
  authors: [{ name: 'Ortho.ia' }],
  // Favicon identique au logo navbar (gradient #22c55e → #15803d + "O" blanc)
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico', sizes: '32x32', type: 'image/x-icon' },
    ],
    shortcut: '/favicon.ico',
    apple: '/favicon.svg',
  },
  openGraph: {
    title: 'Ortho.ia - Génération de CRBO par IA',
    description: 'Transformez vos notes et résultats de bilan en comptes rendus professionnels en quelques clics.',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="fr"
      data-direction="A"
      className={`${fraunces.variable} ${interTight.variable} ${inter.variable} ${manrope.variable} ${poppins.variable}`}
    >
      <body className="antialiased">
        {children}
        <CookieBanner />
      </body>
    </html>
  )
}
