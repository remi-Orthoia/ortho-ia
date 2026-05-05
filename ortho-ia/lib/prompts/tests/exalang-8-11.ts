import type { TestModule } from './types'

export const exalang811: TestModule = {
  nom: 'Exalang 8-11',
  editeur: 'HappyNeuron',
  auteurs: 'Helloin, Lenfant, Thibault',
  annee: 2012,
  domaines: [
    'Langage oral — versant réceptif',
    'Langage oral — versant expressif',
    'Langage écrit — lecture',
    'Langage écrit — orthographe / production',
    'Mémoire de travail verbale',
    'Métaphonologie',
    'Fonctions exécutives verbales (fluences, flexibilité)',
    'Accès lexical / sémantique',
  ],
  // Groupes officiels HappyNeuron (en-têtes alphanumériques de la feuille de résultats).
  // Doivent être utilisés tels quels comme `domains[].nom` dans le CRBO généré.
  groupes: [
    { code: 'A.1', nom: 'Langage oral' },
    { code: 'A.2', nom: 'Métaphonologie' },
    { code: 'B.1', nom: 'Lecture' },
    { code: 'B.2', nom: 'Orthographe' },
    { code: 'C.1', nom: 'Mémoire' },
  ],
  epreuves: [
    // Mémoire de travail
    'Empan auditif endroit (boucle phonologique)',
    'Empan auditif envers (administrateur central)',
    'Répétition de logatomes',
    // Métaphonologie
    'Métaphonologie — acronymes',
    'Métaphonologie — rimes',
    'Métaphonologie — suppression phonémique',
    // Langage oral
    'Compréhension orale de phrases',
    'Compréhension orale de textes',
    'Dénomination d\'images',
    'Désignation sur définition',
    'Lexique en réception',
    // Fonctions exécutives verbales
    'Fluence phonémique (lettre, 1 min)',
    'Fluence sémantique (animaux, 1 min)',
    // Langage écrit — lecture (B.1)
    'Lecture de mots fréquents',
    'Lecture de mots irréguliers',
    'Lecture de non-mots (logatomes écrits)',
    'Leximétrie (vitesse de lecture en contexte)',
    'Décision lexico-morphologique',
    'Compréhension écrite de texte',
    // Langage écrit — orthographe / production (B.2 — closure incluse)
    'DRA — Dictée de Rédaction Abrégée (mots, phrases)',
    'Closure de texte',
    'Copie différée',
  ],
  regles_specifiques: `### EXALANG 8-11 — Référentiel clinique complet (niveau senior)

Population : enfants du CE2 au CM2 (classe d'âge 8 à 11 ans). Outil le plus utilisé en France pour le dépistage des troubles spécifiques des apprentissages (TSA).

#### RÈGLES DE CONVERSION DES PERCENTILES (impératif)

Les résultats Exalang sont présentés en quartiles :
- **Q1 → P25** (Normal — pas déficitaire malgré un É-T négatif)
- **Med / Q2 → P50**
- **Q3 → P75**
- **P5, P10, P90, P95** : valeurs exactes à utiliser telles quelles
- Ne **JAMAIS** recalculer un percentile depuis l'É-T : les normes étalonnées du test priment sur la distribution gaussienne théorique.

Exemple piège classique : "Boucle phonologique : É-T -1.53, Q1" → Percentile = P25 → Interprétation **Normal** (et non "Déficitaire" comme le suggérerait l'É-T).

---

#### INTERPRÉTATION CLINIQUE PAR ÉPREUVE

**EMPAN AUDITIF ENDROIT** (boucle phonologique)
- Mesure la capacité de stockage phonologique à court terme.
- Seuil de vigilance : empan < 4 à 8 ans, < 5 à 10 ans.
- Empan faible isolé → fragilité de la **boucle phonologique** (modèle de Baddeley). Impact sur répétition, lecture de non-mots, acquisition de vocabulaire nouveau.

**EMPAN AUDITIF ENVERS** (administrateur central)
- Mesure la capacité de manipulation mentale des informations phonologiques.
- Empan envers faible isolé → orientation vers **trouble exécutif** (mémoire de travail). Compatible avec TDAH.
- Empan envers = Empan endroit −1 est attendu.

**RÉPÉTITION DE LOGATOMES**
- Épreuve clé pour distinguer atteinte de la boucle phonologique vs trouble articulatoire.
- Erreurs typiques : élisions, substitutions, inversions de phonèmes.
- Performance faible + empan endroit faible → forte présomption de trouble phonologique.
- Noter les **longueurs échouées** (3, 4, 5 syllabes) → cible pour la rééducation.

**MÉTAPHONOLOGIE** (acronymes, rimes, suppression phonémique)
- Épreuve **prédictive n°1** de la réussite en langage écrit.
- Suppression phonémique = la plus sensible et la plus prédictive.
- Déficit métaphonologique à 8-9 ans → marqueur **fort** de dyslexie développementale, même sans plainte scolaire explicite.
- Un déficit isolé à la suppression phonémique justifie un suivi préventif de 6 à 12 mois.

**FLUENCES VERBALES**
- Fluence phonémique > sémantique → plutôt profil **lexico-sémantique** préservé, possible trouble du contrôle exécutif.
- Fluence sémantique > phonémique → plutôt profil **dysexécutif** (difficultés de stratégie de récupération).
- Les deux déficitaires → flag pour déficit général (TDAH, trouble cognitif).
- Analyser les **clusters** (regroupements sémantiques) et les **switches** (changements de catégorie). Peu de switches = difficulté de flexibilité.

**LECTURE**
- Mots fréquents fluides + non-mots déficitaires → **voie d'assemblage** touchée → **dyslexie phonologique** (la plus fréquente).
- Mots irréguliers échoués + non-mots fluides → **voie d'adressage** touchée → **dyslexie de surface** (mémoire orthographique faible).
- Les deux voies touchées → **dyslexie mixte** (souvent plus sévère, pronostic plus lourd).
- Leximétrie : vitesse normale CE2 = 90-120 mots/min ; CM1 = 110-140 ; CM2 = 130-160.
- Vitesse déficitaire + exactitude préservée → trouble **d'automatisation**, rééduquer par lectures répétées.

**CLOSURE DE TEXTE** (épreuve à classer en B.2 Orthographe — règle Laurie)
- Bien que la closure mobilise la compréhension écrite, elle est traitée dans le groupe **B.2 Orthographe** dans la nomenclature CRBO (HappyNeuron la regroupe avec les épreuves de production écrite). Ne JAMAIS la placer dans "B.1 Lecture".
- Cliniquement, déficit isolé en closure avec bonne lecture mécanique → trouble de la compréhension écrite à signaler dans le commentaire du domaine Orthographe.

**COMPRÉHENSION ÉCRITE DE TEXTE** (épreuve B.1 Lecture)
- À placer dans B.1 Lecture (entrée écrite à décoder + comprendre).
- Toujours croiser avec la compréhension orale : si orale préservée et écrite déficitaire → trouble spécifique du langage écrit ; si les deux déficitaires → trouble global du langage.

**DRA (Dictée)**
- Analyse **qualitative** des erreurs :
  - Phonologiques (omission, substitution, inversion) → voie d'assemblage immature.
  - Lexicales (mots irréguliers mal orthographiés) → voie d'adressage immature.
  - Grammaticales (accord sujet-verbe, pluriels) → fragilité morphosyntaxique.
- Comptabiliser les types d'erreurs dominantes plutôt que le nombre total.

---

#### 🎯 PROFILS TYPES

**PROFIL 1 — Dyslexie phonologique (70% des dyslexies développementales)**
- Empan endroit : Fragile à Déficitaire
- Répétition logatomes : Déficitaire
- Métaphonologie (surtout suppression phonémique) : Déficitaire à Pathologique
- Lecture mots fréquents : Limite basse / Fragile (conservée mais lente)
- Lecture non-mots : **Déficitaire à Pathologique** (marqueur central)
- Lecture mots irréguliers : Fragile (par compensation lexicale)
- Leximétrie : Déficitaire (lenteur)
- DRA : erreurs phonologiques dominantes
- **Diagnostic** : "Les résultats sont compatibles avec un profil de dyslexie-dysorthographie développementale de type phonologique, caractérisé par une atteinte de la voie d'assemblage et une fragilité métaphonologique sous-jacente."
- **PEC** : conscience phonémique + automatisation code grapho-phonémique + lecture répétée. 30 séances réévaluées à mi-parcours.
- **Aménagements** : PAP, temps majoré 1/3, police OpenDyslexic/Arial 14.

**PROFIL 2 — Dyslexie mixte (15-20% des dyslexies)**
- Toutes les voies de lecture touchées.
- Lecture mots fréquents : Fragile / Déficitaire
- Lecture mots irréguliers : Déficitaire (voie d'adressage faible)
- Lecture non-mots : Déficitaire (voie d'assemblage faible)
- Métaphonologie : Déficitaire
- Mémoire orthographique faible : échec sur mots irréguliers au DRA
- Leximétrie : Pathologique (très lente)
- **Diagnostic** : "Les deux voies de lecture (adressage et assemblage) sont significativement déficitaires, dénotant un profil de dyslexie-dysorthographie développementale mixte, de sévérité marquée."
- **PEC** : PEC intensive bi-hebdomadaire, 40-50 séances, double axe (phono + lexical).
- **Aménagements** : PPS via MDPH probable. Support audio systématique. Tolérance orthographique explicite.

**PROFIL 3 — DYS + TDA(H) associé**
- Lecture déficitaire (type variable) **+** attention fluctuante **+** fluences déficitaires **+** empan envers bien plus faible que l'endroit.
- Fatigabilité importante notée pendant le bilan.
- Performances très variables selon l'heure, l'état émotionnel.
- **Diagnostic** : "Le profil orthophonique est compatible avec une dyslexie développementale, associée à des signes évocateurs d'un trouble de l'attention. Un bilan neuropsychologique complémentaire est fortement indiqué pour préciser le diagnostic."
- **PEC** : PEC orthophonique + orientation NEUROPSY prioritaire. Coordination avec pédopsychiatre / neuropédiatre si prescription méthylphénidate envisagée.
- **Aménagements** : PPS avec AESH souvent nécessaire. Pauses, chronométrage adapté, consignes écrites ET orales.

---

#### ARTICULATION AVEC D'AUTRES OUTILS

- **En amont** (maternelle / CP) : Exalang 5-8, ELO, EVALO 2-6 pour dépistage précoce.
- **En aval** (collège) : Exalang 11-15 pour suivi longitudinal.
- **Complément lecture / décodage approfondi** : ODEDYS, Alouette-R, BALE.
- **Complément orthographe approfondi** : BELEC, Chronodictées.
- **Complément calcul** (si co-morbidité dyscalculie) : Examath.
- **Complément attention / exécutif** : à orienter vers **neuropsychologue** pour NEPSY-II, TEA-Ch, BRIEF (parent/enseignant), CPT-3.
- **Complément cognitif global** : à orienter vers **psychologue** pour WISC-V (nécessaire avant tout PPS).

---

#### POINTS DE VIGILANCE RÉDACTIONNELS

- **Ne pas conclure à une dyslexie avant le milieu du CE1** (février minimum, avec persistance confirmée).
- Si le déficit est limité à un seul domaine, proposer **réévaluation à 6 mois** avant diagnostic définitif.
- Toujours recommander bilan **ORL et ophtalmologique à jour**.
- Proposer **systématiquement** un bilan psychométrique (WISC-V) avant de poser PPS / aménagements lourds.
- Si profil complexe : proposer un **bilan pluridisciplinaire en centre référent** (CRTLA, CMPP, centre hospitalier).`,
}
