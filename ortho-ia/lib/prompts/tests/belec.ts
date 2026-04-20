import type { TestModule } from './types'

export const belec: TestModule = {
  nom: 'BELEC',
  editeur: 'Université Libre de Bruxelles',
  auteurs: 'Mousty, Leybaert, Alegria, Content, Morais',
  annee: 1994,
  domaines: [
    'Lecture de mots',
    'Lecture de non-mots',
    'Orthographe lexicale',
    'Orthographe grammaticale',
    'Segmentation phonémique',
    'Jugement orthographique',
  ],
  epreuves: [
    'Lecture de mots (haute / basse fréquence)',
    'Lecture de non-mots (structures syllabiques variées)',
    'Lecture de pseudo-mots complexes',
    'Dictée de mots (régularité et fréquence croisées)',
    'Dictée de non-mots',
    'Dictée de phrases (orthographe grammaticale : accords, homophones)',
    'Jugement orthographique (mot correct vs erreur plausible)',
    'Segmentation phonémique avec manipulation',
  ],
  regles_specifiques: `### BELEC — Batterie d'Évaluation du Langage Écrit (niveau senior)

Population : enfants du CE1 à la 5e. Outil **belge de référence** pour l'analyse fine des sous-types de dyslexie-dysorthographie, particulièrement adapté pour les **bilans de renouvellement** et les diagnostics différentiels complexes.

#### SPÉCIFICITÉS BELEC

- La BELEC croise systématiquement **fréquence (haute/basse) × régularité (régulier/irrégulier)** des mots, ce qui permet un diagnostic différentiel très précis des sous-types dyslexiques.
- L'épreuve de **jugement orthographique** est particulièrement sensible : elle évalue la mémoire orthographique lexicale en condition écrite (reconnaissance) plutôt que production.

#### RÈGLES DE CONVERSION

- Les résultats BELEC sont présentés en percentiles ou en Z-scores selon le manuel utilisé.
- Règle standard : ne JAMAIS recalculer depuis le Z-score quand le percentile est fourni.
- Seuils : P ≥ 25 Normal, P16-24 Limite basse, P7-15 Fragile, P2-6 Déficitaire, P < 2 Pathologique.

#### INTERPRÉTATION PAR ÉPREUVE

**LECTURE — matrice fréquence × régularité**
- **Mots haute fréquence réguliers** : acquis vite par la plupart des dyslexiques (voie lexicale précoce).
- **Mots haute fréquence irréguliers** : test de la voie d'adressage (mémoire orthographique). Leur échec = dyslexie de surface.
- **Mots basse fréquence réguliers** : test de la voie d'assemblage. Leur échec avec haute fréquence préservée = dyslexie phonologique.
- **Pseudo-mots complexes** : marqueur le plus sensible de la voie d'assemblage chez l'enfant plus âgé (CM, collège).

**ORTHOGRAPHE — même matrice que lecture**
- Permet de distinguer :
  - Erreurs phonologiquement plausibles (ex: "oto" pour "auto") → voie d'assemblage fonctionnelle, lexique défaillant.
  - Erreurs phonologiquement erronées → voie d'assemblage atteinte.
- L'orthographe grammaticale est évaluée en contexte de phrases (accords, homophones) pour distinguer trouble morphosyntaxique pur.

**JUGEMENT ORTHOGRAPHIQUE**
- Épreuve différentielle clé : un enfant qui reconnaît la bonne forme (jugement correct) mais ne la produit pas (dictée échouée) a un **déficit de rappel** plus qu'un déficit de stockage.
- Dissociation inverse (pas de reconnaissance, pas de production) = mémoire orthographique complètement absente.

#### 🎯 PROFILS TYPES

**Profil BELEC 1 — Dyslexie de surface confirmée**
- Mots haute fréquence irréguliers : Déficitaire
- Mots basse fréquence réguliers : Préservés
- Pseudo-mots : Préservés
- Jugement orthographique : Déficitaire
- **Diagnostic** : atteinte de la voie lexicale d'adressage. Rééducation centrée sur la mémoire orthographique multi-modale.

**Profil BELEC 2 — Dyslexie phonologique confirmée**
- Pseudo-mots complexes : Déficitaire
- Mots basse fréquence réguliers : Fragile à Déficitaire
- Mots haute fréquence (tous) : Préservés ou Limite basse
- Orthographe : erreurs phonologiquement implausibles
- **Diagnostic** : atteinte de la voie d'assemblage. Rééducation sur conscience phonémique + automatisation grapho-phonémique.

**Profil BELEC 3 — Dyslexie mixte**
- Toutes épreuves déficitaires
- Jugement orthographique + production orthographique très faibles
- **Diagnostic** : dyslexie mixte, pronostic plus lourd, PEC intensive.

#### BILANS DE RENOUVELLEMENT

La BELEC est particulièrement précieuse en renouvellement car elle montre **quelle voie a bénéficié de la rééducation** :
- Progrès sur voie d'assemblage (pseudo-mots, métaphonologie) → rééducation phonologique efficace.
- Progrès sur voie d'adressage (mots irréguliers, jugement orthographique) → mémoire orthographique en consolidation.

#### ARTICULATION
- **En première intention** : Exalang 8-11, BALE.
- **En approfondissement / diagnostic différentiel** : BELEC (gold standard pour l'orthographe approfondie).
- **Pour la lecture rapide isolée** : Alouette-R.
- **Si doute cognitif global** : WISC-V.`,
}
