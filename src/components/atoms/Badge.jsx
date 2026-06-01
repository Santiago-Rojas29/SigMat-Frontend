import './Badge.css'

const VARIANT_CLASS = {
  success: 'badge-sena-success',
  danger:  'badge-sena-danger',
  warning: 'badge-sena-warning',
  info:    'badge-sena-info',
  default: 'badge-sena-default',
}

export function Badge({ variant = 'default', children, className = '', style }) {
  const cls = VARIANT_CLASS[variant] ?? VARIANT_CLASS.default
  return (
    <span className={`badge ${cls} ${className}`} style={style}>
      {children}
    </span>
  )
}
