import { redirect } from 'next/navigation'

/**
 * Page de redirection des liens de parrainage.
 *
 * URL publique : /ref/[code]  → redirige vers /auth/register?ref=[code]
 *
 * Pas de validation côté serveur ici : le code est passé tel quel à la
 * page d'inscription, qui :
 *   1. Tente un lookup_referrer_by_code via RPC pour personnaliser l'UI.
 *   2. Crée la relation referrals seulement si le code matche un profile.
 *
 * Si le code est invalide (typo, parraine désinscrite…), la page register
 * fonctionne normalement, juste sans bandeau "Parrainée par X" et sans
 * créer de relation referral. Aucune erreur utilisatrice — on dégrade
 * silencieusement.
 *
 * Server Component : redirect() fait un 307 (méthode préservée) côté
 * serveur, pas de JS chargé. Latence minimale.
 */
export default function ReferralLandingPage({
  params,
}: {
  params: { code: string }
}) {
  // Normalise : majuscules, retire espaces/quotes (copie-collée tolérante).
  // Tronque à 32 chars max — protection contre URL absurdement longue.
  const code = (params.code || '').trim().toUpperCase().slice(0, 32)

  // Code vide après normalisation → redirige vers la home (pas register).
  if (!code) redirect('/')

  redirect(`/auth/register?ref=${encodeURIComponent(code)}`)
}
