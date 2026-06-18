import { useState, useEffect, useCallback } from 'react'
import api from '../../services/api'
import { AppButton }        from '../../components/atoms/AppButton'
import { AppInput }         from '../../components/atoms/AppInput'
import { AppSelect }        from '../../components/atoms/AppSelect'
import { SearchableSelect } from '../../components/atoms/SearchableSelect'
import { Badge }            from '../../components/atoms/Badge'
import { IconButton }       from '../../components/atoms/IconButton'
import { FormField }        from '../../components/molecules/FormField'
import { PageHeader }       from '../../components/molecules/PageHeader'
import { useToast }         from '../../hooks/useToast'
import { ConfirmDialog }    from '../../components/molecules/ConfirmDialog'
import { AppModal }         from '../../components/organisms/AppModal'
import { DataTable }        from '../../components/organisms/DataTable'
import { AppIcon }          from '../../components/atoms/AppIcon'
const EMPTY_FORM = {
  id_centro: '', nombre: '', direccion: '', telefono: '', estado: 'activo',
}

export function SedesPage() {
  const [sedes, setSedes] = useState([])
  const [centros, setCentros] = useState([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)

  const [modal,     setModal]     = useState(null)
  const [form,      setForm]      = useState(EMPTY_FORM)
  const [saving,    setSaving]    = useState(false)

  const { showToast, toastPortal } = useToast()

  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting,     setDeleting]     = useState(false)

  const loadData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [sedesRes, centrosRes] = await Promise.all([
        api.get('/sede'),
        api.get('/centro'),
      ])
      setSedes(sedesRes.data)
      setCentros(centrosRes.data)
    } catch {
      setError('No se pudo cargar la información. Verifica tu conexión.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const centroMap = Object.fromEntries(
    centros.map(c => [c.id, c.nombre])
  )

  const openCreate = () => {
    setForm({ ...EMPTY_FORM })
    setModal({ mode: 'create' })
  }

  const openEdit = (s) => {
    setForm({
      id_centro: s.id_centro, nombre: s.nombre,
      direccion: s.direccion, telefono: s.telefono, estado: s.estado,
    })
    setModal({ mode: 'edit', data: s })
  }

  const closeModal = () => { setModal(null) }

  const handleSave = async () => {
    if (!form.id_centro || !form.nombre || !form.direccion || !form.telefono) {
      showToast('error', 'Todos los campos obligatorios deben estar llenos.')
      return
    }
    setSaving(true)
    try {
      if (modal.mode === 'create') {
        await api.post('/sede', form)
        showToast('success', 'Sede creada correctamente.')
      } else {
        await api.patch(`/sede/${modal.data.id_sede}`, form)
        showToast('success', 'Sede actualizada correctamente.')
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
      await api.delete(`/sede/${deleteTarget.id_sede}`)
      showToast('success', 'Sede eliminada correctamente.')
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
    await Promise.all(ids.map(id => api.delete(`/sede/${id}`)))
    loadData()
  }

  const columns = [
    {
      key: 'id_sede',
      header: 'ID',
      copyable: true,
      truncateAt: 8,
      searchable: false,
      width: 110,
    },
    {
      key: 'nombre',
      header: 'Nombre',
      render: (s) => (
        <span style={{ fontWeight: 500, color: '#111827' }}>
          {s.nombre}
        </span>
      ),
    },
    {
      key: 'id_centro',
      header: 'Centro',
      render: (s) => centroMap[s.id_centro] ?? <span style={{ color: '#9CA3AF' }}>—</span>,
    },
    { key: 'direccion', header: 'Dirección' },
    { key: 'telefono',  header: 'Teléfono' },
    {
      key: 'estado',
      header: 'Estado',
      render: (s) => (
        <Badge variant={s.estado === 'activo' ? 'success' : 'default'}>
          {s.estado === 'activo' ? 'Activo' : 'Inactivo'}
        </Badge>
      ),
    },
    {
      key: 'acciones',
      header: '',
      align: 'right',
      width: 90,
      render: (s) => (
        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
          <IconButton variant="edit" title="Editar" onClick={() => openEdit(s)}>
            <AppIcon name="edit" size={15} />
          </IconButton>
          <IconButton variant="delete" title="Eliminar" onClick={() => setDeleteTarget(s)}>
            <AppIcon name="trash" size={15} />
          </IconButton>
        </div>
      ),
    },
  ]

  return (
    <>
      {toastPortal}
      <div>
      <PageHeader
        title="Sedes"
        description="Gestión de sedes de los centros de formación del SENA"
      />

      <DataTable
        columns={columns}
        data={sedes}
        loading={loading}
        error={error}
        onRetry={loadData}
        searchable
        searchPlaceholder="Buscar por nombre, centro, dirección…"
        pageSize={10}
        selectable
        onBulkDelete={handleBulkDelete}
        emptyTitle="Sin sedes"
        emptyDescription="Crea la primera sede."
        emptyAction={
          <AppButton size="compact" onClick={openCreate}>
            <AppIcon name="plus" /> Nueva sede
          </AppButton>
        }
        actions={
          <>
            <AppButton variant="ghost" size="compact" onClick={loadData} disabled={loading}>
              <AppIcon name="refresh" /> Actualizar
            </AppButton>
            <AppButton size="compact" onClick={openCreate}>
              <AppIcon name="plus" /> Nueva sede
            </AppButton>
          </>
        }
      />

      <AppModal
        isOpen={!!modal}
        onClose={closeModal}
        maxWidth={640}
        title={modal?.mode === 'create' ? 'Nueva sede' : 'Editar sede'}
        footer={
          <>
            <AppButton variant="ghost" size="compact" onClick={closeModal} disabled={saving}>
              Cancelar
            </AppButton>
            <AppButton size="compact" onClick={handleSave} loading={saving}>
              {modal?.mode === 'create' ? 'Crear sede' : 'Guardar cambios'}
            </AppButton>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <FormField label="Centro" required>
            <SearchableSelect
              size="sm"
              value={form.id_centro}
              placeholder="Seleccionar centro"
              options={centros.map(c => ({ value: c.id, label: c.nombre }))}
              onChange={v => set('id_centro', v)}
            />
          </FormField>

          <FormField label="Nombre" required>
            <AppInput size="sm" value={form.nombre} placeholder="Ej. Sede Principal"
              onChange={e => set('nombre', e.target.value)} />
          </FormField>

          <div style={{ display: 'flex', gap: 14 }}>
            <FormField label="Dirección" required>
              <AppInput size="sm" value={form.direccion} placeholder="Ej. Cra 50 #40-20"
                onChange={e => set('direccion', e.target.value)} />
            </FormField>
            <FormField label="Teléfono" required>
              <AppInput size="sm" value={form.telefono} placeholder="Ej. 6041234567"
                onChange={e => set('telefono', e.target.value)} />
            </FormField>
          </div>

          <FormField label="Estado" required>
            <AppSelect size="sm" value={form.estado}
              onChange={e => set('estado', e.target.value)}>
              <option value="activo">Activo</option>
              <option value="inactivo">Inactivo</option>
            </AppSelect>
          </FormField>

        </div>
      </AppModal>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Eliminar sede"
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
