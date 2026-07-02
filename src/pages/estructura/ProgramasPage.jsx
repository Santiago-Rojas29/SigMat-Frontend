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
const NIVEL_OPTS = [
  { value: 'tecnico',       label: 'Técnico' },
  { value: 'tecnologo',     label: 'Tecnólogo' },
  { value: 'complementaria', label: 'Complementaria' },
]

const EMPTY_FORM = {
  id_area: '', nombre: '', codigo_programa: '', nivel_formacion: '', estado: 'activo',
}

export function ProgramasPage() {
  const [programas, setProgramas] = useState([])
  const [areas, setAreas] = useState([])
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
      const [progRes, areasRes] = await Promise.all([
        api.get('/programa'),
        api.get('/area'),
      ])
      setProgramas(progRes.data)
      setAreas(areasRes.data)
    } catch {
      setError('No se pudo cargar la información. Verifica tu conexión.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const areaMap = Object.fromEntries(
    areas.map(a => [a.id_area, a.nombre])
  )

  const nivelLabel = Object.fromEntries(
    NIVEL_OPTS.map(o => [o.value, o.label])
  )

  const openCreate = () => {
    setForm({ ...EMPTY_FORM })
    setModal({ mode: 'create' })
  }

  const openEdit = (p) => {
    setForm({
      id_area: String(p.id_area), nombre: p.nombre,
      codigo_programa: p.codigo_programa, nivel_formacion: p.nivel_formacion, estado: p.estado,
    })
    setModal({ mode: 'edit', data: p })
  }

  const closeModal = () => { setModal(null) }

  const handleSave = async () => {
    if (!form.id_area || !form.nombre || !form.codigo_programa || !form.nivel_formacion) {
      showToast('error', 'Todos los campos obligatorios deben estar llenos.')
      return
    }
    setSaving(true)
    try {
      if (modal.mode === 'create') {
        await api.post('/programa', form)
        showToast('success', 'Programa creado correctamente.')
      } else {
        await api.patch(`/programa/${modal.data.id_programa}`, form)
        showToast('success', 'Programa actualizado correctamente.')
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
      await api.delete(`/programa/${deleteTarget.id_programa}`)
      showToast('success', 'Programa eliminado correctamente.')
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
    await Promise.all(ids.map(id => api.delete(`/programa/${id}`)))
    loadData()
  }

  const columns = [
    {
      key: 'id_programa',
      header: 'ID',
      copyable: true,
      truncateAt: 8,
      searchable: false,
      width: 110,
    },
    {
      key: 'nombre',
      header: 'Nombre',
      render: (p) => (
        <span style={{ fontWeight: 500, color: '#111827' }}>
          {p.nombre}
        </span>
      ),
    },
    { key: 'codigo_programa', header: 'Código' },
    {
      key: 'id_area',
      header: 'Área',
      render: (p) => areaMap[p.id_area] ?? <span style={{ color: '#9CA3AF' }}>—</span>,
    },
    {
      key: 'nivel_formacion',
      header: 'Nivel',
      render: (p) => nivelLabel[p.nivel_formacion] ?? <span style={{ color: '#9CA3AF' }}>—</span>,
    },
    {
      key: 'estado',
      header: 'Estado',
      render: (p) => (
        <Badge variant={p.estado === 'activo' ? 'success' : 'default'}>
          {p.estado === 'activo' ? 'Activo' : 'Inactivo'}
        </Badge>
      ),
    },
    {
      key: 'acciones',
      header: '',
      align: 'right',
      width: 90,
      render: (p) => (
        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
          <IconButton variant="edit" title="Editar" onClick={() => openEdit(p)}>
            <AppIcon name="edit" size={15} />
          </IconButton>
          <IconButton variant="delete" title="Eliminar" onClick={() => setDeleteTarget(p)}>
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
        title="Programas"
        description="Gestión de programas de formación del SENA"
      />

      <DataTable
        columns={columns}
        data={programas}
        loading={loading}
        error={error}
        onRetry={loadData}
        searchable
        searchPlaceholder="Buscar por nombre, código, área…"
        pageSize={10}
        selectable
        onBulkDelete={handleBulkDelete}
        emptyTitle="Sin programas"
        emptyDescription="Crea el primer programa de formación."
        emptyAction={
          <AppButton size="compact" onClick={openCreate}>
            <AppIcon name="plus" /> Nuevo programa
          </AppButton>
        }
        actions={
          <>
            <AppButton variant="ghost" size="compact" onClick={loadData} disabled={loading}>
              <AppIcon name="refresh" /> Actualizar
            </AppButton>
            <AppButton size="compact" onClick={openCreate}>
              <AppIcon name="plus" /> Nuevo programa
            </AppButton>
          </>
        }
      />

      <AppModal
        isOpen={!!modal}
        onClose={closeModal}
        maxWidth={640}
        title={modal?.mode === 'create' ? 'Nuevo programa' : 'Editar programa'}
        footer={
          <>
            <AppButton variant="ghost" size="compact" onClick={closeModal} disabled={saving}>
              Cancelar
            </AppButton>
            <AppButton size="compact" onClick={handleSave} loading={saving}>
              {modal?.mode === 'create' ? 'Crear programa' : 'Guardar cambios'}
            </AppButton>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', gap: 14 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <FormField label="Área" required>
                <SearchableSelect
                  size="sm"
                  value={form.id_area}
                  placeholder="Seleccionar área"
                  options={areas.map(a => ({ value: a.id_area, label: a.nombre }))}
                  onChange={v => set('id_area', v)}
                />
              </FormField>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <FormField label="Nivel de formación" required>
                <AppSelect size="sm" value={form.nivel_formacion}
                  onChange={e => set('nivel_formacion', e.target.value)}>
                  <option value="">Seleccionar nivel</option>
                  {NIVEL_OPTS.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </AppSelect>
              </FormField>
            </div>
          </div>

          <FormField label="Nombre" required>
            <AppInput size="sm" value={form.nombre} placeholder="Ej. Análisis y Desarrollo de Software"
              onChange={e => set('nombre', e.target.value)} />
          </FormField>

          <FormField label="Código del programa" required>
            <AppInput size="sm" value={form.codigo_programa} placeholder="Ej. 2874590"
              onChange={e => set('codigo_programa', e.target.value)} />
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

      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Eliminar programa"
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
