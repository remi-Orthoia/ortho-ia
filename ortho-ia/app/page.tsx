import Link from 'next/link'
import Header from '@/components/landing/Header'
import Hero from '@/components/landing/Hero'
import Steps from '@/components/landing/Steps'
import Ambassador from '@/components/landing/Ambassador'
import Benefits from '@/components/landing/Benefits'
import Quote from '@/components/landing/Quote'
import Pricing from '@/components/landing/Pricing'
import FAQ from '@/components/landing/FAQ'
import Footer from '@/components/landing/Footer'

export default function HomePage() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-canvas)', color: 'var(--fg-1)', fontFamily: 'var(--font-body)' }}>
      {/* Bandeau Beta — info commerciale conservée de l'ancienne version */}
      <Link
        href="/beta"
        style={{
          display: 'block', textAlign: 'center',
          padding: '8px 16px',
          background: 'var(--bg-inverse)', color: 'var(--fg-on-brand)',
          fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 500,
          textDecoration: 'none',
        }}
      >
        ✨ Version beta — <strong>3 mois offerts</strong> pour les premiers orthophonistes ·{' '}
        <span style={{ textDecoration: 'underline', color: 'var(--ds-accent)' }}>Rejoindre la beta →</span>
      </Link>

      <Header />
      <main>
        <Hero />
        <Steps />
        <Ambassador />
        <Benefits />
        <Quote />
        <Pricing />
        <FAQ />
      </main>
      <Footer />
    </div>
  )
}
