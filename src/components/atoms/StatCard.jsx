export function StatCard({ label, count, color, bg, border, icon, active, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: '1 1 120px', minWidth: 110,
        display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
        gap: 10, padding: '14px 16px', borderRadius: 12, cursor: 'pointer',
        border: `1.5px solid ${active ? color : border}`,
        background: active ? color : bg,
        transition: 'all 0.18s',
        textAlign: 'left',
      }}
    >
      {icon && (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
          stroke={active ? '#fff' : color} strokeWidth="1.8"
          strokeLinecap="round" strokeLinejoin="round">
          {icon}
        </svg>
      )}
      <div>
        <div style={{ fontSize: 22, fontWeight: 700, color: active ? '#fff' : '#111827', lineHeight: 1 }}>
          {count}
        </div>
        <div style={{ fontSize: 11.5, color: active ? 'rgba(255,255,255,0.85)' : '#6b7280', marginTop: 3 }}>
          {label}
        </div>
      </div>
    </button>
  )
}
