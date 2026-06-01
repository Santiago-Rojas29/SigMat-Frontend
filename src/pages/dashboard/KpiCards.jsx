const CARDS = [
  {
    key: 'total_materiales',
    label: 'Materiales',
    color: '#39A900',
    bg: 'rgba(57,169,0,0.08)',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 002 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/>
      </svg>
    ),
  },
  {
    key: 'total_prestamos_activos',
    label: 'Préstamos activos',
    color: '#3b82f6',
    bg: 'rgba(59,130,246,0.08)',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 014-4h14"/>
        <polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 01-4 4H3"/>
      </svg>
    ),
  },
  {
    key: 'total_prestamos_vencidos',
    label: 'Préstamos vencidos',
    color: '#ef4444',
    bg: 'rgba(239,68,68,0.08)',
    alert: true,
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/>
        <line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
    ),
  },
  {
    key: 'total_solicitudes_pendientes',
    label: 'Solicitudes pendientes',
    color: '#f59e0b',
    bg: 'rgba(245,158,11,0.08)',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
        <polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/>
        <line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
      </svg>
    ),
  },
  {
    key: 'total_incidencias_activas',
    label: 'Incidencias activas',
    color: '#8b5cf6',
    bg: 'rgba(139,92,246,0.08)',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
        <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
      </svg>
    ),
  },
  {
    key: 'total_lotes_stock_critico',
    label: 'Stock crítico',
    color: '#ef4444',
    bg: 'rgba(239,68,68,0.08)',
    alert: true,
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/>
        <line x1="6" y1="20" x2="6" y2="14"/>
      </svg>
    ),
  },
]

export function KpiCards({ kpis, loading }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12, marginBottom: 24 }}>
      {CARDS.map(({ key, label, color, bg, alert, icon }) => {
        const value = kpis?.[key] ?? 0
        const showAlert = alert && value > 0
        return (
          <div
            key={key}
            style={{
              background: '#fff',
              border: `1px solid ${showAlert ? color + '55' : '#e5e7eb'}`,
              borderRadius: 12,
              padding: '16px 18px',
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div
                style={{
                  width: 36, height: 36, borderRadius: 10, background: bg,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color,
                }}
              >
                {icon}
              </div>
              {showAlert && (
                <span style={{
                  fontSize: 10, fontWeight: 700, color, background: bg,
                  padding: '2px 7px', borderRadius: 99, letterSpacing: '0.3px',
                }}>
                  ALERTA
                </span>
              )}
            </div>
            {loading ? (
              <div style={{ height: 28, width: '60%', borderRadius: 6, background: '#f3f4f6' }} />
            ) : (
              <div style={{ fontSize: 28, fontWeight: 700, color: showAlert ? color : '#111827', lineHeight: 1 }}>
                {value.toLocaleString()}
              </div>
            )}
            <div style={{ fontSize: 12, color: '#6b7280', fontWeight: 500, lineHeight: 1.3 }}>{label}</div>
          </div>
        )
      })}
    </div>
  )
}
