export default function Loading() {
  return (
    <div className="mx-auto max-w-6xl px-4 pt-8 md:px-8" aria-busy="true" aria-label="Loading">
      <div className="skeleton mb-8 h-9 w-48" />
      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => <div key={i} className="skeleton h-40" />)}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="skeleton h-72" />
        <div className="skeleton h-72" />
      </div>
    </div>
  )
}
