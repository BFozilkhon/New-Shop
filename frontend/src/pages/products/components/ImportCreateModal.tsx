import { useEffect, useState } from 'react'
import CustomModal from '../../../components/common/CustomModal'
import { Button, Input, Select, SelectItem } from '@heroui/react'
import { storesService } from '../../../services/storesService'
import { DocumentArrowDownIcon } from '@heroicons/react/24/outline'
import * as XLSX from 'xlsx'
// Enable legacy Excel codepages (for .xls with cp1251/others)
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import * as cptable from 'xlsx/dist/cpexcel.full.mjs'
// eslint-disable-next-line @typescript-eslint/no-explicit-any
if (typeof (XLSX as any).set_cptable === 'function') {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (XLSX as any).set_cptable(cptable)
}
import { productsService } from '../../../services/productsService'
import { useTranslation } from 'react-i18next'

export default function ImportCreateModal({ isOpen, onOpenChange, onProceed }: { isOpen: boolean; onOpenChange: (v:boolean)=>void; onProceed: (payload:any)=>void }) {
  const { t } = useTranslation()
  const [title, setTitle] = useState('')
  const [storeId, setStoreId] = useState<string>('')
  const [fileName, setFileName] = useState('')
  const [csvText, setCsvText] = useState('')
  const [stores, setStores] = useState<any[]>([])
  const [step, setStep] = useState<1|2|3|4>(1)
  const [headers, setHeaders] = useState<string[]>([])
  const [rows, setRows] = useState<string[][]>([])
  const [fieldMapping, setFieldMapping] = useState<Record<number,string>>({})
  const [validation, setValidation] = useState<any>(null)
  const [importing, setImporting] = useState(false)
  const [progress, setProgress] = useState(0)
  const [validating, setValidating] = useState(false)

  useEffect(()=>{
    if (isOpen) {
      const d = new Date()
      const pad = (n:number)=> String(n).padStart(2,'0')
      setTitle(`${t('importPage.header')} ${d.getFullYear()}.${pad(d.getMonth()+1)}.${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`)
      storesService.list({ page:1, limit:100 }).then(r=> setStores((r as any)?.items || (Array.isArray(r)? r : []) )).catch(()=> setStores([]))
      setFileName(''); setCsvText('')
      setStep(1); setHeaders([]); setRows([]); setFieldMapping({}); setValidation(null); setImporting(false); setProgress(0)
    }
  },[isOpen, t])

  const parseCSV = (csv: string): string[][] => {
    const lines = csv.split('\n').filter(l => l.trim())
    const out: string[][] = []
    for (const line of lines) {
      const row: string[] = []
      let cur = ''; let inQ = false
      for (let i=0;i<line.length;i++) { const ch=line[i]; if (ch==='"') inQ=!inQ; else if (ch===',' && !inQ) { row.push(cur.trim()); cur=''; } else cur += ch }
      row.push(cur.trim()); out.push(row.map(c => c.replace(/^["']|["']$/g,'')))
    }
    return out
  }

  const onFileChange = (e:any) => {
    const f = e.target.files?.[0]
    if (!f) return
    setFileName(f.name)
    
    if (f.name.toLowerCase().endsWith('.csv')) {
      const reader = new FileReader()
      reader.onload = (ev:any) => {
        try {
          const txt = String(ev.target.result||'')
          setCsvText(txt)
          const parsed = parseCSV(txt)
          const hdrs = (parsed[0] || []) as string[]
          setHeaders(hdrs)
          setRows(parsed.slice(1))
          const auto: Record<number,string> = {}
          (hdrs as string[]).forEach((h: string, i: number)=> { const n=h.toLowerCase(); if(n.includes('назв')||n.includes('name')) auto[i]='name'; if(n.includes('артик')||n.includes('sku')) auto[i]='sku'; if(n.includes('цен')||n.includes('price')) auto[i]='price'; if(n.includes('остат')||n.includes('stock')) auto[i]='stock' })
          setFieldMapping(auto)
          setStep(2)
        } catch { setCsvText('') }
      }
      reader.readAsText(f, 'UTF-8')
    } else {
      const readAsArray = () => new Promise<any[][]>((resolve, reject) => {
        const r1 = new FileReader()
        r1.onload = (ev:any) => {
          try {
            const data = new Uint8Array(ev.target?.result as ArrayBuffer)
            const workbook = XLSX.read(data, { type: 'array' })
            const sheetName = workbook.SheetNames?.[0]
            const worksheet = sheetName ? workbook.Sheets[sheetName] : undefined
            if (!worksheet) throw new Error('No worksheet')
            const aoa = XLSX.utils.sheet_to_json(worksheet, { header: 1, blankrows: false }) as any[][]
            resolve(aoa)
          } catch (err) { reject(err) }
        }
        r1.onerror = (err) => reject(err)
        r1.readAsArrayBuffer(f)
      })
      const readAsBinary = () => new Promise<any[][]>((resolve, reject) => {
        const r2 = new FileReader()
        r2.onload = (ev:any) => {
          try {
            const binary = String(ev.target?.result || '')
            const workbook = XLSX.read(binary, { type: 'binary' })
            const sheetName = workbook.SheetNames?.[0]
            const worksheet = sheetName ? workbook.Sheets[sheetName] : undefined
            if (!worksheet) throw new Error('No worksheet')
            const aoa = XLSX.utils.sheet_to_json(worksheet, { header: 1, blankrows: false }) as any[][]
            resolve(aoa)
          } catch (err) { reject(err) }
        }
        r2.onerror = (err) => reject(err)
        try {
          // Some browsers may not support readAsBinaryString
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          if (typeof (r2 as any).readAsBinaryString === 'function') {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ;(r2 as any).readAsBinaryString(f)
          } else {
            const r3 = new FileReader()
            r3.onload = (ev2:any) => {
              try {
                const buf = ev2.target?.result as ArrayBuffer
                const bytes = new Uint8Array(buf)
                let binary = ''
                const chunk = 0x8000
                for (let i = 0; i < bytes.length; i += chunk) {
                  binary += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + chunk)))
                }
                const workbook = XLSX.read(binary, { type: 'binary' })
                const sheetName = workbook.SheetNames?.[0]
                const worksheet = sheetName ? workbook.Sheets[sheetName] : undefined
                if (!worksheet) throw new Error('No worksheet')
                const aoa = XLSX.utils.sheet_to_json(worksheet, { header: 1, blankrows: false }) as any[][]
                resolve(aoa)
              } catch (err) { reject(err) }
            }
            r3.onerror = (err) => reject(err)
            r3.readAsArrayBuffer(f)
          }
        } catch (err) { reject(err) }
      })
      ;(async () => {
        try {
          let aoa = await readAsArray().catch(async () => await readAsBinary())
          aoa = (aoa || []).filter(r => r && r.length > 0)
          const hdrs = (aoa[0] || []).map((v:any)=> String(v ?? '')) as string[]
          const body = (aoa.slice(1) || []).map((r:any[]) => hdrs.map((_, idx) => String(r?.[idx] ?? '').trim()))
          setHeaders(hdrs)
          setRows(body)
          const auto: Record<number,string> = {}
          hdrs.forEach((h: string, i: number)=> { const n=h.toLowerCase(); if(n.includes('назв')||n.includes('name')) auto[i]='name'; if(n.includes('артик')||n.includes('sku')) auto[i]='sku'; if(n.includes('цен')||n.includes('price')) auto[i]='price'; if(n.includes('остат')||n.includes('stock')) auto[i]='stock' })
          setFieldMapping(auto)
          setStep(2)
        } catch (e) {
          console.error('Error parsing Excel file:', e)
          setCsvText('')
          alert(t('importPage.parse_error'))
        }
      })()
    }
  }

  const validate = async () => {
    setValidating(true)
    const idx = (k:string) => Number(Object.keys(fieldMapping).find(i => fieldMapping[Number(i)] === k))
    const nameIdx = idx('name'), skuIdx=idx('sku'), priceIdx=idx('price'), stockIdx=idx('stock')
    const errors:any[] = [], warnings:any[] = [], duplicates:any[] = []
    if (isNaN(nameIdx)) errors.push({ row:0, column:'mapping', message: t('importPage.validation.mapping_missing', { field: t('importPage.name') }) })
    if (isNaN(skuIdx)) errors.push({ row:0, column:'mapping', message: t('importPage.validation.mapping_missing', { field: 'SKU' }) })
    if (isNaN(priceIdx)) errors.push({ row:0, column:'mapping', message: t('importPage.validation.mapping_missing', { field: t('importPage.fields.price').replace(' *','') }) })
    const skuCounts: Record<string, number> = {}; const skuRows: Record<string, number[]> = {}
    rows.forEach((r, i)=>{
      const rn = i+2
      if (!isNaN(nameIdx)) { const v=(r[nameIdx]||'').trim(); if(!v) errors.push({ row: rn, column: headers[nameIdx], message: t('importPage.validation.name_empty') }) }
      if (!isNaN(skuIdx)) { const v=(r[skuIdx]||'').trim(); if(!v) errors.push({ row: rn, column: headers[skuIdx], message: t('importPage.validation.sku_empty') }); else { skuCounts[v]=(skuCounts[v]||0)+1; (skuRows[v] ||= []).push(rn) } }
      if (!isNaN(priceIdx)) { const v=(r[priceIdx]||'').trim(); if(v && (isNaN(Number(v))||Number(v)<0)) errors.push({ row: rn, column: headers[priceIdx], message: t('importPage.validation.price_positive') }) }
      if (!isNaN(stockIdx)) { const v=(r[stockIdx]||'').trim(); if(v && (!/^\d+$/.test(v)||Number(v)<0)) errors.push({ row: rn, column: headers[stockIdx], message: t('importPage.validation.stock_non_negative') }) }
    })
    Object.keys(skuCounts).forEach(s=>{ if(skuCounts[s]>1){ duplicates.push({ rows: skuRows[s], field:'sku', value:s, message:t('importPage.validation.sku_duplicates', { sku:s, count: skuCounts[s] }) }); skuRows[s].forEach(rn=> errors.push({ row: rn, column:'sku', message:t('importPage.validation.sku_duplicate', { sku:s }) })) } })

    // Remote check: existing SKUs in catalog
    if (!isNaN(skuIdx)) {
      try {
        const skuList = rows.map(r => (r[skuIdx]||'').trim()).filter(Boolean)
        const uniqueSkus = Array.from(new Set(skuList.map(s => s.toLowerCase())))
        const results = await Promise.all(uniqueSkus.map(async (s) => {
          try {
            const res = await productsService.list({ page: 1, limit: 1, search: s })
            const exists = (res?.items||[]).some((p:any) => (p.sku||'').toLowerCase() === s)
            return { s, exists }
          } catch { return { s, exists: false } }
        }))
        const existing = new Set(results.filter(r => r.exists).map(r => r.s))
        rows.forEach((r, i)=>{
          const rn = i+2
          const sku = ((r[skuIdx]||'')+'').trim().toLowerCase()
          if (sku && existing.has(sku)) {
            errors.push({ row: rn, column: headers[skuIdx], message: t('importPage.validation.sku_exists') })
          }
        })
      } catch {}
    }

    const uniqueErrRows = [...new Set(errors.filter((e:any)=>e.row>0).map((e:any)=>e.row))]
    const validRows = rows.length - uniqueErrRows.length
    setValidation({ totalRows: rows.length, validRows, errors, warnings, duplicates })
    setStep(3)
    setValidating(false)
  }

  const startImport = async () => {
    if (!validation) return
    setImporting(true); setStep(4); setProgress(0)
    let success = 0; let fail = 0
    const idx = (k:string) => Number(Object.keys(fieldMapping).find(i => fieldMapping[Number(i)] === k))
    const nameIdx = idx('name'), skuIdx=idx('sku'), priceIdx=idx('price'), stockIdx=idx('stock')
    const total = validation.totalRows || rows.length
    const updateProgress = () => setProgress(p => Math.min(100, Math.round(((success+fail)/Math.max(1,total))*100)))
    for (let i=0;i<rows.length;i++) {
      const r = rows[i]
      try {
        const payload:any = {
          name: r[nameIdx], sku: r[skuIdx], description: undefined,
          price: Number(r[priceIdx]||0), cost_price: undefined,
          stock: Number(r[stockIdx]||0), min_stock: undefined, max_stock: undefined,
          unit: undefined, weight: undefined, dimensions: { length:0, width:0, height:0, unit: 'cm' },
          images: [], attributes: [], variants: [], warehouses: [],
          catalog_attributes: [], catalog_characteristics: [], catalog_parameters: [],
          type: 'single', is_bundle: false, barcode: undefined, is_dirty_core: false, is_realizatsiya: false, is_konsignatsiya: false, additional_parameters: {}, status: 'active', is_published: false
        }
        await productsService.create(payload)
        success++
      } catch (e) { fail++ }
      updateProgress()
      await new Promise(res => setTimeout(res, 10))
    }
    setImporting(false)
    const entry = { id: Date.now(), file_name: fileName || title, fileName, storeId, fileNameTitle: title, date: new Date().toISOString(), totalRows: total, successRows: success, errorRows: fail, status: 'completed', storeName: (stores||[]).find((s:any)=> s.id===storeId)?.title }
    try { if (typeof onProceed === 'function') onProceed(entry) } catch {}
    onOpenChange(false)
  }

  const handleSubmit = () => {
    if (step===1) { if (csvText) setStep(2) } else if (step===2) { validate() } else if (step===3) { startImport() } else { onOpenChange(false) }
  }

  const submitLabel = step===1 ? t('importPage.next') : step===2 ? (validating? t('importPage.validating') : t('importPage.validate')) : step===3 ? (importing? t('importPage.importing') : t('importPage.start')) : t('importPage.close')

  const downloadTemplate = () => {
    const headers = ['Название','Артикул','Описание','Категория','Бренд','Цена','Себестоимость','Остаток','Мин. остаток','Макс. остаток','Ед. изм.','Вес','Штрихкод']
    const samples = [
      ['Пример товара','ITEM001','Описание товара','Электроника','Apple','99900','79900','100','10','500','pcs','0.3','1234567890123'],
      ['Ноутбук Lenovo','LNV123','Ноутбук для работы','Ноутбуки','Lenovo','8500000','7000000','10','2','20','шт','2.2','1234567890124'],
      ['Смартфон Samsung','SMS456','Смартфон среднего класса','Смартфоны','Samsung','5500000','4500000','25','5','50','шт','0.3','2345678901234']
    ]
    
    const ws = XLSX.utils.aoa_to_sheet([headers, ...samples])
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Products')
    
    XLSX.writeFile(wb, 'products_template.xlsx')
  }

  return (
    <CustomModal
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      title={step===1? t('importPage.modal.title_new') : step===2 ? t('importPage.modal.title_map') : step===3 ? t('importPage.modal.title_validate') : t('importPage.modal.title_progress')}
      onSubmit={handleSubmit}
      submitLabel={submitLabel}
      isSubmitting={importing || validating}
      size={step===2 ? '3xl' : step===4 ? 'xl' : 'lg'}
    >
      <div className="space-y-5">
        {step===1 && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <Input label={t('importPage.form.title')} variant="bordered" classNames={{ inputWrapper: 'h-14' }} value={title} onValueChange={setTitle} />
              <Select label={t('importPage.form.store')} placeholder={t('importPage.form.store_placeholder')} variant="bordered" classNames={{ trigger: 'h-14' }} selectedKeys={storeId? [storeId]: []} onSelectionChange={(keys)=> setStoreId(Array.from(keys)[0] as string || '')}>
                {(stores||[]).map((s:any)=> (<SelectItem key={s.id}>{s.title || s.name}</SelectItem>))}
              </Select>
            </div>
            <div className="border-2 border-dashed rounded-xl p-8 text-center">
              <input type="file" id="import-file" accept=".csv,.xlsx,.xls,.xlsm" className="hidden" onChange={onFileChange} />
              <label htmlFor="import-file" className="cursor-pointer block">
                <div className="text-default-600 mb-1">{t('importPage.drop_here')}</div>
                <div className="text-default-400">{t('importPage.or')}</div>
                <div className="text-primary underline">{t('importPage.click_to_review')}</div>
              </label>
              <div className="text-xs text-default-400 mt-3">{t('importPage.upload_hint')}</div>
              {fileName && (<div className="mt-2 text-sm text-default-600">{t('importPage.selected', { file: fileName })}</div>)}
            </div>
            <div className="rounded-xl border border-default-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-default-700">{t('importPage.dont_know')}</div>
                  <div className="text-default-500 text-sm">{t('importPage.download_hint')}</div>
                </div>
                <Button variant="flat" startContent={<DocumentArrowDownIcon className="w-4 h-4" />} onPress={downloadTemplate}>{t('importPage.download_template')}</Button>
              </div>
            </div>
          </>
        )}
 
        {step===2 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-default-600">{t('importPage.rows', { count: rows.length })}</div>
              <div className="flex gap-2 text-xs">
                <div className="text-default-500">{t('importPage.map_to')}</div>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-default-200 text-sm">
                <thead>
                  <tr>
                    {headers.map((h,i)=> (
                      <th key={i} className="px-3 pt-2 pb-3 text-left align-bottom">
                        <div className="text-default-600 font-medium mb-2">{h}</div>
                        <select className="border rounded-md text-xs px-2 py-2 bg-content1" value={fieldMapping[i]||''} onChange={(e)=> setFieldMapping({ ...fieldMapping, [i]: e.target.value })}>
                          <option value="">{t('importPage.not_mapped')}</option>
                          <option value="name">{t('importPage.fields.name')}</option>
                          <option value="sku">{t('importPage.fields.sku')}</option>
                          <option value="price">{t('importPage.fields.price')}</option>
                          <option value="stock">{t('importPage.fields.stock')}</option>
                        </select>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.slice(0,10).map((r,ri)=> (
                    <tr key={ri} className={ri%2? 'bg-content2':'bg-background'}>
                      {r.map((c,ci)=> (
                        <td key={ci} className="px-3 py-2">
                          <input
                            className="w-full bg-transparent border border-default-200 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                            value={r[ci] || ''}
                            onChange={(e)=> {
                              const next = [...rows]
                              next[ri] = [...next[ri]]
                              next[ri][ci] = e.target.value
                              setRows(next)
                            }}
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
 
        {step===3 && validation && (
          <div className="space-y-4">
            <div className="grid grid-cols-4 gap-3 text-center">
              <div><div className="text-lg font-semibold">{validation.totalRows}</div><div className="text-xs text-default-500">{t('importPage.totals.total_rows')}</div></div>
              <div><div className="text-lg font-semibold text-success">{validation.validRows}</div><div className="text-xs text-default-500">{t('importPage.totals.valid')}</div></div>
              <div><div className="text-lg font-semibold text-danger">{validation.errors.length}</div><div className="text-xs text-default-500">{t('importPage.totals.errors')}</div></div>
              <div><div className="text-lg font-semibold text-warning">{validation.warnings?.length||0}</div><div className="text-xs text-default-500">{t('importPage.totals.warnings')}</div></div>
            </div>
            {validation.errors.length>0 && (
              <div className="rounded-lg border border-danger-300 p-3 text-danger text-sm max-h-60 overflow-auto">
                {validation.errors.map((e:any,i:number)=> (<div key={i}>{t('common.columns')==='Колонки'? `Строка ${e.row}: ${e.message}` : `Row ${e.row}: ${e.message}`}</div>))}
              </div>
            )}
          </div>
        )}
 
        {step===4 && (
          <div className="space-y-3">
            <div className="text-sm text-default-600">{t('importPage.step4.in_progress')}</div>
            <div className="w-full bg-default-200 rounded-full h-3"><div className="bg-primary h-3 rounded-full" style={{ width: `${progress}%` }}></div></div>
          </div>
        )}
      </div>
    </CustomModal>
  )
} 