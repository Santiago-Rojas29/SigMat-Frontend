import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { usePermissions } from '../../context/PermissionsContext'
import sigmatLogo from '../../assets/sigmat-logo.png'

const W_OPEN   = 240
const W_CLOSED = 64

// ── Icons ─────────────────────────────────────────────────────────────────

function Ic({ size = 18, children, viewBox = '0 0 24 24' }) {
  return (
    <svg width={size} height={size} viewBox={viewBox} fill="none"
      stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"
      style={{ flexShrink: 0 }}>
      {children}
    </svg>
  )
}

const icons = {
  menu:      (s) => <Ic size={s}><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></Ic>,
  chevL:     (s) => <Ic size={s}><polyline points="15 18 9 12 15 6"/></Ic>,
  chevR:     (s) => <Ic size={s}><polyline points="9 18 15 12 9 6"/></Ic>,
  chevD:     (s) => <Ic size={s}><polyline points="6 9 12 15 18 9"/></Ic>,
  logout:    (s) => <Ic size={s}><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></Ic>,
  dashboard: (s) => <Ic size={s}><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></Ic>,
  building:  (s) => <Ic size={s}><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></Ic>,
  mapPin:    (s) => <Ic size={s}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></Ic>,
  folder:    (s) => <Ic size={s}><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/></Ic>,
  book:      (s) => <Ic size={s}><path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z"/><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/></Ic>,
  clipboard: (s) => <Ic size={s}><path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/></Ic>,
  users:     (s) => <Ic size={s}><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></Ic>,
  shield:    (s) => <Ic size={s}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></Ic>,
  key:       (s) => <Ic size={s}><circle cx="7.5" cy="15.5" r="5.5"/><path d="M21 2l-9.6 9.6"/><path d="M15.5 7.5l3 3L22 7l-3-3"/></Ic>,
  package:   (s) => <Ic size={s}><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 002 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></Ic>,
  layers:    (s) => <Ic size={s}><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></Ic>,
  tool:      (s) => <Ic size={s}><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/></Ic>,
  arrows:    (s) => <Ic size={s}><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 014-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 01-4 4H3"/></Ic>,
  file:      (s) => <Ic size={s}><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></Ic>,
  truck:     (s) => <Ic size={s}><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></Ic>,
  return:    (s) => <Ic size={s}><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 102.13-9.36L1 10"/></Ic>,
  alert:     (s) => <Ic size={s}><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></Ic>,
  shuffle:   (s) => <Ic size={s}><polyline points="16 3 21 3 21 8"/><line x1="4" y1="20" x2="21" y2="3"/><polyline points="21 16 21 21 16 21"/><line x1="15" y1="15" x2="21" y2="21"/><line x1="4" y1="4" x2="9" y2="9"/></Ic>,
  chart:     (s) => <Ic size={s}><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></Ic>,
  check:     (s) => <Ic size={s}><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></Ic>,
}

// ── Nav structure ──────────────────────────────────────────────────────────

const NAV = [
  {
    section: null,
    sectionModule: null,
    items: [
      { label: 'Dashboard', path: '/dashboard', icon: 'dashboard', module: null },
    ],
  },
  {
    section: 'Estructura',
    sectionModule: null,
    items: [
      { label: 'Centros',   path: '/estructura/centros',   icon: 'building',  module: null },
      { label: 'Sedes',     path: '/estructura/sedes',     icon: 'mapPin',    module: null },
      { label: 'Áreas',     path: '/estructura/areas',     icon: 'folder',    module: null },
      { label: 'Programas', path: '/estructura/programas', icon: 'book',      module: null },
      { label: 'Fichas',    path: '/estructura/fichas',    icon: 'clipboard', module: null },
    ],
  },
  {
    section: 'Administración',
    sectionModule: 'usuarios',
    items: [
      { label: 'Usuarios', path: '/admin/usuarios', icon: 'users',  module: 'usuarios' },
      { label: 'Roles',    path: '/admin/roles',    icon: 'shield', module: 'usuarios' },
    ],
  },
  {
    section: 'Inventario',
    sectionModule: ['materiales', 'ubicaciones'],
    items: [
      { label: 'Materiales',  path: '/inventario/materiales',  icon: 'package', module: 'materiales' },
      { label: 'Lotes',       path: '/inventario/lotes',       icon: 'layers',  module: 'materiales' },
      { label: 'Unidades',    path: '/inventario/unidades',    icon: 'tool',    module: 'materiales' },
      { label: 'Ubicaciones', path: '/inventario/ubicaciones', icon: 'mapPin',  module: 'ubicaciones' },
    ],
  },
  {
    section: 'Movimientos',
    sectionModule: 'prestamos',
    items: [
      { label: 'Solicitudes', path: '/movimientos/solicitudes', icon: 'file',   module: 'prestamos' },
      { label: 'Préstamos',   path: '/movimientos/prestamos',   icon: 'arrows', module: 'prestamos' },
    ],
  },
  {
    section: 'Control y Seguimiento',
    sectionModule: 'inventario',
    items: [
      { label: 'Traslados',  path: '/control/traslados',  icon: 'shuffle', module: 'inventario' },
      { label: 'Incidencias', path: '/control/incidencias', icon: 'alert',  module: 'inventario' },
      { label: 'Kardex',     path: '/control/kardex',     icon: 'chart',   module: 'inventario' },
    ],
  },
]

// ── CSS ────────────────────────────────────────────────────────────────────

const CSS = `
  .smt-link {
    display: flex; align-items: center; gap: 10px;
    padding: 9px 12px; margin: 1px 8px; border-radius: 8px;
    text-decoration: none; font-size: 13.5px; font-weight: 400;
    color: #6b7280; transition: background 0.15s, color 0.15s;
    white-space: nowrap; overflow: hidden; cursor: pointer;
  }
  .smt-link:hover { background: #f0f8e8; color: #2d8000; }
  .smt-link.active {
    background: #e4f5cc; color: #2d8000; font-weight: 600;
    box-shadow: inset 3px 0 0 #39A900;
  }
  .smt-link.icon-only { justify-content: center; padding: 10px 0; margin: 1px 8px; }
  .smt-link.icon-only.active { box-shadow: inset 3px 0 0 #39A900; }
  .smt-toggle {
    background: none; border: none; cursor: pointer;
    color: #9ca3af; padding: 6px; border-radius: 6px;
    display: flex; align-items: center; justify-content: center;
    transition: background 0.15s, color 0.15s; flex-shrink: 0;
  }
  .smt-toggle:hover { background: #f0f8e8; color: #39A900; }
  .smt-nav { scrollbar-width: thin; scrollbar-color: #d1fae5 transparent; }
  .smt-nav::-webkit-scrollbar { width: 4px; }
  .smt-nav::-webkit-scrollbar-track { background: transparent; }
  .smt-nav::-webkit-scrollbar-thumb { background: #d1fae5; border-radius: 4px; }
`

// ── Sidebar ────────────────────────────────────────────────────────────────

export function Sidebar({ isOpen, onToggle }) {
  const { user, logout } = useAuth()
  const { hasPermission, hasAnyPermission } = usePermissions()
  const navigate = useNavigate()
  const [openSections, setOpenSections] = useState({})
  const [logoutHover, setLogoutHover] = useState(false)

  const handleLogout = () => { logout(); navigate('/login', { replace: true }) }

  const toggleSection = (s) => setOpenSections(p => ({ ...p, [s]: p[s] === false ? true : false }))

  const sectionVisible = (mod) => {
    if (!mod) return true
    return Array.isArray(mod) ? hasAnyPermission(mod) : hasPermission(mod)
  }
  const itemVisible = (mod) => (!mod ? true : hasPermission(mod))

  const initials = user?.correo ? user.correo.slice(0, 2).toUpperCase() : 'U'

  return (
    <aside style={{
      width: isOpen ? W_OPEN : W_CLOSED,
      minWidth: isOpen ? W_OPEN : W_CLOSED,
      height: '100vh',
      background: '#ffffff',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      borderRight: '1px solid #e5e7eb',
      transition: 'width 0.25s cubic-bezier(0.4,0,0.2,1), min-width 0.25s cubic-bezier(0.4,0,0.2,1)',
    }}>
      <style>{CSS}</style>

      {/* ── Header ── */}
      <div style={{
        height: 60, display: 'flex', alignItems: 'center',
        padding: '0 12px', gap: 8, flexShrink: 0,
        borderBottom: '1px solid #e5e7eb',
        justifyContent: isOpen ? 'space-between' : 'center',
      }}>
        {isOpen && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, overflow: 'hidden', minWidth: 0 }}>
            <img src={sigmatLogo} alt="SIGMAT"
              style={{ height: 30, width: 'auto', objectFit: 'contain', flexShrink: 0 }} />
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#111827', letterSpacing: '-0.2px', lineHeight: 1.2 }}>
                SIGMAT
              </div>
              <div style={{ fontSize: 9, color: '#9ca3af', letterSpacing: '1px', textTransform: 'uppercase' }}>
                SENA
              </div>
            </div>
          </div>
        )}
        {!isOpen && (
          <img src={sigmatLogo} alt="SIGMAT"
            style={{ height: 26, width: 'auto', objectFit: 'contain' }} />
        )}
        <button className="smt-toggle" onClick={onToggle} title={isOpen ? 'Colapsar' : 'Expandir'}>
          {isOpen ? icons.chevL(16) : icons.chevR(16)}
        </button>
      </div>

      {/* ── Navigation ── */}
      <nav className="smt-nav" style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '6px 0' }}>
        {NAV.map(({ section, sectionModule, items }) => {
          if (!sectionVisible(sectionModule)) return null
          const visible = items.filter(it => itemVisible(it.module))
          if (visible.length === 0) return null
          const expanded = openSections[section] !== false

          return (
            <div key={section ?? '__top'} style={{ marginBottom: section ? 2 : 0 }}>

              {/* Section header */}
              {section && isOpen && (
                <button
                  onClick={() => toggleSection(section)}
                  style={{
                    width: '100%', background: 'none', border: 'none',
                    padding: '10px 20px 4px', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  }}
                >
                  <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.9px',
                    textTransform: 'uppercase', color: '#9ca3af' }}>
                    {section}
                  </span>
                  <span style={{
                    color: '#9ca3af', display: 'flex', alignItems: 'center',
                    transform: expanded ? 'rotate(0deg)' : 'rotate(-90deg)',
                    transition: 'transform 0.2s',
                  }}>
                    {icons.chevD(12)}
                  </span>
                </button>
              )}

              {/* Divider when collapsed */}
              {section && !isOpen && (
                <div style={{ height: 1, background: '#e5e7eb', margin: '6px 10px' }} />
              )}

              {/* Items */}
              {(expanded || !section || !isOpen) && (
                <div>
                  {visible.map(item => (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      end={item.path === '/dashboard'}
                      title={!isOpen ? item.label : undefined}
                      className={({ isActive }) =>
                        `smt-link${isOpen ? '' : ' icon-only'}${isActive ? ' active' : ''}`
                      }
                    >
                      {icons[item.icon]?.(17)}
                      {isOpen && item.label}
                    </NavLink>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </nav>

      {/* ── User area ── */}
      <div style={{
        padding: isOpen ? '12px 14px' : '12px 0',
        borderTop: '1px solid #e5e7eb',
        display: 'flex', alignItems: 'center',
        gap: isOpen ? 10 : 0,
        justifyContent: isOpen ? 'flex-start' : 'center',
        flexShrink: 0,
      }}>
        <div style={{
          width: 32, height: 32, borderRadius: '50%',
          background: 'linear-gradient(135deg, #39A900, #007832)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 700, fontSize: 12, color: '#fff', flexShrink: 0,
        }}>
          {initials}
        </div>

        {isOpen && (
          <>
            <div style={{ flex: 1, overflow: 'hidden', minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 500, color: '#374151',
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user?.correo ?? '—'}
              </div>
              <div style={{ fontSize: 10, color: '#9ca3af' }}>Sesión activa</div>
            </div>
            <button
              className="smt-toggle"
              onClick={handleLogout}
              onMouseEnter={() => setLogoutHover(true)}
              onMouseLeave={() => setLogoutHover(false)}
              title="Cerrar sesión"
              style={{ color: logoutHover ? '#ef4444' : '#52525b',
                background: logoutHover ? 'rgba(239,68,68,0.1)' : 'transparent' }}
            >
              {icons.logout(16)}
            </button>
          </>
        )}
      </div>
    </aside>
  )
}
