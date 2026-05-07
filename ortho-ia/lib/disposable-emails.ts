// Liste de domaines d'emails jetables connus à rejeter à l'inscription.
// Pas exhaustive (il en existe des milliers) — suffisant pour bloquer les
// abus opportunistes. La protection IP couvre le reste.
const DISPOSABLE_DOMAINS = new Set<string>([
  'mailinator.com',
  'guerrillamail.com',
  'guerrillamail.info',
  'guerrillamail.net',
  'guerrillamail.org',
  'guerrillamailblock.com',
  'tempmail.com',
  'throwam.com',
  'yopmail.com',
  'yopmail.fr',
  'yopmail.net',
  'sharklasers.com',
  'grr.la',
  'spam4.me',
  'trashmail.com',
  'trashmail.net',
  'dispostable.com',
  '10minutemail.com',
  '10minutemail.net',
  'tempr.email',
  'mohmal.com',
  'temp-mail.org',
  'temp-mail.io',
  'fakeinbox.com',
  'mailnesia.com',
  'maildrop.cc',
  'getnada.com',
  'mintemail.com',
  'mytemp.email',
  'emailondeck.com',
  'inboxbear.com',
])

/**
 * Renvoie true si l'email appartient à un domaine connu de mail jetable.
 * Insensible à la casse, tolère les espaces autour.
 */
export function isDisposableEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false
  const at = email.lastIndexOf('@')
  if (at === -1) return false
  const domain = email.slice(at + 1).trim().toLowerCase()
  if (!domain) return false
  return DISPOSABLE_DOMAINS.has(domain)
}
