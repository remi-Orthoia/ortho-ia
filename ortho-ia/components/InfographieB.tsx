'use client'

import { useEffect, useState } from 'react'
import { Sparkles, Clock } from 'lucide-react'

/**
 * Proposition B — "Avant / Après" (version allégée)
 * Split émotionnel : 45 min manuel vs 15 sec IA.
 */
export default function InfographieB() {
  return (
    <div className="relative w-full max-w-5xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-4 md:gap-2 items-stretch">
        {/* ============ AVANT ============ */}
        <div className="relative bg-gradient-to-br from-red-50 via-orange-50 to-amber-50 border border-red-100 rounded-3xl p-6 sm:p-10 flex flex-col items-center gap-6">
          <h3 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-red-700 tracking-tight leading-tight text-center">
            Sans Ortho.ia
          </h3>

          <ChronoAvant />

          <StatAvant />
        </div>

        {/* ============ SPARKLE CENTRAL ============ */}
        <div className="flex items-center justify-center py-4 md:py-0 md:px-4">
          <div className="relative">
            <div className="absolute inset-0 rounded-full animate-halo-pulse" />
            <div className="relative w-14 h-14 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-xl">
              <Sparkles className="text-white animate-sparkle" size={22} />
            </div>
          </div>
        </div>

        {/* ============ APRÈS ============ */}
        <div className="relative bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 border border-green-100 rounded-3xl p-6 sm:p-10 flex flex-col items-center gap-6">
          <h3 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-green-700 tracking-tight leading-tight text-center">
            Avec Ortho.ia
          </h3>

          <ChronoApres />

          <StatApres />
        </div>
      </div>
    </div>
  )
}

/* ------------------------------ Sub-components ------------------------------ */

function ChronoAvant() {
  return (
    <div className="bg-white rounded-2xl shadow-md border border-red-100 p-4 w-full max-w-[220px]">
      <div className="flex items-center gap-2 mb-2">
        <Clock size={14} className="text-red-500" />
        <span className="text-xs font-semibold text-gray-700">Temps de rédaction</span>
      </div>
      <div className="relative w-20 h-20 mx-auto">
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <circle cx="50" cy="50" r="42" fill="none" stroke="#fee2e2" strokeWidth="6" />
          <circle
            cx="50" cy="50" r="42" fill="none"
            stroke="#ef4444" strokeWidth="6"
            strokeDasharray="264" strokeDashoffset="66"
            transform="rotate(-90 50 50)"
          />
          <line
            x1="50" y1="50" x2="50" y2="18"
            stroke="#991b1b" strokeWidth="2.5" strokeLinecap="round"
            className="animate-spin-stress"
            style={{ transformOrigin: '50px 50px' }}
          />
          <circle cx="50" cy="50" r="3" fill="#991b1b" />
        </svg>
      </div>
      <p className="text-center mt-1">
        <span className="text-2xl font-bold text-red-600">45</span>
        <span className="text-sm text-red-400 ml-1">min</span>
      </p>
      <p className="text-center text-[10px] text-red-400 font-medium">par CRBO</p>
    </div>
  )
}

function StatAvant() {
  return (
    <div className="bg-red-600 text-white rounded-xl px-5 py-3 inline-flex items-center gap-3 whitespace-nowrap">
      <span className="text-xs uppercase tracking-wider text-red-200">10 CRBO / mois</span>
      <span className="text-lg font-bold">= 7h30 perdues</span>
    </div>
  )
}

function ChronoApres() {
  const [count, setCount] = useState(15)
  useEffect(() => {
    const i = setInterval(() => setCount(c => (c <= 0 ? 15 : c - 1)), 1000)
    return () => clearInterval(i)
  }, [])
  const done = count === 0
  return (
    <div className="bg-white rounded-2xl shadow-md border border-green-100 p-4 w-full max-w-[220px]">
      <div className="flex items-center gap-2 mb-2">
        <Sparkles size={14} className="text-green-500" />
        <span className="text-xs font-semibold text-gray-700">Génération IA</span>
      </div>
      <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
        <svg viewBox="0 0 100 100" className="absolute w-full h-full">
          <circle cx="50" cy="50" r="42" fill="none" stroke="#dcfce7" strokeWidth="6" />
          <circle
            cx="50" cy="50" r="42" fill="none"
            stroke="#22c55e" strokeWidth="6" strokeLinecap="round"
            strokeDasharray="264"
            strokeDashoffset={264 - (264 * (15 - count)) / 15}
            transform="rotate(-90 50 50)"
            style={{ transition: 'stroke-dashoffset 0.9s linear' }}
          />
        </svg>
        <span className={`relative text-2xl font-bold ${done ? 'text-green-600' : 'text-gray-800'}`}>
          {done ? '✓' : count}
        </span>
      </div>
      <p className="text-center mt-1">
        <span className="text-2xl font-bold text-green-600">15</span>
        <span className="text-sm text-green-500 ml-1">sec</span>
      </p>
      <p className="text-center text-[10px] text-green-500 font-medium">par CRBO</p>
    </div>
  )
}

function StatApres() {
  return (
    <div className="bg-green-600 text-white rounded-xl px-5 py-3 inline-flex items-center gap-3 whitespace-nowrap">
      <span className="text-xs uppercase tracking-wider text-green-200">10 CRBO / mois</span>
      <span className="text-lg font-bold">= 7h30 gagnées</span>
    </div>
  )
}
