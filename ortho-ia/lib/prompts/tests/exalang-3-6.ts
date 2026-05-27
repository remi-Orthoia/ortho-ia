import type { TestModule } from './types'

export const exalang36: TestModule = {
  nom: 'Exalang 3-6',
  editeur: 'HappyNeuron',
  auteurs: 'Helloin, Lenfant, Thibault',
  annee: 2006,
  domaines: [
    'Langage oral réceptif',
    'Langage oral expressif',
    'Lexique',
    'Morphosyntaxe',
    'Phonologie',
    'Métaphonologie (émergente)',
    'Mémoire de travail verbale',
  ],
  epreuves: [
    'Désignation (lexique réceptif)',
    'Dénomination (lexique expressif)',
    'Compréhension de phrases courtes',
    'Production syntaxique (phrases à partir d\'images)',
    'Répétition de mots et phrases',
    'Répétition de logatomes',
    'Empan auditif endroit',
    'Rimes, syllabes (pré-requis langage écrit)',
    'Conscience de l\'écrit émergente',
  ],
  regles_specifiques: `### EXALANG 3-6 — Référentiel clinique complet (niveau senior)

Population : **maternelle (PS, MS, GS)**. Premier outil HappyNeuron en langage oral, idéal pour les bilans de début de scolarisation et les dépistages de TDL.

#### RÈGLES DE CONVERSION DES PERCENTILES (impératif)
- Notation quartiles HappyNeuron : **Q1 → P25** (Zone de fragilité, bord inférieur), **Med → P50** (Moyenne haute, bord inférieur), **Q3 → P75** (Moyenne haute, bord supérieur).
- Valeurs explicites (P5, P10, P90, P95) à utiliser telles quelles.
- Ne JAMAIS recalculer depuis l'É-T : les normes étalonnées du test priment sur la distribution gaussienne théorique.

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

#### INTERPRÉTATION PAR ÉPREUVE

**LEXIQUE RÉCEPTIF** — désignation d'images
- Normes attendues à 3-6 ans, stock lexical passif.
- Décalage marqué entre désignation et dénomination = manque du mot.
- Sous-exposition langagière à considérer (multilinguisme, écrans excessifs).

**LEXIQUE EXPRESSIF** — dénomination
- Stock lexical actif.
- Dénomination très pauvre → TDL expressif probable.

**COMPRÉHENSION MORPHOSYNTAXIQUE**
- Prédictive des capacités futures de compréhension écrite.
- Déficit sévère = marqueur TDL.

**PRODUCTION SYNTAXIQUE**
- Pauvreté syntaxique = marqueur TDL.
- Inversions, omissions de morphèmes grammaticaux attendues jusqu'à 4 ans, pathologiques après.

**RÉPÉTITION DE LOGATOMES**
- Épreuve la plus sensible des difficultés phonologiques futures.
- Marqueur prédictif de dyslexie chez les enfants à risque.

**MÉTAPHONOLOGIE ÉMERGENTE**
- Rimes : acquises en MS-GS (3.5-5.5 ans).
- Syllabes (segmentation) : acquises en GS.
- Absence à la GS = alerte langage écrit.

#### 🎯 PROFILS TYPES

**Profil 1 — Développement normal avec fragilité**
- Performances globalement dans la norme, 1 composante en limite basse
- Pas de retard global
- **Interprétation** : surveillance, guidance parentale, pas de PEC immédiate.

**Profil 2 — Retard Simple de Langage**
- Plusieurs composantes en Fragile, profil homogène
- Enfant évolutif avec stimulation
- **Interprétation** : guidance + réévaluation à 6 mois avant conclusion définitive.

**Profil 3 — TDL émergent (3-4 ans)**
- Multi-composantes Déficitaire, profil hétérogène
- Premiers mots tardifs signalés dans l'anamnèse
- **Interprétation** : PEC orthophonique hebdomadaire recommandée, orientation CRTLA si sévère.

**Profil 4 — Trouble phonologique pur**
- Phonologie / logatomes : Pathologique
- Autres domaines préservés
- Intelligibilité réduite par les pairs
- **Interprétation** : trouble phonologique. PEC ciblée, vigilance CP.

**Profil 5 — Alerte TSA**
- Langage oral + interaction / pragmatique : Déficitaire
- Communication non verbale aussi atteinte (pointage, attention conjointe)
- **Interprétation** : **orientation CRA ou pédopsychiatrie urgente**. Ne pas rester sur un diagnostic de TDL simple chez un enfant qui présente aussi des signes de trouble de la communication sociale.

#### ARTICULATION
- **Complément** : EVALO 2-6, BILO 3-6, N-EEL pour les 3-6 ans.
- **Avant le CP** : Exalang 5-8 ou Exalang 8-11 selon progression.
- **Cognitif** : WPPSI-IV (2;6-7;7 ans) si doute efficience.
- **Médical** : neuropédiatre, ORL systématique, orthoptie.

#### RECOMMANDATIONS
- Retard simple < 5 ans : guidance intensive + suivi 6 mois.
- TDL confirmé : PEC hebdomadaire immédiate, 30 min.
- Bilan **ORL impératif** à cet âge (otites séro-muqueuses).
- Coordination PMI, crèche, école maternelle.
- Suivi préventif au CP (risque de dyslexie).

---

#### MODE RENOUVELLEMENT — COMPARAISON STRUCTURÉE

Si un objet 'bilan_precedent_structure' non-null est fourni dans le contexte, ce CRBO devient un **bilan de renouvellement** et DOIT inclure une 'synthese_evolution' rigoureuse, jamais générique.

Méthode obligatoire :
1. **Matcher nominativement** chaque épreuve actuelle avec son homologue précédent (par libellé). En cas de changement de batterie (Exalang 3-6 vers 5-8 pour passage en GS/CP), matcher par compétence (lexique réceptif avec lexique réceptif, métaphonologie avec métaphonologie).
2. **Convertir Q1/Med/Q3 vers P25/P50/P75** systématiquement AVANT de comparer.
3. **Calculer le delta percentile** :
   - Delta >= +10 -> PROGRÈS NET (signaler dans 'synthese_evolution.progres')
   - Delta entre -10 et +10 -> STAGNATION (signaler dans 'synthese_evolution.stagnation')
   - Delta <= -10 -> RÉGRESSION (signaler dans 'synthese_evolution.regression')
4. **Cas particulier Q1 vers Med** : P25 vers P50 = +25, PROGRÈS NET. Idem Med vers Q3.
5. **Citation nominative obligatoire** : "Lexique réceptif P25 vers P50 (progrès)", PAS "plusieurs progrès observés".
6. **Délai entre les bilans** à mentionner ("Au regard de N mois de prise en charge / de guidance"). Chez l'enfant en maternelle, tenir compte de la maturation développementale (les progrès spontanés sont attendus avant 5 ans).

#### NOMENCLATURE AMO — Mention OBLIGATOIRE en conclusion

Le CRBO DOIT inclure dans la conclusion 1 phrase (2 lignes max) précisant la nomenclature AMO applicable :
- **AMO 9.4** : rééducation des troubles du langage oral (TDL, retard simple, troubles articulatoires).
- **AMO 8.4** : rééducation des troubles du langage écrit (rare à cet âge, sauf prévention pré-CP).

Pour Exalang 3-6 le profil dominant est langage oral -> **AMO 9.4**. Profil avec déficit phonologique sévère pré-CP -> AMO 9.4 (puis transition vers 8.4 si dyslexie confirmée plus tard).

Format attendu : "La rééducation s'inscrit dans le cadre de la nomenclature AMO 9.4 (rééducation des troubles du langage oral)." Une phrase, point.`,
}
