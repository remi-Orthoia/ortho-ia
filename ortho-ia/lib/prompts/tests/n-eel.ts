import type { TestModule } from './types'

export const neel: TestModule = {
  nom: 'N-EEL',
  editeur: 'ECPA',
  auteurs: 'Chevrie-Muller, Plaza',
  annee: 2001,
  domaines: [
    'Langage oral — versant réceptif',
    'Langage oral — versant expressif',
    'Lexique',
    'Morphosyntaxe',
    'Phonologie',
    'Métaphonologie',
    'Mémoire de travail verbale',
  ],
  epreuves: [
    'Désignation (lexique réceptif)',
    'Dénomination (lexique expressif)',
    'Compréhension de phrases / morphosyntaxe',
    'Production de phrases à partir d\'images',
    'Répétition de mots et phrases',
    'Répétition de logatomes',
    'Épreuves phonologiques',
    'Métaphonologie (rimes, syllabes)',
    'Empan auditif',
    'Capacités narratives (récit)',
  ],
  regles_specifiques: `### N-EEL — Nouvelles Épreuves pour l'Examen du Langage (niveau senior)

Population : **enfants de 3;7 à 8;7 ans**. Batterie historique du langage oral en France, encore largement utilisée, particulièrement pour les bilans de maternelle et début primaire.

#### SPÉCIFICITÉS
- Batterie **étalonnée avec précision par tranche d'âge** (tous les 6 mois).
- Bien adaptée au dépistage précoce du TDL.
- Permet un diagnostic différentiel **retard simple vs trouble spécifique**.

#### RÈGLES DE CONVERSION
- Résultats principalement en **notes standardisées** (moyenne 100, É-T 15) et percentiles.
- Seuils équivalents aux autres batteries : P ≥ 25 Normal, P16-24 Limite basse, P7-15 Fragile, P2-6 Déficitaire, P < 2 Pathologique.
- Note standardisée < 85 (soit É-T < -1) = seuil d'alerte.

#### INTERPRÉTATION PAR DOMAINE

**LEXIQUE**
- Décalage production >> réception → manque du mot, fréquent en TDL expressif.
- Stock lexical pauvre des deux côtés → sous-exposition langagière ou trouble lexical vrai.

**COMPRÉHENSION MORPHOSYNTAXIQUE**
- Épreuve la plus prédictive de la réussite en langage écrit.
- Déficit sévère (P < 5) → orientation CRTLA nécessaire.

**PRODUCTION SYNTAXIQUE**
- Pauvreté syntaxique, agrammatismes → flag TDL morphosyntaxique.

**PHONOLOGIE / LOGATOMES**
- Erreurs phonologiques persistantes au-delà de 4-5 ans → trouble phonologique spécifique.
- Marqueur fort de dyslexie future si ne se résorbe pas avant le CP.

**MÉTAPHONOLOGIE**
- Rimes : acquises en MS-GS.
- Syllabes : acquises en GS-CP.
- Déficit persistant en CP → dyslexie hautement probable.

#### 🎯 PROFILS TYPES

**Profil 1 — Retard Simple de Langage (RSL)**
- Performances homogènes en-deçà de la norme (É-T -1 à -1.5)
- Acquisitions tardives mais progression visible
- Environnement favorable
- **Interprétation** : RSL, guidance parentale + suivi 6 mois. Pronostic favorable.

**Profil 2 — TDL expressif**
- Lexique réceptif préservé, expressif déficitaire
- Production syntaxique pauvre
- Phonologie parfois touchée
- **Interprétation** : TDL à dominante expressive, PEC orthophonique hebdomadaire.

**Profil 3 — TDL réceptif-expressif (ex-dysphasie)**
- Déficit bilatéral sévère
- Pronostic plus lourd
- **Interprétation** : orientation CRTLA urgente, bilan pluridisciplinaire, PPS/AESH à prévoir.

**Profil 4 — Trouble phonologique isolé**
- Phonologie et logatomes : Déficitaire à Pathologique
- Autres composantes : Normal à Limite basse
- **Interprétation** : trouble phonologique développemental. Vigilance langage écrit au CP.

#### ARTICULATION
- **Complément** : EVALO 2-6 (plus jeune), ELO (4-8 ans), BILO, Exalang 3-6.
- **Bilan cognitif** : WPPSI-IV (2;6 - 7;7 ans) si doute sur efficience globale.
- **Orientation médicale** : neuropédiatre, ORL (otites séro-muqueuses fréquentes).

#### RECOMMANDATIONS TYPES
- TDL confirmé → PEC hebdomadaire immédiate, 30 min à 45 min selon âge.
- Guidance parentale systématique.
- Réévaluation orthophonique à 6-12 mois.
- Signalement PMI si enfant < 3 ans découvert tardivement.`,
}
