import './AppButton.css'

const VARIANT_CLASS = {
  primary: 'btn-sena',
  outline: 'btn-sena-outline',
  ghost:   'btn-sena-ghost',
  danger:  'btn-sena-danger',
}

const SIZE_CLASS = {
  sm:      'btn-sm',
  md:      '',
  compact: 'btn-compact',
}

export function AppButton({
  children,
  loading,
  variant = 'primary',
  size    = 'md',
  fullWidth,
  className = '',
  style,
  onClick,
  type = 'button',
  disabled,
  ...props
}) {
  const variantCls = VARIANT_CLASS[variant] ?? VARIANT_CLASS.primary
  const sizeCls    = SIZE_CLASS[size] ?? ''

  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={`btn ${variantCls} ${sizeCls} ${fullWidth ? 'w-100' : ''} ${className}`.trim()}
      style={style}
      {...props}
    >
      {loading ? (
        <>
          <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true" />
          Cargando...
        </>
      ) : children}
    </button>
  )
}
