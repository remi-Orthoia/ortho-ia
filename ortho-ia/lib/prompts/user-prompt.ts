import type { CRBODomain, CRBOStructure } from './tool-schema'

/** Sérialise les domaines déjà extraits + commentaires ortho pour la phase 2. */
function formatDomainsForSynthesize(domains: CRBODomain[], orthoComments?: Record<string, string>): string {
  if (!domains?.length) return '(aucun domaine)'
  const lines: string[] = []
  for (const d of domains) {
    lines.push(`### ${d.nom}`)
    for (const e of d.epreuves) {
      lines.push(`- ${e.nom} : score ${e.score} / É-T ${e.et ?? '—'} / ${e.percentile} (P${e.percentile_value}) → ${e.interpretation}`)
    }
    // Le contenu de la textarea ortho contient potentiellement :
    //   (a) la suggestion IA initiale (phase 1) validée telle quelle, OU
    //   (b) la suggestion IA + des ajouts manuscrits de l'ortho (mélange), OU
    //   (c) une note ortho seule (si l'ortho a tout réécrit), OU
    //   (d) rien (textarea vide).
    // Tu DOIS retourner pour ce domaine un commentaire FINAL professionnel dans
    // `domain_commentaires`, en reformulant proprement le contenu ortho (jamais
    // de notes brutes) et en respectant les règles cliniques absolues.
    const orthoTextarea = (orthoComments?.[d.nom] ?? d.commentaire ?? '').trim()
    if (orthoTextarea) {
      lines.push('')
      lines.push(`📝 Contenu textarea ortho (à reformuler en commentaire pro pour ce domaine) :`)
      lines.push(orthoTextarea)
    } else {
      lines.push('')
      lines.push('📝 Textarea ortho vide pour ce domaine — génère un commentaire clinique court à partir des seuls scores.')
    }
    lines.push('')
  }
  return lines.join('\n')
}

/** Compacte un résumé du bilan précédent pour injection dans le prompt de renouvellement. */
function formatBilanPrecedent(structure: CRBOStructure | null, bilanDate: string, anamneseInitiale?: string): string {
  if (!structure) return ''
  const lines: string[] = []
  lines.push(`Date du bilan précédent : ${bilanDate}`)
  if (structure.severite_globale) lines.push(`Sévérité globale précédente : ${structure.severite_globale}`)
  lines.push('')

  if (anamneseInitiale && anamneseInitiale.trim()) {
    lines.push('Anamnèse initiale (rédigée au bilan précédent) :')
    lines.push(anamneseInitiale.trim())
    lines.push('')
  }

  lines.push('Résultats précédents (par domaine et épreuve) :')
  for (const d of structure.domains || []) {
    lines.push(`  ${d.nom} :`)
    for (const e of d.epreuves || []) {
      lines.push(`    - ${e.nom} : ${e.score} / ${e.percentile} (P${e.percentile_value}) / ${e.interpretation}`)
    }
  }
  if (structure.diagnostic) {
    lines.push('')
    lines.push('Diagnostic précédent (extrait, 500 premiers caractères) :')
    lines.push(structure.diagnostic.slice(0, 500) + (structure.diagnostic.length > 500 ? '…' : ''))
  }
  if (structure.recommandations) {
    lines.push('')
    lines.push('Recommandations précédentes (extrait) :')
    lines.push(structure.recommandations.slice(0, 400) + (structure.recommandations.length > 400 ? '…' : ''))
  }
  return lines.join('\n')
}

export function buildCRBOPrompt(data: {
  ortho_nom: string
  ortho_adresse: string
  ortho_cp: string
  ortho_ville: string
  ortho_tel: string
  ortho_email: string
  patient_prenom: string
  patient_nom: string
  /** Âge au bilan déjà formaté (ex: "8 ans et 4 mois"). La DDN brute n'est PAS transmise à l'API pour des raisons RGPD. */
  patient_age: string
  patient_classe: string
  /** Date du bilan formatée FR (ex: "20/04/2026"). */
  bilan_date_display: string
  bilan_type: string
  medecin_nom: string
  medecin_tel: string
  motif: string
  anamnese: string
  test_utilise: string
  resultats: string
  notes_analyse: string
  /** Nouveau : observations en séance (comportement, anxiété, stratégies). */
  comportement_seance?: string
  /** Nouveau : durée totale de la séance en minutes. */
  duree_seance_minutes?: number
  /** Nouveau : notes évolution (renouvellement). */
  evolution_notes?: string
  /** Nouveau : structure CRBO du bilan précédent pour comparaison (renouvellement). */
  bilan_precedent_structure?: CRBOStructure | null
  bilan_precedent_date?: string
  /** Anamnèse rédigée du bilan précédent (pour contexte). */
  bilan_precedent_anamnese?: string
}): string {
  const isRenouvellement = !!data.bilan_precedent_structure && !!data.bilan_precedent_date

  const bilanPrecBlock = isRenouvellement
    ? `

=== BILAN PRÉCÉDENT (contexte complet pour analyse d'évolution) ===
${formatBilanPrecedent(data.bilan_precedent_structure!, data.bilan_precedent_date!, data.bilan_precedent_anamnese)}

=== NOTES CLINICIEN·NE SUR L'ÉVOLUTION ===
${data.evolution_notes || '(aucune note supplémentaire, déduis l\'évolution de la comparaison des scores)'}`
    : ''

  const comportementBlock = data.comportement_seance
    ? `

=== COMPORTEMENT EN SÉANCE (observations cliniques) ===
${data.comportement_seance}`
    : ''

  const dureeBlock = data.duree_seance_minutes
    ? `

=== DURÉE DE LA SÉANCE ===
${data.duree_seance_minutes} minutes`
    : ''

  // Instruction spécifique renouvellement — exigeante sur la qualité de la synthèse d'évolution
  const renouvellementInstruction = isRenouvellement ? `

⚠️ **SPÉCIFICITÉS BILAN DE RENOUVELLEMENT** :
Ce bilan est un RENOUVELLEMENT. Tu dois impérativement :

1. **Dans \`anamnese_redigee\`** : rédige un paragraphe court (80-150 mots) qui :
   - Rappelle brièvement le contexte initial (1-2 phrases : âge au 1er bilan, motif initial, diagnostic posé)
   - Annonce le but du renouvellement et la durée de PEC écoulée
   - Intègre les événements / changements depuis le dernier bilan (classe, suivis, adaptations)
   - N'RÉPÈTE PAS toute l'anamnèse initiale, elle est connue

2. **Dans \`synthese_evolution\`** (OBLIGATOIRE, NE PEUT PAS être null) :
   - \`resume\` (150-300 mots) : synthèse narrative de l'évolution, impact de la PEC, éléments émergents. Écris comme une ortho qui parle de son patient suivi depuis X mois.
   - \`domaines_progres\` : liste précise des domaines/épreuves en progression objectivable (+10 points de percentile minimum OU passage d'une catégorie d'interprétation à une meilleure)
   - \`domaines_stagnation\` : domaines sans évolution notable (± 10 points)
   - \`domaines_regression\` : domaines en régression avérée (-10 points ou catégorie dégradée)

3. **Dans \`diagnostic\`** (200-400 mots) :
   - PAS de re-diagnostic from scratch
   - Structure : (a) rappel du diagnostic initial et du pronostic, (b) état actuel du trouble après PEC, (c) analyse de l'EFFICACITÉ de la rééducation, (d) persistance ou évolution des comorbidités
   - Termine par : diagnostic actualisé (souvent maintenu, parfois compensé, parfois aggravé)

4. **Dans \`recommandations\`** (150-250 mots) :
   - Réévaluation du rythme de PEC (maintien / allègement / intensification)
   - Ajustement des aménagements scolaires (PAP peut devenir PPS si aggravation, ou être allégé si compensation)
   - Nouveaux bilans complémentaires si pertinent
   - Axes thérapeutiques à prioriser pour les 6-12 prochains mois
   - Date de la prochaine réévaluation

5. **Dans \`pap_suggestions\`** : liste les aménagements à **maintenir, ajouter ou retirer** par rapport au PAP précédent.
`
    : ''

  return `=== INFORMATIONS ORTHOPHONISTE ===
Nom : ${data.ortho_nom}
Adresse : ${data.ortho_adresse}, ${data.ortho_cp} ${data.ortho_ville}
Tél : ${data.ortho_tel}
Email : ${data.ortho_email}

=== INFORMATIONS PATIENT ===
Prénom : ${data.patient_prenom}
Nom : ${data.patient_nom}
Âge au bilan : ${data.patient_age}
Classe : ${data.patient_classe}
Date du bilan : ${data.bilan_date_display}
Type : Bilan ${data.bilan_type}${isRenouvellement ? ' 🔄' : ''}

=== MÉDECIN PRESCRIPTEUR ===
Nom : ${data.medecin_nom}
Tél : ${data.medecin_tel || 'Non renseigné'}

=== MOTIF DE CONSULTATION ===
${data.motif}

=== ${isRenouvellement ? 'NOTES ANAMNÈSE (stables + évolutions)' : 'ANAMNÈSE (notes brutes)'} ===
${data.anamnese}

=== TEST(S) UTILISÉ(S) ===
${data.test_utilise}

=== RÉSULTATS DU TEST ===
${data.resultats}

=== NOTES D'ANALYSE ===
${data.notes_analyse || 'Aucune note supplémentaire'}${comportementBlock}${dureeBlock}${bilanPrecBlock}

=== INSTRUCTION ===
Génère le CRBO complet en appelant l'outil \`generate_crbo\`. Remplis chaque champ avec soin et respecte scrupuleusement les règles de conversion de percentiles. Inclus obligatoirement : severite_globale, comorbidites_detectees (même vide), pap_suggestions. ${
    isRenouvellement
      ? 'IMPÉRATIF : remplis synthese_evolution (non null) avec comparaison rigoureuse scores actuels vs précédents.'
      : 'synthese_evolution = null (bilan initial).'
  }${renouvellementInstruction}`
}

// ============================================================================
// PHASE 1 — EXTRACT : utilise le même contenu que le full prompt mais avec une
// instruction terminale ciblée. Le système prompt phase=extract limite déjà
// l'IA aux 3 champs anamnese / motif / domains.
// ============================================================================

export function buildExtractPrompt(data: Parameters<typeof buildCRBOPrompt>[0]): string {
  const base = buildCRBOPrompt(data)
  // Remplace l'instruction terminale par une version focalisée extraction.
  return base.replace(
    /=== INSTRUCTION ===[\s\S]*$/,
    `=== INSTRUCTION (phase 1 — EXTRACTION) ===
Appelle l'outil \`extract_crbo_data\`. Tu dois UNIQUEMENT remplir :
- \`anamnese_redigee\` : reformulation pro de l'anamnèse brute (anti-hallucination familiale stricte)
- \`motif_reformule\` : reformulation pro du motif (1-2 phrases)
- \`domains\` : classement des résultats par groupe officiel du test, avec percentile + interpretation par épreuve

⛔ NE PRODUIS PAS de diagnostic, recommandations, comorbidités, conclusion, PAP : ce n'est pas le bon moment du flow. Ces champs seront générés en phase 2 après validation par l'orthophoniste.`,
  )
}

// ============================================================================
// PHASE 2 — SYNTHESIZE : entrées validées par l'ortho + commentaires qualitatifs
// ============================================================================

export interface SynthesizePromptInput {
  patient_prenom: string
  patient_nom: string
  patient_age: string
  patient_classe: string
  bilan_date_display: string
  bilan_type: string
  medecin_nom: string
  medecin_tel: string
  /** Anamnèse rédigée et validée/éditée par l'ortho. */
  anamnese_validee: string
  /** Motif reformulé et validé/éditée par l'ortho. */
  motif_valide: string
  /** Domaines + épreuves figés depuis la phase d'extraction. */
  domains: CRBODomain[]
  /** Commentaires qualitatifs par domaine, indexés par nom de domaine.
   *  Optionnel : si l'ortho n'a rien commenté, l'objet est vide ou undefined. */
  ortho_comments?: Record<string, string>
  /** Tests utilisés (string concaténée) — utile pour rappeler le contexte. */
  test_utilise: string
  /** Notes de passation brutes (si fournies). */
  notes_analyse?: string
  comportement_seance?: string
  duree_seance_minutes?: number
  /** Renouvellement : structure du bilan précédent + date + anamnèse précédente. */
  bilan_precedent_structure?: CRBOStructure | null
  bilan_precedent_date?: string
  bilan_precedent_anamnese?: string
  evolution_notes?: string
}

export function buildSynthesizePrompt(data: SynthesizePromptInput): string {
  const isRenouvellement = !!data.bilan_precedent_structure && !!data.bilan_precedent_date

  const bilanPrecBlock = isRenouvellement
    ? `

=== BILAN PRÉCÉDENT (contexte complet pour analyse d'évolution) ===
${formatBilanPrecedent(data.bilan_precedent_structure!, data.bilan_precedent_date!, data.bilan_precedent_anamnese)}

=== NOTES CLINICIEN·NE SUR L'ÉVOLUTION ===
${data.evolution_notes || '(aucune note supplémentaire, déduis l\'évolution de la comparaison des scores)'}`
    : ''

  const comportementBlock = data.comportement_seance
    ? `

=== COMPORTEMENT EN SÉANCE (observations cliniques globales) ===
${data.comportement_seance}`
    : ''

  const dureeBlock = data.duree_seance_minutes
    ? `

=== DURÉE DE LA SÉANCE ===
${data.duree_seance_minutes} minutes`
    : ''

  return `=== INFORMATIONS PATIENT ===
Prénom : ${data.patient_prenom}
Nom : ${data.patient_nom}
Âge au bilan : ${data.patient_age}
Classe : ${data.patient_classe}
Date du bilan : ${data.bilan_date_display}
Type : Bilan ${data.bilan_type}${isRenouvellement ? ' 🔄' : ''}

=== MÉDECIN PRESCRIPTEUR ===
Nom : ${data.medecin_nom}
Tél : ${data.medecin_tel || 'Non renseigné'}

=== MOTIF VALIDÉ (par l'orthophoniste) ===
${data.motif_valide || '(aucun motif fourni)'}

=== ANAMNÈSE VALIDÉE (par l'orthophoniste) ===
${data.anamnese_validee}

=== TEST(S) UTILISÉ(S) ===
${data.test_utilise}

=== SCORES STRUCTURÉS + COMMENTAIRES QUALITATIFS ORTHO ===
${formatDomainsForSynthesize(data.domains, data.ortho_comments)}

=== NOTES D'ANALYSE (brutes, contexte global) ===
${data.notes_analyse || 'Aucune note supplémentaire'}${comportementBlock}${dureeBlock}${bilanPrecBlock}

=== INSTRUCTION (phase 2 — SYNTHÈSE selon les RÈGLES LAURIE) ===
Appelle l'outil \`synthesize_crbo\`. Produis OBLIGATOIREMENT TOUS ces champs, dans cet ordre :

1. \`domain_commentaires\` : un objet { nom, commentaire } par domaine (MÊME ordre que ci-dessus). Reformule la textarea ortho de chaque domaine en prose pro fluide. Textarea vide → commentaire court depuis les scores. Section Lecture : condenser de 30% mais GARDER les détails qualitatifs (régularisations, autocorrections, lecture hachée…). Toujours terminer par une phrase sur les répercussions concrètes scolaires/quotidiennes en cas de difficulté.

2. \`points_forts\` : 3-5 lignes, prose fluide. Compétences préservées ET conséquences positives. JAMAIS de mention rééducation.

3. \`difficultes_identifiees\` : 3-5 lignes, prose fluide. Difficultés observées + se terminer par les CONSÉQUENCES CONCRÈTES SCOLAIRES ET QUOTIDIENNES. JAMAIS de chiffre de centile. JAMAIS le mot "dyslexie/dysorthographie" (réservé au diagnostic).

4. \`diagnostic\` : FORMAT STRICT IMPOSÉ — "trouble spécifique des apprentissages en langage écrit (communément appelé dyslexie-dysorthographie), forme [légère / modérée / sévère / compensée]". TOUJOURS préciser la forme. JAMAIS de codes Fxxx. Si TDAH déjà posé : ajouter en fin "Ce tableau s'inscrit dans un contexte de TDAH préalablement diagnostiqué."

5. \`recommandations\` : PHRASE UNIQUE imposée — "Une prise en charge orthophonique est recommandée, et en parallèle la mise en place ou le renforcement des aménagements en classe." JAMAIS de réévaluation, fréquence de séances, autres pros.

6. \`axes_therapeutiques\` : tableau de MAX 4 axes, 1 ligne chacun, sans détail des exercices. N'écris PAS "1." devant — la numérotation est ajoutée au rendu.

7. \`pap_suggestions\` : MAX 6, 1 par catégorie (Temps, Évaluations, Outils numériques, Pédagogie, Environnement, Oral). Format "Catégorie : description". Adapter au profil — pas systématiquement les 6.

8. \`conclusion\` : mention médico-légale "Compte rendu remis en main propre à l'assuré(e) pour servir et faire valoir ce que de droit. (Copie au médecin prescripteur)."

9. \`synthese_evolution\` : ${isRenouvellement ? 'NON NULL — bilan de renouvellement, comparaison rigoureuse exigée.' : 'null — bilan initial.'}

🎯 **Comment utiliser les commentaires qualitatifs ortho** :
   - Pour produire \`domain_commentaires\` (rendu final sous chaque tableau du Word).
   - Pour enrichir \`difficultes_identifiees\` (intégrer les observations de fatigue/anxiété/distracteurs en pondération clinique).

⛔ **SECTIONS SUPPRIMÉES — ne jamais générer** : Comportement pendant le bilan, Analyse croisée, Comorbidités, Sévérité globale, mention de réévaluation/nouveau bilan, coordination avec autres professionnels au-delà de l'anamnèse.

⛔ Ne régénère PAS l'anamnèse, le motif, ni les domaines (épreuves/scores) : ils sont définitifs.`
}
