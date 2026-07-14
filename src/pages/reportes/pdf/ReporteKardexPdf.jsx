import { View, Text } from '@react-pdf/renderer'
import { SenaDoc, PdfTable, pdfStyles } from './SenaPdf'

const TIPOS = {
  entrada:  'Entrada',
  salida:   'Salida',
  ajuste:   'Ajuste',
  traslado: 'Traslado',
}

const COLS = [
  { key: 'fecha_movimiento', label: 'Fecha',          width: 62 },
  { key: 'tipo_movimiento',  label: 'Tipo',           width: 58,
    render: r => TIPOS[r.tipo_movimiento] ?? r.tipo_movimiento },
  { key: 'material',         label: 'Material',       flex: 2   },
  { key: 'codigo',           label: 'Código',         flex: 2   },
  { key: 'tipo_item',        label: 'Ítem',           width: 42 },
  { key: 'cantidad',         label: 'Cantidad',       width: 52 },
  { key: 'saldo',            label: 'Saldo',          width: 46 },
]

export function ReporteKardexPdf({ data, filtros }) {
  return (
    <SenaDoc title="Reporte de Movimientos (Kardex)" filtros={filtros} orientation="landscape">
      <PdfTable columns={COLS} rows={data} />
      <Text style={pdfStyles.total}>Total: {data.length} movimiento(s)</Text>
    </SenaDoc>
  )
}
