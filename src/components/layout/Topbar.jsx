import { useState, useRef, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

const PAGE_TITLES = {
  '/dashboard':              'Dashboard',
  '/estructura/centros':     'Centros',
  '/estructura/sedes':       'Sedes',
  '/estructura/areas':       'Áreas',
  '/estructura/programas':   'Programas',
  '/estructura/fichas':      'Fichas',
  '/admin/usuarios':         'Usuarios',
  '/admin/roles':            'Roles',
  '/admin/permisos':         'Permisos',
  '/inventario/materiales':  'Materiales',
  '/inventario/lotes':       'Lotes',
  '/inventario/unidades':    'Unidades',
  '/inventario/ubicaciones': 'Ubicaciones',
  '/movimientos/solicitudes': 'Solicitudes',
  '/movimientos/prestamos':   'Préstamos',
  '/control/traslados':      'Traslados',
  '/control/incidencias':    'Incidencias',
  '/control/kardex':         'Kardex',
}

const SECTION_LABELS = {
  '/estructura':  'Estructura',
  '/admin':       'Administración',
  '/inventario':  'Inventario',
  '/movimientos': 'Movimientos',
  '/control':     'Control y Seguimiento',
}

const TOPBAR_CSS = `
  @keyframes menuIn {
    from { opacity: 0; transform: translateY(-10px) scale(0.97); }
    to   { opacity: 1; transform: translateY(0)     scale(1);    }
  }
  @keyframes menuOut {
    from { opacity: 1; transform: translateY(0)     scale(1);    }
    to   { opacity: 0; transform: translateY(-10px) scale(0.97); }
  }
  @keyframes nameSlide {
    from { opacity: 0; transform: translateX(-6px); }
    to   { opacity: 1; transform: translateX(0);    }
  }
`

function getInitials(nombres) {
  if (!nombres) return 'U'
  const words = nombres.trim().split(/\s+/).filter(Boolean)
  return words.map(w => w[0]).join('').toUpperCase().slice(0, 3)
}

function MenuIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" y1="6"  x2="21" y2="6"/>
      <line x1="3" y1="12" x2="21" y2="12"/>
      <line x1="3" y1="18" x2="21" y2="18"/>
    </svg>
  )
}

function ChevronIcon({ open }) {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
      style={{ transition: 'transform 0.22s ease', transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}>
      <polyline points="6 9 12 15 18 9"/>
    </svg>
  )
}

function LogoutIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
      <polyline points="16 17 21 12 16 7"/>
      <line x1="21" y1="12" x2="9" y2="12"/>
    </svg>
  )
}

export function Topbar({ onMenuToggle }) {
  const { pathname } = useLocation()
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [isOpen, setIsOpen] = useState(false)
  const [isClosing, setIsClosing] = useState(false)
  const ref = useRef(null)

  const title   = PAGE_TITLES[pathname] ?? 'SIGMAT'
  const segment = '/' + pathname.split('/')[1]
  const section = SECTION_LABELS[segment]

  const nombres   = user?.nombres ?? ''
  const apellidos = user?.apellidos ?? ''
  const correo    = user?.correo ?? ''
  const initials  = nombres ? getInitials(nombres) : correo.slice(0, 2).toUpperCase() || 'U'
  const shortName = nombres || correo
  const fullName  = nombres && apellidos ? `${nombres} ${apellidos}` : nombres || correo

  const closeMenu = () => {
    setIsClosing(true)
    setTimeout(() => { setIsOpen(false); setIsClosing(false) }, 180)
  }

  useEffect(() => {
    if (!isOpen && !isClosing) return
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) closeMenu()
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [isOpen, isClosing])

  const handleLogout = () => {
    closeMenu()
    setTimeout(() => { logout(); navigate('/login', { replace: true }) }, 180)
  }

  const showDropdown = isOpen || isClosing

  return (
    <header style={{
      height: 60, background: '#ffffff',
      borderBottom: '1px solid #e4e4e7',
      display: 'flex', alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 24px 0 16px',
      flexShrink: 0, gap: 12,
    }}>
      <style>{TOPBAR_CSS}</style>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
        <button
          onClick={onMenuToggle}
          title="Menú"
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: '#71717a', padding: '6px', borderRadius: 7,
            display: 'flex', alignItems: 'center', flexShrink: 0,
            transition: 'background 0.15s, color 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = '#f4f4f5'; e.currentTarget.style.color = '#18181b' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'none';    e.currentTarget.style.color = '#71717a' }}
        >
          <MenuIcon />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {section && (
            <>
              <span style={{ fontSize: 13, color: '#a1a1aa' }}>{section}</span>
              <span style={{ color: '#d4d4d8', fontSize: 14, lineHeight: 1 }}>/</span>
            </>
          )}
          <span style={{ fontSize: 15, fontWeight: 600, color: '#18181b' }}>{title}</span>
        </div>
      </div>

      <div ref={ref} style={{ position: 'relative' }}>
        <button
          onClick={() => isOpen ? closeMenu() : setIsOpen(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: isOpen ? '#f0f8e8' : '#fafafa',
            border: `1px solid ${isOpen ? '#c3e6a0' : '#e4e4e7'}`,
            borderRadius: 20, padding: '5px 12px 5px 6px',
            cursor: 'pointer', transition: 'background 0.18s, border-color 0.18s',
            outline: 'none',
          }}
          onMouseEnter={e => { if (!isOpen) { e.currentTarget.style.background = '#f4f4f5'; e.currentTarget.style.borderColor = '#d4d4d8' } }}
          onMouseLeave={e => { if (!isOpen) { e.currentTarget.style.background = '#fafafa'; e.currentTarget.style.borderColor = '#e4e4e7' } }}
        >
          <div style={{
            width: 28, height: 28, borderRadius: '50%',
            background: 'linear-gradient(135deg, #39A900, #007832)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 10, fontWeight: 700, color: '#fff', flexShrink: 0,
            letterSpacing: '0.5px',
          }}>
            {initials}
          </div>
          <span style={{
            fontSize: 13, fontWeight: 500, color: '#3f3f46',
            maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {shortName}
          </span>
          <span style={{ color: '#a1a1aa', display: 'flex', alignItems: 'center' }}>
            <ChevronIcon open={isOpen} />
          </span>
        </button>

        {showDropdown && (
          <div style={{
            position: 'absolute', top: 'calc(100% + 10px)', right: 0,
            background: '#ffffff', border: '1px solid #e4e4e7',
            borderRadius: 12, boxShadow: '0 8px 28px rgba(0,0,0,0.11)',
            minWidth: 240, zIndex: 200,
            animation: `${isClosing ? 'menuOut' : 'menuIn'} 0.18s ease forwards`,
          }}>
            <div style={{ padding: '18px 18px 16px', display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{
                width: 44, height: 44, borderRadius: '50%',
                background: 'linear-gradient(135deg, #39A900, #007832)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 16, fontWeight: 700, color: '#fff', flexShrink: 0,
                letterSpacing: '0.5px',
              }}>
                {initials}
              </div>
              <div style={{ overflow: 'hidden', minWidth: 0 }}>
                <div style={{
                  fontSize: 14, fontWeight: 700, color: '#111827',
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  animation: 'nameSlide 0.22s ease both',
                  animationDelay: '0.05s',
                }}>
                  {fullName}
                </div>
                <div style={{
                  fontSize: 12, color: '#6b7280', marginTop: 2,
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  animation: 'nameSlide 0.22s ease both',
                  animationDelay: '0.09s',
                }}>
                  {correo}
                </div>
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  marginTop: 5, background: '#f0fdf4', borderRadius: 20,
                  padding: '2px 8px',
                  animation: 'nameSlide 0.22s ease both',
                  animationDelay: '0.13s',
                }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', flexShrink: 0 }} />
                  <span style={{ fontSize: 11, color: '#16a34a', fontWeight: 500 }}>Sesión activa</span>
                </div>
              </div>
            </div>

            <div style={{ height: 1, background: '#f3f4f6', margin: '0 14px' }} />

            <div style={{ padding: '8px 10px 10px' }}>
              <button
                onClick={handleLogout}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                  padding: '9px 12px', border: 'none', borderRadius: 8,
                  cursor: 'pointer', background: 'none',
                  fontSize: 13, color: '#ef4444', fontWeight: 500,
                  transition: 'background 0.15s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.08)'}
                onMouseLeave={e => e.currentTarget.style.background = 'none'}
              >
                <LogoutIcon />
                Cerrar sesión
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
