function StockBar({ porcentaje }) {
  const color = porcentaje <= 10 ? '#ef4444' : porcentaje <= 20 ? '#f59e0b' : '#39A900'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ flex: 1, height: 6, background: '#f3f4f6', borderRadius: 99, overflow: 'hidden' }}>
        <div
          style={{
            width: `${Math.max(porcentaje, 2)}%`,
            height: '100%',
            background: color,
            borderRadius: 99,
            transition: 'width 0.5s ease',
          }}
        />
      </div>
      <span style={{ fontSize: 11, fontWeight: 700, color, minWidth: 32, textAlign: 'right' }}>
        {porcentaje}%
      </span>
    </div>
  )
}

export function StockCriticoList({ data, loading }) {
  return (
    <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: '20px 20px 16px' }}>
      <div style={{ marginBottom: 16 }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: '#111827', margin: 0 }}>Stock crítico</h3>
        <p style={{ fontSize: 12, color: '#6b7280', margin: '2px 0 0' }}>Lotes con ≤ 25% de stock inicial</p>
      </div>
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[1,2,3,4].map(i => (
            <div key={i} style={{ height: 44, background: '#f9fafb', borderRadius: 8 }} />
          ))}
        </div>
      ) : !data?.length ? (
        <div style={{ height: 180, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, color: '#9ca3af' }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#d1fae5" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
          </svg>
          <span style={{ fontSize: 13 }}>Sin lotes en stock crítico</span>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {data.map((item, i) => (
            <div key={i}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <div>
                  <span style={{ fontSize: 12.5, fontWeight: 600, color: '#111827' }}>
                    {item.nombre.length > 28 ? item.nombre.slice(0, 28) + '…' : item.nombre}
                  </span>
                  <span style={{ fontSize: 11, color: '#9ca3af', marginLeft: 6 }}>#{item.codigo_lote}</span>
                </div>
                <span style={{ fontSize: 11, color: '#6b7280' }}>
                  {item.disponible}/{item.inicial}
                </span>
              </div>
              <StockBar porcentaje={item.porcentaje} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
