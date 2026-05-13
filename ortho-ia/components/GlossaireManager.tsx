'use client'

/**
 * Gestion du glossaire CRBO — corrections de mistranscriptions de la dictée
 * vocale. Affiché dans la page Profil, sous le Vocabulaire perso.
 *
 * Liste les entrées built-in (lecture seule, pour transparence) + permet
 * d'ajouter des corrections perso (ex: prénom d'école, surnom de test local).
 */

import { useEffect, useMemo, useState } from 'react'
import { Plus, Trash2, Edit, Save, X, BookOpen, ArrowRight, Lock } from 'lucide-react'
import {
  listUserGlossaire,
  listBuiltinGlossaire,
  createGlossaireEntry,
  updateGlossaireEntry,
  deleteGlossaireEntry,
  subscribeToGlossaire,
  type GlossaireEntry,
  type GlossaireCategory,
} from '@/lib/glossaire'
import { useToast } from './Toast'

const CATEGORIES: Array<{ value: GlossaireCategory; label: string }> = [
  { value: 'acronyme', label: 'Acronyme' },
  { value: 'test',     label: 'Test ortho' },
  { value: 'clinique', label: 'Terme clinique' },
  { value: 'autre',    label: 'Autre' },
]

const CATEGORY_LABEL: Record<GlossaireCategory, string> = {
  acronyme: 'Acronymes',
  test:     'Tests',
  clinique: 'Termes cliniques',
  autre:    'Autres',
}

export default function GlossaireManager() {
  const toast = useToast()
  const [userEntries, setUserEntries] = useState<GlossaireEntry[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [showBuiltins, setShowBuiltins] = useState(false)
  const [draftTerm, setDraftTerm] = useState('')
  const [draftAliases, setDraftAliases] = useState('')
  const [draftCategory, setDraftCategory] = useState<GlossaireCategory>('autre')

  useEffect(() => {
    const refresh = () => setUserEntries(listUserGlossaire())
    refresh()
    return subscribeToGlossaire(refresh)
  }, [])

  const builtins = useMemo(() => listBuiltinGlossaire(), [])
  const builtinsByCategory = useMemo(() => {
    const groups: Record<GlossaireCategory, typeof builtins[number][]> = {
      acronyme: [], test: [], clinique: [], autre: [],
    }
    for (const e of builtins) {
      const c = (e.category ?? 'autre') as GlossaireCategory
      groups[c].push(e)
    }
    return groups
  }, [builtins])

  const startEdit = (e: GlossaireEntry) => {
    setEditingId(e.id)
    setCreating(false)
    setDraftTerm(e.term)
    setDraftAliases(e.aliases.join(', '))
    setDraftCategory(e.category ?? 'autre')
  }
  const startCreate = () => {
    setEditingId(null)
    setCreating(true)
    setDraftTerm('')
    setDraftAliases('')
    setDraftCategory('autre')
  }
  const cancel = () => {
    setEditingId(null)
    setCreating(false)
    setDraftTerm('')
    setDraftAliases('')
  }
  const save = () => {
    const term = draftTerm.trim()
    const aliases = draftAliases.split(',').map(s => s.trim()).filter(Boolean)
    if (!term) {
      toast.error('Le terme correct est obligatoire.')
      return
    }
    if (aliases.length === 0) {
      toast.error('Indiquez au moins une mistranscription à corriger.')
      return
    }
    if (editingId) {
      const u = updateGlossaireEntry(editingId, { term, aliases, category: draftCategory })
      if (!u) {
        toast.error(`Impossible de mettre à jour (terme "${term}" déjà existant ?).`)
        return
      }
      toast.success(`Entrée "${term}" mise à jour.`)
    } else {
      const c = createGlossaireEntry({ term, aliases, category: draftCategory })
      if (!c) {
        toast.error(`Impossible de créer (terme "${term}" déjà existant ?).`)
        return
      }
      toast.success(`Entrée "${term}" ajoutée au glossaire.`)
    }
    cancel()
  }
  const remove = (e: GlossaireEntry) => {
    if (!confirm(`Supprimer l'entrée "${e.term}" du glossaire ?`)) return
    if (deleteGlossaireEntry(e.id)) {
      toast.success('Entrée supprimée.')
    }
  }

  return (
    <section style={{ marginTop: 32 }}>
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <BookOpen size={18} className="text-indigo-600" />
            Glossaire CRBO (dictée vocale)
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Corrige automatiquement les mistranscriptions de la dictée pour les termes
            spécifiques aux CRBO (ULIS, AESH, Exalang, EVALO…). Appliqué à la sortie du
            micro et sur les drafts générés par l&apos;IA.
          </p>
        </div>
        {!creating && !editingId && (
          <button
            type="button"
            onClick={startCreate}
            className="inline-flex items-center gap-2 px-3 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition"
          >
            <Plus size={16} />
            Nouvelle correction
          </button>
        )}
      </div>

      {(creating || editingId) && (
        <div className="border border-indigo-200 bg-indigo-50 rounded-lg p-4 mb-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Terme correct
              </label>
              <input
                value={draftTerm}
                onChange={(e) => setDraftTerm(e.target.value)}
                placeholder="ULIS"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Catégorie
              </label>
              <select
                value={draftCategory}
                onChange={(e) => setDraftCategory(e.target.value as GlossaireCategory)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
              >
                {CATEGORIES.map(c => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="mb-3">
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Mistranscriptions (séparées par des virgules)
            </label>
            <input
              value={draftAliases}
              onChange={(e) => setDraftAliases(e.target.value)}
              placeholder="ulysse, uliss, Ulysse"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
            <p className="text-xs text-gray-500 mt-1">
              Tous ces mots seront remplacés par <strong>{draftTerm || 'le terme correct'}</strong> dans
              le texte dicté. Substitution en mot entier, insensible à la casse.
            </p>
          </div>
          <div className="flex justify-end gap-2">
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
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700"
            >
              <Save size={14} />
              {editingId ? 'Mettre à jour' : 'Créer'}
            </button>
          </div>
        </div>
      )}

      {/* Liste des entrées perso */}
      {userEntries.length > 0 && (
        <div className="border border-gray-200 rounded-lg overflow-hidden mb-4">
          {userEntries.map((e, i) => (
            <div
              key={e.id}
              className={`flex items-start gap-3 p-3 ${i < userEntries.length - 1 ? 'border-b border-gray-100' : ''}`}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <code className="px-2 py-1 bg-indigo-50 text-indigo-700 text-xs font-mono rounded font-semibold">
                    {e.term}
                  </code>
                  <ArrowRight size={12} className="text-gray-400 rotate-180" />
                  <div className="flex flex-wrap gap-1">
                    {e.aliases.map((a, j) => (
                      <code key={j} className="px-2 py-0.5 bg-red-50 text-red-700 text-xs font-mono rounded">
                        {a}
                      </code>
                    ))}
                  </div>
                </div>
                {e.category && e.category !== 'autre' && (
                  <p className="text-xs text-gray-500 mt-1">{CATEGORY_LABEL[e.category]}</p>
                )}
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => startEdit(e)}
                  title="Modifier"
                  className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded"
                >
                  <Edit size={13} />
                </button>
                <button
                  onClick={() => remove(e)}
                  title="Supprimer"
                  className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Liste des entrées built-in (lecture seule, repliée par défaut) */}
      <div className="border border-gray-200 rounded-lg bg-gray-50">
        <button
          type="button"
          onClick={() => setShowBuiltins(v => !v)}
          className="w-full flex items-center justify-between p-3 text-sm text-gray-700 hover:bg-gray-100 transition rounded-lg"
        >
          <span className="flex items-center gap-2">
            <Lock size={14} className="text-gray-500" />
            <span className="font-medium">
              Corrections livrées par défaut ({builtins.length} entrées)
            </span>
          </span>
          <span className="text-xs text-gray-500">
            {showBuiltins ? 'Masquer' : 'Voir le détail'}
          </span>
        </button>
        {showBuiltins && (
          <div className="border-t border-gray-200 p-3 space-y-4">
            {(Object.keys(builtinsByCategory) as GlossaireCategory[]).map(cat => {
              const list = builtinsByCategory[cat]
              if (list.length === 0) return null
              return (
                <div key={cat}>
                  <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
                    {CATEGORY_LABEL[cat]} ({list.length})
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {list.map((e, i) => (
                      <span
                        key={i}
                        title={`Mistranscriptions corrigées : ${e.aliases.join(', ')}`}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-white border border-gray-200 rounded text-xs"
                      >
                        <code className="font-mono text-indigo-700 font-semibold">{e.term}</code>
                        <span className="text-gray-400">·</span>
                        <span className="text-gray-500">{e.aliases.length} variante{e.aliases.length > 1 ? 's' : ''}</span>
                      </span>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {userEntries.length === 0 && !creating && (
        <p className="text-xs text-gray-500 mt-3 italic">
          Astuce : si vous remarquez qu&apos;un terme spécifique à votre cabinet (nom d&apos;école,
          test peu courant) est toujours mal dicté, ajoutez-le ici une fois pour toutes.
        </p>
      )}
    </section>
  )
}
