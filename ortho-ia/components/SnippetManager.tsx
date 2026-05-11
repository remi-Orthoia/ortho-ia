'use client'

/**
 * UI de gestion des snippets persos. Affichée dans la page Profil.
 *
 * Permet : voir la liste, créer / éditer / supprimer un snippet. Snippets
 * par défaut sont pré-installés au 1er chargement (cf. ensureDefaultSnippets).
 */

import { useEffect, useState } from 'react'
import { Plus, Trash2, Edit, Save, X, Sparkles } from 'lucide-react'
import {
  listSnippets,
  createSnippet,
  updateSnippet,
  deleteSnippet,
  subscribeToSnippets,
  ensureDefaultSnippets,
  type Snippet,
} from '@/lib/snippets'
import { useToast } from './Toast'

export default function SnippetManager() {
  const toast = useToast()
  const [snippets, setSnippets] = useState<Snippet[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draftKey, setDraftKey] = useState('')
  const [draftBody, setDraftBody] = useState('')
  const [draftDesc, setDraftDesc] = useState('')
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    ensureDefaultSnippets()
    const refresh = () => setSnippets(listSnippets())
    refresh()
    return subscribeToSnippets(refresh)
  }, [])

  const startEdit = (s: Snippet) => {
    setEditingId(s.id)
    setDraftKey(s.key)
    setDraftBody(s.body)
    setDraftDesc(s.description ?? '')
    setCreating(false)
  }
  const startCreate = () => {
    setEditingId(null)
    setCreating(true)
    setDraftKey('')
    setDraftBody('')
    setDraftDesc('')
  }
  const cancel = () => {
    setEditingId(null)
    setCreating(false)
    setDraftKey('')
    setDraftBody('')
    setDraftDesc('')
  }

  const save = () => {
    const key = draftKey.trim().toLowerCase().replace(/\s+/g, '-')
    if (!key || !draftBody.trim()) {
      toast.error('Le raccourci et le contenu sont obligatoires.')
      return
    }
    if (!/^[a-z0-9-_]+$/.test(key)) {
      toast.error('Le raccourci doit contenir uniquement des lettres, chiffres, tirets ou underscores.')
      return
    }
    if (editingId) {
      const updated = updateSnippet(editingId, { key, body: draftBody, description: draftDesc })
      if (!updated) {
        toast.error('Impossible de mettre à jour (raccourci déjà utilisé ?).')
        return
      }
      toast.success(`Snippet /${key} mis à jour.`)
    } else {
      const created = createSnippet({ key, body: draftBody, description: draftDesc })
      if (!created) {
        toast.error('Impossible de créer (raccourci /' + key + ' déjà utilisé ?).')
        return
      }
      toast.success(`Snippet /${key} créé.`)
    }
    cancel()
  }

  const remove = (s: Snippet) => {
    if (!confirm(`Supprimer le snippet /${s.key} ?`)) return
    if (deleteSnippet(s.id)) {
      toast.success(`Snippet /${s.key} supprimé.`)
    } else {
      toast.error('Suppression échouée.')
    }
  }

  return (
    <section style={{ marginTop: 32 }}>
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Sparkles size={18} className="text-green-600" />
            Vos snippets
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Raccourcis textuels insérables en tapant <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs text-gray-700">/raccourci</code>{' '}
            dans n'importe quelle zone de texte (anamnèse, notes…).
          </p>
        </div>
        {!creating && !editingId && (
          <button
            type="button"
            onClick={startCreate}
            className="inline-flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition"
          >
            <Plus size={16} />
            Nouveau snippet
          </button>
        )}
      </div>

      {(creating || editingId) && (
        <div className="border border-green-200 bg-green-50 rounded-lg p-4 mb-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-1">
              <label className="block text-xs font-semibold text-gray-700 mb-1">Raccourci (sans /)</label>
              <input
                value={draftKey}
                onChange={(e) => setDraftKey(e.target.value)}
                placeholder="fatigue"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-gray-700 mb-1">Description (optionnel)</label>
              <input
                value={draftDesc}
                onChange={(e) => setDraftDesc(e.target.value)}
                placeholder="Fatigabilité observée en séance"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Contenu inséré</label>
            <textarea
              value={draftBody}
              onChange={(e) => setDraftBody(e.target.value)}
              rows={3}
              placeholder="L'enfant présente une fatigabilité notable en fin de séance..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={cancel}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-sm text-gray-600 hover:text-gray-900"
            >
              <X size={14} /> Annuler
            </button>
            <button
              type="button"
              onClick={save}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700"
            >
              <Save size={14} />
              {editingId ? 'Mettre à jour' : 'Créer'}
            </button>
          </div>
        </div>
      )}

      {snippets.length === 0 ? (
        <p className="text-sm text-gray-500 py-4 italic">
          Aucun snippet pour l'instant. Cliquez "Nouveau snippet" pour en créer un.
        </p>
      ) : (
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          {snippets.map((s, i) => (
            <div
              key={s.id}
              className={`flex items-start gap-3 p-3 ${i < snippets.length - 1 ? 'border-b border-gray-100' : ''} ${editingId === s.id ? 'bg-green-50' : 'bg-white'}`}
            >
              <code className="font-mono text-xs px-2 py-1 bg-green-100 text-green-800 rounded shrink-0 mt-0.5">
                /{s.key}
              </code>
              <div className="flex-1 min-w-0">
                {s.description && (
                  <div className="text-xs font-medium text-gray-700 mb-0.5">{s.description}</div>
                )}
                <div className="text-sm text-gray-600 line-clamp-2 italic">{s.body}</div>
                {(s.useCount ?? 0) > 0 && (
                  <div className="text-xs text-gray-400 mt-1">Utilisé {s.useCount} fois</div>
                )}
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => startEdit(s)}
                  title="Modifier"
                  className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded transition"
                >
                  <Edit size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => remove(s)}
                  title="Supprimer"
                  className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
