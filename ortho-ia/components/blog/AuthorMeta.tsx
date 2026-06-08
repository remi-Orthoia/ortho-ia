import type { PostMeta } from '@/lib/blog'
import { formatPostDate } from '@/lib/blog'

interface AuthorMetaProps {
  meta: PostMeta
}

export function AuthorMeta({ meta }: AuthorMetaProps) {
  return (
    <div style={{
      display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center',
      fontSize: 13, color: 'var(--fg-3)',
    }}>
      <span style={{ fontWeight: 500, color: 'var(--fg-2)' }}>{meta.author}</span>
      <span aria-hidden="true">·</span>
      <time dateTime={meta.date}>{formatPostDate(meta.date)}</time>
      {meta.dateModified && meta.dateModified !== meta.date && (
        <>
          <span aria-hidden="true">·</span>
          <span>
            Mis à jour le{' '}
            <time dateTime={meta.dateModified}>{formatPostDate(meta.dateModified)}</time>
          </span>
        </>
      )}
      <span aria-hidden="true">·</span>
      <span>{meta.readingTime} min de lecture</span>
    </div>
  )
}
