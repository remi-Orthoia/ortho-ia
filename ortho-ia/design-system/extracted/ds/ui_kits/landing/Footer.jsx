const Footer = () => (
  <footer style={{ padding: '64px 0 40px', background: 'var(--bg-canvas)', borderTop: '1px solid var(--border)' }}>
    <Container>
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 48, marginBottom: 48 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <img src="../../assets/logos/ortho-ia-symbol-A.svg" alt="" style={{ width: 28, height: 28 }}/>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 500, letterSpacing: '-0.02em' }}>
              Ortho<span style={{ color: 'var(--primary)' }}>.</span><span style={{ color: 'var(--accent)' }}>ia</span>
            </span>
          </div>
          <p style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--fg-2)', maxWidth: 320, margin: 0 }}>
            La plume rapide des orthophonistes — pour vous laisser plus de temps avec vos patients.
          </p>
        </div>
        {[
          { title: 'Produit', links: ['Comment ça marche', 'Tarifs', 'Sécurité & RGPD', 'Changelog'] },
          { title: 'Ressources', links: ['Blog', 'Webinaires', 'Ressources partagées', 'Centre d\'aide'] },
          { title: 'Contact', links: ['Nous écrire', 'Démo personnalisée', 'Demande presse'] },
        ].map(col => (
          <div key={col.title}>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--fg-3)', margin: '0 0 14px' }}>{col.title}</p>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {col.links.map(l => (
                <li key={l}><a href="#" style={{ fontSize: 14, color: 'var(--fg-2)', textDecoration: 'none' }}>{l}</a></li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 24, borderTop: '1px solid var(--border)', fontSize: 13, color: 'var(--fg-3)' }}>
        <span>© 2026 Ortho.ia · Hébergement HDS · RGPD</span>
        <span>Fait à Paris, avec des orthophonistes en exercice.</span>
      </div>
    </Container>
  </footer>
);
window.Footer = Footer;
