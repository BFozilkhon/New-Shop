import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Tabs, Tab, Input, Button, Select, SelectItem, Textarea, ButtonGroup, Chip } from '@heroui/react'
import CustomMainBody from '../../components/common/CustomMainBody'
import CustomTable, { type CustomColumn } from '../../components/common/CustomTable'
import { ordersService } from '../../services/ordersService'
import { productsService } from '../../services/productsService'
import { BanknotesIcon, ArrowPathIcon, ArrowTrendingUpIcon, ShoppingBagIcon, CubeIcon, ArrowLeftIcon } from '@heroicons/react/24/outline'
import CustomModal from '../../components/common/CustomModal'
import { useTranslation } from 'react-i18next'
import { toast } from 'react-toastify'
import { useQuery } from '@tanstack/react-query'
import ConfirmModal from '../../components/common/ConfirmModal'

export default function OrderDetailPage() {
  const { t } = useTranslation()
  const { id } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [order, setOrder] = useState<any>(null)
  const [items, setItems] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState<'products'|'details'|'payments'>('products')
  const [productFilter, setProductFilter] = useState<'ordered'|'all'|'low'|'zero'>('all')

  // payments
  const [payments, setPayments] = useState<any[]>([])
  const [paymentsLoading, setPaymentsLoading] = useState(false)
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)
  const [paymentForm, setPaymentForm] = useState<any>({ account_id: '', amount: '', payment_method: 'cash', description: '' })
  const [accounts, setAccounts] = useState<any[]>([])
  const fetchPayments = async () => {
    try {
      setPaymentsLoading(true)
      const data: any = await ordersService.get(String(id))
      setPayments(Array.isArray(data?.payments) ? data.payments : [])
      setOrder(data)
    } finally {
      setPaymentsLoading(false)
    }
  }
  useEffect(()=>{ if (activeTab === 'payments') fetchPayments() }, [activeTab, id])

  // product search + columns like CustomTable
  const [term, setTerm] = useState('')
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [lastScan, setLastScan] = useState('')

  // confirm modal
  const [confirm, setConfirm] = useState<{ open: boolean; action?: 'approve'|'reject' }>({ open: false })

  // debounce autosave
  const [initialized, setInitialized] = useState(false)

  // cache product info for ordered rows (barcode, current stock)
  const [prodCache, setProdCache] = useState<Record<string, any>>({})
  useEffect(()=>{
    const ids = (items||[]).map((it:any)=> it.product_id).filter(Boolean)
    const missing = ids.filter((pid)=> !prodCache[pid])
    if (!missing.length) return
    let cancelled = false
    ;(async()=>{
      try {
        const fetched = await Promise.all(missing.map((pid)=> productsService.get(String(pid)).catch(()=>null)))
        if (cancelled) return
        const map: Record<string, any> = {}
        fetched.forEach((p)=> { if (p && p.id) map[p.id] = p })
        if (Object.keys(map).length) setProdCache(prev=> ({ ...prev, ...map }))
      } catch {}
    })()
    return ()=> { cancelled = true }
  }, [items])

  useEffect(()=>{ (async()=>{ try{ setLoading(true); const data = await ordersService.get(String(id)); setOrder(data); setItems(Array.isArray(data?.items)? data.items:[]); setProductFilter(data?.is_finished ? 'ordered' : 'all') } finally{ setLoading(false); setInitialized(true) } })() },[id])

  // autosave order items when changed
  useEffect(()=>{
    if (!initialized || order?.is_finished) return
    const t = setTimeout(async ()=> {
      try {
        await ordersService.update(String(id), { items: (items||[]).map((it:any)=> ({
          product_id: it.product_id,
          product_name: it.product_name,
          product_sku: it.product_sku,
          quantity: Number(it.quantity || it.qty || 0),
          unit_price: Number(it.unit_price || it.retail_price || 0),
          supply_price: Number(it.supply_price ?? 0),
          retail_price: Number(it.retail_price ?? it.unit_price ?? 0),
          unit: it.unit || 'pcs',
        })) } as any)
      } catch {}
    }, 350)
    return ()=> clearTimeout(t)
  }, [items, initialized, id, order?.is_finished])

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
      return [...prev, { product_id: pid, product_name: p.name, product_sku: psku, quantity: 1, unit_price: unit, total_price: unit, supply_price: Number(p?.cost_price||0), retail_price: Number(p?.price||0) }]
    })
  }

  const addOrIncrementProduct = (p:any, qty:number=1) => {
    const pid = p?.id || p?._id || p?.ID
    const psku = p?.sku
    setItems(prev => {
      const next = [...prev]
      const index = next.findIndex(it => (it.product_id && pid && it.product_id === pid) || (psku && it.product_sku === psku))
      if (index >= 0) {
        const current = next[index]
        const unit = Number(current.unit_price || current.retail_price || p?.price || 0)
        const newQty = Number(current.quantity || 0) + qty
        next[index] = { ...current, quantity: newQty, total_price: +(newQty * unit).toFixed(2) }
      } else {
        const unit = Number(p?.price || 0)
        next.push({ product_id: pid, product_name: p.name, product_sku: psku, quantity: qty, unit_price: unit, supply_price: Number(p?.cost_price||0), retail_price: Number(p?.price||0), total_price: +(qty*unit).toFixed(2) })
      }
      // Persist immediately and toast success
      ordersService.update(String(id), { items: next.map((it:any)=> ({
        product_id: it.product_id,
        product_name: it.product_name,
        product_sku: it.product_sku,
        quantity: Number(it.quantity||0),
        unit_price: Number(it.unit_price || it.retail_price || 0),
        supply_price: Number(it.supply_price ?? 0),
        retail_price: Number(it.retail_price ?? it.unit_price ?? 0),
        unit: it.unit || 'pcs',
      })) } as any).then(()=> {
        toast.success('Your order has been saved successfully.')
      }).catch(()=>{})
      return next
    })
  }

  const updateItem = (idx:number, field:string, value:any) => { const next=[...items]; next[idx] = { ...next[idx], [field]: ['quantity','unit_price','supply_price','retail_price'].includes(field) ? Number(value)||0 : value }; if(['quantity','unit_price','retail_price'].includes(field)){ const q=Number(next[idx].quantity)||0, up=Number(next[idx].retail_price ?? next[idx].unit_price)||0; next[idx].total_price=+(q*up).toFixed(2) } setItems(next) }

  const formatCurrency = (v:number) => new Intl.NumberFormat('ru-RU').format(Number(v||0))
  const safeDate = (d?:string) => { if(!d) return '—'; try{ return new Date(d).toLocaleString('ru-RU') } catch { return '—' } }

  // products for table
  const { data: productPage, isLoading: listLoading } = useQuery({
    queryKey: ['products-list', term, page, limit, productFilter],
    queryFn: async ()=> {
      const params: any = { page, limit, search: term }
      if (productFilter === 'low') params.low_stock = true
      if (productFilter === 'zero') params.zero_stock = true
      return productsService.list(params)
    },
    enabled: productFilter !== 'ordered'
  })

  // Auto-order by full barcode scan
  useEffect(()=>{
    const code = (term||'').trim()
    if (activeTab !== 'products') return
    if (!code || !/^\d{8,14}$/.test(code)) return
    const t = setTimeout(async ()=>{
      if (code === lastScan) return
      try {
        const res:any = await productsService.list({ page:1, limit:10, search: code })
        const found = (res?.items||[]).find((p:any)=> String(p?.barcode||'') === code)
        if (found) {
          addOrIncrementProduct(found, 1)
          setTerm('')
          setLastScan(code)
        }
      } catch {}
    }, 200)
    return ()=> clearTimeout(t)
  }, [term, activeTab, lastScan])

  const tableRows = useMemo(()=>{
    if (productFilter === 'ordered') {
      const src = (items || []).filter((it:any)=> {
        if (!term) return true
        const v = (String(it.product_name||'') + ' ' + String(it.product_sku||'')).toLowerCase()
        return v.includes(term.toLowerCase())
      })
      return src.map((it:any, idx:number)=> ({
        id: it.product_id || idx,
        product_id: it.product_id,
        product_name: it.product_name,
        product_sku: it.product_sku,
        barcode: (it.barcode || (it.product_id && prodCache[it.product_id]?.barcode) || '-') as any,
        declared: it.declared || 0,
        // current stock from cache when available
        ...(it.product_id && prodCache[it.product_id] ? { declared: prodCache[it.product_id].stock || 0 } : {}),
        supply_price: Number(it.supply_price ?? it.unit_price ?? 0),
        retail_price: Number(it.retail_price ?? it.unit_price ?? 0),
        qty: Number(it.quantity || it.qty || 0),
      }))
    }
    const list = (productPage?.items || []) as any[]
    return list.map((p:any)=> {
      const inDoc = (items||[]).find((x:any)=> x.product_id === p.id)
      return {
        id: p.id,
        product_id: p.id,
        product_name: p.name,
        product_sku: p.sku,
        barcode: p.barcode,
        declared: p.stock || 0,
        supply_price: p.cost_price || 0,
        retail_price: p.price || 0,
        qty: inDoc ? (inDoc.quantity || inDoc.qty || 0) : 0,
      }
    })
  }, [productFilter, productPage, items, term, prodCache])

  const totalCount = productFilter === 'ordered' ? (tableRows?.length || 0) : (productPage?.total || 0)

  const columns: CustomColumn[] = useMemo(()=> {
    const base: CustomColumn[] = [
      { uid: 'product_name', name: t('writeoff.detail.table.name'), className: 'min-w-[260px]' },
      { uid: 'product_sku', name: 'SKU' },
      { uid: 'barcode', name: t('writeoff.detail.table.barcode') },
      { uid: 'declared', name: t('writeoff.detail.table.current') },
      { uid: 'supply_price', name: t('writeoff.detail.table.supply') },
      { uid: 'markup', name: 'Mark Up (%)' },
      { uid: 'retail_price', name: t('writeoff.detail.table.retail') },
      { uid: 'qty', name: t('orders.table.qty') },
    ]
    const canAdd = !order?.is_finished && productFilter !== 'ordered'
    return canAdd ? [...base, { uid: 'actions', name: t('common.actions') }] : base
  }, [t, order?.is_finished, productFilter])

  const renderCell = (row: any, key: string) => {
    switch (key) {
      case 'product_name':
        return <button className="text-primary underline-offset-2 hover:underline" onClick={()=> navigate(`/products/catalog/${row.product_id}/edit`)}>{row.product_name}</button>
      case 'declared':
        return Number(row.declared||0)
      case 'supply_price': {
        if (order?.is_finished) return `${Intl.NumberFormat('ru-RU').format(row.supply_price||0)} UZS`
        const idx = items.findIndex((x:any)=> x.product_id === row.product_id)
        const onChange = (v: string) => {
          if (idx >= 0) {
            const next = [...items]
            const val = Number(v||0)
            next[idx].supply_price = val
            // if markup present, recalc retail
            const mu = Number(next[idx].markup || 0)
            if (!isNaN(mu) && isFinite(mu)) {
              next[idx].retail_price = Math.round(val * (1 + mu/100))
            }
            const q = Number(next[idx].quantity||next[idx].qty||0)
            const rp = Number(next[idx].retail_price||next[idx].unit_price||0)
            next[idx].total_price = +(q*rp).toFixed(2)
            setItems(next)
          }
        }
        if (idx < 0) return `${Intl.NumberFormat('ru-RU').format(row.supply_price||0)} UZS`
        return <Input type="number" value={String(items[idx]?.supply_price ?? row.supply_price ?? 0)} onValueChange={onChange} className="w-48" classNames={{ inputWrapper:'h-10' }} />
      }
      case 'markup': {
        if (order?.is_finished) return `${Number(row.markup ?? (((Number(row.retail_price||0) - Number(row.supply_price||0)) / Math.max(1, Number(row.supply_price||0))) * 100))}%`
        const idx = items.findIndex((x:any)=> x.product_id === row.product_id)
        const currentMu = idx >= 0 ? (items[idx]?.markup ?? ((Number(items[idx]?.supply_price||0)>0) ? (((Number(items[idx]?.retail_price||0) - Number(items[idx]?.supply_price||0)) / Number(items[idx]?.supply_price||0)) * 100) : 0)) : ((Number(row.supply_price||0)>0) ? (((Number(row.retail_price||0) - Number(row.supply_price||0)) / Number(row.supply_price||0)) * 100) : 0)
        const onChange = (v: string) => {
          if (idx >= 0) {
            const next = [...items]
            const mu = Number(v||0)
            next[idx].markup = mu
            const supply = Number(next[idx].supply_price||0)
            next[idx].retail_price = Math.round(supply * (1 + (isNaN(mu)?0:mu)/100))
            const q = Number(next[idx].quantity||next[idx].qty||0)
            const rp = Number(next[idx].retail_price||next[idx].unit_price||0)
            next[idx].total_price = +(q*rp).toFixed(2)
            setItems(next)
          }
        }
        if (idx < 0) return <span>{String(Math.round((currentMu + Number.EPSILON)*100)/100)}%</span>
        return <Input type="number" value={String(Math.round((currentMu + Number.EPSILON)*100)/100)} onValueChange={onChange} className="w-32" classNames={{ inputWrapper:'h-10' }} endContent={<span className="text-foreground/60 text-xs">%</span>} />
      }
      case 'retail_price': {
        if (order?.is_finished) return `${Intl.NumberFormat('ru-RU').format(row.retail_price||0)} UZS`
        const idx = items.findIndex((x:any)=> x.product_id === row.product_id)
        const onChange = (v: string) => {
          if (idx >= 0) {
            const next = [...items]
            const val = Number(v||0)
            next[idx].retail_price = val
            // update markup accordingly if supply > 0
            const supply = Number(next[idx].supply_price||0)
            if (supply > 0) {
              next[idx].markup = Math.round(((val/supply - 1) * 100) * 100) / 100
            }
            const q = Number(next[idx].quantity||next[idx].qty||0)
            next[idx].total_price = +(q*val).toFixed(2)
            setItems(next)
          }
        }
        if (idx < 0) return `${Intl.NumberFormat('ru-RU').format(row.retail_price||0)} UZS`
        return <Input type="number" value={String(items[idx]?.retail_price ?? row.retail_price ?? 0)} onValueChange={onChange} className="w-48" classNames={{ inputWrapper:'h-10' }} />
      }
      case 'qty': {
        const idx = items.findIndex((x:any)=> x.product_id === row.product_id)
        const onChange = (v: string) => {
          const val = Math.max(0, Number(v||0))
          if (idx >= 0) { updateItem(idx, 'quantity', val) }
        }
        return !order?.is_finished ? (
          idx >= 0 ? <Input type="number" value={String(items[idx]?.quantity ?? items[idx]?.qty ?? 0)} onValueChange={onChange} className="w-32" classNames={{ inputWrapper:'h-10' }} /> : <span>0</span>
        ) : <span>{idx >= 0 ? (items[idx]?.quantity ?? items[idx]?.qty ?? 0) : 0}</span>
      }
      case 'actions': {
        if (order?.is_finished || productFilter === 'ordered') return null
        const inDoc = (items||[]).find((x:any)=> x.product_id === row.product_id)
        return (
          <div className="flex justify-end">
            {!inDoc ? (
              <Button size="sm" color="primary" onPress={()=> attachProduct({ id: row.product_id, name: row.product_name, sku: row.product_sku, price: row.retail_price, cost_price: row.supply_price })}>Order</Button>
            ) : null}
          </div>
        )
      }
      default:
        return row[key]
    }
  }

  if (loading) return <CustomMainBody><div className="p-6">Loading...</div></CustomMainBody>
  if (!order) return <CustomMainBody><div className="p-6">Not found</div></CustomMainBody>

  return (
    <CustomMainBody>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold">{order.name}</h1>
          <div className="text-foreground/60 text-sm">{order?.supplier?.name} • {order?.shop?.name}</div>
        </div>
        <div className="flex gap-2 items-center">
          <Button variant="flat" color="primary" onPress={()=> setIsPaymentModalOpen(true)}>Add payment</Button>
          {String(order?.status_id).toLowerCase() === 'rejected' ? (
            <Chip color="danger" variant="flat">Rejected</Chip>
          ) : order?.is_finished ? (
            <Chip color="success" variant="flat">Accepted</Chip>
          ) : (
            <>
              <Button color="danger" variant="flat" onPress={()=> setConfirm({ open:true, action:'reject' })}>Reject</Button>
              <Button color="success" onPress={()=> setConfirm({ open:true, action:'approve' })}>Accept</Button>
            </>
          )}
          <Button color="primary" variant="bordered" onPress={()=>navigate(-1)} startContent={<ArrowLeftIcon className="h-4 w-4" />}>Back</Button>
        </div>
      </div>

      <Tabs aria-label="Order tabs" color="primary" variant="bordered" selectedKey={activeTab} onSelectionChange={(k)=>setActiveTab(k as any)} className="w-full" classNames={{ tabList: 'w-full h-14', tab: 'h-12' }}>
        <Tab key="products" title={<div className="flex items-center space-x-2"><span>{t('products.header')}</span></div>}>
          <div className="mt-4">
            <CustomTable
              key={`${productFilter}-${order?.is_finished ? 'locked' : 'open'}`}
              columns={columns}
              items={tableRows as any}
              total={totalCount}
              page={productFilter==='ordered' ? 1 : page}
              limit={productFilter==='ordered' ? (tableRows.length || 10) : limit}
              onPageChange={setPage}
              onLimitChange={setLimit}
              renderCell={renderCell}
              searchValue={term}
              onSearchChange={setTerm}
              onSearchClear={()=> setTerm('')}
              isLoading={!order?.is_finished && productFilter!=='ordered' && listLoading}
              topTabs={!order?.is_finished ? [
                { key:'ordered', label:'Ordered' },
                { key:'all', label:'All stocks' },
                { key:'low', label:'Low stock' },
                { key:'zero', label:'Zero stock' },
              ] : undefined}
              activeTabKey={productFilter}
              onTabChange={(k)=> { setProductFilter(k as any); setPage(1) }}
            />
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
                    <Button color="primary" onPress={()=> setIsPaymentModalOpen(true)} className="inline-flex items-center gap-2"><span className="text-xl">+</span> Добавить оплату</Button>
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

      <ConfirmModal
        isOpen={confirm.open}
        title={confirm.action==='approve' ? 'Confirm accept order?' : 'Confirm reject order?'}
        description={confirm.action==='approve' ? 'This will accept the order and update product stocks.' : 'The order will be marked as rejected.'}
        confirmText={confirm.action==='approve' ? 'Accept' : 'Reject'}
        confirmColor={confirm.action==='approve' ? 'success' : 'danger'}
        onConfirm={async ()=> { const action = confirm.action; setConfirm({ open:false }); if (action) { await ordersService.update(String(id), { action } as any); const fresh = await ordersService.get(String(id)); setOrder(fresh); setProductFilter('ordered') } }}
        onClose={()=> setConfirm({ open:false })}
      />

      {isPaymentModalOpen && (
        <CustomModal title="Оплата по заказу" isOpen={isPaymentModalOpen} onOpenChange={setIsPaymentModalOpen} onSubmit={async ()=>{ await ordersService.addPayment(String(id), { amount: Number(paymentForm.amount||0), payment_method: paymentForm.payment_method, description: paymentForm.description }); setIsPaymentModalOpen(false); await fetchPayments() }} submitLabel={'Добавить оплату'} isSubmitting={false}>
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