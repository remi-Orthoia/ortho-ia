import type { TestModule } from './types'

export const evaleo615: TestModule = {
  nom: 'EVALEO 6-15',
  editeur: 'Ortho Édition',
  auteurs: 'Launay, Maeder, Roustit, Touzin',
  annee: 2018,
  domaines: [
    'Langage oral — lexique',
    'Langage oral — morphosyntaxe',
    'Langage oral — pragmatique',
    'Langage écrit — lecture',
    'Langage écrit — orthographe',
    'Métalinguistique',
    'Raisonnement verbal',
    'Mémoire de travail verbale',
  ],
  epreuves: [
    'Vocabulaire en réception',
    'Vocabulaire en production (dénomination)',
    'Compréhension morphosyntaxique',
    'Production morphosyntaxique (récit / phrases)',
    'Répétition de phrases',
    'Répétition de logatomes',
    'Métaphonologie (rimes, syllabes, phonèmes)',
    'Lecture de mots / non-mots',
    'Leximétrie',
    'Compréhension écrite (texte court et long)',
    'Orthographe lexicale et grammaticale (dictée)',
    'Production écrite',
    'Raisonnement verbal (inférences, analogies)',
  ],
  regles_specifiques: `### EVALEO 6-15 — Évaluation du Langage Oral et Écrit de 6 à 15 ans (niveau senior)

Population : du **CP à la 3e** (couverture large unique dans le paysage français). Batterie récente (2018) intégrant les recommandations HAS et FNO, conçue pour un bilan complet oral + écrit permettant le diagnostic différentiel entre TDL, dyslexie, dyscalculie associée, trouble pragmatique.

#### SPÉCIFICITÉS
- **Couverture large** sur toute la scolarité obligatoire, évite de changer d'outil à chaque palier.
- **Étalonnage récent** (français, 2018), normes à jour.
- Inclut une **dimension pragmatique** (peu évaluée par d'autres batteries).
- Propose une **cotation informatisée** avec profil visuel et écarts normalisés.

#### RÈGLES DE CONVERSION
- Résultats en percentiles directs OU notes standardisées.
- Respect strict des percentiles fournis, pas de recalcul depuis l'É-T.
- Seuils : P ≥ 25 Normal, P16-24 Limite basse, P7-15 Fragile, P2-6 Déficitaire, P < 2 Pathologique.

#### INTERPRÉTATION PAR DOMAINE

**LANGAGE ORAL LEXICAL**
- Vocabulaire réceptif déficitaire + expressif préservé → sous-exposition possible (multilinguisme).
- Les deux déficitaires → trouble lexical vrai, possible TDL ou anomie.

**LANGAGE ORAL MORPHOSYNTAXIQUE**
- Compréhension : prédictive de la compréhension écrite.
- Production : pauvreté syntaxique = marqueur TDL.

**LANGAGE ORAL PRAGMATIQUE**
- Déficit pragmatique isolé → orientation vers **trouble de la communication sociale** (TCL, spectre autistique, TCL de haut niveau).

**LANGAGE ÉCRIT LECTURE**
- Pattern classique des voies de lecture comme pour BALE/Exalang.
- Leximétrie : seuils CP-CE1 = 70-90 mots/min ; CE2 = 90-120 ; CM = 110-160 ; 6e-3e = 140-220.

**ORTHOGRAPHE**
- Lexicale (mots irréguliers) vs grammaticale (accords, homophones).
- Permet le diagnostic du sous-type dysorthographique.

**RAISONNEMENT VERBAL**
- Inférences, analogies.
- Déficit isolé → hypothèse **hyperlexie inversée** (décodage OK, compréhension en échec) : à creuser neuropsy.

#### 🎯 PROFILS TYPES

**Profil EVALEO 1 — TDL isolé (CP-CE1)**
- Langage oral : Déficitaire (lexique, morphosyntaxe)
- Langage écrit : immature (en phase d'acquisition)
- Pragmatique préservée
- **Interprétation** : TDL à prédominance morphosyntaxique. Orientation CRTLA.

**Profil EVALEO 2 — Dyslexie-dysorthographie développementale**
- Langage oral : Normal à Limite basse
- Métaphonologie + non-mots + leximétrie : Déficitaire
- Orthographe : Déficitaire (ratio phono/lexical selon sous-type)
- **Interprétation** : dyslexie-dysorthographie. Déclinaison phonologique/surface/mixte selon pattern.

**Profil EVALEO 3 — Trouble pragmatique isolé (spectre)**
- Lexique et morphosyntaxe : Normal
- Pragmatique : Déficitaire
- Compréhension écrite inférentielle : Déficitaire
- Raisonnement verbal (analogies, métaphores) : Déficitaire
- **Interprétation** : profil **compatible avec un trouble de la communication sociale**, orientation bilan pluridisciplinaire (neuropsy + pédopsy) pour préciser.

**Profil EVALEO 4 — Trouble cognitif global**
- Déficits homogènes sur toutes dimensions
- Pattern compatible avec QI faible → orienter vers WISC-V avant conclusion orthophonique.

#### ARTICULATION
- Batterie complète utilisable en **autonomie** pour un bilan oral + écrit.
- Peut être complétée par : BELEC (orthographe fine), Examath (si dyscalculie associée), MoCA/BETL (adolescents/jeunes adultes fragilisés).
- Cognitif : WISC-V systématique si profil très hétérogène ou suspicion trouble global.

#### RECOMMANDATIONS TYPES
- PEC hebdomadaire 45 min sur la composante la plus déficitaire.
- PAP pour toute dyslexie / TDL confirmé.
- PPS/MDPH pour profils sévères ou troubles associés.
- Orientation pluridisciplinaire si pragmatique touchée.`,
}
