import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FormField } from '../molecules/FormField'
import { AppButton } from '../atoms/AppButton'
import { AppInput } from '../atoms/AppInput'
import { SenaLogo } from '../atoms/SenaLogo'
import { useAuth } from '../../context/AuthContext'
import { loginRequest } from '../../services/auth.service'

const EyeIcon = ({ open }: { open: boolean }) => open ? (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
  </svg>
) : (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
)

const MailIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
  </svg>
)

const LockIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
)

export function LoginForm() {
  const navigate = useNavigate()
  const { login } = useAuth()

  const [correo, setCorreo] = useState('')
  const [contrasena, setContrasena] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!correo || !contrasena) {
      setError('Por favor completa todos los campos.')
      return
    }
    setLoading(true)
    setError('')
    try {
      const result = await loginRequest({ correo, contrasena })
      login(result.access_token, result.user)
      navigate('/dashboard')
    } catch {
      setError('Correo o contraseña incorrectos.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      width: '100%',
      maxWidth: 420,
      padding: '0 8px',
      animation: 'fadeUp 0.4s cubic-bezier(0.4,0,0.2,1) both',
    }}>
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* Logo */}
      <div style={{ marginBottom: 40 }}>
        <SenaLogo size="lg" />
      </div>

      {/* Heading */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{
          fontSize: 30, fontWeight: 800, color: '#111827',
          letterSpacing: '-0.8px', marginBottom: 8,
        }}>
          ¡Bienvenido!
        </h1>
        <p style={{ fontSize: 14.5, color: '#6B7280', lineHeight: 1.55 }}>
          Ingresa tus credenciales para acceder al sistema de gestión.
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        <FormField label="Correo electrónico" htmlFor="correo" required>
          <AppInput
            id="correo"
            type="email"
            placeholder="usuario@sena.edu.co"
            value={correo}
            onChange={e => setCorreo(e.target.value)}
            icon={<MailIcon />}
            autoComplete="email"
          />
        </FormField>

        <FormField label="Contraseña" htmlFor="contrasena" required>
          <AppInput
            id="contrasena"
            type={showPassword ? 'text' : 'password'}
            placeholder="••••••••"
            value={contrasena}
            onChange={e => setContrasena(e.target.value)}
            icon={<LockIcon />}
            rightIcon={<EyeIcon open={showPassword} />}
            onRightIconClick={() => setShowPassword(v => !v)}
            autoComplete="current-password"
          />
        </FormField>

        {/* Forgot password */}
        <div style={{ textAlign: 'right', marginTop: -6 }}>
          <button
            type="button"
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: '#39A900', fontSize: 13, fontWeight: 500,
              padding: 0, fontFamily: 'inherit',
            }}
          >
            ¿Olvidaste tu contraseña?
          </button>
        </div>

        {/* Error message */}
        {error && (
          <div style={{
            background: '#FEF2F2', border: '1px solid #FECACA',
            borderRadius: 8, padding: '10px 14px',
            color: '#DC2626', fontSize: 13, display: 'flex', gap: 8, alignItems: 'center',
          }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            {error}
          </div>
        )}

        <AppButton type="submit" loading={loading} fullWidth style={{ marginTop: 4, height: 50, fontSize: 15.5 }}>
          Iniciar sesión
        </AppButton>
      </form>

      <p style={{ marginTop: 28, fontSize: 12.5, color: '#9CA3AF', textAlign: 'center' }}>
        ¿Necesitas ayuda?{' '}
        <span style={{ color: '#39A900', cursor: 'pointer', fontWeight: 500 }}>
          Contacta al administrador
        </span>
      </p>
    </div>
  )
}
