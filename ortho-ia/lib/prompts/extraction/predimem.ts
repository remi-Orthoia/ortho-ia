/**
 * Extraction PDF dediee PREDIMEM (Annick Duchêne & Marie Jaillard,
 * HappyNeuron 2019).
 *
 * Cible : rapport de cotation PDF du logiciel HappyNeuron Pro (module
 * resultats PREDIMEM) OU scan du cahier de passation rempli a la main.
 *
 * PREDIMEM est un protocole **sigma-based** (zones HappyNeuron, pas
 * percentile). 5 zones officielles : vert fonce / vert clair / jaune
 * (seuil d'alerte) / orange / rouge (effondrement). Stratification
 * **age × NSC** obligatoire pour calculer les zones (M-1,5σ de la
 * moyenne du groupe d'appartenance).
 *
 * 11 epreuves officielles, scores en sous-scores multiples (rappel +
 * reconnaissance + temps + observations qualitatives).
 *
 * Respecte la regle d'isolation CLAUDE.md : specifique a PREDIMEM,
 * route consommatrice unique : /api/extract-predimem-pdf.
 */

import type Anthropic from '@anthropic-ai/sdk'

/** 11 cles d'epreuves valides — DOIVENT matcher PredimemScoresInput.tsx
 *  (type EpreuveKey). */
export const PREDIMEM_EPREUVE_KEYS = [
  'e01_objets',
  'e02_texte_lu',
  'e03_mdt',
  'e04_blasons',
  'e05_tangram',
  'e06_assoc',
  'e07_texte_entendu',
  'e08_formes',
  'e09_auditive',
  'e10_spatiale',
  'e11_visages',
] as const

export type PredimemEpreuveKey = typeof PREDIMEM_EPREUVE_KEYS[number]

/** Sortie typee de l'extraction PREDIMEM. */
export interface PredimemExtracted {
  /** Tranche d'age (1 a 5) — stratification obligatoire HappyNeuron. */
  trancheAge: string  // '' | '1' | '2' | '3' | '4' | '5'
  /** Niveau socio-culturel (1 a 3) — stratification obligatoire. */
  nsc: string  // '' | '1' | '2' | '3'
  epreuves: Array<{
    key: string  // PredimemEpreuveKey
    /** Zone HappyNeuron lue sur le rapport (5 paliers σ). */
    zone: string  // '' | 'vert_fonce' | 'vert_clair' | 'jaune' | 'orange' | 'rouge'
    /** Sous-scores par subtest (clé = nom du subtest, valeur = score brut texte). */
    scores: Record<string, string>
    /** Temps en secondes (format libre). Vide si non chronometree. */
    temps: string
    /** Observation qualitative verbatim, recopie depuis le PDF si presente. */
    observation: string
    /** true si l'epreuve est explicitement marquee non passee / NP. */
    non_passee: boolean
  }>
}

/** Subtests valides par epreuve PREDIMEM — DOIVENT matcher
 *  PredimemScoresInput.tsx (constante EPREUVES, e.subtests[].key). */
const PREDIMEM_SUBTEST_KEYS: Record<PredimemEpreuveKey, string[]> = {
  e01_objets:        ['rappel', 'reconnaissance', 'optionnel_30'],
  e02_texte_lu:      ['rappel', 'resume'],
  e03_mdt:           ['subtest_3a', 'subtest_3b'],
  e04_blasons:       ['blason_1', 'blason_2', 'blason_3', 'blason_4'],
  e05_tangram:       ['total'],
  e06_assoc:         ['animaux', 'objets', 'logos'],
  e07_texte_entendu: ['rappel', 'resume'],
  e08_formes:        ['rosaces', 'ideogrammes'],
  e09_auditive:      ['bruits', 'phrases'],
  e10_spatiale:      ['cailloux_4', 'cailloux_5'],
  e11_visages:       ['peints', 'photos'],
}

/** Helper pour le prompt — liste des subtests valides par epreuve. */
export function predimemSubtestsHint(): string {
  return Object.entries(PREDIMEM_SUBTEST_KEYS)
    .map(([k, v]) => `  - ${k}: [${v.join(', ')}]`)
    .join('\n')
}

export const PREDIMEM_EXTRACT_TOOL: Anthropic.Tool = {
  name: 'extract_predimem_results',
  description: 'Extrait les resultats d\'un bilan PREDIMEM (HappyNeuron 2019 — Duchene & Jaillard) depuis un rapport PDF du logiciel HappyNeuron Pro ou scan du cahier de passation rempli a la main. Retourne la tranche d\'age + NSC + 11 epreuves avec zones HappyNeuron + sous-scores + temps + observations.',
  input_schema: {
    type: 'object',
    properties: {
      trancheAge: {
        type: 'string',
        enum: ['', '1', '2', '3', '4', '5'],
        description: 'Tranche d\'age PREDIMEM (stratification obligatoire). "18-49 ans" → 1. "50-59 ans" → 2. "60-69 ans" → 3. "70-79 ans" → 4. "80-90 ans" → 5. Si non determinable, vide.',
      },
      nsc: {
        type: 'string',
        enum: ['', '1', '2', '3'],
        description: 'Niveau Socio-Culturel (stratification obligatoire HappyNeuron). NSC 1 = scolarite ≤ 12 ans (CAP, Brevet, Cert. d\'etudes). NSC 2 = Bac a Bac+3. NSC 3 = ≥ Bac+4 (haute reserve cognitive). Si non determinable, vide.',
      },
      epreuves: {
        type: 'array',
        description: 'Une entree par epreuve passee. Ne PAS inclure les epreuves non passees ou absentes du PDF.',
        items: {
          type: 'object',
          properties: {
            key: {
              type: 'string',
              enum: [...PREDIMEM_EPREUVE_KEYS],
              description: 'Cle technique. e01_objets = Memoire visuelle d\'objets ; e02_texte_lu = Memoire d\'un texte LU ; e03_mdt = Memoire de travail ; e04_blasons = Blasons ; e05_tangram = Tangram ; e06_assoc = Associations semantiques ; e07_texte_entendu = Memoire d\'un texte ENTENDU ; e08_formes = Memoire visuelle de formes complexes ; e09_auditive = Memoire auditive ; e10_spatiale = Memoire spatiale ; e11_visages = Memoire de visages.',
            },
            zone: {
              type: 'string',
              enum: ['', 'vert_fonce', 'vert_clair', 'jaune', 'orange', 'rouge'],
              description: 'Zone HappyNeuron lue sur le rapport. **Vert fonce** (≥ M, "dans la norme ou au-dessus") → vert_fonce. **Vert clair** (M−1σ a M−1,5σ, performance correcte legerement abaissee) → vert_clair. **Jaune** (M−1,5σ a M−2σ, **seuil d\'alerte officiel** — manuel p. 255-270) → jaune. **Orange** (M−2σ a M−3σ, difficulte averee) → orange. **Rouge** (≤ M−3σ, "effondres" — manuel p. 270) → rouge. Vide si non determinable.',
            },
            scores: {
              type: 'object',
              description: 'Sous-scores par subtest. Cles attendues par epreuve :\n' + predimemSubtestsHint() + '\nValeurs : score brut en texte (ex. "8", "12/25", "16"). Vide si subtest non passe ou absent du PDF. ⚠️ Ne PAS inclure de cles non listees ci-dessus.',
              additionalProperties: { type: 'string' },
            },
            temps: { type: 'string', description: 'Temps en secondes ou format texte libre (ex. "180s", "3min", "120"). Vide si non chronometree ou non visible.' },
            observation: { type: 'string', description: 'Observation qualitative recopiee verbatim du PDF (annotations en marge, types d\'erreurs, strategies, intrusions, behaviors). PREDIMEM a `showAllEpreuveComments` actif — TOUTES les observations remontent dans le Word. Recopie integrale.' },
            non_passee: { type: 'boolean', description: 'true si l\'epreuve est explicitement marquee "NP" / "non passee" / "—" / non realisee. Defaut false.' },
          },
          required: ['key', 'zone', 'scores', 'temps', 'observation', 'non_passee'],
        },
      },
    },
    required: ['trancheAge', 'nsc', 'epreuves'],
  },
}

export const PREDIMEM_EXTRACT_PROMPT = `Tu es un expert en extraction de donnees de bilans orthophoniques PREDIMEM (Annick Duchene & Marie Jaillard — HappyNeuron 2019). Tu recois un rapport informatise du module resultats HappyNeuron Pro, ou un scan du cahier de passation rempli a la main, ou un bilan deja redige integrant les resultats.

# CONTEXTE PREDIMEM (specificites)

PREDIMEM est un protocole de **depistage des insuffisances mnesiques** chez l'adulte (18-90 ans). Il est **sigma-based** (zones HappyNeuron basees sur ecart-type), PAS percentile-based. Stratification obligatoire **age × NSC** (5 tranches d'age × 3 NSC = 15 sous-groupes) pour calculer les seuils.

5 zones officielles HappyNeuron (manuel p. 255-270) :
- **Vert fonce** : ≥ M (norme ou au-dessus)
- **Vert clair** : M−1σ à M−1,5σ (correct, legerement abaisse)
- **Jaune** : M−1,5σ à M−2σ (**SEUIL D'ALERTE officiel**)
- **Orange** : M−2σ à M−3σ (difficulte averee)
- **Rouge** : ≤ M−3σ (effondre)

11 epreuves officielles :
1. e01_objets — Memoire visuelle d'objets (rappel + reconnaissance + optionnel /30)
2. e02_texte_lu — Memoire d'un texte LU (rappel /12 + choix du resume /8)
3. e03_mdt — Memoire de travail (subtest 3a /24 + 3b /22)
4. e04_blasons — Blasons (4 blasons : /14 /16 /18 /16)
5. e05_tangram — Tangram (total /16)
6. e06_assoc — Associations semantiques (animaux /16 + objets /16 + logos /14)
7. e07_texte_entendu — Memoire d'un texte ENTENDU (rappel /12 + resume /8)
8. e08_formes — Memoire visuelle de formes complexes (rosaces /10 + ideogrammes /10)
9. e09_auditive — Memoire auditive (bruits /12 + phrases /40)
10. e10_spatiale — Memoire spatiale (parcours 4 cailloux /16 + 5 cailloux /20)
11. e11_visages — Memoire de visages (portraits peints /10 + photos /10)

# OBJECTIF

Extraire les donnees brutes du bilan PREDIMEM pour pre-remplir le formulaire ortho.ia. **N'INVENTE RIEN.** Si une donnee n'est pas dans le PDF, laisse vide.

Tu DOIS appeler l'outil \`extract_predimem_results\`. N'ecris aucun texte hors de l'appel d'outil.

# 1. TRANCHE D'AGE + NSC

Cherche dans l'en-tete du rapport :

**Tranche d'age** : age du patient → mapping :
- 18-49 ans → \`1\`
- 50-59 ans → \`2\`
- 60-69 ans → \`3\`
- 70-79 ans → \`4\`
- 80-90 ans → \`5\`

**NSC** (Niveau Socio-Culturel) — souvent indique explicitement ou deductible de la scolarite/profession :
- "Scolarite < 12 ans" / "CAP" / "BEP" / "Brevet" / "Certificat d'etudes" / "Sans diplome" → \`1\`
- "Bac" / "Bac+1" / "Bac+2" / "Bac+3" / "BTS" / "DUT" / "Licence" → \`2\`
- "Bac+4" / "Bac+5" / "Master" / "Doctorat" / "Grandes ecoles" / professions intellectuelles superieures → \`3\`

Si non determinable explicitement, laisse vide. ⚠️ NE PAS deviner.

# 2. EPREUVES — 11 epreuves officielles

Pour chaque epreuve cotee dans le PDF, creer une entree avec :

## key

Mapping libelles PDF → cle technique :
- "Memoire visuelle d'objets" / "Objets" / "Subtest 1" → \`e01_objets\`
- "Memoire d'un texte LU" / "Texte lu" / "Subtest 2" → \`e02_texte_lu\`
- "Memoire de travail" / "MDT" / "Subtest 3" → \`e03_mdt\`
- "Blasons" / "Subtest 4" → \`e04_blasons\`
- "Tangram" / "Subtest 5" → \`e05_tangram\`
- "Associations semantiques" / "Associations" / "Subtest 6" → \`e06_assoc\`
- "Memoire d'un texte ENTENDU" / "Texte entendu" / "Subtest 7" → \`e07_texte_entendu\`
- "Memoire visuelle de formes complexes" / "Formes" / "Subtest 8" → \`e08_formes\`
- "Memoire auditive" / "Subtest 9" → \`e09_auditive\`
- "Memoire spatiale" / "Cailloux" / "Subtest 10" → \`e10_spatiale\`
- "Memoire de visages" / "Visages" / "Subtest 11" → \`e11_visages\`

Si une epreuve ne matche AUCUNE cle, ne PAS la creer.

## zone

Recopie la zone HappyNeuron affichee par le module resultats (logiciel HappyNeuron Pro). Mapping :

| Libelle PDF | Cle |
|---|---|
| "Vert fonce" / "Norme" / "Au-dessus de M" / "Dans la norme" | \`vert_fonce\` |
| "Vert clair" / "Legerement abaisse" / "M-1 a M-1,5σ" | \`vert_clair\` |
| "Jaune" / "Seuil d'alerte" / "Fragilite" / "M-1,5 a M-2σ" | \`jaune\` |
| "Orange" / "Difficulte" / "M-2 a M-3σ" | \`orange\` |
| "Rouge" / "Effondre" / "≤ M-3σ" | \`rouge\` |

Si la zone n'est pas explicitement marquee, laisse vide. ⚠️ NE PAS deduire de l'ecart-type seul — l'ortho doit avoir vu la couleur officielle sur HappyNeuron Pro.

## scores (sous-scores par epreuve)

Cles autorisees par epreuve (TRES IMPORTANT — l'enum est strict) :

${Object.entries(PREDIMEM_SUBTEST_KEYS).map(([k, v]) => `**${k}** : ${v.join(' / ')}`).join('\n')}

Format : score brut en texte. Ex. \`{ "rappel": "12", "reconnaissance": "20" }\` pour e01_objets.

🔒 **VALIDATION DENOMINATEURS — PREDIMEM (verifie sur manuel HappyNeuron 2019)** :

- e01_objets : rappel /25, reconnaissance /25, optionnel_30 /30
- e02_texte_lu : rappel /12, resume /8
- e03_mdt : subtest_3a /24, subtest_3b /22
- e04_blasons : blason_1 /14, blason_2 /16, blason_3 /18, blason_4 /16
- e05_tangram : total /16
- e06_assoc : animaux /16, objets /16, logos /14
- e07_texte_entendu : rappel /12, resume /8
- e08_formes : rosaces /10, ideogrammes /10
- e09_auditive : bruits /12, phrases /40
- e10_spatiale : cailloux_4 /16, cailloux_5 /20
- e11_visages : peints /10, photos /10

Si tu lis un denominateur different, c'est probablement une erreur OCR. Verifie 2 fois.

## temps

Format libre (ex. "180s", "3 min", "120"). Vide si l'epreuve n'est pas chronometree ou si le temps n'est pas visible.

## observation

Recopie verbatim TOUTES les annotations qualitatives presentes dans le PDF pour cette epreuve. Sources :
1. **Marge du tableau de cotation** : "intrusions ×3", "stratégie de catégorisation", "redemande complete", "j'avais oublié celui-là".
2. **Section observations / commentaires en bas de page**.
3. **Annotations sur les strategies** : voix basse, mise en ordre mentale, indicage utilise, benefice indicage.
4. **Comportements** : fatigue, decrochage, persévération, refus d'epreuve.
5. **Erreurs typiques** : type intrusions (objets non presentes), inventions (associations inexistantes), confusion visages.

🔒 **CRITIQUE** : PREDIMEM a \`showAllEpreuveComments: true\` actif → TOUTES les observations remontent dans le Word genere, pas seulement celles des epreuves fragiles. Donc chaque annotation que tu trouves doit etre recopiee verbatim.

## non_passee

\`true\` si explicitement marque "NP" / "non passee" / "non realisee" / "—" / "X" / "non applicable" / "abandonnee".

Note : PREDIMEM autorise de NE PAS PROPOSER certaines epreuves (l'ortho choisit en fonction de l'hypothese clinique — manuel p. 6, philosophie "à la carte"). Pas de penalite si une epreuve est absente du rapport.

# 3. PRINCIPES GENERAUX

- **Conservateur** : si un doute, laisser vide.
- **Pas d'invention** : zero champ rempli par defaut.
- **Format strict** : respecter les enums (zones, cles d'epreuves, cles de subtests).
- **Une entree par epreuve** : ne pas dupliquer.
- **Pas d'epreuve absente** : si une epreuve n'est pas dans le PDF, ne PAS l'inclure (elle restera vide cote form, l'ortho la completera).

Si le PDF n'est PAS un bilan PREDIMEM (autre test, page blanche, document non pertinent), retourne trancheAge='', nsc='', epreuves=[].`
