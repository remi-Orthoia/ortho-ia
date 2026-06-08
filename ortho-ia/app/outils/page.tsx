import type { Metadata } from 'next'
import Header from '@/components/landing/Header'
import Footer from '@/components/landing/Footer'
import { Container, Eyebrow } from '@/components/landing/Primitives'
import { OutilCard } from '@/components/blog/OutilCard'

const BASE_URL = 'https://ortho-ia.com'

export const metadata: Metadata = {
  title: 'Outils pour orthophonistes · Ortho.ia',
  description:
    "Générateur de CRBO, convertisseur de percentiles Exalang, modèles de PAP… Des outils pratiques pour les orthophonistes et logopèdes.",
  alternates: { canonical: `${BASE_URL}/outils` },
  openGraph: {
    title: 'Outils pour orthophonistes · Ortho.ia',
    url: `${BASE_URL}/outils`,
    type: 'website',
    locale: 'fr_FR',
  },
}

export const dynamic = 'force-static'

const OUTILS = [
  {
    title: 'Générateur de CRBO',
    description: "Importez vos résultats de bilan, et Ortho.ia rédige le compte rendu complet en 5 minutes : structuré, cliniquement précis, prêt à signer.",
    icon: '📝',
    status: 'available' as const,
    href: '/auth/register',
    tag: 'Disponible',
  },
  {
    title: 'Import PDF de bilans',
    description: "Glissez le PDF de vos passations (Exalang, EVALEO, BETL…) : Ortho.ia extrait automatiquement les scores et les place dans le bon formulaire.",
    icon: '📄',
    status: 'available' as const,
    href: '/auth/register',
    tag: 'Disponible',
  },
  {
    title: 'Convertisseur percentile Exalang',
    description: "Collez un tableau de résultats Exalang et obtenez les percentiles exacts (Q1 = P25, Médiane = P50…) avec la bande clinique correspondante.",
    icon: '🔢',
    status: 'coming-soon' as const,
    tag: 'Bientôt',
  },
  {
    title: 'Générateur de PAP',
    description: "Sélectionnez les profils et difficultés observées : l'outil génère un plan d'aménagements pédagogiques conforme aux attentes de l'Éducation nationale.",
    icon: '📋',
    status: 'coming-soon' as const,
    tag: 'Bientôt',
  },
  {
    title: 'Modèles de courrier',
    description: "Courriers type au médecin prescripteur, aux enseignants, à la MDPH, aux parents. En langage clair, personnalisables en 30 secondes.",
    icon: '✉️',
    status: 'coming-soon' as const,
    tag: 'Bientôt',
  },
  {
    title: 'Tableau de bord cabinet',
    description: "Suivez vos bilans en cours, les renouvellements à prévoir, et vos statistiques patient sans changer d'outil.",
    icon: '📊',
    status: 'coming-soon' as const,
    tag: 'Bientôt',
  },
]

export default function OutilsPage() {
  return (
    <>
      <Header />
      <div style={{ background: 'var(--bg-canvas)', minHeight: '100vh' }}>
        <main>
          <Container style={{ maxWidth: 900, padding: '80px 24px 96px' }}>
            <Eyebrow>Boîte à outils</Eyebrow>
            <h1
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(32px, 5vw, 50px)',
                fontWeight: 500, lineHeight: 1.1,
                letterSpacing: '-0.015em',
                margin: '12px 0 16px',
                textWrap: 'balance',
                color: 'var(--fg-1)',
              } as React.CSSProperties}
            >
              Des outils taillés pour les orthophonistes
            </h1>
            <p style={{ fontSize: 17, lineHeight: 1.6, color: 'var(--fg-2)', margin: '0 0 56px', maxWidth: 580 }}>
              Moins de paperasse, plus de temps en séance. Chaque outil résout un problème réel
              identifié avec des orthophonistes en exercice.
            </p>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: 20,
            }}>
              {OUTILS.map((outil) => (
                <OutilCard key={outil.title} {...outil} />
              ))}
            </div>
          </Container>
        </main>
      </div>
      <Footer />
    </>
  )
}
