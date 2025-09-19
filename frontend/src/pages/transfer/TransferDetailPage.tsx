import { useEffect, useMemo, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router-dom'
import CustomMainBody from '../../components/common/CustomMainBody'
import CustomTable, { CustomColumn } from '../../components/common/CustomTable'
import { transfersService } from '../../services/transfersService'
import { productsService } from '../../services/productsService'
import { Button, Input } from '@heroui/react'
import ConfirmModal from '../../components/common/ConfirmModal'
import { BanknotesIcon, CubeIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline'
import { useTranslation } from 'react-i18next'
import useCurrency from '../../hooks/useCurrency'

export default function TransferDetailPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const qc = useQueryClient()
  const { t } = useTranslation()
  const { format: fmt } = useCurrency()

  const { data: doc } = useQuery({ queryKey: ['transfer', id], queryFn: ()=> transfersService.get(id!), enabled: !!id })

  const [term, setTerm] = useState('')
  const [items, setItems] = useState<any[]>([])
  const [confirm, setConfirm] = useState<{ open: boolean; action?: 'approve'|'reject' }>(()=> ({ open:false }))

  useEffect(()=> { setItems(doc?.items || []) }, [doc])

  const { data: productPage } = useQuery({ queryKey: ['products-list', term], queryFn: ()=> productsService.list({ page:1, limit:200, search: term, exclude_types:['SET','SERVICE'] }), placeholderData: (p)=> p })
  const productRows = useMemo(()=> ((productPage?.items||[]) as any[]).map((p:any)=> {
    const inDoc = (items||[]).find((x:any)=> x.product_id === p.id)
    return {
      product_id: p.id,
      product_name: p.name,
      product_sku: p.sku,
      barcode: p.barcode,
      stock: p.stock || 0,
      supply_price: inDoc ? inDoc.supply_price ?? p.cost_price ?? 0 : (p.cost_price || 0),
      retail_price: inDoc ? inDoc.retail_price ?? p.price ?? 0 : (p.price || 0),
      qty: inDoc ? inDoc.qty : 0,
    }
  }), [productPage, items])

  const updateMutation = useMutation({
    mutationFn: async (payload: any) => transfersService.update(id!, payload),
    onSuccess: async ()=> {
      await qc.invalidateQueries({ queryKey: ['transfer', id] })
      await qc.invalidateQueries({ queryKey: ['transfers'] })
      await qc.invalidateQueries({ predicate: (q)=> Array.isArray(q.queryKey) && String(q.queryKey[0]).startsWith('products') })
    }
  }) as any

  const save = () => updateMutation.mutate({ items: (items||[]).map((it:any)=> ({
    product_id: it.product_id,
    product_name: it.product_name,
    product_sku: it.product_sku,
    barcode: it.barcode,
    qty: Number(it.qty||0),
    unit: 'pcs',
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

  const totalQty = useMemo(()=> (items||[]).reduce((s:any,it:any)=> s+Number(it.qty||0), 0), [items])
  const totalPrice = useMemo(()=> (items||[]).reduce((s:any, it:any)=> s + Number(it.qty||0) * Number(it.retail_price||0), 0), [items])

  const columns: CustomColumn[] = useMemo(()=> ([
    { uid: 'product_name', name: t('transfer.detail.table.name') },
    { uid: 'product_sku', name: t('transfer.detail.table.sku') },
    { uid: 'barcode', name: t('transfer.detail.table.barcode') },
    { uid: 'stock', name: t('transfer.detail.table.current') },
    { uid: 'supply_price', name: t('repricing.detail.table.old_supply','Supplier price') },
    { uid: 'retail_price', name: t('repricing.detail.table.old_retail','Retail price') },
    { uid: 'qty', name: t('transfer.detail.table.qty') },
  ]), [t])

  const renderCell = (row: any, key: string) => {
    switch (key) {
      case 'product_name':
        return <button className="text-primary underline-offset-2 hover:underline" onClick={()=> navigate(`/products/catalog/${row.product_id}/edit`)}>{row.product_name}</button>
      case 'stock': return Number(row.stock||0)
      case 'supply_price': return fmt(Number(row.supply_price||0))
      case 'retail_price': return fmt(Number(row.retail_price||0))
      case 'qty': {
        const onChange = (v: string) => {
          const val = Number(v||0)
          const max = Number(row.stock||0)
          const clamped = Math.max(0, Math.min(val, max))
          setItems(prev => {
            const idx = prev.findIndex((x:any)=> x.product_id === row.product_id)
            if (idx >= 0) { const next=[...prev]; next[idx] = { ...next[idx], qty: clamped, supply_price: row.supply_price, retail_price: row.retail_price }; return next }
            return [...prev, { ...row, qty: clamped, supply_price: row.supply_price, retail_price: row.retail_price }]
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

  const report = () => {
    const w = window.open('', '_blank')!
    const fmtNum = (n:number)=> Intl.NumberFormat('ru-RU').format(n)
    const html = `<!DOCTYPE html><html><head><meta charset='UTF-8'/><title>${t('transfer.header')} №${doc?.external_id||''}</title><style>@page{size:A4 portrait;margin:14mm}body{font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;font-size:12px}table{width:100%;border-collapse:collapse}th,td{border:1px solid #ddd;padding:6px;text-align:left}h1{font-size:18px;margin:0 0 12px}</style></head><body>
      <h1>${t('transfer.header')} №${doc?.external_id||''}</h1>
      <div>${t('transfer.detail.departure')}: ${doc?.departure_shop_name || '-'}</div>
      <div>${t('transfer.detail.arrival')}: ${doc?.arrival_shop_name || '-'}</div>
      <div>${t('transfer.detail.qty_products')}: ${totalQty}</div>
      <div>${t('transfer.detail.amount')}: ${fmtNum(totalPrice)} UZS</div>
      <br/>
      <table><thead><tr><th>${t('transfer.detail.table.name')}</th><th>${t('transfer.detail.table.sku')}</th><th>${t('transfer.detail.table.barcode')}</th><th>${t('transfer.detail.table.current')}</th><th>${t('transfer.detail.table.qty')}</th></tr></thead><tbody>
        ${(productRows||[]).map(it=> `<tr><td>${it.product_name}</td><td>${it.product_sku}</td><td>${it.barcode}</td><td>${it.stock||0}</td><td>${it.qty||0}</td></tr>`).join('')}
      </tbody></table>
    </body></html>`
    w.document.write(html); w.document.close(); w.focus(); w.print()
  }

  return (
    <CustomMainBody>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold">{doc?.name || t('transfer.header')}</h1>
        <div className="flex items-center gap-2">
          <Button variant="flat" onPress={()=> navigate('/products/transfer')}>{t('transfer.detail.back')}</Button>
          {doc?.status === 'NEW' && (<>
            <Button color="danger" variant="flat" onPress={reject}>{t('transfer.detail.reject')}</Button>
            <Button color="primary" onPress={approve}>{t('transfer.detail.approve')}</Button>
          </>)}
          <Button variant="flat" onPress={report} startContent={<ArrowDownTrayIcon className="h-4 w-4" />}>{t('inventory.detail.report','Download')}</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8 mt-4">
        <div className="rounded-2xl bg-gray-900 border border-gray-700 p-5 flex items-center justify-between">
          <div>
            <div className="text-sm text-gray-200">{t('transfer.detail.departure')}</div>
            <div className="mt-2 text-2xl font-semibold tracking-wide"><span className="text-blue-500">{doc?.departure_shop_name || '-'}</span></div>
          </div>
          <div className="h-11 w-11 rounded-full bg-gray-800 flex items-center justify-center"><CubeIcon className="h-6 w-6 text-blue-500" /></div>
        </div>
        <div className="rounded-2xl bg-gray-900 border border-gray-700 p-5 flex items-center justify-between">
          <div>
            <div className="text-sm text-gray-200">{t('transfer.detail.arrival')}</div>
            <div className="mt-2 text-2xl font-semibold tracking-wide"><span className="text-blue-500">{doc?.arrival_shop_name || '-'}</span></div>
          </div>
          <div className="h-11 w-11 rounded-full bg-gray-800 flex items-center justify-center"><CubeIcon className="h-6 w-6 text-blue-500" /></div>
        </div>
        <div className="rounded-2xl bg-gray-900 border border-gray-700 p-5 flex items-center justify-between">
          <div>
            <div className="text-sm text-gray-200">{t('transfer.detail.qty_products')}</div>
            <div className="mt-2 text-2xl font-semibold tracking-wide"><span className="text-blue-500">{totalQty}</span> <span className="text-gray-300 text-base ml-1">{t('writeoff.detail.units')}</span></div>
          </div>
          <div className="h-11 w-11 rounded-full bg-gray-800 flex items-center justify-center"><CubeIcon className="h-6 w-6 text-blue-500" /></div>
        </div>
        <div className="rounded-2xl bg-gray-900 border border-gray-700 p-5 flex items-center justify-between">
          <div>
            <div className="text-sm text-gray-200">{t('transfer.detail.amount')}</div>
            <div className="mt-2 text-2xl font-semibold tracking-wide"><span className="text-blue-500">{fmt(totalPrice)}</span></div>
          </div>
          <div className="h-11 w-11 rounded-full bg-gray-800 flex items-center justify-center"><BanknotesIcon className="h-6 w-6 text-blue-500" /></div>
        </div>
      </div>

      <CustomTable
        columns={columns}
        items={productRows}
        total={productRows.length}
        page={1}
        limit={productRows.length || 10}
        renderCell={renderCell}
        onPageChange={()=>{}}
        onLimitChange={()=>{}}
        searchValue={term}
        onSearchChange={setTerm}
        onSearchClear={()=> setTerm('')}
        rightAction={doc?.status === 'NEW' && <Button color="primary" variant="flat" onPress={save} isLoading={updateMutation.isPending}>{t('transfer.detail.save')}</Button>}
      />

      <ConfirmModal
        isOpen={confirm.open}
        title={confirm.action==='approve' ? t('transfer.detail.confirm_approve_title') : t('transfer.detail.confirm_reject_title')}
        description={confirm.action==='approve' ? t('transfer.detail.confirm_approve_desc') : t('transfer.detail.confirm_reject_desc')}
        confirmText={confirm.action==='approve' ? t('transfer.detail.approve') : t('transfer.detail.reject')}
        confirmColor={confirm.action==='approve' ? 'primary' : 'danger'}
        onConfirm={doConfirm}
        onClose={()=> setConfirm({ open:false })}
      />
    </CustomMainBody>
  )
} 