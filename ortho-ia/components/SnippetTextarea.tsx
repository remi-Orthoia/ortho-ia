'use client'

/**
 * Textarea avec autocomplete de snippets via raccourci /keyword.
 *
 * Quand l'utilisateur tape `/`, un popup s'ouvre sous le textarea avec la
 * liste des snippets enregistrés. Filtrage live à chaque frappe. Flèches
 * haut/bas pour naviguer, Enter ou Tab pour insérer, Esc pour fermer.
 *
 * Wrap-friendly : props identiques à une textarea HTML standard + onChange
 * recevant la nouvelle valeur (façon controlled component).
 *
 * Limitation V1 : le popup est positionné sous le textarea (pas attaché au
 * caret). Sur les textareas longues, c'est moins précis qu'un caret-anchored
 * popup mais ça suffit pour l'usage et c'est beaucoup plus simple à coder
 * (pas de mirror div + measureText).
 */

import { useEffect, useMemo, useRef, useState } from 'react'
import {
  detectSlashTrigger,
  listSnippets,
  subscribeToSnippets,
  bumpSnippetUsage,
  ensureDefaultSnippets,
  type Snippet,
} from '@/lib/snippets'

type TextareaProps = Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'onChange' | 'value'>

interface Props extends TextareaProps {
  value: string
  onChange: (next: string) => void
  /** Désactive la détection de snippets (par défaut : actif). */
  disableSnippets?: boolean
}

export default function SnippetTextarea({
  value,
  onChange,
  disableSnippets,
  onKeyDown: parentKeyDown,
  ...rest
}: Props) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [snippets, setSnippets] = useState<Snippet[]>([])
  const [open, setOpen] = useState(false)
  const [keyword, setKeyword] = useState('')
  const [triggerStart, setTriggerStart] = useState<number | null>(null)
  const [activeIdx, setActiveIdx] = useState(0)

  // Charge la liste au mount + souscrit aux changements (création/suppression
  // depuis la page profil ouverte dans un autre onglet).
  useEffect(() => {
    ensureDefaultSnippets()
    const load = () => setSnippets(listSnippets())
    load()
    return subscribeToSnippets(load)
  }, [])

  // Snippets filtrés par le keyword courant. Tri par useCount décroissant
  // pour mettre en avant les snippets les plus utilisés.
  const filtered = useMemo(() => {
    const sorted = [...snippets].sort((a, b) => (b.useCount ?? 0) - (a.useCount ?? 0))
    if (!keyword) return sorted.slice(0, 8)
    const lower = keyword.toLowerCase()
    return sorted
      .filter(s => s.key.toLowerCase().includes(lower) || s.description?.toLowerCase().includes(lower))
      .slice(0, 8)
  }, [snippets, keyword])

  // Quand la liste filtrée change, ramène l'index actif à 0
  useEffect(() => {
    setActiveIdx(0)
  }, [filtered.length, keyword])

  // À chaque changement de texte ou de position du caret : on vérifie si
  // un trigger /keyword est actif et on ouvre/ferme le popup en conséquence.
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const next = e.target.value
    onChange(next)
    if (disableSnippets) return
    const caret = e.target.selectionStart ?? next.length
    const trigger = detectSlashTrigger(next, caret)
    if (trigger) {
      setOpen(true)
      setKeyword(trigger.keyword)
      setTriggerStart(trigger.start)
    } else {
      setOpen(false)
      setKeyword('')
      setTriggerStart(null)
    }
  }

  // Sélection caret (souris/clavier) : on re-check le trigger
  const handleSelect = () => {
    if (disableSnippets) return
    const el = textareaRef.current
    if (!el) return
    const trigger = detectSlashTrigger(el.value, el.selectionStart)
    if (trigger) {
      setOpen(true)
      setKeyword(trigger.keyword)
      setTriggerStart(trigger.start)
    } else if (open) {
      setOpen(false)
    }
  }

  const insertSnippet = (snippet: Snippet) => {
    if (triggerStart === null) return
    const el = textareaRef.current
    if (!el) return
    const before = value.slice(0, triggerStart)
    const after = value.slice(el.selectionStart)
    const inserted = `${before}${snippet.body}${after}`
    onChange(inserted)
    setOpen(false)
    setKeyword('')
    setTriggerStart(null)
    bumpSnippetUsage(snippet.id)
    // Repositionne le caret après le contenu inséré, au prochain tick.
    requestAnimationFrame(() => {
      const el2 = textareaRef.current
      if (!el2) return
      const newCaret = before.length + snippet.body.length
      el2.focus()
      el2.setSelectionRange(newCaret, newCaret)
    })
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Ouvert : on gère arrow/enter/tab/esc en priorité
    if (open && filtered.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setActiveIdx(i => (i + 1) % filtered.length)
        return
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        setActiveIdx(i => (i - 1 + filtered.length) % filtered.length)
        return
      }
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault()
        insertSnippet(filtered[activeIdx])
        return
      }
      if (e.key === 'Escape') {
        e.preventDefault()
        setOpen(false)
        setKeyword('')
        setTriggerStart(null)
        return
      }
    }
    // Sinon : on passe la main au handler parent éventuel
    parentKeyDown?.(e)
  }

  return (
    <div style={{ position: 'relative' }}>
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onSelect={handleSelect}
        onClick={handleSelect}
        {...rest}
      />
      {open && filtered.length > 0 && (
        <div
          role="listbox"
          aria-label="Snippets disponibles"
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            marginTop: 6,
            zIndex: 60,
            background: 'var(--bg-surface, white)',
            border: '1px solid var(--border-ds-strong, #D1D5DB)',
            borderRadius: 10,
            boxShadow: '0 10px 25px -5px rgba(0,0,0,0.10), 0 8px 10px -6px rgba(0,0,0,0.05)',
            minWidth: 320,
            maxWidth: 560,
            maxHeight: 340,
            overflowY: 'auto',
            fontFamily: 'var(--font-body)',
          }}
        >
          <div style={{
            padding: '8px 12px',
            borderBottom: '1px solid var(--border-ds, #E5E7EB)',
            fontSize: 11,
            fontWeight: 600,
            color: 'var(--fg-3, #6B7280)',
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <span>Snippets {keyword && `· filtre "${keyword}"`}</span>
            <span style={{ fontSize: 10, fontWeight: 500, textTransform: 'none', letterSpacing: 0, color: 'var(--fg-3, #9CA3AF)' }}>
              ↑↓ naviguer · Entrée insérer · Esc fermer
            </span>
          </div>
          {filtered.map((s, idx) => (
            <button
              key={s.id}
              type="button"
              role="option"
              aria-selected={idx === activeIdx}
              onMouseEnter={() => setActiveIdx(idx)}
              onClick={() => insertSnippet(s)}
              style={{
                width: '100%',
                display: 'block',
                textAlign: 'left',
                padding: '8px 12px',
                background: idx === activeIdx ? 'var(--bg-surface-2, #F3F4F6)' : 'transparent',
                border: 0,
                cursor: 'pointer',
                fontFamily: 'inherit',
                borderBottom: idx < filtered.length - 1 ? '1px solid var(--border-ds, #E5E7EB)' : 'none',
              }}
            >
              <div style={{
                display: 'flex', alignItems: 'baseline', gap: 8,
                marginBottom: 2,
              }}>
                <code style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: 'var(--ds-primary-hover, #16a34a)',
                  fontFamily: 'var(--font-mono, ui-monospace)',
                  background: 'rgba(34,197,94,0.10)',
                  padding: '1px 6px',
                  borderRadius: 4,
                }}>
                  /{s.key}
                </code>
                {s.description && (
                  <span style={{ fontSize: 12, color: 'var(--fg-2, #6B7280)' }}>
                    {s.description}
                  </span>
                )}
              </div>
              <div style={{
                fontSize: 12.5,
                color: 'var(--fg-2, #4B5563)',
                lineHeight: 1.4,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                fontStyle: 'italic',
              }}>
                {s.body.slice(0, 120)}{s.body.length > 120 && '…'}
              </div>
            </button>
          ))}
          <div style={{
            padding: '6px 12px',
            borderTop: '1px solid var(--border-ds, #E5E7EB)',
            fontSize: 11,
            color: 'var(--fg-3, #9CA3AF)',
            background: 'var(--bg-surface-2, #F9FAFB)',
          }}>
            Gérez vos snippets dans <a href="/dashboard/profil" style={{ color: 'var(--ds-primary, #16a34a)', textDecoration: 'underline' }}>Mon profil</a>
          </div>
        </div>
      )}
    </div>
  )
}
