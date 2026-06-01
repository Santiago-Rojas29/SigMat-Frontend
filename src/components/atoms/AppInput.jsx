import { forwardRef } from 'react'
import './AppInput.css'

export const AppInput = forwardRef(function AppInput(
  { icon, rightIcon, onRightIconClick, error, size = 'md', className = '', style, disabled, ...props },
  ref
) {
  const sizeClass = size === 'sm' ? 'form-control-sm' : ''

  return (
    <div className="position-relative w-100">
      {icon && (
        <span className="input-icon-left text-secondary">
          {icon}
        </span>
      )}
      <input
        ref={ref}
        disabled={disabled}
        className={`form-control sena-input ${sizeClass} ${icon ? 'ps-icon' : ''} ${rightIcon ? 'pe-icon' : ''} ${error ? 'is-invalid' : ''} ${className}`}
        style={style}
        {...props}
      />
      {rightIcon && (
        <button
          type="button"
          onClick={onRightIconClick}
          className="input-icon-right btn p-0 border-0 text-secondary"
        >
          {rightIcon}
        </button>
      )}
      {error && <div className="invalid-feedback d-block">{error}</div>}
    </div>
  )
})
