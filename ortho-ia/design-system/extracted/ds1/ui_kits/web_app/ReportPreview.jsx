const ReportPreview = ({ onBack }) => (
  <div style={{ padding: '24px 32px 48px', display: 'grid', gridTemplateColumns: '1fr 280px', gap: 24, alignItems: 'start' }} data-screen-label="Aperçu rapport">
    {/* Document */}
    <article style={{
      background: 'var(--bg-surface)',
      border: '1px solid var(--border)',
      borderRadius: 14,
      padding: '56px 72px',
      boxShadow: 'var(--shadow-sm)',
      fontFamily: 'var(--font-body)',
      lineHeight: 1.65,
      color: 'var(--fg-1)',
      maxWidth: 760,
    }}>
      <p style={{ fontSize: 12, color: 'var(--fg-3)', letterSpacing: '0.08em', textTransform: 'uppercase', margin: 0 }}>Cabinet Julie Moreau · Orthophoniste</p>
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 30, fontWeight: 600, letterSpacing: '-0.015em', margin: '14px 0 6px' }}>
        Compte-rendu de bilan orthophonique
      </h1>
      <p style={{ fontSize: 14, color: 'var(--fg-2)', margin: 0 }}>
        Léa Martin · née le 04/09/2018 (7 ans) · Bilan du 12 mars 2026
      </p>
      <hr style={{ border: 0, borderTop: '1px solid var(--border)', margin: '28px 0' }}/>

      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 600, margin: '0 0 8px' }}>Anamnèse</h2>
      <p style={{ margin: '0 0 14px', fontSize: 14.5 }}>
        Léa est adressée par le Dr Lemoine, médecin traitant, pour des
        difficultés de lecture signalées par son enseignante de CE1.
        L'enfant lit lentement, marque des hésitations et confond les
        sons proches (<em>b/d</em>, <em>p/q</em>).
      </p>
      <p style={{ margin: '0 0 14px', fontSize: 14.5 }}>
        Sur le plan médical, on note des otites séreuses à répétition entre
        2 et 4 ans, ayant motivé la pose de diabolos. La vue est corrigée.
        Le père de Léa a été diagnostiqué dyslexique à l'âge adulte.
      </p>

      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 600, margin: '20px 0 8px' }}>Plainte initiale</h2>
      <p style={{ margin: '0 0 14px', fontSize: 14.5 }}>
        Léa décrit la lecture comme « fatigante » ; elle évite les livres à
        la maison. Sa mère rapporte une perte de confiance progressive.
      </p>

      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 600, margin: '20px 0 8px' }}>Conclusion</h2>
      <p style={{ margin: '0 0 14px', fontSize: 14.5 }}>
        Les épreuves objectivent un trouble spécifique du langage écrit
        d'intensité modérée (lecture −1,8 ET ; orthographe −1,5 ET). Une
        rééducation hebdomadaire de 30 minutes est indiquée, en
        coordination avec l'équipe pédagogique.
      </p>
    </article>

    {/* Side panel */}
    <aside style={{ display: 'flex', flexDirection: 'column', gap: 16, position: 'sticky', top: 24 }}>
      <div style={{ background: 'var(--success-soft)', color: 'var(--success)', borderRadius: 14, padding: 14, fontSize: 13, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 10 }}>
        {I.check}
        <span>Rapport prêt — généré en 4 min 12 s</span>
      </div>

      <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 16 }}>
        <p style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--fg-3)', margin: '0 0 10px' }}>Actions</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <AppButton variant="primary" size="md" icon={I.download} style={{ justifyContent: 'flex-start' }}>Télécharger en .docx</AppButton>
          <AppButton variant="secondary" size="md" icon={I.doc} style={{ justifyContent: 'flex-start' }}>Reformuler une section</AppButton>
          <AppButton variant="ghost" size="md" onClick={onBack} style={{ justifyContent: 'flex-start' }}>← Modifier le bilan</AppButton>
        </div>
      </div>

      <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 16 }}>
        <p style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--fg-3)', margin: '0 0 10px' }}>Style</p>
        <p style={{ fontSize: 13, color: 'var(--fg-2)', margin: '0 0 10px' }}>Adapté à votre formulation habituelle. Vous pouvez ajuster :</p>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <Badge tone="primary">Sobre</Badge>
          <Badge tone="neutral">Synthétique</Badge>
          <Badge tone="neutral">Pour confrère</Badge>
          <Badge tone="neutral">Pour parents</Badge>
        </div>
      </div>
    </aside>
  </div>
);
window.ReportPreview = ReportPreview;
