import { useState, useEffect, useCallback } from 'react'
import api from '../../services/api'
import { AppButton }     from '../../components/atoms/AppButton'
import { AppInput }      from '../../components/atoms/AppInput'
import { AppSelect }     from '../../components/atoms/AppSelect'
import { Badge }         from '../../components/atoms/Badge'
import { FormField }     from '../../components/molecules/FormField'
import { PageHeader }    from '../../components/molecules/PageHeader'
import { AlertBanner }   from '../../components/molecules/AlertBanner'
import { ConfirmDialog } from '../../components/molecules/ConfirmDialog'
import { AppModal }      from '../../components/organisms/AppModal'

// ── Icons ─────────────────────────────────────────────────────────────────────

function Ic({ size = 20, children, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {children}
    </svg>
  )
}

const PlusIcon    = ({ size = 16 }) => <Ic size={size}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></Ic>
const EditIcon    = ({ size = 14 }) => <Ic size={size}><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></Ic>
const TrashIcon   = ({ size = 14 }) => <Ic size={size}><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></Ic>
const RefreshIcon = ({ size = 16 }) => <Ic size={size}><path d="M23 4v6h-6"/><path d="M1 20v-6h6"/><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/></Ic>
const GridIcon    = ({ size = 20, color }) => <Ic size={size} color={color}><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></Ic>
const BoxIcon     = ({ size = 20, color }) => <Ic size={size} color={color}><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 002 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></Ic>

// Paleta de colores para tipos dinámicos
const PALETA = [
  { color: '#39A900', bg: '#f0fdf4', border: '#bbf7d0', light: '#dcfce7' },
  { color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe', light: '#dbeafe' },
  { color: '#d97706', bg: '#fffbeb', border: '#fde68a', light: '#fef3c7' },
  { color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe', light: '#ede9fe' },
  { color: '#db2777', bg: '#fdf2f8', border: '#fbcfe8', light: '#fce7f3' },
  { color: '#0891b2', bg: '#ecfeff', border: '#a5f3fc', light: '#cffafe' },
]

const CSS = `
  .ub-type-btn { transition: all 0.15s; cursor: pointer; border: none; text-align: left; }
  .ub-type-btn:hover { filter: brightness(0.96); transform: translateY(-1px); }
  .ub-card { transition: box-shadow 0.18s, transform 0.18s; }
  .ub-card:hover { box-shadow: 0 8px 24px rgba(0,0,0,0.10); transform: translateY(-2px); }
  .ub-icon-btn { background: none; border: none; cursor: pointer; padding: 5px; border-radius: 6px; display: flex; align-items: center; transition: background 0.15s; }
  .ub-icon-btn:hover { background: rgba(0,0,0,0.06); }
  @keyframes fadeIn { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
  .ub-enter { animation: fadeIn 0.22s ease both; }
  @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.45} }
`

export function UbicacionesPage() {
  const [tipos,       setTipos]       = useState([])
  const [ubicaciones, setUbicaciones] = useState([])
  const [areas,       setAreas]       = useState([])
  const [loading,     setLoading]     = useState(true)
  const [error,       setError]       = useState(null)
  const [activeType,  setActiveType]  = useState(null) // id del tipo filtrado, null = todos

  // Modal tipo
  const [tipoModal,  setTipoModal]  = useState(null)
  const [tipoForm,   setTipoForm]   = useState({ nombre: '', descripcion: '' })
  const [tipoSaving, setTipoSaving] = useState(false)
  const [tipoError,  setTipoError]  = useState(null)
  const [deleteTipo, setDeleteTipo] = useState(null)
  const [delTipo,    setDelTipo]    = useState(false)

  // Modal ubicación
  const [ubModal,  setUbModal]  = useState(null)
  const [ubForm,   setUbForm]   = useState({ nombre: '', descripcion: '', id_area: '', id_tipo_ubicacion: '', estado: 'activo' })
  const [ubSaving, setUbSaving] = useState(false)
  const [ubError,  setUbError]  = useState(null)
  const [deleteUb, setDeleteUb] = useState(null)
  const [delUb,    setDelUb]    = useState(false)

  // ── Carga ──────────────────────────────────────────────────────────────────

  const loadData = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const [tRes, uRes, aRes] = await Promise.all([
        api.get('/tipo-ubicacion'),
        api.get('/ubicacion'),
        api.get('/area'),
      ])
      setTipos(tRes.data)
      setUbicaciones(uRes.data)
      setAreas(aRes.data)
    } catch { setError('No se pudo cargar la información.') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  // ── Helpers ────────────────────────────────────────────────────────────────

  const setT = (k, v) => setTipoForm(p => ({ ...p, [k]: v }))
  const setU = (k, v) => setUbForm(p => ({ ...p, [k]: v }))

  const colorDeTipo = (id) => PALETA[(tipos.findIndex(t => String(t.id_tipo_ubicacion) === String(id))) % PALETA.length] ?? PALETA[0]
  const areaNombre  = (id) => areas.find(a => String(a.id_area) === String(id))?.nombre ?? '—'
  const countDeTipo = (id) => ubicaciones.filter(u => String(u.id_tipo_ubicacion) === String(id)).length

  const ubicacionesFiltradas = activeType
    ? ubicaciones.filter(u => String(u.id_tipo_ubicacion) === String(activeType))
    : ubicaciones

  // ── CRUD Tipos ────────────────────────────────────────────────────────────

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
      setDeleteTipo(null); if (activeType === deleteTipo.id_tipo_ubicacion) setActiveType(null)
      loadData()
    } catch (e) {
      const msg = e.response?.data?.message
      alert(Array.isArray(msg) ? msg.join(', ') : (msg ?? 'Error al eliminar.'))
    } finally { setDelTipo(false) }
  }

  // ── CRUD Ubicaciones ──────────────────────────────────────────────────────

  const openCrearUb = (id_tipo = '') => {
    setUbForm({ nombre: '', descripcion: '', estado: 'activo', id_tipo_ubicacion: String(id_tipo), id_area: String(areas[0]?.id_area ?? '') })
    setUbError(null)
    setUbModal({ mode: 'create' })
  }

  const openEditUb = (u) => {
    setUbForm({ nombre: u.nombre, descripcion: u.descripcion, estado: u.estado, id_tipo_ubicacion: String(u.id_tipo_ubicacion), id_area: String(u.id_area) })
    setUbError(null)
    setUbModal({ mode: 'edit', data: u })
  }

  const handleSaveUb = async () => {
    if (!ubForm.nombre.trim())        { setUbError('El nombre es obligatorio.'); return }
    if (!ubForm.id_tipo_ubicacion)    { setUbError('Selecciona un tipo.'); return }
    if (!ubForm.id_area)              { setUbError('Selecciona un área.'); return }
    setUbSaving(true); setUbError(null)
    const payload = { ...ubForm, id_area: String(ubForm.id_area), id_tipo_ubicacion: String(ubForm.id_tipo_ubicacion) }
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
      alert(Array.isArray(msg) ? msg.join(', ') : (msg ?? 'Error al eliminar.'))
    } finally { setDelUb(false) }
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div>
      <style>{CSS}</style>

      {/* ── Cabecera con botón verde arriba ───────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20, gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#111827', margin: 0, letterSpacing: '-0.3px' }}>Ubicaciones</h1>
          <p style={{ fontSize: 13.5, color: '#6b7280', marginTop: 4 }}>Gestiona los espacios físicos del almacén por tipo</p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
          <AppButton variant="ghost" size="compact" onClick={loadData} disabled={loading}>
            <RefreshIcon /> Actualizar
          </AppButton>
          <AppButton size="compact" onClick={openCrearTipo}>
            <PlusIcon /> Nuevo tipo
          </AppButton>
        </div>
      </div>

      {error && <AlertBanner variant="error" style={{ marginBottom: 16 }}>{error}</AlertBanner>}

      {/* ── Tarjetas de tipo como filtro ───────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 10, marginBottom: 24 }}>

        {/* Tarjeta "Todos" */}
        <button className="ub-type-btn" onClick={() => setActiveType(null)} style={{
          background: activeType === null ? '#111827' : '#fff',
          border: `2px solid ${activeType === null ? '#111827' : '#e5e7eb'}`,
          borderRadius: 14, padding: '16px 18px',
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: activeType === null ? 'rgba(255,255,255,0.12)' : '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <GridIcon size={20} color={activeType === null ? '#fff' : '#6b7280'} />
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: activeType === null ? '#fff' : '#374151' }}>Todos</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: activeType === null ? '#fff' : '#111827', lineHeight: 1.1 }}>{ubicaciones.length}</div>
          </div>
        </button>

        {/* Tarjeta por tipo */}
        {tipos.map((tipo, idx) => {
          const c       = PALETA[idx % PALETA.length]
          const isActive = String(activeType) === String(tipo.id_tipo_ubicacion)
          const count   = countDeTipo(tipo.id_tipo_ubicacion)
          return (
            <button key={tipo.id_tipo_ubicacion} className="ub-type-btn" onClick={() => setActiveType(isActive ? null : tipo.id_tipo_ubicacion)} style={{
              background: isActive ? c.color : c.bg,
              border:     `2px solid ${isActive ? c.color : c.border}`,
              borderRadius: 14, padding: '16px 18px',
              display: 'flex', alignItems: 'center', gap: 12,
            }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: isActive ? 'rgba(255,255,255,0.18)' : c.light, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <BoxIcon size={20} color={isActive ? '#fff' : c.color} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: isActive ? '#fff' : '#374151', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{tipo.nombre}</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: isActive ? '#fff' : c.color, lineHeight: 1.1 }}>{count}</div>
              </div>
              {/* Botón + para crear ubicación de ese tipo */}
              <button
                onClick={e => { e.stopPropagation(); openCrearUb(tipo.id_tipo_ubicacion) }}
                style={{ width: 28, height: 28, borderRadius: 7, border: 'none', background: isActive ? 'rgba(255,255,255,0.22)' : c.light, color: isActive ? '#fff' : c.color, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}
                title={`Nueva ubicación de tipo ${tipo.nombre}`}
              >
                <PlusIcon size={15} />
              </button>
            </button>
          )
        })}
      </div>

      {/* ── Sección de ubicaciones ─────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <h3 style={{ fontSize: 13.5, fontWeight: 600, color: '#374151', margin: 0 }}>
          {activeType
            ? `${tipos.find(t => String(t.id_tipo_ubicacion) === String(activeType))?.nombre ?? ''} (${ubicacionesFiltradas.length})`
            : `Todas las ubicaciones (${ubicaciones.length})`}
        </h3>
        <AppButton size="compact" onClick={() => openCrearUb(activeType ?? '')}>
          <PlusIcon size={14} /> Nueva ubicación
        </AppButton>
      </div>

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 }}>
          {[1,2,3,4,5,6].map(i => (
            <div key={i} style={{ height: 120, borderRadius: 12, background: '#f3f4f6', animation: 'pulse 1.5s ease-in-out infinite', opacity: 1 - i * 0.08 }} />
          ))}
        </div>
      ) : ubicacionesFiltradas.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '52px 20px', border: '2px dashed #e5e7eb', borderRadius: 14, background: '#fafafa' }}>
          <div style={{ color: '#d1d5db', marginBottom: 10, display: 'flex', justifyContent: 'center' }}>
            <BoxIcon size={44} color="#d1d5db" />
          </div>
          <p style={{ fontWeight: 600, color: '#374151', marginBottom: 4 }}>Sin ubicaciones</p>
          <p style={{ fontSize: 13, color: '#9ca3af', marginBottom: 18 }}>
            {activeType ? `No hay ubicaciones de este tipo.` : 'Aún no hay ubicaciones registradas.'}
          </p>
          <AppButton size="compact" onClick={() => openCrearUb(activeType ?? '')}>
            <PlusIcon /> Crear primera ubicación
          </AppButton>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 }}>
          {ubicacionesFiltradas.map((u, i) => {
            const c = colorDeTipo(u.id_tipo_ubicacion)
            const tipoNombre = tipos.find(t => String(t.id_tipo_ubicacion) === String(u.id_tipo_ubicacion))?.nombre ?? '—'
            return (
              <div key={u.id_ubicacion} className="ub-card ub-enter" style={{ background: '#fff', borderRadius: 12, padding: '16px 18px', border: '1px solid #e5e7eb', position: 'relative', animationDelay: `${i * 35}ms` }}>
                <div style={{ position: 'absolute', top: 0, left: 14, right: 14, height: 3, borderRadius: '0 0 4px 4px', background: c.color }} />
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginTop: 6, marginBottom: 8 }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14, color: '#111827' }}>{u.nombre}</div>
                    <div style={{ fontSize: 11, color: c.color, fontWeight: 600, marginTop: 1 }}>{tipoNombre}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 2 }}>
                    <button className="ub-icon-btn" onClick={() => openEditUb(u)} style={{ color: '#6b7280' }}><EditIcon /></button>
                    <button className="ub-icon-btn" onClick={() => setDeleteUb(u)} style={{ color: '#ef4444' }}><TrashIcon /></button>
                  </div>
                </div>
                <p style={{ fontSize: 12, color: '#6b7280', marginBottom: 10, lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {u.descripcion || 'Sin descripción'}
                </p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 11, color: '#9ca3af' }}>📍 {areaNombre(u.id_area)}</span>
                  <Badge variant={u.estado === 'activo' ? 'success' : 'default'} style={{ fontSize: 10 }}>
                    {u.estado === 'activo' ? 'Activo' : 'Inactivo'}
                  </Badge>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── Modal: Nuevo tipo ─────────────────────────────────────────────── */}
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
            <AppInput size="sm" value={tipoForm.nombre} placeholder="Ej. Bodega de herramientas, Cuarto frío..."
              onChange={e => setT('nombre', e.target.value)} />
          </FormField>
          <FormField label="Descripción" required>
            <AppInput size="sm" value={tipoForm.descripcion} placeholder="Ej. Espacio para almacenar herramientas"
              onChange={e => setT('descripcion', e.target.value)} />
          </FormField>
          {tipoError && <AlertBanner variant="error">{tipoError}</AlertBanner>}
        </div>
      </AppModal>

      {/* ── Modal: Nueva ubicación ────────────────────────────────────────── */}
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
            <AppInput size="sm" value={ubForm.nombre} placeholder="Ej. Bodega A, Laboratorio 1..."
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
          <FormField label="Estado">
            <AppSelect size="sm" value={ubForm.estado} onChange={e => setU('estado', e.target.value)}>
              <option value="activo">Activo</option>
              <option value="inactivo">Inactivo</option>
            </AppSelect>
          </FormField>
          {ubError && <AlertBanner variant="error">{ubError}</AlertBanner>}
        </div>
      </AppModal>

      {/* ── Confirmar eliminar tipo ────────────────────────────────────────── */}
      <ConfirmDialog
        isOpen={!!deleteTipo}
        title="Eliminar tipo"
        description={deleteTipo ? <>¿Eliminar el tipo <strong>{deleteTipo.nombre}</strong>?</> : null}
        confirmLabel="Sí, eliminar"
        onConfirm={handleDeleteTipo}
        onCancel={() => setDeleteTipo(null)}
        loading={delTipo}
      />

      {/* ── Confirmar eliminar ubicación ───────────────────────────────────── */}
      <ConfirmDialog
        isOpen={!!deleteUb}
        title="Eliminar ubicación"
        description={deleteUb ? <>¿Eliminar <strong>{deleteUb.nombre}</strong>?</> : null}
        confirmLabel="Sí, eliminar"
        onConfirm={handleDeleteUb}
        onCancel={() => setDeleteUb(null)}
        loading={delUb}
      />
    </div>
  )
}
