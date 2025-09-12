import { useEffect, useMemo, useState } from 'react'
import { apiClient } from '../services/base/apiClient'
import { Card } from '@heroui/react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

export default function StatsPage() {
  const [summary, setSummary] = useState<any>(null)
  const [monthly, setMonthly] = useState<any[]>([])

  useEffect(()=>{
    const load = async () => {
      const [s, m] = await Promise.all([
        apiClient.get('/api/stats/summary'),
        apiClient.get('/api/stats/monthly', { params: { months: 12 } }),
      ])
      setSummary(s.data?.data)
      setMonthly((m.data?.data || []).map((x: any)=> ({ month: x.month, amount: x.amount })))
    }
    load()
  }, [])

  const kpi = useMemo(()=> [
    { label: 'Active Tenants', value: summary?.active_tenants ?? '—' },
    { label: 'Users', value: summary?.users ?? '—' },
    { label: 'Revenue', value: (summary?.revenue ?? 0).toLocaleString(undefined, { style: 'currency', currency: 'USD' }) },
    { label: 'ARPU', value: (summary?.arpu ?? 0).toLocaleString(undefined, { style: 'currency', currency: 'USD' }) },
  ], [summary])

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">Statistics</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpi.map((it)=> (
          <Card key={it.label} className="p-4">
            <div className="text-default-500 text-sm">{it.label}</div>
            <div className="text-2xl font-semibold">{it.value}</div>
          </Card>
        ))}
      </div>

      <Card className="p-4">
        <div className="text-default-500 text-sm mb-4">Monthly revenue</div>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={monthly} margin={{ left: 12, right: 12, top: 12, bottom: 0 }}>
              <defs>
                <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.5}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis dataKey="month"/>
              <YAxis/>
              <Tooltip/>
              <Area type="monotone" dataKey="amount" stroke="#3b82f6" fillOpacity={1} fill="url(#rev)"/>
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  )
} 