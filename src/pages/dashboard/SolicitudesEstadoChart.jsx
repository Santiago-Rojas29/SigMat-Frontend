import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'

const ESTADO_META = {
  pendiente_instructor: { label: 'Pend. Instructor', color: '#f59e0b' },
  pendiente_admin:      { label: 'Pend. Admin',      color: '#3b82f6' },
  pendiente_bodega:     { label: 'Pend. Bodega',     color: '#8b5cf6' },
  aprobado:             { label: 'Aprobado',          color: '#10b981' },
  entregado:            { label: 'Entregado',         color: '#39A900' },
  rechazado:            { label: 'Rechazado',         color: '#ef4444' },
  cancelado:            { label: 'Cancelado',         color: '#9ca3af' },
}

const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
  if (percent < 0.05) return null
  const RADIAN = Math.PI / 180
  const r = innerRadius + (outerRadius - innerRadius) * 0.5
  const x = cx + r * Math.cos(-midAngle * RADIAN)
  const y = cy + r * Math.sin(-midAngle * RADIAN)
  return (
    <text x={x} y={y} fill="#fff" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={700}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  )
}

export function SolicitudesEstadoChart({ data, loading }) {
  const chartData = (data ?? []).map((d) => ({
    name: ESTADO_META[d.estado]?.label ?? d.estado,
    value: d.total,
    color: ESTADO_META[d.estado]?.color ?? '#6b7280',
  }))

  const total = chartData.reduce((s, d) => s + d.value, 0)

  return (
    <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: '20px 20px 16px' }}>
      <div style={{ marginBottom: 16 }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: '#111827', margin: 0 }}>Solicitudes por estado</h3>
        <p style={{ fontSize: 12, color: '#6b7280', margin: '2px 0 0' }}>{total} solicitudes en total</p>
      </div>
      {loading ? (
        <div style={{ height: 220, background: '#f9fafb', borderRadius: 8 }} />
      ) : chartData.length === 0 ? (
        <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', fontSize: 13 }}>
          Sin datos aún
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={85}
              dataKey="value"
              labelLine={false}
              label={renderCustomLabel}
            >
              {chartData.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value, name) => [value, name]}
              contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12 }}
            />
            <Legend
              iconType="circle"
              iconSize={8}
              formatter={(value) => <span style={{ fontSize: 11, color: '#374151' }}>{value}</span>}
            />
          </PieChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
