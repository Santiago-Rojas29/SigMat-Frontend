import './IconButton.css'

const VARIANT_CLASS = {
  edit:    'icon-btn-edit',
  delete:  'icon-btn-delete',
  default: 'icon-btn-default',
}

export function IconButton({ variant = 'default', children, title, onClick, size = 32, disabled, className = '', style }) {
  const cls = VARIANT_CLASS[variant] ?? VARIANT_CLASS.default
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      disabled={disabled}
      className={`btn icon-btn ${cls} ${className}`}
      style={{ width: size, height: size, ...style }}
    >
      {children}
    </button>
  )
}
