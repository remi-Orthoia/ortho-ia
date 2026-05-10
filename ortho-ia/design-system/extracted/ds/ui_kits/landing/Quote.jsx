// Carrousel de "stories" verticales — témoignages d'orthophonistes
const Quote = () => {
  const stories = [
    {
      initials: 'JM',
      name: 'Julie M.',
      role: 'Orthophoniste libérale, Lyon',
      gradient: 'linear-gradient(160deg, #2F4A4A 0%, #1F2A2A 100%)',
      accent: 'var(--accent)',
      tag: 'Mes mercredis soirs',
      headline: 'J\'ai retrouvé mes mercredis soirs.',
      body: 'Le rapport ressemble à ce que j\'aurais écrit moi-même — en plus rapide, et sans me battre avec la mise en forme.',
      stat: { value: '−5 h', label: 'par semaine' },
    },
    {
      initials: 'CR',
      name: 'Claire R.',
      role: 'Orthophoniste, Nantes',
      gradient: 'linear-gradient(160deg, #C97B5C 0%, #8B4A30 100%)',
      accent: '#FAF6EF',
      tag: 'Plus de pile en retard',
      headline: 'Ma pile de bilans en retard a fondu.',
      body: 'Je ne me fais plus toute petite quand un médecin demande où en est le compte-rendu. Je l\'envoie.',
      stat: { value: '0', label: 'CRBO en retard' },
    },
    {
      initials: 'SB',
      name: 'Sophie B.',
      role: 'Orthophoniste libérale, Bordeaux',
      gradient: 'linear-gradient(160deg, #C7B27A 0%, #7A6A3D 100%)',
      accent: 'var(--bg-inverse)',
      tag: 'Plus de patients reçus',
      headline: 'Je peux enfin recevoir une famille de plus.',
      body: 'Le temps que je passais à rédiger, je le passe à rééduquer. Mon agenda respire, et mes patients aussi.',
      stat: { value: '+3', label: 'patients / sem.' },
    },
    {
      initials: 'AL',
      name: 'Anaïs L.',
      role: 'Orthophoniste, Strasbourg',
      gradient: 'linear-gradient(160deg, #4F6D5C 0%, #243831 100%)',
      accent: 'var(--accent)',
      tag: 'Mon style préservé',
      headline: 'Mon écriture, mais en plus rapide.',
      body: 'Au bout de trois bilans, l\'outil avait compris ma façon de tourner les phrases. Je relis, je signe, c\'est fluide.',
      stat: { value: '5 min', label: 'par CRBO' },
    },
  ];

  const [active, setActive] = React.useState(0);
  const [paused, setPaused] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const DURATION = 6000; // ms par story

  React.useEffect(() => {
    if (paused) return;
    const start = Date.now();
    const tick = setInterval(() => {
      const elapsed = Date.now() - start;
      const p = Math.min(elapsed / DURATION, 1);
      setProgress(p);
      if (p >= 1) {
        setActive(a => (a + 1) % stories.length);
        setProgress(0);
      }
    }, 40);
    return () => clearInterval(tick);
  }, [active, paused]);

  const goTo = (i) => { setActive(i); setProgress(0); };
  const prev = () => goTo((active - 1 + stories.length) % stories.length);
  const next = () => goTo((active + 1) % stories.length);

  const story = stories[active];

  return (
    <section style={{ padding: '96px 0', background: 'var(--bg-inverse)', color: 'var(--fg-on-brand)' }}>
      <Container style={{ maxWidth: 1080 }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <Eyebrow style={{ color: 'rgba(250,246,239,0.6)' }}>Elles en parlent</Eyebrow>
          <h2 style={{
            fontFamily: 'var(--font-display)', fontSize: 40, fontWeight: 500,
            lineHeight: 1.1, letterSpacing: '-0.015em',
            margin: '12px auto 0', textWrap: 'balance', maxWidth: 640,
          }}>
            Quatre histoires d'orthophonistes qui ont récupéré du temps.
          </h2>
        </div>

        <div
          style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto', alignItems: 'center', gap: 24 }}
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          {/* Prev */}
          <button onClick={prev} aria-label="Story précédente" style={navBtn}>‹</button>

          {/* Stage */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 16, overflow: 'hidden' }}>
            {stories.map((s, i) => {
              const isActive = i === active;
              const offset = i - active;
              const visible = Math.abs(offset) <= 2;
              if (!visible) return null;
              return (
                <button
                  key={s.name}
                  onClick={() => goTo(i)}
                  style={{
                    flex: '0 0 auto',
                    width: isActive ? 320 : 200,
                    height: isActive ? 520 : 360,
                    borderRadius: 24,
                    border: 'none', padding: 0, cursor: isActive ? 'default' : 'pointer',
                    background: s.gradient,
                    position: 'relative', overflow: 'hidden',
                    transition: 'all 420ms cubic-bezier(0.32,0.72,0,1)',
                    opacity: isActive ? 1 : 0.55,
                    transform: `translateY(${isActive ? 0 : 20}px)`,
                    boxShadow: isActive ? '0 30px 60px -30px rgba(0,0,0,0.6)' : 'none',
                    fontFamily: 'inherit', color: 'inherit', textAlign: 'left',
                  }}
                >
                  {/* Progress bars (only on active) */}
                  {isActive && (
                    <div style={{ position: 'absolute', top: 14, left: 14, right: 14, display: 'flex', gap: 4, zIndex: 2 }}>
                      {stories.map((_, j) => (
                        <div key={j} style={{
                          flex: 1, height: 3, borderRadius: 999,
                          background: 'rgba(255,255,255,0.25)', overflow: 'hidden',
                        }}>
                          <div style={{
                            height: '100%',
                            width: j < active ? '100%' : j === active ? `${progress * 100}%` : '0%',
                            background: 'rgba(255,255,255,0.95)',
                            transition: j === active ? 'none' : 'width 200ms',
                          }}/>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Content */}
                  <div style={{
                    position: 'absolute', inset: 0,
                    padding: isActive ? '40px 28px 28px' : '20px',
                    display: 'flex', flexDirection: 'column',
                  }}>
                    {/* Avatar + name */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: isActive ? 12 : 0 }}>
                      <span style={{
                        width: isActive ? 36 : 28, height: isActive ? 36 : 28,
                        borderRadius: 999,
                        background: 'rgba(255,255,255,0.18)',
                        backdropFilter: 'blur(8px)',
                        display: 'grid', placeItems: 'center',
                        fontFamily: 'var(--font-body)', fontWeight: 600,
                        fontSize: isActive ? 13 : 11, color: '#FAF6EF',
                        border: '1px solid rgba(255,255,255,0.25)',
                      }}>{s.initials}</span>
                      <div style={{ minWidth: 0 }}>
                        <p style={{ margin: 0, fontWeight: 600, fontSize: isActive ? 14 : 12, color: '#FAF6EF', lineHeight: 1.2 }}>{s.name}</p>
                        {isActive && <p style={{ margin: '2px 0 0', fontSize: 11, color: 'rgba(250,246,239,0.7)', lineHeight: 1.2 }}>{s.role}</p>}
                      </div>
                    </div>

                    {/* Tag chip */}
                    {isActive && (
                      <span style={{
                        marginTop: 16,
                        alignSelf: 'flex-start',
                        padding: '5px 10px', borderRadius: 999,
                        background: 'rgba(255,255,255,0.14)',
                        border: '1px solid rgba(255,255,255,0.22)',
                        fontSize: 11, fontWeight: 600, color: '#FAF6EF',
                        letterSpacing: '0.04em', textTransform: 'uppercase',
                      }}>{s.tag}</span>
                    )}

                    {/* Headline / body — only when active */}
                    {isActive ? (
                      <>
                        <p style={{
                          fontFamily: 'var(--font-display)',
                          fontSize: 26, fontWeight: 500, lineHeight: 1.2,
                          letterSpacing: '-0.01em',
                          margin: 'auto 0 12px', color: '#FAF6EF', textWrap: 'balance',
                        }}>
                          {story.headline}
                        </p>
                        <p style={{
                          fontSize: 14, lineHeight: 1.5,
                          color: 'rgba(250,246,239,0.8)',
                          margin: '0 0 18px', textWrap: 'pretty',
                        }}>
                          {story.body}
                        </p>
                        <div style={{
                          display: 'flex', alignItems: 'baseline', gap: 8,
                          paddingTop: 14, borderTop: '1px solid rgba(255,255,255,0.18)',
                        }}>
                          <span style={{
                            fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 500,
                            letterSpacing: '-0.02em', color: s.accent, lineHeight: 1,
                          }}>{story.stat.value}</span>
                          <span style={{ fontSize: 12, color: 'rgba(250,246,239,0.7)' }}>{story.stat.label}</span>
                        </div>
                      </>
                    ) : (
                      <p style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: 16, fontWeight: 500, lineHeight: 1.25,
                        margin: 'auto 0 0', color: 'rgba(250,246,239,0.85)',
                        textWrap: 'balance',
                      }}>
                        {s.tag}
                      </p>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Next */}
          <button onClick={next} aria-label="Story suivante" style={navBtn}>›</button>
        </div>

        {/* Dots */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 32 }}>
          {stories.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              aria-label={`Aller à la story ${i + 1}`}
              style={{
                width: i === active ? 28 : 8, height: 8, borderRadius: 999,
                background: i === active ? 'var(--accent)' : 'rgba(250,246,239,0.25)',
                border: 'none', padding: 0, cursor: 'pointer',
                transition: 'all 240ms cubic-bezier(0.32,0.72,0,1)',
              }}
            />
          ))}
        </div>
      </Container>
    </section>
  );
};

const navBtn = {
  width: 44, height: 44, borderRadius: 999,
  background: 'rgba(250,246,239,0.08)',
  border: '1px solid rgba(250,246,239,0.18)',
  color: '#FAF6EF',
  fontFamily: 'var(--font-display)', fontSize: 24, lineHeight: 1,
  cursor: 'pointer',
  display: 'grid', placeItems: 'center',
  transition: 'background 180ms',
};

window.Quote = Quote;
