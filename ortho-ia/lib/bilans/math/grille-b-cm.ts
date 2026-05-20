import type { GrilleBilan } from './types'

/**
 * Grille B-CM — Profil du Calcul et des Mathématiques (enfant, cycle II-III).
 *
 * Structure tirée de docs/Bilans Sources/Profil-B CM.pdf.
 * Toute modification de cette grille casse les bilans déjà enregistrés
 * (les IDs servent de clés JSON dans crbos.resultats). En cas d'évolution,
 * versionner la grille au lieu de la modifier en place.
 */
export const GRILLE_B_CM: GrilleBilan = {
  id: 'b-cm',
  label: 'B-CM',
  description:
    'Profil du Calcul et des Mathématiques — bilan qualitatif pour enfant (cycles II et III). ' +
    'Cotation à 3 niveaux : réussite spontanée, après étayage, échec.',
  domaines: [
    {
      id: 'logique',
      label: 'Logique',
      epreuves: [
        {
          id: 'classifications',
          label: 'Classifications',
          sousEpreuves: [
            { id: 'set', label: 'SET' },
            { id: '10-cartes', label: '10 cartes' },
            { id: 'mots', label: 'mots' },
          ],
        },
        {
          id: 'combinatoire',
          label: 'Combinatoire',
          sousEpreuves: [
            { id: 'telephonie', label: 'téléphonie' },
            { id: 'jetons-3c', label: 'jetons 3C' },
          ],
        },
        {
          id: 'seriation',
          label: 'Sériation',
          sousEpreuves: [
            { id: 'entiers', label: 'entiers' },
            { id: 'decimaux', label: 'décimaux' },
          ],
        },
        {
          id: 'inclusion',
          label: 'Inclusion',
          sousEpreuves: [
            { id: 'etres-vivants', label: 'êtres vivants' },
            { id: 'la-ferme', label: 'la ferme' },
          ],
        },
        {
          id: 'conservation',
          label: 'Conservation',
          sousEpreuves: [
            { id: 'qte-discontinues', label: 'Qté discontinues' },
            { id: 'qte-continue', label: 'Qté continue' },
            { id: 'recipient-eau', label: "récipient d'eau" },
          ],
        },
      ],
    },
    {
      id: 'chaine-numerique',
      label: 'Chaîne numérique & numérosité',
      epreuves: [
        {
          id: 'chaine-numerique',
          label: 'Chaîne numérique',
          sousEpreuves: [
            { id: 'figures', label: 'figures' },
            { id: 'diaporama-1', label: 'diaporama 1' },
          ],
        },
        {
          id: 'denombrement',
          label: 'Dénombrement',
          sousEpreuves: [],
        },
        {
          id: 'numerosite',
          label: 'Numérosité / Sens du nombre',
          sousEpreuves: [
            { id: 'echelles-1-zareki', label: 'échelles 1 Zareki' },
            { id: 'echelles-2-zareki', label: 'échelles 2 Zareki' },
            { id: 'echelles-3', label: 'échelles 3' },
            { id: 'voc-estim-evac', label: 'Voc. Estim. EVAC' },
          ],
        },
      ],
    },
    {
      id: 'numeration',
      label: 'Numération',
      epreuves: [
        { id: 'numeration-entiere', label: 'Numération entière', sousEpreuves: [] },
        { id: 'numeration-decimale', label: 'Numération décimale', sousEpreuves: [] },
        { id: 'fractions', label: 'Fractions', sousEpreuves: [] },
        {
          id: 'transcodage',
          label: 'Transcodage',
          sousEpreuves: [
            { id: 'lecture', label: 'lecture' },
            { id: 'ecriture', label: 'écriture' },
            { id: 'sens', label: 'sens' },
          ],
        },
      ],
    },
    {
      id: 'operations-problemes',
      label: 'Opérations & problèmes',
      epreuves: [
        { id: 'faits-numeriques', label: 'Faits numériques', sousEpreuves: [] },
        { id: 'techniques-operatoires', label: 'Techniques opératoires', sousEpreuves: [] },
        { id: 'problemes-cartes', label: 'Problèmes — cartes', sousEpreuves: [] },
        { id: 'problemes-schematises', label: 'Problèmes — schématisés', sousEpreuves: [] },
        { id: 'problemes-classiques', label: 'Problèmes — classiques', sousEpreuves: [] },
      ],
    },
  ],
}
