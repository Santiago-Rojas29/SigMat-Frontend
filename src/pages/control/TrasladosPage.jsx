import { useState, useEffect, useCallback, useMemo } from 'react'
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
import { AppModal }      from '../../components/organisms/AppModal'
import { DataTable }     from '../../components/organisms/DataTable'
import { usePermissions } from '../../context/PermissionsContext'
import { AppIcon }        from '../../components/atoms/AppIcon'

const hoy = () => new Date().toISOString().split('T')[0]

const EMPTY_FORM = {
  id_responsable: '',
  id_ubicacion_origen: '',
  id_ubicacion_destino: '',
  fecha_traslado: hoy(),
  motivo: '',
  observaciones: '',
}

function fmt(val) {
  if (!val) return '—'
  return new Date(val).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })
}

// ── Page ──────────────────────────────────────────────────────────────────────

export function TrasladosPage() {
  const { hasPermission } = usePermissions()
  const canEdit = hasPermission('control') || hasPermission('administracion')

  const [traslados,   setTraslados]   = useState([])
  const [unidades,    setUnidades]    = useState([])
  const [lotes,       setLotes]       = useState([])
  const [materiales,  setMateriales]  = useState([])
  const [ubicaciones, setUbicaciones] = useState([])
  const [usuarios,    setUsuarios]    = useState([])
  const [loading,     setLoading]     = useState(true)
  const [error,       setError]       = useState(null)

  const [modal,     setModal]     = useState(false)
  const [form,      setForm]      = useState(EMPTY_FORM)
  const [items,     setItems]     = useState([])   // { tipo, id, cantidad?, _label }
  const [saving,    setSaving]    = useState(false)
  const { showToast, toastPortal } = useToast()

  // Para añadir ítems al traslado
  const [addTipo,     setAddTipo]     = useState('unidad')
  const [addId,       setAddId]       = useState('')
  const [addCantidad, setAddCantidad] = useState('')

  // ── Carga ────────────────────────────────────────────────────────────────────

  const loadData = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const [trRes, uRes, lRes, mRes, ubRes, usRes] = await Promise.all([
        api.get('/traslado'),
        api.get('/unidad'),
        api.get('/lote'),
        api.get('/material'),
        api.get('/ubicacion'),
        api.get('/usuario'),
      ])
      setTraslados(trRes.data)
      setUnidades(uRes.data)
      setLotes(lRes.data)
      setMateriales(mRes.data)
      setUbicaciones(ubRes.data)
      setUsuarios(usRes.data)
    } catch { setError('No se pudo cargar la información.') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  // ── Helpers ──────────────────────────────────────────────────────────────────

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const nombreUbicacion = (id) => {
    const u = ubicaciones.find(u => String(u.id_ubicacion) === String(id))
    return u?.nombre ?? '—'
  }
  const nombreUsuario = (id) => {
    const u = usuarios.find(u => u.id === id)
    return u ? `${u.nombres} ${u.apellidos}` : '—'
  }

  // Unidades disponibles en origen
  const unidadesOrigen = useMemo(() =>
    unidades.filter(u => String(u.id_ubicacion) === String(form.id_ubicacion_origen)),
    [unidades, form.id_ubicacion_origen]
  )
  // Lotes disponibles en origen
  const lotesOrigen = useMemo(() =>
    lotes.filter(l => String(l.id_ubicacion) === String(form.id_ubicacion_origen) && l.cantidad_disponible > 0),
    [lotes, form.id_ubicacion_origen]
  )

  const labelItem = (tipo, id) => {
    if (tipo === 'unidad') {
      const u = unidades.find(u => u.id_unidad === id)
      const m = materiales.find(m => m.id === u?.id_material)
      return `${m?.nombre ?? '—'} · ${u?.codigo_unidad ?? ''}`
    }
    const l = lotes.find(l => l.id_lote === id)
    const m = materiales.find(m => m.id === l?.id_material)
    return `${m?.nombre ?? '—'} · ${l?.codigo_lote ?? ''} (disp: ${l?.cantidad_disponible ?? 0})`
  }

  // ── Añadir ítem ───────────────────────────────────────────────────────────────

  const handleAddItem = () => {
    if (!addId) return
    if (addTipo === 'lote' && (!addCantidad || Number(addCantidad) <= 0)) return
    if (items.find(i => i.id === addId)) return
    setItems(prev => [...prev, {
      tipo: addTipo,
      id: addId,
      cantidad: addTipo === 'lote' ? Number(addCantidad) : undefined,
      _label: labelItem(addTipo, addId),
    }])
    setAddId('')
    setAddCantidad('')
  }

  const handleRemoveItem = (id) => setItems(prev => prev.filter(i => i.id !== id))

  // ── Guardar traslado ──────────────────────────────────────────────────────────

  const handleSave = async () => {
    if (!form.id_responsable || !form.id_ubicacion_origen || !form.id_ubicacion_destino) {
      showToast('error', 'Completa todos los campos requeridos.')
      return
    }
    if (form.id_ubicacion_origen === form.id_ubicacion_destino) {
      showToast('error', 'El origen y destino deben ser diferentes.')
      return
    }

    // Auto-incluir ítem pendiente si el usuario no hizo clic en "+"
    let efectivos = [...items]
    if (addId && !efectivos.find(i => i.id === addId)) {
      if (addTipo === 'lote' && (!addCantidad || Number(addCantidad) <= 0)) {
        showToast('error', 'Ingresa una cantidad válida para el lote seleccionado.')
        return
      }
      efectivos = [...efectivos, {
        tipo: addTipo,
        id: addId,
        cantidad: addTipo === 'lote' ? Number(addCantidad) : undefined,
        _label: labelItem(addTipo, addId),
      }]
    }

    if (efectivos.length === 0) {
      showToast('error', 'Añade al menos un ítem para trasladar.')
      return
    }
    setSaving(true)
    try {
      await api.post('/traslado/realizar', {
        ...form,
        items: efectivos.map(({ tipo, id, cantidad }) =>
          tipo === 'lote' ? { tipo, id, cantidad } : { tipo, id }
        ),
      })
      showToast('success', 'Traslado realizado correctamente.')
      setModal(false)
      setForm(EMPTY_FORM)
      setItems([])
      loadData()
    } catch (e) {
      const msg = e.response?.data?.message
      showToast('error', Array.isArray(msg) ? msg.join(', ') : (msg ?? 'Error al realizar el traslado.'))
    } finally { setSaving(false) }
  }

  // ── Columnas ──────────────────────────────────────────────────────────────────

  const columns = [
    { key: 'id', header: 'ID', copyable: true, truncateAt: 8, searchable: false, width: 110 },
    {
      key: 'fecha_traslado',
      header: 'Fecha',
      width: 120,
      render: (t) => <span style={{ color: '#374151' }}>{fmt(t.fecha_traslado)}</span>,
    },
    {
      key: 'origen',
      header: (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{
            fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px',
            background: '#fff7ed', color: '#c2410c', border: '1px solid #fed7aa',
            borderRadius: 5, padding: '2px 7px',
          }}>Origen</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="5" y1="12" x2="19" y2="12"/><polyline points="13 6 19 12 13 18"/>
          </svg>
          <span style={{
            fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px',
            background: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0',
            borderRadius: 5, padding: '2px 7px',
          }}>Destino</span>
        </div>
      ),
      render: (t) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            background: '#fff7ed', color: '#9a3412', border: '1px solid #fed7aa',
            borderRadius: 20, padding: '3px 10px', fontSize: 12, fontWeight: 600,
            whiteSpace: 'nowrap',
          }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
            </svg>
            {nombreUbicacion(t.id_ubicacion_origen)}
          </span>

          <svg width="20" height="16" viewBox="0 0 28 16" fill="none">
            <line x1="0" y1="8" x2="20" y2="8" stroke="#d1d5db" strokeWidth="1.5" strokeDasharray="3 2"/>
            <polygon points="20,4 28,8 20,12" fill="#d1d5db"/>
          </svg>

          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            background: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0',
            borderRadius: 20, padding: '3px 10px', fontSize: 12, fontWeight: 600,
            whiteSpace: 'nowrap',
          }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
            </svg>
            {nombreUbicacion(t.id_ubicacion_destino)}
          </span>
        </div>
      ),
    },
    {
      key: 'responsable',
      header: 'Responsable',
      render: (t) => <span style={{ color: '#374151' }}>{nombreUsuario(t.id_responsable)}</span>,
    },
    {
      key: 'motivo',
      header: 'Motivo',
      render: (t) => <span style={{ color: '#6b7280', fontSize: 13 }}>{t.motivo}</span>,
    },
  ]

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <>
      {toastPortal}
      <div>
      <PageHeader title="Traslados" description="Movimiento de ítems entre ubicaciones del almacén" />

      <DataTable
        columns={columns}
        data={traslados}
        loading={loading}
        error={error}
        onRetry={loadData}
        rowKey="id"
        searchable
        searchPlaceholder="Buscar por motivo, responsable…"
        pageSize={10}
        emptyTitle="Sin traslados"
        emptyDescription="Registra el primer traslado del almacén."
        emptyAction={canEdit && (
          <AppButton size="compact" onClick={() => setModal(true)}>
            <AppIcon name="plus" /> Nuevo traslado
          </AppButton>
        )}
        actions={
          <>
            <AppButton variant="ghost" size="compact" onClick={loadData} disabled={loading}>
              <AppIcon name="refresh" /> Actualizar
            </AppButton>
            {canEdit && (
              <AppButton size="compact" onClick={() => setModal(true)}>
                <AppIcon name="plus" /> Nuevo traslado
              </AppButton>
            )}
          </>
        }
      />

      {/* Modal nuevo traslado */}
      <AppModal
        isOpen={modal}
        onClose={() => { setModal(false); setItems([]) }}
        title="Nuevo traslado"
        maxWidth={680}
        footer={
          <>
            <AppButton variant="ghost" size="compact" onClick={() => setModal(false)} disabled={saving}>
              Cancelar
            </AppButton>
            <AppButton size="compact" onClick={handleSave} loading={saving}>
              Realizar traslado
            </AppButton>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Responsable + fecha */}
          <div style={{ display: 'flex', gap: 14 }}>
            <FormField label="Responsable" required>
              <SearchableSelect
                size="sm"
                value={form.id_responsable}
                placeholder="— Seleccionar —"
                options={usuarios.map(u => ({ value: u.id, label: `${u.nombres} ${u.apellidos}` }))}
                onChange={v => set('id_responsable', v)}
              />
            </FormField>
            <FormField label="Fecha" required>
              <AppDateInput size="sm" value={form.fecha_traslado} onChange={e => set('fecha_traslado', e.target.value)} />
            </FormField>
          </div>

          {/* Origen → Destino */}
          <div style={{ display: 'flex', gap: 14 }}>
            <FormField label="Ubicación origen" required>
              <SearchableSelect
                size="sm"
                value={form.id_ubicacion_origen}
                placeholder="— Seleccionar —"
                options={ubicaciones.map(u => ({ value: String(u.id_ubicacion), label: u.nombre }))}
                onChange={v => { set('id_ubicacion_origen', v); setItems([]) }}
              />
            </FormField>
            <FormField label="Ubicación destino" required>
              <SearchableSelect
                size="sm"
                value={form.id_ubicacion_destino}
                placeholder="— Seleccionar —"
                options={ubicaciones
                  .filter(u => String(u.id_ubicacion) !== String(form.id_ubicacion_origen))
                  .map(u => ({ value: String(u.id_ubicacion), label: u.nombre }))}
                onChange={v => set('id_ubicacion_destino', v)}
              />
            </FormField>
          </div>

          {/* Motivo + observaciones */}
          <div style={{ display: 'flex', gap: 14 }}>
            <FormField label="Motivo" required>
              <AppInput size="sm" value={form.motivo} placeholder="Ej. Reorganización del almacén"
                onChange={e => set('motivo', e.target.value)} />
            </FormField>
            <FormField label="Observaciones" required>
              <AppInput size="sm" value={form.observaciones} placeholder="Observaciones adicionales"
                onChange={e => set('observaciones', e.target.value)} />
            </FormField>
          </div>

          {/* Ítems a trasladar */}
          <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: 14 }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 10 }}>
              Ítems a trasladar
            </p>

            {/* Añadir ítem */}
            {form.id_ubicacion_origen && (
              <div style={{ display: 'flex', gap: 8, marginBottom: 10, alignItems: 'flex-end' }}>
                <div style={{ minWidth: 90 }}>
                  <FormField label="Tipo">
                    <AppSelect size="sm" value={addTipo} onChange={e => { setAddTipo(e.target.value); setAddId('') }}>
                      <option value="unidad">Unidad</option>
                      <option value="lote">Lote</option>
                    </AppSelect>
                  </FormField>
                </div>
                <div style={{ flex: 1 }}>
                  <FormField label={addTipo === 'unidad' ? 'Seleccionar unidad' : 'Seleccionar lote'}>
                    <SearchableSelect
                      size="sm"
                      value={addId}
                      placeholder="— Seleccionar —"
                      options={addTipo === 'unidad'
                        ? unidadesOrigen.map(u => {
                            const m = materiales.find(m => m.id === u.id_material)
                            return { value: u.id_unidad, label: `${m?.nombre ?? '—'} · ${u.codigo_unidad}` }
                          })
                        : lotesOrigen.map(l => {
                            const m = materiales.find(m => m.id === l.id_material)
                            return { value: l.id_lote, label: `${m?.nombre ?? '—'} · ${l.codigo_lote} (disp: ${l.cantidad_disponible})` }
                          })
                      }
                      onChange={v => setAddId(v)}
                    />
                  </FormField>
                </div>
                {addTipo === 'lote' && (
                  <div style={{ width: 90 }}>
                    <FormField label="Cantidad">
                      <AppInput size="sm" type="number" min="1" value={addCantidad}
                        placeholder="0" onChange={e => setAddCantidad(e.target.value)} />
                    </FormField>
                  </div>
                )}
                <AppButton size="compact" onClick={handleAddItem} disabled={!addId}>
                  <AppIcon name="plus" />
                </AppButton>
              </div>
            )}

            {/* Lista de ítems añadidos */}
            {items.length === 0 ? (
              <p style={{ fontSize: 12.5, color: '#9ca3af', textAlign: 'center', padding: '12px 0' }}>
                {form.id_ubicacion_origen ? 'Sin ítems añadidos aún.' : 'Selecciona el origen para ver los ítems disponibles.'}
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {items.map(item => (
                  <div key={item.id} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '8px 12px', borderRadius: 8,
                    background: item.tipo === 'unidad' ? '#eff6ff' : '#f0fdf4',
                    border: `1px solid ${item.tipo === 'unidad' ? '#bfdbfe' : '#bbf7d0'}`,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Badge variant={item.tipo === 'unidad' ? 'default' : 'success'} style={{ fontSize: 11 }}>
                        {item.tipo === 'unidad' ? 'Unidad' : 'Lote'}
                      </Badge>
                      <span style={{ fontSize: 13, color: '#374151' }}>{item._label}</span>
                      {item.cantidad && (
                        <span style={{ fontSize: 12, color: '#6b7280' }}>× {item.cantidad}</span>
                      )}
                    </div>
                    <IconButton title="Quitar" onClick={() => handleRemoveItem(item.id)}>
                      <AppIcon name="trash" size={15} />
                    </IconButton>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </AppModal>
    </div>
    </>
  )
}
