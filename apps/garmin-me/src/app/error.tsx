'use client'

export default function ErrorPage({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="mx-auto mt-24 max-w-lg rounded-2xl border border-line bg-surface p-6 text-sm text-ink-2">
      <h2 className="mb-2 text-base font-semibold text-ink">Something went wrong showing this page</h2>
      <p className="mb-4 break-words">{error.message}</p>
      <button type="button" onClick={reset} className="rounded-full bg-ink px-4 py-2 text-xs font-medium text-page">
        Try again
      </button>
    </div>
  )
}
