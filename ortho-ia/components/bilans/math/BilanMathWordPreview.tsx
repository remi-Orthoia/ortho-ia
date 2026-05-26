'use client'

/**
 * Aperçu HTML fidèle du Word qui sera exporté pour un bilan B-CM / B-CMado.
 *
 * Mime le gabarit standard d'ortho.ia :
 *   - En-tête cabinet (nom, "Orthophoniste", adresse, CP + ville, tél, email)
 *   - Titre centré "COMPTE RENDU DE BILAN ORTHOPHONIQUE"
 *   - Sous-titre "Bilan {initial|renouvellement} du JJ/MM/AAAA"
 *   - Bloc Patient (Prénom / Nom / Âge / Classe)
 *   - Tests pratiqués
 *   - Grille B-CMado coloriée (remplace le tableau Exalang pour ces bilans
 *     uniquement) : on rend chaque section de la grille via MatriceSection
 *     en lecture seule, avec les couleurs cotées par l'ortho.
 *   - Contenu CRBO généré (sections par épreuve, diagnostic DSM-V, projet
 *     thérapeutique) rendu en markdown via BilanMathCRBORender.
 *   - Signature ortho.
 *
 * Charge le profil ortho en supabase au montage. Si profil absent (compte
 * incomplet), l'en-tête est partiellement vide mais le reste s'affiche.
 */

import { useEffect, useMemo, useState } from 'react'
import MatriceSection from './MatriceSection'
import BilanMathCRBORender from './BilanMathCRBORender'
import { createClient } from '@/lib/supabase'
import type { BilanMathDraft, GrilleBilan } from '@/lib/bilans/math/types'
import { splitCrboByGrilleSections, stripBilanRealiseSection } from '@/lib/bilans/math/split-crbo'
import {
  computeEvolutionRows,
  DIRECTION_SYMBOL,
  DIRECTION_LABEL,
  COLOR_LABEL_FR,
  summarizeEvolution,
} from '@/lib/bilans/math/compute-evolution'

interface Props {
  grille: GrilleBilan
  draft: BilanMathDraft
  generatedCRBO: string
  bilanDate?: string // ISO (YYYY-MM-DD), défaut = aujourd'hui
}

interface OrthoProfile {
  prenom: string | null
  nom: string | null
  adresse: string | null
  code_postal: string | null
  ville: string | null
  telephone: string | null
  email: string | null
  adeli_rpps: string | null
}

function formatDateFR(iso: string): string {
  try {
    const d = new Date(iso)
    if (isNaN(d.getTime())) return ''
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
  } catch {
    return ''
  }
}

function computeAge(ddnISO: string): string {
  if (!ddnISO) return ''
  const ddn = new Date(ddnISO)
  if (isNaN(ddn.getTime())) return ''
  const now = new Date()
  let years = now.getFullYear() - ddn.getFullYear()
  let months = now.getMonth() - ddn.getMonth()
  if (now.getDate() < ddn.getDate()) months -= 1
  if (months < 0) { years -= 1; months += 12 }
  if (years <= 0) return `${Math.max(0, months)} mois`
  return months > 0 ? `${years} ans et ${months} mois` : `${years} ans`
}

export default function BilanMathWordPreview({ grille, draft, generatedCRBO, bilanDate }: Props) {
  const [profile, setProfile] = useState<OrthoProfile | null>(null)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return
        const { data } = await supabase
          .from('profiles')
          .select('prenom, nom, adresse, code_postal, ville, telephone, email, adeli_rpps')
          .eq('id', user.id)
          .single()
        if (!cancelled) setProfile(data ?? null)
      } catch {
        // En cas d'erreur réseau, on rend l'en-tête vide — le reste reste utile.
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  const date = bilanDate ?? new Date().toISOString().slice(0, 10)
  const dateFR = formatDateFR(date)
  const orthoNom = `${profile?.prenom ?? ''} ${profile?.nom ?? ''}`.trim()
  const orthoCpVille = `${profile?.code_postal ?? ''} ${profile?.ville ?? ''}`.trim()
  const age = computeAge(draft.patient.date_naissance)
  const modeLabel = draft.mode === 'renouvellement' ? 'de renouvellement' : 'initial'

  // Decoupe le CRBO genere en head / chunks-par-grille / tail, pour
  // interleaver les commentaires d'epreuve sous chaque grille.
  const crboSplit = useMemo(() => splitCrboByGrilleSections(generatedCRBO, grille), [generatedCRBO, grille])

  return (
    <div
      style={{
        // Mime A4 portrait : 794 × 1123 px à 96dpi. On laisse le padding
        // approximer les marges Word (~720 DXA = ~12mm).
        background: 'white',
        color: '#1f2937',
        // Bookman Old Style n'est pas garantie côté web — fallback serif
        // raisonnable. Le Word final utilise bien Bookman.
        fontFamily: '"Bookman Old Style", "Georgia", "Times New Roman", serif',
        fontSize: 13,
        lineHeight: 1.5,
        padding: '48px 56px',
        border: '1px solid var(--border-ds, #E5E7EB)',
        borderRadius: 8,
        boxShadow: '0 8px 24px rgba(15,23,42,0.08)',
        maxWidth: 880,
        margin: '0 auto',
      }}
    >
      {/* En-tête cabinet — gauche. Doit reproduire fidelement le Word
          (lib/bilan-math-word-export.ts:186-198), y compris la ligne ADELI/RPPS
          quand le profil l'a renseignee. */}
      <header style={{ marginBottom: 24 }}>
        <p style={{ margin: 0, fontWeight: 700 }}>{orthoNom || '—'}</p>
        <p style={{ margin: 0 }}>Orthophoniste</p>
        {profile?.adresse && <p style={{ margin: 0 }}>{profile.adresse}</p>}
        {orthoCpVille && <p style={{ margin: 0 }}>{orthoCpVille}</p>}
        {profile?.telephone && <p style={{ margin: 0 }}>{profile.telephone}</p>}
        {profile?.email && <p style={{ margin: 0 }}>{profile.email}</p>}
        {profile?.adeli_rpps && profile.adeli_rpps.trim() && (
          <p style={{ margin: 0 }}>{profile.adeli_rpps.trim()}</p>
        )}
      </header>

      {/* Titre */}
      <h1 style={{
        margin: '24px 0 8px',
        textAlign: 'center',
        fontSize: 19,
        fontWeight: 700,
        letterSpacing: '0.02em',
      }}>
        COMPTE RENDU DE BILAN ORTHOPHONIQUE
      </h1>
      <p style={{
        margin: '0 0 28px',
        textAlign: 'center',
        fontWeight: 600,
        color: '#2E7D32',
      }}>
        Bilan {modeLabel}{dateFR ? ` du ${dateFR}` : ''}
      </p>

      {/* Bloc Patient — tableau 2x4 */}
      <h2 style={{ margin: '20px 0 8px', fontSize: 14, fontWeight: 700, color: '#2E7D32' }}>
        Patient
      </h2>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 14 }}>
        <tbody>
          <tr>
            <td style={cellStyle()}>Prénom :</td>
            <td style={cellStyle({ bold: true })}>{draft.patient.prenom || '—'}</td>
            <td style={cellStyle()}>Nom :</td>
            <td style={cellStyle({ bold: true })}>{draft.patient.nom || '—'}</td>
          </tr>
          <tr>
            <td style={cellStyle()}>Âge :</td>
            <td style={cellStyle()}>
              {age}
              {draft.patient.date_naissance && ` (${formatDateFR(draft.patient.date_naissance)})`}
            </td>
            <td style={cellStyle()}>Classe :</td>
            <td style={cellStyle()}>{draft.patient.classe || '—'}</td>
          </tr>
        </tbody>
      </table>

      {/* Tests pratiqués — inclut la phrase verbatim "Bilan realise avec..."
          en italique, deplacee ici depuis sa section dediee. Demande
          utilisateur 2026-05-26 : evite le doublon section "Bilan realise"
          qui faisait redondance avec le motif/anamnese juste apres. */}
      <h2 style={{ margin: '20px 0 8px', fontSize: 14, fontWeight: 700, color: '#2E7D32' }}>
        Tests pratiqués
      </h2>
      <p style={{ margin: '0 0 8px' }}>
        • {grille.label} — {grille.description}
      </p>
      <p style={{
        margin: '0 0 18px',
        fontStyle: 'italic',
        fontSize: 12.5,
        color: '#707070',
        lineHeight: 1.5,
        textAlign: 'justify',
      }}>
        Bilan réalisé avec des épreuves de manipulations des compétences logiques de la batterie B-LM2,
        des épreuves numériques du TEDI-MATH, du ZAREKI-R, et des épreuves cliniques.
        Les compétences sont cotées qualitativement : réussite spontanée, réussite après étayage, échec.
      </p>

      {/* Head : Motif / Anamnese — affiches avant les grilles. La section
          "Bilan realise" eventuellement presente dans le head est strippee
          ici car deja rendue sous Tests pratiques ci-dessus. */}
      {(() => {
        const cleanHead = stripBilanRealiseSection(crboSplit.head)
        return cleanHead ? (
          <div style={{ marginTop: 12 }}>
            <BilanMathCRBORender text={cleanHead} />
          </div>
        ) : null
      })()}

      {/* Grille coloriee + commentaires CRBO interleaves par section.
          Chaque chunk est rendu sous la grille correspondante (matching
          par keywords sur les H2 markdown). Demande utilisateur 2026-05-26
          pour rapprocher visuellement les commentaires d'epreuve de leur
          grille d'origine. */}
      <h2 style={{ margin: '24px 0 12px', fontSize: 14, fontWeight: 700, color: '#2E7D32' }}>
        Résultats détaillés du bilan
      </h2>

      {/* Tableau comparatif d'evolution (mode renouvellement uniquement,
          quand on a les cellules grille du bilan precedent). 1 ligne par
          epreuve cotee dans au moins un des 2 bilans. */}
      {draft.mode === 'renouvellement' &&
        draft.renouvellement?.bilanPrecedentEpreuves &&
        Object.keys(draft.renouvellement.bilanPrecedentEpreuves).length > 0 && (() => {
          const rows = computeEvolutionRows(
            grille,
            draft.epreuves,
            draft.renouvellement.bilanPrecedentEpreuves,
          )
          if (rows.length === 0) return null
          const prevDateLabel = draft.renouvellement.bilanPrecedentDate
            ? formatDateFR(draft.renouvellement.bilanPrecedentDate)
            : 'bilan précédent'
          const currDateLabel = draft.bilanDate ? formatDateFR(draft.bilanDate) : 'bilan actuel'
          const COLOR_BG: Record<string, string> = {
            gris: '#F3F4F6', vert: '#86EFAC', orange: '#FCD34D', rouge: '#FCA5A5',
          }
          const COLOR_TX: Record<string, string> = {
            gris: '#6B7280', vert: '#14532D', orange: '#78350F', rouge: '#7F1D1D',
          }
          const DIR_BG: Record<string, string> = {
            progres: '#D1FAE5', stable: 'transparent', regression: '#FECACA', nouveau: '#D1FAE5', skipped: 'transparent',
          }
          return (
            <div style={{ marginBottom: 24 }}>
              <h3 style={{ margin: '0 0 4px', fontSize: 13, fontWeight: 600, color: '#2E7D32' }}>
                Évolution par épreuve — comparaison avec le bilan du {prevDateLabel}
              </h3>
              <p style={{ margin: '0 0 8px', fontSize: 11.5, fontStyle: 'italic', color: '#6B7280' }}>
                {summarizeEvolution(rows)}
              </p>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr>
                    <th style={evolHeaderCell()}>Domaine</th>
                    <th style={evolHeaderCell()}>Épreuve</th>
                    <th style={evolHeaderCell()}>Bilan du {prevDateLabel}</th>
                    <th style={evolHeaderCell()}>Bilan du {currDateLabel}</th>
                    <th style={evolHeaderCell()}>Évolution</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => (
                    <tr key={i}>
                      <td style={evolBodyCell()}>{r.sectionLabel}</td>
                      <td style={evolBodyCell()}>{r.epreuveLabel}</td>
                      <td style={{
                        ...evolBodyCell(),
                        background: COLOR_BG[r.previousColor],
                        color: COLOR_TX[r.previousColor],
                        textAlign: 'center',
                      }}>
                        {COLOR_LABEL_FR[r.previousColor]}
                      </td>
                      <td style={{
                        ...evolBodyCell(),
                        background: COLOR_BG[r.currentColor],
                        color: COLOR_TX[r.currentColor],
                        textAlign: 'center',
                      }}>
                        {COLOR_LABEL_FR[r.currentColor]}
                      </td>
                      <td style={{
                        ...evolBodyCell(),
                        background: DIR_BG[r.direction] ?? 'transparent',
                        fontWeight: r.direction === 'progres' || r.direction === 'regression' ? 600 : 400,
                        textAlign: 'center',
                      }}>
                        {DIRECTION_SYMBOL[r.direction]} {DIRECTION_LABEL[r.direction]}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        })()}
      <div style={{ marginBottom: 24 }}>
        {grille.sections.map((section) => {
          const chunk = crboSplit.bySection.get(section.id)
          return (
            <div key={section.id} style={{ marginBottom: 28 }}>
              <MatriceSection
                section={section}
                epreuves={draft.epreuves}
                interactive={false}
              />
              {chunk && (
                <div style={{ marginTop: 12 }}>
                  <BilanMathCRBORender text={chunk} />
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Tail : Diagnostic + Projet therapeutique — apres les grilles. */}
      {crboSplit.tail && <BilanMathCRBORender text={crboSplit.tail} />}

      {/* Signature footer */}
      <footer style={{ marginTop: 36, textAlign: 'right', fontStyle: 'italic' }}>
        <p style={{ margin: 0 }}>{orthoNom}</p>
        <p style={{ margin: 0, fontSize: 12, color: '#6b7280' }}>Orthophoniste</p>
      </footer>

      {/* Mention de confidentialite — affichee a la fin de chaque CRBO,
          identique au rendu Word (lib/bilan-math-word-export.ts). */}
      <p style={{
        marginTop: 28,
        textAlign: 'center',
        fontSize: 11,
        fontStyle: 'italic',
        color: '#707070',
        lineHeight: 1.5,
      }}>
        Document confidentiel soumis au secret médical et légalement réservé en lecture
        aux seuls responsables légaux et médecin prescripteur, qui en contrôlent la
        diffusion et l&apos;usage.
      </p>
    </div>
  )
}

// ============================================================================
// Helpers
// ============================================================================

function cellStyle(opts: { bold?: boolean } = {}): React.CSSProperties {
  return {
    border: '1px solid #D1D5DB',
    padding: '6px 10px',
    fontSize: 12.5,
    fontWeight: opts.bold ? 700 : 400,
    verticalAlign: 'top',
  }
}

function evolHeaderCell(): React.CSSProperties {
  return {
    border: '1px solid #BBDEFB',
    background: '#E8F5E9',
    padding: '6px 8px',
    fontSize: 11.5,
    fontWeight: 600,
    color: '#1F2937',
    textAlign: 'left',
  }
}

function evolBodyCell(): React.CSSProperties {
  return {
    border: '1px solid #E5E7EB',
    padding: '5px 8px',
    fontSize: 11.5,
    verticalAlign: 'middle',
  }
}
