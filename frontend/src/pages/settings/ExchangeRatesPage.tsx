import { useEffect, useMemo, useState } from 'react'
import CustomMainBody from '../../components/common/CustomMainBody'
import CustomTable, { type CustomColumn } from '../../components/common/CustomTable'
import CustomModal from '../../components/common/CustomModal'
import { Button, Input } from '@heroui/react'
import { ratesService, type ExchangeRate, refreshExchangeRate } from '../../services/ratesService'
import { useDateFormatter } from '../../hooks/useDateFormatter'
import { toast } from 'react-toastify'

export default function ExchangeRatesPage() {
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [total, setTotal] = useState(0)
  const [items, setItems] = useState<ExchangeRate[]>([])
  const [open, setOpen] = useState(false)
  const [rate, setRate] = useState('')
  const [search, setSearch] = useState('')
  const { format } = useDateFormatter()

  const load = async () => {
    const res = await ratesService.list({ page, limit })
    setItems(res.items || [])
    setTotal(res.total || 0)
  }
  useEffect(()=>{ load() }, [page, limit])

  const columns: CustomColumn[] = useMemo(()=> [
    { uid: 'rate', name: 'Rate (UZS per 1 USD)', className: 'min-w-[200px]' },
    { uid: 'change', name: 'Change', className: 'min-w-[140px]' },
    { uid: 'start_at', name: 'Start', className: 'min-w-[180px]' },
    { uid: 'end_at', name: 'End', className: 'min-w-[180px]' },
  ], [])

  const rows = useMemo(()=> (items||[]).map((r, idx)=> {
    const prev = (items||[])[idx+1]
    const delta = prev ? (Number(r.rate||0) - Number(prev.rate||0)) : 0
    return { id: r.id, rate: r.rate, change: prev ? delta : '-', start_at: format(r.start_at, { withTime: true }), end_at: r.end_at ? format(r.end_at, { withTime: true }) : '—' }
  }), [items, format])

  const onCreate = async () => {
    const r = Math.round(Number(rate||0))
    if (!r || r <= 0) return toast.error('Enter a valid rate')
    try {
      await ratesService.create({ rate: r })
      toast.success('Rate added')
      setOpen(false)
      setRate('')
      load()
    } catch (e:any) {
      toast.error(e?.response?.data?.message || 'Failed to add rate')
    }
  }

  const handleAuto = async () => {
    try {
      const fetched = await refreshExchangeRate()
      setRate(String(Math.round(Number(fetched||0))))
      toast.success(`Auto fetched: ${Math.round(Number(fetched||0))}`)
    } catch { toast.error('Failed to fetch rate') }
  }

  const renderCell = (row:any, key:string) => {
    if (key === 'change') {
      if (row.change === '-' || row.change === null || row.change === undefined) return '-'
      const val = Number(row.change||0)
      const up = val > 0
      const down = val < 0
      const cls = up ? 'text-success-600' : down ? 'text-danger-600' : 'text-foreground/60'
      const arrow = up ? '▲' : down ? '▼' : '•'
      return <span className={cls}>{arrow} {Math.abs(val)}</span>
    }
    return row[key]
  }

  return (
    <CustomMainBody>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold">Exchange Rate History</h1>
      </div>

      <CustomTable
        columns={columns}
        items={rows as any}
        total={total}
        page={page}
        limit={limit}
        onPageChange={setPage}
        onLimitChange={setLimit}
        searchValue={search}
        onSearchChange={setSearch}
        renderCell={renderCell}
        rightAction={<Button color="primary" onPress={()=> setOpen(true)}>Add rate</Button>}
      />

      <CustomModal isOpen={open} onOpenChange={setOpen} title="Add Exchange Rate" onSubmit={onCreate} submitLabel="Save">
        <div className="grid grid-cols-1 gap-4">
          <Input label="Rate (UZS for 1 USD)" type="number" value={rate} onValueChange={setRate} variant="bordered" classNames={{ inputWrapper:'h-14' }} endContent={<Button size="sm" variant="flat" className="h-8 px-3" onPress={handleAuto}>Auto</Button>} />
        </div>
      </CustomModal>
    </CustomMainBody>
  )
} 