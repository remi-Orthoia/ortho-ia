export interface GlossaireTerm {
  slug: string
  label: string
  definition: string
  detail: string
  relatedSlugs?: string[]
}

export const GLOSSAIRE_TERMS: GlossaireTerm[] = [
  {
    slug: 'anomie',
    label: 'Anomie',
    definition: "Difficulté à retrouver le nom des mots connus malgré une compréhension intacte. Signe clinique fréquent dans les aphasies et certaines démences.",
    detail: "L'anomie se manifeste par des pauses, des périphrases ou des mots substituts (\"le truc qui sert à…\"). Elle est évaluée par des épreuves de dénomination orale (ex. DO 80, LEXIS) et peut toucher le langage oral comme écrit.",
    relatedSlugs: ['aphasie', 'semantique'],
  },
  {
    slug: 'aphasie',
    label: 'Aphasie',
    definition: "Trouble acquis du langage consécutif à une lésion cérébrale (AVC, traumatisme crânien, tumeur), touchant la production et/ou la compréhension.",
    detail: "On distingue plusieurs formes selon la localisation lésionnelle : aphasie de Broca (non fluente, compréhension préservée), de Wernicke (fluente, compréhension perturbée), anomique, globale… Le CRBO d'un bilan aphasie doit préciser le type, la sévérité et les modalités atteintes.",
    relatedSlugs: ['anomie', 'crbo'],
  },
  {
    slug: 'betl',
    label: 'BETL',
    definition: "Batterie d'Évaluation des Troubles du Langage : batterie normée pour l'évaluation du langage oral et écrit chez l'adulte.",
    detail: "La BETL propose des épreuves standardisées couvrant la phonologie, le lexique, la syntaxe et la pragmatique. Les résultats sont exprimés en percentiles ou écarts-types selon la norme de référence.",
    relatedSlugs: ['percentile', 'crbo'],
  },
  {
    slug: 'bilan-initial',
    label: 'Bilan initial',
    definition: "Premier bilan orthophonique réalisé pour un patient, ouvrant droit à une prise en charge. Il débouche obligatoirement sur un CRBO.",
    detail: "En France, le bilan initial (AMO 7,5 ou AMO 8,5 selon la nomenclature) doit être prescrit par un médecin. Il comprend une anamnèse, l'administration de tests normés, et la rédaction d'un compte rendu structuré précisant le diagnostic et les recommandations.",
    relatedSlugs: ['crbo', 'ngap'],
  },
  {
    slug: 'boucle-phonologique',
    label: 'Boucle phonologique',
    definition: "Composante de la mémoire de travail stockant les informations verbales sous forme phonologique pendant quelques secondes.",
    detail: "Une boucle phonologique fragilisée se traduit par un empan réduit, des difficultés à retenir des consignes orales longues, et un apprentissage lexical ralenti. On l'évalue via des épreuves de mémoire de chiffres ou de mots en ordre direct.",
    relatedSlugs: ['empan-mnesique', 'phonologie'],
  },
  {
    slug: 'crbo',
    label: 'CRBO',
    definition: "Compte Rendu de Bilan Orthophonique : document médico-légal remis au médecin prescripteur et au patient à l'issue d'un bilan.",
    detail: "Le CRBO est structuré en : anamnèse, motif de consultation, tableau des épreuves avec percentiles, observations par domaine, diagnostic en terminologie française, et recommandations (prise en charge + aménagements scolaires/PAP). Il ne doit pas contenir de codes DSM/CIM ni de diagnostics hypothétiques.",
    relatedSlugs: ['bilan-initial', 'percentile', 'pap'],
  },
  {
    slug: 'dyslexie',
    label: 'Dyslexie',
    definition: "Trouble spécifique et durable de l'acquisition de la lecture, non expliqué par un déficit sensoriel, intellectuel ou éducatif.",
    detail: "La forme phonologique est la plus fréquente (déficit du décodage). La forme surface touche davantage la voie lexicale. Le diagnostic repose sur un score en lecture ≤ P16 et une discordance avec le niveau intellectuel. Le CRBO doit préciser le type et la sévérité.",
    relatedSlugs: ['phonologie', 'percentile', 'crbo'],
  },
  {
    slug: 'dysorthographie',
    label: 'Dysorthographie',
    definition: "Trouble spécifique et durable de l'acquisition de l'orthographe, associé ou non à la dyslexie.",
    detail: "Deux formes principales : phonologique (erreurs de transcription phonème-graphème) et lexicale (erreurs d'usage, mots irreguliers). L'évaluation utilise des épreuves de dictée normées (ex. EMO, Chronodictée). Souvent associée à une dyslexie phonologique.",
    relatedSlugs: ['dyslexie', 'phonologie'],
  },
  {
    slug: 'dysphasie',
    label: 'Dysphasie',
    definition: "Trouble développemental du langage oral, persistant malgré une prise en charge, non expliqué par une perte auditive ou une déficience intellectuelle.",
    detail: "Aujourd'hui souvent désignée sous le terme TDL (Trouble Développemental du Langage). Se manifeste dès l'acquisition du langage : retard expressif, simplifications phonologiques, morphosyntaxe pauvre. Le bilan doit documenter les marqueurs (critères Rapin-Allen ou critères DSM-5 TDL).",
    relatedSlugs: ['phonologie', 'crbo'],
  },
  {
    slug: 'etalonnage',
    label: 'Étalonnage',
    definition: "Processus de standardisation d'un test sur une population de référence pour calculer des normes (percentiles, écarts-types, scores z).",
    detail: "Un étalonnage de qualité doit préciser la taille de l'échantillon, les critères d'inclusion, la date et la région. En orthophonie, les étalonnages vieillissent vite : un test étalonné il y a 20 ans peut sous-estimer les performances des enfants d'aujourd'hui (effet Flynn).",
    relatedSlugs: ['percentile', 'crbo'],
  },
  {
    slug: 'empan-mnesique',
    label: 'Empan mnésique',
    definition: "Nombre d'éléments (chiffres, mots, syllabes) qu'un individu peut retenir et restituer immédiatement après présentation.",
    detail: "L'empan endroit mesure la capacité de stockage phonologique, l'empan envers évalue la manipulation en mémoire de travail. Un empan endroit ≤ 3 chiffres (adulte) est cliniquement significatif. En pratique, on note l'écart entre empan endroit et envers comme indicateur de la charge exécutive.",
    relatedSlugs: ['boucle-phonologique', 'phonologie'],
  },
  {
    slug: 'moca',
    label: 'MoCA',
    definition: "Montreal Cognitive Assessment : test de dépistage des troubles cognitifs légers (MCI) et des démences, en 10-15 minutes.",
    detail: "Seuil standard : 26/30. Sous 26, suspicion de déficit cognitif. Le score brut doit être corrigé si niveau d'études ≤ 12 ans (+1 point). Le MoCA évalue : visuospatial, fonctions exécutives, mémoire, attention, langage, abstraction, orientation. Ne pas confondre avec un bilan neuropsychologique complet.",
    relatedSlugs: ['crbo', 'etalonnage'],
  },
  {
    slug: 'ngap',
    label: 'NGAP',
    definition: "Nomenclature Générale des Actes Professionnels : texte réglementaire fixant les codes et tarifs des actes orthophoniques remboursés en France.",
    detail: "Les bilans orthophoniques sont cotés AMO (Actes Médicaux et para-Médicaux Orthophonie) : AMO 7,5 (bilan initial), AMO 8,5 (bilan approfondi), AMO 6 (bilan de renouvellement). La valeur de l'AMO est revalorisée périodiquement par convention avec l'Assurance Maladie.",
    relatedSlugs: ['bilan-initial', 'crbo'],
  },
  {
    slug: 'percentile',
    label: 'Percentile',
    definition: "Rang centile indiquant la position d'un score dans une distribution normative : P50 = médiane, P16 = 1 ET sous la moyenne.",
    detail: "Le CRBO Ortho.ia utilise une grille à 6 zones : P76-100 (Excellent), P50-75 (Moyenne haute), P26-49 (Moyenne basse), P11-25 (Zone de fragilité), P6-10 (Difficulté), P1-5 (Difficulté sévère). Attention : P25 est en Zone de fragilité, pas en Moyenne basse.",
    relatedSlugs: ['etalonnage', 'crbo'],
  },
  {
    slug: 'phonologie',
    label: 'Phonologie',
    definition: "Système des sons d'une langue et de leurs règles de combinaison. En clinique, désigne les processus de traitement des sons du langage.",
    detail: "Le traitement phonologique comprend : conscience phonologique (manipulation des phonèmes/syllabes), mémoire phonologique à court terme, et rapidité de dénomination (RAN). Déficitaire dans la dyslexie phonologique et le TDL. Évalué par des épreuves de suppression, inversion, répétition de non-mots.",
    relatedSlugs: ['dyslexie', 'boucle-phonologique', 'ran'],
  },
  {
    slug: 'prescripteur',
    label: 'Prescripteur',
    definition: "Médecin (généraliste, pédiatre, neurologue…) qui établit l'ordonnance autorisant le bilan et/ou la prise en charge orthophonique.",
    detail: "Sans ordonnance valide, le bilan n'est pas remboursé par l'Assurance Maladie. Le CRBO est adressé au prescripteur, qui peut le transmettre aux enseignants et à d'autres intervenants. En France, tout médecin peut prescrire un bilan orthophonique, mais pas les infirmiers ni les psychologues.",
    relatedSlugs: ['bilan-initial', 'crbo', 'ngap'],
  },
  {
    slug: 'prosodie',
    label: 'Prosodie',
    definition: "Ensemble des variations d'intonation, de rythme et d'accentuation du langage oral, porteurs de sens émotionnel et pragmatique.",
    detail: "Les troubles prosodiques s'observent dans les troubles du spectre autistique (TSA), certaines aphasies et la dysarthrie. Une prosodie atypique peut rendre le discours monotone, difficile à interpréter socialement, ou donner l'impression d'un accent étranger.",
    relatedSlugs: ['aphasie', 'semantique'],
  },
  {
    slug: 'ran',
    label: 'RAN',
    definition: "Rapid Automatized Naming : dénomination rapide automatisée d'items visuels (lettres, chiffres, couleurs, objets), prédicteur robuste de la fluidité en lecture.",
    detail: "Un RAN lent (> P16) associé à un déficit en conscience phonologique indique un profil de dyslexie à double déficit, de plus mauvais pronostic. Évalué par des épreuves chronométrées (ex. BALE, EVALEC, 4-DX). Se mesure en secondes et erreurs.",
    relatedSlugs: ['dyslexie', 'phonologie'],
  },
  {
    slug: 'semantique',
    label: 'Sémantique',
    definition: "Niveau du langage concernant le sens des mots et des énoncés, indépendamment de leur forme sonore ou grammaticale.",
    detail: "Les troubles sémantiques touchent l'accès lexical (anomie), la compréhension des mots (déficit sémantique), ou l'organisation des concepts. Évalués par des épreuves de dénomination, d'appariement, de catégorisation. Présents dans la démence sémantique et certaines aphasies.",
    relatedSlugs: ['anomie', 'aphasie'],
  },
  {
    slug: 'syntaxe',
    label: 'Syntaxe',
    definition: "Niveau du langage concernant la structure des phrases : ordre des mots, morphologie grammaticale, relations entre constituants.",
    detail: "Les troubles syntaxiques peuvent toucher la production (phrases courtes, agrammatisme) ou la compréhension (échec sur les structures passives, relatives). Évalués par des épreuves de répétition de phrases, de désignation, ou d'imitation différée.",
    relatedSlugs: ['dysphasie', 'aphasie'],
  },
]

export function getAllTerms(): GlossaireTerm[] {
  return GLOSSAIRE_TERMS.sort((a, b) => a.label.localeCompare(b.label, 'fr'))
}

export function getTermBySlug(slug: string): GlossaireTerm | undefined {
  return GLOSSAIRE_TERMS.find((t) => t.slug === slug)
}
