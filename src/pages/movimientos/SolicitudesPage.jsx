import { useState, useEffect, useMemo, useCallback } from 'react'
import { PageHeader }    from '../../components/molecules/PageHeader'
import { DataTable }     from '../../components/organisms/DataTable'
import { AppModal }      from '../../components/organisms/AppModal'
import { AppButton }     from '../../components/atoms/AppButton'
import { Badge }         from '../../components/atoms/Badge'
import { ConfirmDialog } from '../../components/molecules/ConfirmDialog'
import { AlertBanner }   from '../../components/molecules/AlertBanner'
import { useAuth }       from '../../context/AuthContext'
import { usePermissions } from '../../context/PermissionsContext'
import api               from '../../services/api'
import { AppIcon }        from '../../components/atoms/AppIcon'

// ── Constants ────────────────────────────────────────────────────────────────

const ESTADOS = {
  pendiente_instructor: { label: 'Pend. Instructor',    variant: 'warning' },
  pendiente_admin:      { label: 'Pend. Administrador', variant: 'warning' },
  pendiente_bodega:     { label: 'Pend. Bodega',        variant: 'info'    },
  aprobado:             { label: 'Aprobado',             variant: 'success' },
  entregado:            { label: 'Entregado',            variant: 'success' },
  rechazado:            { label: 'Rechazado',            variant: 'danger'  },
  cancelado:            { label: 'Cancelado',            variant: 'default' },
}

const FLUJOS = {
  instructor: { label: 'Instructor',  variant: 'info'    },
  aprendiz:   { label: 'Aprendiz',    variant: 'warning' },
}

const TIPOS = {
  interno: { label: 'Interno', variant: 'default' },
  externo: { label: 'Externo', variant: 'warning' },
}

const PENDIENTES = ['pendiente_instructor', 'pendiente_admin', 'pendiente_bodega']
const TERMINALES = ['entregado', 'rechazado', 'cancelado']

const FILTER_CARDS = [
  {
    key: null, label: 'Todas', color: '#111827', bg: '#fff', border: '#e5e7eb',
    paths: <><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></>,
  },
  {
    key: 'en_proceso', label: 'En proceso', color: '#d97706', bg: '#fffbeb', border: '#fde68a',
    paths: <><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></>,
  },
  {
    key: 'aprobado', label: 'Aprobadas', color: '#2d8000', bg: '#f0fdf4', border: '#bbf7d0',
    paths: <><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></>,
  },
  {
    key: 'entregado', label: 'Entregadas', color: '#0d9488', bg: '#f0fdfa', border: '#99f6e4',
    paths: <><polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><path d="M12 22V7"/><path d="M12 7H7.5a2.5 2.5 0 010-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 000-5C13 2 12 7 12 7z"/></>,
  },
  {
    key: 'rechazado', label: 'Rechazadas', color: '#dc2626', bg: '#fef2f2', border: '#fecaca',
    paths: <><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></>,
  },
  {
    key: 'cancelado', label: 'Canceladas', color: '#6b7280', bg: '#f9fafb', border: '#e5e7eb',
    paths: <><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></>,
  },
]

const FORM_INIT = {
  tipo_flujo: 'instructor',
  tipo_prestamo: 'interno',
  id_instructor: '',
  id_bodega: '',
  observaciones: '',
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function fmtFecha(val) {
  if (!val) return '—'
  return new Date(val).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })
}

function fmtNombre(u) {
  if (!u) return '—'
  return `${u.nombres ?? ''} ${u.apellidos ?? ''}`.trim() || u.correo
}

function Row({ label, value }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <span style={{ fontSize: 11, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</span>
      <span style={{ fontSize: 13.5, color: '#111827' }}>{value ?? '—'}</span>
    </div>
  )
}

// ── Styles ───────────────────────────────────────────────────────────────────

const labelStyle  = { display: 'block', fontSize: 12.5, fontWeight: 600, color: '#374151', marginBottom: 6 }
const inputStyle  = { width: '100%', padding: '9px 12px', border: '1.5px solid #e5e7eb', borderRadius: 8, fontSize: 13.5, color: '#111827', outline: 'none', boxSizing: 'border-box' }
const selectStyle = { ...inputStyle, background: '#fff', cursor: 'pointer' }
const itemRowStyle = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 10px', background: '#fff', border: '1px solid #e5e7eb', borderRadius: 7, gap: 8 }
const removeBtn   = { background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: 13, padding: '0 2px', lineHeight: 1 }

function btnStyle(color) {
  return { background: 'none', border: 'none', cursor: 'pointer', color, padding: '4px 6px', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.15s' }
}

// ── Page ─────────────────────────────────────────────────────────────────────

export function SolicitudesPage() {
  const { user }        = useAuth()
  const { hasPermission } = usePermissions()
  const isAdmin         = hasPermission('administracion')

  // ── Data ──────────────────────────────────────────────────────────────────

  const [solicitudes,      setSolicitudes]      = useState([])
  const [solicitudLotes,   setSolicitudLotes]   = useState([])
  const [solicitudUnidades,setSolicitudUnidades] = useState([])
  const [usuarios,         setUsuarios]         = useState([])
  const [roles,            setRoles]            = useState([])
  const [lotes,            setLotes]            = useState([])
  const [unidades,         setUnidades]         = useState([])
  const [materiales,       setMateriales]       = useState([])
  const [loading,          setLoading]          = useState(true)
  const [error,            setError]            = useState('')

  // ── UI state ──────────────────────────────────────────────────────────────

  const [filterKey,    setFilterKey]    = useState(null)
  const [modalOpen,    setModalOpen]    = useState(false)
  const [detailOpen,   setDetailOpen]   = useState(false)
  const [detailSol,    setDetailSol]    = useState(null)
  const [step,         setStep]         = useState(1)
  const [form,         setForm]         = useState(FORM_INIT)
  const [saving,       setSaving]       = useState(false)

  const [selUnidades,  setSelUnidades]  = useState([])
  const [selLotes,     setSelLotes]     = useState([])
  const [addUnidadId,  setAddUnidadId]  = useState('')
  const [addLoteId,    setAddLoteId]    = useState('')
  const [addLoteCant,  setAddLoteCant]  = useState(1)

  const [rejectModal,   setRejectModal]   = useState({ open: false, id: '', motivo: '' })
  const [confirmModal,  setConfirmModal]  = useState({ open: false, id: '', type: '', body: null, title: '', desc: '', variant: 'primary' })
  const [entregarModal, setEntregarModal] = useState({ open: false, id: '', sol: null })
  const [entregarForm,  setEntregarForm]  = useState({ fecha_limite: '', observaciones: '' })
  const [actioning,     setActioning]     = useState(false)

  // ── Load ──────────────────────────────────────────────────────────────────

  const load = useCallback(async () => {
    try {
      setLoading(true)
      const [s, sl, su, u, r, l, un, m] = await Promise.all([
        api.get('/solicitud'),
        api.get('/solicitud-lote'),
        api.get('/solicitud-unidad'),
        api.get('/usuario'),
        api.get('/rol'),
        api.get('/lote'),
        api.get('/unidad'),
        api.get('/material'),
      ])
      setSolicitudes(s.data)
      setSolicitudLotes(sl.data)
      setSolicitudUnidades(su.data)
      setUsuarios(u.data)
      setRoles(r.data)
      setLotes(l.data)
      setUnidades(un.data)
      setMateriales(m.data)
    } catch {
      setError('Error al cargar los datos')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  // ── Derived ───────────────────────────────────────────────────────────────

  const myRoleName = useMemo(() => {
    if (!user) return null
    return roles.find(r => r.id === user.id_rol)?.nombre ?? null
  }, [roles, user])

  const isInstructorBodega = myRoleName === 'InstructorBodega'

  const instructores = useMemo(() => {
    const rolInstructor = roles.find(r => r.nombre === 'Instructor')
    if (!rolInstructor) return []
    return usuarios.filter(u => u.id_rol === rolInstructor.id)
  }, [usuarios, roles])

  const instructoresBodega = useMemo(() => {
    const rolBodega = roles.find(r => r.nombre === 'InstructorBodega')
    if (!rolBodega) return []
    return usuarios.filter(u => u.id_rol === rolBodega.id)
  }, [usuarios, roles])

  const solicitudesRicas = useMemo(() => solicitudes.map(s => {
    const _solicitante = usuarios.find(u => u.id === s.id_solicitante)
    const _instructor  = usuarios.find(u => u.id === s.id_instructor)
    const _admin       = usuarios.find(u => u.id === s.id_admin)
    const _bodega      = usuarios.find(u => u.id === s.id_bodega)
    return {
      ...s,
      _solicitante,
      _instructor,
      _admin,
      _bodega,
      _solicitanteNombre: fmtNombre(_solicitante),
      _destinoNombre: s.tipo_flujo === 'aprendiz' ? fmtNombre(_instructor) : fmtNombre(_bodega),
      _lotes:    solicitudLotes
        .filter(sl => sl.id_solicitud === s.id_solicitud)
        .map(sl => ({ ...sl, _lote: lotes.find(l => l.id_lote === sl.id_lote), _material: materiales.find(m => m.id === lotes.find(l => l.id_lote === sl.id_lote)?.id_material) })),
      _unidades: solicitudUnidades
        .filter(su => su.id_solicitud === s.id_solicitud)
        .map(su => ({ ...su, _unidad: unidades.find(u => u.id_unidad === su.id_unidad), _material: materiales.find(m => m.id === unidades.find(u => u.id_unidad === su.id_unidad)?.id_material) })),
    }
  }), [solicitudes, solicitudLotes, solicitudUnidades, usuarios, lotes, unidades, materiales])

  const counts = useMemo(() => {
    const base = { total: solicitudesRicas.length, en_proceso: 0 }
    solicitudesRicas.forEach(s => {
      if (PENDIENTES.includes(s.estado)) base.en_proceso = (base.en_proceso ?? 0) + 1
      else base[s.estado] = (base[s.estado] ?? 0) + 1
    })
    return base
  }, [solicitudesRicas])

  const datosFiltrados = useMemo(() => {
    if (!filterKey) return solicitudesRicas
    if (filterKey === 'en_proceso') return solicitudesRicas.filter(s => PENDIENTES.includes(s.estado))
    return solicitudesRicas.filter(s => s.estado === filterKey)
  }, [solicitudesRicas, filterKey])

  const unidadesDisponibles = useMemo(() =>
    unidades.filter(u => u.estado === 'disponible').map(u => ({ ...u, _material: materiales.find(m => m.id === u.id_material) }))
  , [unidades, materiales])

  const lotesConStock = useMemo(() =>
    lotes.filter(l => l.cantidad_disponible > 0).map(l => ({ ...l, _material: materiales.find(m => m.id === l.id_material) }))
  , [lotes, materiales])

  // ── Per-row permissions ───────────────────────────────────────────────────

  function getPerms(sol) {
    const isMine  = sol.id_solicitante === user?.id
    const nonTerm = !TERMINALES.includes(sol.estado)
    const canAprovBodega = isInstructorBodega && sol.estado === 'pendiente_bodega' &&
                           (sol.id_bodega === null || sol.id_bodega === user?.id)
    const isBodegaAsignada = isInstructorBodega && sol.id_bodega === user?.id

    return {
      canCancel:             isMine && nonTerm && sol.estado !== 'aprobado',
      canAprobarInstructor:  sol.id_instructor === user?.id && sol.estado === 'pendiente_instructor',
      canAprobarAdmin:       isAdmin && sol.estado === 'pendiente_admin',
      canAprobarBodega:      canAprovBodega,
      canEntregar:           isBodegaAsignada && sol.estado === 'aprobado',
      canRechazar:
        (sol.id_instructor === user?.id && sol.estado === 'pendiente_instructor') ||
        (isAdmin && sol.estado === 'pendiente_admin') ||
        canAprovBodega ||
        (isBodegaAsignada && sol.estado === 'aprobado'),
    }
  }

  // ── Actions ───────────────────────────────────────────────────────────────

  const doAction = async (url, body) => {
    setActioning(true)
    try {
      if (body) await api.patch(url, body)
      else      await api.patch(url)
      setConfirmModal(p => ({ ...p, open: false }))
      setRejectModal({ open: false, id: '', motivo: '' })
      load()
    } catch (err) {
      const msg = err?.response?.data?.message
      setError(Array.isArray(msg) ? msg.join('. ') : (msg ?? 'Error al procesar la acción'))
    } finally { setActioning(false) }
  }

  const openConfirm = (id, type, title, desc, body = null, variant = 'primary') =>
    setConfirmModal({ open: true, id, type, title, desc, body, variant })

  const handleConfirm = () => doAction(
    `/solicitud/${confirmModal.id}/${confirmModal.type}`,
    confirmModal.body,
  )

  const handleRechazar = () => {
    const rol = myRoleName === 'InstructorBodega' ? 'bodega' : isAdmin ? 'admin' : 'instructor'
    doAction(`/solicitud/${rejectModal.id}/rechazar`, {
      rol,
      motivo_rechazo: rejectModal.motivo || undefined,
    })
  }

  const handleEntregar = async () => {
    const tieneUnidades = (entregarModal.sol?._unidades?.length ?? 0) > 0
    if (tieneUnidades && !entregarForm.fecha_limite) {
      setError('Debes seleccionar una fecha límite de devolución')
      return
    }
    setActioning(true)
    try {
      const payload = {
        id_bodega:     user.id,
        observaciones: entregarForm.observaciones || undefined,
      }
      if (tieneUnidades && entregarForm.fecha_limite) payload.fecha_limite = entregarForm.fecha_limite

      const { data: res } = await api.patch(`/solicitud/${entregarModal.id}/entregar`, payload)
      setEntregarModal({ open: false, id: '', sol: null })
      setEntregarForm({ fecha_limite: '', observaciones: '' })
      load()
      if (res.requiere_devolucion === false) {
        setError('')
      }
    } catch (err) {
      const msg = err?.response?.data?.message
      setError(Array.isArray(msg) ? msg.join('. ') : (msg ?? 'Error al registrar la entrega'))
    } finally { setActioning(false) }
  }

  // ── Create ────────────────────────────────────────────────────────────────

  const openCreate = () => {
    const tipoFlujoAuto = myRoleName === 'Aprendiz' ? 'aprendiz' : 'instructor'
    setForm({ ...FORM_INIT, tipo_flujo: tipoFlujoAuto })
    setSelUnidades([])
    setSelLotes([])
    setAddUnidadId('')
    setAddLoteId('')
    setAddLoteCant(1)
    setStep(1)
    setModalOpen(true)
  }

  const closeModal = () => { setModalOpen(false); setStep(1) }

  const step1Valid = () => {
    if (!form.tipo_flujo || !form.tipo_prestamo) return false
    if (form.tipo_flujo === 'aprendiz' && !form.id_instructor)  return false
    if (form.tipo_flujo === 'instructor' && !form.id_bodega)    return false
    return true
  }

  const addUnidad = () => {
    const u = unidadesDisponibles.find(u => u.id_unidad === addUnidadId)
    if (!u || selUnidades.find(s => s.id_unidad === u.id_unidad)) return
    setSelUnidades(p => [...p, u])
    setAddUnidadId('')
  }

  const addLote = () => {
    const l = lotesConStock.find(l => l.id_lote === addLoteId)
    if (!l || selLotes.find(s => s.id_lote === l.id_lote)) return
    const cant = Math.max(1, Math.min(addLoteCant, l.cantidad_disponible))
    setSelLotes(p => [...p, { ...l, _cantidad: cant }])
    setAddLoteId('')
    setAddLoteCant(1)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const payload = {
        id_solicitante: user.id,
        tipo_flujo:     form.tipo_flujo,
        tipo_prestamo:  form.tipo_prestamo,
        observaciones:  form.observaciones || undefined,
      }
      if (form.tipo_flujo === 'aprendiz')    payload.id_instructor = form.id_instructor
      if (form.tipo_flujo === 'instructor')  payload.id_bodega     = form.id_bodega

      const { data: sol } = await api.post('/solicitud', payload)

      await Promise.all([
        ...selUnidades.map(u => api.post('/solicitud-unidad', { id_solicitud: sol.id_solicitud, id_unidad: u.id_unidad, id_usuario: user.id })),
        ...selLotes.map(l => api.post('/solicitud-lote',    { id_solicitud: sol.id_solicitud, id_lote: l.id_lote, cantidad_solicitada: l._cantidad, id_usuario: user.id })),
      ])
      closeModal()
      load()
    } catch (err) {
      const msg = err?.response?.data?.message
      setError(Array.isArray(msg) ? msg.join('. ') : (msg ?? 'Error al crear la solicitud'))
    } finally {
      setSaving(false)
    }
  }

  // ── Table columns ─────────────────────────────────────────────────────────

  const columns = [
    {
      key: 'fecha_solicitud', header: 'Fecha', width: 110,
      render: r => fmtFecha(r.fecha_solicitud),
    },
    {
      key: 'tipo_flujo', header: 'Flujo', width: 105,
      render: r => {
        const f = FLUJOS[r.tipo_flujo] ?? { label: r.tipo_flujo, variant: 'default' }
        return <Badge variant={f.variant}>{f.label}</Badge>
      },
    },
    {
      key: 'tipo_prestamo', header: 'Tipo', width: 90,
      render: r => {
        const t = TIPOS[r.tipo_prestamo] ?? { label: r.tipo_prestamo, variant: 'default' }
        return <Badge variant={t.variant}>{t.label}</Badge>
      },
    },
    {
      key: 'estado', header: 'Estado', width: 160,
      render: r => {
        const e = ESTADOS[r.estado] ?? { label: r.estado, variant: 'default' }
        return <Badge variant={e.variant}>{e.label}</Badge>
      },
    },
    {
      key: '_solicitanteNombre', header: 'Solicitante',
      render: r => fmtNombre(r._solicitante),
    },
    {
      key: '_destinoNombre', header: 'Dirigido a',
      render: r => {
        if (r.tipo_flujo === 'aprendiz' && r._instructor)  return fmtNombre(r._instructor)
        if (r.tipo_flujo === 'instructor' && r._bodega)    return fmtNombre(r._bodega)
        return '—'
      },
    },
    {
      key: '_acciones', header: 'Acciones', width: 180, searchable: false,
      render: r => {
        const p = getPerms(r)
        return (
          <div style={{ display: 'flex', gap: 4 }}>
            <button title="Ver detalle" onClick={() => { setDetailSol(r); setDetailOpen(true) }} style={btnStyle('#2563eb')}>
              <AppIcon name="eye" size={15} />
            </button>
            {p.canAprobarInstructor && (
              <button title="Aprobar como Instructor" onClick={() => openConfirm(r.id_solicitud, 'aprobar-instructor', 'Aprobar como Instructor', '¿Confirmas que apruebas esta solicitud y la envías a bodega?')} style={btnStyle('#2d8000')}>
                <AppIcon name="check" size={15} />
              </button>
            )}
            {p.canAprobarAdmin && (
              <button title="Aprobar como Administrador" onClick={() => openConfirm(r.id_solicitud, 'aprobar-admin', 'Aprobar como Administrador', '¿Confirmas que apruebas esta solicitud y la envías a bodega?', { id_admin: user.id })} style={btnStyle('#2d8000')}>
                <AppIcon name="check" size={15} />
              </button>
            )}
            {p.canAprobarBodega && (
              <button title="Aprobar y registrar como Bodega" onClick={() => openConfirm(r.id_solicitud, 'aprobar-bodega', 'Aprobar — Bodega', '¿Confirmas la disponibilidad del material y apruebas la solicitud?', { id_bodega: user.id })} style={btnStyle('#2d8000')}>
                <AppIcon name="check" size={15} />
              </button>
            )}
            {p.canEntregar && (
              <button title="Registrar entrega y crear préstamo" onClick={() => { setEntregarModal({ open: true, id: r.id_solicitud }); setEntregarForm({ fecha_limite: '', observaciones: '' }) }} style={btnStyle('#0d9488')}>
                <AppIcon name="package" size={15} />
              </button>
            )}
            {p.canRechazar && (
              <button title="Rechazar" onClick={() => setRejectModal({ open: true, id: r.id_solicitud, motivo: '' })} style={btnStyle('#d97706')}>
                <AppIcon name="x" size={15} />
              </button>
            )}
            {p.canCancel && (
              <button title="Cancelar mi solicitud" onClick={() => openConfirm(r.id_solicitud, 'cancelar', 'Cancelar solicitud', '¿Seguro que deseas cancelar esta solicitud? Esta acción no se puede deshacer.', null, 'danger')} style={btnStyle('#6b7280')}>
                <AppIcon name="ban" size={15} />
              </button>
            )}
          </div>
        )
      },
    },
  ]

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div>
      <PageHeader title="Solicitudes" description="Gestión de solicitudes de préstamo de materiales" />

      {error && <AlertBanner type="error" message={error} onClose={() => setError('')} style={{ marginBottom: 20 }} />}

      {/* Filter cards */}
      <div style={{ display: 'flex', gap: 14, marginBottom: 24, flexWrap: 'wrap' }}>
        {FILTER_CARDS.map(card => {
          const count = card.key ? counts[card.key] ?? 0 : counts.total
          const isActive = filterKey === card.key
          return (
            <button
              key={String(card.key)}
              onClick={() => setFilterKey(isActive ? null : card.key)}
              style={{
                flex: '1 1 100px', minWidth: 100, display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
                gap: 10, padding: '14px 16px', borderRadius: 12, cursor: 'pointer',
                border: `1.5px solid ${isActive ? card.color : card.border}`,
                background: isActive ? card.color : card.bg,
                transition: 'all 0.18s',
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                stroke={isActive ? '#fff' : card.color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
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
        onRetry={load}
        searchable
        searchPlaceholder="Buscar por solicitante, estado, flujo, tipo…"
        pageSize={10}
        actions={<AppButton size="compact" onClick={openCreate}>+ Nueva solicitud</AppButton>}
        emptyTitle="Sin solicitudes"
        emptyDescription="No hay solicitudes en esta categoría."
      />

      {/* ── Create modal ─────────────────────────────────────────────────── */}
      <AppModal
        isOpen={modalOpen}
        onClose={closeModal}
        title={step === 1 ? 'Nueva solicitud — Paso 1 de 2' : 'Nueva solicitud — Paso 2 de 2'}
        maxWidth={640}
        footer={
          step === 1
            ? <>
                <AppButton variant="ghost" size="compact" onClick={closeModal}>Cancelar</AppButton>
                <AppButton size="compact" onClick={() => setStep(2)} disabled={!step1Valid()}>
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
            {/* Tipo de flujo — auto-detectado por rol */}
            <div>
              <label style={labelStyle}>Tipo de flujo</label>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '12px 16px', borderRadius: 10,
                background: '#f0fdf4', border: '2px solid #bbf7d0',
              }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2d8000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/>
                </svg>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#166534' }}>
                    {form.tipo_flujo === 'aprendiz' ? 'Aprendiz → Instructor' : 'Instructor → Bodega'}
                  </div>
                  <div style={{ fontSize: 11.5, color: '#4b7c45', marginTop: 1 }}>
                    Detectado automáticamente según tu rol: <strong>{myRoleName ?? 'desconocido'}</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Tipo de préstamo */}
            <div>
              <label style={labelStyle}>Tipo de préstamo *</label>
              <select value={form.tipo_prestamo} onChange={e => setForm(p => ({ ...p, tipo_prestamo: e.target.value }))} style={selectStyle}>
                <option value="interno">Interno — InstructorBodega aprueba directamente</option>
                <option value="externo">Externo — pasa por Administrador primero</option>
              </select>
            </div>

            {/* Conditional user selector */}
            {form.tipo_flujo === 'aprendiz' && (
              <div>
                <label style={labelStyle}>Instructor de mi grupo *</label>
                <select value={form.id_instructor} onChange={e => setForm(p => ({ ...p, id_instructor: e.target.value }))} style={selectStyle}>
                  <option value="">Seleccionar instructor...</option>
                  {instructores.map(u => (
                    <option key={u.id} value={u.id}>{fmtNombre(u)}</option>
                  ))}
                </select>
                {instructores.length === 0 && (
                  <p style={{ fontSize: 12, color: '#d97706', marginTop: 4 }}>No hay instructores disponibles en el sistema.</p>
                )}
              </div>
            )}

            {form.tipo_flujo === 'instructor' && (
              <div>
                <label style={labelStyle}>Instructor responsable de Bodega *</label>
                <select value={form.id_bodega} onChange={e => setForm(p => ({ ...p, id_bodega: e.target.value }))} style={selectStyle}>
                  <option value="">Seleccionar InstructorBodega...</option>
                  {instructoresBodega.map(u => (
                    <option key={u.id} value={u.id}>{fmtNombre(u)}</option>
                  ))}
                </select>
                {instructoresBodega.length === 0 && (
                  <p style={{ fontSize: 12, color: '#d97706', marginTop: 4 }}>No hay InstructoresBodega registrados. Pide al administrador que cree uno.</p>
                )}
              </div>
            )}

            {/* Solicitante (read-only) */}
            <div>
              <label style={labelStyle}>Solicitante</label>
              <input
                value={user ? `${user.nombres ?? ''} ${user.apellidos ?? ''}`.trim() || user.correo : ''}
                disabled
                style={{ ...inputStyle, background: '#f9fafb', color: '#6b7280' }}
              />
            </div>

            {/* Observaciones */}
            <div>
              <label style={labelStyle}>Observaciones (opcional)</label>
              <textarea
                value={form.observaciones}
                onChange={e => setForm(p => ({ ...p, observaciones: e.target.value }))}
                rows={3}
                style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }}
                placeholder="Motivo o detalles de la solicitud..."
              />
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* Unidades */}
            <div style={{ background: '#f8fafc', borderRadius: 10, padding: 16, border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 12 }}>
                Activos — Unidades (no consumibles)
              </div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                <select value={addUnidadId} onChange={e => setAddUnidadId(e.target.value)} style={{ ...selectStyle, flex: 1 }}>
                  <option value="">Seleccionar unidad disponible...</option>
                  {unidadesDisponibles.filter(u => !selUnidades.find(s => s.id_unidad === u.id_unidad)).map(u => (
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

            {/* Lotes */}
            <div style={{ background: '#f8fafc', borderRadius: 10, padding: 16, border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 12 }}>
                Consumibles / Perecederos — Lotes
              </div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 10, alignItems: 'flex-end' }}>
                <div style={{ flex: 1 }}>
                  <select value={addLoteId} onChange={e => { setAddLoteId(e.target.value); setAddLoteCant(1) }} style={selectStyle}>
                    <option value="">Seleccionar lote con stock...</option>
                    {lotesConStock.filter(l => !selLotes.find(s => s.id_lote === l.id_lote)).map(l => (
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
                Agrega al menos un ítem para continuar.
              </p>
            )}
          </div>
        )}
      </AppModal>

      {/* ── Detail modal ─────────────────────────────────────────────────── */}
      <AppModal
        isOpen={detailOpen}
        onClose={() => setDetailOpen(false)}
        title="Detalle de solicitud"
        maxWidth={640}
        footer={<AppButton variant="ghost" size="compact" onClick={() => setDetailOpen(false)}>Cerrar</AppButton>}
      >
        {detailSol && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Header info */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <Row label="Fecha solicitud"  value={fmtFecha(detailSol.fecha_solicitud)} />
              <Row label="Estado"           value={<Badge variant={ESTADOS[detailSol.estado]?.variant ?? 'default'}>{ESTADOS[detailSol.estado]?.label ?? detailSol.estado}</Badge>} />
              <Row label="Flujo"            value={<Badge variant={FLUJOS[detailSol.tipo_flujo]?.variant ?? 'default'}>{FLUJOS[detailSol.tipo_flujo]?.label ?? detailSol.tipo_flujo}</Badge>} />
              <Row label="Tipo préstamo"    value={<Badge variant={TIPOS[detailSol.tipo_prestamo]?.variant ?? 'default'}>{TIPOS[detailSol.tipo_prestamo]?.label ?? detailSol.tipo_prestamo}</Badge>} />
              <Row label="Solicitante"      value={fmtNombre(detailSol._solicitante)} />
              {detailSol.tipo_flujo === 'aprendiz' && (
                <Row label="Instructor asignado" value={fmtNombre(detailSol._instructor)} />
              )}
              {detailSol.id_admin   && <Row label="Administrador"          value={fmtNombre(detailSol._admin)} />}
              {detailSol.id_bodega  && <Row label="Instructor Bodega"       value={fmtNombre(detailSol._bodega)} />}
              {detailSol.observaciones  && <Row label="Observaciones"  value={detailSol.observaciones} />}
              {detailSol.motivo_rechazo && <Row label="Motivo rechazo" value={detailSol.motivo_rechazo} />}
            </div>

            {/* Timeline */}
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 10 }}>
                Progreso
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {[
                  { label: 'Solicitud creada',        date: detailSol.fecha_solicitud,            done: true },
                  { label: 'Revisión del instructor',  date: detailSol.fecha_respuesta_instructor, done: !!detailSol.fecha_respuesta_instructor, skip: detailSol.tipo_flujo !== 'aprendiz' },
                  { label: 'Revisión del administrador', date: detailSol.fecha_respuesta_admin,   done: !!detailSol.fecha_respuesta_admin, skip: detailSol.tipo_prestamo !== 'externo' },
                  { label: 'Aprobación bodega',        date: detailSol.fecha_respuesta_bodega,    done: !!detailSol.fecha_respuesta_bodega },
                  { label: 'Material entregado',       date: detailSol.fecha_entrega,             done: !!detailSol.fecha_entrega },
                ].filter(step => !step.skip).map((step, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, paddingBottom: 14 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                      <div style={{
                        width: 20, height: 20, borderRadius: '50%', border: '2px solid',
                        borderColor: step.done ? '#2d8000' : '#d1d5db',
                        background: step.done ? '#2d8000' : '#fff',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        {step.done && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
                      </div>
                    </div>
                    <div style={{ paddingTop: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: step.done ? '#111827' : '#9ca3af' }}>{step.label}</div>
                      {step.date && <div style={{ fontSize: 11.5, color: '#6b7280', marginTop: 2 }}>{fmtFecha(step.date)}</div>}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Items */}
            {detailSol._unidades?.length > 0 && (
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 8 }}>
                  Unidades solicitadas
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {detailSol._unidades.map((su, i) => (
                    <div key={i} style={{ ...itemRowStyle, cursor: 'default' }}>
                      <span style={{ fontSize: 13 }}>
                        <code style={{ fontSize: 11.5, background: '#e0f2fe', color: '#0369a1', padding: '1px 6px', borderRadius: 4 }}>
                          {su._unidad?.codigo_unidad ?? su.id_unidad}
                        </code>
                        {' '}{su._material?.nombre ?? '—'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {detailSol._lotes?.length > 0 && (
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 8 }}>
                  Lotes solicitados
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {detailSol._lotes.map((sl, i) => (
                    <div key={i} style={{ ...itemRowStyle, cursor: 'default' }}>
                      <span style={{ fontSize: 13 }}>
                        <code style={{ fontSize: 11.5, background: '#fef9c3', color: '#854d0e', padding: '1px 6px', borderRadius: 4 }}>
                          {sl._lote?.codigo_lote ?? sl.id_lote}
                        </code>
                        {' '}{sl._material?.nombre ?? '—'}
                      </span>
                      <span style={{ fontSize: 12, color: '#6b7280' }}>× {sl.cantidad_solicitada}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {(!detailSol._unidades?.length && !detailSol._lotes?.length) && (
              <p style={{ fontSize: 13, color: '#9ca3af', textAlign: 'center' }}>Sin ítems registrados.</p>
            )}
          </div>
        )}
      </AppModal>

      {/* ── Entregar modal ───────────────────────────────────────────────── */}
      {(() => {
        const _tieneUnidades = (entregarModal.sol?._unidades?.length ?? 0) > 0
        return (
          <AppModal
            isOpen={entregarModal.open}
            onClose={() => setEntregarModal({ open: false, id: '', sol: null })}
            title="Registrar entrega"
            maxWidth={440}
            footer={<>
              <AppButton variant="ghost" size="compact" onClick={() => setEntregarModal({ open: false, id: '', sol: null })} disabled={actioning}>Cancelar</AppButton>
              <AppButton variant="primary" size="compact" onClick={handleEntregar} loading={actioning}>
                {_tieneUnidades ? 'Confirmar entrega y crear préstamo' : 'Confirmar entrega'}
              </AppButton>
            </>}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#166534' }}>
                {_tieneUnidades
                  ? 'Al confirmar se registrará la entrega del material y se creará automáticamente el préstamo para su devolución.'
                  : 'Al confirmar se registrará la entrega del material consumible. No se requiere devolución.'}
              </div>
              {_tieneUnidades && (
                <div>
                  <label style={labelStyle}>
                    Fecha límite de devolución <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <input
                    type="date"
                    value={entregarForm.fecha_limite}
                    min={new Date(Date.now() + 86400000).toISOString().slice(0, 10)}
                    onChange={e => setEntregarForm(p => ({ ...p, fecha_limite: e.target.value }))}
                    style={inputStyle}
                  />
                  <span style={{ fontSize: 11.5, color: '#6b7280', marginTop: 4, display: 'block' }}>
                    Fecha en que el solicitante debe devolver el material
                  </span>
                </div>
              )}
              <div>
                <label style={labelStyle}>Observaciones (opcional)</label>
                <textarea
                  rows={3}
                  value={entregarForm.observaciones}
                  onChange={e => setEntregarForm(p => ({ ...p, observaciones: e.target.value }))}
                  style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }}
                  placeholder="Notas adicionales sobre la entrega..."
                />
              </div>
            </div>
          </AppModal>
        )
      })()}

      {/* ── Reject modal ─────────────────────────────────────────────────── */}
      <AppModal
        isOpen={rejectModal.open}
        onClose={() => { if (!actioning) setRejectModal({ open: false, id: '', motivo: '' }) }}
        title="Rechazar solicitud"
        maxWidth={420}
        footer={<>
          <AppButton variant="ghost" size="compact" onClick={() => setRejectModal({ open: false, id: '', motivo: '' })} disabled={actioning}>Cancelar</AppButton>
          <AppButton variant="danger" size="compact" onClick={handleRechazar} loading={actioning}>Rechazar</AppButton>
        </>}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <p style={{ fontSize: 13.5, color: '#374151', margin: 0 }}>
            ¿Seguro que deseas rechazar esta solicitud?
          </p>
          <div>
            <label style={labelStyle}>Motivo del rechazo (opcional)</label>
            <textarea
              rows={3}
              value={rejectModal.motivo}
              onChange={e => setRejectModal(p => ({ ...p, motivo: e.target.value }))}
              style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }}
              placeholder="Razón del rechazo..."
            />
          </div>
        </div>
      </AppModal>

      {/* ── Generic confirm dialog ────────────────────────────────────────── */}
      <ConfirmDialog
        isOpen={confirmModal.open}
        title={confirmModal.title}
        description={confirmModal.desc}
        confirmLabel="Confirmar"
        variant={confirmModal.variant}
        loading={actioning}
        onConfirm={handleConfirm}
        onCancel={() => setConfirmModal(p => ({ ...p, open: false }))}
      />
    </div>
  )
}
