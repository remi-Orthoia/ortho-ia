import type { TestModule } from './types'

export const betl: TestModule = {
  nom: 'BETL',
  editeur: 'Ortho Édition',
  auteurs: 'Lemaître, Martinaud',
  annee: 2014,
  domaines: [
    'Dénomination orale (accès lexical)',
    'Fluence verbale (sémantique / phonémique)',
    'Mémoire lexicale',
    'Compréhension orale',
    'Langage écrit (lecture, écriture, dictée)',
    'Vitesse de traitement lexical',
    'Manque du mot (anomie)',
  ],
  epreuves: [
    'Dénomination d\'images (temps et exactitude)',
    'Fluence catégorielle (animaux, 1 min)',
    'Fluence lettre (P, 1 min)',
    'Répétition de mots et de phrases',
    'Désignation d\'images',
    'Appariement sémantique',
    'Lecture de mots et de textes (vitesse, exactitude)',
    'Compréhension écrite',
    'Dictée de mots et de phrases',
    'Copie de texte',
  ],
  regles_specifiques: `### BETL — Batterie d'Évaluation des Troubles du Langage chez l'adulte et le sujet âgé

**Population cible** : adultes et personnes âgées (particulièrement **60 ans et plus**), avec ou sans plainte mnésique / langagière. Étalonnage principal sur sujets de 60+.

**Indications cliniques** :
- **Vieillissement normal vs pathologique** : mesurer l'efficience langagière dans le vieillissement cognitif.
- **Pathologies neurodégénératives** : aphasie progressive primaire (APP), démence sémantique, Alzheimer débutant.
- **Post-AVC** : aphasies corticales, troubles lexico-sémantiques.
- **Traumatisme crânien**, tumeur cérébrale, SEP.
- **Suivi longitudinal** : comparaison des scores à 6-12 mois d'intervalle.

**Particularités de l'interprétation** :

1. **Vitesse d'accès lexical** : la BETL est particulièrement discriminante pour les **temps de dénomination**. Un allongement systématique (même avec exactitude conservée) est un marqueur sensible du manque du mot sub-clinique et peut précéder une anomie franche.

2. **Profil dysexécutif vs lexico-sémantique** :
   - Meilleure **fluence catégorielle** que **fluence lettre** → dissociation classique en faveur d'un trouble **dysexécutif** (touche la récupération stratégique).
   - Inverse (meilleure fluence lettre) → plutôt trouble **lexico-sémantique** (touche l'organisation du lexique sémantique).

3. **Manque du mot** : à ne pas confondre avec une simple lenteur physiologique du vieillissement. Rechercher :
   - Paraphasies sémantiques (donner un mot de la même catégorie).
   - Paraphasies phonologiques (substitution de phonèmes).
   - Circonlocutions ("le truc qui sert à…").
   - Effet d'amorçage phonologique (aide donnée par la première syllabe).

4. **Ajustement culturel / scolaire** : toujours croiser avec le niveau d'étude du patient — les normes sont stratifiées.

**Seuils d'interprétation** (à appliquer comme les autres tests étalonnés) :
- P ≥ 25 → Normal (compatible vieillissement normal)
- P16-P24 → Limite basse (à surveiller)
- P7-P15 → Fragile (bilan neurologique complémentaire conseillé)
- P2-P6 → Déficitaire (évoque une pathologie acquise)
- P < 2 → Pathologique (cohérent avec aphasie ou démence)

**Articulation avec d'autres outils** :
- **En amont** : MoCA pour screening cognitif global.
- **En complément** : GREMOTs, MT-86, batterie du Manque du Mot de Deloche, BEC-96, Montréal-Toulouse si profil aphasiologique.
- **Pour suivi prise en charge** : échelle de manque du mot en conditions spontanées (discours libre).

**Rédaction du CRBO** :
- Détailler le **temps moyen de dénomination** en plus de l'exactitude.
- Noter tous les types de paraphasies observées.
- Différencier **aphasie** (trouble langagier primaire), **anomie** (manque du mot isolé) et **trouble lexical du vieillissement** (sub-clinique).
- Proposer une prise en charge adaptée : rééducation lexico-sémantique, stimulation multi-composantes, techniques d'amorçage, travail sur les stratégies de récupération.`,
}
