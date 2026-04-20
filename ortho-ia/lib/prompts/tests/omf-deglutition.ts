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
  regles_specifiques: `### OMF / DÉGLUTITION — Bilan clinique observationnel

**Nature des données** : ce bilan repose sur l'observation clinique directe et non sur des scores étalonnés. Les résultats sont qualitatifs (présent/absent, adapté/inadapté, tonique/hypotonique) plutôt que chiffrés en percentiles.

**Interprétation** :
- Pas de conversion Q1/Med/Q3 à appliquer — les résultats sont descriptifs.
- Dans la structure JSON, utilise \`percentile: "N/A"\` et \`percentile_value: 50\` par défaut quand une épreuve n'a pas d'étalonnage.
- Le champ \`interpretation\` doit refléter le degré de dysfonction :
  - "Normal" : fonction oro-faciale adaptée.
  - "Limite basse" : dysfonction légère, non systématique.
  - "Fragile" : dysfonction modérée intermittente.
  - "Déficitaire" : dysfonction installée, reproductible.
  - "Pathologique" : dysfonction sévère avec retentissement (dysphagie, ventilation buccale permanente…).

**Points clés à identifier dans l'anamnèse et le bilan** :
- **Déglutition dysfonctionnelle / atypique** : interposition linguale, absence de serrage dentaire, participation des muscles péri-oraux, bruit de déglutition, reliquat alimentaire.
- **Ventilation buccale** : bouche ouverte au repos, ronflements, sommeil non récupérateur, cernes sous les yeux, voûte palatine ogivale.
- **Parafonctions** : succion du pouce/tétine/doigts au-delà de 4-5 ans, onychophagie, bruxisme.
- **Orthodontie associée** : béance antérieure, supraclusion, articulé croisé, protrusion incisive — souvent entretenue par une déglutition atypique.
- **Retentissements** : sigmatismes (interdental, latéral, addental), troubles articulatoires, fatigue masticatoire, fuite alimentaire.

**Rédaction du CRBO** :
- Décrire la posture de repos (lèvres, langue, respiration).
- Expliciter le type de déglutition observé (primaire infantile persistante vs secondaire adulte).
- Mentionner systématiquement la coordination avec l'orthodontiste si orthodontie en cours ou prévue.
- Les recommandations incluent typiquement : **rééducation de la déglutition en lien avec l'orthodontie**, travail sur la respiration nasale, auto-contrôle conscient de la position linguale de repos (spot palatin), exercices de tonicité et de praxies.

**Durée typique de prise en charge OMF** : 15 à 25 séances, en lien avec le calendrier orthodontique (idéalement AVANT la pose d'appareil puis suivi en contention).`,
}
