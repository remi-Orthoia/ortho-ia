import type { CRBOStructure } from './tool-schema'

/** Compacte un résumé du bilan précédent pour injection dans le prompt de renouvellement. */
function formatBilanPrecedent(structure: CRBOStructure | null, bilanDate: string): string {
  if (!structure) return ''
  const lines: string[] = []
  lines.push(`Date du bilan précédent : ${bilanDate}`)
  if (structure.severite_globale) lines.push(`Sévérité globale précédente : ${structure.severite_globale}`)
  lines.push('')
  lines.push('Résultats précédents (par domaine et épreuve) :')
  for (const d of structure.domains || []) {
    lines.push(`  ${d.nom} :`)
    for (const e of d.epreuves || []) {
      lines.push(`    - ${e.nom} : ${e.score} / ${e.percentile} / ${e.interpretation}`)
    }
  }
  if (structure.diagnostic) {
    lines.push('')
    lines.push('Diagnostic précédent :')
    lines.push(structure.diagnostic)
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
  notes_passation: string
  /** Nouveau : observations en séance (comportement, anxiété, stratégies). */
  comportement_seance?: string
  /** Nouveau : durée totale de la séance en minutes. */
  duree_seance_minutes?: number
  /** Nouveau : notes évolution (renouvellement). */
  evolution_notes?: string
  /** Nouveau : structure CRBO du bilan précédent pour comparaison (renouvellement). */
  bilan_precedent_structure?: CRBOStructure | null
  bilan_precedent_date?: string
}): string {
  const bilanPrecBlock =
    data.bilan_precedent_structure && data.bilan_precedent_date
      ? `

=== BILAN PRÉCÉDENT (pour comparaison évolution) ===
${formatBilanPrecedent(data.bilan_precedent_structure, data.bilan_precedent_date)}

=== NOTES DU CLINICIEN SUR L'ÉVOLUTION ===
${data.evolution_notes || '(à déduire de la comparaison des scores)'}`
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
Type : Bilan ${data.bilan_type}

=== MÉDECIN PRESCRIPTEUR ===
Nom : ${data.medecin_nom}
Tél : ${data.medecin_tel || 'Non renseigné'}

=== MOTIF DE CONSULTATION ===
${data.motif}

=== ANAMNÈSE (notes brutes) ===
${data.anamnese}

=== TEST(S) UTILISÉ(S) ===
${data.test_utilise}

=== RÉSULTATS DU TEST ===
${data.resultats}

=== NOTES DE PASSATION ===
${data.notes_passation || 'Aucune note supplémentaire'}${comportementBlock}${dureeBlock}${bilanPrecBlock}

=== INSTRUCTION ===
Génère le CRBO complet en appelant l'outil \`generate_crbo\`. Remplis chaque champ avec soin et respecte scrupuleusement les règles de conversion de percentiles. Inclus obligatoirement : severite_globale, comorbidites_detectees (même vide), pap_suggestions, glossaire. ${
    data.bilan_precedent_structure
      ? "Remplis aussi synthese_evolution avec comparaison rigoureuse des scores actuels vs précédents."
      : 'synthese_evolution = null (bilan initial).'
  }`
}
