import type { TestModule } from './types'

export const elo: TestModule = {
  nom: 'ELO',
  editeur: 'ECPA',
  auteurs: 'Khomsi',
  annee: 2001,
  domaines: [
    'Langage oral réceptif',
    'Langage oral expressif',
    'Lexique',
    'Morphosyntaxe',
    'Phonologie',
  ],
  epreuves: [
    'Lexique en réception (désignation)',
    'Lexique en production (dénomination)',
    'Compréhension morphosyntaxique',
    'Production morphosyntaxique (complétion de phrases)',
    'Répétition de phrases',
    'Production de phrases sur image',
    'Phonologie — discrimination / production',
  ],
  regles_specifiques: `### ELO — Évaluation du Langage Oral (niveau senior)

Population : **enfants de 3 à 11 ans**. Batterie rapide (30-45 min), largement utilisée en cabinet libéral et au CMP pour le dépistage des troubles du langage oral, particulièrement adaptée au dépistage de première intention.

#### SPÉCIFICITÉS
- **Batterie rapide et bien étalonnée** (France, 2001).
- Permet un profil langagier rapide avant d'éventuels examens approfondis.
- Idéale en première intention au cabinet.

#### RÈGLES DE CONVERSION
- Résultats en **centiles** et **É-T**.
- Utiliser les centiles fournis directement, ne pas recalculer depuis les É-T.
- Seuils : P ≥ 25 Normal, P16-24 Limite basse, P7-15 Fragile, P2-6 Déficitaire, P < 2 Pathologique.

#### INTERPRÉTATION PAR DOMAINE

**LEXIQUE RÉCEPTIF**
- Désignation d'images.
- Déficit isolé → hypothèse trouble lexical ou sous-exposition langagière.

**LEXIQUE EXPRESSIF**
- Dénomination d'images.
- Décalage réceptif >> expressif → manque du mot.
- À croiser avec l'environnement familial (multilinguisme, non-francophonie récente).

**COMPRÉHENSION MORPHOSYNTAXIQUE**
- Test clé : compréhension des structures syntaxiques complexes (passif, relatives, etc.).
- Déficit sévère → marqueur de TDL, orientation CRTLA.

**PRODUCTION MORPHOSYNTAXIQUE**
- Complétion de phrases : évalue la maîtrise des morphèmes grammaticaux.
- Pauvreté syntaxique → TDL expressif probable.

**RÉPÉTITION DE PHRASES**
- Teste la mémoire verbale + la capacité à maintenir les structures syntaxiques.
- Performance faible → marqueur composite de l'ensemble des compétences langagières.

**PHONOLOGIE**
- Discrimination et production phonémique.
- Erreurs persistantes après 4 ans → trouble phonologique.

#### 🎯 PROFILS TYPES

**Profil 1 — Retard simple du langage (3-5 ans)**
- Profil homogène sous la norme (É-T -1 à -1.5)
- Enfant évoluant favorablement avec stimulation
- **Interprétation** : guidance parentale + réévaluation à 6 mois.

**Profil 2 — Trouble phonologique isolé**
- Phonologie : Déficitaire
- Autres composantes : Normal à Limite basse
- **Interprétation** : trouble phonologique. PEC hebdomadaire. Vigilance métaphonologie au CP.

**Profil 3 — TDL léger à modéré**
- Lexique + morphosyntaxe : Fragile à Déficitaire
- Phonologie : Limite basse à Fragile
- Retard de parole et de langage signalé dès la maternelle
- **Interprétation** : TDL, PEC hebdomadaire, suivi longitudinal.

**Profil 4 — TDL sévère (ex-dysphasie)**
- Déficits bilatéraux marqués (Pathologique sur plusieurs composantes)
- Retentissement scolaire majeur
- **Interprétation** : orientation CRTLA / CAMSP urgent. PPS à anticiper.

#### ARTICULATION
- **Complément** : BILO (plus exhaustif), N-EEL, EVALO 2-6 (pour les 2-6 ans).
- **Approfondissement** : EVALEO 6-15, Exalang 5-8 si langage écrit à explorer.
- **Cognitif** : WPPSI-IV ou WISC-V selon l'âge.

#### RECOMMANDATIONS TYPES
- Retard simple (< 5 ans) : guidance + suivi 6 mois sans PEC formalisée systématique.
- TDL confirmé : PEC hebdomadaire, 30-45 min selon âge, durée minimum 24 mois.
- Suivi préventif au CP pour tous les enfants avec historique de TDL (risque dyslexie).
- Coordination avec le médecin scolaire et l'enseignant·e.`,
}
