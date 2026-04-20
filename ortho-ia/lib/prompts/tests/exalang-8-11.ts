import type { TestModule } from './types'

export const exalang811: TestModule = {
  nom: 'Exalang 8-11',
  editeur: 'HappyNeuron',
  auteurs: 'Helloin, Lenfant, Thibault',
  annee: 2012,
  domaines: [
    'Langage oral',
    'Langage écrit',
    'Mémoire de travail',
    'Métaphonologie',
    'Accès lexical',
    'Compréhension',
  ],
  epreuves: [
    'Empan auditif (endroit / envers)',
    'Répétition de logatomes',
    'Métaphonologie (acronymes, rimes)',
    'Fluences (phonétique, sémantique)',
    'Décision lexico-morphologique',
    'Compréhension de phrases',
    'Lecture de mots / non-mots',
    'Leximétrie (lecture chronométrée)',
    'Closure de texte',
    'DRA (Dictée de Rédaction Abrégée)',
  ],
  regles_specifiques: `### EXALANG 8-11 — Règles cliniques détaillées

#### Règles de conversion
- Les résultats sont présentés avec une notation en **quartiles** (Q1, Med, Q3) dans la colonne "Percentiles".
- Conversion obligatoire : **Q1 → P25**, **Med → P50**, **Q3 → P75**.
- Les valeurs explicites P5, P10, P90, P95 sont à utiliser telles quelles.
- Ne JAMAIS recalculer un percentile depuis l'É-T : les normes du test priment sur la distribution gaussienne théorique.
- Exemple typique : "Boucle phonologique : É-T -1.53, Q1" → Percentile = P25 → Interprétation **Normal**.

#### Meilleures pratiques cliniques par épreuve

**Empan auditif** (mémoire de travail phonologique) :
- Empan endroit déficitaire isolé → évocateur d'une fragilité de la **boucle phonologique** (Baddeley).
- Empan envers déficitaire → davantage en faveur d'un trouble de **l'administrateur central** (fonctions exécutives).
- Croiser systématiquement avec la répétition de logatomes pour confirmer une atteinte phonologique.

**Répétition de logatomes** :
- Erreur type : élisions, substitutions, inversions → signer un trouble phonologique.
- Performance faible + empan faible → forte présomption de trouble de la boucle phonologique.
- Préciser les longueurs échouées (3, 4, 5 syllabes) pour orienter la prise en charge (travail en paliers progressifs).

**Métaphonologie** :
- Épreuve **prédictive** du langage écrit (lecture/orthographe).
- Déficit en métaphonologie à 8-9 ans → marqueur **fort** de dyslexie développementale.
- Même en l'absence de plainte scolaire, un déficit métaphonologique isolé justifie un suivi préventif.

**Fluences** :
- Fluence phonétique (lettre) > sémantique → plutôt profil **dysexécutif** (flexibilité, récupération stratégique).
- Fluence sémantique > phonétique → plutôt trouble **lexical** ou organisation sémantique.
- Comparer les pentes temporelles (15s / 30s / 45s / 60s) : une chute rapide évoque un épuisement attentionnel.

**Lecture de mots / non-mots** :
- Lecture de mots fluide + lecture de non-mots déficitaire → **voie d'adressage** préservée, **voie d'assemblage** déficitaire (dyslexie phonologique).
- Lecture de non-mots fluide + mots fréquents/irréguliers déficitaires → voie d'assemblage préservée, voie d'adressage déficitaire (dyslexie de surface).
- Dyslexie mixte si les deux voies sont touchées.

**Leximétrie (vitesse de lecture)** :
- Seuils indicatifs CE2 : environ 90-120 mots/min pour un lecteur normolecteur.
- Vitesse déficitaire + exactitude conservée → évocateur d'un trouble **d'automatisation** (sous-lexical).
- Toujours croiser vitesse ET compréhension : une lecture rapide mais sans compréhension oriente vers un trouble **pragmatique / attentionnel**.

**Closure de texte / Compréhension** :
- Déficit isolé en closure (avec bonne lecture mécanique) → évocateur d'un **trouble de la compréhension écrite** ou trouble pragmatique.
- Toujours questionner la compréhension orale en parallèle pour distinguer trouble spécifique écrit vs trouble global du langage.

**DRA (Dictée de Rédaction Abrégée)** :
- Analyse qualitative des erreurs :
  - **Phonologiques** (omissions, inversions) → voie d'assemblage immature.
  - **Lexicales** (irréguliers mal orthographiés) → voie d'adressage immature, faible mémoire orthographique.
  - **Grammaticales** (accords) → fragilité morphosyntaxique, souvent associée.
- Compter les types d'erreurs dominantes plutôt que le nombre total.

#### Points d'attention rédactionnels

- **Ne pas conclure à une dyslexie / dysorthographie sur un bilan isolé** avant le milieu du CE1 (février minimum). L'écart doit être significatif ET persistant.
- Si déficit limité à un domaine, proposer une **réévaluation à 6 mois** avant de conclure à un trouble spécifique.
- Toujours recommander un bilan ophtalmologique et ORL à jour si non réalisés.
- Coupler à un bilan psychométrique (WISC-V) si suspicion de trouble associé (TDAH, haut potentiel, trouble cognitif global).

#### Articulation avec d'autres outils
- **En amont** : Exalang 5-8 pour profil pré-scolaire / CP.
- **En aval** : Exalang 11-15 pour collège.
- **Complément écrit** : BALE, ODEDYS, Alouette-R, BELEC pour l'orthographe approfondie.
- **Complément calcul** : Examath si suspicion de trouble associé.
- **Complément mémoire/exécutif** : NEPSY-II, CMS, BRIEF (parent/enseignant).`,
}
