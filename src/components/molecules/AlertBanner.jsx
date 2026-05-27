const VARIANTS = {
  error:   { bg: '#FEF2F2', border: '#FECACA', color: '#DC2626', iconColor: '#DC2626' },
  success: { bg: '#F0FDF4', border: '#BBF7D0', color: '#15803D', iconColor: '#22C55E' },
  warning: { bg: '#FFFBEB', border: '#FDE68A', color: '#D97706', iconColor: '#F59E0B' },
  info:    { bg: '#EFF6FF', border: '#BFDBFE', color: '#1D4ED8', iconColor: '#3B82F6' },
}

const ICONS = {
  error:   <><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></>,
  success: <><polyline points="20 6 9 17 4 12"/></>,
  warning: <><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></>,
  info:    <><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></>,
}

export function AlertBanner({ variant = 'error', children }) {
  const v = VARIANTS[variant] ?? VARIANTS.error

  return (
    <div style={{
      display: 'flex',
      gap: 10,
      alignItems: 'flex-start',
      padding: '10px 14px',
      borderRadius: 8,
      background: v.bg,
      border: `1px solid ${v.border}`,
      color: v.color,
      fontSize: 13,
    }}>
      <svg
        width="15" height="15"
        viewBox="0 0 24 24"
        fill="none"
        stroke={v.iconColor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ flexShrink: 0, marginTop: 1 }}
      >
        {ICONS[variant] ?? ICONS.error}
      </svg>
      <span>{children}</span>
    </div>
  )
}
