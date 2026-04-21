'use client'

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import InfographieA from '@/components/InfographieA'
import InfographieB from '@/components/InfographieB'

export default function PreviewInfographiesPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header compact */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
            <ArrowLeft size={16} />
            <span className="text-sm">Retour landing</span>
          </Link>
          <p className="text-sm font-semibold text-gray-800">Preview infographies landing</p>
          <div className="w-[120px]" />
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-24">
        {/* Intro */}
        <section className="text-center max-w-2xl mx-auto">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">
            Deux propositions, <span className="gradient-text">choisis laquelle</span>
          </h1>
          <p className="mt-4 text-gray-600">
            Scroll pour comparer — chaque version est animée comme elle le serait sur la landing.
          </p>
        </section>

        {/* ============ PROPOSITION A ============ */}
        <section>
          <div className="mb-8 flex items-center gap-4 max-w-5xl mx-auto">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 text-white flex items-center justify-center font-bold text-xl shadow-lg">
              A
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Pipeline magique</h2>
              <p className="text-sm text-gray-500">
                5 cartes produit flottantes reliées par des flèches animées — style Lemlist.
              </p>
            </div>
          </div>

          <InfographieA />

          <div className="mt-6 max-w-5xl mx-auto grid sm:grid-cols-3 gap-3 text-sm">
            <div className="bg-green-50 rounded-lg p-3 border border-green-100">
              <p className="font-semibold text-green-800">✓ Oriente &ldquo;produit&rdquo;</p>
              <p className="text-green-700 text-xs mt-1">Montre concrètement ce que fait l&apos;app</p>
            </div>
            <div className="bg-green-50 rounded-lg p-3 border border-green-100">
              <p className="font-semibold text-green-800">✓ Crédibilise la tech</p>
              <p className="text-green-700 text-xs mt-1">Affiche Claude Sonnet, 47 subtests, vraies data</p>
            </div>
            <div className="bg-amber-50 rounded-lg p-3 border border-amber-100">
              <p className="font-semibold text-amber-800">⚠ Demande de lire</p>
              <p className="text-amber-700 text-xs mt-1">Moins immédiat qu&apos;un avant/après</p>
            </div>
          </div>
        </section>

        <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />

        {/* ============ PROPOSITION B ============ */}
        <section>
          <div className="mb-8 flex items-center gap-4 max-w-5xl mx-auto">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 via-orange-500 to-green-500 text-white flex items-center justify-center font-bold text-xl shadow-lg">
              B
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Avant / Après</h2>
              <p className="text-sm text-gray-500">
                Split émotionnel : chaos manuel (45 min, stress) vs fluidité IA (15 sec, soirée libre).
              </p>
            </div>
          </div>

          <InfographieB />

          <div className="mt-6 max-w-5xl mx-auto grid sm:grid-cols-3 gap-3 text-sm">
            <div className="bg-green-50 rounded-lg p-3 border border-green-100">
              <p className="font-semibold text-green-800">✓ Émotion directe</p>
              <p className="text-green-700 text-xs mt-1">L&apos;ortho se reconnaît dans le &ldquo;avant&rdquo;</p>
            </div>
            <div className="bg-green-50 rounded-lg p-3 border border-green-100">
              <p className="font-semibold text-green-800">✓ Screenshotable LinkedIn</p>
              <p className="text-green-700 text-xs mt-1">Viral, clair même sans contexte</p>
            </div>
            <div className="bg-amber-50 rounded-lg p-3 border border-amber-100">
              <p className="font-semibold text-amber-800">⚠ Moins &ldquo;produit&rdquo;</p>
              <p className="text-amber-700 text-xs mt-1">On voit peu concrètement l&apos;app</p>
            </div>
          </div>
        </section>

        {/* Choix */}
        <section className="max-w-3xl mx-auto text-center py-12 bg-gray-50 rounded-3xl">
          <h3 className="text-2xl font-bold text-gray-900">Tu préfères laquelle ?</h3>
          <p className="text-gray-600 mt-2 mb-6">
            Réponds-moi &ldquo;A&rdquo; ou &ldquo;B&rdquo; et je l&apos;intègre dans le hero de la landing.
          </p>
          <div className="flex justify-center gap-4">
            <div className="px-6 py-3 bg-white rounded-xl border-2 border-gray-200">
              <p className="text-xs text-gray-500">Option A</p>
              <p className="font-bold text-gray-900">Pipeline</p>
            </div>
            <div className="px-6 py-3 bg-white rounded-xl border-2 border-gray-200">
              <p className="text-xs text-gray-500">Option B</p>
              <p className="font-bold text-gray-900">Avant/Après</p>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
