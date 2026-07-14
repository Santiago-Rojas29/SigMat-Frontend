export function PageHeader({ title, description, badge, actions }) {
  return (
    <div className="d-flex align-items-center justify-content-between gap-3 bg-white rounded-3 border mb-3 px-4 py-3">
      <div style={{ minWidth: 0 }}>
        <div className={`d-flex align-items-center gap-2 ${description ? 'mb-1' : ''}`}>
          <h1 className="h5 fw-bold mb-0" style={{ color: '#111827' }}>{title}</h1>
          {badge}
        </div>
        {description && (
          <p className="mb-0 text-secondary" style={{ fontSize: 13.5 }}>{description}</p>
        )}
      </div>
      {actions && (
        <div className="d-flex gap-2 flex-shrink-0">
          {actions}
        </div>
      )}
    </div>
  )
}
