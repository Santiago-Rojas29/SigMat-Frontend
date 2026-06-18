import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { usePermissions } from '../../context/PermissionsContext'
import { AppIcon } from '../atoms/AppIcon'
import sigmatLogo from '../../assets/sigmat-logo.png'
import './Sidebar.css'

const W_OPEN   = 240
const W_CLOSED = 64

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
      { label: 'Sedes',     path: '/estructura/sedes',     icon: 'map-pin',   module: null },
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
      { label: 'Ubicaciones', path: '/inventario/ubicaciones', icon: 'map-pin', module: 'inventario' },
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
  {
    section: 'Reportes',
    sectionModule: null,
    items: [
      { label: 'Reportes PDF', path: '/reportes', icon: 'printer', module: null },
    ],
  },
]

export function Sidebar({ isOpen, isMobile, onClose }) {
  const { hasPermission, hasAnyPermission } = usePermissions()
  const [openSections, setOpenSections] = useState({})

  const toggleSection = (s) => setOpenSections(p => ({ ...p, [s]: p[s] !== false ? false : true }))

  const sectionVisible = (mod) => {
    if (!mod) return true
    return Array.isArray(mod) ? hasAnyPermission(mod) : hasPermission(mod)
  }
  const itemVisible = (mod) => (!mod ? true : hasPermission(mod))

  const asideStyle = isMobile ? {
    position: 'fixed',
    top: 0, left: 0,
    width: W_OPEN,
    minWidth: W_OPEN,
    height: '100vh',
    zIndex: 300,
    background: '#ffffff',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    borderRight: '1px solid #e5e7eb',
    transform: isOpen ? 'translateX(0)' : `translateX(-${W_OPEN + 4}px)`,
    transition: 'transform 0.28s cubic-bezier(0.4,0,0.2,1)',
    boxShadow: isOpen ? '4px 0 24px rgba(0,0,0,0.13)' : 'none',
  } : {
    width: isOpen ? W_OPEN : W_CLOSED,
    minWidth: isOpen ? W_OPEN : W_CLOSED,
    height: '100vh',
    background: '#ffffff',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    borderRight: '1px solid #e5e7eb',
    transition: 'width 0.25s cubic-bezier(0.4,0,0.2,1), min-width 0.25s cubic-bezier(0.4,0,0.2,1)',
  }

  // En móvil el sidebar siempre muestra etiquetas (nunca modo icon-only)
  const showOpen = isMobile ? true : isOpen

  return (
    <aside style={asideStyle}>
      {/* Logo */}
      <div style={{
        height: 60, display: 'flex', alignItems: 'center',
        padding: '0 16px', flexShrink: 0,
        borderBottom: '1px solid #e5e7eb',
        justifyContent: showOpen ? 'space-between' : 'center',
      }}>
        {showOpen ? (
          <img src={sigmatLogo} alt="SIGMAT"
            style={{ height: 44, width: 'auto', objectFit: 'contain' }} />
        ) : (
          <div style={{ width: 34, height: 38, overflow: 'hidden', flexShrink: 0 }}>
            <img src={sigmatLogo} alt="SIGMAT"
              style={{ height: 38, width: 'auto', display: 'block' }} />
          </div>
        )}
        {isMobile && (
          <button onClick={onClose} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: '#9ca3af', padding: 6, borderRadius: 6,
            display: 'flex', alignItems: 'center',
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="smt-nav" style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '6px 0' }}>
        {NAV.map(({ section, sectionModule, items }) => {
          if (!sectionVisible(sectionModule)) return null
          const visible = items.filter(it => itemVisible(it.module))
          if (visible.length === 0) return null
          const expanded = openSections[section] !== false

          return (
            <div key={section ?? '__top'} style={{ marginBottom: section ? 2 : 0 }}>

              {section && showOpen && (
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
                    <AppIcon name="chev-down" size={12} />
                  </span>
                </button>
              )}

              {section && !showOpen && (
                <div style={{ height: 1, background: '#e5e7eb', margin: '6px 10px' }} />
              )}

              {(!section || !showOpen) ? (
                <div>
                  {visible.map(item => (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      end={item.path === '/dashboard'}
                      title={!showOpen ? item.label : undefined}
                      className={({ isActive }) =>
                        `smt-link${showOpen ? '' : ' icon-only'}${isActive ? ' active' : ''}`
                      }
                      onClick={isMobile ? onClose : undefined}
                    >
                      <AppIcon name={item.icon} size={17} style={{ flexShrink: 0 }} />
                      {showOpen && item.label}
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
                        onClick={isMobile ? onClose : undefined}
                      >
                        <AppIcon name={item.icon} size={17} style={{ flexShrink: 0 }} />
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
