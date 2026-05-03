'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { Loader2, Clock, ShieldCheck, AlertTriangle } from 'lucide-react'
import type { CRBOStructure } from '@/lib/prompts'
import CRBOStructuredPreview from '@/components/CRBOStructuredPreview'
import { Logo } from '@/components/ui'

/**
 * Vue publique d'un CRBO partagé via lien temporaire.
 * Accessible sans authentification. Le lien expire après 24h.
 */
export default function SharedCRBOPage() {
  const params = useParams()
  const token = params.token as string

  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<{
    crbo_genere: string
    structure_json: CRBOStructure | null
    patient_prenom: string
    patient_nom: string
    bilan_date: string
    expires_at: string
  } | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetch = async () => {
      try {
        const supabase = createClient()
        const { data, error } = await supabase.rpc('get_shared_crbo', { share_token: token })
        if (error) throw error
        if (!data || data.length === 0) {
          setError("Ce lien de partage n'existe pas ou a expiré (validité 24h).")
          setLoading(false)
          return
        }
        setData(data[0])
      } catch (err: any) {
        setError('Erreur lors du chargement du partage.')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetch()
  }, [token])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-surface-dark flex items-center justify-center">
        <Loader2 className="animate-spin text-primary-600" size={32} />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-surface-dark flex items-center justify-center px-4">
        <div className="card-lifted max-w-md w-full p-8 text-center">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mb-4">
            <AlertTriangle className="text-amber-600" size={24} />
          </div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Lien indisponible</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            {error || 'Ce lien de partage est invalide.'}
          </p>
          <Link href="/" className="btn-primary mt-6">
            Retour à l&apos;accueil
          </Link>
        </div>
      </div>
    )
  }

  const expiresIn = new Date(data.expires_at).getTime() - Date.now()
  const hoursLeft = Math.max(0, Math.floor(expiresIn / (1000 * 60 * 60)))

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-surface-dark pb-12">
      {/* Header public */}
      <header className="bg-white dark:bg-surface-dark-subtle border-b border-gray-200 dark:border-surface-dark-muted py-4 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between flex-wrap gap-3">
          <Link href="/" aria-label="Ortho.ia — accueil" className="inline-block">
            <Logo variant="light" height={32} withoutTagline />
          </Link>
          <div className="flex items-center gap-2 text-xs text-amber-700 dark:text-amber-400">
            <Clock size={14} />
            <span>
              Lien valide encore <strong>{hoursLeft}h</strong>
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Intro partage */}
        <div className="card-lifted p-5 bg-gradient-to-br from-primary-50 to-emerald-50 dark:from-primary-900/20 dark:to-emerald-900/20 border-primary-200 dark:border-primary-800/40">
          <div className="flex items-start gap-3">
            <ShieldCheck className="text-primary-600 dark:text-primary-400 mt-0.5 shrink-0" size={20} />
            <div>
              <h1 className="font-bold text-primary-900 dark:text-primary-200">
                Compte rendu de {data.patient_prenom} {data.patient_nom}
              </h1>
              <p className="text-sm text-primary-700 dark:text-primary-300 mt-0.5">
                Bilan du {new Date(data.bilan_date).toLocaleDateString('fr-FR')} · Lien en lecture seule, valide 24h
              </p>
            </div>
          </div>
        </div>

        {/* Preview structurée ou fallback texte */}
        {data.structure_json ? (
          <CRBOStructuredPreview
            structure={data.structure_json}
            onDownload={() => {
              // Pas de download depuis le partage (l'ortho qui partage télécharge son propre Word)
              alert('Téléchargement disponible depuis le compte de l\'orthophoniste uniquement.')
            }}
          />
        ) : (
          <div className="card-lifted p-6">
            <pre className="whitespace-pre-wrap font-sans text-sm text-gray-800 dark:text-gray-200 leading-relaxed">
              {data.crbo_genere}
            </pre>
          </div>
        )}

        <p className="text-center text-xs text-gray-500 dark:text-gray-500">
          Ce CRBO a été généré et partagé via Ortho.ia. Les données sont chiffrées en transit et le
          lien expire automatiquement.
        </p>
      </main>
    </div>
  )
}
