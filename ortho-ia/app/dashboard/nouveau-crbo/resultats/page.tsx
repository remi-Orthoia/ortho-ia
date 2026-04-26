'use client'

/**
 * Page intermédiaire entre l'extraction (phase 1) et la synthèse (phase 2).
 *
 * Elle reçoit (via sessionStorage) :
 *  - formData complet du formulaire
 *  - extracted : { anamnese_redigee, motif_reformule, domains[] } produit par
 *    Claude en phase 1 à partir des notes brutes
 *
 * Elle laisse l'orthophoniste :
 *  - éditer l'anamnèse rédigée
 *  - éditer le motif reformulé
 *  - visualiser le graphique HappyNeuron global (calculé côté front depuis le JSON)
 *  - visualiser et éditer les tableaux par domaine (au cas où l'IA aurait mal classé)
 *  - saisir des commentaires qualitatifs par domaine ("enfant fatigué…")
 *
 * Au clic sur "Générer le CRBO Word" :
 *  - call API phase=synthesize → renvoie diagnostic + recommandations + comorbidités + PAP
 *  - merge extracted + edits + synthesized → CRBOStructure complète
 *  - insert dans la table crbos
 *  - download Word
 *  - redirect vers le dashboard
 */

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Loader2, Sparkles, Download, ArrowLeft, AlertCircle, MessageSquare,
} from 'lucide-react'
import { createClient } from '@/lib/supabase'
import type { CRBOStructure, CRBOEpreuve, CRBODomain, ExtractedCRBO, SynthesizedCRBO } from '@/lib/prompts'
import type { CRBOFormData } from '@/lib/types'
import { drawHappyNeuronChart, type ChartGroup } from '@/lib/chart'
import { downloadCRBOWord, SEUILS, getPercentileColor } from '@/lib/word-export'

interface Handoff {
  formData: CRBOFormData
  extracted: ExtractedCRBO
  selectedPatientId?: string
  selectedMedecinId?: string
}

const HANDOFF_KEY = 'ortho-ia:crbo-handoff'

function HappyNeuronCanvas({ groups, title }: { groups: ChartGroup[]; title: string }) {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const w = 1000, h = 480
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    drawHappyNeuronChart(ctx, w, h, groups, title)
  }, [groups, title])
  return (
    <canvas
      ref={ref}
      className="w-full h-auto"
      style={{ maxWidth: '100%' }}
    />
  )
}

function DomainTable({ domain }: { domain: CRBODomain }) {
  return (
    <div className="overflow-x-auto -mx-5 px-5">
      <table className="w-full text-sm">
        <thead className="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-surface-dark-muted">
          <tr>
            <th className="text-left py-2 pr-3">Épreuve</th>
            <th className="text-center py-2 px-2 w-20">Score</th>
            <th className="text-center py-2 px-2 w-16">É-T</th>
            <th className="text-center py-2 px-2 w-20">Centile</th>
            <th className="text-center py-2 pl-2 w-32">Interprétation</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-surface-dark-muted/50">
          {domain.epreuves.map((e: CRBOEpreuve, eIdx: number) => {
            const color = getPercentileColor(e.percentile_value)
            return (
              <tr key={eIdx} className="hover:bg-gray-50 dark:hover:bg-surface-dark-muted/30">
                <td className="py-2 pr-3 text-gray-900 dark:text-gray-100">{e.nom}</td>
                <td className="py-2 px-2 text-center font-mono text-gray-700 dark:text-gray-300">{e.score}</td>
                <td className="py-2 px-2 text-center font-mono text-gray-600 dark:text-gray-400">{e.et ?? '—'}</td>
                <td className="py-2 px-2 text-center font-mono" style={{ backgroundColor: '#' + color + '60' }}>
                  {e.percentile}
                </td>
                <td className="py-2 pl-2 text-center">
                  <span className="inline-block px-2 py-0.5 rounded text-xs font-semibold" style={{ backgroundColor: '#' + color, color: '#000' }}>
                    {e.interpretation}
                  </span>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

export default function ResultatsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState('')
  const [handoff, setHandoff] = useState<Handoff | null>(null)
  const [anamneseEdit, setAnamneseEdit] = useState('')
  const [motifEdit, setMotifEdit] = useState('')
  const [orthoComments, setOrthoComments] = useState<Record<string, string>>({})

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(HANDOFF_KEY)
      if (!raw) {
        // Pas de handoff : l'utilisatrice est arrivée ici directement (pas via le form).
        router.push('/dashboard/nouveau-crbo')
        return
      }
      const data = JSON.parse(raw) as Handoff
      if (!data.extracted || !data.formData) {
        router.push('/dashboard/nouveau-crbo')
        return
      }
      setHandoff(data)
      setAnamneseEdit(data.extracted.anamnese_redigee || '')
      setMotifEdit(data.extracted.motif_reformule || '')
    } catch (e) {
      console.error('Handoff illisible:', e)
      router.push('/dashboard/nouveau-crbo')
    } finally {
      setLoading(false)
    }
  }, [router])

  const handleCommentChange = (domainName: string, value: string) => {
    setOrthoComments(prev => ({ ...prev, [domainName]: value }))
  }

  const handleGenerateAndDownload = async () => {
    if (!handoff) return
    if (generating) return
    setGenerating(true)
    setError('')

    try {
      // ============ PHASE 2 : SYNTHÈSE ============
      const response = await fetch('/api/generate-crbo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phase: 'synthesize',
          formData: handoff.formData,
          extracted: handoff.extracted,
          edits: {
            anamnese: anamneseEdit,
            motif: motifEdit,
            ortho_comments: orthoComments,
          },
        }),
      })

      const data = await response.json()
      if (!response.ok) {
        if (response.status === 401) {
          setError('Session expirée — veuillez vous reconnecter.')
          setTimeout(() => router.push('/auth/login'), 2000)
          return
        }
        throw new Error(data.error || 'Erreur lors de la génération de la synthèse')
      }
      const synthesized = data.synthesized as SynthesizedCRBO

      // ============ Construction de la CRBOStructure finale ============
      // Les commentaires qualitatifs ortho remplacent le champ `commentaire`
      // du domaine (legacy), pour que le Word affiche directement la note ortho
      // sous chaque tableau.
      const domainsWithOrthoComments: CRBODomain[] = handoff.extracted.domains.map(d => ({
        ...d,
        commentaire: (orthoComments[d.nom] || '').trim(),
      }))

      const finalStructure: CRBOStructure = {
        anamnese_redigee: anamneseEdit.trim() || handoff.extracted.anamnese_redigee,
        motif_reformule: motifEdit.trim() || handoff.extracted.motif_reformule || '',
        domains: domainsWithOrthoComments,
        diagnostic: synthesized.diagnostic,
        recommandations: synthesized.recommandations,
        conclusion: synthesized.conclusion,
        comorbidites_detectees: synthesized.comorbidites_detectees,
        pap_suggestions: synthesized.pap_suggestions,
        severite_globale: synthesized.severite_globale ?? null,
        synthese_evolution: synthesized.synthese_evolution ?? null,
      }

      // ============ Persistance Supabase ============
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setError('Session expirée — votre CRBO n\'a pas pu être sauvegardé.')
        return
      }

      const fd = handoff.formData
      const { error: insertError } = await supabase
        .from('crbos')
        .insert({
          user_id: user.id,
          patient_id: handoff.selectedPatientId || null,
          patient_prenom: fd.patient_prenom,
          patient_nom: fd.patient_nom,
          patient_ddn: fd.patient_ddn,
          patient_classe: fd.patient_classe,
          bilan_date: fd.bilan_date,
          bilan_type: fd.bilan_type,
          medecin_nom: fd.medecin_nom,
          medecin_tel: fd.medecin_tel,
          motif: fd.motif,
          anamnese: fd.anamnese,
          test_utilise: Array.isArray(fd.test_utilise) ? fd.test_utilise.join(', ') : (fd.test_utilise || ''),
          resultats: fd.resultats_manuels,
          notes_passation: fd.notes_passation,
          structure_json: finalStructure,
          comportement_seance: fd.comportement_seance || null,
          duree_seance_minutes: fd.duree_seance_minutes || null,
          severite_globale: finalStructure.severite_globale ?? null,
          bilan_precedent_id: fd.bilan_precedent_id || null,
        })
        .select('id')
        .single()

      if (insertError) {
        console.error('Erreur sauvegarde CRBO:', insertError)
        setError('Le CRBO a été généré mais n\'a pas pu être sauvegardé. Téléchargez-le maintenant.')
      }

      // Compteurs (best-effort) — log si échec, ne bloque pas le téléchargement
      try {
        const { error: rpcError } = await supabase.rpc('increment_crbo_count', { user_id: user.id })
        if (rpcError) console.warn('Compteur CRBO non incrémenté:', rpcError)
      } catch (e) { console.warn('Compteur CRBO RPC failed:', e) }
      if (handoff.selectedMedecinId) {
        try {
          const { error: medErr } = await supabase.rpc('increment_medecin_usage', { medecin_id: handoff.selectedMedecinId })
          if (medErr) console.warn('Compteur médecin non incrémenté:', medErr)
        } catch (e) { console.warn('Compteur médecin RPC failed:', e) }
      }

      // ============ Téléchargement Word ============
      await downloadCRBOWord({
        formData: fd,
        structure: finalStructure,
        previousStructure: fd.bilan_precedent_structure ?? null,
        previousBilanDate: fd.bilan_precedent_date,
      })

      // Nettoyage handoff + redirect
      sessionStorage.removeItem(HANDOFF_KEY)
      router.push('/dashboard')
    } catch (err: any) {
      setError(err?.message || 'Erreur inattendue lors de la génération.')
    } finally {
      setGenerating(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-primary-600" size={28} />
      </div>
    )
  }

  if (!handoff) return null

  const { formData: fd, extracted } = handoff
  const groups: ChartGroup[] = extracted.domains
    .map(d => ({ name: d.nom, bars: d.epreuves.map(e => ({ label: e.nom, value: e.percentile_value })) }))
    .filter(g => g.bars.length > 0)

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20">
      {/* Bandeau navigation */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <Link
          href="/dashboard/nouveau-crbo"
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft size={16} />
          Retour au formulaire
        </Link>
        <div className="text-xs text-gray-500">
          Étape intermédiaire · validation des extractions par l&apos;orthophoniste
        </div>
      </div>

      {/* Bandeau patient */}
      <div className="card-lifted px-6 py-4 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            {fd.patient_prenom} {fd.patient_nom}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {fd.patient_classe ? `Classe ${fd.patient_classe} · ` : ''}
            {Array.isArray(fd.test_utilise) ? fd.test_utilise.join(', ') : fd.test_utilise}
          </p>
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400">
          Bilan {fd.bilan_type} du {fd.bilan_date}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start gap-2">
          <AlertCircle size={20} className="shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Anamnèse éditable */}
      <section className="card-modern p-5 space-y-3">
        <div>
          <h2 className="font-bold text-primary-700 dark:text-primary-400">Anamnèse reformulée</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Texte généré par l&apos;IA depuis vos notes brutes. Vous pouvez l&apos;éditer librement avant la génération finale.
          </p>
        </div>
        <textarea
          value={anamneseEdit}
          onChange={(e) => setAnamneseEdit(e.target.value)}
          rows={Math.max(6, Math.min(20, anamneseEdit.split('\n').length + 2))}
          className="w-full px-4 py-3 border border-gray-300 dark:border-surface-dark-muted rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm leading-relaxed dark:bg-surface-dark"
        />
      </section>

      {/* Motif reformulé éditable */}
      <section className="card-modern p-5 space-y-3">
        <div>
          <h2 className="font-bold text-primary-700 dark:text-primary-400">Motif de consultation reformulé</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            1-2 phrases pro à partir des notes brutes. Éditable.
          </p>
        </div>
        <textarea
          value={motifEdit}
          onChange={(e) => setMotifEdit(e.target.value)}
          rows={3}
          className="w-full px-4 py-3 border border-gray-300 dark:border-surface-dark-muted rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm dark:bg-surface-dark"
          placeholder="(aucun motif)"
        />
      </section>

      {/* Graphique global HappyNeuron */}
      {groups.length > 0 && (
        <section className="card-modern p-5 space-y-3">
          <h2 className="font-bold text-primary-700 dark:text-primary-400">
            Profil global — percentiles par épreuve
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Chaque barre représente une épreuve, regroupée par domaine du test. Médiane à P50 (trait noir). Seuil d&apos;alerte clinique à P7 (trait rouge).
          </p>
          <div className="overflow-x-auto">
            <HappyNeuronCanvas groups={groups} title="Profil global — percentiles par épreuve" />
          </div>
        </section>
      )}

      {/* Tableaux par domaine + textareas commentaires qualitatifs */}
      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Détails par domaine</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Saisissez vos observations qualitatives sous chaque tableau. Elles enrichiront la synthèse Claude (comportement, fatigue, anxiété, conditions de passation…).
          </p>
        </div>

        {/* Légende des seuils */}
        <div className="flex flex-wrap gap-2 text-xs">
          {SEUILS.map(s => (
            <span key={s.label} className="inline-flex items-center gap-1.5 px-2 py-1 rounded border" style={{ backgroundColor: '#' + s.shading, borderColor: '#' + s.shading }}>
              <strong>{s.label}</strong> {s.range}
            </span>
          ))}
        </div>

        {extracted.domains.map((d, dIdx) => (
          <div key={dIdx} className="card-modern p-5 space-y-3">
            <h3 className="font-bold text-primary-700 dark:text-primary-400 text-base">
              {d.nom}
            </h3>
            <DomainTable domain={d} />
            <div className="pt-2 space-y-2">
              <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">
                <MessageSquare size={14} className="text-primary-600" />
                Commentaires qualitatifs de l&apos;orthophoniste
                <span className="text-xs font-normal text-gray-400">— optionnel</span>
              </label>
              <textarea
                value={orthoComments[d.nom] || ''}
                onChange={(e) => handleCommentChange(d.nom, e.target.value)}
                rows={3}
                placeholder="Ex: enfant fatigué sur cette épreuve, encouragements nécessaires, score sous-estimé car distracteurs visuels…"
                className="w-full px-3 py-2 border border-gray-300 dark:border-surface-dark-muted rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm dark:bg-surface-dark"
              />
            </div>
          </div>
        ))}
      </section>

      {/* CTA finale — déclenche phase 2 + sauvegarde + téléchargement */}
      <div className="sticky bottom-4 z-20">
        <div className="card-lifted bg-white dark:bg-surface-dark p-4 flex items-center justify-between flex-wrap gap-3 border-2 border-primary-200">
          <div>
            <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
              Tout est bon ?
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Claude va rédiger le diagnostic + recommandations en s&apos;appuyant sur vos commentaires.
            </p>
          </div>
          <button
            type="button"
            disabled={generating}
            onClick={handleGenerateAndDownload}
            className="btn-primary py-3 px-6 disabled:opacity-50"
          >
            {generating ? (
              <>
                <Loader2 className="animate-spin" size={18} />
                Génération de la synthèse…
              </>
            ) : (
              <>
                <Sparkles size={18} />
                Générer le CRBO Word
                <Download size={16} className="ml-1" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
