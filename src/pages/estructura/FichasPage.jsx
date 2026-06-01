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
import { AppIcon }        from '../../components/atoms/AppIcon'
const JORNADA_OPTS = [
  { value: 'manana',    label: 'Mañana' },
  { value: 'tarde',     label: 'Tarde' },
  { value: 'nocturna',  label: 'Nocturna' },
]

const ESTADO_FICHA_OPTS = [
  { value: 'en formacion', label: 'En formación' },
  { value: 'terminada',    label: 'Terminada' },
  { value: 'cancelada',    label: 'Cancelada' },
]

const EMPTY_FORM = {
  id_programa: '', codigo_ficha: '', fecha_inicio: '', fecha_fin: '', jornada: '', estado: 'en formacion',
}

export function FichasPage() {
  const [fichas, setFichas] = useState([])
  const [programas, setProgramas] = useState([])
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
      const [fichasRes, progRes] = await Promise.all([
        api.get('/ficha'),
        api.get('/programa'),
      ])
      setFichas(fichasRes.data)
      setProgramas(progRes.data)
    } catch {
      setError('No se pudo cargar la información. Verifica tu conexión.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const programaMap = Object.fromEntries(
    programas.map(p => [p.id_programa, p.nombre])
  )

  const jornadaLabel = Object.fromEntries(
    JORNADA_OPTS.map(o => [o.value, o.label])
  )

  const estadoLabel = Object.fromEntries(
    ESTADO_FICHA_OPTS.map(o => [o.value, o.label])
  )

  function formatDate(iso) {
    if (!iso) return '—'
    const d = new Date(iso)
    return d.toLocaleDateString('es-CO', { year: 'numeric', month: '2-digit', day: '2-digit' })
  }

  function toDateInputValue(iso) {
    if (!iso) return ''
    return iso.slice(0, 10)
  }

  const openCreate = () => {
    setForm({ ...EMPTY_FORM })
    setFormError(null)
    setModal({ mode: 'create' })
  }

  const openEdit = (f) => {
    setForm({
      id_programa: String(f.id_programa), codigo_ficha: f.codigo_ficha,
      fecha_inicio: toDateInputValue(f.fecha_inicio), fecha_fin: toDateInputValue(f.fecha_fin),
      jornada: f.jornada, estado: f.estado,
    })
    setFormError(null)
    setModal({ mode: 'edit', data: f })
  }

  const closeModal = () => { setModal(null); setFormError(null) }

  const handleSave = async () => {
    if (!form.id_programa || !form.codigo_ficha || !form.fecha_inicio || !form.fecha_fin || !form.jornada) {
      setFormError('Todos los campos obligatorios deben estar llenos.')
      return
    }
    setSaving(true)
    setFormError(null)
    try {
      if (modal.mode === 'create') {
        await api.post('/ficha', form)
      } else {
        await api.patch(`/ficha/${modal.data.id_ficha}`, form)
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
      await api.delete(`/ficha/${deleteTarget.id_ficha}`)
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
    await Promise.all(ids.map(id => api.delete(`/ficha/${id}`)))
    loadData()
  }

  const columns = [
    {
      key: 'id_ficha',
      header: 'ID',
      copyable: true,
      truncateAt: 8,
      searchable: false,
      width: 110,
    },
    {
      key: 'codigo_ficha',
      header: 'Código',
      render: (f) => (
        <span style={{ fontWeight: 500, color: '#111827' }}>
          {f.codigo_ficha}
        </span>
      ),
    },
    {
      key: 'id_programa',
      header: 'Programa',
      render: (f) => programaMap[f.id_programa] ?? <span style={{ color: '#9CA3AF' }}>—</span>,
    },
    {
      key: 'fecha_inicio',
      header: 'Inicio',
      render: (f) => formatDate(f.fecha_inicio),
    },
    {
      key: 'fecha_fin',
      header: 'Fin',
      render: (f) => formatDate(f.fecha_fin),
    },
    {
      key: 'jornada',
      header: 'Jornada',
      render: (f) => jornadaLabel[f.jornada] ?? <span style={{ color: '#9CA3AF' }}>—</span>,
    },
    {
      key: 'estado',
      header: 'Estado',
      render: (f) => {
        const v = f.estado === 'en formacion' ? 'warning'
                : f.estado === 'terminada'    ? 'success'
                : 'default'
        return <Badge variant={v}>{estadoLabel[f.estado] ?? f.estado}</Badge>
      },
    },
    {
      key: 'acciones',
      header: '',
      align: 'right',
      width: 90,
      render: (f) => (
        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
          <IconButton variant="edit" title="Editar" onClick={() => openEdit(f)}>
            <AppIcon name="edit" size={15} />
          </IconButton>
          <IconButton variant="delete" title="Eliminar" onClick={() => setDeleteTarget(f)}>
            <AppIcon name="trash" size={15} />
          </IconButton>
        </div>
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        title="Fichas"
        description="Gestión de fichas de los programas de formación del SENA"
      />

      <DataTable
        columns={columns}
        data={fichas}
        loading={loading}
        error={error}
        onRetry={loadData}
        searchable
        searchPlaceholder="Buscar por código, programa, jornada…"
        pageSize={10}
        selectable
        onBulkDelete={handleBulkDelete}
        emptyTitle="Sin fichas"
        emptyDescription="Crea la primera ficha."
        emptyAction={
          <AppButton size="compact" onClick={openCreate}>
            <AppIcon name="plus" /> Nueva ficha
          </AppButton>
        }
        actions={
          <>
            <AppButton variant="ghost" size="compact" onClick={loadData} disabled={loading}>
              <AppIcon name="refresh" /> Actualizar
            </AppButton>
            <AppButton size="compact" onClick={openCreate}>
              <AppIcon name="plus" /> Nueva ficha
            </AppButton>
          </>
        }
      />

      <AppModal
        isOpen={!!modal}
        onClose={closeModal}
        title={modal?.mode === 'create' ? 'Nueva ficha' : 'Editar ficha'}
        footer={
          <>
            <AppButton variant="ghost" size="compact" onClick={closeModal} disabled={saving}>
              Cancelar
            </AppButton>
            <AppButton size="compact" onClick={handleSave} loading={saving}>
              {modal?.mode === 'create' ? 'Crear ficha' : 'Guardar cambios'}
            </AppButton>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', gap: 14 }}>
            <div style={{ flex: 1 }}>
              <FormField label="Programa" required>
                <AppSelect size="sm" value={form.id_programa}
                  onChange={e => set('id_programa', e.target.value)}>
                  <option value="">Seleccionar programa</option>
                  {programas.map(p => (
                    <option key={p.id_programa} value={p.id_programa}>{p.nombre}</option>
                  ))}
                </AppSelect>
              </FormField>
            </div>
            <div style={{ flex: 1 }}>
              <FormField label="Código de ficha" required>
                <AppInput size="sm" value={form.codigo_ficha} placeholder="Ej. 2874590"
                  onChange={e => set('codigo_ficha', e.target.value)} />
              </FormField>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 14 }}>
            <div style={{ flex: 1 }}>
              <FormField label="Fecha de inicio" required>
                <AppInput size="sm" type="date" value={form.fecha_inicio}
                  onChange={e => set('fecha_inicio', e.target.value)} />
              </FormField>
            </div>
            <div style={{ flex: 1 }}>
              <FormField label="Fecha de fin" required>
                <AppInput size="sm" type="date" value={form.fecha_fin}
                  onChange={e => set('fecha_fin', e.target.value)} />
              </FormField>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 14 }}>
            <div style={{ flex: 1 }}>
              <FormField label="Jornada" required>
                <AppSelect size="sm" value={form.jornada}
                  onChange={e => set('jornada', e.target.value)}>
                  <option value="">Seleccionar jornada</option>
                  {JORNADA_OPTS.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </AppSelect>
              </FormField>
            </div>
            <div style={{ flex: 1 }}>
              <FormField label="Estado" required>
                <AppSelect size="sm" value={form.estado}
                  onChange={e => set('estado', e.target.value)}>
                  {ESTADO_FICHA_OPTS.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </AppSelect>
              </FormField>
            </div>
          </div>

          {formError && <AlertBanner variant="error">{formError}</AlertBanner>}
        </div>
      </AppModal>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Eliminar ficha"
        description={
          deleteTarget
            ? <>¿Eliminar la ficha <strong>{deleteTarget.codigo_ficha}</strong>? Esta acción no se puede deshacer.</>
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
