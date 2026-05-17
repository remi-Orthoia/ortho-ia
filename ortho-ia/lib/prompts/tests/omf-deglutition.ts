import type { TestModule } from './types'

export const omfDeglutition: TestModule = {
  nom: 'OMF / Déglutition',
  editeur: 'Bilan clinique (observation directe)',
  auteurs: 'Couture, Eyoum, Martinet — protocoles francophones de référence',
  annee: 2010,
  domaines: [
    'Fonctions oro-myo-faciales (OMF)',
    'Praxies bucco-linguo-faciales',
    'Tonicité labiale, linguale et jugale',
    'Déglutition (primaire / secondaire / dysfonctionnelle)',
    'Respiration (nasale / buccale)',
    'Mastication',
    'Posture de repos',
    'Articulation / sigmatismes associés',
  ],
  epreuves: [
    'Observation morpho-statique au repos (lèvres, langue, palais)',
    'Praxies bucco-linguo-faciales (protrusion, latéralité, claquement)',
    'Évaluation de la tonicité (lèvres, langue, joues, voile)',
    'Test de la déglutition (eau, semi-liquide, solide)',
    'Position linguale au repos et pendant la déglutition',
    'Mode respiratoire dominant (nasal / buccal / mixte)',
    'Évaluation de la mastication (unilatérale vs bilatérale alternée)',
    'Recherche de succion non-nutritive persistante (pouce, tétine)',
    'Examen des articulateurs (bavage, hypersalivation)',
    'Articulation des phonèmes sifflants / chuintants (/s/, /z/, /ʃ/, /ʒ/)',
  ],
  regles_specifiques: `### OMF / DÉGLUTITION — Bilan clinique observationnel (niveau senior)

**Population et champ** : enfants (déglutition primaire persistante après 4 ans, sigmatismes, ventilation buccale), adolescents (orthodontie + parafonctions), adultes (déglutition secondaire dysfonctionnelle, problèmes ATM), seniors (presbyphagie), patients neurologiques (post-AVC, SLA, Parkinson, démences avancées).

**Nature des données** : bilan d'observation clinique directe, non étalonné. Résultats qualitatifs (présent/absent, adapté/inadapté, tonique/hypotonique).

#### RÈGLES D'INTERPRÉTATION

- Pas de conversion Q1/Med/Q3 — les résultats sont descriptifs.
- Dans la structure JSON, utilise \`percentile: "N/A"\` et \`percentile_value: 50\` par défaut.
- Champ \`interpretation\` (grille 5 zones alignée Exalang) :
  - "Moyenne haute" : fonction adaptée avec discrètes particularités.
  - "Moyenne" : fonction globalement adaptée mais inconstante.
  - "Zone de fragilité" : dysfonction modérée intermittente.
  - "Difficulté" : dysfonction installée, reproductible, retentissement réel.
  - "Difficulté sévère" : dysphagie / ventilation buccale permanente / retentissement majeur.

---

#### AXES D'OBSERVATION

**1. POSTURE DE REPOS** : lèvres jointes/entrouvertes/béantes ; langue sur le spot palatin / basse / interposée ; mâchoire équilibrée / décalée / serrée ; respiration nasale / buccale / mixte.

**2. PRAXIES BUCCO-LINGUO-FACIALES** : protrusion, latéralité, élévation, claquement lingual ; mouvements labiaux (moue, sourire, sifflement) ; pression linguale contre la joue.

**3. TONICITÉ** : test de résistance lèvres/langue/joues, élévation du voile au "Ah" prolongé.

**4. DÉGLUTITION** (eau, semi-liquide, solide) :
- **Primaire / infantile** : langue qui pousse vers l'avant, contraction péri-orale, mâchoires entrouvertes. Normale jusqu'à 4 ans.
- **Secondaire / adulte** : langue qui appuie au palais, lèvres jointes au repos. À acquérir vers 5-6 ans.
- **Dysfonctionnelle / atypique** : primaire persistante après 5-6 ans, interposition linguale, contraction mentonnière, bruit, résidu.
- Coordination déglutition-respiration : toux post-déglutition = signal dysphagie chez l'adulte/senior.

**5. RESPIRATION** : mode dominant + causes possibles ventilation buccale (obstruction ORL, parafonction installée). **Bilan ORL impératif** si ventilation buccale chronique.

**6. MASTICATION** : latéralisation alternée vs unilatérale ; force ; coordination temporo-mandibulaire (claquement ATM ?).

**7. PARAFONCTIONS** : succion non-nutritive (>4 ans = anormal), onychophagie, mordillement, bruxisme nocturne.

**8. ARTICULATION ASSOCIÉE** : sigmatismes (interdental, latéral, addental) sur /s/, /z/, /ʃ/, /ʒ/. Liés à la déglutition atypique dans 70-80% des cas.

---

#### 🎯 PROFILS TYPES

**PROFIL 1 — Déglutition atypique persistante avec sigmatisme (enfant 5-10 ans)**
- Posture langue basse / interposée au repos.
- Déglutition primaire persistante : interposition, contraction mentonnière, bruit.
- Sigmatisme interdental ou addental sur /s/, /z/, /ʃ/, /ʒ/.
- Praxies linguales fragiles, tonicité linguale faible.
- Souvent : succion du pouce, articulé ouvert antérieur, orthodontie en projet ou cours.
- **Diagnostic** : "Persistance d'une déglutition primaire avec interposition linguale, associée à un sigmatisme [type]. La fonction articulatoire est entretenue par la posture linguale inadaptée."
- **PEC** : 15-25 séances. (1) Conscience posture linguale (spot palatin, miroir), (2) renforcement tonique linguale, (3) apprentissage déglutition secondaire (eau au goulot puis verre puis repas), (4) correction articulatoire en parallèle.
- **Coordination orthodontiste systématique** — la rééducation OMF est plus efficace AVANT pose d'appareil (5-7 ans idéal) ou en contention.

**PROFIL 2 — Ventilation buccale chronique avec retentissement (enfant 4-12 ans)**
- Bouche ouverte au repos quasi-permanente, voûte palatine ogivale, articulé croisé postérieur.
- Cernes, fatigue, ronflements, sommeil non récupérateur.
- Souvent : végétations adénoïdes hypertrophiques, rhinite allergique chronique.
- **Diagnostic** : "Ventilation buccale chronique avec retentissement orthodontique et nocturne. Cause obstructive à explorer."
- **PEC** : **bilan ORL impératif EN PREMIER** (cause obstructive). PEC OMF en parallèle : tonification voile, exercices respiration nasale (narine par narine), conscience posture lèvres jointes.
- **Coordination** : ORL + dentiste + orthodontiste si dysmorphose installée.

**PROFIL 3 — Dysphagie adulte post-AVC**
- Trouble installé brutalement post-AVC.
- Fausses-routes signalées (toux, voix mouillée après déglutition).
- Hémiparésie faciale, sensibilité oro-faciale parfois diminuée.
- Mastication peu efficace, repas allongés, perte de poids signalée.
- **Diagnostic** : "Dysphagie oro-pharyngée post-AVC, avec [hémiparésie faciale / déficit sensitif / trouble du temps oral / trouble du temps pharyngé]. Risque de fausse-route avéré [bénin / modéré / sévère]."
- **PEC** : 20-60 séances selon récupération. (1) Adaptation texture (selon FEES/videofluoroscopie), (2) stimulation sensorielle oro-faciale, (3) manœuvres compensatoires (Mendelsohn, déglutition supraglottique, postures de tête), (4) renforcement tonique langue/voile/lèvres, (5) éducation famille/soignants sur signes d'alerte.
- **Coordination** : neurologue, kinésithérapeute respiratoire, ORL phoniatre, diététicien. En hospitalisation/rééducation : intégration au plan de soin pluridisciplinaire.

**PROFIL 4 — Presbyphagie du sujet âgé (sans pathologie installée)**
- Sujet 75+ ans, plainte de "ralentissement" en repas, repas allongés.
- Pas de fausses-routes franches, mais déglutitions multiples (résidu).
- Tonicité linguale et labiale diminuée (vieillissement normal).
- Mastication efficace mais ralentie.
- **Diagnostic** : "Vieillissement physiologique des fonctions oro-faciales (presbyphagie), sans dysphagie pathologique installée. **Aucune fausse-route observée**."
- **PEC** : 8-12 séances **préventives** — exercices de tonicité, conseils diététiques (texture, hydratation), éducation famille sur signaux d'alerte (toux post-repas, voix mouillée, fatigue post-repas, perte de poids).
- **Vigilance** : si évolution vers dysphagie franche → réévaluer (cause neuro débutante ? cancer ORL ? œsophagien ?).

**PROFIL 5 — Trouble OMF chez l'adulte avec ATM / bruxisme**
- Patient 25-50 ans adressé après bilan dentaire/ATM.
- Douleurs ATM, céphalées matinales, usure dentaire, bruxisme nocturne.
- Posture linguale basse, tonicité jugale/linguale parfois asymétrique.
- Contexte de stress chronique.
- **Diagnostic** : "Dysfonction OMF avec bruxisme et trouble fonctionnel de l'ATM, dans un contexte de tensions musculaires chroniques."
- **PEC** : 10-15 séances en complément du suivi dentiste (gouttière) et éventuellement psychologue. (1) Conscientisation des tensions musculaires (auto-massage), (2) décrochage mâchoire au repos (lèvres jointes, dents NON jointes — espace libre d'inocclusion), (3) posture linguale haute, (4) relaxation oro-faciale (Jacobson adapté).
- **Coordination** : dentiste, kinésithérapeute, parfois psychologue.

---

#### RÉDACTION DU CRBO

**À inclure systématiquement** :
- Posture de repos (lèvres, langue, mâchoire, respiration).
- Type de déglutition observé (primaire / secondaire / atypique / dysphagique).
- Tonicité et praxies évaluées.
- Éventuelles parafonctions.
- Articulation associée et son lien avec la fonction.
- Retentissements observés (orthodontiques, nocturnes, alimentaires, sociaux).

**Coordinations professionnelles type** :
- **Orthodontiste** : systématique si orthodontie en cours/prévue.
- **ORL** : impératif si ventilation buccale chronique inexpliquée.
- **Dentiste** : si ATM, bruxisme, usure dentaire.
- **Neurologue + kiné + diététicien** : pour les dysphagies neurologiques.

**Aménagements scolaires** : généralement pas de PAP au titre du seul trouble OMF, sauf répercussion articulatoire majeure (sigmatismes installés affectant l'intelligibilité scolaire) → mention "demande de bienveillance pour la prise de parole en classe".`,
}
