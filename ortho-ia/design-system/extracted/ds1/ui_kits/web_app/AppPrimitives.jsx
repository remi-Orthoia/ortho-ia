// App-scoped primitives
const AppButton = ({ children, variant = 'primary', size = 'md', icon, onClick, style, type }) => {
  const sizes = {
    sm: { padding: '7px 12px', fontSize: 13, borderRadius: 8 },
    md: { padding: '10px 16px', fontSize: 14, borderRadius: 10 },
    lg: { padding: '12px 20px', fontSize: 15, borderRadius: 12 },
  };
  const variants = {
    primary:   { background: 'var(--primary)', color: 'var(--fg-on-brand)', border: '1px solid transparent' },
    accent:    { background: 'var(--accent)',  color: 'var(--brand-sage-900,#1F2A2A)', border: '1px solid transparent' },
    secondary: { background: 'var(--bg-surface)', color: 'var(--fg-1)', border: '1px solid var(--border-strong)' },
    ghost:     { background: 'transparent', color: 'var(--fg-1)', border: '1px solid transparent' },
    danger:    { background: 'var(--danger-soft)', color: 'var(--danger)', border: '1px solid transparent' },
  };
  return (
    <button type={type || 'button'} onClick={onClick} style={{
      display: 'inline-flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap',
      fontFamily: 'var(--font-body)', fontWeight: 500, lineHeight: 1,
      cursor: 'pointer',
      transition: 'background 180ms cubic-bezier(0.32,0.72,0,1)',
      ...sizes[size], ...variants[variant], ...style,
    }}>{icon}{children}</button>
  );
};

const AppInput = ({ label, value, onChange, placeholder, multiline, rows, hint, error, ...rest }) => {
  const Tag = multiline ? 'textarea' : 'input';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {label && <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--fg-2)' }}>{label}</label>}
      <Tag rows={rows} value={value} onChange={onChange} placeholder={placeholder} style={{
        width: '100%', padding: '10px 12px',
        fontFamily: 'var(--font-body)', fontSize: 14, lineHeight: 1.45,
        background: 'var(--bg-surface)', color: 'var(--fg-1)',
        border: '1px solid ' + (error ? 'var(--danger)' : 'var(--border-strong)'),
        borderRadius: 10, outline: 'none', resize: multiline ? 'vertical' : 'none',
      }} {...rest}/>
      {hint && !error && <span style={{ fontSize: 12, color: 'var(--fg-3)' }}>{hint}</span>}
      {error && <span style={{ fontSize: 12, color: 'var(--danger)' }}>{error}</span>}
    </div>
  );
};

const Badge = ({ children, tone = 'neutral' }) => {
  const tones = {
    neutral: { background: 'var(--bg-surface-2)', color: 'var(--fg-2)' },
    primary: { background: 'var(--primary-soft)', color: 'var(--primary)' },
    accent:  { background: 'var(--accent-soft)',  color: 'var(--accent-hover)' },
    success: { background: 'var(--success-soft)', color: 'var(--success)' },
    warning: { background: 'var(--warning-soft)', color: 'var(--warning)' },
    danger:  { background: 'var(--danger-soft)',  color: 'var(--danger)' },
  };
  return <span style={{
    display: 'inline-flex', alignItems: 'center', gap: 6,
    padding: '3px 10px', borderRadius: 999,
    fontSize: 12, fontWeight: 500, fontFamily: 'var(--font-body)',
    ...tones[tone],
  }}>{children}</span>;
};

const IconButton = ({ children, onClick, title }) => (
  <button onClick={onClick} title={title} style={{
    width: 34, height: 34, borderRadius: 10,
    background: 'transparent', border: '1px solid var(--border)',
    color: 'var(--fg-2)', cursor: 'pointer',
    display: 'grid', placeItems: 'center',
  }}>{children}</button>
);

// Lucide-like inline icons (1.75 stroke)
const Icon = ({ d, size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
       strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">{d}</svg>
);
const I = {
  home:    <Icon d={<><path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/></>}/>,
  list:    <Icon d={<><path d="M3 6h18M3 12h18M3 18h18"/></>}/>,
  plus:    <Icon d={<><path d="M12 5v14M5 12h14"/></>}/>,
  search:  <Icon d={<><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></>}/>,
  user:    <Icon d={<><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></>}/>,
  doc:     <Icon d={<><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></>}/>,
  check:   <Icon d={<><path d="M20 6 9 17l-5-5"/></>}/>,
  arrow:   <Icon d={<><path d="M5 12h14M12 5l7 7-7 7"/></>}/>,
  sparkle: <Icon d={<><path d="M12 3l2 5 5 2-5 2-2 5-2-5-5-2 5-2z"/></>}/>,
  download: <Icon d={<><path d="M12 3v12M7 10l5 5 5-5"/><path d="M5 21h14"/></>}/>,
  cog:     <Icon d={<><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></>}/>,
  bell:    <Icon d={<><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/></>}/>,
};

Object.assign(window, { AppButton, AppInput, Badge, IconButton, Icon, I });
