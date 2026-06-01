import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts'

const COLORS = [
  '#f59e0b','#ef4444','#8b5cf6','#3b82f6','#ec4899','#f97316','#06b6d4','#84cc16','#14b8a6','#a78bfa',
]

const CustomYAxisTick = ({ x, y, payload }) => {
  const label = payload.value.length > 20 ? payload.value.slice(0, 20) + '…' : payload.value
  return (
    <text x={x} y={y} dy={4} textAnchor="end" fill="#374151" fontSize={11}>
      {label}
    </text>
  )
}

export function MaterialesNoDevueltosChart({ data, loading }) {
  const total = (data ?? []).reduce((s, d) => s + d.total, 0)
  const chartData = (data ?? []).map((d) => ({ nombre: d.nombre, total: d.total }))

  return (
    <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: '20px 20px 12px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
        <div>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: '#111827', margin: 0 }}>Materiales no devueltos</h3>
          <p style={{ fontSize: 12, color: '#6b7280', margin: '2px 0 0' }}>Unidades actualmente en préstamo activo</p>
        </div>
        {!loading && total > 0 && (
          <div style={{
            background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)',
            borderRadius: 8, padding: '4px 12px', textAlign: 'center',
          }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#f59e0b', lineHeight: 1 }}>{total}</div>
            <div style={{ fontSize: 10, color: '#92400e', fontWeight: 600 }}>unidades</div>
          </div>
        )}
      </div>

      {loading ? (
        <div style={{ height: 220, background: '#f9fafb', borderRadius: 8 }} />
      ) : chartData.length === 0 ? (
        <div style={{ height: 220, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, color: '#9ca3af' }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#d1fae5" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
          </svg>
          <span style={{ fontSize: 13 }}>Todos los materiales están devueltos</span>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 0, right: 16, left: 0, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
            <XAxis
              type="number"
              tick={{ fontSize: 11, fill: '#6b7280' }}
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
            />
            <YAxis
              type="category"
              dataKey="nombre"
              width={148}
              tick={<CustomYAxisTick />}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12 }}
              formatter={(v) => [v, 'Unidades prestadas']}
              cursor={{ fill: 'rgba(0,0,0,0.04)' }}
            />
            <Bar dataKey="total" radius={[0, 6, 6, 0]} maxBarSize={18}>
              {chartData.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
