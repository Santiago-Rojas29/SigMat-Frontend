import { useAuth } from '../context/AuthContext'
import { usePermissions } from '../context/PermissionsContext'

const MODULE_LABELS = {
  materiales: 'Materiales',
  prestamos: 'Préstamos',
  inventario: 'Inventario',
  usuarios: 'Usuarios',
  ubicaciones: 'Ubicaciones',
}

const MODULE_ICONS = {
  materiales: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 002 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/>
      <polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>
    </svg>
  ),
  prestamos: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 014-4h14"/>
      <polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 01-4 4H3"/>
    </svg>
  ),
  inventario: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
    </svg>
  ),
  usuarios: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/>
    </svg>
  ),
  ubicaciones: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>
    </svg>
  ),
}

export function DashboardPage() {
  const { user } = useAuth()
  const { modules, loading } = usePermissions()

  const greeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Buenos días'
    if (h < 18) return 'Buenas tardes'
    return 'Buenas noches'
  }

  return (
    <div style={{ maxWidth: 900 }}>
      {/* Welcome banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, #39A900 0%, #007832 100%)',
          borderRadius: 14,
          padding: '28px 32px',
          marginBottom: 24,
          color: '#fff',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div style={{ position: 'absolute', right: -20, top: -20, width: 160, height: 160, borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />
        <div style={{ position: 'absolute', right: 60, bottom: -40, width: 100, height: 100, borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />
        <p style={{ fontSize: 13, fontWeight: 500, opacity: 0.8, margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          {greeting()},
        </p>
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: '0 0 8px' }}>
          {user?.correo ?? 'Usuario'}
        </h1>
        <p style={{ fontSize: 13.5, opacity: 0.75, margin: 0 }}>
          Sistema de Gestión de Materiales y Activos Tecnológicos — SIGMAT
        </p>
      </div>

      {/* Permissions summary */}
      <div
        style={{
          background: '#fff',
          borderRadius: 12,
          border: '1px solid #e5e7eb',
          padding: '20px 24px',
          marginBottom: 20,
        }}
      >
        <h2 style={{ fontSize: 14, fontWeight: 600, color: '#374151', margin: '0 0 14px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Módulos habilitados
        </h2>

        {loading ? (
          <div style={{ display: 'flex', gap: 8 }}>
            {[1, 2, 3].map((i) => (
              <div key={i} style={{ height: 72, width: 140, borderRadius: 10, background: '#f3f4f6', animation: 'pulse 1.5s ease-in-out infinite' }} />
            ))}
            <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }`}</style>
          </div>
        ) : modules.length === 0 ? (
          <p style={{ fontSize: 13.5, color: '#9ca3af', margin: 0 }}>
            Tu rol no tiene módulos asignados. Contacta al administrador.
          </p>
        ) : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
            {modules.map((mod) => (
              <div
                key={mod}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  padding: '14px 20px',
                  borderRadius: 10,
                  border: '1.5px solid rgba(57,169,0,0.25)',
                  background: 'rgba(57,169,0,0.05)',
                  minWidth: 110,
                  color: '#39A900',
                }}
              >
                {MODULE_ICONS[mod] ?? null}
                <span style={{ fontSize: 12.5, fontWeight: 600, color: '#374151' }}>
                  {MODULE_LABELS[mod] ?? mod}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Info cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14 }}>
        {[
          { label: 'Versión del sistema', value: 'v1.0.0', icon: '🚀' },
          { label: 'Centro SENA', value: 'En configuración', icon: '🏛️' },
          { label: 'Estado', value: 'Operativo', icon: '✅', green: true },
        ].map(({ label, value, icon, green }) => (
          <div
            key={label}
            style={{
              background: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: 12,
              padding: '18px 20px',
              display: 'flex',
              alignItems: 'center',
              gap: 14,
            }}
          >
            <span style={{ fontSize: 24 }}>{icon}</span>
            <div>
              <div style={{ fontSize: 11, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 2 }}>
                {label}
              </div>
              <div style={{ fontSize: 14, fontWeight: 600, color: green ? '#39A900' : '#111827' }}>
                {value}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
