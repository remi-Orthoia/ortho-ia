'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { Loader2, Save, CheckCircle, AlertCircle, Trash2, Copy, Camera, Download, Users, Heart, Sparkles } from 'lucide-react'
import { useToast } from '@/components/Toast'

function ProfilContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const toast = useToast()
  const isIncompleteRedirect = searchParams.get('incomplete') === '1'
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [profile, setProfile] = useState({
    prenom: '',
    nom: '',
    email: '',
    adresse: '',
    code_postal: '',
    ville: '',
    telephone: '',
  })
  // ===== Section extension Chrome =====
  // userLoaded sert uniquement à afficher la section "Connexion extension Chrome".
  // Le token JWT n'est jamais stocké en state (récupéré à la volée au click pour
  // toujours servir le plus frais).
  const [userLoaded, setUserLoaded] = useState(false)
  const [tokenCopied, setTokenCopied] = useState(false)
  const [tokenError, setTokenError] = useState('')

  // ===== Section parrainage =====
  // referralCode : code unique de l'utilisatrice (sert d'URL de partage).
  // referrals : liste de ses filleules avec prénom et statut.
  // earnedThisMonth : somme des "earned" pending+applied du mois courant.
  type ReferralRow = {
    id: string
    status: 'pending' | 'active' | 'cancelled'
    activated_at: string | null
    created_at: string
    referredPrenom: string | null
  }
  const [referralCode, setReferralCode] = useState<string | null>(null)
  const [referrals, setReferrals] = useState<ReferralRow[]>([])
  const [earnedThisMonth, setEarnedThisMonth] = useState<number>(0)
  const [refLinkCopied, setRefLinkCopied] = useState(false)
  const [refLinkError, setRefLinkError] = useState('')

  useEffect(() => {
    const loadProfile = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) return

      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (data) {
        setProfile({
          prenom: data.prenom || '',
          nom: data.nom || '',
          email: data.email || user.email || '',
          adresse: data.adresse || '',
          code_postal: data.code_postal || '',
          ville: data.ville || '',
          telephone: data.telephone || '',
        })
        if (data.referral_code) setReferralCode(data.referral_code)
      }

      // ===== Charge les données de parrainage en parallèle =====
      // Filleules : SELECT referrals + lookup des prénoms via une 2e query
      // (Supabase ne supporte pas les jointures cross-RLS via FK alias bien).
      const [{ data: refRows }, { data: rewardRows }] = await Promise.all([
        supabase
          .from('referrals')
          .select('id, referred_id, status, activated_at, created_at')
          .eq('referrer_id', user.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('referral_rewards')
          .select('amount, type, status')
          .eq('user_id', user.id)
          .eq('type', 'earned')
          .gte('month', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10)),
      ])

      if (refRows && refRows.length > 0) {
        // Récupère les prénoms des filleules en une seule query
        const referredIds = refRows.map((r: any) => r.referred_id)
        const { data: referredProfiles } = await supabase
          .from('profiles')
          .select('id, prenom')
          .in('id', referredIds)
        const prenomById = new Map<string, string>()
        for (const p of referredProfiles ?? []) prenomById.set(p.id, p.prenom || '')
        setReferrals(refRows.map((r: any) => ({
          id: r.id,
          status: r.status,
          activated_at: r.activated_at,
          created_at: r.created_at,
          referredPrenom: prenomById.get(r.referred_id) ?? null,
        })))
      }
      if (rewardRows) {
        const sum = rewardRows.reduce((acc: number, r: any) => acc + Number(r.amount || 0), 0)
        setEarnedThisMonth(sum)
      }

      setUserLoaded(true)
      setLoading(false)
    }

    loadProfile()
  }, [])

  /** Calcule l'URL absolue du lien de parrainage en utilisant l'origin courant. */
  const buildReferralUrl = (code: string): string => {
    if (typeof window === 'undefined') return `https://ortho-ia.vercel.app/ref/${code}`
    return `${window.location.origin}/ref/${code}`
  }

  /** Copie le lien de parrainage (URL absolue) dans le presse-papier. */
  const handleCopyReferralLink = async () => {
    setRefLinkError('')
    if (!referralCode) {
      setRefLinkError('Code de parrainage non disponible.')
      return
    }
    const url = buildReferralUrl(referralCode)
    try {
      if (!navigator.clipboard?.writeText) {
        throw new Error("Le presse-papier n'est pas disponible dans ce navigateur.")
      }
      await navigator.clipboard.writeText(url)
      setRefLinkCopied(true)
      setTimeout(() => setRefLinkCopied(false), 3000)
    } catch (e: any) {
      setRefLinkError(e?.message || 'Impossible de copier le lien.')
    }
  }

  /**
   * Récupère l'access_token Supabase à la volée et le copie dans le presse-papier.
   * Pas de cache : on appelle getSession() à chaque fois pour servir un token
   * non-expiré (Supabase rafraîchit silencieusement avant retour si possible).
   */
  const handleCopyToken = async () => {
    setTokenError('')
    try {
      const supabase = createClient()
      const { data, error } = await supabase.auth.getSession()
      if (error || !data?.session?.access_token) {
        throw new Error('Session introuvable. Reconnectez-vous puis réessayez.')
      }
      const token = data.session.access_token
      // navigator.clipboard nécessite HTTPS ou localhost (sinon undefined).
      if (!navigator.clipboard?.writeText) {
        throw new Error("Le presse-papier n'est pas disponible dans ce navigateur.")
      }
      await navigator.clipboard.writeText(token)
      setTokenCopied(true)
      setTimeout(() => setTokenCopied(false), 3000)
    } catch (e: any) {
      setTokenError(e?.message || 'Impossible de copier le token.')
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProfile({ ...profile, [e.target.name]: e.target.value })
    setSaved(false)
  }

  const handleSave = async () => {
    setSaving(true)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      setSaving(false)
      toast.error('Session expirée — reconnectez-vous.')
      return
    }

    // Téléphone : validation laxiste si renseigné (chiffres, espaces, +, -, parenthèses).
    if (profile.telephone && !/^[\d\s\-+().]+$/.test(profile.telephone)) {
      setSaving(false)
      toast.error('Le numéro de téléphone contient des caractères invalides.')
      return
    }

    const { error } = await supabase
      .from('profiles')
      .update({
        prenom: (profile.prenom || '').trim(),
        nom: (profile.nom || '').trim(),
        adresse: (profile.adresse || '').trim(),
        code_postal: (profile.code_postal || '').trim(),
        ville: (profile.ville || '').trim(),
        telephone: (profile.telephone || '').trim(),
      })
      .eq('id', user.id)

    setSaving(false)
    if (error) {
      // Précédemment : échec silencieux (juste `if (!error)`). L'ortho cliquait
      // "Enregistrer" et n'avait aucun retour si la sauvegarde échouait.
      console.error('Erreur sauvegarde profil:', error)
      toast.error("Impossible d'enregistrer le profil. Réessayez.")
      return
    }

    setSaved(true)
    toast.success('Profil enregistré.')
    // Si on est arrivé ici depuis le formulaire CRBO (profil incomplet), on
    // renvoie l'utilisatrice vers le formulaire dès que les champs requis
    // sont remplis.
    const isComplete =
      profile.prenom.trim() && profile.nom.trim() && profile.adresse.trim() &&
      profile.code_postal.trim() && profile.ville.trim() && profile.telephone.trim()
    if (isIncompleteRedirect && isComplete) {
      setTimeout(() => router.push('/dashboard/nouveau-crbo'), 800)
      return
    }
    setTimeout(() => setSaved(false), 3000)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {isIncompleteRedirect && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-900 flex items-start gap-3">
          <AlertCircle size={20} className="shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Complétez votre profil pour générer un CRBO</p>
            <p className="mt-0.5">
              Tous les champs ci-dessous sont obligatoires car ils figurent en en-tête de chaque compte rendu.
              Vous serez redirigée vers le formulaire dès qu&apos;ils seront renseignés.
            </p>
          </div>
        </div>
      )}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Mon profil</h1>
        <p className="mt-1 text-gray-600">
          Ces informations apparaissent en en-tête de chaque CRBO généré — prénom, nom, adresse,
          téléphone et email du cabinet. Elles sont récupérées automatiquement à chaque nouveau bilan.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 sm:p-8 space-y-6">
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Prénom</label>
            <input
              type="text"
              name="prenom"
              value={profile.prenom}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nom</label>
            <input
              type="text"
              name="nom"
              value={profile.nom}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input
            type="email"
            name="email"
            value={profile.email}
            disabled
            className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 text-gray-500"
          />
          <p className="mt-1 text-xs text-gray-500">L'email ne peut pas être modifié</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Adresse du cabinet</label>
          <input
            type="text"
            name="adresse"
            value={profile.adresse}
            onChange={handleChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            placeholder="10 rue des Lilas"
          />
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Code postal (5 chiffres)</label>
            <input
              type="text"
              name="code_postal"
              value={profile.code_postal}
              onChange={handleChange}
              pattern="\d{5}"
              maxLength={5}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="75015"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ville</label>
            <input
              type="text"
              name="ville"
              value={profile.ville}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Paris"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
          <input
            type="tel"
            name="telephone"
            value={profile.telephone}
            onChange={handleChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            placeholder="06 12 34 56 78"
          />
        </div>

        <div className="flex items-center gap-4 pt-4 border-t border-gray-200">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition disabled:opacity-50"
          >
            {saving ? (
              <>
                <Loader2 className="animate-spin" size={20} />
                Enregistrement...
              </>
            ) : (
              <>
                <Save size={20} />
                Enregistrer
              </>
            )}
          </button>
          {saved && (
            <span className="flex items-center gap-2 text-green-600 text-sm">
              <CheckCircle size={18} />
              Modifications enregistrées
            </span>
          )}
        </div>
      </div>

      {/* ============================================================
          Section Programme de parrainage
          Visible uniquement si on connaît son referral_code (donc une
          ortho réellement connectée avec un profil hydraté).
          ============================================================ */}
      {userLoaded && referralCode && (() => {
        const activeReferrals = referrals.filter(r => r.status === 'active')
        const pendingReferrals = referrals.filter(r => r.status === 'pending')
        const cancelledReferrals = referrals.filter(r => r.status === 'cancelled')
        const activeCount = activeReferrals.length
        const monthlyDiscount = Math.min(activeCount * 5, 100)
        const remainingForFree = Math.max(0, 4 - activeCount) // 4 filleules → 20€ ≈ couvre 19,90€
        const remainingForFifty = Math.max(0, 10 - activeCount)
        const referralUrl = buildReferralUrl(referralCode)

        return (
          <section
            id="parrainage"
            className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 p-5 sm:p-6"
          >
            <div className="flex items-center gap-2 mb-1">
              <Heart size={20} className="text-rose-600 fill-rose-100" />
              <h2 className="text-lg font-semibold text-gray-900">
                Mon programme de parrainage
              </h2>
            </div>
            <p className="text-sm text-gray-700 leading-relaxed">
              Parrainez vos collègues orthophonistes — chaque filleule active
              vous rapporte <strong>5€/mois</strong>, et elle paie 14,90€/mois
              au lieu de 19,90€.
            </p>

            {/* Compteur principal — lecture immédiate */}
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-amber-200 p-4">
                <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  <Users size={14} />
                  Filleules actives
                </div>
                <p className="mt-1 text-3xl font-bold text-gray-900">
                  {activeCount}
                  <span className="text-base font-medium text-gray-500"> / 20 max</span>
                </p>
                {pendingReferrals.length > 0 && (
                  <p className="text-xs text-gray-500 mt-1">
                    + {pendingReferrals.length} en attente d&apos;abonnement
                  </p>
                )}
              </div>
              <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-amber-200 p-4">
                <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  <Sparkles size={14} />
                  Gain ce mois
                </div>
                <p className="mt-1 text-3xl font-bold text-rose-700">
                  {earnedThisMonth.toFixed(2).replace('.', ',')}€
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {activeCount === 0
                    ? 'Partagez votre lien pour démarrer'
                    : `${activeCount} × 5€/mois`}
                </p>
              </div>
              <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-amber-200 p-4">
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Potentiel mensuel
                </div>
                <p className="mt-1 text-3xl font-bold text-gray-900">
                  {monthlyDiscount}€
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Plafond 100€ (20 filleules)
                </p>
              </div>
            </div>

            {/* Lien de parrainage copiable */}
            <div className="mt-4 bg-white/80 backdrop-blur-sm rounded-xl border border-amber-200 p-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Votre lien unique
              </p>
              <div className="flex items-center gap-2 flex-wrap">
                <code className="flex-1 min-w-0 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-mono text-gray-800 truncate">
                  {referralUrl}
                </code>
                <button
                  type="button"
                  onClick={handleCopyReferralLink}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-medium rounded-lg transition shadow-sm whitespace-nowrap"
                >
                  {refLinkCopied ? (
                    <>
                      <CheckCircle size={16} />
                      Copié !
                    </>
                  ) : (
                    <>
                      <Copy size={16} />
                      Copier
                    </>
                  )}
                </button>
              </div>
              {refLinkError && (
                <p className="mt-2 text-sm text-red-700 flex items-start gap-2">
                  <AlertCircle size={14} className="shrink-0 mt-0.5" />
                  <span>{refLinkError}</span>
                </p>
              )}
            </div>

            {/* Message motivant — adapté au stade actuel */}
            <div className="mt-4 rounded-xl bg-gradient-to-r from-rose-100/80 to-amber-100/80 border border-rose-200 p-4">
              <p className="text-sm text-gray-800 leading-relaxed">
                {activeCount === 0 && (
                  <>
                    🌿 <strong>Parrainez 4 collègues</strong> — votre abonnement
                    devient gratuit (20€/mois). <strong>10 collègues</strong> →{' '}
                    50€/mois passifs.
                  </>
                )}
                {activeCount > 0 && remainingForFree > 0 && (
                  <>
                    🌿 Plus que <strong>{remainingForFree} filleule{remainingForFree > 1 ? 's' : ''}</strong>{' '}
                    pour rendre votre abonnement gratuit !
                  </>
                )}
                {activeCount >= 4 && remainingForFifty > 0 && (
                  <>
                    🌟 <strong>Bravo !</strong> Votre abonnement est déjà couvert.
                    Encore <strong>{remainingForFifty}</strong> filleule{remainingForFifty > 1 ? 's' : ''} pour{' '}
                    50€/mois passifs.
                  </>
                )}
                {activeCount >= 10 && activeCount < 20 && (
                  <>
                    🌟 <strong>Incroyable !</strong> Vous générez {monthlyDiscount}€
                    de revenus passifs par mois grâce à votre réseau.
                    Plafond à 20 filleules ({100}€/mois).
                  </>
                )}
                {activeCount >= 20 && (
                  <>
                    🏆 <strong>Plafond atteint</strong> — vous générez le maximum
                    de 100€/mois. Les nouvelles inscriptions via votre lien
                    sont enregistrées mais ne génèrent plus de récompense.
                  </>
                )}
              </p>
            </div>

            {/* Liste des filleules */}
            {referrals.length > 0 && (
              <details className="mt-4 group">
                <summary className="cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900 flex items-center gap-2">
                  <Users size={14} />
                  Mes filleules ({referrals.length})
                  <span className="text-xs text-gray-500">— cliquez pour développer</span>
                </summary>
                <ul className="mt-3 divide-y divide-gray-200 bg-white/80 rounded-xl border border-amber-200 overflow-hidden">
                  {referrals.map(r => (
                    <li key={r.id} className="px-4 py-2.5 flex items-center gap-3 text-sm">
                      <span className="w-8 h-8 rounded-full bg-rose-100 text-rose-700 grid place-items-center font-semibold text-xs">
                        {(r.referredPrenom?.[0] || '?').toUpperCase()}
                      </span>
                      <span className="flex-1 min-w-0 truncate font-medium text-gray-900">
                        {r.referredPrenom || 'Filleule (prénom non disponible)'}
                      </span>
                      <span
                        className={
                          'text-xs font-semibold px-2 py-0.5 rounded-full ' +
                          (r.status === 'active'
                            ? 'bg-green-100 text-green-700'
                            : r.status === 'pending'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-gray-100 text-gray-500')
                        }
                      >
                        {r.status === 'active' ? '✓ Active' : r.status === 'pending' ? 'En attente' : 'Annulée'}
                      </span>
                      <span className="text-xs text-gray-500 hidden sm:inline">
                        {r.status === 'active' && r.activated_at
                          ? `depuis ${new Date(r.activated_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}`
                          : `inscrite ${new Date(r.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}`}
                      </span>
                    </li>
                  ))}
                </ul>
                {cancelledReferrals.length > 0 && (
                  <p className="mt-2 text-xs text-gray-500">
                    {cancelledReferrals.length} filleule{cancelledReferrals.length > 1 ? 's' : ''}{' '}
                    en statut annulé (abonnement résilié).
                  </p>
                )}
              </details>
            )}
          </section>
        )
      })()}

      {/* ============================================================
          Section Connexion extension Chrome HappyNeuron
          L'ancre #extension est ciblée par le popup Chrome (popup.js).
          Visible uniquement si l'utilisatrice est connectée (userLoaded).
          ============================================================ */}
      {userLoaded && (
        <section
          id="extension"
          className="rounded-2xl border border-primary-200 bg-gradient-to-br from-primary-50 to-emerald-50 p-5 sm:p-6"
        >
          <h2 className="text-lg font-semibold text-primary-900 flex items-center gap-2">
            <Camera size={20} className="text-primary-700" />
            Connexion extension Chrome
          </h2>
          <p className="mt-2 text-sm text-gray-700 leading-relaxed">
            Copiez ce token dans l&apos;extension Ortho.ia pour Chrome pour importer
            vos résultats HappyNeuron en 1 clic.
          </p>
          <p className="mt-1 text-xs text-gray-500">
            Pas encore installé l&apos;extension ? Téléchargez le ZIP, décompressez-le
            et ouvrez <code className="px-1 py-0.5 rounded bg-white/70 text-gray-700">INSTALLATION.md</code>{' '}
            — comptez 2 minutes.
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleCopyToken}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition shadow-sm"
            >
              {tokenCopied ? (
                <>
                  <CheckCircle size={18} />
                  Token copié !
                </>
              ) : (
                <>
                  <Copy size={18} />
                  Copier mon token
                </>
              )}
            </button>

            {/* Téléchargement du ZIP de l'extension — bundlé dans /public.
                Installation manuelle "mode développeur" en attendant la
                publication sur le Chrome Web Store. Le ZIP contient un
                INSTALLATION.md avec les étapes step-by-step. */}
            <a
              href="/ortho-ia-extension.zip"
              download="ortho-ia-extension.zip"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-white text-gray-800 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition shadow-sm"
              title="Télécharger l'extension Chrome (ZIP)"
            >
              <Download size={18} />
              Télécharger l&apos;extension
              <span className="text-[10px] uppercase tracking-wider bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
                ZIP
              </span>
            </a>
          </div>

          {tokenError && (
            <p className="mt-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded px-3 py-2 flex items-start gap-2">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <span>{tokenError}</span>
            </p>
          )}

          {tokenCopied && (
            <p className="mt-3 text-sm text-primary-800 bg-white/60 border border-primary-200 rounded px-3 py-2">
              Ouvrez l&apos;extension Ortho.ia dans Chrome, collez le token dans le
              champ de configuration, puis cliquez sur <strong>Enregistrer</strong>.
            </p>
          )}

          <details className="mt-4 text-xs text-gray-600">
            <summary className="cursor-pointer font-medium text-gray-700 hover:text-gray-900">
              À savoir sur ce token
            </summary>
            <ul className="mt-2 space-y-1.5 pl-4 list-disc marker:text-gray-400">
              <li>
                Ce token donne à l&apos;extension le droit d&apos;importer des résultats
                pour <strong>votre compte uniquement</strong>. Ne le partagez avec personne.
              </li>
              <li>
                Il est <strong>valide 1 heure</strong>. Si l&apos;import échoue avec une erreur
                d&apos;authentification, revenez ici et copiez-le à nouveau.
              </li>
              <li>
                Vous pouvez révoquer tous les tokens en vous déconnectant puis vous
                reconnectant.
              </li>
            </ul>
          </details>
        </section>
      )}

      {/* Zone dangereuse RGPD : suppression complète du compte */}
      <div className="mt-10 rounded-2xl border-2 border-red-200 bg-red-50/50 p-5 sm:p-6">
        <h2 className="text-lg font-semibold text-red-900 mb-1 flex items-center gap-2">
          <Trash2 size={18} />
          Zone dangereuse
        </h2>
        <p className="text-sm text-red-800 mb-4">
          Supprimer mon compte efface immédiatement et définitivement l&apos;ensemble de vos données :
          profil, CRBOs, patients, médecins, abonnement, feedbacks. Conformément au RGPD, cette action
          est <strong>irréversible</strong> et ne peut pas être annulée.
        </p>
        <button
          type="button"
          onClick={() => { setShowDeleteModal(true); setDeleteConfirmText(''); setDeleteError('') }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition"
        >
          <Trash2 size={16} />
          Supprimer mon compte
        </button>
      </div>

      {/* Modale confirmation */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <AlertCircle className="text-red-600" size={20} />
              Confirmation requise
            </h3>
            <p className="mt-3 text-sm text-gray-700 leading-relaxed">
              Cette action est <strong>irréversible</strong>. Toutes vos données vont être supprimées
              de manière définitive. Pour confirmer, tapez <code className="px-1.5 py-0.5 rounded bg-gray-100 text-red-700 font-mono">SUPPRIMER</code> ci-dessous.
            </p>
            <input
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="SUPPRIMER"
              className="mt-4 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              autoFocus
            />
            {deleteError && (
              <p className="mt-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded px-3 py-2">
                {deleteError}
              </p>
            )}
            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                disabled={deleting}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg font-medium transition disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                type="button"
                disabled={deleteConfirmText.trim() !== 'SUPPRIMER' || deleting}
                onClick={async () => {
                  setDeleting(true)
                  setDeleteError('')
                  try {
                    const res = await fetch('/api/account/delete', { method: 'POST' })
                    const data = await res.json().catch(() => ({}))
                    if (!res.ok) {
                      throw new Error(data?.error || 'La suppression a échoué.')
                    }
                    // Redirection vers l'accueil — la session est déjà signée out côté serveur.
                    router.push('/?account-deleted=1')
                  } catch (e: any) {
                    setDeleteError(e?.message || 'Erreur inattendue.')
                    setDeleting(false)
                  }
                }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deleting ? (
                  <><Loader2 className="animate-spin" size={16} /> Suppression…</>
                ) : (
                  <><Trash2 size={16} /> Supprimer définitivement</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function ProfilPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-12"><Loader2 className="animate-spin" size={24} /></div>}>
      <ProfilContent />
    </Suspense>
  )
}
