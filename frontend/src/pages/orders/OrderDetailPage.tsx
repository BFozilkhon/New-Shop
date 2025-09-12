import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Tabs, Tab, Input, Button, Dropdown, DropdownMenu, DropdownItem, DropdownTrigger, Pagination, Select, SelectItem, Textarea, ButtonGroup } from '@heroui/react'
import CustomMainBody from '../../components/common/CustomMainBody'
import { ordersService } from '../../services/ordersService'
import { productsService } from '../../services/productsService'
import { BanknotesIcon, ArrowPathIcon, ArrowTrendingUpIcon, ShoppingBagIcon, CubeIcon, ChevronDownIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import CustomModal from '../../components/common/CustomModal'
import { useTranslation } from 'react-i18next'

export default function OrderDetailPage() {
  const { t } = useTranslation()
  const { id } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [order, setOrder] = useState<any>(null)
  const [items, setItems] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState<'products'|'details'|'payments'>('products')

  // payments
  const [payments, setPayments] = useState<any[]>([])
  const [paymentsLoading, setPaymentsLoading] = useState(false)
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)
  const [paymentForm, setPaymentForm] = useState<any>({ account_id: '', amount: '', payment_method: 'cash', description: '' })
  const [accounts, setAccounts] = useState<any[]>([])

  // product search + columns like CustomTable
  const [productQuery, setProductQuery] = useState('')
  const [productResults, setProductResults] = useState<any[]>([])
  const [productSearchLoading, setProductSearchLoading] = useState(false)
  const allColumnKeys = ['name','sku','qty','unit_price','total']
  const [visibleCols, setVisibleCols] = useState<Set<string>>(new Set(allColumnKeys))

  // pagination for items table
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const paginatedItems = useMemo(()=>{ const start=(currentPage-1)*itemsPerPage; return items.slice(start, start+itemsPerPage) },[items,currentPage,itemsPerPage])
  const totalPages = Math.max(1, Math.ceil(items.length / Math.max(1, itemsPerPage)))

  useEffect(()=>{ (async()=>{ try{ setLoading(true); const data = await ordersService.get(String(id)); setOrder(data); setItems(Array.isArray(data?.items)? data.items:[]) } finally{ setLoading(false) } })() },[id])

  useEffect(()=>{ if (!productQuery || activeTab!=='products') { setProductResults([]); return } const tmr = setTimeout(async ()=>{ try{ setProductSearchLoading(true); const res:any = await (productsService as any).list({ page:1, limit:10, search: productQuery }); setProductResults(res?.items||[]) } finally { setProductSearchLoading(false) } }, 350); return ()=>clearTimeout(tmr) },[productQuery, activeTab])

  const stats = useMemo(()=>{
    const orderType = String(order?.type || 'supplier_order')
    const sumPayments = (payments || []).reduce((s:number,p:any)=> s + Number(p?.amount||0), 0)

    const sumItemsBy = (primary: string, fallback: string) => (items || []).reduce((total, it) => {
      const qty = Number(it?.quantity ?? 0)
      const lineTotal = Number(it?.total_price ?? 0)
      if (lineTotal > 0) return total + lineTotal
      const price = Number(it?.[primary] ?? it?.[fallback] ?? 0)
      return total + qty * price
    }, 0)

    // Order amount (supplier: supply price; otherwise retail/total)
    let orderAmount = orderType === 'supplier_order'
      ? Number(order?.total_supply_price || order?.total_price || 0)
      : Number(order?.total_retail_price || order?.total_price || 0)
    if (!orderAmount) {
      orderAmount = orderType === 'supplier_order'
        ? sumItemsBy('supply_price', 'unit_price')
        : sumItemsBy('retail_price', 'unit_price')
    }

    // Retail amount
    let retailAmount = Number(order?.total_retail_price || 0)
    if (!retailAmount) retailAmount = sumItemsBy('retail_price', 'unit_price')

    // Paid amount prefers order field, falls back to payments sum
    const paidAmount = Number(order?.total_paid_amount || 0) || sumPayments
    const debtAmount = Math.max(0, orderAmount - paidAmount)

    // Goods count: prefer items_count, else sum quantities
    const goodsCount = Number(order?.items_count || 0) || (items || []).reduce((s, it) => s + Number(it?.quantity || 0), 0)

    // Progress
    let progress = Number(order?.sale_progress || 0)
    if (!progress && orderAmount > 0) progress = Math.round((paidAmount / orderAmount) * 100)

    // Returns
    const returnedCount = Number(order?.returned_count || 0) || (items || []).reduce((s,it)=> s + Number(it?.returned_quantity||0), 0)
    const returnedPayments = Number(order?.returned_payments || 0)
    const returnAmount = Number(order?.to_return_amount || 0) || (items || []).reduce((s,it)=> s + Number(it?.returned_quantity||0) * Number(it?.supply_price ?? it?.unit_price ?? 0), 0)

    return { orderAmount, retailAmount, paidAmount, debtAmount, goodsCount, progress, returnedCount, returnedPayments, returnAmount }
  },[order,items,payments])

  const attachProduct = (p:any) => {
    if (!p) return
    const pid = p?.id || p?._id || p?.ID
    const psku = p?.sku
    setItems(prev => {
      const index = prev.findIndex(it => (it.product_id && pid && it.product_id === pid) || (psku && it.product_sku === psku))
      if (index >= 0) {
        const next = [...prev]
        const current = next[index]
        const newQty = Number(current.quantity || 0) + 1
        const unit = Number(current.unit_price || p?.price || 0)
        next[index] = { ...current, quantity: newQty, total_price: +(newQty * unit).toFixed(2) }
        return next
      }
      const unit = Number(p?.price || 0)
      return [...prev, { product_id: pid, product_name: p.name, product_sku: psku, quantity: 1, unit_price: unit, total_price: unit }]
    })
  }

  const updateItem = (idx:number, field:string, value:any) => { const next=[...items]; next[idx] = { ...next[idx], [field]: ['quantity','unit_price'].includes(field) ? Number(value)||0 : value }; if(['quantity','unit_price'].includes(field)){ const q=Number(next[idx].quantity)||0, up=Number(next[idx].unit_price)||0; next[idx].total_price=+(q*up).toFixed(2) } setItems(next) }

  const save = async () => { try{ setSaving(true); await ordersService.update(String(id), { items }); const fresh = await ordersService.get(String(id)); setOrder(fresh) } finally{ setSaving(false) } }

  const formatCurrency = (v:number) => new Intl.NumberFormat('ru-RU').format(Number(v||0))
  const safeDate = (d?:string) => { if(!d) return '—'; try{ return new Date(d).toLocaleString('ru-RU') } catch { return '—' } }

  const fetchPayments = async () => {
    try { setPaymentsLoading(true); const data: any = await ordersService.get(String(id)); setPayments(Array.isArray(data?.payments) ? data.payments : []) } finally { setPaymentsLoading(false) }
  }
  const openPaymentModal = async () => { setIsPaymentModalOpen(true) }
  const submitPayment = async () => {
    if (!paymentForm.amount || Number(paymentForm.amount) <= 0) return
    try { setSaving(true); await ordersService.addPayment(String(id), { amount: Number(paymentForm.amount), payment_method: paymentForm.payment_method, description: paymentForm.description }); await fetchPayments(); const fresh = await ordersService.get(String(id)); setOrder(fresh); setIsPaymentModalOpen(false); setPaymentForm({ account_id: '', amount: '', payment_method: 'cash', description: '' }) } finally { setSaving(false) }
  }
  useEffect(()=>{ if(activeTab==='payments') fetchPayments() }, [activeTab])

  const columnsDropdown = (
    <Dropdown>
      <DropdownTrigger className="hidden sm:flex">
        <Button endContent={<ChevronDownIcon className="h-4 w-4" />} variant="bordered" size="md">{t('common.columns')}</Button>
      </DropdownTrigger>
      <DropdownMenu aria-label="Table Columns" disallowEmptySelection closeOnSelect={false} selectionMode="multiple" selectedKeys={visibleCols} onSelectionChange={(keys)=> setVisibleCols(keys as Set<string>)} itemClasses={{ base: 'data-[hover=true]:bg-background/40' }}>
        <DropdownItem key="name">{t('products.columns.name')}</DropdownItem>
        <DropdownItem key="sku">SKU</DropdownItem>
        <DropdownItem key="qty">{t('orders.table.qty')}</DropdownItem>
        <DropdownItem key="unit_price">{t('products.columns.price')}</DropdownItem>
        <DropdownItem key="total">{t('orders.table.amount')}</DropdownItem>
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
          <div className="text-foreground/60 text-sm">{order?.supplier?.name} • {order?.shop?.name}</div>
        </div>
        <div className="flex gap-2">
          <Button variant="bordered" onPress={()=>navigate(-1)}>{t('common.back')}</Button>
          <Button color="primary" onPress={openPaymentModal}>Add payment</Button>
        </div>
      </div>

      <Tabs aria-label="Order tabs" color="primary" variant="bordered" selectedKey={activeTab} onSelectionChange={(k)=>setActiveTab(k as any)} className="w-full" classNames={{ tabList: 'w-full h-14', tab: 'h-12' }}>
        <Tab key="products" title={<div className="flex items-center space-x-2"><span>{t('products.header')}</span></div>}>
          <div className="mt-4 space-y-4">
            <div className="flex justify-between gap-3 items-end">
              <Input isClearable value={productQuery} onValueChange={setProductQuery} onClear={()=>setProductQuery('')} className="w-full sm:max-w-[44%]" classNames={{ inputWrapper: 'h-11 bg-background ring-1 ring-foreground/40 focus-within:ring-foreground/50 rounded-lg', input: 'text-foreground' }} placeholder={t('importPage.scan') || 'SKU, barcode, title'} startContent={<MagnifyingGlassIcon className="h-5 w-5 text-foreground/60" />} size="md"/>
              <div className="flex gap-3 items-center">{columnsDropdown}</div>
            </div>

            {productQuery && (
              <div className="border rounded-md overflow-hidden">
                <div className="px-3 py-2 text-sm bg-content2 border-b">{t('inventory.detail.scan.found')}: {productResults.length}{productSearchLoading? ' (searching...)':''}</div>
                <div className="max-h-72 overflow-auto divide-y">
                  {productResults.length > 0 ? (
                    productResults.map((p)=> (
                      <div key={p.id} className="flex items-center justify-between px-3 py-2 hover:bg-content2/50">
                        <div className="min-w-0"><div className="text-sm font-medium truncate">{p.name}</div><div className="text-xs text-foreground/60">SKU: {p.sku || '-'} • Barcode: {p.barcode || '-'}</div></div>
                        <Button color="primary" size="sm" onPress={()=>attachProduct(p)}>{t('inventory.detail.scan.add')}</Button>
                      </div>
                    ))
                  ) : (
                    <div className="px-3 py-6 text-sm flex items-center justify-between">
                      <div className="text-default-500">{t('common.no_results')}</div>
                      <Button size="sm" color="primary" onPress={()=> navigate('/products/catalog/create')}>{t('products.create')}</Button>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="overflow-auto border rounded-md">
              <table className="min-w-full divide-y divide-foreground/10">
                <thead className="bg-background">
                  <tr>
                    {visibleCols.has('name') && <th className="px-4 py-2 text-left text-xs">{t('products.columns.name')}</th>}
                    {visibleCols.has('sku') && <th className="px-4 py-2 text-left text-xs">SKU</th>}
                    {visibleCols.has('qty') && <th className="px-4 py-2 text-left text-xs">{t('orders.table.qty')}</th>}
                    {visibleCols.has('unit_price') && <th className="px-4 py-2 text-left text-xs">{t('products.columns.price')}</th>}
                    {visibleCols.has('total') && <th className="px-4 py-2 text-left text-xs">{t('orders.table.amount')}</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-foreground/10">
                  {paginatedItems.map((it,idx)=> (
                    <tr key={idx}>
                      {visibleCols.has('name') && <td className="px-4 py-2 text-sm">{it.product_name}</td>}
                      {visibleCols.has('sku') && <td className="px-4 py-2 text-sm">{it.product_sku}</td>}
                      {visibleCols.has('qty') && (
                        <td className="px-4 py-2 text-sm">
                          <Input
                            type="number"
                            value={String(it.quantity ?? 0)}
                            onValueChange={(v)=>updateItem((currentPage-1)*itemsPerPage+idx,'quantity',v)}
                            size="sm"
                            variant="bordered"
                            className="w-24"
                            classNames={{ inputWrapper: 'h-9 bg-background ring-1 ring-foreground/40 focus-within:ring-foreground/50 rounded-md', input: 'text-foreground text-sm' }}
                          />
                        </td>
                      )}
                      {visibleCols.has('unit_price') && (
                        <td className="px-4 py-2 text-sm">
                          <Input
                            type="number"
                            value={String(it.unit_price ?? 0)}
                            onValueChange={(v)=>updateItem((currentPage-1)*itemsPerPage+idx,'unit_price',v)}
                            size="sm"
                            variant="bordered"
                            className="w-36"
                            classNames={{ inputWrapper: 'h-9 bg-background ring-1 ring-foreground/40 focus-within:ring-foreground/50 rounded-md', input: 'text-foreground text-sm' }}
                          />
                        </td>
                      )}
                      {visibleCols.has('total') && <td className="px-4 py-2 text-sm">{it.total_price||0}</td>}
                    </tr>
                  ))}
                  {!items.length && (<tr><td className="px-4 py-6 text-sm text-foreground/60" colSpan={5}>{t('common.no_results')}</td></tr>)}
                </tbody>
              </table>
            </div>

            <div className="py-3 px-2 flex justify-between items-center">
              <span className="w-[30%] text-sm text-foreground/60">{t('common.page_of', { page: currentPage, pages: totalPages })}</span>
              <Pagination showControls color="primary" showShadow page={currentPage} total={totalPages} onChange={setCurrentPage} />
              <div className="hidden sm:flex w-[30%] justify-end gap-2">
                <Button isDisabled={totalPages === 1 || currentPage <= 1} size="md" variant="flat" onPress={()=>setCurrentPage(p=>Math.max(1,p-1))}>{t('common.previous')}</Button>
                <Button isDisabled={totalPages === 1 || currentPage >= totalPages} size="md" variant="flat" onPress={()=>setCurrentPage(p=>Math.min(totalPages,p+1))}>{t('common.next')}</Button>
              </div>
            </div>

            <div className="flex justify-end"><Button color="primary" onPress={save} isDisabled={saving}>{saving? t('common.save')+'...' : t('common.save')}</Button></div>
          </div>
        </Tab>
        <Tab key="details" title={<div className="flex items-center space-x-2"><span>{t('products.form.main')}</span></div>}>
          <div className="mt-4 space-y-8">
            <div className="border-t border-dashed border-gray-300" />
            <div className="space-y-4">
              <div className="text-lg font-semibold text-gray-900">Статистика</div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatCard icon={BanknotesIcon} title="Сумма заказa" value={formatCurrency(stats.orderAmount)} />
                <StatCard icon={BanknotesIcon} title="Сумма по розничной цене" value={formatCurrency(stats.retailAmount)} />
                <StatCard icon={BanknotesIcon} title="Сумма оплат" value={formatCurrency(stats.paidAmount)} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatCard icon={BanknotesIcon} title="Сумма долга" value={formatCurrency(stats.debtAmount)} />
                <div className="rounded-2xl bg-gray-900 border border-gray-700 p-5 flex items-center justify-between">
                  <div>
                    <div className="text-sm text-gray-200">Количество товаров</div>
                    <div className="mt-2 text-2xl font-semibold tracking-wide"><span className="text-blue-500">{stats.goodsCount}</span> <span className="text-gray-400 text-base ml-1">pcs</span></div>
                  </div>
                  <div className="h-11 w-11 rounded-full bg-gray-800 flex items-center justify-center"><CubeIcon className="h-6 w-6 text-blue-500" /></div>
                </div>
                <div className="rounded-2xl bg-gray-900 border border-gray-700 p-5">
                  <div className="flex items-center justify-between"><div className="text-sm text-gray-200">Прогресс продаж</div><div className="h-11 w-11 rounded-full bg-gray-800 flex items-center justify-center"><ArrowTrendingUpIcon className="h-6 w-6 text-blue-500" /></div></div>
                  <div className="mt-3 flex items-center gap-3"><div className="w-full h-2 rounded bg-gray-700 overflow-hidden"><div className="h-full bg-blue-600" style={{ width: `${Math.min(100, Math.max(0, stats.progress))}%` }} /></div><div className="text-sm text-gray-200">{Math.min(100, Math.max(0, stats.progress))}%</div></div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatCard icon={ArrowPathIcon} title="Сумма возврата" value={formatCurrency(stats.returnAmount)} />
                <div className="rounded-2xl bg-gray-900 border border-gray-700 p-5 flex items-center justify-between"><div><div className="text-sm text-gray-200">Количество возврата</div><div className="mt-2 text-2xl font-semibold tracking-wide"><span className="text-blue-500">{stats.returnedCount}</span> <span className="text-gray-400 text-base ml-1">pcs</span></div></div><div className="h-11 w-11 rounded-full bg-gray-800 flex items-center justify-center"><ShoppingBagIcon className="h-6 w-6 text-blue-500" /></div></div>
                <StatCard icon={BanknotesIcon} title="Возвращено оплат" value={formatCurrency(stats.returnedPayments)} />
              </div>
            </div>
            <div className="border-t border-dashed border-gray-300" />
            <div className="space-y-8">
              <div className="text-lg font-semibold text-gray-900">Информация</div>
              <div className="space-y-4">
                <div className="text-base font-semibold text-gray-900">Основное</div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div><label className="block text-sm text-gray-500 mb-2">Поставщик</label><div className="rounded-xl bg-gray-100 text-gray-900 px-4 py-3">{order?.supplier?.name || '—'}</div></div>
                  <div><label className="block text-sm text-gray-500 mb-2">Магазин</label><div className="rounded-xl bg-gray-100 text-gray-900 px-4 py-3">{order?.shop?.name || '—'}</div></div>
                  <div><label className="block text-sm text-gray-500 mb-2">Название</label><div className="rounded-xl bg-gray-100 text-gray-900 px-4 py-3">{order?.name || '—'}</div></div>
                  <div><label className="block text-sm text-gray-500 mb-2">Создал</label><div className="rounded-xl bg-gray-100 text-gray-900 px-4 py-3">{order?.created_by?.name || order?.CreatedBy?.name || '—'}</div></div>
                  <div><label className="block text-sm text-gray-500 mb-2">Принял</label><div className="rounded-xl bg-gray-100 text-gray-900 px-4 py-3">{order?.accepted_by?.name || order?.AcceptedBy?.name || '—'}</div></div>
                  <div className="md:col-span-3"><label className="block text-sm text-gray-500 mb-2">Примечание</label><div className="rounded-xl bg-gray-100 text-gray-900 px-4 py-3 min-h-[64px]">{order?.comment || '—'}</div></div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="text-base font-semibold text-gray-900">Дата и время</div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div><label className="block text-sm text-gray-500 mb-2">Дата создания</label><div className="rounded-xl bg-gray-100 text-gray-900 px-4 py-3">{safeDate(order?.created_at)}</div></div>
                  <div><label className="block text-sm text-gray-500 mb-2">Дата приемки</label><div className="rounded-xl bg-gray-100 text-gray-900 px-4 py-3">{safeDate(order?.accepting_date)}</div></div>
                  <div><label className="block text-sm text-gray-500 mb-2">Срок оплаты</label><div className="rounded-xl bg-gray-100 text-gray-900 px-4 py-3">{safeDate(order?.payment_date)}</div></div>
                </div>
              </div>
            </div>
            <div className="border-t border-dashed border-gray-300" />
          </div>
        </Tab>
        <Tab key="payments" title={<div className="flex items-center space-x-2"><span>{t('profile.billing.title')}</span></div>}>
          <div className="mt-4">
            <div className="grid grid-cols-12 gap-6">
              <div className="col-span-12 md:col-span-8">
                {(paymentsLoading ? (
                  <div className="p-6 text-foreground/40">Загрузка...</div>
                ) : payments && payments.length > 0 ? (
                  <div className="shadow ring-1 ring-black ring-opacity-5 md:rounded-lg overflow-hidden">
                    <table className="min-w-full divide-y divide-foreground/10">
                      <thead className="bg-content2">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Дата</th>
                          <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Метод</th>
                          <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Счёт</th>
                          <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider">Сумма</th>
                          <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Комментарий</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-foreground/10">
                        {payments.map((p:any) => (
                          <tr key={p.id} className="hover:bg-content2/50">
                            <td className="px-6 py-3 text-sm">{safeDate(p.payment_date)}</td>
                            <td className="px-6 py-3 text-sm">{p.payment_method === 'cash' ? 'Наличные' : 'Безналичные'}</td>
                            <td className="px-6 py-3 text-sm">{p.account_name || '-'}</td>
                            <td className="px-6 py-3 text-sm text-right">{formatCurrency(p.amount)} UZS</td>
                            <td className="px-6 py-3 text-sm">{p.description || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="bg-content1 border border-dashed border-foreground/20 rounded-lg p-10 text-center text-foreground/60">
                    <div className="text-xl mb-2 text-foreground">Вы еще не добавили оплату</div>
                    <div className="mb-6">Чтобы добавить оплату, нажмите на кнопку ниже</div>
                    <Button color="primary" onPress={openPaymentModal} className="inline-flex items-center gap-2"><span className="text-xl">+</span> Добавить оплату</Button>
                  </div>
                ))}
              </div>
              <div className="col-span-12 md:col-span-4 space-y-4">
                <StatCard icon={BanknotesIcon} title="Сумма заказа" value={formatCurrency(stats.orderAmount)} />
                <StatCard icon={BanknotesIcon} title="Сумма оплат" value={formatCurrency(payments.reduce((s:number,p:any)=>s+Number(p.amount||0),0))} />
                <StatCard icon={BanknotesIcon} title="Сумма долга" value={formatCurrency(Math.max(0, stats.orderAmount - payments.reduce((s:number,p:any)=>s+Number(p.amount||0),0)))} />
                <StatCard icon={ArrowPathIcon} title="Сумма возврата" value={formatCurrency(0)} />
                <StatCard icon={BanknotesIcon} title="Возвращено оплат" value={formatCurrency(0)} />
              </div>
            </div>
          </div>
        </Tab>
      </Tabs>

      {isPaymentModalOpen && (
        <CustomModal title="Оплата по заказу" isOpen={isPaymentModalOpen} onOpenChange={setIsPaymentModalOpen} onSubmit={submitPayment} submitLabel={saving ? 'Сохранение...' : 'Добавить оплату'} isSubmitting={saving}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-sm text-gray-700">Счет</label>
              <Select aria-label="Account" placeholder="Выберите счет" selectedKeys={paymentForm.account_id ? new Set([paymentForm.account_id]) : new Set([])} onSelectionChange={(keys)=>{ const val = Array.from(keys as Set<string>)[0] || ''; setPaymentForm({...paymentForm, account_id: val}) }} className="mt-1">
                {accounts.map((a:any) => (<SelectItem key={a.id}>{a.name}</SelectItem>))}
              </Select>
            </div>
            <div>
              <label className="text-sm text-gray-700">Тип оплаты</label>
              <div className="mt-1">
                <ButtonGroup variant="bordered">
                  <Button color={paymentForm.payment_method==='cash'?'primary':'default'} onPress={()=>setPaymentForm({...paymentForm, payment_method:'cash'})}>Наличные</Button>
                  <Button color={paymentForm.payment_method==='cashless'?'primary':'default'} onPress={()=>setPaymentForm({...paymentForm, payment_method:'cashless'})}>Безналичные</Button>
                </ButtonGroup>
              </div>
            </div>
            <div>
              <label className="text-sm text-gray-700">Сумма</label>
              <Input type="number" value={paymentForm.amount} onValueChange={(v)=>setPaymentForm({...paymentForm, amount: v})} variant="bordered" className="mt-1" endContent={<span className="text-foreground/60 text-sm">UZS</span>} />
            </div>
            <div>
              <label className="text-sm text-gray-700">Комментарий</label>
              <Textarea value={paymentForm.description} onValueChange={(v)=>setPaymentForm({...paymentForm, description: v})} variant="bordered" className="mt-1" minRows={3} placeholder="Введите комментарий" />
            </div>
          </div>
        </CustomModal>
      )}
    </CustomMainBody>
  )
}

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