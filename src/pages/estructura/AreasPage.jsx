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
  id_sede: '', id_usuario: '', nombre: '', descripcion: '', estado: 'activo',
}

export function AreasPage() {
  const [areas, setAreas] = useState([])
  const [sedes, setSedes] = useState([])
  const [usuarios, setUsuarios] = useState([])
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
      const [areasRes, sedesRes, usuariosRes] = await Promise.all([
        api.get('/area'),
        api.get('/sede'),
        api.get('/usuario'),
      ])
      setAreas(areasRes.data)
      setSedes(sedesRes.data)
      setUsuarios(usuariosRes.data)
    } catch {
      setError('No se pudo cargar la información. Verifica tu conexión.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const sedeMap = Object.fromEntries(
    sedes.map(s => [s.id_sede, s.nombre])
  )

  const usuarioMap = Object.fromEntries(
    usuarios.map(u => [u.id, `${u.nombres} ${u.apellidos}`])
  )

  const openCreate = () => {
    setForm({ ...EMPTY_FORM })
    setFormError(null)
    setModal({ mode: 'create' })
  }

  const openEdit = (a) => {
    setForm({
      id_sede: a.id_sede, id_usuario: a.id_usuario,
      nombre: a.nombre, descripcion: a.descripcion, estado: a.estado,
    })
    setFormError(null)
    setModal({ mode: 'edit', data: a })
  }

  const closeModal = () => { setModal(null); setFormError(null) }

  const handleSave = async () => {
    if (!form.nombre || !form.descripcion || !form.id_sede || !form.id_usuario) {
      setFormError('Todos los campos obligatorios deben estar llenos.')
      return
    }
    setSaving(true)
    setFormError(null)
    try {
      if (modal.mode === 'create') {
        await api.post('/area', form)
      } else {
        await api.patch(`/area/${modal.data.id_area}`, form)
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
      await api.delete(`/area/${deleteTarget.id_area}`)
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
    await Promise.all(ids.map(id => api.delete(`/area/${id}`)))
    loadData()
  }

  const columns = [
    {
      key: 'id_area',
      header: 'ID',
      copyable: true,
      truncateAt: 8,
      searchable: false,
      width: 110,
    },
    {
      key: 'nombre',
      header: 'Nombre',
      render: (a) => (
        <span style={{ fontWeight: 500, color: '#111827' }}>
          {a.nombre}
        </span>
      ),
    },
    {
      key: 'id_sede',
      header: 'Sede',
      render: (a) => sedeMap[a.id_sede] ?? <span style={{ color: '#9CA3AF' }}>—</span>,
    },
    {
      key: 'id_usuario',
      header: 'Responsable',
      render: (a) => usuarioMap[a.id_usuario] ?? <span style={{ color: '#9CA3AF' }}>—</span>,
    },
    { key: 'descripcion', header: 'Descripción' },
    {
      key: 'estado',
      header: 'Estado',
      render: (a) => (
        <Badge variant={a.estado === 'activo' ? 'success' : 'default'}>
          {a.estado === 'activo' ? 'Activo' : 'Inactivo'}
        </Badge>
      ),
    },
    {
      key: 'acciones',
      header: '',
      align: 'right',
      width: 90,
      render: (a) => (
        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
          <IconButton variant="edit" title="Editar" onClick={() => openEdit(a)}>
            <EditIcon />
          </IconButton>
          <IconButton variant="delete" title="Eliminar" onClick={() => setDeleteTarget(a)}>
            <TrashIcon />
          </IconButton>
        </div>
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        title="Áreas"
        description="Gestión de áreas de las sedes del SENA"
      />

      <DataTable
        columns={columns}
        data={areas}
        loading={loading}
        error={error}
        onRetry={loadData}
        searchable
        searchPlaceholder="Buscar por nombre, sede, responsable…"
        pageSize={10}
        selectable
        onBulkDelete={handleBulkDelete}
        emptyTitle="Sin áreas"
        emptyDescription="Crea la primera área."
        emptyAction={
          <AppButton size="compact" onClick={openCreate}>
            <PlusIcon /> Nueva área
          </AppButton>
        }
        actions={
          <>
            <AppButton variant="ghost" size="compact" onClick={loadData} disabled={loading}>
              <RefreshIcon /> Actualizar
            </AppButton>
            <AppButton size="compact" onClick={openCreate}>
              <PlusIcon /> Nueva área
            </AppButton>
          </>
        }
      />

      <AppModal
        isOpen={!!modal}
        onClose={closeModal}
        title={modal?.mode === 'create' ? 'Nueva área' : 'Editar área'}
        footer={
          <>
            <AppButton variant="ghost" size="compact" onClick={closeModal} disabled={saving}>
              Cancelar
            </AppButton>
            <AppButton size="compact" onClick={handleSave} loading={saving}>
              {modal?.mode === 'create' ? 'Crear área' : 'Guardar cambios'}
            </AppButton>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', gap: 14 }}>
            <FormField label="Sede" required>
              <AppSelect size="sm" value={form.id_sede}
                onChange={e => set('id_sede', e.target.value)}>
                <option value="">Seleccionar sede</option>
                {sedes.map(s => (
                  <option key={s.id_sede} value={s.id_sede}>{s.nombre}</option>
                ))}
              </AppSelect>
            </FormField>

            <FormField label="Responsable" required>
              <AppSelect size="sm" value={form.id_usuario}
                onChange={e => set('id_usuario', e.target.value)}>
                <option value="">Seleccionar usuario</option>
                {usuarios.map(u => (
                  <option key={u.id} value={u.id}>{u.nombres} {u.apellidos}</option>
                ))}
              </AppSelect>
            </FormField>
          </div>

          <FormField label="Nombre" required>
            <AppInput size="sm" value={form.nombre} placeholder="Ej. Área de Sistemas"
              onChange={e => set('nombre', e.target.value)} />
          </FormField>

          <FormField label="Descripción" required>
            <AppInput size="sm" value={form.descripcion} placeholder="Ej. Encargada de la infraestructura tecnológica"
              onChange={e => set('descripcion', e.target.value)} />
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
        title="Eliminar área"
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
