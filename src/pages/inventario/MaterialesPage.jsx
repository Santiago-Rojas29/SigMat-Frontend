import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
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

// ── Constants ─────────────────────────────────────────────────────────────────

const CATEGORIAS = {
  'consumible':    { label: 'Consumible',    color: '#39A900', bg: '#f0fdf4', border: '#bbf7d0', light: '#dcfce7' },
  'no consumible': { label: 'No Consumible', color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe', light: '#dbeafe' },
  'perecedero':    { label: 'Perecedero',    color: '#d97706', bg: '#fffbeb', border: '#fde68a', light: '#fef3c7' },
}

const CATEGORIA_OPTIONS = [
  { value: 'consumible',    label: 'Consumible' },
  { value: 'no consumible', label: 'No Consumible' },
  { value: 'perecedero',    label: 'Perecedero' },
]

const UNIDADES_MEDIDA = [
  { value: 'und', label: 'Unidades (und)' },
  { value: 'cja', label: 'Cajas (cja)' },
  { value: 'paq', label: 'Paquetes (paq)' },
  { value: 'res', label: 'Resmas (res)' },
  { value: 'bol', label: 'Bolsas (bol)' },
  { value: 'rol', label: 'Rollos (rol)' },
  { value: 'L',   label: 'Litros (L)' },
  { value: 'mL',  label: 'Mililitros (mL)' },
  { value: 'kg',  label: 'Kilogramos (kg)' },
  { value: 'g',   label: 'Gramos (g)' },
  { value: 'm',   label: 'Metros (m)' },
  { value: 'cm',  label: 'Centímetros (cm)' },
]

const CARDS = [
  { key: null,           label: 'Todos',          color: '#111827', bg: '#fff',    border: '#e5e7eb',
    paths: <><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></> },
  { key: 'consumible',    label: 'Consumibles',    color: '#39A900', bg: '#f0fdf4', border: '#bbf7d0',
    paths: <><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 002 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></> },
  { key: 'no consumible', label: 'No consumibles', color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe',
    paths: <><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></> },
  { key: 'perecedero',    label: 'Perecederos',    color: '#d97706', bg: '#fffbeb', border: '#fde68a',
    paths: <><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></> },
]

const EMPTY_FORM = {
  nombre: '', categoria: 'consumible', tipo: '',
  marca: '', modelo: '', descripcion: '', codigo_unspsc: '', unidad_medida: '',
}

// ── Helpers ────────────────────────────────────────────────────────────────────

const esNoConsumible = (cat) => cat === 'no consumible'
const esConsumibleOPerecedero = (cat) => cat === 'consumible' || cat === 'perecedero'

// ── Page ──────────────────────────────────────────────────────────────────────

export function MaterialesPage() {
  const { hasPermission } = usePermissions()
  const isAdmin  = hasPermission('administracion')
  const navigate = useNavigate()

  const [materiales,   setMateriales]   = useState([])
  const [loading,      setLoading]      = useState(true)
  const [error,        setError]        = useState(null)
  const [activeCateg,  setActiveCateg]  = useState(null)

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
      const { data } = await api.get('/material')
      setMateriales(data)
    } catch { setError('No se pudo cargar la información.') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  // ── Helpers ────────────────────────────────────────────────────────────────

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))
  const cfg = (cat) => CATEGORIAS[cat] ?? CATEGORIAS['consumible']
  const countCat = (cat) => materiales.filter(m => m.categoria === cat).length
  const datosTabla = activeCateg ? materiales.filter(m => m.categoria === activeCateg) : materiales

  const resetCondicionales = (categoria) => {
    setForm(p => ({
      ...p,
      categoria,
      modelo: esNoConsumible(categoria) ? p.modelo : '',
      unidad_medida: esConsumibleOPerecedero(categoria) ? p.unidad_medida : '',
    }))
  }

  // ── Modal ──────────────────────────────────────────────────────────────────

  const openCreate = () => {
    setForm({ ...EMPTY_FORM, categoria: activeCateg ?? 'consumible' })
    setFormError(null)
    setModal({ mode: 'create' })
  }

  const openEdit = (m) => {
    setForm({
      nombre:        m.nombre,
      categoria:     m.categoria,
      tipo:          m.tipo,
      marca:         m.marca ?? '',
      modelo:        m.modelo ?? '',
      descripcion:   m.descripcion,
      codigo_unspsc: m.codigo_unspsc,
      unidad_medida: m.unidad_medida ?? '',
    })
    setFormError(null)
    setModal({ mode: 'edit', data: m })
  }

  const closeModal = () => { setModal(null); setFormError(null) }

  const handleSave = async () => {
    setSaving(true); setFormError(null)
    try {
      const payload = {
        nombre:        form.nombre,
        categoria:     form.categoria,
        tipo:          form.tipo,
        marca:         form.marca || null,
        modelo:        esNoConsumible(form.categoria) ? (form.modelo || null) : null,
        descripcion:   form.descripcion,
        codigo_unspsc: form.codigo_unspsc,
        unidad_medida: esConsumibleOPerecedero(form.categoria) ? (form.unidad_medida || null) : null,
      }
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
    { key: 'tipo', header: 'Tipo', render: (m) => <span style={{ color: '#6b7280' }}>{m.tipo}</span> },
    {
      key: 'marca_modelo',
      header: 'Marca / Modelo',
      render: (m) => (
        <div style={{ fontSize: 13 }}>
          {m.marca && <span style={{ color: '#374151' }}>{m.marca}</span>}
          {m.marca && m.modelo && <span style={{ color: '#d1d5db', margin: '0 4px' }}>·</span>}
          {m.modelo && <span style={{ color: '#6b7280' }}>{m.modelo}</span>}
          {!m.marca && !m.modelo && <span style={{ color: '#d1d5db' }}>—</span>}
        </div>
      ),
    },
    {
      key: 'unidad_medida',
      header: 'Unidad',
      width: 90,
      render: (m) => m.unidad_medida
        ? <Badge variant="default" style={{ fontSize: 11 }}>{m.unidad_medida}</Badge>
        : <span style={{ color: '#d1d5db' }}>—</span>,
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
      width: 130,
      render: (m) => (
        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
          {m.categoria === 'no consumible' && (
            <IconButton
              title="Ver unidades"
              onClick={() => navigate(`/inventario/unidades?material=${m.id}`)}
              style={{ color: '#2563eb' }}
            >
              <AppIcon name="link" size={14} />
            </IconButton>
          )}
          {(m.categoria === 'consumible' || m.categoria === 'perecedero') && (
            <IconButton
              title="Ver lotes"
              onClick={() => navigate(`/inventario/lotes?material=${m.id}`)}
              style={{ color: '#d97706' }}
            >
              <AppIcon name="link" size={14} />
            </IconButton>
          )}
          <IconButton variant="edit"   title="Editar"   onClick={() => openEdit(m)}><AppIcon name="edit"  size={15} /></IconButton>
          {isAdmin && <IconButton variant="delete" title="Eliminar" onClick={() => setDeleteTarget(m)}><AppIcon name="trash" size={15} /></IconButton>}
        </div>
      ),
    },
  ]

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div>
      <PageHeader title="Materiales" description="Catálogo de materiales del almacén SENA" />

      {/* Tarjetas de filtro */}
      <div style={{ display: 'flex', gap: 14, marginBottom: 24, flexWrap: 'wrap' }}>
        {CARDS.map(card => {
          const isActive = activeCateg === card.key
          const count    = card.key === null ? materiales.length : countCat(card.key)
          return (
            <button
              key={String(card.key)}
              onClick={() => setActiveCateg(isActive ? null : card.key)}
              style={{
                flex: '1 1 120px', minWidth: 110, display: 'flex', flexDirection: 'column',
                alignItems: 'flex-start', gap: 10, padding: '14px 16px', borderRadius: 12,
                cursor: 'pointer',
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
        searchable
        searchPlaceholder="Buscar por nombre, marca, tipo…"
        pageSize={10}
        selectable={isAdmin}
        onBulkDelete={isAdmin ? handleBulkDelete : undefined}
        emptyTitle="Sin materiales"
        emptyDescription={activeCateg ? `No hay materiales en la categoría ${cfg(activeCateg).label}.` : 'Agrega el primer material al catálogo.'}
        emptyAction={<AppButton size="compact" onClick={openCreate}><AppIcon name="plus" /> Nuevo material</AppButton>}
        actions={
          <>
            <AppButton variant="ghost" size="compact" onClick={loadData} disabled={loading}>
              <AppIcon name="refresh" /> Actualizar
            </AppButton>
            <AppButton size="compact" onClick={openCreate}>
              <AppIcon name="plus" /> Nuevo material
            </AppButton>
          </>
        }
      />

      {/* Modal crear / editar */}
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

          {/* Selector de categoría */}
          <div>
            <p style={{ fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.6px' }}>
              Categoría *
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
              {CATEGORIA_OPTIONS.map(({ value, label }) => {
                const c   = CATEGORIAS[value]
                const sel = form.categoria === value
                return (
                  <button key={value} type="button" onClick={() => resetCondicionales(value)} style={{
                    padding: '10px 8px', borderRadius: 10, cursor: 'pointer', textAlign: 'center',
                    border:     `2px solid ${sel ? c.color : c.border}`,
                    background: sel ? c.color : c.bg,
                    color:      sel ? '#fff' : c.color,
                    fontWeight: 600, fontSize: 12.5, fontFamily: 'inherit', transition: 'all 0.15s',
                  }}>
                    {label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Nombre + Tipo */}
          <div style={{ display: 'flex', gap: 14 }}>
            <FormField label="Nombre" required>
              <AppInput size="sm" value={form.nombre} placeholder="Ej. Computador portátil, Carne de res"
                onChange={e => set('nombre', e.target.value)} />
            </FormField>
            <FormField label="Tipo" required>
              <AppInput size="sm" value={form.tipo} placeholder="Ej. Laptop, Herramienta, Insumo"
                onChange={e => set('tipo', e.target.value)} />
            </FormField>
          </div>

          {/* Marca — visible para todos, requerida solo para no consumible */}
          <div style={{ display: 'flex', gap: 14 }}>
            <FormField label="Marca" required={esNoConsumible(form.categoria)}>
              <AppInput size="sm" value={form.marca}
                placeholder={esNoConsumible(form.categoria) ? 'Ej. HP, Lenovo, Bosch' : 'Ej. FrigoCarnes (opcional)'}
                onChange={e => set('marca', e.target.value)} />
            </FormField>

            {/* Modelo — solo para no consumible */}
            {esNoConsumible(form.categoria) && (
              <FormField label="Modelo" required>
                <AppInput size="sm" value={form.modelo} placeholder="Ej. ProBook 440 G9"
                  onChange={e => set('modelo', e.target.value)} />
              </FormField>
            )}

            {/* Unidad de medida — solo para consumible y perecedero */}
            {esConsumibleOPerecedero(form.categoria) && (
              <FormField label="Unidad de medida" required>
                <AppSelect size="sm" value={form.unidad_medida} onChange={e => set('unidad_medida', e.target.value)}>
                  <option value="">— Seleccionar —</option>
                  {UNIDADES_MEDIDA.map(u => (
                    <option key={u.value} value={u.value}>{u.label}</option>
                  ))}
                </AppSelect>
              </FormField>
            )}
          </div>

          {/* Descripción + Código UNSPSC */}
          <div style={{ display: 'flex', gap: 14 }}>
            <FormField label="Descripción" required>
              <AppInput size="sm" value={form.descripcion} placeholder="Descripción del material"
                onChange={e => set('descripcion', e.target.value)} />
            </FormField>
            <FormField label="Código UNSPSC" required>
              <AppInput size="sm" value={form.codigo_unspsc} placeholder="Ej. 43211503"
                onChange={e => set('codigo_unspsc', e.target.value)} />
            </FormField>
          </div>

          {formError && <AlertBanner variant="error">{formError}</AlertBanner>}
        </div>
      </AppModal>

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
