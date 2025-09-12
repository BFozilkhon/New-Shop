import { useEffect, useMemo, useState } from 'react'
import CustomMainBody from '../components/common/CustomMainBody'
import CustomTable, { type CustomColumn } from '../components/common/CustomTable'
import { apiClient } from '../services/base/apiClient'
// import { format } from 'date-fns'

export default function BillingPage(){
  const [items, setItems] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const res = await apiClient.get(`/api/billing/payments`, { params: { page, limit, search } })
      const data = res.data?.data
      const list = (data?.items || data) || []
      setItems(list)
      setTotal(data?.total || list.length)
    } finally { setLoading(false) }
  }
  useEffect(()=>{ load() }, [page, limit, search])

  const columns: CustomColumn[] = [
    { uid: 'created_at', name: 'Date' },
    { uid: 'tenant_id', name: 'Tenant' },
    { uid: 'amount', name: 'Amount' },
    { uid: 'method', name: 'Method' },
    { uid: 'status', name: 'Status' },
    { uid: 'period', name: 'Period' },
    { uid: 'note', name: 'Note' },
  ]

  const rows = useMemo(()=> (items||[]).map((p: any)=> ({
    id: p.id || p._id,
    // created_at: p.created_at ? format(new Date(p.created_at), 'yyyy-MM-dd') : '-',
    tenant_id: (p.tenant_id || '').toString().slice(-6),
    amount: Intl.NumberFormat('en-US', { style: 'currency', currency: p.currency || 'USD' }).format(p.amount || 0),
    method: p.method || '-',
    status: p.status || '-',
    period: p.period || '-',
    note: p.note || '-',
  })), [items])

  const renderCell = (item: any, key: string) => item[key]

  return (
    <CustomMainBody>
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-xl font-semibold">Billing</h1>
      </div>
      <CustomTable
        columns={columns}
        items={rows}
        total={total}
        page={page}
        limit={limit}
        onPageChange={setPage}
        onLimitChange={setLimit}
        searchValue={search}
        onSearchChange={setSearch}
        onSearchClear={()=> setSearch('')}
        renderCell={renderCell}
        isLoading={loading}
      />
    </CustomMainBody>
  )
} 