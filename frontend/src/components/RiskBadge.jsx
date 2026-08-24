import React from 'react'

const STYLES = {
  Low: 'bg-low/10 text-low border-low/30',
  Medium: 'bg-medium/10 text-medium border-medium/30',
  High: 'bg-high/10 text-high border-high/30',
}

export default function RiskBadge({ level }) {
  const style = STYLES[level] || 'bg-muted/10 text-muted border-muted/30'
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${style}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {level} risk
    </span>
  )
}
