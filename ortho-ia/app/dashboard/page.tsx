'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { 
  Plus, 
  FileText, 
  Clock, 
  CheckCircle, 
  Eye,
  GripVertical,
  Calendar,
  User,
  Trash2,
  Loader2
} from 'lucide-react'

type CRBOStatus = 'a_rediger' | 'en_cours' | 'a_relire' | 'termine'

interface CRBO {
  id: string
  patient_prenom: string
  patient_nom: string
  patient_classe: string
  test_utilise: string
  bilan_date: string
  bilan_type: string
  statut: CRBOStatus
  created_at: string
  severite_globale?: 'Léger' | 'Modéré' | 'Sévère' | null
}

/** Couleurs de badge sévérité pour les cartes Kanban. */
const SEVERITE_BADGE: Record<string, { bg: string; text: string; dot: string }> = {
  'Léger':   { bg: 'bg-green-50 border-green-200', text: 'text-green-800', dot: 'bg-green-500' },
  'Modéré':  { bg: 'bg-amber-50 border-amber-200', text: 'text-amber-800', dot: 'bg-amber-500' },
  'Sévère':  { bg: 'bg-red-50 border-red-200',     text: 'text-red-800',   dot: 'bg-red-500' },
}

interface KanbanColumn {
  id: CRBOStatus
  title: string
  icon: React.ReactNode
  color: string
  bgColor: string
}

const columns: KanbanColumn[] = [
  { 
    id: 'a_rediger', 
    title: 'À rédiger', 
    icon: <FileText size={18} />, 
    color: 'text-blue-600',
    bgColor: 'bg-blue-50 border-blue-200'
  },
  { 
    id: 'en_cours', 
    title: 'En cours', 
    icon: <Clock size={18} />, 
    color: 'text-orange-600',
    bgColor: 'bg-orange-50 border-orange-200'
  },
  { 
    id: 'a_relire', 
    title: 'À relire', 
    icon: <Eye size={18} />, 
    color: 'text-purple-600',
    bgColor: 'bg-purple-50 border-purple-200'
  },
  { 
    id: 'termine', 
    title: 'Terminés', 
    icon: <CheckCircle size={18} />, 
    color: 'text-green-600',
    bgColor: 'bg-green-50 border-green-200'
  },
]

export default function DashboardPage() {
  const router = useRouter()
  const [crbos, setCrbos] = useState<CRBO[]>([])
  const [loading, setLoading] = useState(true)
  const [userName, setUserName] = useState('')
  const [draggedCard, setDraggedCard] = useState<string | null>(null)
  const [stats, setStats] = useState({
    total: 0,
    thisMonth: 0,
    timeSaved: 0
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      router.push('/auth/login')
      return
    }

    // Récupérer le profil
    const { data: profile } = await supabase
      .from('profiles')
      .select('prenom')
      .eq('id', user.id)
      .single()

    if (profile) {
      setUserName(profile.prenom || 'there')
    }

    // Récupérer les CRBO
    const { data: crbosData } = await supabase
      .from('crbos')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (crbosData) {
      // Ajouter statut par défaut si non existant
      const crbosWithStatus = crbosData.map(crbo => ({
        ...crbo,
        statut: crbo.statut || 'termine'
      }))
      setCrbos(crbosWithStatus)

      // Calculer les stats
      const now = new Date()
      const thisMonth = crbosWithStatus.filter(c => {
        const created = new Date(c.created_at)
        return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear()
      })

      setStats({
        total: crbosWithStatus.length,
        thisMonth: thisMonth.length,
        timeSaved: crbosWithStatus.length * 45 // 45 min par CRBO
      })
    }

    setLoading(false)
  }

  const handleDragStart = (e: React.DragEvent, crboId: string) => {
    setDraggedCard(crboId)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = async (e: React.DragEvent, newStatus: CRBOStatus) => {
    e.preventDefault()
    if (!draggedCard) return

    const supabase = createClient()
    const cardId = draggedCard
    setDraggedCard(null)

    // Capture l'ancien statut pour rollback si DB échoue
    const previousCrbo = crbos.find(c => c.id === cardId)
    if (!previousCrbo || previousCrbo.statut === newStatus) return
    const previousStatus = previousCrbo.statut

    // Optimistic update
    setCrbos(prev => prev.map(crbo =>
      crbo.id === cardId ? { ...crbo, statut: newStatus } : crbo
    ))

    // On inclut user_id ET on vérifie count > 0 (RLS peut masquer l'erreur)
    const { data: { user } } = await supabase.auth.getUser()
    const rollback = () => {
      setCrbos(prev => prev.map(crbo =>
        crbo.id === cardId ? { ...crbo, statut: previousStatus } : crbo
      ))
    }
    if (!user) {
      rollback()
      alert('Session expirée — reconnectez-vous.')
      return
    }

    const { data: updated, error } = await supabase
      .from('crbos')
      .update({ statut: newStatus })
      .eq('id', cardId)
      .eq('user_id', user.id)
      .select('id')

    if (error || !updated || updated.length === 0) {
      console.error('Erreur mise à jour statut Kanban:', error)
      rollback()
      alert("Le changement de statut n'a pas pu être enregistré. Réessayez.")
    }
  }

  const handleDelete = async (crboId: string) => {
    if (!confirm('Supprimer ce CRBO ?')) return

    const supabase = createClient()
    await supabase.from('crbos').delete().eq('id', crboId)
    setCrbos(prev => prev.filter(c => c.id !== crboId))
  }

  const getCRBOsByStatus = (status: CRBOStatus) => {
    return crbos.filter(c => c.statut === status)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="animate-spin h-8 w-8 text-green-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Bonjour {userName} 👋
          </h1>
          <p className="text-gray-500 mt-1">
            Voici vos bilans en cours
          </p>
        </div>
        <Link
          href="/dashboard/nouveau-crbo"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium shadow-sm"
        >
          <Plus size={20} />
          Nouveau CRBO
        </Link>
      </div>

      {/* Stats rapides */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Total CRBO</p>
          <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Ce mois</p>
          <p className="text-2xl font-bold text-gray-900">{stats.thisMonth}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">À rédiger</p>
          <p className="text-2xl font-bold text-blue-600">{getCRBOsByStatus('a_rediger').length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Temps gagné</p>
          <p className="text-2xl font-bold text-green-600">{Math.floor(stats.timeSaved / 60)}h</p>
        </div>
      </div>

      {/* Onboarding — visible uniquement si aucun CRBO */}
      {stats.total === 0 && (
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-6 sm:p-8">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-white shadow-sm flex items-center justify-center shrink-0">
              <FileText className="text-green-600" size={24} />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-gray-900">Bienvenue sur Ortho.ia 👋</h3>
              <p className="mt-2 text-gray-700">
                Vous êtes à <strong>3 étapes</strong> de votre premier CRBO :
              </p>
              <ol className="mt-4 space-y-2 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-green-600 text-white text-xs font-bold shrink-0">1</span>
                  <span>
                    <Link href="/dashboard/profil" className="text-green-700 font-semibold underline">
                      Complétez votre profil
                    </Link>{' '}
                    (adresse, téléphone, email) — ces infos seront pré-remplies dans chaque CRBO.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-green-600 text-white text-xs font-bold shrink-0">2</span>
                  <span>
                    <Link href="/dashboard/patients" className="text-green-700 font-semibold underline">
                      Ajoutez votre premier patient
                    </Link>{' '}
                    dans le carnet — ou créez-le directement au lancement du CRBO.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-green-600 text-white text-xs font-bold shrink-0">3</span>
                  <span>
                    <Link href="/dashboard/nouveau-crbo" className="text-green-700 font-semibold underline">
                      Créez votre premier CRBO
                    </Link>{' '}
                    — 5 étapes guidées, import PDF automatique, génération IA en 20 sec.
                  </span>
                </li>
              </ol>
              <div className="mt-6">
                <Link
                  href="/dashboard/nouveau-crbo"
                  className="inline-flex items-center gap-2 bg-green-600 text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-green-700 transition"
                >
                  <Plus size={18} />
                  Démarrer maintenant
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {columns.map(column => (
          <div
            key={column.id}
            className={`rounded-xl border-2 ${column.bgColor} min-h-[400px]`}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, column.id)}
          >
            {/* Column Header */}
            <div className={`p-3 border-b border-gray-200 flex items-center gap-2 ${column.color}`}>
              {column.icon}
              <span className="font-semibold">{column.title}</span>
              <span className="ml-auto bg-white px-2 py-0.5 rounded-full text-xs font-medium">
                {getCRBOsByStatus(column.id).length}
              </span>
            </div>

            {/* Cards */}
            <div className="p-2 space-y-2">
              {getCRBOsByStatus(column.id).map(crbo => (
                <div
                  key={crbo.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, crbo.id)}
                  className={`bg-white rounded-lg border border-gray-200 p-3 cursor-grab active:cursor-grabbing hover:shadow-md transition group ${
                    draggedCard === crbo.id ? 'opacity-50' : ''
                  }`}
                >
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <GripVertical size={14} className="text-gray-300 group-hover:text-gray-400" />
                      <div>
                        <p className="font-medium text-gray-900 text-sm">
                          {crbo.patient_prenom} {crbo.patient_nom}
                        </p>
                        <p className="text-xs text-gray-500">{crbo.patient_classe}</p>
                      </div>
                    </div>
                    
                    {/* Actions */}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                      <Link
                        href={`/dashboard/historique/${crbo.id}`}
                        className="p-1 hover:bg-gray-100 rounded"
                        title="Voir"
                      >
                        <Eye size={14} className="text-gray-500" />
                      </Link>
                      <button
                        onClick={() => handleDelete(crbo.id)}
                        className="p-1 hover:bg-red-50 rounded"
                        title="Supprimer"
                      >
                        <Trash2 size={14} className="text-red-500" />
                      </button>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="mt-2 space-y-1">
                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                      <FileText size={12} />
                      <span>{crbo.test_utilise || 'Test non défini'}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                      <Calendar size={12} />
                      <span>{new Date(crbo.bilan_date || crbo.created_at).toLocaleDateString('fr-FR')}</span>
                    </div>
                  </div>

                  {/* Badges type + sévérité */}
                  <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                      crbo.bilan_type === 'initial'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-purple-100 text-purple-700'
                    }`}>
                      {crbo.bilan_type === 'initial' ? 'Initial' : 'Renouvellement'}
                    </span>
                    {crbo.severite_globale && SEVERITE_BADGE[crbo.severite_globale] && (
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border text-xs font-medium ${SEVERITE_BADGE[crbo.severite_globale].bg} ${SEVERITE_BADGE[crbo.severite_globale].text}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${SEVERITE_BADGE[crbo.severite_globale].dot}`} />
                        {crbo.severite_globale}
                      </span>
                    )}
                  </div>
                </div>
              ))}

              {/* Empty state */}
              {getCRBOsByStatus(column.id).length === 0 && (
                <div className="text-center py-8 text-gray-400">
                  <p className="text-sm">Aucun bilan</p>
                </div>
              )}

              {/* Add button for first column */}
              {column.id === 'a_rediger' && (
                <Link
                  href="/dashboard/nouveau-crbo"
                  className="block w-full p-3 border-2 border-dashed border-gray-300 rounded-lg text-center text-gray-500 hover:border-green-500 hover:text-green-600 transition"
                >
                  <Plus size={20} className="mx-auto mb-1" />
                  <span className="text-sm">Ajouter un bilan</span>
                </Link>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link
          href="/dashboard/patients"
          className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition group"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center group-hover:bg-indigo-200 transition">
              <User className="text-indigo-600" size={24} />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Carnet patients</h3>
              <p className="text-sm text-gray-500">Gérer vos patients et leur historique</p>
            </div>
          </div>
        </Link>

        <Link
          href="/dashboard/historique"
          className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition group"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center group-hover:bg-emerald-200 transition">
              <FileText className="text-emerald-600" size={24} />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Historique CRBO</h3>
              <p className="text-sm text-gray-500">Voir tous vos comptes rendus</p>
            </div>
          </div>
        </Link>
      </div>
    </div>
  )
}
