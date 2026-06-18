import { useState, useEffect, useCallback, useMemo } from 'react'
import api from '../../services/api'
import { AppButton }   from '../../components/atoms/AppButton'
import { AppInput }    from '../../components/atoms/AppInput'
import { AppDateInput } from '../../components/atoms/AppDateInput'
import { AppSelect }   from '../../components/atoms/AppSelect'
import { Badge }       from '../../components/atoms/Badge'
import { StatCard }    from '../../components/atoms/StatCard'
import { PageHeader }  from '../../components/molecules/PageHeader'
import { FormField }   from '../../components/molecules/FormField'
import { DataTable }   from '../../components/organisms/DataTable'
import { AppIcon }     from '../../components/atoms/AppIcon'

// ── Constants ─────────────────────────────────────────────────────────────────

const TIPO_CONFIG = {
  entrada:  { label: 'Entrada',  variant: 'success',  color: '#16a34a' },
  salida:   { label: 'Salida',   variant: 'danger',   color: '#dc2626' },
  traslado: { label: 'Traslado', variant: 'default',  color: '#2563eb' },
  ajuste:   { label: 'Baja',     variant: 'warning',  color: '#d97706' },
}

const TIPO_OPTIONS = [
  { value: '', label: 'Todos los tipos' },
  { value: 'entrada',  label: 'Entrada' },
  { value: 'salida',   label: 'Salida' },
  { value: 'traslado', label: 'Traslado' },
  { value: 'ajuste',   label: 'Baja / Ajuste' },
]

function fmt(val) {
  if (!val) return '—'
  return new Date(val).toLocaleString('es-CO', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

// ── Page ──────────────────────────────────────────────────────────────────────

export function KardexPage() {
  const [kardex,     setKardex]     = useState([])
  const [unidades,   setUnidades]   = useState([])
  const [lotes,      setLotes]      = useState([])
  const [materiales, setMateriales] = useState([])
  const [loading,    setLoading]    = useState(true)
  const [error,      setError]      = useState(null)

  // Filtros
  const [filtroTipo,   setFiltroTipo]   = useState('')
  const [filtroDesde,  setFiltroDesde]  = useState('')
  const [filtroHasta,  setFiltroHasta]  = useState('')

  // ── Carga ────────────────────────────────────────────────────────────────────

  const loadData = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const [kRes, uRes, lRes, mRes] = await Promise.all([
        api.get('/kardex'),
        api.get('/unidad'),
        api.get('/lote'),
        api.get('/material'),
      ])
      setKardex(kRes.data)
      setUnidades(uRes.data)
      setLotes(lRes.data)
      setMateriales(mRes.data)
    } catch { setError('No se pudo cargar el kardex.') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  // ── Enriquecer registros ──────────────────────────────────────────────────────

  const kardexRico = useMemo(() => kardex.map(k => {
    let materialNombre = '—'
    let itemCodigo = '—'
    let itemTipo = null

    if (k.id_unidad) {
      const u = unidades.find(u => u.id_unidad === k.id_unidad)
      const m = materiales.find(m => m.id === u?.id_material)
      materialNombre = m?.nombre ?? '—'
      itemCodigo = u?.codigo_unidad ?? '—'
      itemTipo = 'unidad'
    } else if (k.id_lote) {
      const l = lotes.find(l => l.id_lote === k.id_lote)
      const m = materiales.find(m => m.id === l?.id_material)
      materialNombre = m?.nombre ?? '—'
      itemCodigo = l?.codigo_lote ?? '—'
      itemTipo = 'lote'
    }

    const referencia = k.id_traslado ? `Traslado`
      : k.id_entrega    ? `Entrega`
      : k.id_devolucion ? `Devolución`
      : k.id_incidencia ? `Incidencia`
      : 'Ingreso'

    return { ...k, materialNombre, itemCodigo, itemTipo, referencia }
  }), [kardex, unidades, lotes, materiales])

  // ── Filtrado ──────────────────────────────────────────────────────────────────

  const datosFiltrados = useMemo(() => {
    return kardexRico.filter(k => {
      if (filtroTipo && k.tipo_movimiento !== filtroTipo) return false
      if (filtroDesde) {
        const desde = new Date(filtroDesde)
        if (new Date(k.fecha_movimiento) < desde) return false
      }
      if (filtroHasta) {
        const hasta = new Date(filtroHasta)
        hasta.setHours(23, 59, 59)
        if (new Date(k.fecha_movimiento) > hasta) return false
      }
      return true
    })
  }, [kardexRico, filtroTipo, filtroDesde, filtroHasta])

  // ── Contadores ────────────────────────────────────────────────────────────────

  const counts = useMemo(() => ({
    total:    kardexRico.length,
    entradas: kardexRico.filter(k => k.tipo_movimiento === 'entrada').length,
    salidas:  kardexRico.filter(k => k.tipo_movimiento === 'salida').length,
    traslados:kardexRico.filter(k => k.tipo_movimiento === 'traslado').length,
    ajustes:  kardexRico.filter(k => k.tipo_movimiento === 'ajuste').length,
  }), [kardexRico])

  // ── Columnas ──────────────────────────────────────────────────────────────────

  const columns = [
    {
      key: 'fecha_movimiento',
      header: 'Fecha',
      width: 150,
      render: (k) => <span style={{ fontSize: 12.5, color: '#374151' }}>{fmt(k.fecha_movimiento)}</span>,
    },
    {
      key: 'tipo_movimiento',
      header: 'Tipo',
      width: 110,
      render: (k) => {
        const cfg = TIPO_CONFIG[k.tipo_movimiento] ?? { label: k.tipo_movimiento, variant: 'default' }
        return <Badge variant={cfg.variant} style={{ fontSize: 11.5 }}>{cfg.label}</Badge>
      },
    },
    {
      key: 'material',
      header: 'Material',
      render: (k) => (
        <div>
          <div style={{ fontWeight: 600, color: '#111827', fontSize: 13 }}>{k.materialNombre}</div>
          <div style={{ fontSize: 11.5, color: '#9ca3af' }}>
            {k.itemTipo === 'unidad' ? 'Unidad' : k.itemTipo === 'lote' ? 'Lote' : ''} · {k.itemCodigo}
          </div>
        </div>
      ),
    },
    {
      key: 'cantidad',
      header: 'Cantidad',
      width: 90,
      render: (k) => {
        const cfg = TIPO_CONFIG[k.tipo_movimiento]
        const color = cfg?.color ?? '#374151'
        const prefix = k.tipo_movimiento === 'salida' || k.tipo_movimiento === 'ajuste' ? '−' : '+'
        return (
          <span style={{ fontWeight: 700, color, fontSize: 14 }}>
            {prefix}{k.cantidad}
          </span>
        )
      },
    },
    {
      key: 'saldo',
      header: 'Saldo',
      width: 80,
      render: (k) => (
        <span style={{ fontWeight: 600, color: '#374151', fontSize: 13.5 }}>
          {k.saldo}
        </span>
      ),
    },
    {
      key: 'referencia',
      header: 'Referencia',
      width: 110,
      render: (k) => <span style={{ fontSize: 12.5, color: '#6b7280' }}>{k.referencia}</span>,
    },
  ]

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div>
      <PageHeader title="Kardex" description="Historial automático de movimientos del inventario" />

      {/* Tarjetas resumen */}
      <div style={{ display: 'flex', gap: 14, marginBottom: 24, flexWrap: 'wrap' }}>
        <StatCard label="Todos"      count={counts.total}     color="#111827" bg="#fff"     border="#e5e7eb" active={filtroTipo === ''}         onClick={() => setFiltroTipo('')}
          icon={<><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></>} />
        <StatCard label="Entradas"   count={counts.entradas}  color="#16a34a" bg="#f0fdf4" border="#bbf7d0" active={filtroTipo === 'entrada'}   onClick={() => setFiltroTipo(filtroTipo === 'entrada'   ? '' : 'entrada')}
          icon={<><path d="M12 2v10"/><path d="m7 9 5 5 5-5"/><rect x="2" y="17" width="20" height="5" rx="1"/></>} />
        <StatCard label="Salidas"    count={counts.salidas}   color="#dc2626" bg="#fef2f2" border="#fecaca" active={filtroTipo === 'salida'}    onClick={() => setFiltroTipo(filtroTipo === 'salida'    ? '' : 'salida')}
          icon={<><path d="M12 22V12"/><path d="m7 15 5-5 5 5"/><rect x="2" y="2" width="20" height="5" rx="1"/></>} />
        <StatCard label="Traslados"  count={counts.traslados} color="#2563eb" bg="#eff6ff" border="#bfdbfe" active={filtroTipo === 'traslado'}  onClick={() => setFiltroTipo(filtroTipo === 'traslado'  ? '' : 'traslado')}
          icon={<><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 014-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 01-4 4H3"/></>} />
        <StatCard label="Bajas"      count={counts.ajustes}   color="#d97706" bg="#fffbeb" border="#fde68a" active={filtroTipo === 'ajuste'}    onClick={() => setFiltroTipo(filtroTipo === 'ajuste'    ? '' : 'ajuste')}
          icon={<><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></>} />
      </div>

      {/* Filtros */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div style={{ minWidth: 160 }}>
          <FormField label="Tipo de movimiento">
            <AppSelect size="sm" value={filtroTipo} onChange={e => setFiltroTipo(e.target.value)}>
              {TIPO_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </AppSelect>
          </FormField>
        </div>
        <div style={{ minWidth: 140 }}>
          <FormField label="Desde">
            <AppDateInput size="sm" value={filtroDesde} onChange={e => setFiltroDesde(e.target.value)} />
          </FormField>
        </div>
        <div style={{ minWidth: 140 }}>
          <FormField label="Hasta">
            <AppDateInput size="sm" value={filtroHasta} onChange={e => setFiltroHasta(e.target.value)} />
          </FormField>
        </div>
        {(filtroTipo || filtroDesde || filtroHasta) && (
          <AppButton variant="ghost" size="compact"
            onClick={() => { setFiltroTipo(''); setFiltroDesde(''); setFiltroHasta('') }}>
            × Limpiar filtros
          </AppButton>
        )}
        <AppButton variant="ghost" size="compact" onClick={loadData} disabled={loading} style={{ marginLeft: 'auto' }}>
          <AppIcon name="refresh" /> Actualizar
        </AppButton>
      </div>

      <DataTable
        columns={columns}
        data={datosFiltrados}
        loading={loading}
        error={error}
        onRetry={loadData}
        rowKey="id"
        searchable
        searchPlaceholder="Buscar por material, código…"
        pageSize={10}
        emptyTitle="Sin movimientos"
        emptyDescription="Los movimientos se registran automáticamente al crear lotes, traslados o incidencias."
      />
    </div>
  )
}
