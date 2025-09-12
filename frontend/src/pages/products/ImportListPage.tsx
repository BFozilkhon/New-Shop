import { useMemo, useState, useEffect } from 'react'
import CustomMainBody from '../../components/common/CustomMainBody'
import CustomTable, { CustomColumn } from '../../components/common/CustomTable'
import { Button, Dropdown, DropdownItem, DropdownMenu, DropdownTrigger } from '@heroui/react'
import { EllipsisVerticalIcon, EyeIcon, TrashIcon } from '@heroicons/react/24/outline'
import ImportCreateModal from './components/ImportCreateModal'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-toastify'
import { productsImportService } from '../../services/productsImportService'
import { useTranslation } from 'react-i18next'
import { usePreferences } from '../../store/prefs'

function parseCSV(csvText: string): string[][] {
  const lines = csvText.split('\n').filter(l => l.trim())
  const result: string[][] = []
  for (const line of lines) {
    const row: string[] = []
    let current = ''
    let inQuotes = false
    for (let i=0;i<line.length;i++) {
      const ch = line[i]
      if (ch === '"') inQuotes = !inQuotes
      else if (ch === ',' && !inQuotes) { row.push(current.trim()); current='' }
      else current += ch
    }
    row.push(current.trim()); result.push(row.map(cell => cell.replace(/^[']|[']$/g,'')))
  }
  return result
}

export default function ImportListPage() {
  const { t } = useTranslation()
  const qc = useQueryClient()
  const { prefs } = usePreferences()
  const [open, setOpen] = useState(false)
  const [history, setHistory] = useState<any[]>([])
  const [mappingCtx, setMappingCtx] = useState<{ headers: string[]; rows: string[][]; title: string } | null>(null)
  const [step, setStep] = useState<0|2|3|4>(0)
  const [fieldMapping, setFieldMapping] = useState<Record<number,string>>({})
  const [validation, setValidation] = useState<any>(null)
  const [progress, setProgress] = useState(0)

  const loadHistory = async () => {
    try {
      const res = await productsImportService.list({ page: 1, limit: 50, store_id: prefs.selectedStoreId || undefined })
      setHistory(res.items || [])
    } catch { setHistory([]) }
  }

  useEffect(()=>{ loadHistory() }, [prefs.selectedStoreId])

  const items = useMemo(() => (history||[]).map((h:any, i:number) => ({
    id: h.id || i+1,
    name: h.file_name || h.title || t('importPage.header'),
    store: h.store_name || t('importPage.form.store'),
    quantity: h.success_rows || 0,
    total: h.total_rows || 0,
    status: h.status || 'completed',
    date: new Date(h.created_at || h.date).toLocaleString(),
    created_by: 'System',
  })), [history, t])

  const columns: CustomColumn[] = useMemo(() => [
    { uid: 'id', name: t('importPage.id') },
    { uid: 'name', name: t('importPage.name') },
    { uid: 'store', name: t('importPage.store') },
    { uid: 'quantity', name: t('importPage.quantity') },
    { uid: 'total', name: t('importPage.total') },
    { uid: 'status', name: t('importPage.status') },
    { uid: 'date', name: t('importPage.date') },
    { uid: 'actions', name: t('importPage.actions') },
  ], [t])

  const renderCell = (item:any, key:string) => {
    switch (key) {
      case 'actions':
        return (
          <Dropdown placement="bottom-end">
            <DropdownTrigger>
              <Button isIconOnly variant="light" size="sm" aria-label="actions">
                <EllipsisVerticalIcon className="w-5 h-5" />
              </Button>
            </DropdownTrigger>
            <DropdownMenu aria-label="Actions">
              <DropdownItem key="view" startContent={<EyeIcon className="w-4 h-4" />}>{t('importPage.view')}</DropdownItem>
              <DropdownItem key="delete" className="text-danger" color="danger" startContent={<TrashIcon className="w-4 h-4" />} onPress={async ()=>{
                toast.info(t('importPage.del_toast'))
              }}>{t('importPage.del')}</DropdownItem>
            </DropdownMenu>
          </Dropdown>
        )
      default:
        return item[key]
    }
  }

  const onProceed = async ({ title, storeId, fileName, csvText, ...entry }: any) => {
    // parse and go to mapping step
    if (csvText) {
      const parsed = parseCSV(csvText)
      const headers = parsed[0] || []
      setMappingCtx({ headers, rows: parsed.slice(1), title })
      const auto: Record<number,string> = {}
      headers.forEach((h, i)=> { const n = h.toLowerCase(); if (n.includes('name')) auto[i]='name'; if (n.includes('sku')||n.includes('артик')) auto[i]='sku'; if (n.includes('цен')) auto[i]='price'; if (n.includes('остат')||n.includes('кол')) auto[i]='stock' })
      setFieldMapping(auto)
      setStep(2)
    }
    // If entry summary exists, treat as finished import from modal
    if (entry && entry.totalRows !== undefined) {
      try {
        await productsImportService.create({ file_name: entry.file_name || fileName || title, store_id: storeId, store_name: entry.storeName, total_rows: entry.totalRows, success_rows: entry.successRows, error_rows: entry.errorRows, status: entry.status || 'completed' })
        await loadHistory()
        toast.success(t('importPage.toast.completed'))
        setOpen(false)
      } catch {
        toast.error(t('importPage.toast.save_failed'))
      }
      try { qc.invalidateQueries({ queryKey: ['products'] }) } catch {}
    }
  }

  const idx = (key:string) => Number(Object.keys(fieldMapping).find(k => fieldMapping[Number(k)] === key))

  const validate = () => {
    if (!mappingCtx) return
    const { headers, rows } = mappingCtx
    const errors:any[] = []; const warnings:any[] = []; const duplicates:any[] = []
    const nameIdx = idx('name'); const skuIdx = idx('sku'); const priceIdx = idx('price'); const stockIdx = idx('stock')
    if (isNaN(nameIdx)) errors.push({ row:0, column:'mapping', message: t('importPage.validation.mapping_missing', { field: t('importPage.name') }) })
    if (isNaN(skuIdx)) errors.push({ row:0, column:'mapping', message: t('importPage.validation.mapping_missing', { field: 'SKU' }) })
    if (isNaN(priceIdx)) errors.push({ row:0, column:'mapping', message: t('importPage.validation.mapping_missing', { field: t('importPage.fields.price').replace(' *','') }) })

    const skuCounts: Record<string, number> = {}; const skuRows: Record<string, number[]> = {}
    rows.forEach((r, i)=>{
      const rn = i+2
      if (!isNaN(nameIdx)) { const v=(r[nameIdx]||'').trim(); if (!v) errors.push({ row: rn, column: headers[nameIdx], message: t('importPage.validation.name_empty'), value:v }) }
      if (!isNaN(skuIdx)) { const v=(r[skuIdx]||'').trim(); if (!v) errors.push({ row: rn, column: headers[skuIdx], message: t('importPage.validation.sku_empty'), value:v }); else { skuCounts[v]=(skuCounts[v]||0)+1; (skuRows[v] ||= []).push(rn) } }
      if (!isNaN(priceIdx)) { const v=(r[priceIdx]||'').trim(); if (v && (isNaN(Number(v))||Number(v)<0)) errors.push({ row: rn, column: headers[priceIdx], message: t('importPage.validation.price_positive'), value:v }) }
      if (!isNaN(stockIdx)) { const v=(r[stockIdx]||'').trim(); if (v && (!/^\d+$/.test(v)||Number(v)<0)) errors.push({ row: rn, column: headers[stockIdx], message: t('importPage.validation.stock_non_negative'), value:v }) }
    })
    Object.keys(skuCounts).forEach(sku=>{ if (skuCounts[sku]>1) { duplicates.push({ rows: skuRows[sku], field:'sku', value:sku, message:t('importPage.validation.sku_duplicates', { sku, count: skuCounts[sku] }) }); skuRows[sku].forEach(rn=>errors.push({ row: rn, column:'sku', message:t('importPage.validation.sku_duplicate', { sku }) })) } })
    const uniqueErrorRows = [...new Set(errors.filter((e:any)=>e.row>0).map((e:any)=>e.row))]
    const validRows = rows.length - uniqueErrorRows.length
    setValidation({ totalRows: rows.length, validRows, errors, warnings, duplicates })
    setStep(3)
  }

  const startImport = () => {
    setStep(4); setProgress(0)
    const start = Date.now()
    const interval = setInterval(()=> setProgress(p=>{ if(p>=100){ clearInterval(interval); const entry = { id:start, file_name: mappingCtx?.title, date:new Date().toISOString(), totalRows: validation?.totalRows||0, successRows: validation?.validRows||0, errorRows: validation?.errors?.length||0, status:'completed' }; (async()=>{ try { await productsImportService.create({ file_name: entry.file_name || t('importPage.header'), total_rows: entry.totalRows, success_rows: entry.successRows, error_rows: entry.errorRows, status: entry.status }); await loadHistory(); toast.success(t('importPage.toast.completed')); } catch {} })(); return 100 } return p+10 }), 400)
  }

  return (
    <CustomMainBody>
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-xl font-semibold">{t('importPage.header')}</h1>
      </div>

      <CustomTable
        columns={columns}
        items={items}
        total={items.length}
        page={1}
        limit={10}
        onPageChange={()=>{}}
        onLimitChange={()=>{}}
        searchValue={''}
        onSearchChange={()=>{}}
        onSearchClear={()=>{}}
        renderCell={renderCell}
        rightAction={<Button color="primary" onPress={()=> setOpen(true)}>{t('importPage.new_import')}</Button>}
      />

      {/* Stage 0: modal */}
      <ImportCreateModal isOpen={open} onOpenChange={setOpen} onProceed={onProceed} />

      {/* Stage 2-4 inline below list */}
      {step===2 && mappingCtx && (
        <div className="mt-6 rounded-xl border p-4 space-y-4">
          <div className="flex items-center justify-between"><div className="font-medium">{t('importPage.mapping')}</div><div className="text-sm text-default-500">{t('importPage.rows', { count: mappingCtx.rows.length })}</div></div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-default-200 text-sm">
              <thead><tr>{mappingCtx.headers.map((h,i)=> (
                <th key={i} className="px-3 py-2 text-left">
                  <div className="space-y-1">
                    <div className="text-default-600">{h}</div>
                    <select className="border rounded text-xs px-2 py-1" value={fieldMapping[i]||''} onChange={(e)=> setFieldMapping({ ...fieldMapping, [i]: e.target.value })}>
                      <option value="">{t('importPage.not_mapped')}</option>
                      <option value="name">{t('importPage.fields.name')}</option>
                      <option value="sku">{t('importPage.fields.sku')}</option>
                      <option value="price">{t('importPage.fields.price')}</option>
                      <option value="stock">{t('importPage.fields.stock')}</option>
                    </select>
                  </div>
                </th>))}
              </tr></thead>
              <tbody>{mappingCtx.rows.slice(0,3).map((r,ri)=> (<tr key={ri} className={ri%2? 'bg-content2':'bg-background'}>{r.map((c,ci)=> (<td key={ci} className="px-3 py-2">{c}</td>))}</tr>))}</tbody>
            </table>
          </div>
          <div className="flex justify-end gap-3"><Button variant="flat" onPress={()=>{ setStep(0); setMappingCtx(null) }}>{t('common.cancel')}</Button><Button color="primary" onPress={validate}>{t('importPage.validate')}</Button></div>
        </div>
      )}

      {step===3 && validation && (
        <div className="mt-6 rounded-xl border p-4 space-y-4">
          <div className="grid grid-cols-4 gap-3 text-center">
            <div><div className="text-lg font-semibold">{validation.totalRows}</div><div className="text-xs text-default-500">{t('importPage.totals.total_rows')}</div></div>
            <div><div className="text-lg font-semibold text-success">{validation.validRows}</div><div className="text-xs text-default-500">{t('importPage.totals.valid')}</div></div>
            <div><div className="text-lg font-semibold text-danger">{validation.errors.length}</div><div className="text-xs text-default-500">{t('importPage.totals.errors')}</div></div>
            <div><div className="text-lg font-semibold text-warning">{validation.warnings?.length||0}</div><div className="text-xs text-default-500">{t('importPage.totals.warnings')}</div></div>
          </div>
          {validation.errors.length>0 && (
            <div className="rounded-lg border border-danger-300 p-3 text-danger text-sm">
              {validation.errors.slice(0,5).map((e:any,i:number)=> (<div key={i}>{t('common.columns')==='Колонки'? `Строка ${e.row}: ${e.message}${e.value? ` (${e.value})`:''}` : `Row ${e.row}: ${e.message}${e.value? ` (${e.value})`:''}`}</div>))}
              {validation.errors.length>5 && <div>+{validation.errors.length-5}</div>}
            </div>
          )}
          <div className="flex justify-end gap-3"><Button variant="flat" onPress={()=> setStep(2)}>{t('common.back')}</Button><Button color="primary" isDisabled={validation.errors.length>0} onPress={startImport}>{t('importPage.start_import')}</Button></div>
        </div>
      )}

      {step===4 && (
        <div className="mt-6 rounded-xl border p-4 space-y-4 text-center">
          <div className="font-medium">{t('importPage.step4.in_progress')}</div>
          <div className="w-full bg-default-200 rounded-full h-3"><div className="bg-primary h-3 rounded-full" style={{ width: `${progress}%` }}></div></div>
          {progress===100 && <div className="text-success">{t('importPage.step4.done')}</div>}
        </div>
      )}
    </CustomMainBody>
  )
} 