import { Document, Page, View, Text, Image, StyleSheet } from '@react-pdf/renderer'
import sigmatLogo from '../../../assets/sigmat-logo.png'

const GREEN  = '#39A900'
const DARK   = '#111827'
const MUTED  = '#6B7280'
const STRIPE = '#F0FDF4'
const BORDER = '#E5E7EB'

export const pdfStyles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 9,
    color: DARK,
    backgroundColor: '#ffffff',
    paddingBottom: 44,
  },
  // ── Header ──
  header: {
    backgroundColor: GREEN,
    padding: '14 24',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLogo: { width: 90, height: 30, objectFit: 'contain' },
  headerRight: { alignItems: 'flex-end' },
  headerTitle: { fontSize: 14, fontFamily: 'Helvetica-Bold', color: '#ffffff' },
  headerSub: { fontSize: 7.5, color: '#d1fae5', marginTop: 2 },
  // ── Body ──
  body: { padding: '18 24' },
  reportTitle: { fontSize: 17, fontFamily: 'Helvetica-Bold', color: GREEN, marginBottom: 3 },
  reportDate:  { fontSize: 8, color: MUTED, marginBottom: 14 },
  // ── Filter bar ──
  filterBar: {
    backgroundColor: STRIPE,
    border: `1 solid #D1FAE5`,
    borderRadius: 4,
    padding: '6 10',
    marginBottom: 14,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
  },
  filterChip: { fontSize: 8, color: DARK },
  filterLabel: { fontFamily: 'Helvetica-Bold' },
  // ── Table ──
  table: { width: '100%' },
  thead: {
    flexDirection: 'row',
    backgroundColor: GREEN,
    borderRadius: '4 4 0 0',
    paddingVertical: 5,
  },
  th: { fontFamily: 'Helvetica-Bold', color: '#ffffff', fontSize: 8, paddingHorizontal: 6 },
  trEven: { flexDirection: 'row', backgroundColor: STRIPE,    borderBottomWidth: 1, borderBottomColor: BORDER, minHeight: 22, alignItems: 'center' },
  trOdd:  { flexDirection: 'row', backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: BORDER, minHeight: 22, alignItems: 'center' },
  td: { fontSize: 8, color: DARK, paddingHorizontal: 6, paddingVertical: 3 },
  // ── Misc ──
  noData:   { fontSize: 9, color: MUTED, textAlign: 'center', padding: 16 },
  total:    { fontSize: 8, color: MUTED, marginTop: 6 },
  section:  { marginBottom: 18 },
  secTitle: {
    fontSize: 10, fontFamily: 'Helvetica-Bold', color: GREEN,
    borderBottomWidth: 1, borderBottomColor: '#D1FAE5', paddingBottom: 3, marginBottom: 8,
  },
  // ── KPI grid ──
  kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  kpiCard: {
    width: '22%', backgroundColor: STRIPE, border: `1 solid #D1FAE5`,
    borderRadius: 6, padding: '8 10',
  },
  kpiValue: { fontSize: 18, fontFamily: 'Helvetica-Bold', color: GREEN },
  kpiLabel: { fontSize: 7.5, color: MUTED, marginTop: 2 },
  // ── Footer ──
  footer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: GREEN, padding: '7 24',
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  footerText: { fontSize: 7, color: '#d1fae5' },
})

// ── Wrapper document ──────────────────────────────────────────────────────────
export function SenaDoc({ title, filtros = [], orientation = 'portrait', children }) {
  const now = new Date().toLocaleDateString('es-CO', {
    year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })

  return (
    <Document>
      <Page size="A4" orientation={orientation} style={pdfStyles.page}>
        {/* Header */}
        <View style={pdfStyles.header} fixed>
          <Image src={sigmatLogo} style={pdfStyles.headerLogo} />
          <View style={pdfStyles.headerRight}>
            <Text style={pdfStyles.headerTitle}>SIGMAT</Text>
            <Text style={pdfStyles.headerSub}>Sistema de Gestión de Materiales</Text>
            <Text style={pdfStyles.headerSub}>SENA — Servicio Nacional de Aprendizaje</Text>
          </View>
        </View>

        {/* Body */}
        <View style={pdfStyles.body}>
          <Text style={pdfStyles.reportTitle}>{title}</Text>
          <Text style={pdfStyles.reportDate}>Generado el {now}</Text>

          {filtros.length > 0 && (
            <View style={pdfStyles.filterBar}>
              {filtros.map(({ label, value }, i) => (
                <Text key={i} style={pdfStyles.filterChip}>
                  <Text style={pdfStyles.filterLabel}>{label}: </Text>
                  {value || 'Todos'}
                </Text>
              ))}
            </View>
          )}

          {children}
        </View>

        {/* Footer */}
        <View style={pdfStyles.footer} fixed>
          <Text style={pdfStyles.footerText}>SENA — SIGMAT Sistema de Gestión de Materiales</Text>
          <Text
            style={pdfStyles.footerText}
            render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`}
          />
        </View>
      </Page>
    </Document>
  )
}

// ── Tabla genérica ────────────────────────────────────────────────────────────
export function PdfTable({ columns, rows }) {
  if (!rows?.length) {
    return <Text style={pdfStyles.noData}>Sin datos para mostrar.</Text>
  }
  return (
    <View style={pdfStyles.table}>
      <View style={pdfStyles.thead}>
        {columns.map(col => (
          <Text key={col.key} style={[pdfStyles.th, col.width ? { width: col.width } : { flex: col.flex ?? 1 }]}>
            {col.label}
          </Text>
        ))}
      </View>
      {rows.map((row, idx) => (
        <View key={idx} style={idx % 2 === 0 ? pdfStyles.trEven : pdfStyles.trOdd} wrap={false}>
          {columns.map(col => (
            <Text key={col.key} style={[pdfStyles.td, col.width ? { width: col.width } : { flex: col.flex ?? 1 }]}>
              {col.render ? col.render(row) : String(row[col.key] ?? '—')}
            </Text>
          ))}
        </View>
      ))}
    </View>
  )
}
