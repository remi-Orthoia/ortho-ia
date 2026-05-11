/**
 * Config Sentry côté serveur Node.js — capture les erreurs des routes API
 * (extract-pdf, extract-previous-bilan, generate-crbo, transcribe, etc.).
 *
 * Inactif si SENTRY_DSN n'est pas défini.
 *
 * Pour activer en prod :
 *   1. Mêmes étapes que sentry.client.config.ts.
 *   2. Ajouter SENTRY_DSN (sans préfixe NEXT_PUBLIC_) dans Vercel env Server-side.
 *      Vous pouvez réutiliser la même DSN que pour le client.
 */
import * as Sentry from '@sentry/nextjs'

const dsn = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.VERCEL_ENV || process.env.NODE_ENV,
    sampleRate: 1.0,
    tracesSampleRate: 0,

    // Pas de PII : les routes anonymisent déjà avant l'appel Claude, mais
    // par défense en profondeur on évite tout dump de body / headers.
    sendDefaultPii: false,
    beforeSend(event) {
      // Strip query strings (peut contenir patient_id, bilan_id).
      if (event.request?.query_string) {
        event.request.query_string = '[stripped]'
      }
      if (event.request?.url) {
        try {
          const u = new URL(event.request.url)
          u.search = ''
          event.request.url = u.toString()
        } catch {}
      }
      // Strip cookies (peuvent contenir le JWT Supabase).
      if (event.request?.cookies) {
        event.request.cookies = '[stripped]' as any
      }
      // Strip Authorization headers.
      if (event.request?.headers) {
        const h = event.request.headers as Record<string, string>
        if (h.authorization) h.authorization = '[stripped]'
        if (h.cookie) h.cookie = '[stripped]'
      }
      return event
    },

    ignoreErrors: [
      // Abort intentionnel (timeout AbortController côté route extract-*)
      'AbortError',
      'The user aborted a request',
      // Erreurs réseau transientes — déjà retentées par withRetry.
      'ECONNRESET',
      'ETIMEDOUT',
      'EAI_AGAIN',
    ],
  })
}
