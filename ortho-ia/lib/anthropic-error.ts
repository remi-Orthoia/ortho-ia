/**
 * Helper partagé pour gérer les erreurs Anthropic remontées par les routes
 * /api/extract-*, /api/generate-*, /api/voice-command/*. Centralise notamment
 * la détection du cas "credit balance too low" qui sinon tombe sur le handler
 * 500 générique et induit l'orthophoniste à retenter en boucle sans succès.
 *
 * Usage : `const handled = handleAnthropicError(err); if (handled) return handled;`
 * dans le `catch` d'une route — renvoie un `NextResponse` prêt à servir si
 * l'erreur est reconnue, ou `null` pour laisser le code appelant gérer.
 */

import { NextResponse } from 'next/server'

/**
 * Vrai si l'erreur Anthropic indique un solde de crédits insuffisant.
 * Anthropic renvoie status 400 avec `error.message` contenant "credit balance"
 * (et parfois "billing"). On match large pour être robuste aux variations de
 * formulation.
 */
export function isAnthropicCreditError(error: any): boolean {
  if (!error || error.status !== 400) return false
  const msg = String(
    error?.message ??
    error?.error?.error?.message ??
    error?.error?.message ??
    '',
  ).toLowerCase()
  return msg.includes('credit balance') || msg.includes('credit') || msg.includes('billing')
}

/**
 * Si l'erreur est un cas Anthropic connu (credit balance, 429, 401, 5xx),
 * renvoie un NextResponse prêt à servir avec un message clair côté UX.
 * Sinon renvoie null pour laisser le caller produire son propre fallback.
 *
 * Le paramètre `featureLabel` permet de personnaliser le message générique
 * (ex: "la génération du CRBO", "la lecture de la photo", "l'import du PDF").
 */
export function handleAnthropicError(error: any, featureLabel = 'cette opération') {
  if (isAnthropicCreditError(error)) {
    return NextResponse.json(
      {
        error:
          "Service IA temporairement indisponible (solde de crédits Anthropic à recharger). " +
          "Cette indisponibilité affecte l'ensemble des fonctionnalités IA (génération CRBO, " +
          "import PDF, photo MoCA, dictée, etc.). Contactez l'administrateur ou réessayez plus tard.",
      },
      { status: 503 },
    )
  }
  if (error?.status === 401) {
    return NextResponse.json(
      { error: 'Service IA temporairement indisponible.' },
      { status: 503 },
    )
  }
  if (error?.status === 429) {
    return NextResponse.json(
      { error: `Trop de demandes pour ${featureLabel}. Attendez une minute et réessayez.` },
      { status: 429 },
    )
  }
  if (error?.status === 529) {
    return NextResponse.json(
      { error: 'Service IA surchargé. Réessayez dans une minute.' },
      { status: 503 },
    )
  }
  // Erreur Anthropic 5xx non spécifique
  if (typeof error?.status === 'number' && error.status >= 500 && error.status < 600) {
    return NextResponse.json(
      { error: `Erreur du service IA pour ${featureLabel}. Réessayez dans quelques instants.` },
      { status: 503 },
    )
  }
  return null
}
