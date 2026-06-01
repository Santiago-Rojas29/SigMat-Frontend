import { useState, useEffect, useMemo, useCallback } from 'react'
import { PageHeader } from '../../components/molecules/PageHeader'
import { DataTable } from '../../components/organisms/DataTable'
import { AppModal } from '../../components/organisms/AppModal'
import { AppButton } from '../../components/atoms/AppButton'
import { Badge } from '../../components/atoms/Badge'
import { AlertBanner } from '../../components/molecules/AlertBanner'
import { useAuth } from '../../context/AuthContext'
import api from '../../services/api'

const ESTADOS = {
  activo:     { label: 'Activo',     variant: 'info'    },
  finalizado: { label: 'Finalizado', variant: 'default' },
}

const COND_DEV = {
  bueno:      { label: 'Bueno',      variant: 'success' },
  'dañado':   { label: 'Dañado',     variant: 'danger'  },
  incompleto: { label: 'Incompleto', variant: 'warning' },
}

const COND_DEV_UNIDAD = {
  bueno:      { label: 'Bueno',      variant: 'success' },
  danado:     { label: 'Dañado',     variant: 'danger'  },
  incompleto: { label: 'Incompleto', variant: 'warning' },
}

const CARDS_DEF = [
  {
    key: null, label: 'Todos', color: '#111827', bg: '#fff', border: '#e5e7eb',
    paths: <><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></>,
  },
  {
    key: 'activo', label: 'Activos', color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe',
    paths: <><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></>,
  },
  {
    key: 'finalizado', label: 'Finalizados', color: '#6b7280', bg: '#f9fafb', border: '#e5e7eb',
    paths: <><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="M9 12l2 2 4-4"/></>,
  },
]

function fmtFecha(val) {
  if (!val) return '—'
  return new Date(val).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })
}

function Row({ label, value }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <span style={{ fontSize: 11, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</span>
      <span style={{ fontSize: 13.5, color: '#111827' }}>{value ?? '—'}</span>
    </div>
  )
}

const CREAR_INIT = { id_solicitud: '', fecha_limite: '', observaciones: '' }
const ENT_INIT   = { fecha_entrega: '', observaciones: '' }
const DEV_INIT   = { fecha_devolucion: '', condicion: 'bueno', observaciones: '' }

export function PrestamosPage() {
  const { user } = useAuth()

  const [prestamos,          setPrestamos]          = useState([])
  const [validaciones,       setValidaciones]       = useState([])
  const [solicitudes,        setSolicitudes]        = useState([])
  const [fichas,             setFichas]             = useState([])
  const [entregas,           setEntregas]           = useState([])
  const [entregaUnidades,    setEntregaUnidades]    = useState([])
  const [entregaLotes,       setEntregaLotes]       = useState([])
  const [devoluciones,       setDevoluciones]       = useState([])
  const [devolucionUnidades, setDevolucionUnidades] = useState([])
  const [solicitudUnidades,  setSolicitudUnidades]  = useState([])
  const [solicitudLotes,     setSolicitudLotes]     = useState([])
  const [usuarios,           setUsuarios]           = useState([])
  const [unidades,           setUnidades]           = useState([])
  const [lotes,              setLotes]              = useState([])
  const [materiales,         setMateriales]         = useState([])
  const [loading,            setLoading]            = useState(true)
  const [error,              setError]              = useState('')

  const [filterKey,  setFilterKey]  = useState(null)

  const [crearOpen,  setCrearOpen]  = useState(false)
  const [crearStep,  setCrearStep]  = useState(1)
  const [crearForm,  setCrearForm]  = useState(CREAR_INIT)
  const [crearSaving,setCrearSaving]= useState(false)

  const [detailOpen, setDetailOpen] = useState(false)
  const [detailPre,  setDetailPre]  = useState(null)

  const [entOpen,    setEntOpen]    = useState(false)
  const [entPre,     setEntPre]     = useState(null)
  const [entForm,    setEntForm]    = useState(ENT_INIT)
  const [entSaving,  setEntSaving]  = useState(false)

  const [devOpen,    setDevOpen]    = useState(false)
  const [devPre,     setDevPre]     = useState(null)
  const [devForm,    setDevForm]    = useState(DEV_INIT)
  const [devUCond,   setDevUCond]   = useState({})
  const [devLCant,   setDevLCant]   = useState({})
  const [devSaving,  setDevSaving]  = useState(false)

  const load = useCallback(async () => {
    try {
      setLoading(true)
      const [pr, va, so, fi, en, eu, el, dv, du, su, sl, us, un, lo, ma] = await Promise.all([
        api.get('/prestamo'),
        api.get('/validacion'),
        api.get('/solicitud'),
        api.get('/ficha'),
        api.get('/entrega'),
        api.get('/entrega-unidad'),
        api.get('/entrega-lote'),
        api.get('/devolucion'),
        api.get('/devolucion-unidad'),
        api.get('/solicitud-unidad'),
        api.get('/solicitud-lote'),
        api.get('/usuario'),
        api.get('/unidad'),
        api.get('/lote'),
        api.get('/material'),
      ])
      setPrestamos(pr.data)
      setValidaciones(va.data)
      setSolicitudes(so.data)
      setFichas(fi.data)
      setEntregas(en.data)
      setEntregaUnidades(eu.data)
      setEntregaLotes(el.data)
      setDevoluciones(dv.data)
      setDevolucionUnidades(du.data)
      setSolicitudUnidades(su.data)
      setSolicitudLotes(sl.data)
      setUsuarios(us.data)
      setUnidades(un.data)
      setLotes(lo.data)
      setMateriales(ma.data)
    } catch {
      setError('Error al cargar los datos')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const prestamosRicos = useMemo(() => prestamos.map(p => {
    const val  = validaciones.find(v => v.id === p.id_validacion)
    const sol  = val ? solicitudes.find(s => s.id_solicitud === val.id_solicitud) : null
    const usu  = usuarios.find(u => u.id === p.id_usuario)
    const fic  = sol ? fichas.find(f => f.id_ficha === sol.id_ficha) : null
    const ent  = entregas.find(e => String(e.id_prestamo) === String(p.id))

    const sUs  = sol ? solicitudUnidades.filter(su => su.id_solicitud === sol.id_solicitud) : []
    const sLs  = sol ? solicitudLotes.filter(sl => sl.id_solicitud === sol.id_solicitud) : []

    let dev = null, eUs = [], eLs = []
    if (ent) {
      dev = devoluciones.find(d => String(d.id_entrega) === String(ent.id_entrega))
      eUs = entregaUnidades.filter(eu => String(eu.id_entrega) === String(ent.id_entrega))
      eLs = entregaLotes.filter(el => String(el.id_entrega) === String(ent.id_entrega))
    }
    const dUs = dev ? devolucionUnidades.filter(du => du.id_devolucion === dev.id) : []

    const enrich = (id_mat) => materiales.find(m => m.id === id_mat)

    return {
      ...p,
      _val:      val,
      _sol:      sol,
      _usu:      usu,
      _fic:      fic,
      _ent:      ent,
      _dev:      dev,
      _tieneEnt: !!ent,
      _tieneDev: !!dev,
      _numItems: sUs.length + sLs.length,
      _sUs: sUs.map(su => { const u = unidades.find(x => x.id_unidad === su.id_unidad); return { ...su, _u: u, _m: enrich(u?.id_material) } }),
      _sLs: sLs.map(sl => { const l = lotes.find(x => x.id_lote === sl.id_lote);       return { ...sl, _l: l, _m: enrich(l?.id_material) } }),
      _eUs: eUs.map(eu => { const u = unidades.find(x => x.id_unidad === eu.id_unidad); return { ...eu, _u: u, _m: enrich(u?.id_material) } }),
      _eLs: eLs.map(el => { const l = lotes.find(x => x.id_lote === el.id_lote);       return { ...el, _l: l, _m: enrich(l?.id_material) } }),
      _dUs: dUs.map(du => { const u = unidades.find(x => x.id_unidad === du.id_unidad); return { ...du, _u: u } }),
    }
  }), [prestamos, validaciones, solicitudes, fichas, entregas, entregaUnidades, entregaLotes,
       devoluciones, devolucionUnidades, solicitudUnidades, solicitudLotes,
       usuarios, unidades, lotes, materiales])

  const counts = useMemo(() => {
    const c = { total: prestamosRicos.length }
    CARDS_DEF.forEach(cd => { if (cd.key) c[cd.key] = prestamosRicos.filter(p => p.estado === cd.key).length })
    return c
  }, [prestamosRicos])

  const filtrados = useMemo(() =>
    filterKey ? prestamosRicos.filter(p => p.estado === filterKey) : prestamosRicos
  , [prestamosRicos, filterKey])

  const solicitudesDisponibles = useMemo(() => {
    const conVal = new Set(validaciones.map(v => v.id_solicitud))
    return solicitudes
      .filter(s => s.estado === 'aprobado' && !conVal.has(s.id_solicitud))
      .map(s => ({
        ...s,
        _solicitante: usuarios.find(u => u.id === s.id_solicitante),
        _ficha: fichas.find(f => f.id_ficha === s.id_ficha),
      }))
  }, [solicitudes, validaciones, usuarios, fichas])

  const solSeleccionada = useMemo(() => {
    if (!crearForm.id_solicitud) return null
    const s = solicitudesDisponibles.find(x => x.id_solicitud === crearForm.id_solicitud)
    if (!s) return null
    const sUs = solicitudUnidades.filter(su => su.id_solicitud === s.id_solicitud).map(su => {
      const u = unidades.find(x => x.id_unidad === su.id_unidad)
      return { ...su, _u: u, _m: materiales.find(m => m.id === u?.id_material) }
    })
    const sLs = solicitudLotes.filter(sl => sl.id_solicitud === s.id_solicitud).map(sl => {
      const l = lotes.find(x => x.id_lote === sl.id_lote)
      return { ...sl, _l: l, _m: materiales.find(m => m.id === l?.id_material) }
    })
    return { ...s, _sUs: sUs, _sLs: sLs }
  }, [crearForm.id_solicitud, solicitudesDisponibles, solicitudUnidades, solicitudLotes, unidades, lotes, materiales])

  const openCrear = () => { setCrearForm(CREAR_INIT); setCrearStep(1); setCrearOpen(true) }
  const openDetalle = (p) => { setDetailPre(p); setDetailOpen(true) }
  const openEntrega = (p) => { setEntPre(p); setEntForm(ENT_INIT); setEntOpen(true) }
  const openDevolucion = (p) => {
    setDevPre(p)
    setDevForm(DEV_INIT)
    const cond = {}; p._eUs.forEach(eu => { cond[eu.id_unidad] = 'bueno' }); setDevUCond(cond)
    const cant = {}; p._eLs.forEach(el => { cant[el.id_lote] = el.cantidad_entregada }); setDevLCant(cant)
    setDevOpen(true)
  }

  const handleCrear = async () => {
    setCrearSaving(true)
    try {
      const solSel = solicitudesDisponibles.find(s => s.id_solicitud === crearForm.id_solicitud)
      const { data: val } = await api.post('/validacion', {
        id_solicitud:     crearForm.id_solicitud,
        id_validador:     user.id,
        fecha_validacion: new Date().toISOString(),
        decision:         'aprobado',
        observaciones:    crearForm.observaciones || 'Préstamo aprobado',
      })
      await api.post('/prestamo', {
        id_usuario:    solSel?.id_solicitante ?? user.id,
        id_validacion: val.id,
        fecha_limite:  new Date(crearForm.fecha_limite).toISOString(),
        estado:        'activo',
      })
      setCrearOpen(false)
      load()
    } catch { setError('Error al crear el préstamo') }
    finally { setCrearSaving(false) }
  }

  const handleEntrega = async () => {
    setEntSaving(true)
    try {
      const { data: ent } = await api.post('/entrega', {
        id_prestamo:   entPre.id,
        id_encargado:  user.id,
        fecha_entrega: new Date(entForm.fecha_entrega).toISOString(),
        observaciones: entForm.observaciones || 'Entrega registrada',
      })
      const entId = String(ent.id_entrega)
      await Promise.all([
        ...entPre._sUs.map(su => api.post('/entrega-unidad', { id_entrega: entId, id_unidad: su.id_unidad })),
        ...entPre._sLs.map(sl => api.post('/entrega-lote', {
          id_entrega: entId, id_lote: sl.id_lote,
          cantidad_entregada: sl.cantidad_solicitada, cantidad_devuelta: 0,
        })),
      ])
      setEntOpen(false); load()
    } catch { setError('Error al registrar la entrega') }
    finally { setEntSaving(false) }
  }

  const handleDevolucion = async () => {
    setDevSaving(true)
    try {
      const entId = String(devPre._ent.id_entrega)
      const { data: dev } = await api.post('/devolucion', {
        id_entrega:       entId,
        fecha_devolucion: new Date(devForm.fecha_devolucion).toISOString(),
        condicion:        devForm.condicion,
        observaciones:    devForm.observaciones || 'Devolución registrada',
      })
      await Promise.all([
        ...devPre._eUs.map(eu => api.post('/devolucion-unidad', {
          id_devolucion: dev.id, id_unidad: eu.id_unidad,
          condicion_devolucion: devUCond[eu.id_unidad] ?? 'bueno',
        })),
        ...devPre._eLs.map(el => api.patch(`/entrega-lote/${entId}/${el.id_lote}`, {
          cantidad_devuelta: devLCant[el.id_lote] ?? 0,
        })),
      ])
      await api.patch(`/prestamo/${devPre.id}`, { estado: 'finalizado' })
      setDevOpen(false); load()
    } catch { setError('Error al registrar la devolución') }
    finally { setDevSaving(false) }
  }

  const columns = [
    { key: 'id', header: 'ID', width: 100, copyable: true, truncateAt: 8, searchable: false },
    {
      key: 'fecha_limite', header: 'Vence',
      render: r => {
        const vencido = r.fecha_limite && new Date(r.fecha_limite) < new Date() && r.estado === 'activo'
        return <span style={{ color: vencido ? '#dc2626' : '#111827', fontWeight: vencido ? 600 : 400 }}>{fmtFecha(r.fecha_limite)}</span>
      },
    },
    {
      key: '_usu', header: 'Solicitante',
      render: r => r._usu ? `${r._usu.nombres} ${r._usu.apellidos}` : r.id_usuario,
    },
    {
      key: '_fic', header: 'Ficha', width: 120,
      render: r => r._fic?.codigo_ficha ?? r._sol?.id_ficha ?? '—',
    },
    {
      key: 'estado', header: 'Estado', width: 110,
      render: r => { const e = ESTADOS[r.estado] ?? { label: r.estado, variant: 'default' }; return <Badge variant={e.variant}>{e.label}</Badge> },
    },
    {
      key: '_ent_col', header: 'Entrega', width: 120,
      render: r => r._tieneEnt ? <Badge variant="success">Entregado</Badge> : <Badge variant="warning">Pendiente</Badge>,
    },
    {
      key: '_dev_col', header: 'Devolución', width: 120,
      render: r => r.estado === 'finalizado'
        ? <Badge variant="default">Devuelto</Badge>
        : r._tieneEnt ? <Badge variant="warning">Pendiente</Badge> : <span style={{ color: '#9ca3af' }}>—</span>,
    },
    {
      key: '_numItems', header: 'Ítems', width: 70, align: 'center',
      render: r => <span style={{ fontWeight: 600, fontSize: 13, color: r._numItems > 0 ? '#2d8000' : '#9ca3af' }}>{r._numItems}</span>,
    },
    {
      key: '_acc', header: 'Acciones', width: 120, searchable: false,
      render: r => (
        <div style={{ display: 'flex', gap: 4 }}>
          <button title="Ver detalle" onClick={() => openDetalle(r)} style={btnSt('#2563eb')}><EyeIc /></button>
          {r.estado === 'activo' && !r._tieneEnt && (
            <button title="Registrar entrega" onClick={() => openEntrega(r)} style={btnSt('#2d8000')}><BoxIc /></button>
          )}
          {r.estado === 'activo' && r._tieneEnt && !r._tieneDev && (
            <button title="Registrar devolución" onClick={() => openDevolucion(r)} style={btnSt('#7c3aed')}><ReturnIc /></button>
          )}
        </div>
      ),
    },
  ]

  return (
    <div>
      <PageHeader title="Préstamos" description="Gestión de préstamos y devoluciones de materiales" />

      {error && <AlertBanner type="error" message={error} onClose={() => setError('')} style={{ marginBottom: 20 }} />}

      <div style={{ display: 'flex', gap: 14, marginBottom: 24, flexWrap: 'wrap' }}>
        {CARDS_DEF.map(card => {
          const count = card.key ? counts[card.key] ?? 0 : counts.total
          const active = filterKey === card.key
          return (
            <button key={String(card.key)} onClick={() => setFilterKey(active ? null : card.key)} style={{
              flex: '1 1 140px', minWidth: 120, display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
              gap: 10, padding: '14px 16px', borderRadius: 12, cursor: 'pointer',
              border: `1.5px solid ${active ? card.color : card.border}`,
              background: active ? card.color : card.bg, transition: 'all 0.18s',
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                stroke={active ? '#fff' : card.color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                {card.paths}
              </svg>
              <div>
                <div style={{ fontSize: 22, fontWeight: 700, color: active ? '#fff' : '#111827', lineHeight: 1 }}>{count}</div>
                <div style={{ fontSize: 11.5, color: active ? 'rgba(255,255,255,0.85)' : '#6b7280', marginTop: 3 }}>{card.label}</div>
              </div>
            </button>
          )
        })}
      </div>

      <DataTable columns={columns} data={filtrados} rowKey="id" loading={loading}
        actions={<AppButton size="compact" onClick={openCrear}>+ Nuevo préstamo</AppButton>}
        emptyMessage="No hay préstamos registrados" />

      {/* ── Crear ── */}
      <AppModal isOpen={crearOpen} onClose={() => setCrearOpen(false)}
        title={crearStep === 1 ? 'Nuevo préstamo — Paso 1 de 2' : 'Nuevo préstamo — Paso 2 de 2'}
        maxWidth={640}
        footer={crearStep === 1
          ? <>
              <AppButton variant="ghost" size="compact" onClick={() => setCrearOpen(false)}>Cancelar</AppButton>
              <AppButton size="compact" onClick={() => setCrearStep(2)}
                disabled={!crearForm.id_solicitud || !crearForm.fecha_limite}>Siguiente →</AppButton>
            </>
          : <>
              <AppButton variant="ghost" size="compact" onClick={() => setCrearStep(1)}>← Atrás</AppButton>
              <AppButton size="compact" onClick={handleCrear} loading={crearSaving}>Crear préstamo</AppButton>
            </>
        }>
        {crearStep === 1 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div>
              <label style={lbl}>Solicitud aprobada *</label>
              {solicitudesDisponibles.length === 0
                ? <p style={{ fontSize: 13, color: '#9ca3af', margin: 0 }}>No hay solicitudes aprobadas pendientes de préstamo.</p>
                : <select value={crearForm.id_solicitud} onChange={e => setCrearForm(p => ({ ...p, id_solicitud: e.target.value }))} style={sel}>
                    <option value="">Seleccionar solicitud...</option>
                    {solicitudesDisponibles.map(s => (
                      <option key={s.id_solicitud} value={s.id_solicitud}>
                        {s.id_solicitud.slice(0, 8)} — {s._solicitante ? `${s._solicitante.nombres} ${s._solicitante.apellidos}` : s.id_solicitante} — {s._ficha?.codigo_ficha ?? s.id_ficha}
                      </option>
                    ))}
                  </select>
              }
            </div>
            <div>
              <label style={lbl}>Fecha límite de devolución *</label>
              <input type="date" value={crearForm.fecha_limite}
                min={new Date().toISOString().slice(0, 10)}
                onChange={e => setCrearForm(p => ({ ...p, fecha_limite: e.target.value }))}
                style={inp} />
            </div>
            <div>
              <label style={lbl}>Observaciones</label>
              <textarea value={crearForm.observaciones}
                onChange={e => setCrearForm(p => ({ ...p, observaciones: e.target.value }))}
                rows={3} style={{ ...inp, resize: 'vertical', fontFamily: 'inherit' }}
                placeholder="Notas sobre el préstamo..." />
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {solSeleccionada && <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, ...cardBg }}>
                <Row label="Solicitante" value={solSeleccionada._solicitante ? `${solSeleccionada._solicitante.nombres} ${solSeleccionada._solicitante.apellidos}` : solSeleccionada.id_solicitante} />
                <Row label="Ficha" value={solSeleccionada._ficha?.codigo_ficha ?? solSeleccionada.id_ficha} />
                <Row label="Tipo" value={solSeleccionada.tipo_prestamo} />
                <Row label="Fecha límite" value={fmtFecha(crearForm.fecha_limite)} />
              </div>
              {solSeleccionada._sUs.length > 0 && (
                <div>
                  <div style={secTit}>Unidades a prestar</div>
                  {solSeleccionada._sUs.map((su, i) => (
                    <div key={i} style={itemRow}>
                      <code style={code('blue')}>{su._u?.codigo_unidad ?? su.id_unidad}</code>
                      <span style={{ fontSize: 13 }}>{su._m?.nombre ?? '—'}</span>
                    </div>
                  ))}
                </div>
              )}
              {solSeleccionada._sLs.length > 0 && (
                <div>
                  <div style={secTit}>Lotes a prestar</div>
                  {solSeleccionada._sLs.map((sl, i) => (
                    <div key={i} style={itemRow}>
                      <code style={code('yellow')}>{sl._l?.codigo_lote ?? sl.id_lote}</code>
                      <span style={{ fontSize: 13, flex: 1 }}>{sl._m?.nombre ?? '—'}</span>
                      <span style={{ fontSize: 12, color: '#6b7280' }}>× {sl.cantidad_solicitada}</span>
                    </div>
                  ))}
                </div>
              )}
              {solSeleccionada._sUs.length === 0 && solSeleccionada._sLs.length === 0 && (
                <p style={{ fontSize: 13, color: '#9ca3af', textAlign: 'center' }}>Sin ítems en esta solicitud.</p>
              )}
            </>}
          </div>
        )}
      </AppModal>

      {/* ── Entrega ── */}
      <AppModal isOpen={entOpen} onClose={() => setEntOpen(false)} title="Registrar entrega" maxWidth={560}
        footer={<>
          <AppButton variant="ghost" size="compact" onClick={() => setEntOpen(false)}>Cancelar</AppButton>
          <AppButton size="compact" onClick={handleEntrega} loading={entSaving} disabled={!entForm.fecha_entrega}>
            Registrar entrega
          </AppButton>
        </>}>
        {entPre && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, ...cardBg }}>
              <Row label="Solicitante" value={entPre._usu ? `${entPre._usu.nombres} ${entPre._usu.apellidos}` : entPre.id_usuario} />
              <Row label="Ficha" value={entPre._fic?.codigo_ficha ?? '—'} />
              <Row label="Fecha límite" value={fmtFecha(entPre.fecha_limite)} />
              <Row label="Ítems" value={`${entPre._numItems} ítem${entPre._numItems !== 1 ? 's' : ''}`} />
            </div>
            <div>
              <label style={lbl}>Fecha de entrega *</label>
              <input type="date" value={entForm.fecha_entrega}
                onChange={e => setEntForm(p => ({ ...p, fecha_entrega: e.target.value }))} style={inp} />
            </div>
            <div>
              <label style={lbl}>Observaciones</label>
              <textarea value={entForm.observaciones}
                onChange={e => setEntForm(p => ({ ...p, observaciones: e.target.value }))}
                rows={3} style={{ ...inp, resize: 'vertical', fontFamily: 'inherit' }}
                placeholder="Notas sobre la entrega..." />
            </div>
            {entPre._sUs.length > 0 && (
              <div>
                <div style={secTit}>Unidades a entregar</div>
                {entPre._sUs.map((su, i) => (
                  <div key={i} style={itemRow}>
                    <code style={code('blue')}>{su._u?.codigo_unidad ?? su.id_unidad}</code>
                    <span style={{ fontSize: 13 }}>{su._m?.nombre ?? '—'}</span>
                  </div>
                ))}
              </div>
            )}
            {entPre._sLs.length > 0 && (
              <div>
                <div style={secTit}>Lotes a entregar</div>
                {entPre._sLs.map((sl, i) => (
                  <div key={i} style={itemRow}>
                    <code style={code('yellow')}>{sl._l?.codigo_lote ?? sl.id_lote}</code>
                    <span style={{ fontSize: 13, flex: 1 }}>{sl._m?.nombre ?? '—'}</span>
                    <span style={{ fontSize: 12, color: '#6b7280' }}>× {sl.cantidad_solicitada}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </AppModal>

      {/* ── Devolución ── */}
      <AppModal isOpen={devOpen} onClose={() => setDevOpen(false)} title="Registrar devolución" maxWidth={640}
        footer={<>
          <AppButton variant="ghost" size="compact" onClick={() => setDevOpen(false)}>Cancelar</AppButton>
          <AppButton size="compact" onClick={handleDevolucion} loading={devSaving} disabled={!devForm.fecha_devolucion}>
            Confirmar devolución
          </AppButton>
        </>}>
        {devPre && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, ...cardBg }}>
              <Row label="Solicitante" value={devPre._usu ? `${devPre._usu.nombres} ${devPre._usu.apellidos}` : devPre.id_usuario} />
              <Row label="Ficha" value={devPre._fic?.codigo_ficha ?? '—'} />
              <Row label="Fecha límite" value={fmtFecha(devPre.fecha_limite)} />
            </div>
            <div>
              <label style={lbl}>Fecha de devolución *</label>
              <input type="date" value={devForm.fecha_devolucion}
                onChange={e => setDevForm(p => ({ ...p, fecha_devolucion: e.target.value }))} style={inp} />
            </div>
            <div>
              <label style={lbl}>Condición general</label>
              <select value={devForm.condicion} onChange={e => setDevForm(p => ({ ...p, condicion: e.target.value }))} style={sel}>
                <option value="bueno">Bueno</option>
                <option value="dañado">Dañado</option>
                <option value="incompleto">Incompleto</option>
              </select>
            </div>
            <div>
              <label style={lbl}>Observaciones</label>
              <textarea value={devForm.observaciones}
                onChange={e => setDevForm(p => ({ ...p, observaciones: e.target.value }))}
                rows={3} style={{ ...inp, resize: 'vertical', fontFamily: 'inherit' }}
                placeholder="Notas sobre la devolución..." />
            </div>
            {devPre._eUs.length > 0 && (
              <div>
                <div style={secTit}>Condición por unidad</div>
                {devPre._eUs.map((eu, i) => (
                  <div key={i} style={{ ...itemRow, gap: 10 }}>
                    <code style={code('blue')}>{eu._u?.codigo_unidad ?? eu.id_unidad}</code>
                    <span style={{ fontSize: 13, flex: 1 }}>{eu._m?.nombre ?? '—'}</span>
                    <select value={devUCond[eu.id_unidad] ?? 'bueno'}
                      onChange={e => setDevUCond(p => ({ ...p, [eu.id_unidad]: e.target.value }))}
                      style={{ ...sel, width: 140, padding: '5px 8px' }}>
                      <option value="bueno">Bueno</option>
                      <option value="danado">Dañado</option>
                      <option value="incompleto">Incompleto</option>
                    </select>
                  </div>
                ))}
              </div>
            )}
            {devPre._eLs.length > 0 && (
              <div>
                <div style={secTit}>Cantidad devuelta por lote</div>
                {devPre._eLs.map((el, i) => (
                  <div key={i} style={{ ...itemRow, gap: 10 }}>
                    <code style={code('yellow')}>{el._l?.codigo_lote ?? el.id_lote}</code>
                    <span style={{ fontSize: 13, flex: 1 }}>{el._m?.nombre ?? '—'}</span>
                    <span style={{ fontSize: 12, color: '#6b7280', flexShrink: 0 }}>de {el.cantidad_entregada}</span>
                    <input type="number" min={0} max={el.cantidad_entregada}
                      value={devLCant[el.id_lote] ?? el.cantidad_entregada}
                      onChange={e => setDevLCant(p => ({ ...p, [el.id_lote]: Number(e.target.value) }))}
                      style={{ ...inp, width: 72 }} />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </AppModal>

      {/* ── Detalle ── */}
      <AppModal isOpen={detailOpen} onClose={() => setDetailOpen(false)} title="Detalle del préstamo" maxWidth={680}
        footer={<AppButton variant="ghost" size="compact" onClick={() => setDetailOpen(false)}>Cerrar</AppButton>}>
        {detailPre && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div>
              <div style={secTit}>Información general</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <Row label="ID" value={<code style={{ fontSize: 11.5 }}>{detailPre.id}</code>} />
                <Row label="Estado" value={<Badge variant={ESTADOS[detailPre.estado]?.variant ?? 'default'}>{ESTADOS[detailPre.estado]?.label ?? detailPre.estado}</Badge>} />
                <Row label="Solicitante" value={detailPre._usu ? `${detailPre._usu.nombres} ${detailPre._usu.apellidos}` : detailPre.id_usuario} />
                <Row label="Ficha" value={detailPre._fic?.codigo_ficha ?? '—'} />
                <Row label="Tipo solicitud" value={detailPre._sol?.tipo_prestamo ?? '—'} />
                <Row label="Fecha límite" value={fmtFecha(detailPre.fecha_limite)} />
                {detailPre._val?.observaciones && <Row label="Observaciones" value={detailPre._val.observaciones} />}
              </div>
            </div>

            {(detailPre._sUs.length > 0 || detailPre._sLs.length > 0) && (
              <div>
                <div style={secTit}>Ítems solicitados</div>
                {detailPre._sUs.map((su, i) => (
                  <div key={i} style={itemRow}>
                    <code style={code('blue')}>{su._u?.codigo_unidad ?? su.id_unidad}</code>
                    <span style={{ fontSize: 13 }}>{su._m?.nombre ?? '—'}</span>
                  </div>
                ))}
                {detailPre._sLs.map((sl, i) => (
                  <div key={i} style={itemRow}>
                    <code style={code('yellow')}>{sl._l?.codigo_lote ?? sl.id_lote}</code>
                    <span style={{ fontSize: 13, flex: 1 }}>{sl._m?.nombre ?? '—'}</span>
                    <span style={{ fontSize: 12, color: '#6b7280' }}>× {sl.cantidad_solicitada}</span>
                  </div>
                ))}
              </div>
            )}

            {detailPre._ent && (
              <div>
                <div style={secTit}>Entrega</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 10 }}>
                  <Row label="Fecha entrega" value={fmtFecha(detailPre._ent.fecha_entrega)} />
                  <Row label="Observaciones" value={detailPre._ent.observaciones} />
                </div>
                {detailPre._eUs.map((eu, i) => (
                  <div key={i} style={itemRow}>
                    <code style={code('blue')}>{eu._u?.codigo_unidad ?? eu.id_unidad}</code>
                    <span style={{ fontSize: 13 }}>{eu._m?.nombre ?? '—'}</span>
                  </div>
                ))}
                {detailPre._eLs.map((el, i) => (
                  <div key={i} style={itemRow}>
                    <code style={code('yellow')}>{el._l?.codigo_lote ?? el.id_lote}</code>
                    <span style={{ fontSize: 13, flex: 1 }}>{el._m?.nombre ?? '—'}</span>
                    <span style={{ fontSize: 12, color: '#6b7280' }}>Entregado: {el.cantidad_entregada} · Devuelto: {el.cantidad_devuelta}</span>
                  </div>
                ))}
              </div>
            )}

            {detailPre._dev && (
              <div>
                <div style={secTit}>Devolución</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 10 }}>
                  <Row label="Fecha devolución" value={fmtFecha(detailPre._dev.fecha_devolucion)} />
                  <Row label="Condición" value={
                    <Badge variant={COND_DEV[detailPre._dev.condicion]?.variant ?? 'default'}>
                      {COND_DEV[detailPre._dev.condicion]?.label ?? detailPre._dev.condicion}
                    </Badge>
                  } />
                  {detailPre._dev.observaciones && <Row label="Observaciones" value={detailPre._dev.observaciones} />}
                </div>
                {detailPre._dUs.length > 0 && (
                  <>
                    <div style={{ fontSize: 11, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>
                      Condición por unidad
                    </div>
                    {detailPre._dUs.map((du, i) => (
                      <div key={i} style={itemRow}>
                        <code style={code('blue')}>{du._u?.codigo_unidad ?? du.id_unidad}</code>
                        <span style={{ fontSize: 13, flex: 1 }}>{du._u ? '' : ''}</span>
                        <Badge variant={COND_DEV_UNIDAD[du.condicion_devolucion]?.variant ?? 'default'}>
                          {COND_DEV_UNIDAD[du.condicion_devolucion]?.label ?? du.condicion_devolucion}
                        </Badge>
                      </div>
                    ))}
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </AppModal>
    </div>
  )
}

const lbl  = { display: 'block', fontSize: 12.5, fontWeight: 600, color: '#374151', marginBottom: 6 }
const inp  = { width: '100%', padding: '9px 12px', border: '1.5px solid #e5e7eb', borderRadius: 8, fontSize: 13.5, color: '#111827', outline: 'none', boxSizing: 'border-box' }
const sel  = { ...inp, background: '#fff', cursor: 'pointer' }
const cardBg = { background: '#f8fafc', padding: 14, borderRadius: 10, border: '1px solid #e2e8f0' }
const secTit = { fontSize: 11.5, fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 8, paddingBottom: 6, borderBottom: '1px solid #f3f4f6' }
const itemRow = { display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', background: '#fff', border: '1px solid #e5e7eb', borderRadius: 7, marginBottom: 4 }

function code(color) {
  const p = color === 'blue' ? { bg: '#e0f2fe', c: '#0369a1' } : { bg: '#fef9c3', c: '#854d0e' }
  return { fontSize: 11.5, background: p.bg, color: p.c, padding: '1px 6px', borderRadius: 4, flexShrink: 0 }
}
function btnSt(color) {
  return { background: 'none', border: 'none', cursor: 'pointer', color, padding: '4px 6px', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }
}
function EyeIc() {
  return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
}
function BoxIc() {
  return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 002 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
}
function ReturnIc() {
  return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="7 8 3 12 7 16"/><path d="M21 12H3"/></svg>
}
