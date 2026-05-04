import { Container, Eyebrow } from './Primitives'

const STEPS = [
  { n: '01', title: 'Vous saisissez votre bilan', body: 'Anamnèse, observations, scores aux batteries — dans une trame conçue par des orthophonistes en exercice.' },
  { n: '02', title: 'Ortho.ia rédige le compte-rendu', body: 'Un rapport Word structuré, dans un style sobre et professionnel, généré en quelques minutes.' },
  { n: '03', title: 'Vous relisez, ajustez, signez', body: "Tout reste modifiable. Le rapport sortant est le vôtre — Ortho.ia n'est qu'une plume rapide." },
]

export default function Steps() {
  return (
    <section id="comment-ca-marche" style={{ padding: '96px 0', background: 'var(--bg-surface-2)' }}>
      <Container>
        <Eyebrow>Comment ça marche</Eyebrow>
        <h2 style={{
          fontFamily: 'var(--font-display)', fontSize: 'clamp(32px, 4.5vw, 44px)', fontWeight: 500,
          lineHeight: 1.1, letterSpacing: '-0.015em', margin: '12px 0 56px',
          color: 'var(--fg-1)',
        }}>
          Trois étapes.<br />
          Le rapport est prêt avant la fin du créneau suivant.
        </h2>
        <div className="steps-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
          {STEPS.map(it => (
            <div key={it.n} style={{
              background: 'var(--bg-surface)', border: '1px solid var(--border-ds)',
              borderRadius: 20, padding: 28,
            }}>
              <span style={{
                fontFamily: 'var(--font-display)', fontSize: 36, fontWeight: 500,
                color: 'var(--ds-accent)', letterSpacing: '-0.02em',
              }}>{it.n}</span>
              <h3 style={{
                fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 600,
                margin: '14px 0 10px', lineHeight: 1.25, color: 'var(--fg-1)',
              }}>{it.title}</h3>
              <p style={{ fontSize: 15, lineHeight: 1.55, color: 'var(--fg-2)', margin: 0 }}>{it.body}</p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  )
}
