export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const params = await searchParams;
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm bg-surface border border-border rounded-xl p-8 shadow-sm">
        <h1 className="text-xl font-serif font-semibold text-foreground mb-1">RevisionLab</h1>
        <p className="text-sm text-foreground-muted mb-6">Enter the passcode to continue.</p>
        {/* A plain form action isn't prefixed by basePath, so add it by hand. */}
        <form method="POST" action={`${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/login`} className="space-y-4">
          <input type="hidden" name="next" value={params.next ?? "/"} />
          <input
            type="password"
            name="passcode"
            autoFocus
            className="w-full rounded-md border border-border px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="Passcode"
          />
          {params.error && <p className="text-sm text-danger">That passcode wasn&apos;t right.</p>}
          <button
            type="submit"
            className="w-full rounded-md bg-primary text-primary-foreground py-2 text-sm font-medium hover:opacity-90"
          >
            Enter
          </button>
        </form>
      </div>
    </div>
  );
}
