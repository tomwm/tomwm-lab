import { db } from './db'

/**
 * One tab at a time may write to a timed session.
 *
 * Two tabs on the *same* session are the dangerous case, not the harmless one:
 * both would persist answers and both would try to submit. So the lock is held
 * per tab, and any other live tab is refused — it is told plainly and can take
 * over deliberately.
 *
 * The tab's identity lives in sessionStorage, which is per-tab and survives a
 * reload. That way refreshing during a module reclaims your own lock instead of
 * locking you out of your own session.
 */
const TAB_ID_KEY = 'tara-cards:tab-id'

function readTabId(): string {
  const fresh = `tab_${Math.random().toString(36).slice(2, 10)}`
  try {
    const existing = sessionStorage.getItem(TAB_ID_KEY)
    if (existing) return existing
    sessionStorage.setItem(TAB_ID_KEY, fresh)
  } catch {
    /* Private mode or blocked storage: a per-load id is still better than none. */
  }
  return fresh
}

export const TAB_ID = readTabId()

/** A lock whose heartbeat has stopped for this long belongs to a dead tab. */
const STALE_MS = 15_000
const HEARTBEAT_MS = 5_000

let heartbeat: ReturnType<typeof setInterval> | null = null

export type LockResult = { ok: true } | { ok: false; heldBy: string; sessionId: string }

export async function acquireLock(sessionId: string): Promise<LockResult> {
  const now = Date.now()
  const existing = await db.locks.get('active-session')

  if (existing && existing.tabId !== TAB_ID && now - existing.heartbeatAt <= STALE_MS) {
    return { ok: false, heldBy: existing.tabId, sessionId: existing.sessionId }
  }

  await db.locks.put({ id: 'active-session', sessionId, tabId: TAB_ID, heartbeatAt: now })
  startHeartbeat(sessionId)
  return { ok: true }
}

/** Deliberate takeover, after the learner has been told the session is open elsewhere. */
export async function stealLock(sessionId: string): Promise<void> {
  await db.locks.put({ id: 'active-session', sessionId, tabId: TAB_ID, heartbeatAt: Date.now() })
  startHeartbeat(sessionId)
}

export async function releaseLock(): Promise<void> {
  stopHeartbeat()
  const existing = await db.locks.get('active-session')
  if (existing?.tabId === TAB_ID) await db.locks.delete('active-session')
}

/** True when a different live tab currently holds the lock. */
export async function lockHeldElsewhere(): Promise<boolean> {
  const existing = await db.locks.get('active-session')
  if (!existing || existing.tabId === TAB_ID) return false
  return Date.now() - existing.heartbeatAt <= STALE_MS
}

function startHeartbeat(sessionId: string) {
  stopHeartbeat()
  heartbeat = setInterval(() => {
    void db.locks.put({
      id: 'active-session',
      sessionId,
      tabId: TAB_ID,
      heartbeatAt: Date.now(),
    })
  }, HEARTBEAT_MS)
}

function stopHeartbeat() {
  if (heartbeat) clearInterval(heartbeat)
  heartbeat = null
}
