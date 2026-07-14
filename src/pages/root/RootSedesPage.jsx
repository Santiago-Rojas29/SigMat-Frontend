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

const EMPTY = { id_centro: '', nombre: '', direccion: '', telefono: '', estado: 'activo' }

export function RootSedesPage() {
  const [sedes,    setSedes]    = useState([])
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
    try {
      const [sRes, cRes] = await Promise.all([api.get('/sede'), api.get('/centro')])
      setSedes(sRes.data); setCentros(cRes.data)
    } catch { setError('Error al cargar sedes.') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))
  const centroMap = Object.fromEntries(centros.map(c => [c.id, c.nombre]))

  const handleSave = async () => {
    setSaving(true)
    try {
      if (modal.mode === 'create') {
        await api.post('/sede', form)
        showToast('success', 'Sede creada correctamente.')
      } else {
        await api.patch(`/sede/${modal.data.id_sede}`, form)
        showToast('success', 'Sede actualizada correctamente.')
      }
      setModal(null); load()
    } catch (e) {
      showToast('error', e.response?.data?.message ?? 'Error al guardar.')
    } finally { setSaving(false) }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await api.delete(`/sede/${del.id_sede}`)
      showToast('success', 'Sede eliminada correctamente.')
      setDel(null); load()
    } catch (e) {
      showToast('error', e.response?.data?.message ?? 'Error al eliminar.')
    } finally { setDeleting(false) }
  }

  const columns = [
    { key: 'id_sede', header: 'ID', copyable: true, truncateAt: 8, searchable: false, width: 110 },
    { key: 'nombre', header: 'Nombre', render: s => <span style={{ fontWeight: 500 }}>{s.nombre}</span> },
    { key: 'id_centro', header: 'Centro', render: s => centroMap[s.id_centro] ?? '—' },
    { key: 'direccion', header: 'Dirección' },
    { key: 'telefono', header: 'Teléfono' },
    { key: 'estado', header: 'Estado', render: s => <Badge variant={s.estado === 'activo' ? 'success' : 'default'}>{s.estado === 'activo' ? 'Activo' : 'Inactivo'}</Badge> },
    {
      key: 'acc', header: '', align: 'right', width: 90, searchable: false,
      render: s => (
        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
          <IconButton variant="edit" onClick={() => { setForm({ id_centro: s.id_centro, nombre: s.nombre, direccion: s.direccion, telefono: s.telefono, estado: s.estado }); setModal({ mode: 'edit', data: s }) }}>
            <AppIcon name="edit" size={15} />
          </IconButton>
          <IconButton variant="delete" onClick={() => setDel(s)}><AppIcon name="trash" size={15} /></IconButton>
        </div>
      ),
    },
  ]

  return (
    <>
      {toastPortal}
      <PageHeader title="Sedes" description="Gestión de sedes dentro de cada centro de formación." />
      <DataTable
        columns={columns} data={sedes} rowKey="id_sede" loading={loading} error={error} onRetry={load}
        searchable searchPlaceholder="Buscar sede…" pageSize={10}
        emptyTitle="Sin sedes" emptyDescription="Crea la primera sede."
        actions={
          <>
            <AppButton variant="ghost" size="compact" onClick={load}><AppIcon name="refresh" /> Actualizar</AppButton>
            <AppButton size="compact" onClick={() => { setForm(EMPTY); setModal({ mode: 'create' }) }}><AppIcon name="plus" /> Nueva sede</AppButton>
          </>
        }
      />
      <AppModal isOpen={!!modal} onClose={() => setModal(null)} maxWidth={520}
        title={modal?.mode === 'create' ? 'Nueva sede' : 'Editar sede'}
        footer={<><AppButton variant="ghost" size="compact" onClick={() => setModal(null)}>Cancelar</AppButton><AppButton size="compact" onClick={handleSave} loading={saving}>{modal?.mode === 'create' ? 'Crear' : 'Guardar'}</AppButton></>}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <FormField label="Centro" required>
            <SearchableSelect size="sm" value={form.id_centro} placeholder="Seleccionar centro"
              options={centros.map(c => ({ value: c.id, label: c.nombre }))} onChange={v => set('id_centro', v)} />
          </FormField>
          <FormField label="Nombre" required><AppInput size="sm" value={form.nombre} onChange={e => set('nombre', e.target.value)} /></FormField>
          <FormField label="Dirección" required><AppInput size="sm" value={form.direccion} onChange={e => set('direccion', e.target.value)} /></FormField>
          <div style={{ display: 'flex', gap: 14 }}>
            <FormField label="Teléfono" required><AppInput size="sm" value={form.telefono} onChange={e => set('telefono', e.target.value)} /></FormField>
            <FormField label="Estado"><AppSelect size="sm" value={form.estado} onChange={e => set('estado', e.target.value)}><option value="activo">Activo</option><option value="inactivo">Inactivo</option></AppSelect></FormField>
          </div>
        </div>
      </AppModal>
      <ConfirmDialog isOpen={!!del} title="Eliminar sede" description={del ? <>¿Eliminar <strong>{del.nombre}</strong>?</> : null} confirmLabel="Eliminar" onConfirm={handleDelete} onCancel={() => setDel(null)} loading={deleting} />
    </>
  )
}
