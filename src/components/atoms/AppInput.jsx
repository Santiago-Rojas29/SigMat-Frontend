import { forwardRef, useState } from 'react'

export const AppInput = forwardRef(function AppInput(
  { icon, rightIcon, onRightIconClick, error, style, ...props },
  ref
) {
  const [focused, setFocused] = useState(false)

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      {icon && (
        <span style={{
          position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
          color: focused ? '#39A900' : '#9CA3AF',
          transition: 'color 0.2s',
          display: 'flex', pointerEvents: 'none',
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
          height: 48,
          padding: icon ? '0 44px 0 44px' : '0 44px 0 16px',
          paddingRight: rightIcon ? 44 : 16,
          fontSize: 15,
          fontFamily: 'inherit',
          background: focused ? '#fff' : '#F9FAF7',
          border: `1.5px solid ${error ? '#EF4444' : focused ? '#39A900' : '#E5E7EB'}`,
          borderRadius: 10,
          outline: 'none',
          transition: 'all 0.18s cubic-bezier(0.4,0,0.2,1)',
          boxShadow: focused ? '0 0 0 3px rgba(57,169,0,0.12)' : 'none',
          color: '#111827',
          ...style,
        }}
      />
      {rightIcon && (
        <button
          type="button"
          onClick={onRightIconClick}
          style={{
            position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
            background: 'none', border: 'none', cursor: 'pointer', padding: 4,
            color: '#9CA3AF', display: 'flex', alignItems: 'center',
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
