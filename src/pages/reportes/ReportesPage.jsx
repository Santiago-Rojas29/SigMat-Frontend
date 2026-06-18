import { useState } from 'react'
import { pdf } from '@react-pdf/renderer'
import { PageHeader }    from '../../components/molecules/PageHeader'
import { AppModal }      from '../../components/organisms/AppModal'
import { AppButton }     from '../../components/atoms/AppButton'
import { AppInput }      from '../../components/atoms/AppInput'
import { AppSelect }     from '../../components/atoms/AppSelect'
import { FormField }     from '../../components/molecules/FormField'
import { useToast }      from '../../hooks/useToast'
import { AppIcon }       from '../../components/atoms/AppIcon'
import api               from '../../services/api'

import { ReporteSolicitudesPdf } from './pdf/ReporteSolicitudesPdf'
import { ReporteStockPdf }       from './pdf/ReporteStockPdf'
import { ReporteLotesPdf }       from './pdf/ReporteLotesPdf'
import { ReporteMorososPdf }     from './pdf/ReporteMorososPdf'
import { ReporteKardexPdf }      from './pdf/ReporteKardexPdf'
import { ReporteIncidenciasPdf } from './pdf/ReporteIncidenciasPdf'
import { ReporteResumenPdf }     from './pdf/ReporteResumenPdf'

// ── Config de cada tipo de reporte ───────────────────────────────────────────
const REPORTES = [
  {
    id: 'resumen',
    titulo: 'Resumen General',
    descripcion: 'KPIs del período, solicitudes por estado, materiales más solicitados, incidencias y stock crítico.',
    icon: 'dashboard',
    color: '#39A900', bg: '#f0fdf4', border: '#bbf7d0',
    filtros: [
      { id: 'desde', label: 'Desde', type: 'date' },
      { id: 'hasta', label: 'Hasta', type: 'date' },
    ],
    endpoint: 'resumen',
    buildParams: f => ({ desde: f.desde, hasta: f.hasta }),
    buildFiltros: f => [
      { label: 'Desde', value: f.desde },
      { label: 'Hasta', value: f.hasta },
    ],
    PdfComp: ReporteResumenPdf,
    previewCols: null,
  },
  {
    id: 'solicitudes',
    titulo: 'Solicitudes',
    descripcion: 'Historial de solicitudes filtrable por fecha, estado y tipo de flujo (instructor/aprendiz).',
    icon: 'file',
    color: '#3b82f6', bg: '#eff6ff', border: '#bfdbfe',
    filtros: [
      { id: 'desde',      label: 'Desde',     type: 'date'   },
      { id: 'hasta',      label: 'Hasta',     type: 'date'   },
      { id: 'estado',     label: 'Estado',    type: 'select',
        options: [
          { value: '', label: 'Todos' },
          { value: 'pendiente_instructor', label: 'Pend. Instructor' },
          { value: 'pendiente_admin',      label: 'Pend. Admin' },
          { value: 'pendiente_bodega',     label: 'Pend. Bodega' },
          { value: 'aprobado',  label: 'Aprobado' },
          { value: 'entregado', label: 'Entregado' },
          { value: 'rechazado', label: 'Rechazado' },
          { value: 'cancelado', label: 'Cancelado' },
        ],
      },
      { id: 'tipo_flujo', label: 'Flujo',     type: 'select',
        options: [
          { value: '', label: 'Todos' },
          { value: 'instructor', label: 'Instructor' },
          { value: 'aprendiz',   label: 'Aprendiz'   },
        ],
      },
    ],
    endpoint: 'solicitudes',
    buildParams: f => ({ desde: f.desde, hasta: f.hasta, estado: f.estado, tipo_flujo: f.tipo_flujo }),
    buildFiltros: f => [
      { label: 'Desde',  value: f.desde },
      { label: 'Hasta',  value: f.hasta },
      { label: 'Estado', value: f.estado },
      { label: 'Flujo',  value: f.tipo_flujo },
    ],
    PdfComp: ReporteSolicitudesPdf,
    previewCols: ['fecha_solicitud','solicitante','tipo_flujo','estado','fecha_entrega'],
  },
  {
    id: 'stock-critico',
    titulo: 'Stock Crítico',
    descripcion: 'Lotes cuya cantidad disponible está por debajo del umbral configurado.',
    icon: 'warn',
    color: '#ef4444', bg: '#fef2f2', border: '#fecaca',
    filtros: [
      { id: 'umbral', label: 'Umbral de stock (%)', type: 'number', placeholder: '25' },
    ],
    endpoint: 'stock-critico',
    buildParams: f => ({ umbral: f.umbral || 25 }),
    buildFiltros: f => [{ label: 'Umbral', value: `≤ ${f.umbral || 25}%` }],
    PdfComp: ReporteStockPdf,
    previewCols: ['material','codigo_lote','cantidad_disponible','cantidad_inicial','porcentaje','ubicacion'],
  },
  {
    id: 'lotes-vencimiento',
    titulo: 'Lotes por Vencer',
    descripcion: 'Lotes perecederos vencidos o próximos a vencer en el rango de días configurado.',
    icon: 'clock',
    color: '#d97706', bg: '#fffbeb', border: '#fde68a',
    filtros: [
      { id: 'dias', label: 'Próximos (días)', type: 'number', placeholder: '30' },
    ],
    endpoint: 'lotes-vencimiento',
    buildParams: f => ({ dias: f.dias || 30 }),
    buildFiltros: f => [{ label: 'Horizonte', value: `${f.dias || 30} días` }],
    PdfComp: ReporteLotesPdf,
    previewCols: ['material','codigo_lote','fecha_vencimiento','dias_para_vencer','cantidad_disponible','estado'],
  },
  {
    id: 'morosos',
    titulo: 'Usuarios con Mora',
    descripcion: 'Usuarios con préstamos activos que han superado su fecha límite de devolución.',
    icon: 'users',
    color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe',
    filtros: [],
    endpoint: 'morosos',
    buildParams: () => ({}),
    buildFiltros: () => [],
    PdfComp: ReporteMorososPdf,
    previewCols: ['usuario','correo','prestamos_vencidos','dias_vencido'],
  },
  {
    id: 'kardex',
    titulo: 'Movimientos (Kardex)',
    descripcion: 'Historial completo de entradas, salidas, ajustes y traslados con trazabilidad por material.',
    icon: 'chart',
    color: '#0891b2', bg: '#ecfeff', border: '#a5f3fc',
    filtros: [
      { id: 'desde', label: 'Desde', type: 'date' },
      { id: 'hasta', label: 'Hasta', type: 'date' },
      { id: 'tipo_movimiento', label: 'Tipo', type: 'select',
        options: [
          { value: '', label: 'Todos' },
          { value: 'entrada',  label: 'Entrada'  },
          { value: 'salida',   label: 'Salida'   },
          { value: 'ajuste',   label: 'Ajuste'   },
          { value: 'traslado', label: 'Traslado' },
        ],
      },
    ],
    endpoint: 'kardex',
    buildParams: f => ({ desde: f.desde, hasta: f.hasta, tipo_movimiento: f.tipo_movimiento }),
    buildFiltros: f => [
      { label: 'Desde', value: f.desde },
      { label: 'Hasta', value: f.hasta },
      { label: 'Tipo',  value: f.tipo_movimiento },
    ],
    PdfComp: ReporteKardexPdf,
    previewCols: ['fecha_movimiento','tipo_movimiento','material','codigo','cantidad','saldo'],
  },
  {
    id: 'incidencias',
    titulo: 'Incidencias',
    descripcion: 'Registro de daños, pérdidas y mantenimientos con material afectado y responsable.',
    icon: 'alert',
    color: '#0f766e', bg: '#f0fdfa', border: '#99f6e4',
    filtros: [
      { id: 'desde', label: 'Desde', type: 'date' },
      { id: 'hasta', label: 'Hasta', type: 'date' },
      { id: 'tipo', label: 'Tipo', type: 'select',
        options: [
          { value: '',              label: 'Todos'         },
          { value: 'daño',          label: 'Daño'          },
          { value: 'pérdida',       label: 'Pérdida'       },
          { value: 'mantenimiento', label: 'Mantenimiento' },
        ],
      },
      { id: 'estado', label: 'Estado', type: 'select',
        options: [
          { value: '',           label: 'Todos'      },
          { value: 'abierta',    label: 'Abierta'    },
          { value: 'en_proceso', label: 'En proceso' },
          { value: 'cerrada',    label: 'Cerrada'    },
        ],
      },
    ],
    endpoint: 'incidencias',
    buildParams: f => ({ desde: f.desde, hasta: f.hasta, tipo: f.tipo, estado: f.estado }),
    buildFiltros: f => [
      { label: 'Desde',  value: f.desde  },
      { label: 'Hasta',  value: f.hasta  },
      { label: 'Tipo',   value: f.tipo   },
      { label: 'Estado', value: f.estado },
    ],
    PdfComp: ReporteIncidenciasPdf,
    previewCols: ['fecha_incidencia','tipo','estado','material','responsable'],
  },
]

// ── Helpers UI ────────────────────────────────────────────────────────────────
const COL_LABELS = {
  fecha_solicitud: 'Fecha', solicitante: 'Solicitante', tipo_flujo: 'Flujo',
  estado: 'Estado', fecha_entrega: 'F. Entrega', material: 'Material',
  codigo_lote: 'Código lote', cantidad_disponible: 'Disponible',
  cantidad_inicial: 'Inicial', porcentaje: '% Stock', ubicacion: 'Ubicación',
  fecha_vencimiento: 'F. Vencimiento', dias_para_vencer: 'Días',
  usuario: 'Usuario', correo: 'Correo', prestamos_vencidos: 'Préstamos',
  dias_vencido: 'Días mora', fecha_movimiento: 'Fecha', tipo_movimiento: 'Tipo',
  codigo: 'Código', cantidad: 'Cantidad', saldo: 'Saldo',
  fecha_incidencia: 'Fecha', tipo: 'Tipo', responsable: 'Responsable',
}

// ── Componente principal ──────────────────────────────────────────────────────
export function ReportesPage() {
  const [active, setActive]     = useState(null)   // reporte config activo
  const [filtros, setFiltros]   = useState({})
  const [data, setData]         = useState(null)
  const [loading, setLoading]   = useState(false)
  const [dlLoading, setDlLoad]  = useState(false)
  const { showToast, toastPortal } = useToast()

  const openModal = (rep) => {
    setActive(rep)
    setFiltros({})
    setData(null)
  }
  const closeModal = () => { setActive(null); setData(null) }

  const setFiltro = (id, val) => setFiltros(p => ({ ...p, [id]: val }))

  const handleGenerar = async () => {
    setLoading(true)
    setData(null)
    try {
      const params = active.buildParams(filtros)
      const { data: res } = await api.get(`/reportes/${active.endpoint}`, { params })
      setData(res)
    } catch (e) {
      const msg = e.response?.data?.message
      showToast('error', Array.isArray(msg) ? msg.join(', ') : (msg ?? 'Error al generar el reporte.'))
    } finally {
      setLoading(false)
    }
  }

  const handleDescargar = async () => {
    if (!data || !active) return
    setDlLoad(true)
    try {
      const filtrosDisplay = active.buildFiltros(filtros).filter(f => f.value)
      const { PdfComp } = active
      const doc  = <PdfComp data={data} filtros={filtrosDisplay} />
      const blob = await pdf(doc).toBlob()
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href     = url
      a.download = `reporte_${active.id}_${new Date().toISOString().slice(0, 10)}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      showToast('error', 'Error al generar el PDF. Intente de nuevo.')
    } finally {
      setDlLoad(false)
    }
  }

  // Preview rows (array or from resumen summary)
  const previewRows = data && active?.previewCols
    ? (Array.isArray(data) ? data.slice(0, 8) : [])
    : []

  const totalRows = data && Array.isArray(data) ? data.length : null

  return (
    <>
      {toastPortal}
      <div>
      <PageHeader
        title="Reportes"
        description="Genera y descarga reportes en PDF con diseño institucional SENA"
      />

      {/* Grid de cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
        gap: 18,
      }}>
        {REPORTES.map(rep => (
          <button
            key={rep.id}
            onClick={() => openModal(rep)}
            style={{
              background: rep.bg,
              border: `1.5px solid ${rep.border}`,
              borderRadius: 12,
              padding: '20px 22px',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'box-shadow 0.18s, transform 0.15s',
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
            }}
            onMouseEnter={e => {
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.10)'
              e.currentTarget.style.transform = 'translateY(-2px)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.boxShadow = 'none'
              e.currentTarget.style.transform = 'none'
            }}
          >
            <div style={{
              width: 42, height: 42, borderRadius: 10,
              background: rep.color, display: 'flex',
              alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <AppIcon name={rep.icon} size={20} style={{ color: '#fff' }} />
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#111827', marginBottom: 4 }}>
                {rep.titulo}
              </div>
              <div style={{ fontSize: 13, color: '#6B7280', lineHeight: 1.5 }}>
                {rep.descripcion}
              </div>
            </div>
            <div style={{ marginTop: 4, display: 'flex', alignItems: 'center', gap: 6, color: rep.color, fontSize: 13, fontWeight: 600 }}>
              <AppIcon name="printer" size={14} />
              Generar PDF
            </div>
          </button>
        ))}
      </div>

      {/* Modal de reporte */}
      {active && (
        <AppModal
          isOpen={!!active}
          onClose={closeModal}
          maxWidth={700}
          title={active.titulo}
          footer={
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <AppButton variant="ghost" size="compact" onClick={closeModal}>
                Cerrar
              </AppButton>
              <AppButton size="compact" onClick={handleGenerar} loading={loading}>
                <AppIcon name="refresh" size={14} /> Generar
              </AppButton>
              {data && (
                <AppButton
                  size="compact"
                  onClick={handleDescargar}
                  loading={dlLoading}
                  style={{ background: '#39A900', color: '#fff', border: 'none' }}
                >
                  <AppIcon name="printer" size={14} /> Descargar PDF
                </AppButton>
              )}
            </div>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Filtros */}
            {active.filtros.length > 0 && (
              <div style={{
                background: '#f9fafb', border: '1px solid #e5e7eb',
                borderRadius: 8, padding: '14px 16px',
              }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: 12 }}>
                  Filtros
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                  {active.filtros.map(f => (
                    <div key={f.id} style={{ minWidth: 160, flex: '1 1 160px' }}>
                      <FormField label={f.label}>
                        {f.type === 'select' ? (
                          <AppSelect size="sm" value={filtros[f.id] ?? ''} onChange={e => setFiltro(f.id, e.target.value)}>
                            {f.options.map(o => (
                              <option key={o.value} value={o.value}>{o.label}</option>
                            ))}
                          </AppSelect>
                        ) : (
                          <AppInput
                            size="sm"
                            type={f.type}
                            value={filtros[f.id] ?? ''}
                            placeholder={f.placeholder ?? ''}
                            onChange={e => setFiltro(f.id, e.target.value)}
                          />
                        )}
                      </FormField>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Preview de datos */}
            {data && (
              <div>
                {/* Resumen general: mostrar KPIs en mini-grid */}
                {active.id === 'resumen' ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>
                      Vista previa — período {data.periodo?.desde} a {data.periodo?.hasta}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8 }}>
                      {[
                        { label: 'Solicitudes',       value: data.kpis?.total_solicitudes },
                        { label: 'Entregadas',         value: data.kpis?.entregadas },
                        { label: 'Rechazadas',         value: data.kpis?.rechazadas },
                        { label: 'Préstamos activos',  value: data.kpis?.prestamos_activos },
                        { label: 'Con mora',           value: data.kpis?.prestamos_vencidos },
                        { label: 'Incidencias',        value: data.kpis?.total_incidencias },
                        { label: 'Materiales',         value: data.kpis?.total_materiales },
                        { label: 'Stock crítico',      value: data.kpis?.lotes_stock_critico },
                      ].map(({ label, value }) => (
                        <div key={label} style={{
                          background: '#f0fdf4', border: '1px solid #bbf7d0',
                          borderRadius: 8, padding: '10px 12px',
                        }}>
                          <div style={{ fontSize: 20, fontWeight: 700, color: '#39A900' }}>{value ?? 0}</div>
                          <div style={{ fontSize: 11, color: '#6B7280', marginTop: 2 }}>{label}</div>
                        </div>
                      ))}
                    </div>
                    <div style={{ fontSize: 12, color: '#6B7280' }}>
                      El PDF incluye tablas de solicitudes por estado, materiales más solicitados, incidencias y stock crítico.
                    </div>
                  </div>
                ) : (
                  /* Otros reportes: tabla preview */
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 8 }}>
                      Vista previa ({previewRows.length} de {totalRows} registro{totalRows !== 1 ? 's' : ''})
                    </div>
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                        <thead>
                          <tr style={{ background: '#39A900' }}>
                            {active.previewCols.map(col => (
                              <th key={col} style={{
                                padding: '7px 10px', color: '#fff',
                                fontWeight: 600, textAlign: 'left', whiteSpace: 'nowrap',
                              }}>
                                {COL_LABELS[col] ?? col}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {previewRows.map((row, i) => (
                            <tr key={i} style={{ background: i % 2 === 0 ? '#f9fafb' : '#fff' }}>
                              {active.previewCols.map(col => (
                                <td key={col} style={{
                                  padding: '6px 10px', color: '#374151',
                                  borderBottom: '1px solid #e5e7eb', whiteSpace: 'nowrap',
                                }}>
                                  {col === 'porcentaje' ? `${row[col]}%`
                                    : col === 'dias_para_vencer' ? (row[col] < 0 ? `${Math.abs(row[col])}d venc.` : `${row[col]}d`)
                                    : (row[col] ?? '—')}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {totalRows > 8 && (
                      <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 6, textAlign: 'right' }}>
                        + {totalRows - 8} registro(s) más incluidos en el PDF completo
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Estado vacío antes de generar */}
            {!data && !loading && (
              <div style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                gap: 8, padding: '24px 0', color: '#9CA3AF',
              }}>
                <AppIcon name="printer" size={32} style={{ color: '#D1FAE5' }} />
                <span style={{ fontSize: 13 }}>
                  {active.filtros.length > 0
                    ? 'Configura los filtros y pulsa Generar'
                    : 'Pulsa Generar para obtener los datos'}
                </span>
              </div>
            )}
          </div>
        </AppModal>
      )}
    </div>
    </>
  )
}
