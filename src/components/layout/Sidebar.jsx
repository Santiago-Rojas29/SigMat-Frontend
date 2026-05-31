import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { usePermissions } from '../../context/PermissionsContext'
import sigmatLogo from '../../assets/sigmat-logo.png'

const W_OPEN   = 240
const W_CLOSED = 64

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
  chevD:     (s) => <Ic size={s}><polyline points="6 9 12 15 18 9"/></Ic>,
  dashboard: (s) => <Ic size={s}><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></Ic>,
  building:  (s) => <Ic size={s}><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></Ic>,
  mapPin:    (s) => <Ic size={s}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></Ic>,
  folder:    (s) => <Ic size={s}><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/></Ic>,
  book:      (s) => <Ic size={s}><path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z"/><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/></Ic>,
  clipboard: (s) => <Ic size={s}><path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/></Ic>,
  users:     (s) => <Ic size={s}><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></Ic>,
  shield:    (s) => <Ic size={s}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></Ic>,
  package:   (s) => <Ic size={s}><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 002 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></Ic>,
  layers:    (s) => <Ic size={s}><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></Ic>,
  tool:      (s) => <Ic size={s}><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/></Ic>,
  arrows:    (s) => <Ic size={s}><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 014-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 01-4 4H3"/></Ic>,
  file:      (s) => <Ic size={s}><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></Ic>,
  shuffle:   (s) => <Ic size={s}><polyline points="16 3 21 3 21 8"/><line x1="4" y1="20" x2="21" y2="3"/><polyline points="21 16 21 21 16 21"/><line x1="15" y1="15" x2="21" y2="21"/><line x1="4" y1="4" x2="9" y2="9"/></Ic>,
  alert:     (s) => <Ic size={s}><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></Ic>,
  chart:     (s) => <Ic size={s}><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></Ic>,
  lock:      (s) => <Ic size={s}><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></Ic>,
}

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
    sectionModule: 'administracion',
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
    sectionModule: 'administracion',
    items: [
      { label: 'Usuarios', path: '/admin/usuarios', icon: 'users',  module: 'administracion' },
      { label: 'Roles',    path: '/admin/roles',    icon: 'shield', module: 'administracion' },
    ],
  },
  {
    section: 'Inventario',
    sectionModule: 'inventario',
    items: [
      { label: 'Materiales',  path: '/inventario/materiales',  icon: 'package', module: 'inventario' },
      { label: 'Lotes',       path: '/inventario/lotes',       icon: 'layers',  module: 'inventario' },
      { label: 'Unidades',    path: '/inventario/unidades',    icon: 'tool',    module: 'inventario' },
      { label: 'Ubicaciones', path: '/inventario/ubicaciones', icon: 'mapPin',  module: 'inventario' },
    ],
  },
  {
    section: 'Movimientos',
    sectionModule: 'movimientos',
    items: [
      { label: 'Solicitudes', path: '/movimientos/solicitudes', icon: 'file',   module: 'movimientos' },
      { label: 'Préstamos',   path: '/movimientos/prestamos',   icon: 'arrows', module: 'movimientos' },
    ],
  },
  {
    section: 'Control y Seguimiento',
    sectionModule: 'control',
    items: [
      { label: 'Traslados',   path: '/control/traslados',   icon: 'shuffle', module: 'control' },
      { label: 'Incidencias', path: '/control/incidencias', icon: 'alert',   module: 'control' },
      { label: 'Kardex',      path: '/control/kardex',      icon: 'chart',   module: 'control' },
    ],
  },
]

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
  .smt-nav { scrollbar-width: thin; scrollbar-color: #d1fae5 transparent; }
  .smt-nav::-webkit-scrollbar { width: 4px; }
  .smt-nav::-webkit-scrollbar-track { background: transparent; }
  .smt-nav::-webkit-scrollbar-thumb { background: #d1fae5; border-radius: 4px; }
`

export function Sidebar({ isOpen }) {
  const { hasPermission, hasAnyPermission } = usePermissions()
  const [openSections, setOpenSections] = useState({})

  const toggleSection = (s) => setOpenSections(p => ({ ...p, [s]: p[s] === false ? true : false }))

  const sectionVisible = (mod) => {
    if (!mod) return true
    return Array.isArray(mod) ? hasAnyPermission(mod) : hasPermission(mod)
  }
  const itemVisible = (mod) => (!mod ? true : hasPermission(mod))

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

      <div style={{
        height: 60, display: 'flex', alignItems: 'center',
        padding: '0 16px', flexShrink: 0,
        borderBottom: '1px solid #e5e7eb',
        justifyContent: 'center',
      }}>
        {isOpen ? (
          <img src={sigmatLogo} alt="SIGMAT"
            style={{ height: 44, width: 'auto', objectFit: 'contain' }} />
        ) : (
          <div style={{ width: 34, height: 38, overflow: 'hidden', flexShrink: 0 }}>
            <img src={sigmatLogo} alt="SIGMAT"
              style={{ height: 38, width: 'auto', display: 'block' }} />
          </div>
        )}
      </div>

      <nav className="smt-nav" style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '6px 0' }}>
        {NAV.map(({ section, sectionModule, items }) => {
          if (!sectionVisible(sectionModule)) return null
          const visible = items.filter(it => itemVisible(it.module))
          if (visible.length === 0) return null
          const expanded = openSections[section] !== false

          return (
            <div key={section ?? '__top'} style={{ marginBottom: section ? 2 : 0 }}>

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

              {section && !isOpen && (
                <div style={{ height: 1, background: '#e5e7eb', margin: '6px 10px' }} />
              )}

              {(!section || !isOpen) ? (
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
              ) : (
                <div style={{
                  display: 'grid',
                  gridTemplateRows: expanded ? '1fr' : '0fr',
                  transition: 'grid-template-rows 0.28s cubic-bezier(0.4,0,0.2,1)',
                }}>
                  <div style={{ overflow: 'hidden' }}>
                    {visible.map(item => (
                      <NavLink
                        key={item.path}
                        to={item.path}
                        end={item.path === '/dashboard'}
                        className={({ isActive }) =>
                          `smt-link${isActive ? ' active' : ''}`
                        }
                      >
                        {icons[item.icon]?.(17)}
                        {item.label}
                      </NavLink>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </nav>
    </aside>
  )
}
