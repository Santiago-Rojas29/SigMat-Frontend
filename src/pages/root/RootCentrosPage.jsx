import { useState, useEffect, useCallback } from 'react'
import api from '../../services/api'
import { AppButton }       from '../../components/atoms/AppButton'
import { AppInput }        from '../../components/atoms/AppInput'
import { AppSelect }       from '../../components/atoms/AppSelect'
import { Badge }           from '../../components/atoms/Badge'
import { IconButton }      from '../../components/atoms/IconButton'
import { FormField }       from '../../components/molecules/FormField'
import { PageHeader }      from '../../components/molecules/PageHeader'
import { useToast }        from '../../hooks/useToast'
import { ConfirmDialog }   from '../../components/molecules/ConfirmDialog'
import { AppModal }        from '../../components/organisms/AppModal'
import { DataTable }       from '../../components/organisms/DataTable'
import { AppIcon }         from '../../components/atoms/AppIcon'

const EMPTY = { nombre: '', ciudad: '', direccion: '', telefono: '', estado: 'activo' }

export function RootCentrosPage() {
  const [centros,  setCentros]  = useState([])
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState(null)
  const [modal,    setModal]    = useState(null)
  const [form,     setForm]     = useState(EMPTY)
  const [saving,   setSaving]   = useState(false)
  const [del,      setDel]      = useState(null)
  const [deleting, setDeleting] = useState(false)
  const { showToast, toastPortal } = useToast()

  const load = useCallback(async () => {
    setLoading(true); setError(null)
    try { setCentros((await api.get('/centro')).data) }
    catch { setError('Error al cargar centros.') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const handleSave = async () => {
    setSaving(true)
    try {
      if (modal.mode === 'create') {
        await api.post('/centro', form)
        showToast('success', 'Centro creado correctamente.')
      } else {
        await api.patch(`/centro/${modal.data.id}`, form)
        showToast('success', 'Centro actualizado correctamente.')
      }
      setModal(null); load()
    } catch (e) {
      showToast('error', e.response?.data?.message ?? 'Error al guardar.')
    } finally { setSaving(false) }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await api.delete(`/centro/${del.id}`)
      showToast('success', 'Centro eliminado correctamente.')
      setDel(null); load()
    } catch (e) {
      showToast('error', e.response?.data?.message ?? 'Error al eliminar.')
    } finally { setDeleting(false) }
  }

  const columns = [
    { key: 'id', header: 'ID', copyable: true, truncateAt: 8, searchable: false, width: 110 },
    { key: 'nombre', header: 'Nombre', render: c => <span style={{ fontWeight: 500 }}>{c.nombre}</span> },
    { key: 'ciudad', header: 'Ciudad' },
    { key: 'direccion', header: 'Dirección' },
    { key: 'telefono', header: 'Teléfono' },
    { key: 'estado', header: 'Estado', render: c => <Badge variant={c.estado === 'activo' ? 'success' : 'default'}>{c.estado === 'activo' ? 'Activo' : 'Inactivo'}</Badge> },
    {
      key: 'acc', header: '', align: 'right', width: 90, searchable: false,
      render: c => (
        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
          <IconButton variant="edit" onClick={() => { setForm({ nombre: c.nombre, ciudad: c.ciudad, direccion: c.direccion, telefono: c.telefono, estado: c.estado }); setModal({ mode: 'edit', data: c }) }}>
            <AppIcon name="edit" size={15} />
          </IconButton>
          <IconButton variant="delete" onClick={() => setDel(c)}><AppIcon name="trash" size={15} /></IconButton>
        </div>
      ),
    },
  ]

  return (
    <>
      {toastPortal}
      <PageHeader title="Centros de Formación" description="Gestión de centros del SENA a nivel nacional." />
      <DataTable
        columns={columns} data={centros} loading={loading} error={error} onRetry={load}
        searchable searchPlaceholder="Buscar centro…" pageSize={10}
        emptyTitle="Sin centros" emptyDescription="Crea el primer centro."
        actions={
          <>
            <AppButton variant="ghost" size="compact" onClick={load}><AppIcon name="refresh" /> Actualizar</AppButton>
            <AppButton size="compact" onClick={() => { setForm(EMPTY); setModal({ mode: 'create' }) }}><AppIcon name="plus" /> Nuevo centro</AppButton>
          </>
        }
      />
      <AppModal isOpen={!!modal} onClose={() => setModal(null)} maxWidth={520}
        title={modal?.mode === 'create' ? 'Nuevo centro' : 'Editar centro'}
        footer={<><AppButton variant="ghost" size="compact" onClick={() => setModal(null)}>Cancelar</AppButton><AppButton size="compact" onClick={handleSave} loading={saving}>{modal?.mode === 'create' ? 'Crear' : 'Guardar'}</AppButton></>}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <FormField label="Nombre" required><AppInput size="sm" value={form.nombre} onChange={e => set('nombre', e.target.value)} /></FormField>
          <FormField label="Ciudad" required><AppInput size="sm" value={form.ciudad} onChange={e => set('ciudad', e.target.value)} /></FormField>
          <FormField label="Dirección" required><AppInput size="sm" value={form.direccion} onChange={e => set('direccion', e.target.value)} /></FormField>
          <div style={{ display: 'flex', gap: 14 }}>
            <FormField label="Teléfono" required><AppInput size="sm" value={form.telefono} onChange={e => set('telefono', e.target.value)} /></FormField>
            <FormField label="Estado"><AppSelect size="sm" value={form.estado} onChange={e => set('estado', e.target.value)}><option value="activo">Activo</option><option value="inactivo">Inactivo</option></AppSelect></FormField>
          </div>
        </div>
      </AppModal>
      <ConfirmDialog isOpen={!!del} title="Eliminar centro" description={del ? <>¿Eliminar <strong>{del.nombre}</strong>?</> : null} confirmLabel="Eliminar" onConfirm={handleDelete} onCancel={() => setDel(null)} loading={deleting} />
    </>
  )
}
