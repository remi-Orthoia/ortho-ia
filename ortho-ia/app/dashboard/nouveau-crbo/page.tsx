'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { CLASSES_OPTIONS, CLASSES_GROUPS, TESTS_OPTIONS, TESTS_SCREENING_OPTIONS, CRBOFormData } from '@/lib/types'
import type { CRBOStructure, CRBODomain, CRBOEpreuve } from '@/lib/prompts'
import { downloadCRBOWord } from '@/lib/word-export'
import StepProgress from '@/components/StepProgress'
import GenerationLoader from '@/components/GenerationLoader'
import AutoSaveIndicator from '@/components/AutoSaveIndicator'
import SnippetTextarea from '@/components/SnippetTextarea'
import Tooltip from '@/components/Tooltip'
import ConfettiBurst from '@/components/ConfettiBurst'
import CRBOStructuredPreview from '@/components/CRBOStructuredPreview'
import ShareCRBOButton from '@/components/ShareCRBOButton'
import MicButton from '@/components/MicButton'
import MocaScoresInput from '@/components/forms/MocaScoresInput'
import BetlScoresInput from '@/components/forms/BetlScoresInput'
import PredimemScoresInput from '@/components/forms/PredimemScoresInput'
import ExamathScoresInput from '@/components/forms/ExamathScoresInput'
import { useToast } from '@/components/Toast'
import { useFocusMode } from '@/components/FocusMode'
import { playPrintAnimation } from '@/components/PrintAnimation'
import { playSuccessSound, playDing, playSwoosh } from '@/lib/sounds'
import { 
  ChevronRight, 
  ChevronLeft, 
  Loader2, 
  Upload,
  FileText,
  CheckCircle,
  AlertCircle,
  Download,
  FileDown,
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

interface Medecin {
  id: string
  prenom: string | null
  nom: string
  specialite: string | null
  telephone: string | null
  ville: string | null
  code_postal: string | null
  usage_count: number
}

const STEPS = [
  { id: 1, name: 'Patient', description: 'Informations patient' },
  { id: 2, name: 'Médecin', description: 'Prescripteur & motif' },
  { id: 3, name: 'Anamnèse', description: 'Notes cliniques' },
  { id: 4, name: 'Résultats', description: 'Tests & scores' },
]
const TOTAL_STEPS = STEPS.length

const DRAFT_KEY = 'ortho-ia:crbo-draft'

/** Motifs de consultation proposés en multi-sélection à l'étape 2.
 *  Le LLM reformule la sélection en 1-2 phrases fluides via la règle
 *  motif_reformule du system-base. */
const MOTIF_OPTIONS = ['Langage oral', 'Langage écrit', 'Cognitif', 'OMF'] as const

/** Parse la chaîne `formData.motif` en tableau d'options sélectionnées.
 *  La chaîne est de la forme "Langage oral, Cognitif". Tolère les espaces
 *  superflus et filtre les valeurs hors MOTIF_OPTIONS (compat ancienne saisie
 *  libre — un CRBO sauvegardé avec un motif libre rendra simplement aucun chip
 *  sélectionné, sans planter). */
function parseMotif(motif: string): string[] {
  if (!motif) return []
  return motif
    .split(',')
    .map((s) => s.trim())
    .filter((s): s is (typeof MOTIF_OPTIONS)[number] =>
      (MOTIF_OPTIONS as readonly string[]).includes(s),
    )
}

function StepPhaseBadge({ step }: { step: number }) {
  // Steps 1-3 = en séance (Patient, Médecin, Anamnèse)
  // Step 4 = post-séance (Résultats)
  if (step <= 3) {
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
  const toast = useToast()
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)

  // Mode focus auto sur l'étape Anamnèse (étape 3 du form actuel). Cache la
  // sidebar + header + bouton feedback, centre la zone d'édition. L'ortho
  // entre en "écriture profonde". Désactivé dès qu'elle change d'étape.
  useFocusMode(currentStep === 3)
  const [extracting, setExtracting] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [generatedCRBO, setGeneratedCRBO] = useState('')
  const [generatedStructure, setGeneratedStructure] = useState<CRBOStructure | null>(null)
  const [showResult, setShowResult] = useState(false)
  const [showPreviewModal, setShowPreviewModal] = useState(false)
  const [confettiTrigger, setConfettiTrigger] = useState(0)
  const [savedCrboId, setSavedCrboId] = useState<string | null>(null)
  const [isFirstCRBO, setIsFirstCRBO] = useState(false)
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null)
  // État éphémère pour afficher "Sauvegarde…" pendant 600ms quand persistDraft
  // s'exécute — donne un feedback visible sur l'auto-save toutes les 15s.
  const [savingFlash, setSavingFlash] = useState(false)
  const [nowTick, setNowTick] = useState(0)
  const [importingAnamnese, setImportingAnamnese] = useState(false)
  const [prefillBanner, setPrefillBanner] = useState<string>('')

  // Upload bilan initial EXTERNE (PDF/Word rédigé en dehors d'ortho-ia).
  // Utilisé en renouvellement quand aucun CRBO interne n'est trouvé pour
  // ce patient. L'extraction côté serveur peuple bilan_precedent_structure.
  const [uploadingPreviousBilan, setUploadingPreviousBilan] = useState(false)
  const [previousBilanFilename, setPreviousBilanFilename] = useState<string | null>(null)

  // Patient selection
  const [patients, setPatients] = useState<Patient[]>([])
  const [selectedPatientId, setSelectedPatientId] = useState<string>('')
  const [showNewPatientForm, setShowNewPatientForm] = useState(false)

  // Médecins (banque)
  const [medecins, setMedecins] = useState<Medecin[]>([])
  const [medecinSearch, setMedecinSearch] = useState('')
  const [selectedMedecinId, setSelectedMedecinId] = useState<string>('')
  const [showNewMedecinForm, setShowNewMedecinForm] = useState(false)
  const [newMedecin, setNewMedecin] = useState({
    prenom: '', nom: '', specialite: '', telephone: '', ville: '', code_postal: '',
  })
  const [savingMedecin, setSavingMedecin] = useState(false)
  const [profileChecked, setProfileChecked] = useState(false)

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
    notes_analyse: '',
    format_crbo: 'complet',
  })

  // Charger les infos utilisateur et patients au démarrage
  useEffect(() => {
    const loadUserProfile = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      // Profil incomplet → redirige vers /dashboard/profil avec message.
      // On exige nom + adresse a minima : sans ça le CRBO Word n'aura pas
      // d'en-tête orthophoniste utilisable.
      const isProfileComplete =
        profile &&
        profile.prenom?.trim() &&
        profile.nom?.trim() &&
        profile.adresse?.trim() &&
        profile.code_postal?.trim() &&
        profile.ville?.trim() &&
        profile.telephone?.trim()

      if (!isProfileComplete) {
        router.push('/dashboard/profil?incomplete=1')
        return
      }

      setFormData(prev => ({
        ...prev,
        ortho_nom: `${profile.prenom} ${profile.nom}`.trim(),
        ortho_adresse: profile.adresse || '',
        ortho_cp: profile.code_postal || '',
        ortho_ville: profile.ville || '',
        ortho_tel: profile.telephone || '',
        ortho_email: profile.email || user.email || '',
      }))
      setProfileChecked(true)

      // Charger les patients
      const { data: patientsData } = await supabase
        .from('patients')
        .select('*')
        .eq('user_id', user.id)
        .order('nom', { ascending: true })

      if (patientsData) {
        setPatients(patientsData)
      }

      // Charger les médecins (banque) — triés par fréquence d'utilisation décroissante
      const { data: medecinsData } = await supabase
        .from('medecins')
        .select('id, prenom, nom, specialite, telephone, ville, code_postal, usage_count')
        .eq('user_id', user.id)
        .order('usage_count', { ascending: false })
        .order('nom', { ascending: true })

      if (medecinsData) {
        setMedecins(medecinsData as Medecin[])
      }

      // Si un patient est passé en URL, le sélectionner
      const patientIdFromUrl = searchParams.get('patient')
      if (patientIdFromUrl && patientsData) {
        const patient = patientsData.find(p => p.id === patientIdFromUrl)
        if (patient) {
          handleSelectPatient(patient)
        }
      }

      // ============ One-click renouvellement ============
      // Si ?renouvellement=<crbo_id> est passé (depuis la fiche patient,
      // bouton "Refaire un bilan"), on charge le CRBO précédent et on
      // pré-remplit toute la fiche : bilan_type, lien bilan_precedent_*,
      // médecin, anamnèse stable, etc. L'ortho atterrit directement à
      // l'étape Anamnèse (3) où elle ajuste les évolutions.
      const renouvellementId = searchParams.get('renouvellement')
      const isRenouvellement = !!renouvellementId

      // ============ Voice command prefill ============
      // Si ?voice=1 est passé (depuis VoiceCommandButton sur le dashboard),
      // on lit le payload de sessionStorage et on pré-remplit le form.
      const isVoiceCommand = searchParams.get('voice') === '1'
      let voiceVerb: 'voice' | null = null
      if (isVoiceCommand) {
        try {
          const raw = sessionStorage.getItem('orthoia.voice-prefill')
          if (raw) {
            const v = JSON.parse(raw) as {
              patient_prenom?: string | null
              patient_nom?: string | null
              patient_classe?: string | null
              bilan_type?: 'initial' | 'renouvellement' | null
              motif?: string | null
              tests_utilises?: string[]
            }
            setFormData(prev => ({
              ...prev,
              patient_prenom: v.patient_prenom || prev.patient_prenom,
              patient_nom: v.patient_nom || prev.patient_nom,
              patient_classe: v.patient_classe || prev.patient_classe,
              bilan_type: v.bilan_type || prev.bilan_type || 'initial',
              motif: v.motif || prev.motif,
              test_utilise: Array.isArray(v.tests_utilises) && v.tests_utilises.length > 0
                ? v.tests_utilises
                : prev.test_utilise,
            }))
            // Démarrage à l'étape 1 (Patient) pour permettre à l'ortho de
            // valider/corriger les infos extraites avant d'aller plus loin.
            setCurrentStep(1)
            voiceVerb = 'voice'
            // Nettoyage : on consomme le prefill une seule fois
            sessionStorage.removeItem('orthoia.voice-prefill')
            setPrefillBanner('🎤 Commande vocale interprétée — vérifiez et complétez si besoin.')
          }
        } catch (e) {
          console.warn('Voice prefill failed:', e)
        }
      }

      // Reprendre un brouillon s'il y en a un
      // Skippé si on charge un prefill (les résultats arrivent du screenshot,
      // pas le brouillon) OU un renouvellement OU une commande vocale
      // (les données viennent de Whisper+IA, on n'écrase pas).
      const prefillIdFromUrl = searchParams.get('prefill')
      try {
        const raw = localStorage.getItem(DRAFT_KEY)
        if (raw && !patientIdFromUrl && !prefillIdFromUrl && !isRenouvellement && !isVoiceCommand) {
          const draft = JSON.parse(raw) as { step: number; formData: Partial<CRBOFormData> }
          if (draft?.formData) {
            setFormData(prev => ({ ...prev, ...draft.formData }))
            setCurrentStep(draft.step || 1)
          }
        }
      } catch {
        // brouillon corrompu → on l'ignore
      }

      // Pré-remplissage renouvellement : on charge le CRBO précédent en
      // best-effort. Si le fetch échoue, l'ortho voit juste un form normal
      // avec bilan_type=renouvellement (toujours préférable à 0 prefill).
      if (renouvellementId) {
        try {
          const { data: prevCrbo } = await supabase
            .from('crbos')
            .select('id, bilan_date, anamnese, structure_json, medecin_nom, medecin_tel, motif, patient_classe, test_utilise')
            .eq('id', renouvellementId)
            .eq('user_id', user.id)
            .maybeSingle()

          if (prevCrbo) {
            const prevStructure = prevCrbo.structure_json as CRBOStructure | null
            const anamneseRedigee = prevStructure?.anamnese_redigee || ''
            // Tests : si le bilan précédent avait des tests, on les recoche
            // (l'ortho refera probablement les mêmes).
            const prevTests = typeof prevCrbo.test_utilise === 'string'
              ? prevCrbo.test_utilise.split(',').map((t: string) => t.trim()).filter(Boolean)
              : []
            setFormData(prev => ({
              ...prev,
              bilan_type: 'renouvellement',
              bilan_precedent_id: prevCrbo.id,
              bilan_precedent_structure: prevStructure,
              bilan_precedent_date: prevCrbo.bilan_date,
              bilan_precedent_anamnese: anamneseRedigee,
              elements_stables: prev.elements_stables || anamneseRedigee || prevCrbo.anamnese || '',
              anamnese: prev.anamnese || prevCrbo.anamnese || '',
              medecin_nom: prev.medecin_nom || prevCrbo.medecin_nom || '',
              medecin_tel: prev.medecin_tel || prevCrbo.medecin_tel || '',
              motif: prev.motif || prevCrbo.motif || '',
              patient_classe: prev.patient_classe || prevCrbo.patient_classe || '',
              // Pré-coche les tests du bilan précédent (l'ortho décoche si besoin).
              test_utilise: prev.test_utilise.length > 0 ? prev.test_utilise : prevTests,
            }))
            // Atterrir directement à l'étape Anamnèse — patient + médecin
            // déjà pré-remplis, l'ortho édite directement les évolutions.
            setCurrentStep(3)
            setPrefillBanner(
              `🔄 Renouvellement pré-rempli depuis le bilan du ${new Date(prevCrbo.bilan_date).toLocaleDateString('fr-FR')}. ` +
              `Vous pouvez ajuster l'anamnèse et passer aux résultats.`,
            )
          }
        } catch (e) {
          console.warn('Renouvellement prefill failed:', e)
        }
      }

      // Prefill depuis une session screenshot HappyNeuron
      // (?prefill=<uuid> posé par l'extension Chrome)
      if (prefillIdFromUrl) {
        const { data: session } = await supabase
          .from('prefill_sessions')
          .select('id, data, expires_at')
          .eq('id', prefillIdFromUrl)
          .single()

        const expired = session?.expires_at && new Date(session.expires_at).getTime() < Date.now()
        if (session && session.data && !expired) {
          const prefill = session.data as {
            structure?: { test_name?: string | null }
            resultats?: string
            detectedTest?: string | null
          }
          const detected = prefill.detectedTest || prefill.structure?.test_name || null
          const matchedTest = detected && (TESTS_OPTIONS as readonly string[]).includes(detected)
            ? detected
            : null

          setFormData(prev => ({
            ...prev,
            resultats_manuels: prefill.resultats || prev.resultats_manuels,
            test_utilise: matchedTest && !prev.test_utilise.includes(matchedTest)
              ? [...prev.test_utilise, matchedTest]
              : prev.test_utilise,
          }))
          setCurrentStep(4) // étape résultats
          setPrefillBanner(
            matchedTest
              ? `📸 Résultats importés depuis HappyNeuron — test "${matchedTest}" coché automatiquement.`
              : detected
                ? `📸 Résultats importés depuis HappyNeuron — test détecté "${detected}" (à cocher manuellement, non reconnu dans la liste).`
                : '📸 Résultats importés depuis HappyNeuron — pensez à cocher le test correspondant.',
          )

          // On nettoie l'URL pour éviter de re-charger au refresh
          router.replace('/dashboard/nouveau-crbo')
        }
      }
    }

    loadUserProfile()
  }, [searchParams, router])

  const persistDraft = () => {
    try {
      const { audio_file, resultats_pdf, ...serializable } = formData
      // Ne rien sauvegarder si rien n'a été saisi (état initial vide)
      const hasContent =
        serializable.patient_prenom || serializable.patient_nom ||
        serializable.motif || serializable.anamnese || serializable.resultats_manuels
      if (!hasContent) return false
      // Flash "Sauvegarde…" pendant ~500ms pour confirmer visuellement chaque
      // tick d'auto-save (toutes les 15s). Sans ça, l'ortho n'a aucun feedback
      // que sa frappe est sécurisée.
      setSavingFlash(true)
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ step: currentStep, formData: serializable }))
      setLastSavedAt(Date.now())
      setTimeout(() => setSavingFlash(false), 500)
      return true
    } catch {
      setSavingFlash(false)
      return false
    }
  }

  const handleSaveDraft = () => {
    if (persistDraft()) {
      toast.success('Brouillon sauvegardé. Vous pourrez le reprendre à votre prochaine connexion.')
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
        currentStep === 4 &&
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

  // Upload bilan initial EXTERNE (PDF / Word). Appelle /api/extract-previous-bilan,
  // récupère la structure JSON et la pose dans formData.bilan_precedent_structure
  // pour que le pipeline de génération + le rendu Word comparatif la consomment.
  const handleUploadPreviousBilan = async (file: File) => {
    if (!file) return
    setError('')
    if (file.size > 10 * 1024 * 1024) {
      setError('Fichier trop volumineux (max 10 Mo).')
      return
    }
    const lname = file.name.toLowerCase()
    const isPdf = file.type.includes('pdf') || lname.endsWith('.pdf')
    const isDocx = lname.endsWith('.docx') || lname.endsWith('.doc')
    if (!isPdf && !isDocx) {
      setError('Format non supporté. Importez un PDF ou un document Word (.docx).')
      return
    }
    setUploadingPreviousBilan(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      if (selectedPatientId) fd.append('patient_id', selectedPatientId)
      const res = await fetch('/api/extract-previous-bilan', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) {
        setError(data?.error || 'Erreur lors de l\'extraction du bilan précédent.')
        return
      }
      const ex = data.extracted as {
        bilan_date: string
        anamnese_redigee?: string
        domains: any[]
        diagnostic: string
        amenagements?: string[]
      }
      // Conversion vers une CRBOStructure complète (le rendu Word et le prompt
      // de génération en attendent une — recommandations / conclusion vides).
      const reconstructed: CRBOStructure = {
        anamnese_redigee: ex.anamnese_redigee || '',
        domains: ex.domains || [],
        diagnostic: ex.diagnostic || '',
        recommandations: '',
        conclusion: '',
        pap_suggestions: ex.amenagements || [],
      }
      const isoDate = ex.bilan_date && /^\d{4}-\d{2}-\d{2}$/.test(ex.bilan_date) ? ex.bilan_date : ''
      setFormData(prev => ({
        ...prev,
        bilan_precedent_structure: reconstructed,
        bilan_precedent_date: isoDate || prev.bilan_precedent_date,
        bilan_precedent_anamnese: ex.anamnese_redigee || prev.bilan_precedent_anamnese,
        // Pré-remplit les éléments stables avec le résumé d'anamnèse extrait,
        // l'ortho peut éditer librement ensuite.
        elements_stables: prev.elements_stables || ex.anamnese_redigee || '',
      }))
      setPreviousBilanFilename(file.name)
      // Si la route signale une sous-extraction probable (peu d'épreuves
      // pour le test détecté), on remonte l'avertissement à l'ortho via
      // le bandeau notice — elle peut alors retenter ou ajuster avant de
      // générer le CRBO de renouvellement (sinon les épreuves manquantes
      // ressortiraient à tort en "✦ Nouvelle" dans la table comparative).
      if (data.warning) {
        setNotice(`⚠ ${data.warning}`)
      } else {
        setNotice('')
      }
    } catch (e: any) {
      setError(e?.message || "Erreur lors de l'extraction du bilan précédent.")
    } finally {
      setUploadingPreviousBilan(false)
    }
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

  /** Normalise un nom de médecin pour comparaison : minuscules, accents
   *  retirés, espaces compactés, préfixes "Dr"/"Docteur" ignorés. Évite
   *  qu'"Dr. Bernard" ne matche pas "Docteur Bernard" dans la banque. */
  const normalizeMedecinName = (s: string) =>
    s
      .toLowerCase()
      .normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/\b(dr\.?|docteur)\b/g, '')
      .replace(/\s+/g, ' ')
      .trim()

  /** Saisie du nom de médecin avec auto-lien vers la banque : si le nom tapé
   *  correspond à un médecin enregistré (match exact sur "prénom nom" ou sur
   *  le nom seul), on pré-remplit automatiquement le téléphone et on marque
   *  la fiche comme sélectionnée. L'utilisateur peut toujours réécrire le
   *  téléphone manuellement après — on ne le réécrase pas si la nouvelle
   *  saisie ne matche plus aucun médecin (évite de perdre une saisie en
   *  cours). */
  const handleMedecinNomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    const norm = normalizeMedecinName(value)
    if (!norm) {
      setSelectedMedecinId('')
      setFormData(prev => ({ ...prev, medecin_nom: value }))
      return
    }
    const match = medecins.find(m => {
      const full = normalizeMedecinName(`${m.prenom ? m.prenom + ' ' : ''}${m.nom}`)
      const nomOnly = normalizeMedecinName(m.nom)
      return full === norm || nomOnly === norm
    })
    if (match) {
      const fullName = `${match.prenom ? match.prenom + ' ' : ''}${match.nom}`.trim()
      setSelectedMedecinId(match.id)
      setFormData(prev => ({
        ...prev,
        medecin_nom: fullName,
        medecin_tel: match.telephone || prev.medecin_tel,
      }))
    } else {
      // Pas de match : on garde la saisie libre et on dé-sélectionne la
      // fiche carnet pour éviter une incohérence visuelle (carnet vert
      // alors que le nom ne correspond plus).
      if (selectedMedecinId) setSelectedMedecinId('')
      setFormData(prev => ({ ...prev, medecin_nom: value }))
    }
  }

  // Sauvegarde un nouveau médecin dans la banque, le sélectionne, et pré-remplit
  // le formulaire CRBO avec son nom + téléphone.
  const handleSaveNewMedecin = async () => {
    if (!newMedecin.nom.trim()) return
    setSavingMedecin(true)
    setError('')
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Session expirée')
      const payload = {
        user_id: user.id,
        prenom: newMedecin.prenom.trim() || null,
        nom: newMedecin.nom.trim(),
        specialite: newMedecin.specialite.trim() || null,
        telephone: newMedecin.telephone.trim() || null,
        ville: newMedecin.ville.trim() || null,
        code_postal: newMedecin.code_postal.trim() || null,
        usage_count: 0,
      }
      const { data, error: insertError } = await supabase
        .from('medecins')
        .insert(payload)
        .select('id, prenom, nom, specialite, telephone, ville, code_postal, usage_count')
        .single()
      if (insertError) throw insertError
      const created = data as Medecin
      const fullName = `${created.prenom ? created.prenom + ' ' : ''}${created.nom}`.trim()
      setMedecins(prev => [created, ...prev])
      setSelectedMedecinId(created.id)
      setFormData(prev => ({
        ...prev,
        medecin_nom: fullName,
        medecin_tel: created.telephone || '',
      }))
      setShowNewMedecinForm(false)
      setNewMedecin({ prenom: '', nom: '', specialite: '', telephone: '', ville: '', code_postal: '' })
    } catch (e: any) {
      setError(e?.message || "Impossible d'enregistrer le médecin.")
    } finally {
      setSavingMedecin(false)
    }
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

  // Extraction des résultats PDF avec Claude Vision (multi-fichiers).
  // L'utilisateur peut sélectionner jusqu'à 3 PDFs / images en une fois ; chaque
  // document est envoyé séparément à Claude Vision côté API et les résultats
  // sont consolidés en un seul JSON. Cas d'usage typique : page 1 + page 2 d'une
  // feuille de résultats HappyNeuron (Exalang) qu'il faut traiter ensemble.
  const handleExtractPDF = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    if (files.length === 0) return

    if (files.length > 3) {
      setError('Maximum 3 fichiers à la fois.')
      e.target.value = ''
      return
    }
    for (const f of files) {
      if (!f.type.includes('pdf') && !f.type.includes('image')) {
        setError(`Format non supporté pour "${f.name}". Utilisez un PDF ou une image (PNG, JPG).`)
        e.target.value = ''
        return
      }
    }

    setExtracting(true)
    setError('')
    setNotice('')

    try {
      const formDataUpload = new FormData()
      // L'ordre d'upload détermine la priorité en cas de doublons d'épreuves :
      // le DERNIER fichier l'emporte (= "PDF le plus récent"). L'utilisateur
      // est libre de réordonner les sélections dans son OS.
      for (const f of files) {
        formDataUpload.append('files', f)
      }

      const response = await fetch('/api/extract-pdf', {
        method: 'POST',
        body: formDataUpload,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de l\'extraction')
      }

      // Mettre à jour les résultats. On NE pré-coche PAS automatiquement le test
      // détecté : règle clinique Laurie — un test ne doit JAMAIS apparaître dans
      // le CRBO sans avoir été coché explicitement par l'orthophoniste.
      setFormData(prev => ({
        ...prev,
        resultats_manuels: data.resultats,
      }))
      const nbFiles = data.filesProcessed ?? files.length
      const filesLabel = nbFiles > 1 ? `${nbFiles} fichiers importés` : 'PDF importé'
      setNotice(
        data.detectedTest
          ? `${filesLabel}. Test détecté : "${data.detectedTest}" — cochez-le manuellement ci-dessus si vous souhaitez l'inclure.`
          : `${filesLabel}. Pensez à cocher le test correspondant dans la liste.`
      )

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de l\'extraction')
    } finally {
      setExtracting(false)
      // Reset l'input pour permettre de réimporter les mêmes fichiers
      e.target.value = ''
    }
  }

  const nextStep = () => {
    if (currentStep < TOTAL_STEPS) {
      setCurrentStep(prev => prev + 1)
      playDing() // micro-feedback satisfaisant à chaque étape franchie
      // Sinon la page reste au niveau du bouton "Continuer" (en bas) — on
      // ramène l'utilisateur en haut pour qu'il voie le titre de la nouvelle étape.
      if (typeof window !== 'undefined') {
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }
    }
  }

  /** Toggle d'une option motif (multi-sélection). Met à jour formData.motif
   *  comme chaîne CSV "Langage oral, Cognitif" — compat persistance DB et
   *  injection prompt. Ordre conservé selon MOTIF_OPTIONS pour stabilité. */
  const toggleMotif = (option: string) => {
    setFormData(prev => {
      const current = parseMotif(prev.motif)
      const next = current.includes(option)
        ? current.filter(o => o !== option)
        : [...current, option]
      // Trier selon l'ordre canonique de MOTIF_OPTIONS pour des sorties stables
      const ordered = MOTIF_OPTIONS.filter(o => next.includes(o))
      return { ...prev, motif: ordered.join(', ') }
    })
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1)
      if (typeof window !== 'undefined') {
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }
    }
  }

  /**
   * Réinitialise complètement le formulaire pour démarrer un nouveau dossier.
   * Utilisé par le bouton "Changer" du bandeau patient (étape 1 → patient
   * vierge, anamnèse vide, tests décochés, médecin réinitialisé). On
   * conserve l'en-tête orthophoniste (ortho_nom/adresse/…) car il vient
   * du profil et ne change pas d'un dossier à l'autre.
   */
  const handleResetFormForNewPatient = () => {
    try { localStorage.removeItem(DRAFT_KEY) } catch {}
    setSelectedPatientId('')
    setSelectedMedecinId('')
    setShowNewPatientForm(false)
    setShowNewMedecinForm(false)
    setMedecinSearch('')
    setPreviousBilanFilename(null)
    setPrefillBanner('')
    setNotice('')
    setError('')
    setFormData(prev => ({
      ...prev,
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
      elements_stables: '',
      evolution_notes: '',
      bilan_precedent_structure: null,
      test_utilise: [],
      resultats_manuels: '',
      notes_analyse: '',
      resultats_pdf: undefined,
      audio_file: undefined,
    }))
    setCurrentStep(1)
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' })
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
      // ============ PHASE 1 : EXTRACTION ============
      // Reformulation anamnèse + motif + parsing structuré des scores. Pas de
      // diagnostic ni recommandations à ce stade — l'orthophoniste valide d'abord
      // les extractions et ajoute ses commentaires qualitatifs sur la page suivante.
      const response = await fetch('/api/generate-crbo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phase: 'extract',
          formData: formDataForSubmission,
          format: formDataForSubmission.format_crbo || 'complet',
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        if (response.status === 401) {
          persistDraft()
          setError('Session expirée. Votre saisie est sauvegardée, vous serez redirigé·e vers la page de connexion.')
          setTimeout(() => {
            router.push(`/auth/login?redirect=${encodeURIComponent('/dashboard/nouveau-crbo')}`)
          }, 2500)
          return
        }
        throw new Error(data.error || 'Erreur lors de l\'extraction')
      }

      // Persiste tout le contexte nécessaire à la page de résultats dans
      // sessionStorage (volume potentiel > 100ko, on évite query string).
      const handoff = {
        formData: formDataForSubmission,
        extracted: data.extracted,
        selectedPatientId,
        selectedMedecinId,
      }
      try {
        sessionStorage.setItem('ortho-ia:crbo-handoff', JSON.stringify(handoff))
        localStorage.removeItem(DRAFT_KEY)
      } catch (e) {
        // Si sessionStorage échoue (mode privé, quota dépassé, navigateur exotique),
        // on NE navigue PAS vers /resultats — sinon la page suivante ne trouve
        // pas le handoff et fait un redirect loop vers ici. On affiche un
        // message actionnable et on laisse l'ortho retenter.
        console.error('SessionStorage indisponible:', e)
        setError(
          "Impossible de transférer le CRBO vers la page suivante (stockage navigateur indisponible). " +
          "Désactivez le mode privé / videz le cache, puis réessayez.",
        )
        return
      }

      router.push('/dashboard/nouveau-crbo/resultats')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setGenerating(false)
    }
  }

  const handleDownloadWord = async () => {
    try {
      // Animation 3D flip pendant la génération (1500ms garantis même si
      // le download est instantané).
      playPrintAnimation(1500)
      await downloadCRBOWord({
        formData,
        structure: generatedStructure,
        fallbackCRBO: generatedCRBO,
        previousStructure: formData.bilan_precedent_structure ?? null,
        previousBilanDate: formData.bilan_precedent_date,
      })
      // "Swoosh" type document sort de l'imprimante — feedback satisfaisant
      // après une action longue (génération Word des graphes + tableaux).
      playSwoosh()
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
                <div className="flex items-center gap-2">
                  <button onClick={handleDownloadWord} className="btn-primary">
                    <Download size={16} />
                    Télécharger en Word
                  </button>
                  {savedCrboId && (
                    <a
                      href={`/dashboard/historique/${savedCrboId}/print`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-secondary"
                      title="Exporter au format PDF via l'aperçu d'impression"
                    >
                      <FileDown size={16} />
                      PDF
                    </a>
                  )}
                </div>
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
                notes_analyse: '',
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
    currentStep >= 1 && currentStep <= TOTAL_STEPS &&
    (formData.patient_prenom || formData.patient_nom)

  return (
    <div className="max-w-3xl mx-auto">
      {/* Bandeau patient — rappel du dossier actif, sticky en haut sur toutes les étapes */}
      {patientBannerVisible && (
        <div className="sticky top-2 z-30 mb-4 flex items-center justify-between gap-3 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg px-4 py-2.5 shadow-sm backdrop-blur-sm">
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
            onClick={handleResetFormForNewPatient}
            className="text-xs font-medium text-green-700 hover:text-green-900 underline decoration-dotted whitespace-nowrap"
            title="Vide le formulaire et redémarre à l'étape 1 pour saisir un nouveau dossier"
          >
            Changer
          </button>
        </div>
      )}

      {/* Progress bar moderne + indicateur auto-save discret aligné à droite.
          L'indicateur reste visible en permanence dès le 1er tick, réduit
          l'anxiété "j'ai perdu mon travail" sans encombrer la zone d'édition. */}
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div className="flex-1 min-w-0">
          <StepProgress
            currentStep={currentStep}
            onStepClick={(step) => setCurrentStep(step)}
          />
        </div>
        <div className="shrink-0 pb-1">
          <AutoSaveIndicator
            lastSavedAt={lastSavedAt}
            nowTick={nowTick}
            saving={savingFlash}
          />
        </div>
      </div>

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

        {prefillBanner && !error && (
          <div className="mb-6 bg-emerald-50 border border-emerald-300 text-emerald-800 px-4 py-3 rounded-lg flex items-start gap-2">
            <CheckCircle size={20} className="flex-shrink-0 mt-0.5" />
            <span>{prefillBanner}</span>
          </div>
        )}

        {notice && !error && (
          <div className="mb-6 bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded-lg flex items-start gap-2">
            <AlertCircle size={20} className="flex-shrink-0 mt-0.5" />
            <span>{notice}</span>
          </div>
        )}

        {/* Step 1: Infos patient (les coordonnées orthophoniste viennent du profil Supabase) */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div>
              <StepPhaseBadge step={1} />
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
                  Classe / niveau *
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
                  {CLASSES_GROUPS.map(group => (
                    <optgroup key={group.label} label={group.label}>
                      {group.options.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </optgroup>
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

        {/* Step 2: Médecin & Motif (avec banque de médecins) */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div>
              <StepPhaseBadge step={2} />
              <h2 className="text-xl font-semibold text-gray-900">Médecin prescripteur & Motif</h2>
              <p className="mt-1 text-sm text-gray-500">Sélectionnez un médecin de votre carnet ou ajoutez-en un nouveau</p>
            </div>

            {/* Banque médecins — autocomplete filtré par user_id, trié par fréquence */}
            {medecins.length > 0 && !showNewMedecinForm && (
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <Users size={18} />
                  Rechercher dans votre carnet ({medecins.length})
                </div>
                <input
                  type="text"
                  value={medecinSearch}
                  onChange={(e) => setMedecinSearch(e.target.value)}
                  placeholder="Rechercher un médecin… (nom, ville, spécialité)"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                />
                <div className="max-h-56 overflow-y-auto space-y-1.5">
                  {medecins
                    .filter((m) => {
                      const q = medecinSearch.trim().toLowerCase()
                      if (!q) return true
                      return [m.nom, m.prenom, m.specialite, m.ville]
                        .filter(Boolean)
                        .some((s) => s!.toLowerCase().includes(q))
                    })
                    .slice(0, 30)
                    .map((m) => {
                      const fullName = `${m.prenom ? m.prenom + ' ' : ''}${m.nom}`.trim()
                      const isSelected = selectedMedecinId === m.id
                      return (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => {
                            setSelectedMedecinId(m.id)
                            setFormData((prev) => ({
                              ...prev,
                              medecin_nom: fullName,
                              medecin_tel: m.telephone || '',
                            }))
                          }}
                          className={`w-full text-left px-3 py-2 rounded-md border transition flex items-center justify-between ${
                            isSelected
                              ? 'bg-green-100 border-green-400 text-green-900'
                              : 'bg-white border-gray-200 hover:border-green-300 hover:bg-green-50'
                          }`}
                        >
                          <div className="min-w-0">
                            <div className="text-sm font-medium truncate">{fullName}</div>
                            <div className="text-xs text-gray-500 truncate">
                              {[m.specialite, m.ville, m.telephone].filter(Boolean).join(' · ') || '—'}
                            </div>
                          </div>
                          {m.usage_count > 0 && (
                            <span className="ml-2 text-[10px] text-gray-400 whitespace-nowrap">
                              {m.usage_count}× utilisé
                            </span>
                          )}
                        </button>
                      )
                    })}
                  {medecins.filter((m) => {
                    const q = medecinSearch.trim().toLowerCase()
                    if (!q) return true
                    return [m.nom, m.prenom, m.specialite, m.ville]
                      .filter(Boolean)
                      .some((s) => s!.toLowerCase().includes(q))
                  }).length === 0 && (
                    <p className="text-sm text-gray-500 italic px-2 py-1">Aucun résultat.</p>
                  )}
                </div>
              </div>
            )}

            {!showNewMedecinForm && (
              <button
                type="button"
                onClick={() => {
                  setShowNewMedecinForm(true)
                  setSelectedMedecinId('')
                  setNewMedecin({ prenom: '', nom: '', specialite: '', telephone: '', ville: '', code_postal: '' })
                }}
                className="inline-flex items-center gap-2 text-sm font-medium text-green-700 hover:text-green-800"
              >
                <UserPlus size={16} />
                Nouveau médecin
              </button>
            )}

            {/* Formulaire inline nouveau médecin */}
            {showNewMedecinForm && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold text-green-900">Nouveau médecin</div>
                  <button
                    type="button"
                    onClick={() => setShowNewMedecinForm(false)}
                    className="text-xs text-green-700 hover:text-green-900 underline"
                  >
                    Annuler
                  </button>
                </div>
                <div className="grid sm:grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={newMedecin.prenom}
                    onChange={(e) => setNewMedecin((p) => ({ ...p, prenom: e.target.value }))}
                    placeholder="Prénom"
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                  />
                  <input
                    type="text"
                    value={newMedecin.nom}
                    onChange={(e) => setNewMedecin((p) => ({ ...p, nom: e.target.value }))}
                    placeholder="Nom *"
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                  />
                  <input
                    type="text"
                    value={newMedecin.specialite}
                    onChange={(e) => setNewMedecin((p) => ({ ...p, specialite: e.target.value }))}
                    placeholder="Spécialité (ex: Pédiatre)"
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                  />
                  <input
                    type="tel"
                    value={newMedecin.telephone}
                    onChange={(e) => setNewMedecin((p) => ({ ...p, telephone: e.target.value }))}
                    placeholder="Téléphone"
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                  />
                  <input
                    type="text"
                    value={newMedecin.code_postal}
                    onChange={(e) => setNewMedecin((p) => ({ ...p, code_postal: e.target.value }))}
                    placeholder="Code postal"
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                  />
                  <input
                    type="text"
                    value={newMedecin.ville}
                    onChange={(e) => setNewMedecin((p) => ({ ...p, ville: e.target.value }))}
                    placeholder="Ville"
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                  />
                </div>
                <button
                  type="button"
                  disabled={savingMedecin || !newMedecin.nom.trim()}
                  onClick={handleSaveNewMedecin}
                  className="bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-green-700 disabled:opacity-50"
                >
                  {savingMedecin ? 'Enregistrement…' : 'Enregistrer et utiliser'}
                </button>
              </div>
            )}

            {/* Champs nom/téléphone (modifiables, pré-remplis si un médecin est sélectionné) */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom du médecin *</label>
                <input
                  type="text"
                  name="medecin_nom"
                  value={formData.medecin_nom}
                  onChange={handleMedecinNomChange}
                  required
                  list="medecin-nom-suggestions"
                  autoComplete="off"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Docteur Bernard"
                />
                {/* Datalist : suggestions natives navigateur tirées de la
                    banque médecins. Quand l'utilisateur en sélectionne une
                    (ou tape le nom complet à la main), handleMedecinNomChange
                    détecte le match et auto-remplit le téléphone. */}
                <datalist id="medecin-nom-suggestions">
                  {medecins.map((m) => {
                    const full = `${m.prenom ? m.prenom + ' ' : ''}${m.nom}`.trim()
                    return (
                      <option key={m.id} value={full}>
                        {[m.specialite, m.ville, m.telephone].filter(Boolean).join(' · ')}
                      </option>
                    )
                  })}
                </datalist>
                {selectedMedecinId && (
                  <p className="mt-1 text-xs text-green-700">
                    ✓ Lié au médecin enregistré — téléphone pré-rempli depuis le carnet
                  </p>
                )}
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
                <label
                  className="block mb-2"
                  style={{ fontSize: 14, fontWeight: 500, color: 'var(--fg-2)' }}
                >
                  Motif de consultation *
                </label>
                {/* Multi-select chips. Le motif final est stocké comme chaîne
                    "Langage oral, Langage écrit" (compat DB + prompt). Le LLM
                    le reformule ensuite en 1-2 phrases fluides via la règle
                    motif_reformule du system-base. */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {MOTIF_OPTIONS.map((option) => {
                    const selected = parseMotif(formData.motif).includes(option)
                    return (
                      <button
                        key={option}
                        type="button"
                        onClick={() => toggleMotif(option)}
                        aria-pressed={selected}
                        style={{
                          padding: '8px 16px',
                          borderRadius: 'var(--radius-pill)',
                          fontFamily: 'var(--font-body)',
                          fontSize: 14,
                          fontWeight: 500,
                          cursor: 'pointer',
                          transition: 'all 180ms var(--ease-out)',
                          background: selected ? 'var(--ds-primary)' : 'var(--bg-surface)',
                          color: selected ? 'var(--fg-on-brand)' : 'var(--fg-1)',
                          border: `1px solid ${selected ? 'transparent' : 'var(--border-ds-strong)'}`,
                          boxShadow: selected ? 'var(--shadow-sm)' : 'none',
                        }}
                      >
                        {option}
                      </button>
                    )
                  })}
                </div>
                <p style={{ marginTop: 8, fontSize: 12, color: 'var(--fg-3)' }}>
                  Sélectionnez un ou plusieurs domaines. Ortho.ia reformulera le motif
                  en 1-2 phrases fluides dans le compte-rendu.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Anamnèse */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div>
              <StepPhaseBadge step={3} />
              <h2 className="text-xl font-semibold text-gray-900">
                {formData.bilan_type === 'renouvellement' && selectedPatientId ? '📊 Évolution depuis le dernier bilan' : 'Anamnèse'}
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                {formData.bilan_type === 'renouvellement' && selectedPatientId
                  ? 'Notez ce qui a changé depuis le dernier bilan — les éléments stables sont déjà pré-remplis.'
                  : 'Entrez vos notes librement, Ortho.ia les reformulera en prose professionnelle.'}
              </p>
            </div>

            {/* ============ MODE RENOUVELLEMENT ============ */}
            {/* Note : le check `selectedPatientId` a été retiré pour permettre
                l'upload d'un bilan initial externe même quand l'ortho saisit
                le patient manuellement (renouvellement first-time dans ortho-ia). */}
            {formData.bilan_type === 'renouvellement' ? (
              <>
                {importingAnamnese && (
                  <div className="flex items-center gap-2 text-sm text-purple-600">
                    <Loader2 className="animate-spin" size={16} />
                    Chargement du bilan précédent…
                  </div>
                )}

                {/* ===== UPLOAD bilan initial EXTERNE =====
                    Affiché uniquement si aucun bilan précédent n'a été chargé
                    (ni depuis la DB ortho-ia, ni encore uploadé). Une fois
                    l'extraction faite, bilan_precedent_structure est peuplé et
                    ce bloc disparaît au profit des blocs Évolutions / Éléments
                    stables ci-dessous. */}
                {!formData.bilan_precedent_structure && !importingAnamnese && (
                  <div
                    style={{
                      background: 'var(--bg-surface)',
                      border: '1px dashed var(--border-ds-strong)',
                      borderRadius: 'var(--radius-lg)',
                      padding: 24,
                      fontFamily: 'var(--font-body)',
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        style={{
                          flexShrink: 0,
                          width: 40, height: 40, borderRadius: 'var(--radius-md)',
                          background: 'var(--ds-primary-soft)', color: 'var(--ds-primary-hover)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}
                      >
                        <FileUp size={20} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p style={{ fontWeight: 600, color: 'var(--fg-1)' }}>
                          📄 Bilan initial précédent
                        </p>
                        <p style={{ fontSize: 13, color: 'var(--fg-2)', marginTop: 4, lineHeight: 1.5 }}>
                          Importez le compte-rendu du bilan précédent pour nous permettre
                          d&apos;analyser les évolutions.
                        </p>
                        <div className="mt-3 flex items-center gap-3 flex-wrap">
                          <label
                            style={{
                              display: 'inline-flex', alignItems: 'center', gap: 8,
                              padding: '10px 16px',
                              background: 'var(--ds-primary)',
                              color: 'var(--fg-on-brand)',
                              borderRadius: 'var(--radius-pill)',
                              fontSize: 14, fontWeight: 500,
                              cursor: uploadingPreviousBilan ? 'not-allowed' : 'pointer',
                              opacity: uploadingPreviousBilan ? 0.6 : 1,
                              transition: 'background 180ms',
                            }}
                          >
                            {uploadingPreviousBilan ? (
                              <>
                                <Loader2 className="animate-spin" size={16} />
                                Extraction en cours…
                              </>
                            ) : (
                              <>
                                <Upload size={16} />
                                Importer le bilan initial (PDF ou Word)
                              </>
                            )}
                            <input
                              type="file"
                              accept=".pdf,.docx,.doc,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/msword"
                              onChange={(e) => {
                                const file = e.target.files?.[0]
                                if (file) handleUploadPreviousBilan(file)
                                e.target.value = '' // permet de réuploader le même fichier
                              }}
                              disabled={uploadingPreviousBilan}
                              style={{ display: 'none' }}
                            />
                          </label>
                          <span style={{ fontSize: 12, color: 'var(--fg-3)' }}>
                            Formats acceptés : PDF, .docx · max 10 Mo
                          </span>
                        </div>
                        <p style={{ fontSize: 12, color: 'var(--fg-3)', marginTop: 12, fontStyle: 'italic' }}>
                          Aucun import disponible ? Vous pouvez aussi continuer sans —
                          la synthèse comparative sera alors approximative.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Confirmation après upload externe */}
                {formData.bilan_precedent_structure && previousBilanFilename && (
                  <div
                    style={{
                      background: 'var(--ds-success-soft)',
                      border: '1px solid color-mix(in srgb, var(--ds-success) 30%, transparent)',
                      borderRadius: 'var(--radius-md)',
                      padding: '12px 16px',
                      fontFamily: 'var(--font-body)',
                      display: 'flex', alignItems: 'center', gap: 12,
                    }}
                  >
                    <CheckCircle size={20} style={{ color: 'var(--ds-success)', flexShrink: 0 }} />
                    <div className="flex-1 min-w-0">
                      <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--ds-success)' }}>
                        Bilan initial importé
                      </p>
                      <p style={{ fontSize: 12, color: 'var(--fg-2)', marginTop: 2 }}>
                        {previousBilanFilename} ·{' '}
                        {formData.bilan_precedent_structure.domains?.length ?? 0} domaine
                        {(formData.bilan_precedent_structure.domains?.length ?? 0) > 1 ? 's' : ''} extrait
                        {(formData.bilan_precedent_structure.domains?.length ?? 0) > 1 ? 's' : ''}
                        {formData.bilan_precedent_date && ` · bilan du ${new Date(formData.bilan_precedent_date).toLocaleDateString('fr-FR')}`}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setFormData(prev => ({
                          ...prev,
                          bilan_precedent_structure: null,
                          bilan_precedent_date: undefined,
                          bilan_precedent_anamnese: undefined,
                        }))
                        setPreviousBilanFilename(null)
                      }}
                      style={{
                        padding: '4px 10px',
                        background: 'transparent',
                        color: 'var(--fg-2)',
                        border: '1px solid var(--border-ds-strong)',
                        borderRadius: 'var(--radius-sm)',
                        fontFamily: 'var(--font-body)',
                        fontSize: 12,
                        cursor: 'pointer',
                      }}
                    >
                      Réimporter
                    </button>
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
                  <div className="flex justify-end mb-1">
                    <MicButton
                      value={formData.evolution_notes || ''}
                      onChange={(v) => setFormData(prev => ({ ...prev, evolution_notes: v }))}
                      onError={(msg) => setError(msg)}
                    />
                  </div>
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
                  <div className="flex justify-end mb-1">
                    <MicButton
                      value={formData.elements_stables || ''}
                      onChange={(v) => setFormData(prev => ({ ...prev, elements_stables: v }))}
                      onError={(msg) => setError(msg)}
                    />
                  </div>
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
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-sm font-medium text-gray-700">Notes d&apos;anamnèse *</label>
                    <MicButton
                      value={formData.anamnese}
                      onChange={(v) => setFormData(prev => ({ ...prev, anamnese: v }))}
                      onError={(msg) => setError(msg)}
                    />
                  </div>
                  <SnippetTextarea
                    name="anamnese"
                    value={formData.anamnese}
                    onChange={(v) => setFormData(prev => ({ ...prev, anamnese: v }))}
                    required
                    rows={10}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                    placeholder="- fratrie : 1 grande sœur et 1 grand frère
- 1ères acquisitions : RAS
- vision/audition : RAS, porte des lunettes (hypermétrope)
- à la maison : il aime jouer avec son chat, construire des cabanes
- autres suivis : bilan psychomot le 3/06/2020...
- scolarité : CP très compliqué (6 maîtresses + confinement)

Astuce : tapez /fatigue, /anxiete, /encouragements… pour réutiliser vos formulations habituelles."
                  />
                </div>
              </>
            )}

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

        {/* Step 4: Résultats */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <div>
              <StepPhaseBadge step={4} />
              <h2 className="text-xl font-semibold text-gray-900">Résultats des tests</h2>
              <p className="mt-1 text-sm text-gray-500">Sélectionnez les tests utilisés et entrez les résultats</p>
            </div>

            {/* Toggle Format CRBO — Synthétique vs Complet */}
            <div className="rounded-xl border border-gray-200 dark:border-surface-dark-muted bg-white dark:bg-surface-dark-subtle p-4">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Format du CRBO</p>
              <div className="grid grid-cols-2 gap-2">
                {(['synthetique', 'complet'] as const).map((fmt) => {
                  const active = (formData.format_crbo || 'complet') === fmt
                  const labels = fmt === 'synthetique'
                    ? { emoji: '🟢', title: 'Synthétique', sub: '2-3 pages · essentiel' }
                    : { emoji: '🔵', title: 'Complet', sub: '4-6 pages · détaillé' }
                  return (
                    <button
                      key={fmt}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, format_crbo: fmt }))}
                      className={`text-left p-3 rounded-lg border-2 transition ${
                        active
                          ? 'border-green-500 bg-green-50 dark:bg-green-900/20 ring-2 ring-green-200'
                          : 'border-gray-200 dark:border-surface-dark-muted hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span>{labels.emoji}</span>
                        <span className="font-semibold text-sm text-gray-900 dark:text-gray-100">{labels.title}</span>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{labels.sub}</p>
                    </button>
                  )
                })}
              </div>
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

            {/* MoCA — saisie structurée. Quand le seul test sélectionné est la MoCA,
                on remplace le textarea + import PDF (un screening 10 min se saisit
                directement, pas par PDF) par une grille des 7 sous-scores avec
                calcul automatique du total et badge sévérité. */}
            {formData.test_utilise.length === 1 && formData.test_utilise[0] === 'MoCA' ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Résultats MoCA *
                </label>
                {error && (
                  <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 text-sm">
                    <AlertCircle size={16} />
                    {error}
                  </div>
                )}
                <MocaScoresInput
                  notes={formData.comportement_seance || ''}
                  onNotesChange={(v) => setFormData(prev => ({ ...prev, comportement_seance: v }))}
                  onResultatsChange={(v) => setFormData(prev => ({ ...prev, resultats_manuels: v }))}
                  onError={(msg) => setError(msg)}
                />
              </div>
            ) : formData.test_utilise.length === 1 && formData.test_utilise[0] === 'BETL' ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Résultats BETL *
                </label>
                {error && (
                  <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 text-sm">
                    <AlertCircle size={16} />
                    {error}
                  </div>
                )}
                <BetlScoresInput
                  notes={formData.comportement_seance || ''}
                  onNotesChange={(v) => setFormData(prev => ({ ...prev, comportement_seance: v }))}
                  onResultatsChange={(v) => setFormData(prev => ({ ...prev, resultats_manuels: v }))}
                  onError={(msg) => setError(msg)}
                  ageEstime={(() => {
                    if (!formData.patient_ddn) return undefined
                    const birth = new Date(formData.patient_ddn)
                    const bilan = new Date(formData.bilan_date)
                    let years = bilan.getFullYear() - birth.getFullYear()
                    const m = bilan.getMonth() - birth.getMonth()
                    if (m < 0 || (m === 0 && bilan.getDate() < birth.getDate())) years--
                    return years
                  })()}
                />
              </div>
            ) : formData.test_utilise.length === 1 && formData.test_utilise[0] === 'PREDIMEM' ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Résultats PREDIMEM *
                </label>
                {error && (
                  <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 text-sm">
                    <AlertCircle size={16} />
                    {error}
                  </div>
                )}
                <PredimemScoresInput
                  notes={formData.comportement_seance || ''}
                  onNotesChange={(v) => setFormData(prev => ({ ...prev, comportement_seance: v }))}
                  onResultatsChange={(v) => setFormData(prev => ({ ...prev, resultats_manuels: v }))}
                  onError={(msg) => setError(msg)}
                />
              </div>
            ) : formData.test_utilise.length === 1 && formData.test_utilise[0] === 'Examath' ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Résultats Examath 8-15 *
                </label>
                {error && (
                  <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 text-sm">
                    <AlertCircle size={16} />
                    {error}
                  </div>
                )}
                <ExamathScoresInput
                  notes={formData.comportement_seance || ''}
                  onNotesChange={(v) => setFormData(prev => ({ ...prev, comportement_seance: v }))}
                  onResultatsChange={(v) => setFormData(prev => ({ ...prev, resultats_manuels: v }))}
                  onError={(msg) => setError(msg)}
                />
              </div>
            ) : (
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
                      multiple
                      onChange={handleExtractPDF}
                      disabled={extracting}
                      className="hidden"
                    />
                  </label>
                  <span className="ml-3 text-xs text-gray-400">Jusqu'à 3 PDFs / images (Exalang, EVALO, ELO...) — multi-page : sélectionnez page 1 + page 2</span>
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

                {/* Hint si MoCA est mélangé avec d'autres tests */}
                {formData.test_utilise.includes('MoCA') && formData.test_utilise.length > 1 && (
                  <div className="mt-3 p-3 rounded-lg border border-amber-200 bg-amber-50 text-xs text-amber-800">
                    <strong>MoCA + autre(s) test(s) sélectionné(s)</strong> : la saisie structurée MoCA
                    est disponible uniquement quand la MoCA est le seul test choisi. Vous pouvez ici
                    saisir les scores MoCA librement ligne par ligne (ex : « Mémoire : 3/5 »).
                  </div>
                )}
              </div>
            )}

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

              <div className="flex justify-end">
                <MicButton
                  value={formData.comportement_seance || ''}
                  onChange={(v) => setFormData(prev => ({ ...prev, comportement_seance: v }))}
                  onError={(msg) => setError(msg)}
                />
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
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-gray-700">
                  Notes d&apos;analyse (optionnel)
                </label>
                <MicButton
                  value={formData.notes_analyse}
                  onChange={(v) => setFormData(prev => ({ ...prev, notes_analyse: v }))}
                  onError={(msg) => setError(msg)}
                />
              </div>
              <SnippetTextarea
                name="notes_analyse"
                value={formData.notes_analyse}
                onChange={(v) => setFormData(prev => ({ ...prev, notes_analyse: v }))}
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                placeholder="Nombre de séances passées, matériel utilisé, adaptations… (tapez /fatigue, /anxiete pour réutiliser vos formulations)"
              />
            </div>
          </div>
        )}

        {/* Auto-save indicator moved to top (AutoSaveIndicator) — plus visible
            et accessible en permanence. Le label local `savedAgoLabel` est
            conservé en interne pour debug si besoin futur. */}

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

          {currentStep < TOTAL_STEPS ? (
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
                  Extraction des données…
                </>
              ) : (
                <>
                  <Sparkles size={18} />
                  <span>Visualiser les résultats</span>
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
