'use client'

import React from 'react'
import { Download, Edit, AlertTriangle, Sparkles, BookOpen, Eye, UserCheck } from 'lucide-react'
import type { CRBOStructure } from '@/lib/prompts'
import { SEUILS, seuilFor, getPercentileColor, formatPercentileForDisplay } from '@/lib/word-export'
import ReasoningClinicalDisplay from './ReasoningClinical'

interface Props {
  structure: CRBOStructure
  onDownload: () => void
  /** Callback pour basculer en édition texte brut. */
  onEdit?: () => void
  /** Si fourni, affiche un bouton "Prévisualiser" qui ouvre un modal plein écran. */
  onPreview?: () => void
  /** Structure du bilan précédent (renouvellement). Si fournie + previousBilanDate,
   *  on affiche un tableau comparatif épreuve par épreuve avec flèches d'évolution
   *  (↑ progression / → stable / ↓ régression / ✦ nouvelle épreuve). Reflète le Word. */
  previousStructure?: CRBOStructure | null
  /** Date du bilan précédent (ISO yyyy-mm-dd) pour étiqueter la colonne. */
  previousBilanDate?: string | null
  /** Date du bilan actuel (ISO ou libre) pour étiqueter la colonne. */
  bilanDate?: string | null
}

/** Rend un texte avec marqueurs Markdown `**gras**`, lignes `**Titre**` = H3, et paragraphes séparés par ligne vide. */
function RichText({ text }: { text: string }) {
  if (!text) return null
  const lines = text.split('\n')
  const out: React.ReactNode[] = []
  let buffer: string[] = []
  const flush = (key: number) => {
    if (buffer.length === 0) return
    const joined = buffer.join(' ')
    const parts = joined.split(/(\*\*[^*]+\*\*)/g).filter((p) => p.length > 0)
    out.push(
      <p key={`p-${key}`} className="text-gray-800 dark:text-gray-200 leading-relaxed mb-3">
        {parts.map((p, i) =>
          p.startsWith('**') && p.endsWith('**') ? (
            <strong key={i} className="font-semibold">{p.slice(2, -2)}</strong>
          ) : (
            <span key={i}>{p}</span>
          ),
        )}
      </p>,
    )
    buffer = []
  }
  lines.forEach((line, idx) => {
    const t = line.trim()
    if (!t) { flush(idx); return }
    const h3Match = t.match(/^\*\*([^*]+)\*\*\s*:?\s*$/)
    if (h3Match) {
      flush(idx)
      out.push(
        <h4 key={`h-${idx}`} className="font-bold text-primary-700 dark:text-primary-400 mt-4 mb-2">
          {h3Match[1].trim()}
        </h4>,
      )
      return
    }
    buffer.push(t)
  })
  flush(lines.length)
  return <>{out}</>
}

/**
 * Preview mise en forme du CRBO généré — rendu lisible et professionnel
 * plutôt qu'un simple textarea. Reflète fidèlement le Word exporté.
 */
export default function CRBOStructuredPreview({
  structure,
  onDownload,
  onEdit,
  onPreview,
  previousStructure,
  previousBilanDate,
  bilanDate,
}: Props) {
  const sev = structure.severite_globale

  // Calcul du tableau comparatif renouvellement : index des épreuves du bilan
  // précédent indexées par nom normalisé, puis pour chaque épreuve actuelle
  // calcul du delta de percentile et classification (progres / stable /
  // regression / nouvelle). Reflète la logique du Word (lib/word-export.ts).
  const hasPrev =
    !!previousStructure &&
    Array.isArray(previousStructure.domains) &&
    previousStructure.domains.length > 0
  const comparison = (() => {
    if (!hasPrev || !structure.domains || structure.domains.length === 0) return null
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
    let progres = 0, stable = 0, regression = 0, nouvelles = 0
    const progresList: string[] = []
    const regressionList: string[] = []
    const nouvellesList: string[] = []
    for (const d of structure.domains) {
      for (const e of d.epreuves) {
        const prev = prevIndex.get(e.nom.toLowerCase().trim())
        if (!prev) { nouvelles++; nouvellesList.push(e.nom); continue }
        const delta = e.percentile_value - prev.value
        if (delta >= 10) { progres++; progresList.push(e.nom) }
        else if (delta <= -10) { regression++; regressionList.push(e.nom) }
        else stable++
      }
    }
    let badgeText: string, badgeClasses: string
    if (progres > regression * 2 && progres >= 3) {
      badgeText = `✓ Progression significative · ${progres} épreuve${progres > 1 ? 's' : ''} en progrès`
      badgeClasses = 'bg-green-100 text-green-900 border-green-300'
    } else if (regression > progres && regression >= 2) {
      badgeText = `↓ Régression observée · ${regression} épreuve${regression > 1 ? 's' : ''} en baisse`
      badgeClasses = 'bg-red-100 text-red-900 border-red-300'
    } else {
      badgeText = `≈ Profil globalement stable · ${progres} progrès · ${stable} stable · ${regression} régression`
      badgeClasses = 'bg-gray-100 text-gray-800 border-gray-300'
    }
    return { prevIndex, progres, stable, regression, nouvelles, progresList, regressionList, nouvellesList, badgeText, badgeClasses }
  })()

  const formatDateFr = (iso?: string | null): string => {
    if (!iso) return ''
    const d = new Date(iso)
    if (isNaN(d.getTime())) return iso
    return d.toLocaleDateString('fr-FR')
  }
  const sevColors: Record<string, { bg: string; text: string; ring: string }> = {
    'Léger':      { bg: 'bg-green-100 dark:bg-green-900/30',   text: 'text-green-800 dark:text-green-200',   ring: 'ring-green-300 dark:ring-green-800' },
    'Modéré':     { bg: 'bg-amber-100 dark:bg-amber-900/30',   text: 'text-amber-800 dark:text-amber-200',   ring: 'ring-amber-300 dark:ring-amber-800' },
    'Sévère':     { bg: 'bg-red-100 dark:bg-red-900/30',       text: 'text-red-800 dark:text-red-200',       ring: 'ring-red-300 dark:ring-red-800' },
  }

  return (
    <div className="space-y-5">
      {/* Header avec CTA Download */}
      <div className="card-lifted px-6 py-4 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Sparkles className="text-primary-600 dark:text-primary-400" size={18} />
            Aperçu du CRBO
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Structure générée automatiquement — téléchargez en Word pour l&apos;envoi final
          </p>
        </div>
        <div className="flex items-center gap-2">
          {onPreview && (
            <button onClick={onPreview} className="btn-secondary text-sm">
              <Eye size={14} />
              Prévisualiser
            </button>
          )}
          {onEdit && (
            <button onClick={onEdit} className="btn-secondary text-sm">
              <Edit size={14} />
              Éditer le texte
            </button>
          )}
          <button onClick={onDownload} className="btn-primary">
            <Download size={16} />
            Télécharger le Word
          </button>
        </div>
      </div>

      {/* Badge sévérité + comorbidités */}
      {(sev || (structure.comorbidites_detectees && structure.comorbidites_detectees.filter(c => c?.trim()).length > 0)) && (
        <div className="card-lifted p-5 flex flex-wrap items-start gap-4">
          {sev && sevColors[sev] && (
            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full ${sevColors[sev].bg} ${sevColors[sev].text} ring-2 ${sevColors[sev].ring}`}>
              <AlertTriangle size={16} />
              <span className="font-bold">Sévérité globale · {sev}</span>
            </div>
          )}
          {structure.comorbidites_detectees && structure.comorbidites_detectees.filter(c => c?.trim()).length > 0 && (
            <div className="flex-1 min-w-[240px]">
              <p className="text-xs uppercase tracking-wider text-amber-700 dark:text-amber-400 font-bold mb-1.5">
                Comorbidités détectées
              </p>
              <ul className="space-y-1 text-sm text-gray-800 dark:text-gray-200">
                {structure.comorbidites_detectees.filter(c => c?.trim()).map((c, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-amber-600 dark:text-amber-400 mt-0.5">•</span>
                    <span>{c.trim()}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Anamnèse — badge "édité" si l'ortho a personnalisé ce passage */}
      <Section title="Anamnèse" color="primary" edited={structure.edited_fields?.includes('anamnese_redigee')}>
        <p className="text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-line">
          {structure.anamnese_redigee || <em className="text-gray-400">[À compléter — anamnèse non reformulée]</em>}
        </p>
      </Section>

      {/* Tableau comparatif renouvellement — uniquement si bilan précédent fourni.
          Reflète fidèlement le bloc "ÉVOLUTION DEPUIS LE DERNIER BILAN" du Word. */}
      {comparison && hasPrev && (
        <Section title="🔄 Évolution depuis le dernier bilan" color="primary">
          {/* Dates comparées */}
          <p className="text-center text-xs text-gray-500 dark:text-gray-400 mb-3">
            {previousBilanDate ? `Bilan initial du ${formatDateFr(previousBilanDate)}` : 'Bilan initial'}
            {'  →  '}
            {bilanDate ? `Bilan actuel du ${formatDateFr(bilanDate)}` : 'Bilan actuel'}
          </p>
          {/* Badge évolution globale */}
          <div className={`text-center font-semibold text-sm px-4 py-2 rounded-lg border ${comparison.badgeClasses} mb-4`}>
            {comparison.badgeText}
          </div>
          {/* Listes courtes */}
          {comparison.progresList.length > 0 && (
            <p className="text-sm mb-1.5">
              <span className="font-bold text-green-700 dark:text-green-400">🌱 Domaines en progrès :</span>
              <span className="ml-1.5 text-gray-700 dark:text-gray-300">{comparison.progresList.slice(0, 8).join(' · ')}</span>
            </p>
          )}
          {comparison.regressionList.length > 0 && (
            <p className="text-sm mb-1.5">
              <span className="font-bold text-red-700 dark:text-red-400">⚠ Domaines en régression à surveiller :</span>
              <span className="ml-1.5 text-gray-700 dark:text-gray-300">{comparison.regressionList.slice(0, 8).join(' · ')}</span>
            </p>
          )}
          {comparison.nouvellesList.length > 0 && (
            <p className="text-sm mb-3">
              <span className="font-bold text-blue-700 dark:text-blue-400">✨ Épreuves ajoutées :</span>
              <span className="ml-1.5 text-gray-700 dark:text-gray-300">{comparison.nouvellesList.slice(0, 8).join(' · ')}</span>
            </p>
          )}
          {/* Tableau comparatif détaillé */}
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
                {structure.domains.map((d, dIdx) => (
                  <React.Fragment key={`comp-${dIdx}`}>
                    <tr className="bg-emerald-50/60 dark:bg-emerald-900/10">
                      <td colSpan={4} className="font-bold text-emerald-700 dark:text-emerald-300 py-1.5 px-3 border border-gray-200 dark:border-surface-dark-muted">
                        {d.nom}
                      </td>
                    </tr>
                    {d.epreuves.map((e, eIdx) => {
                      const prev = comparison.prevIndex.get(e.nom.toLowerCase().trim())
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
                          <td className="py-1.5 px-3 text-center font-mono border border-gray-200 dark:border-surface-dark-muted" style={prev ? { backgroundColor: '#' + prevColor + '60' } : undefined}>
                            {prev ? formatPercentileForDisplay(prev.percentile, prev.value) : '—'}
                          </td>
                          <td className="py-1.5 px-3 text-center font-mono border border-gray-200 dark:border-surface-dark-muted" style={{ backgroundColor: '#' + curColor + '60' }}>
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
        </Section>
      )}

      {/* Bilan — un bloc par domaine */}
      {structure.domains?.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <BookOpen size={18} className="text-primary-600 dark:text-primary-400" />
            Bilan détaillé
          </h2>
          {/* Légende des seuils */}
          <div className="flex flex-wrap gap-2 text-xs">
            {SEUILS.map(s => (
              <span key={s.label} className="inline-flex items-center gap-1.5 px-2 py-1 rounded border" style={{ backgroundColor: '#' + s.shading, borderColor: '#' + s.shading, color: s.textColor ? '#' + s.textColor : undefined }}>
                <strong>{s.label}</strong> {s.range}
              </span>
            ))}
          </div>

          {structure.domains.map((domain, dIdx) => (
            <div key={dIdx} className="card-modern p-5">
              <h3 className="font-bold text-primary-700 dark:text-primary-400 text-base mb-3">
                {domain.nom}
              </h3>

              {/* Tableau des épreuves */}
              <div className="overflow-x-auto -mx-5 px-5">
                <table className="w-full text-sm">
                  <thead className="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-surface-dark-muted">
                    <tr>
                      <th className="text-left py-2 pr-3">Épreuve</th>
                      <th className="text-center py-2 px-2 w-20">Score</th>
                      <th className="text-center py-2 px-2 w-16">É-T</th>
                      <th className="text-center py-2 px-2 w-20">Centile</th>
                      <th className="text-center py-2 pl-2 w-32">Interprétation</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-surface-dark-muted/50">
                    {domain.epreuves.map((e, eIdx) => {
                      const color = getPercentileColor(e.percentile_value)
                      return (
                        <tr key={eIdx} className="hover:bg-gray-50 dark:hover:bg-surface-dark-muted/30">
                          <td className="py-2 pr-3 text-gray-900 dark:text-gray-100">{e.nom}</td>
                          <td className="py-2 px-2 text-center font-mono text-gray-700 dark:text-gray-300">{e.score}</td>
                          <td className="py-2 px-2 text-center font-mono text-gray-600 dark:text-gray-400">{e.et ?? '—'}</td>
                          <td className="py-2 px-2 text-center font-mono" style={{ backgroundColor: '#' + color + '60' }}>
                            {formatPercentileForDisplay(e.percentile, e.percentile_value)}
                          </td>
                          <td className="py-2 pl-2 text-center">
                            {(() => {
                              const seuil = seuilFor(e.percentile_value)
                              return (
                                <span className="inline-block px-2 py-0.5 rounded text-xs font-semibold" style={{ backgroundColor: '#' + seuil.shading, color: seuil.textColor ? '#' + seuil.textColor : '#000' }}>
                                  {seuil.label}
                                </span>
                              )
                            })()}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {domain.commentaire && (
                <p className="mt-4 text-sm text-gray-700 dark:text-gray-300 italic leading-relaxed whitespace-pre-line">
                  {domain.commentaire}
                </p>
              )}
              {/* Paragraphes dédiés par épreuve "en dessous de la médiane"
                  (P<50) — demande Laurie 2026-05. */}
              {domain.epreuves
                .filter((e) => typeof e.percentile_value === 'number'
                  && e.percentile_value < 50
                  && e.commentaire
                  && e.commentaire.trim().length > 0)
                .map((e, k) => (
                  <p key={`ep-${k}`} className="mt-3 text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                    <strong>{e.nom}</strong> — {e.commentaire}
                  </p>
                ))}
            </div>
          ))}
        </div>
      )}

      {/* Synthèse d'évolution — format Laurie 2026-05 :
          phrase introductive + 3 listes bullets (Progrès / Stagnation / Régression). */}
      {structure.synthese_evolution && (
        <Section title="Synthèse d'évolution" color="purple">
          <RichText text={structure.synthese_evolution.resume} />
          <div className="mt-4 space-y-4">
            {structure.synthese_evolution.domaines_progres?.length > 0 && (
              <div>
                <p className="text-xs uppercase tracking-wider font-bold text-green-700 dark:text-green-400 mb-2">✓ Progrès</p>
                <ul className="space-y-1 list-disc list-inside text-sm text-gray-800 dark:text-gray-200">
                  {structure.synthese_evolution.domaines_progres.filter(d => d?.trim()).map((d, i) => (
                    <li key={i}>{d.trim()}</li>
                  ))}
                </ul>
              </div>
            )}
            {structure.synthese_evolution.domaines_stagnation?.length > 0 && (
              <div>
                <p className="text-xs uppercase tracking-wider font-bold text-gray-600 dark:text-gray-400 mb-2">= Stagnation</p>
                <ul className="space-y-1 list-disc list-inside text-sm text-gray-800 dark:text-gray-200">
                  {structure.synthese_evolution.domaines_stagnation.filter(d => d?.trim()).map((d, i) => (
                    <li key={i}>{d.trim()}</li>
                  ))}
                </ul>
              </div>
            )}
            {structure.synthese_evolution.domaines_regression?.length > 0 && (
              <div>
                <p className="text-xs uppercase tracking-wider font-bold text-red-700 dark:text-red-400 mb-2">↓ Régression</p>
                <ul className="space-y-1 list-disc list-inside text-sm text-gray-800 dark:text-gray-200">
                  {structure.synthese_evolution.domaines_regression.filter(d => d?.trim()).map((d, i) => (
                    <li key={i}>{d.trim()}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </Section>
      )}

      {/* Synthèse et diagnostic — les H3 internes (Comportement, Points forts, …) structurent le texte */}
      <Section title="Synthèse et diagnostic" color="primary">
        <RichText text={structure.diagnostic} />
        {/* Toggle "Pourquoi cette conclusion ?" sous le diagnostic — révèle
            le raisonnement IA structuré (indices retenus, dissociations,
            sous-type, contre-indices). Replié par défaut. */}
        {structure.reasoning_clinical && (
          <ReasoningClinicalDisplay reasoning={structure.reasoning_clinical} />
        )}
      </Section>

      {/* Projet thérapeutique : SUPPRIMÉ (demande Laurie 2026-05) */}

      {/* Axes thérapeutiques — précédés d'une phrase introductive imposée Laurie. */}
      {structure.axes_therapeutiques && structure.axes_therapeutiques.filter(a => a?.trim()).length > 0 && (
        <Section title="Axes thérapeutiques" color="primary">
          <p className="text-gray-700 dark:text-gray-300 mb-3 text-sm">
            Au regard des éléments mis en évidence, les axes thérapeutiques privilégiés seraient les suivants :
          </p>
          <ol className="space-y-2 list-decimal list-inside">
            {structure.axes_therapeutiques.filter(a => a?.trim()).map((a, i) => (
              <li key={i} className="text-gray-800 dark:text-gray-200">{a.trim()}</li>
            ))}
          </ol>
        </Section>
      )}

      {/* PAP suggestions — précédés d'une phrase introductive imposée Laurie. */}
      {structure.pap_suggestions && structure.pap_suggestions.filter(p => p?.trim()).length > 0 && (
        <Section title="Aménagements scolaires (PAP)" color="blue">
          <p className="text-gray-700 dark:text-gray-300 mb-3 text-sm">
            Des aménagements pédagogiques de ce type pourraient être mis en place pour limiter l&apos;impact des troubles en situation scolaire.
          </p>
          <ul className="space-y-2">
            {structure.pap_suggestions.filter(p => p?.trim()).map((p, i) => (
              <li key={i} className="flex items-start gap-2 text-gray-800 dark:text-gray-200">
                <span className="text-blue-600 dark:text-blue-400 font-bold mt-0.5">✓</span>
                <span>{p.trim()}</span>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* Conclusion */}
      <Section title="Conclusion" color="primary">
        <p className="text-gray-800 dark:text-gray-200 italic text-sm">
          {structure.conclusion}
        </p>
      </Section>
    </div>
  )
}

function Section({ title, color, children, edited }: { title: string; color: 'primary' | 'purple' | 'blue' | 'gray'; children: React.ReactNode; edited?: boolean }) {
  const colorClass = {
    primary: 'text-primary-700 dark:text-primary-400',
    purple: 'text-purple-700 dark:text-purple-400',
    blue: 'text-blue-700 dark:text-blue-400',
    gray: 'text-gray-700 dark:text-gray-400',
  }[color]

  return (
    <div className={`card-modern p-5 ${edited ? 'ring-1 ring-blue-100 dark:ring-blue-900/30' : ''}`}>
      <div className="flex items-center justify-between gap-2 mb-3">
        <h3 className={`font-bold text-base ${colorClass}`}>{title}</h3>
        {edited && (
          <span
            title="Passage relu / édité par vous"
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
          >
            <UserCheck size={11} />
            édité
          </span>
        )}
      </div>
      {children}
    </div>
  )
}
