'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { Loader2, Save, CheckCircle, AlertCircle, Trash2 } from 'lucide-react'

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
      setLoading(false)
    }

    loadProfile()
  }, [])

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
