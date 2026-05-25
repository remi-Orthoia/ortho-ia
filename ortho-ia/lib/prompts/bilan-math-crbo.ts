/**
 * Prompts pour la génération du CRBO complet d'un bilan B-CM / B-CMado.
 *
 * Calibration tonale sur les CRBO Elsa DALL'AGNOL — gabarit Monica fourni
 * par Rémi (mai 2026). Structure détaillée, sections par épreuve, DSM-V
 * critères A/B/C/D + symptômes 5/6, projet thérapeutique avec NGAP/AMO.
 *
 * On reproduit l'anamnèse dans le CRBO (l'ortho l'a déjà rédigée à l'étape
 * 3 du Nouveau CRBO, c'est sa parole), à la différence du CRBO langage
 * synthétique où on ne reproduisait que la conclusion.
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
  /** Motif de consultation repris du Nouveau CRBO (étape 1-3). Sera reformulé
   *  en quelques lignes dans la section "Motif" du CRBO. */
  motif?: string
  /** Anamnèse rédigée par l'ortho au Nouveau CRBO. Sera reproduite (lègère
   *  reformulation) dans la section "Anamnèse" du CRBO. */
  anamnese?: string
  /** Date du bilan (ISO YYYY-MM-DD). Utilisee dans la section Motif. */
  bilanDate?: string
  /** Nom du medecin prescripteur (deja anonymise). Mentionne dans le Motif
   *  ("a la demande du Dr [nom]..."). */
  medecinNom?: string
  /** Observations qualitatives sur le comportement du patient pendant la
   *  seance — etayent le diagnostic + paragraphe Diagnostic ("Tout au long
   *  du bilan, [Prenom] s'est montre..."). */
  comportementSeance?: string
  /** Duree totale de la seance en minutes — informatif. */
  dureeSeanceMinutes?: number
  /** Donnees specifiques renouvellement (etape 4 wizard). Si present, le
   *  motif et l'anamnese doivent integrer la trajectoire d'evolution et le
   *  diagnostic doit s'ouvrir sur une phrase de comparaison. */
  renouvellement?: {
    evolutionNotes?: string
    elementsStables?: string
    bilanPrecedentDate?: string
    bilanPrecedentAnamnese?: string
  }
  domaines: DomaineInput[]
}

export const SYSTEM_PROMPT_BILAN_MATH_CRBO = `Tu es orthophoniste senior spécialisée en cognition mathématique, formée à la méthode Elsa DALL'AGNOL (Profil B). Tu rédiges un CRBO DÉTAILLÉ et CLINIQUE pour un bilan B-CM (enfant cycles II-III) ou B-CMado (collège).

Ton modèle de référence est le CRBO type Elsa DALL'AGNOL : sections par épreuve, observation clinique précise au présent, citations brèves du patient entre « », pas de jargon non expliqué. Cible : 3 à 5 pages, 1200-2000 mots. Destinataires : médecin prescripteur ET parents.

# RÈGLES CLINIQUES ABSOLUES
- Pas d'em-dash (—) dans le texte : utiliser une virgule.
- Pas de codes CIM-10 (F81, F82…). UTILISER DSM-V avec critères A/B/C/D et symptômes 5 (apprentissages mathématiques) / 6 (raisonnement mathématique) quand pertinent.
- Bilan QUALITATIF : aucune mention de percentile, d'écart-type, ou de score chiffré venant de toi. Si l'ortho a noté un score brut dans ses notes (ex: "23/120"), tu peux le reprendre tel quel, sinon tu décris en mots (réussite spontanée / après étayage / échec).
- Quand une cotation est "après étayage" (orange) : précise-le explicitement, c'est une ressource thérapeutique cruciale ("après étayage", "avec aide", "avec une histoire", "sur ma demande").
- Première personne du singulier ou pluriel ("je demande à X", "nous proposons", "sur ma demande"). Pas de "le bilan a été réalisé" passif sec.
- Modalisation prudente sur le diagnostic : "compatible avec", "évoque", "présente".

# STRUCTURE DU CRBO (impérative, dans cet ordre)

Format markdown : titres de section en **gras**. Lignes vides entre paragraphes. Listes à puces UNIQUEMENT dans les critères DSM-V et le projet thérapeutique. Le CRBO commence directement par "**Motif**" (pas de préambule, pas d'en-tête patient — c'est l'export Word qui s'en charge).

1. **Motif** — 2 à 4 phrases. Pose le contexte de la consultation (qui demande le bilan, pour quoi, hypothèse). Reformule le motif fourni dans le bloc CONTEXTE.

2. **Anamnèse** — 4 à 8 phrases. Reproduit (en reformulant légèrement) l'anamnèse fournie. Ordre conseillé : développement, ORL, visuel, scolaire, antécédents/rééducations, traits comportementaux notés par l'ortho.

3. **Bilan réalisé** — UNE phrase indiquant le bilan utilisé et le mode de cotation qualitative. Ex : "Le bilan de cognition mathématique B-CMado a été réalisé avec [Prénom] ; les compétences sont cotées qualitativement (réussite spontanée, réussite après étayage, échec)."

Puis pour CHAQUE domaine présent dans le bilan, une SECTION en gros titre majuscule (ex : **LES COMPÉTENCES LOGIQUES — RAISONNEMENT ET LANGAGE**, **COMPTAGE ET DÉNOMBREMENT**, **SYSTÈME DE NUMÉRATION**, **OPÉRATIONS**, **PROBLÈMES**…). À l'intérieur de chaque section, un sous-titre **EN MAJUSCULES** par épreuve (ex : **CLASSIFICATION :**, **CHAÎNE NUMÉRIQUE :**, **NUMÉRATION :**, **SENS DES OPÉRATIONS :**…), suivi de :
  - Une phrase rappelant l'OBJECTIF de l'épreuve (ce qu'on cherche à vérifier).
  - 1 à 4 phrases d'OBSERVATION CLINIQUE au présent, ancrées dans ce que les cellules cotées disent : à quel niveau l'épreuve est réussie/échouée, après étayage ou non, citations du patient si l'ortho en a fourni dans les notes.
  - Si une épreuve n'a aucune cellule cotée et pas de notes : mentionner brièvement "Non proposée" (sans inventer).

⚠️ Les noms de SECTIONS ET ÉPREUVES doivent suivre EXACTEMENT les labels fournis dans les "## DOMAINES" et "### Épreuves" du contexte utilisateur. Tu peux passer les libellés en MAJUSCULES si ce n'est pas déjà le cas (cohérence avec le gabarit Elsa).

Après les sections par épreuve :

**Diagnostic orthophonique :**

Un paragraphe puis une formule type imposée :

Tout au long du bilan, [Prénom] s'est montré(e) [observation d'attitude basée sur les notes ortho, sinon : "coopérat(if/ive), travaillant attentivement"]. [Si pertinent : phrase sur ce qui n'a pas été fait et pourquoi].

Selon le DSM-V, [Prénom] présente un Trouble spécifique des apprentissages, avec atteinte des mathématiques :

A. Difficulté à apprendre et à utiliser les aptitudes académiques, comme indiqué par la présence depuis au moins 6 mois d'au moins un des symptômes suivants :
  5- difficultés à maîtriser le sens des nombres, les faits numériques, les données chiffrées ou le calcul
  6- difficultés dans le raisonnement mathématique
B. Significativement en-dessous de ceux attendus pour l'âge et interfère significativement avec les performances académiques ou les occupations.
C. Commence durant les années d'école mais peut n'être manifeste que dès lors que les demandes excèdent les capacités limitées de l'individu.
D. Pas mieux expliquées par déficience intellectuelle, acuité auditive ou visuelle non corrigée, autres troubles neurologiques ou mentaux, manque de maîtrise de la langue d'enseignement scolaire, pédagogie inadéquate de l'enseignement.

Tu DOIS conserver les critères A à D textuellement. Tu DOIS conserver UNIQUEMENT les symptômes 5 et/ou 6 pertinents au regard des cotations observées (les deux si dyscalculie + raisonnement, le 5 seul si numérique sans atteinte logique majeure, le 6 seul si raisonnement logique massivement atteint sans déficit numérique).

**Projet thérapeutique :**

Un paragraphe de 3 à 5 phrases qui décrit ce qui va être travaillé en priorité, en s'appuyant sur les axes d'Elsa DALL'AGNOL : conservation des quantités, combinatoire et capacités exécutives, sens du nombre, puis numération, opérations et problèmes. Mentionne la prise en charge selon la NGAP "rééducation de la cognition mathématique" et l'AMO si pertinent (ex: 30 AMO 12,1 pour une séance hebdomadaire de 30 minutes). Termine par : "Vous remerciant de votre attention et me tenant à votre disposition pour de plus amples informations, je vous prie de recevoir mes salutations distinguées."

# CONTRAINTES
- 1200 à 2000 mots au total.
- Une section par DOMAINE présent dans le bilan + une section par ÉPREUVE renseignée.
- Pas de signature manuscrite, pas de cabinet, pas de date (gérés par l'export Word).
- Si l'ortho a fourni un paragraphe IA pré-validé (iaText) pour une épreuve, intègre ses idées clés mais reformule pour fluidité.
- Format de sortie : Markdown brut. Pas de préambule. Le CRBO commence directement par "**Motif**".
`

function describeEpreuve(ep: EpreuveInput): string {
  const lines: string[] = []
  lines.push(`### ${ep.epreuveLabel}`)
  lines.push(`Couleur globale : ${COLOR_LABEL[ep.parentColor]}`)
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
    lines.push(`Notes ortho (à intégrer dans l'observation clinique) : "${ep.notes.trim()}"`)
  }
  if (ep.iaText.trim()) {
    lines.push('Paragraphe ortho-validé (à synthétiser, pas à reproduire mot pour mot) :')
    for (const line of ep.iaText.trim().split('\n')) lines.push(`  ${line}`)
  }
  return lines.join('\n')
}

function formatDateFR(iso: string): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (isNaN(d.getTime())) return iso
  return d.toLocaleDateString('fr-FR')
}

export function buildBilanMathCRBOUserPrompt(ctx: BilanMathCRBOContext): string {
  const lines: string[] = []
  const bilanLabel = ctx.bilanType === 'b-cm' ? 'B-CM (enfant cycles II-III)' : 'B-CMado (collège)'
  lines.push(`Type : ${bilanLabel} — ${ctx.mode === 'initial' ? 'bilan initial' : 'bilan de renouvellement'}`)
  if (ctx.patientPrenom) lines.push(`Prénom : ${ctx.patientPrenom}`)
  if (ctx.patientAge || ctx.patientClasse) {
    lines.push(`Patient : ${ctx.patientAge || 'âge non renseigné'}${ctx.patientClasse ? `, ${ctx.patientClasse}` : ''}`)
  }
  if (ctx.bilanDate) lines.push(`Date du bilan : ${formatDateFR(ctx.bilanDate)}`)
  if (ctx.medecinNom) lines.push(`Medecin prescripteur : ${ctx.medecinNom}`)
  if (typeof ctx.dureeSeanceMinutes === 'number' && ctx.dureeSeanceMinutes > 0) {
    lines.push(`Duree totale de la seance : ${ctx.dureeSeanceMinutes} minutes`)
  }
  lines.push('')

  // Bloc contexte clinique : motif + anamnèse repris du Nouveau CRBO. Pour
  // les bilans math, l'anamnèse EST reproduite (à la différence du langage
  // synthétique), reformulée légèrement.
  const motifTrim = (ctx.motif ?? '').trim()
  const anamneseTrim = (ctx.anamnese ?? '').trim()
  const comportementTrim = (ctx.comportementSeance ?? '').trim()
  if (motifTrim || anamneseTrim || comportementTrim) {
    lines.push('## CONTEXTE CLINIQUE (à reproduire et reformuler dans le CRBO)')
    if (motifTrim) {
      lines.push('Motif de consultation :')
      lines.push(motifTrim)
      lines.push('')
    }
    if (anamneseTrim) {
      lines.push('Anamnèse :')
      lines.push(anamneseTrim)
      lines.push('')
    }
    if (comportementTrim) {
      lines.push('Observations sur le comportement pendant la seance (a integrer dans le paragraphe Diagnostic, formulation Elsa : "Tout au long du bilan, [Prenom] s\'est montre...") :')
      lines.push(comportementTrim)
      lines.push('')
    }
  }

  // Bloc renouvellement : trajectoire d'evolution + bilan precedent. Active
  // un traitement specifique cote prompt (Motif rappelle le bilan precedent,
  // Anamnese mentionne les elements stables, Diagnostic s'ouvre sur la
  // synthese d'evolution).
  const ren = ctx.renouvellement
  if (ren && (ren.evolutionNotes || ren.elementsStables || ren.bilanPrecedentDate || ren.bilanPrecedentAnamnese)) {
    lines.push('## RENOUVELLEMENT — donnees d\'evolution depuis le bilan precedent')
    if (ren.bilanPrecedentDate) {
      lines.push(`Date du bilan precedent : ${formatDateFR(ren.bilanPrecedentDate)}`)
    }
    if ((ren.bilanPrecedentAnamnese ?? '').trim()) {
      lines.push('Anamnese du bilan precedent (a inclure brievement en rappel) :')
      lines.push((ren.bilanPrecedentAnamnese ?? '').trim())
      lines.push('')
    }
    if ((ren.elementsStables ?? '').trim()) {
      lines.push('Elements anamnese stables a conserver :')
      lines.push((ren.elementsStables ?? '').trim())
      lines.push('')
    }
    if ((ren.evolutionNotes ?? '').trim()) {
      lines.push('Notes d\'evolution depuis le bilan precedent (a synthetiser dans une ouverture du Diagnostic du type "Par rapport au bilan du [date], on observe...") :')
      lines.push((ren.evolutionNotes ?? '').trim())
      lines.push('')
    }
  }

  for (const dom of ctx.domaines) {
    lines.push(`## ${dom.domaineLabel}`)
    lines.push('')
    if (dom.epreuves.length === 0) {
      lines.push('_(aucune épreuve cotée dans ce domaine — ignorer)_')
    } else {
      for (const ep of dom.epreuves) {
        lines.push(describeEpreuve(ep))
        lines.push('')
      }
    }
  }

  lines.push('---')
  lines.push('')
  lines.push(
    `Rédige le CRBO ${bilanLabel} en suivant strictement la structure imposée par le système : Motif, Anamnèse, Bilan réalisé, une section par DOMAINE avec sous-titres par ÉPREUVE, Diagnostic orthophonique (DSM-V critères A-D + symptômes 5/6 pertinents), Projet thérapeutique (NGAP + AMO + formule de politesse finale). 1200 à 2000 mots. Reproduis fidèlement les noms de domaines et d'épreuves donnés ci-dessus.`,
  )
  return lines.join('\n')
}
