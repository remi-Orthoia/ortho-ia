// Shared primitives for landing
const Container = ({ children, style }) => (
  <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 32px', ...style }}>{children}</div>
);

const Button = ({ children, variant = 'primary', size = 'md', as = 'button', href, onClick, style }) => {
  const sizes = {
    sm: { padding: '8px 14px', fontSize: 13 },
    md: { padding: '12px 20px', fontSize: 15 },
    lg: { padding: '16px 28px', fontSize: 16 },
  };
  const variants = {
    primary:   { background: 'var(--primary)', color: 'var(--fg-on-brand)', border: '1px solid transparent' },
    accent:    { background: 'var(--accent)',  color: 'var(--brand-sage-900, #1F2A2A)', border: '1px solid transparent' },
    secondary: { background: 'var(--bg-surface)', color: 'var(--fg-1)', border: '1px solid var(--border-strong)' },
    ghost:     { background: 'transparent', color: 'var(--fg-1)', border: '1px solid transparent' },
  };
  const css = {
    display: 'inline-flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap',
    fontFamily: 'var(--font-body)', fontWeight: 500, lineHeight: 1,
    borderRadius: 999, cursor: 'pointer',
    transition: 'background 180ms cubic-bezier(0.32,0.72,0,1), transform 120ms',
    ...sizes[size], ...variants[variant], ...style,
  };
  if (as === 'a' || href) return <a href={href} style={css} onClick={onClick}>{children}</a>;
  return <button style={css} onClick={onClick}>{children}</button>;
};

const Eyebrow = ({ children, style }) => (
  <span style={{
    fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 600,
    letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--fg-2)',
    ...style,
  }}>{children}</span>
);

Object.assign(window, { Container, Button, Eyebrow });
