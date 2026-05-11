'use client'

/**
 * Carnet de session — journal libre de l'orthophoniste.
 *
 * Inspiré des bullet journals papier des orthos : entre les CRBOs,
 * on note des observations vrac, des idées, des rappels. Pas lié à
 * un patient (pour ça, il y a PatientNotesThread sur la fiche).
 *
 * UI : timeline antéchronologique, compose en haut + MicButton pour
 * dictée, filtrage par catégorie, édition inline.
 */

import { useEffect, useState } from 'react'
import { BookText, Send, Loader2, Edit, Trash2, Check, X, Filter } from 'lucide-react'
import MicButton from '@/components/MicButton'
import SnippetTextarea from '@/components/SnippetTextarea'
import { useToast } from '@/components/Toast'

type Category = 'observation' | 'idee' | 'rappel' | 'formation' | 'autre'

const CATEGORIES: Array<{ id: Category; label: string; emoji: string; color: string }> = [
  { id: 'observation', label: 'Observation', emoji: '👁️', color: '#7c3aed' },
  { id: 'idee',        label: 'Idée',        emoji: '💡', color: '#d97706' },
  { id: 'rappel',      label: 'Rappel',      emoji: '⏰', color: '#dc2626' },
  { id: 'formation',   label: 'Formation',   emoji: '📚', color: '#2563eb' },
  { id: 'autre',       label: 'Autre',       emoji: '✏️', color: '#6b7280' },
]

interface Entry {
  id: string
  body: string
  category: Category | null
  created_at: string
  updated_at: string
}

function formatRelative(iso: string): string {
  try {
    const d = new Date(iso)
    const now = new Date()
    const diffSec = Math.floor((now.getTime() - d.getTime()) / 1000)
    if (diffSec < 60) return "à l'instant"
    if (diffSec < 3600) return `il y a ${Math.floor(diffSec / 60)} min`
    if (diffSec < 86400) return `il y a ${Math.floor(diffSec / 3600)} h`
    // Pour les entrées plus anciennes, date absolue lisible
    const sameDay = d.toDateString() === now.toDateString()
    if (sameDay) return `Aujourd'hui, ${d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`
    const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1)
    if (d.toDateString() === yesterday.toDateString()) return `Hier, ${d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`
    return d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short', year: d.getFullYear() !== now.getFullYear() ? 'numeric' : undefined })
  } catch {
    return ''
  }
}

export default function CarnetPage() {
  const toast = useToast()
  const [entries, setEntries] = useState<Entry[]>([])
  const [loading, setLoading] = useState(true)
  const [composeText, setComposeText] = useState('')
  const [composeCategory, setComposeCategory] = useState<Category | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [filter, setFilter] = useState<Category | 'all'>('all')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editText, setEditText] = useState('')
  const [editCategory, setEditCategory] = useState<Category | null>(null)
  const [editSaving, setEditSaving] = useState(false)

  const fetchEntries = async () => {
    try {
      const res = await fetch('/api/journal')
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erreur')
      setEntries(data.entries ?? [])
    } catch (err: any) {
      toast.error(err?.message || 'Impossible de charger le carnet')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchEntries() }, [])

  const handleSubmit = async () => {
    const text = composeText.trim()
    if (!text || submitting) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/journal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: text, category: composeCategory }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erreur')
      setEntries(prev => [data.entry, ...prev])
      setComposeText('')
      setComposeCategory(null)
    } catch (err: any) {
      toast.error(err?.message || "Impossible d'enregistrer")
    } finally {
      setSubmitting(false)
    }
  }

  const startEdit = (e: Entry) => {
    setEditingId(e.id)
    setEditText(e.body)
    setEditCategory(e.category)
  }
  const cancelEdit = () => {
    setEditingId(null)
    setEditText('')
    setEditCategory(null)
  }
  const submitEdit = async (id: string) => {
    const text = editText.trim()
    if (!text || editSaving) return
    setEditSaving(true)
    try {
      const res = await fetch(`/api/journal/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: text, category: editCategory }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erreur')
      setEntries(prev => prev.map(e => e.id === id ? data.entry : e))
      cancelEdit()
    } catch (err: any) {
      toast.error(err?.message || 'Mise à jour échouée')
    } finally {
      setEditSaving(false)
    }
  }
  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer cette entrée ? Cette action est irréversible.')) return
    try {
      const res = await fetch(`/api/journal/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Erreur')
      }
      setEntries(prev => prev.filter(e => e.id !== id))
      toast.success('Entrée supprimée.')
    } catch (err: any) {
      toast.error(err?.message || 'Suppression échouée')
    }
  }

  const filteredEntries = filter === 'all' ? entries : entries.filter(e => e.category === filter)

  return (
    <div style={{ maxWidth: 820, margin: '0 auto', fontFamily: 'var(--font-body)' }}>
      <header style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <BookText size={20} style={{ color: 'var(--ds-primary, #16a34a)' }} />
          <h1 style={{ margin: 0, fontSize: 28, fontWeight: 700, color: 'var(--fg-1)' }}>
            Carnet de session
          </h1>
        </div>
        <p style={{ margin: 0, fontSize: 14, color: 'var(--fg-2)', lineHeight: 1.6 }}>
          Journal libre entre les bilans : observations cliniques brutes, idées de formation,
          rappels personnels. Privé, jamais transmis à l&apos;IA.
        </p>
      </header>

      {/* Compose */}
      <section style={{
        background: 'var(--bg-surface, white)',
        border: '1px solid var(--border-ds, #E5E7EB)',
        borderRadius: 14,
        padding: 18,
        marginBottom: 20,
      }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
          {CATEGORIES.map(c => (
            <button
              key={c.id}
              type="button"
              onClick={() => setComposeCategory(composeCategory === c.id ? null : c.id)}
              style={{
                padding: '5px 10px',
                fontSize: 12, fontWeight: 500,
                background: composeCategory === c.id ? c.color : 'transparent',
                color: composeCategory === c.id ? 'white' : c.color,
                border: `1px solid ${c.color}40`,
                borderRadius: 999,
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              {c.emoji} {c.label}
            </button>
          ))}
        </div>
        <div style={{ position: 'relative' }}>
          <SnippetTextarea
            value={composeText}
            onChange={setComposeText}
            placeholder="Notez une observation, une idée, un rappel… (tapez /fatigue, /anxiete pour insérer vos snippets · Cmd+Entrée pour publier)"
            rows={4}
            onKeyDown={(e) => {
              if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                e.preventDefault()
                handleSubmit()
              }
            }}
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
            maxLength={10000}
          />
        </div>
        <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <MicButton
              value={composeText}
              onChange={setComposeText}
              variant="filled"
              compact={false}
              onError={(msg) => toast.error(msg)}
            />
            <span style={{ fontSize: 11, color: 'var(--fg-3)' }}>{composeText.length}/10000</span>
          </div>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!composeText.trim() || submitting}
            className="btn-primary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            {submitting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
            Ajouter au carnet
          </button>
        </div>
      </section>

      {/* Filtres */}
      {entries.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
          <Filter size={14} style={{ color: 'var(--fg-3)' }} />
          <button
            type="button"
            onClick={() => setFilter('all')}
            style={{
              padding: '4px 10px',
              fontSize: 12, fontWeight: 500,
              background: filter === 'all' ? 'var(--ds-primary, #16a34a)' : 'transparent',
              color: filter === 'all' ? 'white' : 'var(--fg-2)',
              border: '1px solid var(--border-ds-strong, #D1D5DB)',
              borderRadius: 999,
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            Toutes ({entries.length})
          </button>
          {CATEGORIES.map(c => {
            const count = entries.filter(e => e.category === c.id).length
            if (count === 0) return null
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => setFilter(c.id)}
                style={{
                  padding: '4px 10px',
                  fontSize: 12, fontWeight: 500,
                  background: filter === c.id ? c.color : 'transparent',
                  color: filter === c.id ? 'white' : c.color,
                  border: `1px solid ${c.color}40`,
                  borderRadius: 999,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                {c.emoji} {c.label} ({count})
              </button>
            )
          })}
        </div>
      )}

      {/* Liste */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 32 }}>
          <Loader2 size={20} className="animate-spin" style={{ color: 'var(--fg-3)' }} />
        </div>
      ) : entries.length === 0 ? (
        <div style={{
          padding: '40px 20px', textAlign: 'center',
          background: 'var(--bg-surface-2, #F9FAFB)',
          border: '1px dashed var(--border-ds-strong, #D1D5DB)',
          borderRadius: 12,
          color: 'var(--fg-3)',
          fontSize: 14,
        }}>
          <BookText size={28} style={{ marginBottom: 8, opacity: 0.5 }} />
          <p style={{ margin: 0, fontStyle: 'italic' }}>
            Votre carnet est vide. Notez votre première observation ci-dessus.
          </p>
        </div>
      ) : filteredEntries.length === 0 ? (
        <p style={{ fontSize: 14, color: 'var(--fg-3)', textAlign: 'center', padding: 24, fontStyle: 'italic' }}>
          Aucune entrée dans cette catégorie.
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filteredEntries.map(e => {
            const cat = CATEGORIES.find(c => c.id === e.category)
            const isEditing = editingId === e.id
            const edited = e.updated_at !== e.created_at
            return (
              <article
                key={e.id}
                style={{
                  background: 'var(--bg-surface, white)',
                  border: '1px solid var(--border-ds, #E5E7EB)',
                  borderRadius: 12,
                  padding: 16,
                  position: 'relative',
                }}
              >
                {isEditing ? (
                  <div>
                    <div style={{ display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
                      {CATEGORIES.map(c => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => setEditCategory(editCategory === c.id ? null : c.id)}
                          style={{
                            padding: '3px 8px',
                            fontSize: 11, fontWeight: 500,
                            background: editCategory === c.id ? c.color : 'transparent',
                            color: editCategory === c.id ? 'white' : c.color,
                            border: `1px solid ${c.color}40`,
                            borderRadius: 999,
                            cursor: 'pointer',
                            fontFamily: 'inherit',
                          }}
                        >
                          {c.emoji} {c.label}
                        </button>
                      ))}
                    </div>
                    <SnippetTextarea
                      value={editText}
                      onChange={setEditText}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                      maxLength={10000}
                    />
                    <div style={{ marginTop: 8, display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                      <button onClick={cancelEdit} style={{ padding: '5px 10px', fontSize: 12, background: 'transparent', border: 0, color: 'var(--fg-3)', cursor: 'pointer' }}>
                        <X size={12} style={{ verticalAlign: 'middle', marginRight: 2 }} /> Annuler
                      </button>
                      <button
                        onClick={() => submitEdit(e.id)}
                        disabled={!editText.trim() || editSaving}
                        style={{
                          padding: '5px 10px', fontSize: 12,
                          background: 'var(--ds-primary, #16a34a)',
                          color: 'white', border: 0, borderRadius: 6, cursor: 'pointer',
                          opacity: !editText.trim() || editSaving ? 0.5 : 1,
                        }}
                      >
                        {editSaving ? <Loader2 size={12} className="animate-spin" style={{ verticalAlign: 'middle', marginRight: 2 }} /> : <Check size={12} style={{ verticalAlign: 'middle', marginRight: 2 }} />}
                        Enregistrer
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, marginBottom: 8, flexWrap: 'wrap' }}>
                      {cat ? (
                        <span style={{
                          padding: '2px 8px',
                          background: `${cat.color}22`,
                          color: cat.color,
                          fontSize: 11,
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          letterSpacing: 0.5,
                          borderRadius: 4,
                        }}>
                          {cat.emoji} {cat.label}
                        </span>
                      ) : <span />}
                      <span style={{ fontSize: 11, color: 'var(--fg-3)' }}>
                        {formatRelative(e.created_at)}
                        {edited && ' · modifié'}
                      </span>
                    </div>
                    <p style={{ margin: 0, fontSize: 14.5, color: 'var(--fg-1)', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                      {e.body}
                    </p>
                    <div style={{ marginTop: 10, display: 'flex', justifyContent: 'flex-end', gap: 4 }}>
                      <button
                        onClick={() => startEdit(e)}
                        title="Modifier"
                        style={{ padding: 4, background: 'transparent', border: 0, color: 'var(--fg-3)', cursor: 'pointer', borderRadius: 4 }}
                      >
                        <Edit size={13} />
                      </button>
                      <button
                        onClick={() => handleDelete(e.id)}
                        title="Supprimer"
                        style={{ padding: 4, background: 'transparent', border: 0, color: 'var(--fg-3)', cursor: 'pointer', borderRadius: 4 }}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </>
                )}
              </article>
            )
          })}
        </div>
      )}
    </div>
  )
}
