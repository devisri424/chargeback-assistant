import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import client from '../api/client'

const STATUS_STYLES = {
  open: 'text-accent bg-accent/10 border-accent/30',
  won: 'text-low bg-low/10 border-low/30',
  lost: 'text-high bg-high/10 border-high/30',
  accepted: 'text-muted bg-muted/10 border-muted/30',
}

export default function Chargebacks() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const params = statusFilter ? { status_filter: statusFilter } : {}
        const res = await client.get('/chargebacks', { params })
        setItems(res.data)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [statusFilter])

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold">Chargebacks</h1>
          <p className="text-sm text-muted mt-0.5">All scored dispute cases.</p>
        </div>
        <div className="flex gap-1 bg-surface border border-border rounded-md p-1">
          {['', 'open', 'won', 'lost', 'accepted'].map((s) => (
            <button
              key={s || 'all'}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded text-xs capitalize transition-colors ${
                statusFilter === s ? 'bg-accent/15 text-accent' : 'text-muted hover:text-ink'
              }`}
            >
              {s || 'All'}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-surface border border-border rounded-lg shadow-panel overflow-hidden">
        {loading ? (
          <div className="text-sm text-muted py-10 text-center">Loading…</div>
        ) : items.length === 0 ? (
          <div className="text-sm text-muted py-10 text-center">No chargebacks found.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-xs text-muted uppercase tracking-wide">
                <th className="text-left px-5 py-3 font-medium">Transaction</th>
                <th className="text-left px-3 py-3 font-medium">Reason</th>
                <th className="text-left px-3 py-3 font-medium">Amount</th>
                <th className="text-left px-3 py-3 font-medium">Status</th>
                <th className="text-right px-5 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {items.map((cb) => (
                <tr key={cb.id} className="border-b border-border last:border-0 hover:bg-raised/50">
                  <td className="px-5 py-3">
                    <div className="font-mono text-xs">{cb.transaction_id}</div>
                    {cb.customer_id && (
                      <div className="text-xs text-muted mt-0.5">{cb.customer_id}</div>
                    )}
                  </td>
                  <td className="px-3 py-3 capitalize text-xs">
                    {cb.reason_code.replace(/_/g, ' ')}
                  </td>
                  <td className="px-3 py-3 font-mono">
                    {cb.currency} {cb.amount.toFixed(2)}
                  </td>
                  <td className="px-3 py-3">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-xs border capitalize ${STATUS_STYLES[cb.status]}`}
                    >
                      {cb.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <Link to={`/chargebacks/${cb.id}`} className="text-accent text-xs hover:underline">
                      View details →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
