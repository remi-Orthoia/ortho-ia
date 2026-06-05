/**
 * Prompts pour la génération IA d'un paragraphe clinique par épreuve dans
 * un bilan de cognition mathématique (B-CM ou B-CMado).
 *
 * Calibration tonale tirée du CRBO de référence "Lola 6ème" (Elsa DALL'AGNOL,
 * 2019) : ton sobre, formulations cliniques, lecture facile pour médecin
 * prescripteur ET parents, modalisation prudente ("Lola ne montre pas le
 * niveau attendu", "ses estimations restent correctes ce qui lui permet de…").
 *
 * Pas de verdict diagnostique au niveau de l'épreuve — c'est uniquement une
 * synthèse observationnelle ancrée dans les cotations et les notes brutes
 * de l'orthophoniste. Le diagnostic final est posé au niveau du CRBO complet
 * (Phase 3, prompt séparé).
 */

import type { PastilleEtat } from '../bilans/math/types'

export interface EpreuveContext {
  /** Type de grille — détermine la tranche d'âge attendue. */
  bilanType: 'b-cm' | 'b-cmado'
  /** Mode bilan (impacte le ton et le placement temporel). */
  mode: 'initial' | 'renouvellement'
  /** Âge calculé en clair (ex: "9 ans et 4 mois"). Pas de DDN brute. */
  patientAge: string
  /** Classe / niveau scolaire libre (ex: "CM1", "6ème"). */
  patientClasse: string
  /** Domaine parent de l'épreuve (ex: "Logique"). */
  domaineLabel: string
  /** Libellé de l'épreuve (ex: "Conservation"). */
  epreuveLabel: string
  /** Couleur calculée ou directe de l'épreuve. */
  parentColor: PastilleEtat
  /** Sous-épreuves cotées (vide pour les épreuves mono-pastille). */
  sousEpreuves: Array<{ label: string; color: PastilleEtat }>
  /** Pastille directe de l'épreuve (uniquement si mono). */
  direct?: PastilleEtat
  /** Notes cliniques brutes (déjà anonymisées). */
  notesBrutes: string
  /** Aperçu des autres épreuves du bilan, pour cohérence inter-domaines.
   *  Format compact : "[Domaine] Épreuve = couleur". On exclut les gris. */
  contexteBilan: Array<{ domaineLabel: string; epreuveLabel: string; color: PastilleEtat }>
}

/** Glose clinique d'un état de pastille — passé tel quel à Claude. */
const COLOR_LABEL: Record<PastilleEtat, string> = {
  gris: 'non renseigné',
  bleu: 'performance supérieure à l\'âge',
  vert: 'réussite spontanée',
  orange: 'réussite après étayage / autocorrection',
  rouge: 'échec',
}

const BILAN_LABEL: Record<'b-cm' | 'b-cmado', string> = {
  'b-cm': 'B-CM (enfant, cycles II-III)',
  'b-cmado': 'B-CMado (adolescent, collège)',
}

export const SYSTEM_PROMPT_BILAN_MATH_EPREUVE = `Tu es un orthophoniste senior français spécialisé en cognition mathématique. Tu rédiges UN paragraphe de synthèse clinique pour une épreuve donnée d'un bilan B-CM ou B-CMado, à insérer dans un compte rendu (CRBO).

Règles cliniques absolues :
- Pas d'em-dash (—) ; utilise des virgules à la place.
- Pas de code CIM-10 (F81 etc.) au niveau de l'épreuve. Le diagnostic est posé au niveau du CRBO complet, pas ici.
- Modalisation prudente : "montre", "présente", "semble", "compatible avec", "suggère", "à confirmer". Pas de verdict définitif.
- Ancre TOUJOURS le texte dans les cotations observées (réussites, échecs, étayages) ET dans les notes brutes de l'ortho. Pas d'inférence non étayée.
- Lecture facile par médecin prescripteur ET parents. Pas de jargon non expliqué.
- Ne fais JAMAIS de comparaison de percentile ou d'écart-type : ce bilan est qualitatif (vert/orange/rouge), pas chiffré.
- Pas de recommandations thérapeutiques ici (elles arrivent dans la section "projet thérapeutique" du CRBO complet).
- Quand une cotation est en "orange" (étayage), précise-le explicitement : c'est cliniquement crucial (capacité à corriger = ressource thérapeutique).

Conventions de style :
- Une phrase d'ouverture qui pose l'épreuve et sa couleur globale.
- 2 à 5 phrases suivantes qui détaillent les sous-épreuves (si applicable) en pointant les écarts entre verts / oranges / rouges.
- Une phrase de clôture clinique reliant l'observation à la compétence cognitive sous-jacente (ex: "le sens du nombre n'est pas généralisé sur les grandes quantités", "les compétences logiques restent dépendantes de l'étayage").
- Si l'épreuve n'a aucune sous-épreuve cotée ET aucune note, retourne UNIQUEMENT la chaîne : "Épreuve non passée." (rien d'autre).

Format de sortie :
- Texte brut, pas de markdown, pas de titre, pas de bullet.
- 4 à 8 phrases.
- Pas de préambule ("Voici…", "En tant que…") ni de conclusion méta ("J'espère…").
`

export function buildEpreuveUserPrompt(ctx: EpreuveContext): string {
  const lines: string[] = []
  lines.push(`Bilan : ${BILAN_LABEL[ctx.bilanType]} — ${ctx.mode === 'initial' ? 'bilan initial' : 'bilan de renouvellement'}.`)
  if (ctx.patientAge || ctx.patientClasse) {
    lines.push(`Patient : ${ctx.patientAge || 'âge non renseigné'}${ctx.patientClasse ? `, ${ctx.patientClasse}` : ''}.`)
  }
  lines.push('')
  lines.push(`Domaine : ${ctx.domaineLabel}`)
  lines.push(`Épreuve à rédiger : ${ctx.epreuveLabel}`)
  lines.push(`Couleur globale de l'épreuve : ${COLOR_LABEL[ctx.parentColor]}`)

  if (ctx.sousEpreuves.length > 0) {
    lines.push('')
    lines.push('Sous-épreuves :')
    for (const se of ctx.sousEpreuves) {
      lines.push(`  - ${se.label} : ${COLOR_LABEL[se.color]}`)
    }
  } else if (ctx.direct) {
    lines.push(`(épreuve mono-pastille, cotée directement : ${COLOR_LABEL[ctx.direct]})`)
  }

  lines.push('')
  lines.push('Notes brutes de l\'orthophoniste pendant la passation :')
  lines.push(ctx.notesBrutes.trim() ? `"""\n${ctx.notesBrutes.trim()}\n"""` : '(aucune note brute saisie)')

  if (ctx.contexteBilan.length > 0) {
    lines.push('')
    lines.push('Contexte — aperçu des autres épreuves du bilan (pour cohérence inter-domaines) :')
    for (const c of ctx.contexteBilan) {
      lines.push(`  - [${c.domaineLabel}] ${c.epreuveLabel} : ${COLOR_LABEL[c.color]}`)
    }
  }

  lines.push('')
  lines.push(`Rédige le paragraphe de synthèse clinique pour l'épreuve "${ctx.epreuveLabel}", en respectant strictement les règles du système.`)
  return lines.join('\n')
}
