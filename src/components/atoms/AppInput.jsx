import { forwardRef, useState } from 'react'

const SIZES = {
  sm: { height: 36, fontSize: 13,   iconLeft: 10, iconRight: 10, padLeft: 12, padLeftIcon: 34 },
  md: { height: 48, fontSize: 15,   iconLeft: 14, iconRight: 12, padLeft: 16, padLeftIcon: 44 },
}

export const AppInput = forwardRef(function AppInput(
  { icon, rightIcon, onRightIconClick, error, size = 'md', style, ...props },
  ref
) {
  const [focused, setFocused] = useState(false)
  const s = SIZES[size] ?? SIZES.md

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      {icon && (
        <span style={{
          position: 'absolute',
          left: s.iconLeft,
          top: '50%',
          transform: 'translateY(-50%)',
          color: focused ? '#39A900' : '#9CA3AF',
          transition: 'color 0.2s',
          display: 'flex',
          pointerEvents: 'none',
          zIndex: 1,
        }}>
          {icon}
        </span>
      )}
      <input
        ref={ref}
        {...props}
        onFocus={e => { setFocused(true); props.onFocus?.(e) }}
        onBlur={e => { setFocused(false); props.onBlur?.(e) }}
        style={{
          width: '100%',
          height: s.height,
          padding: `0 ${rightIcon ? s.iconLeft + 20 : s.padLeft}px 0 ${icon ? s.padLeftIcon : s.padLeft}px`,
          fontSize: s.fontSize,
          fontFamily: 'inherit',
          background: focused ? '#fff' : '#F9FAF7',
          border: `1.5px solid ${error ? '#EF4444' : focused ? '#39A900' : '#E5E7EB'}`,
          borderRadius: 10,
          outline: 'none',
          transition: 'all 0.18s cubic-bezier(0.4,0,0.2,1)',
          boxShadow: focused ? '0 0 0 3px rgba(57,169,0,0.12)' : 'none',
          color: '#111827',
          boxSizing: 'border-box',
          ...style,
        }}
      />
      {rightIcon && (
        <button
          type="button"
          onClick={onRightIconClick}
          style={{
            position: 'absolute',
            right: s.iconRight,
            top: '50%',
            transform: 'translateY(-50%)',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 4,
            color: '#9CA3AF',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          {rightIcon}
        </button>
      )}
      {error && (
        <p style={{ fontSize: 12, color: '#EF4444', marginTop: 5, marginLeft: 2 }}>{error}</p>
      )}
    </div>
  )
})
