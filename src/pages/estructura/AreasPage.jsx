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
import { groupUsersByRole }  from '../../utils/userGroups'
const EMPTY_FORM = {
  id_sede: '', id_usuario: '', nombre: '', descripcion: '', estado: 'activo',
}

export function AreasPage() {
  const [areas, setAreas] = useState([])
  const [sedes, setSedes] = useState([])
  const [usuarios, setUsuarios] = useState([])
  const [roles, setRoles] = useState([])
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
      const [areasRes, sedesRes, usuariosRes, rolesRes] = await Promise.all([
        api.get('/area'),
        api.get('/sede'),
        api.get('/usuario'),
        api.get('/rol'),
      ])
      setAreas(areasRes.data)
      setSedes(sedesRes.data)
      setUsuarios(usuariosRes.data)
      setRoles(rolesRes.data)
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
    setModal({ mode: 'create' })
  }

  const openEdit = (a) => {
    setForm({
      id_sede: a.id_sede, id_usuario: a.id_usuario,
      nombre: a.nombre, descripcion: a.descripcion, estado: a.estado,
    })
    setModal({ mode: 'edit', data: a })
  }

  const closeModal = () => { setModal(null) }

  const handleSave = async () => {
    if (!form.nombre || !form.descripcion || !form.id_sede || !form.id_usuario) {
      showToast('error', 'Todos los campos obligatorios deben estar llenos.')
      return
    }
    setSaving(true)
    try {
      if (modal.mode === 'create') {
        await api.post('/area', form)
        showToast('success', 'Área creada correctamente.')
      } else {
        await api.patch(`/area/${modal.data.id_area}`, form)
        showToast('success', 'Área actualizada correctamente.')
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
      await api.delete(`/area/${deleteTarget.id_area}`)
      showToast('success', 'Área eliminada correctamente.')
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
            <AppIcon name="edit" size={15} />
          </IconButton>
          <IconButton variant="delete" title="Eliminar" onClick={() => setDeleteTarget(a)}>
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
            <AppIcon name="plus" /> Nueva área
          </AppButton>
        }
        actions={
          <>
            <AppButton variant="ghost" size="compact" onClick={loadData} disabled={loading}>
              <AppIcon name="refresh" /> Actualizar
            </AppButton>
            <AppButton size="compact" onClick={openCreate}>
              <AppIcon name="plus" /> Nueva área
            </AppButton>
          </>
        }
      />

      <AppModal
        isOpen={!!modal}
        onClose={closeModal}
        maxWidth={640}
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
            <div style={{ flex: 1, minWidth: 0 }}>
              <FormField label="Sede" required>
                <SearchableSelect
                  size="sm"
                  value={form.id_sede}
                  placeholder="Seleccionar sede"
                  options={sedes.map(s => ({ value: s.id_sede, label: s.nombre }))}
                  onChange={v => set('id_sede', v)}
                />
              </FormField>
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <FormField label="Responsable" required>
                <SearchableSelect
                  size="sm"
                  value={form.id_usuario}
                  placeholder="Seleccionar usuario"
                  options={groupUsersByRole(usuarios, roles)}
                  onChange={v => set('id_usuario', v)}
                />
              </FormField>
            </div>
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
    </>
  )
}
