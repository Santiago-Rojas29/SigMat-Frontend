import { useState, useMemo } from 'react'
import { Spinner } from '../atoms/Spinner'
import { AppButton } from '../atoms/AppButton'

// ── Iconos ────────────────────────────────────────────────────────────────────
const SearchIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
)
const ChevLeft = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6"/>
  </svg>
)
const ChevRight = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6"/>
  </svg>
)
const TrashIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/>
    <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
    <path d="M10 11v6"/><path d="M14 11v6"/>
    <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
  </svg>
)
const CopyIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="9" width="13" height="13" rx="2"/>
    <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
  </svg>
)
const WarnIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
    <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
)

// ── Helpers ───────────────────────────────────────────────────────────────────
function buildPages(cur, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  if (cur <= 4)         return [1, 2, 3, 4, 5, '…', total]
  if (cur >= total - 3) return [1, '…', total-4, total-3, total-2, total-1, total]
  return [1, '…', cur-1, cur, cur+1, '…', total]
}

// ── DataTable ─────────────────────────────────────────────────────────────────
/**
 * columns: Array<{
 *   key, header, render?, width?, align?,
 *   searchable?: bool   — incluir en búsqueda (default true)
 *   copyable?:  bool    — muestra botón copiar; combinar con truncateAt para UUIDs
 *   truncateAt?: number — caracteres visibles del valor crudo (copia el valor completo)
 * }>
 *
 * Props principales:
 *   actions          ReactNode   — botones en toolbar (crear, actualizar…)
 *   searchable       bool        — barra de búsqueda interna
 *   searchPlaceholder string
 *   pageSize         number      — activa paginación
 *   selectable       bool        — checkboxes por fila
 *   onBulkDelete     async fn    — fn(ids[]) al confirmar eliminación masiva
 */
export function DataTable({
  columns,
  data,
  loading,
  error,
  onRetry,
  rowKey            = 'id',
  emptyTitle        = 'Sin registros',
  emptyDescription  = 'No hay datos para mostrar.',
  emptyAction,
  actions,
  searchable        = false,
  searchPlaceholder = 'Buscar…',
  pageSize,
  selectable        = false,
  onBulkDelete,
}) {
  const [query,      setQuery]      = useState('')
  const [page,       setPage]       = useState(1)
  const [selected,   setSelected]   = useState(new Set())
  const [confirming, setConfirming] = useState(false)
  const [deleting,   setDeleting]   = useState(false)

  // ── Filtrado ────────────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    if (!searchable || !query.trim()) return data
    const q = query.toLowerCase()
    return data.filter(row =>
      columns.some(col => {
        if (col.searchable === false) return false
        const v = row[col.key]
        return v != null && String(v).toLowerCase().includes(q)
      })
    )
  }, [data, query, searchable, columns])

  // ── Paginación ──────────────────────────────────────────────────────────────
  const totalPages = pageSize ? Math.max(1, Math.ceil(filtered.length / pageSize)) : 1
  const cur        = Math.min(page, totalPages)
  const visible    = pageSize ? filtered.slice((cur-1)*pageSize, cur*pageSize) : filtered
  const from = filtered.length === 0 ? 0 : (cur-1)*(pageSize ?? filtered.length)+1
  const to   = Math.min(cur*(pageSize ?? filtered.length), filtered.length)
  const goTo = p => setPage(Math.max(1, Math.min(p, totalPages)))

  // ── Selección ───────────────────────────────────────────────────────────────
  const allPage  = visible.length > 0 && visible.every(r => selected.has(r[rowKey]))
  const somePage = visible.some(r => selected.has(r[rowKey]))

  function toggleAll() {
    setSelected(prev => {
      const next = new Set(prev)
      if (allPage) visible.forEach(r => next.delete(r[rowKey]))
      else         visible.forEach(r => next.add(r[rowKey]))
      return next
    })
  }

  function toggleRow(id) {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function clearSelection() { setSelected(new Set()); setConfirming(false) }

  async function handleConfirmDelete() {
    if (!onBulkDelete) return
    setDeleting(true)
    try {
      await onBulkDelete([...selected])
      clearSelection()
    } finally {
      setDeleting(false)
    }
  }

  const hasSelection = selectable && selected.size > 0
  const hasToolbar   = searchable || actions || hasSelection

  // columnas con checkbox prepend
  const allCols = selectable
    ? [{ key: '__cb__', header: '__cb__', width: 48, align: 'center', searchable: false }, ...columns]
    : columns

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div style={{
      background: '#fff', borderRadius: 14,
      border: '1px solid #E5E7EB',
      boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
      overflow: 'hidden',
    }}>

      {/* ── Toolbar ──────────────────────────────────────────────────────────── */}
      {hasToolbar && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '13px 20px', minHeight: 64,
          borderBottom: '1px solid #F0F0F0',
          background: hasSelection ? (confirming ? '#FFF5F5' : '#F0FDF4') : '#fff',
          transition: 'background 0.25s',
        }}>
          {hasSelection ? (
            confirming ? (
              <>
                <span style={{ color:'#F97316', display:'flex', flexShrink:0 }}><WarnIcon /></span>
                <span style={{ fontSize:13.5, color:'#7C2D12', fontWeight:500, flex:1 }}>
                  ¿Eliminar <strong>{selected.size}</strong> {selected.size === 1 ? 'registro' : 'registros'}? Esta acción no se puede deshacer.
                </span>
                <div style={{ display:'flex', gap:8, flexShrink:0 }}>
                  <AppButton variant="ghost" size="compact" onClick={() => setConfirming(false)} disabled={deleting}>
                    Cancelar
                  </AppButton>
                  <AppButton variant="danger" size="compact" onClick={handleConfirmDelete} loading={deleting}>
                    Sí, eliminar
                  </AppButton>
                </div>
              </>
            ) : (
              <>
                <Checkbox checked={allPage} indeterminate={!allPage && somePage} onChange={toggleAll} />
                <span style={{ fontSize:13.5, color:'#166534', fontWeight:600 }}>
                  {selected.size} seleccionado{selected.size !== 1 ? 's' : ''}
                </span>
                <button
                  onClick={clearSelection}
                  style={{ background:'none', border:'none', cursor:'pointer', color:'#6B7280', fontSize:12.5, fontFamily:'inherit', padding:0 }}
                >
                  Deseleccionar todo
                </button>
                {onBulkDelete && (
                  <div style={{ marginLeft:'auto' }}>
                    <AppButton variant="danger" size="compact" onClick={() => setConfirming(true)}>
                      <TrashIcon /> Eliminar seleccionados
                    </AppButton>
                  </div>
                )}
              </>
            )
          ) : (
            <>
              {searchable && (
                <div style={{ position:'relative', flex:1, maxWidth:340 }}>
                  <span style={{ position:'absolute', left:11, top:'50%', transform:'translateY(-50%)', color:'#9CA3AF', display:'flex', pointerEvents:'none' }}>
                    <SearchIcon />
                  </span>
                  <input
                    type="text"
                    value={query}
                    onChange={e => { setQuery(e.target.value); setPage(1) }}
                    placeholder={searchPlaceholder}
                    style={{
                      width:'100%', height:38, paddingLeft:34, paddingRight:12,
                      fontSize:13.5, fontFamily:'inherit',
                      background:'#F9FAFB', border:'1.5px solid #E5E7EB',
                      borderRadius:9, outline:'none', color:'#111827',
                      boxSizing:'border-box', transition:'all 0.18s',
                    }}
                    onFocus={e => { e.target.style.borderColor='#39A900'; e.target.style.boxShadow='0 0 0 3px rgba(57,169,0,0.10)'; e.target.style.background='#fff' }}
                    onBlur={e  => { e.target.style.borderColor='#E5E7EB'; e.target.style.boxShadow='none'; e.target.style.background='#F9FAFB' }}
                  />
                </div>
              )}
              {actions && (
                <div style={{ marginLeft:'auto', display:'flex', gap:8, alignItems:'center' }}>
                  {actions}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ── Cuerpo ───────────────────────────────────────────────────────────── */}
      {error ? (
        <EmptyShell>
          <p style={{ fontSize:14, color:'#DC2626', marginBottom:12 }}>{error}</p>
          {onRetry && <AppButton variant="ghost" size="compact" onClick={onRetry}>Reintentar</AppButton>}
        </EmptyShell>
      ) : loading ? (
        <EmptyShell>
          <Spinner size={30} />
          <p style={{ color:'#9CA3AF', fontSize:13.5, margin:0 }}>Cargando…</p>
        </EmptyShell>
      ) : visible.length === 0 ? (
        <EmptyShell>
          <div style={{
            width:52, height:52, borderRadius:14, marginBottom:14,
            background:'rgba(57,169,0,0.07)', border:'1.5px dashed rgba(57,169,0,0.3)',
            display:'flex', alignItems:'center', justifyContent:'center',
          }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#39A900" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
          </div>
          <p style={{ fontSize:15, fontWeight:600, color:'#374151', margin:'0 0 5px' }}>{emptyTitle}</p>
          <p style={{ fontSize:13.5, color:'#9CA3AF', margin:'0 0 18px', maxWidth:300, textAlign:'center' }}>{emptyDescription}</p>
          {emptyAction}
        </EmptyShell>
      ) : (
        <>
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13.5 }}>
              <thead>
                <tr style={{ background:'#FAFAFA', borderBottom:'1px solid #EFEFEF' }}>
                  {allCols.map(col => (
                    <th key={col.key} style={{
                      padding: col.key === '__cb__' ? '0 0 0 20px' : '11px 16px',
                      textAlign: col.align ?? 'left',
                      fontWeight:600, fontSize:11.5, color:'#A0AEC0',
                      textTransform:'uppercase', letterSpacing:'0.6px',
                      whiteSpace:'nowrap', width:col.width,
                    }}>
                      {col.key === '__cb__'
                        ? <Checkbox checked={allPage} indeterminate={!allPage && somePage} onChange={toggleAll} />
                        : col.header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visible.map((row, i) => {
                  const isSel = selectable && selected.has(row[rowKey])
                  return (
                    <tr
                      key={row[rowKey] ?? i}
                      style={{
                        borderBottom: i < visible.length-1 ? '1px solid #F7F7F7' : 'none',
                        background: isSel ? 'rgba(57,169,0,0.05)' : '#fff',
                        transition: 'background 0.12s',
                      }}
                      onMouseEnter={e => { if (!isSel) e.currentTarget.style.background='#F9FDF5' }}
                      onMouseLeave={e => { e.currentTarget.style.background = isSel ? 'rgba(57,169,0,0.05)' : '#fff' }}
                    >
                      {allCols.map(col => (
                        <td key={col.key} style={{
                          padding: col.key === '__cb__' ? '0 0 0 20px' : '13px 16px',
                          textAlign: col.align ?? 'left',
                          color:'#374151', verticalAlign:'middle',
                        }}>
                          {col.key === '__cb__'
                            ? <Checkbox checked={isSel} onChange={() => toggleRow(row[rowKey])} />
                            : col.copyable
                              ? <CopyableCell
                                  rawValue={row[col.key]}
                                  truncateAt={col.truncateAt}
                                  display={col.render ? col.render(row) : row[col.key]}
                                />
                              : col.render ? col.render(row) : row[col.key]}
                        </td>
                      ))}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* ── Paginación ─────────────────────────────────────────────────── */}
          {pageSize && (
            <div style={{
              display:'flex', alignItems:'center', justifyContent:'space-between',
              padding:'11px 20px', borderTop:'1px solid #F0F0F0',
              gap:12, flexWrap:'wrap',
            }}>
              <span style={{ fontSize:12.5, color:'#9CA3AF' }}>
                {filtered.length === 0
                  ? '0 resultados'
                  : `${from}–${to} de ${filtered.length} resultado${filtered.length !== 1 ? 's' : ''}`}
              </span>
              {totalPages > 1 && (
                <div style={{ display:'flex', gap:4, alignItems:'center' }}>
                  <PgBtn onClick={() => goTo(cur-1)} disabled={cur===1}><ChevLeft /></PgBtn>
                  {buildPages(cur, totalPages).map((p, i) =>
                    p === '…'
                      ? <span key={`e${i}`} style={{ padding:'0 2px', color:'#CBD5E0', fontSize:13 }}>…</span>
                      : <PgBtn key={p} active={p===cur} onClick={() => goTo(p)}>{p}</PgBtn>
                  )}
                  <PgBtn onClick={() => goTo(cur+1)} disabled={cur===totalPages}><ChevRight /></PgBtn>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}

// ── Sub-componentes ───────────────────────────────────────────────────────────

/**
 * Muestra una versión truncada del valor pero copia el valor completo.
 *   rawValue   — valor original (se copia completo)
 *   truncateAt — caracteres visibles (default: sin truncar)
 *   display    — JSX opcional para el render (si se pasa, se usa en lugar de rawValue)
 */
function CopyableCell({ rawValue, truncateAt, display }) {
  const [copied,  setCopied]  = useState(false)
  const [hovered, setHovered] = useState(false)

  const raw    = rawValue != null ? String(rawValue) : ''
  const isLong = truncateAt && raw.length > truncateAt

  // Lo que se muestra: si hay render custom se usa, si no se trunca el raw
  const shown = display != null
    ? display
    : isLong
      ? <span style={{ fontFamily:'monospace', fontSize:12.5, color:'#374151' }}>{raw.slice(0, truncateAt)}<span style={{ color:'#CBD5E0' }}>…</span></span>
      : raw

  function handleCopy(e) {
    e.stopPropagation()
    navigator.clipboard.writeText(raw).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    })
  }

  return (
    <span
      style={{ display:'inline-flex', alignItems:'center', gap:5 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <span>{shown}</span>
      {(hovered || copied) && (
        <button
          onClick={handleCopy}
          title={copied ? '¡Copiado!' : 'Copiar valor completo'}
          style={{
            background: copied ? 'rgba(57,169,0,0.12)' : 'rgba(0,0,0,0.06)',
            border:'none', borderRadius:5, cursor:'pointer',
            padding:'3px 5px', display:'flex', alignItems:'center',
            color: copied ? '#39A900' : '#9CA3AF',
            transition:'all 0.15s',
          }}
        >
          {copied
            ? <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            : <CopyIcon />}
        </button>
      )}
    </span>
  )
}

function Checkbox({ checked, indeterminate, onChange }) {
  return (
    <label style={{ display:'flex', alignItems:'center', cursor:'pointer', width:20, height:20 }}>
      <input type="checkbox" checked={checked} onChange={onChange}
        ref={el => { if (el) el.indeterminate = !!indeterminate }}
        style={{ display:'none' }}
      />
      <span style={{
        width:16, height:16, borderRadius:4, flexShrink:0,
        border:`2px solid ${checked||indeterminate ? '#39A900' : '#D1D5DB'}`,
        background: checked||indeterminate ? '#39A900' : '#fff',
        display:'flex', alignItems:'center', justifyContent:'center',
        transition:'all 0.15s',
      }}>
        {checked && (
          <svg width="9" height="9" viewBox="0 0 12 12" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="2 6 5 9 10 3"/>
          </svg>
        )}
        {!checked && indeterminate && (
          <svg width="8" height="2" viewBox="0 0 8 2" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round">
            <line x1="0" y1="1" x2="8" y2="1"/>
          </svg>
        )}
      </span>
    </label>
  )
}

function EmptyShell({ children }) {
  return (
    <div style={{ padding:'56px 24px', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:8 }}>
      {children}
    </div>
  )
}

function PgBtn({ children, active, disabled, onClick }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        minWidth:32, height:32, borderRadius:8,
        border: active ? 'none' : '1px solid #E5E7EB',
        background: active ? '#39A900' : disabled ? 'transparent' : '#fff',
        color: active ? '#fff' : disabled ? '#D1D5DB' : '#374151',
        fontSize:13, fontWeight: active ? 700 : 400, fontFamily:'inherit',
        cursor: disabled ? 'not-allowed' : 'pointer',
        display:'flex', alignItems:'center', justifyContent:'center',
        padding:'0 6px',
        boxShadow: active ? '0 2px 8px rgba(57,169,0,0.25)' : 'none',
        transition:'all 0.15s',
      }}
    >
      {children}
    </button>
  )
}
