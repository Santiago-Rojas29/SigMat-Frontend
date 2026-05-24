import type { ButtonHTMLAttributes, ReactNode } from 'react'

interface AppButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
  loading?: boolean
  variant?: 'primary' | 'outline' | 'ghost'
  fullWidth?: boolean
}

export function AppButton({ children, loading, variant = 'primary', fullWidth, className = '', style, ...props }: AppButtonProps) {
  const base: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    fontFamily: 'inherit',
    fontWeight: 600,
    fontSize: 15,
    letterSpacing: '-0.1px',
    padding: '12px 24px',
    borderRadius: 10,
    border: 'none',
    cursor: props.disabled || loading ? 'not-allowed' : 'pointer',
    transition: 'all 0.18s cubic-bezier(0.4,0,0.2,1)',
    width: fullWidth ? '100%' : undefined,
    opacity: props.disabled || loading ? 0.65 : 1,
    ...style,
  }

  const variants: Record<string, React.CSSProperties> = {
    primary: {
      background: 'linear-gradient(135deg, #39A900 0%, #2e8a00 100%)',
      color: '#fff',
      boxShadow: '0 2px 12px rgba(57, 169, 0, 0.35)',
    },
    outline: {
      background: 'transparent',
      color: '#39A900',
      border: '1.5px solid #39A900',
    },
    ghost: {
      background: 'transparent',
      color: '#6B7280',
    },
  }

  return (
    <button
      {...props}
      disabled={props.disabled || loading}
      className={className}
      style={{ ...base, ...variants[variant] }}
    >
      {loading ? (
        <>
          <span
            style={{
              width: 16, height: 16, border: '2px solid rgba(255,255,255,0.4)',
              borderTopColor: '#fff', borderRadius: '50%',
              animation: 'spin 0.7s linear infinite',
              display: 'inline-block',
            }}
          />
          Cargando...
        </>
      ) : children}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </button>
  )
}
