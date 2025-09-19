import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import CustomMainBody from '../../components/common/CustomMainBody'
import CustomTable, { CustomColumn } from '../../components/common/CustomTable'
import { writeoffsService } from '../../services/writeoffsService'
import { productsService } from '../../services/productsService'
import { Button, Input } from '@heroui/react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { ArrowLeftIcon, BanknotesIcon, CubeIcon } from '@heroicons/react/24/outline'
import ConfirmModal from '../../components/common/ConfirmModal'
import { useTranslation } from 'react-i18next'
import { toast } from 'react-toastify'
import useCurrency from '../../hooks/useCurrency'

export default function WriteOffDetailPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const qc = useQueryClient()
  const { t } = useTranslation()
  const { format: fmt } = useCurrency()

  const [sp, setSp] = useSearchParams()
  const tab = (sp.get('tab') || 'writeoff') as 'writeoff' | 'all'
  const setTab = (k: string) => { const next = new URLSearchParams(sp); next.set('tab', k); setSp(next) }

  const { data: doc } = useQuery({ queryKey: ['writeoff', id], queryFn: ()=> writeoffsService.get(id!), enabled: !!id })

  const [term, setTerm] = useState('')
  const [items, setItems] = useState<any[]>([])
  const [confirm, setConfirm] = useState<{ open: boolean; action?: 'approve'|'reject' }>(()=> ({ open:false }))

  useEffect(()=> { setItems(doc?.items || []) }, [doc])

  // fetch all products for the table, filter by term
  const { data: productPage } = useQuery({ queryKey: ['products-list', term], queryFn: ()=> productsService.list({ page:1, limit:200, search: term, exclude_types:['SET','SERVICE'] }), placeholderData: (p)=> p })

  const allStocksRows = useMemo(()=> ((productPage?.items||[]) as any[]).map((p:any)=> ({
    product_id: p.id,
    product_name: p.name,
    product_sku: p.sku,
    barcode: p.barcode,
    declared: p.stock || 0,
    supply_price: p.cost_price || 0,
    retail_price: p.price || 0,
  })), [productPage])

  const allStocksWithQty = useMemo(()=> (allStocksRows||[]).map((p:any)=> {
    const inDoc = (items||[]).find((x:any)=> x.product_id === p.product_id)
    return { ...p, qty: inDoc ? inDoc.qty : 0 }
  }), [allStocksRows, items])

  const productRows = useMemo(()=> ((productPage?.items||[]) as any[]).map((p:any)=> {
    const inDoc = (items||[]).find((x:any)=> x.product_id === p.id)
    return {
      product_id: p.id,
      product_name: p.name,
      product_sku: p.sku,
      barcode: p.barcode,
      declared: p.stock || 0,
      supply_price: p.cost_price || 0,
      retail_price: p.price || 0,
      qty: inDoc ? inDoc.qty : 0,
    }
  }), [productPage, items])

  const updateMutation = useMutation({
    mutationFn: async (payload: any) => writeoffsService.update(id!, payload),
    onSuccess: async ()=> {
      await qc.invalidateQueries({ queryKey: ['writeoff', id] })
      await qc.invalidateQueries({ queryKey: ['writeoffs'] })
      await qc.invalidateQueries({ predicate: (q)=> Array.isArray(q.queryKey) && String(q.queryKey[0]).startsWith('products') })
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to save write-off items')
    }
  }) as any

  const saveItems = (nextItems: any[]) => updateMutation.mutate({ items: (nextItems||[]).map((it:any)=> ({
    product_id: it.product_id,
    product_name: it.product_name,
    product_sku: it.product_sku,
    barcode: it.barcode,
    qty: Number(it.qty||0),
    unit: it.unit || 'pcs',
    supply_price: Number(it.supply_price||0),
    retail_price: Number(it.retail_price||0),
  })) })
  const approve = () => setConfirm({ open:true, action:'approve' })
  const reject = () => setConfirm({ open:true, action:'reject' })
  const doConfirm = () => {
    if (confirm.action === 'approve') updateMutation.mutate({ action: 'approve' })
    if (confirm.action === 'reject') updateMutation.mutate({ action: 'reject' })
    setConfirm({ open:false })
  }

  const totalSupply = useMemo(()=> (items||[]).reduce((s:any, it:any)=> s + Number(it.qty||0) * Number(it.supply_price||0), 0), [items])
  const totalRetail = useMemo(()=> (items||[]).reduce((s:any, it:any)=> s + Number(it.qty||0) * Number(it.retail_price||0), 0), [items])
  const totalQty = useMemo(()=> (items||[]).reduce((s:any,it:any)=> s+Number(it.qty||0), 0), [items])

  // Columns: always include qty
  const columns: CustomColumn[] = useMemo(()=> ([
    { uid: 'product_name', name: t('writeoff.detail.table.name'), className: 'min-w-[260px]' },
    { uid: 'product_sku', name: t('writeoff.detail.table.sku') },
    { uid: 'barcode', name: t('writeoff.detail.table.barcode') },
    { uid: 'declared', name: t('writeoff.detail.table.current') },
    { uid: 'supply_price', name: t('writeoff.detail.table.supply') },
    { uid: 'retail_price', name: t('writeoff.detail.table.retail') },
    { uid: 'qty', name: t('writeoff.detail.table.writeoff') },
  ]), [t])

  const tableItems = useMemo(()=> {
    if (doc?.status !== 'NEW') return (items||[]).map((it:any)=> ({
      product_id: it.product_id,
      product_name: it.product_name,
      product_sku: it.product_sku,
      barcode: it.barcode,
      declared: it.declared || 0,
      supply_price: it.supply_price || 0,
      retail_price: it.retail_price || 0,
      qty: it.qty || 0,
    }))
    if (tab === 'all') return allStocksWithQty
    // write-off tab: only rows with qty > 0
    return productRows.filter((r:any)=> Number(r.qty||0) > 0)
  }, [doc, tab, allStocksWithQty, productRows, items])

  const renderCell = (row: any, key: string) => {
    switch (key) {
      case 'product_name':
        return <button className="text-primary underline-offset-2 hover:underline" onClick={()=> navigate(`/products/catalog/${row.product_id}/edit`)}>{row.product_name}</button>
      case 'declared':
        return Number(row.declared||0)
      case 'supply_price':
        return fmt(Number(row.supply_price||0))
      case 'retail_price':
        return fmt(Number(row.retail_price||0))
      case 'qty': {
        const onChange = (v: string) => {
          const val = Number(v||0)
          const max = Number(row.declared||0)
          const clamped = Math.max(0, Math.min(val, max))
          setItems(prev => {
            const idx = prev.findIndex((x:any)=> x.product_id === row.product_id)
            const next = idx >= 0 ? (()=>{ const n=[...prev]; n[idx] = { ...n[idx], qty: clamped, product_id: row.product_id, product_name: row.product_name, product_sku: row.product_sku, barcode: row.barcode, supply_price: row.supply_price, retail_price: row.retail_price }; return n })() : [...prev, { ...row, qty: clamped }]
            // auto-save
            saveItems(next)
            return next
          })
        }
        return doc?.status === 'NEW' ? (
          <Input type="number" value={String(row.qty||0)} onValueChange={onChange} classNames={{ inputWrapper:'h-9' }} />
        ) : <span>{row.qty||0}</span>
      }
      default:
        return row[key]
    }
  }

  return (
    <CustomMainBody>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold">{doc?.name || t('writeoff.header')}</h1>
        <div className="flex items-center gap-2">
          <Button color="primary" startContent={<ArrowLeftIcon className="w-4 h-4" />} onPress={()=> navigate('/products/writeoff')}>{t('writeoff.detail.back')}</Button>
          {doc?.status === 'NEW' && (<><Button color="danger" variant="flat" onPress={reject}>{t('writeoff.detail.reject')}</Button><Button color="success" onPress={approve}>{t('writeoff.detail.writeoff') || 'Accept'}</Button></>)}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 mt-4">
        <div className="rounded-2xl bg-gray-900 border border-gray-700 p-5 flex items-center justify-between">
          <div>
            <div className="text-sm text-gray-200">{t('writeoff.detail.shop')}</div>
            <div className="mt-2 text-2xl font-semibold tracking-wide"><span className="text-blue-500">{doc?.shop_name || '-'}</span></div>
          </div>
          <div className="h-11 w-11 rounded-full bg-gray-800 flex items-center justify-center"><CubeIcon className="h-6 w-6 text-blue-500" /></div>
        </div>
        <div className="rounded-2xl bg-gray-900 border border-gray-700 p-5 flex items-center justify-between">
          <div>
            <div className="text-sm text-gray-200">{t('writeoff.detail.qty_products')}</div>
            <div className="mt-2 text-2xl font-semibold tracking-wide"><span className="text-blue-500">{totalQty}</span> <span className="text-gray-300 text-base ml-1">{t('writeoff.detail.units')}</span></div>
          </div>
          <div className="h-11 w-11 rounded-full bg-gray-800 flex items-center justify-center"><CubeIcon className="h-6 w-6 text-blue-500" /></div>
        </div>
        <div className="rounded-2xl bg-gray-900 border border-gray-700 p-5 flex items-center justify-between">
          <div>
            <div className="text-sm text-gray-200">{t('writeoff.detail.amount_supply')}</div>
            <div className="mt-2 text-2xl font-semibold tracking-wide"><span className="text-blue-500">{fmt(totalSupply)}</span></div>
          </div>
          <div className="h-11 w-11 rounded-full bg-gray-800 flex items-center justify-center"><BanknotesIcon className="h-6 w-6 text-blue-500" /></div>
        </div>
        <div className="rounded-2xl bg-gray-900 border border-gray-700 p-5 flex items-center justify-between">
          <div>
            <div className="text-sm text-gray-200">{t('writeoff.detail.amount_retail')}</div>
            <div className="mt-2 text-2xl font-semibold tracking-wide"><span className="text-blue-500">{fmt(totalRetail)}</span></div>
          </div>
          <div className="h-11 w-11 rounded-full bg-gray-800 flex items-center justify-center"><BanknotesIcon className="h-6 w-6 text-blue-500" /></div>
        </div>
      </div>

      <CustomTable
        columns={columns}
        items={tableItems}
        total={tableItems.length}
        page={1}
        limit={tableItems.length || 10}
        renderCell={renderCell}
        onPageChange={()=>{}}
        onLimitChange={()=>{}}
        searchValue={term}
        onSearchChange={setTerm}
        onSearchClear={()=> setTerm('')}
        topTabs={doc?.status === 'NEW' ? [{ key:'writeoff', label:'Write-Off' }, { key:'all', label:'All Stocks' }] : undefined}
        activeTabKey={doc?.status === 'NEW' ? tab : undefined}
        onTabChange={(k)=> setTab(k)}
      />

      <ConfirmModal
        isOpen={confirm.open}
        title={confirm.action==='approve' ? t('writeoff.detail.confirm_writeoff_title') : t('writeoff.detail.confirm_reject_title')}
        description={confirm.action==='approve' ? t('writeoff.detail.confirm_writeoff_desc') : t('writeoff.detail.confirm_reject_desc')}
        confirmText={confirm.action==='approve' ? (t('writeoff.detail.writeoff') || 'Accept') : t('writeoff.detail.reject')}
        confirmColor={confirm.action==='approve' ? 'success' : 'danger'}
        onConfirm={doConfirm}
        onClose={()=> setConfirm({ open:false })}
      />
    </CustomMainBody>
  )
}

function StatCard({ title, value }: { title: string; value: any }) {
  return (
    <div className="rounded-xl border border-default-200 p-4">
      <div className="text-xs text-default-500 mb-1">{title}</div>
      <div className="font-semibold">{value}</div>
    </div>
  )
} 