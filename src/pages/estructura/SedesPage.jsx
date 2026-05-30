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
  const [formError, setFormError] = useState(null)

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
    setFormError(null)
    setModal({ mode: 'create' })
  }

  const openEdit = (s) => {
    setForm({
      id_centro: s.id_centro, nombre: s.nombre,
      direccion: s.direccion, telefono: s.telefono, estado: s.estado,
    })
    setFormError(null)
    setModal({ mode: 'edit', data: s })
  }

  const closeModal = () => { setModal(null); setFormError(null) }

  const handleSave = async () => {
    if (!form.id_centro || !form.nombre || !form.direccion || !form.telefono) {
      setFormError('Todos los campos obligatorios deben estar llenos.')
      return
    }
    setSaving(true)
    setFormError(null)
    try {
      if (modal.mode === 'create') {
        await api.post('/sede', form)
      } else {
        await api.patch(`/sede/${modal.data.id_sede}`, form)
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
      await api.delete(`/sede/${deleteTarget.id_sede}`)
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
            <EditIcon />
          </IconButton>
          <IconButton variant="delete" title="Eliminar" onClick={() => setDeleteTarget(s)}>
            <TrashIcon />
          </IconButton>
        </div>
      ),
    },
  ]

  return (
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
            <PlusIcon /> Nueva sede
          </AppButton>
        }
        actions={
          <>
            <AppButton variant="ghost" size="compact" onClick={loadData} disabled={loading}>
              <RefreshIcon /> Actualizar
            </AppButton>
            <AppButton size="compact" onClick={openCreate}>
              <PlusIcon /> Nueva sede
            </AppButton>
          </>
        }
      />

      <AppModal
        isOpen={!!modal}
        onClose={closeModal}
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
            <AppSelect size="sm" value={form.id_centro}
              onChange={e => set('id_centro', e.target.value)}>
              <option value="">Seleccionar centro</option>
              {centros.map(c => (
                <option key={c.id} value={c.id}>{c.nombre}</option>
              ))}
            </AppSelect>
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

          {formError && <AlertBanner variant="error">{formError}</AlertBanner>}
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
  )
}
