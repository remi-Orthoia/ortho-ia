'use client'

/**
 * Footer RGPD discret en bas de chaque page dashboard.
 *
 * Pourquoi : les orthophonistes sont sensibles à la conformité RGPD (RPPS,
 * secret professionnel, données de santé). Un mini-badge qui rassure en
 * permanence sans encombrer l'interface.
 *
 * ⚠️ Mention "HDS" volontairement OMISE :
 *   "Hébergeur de Données de Santé" (HDS) est une certification française
 *   réglementée (ANS). Supabase n'est PAS certifié HDS par défaut, Vercel
 *   non plus. Faire la claim sans certification est une faute (DGS pourrait
 *   sanctionner). Quand la certification sera obtenue, décommenter le span
 *   `<span data-needs-hds-cert>Conforme HDS</span>`.
 *
 * En revanche, "Données anonymisées avant transmission IA" est factuel :
 *   - lib/anonymizer.ts retire prénom/nom patient/médecin/ortho avant
 *     envoi à Anthropic (cf. anonymize() + scrubText() + rehydrate())
 *   - DDN convertie en âge calendaire — jamais envoyée brute
 *   - Test unitaire scripts/test-anonymizer.ts vérifie le scrub
 *
 * "Hébergement Europe" est factuel SI Supabase est configuré en région EU
 * (eu-west-X) ET Vercel deploye en région européenne. À vérifier projet
 * par projet, mais c'est la config par défaut documentée dans CLAUDE.md.
 */

import Link from 'next/link'
import { ShieldCheck } from 'lucide-react'

export default function RgpdFooter() {
  return (
    <footer
      style={{
        marginTop: 48,
        padding: '20px 16px',
        borderTop: '1px solid var(--border-ds, #E5E7EB)',
        fontFamily: 'var(--font-body)',
        fontSize: 12,
        color: 'var(--fg-3, #6B7280)',
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: '0 auto',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
        }}
      >
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            flexWrap: 'wrap',
          }}
        >
          <ShieldCheck size={14} style={{ color: 'var(--ds-success, #16a34a)', flexShrink: 0 }} aria-hidden />
          <span>
            <strong style={{ color: 'var(--fg-2, #374151)' }}>Données anonymisées</strong> avant transmission IA
          </span>
          <span aria-hidden style={{ color: 'var(--fg-3, #9CA3AF)' }}>·</span>
          <span>
            Hébergement <strong style={{ color: 'var(--fg-2, #374151)' }}>Europe</strong>
          </span>
          <span aria-hidden style={{ color: 'var(--fg-3, #9CA3AF)' }}>·</span>
          <span>Conformité RGPD</span>
          {/*
            Décommenter UNIQUEMENT après obtention de la certification HDS :
            <span aria-hidden style={{ color: 'var(--fg-3, #9CA3AF)' }}>·</span>
            <span>Conforme HDS</span>
          */}
        </div>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 14,
            flexWrap: 'wrap',
          }}
        >
          <Link
            href="/confidentialite"
            style={{ color: 'var(--fg-3, #6B7280)', textDecoration: 'none' }}
            className="hover:underline"
          >
            Politique de confidentialité
          </Link>
          <Link
            href="/cgu"
            style={{ color: 'var(--fg-3, #6B7280)', textDecoration: 'none' }}
            className="hover:underline"
          >
            CGU
          </Link>
        </div>
      </div>
    </footer>
  )
}
