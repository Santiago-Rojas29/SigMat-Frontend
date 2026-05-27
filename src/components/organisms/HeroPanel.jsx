import senaCampus from '../../assets/sena-campus.jpg'

export function HeroPanel() {
  return (
    <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
      <img
        src={senaCampus}
        alt="SENA Campus"
        style={{
          position: 'absolute', inset: 0,
          width: '100%', height: '100%',
          objectFit: 'cover', objectPosition: 'center',
        }}
      />
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(to bottom, rgba(57,169,0,0.15) 0%, rgba(0,60,20,0.45) 100%)',
      }} />
    </div>
  )
}
