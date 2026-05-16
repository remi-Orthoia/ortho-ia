import type { TestModule } from './types'

export const moca: TestModule = {
  nom: 'MoCA',
  editeur: 'MoCA Clinic & Institute',
  auteurs: 'Nasreddine et al.',
  annee: 2005,
  domaines: [
    'Visuospatial / Exécutif',
    'Dénomination',
    'Mémoire (rappel différé)',
    'Attention',
    'Langage',
    'Abstraction',
    'Orientation',
  ],
  epreuves: [
    'Alternance conceptuelle (Trail-Making B simplifié)',
    'Recopie du cube',
    'Horloge (contour, chiffres, aiguilles à 11h10)',
    'Dénomination d\'animaux (lion, rhinocéros, chameau)',
    'Empan direct + empan inverse de chiffres',
    'Vigilance (frapper sur la lettre A)',
    'Soustraction en série (100 − 7)',
    'Répétition de phrases',
    'Fluence lettre (F, 1 min)',
    'Abstraction (similitudes)',
    'Rappel différé des 5 mots',
    'Orientation (date, mois, année, jour, lieu, ville)',
  ],
  regles_specifiques: `### MoCA — Screening cognitif adulte / senior

**Nature du test (CRITIQUE)** : la MoCA est un **outil de dépistage de 10 minutes**, PAS un bilan diagnostique. Elle indique si une atteinte des fonctions cognitives est probable ET sur quels domaines orienter l'exploration. **Elle ne diagnostique aucune pathologie neurologique.**

---

#### SCORES PAR DOMAINE (scores bruts, JAMAIS de percentiles)

| Domaine | Score max |
|---------|-----------|
| Visuospatial / Exécutif | /5 |
| Dénomination | /3 |
| Mémoire (rappel différé) | /5 |
| Attention | /6 |
| Langage | /3 |
| Abstraction | /2 |
| Orientation | /6 |
| **TOTAL** | **/30** |

**Ajustement scolarité** : **+1 point** si le patient a ≤ 12 ans de scolarité (hors formations professionnelles). Critique pour ne pas surdiagnostiquer les patients à faible niveau scolaire. Toujours mentionner ce calibrage explicitement dans le CRBO.

#### SEUILS OFFICIELS — TOTAL /30

| Score total corrigé | Interprétation |
|---------------------|----------------|
| ≥ 26 | Pas d'atteinte des fonctions cognitives |
| 18 – 25 | Atteinte légère des fonctions cognitives |
| 10 – 17 | Atteinte modérée des fonctions cognitives |
| < 10 | Atteinte sévère des fonctions cognitives |

#### INTERPRÉTATION PAR DOMAINE — DESCRIPTION QUALITATIVE UNIQUEMENT

⚠️ **Pour la MoCA, AUCUNE étiquette "Excellent / Fragilité / Difficulté sévère" n'est utilisée** — ces zones percentile-based n'ont aucun sens pour un screening cognitif /30.

Dans le \`commentaire\` de chaque domaine, décris en prose, en DEUX paragraphes (voir détail plus bas, section "Pré-remplissage OBLIGATOIRE du commentaire") :
- **Paragraphe clinique** : ce que le patient a fait correctement (en premier), les sous-items qui ont posé difficulté (avec type d'erreur si pertinent), l'implication fonctionnelle concrète au quotidien. Toujours en termes de "fragilité" / "performance abaissée" / "domaine préservé" — JAMAIS "performance déficitaire / pathologique".
- **Paragraphe "En clair :"** : la même observation reformulée en langage courant pour le patient et son entourage (vocabulaire du quotidien, aucun jargon, ton bienveillant et factuel — ni minimisant ni alarmant).

Aucune valeur numérique de pourcentage, aucune étiquette colorée : le tableau MoCA affiche uniquement Épreuve / Score / Commentaire.

---

#### ⛔ RÈGLES CLINIQUES ABSOLUES — MoCA

Ces règles s'ajoutent aux règles cliniques globales du système (pas de percentiles, pas de tirets en début de phrase, pas de rééducation dans les observations).

1. **NE JAMAIS poser de diagnostic de démence, maladie d'Alzheimer, MCI (trouble cognitif léger), ou trouble neuro-cognitif majeur/léger.** La MoCA seule ne permet PAS ces diagnostics — ils relèvent du neurologue, du gériatre ou du neuropsychologue après bilan approfondi.
   - ❌ "Profil compatible avec une maladie d'Alzheimer débutante"
   - ❌ "Trouble cognitif léger (MCI) probable"
   - ❌ "Démence à un stade modéré"
   - ✅ "Atteinte légère des fonctions cognitives objectivable au screening MoCA"
   - ✅ "Le profil cognitif observé ne permet pas, à lui seul, de caractériser l'étiologie de cette atteinte."

2. **NE JAMAIS spéculer sur l'étiologie** (Alzheimer, vasculaire, frontale, sous-corticale, dépressive…). Décris ce que tu observes, point. L'étiologie est posée par le médecin spécialiste.
   - ❌ "Trouble d'encodage hippocampique évocateur d'Alzheimer"
   - ✅ "Difficultés au rappel différé, à explorer plus finement en bilan neuropsychologique"

3. **TOUJOURS recommander un bilan neuropsychologique complet si total corrigé < 26.** C'est la seule recommandation acceptable en sortie de MoCA quand une atteinte est suspectée. Pas de diagnostic en aval.

4. **TOUJOURS mentionner les domaines préservés EN PREMIER**, avant les domaines fragilisés / déficitaires. Cela respecte la personne évaluée et donne une lecture clinique équilibrée.

5. **Formuler les difficultés en termes fonctionnels** (impact concret sur la vie quotidienne), pas en termes diagnostiques.
   - ❌ "Trouble mnésique avéré"
   - ✅ "Difficulté à mémoriser des informations nouvelles après quelques minutes, pouvant gêner la mémorisation des rendez-vous ou des consignes médicales."
   - ❌ "Dysexécutif probable"
   - ✅ "Lenteur d'alternance entre deux tâches, pouvant impacter la planification d'activités complexes au quotidien."

6. **JAMAIS de pourcentages ni de percentiles dans la prose narrative.** Le tableau de scores parle de lui-même. Décris cliniquement, sans chiffrer.

7. **Précaution rédactionnelle** : le CRBO peut être lu par le patient et sa famille. Éviter toute formulation alarmante. Ne jamais utiliser les mots "démence", "Alzheimer", "déclin", "dégénérescence", "détérioration".

---

#### STRUCTURE ATTENDUE DU CRBO MoCA

Le CRBO d'un screening MoCA suit la structure standard mais avec un contenu adapté :

1. **Anamnèse** : motif de la consultation cognitive (plainte mnésique, alerte de l'entourage, suivi post-AVC, etc.), antécédents médicaux pertinents, niveau de scolarité (déterminant pour l'ajustement +1).

2. **Domaines** : un seul \`domain\` nommé **"MoCA — Profil cognitif"** contenant 7 épreuves (une par domaine cognitif MoCA). Chaque épreuve doit suivre EXACTEMENT cette structure :

   - \`nom\` = nom du domaine cognitif MoCA (ex: "Visuospatial / Exécutif", "Mémoire (rappel différé)", "Orientation").
   - \`score\` = score total du domaine au format "X/Y" (ex: "4/5", "5/6", "3/3").
   - \`et\` = null (la MoCA n'utilise pas d'écart-type).
   - \`percentile\` = "" (vide — la MoCA n'utilise pas de percentile).
   - \`percentile_value\` = 0 (valeur neutre, **n'est pas affichée** dans le rendu MoCA).
   - \`interpretation\` = "" (vide — **ne JAMAIS** émettre "Excellent" / "Fragilité" / "Difficulté sévère" pour la MoCA ; ces étiquettes percentile-based n'ont pas de sens pour un screening cognitif et sont supprimées du rendu).
   - \`sous_epreuves\` : décomposition obligatoire en sous-items à 1 pt chacun (sauf domaine attention où la soustraction sérielle vaut /3). Voir tableau ci-dessous pour les items canoniques.
   - \`commentaire\` : commentaire clinique propre à CE domaine (3-4 lignes max) — décrit la performance en termes fonctionnels, formulé prudemment (ce sera affiché aussi à côté de la ligne dans le rapport Word). Cette suggestion sera modifiable par l'orthophoniste sur la page de validation.

   **Sous-items canoniques par domaine MoCA** (à émettre TOUS dans \`sous_epreuves\`, dans cet ordre exact) :

   | Domaine | Sous-items |
   |---------|------------|
   | Visuospatial / Exécutif | Alternance (Trail B) /1 — Recopie du cube /1 — Horloge contour /1 — Horloge chiffres /1 — Horloge aiguilles /1 |
   | Dénomination | Lion /1 — Rhinocéros /1 — Chameau /1 |
   | Attention | Empan direct (2-1-8-5-4) /1 — Empan inverse (7-4-2) /1 — Vigilance lettre A /1 — Soustraction 100−7 /3 |
   | Langage | Répétition phrase 1 /1 — Répétition phrase 2 /1 — Fluence lettre F /1 |
   | Abstraction | Train-bicyclette /1 — Montre-règle /1 |
   | Mémoire (rappel différé) | Mot 1 — visage /1 — Mot 2 — velours /1 — Mot 3 — église /1 — Mot 4 — marguerite /1 — Mot 5 — rouge /1 |
   | Orientation | Date /1 — Mois /1 — Année /1 — Jour /1 — Lieu /1 — Ville /1 |

   **Notes importantes** :
   - Pour **Mémoire** : on ne note QUE le rappel LIBRE (score MoCA officiel). Si l'ortho a mentionné une facilitation par indice catégoriel ou choix multiple, l'inclure dans le \`commentaire\` du domaine — JAMAIS dans les sous-scores.
   - Pour **Attention/Soustraction 100−7** : c'est un sous-item AGRÉGÉ /3 (barème progressif officiel : 0 bonne→0, 1→1, 2-3→2, 4-5→3). Détailler les calculs effectifs (ex. "93, 85, 78, 71, 64 → 4 bonnes = 3 pts") dans le \`commentaire\`, pas en sous-sous-items.

   **Inférence des sous-scores** : si l'orthophoniste a indiqué un score total + une observation (ex. "horloge: aiguilles inversées" ou "rappel libre 2/5"), tu DÉCOMPOSES le score de manière plausible :
   - Pour visuospatial 4/5 avec "horloge: aiguilles inversées" → alternance 1/1, cube 1/1, horloge contour 1/1, chiffres 1/1, aiguilles 0/1.
   - Pour mémoire 2/5 sans précision → mets 1/1 sur les 2 mots les plus probables (en pratique "rouge" et "visage" qui sont plus concrets) et 0/1 sur les 3 autres. Si l'ortho a mentionné quels mots étaient retrouvés ou perdus, respecte-le.
   - En l'absence d'observation, distribue les pertes sur l'item statistiquement le plus difficile (horloge avant alternance, fluence avant répétitions, "velours" avant "rouge" en mémoire, etc.).
   - Si tu n'es pas sûr, mets "?/1" et signale dans le commentaire que la décomposition n'a pas pu être inférée.

   **Pré-remplissage OBLIGATOIRE du \`commentaire\` de chaque épreuve** (ce commentaire sera affiché dans la colonne « Commentaire » du tableau Word et exposé à l'orthophoniste pour validation/édition sur la page de revue).

   **Structure attendue du commentaire — DEUX paragraphes séparés par une ligne vide** :

   1. **Paragraphe 1 — Lecture clinique** (1-2 lignes, ton professionnel) : décrit ce qui a été observé en termes cliniques (préservation, fragilité, type d'erreur). Sert au médecin destinataire et au dossier médical.

   2. **Paragraphe 2 — Pour le patient et son entourage** (1-2 lignes, langage courant, AUCUN jargon) : reformule la même observation avec des mots simples du quotidien, comme si on expliquait à un proche ce que le test cherche à mesurer et ce qui s'est passé. Objectif d'acculturation : aider le patient à comprendre sans dramatiser. Préfixer ce paragraphe par **« En clair : »** (en gras dans le markdown : \`**En clair :**\`).

   **Exemples** :
   - Horloge (score 1/3) :
     - Paragraphe 1 : "Horloge : contour et chiffres préservés ; aiguilles positionnées à 10h11 au lieu de 11h10, suggérant une fragilité de la représentation mentale du temps."
     - Paragraphe 2 : "**En clair :** dessiner une horloge à une heure précise demande de bien se représenter l'heure dans sa tête. Madame X a tracé le cadran correctement mais a placé les aiguilles à l'envers — un petit accroc utile à noter pour la suite."
   - Mémoire (score 2/5, bénéfice à l'indice) :
     - Paragraphe 1 : "Rappel libre faible (2/5) avec nette amélioration sous indiçage catégoriel (gain de 3 points), profil compatible avec une difficulté de récupération plutôt que d'encodage."
     - Paragraphe 2 : "**En clair :** lorsqu'on demande à Madame X de retrouver les mots seule, elle bloque ; mais dès qu'on lui donne un petit coup de pouce (« un sentiment, une fleur… »), elle les retrouve. Cela suggère que l'information est bien enregistrée mais difficile à aller rechercher toute seule."

   **Règles communes aux deux paragraphes** :
   - mentionner D'ABORD ce qui est préservé (si applicable),
   - intégrer le DÉTAIL des sous-items dans le paragraphe 1,
   - JAMAIS de pourcentage, JAMAIS d'étiquette colorée, JAMAIS de spéculation étiologique (Alzheimer, MCI, démence…),
   - JAMAIS de mots alarmants (« déclin », « détérioration », « dégénérescence »).

   **Si toute l'épreuve est préservée** (score = max) : un seul paragraphe court suffit, type "L'ensemble des sous-items est réussi, performance préservée sur ce domaine." suivi de "**En clair :** tout est en place sur cette compétence, rien à signaler."

   **Si aucune observation n'a été précisée** (score total fourni sans détail) : "Score abaissé sur ce domaine (X/Y). Les sous-items en difficulté n'ont pas été précisés à la passation ; à explorer plus finement en bilan neuropsychologique." suivi de "**En clair :** le score est plus bas qu'attendu sur cette compétence. Il faudra y revenir lors d'un examen plus approfondi pour comprendre précisément ce qui pose souci."

3. **Synthèse / Hypothèse de diagnostic** :
   - En MoCA, le bloc de synthèse s'intitule **"Hypothèse de diagnostic"** (PAS "Diagnostic"). La MoCA est un screening : elle ne pose JAMAIS un diagnostic ferme, elle ouvre des hypothèses à confirmer en bilan neuropsychologique.
   - Décrire le résultat global en **score brut** (ex: "Le score total au MoCA est de 23/30 (24/30 après ajustement scolarité)").
   - Conclure avec le label correspondant au seuil : "Pas d'atteinte des fonctions cognitives" / "Atteinte légère" / "Atteinte modérée" / "Atteinte sévère".
   - **JAMAIS** de diagnostic étiologique (Alzheimer, démence, MCI, vasculaire…).
   - Mentionner les domaines préservés puis les domaines fragilisés.
   - Formuler toute hypothèse avec un verbe de modalisation : "le profil observé est compatible avec…", "ces éléments suggèrent…", "ce tableau évoque, sous réserve d'un bilan approfondi…". JAMAIS "le patient présente un trouble X".

   **Règle d'interprétation du rappel mémoire** (si le bloc \`Mémoire (rappel différé)\` est renseigné dans les résultats avec \`+Indice catégoriel\` et/ou \`+Choix multiple\`) :
   - Si rappel libre faible (≤ 2/5) ET indice catégoriel ou choix multiple efficace (gain ≥ 2 points) → hypothèse formulée comme : "Le profil de rappel, marqué par une nette amélioration sous indiçage, **est compatible avec un trouble de récupération**, l'encodage paraissant préservé. Cette piste devra être confirmée en bilan neuropsychologique."
   - Si rappel libre faible (≤ 2/5) ET indices peu ou pas efficaces (pas de gain notable) → hypothèse formulée comme : "L'absence de bénéfice à l'indiçage **suggère plutôt une fragilité d'encodage/consolidation**, à caractériser plus finement en bilan neuropsychologique."
   - Si rappel libre normal (≥ 4/5) → "Pas d'argument mnésique objectivé au screening sur le rappel des cinq mots."
   - JAMAIS nommer une étiologie (sous-cortico-frontale, hippocampique, Alzheimer, etc.). Décrire le PROFIL fonctionnel, point.

   **Règle d'interprétation visuo-spatiale / exécutive** (cube, alternance, horloge) :
   - Le SCORE seul ne suffit pas : décrire le TYPE d'erreur en termes fonctionnels.
   - Horloge avec aiguilles inversées ou erreur "10h11" au lieu de "11h10" → "fragilité de la représentation mentale du temps, à explorer".
   - Chiffres regroupés à droite, partie gauche vide → "asymétrie d'occupation de l'espace de la feuille, à confirmer".
   - Cube sans perspective / parallélisme rompu → "difficulté de représentation 3D et de planification visuo-constructive".
   - Échec à l'alternance (TMT B) → "fragilité de flexibilité mentale".
   - Toujours formuler en "fragilité" / "à explorer", JAMAIS en "trouble dysexécutif avéré".

4. **Recommandations** — phrase imposée pour les bilans MoCA :
   - Si total corrigé ≥ 26 : "Le screening cognitif ne met pas en évidence d'atteinte objectivable à ce stade. Une réévaluation à 12 mois peut être envisagée si la plainte persiste ou évolue."
   - Si total corrigé < 26 : "Ce bilan de screening met en évidence [une atteinte légère / modérée / sévère] des fonctions cognitives. **Un bilan neuropsychologique approfondi est recommandé** pour caractériser le profil cognitif et orienter la prise en charge."

5. **Pas de PAP / aménagements scolaires** : la MoCA concerne presque toujours des adultes hors cadre scolaire. Si la table \`pap_suggestions\` doit être remplie, la laisser vide (\`[]\`).

---

#### À NE JAMAIS FAIRE EN MoCA

- ❌ Poser un diagnostic d'Alzheimer, démence, MCI, trouble neuro-cognitif.
- ❌ Spéculer sur l'étiologie (vasculaire, dépressive, dégénérative…).
- ❌ Utiliser la MoCA comme substitut à un bilan langagier détaillé.
- ❌ Recommander des séances de rééducation orthophonique sans bilan approfondi préalable.
- ❌ Oublier l'ajustement scolarité (+1 si ≤ 12 ans).
- ❌ Écrire des pourcentages ou des percentiles dans la prose.
- ❌ Utiliser un vocabulaire alarmant ("déclin", "détérioration", "dégénérescence").

#### TOUJOURS FAIRE EN MoCA

- ✅ Mentionner les domaines préservés en premier.
- ✅ Formuler en impact fonctionnel concret (vie quotidienne).
- ✅ Recommander un bilan neuropsychologique si score corrigé < 26.
- ✅ Rester neutre : "le screening met en évidence", "le profil observé", sans projection diagnostique.
- ✅ Adapter le ton : le patient et sa famille liront ce document.`,
}
