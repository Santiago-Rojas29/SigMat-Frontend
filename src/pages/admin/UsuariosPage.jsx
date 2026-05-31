import { useState, useEffect, useCallback } from 'react'
import api from '../../services/api'
import { AppButton }             from '../../components/atoms/AppButton'
import { AppInput }              from '../../components/atoms/AppInput'
import { AppSelect }             from '../../components/atoms/AppSelect'
import { Badge }                 from '../../components/atoms/Badge'
import { IconButton }            from '../../components/atoms/IconButton'
import { FormField }             from '../../components/molecules/FormField'
import { PageHeader }            from '../../components/molecules/PageHeader'
import { AlertBanner }           from '../../components/molecules/AlertBanner'
import { ConfirmDialog }         from '../../components/molecules/ConfirmDialog'
import { AppModal }              from '../../components/organisms/AppModal'
import { DataTable }             from '../../components/organisms/DataTable'
import { PermisosUsuarioModal }  from '../../components/organisms/PermisosUsuarioModal'

// ── Icons ────────────────────────────────────────────────────────────────────

function Ic({ size = 16, children }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {children}
    </svg>
  )
}

const PlusIcon    = () => <Ic><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></Ic>
const RefreshIcon = () => <Ic><path d="M23 4v6h-6"/><path d="M1 20v-6h6"/><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/></Ic>
const EditIcon    = () => <Ic size={15}><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></Ic>
const TrashIcon   = () => <Ic size={15}><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/></Ic>
const EyeIcon     = () => <Ic size={16}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></Ic>
const EyeOffIcon  = () => <Ic size={16}><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></Ic>
const ShieldIcon  = () => <Ic size={15}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></Ic>

// ── Constants ─────────────────────────────────────────────────────────────────

const TIPOS_DOCUMENTO = [
  { value: 'cc',        label: 'Cédula de Ciudadanía' },
  { value: 'ti',        label: 'Tarjeta de Identidad' },
  { value: 'ce',        label: 'Cédula de Extranjería' },
  { value: 'pasaporte', label: 'Pasaporte' },
]

const TIPO_LABELS = { cc: 'C.C.', ti: 'T.I.', ce: 'C.E.', pasaporte: 'PAS.' }

const EMPTY_FORM = {
  id_rol: '', tipo_documento: 'cc', numero_documento: '',
  nombres: '', apellidos: '', correo: '', telefono: '',
  estado: 'activo', contrasena: '',
}

// ── Page ─────────────────────────────────────────────────────────────────────

export function UsuariosPage() {
  const [usuarios, setUsuarios] = useState([])
  const [roles,    setRoles]    = useState([])
  const [permisos, setPermisos] = useState([])
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState(null)

  const [modal,     setModal]     = useState(null)  // null | { mode: 'create'|'edit', data? }
  const [form,      setForm]      = useState(EMPTY_FORM)
  const [saving,    setSaving]    = useState(false)
  const [formError, setFormError] = useState(null)
  const [showPass,  setShowPass]  = useState(false)

  const [deleteTarget,   setDeleteTarget]   = useState(null)
  const [deleting,       setDeleting]       = useState(false)
  const [permisosTarget, setPermisosTarget] = useState(null)  // usuario seleccionado para permisos

  // ── Data loading ──────────────────────────────────────────────────────────

  const loadData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [uRes, rRes, pRes] = await Promise.all([
        api.get('/usuario'),
        api.get('/rol'),
        api.get('/permisos'),
      ])
      setUsuarios(uRes.data)
      setRoles(rRes.data)
      setPermisos(pRes.data)
    } catch {
      setError('No se pudo cargar la información. Verifica tu conexión.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  // ── Helpers ───────────────────────────────────────────────────────────────

  const rolNombre = (id) => roles.find(r => r.id === id)?.nombre ?? '—'
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  // ── Modal handlers ────────────────────────────────────────────────────────

  const openCreate = () => {
    setForm({ ...EMPTY_FORM, id_rol: roles[0]?.id ?? '' })
    setFormError(null)
    setShowPass(false)
    setModal({ mode: 'create' })
  }

  const openEdit = (u) => {
    setForm({
      id_rol: u.id_rol, tipo_documento: u.tipo_documento,
      numero_documento: u.numero_documento, nombres: u.nombres,
      apellidos: u.apellidos, correo: u.correo,
      telefono: u.telefono, estado: u.estado, contrasena: '',
    })
    setFormError(null)
    setShowPass(false)
    setModal({ mode: 'edit', data: u })
  }

  const closeModal = () => { setModal(null); setFormError(null) }

  const handleSave = async () => {
    setSaving(true)
    setFormError(null)
    try {
      const payload = { ...form }
      if (modal.mode === 'edit' && !payload.contrasena) delete payload.contrasena
      if (modal.mode === 'create') {
        await api.post('/usuario', payload)
      } else {
        await api.patch(`/usuario/${modal.data.id}`, payload)
      }
      closeModal()
      loadData()
    } catch (e) {
      const msg = e.response?.data?.message
      setFormError(Array.isArray(msg) ? msg.join(', ') : (msg ?? 'Error al guardar.'))
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await api.delete(`/usuario/${deleteTarget.id}`)
      setDeleteTarget(null)
      loadData()
    } catch (e) {
      const msg = e.response?.data?.message
      setFormError(Array.isArray(msg) ? msg.join(', ') : (msg ?? 'Error al eliminar.'))
    } finally {
      setDeleting(false)
    }
  }

  const handleBulkDelete = async (ids) => {
    await Promise.all(ids.map(id => api.delete(`/usuario/${id}`)))
    loadData()
  }

  // ── Table columns ─────────────────────────────────────────────────────────

  const columns = [
    {
      key: 'id',
      header: 'ID',
      copyable: true,
      truncateAt: 8,
      searchable: false,
      width: 110,
    },
    {
      key: 'nombre',
      header: 'Nombre completo',
      render: (u) => (
        <span style={{ fontWeight: 500, color: '#111827' }}>
          {u.nombres} {u.apellidos}
        </span>
      ),
    },
    {
      key: 'documento',
      header: 'Documento',
      render: (u) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Badge variant="default" style={{ fontSize: 10.5, fontWeight: 700, padding: '2px 6px', borderRadius: 5, letterSpacing: '0.3px' }}>
            {TIPO_LABELS[u.tipo_documento] ?? u.tipo_documento.toUpperCase()}
          </Badge>
          <span>{u.numero_documento}</span>
        </div>
      ),
    },
    { key: 'correo',   header: 'Correo' },
    { key: 'telefono', header: 'Teléfono' },
    {
      key: 'rol',
      header: 'Rol',
      render: (u) => <span style={{ color: '#374151' }}>{rolNombre(u.id_rol)}</span>,
    },
    {
      key: 'estado',
      header: 'Estado',
      render: (u) => (
        <Badge variant={u.estado === 'activo' ? 'success' : 'default'}>
          {u.estado === 'activo' ? 'Activo' : 'Inactivo'}
        </Badge>
      ),
    },
    {
      key: 'acciones',
      header: '',
      align: 'right',
      width: 110,
      render: (u) => (
        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
          <IconButton
            title="Gestionar permisos"
            onClick={() => setPermisosTarget(u)}
            style={{ color: '#7c3aed' }}
          >
            <ShieldIcon />
          </IconButton>
          <IconButton variant="edit" title="Editar" onClick={() => openEdit(u)}>
            <EditIcon />
          </IconButton>
          <IconButton variant="delete" title="Eliminar" onClick={() => setDeleteTarget(u)}>
            <TrashIcon />
          </IconButton>
        </div>
      ),
    },
  ]

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div>
      <PageHeader
        title="Usuarios"
        description="Gestión de cuentas, roles y permisos del sistema"
      />

      <DataTable
        columns={columns}
        data={usuarios}
        loading={loading}
        error={error}
        onRetry={loadData}
        searchable
        searchPlaceholder="Buscar por nombre, correo, documento…"
        pageSize={10}
        selectable
        onBulkDelete={handleBulkDelete}
        emptyTitle="Sin usuarios"
        emptyDescription="Crea el primer usuario del sistema."
        emptyAction={
          <AppButton size="compact" onClick={openCreate}>
            <PlusIcon /> Nuevo usuario
          </AppButton>
        }
        actions={
          <>
            <AppButton variant="ghost" size="compact" onClick={loadData} disabled={loading}>
              <RefreshIcon /> Actualizar
            </AppButton>
            <AppButton size="compact" onClick={openCreate}>
              <PlusIcon /> Nuevo usuario
            </AppButton>
          </>
        }
      />

      {/* Modal crear / editar usuario */}
      <AppModal
        isOpen={!!modal}
        onClose={closeModal}
        title={modal?.mode === 'create' ? 'Nuevo usuario' : 'Editar usuario'}
        footer={
          <>
            <AppButton variant="ghost" size="compact" onClick={closeModal} disabled={saving}>
              Cancelar
            </AppButton>
            <AppButton size="compact" onClick={handleSave} loading={saving}>
              {modal?.mode === 'create' ? 'Crear usuario' : 'Guardar cambios'}
            </AppButton>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', gap: 14 }}>
            <FormField label="Nombres" required>
              <AppInput size="sm" value={form.nombres} placeholder="Ej. Juan Carlos"
                onChange={e => set('nombres', e.target.value)} />
            </FormField>
            <FormField label="Apellidos" required>
              <AppInput size="sm" value={form.apellidos} placeholder="Ej. Gómez Ruiz"
                onChange={e => set('apellidos', e.target.value)} />
            </FormField>
          </div>

          <div style={{ display: 'flex', gap: 14 }}>
            <FormField label="Tipo de documento" required>
              <AppSelect size="sm" value={form.tipo_documento}
                onChange={e => set('tipo_documento', e.target.value)}>
                {TIPOS_DOCUMENTO.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </AppSelect>
            </FormField>
            <FormField label="Número de documento" required>
              <AppInput size="sm" value={form.numero_documento} placeholder="Ej. 1023456789"
                onChange={e => set('numero_documento', e.target.value)} />
            </FormField>
          </div>

          <div style={{ display: 'flex', gap: 14 }}>
            <FormField label="Correo electrónico" required>
              <AppInput size="sm" type="email" value={form.correo} placeholder="usuario@sena.edu.co"
                onChange={e => set('correo', e.target.value)} />
            </FormField>
            <FormField label="Teléfono" required>
              <AppInput size="sm" value={form.telefono} placeholder="Ej. 3001234567"
                onChange={e => set('telefono', e.target.value)} />
            </FormField>
          </div>

          <div style={{ display: 'flex', gap: 14 }}>
            <FormField label="Rol" required>
              <AppSelect size="sm" value={form.id_rol}
                onChange={e => set('id_rol', e.target.value)}>
                {roles.map(r => <option key={r.id} value={r.id}>{r.nombre}</option>)}
              </AppSelect>
            </FormField>
            <FormField label="Estado" required>
              <AppSelect size="sm" value={form.estado}
                onChange={e => set('estado', e.target.value)}>
                <option value="activo">Activo</option>
                <option value="inactivo">Inactivo</option>
              </AppSelect>
            </FormField>
          </div>

          <FormField
            label={modal?.mode === 'edit'
              ? 'Nueva contraseña (dejar vacío para no cambiar)'
              : 'Contraseña'}
            required={modal?.mode === 'create'}
          >
            <AppInput
              size="sm"
              type={showPass ? 'text' : 'password'}
              value={form.contrasena}
              placeholder={modal?.mode === 'edit' ? 'Sin cambios' : 'Mínimo 8 caracteres'}
              onChange={e => set('contrasena', e.target.value)}
              rightIcon={showPass ? <EyeOffIcon /> : <EyeIcon />}
              onRightIconClick={() => setShowPass(p => !p)}
            />
          </FormField>

          {formError && <AlertBanner variant="error">{formError}</AlertBanner>}
        </div>
      </AppModal>

      {/* Modal de permisos del usuario */}
      <PermisosUsuarioModal
        isOpen={!!permisosTarget}
        onClose={() => setPermisosTarget(null)}
        usuario={permisosTarget}
        permisos={permisos}
      />

      {/* Confirmar eliminación */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Eliminar usuario"
        description={
          deleteTarget
            ? <>¿Eliminar a <strong>{deleteTarget.nombres} {deleteTarget.apellidos}</strong>? Esta acción no se puede deshacer.</>
            : null
        }
        confirmLabel="Sí, eliminar"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />
    </div>
  )
}
