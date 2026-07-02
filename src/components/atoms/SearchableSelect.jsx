import { useState, useRef, useEffect, useMemo } from 'react'
import { createPortal } from 'react-dom'

const MAX_VISIBLE      = 50
const INITIAL_PER_GROUP = 3

export function SearchableSelect({
  options = [],
  value = '',
  onChange,
  placeholder = '— Seleccionar —',
  size = 'md',
  error,
  disabled,
  style,
  className = '',
}) {
  const [open, setOpen]               = useState(false)
  const [query, setQuery]             = useState('')
  const [dropPos, setDropPos]         = useState({ top: 0, left: 0, width: 0 })
  const [expandedGroups, setExpanded] = useState(new Set())
  const triggerRef                    = useRef(null)
  const panelRef                      = useRef(null)
  const inputRef                      = useRef(null)
  const listRef                       = useRef(null)
  const selectedItemRef               = useRef(null)

  const hasGroups = useMemo(() => options.some(o => o.isGroup), [options])
  const selected  = options.find(o => !o.isGroup && String(o.value) === String(value))

  // ── Filtrado por búsqueda ────────────────────────────────────────────────
  const allFiltered = useMemo(() => {
    if (!query.trim()) return options
    const q = query.toLowerCase()
    if (!hasGroups) return options.filter(o => String(o.label).toLowerCase().includes(q))

    const result = []
    let pendingHeader = null
    for (const opt of options) {
      if (opt.isGroup) {
        pendingHeader = opt
      } else if (String(opt.label).toLowerCase().includes(q)) {
        if (pendingHeader) { result.push(pendingHeader); pendingHeader = null }
        result.push(opt)
      }
    }
    return result
  }, [options, query, hasGroups])

  // ── Límite por grupo (solo cuando no hay búsqueda activa) ─────────────────
  const displayItems = useMemo(() => {
    if (!hasGroups || query.trim()) return allFiltered.slice(0, MAX_VISIBLE)

    const result = []
    let currentGroup = null
    let groupItems   = []

    const flushGroup = () => {
      if (!currentGroup) return
      result.push(currentGroup)
      const expanded = expandedGroups.has(currentGroup.label)
      const shown    = expanded ? groupItems : groupItems.slice(0, INITIAL_PER_GROUP)
      result.push(...shown)
      if (!expanded && groupItems.length > INITIAL_PER_GROUP) {
        result.push({
          isShowMore:   true,
          groupLabel:   currentGroup.label,
          remaining:    groupItems.length - INITIAL_PER_GROUP,
        })
      }
    }

    for (const opt of allFiltered) {
      if (opt.isGroup) {
        flushGroup()
        currentGroup = opt
        groupItems   = []
      } else {
        groupItems.push(opt)
      }
    }
    flushGroup()
    return result
  }, [allFiltered, expandedGroups, hasGroups, query])

  const hasMore = !hasGroups && allFiltered.length > MAX_VISIBLE

  // ── Posición y listeners ──────────────────────────────────────────────────
  useEffect(() => {
    if (!open) return
    if (triggerRef.current) {
      const r = triggerRef.current.getBoundingClientRect()
      setDropPos({ top: r.bottom + 4, left: r.left, width: r.width })
    }
    if (inputRef.current) inputRef.current.focus()

    // Auto-scroll al item seleccionado cuando el dropdown tiene grupos
    if (hasGroups && selectedItemRef.current && listRef.current) {
      const list = listRef.current
      const item = selectedItemRef.current
      list.scrollTop = item.offsetTop - list.clientHeight / 2 + item.offsetHeight / 2
    }

    function onMouseDown(e) {
      if (
        triggerRef.current && !triggerRef.current.contains(e.target) &&
        panelRef.current   && !panelRef.current.contains(e.target)
      ) { setOpen(false); setQuery(''); setExpanded(new Set()) }
    }
    function onScroll(e) {
      if (panelRef.current && panelRef.current.contains(e.target)) return
      setOpen(false); setQuery(''); setExpanded(new Set())
    }
    function onClose() { setOpen(false); setQuery(''); setExpanded(new Set()) }
    document.addEventListener('mousedown', onMouseDown)
    window.addEventListener('scroll', onScroll, true)
    window.addEventListener('resize', onClose)
    return () => {
      document.removeEventListener('mousedown', onMouseDown)
      window.removeEventListener('scroll', onScroll, true)
      window.removeEventListener('resize', onClose)
    }
  }, [open])

  function handleToggle() {
    if (disabled) return
    setOpen(o => !o)
    if (open) { setQuery(''); setExpanded(new Set()) }
  }

  function handleSelect(opt) {
    onChange?.(opt.value)
    setOpen(false)
    setQuery('')
    setExpanded(new Set())
  }

  function handleShowMore(groupLabel) {
    setExpanded(prev => new Set([...prev, groupLabel]))
  }

  // ── Estilos ───────────────────────────────────────────────────────────────
  const sm = size === 'sm'
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
    color: selected ? '#111827' : '#9ca3af',
    outline: 'none',
    boxShadow: open ? '0 0 0 3px rgba(57,169,0,0.15)' : 'none',
    transition: 'border-color 0.15s, box-shadow 0.15s',
    fontSize: 14,
    padding: sm ? '7px 10px' : '8px 12px',
    minHeight: 38,
    fontFamily: 'inherit',
  }

  // ── Dropdown ──────────────────────────────────────────────────────────────
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
      {/* Buscador */}
      <div style={{ padding: '9px 10px', borderBottom: '1px solid #f3f4f6' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: '#f9fafb', borderRadius: 8,
          padding: '7px 10px', border: '1px solid #e5e7eb',
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Buscar..."
            style={{
              border: 'none', outline: 'none', background: 'transparent',
              fontSize: 14, flex: 1, color: '#374151', fontFamily: 'inherit',
            }}
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#9ca3af', padding: 0, lineHeight: 1, fontSize: 18 }}
            >×</button>
          )}
        </div>
      </div>

      {/* Lista */}
      <div ref={listRef} style={{ maxHeight: hasGroups ? 215 : 260, overflowY: 'auto' }}>
        {displayItems.length === 0 ? (
          <div style={{ padding: '14px 16px', fontSize: 14, color: '#9ca3af', textAlign: 'center' }}>
            Sin resultados
          </div>
        ) : (
          displayItems.map((opt, i) => {
            // ── Header de grupo ─────────────────────────────────────────
            if (opt.isGroup) {
              return (
                <div key={`g-${i}`} style={{
                  padding: '8px 16px 4px',
                  fontSize: 10.5,
                  fontWeight: 700,
                  letterSpacing: '0.7px',
                  textTransform: 'uppercase',
                  color: '#39A900',
                  borderTop: i === 0 ? 'none' : '1px solid #f0f0f0',
                  marginTop: i === 0 ? 0 : 4,
                  userSelect: 'none',
                }}>
                  {opt.label}
                </div>
              )
            }

            // ── "Ver X más" ─────────────────────────────────────────────
            if (opt.isShowMore) {
              return (
                <button
                  key={`more-${opt.groupLabel}`}
                  type="button"
                  onClick={() => handleShowMore(opt.groupLabel)}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '6px 20px',
                    border: 'none',
                    background: 'transparent',
                    color: '#39A900',
                    fontSize: 12.5,
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5,
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = '#f0fdf4'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="6 9 12 15 18 9"/>
                  </svg>
                  Ver {opt.remaining} más
                </button>
              )
            }

            // ── Opción normal ───────────────────────────────────────────
            const isSel = String(opt.value) === String(value)
            return (
              <button
                key={opt.value}
                ref={isSel ? selectedItemRef : null}
                type="button"
                onClick={() => handleSelect(opt)}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  padding: hasGroups ? '8px 16px 8px 20px' : '10px 16px',
                  border: 'none',
                  background: isSel ? 'rgba(57,169,0,0.08)' : 'transparent',
                  color: isSel ? '#2d7a00' : '#374151',
                  fontSize: 14,
                  cursor: 'pointer',
                  display: 'block',
                  fontWeight: isSel ? 600 : 400,
                  fontFamily: 'inherit',
                }}
                onMouseEnter={e => { if (!isSel) e.currentTarget.style.background = '#f9fafb' }}
                onMouseLeave={e => { if (!isSel) e.currentTarget.style.background = isSel ? 'rgba(57,169,0,0.08)' : 'transparent' }}
              >
                {opt.label}
              </button>
            )
          })
        )}
        {hasMore && (
          <div style={{ padding: '8px 16px', fontSize: 12, color: '#9ca3af', borderTop: '1px solid #f3f4f6', textAlign: 'center' }}>
            Mostrando {MAX_VISIBLE} de {allFiltered.length} — escribe para filtrar
          </div>
        )}
      </div>
    </div>
  ) : null

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div
      style={{ position: 'relative', width: '100%', overflow: 'hidden', ...style }}
      className={className}
      onKeyDown={e => e.key === 'Escape' && (setOpen(false), setQuery(''), setExpanded(new Set()))}
    >
      <button ref={triggerRef} type="button" disabled={disabled} onClick={handleToggle} style={triggerStyle}>
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, minWidth: 0, textAlign: 'left' }}>
          {selected ? selected.label : placeholder}
        </span>
        <svg
          width="13" height="13" viewBox="0 0 24 24" fill="none"
          stroke="#9ca3af" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
          style={{ flexShrink: 0, transition: 'transform 0.15s', transform: open ? 'rotate(180deg)' : 'none' }}
        >
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>

      {createPortal(panel, document.body)}

      {error && (
        <div style={{ fontSize: 12, color: '#ef4444', marginTop: 4 }}>{error}</div>
      )}
    </div>
  )
}
