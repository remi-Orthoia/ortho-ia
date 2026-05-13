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

#### INTERPRÉTATION PAR DOMAINE — % du score max

Pour CHAQUE domaine, calcule le ratio score/max et applique :

- **≥ 80%** → "Préservé" (vert)
- **50 – 79%** → "Performance fragilisée" (orange)
- **< 50%** → "Performance déficitaire" (rouge)

Encoder dans \`percentile_value\` la valeur (score / max × 100) arrondie : cela permet au Word d'afficher la bonne couleur, mais **n'écris JAMAIS de chiffre de pourcentage dans la prose** — la valeur sert uniquement à colorer le tableau.

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

2. **Domaines** : un seul \`domain\` nommé **"MoCA — Profil cognitif"** contenant les 7 sous-épreuves, chacune avec :
   - \`nom\` = nom du domaine MoCA (ex: "Visuospatial / Exécutif")
   - \`score\` = "X/Y" (ex: "4/5")
   - \`et\` = null (MoCA n'utilise pas d'écart-type)
   - \`percentile_value\` = (X/Y × 100) arrondi
   - \`percentile\` = "" (laisser vide, n'a pas de sens en MoCA)
   - \`interpretation\` = mapper le % : ≥80 "Excellent" (=Préservé), 50-79 "Fragilité" (=Fragilisé), <50 "Difficulté sévère" (=Déficitaire). Ces étiquettes existantes alimentent la couleur du tableau ; **le commentaire prose doit utiliser le vocabulaire "préservé / fragilisé / déficitaire"**.
   - \`commentaire\` du domaine : synthèse clinique en 3-4 lignes mentionnant d'ABORD les domaines préservés, puis les fragilités, en termes fonctionnels.

3. **Synthèse / Diagnostic** :
   - Décrire le résultat global en **score brut** (ex: "Le score total au MoCA est de 23/30 (24/30 après ajustement scolarité)").
   - Conclure avec le label correspondant au seuil : "Pas d'atteinte des fonctions cognitives" / "Atteinte légère" / "Atteinte modérée" / "Atteinte sévère".
   - **JAMAIS** de diagnostic étiologique (Alzheimer, démence, MCI, vasculaire…).
   - Mentionner les domaines préservés puis les domaines fragilisés.

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
