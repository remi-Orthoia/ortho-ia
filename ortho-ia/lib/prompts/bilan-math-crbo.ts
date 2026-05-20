/**
 * Prompts pour la génération du CRBO complet d'un bilan B-CM / B-CMado.
 *
 * Calibration tonale sur les CRBO Elsa DALL'AGNOL (Profil B). Le framework
 * diagnostique est imposé par les diapos d'Elsa "Diapos diagnostic Profil B"
 * qui distinguent 3 profils :
 *
 *   1. Dyscalculie primaire (S5) — trouble spécifique des apprentissages
 *      mathématiques. Déficit lié à un trouble cognitif NUMÉRIQUE spécifique.
 *      → difficultés en dénombrement, numération, opérations, résolution de
 *        problèmes ; logique préservée.
 *
 *   2. Dyscalculie secondaire — trouble NON spécifique. Déficit lié à un
 *      trouble cognitif non numérique (DI / efficience faible, dyspraxie,
 *      TDA/H, déscolarisation, scolarité inadéquate, TSL).
 *      → mêmes difficultés numériques mais imputables à autre chose.
 *
 *   3. Trouble du raisonnement logico-mathématique (S6) — trouble spécifique.
 *      Déficit lié à un défaut de construction des compétences LOGIQUES.
 *      → difficultés numériques + difficultés en LO, représentation mentale,
 *        organisation/planification/anticipation/stratégie.
 *
 * Format imposé : version SYNTHÉTIQUE (2-3 pages max). Structure markdown
 * avec sections en gras, alignée sur la trame des CRBO langage du projet
 * (anamnèse / bilan / diagnostic / axes / aménagements / conclusion).
 */

import type { PastilleEtat } from '../bilans/math/types'

const COLOR_LABEL: Record<PastilleEtat, string> = {
  gris: 'non renseigné',
  vert: 'réussite spontanée',
  orange: 'réussite après étayage',
  rouge: 'échec',
}

/** Description d'une cellule cotée (niveau × test × critère) pour le prompt. */
export interface CelluleInput {
  niveau: string  // ex: "8 ans (96-98 mo)" ou "CM1" ou "Cycle III 1"
  test: string    // ex: "jetons", "lecture nb"
  critere: string // ex: "isole 2 critères", "nombres décimaux"
  color: PastilleEtat
}

export interface EpreuveInput {
  epreuveLabel: string
  parentColor: PastilleEtat
  /** Cellules cotées au niveau du critère individuel (nouveau format). */
  cellules: CelluleInput[]
  /** Compat legacy : couleur agrégée par sous-épreuve (ancien format). */
  sousEpreuves?: Array<{ label: string; color: PastilleEtat }>
  notes: string
  iaText: string
}

export interface DomaineInput {
  domaineLabel: string
  epreuves: EpreuveInput[]
}

export interface BilanMathCRBOContext {
  bilanType: 'b-cm' | 'b-cmado'
  mode: 'initial' | 'renouvellement'
  patientPrenom: string
  patientAge: string
  patientClasse: string
  domaines: DomaineInput[]
}

export const SYSTEM_PROMPT_BILAN_MATH_CRBO = `Tu es un orthophoniste senior français spécialisé en cognition mathématique, formé au Profil B (méthode Elsa DALL'AGNOL). Tu rédiges le corps d'un CRBO SYNTHÉTIQUE (2 à 3 pages maximum) à partir d'un bilan B-CM (enfant cycle II-III) ou B-CMado (collège).

Le CRBO est destiné au médecin prescripteur ET aux parents. Lecture sobre, professionnelle, sans jargon non expliqué.

# RÈGLES CLINIQUES ABSOLUES
- Pas d'em-dash (—) : utiliser la virgule.
- Pas de codes CIM-10 (F81, F82…).
- Modalisation prudente : "compatible avec", "suggère", "évoque", "à confirmer". Pas de verdict définitif.
- Bilan qualitatif : aucune mention de percentile, d'écart-type, ou de score chiffré. Uniquement les cotations couleur (réussite spontanée / après étayage / échec).
- Quand une cotation est "après étayage" (orange) : précise-le explicitement, c'est une ressource thérapeutique cruciale.
- Pas d'anamnèse ni de motif de consultation : ces parties sont rédigées séparément par l'ortho dans son carnet patient.
- Pas de signature, pas d'en-tête patient, pas de mentions médico-légales.

# FRAMEWORK DIAGNOSTIQUE — PROFIL B (Elsa DALL'AGNOL)

Tu DOIS choisir UN des trois profils suivants selon les observations :

**Profil 1 — Dyscalculie primaire (S5)** : trouble spécifique
  → si difficultés en numération, opérations, résolution de problèmes
    SANS atteinte de la logique (Logique majoritairement verte/orange).
  → renvoie au symptôme 5 du DSM-V (apprentissages mathématiques) si pertinent.

**Profil 2 — Dyscalculie secondaire** : trouble non spécifique
  → si difficultés numériques imputables à autre chose : DI/efficience faible
    suspectée, dyspraxie connue, TDA/H, déscolarisation, scolarité inadéquate,
    ou TSL associé.
  → mentionner l'orientation pluridisciplinaire (psychomotricien, neuropsy,
    pédopsychiatre).

**Profil 3 — Trouble du raisonnement logico-mathématique (S6)** : trouble spécifique
  → si difficultés numériques ET logique atteinte (Logique majoritairement
    rouge/orange : classifications, combinatoire, sériation, inclusion,
    conservation).
  → renvoie au symptôme 6 du DSM-V (raisonnement mathématique) si pertinent.
  → mentionner les répercussions sur LO, représentation mentale, planification.

# STRUCTURE DU CRBO (impérative, dans cet ordre)

Format markdown : **Section** pour les titres. Texte continu, lignes vides
entre paragraphes. PAS de listes à puces sauf dans Axes thérapeutiques et
Aménagements scolaires. Max 2-3 pages au total.

1. **Bilan réalisé** — UNE phrase indiquant que le bilan B-CM ou B-CMado a
   été réalisé avec [prénom du patient]. Mention de la cotation qualitative.

2. **Profil cognitif** — Synthèse en 4-6 phrases. Reprend les 4 axes du
   schéma cognitif (Compétences logiques / Compétences numériques avec
   Numération + Opérations / Sens du nombre / Comptage et dénombrement)
   en indiquant ce qui est préservé, fragile, ou atteint. S'appuie
   directement sur les cotations couleur observées. Mentionne les niveaux
   atteints (ex: "[Prénom] maîtrise la numération entière jusqu'au
   niveau CE1 mais bute sur les nombres à partir de 4 chiffres").

3. **Diagnostic orthophonique** — Un paragraphe (4-7 phrases) qui :
   - Pose UN des trois profils du framework Elsa
   - Mentionne le critère DSM-V (symptôme 5 ou 6) UNIQUEMENT si le profil
     l'évoque clairement
   - Évoque les comorbidités si pertinentes (TDA/H, dyspraxie, TSL…)

4. **Axes thérapeutiques** — 3 à 4 axes numérotés (1., 2., 3., 4.),
   1 ligne par axe. Pas de phrase introductive.

5. **Aménagements scolaires** — 3 à 5 suggestions courtes, 1 ligne chacune,
   avec tiret en début de ligne (- ). Pas de phrase introductive.

6. **Conclusion** — UNE phrase courte de fin (NGAP "rééducation de la
   cognition mathématique" si indication de prise en charge).

# CONTRAINTES DE LONGUEUR
- 600 mots maximum au total.
- Profil cognitif : 4-6 phrases.
- Diagnostic : 4-7 phrases.
- Axes : 3-4 lignes.
- Aménagements : 3-5 lignes.
- Conclusion : 1 phrase.

Quand l'ortho a fourni un paragraphe IA pré-validé pour une épreuve, intègre
ses idées clés sans le reproduire intégralement (synthèse).

Format de sortie : Markdown brut. Pas de préambule ("Voici…") ni de
conclusion méta. Le CRBO commence directement par "**Bilan réalisé**".
`

function describeEpreuve(ep: EpreuveInput): string {
  const lines: string[] = []
  lines.push(`### ${ep.epreuveLabel}`)
  lines.push(`Couleur globale : ${COLOR_LABEL[ep.parentColor]}`)
  // Privilégie les cellules détaillées (nouveau format).
  if (ep.cellules.length > 0) {
    lines.push('Cellules cotées (niveau × critère) :')
    for (const cel of ep.cellules) {
      lines.push(`  - [${cel.niveau}] ${cel.test} — "${cel.critere}" : ${COLOR_LABEL[cel.color]}`)
    }
  } else if (ep.sousEpreuves && ep.sousEpreuves.length > 0) {
    lines.push('Sous-épreuves (couleur agrégée) :')
    for (const se of ep.sousEpreuves) {
      lines.push(`  - ${se.label} : ${COLOR_LABEL[se.color]}`)
    }
  }
  if (ep.notes.trim()) {
    lines.push(`Notes ortho : "${ep.notes.trim()}"`)
  }
  if (ep.iaText.trim()) {
    lines.push('Paragraphe ortho-validé (à synthétiser, pas à reproduire) :')
    for (const line of ep.iaText.trim().split('\n')) lines.push(`  ${line}`)
  }
  return lines.join('\n')
}

export function buildBilanMathCRBOUserPrompt(ctx: BilanMathCRBOContext): string {
  const lines: string[] = []
  const bilanLabel = ctx.bilanType === 'b-cm' ? 'B-CM (enfant cycles II-III)' : 'B-CMado (collège)'
  lines.push(`Type : ${bilanLabel} — ${ctx.mode === 'initial' ? 'bilan initial' : 'bilan de renouvellement'}`)
  if (ctx.patientPrenom) lines.push(`Prénom : ${ctx.patientPrenom}`)
  if (ctx.patientAge || ctx.patientClasse) {
    lines.push(`Patient : ${ctx.patientAge || 'âge non renseigné'}${ctx.patientClasse ? `, ${ctx.patientClasse}` : ''}`)
  }
  lines.push('')

  for (const dom of ctx.domaines) {
    lines.push(`## ${dom.domaineLabel}`)
    lines.push('')
    if (dom.epreuves.length === 0) {
      lines.push('_(aucune épreuve cotée dans ce domaine)_')
    } else {
      for (const ep of dom.epreuves) {
        lines.push(describeEpreuve(ep))
        lines.push('')
      }
    }
  }

  lines.push('---')
  lines.push('')
  lines.push(`Rédige le CRBO SYNTHÉTIQUE ${bilanLabel} (max 2-3 pages, 600 mots max) en suivant strictement la structure imposée par le système (6 sections, titres en gras markdown). Pose UN des 3 profils du framework Elsa DALL'AGNOL en t'appuyant sur les cotations observées.`)
  return lines.join('\n')
}
