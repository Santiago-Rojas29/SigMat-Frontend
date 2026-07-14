import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'

const TIPO_META = {
  dano:         { label: 'Daño',          color: '#ef4444' },
  perdida:      { label: 'Pérdida',       color: '#f59e0b' },
  mantenimiento:{ label: 'Mantenimiento', color: '#3b82f6' },
}

export function IncidenciasChart({ data, loading }) {
  const chartData = (data ?? []).map((d) => ({
    nombre: TIPO_META[d.tipo]?.label ?? d.tipo,
    total: d.total,
    color: TIPO_META[d.tipo]?.color ?? '#6b7280',
  }))

  return (
    <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: '20px 20px 12px' }}>
      <div style={{ marginBottom: 16 }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: '#111827', margin: 0 }}>Incidencias por tipo</h3>
        <p style={{ fontSize: 12, color: '#6b7280', margin: '2px 0 0' }}>Distribución de incidencias registradas</p>
      </div>
      {loading ? (
        <div style={{ height: 180, background: '#f9fafb', borderRadius: 8 }} />
      ) : chartData.length === 0 ? (
        <div style={{ height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', fontSize: 13 }}>
          Sin incidencias registradas
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={chartData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
            <XAxis dataKey="nombre" tick={{ fontSize: 12, fill: '#374151' }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} tickLine={false} axisLine={false} allowDecimals={false} />
            <Tooltip
              contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12 }}
              formatter={(v) => [v, 'Incidencias']}
              cursor={{ fill: 'rgba(0,0,0,0.04)' }}
            />
            <Bar dataKey="total" radius={[6, 6, 0, 0]} maxBarSize={60}>
              {chartData.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
