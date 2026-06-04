/**
 * Extraction PDF dediee Exalang 5-8 (Thibault, Helloin, Croteau — Orthomotus
 * 2010, devenu HappyNeuron Pro).
 *
 * Cible : rapport de cotation PDF produit par le logiciel HappyNeuron Pro
 * (export du module resultats), OU scan du cahier de passation rempli a
 * la main. La sortie est calibree pour pre-remplir directement le state
 * de components/forms/Exalang58ScoresInput.tsx :
 *  - niveau d'etalonnage (GSM / mi-CP / CP-CE1 / CE1-CE2 / autre)
 *  - 35 epreuves : percentile (8 bandes Exalang), note standard 1-5,
 *    score brut, temps, observation, non_passee
 *
 * Respecte la regle d'isolation CLAUDE.md : ce module est specifique a
 * Exalang 5-8, n'est ni reference ni utilise par les autres bilans. La
 * route /api/extract-exalang-5-8-pdf est l'unique consommateur.
 *
 * Source de structure : manuel officiel `docs/Bilans Sources/manuel
 * exalang 5-8.pdf`. 35 epreuves reparties en 7 modules.
 */

import type Anthropic from '@anthropic-ai/sdk'

/** Cles d'epreuves valides — DOIVENT matcher Exalang58ScoresInput.tsx
 *  (constante MODULES, e.key). Si tu modifies l'une, modifie l'autre. */
export const EXALANG58_EPREUVE_KEYS = [
  // M1 Langage oral
  'dessin_anime', 'denomination', 'comprehension_recit',
  'jugement_grammaticalite', 'comprehension_syntaxique',
  'fluence_semantique', 'metamorphologie',
  // M2 Phonologie
  'similarites_dissemblances', 'repetition_logatomes', 'fluence_phonemique',
  'comptage_syllabique', 'rimes', 'segmentation_fusion_syllabique',
  'inversion_phonemique',
  // M3 Traitement visuo-attentionnel
  'test_barrage', 'comparaison_serielle', 'completion_formes',
  'denomination_rapide',
  // M4 Entrees visuelle et auditive
  'figures_entremelees', 'loto_sonore',
  // M5 Memoire
  'empan_chiffres_endroit', 'chiffres_envers',
  'empan_mots_monosyllabiques', 'memoire_visuelle',
  'rappel_differe', 'rappel_differe_reconnaissance',
  // M6 Lecture
  'approche_implicite_lecture', 'syllabes_mots_mi_cp',
  'lecture_phrases_mi_cp', 'segmentation_mots',
  'lecture_logatomes', 'lecture_mots',
  'lecture_texte', 'lecture_texte_qcm',
  // M7 Orthographe
  'closure_mots', 'transcription_logatomes', 'texte_a_completer',
] as const

export type Exalang58EpreuveKey = typeof EXALANG58_EPREUVE_KEYS[number]

/** Sortie typee de l'extraction Exalang 5-8. */
export interface Exalang58Extracted {
  niveau: string  // '' | 'GSM' | 'mi_CP' | 'CP_CE1' | 'CE1_CE2' | 'autre'
  epreuves: Array<{
    key: string  // Exalang58EpreuveKey
    /** Bande de percentile affichee par Exalang : >P95 / P91-P95 / P76-P90 /
     *  P50-P75 / P26-P49 / P11-P25 / P6-P10 / P1-P5. Vide si non determinable. */
    percentile: string
    /** Note Standard officielle Exalang 5-8 (manuel p. 13-15). Vide si non
     *  affichee dans le rapport. */
    note_standard: string  // '' | 'ns_1' | 'ns_2' | 'ns_3' | 'ns_4' | 'ns_5'
    score_brut: string
    temps: string
    observation: string
    non_passee: boolean
  }>
}

/** Schema Anthropic tool_use pour forcer Claude a sortir le JSON structure. */
export const EXALANG58_EXTRACT_TOOL: Anthropic.Tool = {
  name: 'extract_exalang_5_8_results',
  description: 'Extrait les resultats d\'un bilan Exalang 5-8 depuis un rapport PDF du logiciel HappyNeuron Pro (module resultats) ou un scan du cahier de passation rempli a la main. Retourne le niveau d\'etalonnage et les scores par epreuve avec percentile, note standard, score brut, temps et observation.',
  input_schema: {
    type: 'object',
    properties: {
      niveau: {
        type: 'string',
        enum: ['', 'GSM', 'mi_CP', 'CP_CE1', 'CE1_CE2', 'autre'],
        description: 'Niveau d\'etalonnage Exalang 5-8 au moment de la passation. Mapping : "GSM" / "Grande Section" / "fin maternelle" → GSM. "mi-CP" / "CP T2" / "milieu CP" → mi_CP. "CP-CE1" / "fin CP" / "fin de CP" → CP_CE1. "CE1-CE2" / "fin CE1" / "fin de CE1" → CE1_CE2. "Autre" si le rapport indique explicitement une comparaison hors-borne. Vide si non determinable.',
      },
      epreuves: {
        type: 'array',
        description: 'Une entree par epreuve passee. Ne PAS inclure les epreuves non passees ou absentes du PDF — uniquement celles avec au moins une donnee chiffree ou qualitative.',
        items: {
          type: 'object',
          properties: {
            key: {
              type: 'string',
              enum: [...EXALANG58_EPREUVE_KEYS],
              description: 'Cle technique de l\'epreuve. DOIT matcher la liste fournie.',
            },
            percentile: {
              type: 'string',
              enum: ['', 'p_sup_95', 'p_90_95', 'p_75_90', 'p_50_75', 'p_25_50', 'p_10_25', 'p_5_10', 'p_inf_5'],
              description: 'Bande de percentile affichee par Exalang (manuel p. 12). Mapping :\n- Score < valeur P5 → p_inf_5 ("P1 — P5", Difficulte severe)\n- P5 ≤ score < P10 → p_5_10 ("P6 — P10", Difficulte)\n- P10 ≤ score < Q1 → p_10_25 ("P11 — P25", Zone de fragilite). \n- Q1 ≤ score < Med → p_25_50 ("P26 — P49", Moyenne basse)\n- Med ≤ score < Q3 → p_50_75 ("P50 — P75", Moyenne haute)\n- Q3 ≤ score < P90 → p_75_90 ("P76 — P90", Excellent moitie basse)\n- P90 ≤ score < P95 → p_90_95 ("P91 — P95", Excellent moitie haute)\n- Score ≥ P95 → p_sup_95 ("> P95", Tres superieur)\n\nLe rapport Exalang affiche typiquement ces bandes par etiquette (P5, P10, Q1, Med, Q3, P90, P95, > P95) ou par marqueur sur une barre coloree. **NE PAS recalculer depuis l\'ecart-type** — les normes etalonnees du test priment. Si seul un percentile chiffre est donne, le mapper sur la bande correspondante.',
            },
            note_standard: {
              type: 'string',
              enum: ['', 'ns_1', 'ns_2', 'ns_3', 'ns_4', 'ns_5'],
              description: 'Note Standard officielle Exalang 5-8 (manuel p. 13-15). Echelle a 5 classes : NS 1 (6,7 % les plus faibles, z < -1.5, Pathologique), NS 2 (24,2 %, z -1.5 a -0.5, Faible), NS 3 (38,2 % centraux, z -0.5 a +0.5, Moyenne), NS 4 (24,2 %, z +0.5 a +1.5, Superieur), NS 5 (6,7 % les plus eleves, z > +1.5, Tres superieur). Le rapport l\'affiche en parallele du percentile pour certaines epreuves (saturation possible : classes 4-5 confondues sur certaines epreuves). Recopier la NS lue. Vide si non determinable ou non calculable pour l\'epreuve.',
            },
            score_brut: { type: 'string', description: 'Score brut tel qu\'affiche, format libre (ex. "18/22", "12", "8/45"). Recopier verbatim depuis le rapport. Vide si absent. Le denominateur "/N" est specifique a chaque epreuve (cf. references Exalang : Dessin animé /22, Denomination /44, Comprehension de recit /5, Jugement grammaticalite /16, Comprehension syntaxique /12, Comptage syllabique /10, Approche implicite /22, Syllabes et mots mi-CP /45...).' },
            temps: { type: 'string', description: 'Temps en secondes pour les epreuves chronometrees (Fluence semantique 1 min, Fluence phonemique 1 min, Test de barrage, Denomination rapide, Lecture de mots 2 min, Lecture de texte). Format libre (ex. "60s", "120 sec.", "45"). Vide si absent.' },
            observation:{ type: 'string', description: 'Annotations qualitatives associees a cette epreuve, recopier verbatim : analyse articulatoire qualitative (Denomination — paraphasies, deformations systematiques), tableau qualitatif Lecture de mots (mots vs non-mots / courts vs longs / reguliers vs irreguliers), analyse typologique (Closure de mots / Texte a completer — erreurs phonologiques vs lexicales vs grammaticales), stratégies observees, attitudes (anxiete sur chronos, fatigabilite, decouragement), erreurs notees dans la marge ("saute des lignes", "confusion b/d", "decode syllabe par syllabe"). C\'est crucial : Exalang 5-8 a le flag `showAllEpreuveComments` actif, donc TOUTES les observations remontent dans le rapport Word (pas seulement celles des epreuves fragiles). Vide si vraiment absente.' },
            non_passee: { type: 'boolean', description: 'true si l\'epreuve est explicitement marquee "non passee" / "NP" / "NT" / "X" / "-" / non applicable a ce niveau. Defaut false. Note : certaines epreuves sont par construction non significatives avant fin CP (Segmentation-fusion syllabique, Inversion phonemique) — si le PDF montre des resultats pour ces epreuves en GSM ou mi-CP, recopier quand meme les scores mais signaler dans `observation`.' },
          },
          required: ['key', 'percentile', 'note_standard', 'score_brut', 'temps', 'observation', 'non_passee'],
        },
      },
    },
    required: ['niveau', 'epreuves'],
  },
}

/**
 * Prompt systeme dedie a l'extraction Exalang 5-8.
 *
 * Cale sur deux formats sources :
 *  1. Rapport informatise HappyNeuron Pro : tableau du module resultats avec
 *     score brut, ecart-type, percentile (P5/P10/Q1/Med/Q3/P90/P95/>P95) et
 *     Note Standard (1-5).
 *  2. Scan du cahier de passation rempli a la main : tableau de l'examinateur
 *     avec scores bruts notes, observations qualitatives en marge.
 */
export const EXALANG58_EXTRACT_PROMPT = `Tu es un expert en extraction de donnees de bilans orthophoniques Exalang 5-8
(Thibault, Helloin, Croteau — Orthomotus 2010, devenu HappyNeuron Pro). Tu
recois soit un rapport informatise du module resultats HappyNeuron Pro, soit
un scan du cahier de passation rempli a la main, soit un document Word/PDF
contenant les resultats d'un bilan Exalang 5-8.

# OBJECTIF

Extraire les donnees brutes du bilan pour pre-remplir le formulaire de saisie
ortho.ia. **N'INVENTE RIEN.** Si une donnee n'est pas presente dans le document,
laisse le champ vide ('' ou false selon le type). Mieux vaut un champ vide
qu'une hallucination.

Tu DOIS appeler l'outil \`extract_exalang_5_8_results\` pour retourner ta sortie.
N'ecris aucun texte hors de l'appel d'outil.

# 1. NIVEAU D'ETALONNAGE

Cherche dans l'en-tete du rapport (page 1 ou 2) le niveau d'etalonnage choisi
ou la classe de l'enfant. Mappe-la sur les codes ortho.ia :
- "GSM" / "Grande Section" / "fin de maternelle" / "Grande Section maternelle" → \`GSM\`
- "mi-CP" / "CP T2" / "milieu CP" / "CP 2eme trimestre" → \`mi_CP\`
- "CP-CE1" / "fin de CP" / "CP T3" / "CP 3eme trimestre" → \`CP_CE1\`
- "CE1-CE2" / "fin de CE1" / "CE1" tout court (sans precision T) → \`CE1_CE2\`
- "Autre" si le rapport precise explicitement une comparaison hors-borne
  (ex. "comparaison niveau CE1 pour patient de CM1") → \`autre\`

Si la classe n'est pas claire : laisser \`niveau=''\` (NE PAS deviner).

# 2. EPREUVES — 35 epreuves officielles, 7 modules

Pour CHAQUE epreuve passee dans le PDF, creer une entree avec sa cle exacte.
Mapping des libelles du PDF sur les cles :

## Module 1 — Langage oral
- "Dessin animé" → \`dessin_anime\`
- "Dénomination" → \`denomination\`
- "Compréhension de récit" / "Mélina la Sorcière" → \`comprehension_recit\`
- "Jugement de grammaticalité" → \`jugement_grammaticalite\`
- "Compréhension syntaxique" → \`comprehension_syntaxique\`
- "Fluence sémantique" / "Fluence semantique (aliments)" → \`fluence_semantique\`
- "Métamorphologie" → \`metamorphologie\`

## Module 2 — Phonologie
- "Similarités - dissemblances" / "Similitudes-dissemblances" → \`similarites_dissemblances\`
- "Répétition de logatomes" → \`repetition_logatomes\`
- "Fluence phonémique" / "Fluence phonemique (/f/)" → \`fluence_phonemique\`
- "Comptage syllabique" / "Bataille des animaux" → \`comptage_syllabique\`
- "Rimes" → \`rimes\`
- "Segmentation - fusion syllabique" / "Segmentation/fusion" → \`segmentation_fusion_syllabique\`
- "Inversion phonémique" → \`inversion_phonemique\`

## Module 3 — Traitement visuo-attentionnel
- "Test de barrage" / "Barrage des vélos" → \`test_barrage\`
- "Comparaison sérielle" → \`comparaison_serielle\`
- "Complétion de formes" → \`completion_formes\`
- "Dénomination rapide" / "RAN" → \`denomination_rapide\`

## Module 4 — Entrees visuelle et auditive
- "Figures entremêlées" → \`figures_entremelees\`
- "Loto sonore" → \`loto_sonore\`

## Module 5 — Memoire
- "Empan de chiffres endroit" / "Empan endroit" → \`empan_chiffres_endroit\`
- "Chiffres à l'envers" / "Empan envers" / "Empan de chiffres envers" → \`chiffres_envers\`
- "Empan de mots monosyllabiques" / "Empan de mots" → \`empan_mots_monosyllabiques\`
- "Mémoire visuelle" → \`memoire_visuelle\`
- "Rappel différé" (sans mention reconnaissance) → \`rappel_differe\`
- "Rappel différé : reconnaissance" / "Reconnaissance" → \`rappel_differe_reconnaissance\`

## Module 6 — Lecture
- "Approche implicite de la lecture" / "Approche implicite" → \`approche_implicite_lecture\`
- "Syllabes et mots mi-CP" / "Syllabes et mots MI-CP" → \`syllabes_mots_mi_cp\`
- "Lecture de phrases mi-CP" → \`lecture_phrases_mi_cp\`
- "Segmentation de mots" → \`segmentation_mots\`
- "Lecture de logatomes" → \`lecture_logatomes\`
- "Lecture de mots" (sans mention texte ou QCM) → \`lecture_mots\`
- "Lecture de texte" (niveau A ou B) → \`lecture_texte\`
- "Lecture de texte — QCM" / "Lecture de texte QCM" / "QCM compréhension" → \`lecture_texte_qcm\`

## Module 7 — Orthographe
- "Closure de mots" (niveau A ou A+B) → \`closure_mots\`
- "Transcription de logatomes" → \`transcription_logatomes\`
- "Texte à compléter" (niveau A ou A+B) → \`texte_a_completer\`

Si une epreuve ne matche AUCUNE cle de l'enum, NE PAS la creer (l'enum est strict).

# 3. PERCENTILE — bandes officielles Exalang

Recopier la bande de percentile affichee par le logiciel HappyNeuron Pro
(manuel p. 12). Logique d'affichage :

- Score < valeur P5 → \`p_inf_5\` ("P1 — P5", Difficulte severe rouge)
- P5 ≤ score < P10 → \`p_5_10\` ("P6 — P10", Difficulte orange fonce)
- P10 ≤ score < Q1 → \`p_10_25\` ("P11 — P25", Zone de fragilite orange clair)
- Q1 ≤ score < Med → \`p_25_50\` ("P26 — P49", Moyenne basse jaune)
- Med ≤ score < Q3 → \`p_50_75\` ("P50 — P75", Moyenne haute vert clair)
- Q3 ≤ score < P90 → \`p_75_90\` ("P76 — P90", Excellent vert)
- P90 ≤ score < P95 → \`p_90_95\` ("P91 — P95", Excellent vert fonce)
- Score ≥ P95 → \`p_sup_95\` ("> P95", Tres superieur)

Le rapport Exalang peut afficher la bande sous forme d'etiquette texte (P5,
P10, Q1, Med, Q3, P90, P95, > P95) ou via une barre coloree. Tous ces formats
mappent sur les 8 codes ci-dessus.

⚠️ **NE JAMAIS recalculer un percentile depuis l'ecart-type**. Les normes
etalonnees du test priment sur la distribution gaussienne theorique. Exemple
piege : "Boucle phonologique É-T -1.53, Q1" → percentile = Q1 → \`p_10_25\`
("P11 — P25", Zone de fragilite). PAS \`p_inf_5\` comme le suggererait l'É-T.

⚠️ Q1 = P25 = ZONE DE FRAGILITE, jamais "Difficulte". Bornes inclusives.

# 4. NOTE STANDARD (NS 1-5) — systeme officiel Exalang

Le manuel Exalang 5-8 affiche pour certaines epreuves une Note Standard
sur 5 classes (z = ±0.5, ±1.5) en parallele du percentile. Mapping :

- "NS 1" / "Note Standard 1" / "classe 1" / "L1" → \`ns_1\` (6,7 % les plus faibles, Pathologique)
- "NS 2" / "classe 2" / "L2" → \`ns_2\` (24,2 % suivants, Faible)
- "NS 3" / "classe 3" / "L3" → \`ns_3\` (38,2 % centraux, Moyenne attendue)
- "NS 4" / "classe 4" / "L4" → \`ns_4\` (24,2 %, Superieur)
- "NS 5" / "classe 5" / "L5" → \`ns_5\` (6,7 % les plus eleves, Tres superieur)

⚠️ **Saturation**: pour certaines epreuves, les classes 4 et 5 (voire 3-4-5)
sont confondues. Le rapport affichera alors une note plafonnee L4 max. C'est
normal — recopie la NS lue, n'extrapole pas.

⚠️ NE PAS deduire la NS depuis le percentile (et inversement). Le manuel
les calcule independamment via des formules differentes. Si seule l'une des
deux est affichee, laisse l'autre vide.

# 5. SCORE BRUT, TEMPS, OBSERVATION

**score_brut** : tel qu'affiche, format libre. Ex. "18/22", "12", "0/5".

🔒 **VALIDATION DENOMINATEUR — Exalang 5-8 cibles** :
- Dessin animé : **/22** (cohérence + cohésion)
- Dénomination : **/44**
- Compréhension de récit : **/5** (remise en ordre 0-2 + reformulation + question ouverte)
- Jugement de grammaticalité : **/16**
- Compréhension syntaxique : **/12**
- Comptage syllabique : **/10**
- Rimes : **/18** (4 categories : /i/, /on/, /o/, /l/)
- Approche implicite de la lecture : **/22**
- Syllabes et mots mi-CP : **/45**
- Lecture de phrases mi-CP : **/80**
- Répétition de logatomes : **/24**
- Closure de mots niveau A : **/9** ; niveau A+B : **/18**

Si tu lis un denominateur DIFFERENT pour ces epreuves, c'est probablement
une erreur de Vision (OCR). Verifie 2 fois avant de recopier un denominateur
non standard.

**temps** : en secondes. Format libre. Vide si l'epreuve n'est pas chronometree
ou si le temps n'est pas affiche. Epreuves chronometrees :
- Fluence sémantique : 1 min
- Fluence phonémique : 1 min
- Test de barrage : temps de realisation
- Dénomination rapide : temps de denomination
- Lecture de mots : 2 min
- Lecture de texte : temps de lecture complete

**observation** : recopie integralement toutes les annotations qualitatives
trouvees dans le PDF. Sources a parcourir systematiquement :

1. **Marge du tableau de cotation** : "saute des lignes", "confusion b/d",
   "decode lentement", "anxiete sur chronos", "stratégie de devinette".
2. **Sections "Observations" / "Commentaires" / "Notes ortho"** : a la fin
   d'une epreuve ou regroupees en bas de page.
3. **Tableau qualitatif Lecture de mots** : Exalang fournit une grille
   mots/non-mots, courts/longs, reguliers/irreguliers. Si elle est remplie,
   resume-la dans observation ("8 mots reguliers sur 10, 2 erreurs sur
   logatomes longs, voie d'adressage privilegiee").
4. **Analyse qualitative Denomination** : types d'erreurs articulatoires
   (paraphasies, deformations systematiques, troubles de sortie).
5. **Analyse typologique Closure de mots / Texte a completer** : erreurs
   phonologiques vs lexicales vs grammaticales (manuel p. 42-44).
6. **Strategies observees** : decodage segment par segment, devinette,
   recours au contexte, relecture finale.

🔒 **REGLE CRITIQUE** : le rendu Word Exalang 5-8 affiche desormais TOUS les
commentaires d'epreuve non vides (registry \`showAllEpreuveComments: true\`),
pas seulement ceux des epreuves fragiles. Donc chaque annotation que tu
trouves dans le PDF doit etre recopiee dans \`observation\` — sinon elle se
perd a l'export Word.

**non_passee** : true uniquement si explicitement marque "NP" / "non passee" /
"non realisee" / "NT" / "—" / "X" / "non applicable". Note : pour les epreuves
"non significatives avant fin CP" (Segmentation-fusion syllabique, Inversion
phonemique), si le rapport montre des scores en GSM ou mi-CP, recopier quand
meme les scores avec un commentaire dans \`observation\`.

# 6. PRINCIPES GENERAUX

- **Conservateur** : si un doute, laisser vide. L'ortho corrigera dans le form.
- **Pas d'invention** : zero champ rempli par defaut ou par interpolation.
- **Format strict** : respecter les enums (sinon le form rejette).
- **Une entree par epreuve** : ne pas dupliquer.
- **Pas d'epreuve absente** : si une epreuve n'est pas dans le PDF, ne PAS
  l'inclure dans le tableau.

Si le PDF n'est PAS un bilan Exalang 5-8 (autre test, page blanche, document
non pertinent), retourne niveau='', epreuves=[].`
