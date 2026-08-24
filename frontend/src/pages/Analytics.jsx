import React, { useEffect, useState } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import client from '../api/client'
import StatCard from '../components/StatCard'

const RISK_COLORS = { Low: '#3FCB82', Medium: '#F0B23D', High: '#F0616F' }

export default function Analytics() {
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const res = await client.get('/analytics/summary')
        setSummary(res.data)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) return <div className="text-muted text-sm">Loading analytics…</div>
  if (!summary) return null

  const reasonData = Object.entries(summary.reason_code_distribution || {}).map(
    ([name, value]) => ({ name: name.replace(/_/g, ' '), value }),
  )
  const riskData = Object.entries(summary.risk_distribution || {}).map(([name, value]) => ({
    name,
    value,
  }))
  const statusData = Object.entries(summary.status_distribution || {}).map(([name, value]) => ({
    name,
    value,
  }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Analytics</h1>
        <p className="text-sm text-muted mt-0.5">Portfolio-level chargeback trends.</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Total cases" value={summary.total_chargebacks} />
        <StatCard
          label="Avg. win probability"
          value={
            summary.average_win_probability
              ? `${Math.round(summary.average_win_probability * 100)}%`
              : '—'
          }
          accentClass="text-accent"
        />
        <StatCard
          label="High risk share"
          value={
            summary.total_chargebacks
              ? `${Math.round((summary.risk_distribution.High / summary.total_chargebacks) * 100)}%`
              : '0%'
          }
          accentClass="text-high"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-surface border border-border rounded-lg p-5 shadow-panel">
          <div className="text-xs uppercase tracking-wide text-muted mb-4">
            Chargebacks by risk level
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={riskData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#28374A" vertical={false} />
              <XAxis dataKey="name" stroke="#8A98A9" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#8A98A9" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  background: '#1B2733',
                  border: '1px solid #28374A',
                  borderRadius: 8,
                  fontSize: 12,
                }}
                cursor={{ fill: 'rgba(255,255,255,0.03)' }}
              />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {riskData.map((entry) => (
                  <Cell key={entry.name} fill={RISK_COLORS[entry.name] || '#37D6C4'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-surface border border-border rounded-lg p-5 shadow-panel">
          <div className="text-xs uppercase tracking-wide text-muted mb-4">Case status</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={statusData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#28374A" vertical={false} />
              <XAxis dataKey="name" stroke="#8A98A9" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#8A98A9" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  background: '#1B2733',
                  border: '1px solid #28374A',
                  borderRadius: 8,
                  fontSize: 12,
                }}
                cursor={{ fill: 'rgba(255,255,255,0.03)' }}
              />
              <Bar dataKey="value" fill="#37D6C4" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-surface border border-border rounded-lg p-5 shadow-panel">
        <div className="text-xs uppercase tracking-wide text-muted mb-4">
          Chargebacks by reason code
        </div>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={reasonData} layout="vertical" margin={{ left: 24 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#28374A" horizontal={false} />
            <XAxis type="number" stroke="#8A98A9" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
            <YAxis
              type="category"
              dataKey="name"
              stroke="#8A98A9"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              width={140}
            />
            <Tooltip
              contentStyle={{
                background: '#1B2733',
                border: '1px solid #28374A',
                borderRadius: 8,
                fontSize: 12,
              }}
              cursor={{ fill: 'rgba(255,255,255,0.03)' }}
            />
            <Bar dataKey="value" fill="#37D6C4" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
