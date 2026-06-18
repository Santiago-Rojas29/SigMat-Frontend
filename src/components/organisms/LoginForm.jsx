import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FormField }    from '../molecules/FormField'
import { AppButton }    from '../atoms/AppButton'
import { AppInput }     from '../atoms/AppInput'
import { AppIcon }      from '../atoms/AppIcon'
import { useAuth }      from '../../context/AuthContext'
import { loginRequest } from '../../services/auth.service'
import { useToast }     from '../../hooks/useToast'
import sigmatLogo       from '../../assets/sigmat-logo.png'
import './LoginForm.css'

export function LoginForm() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const { showToast, toastPortal } = useToast()

  const [correo, setCorreo] = useState('')
  const [contrasena, setContrasena] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!correo || !contrasena) {
      showToast('error', 'Por favor completa todos los campos.')
      return
    }
    setLoading(true)
    try {
      const result = await loginRequest({ correo, contrasena })
      login(result.access_token, result.user)
      navigate('/dashboard', { state: { loginSuccess: true } })
    } catch (err) {
      if (err?.response?.status === 403) {
        showToast('error', 'Tu cuenta está inactiva. Contacta al administrador.')
      } else {
        showToast('error', 'Correo o contraseña incorrectos. Verifica tus datos.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {toastPortal}
      <div className="login-fade-up" style={{ width: '100%', maxWidth: 420, padding: '0 8px' }}>

      {/* Logo SIGMAT */}
      <div style={{ marginBottom: 32, display: 'flex', justifyContent: 'center' }}>
        <img
          src={sigmatLogo}
          alt="SIGMAT"
          style={{ height: 72, width: 'auto', objectFit: 'contain' }}
        />
      </div>

      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 30, fontWeight: 800, color: '#111827', letterSpacing: '-0.8px', marginBottom: 8 }}>
          ¡Bienvenido!
        </h1>
        <p style={{ fontSize: 14.5, color: '#6B7280', lineHeight: 1.55 }}>
          Ingresa tus credenciales para acceder al sistema de gestión.
        </p>
      </div>

      <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        <FormField label="Correo electrónico" htmlFor="correo" required>
          <AppInput
            id="correo"
            type="email"
            placeholder="usuario@sena.edu.co"
            value={correo}
            onChange={e => setCorreo(e.target.value)}
            icon={<AppIcon name="mail" size={16} />}
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
            icon={<AppIcon name="lock" size={16} />}
            rightIcon={showPassword ? <AppIcon name="eye-off" size={16} /> : <AppIcon name="eye" size={16} />}
            onRightIconClick={() => setShowPassword(v => !v)}
            autoComplete="current-password"
          />
        </FormField>

        <div style={{ textAlign: 'right', marginTop: -6 }}>
          <button type="button" onClick={() => navigate('/forgot-password')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#39A900', fontSize: 13, fontWeight: 500, padding: 0, fontFamily: 'inherit' }}>
            ¿Olvidaste tu contraseña?
          </button>
        </div>

        <AppButton type="submit" loading={loading} fullWidth style={{ marginTop: 4, height: 50, fontSize: 15.5 }}>
          Iniciar sesión
        </AppButton>
      </form>

      <p style={{ marginTop: 28, fontSize: 12.5, color: '#9CA3AF', textAlign: 'center' }}>
        ¿Necesitas ayuda?{' '}
        <span style={{ color: '#39A900', cursor: 'pointer', fontWeight: 500 }}>Contacta al administrador</span>
      </p>
      </div>
    </>
  )
}
