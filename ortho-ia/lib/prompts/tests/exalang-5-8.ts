import type { TestModule } from './types'

export const exalang58: TestModule = {
  nom: 'Exalang 5-8',
  editeur: 'HappyNeuron',
  auteurs: 'Helloin, Lenfant, Thibault',
  annee: 2010,
  domaines: [
    'Langage oral — versant réceptif',
    'Langage oral — versant expressif',
    'Pré-requis au langage écrit (métaphonologie)',
    'Lecture émergente (CP-CE1)',
    'Production écrite émergente',
    'Mémoire de travail verbale',
    'Dénomination',
  ],
  // Groupes officiels HappyNeuron Exalang 5-8 (en-têtes de la feuille de résultats).
  groupes: [
    { code: 'A.1', nom: 'Langage oral' },
    { code: 'A.2', nom: 'Métaphonologie' },
    { code: 'B.1', nom: 'Lecture émergente' },
    { code: 'B.2', nom: 'Production écrite émergente' },
    { code: 'C.1', nom: 'Mémoire' },
  ],
  epreuves: [
    'Dénomination d\'images',
    'Désignation sur définition',
    'Lexique en réception',
    'Compréhension orale de phrases',
    'Compréhension morphosyntaxique',
    'Répétition de mots',
    'Répétition de logatomes',
    'Empan auditif endroit',
    'Métaphonologie — rimes',
    'Métaphonologie — syllabes (segmentation, fusion)',
    'Métaphonologie — phonèmes (en CE1)',
    'Conscience de l\'écrit (concept de lettre, mot, phrase)',
    'Lecture de lettres / syllabes / mots (CP-CE1)',
    'Écriture de mots (CP-CE1)',
  ],
  regles_specifiques: `### EXALANG 5-8 — Référentiel clinique complet

Population : **grande section (GS) à CE1** — transition pré-apprentissage / apprentissage formel de la lecture. Outil central pour le dépistage précoce.

#### RÈGLES DE CONVERSION DES PERCENTILES (impératif)
Quartiles HappyNeuron : **Q1 → P25** (Zone de fragilité, bord inférieur), **Med → P50** (Moyenne haute, bord inférieur), **Q3 → P75** (Moyenne haute, bord supérieur).
Valeurs explicites (P5, P10, P90, P95) à utiliser telles quelles.
Ne JAMAIS recalculer depuis l'É-T : les normes étalonnées du test priment sur la distribution gaussienne théorique.

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

Exalang n'affiche JAMAIS de bande <P5. Bornes inclusives de part et d'autre (P25 dans Zone de fragilité, P26 dans Moyenne basse, P50 dans Moyenne haute, P75 dans Moyenne haute, P76 dans Excellent).

---

#### INTERPRÉTATION PAR DOMAINE

**LANGAGE ORAL RÉCEPTIF** (compréhension, désignation, lexique)
- Déficit en lexique en réception à 5-6 ans → vigilance pour trouble de développement du langage oral (TDL, ex-dysphasie).
- Compréhension morphosyntaxique sensible : marqueur précoce de difficultés ultérieures en compréhension écrite.

**LANGAGE ORAL EXPRESSIF** (dénomination, répétition)
- Dénomination faible + répétition faible + empan faible → tableau compatible avec **TDL**.
- Répétition de logatomes très sensible : marqueur précoce de fragilité phonologique / future dyslexie.

**MÉTAPHONOLOGIE**
- Séquence développementale attendue :
  - **Rimes** : acquises en MS-GS.
  - **Syllabes** (segmentation, fusion) : acquises en GS-CP.
  - **Phonèmes** (plus tardif, plus difficile) : s'installe en CP-CE1 avec l'apprentissage de la lecture.
- Déficit syllabique persistant au CP → marqueur fort de dyslexie future.
- Déficit phonémique persistant en fin CE1 → diagnostic dyslexie très probable.

**CONSCIENCE DE L'ÉCRIT**
- Épreuves de connaissance du concept de lettre/mot/phrase, orientation de lecture.
- Déficit au-delà de la GS → flag pour environnement peu stimulant ou retard global.

**LECTURE / ÉCRITURE ÉMERGENTE** (CP-CE1)
- À partir du CP : lecture de syllabes et mots simples.
- Analyser les erreurs :
  - **Confusions visuelles** (b/d, p/q) : souvent normales jusqu'à fin CP, pathologiques au CE1.
  - **Confusions auditives** (t/d, p/b, k/g) : atteinte phonologique.
  - **Inversions** (cra/car, pon/pont) : voie d'assemblage immature.

---

#### 🎯 PROFILS TYPES

**PROFIL 1 — Retard simple de langage écrit (CP / début CE1)**
- Métaphonologie : Fragile
- Lecture : Fragile (mais en progression)
- Environnement : sans alarme particulière, bonnes stimulations
- **Diagnostic** : "À ce stade de la scolarité (CP/début CE1), les performances sont en deçà de la moyenne mais restent dans la fourchette du **retard simple**, sans que l'on puisse conclure à un trouble spécifique. Une évaluation à 6 mois est nécessaire pour trancher entre retard et trouble."
- **PEC** : Pas nécessairement de PEC immédiate. Conseils guidance parentale + lecture partagée quotidienne. Réévaluation à 6 mois.

**PROFIL 2 — Dyslexie développementale débutante (fin CE1)**
- Métaphonologie (syllabes et phonèmes) : Déficitaire à Pathologique
- Répétition logatomes : Déficitaire
- Empan endroit : Fragile à Déficitaire
- Lecture de mots : Déficitaire (lenteur et erreurs)
- **Diagnostic** : "Les performances en langage écrit de [Prénom] à ce stade de fin CE1, associées à la fragilité métaphonologique marquée, sont évocatrices d'une **dyslexie développementale en voie d'installation**. Un suivi orthophonique précoce est indiqué pour limiter les retentissements scolaires."
- **PEC** : PEC orthophonique hebdomadaire démarrage immédiat, centrée sur métaphonologie + correspondance grapho-phonémique + entraînement à la lecture.
- **Aménagements** : Concertation enseignant·e, pas de PAP immédiat mais vigilance CE2.

**PROFIL 3 — Trouble Développemental du Langage (TDL) — suspicion dysphasie**
- Langage oral réceptif ET expressif : Déficitaire
- Lexique : Déficitaire
- Compréhension morphosyntaxique : Déficitaire
- Répétition logatomes : Pathologique
- Empan : Fragile
- Histoire : premiers mots tardifs (> 2 ans), phrases tardives (> 3 ans), langage peu intelligible
- **Diagnostic** : "Le profil orthophonique de [Prénom] est compatible avec un **Trouble Développemental du Langage** (ancienne dysphasie), avec une atteinte prédominante sur les versants [lexical / morphosyntaxique / phonologique] du langage oral. Un bilan pluridisciplinaire en centre référent des troubles du langage (CRTLA) est recommandé pour préciser le diagnostic."
- **PEC** : PEC orthophonique intensive bi-hebdomadaire. Orientation CRTLA prioritaire. Coordination avec psychomotricien si motricité globale en retard.
- **Aménagements** : PPS/MDPH avec AESH dès le CP souvent nécessaire. Scolarisation avec accompagnement, éventuellement CLIS/ULIS TSL.

---

#### ARTICULATION AVEC D'AUTRES OUTILS

- **Complément langage oral** : ELO, EVALO 2-6 (pour les 2-6 ans), BILO, N-EEL (Nouvelles Épreuves pour l'Examen du Langage).
- **Suite** : Exalang 8-11 à partir du CE2.
- **Complément cognitif** : orientation WPPSI-IV (pour les 2-7 ans) ou WISC-V (à partir de 6 ans).
- **Si TDL suspecté** : orientation CRTLA / CMPP / CAMSP (selon âge).

---

#### POINTS DE VIGILANCE

- **Ne pas diagnostiquer une dyslexie avant le milieu du CE1** (février).
- **Dépistage GS-CP** : privilégier les termes "fragilité", "retard", "vigilance nécessaire" plutôt que "trouble spécifique".
- En cas de TDL suspecté en maternelle : orientation CAMSP prioritaire (pluridisciplinarité précoce).
- Bilan ORL impératif à cet âge si jamais réalisé (otites à répétition fréquentes).

---

#### MODE RENOUVELLEMENT — COMPARAISON STRUCTURÉE

Si un objet 'bilan_precedent_structure' non-null est fourni dans le contexte, ce CRBO devient un **bilan de renouvellement** et DOIT inclure une 'synthese_evolution' rigoureuse, jamais générique.

Méthode obligatoire :
1. **Matcher nominativement** chaque épreuve actuelle avec son homologue précédent (par libellé). En cas de changement de batterie (Exalang 3-6 vers 5-8 pour passage en GS, ou Exalang 5-8 vers 8-11 pour passage en CE2), matcher par compétence évaluée (métaphonologie avec métaphonologie, lecture de mots avec lecture de mots).
2. **Convertir Q1/Med/Q3 vers P25/P50/P75** systématiquement AVANT de comparer.
3. **Calculer le delta percentile** :
   - Delta >= +10 -> PROGRÈS NET (signaler dans 'synthese_evolution.progres')
   - Delta entre -10 et +10 -> STAGNATION (signaler dans 'synthese_evolution.stagnation')
   - Delta <= -10 -> RÉGRESSION (signaler dans 'synthese_evolution.regression')
4. **Cas particulier Q1 vers Med** : P25 vers P50 = +25, PROGRÈS NET. Idem Med vers Q3.
5. **Citation nominative obligatoire** : "Métaphonologie syllabes P25 vers P50 (progrès)", PAS "plusieurs progrès observés".
6. **Délai entre les bilans** à mentionner ("Au regard de N mois de prise en charge"). À cet âge en CP/CE1, l'évolution est rapide ; un délai >= 6 mois est nécessaire pour conclure à une PEC efficace vs une maturation spontanée.

#### NOMENCLATURE AMO — Mention OBLIGATOIRE en conclusion

Le CRBO DOIT inclure dans la conclusion 1 phrase (2 lignes max) précisant la nomenclature AMO applicable :
- **AMO 9.4** : rééducation des troubles du langage oral (TDL, retard simple, troubles articulatoires).
- **AMO 8.4** : rééducation des troubles du langage écrit (dyslexie débutante en fin CE1).

Pour Exalang 5-8 le choix dépend du profil : TDL/retard simple dominant -> **AMO 9.4** ; dyslexie débutante en fin CE1 -> **AMO 8.4**. Profil mixte -> mentionner les deux AMO avec le dominant en premier.

Format attendu : "La rééducation s'inscrit dans le cadre de la nomenclature AMO 9.4 (rééducation des troubles du langage oral)." Une phrase, point.`,
}
