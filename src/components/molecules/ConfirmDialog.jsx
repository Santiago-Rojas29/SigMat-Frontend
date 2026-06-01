import { AppButton } from '../atoms/AppButton'
import { AppIcon }   from '../atoms/AppIcon'

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
            color: variant === 'danger' ? '#dc2626' : '#39A900',
          }}>
            <AppIcon name={variant === 'danger' ? 'trash' : 'warn'} size={20} />
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
