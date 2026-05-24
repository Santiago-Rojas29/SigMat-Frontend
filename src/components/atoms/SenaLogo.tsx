interface SenaLogoProps {
  white?: boolean
  size?: 'sm' | 'md' | 'lg'
}

const sizes = { sm: { icon: 28, text: 14 }, md: { icon: 36, text: 17 }, lg: { icon: 44, text: 20 } }

export function SenaLogo({ white = false, size = 'md' }: SenaLogoProps) {
  const s = sizes[size]
  const color = white ? '#fff' : '#007832'
  const accent = white ? 'rgba(255,255,255,0.65)' : '#39A900'

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, userSelect: 'none' }}>
      <svg width={s.icon} height={s.icon} viewBox="0 0 36 36" fill="none">
        <rect width="36" height="36" rx="9" fill={white ? 'rgba(255,255,255,0.15)' : '#39A900'} />
        <path
          d="M11 13.5C11 11.567 12.567 10 14.5 10H18C20.209 10 22 11.791 22 14C22 16.209 20.209 18 18 18H14.5C12.567 18 11 19.567 11 21.5C11 23.433 12.567 25 14.5 25H22"
          stroke="white"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      </svg>
      <div style={{ lineHeight: 1.1 }}>
        <div style={{ fontWeight: 700, fontSize: s.text, color, letterSpacing: '-0.3px' }}>
          SENA
        </div>
        <div style={{ fontWeight: 400, fontSize: s.text - 3, color: accent, letterSpacing: '0.5px' }}>
          SIGMAT
        </div>
      </div>
    </div>
  )
}
