import type { TestModule } from './types'

export const exalang1115: TestModule = {
  nom: 'Exalang 11-15',
  editeur: 'HappyNeuron',
  auteurs: 'Helloin, Lenfant, Thibault',
  annee: 2009,
  domaines: [
    'Langage oral — réceptif et expressif',
    'Langage écrit — lecture fluente',
    'Langage écrit — compréhension écrite complexe',
    'Orthographe lexicale et grammaticale',
    'Mémoire de travail verbale',
    'Fonctions exécutives (fluences, flexibilité)',
    'Raisonnement verbal',
    'Production écrite',
  ],
  epreuves: [
    'Empan auditif endroit et envers',
    'Répétition de logatomes complexes',
    'Fluences phonémique et sémantique',
    'Compréhension orale de textes abstraits',
    'Dénomination rapide de mots complexes',
    'Lecture de mots fréquents',
    'Lecture de mots irréguliers',
    'Lecture de non-mots / logatomes écrits',
    'Leximétrie en contexte (texte long)',
    'Compréhension écrite inférentielle',
    'Closure de texte complexe',
    'Dictée de mots, de phrases, de texte',
    'Production écrite narrative',
    'Raisonnement verbal (analogies, métaphores)',
  ],
  regles_specifiques: `### EXALANG 11-15 — Référentiel clinique complet

Population : **collège (6e à 3e)**. Outil de référence pour le suivi des troubles des apprentissages au collège et le dépistage tardif chez des élèves non diagnostiqués au primaire.

#### RÈGLES DE CONVERSION
Identique à Exalang 8-11 : **Q1 → P25, Med → P50, Q3 → P75**. Ne JAMAIS recalculer depuis l'É-T.

---

#### SPÉCIFICITÉS AU COLLÈGE

**Complexité accrue** : les épreuves de l'Exalang 11-15 testent des compétences plus fines que celles du primaire :
- Compréhension inférentielle (lire entre les lignes).
- Raisonnement verbal (analogies, métaphores).
- Production écrite structurée (récit, argumentation).
- Orthographe lexicale complexe (mots irréguliers, homophones grammaticaux).

**Mécanismes de compensation** : les dyslexiques diagnostiqués au primaire peuvent apparaître **subcliniques** sur les épreuves simples mais **décompensés** sur les épreuves complexes ou chronométrées.

---

#### INTERPRÉTATION PAR DOMAINE

**LECTURE** (mots, non-mots, leximétrie)
- À cet âge, la lecture de mots fréquents DOIT être rapide et exacte.
- Vitesse de lecture normale 6e = 140-180 mots/min ; 3e = 180-220 mots/min.
- Leximétrie déficitaire au collège → **flag majeur** pour dyslexie non diagnostiquée ou dyslexie avec sévérité résiduelle.
- Lecture de non-mots toujours sensible à la voie d'assemblage, même chez l'ado.

**COMPRÉHENSION ÉCRITE INFÉRENTIELLE**
- Évalue la capacité à construire un modèle mental du texte.
- Déficit isolé (avec bonne lecture de surface) → trouble de la **compréhension écrite** (hyperlexie inversée) → orienter vers bilan neuropsy + orthophonique spécifique.
- Souvent sous-diagnostiqué : adolescents "lisent" mais ne comprennent pas, prennent du retard en français / histoire / SVT.

**ORTHOGRAPHE** (dictée, production écrite)
- Les **homophones grammaticaux** (a/à, ou/où, est/et, ses/ces) sont des marqueurs.
- Orthographe lexicale déficitaire + orthographe grammaticale préservée → **dyslexie/dysorthographie de surface** (voie lexicale faible).
- Orthographe grammaticale très faible → **trouble morphosyntaxique** ou surcharge cognitive (à croiser avec mémoire de travail).

**FLUENCES et MÉMOIRE DE TRAVAIL**
- Empan envers très inférieur à l'empan endroit → forte présomption de **trouble dysexécutif** ou TDAH.
- Fluence sémantique > phonémique → pattern dysexécutif.
- Flag pour orientation neuropsychologie.

**PRODUCTION ÉCRITE**
- Épreuve clé au collège : évalue l'ensemble des compétences langagières.
- Critères : cohérence du récit, densité lexicale, correction orthographique, complexité syntaxique.
- Production pauvre (peu de mots, syntaxe simpliste, récit sans structure) → indicateur d'un trouble langagier global, même chez des ados qui parlent couramment.

---

#### 🎯 PROFILS TYPES

**PROFIL 1 — Dyslexie compensée / résiduelle (diagnostiquée au primaire)**
- Lecture mots fréquents : Normale (compensée)
- Lecture non-mots : Fragile (trace résiduelle)
- Leximétrie : Fragile (lenteur persistante)
- Orthographe lexicale : Fragile (fautes sur mots irréguliers)
- Compréhension écrite : Normale (si lit lentement)
- Fatigabilité scolaire notée, notes en baisse en 6e
- **Diagnostic** : "La dyslexie-dysorthographie initialement diagnostiquée en [CM2] reste présente sous une forme compensée, avec une trace résiduelle sur la lecture de non-mots et la leximétrie. L'entrée au collège réactive des difficultés d'automatisation, notamment face à l'augmentation des volumes de lecture et d'écriture."
- **PEC** : maintien PEC orthophonique allégée (1 séance / 2 semaines), focus stratégies métacognitives (prise de notes, surlignage, organisation).
- **Aménagements** : PAP maintenu ou PPS si pas encore en place. Temps majoré 1/3 aux épreuves du **Brevet des Collèges**. Ordinateur possible avec logiciel de lecture vocale.

**PROFIL 2 — Dyslexie non diagnostiquée jusqu'au collège**
- Lecture non-mots : Déficitaire
- Leximétrie : Déficitaire (très lente)
- Orthographe : Déficitaire (nombreuses erreurs)
- Compréhension écrite : Fragile (surcharge cognitive)
- Production écrite : pauvre, peu structurée
- Histoire scolaire : difficultés "traînantes" au primaire, considérées comme flemme ou manque de travail
- Parfois élève "doué" qui a compensé jusqu'au collège par intelligence et effort.
- **Diagnostic** : "Le profil orthophonique de [Prénom] est compatible avec une **dyslexie-dysorthographie développementale** qui n'avait pas été identifiée au primaire. La complexification des exigences scolaires au collège révèle un trouble jusque-là masqué par des stratégies de compensation."
- **PEC** : PEC intensive à démarrage, 40-50 séances. Restauration de la confiance (ado souvent en échec scolaire chronique). Stratégies métacognitives essentielles.
- **Aménagements** : PPS via MDPH à initier immédiatement. Ordinateur autorisé aux évaluations. Temps 1/3 systématique. Discussion pour le Brevet et l'orientation post-3e.

**PROFIL 3 — Trouble de la compréhension écrite isolé**
- Lecture mots, non-mots, leximétrie : Normales
- Orthographe : Normale à Limite basse
- Compréhension écrite inférentielle : Déficitaire à Pathologique
- Raisonnement verbal : Fragile (analogies)
- Production écrite : pauvre sémantiquement
- Histoire : élève qui "lit bien" mais ne retient pas, difficultés en français, histoire, géographie.
- **Diagnostic** : "Les compétences de lecture de surface sont préservées, mais [Prénom] présente un **trouble de la compréhension écrite inférentielle** avec impact sur l'accès au sens des textes complexes. Ce profil est distinct de la dyslexie classique et justifie une prise en charge spécifique."
- **PEC** : PEC orthophonique centrée sur la compréhension fine, les inférences, les modèles mentaux de textes. Matériel adapté (textes courts, questionnement métacognitif).
- **Aménagements** : PAP avec énoncés reformulés, questions reformulées, temps de lecture supplémentaire, schématisation autorisée.

---

#### RECOMMANDATIONS AU COLLÈGE

- **PPS via MDPH** fortement conseillé pour tous les profils sévères (permet l'AESH, matériel adapté, temps majoré au Brevet et au Bac).
- **Aménagements Brevet et Bac** : à demander via le médecin scolaire au moins 6 mois avant les épreuves.
- **Orientation post-3e** : anticiper le choix de filière avec l'adolescent·e, vérifier la compatibilité avec ses capacités.
- **Discussion dyslexie/orientation pro** : voies pro et technologiques souvent mieux adaptées aux profils dys sévères.

#### ARTICULATION AVEC D'AUTRES OUTILS

- **Amont** : Exalang 8-11, ODEDYS, BALE.
- **Complément écrit** : BELEC (orthographe approfondie), Alouette-R (lecture rapide).
- **Complément calcul** : Examath 8-15 si dyscalculie associée.
- **Cognitif** : WISC-V ou WAIS (au-delà de 16 ans).
- **Exécutif / attention** : NEPSY-II, TEA-Ch (jusqu'à 16 ans), CPT-3, BRIEF.`,
}
