import { useState } from 'react'

const SIZES = {
  sm: { height: 36, fontSize: 13, padding: '0 12px' },
  md: { height: 48, fontSize: 15, padding: '0 16px' },
}

export function AppSelect({ error, size = 'md', style, children, ...props }) {
  const [focused, setFocused] = useState(false)
  const s = SIZES[size] ?? SIZES.md

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <select
        {...props}
        onFocus={e => { setFocused(true); props.onFocus?.(e) }}
        onBlur={e => { setFocused(false); props.onBlur?.(e) }}
        style={{
          width: '100%',
          height: s.height,
          padding: s.padding,
          paddingRight: 36,
          fontSize: s.fontSize,
          fontFamily: 'inherit',
          background: focused ? '#fff' : '#F9FAF7',
          border: `1.5px solid ${error ? '#EF4444' : focused ? '#39A900' : '#E5E7EB'}`,
          borderRadius: 10,
          outline: 'none',
          transition: 'all 0.18s cubic-bezier(0.4,0,0.2,1)',
          boxShadow: focused ? '0 0 0 3px rgba(57,169,0,0.12)' : 'none',
          color: '#111827',
          appearance: 'none',
          boxSizing: 'border-box',
          cursor: 'pointer',
          ...style,
        }}
      >
        {children}
      </select>
      {/* Chevron icon */}
      <span style={{
        position: 'absolute',
        right: 12,
        top: '50%',
        transform: 'translateY(-50%)',
        pointerEvents: 'none',
        color: '#9CA3AF',
        display: 'flex',
      }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </span>
      {error && (
        <p style={{ fontSize: 12, color: '#EF4444', marginTop: 5, marginLeft: 2 }}>{error}</p>
      )}
    </div>
  )
}
