import { useEffect, useRef, useState } from 'react'
import { Dialog, Switch, Tooltip } from 'radix-ui'
import { MoonIcon, PlusIcon, SunIcon } from '@radix-ui/react-icons'
import type { AppState, Profile } from '../shared/types'
import {
  loadState,
  loadSyncError,
  loadTheme,
  onStateChanged,
  onSyncErrorChanged,
  saveState,
  saveTheme,
  uid,
  type Theme,
} from '../shared/storage'
import { profilesToRules } from '../shared/rules'
import { ProfilePanel } from './ProfilePanel'

function Logo() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden>
      <rect x="2" y="3" width="12" height="2.6" fill="var(--req)" />
      <rect x="2" y="7.7" width="9" height="2.6" fill="var(--res)" />
      <rect x="2" y="12.4" width="6" height="2.6" fill="var(--rdr)" />
    </svg>
  )
}

export function App() {
  const [state, setState] = useState<AppState | null>(null)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [syncError, setSyncError] = useState<string | null>(null)
  const [addOpen, setAddOpen] = useState(false)
  const [theme, setTheme] = useState<Theme>(() =>
    window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark',
  )
  const lastSaved = useRef('')

  useEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])

  useEffect(() => {
    void loadTheme().then((t) => t && setTheme(t))
  }, [])

  useEffect(() => {
    void loadState().then((s) => {
      lastSaved.current = JSON.stringify(s)
      setState(s)
      setActiveId(s.profiles[0]?.id ?? null)
    })
    void loadSyncError().then(setSyncError)
    const offState = onStateChanged((s) => {
      // ignore echoes of our own writes so typing is not disturbed
      if (JSON.stringify(s) !== lastSaved.current) setState(s)
    })
    const offErr = onSyncErrorChanged(setSyncError)
    return () => {
      offState()
      offErr()
    }
  }, [])

  if (!state) return null

  const update = (next: AppState) => {
    lastSaved.current = JSON.stringify(next)
    setState(next)
    void saveState(next)
  }

  const updateProfile = (p: Profile) =>
    update({ ...state, profiles: state.profiles.map((x) => (x.id === p.id ? p : x)) })

  const addProfile = (name: string, scope: string) => {
    const profile: Profile = {
      id: uid(),
      name: name.trim() || scope.trim() || 'untitled',
      enabled: true,
      scope: scope.trim(),
      requestHeaders: [{ id: uid(), enabled: true, op: 'set', name: '', value: '' }],
      responseHeaders: [],
      redirects: [],
    }
    update({ ...state, profiles: [...state.profiles, profile] })
    setActiveId(profile.id)
    setAddOpen(false)
  }

  const removeProfile = (id: string) => {
    const profiles = state.profiles.filter((p) => p.id !== id)
    update({ ...state, profiles })
    if (activeId === id) setActiveId(profiles[0]?.id ?? null)
  }

  const duplicateProfile = (p: Profile) => {
    const copy: Profile = {
      ...structuredClone(p),
      id: uid(),
      name: `${p.name} copy`,
      requestHeaders: p.requestHeaders.map((r) => ({ ...r, id: uid() })),
      responseHeaders: p.responseHeaders.map((r) => ({ ...r, id: uid() })),
      redirects: p.redirects.map((r) => ({ ...r, id: uid() })),
    }
    update({ ...state, profiles: [...state.profiles, copy] })
    setActiveId(copy.id)
  }

  const active = state.profiles.find((p) => p.id === activeId) ?? null
  const armed = profilesToRules(state).length

  return (
    <Tooltip.Provider delayDuration={300}>
      <div className="app">
        <header className="topbar">
          <div className="brand">
            <Logo />
            <div>
              <h1>HEADER EDITOR</h1>
              <p>PER-SITE HEADER CONTROL</p>
            </div>
          </div>
          <div className="topbar-right">
          <button
            className="icon-btn theme-btn"
            aria-label="Toggle light/dark theme"
            onClick={() => {
              const next: Theme = theme === 'dark' ? 'light' : 'dark'
              setTheme(next)
              void saveTheme(next)
            }}
          >
            {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
          </button>
          <Tooltip.Root>
            <Tooltip.Trigger asChild>
              <label className="master">
                <span className={state.paused ? 'master-label paused' : 'master-label'}>
                  {state.paused ? 'PAUSED' : 'LIVE'}
                </span>
                <MasterSwitch
                  checked={!state.paused}
                  onCheckedChange={(v) => update({ ...state, paused: !v })}
                />
              </label>
            </Tooltip.Trigger>
            <Tooltip.Portal>
              <Tooltip.Content className="tooltip" sideOffset={6}>
                Master switch — pausing removes every rule from the network layer
              </Tooltip.Content>
            </Tooltip.Portal>
          </Tooltip.Root>
          </div>
        </header>

        <nav className="chips">
          {state.profiles.map((p) => (
            <button
              key={p.id}
              className={`chip${p.id === activeId ? ' chip-active' : ''}`}
              onClick={() => setActiveId(p.id)}
            >
              <i className={`chip-dot${p.enabled ? ' on' : ''}`} />
              {p.name || 'untitled'}
            </button>
          ))}
          <Dialog.Root open={addOpen} onOpenChange={setAddOpen}>
            <Dialog.Trigger asChild>
              <button className="chip chip-add" aria-label="New profile">
                <PlusIcon /> NEW
              </button>
            </Dialog.Trigger>
            <AddProfileDialog onSubmit={addProfile} />
          </Dialog.Root>
        </nav>

        {active ? (
          <ProfilePanel
            profile={active}
            onChange={updateProfile}
            onDuplicate={() => duplicateProfile(active)}
            onDelete={() => removeProfile(active.id)}
          />
        ) : (
          <div className="empty empty-page">NO PROFILES — CREATE ONE TO BEGIN</div>
        )}

        <footer className="statusbar">
          {syncError ? (
            <>
              <i className="led led-err" />
              <span className="status-err" title={syncError}>
                RULE REJECTED — {syncError}
              </span>
            </>
          ) : (
            <>
              <i className={`led${state.paused || armed === 0 ? '' : ' led-live'}`} />
              <span>
                {state.paused
                  ? 'PAUSED — ALL TRAFFIC UNTOUCHED'
                  : armed === 0
                    ? 'IDLE — NO ACTIVE RULES'
                    : `${armed} RULE${armed > 1 ? 'S' : ''} ARMED`}
              </span>
            </>
          )}
          <span className="status-right">DNR·MV3</span>
        </footer>
      </div>
    </Tooltip.Provider>
  )
}

function MasterSwitch(props: { checked: boolean; onCheckedChange: (v: boolean) => void }) {
  return (
    <Switch.Root
      className="switch master-switch"
      checked={props.checked}
      onCheckedChange={props.onCheckedChange}
      aria-label="Master switch"
    >
      <Switch.Thumb className="switch-thumb" />
    </Switch.Root>
  )
}

function AddProfileDialog(props: { onSubmit: (name: string, scope: string) => void }) {
  const [name, setName] = useState('')
  const [scope, setScope] = useState('')
  const submit = () => {
    props.onSubmit(name, scope)
    setName('')
    setScope('')
  }
  return (
    <Dialog.Portal>
      <Dialog.Overlay className="dialog-overlay" />
      <Dialog.Content className="dialog-content">
        <Dialog.Title className="dialog-title">NEW PROFILE</Dialog.Title>
        <Dialog.Description className="dialog-desc">
          Rules in a profile only fire on URLs matching its scope — each site stays isolated.
        </Dialog.Description>
        <div className="labelled">
          <label>NAME</label>
          <input
            className="field"
            autoFocus
            spellCheck={false}
            placeholder="staging api"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
          />
        </div>
        <div className="labelled">
          <label>SCOPE — DOMAIN OR URL PATTERN, EMPTY = ALL SITES</label>
          <input
            className="field"
            spellCheck={false}
            placeholder="api.example.com"
            value={scope}
            onChange={(e) => setScope(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
          />
        </div>
        <div className="dialog-actions">
          <Dialog.Close asChild>
            <button className="btn">CANCEL</button>
          </Dialog.Close>
          <button className="btn btn-primary" onClick={submit}>
            CREATE
          </button>
        </div>
      </Dialog.Content>
    </Dialog.Portal>
  )
}
