import { useState, useEffect } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts'
import api from '../../services/api'

const MESES_CORTO = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']
const MESES_LARGO = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

const CURRENT_YEAR  = new Date().getFullYear()
const CURRENT_MONTH = new Date().getMonth() + 1
const YEARS = [CURRENT_YEAR - 2, CURRENT_YEAR - 1, CURRENT_YEAR]

const SELECT_STYLE = {
  fontSize: 12, fontWeight: 600, color: '#374151',
  border: '1px solid #e5e7eb', borderRadius: 8,
  padding: '5px 8px', background: '#fff', cursor: 'pointer',
  outline: 'none',
}

export function SolicitudesMesChart() {
  const [anio,    setAnio]    = useState(CURRENT_YEAR)
  const [mes,     setMes]     = useState(0)           // 0 = todos los meses
  const [data,    setData]    = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    const url = mes === 0
      ? `/dashboard/solicitudes-mes?anio=${anio}`
      : `/dashboard/solicitudes-dia?anio=${anio}&mes=${mes}`
    api.get(url)
      .then(({ data: rows }) => setData(rows))
      .catch(() => setData([]))
      .finally(() => setLoading(false))
  }, [anio, mes])

  const isDayView  = mes !== 0
  const chartData  = isDayView
    ? (data ?? []).map((d) => ({ label: String(d.dia), total: d.total }))
    : (data ?? []).map((d) => ({ label: MESES_CORTO[d.mes - 1], total: d.total }))
  const totalPeriodo = chartData.reduce((s, d) => s + d.total, 0)

  const title    = isDayView ? `Solicitudes por día` : 'Solicitudes por mes'
  const subtitle = loading
    ? '…'
    : isDayView
      ? `${totalPeriodo} solicitudes — ${MESES_LARGO[mes - 1]} ${anio}`
      : `${totalPeriodo} solicitudes en ${anio}`

  return (
    <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: '20px 20px 12px' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16, gap: 12 }}>
        <div>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: '#111827', margin: 0 }}>{title}</h3>
          <p style={{ fontSize: 12, color: '#6b7280', margin: '2px 0 0' }}>{subtitle}</p>
        </div>

        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
          {/* Año */}
          <select value={anio} onChange={(e) => setAnio(Number(e.target.value))} style={SELECT_STYLE}>
            {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>

          {/* Mes */}
          <select value={mes} onChange={(e) => setMes(Number(e.target.value))} style={SELECT_STYLE}>
            <option value={0}>Todos</option>
            {MESES_LARGO.map((m, i) => (
              <option key={i + 1} value={i + 1}>{m}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Chart */}
      {loading ? (
        <div style={{ height: 200, background: '#f9fafb', borderRadius: 8 }} />
      ) : totalPeriodo === 0 ? (
        <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', fontSize: 13 }}>
          Sin solicitudes en {isDayView ? `${MESES_LARGO[mes - 1]} ${anio}` : String(anio)}
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={chartData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 10, fill: '#6b7280' }}
              tickLine={false}
              axisLine={false}
              interval={isDayView ? 4 : 0}
            />
            <YAxis
              tick={{ fontSize: 11, fill: '#6b7280' }}
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
            />
            <Tooltip
              contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12 }}
              formatter={(v) => [v, 'Solicitudes']}
              labelFormatter={(label) =>
                isDayView
                  ? `${MESES_LARGO[mes - 1]} ${label}`
                  : label
              }
              cursor={{ fill: 'rgba(57,169,0,0.06)' }}
            />
            <Bar dataKey="total" radius={[4, 4, 0, 0]} maxBarSize={isDayView ? 16 : 36}>
              {chartData.map((entry, i) => (
                <Cell
                  key={i}
                  fill={entry.total === 0 ? '#f3f4f6' : '#39A900'}
                  fillOpacity={entry.total === 0 ? 0.4 : 1}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
