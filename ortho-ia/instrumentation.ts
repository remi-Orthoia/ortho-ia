/**
 * Point d'entrée Next.js 14 pour l'instrumentation serveur (Sentry).
 * Chargé une seule fois au démarrage du process Node, avant tout handler.
 *
 * Doit rester à la racine du projet (à côté de next.config.js).
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./sentry.server.config')
  }
  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('./sentry.edge.config')
  }
}
