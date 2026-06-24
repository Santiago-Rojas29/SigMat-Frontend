import { useState, useEffect, useCallback, useMemo } from 'react'
import api from '../../services/api'
import { AppButton }        from '../../components/atoms/AppButton'
import { AppInput }         from '../../components/atoms/AppInput'
import { AppSelect }        from '../../components/atoms/AppSelect'
import { SearchableSelect } from '../../components/atoms/SearchableSelect'
import { Badge }            from '../../components/atoms/Badge'
import { FormField }        from '../../components/molecules/FormField'
import { PageHeader }       from '../../components/molecules/PageHeader'
import { useToast }         from '../../hooks/useToast'
import { AppModal }         from '../../components/organisms/AppModal'
import { DataTable }        from '../../components/organisms/DataTable'
import { AppIcon }          from '../../components/atoms/AppIcon'

const TIPOS_DOC = [
  { value: 'cc', label: 'Cédula de Ciudadanía' },
  { value: 'ti', label: 'Tarjeta de Identidad' },
  { value: 'ce', label: 'Cédula de Extranjería' },
  { value: 'pasaporte', label: 'Pasaporte' },
]

const EMPTY = {
  id_sede: '', tipo_documento: 'cc', numero_documento: '',
  nombres: '', apellidos: '', correo: '', telefono: '', contrasena: '',
}

export function RootAdminsPage() {
  const [usuarios, setUsuarios] = useState([])
  const [sedes,    setSedes]    = useState([])
  const [centros,  setCentros]  = useState([])
  const [roles,    setRoles]    = useState([])
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState(null)
  const [modal,    setModal]    = useState(false)
  const [form,     setForm]     = useState(EMPTY)
  const [saving,   setSaving]   = useState(false)
  const [showPass, setShowPass] = useState(false)
  const { showToast, toastPortal } = useToast()

  const load = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const [uRes, sRes, cRes, rRes] = await Promise.all([
        api.get('/usuario'), api.get('/sede'), api.get('/centro'), api.get('/rol'),
      ])
      setUsuarios(uRes.data); setSedes(sRes.data); setCentros(cRes.data); setRoles(rRes.data)
    } catch { setError('Error al cargar datos.') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const adminRol = useMemo(() => roles.find(r => r.nombre === 'Administrador'), [roles])

  const admins = useMemo(() =>
    usuarios.filter(u => u.id_sede && adminRol && u.id_rol === adminRol.id),
  [usuarios, adminRol])

  const sedeMap = Object.fromEntries(sedes.map(s => [s.id_sede, s.nombre]))
  const centroMap = Object.fromEntries(centros.map(c => [c.id, c.nombre]))
  const sedeCentro = Object.fromEntries(sedes.map(s => [s.id_sede, centroMap[s.id_centro] ?? '—']))

  const sedesConAdmin = new Set(admins.map(a => a.id_sede))
  const sedesSinAdmin = sedes.filter(s => !sedesConAdmin.has(s.id_sede))

  const handleCrear = async () => {
    if (!form.id_sede || !form.nombres || !form.correo || !form.contrasena) {
      showToast('error', 'Completa todos los campos obligatorios.')
      return
    }
    if (!adminRol) {
      showToast('error', 'No existe el rol "Administrador". Créalo primero.')
      return
    }
    setSaving(true)
    try {
      await api.post('/usuario', {
        ...form,
        id_rol: adminRol.id,
        estado: 'activo',
      })
      showToast('success', 'Administrador creado y asignado a la sede.')
      setModal(false); load()
    } catch (e) {
      const msg = e.response?.data?.message
      showToast('error', Array.isArray(msg) ? msg.join(', ') : (msg ?? 'Error al crear.'))
    } finally { setSaving(false) }
  }

  const columns = [
    { key: 'id', header: 'ID', copyable: true, truncateAt: 8, searchable: false, width: 110 },
    {
      key: 'nombre', header: 'Administrador',
      render: u => <span style={{ fontWeight: 500 }}>{u.nombres} {u.apellidos}</span>,
    },
    { key: 'correo', header: 'Correo' },
    {
      key: 'id_sede', header: 'Sede',
      render: u => (
        <div>
          <div style={{ fontWeight: 500, fontSize: 13 }}>{sedeMap[u.id_sede] ?? '—'}</div>
          <div style={{ fontSize: 11.5, color: '#6b7280' }}>{sedeCentro[u.id_sede] ?? ''}</div>
        </div>
      ),
    },
    {
      key: 'estado', header: 'Estado',
      render: u => <Badge variant={u.estado === 'activo' ? 'success' : 'default'}>{u.estado === 'activo' ? 'Activo' : 'Inactivo'}</Badge>,
    },
  ]

  return (
    <>
      {toastPortal}
      <PageHeader
        title="Administradores por Sede"
        description="Asigna un administrador a cada sede. Ese admin gestiona usuarios, inventario y operaciones de su sede."
      />

      {sedesSinAdmin.length > 0 && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '10px 16px', marginBottom: 16, borderRadius: 8,
          background: '#fef3c7', border: '1px solid #fde68a',
        }}>
          <AppIcon name="warn" size={16} style={{ color: '#d97706' }} />
          <span style={{ fontSize: 13, color: '#92400e' }}>
            {sedesSinAdmin.length} sede{sedesSinAdmin.length !== 1 ? 's' : ''} sin administrador asignado:
            {' '}<strong>{sedesSinAdmin.map(s => s.nombre).join(', ')}</strong>
          </span>
        </div>
      )}

      <DataTable
        columns={columns} data={admins} loading={loading} error={error} onRetry={load}
        searchable searchPlaceholder="Buscar por nombre, correo, sede…" pageSize={10}
        emptyTitle="Sin administradores" emptyDescription="Crea el primer administrador para una sede."
        emptyAction={
          <AppButton size="compact" onClick={() => { setForm(EMPTY); setShowPass(false); setModal(true) }}>
            <AppIcon name="plus" /> Crear administrador
          </AppButton>
        }
        actions={
          <>
            <AppButton variant="ghost" size="compact" onClick={load}><AppIcon name="refresh" /> Actualizar</AppButton>
            <AppButton size="compact" onClick={() => { setForm(EMPTY); setShowPass(false); setModal(true) }} disabled={sedesSinAdmin.length === 0}>
              <AppIcon name="plus" /> Crear administrador
            </AppButton>
          </>
        }
      />

      <AppModal isOpen={modal} onClose={() => setModal(false)} maxWidth={580}
        title="Crear administrador de sede"
        footer={<><AppButton variant="ghost" size="compact" onClick={() => setModal(false)}>Cancelar</AppButton><AppButton size="compact" onClick={handleCrear} loading={saving}>Crear administrador</AppButton></>}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <FormField label="Sede" required>
            <SearchableSelect size="sm" value={form.id_sede} placeholder="Seleccionar sede"
              options={sedesSinAdmin.map(s => ({ value: s.id_sede, label: `${s.nombre} — ${centroMap[s.id_centro] ?? ''}` }))}
              onChange={v => set('id_sede', v)} />
          </FormField>
          <div style={{ display: 'flex', gap: 14 }}>
            <FormField label="Nombres" required><AppInput size="sm" value={form.nombres} onChange={e => set('nombres', e.target.value)} /></FormField>
            <FormField label="Apellidos" required><AppInput size="sm" value={form.apellidos} onChange={e => set('apellidos', e.target.value)} /></FormField>
          </div>
          <div style={{ display: 'flex', gap: 14 }}>
            <FormField label="Tipo documento">
              <AppSelect size="sm" value={form.tipo_documento} onChange={e => set('tipo_documento', e.target.value)}>
                {TIPOS_DOC.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </AppSelect>
            </FormField>
            <FormField label="Número" required><AppInput size="sm" value={form.numero_documento} onChange={e => set('numero_documento', e.target.value)} /></FormField>
          </div>
          <div style={{ display: 'flex', gap: 14 }}>
            <FormField label="Correo" required><AppInput size="sm" type="email" value={form.correo} onChange={e => set('correo', e.target.value)} /></FormField>
            <FormField label="Teléfono" required><AppInput size="sm" value={form.telefono} onChange={e => set('telefono', e.target.value)} /></FormField>
          </div>
          <FormField label="Contraseña" required>
            <AppInput size="sm" type={showPass ? 'text' : 'password'} value={form.contrasena} placeholder="Mínimo 8 caracteres"
              onChange={e => set('contrasena', e.target.value)}
              rightIcon={showPass ? <AppIcon name="eye-off" size={16} /> : <AppIcon name="eye" size={15} />}
              onRightIconClick={() => setShowPass(p => !p)} />
          </FormField>
        </div>
      </AppModal>
    </>
  )
}
