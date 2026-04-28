import Link from 'next/link'
import { CheckCircle, Clock, Wrench, Sparkles, ArrowLeft } from 'lucide-react'

export const metadata = {
  title: 'Roadmap — Ortho.ia',
  description: 'Feuille de route produit, features livrées et à venir',
}

type Status = 'done' | 'in_progress' | 'planned'

const ROADMAP: Array<{
  quarter: string
  items: Array<{ title: string; status: Status; details?: string }>
}> = [
  {
    quarter: 'Q2 2026 — Beta fermée (maintenant)',
    items: [
      { title: 'Génération CRBO par notre IA', status: 'done', details: '15 modules de tests (Exalang, Examath, BALE, BELEC, BILO, ELO, EVALO, MoCA, BETL, OMF…)' },
      { title: 'Export Word professionnel', status: 'done', details: 'Graphique page 1, tableaux colorés par seuil, badge sévérité' },
      { title: 'Import PDF automatique (vision IA)', status: 'done', details: 'Détection test + extraction scores + percentiles' },
      { title: 'Kanban + statuts CRBO', status: 'done', details: 'Drag & drop, rollback DB, badges sévérité' },
      { title: 'Carnet patients + timeline d\'évolution', status: 'done', details: 'Multi-courbes par domaine clinique' },
      { title: 'Renouvellement avec comparatif', status: 'done', details: 'Synthèse d\'évolution, tableau comparatif Word avec flèches ↑↓' },
      { title: 'Sécurité RGPD', status: 'done', details: 'Anonymisation avant envoi à l\'IA, RLS Supabase, logs filtrés' },
      { title: 'Compte démo + 5 CRBOs exemples', status: 'done', details: 'Pour beta testeurs, couvre les profils variés' },
    ],
  },
  {
    quarter: 'Q3 2026 — Sortie publique',
    items: [
      { title: 'Intégration Stripe (paiement)', status: 'in_progress', details: 'Abonnement 19,90€/mois ou 14,90€/mois en annuel (178,80€/an). 3 mois offerts beta.' },
      { title: 'Webhook factures automatiques', status: 'planned' },
      { title: 'Hébergement HDS (Scaleway / Clever Cloud)', status: 'planned', details: 'Migration avant ouverture publique large' },
      { title: 'Parrainage beta → public', status: 'planned', details: 'Codes parrain, 1 mois offert pour l\'invité et le parrain' },
    ],
  },
  {
    quarter: 'Q4 2026 — Expansion fonctionnelle',
    items: [
      { title: 'Dictée vocale en séance (Whisper API)', status: 'planned', details: 'Enregistrement anamnèse orale → transcription + reformulation' },
      { title: 'Modules de tests supplémentaires', status: 'planned', details: 'BMT-2, L2MA-2, ExaMath 5-8, AUTOMNE, LECTURA…' },
      { title: 'Export PDF (en plus du Word)', status: 'planned' },
      { title: 'Envoi direct par email au médecin', status: 'planned', details: 'Lien sécurisé ou PDF chiffré' },
      { title: 'Signature électronique simple', status: 'planned' },
    ],
  },
  {
    quarter: 'Q1 2027 — Collaboration & intelligence',
    items: [
      { title: 'Partage d\'un CRBO pour relecture (confrère)', status: 'planned', details: 'Au-delà du lien 24h : vraie collaboration éditoriale' },
      { title: 'Ortho.ia Équipe', status: 'planned', details: 'Plusieurs orthos dans un même cabinet, partage carnet patients' },
      { title: 'Suggestions IA contextuelles', status: 'planned', details: 'Ex: "Ce profil rappelle 3 bilans précédents, voici leur PEC"' },
      { title: 'Analyse longitudinale patient', status: 'planned', details: 'Graphiques, dashboards par patient avec retour thérapeutique' },
    ],
  },
]

const StatusBadge = ({ status }: { status: Status }) => {
  if (status === 'done') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-primary-100 dark:bg-primary-900/40 text-primary-800 dark:text-primary-200">
        <CheckCircle size={11} />
        Livré
      </span>
    )
  }
  if (status === 'in_progress') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200">
        <Wrench size={11} />
        En cours
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 dark:bg-surface-dark-muted text-gray-700 dark:text-gray-300">
      <Clock size={11} />
      Prévu
    </span>
  )
}

export default function RoadmapPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-surface-dark py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 text-sm mb-6"
        >
          <ArrowLeft size={16} />
          Retour à l&apos;accueil
        </Link>

        <div className="flex items-center gap-2 text-primary-700 dark:text-primary-400 font-semibold uppercase text-xs tracking-wider">
          <Sparkles size={14} />
          Roadmap
        </div>
        <h1 className="mt-3 text-3xl sm:text-4xl font-bold text-gray-900 dark:text-gray-100">
          Ce qu&apos;on construit pour vous
        </h1>
        <p className="mt-3 text-gray-600 dark:text-gray-400 leading-relaxed">
          Ortho.ia évolue vite. Les besoins des orthophonistes beta nourrissent directement
          notre feuille de route. Voici ce qui est déjà en place et ce qui arrive.
        </p>

        <div className="mt-10 space-y-8">
          {ROADMAP.map((block) => (
            <section key={block.quarter}>
              <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 border-l-4 border-primary-500 pl-3 mb-4">
                {block.quarter}
              </h2>
              <ul className="space-y-3">
                {block.items.map((item) => (
                  <li
                    key={item.title}
                    className="card-modern p-4 flex items-start gap-3"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3 flex-wrap">
                        <p className="font-semibold text-gray-900 dark:text-gray-100">
                          {item.title}
                        </p>
                        <StatusBadge status={item.status} />
                      </div>
                      {item.details && (
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                          {item.details}
                        </p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        <div className="mt-12 text-center bg-gradient-to-br from-primary-50 to-emerald-50 dark:from-primary-900/20 dark:to-emerald-900/10 rounded-2xl p-6 border border-primary-200 dark:border-primary-800/40">
          <p className="text-gray-800 dark:text-gray-200">
            Une fonctionnalité vous manque ? Écrivez-nous à{' '}
            <a href="mailto:remi.berrio@gmail.com" className="text-primary-700 dark:text-primary-400 hover:underline font-semibold">
              remi.berrio@gmail.com
            </a>{' '}
            ou via le bouton <strong>Feedback</strong> depuis le dashboard.
          </p>
        </div>
      </div>
    </div>
  )
}
