import { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { buscarUnspsc, getUnspscByCode } from '../../data/unspsc'

const ICON_SEARCH = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
)
const ICON_X = (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
)
const ICON_CHEVRON = (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <polyline points="9 18 15 12 9 6"/>
  </svg>
)

export function UnspscPicker({ value = '', onChange, placeholder = 'Buscar código o nombre UNSPSC…' }) {
  const [query, setQuery]   = useState('')
  const [open, setOpen]     = useState(false)
  const [active, setActive] = useState(-1)
  const [pos, setPos]       = useState({ top: 0, left: 0, width: 0 })

  const wrapRef  = useRef(null)
  const inputRef = useRef(null)
  const listRef  = useRef(null)

  const selected = value ? getUnspscByCode(value) : null
  const results  = buscarUnspsc(query)

  // Calcula la posición fija del dropdown relativa al input
  const calcPos = useCallback(() => {
    if (!wrapRef.current) return
    const r = wrapRef.current.getBoundingClientRect()
    setPos({ top: r.bottom + 6, left: r.left, width: r.width })
  }, [])

  // Recalcula al hacer scroll o resize mientras esté abierto
  useEffect(() => {
    if (!open) return
    calcPos()
    window.addEventListener('scroll', calcPos, true)
    window.addEventListener('resize', calcPos)
    return () => {
      window.removeEventListener('scroll', calcPos, true)
      window.removeEventListener('resize', calcPos)
    }
  }, [open, calcPos])

  // Cerrar al hacer clic fuera
  useEffect(() => {
    const handler = (e) => {
      const portal = document.getElementById('__unspsc_portal__')
      if (
        wrapRef.current?.contains(e.target) ||
        portal?.contains(e.target)
      ) return
      setOpen(false)
      setQuery('')
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  useEffect(() => { setActive(-1) }, [query])

  // Scroll al ítem activo
  useEffect(() => {
    if (active >= 0 && listRef.current) {
      listRef.current.children[active]?.scrollIntoView({ block: 'nearest' })
    }
  }, [active])

  const openPicker = () => {
    calcPos()
    setOpen(true)
    setTimeout(() => inputRef.current?.focus(), 0)
  }

  const handleSelect = (item) => {
    onChange(item.code)
    setQuery('')
    setOpen(false)
  }

  const handleClear = (e) => {
    e.stopPropagation()
    onChange('')
    setQuery('')
    setOpen(false)
  }

  const handleKeyDown = (e) => {
    if (!open || !results.length) return
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive(a => Math.min(a + 1, results.length - 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(a => Math.max(a - 1, 0)) }
    else if (e.key === 'Enter' && active >= 0) { e.preventDefault(); handleSelect(results[active]) }
    else if (e.key === 'Escape') { setOpen(false); setQuery('') }
  }

  // ── Dropdown (via portal) ──────────────────────────────────────────────────
  const showResults = open && query.length >= 2
  const showHint    = open && query.length < 2

  const dropdown = (showResults || showHint) && createPortal(
    <div
      id="__unspsc_portal__"
      style={{
        position: 'fixed',
        top: pos.top,
        left: pos.left,
        width: pos.width,
        zIndex: 99999,
        background: '#fff',
        border: '1.5px solid #d1d5db',
        borderRadius: 10,
        boxShadow: '0 12px 32px rgba(0,0,0,0.15), 0 2px 8px rgba(0,0,0,0.08)',
        overflow: 'hidden',
      }}
    >
      {showHint && (
        <div style={{ padding: '12px 14px', fontSize: 12, color: '#9ca3af' }}>
          Escribe el código (ej:{' '}
          <code style={{ color: '#374151', background: '#f3f4f6', padding: '1px 5px', borderRadius: 4 }}>
            44122001
          </code>
          ) o el nombre del producto…
        </div>
      )}

      {showResults && (
        <>
          {results.length === 0 ? (
            <div style={{ padding: '14px 16px', fontSize: 13, color: '#9ca3af', textAlign: 'center' }}>
              Sin resultados para "{query}"
            </div>
          ) : (
            <ul ref={listRef} style={{ margin: 0, padding: '4px 0', listStyle: 'none', maxHeight: 228, overflowY: 'auto' }}>
              {results.map((item, i) => {
                const isActive = active === i
                return (
                  <li
                    key={item.code}
                    onMouseDown={() => handleSelect(item)}
                    onMouseEnter={() => setActive(i)}
                    style={{
                      padding: '9px 14px', cursor: 'pointer',
                      background: isActive ? '#f0fdf4' : 'transparent',
                      borderLeft: isActive ? '3px solid #39A900' : '3px solid transparent',
                      transition: 'background 0.1s',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                      <code style={{
                        fontSize: 11, fontWeight: 700, flexShrink: 0, letterSpacing: '0.5px',
                        background: isActive ? '#dcfce7' : '#f3f4f6',
                        color: isActive ? '#166534' : '#6b7280',
                        padding: '2px 7px', borderRadius: 5, marginTop: 1,
                      }}>
                        {item.code}
                      </code>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#111827', lineHeight: 1.3 }}>
                          {item.name}
                        </div>
                        <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>
                          {item.familyName} › {item.className}
                        </div>
                      </div>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
          <div style={{
            padding: '5px 14px', borderTop: '1px solid #f3f4f6',
            fontSize: 10.5, color: '#c4c4c4', background: '#fafafa',
          }}>
            Catálogo UNSPSC — Colombia Compra Eficiente
          </div>
        </>
      )}
    </div>,
    document.body,
  )

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div ref={wrapRef} style={{ position: 'relative', width: '100%' }}>

      {/* Campo principal */}
      <div
        onClick={openPicker}
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          border: `1.5px solid ${open ? '#39A900' : '#d1d5db'}`,
          borderRadius: 7, padding: '0 10px',
          background: '#fff', cursor: 'text', minHeight: 34,
          transition: 'border-color 0.15s, box-shadow 0.15s',
          boxShadow: open ? '0 0 0 3px rgba(57,169,0,0.12)' : 'none',
        }}
      >
        <span style={{ color: open ? '#39A900' : '#9ca3af', flexShrink: 0, marginTop: 1 }}>
          {ICON_SEARCH}
        </span>

        {/* Mostrar valor actual o input de búsqueda */}
        {value && !open ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, overflow: 'hidden' }}>
            <code style={{
              fontSize: 11.5, fontWeight: 700, background: '#f0fdf4',
              color: '#166534', padding: '1px 7px', borderRadius: 5, flexShrink: 0,
            }}>
              {value}
            </code>
            {selected && (
              <span style={{ fontSize: 12.5, color: '#111827', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {selected.name}
              </span>
            )}
          </div>
        ) : (
          <input
            ref={inputRef}
            value={query}
            onChange={e => { setQuery(e.target.value) }}
            onKeyDown={handleKeyDown}
            placeholder={value && selected ? `${value} — ${selected.name}` : placeholder}
            style={{
              flex: 1, border: 'none', outline: 'none', background: 'transparent',
              fontSize: 13, color: '#111827', padding: '5px 0', fontFamily: 'inherit',
            }}
          />
        )}

        {/* Limpiar */}
        {value && (
          <button
            type="button"
            onMouseDown={handleClear}
            style={{
              border: 'none', background: 'none', cursor: 'pointer', padding: 2,
              color: '#9ca3af', flexShrink: 0, display: 'flex', alignItems: 'center',
              borderRadius: 4,
            }}
            title="Limpiar"
          >
            {ICON_X}
          </button>
        )}
      </div>

      {/* Chip de jerarquía UNSPSC bajo el campo */}
      {selected && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 4, marginTop: 5,
          flexWrap: 'wrap', lineHeight: 1,
        }}>
          <span style={{ fontSize: 10.5, color: '#9ca3af' }}>{selected.segmentName}</span>
          <span style={{ color: '#d1d5db', fontSize: 10 }}>{ICON_CHEVRON}</span>
          <span style={{ fontSize: 10.5, color: '#9ca3af' }}>{selected.familyName}</span>
          <span style={{ color: '#d1d5db', fontSize: 10 }}>{ICON_CHEVRON}</span>
          <span style={{ fontSize: 10.5, color: '#374151', fontWeight: 600 }}>{selected.className}</span>
        </div>
      )}

      {dropdown}
    </div>
  )
}
