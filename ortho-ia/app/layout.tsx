import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Ortho.ia - Génération de CRBO par IA',
  description: 'Réduisez votre temps de rédaction de comptes rendus de bilan orthophonique grâce à l\'intelligence artificielle.',
  keywords: 'orthophonie, CRBO, compte rendu, bilan orthophonique, IA, intelligence artificielle',
  authors: [{ name: 'Ortho.ia' }],
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
