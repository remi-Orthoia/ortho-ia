/**
 * Email template — invitation parrainage Ortho.ia.
 *
 * Envoyé à l'adresse email saisie par la parraine dans son dashboard quand
 * elle invite une consœur. Le contenu est personnalisé avec son prénom et
 * son code de parrainage.
 *
 * Pas de wiring à un provider SMTP/API ici — la fonction retourne juste
 * { subject, html, text } à passer à Resend / Postmark / SendGrid /
 * Supabase Edge Function.
 *
 * Usage typique :
 *   const { subject, html, text } = renderReferralWelcomeEmail({
 *     referrerPrenom: 'Laurie',
 *     referralCode: 'LAUR3942',
 *     baseUrl: 'https://ortho-ia.vercel.app',
 *   })
 *   await resend.emails.send({
 *     from: "Laurie d'Ortho.ia <laurie@ortho-ia.fr>",
 *     to: invitee.email,
 *     subject, html, text,
 *   })
 */

export interface ReferralWelcomeInput {
  /** Prénom de la parraine — apparaît dans l'objet et la signature. */
  referrerPrenom: string
  /** Code de parrainage de la parraine (ex: "LAUR3942"). */
  referralCode: string
  /** Base URL de l'app (ex: https://ortho-ia.vercel.app). Sans trailing slash. */
  baseUrl: string
  /** Optionnel — prénom de l'invitée pour personnalisation supplémentaire. */
  inviteePrenom?: string
}

export interface ReferralWelcomeOutput {
  from: string
  subject: string
  html: string
  text: string
  referralUrl: string
}

const FROM_ADDRESS = "Laurie d'Ortho.ia <laurie@ortho-ia.fr>"

export function renderReferralWelcomeEmail(input: ReferralWelcomeInput): ReferralWelcomeOutput {
  const { referrerPrenom, referralCode, baseUrl, inviteePrenom } = input

  const cleanBase = baseUrl.replace(/\/+$/, '')
  const referralUrl = `${cleanBase}/ref/${encodeURIComponent(referralCode)}`
  const greeting = inviteePrenom ? `Bonjour ${inviteePrenom},` : 'Bonjour,'

  const subject = `${referrerPrenom} vous a invitée sur Ortho.ia 🌿`

  // ============ Version HTML ============
  // Markup minimaliste — testé pour rester lisible dans Gmail / Outlook /
  // Apple Mail. Pas de CSS externe, tout inline. Pas d'images bloquantes.
  const html = /* html */ `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${escapeHtml(subject)}</title>
</head>
<body style="margin:0;padding:0;background:#FAF6EF;font-family:Georgia,'Times New Roman',serif;color:#1F2A2A;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#FAF6EF;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;background:#FFFDF8;border:1px solid rgba(31,42,42,0.10);border-radius:20px;overflow:hidden;">
          <!-- Header -->
          <tr>
            <td style="padding:36px 40px 12px 40px;">
              <p style="margin:0;font-family:system-ui,-apple-system,'Segoe UI',sans-serif;font-size:12px;letter-spacing:0.12em;text-transform:uppercase;color:#74807A;font-weight:600;">
                Ortho.ia · Programme parrainage
              </p>
              <h1 style="margin:14px 0 0;font-family:Georgia,'Times New Roman',serif;font-size:32px;font-weight:500;line-height:1.15;letter-spacing:-0.015em;color:#1F2A2A;">
                ${escapeHtml(referrerPrenom)} vous offre <span style="color:#3F5E52;">14,90€/mois</span> sur Ortho.ia.
              </h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:24px 40px;font-family:Georgia,serif;font-size:16px;line-height:1.65;color:#1F2A2A;">
              <p style="margin:0 0 14px;">${escapeHtml(greeting)}</p>
              <p style="margin:0 0 14px;">
                <strong>${escapeHtml(referrerPrenom)}</strong> utilise <strong>Ortho.ia</strong> pour
                rédiger ses comptes-rendus de bilan orthophonique en quelques minutes au lieu
                de plusieurs heures. Elle a pensé que ça pourrait vous aider aussi.
              </p>
              <p style="margin:0 0 14px;">
                En passant par son lien d'invitation, vous bénéficiez d'un tarif réduit :
                <strong>14,90€/mois</strong> au lieu de 19,90€/mois — à vie, tant que vous
                restez abonnée.
              </p>
              <p style="margin:0 0 22px;">
                Aucune carte bancaire demandée à l'inscription. Vos 3 premiers CRBO sont
                offerts pour vous faire votre propre idée.
              </p>

              <!-- CTA principal -->
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 auto;">
                <tr>
                  <td align="center" style="background:#3F5E52;border-radius:999px;">
                    <a href="${escapeAttr(referralUrl)}"
                       style="display:inline-block;padding:14px 28px;font-family:system-ui,-apple-system,'Segoe UI',sans-serif;font-size:15px;font-weight:600;color:#FAF6EF;text-decoration:none;letter-spacing:-0.01em;">
                      Tester Ortho.ia avec le tarif ${escapeHtml(referrerPrenom)}
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:22px 0 0;font-size:13px;color:#74807A;text-align:center;">
                Lien direct : <a href="${escapeAttr(referralUrl)}" style="color:#2E4A41;">${escapeHtml(referralUrl)}</a>
              </p>
            </td>
          </tr>

          <!-- Reassurance bullets -->
          <tr>
            <td style="padding:0 40px 28px 40px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="padding:14px 16px;background:#F2EAD8;border-radius:12px;font-family:system-ui,sans-serif;font-size:13.5px;line-height:1.55;color:#4A554F;">
                    🌿 Conçu avec des orthophonistes en exercice<br>
                    🛡️ Données chiffrées · RGPD · Secret médical respecté<br>
                    ✋ Sans engagement · résiliable à tout moment
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Signature -->
          <tr>
            <td style="padding:0 40px 36px 40px;font-family:Georgia,serif;font-size:15px;line-height:1.6;color:#1F2A2A;">
              <p style="margin:0;">
                Une question ? Répondez simplement à cet email — je reçois directement.
              </p>
              <p style="margin:14px 0 0;">
                Belle journée,<br>
                <em>Laurie, fondatrice d'Ortho.ia</em>
              </p>
            </td>
          </tr>
        </table>

        <!-- Footer -->
        <p style="max-width:560px;margin:18px auto 0;font-family:system-ui,sans-serif;font-size:11px;color:#74807A;text-align:center;line-height:1.5;">
          Vous recevez ce message parce que ${escapeHtml(referrerPrenom)} vous a partagé son lien
          d'invitation Ortho.ia. Si vous ne souhaitez pas créer de compte, ignorez cet email —
          vous ne recevrez aucun autre message de notre part.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
`.trim()

  // ============ Version texte (fallback clients qui n'affichent pas l'HTML) ============
  const text = [
    greeting,
    '',
    `${referrerPrenom} utilise Ortho.ia pour rédiger ses comptes-rendus`,
    'de bilan orthophonique en quelques minutes au lieu de plusieurs heures.',
    'Elle a pensé que ça pourrait vous aider aussi.',
    '',
    'En passant par son lien d\'invitation, vous bénéficiez d\'un tarif',
    'réduit : 14,90€/mois au lieu de 19,90€/mois — à vie, tant que vous',
    'restez abonnée.',
    '',
    'Aucune carte bancaire demandée à l\'inscription. Vos 3 premiers CRBO',
    'sont offerts.',
    '',
    `→ ${referralUrl}`,
    '',
    '🌿 Conçu avec des orthophonistes en exercice',
    '🛡️ Données chiffrées · RGPD · Secret médical respecté',
    '✋ Sans engagement · résiliable à tout moment',
    '',
    'Une question ? Répondez simplement à cet email.',
    '',
    'Belle journée,',
    'Laurie, fondatrice d\'Ortho.ia',
    '',
    '---',
    `Vous recevez ce message parce que ${referrerPrenom} vous a partagé son lien d'invitation.`,
    'Si vous ne souhaitez pas créer de compte, ignorez cet email.',
  ].join('\n')

  return { from: FROM_ADDRESS, subject, html, text, referralUrl }
}

// ===== Helpers d'échappement HTML — sécurité minimale pour qu'un prénom
// avec des caractères spéciaux ne casse pas le markup.
function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function escapeAttr(s: string): string {
  return escapeHtml(s)
}
