import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import client from '../api/client'
import StatCard from '../components/StatCard'
import RiskBadge from '../components/RiskBadge'

const RISK_COLORS = { Low: '#3FCB82', Medium: '#F0B23D', High: '#F0616F' }

export default function Dashboard() {
  const [summary, setSummary] = useState(null)
  const [recent, setRecent] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const [summaryRes, listRes] = await Promise.all([
          client.get('/analytics/summary'),
          client.get('/chargebacks', { params: { limit: 6 } }),
        ])
        setSummary(summaryRes.data)
        setRecent(listRes.data)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) {
    return <div className="text-muted text-sm">Loading dashboard…</div>
  }

  const riskData = summary
    ? Object.entries(summary.risk_distribution).map(([name, value]) => ({ name, value }))
    : []

  const total = summary?.total_chargebacks || 0
  const winRate = summary?.average_win_probability
    ? `${Math.round(summary.average_win_probability * 100)}%`
    : '—'

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Dashboard</h1>
          <p className="text-sm text-muted mt-0.5">
            Live view of chargeback risk across your dispute queue.
          </p>
        </div>
        <Link
          to="/new"
          className="bg-accent text-base text-sm font-medium px-4 py-2 rounded-md hover:opacity-90 transition-opacity"
        >
          + Score a case
        </Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total chargebacks" value={total} />
        <StatCard
          label="High risk"
          value={summary?.risk_distribution?.High || 0}
          accentClass="text-high"
        />
        <StatCard
          label="Medium risk"
          value={summary?.risk_distribution?.Medium || 0}
          accentClass="text-medium"
        />
        <StatCard label="Avg. win probability" value={winRate} accentClass="text-accent" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-1 bg-surface border border-border rounded-lg p-5 shadow-panel">
          <div className="text-xs uppercase tracking-wide text-muted mb-4">
            Risk distribution
          </div>
          {total === 0 ? (
            <div className="text-sm text-muted py-10 text-center">
              No cases scored yet.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={riskData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                >
                  {riskData.map((entry) => (
                    <Cell key={entry.name} fill={RISK_COLORS[entry.name]} stroke="none" />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: '#1B2733',
                    border: '1px solid #28374A',
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
          <div className="flex justify-center gap-4 mt-2">
            {riskData.map((r) => (
              <div key={r.name} className="flex items-center gap-1.5 text-xs text-muted">
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ background: RISK_COLORS[r.name] }}
                />
                {r.name} ({r.value})
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-2 bg-surface border border-border rounded-lg shadow-panel overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <div className="text-xs uppercase tracking-wide text-muted">Recent cases</div>
            <Link to="/chargebacks" className="text-xs text-accent hover:underline">
              View all →
            </Link>
          </div>
          {recent.length === 0 ? (
            <div className="text-sm text-muted py-10 text-center">
              Score your first chargeback to see it here.
            </div>
          ) : (
            <table className="w-full text-sm">
              <tbody>
                {recent.map((cb) => (
                  <tr
                    key={cb.id}
                    className="border-b border-border last:border-0 hover:bg-raised/50"
                  >
                    <td className="px-5 py-3 font-mono text-xs text-muted">
                      {cb.transaction_id}
                    </td>
                    <td className="px-3 py-3 text-xs">{cb.reason_code.replace(/_/g, ' ')}</td>
                    <td className="px-3 py-3 font-mono">${cb.amount.toFixed(2)}</td>
                    <td className="px-5 py-3 text-right">
                      <Link to={`/chargebacks/${cb.id}`} className="text-accent text-xs hover:underline">
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
