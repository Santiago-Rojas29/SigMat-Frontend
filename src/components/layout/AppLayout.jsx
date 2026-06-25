import { useState, useEffect } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import { ChatWidget } from '../organisms/ChatWidget'
import { useMobile } from '../../hooks/useMobile'
import { useToast } from '../../hooks/useToast'

export function AppLayout() {
  const isMobile = useMobile()
  const [sidebarOpen, setSidebarOpen] = useState(() => window.innerWidth >= 768)
  const location = useLocation()
  const navigate = useNavigate()
  const { showToast, toastPortal } = useToast()

  useEffect(() => {
    if (isMobile) setSidebarOpen(false)
    else setSidebarOpen(true)
  }, [isMobile])

  useEffect(() => {
    if (!location.state?.loginSuccess) return
    navigate(location.pathname, { replace: true, state: {} })
    showToast('success', 'Bienvenido al sistema SIGMAT 👋', '¡Inicio de sesión exitoso!')
  }, []) // eslint-disable-line

  const toggle = () => setSidebarOpen(o => !o)

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: '#f4f4f5' }}>

      {toastPortal}
      <ChatWidget />

      {/* Backdrop móvil */}
      {isMobile && sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.45)',
            zIndex: 299,
            backdropFilter: 'blur(2px)',
          }}
        />
      )}

      <Sidebar isOpen={sidebarOpen} isMobile={isMobile} onClose={() => setSidebarOpen(false)} />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
        <Topbar onMenuToggle={toggle} isMobile={isMobile} />
        <main style={{
          flex: 1,
          overflow: 'auto',
          padding: isMobile ? '14px 12px' : '28px 32px',
          background: '#f4f4f5',
        }}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}
