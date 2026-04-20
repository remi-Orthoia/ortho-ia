'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { CLASSES_OPTIONS, TESTS_OPTIONS, TESTS_SCREENING_OPTIONS, CRBOFormData } from '@/lib/types'
import type { CRBOStructure, CRBODomain, CRBOEpreuve } from '@/lib/prompts'
import { downloadCRBOWord } from '@/lib/word-export'
import SessionTimer from '@/components/SessionTimer'
import { 
  ChevronRight, 
  ChevronLeft, 
  Loader2, 
  Upload, 
  Mic, 
  FileText,
  CheckCircle,
  AlertCircle,
  Download,
  Sparkles,
  UserPlus,
  Users,
  FileUp
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
}

const STEPS = [
  { id: 1, name: 'Vos infos', description: 'Coordonnées orthophoniste' },
  { id: 2, name: 'Patient', description: 'Informations patient' },
  { id: 3, name: 'Médecin', description: 'Prescripteur & plaintes' },
  { id: 4, name: 'Anamnèse', description: 'Notes cliniques' },
  { id: 5, name: 'Résultats', description: 'Tests & scores' },
]

const DRAFT_KEY = 'ortho-ia:crbo-draft'

function StepPhaseBadge({ step }: { step: number }) {
  if (step <= 4) {
    return (
      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-medium mb-3">
        📋 En séance
      </div>
    )
  }
  return (
    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-50 border border-purple-200 text-purple-700 text-xs font-medium mb-3">
      🔬 Post-séance
    </div>
  )
}

function NouveauCRBOContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [extracting, setExtracting] = useState(false)
  const [error, setError] = useState('')
  const [generatedCRBO, setGeneratedCRBO] = useState('')
  const [generatedStructure, setGeneratedStructure] = useState<CRBOStructure | null>(null)
  const [showResult, setShowResult] = useState(false)
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null)
  const [nowTick, setNowTick] = useState(0)
  const [importingAnamnese, setImportingAnamnese] = useState(false)
  
  // Patient selection
  const [patients, setPatients] = useState<Patient[]>([])
  const [selectedPatientId, setSelectedPatientId] = useState<string>('')
  const [showNewPatientForm, setShowNewPatientForm] = useState(false)

  const [formData, setFormData] = useState<CRBOFormData>({
    ortho_nom: '',
    ortho_adresse: '',
    ortho_cp: '',
    ortho_ville: '',
    ortho_tel: '',
    ortho_email: '',
    patient_prenom: '',
    patient_nom: '',
    patient_ddn: '',
    patient_classe: '',
    bilan_date: new Date().toISOString().split('T')[0],
    bilan_type: 'initial',
    medecin_nom: '',
    medecin_tel: '',
    motif: '',
    anamnese: '',
    test_utilise: [],
    resultats_manuels: '',
    notes_passation: '',
  })

  // Charger les infos utilisateur et patients au démarrage
  useEffect(() => {
    const loadUserProfile = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()

        if (profile) {
          setFormData(prev => ({
            ...prev,
            ortho_nom: `${profile.prenom} ${profile.nom}`,
            ortho_adresse: profile.adresse || '',
            ortho_cp: profile.code_postal || '',
            ortho_ville: profile.ville || '',
            ortho_tel: profile.telephone || '',
            ortho_email: profile.email || user.email || '',
          }))
        }

        // Charger les patients
        const { data: patientsData } = await supabase
          .from('patients')
          .select('*')
          .eq('user_id', user.id)
          .order('nom', { ascending: true })

        if (patientsData) {
          setPatients(patientsData)
        }

        // Si un patient est passé en URL, le sélectionner
        const patientIdFromUrl = searchParams.get('patient')
        if (patientIdFromUrl && patientsData) {
          const patient = patientsData.find(p => p.id === patientIdFromUrl)
          if (patient) {
            handleSelectPatient(patient)
          }
        }

        // Reprendre un brouillon s'il y en a un
        try {
          const raw = localStorage.getItem(DRAFT_KEY)
          if (raw && !patientIdFromUrl) {
            const draft = JSON.parse(raw) as { step: number; formData: Partial<CRBOFormData> }
            if (draft?.formData) {
              setFormData(prev => ({ ...prev, ...draft.formData }))
              setCurrentStep(draft.step || 1)
            }
          }
        } catch {
          // brouillon corrompu → on l'ignore
        }
      }
    }

    loadUserProfile()
  }, [searchParams])

  const persistDraft = () => {
    try {
      const { audio_file, resultats_pdf, ...serializable } = formData
      // Ne rien sauvegarder si rien n'a été saisi (état initial vide)
      const hasContent =
        serializable.patient_prenom || serializable.patient_nom ||
        serializable.motif || serializable.anamnese || serializable.resultats_manuels
      if (!hasContent) return false
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ step: currentStep, formData: serializable }))
      setLastSavedAt(Date.now())
      return true
    } catch {
      return false
    }
  }

  const handleSaveDraft = () => {
    if (persistDraft()) {
      alert('Brouillon sauvegardé. Vous pourrez le reprendre à votre prochaine connexion.')
      router.push('/dashboard')
    } else {
      setError("Impossible de sauvegarder le brouillon localement.")
    }
  }

  // Auto-save silencieux toutes les 15 secondes
  useEffect(() => {
    if (showResult) return
    const id = setInterval(() => { persistDraft() }, 15_000)
    return () => clearInterval(id)
  }, [formData, currentStep, showResult])

  // Tick 1s pour rafraîchir le "sauvegardé il y a X s"
  useEffect(() => {
    const id = setInterval(() => setNowTick(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])

  const savedAgoLabel = (() => {
    if (!lastSavedAt) return null
    const seconds = Math.max(0, Math.floor((nowTick - lastSavedAt) / 1000))
    if (seconds < 5) return 'à l\'instant'
    if (seconds < 60) return `il y a ${seconds} s`
    const minutes = Math.floor(seconds / 60)
    return `il y a ${minutes} min`
  })()

  const handleImportPreviousAnamnese = async () => {
    if (!formData.patient_prenom || !formData.patient_nom) {
      setError("Renseignez d'abord le patient à l'étape précédente.")
      return
    }
    setImportingAnamnese(true)
    setError('')
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Session expirée')
      const { data, error: dbError } = await supabase
        .from('crbos')
        .select('id, anamnese, bilan_date, structure_json')
        .eq('user_id', user.id)
        .eq('patient_prenom', formData.patient_prenom)
        .eq('patient_nom', formData.patient_nom)
        .order('bilan_date', { ascending: false })
        .limit(1)
        .maybeSingle()
      if (dbError) throw dbError
      if (!data || !data.anamnese) {
        setError(`Aucun bilan précédent trouvé pour ${formData.patient_prenom} ${formData.patient_nom}.`)
        return
      }
      setFormData(prev => ({
        ...prev,
        anamnese: data.anamnese,
        bilan_precedent_id: data.id,
        bilan_precedent_structure: data.structure_json ?? null,
        bilan_precedent_date: data.bilan_date,
      }))
    } catch (e: any) {
      setError(e.message || "Erreur lors de l'import de l'anamnèse.")
    } finally {
      setImportingAnamnese(false)
    }
  }

  const patientAgeLabel = (() => {
    if (!formData.patient_ddn) return ''
    const birth = new Date(formData.patient_ddn)
    const bilan = new Date(formData.bilan_date)
    let years = bilan.getFullYear() - birth.getFullYear()
    let months = bilan.getMonth() - birth.getMonth()
    if (months < 0) { years--; months += 12 }
    return `${years} ans ${months} m`
  })()

  // Sélectionner un patient existant
  const handleSelectPatient = (patient: Patient) => {
    setSelectedPatientId(patient.id)
    setShowNewPatientForm(false)
    setFormData(prev => ({
      ...prev,
      patient_prenom: patient.prenom,
      patient_nom: patient.nom,
      patient_ddn: patient.date_naissance || '',
      patient_classe: patient.classe || '',
      medecin_nom: patient.medecin_nom || prev.medecin_nom,
      medecin_tel: patient.medecin_tel || prev.medecin_tel,
      anamnese: patient.anamnese_base || prev.anamnese,
    }))
  }

  // Réinitialiser pour nouveau patient
  const handleNewPatient = () => {
    setSelectedPatientId('')
    setShowNewPatientForm(true)
    setFormData(prev => ({
      ...prev,
      patient_prenom: '',
      patient_nom: '',
      patient_ddn: '',
      patient_classe: '',
    }))
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleTestChange = (test: string) => {
    setFormData(prev => ({
      ...prev,
      test_utilise: prev.test_utilise.includes(test)
        ? prev.test_utilise.filter(t => t !== test)
        : [...prev.test_utilise, test]
    }))
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'pdf' | 'audio') => {
    const file = e.target.files?.[0]
    if (!file) return

    // Pour le MVP, on stocke juste le fichier localement
    // Dans une version complète, on uploadrait vers Supabase Storage
    if (type === 'pdf') {
      setFormData(prev => ({ ...prev, resultats_pdf: file }))
    } else {
      setFormData(prev => ({ ...prev, audio_file: file }))
    }
  }

  // Extraction des résultats PDF avec Claude Vision
  const handleExtractPDF = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Vérifier le type de fichier
    if (!file.type.includes('pdf') && !file.type.includes('image')) {
      setError('Format non supporté. Utilisez un PDF ou une image (PNG, JPG).')
      return
    }

    setExtracting(true)
    setError('')

    try {
      const formDataUpload = new FormData()
      formDataUpload.append('file', file)

      const response = await fetch('/api/extract-pdf', {
        method: 'POST',
        body: formDataUpload,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de l\'extraction')
      }

      // Mettre à jour les résultats
      setFormData(prev => ({
        ...prev,
        resultats_manuels: data.resultats,
        // Si un test a été détecté, le sélectionner
        test_utilise: data.detectedTest && !prev.test_utilise.includes(data.detectedTest)
          ? [...prev.test_utilise, data.detectedTest]
          : prev.test_utilise
      }))

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de l\'extraction')
    } finally {
      setExtracting(false)
      // Reset l'input pour permettre de réimporter le même fichier
      e.target.value = ''
    }
  }

  const nextStep = () => {
    if (currentStep < 5) {
      setCurrentStep(prev => prev + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1)
    }
  }

  const handleGenerate = async () => {
    // Anti double-click
    if (generating) return

    // Validation taille payload — évite erreurs cryptées côté Claude si énorme
    const payloadSize = JSON.stringify(formData).length
    if (payloadSize > 1_000_000) {
      setError('Les données saisies sont trop volumineuses (> 1 Mo). Résumez votre anamnèse et vos résultats.')
      return
    }

    setGenerating(true)
    setError('')

    try {
      const response = await fetch('/api/generate-crbo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ formData }),
      })

      const data = await response.json()

      if (!response.ok) {
        // Message serveur déjà filtré côté API (pas de fuite). On affiche tel quel.
        throw new Error(data.error || 'Erreur lors de la génération')
      }

      setGeneratedCRBO(data.crbo)
      setGeneratedStructure(data.structure ?? null)
      setShowResult(true)
      try { localStorage.removeItem(DRAFT_KEY) } catch {}

      // ============ Persistance : insert CRBO PUIS increment compteur ============
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        console.error('CRBO généré mais utilisateur non trouvé — non sauvegardé')
        setError('Session expirée — veuillez vous reconnecter pour sauvegarder.')
        return
      }

      const { data: inserted, error: insertError } = await supabase
        .from('crbos')
        .insert({
          user_id: user.id,
          patient_id: selectedPatientId || null, // Lien patient ↔ CRBO
          patient_prenom: formData.patient_prenom,
          patient_nom: formData.patient_nom,
          patient_ddn: formData.patient_ddn,
          patient_classe: formData.patient_classe,
          bilan_date: formData.bilan_date,
          bilan_type: formData.bilan_type,
          medecin_nom: formData.medecin_nom,
          medecin_tel: formData.medecin_tel,
          motif: formData.motif,
          anamnese: formData.anamnese,
          test_utilise: formData.test_utilise.join(', '),
          resultats: formData.resultats_manuels,
          notes_passation: formData.notes_passation,
          crbo_genere: data.crbo,
          structure_json: data.structure ?? null,
          // Nouveaux champs
          comportement_seance: formData.comportement_seance || null,
          duree_seance_minutes: formData.duree_seance_minutes || null,
          severite_globale: data.structure?.severite_globale ?? null,
          bilan_precedent_id: formData.bilan_precedent_id || null,
        })
        .select('id')
        .single()

      if (insertError || !inserted?.id) {
        console.error('Erreur sauvegarde CRBO:', insertError)
        setError('Le CRBO a été généré mais n\'a pas pu être sauvegardé. Copiez-le maintenant et contactez le support.')
        return
      }

      // Le compteur n'est incrémenté que si l'insertion a réussi
      const { error: rpcError } = await supabase.rpc('increment_crbo_count', { user_id: user.id })
      if (rpcError) {
        console.error('CRBO sauvé (id=' + inserted.id + ') mais compteur non incrémenté:', rpcError)
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setGenerating(false)
    }
  }

  const handleDownloadWord = async () => {
    try {
      await downloadCRBOWord({
        formData,
        structure: generatedStructure,
        fallbackCRBO: generatedCRBO,
      })
    } catch (err) {
      console.error('Erreur export Word:', err)
      setError('Erreur lors de la génération du document Word.')
    }
  }

  // Afficher le résultat
  if (showResult) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="bg-green-50 border border-green-200 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <CheckCircle className="text-green-600" size={24} />
            <h2 className="text-xl font-semibold text-green-800">CRBO généré avec succès !</h2>
          </div>
          <p className="text-green-700">
            Votre compte rendu a été généré. Vous pouvez le relire, le modifier si nécessaire, puis le télécharger.
          </p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Aperçu du CRBO</h3>
            <button
              onClick={handleDownloadWord}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm font-medium"
            >
              <Download size={18} />
              Télécharger en Word
            </button>
          </div>
          <div className="p-6">
            <textarea
              value={generatedCRBO}
              onChange={(e) => setGeneratedCRBO(e.target.value)}
              className="w-full h-[600px] p-4 border border-gray-200 rounded-lg font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
        </div>

        <div className="flex gap-4">
          <button
            onClick={() => {
              try { localStorage.removeItem(DRAFT_KEY) } catch {}
              setShowResult(false)
              setGeneratedCRBO('')
              setGeneratedStructure(null)
              setFormData({
                ...formData,
                patient_prenom: '',
                patient_nom: '',
                patient_ddn: '',
                patient_classe: '',
                bilan_date: new Date().toISOString().split('T')[0],
                medecin_nom: '',
                medecin_tel: '',
                motif: '',
                anamnese: '',
                test_utilise: [],
                resultats_manuels: '',
                notes_passation: '',
              })
              setCurrentStep(1)
            }}
            className="flex-1 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition"
          >
            Nouveau CRBO
          </button>
          <button
            onClick={() => router.push('/dashboard/historique')}
            className="flex-1 py-3 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition"
          >
            Voir l'historique
          </button>
        </div>
      </div>
    )
  }

  const patientBannerVisible =
    currentStep >= 2 && currentStep <= 5 &&
    (formData.patient_prenom || formData.patient_nom)

  return (
    <div className="max-w-3xl mx-auto">
      {/* Bandeau patient — rappel du dossier actif */}
      {patientBannerVisible && (
        <div className="mb-4 flex items-center justify-between gap-3 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg px-4 py-2.5">
          <div className="flex items-center gap-2.5 text-sm text-green-900 min-w-0">
            <span aria-hidden>👤</span>
            <span className="font-semibold truncate">
              {formData.patient_prenom} {formData.patient_nom}
            </span>
            {patientAgeLabel && (
              <span className="text-green-700">· {patientAgeLabel}</span>
            )}
            {formData.patient_classe && (
              <span className="text-green-700">· {formData.patient_classe}</span>
            )}
          </div>
          <button
            type="button"
            onClick={() => setCurrentStep(2)}
            className="text-xs font-medium text-green-700 hover:text-green-900 underline decoration-dotted whitespace-nowrap"
          >
            Changer
          </button>
        </div>
      )}

      {/* Progress steps */}
      <nav className="mb-8">
        <ol className="flex items-center">
          {STEPS.map((step, index) => (
            <li key={step.id} className={`flex items-center ${index < STEPS.length - 1 ? 'flex-1' : ''}`}>
              <div className="flex items-center">
                <div className={`
                  w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium
                  ${currentStep > step.id 
                    ? 'bg-green-600 text-white' 
                    : currentStep === step.id 
                      ? 'bg-green-600 text-white' 
                      : 'bg-gray-200 text-gray-600'}
                `}>
                  {currentStep > step.id ? <CheckCircle size={20} /> : step.id}
                </div>
                <span className={`ml-3 text-sm font-medium hidden sm:block ${
                  currentStep >= step.id ? 'text-gray-900' : 'text-gray-500'
                }`}>
                  {step.name}
                </span>
              </div>
              {index < STEPS.length - 1 && (
                <div className={`flex-1 h-0.5 mx-4 ${
                  currentStep > step.id ? 'bg-green-600' : 'bg-gray-200'
                }`} />
              )}
            </li>
          ))}
        </ol>
      </nav>

      {/* Form */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 sm:p-8">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
            <AlertCircle size={20} />
            {error}
          </div>
        )}

        {/* Step 1: Infos orthophoniste */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div>
              <StepPhaseBadge step={1} />
              <h2 className="text-xl font-semibold text-gray-900">Vos coordonnées</h2>
              <p className="mt-1 text-sm text-gray-500">Ces informations apparaîtront sur le CRBO</p>
            </div>

            {(!formData.ortho_nom || !formData.ortho_adresse) && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-900 flex items-start gap-3">
                <AlertCircle size={18} className="shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Profil incomplet</p>
                  <p className="mt-0.5">
                    Complétez vos informations dans <a href="/dashboard/profil" className="underline font-semibold">Mon profil</a> pour les pré-remplir automatiquement à chaque CRBO.
                  </p>
                </div>
              </div>
            )}

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom complet</label>
                <input
                  type="text"
                  name="ortho_nom"
                  value={formData.ortho_nom}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Marie Dupont"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Adresse</label>
                <input
                  type="text"
                  name="ortho_adresse"
                  value={formData.ortho_adresse}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="10 rue des Lilas"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Code postal</label>
                <input
                  type="text"
                  name="ortho_cp"
                  value={formData.ortho_cp}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="75015"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ville</label>
                <input
                  type="text"
                  name="ortho_ville"
                  value={formData.ortho_ville}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Paris"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
                <input
                  type="tel"
                  name="ortho_tel"
                  value={formData.ortho_tel}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="06 12 34 56 78"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  name="ortho_email"
                  value={formData.ortho_email}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="marie.dupont@gmail.com"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Infos patient */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div>
              <StepPhaseBadge step={2} />
              <h2 className="text-xl font-semibold text-gray-900">Informations patient</h2>
              <p className="mt-1 text-sm text-gray-500">Sélectionnez un patient existant ou créez-en un nouveau</p>
            </div>

            {/* Patient Selector */}
            {patients.length > 0 && (
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <Users size={18} />
                  Sélectionner un patient existant
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                  {patients.map(patient => (
                    <button
                      key={patient.id}
                      type="button"
                      onClick={() => handleSelectPatient(patient)}
                      className={`text-left p-3 rounded-lg border-2 transition ${
                        selectedPatientId === patient.id
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                    >
                      <p className="font-medium text-gray-900 text-sm truncate">
                        {patient.prenom} {patient.nom}
                      </p>
                      <p className="text-xs text-gray-500">{patient.classe || 'Classe non définie'}</p>
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={handleNewPatient}
                    className={`p-3 rounded-lg border-2 border-dashed transition flex flex-col items-center justify-center gap-1 ${
                      showNewPatientForm
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-300 hover:border-green-500 hover:bg-green-50'
                    }`}
                  >
                    <UserPlus size={20} className="text-green-600" />
                    <span className="text-xs text-gray-600">Nouveau</span>
                  </button>
                </div>
              </div>
            )}

            {/* Patient Form */}
            <div className="grid sm:grid-cols-2 gap-4">
              {!selectedPatientId && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Prénom *</label>
                    <input
                      type="text"
                      name="patient_prenom"
                      value={formData.patient_prenom}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="Delyss"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nom *</label>
                    <input
                      type="text"
                      name="patient_nom"
                      value={formData.patient_nom}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="Martin"
                    />
                  </div>
                </>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date de naissance *</label>
                <input
                  type="date"
                  name="patient_ddn"
                  value={formData.patient_ddn}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Classe *</label>
                <select
                  name="patient_classe"
                  value={formData.patient_classe}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="">Sélectionner...</option>
                  {CLASSES_OPTIONS.map(classe => (
                    <option key={classe} value={classe}>{classe}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date du bilan *</label>
                <input
                  type="date"
                  name="bilan_date"
                  value={formData.bilan_date}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type de bilan *</label>
                <select
                  name="bilan_type"
                  value={formData.bilan_type}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="initial">Bilan initial</option>
                  <option value="renouvellement">Bilan de renouvellement</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Médecin & Motif */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div>
              <StepPhaseBadge step={3} />
              <h2 className="text-xl font-semibold text-gray-900">Médecin prescripteur & Plaintes</h2>
              <p className="mt-1 text-sm text-gray-500">Informations sur la prescription et plaintes exprimées</p>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom du médecin *</label>
                <input
                  type="text"
                  name="medecin_nom"
                  value={formData.medecin_nom}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Docteur Bernard"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone médecin</label>
                <input
                  type="tel"
                  name="medecin_tel"
                  value={formData.medecin_tel}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="05 63 00 00 00"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Plaintes du patient *</label>
                <textarea
                  name="motif"
                  value={formData.motif}
                  onChange={handleChange}
                  required
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                  placeholder="Difficultés en lecture et en orthographe..."
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Anamnèse */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <div>
              <StepPhaseBadge step={4} />
              <h2 className="text-xl font-semibold text-gray-900">Anamnèse</h2>
              <p className="mt-1 text-sm text-gray-500">Entrez vos notes librement, l'IA les reformulera</p>
            </div>

            {/* Import anamnèse du bilan précédent — uniquement pour un renouvellement sur patient existant */}
            {formData.bilan_type === 'renouvellement' && selectedPatientId && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-emerald-900">Bilan de renouvellement</p>
                  <p className="text-xs text-emerald-700 mt-0.5">
                    Récupérez l'anamnèse du dernier bilan de {formData.patient_prenom} {formData.patient_nom}, puis ajustez-la.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleImportPreviousAnamnese}
                  disabled={importingAnamnese}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-emerald-300 text-emerald-700 rounded-lg text-sm font-medium hover:bg-emerald-100 transition whitespace-nowrap disabled:opacity-60"
                >
                  {importingAnamnese ? (
                    <>
                      <Loader2 className="animate-spin" size={16} />
                      Import en cours…
                    </>
                  ) : (
                    <>📥 Importer l'anamnèse du dernier bilan</>
                  )}
                </button>
              </div>
            )}

            {/* ZONE 1 — Évolution depuis le dernier bilan (renouvellement uniquement) */}
            {formData.bilan_type === 'renouvellement' && (
              <div className="bg-purple-50 border border-purple-200 rounded-xl p-5 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">📊</span>
                  <h3 className="font-semibold text-purple-900">Évolution depuis le dernier bilan</h3>
                </div>
                {formData.bilan_precedent_date ? (
                  <p className="text-xs text-purple-700">
                    Dernier bilan du <strong>{new Date(formData.bilan_precedent_date).toLocaleDateString('fr-FR')}</strong> chargé —
                    Claude comparera les résultats actuels aux précédents pour produire une synthèse d'évolution.
                  </p>
                ) : (
                  <p className="text-xs text-purple-700">
                    Cliquez sur « Importer l'anamnèse du dernier bilan » ci-dessus pour charger aussi les résultats précédents et activer la comparaison automatique.
                  </p>
                )}
                <div>
                  <label className="block text-xs font-medium text-purple-900 mb-1">
                    Vos observations cliniques sur l'évolution
                  </label>
                  <textarea
                    name="evolution_notes"
                    value={formData.evolution_notes || ''}
                    onChange={handleChange}
                    rows={4}
                    placeholder={`Ex : "Progrès notables en lecture depuis la PEC démarrée en mars. Vitesse +40%. Orthographe grammaticale encore fragile. Conscience phonémique bien consolidée. Motivation restaurée."`}
                    className="w-full px-3 py-2 border border-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400 text-sm resize-none bg-white"
                  />
                </div>
              </div>
            )}

            {/* ZONE 2 — Anamnèse de base pré-remplie depuis la fiche patient */}
            {formData.bilan_type === 'renouvellement' && selectedPatientId && (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-slate-700">
                <p className="font-semibold text-slate-900 mb-1">📋 Anamnèse de base (fiche patient)</p>
                <p>
                  L'anamnèse ci-dessous est pré-remplie depuis la fiche patient. Ajustez-la avec les événements survenus depuis le dernier bilan (changements de classe, suivis démarrés/arrêtés, évolution médicale…).
                </p>
              </div>
            )}

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
              <p className="font-medium mb-2">💡 Vous pouvez noter :</p>
              <ul className="list-disc list-inside space-y-1 text-blue-700">
                <li>Fratrie (nombre de frères/sœurs)</li>
                <li>Vision/audition</li>
                <li>Premières acquisitions (marche, premiers mots)</li>
                <li>Suivis antérieurs (psy, psychomot, neuropsy...)</li>
                <li>Parcours scolaire</li>
                <li>Loisirs</li>
              </ul>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes d'anamnèse *</label>
              <textarea
                name="anamnese"
                value={formData.anamnese}
                onChange={handleChange}
                required
                rows={10}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                placeholder="- fratrie : 1 grande sœur et 1 grand frère
- 1ères acquisitions : RAS
- vision/audition : RAS, porte des lunettes (hypermétrope)
- à la maison : il aime jouer avec son chat, construire des cabanes
- autres suivis : bilan psychomot le 3/06/2020...
- scolarité : CP très compliqué (6 maîtresses + confinement)"
              />
            </div>

            {/* Option mémo vocal - désactivé pour le MVP */}
            <div className="opacity-50 pointer-events-none">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ou enregistrez un mémo vocal (bientôt disponible)
              </label>
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  className="flex items-center gap-2 px-4 py-3 border border-gray-300 rounded-lg"
                  disabled
                >
                  <Mic size={20} />
                  Enregistrer
                </button>
              </div>
            </div>

            {/* Sauvegarde brouillon en fin d'étape 4 — fin de la phase "En séance" */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-blue-900">Pause jusqu'à après la séance ?</p>
                <p className="text-xs text-blue-700 mt-0.5">
                  Sauvegardez ce que vous avez saisi. Vous retrouverez tout à votre prochaine connexion.
                </p>
              </div>
              <button
                type="button"
                onClick={handleSaveDraft}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-blue-300 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-100 transition whitespace-nowrap"
              >
                💾 Sauvegarder et reprendre plus tard
              </button>
            </div>
          </div>
        )}

        {/* Step 5: Résultats */}
        {currentStep === 5 && (
          <div className="space-y-6">
            <div>
              <StepPhaseBadge step={5} />
              <h2 className="text-xl font-semibold text-gray-900">Résultats des tests</h2>
              <p className="mt-1 text-sm text-gray-500">Sélectionnez les tests utilisés et entrez les résultats</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tests utilisés *</label>

              {/* Screening préalable — à proposer AVANT le bilan complet */}
              <div className="mb-3 rounded-lg border border-amber-200 bg-amber-50 p-3">
                <p className="text-xs font-semibold text-amber-800 uppercase tracking-wide mb-2">
                  Screening préalable · adulte / senior
                </p>
                <p className="text-xs text-amber-700 mb-3">
                  À proposer <strong>avant</strong> un bilan complet pour orienter les épreuves ciblées.
                </p>
                <div className="grid sm:grid-cols-2 gap-2">
                  {TESTS_SCREENING_OPTIONS.map(test => (
                    <label
                      key={test}
                      className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition bg-white ${
                        formData.test_utilise.includes(test)
                          ? 'border-amber-500 ring-2 ring-amber-200'
                          : 'border-amber-200 hover:border-amber-400'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={formData.test_utilise.includes(test)}
                        onChange={() => handleTestChange(test)}
                        className="w-4 h-4 text-amber-600 border-gray-300 rounded focus:ring-amber-500"
                      />
                      <span className="text-sm text-gray-700 font-medium">{test}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Bilans complets */}
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Bilans complets
              </p>
              <div className="grid sm:grid-cols-2 gap-2">
                {TESTS_OPTIONS.filter(t => !(TESTS_SCREENING_OPTIONS as readonly string[]).includes(t)).map(test => (
                  <label
                    key={test}
                    className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition ${
                      formData.test_utilise.includes(test)
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={formData.test_utilise.includes(test)}
                      onChange={() => handleTestChange(test)}
                      className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                    />
                    <span className="text-sm text-gray-700">{test}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Résultats (scores) *
              </label>
              <p className="text-xs text-gray-500 mb-3">
                Importez un PDF de résultats ou entrez-les manuellement
              </p>
              
              {/* Bouton Import PDF */}
              <div className="mb-3">
                <label 
                  className={`inline-flex items-center gap-2 px-4 py-2.5 border-2 border-dashed rounded-lg cursor-pointer transition ${
                    extracting 
                      ? 'border-green-400 bg-green-50 text-green-700' 
                      : 'border-green-500 bg-green-50 text-green-700 hover:bg-green-100'
                  }`}
                >
                  {extracting ? (
                    <>
                      <Loader2 className="animate-spin" size={18} />
                      <span className="text-sm font-medium">Extraction en cours...</span>
                    </>
                  ) : (
                    <>
                      <FileUp size={18} />
                      <span className="text-sm font-medium">📄 Importer PDF résultats</span>
                    </>
                  )}
                  <input
                    type="file"
                    accept=".pdf,image/*"
                    onChange={handleExtractPDF}
                    disabled={extracting}
                    className="hidden"
                  />
                </label>
                <span className="ml-3 text-xs text-gray-400">PDF ou image (Exalang, EVALO, ELO...)</span>
              </div>

              {/* Message d'erreur */}
              {error && (
                <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 text-sm">
                  <AlertCircle size={16} />
                  {error}
                </div>
              )}

              <textarea
                name="resultats_manuels"
                value={formData.resultats_manuels}
                onChange={handleChange}
                required
                rows={12}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 resize-none font-mono text-sm"
                placeholder="Empan auditif endroit : 3/7, É-T : -2.11, P5
Empan auditif envers : 3/6, É-T : -0.79, Q3 (P75)
Métaphonologie - traitement syllabique : 5/11, É-T : -3.32, P5
Lecture de mots (score) : 15/100, É-T : -6.62, P5
..."
              />
              
              {formData.resultats_manuels && (
                <p className="mt-2 text-xs text-green-600 flex items-center gap-1">
                  <CheckCircle size={14} />
                  {formData.resultats_manuels.split('\n').filter(l => l.trim()).length} résultats détectés
                </p>
              )}
            </div>

            {/* Comportement en séance — observations structurées */}
            <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">🧠</span>
                <div>
                  <p className="font-semibold text-indigo-900 text-sm">Comportement en séance</p>
                  <p className="text-xs text-indigo-700">Cochez les observations, précisez au besoin — injecté dans le prompt</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {[
                  'Coopératif·ve',
                  'Fatigabilité notée',
                  'Anxiété / tension',
                  'Stratégies d\'évitement',
                  'Autocorrections',
                  'Découragement',
                  'Attention fluctuante',
                  'Motivation soutenue',
                  'Auto-dévalorisation',
                  'Persévérance',
                ].map(tag => {
                  const active = (formData.comportement_seance || '').includes(tag)
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => {
                        const current = formData.comportement_seance || ''
                        const tags = current.split(' · ').filter(Boolean)
                        const next = active
                          ? tags.filter(t => t !== tag).join(' · ')
                          : [...tags, tag].join(' · ')
                        setFormData(prev => ({ ...prev, comportement_seance: next }))
                      }}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${
                        active
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'bg-white text-indigo-700 border border-indigo-200 hover:border-indigo-400'
                      }`}
                    >
                      {tag}
                    </button>
                  )
                })}
              </div>

              <textarea
                value={formData.comportement_seance || ''}
                onChange={e => setFormData(prev => ({ ...prev, comportement_seance: e.target.value }))}
                rows={2}
                placeholder="Précisez librement (ex : 'Pleurs sur la dictée, réconfort efficace, rebondit bien après une pause de 3 min.')"
                className="w-full px-3 py-2 border border-indigo-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm resize-none bg-white"
              />
            </div>

            {/* Chronomètre de séance — facturation */}
            <SessionTimer
              durationMinutes={formData.duree_seance_minutes}
              onChange={(minutes) => setFormData(prev => ({ ...prev, duree_seance_minutes: minutes }))}
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes de passation (optionnel)
              </label>
              <textarea
                name="notes_passation"
                value={formData.notes_passation}
                onChange={handleChange}
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                placeholder="Nombre de séances passées, matériel utilisé, adaptations..."
              />
            </div>
          </div>
        )}

        {/* Indicateur d'auto-save */}
        {savedAgoLabel && (
          <div className="mt-6 text-xs text-gray-400 flex items-center justify-end gap-1.5">
            <span aria-hidden>💾</span>
            <span>Sauvegardé {savedAgoLabel}</span>
          </div>
        )}

        {/* Navigation buttons */}
        <div className="flex justify-between mt-4 pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={prevStep}
            disabled={currentStep === 1}
            className="flex items-center gap-2 px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft size={20} />
            Précédent
          </button>

          {currentStep < 5 ? (
            <button
              type="button"
              onClick={nextStep}
              className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition"
            >
              Suivant
              <ChevronRight size={20} />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleGenerate}
              disabled={generating || !formData.test_utilise.length || !formData.resultats_manuels}
              className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {generating ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  Génération en cours...
                </>
              ) : (
                <>
                  <Sparkles size={20} />
                  Générer le CRBO
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// Wrapper with Suspense for useSearchParams
export default function NouveauCRBOPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center py-12">
        <Loader2 className="animate-spin h-8 w-8 text-green-600" />
      </div>
    }>
      <NouveauCRBOContent />
    </Suspense>
  )
}
