'use client'

import type { ReactNode } from 'react'
import { Download, FileText, ArrowLeft, CheckCircle } from 'lucide-react'
import AppButton from './AppButton'
import Badge from './Badge'

export interface ReportPreviewSection {
  title: string
  /** Contenu HTML rendu en prose. Strings ou ReactNode. */
  content: ReactNode
}

export interface ReportPreviewMeta {
  /** Cabinet ou en-tête courte (ex. "Cabinet Julie Moreau · Orthophoniste"). */
  cabinetHeader?: string
  /** Patient — "Léa Martin · née le 04/09/2018 (7 ans) · Bilan du 12 mars 2026". */
  subtitle: string
  /** Titre principal du document (default : "Compte-rendu de bilan orthophonique"). */
  title?: string
}

interface Props {
  meta: ReportPreviewMeta
  sections: ReportPreviewSection[]
  /** Affiche le bandeau "Rapport prêt — généré en X". */
  generationTime?: string
  /** Callback du bouton "Télécharger en .docx". */
  onDownload?: () => void
  /** Callback du bouton "Modifier le bilan" — retour. */
  onBack?: () => void
  /** Slot d'actions additionnelles (ex. partager, supprimer). */
  extraActions?: ReactNode
  /** Badges de style appliqué au rapport (ex. "Sobre", "Pour confrère"). */
  styleBadges?: string[]
}

/**
 * Aperçu HTML d'un CRBO avant téléchargement Word — design system Stéphanie.
 * 2 colonnes : article (document) + side panel (actions + style).
 *
 * Utilisable depuis nouveau-crbo/resultats/page.tsx ou depuis historique/[id]
 * en passant les sections déjà rédigées par Claude (anamnèse, plainte,
 * conclusion, etc.) dans `sections`.
 */
export default function ReportPreview({
  meta, sections, generationTime,
  onDownload, onBack, extraActions, styleBadges,
}: Props) {
  return (
    <div className="report-preview" style={{
      padding: '24px 32px 48px',
      display: 'grid', gridTemplateColumns: '1fr 280px', gap: 24,
      alignItems: 'start',
      fontFamily: 'var(--font-body)', color: 'var(--fg-1)',
    }}>
      {/* Document */}
      <article style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-ds)',
        borderRadius: 14,
        padding: '56px 72px',
        boxShadow: 'var(--shadow-sm)',
        lineHeight: 1.65,
        maxWidth: 760,
      }}>
        {meta.cabinetHeader && (
          <p style={{ fontSize: 12, color: 'var(--fg-3)', letterSpacing: '0.08em', textTransform: 'uppercase', margin: 0 }}>
            {meta.cabinetHeader}
          </p>
        )}
        <h1 style={{
          fontFamily: 'var(--font-display)', fontSize: 30, fontWeight: 600,
          letterSpacing: '-0.015em', margin: '14px 0 6px', color: 'var(--fg-1)',
        }}>
          {meta.title ?? 'Compte-rendu de bilan orthophonique'}
        </h1>
        <p style={{ fontSize: 14, color: 'var(--fg-2)', margin: 0 }}>{meta.subtitle}</p>
        <hr style={{ border: 0, borderTop: '1px solid var(--border-ds)', margin: '28px 0' }} />

        {sections.map((s, i) => (
          <section key={i} style={{ marginBottom: i === sections.length - 1 ? 0 : 14 }}>
            <h2 style={{
              fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 600,
              margin: i === 0 ? '0 0 8px' : '20px 0 8px', color: 'var(--fg-1)',
            }}>
              {s.title}
            </h2>
            <div style={{ fontSize: 14.5 }}>
              {typeof s.content === 'string' ? <p style={{ margin: 0 }}>{s.content}</p> : s.content}
            </div>
          </section>
        ))}
      </article>

      {/* Side panel */}
      <aside style={{ display: 'flex', flexDirection: 'column', gap: 16, position: 'sticky', top: 24 }}>
        {generationTime && (
          <div style={{
            background: 'var(--ds-success-soft)', color: 'var(--ds-success)',
            borderRadius: 14, padding: 14, fontSize: 13, fontWeight: 500,
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <CheckCircle size={16} />
            <span>Rapport prêt — généré en {generationTime}</span>
          </div>
        )}

        <div style={{
          background: 'var(--bg-surface)', border: '1px solid var(--border-ds)',
          borderRadius: 14, padding: 16,
        }}>
          <p style={{
            fontSize: 12, fontWeight: 600, letterSpacing: '0.08em',
            textTransform: 'uppercase', color: 'var(--fg-3)', margin: '0 0 10px',
          }}>Actions</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {onDownload && (
              <AppButton
                variant="primary" size="md"
                icon={<Download size={16} />}
                onClick={onDownload}
                style={{ justifyContent: 'flex-start' }}
              >
                Télécharger en .docx
              </AppButton>
            )}
            {extraActions}
            {onBack && (
              <AppButton
                variant="ghost" size="md"
                icon={<ArrowLeft size={16} />}
                onClick={onBack}
                style={{ justifyContent: 'flex-start' }}
              >
                Modifier le bilan
              </AppButton>
            )}
          </div>
        </div>

        {styleBadges && styleBadges.length > 0 && (
          <div style={{
            background: 'var(--bg-surface)', border: '1px solid var(--border-ds)',
            borderRadius: 14, padding: 16,
          }}>
            <p style={{
              fontSize: 12, fontWeight: 600, letterSpacing: '0.08em',
              textTransform: 'uppercase', color: 'var(--fg-3)', margin: '0 0 10px',
            }}>Style</p>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {styleBadges.map((b, i) => (
                <Badge key={b} tone={i === 0 ? 'primary' : 'neutral'}>{b}</Badge>
              ))}
            </div>
          </div>
        )}
      </aside>
    </div>
  )
}
