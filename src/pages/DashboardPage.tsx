import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'

export function DashboardPage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <div style={{
      minHeight: '100vh', background: '#F6F8F3',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      gap: 16,
    }}>
      <div style={{
        background: '#fff', borderRadius: 16, padding: '40px 48px',
        boxShadow: '0 4px 24px rgba(0,0,0,0.07)',
        textAlign: 'center', maxWidth: 400,
      }}>
        <div style={{
          width: 56, height: 56, borderRadius: 16,
          background: 'linear-gradient(135deg, #39A900, #007832)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 20px',
        }}>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
            <polyline points="22 4 12 14.01 9 11.01"/>
          </svg>
        </div>
        <h2 style={{ fontWeight: 700, fontSize: 22, marginBottom: 8, color: '#111827' }}>
          Sesión iniciada
        </h2>
        <p style={{ color: '#6B7280', fontSize: 14, marginBottom: 6 }}>
          Bienvenido, <strong style={{ color: '#111827' }}>{user?.correo}</strong>
        </p>
        <p style={{ color: '#9CA3AF', fontSize: 13, marginBottom: 28 }}>
          Rol asignado: <code style={{ background: '#F3F4F6', padding: '2px 8px', borderRadius: 6, fontSize: 12 }}>{user?.id_rol}</code>
        </p>
        <button
          onClick={handleLogout}
          style={{
            background: 'none', border: '1.5px solid #E5E7EB',
            borderRadius: 10, padding: '10px 24px',
            color: '#6B7280', fontFamily: 'inherit', fontWeight: 500,
            cursor: 'pointer', fontSize: 14, transition: 'all 0.18s',
          }}
        >
          Cerrar sesión
        </button>
      </div>
    </div>
  )
}
