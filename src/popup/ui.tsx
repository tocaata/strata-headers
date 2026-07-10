import { Select, Switch } from 'radix-ui'
import { CheckIcon, ChevronDownIcon } from '@radix-ui/react-icons'

export function Toggle(props: {
  checked: boolean
  onCheckedChange: (v: boolean) => void
  small?: boolean
  label?: string
}) {
  return (
    <Switch.Root
      className={`switch${props.small ? ' switch-sm' : ''}`}
      checked={props.checked}
      onCheckedChange={props.onCheckedChange}
      aria-label={props.label}
    >
      <Switch.Thumb className="switch-thumb" />
    </Switch.Root>
  )
}

export function OpSelect(props: {
  value: string
  options: { value: string; label: string }[]
  onValueChange: (v: string) => void
  ariaLabel: string
}) {
  return (
    <Select.Root value={props.value} onValueChange={props.onValueChange}>
      <Select.Trigger className="op-select" aria-label={props.ariaLabel}>
        <Select.Value />
        <Select.Icon className="op-select-icon">
          <ChevronDownIcon />
        </Select.Icon>
      </Select.Trigger>
      <Select.Portal>
        <Select.Content className="select-content" position="popper" sideOffset={4}>
          <Select.Viewport>
            {props.options.map((o) => (
              <Select.Item key={o.value} value={o.value} className="select-item">
                <Select.ItemText>{o.label}</Select.ItemText>
                <Select.ItemIndicator className="select-check">
                  <CheckIcon />
                </Select.ItemIndicator>
              </Select.Item>
            ))}
          </Select.Viewport>
        </Select.Content>
      </Select.Portal>
    </Select.Root>
  )
}

export const COMMON_HEADERS = [
  'Accept',
  'Accept-Language',
  'Access-Control-Allow-Headers',
  'Access-Control-Allow-Methods',
  'Access-Control-Allow-Origin',
  'Authorization',
  'Cache-Control',
  'Content-Security-Policy',
  'Content-Type',
  'Cookie',
  'Host',
  'If-None-Match',
  'Origin',
  'Pragma',
  'Referer',
  'Set-Cookie',
  'Strict-Transport-Security',
  'User-Agent',
  'X-Api-Key',
  'X-Forwarded-For',
  'X-Forwarded-Host',
  'X-Frame-Options',
  'X-Requested-With',
]
