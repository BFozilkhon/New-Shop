import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Tabs, Tab, Input, Button, Dropdown, DropdownMenu, DropdownItem, DropdownTrigger } from '@heroui/react'
import CustomMainBody from '../../components/common/CustomMainBody'
import { ordersService } from '../../services/ordersService'
import { BanknotesIcon, ArrowPathIcon, ArrowTrendingUpIcon, ShoppingBagIcon, CubeIcon, ChevronDownIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline'

export default function OrderReturnsDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [order, setOrder] = useState<any>(null)
  const [items, setItems] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState<'products'|'details'>('products')

  const [productQuery, setProductQuery] = useState('')
  const [productResults, setProductResults] = useState<any[]>([])
  const [productSearchLoading, setProductSearchLoading] = useState(false)
  const allColumnKeys = ['name','sku','qty','unit_price','total']
  const [visibleCols, setVisibleCols] = useState<Set<string>>(new Set(allColumnKeys))

  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const paginatedItems = useMemo(()=>{ const start=(currentPage-1)*itemsPerPage; return items.slice(start, start+itemsPerPage) },[items,currentPage,itemsPerPage])
  const totalPages = Math.max(1, Math.ceil(items.length / Math.max(1, itemsPerPage)))

  useEffect(()=>{ (async()=>{ try{ setLoading(true); const data = await ordersService.get(String(id)); setOrder(data); setItems(Array.isArray(data?.items)? data.items:[]) } finally{ setLoading(false) } })() },[id])

  const stats = useMemo(()=>{
    const orderAmount = Number(order?.total_price || 0)
    const goodsCount = Number(order?.items_count || items?.length || 0)
    const returnAmount = Number(order?.to_return_amount || order?.total_returned_amount || 0)
    return { orderAmount, goodsCount, returnAmount }
  },[order,items])

  const columnsDropdown = (
    <Dropdown>
      <DropdownTrigger className="hidden sm:flex">
        <Button endContent={<ChevronDownIcon className="h-4 w-4" />} variant="bordered" size="md">Columns</Button>
      </DropdownTrigger>
      <DropdownMenu aria-label="Table Columns" disallowEmptySelection closeOnSelect={false} selectionMode="multiple" selectedKeys={visibleCols} onSelectionChange={(keys)=> setVisibleCols(keys as Set<string>)} itemClasses={{ base: 'data-[hover=true]:bg-background/40' }}>
        <DropdownItem key="name">Name</DropdownItem>
        <DropdownItem key="sku">SKU</DropdownItem>
        <DropdownItem key="qty">Qty</DropdownItem>
        <DropdownItem key="unit_price">Unit price</DropdownItem>
        <DropdownItem key="total">Total</DropdownItem>
      </DropdownMenu>
    </Dropdown>
  )

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
          <Button variant="bordered" onPress={()=>navigate(-1)}>Back</Button>
        </div>
      </div>

      <Tabs aria-label="Order return tabs" color="primary" variant="bordered" selectedKey={activeTab} onSelectionChange={(k)=>setActiveTab(k as any)} className="w-full" classNames={{ tabList: 'w-full h-14', tab: 'h-12' }}>
        <Tab key="products" title={<div className="flex items-center space-x-2"><span>Products ({items?.length||0})</span></div>}>
          <div className="mt-4 space-y-4">
            <div className="flex justify-between gap-3 items-end">
              <Input isClearable value={productQuery} onValueChange={setProductQuery} onClear={()=>setProductQuery('')} className="w-full sm:max-w-[44%]" classNames={{ inputWrapper: 'h-11 bg-background ring-1 ring-foreground/40 focus-within:ring-foreground/50 rounded-lg', input: 'text-foreground' }} placeholder="SKU, barcode, title" startContent={<MagnifyingGlassIcon className="h-5 w-5 text-foreground/60" />} size="md"/>
              <div className="flex gap-3 items-center">{columnsDropdown}</div>
            </div>

            <div className="overflow-auto border rounded-md">
              <table className="min-w-full divide-y divide-foreground/10">
                <thead className="bg-background">
                  <tr>
                    {visibleCols.has('name') && <th className="px-4 py-2 text-left text-xs">Name</th>}
                    {visibleCols.has('sku') && <th className="px-4 py-2 text-left text-xs">SKU</th>}
                    {visibleCols.has('qty') && <th className="px-4 py-2 text-left text-xs">Qty</th>}
                    {visibleCols.has('unit_price') && <th className="px-4 py-2 text-left text-xs">Unit price</th>}
                    {visibleCols.has('total') && <th className="px-4 py-2 text-left text-xs">Total</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-foreground/10">
                  {paginatedItems.map((it,idx)=> (
                    <tr key={idx}>
                      {visibleCols.has('name') && <td className="px-4 py-2 text-sm">{it.product_name}</td>}
                      {visibleCols.has('sku') && <td className="px-4 py-2 text-sm">{it.product_sku}</td>}
                      {visibleCols.has('qty') && <td className="px-4 py-2 text-sm">{it.quantity||0}</td>}
                      {visibleCols.has('unit_price') && <td className="px-4 py-2 text-sm">{it.unit_price||0}</td>}
                      {visibleCols.has('total') && <td className="px-4 py-2 text-sm">{it.total_price||0}</td>}
                    </tr>
                  ))}
                  {!items.length && (<tr><td className="px-4 py-6 text-sm text-foreground/60" colSpan={5}>No items</td></tr>)}
                </tbody>
              </table>
            </div>

            <div className="py-3 px-2 flex justify-between items-center">
              <span className="w-[30%] text-sm text-foreground/60">Page {currentPage} of {totalPages}</span>
              <div className="hidden sm:flex w-[30%] justify-end gap-2">
                <Button isDisabled={totalPages === 1 || currentPage <= 1} size="md" variant="flat" onPress={()=>setCurrentPage(p=>Math.max(1,p-1))}>Previous</Button>
                <Button isDisabled={totalPages === 1 || currentPage >= totalPages} size="md" variant="flat" onPress={()=>setCurrentPage(p=>Math.min(totalPages,p+1))}>Next</Button>
              </div>
            </div>
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
                    <div className="text-sm text-gray-200">Items count</div>
                    <div className="mt-2 text-2xl font-semibold tracking-wide"><span className="text-blue-500">{stats.goodsCount}</span> <span className="text-gray-400 text-base ml-1">pcs</span></div>
                  </div>
                  <div className="h-11 w-11 rounded-full bg-gray-800 flex items-center justify-center"><CubeIcon className="h-6 w-6 text-blue-500" /></div>
                </div>
                <StatCard icon={ArrowPathIcon} title="Return amount" value={formatCurrency(stats.returnAmount)} />
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