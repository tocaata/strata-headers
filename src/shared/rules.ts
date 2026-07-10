import type { AppState, DNRRule, HeaderRule, Profile } from './types'

const ALL_RESOURCE_TYPES = [
  'main_frame',
  'sub_frame',
  'stylesheet',
  'script',
  'image',
  'font',
  'object',
  'xmlhttprequest',
  'ping',
  'csp_report',
  'media',
  'websocket',
  'other',
]

const BARE_DOMAIN = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/i

/**
 * Translate a profile scope into a DNR condition. A bare domain becomes
 * `requestDomains` (also matches subdomains); anything else is passed through
 * as a urlFilter pattern; empty means "all sites".
 */
export function scopeCondition(scope: string): Pick<DNRRule['condition'], 'requestDomains' | 'urlFilter'> {
  const s = scope.trim()
  if (!s) return {}
  if (BARE_DOMAIN.test(s)) return { requestDomains: [s.toLowerCase()] }
  return { urlFilter: s }
}

function activeHeaders(rules: HeaderRule[]) {
  return rules
    .filter((r) => r.enabled && r.name.trim())
    .map((r) => ({
      header: r.name.trim(),
      operation: r.op,
      ...(r.op === 'remove' ? {} : { value: r.value }),
    }))
}

function profileRules(profile: Profile, nextId: () => number): DNRRule[] {
  const out: DNRRule[] = []
  const scope = scopeCondition(profile.scope)

  const requestHeaders = activeHeaders(profile.requestHeaders)
  const responseHeaders = activeHeaders(profile.responseHeaders)
  if (requestHeaders.length || responseHeaders.length) {
    out.push({
      id: nextId(),
      priority: 1,
      action: {
        type: 'modifyHeaders',
        ...(requestHeaders.length ? { requestHeaders } : {}),
        ...(responseHeaders.length ? { responseHeaders } : {}),
      },
      condition: { ...scope, resourceTypes: ALL_RESOURCE_TYPES },
    })
  }

  for (const r of profile.redirects) {
    if (!r.enabled || !r.pattern.trim() || !r.destination.trim()) continue
    const pattern = r.pattern.trim()
    const destination = r.destination.trim()
    out.push({
      id: nextId(),
      priority: 2,
      action: {
        type: 'redirect',
        redirect: r.isRegex ? { regexSubstitution: destination } : { url: destination },
      },
      condition: {
        // The redirect's own pattern does the URL matching; the profile scope
        // still applies when it is a domain, keeping the rule site-isolated.
        ...(scope.requestDomains ? { requestDomains: scope.requestDomains } : {}),
        ...(r.isRegex ? { regexFilter: pattern } : { urlFilter: pattern }),
        resourceTypes: ALL_RESOURCE_TYPES,
      },
    })
  }

  return out
}

export function profilesToRules(state: AppState): DNRRule[] {
  if (state.paused) return []
  let id = 0
  const nextId = () => ++id
  return state.profiles.filter((p) => p.enabled).flatMap((p) => profileRules(p, nextId))
}

/** Count of rules a single profile would contribute (ignoring pause/enable). */
export function countProfileRules(profile: Profile): number {
  let id = 0
  return profileRules(profile, () => ++id).length
}
