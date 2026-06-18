import { useState, useMemo, useRef } from 'react'
import { Spinner }    from '../atoms/Spinner'
import { AppButton }  from '../atoms/AppButton'
import { AppIcon }    from '../atoms/AppIcon'
import './DataTable.css'

function buildPages(cur, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  if (cur <= 4)         return [1, 2, 3, 4, 5, '…', total]
  if (cur >= total - 3) return [1, '…', total-4, total-3, total-2, total-1, total]
  return [1, '…', cur-1, cur, cur+1, '…', total]
}

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

  const totalPages = pageSize ? Math.max(1, Math.ceil(filtered.length / pageSize)) : 1
  const cur        = Math.min(page, totalPages)
  const visible    = pageSize ? filtered.slice((cur-1)*pageSize, cur*pageSize) : filtered
  const from = filtered.length === 0 ? 0 : (cur-1)*(pageSize ?? filtered.length)+1
  const to   = Math.min(cur*(pageSize ?? filtered.length), filtered.length)
  const goTo = p => setPage(Math.max(1, Math.min(p, totalPages)))

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

  const allCols = selectable
    ? [{ key: '__cb__', header: '__cb__', width: 48, align: 'center', searchable: false }, ...columns]
    : columns

  return (
    <div className="dt-card">

      {/* ── Toolbar ──────────────────────────────────────────────────────────── */}
      {hasToolbar && (
        <div className={`dt-toolbar ${hasSelection ? (confirming ? 'dt-toolbar--danger' : 'dt-toolbar--selected') : ''}`}>
          {hasSelection ? (
            confirming ? (
              <>
                <span className="text-warning d-flex flex-shrink-0"><AppIcon name="warn" size={15} /></span>
                <span className="dt-confirm-text">
                  ¿Eliminar <strong>{selected.size}</strong> {selected.size === 1 ? 'registro' : 'registros'}? Esta acción no se puede deshacer.
                </span>
                <div className="d-flex gap-2 flex-shrink-0">
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
                <span className="dt-sel-count">
                  {selected.size} seleccionado{selected.size !== 1 ? 's' : ''}
                </span>
                <button className="dt-deselect-btn" onClick={clearSelection}>
                  Deseleccionar todo
                </button>
                {onBulkDelete && (
                  <div className="ms-auto">
                    <AppButton variant="danger" size="compact" onClick={() => setConfirming(true)}>
                      <AppIcon name="trash" size={14} /> Eliminar seleccionados
                    </AppButton>
                  </div>
                )}
              </>
            )
          ) : (
            <>
              {searchable && (
                <div className="dt-search-wrap">
                  <span className="dt-search-icon"><AppIcon name="search" size={15} /></span>
                  <input
                    type="text"
                    value={query}
                    onChange={e => { setQuery(e.target.value); setPage(1) }}
                    placeholder={searchPlaceholder}
                    className="dt-search-input"
                  />
                </div>
              )}
              {actions && (
                <div className="ms-auto d-flex gap-2 align-items-center">
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
          <p className="text-danger mb-3" style={{ fontSize: 14 }}>{error}</p>
          {onRetry && <AppButton variant="ghost" size="compact" onClick={onRetry}>Reintentar</AppButton>}
        </EmptyShell>
      ) : loading ? (
        <EmptyShell>
          <Spinner size={30} />
          <p className="text-secondary mb-0" style={{ fontSize: 13.5 }}>Cargando…</p>
        </EmptyShell>
      ) : visible.length === 0 ? (
        <EmptyShell>
          <div className="dt-empty-icon">
            <AppIcon name="info" size={22} style={{ color: '#39A900' }} />
          </div>
          <p className="dt-empty-title">{emptyTitle}</p>
          <p className="dt-empty-desc">{emptyDescription}</p>
          {emptyAction}
        </EmptyShell>
      ) : (
        <>
          <div className="table-responsive">
            <table className="table dt-table mb-0">
              <thead>
                <tr>
                  {allCols.map(col => (
                    <th
                      key={col.key}
                      className={`dt-th text-${col.align ?? 'start'}`}
                      style={{ width: col.width }}
                    >
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
                    <tr key={row[rowKey] ?? i} className={`dt-row ${isSel ? 'dt-row--selected' : ''}`}>
                      {allCols.map(col => (
                        <td
                          key={col.key}
                          className={`dt-td text-${col.align ?? 'start'}`}
                          style={{ width: col.width }}
                        >
                          {col.key === '__cb__'
                            ? <Checkbox checked={isSel} onChange={() => toggleRow(row[rowKey])} />
                            : col.copyable
                              ? <CopyableCell
                                  rawValue={row[col.key]}
                                  truncateAt={col.truncateAt}
                                  display={col.render ? col.render(row) : undefined}
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
            <div className="dt-pagination">
              <span className="dt-pagination__info">
                {filtered.length === 0
                  ? '0 resultados'
                  : `${from}–${to} de ${filtered.length} resultado${filtered.length !== 1 ? 's' : ''}`}
              </span>
              {totalPages > 1 && (
                <div className="d-flex gap-1 align-items-center">
                  <PgBtn onClick={() => goTo(cur-1)} disabled={cur===1}>
                    <AppIcon name="chev-left" size={14} />
                  </PgBtn>
                  {buildPages(cur, totalPages).map((p, i) =>
                    p === '…'
                      ? <span key={`e${i}`} className="dt-pg-ellipsis">…</span>
                      : <PgBtn key={p} active={p===cur} onClick={() => goTo(p)}>{p}</PgBtn>
                  )}
                  <PgBtn onClick={() => goTo(cur+1)} disabled={cur===totalPages}>
                    <AppIcon name="chev-right" size={14} />
                  </PgBtn>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}

function CopyableCell({ rawValue, truncateAt, display }) {
  const [copied,  setCopied]  = useState(false)
  const [hovered, setHovered] = useState(false)

  const raw    = rawValue != null ? String(rawValue) : ''
  const isLong = truncateAt && raw.length > truncateAt

  const shortLabel = isLong
    ? '#' + raw.replace(/-/g, '').slice(0, 6).toUpperCase()
    : raw

  const shown = display != null
    ? display
    : isLong
      ? <span className="dt-mono">{shortLabel}</span>
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
      className="d-inline-flex align-items-center gap-1"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <span>{shown}</span>
      {(hovered || copied) && (
        <button
          onClick={handleCopy}
          title={copied ? '¡Copiado!' : 'Copiar valor completo'}
          className={`dt-copy-btn ${copied ? 'dt-copy-btn--copied' : ''}`}
        >
          <AppIcon name={copied ? 'check' : 'copy'} size={12} />
        </button>
      )}
    </span>
  )
}

function Checkbox({ checked, indeterminate, onChange }) {
  const ref = useRef(null)
  if (ref.current) ref.current.indeterminate = !!indeterminate

  return (
    <label className="dt-checkbox">
      <input type="checkbox" checked={checked} onChange={onChange} ref={ref} className="visually-hidden" />
      <span className={`dt-checkbox__box ${checked || indeterminate ? 'dt-checkbox__box--checked' : ''}`}>
        {checked && <AppIcon name="check" size={9} style={{ color: '#fff', strokeWidth: 3 }} />}
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
    <div className="dt-empty">
      {children}
    </div>
  )
}

function PgBtn({ children, active, disabled, onClick }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`dt-pg-btn ${active ? 'dt-pg-btn--active' : ''}`}
    >
      {children}
    </button>
  )
}
