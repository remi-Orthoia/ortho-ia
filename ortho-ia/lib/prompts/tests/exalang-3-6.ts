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

#### RÈGLES DE CONVERSION
- Notation quartiles HappyNeuron : **Q1 → P25, Med → P50, Q3 → P75**.
- Valeurs explicites (P5, P10, P90, P95) à utiliser telles quelles.
- Ne JAMAIS recalculer depuis l'É-T.

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
- Suivi préventif au CP (risque de dyslexie).`,
}
