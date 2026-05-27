/**
 * Helper d'envoi d'email transactionnel via Resend (HTTP fetch direct, pas
 * de package NPM ajouté).
 *
 * Pourquoi pas le SDK `resend` : on évite d'installer une dépendance pour
 * un seul appel HTTP simple. L'API Resend est trivialement consommée en
 * fetch JSON. Si on grossit le volume d'emails, on pourra basculer sur
 * le SDK plus tard.
 *
 * Comportement de fallback :
 *  - Si `RESEND_API_KEY` est absente, on log un warning et on retourne
 *    `{ ok: false, skipped: true }`. Pas d'exception levée → le signup
 *    et autres flows critiques ne sont jamais bloqués par un email manqué.
 *  - Si l'API Resend répond en erreur, on log + return `{ ok: false }` ;
 *    le caller décide s'il veut afficher un warning à l'user (en général
 *    non — un email manqué n'a pas a être bloquant).
 *
 * Variables d'environnement (toutes optionnelles, valeurs par défaut OK
 * pour démarrer avec le domaine partagé Resend dev) :
 *  - RESEND_API_KEY     : clé secrète Resend (active l'envoi réel)
 *  - RESEND_FROM_EMAIL  : adresse expéditeur (défaut 'onboarding@resend.dev')
 *  - RESEND_FROM_NAME   : nom expéditeur affiché (défaut 'Ortho.ia')
 *
 * Une fois le domaine ortho-ia.com vérifié dans Resend, basculer
 * RESEND_FROM_EMAIL sur 'bienvenue@ortho-ia.com' (ou équivalent) côté
 * Vercel env.
 */

interface SendEmailParams {
  to: string
  subject: string
  html: string
  text: string
  /** Override le from par défaut si besoin (ex: emails de support depuis
   *  une adresse différente de l'onboarding). */
  fromOverride?: { email: string; name?: string }
}

interface SendEmailResult {
  ok: boolean
  /** True si l'envoi a été sauté volontairement (pas de clé API en env). */
  skipped?: boolean
  /** ID Resend du message envoyé, si succès. */
  messageId?: string
  /** Message d'erreur si échec. */
  error?: string
}

export async function sendEmail({
  to,
  subject,
  html,
  text,
  fromOverride,
}: SendEmailParams): Promise<SendEmailResult> {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.warn(
      '[email/send] RESEND_API_KEY absente, envoi ignoré',
      { to: to.replace(/(.{2}).*@/, '$1***@'), subject },
    )
    return { ok: false, skipped: true }
  }

  const fromEmail = fromOverride?.email ?? process.env.RESEND_FROM_EMAIL ?? 'onboarding@resend.dev'
  const fromName = fromOverride?.name ?? process.env.RESEND_FROM_NAME ?? 'Ortho.ia'
  const from = `${fromName} <${fromEmail}>`

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from, to, subject, html, text }),
    })

    if (!response.ok) {
      const body = await response.text().catch(() => '')
      console.error(
        '[email/send] échec API Resend',
        {
          status: response.status,
          body: body.slice(0, 300),
          to: to.replace(/(.{2}).*@/, '$1***@'),
        },
      )
      return { ok: false, error: `Resend ${response.status}` }
    }

    const data = await response.json().catch(() => ({} as { id?: string }))
    return { ok: true, messageId: data.id }
  } catch (err: any) {
    console.error(
      '[email/send] erreur réseau Resend',
      { message: err?.message?.slice(0, 200), to: to.replace(/(.{2}).*@/, '$1***@') },
    )
    return { ok: false, error: err?.message ?? 'network error' }
  }
}
