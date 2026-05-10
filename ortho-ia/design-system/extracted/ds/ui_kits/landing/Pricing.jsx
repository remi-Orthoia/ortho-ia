const Pricing = () => {
  const [billing, setBilling] = React.useState('monthly'); // 'monthly' | 'yearly'
  const yearlyDiscount = 0.10;

  const formatPrice = (monthly) => {
    if (billing === 'monthly') return monthly.toFixed(2).replace('.', ',') + ' €';
    const discounted = monthly * (1 - yearlyDiscount);
    // Round to 2 decimals
    return discounted.toFixed(2).replace('.', ',') + ' €';
  };

  const yearlyTotal = (monthly) => {
    const discounted = monthly * (1 - yearlyDiscount) * 12;
    return discounted.toFixed(2).replace('.', ',') + ' €';
  };

  const plans = [
    {
      name: 'Essentiel',
      monthly: 19.90,
      tagline: 'Pour démarrer, ou pour une activité à temps partiel.',
      features: ['Jusqu\'à 10 CRBO par mois', 'Toutes les trames de bilan', 'Export Word personnalisable', 'Sauvegardes chiffrées', 'Support par email'],
      cta: 'Rédiger mon premier CRBO gratuitement',
      featured: false,
    },
    {
      name: 'Cabinet',
      monthly: 39.90,
      tagline: 'Pour une activité libérale à plein régime.',
      features: ['Jusqu\'à 40 CRBO par mois', 'Toutes les trames de bilan', 'Export Word personnalisable', 'Sauvegardes chiffrées', 'Support prioritaire'],
      cta: 'Rédiger mon premier CRBO gratuitement',
      featured: true,
    },
  ];

  const Toggle = () => (
    <div role="tablist" aria-label="Période de facturation" style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      background: 'var(--bg-surface)', border: '1px solid var(--border)',
      borderRadius: 999, padding: 4, marginTop: 20,
    }}>
      {[
        { id: 'monthly', label: 'Mensuel' },
        { id: 'yearly', label: 'Annuel' },
      ].map(opt => {
        const active = billing === opt.id;
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
              background: active ? 'var(--bg-inverse)' : 'transparent',
              color: active ? 'var(--fg-on-brand)' : 'var(--fg-2)',
              transition: 'background 180ms cubic-bezier(0.32,0.72,0,1)',
            }}
          >
            {opt.label}
            {opt.id === 'yearly' && (
              <span style={{
                background: active ? 'var(--accent)' : 'var(--accent-soft)',
                color: active ? 'var(--bg-inverse)' : 'var(--accent-hover)',
                padding: '2px 8px', borderRadius: 999,
                fontSize: 11, fontWeight: 600, letterSpacing: '0.02em',
              }}>−10 %</span>
            )}
          </button>
        );
      })}
    </div>
  );

  return (
    <section style={{ padding: '96px 0' }}>
      <Container style={{ maxWidth: 1080 }}>
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <Eyebrow>Tarifs</Eyebrow>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 44, fontWeight: 500, lineHeight: 1.1, letterSpacing: '-0.015em', margin: '12px 0 12px', textWrap: 'balance' }}>
            Un prix qui se rembourse en deux soirées.
          </h2>
          <p style={{ fontSize: 16, color: 'var(--fg-2)', margin: 0 }}>Sans engagement. Résiliable à tout moment.</p>
          <Toggle />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          {plans.map(p => (
            <div key={p.name} style={{
              background: p.featured ? 'var(--bg-inverse)' : 'var(--bg-surface)',
              color: p.featured ? 'var(--fg-on-brand)' : 'var(--fg-1)',
              border: '1px solid ' + (p.featured ? 'transparent' : 'var(--border)'),
              borderRadius: 24, padding: 32,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 600, margin: 0 }}>{p.name}</h3>
                {p.featured && <span style={{ background: 'var(--accent)', color: 'var(--bg-inverse)', padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap' }}>Le plus choisi</span>}
              </div>
              <p style={{ fontSize: 14, opacity: p.featured ? 0.75 : 1, color: p.featured ? 'rgba(250,246,239,0.75)' : 'var(--fg-2)', margin: '0 0 22px' }}>{p.tagline}</p>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 6, flexWrap: 'nowrap', whiteSpace: 'nowrap' }}>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: 52, fontWeight: 500, letterSpacing: '-0.02em', lineHeight: 1 }}>{formatPrice(p.monthly)}</span>
                <span style={{ fontSize: 14, opacity: 0.7, whiteSpace: 'nowrap' }}>/ mois</span>
              </div>
              <p style={{
                fontSize: 13,
                color: p.featured ? 'rgba(250,246,239,0.65)' : 'var(--fg-3)',
                margin: '0 0 24px', minHeight: 18,
              }}>
                {billing === 'yearly'
                  ? `Soit ${yearlyTotal(p.monthly)} facturés une fois par an.`
                  : 'Facturé chaque mois.'}
              </p>
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 28px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                {p.features.map(f => (
                  <li key={f} style={{ fontSize: 14, display: 'flex', gap: 10, alignItems: 'flex-start', lineHeight: 1.45 }}>
                    <span style={{ color: p.featured ? 'var(--accent)' : 'var(--primary)', flex: '0 0 auto', lineHeight: 1.45 }}>✓</span>
                    <span style={{ flex: 1, minWidth: 0 }}>{f}</span>
                  </li>
                ))}
              </ul>
              <Button variant={p.featured ? 'accent' : 'primary'} size="lg" style={{ width: '100%', justifyContent: 'center' }}>{p.cta}</Button>
              <p style={{
                fontSize: 12, textAlign: 'center', margin: '14px 0 0',
                color: p.featured ? 'rgba(250,246,239,0.65)' : 'var(--fg-3)',
              }}>
                Sans carte bancaire · 3 CRBO offerts
              </p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
};
window.Pricing = Pricing;
