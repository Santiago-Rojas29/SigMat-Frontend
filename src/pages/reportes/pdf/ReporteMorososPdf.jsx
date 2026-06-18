import { View, Text } from '@react-pdf/renderer'
import { SenaDoc, PdfTable, pdfStyles } from './SenaPdf'

const COLS = [
  { key: 'usuario',            label: 'Usuario',            flex: 3 },
  { key: 'correo',             label: 'Correo',             flex: 3 },
  { key: 'prestamos_vencidos', label: 'Préstamos vencidos', width: 90 },
  { key: 'fecha_mas_antigua',  label: 'Préstamo más antiguo', width: 92 },
  { key: 'dias_vencido',       label: 'Días de mora',       width: 72,
    render: r => `${r.dias_vencido} días` },
]

export function ReporteMorososPdf({ data, filtros }) {
  return (
    <SenaDoc title="Reporte de Usuarios con Mora" filtros={filtros}>
      <PdfTable columns={COLS} rows={data} />
      <Text style={pdfStyles.total}>Total: {data.length} usuario(s) con préstamos vencidos</Text>
    </SenaDoc>
  )
}
