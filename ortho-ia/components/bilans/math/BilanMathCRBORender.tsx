'use client'

import type { ReactNode } from 'react'

/**
 * Rend un CRBO math généré (markdown léger) avec la même trame visuelle
 * que les CRBO langage (sections en vert sauge, paragraphes lisibles).
 *
 * Format du texte attendu :
 *   **Section Title**
 *   Contenu paragraphes
 *
 *   **Autre Section**
 *   ...
 *
 * Les lignes commençant par `- ` ou `* ` sont rendues comme bullets.
 * Les lignes commençant par un chiffre suivi de `.` sont rendues comme
 * liste ordonnée (axes thérapeutiques).
 */

interface Props {
  text: string
}

export default function BilanMathCRBORender({ text }: Props) {
  const sections = parseSections(text)
  return (
    <div className="space-y-5">
      {sections.map((section, i) => (
        <Section key={i} title={section.title}>
          {section.blocks.map((block, j) => renderBlock(block, j))}
        </Section>
      ))}
    </div>
  )
}

// ============================================================================
// Section visuelle — même style que les CRBO langage (header vert sauge)
// ============================================================================

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="card-modern p-5">
      <h3 className="font-bold text-primary-700 dark:text-primary-400 text-base mb-3">
        {title}
      </h3>
      <div className="space-y-2 text-gray-800 dark:text-gray-200 leading-relaxed text-sm">
        {children}
      </div>
    </div>
  )
}

// ============================================================================
// Parsing markdown léger
// ============================================================================

type ParsedSection = {
  title: string
  blocks: Block[]
}

type Block =
  | { kind: 'paragraph'; text: string }
  | { kind: 'bullets'; items: string[] }
  | { kind: 'ordered'; items: string[] }

function parseSections(raw: string): ParsedSection[] {
  // Une ligne `**Title**` toute seule = nouveau titre de section.
  // Sinon, ligne fait partie du contenu de la section courante.
  const lines = raw.split('\n')
  const sections: ParsedSection[] = []
  let current: ParsedSection | null = null
  let buffer: string[] = []

  const flushBuffer = () => {
    if (!current) return
    const blocks = parseBlocks(buffer)
    current.blocks.push(...blocks)
    buffer = []
  }

  for (const rawLine of lines) {
    const line = rawLine.replace(/\r$/, '')
    const sectionMatch = line.match(/^\s*\*\*([^*]+)\*\*\s*:?\s*$/)
    if (sectionMatch) {
      // Flush la section précédente
      flushBuffer()
      if (current) sections.push(current)
      current = { title: sectionMatch[1].trim(), blocks: [] }
      continue
    }
    buffer.push(line)
  }
  flushBuffer()
  if (current) sections.push(current)

  // Si pas de section détectée (CRBO sans **titres**), on met tout dans une
  // section "Compte rendu" pour ne pas masquer le contenu.
  if (sections.length === 0 && raw.trim()) {
    sections.push({
      title: 'Compte rendu',
      blocks: parseBlocks(raw.split('\n')),
    })
  }
  return sections
}

function parseBlocks(lines: string[]): Block[] {
  const blocks: Block[] = []
  let paraBuffer: string[] = []
  let bulletBuffer: string[] | null = null
  let orderedBuffer: string[] | null = null

  const flushPara = () => {
    if (paraBuffer.length === 0) return
    const text = paraBuffer.join(' ').trim()
    if (text) blocks.push({ kind: 'paragraph', text })
    paraBuffer = []
  }
  const flushBullets = () => {
    if (bulletBuffer && bulletBuffer.length > 0) blocks.push({ kind: 'bullets', items: bulletBuffer })
    bulletBuffer = null
  }
  const flushOrdered = () => {
    if (orderedBuffer && orderedBuffer.length > 0) blocks.push({ kind: 'ordered', items: orderedBuffer })
    orderedBuffer = null
  }

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) {
      // Ligne vide = séparateur de blocs
      flushPara()
      flushBullets()
      flushOrdered()
      continue
    }
    const bulletMatch = trimmed.match(/^[-*]\s+(.+)/)
    const orderedMatch = trimmed.match(/^\d+\.\s+(.+)/)
    if (bulletMatch) {
      flushPara()
      flushOrdered()
      if (!bulletBuffer) bulletBuffer = []
      bulletBuffer.push(bulletMatch[1])
      continue
    }
    if (orderedMatch) {
      flushPara()
      flushBullets()
      if (!orderedBuffer) orderedBuffer = []
      orderedBuffer.push(orderedMatch[1])
      continue
    }
    // Ligne de paragraphe
    flushBullets()
    flushOrdered()
    paraBuffer.push(trimmed)
  }
  flushPara()
  flushBullets()
  flushOrdered()
  return blocks
}

// ============================================================================
// Rendu d'un bloc
// ============================================================================

function renderBlock(block: Block, key: number): ReactNode {
  switch (block.kind) {
    case 'paragraph':
      return (
        <p key={key} className="text-gray-800 dark:text-gray-200 leading-relaxed">
          {renderInline(block.text)}
        </p>
      )
    case 'bullets':
      return (
        <ul key={key} className="space-y-1.5 mt-1">
          {block.items.map((item, i) => (
            <li key={i} className="flex items-start gap-2 text-gray-800 dark:text-gray-200">
              <span className="text-primary-600 dark:text-primary-400 font-bold mt-0.5">•</span>
              <span>{renderInline(item)}</span>
            </li>
          ))}
        </ul>
      )
    case 'ordered':
      return (
        <ol key={key} className="space-y-1.5 list-decimal list-inside mt-1">
          {block.items.map((item, i) => (
            <li key={i} className="text-gray-800 dark:text-gray-200">
              {renderInline(item)}
            </li>
          ))}
        </ol>
      )
  }
}

/** Rend un texte inline avec support du **gras** markdown. */
function renderInline(text: string): ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/g).filter((p) => p.length > 0)
  return parts.map((p, i) =>
    p.startsWith('**') && p.endsWith('**') ? (
      <strong key={i} className="font-semibold">{p.slice(2, -2)}</strong>
    ) : (
      <span key={i}>{p}</span>
    ),
  )
}
