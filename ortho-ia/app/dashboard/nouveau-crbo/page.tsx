'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { CLASSES_OPTIONS, TESTS_OPTIONS, CRBOFormData } from '@/lib/types'
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

function NouveauCRBOContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [extracting, setExtracting] = useState(false)
  const [error, setError] = useState('')
  const [generatedCRBO, setGeneratedCRBO] = useState('')
  const [showResult, setShowResult] = useState(false)
  
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
      }
    }

    loadUserProfile()
  }, [searchParams])

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
        throw new Error(data.error || 'Erreur lors de la génération')
      }

      setGeneratedCRBO(data.crbo)
      setShowResult(true)

      // Sauvegarder en base de données
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        await supabase.from('crbos').insert({
          user_id: user.id,
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
        })

        // Mettre à jour le compteur
        await supabase.rpc('increment_crbo_count', { user_id: user.id })
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setGenerating(false)
    }
  }

  const handleDownloadWord = async () => {
    // Import dynamique pour éviter les erreurs SSR
    const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, BorderStyle, AlignmentType, PageBreak, ShadingType } = await import('docx')
    const fileSaver = await import('file-saver')
    const saveAs = fileSaver.default || fileSaver.saveAs

    // Constantes de style
    const FONT = "Calibri"
    const FONT_SIZE_NORMAL = 22 // 11pt
    const FONT_SIZE_TITLE = 32 // 16pt
    const FONT_SIZE_SECTION = 26 // 13pt
    const COLOR_GREEN = "2E7D32"

    // Helper: créer une cellule
    const createCell = (text: string, options: { bold?: boolean, width?: number, shading?: string, alignment?: any } = {}) => {
      const { bold = false, width = 25, shading, alignment = AlignmentType.LEFT } = options
      return new TableCell({
        width: { size: width, type: WidthType.PERCENTAGE },
        shading: shading ? { fill: shading, type: ShadingType.CLEAR } : undefined,
        children: [new Paragraph({
          alignment,
          children: [new TextRun({ text: text || '', bold, size: FONT_SIZE_NORMAL, font: FONT })],
        })],
        borders: {
          top: { style: BorderStyle.SINGLE, size: 1, color: "BFBFBF" },
          bottom: { style: BorderStyle.SINGLE, size: 1, color: "BFBFBF" },
          left: { style: BorderStyle.SINGLE, size: 1, color: "BFBFBF" },
          right: { style: BorderStyle.SINGLE, size: 1, color: "BFBFBF" },
        },
      })
    }

    // Helper: créer un titre de section
    const createSectionTitle = (text: string) => {
      return new Paragraph({
        children: [new TextRun({ text, bold: true, size: FONT_SIZE_SECTION, font: FONT, color: COLOR_GREEN })],
        spacing: { before: 400, after: 200 },
        border: { bottom: { color: COLOR_GREEN, space: 20, style: BorderStyle.SINGLE, size: 12 } },
      })
    }

    // Helper: couleur selon É-T
    const getETColor = (et: string) => {
      const val = parseFloat(et)
      if (isNaN(val)) return undefined
      if (val < -2) return "FFCDD2"    // Rouge - pathologique
      if (val < -1.5) return "FFE0B2"  // Orange - déficitaire
      if (val < -1) return "FFF9C4"    // Jaune - fragile
      return "C8E6C9"                   // Vert - normal
    }

    // Calculer l'âge
    const calculateAge = () => {
      if (!formData.patient_ddn) return ''
      const birth = new Date(formData.patient_ddn)
      const bilan = new Date(formData.bilan_date)
      let years = bilan.getFullYear() - birth.getFullYear()
      let months = bilan.getMonth() - birth.getMonth()
      if (months < 0) { years--; months += 12 }
      return `${years} ans et ${months} mois`
    }

    const children: any[] = []

    // ===== EN-TÊTE ORTHOPHONISTE =====
    children.push(
      new Paragraph({ children: [new TextRun({ text: formData.ortho_nom, size: FONT_SIZE_NORMAL, font: FONT, bold: true })] }),
      new Paragraph({ children: [new TextRun({ text: "Orthophoniste", size: FONT_SIZE_NORMAL, font: FONT })] }),
      new Paragraph({ children: [new TextRun({ text: formData.ortho_adresse, size: FONT_SIZE_NORMAL, font: FONT })] }),
      new Paragraph({ children: [new TextRun({ text: `${formData.ortho_cp} ${formData.ortho_ville}`, size: FONT_SIZE_NORMAL, font: FONT })] }),
      new Paragraph({ children: [new TextRun({ text: formData.ortho_tel, size: FONT_SIZE_NORMAL, font: FONT })] }),
      new Paragraph({ children: [new TextRun({ text: formData.ortho_email, size: FONT_SIZE_NORMAL, font: FONT })] }),
      new Paragraph({ children: [] }),
    )

    // ===== TITRE PRINCIPAL =====
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: "COMPTE RENDU DE BILAN ORTHOPHONIQUE", bold: true, size: FONT_SIZE_TITLE, font: FONT })],
        spacing: { before: 200, after: 400 },
      }),
    )

    // ===== SOUS-TITRE =====
    const bilanDateFormatted = new Date(formData.bilan_date).toLocaleDateString('fr-FR')
    children.push(createSectionTitle(`Bilan ${formData.bilan_type} du ${bilanDateFormatted}`))

    // ===== TABLEAU PATIENT =====
    const ddnFormatted = formData.patient_ddn ? new Date(formData.patient_ddn).toLocaleDateString('fr-FR') : ''
    children.push(
      new Paragraph({ children: [new TextRun({ text: "Patient", size: FONT_SIZE_NORMAL, font: FONT, color: COLOR_GREEN, bold: true })], spacing: { before: 200 } }),
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({ children: [
            createCell("Prénom :", { width: 15 }),
            createCell(formData.patient_prenom, { bold: true, width: 35 }),
            createCell("Nom :", { width: 15 }),
            createCell(formData.patient_nom, { bold: true, width: 35 }),
          ]}),
          new TableRow({ children: [
            createCell("Âge :", { width: 15 }),
            createCell(`${calculateAge()} (${ddnFormatted})`, { width: 35 }),
            createCell("Classe :", { width: 15 }),
            createCell(formData.patient_classe, { width: 35 }),
          ]}),
        ],
      }),
      new Paragraph({ children: [] }),
    )

    // ===== TABLEAU MÉDECIN =====
    children.push(
      new Paragraph({ children: [new TextRun({ text: "Médecin prescripteur", size: FONT_SIZE_NORMAL, font: FONT, color: COLOR_GREEN, bold: true })], spacing: { before: 200 } }),
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({ children: [
            createCell("Nom :", { width: 15 }),
            createCell(formData.medecin_nom, { width: 45 }),
            createCell("Tél :", { width: 10 }),
            createCell(formData.medecin_tel, { width: 30 }),
          ]}),
        ],
      }),
      new Paragraph({ children: [] }),
    )

    // ===== MOTIF =====
    children.push(
      new Paragraph({ children: [new TextRun({ text: "Motif de consultation", size: FONT_SIZE_NORMAL, font: FONT, color: COLOR_GREEN, bold: true })], spacing: { before: 200 } }),
      new Paragraph({ children: [new TextRun({ text: formData.motif, size: FONT_SIZE_NORMAL, font: FONT })], spacing: { after: 200 } }),
    )

    // ===== TESTS =====
    const testsText = Array.isArray(formData.test_utilise) ? formData.test_utilise.join(', ') : formData.test_utilise
    children.push(
      new Paragraph({ children: [new TextRun({ text: "Tests pratiqués", size: FONT_SIZE_NORMAL, font: FONT, color: COLOR_GREEN, bold: true })], spacing: { before: 200 } }),
      new Paragraph({ children: [new TextRun({ text: `• ${testsText}`, size: FONT_SIZE_NORMAL, font: FONT })], spacing: { after: 200 } }),
    )

    // ===== SAUT DE PAGE =====
    children.push(new Paragraph({ children: [new PageBreak()] }))

    // ===== ANAMNÈSE =====
    children.push(createSectionTitle("ANAMNÈSE"))
    formData.anamnese.split('\n').forEach(line => {
      if (line.trim()) {
        children.push(new Paragraph({ children: [new TextRun({ text: line.trim(), size: FONT_SIZE_NORMAL, font: FONT })], spacing: { after: 100 } }))
      }
    })

    // ===== BILAN - RÉSULTATS =====
    children.push(createSectionTitle("BILAN"))

    // Légende
    children.push(
      new Paragraph({ children: [new TextRun({ text: "Légende des scores :", size: 18, font: FONT, bold: true })], spacing: { before: 200, after: 100 } }),
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [new TableRow({ children: [
          createCell("Normal (É-T ≥ -1)", { shading: "C8E6C9", width: 25 }),
          createCell("Fragile (-1.5 < É-T < -1)", { shading: "FFF9C4", width: 25 }),
          createCell("Déficitaire (-2 < É-T < -1.5)", { shading: "FFE0B2", width: 25 }),
          createCell("Pathologique (É-T ≤ -2)", { shading: "FFCDD2", width: 25 }),
        ]})],
      }),
      new Paragraph({ children: [] }),
    )

    // Parser et afficher les résultats avec couleurs
    const resultLines = formData.resultats_manuels.split('\n').filter(l => l.trim())
    if (resultLines.length > 0) {
      const tableRows = [
        new TableRow({ children: [
          createCell("Épreuve", { bold: true, width: 50, shading: "E8F5E9" }),
          createCell("Score", { bold: true, width: 20, shading: "E8F5E9", alignment: AlignmentType.CENTER }),
          createCell("É-T", { bold: true, width: 15, shading: "E8F5E9", alignment: AlignmentType.CENTER }),
          createCell("Centile", { bold: true, width: 15, shading: "E8F5E9", alignment: AlignmentType.CENTER }),
        ]}),
      ]

      resultLines.forEach(line => {
        // Parser : "Nom épreuve : score, É-T : -1.5, P10" ou variations
        const parts = line.split(/[,:]/).map(p => p.trim())
        const epreuve = parts[0] || line
        const score = parts[1] || ''
        const etMatch = line.match(/É-T\s*:\s*([-\d.]+)/i) || line.match(/([-]\d+\.?\d*)/);
        const et = etMatch ? etMatch[1] : ''
        const centileMatch = line.match(/P(\d+)/i) || line.match(/centile\s*:\s*(\d+)/i)
        const centile = centileMatch ? `P${centileMatch[1]}` : ''

        tableRows.push(new TableRow({ children: [
          createCell(epreuve, { width: 50 }),
          createCell(score, { width: 20, alignment: AlignmentType.CENTER }),
          createCell(et, { width: 15, alignment: AlignmentType.CENTER, shading: getETColor(et) }),
          createCell(centile, { width: 15, alignment: AlignmentType.CENTER }),
        ]}))
      })

      children.push(
        new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: tableRows }),
        new Paragraph({ children: [] }),
      )
    }

    // ===== SAUT DE PAGE =====
    children.push(new Paragraph({ children: [new PageBreak()] }))

    // ===== SYNTHÈSE (texte généré par Claude) =====
    children.push(createSectionTitle("SYNTHÈSE ET CONCLUSIONS"))
    generatedCRBO.split('\n').forEach(line => {
      const trimmedLine = line.trim()
      if (!trimmedLine) {
        children.push(new Paragraph({ children: [] }))
        return
      }
      const isSectionHeader = /^[A-ZÉÈÀÊÂÎÔÛÇ\s]+:$/.test(trimmedLine)
      children.push(new Paragraph({
        children: [new TextRun({ 
          text: trimmedLine, 
          size: FONT_SIZE_NORMAL, 
          font: FONT, 
          bold: isSectionHeader,
          color: isSectionHeader ? COLOR_GREEN : undefined 
        })],
        spacing: { after: isSectionHeader ? 100 : 60 },
      }))
    })

    // ===== SIGNATURE =====
    children.push(
      new Paragraph({ children: [] }),
      new Paragraph({
        alignment: AlignmentType.RIGHT,
        children: [new TextRun({ text: `Fait à ${formData.ortho_ville}, le ${bilanDateFormatted}`, size: FONT_SIZE_NORMAL, font: FONT })],
        spacing: { before: 400 },
      }),
      new Paragraph({
        alignment: AlignmentType.RIGHT,
        children: [new TextRun({ text: formData.ortho_nom, size: FONT_SIZE_NORMAL, font: FONT, bold: true })],
      }),
      new Paragraph({
        alignment: AlignmentType.RIGHT,
        children: [new TextRun({ text: "Orthophoniste", size: FONT_SIZE_NORMAL, font: FONT, italics: true })],
      }),
    )

    // ===== CRÉER ET TÉLÉCHARGER =====
    const doc = new Document({
      sections: [{
        properties: { page: { margin: { top: 720, right: 720, bottom: 720, left: 720 } } },
        children,
      }],
    })

    const blob = await Packer.toBlob(doc)
    saveAs(blob, `CRBO_${formData.patient_prenom}_${formData.patient_nom}_${new Date().toISOString().split('T')[0]}.docx`)
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
              setShowResult(false)
              setGeneratedCRBO('')
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

  return (
    <div className="max-w-3xl mx-auto">
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
              <h2 className="text-xl font-semibold text-gray-900">Vos coordonnées</h2>
              <p className="mt-1 text-sm text-gray-500">Ces informations apparaîtront sur le CRBO</p>
            </div>

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
              <h2 className="text-xl font-semibold text-gray-900">Médecin prescripteur & Motif</h2>
              <p className="mt-1 text-sm text-gray-500">Informations sur la prescription</p>
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
              <h2 className="text-xl font-semibold text-gray-900">Anamnèse</h2>
              <p className="mt-1 text-sm text-gray-500">Entrez vos notes librement, l'IA les reformulera</p>
            </div>

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
          </div>
        )}

        {/* Step 5: Résultats */}
        {currentStep === 5 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Résultats des tests</h2>
              <p className="mt-1 text-sm text-gray-500">Sélectionnez les tests utilisés et entrez les résultats</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tests utilisés *</label>
              <div className="grid sm:grid-cols-2 gap-2">
                {TESTS_OPTIONS.map(test => (
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
                placeholder="Enfant coopérant mais fatigable. Nombreuses autocorrections en lecture..."
              />
            </div>
          </div>
        )}

        {/* Navigation buttons */}
        <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
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
