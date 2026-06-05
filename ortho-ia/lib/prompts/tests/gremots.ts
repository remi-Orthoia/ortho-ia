import type { TestModule } from './types'

/**
 * GreMots, batterie d'évaluation du langage dans les pathologies
 * neurodégénératives (Béziy, Pariente, Tran, Macoir et al., collectif
 * GreMots, De Boeck Supérieur 2016 / HappyNeuron 2021).
 *
 * Source de vérité :
 *   - docs/Bilans Sources/GreMots-Manuel.pdf (manuel théorique 7649 lignes)
 *   - docs/Bilans Sources/GreMots-Cahier-passation.pdf (cahier de passation
 *     3116 lignes, version 0.1 / 2021-02-24)
 *
 * Cible clinique : adultes avec suspicion ou diagnostic de **pathologie
 * neurodégénérative** (maladie d'Alzheimer (MA), aphasies progressives
 * primaires (APP), démences lobaires fronto-temporales (DLFT)). Normalisée
 * sur 445 témoins francophones (France, Belgique, Suisse, Canada).
 *
 * À NE PAS confondre avec BETL (aphasie post-AVC) qui couvre les troubles
 * du langage d'étiologie vasculaire, ni avec PREDIMEM / PrediFex / PrediLac
 * (focus mémoire / exécutif / langage automatique sur population NSC 1-3).
 *
 * V1 2026-06-05 (mise en production initiale) : pas de formulaire structuré
 * dédié (formPath: null dans le registry → utilise le textarea générique
 * free_text). V2 prévue avec un composant React dédié similaire à
 * PrediFexScoresInput pour la saisie structurée des 22 épreuves.
 */
export const gremots: TestModule = {
  nom: 'GreMots',
  editeur: 'HappyNeuron, De Boeck Supérieur',
  auteurs:
    "Collectif GréMots, Béziy, Pariente, Renard, David, Maurice, Tran, Peillon, Croisile, Lefebvre, Basaglia-Pappas, Fossard, Amossé, Martinaud, Menut, Lethielleux, d'Honincthun, Macoir",
  annee: 2016,
  domaines: [
    'Traitement discursif',
    'Traitement lexical, production',
    'Traitement lexical, compréhension',
    'Traitement syntaxique, production',
    'Traitement syntaxique, compréhension',
    'Transposition et transcodage, répétition',
    'Transposition et transcodage, lecture à voix haute',
    'Transposition et transcodage, écriture',
  ],
  // 22 épreuves officielles du cahier de passation HappyNeuron 2021.
  // NE PAS reformuler, NE PAS fusionner. Libellés exacts du cahier.
  epreuves: [
    'Entretien / Langage spontané',
    'Répétition de mots',
    'Répétition de phrases',
    'Fluences, verbes',
    'Fluences, fruits',
    'Fluences, lettre V',
    "Exécution d'ordres",
    'Dénomination orale, objets',
    'Dénomination orale, actions',
    'Dénomination orale, personnes célèbres',
    'Élaboration de phrases',
    'Discours narratif',
    'Compréhension syntaxique',
    'Lecture à voix haute de mots',
    'Lecture à voix haute de logatomes',
    'Vérification mot oral, photo',
    'Écriture automatique',
    'Écriture sous dictée de mots',
    'Répétition et écriture sous dictée de logatomes',
    'Écriture sous dictée de phrases',
    'Compréhension de texte écrit',
    'Vérification mot écrit, photo',
  ],
  regles_specifiques: `### GréMots, Référentiel clinique aligné sur le manuel officiel

Source : Collectif GréMots, De Boeck Supérieur 2016, HappyNeuron 2021.
Batterie normalisée sur **445 témoins** francophones (France, Belgique,
Suisse, Canada) NSC 1 à 3, tranches d'âge ≥ 50 ans.

#### POPULATION CIBLE ET INDICATIONS

GréMots est spécifiquement conçu pour les **pathologies neurodégénératives** :
- **Maladie d'Alzheimer (MA)** : atteinte précoce du lexique sémantique
  (dénomination, fluence sémantique), préservation initiale du langage
  automatique et de la syntaxe.
- **Aphasies progressives primaires (APP)** trois variantes (classification
  Gorno-Tempini et al. 2011) :
  - **APP sémantique (APPs / DS)** : atteinte massive de la compréhension
    de mots, dénomination, vérification mot-image. Anomie sévère.
  - **APP non fluente (APPnf)** : trouble articulatoire / agrammatisme,
    réduction de l'élaboration syntaxique, manque du mot d'effort.
  - **APP logopénique (APPl)** : trouble de la mémoire phonologique à
    court terme, atteinte de la répétition de phrases, lecture/écriture
    de logatomes préservée.
- **Démences lobaires fronto-temporales (DLFT)** : profil variable selon
  variante comportementale vs langagière.

🔒 GréMots **n'est PAS** une batterie pour :
- Aphasies post-AVC (utiliser BETL).
- Troubles cognitifs sans atteinte langagière prédominante (utiliser MoCA,
  PREDIMEM, PrediFex selon le profil).
- Adultes < 50 ans sans plainte langagière documentée (hors étalonnage).

#### CONVENTION DE COTATION OFFICIELLE (manuel section 2.4)

Cotation **en 3 scores** pour chaque item :
- **Score Strict (vert)** : 1 point. Réponse correcte d'emblée, en première
  intention.
- **Score Large (orange)** : 1 point. Réponse correcte en deuxième intention
  (autocorrection, relecture de consigne, temps imparti dépassé mais
  finalement correct).
- **Erreur (rouge)** : 0 point. Réponse incorrecte ou pas de réponse au-delà
  du temps imparti.

🔑 **Calcul du Score Strict total** : Score Strict = Σ points Score Strict +
Σ points Score Large (les 2 catégories réussies comptent ensemble). C'est
la convention officielle GréMots (manuel section 2.4).

Pour les épreuves chronométrées, la cotation est **en 2 temps** :
1° clic démarre le chronomètre, 2° clic (ou cotation [S][L][E]) stoppe le
chronomètre. Le temps est un sous-score secondaire à reporter.

#### NORMES, étalonnage par NSC × tranche d'âge

Les percentiles GréMots sont **stratifiés par NSC × tranche d'âge** :
- **NSC 1** : niveau primaire (scolarité ≤ 9 ans).
- **NSC 2** : niveau secondaire (Bac / CAP / BEP).
- **NSC 3** : niveau supérieur (post-Bac, études universitaires).
- Tranches d'âge : 50-59 ans, 60-69 ans, 70-79 ans, ≥ 80 ans.

🔒 **Règle obligatoire** : mentionner explicitement le NSC et la tranche
d'âge utilisés dans le CRBO. Ces 2 variables sont la **base de l'étalonnage**
GréMots et ne sont pas interchangeables. Une performance "normale" pour un
NSC 1 / 80 ans peut être déficitaire pour un NSC 3 / 60 ans.

#### INTERPRÉTATION CLINIQUE PAR ÉPREUVE

##### 1. Entretien / Langage spontané (qualitatif)
- Pas de score chiffré, observation qualitative obligatoire.
- Noter : fluidité, débit, prosodie, recherches lexicales, paraphasies,
  cohérence du discours, manque du mot, circonlocutions, persévérations.
- Marqueur précoce d'APP non fluente : ralentissement du débit + effort
  articulatoire.
- Marqueur précoce d'APP sémantique : préservation de la fluidité mais
  appauvrissement lexical (mots passe-partout, périphrases, recours aux
  hyperonymes).

##### 2-3. Répétitions de mots et de phrases (Module 6.1)
- Évalue la **mémoire de travail phonologique** et la voie d'assemblage.
- Marqueur clé d'APP logopénique : **déficit massif en répétition de
  phrases** longues (> 5-7 mots) avec préservation de la répétition de
  mots isolés.
- Distinguer erreurs phonologiques (paraphasies segmentales, omissions
  syllabiques) vs erreurs sémantiques (substitutions par mots proches du
  sens) vs erreurs syntaxiques (simplification structure).

##### 4-6. Fluences verbes / fruits / lettre V (Module 4.1.1)
- **Fluence verbale (verbes en 1 min)** : explore la **mémoire sémantique
  verbale**. Déficitaire précoce en MA et APP sémantique.
- **Fluence sémantique (fruits en 1 min)** : explore la catégorisation
  sémantique. Déficitaire massif en APP sémantique. Ratio fluence
  sémantique / fluence phonémique **< 0.7** est très suggestif d'APP
  sémantique.
- **Fluence phonémique (lettre V en 1 min)** : explore le contrôle
  exécutif et l'accès lexical via la forme phonologique. Préservée plus
  longtemps en APP sémantique que la fluence sémantique.
- Noter les **clusters** (groupements sémantiques) et les **switches**
  (changements de catégorie) : peu de switches = défaut de flexibilité
  cognitive.

##### 7. Exécution d'ordres
- Évalue la **compréhension orale séquentielle** (consignes simples puis
  complexes à 2-3 étapes).
- Échec dès les ordres simples → atteinte sémantique massive (suggestion
  APP sémantique avancée).
- Échec sur ordres complexes uniquement → trouble de la mémoire de travail
  ou syntaxique.

##### 8-10. Dénomination orale (objets, actions, personnes célèbres) (Module 4.1.2)
- Épreuves clés du diagnostic GréMots.
- **Dénomination d'objets** : atteinte précoce en APP sémantique + MA.
- **Dénomination d'actions (verbes)** : utile pour distinguer APP
  sémantique (préservée dans les phases initiales) vs APP non fluente
  (atteinte précoce).
- **Dénomination de personnes célèbres** : sensible à l'atteinte sémantique
  unique (savoir biographique). Une atteinte sélective des personnes
  célèbres avec préservation des objets est très suggestive d'APP
  sémantique droite ou de démence sémantique.
- Analyse qualitative obligatoire : types d'erreurs (paraphasie sémantique,
  formelle, mixte, conduites d'approche, logatomes, persévérations,
  dénominations vides).
- Référence : typologie BETL Tran 2015 applicable, cf. fragment ERREURS_BETL
  pour la classification fine.

##### 11. Élaboration de phrases (Module 5.1)
- Production de phrases à partir de mots cibles.
- Évalue la **morphosyntaxe** en production.
- Atteinte précoce en APP non fluente (agrammatisme, simplification
  syntaxique, omission de mots-fonction).
- Préservée en APP sémantique et MA débutante.

##### 12. Discours narratif (Module 3.2)
- Production d'un récit à partir d'une histoire en images.
- Évalue : repérage de l'action principale, lexique narratif, cohésion,
  cohérence, informativité.
- Marqueur transversal des pathologies neurodégénératives, modulé par le
  NSC.
- Patterns typiques :
  - MA : conservation de la structure narrative, appauvrissement lexical
    et fréquence de mots passe-partout, perte des inférences.
  - APP sémantique : structure préservée, contenu sémantique pauvre.
  - APP non fluente : production fragmentée, omissions syntaxiques,
    réduction quantitative.

##### 13. Compréhension syntaxique (Module 5.2.2)
- Appariement phrases-images avec phrases de complexité syntaxique
  croissante (canoniques, passives, relatives, distantes).
- Atteinte précoce en APP non fluente sur les structures non canoniques
  (passives, relatives objets).
- Atteinte massive uniforme en APP logopénique (charge mémoire de
  travail).

##### 14-15. Lecture à voix haute de mots et logatomes (Module 6.2)
- Évalue les **deux voies de lecture** (adressage vs assemblage) en
  contexte neurodégénératif.
- MA : préservation longue de la lecture à voix haute (cliniquement appelée
  "préservation de la voie automatique").
- APP sémantique : régularisations sur mots irréguliers (perte du lexique
  orthographique). Voie d'adressage atteinte précocement.
- APP non fluente : trouble articulatoire en lecture orale.

##### 16. Vérification mot oral / photo (Module 4.2)
- Présentation d'une photographie et d'un mot oral, le patient doit dire si
  l'association est correcte.
- Évalue l'**accès sémantique** depuis l'entrée orale.
- Erreurs sur distracteurs sémantiques proches → atteinte du système
  sémantique. Erreurs sur distracteurs phonologiques → atteinte du lexique
  phonologique d'entrée.

##### 17. Écriture automatique (Module 7)
- Écriture du nom propre, de la date, de séries (jours / mois).
- Évalue la **conservation des automatismes graphiques**.
- Préservée longtemps en MA. Atteinte précoce en APP non fluente avec
  apraxie graphique.

##### 18-20. Écriture sous dictée mots / logatomes / phrases (Module 6.3)
- Évalue la **voie d'adressage et d'assemblage en écriture**.
- Pattern APP sémantique : régularisations sur mots irréguliers (mêmes
  erreurs qu'en lecture, atteinte du lexique orthographique central).
- Pattern APP logopénique : déficit massif sur logatomes et phrases (charge
  mémoire phonologique).
- Pattern APP non fluente : difficultés graphiques associées (apraxie),
  pas spécifique à une voie.

##### 21. Compréhension de texte écrit (Module 3.3)
- Évalue la **compréhension écrite** au-delà du mot isolé.
- Croiser avec compréhension orale : si orale > écrite → trouble de la
  lecture / accès écrit ; si les 2 atteintes → trouble sémantique global.

##### 22. Vérification mot écrit / photo (Module 4.2)
- Évalue l'accès sémantique depuis l'entrée écrite.
- Atteinte sélective vs Vérification mot oral → trouble de l'accès
  lexico-sémantique par modalité d'entrée.

#### DIAGNOSTIC, CRITÈRES OFFICIELS APP (Gorno-Tempini et al. 2011)

🔒 **JAMAIS de diagnostic étiologique en orthophonie** (Alzheimer, APP
sémantique, etc. relèvent du neurologue). Le CRBO GréMots formule en
"profil compatible avec…", suivi des éléments objectivés et de
l'**orientation vers le neurologue référent**.

Patterns d'orientation diagnostique à formuler :

**APP sémantique (suspicion)** :
- Anomie sévère + déficit massif compréhension de mots + perte des
  connaissances encyclopédiques (personnes célèbres) + préservation de la
  répétition et de la syntaxe.

**APP non fluente (suspicion)** :
- Trouble articulatoire / agrammatisme + réduction lexicale et syntaxique
  + préservation de la compréhension de mots isolés.

**APP logopénique (suspicion)** :
- Anomie modérée + déficit massif répétition de phrases + déficit lecture
  / écriture logatomes + préservation de la syntaxe et de la sémantique.

**MA débutante (suspicion langagière)** :
- Manque du mot modéré + déficit fluence sémantique + préservation initiale
  de la répétition et de la syntaxe + cohésion narrative en baisse
  progressive.

#### STRUCTURE DU CRBO GréMots

Organisation par les **8 domaines officiels** :

1. **Traitement discursif** (Langage spontané, Discours narratif,
   Compréhension texte).
2. **Production lexicale** (Fluences ×3, Dénomination ×3).
3. **Compréhension lexicale** (Vérifications oral/écrit).
4. **Production syntaxique** (Élaboration de phrases).
5. **Compréhension syntaxique** (Exécution d'ordres, Compréhension
   syntaxique).
6. **Répétition** (Mots, Phrases, Logatomes).
7. **Lecture à voix haute** (Mots, Logatomes).
8. **Écriture** (Automatique, Mots, Logatomes, Phrases).

Pour chaque domaine, structure :
- Tableau des scores (Score Strict / Score Large / Erreur + temps).
- Interprétation clinique courte (1-2 phrases) avec mention du percentile
  NSC × âge.
- Mention qualitative des erreurs observées (typologie BETL applicable).

#### NOMENCLATURE AMO / NGAP (orthophonie France)

Pour les bilans GréMots dans le cadre d'une suspicion de pathologie
neurodégénérative, la cotation NGAP appropriée est :

**30 AMO 9,4** : bilan + suivi des troubles du langage chez l'adulte
(aphasie, troubles linguistiques d'origine neurologique).

Format attendu (verbatim) :
> "La rééducation s'inscrit dans le cadre de la nomenclature AMO 9,4
> (rééducation des troubles du langage et de la parole chez l'adulte)."

⚠️ NE PAS confondre avec AMO 11.7 (cognition mathématique) ou AMO 12,1
(langage écrit pédiatrique).

#### À NE JAMAIS FAIRE EN GréMOTS

- ❌ Poser un diagnostic étiologique (MA, APP, DLFT) en orthophonie. Relève
  du neurologue et du bilan neuropsychologique complet.
- ❌ Confondre Score Strict et Score Large (les 2 comptent dans le total
  Score Strict GréMots).
- ❌ Ignorer le NSC × tranche d'âge pour l'étalonnage.
- ❌ Plaquer le format CRBO post-AVC (BETL) sur un bilan GréMots : la
  trajectoire est progressive, pas séquellaire.
- ❌ Conclure à l'absence de trouble sur la base d'un seul score préservé
  en isolant (les profils GréMots sont **dissociatifs**, croiser ≥ 3
  épreuves convergentes).

#### À TOUJOURS FAIRE EN GréMOTS

- ✅ Mentionner explicitement le NSC × tranche d'âge utilisés pour
  l'étalonnage.
- ✅ Analyser qualitativement le langage spontané (dimension exclue du
  scoring quantitatif).
- ✅ Croiser au moins 3 épreuves convergentes avant de pointer un profil
  diagnostique (suspicion).
- ✅ Orienter vers le neurologue référent + bilan neuropsychologique
  complémentaire systématiquement.
- ✅ Référer aux variantes d'APP (Gorno-Tempini 2011) en suspicion, jamais
  en certitude.
- ✅ Réévaluer à 6-12 mois pour caractériser la **trajectoire évolutive**
  (élément central du diagnostic différentiel MA vs APP).`,
}
