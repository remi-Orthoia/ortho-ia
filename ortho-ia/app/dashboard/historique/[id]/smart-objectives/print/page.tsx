'use client'

/**
 * Vue imprimable de la fiche Objectifs SMART. Auto-déclenche window.print()
 * au chargement. Lit le payload depuis sessionStorage (rempli par le bouton
 * de la page CRBO juste avant l'ouverture dans un nouvel onglet) : évite un
 * second appel Claude API et garantit que Word + PDF montrent exactement la
 * même fiche.
 */

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Loader2, Printer, ArrowLeft } from 'lucide-react'
import type { SmartObjectivesPayload } from '@/app/api/generate-smart-objectives/route'

interface PrintData {
  patient_prenom: string
  patient_nom: string
  bilan_date: string
  smart: SmartObjectivesPayload
}

const SS_KEY_PREFIX = 'ortho-ia:smart-objectives-print:'

function formatFrLong(iso: string): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (isNaN(d.getTime())) return ''
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}

export default function SmartObjectivesPrintPage() {
  const params = useParams()
  const router = useRouter()
  const [data, setData] = useState<PrintData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [autoPrintTriggered, setAutoPrintTriggered] = useState(false)

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(`${SS_KEY_PREFIX}${params.id}`)
      if (!raw) {
        setError("Fiche introuvable. Relancez la génération depuis le détail du CRBO.")
        setLoading(false)
        return
      }
      const parsed = JSON.parse(raw) as PrintData
      if (!parsed.smart?.objectifs) {
        setError('Données de fiche illisibles.')
        setLoading(false)
        return
      }
      setData(parsed)
    } catch {
      setError('Données de fiche illisibles.')
    } finally {
      setLoading(false)
    }
  }, [params.id])

  useEffect(() => {
    if (loading || error || autoPrintTriggered || !data) return
    const t = setTimeout(() => {
      setAutoPrintTriggered(true)
      try {
        window.print()
      } catch {}
    }, 500)
    return () => clearTimeout(t)
  }, [loading, error, autoPrintTriggered, data])

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
        <Loader2 className="animate-spin" size={28} />
      </div>
    )
  }
  if (error || !data) {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24 }}>
        <div style={{ textAlign: 'center', maxWidth: 360 }}>
          <p style={{ marginBottom: 16, color: '#dc2626' }}>{error}</p>
          <button onClick={() => router.back()} className="btn-primary">
            Retour
          </button>
        </div>
      </div>
    )
  }

  const { patient_prenom, patient_nom, bilan_date, smart } = data
  const bilanDateFr = formatFrLong(bilan_date)

  return (
    <>
      <style jsx global>{`
        @media print {
          html,
          body {
            background: white !important;
            margin: 0 !important;
          }
          .no-print {
            display: none !important;
          }
          .print-page {
            padding: 0 !important;
            max-width: none !important;
          }
          h2,
          h3,
          h4 {
            page-break-after: avoid;
          }
          .objectif-block {
            page-break-inside: avoid;
          }
          body {
            font-family: 'Bookman Old Style', Georgia, serif !important;
            color: #000 !important;
          }
        }
        @page {
          size: A4;
          margin: 18mm 16mm 18mm 16mm;
        }
      `}</style>

      <div
        className="no-print"
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
          background: '#1F2937',
          color: 'white',
          padding: '12px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={() => router.back()}
            style={{
              background: 'rgba(255,255,255,0.1)',
              color: 'white',
              border: 0,
              padding: '6px 12px',
              borderRadius: 6,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 13,
            }}
          >
            <ArrowLeft size={14} /> Retour
          </button>
          <span style={{ fontSize: 14, fontWeight: 500 }}>
            Aperçu PDF — Objectifs SMART · {patient_prenom} {patient_nom}
          </span>
        </div>
        <button
          onClick={() => window.print()}
          style={{
            background: '#22c55e',
            color: 'white',
            border: 0,
            padding: '8px 16px',
            borderRadius: 8,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 14,
            fontWeight: 600,
          }}
        >
          <Printer size={16} />
          Imprimer / Sauvegarder en PDF
        </button>
      </div>

      <main
        className="print-page"
        style={{
          maxWidth: 820,
          margin: '0 auto',
          padding: '24px 32px 64px',
          background: 'white',
          color: '#111827',
          fontFamily: '"Bookman Old Style", Georgia, serif',
          fontSize: 14,
          lineHeight: 1.55,
        }}
      >
        <h1
          style={{
            textAlign: 'center',
            margin: '12px 0 8px',
            fontSize: 22,
            fontWeight: 700,
            color: '#2E7D32',
            letterSpacing: 0.5,
          }}
        >
          FICHE OBJECTIFS THÉRAPEUTIQUES
        </h1>
        <p style={{ textAlign: 'center', margin: 0, fontSize: 15, fontWeight: 600 }}>
          Patient : {patient_prenom} {patient_nom}
        </p>
        <p
          style={{
            textAlign: 'center',
            margin: '4px 0 24px',
            fontSize: 12,
            color: '#6B7280',
          }}
        >
          Bilan du {bilanDateFr}
        </p>

        <section style={{ marginBottom: 24 }}>
          <h2
            style={{
              color: '#2E7D32',
              fontSize: 17,
              fontWeight: 700,
              borderBottom: '2px solid #2E7D32',
              paddingBottom: 4,
              marginBottom: 16,
            }}
          >
            OBJECTIFS COURT TERME (3-4 semaines)
          </h2>

          {smart.objectifs.map((obj, idx) => (
            <div className="objectif-block" key={idx} style={{ marginBottom: 22 }}>
              <h3
                style={{
                  color: '#2E7D32',
                  fontSize: 15,
                  fontWeight: 700,
                  marginBottom: 8,
                }}
              >
                Objectif {idx + 1} — {obj.domaine}
              </h3>
              <p
                style={{
                  background: '#E8F5E9',
                  padding: '8px 12px',
                  borderRadius: 6,
                  margin: '0 0 10px',
                }}
              >
                <strong>Objectif :</strong> {obj.intitule}
              </p>
              <table
                style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  fontSize: 13,
                  marginBottom: 8,
                }}
              >
                <tbody>
                  {[
                    ['Ligne de base', obj.ligne_de_base],
                    ['Critère de maîtrise', obj.critere_maitrise],
                    ['Délai', obj.delai],
                    ['Réévaluation', obj.reevaluation],
                  ].map(([label, value]) => (
                    <tr key={label}>
                      <td
                        style={{
                          background: '#F5F5F5',
                          padding: '6px 10px',
                          border: '1px solid #BFBFBF',
                          fontWeight: 600,
                          width: '28%',
                        }}
                      >
                        {label}
                      </td>
                      <td style={{ padding: '6px 10px', border: '1px solid #BFBFBF' }}>{value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p style={{ margin: '8px 0 4px', fontWeight: 600, color: '#2E7D32' }}>
                Entraînement ciblé
              </p>
              <ul style={{ margin: 0, paddingLeft: 20 }}>
                {obj.entrainement.map((ex, i) => (
                  <li key={i} style={{ marginBottom: 2 }}>
                    {ex}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </section>

        <section style={{ marginBottom: 24 }}>
          <h2
            style={{
              color: '#2E7D32',
              fontSize: 17,
              fontWeight: 700,
              borderBottom: '2px solid #2E7D32',
              paddingBottom: 4,
              marginBottom: 12,
            }}
          >
            STRATÉGIES EVIDENCE-BASED
          </h2>
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            {smart.strategies_ebp.map((s, i) => (
              <li key={i} style={{ marginBottom: 4 }}>
                {s}
              </li>
            ))}
          </ul>
        </section>

        <section style={{ marginBottom: 32 }}>
          <h2
            style={{
              color: '#2E7D32',
              fontSize: 17,
              fontWeight: 700,
              borderBottom: '2px solid #2E7D32',
              paddingBottom: 4,
              marginBottom: 12,
            }}
          >
            SUIVI
          </h2>
          <p style={{ margin: 0 }}>
            <strong>Prochaine évaluation formelle :</strong> {smart.prochaine_evaluation}
          </p>
        </section>

        <footer
          style={{
            textAlign: 'center',
            fontStyle: 'italic',
            color: '#6B7280',
            fontSize: 11,
            marginTop: 32,
            borderTop: '1px solid #E5E7EB',
            paddingTop: 12,
          }}
        >
          Document généré par Ortho.ia — usage clinique interne
        </footer>
      </main>
    </>
  )
}
