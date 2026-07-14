import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { PageHeader }       from '../../components/molecules/PageHeader'
import { DataTable }        from '../../components/organisms/DataTable'
import { AppModal }         from '../../components/organisms/AppModal'
import { AppButton }        from '../../components/atoms/AppButton'
import { AppSelect }        from '../../components/atoms/AppSelect'
import { AppDateInput }     from '../../components/atoms/AppDateInput'
import { SearchableSelect } from '../../components/atoms/SearchableSelect'
import { Badge }            from '../../components/atoms/Badge'
import { ConfirmDialog }    from '../../components/molecules/ConfirmDialog'
import { useToast }         from '../../hooks/useToast'
import { useAuth }          from '../../context/AuthContext'
import { usePermissions }   from '../../context/PermissionsContext'
import { useSocket }        from '../../context/SocketContext'
import api                  from '../../services/api'
import { AppIcon }          from '../../components/atoms/AppIcon'

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
  id_aprendices: [],
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
  const { hasPermission, hasAction } = usePermissions()
  const isAdmin         = hasPermission('administracion')
  const canCrear        = hasAction('movimientos', 'solicitudes', 'crear')
  const navigate        = useNavigate()
  const location        = useLocation()
  const processedCatalogState  = useRef(false)
  const catalogAutoSelectRef   = useRef(null)

  // ── Data ──────────────────────────────────────────────────────────────────

  const [solicitudes,        setSolicitudes]        = useState([])
  const [solicitudLotes,     setSolicitudLotes]     = useState([])
  const [solicitudUnidades,  setSolicitudUnidades]  = useState([])
  const [solicitudAprendices,setSolicitudAprendices] = useState([])
  const [usuarios,           setUsuarios]           = useState([])
  const [roles,              setRoles]              = useState([])
  const [fichaUsuarios,      setFichaUsuarios]      = useState([])
  const [lotes,              setLotes]              = useState([])
  const [loteFichas,         setLoteFichas]         = useState([])
  const [unidades,           setUnidades]           = useState([])
  const [materiales,         setMateriales]         = useState([])
  const [fichas,             setFichas]             = useState([])
  const [ubicaciones,        setUbicaciones]        = useState([])
  const [loading,            setLoading]            = useState(true)
  const { showToast, toastPortal } = useToast()

  // ── UI state ──────────────────────────────────────────────────────────────

  const [filterKey,    setFilterKey]    = useState(null)
  const [modalOpen,    setModalOpen]    = useState(false)
  const [detailOpen,   setDetailOpen]   = useState(false)
  const [detailSol,    setDetailSol]    = useState(null)
  const [step,         setStep]         = useState(1)
  const [form,         setForm]         = useState(FORM_INIT)
  const [saving,       setSaving]       = useState(false)

  const [selUnidades,   setSelUnidades]   = useState([])
  const [selLotes,      setSelLotes]      = useState([])
  const [addUnidadId,   setAddUnidadId]   = useState('')
  const [addLoteId,     setAddLoteId]     = useState('')
  const [addLoteCant,   setAddLoteCant]   = useState(1)
  const [addAprendizId, setAddAprendizId] = useState('')

  const [rejectModal,   setRejectModal]   = useState({ open: false, id: '', motivo: '' })
  const [confirmModal,  setConfirmModal]  = useState({ open: false, id: '', type: '', body: null, title: '', desc: '', variant: 'primary' })
  const [entregarModal, setEntregarModal] = useState({ open: false, id: '', sol: null })
  const [entregarForm,  setEntregarForm]  = useState({ fecha_limite: '', observaciones: '' })
  const [actioning,     setActioning]     = useState(false)

  const [selectedUbicacionId, setSelectedUbicacionId] = useState('')

  // ── Load ──────────────────────────────────────────────────────────────────

  const load = useCallback(async (silent = false) => {
    try {
      setLoading(true)
      const [s, sl, su, sa, u, r, fu, l, lf, un, m, fi, ub] = await Promise.all([
        api.get('/solicitud'),
        api.get('/solicitud-lote'),
        api.get('/solicitud-unidad'),
        api.get('/solicitud-aprendiz'),
        api.get('/usuario'),
        api.get('/rol'),
        api.get('/ficha-usuario'),
        api.get('/lote'),
        api.get('/lote-ficha'),
        api.get('/unidad'),
        api.get('/material'),
        api.get('/ficha'),
        api.get('/ubicacion'),
      ])
      setSolicitudes(s.data)
      setSolicitudLotes(sl.data)
      setSolicitudUnidades(su.data)
      setSolicitudAprendices(sa.data)
      setUsuarios(u.data)
      setRoles(r.data)
      setFichaUsuarios(fu.data)
      setLotes(l.data)
      setLoteFichas(lf.data)
      setUnidades(un.data)
      setMateriales(m.data)
      setFichas(fi.data)
      setUbicaciones(ub.data)
    } catch {
      if (!silent) showToast('error', 'Error al cargar los datos')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const socket = useSocket()
  useEffect(() => {
    if (!socket) return
    const handler = () => load(true)
    socket.on('solicitud_actualizado', handler)
    return () => { socket.off('solicitud_actualizado', handler) }
  }, [socket, load])

  // ── Derived ───────────────────────────────────────────────────────────────

  const myRoleName = useMemo(() => {
    if (!user) return null
    return roles.find(r => r.id === user.id_rol)?.nombre ?? null
  }, [roles, user])

  const isBodega = myRoleName === 'Responsable de Bodega'

  const instructores = useMemo(() => {
    const rolInstructor = roles.find(r => r.nombre === 'Instructor')
    if (!rolInstructor) return []
    return usuarios.filter(u => u.id_rol === rolInstructor.id)
  }, [usuarios, roles])

  const instructoresBodega = useMemo(() => {
    const rolBodega = roles.find(r => r.nombre === 'Responsable de Bodega')
    if (!rolBodega) return []
    return usuarios.filter(u => u.id_rol === rolBodega.id)
  }, [usuarios, roles])

  const misAprendices = useMemo(() => {
    if (!user || myRoleName === 'Aprendiz') return []
    const misFichas = fichaUsuarios
      .filter(fu => fu.id_usuario === user.id && fu.rol_en_ficha === 'instructor')
      .map(fu => fu.id_ficha)
    if (misFichas.length === 0) return []
    const idsAprendices = [...new Set(
      fichaUsuarios
        .filter(fu => misFichas.includes(fu.id_ficha) && fu.rol_en_ficha === 'aprendiz')
        .map(fu => fu.id_usuario)
    )]
    return idsAprendices.map(id => usuarios.find(u => u.id === id)).filter(Boolean)
  }, [fichaUsuarios, usuarios, user, myRoleName])

  const solicitudesRicas = useMemo(() => solicitudes.map(s => {
    const _solicitante = usuarios.find(u => u.id === s.id_solicitante)
    const _instructor  = usuarios.find(u => u.id === s.id_instructor)
    const _admin       = usuarios.find(u => u.id === s.id_admin)
    const _bodega      = usuarios.find(u => u.id === s.id_bodega)
    const fichaRel     = fichaUsuarios.find(fu => fu.id_usuario === s.id_solicitante)
    const _ficha       = fichaRel ? fichas.find(f => f.id_ficha === fichaRel.id_ficha) : null
    return {
      ...s,
      _solicitante,
      _instructor,
      _admin,
      _bodega,
      _ficha,
      _solicitanteNombre: fmtNombre(_solicitante),
      _destinoNombre: s.tipo_flujo === 'aprendiz' ? fmtNombre(_instructor) : fmtNombre(_bodega),
      _lotes: solicitudLotes
        .filter(sl => sl.id_solicitud === s.id_solicitud)
        .map(sl => {
          const l = lotes.find(l => l.id_lote === sl.id_lote)
          return { ...sl, _lote: l, _material: materiales.find(m => m.id === l?.id_material), _ubicacion: ubicaciones.find(ub => ub.id_ubicacion === l?.id_ubicacion) }
        }),
      _unidades: solicitudUnidades
        .filter(su => su.id_solicitud === s.id_solicitud)
        .map(su => {
          const u = unidades.find(u => u.id_unidad === su.id_unidad)
          return { ...su, _unidad: u, _material: materiales.find(m => m.id === u?.id_material), _ubicacion: ubicaciones.find(ub => ub.id_ubicacion === u?.id_ubicacion) }
        }),
      _aprendices: solicitudAprendices
        .filter(sa => sa.id_solicitud === s.id_solicitud)
        .map(sa => ({ ...sa, _aprendiz: usuarios.find(u => u.id === sa.id_aprendiz) })),
    }
  }), [solicitudes, solicitudLotes, solicitudUnidades, solicitudAprendices, usuarios, fichaUsuarios, fichas, ubicaciones, lotes, unidades, materiales])

  const solicitudesVisibles = useMemo(() => {
    if (isAdmin || isBodega) return solicitudesRicas
    return solicitudesRicas.filter(s =>
      s.id_solicitante === user?.id || s.id_instructor === user?.id
    )
  }, [solicitudesRicas, isAdmin, isBodega, user])

  const counts = useMemo(() => {
    const base = { total: solicitudesVisibles.length, en_proceso: 0 }
    solicitudesVisibles.forEach(s => {
      if (PENDIENTES.includes(s.estado)) base.en_proceso = (base.en_proceso ?? 0) + 1
      else base[s.estado] = (base[s.estado] ?? 0) + 1
    })
    return base
  }, [solicitudesVisibles])

  const datosFiltrados = useMemo(() => {
    if (!filterKey) return solicitudesVisibles
    if (filterKey === 'en_proceso') return solicitudesVisibles.filter(s => PENDIENTES.includes(s.estado))
    return solicitudesVisibles.filter(s => s.estado === filterKey)
  }, [solicitudesVisibles, filterKey])

  const esAprendiz = myRoleName === 'Aprendiz'

  const misFichaIds = useMemo(() => {
    if (!user) return new Set()
    return new Set(fichaUsuarios.filter(fu => fu.id_usuario === user.id).map(fu => fu.id_ficha))
  }, [fichaUsuarios, user])

  // Un aprendiz solo ve unidades libres (sin ficha) o asignadas a su propia ficha.
  // Instructores, admin y bodega ven todo el disponible, sin restricción.
  const unidadesDisponibles = useMemo(() => {
    let base = unidades.filter(u => u.estado === 'disponible')
    if (esAprendiz) base = base.filter(u => !u.id_ficha || misFichaIds.has(u.id_ficha))
    return base.map(u => ({ ...u, _material: materiales.find(m => m.id === u.id_material) }))
  }, [unidades, materiales, esAprendiz, misFichaIds])

  // Un aprendiz solo ve lotes libres (sin ninguna asignación a ficha) o la cuota
  // asignada a su propia ficha — nunca la cantidad_disponible general del lote,
  // que ya descuenta lo repartido a fichas (incluida la ajena).
  const lotesConStock = useMemo(() => {
    let base = lotes.filter(l => l.cantidad_disponible > 0)
    if (esAprendiz) {
      base = base.reduce((acc, l) => {
        const asignaciones = loteFichas.filter(lf => lf.id_lote === l.id_lote)
        if (asignaciones.length === 0) { acc.push(l); return acc } // libre
        const miCuota = asignaciones.find(lf => misFichaIds.has(lf.id_ficha))
        if (miCuota) acc.push({ ...l, cantidad_disponible: miCuota.cantidad })
        return acc // asignado a otra ficha → no visible
      }, [])
    }
    return base.map(l => ({ ...l, _material: materiales.find(m => m.id === l.id_material) }))
  }, [lotes, loteFichas, materiales, esAprendiz, misFichaIds])

  const ubicacionesConStock = useMemo(() => {
    const ids = new Set([
      ...unidadesDisponibles.map(u => u.id_ubicacion),
      ...lotesConStock.map(l => l.id_ubicacion),
    ])
    return ubicaciones
      .filter(ub => ids.has(ub.id_ubicacion))
      .map(ub => {
        const enc = usuarios.find(u => u.id === ub.id_encargado) ?? null
        const encRol = enc ? (roles.find(r => r.id === enc.id_rol)?.nombre ?? null) : null
        return { ...ub, _encargado: enc, _encargadoRol: encRol }
      })
      .sort((a, b) => a.nombre.localeCompare(b.nombre))
  }, [ubicaciones, unidadesDisponibles, lotesConStock, usuarios, roles])

  const unidadesEnUbicacion = useMemo(() =>
    selectedUbicacionId
      ? unidadesDisponibles.filter(u => String(u.id_ubicacion) === String(selectedUbicacionId))
      : []
  , [unidadesDisponibles, selectedUbicacionId])

  const lotesEnUbicacion = useMemo(() =>
    selectedUbicacionId
      ? lotesConStock.filter(l => String(l.id_ubicacion) === String(selectedUbicacionId))
      : []
  , [lotesConStock, selectedUbicacionId])

  // Auto-abrir modal si se viene del catálogo
  useEffect(() => {
    if (!location.state?.fromCatalog || loading || !myRoleName) return
    if (processedCatalogState.current) return
    processedCatalogState.current = true

    const tipoFlujoAuto = myRoleName === 'Aprendiz' ? 'aprendiz' : 'instructor'
    const newForm = { ...FORM_INIT, tipo_flujo: tipoFlujoAuto }
    const idUbicacion = location.state.id_ubicacion

    if (idUbicacion) {
      setSelectedUbicacionId(idUbicacion)
      if (location.state.id_material) {
        catalogAutoSelectRef.current = {
          id_material: location.state.id_material,
          categoria:   location.state.categoria,
        }
      }
      const ub = ubicacionesConStock.find(u => u.id_ubicacion === idUbicacion)
      // El instructor de un aprendiz lo resuelve el backend a partir de su ficha —
      // ya no se deriva de quién administra la ubicación elegida.
      if (ub?._encargado && myRoleName !== 'Aprendiz') {
        if (ub._encargadoRol === 'Responsable de Bodega') newForm.id_bodega = ub._encargado.id
        else if (ub._encargadoRol === 'Instructor')        newForm.id_instructor = ub._encargado.id
      }
    }

    setForm(newForm)
    setSelUnidades([])
    setSelLotes([])
    setAddUnidadId('')
    setAddLoteId('')
    setAddLoteCant(1)
    setAddAprendizId('')
    setStep(1)
    setModalOpen(true)
    navigate(location.pathname, { replace: true, state: {} })
  }, [location.state, loading, myRoleName, ubicacionesConStock])

  // Auto-seleccionar material en paso 2 cuando viene del catálogo
  useEffect(() => {
    if (!catalogAutoSelectRef.current) return
    const { id_material, categoria } = catalogAutoSelectRef.current
    if (categoria === 'no consumible') {
      const u = unidadesEnUbicacion.find(u => String(u.id_material) === String(id_material))
      if (u) { setSelUnidades([u]); catalogAutoSelectRef.current = null }
    } else {
      const l = lotesEnUbicacion.find(l => String(l.id_material) === String(id_material))
      if (l) { setSelLotes([{ ...l, _cantidad: 1 }]); catalogAutoSelectRef.current = null }
    }
  }, [unidadesEnUbicacion, lotesEnUbicacion])

  const handleUbicacionChange = (id_ubicacion) => {
    setSelectedUbicacionId(id_ubicacion)
    // Un aprendiz no elige su aprobador — lo resuelve el backend según su ficha.
    if (myRoleName === 'Aprendiz') return

    const ub = ubicacionesConStock.find(u => u.id_ubicacion === id_ubicacion)
    if (!ub || !ub._encargado) return

    if (ub._encargadoRol === 'Responsable de Bodega') {
      setForm(p => ({ ...p, id_bodega: ub._encargado.id }))
    } else if (ub._encargadoRol === 'Instructor') {
      setForm(p => ({ ...p, id_instructor: ub._encargado.id }))
    }
  }

  // ── Per-row permissions ───────────────────────────────────────────────────

  function getPerms(sol) {
    const isMine  = sol.id_solicitante === user?.id
    const nonTerm = !TERMINALES.includes(sol.estado)
    const canAprovBodega = isBodega && sol.estado === 'pendiente_bodega' &&
                           (sol.id_bodega === null || sol.id_bodega === user?.id)
    const isBodegaAsignada = isBodega && sol.id_bodega === user?.id

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
      showToast('success', 'Acción realizada correctamente.')
      setConfirmModal(p => ({ ...p, open: false }))
      setRejectModal({ open: false, id: '', motivo: '' })
      load()
    } catch (err) {
      const msg = err?.response?.data?.message
      showToast('error', Array.isArray(msg) ? msg.join('. ') : (msg ?? 'Error al procesar la acción'))
    } finally { setActioning(false) }
  }

  const openConfirm = (id, type, title, desc, body = null, variant = 'primary') =>
    setConfirmModal({ open: true, id, type, title, desc, body, variant })

  const handleConfirm = () => doAction(
    `/solicitud/${confirmModal.id}/${confirmModal.type}`,
    confirmModal.body,
  )

  const handleRechazar = () => {
    const rol = myRoleName === 'Responsable de Bodega' ? 'bodega' : isAdmin ? 'admin' : 'instructor'
    doAction(`/solicitud/${rejectModal.id}/rechazar`, {
      rol,
      motivo_rechazo: rejectModal.motivo || undefined,
    })
  }

  const handleEntregar = async () => {
    const tieneUnidades = (entregarModal.sol?._unidades?.length ?? 0) > 0
    if (tieneUnidades && !entregarForm.fecha_limite) {
      showToast('error', 'Debes seleccionar una fecha límite de devolución')
      return
    }
    setActioning(true)
    try {
      const payload = {
        id_bodega:     user.id,
        observaciones: entregarForm.observaciones || undefined,
      }
      if (tieneUnidades && entregarForm.fecha_limite) payload.fecha_limite = new Date(entregarForm.fecha_limite).toISOString()

      await api.patch(`/solicitud/${entregarModal.id}/entregar`, payload)
      showToast('success', 'Entrega registrada correctamente.')
      setEntregarModal({ open: false, id: '', sol: null })
      setEntregarForm({ fecha_limite: '', observaciones: '' })
      load()
    } catch (err) {
      const msg = err?.response?.data?.message
      showToast('error', Array.isArray(msg) ? msg.join('. ') : (msg ?? 'Error al registrar la entrega'))
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
    setAddAprendizId('')
    setSelectedUbicacionId('')
    setStep(1)
    setModalOpen(true)
  }

  const closeModal = () => { setModalOpen(false); setStep(1) }

  const step1Valid = () => {
    if (!form.tipo_flujo || !form.tipo_prestamo) return false
    if (!selectedUbicacionId) return false
    if (form.tipo_flujo === 'instructor' && !form.id_bodega) return false
    return true
  }

  const addUnidad = () => {
    const u = unidadesEnUbicacion.find(u => u.id_unidad === addUnidadId)
    if (!u || selUnidades.find(s => s.id_unidad === u.id_unidad)) return
    setSelUnidades(p => [...p, u])
    setAddUnidadId('')
  }

  const addLote = () => {
    const l = lotesEnUbicacion.find(l => l.id_lote === addLoteId)
    if (!l || selLotes.find(s => s.id_lote === l.id_lote)) return
    const cant = Math.max(1, Math.min(addLoteCant, l.cantidad_disponible))
    setSelLotes(p => [...p, { ...l, _cantidad: cant }])
    setAddLoteId('')
    setAddLoteCant(1)
  }

  const addAprendiz = () => {
    if (!addAprendizId || form.id_aprendices.includes(addAprendizId)) return
    setForm(p => ({ ...p, id_aprendices: [...p.id_aprendices, addAprendizId] }))
    setAddAprendizId('')
  }

  const removeAprendiz = (id) => {
    setForm(p => ({ ...p, id_aprendices: p.id_aprendices.filter(x => x !== id) }))
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
      // El instructor de un aprendiz lo resuelve el backend según su ficha —
      // no se manda id_instructor para tipo_flujo 'aprendiz'.
      if (form.tipo_flujo === 'instructor')  payload.id_bodega = form.id_bodega

      const { data: sol } = await api.post('/solicitud', payload)

      await Promise.all([
        ...selUnidades.map(u => api.post('/solicitud-unidad', { id_solicitud: sol.id_solicitud, id_unidad: u.id_unidad, id_usuario: user.id })),
        ...selLotes.map(l => api.post('/solicitud-lote', { id_solicitud: sol.id_solicitud, id_lote: l.id_lote, cantidad_solicitada: l._cantidad, id_usuario: user.id })),
        ...form.id_aprendices.map(id => api.post('/solicitud-aprendiz', { id_solicitud: sol.id_solicitud, id_aprendiz: id })),
      ])
      showToast('success', 'Solicitud creada correctamente.')
      closeModal()
      load()
    } catch (err) {
      const msg = err?.response?.data?.message
      showToast('error', Array.isArray(msg) ? msg.join('. ') : (msg ?? 'Error al crear la solicitud'))
    } finally {
      setSaving(false)
    }
  }

  // ── Table columns ─────────────────────────────────────────────────────────

  const columns = [
    { key: 'id_solicitud', header: 'ID', copyable: true, truncateAt: 8, searchable: false, width: 110 },
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
              <button title="Registrar entrega y crear préstamo" onClick={() => { setEntregarModal({ open: true, id: r.id_solicitud, sol: r }); setEntregarForm({ fecha_limite: '', observaciones: '' }) }} style={btnStyle('#0d9488')}>
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
    <>
      {toastPortal}
      <div>
      <PageHeader title="Solicitudes" description="Gestión de solicitudes de préstamo de materiales" />

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
        actions={canCrear && <AppButton size="compact" onClick={openCreate}>+ Nueva solicitud</AppButton>}
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
                    {form.tipo_flujo === 'aprendiz'
                      ? 'Aprendiz → Instructor'
                      : myRoleName === 'Aprendiz'
                        ? 'Aprendiz → Responsable de Bodega (directo)'
                        : 'Instructor → Bodega'}
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
              <AppSelect value={form.tipo_prestamo} onChange={e => setForm(p => ({ ...p, tipo_prestamo: e.target.value }))}>
                <option value="interno">Interno — Responsable de Bodega aprueba directamente</option>
                <option value="externo">Externo — pasa por Administrador primero</option>
              </AppSelect>
            </div>

            {/* Selector de ubicación */}
            <div>
              <label style={labelStyle}>Ubicación *</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <SearchableSelect
                  value={selectedUbicacionId}
                  placeholder="Buscar ubicación con stock disponible..."
                  options={ubicacionesConStock.map(ub => ({
                    value: ub.id_ubicacion,
                    label: `${ub.nombre}${ub._encargadoRol ? ` — ${fmtNombre(ub._encargado)}` : ' — Sin encargado'}`,
                  }))}
                  onChange={handleUbicacionChange}
                />
                {selectedUbicacionId && (() => {
                  const ub = ubicacionesConStock.find(u => u.id_ubicacion === selectedUbicacionId)
                  if (!ub) return null
                  const isDirect = myRoleName === 'Aprendiz' && ub._encargadoRol === 'Responsable de Bodega'
                  return (
                    <div style={{ padding: '10px 14px', borderRadius: 8, background: isDirect ? '#fffbeb' : '#f0fdf4', border: `1px solid ${isDirect ? '#fde68a' : '#bbf7d0'}`, fontSize: 12.5 }}>
                      <div style={{ fontWeight: 600, color: isDirect ? '#92400e' : '#166534' }}>
                        Encargado: {ub._encargado ? fmtNombre(ub._encargado) : 'Sin encargado asignado'}
                      </div>
                      {ub._encargadoRol && (
                        <div style={{ color: isDirect ? '#b45309' : '#4b7c45', marginTop: 2 }}>
                          Rol: {ub._encargadoRol}
                        </div>
                      )}
                      {isDirect && (
                        <div style={{ color: '#d97706', marginTop: 4, fontWeight: 500 }}>
                          La solicitud irá directamente al Responsable de Bodega (flujo instructor).
                        </div>
                      )}
                    </div>
                  )
                })()}
                {ubicacionesConStock.length === 0 && (
                  <p style={{ fontSize: 12, color: '#d97706', margin: 0 }}>
                    No hay ubicaciones con stock disponible asignadas a un encargado.
                  </p>
                )}
              </div>
            </div>

            {/* Aprendices destinatarios — solo visible para instructores con aprendices en sus fichas */}
            {form.tipo_flujo === 'instructor' && misAprendices.length > 0 && (
              <div>
                <label style={labelStyle}>
                  Aprendices destinatarios
                  <span style={{ fontSize: 11, fontWeight: 400, color: '#9ca3af', marginLeft: 6 }}>(opcional)</span>
                </label>
                <div style={{
                  background: '#f8fafc', border: '1.5px solid #e2e8f0',
                  borderRadius: 10, padding: 14, display: 'flex', flexDirection: 'column', gap: 10,
                }}>
                  {/* Selector + botón agregar */}
                  <div style={{ display: 'flex', gap: 8 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <SearchableSelect
                        value={addAprendizId}
                        placeholder="Seleccionar aprendiz..."
                        options={misAprendices
                          .filter(a => !form.id_aprendices.includes(a.id))
                          .map(a => ({ value: a.id, label: fmtNombre(a) }))}
                        onChange={v => setAddAprendizId(v)}
                      />
                    </div>
                    <AppButton size="compact" onClick={addAprendiz} disabled={!addAprendizId}>
                      + Agregar
                    </AppButton>
                  </div>

                  {/* Chips de aprendices seleccionados */}
                  {form.id_aprendices.length > 0 ? (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {form.id_aprendices.map(id => {
                        const apr = misAprendices.find(a => a.id === id)
                        return (
                          <div key={id} style={{
                            display: 'inline-flex', alignItems: 'center', gap: 6,
                            padding: '5px 10px 5px 12px',
                            background: '#eff6ff', border: '1.5px solid #bfdbfe',
                            borderRadius: 20, fontSize: 12.5, fontWeight: 500, color: '#1d4ed8',
                          }}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
                            </svg>
                            {fmtNombre(apr)}
                            <button
                              onClick={() => removeAprendiz(id)}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#93c5fd', fontSize: 14, padding: '0', lineHeight: 1, display: 'flex', alignItems: 'center' }}
                              title="Quitar aprendiz"
                            >
                              ✕
                            </button>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <p style={{ fontSize: 12, color: '#9ca3af', margin: 0 }}>
                      Sin aprendices seleccionados — el material aplica de forma general.
                    </p>
                  )}

                  <p style={{ fontSize: 11.5, color: '#6b7280', margin: 0 }}>
                    {form.id_aprendices.length > 0
                      ? `${form.id_aprendices.length} aprendiz(ces) seleccionado(s) de ${misAprendices.length} disponible(s).`
                      : `Tienes ${misAprendices.length} aprendiz(ces) disponible(s) en tus fichas.`
                    }
                  </p>
                </div>
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
                <div style={{ flex: 1, minWidth: 0 }}>
                  <SearchableSelect
                    value={addUnidadId}
                    placeholder="Seleccionar unidad disponible..."
                    options={unidadesEnUbicacion
                      .filter(u => !selUnidades.find(s => s.id_unidad === u.id_unidad))
                      .map(u => ({ value: u.id_unidad, label: `${u.codigo_unidad} — ${u._material?.nombre ?? u.id_material}` }))}
                    onChange={v => setAddUnidadId(v)}
                  />
                </div>
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
                <div style={{ flex: 1, minWidth: 0 }}>
                  <SearchableSelect
                    value={addLoteId}
                    placeholder="Seleccionar lote con stock..."
                    options={lotesEnUbicacion
                      .filter(l => !selLotes.find(s => s.id_lote === l.id_lote))
                      .map(l => ({ value: l.id_lote, label: `${l.codigo_lote} — ${l._material?.nombre ?? l.id_material} (disp: ${l.cantidad_disponible})` }))}
                    onChange={v => { setAddLoteId(v); setAddLoteCant(1) }}
                  />
                </div>
                <input
                  type="number" min={1}
                  max={lotesEnUbicacion.find(l => l.id_lote === addLoteId)?.cantidad_disponible ?? 9999}
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
                      <span style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                        <code style={{ fontSize: 11.5, background: '#fef9c3', color: '#854d0e', padding: '1px 6px', borderRadius: 4, flexShrink: 0 }}>{l.codigo_lote}</code>
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l._material?.nombre ?? ''}</span>
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                        <input
                          type="number" min={1} max={l.cantidad_disponible}
                          value={l._cantidad}
                          onChange={e => {
                            const cant = Math.max(1, Math.min(Number(e.target.value) || 1, l.cantidad_disponible))
                            setSelLotes(p => p.map(s => s.id_lote === l.id_lote ? { ...s, _cantidad: cant } : s))
                          }}
                          style={{ ...inputStyle, width: 64, padding: '4px 6px', fontSize: 12.5 }}
                        />
                        <span style={{ fontSize: 11, color: '#9ca3af' }}>/ {l.cantidad_disponible}</span>
                        <button onClick={() => setSelLotes(p => p.filter(s => s.id_lote !== l.id_lote))} style={removeBtn}>✕</button>
                      </div>
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
              {detailSol._ficha && <Row label="Ficha" value={detailSol._ficha.codigo_ficha} />}
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

            {/* Aprendices destinatarios */}
            {detailSol._aprendices?.length > 0 && (
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 8 }}>
                  Aprendices destinatarios
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {detailSol._aprendices.map((sa, i) => (
                    <div key={i} style={{
                      display: 'inline-flex', alignItems: 'center', gap: 6,
                      padding: '5px 12px',
                      background: '#eff6ff', border: '1.5px solid #bfdbfe',
                      borderRadius: 20, fontSize: 12.5, fontWeight: 500, color: '#1d4ed8',
                    }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
                      </svg>
                      {fmtNombre(sa._aprendiz)}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Items */}
            {detailSol._unidades?.length > 0 && (
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 8 }}>
                  Unidades solicitadas
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {detailSol._unidades.map((su, i) => (
                    <div key={i} style={{ ...itemRowStyle, cursor: 'default' }}>
                      <span style={{ fontSize: 13, flex: 1 }}>
                        <code style={{ fontSize: 11.5, background: '#e0f2fe', color: '#0369a1', padding: '1px 6px', borderRadius: 4 }}>
                          {su._unidad?.codigo_unidad ?? su.id_unidad}
                        </code>
                        {' '}{su._material?.nombre ?? '—'}
                      </span>
                      {su._ubicacion && (
                        <span style={{ fontSize: 11.5, color: '#6b7280', flexShrink: 0 }}>
                          {su._ubicacion.nombre}
                        </span>
                      )}
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
                      <span style={{ fontSize: 13, flex: 1 }}>
                        <code style={{ fontSize: 11.5, background: '#fef9c3', color: '#854d0e', padding: '1px 6px', borderRadius: 4 }}>
                          {sl._lote?.codigo_lote ?? sl.id_lote}
                        </code>
                        {' '}{sl._material?.nombre ?? '—'}
                      </span>
                      {sl._ubicacion && (
                        <span style={{ fontSize: 11.5, color: '#6b7280', flexShrink: 0 }}>
                          {sl._ubicacion.nombre}
                        </span>
                      )}
                      <span style={{ fontSize: 12, color: '#6b7280', flexShrink: 0 }}>× {sl.cantidad_solicitada}</span>
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
                  <AppDateInput
                    value={entregarForm.fecha_limite}
                    min={new Date().toISOString().slice(0, 10)}
                    onChange={e => setEntregarForm(p => ({ ...p, fecha_limite: e.target.value }))}
                    showTime
                  />
                  <span style={{ fontSize: 11.5, color: '#6b7280', marginTop: 4, display: 'block' }}>
                    Fecha y hora límite de devolución del material
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
    </>
  )
}
