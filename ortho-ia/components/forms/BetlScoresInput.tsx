'use client'

/**
 * Saisie structurée des scores BETL — Batterie d'Évaluation des Troubles Lexicaux
 * (Tran & Godefroy, Ortho Édition 2015).
 *
 * Contrairement à un test percentile-based (Exalang…), la BETL produit pour
 * chaque épreuve TROIS indicateurs :
 *   - un score brut /54,
 *   - un temps total (en secondes),
 *   - un verdict N (Normal) ou P (Pathologique) calculé par le logiciel BETL
 *     en fonction de l'âge × NSC du patient.
 *
 * Le verdict du logiciel BETL est la SOURCE DE VÉRITÉ officielle (Annexe 3 du
 * manuel). On le saisit tel quel : pas de tentative de recomputation des
 * seuils côté UI (les valeurs exactes varient par âge × NSC × épreuve et ne
 * sont pas publiques en dehors du logiciel).
 *
 * Le composant écrit un texte normalisé dans `resultats_manuels` :
 *   - tableau récapitulatif des 8 épreuves (score, temps, verdict N/P),
 *   - synthèse des indices cliniques (ébauche orale, comportements),
 *   - profil discours,
 *   - stratification (âge × NSC).
 *
 * Couplage : `app/dashboard/nouveau-crbo/page.tsx` lorsque le SEUL test
 * sélectionné est "BETL". Pour un bilan BETL combiné avec autre chose, on
 * tombe sur le textarea standard (l'ortho saisit librement).
 */

import { useEffect, useMemo, useState } from 'react'
import { BookOpenCheck, AlertCircle, ChevronDown, Lightbulb, CheckCircle2 } from 'lucide-react'
import MicButton from '../MicButton'

type EpreuveKey = 'I' | 'II' | 'III' | 'IV' | 'V' | 'VI' | 'VII' | 'VIII'
type TrancheAge = '20-34' | '35-49' | '50-64' | '65-79' | '80-95'
type NSC = '1' | '2' | '3'
type Verdict = 'N' | 'P' | ''

interface EpreuveState {
  score: string         // /54
  temps: string         // secondes (total épreuve)
  verdictScore: Verdict
  verdictTemps: Verdict
  observation: string
}

interface BetlState {
  trancheAge: TrancheAge | ''
  nsc: NSC | ''
  epreuves: Record<EpreuveKey, EpreuveState>
  scoreOrthoVII: string         // VII a un score orthographique /54 séparé du score lexical
  verdictOrthoVII: Verdict
  ebaucheOrale: 'efficace' | 'inefficace' | 'non-testee' | ''
  comportements: string         // analyse qualitative Annexe 1
  profilDiscours: string        // Annexe 2
}

/**
 * Matrice complète 5 tranches d'âge × 3 NSC, telle qu'imprimée dans
 * l'Annexe 3 du manuel BETL 2015. Les valeurs sont les seuils OFFICIELS
 * (score P5, temps P95) — pas une moyenne, pas une approximation.
 */
type SeuilMatrix = Record<TrancheAge, Record<NSC, number>>

interface EpreuveMeta {
  key: EpreuveKey
  label: string
  max: number
  hint: string
  rules: string[]
  /**
   * Scores-seuils P5 (sur 54) : un score inférieur au seuil est pathologique.
   * Source : Annexe 3 du manuel BETL (Tran & Godefroy 2015), p. 44-46.
   */
  seuilScoreP5: SeuilMatrix
  /**
   * Temps-seuils P95 (en secondes) : un temps supérieur au seuil est pathologique.
   * Source : Annexe 3 du manuel BETL (Tran & Godefroy 2015), p. 44-46.
   */
  seuilTempsP95: SeuilMatrix
  /** Aide à l'interprétation (Annexe 1 + Profils validés). */
  interpretation: string[]
}

/**
 * Scores orthographiques-seuils P5 (sur 54) — épreuve VII uniquement.
 * Le score orthographique chute logiquement avec l'âge et le NSC bas (39 → 29
 * pour NSC 1, 80-95 ans). Toujours interpréter avec la stratification.
 * Source : Annexe 3 du manuel BETL (Tran & Godefroy 2015), p. 45.
 */
const SEUIL_ORTHO_VII: SeuilMatrix = {
  '20-34': { '1': 38, '2': 42, '3': 45 },
  '35-49': { '1': 38, '2': 42, '3': 45 },
  '50-64': { '1': 37, '2': 41, '3': 45 },
  '65-79': { '1': 33, '2': 38, '3': 42 },
  '80-95': { '1': 29, '2': 34, '3': 38 },
}

/**
 * Catalogue des 8 épreuves BETL avec matrices complètes de seuils (Annexe 3
 * du manuel 2015). Lecture des matrices :
 *   seuilScoreP5['35-49']['2']  → seuil score (sur 54) pour la tranche
 *                                  35-49 ans, NSC 2. Un score INFÉRIEUR
 *                                  à cette valeur est pathologique (P).
 *   seuilTempsP95['35-49']['2'] → seuil temps (en secondes) pour la même
 *                                  combinaison. Un temps SUPÉRIEUR à
 *                                  cette valeur est pathologique.
 *
 * Les valeurs sont reportées TELLES QUELLES depuis le manuel ; aucune
 * moyenne, aucune extrapolation.
 */
const EPREUVES: EpreuveMeta[] = [
  {
    key: 'I',
    label: 'I — Dénomination orale d\'images',
    max: 54,
    hint: 'Image → production orale du mot-cible',
    rules: [
      'Score = nombre d\'items correctement dénommés / 54.',
      'Temps = durée totale de passation de l\'épreuve.',
      'En cas d\'échec, proposer l\'ébauche orale (1ʳᵉ syllabe) et noter sa facilitation séparément.',
      'Atteinte ISOLÉE de cette épreuve (II et III préservées) → trouble lexico-phonologique.',
    ],
    seuilScoreP5: {
      '20-34': { '1': 45, '2': 47, '3': 50 },
      '35-49': { '1': 44, '2': 49, '3': 51 },
      '50-64': { '1': 47, '2': 48, '3': 50 },
      '65-79': { '1': 42, '2': 42, '3': 48 },
      '80-95': { '1': 39, '2': 39, '3': 42 },
    },
    seuilTempsP95: {
      '20-34': { '1': 251, '2': 148, '3': 200 },
      '35-49': { '1': 250, '2': 178, '3': 154 },
      '50-64': { '1': 251, '2': 198, '3': 157 },
      '65-79': { '1': 392, '2': 293, '3': 256 },
      '80-95': { '1': 369, '2': 320, '3': 340 },
    },
    interpretation: [
      'Épreuve centrale du diagnostic lexical. Très touchée dans l\'aphasie vasculaire (profil 1).',
      'Dans l\'Alzheimer débutant : score souvent conservé mais TEMPS pathologique (manque du mot sub-clinique).',
      'L\'ébauche orale, si efficace, oriente vers un trouble d\'ACCÈS au lexique phonologique de sortie (pronostic favorable).',
      'Si l\'ébauche est inefficace + lecture à voix haute touchée → atteinte des représentations phonologiques (pronostic moins favorable).',
    ],
  },
  {
    key: 'II',
    label: 'II — Désignation d\'images',
    max: 54,
    hint: 'Mot entendu → désignation de l\'image cible',
    rules: [
      'Score = nombre d\'items correctement désignés / 54.',
      'Tâche réceptive : pas de production verbale exigée.',
      'Peu atteinte dans la maladie d\'Alzheimer débutante (préservation relative de la reconnaissance).',
    ],
    seuilScoreP5: {
      '20-34': { '1': 53, '2': 51, '3': 52 },
      '35-49': { '1': 50, '2': 51, '3': 52 },
      '50-64': { '1': 49, '2': 51, '3': 52 },
      '65-79': { '1': 47, '2': 49, '3': 50 },
      '80-95': { '1': 48, '2': 48, '3': 50 },
    },
    seuilTempsP95: {
      '20-34': { '1': 275, '2': 193, '3': 228 },
      '35-49': { '1': 275, '2': 230, '3': 223 },
      '50-64': { '1': 275, '2': 327, '3': 259 },
      '65-79': { '1': 421, '2': 314, '3': 293 },
      '80-95': { '1': 363, '2': 410, '3': 300 },
    },
    interpretation: [
      'Épreuve de compréhension lexicale orale sur support imagé.',
      'Atteinte simultanée de II et III → orientation lexico-sémantique.',
      'Désignation préservée + dénomination atteinte → trouble d\'accès / de production lexicale.',
    ],
  },
  {
    key: 'III',
    label: 'III — Appariement sémantique d\'images',
    max: 54,
    hint: 'Image cible → image sémantiquement liée (parmi distracteurs)',
    rules: [
      'Score = nombre d\'appariements corrects / 54.',
      'Tâche entièrement non verbale : évalue le traitement sémantique imagé pur.',
      'TRÈS touchée dans l\'Alzheimer (80 % des cas dans la cohorte de validation).',
    ],
    seuilScoreP5: {
      '20-34': { '1': 44, '2': 49, '3': 49 },
      '35-49': { '1': 47, '2': 49, '3': 50 },
      '50-64': { '1': 47, '2': 46, '3': 51 },
      '65-79': { '1': 45, '2': 48, '3': 50 },
      '80-95': { '1': 41, '2': 43, '3': 47 },
    },
    seuilTempsP95: {
      '20-34': { '1': 469, '2': 272, '3': 273 },
      '35-49': { '1': 469, '2': 412, '3': 324 },
      '50-64': { '1': 469, '2': 376, '3': 424 },
      '65-79': { '1': 722, '2': 558, '3': 485 },
      '80-95': { '1': 867, '2': 617, '3': 653 },
    },
    interpretation: [
      'Si atteinte → forte présomption d\'atteinte sémantique centrale, à confirmer en VIII.',
      'Conjuguée à I et II touchées (≥ 2 sur 3 en étape A) : trouble lexico-sémantique avéré.',
    ],
  },
  {
    key: 'IV',
    label: 'IV — Lecture à voix haute',
    max: 54,
    hint: 'Mot écrit → production orale',
    rules: [
      'Score = nombre de mots correctement lus à voix haute / 54.',
      'Atteinte ISOLÉE → trouble du transcodage grapho-phonémique (transposition visuo-phonatoire).',
      'Plafond rapide chez les sujets sains : la moindre baisse est significative.',
    ],
    seuilScoreP5: {
      '20-34': { '1': 53, '2': 54, '3': 54 },
      '35-49': { '1': 53, '2': 54, '3': 54 },
      '50-64': { '1': 53, '2': 54, '3': 54 },
      '65-79': { '1': 53, '2': 54, '3': 54 },
      '80-95': { '1': 52, '2': 53, '3': 53 },
    },
    seuilTempsP95: {
      '20-34': { '1': 101, '2': 98, '3': 98 },
      '35-49': { '1': 101, '2': 98, '3': 98 },
      '50-64': { '1': 101, '2': 98, '3': 98 },
      '65-79': { '1': 101, '2': 98, '3': 98 },
      '80-95': { '1': 107, '2': 107, '3': 107 },
    },
    interpretation: [
      'Lecture préservée + dénomination orale atteinte → trouble d\'accès au lexique phonologique de sortie (ébauche efficace attendue).',
      'Lecture atteinte + dénomination atteinte → atteinte des représentations phonologiques (ébauche peu efficace).',
    ],
  },
  {
    key: 'V',
    label: 'V — Désignation de mots écrits',
    max: 54,
    hint: 'Mot entendu → désignation du mot écrit',
    rules: [
      'Score = nombre de mots correctement désignés / 54.',
      'Évalue le lexique orthographique d\'entrée + appariement oral/écrit.',
      'Préservée dans l\'aphasie phonologique pure.',
    ],
    seuilScoreP5: {
      '20-34': { '1': 52, '2': 53, '3': 53 },
      '35-49': { '1': 52, '2': 53, '3': 53 },
      '50-64': { '1': 52, '2': 53, '3': 53 },
      '65-79': { '1': 52, '2': 53, '3': 53 },
      '80-95': { '1': 45, '2': 52, '3': 53 },
    },
    seuilTempsP95: {
      '20-34': { '1': 192, '2': 192, '3': 192 },
      '35-49': { '1': 202, '2': 202, '3': 202 },
      '50-64': { '1': 206, '2': 206, '3': 206 },
      '65-79': { '1': 212, '2': 212, '3': 212 },
      '80-95': { '1': 248, '2': 248, '3': 248 },
    },
    interpretation: [
      'Atteinte de V (avec II préservée) → atteinte spécifique de la modalité écrite réceptive.',
    ],
  },
  {
    key: 'VI',
    label: 'VI — Appariement sémantique de mots écrits',
    max: 54,
    hint: 'Mot écrit cible → mot écrit sémantiquement lié',
    rules: [
      'Score = nombre d\'appariements corrects / 54.',
      'Recommandée EN PRIORITÉ pour suspicion d\'Alzheimer débutant (Ageon & Caze-Blanc 2014) : minimise la composante visuo-perceptive, profite de la meilleure préservation de l\'écrit.',
    ],
    seuilScoreP5: {
      '20-34': { '1': 48, '2': 48, '3': 49 },
      '35-49': { '1': 48, '2': 48, '3': 49 },
      '50-64': { '1': 48, '2': 48, '3': 49 },
      '65-79': { '1': 48, '2': 48, '3': 49 },
      '80-95': { '1': 48, '2': 48, '3': 49 },
    },
    seuilTempsP95: {
      '20-34': { '1': 337, '2': 337, '3': 337 },
      '35-49': { '1': 362, '2': 362, '3': 362 },
      '50-64': { '1': 337, '2': 337, '3': 337 },
      '65-79': { '1': 337, '2': 337, '3': 337 },
      '80-95': { '1': 461, '2': 461, '3': 461 },
    },
    interpretation: [
      'Atteinte de VI ↔ atteinte sémantique centrale, à coupler avec VIII.',
      'Atteinte VI > III dans certains profils Alzheimer : explorer systématiquement même si III préservée.',
    ],
  },
  {
    key: 'VII',
    label: 'VII — Dénomination écrite d\'images',
    max: 54,
    hint: 'Image → production écrite (score lexical + score orthographique)',
    rules: [
      'DEUX SCORES distincts :',
      '   • Score LEXICAL : nombre d\'items où le bon mot a été récupéré (/ 54).',
      '   • Score ORTHOGRAPHIQUE : précision orthographique des mots produits (sur 54).',
      'Renseigner le score orthographique dans le champ dédié plus bas — il a sa propre matrice de seuils.',
    ],
    seuilScoreP5: {
      '20-34': { '1': 48, '2': 49, '3': 50 },
      '35-49': { '1': 46, '2': 47, '3': 49 },
      '50-64': { '1': 44, '2': 46, '3': 47 },
      '65-79': { '1': 43, '2': 44, '3': 46 },
      '80-95': { '1': 41, '2': 43, '3': 44 },
    },
    seuilTempsP95: {
      '20-34': { '1': 660, '2': 586, '3': 519 },
      '35-49': { '1': 731, '2': 648, '3': 575 },
      '50-64': { '1': 809, '2': 718, '3': 638 },
      '65-79': { '1': 895, '2': 795, '3': 706 },
      '80-95': { '1': 993, '2': 881, '3': 782 },
    },
    interpretation: [
      'VII lexical préservé + I lexical atteint → dissociation orale/écrite, atteinte de la modalité orale de production.',
      'Le score orthographique chute logiquement avec l\'âge et le NSC bas : interpréter strictement avec la stratification.',
    ],
  },
  {
    key: 'VIII',
    label: 'VIII — Questionnaire sémantique',
    max: 54,
    hint: 'Vérification de 4 propriétés sémantiques par item (oral/oui-non)',
    rules: [
      'Score = nombre d\'items pour lesquels les 4 propriétés sont correctement jugées / 54.',
      'Durée ~ 15 min. Charge attentionnelle importante.',
      '⚠️ NE PAS proposer en première intention aux aphasies modérées à sévères vasculaires/traumatiques.',
      'Réservée aux profils SUSPECTÉS lexico-sémantiques (Alzheimer, démence sémantique, APP).',
    ],
    seuilScoreP5: {
      '20-34': { '1': 44, '2': 47, '3': 48 },
      '35-49': { '1': 44, '2': 47, '3': 48 },
      '50-64': { '1': 44, '2': 47, '3': 48 },
      '65-79': { '1': 44, '2': 50, '3': 47 },
      '80-95': { '1': 40, '2': 40, '3': 40 },
    },
    seuilTempsP95: {
      '20-34': { '1': 1446, '2': 1204, '3': 1179 },
      '35-49': { '1': 1446, '2': 1204, '3': 1179 },
      '50-64': { '1': 1446, '2': 1204, '3': 1179 },
      '65-79': { '1': 1446, '2': 1204, '3': 1179 },
      '80-95': { '1': 1446, '2': 1204, '3': 1179 },
    },
    interpretation: [
      'Épreuve qui CONFIRME ou INFIRME l\'atteinte des connaissances sémantiques centrales.',
      'Atteinte → forte orientation vers un processus neurodégénératif. Référence systématique en consultation mémoire.',
    ],
  },
]

const EMPTY_EPREUVE: EpreuveState = {
  score: '', temps: '', verdictScore: '', verdictTemps: '', observation: '',
}

const INITIAL_STATE: BetlState = {
  trancheAge: '',
  nsc: '',
  epreuves: {
    I: { ...EMPTY_EPREUVE }, II: { ...EMPTY_EPREUVE }, III: { ...EMPTY_EPREUVE },
    IV: { ...EMPTY_EPREUVE }, V: { ...EMPTY_EPREUVE }, VI: { ...EMPTY_EPREUVE },
    VII: { ...EMPTY_EPREUVE }, VIII: { ...EMPTY_EPREUVE },
  },
  scoreOrthoVII: '',
  verdictOrthoVII: '',
  ebaucheOrale: '',
  comportements: '',
  profilDiscours: '',
}

interface Props {
  notes: string
  onNotesChange: (v: string) => void
  onResultatsChange: (normalized: string) => void
  onError?: (msg: string) => void
  /** Pré-remplissage tranche d'âge depuis la DDN du formulaire parent. */
  ageEstime?: number
}

function trancheFromAge(age: number): TrancheAge | '' {
  if (!Number.isFinite(age) || age < 20) return ''
  if (age <= 34) return '20-34'
  if (age <= 49) return '35-49'
  if (age <= 64) return '50-64'
  if (age <= 79) return '65-79'
  return '80-95'
}

function clampScore(raw: string, max: number): number {
  const n = parseInt((raw || '').trim(), 10)
  if (isNaN(n) || n < 0) return 0
  return Math.min(max, n)
}

export default function BetlScoresInput({ notes, onNotesChange, onResultatsChange, onError, ageEstime }: Props) {
  const [state, setState] = useState<BetlState>(() => ({
    ...INITIAL_STATE,
    trancheAge: ageEstime ? trancheFromAge(ageEstime) : '',
  }))

  // Stratification : valeurs par défaut quand l'ortho n'a pas (encore) précisé.
  // NSC 2 = segment majoritaire de la population. Tranche 50-64 = milieu de
  // l'étalonnage. Les seuils affichés tant que la stratification reste à ces
  // défauts ne sont qu'indicatifs — un bandeau ci-dessous invite à compléter.
  const nscEffectif: NSC = (state.nsc || '2') as NSC
  const trancheEffective: TrancheAge = (state.trancheAge || '50-64') as TrancheAge
  const stratificationComplete = !!state.nsc && !!state.trancheAge

  /** Renvoie le seuil score P5 du manuel pour l'épreuve, en fonction de la
   *  stratification courante (tranche × NSC). */
  const seuilScore = (meta: EpreuveMeta): number =>
    meta.seuilScoreP5[trancheEffective][nscEffectif]
  /** Idem pour le temps-seuil P95 (en secondes). */
  const seuilTemps = (meta: EpreuveMeta): number =>
    meta.seuilTempsP95[trancheEffective][nscEffectif]
  /** Seuil score orthographique VII selon stratification courante. */
  const seuilOrthoVII = (): number => SEUIL_ORTHO_VII[trancheEffective][nscEffectif]

  const hasAnyScore = useMemo(
    () => Object.values(state.epreuves).some(e => e.score.trim() !== ''),
    [state.epreuves],
  )

  // ===== Émission normalisée vers resultats_manuels =====
  // Format dense et tabulaire — la prose narrative sera générée par l'IA
  // à partir de ces données + les règles cliniques du module BETL.
  useEffect(() => {
    if (!hasAnyScore) {
      onResultatsChange('')
      return
    }
    const lines: string[] = []
    lines.push('=== BETL — Batterie d\'Évaluation des Troubles Lexicaux (Tran & Godefroy 2015) ===')
    lines.push(`Stratification : tranche d'âge ${state.trancheAge || `non précisée (${trancheEffective} par défaut)`} × NSC ${state.nsc || '2 par défaut'}`)
    lines.push(`Seuils officiels appliqués : score P5 (manuel BETL Annexe 3) — temps P95 (manuel BETL Annexe 3).`)
    lines.push('---')
    for (const meta of EPREUVES) {
      const e = state.epreuves[meta.key]
      const score = e.score.trim()
      if (!score) continue
      const scoreNum = clampScore(score, meta.max)
      const tempsNum = e.temps.trim() ? parseInt(e.temps.trim(), 10) : null
      const sScore = seuilScore(meta)
      const sTemps = seuilTemps(meta)
      const verdicts: string[] = []
      if (e.verdictScore) verdicts.push(`Score ${e.verdictScore}`)
      if (e.verdictTemps) verdicts.push(`Temps ${e.verdictTemps}`)
      const verdictStr = verdicts.length > 0 ? ` — ${verdicts.join(' / ')}` : ''
      const tempsStr = tempsNum != null ? ` — Temps : ${tempsNum} s` : ''
      lines.push(
        `${meta.label} : ${scoreNum}/${meta.max} (seuil P5 : ${sScore})${tempsStr}` +
        (tempsNum != null ? ` (seuil P95 : ${sTemps} s)` : '') +
        verdictStr,
      )
      if (meta.key === 'VII' && state.scoreOrthoVII.trim()) {
        const ortho = clampScore(state.scoreOrthoVII, 54)
        const sOrtho = seuilOrthoVII()
        const v = state.verdictOrthoVII ? ` — Score orthographique ${state.verdictOrthoVII}` : ''
        lines.push(`  Score orthographique VII : ${ortho}/54 (seuil P5 : ${sOrtho})${v}`)
      }
      if (e.observation.trim()) {
        lines.push(`  Obs : ${e.observation.trim()}`)
      }
    }
    lines.push('---')
    if (state.ebaucheOrale) {
      const label =
        state.ebaucheOrale === 'efficace' ? 'EFFICACE (trouble d\'accès)' :
        state.ebaucheOrale === 'inefficace' ? 'INEFFICACE (atteinte des représentations)' :
        'non testée'
      lines.push(`Ébauche orale (indiçage phonologique) : ${label}`)
    }
    if (state.comportements.trim()) {
      lines.push(`Comportements dénominatifs (Annexe 1) : ${state.comportements.trim()}`)
    }
    if (state.profilDiscours.trim()) {
      lines.push(`Profil dénominatif dans le discours (Annexe 2) : ${state.profilDiscours.trim()}`)
    }
    onResultatsChange(lines.join('\n'))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, hasAnyScore])

  // ===== Helpers de mise à jour =====
  const updateEpreuve = (key: EpreuveKey, field: keyof EpreuveState, value: string) => {
    setState(s => ({
      ...s,
      epreuves: { ...s.epreuves, [key]: { ...s.epreuves[key], [field]: value } },
    }))
  }

  const setScore = (key: EpreuveKey, value: string, max: number) => {
    if (value === '') return updateEpreuve(key, 'score', '')
    const n = parseInt(value, 10)
    if (isNaN(n)) return
    updateEpreuve(key, 'score', String(Math.min(max, Math.max(0, n))))
  }

  const setTemps = (key: EpreuveKey, value: string) => {
    if (value === '') return updateEpreuve(key, 'temps', '')
    const n = parseInt(value, 10)
    if (isNaN(n)) return
    updateEpreuve(key, 'temps', String(Math.max(0, n)))
  }

  // ===== Sévérité globale (synthèse) =====
  // Comptabilise le nombre d'épreuves avec verdict P pour donner un indicateur
  // de gravité global. N'est PAS un diagnostic ; juste un repère visuel.
  const stats = useMemo(() => {
    let scoresP = 0, tempsP = 0, scoresN = 0, tempsN = 0, total = 0
    for (const meta of EPREUVES) {
      const e = state.epreuves[meta.key]
      if (!e.score.trim()) continue
      total += 1
      if (e.verdictScore === 'P') scoresP += 1
      else if (e.verdictScore === 'N') scoresN += 1
      if (e.verdictTemps === 'P') tempsP += 1
      else if (e.verdictTemps === 'N') tempsN += 1
    }
    return { scoresP, tempsP, scoresN, tempsN, total }
  }, [state.epreuves])

  return (
    <div className="space-y-4">
      {/* Bandeau intro */}
      <div className="flex items-start gap-2 p-3 rounded-lg border border-emerald-200 bg-emerald-50">
        <BookOpenCheck size={18} className="text-emerald-700 shrink-0 mt-0.5" />
        <div className="text-sm">
          <p className="font-semibold text-emerald-900">Saisie structurée BETL</p>
          <p className="text-emerald-800 text-xs mt-0.5">
            Saisissez le score /54, le temps (en secondes) et le verdict N/P donné par le logiciel BETL pour chaque épreuve.
            Le verdict est calculé par le logiciel à partir des seuils officiels (Annexe 3 du manuel) — c&apos;est lui qui fait foi.
          </p>
        </div>
      </div>

      {/* Stratification âge × NSC */}
      <div className="rounded-lg border border-gray-200 bg-white p-3">
        <p className="text-sm font-semibold text-gray-900 mb-2">Stratification (oblige les seuils du logiciel)</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label className="block">
            <span className="block text-xs text-gray-700 mb-1">Tranche d&apos;âge</span>
            <select
              value={state.trancheAge}
              onChange={(e) => setState(s => ({ ...s, trancheAge: e.target.value as TrancheAge | '' }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
            >
              <option value="">— Choisir —</option>
              <option value="20-34">20 – 34 ans</option>
              <option value="35-49">35 – 49 ans</option>
              <option value="50-64">50 – 64 ans</option>
              <option value="65-79">65 – 79 ans</option>
              <option value="80-95">80 – 95 ans (normes indicatives)</option>
            </select>
          </label>
          <label className="block">
            <span className="block text-xs text-gray-700 mb-1">Niveau socio-culturel (NSC)</span>
            <select
              value={state.nsc}
              onChange={(e) => setState(s => ({ ...s, nsc: e.target.value as NSC | '' }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
            >
              <option value="">— Choisir —</option>
              <option value="1">NSC 1 — ≤ CAP / BEP / Brevet</option>
              <option value="2">NSC 2 — Bac à Bac+2</option>
              <option value="3">NSC 3 — ≥ Bac+3 (cadre / ingénieur)</option>
            </select>
          </label>
        </div>
      </div>

      {/* Bandeau indiquant que la stratification est complète / par défaut */}
      {!stratificationComplete && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900 flex items-start gap-2">
          <AlertCircle size={14} className="shrink-0 mt-0.5" />
          <span>
            Stratification incomplète — les seuils affichés reposent sur les valeurs par défaut
            (tranche <strong>50-64 ans</strong>, NSC <strong>2</strong>). Renseignez l&apos;âge et le NSC ci-dessus
            pour obtenir les seuils OFFICIELS exacts du manuel BETL (Annexe 3) pour ce patient.
          </span>
        </div>
      )}

      {/* 8 cartes épreuves */}
      <div className="space-y-3">
        {EPREUVES.map(meta => {
          const e = state.epreuves[meta.key]
          const seuilScoreVal = seuilScore(meta)
          const seuilTempsVal = seuilTemps(meta)
          const scoreNum = e.score.trim() ? clampScore(e.score, meta.max) : null
          const scorePct = scoreNum != null ? Math.round((scoreNum / meta.max) * 100) : null

          return (
            <div key={meta.key} className="rounded-lg border border-gray-200 bg-white p-4">
              <div className="flex items-start justify-between gap-3 flex-wrap mb-2">
                <div className="flex-1 min-w-0">
                  <label className="block text-sm font-semibold text-gray-900">{meta.label}</label>
                  <p className="text-xs text-gray-500 mt-0.5">{meta.hint}</p>
                  <p className="text-[11px] text-gray-400 mt-1">
                    Seuil P5 ({trancheEffective} ans, NSC {nscEffectif}) : <span className="font-mono">&lt; {seuilScoreVal}/{meta.max}</span> = pathologique
                    {' · '}Temps-seuil P95 : <span className="font-mono">&gt; {seuilTempsVal} s</span>
                  </p>
                </div>
              </div>

              {/* Score + Temps + Verdicts en grille */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="rounded-md border border-gray-200 bg-gray-50 p-2">
                  <p className="text-[11px] font-medium text-gray-600 uppercase tracking-wide mb-1">Score</p>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={0}
                      max={meta.max}
                      step={1}
                      value={e.score}
                      onChange={(ev) => setScore(meta.key, ev.target.value, meta.max)}
                      placeholder="0"
                      className="w-16 px-2 py-1.5 border border-gray-300 rounded text-center text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-400"
                    />
                    <span className="text-sm text-gray-500">/ {meta.max}</span>
                    {scorePct != null && (
                      <span className={`text-xs font-medium ml-auto ${
                        scorePct >= 90 ? 'text-emerald-700'
                        : scorePct >= 70 ? 'text-amber-700'
                        : 'text-red-700'
                      }`}>{scorePct}%</span>
                    )}
                  </div>
                  <div className="mt-2 flex items-center gap-1.5">
                    <span className="text-[11px] text-gray-500">Verdict logiciel :</span>
                    <button
                      type="button"
                      onClick={() => updateEpreuve(meta.key, 'verdictScore', e.verdictScore === 'N' ? '' : 'N')}
                      className={`text-[11px] font-bold px-2 py-0.5 rounded border ${
                        e.verdictScore === 'N'
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : 'bg-white text-gray-600 border-gray-300 hover:border-emerald-400'
                      }`}
                    >N</button>
                    <button
                      type="button"
                      onClick={() => updateEpreuve(meta.key, 'verdictScore', e.verdictScore === 'P' ? '' : 'P')}
                      className={`text-[11px] font-bold px-2 py-0.5 rounded border ${
                        e.verdictScore === 'P'
                          ? 'bg-red-600 text-white border-red-600'
                          : 'bg-white text-gray-600 border-gray-300 hover:border-red-400'
                      }`}
                    >P</button>
                  </div>
                </div>

                <div className="rounded-md border border-gray-200 bg-gray-50 p-2">
                  <p className="text-[11px] font-medium text-gray-600 uppercase tracking-wide mb-1">Temps (secondes)</p>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={0}
                      step={1}
                      value={e.temps}
                      onChange={(ev) => setTemps(meta.key, ev.target.value)}
                      placeholder="ex. 245"
                      className="w-20 px-2 py-1.5 border border-gray-300 rounded text-center text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-400"
                    />
                    <span className="text-sm text-gray-500">s</span>
                  </div>
                  <div className="mt-2 flex items-center gap-1.5">
                    <span className="text-[11px] text-gray-500">Verdict logiciel :</span>
                    <button
                      type="button"
                      onClick={() => updateEpreuve(meta.key, 'verdictTemps', e.verdictTemps === 'N' ? '' : 'N')}
                      className={`text-[11px] font-bold px-2 py-0.5 rounded border ${
                        e.verdictTemps === 'N'
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : 'bg-white text-gray-600 border-gray-300 hover:border-emerald-400'
                      }`}
                    >N</button>
                    <button
                      type="button"
                      onClick={() => updateEpreuve(meta.key, 'verdictTemps', e.verdictTemps === 'P' ? '' : 'P')}
                      className={`text-[11px] font-bold px-2 py-0.5 rounded border ${
                        e.verdictTemps === 'P'
                          ? 'bg-red-600 text-white border-red-600'
                          : 'bg-white text-gray-600 border-gray-300 hover:border-red-400'
                      }`}
                    >P</button>
                  </div>
                </div>
              </div>

              {/* VII : score orthographique additionnel */}
              {meta.key === 'VII' && (
                <div className="mt-3 rounded-md border border-purple-200 bg-purple-50/60 p-2.5">
                  <p className="text-[11px] font-semibold text-purple-900 mb-1">
                    Score orthographique (qualité orthographique des mots produits)
                  </p>
                  <p className="text-[10px] text-purple-700 mb-1">
                    Seuil P5 ({trancheEffective} ans, NSC {nscEffectif}) : <span className="font-mono">&lt; {seuilOrthoVII()}/54</span> = pathologique
                  </p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <input
                      type="number"
                      min={0}
                      max={54}
                      step={1}
                      value={state.scoreOrthoVII}
                      onChange={(ev) => {
                        const v = ev.target.value
                        if (v === '') return setState(s => ({ ...s, scoreOrthoVII: '' }))
                        const n = parseInt(v, 10)
                        if (isNaN(n)) return
                        setState(s => ({ ...s, scoreOrthoVII: String(Math.min(54, Math.max(0, n))) }))
                      }}
                      placeholder="0"
                      className="w-16 px-2 py-1 border border-gray-300 rounded text-center text-sm font-mono focus:outline-none focus:ring-2 focus:ring-purple-400"
                    />
                    <span className="text-sm text-gray-500">/ 54</span>
                    <span className="text-[11px] text-gray-500">Verdict :</span>
                    <button
                      type="button"
                      onClick={() => setState(s => ({ ...s, verdictOrthoVII: s.verdictOrthoVII === 'N' ? '' : 'N' }))}
                      className={`text-[11px] font-bold px-2 py-0.5 rounded border ${
                        state.verdictOrthoVII === 'N'
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : 'bg-white text-gray-600 border-gray-300 hover:border-emerald-400'
                      }`}
                    >N</button>
                    <button
                      type="button"
                      onClick={() => setState(s => ({ ...s, verdictOrthoVII: s.verdictOrthoVII === 'P' ? '' : 'P' }))}
                      className={`text-[11px] font-bold px-2 py-0.5 rounded border ${
                        state.verdictOrthoVII === 'P'
                          ? 'bg-red-600 text-white border-red-600'
                          : 'bg-white text-gray-600 border-gray-300 hover:border-red-400'
                      }`}
                    >P</button>
                  </div>
                </div>
              )}

              {/* Règles de cotation officielles — accordéon */}
              <details className="group mt-3 rounded-md border border-indigo-100 bg-indigo-50/50">
                <summary className="flex items-center gap-1.5 px-3 py-2 cursor-pointer select-none text-xs font-medium text-indigo-800 hover:bg-indigo-50">
                  <ChevronDown size={14} className="transition-transform group-open:rotate-0 -rotate-90" />
                  Règles de cotation officielles
                </summary>
                <ul className="px-3 pb-3 pt-1 space-y-1 text-xs text-gray-700">
                  {meta.rules.map((r, i) => (<li key={i} className="leading-relaxed">{r}</li>))}
                </ul>
              </details>

              {/* Aide à l'interprétation — basée sur les profils validés (Annexe 1, Tran et al. 2010) */}
              <details className="group mt-2 rounded-md border border-amber-200 bg-amber-50/60">
                <summary className="flex items-center gap-1.5 px-3 py-2 cursor-pointer select-none text-xs font-medium text-amber-900 hover:bg-amber-100/50">
                  <Lightbulb size={14} className="shrink-0" />
                  Aide à l&apos;interprétation clinique
                </summary>
                <ul className="px-3 pb-3 pt-1 space-y-1 text-xs text-gray-700">
                  {meta.interpretation.map((r, i) => (<li key={i} className="leading-relaxed">{r}</li>))}
                </ul>
              </details>

              {/* Observation libre + dictée */}
              <div className="mt-3">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-medium text-gray-700">
                    Observation qualitative (optionnel)
                  </label>
                  <MicButton
                    value={e.observation}
                    onChange={(v) => updateEpreuve(meta.key, 'observation', v)}
                    onError={onError}
                    ariaLabel={`Dicter une observation pour ${meta.label}`}
                  />
                </div>
                <textarea
                  value={e.observation}
                  onChange={(ev) => updateEpreuve(meta.key, 'observation', ev.target.value)}
                  rows={2}
                  placeholder={
                    meta.key === 'I'
                      ? 'Ex. paraphasies sémantiques fréquentes, conduites d\'approche formelles, ébauche efficace sur 3 items / 5.'
                      : 'Type d\'erreurs, stratégies observées, modalisations.'
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-400 text-sm resize-none"
                />
              </div>
            </div>
          )
        })}
      </div>

      {/* Indices cliniques transversaux */}
      <div className="rounded-lg border border-gray-200 bg-white p-4 space-y-4">
        <p className="text-sm font-semibold text-gray-900">Indices cliniques transversaux</p>

        <div>
          <p className="text-xs font-medium text-gray-700 mb-1">
            Ébauche orale (indiçage phonologique sur épreuve I) — marqueur pronostic
          </p>
          <div className="flex flex-wrap gap-2">
            {([
              { v: 'efficace', label: 'Efficace (trouble d\'accès — pronostic favorable)' },
              { v: 'inefficace', label: 'Inefficace (atteinte des représentations — pronostic moins favorable)' },
              { v: 'non-testee', label: 'Non testée' },
            ] as const).map(opt => (
              <button
                key={opt.v}
                type="button"
                onClick={() => setState(s => ({ ...s, ebaucheOrale: s.ebaucheOrale === opt.v ? '' : opt.v }))}
                className={`text-xs px-2.5 py-1.5 rounded border ${
                  state.ebaucheOrale === opt.v
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-emerald-400'
                }`}
              >{opt.label}</button>
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-medium text-gray-700">
              Comportements dénominatifs observés (Annexe 1 du manuel)
            </label>
            <MicButton
              value={state.comportements}
              onChange={(v) => setState(s => ({ ...s, comportements: v }))}
              onError={onError}
              ariaLabel="Dicter les comportements dénominatifs"
            />
          </div>
          <p className="text-[11px] text-gray-500 mb-1.5">
            Paraphasies (lexicales/segmentales/sémantiques), conduites d&apos;approche (formelles/sémantiques),
            persévérations, dénominations vides ou génériques, modalisations…
          </p>
          <textarea
            value={state.comportements}
            onChange={(ev) => setState(s => ({ ...s, comportements: ev.target.value }))}
            rows={3}
            placeholder="Ex. paraphasies sémantiques prédominantes sur les catégories biologiques, conduites d'approche formelles efficaces (3/5 items), conscience du trouble présente."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-400 text-sm resize-none"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-medium text-gray-700">
              Profil dénominatif dans le discours (Annexe 2 du manuel)
            </label>
            <MicButton
              value={state.profilDiscours}
              onChange={(v) => setState(s => ({ ...s, profilDiscours: v }))}
              onError={onError}
              ariaLabel="Dicter le profil discursif"
            />
          </div>
          <p className="text-[11px] text-gray-500 mb-1.5">
            Fréquence des recherches lexicales, informativité, déroulement, comportement verbal, handicap communicationnel.
          </p>
          <textarea
            value={state.profilDiscours}
            onChange={(ev) => setState(s => ({ ...s, profilDiscours: ev.target.value }))}
            rows={3}
            placeholder="Ex. recherches lexicales fréquentes, informativité moyenne, discours fluide globalement, conscience du trouble + stratégies efficaces (circonlocutions référentielles), handicap communicationnel léger en conversation."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-400 text-sm resize-none"
          />
        </div>
      </div>

      {/* Synthèse graphique + tableau récap */}
      {hasAnyScore && (
        <BetlSummary state={state} nsc={nscEffectif} tranche={trancheEffective} />
      )}

      {/* Compteurs synthétiques */}
      {hasAnyScore && (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
          <div>
            <p className="text-[11px] text-gray-500 uppercase tracking-wide">Scores N</p>
            <p className="text-xl font-bold text-emerald-700">{stats.scoresN}</p>
          </div>
          <div>
            <p className="text-[11px] text-gray-500 uppercase tracking-wide">Scores P</p>
            <p className="text-xl font-bold text-red-700">{stats.scoresP}</p>
          </div>
          <div>
            <p className="text-[11px] text-gray-500 uppercase tracking-wide">Temps N</p>
            <p className="text-xl font-bold text-emerald-700">{stats.tempsN}</p>
          </div>
          <div>
            <p className="text-[11px] text-gray-500 uppercase tracking-wide">Temps P</p>
            <p className="text-xl font-bold text-red-700">{stats.tempsP}</p>
          </div>
        </div>
      )}

      {/* Notes générales de passation */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="block text-sm font-medium text-gray-700">
            Notes générales de passation (optionnel)
          </label>
          <MicButton value={notes} onChange={onNotesChange} onError={onError} />
        </div>
        <p className="text-xs text-gray-500 mb-2">
          Conditions de passation, fatigabilité, anxiété, collaboration, audition / vision corrigées,
          langue maternelle, prémorbidité (latéralité, profession).
        </p>
        <textarea
          value={notes}
          onChange={(e) => onNotesChange(e.target.value)}
          rows={4}
          placeholder="Monsieur X collabore bien malgré une fatigabilité notable sur l'épreuve VIII. Latéralité droite, profession antérieure : artisan menuisier (NSC 1)."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm resize-none"
        />
      </div>
    </div>
  )
}

/**
 * Tableau récap + graphique de synthèse (SVG simple) montrant pour chaque
 * épreuve le score du patient (barre) vs le seuil P5 OFFICIEL (ligne) pour la
 * tranche d'âge × NSC sélectionnée. Couleur de la barre selon le verdict
 * logiciel saisi par l'ortho.
 */
function BetlSummary({ state, nsc, tranche }: { state: BetlState; nsc: NSC; tranche: TrancheAge }) {
  // Préparer les données — uniquement les épreuves avec score saisi.
  const rows = EPREUVES
    .map(meta => {
      const e = state.epreuves[meta.key]
      if (!e.score.trim()) return null
      const score = clampScore(e.score, meta.max)
      const seuil = meta.seuilScoreP5[tranche][nsc]
      return { meta, e, score, seuil }
    })
    .filter((r): r is { meta: EpreuveMeta; e: EpreuveState; score: number; seuil: number } => r !== null)

  if (rows.length === 0) return null

  // SVG bar chart : largeur = 100%, hauteur fixe, padding intérieur pour labels.
  const W = 720, H = 220, PAD_X = 20, PAD_TOP = 18, PAD_BOTTOM = 50
  const innerH = H - PAD_TOP - PAD_BOTTOM
  const barW = (W - 2 * PAD_X) / rows.length * 0.6
  const slot = (W - 2 * PAD_X) / rows.length

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 space-y-3">
      <div className="flex items-center gap-2">
        <CheckCircle2 size={16} className="text-emerald-600" />
        <p className="text-sm font-semibold text-gray-900">
          Synthèse — scores patient vs seuils P5 officiels (tranche {tranche} ans, NSC {nsc})
        </p>
      </div>

      {/* Graphique */}
      <div className="overflow-x-auto">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full max-w-[760px] h-auto" role="img" aria-label="Synthèse BETL">
          {/* Grille horizontale 0/25/50/75/100 % */}
          {[0, 0.25, 0.5, 0.75, 1].map((p, i) => {
            const y = PAD_TOP + innerH * (1 - p)
            return (
              <g key={i}>
                <line x1={PAD_X} y1={y} x2={W - PAD_X} y2={y} stroke="#E5E7EB" strokeDasharray="3 3" />
                <text x={4} y={y + 3} fontSize="9" fill="#9CA3AF">{Math.round(p * 100)}%</text>
              </g>
            )
          })}

          {/* Barres + seuils par épreuve */}
          {rows.map((r, i) => {
            const cx = PAD_X + i * slot + slot / 2
            const pct = r.score / r.meta.max
            const barH = innerH * pct
            const barY = PAD_TOP + innerH - barH
            const seuilPct = r.seuil / r.meta.max
            const seuilY = PAD_TOP + innerH - innerH * seuilPct

            const color =
              r.e.verdictScore === 'P' ? '#DC2626' :
              r.e.verdictScore === 'N' ? '#059669' :
              '#94A3B8'

            return (
              <g key={r.meta.key}>
                {/* Barre score */}
                <rect
                  x={cx - barW / 2}
                  y={barY}
                  width={barW}
                  height={barH}
                  fill={color}
                  opacity={0.85}
                  rx={3}
                />
                {/* Marqueur seuil P5 indicatif (ligne courte) */}
                <line
                  x1={cx - barW / 2 - 4}
                  x2={cx + barW / 2 + 4}
                  y1={seuilY}
                  y2={seuilY}
                  stroke="#1F2937"
                  strokeWidth={2}
                />
                {/* Valeur score au-dessus */}
                <text
                  x={cx}
                  y={barY - 4}
                  fontSize="10"
                  fontWeight="600"
                  fill={color}
                  textAnchor="middle"
                >{r.score}/{r.meta.max}</text>
                {/* Étiquette épreuve sous l'axe */}
                <text
                  x={cx}
                  y={H - PAD_BOTTOM + 14}
                  fontSize="10"
                  fontWeight="600"
                  fill="#374151"
                  textAnchor="middle"
                >{r.meta.key}</text>
                <text
                  x={cx}
                  y={H - PAD_BOTTOM + 26}
                  fontSize="8"
                  fill="#9CA3AF"
                  textAnchor="middle"
                >seuil {r.seuil}</text>
              </g>
            )
          })}

          {/* Axe X */}
          <line x1={PAD_X} y1={PAD_TOP + innerH} x2={W - PAD_X} y2={PAD_TOP + innerH} stroke="#374151" />
        </svg>
      </div>

      <div className="flex items-center gap-4 text-[11px] text-gray-600 flex-wrap">
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 bg-emerald-600 rounded-sm" /> Score N (Normal)</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 bg-red-600 rounded-sm" /> Score P (Pathologique)</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 bg-slate-400 rounded-sm" /> Verdict non saisi</span>
        <span className="flex items-center gap-1.5"><span className="inline-block w-4 h-0.5 bg-gray-800" /> Seuil P5 indicatif</span>
      </div>

      {/* Tableau récap */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="bg-emerald-50 text-emerald-900">
              <th className="border border-emerald-200 px-2 py-1.5 text-left">Épreuve</th>
              <th className="border border-emerald-200 px-2 py-1.5 text-center">Score</th>
              <th className="border border-emerald-200 px-2 py-1.5 text-center">Verdict</th>
              <th className="border border-emerald-200 px-2 py-1.5 text-center">Temps</th>
              <th className="border border-emerald-200 px-2 py-1.5 text-center">Verdict temps</th>
              <th className="border border-emerald-200 px-2 py-1.5 text-center">Seuil P5 ({tranche}, NSC {nsc})</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.meta.key} className="hover:bg-gray-50">
                <td className="border border-gray-200 px-2 py-1.5">{r.meta.label}</td>
                <td className="border border-gray-200 px-2 py-1.5 text-center font-mono">{r.score}/{r.meta.max}</td>
                <td className={`border border-gray-200 px-2 py-1.5 text-center font-bold ${
                  r.e.verdictScore === 'N' ? 'text-emerald-700 bg-emerald-50'
                  : r.e.verdictScore === 'P' ? 'text-red-700 bg-red-50'
                  : 'text-gray-400'
                }`}>{r.e.verdictScore || '—'}</td>
                <td className="border border-gray-200 px-2 py-1.5 text-center font-mono">{r.e.temps ? `${r.e.temps} s` : '—'}</td>
                <td className={`border border-gray-200 px-2 py-1.5 text-center font-bold ${
                  r.e.verdictTemps === 'N' ? 'text-emerald-700 bg-emerald-50'
                  : r.e.verdictTemps === 'P' ? 'text-red-700 bg-red-50'
                  : 'text-gray-400'
                }`}>{r.e.verdictTemps || '—'}</td>
                <td className="border border-gray-200 px-2 py-1.5 text-center text-gray-500">{r.seuil}/{r.meta.max}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-[11px] text-gray-500 italic flex items-start gap-1.5">
        <AlertCircle size={11} className="shrink-0 mt-0.5" />
        <span>
          Seuils P5 officiels du manuel BETL 2015 (Annexe 3, Tran & Godefroy) pour la stratification
          {' '}<strong>{tranche} ans × NSC {nsc}</strong>. Le verdict N/P à saisir reste celui produit par
          le logiciel BETL, qui peut prendre en compte des marges supplémentaires non publiées.
        </span>
      </p>
    </div>
  )
}
