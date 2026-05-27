import { useLocation } from 'react-router-dom'
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

export function Topbar({ onMenuToggle }) {
  const { pathname } = useLocation()
  const { user } = useAuth()

  const title    = PAGE_TITLES[pathname] ?? 'SIGMAT'
  const segment  = '/' + pathname.split('/')[1]
  const section  = SECTION_LABELS[segment]
  const initials = user?.correo ? user.correo.slice(0, 2).toUpperCase() : 'U'

  return (
    <header style={{
      height: 60, background: '#ffffff',
      borderBottom: '1px solid #e4e4e7',
      display: 'flex', alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 24px 0 16px',
      flexShrink: 0,
      gap: 12,
    }}>

      {/* Left: hamburger + breadcrumb */}
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

      {/* Right: user pill */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        background: '#fafafa', border: '1px solid #e4e4e7',
        borderRadius: 20, padding: '4px 14px 4px 6px', flexShrink: 0,
      }}>
        <div style={{
          width: 26, height: 26, borderRadius: '50%',
          background: 'linear-gradient(135deg, #39A900, #007832)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 10, fontWeight: 700, color: '#fff', flexShrink: 0,
        }}>
          {initials}
        </div>
        <span style={{
          fontSize: 13, fontWeight: 500, color: '#3f3f46',
          maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {user?.correo ?? 'Usuario'}
        </span>
      </div>
    </header>
  )
}
