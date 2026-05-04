import { Container, Eyebrow } from './Primitives'

const STATS = [
  { value: '2–3 h', unit: 'par semaine', label: 'récupérées sur la rédaction de comptes-rendus' },
  { value: '5 min', unit: 'en moyenne', label: 'pour générer un premier rapport relisible' },
  { value: '0',     unit: 'bilan en retard', label: 'la pile fond, et avec elle la petite voix qui vous demande de vous faire discrète' },
]

export default function Benefits() {
  return (
    <section style={{ padding: '96px 0' }}>
      <Container>
        <div className="ben-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, alignItems: 'center' }}>
          <div>
            <Eyebrow>Bénéfices</Eyebrow>
            <h2 style={{
              fontFamily: 'var(--font-display)', fontSize: 'clamp(30px, 4.2vw, 44px)', fontWeight: 500,
              lineHeight: 1.1, letterSpacing: '-0.015em', margin: '12px 0 20px',
              textWrap: 'balance', color: 'var(--fg-1)',
            }}>
              Reprenez la main sur votre file d&apos;attente — et sur vos soirées.
            </h2>
            <p style={{ fontSize: 17, lineHeight: 1.6, color: 'var(--fg-2)', margin: '0 0 16px', maxWidth: 480 }}>
              On sait à quoi ressemble une journée à 4 bilans, et combien
              de soirées sont sacrifiées au compte-rendu. Ortho.ia vous
              en rend une bonne partie — sans rien retirer à la qualité
              de ce que vous transmettez à vos confrères et aux familles.
            </p>
            <p style={{ fontSize: 17, lineHeight: 1.6, color: 'var(--fg-2)', margin: 0, maxWidth: 480 }}>
              Et la pile de CRBO en retard ? Elle fond, semaine après semaine.
              Plus besoin de croiser les doigts pour qu&apos;aucune famille,
              aucun médecin ne vous le réclame : vous reprenez l&apos;initiative,
              avec sérénité.
            </p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {STATS.map(s => (
              <div key={s.value} style={{
                background: 'var(--bg-surface)', border: '1px solid var(--border-ds)',
                borderRadius: 20, padding: '24px 28px',
                display: 'flex', alignItems: 'baseline', gap: 16,
              }}>
                <span style={{
                  fontFamily: 'var(--font-display)', fontSize: 48, fontWeight: 500,
                  color: 'var(--ds-primary)', letterSpacing: '-0.02em',
                  lineHeight: 1, whiteSpace: 'nowrap', flex: '0 0 auto',
                }}>{s.value}</span>
                <div>
                  <p style={{ fontSize: 13, color: 'var(--fg-3)', margin: 0, letterSpacing: '0.04em', textTransform: 'uppercase', fontWeight: 600 }}>{s.unit}</p>
                  <p style={{ fontSize: 15, color: 'var(--fg-1)', margin: '4px 0 0', lineHeight: 1.4 }}>{s.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Container>
    </section>
  )
}
