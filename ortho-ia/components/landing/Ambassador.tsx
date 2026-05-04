import { Button, Container, Eyebrow } from './Primitives'

export default function Ambassador() {
  return (
    <section style={{ padding: '96px 0', background: 'var(--bg-canvas)' }}>
      <Container>
        <div className="amb-grid" style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 64, alignItems: 'center' }}>
          {/* Story-format video (9:16) */}
          <div style={{ position: 'relative', width: 320, justifySelf: 'center' }}>
            <div style={{
              width: 320, aspectRatio: '9 / 16',
              borderRadius: 28,
              background: 'linear-gradient(160deg, var(--brand-sage-700) 0%, var(--brand-sage-900) 100%)',
              position: 'relative', overflow: 'hidden',
              boxShadow: '0 30px 60px -28px rgba(31,42,42,0.32)',
              border: '4px solid var(--bg-surface)',
            }}>
              <svg viewBox="0 0 320 569" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} aria-hidden="true">
                <defs>
                  <radialGradient id="portrait" cx="50%" cy="38%" r="55%">
                    <stop offset="0%" stopColor="rgba(250,246,239,0.18)"/>
                    <stop offset="100%" stopColor="rgba(250,246,239,0)"/>
                  </radialGradient>
                </defs>
                <rect width="320" height="569" fill="url(#portrait)"/>
                <circle cx="160" cy="220" r="68" fill="rgba(250,246,239,0.22)"/>
                <path d="M 60 420 Q 160 320 260 420 L 260 569 L 60 569 Z" fill="rgba(250,246,239,0.18)"/>
              </svg>

              <div style={{ position: 'absolute', top: 14, left: 14, right: 14, display: 'flex', gap: 4 }}>
                {[0,1,2,3].map(i => (
                  <span key={i} style={{ flex: 1, height: 3, borderRadius: 999, background: i === 1 ? 'rgba(250,246,239,0.95)' : 'rgba(250,246,239,0.35)' }}/>
                ))}
              </div>

              <div style={{
                position: 'absolute', left: 18, right: 18, bottom: 90,
                padding: '12px 14px',
                background: 'rgba(31,42,42,0.55)', backdropFilter: 'blur(6px)',
                WebkitBackdropFilter: 'blur(6px)',
                borderRadius: 14,
                fontFamily: 'var(--font-body)', fontSize: 14, lineHeight: 1.4,
                color: 'var(--fg-on-brand)',
              }}>
                « Avant, je rentrais à 21 h. Là, je dîne avec mes enfants. »
              </div>

              <button aria-label="Lire la vidéo" style={{
                position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)',
                width: 64, height: 64, borderRadius: 999, border: 0,
                background: 'rgba(250,246,239,0.95)', color: 'var(--brand-sage-900)',
                cursor: 'pointer', display: 'grid', placeItems: 'center',
                boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
              }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
              </button>

              <div style={{
                position: 'absolute', left: 0, right: 0, bottom: 0,
                padding: '14px 18px',
                background: 'linear-gradient(to top, rgba(31,42,42,0.85), transparent)',
                display: 'flex', alignItems: 'center', gap: 10,
                color: 'var(--fg-on-brand)',
              }}>
                <span style={{ width: 32, height: 32, borderRadius: 999, background: 'var(--ds-accent)', color: 'var(--brand-sage-900)', display: 'grid', placeItems: 'center', fontWeight: 600, fontSize: 13 }}>CL</span>
                <div style={{ minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 600 }}>Camille L.</p>
                  <p style={{ margin: '2px 0 0', fontSize: 11, opacity: 0.75 }}>Orthophoniste · Bordeaux</p>
                </div>
              </div>
            </div>

            <div style={{
              position: 'absolute', top: -14, right: -28,
              background: 'var(--ds-accent)', color: 'var(--brand-sage-900)',
              padding: '8px 14px', borderRadius: 999,
              fontSize: 12, fontWeight: 600, transform: 'rotate(6deg)',
              whiteSpace: 'nowrap',
              boxShadow: '0 8px 20px -8px rgba(31,42,42,0.4)',
            }}>
              ★ Notre ambassadrice
            </div>
          </div>

          {/* Right column copy */}
          <div>
            <Eyebrow>Programme ambassadrice</Eyebrow>
            <h2 style={{
              fontFamily: 'var(--font-display)', fontSize: 'clamp(30px, 4.2vw, 44px)', fontWeight: 500,
              lineHeight: 1.1, letterSpacing: '-0.015em', margin: '12px 0 18px',
              textWrap: 'balance', color: 'var(--fg-1)',
            }}>
              Camille rédigeait ses CRBO entre 19 h et 22 h. Plus maintenant —
              et elle aide ses collègues à en faire autant.
            </h2>
            <p style={{ fontSize: 17, lineHeight: 1.6, color: 'var(--fg-2)', margin: '0 0 16px' }}>
              Orthophoniste libérale à Bordeaux, Camille reçoit 11 patients par
              jour. Elle nous raconte en 90 secondes ce qu&apos;Ortho.ia a changé
              dans ses semaines — et pourquoi elle a invité une dizaine de
              consœurs à essayer.
            </p>

            {/* Promesse parrainage — encart */}
            <div style={{
              background: 'var(--ds-accent-soft)',
              border: '1px solid var(--ds-accent)',
              borderRadius: 16, padding: '16px 18px',
              margin: '0 0 24px',
            }}>
              <p style={{
                fontSize: 13, fontWeight: 600, letterSpacing: '0.04em',
                textTransform: 'uppercase', color: 'var(--ds-accent-hover)',
                margin: '0 0 6px',
              }}>
                Parrainez vos collègues
              </p>
              <p style={{ fontSize: 15.5, lineHeight: 1.5, color: 'var(--fg-1)', margin: 0 }}>
                <strong>5€/mois</strong> par filleule active, jusqu&apos;à <strong>100€/mois</strong>.
                Votre filleule paie <strong>14,90€/mois</strong> au lieu de 19,90€.
                Au-dessus de 4 filleules, votre abonnement est intégralement
                couvert.
              </p>
            </div>

            <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
              <Button variant="primary" size="md" href="/auth/register">
                Devenir ambassadrice
              </Button>
              <Button variant="ghost" size="md">Voir la vidéo →</Button>
            </div>
          </div>
        </div>
      </Container>
    </section>
  )
}
