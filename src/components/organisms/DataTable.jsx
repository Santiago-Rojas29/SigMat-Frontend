import { Spinner } from '../atoms/Spinner'
import { AppButton } from '../atoms/AppButton'

/**
 * columns: Array<{
 *   key: string,
 *   header: string,
 *   render?: (row) => ReactNode,
 *   width?: string | number,
 *   align?: 'left' | 'center' | 'right',
 * }>
 */
export function DataTable({
  columns,
  data,
  loading,
  error,
  onRetry,
  emptyTitle = 'Sin registros',
  emptyDescription = 'No hay datos para mostrar.',
  emptyAction,
  rowKey = 'id',
}) {
  return (
    <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E5E7EB', overflow: 'hidden' }}>
      {error ? (
        <div style={{ padding: '48px 24px', textAlign: 'center' }}>
          <p style={{ fontSize: 14, color: '#DC2626', marginBottom: 12 }}>{error}</p>
          {onRetry && (
            <AppButton variant="ghost" size="compact" onClick={onRetry}>
              Reintentar
            </AppButton>
          )}
        </div>
      ) : loading ? (
        <div style={{ padding: '48px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <Spinner size={32} />
          <p style={{ color: '#9CA3AF', fontSize: 13.5, margin: 0 }}>Cargando…</p>
        </div>
      ) : data.length === 0 ? (
        <div style={{ padding: '60px 24px', textAlign: 'center' }}>
          <div style={{
            width: 56, height: 56, borderRadius: 16, margin: '0 auto 16px',
            background: 'rgba(57,169,0,0.07)',
            border: '1.5px dashed rgba(57,169,0,0.35)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#39A900"
              strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
          </div>
          <p style={{ fontSize: 15, fontWeight: 600, color: '#374151', margin: '0 0 6px' }}>{emptyTitle}</p>
          <p style={{ fontSize: 13.5, color: '#9CA3AF', margin: '0 0 20px', maxWidth: 320, marginLeft: 'auto', marginRight: 'auto' }}>
            {emptyDescription}
          </p>
          {emptyAction && emptyAction}
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #E5E7EB', background: '#F9FAFB' }}>
                {columns.map(col => (
                  <th key={col.key} style={{
                    padding: '11px 16px',
                    textAlign: col.align ?? 'left',
                    fontWeight: 600,
                    fontSize: 12,
                    color: '#6B7280',
                    textTransform: 'uppercase',
                    letterSpacing: '0.4px',
                    whiteSpace: 'nowrap',
                    width: col.width,
                  }}>
                    {col.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map(row => (
                <tr
                  key={row[rowKey]}
                  style={{ borderBottom: '1px solid #F3F4F6' }}
                  onMouseEnter={e => {
                    Array.from(e.currentTarget.children).forEach(td => {
                      td.style.background = '#F9FAFB'
                    })
                  }}
                  onMouseLeave={e => {
                    Array.from(e.currentTarget.children).forEach(td => {
                      td.style.background = ''
                    })
                  }}
                >
                  {columns.map(col => (
                    <td key={col.key} style={{
                      padding: '12px 16px',
                      textAlign: col.align ?? 'left',
                      color: '#374151',
                      transition: 'background 0.1s',
                    }}>
                      {col.render ? col.render(row) : row[col.key]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
