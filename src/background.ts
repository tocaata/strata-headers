import { profilesToRules } from './shared/rules'
import { defaultState, loadState } from './shared/storage'

async function sync(): Promise<void> {
  const state = await loadState()
  const rules = profilesToRules(state)
  const existing = await chrome.declarativeNetRequest.getDynamicRules()
  try {
    await chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: existing.map((r) => r.id),
      addRules: rules as unknown as chrome.declarativeNetRequest.Rule[],
    })
    await chrome.storage.local.remove('syncError')
  } catch (err) {
    // A bad pattern (e.g. malformed regex) rejects the whole batch — surface
    // it in the popup instead of failing silently.
    await chrome.storage.local.set({ syncError: String(err instanceof Error ? err.message : err) })
    return
  }

  const text = state.paused || rules.length === 0 ? '' : String(rules.length)
  await chrome.action.setBadgeText({ text })
  await chrome.action.setBadgeBackgroundColor({ color: '#FFB224' })
  await chrome.action.setBadgeTextColor({ color: '#111318' })
}

chrome.runtime.onInstalled.addListener(async () => {
  const stored = await chrome.storage.local.get('state')
  if (!stored.state) await chrome.storage.local.set({ state: defaultState() })
  await sync()
})

chrome.runtime.onStartup.addListener(() => void sync())

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && changes.state) void sync()
})
