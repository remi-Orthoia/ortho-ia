'use client'

/**
 * Toggle "Pourquoi cette conclusion ?" qui révèle le raisonnement clinique
 * structuré de l'IA. Construit la confiance en désamorçant le côté
 * "boîte noire" du modèle.
 *
 * Affiché sous le diagnostic dans la preview CRBO (page résultats + page
 * historique détail). Replié par défaut — l'ortho ouvre quand elle veut
 * comprendre la décision.
 */

import { useState } from 'react'
import { ChevronDown, ChevronUp, Brain, Target, AlertTriangle, GitBranch } from 'lucide-react'
import type { ReasoningClinical } from '@/lib/prompts'

interface Props {
  reasoning: ReasoningClinical
}

export default function ReasoningClinicalDisplay({ reasoning }: Props) {
  const [open, setOpen] = useState(false)

  if (!reasoning?.indices_retenus || reasoning.indices_retenus.length === 0) {
    return null
  }

  return (
    <div
      style={{
        marginTop: 12,
        background: 'var(--bg-surface-2, #F9FAFB)',
        border: '1px solid var(--border-ds, #E5E7EB)',
        borderRadius: 12,
        overflow: 'hidden',
        fontFamily: 'var(--font-body)',
      }}
    >
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        style={{
          width: '100%',
          padding: '12px 16px',
          background: 'transparent',
          border: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 10,
          fontSize: 13,
          color: 'var(--fg-1)',
          fontWeight: 600,
          cursor: 'pointer',
          fontFamily: 'inherit',
          textAlign: 'left',
        }}
      >
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          <Brain size={16} style={{ color: '#7c3aed' }} />
          Pourquoi cette conclusion&nbsp;?
          <span style={{ fontSize: 11, color: 'var(--fg-3)', fontWeight: 400 }}>
            ({reasoning.indices_retenus.length} indice{reasoning.indices_retenus.length > 1 ? 's' : ''} retenu{reasoning.indices_retenus.length > 1 ? 's' : ''})
          </span>
        </span>
        {open ? <ChevronUp size={14} style={{ color: 'var(--fg-3)' }} /> : <ChevronDown size={14} style={{ color: 'var(--fg-3)' }} />}
      </button>

      {open && (
        <div style={{ padding: '0 16px 16px', borderTop: '1px solid var(--border-ds, #E5E7EB)' }}>
          {/* Indices cliniques principaux */}
          <Section
            icon={<Target size={14} style={{ color: '#7c3aed' }} />}
            title="Indices cliniques retenus"
            items={reasoning.indices_retenus}
            color="#7c3aed"
          />

          {/* Dissociations */}
          {reasoning.dissociations && reasoning.dissociations.length > 0 && (
            <Section
              icon={<GitBranch size={14} style={{ color: '#0e7490' }} />}
              title="Dissociations cliniques"
              items={reasoning.dissociations}
              color="#0e7490"
            />
          )}

          {/* Sous-type */}
          {reasoning.sous_type && (
            <div style={{ marginTop: 14 }}>
              <p style={{
                margin: 0, marginBottom: 4,
                fontSize: 12, fontWeight: 600, color: 'var(--fg-2)',
                textTransform: 'uppercase', letterSpacing: 0.4,
              }}>
                Forme retenue
              </p>
              <p style={{ margin: 0, fontSize: 13.5, color: 'var(--fg-1)' }}>
                {reasoning.sous_type}
              </p>
            </div>
          )}

          {/* Contre-indices — transparence intellectuelle */}
          {reasoning.contre_indices && reasoning.contre_indices.length > 0 && (
            <Section
              icon={<AlertTriangle size={14} style={{ color: '#b45309' }} />}
              title="Éléments à pondérer"
              items={reasoning.contre_indices}
              color="#b45309"
            />
          )}

          {/* Disclaimer */}
          <p style={{
            marginTop: 16, marginBottom: 0,
            fontSize: 11, color: 'var(--fg-3)',
            fontStyle: 'italic', lineHeight: 1.5,
          }}>
            Ce raisonnement est un brouillon technique fourni à titre indicatif. Le diagnostic
            final relève de votre jugement clinique.
          </p>
        </div>
      )}
    </div>
  )
}

function Section({
  icon, title, items, color,
}: {
  icon: React.ReactNode
  title: string
  items: string[]
  color: string
}) {
  return (
    <div style={{ marginTop: 14 }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6,
        marginBottom: 6,
        fontSize: 12, fontWeight: 600, color: 'var(--fg-2)',
        textTransform: 'uppercase', letterSpacing: 0.4,
      }}>
        {icon}
        <span>{title}</span>
      </div>
      <ul style={{
        margin: 0, padding: 0, listStyle: 'none',
        display: 'flex', flexDirection: 'column', gap: 8,
      }}>
        {items.map((item, i) => (
          <li
            key={i}
            style={{
              fontSize: 13, lineHeight: 1.55,
              color: 'var(--fg-1)',
              paddingLeft: 14,
              position: 'relative',
            }}
          >
            <span style={{
              position: 'absolute', left: 0, top: 8,
              width: 6, height: 6, borderRadius: '50%',
              background: color,
            }} />
            {item}
          </li>
        ))}
      </ul>
    </div>
  )
}
