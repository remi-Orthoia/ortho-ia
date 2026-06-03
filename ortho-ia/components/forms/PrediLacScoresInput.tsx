'use client'

/**
 * Saisie structurée PrediLac (Duchêne & Jaillard, HappyNeuron).
 *
 * Protocole d'évaluation et de dépistage des insuffisances de la LACture
 * chez l'adulte. Méthodologie alignée sur PREDIMEM / PrediFex (stratification
 * âge × NSC, seuil M − 1,5 σ, 5 zones couleur HappyNeuron).
 *
 * ⚠️ Le manuel PrediLac est scanné (image-based) — les épreuves listées
 * ci-dessous suivent le **framework commun** de la gamme PREDI. Elles sont
 * à valider/affiner par l'ortho selon le manuel papier officiel.
 *
 * Couplage : nouveau-crbo/page.tsx, test_utilise === ['PrediLac'].
 */

import { useEffect, useMemo, useState } from 'react'
import { Brain, ChevronDown, AlertCircle, Info } from 'lucide-react'
// ChevronDown utilisé dans les accordéons règles + interprétation par épreuve.
import MicButton from '../MicButton'

interface Props {
  notes: string
  onNotesChange: (v: string) => void
  onResultatsChange: (normalized: string) => void
  onError?: (msg: string) => void
}

type ZoneKey = '' | 'vert_fonce' | 'vert_clair' | 'jaune' | 'orange' | 'rouge'

const ZONES: Array<{ key: Exclude<ZoneKey, ''>; label: string; sigma: string; chipBg: string; chipText: string; chipRing: string }> = [
  { key: 'vert_fonce', label: 'Vert foncé', sigma: '≥ moyenne', chipBg: 'bg-emerald-600', chipText: 'text-white',     chipRing: 'ring-emerald-700' },
  { key: 'vert_clair', label: 'Vert clair', sigma: 'M−1σ à M−1,5σ', chipBg: 'bg-emerald-300', chipText: 'text-emerald-900', chipRing: 'ring-emerald-500' },
  { key: 'jaune',      label: 'Jaune',      sigma: 'M−1,5σ à M−2σ (alerte)', chipBg: 'bg-amber-300', chipText: 'text-amber-900', chipRing: 'ring-amber-500' },
  { key: 'orange',     label: 'Orange',     sigma: 'M−2σ à M−3σ',  chipBg: 'bg-orange-500', chipText: 'text-white',     chipRing: 'ring-orange-600' },
  { key: 'rouge',      label: 'Rouge',      sigma: '< M−3σ (effondrement)', chipBg: 'bg-red-600', chipText: 'text-white',     chipRing: 'ring-red-700' },
]

const ZONE_LABEL_CLINIQUE: Record<Exclude<ZoneKey, ''>, string> = {
  vert_fonce:  'performance préservée',
  vert_clair:  'performance dans la moyenne basse, à surveiller',
  jaune:       'fragilité objectivée (seuil d\'alerte)',
  orange:      'difficulté avérée',
  rouge:       'effondrement',
}

interface Epreuve {
  key: string
  label: string
  description: string
  cible: string
  /** Rappels cliniques sur la cotation — accordéon indigo. Formulations
   *  cliniquement défendables (modèle à deux voies de Coltheart) ; le manuel
   *  PrediLac étant scanné (sans OCR), les règles précises ne peuvent pas être
   *  garanties textuelles du manuel. */
  rules: string[]
  /** Aide à l'interprétation clinique — accordéon ambre. */
  interpretation: string[]
  /** Placeholder pour l'observation. */
  obsPlaceholder: string
}

/** Épreuves génériques de la gamme PREDI orientée lecture.
 *  ⚠️ Liste à ajuster selon le manuel papier officiel PrediLac dès que l'OCR
 *  sera disponible. Les hints/règles/interprétations ci-dessous sont des
 *  bonnes pratiques cliniques sur les dyslexies acquises (modèle de Coltheart),
 *  pas des citations directes du manuel. */
const EPREUVES: Epreuve[] = [
  {
    key: 'decodage_pseudomots',
    label: 'Décodage de pseudomots',
    description: 'Voie d\'assemblage (phonologique) pure — atteinte = dyslexie phonologique acquise.',
    cible: 'Voie d\'assemblage',
    rules: [
      'Lecture de pseudomots (suite de lettres prononçables sans signification).',
      'Mesure la voie d\'assemblage (conversion grapho-phonémique).',
      'Erreurs typiques à noter : lexicalisations ("pulot" → "polo"), substitutions phonémiques, hésitations, redémarrages.',
      'Chronométrage utile (vitesse de décodage).',
    ],
    interpretation: [
      'Décodage abaissé + lecture mots irréguliers préservée → DYSLEXIE PHONOLOGIQUE ACQUISE (atteinte de la voie d\'assemblage).',
      'Décodage abaissé + lecture mots irréguliers altérée → dyslexie mixte / alexie globale (à confirmer).',
      'Lexicalisations fréquentes → tentative de compensation par voie lexicale, marqueur fonctionnel.',
      'À croiser avec : vitesse de lecture, décision lexicale, lecture mots rares.',
    ],
    obsPlaceholder: 'Ex. 14/30 pseudomots. Lexicalise 4 fois ("brouton" → "bouton"). Vitesse très ralentie sur les pseudomots de 3 syllabes. Précision préservée sur 2 syllabes.',
  },
  {
    key: 'lecture_mots_irreg',
    label: 'Lecture de mots irréguliers',
    description: 'Voie d\'adressage (lexique orthographique) — atteinte = dyslexie de surface acquise.',
    cible: 'Voie d\'adressage',
    rules: [
      'Lecture de mots dont la prononciation s\'écarte de la conversion grapho-phonémique régulière (femme, monsieur, second, sept, oignon, paysan, etc.).',
      'Mesure la voie d\'adressage (lexique orthographique d\'entrée).',
      'Erreurs typiques : régularisations ("femme" → /fɛm/ au lieu de /fam/), hésitations sur les graphies opaques.',
    ],
    interpretation: [
      'Lecture mots irréguliers abaissée + décodage préservé → DYSLEXIE DE SURFACE ACQUISE (atteinte de la voie d\'adressage).',
      'Régularisations systématiques → marqueur fonctionnel typique de la dyslexie de surface.',
      'À croiser avec : décision lexicale, lecture mots fréquents vs rares.',
    ],
    obsPlaceholder: 'Ex. 18/30 mots irréguliers. Régularise "femme" → /fɛm/, "second" → /sə.kõd/, "oignon" → /ɔ.ɲɔ̃/. Reconnaît qu\'elle a tort après coup sans pouvoir corriger.',
  },
  {
    key: 'lecture_mots_freq',
    label: 'Lecture de mots fréquents',
    description: 'Lecture de mots courants — repère pour comparer à mots rares (effet de fréquence).',
    cible: 'Lexique fréquent',
    rules: [
      'Mots de fréquence d\'usage élevée (table, manger, voiture, soleil…).',
      'Repère de base pour interpréter l\'effet de fréquence (mots fréquents > rares = effet de fréquence préservé = lexique orthographique fonctionnel).',
    ],
    interpretation: [
      'Mots fréquents préservés + mots rares abaissés → effet de fréquence FORT, suggère une atteinte progressive du lexique (variant logopénique à explorer).',
      'Mots fréquents abaissés → atteinte plus profonde, croiser avec décision lexicale.',
    ],
    obsPlaceholder: 'Ex. 28/30 mots fréquents lus sans erreur, vitesse OK. Pas de régularisation. Sert de baseline pour comparer aux mots rares.',
  },
  {
    key: 'lecture_mots_rares',
    label: 'Lecture de mots rares',
    description: 'Lecture de mots peu fréquents — sensible à la voie d\'adressage et au lexique orthographique de second plan.',
    cible: 'Lexique rare',
    rules: [
      'Mots de fréquence d\'usage faible (cénotaphe, ubac, gibbosité, glyphe…).',
      'Sensibles à la voie d\'adressage et à la profondeur du lexique orthographique.',
      'Si mots rares non connus du sujet, ne pas surinterpréter — distinguer méconnaissance vs trouble de lecture.',
    ],
    interpretation: [
      'Effet de fréquence marqué (mots fréquents > rares) → lexique orthographique appauvri, marqueur clinique d\'une atteinte progressive.',
      'Mots rares préservés → voie d\'adressage robuste.',
      'À croiser avec lecture mots irréguliers.',
    ],
    obsPlaceholder: 'Ex. 12/20 mots rares. Méconnaissance de 4 mots ("ubac", "glyphe"…) à distinguer des 4 erreurs de lecture proprement dites.',
  },
  {
    key: 'comp_phrases',
    label: 'Compréhension de phrases écrites',
    description: 'Compréhension de structures syntaxiques en lecture (relatives, passives, comparatives, négations doubles).',
    cible: 'Compréhension syntaxique',
    rules: [
      'Présentation de phrases avec choix de réponse ou désignation d\'image.',
      'Sensible aux structures syntaxiques complexes (passives, relatives enchâssées).',
    ],
    interpretation: [
      'Échec sur phrases passives / relatives mais OK sur déclaratives simples → trouble de la compréhension syntaxique (à croiser avec un bilan langage oral).',
      'Échec global → trouble global de la compréhension écrite (à différencier d\'un trouble de décodage qui en serait la cause).',
    ],
    obsPlaceholder: 'Ex. 6/10 phrases. Échec sur les 3 structures passives, OK sur les déclaratives. Suspecte une comparative ("le chat est plus petit que le chien").',
  },
  {
    key: 'comp_paragraphe',
    label: 'Compréhension de paragraphe / texte',
    description: 'Compréhension narrative et inférences en lecture.',
    cible: 'Compréhension globale',
    rules: [
      'Lecture d\'un paragraphe/texte, puis questions de compréhension (factuelles + inférences).',
      'Distinguer questions factuelles (informations explicites) vs inférentielles (déductions, lecture entre les lignes).',
    ],
    interpretation: [
      'Inférences abaissées + factuelles préservées → trouble inférentiel pur (charge exécutive), croiser avec PrediFex.',
      'Factuelles ET inférences abaissées → trouble de la compréhension globale, croiser avec lecture chronométrée (peut être un défaut de décodage qui handicape la compréhension).',
    ],
    obsPlaceholder: 'Ex. 4/6 factuelles, 1/4 inférences. Restitution narrative confuse, mélange l\'ordre des événements. Temps de lecture long (4 min pour le paragraphe).',
  },
  {
    key: 'vitesse_lecture',
    label: 'Vitesse de lecture (chronométrée)',
    description: 'Marqueur clé — ralentissement avec précision préservée = trouble de la fluence / automatisation.',
    cible: 'Vitesse / fluence',
    rules: [
      'Lecture d\'un texte calibré, chronométrée. Calcul de la vitesse en mots/min.',
      'Reporter SCORE + VITESSE séparément : un sujet peut être correct en précision mais lent en vitesse (marqueur fluence).',
      'Pas de seuil de vitesse documenté dans le manuel public (à reporter d\'après le logiciel HappyNeuron).',
    ],
    interpretation: [
      'Vitesse ralentie + précision préservée → trouble de la fluence / automatisation (typique des séquelles d\'AVC postérieur, ou vieillissement cognitif débutant).',
      'Vitesse normale + précision abaissée → trouble du décodage ou de la voie d\'adressage selon le type d\'erreurs.',
      'Vitesse + précision abaissées → trouble global de la lecture.',
    ],
    obsPlaceholder: 'Ex. 120 mots/min (référence ortho : ≥ 180 attendus pour un adulte NSC 3). Précision 95 %. Fatigabilité oculaire signalée après 5 min.',
  },
  {
    key: 'decision_lexicale',
    label: 'Décision lexicale',
    description: 'Choix mot vs pseudomot — accès au lexique orthographique d\'entrée.',
    cible: 'Lexique orthographique',
    rules: [
      'Présentation de stimuli : le sujet doit dire si c\'est un mot français existant ou non.',
      'Mesure l\'accès au lexique orthographique sans passer par la lecture à voix haute.',
    ],
    interpretation: [
      'Décision lexicale préservée + lecture à voix haute abaissée → l\'accès au lexique est OK, la production phonologique est limitée (croiser avec BECD, BIA).',
      'Décision lexicale abaissée → atteinte du lexique orthographique lui-même (croiser avec lecture mots irréguliers et rares).',
    ],
    obsPlaceholder: 'Ex. 38/40 décisions correctes. Hésite sur les pseudomots ressemblant à des mots existants ("polotage" / "potolage"). Rapide sur les vrais mots fréquents.',
  },
]

const TRANCHE_AGE_OPTIONS: Array<{ key: '1' | '2' | '3' | '4' | '5'; label: string }> = [
  { key: '1', label: '1 — 18-49 ans' },
  { key: '2', label: '2 — 50-59 ans' },
  { key: '3', label: '3 — 60-69 ans' },
  { key: '4', label: '4 — 70-79 ans' },
  { key: '5', label: '5 — 80-90 ans' },
]
const NSC_OPTIONS: Array<{ key: '2' | '3'; label: string }> = [
  { key: '2', label: 'NSC 2 — Bac à Bac+3' },
  { key: '3', label: 'NSC 3 — ≥ Bac+4 (haute réserve cognitive)' },
]

interface EpreuveState {
  zone: ZoneKey
  score_brut: string
  temps: string
  vitesse: string
  observation: string
  non_passee: boolean
}

interface State {
  trancheAge: '' | '1' | '2' | '3' | '4' | '5'
  nsc: '' | '2' | '3'
  epreuves: Record<string, EpreuveState>
}

function emptyState(): State {
  const ep: Record<string, EpreuveState> = {}
  for (const e of EPREUVES) ep[e.key] = { zone: '', score_brut: '', temps: '', vitesse: '', observation: '', non_passee: false }
  return { trancheAge: '', nsc: '', epreuves: ep }
}

export default function PrediLacScoresInput({ notes, onNotesChange, onResultatsChange }: Props) {
  const [state, setState] = useState<State>(emptyState)

  const totalSaisies = useMemo(() => {
    let n = 0
    for (const e of EPREUVES) {
      const st = state.epreuves[e.key]
      if (st.non_passee) continue
      if (st.zone !== '') n++
    }
    return n
  }, [state.epreuves])

  const zoneCounts = useMemo(() => {
    const c: Record<Exclude<ZoneKey, ''>, number> = { vert_fonce: 0, vert_clair: 0, jaune: 0, orange: 0, rouge: 0 }
    for (const e of EPREUVES) {
      const st = state.epreuves[e.key]
      if (st.non_passee) continue
      if (st.zone) c[st.zone]++
    }
    return c
  }, [state.epreuves])

  useEffect(() => {
    if (totalSaisies === 0 && !state.trancheAge && !state.nsc) {
      onResultatsChange('')
      return
    }
    const lines: string[] = []
    lines.push('=== PrediLac — Protocole d\'évaluation et de dépistage des insuffisances de la LACture (Duchêne & Jaillard, HappyNeuron) ===')
    if (state.trancheAge || state.nsc) {
      const trancheLabel = TRANCHE_AGE_OPTIONS.find(o => o.key === state.trancheAge)?.label || '(non précisée)'
      const nscLabel = NSC_OPTIONS.find(o => o.key === state.nsc)?.label || '(non précisé)'
      lines.push(`Stratification : ${trancheLabel} — ${nscLabel}`)
      lines.push('')
    }
    for (const e of EPREUVES) {
      const st = state.epreuves[e.key]
      if (st.non_passee) continue
      if (!st.zone && !st.observation.trim() && !st.score_brut.trim() && !st.temps.trim() && !st.vitesse.trim()) continue
      lines.push(`--- ${e.label} ---`)
      if (st.score_brut.trim()) lines.push(`Score brut : ${st.score_brut.trim()}`)
      if (st.temps.trim()) lines.push(`Temps : ${st.temps.trim()}`)
      if (st.vitesse.trim()) lines.push(`Vitesse de lecture : ${st.vitesse.trim()} mots/min`)
      if (st.zone) {
        const z = ZONES.find(zz => zz.key === st.zone)!
        lines.push(`Zone HappyNeuron : ${z.label} (${z.sigma}) — ${ZONE_LABEL_CLINIQUE[st.zone]}`)
      }
      if (st.observation.trim()) lines.push(`Observation : ${st.observation.trim()}`)
      lines.push('')
    }
    const tot = zoneCounts.vert_fonce + zoneCounts.vert_clair + zoneCounts.jaune + zoneCounts.orange + zoneCounts.rouge
    if (tot > 0) {
      lines.push('--- Synthèse zones HappyNeuron ---')
      lines.push(`Vert foncé (préservé) : ${zoneCounts.vert_fonce}`)
      lines.push(`Vert clair (moyenne basse) : ${zoneCounts.vert_clair}`)
      lines.push(`Jaune (seuil d'alerte) : ${zoneCounts.jaune}`)
      lines.push(`Orange (difficulté avérée) : ${zoneCounts.orange}`)
      lines.push(`Rouge (effondrement) : ${zoneCounts.rouge}`)
    }
    onResultatsChange(lines.join('\n'))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, totalSaisies, zoneCounts])

  const setField = (key: string, field: keyof EpreuveState, v: any) => {
    setState(s => ({ ...s, epreuves: { ...s.epreuves, [key]: { ...s.epreuves[key], [field]: v } } }))
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-2 p-3 rounded-lg border border-indigo-200 bg-indigo-50">
        <Brain size={18} className="text-indigo-600 shrink-0 mt-0.5" />
        <div className="text-sm">
          <p className="font-semibold text-indigo-900">Saisie structurée PrediLac — dépistage lecture adulte</p>
          <p className="text-indigo-700 text-xs mt-0.5 leading-relaxed">
            Reportez la <strong>zone HappyNeuron</strong> lue sur le logiciel pour chaque épreuve. Population cible :
            adultes NSC 2 et 3. NSC 1 déconseillé. Seuil d&apos;alerte officiel : M − 1,5 σ.
          </p>
          <p className="text-[11px] text-amber-800 mt-1">
            ⚠️ Liste d&apos;épreuves indicative (framework commun gamme PREDI) — à ajuster selon le manuel papier officiel.
          </p>
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-4 space-y-3">
        <p className="text-sm font-semibold text-gray-900 flex items-center gap-1.5">
          <Info size={14} className="text-indigo-600" />
          Stratification obligatoire — âge × NSC
        </p>
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Tranche d&apos;âge</label>
            <select
              value={state.trancheAge}
              onChange={(e) => setState(s => ({ ...s, trancheAge: e.target.value as State['trancheAge'] }))}
              className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            >
              <option value="">— choisir —</option>
              {TRANCHE_AGE_OPTIONS.map(o => (<option key={o.key} value={o.key}>{o.label}</option>))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Niveau socio-culturel (NSC)</label>
            <select
              value={state.nsc}
              onChange={(e) => setState(s => ({ ...s, nsc: e.target.value as State['nsc'] }))}
              className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            >
              <option value="">— choisir —</option>
              {NSC_OPTIONS.map(o => (<option key={o.key} value={o.key}>{o.label}</option>))}
            </select>
          </div>
        </div>
      </div>

      {totalSaisies > 0 && (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
          <p className="text-xs font-semibold text-gray-700 mb-2">
            Répartition par zone — {totalSaisies}/{EPREUVES.length} épreuves saisies
          </p>
          <div className="flex flex-wrap gap-1.5">
            {ZONES.map(z => {
              const n = zoneCounts[z.key]
              if (n === 0) return null
              return (
                <span key={z.key} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded ${z.chipBg} ${z.chipText} text-xs font-medium`}>
                  <span className="font-bold">{n}</span>
                  <span>{z.label}</span>
                </span>
              )
            })}
          </div>
        </div>
      )}

      <div className="space-y-3">
        {EPREUVES.map(e => {
          const st = state.epreuves[e.key]
          return (
            <div key={e.key} className="rounded-lg border border-gray-200 bg-white p-4">
              <div className="flex items-start justify-between gap-3 flex-wrap mb-2">
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-semibold text-gray-900">{e.label}</h4>
                  <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{e.description}</p>
                  <p className="text-[10px] text-indigo-600 mt-0.5">Cible : {e.cible}</p>
                </div>
                <label className="text-xs text-gray-600 flex items-center gap-1.5 shrink-0">
                  <input
                    type="checkbox"
                    checked={st.non_passee}
                    onChange={(ev) => setField(e.key, 'non_passee', ev.target.checked)}
                    className="rounded"
                  />
                  Non passée
                </label>
              </div>

              {!st.non_passee && (
                <div className="space-y-2 mt-2">
                  <div className="grid sm:grid-cols-3 gap-2">
                    <input
                      type="text"
                      value={st.score_brut}
                      onChange={(ev) => setField(e.key, 'score_brut', ev.target.value)}
                      placeholder="Score brut (opt.)"
                      className="px-2 py-1 border border-gray-300 rounded text-xs"
                    />
                    <input
                      type="text"
                      value={st.temps}
                      onChange={(ev) => setField(e.key, 'temps', ev.target.value)}
                      placeholder="Temps (opt.)"
                      className="px-2 py-1 border border-gray-300 rounded text-xs"
                    />
                    {e.key === 'vitesse_lecture' && (
                      <input
                        type="text"
                        value={st.vitesse}
                        onChange={(ev) => setField(e.key, 'vitesse', ev.target.value)}
                        placeholder="Mots/min"
                        className="px-2 py-1 border border-gray-300 rounded text-xs"
                      />
                    )}
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-gray-700 mb-1">
                      Zone HappyNeuron (reportée du logiciel) :
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {ZONES.map(z => {
                        const active = st.zone === z.key
                        return (
                          <button
                            key={z.key}
                            type="button"
                            onClick={() => setField(e.key, 'zone', active ? '' : z.key)}
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium transition ${z.chipBg} ${z.chipText} ${active ? `ring-2 ${z.chipRing}` : 'opacity-60 hover:opacity-100'}`}
                            title={z.sigma}
                          >
                            {z.label}
                          </button>
                        )
                      })}
                      {st.zone && (
                        <button
                          type="button"
                          onClick={() => setField(e.key, 'zone', '')}
                          className="text-[11px] text-gray-600 hover:text-gray-900 underline decoration-dotted px-2 py-1"
                        >
                          effacer
                        </button>
                      )}
                    </div>
                  </div>
                  {/* Règles de cotation (accordéon) */}
                  <details className="group rounded-md border border-indigo-100 bg-indigo-50/50">
                    <summary className="flex items-center gap-1.5 px-3 py-2 cursor-pointer select-none text-xs font-medium text-indigo-800 hover:bg-indigo-50">
                      <ChevronDown size={14} className="transition-transform group-open:rotate-0 -rotate-90" />
                      Règles de cotation / bonnes pratiques
                    </summary>
                    <ul className="px-3 pb-3 pt-1 space-y-1 text-xs text-gray-700">
                      {e.rules.map((r, i) => (
                        <li key={i} className="leading-relaxed">{r}</li>
                      ))}
                    </ul>
                  </details>

                  {/* Aide à l'interprétation (accordéon ambre) */}
                  <details className="group rounded-md border border-amber-200 bg-amber-50/60">
                    <summary className="flex items-center gap-1.5 px-3 py-2 cursor-pointer select-none text-xs font-medium text-amber-900 hover:bg-amber-100/50">
                      <ChevronDown size={14} className="transition-transform group-open:rotate-0 -rotate-90" />
                      Aide à l&apos;interprétation clinique
                    </summary>
                    <ul className="px-3 pb-3 pt-1 space-y-1 text-xs text-gray-700">
                      {e.interpretation.map((r, i) => (
                        <li key={i} className="leading-relaxed">{r}</li>
                      ))}
                    </ul>
                  </details>

                  <textarea
                    value={st.observation}
                    onChange={(ev) => setField(e.key, 'observation', ev.target.value)}
                    rows={2}
                    placeholder={e.obsPlaceholder}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-xs leading-relaxed resize-y"
                  />
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <div className="flex items-center justify-between mb-1">
          <label className="text-sm font-medium text-gray-800">
            Notes globales sur la séance (comportement, fatigabilité, retentissement fonctionnel)
          </label>
          <MicButton value={notes} onChange={onNotesChange} />
        </div>
        <textarea
          value={notes}
          onChange={(e) => onNotesChange(e.target.value)}
          rows={3}
          placeholder="Ex. patient coopératif, fatigue oculaire après 20 min, abandon de la lecture du journal depuis 6 mois selon le conjoint…"
          className="w-full px-3 py-2 border border-gray-300 rounded text-sm leading-relaxed resize-y focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />
      </div>

      <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
        <div className="flex items-start gap-2">
          <AlertCircle size={16} className="text-amber-700 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-900 leading-relaxed">
            <p className="font-semibold mb-1">Rappels cliniques PrediLac</p>
            <ul className="list-disc list-inside space-y-0.5">
              <li>PrediLac est un <strong>dépistage</strong>, jamais un diagnostic. Aucune étiologie nommée (APP, démence, AVC).</li>
              <li>Croiser au moins <strong>2-3 épreuves convergentes</strong> avant de retenir un sous-type (dyslexie phonologique acquise / surface / mixte / trouble compréhension isolé).</li>
              <li>La <strong>vitesse de lecture</strong> est un marqueur clé — score normal en vitesse pathologique = trouble de la fluence à signaler.</li>
              <li>Mentionner les <strong>composantes préservées en premier</strong>. Vocabulaire fonctionnel quotidien (lecture du journal, notices médicales, SMS).</li>
              <li><strong>NSC 1 (scolarité &lt; 8 ans)</strong> : ne pas faire passer — épreuves trop exigeantes.</li>
              <li>Articuler avec <strong>PREDIMEM + PrediFex</strong> pour un bilan PREDI complet chez l&apos;adulte.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
