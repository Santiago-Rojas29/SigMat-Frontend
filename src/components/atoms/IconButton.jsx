import { useState } from 'react'

const VARIANTS = {
  edit:    { idle: { bg: '#f0f8e8', color: '#39A900' }, hover: { bg: '#e4f5cc', color: '#2d8000' } },
  delete:  { idle: { bg: '#fee2e2', color: '#dc2626' }, hover: { bg: '#fecaca', color: '#b91c1c' } },
  default: { idle: { bg: '#f3f4f6', color: '#6b7280' }, hover: { bg: '#e5e7eb', color: '#374151' } },
}

export function IconButton({ variant = 'default', children, title, onClick, size = 32, disabled }) {
  const [hovered, setHovered] = useState(false)
  const v = VARIANTS[variant] ?? VARIANTS.default
  const s = hovered && !disabled ? v.hover : v.idle

  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: size,
        height: size,
        borderRadius: 8,
        border: 'none',
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'background 0.15s, color 0.15s',
        background: s.bg,
        color: s.color,
        opacity: disabled ? 0.5 : 1,
        flexShrink: 0,
      }}
    >
      {children}
    </button>
  )
}
