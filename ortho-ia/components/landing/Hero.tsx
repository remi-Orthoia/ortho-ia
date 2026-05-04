import { Button, Container, Eyebrow } from './Primitives'

export default function Hero() {
  return (
    <section style={{ padding: '80px 0 96px', position: 'relative', overflow: 'hidden' }}>
      <Container>
        <div className="hero-grid" style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: 64, alignItems: 'center' }}>
          <div>
            <Eyebrow>Pour les orthophonistes libérales</Eyebrow>
            <h1 style={{
              fontFamily: 'var(--font-display)', fontSize: 'clamp(40px, 6vw, 64px)', fontWeight: 500,
              lineHeight: 1.05, letterSpacing: '-0.02em', margin: '14px 0 20px',
              color: 'var(--fg-1)', textWrap: 'balance',
            }}>
              Votre CRBO, en moins de temps qu&apos;un thé.
            </h1>
            <p style={{
              fontSize: 19, lineHeight: 1.55, color: 'var(--fg-2)',
              maxWidth: 580, margin: 0,
            }}>
              Vous saisissez ou dictez vos observations.<br />
              Ortho.ia rédige un compte-rendu structuré, fidèle à votre style.<br />
              Vous gardez la main, à chaque ligne.
            </p>
            <div style={{ display: 'flex', gap: 12, marginTop: 32, alignItems: 'center', flexWrap: 'wrap' }}>
              <Button variant="primary" size="lg" href="/auth/register">Essayer gratuitement</Button>
              <Button variant="ghost" size="lg" href="#comment-ca-marche">
                Voir une démo
                <span style={{ fontSize: 18 }}>→</span>
              </Button>
            </div>
            <p style={{ fontSize: 13, color: 'var(--fg-3)', marginTop: 16 }}>
              Sans carte bancaire · 3 CRBO offerts · Données sécurisées · RGPD &amp; secret médical.
            </p>
          </div>

          {/* Mockup décor : aperçu d'un rapport en train d'être généré */}
          <div style={{ position: 'relative' }}>
            <div style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-ds)',
              borderRadius: 24, padding: 28,
              boxShadow: '0 30px 60px -30px rgba(31,42,42,0.18)',
              transform: 'rotate(-1deg)',
            }}>
              <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
                <span style={{ width: 10, height: 10, borderRadius: 999, background: 'var(--border-ds-strong)' }}/>
                <span style={{ width: 10, height: 10, borderRadius: 999, background: 'var(--border-ds-strong)' }}/>
                <span style={{ width: 10, height: 10, borderRadius: 999, background: 'var(--border-ds-strong)' }}/>
              </div>
              <p style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 500, margin: '0 0 4px' }}>
                Compte-rendu de bilan orthophonique
              </p>
              <p style={{ fontSize: 13, color: 'var(--fg-3)', margin: '0 0 18px' }}>Léa M., 7 ans · 12 mars 2026</p>
              <div style={{ height: 1, background: 'var(--border-ds)', margin: '14px 0' }}/>
              <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--fg-2)', margin: '0 0 6px', letterSpacing: '0.04em', textTransform: 'uppercase' }}>Anamnèse</p>
              <p style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--fg-1)', margin: '0 0 14px' }}>
                Léa est adressée par son enseignante de CE1 pour des difficultés
                de lecture persistantes malgré un suivi en classe…
              </p>
              <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--fg-2)', margin: '0 0 6px', letterSpacing: '0.04em', textTransform: 'uppercase' }}>Conclusion</p>
              <p style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--fg-1)', margin: 0 }}>
                Les épreuves objectivent un trouble spécifique du langage écrit
                d&apos;intensité modérée. Une rééducation hebdomadaire est indiquée…
              </p>
              <div style={{ marginTop: 18, padding: '10px 14px', background: 'var(--ds-success-soft)', color: 'var(--ds-success)', borderRadius: 12, fontSize: 13, fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                <span>✓</span> Rapport prêt — 4 min 12 s
              </div>
            </div>
            <div style={{
              position: 'absolute', top: -16, right: -10,
              background: 'var(--ds-accent-soft)', color: 'var(--ds-accent-hover)',
              borderRadius: 999, padding: '6px 14px',
              fontSize: 12, fontWeight: 600,
              transform: 'rotate(4deg)',
            }}>
              ~50 min économisées
            </div>
          </div>
        </div>
      </Container>
    </section>
  )
}
