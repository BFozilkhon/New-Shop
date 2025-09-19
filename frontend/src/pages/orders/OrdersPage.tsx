import { useEffect, useMemo, useState } from 'react'
import CustomTable, { type CustomColumn } from '../../components/common/CustomTable'
import CustomModal from '../../components/common/CustomModal'
import { Select, SelectItem, Tabs, Tab, Input, Button, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, Tooltip } from '@heroui/react'
import { ordersService, type Order } from '../../services/ordersService'
import { useNavigate, useSearchParams } from 'react-router-dom'
import CustomMainBody from '../../components/common/CustomMainBody'
import { useTranslation } from 'react-i18next'
import { usePreferences } from '../../store/prefs'
import { useDateFormatter } from '../../hooks/useDateFormatter'
import ConfirmModal from '../../components/common/ConfirmModal'
import useCurrency from '../../hooks/useCurrency'
import MoneyAt from '../../components/common/MoneyAt'

export default function OrdersPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { format } = useDateFormatter()
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
  const [confirm, setConfirm] = useState<{ open: boolean; id?: string }>({ open: false })
  const { format: fmt } = useCurrency()

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

  const orderColumns: CustomColumn[] = useMemo(()=> ([
    { uid: 'external_id', name: 'ID', className: 'w-[100px] min-w-[100px]' },
    { uid: 'name', name: t('orders.table.name'), className: 'min-w-[200px]' },
    { uid: 'supplier', name: t('orders.table.supplier'), className: 'min-w-[160px]' },
    { uid: 'shop', name: t('orders.table.store'), className: 'min-w-[160px]' },
    { uid: 'status', name: t('orders.table.status'), className: 'min-w-[120px]' },
    { uid: 'payment', name: t('orders.table.payment'), className: 'min-w-[200px]' },
    { uid: 'qty', name: t('orders.table.qty'), className: 'w-[120px]' },
    { uid: 'amounts', name: t('orders.table.amount'), className: 'min-w-[200px]' },
    { uid: 'created_at', name: t('orders.table.created'), className: 'min-w-[180px]' },
    { uid: 'shipment', name: 'Shipment date', className: 'min-w-[180px]' },
    { uid: 'created_by', name: 'Created by', className: 'min-w-[160px]' },
    { uid: 'accepted_by', name: 'Accepted', className: 'min-w-[160px]' },
    { uid: 'progress', name: 'Sales progress', className: 'w-[200px]' },
    { uid: 'actions', name: t('common.actions'), className: 'min-w-[120px]' },
  ]), [t])

  const returnsColumns: CustomColumn[] = useMemo(()=> ([
    { uid: 'external_id', name: 'ID', className: 'w-[100px] min-w-[100px]' },
    { uid: 'name', name: 'Name', className: 'min-w-[200px]' },
    { uid: 'shop', name: 'Store', className: 'min-w-[160px]' },
    { uid: 'supplier', name: 'Supplier', className: 'min-w-[160px]' },
    { uid: 'status', name: 'Status', className: 'min-w-[120px]' },
    { uid: 'refund_money', name: 'Reback Money', className: 'min-w-[160px]' },
    { uid: 'refund_qty', name: 'Reback Quantity', className: 'w-[160px]' },
    { uid: 'created_at', name: 'Creation Date', className: 'min-w-[180px]' },
    { uid: 'created_by', name: 'Created By', className: 'min-w-[160px]' },
  ]), [])

  const tableItems = useMemo(()=> {
    if (currentTab === 'orders') {
      return (items||[]).map(o=>{
        const orderSupply = Number(o.total_supply_price || 0)
        const computedSupply = (o.items || []).reduce((s:any,it:any)=> s + Number(it?.supply_price||it?.unit_price||0) * Number(it?.quantity||0), 0)
        const total = orderSupply > 0 ? orderSupply : computedSupply
        const orderRetail = Number(o.total_retail_price || 0)
        const computedRetail = (o.items || []).reduce((s:any,it:any)=> s + Number(it?.retail_price||it?.unit_price||0) * Number(it?.quantity||0), 0)
        const retail = orderRetail > 0 ? orderRetail : computedRetail
        const paid = Number(o.total_paid_amount || 0)
        const debt = Math.max(0, total - paid)
        const qtyOrdered = Number(o.items_count || (o.items?.reduce((s:any,it:any)=> s + Number(it?.quantity||0),0) || 0))
        const qtyAccepted = Number((o as any).total_accepted_measurement_value || 0)
        const isAccepted = String(o.status_id||'').toLowerCase()==='accepted' || (!!o.is_finished && String(o.status_id||'').trim()==='')
        const status = isAccepted ? 'Accepted' : (String(o.status_id||'').toLowerCase()==='rejected' ? 'Rejected' : 'In progress')
        const progress = Number(o.sale_progress || (total>0 ? Math.round((paid/total)*100) : 0))
        const numericId = o.external_id || parseInt(String(o.id||'').slice(-6), 16)
        return {
          id: o.id,
          external_id: numericId,
          name: o.name,
          supplier: o.supplier?.name || '-',
          shop: o.shop?.name || '-',
          status,
          payment: { paid, debt, date: o.created_at },
          qty: `${qtyOrdered}${qtyAccepted? ` / ${qtyAccepted}`:''}`,
          amounts: { supply: total, retail, date: o.created_at },
          created_at: o.created_at,
          shipment: (o as any).payment_date || '-',
          created_by: o.created_by?.name || '-',
          accepted_by: o.accepted_by?.name || '-',
          progress,
          raw: o,
        }
      })
    }
    // returns
    return (items||[]).map(o=>{
      const refundQty = (o.items || []).reduce((sum:number, it:any)=> sum + Number((it as any).returned_quantity||0), 0)
      const refundMoney = (o.items || []).reduce((sum:number, it:any)=> sum + Number((it as any).returned_quantity||0) * Number((it as any).unit_price||0), 0)
      const isAccepted = String(o.status_id||'').toLowerCase()==='accepted' || (!!o.is_finished && String(o.status_id||'').trim()==='')
      const status = isAccepted ? 'Accepted' : (String(o.status_id||'').toLowerCase()==='rejected' ? 'Rejected' : 'In progress')
      const numericId = o.external_id || parseInt(String(o.id||'').slice(-6), 16)
      return {
        id: o.id,
        external_id: numericId,
        name: o.name,
        shop: o.shop?.name || '-',
        supplier: o.supplier?.name || '-',
        status,
        refund_money: refundMoney,
        refund_qty: refundQty,
        created_at: o.created_at,
        created_by: o.created_by?.name || '-',
        raw: o,
      }
    })
  }, [items, currentTab, fmt])

  const handleTabChange = (key: string) => { setSearchParams({ tab: key }) }

  const renderCell = (item:any, key:string) => {
    switch (key) {
      case 'external_id': return <span className="text-foreground/80">{item.external_id}</span>
      case 'name': return <button className="text-primary underline-offset-2 hover:underline" onClick={()=>navigate(currentTab==='orders'?`/products/orders/${item.id}`:`/products/order-returns/${item.id}`)}>{item.name}</button>
      case 'status': {
        const s = String(item.status).toLowerCase()
        const cls = s==='accepted' ? 'bg-success/20 text-success' : (s==='rejected' ? 'bg-danger/20 text-danger' : 'bg-warning/20 text-warning')
        const label = s==='accepted' ? t('common.accepted') : (s==='rejected' ? t('common.rejected') : t('common.in_progress'))
        return <span className={`px-2 py-1 rounded-full text-xs ${cls}`}>{label}</span>
      }
      case 'payment': {
        const d = item.payment?.date as string
        return (
          <Tooltip content={t('orders.table.payment')} placement="top" closeDelay={0}>
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2 text-success"><span className="inline-block h-2 w-2 rounded-full bg-success"></span><span className="font-medium"><MoneyAt amount={Number(item.payment?.paid||0)} date={d} /></span></div>
              <div className="flex items-center gap-2 text-danger"><span className="inline-block h-2 w-2 rounded-full bg-danger"></span><span className="font-medium"><MoneyAt amount={Number(item.payment?.debt||0)} date={d} /></span></div>
            </div>
          </Tooltip>
        )
      }
      case 'amounts': {
        const d = item.amounts?.date as string
        return (
          <Tooltip content={<div className="text-left"><div>{t('orders.table.amount_supply')}</div><div>{t('orders.table.amount_retail')}</div></div>} placement="top" closeDelay={0}>
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2 text-warning"><span className="inline-block h-2 w-2 rounded-full bg-warning"></span><span className="font-medium"> <MoneyAt amount={Number(item.amounts?.supply||0)} date={d} /></span></div>
              <div className="flex items-center gap-2 text-primary"><span className="inline-block h-2 w-2 rounded-full bg-primary"></span><span className="font-medium"> <MoneyAt amount={Number(item.amounts?.retail||0)} date={d} /></span></div>
            </div>
          </Tooltip>
        )
      }
      case 'refund_money': return <MoneyAt amount={Number(item.refund_money || 0)} date={item.created_at} />
      case 'refund_qty': return `${item.refund_qty} pcs`
      case 'created_at': return <span>{format(item.created_at, { withTime: true })}</span>
      case 'progress': return (
        <div className="flex items-center gap-2 w-40"><div className="h-2 bg-default-200 rounded w-full overflow-hidden"><div className="h-full bg-primary" style={{ width: `${Math.min(100, Math.max(0, item.progress))}%` }} /></div><span className="text-xs text-foreground/60">{Math.min(100, Math.max(0, item.progress))}%</span></div>
      )
      case 'actions': {
        const status = String(item.raw?.status_id||'').toLowerCase()
        const isAccepted = status==='accepted' || (!!item.raw?.is_finished && !status)
        if (currentTab==='returns') return null
        if (isAccepted) return null
        return (
          <Dropdown>
            <DropdownTrigger><Button isIconOnly variant="light">⋯</Button></DropdownTrigger>
            <DropdownMenu aria-label="Actions" onAction={(k)=>{ if(k==='delete') setConfirm({ open: true, id: item.id }) }}>
              <DropdownItem key="delete" className="text-danger" color="danger">{t('common.delete')}</DropdownItem>
            </DropdownMenu>
          </Dropdown>
        )
      }
      default: return item[key]
    }
  }

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
                columns={orderColumns}
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
                renderCell={renderCell}
              />
            </div>
          </Tab>
          <Tab key="returns" title={<div className="flex items-center space-x-2"><span>{t('orders.tabs.returns')}</span></div>}>
            <div className="mt-4">
              <CustomTable
                columns={returnsColumns}
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
                renderCell={renderCell}
              />
            </div>
          </Tab>
        </Tabs>
      </div>

      <OrderCreateModal isOpen={isOpen} onOpenChange={setIsOpen} shops={shops} suppliers={suppliers} onCreated={(id?:string)=>{ setIsOpen(false); if(id) navigate(`/products/orders/${id}`); else load() }}/>
      <ReturnCreateModal isOpen={isReturnOpen} onOpenChange={setIsReturnOpen} shops={shops} suppliers={suppliers} onCreated={(id?:string)=>{ setIsReturnOpen(false); if(id) navigate(`/products/order-returns/${id}`); else load() }}/>

      <ConfirmModal
        isOpen={confirm.open}
        title={t('common.delete')}
        description={'Are you sure you want to delete this order?'}
        confirmText={t('common.delete')}
        confirmColor="danger"
        onConfirm={async ()=> { if (confirm.id) { await ordersService.remove(confirm.id); await load(); } setConfirm({ open:false }) }}
        onClose={()=> setConfirm({ open:false }) }
      />
    </CustomMainBody>
  )
}

function OrderCreateModal({ isOpen, onOpenChange, shops, suppliers, onCreated }: { isOpen: boolean; onOpenChange: (v:boolean)=>void; shops:{id:string;name:string}[]; suppliers:{id:string;name:string}[]; onCreated: (id?:string)=>void }) {
  const { t } = useTranslation()
  const [saving, setSaving] = useState(false)
  const [supplierId, setSupplierId] = useState('')
  const [shopId, setShopId] = useState('')
  const [name, setName] = useState(`Order ${new Date().toISOString().slice(0,16).replace('T',' ')}`)
  const { prefs } = usePreferences()

  useEffect(()=>{
    if (isOpen) setShopId(prefs.selectedStoreId || '')
  }, [isOpen, prefs.selectedStoreId])

  const submit = async () => {
    if (!supplierId || !shopId) return
    setSaving(true)
    try {
      const created = await ordersService.create({ name, supplier_id: supplierId, shop_id: shopId, type: 'supplier_order', items: [] })
      onCreated(created?.id)
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

function ReturnCreateModal({ isOpen, onOpenChange, shops, suppliers, onCreated }: { isOpen: boolean; onOpenChange: (v:boolean)=>void; shops:{id:string;name:string}[]; suppliers:{id:string;name:string}[]; onCreated: (id?:string)=>void }) {
  const { t } = useTranslation()
  const [step, setStep] = useState<1|2>(1)
  const [saving, setSaving] = useState(false)

  const [supplierId, setSupplierId] = useState('')
  const [shopId, setShopId] = useState('')
  const [name, setName] = useState(`Refund ${new Date().toISOString().slice(0,16).replace('T',' ')}`)
  const [comment, setComment] = useState('')
  const { prefs } = usePreferences()
  const { format: fmt } = useCurrency()

  useEffect(()=>{
    if (isOpen && step===1) {
      setShopId(prefs.selectedStoreId || '')
    }
  }, [isOpen, step, prefs.selectedStoreId])

  const [searchOrder, setSearchOrder] = useState('')
  const [orders, setOrders] = useState<Order[]>([])
  const [selectedOrderId, setSelectedOrderId] = useState('')

  useEffect(()=>{
    if (step !== 2) return
    const tmr = setTimeout(async ()=>{
      const res = await ordersService.list({ page:1, limit:10, type: 'supplier_order', status_id: 'accepted', supplier_id: supplierId||undefined, shop_id: shopId||undefined, search: searchOrder })
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
      const created = await ordersService.create(payload)
      onCreated(created?.id)
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
                    <div className="text-sm text-foreground/60">#{o.external_id || parseInt(String(o.id||'').slice(-6), 16)}</div>
                  </div>
                </div>
                <div className="text-right text-sm text-foreground/80">
                  <div>{t('orders.modal.order_amount')}: {fmt(Number(o.total_price || 0))}</div>
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