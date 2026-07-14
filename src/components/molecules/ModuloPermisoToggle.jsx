import { SUBMODULOS, ACCIONES_GLOBALES, ACCIONES_EXTRA } from '../../constants/permisos.constants'

// Módulos que usan permisos granulares por submódulo (acciones independientes
// por cada submódulo, en vez de un único selector compartido).
const MODULOS_GRANULARES = ['inventario', 'estructura', 'administracion', 'movimientos', 'control']

function AccionesPicker({ acciones, disponiblesAcc, onToggle, onToggleTodas }) {
  const todasSelected = disponiblesAcc.length > 0 && acciones.length === disponiblesAcc.length
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <p style={{ fontSize: 11.5, fontWeight: 600, color: '#6b7280', margin: 0 }}>
          Acciones permitidas:
        </p>
        <button
          type="button"
          onClick={onToggleTodas}
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
              onClick={() => onToggle(a.value)}
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
  )
}

export function ModuloPermisoToggle({
  modulo, label, enabled,
  submodulos = [], acciones = [],   // modo simple (compartido)
  subAcciones = {},                // modo granular: { [submodulo]: acciones[] }
  showAcciones = true,             // false = el consumidor no maneja acciones por submódulo (ej. permisos por usuario)
  onChange,
}) {
  const disponiblesSubs = SUBMODULOS[modulo] ?? []
  const disponiblesAcc  = [...ACCIONES_GLOBALES, ...(ACCIONES_EXTRA[modulo] ?? [])]
  const granular        = MODULOS_GRANULARES.includes(modulo)

  const toggle = () => {
    if (granular) onChange({ enabled: !enabled, subAcciones: {}, submodulos: [] })
    else onChange({ enabled: !enabled, submodulos: [], acciones: [] })
  }

  // ── Modo simple ───────────────────────────────────────────────────────────

  const todasSelected = disponiblesAcc.length > 0 && acciones.length === disponiblesAcc.length

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

  // ── Modo granular ─────────────────────────────────────────────────────────

  const toggleSubGranular = (value) => {
    const next = { ...subAcciones }
    delete next['']   // elegir un submódulo específico reemplaza "todo el módulo"
    if (value in next) delete next[value]
    else next[value] = []
    onChange({ enabled: true, subAcciones: next, submodulos: Object.keys(next).filter(k => k !== '') })
  }

  // "Todo el módulo" es una elección explícita (submódulo ''), no un valor por
  // defecto ante la ausencia de otras marcas — así cero marcado siempre es cero acceso.
  const toggleTodoElModulo = () => {
    const next = '' in subAcciones ? {} : { '': [] }
    onChange({ enabled: true, subAcciones: next, submodulos: [] })
  }

  const toggleAccionGranular = (submodulo, value) => {
    const actuales = subAcciones[submodulo] ?? []
    const next = actuales.includes(value)
      ? actuales.filter(v => v !== value)
      : [...actuales, value]
    const nextSubAcciones = { ...subAcciones, [submodulo]: next }
    onChange({ enabled: true, subAcciones: nextSubAcciones, submodulos: Object.keys(nextSubAcciones) })
  }

  const toggleTodasGranular = (submodulo) => {
    const actuales = subAcciones[submodulo] ?? []
    const todas = actuales.length === disponiblesAcc.length
    const nextSubAcciones = { ...subAcciones, [submodulo]: todas ? [] : disponiblesAcc.map(a => a.value) }
    onChange({ enabled: true, subAcciones: nextSubAcciones, submodulos: Object.keys(nextSubAcciones) })
  }

  // La clave '' representa "módulo completo" (elegida explícitamente, ver toggleTodoElModulo);
  // no cuenta como un submódulo real para el badge.
  const todoElModulo = '' in subAcciones
  const subsGranularesReales = Object.keys(subAcciones).filter(k => k !== '')
  const totalSubGranular = subsGranularesReales.length

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

        {enabled && !granular && (
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

        {enabled && granular && (
          todoElModulo ? (
            <span style={{
              marginLeft: 'auto', fontSize: 11, fontWeight: 600, color: '#4338ca',
              background: '#eef2ff', padding: '2px 8px', borderRadius: 999,
            }}>
              Todo el módulo
            </span>
          ) : totalSubGranular > 0 ? (
            <span style={{
              marginLeft: 'auto', fontSize: 11, fontWeight: 600, color: '#4338ca',
              background: '#eef2ff', padding: '2px 8px', borderRadius: 999,
            }}>
              {totalSubGranular} {totalSubGranular === 1 ? 'submódulo' : 'submódulos'}
            </span>
          ) : (
            <span style={{
              marginLeft: 'auto', fontSize: 11, fontWeight: 500, color: '#dc2626',
              background: '#fef2f2', padding: '2px 8px', borderRadius: 999,
            }}>
              Sin acceso
            </span>
          )
        )}
      </button>

      {/* ── Cuerpo expandido ──────────────────────────────────────────────── */}
      {enabled && !granular && (
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

          {disponiblesSubs.length > 0 && (
            <hr style={{ border: 'none', borderTop: '1px solid #e5e7eb', margin: '0 0 10px' }} />
          )}

          <AccionesPicker
            acciones={acciones}
            disponiblesAcc={disponiblesAcc}
            onToggle={toggleAccion}
            onToggleTodas={toggleTodas}
          />
        </div>
      )}

      {/* ── Cuerpo expandido — modo granular (Inventario) ───────────────────── */}
      {enabled && granular && (
        <div style={{ marginTop: 10, paddingLeft: 28, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <p style={{ fontSize: 11, color: '#9ca3af', margin: 0 }}>
            {showAcciones
              ? 'Marca cada submódulo al que este rol debe tener acceso, y elige sus acciones por separado.'
              : 'Marca los submódulos a los que este usuario debe tener acceso adicional.'}
            {' '}Un submódulo sin marcar no es visible ni accesible. Sin ninguna marca, el módulo queda sin acceso.
          </p>

          {/* Opción explícita de acceso completo — evita la ambigüedad de "nada marcado" */}
          <div
            style={{
              borderRadius: 8,
              border: `1.5px solid ${todoElModulo ? '#86efac' : '#e5e7eb'}`,
              background: todoElModulo ? '#f0fdf4' : '#fff',
              padding: '8px 10px',
            }}
          >
            <button
              type="button"
              onClick={toggleTodoElModulo}
              style={{
                display: 'flex', alignItems: 'center', gap: 8, width: '100%',
                background: 'none', border: 'none', cursor: 'pointer', padding: 0, textAlign: 'left',
              }}
            >
              <span style={{
                width: 15, height: 15, borderRadius: 4, flexShrink: 0,
                border: `2px solid ${todoElModulo ? '#16a34a' : '#d1d5db'}`,
                background: todoElModulo ? '#16a34a' : '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {todoElModulo && (
                  <svg width="9" height="9" viewBox="0 0 12 12" fill="none">
                    <polyline points="2,6 5,9 10,3" stroke="#fff" strokeWidth="2"
                      strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </span>
              <span style={{ fontSize: 12.5, fontWeight: 600, color: todoElModulo ? '#15803d' : '#4b5563' }}>
                Todo el módulo (sin restricción)
              </span>
            </button>
          </div>

          {disponiblesSubs.length > 0 && (
            <hr style={{ border: 'none', borderTop: '1px solid #e5e7eb', margin: 0 }} />
          )}

          {!todoElModulo && disponiblesSubs.map(s => {
            const incluido = s.value in subAcciones
            return (
              <div
                key={s.value}
                style={{
                  borderRadius: 8,
                  border: `1.5px solid ${incluido ? '#a5b4fc' : '#e5e7eb'}`,
                  background: incluido ? '#eef2ff' : '#fff',
                  padding: '8px 10px',
                }}
              >
                <button
                  type="button"
                  onClick={() => toggleSubGranular(s.value)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8, width: '100%',
                    background: 'none', border: 'none', cursor: 'pointer', padding: 0, textAlign: 'left',
                  }}
                >
                  <span style={{
                    width: 15, height: 15, borderRadius: 4, flexShrink: 0,
                    border: `2px solid ${incluido ? '#4f46e5' : '#d1d5db'}`,
                    background: incluido ? '#4f46e5' : '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {incluido && (
                      <svg width="9" height="9" viewBox="0 0 12 12" fill="none">
                        <polyline points="2,6 5,9 10,3" stroke="#fff" strokeWidth="2"
                          strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </span>
                  <span style={{ fontSize: 12.5, fontWeight: 600, color: incluido ? '#3730a3' : '#4b5563' }}>
                    {s.label}
                  </span>
                </button>

                {incluido && showAcciones && (
                  <div style={{ marginTop: 8, paddingLeft: 23 }}>
                    <AccionesPicker
                      acciones={subAcciones[s.value] ?? []}
                      disponiblesAcc={disponiblesAcc}
                      onToggle={(v) => toggleAccionGranular(s.value, v)}
                      onToggleTodas={() => toggleTodasGranular(s.value)}
                    />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
