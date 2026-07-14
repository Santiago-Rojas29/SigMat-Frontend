import { useState, useRef, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { usePermissions } from '../../context/PermissionsContext'
import api from '../../services/api'
import { AppIcon } from '../atoms/AppIcon'
import { NotificacionBell } from '../atoms/NotificacionBell'
import { UserAvatar, getAvatarId } from '../atoms/UserAvatar'
import { ProfilePanel } from './ProfilePanel'
import './Topbar.css'

const PAGE_TITLES = {
  '/dashboard':               'Dashboard',
  '/estructura/centros':      'Centros',
  '/estructura/sedes':        'Sedes',
  '/estructura/areas':        'Áreas',
  '/estructura/programas':    'Programas',
  '/estructura/fichas':       'Fichas',
  '/admin/usuarios':          'Usuarios',
  '/admin/roles':             'Roles',
  '/admin/permisos':          'Permisos',
  '/inventario/materiales':   'Materiales',
  '/inventario/lotes':        'Lotes',
  '/inventario/unidades':     'Unidades',
  '/inventario/ubicaciones':  'Ubicaciones',
  '/movimientos/catalogo':    'Catálogo',
  '/movimientos/solicitudes': 'Solicitudes',
  '/movimientos/prestamos':   'Préstamos',
  '/control/traslados':       'Traslados',
  '/control/incidencias':     'Incidencias',
  '/control/kardex':          'Kardex',
  '/reportes':                'Reportes',
  '/root':                    'Resumen',
  '/root/centros':            'Centros',
  '/root/sedes':              'Sedes',
  '/root/admins':             'Administradores',
}

const SECTION_LABELS = {
  '/estructura':  'Estructura',
  '/admin':       'Administración',
  '/inventario':  'Inventario',
  '/movimientos': 'Movimientos',
  '/control':     'Control y Seguimiento',
  '/root':        'Gestión de tenants',
}

const ROL_CONFIG = {
  'Administrador':         { label: 'Administrador', color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe' },
  'Instructor':            { label: 'Instructor',    color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe' },
  'Responsable de Bodega': { label: 'Resp. Bodega',  color: '#0d9488', bg: '#f0fdfa', border: '#99f6e4' },
  'Aprendiz':              { label: 'Aprendiz',      color: '#d97706', bg: '#fffbeb', border: '#fde68a' },
  'Root':                  { label: 'Root',          color: '#39A900', bg: '#f0fdf4', border: '#bbf7d0' },
}

function getInitials(nombres) {
  if (!nombres) return 'U'
  const words = nombres.trim().split(/\s+/).filter(Boolean)
  return words.map(w => w[0]).join('').toUpperCase().slice(0, 3)
}

export function Topbar({ onMenuToggle, isMobile }) {
  const { pathname } = useLocation()
  const { user, logout, updateUser } = useAuth()
  const { rolNombre } = usePermissions()
  const navigate = useNavigate()
  const [isOpen,       setIsOpen]       = useState(false)
  const [isClosing,    setIsClosing]    = useState(false)
  const [profileOpen,  setProfileOpen]  = useState(false)
  const [avatarId,     setAvatarId]     = useState(() => user?.id ? getAvatarId(user.id) : 'esmeralda')
  const [disponible,   setDisponible]   = useState(user?.disponible ?? true)
  const [togglingDisp, setTogglingDisp] = useState(false)
  const ref = useRef(null)

  const toggleDisponibilidad = async () => {
    const next = !disponible
    setDisponible(next)
    setTogglingDisp(true)
    try {
      await api.patch('/usuario/me/disponibilidad', { disponible: next })
      updateUser({ disponible: next })
    } catch {
      setDisponible(!next)
    } finally {
      setTogglingDisp(false)
    }
  }

  // Sync avatar if user changes
  useEffect(() => {
    if (user?.id) setAvatarId(getAvatarId(user.id))
  }, [user?.id])

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

  const handleOpenProfile = () => {
    closeMenu()
    setTimeout(() => setProfileOpen(true), 200)
  }

  const showDropdown = isOpen || isClosing
  const rolCfg = rolNombre ? (ROL_CONFIG[rolNombre] ?? null) : null
  const rolColor = rolCfg?.color ?? '#39A900'

  return (
    <>
      <header style={{
        height: 60, background: '#ffffff',
        borderBottom: '1px solid #e4e4e7',
        display: 'flex', alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px 0 16px',
        flexShrink: 0, gap: 12,
      }}>
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
            <AppIcon name="menu" size={18} />
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
            {section && !isMobile && (
              <>
                <span style={{ fontSize: 13, color: '#a1a1aa', whiteSpace: 'nowrap' }}>{section}</span>
                <span style={{ color: '#d4d4d8', fontSize: 14, lineHeight: 1 }}>/</span>
              </>
            )}
            <span style={{
              fontSize: isMobile ? 14 : 15, fontWeight: 600, color: '#18181b',
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>{title}</span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {rolNombre === 'Instructor' && (
            <button
              onClick={toggleDisponibilidad}
              disabled={togglingDisp}
              title={disponible ? 'Disponible para aprobar solicitudes de tus aprendices' : 'No disponible — sus solicitudes pasarán directo a bodega/admin'}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                background: disponible ? '#f0fdf4' : '#fef2f2',
                border: `1px solid ${disponible ? '#bbf7d0' : '#fecaca'}`,
                borderRadius: 20, padding: '5px 12px 5px 8px',
                cursor: togglingDisp ? 'default' : 'pointer',
                opacity: togglingDisp ? 0.6 : 1,
                transition: 'background 0.15s, border-color 0.15s',
              }}
            >
              <span style={{
                width: 8, height: 8, borderRadius: '50%',
                background: disponible ? '#22c55e' : '#ef4444', flexShrink: 0,
              }} />
              <span style={{ fontSize: 11.5, fontWeight: 600, color: disponible ? '#16a34a' : '#dc2626' }}>
                {disponible ? 'Disponible' : 'No disponible'}
              </span>
            </button>
          )}
          <NotificacionBell />

          <div ref={ref} style={{ position: 'relative' }}>
            <button
              onClick={() => isOpen ? closeMenu() : setIsOpen(true)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                background: isOpen ? '#f0f8e8' : '#fafafa',
                border: `1px solid ${isOpen ? '#c3e6a0' : '#e4e4e7'}`,
                borderRadius: 20, padding: isMobile ? '4px 4px' : '4px 10px 4px 4px',
                cursor: 'pointer', transition: 'background 0.18s, border-color 0.18s',
                outline: 'none',
              }}
              onMouseEnter={e => { if (!isOpen) { e.currentTarget.style.background = '#f4f4f5'; e.currentTarget.style.borderColor = '#d4d4d8' } }}
              onMouseLeave={e => { if (!isOpen) { e.currentTarget.style.background = '#fafafa'; e.currentTarget.style.borderColor = '#e4e4e7' } }}
            >
              <div style={{ position: 'relative', flexShrink: 0 }}>
                <UserAvatar
                  userId={user?.id}
                  initials={initials}
                  size={30}
                  avatarId={avatarId}
                  style={{ outline: `2.5px solid ${rolColor}`, outlineOffset: '2px', borderRadius: '50%' }}
                />
              </div>
              {!isMobile && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', minWidth: 0 }}>
                  <span style={{
                    fontSize: 13, fontWeight: 500, color: '#3f3f46',
                    maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {shortName}
                  </span>
                  {rolNombre && (
                    <span style={{
                      fontSize: 10, fontWeight: 600, color: rolColor,
                      maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {rolCfg?.label ?? rolNombre}
                    </span>
                  )}
                </div>
              )}
              {!isMobile && (
                <span style={{ color: '#a1a1aa', display: 'flex', alignItems: 'center' }}>
                  {isOpen
                    ? <AppIcon name="chev-down" size={13} style={{ transition: 'transform 0.22s ease', transform: 'rotate(180deg)' }} />
                    : <AppIcon name="chev-down" size={13} style={{ transition: 'transform 0.22s ease' }} />
                  }
                </span>
              )}
            </button>

            {showDropdown && (
              <div style={{
                position: 'absolute', top: 'calc(100% + 10px)', right: 0,
                background: '#ffffff', border: '1px solid #e4e4e7',
                borderRadius: 12, boxShadow: '0 8px 28px rgba(0,0,0,0.11)',
                minWidth: 248, zIndex: 200,
                animation: `${isClosing ? 'menuOut' : 'menuIn'} 0.18s ease forwards`,
              }}>
                {/* User info header */}
                <div style={{ padding: '16px 18px 14px', display: 'flex', alignItems: 'center', gap: 14 }}>
                  <UserAvatar
                    userId={user?.id}
                    initials={initials}
                    size={46}
                    avatarId={avatarId}
                    style={{ outline: `3px solid ${rolColor}`, outlineOffset: '2px', borderRadius: '50%', flexShrink: 0 }}
                  />
                  <div style={{ overflow: 'hidden', minWidth: 0 }}>
                    <div style={{
                      fontSize: 14, fontWeight: 700, color: '#111827',
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                      animation: 'nameSlide 0.22s ease both', animationDelay: '0.05s',
                    }}>
                      {fullName}
                    </div>
                    <div style={{
                      fontSize: 12, color: '#6b7280', marginTop: 2,
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                      animation: 'nameSlide 0.22s ease both', animationDelay: '0.09s',
                    }}>
                      {correo}
                    </div>
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 6, marginTop: 6,
                      animation: 'nameSlide 0.22s ease both', animationDelay: '0.13s',
                    }}>
                      {rolCfg ? (
                        <div style={{
                          display: 'inline-flex', alignItems: 'center', gap: 4,
                          background: rolCfg.bg, border: `1px solid ${rolCfg.border}`,
                          borderRadius: 20, padding: '2px 9px',
                        }}>
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: rolCfg.color, flexShrink: 0 }} />
                          <span style={{ fontSize: 11, color: rolCfg.color, fontWeight: 700 }}>{rolCfg.label}</span>
                        </div>
                      ) : rolNombre ? (
                        <div style={{
                          display: 'inline-flex', alignItems: 'center', gap: 4,
                          background: '#f4f4f5', border: '1px solid #e4e4e7',
                          borderRadius: 20, padding: '2px 9px',
                        }}>
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#6b7280', flexShrink: 0 }} />
                          <span style={{ fontSize: 11, color: '#6b7280', fontWeight: 700 }}>{rolNombre}</span>
                        </div>
                      ) : null}
                      <div style={{
                        display: 'inline-flex', alignItems: 'center', gap: 4,
                        background: '#f0fdf4', border: '1px solid #bbf7d0',
                        borderRadius: 20, padding: '2px 9px',
                      }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', flexShrink: 0 }} />
                        <span style={{ fontSize: 11, color: '#16a34a', fontWeight: 500 }}>Activo</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{ height: 1, background: '#f3f4f6', margin: '0 14px' }} />

                <div style={{ padding: '8px 10px 10px' }}>
                  {/* Mi perfil */}
                  <button
                    onClick={handleOpenProfile}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                      padding: '9px 12px', border: 'none', borderRadius: 8,
                      cursor: 'pointer', background: 'none',
                      fontSize: 13, color: '#374151', fontWeight: 500,
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = '#f3f4f6'}
                    onMouseLeave={e => e.currentTarget.style.background = 'none'}
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                      <circle cx="12" cy="7" r="4"/>
                    </svg>
                    Mi perfil
                  </button>

                  <div style={{ height: 1, background: '#f3f4f6', margin: '4px 0' }} />

                  {/* Cerrar sesión */}
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
                    <AppIcon name="logout" size={15} />
                    Cerrar sesión
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      <ProfilePanel
        isOpen={profileOpen}
        onClose={() => setProfileOpen(false)}
        avatarId={avatarId}
        onAvatarChange={setAvatarId}
      />
    </>
  )
}
