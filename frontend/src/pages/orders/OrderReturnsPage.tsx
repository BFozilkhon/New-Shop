import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Input, Select, SelectItem, Button, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from '@heroui/react'
import CustomMainBody from '../../components/common/CustomMainBody'
import CustomTable from '../../components/common/CustomTable'
import CustomModal from '../../components/common/CustomModal'
import { ordersService, type Order } from '../../services/ordersService'
import { usePreferences } from '../../store/prefs'
import useCurrency from '../../hooks/useCurrency'
import MoneyAt from '../../components/common/MoneyAt'

export default function OrderReturnsPage() {
  const navigate = useNavigate()

  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [items, setItems] = useState<Order[]>([])
  const [search, setSearch] = useState('')

  const [isOpen, setIsOpen] = useState(false)
  const [shops, setShops] = useState<{ id: string; name: string }[]>([])
  const [suppliers, setSuppliers] = useState<{ id: string; name: string }[]>([])
  const { prefs } = usePreferences()
  const { format: fmt } = useCurrency()

  useEffect(() => {
    ordersService.getShops().then(setShops).catch(() => setShops([]))
    ordersService.getSuppliers().then(setSuppliers).catch(() => setSuppliers([]))
  }, [])

  const load = async () => {
    setLoading(true)
    try {
      const res = await ordersService.list({ page, limit, type: 'return_order', search })
      setItems(res.items || [])
      setTotal(res.total || 0)
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => { load() }, [page, limit, search])

  const tableItems = useMemo(() => (items || []).map((o) => {
    const refundQty = (o.items || []).reduce((sum:number, it:any)=> sum + Number((it as any).returned_quantity||0), 0)
    const refundMoney = (o.items || []).reduce((sum:number, it:any)=> sum + Number((it as any).returned_quantity||0) * Number((it as any).unit_price||0), 0)
    return {
      id: o.id,
      external_id: o.external_id || 0,
      name: o.name,
      shop: o.shop?.name || '-',
      supplier: o.supplier?.name || '-',
      status: (o.is_finished ? (String(o.status_id).toLowerCase()==='accepted'?'Accepted':'Rejected') : 'In Progress'),
      refund_money: refundMoney,
      refund_qty: refundQty,
      created_at: new Date(o.created_at).toLocaleString(),
      created_by: o.created_by?.name || '-',
    }
  }), [items])

  return (
    <CustomMainBody>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold">Order returns</h1>
        <Button color="primary" onPress={() => setIsOpen(true)}>New order return</Button>
      </div>

      <CustomTable
        columns={[
          { uid: 'external_id', name: 'ID' },
          { uid: 'name', name: 'Name' },
          { uid: 'shop', name: 'Store' },
          { uid: 'supplier', name: 'Supplier' },
          { uid: 'status', name: 'Status' },
          { uid: 'refund_money', name: 'Reback Money' },
          { uid: 'refund_qty', name: 'Reback Quantity' },
          { uid: 'created_at', name: 'Creation Date' },
          { uid: 'created_by', name: 'Created By' },
        ]}
        items={tableItems as any}
        total={total}
        page={page}
        limit={limit}
        onPageChange={setPage}
        onLimitChange={setLimit}
        searchValue={search}
        onSearchChange={setSearch}
        renderCell={(item: any, key: string) => {
          if (key === 'name') return <button className="text-primary underline-offset-2 hover:underline" onClick={() => navigate(`/products/orders/${item.id}`)}>{item.name}</button>
          if (key === 'status') {
            if (item.status === 'Accepted') return <span className="inline-flex px-2 py-1 rounded-full text-xs bg-success/20 text-success">Accepted</span>
            if (item.status === 'Rejected') return <span className="inline-flex px-2 py-1 rounded-full text-xs bg-danger/20 text-danger">Rejected</span>
            return <span className="inline-flex px-2 py-1 rounded-full text-xs bg-warning/20 text-warning">In progress</span>
          }
          if (key === 'refund_money') return <MoneyAt amount={Number(item.refund_money || 0)} date={item.created_at} />
          if (key === 'refund_qty') return `${item.refund_qty} pcs`
          return item[key]
        }}
      />

      <CreateReturnModal isOpen={isOpen} onOpenChange={setIsOpen} shops={shops} suppliers={suppliers} onCreated={() => { setIsOpen(false); load() }} />
    </CustomMainBody>
  )
}

function CreateReturnModal({ isOpen, onOpenChange, shops, suppliers, onCreated }: { isOpen: boolean; onOpenChange: (v: boolean) => void; shops: { id: string; name: string }[]; suppliers: { id: string; name: string }[]; onCreated: () => void }) {
  const [step, setStep] = useState<1 | 2>(1)
  const [saving, setSaving] = useState(false)

  // Step 1
  const [supplierId, setSupplierId] = useState('')
  const [shopId, setShopId] = useState('')
  const [name, setName] = useState(`Refund ${new Date().toISOString().slice(0, 16).replace('T', ' ')}`)
  const [comment, setComment] = useState('')
  const { prefs } = usePreferences()
  const { format: fmt } = useCurrency()

  // Step 2
  const [searchOrder, setSearchOrder] = useState('')
  const [orders, setOrders] = useState<Order[]>([])
  const [selectedOrderId, setSelectedOrderId] = useState('')

  useEffect(() => {
    if (isOpen && step===1) {
      setShopId(prefs.selectedStoreId || '')
    }
  }, [isOpen, step, prefs.selectedStoreId])

  useEffect(() => {
    if (step !== 2) return
    const t = setTimeout(async () => {
      const res = await ordersService.list({ page: 1, limit: 10, type: 'supplier_order', status_id: 'accepted', supplier_id: supplierId || undefined, shop_id: shopId || undefined, search: searchOrder })
      setOrders(res.items || [])
    }, 300)
    return () => clearTimeout(t)
  }, [step, supplierId, shopId, searchOrder])

  const handleSubmit = async () => {
    if (step === 1) {
      if (!supplierId || !shopId || !name.trim()) return
      setStep(2)
      return
    }
    if (!supplierId || !shopId || !name.trim()) return
    setSaving(true)
    try {
      const payload: any = { name, supplier_id: supplierId, shop_id: shopId, comment, type: 'return_order', items: [] }
      if (selectedOrderId) { payload.returned_supplier_order_id = selectedOrderId }
      const created = await ordersService.create(payload)
      onCreated()
      // navigate to detail page of created return
    } finally { setSaving(false) }
  }

  const resetAndClose = (open: boolean) => {
    if (!open) {
      setStep(1)
      setSupplierId('')
      setShopId('')
      setName(`Refund ${new Date().toISOString().slice(0, 16).replace('T', ' ')}`)
      setComment('')
      setSearchOrder('')
      setOrders([])
      setSelectedOrderId('')
    }
    onOpenChange(open)
  }

  return (
    <CustomModal title={step === 1 ? 'Return order' : 'Choose order to return'} isOpen={isOpen} onOpenChange={resetAndClose} onSubmit={handleSubmit} submitLabel={step === 1 ? 'Next' : (saving ? 'Creating...' : 'Create return')} isSubmitting={saving} size="xl">
      {step === 1 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select label="Supplier *" selectedKeys={supplierId ? [supplierId] : []} onSelectionChange={(k) => setSupplierId(Array.from(k as Set<string>)[0] || '')} items={suppliers} aria-label="Supplier">
            {(item: any) => <SelectItem key={item.id}>{item.name}</SelectItem>}
          </Select>
          <Select label="Store *" selectedKeys={shopId ? [shopId] : []} onSelectionChange={(k) => setShopId(Array.from(k as Set<string>)[0] || '')} items={shops} aria-label="Store">
            {(item: any) => <SelectItem key={item.id}>{item.name}</SelectItem>}
          </Select>
          <Input label="Name *" className="md:col-span-2" value={name} onValueChange={setName} />
          <Input label="Note" className="md:col-span-2" value={comment} onValueChange={setComment} />
        </div>
      ) : (
        <div className="space-y-4">
          <div className="text-lg font-semibold">Select an order to return</div>
          <Input isClearable value={searchOrder} onValueChange={setSearchOrder} placeholder="Name or order ID" />
          <div className="max-h-80 overflow-auto divide-y rounded-md border">
            {(orders || []).map((o) => (
              <label key={o.id} className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-content2">
                <div className="flex items-center gap-3">
                  <input type="radio" name="source_order" checked={selectedOrderId === o.id} onChange={() => setSelectedOrderId(o.id)} />
                  <div>
                    <div className="font-medium">{o.name}</div>
                    <div className="text-sm text-foreground/60">#{o.external_id || o.id.slice(-6)}</div>
                  </div>
                </div>
                <div className="text-right text-sm text-foreground/80">
                  <div>Order amount: <MoneyAt amount={Number(o.total_price || 0)} date={o.created_at as any} /></div>
                  <div>Quantity: {(o.items_count || o.items?.length || 0)} pcs</div>
                </div>
              </label>
            ))}
            {!orders.length && (
              <div className="px-4 py-8 text-center text-foreground/60">No orders found</div>
            )}
          </div>
        </div>
      )}
    </CustomModal>
  )
} 