'use client'

/**
 * Vue imprimable d'un CRBO. Auto-déclenche window.print() au chargement.
 *
 * Pourquoi cette approche plutôt qu'une lib PDF côté serveur ou client :
 *  - rendu pixel-perfect via le moteur d'impression du navigateur
 *    (fonts, hyphenation, page breaks impeccables)
 *  - texte sélectionnable + searchable dans le PDF résultant
 *  - aucune nouvelle dépendance (jspdf, react-pdf, puppeteer)
 *  - UX 2 clics : "Exporter PDF" → la boîte de dialogue Save propose
 *    "Enregistrer en PDF" en choix par défaut sur tous les navigateurs
 *    modernes.
 *
 * Le @media print masque tout le chrome dashboard (sidebar, header,
 * boutons) — seul le contenu CRBO s'imprime.
 */

import React, { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { Loader2, Printer, ArrowLeft } from 'lucide-react'
import { seuilFor } from '@/lib/word-export'
import type { CRBOStructure } from '@/lib/prompts'

interface CRBO {
  id: string
  patient_prenom: string
  patient_nom: string
  patient_classe: string | null
  patient_ddn: string | null
  bilan_date: string
  bilan_type: string
  medecin_nom: string | null
  medecin_tel: string | null
  test_utilise: string | null
  structure_json: CRBOStructure | null
  crbo_genere?: string | null
}

interface Profile {
  prenom: string
  nom: string
  adresse?: string | null
  code_postal?: string | null
  ville?: string | null
  telephone?: string | null
  email?: string | null
}

export default function PrintCRBOPage() {
  const params = useParams()
  const router = useRouter()
  const [crbo, setCrbo] = useState<CRBO | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [autoPrintTriggered, setAutoPrintTriggered] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }
      const [crboRes, profileRes] = await Promise.all([
        supabase.from('crbos').select('*').eq('id', params.id).eq('user_id', user.id).single(),
        supabase.from('profiles').select('*').eq('id', user.id).single(),
      ])
      if (crboRes.error || !crboRes.data) {
        setError("CRBO introuvable ou accès refusé.")
        setLoading(false)
        return
      }
      setCrbo(crboRes.data as CRBO)
      setProfile((profileRes.data as Profile) ?? null)
      setLoading(false)
    }
    fetchData()
  }, [params.id, router])

  // Auto-trigger print() ~600ms après que le contenu soit prêt, pour laisser
  // les polices Web et le graphique se charger complètement avant.
  useEffect(() => {
    if (loading || error || autoPrintTriggered) return
    const t = setTimeout(() => {
      setAutoPrintTriggered(true)
      try { window.print() } catch {}
    }, 600)
    return () => clearTimeout(t)
  }, [loading, error, autoPrintTriggered])

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
        <Loader2 className="animate-spin" size={28} />
      </div>
    )
  }
  if (error || !crbo) {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24 }}>
        <div style={{ textAlign: 'center', maxWidth: 360 }}>
          <p style={{ marginBottom: 16, color: '#dc2626' }}>{error || 'CRBO introuvable'}</p>
          <button onClick={() => router.push('/dashboard/historique')} className="btn-primary">
            Retour à l'historique
          </button>
        </div>
      </div>
    )
  }

  const bilanDateFormatted = (() => {
    try { return new Date(crbo.bilan_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) }
    catch { return crbo.bilan_date }
  })()

  return (
    <>
      {/* CSS : version écran (toolbar visible) + version print (toolbar masquée) */}
      <style jsx global>{`
        /* Reset minimal pour la version print */
        @media print {
          html, body { background: white !important; margin: 0 !important; }
          .no-print { display: none !important; }
          .print-only { display: block !important; }
          .print-page { padding: 0 !important; max-width: none !important; }
          /* Évite que les blocs CRBO soient coupés en plein milieu d'une page */
          h2, h3, h4 { page-break-after: avoid; }
          table { page-break-inside: auto; }
          tr { page-break-inside: avoid; page-break-after: auto; }
          /* Polices web : on force les fallbacks systèmes en print, plus stable */
          body { font-family: 'Bookman Old Style', 'Georgia', serif !important; color: #000 !important; }
        }
        @page {
          size: A4;
          margin: 18mm 16mm 18mm 16mm;
        }
        .print-only { display: none; }
      `}</style>

      {/* Toolbar écran uniquement — boutons Imprimer / Retour */}
      <div className="no-print" style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: '#1F2937', color: 'white',
        padding: '12px 24px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
        flexWrap: 'wrap',
        boxShadow: '0 1px 3px rgba(0,0,0,0.10)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={() => router.back()}
            style={{
              background: 'rgba(255,255,255,0.1)', color: 'white', border: 0,
              padding: '6px 12px', borderRadius: 6, cursor: 'pointer',
              display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13,
            }}
          >
            <ArrowLeft size={14} /> Retour
          </button>
          <span style={{ fontSize: 14, fontWeight: 500 }}>
            Aperçu PDF — CRBO {crbo.patient_prenom} {crbo.patient_nom} · {bilanDateFormatted}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            onClick={() => window.print()}
            style={{
              background: '#22c55e', color: 'white', border: 0,
              padding: '8px 16px', borderRadius: 8, cursor: 'pointer',
              display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 14, fontWeight: 600,
            }}
          >
            <Printer size={16} />
            Imprimer / Sauvegarder en PDF
          </button>
        </div>
        <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', width: '100%', margin: 0 }}>
          💡 Dans la boîte de dialogue, choisissez <strong>"Enregistrer au format PDF"</strong> comme destination.
        </p>
      </div>

      {/* Contenu imprimable */}
      <main className="print-page" style={{
        maxWidth: 820,
        margin: '0 auto',
        padding: '24px 32px 64px',
        background: 'white',
        color: '#111827',
        fontFamily: '"Bookman Old Style", Georgia, serif',
        fontSize: 14,
        lineHeight: 1.55,
      }}>
        {/* En-tête ortho */}
        {profile && (
          <header style={{ marginBottom: 24, paddingBottom: 12, borderBottom: '2px solid #16a34a' }}>
            <p style={{ margin: 0, fontWeight: 700, fontSize: 16 }}>
              {profile.prenom} {profile.nom}
            </p>
            <p style={{ margin: 0, fontSize: 12, color: '#374151' }}>Orthophoniste</p>
            {profile.adresse && (
              <p style={{ margin: 0, fontSize: 12, color: '#4B5563' }}>
                {profile.adresse}
                {profile.code_postal || profile.ville ? ` · ${profile.code_postal ?? ''} ${profile.ville ?? ''}`.trim() : ''}
              </p>
            )}
            <p style={{ margin: 0, fontSize: 12, color: '#4B5563' }}>
              {profile.telephone}{profile.telephone && profile.email ? ' · ' : ''}{profile.email}
            </p>
          </header>
        )}

        {/* Titre central */}
        <h1 style={{
          textAlign: 'center', margin: '12px 0 4px',
          fontSize: 22, fontWeight: 700, letterSpacing: 0.5,
        }}>
          COMPTE RENDU DE BILAN ORTHOPHONIQUE
        </h1>
        <p style={{
          textAlign: 'center', margin: '0 0 24px',
          fontSize: 15, color: '#16a34a', fontWeight: 600,
        }}>
          Bilan {crbo.bilan_type || ''} du {bilanDateFormatted}
        </p>

        {/* Patient / Médecin */}
        <section style={{ marginBottom: 20 }}>
          <h2 style={{ fontSize: 14, color: '#16a34a', fontWeight: 700, margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Patient
          </h2>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <tbody>
              <tr>
                <td style={{ padding: '4px 8px', width: 100, color: '#6B7280' }}>Prénom</td>
                <td style={{ padding: '4px 8px', fontWeight: 600 }}>{crbo.patient_prenom}</td>
                <td style={{ padding: '4px 8px', width: 80, color: '#6B7280' }}>Nom</td>
                <td style={{ padding: '4px 8px', fontWeight: 600 }}>{crbo.patient_nom}</td>
              </tr>
              <tr>
                <td style={{ padding: '4px 8px', color: '#6B7280' }}>Classe</td>
                <td style={{ padding: '4px 8px' }}>{crbo.patient_classe || '—'}</td>
                <td style={{ padding: '4px 8px', color: '#6B7280' }}>DDN</td>
                <td style={{ padding: '4px 8px' }}>
                  {crbo.patient_ddn ? new Date(crbo.patient_ddn).toLocaleDateString('fr-FR') : '—'}
                </td>
              </tr>
            </tbody>
          </table>
        </section>

        {crbo.medecin_nom && (
          <section style={{ marginBottom: 20 }}>
            <h2 style={{ fontSize: 14, color: '#16a34a', fontWeight: 700, margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Médecin prescripteur
            </h2>
            <p style={{ margin: 0, fontSize: 13 }}>
              <strong>{crbo.medecin_nom}</strong>
              {crbo.medecin_tel && ` · ${crbo.medecin_tel}`}
            </p>
          </section>
        )}

        {/* Tests pratiqués */}
        {crbo.test_utilise && (
          <section style={{ marginBottom: 20 }}>
            <h2 style={{ fontSize: 14, color: '#16a34a', fontWeight: 700, margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Tests pratiqués
            </h2>
            <p style={{ margin: 0, fontSize: 13 }}>• {crbo.test_utilise}</p>
          </section>
        )}

        {/* Corps CRBO via le composant preview existant */}
        {crbo.structure_json ? (
          <div style={{ marginTop: 16 }}>
            <CRBOPrintableStructure structure={crbo.structure_json} testUtilise={crbo.test_utilise} />
          </div>
        ) : (
          <pre style={{
            whiteSpace: 'pre-wrap', fontFamily: 'inherit', fontSize: 13,
            background: '#F9FAFB', padding: 12, borderRadius: 6,
          }}>
            {crbo.crbo_genere || '(Contenu CRBO indisponible)'}
          </pre>
        )}
      </main>
    </>
  )
}

/**
 * Rendu CRBO simplifié pour la version imprimable.
 * Plus dense que CRBOStructuredPreview (qui est optimisé pour l'écran).
 */
/**
 * Mini-icône SVG des sous-items MoCA conventionnels (cube 3D, horloge à 11h10
 * décomposée par phase). Inline pour rester self-contained dans le rendu print.
 */
function PrintSousItemIcon({ nom }: { nom: string }) {
  const n = nom.toLowerCase()
  if (n.includes('cube')) {
    return (
      <svg viewBox="0 0 28 28" width={18} height={18} fill="none" stroke="#374151" strokeWidth={1.4} strokeLinejoin="round" style={{ verticalAlign: 'middle', marginRight: 4 }}>
        <path d="M5 10 L14 6 L23 10 L14 14 Z" />
        <path d="M5 10 L5 20 L14 24 L14 14" />
        <path d="M23 10 L23 20 L14 24" />
        <path d="M14 6 L14 14" strokeDasharray="1.5 2" opacity={0.5} />
      </svg>
    )
  }
  if (n.includes('horloge')) {
    const withChiffres = n.includes('chiffre') || n.includes('aiguille')
    const withAiguilles = n.includes('aiguille')
    return (
      <svg viewBox="0 0 28 28" width={18} height={18} fill="none" stroke="#374151" strokeWidth={1.4} style={{ verticalAlign: 'middle', marginRight: 4 }}>
        <circle cx="14" cy="14" r="11" />
        {withChiffres && (
          <g>
            <line x1="14" y1="3.5" x2="14" y2="5.2" />
            <line x1="14" y1="22.8" x2="14" y2="24.5" />
            <line x1="3.5" y1="14" x2="5.2" y2="14" />
            <line x1="22.8" y1="14" x2="24.5" y2="14" />
            <line x1="6.4" y1="6.4" x2="7.6" y2="7.6" />
            <line x1="20.4" y1="6.4" x2="21.6" y2="7.6" />
            <line x1="6.4" y1="21.6" x2="7.6" y2="20.4" />
            <line x1="20.4" y1="21.6" x2="21.6" y2="20.4" />
          </g>
        )}
        {withAiguilles && (
          <g strokeLinecap="round">
            <line x1="14" y1="14" x2="10.4" y2="9.6" strokeWidth={2} />
            <line x1="14" y1="14" x2="21" y2="9.6" strokeWidth={1.5} />
            <circle cx="14" cy="14" r="1.2" fill="#374151" stroke="none" />
          </g>
        )}
      </svg>
    )
  }
  return null
}

function CRBOPrintableStructure({ structure, testUtilise }: { structure: CRBOStructure; testUtilise: string | null }) {
  const isMoca = testUtilise === 'MoCA'
  return (
    <>
      {/* Anamnèse */}
      {structure.anamnese_redigee && (
        <section style={{ marginBottom: 18 }}>
          <h2 style={{ fontSize: 13, color: '#16a34a', fontWeight: 700, margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Anamnèse
          </h2>
          <div style={{ whiteSpace: 'pre-line', fontSize: 13, color: '#1F2937' }}>
            {structure.anamnese_redigee}
          </div>
        </section>
      )}

      {/* Domaines + épreuves */}
      {structure.domains && structure.domains.length > 0 && (
        <section style={{ marginBottom: 18 }}>
          <h2 style={{ fontSize: 13, color: '#16a34a', fontWeight: 700, margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Bilan
          </h2>
          {structure.domains.map((d, i) => (
            <div key={i} style={{ marginBottom: 14 }}>
              <h3 style={{ fontSize: 13.5, fontWeight: 700, margin: '0 0 4px', color: '#16a34a' }}>
                {d.nom}
              </h3>
              {isMoca ? (
                /* MoCA : tableau 3 colonnes Épreuve / Score / Commentaire avec
                   sous-lignes pour les sous-épreuves. Aucune mention É-T,
                   centile ou zone d'interprétation. */
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, marginBottom: 6 }}>
                  <thead>
                    <tr style={{ background: '#E8F5E9' }}>
                      <th style={{ padding: '4px 8px', textAlign: 'left', border: '1px solid #BFBFBF' }}>Épreuve</th>
                      <th style={{ padding: '4px 8px', textAlign: 'center', border: '1px solid #BFBFBF', width: 80 }}>Score</th>
                      <th style={{ padding: '4px 8px', textAlign: 'left', border: '1px solid #BFBFBF' }}>Commentaire</th>
                    </tr>
                  </thead>
                  <tbody>
                    {d.epreuves.map((e, j) => (
                      <React.Fragment key={j}>
                        <tr style={{ background: '#F0FDF4' }}>
                          <td style={{ padding: '4px 8px', border: '1px solid #BFBFBF', fontWeight: 600 }}>{e.nom}</td>
                          <td style={{ padding: '4px 8px', textAlign: 'center', border: '1px solid #BFBFBF', fontWeight: 600 }}>{e.score || '—'}</td>
                          <td style={{ padding: '4px 8px', border: '1px solid #BFBFBF', whiteSpace: 'pre-line' }}>{e.commentaire || ''}</td>
                        </tr>
                        {(e.sous_epreuves ?? []).map((se, k) => {
                          const m = se.score.match(/^(\d+)\s*\/\s*\d+/)
                          const isZero = !!m && parseInt(m[1], 10) === 0
                          return (
                            <tr key={`se-${j}-${k}`}>
                              <td style={{ padding: '3px 8px 3px 20px', border: '1px solid #BFBFBF', color: isZero ? '#9CA3AF' : '#374151', fontSize: 11 }}>
                                <PrintSousItemIcon nom={se.nom} />
                                • {se.nom}
                              </td>
                              <td style={{ padding: '3px 8px', textAlign: 'center', border: '1px solid #BFBFBF', color: isZero ? '#9CA3AF' : '#111827', fontSize: 11, fontWeight: isZero ? 400 : 600 }}>{se.score}</td>
                              <td style={{ padding: '3px 8px', border: '1px solid #BFBFBF', color: '#9CA3AF' }}>—</td>
                            </tr>
                          )
                        })}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, marginBottom: 6 }}>
                  <thead>
                    <tr style={{ background: '#E8F5E9' }}>
                      <th style={{ padding: '4px 8px', textAlign: 'left', border: '1px solid #BFBFBF' }}>Épreuve</th>
                      <th style={{ padding: '4px 8px', textAlign: 'center', border: '1px solid #BFBFBF', width: 60 }}>Score</th>
                      <th style={{ padding: '4px 8px', textAlign: 'center', border: '1px solid #BFBFBF', width: 50 }}>É-T</th>
                      <th style={{ padding: '4px 8px', textAlign: 'center', border: '1px solid #BFBFBF', width: 60 }}>Centile</th>
                      <th style={{ padding: '4px 8px', textAlign: 'center', border: '1px solid #BFBFBF', width: 90 }}>Interprétation</th>
                    </tr>
                  </thead>
                  <tbody>
                    {d.epreuves.map((e, j) => {
                      const seuil = seuilFor(e.percentile_value)
                      return (
                        <tr key={j}>
                          <td style={{ padding: '4px 8px', border: '1px solid #BFBFBF' }}>{e.nom}</td>
                          <td style={{ padding: '4px 8px', textAlign: 'center', border: '1px solid #BFBFBF' }}>{e.score || '—'}</td>
                          <td style={{ padding: '4px 8px', textAlign: 'center', border: '1px solid #BFBFBF' }}>{e.et || '—'}</td>
                          <td style={{ padding: '4px 8px', textAlign: 'center', border: '1px solid #BFBFBF', backgroundColor: '#' + seuil.shading, color: seuil.textColor ? '#' + seuil.textColor : '#000', fontWeight: 600 }}>
                            {e.percentile || `P${e.percentile_value}`}
                          </td>
                          <td style={{ padding: '4px 8px', textAlign: 'center', border: '1px solid #BFBFBF', backgroundColor: '#' + seuil.shading, color: seuil.textColor ? '#' + seuil.textColor : '#000', fontWeight: 600 }}>
                            {seuil.label}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              )}
              {!isMoca && d.commentaire && (
                <p style={{ fontSize: 12.5, color: '#374151', margin: '4px 0 0', lineHeight: 1.55 }}>
                  {d.commentaire}
                </p>
              )}
            </div>
          ))}
        </section>
      )}

      {/* Points forts / Difficultés */}
      {structure.points_forts && (
        <section style={{ marginBottom: 12 }}>
          <h3 style={{ fontSize: 13, color: '#16a34a', fontWeight: 700, margin: '0 0 4px' }}>Points forts</h3>
          <div style={{ whiteSpace: 'pre-line', fontSize: 13 }}>{structure.points_forts}</div>
        </section>
      )}
      {structure.difficultes_identifiees && (
        <section style={{ marginBottom: 12 }}>
          <h3 style={{ fontSize: 13, color: '#16a34a', fontWeight: 700, margin: '0 0 4px' }}>Difficultés identifiées</h3>
          <div style={{ whiteSpace: 'pre-line', fontSize: 13 }}>{structure.difficultes_identifiees}</div>
        </section>
      )}

      {/* Diagnostic — sur les bilans MoCA (screening), le titre devient
          "Hypothèse de diagnostic" : la MoCA seule ne permet pas un diagnostic
          étiologique ferme, elle ouvre des pistes à confirmer en bilan
          neuropsychologique. */}
      {structure.diagnostic && (
        <section style={{ marginBottom: 12 }}>
          <h3 style={{ fontSize: 13, color: '#16a34a', fontWeight: 700, margin: '0 0 4px' }}>
            {isMoca ? 'Hypothèse de diagnostic' : 'Diagnostic'}
          </h3>
          <div style={{ whiteSpace: 'pre-line', fontSize: 13 }}>{structure.diagnostic}</div>
        </section>
      )}

      {/* Recommandations */}
      {structure.recommandations && (
        <section style={{ marginBottom: 12 }}>
          <h3 style={{ fontSize: 13, color: '#16a34a', fontWeight: 700, margin: '0 0 4px' }}>Recommandations</h3>
          <div style={{ whiteSpace: 'pre-line', fontSize: 13 }}>{structure.recommandations}</div>
        </section>
      )}

      {/* Axes */}
      {structure.axes_therapeutiques && structure.axes_therapeutiques.length > 0 && (
        <section style={{ marginBottom: 12 }}>
          <h3 style={{ fontSize: 13, color: '#16a34a', fontWeight: 700, margin: '0 0 4px' }}>Axes thérapeutiques</h3>
          <ol style={{ margin: 0, paddingLeft: 22, fontSize: 13 }}>
            {structure.axes_therapeutiques.map((a, i) => <li key={i} style={{ marginBottom: 2 }}>{a}</li>)}
          </ol>
        </section>
      )}

      {/* PAP */}
      {structure.pap_suggestions && structure.pap_suggestions.length > 0 && (
        <section style={{ marginBottom: 12 }}>
          <h3 style={{ fontSize: 13, color: '#16a34a', fontWeight: 700, margin: '0 0 4px' }}>Aménagements scolaires conseillés</h3>
          <ul style={{ margin: 0, paddingLeft: 22, fontSize: 13 }}>
            {structure.pap_suggestions.map((p, i) => <li key={i} style={{ marginBottom: 2 }}>{p}</li>)}
          </ul>
        </section>
      )}

      {/* Conclusion */}
      {structure.conclusion && (
        <p style={{
          marginTop: 24, fontSize: 11, fontStyle: 'italic', color: '#6B7280',
          textAlign: 'center', borderTop: '1px solid #E5E7EB', paddingTop: 12,
        }}>
          {structure.conclusion}
        </p>
      )}
    </>
  )
}
