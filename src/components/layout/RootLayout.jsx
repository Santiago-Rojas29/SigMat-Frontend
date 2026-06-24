import { useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { AppIcon } from '../atoms/AppIcon'

const NAV = [
  { label: 'Centros',       path: '/root/centros', icon: 'building' },
  { label: 'Sedes',         path: '/root/sedes',   icon: 'map-pin'  },
  { label: 'Administradores', path: '/root/admins', icon: 'shield'  },
]

export function RootLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [sideOpen, setSideOpen] = useState(true)

  const handleLogout = () => { logout(); navigate('/login') }

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#f8fafc' }}>
      {/* Sidebar oscuro */}
      <aside style={{
        width: sideOpen ? 240 : 64,
        minWidth: sideOpen ? 240 : 64,
        background: '#0f172a',
        display: 'flex',
        flexDirection: 'column',
        transition: 'width 0.25s, min-width 0.25s',
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          height: 60, display: 'flex', alignItems: 'center',
          padding: '0 16px', borderBottom: '1px solid #1e293b',
          justifyContent: sideOpen ? 'space-between' : 'center',
        }}>
          {sideOpen ? (
            <span style={{ color: '#f59e0b', fontWeight: 800, fontSize: 17, letterSpacing: 1 }}>
              SIGMAT ROOT
            </span>
          ) : (
            <span style={{ color: '#f59e0b', fontWeight: 800, fontSize: 14 }}>R</span>
          )}
          <button onClick={() => setSideOpen(p => !p)} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: '#64748b', display: 'flex', padding: 4,
          }}>
            <AppIcon name={sideOpen ? 'chev-left' : 'chev-right'} size={16} />
          </button>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '12px 0', overflowY: 'auto' }}>
          {sideOpen && (
            <div style={{
              padding: '0 20px 8px', fontSize: 10, fontWeight: 600,
              letterSpacing: '0.9px', textTransform: 'uppercase', color: '#64748b',
            }}>
              Gestión de tenants
            </div>
          )}
          {NAV.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              style={({ isActive }) => ({
                display: 'flex', alignItems: 'center', gap: 10,
                padding: sideOpen ? '10px 20px' : '10px 0',
                justifyContent: sideOpen ? 'flex-start' : 'center',
                color: isActive ? '#f59e0b' : '#94a3b8',
                background: isActive ? '#1e293b' : 'transparent',
                textDecoration: 'none', fontSize: 13.5, fontWeight: 500,
                borderLeft: isActive ? '3px solid #f59e0b' : '3px solid transparent',
                transition: 'all 0.15s',
              })}
              title={!sideOpen ? item.label : undefined}
            >
              <AppIcon name={item.icon} size={17} style={{ flexShrink: 0 }} />
              {sideOpen && item.label}
            </NavLink>
          ))}
        </nav>

        {/* Footer / Logout */}
        {sideOpen && (
          <div style={{ padding: '12px 16px', borderTop: '1px solid #1e293b' }}>
            <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 8 }}>
              {user?.nombres} {user?.apellidos}
            </div>
            <button onClick={handleLogout} style={{
              width: '100%', padding: '8px 0', borderRadius: 6,
              background: '#dc2626', color: '#fff', border: 'none',
              cursor: 'pointer', fontSize: 12, fontWeight: 600,
            }}>
              Cerrar sesión
            </button>
          </div>
        )}
      </aside>

      {/* Main */}
      <main style={{ flex: 1, overflow: 'auto' }}>
        {/* Topbar */}
        <div style={{
          height: 60, display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', padding: '0 24px',
          background: '#fff', borderBottom: '1px solid #e2e8f0',
        }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>
            Panel de Super Administrador
          </span>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '4px 12px', borderRadius: 6,
            background: '#fef3c7', border: '1px solid #fde68a',
          }}>
            <AppIcon name="shield" size={14} style={{ color: '#d97706' }} />
            <span style={{ fontSize: 12, fontWeight: 700, color: '#92400e' }}>ROOT</span>
          </div>
        </div>

        {/* Content */}
        <div style={{ padding: 24 }}>
          <Outlet />
        </div>
      </main>
    </div>
  )
}
