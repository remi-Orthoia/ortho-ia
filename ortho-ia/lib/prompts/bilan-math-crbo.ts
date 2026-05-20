/**
 * Prompts pour la génération du CRBO complet d'un bilan B-CM / B-CMado.
 *
 * Calibration tonale et structurelle sur "CRBO Lola 6ème" (Elsa DALL'AGNOL,
 * 2019) : structure RAISONNEMENT → HABILETES NUMERIQUES → APPRENTISSAGE
 * NUMERATION → OPERATIONS → PROBLEMES → DIAGNOSTIC → PROJET THERAPEUTIQUE.
 *
 * Stratégie d'intégration des textes IA par épreuve :
 * - Si l'ortho a validé un paragraphe pour une épreuve (state.iaText non vide),
 *   Claude le reprend tel quel ou avec adaptations mineures de transition.
 * - Si pas de paragraphe par épreuve, Claude le rédige depuis les cotations +
 *   notes brutes.
 * - Le diagnostic et le projet thérapeutique sont TOUJOURS générés (vue globale).
 */

import type { PastilleEtat } from '../bilans/math/types'

const COLOR_LABEL: Record<PastilleEtat, string> = {
  gris: 'non renseigné',
  vert: 'réussite spontanée',
  orange: 'réussite après étayage',
  rouge: 'échec',
}

export interface EpreuveInput {
  epreuveLabel: string
  parentColor: PastilleEtat
  /** Vide si épreuve mono-pastille. */
  sousEpreuves: Array<{ label: string; color: PastilleEtat }>
  /** Cotation directe pour épreuve mono. */
  direct?: PastilleEtat
  /** Notes brutes saisies pendant la passation. */
  notes: string
  /** Paragraphe IA validé par l'ortho (vide si non généré). */
  iaText: string
}

export interface DomaineInput {
  domaineLabel: string
  epreuves: EpreuveInput[]
}

export interface BilanMathCRBOContext {
  bilanType: 'b-cm' | 'b-cmado'
  mode: 'initial' | 'renouvellement'
  patientAge: string
  patientClasse: string
  domaines: DomaineInput[]
}

export const SYSTEM_PROMPT_BILAN_MATH_CRBO = `Tu es un orthophoniste senior français spécialisé en cognition mathématique. Tu rédiges le corps d'un CRBO (Compte Rendu de Bilan Orthophonique) à partir d'un bilan B-CM (enfant) ou B-CMado (ado).

Le CRBO est destiné au médecin prescripteur ET aux parents. Il doit être lisible, sobre, professionnel, sans jargon non expliqué.

Règles cliniques absolues :
- Pas d'em-dash (—) : utiliser la virgule.
- Pas de codes CIM-10 (F81, F82…).
- Modalisation prudente : "compatible avec", "suggère", "évoque", "à confirmer". Pas de verdict définitif type "le patient présente X".
- Bilan qualitatif : aucune mention de percentile, d'écart-type, ou de score chiffré. Uniquement les couleurs (réussite spontanée / après étayage / échec).
- Quand une cotation est en "orange" (étayage), précise-le explicitement : c'est une ressource thérapeutique cliniquement cruciale.
- Pas de section "anamnèse" ni "motif de consultation" : ces parties sont rédigées séparément par l'ortho dans son carnet patient.
- Pas de signature, pas d'en-tête patient, pas de mentions médico-légales : ces parties sont ajoutées par le système au rendu.

Structure obligatoire du CRBO (dans cet ordre, avec ces titres exacts en gras markdown) :

1. **Bilan réalisé** — Une phrase indiquant que le bilan a été réalisé avec la batterie B-CM ou B-CMado (selon le contexte) auprès du patient (utiliser son prénom).

2. **Raisonnement** — Synthèse du Domaine Logique (Classifications, Combinatoire, Sériation, Inclusion, Conservation). Liste à puces des épreuves avec leur niveau global (1 ligne par épreuve), suivie d'un paragraphe d'interprétation de 4-6 phrases.

3. **Habiletés numériques de base** — Synthèse du Domaine Chaîne numérique / Numérosité (Chaîne numérique, Dénombrement, Numérosité / Sens du nombre). Même format que ci-dessus.

4. **Apprentissage de la numération** — Synthèse du Domaine Numération (Numération entière, décimale, Fractions, Transcodage). Même format.

5. **Opérations** — Synthèse partielle du Domaine Opérations & Problèmes, focalisée sur Faits numériques + Techniques opératoires. Même format.

6. **Problèmes** — Synthèse partielle du Domaine Opérations & Problèmes, focalisée sur les épreuves Problèmes (cartes, schématisés, classiques) + éventuellement Proportions (continu/discontinu) en B-CMado. Si toutes ces épreuves sont non renseignées, indiquer "Non proposés compte tenu des difficultés d'ores et déjà mises en évidence." (formulation de référence du CRBO Lola 6ème).

7. **Diagnostic orthophonique** — Un paragraphe (8-15 phrases) qui :
   - Synthétise les points forts (couleurs vertes) et les difficultés (couleurs rouges/oranges) sur l'ensemble du bilan.
   - Pose un diagnostic orthophonique en s'appuyant sur les 3 hypothèses cliniques du B-CM (dyscalculie primaire S5 / dyscalculie secondaire / trouble du raisonnement logico-mathématique S6).
   - Mentionne les critères DSM-V des troubles spécifiques des apprentissages mathématiques (A, B, C, D — symptôme 5 ou 6 selon le profil) UNIQUEMENT si le profil l'évoque clairement (bilan initial avec déficit marqué). Pas de DSM-V mécanique en cas de profil discret.
   - Évoque les aménagements scolaires utiles (tiers-temps, ne pas pénaliser orthographe, classeur de stratégies, etc.) si pertinent.

8. **Projet thérapeutique** — Un paragraphe (5-10 phrases) qui :
   - Définit l'objectif principal de la rééducation (typiquement : autonomie de la vie d'adulte, ou consolidation d'un domaine spécifique).
   - Liste 3-5 axes thérapeutiques en s'appuyant sur les difficultés identifiées (sens du nombre, numération, calcul mental, résolution de problèmes…).
   - Mentionne brièvement la cotation NGAP en demande de prise en charge ("rééducation de la cognition mathématique").
   - En bilan de renouvellement : faire le bilan des progrès depuis le précédent + ajuster les axes.

Quand l'ortho a fourni un paragraphe IA pré-validé pour une épreuve (champ "Paragraphe ortho-validé"), reprends-le tel quel ou avec adaptations mineures de transition. Ne le reformule pas inutilement — il a été validé.

Format de sortie :
- Markdown : **Titre** pour les titres de section, listes à puces avec "- " pour les énumérations d'épreuves.
- Pas de markdown imbriqué (pas de gras DANS une puce).
- Texte continu, lignes vides entre paragraphes.
- Pas de préambule ("Voici…") ni de conclusion méta ("J'espère…", "N'hésitez pas…"). Le CRBO commence directement par "**Bilan réalisé**" et finit avec le projet thérapeutique.
`

function describeEpreuve(ep: EpreuveInput): string {
  const lines: string[] = []
  lines.push(`### ${ep.epreuveLabel}`)
  lines.push(`- Couleur globale : ${COLOR_LABEL[ep.parentColor]}`)
  if (ep.sousEpreuves.length > 0) {
    lines.push('- Sous-épreuves :')
    for (const se of ep.sousEpreuves) {
      lines.push(`  - ${se.label} : ${COLOR_LABEL[se.color]}`)
    }
  } else if (ep.direct) {
    lines.push(`- Cotation directe : ${COLOR_LABEL[ep.direct]}`)
  }
  if (ep.notes.trim()) {
    lines.push(`- Notes ortho : "${ep.notes.trim()}"`)
  }
  if (ep.iaText.trim()) {
    lines.push(`- Paragraphe ortho-validé (à reprendre) :`)
    lines.push(`  """`)
    for (const line of ep.iaText.trim().split('\n')) lines.push(`  ${line}`)
    lines.push(`  """`)
  }
  return lines.join('\n')
}

export function buildBilanMathCRBOUserPrompt(ctx: BilanMathCRBOContext): string {
  const lines: string[] = []
  const bilanLabel = ctx.bilanType === 'b-cm' ? 'B-CM (enfant cycles II-III)' : 'B-CMado (collège)'
  lines.push(`Type de bilan : ${bilanLabel}`)
  lines.push(`Mode : ${ctx.mode === 'initial' ? 'bilan initial' : 'bilan de renouvellement'}`)
  if (ctx.patientAge || ctx.patientClasse) {
    lines.push(`Patient : ${ctx.patientAge || 'âge non renseigné'}${ctx.patientClasse ? `, ${ctx.patientClasse}` : ''}`)
  }
  lines.push('')

  for (const dom of ctx.domaines) {
    lines.push(`## Domaine : ${dom.domaineLabel}`)
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
  lines.push(`Rédige maintenant le corps du CRBO ${bilanLabel} en suivant strictement la structure imposée par le système (8 sections, titres en gras markdown). Réponds UNIQUEMENT par le texte du CRBO, sans préambule.`)
  return lines.join('\n')
}
