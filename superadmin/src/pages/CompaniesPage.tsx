import { useEffect, useMemo, useState } from 'react'
import CustomMainBody from '../components/common/CustomMainBody'
import CustomTable, { type CustomColumn } from '../components/common/CustomTable'
import { apiClient } from '../services/base/apiClient'

export default function CompaniesPage() {
  const [items, setItems] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const res = await apiClient.get(`/api/tenants`, { params: { page, limit, search } })
      const data = res.data?.data
      setItems((data?.items || data) || [])
      setTotal(data?.total || (data?.items ? data.items.length : 0))
    } finally { setLoading(false) }
  }
  useEffect(()=>{ load() }, [page, limit, search])

  const columns: CustomColumn[] = [
    { uid: 'subdomain', name: 'Subdomain' },
    { uid: 'company', name: 'Company' },
    { uid: 'email', name: 'Email' },
    { uid: 'plan', name: 'Plan' },
    { uid: 'status', name: 'Status' },
  ]

  const rows = useMemo(()=> (items||[]).map((t:any) => ({
    id: t.id || t._id,
    subdomain: t.subdomain,
    company: t.company_name || t.companyName,
    email: t.email,
    plan: t.plan || '-',
    status: t.status || '-',
  })), [items])

  const renderCell = (item:any, key:string) => item[key]

  return (
    <CustomMainBody>
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-xl font-semibold">Companies</h1>
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