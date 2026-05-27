'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import {
  ArrowLeft,
  Download,
  FileDown,
  Loader2,
  Calendar,
  User,
  FileText,
  Edit,
  Trash2,
  CheckCircle,
  Clock,
  Eye,
  Sparkles,
  Target,
  RotateCw,
} from 'lucide-react'
import type { SmartObjectivesPayload } from '@/app/api/generate-smart-objectives/route'
import CRBOStructuredPreview from '@/components/CRBOStructuredPreview'
import BilanMathSummary from '@/components/bilans/math/BilanMathSummary'
import BilanMathCRBORender from '@/components/bilans/math/BilanMathCRBORender'
import { GRILLE_B_CM } from '@/lib/bilans/math/grille-b-cm'
import { GRILLE_B_CMADO } from '@/lib/bilans/math/grille-b-cmado'
import type { BilanMathDraft, GrilleBilan } from '@/lib/bilans/math/types'
import { useToast } from '@/components/Toast'
import { playPrintAnimation } from '@/components/PrintAnimation'
import { applyVocabToObject } from '@/lib/vocab-perso'
import { applyGlossaireToObject } from '@/lib/glossaire'

interface CRBO {
  id: string
  patient_prenom: string
  patient_nom: string
  patient_classe: string
  patient_ddn: string
  test_utilise: string
  bilan_date: string
  bilan_type: string
  /** Sous-type pour distinguer bilans langage (NULL) des bilans math B-CM/B-CMado. */
  bilan_subtype?: 'b-cm' | 'b-cmado' | null
  crbo_text?: string | null
  crbo_genere?: string | null
  statut: string
  created_at: string
  // Tous les champs restants sont optionnels — certains CRBOs antérieurs à
  // l'extension de schéma peuvent ne pas les avoir.
  medecin_nom?: string | null
  medecin_tel?: string | null
  medecin_date_prescription?: string | null
  motif?: string | null
  anamnese?: string | null
  resultats?: string | null
  notes_analyse?: string | null
  structure_json?: any
  severite_globale?: 'Léger' | 'Modéré' | 'Sévère' | null
  bilan_precedent_id?: string | null
  comportement_seance?: string | null
  duree_seance_minutes?: number | null
  smart_objectives?: SmartObjectivesPayload | null
  smart_objectives_generated_at?: string | null
}

const statusConfig = {
  a_rediger: { label: 'À rédiger', color: 'bg-blue-100 text-blue-700', icon: FileText },
  // 'en_cours' (legacy) remappé en a_rediger pour les CRBO antérieurs à la fusion
  // des colonnes kanban — la clé reste pour compat lookup, mêmes styles que a_rediger.
  en_cours: { label: 'À rédiger', color: 'bg-blue-100 text-blue-700', icon: FileText },
  a_relire: { label: 'À relire', color: 'bg-purple-100 text-purple-700', icon: Eye },
  termine: { label: 'Terminé', color: 'bg-green-100 text-green-700', icon: CheckCircle },
}

export default function CRBODetailPage() {
  const params = useParams()
  const router = useRouter()
  const toast = useToast()
  const [crbo, setCrbo] = useState<CRBO | null>(null)
  // Bilan précédent (renouvellement) : chargé à part pour permettre le rendu
  // du tableau comparatif dans CRBOStructuredPreview SANS attendre le download.
  const [previousStructure, setPreviousStructure] = useState<any | null>(null)
  const [previousBilanDate, setPreviousBilanDate] = useState<string | null>(null)
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showPreviewModal, setShowPreviewModal] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [generatingSmart, setGeneratingSmart] = useState(false)
  const [regeneratingSmart, setRegeneratingSmart] = useState(false)

  useEffect(() => {
    const fetchCRBO = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/auth/login')
        return
      }

      const [crboRes, profileRes] = await Promise.all([
        supabase
          .from('crbos')
          .select('*')
          .eq('id', params.id)
          .eq('user_id', user.id) // RLS check
          .single(),
        supabase.from('profiles').select('*').eq('id', user.id).single(),
      ])

      if (crboRes.error || !crboRes.data) {
        setError('CRBO non trouvé')
      } else {
        setCrbo(crboRes.data)
        // Charge le bilan précédent (renouvellement) en parallèle pour pouvoir
        // rendre le tableau comparatif dans la preview React. Best-effort : si
        // la ligne précédente n'existe plus ou n'a pas de structure_json, on
        // tombe simplement sur null et le tableau ne s'affiche pas.
        if (crboRes.data.bilan_precedent_id) {
          const { data: prev } = await supabase
            .from('crbos')
            .select('structure_json, bilan_date')
            .eq('id', crboRes.data.bilan_precedent_id)
            .maybeSingle()
          if (prev?.structure_json) setPreviousStructure(prev.structure_json)
          if (prev?.bilan_date) setPreviousBilanDate(prev.bilan_date)
        }
      }
      if (profileRes.data) setProfile(profileRes.data)

      setLoading(false)
    }

    fetchCRBO()
  }, [params.id, router])

  const handleDownload = async () => {
    if (!crbo || downloading) return
    setDownloading(true)
    // Overlay 3D flip pour la génération + download (1500ms garantis).
    playPrintAnimation(1500)
    try {
      // ============ BRANCHE MATH (B-CM / B-CMado) ============
      // Detection via bilan_subtype : route vers le renderer math dedie
      // (grille coloriee + markdown structure) plutot que le renderer langage
      // qui produit un Word degrade pour ce sous-type. Fix 2026-05-26.
      const isMath = crbo.bilan_subtype === 'b-cm' || crbo.bilan_subtype === 'b-cmado'
      if (isMath) {
        const { GRILLE_B_CM } = await import('@/lib/bilans/math/grille-b-cm')
        const { GRILLE_B_CMADO } = await import('@/lib/bilans/math/grille-b-cmado')
        const { generateBilanMathWord } = await import('@/lib/bilan-math-word-export')
        const grille = crbo.bilan_subtype === 'b-cm' ? GRILLE_B_CM : GRILLE_B_CMADO

        // Reconstruit le draft a partir des colonnes DB + JSON resultats.
        let epreuves: Record<string, any> = {}
        let mode: 'initial' | 'renouvellement' = crbo.bilan_type === 'renouvellement' ? 'renouvellement' : 'initial'
        let renouvellementMeta: any = null
        try {
          if (crbo.resultats) {
            const parsed = JSON.parse(crbo.resultats)
            if (parsed && typeof parsed === 'object') {
              if (parsed.epreuves) epreuves = parsed.epreuves
              if (parsed.mode === 'initial' || parsed.mode === 'renouvellement') mode = parsed.mode
              if (parsed.renouvellement) renouvellementMeta = parsed.renouvellement
            }
          }
        } catch {
          // resultats illisible : on rend quand meme avec un draft minimal.
        }

        // Mode renouvellement : si bilan_precedent_id pointe vers un CRBO
        // math en DB, on JOIN pour recuperer ses epreuves + crbo_genere,
        // ce qui permet d'afficher le tableau d'evolution dans le Word.
        let renouvellementForDraft: any = undefined
        if (mode === 'renouvellement') {
          renouvellementForDraft = { ...(renouvellementMeta ?? {}) }
          if (crbo.bilan_precedent_id) {
            try {
              const supabase = createClient()
              const { data: prev } = await supabase
                .from('crbos')
                .select('id, bilan_date, anamnese, resultats, crbo_genere')
                .eq('id', crbo.bilan_precedent_id)
                .maybeSingle()
              if (prev) {
                renouvellementForDraft.bilanPrecedentId = prev.id
                renouvellementForDraft.bilanPrecedentDate = prev.bilan_date
                renouvellementForDraft.bilanPrecedentAnamnese = prev.anamnese || ''
                renouvellementForDraft.bilanPrecedentCrboGenere = prev.crbo_genere || ''
                try {
                  if (prev.resultats) {
                    const prevParsed = JSON.parse(prev.resultats)
                    if (prevParsed?.epreuves) {
                      renouvellementForDraft.bilanPrecedentEpreuves = prevParsed.epreuves
                    }
                  }
                } catch {}
              }
            } catch (e) {
              console.warn('JOIN bilan precedent failed:', e)
            }
          }
        }

        const blob = await generateBilanMathWord({
          grille,
          draft: {
            type: grille.id,
            mode,
            patient: {
              prenom: crbo.patient_prenom || '',
              nom: crbo.patient_nom || '',
              date_naissance: crbo.patient_ddn || '',
              classe: crbo.patient_classe || '',
            },
            anamnese: crbo.anamnese || '',
            motif: crbo.motif || '',
            bilanDate: crbo.bilan_date,
            medecin: crbo.medecin_nom
              ? {
                  nom: crbo.medecin_nom,
                  tel: crbo.medecin_tel || '',
                  date_prescription: crbo.medecin_date_prescription || '',
                }
              : undefined,
            comportementSeance: crbo.comportement_seance || '',
            dureeSeanceMinutes: crbo.duree_seance_minutes ?? undefined,
            renouvellement: renouvellementForDraft,
            epreuves,
            updatedAt: Date.now(),
          },
          crboText: crbo.crbo_genere || crbo.crbo_text || '',
          profile: profile
            ? {
                prenom: profile.prenom,
                nom: profile.nom,
                adresse: profile.adresse,
                code_postal: profile.code_postal,
                ville: profile.ville,
                telephone: profile.telephone,
                email: profile.email,
                adeli_rpps: profile.adeli_rpps ?? null,
              }
            : null,
          bilanDate: crbo.bilan_date,
        })

        const filename = `CRBO-${grille.label}-${crbo.patient_prenom || 'patient'}-${crbo.patient_nom || ''}-${new Date().toISOString().slice(0, 10)}.docx`
          .replace(/[^a-zA-Z0-9.-]/g, '_')
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = filename
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      } else {
        // ============ BRANCHE LANGAGE (par defaut) ============
        const { downloadCRBOWord } = await import('@/lib/word-export')

        // Charger bilan précédent si présent (renouvellement)
        let previousStructure = null
        let previousBilanDate: string | undefined
        if (crbo.bilan_precedent_id) {
          const supabase = createClient()
          const { data: prev } = await supabase
            .from('crbos')
            .select('structure_json, bilan_date')
            .eq('id', crbo.bilan_precedent_id)
            .maybeSingle()
          if (prev) {
            previousStructure = prev.structure_json
            previousBilanDate = prev.bilan_date
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
            ortho_adeli_rpps: profile?.adeli_rpps || '',
            patient_prenom: crbo.patient_prenom,
            patient_nom: crbo.patient_nom,
            patient_ddn: crbo.patient_ddn,
            patient_classe: crbo.patient_classe,
            bilan_date: crbo.bilan_date,
            bilan_type: crbo.bilan_type,
            medecin_nom: crbo.medecin_nom ?? '',
            medecin_tel: crbo.medecin_tel ?? '',
            medecin_date_prescription: crbo.medecin_date_prescription ?? '',
            motif: crbo.motif ?? '',
            test_utilise: crbo.test_utilise
              ? String(crbo.test_utilise).split(',').map((t: string) => t.trim())
              : [],
            resultats_manuels: crbo.resultats ?? '',
          },
          structure: crbo.structure_json
            ? applyGlossaireToObject(applyVocabToObject(crbo.structure_json))
            : null,
          fallbackCRBO: crbo.crbo_text || crbo.crbo_genere || '',
          previousStructure,
          previousBilanDate,
        })
      }

      // Promotion kanban : a_rediger → a_relire après download Word.
      // On ne régresse jamais un statut déjà avancé (a_relire ou termine).
      if (crbo.statut === 'a_rediger' || crbo.statut === 'en_cours') {
        const supabase = createClient()
        const { error: statusErr } = await supabase
          .from('crbos')
          .update({ statut: 'a_relire' })
          .eq('id', crbo.id)
        if (statusErr) {
          console.warn('Promotion statut a_relire échouée (best-effort):', statusErr)
        } else {
          setCrbo({ ...crbo, statut: 'a_relire' })
        }
      }
    } catch (err) {
      console.error('Erreur export Word:', err)
      toast.error('Erreur lors de la génération du document Word.')
    } finally {
      setDownloading(false)
    }
  }

  const handleGenerateSmart = async (force = false) => {
    if (!crbo) return
    if (force ? regeneratingSmart : generatingSmart) return
    const setLoading = force ? setRegeneratingSmart : setGeneratingSmart
    setLoading(true)
    try {
      const res = await fetch('/api/generate-smart-objectives', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ crbo_id: crbo.id, force }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        toast.error(err?.error || 'Génération impossible.')
        return
      }
      const { smart, cached, generated_at } = await res.json()

      const { downloadSmartObjectivesWord } = await import('@/lib/word/smart-objectives-generator')
      await downloadSmartObjectivesWord({
        patient_prenom: crbo.patient_prenom,
        patient_nom: crbo.patient_nom,
        bilan_date: crbo.bilan_date,
        smart,
      })

      try {
        sessionStorage.setItem(
          `ortho-ia:smart-objectives-print:${crbo.id}`,
          JSON.stringify({
            patient_prenom: crbo.patient_prenom,
            patient_nom: crbo.patient_nom,
            bilan_date: crbo.bilan_date,
            smart,
          }),
        )
        window.open(`/dashboard/historique/${crbo.id}/smart-objectives/print`, '_blank', 'noopener')
      } catch (e) {
        console.warn('Ouverture aperçu PDF impossible:', e)
      }

      // Mise a jour locale pour refleter le cache fraichement ecrit / la regeneration
      // sans avoir a re-fetch le CRBO complet depuis Supabase.
      setCrbo({
        ...crbo,
        smart_objectives: smart,
        smart_objectives_generated_at: generated_at ?? crbo.smart_objectives_generated_at ?? null,
      })

      if (cached) {
        toast.success('Fiche rouverte depuis votre dernière génération.')
      } else if (force) {
        toast.success('Fiche objectifs SMART régénérée.')
      } else {
        toast.success('Fiche objectifs SMART générée.')
      }
    } catch (e) {
      console.error('Erreur SMART:', e)
      toast.error('Erreur lors de la génération de la fiche.')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!crbo || deleting || !confirm('Supprimer ce CRBO ? Cette action est irréversible.')) return

    setDeleting(true)
    const supabase = createClient()
    // user_id explicite + .select() pour confirmer la suppression effective.
    // Sinon une session expirée nous redirigeait vers /historique alors que
    // le CRBO existait toujours en base — ortho cherche la cause.
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setDeleting(false)
      toast.error('Session expirée — reconnectez-vous.')
      return
    }
    const { data: deleted, error } = await supabase
      .from('crbos')
      .delete()
      .eq('id', crbo.id)
      .eq('user_id', user.id)
      .select('id')
    setDeleting(false)
    if (error || !deleted || deleted.length === 0) {
      console.error('Erreur suppression CRBO:', error)
      toast.error("La suppression n'a pas pu être enregistrée. Réessayez.")
      return
    }
    toast.success('CRBO supprimé.')
    router.push('/dashboard/historique')
  }

  const handleStatusChange = async (newStatus: string) => {
    if (!crbo) return

    const supabase = createClient()
    await supabase
      .from('crbos')
      .update({ statut: newStatus })
      .eq('id', crbo.id)

    setCrbo({ ...crbo, statut: newStatus })
  }

  const calculateAge = (ddn: string, bilanDate: string) => {
    if (!ddn) return ''
    const birth = new Date(ddn)
    const bilan = new Date(bilanDate)
    let years = bilan.getFullYear() - birth.getFullYear()
    let months = bilan.getMonth() - birth.getMonth()
    if (months < 0) {
      years--
      months += 12
    }
    return `${years} ans et ${months} mois`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="animate-spin h-8 w-8 text-green-600" />
      </div>
    )
  }

  if (error || !crbo) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 mb-4">{error || 'CRBO non trouvé'}</p>
        <Link href="/dashboard/historique" className="text-green-600 hover:underline">
          ← Retour à l'historique
        </Link>
      </div>
    )
  }

  const status = statusConfig[crbo.statut as keyof typeof statusConfig] || statusConfig.termine
  const StatusIcon = status.icon

  // La fiche d'objectifs SMART s'appuie sur des scores percentile-based.
  // Le MoCA est un screening cognitif /30 — pas pertinent pour des objectifs
  // de rééducation orthophonique structurés en SMART. On masque le bouton
  // quand c'est le seul test du bilan.
  const testList = (crbo.test_utilise || '')
    .split(',')
    .map((t: string) => t.trim())
    .filter(Boolean)
  const isMocaOnly = testList.length === 1 && testList[0] === 'MoCA'
  const hasStructure =
    !!crbo.structure_json &&
    Array.isArray((crbo.structure_json as any)?.domains) &&
    (crbo.structure_json as any).domains.length > 0
  // Bilans math (B-CM / B-CMado) : pas de structure_json mais ils ont leur
  // propre branche dans /api/generate-smart-objectives (cotations couleur +
  // crbo_genere comme input). On les considère donc "eligibles SMART".
  const isMathBilan = crbo.bilan_subtype === 'b-cm' || crbo.bilan_subtype === 'b-cmado'

  // Parsing de l'etat de la grille math depuis crbo.resultats (JSON serialise
  // par BilanMathForm.handleSaveCRBO). Permet de rendre la grille coloree
  // (BilanMathSummary) en tete du CRBO pour relecture rapide.
  let mathState: BilanMathDraft['epreuves'] | null = null
  let mathGrille: GrilleBilan | null = null
  if (isMathBilan && crbo.resultats) {
    try {
      const parsed = JSON.parse(crbo.resultats)
      if (parsed && typeof parsed === 'object' && parsed.epreuves) {
        mathState = parsed.epreuves
        mathGrille = crbo.bilan_subtype === 'b-cm' ? GRILLE_B_CM : GRILLE_B_CMADO
      }
    } catch {
      // resultats illisible : on continue sans la grille, le texte du CRBO
      // est toujours affiche dans le fallback ci-dessous.
    }
  }
  const canGenerateSmart = !isMocaOnly && (hasStructure || isMathBilan)
  const hasCachedSmart = !!crbo.smart_objectives
  const smartGeneratedAt = crbo.smart_objectives_generated_at
    ? new Date(crbo.smart_objectives_generated_at).toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link 
            href="/dashboard/historique"
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {crbo.patient_prenom} {crbo.patient_nom}
            </h1>
            <p className="text-gray-500">
              {calculateAge(crbo.patient_ddn, crbo.bilan_date)} • {crbo.patient_classe}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-60 disabled:cursor-wait"
          >
            {downloading
              ? <><Loader2 size={18} className="animate-spin" />Génération…</>
              : <><Download size={18} />Word</>}
          </button>
          <a
            href={`/dashboard/historique/${crbo?.id}/print`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
            title="Exporter au format PDF via l'aperçu d'impression"
          >
            <FileDown size={18} />
            PDF
          </a>
          {canGenerateSmart && (
            <div className="inline-flex items-center">
              <button
                onClick={() => handleGenerateSmart(false)}
                disabled={generatingSmart || regeneratingSmart}
                className={`inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 border border-emerald-200 text-emerald-800 hover:bg-emerald-100 transition disabled:opacity-60 disabled:cursor-wait ${
                  hasCachedSmart ? 'rounded-l-lg border-r-0' : 'rounded-lg'
                }`}
                title={
                  hasCachedSmart
                    ? `Réouvrir la fiche${smartGeneratedAt ? ` (générée le ${smartGeneratedAt})` : ''}`
                    : "Génère une fiche d'objectifs thérapeutiques SMART (Word + PDF)"
                }
              >
                {generatingSmart ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    {hasCachedSmart ? 'Ouverture…' : 'Génération…'}
                  </>
                ) : (
                  <>
                    <Target size={18} />
                    Objectifs SMART
                  </>
                )}
              </button>
              {hasCachedSmart && (
                <button
                  onClick={() => handleGenerateSmart(true)}
                  disabled={generatingSmart || regeneratingSmart}
                  className="inline-flex items-center gap-2 px-3 py-2 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-r-lg hover:bg-emerald-100 transition disabled:opacity-60 disabled:cursor-wait"
                  title="Régénérer la fiche — nouvel appel à l'IA, écrase la version précédente"
                  aria-label="Régénérer la fiche"
                >
                  {regeneratingSmart ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <RotateCw size={16} />
                  )}
                </button>
              )}
            </div>
          )}
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition disabled:opacity-50 disabled:cursor-wait"
            title="Supprimer"
          >
            {deleting ? <Loader2 size={20} className="animate-spin" /> : <Trash2 size={20} />}
          </button>
        </div>
      </div>

      {/* Info cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
            <Calendar size={16} />
            Date du bilan
          </div>
          <p className="font-semibold">{new Date(crbo.bilan_date).toLocaleDateString('fr-FR')}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
            <FileText size={16} />
            Type
          </div>
          <p className="font-semibold capitalize">{crbo.bilan_type}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
            <User size={16} />
            Test
          </div>
          <p className="font-semibold text-sm">{crbo.test_utilise || 'Non spécifié'}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
            <StatusIcon size={16} />
            Statut
          </div>
          <select
            value={crbo.statut}
            onChange={(e) => handleStatusChange(e.target.value)}
            className={`px-2 py-1 rounded-full text-sm font-medium ${status.color} border-0 cursor-pointer`}
          >
            <option value="a_rediger">À rédiger</option>
            <option value="a_relire">À relire</option>
            <option value="termine">Terminé</option>
          </select>
        </div>
      </div>

      {/* CRBO Content — preview structuré si structure_json, fallback texte brut sinon.
          Pour les bilans math (B-CM/B-CMado) : on prepend la grille colorée
          au-dessus du texte du CRBO pour relecture rapide du profil de cotations. */}
      {crbo.structure_json ? (
        <CRBOStructuredPreview
          structure={crbo.structure_json}
          onDownload={handleDownload}
          onPreview={() => setShowPreviewModal(true)}
          previousStructure={previousStructure}
          previousBilanDate={previousBilanDate}
          bilanDate={crbo.bilan_date}
          testList={Array.isArray(crbo.test_utilise) ? crbo.test_utilise : (typeof crbo.test_utilise === 'string' && crbo.test_utilise.trim() ? [crbo.test_utilise] : [])}
        />
      ) : (
        <div className="space-y-4">
          {/* Grille colorée — uniquement pour les bilans math avec un etat valide */}
          {mathGrille && mathState && (
            <BilanMathSummary grille={mathGrille} epreuves={mathState} />
          )}
          {/* Math bilans : rendu structuré markdown avec sections vertes (trame
              identique aux CRBO langage). Langage sans structure_json : fallback
              brut conservé. */}
          {isMathBilan ? (
            <BilanMathCRBORender text={crbo.crbo_text || crbo.crbo_genere || ''} />
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="border-b border-gray-200 px-6 py-4">
                <h2 className="font-semibold text-gray-900">Compte rendu de bilan orthophonique</h2>
              </div>
              <div className="p-6">
                <div className="prose prose-sm max-w-none">
                  <pre className="whitespace-pre-wrap font-sans text-gray-700 leading-relaxed">
                    {crbo.crbo_text || crbo.crbo_genere || ''}
                  </pre>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal Prévisualisation plein écran */}
      {showPreviewModal && crbo.structure_json && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm overflow-y-auto animate-fade-in"
          onClick={() => setShowPreviewModal(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Prévisualisation du CRBO"
        >
          <div className="min-h-screen p-3 sm:p-8">
            <div
              onClick={(e) => e.stopPropagation()}
              className="max-w-4xl mx-auto bg-white dark:bg-surface-dark rounded-2xl shadow-2xl p-5 sm:p-10"
            >
              <div className="flex items-center justify-between mb-5 pb-3 border-b border-gray-200 dark:border-surface-dark-muted sticky top-0 bg-white dark:bg-surface-dark z-10">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                  <Sparkles className="text-primary-600 dark:text-primary-400" size={18} />
                  Prévisualisation du CRBO — {crbo.patient_prenom} {crbo.patient_nom}
                </h2>
                <button
                  onClick={() => setShowPreviewModal(false)}
                  className="btn-secondary text-sm"
                  aria-label="Fermer la prévisualisation"
                >
                  Fermer
                </button>
              </div>
              <CRBOStructuredPreview
                structure={crbo.structure_json}
                onDownload={async () => {
                  await handleDownload()
                  setShowPreviewModal(false)
                }}
                previousStructure={previousStructure}
                previousBilanDate={previousBilanDate}
                bilanDate={crbo.bilan_date}
                testList={Array.isArray(crbo.test_utilise) ? crbo.test_utilise : (typeof crbo.test_utilise === 'string' && crbo.test_utilise.trim() ? [crbo.test_utilise] : [])}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
