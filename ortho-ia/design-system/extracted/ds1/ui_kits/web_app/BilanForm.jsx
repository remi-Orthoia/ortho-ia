const BilanForm = ({ patient, onGenerate }) => {
  const [section, setSection] = React.useState('anamnese');
  const sections = [
    { id: 'identite',   label: 'Identité' },
    { id: 'anamnese',   label: 'Anamnèse' },
    { id: 'plainte',    label: 'Plainte' },
    { id: 'epreuves',   label: 'Épreuves & scores' },
    { id: 'observation',label: 'Observation clinique' },
    { id: 'conclusion', label: 'Conclusion' },
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', minHeight: '100%', height: '100%' }} data-screen-label="Saisie bilan">
      {/* Section nav */}
      <aside style={{ borderRight: '1px solid var(--border)', padding: '24px 12px', background: 'var(--bg-canvas)' }}>
        <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--fg-3)', margin: '0 10px 12px' }}>Sections du bilan</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {sections.map((s, i) => {
            const isActive = section === s.id;
            const isDone = ['identite', 'anamnese'].includes(s.id);
            return (
              <button key={s.id} onClick={() => setSection(s.id)} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '9px 10px', borderRadius: 10,
                background: isActive ? 'var(--primary-soft)' : 'transparent',
                color: isActive ? 'var(--primary)' : 'var(--fg-2)',
                fontWeight: isActive ? 600 : 500, fontSize: 13.5,
                border: 0, cursor: 'pointer', textAlign: 'left',
              }}>
                <span style={{
                  width: 22, height: 22, borderRadius: 999,
                  background: isDone ? 'var(--success-soft)' : (isActive ? 'var(--primary)' : 'var(--bg-surface-2)'),
                  color: isDone ? 'var(--success)' : (isActive ? 'var(--fg-on-brand)' : 'var(--fg-3)'),
                  display: 'grid', placeItems: 'center', fontSize: 11, fontWeight: 600,
                }}>
                  {isDone ? '✓' : i + 1}
                </span>
                {s.label}
              </button>
            );
          })}
        </div>
      </aside>

      {/* Form panel */}
      <div style={{ overflow: 'auto', padding: '32px 40px 80px', maxWidth: 820 }}>
        <Badge tone="primary">Bilan langage écrit · CE1</Badge>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 30, fontWeight: 500, letterSpacing: '-0.015em', margin: '12px 0 4px' }}>
          {sections.find(s => s.id === section).label}
        </h2>
        <p style={{ fontSize: 14, color: 'var(--fg-3)', margin: '0 0 28px' }}>
          Saisissez ce que vous observez. Ortho.ia s'occupe de la mise en forme.
        </p>

        {section === 'anamnese' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <AppInput label="Motif de consultation" multiline rows={3}
              value="Difficultés de lecture signalées par l'enseignante de CE1. Léa lit lentement, hésite, se trompe sur les sons proches (b/d, p/q)."/>
            <AppInput label="Antécédents médicaux pertinents" multiline rows={2}
              value="Otites séreuses à répétition entre 2 et 4 ans, diabolos posés à 3 ans. Vue corrigée."/>
            <AppInput label="Contexte familial" multiline rows={2}
              value="Père dyslexique diagnostiqué à l'âge adulte. Cadre familial soutenant."
              hint="Ortho.ia reformulera selon votre style — le brouillon est juste là pour ne rien oublier."/>
            <AppInput label="Scolarité" multiline rows={2} value="CE1, école publique. Léa est décrite comme 'attentive mais fatigable en lecture'."/>
          </div>
        )}

        {section === 'identite' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <AppInput label="Prénom" value="Léa"/>
            <AppInput label="Nom" value="Martin"/>
            <AppInput label="Date de naissance" value="04 / 09 / 2018"/>
            <AppInput label="Sexe" value="F"/>
            <AppInput label="Adressé par" value="Dr Lemoine, médecin traitant"/>
            <AppInput label="Date du bilan" value="12 / 03 / 2026"/>
          </div>
        )}

        {section !== 'anamnese' && section !== 'identite' && (
          <div style={{
            border: '1px dashed var(--border-strong)', borderRadius: 16,
            padding: 28, color: 'var(--fg-3)', textAlign: 'center',
          }}>
            <p style={{ margin: 0 }}>Section à compléter — la trame s'adapte à la batterie sélectionnée.</p>
          </div>
        )}

        {/* Generate strip */}
        <div style={{
          marginTop: 36, display: 'flex', alignItems: 'center', gap: 14,
          padding: 18,
          background: 'var(--accent-soft)',
          border: '1px solid var(--accent)',
          borderRadius: 18,
        }}>
          <span style={{ width: 38, height: 38, borderRadius: 999, background: 'var(--accent)', display: 'grid', placeItems: 'center', color: 'var(--bg-inverse)' }}>
            {I.sparkle}
          </span>
          <div style={{ flex: 1 }}>
            <p style={{ margin: 0, fontWeight: 600, fontSize: 14 }}>Vous pouvez générer un premier rapport.</p>
            <p style={{ margin: '2px 0 0', fontSize: 13, color: 'var(--fg-2)' }}>2 sections sont remplies. Vous pourrez compléter et corriger ensuite.</p>
          </div>
          <AppButton variant="accent" size="md" icon={I.sparkle} onClick={onGenerate}>Générer le rapport</AppButton>
        </div>
      </div>
    </div>
  );
};
window.BilanForm = BilanForm;
