'use client'

/**
 * UI de gestion du vocabulaire perso — dictionnaire de substitutions
 * appliqué après génération IA et avant export Word.
 *
 * Affichée dans la page Profil sous le bloc Snippets.
 */

import { useEffect, useState } from 'react'
import { Plus, Trash2, Edit, Save, X, Languages, ArrowRight } from 'lucide-react'
import {
  listVocabRules,
  createVocabRule,
  updateVocabRule,
  deleteVocabRule,
  subscribeToVocab,
  type VocabRule,
} from '@/lib/vocab-perso'
import { useToast } from './Toast'

const EXAMPLES: Array<{ from: string; to: string; hint: string }> = [
  { from: 'patient',                to: 'enfant',           hint: 'L\'IA dit "patient", vous préférez "enfant"' },
  { from: 'voie d\'assemblage',     to: 'décodage',         hint: 'Terminologie plus accessible' },
  { from: 'voie d\'adressage',      to: 'reconnaissance globale', hint: '' },
  { from: 'parents',                to: 'famille',          hint: 'Vous préférez un terme inclusif' },
]

export default function VocabManager() {
  const toast = useToast()
  const [rules, setRules] = useState<VocabRule[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [draftFrom, setDraftFrom] = useState('')
  const [draftTo, setDraftTo] = useState('')

  useEffect(() => {
    const refresh = () => setRules(listVocabRules())
    refresh()
    return subscribeToVocab(refresh)
  }, [])

  const startEdit = (r: VocabRule) => {
    setEditingId(r.id)
    setCreating(false)
    setDraftFrom(r.from)
    setDraftTo(r.to)
  }
  const startCreate = (example?: { from: string; to: string }) => {
    setEditingId(null)
    setCreating(true)
    setDraftFrom(example?.from ?? '')
    setDraftTo(example?.to ?? '')
  }
  const cancel = () => {
    setEditingId(null)
    setCreating(false)
    setDraftFrom('')
    setDraftTo('')
  }
  const save = () => {
    const from = draftFrom.trim()
    const to = draftTo.trim()
    if (!from || !to) {
      toast.error('Les deux champs sont obligatoires.')
      return
    }
    if (from === to) {
      toast.error('Le mot à remplacer doit être différent du remplaçant.')
      return
    }
    if (editingId) {
      const u = updateVocabRule(editingId, { from, to })
      if (!u) {
        toast.error(`Impossible de mettre à jour (règle "${from}" déjà existante ?).`)
        return
      }
      toast.success(`Règle "${from}" → "${to}" mise à jour.`)
    } else {
      const c = createVocabRule({ from, to })
      if (!c) {
        toast.error(`Impossible de créer (règle "${from}" déjà existante ?).`)
        return
      }
      toast.success(`Règle "${from}" → "${to}" créée.`)
    }
    cancel()
  }
  const remove = (r: VocabRule) => {
    if (!confirm(`Supprimer la règle "${r.from}" → "${r.to}" ?`)) return
    if (deleteVocabRule(r.id)) {
      toast.success('Règle supprimée.')
    }
  }

  return (
    <section style={{ marginTop: 32 }}>
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Languages size={18} className="text-green-600" />
            Vocabulaire perso
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Réécrit automatiquement les drafts IA avec votre vocabulaire préféré, avant l&apos;export Word.
            Appliqué uniquement sur les sections narratives (anamnèse, diagnostic, recommandations).
          </p>
        </div>
        {!creating && !editingId && (
          <button
            type="button"
            onClick={() => startCreate()}
            className="inline-flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition"
          >
            <Plus size={16} />
            Nouvelle règle
          </button>
        )}
      </div>

      {(creating || editingId) && (
        <div className="border border-green-200 bg-green-50 rounded-lg p-4 mb-4">
          <div className="grid grid-cols-1 sm:grid-cols-[1fr,auto,1fr] items-end gap-3 mb-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">L&apos;IA écrit</label>
              <input
                value={draftFrom}
                onChange={(e) => setDraftFrom(e.target.value)}
                placeholder="patient"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>
            <ArrowRight size={20} className="text-gray-400 mt-6 hidden sm:block" />
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Je préfère</label>
              <input
                value={draftTo}
                onChange={(e) => setDraftTo(e.target.value)}
                placeholder="enfant"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>
          </div>
          <p className="text-xs text-gray-500 mb-3">
            Substitution en mot entier, insensible à la casse. Évite que &laquo;&nbsp;patient&nbsp;&raquo;
            remplace dans &laquo;&nbsp;patiente&nbsp;&raquo; ou &laquo;&nbsp;impatient&nbsp;&raquo;.
          </p>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={cancel} className="inline-flex items-center gap-1.5 px-3 py-2 text-sm text-gray-600 hover:text-gray-900">
              <X size={14} /> Annuler
            </button>
            <button type="button" onClick={save} className="inline-flex items-center gap-1.5 px-3 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700">
              <Save size={14} />
              {editingId ? 'Mettre à jour' : 'Créer'}
            </button>
          </div>
        </div>
      )}

      {rules.length === 0 ? (
        <div>
          <p className="text-sm text-gray-500 py-2 italic mb-3">
            Aucune règle pour l&apos;instant. Quelques suggestions pour démarrer :
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {EXAMPLES.map((ex, i) => (
              <button
                key={i}
                type="button"
                onClick={() => startCreate({ from: ex.from, to: ex.to })}
                className="text-left p-3 border border-gray-200 rounded-lg hover:border-green-300 hover:bg-green-50 transition"
              >
                <div className="flex items-center gap-2 font-mono text-xs mb-1">
                  <code className="px-2 py-0.5 bg-red-50 text-red-700 rounded">{ex.from}</code>
                  <ArrowRight size={11} className="text-gray-400" />
                  <code className="px-2 py-0.5 bg-green-50 text-green-700 rounded">{ex.to}</code>
                </div>
                {ex.hint && <p className="text-xs text-gray-500 mt-1">{ex.hint}</p>}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          {rules.map((r, i) => (
            <div key={r.id} className={`flex items-center gap-3 p-3 ${i < rules.length - 1 ? 'border-b border-gray-100' : ''}`}>
              <code className="px-2 py-1 bg-red-50 text-red-700 text-xs font-mono rounded">{r.from}</code>
              <ArrowRight size={14} className="text-gray-400 shrink-0" />
              <code className="px-2 py-1 bg-green-50 text-green-700 text-xs font-mono rounded">{r.to}</code>
              <div className="ml-auto flex items-center gap-1">
                <button onClick={() => startEdit(r)} title="Modifier" className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded">
                  <Edit size={13} />
                </button>
                <button onClick={() => remove(r)} title="Supprimer" className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded">
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
