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
  const [formError, setFormError] = useState(null)

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
    setFormError(null)
    setModal({ mode: 'create' })
  }

  const openEdit = (p) => {
    setForm({
      id_area: String(p.id_area), nombre: p.nombre,
      codigo_programa: p.codigo_programa, nivel_formacion: p.nivel_formacion, estado: p.estado,
    })
    setFormError(null)
    setModal({ mode: 'edit', data: p })
  }

  const closeModal = () => { setModal(null); setFormError(null) }

  const handleSave = async () => {
    if (!form.id_area || !form.nombre || !form.codigo_programa || !form.nivel_formacion) {
      setFormError('Todos los campos obligatorios deben estar llenos.')
      return
    }
    setSaving(true)
    setFormError(null)
    try {
      if (modal.mode === 'create') {
        await api.post('/programa', form)
      } else {
        await api.patch(`/programa/${modal.data.id_programa}`, form)
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
      await api.delete(`/programa/${deleteTarget.id_programa}`)
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
            <EditIcon />
          </IconButton>
          <IconButton variant="delete" title="Eliminar" onClick={() => setDeleteTarget(p)}>
            <TrashIcon />
          </IconButton>
        </div>
      ),
    },
  ]

  return (
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
            <PlusIcon /> Nuevo programa
          </AppButton>
        }
        actions={
          <>
            <AppButton variant="ghost" size="compact" onClick={loadData} disabled={loading}>
              <RefreshIcon /> Actualizar
            </AppButton>
            <AppButton size="compact" onClick={openCreate}>
              <PlusIcon /> Nuevo programa
            </AppButton>
          </>
        }
      />

      <AppModal
        isOpen={!!modal}
        onClose={closeModal}
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
            <div style={{ flex: 1 }}>
              <FormField label="Área" required>
                <AppSelect size="sm" value={form.id_area}
                  onChange={e => set('id_area', e.target.value)}>
                  <option value="">Seleccionar área</option>
                  {areas.map(a => (
                    <option key={a.id_area} value={a.id_area}>{a.nombre}</option>
                  ))}
                </AppSelect>
              </FormField>
            </div>
            <div style={{ flex: 1 }}>
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

          {formError && <AlertBanner variant="error">{formError}</AlertBanner>}
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
  )
}
