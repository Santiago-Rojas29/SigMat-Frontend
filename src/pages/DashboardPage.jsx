import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { usePermissions } from '../context/PermissionsContext'
import api from '../services/api'

import { KpiCards }                    from './dashboard/KpiCards'
import { MaterialesNoDevueltosChart }  from './dashboard/MaterialesNoDevueltosChart'
import { SolicitudesMesChart }         from './dashboard/SolicitudesMesChart'
import { MaterialesChart }             from './dashboard/MaterialesChart'
import { IncidenciasChart }            from './dashboard/IncidenciasChart'
import { StockCriticoList }            from './dashboard/StockCriticoList'
import { MorososTable }                from './dashboard/MorososTable'

const MODULE_LABELS = {
  materiales: 'Materiales',
  prestamos:  'Préstamos',
  inventario: 'Inventario',
  usuarios:   'Usuarios',
  ubicaciones:'Ubicaciones',
}

const MODULE_ICONS = {
  materiales: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 002 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/>
    </svg>
  ),
  prestamos: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 014-4h14"/>
      <polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 01-4 4H3"/>
    </svg>
  ),
  inventario: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
    </svg>
  ),
  usuarios: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/>
    </svg>
  ),
  ubicaciones: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>
    </svg>
  ),
}

const greeting = () => {
  const h = new Date().getHours()
  if (h < 12) return 'Buenos días'
  if (h < 18) return 'Buenas tardes'
  return 'Buenas noches'
}

export function DashboardPage() {
  const { user }              = useAuth()
  const { modules, loading: loadingModules } = usePermissions()

  const [stats,        setStats]        = useState(null)
  const [loadingStats, setLoadingStats] = useState(true)
  const [statsError,   setStatsError]   = useState(null)

  useEffect(() => {
    setLoadingStats(true)
    api.get('/dashboard/stats')
      .then(({ data }) => { setStats(data); setStatsError(null) })
      .catch(() => setStatsError('No se pudieron cargar las estadísticas'))
      .finally(() => setLoadingStats(false))
  }, [])

  return (
    <div style={{ maxWidth: 1200 }}>

      {/* Welcome banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, #39A900 0%, #007832 100%)',
          borderRadius: 14,
          padding: '24px 32px',
          marginBottom: 24,
          color: '#fff',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div style={{ position:'absolute', right:-20, top:-20, width:160, height:160, borderRadius:'50%', background:'rgba(255,255,255,0.06)' }} />
        <div style={{ position:'absolute', right:60, bottom:-40, width:100, height:100, borderRadius:'50%', background:'rgba(255,255,255,0.04)' }} />
        <div style={{ position:'relative' }}>
          <p style={{ fontSize:12, fontWeight:500, opacity:0.8, margin:'0 0 4px', textTransform:'uppercase', letterSpacing:'0.5px' }}>
            {greeting()},
          </p>
          <h1 style={{ fontSize:22, fontWeight:700, margin:'0 0 6px' }}>
            {user?.correo ?? 'Usuario'}
          </h1>
          <div style={{ display:'flex', alignItems:'center', gap:16, flexWrap:'wrap' }}>
            <p style={{ fontSize:12.5, opacity:0.75, margin:0 }}>
              SIGMAT — Sistema de Gestión de Materiales y Activos Tecnológicos
            </p>
            {!loadingModules && modules.length > 0 && (
              <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                {modules.map((mod) => (
                  <div
                    key={mod}
                    style={{
                      display:'flex', alignItems:'center', gap:5,
                      background:'rgba(255,255,255,0.15)',
                      padding:'3px 10px', borderRadius:99,
                      fontSize:11, fontWeight:600,
                    }}
                  >
                    {MODULE_ICONS[mod] && (
                      <span style={{ opacity:0.9 }}>{MODULE_ICONS[mod]}</span>
                    )}
                    {MODULE_LABELS[mod] ?? mod}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Error banner */}
      {statsError && (
        <div style={{
          background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.25)',
          borderRadius:10, padding:'12px 16px', marginBottom:20,
          fontSize:13, color:'#ef4444', display:'flex', alignItems:'center', gap:8,
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          {statsError}
        </div>
      )}

      {/* KPI Cards */}
      <KpiCards kpis={stats?.kpis} loading={loadingStats} />

      {/* Row 1: Materiales no devueltos + Solicitudes por mes (auto-fetch con selector año) */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1.4fr', gap:16, marginBottom:16 }}>
        <MaterialesNoDevueltosChart data={stats?.materialesNoDevueltos} loading={loadingStats} />
        <SolicitudesMesChart />
      </div>

      {/* Row 2: Materiales horizontales + Incidencias */}
      <div style={{ display:'grid', gridTemplateColumns:'1.5fr 1fr', gap:16, marginBottom:16 }}>
        <MaterialesChart   data={stats?.materialesSolicitados} loading={loadingStats} />
        <IncidenciasChart  data={stats?.incidenciasTipo}       loading={loadingStats} />
      </div>

      {/* Row 3: Stock crítico + Morosos */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:16 }}>
        <StockCriticoList data={stats?.stockCritico}    loading={loadingStats} />
        <MorososTable     data={stats?.usuariosMorosos} loading={loadingStats} />
      </div>

    </div>
  )
}
