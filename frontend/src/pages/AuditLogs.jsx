import React, { useEffect, useState } from 'react'
import client from '../api/client'

export default function AuditLogs() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const res = await client.get('/audit')
        setLogs(res.data)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold">Audit log</h1>
        <p className="text-sm text-muted mt-0.5">
          Every prediction and status change, in order.
        </p>
      </div>

      <div className="bg-surface border border-border rounded-lg shadow-panel overflow-hidden">
        {loading ? (
          <div className="text-sm text-muted py-10 text-center">Loading…</div>
        ) : logs.length === 0 ? (
          <div className="text-sm text-muted py-10 text-center">No activity yet.</div>
        ) : (
          <div className="divide-y divide-border">
            {logs.map((log) => (
              <div key={log.id} className="px-5 py-3.5 flex items-start gap-4">
                <div className="text-xs font-mono text-muted whitespace-nowrap pt-0.5">
                  {new Date(log.created_at).toLocaleString()}
                </div>
                <div className="flex-1">
                  <span className="inline-block px-2 py-0.5 rounded text-xs bg-accent/10 text-accent border border-accent/20 mr-2 capitalize">
                    {log.action.replace(/_/g, ' ')}
                  </span>
                  <span className="text-sm text-ink/90">{log.details}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
