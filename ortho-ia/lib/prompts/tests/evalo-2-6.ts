import type { TestModule } from './types'

export const evalo26: TestModule = {
  nom: 'EVALO 2-6',
  editeur: 'Ortho Édition',
  auteurs: 'Coquet, Ferrand, Tardif',
  annee: 2009,
  domaines: [
    'Communication précoce',
    'Langage oral — versant réceptif',
    'Langage oral — versant expressif',
    'Lexique',
    'Morphosyntaxe',
    'Phonologie',
    'Pragmatique',
  ],
  epreuves: [
    'Évaluation des comportements communicatifs (précoce)',
    'Compréhension orale de consignes',
    'Désignation (lexique réceptif)',
    'Dénomination (lexique expressif)',
    'Production syntaxique (phrases simples et complexes)',
    'Répétition de mots',
    'Répétition de logatomes / non-mots',
    'Épreuves phonologiques (production)',
    'Capacités narratives émergentes',
    'Interaction en contexte ludique (pragmatique)',
  ],
  regles_specifiques: `### EVALO 2-6 — Évaluation du Langage Oral de 2;3 à 6;3 ans (niveau senior)

Population : **2 ans 3 mois à 6 ans 3 mois**. Batterie spécialement adaptée au **dépistage très précoce** des TDL, particulièrement utile en CMPP, CAMSP et en cabinet libéral pour les bébés-enfants en difficulté.

#### SPÉCIFICITÉS
- **Étalonnage fin par tranches de 6 mois** entre 2;3 et 6;3 ans.
- Inclut une évaluation des **comportements communicatifs précoces** (pointage, attention conjointe, tours de parole).
- Utile pour distinguer entre retard simple et signes précoces de **TSA** ou de **TDL sévère**.

#### RÈGLES DE CONVERSION
- **Centiles numériques explicites** (P5, P10, P25, P50, P75, P90, P95).
- À utiliser tels quels, ne **jamais recalculer depuis l'É-T**.
- Seuils : P ≥ 25 Normal, P16-24 Limite basse, P7-15 Fragile, P2-6 Déficitaire, P < 2 Pathologique.

#### INTERPRÉTATION PAR DOMAINE

**COMMUNICATION PRÉCOCE**
- Évalue le pointage, l'attention conjointe, les tours de parole, la compréhension de l'intention.
- Déficit sévère à 2-3 ans → **alerte TSA** (trouble du spectre autistique), orientation pédopsychiatrie / CRA urgente.
- À différencier d'un retard de langage simple.

**LEXIQUE RÉCEPTIF** (désignation)
- Normes précises par tranche d'âge.
- Retard significatif à 3 ans → signalement.

**LEXIQUE EXPRESSIF** (dénomination)
- Apparition des premiers mots attendue vers 12-15 mois, premières phrases vers 24 mois, lexique de 300-500 mots à 3 ans.
- Pas de mots à 24 mois = signalement immédiat recommandé.

**COMPRÉHENSION / PRODUCTION MORPHOSYNTAXIQUE**
- Clé du diagnostic différentiel TDL.
- Enfant de 4-5 ans incapable de produire des phrases sujet-verbe-complément → alerte.

**PHONOLOGIE**
- Erreurs phonologiques attendues jusqu'à 4 ans (maturation normale).
- Persistance après 5 ans = trouble phonologique spécifique.
- Simplifications sévères, absence de certaines classes phonémiques = signe de trouble sévère.

**PRAGMATIQUE**
- Intérêt pour autrui, ajustement en interaction, initiations de communication.
- Déficit associé à déficit communicatif précoce → renforce l'hypothèse TSA.

#### 🎯 PROFILS TYPES

**Profil 1 — Retard de langage simple (2-3 ans)**
- Acquisitions tardives mais communication + interaction préservées
- Profil homogène sous la norme
- **Interprétation** : guidance parentale intensive, bain de langage, réévaluation à 6 mois. Si pas de rattrapage à 3 ans → PEC.

**Profil 2 — TDL spécifique (3-6 ans)**
- Langage oral multi-composantes déficitaire
- Communication et interaction préservées
- Décalage net par rapport aux pairs
- **Interprétation** : PEC orthophonique hebdomadaire, orientation CRTLA si sévère.

**Profil 3 — Alerte TSA (tout âge)**
- Communication précoce : Déficitaire à Pathologique
- Pragmatique : Déficitaire
- Intérêt pour autrui réduit, stéréotypies possibles
- **Interprétation** : **orientation urgente vers le CRA** (Centre Ressource Autisme) ou consultation pédopsychiatrique. Ne pas rester sur un diagnostic de TDL simple.

**Profil 4 — TDL sévère + comorbidité motrice**
- Profil langagier très atteint
- Retard psychomoteur rapporté
- **Interprétation** : orientation CAMSP, bilan pluridisciplinaire (psychomot, ergo, psychologue).

#### ARTICULATION
- **Alternative / complément** : BILO 3-6, N-EEL.
- **Si suspicion TSA** : ADOS-2, CARS, orientation CRA.
- **Si suspicion retard global** : bilan psychologique (WPPSI-IV dès 2;6 ans), consultation neuropédiatrique.
- **ORL systématique** : otites séro-muqueuses fréquentes à cet âge, à éliminer en premier.

#### RECOMMANDATIONS TYPES
- Guidance parentale **systématique** à tout âge (lecture partagée, interactions verbales, limitation écrans).
- PEC hebdomadaire dès 3 ans si TDL confirmé, 30 min.
- Orientation CAMSP ou CMP si ressources famille limitées.
- Coordination avec la PMI, la crèche ou l'école maternelle.
- Suivi longitudinal indispensable : les difficultés évoluent, la réévaluation à 6 mois est la règle.`,
}
