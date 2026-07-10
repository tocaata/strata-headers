export type HeaderOp = 'set' | 'append' | 'remove'

export interface HeaderRule {
  id: string
  enabled: boolean
  op: HeaderOp
  name: string
  value: string
}

export interface RedirectRule {
  id: string
  enabled: boolean
  /** When true, `pattern` is an RE2 regex and `destination` may use \1..\9. */
  isRegex: boolean
  pattern: string
  destination: string
}

/**
 * A profile is an isolated set of rules scoped to one site. `scope` is either
 * a bare domain ("api.example.com", matches all subdomains) or a
 * declarativeNetRequest urlFilter pattern ("*://staging.example.com/api/*").
 * Empty scope = every site.
 */
export interface Profile {
  id: string
  name: string
  enabled: boolean
  scope: string
  requestHeaders: HeaderRule[]
  responseHeaders: HeaderRule[]
  redirects: RedirectRule[]
}

export interface AppState {
  paused: boolean
  profiles: Profile[]
}

/** Mirrors chrome.declarativeNetRequest.Rule so shared code stays runnable outside the extension. */
export interface DNRRule {
  id: number
  priority: number
  action: {
    type: 'modifyHeaders' | 'redirect'
    requestHeaders?: { header: string; operation: HeaderOp; value?: string }[]
    responseHeaders?: { header: string; operation: HeaderOp; value?: string }[]
    redirect?: { url?: string; regexSubstitution?: string }
  }
  condition: {
    urlFilter?: string
    regexFilter?: string
    requestDomains?: string[]
    resourceTypes: string[]
  }
}
