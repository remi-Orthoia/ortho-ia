import type { TestModule } from './types'

export const bilo: TestModule = {
  nom: 'BILO',
  editeur: 'OrthoMotus',
  auteurs: 'Khomsi, Khomsi, Pasquet, Parbeau-Guéno',
  annee: 2007,
  domaines: [
    'Langage oral réceptif',
    'Langage oral expressif',
    'Lexique',
    'Morphosyntaxe',
    'Phonologie',
    'Métalinguistique',
    'Langage écrit (émergence)',
  ],
  epreuves: [
    'Désignation d\'images (lexique réceptif)',
    'Dénomination d\'images (lexique expressif)',
    'Compréhension de phrases (morphosyntaxique)',
    'Production syntaxique (récit, génération de phrases)',
    'Répétition de mots et phrases',
    'Répétition de logatomes',
    'Épreuves phonologiques (inventaire phonémique, pertes phonèmes)',
    'Métaphonologie (rimes, syllabes)',
    'Lecture (niveau CP-CE1 quand applicable)',
    'Écriture / transcription',
    'Épreuves narratives (structuration du récit)',
  ],
  regles_specifiques: `### BILO — Bilan Informatisé du Langage Oral (niveau senior)

Population : enfants de **3 ans à 12 ans** selon les versions (BILO-1 pour 3-6 ans, BILO-2 pour 6-8 ans, BILO-3 pour 8-12 ans). Batterie complète étalonnée sur la France, particulièrement adaptée au dépistage précoce des **Troubles Développementaux du Langage (TDL)**.

#### SPÉCIFICITÉS
- Exploration fine du versant réceptif ET expressif du langage oral.
- Recommandée par la HAS pour les bilans de langage chez les jeunes enfants.
- Profil langagier multi-composantes (lexique, morphosyntaxe, phonologie).

#### RÈGLES DE CONVERSION
- Résultats en **notes standardisées** ou **percentiles** selon la version/version du manuel.
- Percentiles directs à utiliser quand disponibles.
- Pour les notes standardisées : conversion via table officielle, ne **jamais recalculer à la volée**.
- Seuils standards : P ≥ 25 Normal, P16-24 Limite basse, P7-15 Fragile, P2-6 Déficitaire, P < 2 Pathologique.

#### INTERPRÉTATION PAR DOMAINE

**LEXIQUE RÉCEPTIF** — désignation d'images
- Mesure le stock lexical passif.
- Déficit isolé → hypothèse TDL à dominante lexicale.
- Croiser avec l'environnement : multilinguisme, sous-exposition langagière (non pathologique).

**LEXIQUE EXPRESSIF** — dénomination
- Mesure l'accès lexical en production.
- Décalage important réceptif >> expressif → **manque du mot** fréquent, oriente vers TDL expressif.

**COMPRÉHENSION MORPHOSYNTAXIQUE**
- Très prédictive de la compréhension écrite future.
- Déficit sévère → flag majeur pour TDL, orientation CRTLA.

**PRODUCTION SYNTAXIQUE / RÉCIT**
- Récits pauvres, ellipses, agrammatismes → tableau TDL.

**PHONOLOGIE / LOGATOMES**
- Marqueur fort et précoce des difficultés phonologiques futures (dyslexie).
- Déficit persistant en CP → dyslexie hautement probable.

**MÉTAPHONOLOGIE**
- Épreuve prédictive clé du langage écrit.
- Déficit en GS-CP → vigilance accrue, rééducation préventive justifiée.

#### 🎯 PROFILS TYPES

**Profil 1 — Retard Simple de Langage**
- Lexique : Fragile à Limite basse
- Morphosyntaxe : Fragile
- Phonologie : Limite basse
- Profil homogène, écarts modérés, environnement favorable
- **Interprétation** : retard simple, pronostic favorable avec guidance + suivi 6 mois.

**Profil 2 — TDL à dominante phonologique**
- Phonologie et répétition logatomes : Déficitaire à Pathologique
- Métaphonologie : Déficitaire
- Lexique et morphosyntaxe relativement préservés
- **Interprétation** : TDL phonologique. PEC orthophonique hebdomadaire, attention future langage écrit.

**Profil 3 — TDL sémantico-syntaxique (ex-dysphasie réceptive)**
- Lexique réceptif : Déficitaire
- Compréhension morphosyntaxique : Déficitaire
- Expression syntaxique pauvre, agrammatismes
- Phonologie relativement préservée
- **Interprétation** : TDL à prédominance morphosyntaxique. Orientation **CRTLA** fortement indiquée. PPS/AESH souvent nécessaires.

**Profil 4 — TDL sévère / mixte**
- Toutes composantes Déficitaire à Pathologique
- Retentissement scolaire majeur, troubles associés possibles
- **Interprétation** : TDL sévère. Bilan pluridisciplinaire en centre de référence (CRTLA / CAMSP / CMPP) urgent.

#### ARTICULATION
- **Complément** : ELO (rapide, 4-8 ans), N-EEL, EVALO 2-6, Exalang 3-6/5-8.
- **Cognitif** : WPPSI-IV (2-7 ans), WISC-V (6+).
- **Médical** : neuropédiatre, orthoptie, bilan ORL systématique.

#### RECOMMANDATIONS
- Enfant BILO déficitaire sur 2+ composantes → PEC hebdomadaire immédiate.
- TDL sévère → PEC intensive (2 séances/semaine), orientation CRTLA.
- Guidance parentale systématique (bain de langage, lecture partagée, évitement écrans).
- MDPH à anticiper si SESSAD/CLIS envisagé.`,
}
