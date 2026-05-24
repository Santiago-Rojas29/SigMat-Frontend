import { HeroPanel } from '../organisms/HeroPanel'

export function AuthLayout({ children }) {
  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: '#fff' }}>
      <div style={{
        width: '45%', minWidth: 400,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '48px 56px', background: '#fff', overflowY: 'auto', position: 'relative',
      }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'linear-gradient(90deg, #39A900, #94C020)' }} />
        {children}
      </div>
      <div style={{ flex: 1, display: 'flex' }} className="d-none d-lg-flex">
        <HeroPanel />
      </div>
    </div>
  )
}
