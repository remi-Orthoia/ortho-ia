'use client'
import { useEffect, useState } from 'react'

interface TocItem {
  id: string
  text: string
  level: 2 | 3
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
}

interface TableOfContentsProps {
  wordCount: number
}

export function TableOfContents({ wordCount }: TableOfContentsProps) {
  const [items, setItems] = useState<TocItem[]>([])
  const [activeId, setActiveId] = useState<string>('')

  useEffect(() => {
    if (wordCount < 1500) return

    const article = document.querySelector('.prose-blog')
    if (!article) return

    const headings = Array.from(article.querySelectorAll('h2, h3')) as HTMLElement[]
    const tocItems: TocItem[] = headings.map((h) => {
      const text = h.textContent ?? ''
      const id = slugify(text)
      h.id = id
      return { id, text, level: (h.tagName === 'H2' ? 2 : 3) as 2 | 3 }
    })
    setItems(tocItems)

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting)
        if (visible.length > 0) {
          setActiveId(visible[0].target.id)
        }
      },
      { rootMargin: '-10% 0% -75% 0%', threshold: 0 }
    )
    headings.forEach((h) => observer.observe(h))
    return () => observer.disconnect()
  }, [wordCount])

  if (items.length === 0 || wordCount < 1500) return null

  return (
    <nav
      aria-label="Table des matières"
      style={{
        position: 'sticky',
        top: 96,
        maxHeight: 'calc(100vh - 130px)',
        overflowY: 'auto',
        paddingRight: 8,
      }}
    >
      <p style={{
        fontSize: 11, fontWeight: 700, letterSpacing: '0.08em',
        textTransform: 'uppercase', color: 'var(--fg-3)',
        margin: '0 0 14px',
      }}>Dans cet article</p>
      <ol style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
        {items.map((item) => (
          <li key={item.id} style={{ paddingLeft: item.level === 3 ? 12 : 0 }}>
            <a
              href={`#${item.id}`}
              style={{
                display: 'block',
                padding: '5px 10px',
                fontSize: item.level === 3 ? 12 : 13,
                lineHeight: 1.45,
                color: activeId === item.id ? 'var(--ds-primary)' : 'var(--fg-3)',
                textDecoration: 'none',
                fontWeight: activeId === item.id ? 600 : 400,
                borderLeft: '2px solid',
                borderColor: activeId === item.id ? 'var(--ds-primary)' : 'transparent',
                transition: 'all 120ms',
                borderRadius: '0 6px 6px 0',
              }}
            >
              {item.text}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  )
}
