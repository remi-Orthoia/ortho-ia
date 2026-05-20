'use client'

import EpreuveCard from './EpreuveCard'
import type { Domaine, EpreuveState, BilanMathDraft } from '@/lib/bilans/math/types'

/**
 * Section d'un domaine (Logique, Numération, etc.) — titre + liste de cartes
 * d'épreuves. Pas de pastille au niveau du domaine (les domaines sont des
 * regroupements visuels, pas des unités cotées).
 */

interface DomaineSectionProps {
  domaine: Domaine
  epreuves: BilanMathDraft['epreuves']
  onEpreuveChange: (epreuveId: string, next: EpreuveState) => void
  /** Callback de génération IA, forwardé à chaque carte. */
  onGenerateEpreuve?: (epreuveId: string) => void
  /** id de l'épreuve en cours de génération (pour afficher le spinner sur la bonne carte). */
  generatingEpreuveId?: string | null
}

export default function DomaineSection({
  domaine,
  epreuves,
  onEpreuveChange,
  onGenerateEpreuve,
  generatingEpreuveId,
}: DomaineSectionProps) {
  return (
    <section style={{ marginBottom: 32 }}>
      <h3
        style={{
          margin: '0 0 12px',
          fontSize: 13,
          fontWeight: 700,
          color: 'var(--fg-3)',
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          paddingBottom: 8,
          borderBottom: '1px solid var(--border-ds)',
        }}
      >
        {domaine.label}
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {domaine.epreuves.map((epreuve) => (
          <EpreuveCard
            key={epreuve.id}
            epreuve={epreuve}
            state={epreuves[epreuve.id] ?? { sousEpreuves: {}, notes: '' }}
            onChange={(next) => onEpreuveChange(epreuve.id, next)}
            onGenerate={onGenerateEpreuve ? () => onGenerateEpreuve(epreuve.id) : undefined}
            isGenerating={generatingEpreuveId === epreuve.id}
          />
        ))}
      </div>
    </section>
  )
}
