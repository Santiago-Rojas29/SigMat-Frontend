import { useEffect, useState } from 'react'
import api from '../../services/api'
import { PageHeader } from '../../components/molecules/PageHeader'
import { SearchableSelect } from '../../components/atoms/SearchableSelect'
import { KpiCards } from './KpiCards'
import { MaterialesNoDevueltosChart } from './MaterialesNoDevueltosChart'
import { MaterialesChart } from './MaterialesChart'
import { IncidenciasChart } from './IncidenciasChart'
import { StockCriticoList } from './StockCriticoList'
import { MorososTable } from './MorososTable'

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

function UsuariosPorRolBlock({ titulo, usuariosPorRol, loading }) {
  return (
    <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 20 }}>
      <h3 style={{ margin: '0 0 16px', fontSize: 14, fontWeight: 600, color: '#111827' }}>
        {titulo}
      </h3>
      {loading ? (
        <p style={{ color: '#9ca3af', fontSize: 13 }}>Cargando...</p>
      ) : !usuariosPorRol?.length ? (
        <p style={{ color: '#9ca3af', fontSize: 13 }}>Sin datos</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {usuariosPorRol.map(({ rol, total }) => {
            const color = ROL_COLOR[rol] ?? '#6b7280'
            const max   = Math.max(...usuariosPorRol.map(r => r.total))
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
  )
}

function EstadoBadge({ estado }) {
  const activo = estado === 'activo'
  return (
    <span style={{
      display: 'inline-block', fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 99,
      color: activo ? '#16a34a' : '#ef4444',
      background: activo ? 'rgba(22,163,74,0.1)' : 'rgba(239,68,68,0.1)',
    }}>
      {activo ? 'Activa' : 'Inactiva'}
    </span>
  )
}

export function DashboardRoot() {
  const [stats,   setStats]   = useState(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)

  const [sedes, setSedes] = useState([])
  const [sedeSeleccionada, setSedeSeleccionada] = useState('') // '' = todas

  const [sedeStats,   setSedeStats]   = useState(null)
  const [loadingSede, setLoadingSede] = useState(false)
  const [sedeError,   setSedeError]   = useState(null)

  useEffect(() => {
    api.get('/dashboard/stats/root')
      .then(({ data }) => { setStats(data); setError(null) })
      .catch(() => setError('No se pudieron cargar las estadísticas del sistema'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    api.get('/sede')
      .then(({ data }) => setSedes(data ?? []))
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!sedeSeleccionada) { setSedeStats(null); return }
    setLoadingSede(true)
    api.get(`/dashboard/stats/sede/${sedeSeleccionada}`)
      .then(({ data }) => { setSedeStats(data); setSedeError(null) })
      .catch(() => setSedeError('No se pudieron cargar las estadísticas de esta sede'))
      .finally(() => setLoadingSede(false))
  }, [sedeSeleccionada])

  if (error) return (
    <div style={{ background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.25)', borderRadius:10, padding:'12px 16px', fontSize:13, color:'#ef4444' }}>
      {error}
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <PageHeader
        title="Resumen del sistema"
        description="Vista global de todos los centros, sedes y usuarios registrados en SIGMAT."
      />

      {/* Selector de sede */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', flexShrink: 0 }}>Ver:</label>
        <div style={{ maxWidth: 320 }}>
          <SearchableSelect
            value={sedeSeleccionada}
            onChange={setSedeSeleccionada}
            placeholder="Todas las sedes (resumen global)"
            options={[
              { value: '', label: 'Todas las sedes (resumen global)' },
              ...sedes.map((s) => ({ value: s.id_sede, label: s.nombre })),
            ]}
          />
        </div>
      </div>

      {!sedeSeleccionada ? (
        <>
          {/* KPI cards globales */}
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

          <UsuariosPorRolBlock
            titulo="Usuarios activos por rol"
            usuariosPorRol={stats?.usuariosPorRol}
            loading={loading}
          />
        </>
      ) : sedeError ? (
        <div style={{ background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.25)', borderRadius:10, padding:'12px 16px', fontSize:13, color:'#ef4444' }}>
          {sedeError}
        </div>
      ) : (
        <>
          {/* Info de la sede seleccionada */}
          <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 20 }}>
            {loadingSede ? (
              <p style={{ color: '#9ca3af', fontSize: 13, margin: 0 }}>Cargando...</p>
            ) : (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#111827' }}>
                    {sedeStats?.sede?.nombre ?? 'Sede'}
                  </h3>
                  <EstadoBadge estado={sedeStats?.sede?.estado} />
                </div>
                <p style={{ margin: 0, fontSize: 13, color: '#6b7280' }}>
                  {sedeStats?.sede?.centro} · {sedeStats?.sede?.direccion || 'Sin dirección'} · {sedeStats?.sede?.telefono || 'Sin teléfono'}
                </p>
              </>
            )}
          </div>

          <KpiCard
            label="Usuarios activos en esta sede"
            value={loadingSede ? '—' : sedeStats?.usuariosActivos ?? 0}
            color="#0d9488"
            icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>}
          />

          <KpiCards kpis={sedeStats?.kpis} loading={loadingSede} />

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
            <MaterialesNoDevueltosChart data={sedeStats?.materialesNoDevueltos} loading={loadingSede} />
            <MaterialesChart            data={sedeStats?.materialesSolicitados} loading={loadingSede} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
            <IncidenciasChart  data={sedeStats?.incidenciasTipo} loading={loadingSede} />
            <StockCriticoList  data={sedeStats?.stockCritico}    loading={loadingSede} />
          </div>

          <MorososTable data={sedeStats?.usuariosMorosos} loading={loadingSede} />

          <UsuariosPorRolBlock
            titulo="Usuarios activos por rol en esta sede"
            usuariosPorRol={sedeStats?.usuariosPorRol}
            loading={loadingSede}
          />
        </>
      )}
    </div>
  )
}
