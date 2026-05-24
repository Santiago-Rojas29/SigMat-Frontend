import { SenaLogo } from '../atoms/SenaLogo'

export function HeroPanel() {
  return (
    <div style={{
      flex: 1,
      position: 'relative',
      overflow: 'hidden',
      background: `
        radial-gradient(ellipse at 15% 85%, rgba(148,192,32,0.25) 0%, transparent 55%),
        radial-gradient(ellipse at 85% 15%, rgba(57,169,0,0.2) 0%, transparent 50%),
        radial-gradient(ellipse at 60% 55%, rgba(0,100,40,0.3) 0%, transparent 45%),
        linear-gradient(145deg, #002810 0%, #004d20 30%, #007832 60%, #0a9e40 100%)
      `,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      padding: '48px 52px',
    }}>
      <div style={{ position: 'absolute', top: -80, right: -80, width: 320, height: 320, borderRadius: '50%', background: 'rgba(255,255,255,0.04)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: -60, left: -60, width: 260, height: 260, borderRadius: '50%', background: 'rgba(57,169,0,0.12)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', top: '40%', right: -40, width: 180, height: 180, borderRadius: '50%', background: 'rgba(148,192,32,0.08)', pointerEvents: 'none' }} />

      <div style={{ position: 'relative', zIndex: 1 }}>
        <SenaLogo white size="md" />
      </div>

      <div style={{ position: 'relative', zIndex: 1, flex: 1, display: 'flex', alignItems: 'center' }}>
        <div style={{
          background: 'rgba(255,255,255,0.07)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          border: '1px solid rgba(255,255,255,0.13)',
          borderRadius: 20,
          padding: '36px 40px',
          maxWidth: 400,
        }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: 'rgba(57,169,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="rgba(255,255,255,0.9)" strokeWidth="2" strokeLinejoin="round"/>
              <path d="M2 17L12 22L22 17" stroke="rgba(255,255,255,0.9)" strokeWidth="2" strokeLinejoin="round"/>
              <path d="M2 12L12 17L22 12" stroke="rgba(255,255,255,0.9)" strokeWidth="2" strokeLinejoin="round"/>
            </svg>
          </div>
          <h2 style={{ color: '#fff', fontWeight: 700, fontSize: 22, lineHeight: 1.3, marginBottom: 12, letterSpacing: '-0.4px' }}>
            Sistema de Gestión de<br />Materiales y Traslados
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, lineHeight: 1.65 }}>
            Plataforma centralizada para el control de inventarios, préstamos y traslados del SENA.
          </p>
        </div>
      </div>

      <div style={{ position: 'relative', zIndex: 1 }}>
        <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12 }}>© 2024 SENA · Todos los derechos reservados</p>
      </div>
    </div>
  )
}
