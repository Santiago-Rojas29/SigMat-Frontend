import { useState, useEffect, useCallback } from 'react'
import api from '../../services/api'
import { AppButton }     from '../../components/atoms/AppButton'
import { AppInput }      from '../../components/atoms/AppInput'
import { Badge }         from '../../components/atoms/Badge'
import { IconButton }    from '../../components/atoms/IconButton'
import { FormField }     from '../../components/molecules/FormField'
import { PageHeader }    from '../../components/molecules/PageHeader'
import { AlertBanner }   from '../../components/molecules/AlertBanner'
import { ConfirmDialog } from '../../components/molecules/ConfirmDialog'
import { AppModal }      from '../../components/organisms/AppModal'
import { DataTable }     from '../../components/organisms/DataTable'

// ── Icons ─────────────────────────────────────────────────────────────────────

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

// ── Constants ─────────────────────────────────────────────────────────────────

const EMPTY_FORM = { nombre: '', descripcion: '' }

// ── Page ──────────────────────────────────────────────────────────────────────

export function RolesPage() {
  const [roles,    setRoles]    = useState([])
  const [usuarios, setUsuarios] = useState([])
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState(null)

  const [modal,     setModal]     = useState(null)  // null | { mode: 'create'|'edit', data? }
  const [form,      setForm]      = useState(EMPTY_FORM)
  const [saving,    setSaving]    = useState(false)
  const [formError, setFormError] = useState(null)

  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting,     setDeleting]     = useState(false)

  // ── Carga de datos ────────────────────────────────────────────────────────

  const loadData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [rRes, uRes] = await Promise.all([
        api.get('/rol'),
        api.get('/usuario'),
      ])
      setRoles(rRes.data)
      setUsuarios(uRes.data)
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
    setFormError(null)
    setModal({ mode: 'create' })
  }

  const openEdit = (rol) => {
    setForm({ nombre: rol.nombre, descripcion: rol.descripcion })
    setFormError(null)
    setModal({ mode: 'edit', data: rol })
  }

  const closeModal = () => { setModal(null); setFormError(null) }

  const handleSave = async () => {
    if (!form.nombre.trim()) {
      setFormError('El nombre del rol es obligatorio.')
      return
    }
    setSaving(true)
    setFormError(null)
    try {
      if (modal.mode === 'create') {
        await api.post('/rol', form)
      } else {
        await api.patch(`/rol/${modal.data.id}`, form)
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
      await api.delete(`/rol/${deleteTarget.id}`)
      setDeleteTarget(null)
      loadData()
    } catch (e) {
      const msg = e.response?.data?.message
      alert(Array.isArray(msg) ? msg.join(', ') : (msg ?? 'Error al eliminar.'))
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
      width: 90,
      render: (r) => (
        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
          <IconButton variant="edit" title="Editar" onClick={() => openEdit(r)}>
            <EditIcon />
          </IconButton>
          <IconButton variant="delete" title="Eliminar" onClick={() => setDeleteTarget(r)}>
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
        title="Roles"
        description="Categorías de usuario del sistema. Los permisos se asignan individualmente desde el módulo de Usuarios."
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
            <PlusIcon /> Nuevo rol
          </AppButton>
        }
        actions={
          <>
            <AppButton variant="ghost" size="compact" onClick={loadData} disabled={loading}>
              <RefreshIcon /> Actualizar
            </AppButton>
            <AppButton size="compact" onClick={openCreate}>
              <PlusIcon /> Nuevo rol
            </AppButton>
          </>
        }
      />

      {/* Modal crear / editar */}
      <AppModal
        isOpen={!!modal}
        onClose={closeModal}
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
            background: '#f0f9ff',
            border: '1px solid #bae6fd',
            borderRadius: 8,
            padding: '10px 14px',
            display: 'flex',
            gap: 10,
            alignItems: 'flex-start',
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
              stroke="#0ea5e9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              style={{ flexShrink: 0, marginTop: 1 }}>
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <p style={{ fontSize: 12.5, color: '#0369a1', margin: 0, lineHeight: 1.5 }}>
              Los permisos se asignan directamente a cada usuario desde el módulo de Usuarios.
              El rol es solo una etiqueta de clasificación.
            </p>
          </div>

          {formError && <AlertBanner variant="error">{formError}</AlertBanner>}
        </div>
      </AppModal>

      {/* Confirmar eliminación */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Eliminar rol"
        description={
          deleteTarget
            ? <>¿Eliminar el rol <strong>{deleteTarget.nombre}</strong>? Los usuarios con este rol seguirán existiendo pero quedarán sin categoría.</>
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
