/**
 * Extraits de style et structures-types issus des CRBO humains de référence.
 *
 * Source : docs/Etudes de cas CRBO/exemple de CRBO[1-4].docx (Anne Frouard,
 * orthophoniste, EVALEO 6-15 essentiellement).
 *
 * Ces extraits sont à injecter dans le system prompt comme **références de
 * style** (pas pour copie verbatim). Ils ancrent les tournures, la
 * structure de chaque section, et la richesse clinique attendue dans un
 * CRBO produit par une orthophoniste expérimentée.
 */

export const STYLE_ANAMNESE = `## Style — Anamnèse rédigée (référence orthophonistes expertes)

L'anamnèse rédigée suit toujours une structure en bullet points (ou
paragraphes courts), couvrant les thèmes suivants dans cet ordre :

1. **Fratrie et antécédents familiaux** : place dans la fratrie + diagnostics
   ortho ou neurodéveloppementaux dans la famille (ex. "sa sœur aînée a été
   diagnostiquée dyscalculique").
2. **Histoire orthophonique personnelle** : PEC antérieures, leur durée,
   diagnostics posés (ex. "XYZ a été suivi en orthophonie de 6 à 9 ans.
   Diagnostic alors posé de dyslexie / dysorthographie.").
3. **Antécédents médicaux** : vision, audition, ORL, neurologique
   (ex. "Au niveau médical, on ne note pas de trouble particulier. La vue
   a été contrôlée plusieurs fois et les résultats étaient satisfaisants.
   Un bilan d'audiométrie a été effectué et n'a rien détecté.").
4. **Contexte scolaire actuel** : niveau, adaptations en cours, plainte de
   l'enseignant ou de la famille (ex. "Des adaptations sont mises en place
   spontanément au collège par ses professeurs, mais face à ses grandes
   difficultés pour déchiffrer les mots, un nouveau bilan semble nécessaire
   afin que XYZ bénéficie de ces mêmes adaptations pour les examens.").
5. **Anamnèse spécifique selon le motif** : pour les adultes/seniors,
   inclure profession, plainte cognitive subjective, contexte de l'entourage.

Règles de style :
- Phrase synthétique, **ton clinique et factuel** (jamais émotionnel).
- Citation entre guillemets quand on rapporte les propos de la famille.
- Garder les **dates précises** (mois/année des premiers signes) si fournies.
- Pas de redondance avec le motif (ne pas répéter ce qui y figure déjà).
- 5-8 lignes max par paragraphe. Total anamnèse : 20-40 lignes.
`

export const STYLE_DOMAIN_COMMENTAIRE = `## Style — Commentaire par épreuve / domaine (référence orthophonistes expertes)

Pour chaque épreuve, le commentaire suit un PATTERN constant :

1. **Phrase descriptive** des scores observés (factuelle, sans interprétation) :
   > "[Prénom] obtient un score de X, ce qui le situe dans la zone Y, pour un
   > temps de Z (classe W)."

2. **Interprétation clinique** courte, en lien avec ce que mesure l'épreuve :
   > "Le déchiffrage est donc à la fois lent et imprécis."
   > "Le lexique orthographique est insuffisamment constitué."
   > "La correspondance phonographique n'est pas efficiente."

3. **Détails qualitatifs observés** (si pertinent) :
   > "On observe une méconnaissance de la valeur des lettres J et Y et les
   > graphies complexes ne sont pas maîtrisées (oin, ian, ion)."
   > "Aucun pseudo-mot ne peut être transcrit de façon phonétique."

4. **Pour les épreuves multi-sous-scores** (ex. effets en lecture, dictée),
   décomposer en bullets numérotés :
   > "On observe différents effets :
   >   - Effet fréquence : classe 1 : ...
   >   - Effet consistance : classe 7 : ...
   >   - Effet longueur : score classe 6, temps classe 1 : ..."

5. **Phrase de synthèse / impact** à la fin du domaine (PAS de chaque épreuve) :
   > "[Prénom] présente donc un trouble du langage oral portant à la fois sur
   > le lexique (stock réduit + accès difficile) et sur la morphosyntaxe en
   > production."

Règles de style :
- **Lecture** : toujours mentionner les voies (adressage / assemblage) et les
  effets observés (fréquence, consistance, longueur, lexicalité).
- **Orthographe** : distinguer atteintes linguistique / lexicale / morphologique.
- **Pragmatique / sémantique** : citer les comportements observés (utilisation
  de mots passe-partout, périphrases, manque du mot).
- Garder une **dimension qualitative** dans chaque commentaire, jamais
  uniquement quantitative.
- Évoquer la **fatigabilité** ou les comportements parasites si observés
  (ex. "XYZ s'énerve et me dit 'ça me saoule, je laisse tomber'.").
`

export const STYLE_DIAGNOSTIC = `## Style — Diagnostic orthophonique (forme juridique recommandée)

### Forme juridique formelle (à utiliser sauf consigne contraire)

> "Conformément au décret n°2002-721 du JO du 4 mai 2002 rendant le
> diagnostic orthophonique obligatoire et en référence aux classifications
> internationales en cours (DSM-V / CIM-10), le bilan orthophonique réalisé
> ce jour met en évidence un [type de trouble principal] objectivé par un
> retentissement notable sur les apprentissages et par l'obtention de
> résultats affaiblis/déficitaires lors de la passation d'épreuves
> standardisées."

### Caractérisation du trouble (à structurer en bullets)

Après la phrase juridique, lister :
- **Caractérisation du trouble principal** :
  > "Ce trouble spécifique du langage écrit se caractérise par :
  >   - Une dyslexie sévère touchant les 2 voies de lecture : utilise
  >     systématiquement la voie d'adressage pour compenser la voie
  >     d'assemblage défaillante, mais le stock lexical est réduit.
  >   - Une dysorthographie mixte massive : atteintes linguistique, lexicale
  >     et grammaticale."

- **Explication étiologique linguistique** (jamais étiologique médicale) :
  > "Ce trouble spécifique du langage écrit s'explique par :
  >   - Un trouble phonologique et mnésique
  >   - Un trouble visuo-attentionnel"

### Forme courte / synthétique (quand format = synthétique)

Une phrase unique au format imposé :
> "Trouble spécifique des apprentissages en langage écrit (communément appelé
> dyslexie-dysorthographie), forme [légère / modérée / sévère / compensée]."

### Règles de style absolues

- **JAMAIS de codes F80, F81, F82** (CIM-10) ni de chiffres détaillés DSM-5
  dans le diagnostic — ces codes sont médicaux et n'engagent pas
  l'orthophoniste.
- **TOUJOURS préciser le sous-type** (phonologique / surface / mixte /
  compensée) quand pertinent.
- **TOUJOURS préciser la sévérité** (légère / moyenne / grave) selon les
  critères DSM-5 (cf. knowledge/dsm5-criteria.ts).
- Pour les screenings (MoCA), titre **"Hypothèse de diagnostic"** au lieu de
  "Diagnostic", et modalisation systématique ("compatible avec…", "à
  confirmer en bilan neuropsychologique approfondi").
- Pour les adultes (PrediFex, PREDIMEM, PrediLac, BECD, BIA), **JAMAIS
  d'étiologie médicale** (Alzheimer, AVC, démence, Parkinson…) — relève du
  neurologue. Toujours formuler en "profil compatible avec…".
`

export const STYLE_PROJET_THERAPEUTIQUE = `## Style — Projet thérapeutique (référence orthophonistes expertes)

Le projet thérapeutique a une structure constante :

### En format Complet (4-6 pages)

> "Une prise en charge orthophonique doit également se mettre en place. Nous
> proposons à [Prénom] :
>   - **Une séance individuelle hebdomadaire (30 AMO 12,1)** afin de
>     travailler l'accès aux représentations sémantiques et lexicales
>     (exercice d'évocation, de fluence sémantique ou phonologique) ainsi que
>     la morphologie (flexionnelle, dérivationnelle).
>   - **Une séance hebdomadaire au sein d'un groupe (30 AMO 5)** d'adolescents
>     présentant des troubles spécifiques du langage écrit afin d'aider à
>     développer ses stratégies de compensation."

### En format Synthétique (2-3 pages — style Laurie)

Deux phrases EXACTEMENT, séparées par un saut de ligne :
1. **Phrase 1 — soin orthophonique** :
   > "Une prise en soin orthophonique est indiquée afin de [objectifs
   > thérapeutiques principaux selon le profil]."
2. **Phrase 2 — aménagements scolaires** :
   > "Des aménagements pédagogiques doivent être mis en place afin de
   > limiter l'impact de [difficultés principales] en situation scolaire."

### Codification AMO (Nomenclature Générale des Actes Professionnels)

Mentionner le code AMO dans les recommandations quand pertinent :
- **30 AMO 12,1** : bilan + suivi des troubles spécifiques du langage écrit
  (séance individuelle).
- **30 AMO 5** : séance individuelle de rééducation orthophonique standard.
- **30 AMO 5,2** : rééducation des troubles de la fluidité de la parole.
- **15 AMO 12,2** : groupe / atelier d'orthophonie.

(Ne pas inventer un code AMO — vérifier la nomenclature en vigueur si
incertain.)

### Aménagements pédagogiques

Pour la section aménagements, proposer selon le profil :
- **PAP (Plan d'Accompagnement Personnalisé)** : standard pour dyslexie
  légère/moyenne. Aménagements pédagogiques sans reconnaissance MDPH.
- **PPS (Projet Personnalisé de Scolarisation, via MDPH)** : pour les
  troubles sévères, comorbidités, ou besoin d'AESH / ULIS.
- **PPRE (Programme Personnalisé de Réussite Éducative)** : pour les
  difficultés non encore diagnostiquées (en attente de bilan complet).
- Aménagements types : tiers-temps majoré 1/3, calculatrice, ordinateur,
  sujet agrandi, dispense notation orthographique en langues étrangères,
  secrétaire-correcteur en cas de difficultés sévères.

### Examens complémentaires (section finale)

Quand pertinent :
> "Un bilan psychométrique et neuropsychologique nous semble nécessaire :
> celui-ci est généralement demandé lors de la mise en place d'un PAP afin de
> s'assurer d'une efficience intellectuelle conforme à son âge."

> "Un bilan orthoptique neurovisuel serait souhaitable."
`

export const STYLE_OVERALL_STRUCTURE = `## Structure-type d'un CRBO (référence Anne Frouard / EVALEO 6-15)

L'ordre des sections dans un CRBO complet :

1. **En-tête cabinet** (nom, adresse, téléphone) — généré par ortho.ia depuis profil.
2. **Titre** : "Compte-rendu de bilan orthophonique [initial] de [Nom] né(e) le [date] ([âge])".
3. **Renseignements administratifs** : assuré, dates bilan/prescription, médecin prescripteur, niveau scolaire.
4. **Motif** (1 paragraphe court — demande de qui ? quels signes ?).
5. **Anamnèse** (bullets, 5 thèmes — cf. STYLE_ANAMNESE).
6. **Domaines explorés** (sommaire des épreuves prévues, structurées par
   composante + hypothèses explicatives).
7. **Batterie utilisée** (nom complet du test + auteurs + éditeur + année).
8. **Échelle / convention de scores** (ex. 7 classes EVALEO ou 6 zones Exalang).
9. **Résultats par section** (Langage écrit, Langage oral, Autres), épreuve par
   épreuve avec interprétation et phrase de synthèse par sous-domaine.
10. **Hypothèses explicatives** : structure en questions cliniques
    ("Existe-t-il un trouble du langage oral ?", "Existe-t-il un trouble
    phonologique ?", "Existe-t-il un trouble visuo-attentionnel ?").
11. **Diagnostic orthophonique** : forme juridique + caractérisation +
    explication linguistique (cf. STYLE_DIAGNOSTIC).
12. **Projet thérapeutique** : PEC + aménagements + codes AMO (cf.
    STYLE_PROJET_THERAPEUTIQUE).
13. **Examens complémentaires** : bilans pluridisciplinaires à demander
    (psychométrique, neurovisuel, ORL, etc.).
14. **Conclusion / mention médico-légale** (en italique).

### Tons et registres

- Ton clinique et factuel, jamais émotionnel.
- 3e personne pour le patient ("XYZ", "le patient", "[Prénom]").
- 1re personne du pluriel pour l'orthophoniste ("nous proposons", "nous
  préconisons", "nous observons") — pluriel professionnel.
- Pas d'em-dash (—) entre 2 propositions (règle ortho.ia) — remplacer par
  virgule ou tiret simple.
- Pas de jargon non explicité (le CRBO est lu par le médecin ET la famille).
- **PAS de jugement** sur l'enfant ou sa famille (ne pas écrire "comportement
  problématique" — préférer "comportement d'opposition observé en séance").
`
