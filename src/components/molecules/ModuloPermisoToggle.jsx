import { SUBMODULOS } from '../../constants/permisos.constants'

export function ModuloPermisoToggle({ modulo, label, enabled, submodulos, onChange }) {
  const disponibles = SUBMODULOS[modulo] ?? []

  const toggle = () => onChange({ enabled: !enabled, submodulos: [] })

  const toggleSub = (value) => {
    const next = submodulos.includes(value)
      ? submodulos.filter(v => v !== value)
      : [...submodulos, value]
    onChange({ enabled: true, submodulos: next })
  }

  return (
    <div style={{
      borderRadius: 10,
      border: `1.5px solid ${enabled ? '#86efac' : '#e5e7eb'}`,
      background: enabled ? '#f0fdf4' : '#fafafa',
      padding: '12px 14px',
      transition: 'all 0.15s',
    }}>
      <button
        type="button"
        onClick={toggle}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: 0,
          width: '100%',
          textAlign: 'left',
        }}
      >
        <span style={{
          width: 18,
          height: 18,
          borderRadius: 5,
          border: `2px solid ${enabled ? '#16a34a' : '#d1d5db'}`,
          background: enabled ? '#16a34a' : '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          transition: 'all 0.15s',
        }}>
          {enabled && (
            <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
              <polyline points="2,6 5,9 10,3" stroke="#fff" strokeWidth="2"
                strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          )}
        </span>

        <span style={{
          fontSize: 13.5,
          fontWeight: 600,
          color: enabled ? '#15803d' : '#374151',
        }}>
          {label}
        </span>

        {enabled && submodulos.length === 0 && (
          <span style={{
            marginLeft: 'auto',
            fontSize: 11,
            fontWeight: 500,
            color: '#16a34a',
            background: '#dcfce7',
            padding: '2px 8px',
            borderRadius: 999,
          }}>
            Acceso completo
          </span>
        )}
      </button>

      {enabled && disponibles.length > 0 && (
        <div style={{ marginTop: 10, paddingLeft: 28 }}>
          <p style={{ fontSize: 11.5, color: '#6b7280', margin: '0 0 6px' }}>
            Selecciona submódulos específicos — o deja sin marcar para acceso completo:
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {disponibles.map(s => {
              const selected = submodulos.includes(s.value)
              return (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => toggleSub(s.value)}
                  style={{
                    padding: '4px 12px',
                    borderRadius: 999,
                    border: `1.5px solid ${selected ? '#16a34a' : '#d1d5db'}`,
                    background: selected ? '#dcfce7' : '#fff',
                    color: selected ? '#15803d' : '#4b5563',
                    fontSize: 12,
                    fontWeight: selected ? 600 : 400,
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                >
                  {s.label}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
