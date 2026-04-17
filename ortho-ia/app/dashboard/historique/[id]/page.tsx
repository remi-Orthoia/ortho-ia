'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { 
  ArrowLeft, 
  Download, 
  Loader2, 
  Calendar, 
  User,
  FileText,
  Edit,
  Trash2,
  CheckCircle,
  Clock,
  Eye
} from 'lucide-react'

interface CRBO {
  id: string
  patient_prenom: string
  patient_nom: string
  patient_classe: string
  patient_ddn: string
  test_utilise: string
  bilan_date: string
  bilan_type: string
  crbo_text: string
  statut: string
  created_at: string
}

const statusConfig = {
  a_rediger: { label: 'À rédiger', color: 'bg-blue-100 text-blue-700', icon: FileText },
  en_cours: { label: 'En cours', color: 'bg-orange-100 text-orange-700', icon: Clock },
  a_relire: { label: 'À relire', color: 'bg-purple-100 text-purple-700', icon: Eye },
  termine: { label: 'Terminé', color: 'bg-green-100 text-green-700', icon: CheckCircle },
}

export default function CRBODetailPage() {
  const params = useParams()
  const router = useRouter()
  const [crbo, setCrbo] = useState<CRBO | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchCRBO = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/auth/login')
        return
      }

      const { data, error } = await supabase
        .from('crbos')
        .select('*')
        .eq('id', params.id)
        .eq('user_id', user.id) // RLS check
        .single()

      if (error || !data) {
        setError('CRBO non trouvé')
      } else {
        setCrbo(data)
      }

      setLoading(false)
    }

    fetchCRBO()
  }, [params.id, router])

  const handleDownload = async () => {
    if (!crbo) return

    // Simple text download for now
    const blob = new Blob([crbo.crbo_text], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `CRBO_${crbo.patient_prenom}_${crbo.patient_nom}_${crbo.bilan_date}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleDelete = async () => {
    if (!crbo || !confirm('Supprimer ce CRBO ? Cette action est irréversible.')) return

    const supabase = createClient()
    await supabase.from('crbos').delete().eq('id', crbo.id)
    router.push('/dashboard/historique')
  }

  const handleStatusChange = async (newStatus: string) => {
    if (!crbo) return

    const supabase = createClient()
    await supabase
      .from('crbos')
      .update({ statut: newStatus })
      .eq('id', crbo.id)

    setCrbo({ ...crbo, statut: newStatus })
  }

  const calculateAge = (ddn: string, bilanDate: string) => {
    if (!ddn) return ''
    const birth = new Date(ddn)
    const bilan = new Date(bilanDate)
    let years = bilan.getFullYear() - birth.getFullYear()
    let months = bilan.getMonth() - birth.getMonth()
    if (months < 0) {
      years--
      months += 12
    }
    return `${years} ans et ${months} mois`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="animate-spin h-8 w-8 text-green-600" />
      </div>
    )
  }

  if (error || !crbo) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 mb-4">{error || 'CRBO non trouvé'}</p>
        <Link href="/dashboard/historique" className="text-green-600 hover:underline">
          ← Retour à l'historique
        </Link>
      </div>
    )
  }

  const status = statusConfig[crbo.statut as keyof typeof statusConfig] || statusConfig.termine
  const StatusIcon = status.icon

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link 
            href="/dashboard/historique"
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {crbo.patient_prenom} {crbo.patient_nom}
            </h1>
            <p className="text-gray-500">
              {calculateAge(crbo.patient_ddn, crbo.bilan_date)} • {crbo.patient_classe}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleDownload}
            className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
          >
            <Download size={18} />
            Télécharger
          </button>
          <button
            onClick={handleDelete}
            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
            title="Supprimer"
          >
            <Trash2 size={20} />
          </button>
        </div>
      </div>

      {/* Info cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
            <Calendar size={16} />
            Date du bilan
          </div>
          <p className="font-semibold">{new Date(crbo.bilan_date).toLocaleDateString('fr-FR')}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
            <FileText size={16} />
            Type
          </div>
          <p className="font-semibold capitalize">{crbo.bilan_type}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
            <User size={16} />
            Test
          </div>
          <p className="font-semibold text-sm">{crbo.test_utilise || 'Non spécifié'}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
            <StatusIcon size={16} />
            Statut
          </div>
          <select
            value={crbo.statut}
            onChange={(e) => handleStatusChange(e.target.value)}
            className={`px-2 py-1 rounded-full text-sm font-medium ${status.color} border-0 cursor-pointer`}
          >
            <option value="a_rediger">À rédiger</option>
            <option value="en_cours">En cours</option>
            <option value="a_relire">À relire</option>
            <option value="termine">Terminé</option>
          </select>
        </div>
      </div>

      {/* CRBO Content */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="border-b border-gray-200 px-6 py-4">
          <h2 className="font-semibold text-gray-900">Compte rendu de bilan orthophonique</h2>
        </div>
        <div className="p-6">
          <div className="prose prose-sm max-w-none">
            <pre className="whitespace-pre-wrap font-sans text-gray-700 leading-relaxed">
              {crbo.crbo_text}
            </pre>
          </div>
        </div>
      </div>
    </div>
  )
}
