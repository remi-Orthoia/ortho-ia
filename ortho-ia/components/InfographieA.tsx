'use client'

import {
  FileText,
  Sparkles,
  Download,
  User,
  BarChart3,
  CheckCircle2,
  Upload,
} from 'lucide-react'

/**
 * Proposition A — "Pipeline magique"
 * 5 cartes flottantes reliées par des flèches pointillées animées.
 */
export default function InfographieA() {
  return (
    <div className="relative w-full max-w-5xl mx-auto">
      {/* Fond subtil */}
      <div className="absolute inset-0 bg-gradient-to-br from-green-50/60 via-emerald-50/40 to-transparent rounded-3xl" />

      <div className="relative p-6 sm:p-12">
        {/* Canvas SVG flèches animées */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          viewBox="0 0 1000 600"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          {/* PDF → IA */}
          <path
            d="M 180 140 Q 350 200, 470 290"
            fill="none"
            stroke="#22c55e"
            strokeWidth="2"
            className="animate-dash-flow"
            opacity="0.5"
          />
          {/* Anamnèse → IA */}
          <path
            d="M 820 140 Q 650 200, 530 290"
            fill="none"
            stroke="#22c55e"
            strokeWidth="2"
            className="animate-dash-flow"
            opacity="0.5"
          />
          {/* IA → CRBO Word */}
          <path
            d="M 470 370 Q 350 450, 200 510"
            fill="none"
            stroke="#10b981"
            strokeWidth="2"
            className="animate-dash-flow"
            opacity="0.6"
          />
          {/* IA → Percentiles */}
          <path
            d="M 530 370 Q 650 450, 820 510"
            fill="none"
            stroke="#10b981"
            strokeWidth="2"
            className="animate-dash-flow"
            opacity="0.6"
          />
        </svg>

        {/* Grille 3 rangées */}
        <div className="relative grid grid-cols-12 gap-4 min-h-[560px]">
          {/* Rangée 1 : inputs */}
          <div className="col-span-12 sm:col-span-5 flex justify-start">
            <CardPDF />
          </div>
          <div className="hidden sm:block sm:col-span-2" />
          <div className="col-span-12 sm:col-span-5 flex justify-end">
            <CardAnamnese />
          </div>

          {/* Rangée 2 : IA centre */}
          <div className="col-span-12 flex justify-center items-center py-6 sm:py-10">
            <CardIA />
          </div>

          {/* Rangée 3 : outputs */}
          <div className="col-span-12 sm:col-span-5 flex justify-start">
            <CardCRBO />
          </div>
          <div className="hidden sm:block sm:col-span-2" />
          <div className="col-span-12 sm:col-span-5 flex justify-end">
            <CardPercentiles />
          </div>
        </div>
      </div>
    </div>
  )
}

/* ------------------------------ Cartes ------------------------------ */

function CardPDF() {
  return (
    <div
      className="animate-float-soft bg-white rounded-2xl shadow-lg border border-gray-100 p-4 w-[260px] animate-appear-up"
      style={{ animationDelay: '0.05s' }}
    >
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center">
          <Upload className="text-red-500" size={16} />
        </div>
        <span className="text-xs font-semibold text-gray-700">PDF Exalang</span>
        <span className="ml-auto text-[10px] text-gray-400">importé</span>
      </div>
      <div className="space-y-1.5 text-[11px] font-mono">
        <div className="flex justify-between bg-gray-50 px-2 py-1 rounded">
          <span className="text-gray-600">Boucle phono.</span>
          <span className="text-gray-900 font-semibold">É-T -1.53</span>
        </div>
        <div className="flex justify-between bg-gray-50 px-2 py-1 rounded">
          <span className="text-gray-600">Lecture mots</span>
          <span className="text-orange-600 font-semibold">P10</span>
        </div>
        <div className="flex justify-between bg-gray-50 px-2 py-1 rounded">
          <span className="text-gray-600">Compr. orale</span>
          <span className="text-green-600 font-semibold">Q1</span>
        </div>
      </div>
    </div>
  )
}

function CardAnamnese() {
  return (
    <div
      className="animate-float-soft-delay bg-white rounded-2xl shadow-lg border border-gray-100 p-4 w-[260px] animate-appear-up"
      style={{ animationDelay: '0.2s' }}
    >
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
          <User className="text-indigo-500" size={16} />
        </div>
        <span className="text-xs font-semibold text-gray-700">Anamnèse</span>
      </div>
      <div className="space-y-2 text-[11px]">
        <div>
          <p className="text-gray-400 text-[10px]">Patient</p>
          <p className="text-gray-900 font-medium">Léa M., 8 ans — CE2</p>
        </div>
        <div>
          <p className="text-gray-400 text-[10px]">Motif</p>
          <p className="text-gray-900">Difficultés lecture, inversions</p>
        </div>
        <div>
          <p className="text-gray-400 text-[10px]">Médecin</p>
          <p className="text-gray-900">Dr Bernard</p>
        </div>
      </div>
    </div>
  )
}

function CardIA() {
  return (
    <div className="relative">
      {/* Halo */}
      <div className="absolute inset-0 rounded-full animate-halo-pulse" />
      {/* Carte centrale */}
      <div
        className="relative bg-gradient-to-br from-green-500 to-emerald-600 text-white rounded-2xl shadow-2xl p-5 w-[280px] animate-appear-up"
        style={{ animationDelay: '0.5s' }}
      >
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="text-white animate-sparkle" size={20} />
          <span className="text-sm font-bold tracking-wide">IA · ORTHO.IA</span>
        </div>
        <p className="text-lg font-semibold leading-tight">
          Analyse 47 subtests
        </p>
        <p className="text-xs text-green-100 mt-1">
          Interprétation percentiles · Rédaction CRBO
        </p>
        <div className="mt-3 flex items-center gap-2 text-[11px] text-white/90">
          <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
          <span>Génération 15 sec</span>
        </div>
      </div>
    </div>
  )
}

function CardCRBO() {
  return (
    <div
      className="animate-float-soft bg-white rounded-2xl shadow-lg border border-gray-100 p-4 w-[260px] animate-appear-up"
      style={{ animationDelay: '0.9s' }}
    >
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
          <FileText className="text-blue-600" size={16} />
        </div>
        <span className="text-xs font-semibold text-gray-700">CRBO Word</span>
        <button className="ml-auto text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full flex items-center gap-1">
          <Download size={10} />
          .docx
        </button>
      </div>
      <div className="space-y-1.5">
        <div className="h-1.5 bg-gray-100 rounded w-full" />
        <div className="h-1.5 bg-gray-100 rounded w-11/12" />
        <div className="h-1.5 bg-gray-100 rounded w-5/6" />
        <div className="h-1.5 bg-gray-100 rounded w-10/12" />
        <div className="bg-green-50 border-l-2 border-green-500 px-2 py-1.5 my-2 rounded-r">
          <p className="text-[10px] text-green-800 italic leading-snug">
            &ldquo;Léa présente un trouble léger de la boucle phonologique…&rdquo;
          </p>
        </div>
        <div className="h-1.5 bg-gray-100 rounded w-11/12" />
        <div className="h-1.5 bg-gray-100 rounded w-3/4" />
      </div>
    </div>
  )
}

function CardPercentiles() {
  const bars = [
    { label: 'Phonologie', fill: 20, color: 'bg-orange-500' },
    { label: 'Lecture', fill: 10, color: 'bg-red-500' },
    { label: 'Compr.', fill: 55, color: 'bg-green-500' },
    { label: 'Mémoire', fill: 70, color: 'bg-green-500' },
  ]
  return (
    <div
      className="animate-float-soft-delay bg-white rounded-2xl shadow-lg border border-gray-100 p-4 w-[260px] animate-appear-up"
      style={{ animationDelay: '1.1s' }}
    >
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center">
          <BarChart3 className="text-purple-500" size={16} />
        </div>
        <span className="text-xs font-semibold text-gray-700">Graphique percentiles</span>
      </div>
      <div className="space-y-2">
        {bars.map((b, i) => (
          <div key={b.label}>
            <div className="flex justify-between text-[10px] mb-0.5">
              <span className="text-gray-600">{b.label}</span>
              <span className="text-gray-500">P{b.fill}</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full animate-fill-bar ${b.color}`}
                style={{ ['--fill' as string]: `${b.fill}%`, animationDelay: `${1.3 + i * 0.15}s` }}
              />
            </div>
          </div>
        ))}
        <div className="flex items-center gap-1 text-[10px] text-green-700 pt-1">
          <CheckCircle2 size={12} />
          <span>Auto-généré depuis résultats</span>
        </div>
      </div>
    </div>
  )
}
