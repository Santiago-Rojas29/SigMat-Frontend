function Badge({ dias }) {
  const color = dias > 30 ? '#ef4444' : dias > 14 ? '#f59e0b' : '#8b5cf6'
  const bg    = dias > 30 ? 'rgba(239,68,68,0.1)' : dias > 14 ? 'rgba(245,158,11,0.1)' : 'rgba(139,92,246,0.1)'
  return (
    <span style={{
      fontSize: 11, fontWeight: 700, color, background: bg,
      padding: '2px 8px', borderRadius: 99,
    }}>
      {dias}d
    </span>
  )
}

export function MorososTable({ data, loading }) {
  return (
    <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: '20px 20px 16px' }}>
      <div style={{ marginBottom: 16 }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: '#111827', margin: 0 }}>Usuarios con préstamos vencidos</h3>
        <p style={{ fontSize: 12, color: '#6b7280', margin: '2px 0 0' }}>Materiales no devueltos tras la fecha límite</p>
      </div>
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[1,2,3,4].map(i => (
            <div key={i} style={{ height: 36, background: '#f9fafb', borderRadius: 8 }} />
          ))}
        </div>
      ) : !data?.length ? (
        <div style={{ height: 180, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, color: '#9ca3af' }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#d1fae5" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
          </svg>
          <span style={{ fontSize: 13 }}>Sin usuarios morosos</span>
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
            <thead>
              <tr>
                {['Usuario', 'Correo', 'Préstamos', 'Días vencido'].map(h => (
                  <th
                    key={h}
                    style={{
                      textAlign: 'left', padding: '6px 10px',
                      borderBottom: '1px solid #f3f4f6',
                      fontSize: 11, color: '#9ca3af', fontWeight: 600,
                      textTransform: 'uppercase', letterSpacing: '0.4px',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((row, i) => (
                <tr
                  key={i}
                  style={{ borderBottom: i < data.length - 1 ? '1px solid #f9fafb' : 'none' }}
                >
                  <td style={{ padding: '8px 10px', fontWeight: 600, color: '#111827', whiteSpace: 'nowrap' }}>
                    {row.nombre}
                  </td>
                  <td style={{ padding: '8px 10px', color: '#6b7280', fontSize: 12 }}>
                    {row.correo}
                  </td>
                  <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                    <span style={{
                      fontWeight: 700, color: '#ef4444',
                      background: 'rgba(239,68,68,0.1)',
                      padding: '2px 10px', borderRadius: 99, fontSize: 13,
                    }}>
                      {row.prestamos_vencidos}
                    </span>
                  </td>
                  <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                    <Badge dias={row.dias_vencido} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
