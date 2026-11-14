import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { buildContentIndex, buildCoverageReport, type ContentIndex } from '@/content/library'
import { db, getPreferences, savePreferences } from '@/storage/db'
import { DEFAULT_PREFERENCES } from '@/storage/db'
import type { Preferences } from '@/domain/types'

interface AppValue {
  content: ContentIndex
  coverage: ReturnType<typeof buildCoverageReport>
  prefs: Preferences
  setPrefs: (patch: Partial<Preferences>) => Promise<void>
  /** True until the first read of preferences and packs has come back. */
  ready: boolean
}

const AppCtx = createContext<AppValue | null>(null)

/**
 * Packs dropped into content-packs/ on this machine. That folder is gitignored,
 * so imported papers never reach the repository or a deploy built from it.
 */
const LOCAL_PACK_URLS = Object.values(
  import.meta.glob<string>('../../content-packs/*.json', { query: '?url', import: 'default', eager: true }),
)

/** Fetched at runtime rather than bundled: the imported papers run to tens of MB. */
async function loadLocalPacks(): Promise<unknown[]> {
  const results = await Promise.allSettled(
    LOCAL_PACK_URLS.map((url) => fetch(url).then((r) => (r.ok ? r.json() : Promise.reject(r.status)))),
  )
  return results.flatMap((r) => (r.status === 'fulfilled' ? [r.value] : []))
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [prefs, setPrefsState] = useState<Preferences>(DEFAULT_PREFERENCES)
  const [prefsLoaded, setPrefsLoaded] = useState(false)

  const packs = useLiveQuery(() => db.packs.toArray(), [], undefined)
  const [localPacks, setLocalPacks] = useState<unknown[] | null>(LOCAL_PACK_URLS.length ? null : [])

  useEffect(() => {
    if (!LOCAL_PACK_URLS.length) return
    void loadLocalPacks().then(setLocalPacks)
  }, [])

  useEffect(() => {
    void getPreferences().then((p) => {
      setPrefsState(p)
      setPrefsLoaded(true)
    })
  }, [])

  const setPrefs = useCallback(async (patch: Partial<Preferences>) => {
    setPrefsState(await savePreferences(patch))
  }, [])

  const content = useMemo(
    () => buildContentIndex([...(localPacks ?? []), ...(packs ?? []).map((p) => p.raw)]),
    [packs, localPacks],
  )
  const coverage = useMemo(() => buildCoverageReport(content), [content])

  // Theme and motion are applied on the document element so CSS tokens switch.
  useEffect(() => {
    const root = document.documentElement
    const apply = () => {
      const dark =
        prefs.theme === 'dark' ||
        (prefs.theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
      root.dataset.theme = dark ? 'dark' : 'light'
    }
    apply()
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [prefs.theme])

  useEffect(() => {
    document.documentElement.dataset.reducedMotion = prefs.reducedMotion ? 'true' : 'false'
  }, [prefs.reducedMotion])

  const value = useMemo(
    () => ({ content, coverage, prefs, setPrefs, ready: prefsLoaded && packs !== undefined && localPacks !== null }),
    [content, coverage, prefs, setPrefs, prefsLoaded, packs, localPacks],
  )

  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>
}

export function useApp(): AppValue {
  const ctx = useContext(AppCtx)
  if (!ctx) throw new Error('useApp must be used inside AppProvider')
  return ctx
}

export function useContentIndex(): ContentIndex {
  return useApp().content
}
