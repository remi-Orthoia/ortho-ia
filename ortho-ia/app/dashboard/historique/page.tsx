'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { FileText, Download, Trash2, Search, Calendar, Loader2, FileDown } from 'lucide-react'
import { useToast } from '@/components/Toast'
import { playSwoosh } from '@/lib/sounds'

export default function HistoriquePage() {
  const toast = useToast()
  const [crbos, setCrbos] = useState<any[]>([])
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  // Map CRBO ID → true si un download Word est en cours pour cette ligne.
  // Évite : (1) les double-clics qui lancent 2 downloads, (2) ortho qui ne sait
  // pas si elle a cliqué (la génération Word peut prendre 1-3s sur gros CRBOs).
  const [downloading, setDownloading] = useState<Record<string, boolean>>({})

  useEffect(() => {
    const fetchCRBOs = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) return

      // Charger le profil en parallèle (pour injection ortho_* au download Word)
      const [crbosRes, profileRes] = await Promise.all([
        supabase
          .from('crbos')
          .select('*')
          .eq('user_id', user.id)
          .order('bilan_date', { ascending: false, nullsFirst: false })
          .order('created_at', { ascending: false }),
        supabase.from('profiles').select('*').eq('id', user.id).single(),
      ])

      if (crbosRes.data) setCrbos(crbosRes.data)
      if (profileRes.data) setProfile(profileRes.data)
      setLoading(false)
    }

    fetchCRBOs()
  }, [])

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce CRBO ?')) return

    const supabase = createClient()
    // user_id explicite + .select() pour ne retirer de l'UI que si la ligne
    // a vraiment été supprimée (sinon RLS masque un échec et l'ortho voit le
    // CRBO disparaître alors qu'il existe encore en base).
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      toast.error('Session expirée — reconnectez-vous.')
      return
    }
    const { data: deleted, error } = await supabase
      .from('crbos')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)
      .select('id')

    if (error || !deleted || deleted.length === 0) {
      console.error('Erreur suppression CRBO:', error)
      toast.error("La suppression n'a pas pu être enregistrée. Réessayez.")
      return
    }
    setCrbos(crbos.filter(c => c.id !== id))
    toast.success('CRBO supprimé.')
  }

  const handleDownload = async (crbo: any) => {
    // Anti double-clic + feedback visuel pendant la génération du Word.
    if (downloading[crbo.id]) return
    setDownloading(prev => ({ ...prev, [crbo.id]: true }))
    try {
      const { downloadCRBOWord } = await import('@/lib/word-export')
      // Si c'est un renouvellement avec un bilan précédent lié, on charge sa structure
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
      // Les infos ortho (nom, adresse, tel, email) ne sont pas persistées dans
      // les CRBO — on les récupère du profil courant au moment du download.
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
          patient_ddn: crbo.patient_ddn,
          patient_classe: crbo.patient_classe,
          bilan_date: crbo.bilan_date,
          bilan_type: crbo.bilan_type,
          medecin_nom: crbo.medecin_nom,
          medecin_tel: crbo.medecin_tel,
          motif: crbo.motif,
          test_utilise: crbo.test_utilise ? String(crbo.test_utilise).split(',').map((t: string) => t.trim()) : [],
          resultats_manuels: crbo.resultats,
        },
        structure: crbo.structure_json ?? null,
        fallbackCRBO: crbo.crbo_genere || '',
        previousStructure,
        previousBilanDate,
      })
      playSwoosh() // feedback sonore "document sort"

      // Promotion kanban : si le CRBO est resté en "à rédiger", un download
      // Word le fait passer en "à relire". On ne régresse jamais un statut
      // déjà avancé (a_relire ou termine).
      if (crbo.statut === 'a_rediger' || crbo.statut === 'en_cours') {
        const supabase = createClient()
        const { error: statusErr } = await supabase
          .from('crbos')
          .update({ statut: 'a_relire' })
          .eq('id', crbo.id)
        if (statusErr) {
          console.warn('Promotion statut a_relire échouée (best-effort):', statusErr)
        } else {
          setCrbos(prev => prev.map(c => c.id === crbo.id ? { ...c, statut: 'a_relire' } : c))
        }
      }
    } catch (err) {
      console.error('Erreur export Word historique:', err)
      toast.error("Erreur lors de la génération du document Word. Réessayez ou contactez le support.")
    } finally {
      setDownloading(prev => {
        const { [crbo.id]: _, ...rest } = prev
        return rest
      })
    }
  }

  const filteredCRBOs = crbos.filter(crbo => {
    const search = searchTerm.toLowerCase().trim()
    if (!search) return true
    // Null-safe : un CRBO legacy peut avoir patient_prenom/nom à null
    // (saisie incomplète, import). Sans `?.`, .toLowerCase() crashait
    // toute la liste — l'ortho voyait "Aucun CRBO" alors qu'elle en avait.
    return (
      (crbo.patient_prenom?.toLowerCase() ?? '').includes(search) ||
      (crbo.patient_nom?.toLowerCase() ?? '').includes(search) ||
      (crbo.test_utilise?.toLowerCase() ?? '').includes(search) ||
      (crbo.patient_classe?.toLowerCase() ?? '').includes(search)
    )
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Historique des CRBO</h1>
          <p className="mt-1 text-gray-600">{crbos.length} compte(s) rendu(s) généré(s)</p>
        </div>
        <Link
          href="/dashboard/nouveau-crbo"
          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium"
        >
          <FileText size={20} />
          Nouveau CRBO
        </Link>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Rechercher par nom de patient ou test..."
          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
        />
      </div>

      {/* List */}
      {loading ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
        </div>
      ) : filteredCRBOs.length === 0 ? (
        <div className="card-modern p-10 text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-900/30 dark:to-primary-800/30 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-card">
            <FileText className="text-primary-600 dark:text-primary-400" size={36} />
          </div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
            {searchTerm ? 'Aucun CRBO trouvé' : 'Aucun CRBO généré pour le moment'}
          </h3>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto">
            {searchTerm
              ? `Aucun résultat pour "${searchTerm}". Essayez un autre terme ou réinitialisez la recherche.`
              : "Lancez votre premier bilan : import PDF de résultats, génération automatique en ~20 secondes, export Word professionnel avec graphiques."}
          </p>
          {!searchTerm && (
            <Link
              href="/dashboard/nouveau-crbo"
              className="btn-primary mt-6"
            >
              <FileText size={16} />
              Créer mon premier CRBO
            </Link>
          )}
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="btn-secondary mt-6"
            >
              Réinitialiser la recherche
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Patient
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Test
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredCRBOs.map((crbo) => (
                  <tr key={crbo.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                          <span className="text-green-600 font-semibold">
                            {(crbo.patient_prenom?.[0] || '?').toUpperCase()}{(crbo.patient_nom?.[0] || '').toUpperCase()}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {crbo.patient_prenom} {crbo.patient_nom}
                          </div>
                          <div className="text-sm text-gray-500">
                            {crbo.patient_classe || '—'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">{crbo.test_utilise || '-'}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-500">
                        <Calendar size={16} className="mr-2" />
                        {new Date(crbo.created_at).toLocaleDateString('fr-FR')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        crbo.bilan_type === 'initial' 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-purple-100 text-purple-800'
                      }`}>
                        {crbo.bilan_type === 'initial' ? 'Initial' : 'Renouvellement'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleDownload(crbo)}
                          disabled={!!downloading[crbo.id]}
                          className="p-2 text-gray-400 hover:text-green-600 transition disabled:opacity-50 disabled:cursor-wait"
                          title={downloading[crbo.id] ? 'Génération en cours…' : 'Télécharger en Word'}
                          aria-label={downloading[crbo.id] ? 'Génération du Word en cours' : 'Télécharger le CRBO en Word'}
                        >
                          {downloading[crbo.id]
                            ? <Loader2 size={18} className="animate-spin" />
                            : <Download size={18} />}
                        </button>
                        <a
                          href={`/dashboard/historique/${crbo.id}/print`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 text-gray-400 hover:text-blue-600 transition"
                          title="Exporter en PDF (via aperçu d'impression)"
                          aria-label="Exporter le CRBO en PDF"
                        >
                          <FileDown size={18} />
                        </a>
                        <button
                          onClick={() => handleDelete(crbo.id)}
                          className="p-2 text-gray-400 hover:text-red-600 transition"
                          title="Supprimer"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
