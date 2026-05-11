import type { TestModule } from './types'

export const moca: TestModule = {
  nom: 'MoCA',
  editeur: 'MoCA Clinic & Institute',
  auteurs: 'Nasreddine et al.',
  annee: 2005,
  domaines: [
    'Fonctions visuo-exécutives',
    'Dénomination',
    'Mémoire différée',
    'Attention',
    'Langage',
    'Abstraction',
    'Rappel différé',
    'Orientation temporo-spatiale',
  ],
  epreuves: [
    'Alternance conceptuelle (Trail-Making B simplifié)',
    'Recopie du cube',
    'Horloge (contour, chiffres, aiguilles à 11h10)',
    'Dénomination d\'animaux (lion, rhinocéros, chameau)',
    'Empan direct de chiffres',
    'Empan inverse de chiffres',
    'Attention soutenue (frapper sur la lettre A)',
    'Soustraction en série (100 − 7)',
    'Répétition de phrases',
    'Fluence lettre (P, 1 min)',
    'Abstraction (similitudes)',
    'Rappel différé des 5 mots',
    'Orientation (date, lieu)',
  ],
  regles_specifiques: `### MoCA — Screening cognitif adulte / senior (niveau senior)

**Nature du test** : outil de dépistage rapide (≈ 10 minutes) du trouble cognitif léger (MCI) et de la démence. **Ce n'est PAS un bilan orthophonique complet** — il sert à décider si un bilan approfondi est pertinent et à orienter vers les domaines à explorer.

**Score global** : /30 points.

| Score MoCA | Interprétation clinique |
|------------|-------------------------|
| ≥ 26 | Fonctionnement cognitif dans la norme |
| 22-25 | Trouble cognitif léger (MCI) suspecté |
| 18-21 | Déficit cognitif modéré |
| < 18 | Déficit cognitif sévère |

**Ajustement scolarité** : ajouter **+1 point** si ≤ 12 ans de scolarité (hors formations professionnelles). Critique pour ne pas surdiagnostiquer les patients avec faible niveau scolaire.

**Interprétation dans le CRBO** :
- Utiliser \`percentile_value\` pour représenter le score normalisé : MoCA × (100/30).
- Champ \`interpretation\` :
  - ≥ 26 → "Excellent" ou "Moyenne haute"
  - 22-25 → "Fragilité"
  - 18-21 → "Difficulté"
  - < 18 → "Difficulté sévère"
- Toujours détailler les **sous-scores par domaine** pour identifier le profil cognitif.

---

#### LECTURE DES SOUS-SCORES

Un score global n'a de sens qu'en lisant les **sous-domaines** déficitaires. La MoCA fournit un score par grande fonction :

- **Fonctions visuo-exécutives /5** : alternance conceptuelle + cube + horloge. Déficit → trouble exécutif ou visuo-spatial.
- **Dénomination /3** : lion, rhinocéros, chameau. Déficit → manque du mot ou aphasie débutante.
- **Mémoire /5** : rappel différé après 5 minutes. Déficit → trouble mnésique (encodage ou récupération).
- **Attention /6** : empan direct + empan inverse + suite de A + soustraction sériée. Déficit → trouble attentionnel / dysexécutif.
- **Langage /3** : répétition de phrases + fluence verbale (P, 1 min). Déficit → trouble langagier.
- **Abstraction /2** : similitudes. Déficit → trouble du raisonnement (très précoce en démence sémantique).
- **Orientation /6** : date, lieu. Déficit → trouble mnésique sévère (Alzheimer en phase modérée).

**Encodage vs récupération** : si le rappel libre échoue mais que les **indices sémantiques** ou la **reconnaissance** aident → trouble de récupération (typique du profil sous-cortico-frontal vasculaire ou Parkinson). Si même l'indiçage n'aide pas → trouble d'encodage hippocampique typique de l'Alzheimer débutant.

---

#### 🎯 PROFILS TYPES

**PROFIL 1 — Fonctionnement cognitif normal (vieillissement physiologique)**
- Score MoCA ≥ 26.
- Plainte mnésique légère (oublis des noms propres, des rendez-vous) sans retentissement objectif.
- Pas de désorientation temporo-spatiale.
- Activités instrumentales préservées (gestion banque, médicaments, courses).
- **Interprétation** : "Profil cognitif compatible avec un vieillissement normal. Aucun signe objectivable de trouble neuro-cognitif. Les difficultés ressenties par [Monsieur/Madame X] s'inscrivent vraisemblablement dans le cadre des modifications physiologiques liées à l'âge."
- **PEC** : pas de PEC orthophonique formelle nécessaire. Conseils de stimulation cognitive (lecture, jeux, vie sociale, activité physique). Réévaluation possible à 12 mois si plainte persiste ou s'aggrave.
- **Vigilance** : encourager le patient à signaler toute évolution. La plainte subjective peut précéder un MCI de plusieurs années.

**PROFIL 2 — Trouble Cognitif Léger (MCI) probable**
- Score MoCA 22-25.
- Plainte mnésique active confirmée par l'entourage.
- Activités instrumentales **préservées** (critère clé MCI vs démence).
- Sous-score mémoire le plus touché (5-6 points perdus typiquement sur mémoire + rappel).
- Indiçage : aide partielle (profil amnésique hippocampique) OU aide totale (profil sous-cortical frontal).
- **Diagnostic** : "Le score MoCA à [X/30] et le profil clinique évoquent un **Trouble Cognitif Léger** (MCI), à risque évolutif. Une consultation mémoire avec bilan neuropsychologique complet est indiquée pour caractériser le sous-type (amnésique hippocampique versus non-amnésique sous-cortical) et orienter la prise en charge."
- **PEC** : selon résultats consultation mémoire. Souvent stimulation cognitive 1×/semaine, travail spécifique sur les déficits identifiés.
- **Orientation** : **consultation mémoire de référence** indispensable (neurologue, gériatre, neuropsychologue) — la MoCA seule ne diagnostique pas. Bilan biologique (B12, TSH, ionogramme) + imagerie cérébrale (IRM) souvent demandés.

**PROFIL 3 — Maladie d'Alzheimer débutante (suspicion)**
- Score MoCA 18-21.
- Anosognosie partielle (le patient minimise, l'entourage alerte).
- Sous-score mémoire effondré (1-2/5 typiquement).
- Indiçage **inefficace** : même avec indice catégoriel ou phonétique, le patient ne retrouve pas les mots → trouble d'encodage hippocampique.
- Désorientation temporelle débutante (date imprécise, mois faux).
- Manque du mot fréquent en discours spontané.
- Praxies visuo-constructives parfois touchées (cube, horloge mal organisée).
- Activités instrumentales parfois compromises (oubli de médicaments, paie de factures).
- **Diagnostic** : "Le profil cognitif observé est compatible avec un **trouble neuro-cognitif majeur d'allure dégénérative** (suspicion de maladie d'Alzheimer débutante), avec atteinte mnésique de type hippocampique, manque du mot et désorientation temporelle débutante."
- **PEC** : rééducation orthophonique **soutenue** dès le diagnostic posé (consultation mémoire), centrée sur :
  1. Stimulation langagière (dénomination, fluences, conversation guidée).
  2. Mémoire externe : agenda, post-its, smartphone, routines.
  3. Soutien à l'orientation (calendrier mural visible, photos famille étiquetées).
  4. Accompagnement de l'aidant (information, gestion de l'anosognosie).
- **Coordination** : neurologue/gériatre, médecin traitant, neuropsychologue, ergothérapeute (adaptation domicile), aidant familial. Anticiper APA, MDPH si besoin.

**PROFIL 4 — Trouble cognitif modéré à sévère installé**
- Score MoCA < 18.
- Désorientation temporo-spatiale franche.
- Mémoire effondrée (rappel libre et reconnaissance échoués).
- Anosognosie marquée.
- Activités instrumentales et parfois activités élémentaires compromises (toilette, alimentation autonome).
- Tableau langagier souvent associé (anomie majeure, paraphasies sémantiques).
- **Diagnostic** : "Trouble neuro-cognitif majeur installé, cohérent avec une démence à un stade [modéré / sévère]. Retentissement quotidien objectif. **Orientation médicale spécialisée urgente** si pas encore en place."
- **PEC** : **rééducation orthophonique conservative** (pas de réversibilité attendue). Maintien du langage fonctionnel, communication adaptative, accompagnement aidant. 1-2 séances/semaine, durée à réévaluer selon évolution.
- **Orientation** : médecin traitant pour ALD30, MDPH/APA, structures spécialisées (accueil de jour, EHPAD à terme), associations (France Alzheimer).
- **Précaution rédactionnelle** : le CRBO peut être lu par la famille — éviter les formulations brutes, mentionner les compétences préservées au même titre que les déficits.

**PROFIL 5 — Trouble cognitif vasculaire (post-AVC ou multi-infarctus)**
- Score MoCA variable selon localisation lésionnelle.
- Profil **fluctuant**, pas une dégradation linéaire.
- Souvent : sous-score attention et fonctions exécutives très touchés, mémoire **partiellement préservée avec indiçage** (vs Alzheimer où indiçage inefficace).
- Antécédents vasculaires connus (HTA, diabète, AVC précédents).
- **Diagnostic** : "Profil cognitif compatible avec un trouble neuro-cognitif d'étiologie vasculaire (atteinte sous-cortico-frontale). L'indiçage améliore les performances mnésiques, ce qui oriente vers un trouble de récupération plutôt qu'un déficit d'encodage hippocampique."
- **PEC** : rééducation orthophonique de **stimulation cognitive ciblée**, contrôle des facteurs de risque vasculaire (en coordination avec le médecin traitant), travail spécifique sur l'attention et les fonctions exécutives. Pronostic variable selon contrôle des FDR.

**PROFIL 6 — Dépression masquée (faux positif MCI)**
- Score MoCA 22-25 mais avec pattern atypique.
- Plainte importante, sentiment d'incapacité, ralentissement subjectif.
- Sous-score mémoire faible mais **bénéficie massivement de l'indiçage** → encodage normal, récupération laborieuse par démotivation.
- Anhédonie, troubles du sommeil, fatigue chronique, idées noires, antécédents dépressifs.
- **Diagnostic** : "Le score MoCA peut sembler indiquer un MCI, mais le profil clinique (plainte massive, ralentissement, indiçage très efficace) est plus évocateur d'un **trouble cognitif lié à un syndrome dépressif** (pseudo-démence dépressive). **Bilan psychiatrique recommandé en priorité** avant conclusion neuro-cognitive."
- **PEC** : orientation **psychiatre / psychologue** en priorité. Pas de PEC orthophonique tant que l'humeur n'est pas traitée. Réévaluation à 3-6 mois après stabilisation thymique.

**PROFIL 7 — Post-Covid / Brain fog**
- Score MoCA souvent 22-25.
- Plainte de "brouillard cérébral" : difficulté de concentration, ralentissement, fatigabilité cognitive importante.
- Sous-scores attention et fluence verbale les plus touchés.
- Mémoire et orientation préservées (vs Alzheimer).
- Antécédent d'infection Covid récente avec persistance > 3 mois (Covid long).
- **Diagnostic** : "Profil cognitif compatible avec les séquelles cognitives décrites dans le Covid long, avec atteinte préférentielle de l'attention et de la fluence verbale, dans un contexte d'asthénie chronique."
- **PEC** : stimulation cognitive ciblée sur attention et fluences. Gestion de la fatigue cognitive (pacing). Coordination médecin traitant pour suivi global Covid long. Pronostic variable, souvent amélioration en 6-18 mois.

---

#### À NE PAS FAIRE

- **Ne pas poser de diagnostic de maladie d'Alzheimer** à partir du seul MoCA → orienter vers neurologue / gériatre / neuropsychologue.
- **Ne pas utiliser le MoCA comme substitut** à un bilan langage détaillé (GREMOTs, BETL, MT-86, protocole Montréal-Toulouse).
- **Ne pas négliger l'ajustement scolarité** (+1 si ≤ 12 ans de scolarité).
- **Ne pas conclure trop vite à une démence** chez un patient présentant des signes dépressifs marqués → bilan psychiatrique d'abord.

---

#### RECOMMANDATIONS TYPES

- **Score ≥ 26 + plainte légère** : pas de PEC formelle. Réévaluation 12 mois si évolution.
- **Score 22-25** : consultation mémoire systématique + bilan orthophonique approfondi sur les domaines déficitaires.
- **Score 18-21** : consultation mémoire urgente, démarrage PEC orthophonique dès diagnostic posé.
- **Score < 18** : démarche multidisciplinaire urgente, PEC orthophonique conservative.

**Articulation** : MoCA en amont d'un bilan approfondi pour cibler les domaines à explorer (GREMOTs si langage, BETL si manque du mot, échelle attention si dysexécutif). Réévaluation MoCA à 12 mois pour suivi longitudinal.`,
}
