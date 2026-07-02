import { useEffect, useState } from 'react'
import api from '../../services/api'

const ESTADO_LABEL = {
  pendiente_instructor: 'Pend. Instructor',
  pendiente_admin:      'Pend. Admin',
  pendiente_bodega:     'Pend. Bodega',
  aprobado:             'Aprobada',
  rechazado:            'Rechazada',
  entregado:            'Entregada',
  devuelto:             'Devuelta',
}

const ESTADO_COLOR = {
  pendiente_instructor: '#f59e0b',
  pendiente_admin:      '#f59e0b',
  pendiente_bodega:     '#f59e0b',
  aprobado:             '#10b981',
  rechazado:            '#ef4444',
  entregado:            '#3b82f6',
  devuelto:             '#6b7280',
}

function KpiCard({ label, value, color, icon }) {
  return (
    <div style={{
      background: '#fff',
      border: '1px solid #e5e7eb',
      borderRadius: 12,
      padding: '20px 24px',
      display: 'flex',
      alignItems: 'center',
      gap: 16,
    }}>
      <div style={{
        width: 44, height: 44, borderRadius: 10,
        background: color + '18',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color,
      }}>
        {icon}
      </div>
      <div>
        <p style={{ margin: 0, fontSize: 12, color: '#6b7280', fontWeight: 500 }}>{label}</p>
        <p style={{ margin: '2px 0 0', fontSize: 26, fontWeight: 700, color: '#111827' }}>{value}</p>
      </div>
    </div>
  )
}

export function DashboardPersonal() {
  const [stats,   setStats]   = useState(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)

  useEffect(() => {
    api.get('/dashboard/stats/personal')
      .then(({ data }) => { setStats(data); setError(null) })
      .catch(() => setError('No se pudieron cargar tus estadísticas'))
      .finally(() => setLoading(false))
  }, [])

  const pendientes = stats
    ? (stats.solicitudesPorEstado['pendiente_instructor'] ?? 0)
      + (stats.solicitudesPorEstado['pendiente_admin'] ?? 0)
      + (stats.solicitudesPorEstado['pendiente_bodega'] ?? 0)
    : 0

  const formatFecha = (fecha) =>
    new Date(fecha).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })

  if (error) return (
    <div style={{ background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.25)', borderRadius:10, padding:'12px 16px', fontSize:13, color:'#ef4444' }}>
      {error}
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* KPI cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
        <KpiCard
          label="Mis préstamos activos"
          value={loading ? '—' : stats?.prestamosActivos ?? 0}
          color="#3b82f6"
          icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 014-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 01-4 4H3"/></svg>}
        />
        <KpiCard
          label="Préstamos vencidos"
          value={loading ? '—' : stats?.prestamosVencidos ?? 0}
          color="#ef4444"
          icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>}
        />
        <KpiCard
          label="Próximos a vencer (3 días)"
          value={loading ? '—' : stats?.proximosAVencer ?? 0}
          color="#f59e0b"
          icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>}
        />
        <KpiCard
          label="Solicitudes pendientes"
          value={loading ? '—' : pendientes}
          color="#8b5cf6"
          icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

        {/* Solicitudes por estado */}
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 20 }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 14, fontWeight: 600, color: '#111827' }}>
            Mis solicitudes por estado
          </h3>
          {loading ? (
            <p style={{ color: '#9ca3af', fontSize: 13 }}>Cargando...</p>
          ) : !stats || Object.keys(stats.solicitudesPorEstado).length === 0 ? (
            <p style={{ color: '#9ca3af', fontSize: 13 }}>No tienes solicitudes registradas</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {Object.entries(stats.solicitudesPorEstado).map(([estado, total]) => (
                <div key={estado} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: ESTADO_COLOR[estado] ?? '#6b7280' }} />
                    <span style={{ fontSize: 13, color: '#374151' }}>
                      {ESTADO_LABEL[estado] ?? estado}
                    </span>
                  </div>
                  <span style={{
                    fontSize: 13, fontWeight: 600,
                    background: (ESTADO_COLOR[estado] ?? '#6b7280') + '18',
                    color: ESTADO_COLOR[estado] ?? '#6b7280',
                    padding: '2px 10px', borderRadius: 99,
                  }}>
                    {total}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Últimas solicitudes */}
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 20 }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 14, fontWeight: 600, color: '#111827' }}>
            Últimas solicitudes
          </h3>
          {loading ? (
            <p style={{ color: '#9ca3af', fontSize: 13 }}>Cargando...</p>
          ) : !stats?.ultimasSolicitudes?.length ? (
            <p style={{ color: '#9ca3af', fontSize: 13 }}>No tienes solicitudes aún</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {stats.ultimasSolicitudes.map((s) => (
                <div key={s.id} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '8px 0',
                  borderBottom: '1px solid #f3f4f6',
                }}>
                  <div>
                    <p style={{ margin: 0, fontSize: 12.5, color: '#374151', fontWeight: 500 }}>
                      {s.motivo?.slice(0, 40) ?? 'Sin motivo'}
                      {s.motivo?.length > 40 ? '…' : ''}
                    </p>
                    <p style={{ margin: '2px 0 0', fontSize: 11, color: '#9ca3af' }}>
                      {formatFecha(s.fecha_solicitud)}
                    </p>
                  </div>
                  <span style={{
                    fontSize: 11, fontWeight: 600,
                    background: (ESTADO_COLOR[s.estado] ?? '#6b7280') + '18',
                    color: ESTADO_COLOR[s.estado] ?? '#6b7280',
                    padding: '2px 8px', borderRadius: 99, whiteSpace: 'nowrap',
                  }}>
                    {ESTADO_LABEL[s.estado] ?? s.estado}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

    </div>
  )
}
