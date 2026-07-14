import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../hooks/useToast'
import { UserAvatar, AVATAR_PRESETS, setAvatarId } from '../atoms/UserAvatar'
import api from '../../services/api'

// ─── Shared UI atoms ────────────────────────────────────────────────────────

function Label({ children }) {
  return <label style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>{children}</label>
}

function TextInput({ value, onChange, readOnly, placeholder, type = 'text' }) {
  const [focused, setFocused] = useState(false)
  return (
    <input
      type={type}
      value={value}
      onChange={e => onChange?.(e.target.value)}
      readOnly={readOnly}
      placeholder={placeholder}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={{
        padding: '9px 12px',
        border: `1.5px solid ${readOnly ? '#e5e7eb' : focused ? '#39A900' : '#d1d5db'}`,
        borderRadius: 8, fontSize: 13.5, outline: 'none',
        background: readOnly ? '#f9fafb' : '#fff',
        color: readOnly ? '#9ca3af' : '#111827',
        width: '100%', boxSizing: 'border-box',
        transition: 'border-color 0.15s',
      }}
    />
  )
}

function PasswordInput({ value, onChange, placeholder }) {
  const [show, setShow] = useState(false)
  return (
    <div style={{ position: 'relative' }}>
      <input
        type={show ? 'text' : 'password'}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          padding: '9px 40px 9px 12px',
          border: '1.5px solid #d1d5db',
          borderRadius: 8, fontSize: 13.5, outline: 'none',
          background: '#fff', color: '#111827',
          width: '100%', boxSizing: 'border-box',
        }}
        onFocus={e => e.target.style.borderColor = '#39A900'}
        onBlur={e => e.target.style.borderColor = '#d1d5db'}
      />
      <button
        type="button"
        onClick={() => setShow(v => !v)}
        style={{
          position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
          background: 'none', border: 'none', cursor: 'pointer',
          color: '#9ca3af', display: 'flex', alignItems: 'center', padding: 2,
        }}
      >
        {show
          ? <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
          : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
        }
      </button>
    </div>
  )
}

function Field({ label, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <Label>{label}</Label>
      {children}
    </div>
  )
}

function PrimaryBtn({ onClick, disabled, loading, label, color = '#39A900', hoverColor = '#2d8a00' }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      style={{
        padding: '9px 22px', borderRadius: 8,
        background: disabled || loading ? '#d1d5db' : color,
        color: '#fff', border: 'none',
        cursor: disabled || loading ? 'not-allowed' : 'pointer',
        fontSize: 13, fontWeight: 600, transition: 'background 0.15s',
      }}
      onMouseEnter={e => { if (!disabled && !loading) e.currentTarget.style.background = hoverColor }}
      onMouseLeave={e => { if (!disabled && !loading) e.currentTarget.style.background = color }}
    >
      {loading ? 'Procesando...' : label}
    </button>
  )
}

function SectionCard({ title, icon, children }) {
  return (
    <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, overflow: 'hidden' }}>
      <div style={{
        padding: '13px 20px', borderBottom: '1px solid #f3f4f6',
        display: 'flex', alignItems: 'center', gap: 8,
        fontSize: 13, fontWeight: 700, color: '#111827',
      }}>
        {icon}
        {title}
      </div>
      <div style={{ padding: '18px 20px' }}>{children}</div>
    </div>
  )
}

function InfoBanner({ color, bg, border, children }) {
  return (
    <div style={{
      padding: '9px 12px', borderRadius: 8,
      background: bg, border: `1px solid ${border}`,
      fontSize: 12, color, lineHeight: 1.5,
    }}>
      {children}
    </div>
  )
}

// ─── Password section: two modes ────────────────────────────────────────────

function PasswordSection({ userCorreo, showToast, onSuccess }) {
  // Mode A: change with current password
  const [passActual,    setPassActual]    = useState('')
  const [passNueva,     setPassNueva]     = useState('')
  const [passConfirmar, setPassConfirmar] = useState('')
  const [savingPass,    setSavingPass]    = useState(false)

  // Mode B: reset via email code
  const [forgotMode,  setForgotMode]  = useState(false)
  const [resetPhase,  setResetPhase]  = useState('idle') // idle | sending | code
  const [resetCode,   setResetCode]   = useState('')
  const [resetNueva,  setResetNueva]  = useState('')
  const [resetConf,   setResetConf]   = useState('')
  const [resetBusy,   setResetBusy]   = useState(false)

  const handleChangePass = async () => {
    if (!passActual || !passNueva || !passConfirmar) { showToast('error', 'Completa todos los campos.'); return }
    if (passNueva.length < 6) { showToast('error', 'Mínimo 6 caracteres.'); return }
    if (passNueva !== passConfirmar) { showToast('error', 'Las contraseñas no coinciden.'); return }
    setSavingPass(true)
    try {
      await api.post('/auth/cambiar-contrasena', { contrasena_actual: passActual, nueva_contrasena: passNueva })
      showToast('success', 'Contraseña actualizada. Cerrando sesión...')
      setTimeout(onSuccess, 1800)
    } catch (err) {
      const msg = err?.response?.data?.message ?? 'Error al cambiar contraseña.'
      showToast('error', Array.isArray(msg) ? msg[0] : msg)
    } finally {
      setSavingPass(false)
    }
  }

  const handleSendCode = async () => {
    setResetBusy(true)
    setResetPhase('sending')
    try {
      await api.post('/auth/solicitar-reset', { correo: userCorreo })
      showToast('success', `Código enviado a ${userCorreo}`)
      setResetPhase('code')
    } catch (err) {
      const msg = err?.response?.data?.message ?? 'Error al enviar el código.'
      showToast('error', Array.isArray(msg) ? msg[0] : msg)
      setResetPhase('idle')
    } finally {
      setResetBusy(false)
    }
  }

  const handleResetPass = async () => {
    if (!resetCode || !resetNueva || !resetConf) { showToast('error', 'Completa todos los campos.'); return }
    if (resetNueva.length < 6) { showToast('error', 'Mínimo 6 caracteres.'); return }
    if (resetNueva !== resetConf) { showToast('error', 'Las contraseñas no coinciden.'); return }
    setResetBusy(true)
    try {
      await api.post('/auth/resetear-contrasena', { correo: userCorreo, codigo: resetCode.trim(), nueva_contrasena: resetNueva })
      showToast('success', 'Contraseña restablecida. Cerrando sesión...')
      setTimeout(onSuccess, 1800)
    } catch (err) {
      const msg = err?.response?.data?.message ?? 'Error al restablecer contraseña.'
      showToast('error', Array.isArray(msg) ? msg[0] : msg)
    } finally {
      setResetBusy(false)
    }
  }

  if (!forgotMode) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Field label="Contraseña actual"><PasswordInput value={passActual} onChange={setPassActual} placeholder="Tu contraseña actual" /></Field>
        <Field label="Nueva contraseña"><PasswordInput value={passNueva} onChange={setPassNueva} placeholder="Mínimo 6 caracteres" /></Field>
        <Field label="Confirmar nueva contraseña"><PasswordInput value={passConfirmar} onChange={setPassConfirmar} placeholder="Repite la nueva contraseña" /></Field>

        {passNueva && passNueva.length < 6 && (
          <p style={{ margin: 0, fontSize: 12, color: '#ef4444' }}>Mínimo 6 caracteres requeridos.</p>
        )}
        {passNueva && passConfirmar && passNueva !== passConfirmar && (
          <p style={{ margin: 0, fontSize: 12, color: '#ef4444' }}>Las contraseñas no coinciden.</p>
        )}

        <InfoBanner color="#92400e" bg="#fffbeb" border="#fde68a">
          Al cambiar la contraseña se cerrará la sesión para que inicies de nuevo.
        </InfoBanner>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
          <button
            onClick={() => setForgotMode(true)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: 12.5, color: '#2563eb', fontWeight: 500,
              padding: 0, textDecoration: 'underline',
            }}
          >
            ¿Olvidaste tu contraseña actual?
          </button>
          <PrimaryBtn onClick={handleChangePass} loading={savingPass} label="Actualizar contraseña" color="#2563eb" hoverColor="#1d4ed8" />
        </div>
      </div>
    )
  }

  // ── Forgot password mode ──
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <button
        onClick={() => { setForgotMode(false); setResetPhase('idle'); setResetCode(''); setResetNueva(''); setResetConf('') }}
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          fontSize: 12.5, color: '#6b7280', fontWeight: 500,
          padding: 0, display: 'flex', alignItems: 'center', gap: 5, width: 'fit-content',
        }}
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
        Volver al formulario normal
      </button>

      {resetPhase === 'idle' || resetPhase === 'sending' ? (
        <>
          <InfoBanner color="#1e40af" bg="#eff6ff" border="#bfdbfe">
            Se enviará un código de 6 dígitos a <strong>{userCorreo}</strong>. Ingrésalo junto con tu nueva contraseña.
          </InfoBanner>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <PrimaryBtn
              onClick={handleSendCode}
              loading={resetBusy}
              label="Enviar código al correo"
              color="#2563eb" hoverColor="#1d4ed8"
            />
          </div>
        </>
      ) : (
        <>
          <InfoBanner color="#166534" bg="#f0fdf4" border="#bbf7d0">
            Código enviado a <strong>{userCorreo}</strong>. Revisa tu bandeja de entrada.
          </InfoBanner>
          <Field label="Código de 6 dígitos">
            <TextInput
              value={resetCode}
              onChange={setResetCode}
              placeholder="Ej: 483921"
            />
          </Field>
          <Field label="Nueva contraseña"><PasswordInput value={resetNueva} onChange={setResetNueva} placeholder="Mínimo 6 caracteres" /></Field>
          <Field label="Confirmar contraseña"><PasswordInput value={resetConf} onChange={setResetConf} placeholder="Repite la nueva contraseña" /></Field>

          {resetNueva && resetConf && resetNueva !== resetConf && (
            <p style={{ margin: 0, fontSize: 12, color: '#ef4444' }}>Las contraseñas no coinciden.</p>
          )}

          <InfoBanner color="#92400e" bg="#fffbeb" border="#fde68a">
            Al restablecer la contraseña se cerrará la sesión automáticamente.
          </InfoBanner>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
            <button
              onClick={() => setResetPhase('idle')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12.5, color: '#6b7280', padding: 0 }}
            >
              Reenviar código
            </button>
            <PrimaryBtn onClick={handleResetPass} loading={resetBusy} label="Restablecer contraseña" color="#2563eb" hoverColor="#1d4ed8" />
          </div>
        </>
      )}
    </div>
  )
}

// ─── Main panel ─────────────────────────────────────────────────────────────

export function ProfilePanel({ isOpen, onClose, avatarId, onAvatarChange }) {
  const { user, updateUser, logout } = useAuth()
  const navigate  = useNavigate()
  const { showToast, toastPortal } = useToast()

  const [loadingProfile, setLoadingProfile] = useState(false)

  // Datos personales
  const [nombres,   setNombres]   = useState('')
  const [apellidos, setApellidos] = useState('')
  const [telefono,  setTelefono]  = useState('')
  const [correo,    setCorreo]    = useState('')
  const [correoOriginal, setCorreoOriginal] = useState('')
  const [savingData, setSavingData] = useState(false)

  // Avatar
  const [localAvatar, setLocalAvatar] = useState(avatarId)

  // Cargar datos completos al abrir (incluye telefono que el JWT no trae)
  useEffect(() => {
    if (!isOpen) return
    setLoadingProfile(true)
    api.get('/usuario/me')
      .then(({ data }) => {
        setNombres(data.nombres ?? '')
        setApellidos(data.apellidos ?? '')
        setTelefono(data.telefono ?? '')
        setCorreo(data.correo ?? '')
        setCorreoOriginal(data.correo ?? '')
      })
      .catch(() => showToast('error', 'No se pudieron cargar los datos del perfil.'))
      .finally(() => setLoadingProfile(false))
  }, [isOpen])

  useEffect(() => { setLocalAvatar(avatarId) }, [avatarId])

  useEffect(() => {
    if (!isOpen) return
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [isOpen, onClose])

  const handleSaveData = async () => {
    if (!nombres.trim() || !apellidos.trim()) { showToast('error', 'Nombres y apellidos son requeridos.'); return }
    const correoChanged = correo.trim() !== correoOriginal

    setSavingData(true)
    try {
      const payload = {
        nombres: nombres.trim(),
        apellidos: apellidos.trim(),
        telefono: telefono.trim() || undefined,
        ...(correoChanged && { correo: correo.trim() }),
      }
      const { data } = await api.patch('/usuario/me', payload)
      updateUser({ nombres: data.nombres, apellidos: data.apellidos, telefono: data.telefono, correo: data.correo })

      if (correoChanged) {
        showToast('success', 'Correo actualizado. Cerrando sesión...')
        setTimeout(() => { logout(); navigate('/login', { replace: true }) }, 1800)
      } else {
        showToast('success', 'Datos actualizados correctamente.')
      }
    } catch (err) {
      const msg = err?.response?.data?.message ?? 'No se pudo actualizar los datos.'
      showToast('error', Array.isArray(msg) ? msg[0] : msg)
    } finally {
      setSavingData(false)
    }
  }

  const handleSelectAvatar = (id) => {
    setLocalAvatar(id)
    if (user?.id) { setAvatarId(user.id, id); onAvatarChange?.(id) }
  }

  const handlePasswordSuccess = () => {
    logout()
    navigate('/login', { replace: true })
  }

  const initials = nombres
    ? nombres.trim().split(/\s+/).map(w => w[0]).join('').toUpperCase().slice(0, 3)
    : (correo?.slice(0, 2).toUpperCase() ?? 'U')

  const fullName = (nombres && apellidos) ? `${nombres} ${apellidos}`.trim() : nombres || correo

  const correoChanged = correo.trim() !== correoOriginal

  // Icons
  const IconUser = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
    </svg>
  )
  const IconPhoto = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round">
      <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>
      <polyline points="21 15 16 10 5 21"/>
    </svg>
  )
  const IconLock = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round">
      <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
    </svg>
  )

  return (
    <>
      {toastPortal}

      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)',
          zIndex: 490,
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? 'auto' : 'none',
          transition: 'opacity 0.28s ease',
        }}
      />

      {/* Panel */}
      <div style={{
        position: 'fixed', right: 0, top: 0, bottom: 0,
        width: 440, maxWidth: '100vw',
        background: '#f9fafb',
        zIndex: 500,
        transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform 0.3s cubic-bezier(0.4,0,0.2,1)',
        display: 'flex', flexDirection: 'column',
        boxShadow: '-4px 0 40px rgba(0,0,0,0.13)',
        overflowY: 'auto',
      }}>
        {/* Header */}
        <div style={{
          padding: '0 20px', height: 60,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: '#fff', borderBottom: '1px solid #e5e7eb',
          flexShrink: 0, position: 'sticky', top: 0, zIndex: 1,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <UserAvatar userId={user?.id} initials={initials} size={32} avatarId={localAvatar} />
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>Mi perfil</div>
              <div style={{ fontSize: 11.5, color: '#6b7280' }}>{fullName || correo}</div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: '#9ca3af', display: 'flex', alignItems: 'center',
              padding: 6, borderRadius: 7, transition: 'background 0.15s, color 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#f3f4f6'; e.currentTarget.style.color = '#374151' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = '#9ca3af' }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '20px 20px 32px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {loadingProfile ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#9ca3af', fontSize: 13 }}>
              Cargando perfil...
            </div>
          ) : (
            <>
              {/* Avatar */}
              <SectionCard title="Foto de perfil" icon={<IconPhoto />}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'center' }}>
                  {AVATAR_PRESETS.map(preset => {
                    const selected = localAvatar === preset.id
                    return (
                      <button
                        key={preset.id}
                        onClick={() => handleSelectAvatar(preset.id)}
                        title={preset.label}
                        style={{
                          background: 'none', border: 'none', cursor: 'pointer',
                          padding: 4, borderRadius: '50%',
                          outline: selected ? '3px solid #39A900' : '3px solid transparent',
                          outlineOffset: 2,
                          transition: 'outline-color 0.15s, transform 0.15s',
                          transform: selected ? 'scale(1.08)' : 'scale(1)',
                        }}
                        onMouseEnter={e => { if (!selected) e.currentTarget.style.transform = 'scale(1.06)' }}
                        onMouseLeave={e => { if (!selected) e.currentTarget.style.transform = 'scale(1)' }}
                      >
                        <UserAvatar initials={initials} size={56} avatarId={preset.id} />
                      </button>
                    )
                  })}
                </div>
                <p style={{ margin: '12px 0 0', fontSize: 12, color: '#9ca3af', textAlign: 'center' }}>
                  El estilo se guarda en este dispositivo
                </p>
              </SectionCard>

              {/* Datos personales */}
              <SectionCard title="Datos personales" icon={<IconUser />}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <Field label="Nombres">
                      <TextInput value={nombres} onChange={setNombres} placeholder="Tu nombre" />
                    </Field>
                    <Field label="Apellidos">
                      <TextInput value={apellidos} onChange={setApellidos} placeholder="Tu apellido" />
                    </Field>
                  </div>
                  <Field label="Teléfono">
                    <TextInput value={telefono} onChange={setTelefono} placeholder="Ej: 3001234567" />
                  </Field>
                  <Field label="Correo electrónico">
                    <TextInput value={correo} onChange={setCorreo} placeholder="correo@ejemplo.com" type="email" />
                  </Field>

                  {correoChanged && (
                    <InfoBanner color="#92400e" bg="#fffbeb" border="#fde68a">
                      Cambiar el correo cerrará la sesión. Deberás iniciar sesión con el nuevo correo.
                    </InfoBanner>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <PrimaryBtn onClick={handleSaveData} loading={savingData} label="Guardar cambios" />
                  </div>
                </div>
              </SectionCard>

              {/* Contraseña */}
              <SectionCard title="Contraseña" icon={<IconLock />}>
                <PasswordSection
                  userCorreo={correoOriginal || user?.correo}
                  showToast={showToast}
                  onSuccess={handlePasswordSuccess}
                />
              </SectionCard>
            </>
          )}
        </div>
      </div>
    </>
  )
}
