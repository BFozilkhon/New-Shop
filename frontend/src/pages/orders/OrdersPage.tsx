import { useEffect, useMemo, useState } from 'react'
import CustomTable from '../../components/common/CustomTable'
import CustomModal from '../../components/common/CustomModal'
import { Select, SelectItem, Tabs, Tab, Input } from '@heroui/react'
import { ordersService, type Order } from '../../services/ordersService'
import { useNavigate, useSearchParams } from 'react-router-dom'
import CustomMainBody from '../../components/common/CustomMainBody'
import { useTranslation } from 'react-i18next'
import { usePreferences } from '../../store/prefs'

export default function OrdersPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const currentTab = (searchParams.get('tab') as 'orders'|'returns') || 'orders'
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [total, setTotal] = useState(0)
  const [_loading, setLoading] = useState(false)
  const [items, setItems] = useState<Order[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [isReturnOpen, setIsReturnOpen] = useState(false)
  const [shops, setShops] = useState<{id:string;name:string}[]>([])
  const [suppliers, setSuppliers] = useState<{id:string;name:string}[]>([])
  const [search, setSearch] = useState('')
  const { prefs } = usePreferences()

  useEffect(()=>{ ordersService.getShops().then(setShops).catch(()=>setShops([])); ordersService.getSuppliers().then(setSuppliers).catch(()=>setSuppliers([])) },[])

  const load = async () => {
    setLoading(true)
    try {
      const res = await ordersService.list({ page, limit, type: currentTab==='orders' ? 'supplier_order' : 'return_order', search, shop_id: prefs.selectedStoreId || undefined })
      setItems(res.items || [])
      setTotal(res.total || 0)
    } finally { setLoading(false) }
  }
  useEffect(()=>{ load() }, [currentTab, page, limit, search, prefs.selectedStoreId])

  const tableItems = useMemo(()=> (items||[]).map(o=>({
    id: o.id,
    name: o.name,
    supplier: o.supplier?.name || '-',
    shop: o.shop?.name || '-',
    items_count: o.items_count || (o.items?.length||0),
    total_price: o.total_price || 0,
    created_at: o.created_at,
  })), [items])

  const handleTabChange = (key: string) => { setSearchParams({ tab: key }) }

  return (
    <CustomMainBody>
       <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold">{t('orders.header')}</h1>
      </div>
      <div className="flex w-full flex-col">
        <Tabs
          aria-label="Orders Options"
          color="primary"
          variant="bordered"
          selectedKey={currentTab}
          onSelectionChange={(key) => handleTabChange(key as string)}
          className="w-full"
          classNames={{ tabList: 'w-full h-14', tab: 'h-12' }}
        >
          <Tab key="orders" title={<div className="flex items-center space-x-2"><span>{t('orders.tabs.orders')}</span></div>}>
            <div className="mt-4">
              <CustomTable
                columns={[{uid:'name',name:t('orders.table.name')},{uid:'supplier',name:t('orders.table.supplier')},{uid:'shop',name:t('orders.table.store')},{uid:'items_count',name:t('orders.table.qty')},{uid:'total_price',name:t('orders.table.amount')},{uid:'created_at',name:t('orders.table.created')}]} 
                items={tableItems as any}
                total={total}
                page={page}
                limit={limit}
                onPageChange={setPage}
                onLimitChange={setLimit}
                onCreate={()=>setIsOpen(true)}
                createLabel={t('orders.create')}
                searchValue={search}
                onSearchChange={setSearch}
                renderCell={(item:any, key:string)=> key==='name' ? (
                  <button className="text-primary underline-offset-2 hover:underline" onClick={()=>navigate(`/products/orders/${item.id}`)}>{item.name}</button>
                ) : item[key]}
              />
            </div>
          </Tab>
          <Tab key="returns" title={<div className="flex items-center space-x-2"><span>{t('orders.tabs.returns')}</span></div>}>
            <div className="mt-4">
              <CustomTable
                columns={[{uid:'name',name:t('orders.table.name')},{uid:'supplier',name:t('orders.table.supplier')},{uid:'shop',name:t('orders.table.store')},{uid:'items_count',name:t('orders.table.qty')},{uid:'total_price',name:t('orders.table.amount')},{uid:'created_at',name:t('orders.table.created')}]} 
                items={tableItems as any}
                total={total}
                page={page}
                limit={limit}
                onPageChange={setPage}
                onLimitChange={setLimit}
                onCreate={()=>setIsReturnOpen(true)}
                createLabel={t('orders.create_return')}
                searchValue={search}
                onSearchChange={setSearch}
                renderCell={(item:any, key:string)=> key==='name' ? (
                  <button className="text-primary underline-offset-2 hover:underline" onClick={()=>navigate(`/products/order-returns/${item.id}`)}>{item.name}</button>
                ) : item[key]}
              />
            </div>
          </Tab>
        </Tabs>
      </div>

      <OrderCreateModal isOpen={isOpen} onOpenChange={setIsOpen} shops={shops} suppliers={suppliers} onCreated={()=>{ setIsOpen(false); load() }}/>
      <ReturnCreateModal isOpen={isReturnOpen} onOpenChange={setIsReturnOpen} shops={shops} suppliers={suppliers} onCreated={()=>{ setIsReturnOpen(false); load() }}/>
    </CustomMainBody>
  )
}

function OrderCreateModal({ isOpen, onOpenChange, shops, suppliers, onCreated }: { isOpen: boolean; onOpenChange: (v:boolean)=>void; shops:{id:string;name:string}[]; suppliers:{id:string;name:string}[]; onCreated: ()=>void }) {
  const { t } = useTranslation()
  const [saving, setSaving] = useState(false)
  const [supplierId, setSupplierId] = useState('')
  const [shopId, setShopId] = useState('')
  const [name, setName] = useState(`Order ${new Date().toISOString().slice(0,16).replace('T',' ')}`)
  const submit = async () => {
    if (!supplierId || !shopId) return
    setSaving(true)
    try {
      await ordersService.create({ name, supplier_id: supplierId, shop_id: shopId, type: 'supplier_order', items: [] })
      onCreated()
    } finally { setSaving(false) }
  }
  return (
    <CustomModal title={t('orders.modal.new_order')} isOpen={isOpen} onOpenChange={onOpenChange} onSubmit={submit} submitLabel={saving? t('orders.modal.saving') : t('orders.modal.create')} isSubmitting={saving}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Select variant='bordered' label={t('orders.modal.supplier')} selectedKeys={supplierId? [supplierId] : []} onSelectionChange={(k)=>setSupplierId(Array.from(k as Set<string>)[0]||'')} items={suppliers} aria-label="Supplier">
          {(item:any)=> <SelectItem key={item.id}>{item.name}</SelectItem>}
        </Select>
        <Select variant='bordered' label={t('orders.modal.store')} selectedKeys={shopId? [shopId] : []} onSelectionChange={(k)=>setShopId(Array.from(k as Set<string>)[0]||'')} items={shops} aria-label="Store">
          {(item:any)=> <SelectItem key={item.id}>{item.name}</SelectItem>}
        </Select>
        <Input label={t('orders.modal.order_name')} className="md:col-span-2" value={name} onValueChange={setName} variant="bordered" classNames={{ inputWrapper: 'h-14' }} />
      </div>
    </CustomModal>
  )
}

function ReturnCreateModal({ isOpen, onOpenChange, shops, suppliers, onCreated }: { isOpen: boolean; onOpenChange: (v:boolean)=>void; shops:{id:string;name:string}[]; suppliers:{id:string;name:string}[]; onCreated: ()=>void }) {
  const { t } = useTranslation()
  const [step, setStep] = useState<1|2>(1)
  const [saving, setSaving] = useState(false)

  const [supplierId, setSupplierId] = useState('')
  const [shopId, setShopId] = useState('')
  const [name, setName] = useState(`Refund ${new Date().toISOString().slice(0,16).replace('T',' ')}`)
  const [comment, setComment] = useState('')

  const [searchOrder, setSearchOrder] = useState('')
  const [orders, setOrders] = useState<Order[]>([])
  const [selectedOrderId, setSelectedOrderId] = useState('')

  useEffect(()=>{
    if (step !== 2) return
    const tmr = setTimeout(async ()=>{
      const res = await ordersService.list({ page:1, limit:10, type: 'supplier_order', supplier_id: supplierId||undefined, shop_id: shopId||undefined, search: searchOrder })
      setOrders(res.items || [])
    }, 300)
    return ()=>clearTimeout(tmr)
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
      if (selectedOrderId) payload.returned_supplier_order_id = selectedOrderId
      await ordersService.create(payload)
      onCreated()
    } finally { setSaving(false) }
  }

  const resetAndClose = (open: boolean) => {
    if (!open) {
      setStep(1)
      setSupplierId('')
      setShopId('')
      setName(`Refund ${new Date().toISOString().slice(0,16).replace('T',' ')}`)
      setComment('')
      setSearchOrder('')
      setOrders([])
      setSelectedOrderId('')
    }
    onOpenChange(open)
  }

  return (
    <CustomModal title={step===1? t('orders.modal.return_title1') : t('orders.modal.return_title2')} isOpen={isOpen} onOpenChange={resetAndClose} onSubmit={handleSubmit} submitLabel={step===1? t('orders.modal.next') : (saving? t('orders.modal.creating') : t('orders.modal.create_return'))} isSubmitting={saving} size="xl">
      {step===1 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select variant='bordered' label={t('orders.modal.supplier_req')} selectedKeys={supplierId? [supplierId] : []} onSelectionChange={(k)=>setSupplierId(Array.from(k as Set<string>)[0]||'')} items={suppliers} aria-label="Supplier">
            {(item:any)=> <SelectItem key={item.id}>{item.name}</SelectItem>}
          </Select>
          <Select variant='bordered' label={t('orders.modal.store_req')} selectedKeys={shopId? [shopId] : []} onSelectionChange={(k)=>setShopId(Array.from(k as Set<string>)[0]||'')} items={shops} aria-label="Store">
            {(item:any)=> <SelectItem key={item.id}>{item.name}</SelectItem>}
          </Select>
          <Input label={t('orders.modal.name_req')} className="md:col-span-2" value={name} onValueChange={setName} variant="bordered" classNames={{ inputWrapper: 'h-14' }} />
          <Input label={t('orders.modal.note')} className="md:col-span-2" value={comment} onValueChange={setComment} variant="bordered" classNames={{ inputWrapper: 'h-14' }} />
        </div>
      ) : (
        <div className="space-y-4">
          <div className="text-lg font-semibold">{t('orders.modal.select_order_title')}</div>
          <Input isClearable value={searchOrder} onValueChange={setSearchOrder} placeholder={t('orders.modal.name_or_id')} variant="bordered" classNames={{ inputWrapper: 'h-14' }}/>
          <div className="max-h-80 overflow-auto divide-y rounded-md border">
            {(orders||[]).map(o=> (
              <label key={o.id} className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-content2">
                <div className="flex items-center gap-3">
                  <input type="radio" name="source_order" checked={selectedOrderId===o.id} onChange={()=>setSelectedOrderId(o.id)} />
                  <div>
                    <div className="font-medium">{o.name}</div>
                    <div className="text-sm text-foreground/60">#{o.external_id || o.id.slice(-6)}</div>
                  </div>
                </div>
                <div className="text-right text-sm text-foreground/80">
                  <div>{t('orders.modal.order_amount')}: {new Intl.NumberFormat('ru-RU').format(Number(o.total_price || 0))} UZS</div>
                  <div>{t('orders.modal.quantity')}: {(o.items_count || o.items?.length || 0)} {t('orders.modal.pcs')}</div>
                </div>
              </label>
            ))}
            {!orders.length && (<div className="px-4 py-8 text-center text-foreground/60">{t('orders.modal.no_orders')}</div>)}
          </div>
        </div>
      )}
    </CustomModal>
  )
} 