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

const EMPTY_FORM = {
  id_ficha: '', nombre: '', categoria: 'consumible',
  tipo: '', marca: '', modelo: '', descripcion: '', codigo_unspsc: '',
}

const CSS = `
  .mat-cat-btn { transition: all 0.15s; cursor: pointer; border: none; text-align: left; }
  .mat-cat-btn:hover { filter: brightness(0.96); transform: translateY(-1px); }
`

// ── Page ──────────────────────────────────────────────────────────────────────

export function MaterialesPage() {
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
    })
    setFormError(null)
    setModal({ mode: 'edit', data: m })
  }

  const closeModal = () => { setModal(null); setFormError(null) }

  const handleSave = async () => {
    setSaving(true); setFormError(null)
    try {
      if (modal.mode === 'create') {
        await api.post('/material', form)
      } else {
        await api.patch(`/material/${modal.data.id}`, form)
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
          <IconButton variant="delete" title="Eliminar"  onClick={() => setDeleteTarget(m)}><TrashIcon /></IconButton>
        </div>
      ),
    },
  ]

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div>
      <style>{CSS}</style>

      <PageHeader title="Materiales" description="Catálogo de materiales del almacén SENA" />

      {/* ── Tarjetas de categoría ──────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: 10, marginBottom: 24 }}>

        {/* Todos */}
        <button className="mat-cat-btn" onClick={() => setActiveCateg(null)} style={{
          background: activeCateg === null ? '#111827' : '#fff',
          border: `2px solid ${activeCateg === null ? '#111827' : '#e5e7eb'}`,
          borderRadius: 14, padding: '16px 18px',
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: activeCateg === null ? 'rgba(255,255,255,0.12)' : '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Ic size={20} color={activeCateg === null ? '#fff' : '#6b7280'}>
              <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
              <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
            </Ic>
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: activeCateg === null ? '#fff' : '#374151' }}>Todos</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: activeCateg === null ? '#fff' : '#111827', lineHeight: 1.1 }}>{materiales.length}</div>
          </div>
        </button>

        {/* Por categoría */}
        {CATEGORIA_OPTIONS.map(({ value, label }) => {
          const c        = CATEGORIAS[value]
          const isActive = activeCateg === value
          const count    = countCat(value)
          return (
            <button key={value} className="mat-cat-btn" onClick={() => setActiveCateg(isActive ? null : value)} style={{
              background: isActive ? c.color : c.bg,
              border:     `2px solid ${isActive ? c.color : c.border}`,
              borderRadius: 14, padding: '16px 18px',
              display: 'flex', alignItems: 'center', gap: 12,
            }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: isActive ? 'rgba(255,255,255,0.18)' : c.light, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Ic size={20} color={isActive ? '#fff' : c.color}>
                  <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 002 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/>
                  <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
                  <line x1="12" y1="22.08" x2="12" y2="12"/>
                </Ic>
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: isActive ? '#fff' : '#374151' }}>{label}</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: isActive ? '#fff' : c.color, lineHeight: 1.1 }}>{count}</div>
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
        selectable
        onBulkDelete={handleBulkDelete}
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
