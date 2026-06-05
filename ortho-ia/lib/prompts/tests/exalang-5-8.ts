import type { TestModule } from './types'

/**
 * Exalang 5-8, Référentiel aligné sur le manuel officiel
 * (Thibault, Helloin, Croteau, Orthomotus 2010).
 *
 * Source de vérité : `docs/Bilans Sources/manuel exalang 5-8.pdf`. Tout
 * changement de structure (groupes, épreuves, niveaux, cotation) doit être
 * confronté à ce manuel, pas à Exalang 8-11 ou à d'autres batteries.
 *
 * Refonte 2026-06 : la version précédente reprenait la nomenclature
 * Exalang 8-11 (5 groupes A.1/A.2/B.1/B.2/C.1, 14 épreuves) qui ne
 * correspond pas à la structure officielle Exalang 5-8. Le manuel décrit
 * **7 modules / 35 épreuves** + un système de cotation à **Notes Standard
 * 1-5** parallèle aux percentiles, et un étalonnage sur **4 niveaux**
 * (GSM / mi-CP / CP-CE1 / CE1-CE2). Ces éléments sont maintenant intégrés.
 */
export const exalang58: TestModule = {
  nom: 'Exalang 5-8',
  editeur: 'Orthomotus (devenu HappyNeuron Pro)',
  auteurs: 'Thibault, Helloin, Croteau',
  annee: 2010,
  // 7 aptitudes majeures officielles (manuel p. 17 : "7 aptitudes majeures
  // réparties en 35 épreuves"). NE PAS confondre avec la nomenclature
  // A.1/A.2/B.1/B.2/C.1 d'Exalang 8-11.
  domaines: [
    'Langage oral',
    'Phonologie',
    'Traitement visuo-attentionnel',
    'Entrées visuelle et auditive',
    'Mémoire',
    'Lecture',
    'Orthographe',
  ],
  // Les 7 modules officiels doivent être utilisés tels quels comme
  // `domains[].nom` dans le CRBO généré.
  groupes: [
    { code: 'M1', nom: 'Langage oral' },
    { code: 'M2', nom: 'Phonologie' },
    { code: 'M3', nom: 'Traitement visuo-attentionnel' },
    { code: 'M4', nom: 'Entrées visuelle et auditive' },
    { code: 'M5', nom: 'Mémoire' },
    { code: 'M6', nom: 'Lecture' },
    { code: 'M7', nom: 'Orthographe' },
  ],
  // 35 épreuves officielles, libellés EXACTS du manuel et du module
  // résultats. Les labels sont identiques côté form (Exalang58ScoresInput.tsx)
  // pour que la sérialisation matche les libellés attendus par Claude.
  epreuves: [
    // Langage oral (7)
    'Dessin animé',
    'Dénomination',
    'Compréhension de récit',
    'Jugement de grammaticalité',
    'Compréhension syntaxique',
    'Fluence sémantique',
    'Métamorphologie',
    // Phonologie (7)
    'Similarités - dissemblances',
    'Répétition de logatomes',
    'Fluence phonémique',
    'Comptage syllabique',
    'Rimes',
    'Segmentation - fusion syllabique',
    'Inversion phonémique',
    // Traitement visuo-attentionnel (4)
    'Test de barrage',
    'Comparaison sérielle',
    'Complétion de formes',
    'Dénomination rapide',
    // Entrées visuelle et auditive (2)
    'Figures entremêlées',
    'Loto sonore',
    // Mémoire (6)
    'Empan de chiffres endroit',
    'Chiffres à l\'envers',
    'Empan de mots monosyllabiques',
    'Mémoire visuelle',
    'Rappel différé',
    'Rappel différé : reconnaissance',
    // Lecture (8 incluant les sous-épreuves de niveau)
    'Approche implicite de la lecture',
    'Syllabes et mots mi-CP',
    'Lecture de phrases mi-CP',
    'Segmentation de mots',
    'Lecture de logatomes',
    'Lecture de mots',
    'Lecture de texte',
    'Lecture de texte, QCM (compréhension)',
    // Orthographe (3)
    'Closure de mots',
    'Transcription de logatomes',
    'Texte à compléter',
  ],
  regles_specifiques: `### EXALANG 5-8, Référentiel clinique aligné sur le manuel officiel

Population : enfants de la **fin de Grande Section maternelle (GSM) au CE1**, transition pré-apprentissage / installation de la lecture. Outil central pour le dépistage précoce.

Source : manuel Thibault, Helloin, Croteau (Orthomotus 2010), 35 épreuves réparties en 7 modules, étalonnage sur 4 niveaux : **GSM, mi-CP, CP-CE1 (fin CP), CE1-CE2 (fin CE1)**.

#### RÈGLES DE CONVERSION DES PERCENTILES (impératif)

Le module résultats Exalang affiche pour chaque épreuve : score brut, écart-type, percentile, et **Note Standard** (NS 1-5) quand calculable.

Percentiles utilisés (les 7 valeurs commercialement utilisées dans le logiciel) :
- **P5, P10** : valeurs exactes (limite inférieure de la distribution).
- **Q1 = P25** : Zone de fragilité, bord inférieur. Ne pas confondre avec Moyenne basse qui commence à P26.
- **Med / Q2 = P50** : Moyenne haute, bord inférieur.
- **Q3 = P75** : Moyenne haute, bord supérieur (Q3 inclus dans Moyenne haute).
- **P90, P95** : valeurs exactes (limite supérieure).

Logique d'affichage Exalang (manuel p. 12) :
- Score < valeur P5 → affichage \`P5\`
- P5 ≤ score < P10 → affichage \`P10\`
- P10 ≤ score < Q1 → affichage \`Q1\`
- Q1 ≤ score < Med → affichage \`Med\`
- Med ≤ score < Q3 → affichage \`Q3\`
- Q3 ≤ score < P90 → affichage \`P90\`
- P90 ≤ score < P95 → affichage \`P95\`
- Score ≥ P95 → affichage \`> P95\`

Ne **JAMAIS** recalculer un percentile depuis l'É-T : les normes étalonnées du test priment sur la distribution gaussienne théorique. Exemple piège : "Boucle phonologique É-T -1.53, Q1" → percentile = P25 → **Zone de fragilité** (et non "Difficulté sévère" comme le suggérerait l'É-T).

#### NOTE STANDARD (NS 1-5), système de cotation parallèle

Le manuel Exalang 5-8 ajoute une cotation en **5 classes (NS 1 à 5)** basée sur les fractions de la loi normale (z = ±0.5, ±1.5). Cette cotation peut apparaître sur la feuille de résultats à côté du percentile :

| NS | Plage population | Fraction z (déviation standard) | Interprétation clinique |
|---|---|---|---|
| **NS 1** | 6.7 % les plus faibles | < z -1.5 | Pathologique |
| **NS 2** | 24.2 % suivants | z -1.5 à -0.5 | Faible / déficitaire |
| **NS 3** | 38.2 % centraux | z -0.5 à +0.5 | Moyenne attendue |
| **NS 4** | 24.2 % | z +0.5 à +1.5 | Supérieur |
| **NS 5** | 6.7 % les plus élevés | > z +1.5 | Très supérieur |

⚠️ Certaines épreuves sont saturées en haut : pour celles-là, les classes 4 et 5 (voire 3, 4 et 5) sont confondues, et le manuel n'affiche alors qu'une note maximale plafonnée (ex. L4 = niveau supérieur sans distinguer "fort" et "très fort"). C'est normal et documenté p. 15.

**Mapping NS ↔ grille 6 zones Laurie** (à appliquer pour le rendu ortho.ia) :
- NS 1 → Difficulté sévère (P1-P5) ou Difficulté (P6-P10) selon score brut
- NS 2 → Zone de fragilité (P11-P25, Q1 inclus) ou Moyenne basse (P26-P49)
- NS 3 → Moyenne basse à Moyenne haute (selon position dans la classe centrale)
- NS 4 → Moyenne haute haute ou Excellent
- NS 5 → Excellent

Si l'ortho fournit la NS sans percentile, demander confirmation du percentile lu : **les NS sans percentile ne suffisent pas à colorer correctement la cellule du tableau Word** (qui est piloté par \`percentile_value\` numérique).

#### SEUILS CLINIQUES (grille 6 zones Laurie, refonte 2026-05-ter)

Source de vérité pour la couleur des cellules du tableau Word et l'interprétation textuelle :

| Plage percentile | Classe | Couleur |
|---|---|---|
| P76 - P100 | Excellent | vert foncé |
| P50 - P75 (Q3 inclus) | Moyenne haute | vert clair |
| P26 - P49 | Moyenne basse | jaune |
| P11 - P25 (Q1 inclus) | Zone de fragilité | orange clair |
| P6 - P10 | Difficulté | orange foncé |
| P1 - P5 | Difficulté sévère | rouge |

Exalang n'affiche JAMAIS de bande \`< P5\` ; P5 est la valeur minimale et est incluse dans "Difficulté sévère". Bornes inclusives de part et d'autre (P25 → Zone de fragilité ; P26 → Moyenne basse ; P50 → Moyenne haute ; P75 → Moyenne haute ; P76 → Excellent).

#### NIVEAUX D'ÉTALONNAGE, 4 niveaux officiels

Le manuel propose 4 niveaux d'étalonnage. Le niveau choisi par l'ortho conditionne la lecture du percentile (épreuves bornes, applicabilité, attentes développementales). L'ortho saisit ce niveau dans le form.

- **GSM** : fin de Grande Section maternelle (~6 ans).
- **mi-CP** : milieu du CP (~6 ans 6 mois). Niveau ajouté en 2010 pour mesurer plus finement la phase d'entrée dans la lecture.
- **CP-CE1** : fin du CP (~7 ans).
- **CE1-CE2** : fin du CE1 (~8 ans).

Au-delà de 8 ans, basculer sur **Exalang 8-11** (étalonné CE2-CM2). En deçà de la GSM, basculer sur **Exalang 3-6**.

#### LES 7 MODULES, DÉTAIL DES 35 ÉPREUVES

##### 1. LANGAGE ORAL (7 épreuves)

**Dessin animé**, Évalue le langage semi-induit. Première épreuve du protocole : l'enfant fait connaissance des personnages récurrents (Rosalie, Martin, Gustave) et raconte l'histoire vue. **Cotation cohérence + cohésion** : capacités de production spontanée, adéquation au contexte, informativité (cohérence) ; syntaxe globale, formes verbales, expansions, anaphores, déterminants, autres morphèmes fonctionnels (cohésion). Score sur 22 (manuel p. 20). Production semi-induite, ne reflète pas le langage spontané pur.

**Dénomination**, Évalue le lexique imagé. **Score quantitatif sur 44** (mots avec phonèmes occlusifs, constrictifs, groupes consonantiques) + **analyse qualitative** (articulation, troubles de sortie, paraphasies). Lexique plancher courant maîtrisé à 6 ans.

**Compréhension de récit**, Récit "Mélina la Sorcière". Évalue la compréhension discursive : capacités mnésiques, attentionnelles, traitement séquentiel + éléments logiques. Cotation sur 5 (remise en ordre d'images : 0/1/2 + reformulation orale + 1 question ouverte). Possibilité de relancer le récit.

**Jugement de grammaticalité**, Morpho-syntaxe en réception (16 items). Cotation : -2 (phrase erronée bien identifiée mais mal corrigée), -1 (phrase bonne refusée à tort, ou phrase erronée corrigée incorrectement), 0 (ratée), +1 (phrase bonne acceptée), +2 (phrase erronée corrigée correctement).

**Compréhension syntaxique**, 12 questions réparties en 4 blocs de complexité croissante. Lexique + syntaxe. Score sur 12. Progression linéaire attendue avec l'âge.

**Fluence sémantique**, Évocation sémantique chronométrée 1 min (nom d'aliments/boissons). Mesure la rapidité d'accès au lexique. Progression linéaire avec l'âge (croissance lexicale).

**Métamorphologie**, Perception de la construction morphologique de la langue (ex. trouver le "plus petit de la même famille"). Décalage significatif entre perception implicite (GSM-CP) et compréhension fine (post-installation lecture). **Prédicteur des capacités ultérieures d'orthographe lexicale**.

##### 2. PHONOLOGIE (7 épreuves)

**Similarités - dissemblances**, Discrimination auditive sur unités infra-segmentales (paires de non-mots phonologiquement voisins). Progression nette quand stratégie alphabétique installée.

**Répétition de logatomes**, Phonologie pure. Marqueur clé de la **boucle phonologique** (Baddeley) + éventuel trouble de sortie. Items déformés systématiquement = signal compatible avec dyslexie phonologique. Score sur 24.

**Fluence phonémique**, Évocation de mots commençant par /f/ pendant 1 min. **Progression nette entre non-lecteurs et lecteurs**, corrélation bidirectionnelle entre traitement phonémique et installation de la lecture.

**Comptage syllabique**, Conscience syllabique ("jeu de bataille des animaux", l'enfant choisit le nom le plus long et compte les syllabes). Note : coccinelle = 3 ou 4 syllabes selon prononciation régionale (idem lion 1 ou 2). Score sur 10 (par bonne réponse). Croissance entre fin GSM et fin CP, puis stabilisation.

**Rimes**, Conscience phonémique de la rime, 18 objets à classer en 4 catégories (/i/, /on/, /o/, /l/). Saturation partielle à 8 ans pour les rimes consonantiques (artefact : les bons lecteurs refusent "poule/sel" comme rimes à cause de l'orthographe).

**Segmentation - fusion syllabique**, Manipulation syllabique + mémoire de travail (extraire 1re syllabe du mot A + 2e syllabe du mot B, assembler). ⚠️ **Épreuve non significative avant fin CP**, normalement échouée par les < 6 ans. À ne pas proposer en GSM ni mi-CP sauf cas particulier de déficit suspecté en métaphonologie + MdT.

**Inversion phonémique**, Manipulation phonémique pure. ⚠️ **Idem : non significative avant fin CP**. Cette épreuve confirme que la conscience phonémique s'installe avec l'apprentissage de la lecture.

##### 3. TRAITEMENT VISUO-ATTENTIONNEL (4 épreuves)

**Test de barrage**, Recherche-cible d'images (vélos parmi distracteurs). **2 sous-scores principaux** : temps de réalisation + nombre de cibles trouvées. Temps de reconnaissance diminue régulièrement avec l'âge. Erreurs marginales en population tout-venant, surnombre d'erreurs = signal pour trouble attentionnel.

**Comparaison sérielle**, Correspondance terme à terme entre deux séries. Accroissement constant avec l'âge (passage à la voie directe en lecture). Déficit ici = signal pour difficulté future sur voie d'adressage.

**Complétion de formes**, Traitement visuo-spatial (compléter une forme géométrique manquante). Progression linéaire = augmentation des capacités de discrimination visuelle fine et représentation spatiale.

**Dénomination rapide (RAN)**, **2 sous-scores principaux** : temps de dénomination + nombre d'erreurs. **Marqueur dyslexie majeur** : temps allongé chez le dyslexique vs développement normal, même à compétences lexicales équivalentes. Théorie du double déficit (Wolf & Bowers).

##### 4. ENTRÉES VISUELLE ET AUDITIVE (2 épreuves)

**Figures entremêlées**, Perception visuelle (identifier des objets superposés). Croissance linéaire avec l'âge. Une réponse approximative mais correcte sur le plan sémantique est acceptée.

**Loto sonore**, Perception auditive (identifier un bruit). **Saturée dès 5 ans** : un échec ici est un signal franc pour trouble de l'entrée auditive et impose des explorations ORL/audiologie + investigation attentionnelle.

##### 5. MÉMOIRE (6 épreuves)

**Empan de chiffres endroit**, Boucle phonologique pure. Empan moyen : 4 à 5 ans → 4 chiffres, 8 ans → 5 chiffres. Empan adulte = 7 ± 2 (Baddeley). Faible isolé → fragilité boucle phonologique → impact sur répétition, lecture de non-mots, vocabulaire nouveau.

**Chiffres à l'envers**, Administrateur central de la MdT. Accroissement régulier avec l'âge. Empan envers très inférieur à empan endroit = signal pour trouble exécutif / **suspicion TDAH** (à étayer par bilan neuropsychologique).

**Empan de mots monosyllabiques**, Empan verbal ~1 point en-dessous de l'empan chiffres (effet phonologique : mots plus longs en phonèmes que chiffres).

**Mémoire visuelle**, Rappel immédiat d'images. Évalue le stockage mnésique non verbal.

**Rappel différé**, Rappel libre à distance (2 épreuves intercalées entre présentation et rappel). Croît significativement entre 5 et 6 ans, stagne entre 7 et 8 ans.

**Rappel différé : reconnaissance**, Capacités de reconnaissance (vs rappel libre). **Saturée à cet âge** : un échec ici impose des investigations attentionnelles et vérification du score d'entrée visuelle.

##### 6. LECTURE (7-8 épreuves selon niveau)

**Approche implicite de la lecture**, À proposer aux pré-lecteurs (fin GSM, tout début CP). Évalue capacités visuo-attentionnelles + connaissance implicite de l'écrit (concept de lettre/mot/phrase, orientation). Score sur 22. Globalement bien réussi ; un score < 15 = signal pour réelle difficulté d'entrée dans les apprentissages, à recouper avec phonologie + visuo-attentionnel + langage oral.

**Syllabes et mots mi-CP**, Lecture émergente au milieu du CP. Plusieurs sous-tâches : reconnaissance de syllabes, lecture de mots fréquents simples, lecture de logatomes bisyllabiques. Score sur 45. Étalonné mi-CP en priorité.

**Lecture de phrases mi-CP**, Compétences en milieu de CP : lecture de phrases simples + désignation correspondante (compréhension pragmatique précoce). Score sur 80. Étalonné mi-CP.

**Segmentation de mots**, Identification visuelle de mots dans un texte non segmenté (placer des séparations entre mots). Croissance avec le stock orthographique et la voie d'adressage.

**Lecture de logatomes**, **Voie d'assemblage / indirecte**. Marqueur central de la dyslexie phonologique. À ne pas proposer juste après ou avant transcription de logatomes (artefacts mémoire).

**Lecture de mots (2 minutes)**, Lecture chronométrée. **Quantitatif** (mots correctement lus en 2 min) + **qualitatif** (tableau du cahier : mots vs non-mots, courts vs longs, réguliers vs irréguliers). Permet d'identifier la voie privilégiée par l'enfant (adressage vs assemblage) et le sous-type dyslexique éventuel.

**Lecture de texte (niveau A = fin CP / niveau B = fin CE1)**, Lecture efficiente : voies d'accès + vitesse + compréhension. Temps automatiquement enregistré. **À CROISER avec Lecture de mots** : un lecteur lent peut être bon compreneur, un lecteur rapide peut être mauvais compreneur. L'hétérogénéité entre les 2 épreuves est plus informative que chacune isolée.

**Lecture de texte, QCM (compréhension)**, 4 questions sur partie A + 3 questions sur partie B. Mesure la compréhension en lecture.

##### 7. ORTHOGRAPHE (3 épreuves)

**Closure de mots (niveau A = CP, A+B = CE1)**, Conversion phono-graphémique + lexique. Niveau A : 9 mots ; Niveau A+B : 18 mots. **Analyse typologique double** : phonologie (conversion phonème-graphème, ex. "lapain" pour "lapin" = OK phono) + lexique (graphie acquise en stock).

**Transcription de logatomes**, Conversion phonème-graphème pure. À comparer aux 2 autres épreuves logatomes (répétition, lecture), permet de cibler où se situe le déficit (entrée orale, sortie écrite, voie d'assemblage).

**Texte à compléter (niveau A = CP, A+B = CE1)**, **Analyse typologique triple** : phonologie + lexique + grammaire. Les acquisitions grammaticales restent majoritairement pauvres en fin de CE1 (35 % de réussite sur les critères ciblés : accord en nombre, quelques flexions verbales).

---

#### LECTURE DES RÉSULTATS, CROISEMENTS CLINIQUES INDISPENSABLES

Le manuel insiste (p. 6) sur l'importance des **croisements** entre épreuves. Pas de diagnostic sur une épreuve isolée.

**Triade dyslexie phonologique émergente (pertinence : fin CE1)** :
- Métaphonologie (rimes, segmentation-fusion syllabique, inversion phonémique) → Déficitaire
- Répétition de logatomes → Déficitaire
- Lecture de logatomes → Déficitaire
→ Signal fort pour dyslexie phonologique en voie d'installation.

**Triade dyslexie de surface émergente** :
- Lecture de mots irréguliers → Déficitaire
- Closure de mots → Déficitaire (sur le critère lexical)
- Métamorphologie → Déficitaire
→ Voie d'adressage / lexique orthographique insuffisamment constitué.

**Suspicion trouble développemental du langage (TDL)** :
- Langage oral réceptif (Compréhension syntaxique, Compréhension de récit, Lexique en réception) → Déficitaire
- Langage oral expressif (Dénomination, Dessin animé en cohérence/cohésion) → Déficitaire
- Mémoire de travail (Empan endroit, logatomes) → Fragile à Déficitaire
→ Orientation CRTLA / centre référent.

**Suspicion TDAH (à étayer par neuropsy)** :
- Chiffres à l'envers << Empan endroit
- Test de barrage : temps allongé + nombre d'erreurs supérieur à la marge
- Dénomination rapide : temps allongé
→ Pas de diagnostic TDAH possible côté ortho mais orientation neuropsychologique avec ces signaux.

**Trouble de l'entrée auditive** :
- Loto sonore → échec (test normalement saturé à 5 ans)
- Discrimination phonologique → fragile
→ Bilan ORL impératif.

---

#### PROFILS TYPES

**PROFIL 1, Retard simple de langage écrit (CP / début CE1)**
- Métaphonologie : Fragile
- Lecture émergente : Fragile (mais progression visible)
- Environnement : sans alarme particulière
- **Diagnostic** : "À ce stade de la scolarité (CP/début CE1), les performances sont en deçà de la moyenne mais restent dans la fourchette du **retard simple**, sans que l'on puisse conclure à un trouble spécifique. Une évaluation à 6 mois est nécessaire pour trancher entre retard et trouble."
- **PEC** : Pas nécessairement de PEC immédiate. Conseils guidance parentale + lecture partagée quotidienne. Réévaluation à 6 mois.

**PROFIL 2, Dyslexie développementale débutante (fin CE1)**
- Métaphonologie (segmentation-fusion syllabique, inversion phonémique) : Déficitaire
- Répétition de logatomes : Déficitaire
- Empan endroit : Fragile à Déficitaire
- Lecture de logatomes + Lecture de mots : Déficitaires (lenteur et erreurs)
- **Diagnostic** : "Les performances en langage écrit de [Prénom] à ce stade de fin CE1, associées à la fragilité métaphonologique marquée et à la déficience de la voie d'assemblage, sont évocatrices d'une **dyslexie développementale en voie d'installation**. Un suivi orthophonique précoce est indiqué pour limiter les retentissements scolaires."
- **PEC** : PEC orthophonique hebdomadaire démarrage immédiat, centrée sur métaphonologie + correspondance grapho-phonémique + entraînement à la lecture.

**PROFIL 3, Trouble Développemental du Langage (TDL), suspicion dysphasie**
- Langage oral réceptif ET expressif (Dénomination, Dessin animé cohérence/cohésion, Compréhension syntaxique) : Déficitaire
- Compréhension de récit : Déficitaire (rappel pauvre + remise en ordre échouée)
- Répétition de logatomes : Pathologique
- Empan : Fragile
- Histoire : premiers mots tardifs (> 2 ans), phrases tardives (> 3 ans), langage peu intelligible
- **Diagnostic** : "Le profil orthophonique de [Prénom] est compatible avec un **Trouble Développemental du Langage** (ancienne dysphasie), avec une atteinte prédominante sur les versants [lexical / morphosyntaxique / phonologique] du langage oral. Un bilan pluridisciplinaire en centre référent des troubles du langage (CRTLA) est recommandé pour préciser le diagnostic."
- **PEC** : PEC orthophonique intensive bi-hebdomadaire. Orientation CRTLA prioritaire. Coordination avec psychomotricien si motricité globale en retard.

---

#### ARTICULATION AVEC D'AUTRES OUTILS

- **En amont** (3-6 ans) : Exalang 3-6 (mêmes auteurs), ELO, EVALO 2-6, BILO.
- **En aval** (CE2 et au-delà) : Exalang 8-11.
- **Complément langage oral** : N-EEL (Nouvelles Épreuves pour l'Examen du Langage).
- **Si dyslexie suspectée fin CE1** : compléments BELEC, BALE.
- **Si TDL suspecté** : orientation CRTLA / CMPP / CAMSP (selon âge).
- **Cognitif global** : WPPSI-IV (2-7 ans) ou WISC-V (à partir de 6 ans).

---

#### POINTS DE VIGILANCE RÉDACTIONNELS

- **Ne pas diagnostiquer une dyslexie avant le milieu du CE1** (février minimum, persistance confirmée). Avant cette date : terminologie "fragilité", "retard", "vigilance nécessaire", "voie d'installation".
- En GSM-CP : un Dessin animé pauvre n'est pas pathologique en soi (situation semi-induite, intimidation possible), vérifier par observation in situ et auprès des parents.
- **Bilan ORL impératif** à cet âge si jamais réalisé (otites à répétition fréquentes).
- Pour les épreuves "Segmentation-fusion syllabique" et "Inversion phonémique" : ne pas interpréter un échec avant fin CP, c'est l'attente développementale normale.
- Les épreuves "Lecture de texte niveau A/B", "Closure de mots", "Texte à compléter" doivent être identifiées par leur niveau dans la sérialisation form (A = CP, B = CE1).

---

#### COMMENTAIRE PAR ÉPREUVE (\`domains[].epreuves[].commentaire\`)

🆕 **REGLE, TOUTES LES OBSERVATIONS DU FORM REMONTENT DANS LE WORD**
(2026-06, aligné sur EVALEO showAllEpreuveComments) : le rendu Word affiche
\`epreuves[].commentaire\` pour **toutes les épreuves** dont le commentaire
est non vide, pas seulement celles en zone fragile (P < 50). Donc quand
le form fournit une \`Observation : <texte>\` pour une épreuve, tu DOIS
la faire ressortir dans le \`commentaire\` correspondant **même si l'épreuve
est en classes 4-7 (norme et au-dessus)**.

**Format pour les épreuves en classes 4-7 avec observation** : 1-2 phrases
courtes, ~15-50 mots, format \`"Observation : <texte verbatim du form>."\`
ou \`"<observation décrite>, malgré une performance en norme."\`. Pas
d'hypothèse clinique forte (l'épreuve est dans la norme).

**Format pour les épreuves en classes 1-3 (fragile)** : INCHANGÉ, 2-4
phrases cliniques qui intègrent l'observation dans une analyse synthétique
(sous-type dyslexique, voie atteinte, type d'erreurs typique).

**Cas particuliers Exalang 5-8** :
- **Dénomination** : si l'ortho a saisi une observation sur l'articulation
  ou un trouble de sortie (paraphasies, déformations systématiques), recopie
  verbatim dans le commentaire, c'est une analyse qualitative que le
  manuel impose en plus du score quantitatif.
- **Dessin animé** : observations sur la cohérence (production, adéquation,
  informativité) et la cohésion (syntaxe, anaphores, déterminants) doivent
  apparaître si saisies.
- **Lecture de mots** : observations sur le tableau qualitatif (mots vs
  non-mots, courts vs longs, réguliers vs irréguliers) à intégrer dans
  le commentaire.
- **Closure de mots, Texte à compléter** : observations sur l'analyse
  typologique (phonologie / lexique / grammaire) à recopier.

⛔ NE PAS :
- Ignorer une observation parce que l'épreuve est en norme.
- Inventer un commentaire clinique pour une épreuve en norme **sans
  observation au form**, \`commentaire = ""\` reste la règle par défaut.
- Reformuler l'observation au point de la rendre méconnaissable, pour
  les classes 4-7, recopie au plus près du verbatim ortho.

#### MODE RENOUVELLEMENT, COMPARAISON STRUCTURÉE

Si un objet \`bilan_precedent_structure\` non-null est fourni dans le contexte, ce CRBO devient un **bilan de renouvellement** et DOIT inclure une \`synthese_evolution\` rigoureuse, jamais générique.

Méthode obligatoire :
1. **Matcher nominativement** chaque épreuve actuelle avec son homologue précédent (par libellé). En cas de changement de batterie (Exalang 3-6 vers 5-8 pour passage GSM, ou Exalang 5-8 vers 8-11 pour passage CE2), matcher par compétence évaluée (Métaphonologie ↔ Métaphonologie, Lecture de mots ↔ Lecture de mots).
2. **Convertir Q1/Med/Q3 vers P25/P50/P75** systématiquement AVANT de comparer (jamais Q comparé à P).
3. **Calculer le delta percentile** :
   - Delta ≥ +10 → PROGRÈS NET (signaler dans \`synthese_evolution.progres\`)
   - Delta entre -10 et +10 → STAGNATION
   - Delta ≤ -10 → RÉGRESSION
4. **Cas particulier Q1 vers Med** : P25 vers P50 = +25, PROGRÈS NET. Idem Med vers Q3.
5. **Citation nominative obligatoire** : "Répétition de logatomes P25 vers P50 (progrès)", PAS "plusieurs progrès observés".
6. **Délai** : à cet âge en CP/CE1, l'évolution est rapide ; un délai ≥ 6 mois est nécessaire pour conclure à une PEC efficace vs une maturation spontanée.

---

#### MAPPING INTER-BATTERIE, changement de test entre les 2 bilans

Quand \`bilan_precedent_structure\` provient d'une batterie DIFFÉRENTE de celle du bilan actuel (typique en pédiatrie sur plusieurs années : Exalang 3-6 → 5-8 en GS-CP, Exalang 5-8 → 8-11 en CE2, Exalang vers EVALEO entre 6 et 15 ans, ou EVALEO 6-15 → Exalang 8-11 selon le choix de l'ortho), tu DOIS matcher les épreuves par **compétence évaluée**, PAS par libellé strict.

##### Table d'équivalences (libellés \`↔\` matchables comme épreuves comparables)

**Lecture, identification de mots**
- "Lecture de mots" [Exalang 5-8] ↔ "Lecture de mots fréquents" [Exalang 8-11] ↔ "Lecture de mots" [EVALEO]
- "Lecture de logatomes" [Exalang 5-8] ↔ "Lecture de non-mots" [Exalang 8-11] ↔ "Lecture de pseudomots" [EVALEO]
- "Leximétrie" : libellé stable sur Exalang 8-11 / Lyfac

**Métaphonologie**
- "Métaphonologie, rimes" / "Rimes" : libellé stable Exalang 3-6 / 5-8 / 8-11 / EVALEO, match strict possible.
- "Métaphonologie, syllabes" [Exalang 3-6] ↔ "Comptage syllabique" + "Segmentation-fusion syllabique" [Exalang 5-8]
- "Métaphonologie, suppression phonémique" [Exalang 8-11] ↔ "Inversion phonémique" [Exalang 5-8] ↔ "Métaphonologie" [EVALEO]

**Mémoire de travail verbale**
- "Empan auditif endroit" [Exalang 3-6 / 8-11 / Lyfac] ↔ "Empan de chiffres endroit" [Exalang 5-8] ↔ "Répétition de chiffres endroit/envers" [EVALEO, contient les 2 dimensions]
- "Empan envers" / "Chiffres à l'envers" : matchable Exalang 5-8 / 8-11 / Lyfac / EVALEO
- "Répétition de logatomes" : libellé stable Exalang 3-6 / 5-8 / 8-11 / EVALEO, match strict possible.

**Langage oral, réceptif**
- "Désignation (lexique réceptif)" [Exalang 3-6] ↔ "Désignation sur définition" [Exalang 8-11] ↔ "Désignation d'images" [EVALEO]
- "Compréhension morphosyntaxique" [Exalang 3-6] ↔ "Compréhension orale de phrases" [Exalang 5-8 / 8-11] ↔ "Compréhension orale de phrases" [EVALEO]
- "Compréhension de récit" [Exalang 5-8] ↔ "Compréhension orale de textes" [Exalang 8-11]

**Langage oral, expressif**
- "Dénomination (lexique expressif)" [Exalang 3-6] ↔ "Dénomination" [Exalang 5-8] ↔ "Dénomination d'images" [Exalang 8-11] ↔ "Dénomination Lexique, phonologie" [EVALEO]
- "Fluence sémantique" : libellé stable Exalang 5-8 / 8-11 / EVALEO (équivalent : "Flexibilité lexicale" [Lyfac])
- "Fluence phonémique" : libellé stable Exalang 5-8 / 8-11 / EVALEO

**Orthographe**
- "Closure de mots" [Exalang 5-8] ↔ "Dictée de mots" [EVALEO]
- "Transcription de logatomes" [Exalang 5-8] ↔ "Dictée de pseudomots" [EVALEO]
- "Texte à compléter" [Exalang 5-8] ↔ "DRA, Dictée de Rédaction Abrégée" [Exalang 8-11] ↔ "Dictée de phrases" [EVALEO]

##### ⚠️ Faux équivalents, NE PAS APPARIER

- "Closure de mots" [Exalang 5-8] ≠ "Closure de texte" [Exalang 8-11] : la première est une production lexicale, la seconde une compréhension contextuelle.
- "Lecture de texte" [Exalang 5-8 mi-CP] ≠ "Leximétrie" [Exalang 8-11] : la première est une lecture compréhension globale, la seconde est purement vitesse.
- "Approche implicite de la lecture" [Exalang 5-8] ≠ "Conscience de l'écrit" [Exalang 3-6] : recouvrement partiel seulement, pas d'équivalence directe.
- Bilan adulte (PREDIMEM / PrediFex / PrediLac / Lyfac) ↔ bilan enfant (Exalang / EVALEO) : **aucun matching cross-population**.

##### Règles pour les épreuves orphelines

- **Épreuve actuelle SANS équivalent dans le bilan précédent** → la signaler dans \`synthese_evolution.nouvelles\` (et non dans progres/regression).
- **Épreuve du bilan précédent SANS équivalent dans l'actuel** → l'ignorer (le bilan actuel ne mesure plus cette compétence).
- **NE JAMAIS** conclure à un progrès ou une régression massive sur les épreuves orphelines, c'est de la non-comparabilité, pas une évolution clinique.

##### Ratio de comparabilité, à mentionner dans \`synthese_evolution.resume\`

Calcule \`(nombre d'épreuves comparables) / (nombre d'épreuves actuelles)\`. Adapte la 1re phrase du \`resume\` :

- **≥ 80 %** : *"L'évolution est documentée par [X] épreuves comparables sur [Y]."*
- **50-79 %** : *"L'évolution porte sur [X] épreuves sur [Y] (les autres étant spécifiques à la nouvelle batterie)."*
- **< 50 %** : *"La comparaison directe est limitée ([X] épreuves sur [Y]) du fait du changement de batterie entre les 2 bilans. La synthèse repose davantage sur la trajectoire globale et le jugement clinique de l'orthophoniste."*

#### NOMENCLATURE AMO, Mention OBLIGATOIRE en conclusion

Le CRBO DOIT inclure dans la conclusion 1 phrase (2 lignes max) précisant la nomenclature AMO applicable :
- **AMO 9.4** : rééducation des troubles du langage oral (TDL, retard simple, troubles articulatoires).
- **AMO 8.4** : rééducation des troubles du langage écrit (dyslexie débutante en fin CE1).

Pour Exalang 5-8 le choix dépend du profil dominant : TDL/retard simple → **AMO 9.4** ; dyslexie débutante en fin CE1 → **AMO 8.4**. Profil mixte → mentionner les deux AMO avec le dominant en premier.

Format attendu : "La rééducation s'inscrit dans le cadre de la nomenclature AMO 9.4 (rééducation des troubles du langage oral)." Une phrase, point.`,
}
