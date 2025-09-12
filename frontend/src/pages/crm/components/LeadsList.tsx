import React from 'react'

export default function LeadsList({ leads = [] }: { leads?: any[] }) {
  return (
    <div className="rounded-lg border overflow-hidden">
      <table className="min-w-full">
        <thead>
          <tr className="text-left">
            <th className="p-3"><input type="checkbox" /></th>
            <th className="p-3">Title</th>
            <th className="p-3">Company</th>
            <th className="p-3">Value</th>
            <th className="p-3">Status</th>
            <th className="p-3">Owner</th>
          </tr>
        </thead>
        <tbody>
          {(leads||[]).map((l:any) => (
            <tr key={l.id} className="border-t">
              <td className="p-3"><input type="checkbox" /></td>
              <td className="p-3">{l.title}</td>
              <td className="p-3">{l.company}</td>
              <td className="p-3">{l.value}</td>
              <td className="p-3">{l.status}</td>
              <td className="p-3">{l.owner_name || '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
} 