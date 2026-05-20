import type { GrilleBilan } from './types'

/**
 * Grille B-CM — Profil du Calcul et des Mathématiques (enfant, cycle II-III).
 *
 * Structure tirée de docs/Bilans Sources/Profil-B CM.pdf (Elsa DALL'AGNOL,
 * batterie B-LM2 + TEDI-MATH + EVAC + tests cliniques associés).
 *
 * Règle UX imposée : SEULES les sous-épreuves (tests / cellules) sont
 * coloriables — jamais les noms d'épreuves macro, jamais les domaines.
 * Chaque épreuve a donc au moins UN test explicite, même les épreuves
 * historiquement "mono" (Dénombrement, Faits numériques, etc.).
 *
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
          // Auparavant "mono" (pastille directe sur l'épreuve). Mise à jour
          // pour respecter la règle UX : la cote se met sur la cellule, pas
          // sur le nom d'épreuve. Le test de référence en B-LM2 est "gommettes".
          label: 'Dénombrement',
          sousEpreuves: [
            { id: 'gommettes', label: 'gommettes' },
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
        {
          id: 'numeration-entiere',
          // Auparavant "mono". Le PDF source décompose par taille de nombre
          // par classe (CP=2 chiffres, CE1=3, CE2=4-6, CM1=7+). On expose les
          // 4 niveaux + "appariement" pour la maternelle/GS.
          label: 'Numération entière',
          sousEpreuves: [
            { id: 'appariement', label: 'appariement nb u./jetons' },
            { id: '2-chiffres', label: 'nb à 2 chiffres' },
            { id: '3-chiffres', label: 'nb à 3 chiffres' },
            { id: '4-6-chiffres', label: 'nb 4-6 chiffres' },
            { id: '7-chiffres', label: 'nb 7 chiffres et +' },
          ],
        },
        {
          id: 'numeration-decimale',
          // Auparavant "mono". Décomposition par niveau décimal.
          label: 'Numération décimale',
          sousEpreuves: [
            { id: 'dixiemes', label: 'dixièmes' },
            { id: 'centiemes', label: 'centièmes' },
            { id: 'milliemes', label: 'millièmes' },
          ],
        },
        {
          id: 'fractions',
          // Auparavant "mono". Décomposition par compétence travaillée
          // (représentation, lecture/écriture, comparaison).
          label: 'Fractions',
          sousEpreuves: [
            { id: 'representation', label: 'représentation imagée' },
            { id: 'lecture-ecriture', label: 'lecture / écriture' },
            { id: 'comparaison', label: 'comparaison / rangement' },
          ],
        },
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
        {
          id: 'faits-numeriques',
          // Auparavant "mono". Décomposition par les 4 opérations
          // (test type : tables à réciter rapidement).
          label: 'Faits numériques',
          sousEpreuves: [
            { id: 'addition', label: 'addition' },
            { id: 'soustraction', label: 'soustraction' },
            { id: 'multiplication', label: 'multiplication' },
            { id: 'division', label: 'division' },
          ],
        },
        {
          id: 'techniques-operatoires',
          // Auparavant "mono". Même décomposition que faits numériques
          // mais sur la pose et le calcul écrit (technique posée).
          label: 'Techniques opératoires',
          sousEpreuves: [
            { id: 'addition', label: 'addition posée' },
            { id: 'soustraction', label: 'soustraction posée' },
            { id: 'multiplication', label: 'multiplication posée' },
            { id: 'division', label: 'division posée' },
          ],
        },
        {
          id: 'problemes',
          // Consolidation des 3 anciennes épreuves "Problèmes — cartes /
          // schématisés / classiques" en UNE épreuve avec 3 sous-tests.
          // Plus cohérent avec le PDF source (Problèmes = un type d'épreuve
          // avec plusieurs supports : cartes Riley-Greeno-Heller, schématisés
          // B-LM2, énoncés classiques B-LM2 + E. DALL'AGNOL).
          label: 'Problèmes',
          sousEpreuves: [
            { id: 'cartes', label: 'cartes (Riley, Greeno, Heller)' },
            { id: 'schematises', label: 'schématisés (B-LM2)' },
            { id: 'classiques', label: 'énoncés classiques' },
          ],
        },
      ],
    },
  ],
}
