import { AppButton } from '../atoms/AppButton'

export function ConfirmDialog({
  isOpen,
  title,
  description,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  onConfirm,
  onCancel,
  loading,
  variant = 'danger',
}) {
  if (!isOpen) return null

  return (
    <div
      onClick={e => { if (e.target === e.currentTarget) onCancel?.() }}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.35)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1100,
        padding: 20,
      }}
    >
      <div style={{
        background: '#fff',
        borderRadius: 14,
        width: '100%',
        maxWidth: 400,
        boxShadow: '0 20px 60px rgba(0,0,0,0.18)',
        padding: '28px 28px 24px',
      }}>
        <div style={{ display: 'flex', gap: 14, marginBottom: 20 }}>
          <div style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            background: variant === 'danger' ? '#fee2e2' : 'rgba(57,169,0,0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
              stroke={variant === 'danger' ? '#dc2626' : '#39A900'}
              strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              {variant === 'danger'
                ? <><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/></>
                : <><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></>
              }
            </svg>
          </div>
          <div>
            <p style={{ fontSize: 15, fontWeight: 700, color: '#111827', margin: '0 0 5px' }}>
              {title}
            </p>
            <p style={{ fontSize: 13.5, color: '#6B7280', margin: 0, lineHeight: 1.5 }}>
              {description}
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <AppButton variant="ghost" size="compact" onClick={onCancel} disabled={loading}>
            {cancelLabel}
          </AppButton>
          <AppButton variant={variant} size="compact" onClick={onConfirm} loading={loading}>
            {confirmLabel}
          </AppButton>
        </div>
      </div>
    </div>
  )
}
