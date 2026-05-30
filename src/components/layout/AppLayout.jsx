import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'

export function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const toggle = () => setSidebarOpen(o => !o)

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: '#f4f4f5' }}>
      <Sidebar isOpen={sidebarOpen} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
        <Topbar onMenuToggle={toggle} />
        <main style={{ flex: 1, overflow: 'auto', padding: '28px 32px', background: '#f4f4f5' }}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}
