/**
 * Extraction PDF dediee PrediFex (HappyNeuron — gamme PREDI, fonctions
 * executives chez l'adulte).
 *
 * Cible : rapport de cotation PDF du logiciel HappyNeuron Pro OU scan
 * du cahier de passation rempli a la main.
 *
 * PrediFex est **sigma-based** (zones HappyNeuron, pas percentile).
 * 4 zones officielles (manuel p. 17) : vert / jaune (seuil d'alerte) /
 * orange / rouge. Stratification **age × NSC** obligatoire.
 *
 * 10 epreuves officielles, sous-scores multiples.
 *
 * Respecte la regle d'isolation CLAUDE.md : specifique a PrediFex,
 * route consommatrice unique : /api/extract-predifex-pdf.
 */

import type Anthropic from '@anthropic-ai/sdk'

/** 10 cles d'epreuves valides — DOIVENT matcher PrediFexScoresInput.tsx. */
export const PREDIFEX_EPREUVE_KEYS = [
  'e01_fluences_alternees',
  'e02_texte_mettre_ordre',
  'e03_textes_executifs',
  'e04_syllabe_sur_deux',
  'e05_mise_a_jour',
  'e06_probleme_arith',
  'e07_probleme_luria',
  'e08_sudofex',
  'e09_equivalences',
  'e10_itineraire',
] as const

export type PrediFexEpreuveKey = typeof PREDIFEX_EPREUVE_KEYS[number]

/** Sortie typee de l'extraction PrediFex. */
export interface PrediFexExtracted {
  trancheAge: string  // '' | '1' | '2' | '3' | '4' | '5'
  nsc: string  // '' | '1' | '2' | '3'
  epreuves: Array<{
    key: string
    /** Zone HappyNeuron lue sur le rapport (4 paliers PrediFex). */
    zone: string  // '' | 'vert' | 'jaune' | 'orange' | 'rouge'
    /** Sous-scores par subtest. Cles strictes par epreuve. */
    scores: Record<string, string>
    temps: string
    observation: string
    non_passee: boolean
  }>
}

/** Subtests valides par epreuve PrediFex — DOIVENT matcher
 *  PrediFexScoresInput.tsx (constante EPREUVES, e.subtests[].key). */
const PREDIFEX_SUBTEST_KEYS: Record<PrediFexEpreuveKey, string[]> = {
  e01_fluences_alternees: ['score'],
  e02_texte_mettre_ordre: ['score'],
  e03_textes_executifs:   ['resume', 'ordre'],
  e04_syllabe_sur_deux:   ['mots_2syl', 'mots_3syl', 'mots_4syl'],
  e05_mise_a_jour:        ['sub_5a_chiffres', 'sub_5b_syllabes', 'sub_5c_stroop'],
  e06_probleme_arith:     ['raisonnement', 'calcul'],
  e07_probleme_luria:     ['q1', 'q2', 'q3', 'q4'],
  e08_sudofex:            ['grille_annick', 'grille_marie', 'grille_guillaume'],
  e09_equivalences:       ['sub_formes', 'sub_feux', 'sub_etoiles', 'sub_fleches'],
  e10_itineraire:         ['score'],
}

export function predifexSubtestsHint(): string {
  return Object.entries(PREDIFEX_SUBTEST_KEYS)
    .map(([k, v]) => `  - ${k}: [${v.join(', ')}]`)
    .join('\n')
}

export const PREDIFEX_EXTRACT_TOOL: Anthropic.Tool = {
  name: 'extract_predifex_results',
  description: 'Extrait les resultats d\'un bilan PrediFex (HappyNeuron — gamme PREDI) depuis un rapport PDF du logiciel HappyNeuron Pro ou scan du cahier de passation rempli a la main. Retourne tranche d\'age + NSC + 10 epreuves avec zones HappyNeuron (4 paliers) + sous-scores + temps + observations.',
  input_schema: {
    type: 'object',
    properties: {
      trancheAge: {
        type: 'string',
        enum: ['', '1', '2', '3', '4', '5'],
        description: 'Tranche d\'age (stratification HappyNeuron). "18-49 ans" → 1. "50-59 ans" → 2. "60-69 ans" → 3. "70-79 ans" → 4. "80-90 ans" → 5. Vide si non determinable.',
      },
      nsc: {
        type: 'string',
        enum: ['', '1', '2', '3'],
        description: 'Niveau Socio-Culturel (stratification obligatoire). NSC 1 = ≤ scolarite 12 ans (CAP / Brevet). NSC 2 = Bac a Bac+3. NSC 3 = ≥ Bac+4 (haute reserve cognitive). ⚠️ Si scolarite < 10 ans, l\'epreuve 09 Equivalences est SAUTEE (manuel p. 75). Vide si non determinable.',
      },
      epreuves: {
        type: 'array',
        description: 'Une entree par epreuve passee. Ne PAS inclure les epreuves non passees ou absentes du PDF.',
        items: {
          type: 'object',
          properties: {
            key: {
              type: 'string',
              enum: [...PREDIFEX_EPREUVE_KEYS],
              description: 'Cle technique. e01_fluences_alternees = Fluences alternees ; e02_texte_mettre_ordre = Texte a mettre en ordre ; e03_textes_executifs = Textes executifs (resume + ordre) ; e04_syllabe_sur_deux = Syllabe sur deux ; e05_mise_a_jour = Mise a jour ; e06_probleme_arith = Probleme arithmetique ; e07_probleme_luria = Probleme de Luria ; e08_sudofex = Sudofex ; e09_equivalences = Equivalences ; e10_itineraire = Itineraire.',
            },
            zone: {
              type: 'string',
              enum: ['', 'vert', 'jaune', 'orange', 'rouge'],
              description: 'Zone HappyNeuron PrediFex (4 zones, manuel p. 17). **Vert** = ≥ M-1,5σ (norme ou au-dessus). **Jaune** = M-1,5σ a M-2σ (**SEUIL D\'ALERTE OFFICIEL**). **Orange** = M-2σ a M-3σ (difficulte averee). **Rouge** = < M-3σ (effondrement). ⚠️ NE PAS confondre avec PREDIMEM qui a 5 zones (avec vert_clair) — PrediFex en a 4 (pas de vert_clair).',
            },
            scores: {
              type: 'object',
              description: 'Sous-scores par subtest. Cles strictes par epreuve :\n' + predifexSubtestsHint() + '\nValeurs : score brut en texte. ⚠️ Ne PAS inclure de cles non listees ci-dessus.',
              additionalProperties: { type: 'string' },
            },
            temps: { type: 'string', description: 'Temps en secondes ou format libre. Vide si non chronometre.' },
            observation: { type: 'string', description: 'Observation qualitative recopiee verbatim. Cas particulier PrediFex : si "ecrit pour s\'aider" sur e04_syllabe_sur_deux → score doit etre 0 (consigne manuel p. 43, regle "ecrire = 0"). Si "MIREILLE non compris" sur e08_sudofex → bascule sur grille Annick. Si "LUNES non compris" sur e09_equivalences → epreuve abandonnee.' },
            non_passee: { type: 'boolean', description: 'true si epreuve marquee "NP" / "—" / "non realisee" / "sautee" / "scolarite < 10 ans" (cas e09).' },
          },
          required: ['key', 'zone', 'scores', 'temps', 'observation', 'non_passee'],
        },
      },
    },
    required: ['trancheAge', 'nsc', 'epreuves'],
  },
}

export const PREDIFEX_EXTRACT_PROMPT = `Tu es un expert en extraction de donnees de bilans orthophoniques PrediFex (HappyNeuron — gamme PREDI, fonctions executives chez l'adulte). Tu recois un rapport informatise du module resultats HappyNeuron Pro, un scan du cahier de passation rempli a la main, ou un bilan deja redige integrant les resultats.

# CONTEXTE PREDIFEX (specificites)

PrediFex est un protocole de **depistage des troubles executifs** chez l'adulte (18-90 ans). Il est **sigma-based** (zones HappyNeuron basees sur ecart-type), PAS percentile-based. Stratification obligatoire **age × NSC** (5 tranches d'age × 3 NSC).

⚠️ **PrediFex a 4 zones officielles** (manuel p. 17, citation verbatim) :
- **Vert** : ≥ M-1,5σ (norme ou au-dessus)
- **Jaune** : M-1,5σ à M-2σ (**SEUIL D'ALERTE OFFICIEL**)
- **Orange** : M-2σ à M-3σ (difficulte averee)
- **Rouge** : < M-3σ (effondrement)

⚠️ **PrediFex n'a PAS de zone "vert clair"** (contrairement à PREDIMEM qui en a une). NE PAS inventer une zone qui n'existe pas dans PrediFex.

10 epreuves officielles :
1. e01_fluences_alternees — Fluences alternees (1 minute, alternance lettres/categories)
2. e02_texte_mettre_ordre — Texte a mettre en ordre (planification narrative)
3. e03_textes_executifs — Textes executifs (resume /4 + ordre des evenements /6)
4. e04_syllabe_sur_deux — Syllabe sur deux (inhibition phonologique)
5. e05_mise_a_jour — Mise a jour (chiffres /21 + syllabes /24 + stroop complementaire /32)
6. e06_probleme_arith — Probleme arithmetique (raisonnement /6 + calcul /4)
7. e07_probleme_luria — Probleme de Luria (4 questions /4+/2+/2+/2)
8. e08_sudofex — Sudofex (grilles Annick /8, Marie /16, Guillaume /22 selon difficulte)
9. e09_equivalences — Equivalences (4 subtests progressifs : formes /8, feux /12, etoiles /18, fleches /20). ⚠️ SAUTEE si scolarite < 10 ans (manuel p. 75).
10. e10_itineraire — Itineraire (score total /20)

# OBJECTIF

Extraire les donnees brutes du bilan PrediFex pour pre-remplir le formulaire ortho.ia. **N'INVENTE RIEN.**

Tu DOIS appeler l'outil \`extract_predifex_results\`. N'ecris aucun texte hors de l'appel d'outil.

# 1. TRANCHE D'AGE + NSC

**Tranche d'age** :
- 18-49 ans → \`1\`
- 50-59 ans → \`2\`
- 60-69 ans → \`3\`
- 70-79 ans → \`4\`
- 80-90 ans → \`5\`

**NSC** (Niveau Socio-Culturel) :
- ≤ scolarite 12 ans (CAP / BEP / Brevet / Cert. d'etudes / sans diplome) → \`1\`
- Bac a Bac+3 (BTS / DUT / Licence) → \`2\`
- ≥ Bac+4 (Master / Doctorat / Grandes ecoles / professions intellectuelles superieures) → \`3\`

⚠️ Si scolarite explicitement < 10 ans, l'epreuve e09_equivalences sera marquee \`non_passee=true\` (consigne manuel p. 75 : la scolarite prime sur l'essai d'entrainement).

Si non determinable, laisse vide.

# 2. EPREUVES — 10 epreuves officielles

## key

Mapping libelles PDF → cle technique :
- "Fluences alternees" / "Fluences" → \`e01_fluences_alternees\`
- "Texte a mettre en ordre" / "Mettre en ordre" → \`e02_texte_mettre_ordre\`
- "Textes executifs" / "Subtest 3" (avec resume + ordre) → \`e03_textes_executifs\`
- "Syllabe sur deux" / "Inhibition syllabique" → \`e04_syllabe_sur_deux\`
- "Mise a jour" / "MaJ" → \`e05_mise_a_jour\`
- "Probleme arithmetique" / "Probleme arith." → \`e06_probleme_arith\`
- "Probleme de Luria" / "Luria" → \`e07_probleme_luria\`
- "Sudofex" → \`e08_sudofex\`
- "Equivalences" → \`e09_equivalences\`
- "Itineraire" → \`e10_itineraire\`

## zone (4 zones — pas de vert_clair !)

| Libelle PDF | Cle |
|---|---|
| "Vert" / "Norme" / "≥ M-1,5σ" / "Dans la norme" | \`vert\` |
| "Jaune" / "Seuil d'alerte" / "Fragilite" / "M-1,5 à M-2σ" | \`jaune\` |
| "Orange" / "Difficulte averee" / "M-2 à M-3σ" | \`orange\` |
| "Rouge" / "Effondrement" / "< M-3σ" | \`rouge\` |

⚠️ Si le PDF mentionne "vert clair" ou "vert fonce", c'est probablement une erreur d'OCR ou de mapping (PrediFex n'a que 4 zones). Mapper vers \`vert\` par defaut, sauf si une autre lecture est plus probable.

## scores (sous-scores par epreuve)

Cles autorisees par epreuve (TRES IMPORTANT — enum strict) :

${Object.entries(PREDIFEX_SUBTEST_KEYS).map(([k, v]) => `**${k}** : ${v.join(' / ')}`).join('\n')}

🔒 **VALIDATION DENOMINATEURS — PrediFex (verifie sur manuel HappyNeuron)** :

- e01_fluences_alternees : score /30 (1 pt par mot, plafond 30 ; 2 mots meme categorie consecutifs = 1 pt seulement)
- e02_texte_mettre_ordre : score /12 (grille balisee 12/10/8/6/4/0, manuel p. 32)
- e03_textes_executifs : resume /4 (tout ou rien), ordre /6 (-1 pt/episode mal place, -2 pt sur episode a asterisque)
- e04_syllabe_sur_deux : mots_2syl /8 (items 1-2, 4 pt/mot), mots_3syl /18 (items 3-5, 6 pt/mot), mots_4syl /16 (items 6-7, 8 pt/mot)
- e05_mise_a_jour : sub_5a_chiffres /21 (7 series × 3 pt), sub_5b_syllabes /24 (8 series × 3 pt), sub_5c_stroop /32 (10+12+10, complementaire si 5a<12 OU 5b<14)
- e06_probleme_arith : raisonnement /6 (-2 pt/erreur), calcul /4 (apprec examinateur)
- e07_probleme_luria : q1 /4, q2 /2, q3 /2, q4 /2 (total /10)
- e08_sudofex : grille_annick /8 (repli), grille_marie /16 (defaut), grille_guillaume /22 (niveau sup, mapping variable)
- e09_equivalences : sub_formes /8, sub_feux /12, sub_etoiles /18, sub_fleches /20 (scoring progressif item 1=2, 2=4, 3=6, 4=8)
- e10_itineraire : score /20 (2 pt/consigne respectee)

Si tu lis un denominateur different, c'est probablement une erreur OCR — verifie 2 fois.

## temps

Format libre.

## observation

Recopie verbatim TOUTES les annotations qualitatives. Cas particuliers PrediFex importants :

1. **e04 "ecrit pour s'aider"** → score = 0 force (regle manuel p. 43). Recopier l'observation et mettre score = "0".
2. **e08 "MIREILLE non compris"** → bascule sur grille Annick (consigne manuel p. 63). Mentionner dans observation.
3. **e09 "LUNES non compris"** → epreuve abandonnee (manuel p. 71). \`non_passee = true\`.
4. **e09 "Scolarite < 10 ans"** → epreuve sautee meme si LUNES OK (manuel p. 75). \`non_passee = true\`.
5. **Sous-test 5c Stroop** → complementaire (NE FAIT PAS partie du score d'epreuve) — declenche seulement si 5a < 12 OU 5b < 14. Recopier le score si present mais ne pas le compter dans le diagnostic.
6. **Annotations sur strategies** : raisonnement voix haute, mise en ordre mentale, auto-correction, persévération, aide examinateur (-3 ou -6 pts).

🔒 **CRITIQUE** : PrediFex doit avoir \`showAllEpreuveComments: true\` actif → TOUTES les observations remontent dans le Word. Recopie integrale.

## non_passee

\`true\` si :
- "NP" / "non passee" / "—" / "non realisee"
- e09 sautee pour scolarite < 10 ans (cas frequent)
- "LUNES non compris" sur e09
- "Essais SEL/COL rates" sur subtest 3b de PREDIMEM (memo : n'existe que sur PREDIMEM, pas PrediFex)
- "ecrit pour s'aider" sur e04 → ne pas marquer non_passee, l'epreuve est passee mais score = 0

# 3. PRINCIPES GENERAUX

- **Conservateur** : doute → vide.
- **Pas d'invention** : zero champ par defaut.
- **Format strict** : enums respectes (zones, cles).
- **Une entree par epreuve**.
- **Pas d'epreuve absente** : si l'epreuve n'est pas dans le PDF, ne PAS l'inclure.

Si le PDF n'est PAS un bilan PrediFex, retourne trancheAge='', nsc='', epreuves=[].`
