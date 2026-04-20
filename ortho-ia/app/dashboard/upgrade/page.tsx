'use client'

import Link from 'next/link'
import { useState } from 'react'
import { CheckCircle, Sparkles, ArrowLeft, Mail } from 'lucide-react'

export default function UpgradePage() {
  const [billingAnnual, setBillingAnnual] = useState(true)

  return (
    <div className="max-w-4xl mx-auto">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft size={16} />
        <span className="text-sm">Retour au tableau de bord</span>
      </Link>

      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm font-medium mb-4">
          <Sparkles size={16} />
          Passer à Ortho.ia Pro
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">
          Libérez-vous des limites
        </h1>
        <p className="mt-3 text-lg text-gray-600 max-w-2xl mx-auto">
          Générez autant de CRBO que nécessaire, stockez votre historique, et gagnez plusieurs heures
          par semaine.
        </p>
      </div>

      {/* Toggle billing */}
      <div className="flex justify-center mb-8">
        <div className="inline-flex items-center bg-white rounded-full p-1 border border-gray-200 shadow-sm">
          <button
            type="button"
            onClick={() => setBillingAnnual(false)}
            className={`px-5 py-2 rounded-full text-sm font-semibold transition ${
              !billingAnnual ? 'bg-green-600 text-white shadow' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Mensuel
          </button>
          <button
            type="button"
            onClick={() => setBillingAnnual(true)}
            className={`px-5 py-2 rounded-full text-sm font-semibold transition flex items-center gap-2 ${
              billingAnnual ? 'bg-green-600 text-white shadow' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Annuel
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
              billingAnnual ? 'bg-white text-green-700' : 'bg-green-100 text-green-700'
            }`}>
              -25%
            </span>
          </button>
        </div>
      </div>

      {/* Pricing card Pro */}
      <div className="max-w-xl mx-auto">
        <div className="bg-green-600 rounded-2xl p-8 shadow-xl relative overflow-hidden text-white">
          <h3 className="text-xl font-semibold">Pro</h3>
          <p className="text-green-100 mt-2">Pour les orthophonistes en activité</p>

          <div className="mt-6">
            <span className="text-5xl font-bold">
              {billingAnnual ? '14,90€' : '19,90€'}
            </span>
            <span className="text-green-100 ml-2">/mois</span>
          </div>
          <p className="mt-2 text-sm text-green-100">
            {billingAnnual
              ? 'Facturé 178,80€/an · économisez 60€'
              : 'Sans engagement · résiliable à tout moment'}
          </p>

          <ul className="mt-8 space-y-3">
            {[
              'CRBO illimités',
              'Tous les tests supportés (Exalang, Examath, BETL, MoCA, OMF…)',
              'Export Word professionnel avec graphiques',
              'Import PDF automatique (Claude Vision)',
              'Historique complet et Kanban',
              'Carnet patients et médecins',
              'Anonymisation RGPD automatique',
              'Support prioritaire',
            ].map(f => (
              <li key={f} className="flex items-start gap-2">
                <CheckCircle size={18} className="shrink-0 mt-0.5" />
                <span>{f}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-6 bg-amber-50 border border-amber-200 rounded-xl p-5 text-sm text-amber-900">
          <p className="font-semibold mb-2">🛠️ Paiement en ligne bientôt disponible</p>
          <p>
            L&apos;intégration Stripe est en cours de finalisation. En attendant, pour activer votre
            abonnement Pro immédiatement, contactez-nous :
          </p>
          <a
            href="mailto:remi.berrio@gmail.com?subject=Activation%20abonnement%20Ortho.ia%20Pro"
            className="mt-3 inline-flex items-center gap-2 bg-white border border-amber-300 px-4 py-2 rounded-lg font-semibold hover:bg-amber-100 transition"
          >
            <Mail size={16} />
            remi.berrio@gmail.com
          </a>
        </div>
      </div>
    </div>
  )
}
