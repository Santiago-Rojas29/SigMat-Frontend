import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts'

const COLORS = [
  '#39A900','#007832','#10b981','#3b82f6','#8b5cf6','#f59e0b','#ef4444','#6b7280',
]

const CustomYAxisTick = ({ x, y, payload }) => {
  const label = payload.value.length > 18 ? payload.value.slice(0, 18) + '…' : payload.value
  return (
    <text x={x} y={y} dy={4} textAnchor="end" fill="#374151" fontSize={11}>
      {label}
    </text>
  )
}

export function MaterialesChart({ data, loading }) {
  const chartData = (data ?? []).map((d) => ({ nombre: d.nombre, total: d.total }))

  return (
    <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: '20px 20px 12px' }}>
      <div style={{ marginBottom: 16 }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: '#111827', margin: 0 }}>Materiales más solicitados</h3>
        <p style={{ fontSize: 12, color: '#6b7280', margin: '2px 0 0' }}>Top 8 por número de solicitudes</p>
      </div>
      {loading ? (
        <div style={{ height: 260, background: '#f9fafb', borderRadius: 8 }} />
      ) : chartData.length === 0 ? (
        <div style={{ height: 260, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', fontSize: 13 }}>
          Sin solicitudes registradas
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={260}>
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
              width={140}
              tick={<CustomYAxisTick />}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12 }}
              formatter={(v) => [v, 'Solicitudes']}
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
