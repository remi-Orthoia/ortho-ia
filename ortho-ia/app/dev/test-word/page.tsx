'use client'

/**
 * Page de test visuel de l'export Word avec 5 seuils cliniques.
 * Utilise le module partagé lib/word-export pour valider la logique
 * réelle de production.
 */

import { useState } from 'react'
import type { CRBOStructure } from '@/lib/prompts'
import { downloadCRBOWord, SEUILS } from '@/lib/word-export'

const MOCK_STRUCTURE: CRBOStructure = {
  anamnese_redigee:
    "Léa, actuellement scolarisée en CE2, est adressée pour un bilan orthophonique initial à la suite de difficultés persistantes en lecture et en orthographe signalées par l'enseignante. Elle a acquis la marche à 13 mois et ses premiers mots à 22 mois, avec un développement langagier oral considéré dans la norme. Fille aînée d'une fratrie de deux enfants, elle a connu un parcours scolaire régulier sans redoublement jusqu'à cette année. Aucun bilan ORL ni ophtalmologique récent n'est rapporté. Elle manifeste un intérêt marqué pour le dessin et les jeux de construction. Les parents évoquent une fatigabilité importante en fin de journée scolaire et un manque de plaisir apparent lors des activités de lecture.",
  domains: [
    {
      nom: 'Seuils cliniques — échantillon complet',
      commentaire:
        "Échantillon conçu pour couvrir l'ensemble des seuils cliniques : du Normal (P≥25) au Pathologique (P<2). Les couleurs des cellules doivent respecter le dégradé vert → jaune → orange → rouge clair → rouge foncé.",
      epreuves: [
        { nom: 'Épreuve Normal (P75 = Q3)', score: '18/20', et: '+0.67', percentile: 'Q3 (P75)', percentile_value: 75, interpretation: 'Normal' },
        { nom: 'Épreuve Normal (P50 = Med)', score: '16/20', et: '+0.2', percentile: 'Med (P50)', percentile_value: 50, interpretation: 'Normal' },
        { nom: 'Épreuve Normal (P25 = Q1)', score: '14/20', et: '-0.67', percentile: 'Q1 (P25)', percentile_value: 25, interpretation: 'Normal' },
        { nom: 'Épreuve Limite basse (P20)', score: '12/20', et: '-0.84', percentile: 'P20', percentile_value: 20, interpretation: 'Limite basse' },
        { nom: 'Épreuve Fragile (P10)', score: '9/20', et: '-1.28', percentile: 'P10', percentile_value: 10, interpretation: 'Fragile' },
        { nom: 'Épreuve Déficitaire (P5)', score: '7/20', et: '-1.65', percentile: 'P5', percentile_value: 5, interpretation: 'Déficitaire' },
        { nom: 'Épreuve Pathologique (P1)', score: '3/20', et: '-2.4', percentile: 'P1', percentile_value: 1, interpretation: 'Pathologique' },
      ],
    },
    {
      nom: 'Langage écrit — Exalang 8-11',
      commentaire:
        "La lecture de mots est dans la norme, avec une voie d'adressage fonctionnelle. En revanche, la lecture de non-mots est déficitaire, signant une atteinte de la voie d'assemblage et orientant vers une dyslexie de type phonologique. La leximétrie confirme un ralentissement significatif.",
      epreuves: [
        { nom: 'Lecture de mots', score: '28/30', et: '-0.3', percentile: 'Med (P50)', percentile_value: 50, interpretation: 'Normal' },
        { nom: 'Lecture de non-mots', score: '14/30', et: '-1.75', percentile: 'P5', percentile_value: 5, interpretation: 'Déficitaire' },
        { nom: 'Leximétrie', score: '58 mots/min', et: '-1.55', percentile: 'P7', percentile_value: 7, interpretation: 'Fragile' },
        { nom: 'DRA — orthographe', score: '6/20', et: '-1.85', percentile: 'P3', percentile_value: 3, interpretation: 'Déficitaire' },
      ],
    },
  ],
  diagnostic:
    "Léa présente un profil cohérent avec une dyslexie-dysorthographie développementale de type phonologique. Les épreuves de lecture et d'orthographe sont déficitaires, en lien avec une fragilité métaphonologique avérée. La voie d'assemblage est significativement touchée tandis que la voie d'adressage reste fonctionnelle. Le langage oral et la compréhension sont préservés.",
  recommandations:
    "Prise en charge orthophonique hebdomadaire de type rééducation du langage écrit, ciblant en priorité la conscience phonémique et l'automatisation du code grapho-phonémique. Mise en place d'aménagements scolaires : temps majoré aux évaluations, polices de lecture adaptées (OpenDyslexic, Arial), utilisation de supports audio pour la compréhension de textes longs. Bilan ophtalmologique et ORL à prévoir si non réalisés récemment.",
  conclusion:
    "Compte rendu remis en main propre à l'assuré(e) pour servir et faire valoir ce que de droit. (Copie au médecin prescripteur).",
}

const MOCK_FORM_DATA = {
  ortho_nom: 'Dr Marie DURAND',
  ortho_adresse: '12 rue de la République',
  ortho_cp: '69001',
  ortho_ville: 'Lyon',
  ortho_tel: '04 72 00 00 00',
  ortho_email: 'marie.durand@ortho-test.fr',
  patient_prenom: 'Léa',
  patient_nom: 'MARTIN',
  patient_ddn: '2017-03-15',
  patient_classe: 'CE2',
  bilan_date: '2026-04-20',
  bilan_type: 'initial',
  medecin_nom: 'Dr Bernard LEROY',
  medecin_tel: '04 72 11 22 33',
  motif: "Difficultés en lecture et orthographe signalées par l'enseignante de CE2 depuis la rentrée.",
  anamnese: 'marche 13m / premiers mots 22m / CE2 / aime dessin',
  test_utilise: ['Exalang 8-11'] as string[],
  resultats_manuels: '',
  notes_passation: '',
}

export default function TestWordPage() {
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState('')

  const handleDownload = async () => {
    setGenerating(true)
    setError('')
    try {
      await downloadCRBOWord({
        formData: MOCK_FORM_DATA,
        structure: MOCK_STRUCTURE,
      })
    } catch (err: any) {
      setError(err?.message || String(err))
      console.error(err)
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
        <h1 className="text-2xl font-bold text-gray-900">Test export Word — 5 seuils cliniques</h1>
        <p className="mt-2 text-gray-600">
          Utilise le module <code>lib/word-export</code> partagé avec la production.
          Couvre P75, P50, P25, P20, P10, P5, P1 pour valider les couleurs et la colonne Interprétation.
        </p>

        <div className="mt-6 grid grid-cols-5 gap-2 text-xs">
          {SEUILS.map(s => (
            <div key={s.label} className="rounded p-2 text-center border" style={{ backgroundColor: '#' + s.shading }}>
              <p className="font-bold text-gray-900">{s.label}</p>
              <p className="text-gray-700">{s.range}</p>
            </div>
          ))}
        </div>

        <button
          onClick={handleDownload}
          disabled={generating}
          className="mt-8 w-full bg-green-600 text-white py-3 rounded-xl font-semibold hover:bg-green-700 transition disabled:opacity-50"
        >
          {generating ? 'Génération en cours…' : 'Télécharger le Word de test'}
        </button>

        {error && (
          <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            Erreur : {error}
          </div>
        )}

        <div className="mt-8 text-xs text-gray-500 border-t pt-4">
          <p className="font-semibold text-gray-700 mb-1">À vérifier dans le Word :</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Page 1 : graphique barres avec 2 domaines, couleurs cohérentes.</li>
            <li>Section BILAN : légende des 5 seuils en haut, colonne &ldquo;Interprétation&rdquo; présente.</li>
            <li>Q3=P75, Med=P50, Q1=P25 → tous en vert (Normal).</li>
            <li>P20 en jaune (Limite basse), P10 en orange (Fragile), P5 en rouge clair (Déficitaire), P1 en rouge foncé (Pathologique).</li>
            <li>Anamnèse : paragraphe fluide (jamais les notes brutes).</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
