import type { TestModule } from './types'

export const examath: TestModule = {
  nom: 'Examath',
  editeur: 'HappyNeuron',
  auteurs: 'Helloin, Thibault',
  annee: 2015,
  domaines: [
    'Cognition numérique de base (sens du nombre)',
    'Code numérique arabe (transcodage)',
    'Code numérique verbal',
    'Calcul mental et posé',
    'Résolution de problèmes',
    'Géométrie et mesures',
    'Estimation numérique',
  ],
  epreuves: [
    'Dénombrement (pointage, quantification rapide)',
    'Comparaison de grandeurs numériques',
    'Transcodage chiffres → mots et mots → chiffres',
    'Lecture et écriture de nombres',
    'Calcul mental (additions, soustractions, multiplications)',
    'Calcul posé',
    'Résolution de problèmes (énoncés simples puis complexes)',
    'Estimation (ligne numérique mentale)',
    'Récupération des faits arithmétiques (tables)',
    'Géométrie (reproduction de figures, symétries)',
  ],
  regles_specifiques: `### EXAMATH — Règles cliniques détaillées

#### Règles de conversion
- Batterie spécifique à l'évaluation de la cognition mathématique (suspicion de **dyscalculie développementale**).
- Notation en quartiles comme les autres produits HappyNeuron : **Q1 → P25**, **Med → P50**, **Q3 → P75**.
- Deux versions : Examath 8-15 (primaire + collège) et Examath 5-8.
- Ne JAMAIS reconverter depuis l'É-T quand le percentile est fourni.

#### Meilleures pratiques cliniques par domaine

**Cognition numérique de base (sens du nombre)** :
- Déficit = **marqueur central** de la dyscalculie développementale.
- Cibler : subitizing (3-4 items), estimation sur ligne numérique, comparaison de grandeurs non-symboliques.
- Un déficit **du sens du nombre** isolé (avec autres compétences préservées) justifie un diagnostic de dyscalculie même en présence de bons résultats en calcul posé mémorisé.

**Transcodage** :
- Erreurs fréquentes à analyser qualitativement :
  - **Lexicales** : confusion "quatorze / quarante" → atteinte du lexique numérique.
  - **Syntaxiques** : "trois-cent-huit" écrit "3008" → trouble du traitement positionnel.
  - **Phonologiques** : confusion de phonèmes proches.
- Croiser avec le langage oral pour distinguer trouble **spécifique numérique** vs trouble **langagier général**.

**Calcul mental** :
- Analyser les **stratégies** utilisées (comptage, récupération directe, décomposition).
- Comptage persistant sur les doigts au-delà du CE1 → évocateur d'un défaut d'automatisation des faits.
- Noter le temps de réponse : un calcul exact mais extrêmement lent révèle un trouble d'automatisation.

**Récupération des faits arithmétiques** :
- Tables de multiplication déficitaires au CM1+ = signal fort.
- Distinguer **déficit de stockage** (jamais acquis) vs **déficit de récupération** (connaît parfois).
- Travail thérapeutique ciblé : répétition espacée, apprentissage multimodal.

**Résolution de problèmes** :
- Analyser les trois étapes : compréhension énoncé / modélisation / exécution calcul.
- Déficit compréhension isolé → trouble langagier écrit (dyslexie ou trouble pragmatique).
- Déficit modélisation → trouble du raisonnement / fonctions exécutives.
- Déficit exécution seul avec compréhension correcte → dyscalculie pure.

**Estimation / ligne numérique mentale** :
- Épreuve très sensible pour détecter les profils de **dyscalculie sévère**.
- Les erreurs systématiques d'estimation (forte compression des petits nombres ou grands nombres) signent un trouble de la représentation mentale du nombre.

**Géométrie** :
- Souvent épargnée dans la dyscalculie "pure" → sa préservation aide à affiner le diagnostic différentiel.
- Déficit géométrique associé oriente vers un trouble visuo-spatial plus global (dyspraxie, trouble non-verbal).

#### Points d'attention rédactionnels

- **Diagnostic de dyscalculie** : exiger un écart ≥ **-2 É-T** (ou P < 2) sur au moins **deux domaines** de la cognition numérique de base, persistant malgré une prise en charge.
- **Troubles associés fréquents** : dyslexie (30-40% de co-morbidité), TDAH, troubles visuo-spatiaux. Toujours questionner.
- **Intelligence préservée** : la dyscalculie est un trouble **spécifique** — un bilan QI dans la moyenne renforce le diagnostic différentiel.
- Si profil mixte (dyscalculie + dyslexie), préciser dans le CRBO les **priorités thérapeutiques** : en général, prendre en charge d'abord le trouble le plus handicapant scolairement.

#### Articulation avec d'autres outils
- **En amont / complément** : UDN-II, ZAREKI-R, TEDI-MATH.
- **Dépistage rapide** : TEDI-MATH 4-8 pour la maternelle / CP.
- **Aspect cognitif général** : WISC-V (échelle raisonnement quantitatif).
- **Fonctions exécutives** : NEPSY-II, TEA-Ch, BRIEF.
- **Langage écrit associé** : Exalang 8-11 ou Exalang 11-15, BALE, BELEC.

#### Recommandations thérapeutiques types
- **Rééducation ciblée dyscalculie** : 1 séance/semaine, en moyenne 18-24 mois selon sévérité.
- **Matériel concret manipulable** : jetons, règle numérique, barres de Cuisenaire.
- **Logiciels spécialisés** : Dybuster Calcularis, The Number Race, La Course aux Nombres.
- **Aménagements scolaires** : temps tiers, calculatrice autorisée, énoncés simplifiés, tables de référence.
- **Coordination** avec l'enseignant et, si besoin, demander une demande MDPH pour les aménagements.`,
}
