'use client'

/**
 * Fil de notes / discussion sur la fiche patient.
 *
 * Style Linear comments : timeline antéchronologique, édition inline,
 * suppression confirmée, indicateur "modifié il y a Xmin".
 *
 * V1 (beta) : scope personnel à l'ortho. Les notes ne sont PAS partagées
 * entre membres d'un cabinet — c'est documenté dans le sous-titre du
 * composant. Le passage en mode team sera trivial une fois le schéma
 * étendu (cf. supabase-patient-notes.sql).
 */

import { useEffect, useState } from 'react'
import { MessageSquare, Send, Edit, Trash2, Check, X, Loader2 } from 'lucide-react'
import { useToast } from './Toast'

interface Note {
  id: string
  body: string
  created_at: string
  updated_at: string
}

interface Props {
  patientId: string
  /** Affichage du nom dans le placeholder (ex: "À propos de Léa…"). */
  patientFirstName?: string
}

function formatRelative(iso: string): string {
  try {
    const ts = new Date(iso).getTime()
    const seconds = Math.floor((Date.now() - ts) / 1000)
    if (seconds < 30) return "à l'instant"
    if (seconds < 60) return `il y a ${seconds} s`
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `il y a ${minutes} min`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `il y a ${hours} h`
    const days = Math.floor(hours / 24)
    if (days < 30) return `il y a ${days} j`
    return new Date(iso).toLocaleDateString('fr-FR')
  } catch {
    return ''
  }
}

export default function PatientNotesThread({ patientId, patientFirstName }: Props) {
  const toast = useToast()
  const [notes, setNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(true)
  const [composeText, setComposeText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editText, setEditText] = useState('')
  const [editSubmitting, setEditSubmitting] = useState(false)

  const fetchNotes = async () => {
    try {
      const res = await fetch(`/api/patients/${patientId}/notes`)
      const data = await res.json()
      if (!res.ok) {
        if (res.status === 401) return // session expirée — middleware redirigera
        throw new Error(data.error || 'Erreur')
      }
      setNotes(data.notes ?? [])
    } catch (err: any) {
      toast.error(err?.message || 'Impossible de charger les notes')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchNotes()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patientId])

  const handleSubmit = async () => {
    const text = composeText.trim()
    if (!text || submitting) return
    setSubmitting(true)
    try {
      const res = await fetch(`/api/patients/${patientId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: text }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erreur')
      setNotes(prev => [data.note, ...prev])
      setComposeText('')
    } catch (err: any) {
      toast.error(err?.message || 'Impossible de créer la note')
    } finally {
      setSubmitting(false)
    }
  }

  const startEdit = (note: Note) => {
    setEditingId(note.id)
    setEditText(note.body)
  }
  const cancelEdit = () => {
    setEditingId(null)
    setEditText('')
  }
  const submitEdit = async (noteId: string) => {
    const text = editText.trim()
    if (!text || editSubmitting) return
    setEditSubmitting(true)
    try {
      const res = await fetch(`/api/patients/${patientId}/notes/${noteId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: text }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erreur')
      setNotes(prev => prev.map(n => n.id === noteId ? data.note : n))
      cancelEdit()
    } catch (err: any) {
      toast.error(err?.message || 'Impossible de mettre à jour la note')
    } finally {
      setEditSubmitting(false)
    }
  }

  const handleDelete = async (noteId: string) => {
    if (!confirm('Supprimer cette note ? Cette action est irréversible.')) return
    try {
      const res = await fetch(`/api/patients/${patientId}/notes/${noteId}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Erreur')
      }
      setNotes(prev => prev.filter(n => n.id !== noteId))
      toast.success('Note supprimée.')
    } catch (err: any) {
      toast.error(err?.message || 'Impossible de supprimer la note')
    }
  }

  return (
    <section className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center gap-2 mb-1">
        <MessageSquare className="text-green-600" size={20} />
        <h2 className="text-lg font-semibold text-gray-900">Notes & fil de discussion</h2>
        <span className="ml-auto text-xs text-gray-500">{notes.length} note{notes.length > 1 ? 's' : ''}</span>
      </div>
      <p className="text-xs text-gray-500 mb-4">
        Bloc-notes privé sur ce patient — observations entre séances, rappels, retours médecin /
        famille. Visible uniquement par vous (le partage avec un cabinet team sera proposé en V2).
      </p>

      {/* Compose */}
      <div className="mb-4">
        <textarea
          value={composeText}
          onChange={(e) => setComposeText(e.target.value)}
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
              e.preventDefault()
              handleSubmit()
            }
          }}
          rows={3}
          placeholder={
            patientFirstName
              ? `Ajouter une note sur ${patientFirstName}… (Cmd+Entrée pour envoyer)`
              : 'Ajouter une note… (Cmd+Entrée pour envoyer)'
          }
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
          maxLength={4000}
        />
        <div className="mt-2 flex items-center justify-between">
          <span className="text-xs text-gray-400">{composeText.length}/4000</span>
          <button
            onClick={handleSubmit}
            disabled={!composeText.trim() || submitting}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {submitting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
            Publier
          </button>
        </div>
      </div>

      {/* Liste des notes */}
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="animate-spin text-gray-400" size={20} />
        </div>
      ) : notes.length === 0 ? (
        <p className="text-sm text-gray-500 italic text-center py-6">
          Aucune note pour ce patient. Démarrez le fil avec une observation, un rappel, un retour famille.
        </p>
      ) : (
        <div className="space-y-3">
          {notes.map((n) => {
            const edited = n.updated_at !== n.created_at
            const isEditing = editingId === n.id
            return (
              <div
                key={n.id}
                className="border border-gray-200 rounded-lg p-3 bg-gray-50/50 hover:bg-white transition"
              >
                {isEditing ? (
                  <div>
                    <textarea
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      rows={3}
                      className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                      maxLength={4000}
                    />
                    <div className="mt-2 flex items-center justify-end gap-2">
                      <button
                        onClick={cancelEdit}
                        className="inline-flex items-center gap-1 px-2 py-1 text-xs text-gray-600 hover:text-gray-900"
                      >
                        <X size={12} /> Annuler
                      </button>
                      <button
                        onClick={() => submitEdit(n.id)}
                        disabled={!editText.trim() || editSubmitting}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-600 text-white rounded text-xs font-medium hover:bg-green-700 disabled:opacity-50"
                      >
                        {editSubmitting ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                        Enregistrer
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">{n.body}</p>
                    <div className="mt-2 flex items-center justify-between text-xs text-gray-400">
                      <span>
                        {formatRelative(n.created_at)}
                        {edited && ` · modifié ${formatRelative(n.updated_at)}`}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => startEdit(n)}
                          title="Modifier"
                          className="p-1 hover:text-gray-700 hover:bg-gray-100 rounded transition"
                        >
                          <Edit size={12} />
                        </button>
                        <button
                          onClick={() => handleDelete(n.id)}
                          title="Supprimer"
                          className="p-1 hover:text-red-600 hover:bg-red-50 rounded transition"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}
