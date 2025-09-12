import { useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Tabs, Tab, Input, Textarea, Chip, Button } from '@heroui/react'
import CustomMainBody from '../../components/common/CustomMainBody'
import CustomTable, { CustomColumn } from '../../components/common/CustomTable'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '../../services/base/apiClient'
import { usePreferences } from '../../store/prefs'
import { ordersService, type Order } from '../../services/ordersService'
import SupplierPaymentModal from './components/SupplierPaymentModal'
import { suppliersService } from '../../services/suppliersService'
import { BanknotesIcon, CheckBadgeIcon, XCircleIcon, ClockIcon, ShoppingCartIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline'

export default function SupplierDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { prefs } = usePreferences()
  const qc = useQueryClient()
  const [tab, setTab] = useState<'dashboard'|'orders'|'payments'|'information'|'products'>('dashboard')
  const [isPayOpen, setPayOpen] = useState(false)

  const supplierQ = useQuery({ queryKey:['supplier', id], queryFn: async ()=> (await apiClient.get<{ data:any }>(`/api/suppliers/${id}`)).data.data, enabled: !!id })
  const statsQ = useQuery({
    queryKey: ['supplier-stats', id, prefs.selectedStoreId],
    queryFn: async ()=> (await apiClient.get<{ data: any }>(`/api/suppliers/${id}/stats`, { params: { shop_id: prefs.selectedStoreId||undefined } })).data.data,
    enabled: !!id,
    placeholderData: (p)=> p,
  })

  const paymentsQ = useQuery({
    queryKey: ['supplier-payments', id, prefs.selectedStoreId],
    queryFn: async ()=> (await apiClient.get<{ data: { items: any[]; total: number } }>(`/api/suppliers/${id}/payments`, { params: { page: 1, limit: 50, shop_id: prefs.selectedStoreId||undefined } })).data.data,
    enabled: !!id && tab==='payments',
    placeholderData: (p)=> p,
  })

  // Orders tab state
  const [ordersPage, setOrdersPage] = useState(1)
  const [ordersLimit, setOrdersLimit] = useState(10)
  const [ordersSearch, setOrdersSearch] = useState('')
  const ordersQ = useQuery({
    queryKey: ['supplier-orders', id, ordersPage, ordersLimit, ordersSearch, prefs.selectedStoreId],
    queryFn: async ()=> ordersService.list({ page: ordersPage, limit: ordersLimit, search: ordersSearch, supplier_id: id, shop_id: prefs.selectedStoreId||undefined, type: 'supplier_order' }),
    enabled: !!id && tab==='orders',
    placeholderData: (p)=> p,
  })

  // Products tab state
  const [prodPage, setProdPage] = useState(1)
  const [prodLimit, setProdLimit] = useState(10)
  const [prodSearch, setProdSearch] = useState('')
  const productsQ = useQuery({
    queryKey: ['supplier-products', id, prodPage, prodLimit, prodSearch, prefs.selectedStoreId],
    queryFn: async ()=> suppliersService.products(id!, { page: prodPage, limit: prodLimit, search: prodSearch, shop_id: prefs.selectedStoreId||undefined }),
    enabled: !!id && tab==='products',
    placeholderData: (p)=> p,
  })

  const paymentColumns: CustomColumn[] = useMemo(()=> ([
    { uid: 'payment_date', name: 'Date' },
    { uid: 'amount', name: 'Amount' },
    { uid: 'payment_method', name: 'Method' },
    { uid: 'description', name: 'Description' },
  ]), [])

  const ordersColumns: CustomColumn[] = useMemo(()=> ([
    { uid: 'id', name: 'ID' },
    { uid: 'name', name: 'Name', className: 'min-w-[160px] w-[22%]' },
    { uid: 'store', name: 'Store' },
    { uid: 'status', name: 'Status' },
    { uid: 'payment', name: 'Payment', className: 'min-w-[220px]' },
    { uid: 'quantity', name: 'Quantity' },
    { uid: 'amounts', name: 'Order amount', className: 'min-w-[220px]' },
    { uid: 'created_at', name: 'Created' },
    { uid: 'created_by', name: 'Created by' },
    { uid: 'accepted_by', name: 'Accepted' },
    { uid: 'sale_progress', name: 'Sales progress' },
  ]), [])

  const productColumns: CustomColumn[] = useMemo(()=> ([
    { uid: 'photo', name: 'Photo', className:'w-[88px] min-w-[88px]' },
    { uid: 'name', name: 'Name', className: 'w-[28%] min-w-[260px]' },
    { uid: 'sku', name: 'SKU' },
    { uid: 'barcode', name: 'Barcode' },
    { uid: 'category_name', name: 'Category', className: 'min-w-[260px]' },
    { uid: 'quantity', name: 'Quantity' },
    { uid: 'supply_price', name: 'Supply price' },
    { uid: 'retail_price', name: 'Retail price' },
  ]), [])

  const StatCard = ({ title, value, unit, icon }: { title: string; value: string|number; unit?: string; icon?: JSX.Element }) => (
    <div className="rounded-2xl bg-gray-900 border border-gray-700 p-5 flex items-center justify-between">
      <div>
        <div className="text-sm text-gray-200">{title}</div>
        <div className="mt-2 text-2xl font-semibold tracking-wide">
          <span className="text-blue-500">{typeof value==='number'? Intl.NumberFormat('ru-RU').format(value): value}</span>
          {unit ? <span className="text-gray-300 text-base ml-1">{unit}</span> : null}
        </div>
      </div>
      <div className="h-11 w-11 rounded-full bg-gray-800 grid place-items-center">{icon}</div>
    </div>
  )

  const StatMoney = ({ title, value }: { title: string; value: number }) => (
    <StatCard title={title} value={Number(value||0)} unit="UZS" icon={<BanknotesIcon className="h-6 w-6 text-blue-500" />} />
  )

  const amountOfOrders = Number(statsQ.data?.amount_of_orders || 0)
  const amountPaid = Number(statsQ.data?.amount_paid || 0)
  const debt = Math.max(0, amountOfOrders - amountPaid)

  return (
    <CustomMainBody>
      <div className="flex items-center justify-between mb-3">
        <h1 className="text-xl font-semibold">Supplier • <span className="text-primary">{supplierQ.data?.name || '-'}</span></h1>
        <div className="flex gap-2">
          {tab==='payments' ? (
            <Button color="primary" onPress={()=> setPayOpen(true)}>Add payment</Button>
          ) : null}
        </div>
      </div>

      <Tabs selectedKey={tab} className="w-full" onSelectionChange={(k)=> setTab(k as any)} variant="bordered" color="primary" classNames={{ tabList:'h-14 w-full', tab:'h-12 flex-1' }}>
        <Tab key="dashboard" title={<div className="flex-1 text-center">Dashboard</div>}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            <StatMoney title="Amount of orders" value={amountOfOrders} />
            <StatCard title="Number of paid" value={statsQ.data?.paid_orders || 0} unit="orders" icon={<CheckBadgeIcon className="h-6 w-6 text-blue-500" />} />
            <StatCard title="Number of unpaid" value={statsQ.data?.unpaid_orders || 0} unit="orders" icon={<XCircleIcon className="h-6 w-6 text-blue-500" />} />
            <StatMoney title="Amount of payments to the supplier" value={amountPaid} />
          </div>
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            <StatMoney title="Current debt to the supplier" value={debt} />
            <StatCard title="Order frequency" value={statsQ.data?.order_frequency||'once a month'} icon={<ClockIcon className="h-6 w-6 text-blue-500" />} />
            <StatCard title="Total items ordered" value={statsQ.data?.total_items||0} unit="pcs" icon={<ShoppingCartIcon className="h-6 w-6 text-blue-500" />} />
            <StatCard title="Total items received" value={statsQ.data?.total_items||0} unit="pcs" icon={<ArrowDownTrayIcon className="h-6 w-6 text-blue-500" />} />
          </div>
        </Tab>

        <Tab key="orders" title={<div className="flex-1 text-center">Orders</div>}> 
          <div className="mt-6">
            <CustomTable<Order>
              columns={ordersColumns}
              items={(ordersQ.data?.items||[])}
              total={ordersQ.data?.total||0}
              page={ordersPage}
              limit={ordersLimit}
              onPageChange={setOrdersPage}
              onLimitChange={setOrdersLimit}
              searchValue={ordersSearch}
              onSearchChange={setOrdersSearch}
              onSearchClear={()=> setOrdersSearch('')}
              renderCell={(row: Order, key: string) => {
                switch (key) {
                  case 'id': return <span className="text-foreground/80">{row.external_id ? String(row.external_id) : row.id.slice(-6)}</span>
                  case 'name': return <button className="text-primary underline-offset-2 hover:underline" onClick={()=> window.location.href = `/products/orders/${row.id}`}>{row.name || `Order #${row.external_id||''}`}</button>
                  case 'store': return row.shop?.name || '-'
                  case 'status': return row.status_id ? <Chip size="sm" className="bg-success-100 text-success-700">Accepted</Chip> : <Chip size="sm" variant="flat">-</Chip>
                  case 'payment': return (
                    <div className="flex gap-2 items-center">
                      <Chip size="sm" className="bg-success-100 text-success-700">{Intl.NumberFormat('ru-RU').format(Number((row as any).total_paid_amount||0))} UZS</Chip>
                      <Chip size="sm" className="bg-danger-100 text-danger-700">{Intl.NumberFormat('ru-RU').format(Math.max(0, Number((row as any).total_supply_price||0) - Number((row as any).total_paid_amount||0)))} UZS</Chip>
                    </div>
                  )
                  case 'quantity': return <span>{(row as any).items_count ?? (row.items||[]).reduce((s,i)=> s + Number((i as any).quantity||0), 0)}</span>
                  case 'amounts': return (
                    <div className="flex gap-2 items-center">
                      <Chip size="sm" className="bg-warning-100 text-warning-700">{Intl.NumberFormat('ru-RU').format(Number((row as any).total_supply_price||0))} UZS</Chip>
                      <Chip size="sm" className="bg-purple-100 text-purple-700">{Intl.NumberFormat('ru-RU').format(Number((row as any).total_retail_price||0))} UZS</Chip>
                    </div>
                  )
                  case 'created_at': return new Date(row.created_at).toLocaleString()
                  case 'created_by': return row.created_by?.name || '-'
                  case 'accepted_by': return row.accepted_by?.name || '-'
                  case 'sale_progress': {
                    const pct = Math.max(0, Math.min(100, Number(row.sale_progress||0)))
                    return (
                      <div className="flex items-center gap-2 min-w-[140px]">
                        <div className="flex-1 h-2 rounded-full bg-default-200 overflow-hidden">
                          <div className="h-2 bg-default-600" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-foreground/70 text-sm">{pct}%</span>
                      </div>
                    )
                  }
                  default: return String((row as any)[key] ?? '')
                }
              }}
              isLoading={ordersQ.isLoading}
            />
          </div>
        </Tab>

        <Tab key="payments" title={<div className="flex-1 text-center">Payments</div>}>
          <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            <StatMoney title="Amount of orders" value={amountOfOrders} />
            <StatMoney title="Amount of payments to the supplier" value={amountPaid} />
            <StatMoney title="Current debt to the supplier" value={debt} />
            <StatCard title="Number of paid" value={statsQ.data?.paid_orders||0} unit="orders" icon={<CheckBadgeIcon className="h-6 w-6 text-blue-500" />} />
            <StatCard title="Number of unpaid" value={statsQ.data?.unpaid_orders||0} unit="orders" icon={<XCircleIcon className="h-6 w-6 text-blue-500" />} />
            <StatCard title="Partially paid" value={statsQ.data?.partially_paid_orders||0} unit="orders" icon={<ClockIcon className="h-6 w-6 text-blue-500" />} />
          </div>
          <div className="mt-6">
            <CustomTable
              columns={paymentColumns}
              items={(paymentsQ.data?.items||[]).map(p=> ({ ...p, payment_date: new Date(p.payment_date).toLocaleString(), amount: `${Intl.NumberFormat('ru-RU').format(Number(p.amount||0))} UZS` }))}
              total={paymentsQ.data?.total||0}
              page={1}
              limit={50}
              onPageChange={()=>{}}
              onLimitChange={()=>{}}
              searchValue={''}
              onSearchChange={()=>{}}
              onSearchClear={()=>{}}
              renderCell={(row:any, key:string)=> row[key]}
            />
          </div>
          <SupplierPaymentModal supplierId={id!} debtUZS={debt} isOpen={isPayOpen} onClose={()=> setPayOpen(false)} onSuccess={()=> { qc.invalidateQueries({ queryKey: ['supplier-payments'] }); qc.invalidateQueries({ queryKey: ['supplier-stats'] }); qc.invalidateQueries({ queryKey: ['supplier-products'] }) }} />
        </Tab>

        <Tab key="information" title={<div className="flex-1 text-center">Information</div>}>
          <div className="mt-6 space-y-8">
            <div>
              <div className="border-t border-dashed" />
              <h3 className="mt-4 mb-3 text-sm font-semibold">Main</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input isDisabled label="Name" variant="bordered" classNames={{ inputWrapper: 'h-14' }} value={supplierQ.data?.name||''} />
                <Input isDisabled label="Default markup" variant="bordered" classNames={{ inputWrapper: 'h-14' }} value={`${supplierQ.data?.default_markup_percentage??0} %`} />
                <Input isDisabled label="Phone" variant="bordered" classNames={{ inputWrapper: 'h-14' }} value={supplierQ.data?.phone||''} />
                <Input isDisabled label="Email" variant="bordered" classNames={{ inputWrapper: 'h-14' }} value={supplierQ.data?.email||''} />
                <div className="md:col-span-2">
                  <Textarea isDisabled label="Notes" variant="bordered" classNames={{ inputWrapper: 'min-h-[3.5rem]' }} value={supplierQ.data?.notes||''} />
                </div>
              </div>
            </div>

            <div>
              <div className="border-t border-dashed" />
              <h3 className="mt-4 mb-3 text-sm font-semibold">Requisites</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input isDisabled label="Company legal name" variant="bordered" classNames={{ inputWrapper: 'h-14' }} value={supplierQ.data?.legal_address?.company_name||''} />
                <Input isDisabled label="Legal address" variant="bordered" classNames={{ inputWrapper: 'h-14' }} value={[supplierQ.data?.legal_address?.country, supplierQ.data?.legal_address?.city, supplierQ.data?.legal_address?.street].filter(Boolean).join(', ')} />
                <Input isDisabled label="Country" variant="bordered" classNames={{ inputWrapper: 'h-14' }} value={supplierQ.data?.legal_address?.country||''} />
                <Input isDisabled label="Post index" variant="bordered" classNames={{ inputWrapper: 'h-14' }} value={supplierQ.data?.legal_address?.post_index||''} />
                <Input isDisabled label="Bank account" variant="bordered" classNames={{ inputWrapper: 'h-14' }} value={supplierQ.data?.bank_account||''} />
                <Input isDisabled label="Legal address" variant="bordered" classNames={{ inputWrapper: 'h-14' }} value={supplierQ.data?.bank_name_branch||''} />
                <Input isDisabled label="TIN (Taxpayer Identification Number)" variant="bordered" classNames={{ inputWrapper: 'h-14' }} value={supplierQ.data?.inn||''} />
                <Input isDisabled label="IBT (Inter-Branch Turnover)" variant="bordered" classNames={{ inputWrapper: 'h-14' }} value={supplierQ.data?.mfo||''} />
              </div>
            </div>

            <div className="border-t border-dashed" />
          </div>
        </Tab>

        <Tab key="products" title={<div className="flex-1 text-center">Products</div>}>
          <div className="mt-6">
            <CustomTable<any>
              columns={productColumns}
              items={(productsQ.data?.items||[])}
              total={productsQ.data?.total||0}
              page={prodPage}
              limit={prodLimit}
              onPageChange={setProdPage}
              onLimitChange={setProdLimit}
              searchValue={prodSearch}
              onSearchChange={setProdSearch}
              onSearchClear={()=> setProdSearch('')}
              renderCell={(row: any, key: string) => {
                switch(key){
                  case 'photo': {
                    const src = row.image
                    return <div className="w-12 h-12 rounded-full bg-default-200 overflow-hidden">{src ? <img src={src} className="w-full h-full object-cover"/> : null}</div>
                  }
                  case 'name': return <span className="text-foreground font-medium truncate block max-w-[520px]">{row.name}</span>
                  case 'sku': return row.sku || '-'
                  case 'barcode': return row.barcode || '-'
                  case 'category_name': return row.category_name || '-'
                  case 'quantity': return String(row.quantity ?? 0)
                  case 'supply_price': return `${Intl.NumberFormat('ru-RU').format(Number(row.supply_price||0))} UZS`
                  case 'retail_price': return `${Intl.NumberFormat('ru-RU').format(Number(row.retail_price||0))} UZS`
                  default: return String((row as any)[key] ?? '')
                }
              }}
              isLoading={productsQ.isLoading}
            />
          </div>
        </Tab>
      </Tabs>
    </CustomMainBody>
  )
}

function Field({ label, value }: { label: string; value: any }) {
  return (
    <div className="border rounded-xl p-4">
      <div className="text-xs text-default-500 mb-1">{label}</div>
      <div className="text-base font-medium">{value || '-'}</div>
    </div>
  )
} 