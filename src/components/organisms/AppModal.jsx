import { useEffect } from 'react'
import './AppModal.css'

export function AppModal({
  isOpen,
  onClose,
  title,
  children,
  footer,
  maxWidth = 560,
}) {
  useEffect(() => {
    if (!isOpen) return
    const onKey = (e) => { if (e.key === 'Escape') onClose?.() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div
      className="modal-backdrop-sena d-flex align-items-center justify-content-center"
      onClick={e => { if (e.target === e.currentTarget) onClose?.() }}
    >
      <div
        className="modal-dialog-sena"
        style={{ maxWidth }}
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="modal-header-sena d-flex align-items-center justify-content-between">
          <h5 className="modal-title-sena mb-0">{title}</h5>
          <button
            type="button"
            className="btn-close-sena btn p-1 border-0"
            onClick={onClose}
            aria-label="Cerrar"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="modal-body-sena">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="modal-footer-sena d-flex justify-content-end gap-2">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}
