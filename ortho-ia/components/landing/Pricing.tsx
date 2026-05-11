'use client'

import { useState } from 'react'
import { Button, Container, Eyebrow } from './Primitives'

interface Plan {
  name: string
  /** Prix mensuel TTC en facturation au mois. */
  monthly: number
  /** Prix mensuel ÉQUIVALENT affiché en mode annuel (gros chiffre dans la carte). */
  yearlyMonthly: number
  /** Total annuel TTC à afficher en mode annuel ("Soit X € facturés une fois par an"). */
  yearlyTotal: number
  tagline: string
  features: string[]
  cta: string
  ctaHref: string
  featured: boolean
}

// Tarification ortho.ia validée :
//   Ortho Pro    : 19,90€/mois OU 17,90€/mois en annuel = 215,00€/an (arrondi marketing — 17.90×12=214.80)
//   Cabinet      : 39,90€/mois OU 35,90€/mois en annuel = 430,80€/an
// Le mois annuel affiché est volontairement le prix marketing rond
// (17,90 / 35,90), pas le yearlyTotal/12 strict.
const PLANS: Plan[] = [
  {
    name: 'Ortho pro',
    monthly: 19.90,
    yearlyMonthly: 17.90,
    yearlyTotal: 215.00,
    tagline: 'Pour démarrer, ou pour une activité à temps partiel.',
    features: [
      "Jusqu'à 10 CRBO par mois",
      'Toutes les trames de bilan',
      'Export Word personnalisable',
      'Sauvegardes chiffrées',
      'Support par email, téléphone ou visio !',
    ],
    cta: 'Essayer gratuitement',
    ctaHref: '/auth/register',
    featured: true,
  },
  {
    name: 'Cabinet',
    monthly: 39.90,
    yearlyMonthly: 35.90,
    yearlyTotal: 430.80,
    tagline: 'Pour une activité libérale à plein régime.',
    features: [
      "Jusqu'à 40 CRBO par mois",
      'Toutes les trames de bilan',
      'Export Word personnalisable',
      'Sauvegardes chiffrées',
      'Support prioritaire',
    ],
    cta: 'Essayer gratuitement',
    ctaHref: '/auth/register',
    featured: false,
  },
]

const fmt = (n: number) => n.toFixed(2).replace('.', ',') + ' €'

export default function Pricing() {
  const [billing, setBilling] = useState<'monthly' | 'yearly'>('monthly')

  const monthlyPriceShown = (p: Plan) =>
    fmt(billing === 'monthly' ? p.monthly : p.yearlyMonthly)

  const yearlyTotalShown = (p: Plan) => fmt(p.yearlyTotal)

  return (
    <section id="tarifs" style={{ padding: '96px 0' }}>
      <Container style={{ maxWidth: 1080 }}>
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <Eyebrow>Tarifs</Eyebrow>
          <h2 style={{
            fontFamily: 'var(--font-display)', fontSize: 'clamp(30px, 4.4vw, 44px)', fontWeight: 500,
            lineHeight: 1.1, letterSpacing: '-0.015em', margin: '12px 0 12px',
            textWrap: 'balance', color: 'var(--fg-1)',
          }}>
            Un prix qui se rembourse en deux soirées, littéralement :
          </h2>
          <p style={{ fontSize: 16, color: 'var(--fg-2)', margin: 0 }}>
            Sans engagement. Résiliable à tout moment.
          </p>

          <div role="tablist" aria-label="Période de facturation" style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            background: 'var(--bg-surface)', border: '1px solid var(--border-ds)',
            borderRadius: 999, padding: 4, marginTop: 20,
          }}>
            {([
              { id: 'monthly', label: 'Mensuel' },
              { id: 'yearly',  label: 'Annuel' },
            ] as const).map(opt => {
              const active = billing === opt.id
              return (
                <button
                  key={opt.id}
                  role="tab"
                  aria-selected={active}
                  onClick={() => setBilling(opt.id)}
                  style={{
                    fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 500,
                    padding: '8px 16px', borderRadius: 999, cursor: 'pointer',
                    border: 'none', display: 'inline-flex', alignItems: 'center', gap: 8,
                    background: active ? 'var(--ds-primary)' : 'transparent',
                    color: active ? 'var(--fg-on-brand)' : 'var(--fg-2)',
                    transition: 'background 180ms cubic-bezier(0.32,0.72,0,1)',
                  }}
                >
                  {opt.label}
                  {opt.id === 'yearly' && (
                    <span style={{
                      background: active ? 'var(--ds-accent)' : 'var(--ds-accent-soft)',
                      color: active ? 'var(--bg-inverse)' : 'var(--ds-accent-hover)',
                      padding: '2px 8px', borderRadius: 999,
                      fontSize: 11, fontWeight: 600, letterSpacing: '0.02em',
                    }}>−10 %</span>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        <div className="pricing-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, alignItems: 'stretch' }}>
          {PLANS.map(p => (
            <div key={p.name} style={{
              background: 'var(--bg-surface)',
              color: 'var(--fg-1)',
              border: p.featured ? '2px solid var(--ds-primary)' : '1px solid var(--border-ds)',
              borderRadius: 24,
              padding: p.featured ? 36 : 32,
              boxShadow: p.featured ? 'var(--shadow-md)' : 'none',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 600, margin: 0 }}>{p.name}</h3>
                {p.featured && (
                  <span style={{
                    background: 'var(--ds-primary)', color: 'var(--fg-on-brand)',
                    padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap',
                  }}>Le plus choisi</span>
                )}
              </div>
              <p style={{ fontSize: 14, color: 'var(--fg-2)', margin: '0 0 22px' }}>{p.tagline}</p>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 6, flexWrap: 'nowrap', whiteSpace: 'nowrap' }}>
                <span style={{
                  fontFamily: 'var(--font-display)', fontSize: 52, fontWeight: 500,
                  letterSpacing: '-0.02em', lineHeight: 1,
                }}>{monthlyPriceShown(p)}</span>
                <span style={{ fontSize: 14, opacity: 0.7, whiteSpace: 'nowrap' }}>/ mois</span>
              </div>
              <p style={{
                fontSize: 13, color: 'var(--fg-3)', margin: '0 0 6px', minHeight: 18,
              }}>
                {billing === 'yearly'
                  ? `Soit ${yearlyTotalShown(p)} facturés une fois par an.`
                  : 'Facturé chaque mois.'}
              </p>
              {/* Footnote parrainage — uniquement sur le plan Ortho pro
                  (le plus probable pour une nouvelle inscrite) et en mensuel
                  (la remise -5€ s'applique sur le mensuel). */}
              {p.name === 'Ortho pro' && billing === 'monthly' && (
                <p style={{
                  fontSize: 13, color: 'var(--ds-primary)',
                  margin: '0 0 24px', fontWeight: 500,
                }}>
                  💚 Parrainée par une collègue ? <strong>14,90€/mois</strong>
                </p>
              )}
              {!(p.name === 'Ortho pro' && billing === 'monthly') && (
                <div style={{ marginBottom: 24 }} />
              )}
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 28px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                {p.features.map(f => (
                  <li key={f} style={{ fontSize: 14, display: 'flex', gap: 10, alignItems: 'flex-start', lineHeight: 1.45 }}>
                    <span style={{ color: 'var(--ds-primary)', flex: '0 0 auto', lineHeight: 1.45 }}>✓</span>
                    <span style={{ flex: 1, minWidth: 0 }}>{f}</span>
                  </li>
                ))}
              </ul>
              <Button variant="primary" size="lg" href={p.ctaHref} style={{ width: '100%', justifyContent: 'center' }}>
                {p.cta}
              </Button>
              <p style={{
                fontSize: 12, textAlign: 'center', margin: '14px 0 0', color: 'var(--fg-3)',
              }}>
                Sans carte bancaire · 3 CRBO offerts
              </p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  )
}
