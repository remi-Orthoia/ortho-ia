// Login screen
const Login = ({ onLogin }) => {
  const [email, setEmail] = React.useState('julie.moreau@cabinet-lyon.fr');
  const [pwd, setPwd] = React.useState('••••••••••');
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', height: '100vh', minHeight: 720 }} data-screen-label="Login">
      <div style={{
        background: 'var(--bg-inverse)', color: 'var(--fg-on-brand)',
        padding: '64px 56px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <img src="../../assets/logos/ortho-ia-symbol-A.svg" alt="" style={{ width: 36, height: 36 }}/>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 500 }}>
            Ortho<span style={{ color: 'var(--accent)' }}>.</span>ia
          </span>
        </div>
        <div>
          <p style={{ fontFamily: 'var(--font-display)', fontSize: 40, fontWeight: 500, lineHeight: 1.15, letterSpacing: '-0.015em', margin: 0, textWrap: 'balance' }}>
            « Le rapport est ressemblant à ce que j'aurais écrit moi-même —
            en plus rapide. »
          </p>
          <p style={{ marginTop: 18, fontSize: 14, color: 'rgba(250,246,239,0.7)' }}>Julie M., orthophoniste libérale, Lyon</p>
        </div>
        <p style={{ fontSize: 13, color: 'rgba(250,246,239,0.5)', margin: 0 }}>Hébergement HDS · RGPD · Secret médical</p>
      </div>
      <div style={{ display: 'grid', placeItems: 'center', padding: 32 }}>
        <form style={{ width: 360 }} onSubmit={(e) => { e.preventDefault(); onLogin && onLogin(); }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 500, letterSpacing: '-0.015em', margin: '0 0 8px' }}>Bonjour Julie.</h1>
          <p style={{ fontSize: 15, color: 'var(--fg-2)', margin: '0 0 28px' }}>Trois bilans vous attendent depuis hier.</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <AppInput label="Email" value={email} onChange={(e) => setEmail(e.target.value)}/>
            <AppInput label="Mot de passe" value={pwd} onChange={(e) => setPwd(e.target.value)} type="password"/>
            <AppButton variant="primary" size="lg" type="submit" style={{ width: '100%', justifyContent: 'center', marginTop: 6 }}>Se connecter</AppButton>
          </div>
          <p style={{ fontSize: 13, color: 'var(--fg-3)', textAlign: 'center', marginTop: 18 }}>
            Mot de passe oublié ? · <a href="#" style={{ color: 'var(--fg-link)' }}>Créer un compte</a>
          </p>
        </form>
      </div>
    </div>
  );
};
window.Login = Login;
