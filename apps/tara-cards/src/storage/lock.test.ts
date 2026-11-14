import { beforeEach, describe, expect, it } from 'vitest'
import { db } from './db'
import { TAB_ID, acquireLock, lockHeldElsewhere, releaseLock, stealLock } from './lock'

beforeEach(async () => {
  await db.locks.clear()
  await releaseLock()
})

describe('single active timed session across tabs', () => {
  it('grants the lock when nothing holds it', async () => {
    expect(await acquireLock('ses1')).toEqual({ ok: true })
  })

  it('refuses a second live tab on the SAME session', async () => {
    await db.locks.put({
      id: 'active-session',
      sessionId: 'ses1',
      tabId: 'another-tab',
      heartbeatAt: Date.now(),
    })
    const result = await acquireLock('ses1')
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.heldBy).toBe('another-tab')
  })

  it('refuses a second live tab on a different session too', async () => {
    await db.locks.put({
      id: 'active-session',
      sessionId: 'ses1',
      tabId: 'another-tab',
      heartbeatAt: Date.now(),
    })
    expect((await acquireLock('ses2')).ok).toBe(false)
  })

  it('lets the same tab reacquire, so a refresh is not locked out of its own session', async () => {
    await acquireLock('ses1')
    expect(await acquireLock('ses1')).toEqual({ ok: true })
    expect((await db.locks.get('active-session'))?.tabId).toBe(TAB_ID)
  })

  it('takes over a lock whose tab stopped heartbeating', async () => {
    await db.locks.put({
      id: 'active-session',
      sessionId: 'ses1',
      tabId: 'dead-tab',
      heartbeatAt: Date.now() - 60_000,
    })
    expect(await acquireLock('ses1')).toEqual({ ok: true })
  })

  it('allows a deliberate takeover', async () => {
    await db.locks.put({
      id: 'active-session',
      sessionId: 'ses1',
      tabId: 'another-tab',
      heartbeatAt: Date.now(),
    })
    await stealLock('ses1')
    expect((await db.locks.get('active-session'))?.tabId).toBe(TAB_ID)
    expect(await lockHeldElsewhere()).toBe(false)
  })

  it('releases only its own lock', async () => {
    await db.locks.put({
      id: 'active-session',
      sessionId: 'ses1',
      tabId: 'another-tab',
      heartbeatAt: Date.now(),
    })
    await releaseLock()
    expect(await db.locks.get('active-session')).toBeDefined()
  })
})
