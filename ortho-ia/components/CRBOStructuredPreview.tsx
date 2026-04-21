'use client'

import { Download, Edit, AlertTriangle, Sparkles, BookOpen, Eye } from 'lucide-react'
import type { CRBOStructure } from '@/lib/prompts'
import { SEUILS, seuilFor, getPercentileColor } from '@/lib/word-export'

interface Props {
  structure: CRBOStructure
  onDownload: () => void
  /** Callback pour basculer en édition texte brut. */
  onEdit?: () => void
  /** Si fourni, affiche un bouton "Prévisualiser" qui ouvre un modal plein écran. */
  onPreview?: () => void
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
export default function CRBOStructuredPreview({ structure, onDownload, onEdit, onPreview }: Props) {
  const sev = structure.severite_globale
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
            Structure générée par Claude — téléchargez en Word pour l&apos;envoi final
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

      {/* Anamnèse */}
      <Section title="Anamnèse" color="primary">
        <p className="text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-line">
          {structure.anamnese_redigee || <em className="text-gray-400">[À compléter — anamnèse non reformulée]</em>}
        </p>
      </Section>

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
              <span key={s.label} className="inline-flex items-center gap-1.5 px-2 py-1 rounded border" style={{ backgroundColor: '#' + s.shading, borderColor: '#' + s.shading }}>
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
                            {e.percentile}
                          </td>
                          <td className="py-2 pl-2 text-center">
                            <span className="inline-block px-2 py-0.5 rounded text-xs font-semibold" style={{ backgroundColor: '#' + color, color: '#000' }}>
                              {e.interpretation}
                            </span>
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
            </div>
          ))}
        </div>
      )}

      {/* Synthèse d'évolution */}
      {structure.synthese_evolution && (
        <Section title="Synthèse d'évolution" color="purple">
          <RichText text={structure.synthese_evolution.resume} />
          <div className="grid sm:grid-cols-3 gap-3 text-sm">
            {structure.synthese_evolution.domaines_progres?.length > 0 && (
              <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/40">
                <p className="text-xs uppercase tracking-wider font-bold text-green-700 dark:text-green-400 mb-1">✓ Progrès</p>
                <p className="text-gray-800 dark:text-gray-200">{structure.synthese_evolution.domaines_progres.join(', ')}</p>
              </div>
            )}
            {structure.synthese_evolution.domaines_stagnation?.length > 0 && (
              <div className="p-3 rounded-lg bg-gray-50 dark:bg-surface-dark-muted/30 border border-gray-200 dark:border-surface-dark-muted">
                <p className="text-xs uppercase tracking-wider font-bold text-gray-600 dark:text-gray-400 mb-1">= Stagnation</p>
                <p className="text-gray-800 dark:text-gray-200">{structure.synthese_evolution.domaines_stagnation.join(', ')}</p>
              </div>
            )}
            {structure.synthese_evolution.domaines_regression?.length > 0 && (
              <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/40">
                <p className="text-xs uppercase tracking-wider font-bold text-red-700 dark:text-red-400 mb-1">↓ Régression</p>
                <p className="text-gray-800 dark:text-gray-200">{structure.synthese_evolution.domaines_regression.join(', ')}</p>
              </div>
            )}
          </div>
        </Section>
      )}

      {/* Synthèse et diagnostic — les H3 internes (Comportement, Points forts, …) structurent le texte */}
      <Section title="Synthèse et diagnostic" color="primary">
        <RichText text={structure.diagnostic} />
      </Section>

      {/* Recommandations */}
      <Section title="Recommandations" color="primary">
        <RichText text={structure.recommandations} />
      </Section>

      {/* PAP suggestions */}
      {structure.pap_suggestions && structure.pap_suggestions.filter(p => p?.trim()).length > 0 && (
        <Section title="Aménagements scolaires (PAP)" color="blue">
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

function Section({ title, color, children }: { title: string; color: 'primary' | 'purple' | 'blue' | 'gray'; children: React.ReactNode }) {
  const colorClass = {
    primary: 'text-primary-700 dark:text-primary-400',
    purple: 'text-purple-700 dark:text-purple-400',
    blue: 'text-blue-700 dark:text-blue-400',
    gray: 'text-gray-700 dark:text-gray-400',
  }[color]

  return (
    <div className="card-modern p-5">
      <h3 className={`font-bold text-base mb-3 ${colorClass}`}>{title}</h3>
      {children}
    </div>
  )
}
