import { Text } from '@react-pdf/renderer'
import { SenaDoc, PdfTable, pdfStyles } from './SenaPdf'

const ESTADOS = {
  activo:     'Activo',
  finalizado: 'Finalizado',
}

const CONDICIONES = {
  bueno:      'Bueno',
  'dañado':   'Dañado',
  incompleto: 'Incompleto',
}

const COLS = [
  { key: 'fecha_solicitud',     label: 'F. Solicitud', width: 62 },
  { key: 'fecha_limite',        label: 'Vence',        width: 62 },
  { key: 'tipo_prestamo',       label: 'Tipo',         width: 52,
    render: r => r.tipo_prestamo === 'interno' ? 'Interno' : 'Externo' },
  { key: 'estado',              label: 'Estado',       width: 60,
    render: r => ESTADOS[r.estado] ?? r.estado },
  { key: 'devolucion',          label: 'Devolución',   flex: 1 },
  { key: 'fecha_devolucion',    label: 'F. Dev.',      width: 62 },
  { key: 'condicion_devolucion',label: 'Condición',    width: 62,
    render: r => CONDICIONES[r.condicion_devolucion] ?? (r.condicion_devolucion ?? '—') },
]

export function ReportePrestamosPdf({ data, filtros }) {
  return (
    <SenaDoc title="Mis Préstamos" filtros={filtros} orientation="landscape">
      <PdfTable columns={COLS} rows={data} />
      <Text style={pdfStyles.total}>Total: {data.length} registro(s)</Text>
    </SenaDoc>
  )
}
