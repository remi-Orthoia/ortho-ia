const FAQItem = ({ q, a, open }) => {
  const [isOpen, setOpen] = React.useState(open || false);
  return (
    <div style={{ borderBottom: '1px solid var(--border)', padding: '20px 0' }}>
      <button onClick={() => setOpen(!isOpen)} style={{
        background: 'none', border: 0, padding: 0, width: '100%',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        cursor: 'pointer', textAlign: 'left', gap: 24,
      }}>
        <span style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 600, color: 'var(--fg-1)' }}>{q}</span>
        <span style={{ fontSize: 22, color: 'var(--fg-3)', transform: isOpen ? 'rotate(45deg)' : 'none', transition: 'transform 180ms', flex: '0 0 auto' }}>+</span>
      </button>
      {isOpen && (
        <div style={{ fontSize: 15, lineHeight: 1.6, color: 'var(--fg-2)', margin: '14px 0 0', maxWidth: 720 }}>
          {typeof a === 'string' ? <p style={{ margin: 0 }}>{a}</p> : a}
        </div>
      )}
    </div>
  );
};

const ChatGPTAnswer = () => (
  <>
    <p style={{ margin: '0 0 14px' }}>
      ChatGPT est un couteau suisse généraliste. Ortho.ia est un outil
      clinique, conçu pour et avec des orthophonistes. La différence se
      joue sur huit points concrets :
    </p>
    <ol style={{ margin: '0 0 14px', paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
      <li><strong>Connaissance des batteries françaises</strong> — Exalang (3-6, 5-8, 8-11, 11-15), Examath, ELO, EVALO, N-EEL, BILO, EVALEO, BALE, BELEC, MoCA, BETL, OMF. Chaque module connaît les domaines évalués, les seuils, les pièges cliniques.</li>
      <li><strong>Règles de percentiles FNO respectées</strong> — Q1 = P25, Med = P50, Q3 = P75. Les normes du test priment toujours sur l'écart-type. ChatGPT recalcule à tort P6 depuis un É-T de −1.53 et vous transforme un Normal en Déficitaire.</li>
      <li><strong>Anonymisation RGPD automatique</strong> — prénom, nom, médecin, coordonnées sont tokenisés avant l'API, jamais besoin de les retirer à la main avant de prompter.</li>
      <li><strong>Sortie structurée prête à envoyer</strong> — Word professionnel avec en-tête, graphiques de percentiles, tableaux colorés par seuil clinique, conclusions, PAP/PPS. Pas un bloc de texte à remettre en forme.</li>
      <li><strong>Gestion du renouvellement</strong> — comparaison automatique avec le bilan précédent, tableau d'évolution avec flèches ↑ ↓ →, synthèse narrative de la progression.</li>
      <li><strong>Historique patient + carnet intégré</strong> — timeline des scores, Kanban des CRBO en cours, carnet patients et médecins. ChatGPT vous oblige à tout recopier à chaque session.</li>
      <li><strong>Zéro prompt à rédiger</strong> — vous remplissez un formulaire clair, l'outil fait le reste. Pas de formule magique à mémoriser, pas de paramètres à régler, pas de « tu es un orthophoniste expert… ».</li>
      <li><strong>Prompts validés cliniquement</strong> — itérés avec des orthophonistes en exercice sur de vrais bilans, pas par un modèle généraliste qui invente parfois des épreuves qui n'existent pas.</li>
    </ol>
    <p style={{ margin: 0 }}>
      Autrement dit : ChatGPT peut vous aider à écrire un email ;
      Ortho.ia rédige votre CRBO à votre place, dans le cadre clinique correct.
    </p>
  </>
);

const WordContentAnswer = () => (
  <>
    <p style={{ margin: '0 0 12px' }}>Un CRBO professionnel complet incluant :</p>
    <ul style={{ margin: 0, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 6 }}>
      <li>En-tête de vos coordonnées professionnelles</li>
      <li>Fiche patient + médecin prescripteur</li>
      <li>Badge de sévérité globale (Léger / Modéré / Sévère)</li>
      <li>Graphique de synthèse des percentiles moyens par domaine</li>
      <li>Anamnèse rédigée en prose fluide (jamais de notes brutes)</li>
      <li>Tableaux par domaine avec code couleur par seuil clinique et colonne Interprétation</li>
      <li>Diagnostic, comorbidités, recommandations, aménagements PAP/PPS</li>
      <li>Pour un renouvellement : tableau comparatif avec flèches d'évolution</li>
    </ul>
  </>
);

const BetaAnswer = () => (
  <>
    <p style={{ margin: '0 0 12px' }}>
      Les 3 premiers mois sont offerts à tout orthophoniste qui s'inscrit
      pendant la phase Beta. Aucune carte bancaire n'est demandée à l'inscription.
    </p>
    <p style={{ margin: 0 }}>
      En échange, un retour régulier sur l'outil nous aide à affiner le
      prompt et à corriger les coquilles. Nous privilégions un groupe
      réduit pour itérer vite.
    </p>
  </>
);

const FAQ = () => (
  <section style={{ padding: '96px 0', background: 'var(--bg-surface-2)' }}>
    <Container style={{ maxWidth: 820 }}>
      <Eyebrow>Questions fréquentes</Eyebrow>
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 40, fontWeight: 500, lineHeight: 1.15, letterSpacing: '-0.015em', margin: '12px 0 32px', textWrap: 'balance' }}>
        Ce qu'on nous demande le plus.
      </h2>
      <FAQItem open q="En quoi Ortho.ia est-il meilleur que ChatGPT pour rédiger mes CRBO ?" a={<ChatGPTAnswer />} />
      <FAQItem q="Comment fonctionne l'import PDF ?" a="Vous uploadez le PDF de résultats de votre logiciel (Exalang, Examath…) directement dans Ortho.ia. Notre IA extrait automatiquement chaque épreuve avec son score, son écart-type et son percentile, dans la notation exacte du document (Q1, Med, Q3, P5…). Les percentiles ne sont jamais recalculés depuis l'écart-type, les normes du test priment." />
      <FAQItem q="Mes CRBOs sont-ils conservés ?" a="Tous vos CRBOs sont sauvegardés dans votre historique personnel, classés par patient avec timeline d'évolution des scores. Vous pouvez les télécharger en Word à tout moment, les éditer, ou les supprimer. Les données sont conservées tant que votre compte est actif, puis 12 mois après résiliation (obligation légale de conservation comptable)." />
      <FAQItem q="Que contient le Word généré ?" a={<WordContentAnswer />} />
      <FAQItem q="Mes données patients sont-elles en sécurité ?" a="Oui. Hébergement HDS (Hébergeur de Données de Santé) en France, chiffrement de bout en bout, secret médical respecté. Vous êtes responsable de traitement, nous sommes sous-traitant — un DPA est signé avec chaque cabinet." />
      <FAQItem q="Le rapport généré est-il modifiable ?" a="Entièrement. Vous relisez chaque section, modifiez ce que vous voulez, ajoutez vos propres formulations. Le fichier exporté est un Word standard, modifiable dans tout traitement de texte." />
      <FAQItem q="Est-ce que ça remplace mon expertise clinique ?" a="Non, et ce n'est pas son but. Ortho.ia est une plume rapide pour la mise en forme — la conclusion clinique, le diagnostic, le plan de soin restent les vôtres. C'est vous qui validez, c'est vous qui signez." />
      <FAQItem q="Comment se passe la période Beta ?" a={<BetaAnswer />} />
      <FAQItem q="Puis-je l'utiliser sur tablette ou téléphone ?" a="Oui, l'interface est responsive. Pour la prise de notes en séance sur smartphone, cela fonctionne. Pour la génération et l'export Word, un écran d'ordinateur reste plus confortable, notamment pour relire les tableaux détaillés." />
      <FAQItem q="Et si je veux arrêter ?" a="Vous pouvez résilier votre abonnement mensuel à tout moment depuis votre espace personnel ; la résiliation prend effet en fin de période. Vous pouvez également mettre en pause votre abonnement mensuel à tout moment, pour vos congés ou une période sans bilan — vous ne serez pas facturé·e pendant la pause et vos données restent intactes. L'abonnement annuel n'est pas remboursable mais reste actif jusqu'à échéance. Vous pouvez également exporter et supprimer l'ensemble de vos données conformément au RGPD." />
    </Container>
  </section>
);

window.FAQ = FAQ;
