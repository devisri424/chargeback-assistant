import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import client from '../api/client'
import RiskBadge from '../components/RiskBadge'

const STATUS_OPTIONS = ['open', 'won', 'lost', 'accepted']

export default function ChargebackDetail() {
  const { id } = useParams()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)

  async function load() {
    setLoading(true)
    try {
      const res = await client.get(`/chargebacks/${id}`)
      setData(res.data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  async function handleStatusChange(newStatus) {
    setUpdating(true)
    try {
      await client.patch(`/chargebacks/${id}/status`, null, {
        params: { new_status: newStatus },
      })
      await load()
    } finally {
      setUpdating(false)
    }
  }

  if (loading) return <div className="text-muted text-sm">Loading case…</div>
  if (!data) return <div className="text-muted text-sm">Case not found.</div>

  const p = data.prediction

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs text-muted font-mono mb-1">{data.transaction_id}</div>
          <h1 className="text-xl font-semibold">
            {data.currency} {data.amount.toFixed(2)}{' '}
            <span className="text-muted font-normal text-base capitalize">
              · {data.reason_code.replace(/_/g, ' ')}
            </span>
          </h1>
        </div>
        {p && <RiskBadge level={p.risk_level} />}
      </div>

      {p ? (
        <>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-surface border border-border rounded-lg p-5 shadow-panel">
              <div className="text-xs uppercase tracking-wide text-muted mb-2">
                Win probability
              </div>
              <div className="text-3xl font-mono font-semibold text-accent">
                {Math.round(p.win_probability * 100)}%
              </div>
              <div className="w-full h-1.5 bg-raised rounded-full mt-3 overflow-hidden">
                <div
                  className="h-full bg-accent rounded-full"
                  style={{ width: `${Math.round(p.win_probability * 100)}%` }}
                />
              </div>
            </div>
            <div className="col-span-2 bg-surface border border-border rounded-lg p-5 shadow-panel">
              <div className="text-xs uppercase tracking-wide text-muted mb-2">
                Recommendation
              </div>
              <div className="text-sm leading-relaxed">{p.recommendation}</div>
            </div>
          </div>

          <div className="bg-surface border border-border rounded-lg p-5 shadow-panel">
            <div className="text-xs uppercase tracking-wide text-muted mb-4">
              Why — top factors (SHAP)
            </div>
            <div className="space-y-2">
              {p.top_factors.map((f, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between text-sm bg-base border border-border rounded-md px-3 py-2.5"
                >
                  <div className="flex items-center gap-2">
                    <span className={f.impact > 0 ? 'text-low' : 'text-high'}>
                      {f.impact > 0 ? '✓' : '✗'}
                    </span>
                    {f.feature}
                  </div>
                  <div className="text-xs text-muted font-mono">
                    {f.impact > 0 ? '+' : ''}
                    {f.impact.toFixed(3)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-surface border border-border rounded-lg p-5 shadow-panel">
            <div className="text-xs uppercase tracking-wide text-muted mb-4">
              Agent investigation trace
            </div>
            <ul className="space-y-2">
              {p.agent_reasoning.findings?.map((f, i) => (
                <li key={i} className="text-sm text-ink/90 flex gap-2">
                  <span className="text-accent">›</span>
                  {f}
                </li>
              ))}
            </ul>
          </div>
        </>
      ) : (
        <div className="text-sm text-muted bg-surface border border-border rounded-lg p-5">
          No prediction on file for this case yet.
        </div>
      )}

      <div className="bg-surface border border-border rounded-lg p-5 shadow-panel">
        <div className="text-xs uppercase tracking-wide text-muted mb-3">Case status</div>
        <div className="flex gap-2">
          {STATUS_OPTIONS.map((s) => (
            <button
              key={s}
              disabled={updating}
              onClick={() => handleStatusChange(s)}
              className={`px-3 py-1.5 rounded-md text-xs capitalize border transition-colors disabled:opacity-50 ${
                data.status === s
                  ? 'bg-accent/15 text-accent border-accent/30'
                  : 'text-muted border-border hover:text-ink hover:bg-raised'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
