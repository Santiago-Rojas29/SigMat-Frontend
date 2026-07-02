import { useEffect, useState } from 'react'
import api from '../../services/api'

const ROL_COLOR = {
  'Administrador':         '#7c3aed',
  'Instructor':            '#2563eb',
  'Responsable de Bodega': '#0d9488',
  'Aprendiz':              '#d97706',
  'Root':                  '#39A900',
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

export function DashboardRoot() {
  const [stats,   setStats]   = useState(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)

  useEffect(() => {
    api.get('/dashboard/stats/root')
      .then(({ data }) => { setStats(data); setError(null) })
      .catch(() => setError('No se pudieron cargar las estadísticas del sistema'))
      .finally(() => setLoading(false))
  }, [])

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
          label="Centros activos"
          value={loading ? '—' : stats?.centrosActivos ?? 0}
          color="#39A900"
          icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>}
        />
        <KpiCard
          label="Sedes activas"
          value={loading ? '—' : stats?.sedesActivas ?? 0}
          color="#3b82f6"
          icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>}
        />
        <KpiCard
          label="Administradores activos"
          value={loading ? '—' : stats?.administradores ?? 0}
          color="#7c3aed"
          icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>}
        />
        <KpiCard
          label="Usuarios activos"
          value={loading ? '—' : stats?.usuariosActivos ?? 0}
          color="#0d9488"
          icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>}
        />
      </div>

      {/* Usuarios por rol */}
      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 20 }}>
        <h3 style={{ margin: '0 0 16px', fontSize: 14, fontWeight: 600, color: '#111827' }}>
          Usuarios activos por rol
        </h3>
        {loading ? (
          <p style={{ color: '#9ca3af', fontSize: 13 }}>Cargando...</p>
        ) : !stats?.usuariosPorRol?.length ? (
          <p style={{ color: '#9ca3af', fontSize: 13 }}>Sin datos</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {stats.usuariosPorRol.map(({ rol, total }) => {
              const color = ROL_COLOR[rol] ?? '#6b7280'
              const max   = Math.max(...stats.usuariosPorRol.map(r => r.total))
              const pct   = max > 0 ? Math.round((total / max) * 100) : 0
              return (
                <div key={rol}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 13, color: '#374151', fontWeight: 500 }}>{rol}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color }}>{total}</span>
                  </div>
                  <div style={{ height: 6, background: '#f3f4f6', borderRadius: 99, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: pct + '%', background: color, borderRadius: 99, transition: 'width 0.5s' }} />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

    </div>
  )
}
