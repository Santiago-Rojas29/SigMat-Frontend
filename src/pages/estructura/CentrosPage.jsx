import { useState, useEffect, useCallback } from 'react'
import api from '../../services/api'
import { AppButton }      from '../../components/atoms/AppButton'
import { AppInput }       from '../../components/atoms/AppInput'
import { AppSelect }      from '../../components/atoms/AppSelect'
import { Badge }          from '../../components/atoms/Badge'
import { IconButton }     from '../../components/atoms/IconButton'
import { FormField }      from '../../components/molecules/FormField'
import { PageHeader }     from '../../components/molecules/PageHeader'
import { AlertBanner }    from '../../components/molecules/AlertBanner'
import { ConfirmDialog }  from '../../components/molecules/ConfirmDialog'
import { AppModal }       from '../../components/organisms/AppModal'
import { DataTable }      from '../../components/organisms/DataTable'

// ── Icons ────────────────────────────────────────────────────────────────────

function Ic({ size = 16, children }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {children}
    </svg>
  )
}

const PlusIcon     = () => <Ic><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></Ic>
const RefreshIcon  = () => <Ic><path d="M23 4v6h-6"/><path d="M1 20v-6h6"/><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/></Ic>
const EditIcon     = () => <Ic size={15}><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></Ic>
const TrashIcon    = () => <Ic size={15}><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/></Ic>

// ── Constants ─────────────────────────────────────────────────────────────────

const EMPTY_FORM = {
  nombre: '', ciudad: '', direccion: '', telefono: '', estado: 'activo',
}

// ── Page ─────────────────────────────────────────────────────────────────────

export function CentrosPage() {
  const [centros, setCentros] = useState([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)

  const [modal,     setModal]     = useState(null)
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
      const { data } = await api.get('/centro')
      setCentros(data)
    } catch {
      setError('No se pudo cargar la información. Verifica tu conexión.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  // ── Helpers ───────────────────────────────────────────────────────────────

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  // ── Modal handlers ────────────────────────────────────────────────────────

  const openCreate = () => {
    setForm({ ...EMPTY_FORM })
    setFormError(null)
    setModal({ mode: 'create' })
  }

  const openEdit = (c) => {
    setForm({
      nombre: c.nombre, ciudad: c.ciudad,
      direccion: c.direccion, telefono: c.telefono, estado: c.estado,
    })
    setFormError(null)
    setModal({ mode: 'edit', data: c })
  }

  const closeModal = () => { setModal(null); setFormError(null) }

  const handleSave = async () => {
    if (!form.nombre || !form.ciudad || !form.direccion || !form.telefono) {
      setFormError('Todos los campos obligatorios deben estar llenos.')
      return
    }
    setSaving(true)
    setFormError(null)
    try {
      if (modal.mode === 'create') {
        await api.post('/centro', form)
      } else {
        await api.patch(`/centro/${modal.data.id}`, form)
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
      await api.delete(`/centro/${deleteTarget.id}`)
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
    await Promise.all(ids.map(id => api.delete(`/centro/${id}`)))
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
      header: 'Nombre',
      render: (c) => (
        <span style={{ fontWeight: 500, color: '#111827' }}>
          {c.nombre}
        </span>
      ),
    },
    { key: 'ciudad',   header: 'Ciudad' },
    { key: 'direccion', header: 'Dirección' },
    { key: 'telefono',  header: 'Teléfono' },
    {
      key: 'estado',
      header: 'Estado',
      render: (c) => (
        <Badge variant={c.estado === 'activo' ? 'success' : 'default'}>
          {c.estado === 'activo' ? 'Activo' : 'Inactivo'}
        </Badge>
      ),
    },
    {
      key: 'acciones',
      header: '',
      align: 'right',
      width: 90,
      render: (c) => (
        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
          <IconButton variant="edit" title="Editar" onClick={() => openEdit(c)}>
            <EditIcon />
          </IconButton>
          <IconButton variant="delete" title="Eliminar" onClick={() => setDeleteTarget(c)}>
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
        title="Centros"
        description="Gestión de centros de formación del SENA"
      />

      <DataTable
        columns={columns}
        data={centros}
        loading={loading}
        error={error}
        onRetry={loadData}
        searchable
        searchPlaceholder="Buscar por nombre, ciudad, dirección…"
        pageSize={10}
        selectable
        onBulkDelete={handleBulkDelete}
        emptyTitle="Sin centros"
        emptyDescription="Crea el primer centro de formación."
        emptyAction={
          <AppButton size="compact" onClick={openCreate}>
            <PlusIcon /> Nuevo centro
          </AppButton>
        }
        actions={
          <>
            <AppButton variant="ghost" size="compact" onClick={loadData} disabled={loading}>
              <RefreshIcon /> Actualizar
            </AppButton>
            <AppButton size="compact" onClick={openCreate}>
              <PlusIcon /> Nuevo centro
            </AppButton>
          </>
        }
      />

      {/* Create / Edit modal */}
      <AppModal
        isOpen={!!modal}
        onClose={closeModal}
        title={modal?.mode === 'create' ? 'Nuevo centro' : 'Editar centro'}
        footer={
          <>
            <AppButton variant="ghost" size="compact" onClick={closeModal} disabled={saving}>
              Cancelar
            </AppButton>
            <AppButton size="compact" onClick={handleSave} loading={saving}>
              {modal?.mode === 'create' ? 'Crear centro' : 'Guardar cambios'}
            </AppButton>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <FormField label="Nombre" required>
            <AppInput size="sm" value={form.nombre} placeholder="Ej. Centro de Comercio"
              onChange={e => set('nombre', e.target.value)} />
          </FormField>

          <div style={{ display: 'flex', gap: 14 }}>
            <FormField label="Ciudad" required>
              <AppInput size="sm" value={form.ciudad} placeholder="Ej. Medellín"
                onChange={e => set('ciudad', e.target.value)} />
            </FormField>
            <FormField label="Teléfono" required>
              <AppInput size="sm" value={form.telefono} placeholder="Ej. 6041234567"
                onChange={e => set('telefono', e.target.value)} />
            </FormField>
          </div>

          <FormField label="Dirección" required>
            <AppInput size="sm" value={form.direccion} placeholder="Ej. Cra 50 #40-20"
              onChange={e => set('direccion', e.target.value)} />
          </FormField>

          <FormField label="Estado" required>
            <AppSelect size="sm" value={form.estado}
              onChange={e => set('estado', e.target.value)}>
              <option value="activo">Activo</option>
              <option value="inactivo">Inactivo</option>
            </AppSelect>
          </FormField>

          {formError && <AlertBanner variant="error">{formError}</AlertBanner>}
        </div>
      </AppModal>

      {/* Delete confirmation */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Eliminar centro"
        description={
          deleteTarget
            ? <>¿Eliminar <strong>{deleteTarget.nombre}</strong>? Esta acción no se puede deshacer.</>
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
