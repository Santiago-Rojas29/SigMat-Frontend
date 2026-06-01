import './Spinner.css'

export function Spinner({ size = 32, color = '#39A900', trackColor = '#e5e7eb' }) {
  const thickness = Math.max(2, Math.round(size / 10))

  return (
    <div
      className="sigmat-spinner"
      style={{
        width: size,
        height: size,
        border: `${thickness}px solid ${trackColor}`,
        borderTopColor: color,
      }}
    />
  )
}
