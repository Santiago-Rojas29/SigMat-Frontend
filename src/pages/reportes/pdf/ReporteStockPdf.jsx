import { View, Text } from '@react-pdf/renderer'
import { SenaDoc, PdfTable, pdfStyles } from './SenaPdf'

const COLS = [
  { key: 'material',           label: 'Material',     flex: 3 },
  { key: 'categoria',          label: 'Categoría',    width: 70 },
  { key: 'codigo_lote',        label: 'Código lote',  width: 80 },
  { key: 'cantidad_disponible',label: 'Disponible',   width: 55 },
  { key: 'cantidad_inicial',   label: 'Inicial',      width: 50 },
  { key: 'porcentaje',         label: '% Stock',      width: 46,
    render: r => `${r.porcentaje}%` },
  { key: 'ubicacion',          label: 'Ubicación',    flex: 2 },
  { key: 'estado',             label: 'Estado',       width: 60 },
]

export function ReporteStockPdf({ data, filtros }) {
  return (
    <SenaDoc title="Reporte de Stock Crítico" filtros={filtros} orientation="landscape">
      <PdfTable columns={COLS} rows={data} />
      <Text style={pdfStyles.total}>Total: {data.length} lote(s) en stock crítico</Text>
    </SenaDoc>
  )
}
