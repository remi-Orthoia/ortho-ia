'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
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
import { saveDraftToDb, deleteDraftFromDb, autoUpsertPatientFromDraft } from '@/lib/draft-sync'
import FileDropZone from '@/components/FileDropZone'
import ShareCRBOButton from '@/components/ShareCRBOButton'
import MicButton from '@/components/MicButton'
import MocaScoresInput from '@/components/forms/MocaScoresInput'
import BetlScoresInput from '@/components/forms/BetlScoresInput'
import PredimemScoresInput from '@/components/forms/PredimemScoresInput'
import ExamathScoresInput from '@/components/forms/ExamathScoresInput'
import Evaleo615ScoresInput from '@/components/forms/Evaleo615ScoresInput'
import Evalo26ScoresInput from '@/components/forms/Evalo26ScoresInput'
import Exalang36ScoresInput from '@/components/forms/Exalang36ScoresInput'
import Exalang58ScoresInput from '@/components/forms/Exalang58ScoresInput'
import Exalang811ScoresInput from '@/components/forms/Exalang811ScoresInput'
import Exalang1115ScoresInput from '@/components/forms/Exalang1115ScoresInput'
import PrediFexScoresInput from '@/components/forms/PrediFexScoresInput'
import BecdScoresInput from '@/components/forms/BecdScoresInput'
import BiaScoresInput from '@/components/forms/BiaScoresInput'
import PrediLacScoresInput from '@/components/forms/PrediLacScoresInput'
import ExalangLyfacScoresInput from '@/components/forms/ExalangLyfacScoresInput'
import { TESTS_WITH_SPECIFIC_FORM, getComplementarySuggestions, TEST_FAMILIES } from '@/lib/test-pairings'
import { isBetaDisabled } from '@/lib/bilan-registry'
import { saveMathBilanHandoff } from '@/lib/bilans/math/handoff'
import DemoAutofillButton from '@/components/DemoAutofillButton'
import { DEMO_LANGAGE_FIXTURE } from '@/lib/demo-autofill'
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
  FileUp,
  Calculator,
  ArrowUpRight,
  X
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

// Refonte 2026-06 (audit UX) : fusion des anciens steps 1 (Patient) et 2
// (Médecin & motif) en un seul step "Dossier" — c'est de la saisie froide,
// l'éclater en 2 écrans n'ajoutait aucune valeur clinique (-1 étape, -1 clic).
const STEPS = [
  { id: 1, name: 'Dossier',   description: 'Patient, médecin, motif' },
  { id: 2, name: 'Anamnèse',  description: 'Notes cliniques' },
  { id: 3, name: 'Résultats', description: 'Tests & scores' },
]
const TOTAL_STEPS = STEPS.length

// Clé localStorage scopee par user.id pour eviter qu'un brouillon ortho A
// fuite vers ortho B sur le meme navigateur (poste partage en cabinet).
// La clé globale legacy etait juste `ortho-ia:crbo-draft` et est purgee a
// la 1ere connexion pour ne plus jamais polluer.
const LEGACY_DRAFT_KEY = 'ortho-ia:crbo-draft'
const DRAFT_KEY_PREFIX = 'ortho-ia:crbo-draft:'
// Brouillons > 30j : on les considere abandonnes et on purge silencieusement
// pour eviter qu'un ancien brouillon ressurgisse plusieurs mois apres.
const DRAFT_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000

/** Motifs de consultation proposés en multi-sélection à l'étape 2.
 *  Le LLM reformule la sélection en 1-2 phrases fluides via la règle
 *  motif_reformule du system-base. */
const MOTIF_OPTIONS = ['Langage oral', 'Langage écrit', 'Langage écrit & oral', 'Cognitif', 'Maths', 'OMF'] as const

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
  // Steps 1-2 = en séance (Dossier, Anamnèse).
  // Step 3 = post-séance (Résultats).
  if (step <= 2) {
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

  // Mode focus auto sur l'étape Anamnèse (step 2 depuis refonte 2026-06,
  // anciennement step 3). Cache la sidebar + header + bouton feedback,
  // centre la zone d'édition. L'ortho entre en "écriture profonde".
  // Désactivé dès qu'elle change d'étape.
  useFocusMode(currentStep === 2)

  // Auto-scroll en haut de l'écran à chaque changement d'étape — déclenché
  // APRÈS le re-render et APRÈS l'effet useFocusMode (qui modifie la
  // hauteur du DOM via le toggle de la sidebar/header). On utilise un
  // double requestAnimationFrame pour garantir que le layout est figé
  // avant le scroll, sinon le scroll smooth peut être annulé par le
  // reflow du focus mode (cas typique : passage de l'étape 3 à 4).
  useEffect(() => {
    if (typeof window === 'undefined') return
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' })
      })
    })
  }, [currentStep])
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
  // Cle localStorage scopee par user.id — initialisee une fois user connu.
  // Tant que null : persistDraft est no-op (evite d'ecrire dans une cle
  // globale qui pourrait fuiter d'un ortho a l'autre).
  const [draftKey, setDraftKey] = useState<string | null>(null)
  // Un autre onglet vient de generer (DRAFT_KEY supprime via storage event)
  // → cet onglet bascule en lecture seule : auto-save desactive + banniere
  // d'erreur. Refs en parallele pour que persistDraft (debounce + interval)
  // lise toujours la valeur fraiche, meme si son closure est perime.
  const [staleTab, setStaleTab] = useState(false)
  const staleTabRef = useRef(false)
  // Le toast d'erreur quota n'est emis qu'une fois par session — sinon
  // chaque tick 15s spammerait l'ortho avec le meme message.
  const quotaErrorShownRef = useRef(false)
  // Audit 2026-05-29 (fuite cross-patient) : sur App Router, naviguer entre
  // /nouveau-crbo?reprendre=1 → /nouveau-crbo (clic sidebar) re-run le
  // useEffect SANS re-mount du composant. La branche else purgeait
  // localStorage mais laissait le formData React rempli avec patient A.
  // On track la presence de params "intent-to-prefill" entre deux runs et
  // on RESET le formulaire quand on passe de "avec intent" a "sans intent"
  // — c'est exactement le geste utilisateur "je veux un nouveau bilan".
  const prevHadIntentParamRef = useRef<boolean>(false)
  // Skip-once : pour les router.replace internes (cleanup d'URL apres
  // prefill HappyNeuron) qui ne sont PAS des intentions utilisateur de
  // commencer un nouveau bilan. Set par le code de prefill juste avant
  // router.replace, lu et clear au run suivant.
  const skipResetOnceRef = useRef<boolean>(false)
  // Track le ?patient= courant pour detecter les transitions A→B et
  // resetter avant de selectionner le nouveau patient (sinon motif /
  // anamnese / tests de A se melangent avec patient B via le ...prev).
  const prevPatientIdRef = useRef<string | null>(null)
  const [importingAnamnese, setImportingAnamnese] = useState(false)
  const [prefillBanner, setPrefillBanner] = useState<string>('')
  // État des accordéons de familles de tests dans l'étape Résultats.
  // undefined = pas de choix explicite de l'ortho → auto-open si la famille
  // contient au moins un test coché ; true/false = choix explicite.
  const [openFamilies, setOpenFamilies] = useState<Record<string, boolean | undefined>>({})

  // Upload bilan initial EXTERNE (PDF/Word rédigé en dehors d'ortho-ia).
  // Utilisé en renouvellement quand aucun CRBO interne n'est trouvé pour
  // ce patient. L'extraction côté serveur peuple bilan_precedent_structure.
  const [uploadingPreviousBilan, setUploadingPreviousBilan] = useState(false)
  const [previousBilanFilename, setPreviousBilanFilename] = useState<string | null>(null)

  // Patient selection
  const [patients, setPatients] = useState<Patient[]>([])
  const [selectedPatientId, setSelectedPatientId] = useState<string>('')
  const [showNewPatientForm, setShowNewPatientForm] = useState(false)
  const [showPatientGrid, setShowPatientGrid] = useState(false)

  // Audit 2026-05-29 (amelioration #2) — suggestion automatique de basculer
  // en renouvellement quand un bilan precedent existe pour ce patient. Permet
  // d'eviter que l'ortho cree un nouveau bilan initial alors qu'elle aurait
  // pu beneficier de la comparaison auto avec son bilan precedent.
  const [previousCrboHint, setPreviousCrboHint] = useState<{
    id: string; date: string; test_utilise: string
  } | null>(null)

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

  /**
   * Agrégation multi-tests : chaque formulaire spécifique écrit dans son
   * propre slot (clé = nom du test). Un useEffect concatène tous les slots
   * dans formData.resultats_manuels, séparés par des délimiteurs clairs
   * "=== <Test> ===" pour que Claude organise un CRBO par test.
   *
   * Mode mono-test : un seul slot, la chaîne est directement reportée dans
   * resultats_manuels (pas de délimiteur supplémentaire — déjà géré dans
   * chaque composant via son propre en-tête "=== MoCA — Screening ===").
   *
   * Mode multi-test : plusieurs slots, concaténés dans l'ordre où l'ortho
   * a coché les tests.
   *
   * Tests sans formulaire spécifique : la saisie passe par le textarea
   * générique qui écrit directement dans resultats_manuels via setFormData
   * → on remet alors perTestResults à vide pour éviter d'écraser.
   */
  const [perTestResults, setPerTestResults] = useState<Record<string, string>>({})

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
    medecin_date_prescription: '',
    motif: '',
    anamnese: '',
    test_utilise: [],
    resultats_manuels: '',
    notes_analyse: '',
    // Defaut : bilan synthetique (2-3 pages, essentiel). L'ortho peut basculer
    // sur "Complet" via le toggle a l'etape Resultats si elle veut le 4-6 pages.
    format_crbo: 'synthetique',
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
        ortho_adeli_rpps: profile.adeli_rpps || '',
      }))
      setProfileChecked(true)

      // ============ Detection des transitions URL → reset defensif ============
      // Audit 2026-05-29 : sur App Router, naviguer entre /nouveau-crbo?reprendre=1
      // et /nouveau-crbo (clic sidebar) re-run le useEffect SANS re-mount. La
      // branche else purgeait localStorage mais laissait le formData rempli avec
      // le patient precedent. On detecte ici deux transitions critiques :
      //  1. intent param → pas d'intent param (ortho clique "Nouveau CRBO")
      //  2. ?patient=A → ?patient=B (changement de patient depuis URL)
      // Dans les deux cas on appelle handleResetFormForNewPatient AVANT toute
      // logique de pre-fill, pour partir d'un state propre.
      const currentPatientId = searchParams.get('patient')
      const hasIntentParam = !!(
        searchParams.get('reprendre') === '1' ||
        currentPatientId ||
        searchParams.get('renouvellement') ||
        searchParams.get('prefill') ||
        searchParams.get('voice') === '1'
      )
      const prevHadIntent = prevHadIntentParamRef.current
      const skipThisReset = skipResetOnceRef.current
      // Met a jour les refs AVANT de potentiellement reset (pour eviter
      // un loop infini si reset declenche un re-render qui re-trigger useEffect).
      skipResetOnceRef.current = false
      prevHadIntentParamRef.current = hasIntentParam

      // Transition #1 : intent → no-intent. Skip si juste apres un router.replace
      // interne (cleanup d'URL post-prefill, pas une intention utilisateur).
      if (prevHadIntent && !hasIntentParam && !skipThisReset) {
        handleResetFormForNewPatient()
      }

      // Transition #2 : ?patient=A → ?patient=B. handleSelectPatient utilise
      // {...prev} ce qui melange motif/anamnese/tests de A avec B. Reset
      // explicite avant que handleSelectPatient soit appele plus bas.
      const prevPatientId = prevPatientIdRef.current
      prevPatientIdRef.current = currentPatientId
      if (prevPatientId && currentPatientId && prevPatientId !== currentPatientId) {
        handleResetFormForNewPatient()
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

      // Voice command prefill (?voice=1 + sessionStorage 'orthoia.voice-prefill')
      // retire 2026-06-04 avec la fonctionnalite "Demarrer en vocal" (cf.
      // VoiceCommandButton supprime du dashboard). Le code ci-dessus etait
      // dead, voiceVerb n'etait jamais relu, le bloc d'hydration ne servait
      // qu'au bouton vocal supprime.

      // Cle de brouillon scopee par user.id (eviter fuites entre orthos sur
      // poste partage). Une fois posee, persistDraft peut s'executer.
      const scopedKey = `${DRAFT_KEY_PREFIX}${user.id}`
      setDraftKey(scopedKey)
      // One-shot : purge la cle globale legacy (potentiellement croisee
      // entre orthos qui ont partage ce navigateur avant le fix).
      try { localStorage.removeItem(LEGACY_DRAFT_KEY) } catch {}

      // Auto-restore SUR DEMANDE EXPLICITE uniquement.
      // Historique du bug 2026-05-26 : l'ancien comportement restaurait
      // silencieusement un brouillon localStorage au montage, ce qui faisait
      // fuiter les donnees du patient A dans le formulaire du patient B
      // quand l'ortho ouvrait /dashboard/nouveau-crbo pour un nouveau patient.
      //
      // Nouvelle regle (2026-05-27) :
      //  - Ortho clique "Reprendre" sur le bandeau dashboard -> arrive ici
      //    avec ?reprendre=1 -> on charge le brouillon localStorage.
      //  - Ortho ouvre /dashboard/nouveau-crbo via sidebar / bookmark / URL
      //    directe -> on PURGE le brouillon et on demarre frais (anti-fuite
      //    patient).
      //
      // Combinaison reprise + auto-save (15s) = travail jamais perdu sans
      // friction d'action manuelle, et zero fuite patient.
      const prefillIdFromUrl = searchParams.get('prefill')
      const wantsReprendre = searchParams.get('reprendre') === '1'
      if (wantsReprendre) {
        try {
          // 1. Tente d'abord la DB (filet multi-device). On compare avec
          //    localStorage et on prend le plus recent — couvre le cas
          //    "ortho a saisi sur PC A, ferme l'onglet, ouvre sur PC B".
          const { loadDraftFromDb, pickFreshestSource } = await import('@/lib/draft-sync')
          const dbDraft = await loadDraftFromDb<{
            step?: number
            formData?: CRBOFormData
            savedAt?: number
          }>(user.id, 'langage')
          const raw = localStorage.getItem(scopedKey)
          let localDraft: { step?: number; formData?: CRBOFormData; savedAt?: number } | null = null
          if (raw) {
            try { localDraft = JSON.parse(raw) } catch { localDraft = null }
          }
          const source = pickFreshestSource(
            localDraft?.savedAt ?? null,
            dbDraft?.updatedAt ?? null,
          )
          const draft = source === 'db' && dbDraft ? dbDraft.data : localDraft
          if (draft && draft.formData) {
            const savedAt = draft.savedAt || (source === 'db' && dbDraft ? new Date(dbDraft.updatedAt).getTime() : 0)
            const ageMs = savedAt ? Date.now() - savedAt : 0
            if (!savedAt || ageMs <= DRAFT_MAX_AGE_MS) {
              setFormData(prev => ({ ...prev, ...draft.formData! }))
              if (typeof draft.step === 'number' && draft.step >= 1 && draft.step <= 4) {
                // Mapping rétrocompat brouillons 4 étapes → 3 étapes (audit
                // UX 2026-06 : fusion anciens steps 1+2 en "Dossier"). Sans
                // ce mapping, un brouillon stocké au step 2 ouvrirait sur le
                // step 2 nouveau (Anamnèse) au lieu de Dossier.
                const migrated = draft.step <= 2 ? 1 : draft.step - 1
                setCurrentStep(migrated)
              }
              const sourceLabel = source === 'db' ? ' (récupéré depuis votre compte)' : ''
              setPrefillBanner(`Brouillon repris${sourceLabel}. Vos modifications sont sauvegardées toutes les 15 secondes.`)
            } else {
              // Trop ancien -> purge defensif local + DB
              try { localStorage.removeItem(scopedKey) } catch {}
            }
          }
        } catch {
          // localStorage corrompu OU DB inaccessible : on ignore et on
          // demarre frais. L'ortho peut toujours retaper.
        }
      } else {
        // Pas de demande explicite de reprise -> purge defensive locale.
        // Note : on garde le draft DB pour permettre une reprise multi-device
        // si l'ortho clique "Reprendre" depuis un autre appareil ensuite.
        try { localStorage.removeItem(scopedKey) } catch {}
      }

      // Pré-remplissage renouvellement : on charge le CRBO précédent en
      // best-effort. Si le fetch échoue, l'ortho voit juste un form normal
      // avec bilan_type=renouvellement (toujours préférable à 0 prefill).
      if (renouvellementId) {
        try {
          const { data: prevCrbo } = await supabase
            .from('crbos')
            .select('id, bilan_date, anamnese, structure_json, medecin_nom, medecin_tel, medecin_date_prescription, motif, patient_classe, test_utilise')
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
              medecin_date_prescription: prev.medecin_date_prescription || prevCrbo.medecin_date_prescription || '',
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

          // On nettoie l'URL pour éviter de re-charger au refresh.
          // skipResetOnceRef : ce router.replace va re-trigger useEffect avec
          // hasIntentParam=false, ce qui declencherait un reset defensif et
          // wiperait le prefill HappyNeuron qu'on vient de poser. On signale
          // au prochain run de SKIP le reset une fois.
          skipResetOnceRef.current = true
          router.replace('/dashboard/nouveau-crbo')
        }
      }
    }

    loadUserProfile()
  }, [searchParams, router])

  const persistDraft = () => {
    // Pas de cle = user pas encore charge. Pas de save tant que la cle n'est
    // pas scopee par user.id (eviter ecriture dans une cle globale qui
    // pourrait fuiter d'un ortho a l'autre).
    if (!draftKey) return false
    // Onglet stale (autre onglet a deja genere ce brouillon) : on ne re-ecrit
    // pas, sinon on ressuscite un brouillon fantome qui reapparaitra ensuite.
    if (staleTabRef.current) return false
    try {
      const { audio_file, resultats_pdf, ...serializable } = formData
      // Ne rien sauvegarder si rien n'a été saisi (état initial vide).
      // Check elargi : tout champ texte non vide ou tableau de tests rempli
      // declenche la sauvegarde (avant on ne checkait que 5 champs et donc
      // un draft avec juste medecin + tests etait perdu).
      const hasContent = !!(
        serializable.patient_prenom?.trim() ||
        serializable.patient_nom?.trim() ||
        serializable.patient_classe?.trim() ||
        serializable.medecin_nom?.trim() ||
        serializable.medecin_tel?.trim() ||
        serializable.motif?.trim() ||
        serializable.anamnese?.trim() ||
        serializable.resultats_manuels?.trim() ||
        serializable.notes_analyse?.trim() ||
        serializable.comportement_seance?.trim() ||
        (Array.isArray(serializable.test_utilise) && serializable.test_utilise.length > 0)
      )
      if (!hasContent) return false
      // Flash "Sauvegarde…" pendant ~500ms pour confirmer visuellement chaque
      // sauvegarde. Sans ça, l'ortho n'a aucun feedback que sa frappe est
      // sécurisée.
      setSavingFlash(true)
      // savedAt : horodatage pour la banniere de restauration + purge >30j.
      const payload = {
        step: currentStep,
        formData: serializable,
        savedAt: Date.now(),
      }
      localStorage.setItem(draftKey, JSON.stringify(payload))
      setLastSavedAt(Date.now())
      setTimeout(() => setSavingFlash(false), 500)
      // Sync DB best-effort en background. Si la DB est down, le draft
      // reste sauve en localStorage et l'ortho ne voit aucune difference.
      // Lecture du user.id depuis draftKey ('ortho-ia:crbo-draft:{user.id}').
      const userId = draftKey.split(':').pop() ?? ''
      if (userId) {
        saveDraftToDb(userId, 'langage', payload, currentStep).catch(() => null)
      }
      return true
    } catch (e) {
      setSavingFlash(false)
      // QuotaExceededError (localStorage plein) ou autre erreur de stockage :
      // on previent l'ortho via toast UNE SEULE FOIS — sinon chaque tick 15s
      // re-emettrait un toast et noierait l'ecran.
      if (!quotaErrorShownRef.current) {
        quotaErrorShownRef.current = true
        try {
          toast.error("Stockage navigateur plein — sauvegarde locale impossible. Telechargez votre Word des que possible.")
        } catch {}
      }
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

  // Auto-save REACTIVE (2026-05-27) avec scope par user.id + reprise sur
  // demande explicite (?reprendre=1). Historique : auto-save desactive
  // 2026-05-26 a cause d'une fuite patient via l'auto-restore silencieux.
  // Le fix est de coupler la reprise a un parametre URL explicit, et
  // l'auto-save peut donc reprendre son rythme sans risque.
  //
  // Debounce : 15s d'inactivite apres la derniere frappe. Pourquoi pas
  // moins : ecriture localStorage est synchrone et bloque le main thread
  // (~5-20ms sur draft volumineux). Debounce court = micro-jank a chaque
  // frappe. Pourquoi pas plus : si l'ortho ferme l'onglet ou perd sa
  // session, on veut au pire 15s de perdues, pas 1 min.
  //
  // No-op tant que draftKey est null (auth pas resolue) ou que l'onglet
  // est stale (autre onglet vient de sauvegarder).
  useEffect(() => {
    if (!draftKey || staleTab) return
    const handle = setTimeout(() => {
      persistDraft()
    }, 15_000)
    return () => clearTimeout(handle)
  }, [formData, currentStep, draftKey, staleTab])

  // Tick 1s pour rafraîchir le "sauvegardé il y a X s"
  useEffect(() => {
    const id = setInterval(() => setNowTick(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])

  // Sync staleTab state → ref pour que persistDraft (closure perime dans le
  // setTimeout du debounce) lise toujours la valeur fraiche.
  useEffect(() => { staleTabRef.current = staleTab }, [staleTab])

  /** Auto-creation du patient au carnet — debounce 2s pour eviter le spam DB
   *  pendant la saisie de prenom/nom caractere par caractere. Idempotent via
   *  un Set "prenom|nom" deja tentes. Best-effort silencieux : ne bloque
   *  jamais le save du draft. Cf. autoUpsertPatientFromDraft pour le detail.
   *
   *  Pourquoi : un ortho qui commence un CRBO sur Lea ne s'attend pas a devoir
   *  ajouter Lea manuellement dans son carnet — elle devrait apparaitre
   *  automatiquement des qu'elle est saisie. Sinon l'ortho perd du temps en
   *  double saisie ET le patient n'est pas auto-suggere dans les prochains CRBO. */
  const patientAutoUpsertTriedRef = useRef<Set<string>>(new Set())
  useEffect(() => {
    if (!draftKey || staleTabRef.current) return
    const userId = draftKey.split(':').pop() ?? ''
    if (!userId) return
    const prenom = (formData.patient_prenom ?? '').trim()
    const nom = (formData.patient_nom ?? '').trim()
    if (!prenom || !nom) return
    const sigKey = `${prenom.toLowerCase()}|${nom.toLowerCase()}`
    if (patientAutoUpsertTriedRef.current.has(sigKey)) return
    const handle = setTimeout(() => {
      patientAutoUpsertTriedRef.current.add(sigKey)
      autoUpsertPatientFromDraft(userId, {
        prenom,
        nom,
        date_naissance: formData.patient_ddn || null,
        classe: formData.patient_classe || null,
        medecin_nom: formData.medecin_nom || null,
        medecin_tel: formData.medecin_tel || null,
      }).catch(() => null)
    }, 2000)
    return () => clearTimeout(handle)
  }, [
    draftKey,
    formData.patient_prenom,
    formData.patient_nom,
    formData.patient_ddn,
    formData.patient_classe,
    formData.medecin_nom,
    formData.medecin_tel,
  ])

  // Multi-onglets : si un autre onglet modifie ou supprime le brouillon, on
  // le detecte via l'event 'storage' (firefox/chrome emettent l'event UNIQUEMENT
  // sur les AUTRES onglets, jamais sur celui qui a ecrit — donc pas de boucle
  // infinie). Deux cas :
  //   - e.newValue === null  → un autre onglet a genere (cleanup post-INSERT)
  //                             ou supprime manuellement → ce onglet devient stale
  //   - e.newValue contient un draft → un autre onglet a sauvegarde, on
  //                                     reabsorbe pour rester sync
  useEffect(() => {
    if (!draftKey || typeof window === 'undefined') return
    const onStorage = (e: StorageEvent) => {
      if (e.key !== draftKey) return
      if (e.newValue === null) {
        // Autre onglet a genere ou supprime → cet onglet ne doit plus rien
        // ecrire (sinon ressuscite un brouillon fantome).
        setStaleTab(true)
        setError("Ce CRBO vient d'etre genere ou supprime dans un autre onglet — fermez cet onglet pour eviter d'ecraser des donnees.")
        return
      }
      // ⚠️ Restauration cross-tab de formData desactivee (2026-05-26) :
      // l'ancien comportement absorbait silencieusement les changements
      // localStorage d'autres onglets, ce qui pouvait fuiter les donnees
      // d'un patient sur le formulaire en cours. Avec l'autosave desactive,
      // aucun draft ne devrait etre ecrit, mais on bloque defensivement
      // toute tentative de restauration silencieuse depuis localStorage.
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [draftKey])

  // Raccourci clavier Cmd/Ctrl + Entrée pour générer depuis l'étape Résultats
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (
        (e.metaKey || e.ctrlKey) &&
        e.key === 'Enter' &&
        currentStep === 3 &&
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

  // Auto-déploiement de la famille "Adultes & seniors" à partir de 45 ans —
  // à cet âge, le bilan est quasi-systématiquement neuro/aphasie/mémoire, pas
  // un bilan langage écrit pédiatrique. Pour les patients plus jeunes, toutes
  // les familles restent fermées par défaut (langage oral vs écrit vs math
  // dépend du contexte clinique, l'âge seul ne suffit pas à trancher).
  // L'ortho garde toujours la main pour ouvrir une autre famille.
  const suggestedFamilyId: string | null = (() => {
    if (!formData.patient_ddn) return null
    const birth = new Date(formData.patient_ddn)
    const bilan = new Date(formData.bilan_date || new Date().toISOString())
    let years = bilan.getFullYear() - birth.getFullYear()
    const m = bilan.getMonth() - birth.getMonth()
    if (m < 0 || (m === 0 && bilan.getDate() < birth.getDate())) years--
    if (!Number.isFinite(years) || years < 0) return null
    return years >= 45 ? 'adulte' : null
  })()

  // Sélectionner un patient existant
  const handleSelectPatient = (patient: Patient) => {
    setSelectedPatientId(patient.id)
    setShowNewPatientForm(false)
    setShowPatientGrid(false)
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

  // Audit 2026-05-29 (amelioration #2) — detection auto d'un CRBO precedent
  // pour ce patient. Si bilan_type est 'initial' mais qu'il y a un bilan
  // anterieur en DB, on propose a l'ortho de basculer en renouvellement
  // via un banner discret. Evite qu'elle oublie de cocher renouvellement
  // et passe a cote du tableau comparatif auto + synthese_evolution.
  useEffect(() => {
    const detectPreviousCrbo = async () => {
      if (
        !selectedPatientId ||
        !formData.patient_prenom?.trim() ||
        !formData.patient_nom?.trim() ||
        formData.bilan_type === 'renouvellement'
      ) {
        setPreviousCrboHint(null)
        return
      }
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return
        const { data } = await supabase
          .from('crbos')
          .select('id, bilan_date, test_utilise')
          .eq('user_id', user.id)
          .eq('patient_prenom', formData.patient_prenom)
          .eq('patient_nom', formData.patient_nom)
          .order('bilan_date', { ascending: false })
          .limit(1)
          .maybeSingle()
        if (data) {
          setPreviousCrboHint({
            id: data.id,
            date: data.bilan_date,
            test_utilise: typeof data.test_utilise === 'string' ? data.test_utilise : '',
          })
        } else {
          setPreviousCrboHint(null)
        }
      } catch {
        setPreviousCrboHint(null)
      }
    }
    detectPreviousCrbo()
  }, [selectedPatientId, formData.patient_prenom, formData.patient_nom, formData.bilan_type])

  /** Bascule en mode renouvellement avec le CRBO precedent detecte. Equivalent
   *  manuel de l'URL ?renouvellement=<crboId>. */
  const handleSwitchToRenouvellement = () => {
    if (!previousCrboHint) return
    setFormData(prev => ({
      ...prev,
      bilan_type: 'renouvellement',
      bilan_precedent_id: previousCrboHint.id,
    }))
    // L'effect handleImportPreviousAnamnese chargera la structure complete
    // au prochain cycle, evitant la duplication de logique.
    setPreviousCrboHint(null)
  }

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
      // test_hint (amelioration #1) : permet au serveur de router vers
      // l'extracteur specifique au test si dispo (ex: EVALEO 6-15 →
      // EVALEO_EXTRACT_TOOL au lieu du generique). Preserve classes
      // officielles + effets + erreurs lors de l'import du PDF precedent.
      const tests = Array.isArray(formData.test_utilise)
        ? formData.test_utilise.join(', ')
        : (formData.test_utilise || '')
      if (tests) fd.append('test_hint', tests)
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
    // Strip tout préfixe "Dr.", "Dr", "Docteur" tapé/collé par l'ortho —
    // le préfixe "Dr." est affiché en dur à gauche du champ (UI) et
    // re-ajouté au rendu Word/PDF. La valeur stockée doit être le nom
    // propre seul (ex. "Bernard", "Marie-Claire Vidal").
    const stripped = e.target.value.replace(/^\s*(?:dr\.?|docteur)\s+/i, '')
    const value = stripped
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
    const wasSelected = formData.test_utilise.includes(test)
    // Beta : bloquer la sélection des bilans non encore validés. On laisse
    // toujours la possibilité de DÉSÉLECTIONNER (au cas où un draft contienne
    // un test devenu disabled depuis), mais pas de cocher un nouveau bilan
    // bloqué.
    if (!wasSelected && isBetaDisabled(test)) {
      toast.info('Ce bilan sera disponible prochainement (validation en cours).')
      return
    }
    setFormData(prev => ({
      ...prev,
      test_utilise: prev.test_utilise.includes(test)
        ? prev.test_utilise.filter(t => t !== test)
        : [...prev.test_utilise, test]
    }))
    // Si on désélectionne un test qui avait un formulaire spécifique, on
    // vide son slot pour éviter de réinjecter ses résultats dans le CRBO.
    if (wasSelected && TESTS_WITH_SPECIFIC_FORM.has(test)) {
      setPerTestResults(prev => {
        const next = { ...prev }
        delete next[test]
        return next
      })
    }
  }

  /** Met à jour le slot d'un test spécifique avec sa string normalisée. */
  const handleTestSlotChange = (testName: string, normalized: string) => {
    setPerTestResults(prev => {
      // Si la valeur est inchangée, ne pas re-render — évite des boucles.
      if (prev[testName] === normalized) return prev
      return { ...prev, [testName]: normalized }
    })
  }

  /** Agrégation perTestResults → resultats_manuels.
   *  Concatène uniquement les slots non vides des tests SÉLECTIONNÉS, dans
   *  l'ordre de cochage. En mono-test, équivalent au comportement actuel ;
   *  en multi-test, produit un bloc par test (chaque slot a déjà son
   *  en-tête "=== <Test> ==="). */
  useEffect(() => {
    const selectedWithForm = formData.test_utilise.filter(t => TESTS_WITH_SPECIFIC_FORM.has(t))
    if (selectedWithForm.length === 0) return
    const slots = selectedWithForm
      .map(t => (perTestResults[t] || '').trim())
      .filter(s => s.length > 0)
    if (slots.length === 0) {
      // Aucun slot rempli — ne pas écraser un textarea générique éventuel.
      return
    }
    const aggregated = slots.join('\n\n')
    setFormData(prev => prev.resultats_manuels === aggregated ? prev : { ...prev, resultats_manuels: aggregated })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [perTestResults, formData.test_utilise.join(',')])

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
  //
  // Coeur de la logique factorisé hors du handler d'event pour pouvoir être
  // appelé aussi depuis le drag-and-drop (FileDropZone).
  const processPDFFiles = async (files: File[]) => {
    if (files.length === 0) return

    if (files.length > 3) {
      setError('Maximum 3 fichiers à la fois.')
      return
    }
    for (const f of files) {
      if (!f.type.includes('pdf') && !f.type.includes('image')) {
        setError(`Format non supporté pour "${f.name}". Utilisez un PDF ou une image (PNG, JPG).`)
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
    }
  }

  const handleExtractPDF = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    await processPDFFiles(files)
    // Reset l'input pour permettre de réimporter les mêmes fichiers
    e.target.value = ''
  }

  const nextStep = () => {
    if (currentStep < TOTAL_STEPS) {
      // Validation explicite par etape — les boutons "Suivant" ne sont pas
      // submit de form, donc le `required` HTML5 ne se declenche pas seul.
      // Refonte 2026-06 : Patient + Médecin & motif fusionnes en step 1
      // "Dossier", donc la validation date de prescription se declenche
      // desormais au passage step 1 -> step 2 (Anamnese).
      if (currentStep === 1) {
        if (!formData.medecin_date_prescription) {
          setError('Veuillez renseigner la date de prescription pour continuer.')
          return
        }
      }
      setError('')
      setCurrentStep(prev => prev + 1)
      playDing() // micro-feedback satisfaisant à chaque étape franchie
      // Le scroll en haut est géré par le useEffect [currentStep] plus haut
      // (double rAF pour attendre le reflow du focus mode).
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
      // Le scroll en haut est géré par le useEffect [currentStep] plus haut.
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
    try { if (draftKey) localStorage.removeItem(draftKey) } catch {}
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
      medecin_date_prescription: '',
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
    // Le scroll en haut est géré par le useEffect [currentStep] plus haut.
  }

  const handleGenerate = async () => {
    // Anti double-click
    if (generating) return

    // ============ Coherence patient ↔ formulaire (defense in depth) ============
    // Garde-fou contre les rares cas ou le formData garde des donnees d'un
    // patient precedent malgre les fixes du useEffect (race condition, bug
    // futur, etat exotique). Si selectedPatientId pointe vers un patient
    // existant ET que ses prenom/nom ne matchent pas le form, on bloque
    // proactivement plutot que de generer un CRBO frankenstein.
    if (selectedPatientId) {
      const sel = patients.find(p => p.id === selectedPatientId)
      if (sel) {
        const formPrenom = (formData.patient_prenom || '').trim()
        const formNom = (formData.patient_nom || '').trim()
        const selPrenom = (sel.prenom || '').trim()
        const selNom = (sel.nom || '').trim()
        if (formPrenom !== selPrenom || formNom !== selNom) {
          setError(
            `Incoherence detectee : le patient selectionne (${selPrenom} ${selNom}) `
            + `ne correspond pas aux donnees du formulaire (${formPrenom} ${formNom}). `
            + `Cliquez "Changer" pour reselectionner, ou videz puis ressaisissez le patient.`,
          )
          return
        }
      }
    }

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
          format: formDataForSubmission.format_crbo || 'synthetique',
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        if (response.status === 401) {
          // Auto-save retire (cf. 2026-05-26 — fuite entre patients).
          // L'ortho devra resaisir apres reconnexion. Message ajuste.
          setError('Session expirée. Vous serez redirigé·e vers la page de connexion (la saisie en cours sera perdue).')
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
        // Clé scopée par user.id pour eviter qu'un autre onglet (meme user
        // a 2 sessions, ou poste partage) ne contamine ce handoff. Le
        // user.id est deja dispose via la session Supabase chargee plus
        // haut (presence de draftKey scopée = user resolu).
        const handoffUserId = draftKey?.split(':').pop() ?? ''
        const handoffKey = handoffUserId
          ? `ortho-ia:crbo-handoff:${handoffUserId}`
          : 'ortho-ia:crbo-handoff'
        sessionStorage.setItem(handoffKey, JSON.stringify(handoff))
        // Purge l'ancienne clé non-scopée si elle traine (migration douce).
        try { sessionStorage.removeItem('ortho-ia:crbo-handoff') } catch {}
        if (draftKey) localStorage.removeItem(draftKey)
        // Purge le draft DB en parallele : le CRBO est en phase 2 (synthesize),
        // plus besoin du brouillon. Best-effort silencieux.
        if (handoffUserId) {
          deleteDraftFromDb(handoffUserId, 'langage').catch(() => null)
        }
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
                previousStructure={formData.bilan_precedent_structure ?? null}
                previousBilanDate={formData.bilan_precedent_date ?? null}
                bilanDate={formData.bilan_date}
                testList={formData.test_utilise}
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
              try { if (draftKey) localStorage.removeItem(draftKey) } catch {}
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
                medecin_date_prescription: '',
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
                  previousStructure={formData.bilan_precedent_structure ?? null}
                  previousBilanDate={formData.bilan_precedent_date ?? null}
                  bilanDate={formData.bilan_date}
                  testList={formData.test_utilise}
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

      {/* Suggestion auto bilan precedent (amelioration #2). Visible quand un
          CRBO antérieur existe pour le même patient + bilan_type=initial.
          Un clic bascule en renouvellement + l'effect auto-import recupere
          la structure precedente pour activer le tableau comparatif Word. */}
      {previousCrboHint && currentStep <= TOTAL_STEPS && (
        <div className="mb-4 flex items-center justify-between gap-3 flex-wrap bg-amber-50 border border-amber-300 rounded-lg px-4 py-2.5">
          <div className="flex items-center gap-2 text-sm text-amber-900 min-w-0">
            <span aria-hidden>💡</span>
            <span className="leading-snug">
              <strong>Bilan précédent détecté</strong> pour ce patient ({new Date(previousCrboHint.date).toLocaleDateString('fr-FR')}
              {previousCrboHint.test_utilise ? ` · ${previousCrboHint.test_utilise.split(',')[0].trim()}` : ''}).
              Basculer en renouvellement active la comparaison automatique (tableau d&apos;évolution, synthèse progrès/régression).
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleSwitchToRenouvellement}
              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded transition whitespace-nowrap"
            >
              Basculer en renouvellement
            </button>
            <button
              type="button"
              onClick={() => setPreviousCrboHint(null)}
              className="text-xs text-amber-700 hover:text-amber-900 underline decoration-dotted whitespace-nowrap"
            >
              Ignorer
            </button>
          </div>
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
        <div className="shrink-0 pb-1 flex items-center gap-3">
          {/* Auto-remplissage démo : patient + motif + anamnèse + 1 test
              langage pour tester rapidement la génération. Visible uniquement
              pour demo@ortho-ia.fr. */}
          <DemoAutofillButton
            onFill={() => {
              setFormData(prev => ({ ...prev, ...DEMO_LANGAGE_FIXTURE }))
              setCurrentStep(4)
            }}
            label="Auto-remplir la démo"
          />
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
              <p className="mt-1 text-sm text-gray-500">Saisissez les informations patient, ou sélectionnez-en un dans votre carnet</p>
            </div>

            {/* Bandeau patient sélectionné */}
            {selectedPatientId && (
              <div className="flex items-center justify-between gap-3 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                <div className="flex items-center gap-2 text-sm text-green-900 min-w-0">
                  <span aria-hidden>👤</span>
                  <span className="truncate">
                    Patient sélectionné : <span className="font-semibold">{(formData.patient_nom || '').toUpperCase()} {formData.patient_prenom}</span>
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedPatientId('')
                    setShowPatientGrid(false)
                    setFormData(prev => ({
                      ...prev,
                      patient_prenom: '',
                      patient_nom: '',
                      patient_ddn: '',
                      patient_classe: '',
                    }))
                  }}
                  className="text-xs font-medium text-green-700 hover:text-green-900 underline decoration-dotted whitespace-nowrap"
                >
                  Changer
                </button>
              </div>
            )}

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

            {/* Formulaire patient — toujours visible */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Prénom *
                  {formData.bilan_type === 'renouvellement' && selectedPatientId && (
                    <span className="ml-1 text-xs text-gray-400">🔒 verrouillé</span>
                  )}
                </label>
                <input
                  type="text"
                  name="patient_prenom"
                  value={formData.patient_prenom}
                  onChange={handleChange}
                  required
                  readOnly={formData.bilan_type === 'renouvellement' && !!selectedPatientId}
                  className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 ${
                    formData.bilan_type === 'renouvellement' && selectedPatientId
                      ? 'bg-gray-50 dark:bg-surface-dark-muted text-gray-600 cursor-not-allowed'
                      : ''
                  }`}
                  placeholder="Delyss"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nom *
                  {formData.bilan_type === 'renouvellement' && selectedPatientId && (
                    <span className="ml-1 text-xs text-gray-400">🔒 verrouillé</span>
                  )}
                </label>
                <input
                  type="text"
                  name="patient_nom"
                  value={formData.patient_nom}
                  onChange={handleChange}
                  required
                  readOnly={formData.bilan_type === 'renouvellement' && !!selectedPatientId}
                  className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 ${
                    formData.bilan_type === 'renouvellement' && selectedPatientId
                      ? 'bg-gray-50 dark:bg-surface-dark-muted text-gray-600 cursor-not-allowed'
                      : ''
                  }`}
                  placeholder="Martin"
                />
              </div>
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

            {/* Bouton toggle grille des patients existants */}
            {patients.length > 0 && (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setShowPatientGrid(v => !v)}
                  className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition"
                >
                  {showPatientGrid ? (
                    <>
                      <X size={16} />
                      Fermer
                    </>
                  ) : (
                    <>
                      <span aria-hidden>👤</span>
                      Sélectionner un patient existant
                      <span className="text-xs text-gray-500">({patients.length})</span>
                    </>
                  )}
                </button>

                {showPatientGrid && (
                  <div className="mt-3 bg-gray-50 rounded-lg p-4">
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
                    </div>
                  </div>
                )}
              </div>
            )}
            {/* Séparateur visuel entre Patient et Médecin/Motif — fusion 2026-06 */}
            <div className="border-t border-gray-200 my-2" />

            <div>
              <h2 className="text-xl font-semibold text-gray-900">Médecin prescripteur & motif</h2>
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
                {/* Préfixe "Dr." en dur à gauche du champ (visuel uniquement).
                    Le handler handleMedecinNomChange strip déjà tout "Dr."
                    ou "Docteur" tapé/collé par l'ortho — la valeur stockée
                    est juste le nom propre (ex. "Bernard"). Le préfixe est
                    re-ajouté au rendu Word/PDF côté lib/word-export.ts via
                    formatMedecinDisplay(). */}
                <div className="flex w-full rounded-lg border border-gray-300 focus-within:ring-2 focus-within:ring-green-500 overflow-hidden">
                  <span className="inline-flex items-center px-3 bg-gray-100 text-gray-600 text-sm font-medium border-r border-gray-300 select-none">
                    Dr.
                  </span>
                  <input
                    type="text"
                    name="medecin_nom"
                    value={formData.medecin_nom}
                    onChange={handleMedecinNomChange}
                    required
                    list="medecin-nom-suggestions"
                    autoComplete="off"
                    className="flex-1 min-w-0 px-3 py-3 focus:outline-none"
                    placeholder="Bernard"
                  />
                </div>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Date de prescription *</label>
                <input
                  type="date"
                  name="medecin_date_prescription"
                  value={formData.medecin_date_prescription}
                  onChange={handleChange}
                  required
                  className="w-full sm:w-1/2 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
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

        {/* Step 2: Anamnèse (refonte 2026-06, ancien step 3) */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div>
              <StepPhaseBadge step={2} />
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
                          <FileDropZone
                            onFilesDropped={(files) => { if (files[0]) handleUploadPreviousBilan(files[0]) }}
                            accept=".pdf,.docx,.doc,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/msword"
                            multiple={false}
                            disabled={uploadingPreviousBilan}
                            overlayLabel="Déposez le bilan ici"
                            className="inline-block"
                          >
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
                          </FileDropZone>
                          <span style={{ fontSize: 12, color: 'var(--fg-3)' }}>
                            Cliquez ou glissez-déposez · PDF / .docx · max 10 Mo
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
                      patientPrenom={formData.patient_prenom}
                      patientNom={formData.patient_nom}
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
                      patientPrenom={formData.patient_prenom}
                      patientNom={formData.patient_nom}
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
                      patientPrenom={formData.patient_prenom}
                      patientNom={formData.patient_nom}
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

            {/* Bouton "Sauvegarder et reprendre plus tard" retire 2026-05-26 :
                le mecanisme alimentait l'auto-restore qui faisait fuiter les
                donnees d'un patient sur le suivant. Cf. handleSaveDraft. */}
          </div>
        )}

        {/* Step 3: Résultats (refonte 2026-06, ancien step 4) */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div>
              <StepPhaseBadge step={3} />
              <h2 className="text-xl font-semibold text-gray-900">Résultats des tests</h2>
              <p className="mt-1 text-sm text-gray-500">Sélectionnez les tests utilisés et entrez les résultats</p>
            </div>

            {/* Toggle Format CRBO retiré 2026-06-04 : retour ortho — le mode
                "Complet" produit des CRBO trop longs en pratique. Le mode
                "Synthétique" devient le défaut pour tous les bilans (deja
                applique via formData.format_crbo = 'synthetique' a l'init
                + fallback || 'synthetique' au submit). Le champ reste en
                state pour ne pas casser les 14 fichiers qui le consomment
                (word-export, system-base, route API, etc.). */}

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
                  {TESTS_SCREENING_OPTIONS.map(test => {
                    const checked = formData.test_utilise.includes(test)
                    const locked = isBetaDisabled(test) && !checked
                    return (
                      <label
                        key={test}
                        title={locked ? 'Disponible prochainement' : undefined}
                        className={`flex items-center gap-3 p-3 border rounded-lg transition bg-white ${
                          locked
                            ? 'border-gray-200 opacity-50 cursor-not-allowed'
                            : checked
                              ? 'border-amber-500 ring-2 ring-amber-200 cursor-pointer'
                              : 'border-amber-200 hover:border-amber-400 cursor-pointer'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          disabled={locked}
                          onChange={() => handleTestChange(test)}
                          className="w-4 h-4 text-amber-600 border-gray-300 rounded focus:ring-amber-500"
                        />
                        <span className="text-sm text-gray-700 font-medium flex-1">{test}</span>
                        {locked && (
                          <span className="text-[10px] uppercase tracking-wide font-semibold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                            Bientôt
                          </span>
                        )}
                      </label>
                    )
                  })}
                </div>
              </div>

              {/* Bilans complets — groupés par familles cliniques en accordéons.
                  Chaque famille est repliée par défaut ; auto-déroule si elle contient
                  au moins un test coché ou si l'ortho clique pour l'ouvrir. */}
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Bilans complets
              </p>
              <div className="space-y-2">
                {TEST_FAMILIES.map((family) => {
                  // Filtre les tests de la famille à ceux qui existent dans TESTS_OPTIONS
                  // (on ignore les noms divergents éventuels) et qui ne sont pas en screening.
                  const familyTests = family.tests.filter(
                    (t) =>
                      (TESTS_OPTIONS as readonly string[]).includes(t) &&
                      !(TESTS_SCREENING_OPTIONS as readonly string[]).includes(t),
                  )
                  const selectedInFamily = familyTests.filter((t) =>
                    formData.test_utilise.includes(t),
                  ).length
                  // Famille "math" contient aussi les raccourcis redirect B-CM / B-CMado
                  // qui ne sont pas dans TESTS_OPTIONS — ils élargissent visuellement la
                  // famille même si rien n'est cochable dans TESTS_OPTIONS au-delà d'Examath.
                  const isMathFamily = family.id === 'math'
                  const isSuggestedByAge = suggestedFamilyId === family.id
                  const explicit = openFamilies[family.id]
                  // Ouverture automatique : (1) tests cochés dans la famille,
                  // (2) famille suggérée par l'âge du patient. Sans choix
                  // explicite de l'ortho, l'accordéon pertinent se déplie.
                  const isOpen = explicit !== undefined
                    ? explicit
                    : (selectedInFamily > 0 || isSuggestedByAge)
                  if (familyTests.length === 0 && !isMathFamily) return null
                  return (
                    <div key={family.id} className="rounded-lg border border-gray-200 bg-white overflow-hidden">
                      <button
                        type="button"
                        onClick={() =>
                          setOpenFamilies((prev) => ({ ...prev, [family.id]: !isOpen }))
                        }
                        className="w-full px-4 py-3 flex items-center justify-between gap-3 text-left hover:bg-gray-50 transition"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="text-lg shrink-0" aria-hidden="true">{family.icon}</span>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-gray-900">{family.label}</p>
                            <p className="text-xs text-gray-500 mt-0.5">{family.description}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {selectedInFamily > 0 && (
                            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-xs font-semibold rounded-full">
                              {selectedInFamily} sélectionné{selectedInFamily > 1 ? 's' : ''}
                            </span>
                          )}
                          <ChevronRight
                            size={16}
                            className={`text-gray-400 transition-transform ${isOpen ? 'rotate-90' : ''}`}
                          />
                        </div>
                      </button>
                      {isOpen && (
                        <div className="border-t border-gray-100 px-4 py-3 grid sm:grid-cols-2 gap-2">
                          {familyTests.map((test) => {
                            const checked = formData.test_utilise.includes(test)
                            const locked = isBetaDisabled(test) && !checked
                            return (
                              <label
                                key={test}
                                title={locked ? 'Disponible prochainement' : undefined}
                                className={`flex items-center gap-3 p-3 border rounded-lg transition ${
                                  locked
                                    ? 'border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed'
                                    : checked
                                      ? 'border-green-500 bg-green-50 cursor-pointer'
                                      : 'border-gray-300 hover:border-gray-400 cursor-pointer'
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  disabled={locked}
                                  onChange={() => handleTestChange(test)}
                                  className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                                />
                                <span className="text-sm text-gray-700 flex-1">{test}</span>
                                {locked && (
                                  <span className="text-[10px] uppercase tracking-wide font-semibold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                                    Bientôt
                                  </span>
                                )}
                              </label>
                            )
                          })}
                          {isMathFamily && (
                            // Raccourcis vers les parcours dédiés B-CM / B-CMado :
                            // ils naviguent vers une route séparée (cotation qualitative,
                            // pas de percentile) au lieu d'être cochables dans le CRBO langage.
                            // Avant la navigation, on persiste un handoff localStorage
                            // (patient + anamnèse + motif) que le formulaire math
                            // hydrate au montage pour éviter de redemander ces infos.
                            <>
                              {[
                                { label: 'B-CM', sub: 'enfant', href: '/dashboard/bilan/b-cm', target: 'b-cm' as const },
                                { label: 'B-CMado', sub: 'ado', href: '/dashboard/bilan/b-cmado', target: 'b-cmado' as const },
                              ].map((b) => {
                                const locked = isBetaDisabled(b.label)
                                return (
                                  <button
                                    key={b.label}
                                    type="button"
                                    disabled={locked}
                                    onClick={() => {
                                      if (locked) {
                                        toast.info('Ce bilan sera disponible prochainement (validation en cours).')
                                        return
                                      }
                                      saveMathBilanHandoff({
                                        target: b.target,
                                        // Flag fromWizard : indique au BilanMathForm que tout le
                                        // contexte est deja saisi → masquer Patient/Type/Anamnese
                                        // blocs pour eviter la duplication de saisie. Demande
                                        // utilisateur 2026-05-26.
                                        fromWizard: true,
                                        patient: {
                                          prenom: formData.patient_prenom || '',
                                          nom: formData.patient_nom || '',
                                          date_naissance: formData.patient_ddn || '',
                                          classe: formData.patient_classe || '',
                                        },
                                        anamnese: formData.anamnese || '',
                                        motif: formData.motif || '',
                                        bilanMode: formData.bilan_type === 'renouvellement' ? 'renouvellement' : 'initial',
                                        bilanDate: formData.bilan_date || '',
                                        medecin: {
                                          nom: formData.medecin_nom || '',
                                          tel: formData.medecin_tel || '',
                                          date_prescription: formData.medecin_date_prescription || '',
                                        },
                                        comportementSeance: formData.comportement_seance || '',
                                        dureeSeanceMinutes: formData.duree_seance_minutes,
                                        renouvellement: formData.bilan_type === 'renouvellement'
                                          ? {
                                              evolutionNotes: formData.evolution_notes || '',
                                              elementsStables: formData.elements_stables || '',
                                              bilanPrecedentId: formData.bilan_precedent_id || '',
                                              bilanPrecedentDate: formData.bilan_precedent_date || '',
                                              bilanPrecedentAnamnese: formData.bilan_precedent_anamnese || '',
                                            }
                                          : undefined,
                                      })
                                      router.push(b.href)
                                    }}
                                    className={`flex items-center gap-3 p-3 border rounded-lg transition text-left group ${
                                      locked
                                        ? 'border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed'
                                        : 'border-emerald-200 hover:border-emerald-500 hover:bg-emerald-50'
                                    }`}
                                    title={locked ? 'Disponible prochainement' : `Parcours dédié — bilan de cognition mathématique ${b.sub}`}
                                  >
                                    <Calculator size={16} className={locked ? 'text-gray-400 shrink-0' : 'text-emerald-600 shrink-0'} />
                                    <span className="flex-1 min-w-0">
                                      <span className="block text-sm text-gray-700 font-medium">{b.label}</span>
                                      <span className={`block text-[11px] ${locked ? 'text-gray-500' : 'text-emerald-700'}`}>
                                        Bilan calcul {b.sub} — parcours dédié
                                      </span>
                                    </span>
                                    {locked ? (
                                      <span className="text-[10px] uppercase tracking-wide font-semibold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                                        Bientôt
                                      </span>
                                    ) : (
                                      <ArrowUpRight size={14} className="text-gray-400 group-hover:text-emerald-600 shrink-0" />
                                    )}
                                  </button>
                                )
                              })}
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Bandeau "Ajouter un bilan complémentaire" — proposé si l'ortho
                a sélectionné UN seul test pour l'instant et que ce test a des
                compléments cliniquement pertinents (ex. MoCA → BETL/PREDIMEM/
                PrediFex/BECD ; Examath → Exalang du même âge ; etc.).
                L'ortho reste libre d'ignorer les suggestions ou de cocher
                d'autres tests via la grille standard plus haut. */}
            {(() => {
              if (formData.test_utilise.length !== 1) return null
              const rootTest = formData.test_utilise[0]
              const { tests: suggestions, rationale } = getComplementarySuggestions(rootTest, formData.test_utilise)
              if (suggestions.length === 0) return null
              return (
                <div className="mb-2 rounded-lg border border-blue-200 bg-blue-50 p-3">
                  <p className="text-xs font-semibold text-blue-900 mb-1 flex items-center gap-1.5">
                    💡 Ajouter un bilan complémentaire au CRBO ?
                  </p>
                  <p className="text-[11px] text-blue-700 mb-2 leading-relaxed">{rationale}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {suggestions.map(t => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => handleTestChange(t)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium bg-white border border-blue-300 text-blue-800 hover:bg-blue-100 transition"
                      >
                        + {t}
                      </button>
                    ))}
                  </div>
                </div>
              )
            })()}

            {/* Multi-tests : rendu de TOUS les formulaires spécifiques des tests
                sélectionnés. Chaque formulaire écrit dans son propre slot via
                handleTestSlotChange ; le useEffect agrège les slots dans
                formData.resultats_manuels (1 bloc par test, séparés par
                délimiteurs "=== <Test> ===" déjà inclus par chaque composant).
                Si l'ortho a aussi coché des tests SANS formulaire spécifique
                (ex. EVALO 2-6, ELO, BALE…), le textarea générique reste
                disponible juste en dessous pour saisir ces résultats à la main. */}
            {(() => {
              const selectedWithForm = formData.test_utilise.filter(t => TESTS_WITH_SPECIFIC_FORM.has(t))
              if (selectedWithForm.length === 0) return null
              // Évite les remontées de "notes" depuis chaque sous-form qui
              // écraseraient celles du précédent : on partage un seul champ
              // comportement_seance pour toute la session.
              const sharedNotesProps = {
                notes: formData.comportement_seance || '',
                onNotesChange: (v: string) => setFormData(prev => ({ ...prev, comportement_seance: v })),
                onError: (msg: string) => setError(msg),
              }
              const isMulti = selectedWithForm.length > 1
              return (
                <div className="space-y-4">
                  {isMulti && (
                    <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-900 leading-relaxed">
                      <strong>Mode chaînage activé</strong> — {selectedWithForm.length} bilans dans le même CRBO. Chaque test
                      aura ses propres résultats + conclusion qualitative (1-2 paragraphes), puis une synthèse globale.
                    </div>
                  )}
                  {error && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 text-sm">
                      <AlertCircle size={16} />
                      {error}
                    </div>
                  )}
                  {selectedWithForm.map(test => (
                    <div key={test} className="rounded-lg border border-gray-200 bg-white overflow-hidden">
                      <div className="px-4 py-2 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-gray-900">Résultats {test} *</h3>
                        {isMulti && (
                          <button
                            type="button"
                            onClick={() => handleTestChange(test)}
                            className="text-xs text-gray-500 hover:text-red-600 transition"
                          >
                            Retirer ce test
                          </button>
                        )}
                      </div>
                      <div className="p-4">
                        {test === 'MoCA' && (
                          <MocaScoresInput
                            {...sharedNotesProps}
                            onResultatsChange={(v) => handleTestSlotChange('MoCA', v)}
                          />
                        )}
                        {test === 'BETL' && (
                          <BetlScoresInput
                            {...sharedNotesProps}
                            onResultatsChange={(v) => handleTestSlotChange('BETL', v)}
                            ageEstime={(() => {
                              if (!formData.patient_ddn) return undefined
                              const birth = new Date(formData.patient_ddn)
                              const bilan = new Date(formData.bilan_date)
                              let years = bilan.getFullYear() - birth.getFullYear()
                              const m = bilan.getMonth() - birth.getMonth()
                              if (m < 0 || (m === 0 && bilan.getDate() < birth.getDate())) years--
                              return years
                            })()}
                            bilanPrecedentStructure={formData.bilan_precedent_structure ?? null}
                            bilanPrecedentDate={formData.bilan_precedent_date ?? null}
                          />
                        )}
                        {test === 'PREDIMEM' && (
                          <PredimemScoresInput
                            {...sharedNotesProps}
                            onResultatsChange={(v) => handleTestSlotChange('PREDIMEM', v)}
                            bilanPrecedentStructure={formData.bilan_precedent_structure ?? null}
                            bilanPrecedentDate={formData.bilan_precedent_date ?? null}
                          />
                        )}
                        {test === 'Examath' && (
                          <ExamathScoresInput
                            {...sharedNotesProps}
                            onResultatsChange={(v) => handleTestSlotChange('Examath', v)}
                            bilanPrecedentStructure={formData.bilan_precedent_structure ?? null}
                            bilanPrecedentDate={formData.bilan_precedent_date ?? null}
                          />
                        )}
                        {test === 'EVALEO 6-15' && (
                          <Evaleo615ScoresInput
                            {...sharedNotesProps}
                            onResultatsChange={(v) => handleTestSlotChange('EVALEO 6-15', v)}
                            bilanPrecedentStructure={formData.bilan_precedent_structure ?? null}
                            bilanPrecedentDate={formData.bilan_precedent_date ?? null}
                          />
                        )}
                        {test === 'EVALO 2-6' && (
                          <Evalo26ScoresInput
                            {...sharedNotesProps}
                            onResultatsChange={(v) => handleTestSlotChange('EVALO 2-6', v)}
                          />
                        )}
                        {test === 'Exalang 3-6' && (
                          <Exalang36ScoresInput
                            {...sharedNotesProps}
                            onResultatsChange={(v) => handleTestSlotChange('Exalang 3-6', v)}
                            bilanPrecedentStructure={formData.bilan_precedent_structure ?? null}
                            bilanPrecedentDate={formData.bilan_precedent_date ?? null}
                          />
                        )}
                        {test === 'Exalang 5-8' && (
                          <Exalang58ScoresInput
                            {...sharedNotesProps}
                            onResultatsChange={(v) => handleTestSlotChange('Exalang 5-8', v)}
                            bilanPrecedentStructure={formData.bilan_precedent_structure ?? null}
                            bilanPrecedentDate={formData.bilan_precedent_date ?? null}
                          />
                        )}
                        {test === 'Exalang 8-11' && (
                          <Exalang811ScoresInput
                            {...sharedNotesProps}
                            onResultatsChange={(v) => handleTestSlotChange('Exalang 8-11', v)}
                            bilanPrecedentStructure={formData.bilan_precedent_structure ?? null}
                            bilanPrecedentDate={formData.bilan_precedent_date ?? null}
                          />
                        )}
                        {test === 'Exalang 11-15' && (
                          <Exalang1115ScoresInput
                            {...sharedNotesProps}
                            onResultatsChange={(v) => handleTestSlotChange('Exalang 11-15', v)}
                            bilanPrecedentStructure={formData.bilan_precedent_structure ?? null}
                            bilanPrecedentDate={formData.bilan_precedent_date ?? null}
                          />
                        )}
                        {test === 'PrediFex' && (
                          <PrediFexScoresInput
                            {...sharedNotesProps}
                            onResultatsChange={(v) => handleTestSlotChange('PrediFex', v)}
                            bilanPrecedentStructure={formData.bilan_precedent_structure ?? null}
                            bilanPrecedentDate={formData.bilan_precedent_date ?? null}
                          />
                        )}
                        {test === 'BECD' && (
                          <BecdScoresInput
                            {...sharedNotesProps}
                            onResultatsChange={(v) => handleTestSlotChange('BECD', v)}
                          />
                        )}
                        {test === 'BIA' && (
                          <BiaScoresInput
                            {...sharedNotesProps}
                            onResultatsChange={(v) => handleTestSlotChange('BIA', v)}
                          />
                        )}
                        {test === 'PrediLac' && (
                          <PrediLacScoresInput
                            {...sharedNotesProps}
                            onResultatsChange={(v) => handleTestSlotChange('PrediLac', v)}
                          />
                        )}
                        {test === 'Exalang Lyfac' && (
                          <ExalangLyfacScoresInput
                            {...sharedNotesProps}
                            onResultatsChange={(v) => handleTestSlotChange('Exalang Lyfac', v)}
                            bilanPrecedentStructure={formData.bilan_precedent_structure ?? null}
                            bilanPrecedentDate={formData.bilan_precedent_date ?? null}
                          />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )
            })()}

            {/* Textarea générique — affiché UNIQUEMENT si :
                - aucun test sélectionné, OU
                - au moins un test sélectionné SANS formulaire spécifique
                  (ex. EVALO 2-6, ELO, BALE, BILO, BELEC, N-EEL, OMF, Autre).
                En mode multi-test, l'agrégation des forms écrit déjà dans
                resultats_manuels — ce textarea sert pour les COMPLÉMENTS hors
                des tests structurés. */}
            {(() => {
              const selectedWithForm = formData.test_utilise.filter(t => TESTS_WITH_SPECIFIC_FORM.has(t))
              const selectedWithoutForm = formData.test_utilise.filter(t => !TESTS_WITH_SPECIFIC_FORM.has(t))
              const showGeneric = selectedWithForm.length === 0 || selectedWithoutForm.length > 0
              if (!showGeneric) return null
              return (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Résultats (scores) *
                </label>
                <p className="text-xs text-gray-500 mb-3">
                  Importez un PDF de résultats ou entrez-les manuellement
                </p>

                {/* Bouton Import PDF */}
                <div className="mb-3">
                  <FileDropZone
                    onFilesDropped={processPDFFiles}
                    accept=".pdf,image/*"
                    multiple
                    disabled={extracting}
                    overlayLabel="Déposez les PDFs ou images ici"
                    className="inline-block"
                  >
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
                  </FileDropZone>
                  <span className="ml-3 text-xs text-gray-400">Cliquez ou glissez-déposez — jusqu'à 3 PDFs / images (Exalang, EVALO, ELO...)</span>
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
                  placeholder="Notation Exalang : Q1 = P25 (Zone de fragilité), Med = P50 (Moyenne haute), Q3 = P75 (Moyenne haute), P5/P10/P90/P95 = valeur exacte. NE JAMAIS recalculer le percentile depuis l'É-T.

Empan auditif endroit : 3/7, É-T : -2.11, P5
Empan auditif envers : 3/6, É-T : -0.79, Q3 (P75)
Métaphonologie - traitement syllabique : 5/11, É-T : -3.32, P5
Lecture de mots (score) : 15/100, É-T : -6.62, P5
Lecture de non-mots : 8/20, É-T : -1.20, Q1 (P25)
Compréhension écrite : 7/10, É-T : -0.50, Med (P50)
..."
                />

                {formData.resultats_manuels && (
                  <p className="mt-2 text-xs text-green-600 flex items-center gap-1">
                    <CheckCircle size={14} />
                    {formData.resultats_manuels.split('\n').filter(l => l.trim()).length} résultats détectés
                  </p>
                )}

                {/* Compléments hors tests structurés : on liste les tests
                    sélectionnés qui n'ont PAS de formulaire spécifique pour
                    rappeler à l'ortho lesquels doivent être saisis ici. */}
                {(() => {
                  const sansForm = formData.test_utilise.filter(t => !TESTS_WITH_SPECIFIC_FORM.has(t))
                  if (sansForm.length === 0) return null
                  return (
                    <div className="mt-3 p-3 rounded-lg border border-gray-200 bg-gray-50 text-xs text-gray-700">
                      <strong>Saisir ici les résultats pour :</strong> {sansForm.join(', ')}.
                    </div>
                  )
                })()}
              </div>
              )
            })()}

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
                  patientPrenom={formData.patient_prenom}
                  patientNom={formData.patient_nom}
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
                  patientPrenom={formData.patient_prenom}
                  patientNom={formData.patient_nom}
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
