import type { Exposure, ExposureReason } from './types'
import { newId } from './random'

export function buildExposure(args: {
  itemId: string
  duplicateGroupId: string
  reason: ExposureReason
  sessionId?: string | null
  at?: number
}): Exposure {
  return {
    id: newId('exp'),
    itemId: args.itemId,
    duplicateGroupId: args.duplicateGroupId,
    at: args.at ?? Date.now(),
    reason: args.reason,
    sessionId: args.sessionId ?? null,
  }
}

/** Every duplicate group the learner has met, for any reason. */
export function exposedGroupIds(exposures: readonly Exposure[]): Set<string> {
  return new Set(exposures.map((e) => e.duplicateGroupId))
}

/**
 * Groups already exposed *before* a moment in time. Used when a session starts,
 * so that questions first met inside the session still count as fresh.
 */
export function exposedGroupIdsBefore(
  exposures: readonly Exposure[],
  before: number,
): string[] {
  const set = new Set<string>()
  for (const e of exposures) if (e.at < before) set.add(e.duplicateGroupId)
  return [...set].sort()
}
