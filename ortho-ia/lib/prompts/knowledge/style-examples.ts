/**
 * Extraits de style et structures-types issus des CRBO humains de référence.
 *
 * Sources :
 * - docs/Etudes de cas CRBO/exemple de CRBO[1-4].docx (Anne Frouard,
 *   orthophoniste, EVALEO 6-15 essentiellement, langage écrit/oral pédiatrique
 *   + adulte).
 * - docs/Etudes de cas CRBO/EXEMPLE b_cm.docx, Ex CR Bilan CM juillet 2018.docx,
 *   modèle CR.docx (Elsa DALL'AGNOL, orthophoniste, B-CM / B-LM2 / TEDI-MATH /
 *   ZAREKI-R / Examath, cognition mathématique pédiatrique).
 *
 * Ces extraits sont à injecter dans le system prompt comme **références de
 * style** (pas pour copie verbatim). Ils ancrent les tournures, la
 * structure de chaque section, et la richesse clinique attendue dans un
 * CRBO produit par une orthophoniste expérimentée.
 *
 * Deux traditions stylistiques cohabitent :
 * - Anne Frouard, EVALEO 6-15, ton clinique concis, structure en questions
 *   explicatives ("Existe-t-il un trouble [X] ?"), pas de mention juridique
 *   en tête.
 * - Elsa DALL'AGNOL, cognition mathématique, ton formel avec mention juridique
 *   systématique (Article 226-13 Code Pénal + L1110-4 CSP), tableau DSM-5
 *   cochable A.1 à A.6, mention NGAP verbatim (pas de code AMO chiffré pour
 *   le math), phrase de clôture standard.
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

### Comportement observé en séance (référence Anne Frouard, Elsa DALL'AGNOL)

À CHAQUE CRBO, intégrer **au moins une phrase d'observation comportementale**
qui décrit l'attitude du patient face aux épreuves, sa métacognition, sa
fatigabilité, ou ses stratégies de coping. Ces observations sont **fournies
par l'orthophoniste dans sa saisie libre** (textarea "Observations" ou
"Notes de séance") et doivent être reprises VERBATIM dans la prose, pas
inventées.

Patterns observés dans les CRBO de référence :

> "Tout au long du bilan, [Prénom] s'est montré coopératif, travaillant
> consciencieusement, en écoutant bien les consignes."

> "[Prénom] ne demande pas spontanément d'explications supplémentaires en
> cas d'incompréhension car il ne semble pas être conscient des échecs."

> "On remarque des signes d'agacement et d'anxiété (jambe qui bat sous la
> table, gribouillis dans le coin de la feuille, soupirs)."

> "[Prénom] s'auto-corrige fréquemment, ce qui le ralentit mais témoigne
> d'une vigilance orthographique préservée."

> "[Prénom] s'énerve et nous dit « ça me saoule, je laisse tomber », il
> est alors nécessaire de réduire la durée de la séance."

🔑 **Règle** : la phrase d'observation comportementale se place soit dans
le commentaire de domaine pertinent (ex. après une épreuve où le
comportement a été marquant), soit en synthèse avant le diagnostic. Elle
ancre cliniquement le bilan dans la réalité de la séance, au-delà des
seuls scores chiffrés. Si l'ortho n'a pas saisi d'observation libre, ne
PAS inventer ce contenu.

### Diagnostic secondaire avec orientation immédiate (référence Elsa DALL'AGNOL)

Quand le bilan met en évidence un trouble **secondaire** à une autre
pathologie suspectée (ex. dyscalculie secondaire à un trouble du langage
écrit, dyslexie secondaire à une fragilité métaphonologique), le
diagnostic doit nommer la **cascade étiologique** ET **promettre un bilan
complémentaire** dans le même paragraphe. Pattern :

> "[Prénom] présente un tableau de [trouble principal] qui semble
> **secondaire à** [trouble sous-jacent suspecté]. **Un bilan
> orthophonique [du langage écrit / cognitif / etc.] va lui être proposé
> [à la rentrée de septembre / dans le mois / à l'issue de la PEC
> actuelle]**. En attendant, il convient de proposer à [Prénom] une prise
> en charge des difficultés [actuellement objectivées]."

Exemples authentiques :
- Elsa, L (B-CM CE1) : *"L présente un tableau de trouble des apprentissages
  des mathématiques qui semble secondaire à des difficultés de langage écrit
  et des difficultés exécutives. Un bilan orthophonique du Langage Écrit va
  lui être proposé à la rentrée de septembre."*

🔑 **Règle** : la mention "secondaire à" doit toujours être suivie de
l'orientation immédiate vers le bilan complémentaire approprié. Pas de
wait-and-see. Le CRBO ortho.ia ne doit JAMAIS laisser un trouble
secondaire suspecté sans plan d'investigation concret.

### Citation d'erreur verbatim (référence Anne Frouard, Bruwier, Elsa)

Quand l'orthophoniste a fourni des erreurs précises dans sa saisie (épreuves
de dictée, dénomination, jugement orthographique, métaphonologie), **reproduire
l'exemple textuel** dans le commentaire d'épreuve avec le pattern :

> ex. : « cible attendue » → « production patient »

Exemples authentiques tirés des CRBO de référence :
- Dictée : *"ex. : « car » écrit « quarre », « boîte en fer » écrit « boite enver »"*
- Création de néologismes : *"ex. : « un barrideur est celui qui … embarride » (réponse attendue : barride)"*
- Compréhension : *"ex. : « Il la lui montre » → Yaelle indique « il les lui montre »"*
- Désignation : *"ex. : « lavabo » → Yaelle désigne lavabo ET robinet"*
- Comportement face à l'épreuve : *"XYZ s'énerve et me dit 'ça me saoule, je laisse tomber'"*

🔑 **Règle** : si l'ortho a saisi des exemples concrets, les inclure VERBATIM
dans la prose avec guillemets français («  »). N'inventer JAMAIS d'erreurs
non rapportées par l'ortho. Si aucun exemple n'est fourni, ne pas ajouter de
"ex." factice.
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

export const STYLE_MENTION_JURIDIQUE = `## Style, Mention juridique en tête de CRBO (référence Elsa DALL'AGNOL, math)

Pour les bilans de **cognition mathématique** (Examath, B-CM, B-CMado), une
mention juridique en tête du document est attendue, juste avant le motif de
consultation. Pour les bilans **langage** (EVALEO, Exalang), cette mention
n'est pas dans le style Anne Frouard, donc à ne pas ajouter sauf demande
explicite.

Quand elle est demandée, format exact :

> Compte-rendu remis à leur demande à M./Mme [...] pour faire valoir ce que
> de droit. La divulgation de ce document à des tierces personnes engage
> leur responsabilité.
>
> Article 226-13 du Code Pénal : « La révélation d'une information à caractère
> secret par une personne qui en est dépositaire soit par état ou par
> profession, soit en raison d'une fonction ou d'une mission temporaire, est
> punie d'un an d'emprisonnement et de 15 000 euros d'amende. »
>
> Article L1110-4 du Code de Santé Publique : « Le fait d'obtenir ou de tenter
> d'obtenir la communication de ces informations en violation du présent
> article est puni d'un an d'emprisonnement et de 15 000 euros d'amende. »

Cette mention rappelle le secret médical et l'engagement de responsabilité
du destinataire. Elle protège juridiquement l'orthophoniste et alerte la
famille sur la nature confidentielle du document.

🔒 **Règle** : insérer ce bloc UNIQUEMENT si le bilan utilise un test de
cognition mathématique (Examath / B-CM / B-CMado / BECD). Pour les bilans
langage, ne pas l'ajouter, c'est hors style Anne Frouard.
`

export const STYLE_DSM5_CHECKBOX = `## Style, Tableau DSM-5 cochable dans le diagnostic (référence Elsa DALL'AGNOL)

Pour les troubles spécifiques des apprentissages (dyslexie, dysorthographie,
dyscalculie), Elsa DALL'AGNOL ancre systématiquement le diagnostic sur les
**critères DSM-5 cochés**. C'est une pratique clinique rigoureuse à reprendre
dans les CRBO ortho.ia, particulièrement pour les bilans pédiatriques.

Format type :

> Selon le DSM-5, [Prénom] présente un tableau de Trouble Spécifique des
> Apprentissages [avec déficit en X] :
>
> **A.** Difficulté à apprendre et à utiliser les aptitudes académiques,
> comme indiqué par la présence depuis au moins 6 mois d'au moins un des
> symptômes suivants :
>
> - ☑ 1. Lecture de mots inexacte, lente ou laborieuse
> - ☐ 2. Difficultés à comprendre la signification de ce qui est lu (même si lu correctement)
> - ☑ 3. Difficultés d'orthographe
> - ☑ 4. Difficultés dans l'expression écrite (erreurs de ponctuation ou grammaticales, manque de clarté de l'expression des idées)
> - ☐ 5. Difficultés à maîtriser le sens des nombres, les faits numériques, les données chiffrées ou le calcul
> - ☐ 6. Difficultés dans le raisonnement mathématique
>
> **B.** Significativement en-dessous de ceux attendus pour l'âge et
> interfère significativement avec les performances académiques ou les
> occupations.
>
> **C.** Commence durant les années d'école mais peut n'être manifeste que
> dès lors que les demandes excèdent les capacités limitées de l'individu.
>
> **D.** Pas mieux expliquées par déficience intellectuelle, acuité auditive
> ou visuelle non corrigée, autres troubles neurologiques ou mentaux, manque
> de maîtrise de la langue d'enseignement scolaire, pédagogie inadéquate de
> l'enseignement.

🔑 **Règles** :
- Cocher (☑) les symptômes A.X effectivement objectivés par le bilan, en
  cohérence avec les scores observés.
- Laisser non coché (☐) les symptômes non explorés ou non observés.
- TOUJOURS écrire les 4 critères A/B/C/D, le bloc est indissociable.
- Le critère D s'écrit toujours en intégralité (formulation juridique).
- Présent dans le diagnostic après la phrase juridique du décret 2002-721,
  pas en remplacement.
`

export const STYLE_CLOTURE = `## Style, Phrase de clôture du CRBO (référence Elsa DALL'AGNOL)

Le CRBO se termine par une **formule de politesse standard** avant la
signature. Cette formule est constante et professionnelle, à reprendre
verbatim pour ancrer le ton du document :

> Vous remerciant de votre attention et me tenant à votre disposition pour
> de plus amples informations, je vous prie de recevoir mes salutations
> distinguées.

🔒 **Règle** : insérer cette phrase systématiquement en fin de CRBO, juste
avant la zone de signature. Elle marque la clôture du document médical et la
disponibilité de l'orthophoniste pour échange avec le prescripteur.

Le rendu Word d'ortho.ia ajoute automatiquement le nom de l'orthophoniste
(récupéré du profil) et son numéro Adeli sous cette formule, pas besoin de
les écrire dans le contenu généré.
`

export const STYLE_PROJET_THERAPEUTIQUE = `## Style, Projet thérapeutique (référence orthophonistes expertes)

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

(Ne pas inventer un code AMO, vérifier la nomenclature en vigueur si
incertain.)

### Cas particulier des bilans de cognition mathématique (Examath, B-CM, B-CMado, BECD)

Pour les bilans **math**, le style Elsa DALL'AGNOL ne mentionne PAS de code
AMO chiffré dans le projet thérapeutique. À la place, format verbatim :

> "Pour démarrer la rééducation, nous utilisons votre ordonnance du [date]
> pour demander une prise en charge à l'assurance maladie pour « [libellé
> NGAP exact entre guillemets français] » selon la NGAP."

Libellés NGAP officiels à utiliser entre guillemets (verbatim) :
- "rééducation de la cognition mathématique" (cas standard Examath / B-CM)
- "rééducation de la dyscalculie et des troubles du raisonnement
  logico-mathématique" (cas avec atteinte logique avérée)

🔒 **Règle math** : JAMAIS de code AMO chiffré (12,1 ou autre) pour les
bilans math. Toujours mentionner "selon la NGAP" avec le libellé exact
entre guillemets français (« »).

### Vision longitudinale du projet thérapeutique math (référence Elsa DALL'AGNOL)

Pour les bilans math, le projet thérapeutique se termine fréquemment par
une phrase de vision longitudinale décrivant l'objectif final de la
rééducation. Format type :

> "L'objectif principal de la rééducation étant l'autonomie de la vie
> d'adulte (le temps, l'argent, la numération, les 4 opérations,
> l'organisation et la planification)."

Adapter les domaines cités selon le profil (ex. pour un enfant CP-CE1,
ajouter "la lecture de l'heure et la monnaie" ; pour un adolescent, ajouter
"l'organisation de l'emploi du temps et la planification du travail
personnel"). Cette phrase de clôture ancre la rééducation dans une
**perspective fonctionnelle de long terme**, pas seulement scolaire.

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
8.bis. **Étalonnage utilisé**, mention explicite obligatoire (cf. règle dure
   ci-dessous).
9. **Résultats par section** (Langage écrit, Langage oral, Autres), épreuve par
   épreuve avec interprétation et phrase de synthèse par sous-domaine.
10. **Hypothèses explicatives** : structure en questions cliniques
    ("Existe-t-il un trouble du langage oral ?", "Existe-t-il un trouble
    phonologique ?", "Existe-t-il un trouble visuo-attentionnel ?"). À la fin
    de **chaque** hypothèse, une conclusion partielle d'1 phrase est attendue
    (ex. "X présente donc un trouble phonologique massif qui explique
    l'atteinte de la voie d'assemblage." ou "X ne présente pas de trouble au
    niveau visuel.").
11. **Diagnostic orthophonique** : forme juridique + caractérisation +
    explication linguistique (cf. STYLE_DIAGNOSTIC). Pour les TSA pédiatriques,
    inclure le tableau DSM-5 cochable A.1 à A.6 + critères B/C/D
    (cf. STYLE_DSM5_CHECKBOX).
12. **Projet thérapeutique** : PEC + aménagements + codes AMO ou mention NGAP
    pour math (cf. STYLE_PROJET_THERAPEUTIQUE).
13. **Examens complémentaires** : bilans pluridisciplinaires à demander
    (psychométrique, neurovisuel, ORL, etc.). Chaque bilan proposé doit être
    **justifié individuellement** par un élément observé dans le bilan en
    cours (ex. "Un bilan orthoptique : XYZ ne perçoit pas correctement
    l'élément central de la séquence d'empan visuo-attentionnel, ce qui
    justifie une exploration.").
14. **Phrase de clôture standard** (cf. STYLE_CLOTURE), puis signature
    automatique (nom + Adeli depuis profil).
15. **Mention médico-légale** (en italique, optionnelle, cf.
    STYLE_MENTION_JURIDIQUE) : Article 226-13 Code Pénal + L1110-4 CSP,
    recommandée pour les bilans math (style Elsa DALL'AGNOL), pas pour les
    bilans langage (style Anne Frouard).

### Règle dure, étalonnage explicite

Les orthophonistes expertes mentionnent **toujours** explicitement
l'étalonnage choisi avant d'analyser les résultats, et le **justifient
brièvement** quand il n'est pas l'âge calendaire :
- "Nous utiliserons l'étalonnage CM2 pour XYZ." (Anne Frouard)
- "Les scores d'Examath sont comparés à ceux du niveau 6ème-5ème." (Elsa
  DALL'AGNOL)
- Cas adulte EVALEO 6-15 : "compte tenu du parcours scolaire de la patiente,
  nous utiliserons l'étalonnage 15 ans, qui correspond à un niveau
  d'acquisition du langage écrit de fin de collège."

🔒 **Règle obligatoire** : le CRBO DOIT mentionner explicitement l'étalonnage
utilisé (classe scolaire, pas âge calendaire). Si l'étalonnage diffère de la
classe réelle du patient (cas adulte, redoublement, niveau scolaire avancé),
**justifier brièvement** ce choix en une phrase. Cette mention va juste après
l'échelle/convention de scores et avant le premier tableau de résultats.

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
