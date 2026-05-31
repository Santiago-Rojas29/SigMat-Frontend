import { useState, useEffect, useCallback } from 'react'
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

// ── Icons ─────────────────────────────────────────────────────────────────────

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

// ── Configuración de categorías ───────────────────────────────────────────────

const CATEGORIAS = {
  'consumible':    { label: 'Consumible',    color: '#39A900', bg: '#f0fdf4', border: '#bbf7d0', light: '#dcfce7', variant: 'success' },
  'no consumible': { label: 'No Consumible', color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe', light: '#dbeafe', variant: 'default' },
  'perecedero':    { label: 'Perecedero',    color: '#d97706', bg: '#fffbeb', border: '#fde68a', light: '#fef3c7', variant: 'warning' },
}

const CATEGORIA_OPTIONS = [
  { value: 'consumible',    label: 'Consumible' },
  { value: 'no consumible', label: 'No Consumible' },
  { value: 'perecedero',    label: 'Perecedero' },
]

const UNIDADES_MEDIDA = [
  { value: 'und',     label: 'Unidades (und)' },
  { value: 'cja',     label: 'Cajas (cja)' },
  { value: 'paq',     label: 'Paquetes (paq)' },
  { value: 'res',     label: 'Resmas (res)' },
  { value: 'bol',     label: 'Bolsas (bol)' },
  { value: 'rol',     label: 'Rollos (rol)' },
  { value: 'L',       label: 'Litros (L)' },
  { value: 'mL',      label: 'Mililitros (mL)' },
  { value: 'kg',      label: 'Kilogramos (kg)' },
  { value: 'g',       label: 'Gramos (g)' },
  { value: 'm',       label: 'Metros (m)' },
  { value: 'cm',      label: 'Centímetros (cm)' },
]

const EMPTY_FORM = {
  id_ficha: '', nombre: '', categoria: 'consumible',
  tipo: '', marca: '', modelo: '', descripcion: '', codigo_unspsc: '',
  unidad_medida: '', fecha_vencimiento: '',
}

const CARDS_MAT = [
  { key: null,           label: 'Todos',          color: '#111827', bg: '#fff',    border: '#e5e7eb',
    paths: <><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></> },
  { key: 'consumible',    label: 'Consumibles',    color: '#39A900', bg: '#f0fdf4', border: '#bbf7d0',
    paths: <><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 002 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></> },
  { key: 'no consumible', label: 'No consumibles', color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe',
    paths: <><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></> },
  { key: 'perecedero',    label: 'Perecederos',    color: '#d97706', bg: '#fffbeb', border: '#fde68a',
    paths: <><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></> },
]

// ── Page ──────────────────────────────────────────────────────────────────────

export function MaterialesPage() {
  const { hasPermission } = usePermissions()
  const isAdmin = hasPermission('administracion')

  const [materiales,   setMateriales]   = useState([])
  const [fichas,       setFichas]       = useState([])
  const [loading,      setLoading]      = useState(true)
  const [error,        setError]        = useState(null)
  const [activeCateg,  setActiveCateg]  = useState(null) // null = todos

  const [modal,        setModal]        = useState(null)
  const [form,         setForm]         = useState(EMPTY_FORM)
  const [saving,       setSaving]       = useState(false)
  const [formError,    setFormError]    = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting,     setDeleting]     = useState(false)

  // ── Carga ──────────────────────────────────────────────────────────────────

  const loadData = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const [mRes, fRes] = await Promise.all([api.get('/material'), api.get('/ficha')])
      setMateriales(mRes.data)
      setFichas(fRes.data)
    } catch { setError('No se pudo cargar la información.') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  // ── Helpers ────────────────────────────────────────────────────────────────

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))
  const cfg = (cat) => CATEGORIAS[cat] ?? CATEGORIAS['consumible']
  const countCat = (cat) => materiales.filter(m => m.categoria === cat).length
  const fichaNombre = (id) => {
    const f = fichas.find(f => f.id_ficha === id)
    return f ? `Ficha ${f.codigo_ficha}` : '—'
  }

  const datosTabla = activeCateg
    ? materiales.filter(m => m.categoria === activeCateg)
    : materiales

  // ── Modal ──────────────────────────────────────────────────────────────────

  const openCreate = () => {
    setForm({ ...EMPTY_FORM, categoria: activeCateg ?? 'consumible', id_ficha: fichas[0]?.id_ficha ?? '' })
    setFormError(null)
    setModal({ mode: 'create' })
  }

  const openEdit = (m) => {
    setForm({
      id_ficha: m.id_ficha, nombre: m.nombre, categoria: m.categoria,
      tipo: m.tipo, marca: m.marca, modelo: m.modelo,
      descripcion: m.descripcion, codigo_unspsc: m.codigo_unspsc,
      unidad_medida: m.unidad_medida ?? '',
      fecha_vencimiento: m.fecha_vencimiento ? m.fecha_vencimiento.substring(0, 10) : '',
    })
    setFormError(null)
    setModal({ mode: 'edit', data: m })
  }

  const closeModal = () => { setModal(null); setFormError(null) }

  const handleSave = async () => {
    setSaving(true); setFormError(null)
    try {
      const payload = { ...form }
      if (!payload.unidad_medida)    delete payload.unidad_medida
      if (!payload.fecha_vencimiento) delete payload.fecha_vencimiento
      if (modal.mode === 'create') {
        await api.post('/material', payload)
      } else {
        await api.patch(`/material/${modal.data.id}`, payload)
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
      await api.delete(`/material/${deleteTarget.id}`)
      setDeleteTarget(null); loadData()
    } catch (e) {
      const msg = e.response?.data?.message
      alert(Array.isArray(msg) ? msg.join(', ') : (msg ?? 'Error al eliminar.'))
    } finally { setDeleting(false) }
  }

  const handleBulkDelete = async (ids) => {
    await Promise.all(ids.map(id => api.delete(`/material/${id}`)))
    loadData()
  }

  // ── Columnas ───────────────────────────────────────────────────────────────

  const columns = [
    {
      key: 'nombre',
      header: 'Nombre',
      render: (m) => <span style={{ fontWeight: 600, color: '#111827' }}>{m.nombre}</span>,
    },
    {
      key: 'categoria',
      header: 'Categoría',
      width: 140,
      render: (m) => {
        const c = cfg(m.categoria)
        return (
          <span style={{
            display: 'inline-flex', alignItems: 'center',
            padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600,
            background: c.light, color: c.color, border: `1px solid ${c.border}`,
          }}>
            {c.label}
          </span>
        )
      },
    },
    { key: 'marca',  header: 'Marca',  render: (m) => <span style={{ color: '#374151' }}>{m.marca}</span> },
    { key: 'modelo', header: 'Modelo', render: (m) => <span style={{ color: '#374151' }}>{m.modelo}</span> },
    { key: 'tipo',   header: 'Tipo',   render: (m) => <span style={{ color: '#6b7280' }}>{m.tipo}</span> },
    {
      key: 'unidad_medida',
      header: 'Unidad',
      width: 90,
      render: (m) => m.unidad_medida
        ? <Badge variant="default" style={{ fontSize: 11 }}>{m.unidad_medida}</Badge>
        : <span style={{ color: '#d1d5db' }}>—</span>,
    },
    {
      key: 'fecha_vencimiento',
      header: 'Vencimiento',
      width: 120,
      render: (m) => {
        if (!m.fecha_vencimiento) return <span style={{ color: '#d1d5db' }}>—</span>
        const fecha = new Date(m.fecha_vencimiento)
        const hoy   = new Date()
        const diff  = Math.ceil((fecha - hoy) / (1000 * 60 * 60 * 24))
        const vencido = diff < 0
        const proximo = diff >= 0 && diff <= 30
        return (
          <span style={{
            fontSize: 12, fontWeight: 500,
            color: vencido ? '#dc2626' : proximo ? '#d97706' : '#374151',
          }}>
            {fecha.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })}
            {vencido && <span style={{ marginLeft: 4, fontSize: 10, color: '#dc2626' }}>● Vencido</span>}
            {proximo && <span style={{ marginLeft: 4, fontSize: 10, color: '#d97706' }}>● Próximo</span>}
          </span>
        )
      },
    },
    {
      key: 'codigo_unspsc',
      header: 'Cód. UNSPSC',
      width: 120,
      render: (m) => (
        <code style={{ fontSize: 12, background: '#f3f4f6', padding: '2px 8px', borderRadius: 5, color: '#374151' }}>
          {m.codigo_unspsc}
        </code>
      ),
    },
    {
      key: 'acciones',
      header: '',
      align: 'right',
      width: 90,
      render: (m) => (
        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
          <IconButton variant="edit"   title="Editar"    onClick={() => openEdit(m)}><EditIcon /></IconButton>
          {isAdmin && <IconButton variant="delete" title="Eliminar"  onClick={() => setDeleteTarget(m)}><TrashIcon /></IconButton>}
        </div>
      ),
    },
  ]

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div>
      <PageHeader title="Materiales" description="Catálogo de materiales del almacén SENA" />

      <div style={{ display: 'flex', gap: 14, marginBottom: 24, flexWrap: 'wrap' }}>
        {CARDS_MAT.map(card => {
          const isActive = activeCateg === card.key
          const count    = card.key === null ? materiales.length : countCat(card.key)
          return (
            <button
              key={String(card.key)}
              onClick={() => setActiveCateg(isActive ? null : card.key)}
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

      {/* ── Tabla ─────────────────────────────────────────────────────────── */}
      <DataTable
        columns={columns}
        data={datosTabla}
        loading={loading}
        error={error}
        onRetry={loadData}
        searchable
        searchPlaceholder="Buscar por nombre, marca, modelo…"
        pageSize={10}
        selectable={isAdmin}
        onBulkDelete={isAdmin ? handleBulkDelete : undefined}
        emptyTitle="Sin materiales"
        emptyDescription={activeCateg ? `No hay materiales en la categoría ${cfg(activeCateg).label}.` : 'Agrega el primer material al catálogo.'}
        emptyAction={
          <AppButton size="compact" onClick={openCreate}>
            <PlusIcon /> Nuevo material
          </AppButton>
        }
        actions={
          <>
            <AppButton variant="ghost" size="compact" onClick={loadData} disabled={loading}>
              <RefreshIcon /> Actualizar
            </AppButton>
            <AppButton size="compact" onClick={openCreate}>
              <PlusIcon /> Nuevo material
            </AppButton>
          </>
        }
      />

      {/* ── Modal crear / editar ───────────────────────────────────────────── */}
      <AppModal
        isOpen={!!modal}
        onClose={closeModal}
        title={modal?.mode === 'create' ? 'Nuevo material' : `Editar — ${modal?.data?.nombre ?? ''}`}
        footer={
          <>
            <AppButton variant="ghost" size="compact" onClick={closeModal} disabled={saving}>Cancelar</AppButton>
            <AppButton size="compact" onClick={handleSave} loading={saving}>
              {modal?.mode === 'create' ? 'Crear material' : 'Guardar cambios'}
            </AppButton>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Selector visual de categoría */}
          <div>
            <p style={{ fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.6px' }}>
              Categoría *
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
              {CATEGORIA_OPTIONS.map(({ value, label }) => {
                const c   = CATEGORIAS[value]
                const sel = form.categoria === value
                return (
                  <button key={value} type="button" onClick={() => set('categoria', value)} style={{
                    padding: '10px 8px', borderRadius: 10, cursor: 'pointer', textAlign: 'center',
                    border:     `2px solid ${sel ? c.color : c.border}`,
                    background: sel ? c.color : c.bg,
                    color:      sel ? '#fff' : c.color,
                    fontWeight: 600, fontSize: 12.5, fontFamily: 'inherit',
                    transition: 'all 0.15s',
                  }}>
                    {label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Campos condicionales por categoría */}
          {(form.categoria === 'consumible' || form.categoria === 'perecedero') && (
            <div style={{ display: 'flex', gap: 14 }}>
              <FormField label="Unidad de medida" required>
                <AppSelect size="sm" value={form.unidad_medida} onChange={e => set('unidad_medida', e.target.value)}>
                  <option value="">— Seleccionar —</option>
                  {UNIDADES_MEDIDA.map(u => (
                    <option key={u.value} value={u.value}>{u.label}</option>
                  ))}
                </AppSelect>
              </FormField>
              {form.categoria === 'perecedero' && (
                <FormField label="Fecha de vencimiento" required>
                  <AppInput
                    size="sm"
                    type="date"
                    value={form.fecha_vencimiento}
                    onChange={e => set('fecha_vencimiento', e.target.value)}
                  />
                </FormField>
              )}
            </div>
          )}

          {/* Fila: nombre + ficha */}
          <div style={{ display: 'flex', gap: 14 }}>
            <FormField label="Nombre" required>
              <AppInput size="sm" value={form.nombre} placeholder="Ej. Computador portátil"
                onChange={e => set('nombre', e.target.value)} />
            </FormField>
            <FormField label="Ficha" required>
              <AppSelect size="sm" value={form.id_ficha} onChange={e => set('id_ficha', e.target.value)}>
                <option value="">— Seleccionar —</option>
                {fichas.map(f => (
                  <option key={f.id_ficha} value={f.id_ficha}>Ficha {f.codigo_ficha}</option>
                ))}
              </AppSelect>
            </FormField>
          </div>

          {/* Fila: marca + modelo */}
          <div style={{ display: 'flex', gap: 14 }}>
            <FormField label="Marca" required>
              <AppInput size="sm" value={form.marca} placeholder="Ej. HP, Lenovo, Bosch"
                onChange={e => set('marca', e.target.value)} />
            </FormField>
            <FormField label="Modelo" required>
              <AppInput size="sm" value={form.modelo} placeholder="Ej. 240 G9"
                onChange={e => set('modelo', e.target.value)} />
            </FormField>
          </div>

          {/* Fila: tipo + código UNSPSC */}
          <div style={{ display: 'flex', gap: 14 }}>
            <FormField label="Tipo" required>
              <AppInput size="sm" value={form.tipo} placeholder="Ej. Laptop, Herramienta, Insumo"
                onChange={e => set('tipo', e.target.value)} />
            </FormField>
            <FormField label="Código UNSPSC" required>
              <AppInput size="sm" value={form.codigo_unspsc} placeholder="Ej. 43211503"
                onChange={e => set('codigo_unspsc', e.target.value)} />
            </FormField>
          </div>

          <FormField label="Descripción" required>
            <AppInput size="sm" value={form.descripcion} placeholder="Descripción detallada del material"
              onChange={e => set('descripcion', e.target.value)} />
          </FormField>

          {formError && <AlertBanner variant="error">{formError}</AlertBanner>}
        </div>
      </AppModal>

      {/* ── Confirmar eliminación ──────────────────────────────────────────── */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Eliminar material"
        description={
          deleteTarget
            ? <>¿Eliminar <strong>{deleteTarget.nombre}</strong>? Esta acción no se puede deshacer.</>
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
