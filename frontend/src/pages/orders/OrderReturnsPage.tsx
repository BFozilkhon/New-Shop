import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Input, Select, SelectItem, Button } from '@heroui/react'
import CustomMainBody from '../../components/common/CustomMainBody'
import CustomTable from '../../components/common/CustomTable'
import CustomModal from '../../components/common/CustomModal'
import { ordersService, type Order } from '../../services/ordersService'

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

  const tableItems = useMemo(() => (items || []).map((o) => ({
    id: o.id,
    name: o.name,
    supplier: o.supplier?.name || '-',
    shop: o.shop?.name || '-',
    items_count: o.items_count || (o.items?.length || 0),
    total_price: o.total_price || 0,
    created_at: new Date(o.created_at).toLocaleString(),
    status: 'Returned',
  })), [items])

  return (
    <CustomMainBody>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold">Order returns</h1>
        <Button color="primary" onPress={() => setIsOpen(true)}>Create</Button>
      </div>

      <CustomTable
        columns={[
          { uid: 'id', name: 'ID' },
          { uid: 'name', name: 'Name' },
          { uid: 'shop', name: 'Store' },
          { uid: 'supplier', name: 'Supplier' },
          { uid: 'status', name: 'Status' },
          { uid: 'total_price', name: 'Return amount' },
          { uid: 'items_count', name: 'Quantity' },
          { uid: 'created_at', name: 'Created' },
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
          if (key === 'status') return <span className="inline-flex px-2 py-1 rounded-full text-xs bg-success/20 text-success">Returned</span>
          if (key === 'total_price') return new Intl.NumberFormat('ru-RU').format(Number(item.total_price || 0)) + ' UZS'
          if (key === 'items_count') return `${item.items_count} pcs`
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

  // Step 2
  const [searchOrder, setSearchOrder] = useState('')
  const [orders, setOrders] = useState<Order[]>([])
  const [selectedOrderId, setSelectedOrderId] = useState('')

  useEffect(() => {
    if (step !== 2) return
    const t = setTimeout(async () => {
      const res = await ordersService.list({ page: 1, limit: 10, type: 'supplier_order', supplier_id: supplierId || undefined, shop_id: shopId || undefined, search: searchOrder })
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
      if (selectedOrderId) {
        payload.returned_supplier_order_id = selectedOrderId
      }
      await ordersService.create(payload)
      onCreated()
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
                  <div>Order amount: {new Intl.NumberFormat('ru-RU').format(Number(o.total_price || 0))} UZS</div>
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