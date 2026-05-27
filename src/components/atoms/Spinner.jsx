export function Spinner({ size = 32, color = '#39A900', trackColor = '#e5e7eb' }) {
  const thickness = Math.max(2, Math.round(size / 10))

  return (
    <>
      <div style={{
        width: size,
        height: size,
        border: `${thickness}px solid ${trackColor}`,
        borderTopColor: color,
        borderRadius: '50%',
        animation: 'sigmat-spin 0.8s linear infinite',
        flexShrink: 0,
      }} />
      <style>{`@keyframes sigmat-spin { to { transform: rotate(360deg); } }`}</style>
    </>
  )
}
