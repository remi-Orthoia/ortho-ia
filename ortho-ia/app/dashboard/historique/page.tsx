'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { FileText, Download, Trash2, Search, Calendar } from 'lucide-react'

export default function HistoriquePage() {
  const [crbos, setCrbos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    const fetchCRBOs = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) return

      const { data } = await supabase
        .from('crbos')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (data) {
        setCrbos(data)
      }
      setLoading(false)
    }

    fetchCRBOs()
  }, [])

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce CRBO ?')) return

    const supabase = createClient()
    const { error } = await supabase
      .from('crbos')
      .delete()
      .eq('id', id)

    if (!error) {
      setCrbos(crbos.filter(c => c.id !== id))
    }
  }

  const handleDownload = async (crbo: any) => {
    try {
      const { downloadCRBOWord } = await import('@/lib/word-export')
      await downloadCRBOWord({
        formData: {
          ortho_nom: crbo.ortho_nom,
          ortho_adresse: crbo.ortho_adresse,
          ortho_cp: crbo.ortho_cp,
          ortho_ville: crbo.ortho_ville,
          ortho_tel: crbo.ortho_tel,
          ortho_email: crbo.ortho_email,
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
      })
    } catch (err) {
      console.error('Erreur export Word historique:', err)
      alert("Erreur lors de la génération du document Word. Réessayez ou contactez le support.")
    }
  }

  const filteredCRBOs = crbos.filter(crbo => {
    const search = searchTerm.toLowerCase()
    return (
      crbo.patient_prenom.toLowerCase().includes(search) ||
      crbo.patient_nom.toLowerCase().includes(search) ||
      crbo.test_utilise?.toLowerCase().includes(search)
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
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="text-gray-400" size={32} />
          </div>
          <p className="text-gray-500">
            {searchTerm ? 'Aucun CRBO trouvé' : 'Aucun CRBO généré pour le moment'}
          </p>
          {!searchTerm && (
            <Link 
              href="/dashboard/nouveau-crbo"
              className="mt-4 inline-block text-green-600 hover:text-green-700 font-medium"
            >
              Créer votre premier CRBO
            </Link>
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
                            {crbo.patient_prenom[0]}{crbo.patient_nom[0]}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {crbo.patient_prenom} {crbo.patient_nom}
                          </div>
                          <div className="text-sm text-gray-500">
                            {crbo.patient_classe}
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
                          className="p-2 text-gray-400 hover:text-green-600 transition"
                          title="Télécharger"
                        >
                          <Download size={18} />
                        </button>
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
