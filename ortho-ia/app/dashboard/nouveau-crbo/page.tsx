'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { CLASSES_OPTIONS, TESTS_OPTIONS, TESTS_SCREENING_OPTIONS, CRBOFormData } from '@/lib/types'
import type { CRBOStructure, CRBODomain, CRBOEpreuve } from '@/lib/prompts'
import { downloadCRBOWord } from '@/lib/word-export'
import StepProgress from '@/components/StepProgress'
import GenerationLoader from '@/components/GenerationLoader'
import Tooltip from '@/components/Tooltip'
import ConfettiBurst from '@/components/ConfettiBurst'
import CRBOStructuredPreview from '@/components/CRBOStructuredPreview'
import ShareCRBOButton from '@/components/ShareCRBOButton'
import { playSuccessSound } from '@/lib/success-sound'
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
  { id: 3, name: 'Médecin', description: 'Prescripteur & motif' },
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
  const [showPreviewModal, setShowPreviewModal] = useState(false)
  const [confettiTrigger, setConfettiTrigger] = useState(0)
  const [savedCrboId, setSavedCrboId] = useState<string | null>(null)
  const [isFirstCRBO, setIsFirstCRBO] = useState(false)
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

  // Raccourci clavier Cmd/Ctrl + Entrée pour générer depuis l'étape 5
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (
        (e.metaKey || e.ctrlKey) &&
        e.key === 'Enter' &&
        currentStep === 5 &&
        !generating &&
        !showResult &&
        formData.test_utilise.length > 0 &&
        formData.resultats_manuels
      ) {
        e.preventDefault()
        handleGenerate()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep, generating, showResult, formData.test_utilise, formData.resultats_manuels])

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
      // Extraction de l'anamnèse rédigée (prose) depuis la structure JSON si dispo,
      // sinon fallback sur les notes brutes.
      const anamneseRedigee = data.structure_json?.anamnese_redigee || ''
      setFormData(prev => ({
        ...prev,
        anamnese: data.anamnese,
        bilan_precedent_id: data.id,
        bilan_precedent_structure: data.structure_json ?? null,
        bilan_precedent_date: data.bilan_date,
        bilan_precedent_anamnese: anamneseRedigee,
        // Pré-remplissage éléments stables : anamnèse précédente (ortho peut éditer)
        elements_stables: prev.elements_stables || anamneseRedigee || data.anamnese,
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

  // Auto-load du bilan précédent dès que renouvellement + patient existant confirmés
  useEffect(() => {
    if (
      formData.bilan_type === 'renouvellement' &&
      selectedPatientId &&
      !formData.bilan_precedent_id &&
      formData.patient_prenom && formData.patient_nom &&
      !importingAnamnese
    ) {
      handleImportPreviousAnamnese()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.bilan_type, selectedPatientId, formData.patient_prenom, formData.patient_nom])

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

    // En mode renouvellement : construit l'anamnèse à partir des éléments stables + évolutions
    // (les deux textes, clairement séparés, sont envoyés à Claude qui saura distinguer)
    const formDataForSubmission = { ...formData }
    if (formData.bilan_type === 'renouvellement' && selectedPatientId) {
      const stables = (formData.elements_stables || '').trim()
      const evolutions = (formData.evolution_notes || '').trim()
      if (!evolutions) {
        setError('Renseignez les évolutions depuis le dernier bilan avant de générer.')
        return
      }
      // Concaténation structurée pour que Claude comprenne les deux parties
      formDataForSubmission.anamnese = [
        stables && `[ÉLÉMENTS STABLES DE L'ANAMNÈSE]\n${stables}`,
        `[ÉVOLUTIONS DEPUIS LE DERNIER BILAN]\n${evolutions}`,
      ].filter(Boolean).join('\n\n')
    }

    setGenerating(true)
    setError('')

    try {
      const response = await fetch('/api/generate-crbo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ formData: formDataForSubmission }),
      })

      const data = await response.json()

      if (!response.ok) {
        // Session expirée : on sauvegarde le brouillon + redirige login avec retour
        if (response.status === 401) {
          persistDraft()
          setError('Session expirée. Votre saisie est sauvegardée, vous serez redirigé·e vers la page de connexion.')
          setTimeout(() => {
            router.push(`/auth/login?redirect=${encodeURIComponent('/dashboard/nouveau-crbo')}`)
          }, 2500)
          return
        }
        // Message serveur déjà filtré côté API (pas de fuite). On affiche tel quel.
        throw new Error(data.error || 'Erreur lors de la génération')
      }

      setGeneratedCRBO(data.crbo)
      setGeneratedStructure(data.structure ?? null)
      setShowResult(true)
      // 🎉 Moment de satisfaction
      setConfettiTrigger(c => c + 1)
      playSuccessSound()
      try {
        localStorage.removeItem(DRAFT_KEY)
      } catch {}

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
      setSavedCrboId(inserted.id)

      // Détection : est-ce le tout premier CRBO de l'ortho ?
      const { count } = await supabase
        .from('crbos')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
      if (count === 1) setIsFirstCRBO(true)

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
        previousStructure: formData.bilan_precedent_structure ?? null,
        previousBilanDate: formData.bilan_precedent_date,
      })
    } catch (err) {
      console.error('Erreur export Word:', err)
      setError('Erreur lors de la génération du document Word.')
    }
  }

  // Afficher le résultat
  if (showResult) {
    return (
      <>
        <ConfettiBurst trigger={confettiTrigger} />
        <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
          {/* Bandeau succès — version enrichie pour le 1er CRBO */}
          {isFirstCRBO ? (
            <div className="bg-gradient-to-br from-primary-100 via-emerald-50 to-amber-50 dark:from-primary-900/30 dark:via-emerald-900/20 dark:to-amber-900/20 border-2 border-primary-300 dark:border-primary-700 rounded-2xl p-6 sm:p-8 shadow-card-lg">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 text-white flex items-center justify-center shadow-lg animate-check-bounce shrink-0">
                  <Sparkles size={26} />
                </div>
                <div className="flex-1">
                  <p className="text-xs uppercase tracking-wider font-bold text-amber-700 dark:text-amber-400">
                    🎉 Votre premier CRBO est prêt
                  </p>
                  <h2 className="mt-1 text-2xl font-bold text-primary-900 dark:text-primary-200">
                    Félicitations !
                  </h2>
                  <p className="mt-2 text-primary-800 dark:text-primary-300 leading-relaxed">
                    Vous venez de gagner environ 45 minutes sur la rédaction de ce CRBO. Relisez le
                    brouillon, ajustez si besoin, puis téléchargez le Word. Il sera retrouvable à tout
                    moment dans votre historique.
                  </p>
                  <p className="mt-3 text-sm text-primary-700 dark:text-primary-300">
                    💡 <strong>Astuce :</strong>{' '}
                    <a href="/dashboard/profil" className="underline font-semibold">
                      Complétez votre profil
                    </a>{' '}
                    pour que vos coordonnées soient pré-remplies dans tous les prochains CRBO.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-gradient-to-br from-primary-50 to-emerald-50 dark:from-primary-900/20 dark:to-emerald-900/20 border border-primary-200 dark:border-primary-800/40 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-full bg-primary-600 text-white flex items-center justify-center shadow-lg animate-check-bounce">
                  <CheckCircle size={22} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-primary-900 dark:text-primary-200">
                    CRBO généré avec succès !
                  </h2>
                  <p className="text-sm text-primary-700 dark:text-primary-300">
                    Relisez le brouillon ci-dessous, ajustez si besoin, puis téléchargez le Word final.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Prévisualisation structurée */}
          {generatedStructure ? (
            <>
              <ShareCRBOButton crboId={savedCrboId} />
              <CRBOStructuredPreview
                structure={generatedStructure}
                onDownload={handleDownloadWord}
                onPreview={() => setShowPreviewModal(true)}
                onEdit={() => {
                  // Toggle vers textarea brut — l'ortho peut éditer si besoin
                  setGeneratedStructure(null)
                }}
              />
            </>
          ) : (
            <div className="card-lifted overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-surface-dark-muted flex items-center justify-between">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">Texte éditable du CRBO</h3>
                <button onClick={handleDownloadWord} className="btn-primary">
                  <Download size={16} />
                  Télécharger en Word
                </button>
              </div>
              <div className="p-6">
                <textarea
                  value={generatedCRBO}
                  onChange={(e) => setGeneratedCRBO(e.target.value)}
                  className="textarea-modern w-full h-[600px] font-mono text-sm"
                />
              </div>
            </div>
          )}

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
            className="flex-1 py-3 bg-gray-900 dark:bg-surface-dark-muted text-white rounded-lg font-medium hover:bg-gray-800 dark:hover:bg-surface-dark transition"
          >
            Voir l&apos;historique
          </button>
        </div>
        </div>

        {/* Modal Prévisualisation plein écran — rendu focalisé avant téléchargement Word */}
        {showPreviewModal && generatedStructure && (
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
                    Prévisualisation du CRBO
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
                  structure={generatedStructure}
                  onDownload={async () => {
                    await handleDownloadWord()
                    setShowPreviewModal(false)
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </>
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

      {/* Progress bar moderne */}
      <StepProgress
        currentStep={currentStep}
        onStepClick={(step) => setCurrentStep(step)}
      />

      {/* Overlay pendant génération Claude */}
      <GenerationLoader visible={generating} />

      {/* Form */}
      <div className="card-lifted p-6 sm:p-8">
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
            {/* Bandeau info renouvellement sur patient existant */}
            {formData.bilan_type === 'renouvellement' && selectedPatientId && (
              <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800/40 rounded-lg p-4 mb-2">
                <div className="flex items-start gap-2">
                  <span className="text-xl">🔄</span>
                  <div>
                    <p className="font-semibold text-purple-900 dark:text-purple-200 text-sm">
                      Bilan de renouvellement — patient déjà connu
                    </p>
                    <p className="text-xs text-purple-700 dark:text-purple-300 mt-0.5">
                      Les informations patient sont verrouillées (nom, prénom, date de naissance) — seule la classe peut évoluer entre deux bilans.
                    </p>
                  </div>
                </div>
              </div>
            )}

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
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date de naissance *
                  {formData.bilan_type === 'renouvellement' && selectedPatientId && (
                    <span className="ml-1 text-xs text-gray-400">🔒 verrouillé</span>
                  )}
                </label>
                <input
                  type="date"
                  name="patient_ddn"
                  value={formData.patient_ddn}
                  onChange={handleChange}
                  required
                  readOnly={formData.bilan_type === 'renouvellement' && !!selectedPatientId}
                  className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 ${
                    formData.bilan_type === 'renouvellement' && selectedPatientId
                      ? 'bg-gray-50 dark:bg-surface-dark-muted text-gray-600 cursor-not-allowed'
                      : ''
                  }`}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Classe *
                  {formData.bilan_type === 'renouvellement' && selectedPatientId && (
                    <span className="ml-1 text-xs text-purple-600 dark:text-purple-400">✏️ modifiable</span>
                  )}
                </label>
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
              <h2 className="text-xl font-semibold text-gray-900">Médecin prescripteur & Motif</h2>
              <p className="mt-1 text-sm text-gray-500">Informations sur la prescription et motif de consultation</p>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Motif de consultation *</label>
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
              <h2 className="text-xl font-semibold text-gray-900">
                {formData.bilan_type === 'renouvellement' && selectedPatientId ? '📊 Évolution depuis le dernier bilan' : 'Anamnèse'}
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                {formData.bilan_type === 'renouvellement' && selectedPatientId
                  ? 'Notez ce qui a changé depuis le dernier bilan — les éléments stables sont déjà pré-remplis.'
                  : "Entrez vos notes librement, l'IA les reformulera en prose professionnelle."}
              </p>
            </div>

            {/* ============ MODE RENOUVELLEMENT sur patient connu ============ */}
            {formData.bilan_type === 'renouvellement' && selectedPatientId ? (
              <>
                {importingAnamnese && (
                  <div className="flex items-center gap-2 text-sm text-purple-600">
                    <Loader2 className="animate-spin" size={16} />
                    Chargement du bilan précédent…
                  </div>
                )}

                {/* Bloc 1 : Anamnèse initiale — lecture seule */}
                {formData.bilan_precedent_anamnese && (
                  <div className="bg-slate-50 dark:bg-surface-dark-subtle border border-slate-200 dark:border-surface-dark-muted rounded-xl p-5">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-semibold text-slate-900 dark:text-slate-100 text-sm flex items-center gap-1.5">
                        <span>📚</span>
                        Anamnèse initiale
                      </p>
                      {formData.bilan_precedent_date && (
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          Bilan du {new Date(formData.bilan_precedent_date).toLocaleDateString('fr-FR')}
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed max-h-40 overflow-y-auto whitespace-pre-line">
                      {formData.bilan_precedent_anamnese}
                    </div>
                    <p className="mt-2 text-xs text-slate-500 dark:text-slate-500 italic">
                      🔒 Lecture seule — réinjectée automatiquement dans le prompt pour contexte.
                    </p>
                  </div>
                )}

                {/* Bloc 2 : Évolutions depuis le dernier bilan */}
                <div className="bg-gradient-to-br from-purple-50 to-fuchsia-50 dark:from-purple-900/20 dark:to-fuchsia-900/20 border border-purple-200 dark:border-purple-800/40 rounded-xl p-5 space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">📊</span>
                    <h3 className="font-semibold text-purple-900 dark:text-purple-200">
                      Évolutions depuis le dernier bilan *
                    </h3>
                  </div>
                  <p className="text-xs text-purple-700 dark:text-purple-300">
                    Notez ici ce qui a bougé depuis le {formData.bilan_precedent_date ? new Date(formData.bilan_precedent_date).toLocaleDateString('fr-FR') : 'dernier bilan'}. Pas besoin de tout réécrire.
                  </p>
                  <textarea
                    name="evolution_notes"
                    value={formData.evolution_notes || ''}
                    onChange={handleChange}
                    rows={8}
                    required
                    placeholder={`• Changement de classe / établissement ?
• Évolution des difficultés signalées par l'enseignant·e ?
• Nouveaux suivis mis en place (neuropsy, psy, psychomot…) ?
• Évolution loisirs, vie familiale, événements marquants ?
• Ressenti de l'enfant et de la famille sur la prise en charge ?
• Adaptation du PAP/PPS en cours ?`}
                    className="w-full px-3 py-3 border border-purple-200 dark:border-purple-800/40 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400 text-sm resize-none bg-white dark:bg-surface-dark-subtle leading-relaxed"
                  />
                </div>

                {/* Bloc 3 : Éléments stables à conserver (pré-rempli, éditable) */}
                <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/40 rounded-xl p-5 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">📋</span>
                    <h3 className="font-semibold text-emerald-900 dark:text-emerald-200">
                      Éléments stables à conserver
                    </h3>
                  </div>
                  <p className="text-xs text-emerald-700 dark:text-emerald-300">
                    Reprise de l&apos;anamnèse du bilan précédent. Modifiez uniquement si des éléments doivent être actualisés (suivis terminés, santé, etc.).
                  </p>
                  <textarea
                    name="elements_stables"
                    value={formData.elements_stables || ''}
                    onChange={handleChange}
                    rows={6}
                    className="w-full px-3 py-3 border border-emerald-200 dark:border-emerald-800/40 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-400 text-sm resize-none bg-white dark:bg-surface-dark-subtle leading-relaxed"
                  />
                </div>

                {/* Champ caché anamnese — on le remplit à la soumission avec une concat */}
              </>
            ) : (
              <>
                {/* ============ MODE BILAN INITIAL ============ */}
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes d&apos;anamnèse *</label>
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
              </>
            )}

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
              title="Raccourci : Ctrl+Entrée (Cmd+Entrée sur Mac)"
              className="btn-primary py-3 px-6 group relative"
            >
              {generating ? (
                <>
                  <Loader2 className="animate-spin" size={18} />
                  Génération…
                </>
              ) : (
                <>
                  <Sparkles size={18} />
                  <span>Générer le CRBO</span>
                  <kbd className="hidden lg:inline-flex items-center gap-0.5 ml-1 px-1.5 py-0.5 bg-white/20 rounded text-[10px] font-mono">
                    ⌘↵
                  </kbd>
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
