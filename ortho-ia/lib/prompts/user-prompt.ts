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
}): string {
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
${data.notes_passation || 'Aucune note supplémentaire'}

=== INSTRUCTION ===
Génère le CRBO complet en appelant l'outil \`generate_crbo\`. Remplis chaque champ avec soin et respecte scrupuleusement les règles de conversion de percentiles.`
}
