import { useState, useEffect, useCallback } from 'react'
import api from '../../services/api'
import { AppButton }      from '../../components/atoms/AppButton'
import { AppInput }       from '../../components/atoms/AppInput'
import { AppSelect }      from '../../components/atoms/AppSelect'
import { Badge }          from '../../components/atoms/Badge'
import { IconButton }     from '../../components/atoms/IconButton'
import { FormField }      from '../../components/molecules/FormField'
import { PageHeader }     from '../../components/molecules/PageHeader'
import { useToast }       from '../../hooks/useToast'
import { ConfirmDialog }  from '../../components/molecules/ConfirmDialog'
import { AppModal }       from '../../components/organisms/AppModal'
import { DataTable }      from '../../components/organisms/DataTable'
import { AppIcon }        from '../../components/atoms/AppIcon'

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

  const { showToast, toastPortal } = useToast()

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
    setModal({ mode: 'create' })
  }

  const openEdit = (c) => {
    setForm({
      nombre: c.nombre, ciudad: c.ciudad,
      direccion: c.direccion, telefono: c.telefono, estado: c.estado,
    })
    setModal({ mode: 'edit', data: c })
  }

  const closeModal = () => { setModal(null) }

  const handleSave = async () => {
    if (!form.nombre || !form.ciudad || !form.direccion || !form.telefono) {
      showToast('error', 'Todos los campos obligatorios deben estar llenos.')
      return
    }
    setSaving(true)
    try {
      if (modal.mode === 'create') {
        await api.post('/centro', form)
        showToast('success', 'Centro creado correctamente.')
      } else {
        await api.patch(`/centro/${modal.data.id}`, form)
        showToast('success', 'Centro actualizado correctamente.')
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
      await api.delete(`/centro/${deleteTarget.id}`)
      showToast('success', 'Centro eliminado correctamente.')
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
            <AppIcon name="edit" size={15} />
          </IconButton>
          <IconButton variant="delete" title="Eliminar" onClick={() => setDeleteTarget(c)}>
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
            <AppIcon name="plus" /> Nuevo centro
          </AppButton>
        }
        actions={
          <>
            <AppButton variant="ghost" size="compact" onClick={loadData} disabled={loading}>
              <AppIcon name="refresh" /> Actualizar
            </AppButton>
            <AppButton size="compact" onClick={openCreate}>
              <AppIcon name="plus" /> Nuevo centro
            </AppButton>
          </>
        }
      />

      {/* Create / Edit modal */}
      <AppModal
        isOpen={!!modal}
        onClose={closeModal}
        maxWidth={640}
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
    </>
  )
}
