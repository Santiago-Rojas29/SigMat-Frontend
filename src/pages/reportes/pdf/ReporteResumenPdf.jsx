import { View, Text } from '@react-pdf/renderer'
import { SenaDoc, PdfTable, pdfStyles } from './SenaPdf'

const EST_LABEL = {
  pendiente_instructor: 'Pend. Instructor', pendiente_admin: 'Pend. Admin',
  pendiente_bodega: 'Pend. Bodega', aprobado: 'Aprobado',
  entregado: 'Entregado', rechazado: 'Rechazado', cancelado: 'Cancelado',
}

const STOCK_COLS = [
  { key: 'material',            label: 'Material',   flex: 3 },
  { key: 'codigo_lote',         label: 'Lote',       width: 80 },
  { key: 'cantidad_disponible', label: 'Disponible', width: 56 },
  { key: 'porcentaje',          label: '% Stock',    width: 50, render: r => `${r.porcentaje}%` },
]

export function ReporteResumenPdf({ data, filtros }) {
  const { kpis, solicitudesPorEstado, topMateriales, incidenciasTipo, stockCritico, periodo } = data

  const kpiItems = [
    { label: 'Solicitudes',        value: kpis.total_solicitudes },
    { label: 'Entregadas',         value: kpis.entregadas },
    { label: 'Rechazadas',         value: kpis.rechazadas },
    { label: 'Préstamos activos',  value: kpis.prestamos_activos },
    { label: 'Con mora',           value: kpis.prestamos_vencidos },
    { label: 'Incidencias',        value: kpis.total_incidencias },
    { label: 'Materiales',         value: kpis.total_materiales },
    { label: 'Stock crítico',      value: kpis.lotes_stock_critico },
  ]

  return (
    <SenaDoc
      title="Resumen General del Sistema"
      filtros={[{ label: 'Período', value: `${periodo.desde} – ${periodo.hasta}` }]}
    >
      {/* KPIs */}
      <View style={pdfStyles.section}>
        <Text style={pdfStyles.secTitle}>Indicadores del período</Text>
        <View style={pdfStyles.kpiGrid}>
          {kpiItems.map(({ label, value }) => (
            <View key={label} style={pdfStyles.kpiCard}>
              <Text style={pdfStyles.kpiValue}>{value ?? 0}</Text>
              <Text style={pdfStyles.kpiLabel}>{label}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Solicitudes por estado */}
      <View style={pdfStyles.section}>
        <Text style={pdfStyles.secTitle}>Solicitudes por estado</Text>
        <PdfTable
          columns={[
            { key: 'estado', label: 'Estado', flex: 2, render: r => EST_LABEL[r.estado] ?? r.estado },
            { key: 'total',  label: 'Total',  width: 60 },
          ]}
          rows={solicitudesPorEstado}
        />
      </View>

      {/* Top materiales */}
      <View style={pdfStyles.section}>
        <Text style={pdfStyles.secTitle}>Materiales más solicitados (Top 10)</Text>
        <PdfTable
          columns={[
            { key: 'nombre', label: 'Material',    flex: 4 },
            { key: 'total',  label: 'Solicitudes', width: 70 },
          ]}
          rows={topMateriales}
        />
      </View>

      {/* Incidencias */}
      {incidenciasTipo?.length > 0 && (
        <View style={pdfStyles.section}>
          <Text style={pdfStyles.secTitle}>Incidencias por tipo</Text>
          <PdfTable
            columns={[
              { key: 'tipo',  label: 'Tipo',  flex: 2 },
              { key: 'total', label: 'Total', width: 60 },
            ]}
            rows={incidenciasTipo}
          />
        </View>
      )}

      {/* Stock crítico */}
      {stockCritico?.length > 0 && (
        <View style={pdfStyles.section}>
          <Text style={pdfStyles.secTitle}>Lotes en stock crítico</Text>
          <PdfTable columns={STOCK_COLS} rows={stockCritico} />
        </View>
      )}
    </SenaDoc>
  )
}
