import { useState } from 'react'
import { AlertDialog, DropdownMenu, Tabs } from 'radix-ui'
import {
  ArrowRightIcon,
  CopyIcon,
  Cross2Icon,
  DotsVerticalIcon,
  PlusIcon,
  TrashIcon,
} from '@radix-ui/react-icons'
import type { HeaderRule, Profile, RedirectRule } from '../shared/types'
import { uid } from '../shared/storage'
import { COMMON_HEADERS, OpSelect, Toggle } from './ui'

const OP_OPTIONS = [
  { value: 'set', label: 'SET' },
  { value: 'append', label: 'APPEND' },
  { value: 'remove', label: 'REMOVE' },
]

function HeaderRow(props: {
  rule: HeaderRule
  onChange: (r: HeaderRule) => void
  onDelete: () => void
}) {
  const { rule } = props
  return (
    <div className={`rule-row${rule.enabled ? '' : ' rule-off'}`}>
      <Toggle
        small
        checked={rule.enabled}
        onCheckedChange={(enabled) => props.onChange({ ...rule, enabled })}
        label="Enable rule"
      />
      <OpSelect
        value={rule.op}
        options={OP_OPTIONS}
        onValueChange={(op) => props.onChange({ ...rule, op: op as HeaderRule['op'] })}
        ariaLabel="Operation"
      />
      <input
        className="field"
        placeholder="Header-Name"
        list="common-headers"
        spellCheck={false}
        value={rule.name}
        onChange={(e) => props.onChange({ ...rule, name: e.target.value })}
      />
      {rule.op !== 'remove' ? (
        <input
          className="field field-value"
          placeholder="value"
          spellCheck={false}
          value={rule.value}
          onChange={(e) => props.onChange({ ...rule, value: e.target.value })}
        />
      ) : (
        <span className="field-ghost">— header stripped —</span>
      )}
      <button className="icon-btn" onClick={props.onDelete} aria-label="Delete rule">
        <TrashIcon />
      </button>
    </div>
  )
}

function HeaderList(props: {
  kind: 'request' | 'response'
  rules: HeaderRule[]
  onChange: (rules: HeaderRule[]) => void
}) {
  const { rules, onChange } = props
  return (
    <div className="rule-list">
      {rules.length === 0 && (
        <div className="empty">NO {props.kind.toUpperCase()} RULES — TRAFFIC PASSES UNTOUCHED</div>
      )}
      {rules.map((r) => (
        <HeaderRow
          key={r.id}
          rule={r}
          onChange={(next) => onChange(rules.map((x) => (x.id === r.id ? next : x)))}
          onDelete={() => onChange(rules.filter((x) => x.id !== r.id))}
        />
      ))}
      <button
        className="add-btn"
        onClick={() =>
          onChange([...rules, { id: uid(), enabled: true, op: 'set', name: '', value: '' }])
        }
      >
        <PlusIcon /> ADD {props.kind.toUpperCase()} HEADER
      </button>
    </div>
  )
}

function RedirectRow(props: {
  rule: RedirectRule
  onChange: (r: RedirectRule) => void
  onDelete: () => void
}) {
  const { rule } = props
  return (
    <div className={`rule-row redirect-row${rule.enabled ? '' : ' rule-off'}`}>
      <Toggle
        small
        checked={rule.enabled}
        onCheckedChange={(enabled) => props.onChange({ ...rule, enabled })}
        label="Enable redirect"
      />
      <button
        className={`re-toggle${rule.isRegex ? ' re-on' : ''}`}
        title={rule.isRegex ? 'Regex match (\\1..\\9 in target)' : 'URL filter match (* wildcards)'}
        onClick={() => props.onChange({ ...rule, isRegex: !rule.isRegex })}
      >
        .*
      </button>
      <input
        className="field"
        placeholder={rule.isRegex ? '^https://old\\.example\\.com/(.*)' : '*://old.example.com/*'}
        spellCheck={false}
        value={rule.pattern}
        onChange={(e) => props.onChange({ ...rule, pattern: e.target.value })}
      />
      <span className="arrow">
        <ArrowRightIcon />
      </span>
      <input
        className="field field-value"
        placeholder={rule.isRegex ? 'https://new.example.com/\\1' : 'https://new.example.com/'}
        spellCheck={false}
        value={rule.destination}
        onChange={(e) => props.onChange({ ...rule, destination: e.target.value })}
      />
      <button className="icon-btn" onClick={props.onDelete} aria-label="Delete redirect">
        <TrashIcon />
      </button>
    </div>
  )
}

function RedirectList(props: {
  rules: RedirectRule[]
  onChange: (rules: RedirectRule[]) => void
}) {
  const { rules, onChange } = props
  return (
    <div className="rule-list">
      {rules.length === 0 && <div className="empty">NO REDIRECTS — URLS LEFT AS-IS</div>}
      {rules.map((r) => (
        <RedirectRow
          key={r.id}
          rule={r}
          onChange={(next) => onChange(rules.map((x) => (x.id === r.id ? next : x)))}
          onDelete={() => onChange(rules.filter((x) => x.id !== r.id))}
        />
      ))}
      <button
        className="add-btn"
        onClick={() =>
          onChange([
            ...rules,
            { id: uid(), enabled: true, isRegex: false, pattern: '', destination: '' },
          ])
        }
      >
        <PlusIcon /> ADD REDIRECT
      </button>
    </div>
  )
}

export function ProfilePanel(props: {
  profile: Profile
  onChange: (p: Profile) => void
  onDuplicate: () => void
  onDelete: () => void
}) {
  const { profile, onChange } = props
  const [tab, setTab] = useState('request')
  const counts = {
    request: profile.requestHeaders.filter((r) => r.enabled && r.name.trim()).length,
    response: profile.responseHeaders.filter((r) => r.enabled && r.name.trim()).length,
    redirect: profile.redirects.filter((r) => r.enabled && r.pattern.trim()).length,
  }

  return (
    <section className="panel">
      <div className="scope-row">
        <div className="labelled labelled-name">
          <label>PROFILE</label>
          <input
            className="field"
            spellCheck={false}
            value={profile.name}
            onChange={(e) => onChange({ ...profile, name: e.target.value })}
          />
        </div>
        <div className="labelled labelled-scope">
          <label>SCOPE — DOMAIN OR URL PATTERN, EMPTY = ALL SITES</label>
          <input
            className="field scope-field"
            placeholder="api.example.com  ·  *://*.example.com/api/*"
            spellCheck={false}
            value={profile.scope}
            onChange={(e) => onChange({ ...profile, scope: e.target.value })}
          />
        </div>
        <div className="scope-actions">
          <Toggle
            checked={profile.enabled}
            onCheckedChange={(enabled) => onChange({ ...profile, enabled })}
            label="Enable profile"
          />
          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <button className="icon-btn" aria-label="Profile actions">
                <DotsVerticalIcon />
              </button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
              <DropdownMenu.Content className="menu-content" align="end" sideOffset={4}>
                <DropdownMenu.Item className="menu-item" onSelect={props.onDuplicate}>
                  <CopyIcon /> DUPLICATE
                </DropdownMenu.Item>
                <DropdownMenu.Item
                  className="menu-item"
                  onSelect={() => navigator.clipboard.writeText(JSON.stringify(profile, null, 2))}
                >
                  <ArrowRightIcon /> COPY JSON
                </DropdownMenu.Item>
                <DropdownMenu.Separator className="menu-sep" />
                <DeleteItem name={profile.name} onDelete={props.onDelete} />
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
        </div>
      </div>

      <Tabs.Root value={tab} onValueChange={setTab} className="tabs">
        <Tabs.List className="tabs-list" aria-label="Rule categories">
          <Tabs.Trigger value="request" className="tab tab-req">
            <i className="led" /> REQUEST {counts.request > 0 && <b>{counts.request}</b>}
          </Tabs.Trigger>
          <Tabs.Trigger value="response" className="tab tab-res">
            <i className="led" /> RESPONSE {counts.response > 0 && <b>{counts.response}</b>}
          </Tabs.Trigger>
          <Tabs.Trigger value="redirect" className="tab tab-rdr">
            <i className="led" /> REDIRECT {counts.redirect > 0 && <b>{counts.redirect}</b>}
          </Tabs.Trigger>
        </Tabs.List>
        <Tabs.Content value="request" className="tab-body">
          <HeaderList
            kind="request"
            rules={profile.requestHeaders}
            onChange={(requestHeaders) => onChange({ ...profile, requestHeaders })}
          />
        </Tabs.Content>
        <Tabs.Content value="response" className="tab-body">
          <HeaderList
            kind="response"
            rules={profile.responseHeaders}
            onChange={(responseHeaders) => onChange({ ...profile, responseHeaders })}
          />
        </Tabs.Content>
        <Tabs.Content value="redirect" className="tab-body">
          <RedirectList
            rules={profile.redirects}
            onChange={(redirects) => onChange({ ...profile, redirects })}
          />
        </Tabs.Content>
      </Tabs.Root>

      <datalist id="common-headers">
        {COMMON_HEADERS.map((h) => (
          <option key={h} value={h} />
        ))}
      </datalist>
    </section>
  )
}

function DeleteItem(props: { name: string; onDelete: () => void }) {
  return (
    <AlertDialog.Root>
      <AlertDialog.Trigger asChild>
        <DropdownMenu.Item className="menu-item menu-danger" onSelect={(e) => e.preventDefault()}>
          <Cross2Icon /> DELETE
        </DropdownMenu.Item>
      </AlertDialog.Trigger>
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="dialog-overlay" />
        <AlertDialog.Content className="dialog-content">
          <AlertDialog.Title className="dialog-title">DELETE PROFILE</AlertDialog.Title>
          <AlertDialog.Description className="dialog-desc">
            “{props.name}” and all of its rules will be removed. This cannot be undone.
          </AlertDialog.Description>
          <div className="dialog-actions">
            <AlertDialog.Cancel asChild>
              <button className="btn">CANCEL</button>
            </AlertDialog.Cancel>
            <AlertDialog.Action asChild>
              <button className="btn btn-danger" onClick={props.onDelete}>
                DELETE
              </button>
            </AlertDialog.Action>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  )
}
