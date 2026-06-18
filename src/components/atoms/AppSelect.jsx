import { useState, useRef, useEffect } from 'react'
import React from 'react'
import { createPortal } from 'react-dom'

export function AppSelect({ error, size = 'md', className = '', style, children, value, onChange, disabled, ...props }) {
  const [open, setOpen]       = useState(false)
  const [dropPos, setDropPos] = useState({ top: 0, left: 0, width: 0 })
  const triggerRef            = useRef(null)
  const panelRef              = useRef(null)

  const sm = size === 'sm'

  const options = React.Children.toArray(children)
    .filter(child => React.isValidElement(child) && child.type === 'option')
    .map(child => ({
      value:    String(child.props.value ?? ''),
      label:    child.props.children,
      disabled: child.props.disabled ?? false,
    }))

  const selected      = options.find(o => String(o.value) === String(value ?? ''))
  const isPlaceholder = !selected || selected.value === ''

  useEffect(() => {
    if (!open) return
    if (triggerRef.current) {
      const r = triggerRef.current.getBoundingClientRect()
      setDropPos({ top: r.bottom + 4, left: r.left, width: r.width })
    }
    function onMouseDown(e) {
      if (
        triggerRef.current && !triggerRef.current.contains(e.target) &&
        panelRef.current   && !panelRef.current.contains(e.target)
      ) setOpen(false)
    }
    function onScroll(e) {
      if (panelRef.current && panelRef.current.contains(e.target)) return
      setOpen(false)
    }
    function onClose() { setOpen(false) }
    document.addEventListener('mousedown', onMouseDown)
    window.addEventListener('scroll', onScroll, true)
    window.addEventListener('resize', onClose)
    return () => {
      document.removeEventListener('mousedown', onMouseDown)
      window.removeEventListener('scroll', onScroll, true)
      window.removeEventListener('resize', onClose)
    }
  }, [open])

  function handleSelect(opt) {
    if (opt.disabled) return
    onChange?.({ target: { value: opt.value } })
    setOpen(false)
  }

  const triggerStyle = {
    width: '100%',
    background: disabled ? '#f3f4f6' : '#F9FAF7',
    border: `1px solid ${error ? '#EF4444' : open ? '#39A900' : '#d1d5db'}`,
    borderRadius: 8,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
    cursor: disabled ? 'not-allowed' : 'pointer',
    color: isPlaceholder ? '#9ca3af' : '#111827',
    outline: 'none',
    boxShadow: open ? '0 0 0 3px rgba(57,169,0,0.15)' : 'none',
    transition: 'border-color 0.15s, box-shadow 0.15s',
    fontSize: 14,
    padding: sm ? '7px 10px' : '8px 12px',
    minHeight: 38,
    fontFamily: 'inherit',
    textAlign: 'left',
  }

  const panel = open ? (
    <div
      ref={panelRef}
      style={{
        position: 'fixed',
        zIndex: 99999,
        top:   dropPos.top,
        left:  dropPos.left,
        width: dropPos.width,
        background: '#fff',
        border: '1px solid #e5e7eb',
        borderRadius: 10,
        boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
        overflow: 'hidden',
      }}
    >
      <div style={{ maxHeight: 260, overflowY: 'auto' }}>
        {options.map(opt => {
          const isSel    = String(opt.value) === String(value ?? '')
          const isHolder = opt.value === ''
          return (
            <button
              key={opt.value}
              type="button"
              disabled={opt.disabled}
              onClick={() => handleSelect(opt)}
              style={{
                width: '100%',
                textAlign: 'left',
                padding: '10px 16px',
                border: 'none',
                background: isSel ? 'rgba(57,169,0,0.08)' : 'transparent',
                color: isSel ? '#2d7a00' : isHolder ? '#9ca3af' : '#374151',
                fontSize: 14,
                cursor: opt.disabled ? 'default' : 'pointer',
                display: 'block',
                fontWeight: isSel ? 600 : 400,
                fontFamily: 'inherit',
                opacity: opt.disabled ? 0.4 : 1,
              }}
              onMouseEnter={e => { if (!isSel && !opt.disabled) e.currentTarget.style.background = '#f9fafb' }}
              onMouseLeave={e => { if (!isSel) e.currentTarget.style.background = isSel ? 'rgba(57,169,0,0.08)' : 'transparent' }}
            >
              {opt.label}
            </button>
          )
        })}
      </div>
    </div>
  ) : null

  return (
    <div
      style={{ position: 'relative', width: '100%', ...style }}
      className={className}
      onKeyDown={e => e.key === 'Escape' && setOpen(false)}
    >
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen(o => !o)}
        style={triggerStyle}
        {...props}
      >
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
          {selected?.label ?? ''}
        </span>
        <svg
          width="13" height="13" viewBox="0 0 24 24" fill="none"
          stroke="#9ca3af" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
          style={{ flexShrink: 0, transition: 'transform 0.15s', transform: open ? 'rotate(180deg)' : 'none' }}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {createPortal(panel, document.body)}

      {error && (
        <div style={{ fontSize: 12, color: '#ef4444', marginTop: 4 }}>{error}</div>
      )}
    </div>
  )
}
