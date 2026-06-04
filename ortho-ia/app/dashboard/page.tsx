'use client'

import { useState, useEffect } from 'react'
import DashboardSkeleton from '@/components/skeletons/DashboardSkeleton'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { autoUpsertPatientFromDraft } from '@/lib/draft-sync'
import { useToast } from '@/components/Toast'
import { playPrintAnimation } from '@/components/PrintAnimation'
import { playSwoosh } from '@/lib/sounds'
import { applyVocabToObject } from '@/lib/vocab-perso'
import { applyGlossaireToObject } from '@/lib/glossaire'
import {
  Plus,
  FileText,
  Calendar,
  Trash2,
  Loader2,
  Download,
  Eye,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Sparkles,
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
  const [planLimit, setPlanLimit] = useState<number | null>(10)
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

  // Affichage condensé par défaut : seulement les 3 derniers CRBOs.
  // L'ortho voit son flow récent d'un coup d'œil et déplie la liste
  // complète à la demande. Pattern Linear / Stripe / Notion.
  const [showAllCrbos, setShowAllCrbos] = useState(false)
  const RECENT_COUNT = 3

  useEffect(() => {
    fetchData()
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
            formData?: {
              patient_prenom?: string
              patient_nom?: string
              patient_ddn?: string
              patient_classe?: string
              medecin_nom?: string
              medecin_tel?: string
            }
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
            // Backfill defensif : auto-upsert patient au carnet meme pour les
            // drafts crees AVANT le deploy du auto-upsert au save (commit 3dc1ded).
            // Idempotent + silencieux, ne bloque jamais l'affichage dashboard.
            if (fd.patient_prenom && fd.patient_nom) {
              autoUpsertPatientFromDraft(user.id, {
                prenom: fd.patient_prenom,
                nom: fd.patient_nom,
                date_naissance: fd.patient_ddn || null,
                classe: fd.patient_classe || null,
                medecin_nom: fd.medecin_nom || null,
                medecin_tel: fd.medecin_tel || null,
              }).catch(() => null)
            }
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
            patient?: { prenom?: string; nom?: string; date_naissance?: string; classe?: string }
            medecin?: { nom?: string; tel?: string }
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
          // Backfill defensif (idem CRBO langage) : auto-upsert pour les drafts
          // math crees AVANT le deploy du auto-upsert au save. Idempotent +
          // silencieux. Couvre B-CM et B-CMado.
          if (p.prenom && p.nom) {
            autoUpsertPatientFromDraft(user.id, {
              prenom: p.prenom,
              nom: p.nom,
              date_naissance: p.date_naissance || null,
              classe: p.classe || null,
              medecin_nom: draft.medecin?.nom || null,
              medecin_tel: draft.medecin?.tel || null,
            }).catch(() => null)
          }
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

  const totalPages = Math.max(1, Math.ceil(crbos.length / PAGE_SIZE))
  const safePage = Math.min(Math.max(1, page), totalPages)
  const pagedCrbos = crbos.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  // Vue condensée par défaut : 3 derniers CRBOs visibles. L'ortho déplie
  // pour voir le reste (pattern Linear / Stripe / Notion). Si l'ortho a
  // <= 3 CRBOs, on affiche tout d'office (rien à plier).
  const canCollapse = crbos.length > RECENT_COUNT
  const displayedCrbos = canCollapse && !showAllCrbos
    ? crbos.slice(0, RECENT_COUNT)
    : pagedCrbos
  const showPagination = (showAllCrbos || !canCollapse) && totalPages > 1

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header salutation — sobre, le CTA principal est juste en dessous */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">
          {salutation} {userName} 👋
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {stats.total === 0
            ? 'Prêt·e à générer votre premier CRBO ?'
            : `${stats.thisMonth} CRBO${stats.thisMonth > 1 ? 's' : ''} ce mois · ${Math.floor(stats.timeSaved / 60)} h gagnées au total`}
        </p>
      </div>

      {/* Bandeau CTA principal "Nouveau CRBO" — symétrique aux bandeaux
          brouillons (rounded-2xl + gradient + icône à gauche + bouton à
          droite), mais en vert pour le signal d'action principal. C'est
          la première chose que l'ortho voit en ouvrant l'app, et c'est
          ce qu'elle vient chercher 95% du temps. Pattern Stripe / Linear :
          CTA dominant en haut de page. */}
      <Link
        href="/dashboard/nouveau-crbo"
        className="group block rounded-2xl border border-emerald-300 bg-gradient-to-br from-emerald-50 via-green-50 to-emerald-100 dark:border-emerald-800/40 dark:from-emerald-900/30 dark:to-emerald-900/10 p-5 hover:shadow-md hover:border-emerald-400 transition-all"
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform">
            <Plus size={24} strokeWidth={2.5} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-lg font-bold text-emerald-900 dark:text-emerald-100 flex items-center gap-2">
              Nouveau CRBO
              <Sparkles size={16} className="text-emerald-600 opacity-80" />
            </p>
            <p className="text-sm text-emerald-800/80 dark:text-emerald-200/70 mt-0.5">
              {stats.total === 0
                ? 'Démarrez votre premier compte rendu en 5 minutes.'
                : 'Démarrez un nouveau compte rendu de bilan orthophonique.'}
            </p>
          </div>
          <div className="hidden sm:flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-emerald-600 text-white text-sm font-semibold shadow-sm group-hover:bg-emerald-700 transition shrink-0">
            Démarrer
            <ChevronRight size={16} />
          </div>
        </div>
      </Link>

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

      {/* Bandeau profil incomplet — version sobre, 1 ligne. Remplace la
          checklist gamifiée 3 etapes (retrait audit UX 2026-06). */}
      {(() => {
        const profileComplete = !!(
          profile?.adresse?.trim()
          && profile?.code_postal?.trim()
          && profile?.ville?.trim()
          && profile?.telephone?.trim()
        )
        if (profileComplete) return null
        return (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-900 flex items-center justify-between gap-3 flex-wrap">
            <span>Complétez votre profil pour pré-remplir l&apos;en-tête de vos CRBO.</span>
            <Link href="/dashboard/profil" className="font-semibold hover:underline whitespace-nowrap">
              Compléter →
            </Link>
          </div>
        )
      })()}

      {/* Liste des CRBOs — vue condensée 3 derniers par défaut, dépliable
          pour voir la suite. Pattern Linear / Stripe / Notion. */}
      {stats.total > 0 && (
        <div className="card-modern overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-surface-dark-muted flex items-center justify-between gap-3 flex-wrap">
            <div>
              <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                {canCollapse && !showAllCrbos ? 'CRBOs récents' : 'Tous mes CRBOs'}
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {canCollapse && !showAllCrbos
                  ? `${RECENT_COUNT} derniers sur ${crbos.length}`
                  : `${crbos.length} compte rendu${crbos.length > 1 ? 's' : ''} — du plus récent au plus ancien`}
              </p>
            </div>
            {showPagination && (
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Page {safePage} / {totalPages}
              </p>
            )}
          </div>

          {/* Liste : 1 ligne par CRBO */}
          <ul className="divide-y divide-gray-100 dark:divide-surface-dark-muted">
            {displayedCrbos.map(c => {
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

          {/* Footer : soit bouton "Voir tous" (vue condensée), soit
              pagination (vue dépliée avec > 20 CRBOs). */}
          {canCollapse && !showAllCrbos && (
            <button
              type="button"
              onClick={() => setShowAllCrbos(true)}
              className="w-full px-5 py-3 border-t border-gray-100 dark:border-surface-dark-muted text-sm font-medium text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50/50 dark:hover:bg-emerald-900/10 transition flex items-center justify-center gap-1.5"
            >
              Voir tous mes CRBOs ({crbos.length})
              <ChevronDown size={15} />
            </button>
          )}

          {canCollapse && showAllCrbos && !showPagination && (
            <button
              type="button"
              onClick={() => setShowAllCrbos(false)}
              className="w-full px-5 py-3 border-t border-gray-100 dark:border-surface-dark-muted text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-surface-dark-muted transition flex items-center justify-center gap-1.5"
            >
              Réduire aux 3 derniers
              <ChevronDown size={15} className="rotate-180" />
            </button>
          )}

          {showPagination && (
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

    </div>
  )
}
