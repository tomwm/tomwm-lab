/** 'BALANCED' / 'POOR_SLEEP' -> 'Balanced' / 'Poor sleep'. */
export function label(key: string | null | undefined): string | null {
  if (!key) return null
  const s = key.replace(/_/g, ' ').toLowerCase()
  return s.charAt(0).toUpperCase() + s.slice(1)
}
