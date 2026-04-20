'use client'

/**
 * Skeleton du dashboard — affiché pendant le fetch initial.
 * Mime la structure réelle (stats + widget + kanban) pour éviter le layout shift.
 */
export default function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse" aria-busy="true" aria-label="Chargement du tableau de bord">
      {/* Header */}
      <div className="flex justify-between gap-4">
        <div className="space-y-2">
          <div className="h-8 w-48 bg-gray-200 dark:bg-surface-dark-muted rounded" />
          <div className="h-4 w-64 bg-gray-100 dark:bg-surface-dark-muted/60 rounded" />
        </div>
        <div className="h-11 w-40 bg-primary-200 dark:bg-primary-900/40 rounded-lg" />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="card-modern p-4">
            <div className="h-3 w-20 bg-gray-100 dark:bg-surface-dark-muted/60 rounded mb-2" />
            <div className="h-7 w-10 bg-gray-200 dark:bg-surface-dark-muted rounded" />
          </div>
        ))}
      </div>

      {/* Widget line */}
      <div className="grid md:grid-cols-3 gap-4">
        <div className="card-modern p-5">
          <div className="h-4 w-32 bg-gray-200 dark:bg-surface-dark-muted rounded mb-3" />
          <div className="h-5 w-40 bg-gray-300 dark:bg-surface-dark-muted/80 rounded mb-1" />
          <div className="h-3 w-24 bg-gray-100 dark:bg-surface-dark-muted/60 rounded" />
        </div>
        <div className="card-modern p-5 md:col-span-2">
          <div className="h-4 w-24 bg-gray-200 dark:bg-surface-dark-muted rounded mb-3" />
          <div className="grid grid-cols-3 gap-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="p-3 border border-gray-100 dark:border-surface-dark-muted rounded-lg">
                <div className="h-4 w-20 bg-gray-200 dark:bg-surface-dark-muted rounded mb-1" />
                <div className="h-3 w-16 bg-gray-100 dark:bg-surface-dark-muted/60 rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Kanban */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-gray-200 dark:border-surface-dark-muted min-h-[450px] bg-white dark:bg-surface-dark-subtle">
            <div className="px-4 py-3.5 border-b border-gray-200 dark:border-surface-dark-muted flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gray-200 dark:bg-surface-dark-muted" />
              <div className="h-4 w-20 bg-gray-200 dark:bg-surface-dark-muted rounded" />
            </div>
            <div className="p-2 space-y-2">
              {Array.from({ length: 2 }).map((_, j) => (
                <div key={j} className="bg-white dark:bg-surface-dark rounded-lg border border-gray-100 dark:border-surface-dark-muted p-3">
                  <div className="h-4 w-32 bg-gray-200 dark:bg-surface-dark-muted rounded mb-1.5" />
                  <div className="h-3 w-16 bg-gray-100 dark:bg-surface-dark-muted/60 rounded mb-2" />
                  <div className="flex gap-1.5">
                    <div className="h-5 w-16 bg-gray-100 dark:bg-surface-dark-muted/60 rounded" />
                    <div className="h-5 w-14 bg-gray-100 dark:bg-surface-dark-muted/60 rounded" />
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
