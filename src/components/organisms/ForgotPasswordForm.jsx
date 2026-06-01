import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { FormField } from '../molecules/FormField'
import { AppButton } from '../atoms/AppButton'
import { AppInput } from '../atoms/AppInput'
import { solicitarReset, resetearContrasena } from '../../services/auth.service'
import sigmatLogo from '../../assets/sigmat-logo.png'
import { AppIcon }        from '../../components/atoms/AppIcon'

const DURACION_CODIGO = 15 * 60 // 15 minutos en segundos
const ESPERA_REENVIO  = 60      // segundos mínimos antes de mostrar "Reenviar"

// ── Iconos ──────────────────────────────────────────────────────────────────
// ── Helpers ──────────────────────────────────────────────────────────────────
function formatTiempo(segundos) {
  const m = Math.floor(segundos / 60).toString().padStart(2, '0')
  const s = (segundos % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}

function colorTimer(segundos) {
  if (segundos <= 0)   return '#DC2626'
  if (segundos <= 120) return '#EA580C'
  return '#39A900'
}

// ── Componente principal ─────────────────────────────────────────────────────
export function ForgotPasswordForm() {
  const navigate = useNavigate()

  const [paso, setPaso]                       = useState(1)
  const [correo, setCorreo]                   = useState('')
  const [codigo, setCodigo]                   = useState('')
  const [nuevaContrasena, setNuevaContrasena] = useState('')
  const [confirmar, setConfirmar]             = useState('')
  const [showPassword, setShowPassword]       = useState(false)
  const [showConfirm, setShowConfirm]         = useState(false)
  const [loading, setLoading]                 = useState(false)
  const [loadingReenvio, setLoadingReenvio]   = useState(false)
  const [error, setError]                     = useState('')
  const [exito, setExito]                     = useState(false)
  const [segundos, setSegundos]               = useState(DURACION_CODIGO)

  const intervalRef = useRef(null)

  // Arranca / limpia el contador cuando cambia el paso
  useEffect(() => {
    if (paso !== 2) return
    setSegundos(DURACION_CODIGO)
    intervalRef.current = setInterval(() => {
      setSegundos(s => (s > 0 ? s - 1 : 0))
    }, 1000)
    return () => clearInterval(intervalRef.current)
  }, [paso])

  const codigoExpirado   = segundos === 0
  const puedeReenviar    = segundos <= DURACION_CODIGO - ESPERA_REENVIO // pasados 60 s

  // ── Handlers ──────────────────────────────────────────────────────────────
  async function handleSolicitarReset(e) {
    e.preventDefault()
    if (!correo) { setError('Ingresa tu correo electrónico.'); return }
    setLoading(true); setError('')
    try {
      await solicitarReset(correo)
      setPaso(2)
    } catch (err) {
      setError(err?.response?.data?.message ?? 'No se encontró una cuenta con ese correo.')
    } finally {
      setLoading(false)
    }
  }

  async function handleReenviar() {
    setLoadingReenvio(true); setError('')
    try {
      await solicitarReset(correo)
      // Reinicia el contador sin salir del paso 2
      clearInterval(intervalRef.current)
      setSegundos(DURACION_CODIGO)
      setCodigo('')
      intervalRef.current = setInterval(() => {
        setSegundos(s => (s > 0 ? s - 1 : 0))
      }, 1000)
    } catch (err) {
      setError(err?.response?.data?.message ?? 'No se pudo reenviar el código.')
    } finally {
      setLoadingReenvio(false)
    }
  }

  async function handleResetearContrasena(e) {
    e.preventDefault()
    if (codigoExpirado) { setError('El código ha expirado. Reenvía uno nuevo.'); return }
    if (!codigo || codigo.length !== 6) { setError('Ingresa el código de 6 dígitos.'); return }
    if (!nuevaContrasena || nuevaContrasena.length < 8) { setError('La contraseña debe tener al menos 8 caracteres.'); return }
    if (nuevaContrasena !== confirmar) { setError('Las contraseñas no coinciden.'); return }
    setLoading(true); setError('')
    try {
      await resetearContrasena(correo, codigo, nuevaContrasena)
      clearInterval(intervalRef.current)
      setExito(true)
    } catch (err) {
      setError(err?.response?.data?.message ?? 'El código es inválido o ha expirado.')
    } finally {
      setLoading(false)
    }
  }

  // ── Pantalla de éxito ─────────────────────────────────────────────────────
  if (exito) {
    return (
      <div style={{ width: '100%', maxWidth: 420, padding: '0 8px', textAlign: 'center', animation: 'fadeUp 0.4s cubic-bezier(0.4,0,0.2,1) both' }}>
        <style>{`@keyframes fadeUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }`}</style>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
          <AppIcon name="check-circle" size={20} />
        </div>
        <h2 style={{ fontSize: 24, fontWeight: 800, color: '#111827', marginBottom: 10 }}>¡Contraseña actualizada!</h2>
        <p style={{ fontSize: 14.5, color: '#6B7280', lineHeight: 1.6, marginBottom: 28 }}>
          Tu contraseña se cambió correctamente. Ya puedes iniciar sesión con tu nueva contraseña.
        </p>
        <AppButton fullWidth onClick={() => navigate('/login')} style={{ height: 50, fontSize: 15.5 }}>
          Ir al inicio de sesión
        </AppButton>
      </div>
    )
  }

  // ── Render principal ──────────────────────────────────────────────────────
  return (
    <div style={{ width: '100%', maxWidth: 420, padding: '0 8px', animation: 'fadeUp 0.4s cubic-bezier(0.4,0,0.2,1) both' }}>
      <style>{`@keyframes fadeUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }`}</style>

      {/* Logo */}
      <div style={{ marginBottom: 32, display: 'flex', justifyContent: 'center' }}>
        <img src={sigmatLogo} alt="SIGMAT" style={{ height: 72, width: 'auto', objectFit: 'contain' }} />
      </div>

      {/* Indicador de pasos */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 28 }}>
        {[1, 2].map((n) => (
          <div key={n} style={{ display: 'flex', alignItems: 'center', gap: 8, flex: n < 2 ? 1 : 'none' }}>
            <div style={{
              width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 12, fontWeight: 700, flexShrink: 0,
              background: paso >= n ? '#39A900' : '#E5E7EB',
              color: paso >= n ? '#fff' : '#9CA3AF',
              transition: 'all 0.3s',
            }}>{n}</div>
            {n < 2 && <div style={{ flex: 1, height: 2, background: paso >= 2 ? '#39A900' : '#E5E7EB', transition: 'background 0.3s' }} />}
          </div>
        ))}
      </div>

      {/* ── PASO 1: correo ── */}
      {paso === 1 && (
        <>
          <div style={{ marginBottom: 28 }}>
            <h1 style={{ fontSize: 26, fontWeight: 800, color: '#111827', letterSpacing: '-0.6px', marginBottom: 8 }}>
              ¿Olvidaste tu contraseña?
            </h1>
            <p style={{ fontSize: 14.5, color: '#6B7280', lineHeight: 1.55 }}>
              Ingresa tu correo y te enviaremos un código de verificación de 6 dígitos.
            </p>
          </div>
          <form onSubmit={handleSolicitarReset} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
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
            {error && <ErrorBanner mensaje={error} />}
            <AppButton type="submit" loading={loading} fullWidth style={{ marginTop: 4, height: 50, fontSize: 15.5 }}>
              Enviar código
            </AppButton>
          </form>
        </>
      )}

      {/* ── PASO 2: código + nueva contraseña ── */}
      {paso === 2 && (
        <>
          <div style={{ marginBottom: 20 }}>
            <h1 style={{ fontSize: 26, fontWeight: 800, color: '#111827', letterSpacing: '-0.6px', marginBottom: 8 }}>
              Verifica tu correo
            </h1>
            <p style={{ fontSize: 14.5, color: '#6B7280', lineHeight: 1.55 }}>
              Enviamos un código de 6 dígitos a{' '}
              <strong style={{ color: '#39A900' }}>{correo}</strong>
            </p>
          </div>

          {/* Contador de tiempo */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            background: codigoExpirado ? '#FEF2F2' : segundos <= 120 ? '#FFF7ED' : '#F0FDF4',
            border: `1px solid ${codigoExpirado ? '#FECACA' : segundos <= 120 ? '#FED7AA' : '#BBF7D0'}`,
            borderRadius: 10, padding: '10px 14px', marginBottom: 18,
            transition: 'all 0.5s',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <AppIcon name="clock" size={20} style={{ color: colorTimer(segundos) }} />
              <span style={{ fontSize: 13, color: colorTimer(segundos), fontWeight: 600 }}>
                {codigoExpirado
                  ? 'El código ha expirado'
                  : segundos <= 120
                    ? `Expira en ${formatTiempo(segundos)}`
                    : `Válido por ${formatTiempo(segundos)}`
                }
              </span>
            </div>

            {/* Botón reenviar — visible tras 60 s de espera */}
            {puedeReenviar && (
              <button
                type="button"
                onClick={handleReenviar}
                disabled={loadingReenvio}
                style={{
                  background: 'none', border: 'none', cursor: loadingReenvio ? 'not-allowed' : 'pointer',
                  color: '#39A900', fontSize: 12.5, fontWeight: 600, fontFamily: 'inherit',
                  padding: 0, opacity: loadingReenvio ? 0.6 : 1, whiteSpace: 'nowrap',
                }}
              >
                {loadingReenvio ? 'Enviando...' : 'Reenviar código'}
              </button>
            )}
          </div>

          <form onSubmit={handleResetearContrasena} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <FormField label="Código de verificación" htmlFor="codigo" required>
              <AppInput
                id="codigo"
                type="text"
                placeholder="000000"
                value={codigo}
                onChange={e => setCodigo(e.target.value.replace(/\D/g, '').slice(0, 6))}
                icon={<AppIcon name="key" size={16} />}
                autoComplete="one-time-code"
                disabled={codigoExpirado}
                style={{ letterSpacing: 8, fontWeight: 700, textAlign: 'center' }}
              />
            </FormField>

            <FormField label="Nueva contraseña" htmlFor="nueva_contrasena" required>
              <AppInput
                id="nueva_contrasena"
                type={showPassword ? 'text' : 'password'}
                placeholder="Mínimo 8 caracteres"
                value={nuevaContrasena}
                onChange={e => setNuevaContrasena(e.target.value)}
                icon={<AppIcon name="lock" size={16} />}
                rightIcon={showPassword ? <AppIcon name="eye-off" size={16} /> : <AppIcon name="eye" size={16} />}
                onRightIconClick={() => setShowPassword(v => !v)}
                disabled={codigoExpirado}
              />
            </FormField>

            <FormField label="Confirmar contraseña" htmlFor="confirmar_contrasena" required>
              <AppInput
                id="confirmar_contrasena"
                type={showConfirm ? 'text' : 'password'}
                placeholder="Repite tu contraseña"
                value={confirmar}
                onChange={e => setConfirmar(e.target.value)}
                icon={<AppIcon name="lock" size={16} />}
                rightIcon={showConfirm ? <AppIcon name="eye-off" size={16} /> : <AppIcon name="eye" size={16} />}
                onRightIconClick={() => setShowConfirm(v => !v)}
                disabled={codigoExpirado}
              />
            </FormField>

            {error && <ErrorBanner mensaje={error} />}

            <AppButton
              type="submit"
              loading={loading}
              disabled={codigoExpirado}
              fullWidth
              style={{ marginTop: 4, height: 50, fontSize: 15.5 }}
            >
              Restablecer contraseña
            </AppButton>

            <button
              type="button"
              onClick={() => { setPaso(1); setError(''); setCodigo('') }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280', fontSize: 13, fontFamily: 'inherit', padding: 0 }}
            >
              ← Cambiar correo
            </button>
          </form>
        </>
      )}

      <div style={{ textAlign: 'center', marginTop: 24 }}>
        <button
          type="button"
          onClick={() => navigate('/login')}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#39A900', fontSize: 13, fontWeight: 500, fontFamily: 'inherit', padding: 0 }}
        >
          ← Volver al inicio de sesión
        </button>
      </div>
    </div>
  )
}

function ErrorBanner({ mensaje }) {
  return (
    <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: '10px 14px', color: '#DC2626', fontSize: 13, display: 'flex', gap: 8, alignItems: 'center' }}>
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
      {mensaje}
    </div>
  )
}
