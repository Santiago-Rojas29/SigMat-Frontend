/** Formatea una fecha a texto legible en español colombiano */
export function fmt(val, opts) {
  if (!val) return '—'
  return new Date(val).toLocaleDateString('es-CO', {
    day: '2-digit', month: 'short', year: 'numeric',
    ...opts,
  })
}

/** Formatea fecha + hora */
export function fmtDatetime(val) {
  if (!val) return '—'
  return new Date(val).toLocaleString('es-CO', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

/** Retorna la fecha de hoy en formato YYYY-MM-DD para inputs type="date" */
export function hoy() {
  return new Date().toISOString().split('T')[0]
}

/** Trunca un string y añade ellipsis */
export function truncate(str, max = 8) {
  if (!str) return '—'
  return str.length > max ? str.slice(0, max) + '…' : str
}
