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

import React, { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Loader2, Sparkles, Download, ArrowLeft, AlertCircle, MessageSquare,
} from 'lucide-react'
import { createClient } from '@/lib/supabase'
import type { CRBOStructure, CRBOEpreuve, CRBODomain, ExtractedCRBO, SynthesizedCRBO } from '@/lib/prompts'
import type { CRBOFormData } from '@/lib/types'
import { drawHappyNeuronChart, computeChartHeight, computeChartWidth, type ChartGroup } from '@/lib/chart'
import { downloadCRBOWord, SEUILS, getPercentileColor, seuilFor } from '@/lib/word-export'
import MicButton from '@/components/MicButton'
import StreamingCRBO from '@/components/StreamingCRBO'
import { playPrintAnimation } from '@/components/PrintAnimation'
import { playSuccessSound, playSwoosh } from '@/lib/sounds'
import { applyVocabToObject } from '@/lib/vocab-perso'
import { applyGlossaireToObject } from '@/lib/glossaire'

interface Handoff {
  formData: CRBOFormData
  extracted: ExtractedCRBO
  selectedPatientId?: string
  selectedMedecinId?: string
  /**
   * Idempotence : ID du CRBO inséré au 1er essai. Persisté dans sessionStorage
   * pour qu'un retry après échec partiel (ex: Word download bloqué par le
   * navigateur, popup refusée, disk plein) NE recrée PAS une nouvelle ligne.
   * Tant que ce champ est présent, on skip l'INSERT et on retente uniquement
   * le téléchargement Word + la promotion kanban → a_relire.
   */
  _insertedCrboId?: string | null
}

const HANDOFF_KEY = 'ortho-ia:crbo-handoff'

function HappyNeuronCanvas({ groups, title }: { groups: ChartGroup[]; title: string }) {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    // Largeur auto-ajustée selon le nombre d'épreuves (≥ 1600 px), pour ne
    // jamais couper les barres à droite. Cohérent avec le PNG embarqué dans
    // le Word — le rendu CSS scale via `w-full` pour rester lisible.
    const w = computeChartWidth(groups)
    const h = computeChartHeight(w, groups, 480)
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

/**
 * Mini-icône schématique pour les sous-items MoCA qui ont une représentation
 * graphique conventionnelle (cube en 3D, horloge à 11h10). Aide l'orthophoniste
 * à associer rapidement le sous-item à la consigne du test au moment de la
 * relecture, sans avoir à se référer au manuel.
 *
 * Retourne null si aucune icône ne correspond — la grande majorité des
 * sous-items (mots, fluences, orientations) n'en a pas besoin.
 */
function SousItemIcon({ nom }: { nom: string }) {
  const n = nom.toLowerCase()
  const stroke = 'currentColor'
  // Cube 3D wireframe — pour "Recopie du cube"
  if (n.includes('cube')) {
    return (
      <svg viewBox="0 0 28 28" width={22} height={22} fill="none" stroke={stroke} strokeWidth={1.4} strokeLinejoin="round" aria-hidden="true">
        <path d="M5 10 L14 6 L23 10 L14 14 Z" />
        <path d="M5 10 L5 20 L14 24 L14 14" />
        <path d="M23 10 L23 20 L14 24" />
        <path d="M14 6 L14 14" strokeDasharray="1.5 2" opacity={0.5} />
      </svg>
    )
  }
  // Horloge — 3 variantes selon la sous-épreuve évaluée (contour seul,
  // contour + chiffres, contour + chiffres + aiguilles à 11h10).
  if (n.includes('horloge')) {
    const withChiffres = n.includes('chiffre') || n.includes('aiguille')
    const withAiguilles = n.includes('aiguille')
    return (
      <svg viewBox="0 0 28 28" width={22} height={22} fill="none" stroke={stroke} strokeWidth={1.4} aria-hidden="true">
        <circle cx="14" cy="14" r="11" />
        {withChiffres && (
          <g>
            {/* 12 marques aux positions horaires */}
            <line x1="14" y1="3.5" x2="14" y2="5.2" />
            <line x1="14" y1="22.8" x2="14" y2="24.5" />
            <line x1="3.5" y1="14" x2="5.2" y2="14" />
            <line x1="22.8" y1="14" x2="24.5" y2="14" />
            <line x1="6.4" y1="6.4" x2="7.6" y2="7.6" />
            <line x1="20.4" y1="6.4" x2="21.6" y2="7.6" />
            <line x1="6.4" y1="21.6" x2="7.6" y2="20.4" />
            <line x1="20.4" y1="21.6" x2="21.6" y2="20.4" />
          </g>
        )}
        {withAiguilles && (
          <g strokeLinecap="round">
            {/* Petite aiguille pointant sur 11 (heures) */}
            <line x1="14" y1="14" x2="10.4" y2="9.6" strokeWidth={2} />
            {/* Grande aiguille pointant sur 2 (10 minutes) */}
            <line x1="14" y1="14" x2="21" y2="9.6" strokeWidth={1.5} />
            <circle cx="14" cy="14" r="1.2" fill={stroke} stroke="none" />
          </g>
        )}
      </svg>
    )
  }
  return null
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
                  {(() => {
                    const seuil = seuilFor(e.percentile_value)
                    return (
                      <span className="inline-block px-2 py-0.5 rounded text-xs font-semibold" style={{ backgroundColor: '#' + seuil.shading, color: seuil.textColor ? '#' + seuil.textColor : '#000' }}>
                        {seuil.label}
                      </span>
                    )
                  })()}
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
  // MoCA spécifique : commentaires par ÉPREUVE (et non par domaine). La MoCA
  // a 7 domaines cognitifs (Visuospatial / Mémoire / Orientation…) qui sont
  // rendus comme épreuves d'un domaine unique "MoCA — Profil cognitif" — on
  // mappe leur commentaire par épreuve.nom.
  const [mocaEpreuveComments, setMocaEpreuveComments] = useState<Record<string, string>>({})
  // Buffer SSE accumulé pendant la génération streaming. Vidé au reset.
  const [streamingBuffer, setStreamingBuffer] = useState('')
  // Modal post-génération : propose de chaîner un second bilan pour le même
  // patient (cas typique : screening MoCA → bilan langagier plus profond
  // type BETL). Évite de ressaisir patient + médecin pour le second CRBO.
  const [chainSuggestion, setChainSuggestion] = useState<null | {
    patientId: string | null
    patientLabel: string
    firstTest: string
  }>(null)

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
      // Pré-remplit les textareas avec la suggestion IA initiale produite en
      // phase 1. L'ortho peut la valider, modifier ou compléter — la phase 2
      // reformulera le contenu final en prose pro.
      const initialComments: Record<string, string> = {}
      const initialMocaEpreuveComments: Record<string, string> = {}
      for (const d of data.extracted.domains) {
        if (d.commentaire?.trim()) initialComments[d.nom] = d.commentaire.trim()
        // Pré-remplit les commentaires par épreuve (MoCA). L'IA met le
        // commentaire clinique propre à chaque domaine cognitif dans
        // épreuve.commentaire — on l'expose à l'ortho pour validation.
        for (const e of d.epreuves) {
          if (e.commentaire?.trim()) initialMocaEpreuveComments[e.nom] = e.commentaire.trim()
        }
      }
      setOrthoComments(initialComments)
      setMocaEpreuveComments(initialMocaEpreuveComments)
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
    setStreamingBuffer('')

    try {
      // ============ PHASE 2 : SYNTHÈSE (streaming SSE) ============
      // Plutôt qu'attendre 30-60s de spinner, on consomme un flux SSE qui
      // remonte le texte token-par-token au fur et à mesure que Claude
      // rédige. Visuel : sections (diagnostic / recommandations) se
      // remplissent en direct, avec highlight des termes cliniques.
      const response = await fetch('/api/generate-crbo?stream=1', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phase: 'synthesize',
          formData: handoff.formData,
          format: handoff.formData.format_crbo || 'complet',
          extracted: handoff.extracted,
          edits: {
            anamnese: anamneseEdit,
            motif: motifEdit,
            ortho_comments: orthoComments,
          },
        }),
      })

      if (!response.ok) {
        if (response.status === 401) {
          setError('Session expirée — veuillez vous reconnecter.')
          setTimeout(() => router.push('/auth/login'), 2000)
          return
        }
        const errBody = await response.json().catch(() => ({}))
        throw new Error(errBody?.error || 'Erreur lors de la génération de la synthèse')
      }

      // Consommer le flux SSE event par event.
      // Format : `data: <JSON>\n\n` répété.
      const reader = response.body?.getReader()
      if (!reader) throw new Error("Streaming non supporté par ce navigateur.")
      const decoder = new TextDecoder()
      let sseBuffer = ''
      let accumulated = ''
      let synthesized: SynthesizedCRBO | null = null
      let streamError: string | null = null

      while (true) {
        const { value, done } = await reader.read()
        if (done) break
        sseBuffer += decoder.decode(value, { stream: true })
        // Découper sur les délimiteurs SSE \n\n
        const events = sseBuffer.split('\n\n')
        sseBuffer = events.pop() ?? '' // dernier morceau possiblement incomplet
        for (const evt of events) {
          if (!evt.startsWith('data:')) continue
          const dataLine = evt.replace(/^data:\s*/, '')
          let parsed: any
          try { parsed = JSON.parse(dataLine) } catch { continue }
          if (parsed.type === 'delta' && typeof parsed.partial === 'string') {
            accumulated += parsed.partial
            setStreamingBuffer(accumulated)
          } else if (parsed.type === 'complete' && parsed.synthesized) {
            synthesized = parsed.synthesized as SynthesizedCRBO
          } else if (parsed.type === 'error') {
            streamError = parsed.message || 'Erreur streaming'
          }
        }
      }

      if (streamError) throw new Error(streamError)
      if (!synthesized) throw new Error("Aucune synthèse reçue à la fin du stream.")

      // ============ Construction de la CRBOStructure finale ============
      // Le commentaire final de chaque domaine est la version reformulée par
      // l'IA en phase 2 (synthesized.domain_commentaires) — fusion fluide entre
      // la suggestion IA phase 1 et les ajouts/notes brutes de l'ortho. On
      // retombe sur le contenu textarea brut (puis suggestion phase 1, puis vide)
      // si l'IA n'a pas répondu pour un domaine.
      const reformulatedByName = new Map<string, string>()
      for (const dc of synthesized.domain_commentaires ?? []) {
        if (dc?.nom && typeof dc.commentaire === 'string') {
          reformulatedByName.set(dc.nom.trim(), dc.commentaire.trim())
        }
      }
      const domainsWithOrthoComments: CRBODomain[] = handoff.extracted.domains.map(d => ({
        ...d,
        commentaire:
          reformulatedByName.get(d.nom.trim())
          ?? (orthoComments[d.nom] || d.commentaire || '').trim(),
        // MoCA : propager les commentaires édités par épreuve (clé = épreuve.nom)
        // dans CRBOEpreuve.commentaire pour qu'ils apparaissent dans la colonne
        // "Commentaire" du tableau Word. Aucun effet pour les autres tests
        // (mocaEpreuveComments reste vide).
        epreuves: d.epreuves.map(e => ({
          ...e,
          commentaire:
            (mocaEpreuveComments[e.nom] || e.commentaire || '').trim() || undefined,
        })),
      }))

      // ============ Track des champs édités par l'ortho ============
      // Permet de surligner dans le Word les passages que l'ortho a
      // explicitement modifiés (vs le draft IA brut). Construit la
      // confiance et valorise son apport.
      const editedFields: string[] = []
      const initialAnamnese = handoff.extracted.anamnese_redigee?.trim() || ''
      const editedAnamnese = anamneseEdit.trim()
      if (editedAnamnese && editedAnamnese !== initialAnamnese) {
        editedFields.push('anamnese_redigee')
      }
      const initialMotif = handoff.extracted.motif_reformule?.trim() || ''
      const editedMotif = motifEdit.trim()
      if (editedMotif && editedMotif !== initialMotif) {
        editedFields.push('motif_reformule')
      }
      // Commentaires de domaine : édités si l'ortho a tapé du contenu dans la
      // textarea (orthoComments) ET qu'il diffère de la suggestion IA initiale
      // (handoff.extracted.domains[i].commentaire).
      const initialDomainComments = new Map<string, string>()
      for (const d of handoff.extracted.domains) {
        initialDomainComments.set(d.nom, (d.commentaire ?? '').trim())
      }
      for (const [domainName, orthoText] of Object.entries(orthoComments)) {
        const orthoTrim = (orthoText ?? '').trim()
        if (orthoTrim && orthoTrim !== initialDomainComments.get(domainName)) {
          editedFields.push(`domain_commentaire:${domainName}`)
        }
      }

      const rawFinalStructure: CRBOStructure = {
        anamnese_redigee: anamneseEdit.trim() || handoff.extracted.anamnese_redigee,
        motif_reformule: motifEdit.trim() || handoff.extracted.motif_reformule || '',
        domains: domainsWithOrthoComments,
        points_forts: synthesized.points_forts,
        difficultes_identifiees: synthesized.difficultes_identifiees,
        diagnostic: synthesized.diagnostic,
        recommandations: synthesized.recommandations,
        axes_therapeutiques: synthesized.axes_therapeutiques,
        conclusion: synthesized.conclusion,
        pap_suggestions: synthesized.pap_suggestions,
        synthese_evolution: synthesized.synthese_evolution ?? null,
        reasoning_clinical: synthesized.reasoning_clinical ?? null,
        edited_fields: editedFields.length > 0 ? editedFields : undefined,
      }
      // Application du vocabulaire perso de l'ortho (localStorage). Réécrit
      // les sections narratives selon ses préférences ("patient" → "enfant",
      // "voie d'assemblage" → "décodage", etc.). No-op si aucune règle.
      // Puis glossaire CRBO (rattrape les mistranscriptions Whisper qui auraient
      // survécu jusque dans le draft IA — ex. "ulysse" → "ULIS").
      const finalStructure: CRBOStructure = applyGlossaireToObject(
        applyVocabToObject(rawFinalStructure),
      )

      // ============ Persistance Supabase ============
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setError('Session expirée — votre CRBO n\'a pas pu être sauvegardé.')
        return
      }

      const fd = handoff.formData

      // Bug fix : auto-création/réconciliation patient. Si l'ortho a saisi le
      // patient à la main (sans le sélectionner depuis le carnet), on cherche
      // un patient existant correspondant à user_id + prénom + nom + DDN, et
      // on le crée s'il n'existe pas. Le CRBO est ensuite lié à ce patient_id.
      let patientId = handoff.selectedPatientId || null
      if (!patientId && fd.patient_prenom?.trim() && fd.patient_nom?.trim()) {
        const prenom = fd.patient_prenom.trim()
        const nom = fd.patient_nom.trim()
        const ddn = fd.patient_ddn || null
        try {
          let findQuery = supabase
            .from('patients')
            .select('id')
            .eq('user_id', user.id)
            .eq('prenom', prenom)
            .eq('nom', nom)
          findQuery = ddn ? findQuery.eq('date_naissance', ddn) : findQuery.is('date_naissance', null)
          const { data: existing } = await findQuery.maybeSingle()
          if (existing?.id) {
            patientId = existing.id
          } else {
            const { data: created, error: createErr } = await supabase
              .from('patients')
              .insert({
                user_id: user.id,
                prenom,
                nom,
                date_naissance: ddn,
                classe: fd.patient_classe || null,
                medecin_nom: fd.medecin_nom || null,
                medecin_tel: fd.medecin_tel || null,
              })
              .select('id')
              .single()
            if (createErr) {
              console.warn('Patient non créé (best-effort):', createErr)
            } else if (created?.id) {
              patientId = created.id
            }
          }
        } catch (e) {
          console.warn('Find/create patient failed:', e)
        }
      }

      // ============ INSERT idempotent ============
      // Si un précédent essai a déjà inséré le CRBO (handoff._insertedCrboId
      // posé), on saute purement et simplement l'INSERT pour éviter le doublon
      // sur retry après échec aval (download Word bloqué, etc.). On retente
      // uniquement les étapes restantes : compteurs, download, promotion kanban.
      let insertedCrboId: string | null = handoff._insertedCrboId ?? null
      let isFirstInsert = false

      if (!insertedCrboId) {
        const { data: insertedCrbo, error: insertError } = await supabase
          .from('crbos')
          .insert({
            user_id: user.id,
            patient_id: patientId,
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
            notes_analyse: fd.notes_analyse,
            structure_json: finalStructure,
            comportement_seance: fd.comportement_seance || null,
            duree_seance_minutes: fd.duree_seance_minutes || null,
            severite_globale: finalStructure.severite_globale ?? null,
            bilan_precedent_id: fd.bilan_precedent_id || null,
            // Statut kanban initial après génération : "à rédiger". Sera promu
            // automatiquement à "à relire" juste après le download Word ci-dessous.
            statut: 'a_rediger',
          })
          .select('id')
          .single()

        if (insertError) {
          console.error('Erreur sauvegarde CRBO:', insertError)
          setError('Le CRBO a été généré mais n\'a pas pu être sauvegardé. Téléchargez-le maintenant.')
        }
        insertedCrboId = insertedCrbo?.id ?? null
        isFirstInsert = !!insertedCrboId

        // Persistance du tag d'idempotence dans le handoff. Si le download Word
        // ci-dessous échoue et que l'ortho relance "Générer", on retombera ici
        // avec _insertedCrboId déjà posé → pas de doublon.
        if (insertedCrboId) {
          try {
            const updated: Handoff = { ...handoff, _insertedCrboId: insertedCrboId }
            sessionStorage.setItem(HANDOFF_KEY, JSON.stringify(updated))
            setHandoff(updated)
          } catch (e) {
            console.warn('Handoff idempotence non persisté:', e)
          }
        }
      } else {
        console.log(`[crbo] Retry détecté — INSERT skippé, CRBO ${insertedCrboId} déjà créé.`)
      }

      // Compteurs (best-effort) — UNIQUEMENT au 1er insert, sinon double-comptage
      // sur chaque retry (quota consommé N fois pour un seul CRBO).
      if (isFirstInsert) {
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
      }

      // Son "success" — la synthèse vient d'aboutir, l'ortho a son brouillon.
      // Joué AVANT le download (qui peut prendre 1-2s pour générer le canvas)
      // pour confirmer immédiatement que la partie IA est terminée.
      playSuccessSound()

      // ============ Téléchargement Word ============
      // Animation 3D flip pour ponctuer l'arrivée du document (1500ms).
      playPrintAnimation(1500)
      await downloadCRBOWord({
        formData: fd,
        structure: finalStructure,
        previousStructure: fd.bilan_precedent_structure ?? null,
        previousBilanDate: fd.bilan_precedent_date,
      })
      playSwoosh() // "swoosh" type imprimante quand le Word descend

      // ============ Promotion kanban : a_rediger → a_relire ============
      // Une fois le Word téléchargé, le CRBO entre dans la phase "à relire"
      // par l'ortho. La promotion vers "termine" reste manuelle (drag kanban).
      if (insertedCrboId) {
        const { error: statusErr } = await supabase
          .from('crbos')
          .update({ statut: 'a_relire' })
          .eq('id', insertedCrboId)
          .eq('user_id', user.id)
        if (statusErr) {
          console.warn('Promotion statut a_relire échouée (best-effort):', statusErr)
        }
      }

      // Nettoyage handoff + signale au dashboard d'afficher le bandeau de
      // feedback sur ce CRBO (capture immédiate post-download).
      sessionStorage.removeItem(HANDOFF_KEY)
      if (insertedCrboId) {
        try {
          sessionStorage.setItem('orthoia.feedback-pending', insertedCrboId)
        } catch {}
      }

      // Ouvre la modale de chaînage : propose de démarrer un 2ᵉ bilan pour
      // le même patient (cas typique screening MoCA → BETL approfondi). Si
      // l'ortho répond "Non", on bascule sur le dashboard comme avant.
      const firstTestArr = Array.isArray(fd.test_utilise) ? fd.test_utilise : [fd.test_utilise || '']
      const firstTest = firstTestArr.filter(Boolean).join(', ') || 'ce bilan'
      const patientLabel = [fd.patient_prenom, fd.patient_nom].filter(Boolean).join(' ').trim() || 'ce patient'
      setChainSuggestion({ patientId: patientId || null, patientLabel, firstTest })
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
  // MoCA-only : pas de graphique percentile, pas de légende SEUILS, table
  // simplifiée 3 colonnes (Épreuve / Score / Commentaire) avec sous-rows.
  // Les commentaires sont par ÉPREUVE (et non par domaine) — chaque domaine
  // cognitif MoCA mérite son propre paragraphe clinique.
  const isMoca = (Array.isArray(fd.test_utilise) ? fd.test_utilise : [fd.test_utilise || ''])
    .length === 1 &&
    (Array.isArray(fd.test_utilise) ? fd.test_utilise[0] : fd.test_utilise) === 'MoCA'
  const groups: ChartGroup[] = isMoca ? [] : extracted.domains
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
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="font-bold text-primary-700 dark:text-primary-400">Anamnèse reformulée</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Texte rédigé automatiquement depuis vos notes brutes. Vous pouvez l&apos;éditer librement avant la génération finale.
            </p>
          </div>
          <MicButton
            value={anamneseEdit}
            onChange={setAnamneseEdit}
            onError={(msg) => setError(msg)}
          />
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
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="font-bold text-primary-700 dark:text-primary-400">Motif de consultation reformulé</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              1-2 phrases pro à partir des notes brutes. Éditable.
            </p>
          </div>
          <MicButton
            value={motifEdit}
            onChange={setMotifEdit}
            onError={(msg) => setError(msg)}
          />
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
            Une suggestion clinique est déjà rédigée sous chaque tableau. Validez-la, modifiez-la ou complétez-la avec vos propres observations (fatigue, anxiété, conditions de passation…). Vos ajouts seront automatiquement reformulés en prose professionnelle.
          </p>
        </div>

        {/* Légende des seuils — masquée pour MoCA (screening cognitif :
            pas de zones percentile, le tableau MoCA est dépouillé). */}
        {!isMoca && (
          <div className="flex flex-wrap gap-2 text-xs">
            {SEUILS.map(s => (
              <span key={s.label} className="inline-flex items-center gap-1.5 px-2 py-1 rounded border" style={{ backgroundColor: '#' + s.shading, borderColor: '#' + s.shading, color: s.textColor ? '#' + s.textColor : undefined }}>
                <strong>{s.label}</strong> {s.range}
              </span>
            ))}
          </div>
        )}

        {isMoca ? (
          /* Rendu MoCA dédié : un seul tableau 3 colonnes Épreuve / Score /
             Commentaire avec sous-rows pour les sous-épreuves, et une zone
             d'édition du commentaire PAR épreuve (et non par domaine). */
          extracted.domains.map((d, dIdx) => (
            <div key={dIdx} className="card-modern p-5 space-y-4">
              <h3 className="font-bold text-primary-700 dark:text-primary-400 text-base">
                {d.nom}
              </h3>
              <div className="overflow-x-auto -mx-5 px-5">
                <table className="w-full text-sm">
                  <thead className="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-surface-dark-muted">
                    <tr>
                      <th className="text-left py-2 pr-3">Épreuve</th>
                      <th className="text-center py-2 px-2 w-24">Score</th>
                      <th className="text-left py-2 pl-2">Commentaire</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-surface-dark-muted/50">
                    {d.epreuves.map((e, eIdx) => (
                      <React.Fragment key={eIdx}>
                        <tr className="hover:bg-gray-50 dark:hover:bg-surface-dark-muted/30 bg-emerald-50/30">
                          <td className="py-2 pr-3 font-semibold text-gray-900 dark:text-gray-100">{e.nom}</td>
                          <td className="py-2 px-2 text-center font-mono font-semibold text-gray-800 dark:text-gray-200">{e.score}</td>
                          <td className="py-2 pl-2 align-top">
                            <textarea
                              value={mocaEpreuveComments[e.nom] || ''}
                              onChange={(ev) => setMocaEpreuveComments(prev => ({ ...prev, [e.nom]: ev.target.value }))}
                              rows={5}
                              placeholder={"Commentaire clinique pour ce domaine.\nUne ligne vide puis « **En clair :** … » pour la version patient (langage simple)."}
                              className="w-full px-2 py-1.5 border border-gray-300 dark:border-surface-dark-muted rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-400 text-xs leading-relaxed dark:bg-surface-dark resize-y"
                            />
                          </td>
                        </tr>
                        {(e.sous_epreuves ?? []).map((se, seIdx) => {
                          // Détecte "0/N" pour griser la ligne (sous-item raté)
                          // — feedback visuel léger, pas une étiquette colorée.
                          const m = se.score.match(/^(\d+)\s*\/\s*\d+/)
                          const isZero = !!m && parseInt(m[1], 10) === 0
                          return (
                            <tr key={`se-${eIdx}-${seIdx}`} className={isZero ? 'text-gray-400 dark:text-gray-500' : 'text-gray-700 dark:text-gray-300'}>
                              <td className="py-1.5 pr-3 pl-6 text-xs">
                                <span className="inline-flex items-center gap-2">
                                  <SousItemIcon nom={se.nom} />
                                  <span>• {se.nom}</span>
                                </span>
                              </td>
                              <td className={`py-1.5 px-2 text-center font-mono text-xs ${isZero ? '' : 'font-semibold text-gray-900 dark:text-gray-100'}`}>{se.score}</td>
                              <td className="py-1.5 pl-2 text-xs text-gray-400">—</td>
                            </tr>
                          )
                        })}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-[11px] text-gray-500 italic">
                Le tableau ci-dessus reprend les 7 domaines MoCA décomposés par sous-item. Le commentaire est éditable par domaine.
                Aucun pourcentage, aucune étiquette « Excellent / Fragilité » — la MoCA est un screening, pas un test percentile-based.
              </p>
            </div>
          ))
        ) : (
          extracted.domains.map((d, dIdx) => (
            <div key={dIdx} className="card-modern p-5 space-y-3">
              <h3 className="font-bold text-primary-700 dark:text-primary-400 text-base">
                {d.nom}
              </h3>
              <DomainTable domain={d} />
              <div className="pt-2 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">
                    <MessageSquare size={14} className="text-primary-600" />
                    Commentaire clinique du domaine
                    <span className="text-xs font-normal text-gray-400">— pré-rempli automatiquement, modifiable</span>
                  </label>
                  <MicButton
                    value={orthoComments[d.nom] || ''}
                    onChange={(v) => handleCommentChange(d.nom, v)}
                    onError={(msg) => setError(msg)}
                  />
                </div>
                <textarea
                  value={orthoComments[d.nom] || ''}
                  onChange={(e) => handleCommentChange(d.nom, e.target.value)}
                  rows={3}
                  placeholder="Ex: enfant fatigué sur cette épreuve, encouragements nécessaires, score sous-estimé car distracteurs visuels…"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-surface-dark-muted rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm dark:bg-surface-dark"
                />
              </div>
            </div>
          ))
        )}
      </section>

      {/* CTA finale — déclenche phase 2 + sauvegarde + téléchargement */}
      <div className="sticky bottom-4 z-20">
        <div className="card-lifted bg-white dark:bg-surface-dark p-4 flex items-center justify-between flex-wrap gap-3 border-2 border-primary-200">
          <div>
            <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
              Tout est bon ?
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Le diagnostic et les recommandations vont être rédigés automatiquement en s&apos;appuyant sur vos commentaires.
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

      {/* Overlay streaming : affiché pendant la génération de la synthèse.
          Remplace l'attente passive (spinner 30-60s) par un visuel actif
          où l'ortho voit le diagnostic / recommandations se rédiger en
          direct, avec highlight des termes cliniques. */}
      {generating && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.55)',
            backdropFilter: 'blur(4px)',
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
            animation: 'fade-in-overlay 220ms ease',
          }}
        >
          <StreamingCRBO
            accumulated={streamingBuffer}
            active={generating}
            isMoca={(Array.isArray(fd.test_utilise) ? fd.test_utilise : [fd.test_utilise || '']).length === 1
              && (Array.isArray(fd.test_utilise) ? fd.test_utilise[0] : fd.test_utilise) === 'MoCA'}
          />
          <style jsx>{`
            @keyframes fade-in-overlay {
              from { opacity: 0; }
              to { opacity: 1; }
            }
          `}</style>
        </div>
      )}

      {/* Modale de chaînage post-CRBO — propose un second bilan pour le même
          patient. Particulièrement utile après un MoCA (screening) qui
          nécessite presque toujours un bilan langagier approfondi (BETL,
          Examath, etc.). L'ortho repart du formulaire CRBO avec patient
          pré-sélectionné, choisit le nouveau test à l'étape 4. */}
      {chainSuggestion && (
        <div
          className="fixed inset-0 z-[110] flex items-center justify-center p-4"
          style={{ background: 'rgba(15, 23, 42, 0.55)', backdropFilter: 'blur(4px)' }}
        >
          <div className="bg-white dark:bg-surface-dark rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                <Sparkles size={20} className="text-emerald-700" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-base">
                  CRBO téléchargé.
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                  Le bilan <strong>{chainSuggestion.firstTest}</strong> pour <strong>{chainSuggestion.patientLabel}</strong> est enregistré.
                  Souhaitez-vous enchaîner un second bilan pour ce patient maintenant&nbsp;?
                </p>
              </div>
            </div>
            <p className="text-xs text-gray-500 bg-gray-50 dark:bg-surface-dark-muted rounded-md px-3 py-2">
              Le patient sera pré-sélectionné. Vous choisirez le second test à l&apos;étape&nbsp;4.
              Cas typique&nbsp;: screening MoCA → bilan langagier approfondi (BETL, EVALEO…).
            </p>
            <div className="flex flex-col sm:flex-row gap-2 justify-end">
              <button
                type="button"
                onClick={() => {
                  setChainSuggestion(null)
                  router.push('/dashboard')
                }}
                className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Retour au tableau de bord
              </button>
              <button
                type="button"
                onClick={() => {
                  const url = chainSuggestion.patientId
                    ? `/dashboard/nouveau-crbo?patient=${encodeURIComponent(chainSuggestion.patientId)}`
                    : '/dashboard/nouveau-crbo'
                  setChainSuggestion(null)
                  router.push(url)
                }}
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold inline-flex items-center justify-center gap-1.5"
              >
                <Sparkles size={14} />
                Enchaîner un autre bilan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
