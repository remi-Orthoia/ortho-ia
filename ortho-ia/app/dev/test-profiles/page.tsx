'use client'

/**
 * Banc de test pour évaluer la qualité du CRBO généré sur 5 profils variés.
 * Accessible sans auth (hors middleware /dashboard).
 *
 * Nécessite ANTHROPIC_API_KEY côté serveur et contourne l'auth Supabase
 * (la route /api/generate-crbo exige un user authentifié en prod — pour
 * le dev, se connecter d'abord puis venir sur cette page).
 */

import { useState } from 'react'
import { TEST_PROFILES, type TestProfile } from '@/lib/test-profiles'
import { Sparkles, ChevronDown, ChevronUp, Loader2, CheckCircle, XCircle } from 'lucide-react'

type ProfileResult = {
  status: 'idle' | 'running' | 'success' | 'error'
  crbo?: string
  structure?: any
  error?: string
  duration_ms?: number
}

export default function TestProfilesPage() {
  const [results, setResults] = useState<Record<string, ProfileResult>>({})
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})

  const runProfile = async (profile: TestProfile) => {
    setResults(prev => ({ ...prev, [profile.id]: { status: 'running' } }))
    const t0 = performance.now()
    try {
      const res = await fetch('/api/generate-crbo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ formData: profile.formData }),
      })
      const data = await res.json()
      const duration_ms = Math.round(performance.now() - t0)
      if (!res.ok) {
        setResults(prev => ({
          ...prev,
          [profile.id]: { status: 'error', error: data.error ?? `HTTP ${res.status}`, duration_ms },
        }))
        return
      }
      setResults(prev => ({
        ...prev,
        [profile.id]: {
          status: 'success',
          crbo: data.crbo,
          structure: data.structure,
          duration_ms,
        },
      }))
    } catch (err: any) {
      const duration_ms = Math.round(performance.now() - t0)
      setResults(prev => ({
        ...prev,
        [profile.id]: { status: 'error', error: String(err?.message ?? err), duration_ms },
      }))
    }
  }

  const runAll = async () => {
    for (const profile of TEST_PROFILES) {
      await runProfile(profile)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 sm:p-8 mb-6">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <Sparkles className="text-green-600" />
            Banc de test — qualité des CRBO générés
          </h1>
          <p className="mt-2 text-gray-600">
            5 profils cliniques variés pour évaluer le prompt IA. Vérifie la qualité de
            l&apos;anamnèse, des interprétations, du diagnostic différentiel et des recommandations.
          </p>
          <div className="mt-4 bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
            ⚠️ Cette page appelle <code>/api/generate-crbo</code> qui exige un user authentifié.
            Connecte-toi d&apos;abord (
            <a href="/auth/login" className="underline text-amber-900">/auth/login</a>
            ) puis reviens ici. Chaque génération consomme du crédit IA.
          </div>
          <button
            onClick={runAll}
            className="mt-6 w-full sm:w-auto inline-flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-green-700 transition"
          >
            <Sparkles size={18} />
            Lancer les 5 générations en séquence
          </button>
        </div>

        <div className="space-y-4">
          {TEST_PROFILES.map((profile, idx) => {
            const r = results[profile.id] ?? { status: 'idle' as const }
            const exp = expanded[profile.id] ?? false
            return (
              <div key={profile.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm">
                <div className="p-5 flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-green-100 text-green-700 font-bold text-sm">
                        {idx + 1}
                      </span>
                      <h2 className="font-bold text-gray-900">{profile.label}</h2>
                      {r.status === 'running' && <Loader2 className="animate-spin text-green-600" size={16} />}
                      {r.status === 'success' && <CheckCircle className="text-green-600" size={16} />}
                      {r.status === 'error' && <XCircle className="text-red-600" size={16} />}
                      {r.duration_ms !== undefined && (
                        <span className="text-xs text-gray-500">{(r.duration_ms / 1000).toFixed(1)}s</span>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-gray-600">
                      <strong>Hypothèse :</strong> {profile.hypothese_clinique}
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      Tests : {profile.formData.test_utilise.join(' + ')} · Patient :{' '}
                      {profile.formData.patient_prenom} ({profile.formData.patient_classe})
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => runProfile(profile)}
                      disabled={r.status === 'running'}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700 transition disabled:opacity-50"
                    >
                      {r.status === 'running' ? 'En cours…' : 'Générer'}
                    </button>
                    <button
                      onClick={() => setExpanded(prev => ({ ...prev, [profile.id]: !prev[profile.id] }))}
                      className="p-2 text-gray-500 hover:text-gray-900"
                    >
                      {exp ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </button>
                  </div>
                </div>

                {exp && (
                  <div className="border-t border-gray-100 p-5 space-y-4">
                    <details className="bg-gray-50 rounded-lg p-3">
                      <summary className="cursor-pointer text-sm font-semibold text-gray-800">
                        Données d&apos;entrée (anamnèse brute + résultats)
                      </summary>
                      <pre className="mt-3 text-xs whitespace-pre-wrap text-gray-700">
                        {`--- ANAMNÈSE BRUTE ---\n${profile.formData.anamnese}\n\n--- RÉSULTATS ---\n${profile.formData.resultats_manuels}\n\n--- NOTES D'ANALYSE ---\n${profile.formData.notes_analyse}`}
                      </pre>
                    </details>

                    {r.status === 'success' && r.crbo && (
                      <details open className="bg-green-50 border border-green-200 rounded-lg p-3">
                        <summary className="cursor-pointer text-sm font-semibold text-green-900">
                          CRBO généré (texte)
                        </summary>
                        <pre className="mt-3 text-xs whitespace-pre-wrap text-gray-800 max-h-[500px] overflow-y-auto">
                          {r.crbo}
                        </pre>
                      </details>
                    )}

                    {r.status === 'success' && r.structure && (
                      <details className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <summary className="cursor-pointer text-sm font-semibold text-blue-900">
                          Structure JSON renvoyée par l&apos;IA
                        </summary>
                        <pre className="mt-3 text-xs whitespace-pre-wrap text-gray-800 max-h-[400px] overflow-y-auto">
                          {JSON.stringify(r.structure, null, 2)}
                        </pre>
                      </details>
                    )}

                    {r.status === 'error' && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-800">
                        <strong>Erreur :</strong> {r.error}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        <div className="mt-8 bg-white rounded-2xl border border-gray-200 p-5 text-sm text-gray-600">
          <p className="font-semibold text-gray-800 mb-2">Critères de qualité à vérifier dans chaque CRBO :</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Anamnèse en prose fluide (150-400 mots, 3ème personne, pas de notes brutes recopiées)</li>
            <li>Percentiles respectés (Q1=P25=Normal, jamais recalculés depuis l&apos;É-T)</li>
            <li>Commentaires de domaine détaillés (3-6 phrases, analyse clinique)</li>
            <li>Diagnostic différentiel explicite si profil ambigu</li>
            <li>Recommandations concrètes (fréquence, durée, axes, PAP/PPS/MDPH/RQTH)</li>
            <li>Terminologie appropriée (anomie, voies de lecture, conscience phonémique…)</li>
            <li>Pas de diagnostic médical hors champ ortho (TDAH, Alzheimer → orientation)</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
