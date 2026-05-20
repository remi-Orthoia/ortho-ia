import type { GrilleBilan } from './types'

/**
 * Grille B-CMado — Profil du Calcul et des Mathématiques (adolescent, collège).
 *
 * Variante "ado" de B-CM avec épreuves enrichies en logique (mots/téléphonie
 * dans Classifications, tab. cart. complet en Combinatoire, niveaux d'inclusion,
 * conservations avancées) et en numérosité (diaporama 2). Les domaines
 * Numération et Opérations sont quasi-identiques au B-CM enfant ; Problèmes
 * inclut en plus Proportions continu/discontinu, propres à l'ado.
 *
 * Source : docs/Bilans Sources/Profil B-CMado.xlsx
 */
export const GRILLE_B_CMADO: GrilleBilan = {
  id: 'b-cmado',
  label: 'B-CMado',
  description:
    'Profil du Calcul et des Mathématiques — bilan qualitatif pour adolescent (collège). ' +
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
            { id: 'telephonie', label: 'téléphonie' },
          ],
        },
        {
          id: 'combinatoire',
          label: 'Combinatoire',
          sousEpreuves: [
            { id: 'jetons-3c', label: 'jetons 3C' },
            { id: 'tab-cart-complet', label: 'tab. cart. complet' },
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
            { id: '2-niveaux', label: '2 niveaux' },
            { id: '3-niveaux', label: '3 niveaux' },
          ],
        },
        {
          id: 'conservation',
          label: 'Conservation',
          sousEpreuves: [
            { id: 'qte-discontinues', label: 'Qté discontinues' },
            { id: 'qte-continue', label: 'Qté continue' },
            { id: 'conservation-justif', label: 'Conservation avec justification' },
            { id: 'liquides-longueurs', label: 'Conservation des liquides-longueurs' },
            { id: 'volumes', label: 'Conservation des volumes' },
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
            { id: 'diaporama-2', label: 'diaporama 2' },
          ],
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
        { id: 'problemes-schematises', label: 'Problèmes — schématisés', sousEpreuves: [] },
        { id: 'problemes-classiques', label: 'Problèmes — classiques', sousEpreuves: [] },
        { id: 'proportions-continu', label: 'Proportions continu', sousEpreuves: [] },
        { id: 'proportions-discontinu', label: 'Proportions discontinu', sousEpreuves: [] },
      ],
    },
  ],
}
