import React from 'react'

export default function StatCard({ label, value, sublabel, accentClass = 'text-ink' }) {
  return (
    <div className="bg-surface border border-border rounded-lg p-5 shadow-panel">
      <div className="text-xs uppercase tracking-wide text-muted mb-2">{label}</div>
      <div className={`text-3xl font-mono font-semibold ${accentClass}`}>{value}</div>
      {sublabel && <div className="text-xs text-muted mt-1">{sublabel}</div>}
    </div>
  )
}
