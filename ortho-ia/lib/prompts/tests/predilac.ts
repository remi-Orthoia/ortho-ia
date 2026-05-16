import type { TestModule } from './types'

/**
 * Module PrediLac — PRotocole d'Evaluation et de Dépistage des Insuffisances
 * de la LACture (Duchêne & Jaillard, HappyNeuron).
 *
 * Source : manuel officiel PrediLac (16.9 Mo) + cahier de passation (24 Mo).
 *
 * ⚠️ **NOTE D'IMPLÉMENTATION** : le PDF du manuel PrediLac est scanné (image-based,
 * non extractible automatiquement). Le module ci-dessous reprend le **framework
 * commun** de la gamme PREDI (mêmes auteures Duchêne & Jaillard, mêmes principes
 * que PREDIMEM et PrediFex : stratification âge × NSC, seuil M − 1,5 σ, 5 zones
 * couleur HappyNeuron). Les épreuves spécifiques et leurs scores max sont
 * marqués `[À COMPLÉTER PAR LAURIE]` — à valider et compléter depuis le manuel
 * papier ou via OCR ultérieur.
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

#### 🎯 PROFILS CLINIQUES TYPES (extrapolés de la gamme PREDI)

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
8. **Vocabulaire à BANNIR** : "démence", "déclin", "détérioration", "dégénérescence", "Alzheimer", "alexie pure" (sans confirmation neurologique), "pathologique".
9. **NE PAS faire passer PrediLac à un NSC 1** — épreuves trop exigeantes.
10. **Titre de la synthèse** : "Hypothèse de diagnostic", JAMAIS "Diagnostic".

---

#### TRANSPOSITION VERS LE CRBO ORTHO.IA

- **\`percentile_value\`** calibré pour la couleur Word (cohérent avec PREDIMEM/PrediFex) :
  - Vert foncé → 85 (Excellent)
  - Vert clair → 60 (Moyenne haute)
  - Jaune → 18 (Fragilité)
  - Orange → 7 (Difficulté)
  - Rouge → 3 (Difficulté sévère)

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
