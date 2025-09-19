import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Tabs, Tab, Input, Button } from '@heroui/react'
import CustomMainBody from '../../components/common/CustomMainBody'
import CustomTable, { CustomColumn } from '../../components/common/CustomTable'
import ConfirmModal from '../../components/common/ConfirmModal'
import { ordersService } from '../../services/ordersService'
import { BanknotesIcon, ArrowPathIcon, CubeIcon } from '@heroicons/react/24/outline'

export default function OrderReturnsDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [order, setOrder] = useState<any>(null)
  const [items, setItems] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState<'products'|'details'>('products')

  // table state
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)

  const [confirm, setConfirm] = useState<{ open: boolean; action: 'approve'|'reject'|null }>({ open: false, action: null })

  useEffect(()=>{ (async()=>{ try{ setLoading(true); const data = await ordersService.get(String(id)); setOrder(data); setItems(Array.isArray(data?.items)? data.items:[]) } finally{ setLoading(false) } })() },[id])

  // debounced autosave for refund qty
  const [debounceKey, setDebounceKey] = useState(0)
  useEffect(()=>{
    if (!order || !id) return
    const t = setTimeout(async ()=>{
      try {
        const payload:any = { items: (items||[]).map((it:any)=> ({ product_id: it.product_id, product_name: it.product_name, product_sku: it.product_sku, quantity: Number(it.quantity||0), unit_price: Number(it.unit_price||0), supply_price: Number(it.supply_price||0), retail_price: Number(it.retail_price||0), unit: it.unit, returned_quantity: Number(it.returned_quantity||0) })) }
        await ordersService.update(String(id), payload)
      } catch {}
    }, 500)
    return ()=> clearTimeout(t)
  }, [debounceKey])

  // stats computed from refund quantities
  const stats = useMemo(()=>{
    const orderAmount = Number(order?.total_price || 0)
    const goodsCount = (items||[]).reduce((sum:number, it:any)=> sum + Number(it.returned_quantity||0), 0)
    const returnAmount = (items||[]).reduce((sum:number, it:any)=> sum + Number(it.unit_price||0) * Number(it.returned_quantity||0), 0)
    return { orderAmount, goodsCount, returnAmount }
  },[order,items])

  const columns: CustomColumn[] = useMemo(()=>[
    { uid:'name', name:'Name', className:'min-w-[240px]' },
    { uid:'sku', name:'SKU' },
    { uid:'qty', name:'Qty' },
    { uid:'refund', name:'Refund Qty' },
    { uid:'unit_price', name:'Unit price' },
    { uid:'total', name:'Total' },
  ],[])

  const filtered = useMemo(()=> (items||[]).filter((it:any)=>{
    if (!search.trim()) return true
    const s = search.toLowerCase()
    return String(it.product_name||'').toLowerCase().includes(s) || String(it.product_sku||'').toLowerCase().includes(s)
  }), [items, search])

  const tableItems = useMemo(()=> filtered.map((it:any, idx:number)=> ({
    id: idx+1,
    name: it.product_name,
    sku: it.product_sku,
    qty: it.quantity,
    refund: it.returned_quantity ?? 0,
    unit_price: it.unit_price || 0,
    total: Number(it.unit_price||0) * Number(it.returned_quantity||0),
    __raw: it,
  })), [filtered])

  const renderCell = (row:any, key:string) => {
    if (key==='refund') {
      if (order?.is_finished) return <span>{row.refund || 0}</span>
      const max = Number(row.__raw?.quantity||0)
      return (
        <Input size="sm" type="number" value={String(row.__raw?.returned_quantity ?? 0)} onValueChange={(v)=>{
          let n = parseInt(v||'0')
          if (isNaN(n)) n = 0
          if (n < 0) n = 0
          if (n > max) n = max
          setItems(prev => prev.map((p:any, i:number)=> i+1===row.id ? { ...p, returned_quantity: n } : p))
          setDebounceKey(k=>k+1)
        }} classNames={{ inputWrapper:'h-9' }} />
      )
    }
    if (key==='unit_price') return new Intl.NumberFormat('ru-RU').format(Number(row.unit_price||0)) + ' UZS'
    if (key==='total') return new Intl.NumberFormat('ru-RU').format(Number(row.total||0)) + ' UZS'
    return row[key]
  }

  const doAction = async (action:'approve'|'reject') => {
    if (!id) return
    const payload:any = (action==='approve') ? { action, items: (items||[]).map((it:any)=> ({ product_id: it.product_id, product_name: it.product_name, product_sku: it.product_sku, quantity: Number(it.quantity||0), unit_price: Number(it.unit_price||0), supply_price: Number(it.supply_price||0), retail_price: Number(it.retail_price||0), unit: it.unit, returned_quantity: Number(it.returned_quantity||0) })) } : { action }
    await ordersService.update(String(id), payload)
    const data = await ordersService.get(String(id))
    setOrder(data)
    setItems(Array.isArray(data?.items)? data.items:[])
    setConfirm({ open:false, action:null })
  }

  if (loading) return <CustomMainBody><div className="p-6">Loading...</div></CustomMainBody>
  if (!order) return <CustomMainBody><div className="p-6">Not found</div></CustomMainBody>

  return (
    <CustomMainBody>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold">{order.name}</h1>
          <div className="text-foreground/60 text-sm">Return • {order?.supplier?.name} • {order?.shop?.name}</div>
        </div>
        <div className="flex gap-2">
          {!order?.is_finished && (
            <>
              <Button color="danger" variant="bordered" onPress={()=> setConfirm({ open:true, action:'reject' })}>Reject</Button>
              <Button color="success" onPress={()=> setConfirm({ open:true, action:'approve' })}>Accept</Button>
            </>
          )}
          <Button variant="bordered" onPress={()=>navigate(-1)}>Back</Button>
        </div>
      </div>

      <Tabs aria-label="Order return tabs" color="primary" variant="bordered" selectedKey={activeTab} onSelectionChange={(k)=>setActiveTab(k as any)} className="w-full" classNames={{ tabList: 'w-full h-14', tab: 'h-12' }}>
        <Tab key="products" title={<div className="flex items-center space-x-2"><span>Products ({items?.length||0})</span></div>}> 
          <div className="mt-4">
            <CustomTable columns={columns} items={tableItems} total={tableItems.length} page={page} limit={limit} onPageChange={setPage} onLimitChange={setLimit} searchValue={search} onSearchChange={setSearch} onSearchClear={()=>setSearch('')} renderCell={renderCell} />
          </div>
        </Tab>
        <Tab key="details" title={<div className="flex items-center space-x-2"><span>Details</span></div>}>
          <div className="mt-4 space-y-8">
            <div className="border-t border-dashed border-gray-300" />
            <div className="space-y-4">
              <div className="text-lg font-semibold text-gray-900">Return summary</div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatCard icon={BanknotesIcon} title="Order amount" value={formatCurrency(stats.orderAmount)} />
                <div className="rounded-2xl bg-gray-900 border border-gray-700 p-5 flex items-center justify-between">
                  <div>
                    <div className="text-sm text-gray-200">Refund units</div>
                    <div className="mt-2 text-2xl font-semibold tracking-wide"><span className="text-blue-500">{stats.goodsCount}</span> <span className="text-gray-400 text-base ml-1">pcs</span></div>
                  </div>
                  <div className="h-11 w-11 rounded-full bg-gray-800 flex items-center justify-center"><CubeIcon className="h-6 w-6 text-blue-500" /></div>
                </div>
                <StatCard icon={ArrowPathIcon} title="Refund amount" value={formatCurrency(stats.returnAmount)} />
              </div>
            </div>
            <div className="border-t border-dashed border-gray-300" />
            <div className="space-y-8">
              <div className="text-lg font-semibold text-gray-900">Main</div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <InfoCard label="Supplier" value={order?.supplier?.name || '—'} />
                <InfoCard label="Store" value={order?.shop?.name || '—'} />
                <InfoCard label="Title" value={order?.name || '—'} />
                <InfoCard label="Return date" value={safeDate(order?.updated_at)} />
                <InfoCard label="User" value={order?.created_by?.name || '—'} />
                <InfoCard label="Order" value={<a className="text-primary underline" href={`/products/orders/${order?.returned_supplier_order_id || order?.id}`}>Order #{order?.external_id || order?.id?.slice(-6)}</a>} />
                <div className="md:col-span-3"><InfoCard label="Note" value={order?.comment || '—'} /></div>
              </div>
            </div>
          </div>
        </Tab>
      </Tabs>

      <ConfirmModal isOpen={confirm.open} title={confirm.action==='approve'?'Accept return':'Reject return'} description={confirm.action==='approve'?'Are you sure you want to accept this return?':'Are you sure you want to reject this return?'} onClose={()=> setConfirm({ open:false, action:null })} onConfirm={()=> confirm.action ? doAction(confirm.action) : null} confirmText={confirm.action==='approve'?'Accept':'Reject'} confirmColor={confirm.action==='approve'?'success':'danger'} />
    </CustomMainBody>
  )
}

function InfoCard({ label, value }: { label: string; value: any }) {
  return (
    <div>
      <div className="text-sm text-foreground/60 mb-1">{label}</div>
      <div className="rounded-xl bg-content2 text-foreground px-4 py-3 min-h-[42px]">{value ?? '—'}</div>
    </div>
  )
}

function formatCurrency(v:number){ return new Intl.NumberFormat('ru-RU').format(Number(v||0)) }
function safeDate(d?:string){ if(!d) return '—'; try{ return new Date(d).toLocaleString('ru-RU') } catch { return '—' } }

function StatCard({ icon: Icon, title, value }: { icon: any; title: string; value: string }) {
  return (
    <div className="rounded-2xl bg-gray-900 border border-gray-700 p-5 flex items-center justify-between">
      <div>
        <div className="text-sm text-gray-200">{title}</div>
        <div className="mt-2 text-2xl font-semibold tracking-wide"><span className="text-blue-500">{value}</span> <span className="text-gray-300 text-base ml-1">UZS</span></div>
      </div>
      <div className="h-11 w-11 rounded-full bg-gray-800 flex items-center justify-center"><Icon className="h-6 w-6 text-blue-500" /></div>
    </div>
  )
} 