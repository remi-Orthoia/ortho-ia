export function buildCRBOPrompt(data: {
  ortho_nom: string
  ortho_adresse: string
  ortho_cp: string
  ortho_ville: string
  ortho_tel: string
  ortho_email: string
  patient_prenom: string
  patient_nom: string
  patient_ddn: string
  patient_classe: string
  bilan_date: string
  bilan_type: string
  medecin_nom: string
  medecin_tel: string
  motif: string
  anamnese: string
  test_utilise: string
  resultats: string
  notes_passation: string
}): string {
  const ddn = new Date(data.patient_ddn)
  const bilanDate = new Date(data.bilan_date)
  const ageYears = bilanDate.getFullYear() - ddn.getFullYear()
  const ageMonths = bilanDate.getMonth() - ddn.getMonth()
  const totalMonths = ageYears * 12 + ageMonths
  const years = Math.floor(totalMonths / 12)
  const months = totalMonths % 12

  return `=== INFORMATIONS ORTHOPHONISTE ===
Nom : ${data.ortho_nom}
Adresse : ${data.ortho_adresse}, ${data.ortho_cp} ${data.ortho_ville}
Tél : ${data.ortho_tel}
Email : ${data.ortho_email}

=== INFORMATIONS PATIENT ===
Prénom : ${data.patient_prenom}
Nom : ${data.patient_nom}
Date de naissance : ${new Date(data.patient_ddn).toLocaleDateString('fr-FR')}
Âge au bilan : ${years} ans et ${months} mois
Classe : ${data.patient_classe}
Date du bilan : ${new Date(data.bilan_date).toLocaleDateString('fr-FR')}
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
