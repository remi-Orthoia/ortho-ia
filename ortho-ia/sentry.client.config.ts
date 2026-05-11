/**
 * Config Sentry côté navigateur — capture les erreurs des pages dashboard,
 * formulaires CRBO, exports Word côté client.
 *
 * Inactif si NEXT_PUBLIC_SENTRY_DSN n'est pas défini : zéro requête réseau,
 * zéro overhead. Sentry.init() est court-circuité en early-return ci-dessous.
 *
 * Pour activer en prod :
 *   1. Créer un projet sur sentry.io (gratuit jusqu'à 10k events/mois)
 *   2. Copier la DSN du projet (Settings → Client Keys)
 *   3. Ajouter NEXT_PUBLIC_SENTRY_DSN dans Vercel env (Production + Preview)
 *   4. Redéployer — la capture démarre automatiquement.
 */
import * as Sentry from '@sentry/nextjs'

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN

if (dsn) {
  Sentry.init({
    dsn,
    // Environnement = NODE_ENV (production / preview / development), permet de
    // filtrer dans le dashboard Sentry et d'éviter le bruit local.
    environment: process.env.NEXT_PUBLIC_VERCEL_ENV || process.env.NODE_ENV,

    // Échantillonnage des erreurs : 100% en prod (volume faible pour 10 users
    // beta), à réduire à 0.1 quand on aura 1000+ events/jour.
    sampleRate: 1.0,

    // Pas de session replay ni performance tracing pour l'instant — focus sur
    // les erreurs uniquement. À activer plus tard si besoin de comprendre des
    // bugs UX complexes.
    tracesSampleRate: 0,
    replaysOnErrorSampleRate: 0,
    replaysSessionSampleRate: 0,

    // RGPD : on ne capture JAMAIS de PII patient/médecin/ortho dans les
    // breadcrumbs ou les contextes. Sentry capture par défaut les URLs +
    // les paramètres de requêtes — on les nettoie via beforeSend.
    sendDefaultPii: false,

    beforeSend(event) {
      // Strip les query params qui pourraient contenir un patient_id ou un
      // bilan_id liable à un nom (rare mais possible).
      if (event.request?.url) {
        try {
          const u = new URL(event.request.url)
          u.search = ''
          event.request.url = u.toString()
        } catch {}
      }
      return event
    },

    // Filtrer le bruit connu — extensions navigateur, ResizeObserver,
    // erreurs réseau transientes que retry.ts gère déjà côté API.
    ignoreErrors: [
      'ResizeObserver loop limit exceeded',
      'ResizeObserver loop completed with undelivered notifications',
      'Non-Error promise rejection captured',
      // Hydratation Next.js : souvent dû à des extensions navigateur qui
      // modifient le DOM avant React, pas un bug applicatif.
      'Hydration failed',
      'Text content does not match server-rendered HTML',
      // Erreurs réseau transientes — déjà gérées par withRetry côté API.
      'Failed to fetch',
      'NetworkError when attempting to fetch resource',
    ],
  })
}
