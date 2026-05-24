'use client'

/**
 * Tableau comparatif d'evolution pour un bilan de renouvellement.
 *
 * Affiche, pour chaque epreuve du bilan actuel :
 *   - le percentile precedent (colore selon SEUILS)
 *   - le percentile actuel (colore selon SEUILS)
 *   - une fleche d'evolution :
 *       ↑ +delta   (delta >= 10 → progression)
 *       → Stable   (-10 < delta < 10)
 *       ↓ delta    (delta <= -10 → regression)
 *       ✦ Nouvelle (epreuve absente du bilan precedent)
 *
 * En tete : badge global ("Progression significative" / "Regression observee"
 * / "Profil globalement stable") + 3 listes courtes (domaines en progres,
 * domaines en regression, epreuves ajoutees).
 *
 * Reflete fidelement le bloc "EVOLUTION DEPUIS LE DERNIER BILAN" du Word
 * (cf. lib/word-export.ts ~ligne 546). Utilise dans :
 *   - components/CRBOStructuredPreview.tsx (apercu inline post-generation)
 *   - app/dashboard/nouveau-crbo/preview/[id]/page.tsx (page preview dediee)
 *
 * Renvoie null si pas de bilan precedent fourni — le caller n'a pas besoin
 * de tester previousStructure avant de monter le composant.
 */

import React from 'react'
import type { CRBOStructure } from '@/lib/prompts'
import { getPercentileColor, formatPercentileForDisplay } from '@/lib/word-export'

interface Props {
  /** Structure CRBO du bilan en cours. */
  currentStructure: CRBOStructure
  /** Structure CRBO du bilan precedent. Si absente/vide → composant rend null. */
  previousStructure?: CRBOStructure | null
  /** Date du bilan precedent (ISO yyyy-mm-dd) pour etiqueter la colonne. */
  previousBilanDate?: string | null
  /** Date du bilan actuel pour etiqueter la colonne. */
  bilanDate?: string | null
}

function formatDateFr(iso?: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (isNaN(d.getTime())) return iso
  return d.toLocaleDateString('fr-FR')
}

export default function RenouvellementComparisonTable({
  currentStructure,
  previousStructure,
  previousBilanDate,
  bilanDate,
}: Props) {
  const hasPrev =
    !!previousStructure &&
    Array.isArray(previousStructure.domains) &&
    previousStructure.domains.length > 0
  if (!hasPrev) return null
  if (!currentStructure.domains || currentStructure.domains.length === 0) return null

  // Index des epreuves precedentes par nom normalise pour lookup O(1) par
  // epreuve actuelle. Le nom est la cle de jointure (pas d'ID epreuve stable
  // entre bilans).
  const prevIndex = new Map<string, { percentile: string; value: number; domain: string }>()
  for (const d of previousStructure!.domains) {
    for (const e of d.epreuves) {
      prevIndex.set(e.nom.toLowerCase().trim(), {
        percentile: e.percentile,
        value: e.percentile_value,
        domain: d.nom,
      })
    }
  }

  // Stats globales d'evolution : compteurs + listes pour le mini-recap.
  let progres = 0, stable = 0, regression = 0, nouvelles = 0
  const progresList: string[] = []
  const regressionList: string[] = []
  const nouvellesList: string[] = []
  for (const d of currentStructure.domains) {
    for (const e of d.epreuves) {
      const prev = prevIndex.get(e.nom.toLowerCase().trim())
      if (!prev) { nouvelles++; nouvellesList.push(e.nom); continue }
      const delta = e.percentile_value - prev.value
      if (delta >= 10) { progres++; progresList.push(e.nom) }
      else if (delta <= -10) { regression++; regressionList.push(e.nom) }
      else stable++
    }
  }

  // Badge global : meme regle que le Word — progres >> regression → vert,
  // regression > progres → rouge, sinon gris (stable).
  let badgeText: string, badgeClasses: string
  if (progres > regression * 2 && progres >= 3) {
    badgeText = `✓ Progression significative · ${progres} épreuve${progres > 1 ? 's' : ''} en progrès`
    badgeClasses = 'bg-green-100 text-green-900 border-green-300 dark:bg-green-900/30 dark:text-green-200 dark:border-green-800'
  } else if (regression > progres && regression >= 2) {
    badgeText = `↓ Régression observée · ${regression} épreuve${regression > 1 ? 's' : ''} en baisse`
    badgeClasses = 'bg-red-100 text-red-900 border-red-300 dark:bg-red-900/30 dark:text-red-200 dark:border-red-800'
  } else {
    badgeText = `≈ Profil globalement stable · ${progres} progrès · ${stable} stable · ${regression} régression`
    badgeClasses = 'bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-800/50 dark:text-gray-200 dark:border-gray-700'
  }

  return (
    <section className="card-modern p-5">
      <h3 className="font-bold text-base text-primary-700 dark:text-primary-400 mb-3">
        🔄 Évolution depuis le dernier bilan
      </h3>

      {/* Dates comparees */}
      <p className="text-center text-xs text-gray-500 dark:text-gray-400 mb-3">
        {previousBilanDate ? `Bilan initial du ${formatDateFr(previousBilanDate)}` : 'Bilan initial'}
        {'  →  '}
        {bilanDate ? `Bilan actuel du ${formatDateFr(bilanDate)}` : 'Bilan actuel'}
      </p>

      {/* Badge global */}
      <div className={`text-center font-semibold text-sm px-4 py-2 rounded-lg border ${badgeClasses} mb-4`}>
        {badgeText}
      </div>

      {/* Listes courtes (max 8 entrees pour ne pas surcharger) */}
      {progresList.length > 0 && (
        <p className="text-sm mb-1.5">
          <span className="font-bold text-green-700 dark:text-green-400">🌱 Domaines en progrès :</span>
          <span className="ml-1.5 text-gray-700 dark:text-gray-300">{progresList.slice(0, 8).join(' · ')}</span>
        </p>
      )}
      {regressionList.length > 0 && (
        <p className="text-sm mb-1.5">
          <span className="font-bold text-red-700 dark:text-red-400">⚠ Domaines en régression à surveiller :</span>
          <span className="ml-1.5 text-gray-700 dark:text-gray-300">{regressionList.slice(0, 8).join(' · ')}</span>
        </p>
      )}
      {nouvellesList.length > 0 && (
        <p className="text-sm mb-3">
          <span className="font-bold text-blue-700 dark:text-blue-400">✨ Épreuves ajoutées :</span>
          <span className="ml-1.5 text-gray-700 dark:text-gray-300">{nouvellesList.slice(0, 8).join(' · ')}</span>
        </p>
      )}

      {/* Tableau detaille — un en-tete de groupe par domaine, puis lignes
          des epreuves. Couleurs des cellules percentile via getPercentileColor
          (meme palette que le Word, alpha 60 % en CSS pour adoucir). */}
      <div className="overflow-x-auto mt-3 -mx-5 px-5">
        <table className="w-full text-sm border-collapse">
          <thead className="bg-emerald-50 dark:bg-emerald-900/20 text-xs uppercase tracking-wider">
            <tr>
              <th className="text-left py-2 px-3 border border-gray-200 dark:border-surface-dark-muted">Domaine / Épreuve</th>
              <th className="text-center py-2 px-3 border border-gray-200 dark:border-surface-dark-muted w-28">
                {previousBilanDate ? formatDateFr(previousBilanDate) : 'Précédent'}
              </th>
              <th className="text-center py-2 px-3 border border-gray-200 dark:border-surface-dark-muted w-28">
                {bilanDate ? formatDateFr(bilanDate) : 'Actuel'}
              </th>
              <th className="text-center py-2 px-3 border border-gray-200 dark:border-surface-dark-muted w-28">Δ Évolution</th>
            </tr>
          </thead>
          <tbody>
            {currentStructure.domains.map((d, dIdx) => (
              <React.Fragment key={`comp-${dIdx}`}>
                <tr className="bg-emerald-50/60 dark:bg-emerald-900/10">
                  <td colSpan={4} className="font-bold text-emerald-700 dark:text-emerald-300 py-1.5 px-3 border border-gray-200 dark:border-surface-dark-muted">
                    {d.nom}
                  </td>
                </tr>
                {d.epreuves.map((e, eIdx) => {
                  const prev = prevIndex.get(e.nom.toLowerCase().trim())
                  const prevColor = prev ? getPercentileColor(prev.value) : ''
                  const curColor = getPercentileColor(e.percentile_value)
                  let arrow = '→', arrowLabel = 'Stable', arrowClass = 'text-gray-500'
                  if (prev) {
                    const delta = e.percentile_value - prev.value
                    if (delta >= 10) { arrow = '↑'; arrowLabel = `+${Math.round(delta)}`; arrowClass = 'text-green-700 dark:text-green-400 font-bold' }
                    else if (delta <= -10) { arrow = '↓'; arrowLabel = `${Math.round(delta)}`; arrowClass = 'text-red-700 dark:text-red-400 font-bold' }
                    else { arrow = '→'; arrowLabel = 'Stable'; arrowClass = 'text-gray-500 dark:text-gray-400' }
                  } else {
                    arrow = '✦'; arrowLabel = 'Nouvelle'; arrowClass = 'text-blue-700 dark:text-blue-400 font-bold'
                  }
                  return (
                    <tr key={`comp-${dIdx}-${eIdx}`} className="hover:bg-gray-50 dark:hover:bg-surface-dark-muted/30">
                      <td className="py-1.5 pl-6 pr-3 border border-gray-200 dark:border-surface-dark-muted text-gray-900 dark:text-gray-100">
                        {e.nom}
                      </td>
                      <td
                        className="py-1.5 px-3 text-center font-mono border border-gray-200 dark:border-surface-dark-muted"
                        style={prev ? { backgroundColor: '#' + prevColor + '60' } : undefined}
                      >
                        {prev ? formatPercentileForDisplay(prev.percentile, prev.value) : '—'}
                      </td>
                      <td
                        className="py-1.5 px-3 text-center font-mono border border-gray-200 dark:border-surface-dark-muted"
                        style={{ backgroundColor: '#' + curColor + '60' }}
                      >
                        {formatPercentileForDisplay(e.percentile, e.percentile_value)}
                      </td>
                      <td className={`py-1.5 px-3 text-center border border-gray-200 dark:border-surface-dark-muted ${arrowClass}`}>
                        <span className="text-base mr-1">{arrow}</span>{arrowLabel}
                      </td>
                    </tr>
                  )
                })}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
