'use client'

/**
 * Skeleton du dashboard — affiché pendant le fetch initial.
 * Mime la structure réelle (stats + widget + kanban) pour éviter le layout shift.
 *
 * Palette : tokens DS uniquement (--bg-surface / --bg-surface-2 / --border-ds).
 * Les blocs gris utilisent --bg-surface-2 (sand-100 en direction A) qui passe
 * proprement sur le canvas crème ; les blocs primaires utilisent --ds-primary-soft.
 */
export default function DashboardSkeleton() {
  const block: React.CSSProperties = {
    background: 'var(--bg-surface-2)',
    borderRadius: 'var(--radius-sm)',
  }
  const blockMuted: React.CSSProperties = {
    background: 'color-mix(in srgb, var(--bg-surface-2) 70%, transparent)',
    borderRadius: 'var(--radius-sm)',
  }
  const card: React.CSSProperties = {
    background: 'var(--bg-surface)',
    border: '1px solid var(--border-ds)',
    borderRadius: 'var(--radius-md)',
  }
  const column: React.CSSProperties = {
    ...card,
    minHeight: 450,
    borderRadius: 'var(--radius-lg)',
  }

  return (
    <div className="animate-pulse space-y-6" aria-busy="true" aria-label="Chargement du tableau de bord" style={{ fontFamily: 'var(--font-body)' }}>
      {/* Header */}
      <div className="flex justify-between gap-4">
        <div className="space-y-2">
          <div style={{ ...block, height: 32, width: 192 }} />
          <div style={{ ...blockMuted, height: 16, width: 256 }} />
        </div>
        <div style={{ background: 'var(--ds-primary-soft)', height: 44, width: 160, borderRadius: 'var(--radius-md)' }} />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} style={{ ...card, padding: 16 }}>
            <div style={{ ...blockMuted, height: 12, width: 80, marginBottom: 8 }} />
            <div style={{ ...block, height: 28, width: 40 }} />
          </div>
        ))}
      </div>

      {/* Widget line */}
      <div className="grid md:grid-cols-3 gap-4">
        <div style={{ ...card, padding: 20 }}>
          <div style={{ ...block, height: 16, width: 128, marginBottom: 12 }} />
          <div style={{ background: 'color-mix(in srgb, var(--bg-surface-2) 130%, var(--bg-canvas))', height: 20, width: 160, borderRadius: 'var(--radius-sm)', marginBottom: 4 }} />
          <div style={{ ...blockMuted, height: 12, width: 96 }} />
        </div>
        <div style={{ ...card, padding: 20 }} className="md:col-span-2">
          <div style={{ ...block, height: 16, width: 96, marginBottom: 12 }} />
          <div className="grid grid-cols-3 gap-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} style={{ padding: 12, border: '1px solid var(--border-ds)', borderRadius: 'var(--radius-md)' }}>
                <div style={{ ...block, height: 16, width: 80, marginBottom: 4 }} />
                <div style={{ ...blockMuted, height: 12, width: 64 }} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Kanban */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} style={column}>
            <div
              style={{
                padding: '14px 16px',
                borderBottom: '1px solid var(--border-ds)',
                display: 'flex', alignItems: 'center', gap: 8,
              }}
            >
              <div style={{ ...block, width: 28, height: 28, borderRadius: 'var(--radius-md)' }} />
              <div style={{ ...block, height: 16, width: 80 }} />
            </div>
            <div style={{ padding: 8, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {Array.from({ length: 2 }).map((_, j) => (
                <div
                  key={j}
                  style={{
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-ds)',
                    borderRadius: 'var(--radius-md)',
                    padding: 12,
                  }}
                >
                  <div style={{ ...block, height: 16, width: 128, marginBottom: 6 }} />
                  <div style={{ ...blockMuted, height: 12, width: 64, marginBottom: 8 }} />
                  <div style={{ display: 'flex', gap: 6 }}>
                    <div style={{ ...blockMuted, height: 20, width: 64 }} />
                    <div style={{ ...blockMuted, height: 20, width: 56 }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
