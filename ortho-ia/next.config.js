/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['psxngyjpshweknwrhpck.supabase.co'],
  },
  // Instrumentation hook (Next.js 14) — chargé via instrumentation.ts.
  experimental: {
    instrumentationHook: true,
  },
}

// Wrapper Sentry — auto-no-op si SENTRY_AUTH_TOKEN est absent (= local dev,
// pas d'upload de source maps). En prod sur Vercel, ajouter SENTRY_AUTH_TOKEN
// + SENTRY_ORG + SENTRY_PROJECT pour activer l'upload (debugging par stack
// trace lisible plutôt que minifiée).
const { withSentryConfig } = require('@sentry/nextjs')

module.exports = withSentryConfig(nextConfig, {
  // Org + projet — laissés en env vars pour ne pas coder en dur.
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,

  // Silence le wrapper en local quand Sentry n'est pas configuré.
  silent: !process.env.SENTRY_AUTH_TOKEN,

  // Tunnel : route les events Sentry à travers `/monitoring/sentry-events`
  // au lieu du domaine sentry.io. Évite les ad-blockers qui bloqueraient
  // les requêtes vers sentry.io et nous priveraient des erreurs des users
  // côté navigateur.
  tunnelRoute: '/monitoring/sentry-events',

  // Désactive l'upload de source maps si pas de token (= local).
  disableLogger: false,

  // Widen la fenêtre de stack trace pour les serverless functions Vercel
  // (sinon on perd souvent le contexte utile).
  widenClientFileUpload: true,
})
