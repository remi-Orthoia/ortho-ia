'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { Loader2, Save, CheckCircle, AlertCircle, Trash2, Copy, Camera, Download } from 'lucide-react'

function ProfilContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
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
      }
      setUserLoaded(true)
      setLoading(false)
    }

    loadProfile()
  }, [])

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
    
    if (!user) return

    const { error } = await supabase
      .from('profiles')
      .update({
        prenom: profile.prenom,
        nom: profile.nom,
        adresse: profile.adresse,
        code_postal: profile.code_postal,
        ville: profile.ville,
        telephone: profile.telephone,
      })
      .eq('id', user.id)

    setSaving(false)
    if (!error) {
      setSaved(true)
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
