/**
 * Template email de bienvenue pour les beta testeurs.
 *
 * Pas d'envoi automatique pour l'instant — à coller dans un client mail
 * (Gmail, Proton, etc.) ou à brancher plus tard sur Resend / SendGrid.
 *
 * Utilisation :
 *   import { renderBetaWelcome } from '@/lib/email-templates/beta-welcome'
 *   const { subject, html, text } = renderBetaWelcome({ prenom: 'Laurie', loginUrl: '...' })
 */

export interface BetaWelcomeParams {
  prenom: string
  loginUrl: string
  /** URL vers la landing (pour header + footer). */
  siteUrl?: string
  /** Nom complet de l'expéditeur. */
  fromName?: string
}

export function renderBetaWelcome({
  prenom,
  loginUrl,
  siteUrl = 'https://ortho-ia.vercel.app',
  fromName = 'Rémi, fondateur Ortho.ia',
}: BetaWelcomeParams) {
  const subject = `Bienvenue dans la beta Ortho.ia, ${prenom} 🌿`

  // Hex en dur (pas de var(--*) en email — pas supporté par les clients).
  // Palette DS Stéphanie direction A : sage + cream.
  //   #3F5E52 = brand-sage-600 (signature)   |   #2E4A41 = brand-sage-700 (hover)
  //   #557366 = brand-sage-500               |   #A8BBB1 = brand-sage-300
  //   #EEF2EE = brand-sage-50                |   #DDE6E0 = brand-sage-100 (border)
  //   #FAF6EF = brand-cream (canvas)         |   #FFFDF8 = brand-paper (cards)
  //   #1F2A2A = brand-sage-900 (fg-1)        |   #74807A = fg-3
  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>${subject}</title>
  <style>
    body { margin: 0; padding: 0; background: #FAF6EF; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Inter', sans-serif; color: #1F2A2A; line-height: 1.6; }
    .container { max-width: 600px; margin: 0 auto; background: #FFFDF8; }
    .header { background: linear-gradient(135deg, #557366 0%, #3F5E52 100%); padding: 28px 32px; text-align: center; }
    .logo { color: #FAF6EF; font-size: 20px; font-weight: 700; letter-spacing: -0.5px; }
    .content { padding: 32px; }
    h1 { margin: 0 0 16px; font-size: 26px; font-weight: 500; letter-spacing: -0.01em; color: #1F2A2A; font-family: 'Fraunces', 'Source Serif 4', Georgia, serif; }
    p { margin: 0 0 14px; font-size: 15px; }
    .cta { display: inline-block; background: #3F5E52; color: #FAF6EF !important; padding: 12px 24px; border-radius: 999px; font-weight: 500; text-decoration: none; margin: 12px 0; }
    .steps { background: #EEF2EE; border-left: 3px solid #3F5E52; padding: 16px 20px; margin: 20px 0; border-radius: 8px; }
    .steps ol { margin: 0; padding-left: 18px; }
    .steps li { margin-bottom: 8px; font-size: 14px; }
    .footer { padding: 20px 32px; background: #FAF6EF; font-size: 12px; color: #74807A; text-align: center; border-top: 1px solid #DDE6E0; }
    .footer a { color: #2E4A41; text-decoration: none; }
    hr { border: none; border-top: 1px solid #DDE6E0; margin: 24px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">Ortho<span style="color:#A8BBB1">.ia</span></div>
    </div>
    <div class="content">
      <h1>Bienvenue ${prenom} 🌿</h1>
      <p>Merci de rejoindre la beta d'<strong>Ortho.ia</strong>. Vous faites partie des tout premiers orthophonistes à découvrir l'outil — et votre retour va directement façonner la suite du produit.</p>

      <p>Votre compte est actif. Cliquez pour vous connecter :</p>
      <p><a href="${loginUrl}" class="cta">Accéder à Ortho.ia</a></p>

      <div class="steps">
        <strong>En 5 minutes pour démarrer :</strong>
        <ol>
          <li>Complétez votre <em>profil</em> (adresse, téléphone, email du cabinet) — il sera pré-rempli dans chaque CRBO.</li>
          <li>Ajoutez un patient au <em>Carnet</em> (ou directement en créant votre premier CRBO).</li>
          <li>Créez votre premier CRBO : 5 étapes guidées, import PDF possible, génération IA en ~20 secondes.</li>
          <li>Téléchargez le Word, relisez, signez.</li>
        </ol>
      </div>

      <p><strong>Vos 3 premiers mois sont offerts</strong>, sans engagement, sans carte bancaire. Profitez-en largement.</p>

      <hr>

      <p><strong>Ce que j'attends de vous :</strong> utilisez l'outil sur vos vrais bilans de la semaine, et dès que quelque chose vous surprend, freine ou ravit, dites-le moi. Le plus simple : bouton <strong>Feedback</strong> (pilule sage en bas à droite du dashboard), ou un simple mail à <a href="mailto:remi.berrio@gmail.com">remi.berrio@gmail.com</a>.</p>

      <p>Les données patient sont <strong>anonymisées avant envoi à l'IA</strong>, et protégées par Row-Level Security sur la base. Pour le détail technique : <a href="${siteUrl}/confidentialite">notre politique de confidentialité</a>.</p>

      <p>Si vous rencontrez le moindre bug ou si vous avez une question, je réponds dans la journée.</p>

      <p>À très vite,<br>
      ${fromName}</p>
    </div>
    <div class="footer">
      <p>
        <a href="${siteUrl}">Ortho.ia</a> · Beta gratuite 3 mois<br>
        <a href="${siteUrl}/cgu">CGU</a> · <a href="${siteUrl}/confidentialite">Confidentialité</a> · <a href="${siteUrl}/roadmap">Roadmap</a>
      </p>
    </div>
  </div>
</body>
</html>`

  const text = `Bienvenue ${prenom} 🌿

Merci de rejoindre la beta d'Ortho.ia. Vous faites partie des tout premiers orthophonistes à découvrir l'outil — et votre retour va directement façonner la suite du produit.

Votre compte est actif. Connectez-vous : ${loginUrl}

EN 5 MINUTES POUR DÉMARRER
1. Complétez votre profil (adresse, téléphone, email) — il sera pré-rempli dans chaque CRBO.
2. Ajoutez un patient au Carnet.
3. Créez votre premier CRBO : 5 étapes guidées, génération IA en ~20s.
4. Téléchargez le Word, relisez, signez.

Vos 3 premiers mois sont offerts, sans engagement, sans carte bancaire.

CE QUE J'ATTENDS DE VOUS
Utilisez l'outil sur vos vrais bilans de la semaine, et dès que quelque chose vous surprend, freine ou ravit, dites-le moi.
- Bouton Feedback (pilule sage en bas à droite du dashboard)
- Ou email direct : remi.berrio@gmail.com

Les données patient sont anonymisées avant envoi à l'IA, et protégées par Row-Level Security sur la base.

À très vite,
${fromName}

---
${siteUrl} · Beta gratuite 3 mois
CGU : ${siteUrl}/cgu
Confidentialité : ${siteUrl}/confidentialite
Roadmap : ${siteUrl}/roadmap
`

  return { subject, html, text }
}
