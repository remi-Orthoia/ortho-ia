'use client'

/**
 * Heatmap calendaire annuelle style GitHub contributions graph.
 *
 * 1 case = 1 jour, intensité = nb de CRBOs générés ce jour.
 * 7 lignes (lundi → dimanche), ~53 colonnes (semaines de l'année).
 *
 * Pourquoi : visualisation puissante du rythme de travail sur l'année,
 * détecte instantanément les patterns (jours hebdo de travail, vacances,
 * pic de rentrée). Header avec total + heures économisées convertit la
 * fierté en argument quantifié de rétention.
 *
 * Données : reçoit une liste de dates ISO (created_at de chaque CRBO).
 * Côté serveur : déjà disponible via la query crbos.* du dashboard.
 */

import { useMemo, useState } from 'react'
import { TrendingUp } from 'lucide-react'

interface Props {
  /** Liste des dates de création de CRBOs (ISO 8601). */
  crboDates: string[]
  /** Année à afficher. Défaut : année courante. */
  year?: number
  /** Minutes économisées par CRBO (estimation). Défaut : 45 min. */
  minutesPerCrbo?: number
}

const DAY_LABELS = ['Lun', '', 'Mer', '', 'Ven', '', 'Dim']
const MONTH_LABELS = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sept', 'Oct', 'Nov', 'Déc']

// Échelle d'intensité : 0 / 1 / 2 / 3-4 / 5+ CRBOs par jour
const INTENSITY_BUCKETS = [
  { min: 0, max: 0, bg: 'var(--bg-surface-2, #F3F4F6)', label: 'aucun' },
  { min: 1, max: 1, bg: '#C8E6C9', label: '1' },
  { min: 2, max: 2, bg: '#81C784', label: '2' },
  { min: 3, max: 4, bg: '#43A047', label: '3-4' },
  { min: 5, max: Infinity, bg: '#1B5E20', label: '5+' },
]

function bucketFor(count: number) {
  for (const b of INTENSITY_BUCKETS) {
    if (count >= b.min && count <= b.max) return b
  }
  return INTENSITY_BUCKETS[0]
}

/** Date au format YYYY-MM-DD (clé d'index, indépendant timezone). */
function dayKey(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** Construit la grille année : array[7 jours][N semaines]. */
function buildGrid(year: number) {
  const start = new Date(year, 0, 1)
  const end = new Date(year, 11, 31)
  // Décale au lundi précédent pour démarrer la 1re colonne sur lundi
  const startDay = (start.getDay() + 6) % 7 // 0 = lundi
  const cursor = new Date(start)
  cursor.setDate(cursor.getDate() - startDay)

  const weeks: Array<{ key: string; date: Date; inYear: boolean }[]> = []
  let week: { key: string; date: Date; inYear: boolean }[] = []
  while (cursor <= end || week.length < 7 || week.length > 0) {
    const date = new Date(cursor)
    const inYear = date.getFullYear() === year
    week.push({ key: dayKey(date), date, inYear })
    if (week.length === 7) {
      weeks.push(week)
      week = []
      if (cursor > end && date.getDay() === 0) break
    }
    cursor.setDate(cursor.getDate() + 1)
    // Sécurité : sortie si dépassement année + lundi atteint
    if (cursor.getFullYear() > year && (cursor.getDay() + 6) % 7 === 0 && week.length === 0) break
  }
  return weeks
}

export default function YearHeatmap({ crboDates, year, minutesPerCrbo = 45 }: Props) {
  const currentYear = year ?? new Date().getFullYear()
  const [hoveredDay, setHoveredDay] = useState<{ key: string; count: number; x: number; y: number } | null>(null)

  // Index : map YYYY-MM-DD → count
  const dayCount = useMemo(() => {
    const map = new Map<string, number>()
    for (const iso of crboDates) {
      try {
        const d = new Date(iso)
        if (isNaN(d.getTime())) continue
        if (d.getFullYear() !== currentYear) continue
        const k = dayKey(d)
        map.set(k, (map.get(k) ?? 0) + 1)
      } catch {}
    }
    return map
  }, [crboDates, currentYear])

  // Construit la grille de semaines
  const weeks = useMemo(() => buildGrid(currentYear), [currentYear])

  // Total + heures économisées
  const totalThisYear = Array.from(dayCount.values()).reduce((a, b) => a + b, 0)
  const hoursSaved = Math.floor((totalThisYear * minutesPerCrbo) / 60)

  // Position des labels de mois (1er jour du mois = top de la colonne)
  const monthCols = useMemo(() => {
    const cols: Array<{ month: number; weekIndex: number }> = []
    let lastMonth = -1
    weeks.forEach((week, weekIdx) => {
      const firstInYearDay = week.find(d => d.inYear)
      if (!firstInYearDay) return
      const month = firstInYearDay.date.getMonth()
      if (month !== lastMonth && firstInYearDay.date.getDate() <= 7) {
        cols.push({ month, weekIndex: weekIdx })
        lastMonth = month
      }
    })
    return cols
  }, [weeks])

  // Constants de layout
  const CELL = 12 // size of one day cell
  const GAP = 3
  const COL_W = CELL + GAP

  return (
    <div
      style={{
        background: 'var(--bg-surface, white)',
        border: '1px solid var(--border-ds, #E5E7EB)',
        borderRadius: 16,
        padding: '20px 24px',
        fontFamily: 'var(--font-body)',
      }}
    >
      {/* Header avec stats */}
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
            <TrendingUp size={16} style={{ color: 'var(--ds-primary, #16a34a)' }} />
            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: 'var(--fg-1)' }}>
              Votre année {currentYear}
            </h3>
          </div>
          <p style={{ margin: 0, fontSize: 13, color: 'var(--fg-2)', lineHeight: 1.5 }}>
            <strong style={{ color: 'var(--fg-1)' }}>{totalThisYear} CRBO{totalThisYear > 1 ? 's' : ''}</strong> générés cette année,
            soit <strong style={{ color: 'var(--ds-primary, #16a34a)' }}>{hoursSaved > 0 ? `${hoursSaved} h` : `${totalThisYear * minutesPerCrbo} min`}</strong> économisées.
          </p>
        </div>
        {/* Légende d'intensité */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--fg-3)' }}>
          <span>Moins</span>
          {INTENSITY_BUCKETS.map((b, i) => (
            <span
              key={i}
              style={{
                width: 10, height: 10, borderRadius: 2,
                background: b.bg,
                border: i === 0 ? '1px solid var(--border-ds, #E5E7EB)' : 'none',
              }}
            />
          ))}
          <span>Plus</span>
        </div>
      </div>

      {/* Grille */}
      <div style={{ position: 'relative', overflowX: 'auto', paddingBottom: 4 }}>
        <div style={{ display: 'inline-block', position: 'relative' }}>
          {/* Labels mois en haut */}
          <div
            style={{
              display: 'flex',
              marginLeft: 28, // espace pour les labels jours à gauche
              height: 16,
              position: 'relative',
              marginBottom: 4,
            }}
          >
            {monthCols.map(m => (
              <span
                key={m.month}
                style={{
                  position: 'absolute',
                  left: m.weekIndex * COL_W,
                  fontSize: 10,
                  color: 'var(--fg-3, #6B7280)',
                  fontWeight: 500,
                }}
              >
                {MONTH_LABELS[m.month]}
              </span>
            ))}
          </div>

          {/* Grille jours + labels jours */}
          <div style={{ display: 'flex', alignItems: 'flex-start' }}>
            {/* Labels jours (à gauche) */}
            <div style={{ display: 'grid', gridTemplateRows: `repeat(7, ${CELL}px)`, gap: `${GAP}px`, marginRight: 8, fontSize: 10, color: 'var(--fg-3, #6B7280)' }}>
              {DAY_LABELS.map((lbl, i) => (
                <span key={i} style={{ height: CELL, display: 'flex', alignItems: 'center' }}>{lbl}</span>
              ))}
            </div>

            {/* Colonnes (semaines) */}
            <div style={{ display: 'flex', gap: `${GAP}px` }}>
              {weeks.map((week, wIdx) => (
                <div key={wIdx} style={{ display: 'grid', gridTemplateRows: `repeat(7, ${CELL}px)`, gap: `${GAP}px` }}>
                  {week.map((day) => {
                    const count = dayCount.get(day.key) ?? 0
                    const bucket = bucketFor(count)
                    return (
                      <div
                        key={day.key}
                        onMouseEnter={(e) => {
                          if (!day.inYear) return
                          const rect = e.currentTarget.getBoundingClientRect()
                          setHoveredDay({ key: day.key, count, x: rect.left + rect.width / 2, y: rect.top })
                        }}
                        onMouseLeave={() => setHoveredDay(null)}
                        style={{
                          width: CELL,
                          height: CELL,
                          borderRadius: 2,
                          background: day.inYear ? bucket.bg : 'transparent',
                          border: day.inYear && count === 0 ? '1px solid var(--border-ds, #E5E7EB)' : 'none',
                          transition: 'transform 120ms',
                          cursor: day.inYear && count > 0 ? 'pointer' : 'default',
                        }}
                      />
                    )
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Tooltip */}
      {hoveredDay && (
        <div
          style={{
            position: 'fixed',
            left: hoveredDay.x,
            top: hoveredDay.y - 40,
            transform: 'translateX(-50%)',
            background: '#1F2937',
            color: 'white',
            padding: '6px 10px',
            borderRadius: 6,
            fontSize: 11,
            fontWeight: 500,
            pointerEvents: 'none',
            zIndex: 100,
            whiteSpace: 'nowrap',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          }}
        >
          {new Date(hoveredDay.key).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
          {' · '}
          <strong>{hoveredDay.count === 0 ? 'aucun CRBO' : `${hoveredDay.count} CRBO${hoveredDay.count > 1 ? 's' : ''}`}</strong>
        </div>
      )}
    </div>
  )
}
