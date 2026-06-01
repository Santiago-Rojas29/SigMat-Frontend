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
import { usePermissions } from '../../context/PermissionsContext'
import { AppIcon }        from '../../components/atoms/AppIcon'
const PALETA = [
  { color: '#39A900', bg: '#f0fdf4', border: '#bbf7d0', light: '#dcfce7', paths: <><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 002 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></> },
  { color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe', light: '#dbeafe', paths: <><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></> },
  { color: '#d97706', bg: '#fffbeb', border: '#fde68a', light: '#fef3c7', paths: <><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></> },
  { color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe', light: '#ede9fe', paths: <><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></> },
  { color: '#db2777', bg: '#fdf2f8', border: '#fbcfe8', light: '#fce7f3', paths: <><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/></> },
  { color: '#0891b2', bg: '#ecfeff', border: '#a5f3fc', light: '#cffafe', paths: <><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></> },
]


export function UbicacionesPage() {
  const { hasPermission } = usePermissions()
  const isAdmin = hasPermission('administracion')

  const [tipos,       setTipos]       = useState([])
  const [ubicaciones, setUbicaciones] = useState([])
  const [areas,       setAreas]       = useState([])
  const [usuarios,    setUsuarios]    = useState([])
  const [loading,     setLoading]     = useState(true)
  const [error,       setError]       = useState(null)
  const [filtro,      setFiltro]      = useState(null)

  const [tipoModal,  setTipoModal]  = useState(null)
  const [tipoForm,   setTipoForm]   = useState({ nombre: '', descripcion: '' })
  const [tipoSaving, setTipoSaving] = useState(false)
  const [tipoError,  setTipoError]  = useState(null)
  const [deleteTipo, setDeleteTipo] = useState(null)
  const [delTipo,    setDelTipo]    = useState(false)

  const [ubModal,  setUbModal]  = useState(null)
  const [ubForm,   setUbForm]   = useState({ nombre: '', descripcion: '', id_area: '', id_tipo_ubicacion: '', estado: 'activo', id_encargado: '' })
  const [ubSaving, setUbSaving] = useState(false)
  const [ubError,  setUbError]  = useState(null)
  const [deleteUb, setDeleteUb] = useState(null)
  const [delUb,    setDelUb]    = useState(false)

  const loadData = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const [tRes, uRes, aRes, usRes] = await Promise.all([
        api.get('/tipo-ubicacion'),
        api.get('/ubicacion'),
        api.get('/area'),
        api.get('/usuario'),
      ])
      setTipos(tRes.data)
      setUbicaciones(uRes.data)
      setAreas(aRes.data)
      setUsuarios(usRes.data)
    } catch { setError('No se pudo cargar la información.') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const ubicacionesRicas = useMemo(() => ubicaciones.map(u => ({
    ...u,
    _tipo:      tipos.find(t => String(t.id_tipo_ubicacion) === String(u.id_tipo_ubicacion)),
    _area:      areas.find(a => String(a.id_area) === String(u.id_area)),
    _encargado: usuarios.find(us => us.id === u.id_encargado) ?? null,
    _paleta:    PALETA[(tipos.findIndex(t => String(t.id_tipo_ubicacion) === String(u.id_tipo_ubicacion))) % PALETA.length] ?? PALETA[0],
  })), [ubicaciones, tipos, areas, usuarios])

  const cards = useMemo(() => [
    {
      key: null, label: 'Todas', color: '#111827', bg: '#fff', border: '#e5e7eb',
      paths: <><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></>,
    },
    ...tipos.map((t, idx) => {
      const p = PALETA[idx % PALETA.length]
      return { key: String(t.id_tipo_ubicacion), label: t.nombre, color: p.color, bg: p.bg, border: p.border, paths: p.paths }
    }),
  ], [tipos])

  const counts = useMemo(() => {
    const c = { total: ubicaciones.length }
    tipos.forEach(t => { c[String(t.id_tipo_ubicacion)] = ubicaciones.filter(u => String(u.id_tipo_ubicacion) === String(t.id_tipo_ubicacion)).length })
    return c
  }, [ubicaciones, tipos])

  const datosTabla = useMemo(() => {
    if (!filtro) return ubicacionesRicas
    return ubicacionesRicas.filter(u => String(u.id_tipo_ubicacion) === filtro)
  }, [ubicacionesRicas, filtro])

  const setT = (k, v) => setTipoForm(p => ({ ...p, [k]: v }))
  const setU = (k, v) => setUbForm(p => ({ ...p, [k]: v }))

  const openCrearTipo = () => {
    setTipoForm({ nombre: '', descripcion: '' })
    setTipoError(null)
    setTipoModal({ mode: 'create' })
  }

  const openEditTipo = (t) => {
    setTipoForm({ nombre: t.nombre, descripcion: t.descripcion })
    setTipoError(null)
    setTipoModal({ mode: 'edit', data: t })
  }

  const handleSaveTipo = async () => {
    if (!tipoForm.nombre.trim())      { setTipoError('El nombre es obligatorio.'); return }
    if (!tipoForm.descripcion.trim()) { setTipoError('La descripción es obligatoria.'); return }
    setTipoSaving(true); setTipoError(null)
    try {
      if (tipoModal.mode === 'create') {
        await api.post('/tipo-ubicacion', tipoForm)
      } else {
        await api.patch(`/tipo-ubicacion/${tipoModal.data.id_tipo_ubicacion}`, tipoForm)
      }
      setTipoModal(null); loadData()
    } catch (e) {
      const msg = e.response?.data?.message
      setTipoError(Array.isArray(msg) ? msg.join(', ') : (msg ?? 'Error al guardar.'))
    } finally { setTipoSaving(false) }
  }

  const handleDeleteTipo = async () => {
    setDelTipo(true)
    try {
      await api.delete(`/tipo-ubicacion/${deleteTipo.id_tipo_ubicacion}`)
      setDeleteTipo(null)
      if (filtro === String(deleteTipo.id_tipo_ubicacion)) setFiltro(null)
      loadData()
    } catch (e) {
      const msg = e.response?.data?.message
      setTipoError(Array.isArray(msg) ? msg.join(', ') : (msg ?? 'Error al eliminar.'))
    } finally { setDelTipo(false) }
  }

  const openCrearUb = () => {
    setUbForm({ nombre: '', descripcion: '', estado: 'activo', id_tipo_ubicacion: filtro ?? String(tipos[0]?.id_tipo_ubicacion ?? ''), id_area: String(areas[0]?.id_area ?? ''), id_encargado: '' })
    setUbError(null)
    setUbModal({ mode: 'create' })
  }

  const openEditUb = (u) => {
    setUbForm({ nombre: u.nombre, descripcion: u.descripcion, estado: u.estado, id_tipo_ubicacion: String(u.id_tipo_ubicacion), id_area: String(u.id_area), id_encargado: u.id_encargado ?? '' })
    setUbError(null)
    setUbModal({ mode: 'edit', data: u })
  }

  const handleSaveUb = async () => {
    if (!ubForm.nombre.trim())     { setUbError('El nombre es obligatorio.'); return }
    if (!ubForm.id_tipo_ubicacion) { setUbError('Selecciona un tipo.'); return }
    if (!ubForm.id_area)           { setUbError('Selecciona un área.'); return }
    setUbSaving(true); setUbError(null)
    const payload = {
      ...ubForm,
      id_area:           String(ubForm.id_area),
      id_tipo_ubicacion: String(ubForm.id_tipo_ubicacion),
      id_encargado:      ubForm.id_encargado || null,
    }
    try {
      if (ubModal.mode === 'create') {
        await api.post('/ubicacion', payload)
      } else {
        await api.patch(`/ubicacion/${ubModal.data.id_ubicacion}`, payload)
      }
      setUbModal(null); loadData()
    } catch (e) {
      const msg = e.response?.data?.message
      setUbError(Array.isArray(msg) ? msg.join(', ') : (msg ?? 'Error al guardar.'))
    } finally { setUbSaving(false) }
  }

  const handleDeleteUb = async () => {
    setDelUb(true)
    try {
      await api.delete(`/ubicacion/${deleteUb.id_ubicacion}`)
      setDeleteUb(null); loadData()
    } catch (e) {
      const msg = e.response?.data?.message
      setUbError(Array.isArray(msg) ? msg.join(', ') : (msg ?? 'Error al eliminar.'))
    } finally { setDelUb(false) }
  }

  const handleBulkDelete = async (ids) => {
    await Promise.all(ids.map(id => api.delete(`/ubicacion/${id}`)))
    loadData()
  }

  const columns = [
    { key: 'id_ubicacion', header: 'ID', copyable: true, truncateAt: 8, searchable: false, width: 110 },
    {
      key: 'nombre',
      header: 'Nombre',
      render: u => <span style={{ fontWeight: 600, color: '#111827' }}>{u.nombre}</span>,
    },
    {
      key: 'tipo',
      header: 'Tipo',
      width: 150,
      render: u => {
        const p = u._paleta
        return (
          <span style={{ fontSize: 12, fontWeight: 600, color: p?.color ?? '#374151', background: p?.bg ?? '#f3f4f6', padding: '3px 10px', borderRadius: 20, display: 'inline-block' }}>
            {u._tipo?.nombre ?? '—'}
          </span>
        )
      },
    },
    {
      key: 'area',
      header: 'Área',
      render: u => <span style={{ color: '#374151' }}>{u._area?.nombre ?? '—'}</span>,
    },
    {
      key: 'encargado',
      header: 'Encargado',
      render: u => u._encargado
        ? <span style={{ color: '#374151' }}>{u._encargado.nombres} {u._encargado.apellidos}</span>
        : <span style={{ color: '#d1d5db' }}>—</span>,
    },
    {
      key: 'estado',
      header: 'Estado',
      width: 110,
      render: u => <Badge variant={u.estado === 'activo' ? 'success' : 'default'}>{u.estado === 'activo' ? 'Activo' : 'Inactivo'}</Badge>,
    },
    {
      key: 'acciones',
      header: '',
      align: 'right',
      width: 90,
      render: u => (
        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
          <IconButton variant="edit"   title="Editar"   onClick={() => openEditUb(u)}><AppIcon name="edit" size={15} /></IconButton>
          {isAdmin && <IconButton variant="delete" title="Eliminar" onClick={() => setDeleteUb(u)}><AppIcon name="trash" size={15} /></IconButton>}
        </div>
      ),
    },
  ]

  return (
    <div>
      <PageHeader title="Ubicaciones" description="Espacios físicos del almacén organizados por tipo" />

      {error && <AlertBanner variant="error" style={{ marginBottom: 16 }}>{error}</AlertBanner>}

      {/* ── Cards de tipo como filtro ── */}
      <div style={{ display: 'flex', gap: 14, marginBottom: 24, flexWrap: 'wrap' }}>
        {cards.map(card => {
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
        rowKey="id_ubicacion"
        searchable
        searchPlaceholder="Buscar por nombre, tipo, área…"
        pageSize={10}
        selectable={isAdmin}
        onBulkDelete={isAdmin ? handleBulkDelete : undefined}
        emptyTitle="Sin ubicaciones"
        emptyDescription="Registra la primera ubicación del almacén."
        emptyAction={
          <AppButton size="compact" onClick={openCrearUb}>
            <AppIcon name="plus" /> Nueva ubicación
          </AppButton>
        }
        actions={
          <>
            <AppButton variant="ghost" size="compact" onClick={openCrearTipo}>
              <AppIcon name="plus" /> Nuevo tipo
            </AppButton>
            <AppButton variant="ghost" size="compact" onClick={loadData} disabled={loading}>
              <AppIcon name="refresh" /> Actualizar
            </AppButton>
            <AppButton size="compact" onClick={openCrearUb}>
              <AppIcon name="plus" /> Nueva ubicación
            </AppButton>
          </>
        }
      />

      {/* ── Modal: Nuevo/Editar tipo ── */}
      <AppModal
        isOpen={!!tipoModal}
        onClose={() => setTipoModal(null)}
        title={tipoModal?.mode === 'create' ? 'Nuevo tipo de ubicación' : 'Editar tipo'}
        footer={
          <>
            <AppButton variant="ghost" size="compact" onClick={() => setTipoModal(null)} disabled={tipoSaving}>Cancelar</AppButton>
            <AppButton size="compact" onClick={handleSaveTipo} loading={tipoSaving}>
              {tipoModal?.mode === 'create' ? 'Crear tipo' : 'Guardar cambios'}
            </AppButton>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <FormField label="Nombre del tipo" required>
            <AppInput size="sm" value={tipoForm.nombre} placeholder="Ej. Bodega, Laboratorio, Cuarto frío…"
              onChange={e => setT('nombre', e.target.value)} />
          </FormField>
          <FormField label="Descripción" required>
            <AppInput size="sm" value={tipoForm.descripcion} placeholder="Descripción del tipo de espacio"
              onChange={e => setT('descripcion', e.target.value)} />
          </FormField>
          {tipoError && <AlertBanner variant="error">{tipoError}</AlertBanner>}
        </div>
      </AppModal>

      {/* ── Modal: Nueva/Editar ubicación ── */}
      <AppModal
        isOpen={!!ubModal}
        onClose={() => setUbModal(null)}
        title={ubModal?.mode === 'create' ? 'Nueva ubicación' : `Editar — ${ubModal?.data?.nombre ?? ''}`}
        footer={
          <>
            <AppButton variant="ghost" size="compact" onClick={() => setUbModal(null)} disabled={ubSaving}>Cancelar</AppButton>
            <AppButton size="compact" onClick={handleSaveUb} loading={ubSaving}>
              {ubModal?.mode === 'create' ? 'Crear ubicación' : 'Guardar cambios'}
            </AppButton>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <FormField label="Nombre" required>
            <AppInput size="sm" value={ubForm.nombre} placeholder="Ej. Bodega A, Laboratorio 1…"
              onChange={e => setU('nombre', e.target.value)} />
          </FormField>
          <FormField label="Descripción">
            <AppInput size="sm" value={ubForm.descripcion} placeholder="Descripción del espacio"
              onChange={e => setU('descripcion', e.target.value)} />
          </FormField>
          <div style={{ display: 'flex', gap: 14 }}>
            <FormField label="Tipo" required>
              <AppSelect size="sm" value={ubForm.id_tipo_ubicacion} onChange={e => setU('id_tipo_ubicacion', e.target.value)}>
                <option value="">— Seleccionar —</option>
                {tipos.map(t => <option key={t.id_tipo_ubicacion} value={String(t.id_tipo_ubicacion)}>{t.nombre}</option>)}
              </AppSelect>
            </FormField>
            <FormField label="Área" required>
              <AppSelect size="sm" value={ubForm.id_area} onChange={e => setU('id_area', e.target.value)}>
                <option value="">— Seleccionar —</option>
                {areas.map(a => <option key={a.id_area} value={String(a.id_area)}>{a.nombre}</option>)}
              </AppSelect>
            </FormField>
          </div>
          <div style={{ display: 'flex', gap: 14 }}>
            <FormField label="Encargado">
              <AppSelect size="sm" value={ubForm.id_encargado} onChange={e => setU('id_encargado', e.target.value)}>
                <option value="">— Sin encargado —</option>
                {usuarios.map(u => (
                  <option key={u.id} value={u.id}>{u.nombres} {u.apellidos}</option>
                ))}
              </AppSelect>
            </FormField>
            <FormField label="Estado">
              <AppSelect size="sm" value={ubForm.estado} onChange={e => setU('estado', e.target.value)}>
                <option value="activo">Activo</option>
                <option value="inactivo">Inactivo</option>
              </AppSelect>
            </FormField>
          </div>
          {ubError && <AlertBanner variant="error">{ubError}</AlertBanner>}
        </div>
      </AppModal>

      <ConfirmDialog
        isOpen={!!deleteTipo}
        title="Eliminar tipo"
        description={deleteTipo ? <>¿Eliminar el tipo <strong>{deleteTipo.nombre}</strong>? Las ubicaciones de este tipo quedarán sin tipo asignado.</> : null}
        confirmLabel="Sí, eliminar"
        onConfirm={handleDeleteTipo}
        onCancel={() => setDeleteTipo(null)}
        loading={delTipo}
      />

      <ConfirmDialog
        isOpen={!!deleteUb}
        title="Eliminar ubicación"
        description={deleteUb ? <>¿Eliminar <strong>{deleteUb.nombre}</strong>? Esta acción no se puede deshacer.</> : null}
        confirmLabel="Sí, eliminar"
        onConfirm={handleDeleteUb}
        onCancel={() => setDeleteUb(null)}
        loading={delUb}
      />
    </div>
  )
}
