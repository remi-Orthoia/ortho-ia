/**
 * Extraction PDF dediee BETL — Batterie d'Evaluation des Troubles Lexicaux
 * (Tran T.M. & Godefroy O., Ortho Edition 2015).
 *
 * Cible : rapport de cotation PDF du logiciel BETL informatise OU scan du
 * cahier de passation rempli a la main + Annexe 1 (qualification des
 * erreurs) + Annexe 2 (commentaires).
 *
 * BETL est **seuils-based** (verdict Normal / Pathologique par tranche
 * d'age × NSC). Le form calcule lui-meme le verdict depuis le score brut
 * + le seuil officiel — l'extracteur capte donc le score brut + le temps
 * + les observations qualitatives, et le form se charge du reste.
 *
 * 8 epreuves officielles (I a VIII), score sur 54 + temps en secondes
 * + observation qualitative + (pour VII) score orthographique separe.
 *
 * Respecte la regle d'isolation CLAUDE.md : specifique a BETL, route
 * consommatrice unique : /api/extract-betl-pdf.
 */

import type Anthropic from '@anthropic-ai/sdk'

/** 8 cles d'epreuves valides — DOIVENT matcher BetlScoresInput.tsx
 *  (type EpreuveKey = 'I' | 'II' | ... | 'VIII'). */
export const BETL_EPREUVE_KEYS = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII'] as const

export type BetlEpreuveKey = typeof BETL_EPREUVE_KEYS[number]

/** Sortie typee de l'extraction BETL. */
export interface BetlExtracted {
  /** Tranche d'age (5 plages officielles). Vide si non determinable. */
  trancheAge: string  // '' | '20-34' | '35-49' | '50-64' | '65-79' | '80-95'
  /** Niveau Socio-Culturel (3 niveaux officiels). Vide si non determinable. */
  nsc: string  // '' | '1' | '2' | '3'
  /** Score orthographique de l'epreuve VII (sur 54, score lexical et
   *  orthographique sont distincts en denomination ecrite). */
  scoreOrthoVII: string
  /** Efficacite de l'ebauche orale (marqueur diagnostic Hillis-Caramazza :
   *  efficace = trouble d'acces au lexique phonologique ;
   *  inefficace = atteinte des representations elles-memes). */
  ebaucheOrale: string  // '' | 'efficace' | 'inefficace' | 'non-testee'
  /** Analyse qualitative des comportements / paraphasies (Annexe 1 BETL). */
  comportements: string
  /** Profil de discours (Annexe 2 BETL). */
  profilDiscours: string
  /** 8 epreuves : score brut + temps + observation. Le verdict N/P est
   *  recalcule cote form depuis les seuils officiels. */
  epreuves: Array<{
    key: string  // BetlEpreuveKey
    /** Score brut sur 54. Format libre (ex. "48", "32/54"). */
    score: string
    /** Temps de reponse total en secondes. Format libre. */
    temps: string
    /** Observation qualitative recopiee verbatim du PDF. */
    observation: string
  }>
}

export const BETL_EXTRACT_TOOL: Anthropic.Tool = {
  name: 'extract_betl_results',
  description: 'Extrait les resultats d\'un bilan BETL (Tran & Godefroy, Ortho Edition 2015) depuis un rapport PDF du logiciel BETL informatise ou un scan du cahier de passation rempli a la main. Retourne tranche d\'age + NSC + 8 epreuves (I-VIII) avec score brut + temps + observation. Le verdict N/P est recalcule cote form depuis les seuils officiels.',
  input_schema: {
    type: 'object',
    properties: {
      trancheAge: {
        type: 'string',
        enum: ['', '20-34', '35-49', '50-64', '65-79', '80-95'],
        description: 'Tranche d\'age BETL (5 plages officielles, manuel Annexe 3). "20-34 ans" → 20-34. "35-49 ans" → 35-49. "50-64 ans" → 50-64. "65-79 ans" → 65-79. "80-95 ans" → 80-95. Vide si non determinable depuis le PDF.',
      },
      nsc: {
        type: 'string',
        enum: ['', '1', '2', '3'],
        description: 'Niveau Socio-Culturel (stratification obligatoire BETL, manuel Annexe 3). NSC 1 = scolarite ≤ 9 ans (sans diplome, CAP, BEP, Certificat d\'etudes). NSC 2 = scolarite 10-12 ans (BAC, formation professionnelle courte). NSC 3 = scolarite ≥ 13 ans (etudes superieures, BTS, DUT, Licence, Master, Doctorat). Vide si non determinable.',
      },
      scoreOrthoVII: {
        type: 'string',
        description: 'Score orthographique sur 54 de l\'epreuve VII (Denomination ecrite d\'images). VII a 2 scores distincts dans BETL : un score lexical (mot evoque correctement, dans `epreuves[VII].score`) + un score orthographique (graphies correctes des mots evoqués). Ce champ contient le SCORE ORTHOGRAPHIQUE separe. Vide si non present dans le PDF.',
      },
      ebaucheOrale: {
        type: 'string',
        enum: ['', 'efficace', 'inefficace', 'non-testee'],
        description: 'Efficacite de l\'ebauche orale (indicage phonemique du mot-cible). MARQUEUR DIAGNOSTIC CENTRAL BETL : efficace = trouble d\'acces au lexique phonologique (representations preservees) ; inefficace = atteinte des representations phonologiques elles-memes ; non-testee = ebauche non administree par l\'examinateur. Vide si l\'information n\'est pas dans le PDF.',
      },
      comportements: {
        type: 'string',
        description: 'Analyse qualitative des comportements et paraphasies observees pendant la BETL — recopie verbatim depuis l\'Annexe 1 BETL (qualification des erreurs) ou depuis les commentaires en marge. Types d\'erreurs typiques a recopier : paraphasies semantiques (chat → chien), paraphasies formelles phonetiques (/bʁa/ pour /pʁa/), paraphasies formelles phonemiques (interversions), neologismes, persévérations, conduites d\'approche, modalisations type "ah oui, c\'est sur le bout de la langue", absences de reponse. Vide si pas d\'analyse qualitative dans le PDF.',
      },
      profilDiscours: {
        type: 'string',
        description: 'Profil de discours observe pendant la BETL — recopie verbatim depuis l\'Annexe 2 BETL (commentaires sur le discours spontane et les modalites de production). Type d\'aphasie suggeree par le discours (fluent vs non-fluent, manque du mot, anosognosie, jargon, conduites d\'approche, etc.). Vide si non documente.',
      },
      epreuves: {
        type: 'array',
        description: 'Une entree par epreuve passee. Ne PAS inclure les epreuves non passees ou absentes du PDF. Les 8 epreuves officielles ont chacune un score sur 54 + un temps en secondes.',
        items: {
          type: 'object',
          properties: {
            key: {
              type: 'string',
              enum: [...BETL_EPREUVE_KEYS],
              description: 'Cle technique de l\'epreuve (chiffres romains I a VIII).\n- I = Denomination orale d\'images (image → orale)\n- II = Designation d\'images a partir d\'un mot entendu (orale → image designee)\n- III = Appariement semantique d\'images (image → image designee)\n- IV = Lecture a voix haute (ecrite → orale)\n- V = Designation de mots ecrits a partir d\'un mot entendu (orale → mot ecrit designe)\n- VI = Appariement semantique de mots ecrits (ecrite → mot ecrit designe)\n- VII = Denomination ecrite d\'images (image → ecrite) — 2 scores : lexical (dans `score`) + orthographique (dans `scoreOrthoVII`)\n- VIII = Questionnaire semantique (4 proprietes verifiees par item, /54). Pratique uniquement chez profil neurodegeneratif (MA / APP / demence semantique), pas chez aphasique post-AVC modere a severe.',
            },
            score: {
              type: 'string',
              description: 'Score brut sur 54. Format libre (ex. "48", "48/54", "32"). Pour epreuve VII : c\'est le SCORE LEXICAL (mot evoque correctement). Le score orthographique de VII est dans le champ separe `scoreOrthoVII` au niveau racine.',
            },
            temps: {
              type: 'string',
              description: 'Temps de reponse total en secondes. Format libre (ex. "120", "120s", "2min", "180 sec."). Vide si non chronometre ou non visible. **Critere important** : un score Normal avec un temps Pathologique est un marqueur sub-clinique central en BETL (le verdict temps est calcule contre le seuil P95 du groupe).',
            },
            observation: {
              type: 'string',
              description: 'Observation qualitative specifique a cette epreuve, recopiee verbatim. Types d\'erreurs typiques, comportements, conduites d\'approche, modalisations. Recopier integralement les annotations cliniques.',
            },
          },
          required: ['key', 'score', 'temps', 'observation'],
        },
      },
    },
    required: ['trancheAge', 'nsc', 'scoreOrthoVII', 'ebaucheOrale', 'comportements', 'profilDiscours', 'epreuves'],
  },
}

export const BETL_EXTRACT_PROMPT = `Tu es un expert en extraction de donnees de bilans orthophoniques BETL — Batterie d'Evaluation des Troubles Lexicaux (Tran T.M. & Godefroy O., Ortho Edition 2015). Tu recois un rapport du logiciel BETL informatise (PDF), un scan du cahier de passation rempli a la main + Annexe 1 (qualification des erreurs) + Annexe 2 (commentaires), ou un bilan deja redige integrant les resultats.

# CONTEXTE BETL (specificites)

BETL est une batterie informatisee pour adultes (20-95 ans) avec une **stratification obligatoire age × NSC** (5 tranches d'age × 3 NSC = 15 sous-groupes de reference). Validee sur 1488 sujets-temoins + 124 patients (51 aphasie vasculaire + 75 maladie d'Alzheimer debutante).

**8 epreuves officielles** portent sur les **MEMES 54 items** (controles psycholinguistiquement en frequence × longueur × categorie semantique × regularite orthographique). C'est ce design qui permet la **comparaison inter-taches** centrale du diagnostic Hillis-Caramazza.

**Scoring** : la BETL n'utilise PAS de percentiles continus. Pour chaque epreuve et chaque dimension (score / temps), le logiciel affiche un verdict **N (Normal)** ou **P (Pathologique)** calcule depuis :
- Seuil P5 sur le score brut (un score < P5 = pathologique)
- Seuil P95 sur le temps (un temps > P95 = pathologique)

Le verdict N/P depend de la stratification (tranche d'age × NSC). L'ortho.ia recalcule lui-meme ce verdict cote form a partir du score brut + du seuil officiel + de la stratification — donc tu n'as PAS besoin de sortir le verdict, juste le score brut et le temps.

# OBJECTIF

Extraire les donnees brutes du bilan BETL pour pre-remplir le formulaire ortho.ia. **N'INVENTE RIEN.**

Tu DOIS appeler l'outil \`extract_betl_results\`. N'ecris aucun texte hors de l'appel d'outil.

# 1. STRATIFICATION (tranche d'age + NSC)

## trancheAge

Cherche dans l'en-tete du rapport / l'anamnese :
- 20 a 34 ans → \`20-34\`
- 35 a 49 ans → \`35-49\`
- 50 a 64 ans → \`50-64\`
- 65 a 79 ans → \`65-79\`
- 80 a 95 ans → \`80-95\`

Si l'age est inferieur a 20 ans ou superieur a 95 ans, ou non determinable, laisse vide.

## nsc (Niveau Socio-Culturel)

3 niveaux officiels BETL (manuel Annexe 3) :
- **NSC 1** = scolarite ≤ 9 ans → "Sans diplome", "Certificat d\'etudes", "CAP", "BEP", "BEPC", "Brevet" → \`1\`
- **NSC 2** = scolarite 10-12 ans → "Bac", "BEP / BAC pro", "formation professionnelle courte" → \`2\`
- **NSC 3** = scolarite ≥ 13 ans → "Bac+1" / "Bac+2" / "Licence" / "BTS" / "DUT" / "Master" / "Doctorat" / "Grandes ecoles" / professions intellectuelles superieures → \`3\`

Si non determinable, laisse vide.

# 2. EPREUVES — 8 epreuves officielles BETL (I a VIII)

## key

Mapping libelles PDF → cle :

- "I" / "1" / "Denomination orale d\'images" / "Denomination orale" → \`I\`
- "II" / "2" / "Designation d\'images" / "Designation d\'images a partir d\'un mot entendu" → \`II\`
- "III" / "3" / "Appariement semantique d\'images" → \`III\`
- "IV" / "4" / "Lecture a voix haute" / "Lecture" → \`IV\`
- "V" / "5" / "Designation de mots ecrits" / "Designation de mots ecrits a partir d\'un mot entendu" → \`V\`
- "VI" / "6" / "Appariement semantique de mots ecrits" → \`VI\`
- "VII" / "7" / "Denomination ecrite d\'images" / "Denomination ecrite" → \`VII\`
- "VIII" / "8" / "Questionnaire semantique" / "Verification de proprietes" → \`VIII\`

## score (sur 54)

Score brut affiche par le logiciel. Format libre. Ex. "48", "48/54", "32".

Pour l'epreuve **VII** (Denomination ecrite) : il y a **2 scores** distincts dans BETL :
- **Score lexical** (mot evoque correctement) → champ \`score\`
- **Score orthographique** (graphies correctes des mots evoques) → champ \`scoreOrthoVII\` au niveau racine de la sortie

Si tu trouves un score "lexical /54" ET un score "orthographique /54" pour VII, ne pas les confondre. Mets le lexical dans \`score\` de l\'item VII, et l\'orthographique dans \`scoreOrthoVII\` racine.

🔒 **VALIDATION DENOMINATEURS** :
- Toutes les epreuves BETL : **/54** (54 items au total dans la batterie)
- VII a en plus le score orthographique : **/54** egalement

Si tu lis un denominateur different, c'est probablement une erreur OCR. Verifie 2 fois.

## temps (en secondes)

Temps de reponse total de l\'epreuve. Format libre (ex. "120", "120s", "2min 30").

⚠️ **CRITIQUE** : un score Normal avec un temps Pathologique est un marqueur sub-clinique important en BETL. NE PAS OMETTRE les temps.

## observation

Observation qualitative SPECIFIQUE a cette epreuve, recopiee verbatim. Sources :
1. **Marge du rapport** : "paraphasie semantique (chat → chien)", "conduite d\'approche", "modalisation", "absence reponse 3 items".
2. **Annotations sur les types d\'erreurs**.
3. **Commentaires sur les latences**.

# 3. CHAMPS RACINE (transversaux a toutes les epreuves)

## scoreOrthoVII

Le **score orthographique sur 54** de l'epreuve VII (Denomination ecrite). Distinct du score lexical (qui est dans \`epreuves[VII].score\`). Vide si non present dans le PDF.

## ebaucheOrale

⚠️ **MARQUEUR DIAGNOSTIC CENTRAL BETL** (modele Hillis-Caramazza). 3 valeurs possibles :

- \`efficace\` : l\'examinateur a propose une ebauche orale (indicage du premier phoneme) et le patient a recupere le mot-cible. **Interpretation** : trouble d\'ACCES au lexique phonologique (representations preservees mais difficiles a recuperer).
- \`inefficace\` : ebauche proposee mais le patient ne recupere pas le mot. **Interpretation** : atteinte des REPRESENTATIONS phonologiques elles-memes.
- \`non-testee\` : ebauche pas administree par l\'examinateur.

Si le PDF ne mentionne pas explicitement l\'ebauche orale, laisse vide.

## comportements (Annexe 1 BETL — qualification des erreurs)

Recopier verbatim l'analyse qualitative des comportements et types d\'erreurs depuis l\'Annexe 1 BETL :
- **Paraphasies semantiques** (chat → chien, fourchette → couteau) : oriente vers trouble lexico-semantique.
- **Paraphasies formelles** :
  - phonetiques : /bʁa/ pour /pʁa/ — substitution de trait articulatoire
  - phonemiques : interversions, ajouts, omissions, substitutions de phonemes ("lave" pour "valent")
- **Neologismes** : production de non-mots.
- **Perseverations** : reprise d\'une reponse precedente.
- **Conduites d\'approche** : tentatives successives vers le mot-cible avec rapprochements progressifs.
- **Modalisations** : "ah oui, c\'est sur le bout de la langue", "comment ca s\'appelle deja", "c\'est ce qu\'on met dans...".
- **Absences de reponse** : nombre d\'items non repondus.

## profilDiscours (Annexe 2 BETL — commentaires)

Recopier verbatim les commentaires sur le discours spontane et la modalite de production :
- Discours fluent vs non-fluent.
- Manque du mot dans le discours spontane.
- Anosognosie (le patient ne percoit pas ses erreurs).
- Jargon (production de non-mots sans realisation de l\'erreur).
- Type d\'aphasie suggeree (Wernicke fluent, Broca non-fluent, anomique, conduction, transcorticale, etc.) — uniquement si **deja documente dans le PDF**, ne PAS inventer.

# 4. PRINCIPES GENERAUX

- **Conservateur** : doute → vide. Mieux vaut un champ vide qu\'une hallucination.
- **Pas d\'invention** : zero champ par defaut. Si une epreuve n\'est pas dans le PDF, ne PAS l\'inclure dans le tableau.
- **Format strict** : enums respectes (trancheAge, nsc, key, ebaucheOrale).
- **Une entree par epreuve** : ne pas dupliquer.
- **Verdict N/P** : ne PAS sortir — l\'ortho.ia le recalcule depuis le score + le seuil + la stratification.
- **Reference Hillis-Caramazza** : si le PDF contient deja une analyse en reference au modele Caramazza & Hillis (1990), recopier dans \`profilDiscours\` ou \`comportements\` selon le contenu.

Si le PDF n\'est PAS un bilan BETL (autre test, page blanche, document non pertinent), retourne trancheAge='', nsc='', scoreOrthoVII='', ebaucheOrale='', comportements='', profilDiscours='', epreuves=[].`
