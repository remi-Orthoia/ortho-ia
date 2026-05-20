'use client'

import { useMemo } from 'react'
import { Sparkles, Loader2 } from 'lucide-react'
import Pastille from './Pastille'
import { computeParentColor, cyclePastille } from '@/lib/bilans/math/parent-color'
import type { Epreuve, EpreuveState, PastilleEtat } from '@/lib/bilans/math/types'

/**
 * Carte d'une épreuve : libellé + pastille parent + sous-épreuves cliquables
 * (ou pastille directe si mono) + textarea de notes brutes + bouton "Générer
 * avec l'IA" + textarea iaText éditable.
 *
 * La logique d'appel IA est portée par BilanMathForm (qui a accès au contexte
 * global du bilan : patient, mode, autres épreuves). La carte expose juste
 * un callback `onGenerate`.
 */

interface EpreuveCardProps {
  epreuve: Epreuve
  state: EpreuveState
  onChange: (next: EpreuveState) => void
  /** Callback de génération IA pour CETTE épreuve. Si absent, le bouton est masqué. */
  onGenerate?: () => void
  /** Vrai si la génération IA est en cours pour cette épreuve. */
  isGenerating?: boolean
}

export default function EpreuveCard({
  epreuve,
  state,
  onChange,
  onGenerate,
  isGenerating = false,
}: EpreuveCardProps) {
  const isMono = epreuve.sousEpreuves.length === 0

  /** Couleur de l'épreuve parent : soit le clic direct (mono), soit calculée. */
  const parentColor: PastilleEtat = useMemo(() => {
    if (isMono) return state.direct ?? 'gris'
    const states = epreuve.sousEpreuves.map((se) => state.sousEpreuves[se.id] ?? 'gris')
    return computeParentColor(states)
  }, [isMono, epreuve.sousEpreuves, state.direct, state.sousEpreuves])

  const handleSousEpreuveClick = (sousEpreuveId: string) => {
    const current = state.sousEpreuves[sousEpreuveId] ?? 'gris'
    onChange({
      ...state,
      sousEpreuves: { ...state.sousEpreuves, [sousEpreuveId]: cyclePastille(current) },
    })
  }

  const handleDirectClick = () => {
    onChange({ ...state, direct: cyclePastille(state.direct ?? 'gris') })
  }

  /** Bouton IA désactivé si rien à dire : aucune cotation et aucune note. */
  const hasAnythingToSay = useMemo(() => {
    const anyColor = epreuve.sousEpreuves.some(
      (se) => state.sousEpreuves[se.id] && state.sousEpreuves[se.id] !== 'gris',
    ) || (state.direct && state.direct !== 'gris')
    return Boolean(anyColor || state.notes?.trim())
  }, [epreuve.sousEpreuves, state.sousEpreuves, state.direct, state.notes])

  return (
    <div
      style={{
        background: 'var(--bg-surface-1)',
        border: '1px solid var(--border-ds)',
        borderRadius: 12,
        padding: '14px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}
    >
      {/* En-tête : pastille + libellé épreuve */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        {isMono ? (
          <Pastille
            etat={parentColor}
            onClick={handleDirectClick}
            size={28}
            ariaPrefix={epreuve.label}
          />
        ) : (
          <Pastille
            etat={parentColor}
            readonly
            size={28}
            ariaPrefix={`${epreuve.label} (couleur calculée)`}
          />
        )}
        <h4
          style={{
            margin: 0,
            fontSize: 15,
            fontWeight: 600,
            color: 'var(--fg-1)',
            flex: 1,
            minWidth: 0,
          }}
        >
          {epreuve.label}
        </h4>
        {!isMono && (
          <span style={{ fontSize: 11, color: 'var(--fg-3)' }}>
            {epreuve.sousEpreuves.filter((se) => state.sousEpreuves[se.id] && state.sousEpreuves[se.id] !== 'gris').length}
            {' / '}
            {epreuve.sousEpreuves.length} cotées
          </span>
        )}
      </div>

      {/* Sous-épreuves (seulement si multi) */}
      {!isMono && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
            gap: 8,
            paddingLeft: 4,
          }}
        >
          {epreuve.sousEpreuves.map((se) => {
            const etat = state.sousEpreuves[se.id] ?? 'gris'
            return (
              <div
                key={se.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '6px 8px',
                  background: 'var(--bg-surface-2)',
                  borderRadius: 8,
                }}
              >
                <Pastille
                  etat={etat}
                  onClick={() => handleSousEpreuveClick(se.id)}
                  size={20}
                  ariaPrefix={`${epreuve.label} — ${se.label}`}
                />
                <span style={{ fontSize: 13, color: 'var(--fg-2)' }}>{se.label}</span>
              </div>
            )
          })}
        </div>
      )}

      {/* Notes brutes */}
      <div>
        <label
          style={{
            display: 'block',
            fontSize: 11,
            fontWeight: 600,
            color: 'var(--fg-3)',
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            marginBottom: 4,
          }}
        >
          Notes brutes
        </label>
        <textarea
          value={state.notes}
          onChange={(e) => onChange({ ...state, notes: e.target.value })}
          placeholder="Observations pendant la passation…"
          rows={2}
          style={{
            width: '100%',
            padding: '8px 10px',
            border: '1px solid var(--border-ds)',
            borderRadius: 8,
            fontSize: 13,
            fontFamily: 'inherit',
            background: 'var(--bg-surface-2)',
            color: 'var(--fg-1)',
            resize: 'vertical',
            minHeight: 56,
          }}
        />
      </div>

      {/* Bouton IA + texte généré */}
      {onGenerate && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={onGenerate}
              disabled={isGenerating || !hasAnythingToSay}
              title={
                !hasAnythingToSay
                  ? 'Cote au moins une sous-épreuve ou saisis une note pour générer.'
                  : 'Génère un paragraphe clinique pour cette épreuve à partir des cotations + notes.'
              }
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '7px 12px',
                background: hasAnythingToSay && !isGenerating ? 'var(--ds-primary)' : 'var(--bg-surface-2)',
                color: hasAnythingToSay && !isGenerating ? 'var(--fg-on-brand)' : 'var(--fg-3)',
                border: hasAnythingToSay && !isGenerating ? 0 : '1px solid var(--border-ds)',
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 600,
                cursor: isGenerating || !hasAnythingToSay ? 'not-allowed' : 'pointer',
                opacity: isGenerating || !hasAnythingToSay ? 0.7 : 1,
              }}
            >
              {isGenerating ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
              {isGenerating ? 'Génération…' : state.iaText ? 'Régénérer' : "Générer avec l'IA"}
            </button>
            {state.iaText && (
              <span style={{ fontSize: 11, color: 'var(--fg-3)', fontStyle: 'italic' }}>
                Texte modifiable — l&apos;ortho a le dernier mot.
              </span>
            )}
          </div>

          {state.iaText !== undefined && (
            <textarea
              value={state.iaText}
              onChange={(e) => onChange({ ...state, iaText: e.target.value })}
              placeholder="Le texte généré par l'IA apparaîtra ici, éditable."
              rows={4}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid var(--ds-primary, #16a34a)',
                borderRadius: 8,
                fontSize: 13,
                lineHeight: 1.5,
                fontFamily: 'inherit',
                background: 'var(--ds-primary-soft, #f0f9f4)',
                color: 'var(--fg-1)',
                resize: 'vertical',
                minHeight: 80,
              }}
            />
          )}
        </div>
      )}
    </div>
  )
}
