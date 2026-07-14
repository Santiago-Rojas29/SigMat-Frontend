import { View, Text } from '@react-pdf/renderer'
import { SenaDoc, PdfTable, pdfStyles } from './SenaPdf'

const TIPO_LABEL = { daño: 'Daño', pérdida: 'Pérdida', mantenimiento: 'Mantenimiento' }
const EST_LABEL  = { abierta: 'Abierta', en_proceso: 'En proceso', cerrada: 'Cerrada' }

const COLS = [
  { key: 'fecha_incidencia', label: 'Fecha',        width: 62 },
  { key: 'tipo',             label: 'Tipo',         width: 68,
    render: r => TIPO_LABEL[r.tipo] ?? r.tipo },
  { key: 'estado',           label: 'Estado',       width: 62,
    render: r => EST_LABEL[r.estado] ?? r.estado },
  { key: 'material',         label: 'Material',     flex: 2 },
  { key: 'codigo_unidad',    label: 'Código',       flex: 1.5 },
  { key: 'responsable',      label: 'Responsable',  flex: 2 },
  { key: 'descripcion',      label: 'Descripción',  flex: 3 },
]

export function ReporteIncidenciasPdf({ data, filtros }) {
  return (
    <SenaDoc title="Reporte de Incidencias" filtros={filtros} orientation="landscape">
      <PdfTable columns={COLS} rows={data} />
      <Text style={pdfStyles.total}>Total: {data.length} incidencia(s)</Text>
    </SenaDoc>
  )
}
