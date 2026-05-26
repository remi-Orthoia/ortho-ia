'use client'

import { useEffect, useState } from 'react'
import { Upload, Loader2, X, FileText, ChevronDown, CalendarDays } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { useToast } from '@/components/Toast'
import type { BilanMathDraft, EpreuveState, GrilleBilan } from '@/lib/bilans/math/types'

/**
 * Bloc UI pour selectionner ou uploader le bilan precedent au mode
 * `renouvellement` (B-CM / B-CMado). Affiche 2 onglets :
 *  - "Depuis l'historique ortho.ia" : dropdown des CRBO math precedents du
 *    meme patient (matching par prenom+nom exact), tries par date DESC.
 *    Selection → hydrate draft.renouvellement avec bilanPrecedentId/Date/
 *    Anamnese/Epreuves/CrboGenere. Comparaison structuree possible.
 *  - "Uploader un PDF/Word externe" : extraction texte via /api/extract-
 *    previous-bilan-math. Pose le texte dans bilanPrecedentTexteExterne.
 *    Comparaison prose uniquement (pas de table de comparaison structuree).
 *
 * Champ libre "Notes d'evolution" toujours visible (textarea, optionnel)
 * pour que l'ortho ajoute son ressenti sur la trajectoire (PEC + observations).
 */

interface Props {
  grille: GrilleBilan
  draft: BilanMathDraft
  setDraft: (updater: (d: BilanMathDraft) => BilanMathDraft) => void
}

interface PrevCrboRow {
  id: string
  bilan_date: string
  bilan_subtype: string
  patient_prenom: string
  patient_nom: string
  patient_classe: string | null
  resultats: string | null
  anamnese: string | null
  crbo_genere: string | null
}

export default function RenouvellementBlock({ grille, draft, setDraft }: Props) {
  const toast = useToast()
  const [tab, setTab] = useState<'db' | 'upload'>('db')
  const [previousCrbos, setPreviousCrbos] = useState<PrevCrboRow[]>([])
  const [loadingList, setLoadingList] = useState(false)
  const [uploadingFile, setUploadingFile] = useState(false)

  const ren = draft.renouvellement ?? {}
  const hasDbSelection = !!ren.bilanPrecedentId
  const hasUploadedFile = !!ren.bilanPrecedentTexteExterne

  // ===== Charge la liste des CRBO math precedents du meme patient =====
  useEffect(() => {
    let cancelled = false
    const load = async () => {
      const prenom = (draft.patient.prenom || '').trim()
      const nom = (draft.patient.nom || '').trim()
      if (!prenom || !nom) {
        setPreviousCrbos([])
        return
      }
      setLoadingList(true)
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return
        // Match patient par prenom + nom exact (case-insensitive). On filtre
        // sur les bilans math UNIQUEMENT (b-cm ou b-cmado), de l'ortho courante.
        // Exclut le bilan en cours si deja en DB (cas edition d'un draft).
        const { data, error } = await supabase
          .from('crbos')
          .select('id, bilan_date, bilan_subtype, patient_prenom, patient_nom, patient_classe, resultats, anamnese, crbo_genere')
          .eq('user_id', user.id)
          .in('bilan_subtype', ['b-cm', 'b-cmado'])
          .ilike('patient_prenom', prenom)
          .ilike('patient_nom', nom)
          .order('bilan_date', { ascending: false })
        if (cancelled) return
        if (error) {
          console.warn('Load previous math CRBOs failed:', error)
          setPreviousCrbos([])
          return
        }
        setPreviousCrbos((data ?? []) as PrevCrboRow[])
      } catch (e) {
        console.warn('Load previous math CRBOs exception:', e)
      } finally {
        if (!cancelled) setLoadingList(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [draft.patient.prenom, draft.patient.nom])

  // ===== Selection d'un bilan precedent dans le dropdown =====
  const handleSelect = (crboId: string) => {
    const row = previousCrbos.find((c) => c.id === crboId)
    if (!row) {
      // Deselection → vide la partie DB du renouvellement (garde notes)
      setDraft((d) => ({
        ...d,
        renouvellement: {
          ...(d.renouvellement ?? {}),
          bilanPrecedentId: undefined,
          bilanPrecedentDate: undefined,
          bilanPrecedentAnamnese: undefined,
          bilanPrecedentEpreuves: undefined,
          bilanPrecedentCrboGenere: undefined,
        },
        updatedAt: Date.now(),
      }))
      return
    }
    // Parse les resultats JSON pour recuperer les epreuves cotees.
    let epreuves: Record<string, EpreuveState> | undefined
    try {
      if (row.resultats) {
        const parsed = JSON.parse(row.resultats)
        if (parsed && typeof parsed === 'object' && parsed.epreuves) {
          epreuves = parsed.epreuves as Record<string, EpreuveState>
        }
      }
    } catch {
      // resultats illisible : on hydrate sans epreuves (comparaison prose only)
    }
    setDraft((d) => ({
      ...d,
      renouvellement: {
        ...(d.renouvellement ?? {}),
        bilanPrecedentId: row.id,
        bilanPrecedentDate: row.bilan_date,
        bilanPrecedentAnamnese: row.anamnese ?? '',
        bilanPrecedentEpreuves: epreuves,
        bilanPrecedentCrboGenere: row.crbo_genere ?? '',
        // Clear upload si on switche vers DB
        bilanPrecedentTexteExterne: undefined,
        bilanPrecedentFilename: undefined,
      },
      updatedAt: Date.now(),
    }))
    toast.success(`Bilan du ${formatDateFR(row.bilan_date)} chargé pour comparaison.`)
  }

  // ===== Upload PDF/Word externe =====
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingFile(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/extract-previous-bilan-math', {
        method: 'POST',
        body: fd,
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data?.error || 'Erreur lors de l\'extraction.')
        return
      }
      if (!data.text) {
        toast.error('Aucun texte extrait du fichier.')
        return
      }
      setDraft((d) => ({
        ...d,
        renouvellement: {
          ...(d.renouvellement ?? {}),
          bilanPrecedentTexteExterne: data.text,
          bilanPrecedentFilename: file.name,
          // Clear DB si on switche vers upload
          bilanPrecedentId: undefined,
          bilanPrecedentDate: undefined,
          bilanPrecedentAnamnese: undefined,
          bilanPrecedentEpreuves: undefined,
          bilanPrecedentCrboGenere: undefined,
        },
        updatedAt: Date.now(),
      }))
      toast.success(`Bilan ${file.name} importé (${data.charCount} caractères).`)
    } catch (err: any) {
      toast.error(err?.message || 'Erreur réseau lors de l\'extraction.')
    } finally {
      setUploadingFile(false)
      // Reset l'input pour permettre de re-uploader le meme fichier
      e.target.value = ''
    }
  }

  return (
    <section
      style={{
        marginBottom: 20,
        padding: 16,
        background: '#FEF3C7', // amber-100, distingue visuellement le mode renouvellement
        border: '1px solid #FCD34D', // amber-300
        borderRadius: 12,
      }}
    >
      <h2 style={{ margin: '0 0 4px', fontSize: 14, fontWeight: 700, color: '#78350F' }}>
        🔄 Bilan précédent (mode renouvellement)
      </h2>
      <p style={{ margin: '0 0 12px', fontSize: 12, color: '#92400E', lineHeight: 1.5 }}>
        Sélectionne le bilan initial du même patient pour générer un CRBO comparatif avec analyse d'évolution par épreuve.
      </p>

      {/* Tabs : depuis historique / upload */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 12 }}>
        {(['db', 'upload'] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            style={{
              padding: '6px 12px',
              borderRadius: 8,
              border: tab === t ? '1px solid #B45309' : '1px solid transparent',
              background: tab === t ? '#FFFBEB' : 'transparent',
              color: tab === t ? '#78350F' : '#92400E',
              fontSize: 12.5,
              fontWeight: tab === t ? 600 : 500,
              cursor: 'pointer',
            }}
          >
            {t === 'db' ? '📁 Depuis l\'historique ortho.ia' : '⬆️ Uploader un PDF/Word externe'}
          </button>
        ))}
      </div>

      {/* Onglet DB */}
      {tab === 'db' && (
        <div>
          {loadingList ? (
            <div style={{ fontSize: 12, color: '#92400E', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Loader2 size={12} className="animate-spin" /> Chargement…
            </div>
          ) : previousCrbos.length === 0 ? (
            <p style={{ fontSize: 12, color: '#92400E', fontStyle: 'italic' }}>
              {(draft.patient.prenom || '').trim() && (draft.patient.nom || '').trim()
                ? `Aucun bilan math précédent trouvé pour ${draft.patient.prenom} ${draft.patient.nom}. Tu peux utiliser l'onglet "Uploader" pour importer un bilan externe.`
                : 'Renseigne le prénom et le nom du patient pour voir les bilans précédents disponibles.'}
            </p>
          ) : (
            <>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#78350F', marginBottom: 4 }}>
                Sélectionner le bilan précédent
              </label>
              <select
                value={ren.bilanPrecedentId ?? ''}
                onChange={(e) => handleSelect(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: 8,
                  border: '1px solid #FCD34D',
                  background: '#FFFBEB',
                  color: '#78350F',
                  fontSize: 13,
                  fontFamily: 'inherit',
                }}
              >
                <option value="">— choisir un bilan précédent —</option>
                {previousCrbos.map((c) => {
                  const sub = c.bilan_subtype === 'b-cm' ? 'B-CM' : c.bilan_subtype === 'b-cmado' ? 'B-CMado' : c.bilan_subtype
                  const classe = c.patient_classe ? ` · ${c.patient_classe}` : ''
                  return (
                    <option key={c.id} value={c.id}>
                      {formatDateFR(c.bilan_date)} — {sub}{classe}
                    </option>
                  )
                })}
              </select>
              {hasDbSelection && ren.bilanPrecedentDate && (
                <p style={{ marginTop: 8, fontSize: 12, color: '#15803d', display: 'flex', alignItems: 'center', gap: 4 }}>
                  ✓ Bilan du {formatDateFR(ren.bilanPrecedentDate)} chargé. Comparaison structurée activée.
                </p>
              )}
            </>
          )}
        </div>
      )}

      {/* Onglet Upload */}
      {tab === 'upload' && (
        <div>
          {!hasUploadedFile ? (
            <>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#78350F', marginBottom: 6 }}>
                Importer un bilan précédent (PDF ou Word, max 10 Mo)
              </label>
              <label
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '8px 14px',
                  background: '#FFFBEB',
                  border: '1px dashed #FCD34D',
                  borderRadius: 8,
                  color: '#78350F',
                  fontSize: 12.5,
                  fontWeight: 500,
                  cursor: uploadingFile ? 'wait' : 'pointer',
                  opacity: uploadingFile ? 0.7 : 1,
                }}
              >
                {uploadingFile ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                {uploadingFile ? 'Extraction en cours…' : 'Choisir un fichier'}
                <input
                  type="file"
                  accept=".pdf,.docx,.doc,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  onChange={handleFileChange}
                  disabled={uploadingFile}
                  style={{ display: 'none' }}
                />
              </label>
              <p style={{ marginTop: 8, fontSize: 11, color: '#92400E', fontStyle: 'italic' }}>
                Le texte du bilan sera extrait et transmis comme contexte à l'IA pour formuler les évolutions.
                Pas de comparaison structurée des grilles (le bilan externe n'a pas le format ortho.ia), uniquement une analyse en prose.
              </p>
            </>
          ) : (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
              <FileText size={16} className="text-green-700" style={{ marginTop: 2, flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#15803d' }}>
                  ✓ {ren.bilanPrecedentFilename || 'Fichier importé'}
                </p>
                <p style={{ margin: '2px 0 0', fontSize: 11.5, color: '#92400E' }}>
                  {ren.bilanPrecedentTexteExterne?.length ?? 0} caractères extraits — transmis comme contexte à l'IA.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDraft((d) => ({
                  ...d,
                  renouvellement: {
                    ...(d.renouvellement ?? {}),
                    bilanPrecedentTexteExterne: undefined,
                    bilanPrecedentFilename: undefined,
                  },
                  updatedAt: Date.now(),
                }))}
                style={{
                  padding: 4,
                  background: 'transparent',
                  border: 0,
                  color: '#B45309',
                  cursor: 'pointer',
                }}
                aria-label="Retirer le fichier"
                title="Retirer le fichier"
              >
                <X size={14} />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Notes d'evolution (toujours visible) */}
      <div style={{ marginTop: 16, paddingTop: 12, borderTop: '1px solid #FCD34D' }}>
        <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#78350F', marginBottom: 4 }}>
          Notes d'évolution depuis le bilan précédent (optionnel, ~2-4 phrases)
        </label>
        <textarea
          value={ren.evolutionNotes ?? ''}
          onChange={(e) =>
            setDraft((d) => ({
              ...d,
              renouvellement: {
                ...(d.renouvellement ?? {}),
                evolutionNotes: e.target.value,
              },
              updatedAt: Date.now(),
            }))
          }
          placeholder="Ex. Lison a bénéficié de 18 mois de rééducation à raison d'une séance hebdomadaire, axée sur la consolidation du sens du nombre et la mémorisation des faits arithmétiques. La famille rapporte une amélioration de l'attitude face aux mathématiques en classe."
          rows={3}
          style={{
            width: '100%',
            padding: '8px 12px',
            borderRadius: 8,
            border: '1px solid #FCD34D',
            background: '#FFFBEB',
            color: '#1F2937',
            fontSize: 13,
            fontFamily: 'inherit',
            lineHeight: 1.5,
            resize: 'vertical',
          }}
        />
      </div>
    </section>
  )
}

function formatDateFR(iso: string): string {
  try {
    const d = new Date(iso)
    if (isNaN(d.getTime())) return iso
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
  } catch {
    return iso
  }
}
