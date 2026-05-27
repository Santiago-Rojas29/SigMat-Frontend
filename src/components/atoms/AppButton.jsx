const VARIANTS = {
  primary: {
    background: 'linear-gradient(135deg, #39A900 0%, #2e8a00 100%)',
    color: '#fff',
    boxShadow: '0 2px 12px rgba(57,169,0,0.35)',
    hoverBg: 'linear-gradient(135deg, #2e8a00 0%, #267500 100%)',
  },
  outline: {
    background: 'transparent',
    color: '#39A900',
    border: '1.5px solid #39A900',
    hoverBg: 'rgba(57,169,0,0.06)',
  },
  ghost: {
    background: '#f3f4f6',
    color: '#374151',
    hoverBg: '#e5e7eb',
  },
  danger: {
    background: '#fee2e2',
    color: '#dc2626',
    hoverBg: '#fecaca',
  },
}

const SIZES = {
  sm:      { padding: '6px 12px',  fontSize: 12.5, borderRadius: 8,  height: 'auto' },
  md:      { padding: '12px 24px', fontSize: 15,   borderRadius: 10, height: 'auto' },
  compact: { padding: '8px 14px',  fontSize: 13.5, borderRadius: 8,  height: 'auto' },
}

export function AppButton({
  children,
  loading,
  variant = 'primary',
  size = 'md',
  fullWidth,
  style,
  onClick,
  type = 'button',
  disabled,
  ...props
}) {
  const v = VARIANTS[variant] ?? VARIANTS.primary
  const s = SIZES[size] ?? SIZES.md

  const base = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    fontFamily: 'inherit',
    fontWeight: 600,
    letterSpacing: '-0.1px',
    border: v.border ?? 'none',
    cursor: disabled || loading ? 'not-allowed' : 'pointer',
    transition: 'all 0.18s cubic-bezier(0.4,0,0.2,1)',
    width: fullWidth ? '100%' : undefined,
    opacity: disabled || loading ? 0.65 : 1,
    whiteSpace: 'nowrap',
    ...s,
    background: v.background,
    color: v.color,
    boxShadow: v.boxShadow,
    ...style,
  }

  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      onMouseEnter={e => {
        if (!disabled && !loading && v.hoverBg) e.currentTarget.style.background = v.hoverBg
      }}
      onMouseLeave={e => {
        if (!disabled && !loading) e.currentTarget.style.background = v.background
      }}
      style={base}
      {...props}
    >
      {loading ? (
        <>
          <span style={{
            width: 14, height: 14,
            border: '2px solid rgba(255,255,255,0.4)',
            borderTopColor: '#fff',
            borderRadius: '50%',
            animation: 'spin 0.7s linear infinite',
            display: 'inline-block',
            flexShrink: 0,
          }} />
          Cargando...
        </>
      ) : children}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </button>
  )
}
