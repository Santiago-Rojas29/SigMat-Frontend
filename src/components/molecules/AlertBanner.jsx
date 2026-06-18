import { AppIcon } from '../atoms/AppIcon'

const VARIANTS = {
  error:   { bg: '#FEF2F2', border: '#FECACA', color: '#DC2626', iconColor: '#DC2626' },
  success: { bg: '#F0FDF4', border: '#BBF7D0', color: '#15803D', iconColor: '#22C55E' },
  warning: { bg: '#FFFBEB', border: '#FDE68A', color: '#D97706', iconColor: '#F59E0B' },
  info:    { bg: '#EFF6FF', border: '#BFDBFE', color: '#1D4ED8', iconColor: '#3B82F6' },
}

const ICON_NAME = {
  error:   'info',
  success: 'check',
  warning: 'warn',
  info:    'info',
}

export function AlertBanner({ variant = 'error', children }) {
  const v = VARIANTS[variant] ?? VARIANTS.error

  return (
    <div
      className="d-flex align-items-start gap-2"
      style={{
        padding: '10px 14px',
        borderRadius: 8,
        background: v.bg,
        border: `1px solid ${v.border}`,
        color: v.color,
        fontSize: 13,
      }}
    >
      <span style={{ flexShrink: 0, marginTop: 1, color: v.iconColor, display: 'flex' }}>
        <AppIcon name={ICON_NAME[variant] ?? 'info'} size={15} />
      </span>
      <span>{children}</span>
    </div>
  )
}
