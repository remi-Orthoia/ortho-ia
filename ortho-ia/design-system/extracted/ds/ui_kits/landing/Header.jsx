const Header = () => (
  <header style={{
    position: 'sticky', top: 0, zIndex: 10,
    background: 'rgba(250, 246, 239, 0.85)',
    backdropFilter: 'blur(12px)',
    borderBottom: '1px solid var(--border)',
  }}>
    <Container style={{ display: 'flex', alignItems: 'center', height: 72, gap: 24 }}>
      <a href="#" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
        <img src="../../assets/logos/ortho-ia-symbol-A.svg" alt="" style={{ width: 32, height: 32 }}/>
        <span style={{
          fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 500,
          letterSpacing: '-0.02em', color: 'var(--fg-1)',
        }}>
          Ortho<span style={{ color: 'var(--primary)' }}>.</span><span style={{ color: 'var(--accent)' }}>ia</span>
        </span>
      </a>
      <nav style={{ display: 'flex', gap: 28, marginLeft: 32 }}>
        {['Comment ça marche', 'Tarifs', 'Témoignages', 'FAQ'].map(l => (
          <a key={l} href="#" style={{
            fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 500,
            color: 'var(--fg-2)', textDecoration: 'none',
          }}>{l}</a>
        ))}
      </nav>
      <div style={{ marginLeft: 'auto', display: 'flex', gap: 10, alignItems: 'center' }}>
        <Button variant="ghost" size="sm">Se connecter</Button>
        <Button variant="primary" size="sm">Rédiger mon premier CRBO gratuitement</Button>
      </div>
    </Container>
  </header>
);

window.Header = Header;
