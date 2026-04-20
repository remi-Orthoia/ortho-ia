import type { TestModule } from './types'

export const bale: TestModule = {
  nom: 'BALE',
  editeur: 'Grenoble Sciences',
  auteurs: 'Jacquier-Roux, Lequette, Pouget, Valdois, Zorman',
  annee: 2010,
  domaines: [
    'Langage écrit — lecture',
    'Langage écrit — orthographe',
    'Métaphonologie',
    'Identification visuelle',
    'Mémoire de travail verbale',
    'Attention visuelle',
  ],
  epreuves: [
    'Lecture de mots réguliers',
    'Lecture de mots irréguliers',
    'Lecture de non-mots',
    'Leximétrie (texte Alouette ou équivalent)',
    'Dictée de mots réguliers',
    'Dictée de mots irréguliers',
    'Dictée de non-mots',
    'Copie de texte',
    'Segmentation syllabique',
    'Segmentation phonémique',
    'Suppression de phonèmes',
    'Épreuves de discrimination visuelle / empan visuo-attentionnel',
    'Mémoire de travail phonologique (empan endroit/envers)',
  ],
  regles_specifiques: `### BALE — Batterie Analytique du Langage Écrit (niveau senior)

Population : enfants du CE1 au CM2, parfois utilisé jusqu'en 6e. Particulièrement pertinente pour le diagnostic différentiel des **sous-types de dyslexie** (phonologique / surface / mixte) grâce à son analyse fine des voies de lecture et de la vision attentionnelle.

#### RÈGLES DE CONVERSION

La BALE utilise une **notation en percentiles et en Z-scores**. Les percentiles sont donnés directement (ex: P10, P25, P50) et doivent être utilisés tels quels. Les Z-scores (= É-T) sont convertibles via les tables fournies dans le manuel.

- Les percentiles fournis sont à utiliser directement, **JAMAIS** recalculer depuis le Z-score.
- Seuils officiels habituels : P ≥ 25 Normal, P16-24 Limite basse, P7-15 Fragile, P2-6 Déficitaire, P < 2 Pathologique.

#### INTERPRÉTATION PAR ÉPREUVE

**LECTURE** — clé du diagnostic différentiel
- **Mots réguliers vs irréguliers vs non-mots** :
  - Mots fréquents préservés + non-mots déficitaires → **dyslexie phonologique** (voie d'assemblage).
  - Mots irréguliers déficitaires + non-mots préservés → **dyslexie de surface** (voie d'adressage, mémoire orthographique faible).
  - Les deux voies touchées → **dyslexie mixte**, plus sévère.
- **Leximétrie** : la BALE utilise parfois le texte Alouette ou un équivalent. Vitesse normale CE1 = 70-90 mots/min ; CE2 = 90-120 ; CM1 = 110-140 ; CM2 = 130-160.
- **Vitesse déficitaire + exactitude préservée** → trouble d'automatisation (sous-lexical), typique des dyslexiques après rééducation prolongée.

**DICTÉE**
- Analyse qualitative fondamentale :
  - Erreurs phonologiques (omissions, inversions, substitutions) → voie d'assemblage immature.
  - Erreurs lexicales (mots irréguliers mal orthographiés) → voie d'adressage immature, faible mémoire orthographique.
  - Erreurs grammaticales (accords sujet-verbe, pluriels, homophones) → fragilité morphosyntaxique.
- La BALE permet de calculer le **ratio phono/lexical** des erreurs, marqueur clé du sous-type dyslexique.

**MÉTAPHONOLOGIE**
- Segmentation syllabique : acquise en GS-CP. Échec au CP ou au-delà → flag.
- Segmentation phonémique : acquise en CP-CE1. Échec persistant au CE1 → marqueur fort de dyslexie phonologique.
- Suppression de phonèmes : la plus sensible des trois épreuves.

**MÉMOIRE DE TRAVAIL VERBALE**
- Empan endroit faible → boucle phonologique (Baddeley) fragile, impact sur lecture de non-mots.
- Empan envers très inférieur à l'endroit → trouble administrateur central, possible TDAH.

**ATTENTION VISUELLE** (spécificité BALE)
- Épreuve d'empan visuo-attentionnel : mesure le nombre de lettres perçues simultanément.
- Déficit → hypothèse du trouble visuo-attentionnel (Valdois), forme spécifique de dyslexie mixte chez certains enfants.
- Si présent : orientation vers bilan orthoptique et/ou neuropsy visuo-spatial.

#### 🎯 PROFILS TYPES

**Profil A — Dyslexie phonologique (la plus fréquente)**
- Non-mots : Déficitaire
- Métaphonologie : Déficitaire
- Mots irréguliers : Préservés ou Limite basse
- Dictée : erreurs phonologiques dominantes
- **Diagnostic** : dyslexie-dysorthographie développementale de type phonologique.

**Profil B — Dyslexie de surface**
- Mots irréguliers : Déficitaire
- Non-mots : Préservés ou Limite basse
- Dictée : erreurs lexicales dominantes (orthographe erronée sur mots fréquents)
- Métaphonologie souvent préservée
- **Diagnostic** : dyslexie-dysorthographie développementale de type surface.

**Profil C — Dyslexie mixte avec trouble visuo-attentionnel**
- Toutes voies déficitaires + empan visuo-attentionnel faible
- Orientation complémentaire orthoptie + neuropsy visuo-spatial.

#### ARTICULATION AVEC D'AUTRES OUTILS
- **Complément / alternative** : Exalang 8-11 ou 11-15 (plus large), ODEDYS (dépistage rapide), Alouette-R (leximétrie seule), BELEC (orthographe approfondie).
- **Attention** : BRIEF, NEPSY-II, TEA-Ch via neuropsy si TDAH associé suspecté.
- **Cognitif global** : WISC-V si bilan lourd envisagé.

#### RECOMMANDATIONS TYPES
- Rééducation hebdomadaire 30-45 min, 24-36 séances pour un profil phonologique ; plus intensive pour un profil mixte.
- Travail ciblé sur la voie déficitaire (phonologique = conscience phonémique + assemblage ; surface = mémoire orthographique + mots fréquents).
- PAP + temps majoré 1/3 systématique.`,
}
