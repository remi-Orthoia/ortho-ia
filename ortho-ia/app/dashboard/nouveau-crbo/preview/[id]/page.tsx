'use client'

/**
 * Page de prévisualisation + édition manuelle d'un CRBO avant téléchargement.
 *
 * Flow : après la phase 2 (synthèse), au lieu de télécharger Word directement,
 * l'orthophoniste arrive ici. Elle peut :
 *  - relire le CRBO complet rendu fidèlement (anamnèse, tableaux, diagnostic,
 *    recommandations, axes, PAP, conclusion),
 *  - éditer chaque section (clic = textarea, blur = retour preview),
 *  - voir une auto-save discrète (debounced 10s) qui sauvegarde en DB
 *    chaque modification via PATCH /api/crbo/:id,
 *  - télécharger le Word (avec les édits intégrés) ou le PDF (via print),
 *  - revenir au dashboard quand elle a fini.
 *
 * Layout : 2 colonnes desktop (nav 30% / contenu 70%), 1 colonne mobile.
 *
 * Stratégie d'édition : pas de contenteditable HTML (= cauchemar à parser
 * vers le docx). À la place, un toggle "preview / edit" par section :
 *   - mode preview = rendu HTML pretty (RichText avec **bold**, H3, listes)
 *   - mode edit = textarea brute avec les marqueurs markdown visibles
 * Auto-save sur la valeur brute, avec rendu pretty au blur. Bordure bleue
 * subtile au hover pour signaler l'éditabilité.
 *
 * Auto-save :
 *   - debounce 1.5s (l'ortho tape, on attend qu'elle s'arrête, on PATCH)
 *   - flush forcé sur blur ET avant unload (beforeunload)
 *   - indicateur "💾 Enregistré il y a Xs" en bas à droite
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, Download, FileDown, Loader2, AlertCircle, Sparkles,
  Check, Edit3, Eye, FileText, BookOpen, AlertTriangle, ListChecks,
  RefreshCw, X,
} from 'lucide-react'
import { createClient } from '@/lib/supabase'
import type { CRBOStructure, CRBODomain } from '@/lib/prompts'
import { SEUILS, seuilFor, getPercentileColor, formatPercentileForDisplay } from '@/lib/word-export'
import { applyVocabToObject } from '@/lib/vocab-perso'
import { applyGlossaireToObject } from '@/lib/glossaire'

interface CRBORow {
  id: string
  user_id: string
  patient_prenom: string
  patient_nom: string
  patient_classe: string | null
  patient_ddn: string | null
  bilan_date: string
  bilan_type: 'initial' | 'renouvellement'
  medecin_nom: string | null
  medecin_tel: string | null
  motif: string | null
  anamnese: string | null
  test_utilise: string | null
  resultats: string | null
  notes_analyse: string | null
  structure_json: CRBOStructure | null
  bilan_precedent_id: string | null
  statut: 'a_rediger' | 'a_relire' | 'termine'
}

interface Profile {
  prenom: string
  nom: string
  adresse?: string | null
  code_postal?: string | null
  ville?: string | null
  telephone?: string | null
  email?: string | null
}

/** Rendu d'un texte avec `**bold**` et lignes `**Titre**` seules → H3.
 *  Pas de dépendance externe — petit parseur maison aligné sur ce que le
 *  CRBOStructuredPreview utilise. */
function RichText({ text }: { text: string }) {
  if (!text) return null
  const lines = text.split('\n')
  const out: React.ReactNode[] = []
  let buffer: string[] = []
  const flush = (key: number) => {
    if (buffer.length === 0) return
    const joined = buffer.join(' ')
    const parts = joined.split(/(\*\*[^*]+\*\*)/g).filter(p => p.length > 0)
    out.push(
      <p key={`p-${key}`} className="text-gray-800 leading-relaxed mb-3">
        {parts.map((p, i) =>
          p.startsWith('**') && p.endsWith('**') ? (
            <strong key={i} className="font-semibold">{p.slice(2, -2)}</strong>
          ) : (
            <span key={i}>{p}</span>
          ),
        )}
      </p>,
    )
    buffer = []
  }
  lines.forEach((line, idx) => {
    const t = line.trim()
    if (!t) { flush(idx); return }
    const h3 = t.match(/^\*\*([^*]+)\*\*\s*:?\s*$/)
    if (h3) {
      flush(idx)
      out.push(
        <h4 key={`h-${idx}`} className="font-bold text-primary-700 mt-4 mb-2">{h3[1].trim()}</h4>,
      )
      return
    }
    // Liste numérotée "1. ..."
    const num = t.match(/^(\d+)[.)]\s+(.+)$/)
    if (num) {
      flush(idx)
      out.push(
        <p key={`l-${idx}`} className="text-gray-800 leading-relaxed mb-1.5 pl-4 -indent-4">
          <strong className="text-primary-700">{num[1]}.</strong>{' '}
          {num[2].split(/(\*\*[^*]+\*\*)/g).filter(p => p.length > 0).map((p, i) =>
            p.startsWith('**') && p.endsWith('**')
              ? <strong key={i} className="font-semibold">{p.slice(2, -2)}</strong>
              : <span key={i}>{p}</span>,
          )}
        </p>,
      )
      return
    }
    buffer.push(t)
  })
  flush(lines.length)
  return <>{out}</>
}

/** Petit indicateur "édité par vous" — petit badge UserCheck. */
function EditedBadge({ shown }: { shown: boolean }) {
  if (!shown) return null
  return (
    <span
      title="Modifié par vous"
      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-50 text-blue-700 border border-blue-200"
    >
      <Edit3 size={10} /> édité
    </span>
  )
}

/**
 * Éditeur de section textuelle. Toggle preview ↔ textarea au clic.
 * Auto-save debounce 1.5s.
 */
function SectionEditor({
  id,
  title,
  icon,
  fieldPath,
  initialValue,
  onSave,
  onRegenerate,
  placeholder,
  multiline = true,
  helperText,
}: {
  id: string
  title: string
  icon?: React.ReactNode
  fieldPath: string
  initialValue: string
  onSave: (path: string, value: string) => void
  /** Si fourni, expose un bouton "Régénérer" qui appellera ce callback avec
   *  le contenu actuel. Le parent ouvre alors la modale d'instruction. */
  onRegenerate?: (currentText: string) => void
  placeholder?: string
  multiline?: boolean
  helperText?: string
}) {
  const [value, setValue] = useState(initialValue)
  const [editing, setEditing] = useState(false)
  const [originalValue] = useState(initialValue)
  const debounceRef = useRef<NodeJS.Timeout | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Resync si la prop change (cas du rechargement après PATCH)
  useEffect(() => {
    setValue(initialValue)
  }, [initialValue])

  const scheduleSave = useCallback((next: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      onSave(fieldPath, next)
    }, 1500)
  }, [fieldPath, onSave])

  const flushSave = useCallback(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
      debounceRef.current = null
    }
    if (value !== originalValue) {
      onSave(fieldPath, value)
    }
  }, [value, originalValue, fieldPath, onSave])

  useEffect(() => () => { if (debounceRef.current) clearTimeout(debounceRef.current) }, [])

  // Focus auto la textarea en passant en mode édition
  useEffect(() => {
    if (editing && textareaRef.current) {
      textareaRef.current.focus()
      // Resize naturel au contenu
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px'
    }
  }, [editing])

  const isEdited = value.trim() !== originalValue.trim()
  const isEmpty = !value.trim()

  return (
    <section id={id} className="scroll-mt-24">
      <div className="flex items-center justify-between gap-2 mb-2">
        <h3 className="text-base font-bold text-primary-700 flex items-center gap-2">
          {icon}
          {title}
          <EditedBadge shown={isEdited} />
        </h3>
        <div className="flex items-center gap-1.5">
          {onRegenerate && (
            <button
              type="button"
              onClick={() => onRegenerate(value)}
              className="text-xs text-gray-500 hover:text-purple-600 inline-flex items-center gap-1 px-2 py-1 rounded hover:bg-purple-50 transition"
              title="Régénérer cette section avec une instruction libre"
            >
              <RefreshCw size={12} /> Régénérer
            </button>
          )}
          <button
            type="button"
            onClick={() => editing ? (flushSave(), setEditing(false)) : setEditing(true)}
            className="text-xs text-gray-500 hover:text-primary-600 inline-flex items-center gap-1 px-2 py-1 rounded hover:bg-gray-50"
          >
            {editing ? <><Eye size={12} /> Aperçu</> : <><Edit3 size={12} /> Éditer</>}
          </button>
        </div>
      </div>

      {editing ? (
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => {
            const v = e.target.value
            setValue(v)
            scheduleSave(v)
            // Auto-resize
            const el = e.target
            el.style.height = 'auto'
            el.style.height = el.scrollHeight + 'px'
          }}
          onBlur={() => { flushSave() }}
          rows={multiline ? 6 : 2}
          placeholder={placeholder}
          className="w-full px-3 py-2.5 border-2 border-blue-300 bg-blue-50/30 rounded-lg text-sm leading-relaxed font-sans resize-none focus:outline-none focus:ring-2 focus:ring-blue-400"
          style={{ minHeight: multiline ? '120px' : '40px' }}
        />
      ) : (
        <div
          onClick={() => setEditing(true)}
          className={`cursor-text px-3 py-2.5 rounded-lg border-2 border-transparent hover:border-blue-200 hover:bg-blue-50/30 transition-colors min-h-[60px] ${isEmpty ? 'italic text-gray-400' : ''}`}
        >
          {isEmpty ? (
            <span>{placeholder || 'Cliquez pour ajouter du contenu…'}</span>
          ) : (
            <RichText text={value} />
          )}
        </div>
      )}

      {helperText && (
        <p className="text-[11px] text-gray-500 mt-1 italic">{helperText}</p>
      )}
    </section>
  )
}

/** Éditeur de liste (axes thérapeutiques, PAP suggestions). Un item par ligne
 *  en mode édition ; affichage en `<ul>` pretty en mode preview. */
function ListEditor({
  id,
  title,
  icon,
  fieldPath,
  initialItems,
  onSave,
  onRegenerate,
  placeholder,
  helperText,
}: {
  id: string
  title: string
  icon?: React.ReactNode
  fieldPath: string
  initialItems: string[]
  onSave: (path: string, value: string[]) => void
  /** Régénérer la liste : reçoit le texte (un item par ligne) actuel. */
  onRegenerate?: (currentText: string) => void
  placeholder?: string
  helperText?: string
}) {
  const initialText = (initialItems ?? []).filter(Boolean).join('\n')
  const [text, setText] = useState(initialText)
  const [editing, setEditing] = useState(false)
  const [originalText] = useState(initialText)
  const debounceRef = useRef<NodeJS.Timeout | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    setText((initialItems ?? []).filter(Boolean).join('\n'))
  }, [initialItems])

  const itemsFromText = (t: string) => t.split('\n').map(s => s.trim()).filter(Boolean)

  const scheduleSave = useCallback((next: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      onSave(fieldPath, itemsFromText(next))
    }, 1500)
  }, [fieldPath, onSave])

  const flushSave = useCallback(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
      debounceRef.current = null
    }
    if (text !== originalText) {
      onSave(fieldPath, itemsFromText(text))
    }
  }, [text, originalText, fieldPath, onSave])

  useEffect(() => () => { if (debounceRef.current) clearTimeout(debounceRef.current) }, [])

  useEffect(() => {
    if (editing && textareaRef.current) {
      textareaRef.current.focus()
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px'
    }
  }, [editing])

  const items = itemsFromText(text)
  const isEdited = text.trim() !== originalText.trim()

  return (
    <section id={id} className="scroll-mt-24">
      <div className="flex items-center justify-between gap-2 mb-2">
        <h3 className="text-base font-bold text-primary-700 flex items-center gap-2">
          {icon}
          {title}
          <EditedBadge shown={isEdited} />
        </h3>
        <div className="flex items-center gap-1.5">
          {onRegenerate && (
            <button
              type="button"
              onClick={() => onRegenerate(text)}
              className="text-xs text-gray-500 hover:text-purple-600 inline-flex items-center gap-1 px-2 py-1 rounded hover:bg-purple-50 transition"
              title="Régénérer cette liste avec une instruction libre"
            >
              <RefreshCw size={12} /> Régénérer
            </button>
          )}
          <button
            type="button"
            onClick={() => editing ? (flushSave(), setEditing(false)) : setEditing(true)}
            className="text-xs text-gray-500 hover:text-primary-600 inline-flex items-center gap-1 px-2 py-1 rounded hover:bg-gray-50"
          >
            {editing ? <><Eye size={12} /> Aperçu</> : <><Edit3 size={12} /> Éditer</>}
          </button>
        </div>
      </div>

      {editing ? (
        <>
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => {
              setText(e.target.value)
              scheduleSave(e.target.value)
              const el = e.target
              el.style.height = 'auto'
              el.style.height = el.scrollHeight + 'px'
            }}
            onBlur={() => { flushSave() }}
            placeholder={placeholder}
            className="w-full px-3 py-2.5 border-2 border-blue-300 bg-blue-50/30 rounded-lg text-sm leading-relaxed font-sans resize-none focus:outline-none focus:ring-2 focus:ring-blue-400"
            style={{ minHeight: '120px' }}
          />
          <p className="text-[11px] text-gray-500 mt-1 italic">Un élément par ligne. Lignes vides ignorées.</p>
        </>
      ) : (
        <div
          onClick={() => setEditing(true)}
          className="cursor-text px-3 py-2.5 rounded-lg border-2 border-transparent hover:border-blue-200 hover:bg-blue-50/30 transition-colors min-h-[60px]"
        >
          {items.length === 0 ? (
            <span className="italic text-gray-400">{placeholder || 'Cliquez pour ajouter des éléments…'}</span>
          ) : (
            <ul className="space-y-1.5">
              {items.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-gray-800">
                  <span className="text-primary-600 font-bold mt-0.5">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {helperText && <p className="text-[11px] text-gray-500 mt-1 italic">{helperText}</p>}
    </section>
  )
}

/** Indicateur d'auto-save discret en bas à droite. */
function AutoSaveBadge({ status, lastSavedAt }: { status: 'idle' | 'saving' | 'saved' | 'error'; lastSavedAt: number | null }) {
  const [tick, setTick] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 1000)
    return () => clearInterval(id)
  }, [])

  const ago = useMemo(() => {
    if (!lastSavedAt) return ''
    const seconds = Math.floor((Date.now() - lastSavedAt) / 1000)
    if (seconds < 5) return 'à l\'instant'
    if (seconds < 60) return `il y a ${seconds}s`
    const min = Math.floor(seconds / 60)
    if (min < 60) return `il y a ${min} min`
    const h = Math.floor(min / 60)
    return `il y a ${h}h`
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastSavedAt, tick])

  if (status === 'idle' && !lastSavedAt) return null

  return (
    <div
      className={`fixed bottom-4 right-4 z-30 inline-flex items-center gap-2 px-3 py-2 rounded-lg shadow-md text-xs font-medium border ${
        status === 'saving' ? 'bg-blue-50 border-blue-200 text-blue-700' :
        status === 'error'  ? 'bg-red-50 border-red-200 text-red-700' :
                              'bg-white border-gray-200 text-gray-700'
      }`}
    >
      {status === 'saving' && (<><Loader2 size={12} className="animate-spin" /> Sauvegarde…</>)}
      {status === 'saved' && lastSavedAt && (<><Check size={12} className="text-emerald-600" /> Enregistré {ago}</>)}
      {status === 'error' && (<><AlertCircle size={12} /> Erreur de sauvegarde</>)}
    </div>
  )
}

/** Tableau des épreuves par domaine — read-only (les scores ne se modifient pas
 *  depuis la preview, c'est la phase d'extraction qui les a posés). Le
 *  commentaire de domaine reste éditable juste dessous. */
function DomainTable({ domain }: { domain: CRBODomain }) {
  return (
    <div className="overflow-x-auto -mx-4 px-4">
      <table className="w-full text-sm border-collapse">
        <thead className="text-xs uppercase tracking-wider text-gray-500 border-b border-gray-200">
          <tr>
            <th className="text-left py-2 pr-3">Épreuve</th>
            <th className="text-center py-2 px-2 w-20">Score</th>
            <th className="text-center py-2 px-2 w-16">É-T</th>
            <th className="text-center py-2 px-2 w-20">Centile</th>
            <th className="text-center py-2 pl-2 w-32">Interprétation</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {domain.epreuves.map((e, i) => {
            const color = getPercentileColor(e.percentile_value)
            const seuil = seuilFor(e.percentile_value)
            return (
              <tr key={i}>
                <td className="py-2 pr-3 text-gray-900">{e.nom}</td>
                <td className="py-2 px-2 text-center font-mono text-gray-700">{e.score}</td>
                <td className="py-2 px-2 text-center font-mono text-gray-600">{e.et ?? '—'}</td>
                <td className="py-2 px-2 text-center font-mono" style={{ backgroundColor: '#' + color + '60' }}>
                  {formatPercentileForDisplay(e.percentile, e.percentile_value)}
                </td>
                <td className="py-2 pl-2 text-center">
                  <span
                    className="inline-block px-2 py-0.5 rounded text-xs font-semibold"
                    style={{ backgroundColor: '#' + seuil.shading, color: seuil.textColor ? '#' + seuil.textColor : '#000' }}
                  >
                    {seuil.label}
                  </span>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

export default function CRBOPreviewPage() {
  const params = useParams()
  const router = useRouter()
  const id = String(params.id)
  const [crbo, setCrbo] = useState<CRBORow | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [structure, setStructure] = useState<CRBOStructure | null>(null)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null)
  const [downloadingWord, setDownloadingWord] = useState(false)

  /** Modale de régénération de section. `field_path` est le chemin éditable
   *  (ex. "diagnostic", "axes_therapeutiques") ; `section_name` est la clé
   *  reconnue par l'API (toujours identique au field_path racine ici). */
  const [regenModal, setRegenModal] = useState<null | {
    section_name: string
    section_label: string
    field_path: string
    current_text: string
    is_list: boolean
  }>(null)
  const [regenInstruction, setRegenInstruction] = useState('')
  const [regenLoading, setRegenLoading] = useState(false)
  const [regenError, setRegenError] = useState<string | null>(null)

  /** Modale de chaînage de bilan : proposée après le téléchargement Word/PDF. */
  const [chainShown, setChainShown] = useState(false)
  const [chainTriggered, setChainTriggered] = useState(false)

  // Charge le CRBO + le profil ortho au mount. Vocab perso / glossaire
  // appliqués à l'affichage uniquement (on n'écrit pas en DB).
  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }
      const [crboRes, profileRes] = await Promise.all([
        supabase.from('crbos').select('*').eq('id', id).eq('user_id', user.id).single(),
        supabase.from('profiles').select('*').eq('id', user.id).single(),
      ])
      if (crboRes.error || !crboRes.data) {
        setError('CRBO introuvable ou accès refusé.')
        setLoading(false)
        return
      }
      const row = crboRes.data as CRBORow
      setCrbo(row)
      const baseStructure: CRBOStructure | null = row.structure_json
        ? applyGlossaireToObject(applyVocabToObject(row.structure_json))
        : null
      setStructure(baseStructure)
      setProfile((profileRes.data as Profile) ?? null)

      // Statut kanban : à l'ouverture de la preview, on passe à "a_relire"
      // si on était encore en "a_rediger" (premier passage). Sans régression
      // pour un CRBO déjà "termine".
      if (row.statut === 'a_rediger') {
        const { error: statusErr } = await supabase
          .from('crbos')
          .update({ statut: 'a_relire' })
          .eq('id', id)
          .eq('user_id', user.id)
        if (!statusErr) setCrbo({ ...row, statut: 'a_relire' })
      }

      setLoading(false)
    }
    load()
  }, [id, router])

  // Garde-fou : avant unload, on tente d'écrire les éventuelles modifications
  // pending. Le navigateur n'accepte pas async ici — on déclenche un fetch
  // keepalive (best-effort).
  useEffect(() => {
    const onBeforeUnload = (_e: BeforeUnloadEvent) => {
      // Les SectionEditor flush leurs propres modifs au blur. Si un débounce
      // est encore en cours, on ne peut pas le forcer ici sans ajouter une
      // ref globale. Acceptable pour un MVP.
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [])

  /** Ouvre la modale de régénération pour une section donnée. */
  const openRegen = useCallback((
    section_name: string,
    section_label: string,
    field_path: string,
    current_text: string,
    is_list: boolean = false,
  ) => {
    setRegenModal({ section_name, section_label, field_path, current_text, is_list })
    setRegenInstruction('')
    setRegenError(null)
  }, [])

  /** Callback générique pour les enfants : applique un patch local +
   *  PATCH /api/crbo/[id]. Une seule en-vol à la fois (les enfants utilisent
   *  un debounce, le risque de course est très faible). */
  const handleSave = useCallback(async (fieldPath: string, value: any) => {
    if (!structure) return
    // Maj optimiste locale (instantanée pour l'utilisateur)
    setStructure(prev => {
      if (!prev) return prev
      const next = JSON.parse(JSON.stringify(prev))
      const parts = fieldPath.split('.')
      let cur: any = next
      for (let i = 0; i < parts.length - 1; i++) {
        const k = parts[i]
        if (!(k in cur) || cur[k] == null) cur[k] = /^\d+$/.test(parts[i + 1]) ? [] : {}
        cur = cur[k]
      }
      cur[parts[parts.length - 1]] = value
      return next
    })
    setSaveStatus('saving')
    try {
      const res = await fetch(`/api/crbo/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates: { [fieldPath]: value } }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        console.error('PATCH failed:', err)
        setSaveStatus('error')
        return
      }
      setSaveStatus('saved')
      setLastSavedAt(Date.now())
    } catch (e) {
      console.error('PATCH network error:', e)
      setSaveStatus('error')
    }
  }, [id, structure])

  /** Soumet la modale de régénération : POST /api/crbo/[id]/regenerate-section,
   *  applique le texte régénéré via handleSave (qui PATCH en DB), ferme la modale. */
  const confirmRegen = useCallback(async () => {
    if (!regenModal || !regenInstruction.trim() || regenLoading) return
    setRegenLoading(true)
    setRegenError(null)
    try {
      const res = await fetch(`/api/crbo/${id}/regenerate-section`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          section_name: regenModal.section_name,
          section_label: regenModal.section_label,
          current_text: regenModal.current_text,
          instruction: regenInstruction.trim(),
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setRegenError(data?.error || 'Erreur lors de la régénération.')
        return
      }
      const regenerated: string = String(data.regenerated ?? '').trim()
      if (!regenerated) {
        setRegenError('La régénération n\'a rien retourné.')
        return
      }
      // Pour les listes (axes_therapeutiques) : on convertit le texte (1 item
      // par ligne) en array. Sinon on enregistre tel quel.
      if (regenModal.is_list) {
        const items = regenerated
          .split('\n')
          .map(s => s.replace(/^[-•*\d.)\s]+/, '').trim())
          .filter(Boolean)
        await handleSave(regenModal.field_path, items)
      } else {
        await handleSave(regenModal.field_path, regenerated)
      }
      setRegenModal(null)
      setRegenInstruction('')
    } catch (e: any) {
      setRegenError(e?.message || 'Erreur réseau.')
    } finally {
      setRegenLoading(false)
    }
  }, [id, regenModal, regenInstruction, regenLoading, handleSave])

  const handleDownloadWord = async () => {
    if (!crbo || !structure || downloadingWord) return
    setDownloadingWord(true)
    try {
      const { downloadCRBOWord } = await import('@/lib/word-export')
      // Charge bilan précédent si renouvellement (pour graphique évolution)
      let previousStructure: CRBOStructure | null = null
      let previousBilanDate: string | undefined
      if (crbo.bilan_precedent_id) {
        const supabase = createClient()
        const { data: prev } = await supabase
          .from('crbos')
          .select('structure_json, bilan_date')
          .eq('id', crbo.bilan_precedent_id)
          .maybeSingle()
        if (prev?.structure_json) {
          previousStructure = prev.structure_json as CRBOStructure
          previousBilanDate = prev.bilan_date as string
        }
      }
      await downloadCRBOWord({
        formData: {
          ortho_nom: profile ? `${profile.prenom} ${profile.nom}` : '',
          ortho_adresse: profile?.adresse || '',
          ortho_cp: profile?.code_postal || '',
          ortho_ville: profile?.ville || '',
          ortho_tel: profile?.telephone || '',
          ortho_email: profile?.email || '',
          patient_prenom: crbo.patient_prenom,
          patient_nom: crbo.patient_nom,
          patient_ddn: crbo.patient_ddn || '',
          patient_classe: crbo.patient_classe || '',
          bilan_date: crbo.bilan_date,
          bilan_type: crbo.bilan_type,
          medecin_nom: crbo.medecin_nom || '',
          medecin_tel: crbo.medecin_tel || '',
          motif: crbo.motif || '',
          anamnese: crbo.anamnese || '',
          test_utilise: crbo.test_utilise
            ? crbo.test_utilise.split(',').map(t => t.trim())
            : [],
          resultats_manuels: crbo.resultats || '',
        },
        structure,
        previousStructure,
        previousBilanDate,
      })
      // Premier téléchargement Word/PDF de la session → propose le chaînage
      // d'un 2ᵉ bilan pour le même patient (cas typique : screening MoCA →
      // bilan langagier approfondi).
      if (!chainTriggered) {
        setChainTriggered(true)
        setChainShown(true)
      }
    } catch (e) {
      console.error('Word download failed:', e)
      setError('Erreur lors du téléchargement Word.')
    } finally {
      setDownloadingWord(false)
    }
  }

  const handlePrintPDF = () => {
    // Réutilise la vue d'impression existante /historique/[id]/print
    // qui auto-déclenche window.print(). 1 onglet → 2 clics (Imprimer →
    // Enregistrer en PDF). Robuste, pas de dép supplémentaire.
    window.open(`/dashboard/historique/${id}/print`, '_blank', 'noopener')
    if (!chainTriggered) {
      setChainTriggered(true)
      setChainShown(true)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="animate-spin h-8 w-8 text-primary-600" />
      </div>
    )
  }
  if (error || !crbo || !structure) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
          <AlertCircle size={20} />
          {error || 'CRBO indisponible.'}
        </div>
        <Link href="/dashboard" className="mt-4 inline-flex items-center gap-2 text-sm text-primary-600 hover:underline">
          <ArrowLeft size={14} /> Retour au tableau de bord
        </Link>
      </div>
    )
  }

  // Sections de la navigation latérale (mêmes ancres que les <section id="">
  // dans la colonne contenu).
  const navSections = [
    { id: 'sec-anamnese',  label: 'Anamnèse',  icon: <BookOpen size={14} /> },
    // Section "Motif" retirée de la nav et du rendu (demande Laurie 2026-05)
    ...structure.domains.map((d, i) => ({
      id: `sec-domain-${i}`,
      label: d.nom,
      icon: <BookOpen size={14} />,
    })),
    { id: 'sec-diagnostic',      label: 'Diagnostic',           icon: <Sparkles size={14} /> },
    // "Projet thérapeutique" retiré (demande Laurie 2026-05)
    { id: 'sec-axes',            label: 'Axes thérapeutiques',  icon: <ListChecks size={14} /> },
    { id: 'sec-pap',             label: 'Aménagements PAP',     icon: <ListChecks size={14} /> },
    { id: 'sec-conclusion',      label: 'Conclusion',           icon: <FileText size={14} /> },
  ]

  return (
    <div className="max-w-7xl mx-auto pb-16">
      {/* Toolbar sticky */}
      <div className="sticky top-0 z-20 bg-white/95 backdrop-blur border-b border-gray-200 px-4 py-3 mb-4 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft size={14} />
            Dashboard
          </Link>
          <div className="hidden sm:block h-5 w-px bg-gray-300" />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">
              {crbo.patient_prenom} {crbo.patient_nom}
            </p>
            <p className="text-xs text-gray-500 truncate">
              {crbo.test_utilise || 'CRBO'} · {crbo.bilan_date}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handlePrintPDF}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm font-medium transition"
          >
            <FileDown size={14} />
            PDF
          </button>
          <button
            onClick={handleDownloadWord}
            disabled={downloadingWord}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary-600 hover:bg-primary-700 disabled:bg-primary-300 text-white text-sm font-medium transition"
          >
            {downloadingWord ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
            Télécharger Word
          </button>
        </div>
      </div>

      <div className="px-4 grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
        {/* Colonne gauche : nav par sections */}
        <aside className="hidden lg:block">
          <div className="sticky top-24">
            <p className="text-xs uppercase tracking-wider text-gray-500 font-bold mb-2 px-2">
              Sections du CRBO
            </p>
            <nav className="space-y-0.5">
              {navSections.map(s => (
                <a
                  key={s.id}
                  href={`#${s.id}`}
                  className="flex items-center gap-2 px-2 py-1.5 rounded text-sm text-gray-700 hover:bg-gray-100 hover:text-primary-700 transition"
                >
                  {s.icon}
                  <span className="truncate">{s.label}</span>
                </a>
              ))}
            </nav>
            <div className="mt-4 px-2 text-[11px] text-gray-500 leading-relaxed">
              Cliquez sur une section pour l&apos;éditer. Vos modifications sont sauvegardées automatiquement.
            </div>
          </div>
        </aside>

        {/* Colonne droite : contenu CRBO éditable */}
        <main className="space-y-6 min-w-0">
          <div className="rounded-xl border border-primary-200 bg-primary-50/40 p-4 flex items-start gap-3">
            <Sparkles className="text-primary-600 shrink-0 mt-0.5" size={18} />
            <div className="text-sm">
              <p className="font-semibold text-primary-900">CRBO généré — relisez et éditez avant téléchargement</p>
              <p className="text-primary-700 text-xs mt-0.5 leading-relaxed">
                Chaque section est éditable au clic. Les modifications sont enregistrées automatiquement.
                Quand vous êtes satisfait·e, cliquez sur <strong>Télécharger Word</strong> pour récupérer le document final.
              </p>
            </div>
          </div>

          <SectionEditor
            id="sec-anamnese"
            title="Anamnèse"
            icon={<BookOpen size={16} />}
            fieldPath="anamnese_redigee"
            initialValue={structure.anamnese_redigee || ''}
            onSave={handleSave}
            onRegenerate={(cur) => openRegen('anamnese_redigee', 'Anamnèse', 'anamnese_redigee', cur)}
            placeholder="Cliquez pour ajouter l'anamnèse rédigée…"
          />

          {/* Section "Motif de consultation" supprimée du rendu CRBO
              (demande Laurie 2026-05). Le motif reste saisi dans le
              formulaire d'entrée et reste utile à l'IA pour l'anamnèse,
              mais n'apparaît plus en section dédiée dans le document final. */}

          {/* Bilan par domaine */}
          {structure.domains.length > 0 && (
            <div>
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-2">
                <BookOpen size={18} className="text-primary-600" />
                Bilan détaillé
              </h2>
              <div className="flex flex-wrap gap-2 text-xs mb-4">
                {SEUILS.map(s => (
                  <span
                    key={s.label}
                    className="inline-flex items-center gap-1.5 px-2 py-1 rounded border"
                    style={{
                      backgroundColor: '#' + s.shading,
                      borderColor: '#' + s.shading,
                      color: s.textColor ? '#' + s.textColor : undefined,
                    }}
                  >
                    <strong>{s.label}</strong> {s.range}
                  </span>
                ))}
              </div>
              <div className="space-y-5">
                {structure.domains.map((d, i) => (
                  <div key={i} id={`sec-domain-${i}`} className="scroll-mt-24 card-modern p-4">
                    <h3 className="font-bold text-primary-700 text-base mb-3">{d.nom}</h3>
                    <DomainTable domain={d} />
                    <div className="mt-3">
                      <SectionEditor
                        id={`sec-domain-${i}-comment`}
                        title="Commentaire clinique"
                        fieldPath={`domains.${i}.commentaire`}
                        initialValue={d.commentaire || ''}
                        onSave={handleSave}
                        placeholder="Commentaire clinique pour ce domaine (observations, hypothèses, croisements)…"
                        helperText="Texte affiché sous le tableau dans le Word."
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sections "Points forts" et "Difficultés identifiées" supprimées
              (refonte 2026-05). Désormais intégrées dans le \`diagnostic\` via
              une phrase synthétique "On notera parmi les points d'appui : …
              Les principaux axes de fragilité concernent …". */}

          <SectionEditor
            id="sec-diagnostic"
            title="Diagnostic / Hypothèse"
            icon={<Sparkles size={16} />}
            fieldPath="diagnostic"
            initialValue={structure.diagnostic || ''}
            onSave={handleSave}
            onRegenerate={(cur) => openRegen('diagnostic', 'Diagnostic', 'diagnostic', cur)}
            placeholder="Diagnostic orthophonique ou hypothèse de diagnostic…"
          />

          {/* Section "Projet thérapeutique" supprimée (demande Laurie 2026-05).
              Le champ recommandations reste en DB pour retro-compat mais
              n'est plus édité ni rendu dans le CRBO final. */}

          {structure.axes_therapeutiques !== undefined && (
            <ListEditor
              id="sec-axes"
              title="Axes thérapeutiques"
              icon={<ListChecks size={16} />}
              fieldPath="axes_therapeutiques"
              initialItems={structure.axes_therapeutiques || []}
              onSave={handleSave}
              onRegenerate={(cur) => openRegen('axes_therapeutiques', 'Axes thérapeutiques', 'axes_therapeutiques', cur, true)}
              placeholder="Un axe par ligne — max 4 axes…"
            />
          )}

          {structure.pap_suggestions !== undefined && (structure.pap_suggestions || []).filter(p => p?.trim()).length > 0 ? (
            <ListEditor
              id="sec-pap"
              title="Aménagements scolaires (PAP)"
              icon={<ListChecks size={16} />}
              fieldPath="pap_suggestions"
              initialItems={structure.pap_suggestions || []}
              onSave={handleSave}
              placeholder="Un aménagement par ligne — format 'Catégorie : description'…"
            />
          ) : null}

          <SectionEditor
            id="sec-conclusion"
            title="Conclusion"
            icon={<FileText size={16} />}
            fieldPath="conclusion"
            initialValue={structure.conclusion || ''}
            onSave={handleSave}
            onRegenerate={(cur) => openRegen('conclusion', 'Conclusion', 'conclusion', cur)}
            placeholder="Mention médico-légale de conclusion…"
          />

          {/* Pied de page : bouton télécharger en bas aussi pour ne pas
              obliger l'ortho à remonter au top après une longue relecture. */}
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5 flex items-center justify-between gap-3 flex-wrap">
            <div>
              <p className="text-sm font-semibold text-emerald-900">Prête à exporter ?</p>
              <p className="text-emerald-700 text-xs mt-0.5">
                Toutes vos modifications sont enregistrées automatiquement.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrintPDF}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-emerald-300 bg-white text-emerald-700 hover:bg-emerald-100 text-sm font-medium transition"
              >
                <FileDown size={14} />
                PDF
              </button>
              <button
                onClick={handleDownloadWord}
                disabled={downloadingWord}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary-600 hover:bg-primary-700 disabled:bg-primary-300 text-white text-sm font-medium transition"
              >
                {downloadingWord ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                Télécharger Word
              </button>
            </div>
          </div>
        </main>
      </div>

      <AutoSaveBadge status={saveStatus} lastSavedAt={lastSavedAt} />

      {/* Modale de régénération de section — instruction libre de l'ortho. */}
      {regenModal && (
        <div
          className="fixed inset-0 z-40 bg-black/50 flex items-center justify-center p-4"
          onClick={() => !regenLoading && setRegenModal(null)}
          role="dialog"
          aria-modal="true"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg bg-white rounded-xl shadow-xl"
          >
            <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <RefreshCw size={16} className="text-purple-600" />
                Régénérer « {regenModal.section_label} »
              </h3>
              <button
                onClick={() => !regenLoading && setRegenModal(null)}
                className="text-gray-400 hover:text-gray-700"
                aria-label="Fermer"
              >
                <X size={18} />
              </button>
            </div>
            <div className="px-5 py-4 space-y-3">
              <p className="text-sm text-gray-600">
                Décrivez ce que vous voulez modifier ou améliorer dans cette section. L&apos;IA réécrira
                uniquement « {regenModal.section_label} » selon votre instruction. Vous pourrez encore
                éditer le résultat manuellement après.
              </p>
              <textarea
                value={regenInstruction}
                onChange={(e) => setRegenInstruction(e.target.value)}
                rows={4}
                placeholder="Ex. Rends-le plus concis. / Ajoute une mention du suivi TDAH. / Reformule en insistant sur les compétences préservées."
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-purple-400 resize-y"
                disabled={regenLoading}
                autoFocus
              />
              {regenError && (
                <div className="text-sm bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg flex items-center gap-2">
                  <AlertCircle size={14} />
                  {regenError}
                </div>
              )}
            </div>
            <div className="px-5 py-3 bg-gray-50 border-t border-gray-200 flex items-center justify-end gap-2 rounded-b-xl">
              <button
                onClick={() => setRegenModal(null)}
                disabled={regenLoading}
                className="px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                onClick={confirmRegen}
                disabled={regenLoading || !regenInstruction.trim()}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 disabled:bg-purple-300 text-white text-sm font-medium transition"
              >
                {regenLoading ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                Régénérer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modale de chaînage : après le 1er téléchargement Word/PDF, proposer
          de démarrer un 2ᵉ bilan pour le même patient (cas typique screening
          MoCA → bilan langagier approfondi). */}
      {chainShown && crbo && (
        <div
          className="fixed inset-0 z-40 bg-black/50 flex items-center justify-center p-4"
          onClick={() => setChainShown(false)}
          role="dialog"
          aria-modal="true"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-white rounded-xl shadow-xl p-5"
          >
            <h3 className="text-base font-bold text-gray-900 mb-2">
              CRBO téléchargé
            </h3>
            <p className="text-sm text-gray-700 mb-4 leading-relaxed">
              Le bilan <strong>{crbo.test_utilise || 'actuel'}</strong> pour{' '}
              <strong>{crbo.patient_prenom} {crbo.patient_nom}</strong> est enregistré.
              Voulez-vous démarrer un 2ᵉ bilan pour ce patient (cas typique : screening → bilan approfondi) ?
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => {
                  setChainShown(false)
                  router.push('/dashboard')
                }}
                className="px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-gray-100"
              >
                Non, retour au tableau de bord
              </button>
              <button
                onClick={() => {
                  setChainShown(false)
                  // Recherche/auto-création patient gérée par /nouveau-crbo via ?patient=id
                  // si un patient_id est connu (rare ici car on quitte la preview avant).
                  router.push('/dashboard/nouveau-crbo')
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium"
              >
                Oui, nouveau bilan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
