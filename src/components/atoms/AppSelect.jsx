import './AppSelect.css'

export function AppSelect({ error, size = 'md', className = '', style, children, ...props }) {
  const sizeClass = size === 'sm' ? 'form-select-sm' : ''

  return (
    <div className="position-relative w-100">
      <select
        className={`form-select sena-select ${sizeClass} ${error ? 'is-invalid' : ''} ${className}`}
        style={style}
        {...props}
      >
        {children}
      </select>
      {error && <div className="invalid-feedback d-block">{error}</div>}
    </div>
  )
}
