const VARIANTS = {
  success: { bg: 'rgba(57,169,0,0.10)', color: '#2d8000', border: 'rgba(57,169,0,0.25)' },
  danger:  { bg: '#fee2e2',             color: '#dc2626', border: '#fecaca' },
  warning: { bg: '#fef3c7',             color: '#d97706', border: '#fde68a' },
  info:    { bg: '#eff6ff',             color: '#2563eb', border: '#bfdbfe' },
  default: { bg: '#f3f4f6',             color: '#6b7280', border: '#e5e7eb' },
}

export function Badge({ variant = 'default', children, style }) {
  const v = VARIANTS[variant] ?? VARIANTS.default

  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      fontSize: 11.5,
      fontWeight: 600,
      padding: '3px 9px',
      borderRadius: 20,
      border: `1px solid ${v.border}`,
      background: v.bg,
      color: v.color,
      whiteSpace: 'nowrap',
      ...style,
    }}>
      {children}
    </span>
  )
}
