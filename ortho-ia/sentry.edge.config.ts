/**
 * Config Sentry pour l'edge runtime — middleware.ts (auth refresh JWT) +
 * tout autre code marqué `export const runtime = 'edge'`.
 *
 * Inactif si SENTRY_DSN n'est pas défini.
 */
import * as Sentry from '@sentry/nextjs'

const dsn = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.VERCEL_ENV || process.env.NODE_ENV,
    sampleRate: 1.0,
    tracesSampleRate: 0,
    sendDefaultPii: false,
  })
}
