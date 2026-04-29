'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { ArrowLeft, FileText, Calendar, TrendingUp, Loader2, Plus, Download } from 'lucide-react'
import type { CRBOStructure } from '@/lib/prompts'
import { SEUILS } from '@/lib/word-export'

interface Patient {
  id: string
  prenom: string
  nom: string
  date_naissance: string | null
  classe: string | null
  ecole: string | null
  medecin_nom: string | null
  anamnese_base: string | null
  notes: string | null
}

interface PatientCRBO {
  id: string
  bilan_date: string
  bilan_type: string
  test_utilise: string
  severite_globale: 'Léger' | 'Modéré' | 'Sévère' | null
  statut: string
  structure_json: CRBOStructure | null
  crbo_genere: string | null
}

const SEVERITE_BADGE: Record<string, string> = {
  'Léger':   'bg-green-100 text-green-800',
  'Modéré':  'bg-amber-100 text-amber-800',
  'Sévère':  'bg-red-100 text-red-800',
}

/**
 * Page détail patient avec timeline d'évolution des scores.
 * Affiche un graphique multi-courbes : une couleur par domaine, une ligne
 * par percentile moyen du domaine à chaque bilan (axe X = bilan_date).
 */
export default function PatientDetailPage() {
  const params = useParams()
  const router = useRouter()
  const patientId = params.id as string

  const [patient, setPatient] = useState<Patient | null>(null)
  const [crbos, setCrbos] = useState<PatientCRBO[]>([])
  const [loading, setLoading] = useState(true)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const fetch = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }

      const [pRes, cRes] = await Promise.all([
        supabase.from('patients').select('*').eq('id', patientId).eq('user_id', user.id).single(),
        supabase
          .from('crbos')
          .select('id, bilan_date, bilan_type, test_utilise, severite_globale, statut, structure_json, crbo_genere')
          .eq('patient_id', patientId)
          .eq('user_id', user.id)
          .order('bilan_date', { ascending: true }),
      ])

      if (pRes.data) setPatient(pRes.data)
      if (cRes.data) setCrbos(cRes.data as any)
      setLoading(false)
    }
    fetch()
  }, [patientId, router])

  // Extraction des séries par domaine (percentile moyen par bilan)
  const timelineData = useMemo(() => {
    const domainSeries = new Map<string, Array<{ date: string; value: number }>>()
    for (const c of crbos) {
      const s = c.structure_json
      if (!s || !s.domains) continue
      for (const d of s.domains) {
        const values = d.epreuves.map((e) => e.percentile_value).filter((v) => typeof v === 'number')
        if (values.length === 0) continue
        const avg = values.reduce((a, b) => a + b, 0) / values.length
        if (!domainSeries.has(d.nom)) domainSeries.set(d.nom, [])
        domainSeries.get(d.nom)!.push({ date: c.bilan_date, value: avg })
      }
    }
    return domainSeries
  }, [crbos])

  // Render chart
  useEffect(() => {
    if (!canvasRef.current || timelineData.size === 0) return
    const canvas = canvasRef.current
    const W = canvas.width
    const H = canvas.height
    const ctx = canvas.getContext('2d')!
    ctx.fillStyle = '#FFFFFF'
    ctx.fillRect(0, 0, W, H)

    const padLeft = 60, padRight = 140, padTop = 40, padBottom = 70
    const chartW = W - padLeft - padRight
    const chartH = H - padTop - padBottom

    // Dates axis : union de toutes les dates
    const allDates = Array.from(new Set(crbos.map(c => c.bilan_date))).sort()
    if (allDates.length < 2) {
      ctx.fillStyle = '#666'
      ctx.font = '14px Calibri, sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText("Au moins 2 bilans sont nécessaires pour tracer une évolution.", W / 2, H / 2)
      return
    }

    // Grille Y (percentiles 0-100)
    ctx.strokeStyle = '#E0E0E0'
    ctx.fillStyle = '#666'
    ctx.font = '11px Calibri, sans-serif'
    ctx.textAlign = 'right'
    for (const tick of [0, 25, 50, 75, 100]) {
      const y = padTop + chartH - (tick / 100) * chartH
      ctx.beginPath(); ctx.moveTo(padLeft, y); ctx.lineTo(padLeft + chartW, y); ctx.stroke()
      ctx.fillText(`P${tick}`, padLeft - 6, y + 4)
    }

    // Seuil P25 (ligne verte)
    const yP25 = padTop + chartH - (25 / 100) * chartH
    ctx.strokeStyle = '#4CAF50'
    ctx.setLineDash([4, 3])
    ctx.beginPath(); ctx.moveTo(padLeft, yP25); ctx.lineTo(padLeft + chartW, yP25); ctx.stroke()
    ctx.setLineDash([])

    // X axis : positions des dates
    const xForDate = (d: string) => {
      const idx = allDates.indexOf(d)
      if (allDates.length === 1) return padLeft + chartW / 2
      return padLeft + (idx / (allDates.length - 1)) * chartW
    }

    // Labels X
    ctx.fillStyle = '#333'
    ctx.font = '11px Calibri, sans-serif'
    ctx.textAlign = 'center'
    for (const d of allDates) {
      const x = xForDate(d)
      const label = new Date(d).toLocaleDateString('fr-FR', { month: '2-digit', year: '2-digit' })
      ctx.save()
      ctx.translate(x, padTop + chartH + 18)
      ctx.fillText(label, 0, 0)
      ctx.restore()
    }

    // Palette domaines
    const PALETTE = ['#2E7D32', '#1565C0', '#6A1B9A', '#E65100', '#AD1457', '#00695C', '#4E342E']
    let colorIdx = 0
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    for (const [domain, series] of Array.from(timelineData.entries())) {
      const color = PALETTE[colorIdx % PALETTE.length]
      colorIdx++
      ctx.strokeStyle = color
      ctx.fillStyle = color
      ctx.lineWidth = 2
      // ligne
      ctx.beginPath()
      series.forEach((point, i) => {
        const x = xForDate(point.date)
        const y = padTop + chartH - (point.value / 100) * chartH
        if (i === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      })
      ctx.stroke()
      // points
      for (const p of series) {
        const x = xForDate(p.date)
        const y = padTop + chartH - (p.value / 100) * chartH
        ctx.beginPath(); ctx.arc(x, y, 4, 0, Math.PI * 2); ctx.fill()
      }
    }

    // Légende à droite
    ctx.textAlign = 'left'
    ctx.font = '11px Calibri, sans-serif'
    colorIdx = 0
    let legendY = padTop + 10
    for (const domain of Array.from(timelineData.keys())) {
      const color = PALETTE[colorIdx % PALETTE.length]
      colorIdx++
      ctx.fillStyle = color
      ctx.fillRect(padLeft + chartW + 12, legendY - 8, 12, 12)
      ctx.fillStyle = '#333'
      const label = domain.length > 22 ? domain.slice(0, 21) + '…' : domain
      ctx.fillText(label, padLeft + chartW + 28, legendY)
      legendY += 20
    }

    // Titre
    ctx.fillStyle = '#2E7D32'
    ctx.font = 'bold 14px Calibri, sans-serif'
    ctx.textAlign = 'left'
    ctx.fillText('Évolution des percentiles moyens par domaine', 20, 24)
  }, [timelineData, crbos])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="animate-spin text-green-600" size={32} />
      </div>
    )
  }

  if (!patient) {
    return (
      <div className="text-center py-16 text-gray-500">
        Patient introuvable.
      </div>
    )
  }

  const age = patient.date_naissance
    ? (() => {
        const d = new Date(patient.date_naissance)
        const now = new Date()
        let y = now.getFullYear() - d.getFullYear()
        let m = now.getMonth() - d.getMonth()
        if (m < 0) { y -= 1; m += 12 }
        return `${y} ans ${m} m`
      })()
    : '—'

  return (
    <div className="space-y-6">
      <Link href="/dashboard/patients" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900">
        <ArrowLeft size={16} />
        <span className="text-sm">Retour aux patients</span>
      </Link>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {patient.prenom} {patient.nom}
            </h1>
            <p className="mt-1 text-gray-600">
              {age} · {patient.classe || 'classe non renseignée'}
              {patient.ecole && ` · ${patient.ecole}`}
            </p>
            {patient.medecin_nom && (
              <p className="mt-1 text-sm text-gray-500">Médecin : {patient.medecin_nom}</p>
            )}
          </div>
          <Link
            href={`/dashboard/nouveau-crbo?patient=${patient.id}`}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition"
          >
            <Plus size={18} />
            Nouveau CRBO
          </Link>
        </div>
      </div>

      {/* Timeline visuelle */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="text-green-600" size={20} />
          <h2 className="text-lg font-semibold text-gray-900">Évolution des bilans</h2>
          <span className="ml-auto text-sm text-gray-500">{crbos.length} bilan(s)</span>
        </div>
        {crbos.length < 1 ? (
          <p className="text-sm text-gray-500 text-center py-8">Aucun bilan pour ce patient.</p>
        ) : (
          <div className="overflow-x-auto">
            <canvas ref={canvasRef} width={900} height={400} className="w-full max-w-full" />
          </div>
        )}
        <div className="mt-4 flex flex-wrap gap-2 text-xs">
          {SEUILS.map(s => (
            <span key={s.label} className="inline-flex items-center gap-1 px-2 py-1 rounded border" style={{ backgroundColor: '#' + s.shading, borderColor: '#' + s.shading, color: s.textColor ? '#' + s.textColor : undefined }}>
              <strong>{s.label}</strong> {s.range}
            </span>
          ))}
        </div>
      </div>

      {/* Liste chronologique des bilans */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Bilans chronologiques</h2>
        {crbos.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-8">Aucun bilan enregistré.</p>
        ) : (
          <div className="space-y-3">
            {crbos.slice().reverse().map(c => (
              <Link
                key={c.id}
                href={`/dashboard/historique/${c.id}`}
                className="flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg transition"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                    <Calendar size={18} className="text-green-700" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      Bilan {c.bilan_type} — {new Date(c.bilan_date).toLocaleDateString('fr-FR')}
                    </p>
                    <p className="text-sm text-gray-500">
                      {c.test_utilise || 'Tests non renseignés'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {c.severite_globale && (
                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${SEVERITE_BADGE[c.severite_globale]}`}>
                      {c.severite_globale}
                    </span>
                  )}
                  <span className="text-xs text-gray-400">→</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
