export function PlaceholderPage({ title, description, module }) {
  return (
    <div>
      {/* Header card */}
      <div
        style={{
          background: '#fff',
          borderRadius: 12,
          padding: '24px 28px',
          marginBottom: 20,
          border: '1px solid #e5e7eb',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: '#111827', margin: 0, marginBottom: 4 }}>
            {title}
          </h1>
          <p style={{ fontSize: 13.5, color: '#6b7280', margin: 0 }}>
            {description ?? `Gestión de ${title.toLowerCase()}`}
          </p>
        </div>
        {module && (
          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: '0.5px',
              textTransform: 'uppercase',
              color: '#39A900',
              background: 'rgba(57,169,0,0.08)',
              border: '1px solid rgba(57,169,0,0.2)',
              borderRadius: 6,
              padding: '4px 10px',
            }}
          >
            {module}
          </span>
        )}
      </div>

      {/* Content placeholder */}
      <div
        style={{
          background: '#fff',
          borderRadius: 12,
          border: '1px solid #e5e7eb',
          minHeight: 400,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 16,
          padding: 40,
        }}
      >
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: 16,
            background: 'linear-gradient(135deg, rgba(57,169,0,0.12), rgba(0,120,50,0.08))',
            border: '1.5px dashed rgba(57,169,0,0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#39A900" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
        </div>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: 15, fontWeight: 600, color: '#374151', margin: '0 0 6px' }}>
            Módulo en construcción
          </p>
          <p style={{ fontSize: 13, color: '#9ca3af', margin: 0, maxWidth: 320 }}>
            El módulo de <strong style={{ color: '#6b7280' }}>{title}</strong> estará disponible próximamente.
          </p>
        </div>
      </div>
    </div>
  )
}
