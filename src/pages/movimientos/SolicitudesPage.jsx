import { useState, useEffect, useMemo, useCallback } from 'react'
import { PageHeader } from '../../components/molecules/PageHeader'
import { DataTable } from '../../components/organisms/DataTable'
import { AppModal } from '../../components/organisms/AppModal'
import { AppButton } from '../../components/atoms/AppButton'
import { Badge } from '../../components/atoms/Badge'
import { ConfirmDialog } from '../../components/molecules/ConfirmDialog'
import { AlertBanner } from '../../components/molecules/AlertBanner'
import { useAuth } from '../../context/AuthContext'
import { usePermissions } from '../../context/PermissionsContext'
import api from '../../services/api'

const ESTADOS = {
  pendiente:  { label: 'Pendiente',  variant: 'warning' },
  aprobado:   { label: 'Aprobado',   variant: 'success' },
  rechazado:  { label: 'Rechazado',  variant: 'danger'  },
  activo:     { label: 'Activo',     variant: 'info'    },
  finalizado: { label: 'Finalizado', variant: 'default' },
}

const TIPOS = {
  interno: { label: 'Interno', variant: 'info'    },
  externo: { label: 'Externo', variant: 'warning' },
}

const FORM_INIT = { id_ficha: '', tipo_prestamo: 'interno', observaciones: '' }

const CARDS_DEF = [
  {
    key: null, label: 'Todas', color: '#111827', bg: '#fff', border: '#e5e7eb',
    paths: <><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></>,
  },
  {
    key: 'pendiente', label: 'Pendientes', color: '#d97706', bg: '#fffbeb', border: '#fde68a',
    paths: <><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></>,
  },
  {
    key: 'aprobado', label: 'Aprobadas', color: '#2d8000', bg: '#f0fdf4', border: '#bbf7d0',
    paths: <><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></>,
  },
  {
    key: 'rechazado', label: 'Rechazadas', color: '#dc2626', bg: '#fef2f2', border: '#fecaca',
    paths: <><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></>,
  },
  {
    key: 'activo', label: 'Activas', color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe',
    paths: <><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></>,
  },
  {
    key: 'finalizado', label: 'Finalizadas', color: '#6b7280', bg: '#f9fafb', border: '#e5e7eb',
    paths: <><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="M9 12l2 2 4-4"/></>,
  },
]

function fmtFecha(val) {
  if (!val) return '—'
  const d = new Date(val)
  return d.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })
}

function Row({ label, value }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <span style={{ fontSize: 11, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</span>
      <span style={{ fontSize: 13.5, color: '#111827' }}>{value ?? '—'}</span>
    </div>
  )
}

export function SolicitudesPage() {
  const { user } = useAuth()
  const { hasPermission } = usePermissions()
  const isAdmin = hasPermission('administracion')

  const [solicitudes, setSolicitudes]           = useState([])
  const [solicitudLotes, setSolicitudLotes]     = useState([])
  const [solicitudUnidades, setSolicitudUnidades] = useState([])
  const [usuarios, setUsuarios]                 = useState([])
  const [fichas, setFichas]                     = useState([])
  const [lotes, setLotes]                       = useState([])
  const [unidades, setUnidades]                 = useState([])
  const [materiales, setMateriales]             = useState([])
  const [loading, setLoading]                   = useState(true)
  const [error, setError]                       = useState('')

  const [filterKey, setFilterKey]   = useState(null)
  const [modalOpen, setModalOpen]   = useState(false)
  const [detailOpen, setDetailOpen] = useState(false)
  const [detailSol, setDetailSol]   = useState(null)
  const [step, setStep]             = useState(1)
  const [form, setForm]             = useState(FORM_INIT)
  const [saving, setSaving]         = useState(false)

  const [selUnidades, setSelUnidades] = useState([])
  const [selLotes, setSelLotes]       = useState([])
  const [addUnidadId, setAddUnidadId] = useState('')
  const [addLoteId, setAddLoteId]     = useState('')
  const [addLoteCant, setAddLoteCant] = useState(1)

  const [confirmDel, setConfirmDel]     = useState({ open: false, id: '' })
  const [confirmAprov, setConfirmAprov] = useState({ open: false, id: '' })
  const [rejectModal, setRejectModal]   = useState({ open: false, id: '', obs: '' })
  const [actioning, setActioning]       = useState(false)

  const load = useCallback(async () => {
    try {
      setLoading(true)
      const [s, sl, su, f, l, un, m] = await Promise.all([
        api.get('/solicitud'),
        api.get('/solicitud-lote'),
        api.get('/solicitud-unidad'),
        api.get('/ficha'),
        api.get('/lote'),
        api.get('/unidad'),
        api.get('/material'),
      ])
      setSolicitudes(s.data)
      setSolicitudLotes(sl.data)
      setSolicitudUnidades(su.data)
      setFichas(f.data)
      setLotes(l.data)
      setUnidades(un.data)
      setMateriales(m.data)
    } catch {
      setError('Error al cargar los datos')
    } finally {
      setLoading(false)
    }
    if (isAdmin) { try { const { data } = await api.get('/usuario'); setUsuarios(data) } catch { setUsuarios([]) } }
  }, [])

  useEffect(() => { load() }, [load])

  const solicitudesRicas = useMemo(() => {
    return solicitudes.map(s => {
      const itemsLote   = solicitudLotes.filter(sl => sl.id_solicitud === s.id_solicitud)
      const itemsUnidad = solicitudUnidades.filter(su => su.id_solicitud === s.id_solicitud)
      return {
        ...s,
        _solicitante: usuarios.find(u => u.id === s.id_solicitante),
        _ficha:       fichas.find(f => f.id_ficha === s.id_ficha),
        _lotes:       itemsLote.map(sl => ({ ...sl, _lote: lotes.find(l => l.id_lote === sl.id_lote), _material: materiales.find(m => m.id_material === lotes.find(l => l.id_lote === sl.id_lote)?.id_material) })),
        _unidades:    itemsUnidad.map(su => ({ ...su, _unidad: unidades.find(u => u.id_unidad === su.id_unidad), _material: materiales.find(m => m.id_material === unidades.find(u => u.id_unidad === su.id_unidad)?.id_material) })),
        _numItems:    itemsLote.length + itemsUnidad.length,
      }
    })
  }, [solicitudes, solicitudLotes, solicitudUnidades, usuarios, fichas, lotes, unidades, materiales])

  const counts = useMemo(() => {
    const c = { total: solicitudesRicas.length }
    CARDS_DEF.forEach(card => {
      if (card.key) c[card.key] = solicitudesRicas.filter(s => s.estado === card.key).length
    })
    return c
  }, [solicitudesRicas])

  const datosFiltrados = useMemo(() => {
    if (!filterKey) return solicitudesRicas
    return solicitudesRicas.filter(s => s.estado === filterKey)
  }, [solicitudesRicas, filterKey])

  const unidadesDisponibles = useMemo(() =>
    unidades
      .filter(u => u.estado === 'disponible')
      .map(u => ({ ...u, _material: materiales.find(m => m.id_material === u.id_material) }))
  , [unidades, materiales])

  const lotesConStock = useMemo(() =>
    lotes
      .filter(l => l.cantidad_disponible > 0)
      .map(l => ({ ...l, _material: materiales.find(m => m.id_material === l.id_material) }))
  , [lotes, materiales])

  const openCreate = () => {
    setForm(FORM_INIT)
    setSelUnidades([])
    setSelLotes([])
    setAddUnidadId('')
    setAddLoteId('')
    setAddLoteCant(1)
    setStep(1)
    setModalOpen(true)
  }

  const closeModal = () => { setModalOpen(false); setStep(1) }

  const openDetail = (sol) => { setDetailSol(sol); setDetailOpen(true) }

  const addUnidad = () => {
    const u = unidadesDisponibles.find(u => String(u.id_unidad) === addUnidadId)
    if (!u || selUnidades.find(s => String(s.id_unidad) === addUnidadId)) return
    setSelUnidades(p => [...p, u])
    setAddUnidadId('')
  }

  const addLote = () => {
    const l = lotesConStock.find(l => String(l.id_lote) === addLoteId)
    if (!l || selLotes.find(s => String(s.id_lote) === addLoteId)) return
    const cant = Math.max(1, Math.min(addLoteCant, l.cantidad_disponible))
    setSelLotes(p => [...p, { ...l, _cantidad: cant }])
    setAddLoteId('')
    setAddLoteCant(1)
  }

  const handleSave = async () => {
    if (selUnidades.length === 0 && selLotes.length === 0) return
    setSaving(true)
    try {
      const { data: sol } = await api.post('/solicitud', {
        id_ficha:        form.id_ficha,
        id_solicitante:  user.id,
        fecha_solicitud: new Date().toISOString(),
        tipo_prestamo:   form.tipo_prestamo,
        estado:          'pendiente',
        observaciones:   form.observaciones,
      })
      await Promise.all([
        ...selUnidades.map(u => api.post('/solicitud-unidad', { id_solicitud: String(sol.id_solicitud), id_unidad: String(u.id_unidad), id_usuario: String(user.id) })),
        ...selLotes.map(l => api.post('/solicitud-lote', { id_solicitud: String(sol.id_solicitud), id_lote: String(l.id_lote), cantidad_solicitada: l._cantidad, id_usuario: String(user.id) })),
      ])
      closeModal()
      load()
    } catch {
      setError('Error al guardar la solicitud')
    } finally {
      setSaving(false)
    }
  }

  const handleAprobar = async () => {
    setActioning(true)
    try {
      await api.patch(`/solicitud/${confirmAprov.id}`, { estado: 'aprobado' })
      setConfirmAprov({ open: false, id: '' })
      load()
    } catch { setError('Error al aprobar') } finally { setActioning(false) }
  }

  const handleRechazar = async () => {
    setActioning(true)
    try {
      await api.patch(`/solicitud/${rejectModal.id}`, { estado: 'rechazado', observaciones: rejectModal.obs })
      setRejectModal({ open: false, id: '', obs: '' })
      load()
    } catch { setError('Error al rechazar') } finally { setActioning(false) }
  }

  const handleEliminar = async () => {
    setActioning(true)
    try {
      await api.delete(`/solicitud/${confirmDel.id}`)
      setConfirmDel({ open: false, id: '' })
      load()
    } catch { setError('Error al eliminar') } finally { setActioning(false) }
  }

  const columns = [
    {
      key: 'id_solicitud', header: 'ID', width: 100,
      copyable: true, truncateAt: 8, searchable: false,
    },
    {
      key: 'fecha_solicitud', header: 'Fecha',
      render: r => fmtFecha(r.fecha_solicitud),
    },
    {
      key: 'tipo_prestamo', header: 'Tipo', width: 110,
      render: r => {
        const t = TIPOS[r.tipo_prestamo] ?? { label: r.tipo_prestamo, variant: 'default' }
        return <Badge variant={t.variant}>{t.label}</Badge>
      },
    },
    {
      key: 'estado', header: 'Estado', width: 120,
      render: r => {
        const e = ESTADOS[r.estado] ?? { label: r.estado, variant: 'default' }
        return <Badge variant={e.variant}>{e.label}</Badge>
      },
    },
    {
      key: '_solicitante', header: 'Solicitante',
      render: r => r._solicitante ? `${r._solicitante.nombres} ${r._solicitante.apellidos}` : r.id_solicitante,
    },
    {
      key: '_ficha', header: 'Ficha', width: 120,
      render: r => r._ficha?.codigo_ficha ?? r.id_ficha,
    },
    {
      key: '_numItems', header: 'Ítems', width: 70, align: 'center',
      render: r => (
        <span style={{ fontWeight: 600, fontSize: 13, color: r._numItems > 0 ? '#2d8000' : '#9ca3af' }}>
          {r._numItems}
        </span>
      ),
    },
    {
      key: '_acciones', header: 'Acciones', width: 140, searchable: false,
      render: r => (
        <div style={{ display: 'flex', gap: 4 }}>
          <button title="Ver detalle" onClick={() => openDetail(r)} style={btnStyle('#2563eb')}>
            <EyeIcon />
          </button>
          {r.estado === 'pendiente' && isAdmin && <>
            <button title="Aprobar" onClick={() => setConfirmAprov({ open: true, id: r.id_solicitud })} style={btnStyle('#2d8000')}>
              <CheckIcon />
            </button>
            <button title="Rechazar" onClick={() => setRejectModal({ open: true, id: r.id_solicitud, obs: r.observaciones ?? '' })} style={btnStyle('#d97706')}>
              <XIcon />
            </button>
            <button title="Eliminar" onClick={() => setConfirmDel({ open: true, id: r.id_solicitud })} style={btnStyle('#dc2626')}>
              <TrashIcon />
            </button>
          </>}
        </div>
      ),
    },
  ]

  return (
    <div>
      <PageHeader title="Solicitudes" description="Gestión de solicitudes de materiales" />

      {error && <AlertBanner type="error" message={error} onClose={() => setError('')} style={{ marginBottom: 20 }} />}

      <div style={{ display: 'flex', gap: 14, marginBottom: 24, flexWrap: 'wrap' }}>
        {CARDS_DEF.map(card => {
          const count = card.key ? counts[card.key] ?? 0 : counts.total
          const isActive = filterKey === card.key
          return (
            <button
              key={String(card.key)}
              onClick={() => setFilterKey(isActive ? null : card.key)}
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
        data={datosFiltrados}
        rowKey="id_solicitud"
        loading={loading}
        actions={
          <AppButton size="compact" onClick={openCreate}>+ Nueva solicitud</AppButton>
        }
        emptyMessage="No hay solicitudes registradas"
      />

      <AppModal
        isOpen={modalOpen}
        onClose={closeModal}
        title={step === 1 ? 'Nueva solicitud — Paso 1 de 2' : 'Nueva solicitud — Paso 2 de 2'}
        maxWidth={640}
        footer={
          step === 1
            ? <>
                <AppButton variant="ghost" size="compact" onClick={closeModal}>Cancelar</AppButton>
                <AppButton size="compact"
                  onClick={() => setStep(2)}
                  disabled={!form.id_ficha || !form.tipo_prestamo}>
                  Siguiente →
                </AppButton>
              </>
            : <>
                <AppButton variant="ghost" size="compact" onClick={() => setStep(1)}>← Atrás</AppButton>
                <AppButton size="compact" onClick={handleSave} loading={saving}
                  disabled={selUnidades.length === 0 && selLotes.length === 0}>
                  Crear solicitud
                </AppButton>
              </>
        }
      >
        {step === 1 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div>
              <label style={labelStyle}>Ficha *</label>
              <select value={form.id_ficha} onChange={e => setForm(p => ({ ...p, id_ficha: e.target.value }))} style={selectStyle}>
                <option value="">Seleccionar ficha...</option>
                {fichas.map(f => (
                  <option key={f.id_ficha} value={f.id_ficha}>{f.codigo_ficha}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Tipo de préstamo *</label>
              <select value={form.tipo_prestamo} onChange={e => setForm(p => ({ ...p, tipo_prestamo: e.target.value }))} style={selectStyle}>
                <option value="interno">Interno</option>
                <option value="externo">Externo</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Solicitante</label>
              <input value={user ? `${user.nombres ?? ''} ${user.apellidos ?? ''}`.trim() || user.correo : ''} disabled style={{ ...inputStyle, background: '#f9fafb', color: '#6b7280' }} />
            </div>
            <div>
              <label style={labelStyle}>Observaciones</label>
              <textarea value={form.observaciones} onChange={e => setForm(p => ({ ...p, observaciones: e.target.value }))}
                rows={3} style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }}
                placeholder="Motivo o detalles de la solicitud..." />
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div style={{ background: '#f8fafc', borderRadius: 10, padding: 16, border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 12 }}>
                Activos (Unidades no consumibles)
              </div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                <select value={addUnidadId} onChange={e => setAddUnidadId(e.target.value)} style={{ ...selectStyle, flex: 1 }}>
                  <option value="">Seleccionar unidad disponible...</option>
                  {unidadesDisponibles
                    .filter(u => !selUnidades.find(s => s.id_unidad === u.id_unidad))
                    .map(u => (
                      <option key={u.id_unidad} value={u.id_unidad}>
                        {u.codigo_unidad} — {u._material?.nombre ?? u.id_material}
                      </option>
                    ))}
                </select>
                <AppButton size="compact" onClick={addUnidad} disabled={!addUnidadId}>Agregar</AppButton>
              </div>
              {selUnidades.length === 0
                ? <p style={{ fontSize: 12, color: '#9ca3af', margin: 0 }}>Sin unidades agregadas.</p>
                : selUnidades.map(u => (
                    <div key={u.id_unidad} style={itemRowStyle}>
                      <span style={{ fontSize: 13 }}>
                        <code style={{ fontSize: 11.5, background: '#e0f2fe', color: '#0369a1', padding: '1px 6px', borderRadius: 4 }}>{u.codigo_unidad}</code>
                        {' '}{u._material?.nombre ?? ''}
                      </span>
                      <button onClick={() => setSelUnidades(p => p.filter(s => s.id_unidad !== u.id_unidad))} style={removeBtn}>✕</button>
                    </div>
                  ))
              }
            </div>

            <div style={{ background: '#f8fafc', borderRadius: 10, padding: 16, border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 12 }}>
                Consumibles / Perecederos (Lotes)
              </div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 10, alignItems: 'flex-end' }}>
                <div style={{ flex: 1 }}>
                  <select value={addLoteId} onChange={e => { setAddLoteId(e.target.value); setAddLoteCant(1) }} style={selectStyle}>
                    <option value="">Seleccionar lote...</option>
                    {lotesConStock
                      .filter(l => !selLotes.find(s => s.id_lote === l.id_lote))
                      .map(l => (
                        <option key={l.id_lote} value={l.id_lote}>
                          {l.codigo_lote} — {l._material?.nombre ?? l.id_material} (disp: {l.cantidad_disponible})
                        </option>
                      ))}
                  </select>
                </div>
                <input
                  type="number" min={1}
                  max={lotesConStock.find(l => l.id_lote === addLoteId)?.cantidad_disponible ?? 9999}
                  value={addLoteCant}
                  onChange={e => setAddLoteCant(Number(e.target.value))}
                  disabled={!addLoteId}
                  style={{ ...inputStyle, width: 80 }}
                  placeholder="Cant."
                />
                <AppButton size="compact" onClick={addLote} disabled={!addLoteId || addLoteCant < 1}>Agregar</AppButton>
              </div>
              {selLotes.length === 0
                ? <p style={{ fontSize: 12, color: '#9ca3af', margin: 0 }}>Sin lotes agregados.</p>
                : selLotes.map(l => (
                    <div key={l.id_lote} style={itemRowStyle}>
                      <span style={{ fontSize: 13 }}>
                        <code style={{ fontSize: 11.5, background: '#fef9c3', color: '#854d0e', padding: '1px 6px', borderRadius: 4 }}>{l.codigo_lote}</code>
                        {' '}{l._material?.nombre ?? ''}{' '}
                        <span style={{ color: '#6b7280' }}>× {l._cantidad}</span>
                      </span>
                      <button onClick={() => setSelLotes(p => p.filter(s => s.id_lote !== l.id_lote))} style={removeBtn}>✕</button>
                    </div>
                  ))
              }
            </div>

            {selUnidades.length === 0 && selLotes.length === 0 && (
              <p style={{ fontSize: 12.5, color: '#f59e0b', margin: 0, textAlign: 'center' }}>
                Debes agregar al menos un ítem para continuar.
              </p>
            )}
          </div>
        )}
      </AppModal>

      <AppModal isOpen={detailOpen} onClose={() => setDetailOpen(false)} title="Detalle de solicitud" maxWidth={620}
        footer={<AppButton variant="ghost" size="compact" onClick={() => setDetailOpen(false)}>Cerrar</AppButton>}>
        {detailSol && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <Row label="Fecha" value={fmtFecha(detailSol.fecha_solicitud)} />
              <Row label="Tipo" value={<Badge variant={TIPOS[detailSol.tipo_prestamo]?.variant ?? 'default'}>{TIPOS[detailSol.tipo_prestamo]?.label ?? detailSol.tipo_prestamo}</Badge>} />
              <Row label="Estado" value={<Badge variant={ESTADOS[detailSol.estado]?.variant ?? 'default'}>{ESTADOS[detailSol.estado]?.label ?? detailSol.estado}</Badge>} />
              <Row label="Ficha" value={detailSol._ficha?.codigo_ficha ?? detailSol.id_ficha} />
              <Row label="Solicitante" value={detailSol._solicitante ? `${detailSol._solicitante.nombres} ${detailSol._solicitante.apellidos}` : detailSol.id_solicitante} />
              {detailSol.observaciones && <Row label="Observaciones" value={detailSol.observaciones} />}
            </div>

            {detailSol._unidades?.length > 0 && (
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 10 }}>
                  Unidades solicitadas
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {detailSol._unidades.map((su, i) => (
                    <div key={i} style={{ ...itemRowStyle, cursor: 'default' }}>
                      <span style={{ fontSize: 13 }}>
                        <code style={{ fontSize: 11.5, background: '#e0f2fe', color: '#0369a1', padding: '1px 6px', borderRadius: 4 }}>
                          {su._unidad?.codigo_unidad ?? su.id_unidad}
                        </code>
                        {' '}{su._material?.nombre ?? ''}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {detailSol._lotes?.length > 0 && (
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 10 }}>
                  Lotes solicitados
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {detailSol._lotes.map((sl, i) => (
                    <div key={i} style={{ ...itemRowStyle, cursor: 'default' }}>
                      <span style={{ fontSize: 13 }}>
                        <code style={{ fontSize: 11.5, background: '#fef9c3', color: '#854d0e', padding: '1px 6px', borderRadius: 4 }}>
                          {sl._lote?.codigo_lote ?? sl.id_lote}
                        </code>
                        {' '}{sl._material?.nombre ?? ''}
                      </span>
                      <span style={{ fontSize: 12, color: '#6b7280' }}>× {sl.cantidad_solicitada}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {detailSol._numItems === 0 && (
              <p style={{ fontSize: 13, color: '#9ca3af', textAlign: 'center' }}>Sin ítems registrados.</p>
            )}
          </div>
        )}
      </AppModal>

      <AppModal isOpen={rejectModal.open} onClose={() => setRejectModal({ open: false, id: '', obs: '' })}
        title="Rechazar solicitud" maxWidth={420}
        footer={<>
          <AppButton variant="ghost" size="compact" onClick={() => setRejectModal({ open: false, id: '', obs: '' })} disabled={actioning}>Cancelar</AppButton>
          <AppButton variant="danger" size="compact" onClick={handleRechazar} loading={actioning}>Rechazar</AppButton>
        </>}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <p style={{ fontSize: 13.5, color: '#374151', margin: 0 }}>
            ¿Seguro que deseas rechazar esta solicitud? Puedes dejar un motivo a continuación.
          </p>
          <div>
            <label style={labelStyle}>Motivo (opcional)</label>
            <textarea rows={3} value={rejectModal.obs}
              onChange={e => setRejectModal(p => ({ ...p, obs: e.target.value }))}
              style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }}
              placeholder="Razón del rechazo..." />
          </div>
        </div>
      </AppModal>

      <ConfirmDialog
        isOpen={confirmAprov.open}
        title="Aprobar solicitud"
        description="¿Confirmas que deseas aprobar esta solicitud?"
        confirmLabel="Aprobar"
        variant="warning"
        loading={actioning}
        onConfirm={handleAprobar}
        onCancel={() => setConfirmAprov({ open: false, id: '' })}
      />

      <ConfirmDialog
        isOpen={confirmDel.open}
        title="Eliminar solicitud"
        description="Esta acción no se puede deshacer. ¿Deseas eliminar la solicitud?"
        confirmLabel="Eliminar"
        variant="danger"
        loading={actioning}
        onConfirm={handleEliminar}
        onCancel={() => setConfirmDel({ open: false, id: '' })}
      />
    </div>
  )
}

const labelStyle = { display: 'block', fontSize: 12.5, fontWeight: 600, color: '#374151', marginBottom: 6 }
const inputStyle  = { width: '100%', padding: '9px 12px', border: '1.5px solid #e5e7eb', borderRadius: 8, fontSize: 13.5, color: '#111827', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.15s' }
const selectStyle = { ...inputStyle, background: '#fff', cursor: 'pointer' }
const itemRowStyle = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 10px', background: '#fff', border: '1px solid #e5e7eb', borderRadius: 7, gap: 8 }
const removeBtn   = { background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: 13, padding: '0 2px', lineHeight: 1, flexShrink: 0, transition: 'color 0.15s' }

function btnStyle(color) {
  return {
    background: 'none', border: 'none', cursor: 'pointer',
    color, padding: '4px 6px', borderRadius: 6,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    transition: 'background 0.15s',
  }
}

function EyeIcon() {
  return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
}
function CheckIcon() {
  return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
}
function XIcon() {
  return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
}
function TrashIcon() {
  return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>
}
