import { useState, useEffect, useCallback } from 'react'
import api from '../../services/api'
import { AppButton }     from '../../components/atoms/AppButton'
import { AppInput }      from '../../components/atoms/AppInput'
import { AppSelect }     from '../../components/atoms/AppSelect'
import { Badge }         from '../../components/atoms/Badge'
import { IconButton }    from '../../components/atoms/IconButton'
import { FormField }     from '../../components/molecules/FormField'
import { PageHeader }    from '../../components/molecules/PageHeader'
import { AlertBanner }   from '../../components/molecules/AlertBanner'
import { ConfirmDialog } from '../../components/molecules/ConfirmDialog'
import { AppModal }      from '../../components/organisms/AppModal'
import { DataTable }     from '../../components/organisms/DataTable'

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

// ── Constants ─────────────────────────────────────────────────────────────────

const MODULOS = [
  { value: 'materiales',  label: 'Materiales' },
  { value: 'prestamos',   label: 'Préstamos' },
  { value: 'inventario',  label: 'Inventario' },
  { value: 'usuarios',    label: 'Usuarios' },
  { value: 'ubicaciones', label: 'Ubicaciones' },
]

const MODULO_LABELS = Object.fromEntries(MODULOS.map(m => [m.value, m.label]))

const EMPTY_FORM = { nombre: '', descripcion: '', modulo: 'materiales' }

// ── Page ─────────────────────────────────────────────────────────────────────

export function PermisosPage() {
  const [permisos,  setPermisos]  = useState([])
  const [loading,   setLoading]   = useState(true)
  const [error,     setError]     = useState(null)

  const [modal,     setModal]     = useState(null)  // null | { mode: 'create'|'edit', data? }
  const [form,      setForm]      = useState(EMPTY_FORM)
  const [saving,    setSaving]    = useState(false)
  const [formError, setFormError] = useState(null)

  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting,     setDeleting]     = useState(false)

  // ── Data loading ──────────────────────────────────────────────────────────

  const loadData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { data } = await api.get('/permisos')
      setPermisos(data)
    } catch {
      setError('No se pudo cargar la información.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  // ── Helpers ───────────────────────────────────────────────────────────────

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  // ── Modal handlers ────────────────────────────────────────────────────────

  const openCreate = () => {
    setForm(EMPTY_FORM)
    setFormError(null)
    setModal({ mode: 'create' })
  }

  const openEdit = (p) => {
    setForm({ nombre: p.nombre, descripcion: p.descripcion, modulo: p.modulo })
    setFormError(null)
    setModal({ mode: 'edit', data: p })
  }

  const closeModal = () => { setModal(null); setFormError(null) }

  const handleSave = async () => {
    setSaving(true)
    setFormError(null)
    try {
      if (modal.mode === 'create') {
        await api.post('/permisos', form)
      } else {
        await api.patch(`/permisos/${modal.data.id}`, form)
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
      await api.delete(`/permisos/${deleteTarget.id}`)
      setDeleteTarget(null)
      loadData()
    } catch (e) {
      const msg = e.response?.data?.message
      alert(Array.isArray(msg) ? msg.join(', ') : (msg ?? 'Error al eliminar.'))
    } finally {
      setDeleting(false)
    }
  }

  // ── Columns ───────────────────────────────────────────────────────────────

  const columns = [
    {
      key: 'modulo',
      header: 'Módulo',
      render: (p) => (
        <Badge variant="success" style={{ fontSize: 11.5 }}>
          {MODULO_LABELS[p.modulo] ?? p.modulo}
        </Badge>
      ),
      width: 130,
    },
    {
      key: 'nombre',
      header: 'Nombre',
      render: (p) => <span style={{ fontWeight: 500, color: '#111827' }}>{p.nombre}</span>,
    },
    {
      key: 'descripcion',
      header: 'Descripción',
      render: (p) => <span style={{ color: '#6b7280' }}>{p.descripcion}</span>,
    },
    {
      key: 'acciones',
      header: '',
      align: 'right',
      width: 90,
      render: (p) => (
        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
          <IconButton variant="edit" title="Editar" onClick={() => openEdit(p)}>
            <EditIcon />
          </IconButton>
          <IconButton variant="delete" title="Eliminar" onClick={() => setDeleteTarget(p)}>
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
        title="Permisos"
        description="Gestión de permisos y módulos del sistema SIGMAT"
      />

      <DataTable
        columns={columns}
        data={permisos}
        loading={loading}
        error={error}
        onRetry={loadData}
        searchable
        searchPlaceholder="Buscar por nombre o módulo…"
        pageSize={10}
        emptyTitle="Sin permisos"
        emptyDescription="Crea el primer permiso del sistema."
        emptyAction={
          <AppButton size="compact" onClick={openCreate}>
            <PlusIcon /> Nuevo permiso
          </AppButton>
        }
        actions={
          <>
            <AppButton variant="ghost" size="compact" onClick={loadData} disabled={loading}>
              <RefreshIcon /> Actualizar
            </AppButton>
            <AppButton size="compact" onClick={openCreate}>
              <PlusIcon /> Nuevo permiso
            </AppButton>
          </>
        }
      />

      {/* Modal crear / editar */}
      <AppModal
        isOpen={!!modal}
        onClose={closeModal}
        title={modal?.mode === 'create' ? 'Nuevo permiso' : 'Editar permiso'}
        footer={
          <>
            <AppButton variant="ghost" size="compact" onClick={closeModal} disabled={saving}>
              Cancelar
            </AppButton>
            <AppButton size="compact" onClick={handleSave} loading={saving}>
              {modal?.mode === 'create' ? 'Crear permiso' : 'Guardar cambios'}
            </AppButton>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <FormField label="Módulo" required>
            <AppSelect
              size="sm"
              value={form.modulo}
              onChange={e => set('modulo', e.target.value)}
            >
              {MODULOS.map(m => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </AppSelect>
          </FormField>

          <FormField label="Nombre del permiso" required>
            <AppInput
              size="sm"
              value={form.nombre}
              placeholder="Ej. Gestión de Materiales"
              onChange={e => set('nombre', e.target.value)}
            />
          </FormField>

          <FormField label="Descripción" required>
            <AppInput
              size="sm"
              value={form.descripcion}
              placeholder="Ej. Acceso completo al módulo de materiales"
              onChange={e => set('descripcion', e.target.value)}
            />
          </FormField>

          {formError && <AlertBanner variant="error">{formError}</AlertBanner>}
        </div>
      </AppModal>

      {/* Confirmar eliminación */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Eliminar permiso"
        description={
          deleteTarget
            ? <>¿Eliminar el permiso <strong>{deleteTarget.nombre}</strong>? Los roles que lo tengan asignado perderán este acceso.</>
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
