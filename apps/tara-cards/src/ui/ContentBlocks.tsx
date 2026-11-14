import type { ContentBlock } from '@/domain/types'

/**
 * Renders question content. Passages get a readable measure and serif face,
 * tables are real tables that scroll inside their own container, and figures
 * carry alternative text describing the given information.
 */
export function ContentBlocks({ blocks, className }: { blocks: readonly ContentBlock[]; className?: string }) {
  return (
    <div className={className}>
      {blocks.map((block, i) => (
        <Block key={i} block={block} />
      ))}
    </div>
  )
}

function Block({ block }: { block: ContentBlock }) {
  switch (block.kind) {
    case 'paragraph':
      return <p className="prose-reading mt-3 first:mt-0">{block.text}</p>

    case 'passage':
      return (
        <figure className="mt-3 first:mt-0">
          {block.label && (
            <figcaption className="mb-1 text-xs font-medium uppercase tracking-wide text-foreground-subtle">
              {block.label}
            </figcaption>
          )}
          <blockquote className="prose-reading border-l-2 border-border-strong pl-4">
            {block.text}
          </blockquote>
        </figure>
      )

    case 'list':
      return block.ordered ? (
        <ol className="prose-reading mt-3 list-decimal space-y-1 pl-6 first:mt-0">
          {block.items.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ol>
      ) : (
        <ul className="prose-reading mt-3 list-disc space-y-1 pl-6 first:mt-0">
          {block.items.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      )

    case 'table':
      return (
        <div className="mt-4 first:mt-0">
          <div className="q-table-wrap">
            <table className="q-table text-sm">
              <caption className="sr-only">{block.caption}</caption>
              <thead>
                <tr>
                  {block.headers.map((h, i) => (
                    <th key={i} scope="col">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {block.rows.map((row, r) => (
                  <tr key={r}>
                    {row.map((cell, c) =>
                      c === 0 ? (
                        <th key={c} scope="row" className="font-medium">
                          {cell}
                        </th>
                      ) : (
                        <td key={c}>{cell}</td>
                      ),
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-1.5 text-xs text-foreground-subtle">{block.caption}</p>
        </div>
      )

    case 'figure':
      return (
        <figure className="mt-4 first:mt-0">
          {block.svg ? (
            <div
              role="img"
              aria-label={block.alt}
              className="max-w-2xl rounded-md border border-border bg-white p-2 text-[#221f1c] [&_svg]:h-auto [&_svg]:w-full"
              dangerouslySetInnerHTML={{ __html: block.svg }}
            />
          ) : (
            <div className="rounded-md border border-dashed border-border-strong bg-surface-muted p-4 text-sm text-foreground-muted">
              <p className="font-medium">Diagram not available</p>
              <p className="mt-1">{block.alt}</p>
            </div>
          )}
          {block.caption && (
            <figcaption className="mt-1.5 text-xs text-foreground-subtle">{block.caption}</figcaption>
          )}
        </figure>
      )
  }
}
