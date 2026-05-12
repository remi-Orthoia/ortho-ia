/**
 * Few-shots loader — API publique simple par-dessus la couche
 * `few-shot.ts` (qui contient la logique Supabase + le formattage). Permet
 * d'invoquer en une seule ligne :
 *
 *     const block = await getFewShots('Exalang 8-11', 9)
 *
 * Renvoie un bloc markdown prêt à concaténer au prompt système (vide si
 * aucun exemple disponible — no-op gracieux).
 *
 * Côté serveur uniquement : utilise le service-role Supabase via
 * fetchReferenceExamples → ne JAMAIS importer ce fichier dans un client
 * component (le service-role key fuiterait).
 */

import { fetchReferenceExamples, formatFewShotBlock } from './few-shot'

/**
 * Convertit un âge en années vers une tranche d'âge clinique (utilisée
 * comme clé de matching dans `bilan_references.tranche_age`). Mêmes
 * tranches que classeToTranche dans few-shot.ts, pour cohérence.
 */
function ageToTranche(age: number | null | undefined): string | null {
  if (typeof age !== 'number' || isNaN(age) || age < 0) return null
  if (age < 6) return 'maternelle'
  if (age < 9) return 'cycle 2'
  if (age < 11) return 'cycle 3'
  if (age < 13) return 'collège début'
  if (age < 16) return 'collège fin'
  if (age < 19) return 'lycée'
  return 'adulte'
}

/**
 * Convertit une tranche d'âge → "classe" représentative (réutilise le
 * mapping classeToTranche en sens inverse). Sert juste à appeler
 * fetchReferenceExamples qui attend un patient_classe.
 */
function trancheToClasse(tranche: string | null): string | null {
  switch (tranche) {
    case 'maternelle': return 'GS'
    case 'cycle 2': return 'CE1'
    case 'cycle 3': return 'CM1'
    case 'collège début': return '6ème'
    case 'collège fin': return '3ème'
    case 'lycée': return '1ère'
    case 'adulte': return 'adulte'
    default: return null
  }
}

/**
 * Récupère 1-2 exemples de CRBO de qualité (score ≥ 4) pour le test donné
 * et la tranche d'âge la plus proche, et les formate en bloc markdown
 * injectable dans le prompt système.
 *
 * @param testType  Nom canonique du test (ex: 'Exalang 8-11', 'Examath').
 * @param age       Âge du patient en années (entier). Optionnel — sans âge,
 *                  on tombe sur le matching test_type seul.
 * @returns Bloc markdown prêt à l'emploi (chaîne vide si aucun exemple).
 */
export async function getFewShots(
  testType: string,
  age?: number | null,
): Promise<string> {
  if (!testType || testType.trim() === '') return ''
  const tranche = ageToTranche(age)
  const examples = await fetchReferenceExamples({
    test_type: testType,
    patient_classe: trancheToClasse(tranche),
    limit: 2,
  })
  return formatFewShotBlock(examples)
}
