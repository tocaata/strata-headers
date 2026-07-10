import type { AppState, Profile } from './types'

const KEY = 'state'
const hasChrome = typeof chrome !== 'undefined' && !!chrome.storage?.local

export function uid(): string {
  return crypto.randomUUID().slice(0, 8)
}

export function sampleProfile(): Profile {
  return {
    id: uid(),
    name: 'example.com',
    enabled: false,
    scope: 'example.com',
    requestHeaders: [
      { id: uid(), enabled: true, op: 'set', name: 'X-Debug', value: '1' },
    ],
    responseHeaders: [
      { id: uid(), enabled: true, op: 'set', name: 'Access-Control-Allow-Origin', value: '*' },
    ],
    redirects: [],
  }
}

export function defaultState(): AppState {
  return { paused: false, profiles: [sampleProfile()] }
}

export async function loadState(): Promise<AppState> {
  if (hasChrome) {
    const res = await chrome.storage.local.get(KEY)
    return (res[KEY] as AppState | undefined) ?? defaultState()
  }
  const raw = localStorage.getItem(KEY)
  return raw ? (JSON.parse(raw) as AppState) : defaultState()
}

export async function saveState(state: AppState): Promise<void> {
  if (hasChrome) {
    await chrome.storage.local.set({ [KEY]: state })
  } else {
    localStorage.setItem(KEY, JSON.stringify(state))
  }
}

export function onStateChanged(cb: (state: AppState) => void): () => void {
  if (!hasChrome) return () => {}
  const listener = (changes: Record<string, chrome.storage.StorageChange>, area: string) => {
    if (area === 'local' && changes[KEY]?.newValue) cb(changes[KEY].newValue as AppState)
  }
  chrome.storage.onChanged.addListener(listener)
  return () => chrome.storage.onChanged.removeListener(listener)
}

/** Last declarativeNetRequest sync error reported by the background worker. */
export async function loadSyncError(): Promise<string | null> {
  if (!hasChrome) return null
  const res = await chrome.storage.local.get('syncError')
  return (res.syncError as string | undefined) ?? null
}

export function onSyncErrorChanged(cb: (err: string | null) => void): () => void {
  if (!hasChrome) return () => {}
  const listener = (changes: Record<string, chrome.storage.StorageChange>, area: string) => {
    if (area === 'local' && 'syncError' in changes) cb((changes.syncError.newValue as string | undefined) ?? null)
  }
  chrome.storage.onChanged.addListener(listener)
  return () => chrome.storage.onChanged.removeListener(listener)
}
