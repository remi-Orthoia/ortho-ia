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

/** Ordre de severite clinique : gris (non cote) < vert (reussite) < orange
 *  (etayage) < rouge (echec). Pour l'aggregation au niveau epreuve macro,
 *  on prend la PIRE couleur cotee. */
const COLOR_SEVERITY: Record<PastilleEtat, number> = { gris: -1, vert: 0, orange: 1, rouge: 2 }

/** Agrege une liste de couleurs cellules en une couleur "epreuve macro" :
 *  retourne la pire couleur (qui domine cliniquement). Si toutes sont gris,
 *  retourne gris. Cf. parent-color.ts cote client pour la version typee. */
function aggregatePrevColor(colors: any[]): PastilleEtat {
  let worst: PastilleEtat = 'gris'
  for (const c of colors) {
    if (typeof c !== 'string') continue
    if (!(c in COLOR_SEVERITY)) continue
    if (COLOR_SEVERITY[c as PastilleEtat] > COLOR_SEVERITY[worst]) {
      worst = c as PastilleEtat
    }
  }
  return worst
}

/** Calcule le sens d'evolution entre 2 couleurs agregees. Aligne sur
 *  lib/bilans/math/compute-evolution.ts cote client. */
function computeDirection(prev: PastilleEtat, curr: PastilleEtat): string {
  if (prev === 'gris' && curr !== 'gris') return 'nouveau'
  if (prev !== 'gris' && curr === 'gris') return 'skipped'
  if (prev === curr) return 'stable'
  const prevRank = COLOR_SEVERITY[prev]
  const currRank = COLOR_SEVERITY[curr]
  if (currRank < prevRank) return 'progres'
  return 'regression'
}

/** Description d'une cellule cotée (niveau × test × critère) pour le prompt. */
export interface CelluleInput {
  niveau: string  // ex: "8 ans (96-98 mo)" ou "CM1" ou "Cycle III 1"
  test: string    // ex: "jetons", "lecture nb"
  critere: string // ex: "isole 2 critères", "nombres décimaux"
  color: PastilleEtat
}

export interface EpreuveInput {
  /** ID de l'epreuve (cf. GrilleBilan.sections[].epreuves[].id) — sert au
   *  matching avec bilanPrecedentEpreuves (renouvellement) pour calculer le
   *  delta d'evolution. Optionnel pour compat ancienne signature. */
  epreuveId?: string
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
  /** Donnees specifiques renouvellement. Si present, le motif et l'anamnese
   *  doivent integrer la trajectoire d'evolution et le diagnostic doit
   *  s'ouvrir sur une phrase de comparaison. */
  renouvellement?: {
    evolutionNotes?: string
    elementsStables?: string
    bilanPrecedentDate?: string
    bilanPrecedentAnamnese?: string
    /** Cellules grille du bilan precedent (parities avec ctx.domaines pour
     *  permettre au prompt builder de calculer un tableau d'evolution
     *  structuree par epreuve). */
    bilanPrecedentEpreuves?: Record<string, { cells?: Record<string, string>; notes?: string; iaText?: string }>
    /** Markdown du CRBO precedent — contexte prose pour le LLM. */
    bilanPrecedentCrboGenere?: string
    /** Texte d'un PDF/Word externe extrait par Vision — alternative au CRBO ortho.ia. */
    bilanPrecedentTexteExterne?: string
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

Le CRBO doit enchaîner EXACTEMENT dans cet ordre, sans étape intermédiaire et sans étape oubliée :
1. **Motif**
2. **Anamnèse**
3. Une section par DOMAINE puis une sous-section par ÉPREUVE renseignée (titres en majuscules)
4. **Diagnostic orthophonique :**
5. **Projet thérapeutique :** (avec phrase NGAP AMO 11.7)
6. **Aménagements pédagogiques :** (liste à puces 4-6 items, mêmes règles que les CRBO langage — voir détail plus bas)
7. Phrase de remerciement et de salutation (sans titre)

Format markdown : titres de section en **gras**. Lignes vides entre paragraphes. Listes à puces UNIQUEMENT dans les critères DSM-V, le projet thérapeutique, et les aménagements pédagogiques. Le CRBO commence directement par "**Motif**" (pas de préambule, pas d'en-tête patient — c'est l'export Word qui s'en charge).

1. **Motif** — 2 à 4 phrases. Pose le contexte de la consultation (qui demande le bilan, pour quoi, hypothèse). Reformule le motif fourni dans le bloc CONTEXTE.

2. **Anamnèse** — 4 à 8 phrases. Reproduit (en reformulant légèrement) l'anamnèse fournie. Ordre conseillé : développement, ORL, visuel, scolaire, antécédents/rééducations, traits comportementaux notés par l'ortho.

⛔ **NE PAS PRODUIRE de section "Bilan réalisé"** : la phrase officielle
"Bilan réalisé avec des épreuves de manipulations des compétences logiques
de la batterie B-LM2, des épreuves numériques du TEDI-MATH, du ZAREKI-R,
et des épreuves cliniques. Les compétences sont cotées qualitativement :
réussite spontanée, réussite après étayage, échec." est rendue
AUTOMATIQUEMENT par le moteur Word sous la section "Tests pratiqués" en
en-tete du CRBO. Tu DOIS donc enchainer directement de l'**Anamnèse**
vers la 1re SECTION DE DOMAINE en majuscules (sans titre intermediaire
"Bilan réalisé"). Si tu produis cette section, elle sera supprimee
automatiquement par le filtre cote rendu — mais autant ne pas l'ecrire
pour gagner des tokens.

3. Pour CHAQUE domaine présent dans le bilan, une SECTION en gros titre majuscule (ex : **LES COMPÉTENCES LOGIQUES — RAISONNEMENT ET LANGAGE**, **COMPTAGE ET DÉNOMBREMENT**, **SYSTÈME DE NUMÉRATION**, **OPÉRATIONS**, **PROBLÈMES**…). À l'intérieur de chaque section, un sous-titre **EN MAJUSCULES** par épreuve (ex : **CLASSIFICATION :**, **CHAÎNE NUMÉRIQUE :**, **NUMÉRATION :**, **SENS DES OPÉRATIONS :**…), suivi de :
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

Un paragraphe de 3 à 5 phrases qui décrit ce qui va être travaillé en priorité, en s'appuyant sur les axes d'Elsa DALL'AGNOL : conservation des quantités, combinatoire et capacités exécutives, sens du nombre, puis numération, opérations et problèmes.

🔒 **Cotation NGAP imperative — bilan B-CMado (et B-CM enfant)** : la prise en charge se code OBLIGATOIREMENT sous la NGAP **"Rééducation de la cognition mathématique"** avec la cotation **AMO 11.7** (exactement onze virgule sept). Tu DOIS ecrire la phrase suivante dans le projet therapeutique, en adaptant uniquement la frequence/duree au profil clinique :

> "Une prise en charge orthophonique [hebdomadaire / bi-hebdomadaire] est proposee pour [duree, ex. 24 mois], cotee selon la NGAP **Reeducation de la cognition mathematique — AMO 11.7**."

🔒 **VOLUME STRICT — mention AMO = 1 phrase / 2 lignes maximum** : la mention AMO doit tenir en **UNE SEULE PHRASE** (pas un paragraphe, pas 2 phrases) et **2 lignes maximum** a l'affichage. NE PAS ajouter de justification, d'explication, de commentaire sur la NGAP ou de paragraphe annexe autour de la cotation. La phrase modele ci-dessus respecte deja cette contrainte — recopie-la telle quelle en remplissant les crochets, sans rien ajouter avant ni apres dans la meme phrase.

⛔ **NE JAMAIS** ecrire d'autres cotations AMO (pas de "AMO 12,1", "AMO 13,5", "30 AMO X", "10 AMO Y" etc.) — la cotation correcte pour la cognition mathematique est UNIQUEMENT **AMO 11.7**. C'est la cotation officielle 2026 pour ce type de rééducation. Ne pas confondre avec les AMO du langage écrit (12,1 / 13,5) qui ne s'appliquent PAS ici.

**Aménagements pédagogiques :**

Une phrase introductive courte (1 ligne) puis une LISTE A PUCES de **4 à 6 aménagements maximum, UNE puce par grande catégorie**, à adapter au profil mathématique du patient.

Phrase intro type (à reformuler légèrement selon le profil) :
> "En complément de la prise en charge orthophonique, les aménagements pédagogiques suivants pourraient être mis en place en classe afin de soutenir les apprentissages mathématiques de [Prénom] :"

Catégories autorisées (1 puce maximum par catégorie, choisir les plus pertinentes) :
- **Temps** : si tu mentionnes "temps majoré" / "tiers-temps" / "temps supplémentaire", tu DOIS inclure dans la même phrase l'alternative "et/ou réduire la quantité d'exercices à traiter sur le temps imparti".
- **Évaluations** : autorisation d'utiliser certains outils (table de Pythagore, frise numérique, calculatrice si pertinent au niveau scolaire), notation valorisant la démarche plutôt que le seul résultat chiffré, énoncés segmentés.
- **Outils numériques** : recours à un outil numérique d'aide (logiciel de géométrie dynamique, calculatrice, tableur) si pertinent au cycle, sans nommer de logiciel commercial précis.
- **Pédagogie** : consignes reformulées et segmentées, manipulation systématique avant abstraction, schématisation autorisée, supports visuels pour le sens du nombre.
- **Environnement** : place adaptée en classe (proche du tableau, faible distraction), supports écrits clairs avec interligne aéré.
- **Oral** : restitution orale autorisée des raisonnements lorsque la trace écrite reste trop coûteuse.
- **Valorisation** : OBLIGATOIRE — toujours inclure UN bullet de catégorie Valorisation rappelant la nécessité de valoriser et féliciter les efforts et progrès pour soutenir l'estime de soi face aux difficultés mathématiques.

Format **STRICT** de chaque bullet : "**Catégorie** : description concrète." (la catégorie en gras suivie de deux-points puis la description). Une phrase par bullet, pas de paragraphe. Pas de markdown imbriqué dans les bullets, pas de nom commercial de logiciel.

⛔ NE PAS dépasser 6 bullets. NE PAS ajouter d'autres catégories (ex: "Coopération", "Famille"). NE PAS répéter de mentions AMO dans cette section (elles sont dans Projet thérapeutique).
⛔ NE PAS ajouter de mention "PAP" ou "PPS" ici : c'est l'orthophoniste qui décide du dispositif administratif avec la famille/école. La section liste UNIQUEMENT des aménagements concrets.

Termine par : "Vous remerciant de votre attention et me tenant à votre disposition pour de plus amples informations, je vous prie de recevoir mes salutations distinguées."

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
  // Anamnese mentionne les elements stables, sections par epreuve mentionnent
  // l'evolution, Diagnostic s'ouvre sur la synthese d'evolution).
  const ren = ctx.renouvellement
  const hasRen = ren && (
    ren.evolutionNotes || ren.elementsStables || ren.bilanPrecedentDate ||
    ren.bilanPrecedentAnamnese || ren.bilanPrecedentCrboGenere ||
    ren.bilanPrecedentTexteExterne ||
    (ren.bilanPrecedentEpreuves && Object.keys(ren.bilanPrecedentEpreuves).length > 0)
  )
  if (hasRen && ren) {
    lines.push('## RENOUVELLEMENT — donnees d\'evolution depuis le bilan precedent')
    lines.push('')
    lines.push('Ce bilan est un RENOUVELLEMENT. Tu DOIS adapter la redaction sur 3 dimensions :')
    lines.push('1. **Motif** : commencer par "Renouvellement du bilan de cognition mathématique du [date]" ou equivalent. Indiquer le contexte de la PEC entre les 2 bilans.')
    lines.push('2. **Sections par épreuve** : pour CHAQUE epreuve cotee a la fois maintenant ET au precedent, ajouter une mention d\'evolution (progres / stagnation / regression). Exemples :')
    lines.push('   - "Cette epreuve, en echec au bilan initial, est aujourd\'hui reussie spontanement : progres notable apres etayage thrombique."')
    lines.push('   - "Sur les classifications, [Prenom] etait deja en reussite au bilan initial : performance stable."')
    lines.push('   - "Sur la chaine numerique, on note une regression : reussite aux niveaux infereurs auparavant, echec maintenant aux memes items — a surveiller."')
    lines.push('3. **Diagnostic** : s\'ouvrir par une phrase synthetique d\'evolution globale ("Par rapport au bilan du [date], on observe globalement une evolution favorable / contrastee / defavorable sur..."). Garder ensuite les critères DSM-V en notant si le diagnostic est confirme / nuance / retire.')
    lines.push('')
    if (ren.bilanPrecedentDate) {
      lines.push(`Date du bilan precedent : ${formatDateFR(ren.bilanPrecedentDate)}`)
      lines.push('')
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
      lines.push('Notes d\'evolution renseignees par l\'ortho (a integrer dans le Motif et dans la phrase d\'ouverture du Diagnostic) :')
      lines.push((ren.evolutionNotes ?? '').trim())
      lines.push('')
    }
    // ===== Tableau d'evolution par epreuve =====
    // Si le bilan precedent vient d'un CRBO ortho.ia (cellules grille
    // structurees), on calcule la matrice de delta par epreuve. Cette
    // information PERMET au LLM de fact-check sa redaction d'evolution et
    // d'eviter d'inventer des progres / regressions.
    if (ren.bilanPrecedentEpreuves && Object.keys(ren.bilanPrecedentEpreuves).length > 0) {
      lines.push('Tableau d\'evolution par epreuve (couleurs agregees, calcul deterministe) :')
      lines.push('| Domaine | Epreuve | Bilan precedent | Bilan actuel | Evolution |')
      lines.push('|---|---|---|---|---|')
      for (const dom of ctx.domaines) {
        for (const ep of dom.epreuves) {
          // Couleur actuelle : ep.parentColor (deja calcule cote client)
          const currentColor = ep.parentColor
          // Couleur precedente : agregation des cells du bilan precedent.
          // Algo simplifie aligne sur epreuveColorFromState : prend la PIRE
          // (gris < vert < orange < rouge dans l'ordre de "preoccupation"
          // diagnostique). Pour le tableau d'evolution, on aggrege l'epreuve
          // entiere depuis ses cellules.
          // Lookup par epreuveId qui est le meme cote draft (current) et
          // bilanPrecedentEpreuves (previous) — c'est l'identifiant stable de
          // la grille (ex. "classifications", "chaine_numerique").
          const prevEpreuveData = ep.epreuveId
            ? ren.bilanPrecedentEpreuves?.[ep.epreuveId]
            : undefined
          const prevColor = prevEpreuveData?.cells
            ? aggregatePrevColor(Object.values(prevEpreuveData.cells))
            : 'gris'
          if (prevColor === 'gris' && currentColor === 'gris') continue
          const direction = computeDirection(prevColor, currentColor)
          lines.push(`| ${dom.domaineLabel} | ${ep.epreuveLabel} | ${prevColor} | ${currentColor} | ${direction} |`)
        }
      }
      lines.push('')
      lines.push('⚠️ TU DOIS commenter chaque ligne en "progres" ou "regression" de ce tableau dans la section epreuve correspondante. Pour les "stable" sans changement clinique notable, mention breve possible mais pas obligatoire.')
      lines.push('')
    }
    // ===== Texte CRBO precedent (contexte prose) =====
    if ((ren.bilanPrecedentCrboGenere ?? '').trim()) {
      lines.push('Texte integral du CRBO precedent (contexte de reference, ne pas recopier) :')
      lines.push('---')
      lines.push((ren.bilanPrecedentCrboGenere ?? '').trim().slice(0, 8000))
      lines.push('---')
      lines.push('')
    } else if ((ren.bilanPrecedentTexteExterne ?? '').trim()) {
      lines.push('Texte du bilan precedent (PDF/Word externe extrait par Vision — peut contenir des typos, a utiliser comme contexte uniquement) :')
      lines.push('---')
      lines.push((ren.bilanPrecedentTexteExterne ?? '').trim().slice(0, 8000))
      lines.push('---')
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
    `Rédige le CRBO ${bilanLabel} en suivant strictement la structure imposée par le système : Motif, Anamnèse, une section par DOMAINE avec sous-titres par ÉPREUVE, Diagnostic orthophonique (DSM-V critères A-D + symptômes 5/6 pertinents), Projet thérapeutique (NGAP + AMO + formule de politesse finale). 1200 à 2000 mots. NE PAS produire de section "Bilan réalisé" — elle est rendue automatiquement sous Tests pratiqués. Reproduis fidèlement les noms de domaines et d'épreuves donnés ci-dessus.`,
  )
  return lines.join('\n')
}
