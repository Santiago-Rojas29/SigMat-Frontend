import { useState, useEffect, useMemo, useCallback } from 'react'
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
import api                  from '../../services/api'
import { AppIcon }          from '../../components/atoms/AppIcon'

const TIPOS = {
  dano:          { label: 'Daño',          variant: 'danger'  },
  perdida:       { label: 'Pérdida',       variant: 'warning' },
  mantenimiento: { label: 'Mantenimiento', variant: 'info'    },
}

const ESTADOS_INC = {
  abierta:      { label: 'Abierta',     variant: 'danger'  },
  'en proceso': { label: 'En proceso',  variant: 'warning' },
  cerrada:      { label: 'Cerrada',     variant: 'success' },
}

const ESTADO_UNIDAD_MAP = {
  dano:          'danado',
  perdida:       'perdido',
  mantenimiento: 'en mantenimiento',
}

const CARDS_DEF = [
  {
    key: null, label: 'Todas', color: '#111827', bg: '#fff', border: '#e5e7eb',
    paths: <><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></>,
  },
  {
    key: 'abierta', label: 'Abiertas', color: '#dc2626', bg: '#fef2f2', border: '#fecaca',
    paths: <><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></>,
  },
  {
    key: 'en proceso', label: 'En proceso', color: '#d97706', bg: '#fffbeb', border: '#fde68a',
    paths: <><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></>,
  },
  {
    key: 'cerrada', label: 'Cerradas', color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0',
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

export function IncidenciasPage() {
  const { user } = useAuth()
  const { hasPermission, hasAction } = usePermissions()
  const isAdmin = hasPermission('administracion')
  const canCrear    = hasAction('control', 'incidencias', 'crear')
  const canEditar   = hasAction('control', 'incidencias', 'editar')
  const canEliminar = hasAction('control', 'incidencias', 'eliminar')

  const [roles,       setRoles]       = useState([])
  const [incidencias, setIncidencias] = useState([])
  const [unidades,    setUnidades]    = useState([])
  const [usuarios,    setUsuarios]    = useState([])
  const [materiales,  setMateriales]  = useState([])
  const [loading,     setLoading]     = useState(true)
  const { showToast, toastPortal } = useToast()

  const [filterKey,  setFilterKey]  = useState(null)
  const [saving,     setSaving]     = useState(false)
  const [actioning,  setActioning]  = useState(false)

  const [modalCrear,   setModalCrear]   = useState(false)
  const [detailOpen,   setDetailOpen]   = useState(false)
  const [detailInc,    setDetailInc]    = useState(null)
  const [estadoModal,  setEstadoModal]  = useState(false)
  const [estadoInc,    setEstadoInc]    = useState(null)
  const [confirmDel,   setConfirmDel]   = useState({ open: false, id: '' })

  const [form, setForm] = useState({
    id_unidad: '', tipo: 'dano', fecha_incidencia: '', descripcion: '',
  })
  const [formEstado, setFormEstado] = useState('')

  const load = useCallback(async () => {
    try {
      setLoading(true)
      const [ri, ru, ruu, rm, ro] = await Promise.all([
        api.get('/incidencia'),
        api.get('/unidad'),
        api.get('/usuario'),
        api.get('/material'),
        api.get('/rol'),
      ])
      setIncidencias(ri.data)
      setUnidades(ru.data)
      setUsuarios(ruu.data)
      setMateriales(rm.data)
      setRoles(ro.data)
    } catch {
      showToast('error', 'Error al cargar los datos')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const unidadesDisponibles = useMemo(
    () => unidades.filter(u => u.estado === 'disponible'),
    [unidades]
  )

  const incidenciasRicas = useMemo(() => {
    const uMap  = Object.fromEntries(unidades.map(u => [u.id_unidad, u]))
    const mMap  = Object.fromEntries(materiales.map(m => [m.id, m]))
    const uuMap = Object.fromEntries(usuarios.map(u => [u.id, u]))
    return incidencias.map(inc => {
      const unidad   = uMap[inc.id_unidad]  ?? null
      const mat      = unidad ? mMap[unidad.id_material] ?? null : null
      const reporter = uuMap[inc.id_usuario] ?? null
      return { ...inc, _unidad: unidad, _mat: mat, _reporter: reporter }
    })
  }, [incidencias, unidades, materiales, usuarios])

  const isBodega = useMemo(() => {
    if (!user) return false
    return roles.find(r => r.id === user.id_rol)?.nombre === 'Responsable de Bodega'
  }, [roles, user])

  const incidenciasVisibles = useMemo(() => {
    if (isAdmin || isBodega) return incidenciasRicas
    return incidenciasRicas.filter(i => i.id_usuario === user?.id)
  }, [incidenciasRicas, isAdmin, isBodega, user])

  const counts = useMemo(() => {
    const c = { total: incidenciasVisibles.length }
    CARDS_DEF.forEach(card => {
      if (card.key) c[card.key] = incidenciasVisibles.filter(i => i.estado === card.key).length
    })
    return c
  }, [incidenciasVisibles])

  const datosFiltrados = useMemo(() => {
    if (!filterKey) return incidenciasVisibles
    return incidenciasVisibles.filter(i => i.estado === filterKey)
  }, [incidenciasVisibles, filterKey])

  const openCreate = () => {
    setForm({ id_unidad: '', tipo: 'dano', fecha_incidencia: new Date().toISOString().slice(0, 10), descripcion: '' })
    setModalCrear(true)
  }

  const openDetail = (inc) => { setDetailInc(inc); setDetailOpen(true) }

  const openEstado = (inc) => { setEstadoInc(inc); setFormEstado(inc.estado); setEstadoModal(true) }

  const handleCrear = async () => {
    if (!form.id_unidad || !form.fecha_incidencia || !form.descripcion.trim()) return
    setSaving(true)
    try {
      await api.post('/incidencia', {
        id_unidad:        form.id_unidad,
        id_usuario:       user.id,
        tipo:             form.tipo,
        fecha_incidencia: new Date(form.fecha_incidencia).toISOString(),
        descripcion:      form.descripcion.trim(),
        estado:           'abierta',
      })
      showToast('success', 'Incidencia registrada correctamente.')
      setModalCrear(false)
      load()
    } catch {
      showToast('error', 'Error al registrar la incidencia')
    } finally {
      setSaving(false)
    }
  }

  const handleCambiarEstado = async () => {
    if (!formEstado) return
    setActioning(true)
    try {
      await api.patch(`/incidencia/${estadoInc.id}`, { estado: formEstado })
      showToast('success', 'Estado actualizado correctamente.')
      setEstadoModal(false)
      load()
    } catch {
      showToast('error', 'Error al actualizar el estado')
    } finally {
      setActioning(false)
    }
  }

  const handleEliminar = async () => {
    setActioning(true)
    try {
      await api.delete(`/incidencia/${confirmDel.id}`)
      showToast('success', 'Incidencia eliminada correctamente.')
      setConfirmDel({ open: false, id: '' })
      load()
    } catch {
      showToast('error', 'Error al eliminar la incidencia')
    } finally {
      setActioning(false)
    }
  }

  const columns = [
    {
      key: 'id', header: 'ID', copyable: true, truncateAt: 8, searchable: false, width: 110,
    },
    {
      key: 'codigo', header: 'Unidad',
      render: r => (
        <div>
          <div style={{ fontWeight: 600, fontSize: 13 }}>{r._unidad?.codigo_unidad ?? r.id_unidad}</div>
          <div style={{ fontSize: 11.5, color: '#6b7280' }}>{r._mat?.nombre ?? '—'}</div>
        </div>
      ),
    },
    {
      key: 'tipo', header: 'Tipo', width: 130,
      render: r => {
        const t = TIPOS[r.tipo] ?? { label: r.tipo, variant: 'default' }
        return <Badge variant={t.variant}>{t.label}</Badge>
      },
    },
    {
      key: 'fecha_incidencia', header: 'Fecha', width: 120,
      render: r => fmtFecha(r.fecha_incidencia),
    },
    {
      key: 'descripcion', header: 'Descripción',
      render: r => (
        <span style={{ fontSize: 13, color: '#374151', maxWidth: 260, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {r.descripcion}
        </span>
      ),
    },
    {
      key: 'estado', header: 'Estado', width: 120,
      render: r => {
        const e = ESTADOS_INC[r.estado] ?? { label: r.estado, variant: 'default' }
        return <Badge variant={e.variant}>{e.label}</Badge>
      },
    },
    {
      key: '_reporter', header: 'Reportado por',
      render: r => r._reporter ? `${r._reporter.nombres ?? ''} ${r._reporter.apellidos ?? ''}`.trim() || r._reporter.correo : '—',
    },
    {
      key: '_acciones', header: 'Acciones', width: 120, searchable: false,
      render: r => (
        <div style={{ display: 'flex', gap: 4 }}>
          <button title="Ver detalle" onClick={() => openDetail(r)} style={btnStyle('#2563eb')}>
            <AppIcon name="eye" size={15} />
          </button>
          {canEditar && r.estado !== 'cerrada' && (
            <button title="Cambiar estado" onClick={() => openEstado(r)} style={btnStyle('#2d8000')}>
              <AppIcon name="edit" size={15} />
            </button>
          )}
          {canEliminar && (
            <button title="Eliminar" onClick={() => setConfirmDel({ open: true, id: r.id })} style={btnStyle('#dc2626')}>
              <AppIcon name="trash" size={15} />
            </button>
          )}
        </div>
      ),
    },
  ]

  return (
    <>
      {toastPortal}
      <div>
      <PageHeader title="Incidencias" description="Registro de daños, pérdidas y mantenimientos de unidades" />

      <div style={{ display: 'flex', gap: 14, marginBottom: 24, flexWrap: 'wrap' }}>
        {CARDS_DEF.map(card => {
          const count    = card.key ? counts[card.key] ?? 0 : counts.total
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
        rowKey="id"
        loading={loading}
        searchable
        searchPlaceholder="Buscar por unidad, tipo, material…"
        pageSize={10}
        actions={
          canCrear && <AppButton size="compact" onClick={openCreate}>+ Nueva incidencia</AppButton>
        }
        emptyTitle="Sin incidencias"
        emptyDescription="No hay incidencias registradas."
      />

      {/* ── Modal Crear ── */}
      <AppModal
        isOpen={modalCrear}
        onClose={() => setModalCrear(false)}
        title="Registrar incidencia"
        maxWidth={640}
        footer={
          <>
            <AppButton variant="ghost" size="compact" onClick={() => setModalCrear(false)} disabled={saving}>Cancelar</AppButton>
            <AppButton size="compact" onClick={handleCrear} loading={saving}
              disabled={!form.id_unidad || !form.fecha_incidencia || !form.descripcion.trim()}>
              Registrar
            </AppButton>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div>
            <label style={labelStyle}>Unidad afectada *</label>
            <SearchableSelect
              value={form.id_unidad}
              placeholder="Seleccionar unidad disponible..."
              options={unidadesDisponibles.map(u => {
                const mat = materiales.find(m => m.id === u.id_material)
                return { value: u.id_unidad, label: `${u.codigo_unidad} — ${mat?.nombre ?? '—'}` }
              })}
              onChange={v => setForm(p => ({ ...p, id_unidad: v }))}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <label style={labelStyle}>Tipo de incidencia *</label>
              <AppSelect
                value={form.tipo}
                onChange={e => setForm(p => ({ ...p, tipo: e.target.value }))}>
                <option value="dano">Daño</option>
                <option value="perdida">Pérdida</option>
                <option value="mantenimiento">Mantenimiento</option>
              </AppSelect>
            </div>
            <div>
              <label style={labelStyle}>Fecha *</label>
              <AppDateInput
                value={form.fecha_incidencia}
                onChange={e => setForm(p => ({ ...p, fecha_incidencia: e.target.value }))}
              />
            </div>
          </div>

          <div>
            <label style={labelStyle}>Descripción *</label>
            <textarea
              value={form.descripcion}
              onChange={e => setForm(p => ({ ...p, descripcion: e.target.value }))}
              rows={3}
              placeholder="Describe qué ocurrió con la unidad..."
              style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }}
            />
          </div>

          {form.id_unidad && form.tipo && (
            <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#92400e' }}>
              La unidad cambiará de estado a <strong>"{ESTADO_UNIDAD_MAP[form.tipo]}"</strong> al registrar.
            </div>
          )}
        </div>
      </AppModal>

      {/* ── Modal Cambiar Estado ── */}
      <AppModal
        isOpen={estadoModal}
        onClose={() => setEstadoModal(false)}
        title="Actualizar estado"
        maxWidth={420}
        footer={
          <>
            <AppButton variant="ghost" size="compact" onClick={() => setEstadoModal(false)} disabled={actioning}>Cancelar</AppButton>
            <AppButton size="compact" onClick={handleCambiarEstado} loading={actioning}>Guardar</AppButton>
          </>
        }
      >
        {estadoInc && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ background: '#f8fafc', borderRadius: 10, padding: '12px 14px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontWeight: 600, fontSize: 13 }}>{estadoInc._unidad?.codigo_unidad ?? estadoInc.id_unidad}</div>
              <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>{estadoInc._mat?.nombre ?? '—'}</div>
              <div style={{ marginTop: 8 }}>
                <Badge variant={TIPOS[estadoInc.tipo]?.variant}>{TIPOS[estadoInc.tipo]?.label ?? estadoInc.tipo}</Badge>
              </div>
            </div>

            <div>
              <label style={labelStyle}>Nuevo estado *</label>
              <AppSelect value={formEstado} onChange={e => setFormEstado(e.target.value)}>
                <option value="abierta">Abierta</option>
                <option value="en proceso">En proceso</option>
                <option value="cerrada">Cerrada</option>
              </AppSelect>
            </div>

            {formEstado === 'cerrada' && (
              <div style={{
                background: estadoInc.tipo === 'perdida' ? '#fef2f2' : '#f0fdf4',
                border: `1px solid ${estadoInc.tipo === 'perdida' ? '#fecaca' : '#bbf7d0'}`,
                borderRadius: 8, padding: '10px 14px', fontSize: 13,
                color: estadoInc.tipo === 'perdida' ? '#dc2626' : '#16a34a',
              }}>
                {estadoInc.tipo === 'perdida'
                  ? 'La unidad mantendrá su estado "perdido" al cerrar.'
                  : 'La unidad volverá a "disponible" al cerrar esta incidencia.'}
              </div>
            )}
          </div>
        )}
      </AppModal>

      {/* ── Modal Detalle ── */}
      <AppModal
        isOpen={detailOpen}
        onClose={() => setDetailOpen(false)}
        title="Detalle de incidencia"
        maxWidth={640}
        footer={<AppButton variant="ghost" size="compact" onClick={() => setDetailOpen(false)}>Cerrar</AppButton>}
      >
        {detailInc && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <Row label="Tipo" value={<Badge variant={TIPOS[detailInc.tipo]?.variant ?? 'default'}>{TIPOS[detailInc.tipo]?.label ?? detailInc.tipo}</Badge>} />
              <Row label="Estado" value={<Badge variant={ESTADOS_INC[detailInc.estado]?.variant ?? 'default'}>{ESTADOS_INC[detailInc.estado]?.label ?? detailInc.estado}</Badge>} />
              <Row label="Fecha" value={fmtFecha(detailInc.fecha_incidencia)} />
              <Row label="Reportado por" value={
                detailInc._reporter
                  ? `${detailInc._reporter.nombres ?? ''} ${detailInc._reporter.apellidos ?? ''}`.trim() || detailInc._reporter.correo
                  : '—'
              } />
            </div>

            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 6 }}>
                Descripción
              </div>
              <p style={{ fontSize: 13.5, color: '#374151', margin: 0, lineHeight: 1.6 }}>{detailInc.descripcion}</p>
            </div>

            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 10 }}>
                Unidad afectada
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <Row label="Código" value={detailInc._unidad?.codigo_unidad} />
                <Row label="Material" value={detailInc._mat?.nombre} />
                <Row label="Estado actual" value={detailInc._unidad?.estado} />
              </div>
            </div>
          </div>
        )}
      </AppModal>

      <ConfirmDialog
        isOpen={confirmDel.open}
        title="Eliminar incidencia"
        description="Esta acción no se puede deshacer. ¿Deseas eliminar esta incidencia?"
        confirmLabel="Eliminar"
        variant="danger"
        loading={actioning}
        onConfirm={handleEliminar}
        onCancel={() => setConfirmDel({ open: false, id: '' })}
      />
    </div>
    </>
  )
}

const labelStyle  = { display: 'block', fontSize: 12.5, fontWeight: 600, color: '#374151', marginBottom: 6 }
const inputStyle  = { width: '100%', padding: '9px 12px', border: '1.5px solid #e5e7eb', borderRadius: 8, fontSize: 13.5, color: '#111827', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.15s' }
const selectStyle = { ...inputStyle, background: '#fff', cursor: 'pointer' }

function btnStyle(color) {
  return {
    background: 'none', border: 'none', cursor: 'pointer',
    color, padding: '4px 6px', borderRadius: 6,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    transition: 'background 0.15s',
  }
}
