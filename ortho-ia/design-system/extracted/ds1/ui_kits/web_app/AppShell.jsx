const Sidebar = ({ active, onNav }) => {
  const items = [
    { id: 'dashboard', label: 'Mes bilans', icon: I.list },
    { id: 'patients',  label: 'Patientèle', icon: I.user },
    { id: 'templates', label: 'Trames',     icon: I.doc  },
    { id: 'settings',  label: 'Paramètres', icon: I.cog  },
  ];
  return (
    <aside style={{
      width: 240, flex: '0 0 auto',
      background: 'var(--bg-surface)',
      borderRight: '1px solid var(--border)',
      display: 'flex', flexDirection: 'column',
      padding: '20px 14px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '4px 10px 18px' }}>
        <img src="../../assets/logos/ortho-ia-symbol-A.svg" alt="" style={{ width: 30, height: 30 }}/>
        <span style={{ fontFamily: 'var(--font-display)', fontSize: 19, fontWeight: 500, letterSpacing: '-0.02em' }}>
          Ortho<span style={{ color: 'var(--primary)' }}>.</span><span style={{ color: 'var(--accent)' }}>ia</span>
        </span>
      </div>

      <AppButton variant="primary" size="md" icon={I.plus} style={{ width: '100%', justifyContent: 'center', marginBottom: 18 }} onClick={() => onNav && onNav('new-bilan')}>
        Nouveau bilan
      </AppButton>

      <nav style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {items.map(it => {
          const isActive = it.id === active;
          return (
            <button key={it.id} onClick={() => onNav && onNav(it.id)} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '9px 10px', borderRadius: 10,
              background: isActive ? 'var(--primary-soft)' : 'transparent',
              color: isActive ? 'var(--primary)' : 'var(--fg-2)',
              border: 0, cursor: 'pointer', textAlign: 'left',
              fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: isActive ? 600 : 500,
            }}>
              <span style={{ display: 'grid', placeItems: 'center', width: 18 }}>{it.icon}</span>
              {it.label}
            </button>
          );
        })}
      </nav>

      <div style={{ marginTop: 'auto', padding: '12px 10px', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ width: 32, height: 32, borderRadius: 999, background: 'var(--accent-soft)', color: 'var(--accent-hover)', display: 'grid', placeItems: 'center', fontWeight: 600, fontSize: 13 }}>JM</span>
        <div style={{ minWidth: 0 }}>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 600 }}>Julie Moreau</p>
          <p style={{ margin: 0, fontSize: 12, color: 'var(--fg-3)' }}>Cabinet · Lyon 6e</p>
        </div>
      </div>
    </aside>
  );
};

const AppHeader = ({ title, subtitle, right }) => (
  <header style={{
    height: 72, padding: '0 32px',
    display: 'flex', alignItems: 'center', gap: 16,
    background: 'var(--bg-canvas)',
    borderBottom: '1px solid var(--border)',
  }}>
    <div>
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 600, margin: 0, lineHeight: 1.2 }}>{title}</h1>
      {subtitle && <p style={{ margin: '2px 0 0', fontSize: 13, color: 'var(--fg-3)' }}>{subtitle}</p>}
    </div>
    <div style={{ marginLeft: 'auto', display: 'flex', gap: 10, alignItems: 'center' }}>
      {right}
    </div>
  </header>
);

const AppShell = ({ active, onNav, header, children }) => (
  <div style={{ display: 'flex', height: '100vh', minHeight: 720, background: 'var(--bg-canvas)' }}>
    <Sidebar active={active} onNav={onNav}/>
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
      {header}
      <div style={{ flex: 1, overflow: 'auto' }}>{children}</div>
    </div>
  </div>
);

Object.assign(window, { Sidebar, AppHeader, AppShell });
