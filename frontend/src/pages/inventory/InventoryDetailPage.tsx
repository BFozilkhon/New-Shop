import { useMemo, useState, useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import CustomMainBody from '../../components/common/CustomMainBody'
import { inventoriesService } from '../../services/inventoriesService'
import { productsService } from '../../services/productsService'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { Button, Tabs, Tab, Input } from '@heroui/react'
import { ArrowLeftIcon, CubeIcon, ArrowTrendingUpIcon, BanknotesIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import ConfirmModal from '../../components/common/ConfirmModal'
import { toast } from 'react-toastify'
import CustomTable, { type CustomColumn } from '../../components/common/CustomTable'
import { useTranslation } from 'react-i18next'

export default function InventoryDetailPage() {
  const { t } = useTranslation()
  const { id } = useParams()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [sp, setSp] = useSearchParams()
  const currentTab = (sp.get('tab') as 'results'|'scan') || 'results'
  const { data, refetch } = useQuery({ queryKey: ['inventory', id], queryFn: ()=> inventoriesService.get(String(id)), enabled: !!id })
  const isFinished = !!data?.finished_at

  // Items state for scanning/results
  const [items, setItems] = useState<any[]>([])
  useEffect(()=> { setItems(data?.items || []) }, [data])

  const stats = useMemo(()=> {
    const arr = items || []
    const totalChecked = arr.reduce((s:any, x:any)=> s + Number(x.scanned||0), 0)
    const shortageCount = arr.filter((x:any)=> Number(x.scanned||0) < Number(x.declared||0)).length
    const surplusCount = arr.filter((x:any)=> Number(x.scanned||0) > Number(x.declared||0)).length
    const postponedCount = Number(data?.postponed || 0)
    const differenceSum = Number(data?.difference_sum || 0)
    return { totalChecked, shortageCount, surplusCount, postponedCount, differenceSum }
  }, [items, data])

  // scanning UI state
  const [term, setTerm] = useState('')
  const products = useQuery({
    queryKey: ['products-for-scan', term],
    queryFn: async ()=> term ? productsService.list({ page:1, limit:10, search: term }) : Promise.resolve({ items: [], total: 0 } as any),
    placeholderData: (p)=> p,
  })
  const productResults = useMemo(()=> {
    const arr = (products.data as any)?.items || []
    if (!term) return []
    const tstr = term.toLowerCase()
    return arr.filter((p:any)=>
      String(p.barcode||'').toLowerCase().includes(tstr) ||
      String(p.name||'').toLowerCase().includes(tstr) ||
      String(p.sku||'').toLowerCase().includes(tstr) ||
      String(p.part_number||'').toLowerCase().includes(tstr)
    )
  }, [products.data, term])

  const addProduct = (p:any) => {
    setItems(prev => {
      const idx = prev.findIndex((x:any)=> x.product_id===p.id || x.barcode===p.barcode)
      if (idx >= 0) { const next=[...prev]; next[idx] = { ...next[idx], scanned: Number(next[idx].scanned||0)+1 }; return next }
      return [...prev, { product_id: p.id, product_name: p.name, product_sku: p.sku, barcode: p.barcode, declared: Number(p.stock||0), scanned: 1, unit: 'pcs', price: p.price||0, cost_price: p.cost_price||0 }]
    })
    setTerm('')
  }

  const saveMutation = useMutation({
    mutationFn: async () => inventoriesService.update(String(id), { items: items.map(it=> ({
      product_id: it.product_id,
      product_name: it.product_name,
      product_sku: it.product_sku,
      barcode: it.barcode,
      declared: Number(it.declared||0),
      scanned: Number(it.scanned||0),
      unit: it.unit,
      price: Number(it.price||0),
      cost_price: Number(it.cost_price||0),
    })) }),
    onSuccess: async ()=> { toast.success(t('inventory.toasts.saved')); await qc.invalidateQueries({ queryKey:['inventory', id] }); await refetch() },
    onError: ()=> toast.error(t('inventory.toasts.save_failed'))
  })

  const [confirmFinish, setConfirmFinish] = useState(false)
  const finishMutation = useMutation({
    mutationFn: async () => inventoriesService.update(String(id), { items, finished: true }),
    onSuccess: async ()=> { toast.success(t('inventory.toasts.finished')); await qc.invalidateQueries({ queryKey:['inventory', id] }); await refetch() },
    onError: ()=> toast.error(t('inventory.toasts.finish_failed'))
  })

  const onTabChange = (key: string) => setSp(prev => { const n = new URLSearchParams(prev); n.set('tab', key); return n })

  const downloadReport = () => {
    const shortages = (items||[]).filter((x:any)=> Number(x.scanned||0) < Number(x.declared||0))
    const surpluses = (items||[]).filter((x:any)=> Number(x.scanned||0) > Number(x.declared||0))
    const shortageCost = shortages.reduce((s:any,x:any)=> s + (Number(x.declared||0)-Number(x.scanned||0))*Number(x.cost_price||0), 0)
    const shortageSale = shortages.reduce((s:any,x:any)=> s + (Number(x.declared||0)-Number(x.scanned||0))*Number(x.price||0), 0)
    const surplusCost = surpluses.reduce((s:any,x:any)=> s + (Number(x.scanned||0)-Number(x.declared||0))*Number(x.cost_price||0), 0)
    const surplusSale = surpluses.reduce((s:any,x:any)=> s + (Number(x.scanned||0)-Number(x.declared||0))*Number(x.price||0), 0)
    const fmt = (v:number)=> Intl.NumberFormat('ru-RU').format(v)
    const row = (r:any)=> `<tr><td>${r.product_name||''}</td><td>${r.product_sku||''}</td><td>${r.barcode||''}</td><td>${r.qty}</td><td>${fmt(r.cost)}</td><td>${fmt(r.price)}</td></tr>`
    const rowsShort = shortages.map((x:any)=> ({ qty: Math.max(0, Number(x.declared||0)-Number(x.scanned||0)), cost: Math.max(0, Number(x.declared||0)-Number(x.scanned||0))*Number(x.cost_price||0), price: Math.max(0, Number(x.declared||0)-Number(x.scanned||0))*Number(x.price||0), ...x }))
    const rowsSurp = surpluses.map((x:any)=> ({ qty: Math.max(0, Number(x.scanned||0)-Number(x.declared||0)), cost: Math.max(0, Number(x.scanned||0)-Number(x.declared||0))*Number(x.cost_price||0), price: Math.max(0, Number(x.scanned||0)-Number(x.declared||0))*Number(x.price||0), ...x }))
    const html = `<!DOCTYPE html><html><head><meta charset='UTF-8'/><title>${t('inventory.report.title', { id: data?.external_id ?? '' })}</title><style>@page{size:A4 portrait;margin:14mm}body{font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;font-size:12px}table{width:100%;border-collapse:collapse}th,td{border:1px solid #000;padding:6px}h1{font-size:18px;margin:0} .grid{display:grid;grid-template-columns:1fr 3fr} .cell{border:1px solid #000;padding:8px} .section{border-top:1px solid #000;border-bottom:1px solid #000;padding:6px 8px;font-weight:600;margin-top:8px}</style></head><body>
      <div class='grid'>
        <div class='cell'><h1>${t('inventory.report.title', { id: data?.external_id ?? '' })}</h1></div>
        <div class='cell'>
          <div>${t('inventory.report.store')}: ${data?.shop_name || '-'}</div>
          <div>${t('inventory.report.scanned_products')}: ${(items||[]).length}</div>
          <div>${t('inventory.report.started')}: ${data?.created_at || '-'}</div>
          <div>${t('inventory.report.finished')}: ${data?.finished_at || '-'}</div>
        </div>
      </div>
      <div class='section'>${t('inventory.report.shortages')}</div>
      <table><thead><tr><th>${t('inventory.report.name')}</th><th>${t('inventory.report.sku')}</th><th>${t('inventory.report.barcode')}</th><th>${t('inventory.report.qty')}</th><th>${t('inventory.report.amount_cost')}</th><th>${t('inventory.report.amount_sale')}</th></tr></thead><tbody>
        ${rowsShort.map(row).join('') || `<tr><td colspan='6' style='text-align:center'>-</td></tr>`}
        <tr><td colspan='3'>${t('inventory.report.sum_shortages')}</td><td>${fmt(rowsShort.reduce((s,r)=> s + r.qty, 0))}</td><td>${fmt(shortageCost)}</td><td>${fmt(shortageSale)}</td></tr>
      </tbody></table>
      <div class='section'>${t('inventory.report.surpluses')}</div>
      <table><thead><tr><th>${t('inventory.report.name')}</th><th>${t('inventory.report.sku')}</th><th>${t('inventory.report.barcode')}</th><th>${t('inventory.report.qty')}</th><th>${t('inventory.report.amount_cost')}</th><th>${t('inventory.report.amount_sale')}</th></tr></thead><tbody>
        ${rowsSurp.map(row).join('') || `<tr><td colspan='6' style='text-align:center'>-</td></tr>`}
        <tr><td colspan='3'>${t('inventory.report.sum_surpluses')}</td><td>${fmt(rowsSurp.reduce((s,r)=> s + r.qty, 0))}</td><td>${fmt(surplusCost)}</td><td>${fmt(surplusSale)}</td></tr>
      </tbody></table>
      <table><tbody><tr><td>${t('inventory.report.totals')}</td><td>${t('inventory.report.by_cost')}: ${fmt(surplusCost - shortageCost)}</td><td>${t('inventory.report.by_sale')}: ${fmt(surplusSale - shortageSale)}</td></tr></tbody></table>
    </body></html>`
    const w = window.open('', '_blank')
    if (!w) return
    w.document.write(html)
    w.document.close()
    w.focus()
    w.print()
    w.onafterprint = () => w.close()
  }

  return (
    <CustomMainBody>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-semibold">{data?.name || t('inventory.header')}</h1>
          <div className="text-foreground/60 text-sm">{(data?.type||'FULL') === 'FULL' ? `${t('inventory.modal.full')} ${t('inventory.header').toLowerCase()}` : `${t('inventory.modal.partial')} ${t('inventory.header').toLowerCase()}`} • {data?.shop_name || '-'}</div>
        </div>
        <div className="flex gap-2">
          {currentTab === 'results' ? (
            <Button color="primary" onPress={downloadReport}>{t('inventory.detail.report')}</Button>
          ) : null}
          <Button variant="bordered" startContent={<ArrowLeftIcon className="w-4 h-4" />} onPress={()=> navigate(-1)}>{t('inventory.detail.back')}</Button>
          {!isFinished ? (
            <Button color="success" onPress={()=> setConfirmFinish(true)}>{t('inventory.detail.finish')}</Button>
          ) : null}
        </div>
      </div>

      <Tabs aria-label="Inventory tabs" color="primary" variant="bordered" selectedKey={currentTab} onSelectionChange={(k)=> onTabChange(String(k))} className="w-full" classNames={{ tabList:'w-full h-14', tab:'h-12 flex-1' }}>
        <Tab key="results" title={<div className="flex-1 text-center">{t('inventory.detail.tabs.results')}</div>}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatCard icon={CubeIcon} title={t('inventory.detail.cards.total_checked')} value={`${stats.totalChecked}`} unit={t('inventory.detail.cards.units')} />
            <StatCard icon={ExclamationTriangleIcon} title={t('inventory.detail.cards.shortages_n')} value={`${stats.shortageCount}`} unit={t('inventory.detail.cards.units')} />
            <StatCard icon={ArrowTrendingUpIcon} title={t('inventory.detail.cards.surpluses_n')} value={`${stats.surplusCount}`} unit={t('inventory.detail.cards.units')} />
          </div>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatMoney icon={BanknotesIcon} title={t('inventory.detail.cards.shortages_cost')} value={items.reduce((s:any,x:any)=> s + Math.max(0, Number(x.declared||0)-Number(x.scanned||0)) * Number(x.cost_price||0), 0)} />
            <StatMoney icon={BanknotesIcon} title={t('inventory.detail.cards.shortages_sale')} value={items.reduce((s:any,x:any)=> s + Math.max(0, Number(x.declared||0)-Number(x.scanned||0)) * Number(x.price||0), 0)} />
            <StatMoney icon={BanknotesIcon} title={t('inventory.detail.cards.surplus_cost')} value={items.reduce((s:any,x:any)=> s + Math.max(0, Number(x.scanned||0)-Number(x.declared||0)) * Number(x.cost_price||0), 0)} />
          </div>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatMoney icon={BanknotesIcon} title={t('inventory.detail.cards.surplus_sale')} value={items.reduce((s:any,x:any)=> s + Math.max(0, Number(x.scanned||0)-Number(x.declared||0)) * Number(x.price||0), 0)} />
            <StatCard icon={CubeIcon} title={t('inventory.detail.cards.postponed')} value={`${stats.postponedCount}`} unit={t('inventory.detail.cards.units')} />
          </div>
        </Tab>
        <Tab key="scan" title={<div className="flex-1 text-center">{t('inventory.detail.tabs.scan')}</div>}>
          {!isFinished ? (
            <>
              <div className="flex justify-between gap-3 items-end">
                <Input isClearable value={term} onValueChange={setTerm} onClear={()=>setTerm('')} onKeyDown={(e)=>{ if(e.key==='Enter' && productResults[0]) addProduct(productResults[0]) }} className="w-full sm:max-w-[44%]" classNames={{ inputWrapper: 'h-11 bg-background ring-1 ring-foreground/40 focus-within:ring-foreground/50 rounded-lg', input: 'text-foreground' }} placeholder={t('inventory.detail.scan.placeholder')} size="md"/>
                <div className="flex gap-2">
                  <Button variant="flat" onPress={()=> saveMutation.mutate()} isDisabled={saveMutation.isPending}>{t('inventory.detail.scan.save')}</Button>
                </div>
              </div>
              {term && (
                <div className="border rounded-md overflow-hidden mt-3">
                  <div className="px-3 py-2 text-sm bg-content2 border-b">{t('inventory.detail.scan.found')}: {productResults.length}{products.isLoading? ' (searching...)':''}</div>
                  <div className="max-h-72 overflow-auto divide-y">
                    {productResults.map((p:any)=> (
                      <div key={p.id} className="flex items-center justify-between px-3 py-2 hover:bg-content2/50">
                        <div className="min-w-0"><div className="text-sm font-medium truncate">{p.name}</div><div className="text-xs text-foreground/60">SKU: {p.sku || '-'} • Barcode: {p.barcode || '-'}</div></div>
                        <Button color="primary" size="sm" onPress={()=> addProduct(p)}>{t('inventory.detail.scan.add')}</Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="overflow-auto border rounded-md mt-4">
                <table className="min-w-full divide-y divide-foreground/10">
                  <thead className="bg-background">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs">{t('inventory.detail.table_scan.name')}</th>
                      <th className="px-4 py-2 text-left text-xs">{t('inventory.detail.table_scan.sku')}</th>
                      <th className="px-4 py-2 text-left text-xs">{t('inventory.detail.table_scan.barcode')}</th>
                      <th className="px-4 py-2 text-left text-xs">{t('inventory.detail.table_scan.declared')}</th>
                      <th className="px-4 py-2 text-left text-xs">{t('inventory.detail.table_scan.scanned')}</th>
                      <th className="px-4 py-2 text-left text-xs">{t('inventory.detail.table_scan.diff')}</th>
                      <th className="px-4 py-2 text-left text-xs">{t('inventory.detail.table_scan.diff_amount')}</th>
                      <th className="px-4 py-2 text-left text-xs">{t('inventory.detail.table_scan.activity')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-foreground/10">
                    {items.map((it:any, idx:number)=> {
                      const declared = Number(it.declared||0)
                      const scanned = Number(it.scanned||0)
                      const diffQty = scanned - declared
                      const amount = diffQty > 0 ? diffQty * Number(it.price||0) : diffQty < 0 ? Math.abs(diffQty) * Number(it.cost_price||0) * -1 : 0
                      return (
                        <tr key={idx}>
                          <td className="px-4 py-2 text-sm">{it.product_name}</td>
                          <td className="px-4 py-2 text-sm">{it.product_sku}</td>
                          <td className="px-4 py-2 text-sm">{it.barcode}</td>
                          <td className="px-4 py-2 text-sm">{declared}</td>
                          <td className="px-4 py-2 text-sm w-40">
                            <Input type="number" size="sm" variant="bordered" value={String(scanned)} onValueChange={(v)=> setItems(prev=> { const next=[...prev]; next[idx] = { ...next[idx], scanned: Number(v||0), barcode: it.barcode }; return next })} classNames={{ inputWrapper:'h-9' }} />
                          </td>
                          <td className="px-4 py-2 text-sm">
                            <span className={`${diffQty>0?'text-success-600':diffQty<0?'text-danger-600':'text-foreground/60'}`}>{diffQty>0?`+${diffQty}`:diffQty<0?diffQty:'0'}</span>
                          </td>
                          <td className="px-4 py-2 text-sm">
                            <span className={`${amount>0?'text-success-600':amount<0?'text-danger-600':'text-foreground/60'}`}>{Intl.NumberFormat('ru-RU').format(amount)}</span>
                          </td>
                          <td className="px-4 py-2 text-sm">
                            <div className="flex items-center gap-2">
                              <BadgeDot color={diffQty>0? 'success':'default'} count={diffQty>0?1:0} label="+" />
                              <BadgeDot color={diffQty<0? 'danger':'default'} count={diffQty<0?1:0} label="-" />
                              <BadgeDot color={diffQty===0? 'primary':'default'} count={diffQty===0?1:0} label="=" />
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                    {!items.length && (<tr><td className="px-4 py-6 text-sm text-foreground/60" colSpan={8}>{t('common.no_results')}</td></tr>)}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div className="mt-2">
              <CustomTable
                columns={([
                  { uid:'product_name', name:t('inventory.detail.table_results.name'), className:'w-[30%] min-w-[260px]' },
                  { uid:'product_sku', name:t('inventory.detail.table_results.sku') },
                  { uid:'barcode', name:t('inventory.detail.table_results.barcode') },
                  { uid:'declared', name:t('inventory.detail.table_results.declared') },
                  { uid:'scanned', name:t('inventory.detail.table_results.scanned') },
                  { uid:'diff', name:t('inventory.detail.table_results.diff') },
                ] as CustomColumn[])}
                items={(items||[]).map((x:any)=> ({ ...x, diff: Number(x.scanned||0) - Number(x.declared||0) }))}
                total={(items||[]).length}
                page={1}
                limit={Math.max(10, Math.min(50, (items||[]).length))}
                onPageChange={()=>{}}
                onLimitChange={()=>{}}
                searchValue={''}
                onSearchChange={()=>{}}
                onSearchClear={()=>{}}
                renderCell={(row:any, key:string)=> {
                  switch(key){
                    case 'diff': {
                      const v = Number(row.diff||0)
                      const cls = v>0?'text-success-600':v<0?'text-danger-600':'text-foreground/60'
                      return <span className={cls}>{v>0?`+${v}`:String(v)}</span>
                    }
                    default: return String(row[key] ?? '')
                  }
                }}
                isLoading={false}
              />
            </div>
          )}
        </Tab>
      </Tabs>

      <ConfirmModal
        isOpen={confirmFinish}
        title={t('inventory.detail.confirm_finish_title')}
        description={t('inventory.detail.confirm_finish_desc')}
        confirmText={t('inventory.detail.confirm_finish_btn')}
        confirmColor="success"
        onConfirm={()=> finishMutation.mutate()}
        onClose={()=> setConfirmFinish(false)}
      />
    </CustomMainBody>
  )
}

function BadgeDot({ color, count, label }: { color:'success'|'danger'|'primary'|'default'; count:number; label:string }) {
  const colorClass = color==='success'? 'bg-success-100 text-success-700' : color==='danger'? 'bg-danger-100 text-danger-700' : color==='primary'? 'bg-primary-100 text-primary-700' : 'bg-default-100 text-foreground/60'
  return (
    <div className={`px-2 h-7 rounded-full text-xs flex items-center gap-1 ${colorClass}`}>
      <span>{label}</span>
      <span className="font-semibold">{count}</span>
    </div>
  )
}

function StatCard({ icon: Icon, title, value, unit }: { icon: any; title: string; value: string; unit?: string }) {
  return (
    <div className="rounded-2xl bg-gray-900 border border-gray-700 p-5 flex items-center justify-between">
      <div>
        <div className="text-sm text-gray-200">{title}</div>
        <div className="mt-2 text-2xl font-semibold tracking-wide">
          <span className="text-blue-500">{value}</span>
          {unit ? <span className="text-gray-300 text-base ml-1">{unit}</span> : null}
        </div>
      </div>
      <div className="h-11 w-11 rounded-full bg-gray-800 flex items-center justify-center"><Icon className="h-6 w-6 text-blue-500" /></div>
    </div>
  )
}

function StatMoney({ icon: Icon, title, value }: { icon: any; title: string; value: number }) {
  return (
    <div className="rounded-2xl bg-gray-900 border border-gray-700 p-5 flex items-center justify-between">
      <div>
        <div className="text-sm text-gray-200">{title}</div>
        <div className="mt-2 text-2xl font-semibold tracking-wide"><span className="text-blue-500">{Intl.NumberFormat('ru-RU').format(Number(value||0))}</span> <span className="text-gray-300 text-base ml-1">UZS</span></div>
      </div>
      <div className="h-11 w-11 rounded-full bg-gray-800 flex items-center justify-center"><Icon className="h-6 w-6 text-blue-500" /></div>
    </div>
  )
} 