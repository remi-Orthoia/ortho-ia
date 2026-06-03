'use client'

import { useState, useEffect } from 'react'
import DashboardSkeleton from '@/components/skeletons/DashboardSkeleton'
import OnboardingTour from '@/components/OnboardingTour'
import MilestoneCelebration from '@/components/MilestoneCelebration'
import CalendarWidget from '@/components/CalendarWidget'
import YearHeatmap from '@/components/YearHeatmap'
import FeedbackBanner from '@/components/FeedbackBanner'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { useToast } from '@/components/Toast'
import { playPrintAnimation } from '@/components/PrintAnimation'
import { playSwoosh } from '@/lib/sounds'
import { applyVocabToObject } from '@/lib/vocab-perso'
import { applyGlossaireToObject } from '@/lib/glossaire'
import {
  Plus,
  FileText,
  Clock,
  CheckCircle,
  Eye,
  Calendar,
  User,
  Trash2,
  Loader2,
  Download,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'

type CRBOStatus = 'a_rediger' | 'a_relire' | 'termine'

interface CRBO {
  id: string
  patient_prenom: string
  patient_nom: string
  patient_classe: string
  patient_ddn: string
  test_utilise: string
  bilan_date: string
  bilan_type: string
  bilan_subtype?: 'b-cm' | 'b-cmado' | null
  medecin_nom?: string | null
  medecin_tel?: string | null
  motif?: string | null
  resultats?: string | null
  structure_json?: any
  crbo_genere?: string | null
  crbo_text?: string | null
  statut: CRBOStatus
  created_at: string
  severite_globale?: 'Léger' | 'Modéré' | 'Sévère' | null
  bilan_precedent_id?: string | null
  bilan_precedent_date?: string | null
}

interface OrthoProfile {
  prenom?: string | null
  nom?: string | null
  adresse?: string | null
  code_postal?: string | null
  ville?: string | null
  telephone?: string | null
  email?: string | null
  adeli_rpps?: string | null
}

/** Libellés et classes pour le badge de statut affiché dans chaque ligne. */
const STATUT_BADGE: Record<CRBOStatus, { label: string; classes: string }> = {
  a_rediger: { label: 'À rédiger', classes: 'bg-blue-50 text-blue-700 border-blue-200' },
  a_relire:  { label: 'À relire',  classes: 'bg-purple-50 text-purple-700 border-purple-200' },
  termine:   { label: 'Terminé',   classes: 'bg-green-50 text-green-700 border-green-200' },
}

const PAGE_SIZE = 20

// Doit rester aligne avec app/dashboard/nouveau-crbo/page.tsx (meme prefixe).
// Une cle scopee par user.id pour eviter qu'un brouillon ortho A fuite vers
// ortho B sur le meme navigateur (poste partage en cabinet).
const DRAFT_KEY_PREFIX = 'ortho-ia:crbo-draft:'
const LEGACY_DRAFT_KEY = 'ortho-ia:crbo-draft'
// Prefixe des drafts B-CM / B-CMado (formulaire math). Aligne sur
// components/bilans/math/BilanMathForm.tsx (DRAFT_KEY_PREFIX la-bas).
// Cles : `ortho-ia:bilan-math-draft:${user.id}:b-cm` et `:b-cmado`.
const MATH_DRAFT_KEY_PREFIX = 'ortho-ia:bilan-math-draft:'
const DRAFT_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000

/** Aperçu d'un brouillon affiché sur le dashboard. Couvre les 3 formulaires
 *  avec draft : CRBO langage (wizard 4 etapes), B-CM enfant, B-CMado.
 *  Plusieurs drafts peuvent coexister (un ortho peut avoir une evaluation
 *  langage en pause ET un B-CMado en pause sur 2 patients differents). */
interface DraftPreview {
  /** Type de bilan, pilote l'URL "Reprendre" et le libelle. */
  type: 'crbo' | 'b-cm' | 'b-cmado'
  /** Etape du wizard (CRBO langage uniquement, 1..4). null pour math (pas de wizard). */
  step: number | null
  patientName: string
  daysAgo: number
  /** Timestamp ms — sert au tri (plus recent en premier). */
  savedAt: number
  /** URL absolue ou relative pour le bouton Reprendre. */
  href: string
}

export default function DashboardPage() {
  const router = useRouter()
  const toast = useToast()
  const [crbos, setCrbos] = useState<CRBO[]>([])
  const [profile, setProfile] = useState<OrthoProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [userName, setUserName] = useState('')
  const [stats, setStats] = useState({
    total: 0,
    thisMonth: 0,
    timeSaved: 0,
  })
  // Nombre de patients enregistres dans le carnet — sert a calculer la
  // checklist d'onboarding (etape "1er patient ajoute"). Charge en parallele
  // des CRBOs et profile dans fetchData.
  const [patientCount, setPatientCount] = useState(0)
  const [planLimit, setPlanLimit] = useState<number | null>(10)
  const [feedbackCrboId, setFeedbackCrboId] = useState<string | null>(null)
  const [downloadingId, setDownloadingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  // Brouillons en cours pour l'user courant — affichés en bandeaux empilés
  // au-dessus des stats. Couvre CRBO langage + B-CM + B-CMado (un ortho peut
  // avoir 1 à 3 drafts en parallèle sur des patients différents). Triés du
  // plus récent au plus ancien. Hydraté dans fetchData après récup user.id.
  const [draftPreviews, setDraftPreviews] = useState<DraftPreview[]>([])
  // Pagination client-side : 20 CRBOs par page. Au-delà, l'ortho navigue
  // avec les boutons Prev / Next. Côté serveur on charge tous les CRBOs
  // (filtrés par RLS user_id) — le volume reste petit (max quelques
  // centaines par ortho), pas de scroll infini nécessaire.
  const [page, setPage] = useState(1)

  useEffect(() => {
    fetchData()
    try {
      const pending = sessionStorage.getItem('orthoia.feedback-pending')
      if (pending) {
        sessionStorage.removeItem('orthoia.feedback-pending')
        setFeedbackCrboId(pending)
      }
    } catch {}
  }, [])

  const fetchData = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/auth/login')
      return
    }

    // Brouillons en cours pour CET ortho (cles scopees par user.id pour
    // eviter qu'un brouillon ortho A fuite vers ortho B sur le meme
    // navigateur). On scanne 3 clés :
    //   1. CRBO langage : `ortho-ia:crbo-draft:${user.id}`
    //   2. B-CM enfant  : `ortho-ia:bilan-math-draft:${user.id}:b-cm`
    //   3. B-CMado      : `ortho-ia:bilan-math-draft:${user.id}:b-cmado`
    // On purge aussi la cle globale legacy au passage.
    try {
      localStorage.removeItem(LEGACY_DRAFT_KEY)
      const found: DraftPreview[] = []

      // 1. Brouillon CRBO langage
      const crboRaw = localStorage.getItem(`${DRAFT_KEY_PREFIX}${user.id}`)
      if (crboRaw) {
        try {
          const draft = JSON.parse(crboRaw) as {
            step?: number
            formData?: { patient_prenom?: string; patient_nom?: string }
            savedAt?: number
          }
          const savedAt = draft.savedAt || 0
          const ageMs = savedAt ? Date.now() - savedAt : 0
          if (savedAt && ageMs > DRAFT_MAX_AGE_MS) {
            try { localStorage.removeItem(`${DRAFT_KEY_PREFIX}${user.id}`) } catch {}
          } else {
            const fd = draft.formData || {}
            const name = [fd.patient_prenom, fd.patient_nom].filter(Boolean).join(' ').trim()
            found.push({
              type: 'crbo',
              step: draft.step || 1,
              patientName: name || 'patient non renseigne',
              daysAgo: savedAt ? Math.floor(ageMs / (1000 * 60 * 60 * 24)) : 0,
              savedAt,
              href: '/dashboard/nouveau-crbo?reprendre=1',
            })
          }
        } catch { /* draft corrompu : on ignore */ }
      }

      // 2 et 3. Brouillons B-CM et B-CMado (formulaire math)
      // Structure du payload : BilanMathDraft + savedAt (cf. BilanMathForm.tsx
      // ligne ~301 : payload = { ...draft, savedAt }). Patient sous draft.patient.
      const mathVariants: Array<{ grilleId: 'b-cm' | 'b-cmado'; href: string }> = [
        { grilleId: 'b-cm',    href: '/dashboard/bilan/b-cm' },
        { grilleId: 'b-cmado', href: '/dashboard/bilan/b-cmado' },
      ]
      for (const v of mathVariants) {
        const key = `${MATH_DRAFT_KEY_PREFIX}${user.id}:${v.grilleId}`
        const raw = localStorage.getItem(key)
        if (!raw) continue
        try {
          const draft = JSON.parse(raw) as {
            patient?: { prenom?: string; nom?: string }
            savedAt?: number
          }
          const savedAt = draft.savedAt || 0
          const ageMs = savedAt ? Date.now() - savedAt : 0
          if (savedAt && ageMs > DRAFT_MAX_AGE_MS) {
            try { localStorage.removeItem(key) } catch {}
            continue
          }
          const p = draft.patient || {}
          const name = [p.prenom, p.nom].filter(Boolean).join(' ').trim()
          found.push({
            type: v.grilleId,
            step: null,
            patientName: name || 'patient non renseigne',
            daysAgo: savedAt ? Math.floor(ageMs / (1000 * 60 * 60 * 24)) : 0,
            savedAt,
            href: v.href,
          })
        } catch { /* draft corrompu : on ignore */ }
      }

      // Tri : plus récent en premier (pertinent quand l'ortho jongle entre
      // 2 patients — la session active est en haut).
      found.sort((a, b) => b.savedAt - a.savedAt)
      setDraftPreviews(found)
    } catch {
      // localStorage indisponible (mode prive) ou draft corrompu → on ignore.
    }

    // Profil ortho (pour le header Word + bandeau salutation)
    const { data: prof } = await supabase
      .from('profiles')
      .select('prenom, nom, adresse, code_postal, ville, telephone, email, adeli_rpps')
      .eq('id', user.id)
      .single()
    if (prof) {
      setProfile(prof)
      setUserName(prof.prenom || 'there')
    }

    // Plan / quota
    const { data: sub } = await supabase
      .from('subscriptions')
      .select('plan, crbo_limit')
      .eq('user_id', user.id)
      .single()
    const unlimited = !sub || sub.crbo_limit === -1 || (sub.plan && sub.plan !== 'free')
    setPlanLimit(unlimited ? null : (sub?.crbo_limit ?? 3))

    // Compte patients — uniquement le count, pas les lignes (perf).
    // Sert a cocher l'etape 2 de la checklist d'onboarding.
    const { count: patientsCount } = await supabase
      .from('patients')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
    setPatientCount(patientsCount ?? 0)

    // CRBOs (tout charger, tri DB par created_at desc)
    const { data: crbosData } = await supabase
      .from('crbos')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (crbosData) {
      // Résolution date du bilan précédent pour les renouvellements
      const precIds = crbosData.map(c => c.bilan_precedent_id).filter(Boolean) as string[]
      const precDates = new Map<string, string>()
      if (precIds.length > 0) {
        const { data: precData } = await supabase
          .from('crbos')
          .select('id, bilan_date')
          .in('id', precIds)
        for (const p of precData ?? []) precDates.set(p.id, p.bilan_date)
      }
      // Remap statuts legacy 'en_cours' → 'a_rediger', défaut 'termine'
      const crbosWithStatus: CRBO[] = crbosData.map(crbo => ({
        ...crbo,
        statut: crbo.statut === 'en_cours' ? 'a_rediger' : (crbo.statut || 'termine'),
        bilan_precedent_date: crbo.bilan_precedent_id
          ? precDates.get(crbo.bilan_precedent_id) ?? null
          : null,
      }))
      setCrbos(crbosWithStatus)

      // Stats : total, ce mois, temps gagné (45 min / CRBO)
      const now = new Date()
      const thisMonthCount = crbosWithStatus.filter(c => {
        const created = new Date(c.created_at)
        return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear()
      }).length
      setStats({
        total: crbosWithStatus.length,
        thisMonth: thisMonthCount,
        timeSaved: crbosWithStatus.length * 45,
      })
    }

    setLoading(false)
  }

  const handleDelete = async (crboId: string) => {
    if (!confirm('Supprimer ce CRBO ?')) return
    setDeletingId(crboId)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      toast.error('Session expirée — reconnectez-vous.')
      setDeletingId(null)
      return
    }
    const { data: deleted, error } = await supabase
      .from('crbos')
      .delete()
      .eq('id', crboId)
      .eq('user_id', user.id)
      .select('id')
    setDeletingId(null)
    if (error || !deleted || deleted.length === 0) {
      console.error('Erreur suppression CRBO:', error)
      toast.error("La suppression n'a pas pu être enregistrée. Réessayez.")
      return
    }
    setCrbos(prev => prev.filter(c => c.id !== crboId))
    toast.success('CRBO supprimé.')
  }

  /** Téléchargement Word inline depuis la liste. Délègue au bon générateur :
   *  - bilan_subtype 'b-cm' / 'b-cmado' → generateBilanMathWord (grille
   *    coloriée + markdown)
   *  - sinon → downloadCRBOWord (gabarit langage classique) */
  const handleDownload = async (crbo: CRBO) => {
    if (downloadingId) return
    setDownloadingId(crbo.id)
    playPrintAnimation(1500)
    try {
      const isMath = crbo.bilan_subtype === 'b-cm' || crbo.bilan_subtype === 'b-cmado'
      if (isMath) {
        const { GRILLE_B_CM } = await import('@/lib/bilans/math/grille-b-cm')
        const { GRILLE_B_CMADO } = await import('@/lib/bilans/math/grille-b-cmado')
        const { generateBilanMathWord } = await import('@/lib/bilan-math-word-export')
        const grille = crbo.bilan_subtype === 'b-cm' ? GRILLE_B_CM : GRILLE_B_CMADO

        // Reconstruit le draft à partir de resultats JSON. Si parsing échoue
        // on génère quand même avec un draft vide (le texte du CRBO reste OK).
        let epreuves: Record<string, any> = {}
        let mode: 'initial' | 'renouvellement' = (crbo.bilan_type === 'renouvellement' ? 'renouvellement' : 'initial')
        try {
          if (crbo.resultats) {
            const parsed = JSON.parse(crbo.resultats)
            if (parsed && typeof parsed === 'object') {
              if (parsed.epreuves) epreuves = parsed.epreuves
              if (parsed.mode === 'initial' || parsed.mode === 'renouvellement') mode = parsed.mode
            }
          }
        } catch {
          // resultats illisible : on garde un draft vide
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
            anamnese: '',
            motif: crbo.motif || '',
            epreuves,
            updatedAt: Date.now(),
          },
          crboText: crbo.crbo_genere || crbo.crbo_text || '',
          profile,
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
        // Bilan langage standard — réutilise le pipeline de l'historique
        const { downloadCRBOWord } = await import('@/lib/word-export')
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
            ortho_nom: profile ? `${profile.prenom ?? ''} ${profile.nom ?? ''}`.trim() : '',
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
            motif: crbo.motif ?? '',
            test_utilise: crbo.test_utilise
              ? String(crbo.test_utilise).split(',').map(t => t.trim())
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
      playSwoosh()
      // Promotion automatique a_rediger → a_relire après téléchargement
      if (crbo.statut === 'a_rediger') {
        const supabase = createClient()
        const { error } = await supabase
          .from('crbos')
          .update({ statut: 'a_relire' })
          .eq('id', crbo.id)
        if (!error) {
          setCrbos(prev => prev.map(c => c.id === crbo.id ? { ...c, statut: 'a_relire' } : c))
        }
      }
    } catch (err) {
      console.error('Erreur export Word dashboard:', err)
      toast.error('Erreur lors de la génération du document Word.')
    } finally {
      setDownloadingId(null)
    }
  }

  if (loading) return <DashboardSkeleton />

  const now = new Date()
  const hour = now.getHours()
  const salutation = hour < 12 ? 'Bonjour' : hour < 18 ? 'Bon après-midi' : 'Bonsoir'

  const aRedigerCount = crbos.filter(c => c.statut === 'a_rediger').length
  const totalPages = Math.max(1, Math.ceil(crbos.length / PAGE_SIZE))
  const safePage = Math.min(Math.max(1, page), totalPages)
  const pagedCrbos = crbos.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  return (
    <div className="space-y-6 animate-fade-in">
      <OnboardingTour />
      <MilestoneCelebration crboCount={stats.total} />
      <FeedbackBanner crboId={feedbackCrboId} />

      <CalendarWidget />

      {/* Heatmap année — uniquement si l'ortho a au moins 1 CRBO */}
      {stats.total > 0 && (
        <YearHeatmap crboDates={crbos.map(c => c.created_at)} />
      )}

      {/* Header salutation + actions principales */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            {salutation} {userName} 👋
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1.5">
            {stats.total === 0
              ? 'Prêt·e à générer votre premier CRBO ?'
              : `${stats.thisMonth} CRBO${stats.thisMonth > 1 ? 's' : ''} ce mois · ${Math.floor(stats.timeSaved / 60)} h gagnées au total`}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Link href="/dashboard/nouveau-crbo" className="btn-primary whitespace-nowrap">
            <Plus size={18} />
            Nouveau CRBO
          </Link>
        </div>
      </div>

      {/* Bandeaux "Brouillon en cours" — un par draft non expiré (CRBO langage,
          B-CM, B-CMado). Empilés, plus récent en premier. Sans ça l'ortho ne
          savait pas qu'un brouillon l'attendait et risquait de redémarrer un
          dossier de zéro — particulièrement critique pour B-CM/B-CMado qui
          sont passés en plusieurs séances par nature. */}
      {draftPreviews.length > 0 && (
        <div className="space-y-2">
          {draftPreviews.map((dp) => {
            const labelType = dp.type === 'crbo' ? 'CRBO langage' : dp.type === 'b-cm' ? 'B-CM enfant' : 'B-CMado'
            const subtitle = dp.type === 'crbo' && dp.step !== null
              ? `Étape ${dp.step} sur 4 · ${dp.daysAgo === 0 ? "aujourd'hui" : `il y a ${dp.daysAgo} j`}`
              : `${labelType} · ${dp.daysAgo === 0 ? "aujourd'hui" : `il y a ${dp.daysAgo} j`}`
            return (
              <div key={`${dp.type}-${dp.savedAt}`} className="rounded-2xl border border-amber-200 dark:border-amber-800/40 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 p-4 flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0 text-lg">
                  📝
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 dark:text-gray-100">
                    Brouillon {labelType} — {dp.patientName}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                    {subtitle}
                  </p>
                </div>
                <Link
                  href={dp.href}
                  className="px-4 py-2 rounded-lg bg-amber-600 text-white text-sm font-semibold hover:bg-amber-700 whitespace-nowrap shadow-sm"
                >
                  Reprendre
                </Link>
              </div>
            )
          })}
        </div>
      )}

      {/* 4 cartes stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {(() => {
          const reachedQuota = planLimit !== null && stats.thisMonth >= planLimit
          const nearQuota = planLimit !== null && stats.thisMonth >= planLimit - 2 && !reachedQuota
          const thisMonthValue = planLimit === null
            ? String(stats.thisMonth)
            : `${stats.thisMonth} / ${planLimit}`
          const thisMonthColor = reachedQuota
            ? 'text-red-600 dark:text-red-400'
            : nearQuota
              ? 'text-amber-600 dark:text-amber-400'
              : 'text-gray-900 dark:text-gray-100'
          const cards = [
            { label: 'Total CRBO', value: stats.total, color: 'text-gray-900 dark:text-gray-100', sub: null as string | null },
            {
              label: planLimit === null ? 'Ce mois' : 'CRBOs ce mois',
              value: thisMonthValue,
              color: thisMonthColor,
              sub: reachedQuota ? 'Quota atteint — passez Pro' : nearQuota ? 'Proche du quota' : null,
            },
            { label: 'À rédiger', value: aRedigerCount, color: 'text-blue-600 dark:text-blue-400', sub: null },
            { label: 'Temps gagné', value: `${Math.floor(stats.timeSaved / 60)} h`, color: 'text-primary-600 dark:text-primary-400', sub: null },
          ]
          return cards.map((s) => (
            <div key={s.label} className="card-modern p-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">{s.label}</p>
              <p className={`text-2xl font-bold mt-0.5 ${s.color}`}>{s.value}</p>
              {s.sub && (
                <p className={`text-[11px] mt-1 ${reachedQuota ? 'text-red-600 dark:text-red-400' : 'text-amber-600 dark:text-amber-400'}`}>
                  {s.sub}
                </p>
              )}
            </div>
          ))
        })()}
      </div>

      {/* Bandeau quota atteint */}
      {planLimit !== null && stats.thisMonth >= planLimit && (
        <div className="rounded-2xl border border-red-200 dark:border-red-800/40 bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 flex items-center justify-center shrink-0 font-bold">!</div>
          <div className="flex-1">
            <p className="font-bold text-gray-900 dark:text-gray-100">
              Vous avez atteint votre limite de {planLimit} CRBOs gratuits ce mois.
            </p>
            <p className="text-sm text-gray-700 dark:text-gray-300 mt-0.5">
              Passez en Pro pour continuer à générer des CRBOs sans limite. Votre compteur sera remis à zéro le 1er du mois prochain.
            </p>
          </div>
          <Link href="/dashboard/upgrade" className="btn-primary whitespace-nowrap">
            Passer Pro
          </Link>
        </div>
      )}

      {/* Checklist d'onboarding — interactive : chaque etape se coche
          automatiquement selon l'etat reel (profil, patients, CRBO). On masque
          le bloc des que les 3 etapes sont validees pour ne pas encombrer
          le dashboard d'un user actif. */}
      {(() => {
        // Etat de chaque etape — recalcule a chaque render pour suivre les
        // updates de profile / patientCount / stats.
        const profileComplete = !!(
          profile?.adresse?.trim()
          && profile?.code_postal?.trim()
          && profile?.ville?.trim()
          && profile?.telephone?.trim()
        )
        const hasPatient = patientCount > 0
        const hasFirstCrbo = stats.total > 0
        const allDone = profileComplete && hasPatient && hasFirstCrbo
        if (allDone) return null

        const doneCount = [profileComplete, hasPatient, hasFirstCrbo].filter(Boolean).length

        const Step = ({
          done,
          label,
          desc,
          href,
        }: { done: boolean; label: string; desc: string; href: string }) => (
          <li className="flex items-start gap-3">
            <span
              className={`inline-flex items-center justify-center w-6 h-6 rounded-full shrink-0 mt-0.5 transition ${
                done
                  ? 'bg-green-600 text-white'
                  : 'bg-white text-green-700 border-2 border-green-300'
              }`}
              aria-hidden="true"
            >
              {done ? <CheckCircle size={14} /> : null}
            </span>
            <span className={`text-sm ${done ? 'text-gray-500 line-through' : 'text-gray-800'}`}>
              <Link href={href} className={`font-semibold ${done ? 'text-gray-500' : 'text-green-700 hover:underline'}`}>
                {label}
              </Link>
              <span className="ml-1">— {desc}</span>
            </span>
          </li>
        )

        return (
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-6 sm:p-8">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-white shadow-sm flex items-center justify-center shrink-0">
                <FileText className="text-green-600" size={24} />
              </div>
              <div className="flex-1">
                <div className="flex items-baseline gap-3 flex-wrap">
                  <h3 className="text-xl font-bold text-gray-900">
                    {doneCount === 0 ? 'Bienvenue sur Ortho.ia 👋' : `Bien joué, ${doneCount}/3 étapes validées`}
                  </h3>
                  <span className="text-sm font-medium text-green-700">
                    {doneCount === 0 && 'À 3 étapes de votre premier CRBO'}
                    {doneCount === 1 && 'Plus que 2 étapes'}
                    {doneCount === 2 && 'Une dernière étape, vous y êtes presque'}
                  </span>
                </div>
                {/* Barre de progression visuelle */}
                <div className="mt-3 h-1.5 w-full max-w-md bg-white/70 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-600 transition-all duration-500"
                    style={{ width: `${(doneCount / 3) * 100}%` }}
                  />
                </div>
                <ol className="mt-5 space-y-3">
                  <Step
                    done={profileComplete}
                    label="Complétez votre profil"
                    desc="adresse, téléphone, email — pré-remplis dans chaque CRBO."
                    href="/dashboard/profil"
                  />
                  <Step
                    done={hasPatient}
                    label="Ajoutez votre premier patient"
                    desc="dans le carnet, ou directement en créant le CRBO."
                    href="/dashboard/patients"
                  />
                  <Step
                    done={hasFirstCrbo}
                    label="Créez votre premier CRBO"
                    desc="5 étapes guidées, import PDF, génération en 20 sec."
                    href="/dashboard/nouveau-crbo"
                  />
                </ol>
                <div className="mt-6">
                  <Link
                    href={
                      !profileComplete
                        ? '/dashboard/profil'
                        : !hasPatient
                          ? '/dashboard/patients'
                          : '/dashboard/nouveau-crbo'
                    }
                    className="inline-flex items-center gap-2 bg-green-600 text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-green-700 transition"
                  >
                    <Plus size={18} />
                    {!profileComplete
                      ? 'Compléter mon profil'
                      : !hasPatient
                        ? 'Ajouter un patient'
                        : 'Démarrer mon premier CRBO'}
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )
      })()}

      {/* Liste complète des CRBOs — remplace le kanban + les widgets récents */}
      {stats.total > 0 && (
        <div className="card-modern overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-surface-dark-muted flex items-center justify-between gap-3 flex-wrap">
            <div>
              <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                Tous mes CRBOs
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {crbos.length} compte rendu{crbos.length > 1 ? 's' : ''} — triés du plus récent au plus ancien
              </p>
            </div>
            {totalPages > 1 && (
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Page {safePage} / {totalPages}
              </p>
            )}
          </div>

          {/* Liste : 1 ligne par CRBO */}
          <ul className="divide-y divide-gray-100 dark:divide-surface-dark-muted">
            {pagedCrbos.map(c => {
              const statut = STATUT_BADGE[c.statut] ?? STATUT_BADGE.a_rediger
              const downloading = downloadingId === c.id
              const deleting = deletingId === c.id
              const isMath = c.bilan_subtype === 'b-cm' || c.bilan_subtype === 'b-cmado'
              return (
                <li
                  key={c.id}
                  className="px-5 py-3 flex items-center gap-4 hover:bg-gray-50 dark:hover:bg-surface-dark-muted/40 transition"
                >
                  {/* Identité patient */}
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                      <span className="uppercase">{c.patient_nom || '—'}</span>{' '}
                      <span className="font-normal">{c.patient_prenom || ''}</span>
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 flex items-center gap-2 flex-wrap">
                      <span className="inline-flex items-center gap-1">
                        <FileText size={12} />
                        {c.test_utilise || 'Test non défini'}
                      </span>
                      <span className="text-gray-300 dark:text-gray-600">·</span>
                      <span className="inline-flex items-center gap-1">
                        <Calendar size={12} />
                        {new Date(c.bilan_date || c.created_at).toLocaleDateString('fr-FR')}
                      </span>
                      {c.bilan_type === 'renouvellement' && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-purple-100 text-purple-700">
                          🔄 Renouvellement
                        </span>
                      )}
                      {isMath && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-100 text-emerald-700">
                          Maths
                        </span>
                      )}
                    </p>
                  </div>

                  {/* Badge statut */}
                  <span className={`hidden sm:inline-block px-2.5 py-1 rounded-full border text-xs font-medium ${statut.classes}`}>
                    {statut.label}
                  </span>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleDownload(c)}
                      disabled={downloading || deleting}
                      title="Télécharger le Word"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-600 text-white text-xs font-semibold hover:bg-green-700 disabled:opacity-60 disabled:cursor-wait transition"
                    >
                      {downloading
                        ? <Loader2 size={13} className="animate-spin" />
                        : <Download size={13} />}
                      <span className="hidden md:inline">Word</span>
                    </button>
                    <Link
                      href={`/dashboard/historique/${c.id}`}
                      title="Voir / éditer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-surface-dark-muted text-gray-700 dark:text-gray-200 text-xs font-medium hover:bg-gray-50 dark:hover:bg-surface-dark-muted transition"
                    >
                      <Eye size={13} />
                      <span className="hidden md:inline">Voir</span>
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleDelete(c.id)}
                      disabled={deleting}
                      title="Supprimer"
                      className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 transition disabled:opacity-50"
                    >
                      {deleting
                        ? <Loader2 size={13} className="animate-spin text-red-500" />
                        : <Trash2 size={13} className="text-red-500" />}
                    </button>
                  </div>
                </li>
              )
            })}
          </ul>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-5 py-3 border-t border-gray-100 dark:border-surface-dark-muted flex items-center justify-between">
              <button
                type="button"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={safePage === 1}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-surface-dark-muted text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-surface-dark-muted disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                <ChevronLeft size={14} /> Précédent
              </button>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {(safePage - 1) * PAGE_SIZE + 1} – {Math.min(safePage * PAGE_SIZE, crbos.length)} sur {crbos.length}
              </span>
              <button
                type="button"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={safePage === totalPages}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-surface-dark-muted text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-surface-dark-muted disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                Suivant <ChevronRight size={14} />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Quick Actions secondaires */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link
          href="/dashboard/patients"
          className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition group"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center group-hover:bg-indigo-200 transition">
              <User className="text-indigo-600" size={24} />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Carnet patients</h3>
              <p className="text-sm text-gray-500">Gérer vos patients et leur historique</p>
            </div>
          </div>
        </Link>
        <Link
          href="/dashboard/historique"
          className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition group"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center group-hover:bg-emerald-200 transition">
              <FileText className="text-emerald-600" size={24} />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Historique CRBO</h3>
              <p className="text-sm text-gray-500">Recherche, filtres avancés sur tous vos comptes rendus</p>
            </div>
          </div>
        </Link>
      </div>
    </div>
  )
}
