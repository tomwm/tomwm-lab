import type { Sport } from './garmin/normalize'

/** Colour follows the entity, never its rank: each sport always wears the same slot. */
export const SPORT_COLOR: Record<Sport, string> = {
  running: 'var(--s1)',
  strength: 'var(--s2)',
  cardio: 'var(--s3)',
  walking: 'var(--s4)',
  cycling: 'var(--s5)',
  swimming: 'var(--s6)',
  other: 'var(--s7)',
}

export const C = {
  training: 'var(--s1)',
  hrv: 'var(--s3)',
  heart: 'var(--s8)',
  sleep: 'var(--s7)',
  stress: 'var(--s2)',
  steps: 'var(--s1)',
  battery: 'var(--s3)',
}
