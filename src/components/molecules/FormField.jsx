export function FormField({ label, htmlFor, children, required }) {
  return (
    <div className="d-flex flex-column gap-1 w-100">
      <label htmlFor={htmlFor} className="form-label mb-0" style={{ fontSize: 13, fontWeight: 500, color: '#374151' }}>
        {label}
        {required && <span className="ms-1" style={{ color: 'var(--sena-green)' }}>*</span>}
      </label>
      {children}
    </div>
  )
}
