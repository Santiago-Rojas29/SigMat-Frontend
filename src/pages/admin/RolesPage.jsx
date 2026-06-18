import { useState, useEffect, useCallback } from 'react'
import api from '../../services/api'
import { AppButton }      from '../../components/atoms/AppButton'
import { AppInput }       from '../../components/atoms/AppInput'
import { Badge }          from '../../components/atoms/Badge'
import { IconButton }     from '../../components/atoms/IconButton'
import { FormField }      from '../../components/molecules/FormField'
import { PageHeader }     from '../../components/molecules/PageHeader'
import { useToast }       from '../../hooks/useToast'
import { ConfirmDialog }  from '../../components/molecules/ConfirmDialog'
import { AppModal }       from '../../components/organisms/AppModal'
import { DataTable }      from '../../components/organisms/DataTable'
import { PermisosRolModal } from '../../components/organisms/PermisosRolModal'
import { AppIcon }        from '../../components/atoms/AppIcon'

// ── Constants ─────────────────────────────────────────────────────────────────

const EMPTY_FORM = { nombre: '', descripcion: '' }

// ── Page ──────────────────────────────────────────────────────────────────────

export function RolesPage() {
  const [roles,    setRoles]    = useState([])
  const [usuarios, setUsuarios] = useState([])
  const [permisos, setPermisos] = useState([])
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState(null)

  const { showToast, toastPortal } = useToast()

  const [modal,     setModal]     = useState(null)  // null | { mode: 'create'|'edit', data? }
  const [form,      setForm]      = useState(EMPTY_FORM)
  const [saving,    setSaving]    = useState(false)

  const [deleteTarget,   setDeleteTarget]   = useState(null)
  const [deleting,       setDeleting]       = useState(false)
  const [permisosTarget, setPermisosTarget] = useState(null)  // rol seleccionado para permisos

  // ── Carga de datos ────────────────────────────────────────────────────────

  const loadData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [rRes, uRes, pRes] = await Promise.all([
        api.get('/rol'),
        api.get('/usuario'),
        api.get('/permisos'),
      ])
      setRoles(rRes.data)
      setUsuarios(uRes.data)
      setPermisos(pRes.data)
    } catch {
      setError('No se pudo cargar la información.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  // ── Helpers ───────────────────────────────────────────────────────────────

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))
  const usuariosPorRol = (id_rol) => usuarios.filter(u => u.id_rol === id_rol).length

  // ── Modal handlers ────────────────────────────────────────────────────────

  const openCreate = () => {
    setForm(EMPTY_FORM)
    setModal({ mode: 'create' })
  }

  const openEdit = (rol) => {
    setForm({ nombre: rol.nombre, descripcion: rol.descripcion })
    setModal({ mode: 'edit', data: rol })
  }

  const closeModal = () => { setModal(null) }

  const handleSave = async () => {
    if (!form.nombre.trim()) {
      showToast('error', 'El nombre del rol es obligatorio.')
      return
    }
    setSaving(true)
    try {
      if (modal.mode === 'create') {
        await api.post('/rol', form)
        showToast('success', 'Rol creado correctamente.')
      } else {
        await api.patch(`/rol/${modal.data.id}`, form)
        showToast('success', 'Rol actualizado correctamente.')
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
      await api.delete(`/rol/${deleteTarget.id}`)
      showToast('success', 'Rol eliminado correctamente.')
      setDeleteTarget(null)
      loadData()
    } catch (e) {
      const msg = e.response?.data?.message
      showToast('error', Array.isArray(msg) ? msg.join(', ') : (msg ?? 'Error al eliminar.'))
    } finally {
      setDeleting(false)
    }
  }

  // ── Columnas ──────────────────────────────────────────────────────────────

  const columns = [
    {
      key: 'nombre',
      header: 'Rol',
      render: (r) => (
        <span style={{ fontWeight: 600, color: '#111827' }}>{r.nombre}</span>
      ),
    },
    {
      key: 'descripcion',
      header: 'Descripción',
      render: (r) => (
        <span style={{ color: '#6b7280' }}>{r.descripcion || '—'}</span>
      ),
    },
    {
      key: 'usuarios',
      header: 'Usuarios asignados',
      render: (r) => {
        const total = usuariosPorRol(r.id)
        return (
          <Badge variant={total > 0 ? 'success' : 'default'} style={{ fontSize: 12 }}>
            {total} {total === 1 ? 'usuario' : 'usuarios'}
          </Badge>
        )
      },
      width: 160,
    },
    {
      key: 'acciones',
      header: '',
      align: 'right',
      width: 120,
      render: (r) => (
        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
          <IconButton
            title="Gestionar permisos"
            onClick={() => setPermisosTarget(r)}
            style={{ color: '#7c3aed' }}
          >
            <AppIcon name="shield" size={15} />
          </IconButton>
          <IconButton variant="edit" title="Editar" onClick={() => openEdit(r)}>
            <AppIcon name="edit" size={15} />
          </IconButton>
          <IconButton variant="delete" title="Eliminar" onClick={() => setDeleteTarget(r)}>
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
        title="Roles"
        description="Categorías de usuario del sistema. Los permisos se asignan por rol y los usuarios los heredan automáticamente."
      />

      <DataTable
        columns={columns}
        data={roles}
        loading={loading}
        error={error}
        onRetry={loadData}
        searchable
        searchPlaceholder="Buscar por nombre…"
        pageSize={10}
        emptyTitle="Sin roles"
        emptyDescription="Crea el primer rol del sistema."
        emptyAction={
          <AppButton size="compact" onClick={openCreate}>
            <AppIcon name="plus" /> Nuevo rol
          </AppButton>
        }
        actions={
          <>
            <AppButton variant="ghost" size="compact" onClick={loadData} disabled={loading}>
              <AppIcon name="refresh" /> Actualizar
            </AppButton>
            <AppButton size="compact" onClick={openCreate}>
              <AppIcon name="plus" /> Nuevo rol
            </AppButton>
          </>
        }
      />

      {/* Modal crear / editar */}
      <AppModal
        isOpen={!!modal}
        onClose={closeModal}
        maxWidth={640}
        title={modal?.mode === 'create' ? 'Nuevo rol' : `Editar — ${modal?.data?.nombre ?? ''}`}
        footer={
          <>
            <AppButton variant="ghost" size="compact" onClick={closeModal} disabled={saving}>
              Cancelar
            </AppButton>
            <AppButton size="compact" onClick={handleSave} loading={saving}>
              {modal?.mode === 'create' ? 'Crear rol' : 'Guardar cambios'}
            </AppButton>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <FormField label="Nombre del rol" required>
            <AppInput
              size="sm"
              value={form.nombre}
              placeholder="Ej. Instructor, Aprendiz, Coordinador"
              onChange={e => set('nombre', e.target.value)}
            />
          </FormField>

          <FormField label="Descripción">
            <AppInput
              size="sm"
              value={form.descripcion}
              placeholder="Ej. Encargado de gestionar préstamos del almacén"
              onChange={e => set('descripcion', e.target.value)}
            />
          </FormField>

          {/* Aviso informativo */}
          <div style={{
            background: '#f0f9ff', border: '1px solid #bae6fd',
            borderRadius: 8, padding: '10px 14px',
            display: 'flex', gap: 10, alignItems: 'flex-start',
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
              stroke="#0ea5e9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              style={{ flexShrink: 0, marginTop: 1 }}>
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <p style={{ fontSize: 12.5, color: '#0369a1', margin: 0, lineHeight: 1.5 }}>
              Después de crear el rol, usa el botón{' '}
              <strong>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                  strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                  style={{ verticalAlign: 'middle', marginRight: 2 }}>
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
                Permisos
              </strong>{' '}
              para configurar qué módulos, submódulos y acciones tiene asignados.
            </p>
          </div>

        </div>
      </AppModal>

      {/* Modal de permisos del rol */}
      <PermisosRolModal
        isOpen={!!permisosTarget}
        onClose={() => setPermisosTarget(null)}
        rol={permisosTarget}
        permisos={permisos}
      />

      {/* Confirmar eliminación */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Eliminar rol"
        description={
          deleteTarget
            ? <>¿Eliminar el rol <strong>{deleteTarget.nombre}</strong>? Los usuarios con este rol quedarán sin categoría y sin permisos.</>
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
