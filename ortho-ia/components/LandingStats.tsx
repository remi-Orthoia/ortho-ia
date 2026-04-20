'use client'

import { useEffect, useState } from 'react'
import { FileText, Sparkles, Clock } from 'lucide-react'
import AnimatedCounter from './AnimatedCounter'

interface Stats {
  this_month: number
  total: number
}

/**
 * Bloc de stats publiques sur la landing — CRBO générés ce mois et lifetime.
 * Fetch /api/stats (cache 5 min). Dégrade silencieusement si erreur.
 * Animation compteur déclenchée quand le bloc entre dans le viewport.
 */
export default function LandingStats() {
  const [stats, setStats] = useState<Stats | null>(null)

  useEffect(() => {
    fetch('/api/stats', { cache: 'force-cache' })
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setStats(data) })
      .catch(() => { /* ignore */ })
  }, [])

  // Masqué tant qu'on n'a pas de données significatives (< 3 CRBO = trop peu pour se montrer)
  if (!stats || stats.total < 3) return null

  const hoursSaved = Math.round(stats.total * 0.75) // 45 min = 0.75h par CRBO

  return (
    <div className="mt-14 grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto">
      <StatCard
        icon={<Sparkles className="text-primary-600" size={20} />}
        value={stats.this_month}
        label="CRBO générés ce mois"
      />
      <StatCard
        icon={<FileText className="text-primary-600" size={20} />}
        value={stats.total}
        label="CRBO générés au total"
      />
      <StatCard
        icon={<Clock className="text-primary-600" size={20} />}
        value={hoursSaved}
        suffix=" h"
        label="gagnées par les orthophonistes"
      />
    </div>
  )
}

function StatCard({
  icon,
  value,
  suffix = '',
  label,
}: {
  icon: React.ReactNode
  value: number
  suffix?: string
  label: string
}) {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-5 text-center shadow-card hover:shadow-card-hover transition-all">
      <div className="w-10 h-10 rounded-xl bg-primary-50 mx-auto flex items-center justify-center mb-3">
        {icon}
      </div>
      <p className="text-3xl font-bold text-gray-900">
        <AnimatedCounter target={value} duration={1500} />
        {suffix}
      </p>
      <p className="text-sm text-gray-500 mt-1">{label}</p>
    </div>
  )
}
