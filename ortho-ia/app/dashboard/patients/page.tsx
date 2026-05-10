'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { useToast } from '@/components/Toast'
import {
  Plus,
  Search,
  User,
  Calendar,
  Phone,
  FileText,
  Edit,
  Trash2,
  X,
  Loader2,
  ChevronRight,
  School,
  TrendingUp
} from 'lucide-react'

interface Patient {
  id: string
  prenom: string
  nom: string
  date_naissance: string
  classe: string
  ecole: string
  medecin_nom: string
  medecin_tel: string
  anamnese_base: string
  notes: string
  created_at: string
  // Computed
  crbos_count?: number
}

export default function PatientsPage() {
  const router = useRouter()
  const toast = useToast()
  const [patients, setPatients] = useState<Patient[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null)
  const [saving, setSaving] = useState(false)

  const [formData, setFormData] = useState({
    prenom: '',
    nom: '',
    date_naissance: '',
    classe: '',
    ecole: '',
    medecin_nom: '',
    medecin_tel: '',
    anamnese_base: '',
    notes: '',
  })

  useEffect(() => {
    fetchPatients()
  }, [])

  const fetchPatients = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      router.push('/auth/login')
      return
    }

    // Récupérer les patients
    const { data: patientsData } = await supabase
      .from('patients')
      .select('*')
      .eq('user_id', user.id)
      .order('nom', { ascending: true })

    if (patientsData) {
      // Compter les CRBO par patient
      const patientsWithCount = await Promise.all(
        patientsData.map(async (patient) => {
          const { count } = await supabase
            .from('crbos')
            .select('*', { count: 'exact', head: true })
            .eq('patient_id', patient.id)
          
          return { ...patient, crbos_count: count || 0 }
        })
      )
      setPatients(patientsWithCount)
    }

    setLoading(false)
  }

  const handleOpenModal = (patient?: Patient) => {
    if (patient) {
      setEditingPatient(patient)
      setFormData({
        prenom: patient.prenom,
        nom: patient.nom,
        date_naissance: patient.date_naissance || '',
        classe: patient.classe || '',
        ecole: patient.ecole || '',
        medecin_nom: patient.medecin_nom || '',
        medecin_tel: patient.medecin_tel || '',
        anamnese_base: patient.anamnese_base || '',
        notes: patient.notes || '',
      })
    } else {
      setEditingPatient(null)
      setFormData({
        prenom: '',
        nom: '',
        date_naissance: '',
        classe: '',
        ecole: '',
        medecin_nom: '',
        medecin_tel: '',
        anamnese_base: '',
        notes: '',
      })
    }
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingPatient(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // ============ Validations client ============
    // 1. Nom + prénom ne peuvent pas être uniquement des espaces (le HTML
    //    `required` accepte "   " — on doit valider en JS).
    const prenom = (formData.prenom || '').trim()
    const nom = (formData.nom || '').trim()
    if (!prenom || !nom) {
      toast.error('Le prénom et le nom sont obligatoires.')
      return
    }
    // 2. Date de naissance future = saisie incohérente.
    if (formData.date_naissance) {
      const ddn = new Date(formData.date_naissance)
      if (!isNaN(ddn.getTime()) && ddn.getTime() > Date.now()) {
        toast.error('La date de naissance ne peut pas être dans le futur.')
        return
      }
    }
    // 3. Téléphone médecin : si renseigné, doit ressembler à un numéro
    //    (chiffres, espaces, tirets, parenthèses, +). Le regex est laxiste
    //    pour accepter formats français + internationaux + extensions.
    if (formData.medecin_tel && !/^[\d\s\-+().]+$/.test(formData.medecin_tel)) {
      toast.error('Le téléphone du médecin contient des caractères invalides.')
      return
    }

    setSaving(true)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      setSaving(false)
      toast.error('Session expirée — reconnectez-vous.')
      return
    }

    // Trim systématique avant insert/update — évite les espaces parasites
    // dans la DB (et les recherches qui ne matchent plus).
    const cleanData = {
      ...formData,
      prenom,
      nom,
      classe: (formData.classe || '').trim() || null,
      ecole: (formData.ecole || '').trim() || null,
      medecin_nom: (formData.medecin_nom || '').trim() || null,
      medecin_tel: (formData.medecin_tel || '').trim() || null,
      anamnese_base: (formData.anamnese_base || '').trim() || null,
      notes: (formData.notes || '').trim() || null,
    }

    let saveError: any = null
    if (editingPatient) {
      const { error } = await supabase
        .from('patients')
        .update(cleanData)
        .eq('id', editingPatient.id)
        .eq('user_id', user.id)
      saveError = error
    } else {
      const { error } = await supabase
        .from('patients')
        .insert({ ...cleanData, user_id: user.id })
      saveError = error
    }

    setSaving(false)
    if (saveError) {
      console.error('Erreur sauvegarde patient:', saveError)
      toast.error("Impossible d'enregistrer le patient. Réessayez.")
      return
    }
    toast.success(editingPatient ? 'Patient mis à jour.' : 'Patient enregistré.')
    handleCloseModal()
    fetchPatients()
  }

  const handleDelete = async (patientId: string) => {
    if (!confirm('Supprimer ce patient ? Les CRBO associés ne seront pas supprimés.')) return

    const supabase = createClient()
    // user_id explicite + .select() pour confirmer la suppression effective —
    // sinon une session expirée peut faire disparaître le patient de l'UI
    // sans qu'il soit vraiment supprimé en base.
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      toast.error('Session expirée — reconnectez-vous.')
      return
    }
    const { data: deleted, error } = await supabase
      .from('patients')
      .delete()
      .eq('id', patientId)
      .eq('user_id', user.id)
      .select('id')
    if (error || !deleted || deleted.length === 0) {
      console.error('Erreur suppression patient:', error)
      toast.error("La suppression n'a pas pu être enregistrée. Réessayez.")
      return
    }
    setPatients(prev => prev.filter(p => p.id !== patientId))
    toast.success('Patient supprimé.')
  }

  const calculateAge = (ddn: string) => {
    if (!ddn) return ''
    const birth = new Date(ddn)
    if (isNaN(birth.getTime())) return ''
    const now = new Date()
    if (birth.getTime() > now.getTime()) return '' // DDN dans le futur = saisie incohérente
    let years = now.getFullYear() - birth.getFullYear()
    const months = now.getMonth() - birth.getMonth()
    if (months < 0 || (months === 0 && now.getDate() < birth.getDate())) years--
    if (years < 0) return ''
    return `${years} ans`
  }

  const filteredPatients = patients.filter(p => 
    `${p.prenom} ${p.nom}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.classe?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.ecole?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="animate-spin h-8 w-8 text-green-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Carnet patients</h1>
          <p className="text-gray-500 mt-1">{patients.length} patient{patients.length > 1 ? 's' : ''} enregistré{patients.length > 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium shadow-sm"
        >
          <Plus size={20} />
          Nouveau patient
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
        <input
          type="text"
          placeholder="Rechercher un patient..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
        />
      </div>

      {/* Patient List */}
      {filteredPatients.length === 0 ? (
        <div className="card-modern p-10 text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-900/30 dark:to-indigo-800/30 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-card">
            <User className="text-indigo-600 dark:text-indigo-400" size={36} />
          </div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
            {searchQuery ? 'Aucun patient trouvé' : 'Votre carnet de patients est vide'}
          </h3>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto">
            {searchQuery
              ? `Aucun résultat pour "${searchQuery}". Essayez un autre terme.`
              : "Ajoutez vos patients ici pour retrouver leurs infos à chaque CRBO : prénom, nom, date de naissance, médecin, anamnèse de base."}
          </p>
          {!searchQuery && (
            <button
              onClick={() => handleOpenModal()}
              className="btn-primary mt-6"
            >
              <Plus size={16} />
              Ajouter mon premier patient
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Patient</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">Classe</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">Médecin</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CRBO</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredPatients.map((patient) => (
                  <tr key={patient.id} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-4">
                      <Link href={`/dashboard/patients/${patient.id}`} className="flex items-center gap-3 hover:opacity-80">
                        <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                          <span className="text-indigo-600 font-medium">
                            {(patient.prenom?.[0] || '?').toUpperCase()}{(patient.nom?.[0] || '').toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 hover:text-indigo-700">{patient.prenom} {patient.nom}</p>
                          <p className="text-sm text-gray-500">{calculateAge(patient.date_naissance)}</p>
                        </div>
                      </Link>
                    </td>
                    <td className="px-4 py-4 hidden md:table-cell">
                      <div className="flex items-center gap-1.5 text-gray-600">
                        <School size={14} />
                        <span>{patient.classe || '-'}</span>
                      </div>
                      {patient.ecole && (
                        <p className="text-sm text-gray-400">{patient.ecole}</p>
                      )}
                    </td>
                    <td className="px-4 py-4 hidden lg:table-cell">
                      {patient.medecin_nom ? (
                        <div>
                          <p className="text-gray-900">{patient.medecin_nom}</p>
                          {patient.medecin_tel && (
                            <p className="text-sm text-gray-500 flex items-center gap-1">
                              <Phone size={12} />
                              {patient.medecin_tel}
                            </p>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                        <FileText size={14} />
                        {patient.crbos_count || 0}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/dashboard/patients/${patient.id}`}
                          className="p-2 hover:bg-indigo-50 rounded-lg transition"
                          title="Timeline du patient"
                        >
                          <TrendingUp size={18} className="text-indigo-600" />
                        </Link>
                        <Link
                          href={`/dashboard/nouveau-crbo?patient=${patient.id}`}
                          className="p-2 hover:bg-green-50 rounded-lg transition"
                          title="Nouveau CRBO"
                        >
                          <Plus size={18} className="text-green-600" />
                        </Link>
                        <button
                          onClick={() => handleOpenModal(patient)}
                          className="p-2 hover:bg-gray-100 rounded-lg transition"
                          title="Modifier"
                        >
                          <Edit size={18} className="text-gray-500" />
                        </button>
                        <button
                          onClick={() => handleDelete(patient.id)}
                          className="p-2 hover:bg-red-50 rounded-lg transition"
                          title="Supprimer"
                        >
                          <Trash2 size={18} className="text-red-500" />
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

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            {/* Backdrop */}
            <div 
              className="fixed inset-0 bg-black/50 transition-opacity" 
              onClick={handleCloseModal}
            />

            {/* Modal */}
            <div className="relative bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              {/* Header */}
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">
                  {editingPatient ? 'Modifier le patient' : 'Nouveau patient'}
                </h2>
                <button
                  onClick={handleCloseModal}
                  className="p-2 hover:bg-gray-100 rounded-lg transition"
                >
                  <X size={20} className="text-gray-500" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                {/* Identité */}
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                    <User size={16} />
                    Identité
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Prénom *</label>
                      <input
                        type="text"
                        required
                        value={formData.prenom}
                        onChange={(e) => setFormData({ ...formData, prenom: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                        placeholder="Emma"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Nom *</label>
                      <input
                        type="text"
                        required
                        value={formData.nom}
                        onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                        placeholder="Dupont"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Date de naissance</label>
                      <input
                        type="date"
                        value={formData.date_naissance}
                        onChange={(e) => setFormData({ ...formData, date_naissance: e.target.value })}
                        max={new Date().toISOString().split('T')[0]}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Classe</label>
                      <input
                        type="text"
                        value={formData.classe}
                        onChange={(e) => setFormData({ ...formData, classe: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                        placeholder="CE2"
                      />
                    </div>
                  </div>
                  <div className="mt-4">
                    <label className="block text-sm text-gray-600 mb-1">École</label>
                    <input
                      type="text"
                      value={formData.ecole}
                      onChange={(e) => setFormData({ ...formData, ecole: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="École primaire Jean Jaurès"
                    />
                  </div>
                </div>

                {/* Médecin */}
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                    <Phone size={16} />
                    Médecin prescripteur
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Nom du médecin</label>
                      <input
                        type="text"
                        value={formData.medecin_nom}
                        onChange={(e) => setFormData({ ...formData, medecin_nom: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                        placeholder="Dr Martin"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Téléphone</label>
                      <input
                        type="text"
                        value={formData.medecin_tel}
                        onChange={(e) => setFormData({ ...formData, medecin_tel: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                        placeholder="01 23 45 67 89"
                      />
                    </div>
                  </div>
                </div>

                {/* Anamnèse de base */}
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                    <FileText size={16} />
                    Anamnèse de base
                  </h3>
                  <textarea
                    value={formData.anamnese_base}
                    onChange={(e) => setFormData({ ...formData, anamnese_base: e.target.value })}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="- fratrie : ...&#10;- 1ères acquisitions : ...&#10;- vision/audition : ...&#10;- scolarité : ..."
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Ces informations seront pré-remplies lors de la création d'un nouveau CRBO.
                  </p>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Notes (privées)</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Notes personnelles sur le patient..."
                  />
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition font-medium"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium disabled:opacity-50 flex items-center gap-2"
                  >
                    {saving && <Loader2 className="animate-spin" size={18} />}
                    {editingPatient ? 'Enregistrer' : 'Créer le patient'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
