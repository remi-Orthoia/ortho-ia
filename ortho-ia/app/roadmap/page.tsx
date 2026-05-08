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
      { title: 'Génération automatique du CRBO', status: 'done', details: '15 modules de tests (Exalang, Examath, BALE, BELEC, BILO, ELO, EVALO, MoCA, BETL, OMF…)' },
      { title: 'Export Word professionnel', status: 'done', details: 'Graphique page 1, tableaux colorés par seuil, badge sévérité' },
      { title: 'Import PDF automatique', status: 'done', details: 'Détection test + extraction scores + percentiles' },
      { title: 'Kanban + statuts CRBO', status: 'done', details: 'Drag & drop, rollback DB, badges sévérité' },
      { title: 'Carnet patients + timeline d\'évolution', status: 'done', details: 'Multi-courbes par domaine clinique' },
      { title: 'Renouvellement avec comparatif', status: 'done', details: 'Synthèse d\'évolution, tableau comparatif Word avec flèches ↑↓' },
      { title: 'Sécurité RGPD', status: 'done', details: 'Anonymisation avant traitement automatique, RLS Supabase, logs filtrés' },
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
      { title: 'Suggestions contextuelles', status: 'planned', details: 'Ex: "Ce profil rappelle 3 bilans précédents, voici leur PEC"' },
      { title: 'Analyse longitudinale patient', status: 'planned', details: 'Graphiques, dashboards par patient avec retour thérapeutique' },
    ],
  },
]

const StatusBadge = ({ status }: { status: Status }) => {
  const base: React.CSSProperties = {
    display: 'inline-flex', alignItems: 'center', gap: 4,
    padding: '2px 10px', borderRadius: 'var(--radius-pill)',
    fontSize: 12, fontWeight: 600,
  }
  if (status === 'done') {
    return (
      <span style={{ ...base, background: 'var(--ds-success-soft)', color: 'var(--ds-success)' }}>
        <CheckCircle size={11} />
        Livré
      </span>
    )
  }
  if (status === 'in_progress') {
    return (
      <span style={{ ...base, background: 'var(--ds-warning-soft)', color: 'var(--ds-warning)' }}>
        <Wrench size={11} />
        En cours
      </span>
    )
  }
  return (
    <span style={{ ...base, background: 'var(--bg-surface-2)', color: 'var(--fg-2)' }}>
      <Clock size={11} />
      Prévu
    </span>
  )
}

export default function RoadmapPage() {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--bg-canvas)', color: 'var(--fg-1)',
        fontFamily: 'var(--font-body)',
        padding: '48px 16px',
      }}
    >
      <div className="max-w-3xl mx-auto">
        <Link
          href="/"
          className="inline-flex items-center gap-2"
          style={{ color: 'var(--fg-2)', textDecoration: 'none', fontSize: 14, marginBottom: 24 }}
        >
          <ArrowLeft size={16} />
          Retour à l&apos;accueil
        </Link>

        <div
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            color: 'var(--ds-primary-hover)',
            fontSize: 12, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase',
          }}
        >
          <Sparkles size={14} />
          Roadmap
        </div>
        <h1
          style={{
            marginTop: 12,
            fontFamily: 'var(--font-display)', fontSize: 'clamp(28px, 4vw, 38px)',
            fontWeight: 500, letterSpacing: '-0.015em', color: 'var(--fg-1)',
          }}
        >
          Ce qu&apos;on construit pour vous
        </h1>
        <p style={{ marginTop: 12, color: 'var(--fg-2)', lineHeight: 1.6 }}>
          Ortho.ia évolue vite. Les besoins des orthophonistes beta nourrissent directement
          notre feuille de route. Voici ce qui est déjà en place et ce qui arrive.
        </p>

        <div style={{ marginTop: 40, display: 'flex', flexDirection: 'column', gap: 32 }}>
          {ROADMAP.map((block) => (
            <section key={block.quarter}>
              <h2
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 20, fontWeight: 600,
                  color: 'var(--fg-1)',
                  borderLeft: '4px solid var(--ds-primary)',
                  paddingLeft: 12, marginBottom: 16,
                }}
              >
                {block.quarter}
              </h2>
              <ul style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {block.items.map((item) => (
                  <li
                    key={item.title}
                    style={{
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--border-ds)',
                      borderRadius: 'var(--radius-md)',
                      padding: 16,
                      display: 'flex', alignItems: 'flex-start', gap: 12,
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="flex items-start justify-between gap-3 flex-wrap">
                        <p style={{ fontWeight: 600, color: 'var(--fg-1)' }}>
                          {item.title}
                        </p>
                        <StatusBadge status={item.status} />
                      </div>
                      {item.details && (
                        <p style={{ marginTop: 4, fontSize: 14, color: 'var(--fg-3)' }}>
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

        <div
          style={{
            marginTop: 48, padding: 24,
            background: `
              radial-gradient(ellipse at 0% 0%, var(--ds-primary-soft) 0%, transparent 70%),
              radial-gradient(ellipse at 100% 100%, var(--ds-accent-soft) 0%, transparent 70%),
              var(--bg-surface)
            `,
            border: '1px solid var(--border-ds)',
            borderRadius: 'var(--radius-lg)',
            textAlign: 'center',
          }}
        >
          <p style={{ color: 'var(--fg-1)', lineHeight: 1.6 }}>
            Une fonctionnalité vous manque ? Écrivez-nous à{' '}
            <a href="mailto:remi.berrio@gmail.com" style={{ color: 'var(--ds-primary-hover)', textDecoration: 'underline', fontWeight: 600 }}>
              remi.berrio@gmail.com
            </a>{' '}
            ou via le bouton <strong>Feedback</strong> depuis le dashboard.
          </p>
        </div>
      </div>
    </div>
  )
}
