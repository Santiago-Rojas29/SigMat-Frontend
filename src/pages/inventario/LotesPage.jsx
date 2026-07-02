import { useState, useEffect, useCallback, useMemo } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import api from '../../services/api'
import { AppButton }        from '../../components/atoms/AppButton'
import { AppInput }         from '../../components/atoms/AppInput'
import { AppDateInput }     from '../../components/atoms/AppDateInput'
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
import { groupUsersByRole } from '../../utils/userGroups'
const CATEGORIAS_MAT = {
  'consumible':    { label: 'Consumible',    color: '#39A900', bg: '#f0fdf4', border: '#bbf7d0', light: '#dcfce7' },
  'no consumible': { label: 'No Consumible', color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe', light: '#dbeafe' },
  'perecedero':    { label: 'Perecedero',    color: '#d97706', bg: '#fffbeb', border: '#fde68a', light: '#fef3c7' },
}

const ESTADOS_LOTE = {
  'vigente':          { label: 'Vigente',          variant: 'success' },
  'proximo a vencer': { label: 'Próximo a vencer', variant: 'warning' },
  'vencido':          { label: 'Vencido',           variant: 'danger'  },
  'deteriorado':      { label: 'Deteriorado',       variant: 'default' },
}

const UNIDADES = [
  { value: 'unidad',  label: 'Unidad'         },
  { value: 'kg',      label: 'Kilogramo (kg)' },
  { value: 'l',       label: 'Litro (L)'      },
  { value: 'm',       label: 'Metro (m)'      },
  { value: 'paquete', label: 'Paquete'        },
]

const ESTADOS_OPTIONS = [
  { value: 'vigente',          label: 'Vigente'          },
  { value: 'proximo a vencer', label: 'Próximo a vencer' },
  { value: 'vencido',          label: 'Vencido'          },
  { value: 'deteriorado',      label: 'Deteriorado'      },
]

const hoy = () => new Date().toISOString().split('T')[0]

const EMPTY_FORM = {
  id_material: '', id_responsable: '', id_ubicacion: '',
  codigo_lote: '', cantidad_inicial: '', cantidad_disponible: '',
  unidad_medida: 'unidad', fecha_entrada: hoy(),
  fecha_vencimiento: '', estado: 'vigente',
}


function CantidadBar({ disponible, inicial }) {
  const pct   = inicial > 0 ? Math.max(0, Math.min(100, (disponible / inicial) * 100)) : 0
  const color = pct > 50 ? '#39A900' : pct > 20 ? '#d97706' : '#dc2626'
  return (
    <div>
      <div style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>
        {disponible} <span style={{ color: '#9ca3af', fontWeight: 400 }}>/ {inicial}</span>
      </div>
      <div style={{ marginTop: 4, height: 4, borderRadius: 2, background: '#e5e7eb', width: 80 }}>
        <div style={{ height: '100%', borderRadius: 2, background: color, width: `${pct}%`, transition: 'width 0.3s' }} />
      </div>
    </div>
  )
}

function CatBadge({ categoria }) {
  const c = CATEGORIAS_MAT[categoria]
  if (!c) return null
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', padding: '2px 8px',
      borderRadius: 20, fontSize: 11, fontWeight: 600,
      background: c.light, color: c.color, border: `1px solid ${c.border}`,
    }}>
      {c.label}
    </span>
  )
}

export function LotesPage() {
  const { user } = useAuth()
  const { hasPermission } = usePermissions()
  const isAdmin = hasPermission('administracion')
  const [searchParams] = useSearchParams()
  const navigate         = useNavigate()
  const materialFiltroId  = searchParams.get('material')
  const ubicacionFiltroId = searchParams.get('ubicacion')

  const [lotes,       setLotes]       = useState([])
  const [materiales,  setMateriales]  = useState([])
  const [usuarios,    setUsuarios]    = useState([])
  const [ubicaciones, setUbicaciones] = useState([])
  const [fichas,      setFichas]      = useState([])
  const [loteFichas,  setLoteFichas]  = useState([])
  const [tipos,       setTipos]       = useState([])
  const [roles,       setRoles]       = useState([])
  const [solicitudes, setSolicitudes] = useState([])
  const [solLotes,    setSolLotes]    = useState([])
  const [loading,     setLoading]     = useState(true)
  const [error,       setError]       = useState(null)
  const [filtro,      setFiltro]      = useState(null)

  const [modal,        setModal]        = useState(null)
  const [form,         setForm]         = useState(EMPTY_FORM)
  const [saving,       setSaving]       = useState(false)
  const { showToast, toastPortal } = useToast()
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting,     setDeleting]     = useState(false)

  const [fichaModal,    setFichaModal]    = useState(null)
  const [fichaForm,     setFichaForm]     = useState({ id_ficha: '', cantidad: '' })
  const [fichaEditId,   setFichaEditId]   = useState(null)
  const [fichaSaving,   setFichaSaving]   = useState(false)
  const [fichaDeleting, setFichaDeleting] = useState(null)

  const loadData = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const [lRes, mRes, uRes, ubRes, fRes, lfRes, tRes, roRes, solRes, slRes] = await Promise.all([
        api.get('/lote'),
        api.get('/material'),
        api.get('/usuario'),
        api.get('/ubicacion'),
        api.get('/ficha'),
        api.get('/lote-ficha'),
        api.get('/tipo-ubicacion'),
        api.get('/rol'),
        api.get('/solicitud'),
        api.get('/solicitud-lote'),
      ])
      setLotes(lRes.data)
      setMateriales(mRes.data)
      setUsuarios(uRes.data)
      setUbicaciones(ubRes.data)
      setFichas(fRes.data)
      setLoteFichas(lfRes.data)
      setTipos(tRes.data)
      setRoles(roRes.data)
      setSolicitudes(solRes.data)
      setSolLotes(slRes.data)
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

  const lotesRicos = useMemo(() => lotes.map(l => ({
    ...l,
    _material:    materiales.find(m => m.id === l.id_material),
    _responsable: usuarios.find(u => u.id === l.id_responsable),
    _ubicacion:   ubicaciones.find(u => u.id_ubicacion === l.id_ubicacion),
  })), [lotes, materiales, usuarios, ubicaciones])

  const isBodega = useMemo(() => {
    if (!user) return false
    return roles.find(r => r.id === user.id_rol)?.nombre === 'Responsable de Bodega'
  }, [roles, user])

  const lotesVisibles = useMemo(() => {
    if (isAdmin || isBodega) return lotesRicos
    const misSolIds = new Set(solicitudes.filter(s => s.id_solicitante === user?.id).map(s => s.id_solicitud))
    const misLoteIds = new Set(solLotes.filter(sl => misSolIds.has(sl.id_solicitud)).map(sl => sl.id_lote))
    return lotesRicos.filter(l => misLoteIds.has(l.id_lote))
  }, [lotesRicos, isAdmin, isBodega, user, solicitudes, solLotes])

  const counts = useMemo(() => ({
    total:      lotesVisibles.length,
    consumible: lotesVisibles.filter(l => l._material?.categoria === 'consumible').length,
    perecedero: lotesVisibles.filter(l => l._material?.categoria === 'perecedero').length,
    proximo:    lotesVisibles.filter(l => l.estado === 'proximo a vencer').length,
    vencido:    lotesVisibles.filter(l => l.estado === 'vencido').length,
  }), [lotesVisibles])

  const materialFiltro = useMemo(
    () => materiales.find(m => m.id === materialFiltroId) ?? null,
    [materiales, materialFiltroId]
  )

  const ubicacionFiltro = useMemo(
    () => ubicaciones.find(u => String(u.id_ubicacion) === ubicacionFiltroId) ?? null,
    [ubicaciones, ubicacionFiltroId]
  )

  const datosTabla = useMemo(() => {
    let base = materialFiltroId
      ? lotesVisibles.filter(l => l.id_material === materialFiltroId)
      : ubicacionFiltroId
        ? lotesVisibles.filter(l => String(l.id_ubicacion) === ubicacionFiltroId)
        : lotesVisibles
    if (!filtro) return base
    if (filtro === 'consumible') return base.filter(l => l._material?.categoria === 'consumible')
    if (filtro === 'perecedero') return base.filter(l => l._material?.categoria === 'perecedero')
    if (filtro === 'proximo')    return base.filter(l => l.estado === 'proximo a vencer')
    if (filtro === 'vencido')    return base.filter(l => l.estado === 'vencido')
    return base
  }, [lotesRicos, filtro, materialFiltroId, ubicacionFiltroId])

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))
  const matSeleccionado  = materiales.find(m => m.id === form.id_material)
  const esPerecedero     = matSeleccionado?.categoria === 'perecedero'
  const materialesValidos = materiales.filter(m => m.categoria !== 'no consumible')

  const openCreate = () => {
    const primerMat = materialesValidos[0]
    setForm({ ...EMPTY_FORM, id_material: primerMat?.id ?? '', id_responsable: usuarios[0]?.id ?? '', id_ubicacion: String(ubicaciones[0]?.id_ubicacion ?? '') })
    setModal({ mode: 'create' })
  }

  const openEdit = (l) => {
    setForm({
      id_material:         l.id_material,
      id_responsable:      l.id_responsable,
      id_ubicacion:        String(l.id_ubicacion ?? ''),
      codigo_lote:         l.codigo_lote,
      cantidad_inicial:    l.cantidad_inicial,
      cantidad_disponible: l.cantidad_disponible,
      unidad_medida:       l.unidad_medida,
      fecha_entrada:       l.fecha_entrada?.split('T')[0] ?? hoy(),
      fecha_vencimiento:   l.fecha_vencimiento?.split('T')[0] ?? '',
      estado:              l.estado ?? 'vigente',
    })
    setModal({ mode: 'edit', data: l })
  }

  const closeModal = () => { setModal(null) }

  const handleSave = async () => {
    setSaving(true)
    try {
      const payload = {
        id_material:         form.id_material,
        id_responsable:      form.id_responsable,
        id_ubicacion:        String(form.id_ubicacion),
        codigo_lote:         form.codigo_lote,
        cantidad_inicial:    Number(form.cantidad_inicial),
        cantidad_disponible: Number(form.cantidad_disponible),
        unidad_medida:       form.unidad_medida,
        fecha_entrada:       form.fecha_entrada,
        ...(esPerecedero && {
          fecha_ingreso:     form.fecha_entrada,
          estado:            form.estado,
          ...(form.fecha_vencimiento && { fecha_vencimiento: form.fecha_vencimiento }),
        }),
      }
      if (modal.mode === 'create') {
        await api.post('/lote', payload)
        showToast('success', 'Lote creado correctamente.')
      } else {
        await api.patch(`/lote/${modal.data.id_lote}`, payload)
        showToast('success', 'Lote actualizado correctamente.')
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
      await api.delete(`/lote/${deleteTarget.id_lote}`)
      showToast('success', 'Lote eliminado correctamente.')
      setDeleteTarget(null); loadData()
    } catch (e) {
      const msg = e.response?.data?.message
      showToast('error', Array.isArray(msg) ? msg.join(', ') : (msg ?? 'Error al eliminar.'))
    } finally { setDeleting(false) }
  }

  const handleBulkDelete = async (ids) => {
    await Promise.all(ids.map(id => api.delete(`/lote/${id}`)))
    loadData()
  }

  const openFichaModal = (lote) => {
    setFichaModal(lote)
    setFichaForm({ id_ficha: '', cantidad: '' })
    setFichaEditId(null)
  }

  const fichasDelLote = useMemo(() =>
    fichaModal ? loteFichas.filter(lf => lf.id_lote === fichaModal.id_lote) : [],
    [fichaModal, loteFichas]
  )

  const fichasDisponibles = useMemo(() =>
    fichas.filter(f => !fichasDelLote.some(lf => lf.id_ficha === f.id_ficha && lf.id !== fichaEditId)),
    [fichas, fichasDelLote, fichaEditId]
  )

  const handleFichaGuardar = async () => {
    if (!fichaForm.id_ficha || !fichaForm.cantidad) { showToast('error', 'Selecciona una ficha e ingresa la cantidad.'); return }
    setFichaSaving(true)
    try {
      if (fichaEditId) {
        await api.patch(`/lote-ficha/${fichaEditId}`, { cantidad: Number(fichaForm.cantidad) })
      } else {
        await api.post('/lote-ficha', { id_lote: fichaModal.id_lote, id_ficha: fichaForm.id_ficha, cantidad: Number(fichaForm.cantidad) })
      }
      const [lfRes, lotesRes] = await Promise.all([api.get('/lote-ficha'), api.get('/lote')])
      setLoteFichas(lfRes.data)
      setLotes(lotesRes.data)
      setFichaForm({ id_ficha: '', cantidad: '' })
      setFichaEditId(null)
    } catch (e) {
      const msg = e.response?.data?.message
      showToast('error', Array.isArray(msg) ? msg.join(', ') : (msg ?? 'Error al guardar.'))
    } finally { setFichaSaving(false) }
  }

  const handleFichaEliminar = async (id) => {
    setFichaDeleting(id)
    try {
      await api.delete(`/lote-ficha/${id}`)
      const lotesRes = await api.get('/lote')
      setLoteFichas(prev => prev.filter(lf => lf.id !== id))
      setLotes(lotesRes.data)
    } catch (e) {
      const msg = e.response?.data?.message
      showToast('error', Array.isArray(msg) ? msg.join(', ') : (msg ?? 'Error al eliminar.'))
    } finally { setFichaDeleting(null) }
  }

  const handleFichaEditar = (lf) => {
    setFichaEditId(lf.id)
    setFichaForm({ id_ficha: lf.id_ficha, cantidad: String(lf.cantidad) })
  }

  const columns = [
    { key: 'id_lote', header: 'ID', copyable: true, truncateAt: 8, searchable: false, width: 110 },
    {
      key: 'codigo_lote',
      header: 'Código lote',
      width: 140,
      render: (l) => (
        <code style={{ fontSize: 12.5, background: '#f3f4f6', padding: '3px 8px', borderRadius: 5, color: '#374151', fontWeight: 600 }}>
          {l.codigo_lote}
        </code>
      ),
    },
    {
      key: 'material',
      header: 'Material',
      render: (l) => (
        <div>
          <div style={{ fontWeight: 600, color: '#111827', fontSize: 13 }}>
            {l._material?.nombre ?? <span style={{ color: '#9ca3af' }}>—</span>}
          </div>
          {l._material && <CatBadge categoria={l._material.categoria} />}
        </div>
      ),
    },
    {
      key: 'cantidades',
      header: 'Disponible / Inicial',
      width: 140,
      render: (l) => <CantidadBar disponible={l.cantidad_disponible} inicial={l.cantidad_inicial} />,
    },
    {
      key: 'unidad_medida',
      header: 'Unidad',
      width: 90,
      render: (l) => <span style={{ color: '#6b7280', fontSize: 12.5 }}>{l.unidad_medida}</span>,
    },
    {
      key: 'responsable',
      header: 'Responsable',
      render: (l) => {
        const r = l._responsable
        return r
          ? <span style={{ color: '#374151' }}>{r.nombres} {r.apellidos}</span>
          : <span style={{ color: '#9ca3af' }}>—</span>
      },
    },
    {
      key: 'ubicacion',
      header: 'Ubicación',
      render: (l) => <span style={{ color: '#374151' }}>{l._ubicacion?.nombre ?? '—'}</span>,
    },
    {
      key: 'estado',
      header: 'Estado',
      width: 150,
      render: (l) => {
        if (!l.estado) return <span style={{ color: '#9ca3af', fontSize: 12 }}>—</span>
        const e = ESTADOS_LOTE[l.estado]
        return <Badge variant={e?.variant ?? 'default'}>{e?.label ?? l.estado}</Badge>
      },
    },
    {
      key: 'fecha_vencimiento',
      header: 'Vencimiento',
      width: 110,
      render: (l) => {
        if (!l.fecha_vencimiento) return <span style={{ color: '#9ca3af', fontSize: 12 }}>—</span>
        const fecha   = new Date(l.fecha_vencimiento).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })
        const vencido = new Date(l.fecha_vencimiento) < new Date()
        return (
          <span style={{ fontSize: 12.5, color: vencido ? '#dc2626' : '#374151', fontWeight: vencido ? 600 : 400 }}>
            {fecha}
          </span>
        )
      },
    },
    {
      key: 'acciones',
      header: '',
      align: 'right',
      width: 90,
      render: (l) => (
        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
          {bodegaUbicacionIds.has(String(l.id_ubicacion)) && (
            <IconButton title="Gestionar fichas" onClick={() => openFichaModal(l)}
              style={{ color: '#2563eb', background: '#eff6ff', border: '1px solid #bfdbfe' }}>
              <AppIcon name="clipboard" size={15} />
            </IconButton>
          )}
          <IconButton variant="edit"   title="Editar"   onClick={() => openEdit(l)}><AppIcon name="edit" size={15} /></IconButton>
          {isAdmin && <IconButton variant="delete" title="Eliminar" onClick={() => setDeleteTarget(l)}><AppIcon name="trash" size={15} /></IconButton>}
        </div>
      ),
    },
  ]

  const cards = [
    {
      key: null, label: 'Todos', count: counts.total,
      color: '#111827', bg: '#fff', border: '#e5e7eb',
      paths: <><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 002 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></>,
    },
    {
      key: 'consumible', label: 'Consumibles', count: counts.consumible,
      color: '#39A900', bg: '#f0fdf4', border: '#bbf7d0',
      paths: <><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 002 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></>,
    },
    {
      key: 'perecedero', label: 'Perecederos', count: counts.perecedero,
      color: '#d97706', bg: '#fffbeb', border: '#fde68a',
      paths: <><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></>,
    },
    {
      key: 'proximo', label: 'Próx. a vencer', count: counts.proximo,
      color: '#ea580c', bg: '#fff7ed', border: '#fed7aa',
      paths: <><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></>,
    },
    {
      key: 'vencido', label: 'Vencidos', count: counts.vencido,
      color: '#dc2626', bg: '#fef2f2', border: '#fecaca',
      paths: <><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></>,
    },
  ]

  return (
    <>
      {toastPortal}
      <div>
      <PageHeader title="Lotes" description="Gestión de lotes de consumibles y perecederos" />

      {materialFiltro && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '10px 16px', borderRadius: 10, marginBottom: 16,
          background: '#fffbeb', border: '1px solid #fde68a',
        }}>
          <span style={{ fontSize: 13, color: '#92400e' }}>
            Mostrando lotes de: <strong>{materialFiltro.nombre}</strong>
          </span>
          <button
            onClick={() => navigate('/inventario/lotes')}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: '#d97706', fontSize: 13, fontWeight: 600, padding: '2px 8px',
              borderRadius: 6,
            }}
          >
            × Ver todos
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
            onClick={() => navigate('/inventario/lotes')}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: '#7c3aed', fontSize: 13, fontWeight: 600, padding: '2px 8px',
              borderRadius: 6,
            }}
          >
            × Ver todos
          </button>
        </div>
      )}

      <div style={{ display: 'flex', gap: 14, marginBottom: 24, flexWrap: 'wrap' }}>
        {cards.map(card => {
          const isActive = filtro === card.key
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
                <div style={{ fontSize: 22, fontWeight: 700, color: isActive ? '#fff' : '#111827', lineHeight: 1 }}>{card.count}</div>
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
        rowKey="id_lote"
        searchable
        searchPlaceholder="Buscar por código, material, responsable…"
        pageSize={10}
        selectable={isAdmin}
        onBulkDelete={isAdmin ? handleBulkDelete : undefined}
        emptyTitle="Sin lotes"
        emptyDescription="Registra el primer lote de consumibles o perecederos."
        emptyAction={
          <AppButton size="compact" onClick={openCreate}>
            <AppIcon name="plus" /> Nuevo lote
          </AppButton>
        }
        actions={
          <>
            <AppButton variant="ghost" size="compact" onClick={loadData} disabled={loading}>
              <AppIcon name="refresh" /> Actualizar
            </AppButton>
            <AppButton size="compact" onClick={openCreate}>
              <AppIcon name="plus" /> Nuevo lote
            </AppButton>
          </>
        }
      />

      <AppModal
        isOpen={!!modal}
        onClose={closeModal}
        maxWidth={640}
        title={modal?.mode === 'create' ? 'Nuevo lote' : `Editar lote — ${modal?.data?.codigo_lote ?? ''}`}
        footer={
          <>
            <AppButton variant="ghost" size="compact" onClick={closeModal} disabled={saving}>Cancelar</AppButton>
            <AppButton size="compact" onClick={handleSave} loading={saving}>
              {modal?.mode === 'create' ? 'Crear lote' : 'Guardar cambios'}
            </AppButton>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <FormField label="Material" required>
            <SearchableSelect
              size="sm"
              value={form.id_material}
              placeholder="— Seleccionar material —"
              options={materialesValidos.map(m => ({
                value: m.id,
                label: `${m.nombre} (${CATEGORIAS_MAT[m.categoria]?.label ?? m.categoria})`,
              }))}
              onChange={v => {
                const mat = materiales.find(m => m.id === v)
                setForm(p => ({
                  ...p,
                  id_material:       v,
                  unidad_medida:     mat?.unidad_medida ?? p.unidad_medida,
                  fecha_vencimiento: mat?.categoria !== 'perecedero' ? '' : p.fecha_vencimiento,
                  estado:            mat?.categoria !== 'perecedero' ? 'vigente' : p.estado,
                }))
              }}
            />
          </FormField>

          {matSeleccionado && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '8px 12px', borderRadius: 8,
              background: CATEGORIAS_MAT[matSeleccionado.categoria]?.light ?? '#f9fafb',
              border: `1px solid ${CATEGORIAS_MAT[matSeleccionado.categoria]?.border ?? '#e5e7eb'}`,
            }}>
              <CatBadge categoria={matSeleccionado.categoria} />
              <span style={{ fontSize: 12.5, color: '#6b7280' }}>
                {esPerecedero ? 'Se requieren fechas de ingreso y vencimiento.' : 'Solo campos estándar de lote.'}
              </span>
            </div>
          )}

          <div style={{ display: 'flex', gap: 14 }}>
            <FormField label="Código de lote" required>
              <AppInput size="sm" value={form.codigo_lote} placeholder="Ej. LOT-2024-001"
                onChange={e => set('codigo_lote', e.target.value)} />
            </FormField>
            <FormField label="Unidad de medida">
              <AppInput
                size="sm"
                value={form.unidad_medida || '—'}
                disabled
                style={{ background: '#f9fafb', color: '#6b7280', cursor: 'not-allowed' }}
              />
            </FormField>
          </div>

          <div style={{ display: 'flex', gap: 14 }}>
            <FormField label="Cantidad inicial" required>
              <AppInput size="sm" type="number" min="1" value={form.cantidad_inicial} placeholder="Ej. 100"
                onChange={e => {
                  const v = e.target.value
                  setForm(p => ({
                    ...p,
                    cantidad_inicial:    v,
                    cantidad_disponible: modal?.mode === 'create' ? v : p.cantidad_disponible,
                  }))
                }} />
            </FormField>
            <FormField label="Cantidad disponible" required>
              <AppInput size="sm" type="number" min="0" value={form.cantidad_disponible} placeholder="Ej. 100"
                onChange={e => set('cantidad_disponible', e.target.value)} />
            </FormField>
          </div>

          <div style={{ display: 'flex', gap: 14 }}>
            <FormField label="Responsable" required>
              <SearchableSelect
                size="sm"
                value={form.id_responsable}
                placeholder="— Seleccionar —"
                options={groupUsersByRole(usuarios, roles)}
                onChange={v => set('id_responsable', v)}
              />
            </FormField>
            <FormField label="Ubicación" required>
              <SearchableSelect
                size="sm"
                value={form.id_ubicacion}
                placeholder="— Seleccionar —"
                options={ubicaciones.map(u => ({ value: u.id_ubicacion, label: u.nombre }))}
                onChange={v => set('id_ubicacion', v)}
              />
            </FormField>
          </div>

          <FormField label="Fecha de entrada" required>
            <AppDateInput size="sm" value={form.fecha_entrada}
              onChange={e => set('fecha_entrada', e.target.value)} />
          </FormField>

          {esPerecedero && (
            <div style={{
              padding: 14, borderRadius: 10,
              background: '#fffbeb', border: '1px solid #fde68a',
              display: 'flex', flexDirection: 'column', gap: 14,
            }}>
              <p style={{ fontSize: 12, fontWeight: 600, color: '#d97706', margin: 0, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Datos de perecedero
              </p>
              <div style={{ display: 'flex', gap: 14 }}>
                <FormField label="Fecha de vencimiento" required>
                  <AppDateInput size="sm" value={form.fecha_vencimiento}
                    min={form.fecha_entrada || undefined}
                    onChange={e => set('fecha_vencimiento', e.target.value)} />
                </FormField>
                <FormField label="Estado del lote" required>
                  <AppSelect size="sm" value={form.estado} onChange={e => set('estado', e.target.value)}>
                    {ESTADOS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </AppSelect>
                </FormField>
              </div>
            </div>
          )}

        </div>
      </AppModal>

      <AppModal
        isOpen={!!fichaModal}
        onClose={() => { setFichaModal(null); setFichaEditId(null) }}
        maxWidth={640}
        title={`Fichas asignadas — ${fichaModal?.codigo_lote ?? ''}`}
        footer={
          <AppButton variant="ghost" size="compact" onClick={() => { setFichaModal(null); setFichaEditId(null) }}>
            Cerrar
          </AppButton>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {fichasDelLote.length === 0 ? (
            <p style={{ color: '#9ca3af', fontSize: 13, textAlign: 'center', padding: '12px 0' }}>
              Este lote no tiene fichas asignadas aún.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {fichasDelLote.map(lf => {
                const ficha = fichas.find(f => f.id_ficha === lf.id_ficha)
                const isEditing = fichaEditId === lf.id
                return (
                  <div key={lf.id} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '10px 14px', borderRadius: 10,
                    background: isEditing ? '#eff6ff' : '#f9fafb',
                    border: `1px solid ${isEditing ? '#bfdbfe' : '#e5e7eb'}`,
                  }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 13.5, color: '#111827' }}>
                        {ficha?.codigo_ficha ?? lf.id_ficha}
                      </div>
                      <div style={{ fontSize: 12, color: '#6b7280' }}>
                        Cantidad asignada: <strong>{lf.cantidad}</strong>
                      </div>
                    </div>
                    <IconButton title="Editar cantidad" onClick={() => handleFichaEditar(lf)}
                      style={{ color: '#d97706', background: '#fffbeb', border: '1px solid #fde68a' }}>
                      <AppIcon name="edit" size={15} />
                    </IconButton>
                    <IconButton title="Quitar ficha" onClick={() => handleFichaEliminar(lf.id)}
                      disabled={fichaDeleting === lf.id}
                      style={{ color: '#dc2626', background: '#fef2f2', border: '1px solid #fecaca' }}>
                      <AppIcon name="trash" size={15} />
                    </IconButton>
                  </div>
                )
              })}
            </div>
          )}

          <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: 14 }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
              {fichaEditId ? 'Editar cantidad' : 'Asignar nueva ficha'}
            </p>
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
              {!fichaEditId && (
                <FormField label="Ficha" style={{ flex: 2 }}>
                  <SearchableSelect
                    size="sm"
                    value={fichaForm.id_ficha}
                    placeholder="— Seleccionar ficha —"
                    options={fichasDisponibles.map(f => ({ value: f.id_ficha, label: f.codigo_ficha }))}
                    onChange={v => setFichaForm(p => ({ ...p, id_ficha: v }))}
                  />
                </FormField>
              )}
              <FormField label="Cantidad" style={{ flex: 1 }}>
                <AppInput size="sm" type="number" min="1" value={fichaForm.cantidad}
                  placeholder="Ej. 30"
                  onChange={e => setFichaForm(p => ({ ...p, cantidad: e.target.value }))} />
              </FormField>
              <div style={{ display: 'flex', gap: 6, marginBottom: 1 }}>
                <AppButton size="compact" onClick={handleFichaGuardar} loading={fichaSaving}>
                  {fichaEditId ? 'Actualizar' : 'Asignar'}
                </AppButton>
                {fichaEditId && (
                  <AppButton variant="ghost" size="compact"
                    onClick={() => { setFichaEditId(null); setFichaForm({ id_ficha: '', cantidad: '' }) }}>
                    Cancelar
                  </AppButton>
                )}
              </div>
            </div>
          </div>
        </div>
      </AppModal>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Eliminar lote"
        description={
          deleteTarget
            ? <>¿Eliminar el lote <strong>{deleteTarget.codigo_lote}</strong>? Esta acción no se puede deshacer.</>
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
