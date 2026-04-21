import type { Metadata } from 'next'
import './globals.css'

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
    <html lang="fr">
      <body className="antialiased">
        {children}
      </body>
    </html>
  )
}
