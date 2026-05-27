export function PageHeader({ title, description, badge, actions }) {
  return (
    <div style={{
      background: '#fff',
      borderRadius: 12,
      padding: '20px 24px',
      marginBottom: 16,
      border: '1px solid #E5E7EB',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 16,
    }}>
      <div style={{ minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: description ? 3 : 0 }}>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: '#111827', margin: 0 }}>
            {title}
          </h1>
          {badge && badge}
        </div>
        {description && (
          <p style={{ fontSize: 13.5, color: '#6B7280', margin: 0 }}>{description}</p>
        )}
      </div>
      {actions && (
        <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
          {actions}
        </div>
      )}
    </div>
  )
}
