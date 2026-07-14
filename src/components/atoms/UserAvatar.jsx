// 6 avatar preset designs. Each has a gradient + subtle decoration + initials.
export const AVATAR_PRESETS = [
  {
    id: 'esmeralda',
    label: 'Esmeralda',
    grad: ['#22c55e', '#15803d'],
    deco: (s) => (
      <g opacity="0.18">
        <circle cx={s * 0.75} cy={s * 0.25} r={s * 0.18} fill="#fff" />
        <circle cx={s * 0.25} cy={s * 0.72} r={s * 0.13} fill="#fff" />
        <circle cx={s * 0.82} cy={s * 0.7}  r={s * 0.08} fill="#fff" />
      </g>
    ),
  },
  {
    id: 'oceano',
    label: 'Océano',
    grad: ['#38bdf8', '#0369a1'],
    deco: (s) => (
      <g opacity="0.2" fill="none" stroke="#fff" strokeWidth={s * 0.025}>
        <path d={`M${s*0.1},${s*0.35} Q${s*0.3},${s*0.2} ${s*0.5},${s*0.35} Q${s*0.7},${s*0.5} ${s*0.9},${s*0.35}`} />
        <path d={`M${s*0.1},${s*0.55} Q${s*0.3},${s*0.4} ${s*0.5},${s*0.55} Q${s*0.7},${s*0.7} ${s*0.9},${s*0.55}`} />
        <path d={`M${s*0.1},${s*0.75} Q${s*0.3},${s*0.6} ${s*0.5},${s*0.75} Q${s*0.7},${s*0.9} ${s*0.9},${s*0.75}`} />
      </g>
    ),
  },
  {
    id: 'aurora',
    label: 'Aurora',
    grad: ['#c084fc', '#7e22ce'],
    deco: (s) => {
      const cx = s / 2, cy = s / 2, r = s * 0.38
      const pts = Array.from({ length: 6 }, (_, i) => {
        const a = (i * 60 - 30) * Math.PI / 180
        return `${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`
      })
      return (
        <g opacity="0.18">
          <polygon points={pts.join(' ')} fill="none" stroke="#fff" strokeWidth={s * 0.025} />
          <polygon points={Array.from({ length: 6 }, (_, i) => {
            const a = (i * 60) * Math.PI / 180
            return `${cx + r*0.55 * Math.cos(a)},${cy + r*0.55 * Math.sin(a)}`
          }).join(' ')} fill="none" stroke="#fff" strokeWidth={s * 0.018} />
        </g>
      )
    },
  },
  {
    id: 'indigo',
    label: 'Índigo',
    grad: ['#818cf8', '#3730a3'],
    deco: (s) => (
      <g opacity="0.2" stroke="#fff" fill="none" strokeWidth={s * 0.022}>
        <rect x={s*0.18} y={s*0.18} width={s*0.64} height={s*0.64} rx={s*0.06} />
        <rect x={s*0.3}  y={s*0.3}  width={s*0.4}  height={s*0.4}  rx={s*0.04} />
      </g>
    ),
  },
  {
    id: 'solar',
    label: 'Solar',
    grad: ['#fb923c', '#c2410c'],
    deco: (s) => {
      const cx = s / 2, cy = s / 2
      const rays = Array.from({ length: 8 }, (_, i) => {
        const a = (i * 45) * Math.PI / 180
        const r1 = s * 0.3, r2 = s * 0.44
        return `M${cx + r1*Math.cos(a)},${cy + r1*Math.sin(a)} L${cx + r2*Math.cos(a)},${cy + r2*Math.sin(a)}`
      })
      return (
        <g opacity="0.22" stroke="#fff" strokeWidth={s * 0.025} strokeLinecap="round">
          {rays.map((d, i) => <path key={i} d={d} />)}
        </g>
      )
    },
  },
  {
    id: 'coral',
    label: 'Coral',
    grad: ['#f472b6', '#9d174d'],
    deco: (s) => {
      const cx = s / 2, cy = s / 2
      const stars = [[0.72, 0.28, 0.06], [0.22, 0.68, 0.04], [0.78, 0.72, 0.03]]
      return (
        <g opacity="0.22" fill="#fff">
          {stars.map(([rx, ry, r], i) => (
            <g key={i} transform={`translate(${s*rx},${s*ry})`}>
              {[0,72,144,216,288].map((a, j) => (
                <line key={j}
                  x1="0" y1="0"
                  x2={s*r*Math.cos(a*Math.PI/180)}
                  y2={s*r*Math.sin(a*Math.PI/180)}
                  stroke="#fff" strokeWidth={s*0.018} strokeLinecap="round"
                />
              ))}
              <circle r={s*r*0.3} fill="#fff" />
            </g>
          ))}
          <circle cx={cx} cy={s*0.16} r={s*0.04} />
          <circle cx={s*0.16} cy={cy} r={s*0.03} />
        </g>
      )
    },
  },
]

const AVATAR_KEY = (userId) => `sigmat_avatar_${userId}`

export function getAvatarId(userId) {
  return localStorage.getItem(AVATAR_KEY(userId)) ?? 'esmeralda'
}

export function setAvatarId(userId, id) {
  localStorage.setItem(AVATAR_KEY(userId), id)
}

export function UserAvatar({ userId, initials, size = 28, avatarId, rolColor, style = {} }) {
  const id = avatarId ?? (userId ? getAvatarId(userId) : 'esmeralda')
  const preset = AVATAR_PRESETS.find(p => p.id === id) ?? AVATAR_PRESETS[0]
  const [c1, c2] = preset.grad
  const gradId = `avgrad_${id}_${size}`

  return (
    <svg
      width={size} height={size} viewBox={`0 0 ${size} ${size}`}
      style={{ borderRadius: '50%', flexShrink: 0, display: 'block', ...style }}
    >
      <defs>
        <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={c1} />
          <stop offset="100%" stopColor={c2} />
        </linearGradient>
        <clipPath id={`clip_${gradId}`}>
          <circle cx={size/2} cy={size/2} r={size/2} />
        </clipPath>
      </defs>
      <g clipPath={`url(#clip_${gradId})`}>
        <rect width={size} height={size} fill={`url(#${gradId})`} />
        {preset.deco(size)}
      </g>
      <text
        x={size / 2} y={size / 2}
        textAnchor="middle" dominantBaseline="central"
        fontSize={size * 0.36} fontWeight="700" fill="#fff"
        fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
        style={{ letterSpacing: '0.03em' }}
      >
        {initials}
      </text>
      {rolColor && (
        <circle
          cx={size - size * 0.18} cy={size - size * 0.18}
          r={size * 0.14}
          fill={rolColor}
          stroke="#fff"
          strokeWidth={size * 0.06}
        />
      )}
    </svg>
  )
}
