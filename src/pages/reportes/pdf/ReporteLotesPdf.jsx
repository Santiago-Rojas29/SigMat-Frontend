import { View, Text } from '@react-pdf/renderer'
import { SenaDoc, PdfTable, pdfStyles } from './SenaPdf'

const COLS = [
  { key: 'codigo_lote',         label: 'Código lote',     flex: 1.5 },
  { key: 'material',            label: 'Material',        flex: 2   },
  { key: 'categoria',           label: 'Categoría',       width: 68 },
  { key: 'fecha_vencimiento',   label: 'F. Vencimiento',  width: 72 },
  { key: 'dias_para_vencer',    label: 'Días',            width: 40,
    render: r => r.dias_para_vencer < 0 ? `${Math.abs(r.dias_para_vencer)}d vencido` : `${r.dias_para_vencer}d` },
  { key: 'cantidad_disponible', label: 'Disponible',      width: 56 },
  { key: 'ubicacion',           label: 'Ubicación',       flex: 2   },
  { key: 'estado',              label: 'Estado',          width: 64 },
]

export function ReporteLotesPdf({ data, filtros }) {
  return (
    <SenaDoc title="Reporte de Lotes por Vencimiento" filtros={filtros} orientation="landscape">
      <PdfTable columns={COLS} rows={data} />
      <Text style={pdfStyles.total}>Total: {data.length} lote(s)</Text>
    </SenaDoc>
  )
}
