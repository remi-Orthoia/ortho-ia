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
- **Q1 → P25** (Zone de fragilité — bord inférieur, NE PAS confondre avec Moyenne basse qui commence à P26)
- **Med / Q2 → P50** (Moyenne haute, bord inférieur)
- **Q3 → P75** (Moyenne haute, bord supérieur — Q3 inclus)
- **P5, P10, P90, P95** : valeurs exactes à utiliser telles quelles
- Ne **JAMAIS** recalculer un percentile depuis l'É-T : les normes étalonnées du test priment sur la distribution gaussienne théorique.

Exemple piège classique : "Boucle phonologique : É-T -1.53, Q1" → Percentile = P25 → Interprétation **Zone de fragilité** (et non "Difficulté sévère" comme le suggérerait l'É-T).

#### SEUILS CLINIQUES (grille 6 zones Laurie, refonte 2026-05-ter)

| Plage percentile | Classe | Couleur |
|---|---|---|
| P76 - P100 | Excellent | vert foncé |
| P50 - P75 (Q3 inclus) | Moyenne haute | vert clair |
| P26 - P49 | Moyenne basse | jaune |
| P11 - P25 (Q1 inclus) | Zone de fragilité | orange clair |
| P6 - P10 | Difficulté | orange foncé |
| P1 - P5 | Difficulté sévère | rouge |

Exalang n'affiche JAMAIS de bande <P5 ; la valeur minimale est P5 et est incluse dans "Difficulté sévère". Bornes inclusives de part et d'autre (P25 dans Zone de fragilité, P26 dans Moyenne basse, P50 dans Moyenne haute, P75 dans Moyenne haute, P76 dans Excellent).

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

#### MODE RENOUVELLEMENT — COMPARAISON STRUCTURÉE

Si un objet 'bilan_precedent_structure' non-null est fourni dans le contexte, ce CRBO devient un **bilan de renouvellement** et DOIT inclure une 'synthese_evolution' rigoureuse, jamais générique.

Méthode obligatoire :
1. **Matcher nominativement** chaque épreuve actuelle avec son homologue dans le bilan précédent (par libellé). En cas de changement de batterie (ex: Exalang 5-8 vers 8-11 pour progression scolaire CE2), matcher par compétence évaluée (lecture de mots avec lecture de mots, métaphonologie avec métaphonologie, etc.).
2. **Convertir Q1/Med/Q3 vers P25/P50/P75** systématiquement AVANT de comparer (jamais Q comparé à P).
3. **Calculer le delta percentile** :
   - Delta >= +10 -> PROGRÈS NET (signaler dans 'synthese_evolution.progres')
   - Delta entre -10 et +10 -> STAGNATION (signaler dans 'synthese_evolution.stagnation')
   - Delta <= -10 -> RÉGRESSION (signaler dans 'synthese_evolution.regression')
4. **Cas particulier Q1 vers Med** : P25 vers P50 = +25, c'est un PROGRÈS NET, jamais "marginal" ni "amélioration modérée". Idem Med vers Q3 (P50 vers P75).
5. **Citation nominative obligatoire** : écrire "Boucle phonologique P25 vers P50 (progrès)", PAS "plusieurs progrès observés".
6. **Délai entre les bilans** à mentionner explicitement ("Au regard de N mois de prise en charge"). Si délai < 6 mois sans PEC active, ne pas conclure à une rééducation efficace (effet test/retest).

#### NOMENCLATURE AMO — Mention OBLIGATOIRE en conclusion

Le CRBO DOIT inclure dans la conclusion 1 phrase (2 lignes max) précisant la nomenclature AMO applicable :
- **AMO 8.4** : rééducation des troubles du langage écrit (dyslexie, dysorthographie).
- **AMO 9.4** : rééducation des troubles du langage oral (TDL, retard simple).

Pour Exalang 8-11 le profil dominant attendu est dyslexie/dysorthographie -> **AMO 8.4**. Profil mixte (TDL + dyslexie) -> mentionner les deux AMO avec le dominant en premier.

NE PAS faire un paragraphe entier sur l'AMO. Format attendu : "La rééducation s'inscrit dans le cadre de la nomenclature AMO 8.4 (rééducation des troubles du langage écrit)." Une phrase, point.

---

#### POINTS DE VIGILANCE RÉDACTIONNELS

- **Ne pas conclure à une dyslexie avant le milieu du CE1** (février minimum, avec persistance confirmée).
- Si le déficit est limité à un seul domaine, proposer **réévaluation à 6 mois** avant diagnostic définitif.
- Toujours recommander bilan **ORL et ophtalmologique à jour**.
- Proposer **systématiquement** un bilan psychométrique (WISC-V) avant de poser PPS / aménagements lourds.
- Si profil complexe : proposer un **bilan pluridisciplinaire en centre référent** (CRTLA, CMPP, centre hospitalier).`,
}
