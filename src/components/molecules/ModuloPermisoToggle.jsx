import { SUBMODULOS, ACCIONES_GLOBALES, ACCIONES_EXTRA } from '../../constants/permisos.constants'

export function ModuloPermisoToggle({ modulo, label, enabled, submodulos, acciones = [], onChange }) {
  const disponiblesSubs = SUBMODULOS[modulo] ?? []
  const disponiblesAcc  = [...ACCIONES_GLOBALES, ...(ACCIONES_EXTRA[modulo] ?? [])]
  const todasSelected   = disponiblesAcc.length > 0 && acciones.length === disponiblesAcc.length

  const toggle = () => onChange({ enabled: !enabled, submodulos: [], acciones: [] })

  const toggleSub = (value) => {
    const next = submodulos.includes(value)
      ? submodulos.filter(v => v !== value)
      : [...submodulos, value]
    onChange({ enabled: true, submodulos: next, acciones })
  }

  const toggleAccion = (value) => {
    const next = acciones.includes(value)
      ? acciones.filter(v => v !== value)
      : [...acciones, value]
    onChange({ enabled: true, submodulos, acciones: next })
  }

  const toggleTodas = () => {
    const next = todasSelected ? [] : disponiblesAcc.map(a => a.value)
    onChange({ enabled: true, submodulos, acciones: next })
  }

  return (
    <div style={{
      borderRadius: 10,
      border: `1.5px solid ${enabled ? '#86efac' : '#e5e7eb'}`,
      background: enabled ? '#f0fdf4' : '#fafafa',
      padding: '12px 14px',
      transition: 'all 0.15s',
    }}>
      {/* ── Toggle del módulo ──────────────────────────────────────────────── */}
      <button
        type="button"
        onClick={toggle}
        style={{
          display: 'flex', alignItems: 'center', gap: 10,
          background: 'none', border: 'none', cursor: 'pointer',
          padding: 0, width: '100%', textAlign: 'left',
        }}
      >
        <span style={{
          width: 18, height: 18, borderRadius: 5, flexShrink: 0, transition: 'all 0.15s',
          border: `2px solid ${enabled ? '#16a34a' : '#d1d5db'}`,
          background: enabled ? '#16a34a' : '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {enabled && (
            <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
              <polyline points="2,6 5,9 10,3" stroke="#fff" strokeWidth="2"
                strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          )}
        </span>

        <span style={{ fontSize: 13.5, fontWeight: 600, color: enabled ? '#15803d' : '#374151' }}>
          {label}
        </span>

        {enabled && (
          acciones.length > 0
            ? (
              <span style={{
                marginLeft: 'auto', fontSize: 11, fontWeight: 600, color: '#4338ca',
                background: '#eef2ff', padding: '2px 8px', borderRadius: 999,
              }}>
                {acciones.length} {acciones.length === 1 ? 'acción' : 'acciones'}
              </span>
            ) : (
              <span style={{
                marginLeft: 'auto', fontSize: 11, fontWeight: 500, color: '#dc2626',
                background: '#fef2f2', padding: '2px 8px', borderRadius: 999,
              }}>
                Sin acciones
              </span>
            )
        )}
      </button>

      {/* ── Cuerpo expandido ──────────────────────────────────────────────── */}
      {enabled && (
        <div style={{ marginTop: 10, paddingLeft: 28 }}>

          {/* Submódulos */}
          {disponiblesSubs.length > 0 && (
            <div style={{ marginBottom: 10 }}>
              <p style={{ fontSize: 11.5, fontWeight: 600, color: '#6b7280', margin: '0 0 6px' }}>
                Submódulos:
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {disponiblesSubs.map(s => {
                  const selected = submodulos.includes(s.value)
                  return (
                    <button
                      key={s.value}
                      type="button"
                      onClick={() => toggleSub(s.value)}
                      style={{
                        padding: '4px 12px', borderRadius: 999, cursor: 'pointer',
                        border: `1.5px solid ${selected ? '#16a34a' : '#d1d5db'}`,
                        background: selected ? '#dcfce7' : '#fff',
                        color: selected ? '#15803d' : '#4b5563',
                        fontSize: 12, fontWeight: selected ? 600 : 400, transition: 'all 0.15s',
                      }}
                    >
                      {s.label}
                    </button>
                  )
                })}
              </div>
              {submodulos.length === 0 && (
                <p style={{ fontSize: 11, color: '#9ca3af', margin: '4px 0 0' }}>
                  Sin selección = acceso a todos los submódulos
                </p>
              )}
            </div>
          )}

          {/* Divisor */}
          {disponiblesSubs.length > 0 && (
            <hr style={{ border: 'none', borderTop: '1px solid #e5e7eb', margin: '0 0 10px' }} />
          )}

          {/* Acciones */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <p style={{ fontSize: 11.5, fontWeight: 600, color: '#6b7280', margin: 0 }}>
                Acciones permitidas:
              </p>
              <button
                type="button"
                onClick={toggleTodas}
                style={{
                  fontSize: 10.5, padding: '1px 8px', borderRadius: 999, cursor: 'pointer',
                  border: `1.5px solid ${todasSelected ? '#6366f1' : '#a5b4fc'}`,
                  background: todasSelected ? '#eef2ff' : '#f5f3ff',
                  color: '#4f46e5', fontWeight: todasSelected ? 600 : 400, transition: 'all 0.15s',
                }}
              >
                {todasSelected ? 'Desmarcar todo' : 'Seleccionar todo'}
              </button>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {disponiblesAcc.map(a => {
                const selected = acciones.includes(a.value)
                return (
                  <button
                    key={a.value}
                    type="button"
                    onClick={() => toggleAccion(a.value)}
                    style={{
                      padding: '4px 12px', borderRadius: 999, cursor: 'pointer',
                      border: `1.5px solid ${selected ? '#6366f1' : '#d1d5db'}`,
                      background: selected ? '#eef2ff' : '#fff',
                      color: selected ? '#4338ca' : '#4b5563',
                      fontSize: 12, fontWeight: selected ? 600 : 400, transition: 'all 0.15s',
                    }}
                  >
                    {a.label}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
