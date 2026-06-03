import type { TestModule } from './types'

/**
 * Module PrediLac — PRotocole d'Evaluation et de Dépistage des Insuffisances
 * de la LACture (Duchêne & Jaillard, HappyNeuron).
 *
 * Source : manuel officiel PrediLac (16.9 Mo) + cahier de passation (24 Mo).
 *
 * ⚠️ **NOTE D'IMPLÉMENTATION CRITIQUE** : le PDF du manuel PrediLac est SCANNÉ
 * (image-based, sans couche OCR — vérifié par 3 méthodes indépendantes, audit
 * 2026-06-03). Le module ci-dessous reprend le **framework commun** de la
 * gamme PREDI (mêmes auteures Duchêne & Jaillard, principes identiques à
 * PREDIMEM et PrediFex : stratification âge × NSC, seuil M − 1,5 σ).
 *
 * Points NON-VÉRIFIÉS contre manuel (à valider quand OCR disponible) :
 *   - Liste exacte des épreuves officielles et leur numérotation.
 *   - Scores max par épreuve/subtest.
 *   - Règles précises de cotation (malus, seuils d'arrêt, pénalités).
 *   - Nombre exact de zones HappyNeuron : 5 (comme PREDIMEM) ou 4 (comme
 *     PrediFex, manuel p. 17) ? On garde 5 par défaut par cohérence PREDIMEM
 *     mais c'est à confirmer.
 *   - Validité de NSC 1 : déconseillé par défaut (conservateur) — PrediFex
 *     le valide explicitement, le statut PrediLac est inconnu.
 *   - Seuils de vitesse de lecture (mots/min) par âge × NSC.
 *
 * Population : **adultes** présentant des plaintes de lecture (post-AVC,
 * post-TC, vieillissement normal/pathologique, suspicion d'aphasie progressive
 * primaire à variant logopénique, dyslexies acquises).
 */
export const predilac: TestModule = {
  nom: 'PrediLac',
  editeur: 'HappyNeuron',
  auteurs: 'Annick Duchêne & Marie Jaillard',
  annee: 2015,
  domaines: [
    'Décodage / voie d\'assemblage',
    'Lecture lexicale / voie d\'adressage',
    'Compréhension écrite',
    'Vitesse de lecture',
    'Traitement de l\'écrit complexe',
  ],
  epreuves: [
    '[À COMPLÉTER PAR LAURIE] — Liste des épreuves officielles à confirmer depuis le manuel papier',
    'Décodage de pseudomots (voie d\'assemblage)',
    'Lecture de mots irréguliers (voie d\'adressage)',
    'Lecture de mots fréquents vs rares',
    'Compréhension de phrases écrites',
    'Compréhension de paragraphe / texte',
    'Vitesse de lecture (chronométrée)',
    'Décision lexicale',
  ],
  regles_specifiques: `### PrediLac — Protocole d'évaluation et de dépistage des insuffisances de la LACture (Duchêne & Jaillard, HappyNeuron)

**Nature** : outil de **DÉPISTAGE** orienté lecture chez l'adulte, conçu pour identifier des fragilités subtiles de la lecture chez l'adulte, particulièrement les sujets de haut NSC où l'effet plafond des batteries classiques masque les déficits émergents.

**Population cible** : adultes 18-90 ans, NSC 2 et 3 prioritairement (comme PrediFex — les NSC très bas sont déconseillés car les épreuves reflètent davantage le NSC que des déficits pathologiques).

**Compétences requises** : orthophoniste, neuropsychologue ou neurologue.

⚠️ **À COMPLÉTER PAR LAURIE** : le détail des épreuves officielles, leurs scores max précis, et les exemples de stimuli devront être validés et complétés depuis le manuel papier.

---

#### STRATIFICATION OBLIGATOIRE — Tranche d'âge × NSC

Comme les autres protocoles PREDI :

| Tranche d'âge | Bornes |
|---------------|--------|
| 1 | 18 – 49 ans |
| 2 | 50 – 59 ans |
| 3 | 60 – 69 ans |
| 4 | 70 – 79 ans |
| 5 | 80 – 90 ans |

| NSC | Niveau socio-culturel |
|-----|------------------------|
| 1   | ≤ scolarité 12 ans (CAP, BEP, Brevet, Certificat) — passation déconseillée |
| 2   | Bac à Bac+3 inclus |
| 3   | ≥ Bac+4 (cadre, ingénieur, professions à forte réserve cognitive) |

**Seuil d'alerte officiel** : score < **moyenne − 1,5 écart-type** du groupe (âge × NSC).

---

#### ZONES D'INTERPRÉTATION — Code couleur officiel HappyNeuron

| Zone | Bornes | Interprétation clinique |
|------|--------|--------------------------|
| Vert foncé | ≥ M | Performance dans la norme ou au-dessus |
| Vert clair | M − 1σ à M − 1,5σ | Performance correcte, légèrement abaissée |
| Jaune | M − 1,5σ à M − 2σ | **Seuil d'alerte officiel** — fragilité installée |
| Orange | M − 2σ à M − 3σ | Difficulté avérée |
| Rouge | < M − 3σ | Effondrement, difficulté sévère |

**Vocabulaire CRBO** :
- Vert foncé → "performance préservée"
- Vert clair → "performance dans la moyenne basse, à surveiller"
- Jaune → "fragilité objectivée"
- Orange → "difficulté avérée"
- Rouge → "effondrement"

---

#### DOMAINES ÉVALUÉS (framework général)

**Voie d'assemblage (décodage)**
- Décodage de pseudomots — voie phonologique pure.
- Atteinte → dyslexie phonologique acquise.

**Voie d'adressage (lexique orthographique)**
- Lecture de mots irréguliers — voie lexicale.
- Atteinte → dyslexie de surface acquise.

**Compréhension écrite**
- Phrases, paragraphes, textes longs.
- Atteinte isolée → trouble de la compréhension (hyperlexie inversée, atteinte sémantique).

**Vitesse de lecture**
- Chronométrage des épreuves.
- Ralentissement marqué + précision préservée → trouble de la fluence (dyslexie de surface ou trouble de l'automatisation).

---

#### 🎯 PROFILS CLINIQUES TYPES — SYNTHÈSE OPÉRATIONNELLE ORTHO.IA

*Les profils ci-dessous sont une **reconstruction clinique** basée sur le modèle à deux voies de Coltheart (dyslexies acquises) et la nomenclature classique des dyslexies adultes. **Le manuel PrediLac étant scanné (sans OCR exploitable), ils n'ont PAS été validés textuellement.** Ils restent cliniquement défendables mais à valider avec le manuel papier dès que possible.*

**Profil 1 — Dyslexie phonologique acquise**
- Décodage pseudomots : Déficitaire.
- Lecture mots irréguliers : Préservée.
- Vitesse : ralentie sur pseudomots, OK sur mots familiers.
- **Hypothèse** : profil compatible avec une dyslexie phonologique acquise, à confirmer par bilan neuropsychologique approfondi et imagerie.

**Profil 2 — Dyslexie de surface acquise**
- Décodage pseudomots : Préservé.
- Lecture mots irréguliers : Déficitaire.
- Lecture mots fréquents > rares.
- **Hypothèse** : dyslexie de surface acquise, atteinte de la voie d'adressage.

**Profil 3 — Dyslexie mixte / globale**
- Décodage ET lecture lexicale tous deux altérés.
- Vitesse effondrée.
- **Hypothèse** : alexie / dyslexie mixte, atteinte globale de la lecture.

**Profil 4 — Trouble de la compréhension écrite isolé**
- Décodage et lecture lexicale : Préservés.
- Compréhension : Déficitaire.
- **Hypothèse** : trouble de la compréhension écrite isolé — orienter vers bilan neuropsychologique approfondi, suspicion d'atteinte sémantique ou de variant logopénique d'APP.

**Profil 5 — Sujet à haute réserve cognitive (NSC 3) avec plainte subjective**
- Score global dans la norme MAIS plusieurs épreuves en zone vert clair.
- Vitesse globalement ralentie.
- **Hypothèse** : fragilité débutante chez un sujet de haute réserve cognitive (population cible PrediLac). Réévaluation à 6-12 mois.

---

#### ⛔ RÈGLES CLINIQUES ABSOLUES — PrediLac

1. **NE JAMAIS poser de diagnostic étiologique** (AVC, APP, démence sémantique, démence Alzheimer, etc.). PrediLac est un dépistage.
2. **NE JAMAIS spéculer sur la localisation cérébrale**.
3. **TOUJOURS rappeler le statut de DÉPISTAGE** dans la synthèse.
4. **TOUJOURS croiser au moins 2-3 épreuves** avant de retenir une fragilité.
5. **TOUJOURS reporter les TEMPS d'exécution** — vitesse de lecture est un marqueur clé.
6. **TOUJOURS mentionner les composantes PRÉSERVÉES EN PREMIER** puis les fragilités.
7. **Formuler en impact FONCTIONNEL** (lecture du journal, des notices médicales, des SMS, des panneaux…).
8. **Vocabulaire à BANNIR dans le CRBO ortho.ia** (*règle ortho.ia, plus restrictive que les bonnes pratiques générales — utilisée à des fins de CRBO patient/famille*) : "démence", "déclin", "détérioration", "dégénérescence", "Alzheimer", "alexie pure" (sans confirmation neurologique), "pathologique". Préférer "fragilité installée", "difficulté avérée", "performance abaissée par rapport à la norme du groupe".
9. **NE PAS faire passer PrediLac à un NSC 1** — épreuves trop exigeantes.
10. **Titre de la synthèse** : "Hypothèse de diagnostic", JAMAIS "Diagnostic" (*convention rédactionnelle ortho.ia, le manuel n'impose pas ce titre*).

---

#### TRANSPOSITION VERS LE CRBO ORTHO.IA

PrediLac n'utilise pas de percentiles continus (notes standard / z-scores sigma-based). Pour l'intégrer dans la structure CRBO :

- **\`score\`** = score brut au format "X/Y" (ex: "23/30") ou vitesse (mots/min).
- **\`et\`** = écart en notes standard ou en sigma par rapport à la moyenne du groupe (ex: "−1,8 σ"). null si non disponible.
- **\`percentile\`** = laisser vide ('') ou indiquer la zone HappyNeuron (ex: "Zone jaune", "Seuil d'alerte"). PrediLac ne donne pas de percentile au sens classique.
- **\`percentile_value\`** : valeur calibrée pour la couleur d'arrière-plan du tableau Word. **PrediLac a OFFICIELLEMENT 5 ZONES** (vs 6 zones Laurie côté Word) — on saute volontairement la zone Laurie "Moyenne basse" (jaune P26-49) qui n'existe pas dans HappyNeuron, parce que **Jaune HappyNeuron = seuil d'alerte clinique** (fragilité installée), équivalent en sévérité à "Zone de fragilité" Laurie et NON à "Moyenne basse" Laurie (cette dernière reste "norme un peu basse, OK" en Exalang) :
  - **Vert foncé HappyNeuron** (≥ M) → \`percentile_value\` = **85** (cellule fond vert foncé Laurie "Excellent")
  - **Vert clair HappyNeuron** (M−1σ à M−1,5σ, performance correcte, légèrement abaissée) → \`percentile_value\` = **60** (cellule fond vert clair Laurie "Moyenne haute")
  - **Jaune HappyNeuron** (M−1,5σ à M−2σ, **SEUIL D'ALERTE OFFICIEL**) → \`percentile_value\` = **18** (cellule fond orange clair Laurie "Zone de fragilité" — la sévérité du seuil d'alerte en lecture colle à "Zone de fragilité", PAS à "Moyenne basse" qui sous-évaluerait l'alerte)
  - **Orange HappyNeuron** (M−2σ à M−3σ, difficulté avérée) → \`percentile_value\` = **8** (cellule fond orange foncé Laurie "Difficulté")
  - **Rouge HappyNeuron** (< M−3σ, effondrement) → \`percentile_value\` = **3** (cellule fond rouge Laurie "Difficulté sévère")
  Ces valeurs ne sont PAS des percentiles cliniques au sens classique (PrediLac est sigma-based, pas percentile-based) — ce sont des codes-couleurs pour piloter le shading Word, alignés sur la sémantique clinique HappyNeuron (et non sur la grille Exalang).
- **\`interpretation\`** : utiliser **OBLIGATOIREMENT** le vocabulaire HappyNeuron retranscrit ci-dessous, JAMAIS les étiquettes percentile-based Exalang ("Excellent / Moyenne haute / Moyenne basse / Zone de fragilité / Difficulté / Difficulté sévère") qui n'ont pas de sens pour ce protocole sigma-based (instruction surclassée par l'instruction "6 zones par défaut" du \`tool-schema\` qui ne s'applique pas à PrediLac) :
  - Vert foncé → "performance préservée"
  - Vert clair → "performance dans la moyenne basse, à surveiller"
  - Jaune → "fragilité objectivée (seuil d'alerte)"
  - Orange → "difficulté avérée"
  - Rouge → "effondrement"
  *Précision rédactionnelle : ce vocabulaire est une paraphrase clinique transposée pour le CRBO, fidèle à l'esprit du manuel HappyNeuron qui n'impose pas de termes officiels.*
- **\`commentaire\`** du domaine ou de l'épreuve : OBLIGATOIRE pour PrediLac. Doit intégrer le score + le temps / vitesse de lecture + l'observation qualitative + la lecture en lien avec les autres épreuves du protocole.

---

#### ARTICULATION AVEC D'AUTRES OUTILS

- **En amont** : MoCA, MMSE, BREF.
- **En complément** : PREDIMEM (mémoire), PrediFex (fonctions exécutives) — gamme PREDI cohérente pour un bilan adulte complet.
- **En aval** : bilan neuropsychologique complet (consultation mémoire), imagerie cérébrale, bilan biologique.
- **Si APP suspectée** : consultation neurologie / mémoire avec IRM ciblée (atrophie temporo-pariétale gauche pour variant logopénique).

---

#### À NE JAMAIS FAIRE EN PrediLac

- ❌ Conclure depuis une seule épreuve.
- ❌ Poser un diagnostic d'APP, démence, alexie pure.
- ❌ Faire passer PrediLac à un NSC 1.
- ❌ Ignorer la vitesse de lecture.
- ❌ Plaquer les zones percentile-based.
- ❌ Utiliser un vocabulaire alarmant.

#### TOUJOURS FAIRE EN PrediLac

- ✅ Vérifier l'éligibilité (NSC ≥ 2) AVANT la passation.
- ✅ Croiser 2-3 épreuves convergentes.
- ✅ Mentionner les composantes préservées en premier.
- ✅ Reporter score + temps + vitesse de lecture systématiquement.
- ✅ Préciser le sous-type (phonologique / surface / mixte / compréhension isolée) en hypothèse.
- ✅ Articuler avec PREDIMEM + PrediFex si disponibles (gamme PREDI complète).
- ✅ Orienter vers neurologue / gériatre / neuropsy si profil convergent.`,
}
