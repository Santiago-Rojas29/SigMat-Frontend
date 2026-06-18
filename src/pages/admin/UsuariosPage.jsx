import { useState, useEffect, useCallback } from 'react'
import api from '../../services/api'
import { AppButton }             from '../../components/atoms/AppButton'
import { AppInput }              from '../../components/atoms/AppInput'
import { AppSelect }             from '../../components/atoms/AppSelect'
import { SearchableSelect }      from '../../components/atoms/SearchableSelect'
import { Badge }                 from '../../components/atoms/Badge'
import { IconButton }            from '../../components/atoms/IconButton'
import { FormField }             from '../../components/molecules/FormField'
import { PageHeader }            from '../../components/molecules/PageHeader'
import { useToast }              from '../../hooks/useToast'
import { ConfirmDialog }         from '../../components/molecules/ConfirmDialog'
import { AppModal }              from '../../components/organisms/AppModal'
import { DataTable }             from '../../components/organisms/DataTable'
import { AppIcon }               from '../../components/atoms/AppIcon'

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
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState(null)

  const { showToast, toastPortal } = useToast()

  const [modal,     setModal]     = useState(null)  // null | { mode: 'create'|'edit', data? }
  const [form,      setForm]      = useState(EMPTY_FORM)
  const [saving,    setSaving]    = useState(false)
  const [showPass,  setShowPass]  = useState(false)

  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting,     setDeleting]     = useState(false)

  // ── Data loading ──────────────────────────────────────────────────────────

  const loadData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [uRes, rRes] = await Promise.all([
        api.get('/usuario'),
        api.get('/rol'),
      ])
      setUsuarios(uRes.data)
      setRoles(rRes.data)
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
    setShowPass(false)
    setModal({ mode: 'edit', data: u })
  }

  const closeModal = () => { setModal(null) }

  const handleSave = async () => {
    setSaving(true)
    try {
      const payload = { ...form }
      if (modal.mode === 'edit' && !payload.contrasena) delete payload.contrasena
      if (modal.mode === 'create') {
        await api.post('/usuario', payload)
        showToast('success', 'Usuario creado correctamente.')
      } else {
        await api.patch(`/usuario/${modal.data.id}`, payload)
        showToast('success', 'Usuario actualizado correctamente.')
      }
      closeModal()
      loadData()
    } catch (e) {
      const msg = e.response?.data?.message
      showToast('error', Array.isArray(msg) ? msg.join(', ') : (msg ?? 'Error al guardar.'))
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await api.delete(`/usuario/${deleteTarget.id}`)
      showToast('success', 'Usuario eliminado correctamente.')
      setDeleteTarget(null)
      loadData()
    } catch (e) {
      const msg = e.response?.data?.message
      showToast('error', Array.isArray(msg) ? msg.join(', ') : (msg ?? 'Error al eliminar.'))
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
      width: 90,
      render: (u) => (
        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
          <IconButton variant="edit" title="Editar" onClick={() => openEdit(u)}>
            <AppIcon name="edit" size={15} />
          </IconButton>
          <IconButton variant="delete" title="Eliminar" onClick={() => setDeleteTarget(u)}>
            <AppIcon name="trash" size={15} />
          </IconButton>
        </div>
      ),
    },
  ]

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <>
      {toastPortal}
      <div>
      <PageHeader
        title="Usuarios"
        description="Gestión de cuentas y roles. Los permisos se configuran por rol en el módulo de Roles."
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
            <AppIcon name="plus" /> Nuevo usuario
          </AppButton>
        }
        actions={
          <>
            <AppButton variant="ghost" size="compact" onClick={loadData} disabled={loading}>
              <AppIcon name="refresh" /> Actualizar
            </AppButton>
            <AppButton size="compact" onClick={openCreate}>
              <AppIcon name="plus" /> Nuevo usuario
            </AppButton>
          </>
        }
      />

      {/* Modal crear / editar usuario */}
      <AppModal
        isOpen={!!modal}
        onClose={closeModal}
        maxWidth={640}
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
              <SearchableSelect
                size="sm"
                value={form.id_rol}
                placeholder="— Seleccionar rol —"
                options={roles.map(r => ({ value: r.id, label: r.nombre }))}
                onChange={v => set('id_rol', v)}
              />
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
              rightIcon={showPass ? <AppIcon name="eye-off" size={16} /> : <AppIcon name="eye" size={15} />}
              onRightIconClick={() => setShowPass(p => !p)}
            />
          </FormField>

        </div>
      </AppModal>

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
    </>
  )
}
