import { View, Text } from '@react-pdf/renderer'
import { SenaDoc, PdfTable, pdfStyles } from './SenaPdf'

const ESTADOS = {
  pendiente_instructor: 'Pend. Instructor',
  pendiente_admin:      'Pend. Admin',
  pendiente_bodega:     'Pend. Bodega',
  aprobado:  'Aprobado',
  entregado: 'Entregado',
  rechazado: 'Rechazado',
  cancelado: 'Cancelado',
}

const COLS = [
  { key: 'fecha_solicitud', label: 'Fecha',      width: 58 },
  { key: 'solicitante',     label: 'Solicitante', flex: 2  },
  { key: 'tipo_flujo',      label: 'Flujo',       width: 56,
    render: r => r.tipo_flujo === 'instructor' ? 'Instructor' : 'Aprendiz' },
  { key: 'tipo_prestamo',   label: 'Tipo',        width: 50,
    render: r => r.tipo_prestamo === 'interno' ? 'Interno' : 'Externo' },
  { key: 'estado',          label: 'Estado',      width: 76,
    render: r => ESTADOS[r.estado] ?? r.estado },
  { key: 'instructor',      label: 'Instructor',  flex: 2  },
  { key: 'fecha_entrega',   label: 'F. Entrega',  width: 58 },
]

export function ReporteSolicitudesPdf({ data, filtros }) {
  return (
    <SenaDoc title="Reporte de Solicitudes" filtros={filtros} orientation="landscape">
      <PdfTable columns={COLS} rows={data} />
      <Text style={pdfStyles.total}>Total: {data.length} registro(s)</Text>
    </SenaDoc>
  )
}
