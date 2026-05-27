import { Outlet } from 'react-router-dom'
import { usePermissions } from '../context/PermissionsContext'

const spinnerStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  height: '100%',
  minHeight: 200,
}

const forbiddenStyle = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  height: '100%',
  minHeight: 300,
  gap: 12,
}

export function PermissionRoute({ module }) {
  const { hasPermission, hasAnyPermission, loading } = usePermissions()

  if (loading) {
    return (
      <div style={spinnerStyle}>
        <div style={{
          width: 32, height: 32, borderRadius: '50%',
          border: '3px solid #e5e7eb',
          borderTopColor: '#39A900',
          animation: 'spin 0.8s linear infinite',
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  const permitted = Array.isArray(module)
    ? hasAnyPermission(module)
    : hasPermission(module)

  if (!permitted) {
    return (
      <div style={forbiddenStyle}>
        <div style={{
          width: 64, height: 64, borderRadius: '50%',
          background: '#fef2f2',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/>
            <line x1="9" y1="9" x2="15" y2="15"/>
          </svg>
        </div>
        <h3 style={{ fontSize: 18, fontWeight: 600, color: '#111827', margin: 0 }}>
          Acceso denegado
        </h3>
        <p style={{ color: '#6b7280', fontSize: 14, margin: 0, textAlign: 'center' }}>
          No tienes permiso para acceder a este módulo.
        </p>
      </div>
    )
  }

  return <Outlet />
}
