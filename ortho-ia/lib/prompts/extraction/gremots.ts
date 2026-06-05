import type Anthropic from '@anthropic-ai/sdk'

/**
 * Extracteur GréMots — schéma JSON + prompt Claude pour parser un rapport
 * HappyNeuron Pro ou un cahier de passation scanné, en pré-remplissant
 * automatiquement le composant GremotsScoresInput.
 *
 * Source : manuel GréMots Béziy et al. 2016 + cahier HappyNeuron 2021.
 * 22 épreuves officielles, scoring 3 niveaux (Strict / Large / Erreur).
 * Stratification NSC (1/2/3) × tranche d'âge (50-59 / 60-69 / 70-79 / 80+).
 */

export const GREMOTS_EPREUVE_KEYS = [
  'e01_langage_spontane',
  'e02_repetition_mots',
  'e03_repetition_phrases',
  'e04_fluences_verbes',
  'e05_fluences_fruits',
  'e06_fluences_lettre_v',
  'e07_execution_ordres',
  'e08_denomination_objets',
  'e09_denomination_actions',
  'e10_denomination_personnes',
  'e11_elaboration_phrases',
  'e12_discours_narratif',
  'e13_comprehension_syntaxique',
  'e14_lecture_mots',
  'e15_lecture_logatomes',
  'e16_verification_oral_photo',
  'e17_ecriture_automatique',
  'e18_ecriture_mots',
  'e19_ecriture_logatomes',
  'e20_ecriture_phrases',
  'e21_comprehension_texte_ecrit',
  'e22_verification_ecrit_photo',
] as const

export type GremotsEpreuveKey = typeof GREMOTS_EPREUVE_KEYS[number]

/** Sortie typée de l'extraction GréMots. */
export interface GremotsExtracted {
  /** Niveau Socio-Culturel : '' | '1' | '2' | '3'. */
  nsc: string
  /** Tranche d'âge : '' | '50-59' | '60-69' | '70-79' | '80+'. */
  trancheAge: string
  epreuves: Array<{
    key: string
    /** Score Strict (1ère intention). */
    strict: string
    /** Score Large (2e intention après autocorrection / relecture). */
    large: string
    /** Erreur (réponse incorrecte ou absence). */
    erreur: string
    /** Temps en secondes (épreuves chronométrées). */
    temps: string
    /** Percentile lu sur le logiciel HappyNeuron. */
    percentile: string
    /** Observation qualitative recopiée verbatim. */
    observation: string
    /** Pour épreuve 1 (Entretien) : description du langage spontané. */
    qualitative_only: string
  }>
}

export const GREMOTS_EXTRACT_TOOL: Anthropic.Tool = {
  name: 'extract_gremots_results',
  description: "Extrait les résultats d'un bilan GréMots (HappyNeuron 2021, batterie langage neurodégénératif) depuis un rapport PDF du logiciel HappyNeuron Pro ou un scan du cahier de passation rempli à la main. Retourne NSC + tranche d'âge + 22 épreuves avec scores Strict/Large/Erreur + temps + percentile + observations qualitatives.",
  input_schema: {
    type: 'object',
    properties: {
      nsc: {
        type: 'string',
        enum: ['', '1', '2', '3'],
        description: "Niveau Socio-Culturel (stratification GréMots obligatoire). NSC 1 = primaire (scolarité ≤ 9 ans). NSC 2 = secondaire (Bac / CAP / BEP). NSC 3 = supérieur (post-Bac). Vide si non déterminable.",
      },
      trancheAge: {
        type: 'string',
        enum: ['', '50-59', '60-69', '70-79', '80+'],
        description: "Tranche d'âge GréMots (4 strates officielles). Vide si non déterminable.",
      },
      epreuves: {
        type: 'array',
        description: "Une entrée par épreuve passée. Ne PAS inclure les épreuves non passées ou absentes du PDF.",
        items: {
          type: 'object',
          properties: {
            key: {
              type: 'string',
              enum: [...GREMOTS_EPREUVE_KEYS],
              description: "Clé technique : e01_langage_spontane = Entretien / Langage spontané (qualitatif) ; e02_repetition_mots = Répétition de mots ; e03_repetition_phrases = Répétition de phrases ; e04/05/06_fluences_verbes/fruits/lettre_v = Fluences ; e07_execution_ordres = Exécution d'ordres ; e08/09/10_denomination_objets/actions/personnes = Dénomination orale ; e11_elaboration_phrases = Élaboration de phrases ; e12_discours_narratif = Discours narratif ; e13_comprehension_syntaxique = Compréhension syntaxique ; e14/15_lecture_mots/logatomes = Lecture à voix haute ; e16_verification_oral_photo = Vérification mot oral / photo ; e17_ecriture_automatique = Écriture automatique ; e18/19/20_ecriture_mots/logatomes/phrases = Écriture sous dictée ; e21_comprehension_texte_ecrit = Compréhension de texte écrit ; e22_verification_ecrit_photo = Vérification mot écrit / photo.",
            },
            strict: {
              type: 'string',
              description: "Score Strict (1ère intention, vert dans HappyNeuron). Score brut en texte. Vide si non renseigné ou si épreuve qualitative (e01).",
            },
            large: {
              type: 'string',
              description: "Score Large (2e intention après autocorrection ou relecture, orange dans HappyNeuron). Score brut en texte. Vide si non renseigné.",
            },
            erreur: {
              type: 'string',
              description: "Erreur (réponse incorrecte ou absence, rouge dans HappyNeuron). Score brut en texte. Vide si non renseigné.",
            },
            temps: {
              type: 'string',
              description: "Temps en secondes (épreuves chronométrées : répétitions, fluences ×3, dénominations ×3, lecture à voix haute). Vide si non chronométré ou non renseigné.",
            },
            percentile: {
              type: 'string',
              enum: ['', 'p76-100', 'p50-75', 'p26-49', 'p11-25', 'p6-10', 'p1-5'],
              description: "Percentile lu sur le logiciel HappyNeuron, mappé sur la grille 6 zones Laurie ortho.ia : > P75 → 'p76-100' (Excellent) ; P50-P75 → 'p50-75' (Moyenne haute) ; P26-P49 → 'p26-49' (Moyenne basse) ; P11-P25 → 'p11-25' (Zone de fragilité) ; P6-P10 → 'p6-10' (Difficulté) ; < P5 → 'p1-5' (Difficulté sévère). Vide si non renseigné.",
            },
            observation: {
              type: 'string',
              description: "Observation qualitative recopiée verbatim depuis le rapport HappyNeuron ou le cahier (types d'erreurs, paraphasies sémantiques/formelles/mixtes, conduites d'approche, persévérations, dénominations vides, demandes de répétition, etc.). Cette observation est cruciale pour la classification BETL des erreurs en dénomination (cf. fragment ERREURS_BETL).",
            },
            qualitative_only: {
              type: 'string',
              description: "UNIQUEMENT pour e01_langage_spontane : description qualitative du langage spontané (fluidité, débit, prosodie, recherches lexicales, paraphasies, cohérence du discours, manque du mot, circonlocutions, persévérations). Vide pour les autres épreuves.",
            },
          },
          required: ['key', 'strict', 'large', 'erreur', 'temps', 'percentile', 'observation', 'qualitative_only'],
        },
      },
    },
    required: ['nsc', 'trancheAge', 'epreuves'],
  },
}

export const GREMOTS_EXTRACT_PROMPT = `Tu es un expert en extraction de données de bilans orthophoniques GréMots (HappyNeuron 2021, batterie de référence pour l'évaluation du langage dans les pathologies neurodégénératives : maladie d'Alzheimer, aphasies progressives primaires variantes sémantique / non fluente / logopénique, démences lobaires fronto-temporales).

# CONTEXTE GRÉMOTS (spécificités)

GréMots est composée de **22 épreuves officielles** réparties en 8 domaines :
1. Traitement discursif (Entretien, Discours narratif, Compréhension texte écrit)
2. Production lexicale (Fluences ×3, Dénomination orale ×3)
3. Compréhension lexicale (Vérifications oral/écrit)
4. Production syntaxique (Élaboration de phrases)
5. Compréhension syntaxique (Exécution d'ordres, Compréhension syntaxique)
6. Répétition (Mots, Phrases, Logatomes)
7. Lecture à voix haute (Mots, Logatomes)
8. Écriture (Automatique, Mots, Logatomes, Phrases)

**Population cible** : adultes 50+ avec suspicion ou diagnostic de pathologie neurodégénérative. Étalonnage par **NSC × tranche d'âge** (50-59 / 60-69 / 70-79 / 80+).

**Convention de cotation officielle (manuel section 2.4)** :
- **Score Strict** (vert) : 1 point, réponse correcte d'emblée en 1ère intention.
- **Score Large** (orange) : 1 point, réponse correcte en 2e intention (autocorrection, relecture consigne).
- **Erreur** (rouge) : 0 point.
- Score Strict TOTAL = Strict + Large (les 2 catégories réussies comptent ensemble).

# MISSION

Extraire les résultats du PDF / scan reçu en respectant exactement le schéma JSON \`extract_gremots_results\`.

## Règles d'extraction

1. **Stratification obligatoire** : repérer le NSC (1/2/3) et la tranche d'âge (50-59 / 60-69 / 70-79 / 80+). Si l'âge brut est donné (ex. "66 ans"), mapper sur la tranche correspondante.

2. **Pour chaque épreuve passée**, reporter :
   - **strict / large / erreur** : 3 scores chiffrés. Si seul un score total est donné, le mettre dans \`strict\` et laisser \`large\` et \`erreur\` vides.
   - **temps** : pour les épreuves chronométrées (répétitions, fluences, dénominations, lecture à voix haute), reporter le temps en secondes. Vide sinon.
   - **percentile** : mapper le percentile HappyNeuron sur la grille 6 zones Laurie (cf. schéma). Si seule la "zone" HappyNeuron est mentionnée sans percentile précis, déduire le percentile depuis la zone (vert foncé → p76-100, vert → p50-75, jaune → p26-49 ou p11-25 selon la nuance, orange → p6-10, rouge → p1-5).
   - **observation** : recopier verbatim les annotations qualitatives (types d'erreurs, paraphasies, conduites d'approche, demandes de répétition…). Cette observation est essentielle pour la classification BETL des erreurs (paraphasies lexicales formelles / sémantiques / mixtes, paraphasies segmentales, logatomes, conduites d'approche formelle / sémantique / flexionnelle / combinatoire / constructionnelle, persévérations, dénominations vides).

3. **Épreuve 1 (Entretien / Langage spontané) — QUALITATIF UNIQUEMENT** :
   - Aucun score chiffré (laisser strict / large / erreur vides).
   - Remplir \`qualitative_only\` avec la description du langage spontané : fluidité, débit, prosodie, recherches lexicales, paraphasies en spontané, cohérence du discours, manque du mot, circonlocutions, persévérations.
   - Pas de \`temps\` ni de \`percentile\` pour cette épreuve.

4. **Ne PAS inclure** les épreuves marquées "NP" / "non passée" / "—" / "non réalisée" / "skipped". Mieux vaut omettre que d'inventer.

5. **Ne PAS halluciner de scores** : si le rapport ne mentionne pas un score précis, laisser le champ vide.

6. **Convention spéciale dénomination** : si le rapport mentionne des paraphasies sémantiques (ex. "animal" pour zèbre), formelles (ex. "lapin" pour sapin), des conduites d'approche ("un archi, un ati..."), des dénominations vides ("truc", "machin"), des néologismes / logatomes, recopier les exemples VERBATIM dans le champ \`observation\` avec le format "Ex. : « cible » → « production »".

Réponse uniquement via l'outil \`extract_gremots_results\`.`
