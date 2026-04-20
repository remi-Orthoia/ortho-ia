/**
 * Helper de retry pour les appels API critiques (Claude).
 * - Retente jusqu'à `maxAttempts` fois en cas d'erreur transitoire (429, 503, 504, timeout).
 * - Ne retry jamais sur erreurs définitives (400, 401, 403, 422).
 * - Back-off exponentiel avec jitter pour éviter le thundering herd.
 */

export interface RetryOptions {
  /** Nombre maximum de tentatives (inclus le premier essai). Défaut : 3. */
  maxAttempts?: number
  /** Délai initial avant le 1er retry (ms). Défaut : 1000. */
  initialDelayMs?: number
  /** Multiplicateur pour back-off exponentiel. Défaut : 2. */
  backoffMultiplier?: number
  /** Callback appelé avant chaque retry (logging / UX). */
  onRetry?: (attempt: number, error: unknown) => void
  /** Signal d'abort pour annuler (timeout global, etc.). */
  signal?: AbortSignal
}

const RETRYABLE_STATUS = new Set([408, 425, 429, 500, 502, 503, 504])

function isRetryable(error: any): boolean {
  if (!error) return false
  if (error.name === 'AbortError') return false // pas de retry sur abort volontaire
  const status = error.status ?? error.statusCode
  if (typeof status === 'number') return RETRYABLE_STATUS.has(status)
  // Erreurs réseau Node / fetch typiques
  const code = error.code ?? error.cause?.code
  if (code === 'ECONNRESET' || code === 'ETIMEDOUT' || code === 'EAI_AGAIN') return true
  // Erreurs Anthropic SDK (overloaded_error, api_error, internal_server_error)
  const type = error?.error?.type ?? error?.type
  if (type === 'overloaded_error' || type === 'api_error' || type === 'rate_limit_error') return true
  return false
}

function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) return reject(new Error('Aborted'))
    const id = setTimeout(resolve, ms)
    signal?.addEventListener('abort', () => {
      clearTimeout(id)
      reject(new Error('Aborted'))
    })
  })
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {},
): Promise<T> {
  const {
    maxAttempts = 3,
    initialDelayMs = 1000,
    backoffMultiplier = 2,
    onRetry,
    signal,
  } = options

  let lastError: unknown
  let delay = initialDelayMs

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    if (signal?.aborted) throw new Error('Aborted')
    try {
      return await fn()
    } catch (error) {
      lastError = error
      const canRetry = attempt < maxAttempts && isRetryable(error)
      if (!canRetry) throw error
      onRetry?.(attempt, error)
      // Jitter +/- 25% pour éviter thundering herd
      const jitter = delay * 0.5 * (Math.random() - 0.5) * 2
      await sleep(Math.round(delay + jitter), signal)
      delay *= backoffMultiplier
    }
  }
  throw lastError
}
