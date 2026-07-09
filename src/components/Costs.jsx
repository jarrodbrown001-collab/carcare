import { useMemo, useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import { CATEGORICAL, CHROME, useDarkMode, fmtMoney, fmtMoneyCents } from '../lib/palette'
import { serviceLabel } from '../lib/serviceTypes'
import { EmptyState } from './ui'
import { vehicleName } from './Vehicles'

function lastTwelveMonths() {
  const months = []
  const now = new Date()
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    months.push({
      key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
      label: d.toLocaleDateString('en-US', { month: 'short' }),
    })
  }
  return months
}

function ChartTooltip({ active, payload, label, dark }) {
  if (!active || !payload?.length) return null
  const chrome = CHROME[dark ? 'dark' : 'light']
  const total = payload.reduce((s, p) => s + (p.value || 0), 0)
  return (
    <div className="chart-tooltip" style={{ background: chrome.surface }}>
      <div className="chart-tooltip-title">{label}</div>
      {payload.filter((p) => p.value > 0).map((p) => (
        <div key={p.dataKey} className="chart-tooltip-row">
          <span className="legend-dot" style={{ background: p.fill }} />
          <span>{p.name}</span>
          <span className="chart-tooltip-val">{fmtMoney(p.value)}</span>
        </div>
      ))}
      {payload.length > 1 && (
        <div className="chart-tooltip-row chart-tooltip-total">
          <span>Total</span>
          <span className="chart-tooltip-val">{fmtMoney(total)}</span>
        </div>
      )}
    </div>
  )
}

export default function Costs({ data }) {
  const dark = useDarkMode()
  const mode = dark ? 'dark' : 'light'
  const chrome = CHROME[mode]
  const colors = CATEGORICAL[mode]
  const [vehicleFilter, setVehicleFilter] = useState('all')

  const { vehicles, services } = data
  const filtered = services.filter(
    (s) => (vehicleFilter === 'all' || s.vehicleId === vehicleFilter) && s.cost != null,
  )

  const months = useMemo(lastTwelveMonths, [])
  const monthKeys = new Set(months.map((m) => m.key))
  const inWindow = filtered.filter((s) => monthKeys.has(s.date.slice(0, 7)))

  // Vehicles that are part of the current view, in the order they were added —
  // color follows the vehicle, not its rank in the chart.
  const chartVehicles =
    vehicleFilter === 'all' ? vehicles : vehicles.filter((v) => v.id === vehicleFilter)
  const stacked = chartVehicles.length > 1

  const rows = months.map((m) => {
    const row = { label: m.label }
    for (const v of chartVehicles) row[v.id] = 0
    for (const s of inWindow) {
      if (s.date.slice(0, 7) === m.key && row[s.vehicleId] != null) row[s.vehicleId] += s.cost
    }
    return row
  })

  const total12 = inWindow.reduce((sum, s) => sum + s.cost, 0)
  const lifetime = filtered.reduce((sum, s) => sum + s.cost, 0)
  const diyCount = services.filter(
    (s) => (vehicleFilter === 'all' || s.vehicleId === vehicleFilter) && s.diy,
  ).length

  // Category breakdown over all time for the current filter
  const byCategory = useMemo(() => {
    const map = new Map()
    for (const s of filtered) map.set(s.type, (map.get(s.type) ?? 0) + s.cost)
    return [...map.entries()]
      .map(([type, total]) => ({ type, total }))
      .sort((a, b) => b.total - a.total)
  }, [filtered])
  const maxCategory = byCategory[0]?.total ?? 0

  if (services.filter((s) => s.cost != null).length === 0) {
    return (
      <div className="page">
        <h1>Costs</h1>
        <EmptyState
          icon="🧾"
          title="No costs logged yet"
          body="Add a cost when you log a service and this page will show your spending by month, by category, and by vehicle."
        />
      </div>
    )
  }

  return (
    <div className="page">
      <div className="page-head">
        <h1>Costs</h1>
        {vehicles.length > 1 && (
          <select
            className="filter-select"
            value={vehicleFilter}
            onChange={(e) => setVehicleFilter(e.target.value)}
            aria-label="Filter by vehicle"
          >
            <option value="all">All vehicles</option>
            {vehicles.map((v) => (
              <option key={v.id} value={v.id}>{vehicleName(v)}</option>
            ))}
          </select>
        )}
      </div>

      <div className="stat-row">
        <div className="stat-tile">
          <div className="stat-label">Last 12 months</div>
          <div className="stat-value">{fmtMoney(total12)}</div>
        </div>
        <div className="stat-tile">
          <div className="stat-label">Average / month</div>
          <div className="stat-value">{fmtMoney(total12 / 12)}</div>
        </div>
        <div className="stat-tile">
          <div className="stat-label">All time</div>
          <div className="stat-value">{fmtMoney(lifetime)}</div>
        </div>
        <div className="stat-tile">
          <div className="stat-label">DIY jobs</div>
          <div className="stat-value">{diyCount}</div>
        </div>
      </div>

      <section className="chart-card">
        <h2>Spending by month</h2>
        {stacked && (
          <div className="legend-row">
            {chartVehicles.map((v, i) => (
              <span key={v.id} className="legend-item">
                <span className="legend-dot" style={{ background: colors[i % colors.length] }} />
                {vehicleName(v)}
              </span>
            ))}
          </div>
        )}
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={rows} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke={chrome.grid} />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={{ stroke: chrome.axis }}
              tick={{ fill: chrome.muted, fontSize: 12 }}
            />
            <YAxis
              tickFormatter={(v) => fmtMoney(v)}
              tickLine={false}
              axisLine={false}
              width={56}
              tick={{ fill: chrome.muted, fontSize: 12 }}
            />
            <Tooltip
              content={<ChartTooltip dark={dark} />}
              cursor={{ fill: dark ? 'rgba(255,255,255,0.06)' : 'rgba(11,11,11,0.05)' }}
            />
            {chartVehicles.map((v, i) => (
              <Bar
                key={v.id}
                dataKey={v.id}
                name={vehicleName(v)}
                stackId="spend"
                fill={colors[i % colors.length]}
                stroke={chrome.surface}
                strokeWidth={stacked ? 1 : 0}
                radius={i === chartVehicles.length - 1 ? [4, 4, 0, 0] : 0}
                maxBarSize={40}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </section>

      <section className="chart-card">
        <h2>Spending by category <span className="muted">(all time)</span></h2>
        <ul className="bar-list">
          {byCategory.map((c) => (
            <li key={c.type} className="bar-list-row">
              <span className="bar-list-label">{serviceLabel(c.type)}</span>
              <span className="bar-list-track">
                <span
                  className="bar-list-fill"
                  style={{ width: `${maxCategory ? (c.total / maxCategory) * 100 : 0}%` }}
                />
              </span>
              <span className="bar-list-value">{fmtMoneyCents(c.total)}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
