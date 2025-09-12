import React from 'react'

export type ViewRow = {
  label: string
  value: React.ReactNode
}

export default function CustomViewCard({ rows, title, className }: { rows: ViewRow[]; title?: string; className?: string }) {
  return (
    <div className={`rounded-none border border-foreground/10 bg-[var(--tss-modal-surface)] text-foreground shadow-sm ${className || ''}`}>
      {title ? (
        <div className="px-4 py-3 border-b border-foreground/10"><h3 className="text-base font-semibold">{title}</h3></div>
      ) : null}
      <div className="divide-y divide-foreground/10">
        {rows.map((row, idx) => (
          <div key={idx} className="px-4 py-2.5 grid grid-cols-3 gap-3 items-center">
            <div className="col-span-1 text-sm text-foreground/70">{row.label}</div>
            <div className="col-span-2 text-sm font-medium break-words">{row.value}</div>
          </div>
        ))}
      </div>
    </div>
  )
} 