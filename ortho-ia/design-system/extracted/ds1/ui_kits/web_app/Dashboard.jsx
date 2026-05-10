const Dashboard = ({ onOpenBilan, onNew }) => {
  const bilans = [
    { id: 'b1', name: 'Léa Martin', age: 7, kind: 'Langage écrit', date: '12 mars', status: 'Brouillon', tone: 'neutral' },
    { id: 'b2', name: 'Paul Bernard', age: 4, kind: 'Langage oral', date: '14 mars', status: 'À relire', tone: 'warning' },
    { id: 'b3', name: 'Inès Kaci',    age: 6, kind: 'Articulation', date: '15 mars', status: 'À relire', tone: 'warning' },
    { id: 'b4', name: 'Marc Dubois', age: 68, kind: 'Voix',         date: '16 mars', status: 'Validé', tone: 'success' },
    { id: 'b5', name: 'Tom Renaud',  age: 5,  kind: 'Bégaiement',   date: '17 mars', status: 'Validé', tone: 'success' },
  ];

  const stats = [
    { value: 12, label: 'Bilans ce mois-ci' },
    { value: '~ 5 h', label: 'récupérées sur la rédaction' },
    { value: 3, label: 'à relire' },
  ];

  return (
    <div style={{ padding: '28px 32px 48px' }} data-screen-label="Dashboard">
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 28 }}>
        {stats.map(s => (
          <div key={s.label} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 16, padding: '18px 22px' }}>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 500, letterSpacing: '-0.015em', margin: 0, color: 'var(--primary)', lineHeight: 1.1 }}>{s.value}</p>
            <p style={{ margin: '6px 0 0', fontSize: 13, color: 'var(--fg-2)' }}>{s.label}</p>
          </div>
        ))}
      </section>

      <section style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 18 }}>
        <header style={{ padding: '18px 22px', display: 'flex', alignItems: 'center', gap: 12, borderBottom: '1px solid var(--border)' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 600, margin: 0, whiteSpace: 'nowrap' }}>Bilans récents</h2>
          <span style={{ marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: 8, padding: '7px 12px', background: 'var(--bg-surface-2)', borderRadius: 10, color: 'var(--fg-3)', fontSize: 13 }}>
            {I.search}<span>Rechercher un patient</span>
          </span>
          <AppButton variant="primary" size="sm" icon={I.plus} onClick={onNew}>Nouveau bilan</AppButton>
        </header>
        <div>
          {bilans.map((b, i) => (
            <button key={b.id} onClick={() => onOpenBilan && onOpenBilan(b)} style={{
              width: '100%', textAlign: 'left',
              display: 'grid', gridTemplateColumns: '2.2fr 1fr 100px 130px 32px', gap: 16, alignItems: 'center',
              padding: '16px 22px',
              background: 'transparent', border: 0, borderTop: i === 0 ? 0 : '1px solid var(--border)',
              cursor: 'pointer', fontFamily: 'var(--font-body)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ width: 36, height: 36, borderRadius: 999, background: 'var(--primary-soft)', color: 'var(--primary)', display: 'grid', placeItems: 'center', fontWeight: 600, fontSize: 13 }}>
                  {b.name.split(' ').map(n => n[0]).join('')}
                </span>
                <div style={{ minWidth: 0 }}>
                  <p style={{ margin: 0, fontWeight: 600, fontSize: 14, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{b.name}</p>
                  <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--fg-3)' }}>{b.age} ans</p>
                </div>
              </div>
              <span style={{ fontSize: 13, color: 'var(--fg-2)' }}>{b.kind}</span>
              <span style={{ fontSize: 13, color: 'var(--fg-3)' }}>{b.date}</span>
              <Badge tone={b.tone}>{b.status}</Badge>
              <span style={{ color: 'var(--fg-3)' }}>{I.arrow}</span>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
};
window.Dashboard = Dashboard;
