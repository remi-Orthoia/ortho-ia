'use client'

import { useCallback, useState, type ReactNode, type DragEvent } from 'react'

/**
 * Wrapper drag-and-drop pour les zones d'upload.
 *
 * Encapsule les handlers HTML5 dragover/dragleave/drop et fournit un feedback
 * visuel (overlay vert "Déposez le fichier ici") quand l'utilisateur drag
 * un fichier au-dessus. Au drop, filtre les fichiers via la prop `accept`
 * (mêmes patterns que l'attribut HTML accept : ".pdf,image/*,application/pdf")
 * et appelle `onFilesDropped`.
 *
 * NE remplace PAS le bouton clic-pour-uploader existant — il continue à
 * fonctionner. Le composant ajoute juste le drop en parallèle.
 *
 * Usage :
 *   <FileDropZone
 *     onFilesDropped={(files) => processFiles(files)}
 *     accept=".pdf,image/*"
 *     multiple
 *   >
 *     <label>
 *       <input type="file" onChange={...} hidden />
 *       Cliquez pour importer
 *     </label>
 *   </FileDropZone>
 */

interface FileDropZoneProps {
  /** Callback appelé avec les fichiers droppés (déjà filtrés par accept). */
  onFilesDropped: (files: File[]) => void
  /** Pattern type accept HTML : ".pdf,image/*". Si absent, tout fichier passe. */
  accept?: string
  /** Si false, ne garde que le premier fichier droppé. Défaut true. */
  multiple?: boolean
  /** Si true, ignore les drops (et masque l'overlay). */
  disabled?: boolean
  /** Classes appliquées au wrapper (utile pour layout — display, width, etc.). */
  className?: string
  /** Contenu réel de la zone (label + input habituels). */
  children: ReactNode
  /** Label affiché dans l'overlay au drag-over. Par défaut "Déposez ici". */
  overlayLabel?: string
}

/** Vérifie qu'un fichier matche un des patterns de l'attribut accept. */
function matchesAccept(file: File, accept: string): boolean {
  const patterns = accept.split(',').map(s => s.trim().toLowerCase()).filter(Boolean)
  if (patterns.length === 0) return true
  const name = file.name.toLowerCase()
  const type = file.type.toLowerCase()
  return patterns.some(p => {
    if (p.startsWith('.')) return name.endsWith(p) // ".pdf", ".docx"
    if (p.endsWith('/*')) return type.startsWith(p.slice(0, -1)) // "image/*"
    return type === p // "application/pdf"
  })
}

export default function FileDropZone({
  onFilesDropped,
  accept,
  multiple = true,
  disabled = false,
  className,
  children,
  overlayLabel = 'Déposez le fichier ici',
}: FileDropZoneProps) {
  const [isDragging, setIsDragging] = useState(false)

  const handleDragEnter = useCallback((e: DragEvent<HTMLDivElement>) => {
    if (disabled) return
    // On filtre sur dataTransfer.types pour ignorer les drags qui ne sont
    // pas des fichiers (ex: drag de texte depuis une autre app).
    if (!e.dataTransfer.types?.includes('Files')) return
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }, [disabled])

  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    if (disabled) return
    if (!e.dataTransfer.types?.includes('Files')) return
    e.preventDefault()
    e.stopPropagation()
    // dropEffect 'copy' fait apparaître le curseur "+" au lieu du curseur barré.
    e.dataTransfer.dropEffect = 'copy'
    if (!isDragging) setIsDragging(true)
  }, [disabled, isDragging])

  const handleDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    // dragleave se déclenche aussi en passant sur les enfants. On garde l'état
    // "dragging" si on entre dans un enfant du wrapper (relatedTarget contenu
    // par currentTarget). Sinon, on sort vraiment de la zone.
    const next = e.relatedTarget as Node | null
    if (next && e.currentTarget.contains(next)) return
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    if (disabled) return
    const all = Array.from(e.dataTransfer.files)
    const filtered = accept ? all.filter(f => matchesAccept(f, accept)) : all
    if (filtered.length === 0) return
    onFilesDropped(multiple ? filtered : [filtered[0]])
  }, [disabled, accept, multiple, onFilesDropped])

  return (
    <div
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`relative ${className ?? ''}`}
    >
      {children}
      {isDragging && (
        <div
          aria-hidden="true"
          className="absolute inset-0 z-10 flex items-center justify-center bg-green-500/15 border-2 border-dashed border-green-600 rounded-lg pointer-events-none backdrop-blur-[1px]"
        >
          <span className="px-3 py-1.5 bg-green-600 text-white font-semibold text-sm rounded shadow-lg">
            {overlayLabel}
          </span>
        </div>
      )}
    </div>
  )
}
