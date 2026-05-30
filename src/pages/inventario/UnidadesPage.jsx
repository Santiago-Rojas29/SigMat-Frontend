import { useState, useEffect, useCallback, useMemo } from 'react'
import api from '../../services/api'
import { AppButton }     from '../../components/atoms/AppButton'
import { AppInput }      from '../../components/atoms/AppInput'
import { AppSelect }     from '../../components/atoms/AppSelect'
import { Badge }         from '../../components/atoms/Badge'
import { IconButton }    from '../../components/atoms/IconButton'
import { FormField }     from '../../components/molecules/FormField'
import { PageHeader }    from '../../components/molecules/PageHeader'
import { AlertBanner }   from '../../components/molecules/AlertBanner'
import { ConfirmDialog } from '../../components/molecules/ConfirmDialog'
import { AppModal }      from '../../components/organisms/AppModal'
import { DataTable }     from '../../components/organisms/DataTable'

function Ic({ size = 16, children }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {children}
    </svg>
  )
}

const PlusIcon    = () => <Ic><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></Ic>
const RefreshIcon = () => <Ic><path d="M23 4v6h-6"/><path d="M1 20v-6h6"/><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/></Ic>
const EditIcon    = () => <Ic size={15}><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></Ic>
const TrashIcon   = () => <Ic size={15}><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/></Ic>

const ESTADOS = {
  disponible:        { label: 'Disponible',       variant: 'success'  },
  prestado:          { label: 'Prestado',          variant: 'info'     },
  danado:            { label: 'Dañado',            variant: 'danger'   },
  'en mantenimiento':{ label: 'En mantenimiento',  variant: 'warning'  },
  perdido:           { label: 'Perdido',           variant: 'default'  },
}

const ESTADOS_OPTIONS = Object.entries(ESTADOS).map(([value, { label }]) => ({ value, label }))

const CARDS = [
  { key: null,              label: 'Todos',            color: '#111827', bg: '#fff',    border: '#e5e7eb', paths: <><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></> },
  { key: 'disponible',      label: 'Disponibles',      color: '#39A900', bg: '#f0fdf4', border: '#bbf7d0', paths: <><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></> },
  { key: 'prestado',        label: 'Prestados',        color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe', paths: <><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></> },
  { key: 'en mantenimiento',label: 'Mantenimiento',    color: '#d97706', bg: '#fffbeb', border: '#fde68a', paths: <><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 010 14.14M4.93 4.93a10 10 0 000 14.14"/></> },
  { key: 'danado',          label: 'Dañados',          color: '#dc2626', bg: '#fef2f2', border: '#fecaca', paths: <><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></> },
  { key: 'perdido',         label: 'Perdidos',         color: '#6b7280', bg: '#f9fafb', border: '#e5e7eb', paths: <><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></> },
]

const EMPTY_FORM = {
  id_material: '', id_responsable: '', id_ubicacion: '',
  codigo_unidad: '', estado: 'disponible',
}

const CSS = `.unidad-card { transition: all 0.15s; cursor: pointer; border: none; text-align: left; }
.unidad-card:hover { filter: brightness(0.96); transform: translateY(-1px); }`

export function UnidadesPage() {
  const [unidades,    setUnidades]    = useState([])
  const [materiales,  setMateriales]  = useState([])
  const [usuarios,    setUsuarios]    = useState([])
  const [ubicaciones, setUbicaciones] = useState([])
  const [loading,     setLoading]     = useState(true)
  const [error,       setError]       = useState(null)
  const [filtro,      setFiltro]      = useState(null)

  const [modal,        setModal]        = useState(null)
  const [form,         setForm]         = useState(EMPTY_FORM)
  const [saving,       setSaving]       = useState(false)
  const [formError,    setFormError]    = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting,     setDeleting]     = useState(false)

  const loadData = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const [uRes, mRes, usRes, ubRes] = await Promise.all([
        api.get('/unidad'),
        api.get('/material'),
        api.get('/usuario'),
        api.get('/ubicacion'),
      ])
      setUnidades(uRes.data)
      setMateriales(mRes.data)
      setUsuarios(usRes.data)
      setUbicaciones(ubRes.data)
    } catch { setError('No se pudo cargar la información.') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const unidadesRicas = useMemo(() => unidades.map(u => ({
    ...u,
    _material:    materiales.find(m => m.id === u.id_material),
    _responsable: usuarios.find(us => us.id === u.id_responsable),
    _ubicacion:   ubicaciones.find(ub => ub.id === u.id_ubicacion),
  })), [unidades, materiales, usuarios, ubicaciones])

  const counts = useMemo(() => {
    const base = { total: unidadesRicas.length }
    CARDS.filter(c => c.key !== null).forEach(c => {
      base[c.key] = unidadesRicas.filter(u => u.estado === c.key).length
    })
    return base
  }, [unidadesRicas])

  const datosTabla = useMemo(() => {
    if (!filtro) return unidadesRicas
    return unidadesRicas.filter(u => u.estado === filtro)
  }, [unidadesRicas, filtro])

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))
  const materialesNoConsumibles = materiales.filter(m => m.categoria === 'no consumible')

  const openCreate = () => {
    setForm({
      ...EMPTY_FORM,
      id_material:   materialesNoConsumibles[0]?.id ?? '',
      id_responsable:usuarios[0]?.id ?? '',
      id_ubicacion:  ubicaciones[0]?.id ?? '',
    })
    setFormError(null)
    setModal({ mode: 'create' })
  }

  const openEdit = (u) => {
    setForm({
      id_material:   u.id_material,
      id_responsable:u.id_responsable,
      id_ubicacion:  u.id_ubicacion,
      codigo_unidad: u.codigo_unidad,
      estado:        u.estado,
    })
    setFormError(null)
    setModal({ mode: 'edit', data: u })
  }

  const closeModal = () => { setModal(null); setFormError(null) }

  const handleSave = async () => {
    setSaving(true); setFormError(null)
    try {
      if (modal.mode === 'create') {
        await api.post('/unidad', form)
      } else {
        await api.patch(`/unidad/${modal.data.id_unidad}`, form)
      }
      closeModal(); loadData()
    } catch (e) {
      const msg = e.response?.data?.message
      setFormError(Array.isArray(msg) ? msg.join(', ') : (msg ?? 'Error al guardar.'))
    } finally { setSaving(false) }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await api.delete(`/unidad/${deleteTarget.id_unidad}`)
      setDeleteTarget(null); loadData()
    } catch (e) {
      const msg = e.response?.data?.message
      setFormError(Array.isArray(msg) ? msg.join(', ') : (msg ?? 'Error al eliminar.'))
    } finally { setDeleting(false) }
  }

  const handleBulkDelete = async (ids) => {
    await Promise.all(ids.map(id => api.delete(`/unidad/${id}`)))
    loadData()
  }

  const columns = [
    { key: 'id_unidad', header: 'ID', copyable: true, truncateAt: 8, searchable: false, width: 110 },
    {
      key: 'codigo_unidad',
      header: 'Código / Placa',
      width: 150,
      render: (u) => (
        <code style={{ fontSize: 12.5, background: '#f3f4f6', padding: '3px 8px', borderRadius: 5, color: '#374151', fontWeight: 600 }}>
          {u.codigo_unidad}
        </code>
      ),
    },
    {
      key: 'material',
      header: 'Material',
      render: (u) => (
        <span style={{ fontWeight: 600, color: '#111827' }}>
          {u._material?.nombre ?? <span style={{ color: '#9ca3af' }}>—</span>}
        </span>
      ),
    },
    {
      key: 'estado',
      header: 'Estado',
      width: 150,
      render: (u) => {
        const e = ESTADOS[u.estado]
        return <Badge variant={e?.variant ?? 'default'}>{e?.label ?? u.estado}</Badge>
      },
    },
    {
      key: 'responsable',
      header: 'Responsable',
      render: (u) => {
        const r = u._responsable
        return r
          ? <span style={{ color: '#374151' }}>{r.nombres} {r.apellidos}</span>
          : <span style={{ color: '#9ca3af' }}>—</span>
      },
    },
    {
      key: 'ubicacion',
      header: 'Ubicación',
      render: (u) => (
        <span style={{ color: '#374151' }}>{u._ubicacion?.nombre ?? '—'}</span>
      ),
    },
    {
      key: 'acciones',
      header: '',
      align: 'right',
      width: 90,
      render: (u) => (
        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
          <IconButton variant="edit"   title="Editar"   onClick={() => openEdit(u)}><EditIcon /></IconButton>
          <IconButton variant="delete" title="Eliminar" onClick={() => setDeleteTarget(u)}><TrashIcon /></IconButton>
        </div>
      ),
    },
  ]

  return (
    <div>
      <style>{CSS}</style>

      <PageHeader title="Unidades" description="Activos físicos registrados por código de placa o serial" />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 10, marginBottom: 24 }}>
        {CARDS.map(card => {
          const isActive = filtro === card.key
          const count    = card.key === null ? counts.total : (counts[card.key] ?? 0)
          return (
            <button
              key={String(card.key)}
              className="unidad-card"
              onClick={() => setFiltro(isActive ? null : card.key)}
              style={{
                background: isActive ? card.color : card.bg,
                border: `2px solid ${isActive ? card.color : card.border}`,
                borderRadius: 14, padding: '14px 16px',
                display: 'flex', alignItems: 'center', gap: 10,
              }}
            >
              <div style={{
                width: 38, height: 38, borderRadius: 10, flexShrink: 0,
                background: isActive ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.05)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <svg width={18} height={18} viewBox="0 0 24 24" fill="none"
                  stroke={isActive ? '#fff' : card.color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  {card.paths}
                </svg>
              </div>
              <div>
                <div style={{ fontSize: 11.5, fontWeight: 600, color: isActive ? 'rgba(255,255,255,0.85)' : '#374151' }}>
                  {card.label}
                </div>
                <div style={{ fontSize: 22, fontWeight: 800, lineHeight: 1.1, color: isActive ? '#fff' : card.color }}>
                  {count}
                </div>
              </div>
            </button>
          )
        })}
      </div>

      <DataTable
        columns={columns}
        data={datosTabla}
        loading={loading}
        error={error}
        onRetry={loadData}
        rowKey="id_unidad"
        searchable
        searchPlaceholder="Buscar por código, material, responsable…"
        pageSize={10}
        selectable
        onBulkDelete={handleBulkDelete}
        emptyTitle="Sin unidades"
        emptyDescription="Registra la primera unidad física de un activo."
        emptyAction={
          <AppButton size="compact" onClick={openCreate}>
            <PlusIcon /> Nueva unidad
          </AppButton>
        }
        actions={
          <>
            <AppButton variant="ghost" size="compact" onClick={loadData} disabled={loading}>
              <RefreshIcon /> Actualizar
            </AppButton>
            <AppButton size="compact" onClick={openCreate}>
              <PlusIcon /> Nueva unidad
            </AppButton>
          </>
        }
      />

      <AppModal
        isOpen={!!modal}
        onClose={closeModal}
        title={modal?.mode === 'create' ? 'Nueva unidad' : `Editar unidad — ${modal?.data?.codigo_unidad ?? ''}`}
        footer={
          <>
            <AppButton variant="ghost" size="compact" onClick={closeModal} disabled={saving}>Cancelar</AppButton>
            <AppButton size="compact" onClick={handleSave} loading={saving}>
              {modal?.mode === 'create' ? 'Crear unidad' : 'Guardar cambios'}
            </AppButton>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          <FormField label="Material (activo)" required>
            <AppSelect size="sm" value={form.id_material} onChange={e => set('id_material', e.target.value)}>
              <option value="">— Seleccionar material —</option>
              {materialesNoConsumibles.map(m => (
                <option key={m.id} value={m.id}>{m.nombre}</option>
              ))}
            </AppSelect>
          </FormField>

          {materialesNoConsumibles.length === 0 && (
            <AlertBanner variant="warning">
              No hay materiales de tipo "No Consumible" registrados. Crea uno primero en el módulo de Materiales.
            </AlertBanner>
          )}

          <FormField label="Código / Placa / Serial" required>
            <AppInput size="sm" value={form.codigo_unidad} placeholder="Ej. SENA-PC-001, SN-4892736"
              onChange={e => set('codigo_unidad', e.target.value)} />
          </FormField>

          <div style={{ display: 'flex', gap: 14 }}>
            <FormField label="Responsable" required>
              <AppSelect size="sm" value={form.id_responsable} onChange={e => set('id_responsable', e.target.value)}>
                <option value="">— Seleccionar —</option>
                {usuarios.map(u => (
                  <option key={u.id} value={u.id}>{u.nombres} {u.apellidos}</option>
                ))}
              </AppSelect>
            </FormField>
            <FormField label="Ubicación" required>
              <AppSelect size="sm" value={form.id_ubicacion} onChange={e => set('id_ubicacion', e.target.value)}>
                <option value="">— Seleccionar —</option>
                {ubicaciones.map(u => (
                  <option key={u.id} value={u.id}>{u.nombre}</option>
                ))}
              </AppSelect>
            </FormField>
          </div>

          <FormField label="Estado" required>
            <AppSelect size="sm" value={form.estado} onChange={e => set('estado', e.target.value)}>
              {ESTADOS_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </AppSelect>
          </FormField>

          {formError && <AlertBanner variant="error">{formError}</AlertBanner>}
        </div>
      </AppModal>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Eliminar unidad"
        description={
          deleteTarget
            ? <>¿Eliminar la unidad <strong>{deleteTarget.codigo_unidad}</strong>? Esta acción no se puede deshacer.</>
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
