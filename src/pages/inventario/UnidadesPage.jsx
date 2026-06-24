import { useState, useEffect, useCallback, useMemo } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import api from '../../services/api'
import { AppButton }        from '../../components/atoms/AppButton'
import { AppInput }         from '../../components/atoms/AppInput'
import { AppSelect }        from '../../components/atoms/AppSelect'
import { SearchableSelect } from '../../components/atoms/SearchableSelect'
import { Badge }            from '../../components/atoms/Badge'
import { IconButton }    from '../../components/atoms/IconButton'
import { FormField }     from '../../components/molecules/FormField'
import { PageHeader }    from '../../components/molecules/PageHeader'
import { useToast }      from '../../hooks/useToast'
import { ConfirmDialog } from '../../components/molecules/ConfirmDialog'
import { AppModal }      from '../../components/organisms/AppModal'
import { DataTable }     from '../../components/organisms/DataTable'
import { useAuth }        from '../../context/AuthContext'
import { usePermissions } from '../../context/PermissionsContext'
import { AppIcon }        from '../../components/atoms/AppIcon'
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
  codigo_unidad: '', estado: 'disponible', id_ficha: '',
}


export function UnidadesPage() {
  const { user } = useAuth()
  const { hasPermission } = usePermissions()
  const isAdmin = hasPermission('administracion')
  const [searchParams] = useSearchParams()
  const navigate         = useNavigate()
  const materialFiltroId  = searchParams.get('material')
  const ubicacionFiltroId = searchParams.get('ubicacion')

  const [unidades,    setUnidades]    = useState([])
  const [materiales,  setMateriales]  = useState([])
  const [usuarios,    setUsuarios]    = useState([])
  const [ubicaciones, setUbicaciones] = useState([])
  const [fichas,      setFichas]      = useState([])
  const [tipos,       setTipos]       = useState([])
  const [roles,       setRoles]       = useState([])
  const [solicitudes, setSolicitudes] = useState([])
  const [solUnidades, setSolUnidades] = useState([])
  const [loading,     setLoading]     = useState(true)
  const [error,       setError]       = useState(null)
  const [filtro,      setFiltro]      = useState(null)

  const [modal,        setModal]        = useState(null)
  const [form,         setForm]         = useState(EMPTY_FORM)
  const [saving,       setSaving]       = useState(false)
  const { showToast, toastPortal } = useToast()
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting,     setDeleting]     = useState(false)

  const loadData = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const [uRes, mRes, usRes, ubRes, fRes, tRes, roRes, solRes, suRes] = await Promise.all([
        api.get('/unidad'),
        api.get('/material'),
        api.get('/usuario'),
        api.get('/ubicacion'),
        api.get('/ficha'),
        api.get('/tipo-ubicacion'),
        api.get('/rol'),
        api.get('/solicitud'),
        api.get('/solicitud-unidad'),
      ])
      setUnidades(uRes.data)
      setMateriales(mRes.data)
      setUsuarios(usRes.data)
      setUbicaciones(ubRes.data)
      setFichas(fRes.data)
      setTipos(tRes.data)
      setRoles(roRes.data)
      setSolicitudes(solRes.data)
      setSolUnidades(suRes.data)
    } catch { setError('No se pudo cargar la información.') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const bodegaUbicacionIds = useMemo(() => {
    const bodegaTipoIds = new Set(
      tipos.filter(t => t.nombre?.toLowerCase() === 'bodega').map(t => String(t.id_tipo_ubicacion))
    )
    return new Set(
      ubicaciones.filter(u => bodegaTipoIds.has(String(u.id_tipo_ubicacion))).map(u => String(u.id_ubicacion))
    )
  }, [tipos, ubicaciones])

  const unidadesRicas = useMemo(() => unidades.map(u => ({
    ...u,
    _material:    materiales.find(m => m.id === u.id_material),
    _responsable: usuarios.find(us => us.id === u.id_responsable),
    _ubicacion:   ubicaciones.find(ub => ub.id_ubicacion === u.id_ubicacion),
    _ficha:       fichas.find(f => f.id_ficha === u.id_ficha),
  })), [unidades, materiales, usuarios, ubicaciones, fichas])

  const isBodega = useMemo(() => {
    if (!user) return false
    return roles.find(r => r.id === user.id_rol)?.nombre === 'Responsable de Bodega'
  }, [roles, user])

  const unidadesVisibles = useMemo(() => {
    if (isAdmin) return unidadesRicas
    const misSolIds = new Set(solicitudes.filter(s => s.id_solicitante === user?.id).map(s => s.id_solicitud))
    const misUnidadIds = new Set(solUnidades.filter(su => misSolIds.has(su.id_solicitud)).map(su => su.id_unidad))
    return unidadesRicas.filter(u => misUnidadIds.has(u.id_unidad))
  }, [unidadesRicas, isAdmin, isBodega, user, solicitudes, solUnidades])

  const counts = useMemo(() => {
    const base = { total: unidadesVisibles.length }
    CARDS.filter(c => c.key !== null).forEach(c => {
      base[c.key] = unidadesVisibles.filter(u => u.estado === c.key).length
    })
    return base
  }, [unidadesVisibles])

  const materialFiltro = useMemo(
    () => materiales.find(m => m.id === materialFiltroId) ?? null,
    [materiales, materialFiltroId]
  )

  const ubicacionFiltro = useMemo(
    () => ubicaciones.find(u => String(u.id_ubicacion) === ubicacionFiltroId) ?? null,
    [ubicaciones, ubicacionFiltroId]
  )

  const datosTabla = useMemo(() => {
    let data = materialFiltroId
      ? unidadesVisibles.filter(u => u.id_material === materialFiltroId)
      : ubicacionFiltroId
        ? unidadesVisibles.filter(u => String(u.id_ubicacion) === ubicacionFiltroId)
        : unidadesVisibles
    if (filtro) data = data.filter(u => u.estado === filtro)
    return data
  }, [unidadesRicas, filtro, materialFiltroId, ubicacionFiltroId])

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))
  const materialesNoConsumibles = materiales.filter(m => m.categoria === 'no consumible')

  const openCreate = () => {
    setForm({
      ...EMPTY_FORM,
      id_material:   materialesNoConsumibles[0]?.id ?? '',
      id_responsable:usuarios[0]?.id ?? '',
      id_ubicacion:  String(ubicaciones[0]?.id_ubicacion ?? ''),
    })
    setModal({ mode: 'create' })
  }

  const openEdit = (u) => {
    setForm({
      id_material:   u.id_material,
      id_responsable:u.id_responsable,
      id_ubicacion:  String(u.id_ubicacion ?? ''),
      codigo_unidad: u.codigo_unidad,
      estado:        u.estado,
      id_ficha:      u.id_ficha ?? '',
    })
    setModal({ mode: 'edit', data: u })
  }

  const closeModal = () => { setModal(null) }

  const handleSave = async () => {
    const esBodega = bodegaUbicacionIds.has(String(form.id_ubicacion))
    if (esBodega && !form.id_ficha) {
      showToast('error', 'Esta ubicación es una bodega — debes seleccionar la ficha a la que pertenece la unidad.')
      return
    }
    setSaving(true)
    try {
      const payload = { ...form, id_ficha: esBodega ? (form.id_ficha || null) : null }
      if (modal.mode === 'create') {
        await api.post('/unidad', payload)
        showToast('success', 'Unidad creada correctamente.')
      } else {
        await api.patch(`/unidad/${modal.data.id_unidad}`, payload)
        showToast('success', 'Unidad actualizada correctamente.')
      }
      closeModal(); loadData()
    } catch (e) {
      const msg = e.response?.data?.message
      showToast('error', Array.isArray(msg) ? msg.join(', ') : (msg ?? 'Error al guardar.'))
    } finally { setSaving(false) }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await api.delete(`/unidad/${deleteTarget.id_unidad}`)
      showToast('success', 'Unidad eliminada correctamente.')
      setDeleteTarget(null); loadData()
    } catch (e) {
      const msg = e.response?.data?.message
      showToast('error', Array.isArray(msg) ? msg.join(', ') : (msg ?? 'Error al eliminar.'))
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
      key: 'ficha',
      header: 'Ficha',
      render: (u) => u._ficha
        ? <span style={{ fontSize: 12.5, fontWeight: 600, color: '#2563eb', background: '#eff6ff', border: '1px solid #bfdbfe', padding: '2px 8px', borderRadius: 20 }}>{u._ficha.codigo_ficha}</span>
        : <span style={{ color: '#9ca3af', fontSize: 12 }}>Sin ficha</span>,
    },
    {
      key: 'acciones',
      header: '',
      align: 'right',
      width: 90,
      render: (u) => (
        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
          <IconButton variant="edit"   title="Editar"   onClick={() => openEdit(u)}><AppIcon name="edit" size={15} /></IconButton>
          {isAdmin && <IconButton variant="delete" title="Eliminar" onClick={() => setDeleteTarget(u)}><AppIcon name="trash" size={15} /></IconButton>}
        </div>
      ),
    },
  ]

  return (
    <>
      {toastPortal}
      <div>
      <PageHeader title="Unidades" description="Activos físicos registrados por código de placa o serial" />

      {materialFiltro && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '10px 16px', borderRadius: 10, marginBottom: 16,
          background: '#eff6ff', border: '1px solid #bfdbfe',
        }}>
          <span style={{ fontSize: 13, color: '#1d4ed8' }}>
            Mostrando unidades de: <strong>{materialFiltro.nombre}</strong>
          </span>
          <button
            onClick={() => navigate('/inventario/unidades')}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: '#2563eb', fontSize: 13, fontWeight: 600, padding: '2px 8px',
              borderRadius: 6,
            }}
          >
            × Ver todas
          </button>
        </div>
      )}

      {ubicacionFiltro && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '10px 16px', borderRadius: 10, marginBottom: 16,
          background: '#f5f3ff', border: '1px solid #ddd6fe',
        }}>
          <span style={{ fontSize: 13, color: '#5b21b6' }}>
            Ubicación: <strong>{ubicacionFiltro.nombre}</strong>
          </span>
          <button
            onClick={() => navigate('/inventario/unidades')}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: '#7c3aed', fontSize: 13, fontWeight: 600, padding: '2px 8px',
              borderRadius: 6,
            }}
          >
            × Ver todas
          </button>
        </div>
      )}

      <div style={{ display: 'flex', gap: 14, marginBottom: 24, flexWrap: 'wrap' }}>
        {CARDS.map(card => {
          const isActive = filtro === card.key
          const count    = card.key === null ? counts.total : (counts[card.key] ?? 0)
          return (
            <button
              key={String(card.key)}
              onClick={() => setFiltro(isActive ? null : card.key)}
              style={{
                flex: '1 1 120px', minWidth: 110, display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
                gap: 10, padding: '14px 16px', borderRadius: 12, cursor: 'pointer',
                border: `1.5px solid ${isActive ? card.color : card.border}`,
                background: isActive ? card.color : card.bg,
                transition: 'all 0.18s',
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                stroke={isActive ? '#fff' : card.color} strokeWidth="1.8"
                strokeLinecap="round" strokeLinejoin="round">
                {card.paths}
              </svg>
              <div>
                <div style={{ fontSize: 22, fontWeight: 700, color: isActive ? '#fff' : '#111827', lineHeight: 1 }}>{count}</div>
                <div style={{ fontSize: 11.5, color: isActive ? 'rgba(255,255,255,0.85)' : '#6b7280', marginTop: 3 }}>{card.label}</div>
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
        selectable={isAdmin}
        onBulkDelete={isAdmin ? handleBulkDelete : undefined}
        emptyTitle="Sin unidades"
        emptyDescription="Registra la primera unidad física de un activo."
        emptyAction={
          <AppButton size="compact" onClick={openCreate}>
            <AppIcon name="plus" /> Nueva unidad
          </AppButton>
        }
        actions={
          <>
            <AppButton variant="ghost" size="compact" onClick={loadData} disabled={loading}>
              <AppIcon name="refresh" /> Actualizar
            </AppButton>
            <AppButton size="compact" onClick={openCreate}>
              <AppIcon name="plus" /> Nueva unidad
            </AppButton>
          </>
        }
      />

      <AppModal
        isOpen={!!modal}
        onClose={closeModal}
        maxWidth={640}
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
            <SearchableSelect
              size="sm"
              value={form.id_material}
              placeholder="— Seleccionar material —"
              options={materialesNoConsumibles.map(m => ({ value: m.id, label: m.nombre }))}
              onChange={v => set('id_material', v)}
            />
          </FormField>

          {materialesNoConsumibles.length === 0 && (
            <div style={{
              background: '#fffbeb', border: '1px solid #fde68a',
              borderRadius: 8, padding: '10px 14px',
              fontSize: 13, color: '#92400e',
            }}>
              No hay materiales de tipo "No Consumible" registrados. Crea uno primero en el módulo de Materiales.
            </div>
          )}

          <FormField label="Código / Placa / Serial" required>
            <AppInput size="sm" value={form.codigo_unidad} placeholder="Ej. SENA-PC-001, SN-4892736"
              onChange={e => set('codigo_unidad', e.target.value)} />
          </FormField>

          <div style={{ display: 'flex', gap: 14 }}>
            <FormField label="Responsable" required>
              <SearchableSelect
                size="sm"
                value={form.id_responsable}
                placeholder="— Seleccionar —"
                options={usuarios.map(u => ({ value: u.id, label: `${u.nombres} ${u.apellidos}` }))}
                onChange={v => set('id_responsable', v)}
              />
            </FormField>
            <FormField label="Ubicación" required>
              <SearchableSelect
                size="sm"
                value={form.id_ubicacion}
                placeholder="— Seleccionar —"
                options={ubicaciones.map(u => ({ value: u.id_ubicacion, label: u.nombre }))}
                onChange={v => setForm(p => ({
                  ...p,
                  id_ubicacion: v,
                  id_ficha: bodegaUbicacionIds.has(v) ? p.id_ficha : '',
                }))}
              />
            </FormField>
          </div>

          <FormField label="Estado" required>
            <AppSelect size="sm" value={form.estado} onChange={e => set('estado', e.target.value)}>
              {ESTADOS_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </AppSelect>
          </FormField>

          {bodegaUbicacionIds.has(String(form.id_ubicacion)) && (
            <FormField label="Ficha asignada" required hint="Esta ubicación es una bodega — la ficha es obligatoria">
              <SearchableSelect
                size="sm"
                value={form.id_ficha}
                placeholder="— Seleccionar ficha —"
                options={fichas.map(f => ({ value: f.id_ficha, label: f.codigo_ficha }))}
                onChange={v => set('id_ficha', v)}
              />
            </FormField>
          )}

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
    </>
  )
}
