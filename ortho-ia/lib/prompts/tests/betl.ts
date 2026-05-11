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
  regles_specifiques: `### BETL — Batterie d'Évaluation des Troubles du Langage chez l'adulte et le sujet âgé (niveau senior)

**Population cible** : adultes et personnes âgées (particulièrement **60 ans et plus**), avec ou sans plainte mnésique / langagière. Étalonnage principal sur sujets de 60+.

**Indications cliniques** :
- **Vieillissement normal vs pathologique** : mesurer l'efficience langagière dans le vieillissement cognitif.
- **Pathologies neurodégénératives** : aphasie progressive primaire (APP), démence sémantique, Alzheimer débutant.
- **Post-AVC** : aphasies corticales, troubles lexico-sémantiques.
- **Traumatisme crânien**, tumeur cérébrale, SEP.
- **Suivi longitudinal** : comparaison des scores à 6-12 mois d'intervalle.

#### RÈGLES DE CONVERSION

Seuils d'interprétation standards :
- P ≥ 25 → "Excellent" / "Moyenne haute" (compatible vieillissement normal)
- P10-P24 → "Fragilité" (à surveiller, bilan neuro complémentaire à discuter)
- P6-P9 → "Difficulté" (évoque une pathologie acquise débutante)
- P ≤ 5 → "Difficulté sévère" (cohérent avec aphasie ou démence installée)

**Ajustement scolarité** : toujours croiser avec le niveau d'étude du patient. Les normes BETL sont stratifiées par niveau scolaire — un score "fragile" chez un patient avec faible scolarité peut être normal pour son groupe.

---

#### POINTS D'INTERPRÉTATION CLÉS

**1. VITESSE D'ACCÈS LEXICAL** (dénomination chronométrée)
- La BETL est particulièrement discriminante pour les **temps de dénomination**.
- Un allongement systématique (même avec exactitude conservée) est un marqueur sensible du **manque du mot sub-clinique**.
- Peut précéder une anomie franche de 2-5 ans dans les pathologies neurodégénératives.

**2. FLUENCES VERBALES** (catégorielle vs lettre)
- **Fluence catégorielle > fluence lettre** (dissociation classique) → trouble **dysexécutif** (touche la récupération stratégique). Profil typique : démence sous-cortico-frontale, post-AVC frontal, dépression sévère.
- **Fluence lettre > catégorielle** (dissociation inverse) → trouble **lexico-sémantique** (touche l'organisation du lexique sémantique). Profil typique : **démence sémantique** (variante d'APP), Alzheimer modéré.
- **Les deux effondrées** → atteinte multi-composantes, suspicion d'Alzheimer évolué ou APP.

**3. ANOMIE ET PARAPHASIES** (analyse qualitative cruciale)
- **Paraphasies sémantiques** : donner un mot de la même catégorie ("chat" pour "chien"). → atteinte lexico-sémantique.
- **Paraphasies phonologiques** : substitution de phonèmes ("babier" pour "panier"). → atteinte phonologique (post-AVC gauche typiquement).
- **Circonlocutions** ("le truc qui sert à...") → stratégie de contournement, signe de bonne préservation des connaissances mais difficulté de récupération.
- **Effet d'amorçage phonologique** : si donner la 1re syllabe aide → trouble de récupération (pronostic favorable). Si même l'amorçage n'aide pas → trouble lexical profond.

**4. PRÉSERVATION DE LA COMPRÉHENSION ORALE**
- Compréhension préservée + production altérée → aphasie **non-fluente / motrice** (Broca, APP non-fluente).
- Compréhension altérée + production fluente mais peu informative → aphasie **fluente / sensorielle** (Wernicke, démence sémantique).
- Les deux altérées → aphasie globale, démence évoluée.

---

#### 🎯 PROFILS TYPES

**PROFIL 1 — Vieillissement normal sans pathologie**
- Tous les scores ≥ P25.
- Quelques manques du mot occasionnels signalés par le patient (oubli de noms propres surtout), sans retentissement objectif.
- Temps de dénomination légèrement allongés mais dans les normes pour l'âge.
- Compréhension préservée.
- Discours informatif et bien structuré.
- **Diagnostic** : "Les performances langagières de [Monsieur/Madame X] sont dans les normes attendues pour son âge et son niveau d'étude. **Aucun argument objectif n'évoque un trouble langagier acquis.** La plainte exprimée s'inscrit vraisemblablement dans le cadre des modifications physiologiques liées au vieillissement (ralentissement de l'accès lexical, sensibilité accrue à la fatigue cognitive)."
- **PEC** : pas de PEC orthophonique. Conseils de stimulation (lecture, conversations, jeux verbaux). Réévaluation à 12 mois si plainte persiste ou s'aggrave.

**PROFIL 2 — Manque du mot sub-clinique (vieillissement avec fragilité lexicale)**
- Fluences en limite basse à fragile (P10-P25).
- Temps de dénomination significativement allongés (P5-P15) mais exactitude préservée.
- Quelques paraphasies sémantiques occasionnelles en discours spontané.
- Compréhension préservée.
- Pas de retentissement objectif en vie quotidienne mais plainte active du patient.
- **Diagnostic** : "Profil langagier de fragilité lexicale isolée, sans atteinte clinique de la compréhension ou du discours. Les temps de dénomination allongés et les quelques paraphasies sémantiques observées évoquent un **manque du mot sub-clinique**, à surveiller dans une logique de prévention. Aucun argument à ce stade pour un trouble neuro-dégénératif installé."
- **PEC** : **stimulation lexico-sémantique préventive**, 10-15 séances ou suivi mensuel. Travail sur les stratégies de récupération (associations, indiçage, contextualisation). Bilan complet (MoCA + neuropsy) si évolution.

**PROFIL 3 — Aphasie progressive primaire (APP) — variante logopénique débutante**
- Manque du mot **central**, sévère et progressif (P < 5 sur dénomination + fluence catégorielle).
- Répétition de phrases longues échouée (marqueur APP logopénique).
- Compréhension de phrases isolées préservée mais difficile sur phrases complexes.
- Discours spontané : hésitations fréquentes, recherche de mots constante, parfois manques compensés par périphrases.
- Aucun trouble du comportement / changement de personnalité signalé.
- Plainte centrée sur le langage et préservation relative des autres fonctions cognitives.
- Évolution progressive sur 12-24 mois.
- **Diagnostic** : "Le profil clinique évoque une **aphasie progressive primaire** (APP), avec atteinte centrale et progressive du manque du mot et de la répétition de phrases longues. La variante logopénique est la plus probable. **Bilan neurologique avec imagerie cérébrale (IRM) impératif** pour confirmer le diagnostic et exclure d'autres étiologies. Une consultation en centre référent mémoire / langage est fortement indiquée."
- **PEC** : démarrage urgent dès suspicion. **Rééducation lexico-sémantique soutenue** (1-2 séances/sem), travail sur l'accès lexical multi-modal, mémoire externe (carnets de mots), stratégies de communication compensatoires. Préparation à l'évolution attendue (anomie majeure puis trouble compréhension).
- **Coordination** : neurologue référent maladies neurodégénératives, neuropsychologue, médecin traitant, famille.

**PROFIL 4 — Démence sémantique (APP variante sémantique)**
- Atteinte lexico-sémantique **massive et progressive** (P < 2 sur dénomination, fluence catégorielle, désignation).
- Compréhension de mots isolés progressivement altérée (signe pathognomonique).
- Manque du mot avec **perte du sens du mot** (ne reconnaît plus l'objet, paraphasies sémantiques distantes : "fauteuil" pour "girafe").
- Fluence lettre relativement préservée vs fluence catégorielle effondrée (dissociation lettre > catégorielle).
- Surface mots irréguliers échoués en lecture (dyslexie de surface acquise — atteinte lexique orthographique).
- Comportement parfois modifié (compulsions, désinhibition légère) dans les formes mixtes.
- **Diagnostic** : "Le profil clinique évoque une **démence sémantique** (variante sémantique de l'APP), avec atteinte massive et progressive du lexique sémantique : déficit de dénomination et de compréhension de mots isolés, dissociation fluence lettre > catégorielle, paraphasies sémantiques distantes. Bilan neurologique avec imagerie indispensable."
- **PEC** : rééducation **conservative** centrée sur la communication adaptative, soutien des connaissances sémantiques résiduelles, mémoire externe (album photo étiqueté), accompagnement de l'aidant familial.
- **Coordination** : neurologie référente, neuropsychologie, médecin traitant.

**PROFIL 5 — Manque du mot dans le cadre d'une maladie d'Alzheimer débutante**
- Atteinte multi-composantes (mémoire effondrée + langage touché).
- Anomie modérée (P5-P15) avec **paraphasies sémantiques proches** et circonlocutions.
- Compréhension de mots isolés préservée mais compréhension de discours / consignes complexes altérée.
- Désorientation temporelle débutante.
- Discours spontané appauvri, anecdotes répétitives.
- Plainte mnésique au premier plan, langage au second.
- MoCA en parallèle : score 18-22 typiquement, mémoire effondrée.
- **Diagnostic** : "Le tableau langagier (manque du mot modéré, paraphasies sémantiques, appauvrissement du discours) s'inscrit dans un contexte de **trouble neuro-cognitif majeur d'allure dégénérative** (suspicion de maladie d'Alzheimer débutante). Les difficultés langagières sont **secondaires au trouble mnésique central**, non isolées."
- **PEC** : rééducation orthophonique en parallèle du suivi neurologique. Stimulation lexicale, travail mémoire externe (étiquetage, carnets, agenda), accompagnement aidant. 1-2 séances/sem dès diagnostic posé.
- **Coordination** : neurologue/gériatre, médecin traitant, neuropsychologie, ergothérapie (domicile), aidant familial.

**PROFIL 6 — Aphasie post-AVC (gauche cortical)**
- Trouble installé brutalement après l'AVC.
- Selon localisation lésionnelle :
  - **Frontal (Broca)** : aphasie non-fluente, discours téléphonique, paraphasies phonologiques, agrammatisme, compréhension préservée.
  - **Temporo-pariétal (Wernicke)** : aphasie fluente avec jargon, paraphasies sémantiques et néologismes, compréhension altérée, anosognosie.
  - **Sous-cortical** : tableau intermédiaire, souvent récupération plus rapide.
- Hémiparésie droite associée fréquente (lésion gauche dominante).
- Possible dysarthrie associée (atteinte cortico-bulbaire).
- **Diagnostic** : "Aphasie post-AVC [non-fluente type Broca / fluente type Wernicke / globale / autre], avec [type des troubles dominants]. [Si récent] Récupération à anticiper dans les 6-12 prochains mois avec PEC orthophonique intensive."
- **PEC** : démarrage **immédiat** post-AVC en milieu hospitalier (UNV/SSR) puis libéral. Intensité maximale dans les 6 premiers mois (fenêtre de plasticité). 2-5 séances/sem selon récupération. Approche restitutive (rééducation phonologique, lexicale, syntaxique) + communicative compensatoire si trouble installé.
- **Coordination** : neurologue référent, MPR, kiné, ergo, psychologue, famille.

**PROFIL 7 — Tableau post-Covid / Brain fog cognitivo-langagier**
- Plainte de "brouillard cérébral" : difficulté de concentration, ralentissement, manque du mot épisodique.
- Antécédent Covid > 3 mois avec persistance.
- Fluences en limite basse à fragile (typiquement P10-P25).
- Manque du mot léger à modéré, **variable selon fatigue**.
- Compréhension préservée.
- Fatigue cognitive importante (test arrêté avant la fin par épuisement).
- **Diagnostic** : "Profil langagier compatible avec les séquelles cognitives décrites dans le Covid long, avec atteinte préférentielle des fluences et de l'accès lexical, dans un contexte d'asthénie chronique. Aucun argument à ce stade pour un trouble neuro-dégénératif sous-jacent."
- **PEC** : stimulation langagière ciblée + gestion fatigue cognitive (pacing, fragmentation des séances). Pronostic souvent favorable en 6-18 mois. Coordination médecin traitant pour suivi global Covid long.

---

#### RÉDACTION DU CRBO

**À inclure systématiquement** :
- **Temps moyen de dénomination** en plus de l'exactitude (différence clé avec d'autres tests).
- **Types de paraphasies observées** (sémantiques, phonologiques, néologismes).
- **Dissociation fluence catégorielle vs lettre** explicitement formulée si présente.
- **Indiçage phonologique** (effet sur la performance) — marqueur pronostic.
- Différenciation explicite **aphasie / anomie isolée / vieillissement normal**.

**Recommandations adaptées au profil** :
- Vieillissement normal → conseils + réévaluation 12 mois.
- Manque du mot sub-clinique → PEC préventive 10-15 séances.
- APP / démence sémantique → PEC conservative + coordination neuro.
- Alzheimer → stimulation + mémoire externe + accompagnement aidant.
- Aphasie post-AVC → intensité maximale 6 premiers mois, restitutive + compensatoire.

**Articulation avec d'autres outils** :
- **En amont** : MoCA pour screening cognitif global.
- **En complément** : GREMOTs, MT-86, batterie du Manque du Mot de Deloche, BEC-96, Montréal-Toulouse si profil aphasiologique.
- **Suivi PEC** : échelle de manque du mot en conditions spontanées (discours libre), réévaluation BETL à 6-12 mois pour mesurer évolution.

**Précautions rédactionnelles** :
- Le CRBO peut être lu par le patient et sa famille — éviter formulations brutes.
- Mentionner les compétences préservées au même titre que les déficits.
- **Pas de diagnostic définitif de pathologie neurodégénérative** depuis la seule BETL — toujours orienter vers neurologie pour confirmation.`,
}
