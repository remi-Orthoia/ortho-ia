/**
 * Wrapper de logging applicatif.
 *
 * Pourquoi :
 *  - On veut un point unique pour les erreurs côté serveur. Avant : 30+ appels
 *    `console.error` éparpillés, certains avec PII (file.name, query strings…).
 *  - Quand Sentry est configuré, on remonte automatiquement les erreurs via
 *    Sentry.captureException — sans avoir à modifier 30 endroits du code.
 *  - Quand Sentry n'est pas configuré (local dev, env beta sans DSN), on fait
 *    simplement un console.error — comportement identique à avant.
 *
 * Usage :
 *   import { logger } from '@/lib/logger'
 *   logger.error('Extraction PDF échouée', err, { fileSize, userId })
 *   logger.warn('Quota proche', { userId, monthlyCount })
 *   logger.info('CRBO généré', { crboId })
 *
 * Pour le `error` (objet Error) on extrait toujours name/message/code/status,
 * jamais le stack en clair en prod (risque de fuite de paths internes).
 */

import * as Sentry from '@sentry/nextjs'

type Context = Record<string, unknown>

const isProd = process.env.NODE_ENV === 'production'
const sentryActive = !!(process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN)

function scrubError(err: unknown): Record<string, unknown> {
  if (!err || typeof err !== 'object') {
    return { error: String(err).slice(0, 200) }
  }
  const e = err as any
  return {
    name: e.name,
    code: e.code,
    status: e.status ?? e.statusCode,
    message: typeof e.message === 'string' ? e.message.slice(0, 300) : undefined,
    // Stack uniquement en local — en prod c'est Sentry qui l'a, on ne le
    // ré-imprime pas dans les logs Vercel (souvent ronflants).
    stack: isProd ? undefined : e.stack,
  }
}

export const logger = {
  /**
   * Erreur applicative : on log + on envoie à Sentry s'il est actif.
   * Le `tag` sert de catégorie ("extract-pdf", "kanban-delete", "auth").
   */
  error(tag: string, err: unknown, context?: Context) {
    const safe = scrubError(err)
    console.error(`[${tag}]`, safe, context ?? '')
    if (sentryActive && err instanceof Error) {
      Sentry.captureException(err, {
        tags: { route: tag },
        extra: context,
      })
    } else if (sentryActive) {
      // Erreurs sérialisées : on envoie comme message Sentry plutôt qu'exception.
      Sentry.captureMessage(`[${tag}] ${safe.message ?? 'unknown'}`, {
        level: 'error',
        tags: { route: tag },
        extra: { ...safe, ...context },
      })
    }
  },

  /** Warning : log + Sentry au niveau warning (pas d'alerte critique). */
  warn(tag: string, message: string, context?: Context) {
    console.warn(`[${tag}] ${message}`, context ?? '')
    if (sentryActive) {
      Sentry.captureMessage(`[${tag}] ${message}`, {
        level: 'warning',
        tags: { route: tag },
        extra: context,
      })
    }
  },

  /** Info : log uniquement (pas d'envoi Sentry — réservé aux erreurs/warns). */
  info(tag: string, message: string, context?: Context) {
    console.log(`[${tag}] ${message}`, context ?? '')
  },
}
