import type { TestModule } from './types'

export const moca: TestModule = {
  nom: 'MoCA',
  editeur: 'MoCA Clinic & Institute',
  auteurs: 'Nasreddine et al.',
  annee: 2005,
  domaines: [
    'Fonctions visuo-exécutives',
    'Dénomination',
    'Mémoire différée',
    'Attention',
    'Langage',
    'Abstraction',
    'Rappel différé',
    'Orientation temporo-spatiale',
  ],
  epreuves: [
    'Alternance conceptuelle (Trail-Making B simplifié)',
    'Recopie du cube',
    'Horloge (contour, chiffres, aiguilles à 11h10)',
    'Dénomination d\'animaux (lion, rhinocéros, chameau)',
    'Empan direct de chiffres',
    'Empan inverse de chiffres',
    'Attention soutenue (frapper sur la lettre A)',
    'Soustraction en série (100 − 7)',
    'Répétition de phrases',
    'Fluence lettre (P, 1 min)',
    'Abstraction (similitudes)',
    'Rappel différé des 5 mots',
    'Orientation (date, lieu)',
  ],
  regles_specifiques: `### MoCA — Screening cognitif adulte / senior

**Nature du test** : outil de dépistage rapide (≈ 10 minutes) du trouble cognitif léger et de la démence. **Ce n'est PAS un bilan orthophonique complet** — il sert à décider s'il est pertinent d'engager un bilan approfondi du langage, de la mémoire et des fonctions exécutives.

**Score global** : /30 points.

| Score MoCA | Interprétation clinique |
|------------|-------------------------|
| ≥ 26 | Fonctionnement cognitif dans la norme |
| 22-25 | Trouble cognitif léger suspecté |
| 18-21 | Déficit cognitif modéré |
| < 18 | Déficit cognitif sévère |

**Ajustement niveau d'étude** : ajouter **+1 point** si ≤ 12 ans de scolarité (hors formations professionnelles).

**Interprétation dans le CRBO** :
- Utiliser \`percentile_value\` pour représenter le score normalisé : MoCA × (100/30).
- Champ \`interpretation\` :
  - ≥ 26 → "Normal"
  - 22-25 → "Limite basse"
  - 18-21 → "Déficitaire"
  - < 18 → "Pathologique"
- Toujours détailler les **sous-scores par domaine** pour identifier le profil cognitif (mnésique, dysexécutif, langagier…).

**Indications typiques** :
- Plainte mnésique chez un patient > 60 ans.
- Suspicion de trouble neuro-cognitif d'étiologie vasculaire, dégénérative, post-AVC, post-Covid.
- Bilan en neurogériatrie, consultation mémoire, centre SSR.
- Suivi longitudinal d'un patient diagnostiqué (réévaluations à 6-12 mois).

**À ne PAS faire** :
- Ne pas poser de diagnostic de maladie d'Alzheimer ou autre pathologie neurodégénérative à partir du seul MoCA — orienter vers un neurologue / gériatre / neuropsychologue.
- Ne pas utiliser le MoCA comme substitut à un bilan langage détaillé (GREMOTs, BETL, MT-86, protocole Montréal-Toulouse).

**Recommandations type** :
- Si score < 26 : proposer un bilan orthophonique approfondi ciblé sur les domaines déficitaires identifiés (langage, dénomination, mémoire de travail).
- Orientation vers consultation mémoire si non encore réalisée.
- Prise en charge orthophonique de stimulation cognitive et/ou de rééducation spécifique selon profil (aphasiologique, dysexécutif, amnésique).

**Articulation avec le bilan complet** : le MoCA est idéalement proposé **AVANT** un bilan approfondi, pour orienter le choix des épreuves ciblées et pour établir une mesure de référence du fonctionnement global.`,
}
