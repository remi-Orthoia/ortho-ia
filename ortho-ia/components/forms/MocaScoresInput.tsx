'use client'

/**
 * Saisie structurée des scores MoCA (Montreal Cognitive Assessment).
 *
 * La MoCA est un screening cognitif adulte/senior — score total /30 avec 7
 * sous-domaines (Visuospatial/Exécutif /5, Dénomination /3, Mémoire /5,
 * Attention /6, Langage /3, Abstraction /2, Orientation /6).
 *
 * Pourquoi un composant dédié plutôt que le textarea "résultats manuels"
 * standard : la MoCA n'a pas d'écart-type ni de percentile ; elle a un score
 * brut par domaine + un seuil officiel sur le total. Une saisie libre serait
 * une perte de temps et exposerait l'ortho à des erreurs de calcul de total.
 *
 * Chaque domaine expose :
 *   - les règles de cotation officielles Nasreddine 2005 (accordéon),
 *   - un champ d'observation libre (+ dictée vocale via MicButton).
 *
 * Le composant écrit un texte normalisé dans le champ `resultats_manuels` de
 * `CRBOFormData` à chaque changement (déterministe, parsable par l'IA).
 *
 * Couplage : utilisé uniquement dans `app/dashboard/nouveau-crbo/page.tsx`
 * quand `test_utilise` contient "MoCA".
 */

import { useEffect, useMemo, useRef, useState } from 'react'
import { Brain, CheckCircle2, AlertCircle, ChevronDown, Camera, Loader2, Lightbulb } from 'lucide-react'
import MicButton from '../MicButton'

interface Props {
  /** Notes d'observation (comportement, fatigabilité). Optionnel. */
  notes: string
  onNotesChange: (v: string) => void
  /** Écrit le résultat normalisé dans `resultats_manuels`. */
  onResultatsChange: (normalized: string) => void
  /** Callback erreur micro (remonte au parent). */
  onError?: (msg: string) => void
}

type DomainKey =
  | 'visuospatial'
  | 'denomination'
  | 'memoire'
  | 'attention'
  | 'langage'
  | 'abstraction'
  | 'orientation'

interface MocaState {
  scores: Record<DomainKey, string>
  observations: Record<DomainKey, string>
  scolariteCourte: boolean
  /**
   * Détails du rappel mémoire au-delà du rappel libre (= scores.memoire).
   * Ces deux valeurs N'ENTRENT PAS dans le score MoCA officiel mais
   * orientent l'hypothèse de diagnostic :
   *   - indice catégoriel/choix multiple efficace → trouble de récupération
   *     (encodage préservé)
   *   - indice/choix multiple inefficace → fragilité d'encodage
   */
  rappelIndice: {
    categoriel: string   // /5 — facilitation par indice catégoriel
    choixMultiple: string // /5 — facilitation par choix multiple
  }
}

/**
 * Règles de cotation officielles MoCA — Nasreddine et al. 2005.
 * Affichées dans l'UI pour guider l'ortho au moment de la saisie : sans ce
 * rappel, on observe des erreurs fréquentes (rappel avec indice compté dans le
 * score mnésique, tolérance excessive sur la dénomination, oubli du barème
 * progressif de la soustraction sérielle).
 */
const DOMAINS: Array<{
  key: DomainKey
  label: string
  max: number
  hint: string
  rules: string[]
  obsPlaceholder: string
  /**
   * Aide à l'interprétation qualitative (au-delà du score). Sert à orienter
   * l'ortho dans la rédaction de l'observation pour nourrir l'hypothèse de
   * diagnostic. Ne JAMAIS basculer en spéculation étiologique.
   */
  interpretation?: string[]
}> = [
  {
    key: 'visuospatial',
    label: 'Visuospatial / Exécutif',
    max: 5,
    hint: 'Alternance (Trail B), recopie du cube, horloge 11h10',
    rules: [
      'Alternance conceptuelle (1 pt) : séquence 1-A-2-B-3-C-4-D-5-E réussie sans erreur ni autocorrection.',
      'Recopie du cube (1 pt) : dessin 3D, 12 arêtes, parallélisme respecté, aucune ligne ajoutée.',
      'Horloge — Contour (1 pt) : cercle clos, sans déformation majeure.',
      'Horloge — Chiffres (1 pt) : tous présents, ordre correct, placement régulier.',
      'Horloge — Aiguilles (1 pt) : petite sur 11, grande sur 2, longueurs différenciées.',
    ],
    obsPlaceholder: 'Ex. horloge : aiguilles inversées (10h55 au lieu de 11h10).',
    interpretation: [
      'TMT B (alternance) : explore la flexibilité mentale et l\'inhibition. Un échec oriente vers une fragilité des fonctions exécutives.',
      'Recopie du cube : visuo-construction et planification visuo-spatiale. Noter le TYPE d\'erreur :',
      '   • absence de perspective / dessin "à plat" → difficulté de représentation 3D',
      '   • lignes superposées ou parallélisme rompu → fragilité de planification',
      '   • arêtes omises ou ajoutées → fragilité d\'analyse visuo-spatiale',
      'Horloge (11h10) : intègre construction, planification et représentation mentale du temps. Le TYPE d\'erreur est plus informatif que le score :',
      '   • contour absent / fortement déformé → fragilité visuo-constructive',
      '   • chiffres regroupés à droite, partie gauche vide → suspicion de négligence spatiale gauche (à confirmer cliniquement)',
      '   • aiguille longue placée sur 10 au lieu de 2 (= "10h11" au lieu de 11h10) → trouble de la représentation mentale ou persévération',
      '   • chiffres en désordre ou répétés → fragilité d\'organisation séquentielle',
      'Décrire l\'erreur en termes FONCTIONNELS dans l\'observation. Pas de spéculation étiologique : "fragilité" plutôt que "trouble dysexécutif avéré".',
    ],
  },
  {
    key: 'denomination',
    label: 'Dénomination',
    max: 3,
    hint: 'Lion, rhinocéros, chameau (ou dromadaire)',
    rules: [
      '1 pt par animal dénommé spontanément, sans indice.',
      'Accepter "rhino" pour rhinocéros et "dromadaire" pour chameau.',
      'Réponse approximative ("animal sauvage", "ça vit en Afrique") = 0.',
      'Aucune aide phonologique ni sémantique autorisée pour le score.',
    ],
    obsPlaceholder: 'Ex. "rhinocéros" trouvé après indice phonologique (non compté).',
  },
  {
    key: 'attention',
    label: 'Attention',
    max: 6,
    hint: 'Empan direct + inverse, vigilance lettre A, soustraction 100−7',
    rules: [
      'Empan direct de chiffres — 2-1-8-5-4 (1 pt) : reproduction exacte dans l\'ordre.',
      'Empan inverse — 7-4-2 (1 pt) : reproduction à rebours (réponse attendue : 2-4-7).',
      'Vigilance lettre A (1 pt) : taper à chaque A, ≤ 1 erreur (omission OU fausse alarme).',
      'Soustraction sérielle 100 − 7 — séquence attendue 93, 86, 79, 72, 65 :',
      '   • 0 bonne réponse → 0 pt',
      '   • 1 bonne → 1 pt',
      '   • 2 ou 3 bonnes → 2 pts',
      '   • 4 ou 5 bonnes → 3 pts',
      'Chaque soustraction évaluée à partir du résultat précédent du patient (erreur non propagée).',
    ],
    obsPlaceholder: 'Ex. soustraction : 93, 85, 78, 71, 64 → 4 bonnes (3 pts).',
  },
  {
    key: 'langage',
    label: 'Langage',
    max: 3,
    hint: 'Répétition de 2 phrases + fluence lettre F (1 min)',
    rules: [
      'Répétition phrase 1 (1 pt) : "Je sais que Jean est celui qui doit aider aujourd\'hui".',
      'Répétition phrase 2 (1 pt) : "Le chat se cache toujours sous le canapé quand les chiens sont dans la pièce".',
      'Reproduction strictement exacte : toute omission, substitution ou ajout = 0.',
      'Fluence lettre F en 60 sec (1 pt) : ≥ 11 mots commençant par F.',
      'Exclure de la fluence : noms propres, mots dérivés (fleur / fleurs / fleuriste = 1 seul).',
    ],
    obsPlaceholder: 'Ex. fluence F : 9 mots en 60 sec (sous le seuil de 11).',
  },
  {
    key: 'abstraction',
    label: 'Abstraction',
    max: 2,
    hint: 'Similitudes : train–bicyclette, montre–règle',
    rules: [
      'Train – bicyclette (1 pt) : réponse attendue de type "moyens de transport".',
      'Montre – règle (1 pt) : réponse attendue de type "instruments de mesure".',
      'Exiger la catégorie superordonnée. Réponses fonctionnelles ("ça roule", "ça sert à mesurer") = 0.',
      'Réponse perceptive ("c\'est long", "c\'est en métal") = 0.',
    ],
    obsPlaceholder: 'Ex. patient répond "ça sert à voyager" pour train/vélo (0 pt).',
  },
  {
    key: 'memoire',
    label: 'Mémoire (rappel différé)',
    max: 5,
    hint: '5 mots à rappeler ~5 min plus tard, SANS indice',
    rules: [
      '5 mots cibles : visage, velours, église, marguerite, rouge.',
      'Score MoCA officiel = rappel LIBRE uniquement. 1 pt par mot rappelé spontanément, dans n\'importe quel ordre.',
      '⚠️ Rappel avec indice catégoriel ou choix multiple : à NOTER cliniquement, mais ne compte PAS dans le score MoCA.',
      'Variantes du même mot non acceptées (ex. "rouge" ≠ "rougeur").',
      'Saisir séparément la facilitation par indice et par choix multiple dans les champs ci-dessous : ces informations orientent l\'hypothèse de diagnostic.',
    ],
    obsPlaceholder: 'Ex. 2/5 en rappel libre. Indice catégoriel : 4/5. Choix multiple : 5/5. Profil compatible avec un trouble de récupération.',
    interpretation: [
      'Le profil de rappel oriente l\'hypothèse de diagnostic — à formuler PRUDEMMENT, sans nommer d\'étiologie (Alzheimer, MCI, etc.) :',
      '   • Rappel libre faible + indice catégoriel ou choix multiple efficace (gain marqué) → suggère un trouble de RÉCUPÉRATION, l\'encodage est préservé. Profil typique d\'une fragilité sous-cortico-frontale, à explorer en bilan neuropsychologique.',
      '   • Rappel libre faible + indices peu ou pas efficaces (pas de gain) → suggère une fragilité d\'ENCODAGE / consolidation, à caractériser en bilan neuropsychologique.',
      '   • Rappel libre normal (≥ 4/5) → pas d\'argument mnésique objectivé au screening, vérifier les autres domaines (langage, exécutif, attention).',
      'En CRBO, toujours formuler en "hypothèse" : "Le profil de rappel est compatible avec …", "à confirmer par un bilan neuropsychologique approfondi". La MoCA seule ne permet pas de poser un diagnostic.',
    ],
  },
  {
    key: 'orientation',
    label: 'Orientation',
    max: 6,
    hint: 'Date, mois, année, jour, lieu, ville',
    rules: [
      '1 pt par item correctement énoncé, sans aide :',
      '   • Date (quantième du mois, jour exact — pas de tolérance)',
      '   • Mois',
      '   • Année',
      '   • Jour de la semaine',
      '   • Lieu (nom ou type d\'institution — cabinet, hôpital…)',
      '   • Ville',
    ],
    obsPlaceholder: 'Ex. erreur d\'1 jour sur la date (non compté). Confond ville et quartier.',
  },
]

interface Severity {
  label: string
  bg: string
  ring: string
  text: string
}

/**
 * Seuils officiels MoCA — Nasreddine et al. 2005.
 * S'applique au TOTAL CORRIGÉ (après +1 si scolarité ≤ 12 ans).
 */
function severityFor(totalCorrige: number): Severity {
  if (totalCorrige >= 26) return { label: 'Pas d\'atteinte',     bg: 'bg-emerald-50',  ring: 'border-emerald-300',  text: 'text-emerald-800' }
  if (totalCorrige >= 18) return { label: 'Atteinte légère',     bg: 'bg-amber-50',    ring: 'border-amber-300',    text: 'text-amber-800' }
  if (totalCorrige >= 10) return { label: 'Atteinte modérée',    bg: 'bg-orange-50',   ring: 'border-orange-300',   text: 'text-orange-800' }
  return                         { label: 'Atteinte sévère',    bg: 'bg-red-50',      ring: 'border-red-300',      text: 'text-red-800' }
}

/**
 * Parse "" ou "3" ou "5" en nombre, clampé à [0, max]. "" → 0.
 * Tolère les espaces / virgules. Tout ce qui n'est pas un entier propre → 0.
 */
function parseScore(raw: string, max: number): number {
  const trimmed = (raw || '').trim()
  if (!trimmed) return 0
  const n = parseInt(trimmed, 10)
  if (isNaN(n) || n < 0) return 0
  return Math.min(max, n)
}

const EMPTY_OBS: Record<DomainKey, string> = {
  visuospatial: '', denomination: '', memoire: '',
  attention: '', langage: '', abstraction: '', orientation: '',
}
const EMPTY_SCORES: Record<DomainKey, string> = {
  visuospatial: '', denomination: '', memoire: '',
  attention: '', langage: '', abstraction: '', orientation: '',
}

export default function MocaScoresInput({ notes, onNotesChange, onResultatsChange, onError }: Props) {
  const [state, setState] = useState<MocaState>({
    scores: EMPTY_SCORES,
    observations: EMPTY_OBS,
    scolariteCourte: false,
    rappelIndice: { categoriel: '', choixMultiple: '' },
  })

  // Upload photo MoCA → Claude Vision pré-remplit les 7 domaines.
  // Beta : l'ortho doit toujours relire et corriger avant de générer.
  const [uploading, setUploading] = useState(false)
  const [extractWarnings, setExtractWarnings] = useState<string[]>([])
  const [extractInfo, setExtractInfo] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handlePhotoUpload = async (file: File) => {
    setUploading(true)
    setExtractWarnings([])
    setExtractInfo(null)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/extract-moca', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok || !data?.success) {
        onError?.(data?.error || 'Erreur lors de la lecture de la photo.')
        return
      }

      // Pré-remplissage : on n'écrase QUE les champs que Claude a su lire,
      // pour ne pas effacer une saisie en cours si l'ortho a déjà commencé.
      setState(prev => {
        const nextScores = { ...prev.scores }
        const nextObs = { ...prev.observations }
        for (const d of DOMAINS) {
          const v = data.scores?.[d.key]
          if (typeof v === 'number') nextScores[d.key] = String(v)
          const obs = data.observations?.[d.key]
          if (typeof obs === 'string' && obs.trim()) nextObs[d.key] = obs
        }
        const nextIndice = { ...prev.rappelIndice }
        const cat = data.memoire_indices?.indice_categoriel
        const cm = data.memoire_indices?.choix_multiple
        if (typeof cat === 'number') nextIndice.categoriel = String(cat)
        if (typeof cm === 'number') nextIndice.choixMultiple = String(cm)
        return {
          scores: nextScores,
          observations: nextObs,
          scolariteCourte: data.scolarite_courte === true ? true : prev.scolariteCourte,
          rappelIndice: nextIndice,
        }
      })

      const filledCount = Object.values(data.scores ?? {}).filter((v) => typeof v === 'number').length
      const parts: string[] = [`${filledCount}/7 domaines lus.`]
      if (typeof data.total_lu === 'number') parts.push(`Total inscrit sur la feuille : ${data.total_lu}/30.`)
      if (data.scolarite_courte === true) parts.push('Case scolarité ≤ 12 ans cochée.')
      parts.push('Relisez chaque score avant de générer le CRBO.')
      setExtractInfo(parts.join(' '))
      setExtractWarnings(Array.isArray(data.warnings) ? data.warnings : [])
    } catch (err: any) {
      onError?.(err?.message || 'Erreur réseau lors de la lecture de la photo.')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  // Total brut (somme des 7 domaines, sans ajustement).
  const totalBrut = useMemo(() =>
    DOMAINS.reduce((acc, d) => acc + parseScore(state.scores[d.key], d.max), 0),
    [state.scores],
  )
  const ajustement = state.scolariteCourte ? 1 : 0
  const totalCorrige = Math.min(30, totalBrut + ajustement)
  const severity = useMemo(() => severityFor(totalCorrige), [totalCorrige])

  // Au moins un score saisi pour considérer le formulaire "actif".
  const hasAnyScore = useMemo(
    () => DOMAINS.some(d => state.scores[d.key].trim() !== ''),
    [state.scores],
  )

  // Émet la string normalisée à chaque changement.
  // Format inspiré de la convention `resultats_manuels` du reste de l'app :
  // une ligne par épreuve avec "Domaine : score/max", suivie éventuellement
  // d'une ligne "  Obs : ..." pour transmettre les observations cliniques
  // saisies par l'ortho au LLM générateur.
  useEffect(() => {
    if (!hasAnyScore) {
      onResultatsChange('')
      return
    }
    const lines: string[] = []
    lines.push('=== MoCA — Screening cognitif ===')
    for (const d of DOMAINS) {
      const v = parseScore(state.scores[d.key], d.max)
      const pct = Math.round((v / d.max) * 100)
      lines.push(`${d.label} : ${v}/${d.max} (${pct}%)`)
      // Pour la mémoire : injecter les sous-scores d'indice/choix multiple
      // dans la sortie normalisée pour que le LLM générateur puisse en tirer
      // une hypothèse de diagnostic (cf. règles cliniques MoCA system-base).
      if (d.key === 'memoire') {
        const cat = state.rappelIndice.categoriel.trim()
        const cm = state.rappelIndice.choixMultiple.trim()
        if (cat) lines.push(`  +Indice catégoriel : ${parseScore(cat, 5)}/5`)
        if (cm) lines.push(`  +Choix multiple : ${parseScore(cm, 5)}/5`)
      }
      const obs = state.observations[d.key].trim()
      if (obs) {
        lines.push(`  Obs : ${obs}`)
      }
    }
    lines.push('---')
    lines.push(`TOTAL brut : ${totalBrut}/30`)
    if (state.scolariteCourte) {
      lines.push(`Scolarité ≤ 12 ans : +1 → TOTAL CORRIGÉ : ${totalCorrige}/30`)
    } else {
      lines.push(`Scolarité > 12 ans : pas d'ajustement → TOTAL : ${totalCorrige}/30`)
    }
    lines.push(`Interprétation : ${severity.label}`)
    onResultatsChange(lines.join('\n'))
  // onResultatsChange est intentionnellement omis : si le parent ne le mémorise pas,
  // il changerait à chaque render → boucle. Les valeurs qui comptent sont les scores.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, totalBrut, totalCorrige, hasAnyScore, severity.label])

  const handleScoreChange = (key: DomainKey, value: string, max: number) => {
    // On garde la chaîne brute pour permettre la saisie progressive ("" → "1" → "12" → "1")
    // mais on clamp à max si l'utilisateur tape un nombre supérieur.
    if (value === '') {
      setState(s => ({ ...s, scores: { ...s.scores, [key]: '' } }))
      return
    }
    const n = parseInt(value, 10)
    if (isNaN(n)) return  // refuse les caractères non-numériques
    const clamped = Math.min(max, Math.max(0, n))
    setState(s => ({ ...s, scores: { ...s.scores, [key]: String(clamped) } }))
  }

  const handleObservationChange = (key: DomainKey, value: string) => {
    setState(s => ({ ...s, observations: { ...s.observations, [key]: value } }))
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-2 p-3 rounded-lg border border-indigo-200 bg-indigo-50">
        <Brain size={18} className="text-indigo-600 shrink-0 mt-0.5" />
        <div className="text-sm">
          <p className="font-semibold text-indigo-900">Saisie structurée MoCA</p>
          <p className="text-indigo-700 text-xs mt-0.5">
            Saisissez le score obtenu pour chacun des 7 domaines. Dépliez «&nbsp;Règles de cotation&nbsp;»
            pour consulter le barème officiel (Nasreddine 2005). Total et interprétation calculés automatiquement.
          </p>
        </div>
      </div>

      {/* Téléversement photo de la feuille manuscrite — Claude Vision pré-remplit les domaines.
          Reste en bêta : l'ortho doit toujours valider chaque score avant la génération CRBO. */}
      <div className="rounded-lg border border-dashed border-purple-300 bg-purple-50/50 p-3">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="flex items-start gap-2 min-w-0">
            <Camera size={18} className="text-purple-600 shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold text-purple-900">
                Téléverser une photo de la feuille MoCA{' '}
                <span className="font-normal text-purple-600 text-xs">(bêta)</span>
              </p>
              <p className="text-purple-700 text-xs mt-0.5">
                Photographiez la feuille de cotation papier remplie à la main. Claude Vision lit les 7 scores,
                la case scolarité, et les annotations en marge. <strong>Relisez systématiquement</strong> avant
                de générer le CRBO.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="shrink-0 inline-flex items-center gap-1.5 px-3 py-2 rounded-md bg-purple-600 hover:bg-purple-700 disabled:bg-purple-300 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors"
          >
            {uploading ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Lecture en cours…
              </>
            ) : (
              <>
                <Camera size={14} />
                Choisir une photo
              </>
            )}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) handlePhotoUpload(f)
            }}
          />
        </div>
        {extractInfo && !uploading && (
          <p className="mt-2 text-xs text-purple-800 bg-white/70 border border-purple-200 rounded px-2 py-1.5">
            {extractInfo}
          </p>
        )}
        {extractWarnings.length > 0 && (
          <ul className="mt-2 space-y-1">
            {extractWarnings.map((w, i) => (
              <li key={i} className="flex items-start gap-1.5 text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded px-2 py-1">
                <AlertCircle size={12} className="shrink-0 mt-0.5" />
                <span>{w}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Cartes par domaine — 1 colonne pour laisser de la place aux règles + observation */}
      <div className="space-y-3">
        {DOMAINS.map(d => {
          const value = parseScore(state.scores[d.key], d.max)
          const pct = state.scores[d.key].trim() !== '' ? Math.round((value / d.max) * 100) : null
          const obsValue = state.observations[d.key]
          return (
            <div
              key={d.key}
              className="rounded-lg border border-gray-200 bg-white p-4"
            >
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="flex-1 min-w-0">
                  <label className="block text-sm font-semibold text-gray-900">
                    {d.label}
                  </label>
                  <p className="text-xs text-gray-500 mt-0.5">{d.hint}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <input
                    type="number"
                    min={0}
                    max={d.max}
                    step={1}
                    value={state.scores[d.key]}
                    onChange={(e) => handleScoreChange(d.key, e.target.value, d.max)}
                    placeholder="0"
                    className="w-16 px-2 py-1.5 border border-gray-300 rounded text-center text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  />
                  <span className="text-sm text-gray-500">/ {d.max}</span>
                  {pct !== null && (
                    <span
                      className={`text-xs font-medium ${
                        pct >= 80 ? 'text-emerald-700'
                        : pct >= 50 ? 'text-amber-700'
                        : 'text-red-700'
                      }`}
                    >
                      {pct}%
                    </span>
                  )}
                </div>
              </div>

              {/* Règles de cotation officielles — accordéon natif <details> pour
                  rester compact tout en exposant le barème en un clic. */}
              <details className="group mt-3 rounded-md border border-indigo-100 bg-indigo-50/50">
                <summary className="flex items-center gap-1.5 px-3 py-2 cursor-pointer select-none text-xs font-medium text-indigo-800 hover:bg-indigo-50">
                  <ChevronDown
                    size={14}
                    className="transition-transform group-open:rotate-0 -rotate-90"
                  />
                  Règles de cotation officielles
                </summary>
                <ul className="px-3 pb-3 pt-1 space-y-1 text-xs text-gray-700">
                  {d.rules.map((r, i) => (
                    <li key={i} className="leading-relaxed">{r}</li>
                  ))}
                </ul>
              </details>

              {/* Aide à l'interprétation clinique — uniquement pour les domaines
                  qui ont une lecture qualitative riche (visuospatial, mémoire).
                  Couleur ambre + icône ampoule pour distinguer des règles de
                  cotation (qui sont indigo). */}
              {d.interpretation && d.interpretation.length > 0 && (
                <details className="group mt-2 rounded-md border border-amber-200 bg-amber-50/60">
                  <summary className="flex items-center gap-1.5 px-3 py-2 cursor-pointer select-none text-xs font-medium text-amber-900 hover:bg-amber-100/50">
                    <Lightbulb size={14} className="shrink-0" />
                    Aide à l&apos;interprétation clinique
                  </summary>
                  <ul className="px-3 pb-3 pt-1 space-y-1 text-xs text-gray-700">
                    {d.interpretation.map((r, i) => (
                      <li key={i} className="leading-relaxed">{r}</li>
                    ))}
                  </ul>
                </details>
              )}

              {/* Mémoire uniquement : sous-scores de facilitation par indice.
                  N'entrent PAS dans le total MoCA mais sont injectés dans
                  resultats_manuels pour nourrir l'hypothèse de diagnostic. */}
              {d.key === 'memoire' && (
                <div className="mt-3 rounded-md border border-purple-200 bg-purple-50/60 p-3">
                  <p className="text-xs font-semibold text-purple-900 mb-0.5">
                    Facilitation par indice (optionnel — n&apos;entre pas dans le score MoCA)
                  </p>
                  <p className="text-[11px] text-purple-700 mb-2 leading-relaxed">
                    Si vous avez proposé un indice catégoriel puis un choix multiple, indiquez le nombre de mots
                    rappelés à chaque étape. Un gain marqué oriente vers un trouble de récupération&nbsp;; pas de gain oriente vers une fragilité d&apos;encodage.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <label className="flex items-center gap-2 bg-white rounded border border-purple-200 px-2 py-1.5">
                      <span className="text-xs text-gray-700 flex-1">+ Indice catégoriel</span>
                      <input
                        type="number"
                        min={0}
                        max={5}
                        step={1}
                        value={state.rappelIndice.categoriel}
                        onChange={(e) => {
                          const v = e.target.value
                          if (v === '') {
                            setState(s => ({ ...s, rappelIndice: { ...s.rappelIndice, categoriel: '' } }))
                            return
                          }
                          const n = parseInt(v, 10)
                          if (isNaN(n)) return
                          const c = Math.min(5, Math.max(0, n))
                          setState(s => ({ ...s, rappelIndice: { ...s.rappelIndice, categoriel: String(c) } }))
                        }}
                        placeholder="0"
                        className="w-14 px-2 py-1 border border-gray-300 rounded text-center text-sm font-mono focus:outline-none focus:ring-2 focus:ring-purple-400"
                      />
                      <span className="text-xs text-gray-500">/ 5</span>
                    </label>
                    <label className="flex items-center gap-2 bg-white rounded border border-purple-200 px-2 py-1.5">
                      <span className="text-xs text-gray-700 flex-1">+ Choix multiple</span>
                      <input
                        type="number"
                        min={0}
                        max={5}
                        step={1}
                        value={state.rappelIndice.choixMultiple}
                        onChange={(e) => {
                          const v = e.target.value
                          if (v === '') {
                            setState(s => ({ ...s, rappelIndice: { ...s.rappelIndice, choixMultiple: '' } }))
                            return
                          }
                          const n = parseInt(v, 10)
                          if (isNaN(n)) return
                          const c = Math.min(5, Math.max(0, n))
                          setState(s => ({ ...s, rappelIndice: { ...s.rappelIndice, choixMultiple: String(c) } }))
                        }}
                        placeholder="0"
                        className="w-14 px-2 py-1 border border-gray-300 rounded text-center text-sm font-mono focus:outline-none focus:ring-2 focus:ring-purple-400"
                      />
                      <span className="text-xs text-gray-500">/ 5</span>
                    </label>
                  </div>
                </div>
              )}

              {/* Observation libre + dictée vocale */}
              <div className="mt-3">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-medium text-gray-700">
                    Observation clinique (optionnel)
                  </label>
                  <MicButton
                    value={obsValue}
                    onChange={(v) => handleObservationChange(d.key, v)}
                    onError={onError}
                    ariaLabel={`Dicter une observation pour ${d.label}`}
                  />
                </div>
                <textarea
                  value={obsValue}
                  onChange={(e) => handleObservationChange(d.key, e.target.value)}
                  rows={2}
                  placeholder={d.obsPlaceholder}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm resize-none"
                />
              </div>
            </div>
          )
        })}
      </div>

      {/* Ajustement scolarité */}
      <label className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 bg-gray-50 cursor-pointer hover:border-gray-300">
        <input
          type="checkbox"
          checked={state.scolariteCourte}
          onChange={(e) => setState(s => ({ ...s, scolariteCourte: e.target.checked }))}
          className="mt-0.5 w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
        />
        <div className="text-sm">
          <p className="font-medium text-gray-900">Scolarité ≤ 12 ans (ajout +1 point)</p>
          <p className="text-xs text-gray-500 mt-0.5">
            Ajustement officiel pour ne pas surestimer une atteinte chez les patients à
            faible niveau scolaire. À cocher si le patient a au plus le niveau collège.
          </p>
        </div>
      </label>

      {/* Total + badge sévérité */}
      <div className={`rounded-lg border-2 ${severity.ring} ${severity.bg} p-4`}>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <p className="text-xs text-gray-600 uppercase tracking-wide font-semibold">
              Total {state.scolariteCourte ? 'corrigé' : 'MoCA'}
            </p>
            <p className="text-3xl font-bold text-gray-900 mt-1 font-mono">
              {totalCorrige}<span className="text-xl text-gray-500">/30</span>
            </p>
            {state.scolariteCourte && (
              <p className="text-xs text-gray-600 mt-1">
                ({totalBrut}/30 brut + 1 point scolarité)
              </p>
            )}
          </div>
          <div className="text-right">
            <p className={`text-sm font-semibold ${severity.text} flex items-center gap-1.5`}>
              {totalCorrige >= 26 ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
              {severity.label}
            </p>
            <p className="text-xs text-gray-600 mt-1">
              {totalCorrige >= 26 ? 'Seuil officiel ≥ 26/30' :
               totalCorrige >= 18 ? '18 – 25/30' :
               totalCorrige >= 10 ? '10 – 17/30' :
                                    '< 10/30'}
            </p>
          </div>
        </div>
        {totalCorrige < 26 && hasAnyScore && (
          <p className="mt-3 text-xs text-gray-700 bg-white/60 rounded px-3 py-2 border border-gray-200">
            Le screening met en évidence une atteinte des fonctions cognitives. Un
            <strong> bilan neuropsychologique approfondi </strong>
            sera recommandé pour caractériser le profil cognitif et orienter la prise en charge.
          </p>
        )}
      </div>

      {/* Notes d'observation globales (transversales, hors cotation) */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="block text-sm font-medium text-gray-700">
            Notes générales de passation (optionnel)
          </label>
          <MicButton
            value={notes}
            onChange={onNotesChange}
            onError={onError}
          />
        </div>
        <p className="text-xs text-gray-500 mb-2">
          Comportement pendant la passation, fatigabilité, anxiété, collaboration, conditions
          de passation (lunettes, audition, langue maternelle…). Les notes spécifiques à un
          domaine se saisissent directement dans la carte du domaine au-dessus.
        </p>
        <textarea
          value={notes}
          onChange={(e) => onNotesChange(e.target.value)}
          rows={4}
          placeholder="Madame X collabore volontiers, sans signe de fatigue durant les 10 minutes du test. Lunettes portées. Plainte mnésique active rapportée par l'entourage."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm resize-none"
        />
      </div>
    </div>
  )
}
