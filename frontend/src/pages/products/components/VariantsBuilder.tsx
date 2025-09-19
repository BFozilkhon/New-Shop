import { useEffect, useMemo, useState } from 'react'
import { Button, Input, Select, SelectItem } from '@heroui/react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import CustomDocumentUpload from '../../../components/common/CustomDocumentUpload'

export type VariantExtra = { name: string; barcode: string; images: string[]; cost_price: number; price: number }

export default function VariantsBuilder({ value, onChange, baseSku, onExtrasChange, attributes }: { value: any[]; onChange: (v:any[])=>void; baseSku: string; onExtrasChange?: (items: VariantExtra[])=>void; attributes: { id:string; name:string; values:string[] }[] }) {
  const [rows, setRows] = useState<any[]>(value && value.length ? value : [{ attribute_id:'', values:[] }])

  const chosenAttributeIds = useMemo(()=> new Set((rows||[]).map(r=> r.attribute_id).filter(Boolean)), [rows])
  const setAttr = (idx:number, id:string) => {
    const next=[...rows]; next[idx]={...next[idx], attribute_id:id, values:[]}
    // if last row becomes filled, auto-append a new empty row
    if (idx === rows.length-1) next.push({ attribute_id:'', values:[] })
    setRows(next); onChange(next)
  }
  const setValues = (idx:number, keys:Set<string>) => {
    const next=[...rows]; next[idx]={...next[idx], values:Array.from(keys||[]) }
    setRows(next); onChange(next)
  }
  const removeAttrRow = (idx:number) => { const next=rows.filter((_,i)=>i!==idx); if (next.length===0) next.push({ attribute_id:'', values:[] }); setRows(next); onChange(next) }

  // Generate combinations
  const combos = useMemo(()=>{
    const lists = rows.filter(r=>r.attribute_id && (r.values||[]).length>0).map((r:any)=> r.values as string[])
    if (lists.length===0) return [] as string[][]
    let res:string[][] = [[]]
    lists.forEach((list:string[])=>{
      const tmp:string[][] = []
      res.forEach((prefix:string[])=>{ list.forEach((v:string)=> tmp.push([...prefix, v])) })
      res = tmp
    })
    return res
  },[rows])

  // Derived editable per-variant state
  const [variantExtras, setVariantExtras] = useState<Record<string, { barcode:string; images:string[]; supply:number; markup:number; retail:number }>>({})
  const keyOf = (c:string[]) => c.join(' | ')
  const setExtra = (key:string, patch:Partial<{barcode:string; images:string[]; supply:number; markup:number; retail:number}>) => setVariantExtras(prev=> ({ ...prev, [key]: { barcode: prev[key]?.barcode||'', images: prev[key]?.images||[], supply: prev[key]?.supply||0, markup: prev[key]?.markup||0, retail: prev[key]?.retail||0, ...patch } }))

  useEffect(()=>{
    if (!onExtrasChange) return
    const items = combos.map((c)=> {
      const k = keyOf(c)
      const ex = variantExtras[k] || { barcode:'', images:[], supply:0, markup:0, retail:0 }
      return { name: c.join(' / '), barcode: ex.barcode, images: ex.images||[], cost_price: ex.supply||0, price: ex.retail||0 }
    })
    onExtrasChange(items)
  }, [combos, variantExtras, onExtrasChange])

  const valuesOf = (attrId:string) => (attributes||[]).find(a=> a.id===attrId)?.values || []

  const onSupplyChange = (k:string, v:string) => {
    const supply = Number(v||0)
    const cur = variantExtras[k] || { barcode:'', images:[], supply:0, markup:0, retail:0 }
    const retail = Math.round(supply * (1 + (cur.markup||0)/100))
    setExtra(k, { supply, retail })
  }
  const onMarkupChange = (k:string, v:string) => {
    const markup = Number(v||0)
    const cur = variantExtras[k] || { barcode:'', images:[], supply:0, markup:0, retail:0 }
    const retail = Math.round((cur.supply||0) * (1 + (markup||0)/100))
    setExtra(k, { markup, retail })
  }
  const onRetailChange = (k:string, v:string) => {
    const retail = Number(v||0)
    const cur = variantExtras[k] || { barcode:'', images:[], supply:0, markup:0, retail:0 }
    const supply = Number(cur.supply||0)
    const markup = supply>0 ? Math.round(((retail/supply - 1) * 100) * 100) / 100 : 0
    setExtra(k, { retail, markup })
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        {rows.map((row, idx) => (
          <div key={idx} className="grid grid-cols-[1fr_1fr_auto] gap-4 items-end">
            <Select variant="bordered" label={"Attribute (e.g. Color)"} placeholder="Choose attribute" selectedKeys={row.attribute_id? [row.attribute_id]: []} onSelectionChange={(keys)=> setAttr(idx, Array.from(keys)[0] as string || '')}>
              {(attributes||[]).map(a=> (
                <SelectItem key={a.id} isDisabled={row.attribute_id!==a.id && chosenAttributeIds.has(a.id)}>{a.name}</SelectItem>
              ))}
            </Select>
            <Select variant="bordered" label={"Values"} selectionMode="multiple" placeholder="Choose values" selectedKeys={new Set(row.values||[])} onSelectionChange={(keys)=> setValues(idx, keys as Set<string>)} isDisabled={!row.attribute_id}>
              {valuesOf(row.attribute_id||'').map((v:string)=> (<SelectItem key={v}>{v}</SelectItem>))}
            </Select>
            <div className="flex items-center justify-end gap-2 h-14">
              {rows.length>1 && (row.attribute_id || (row.values||[]).length>0) && (
                <Button isIconOnly variant="flat" color="danger" className="h-14 w-14" onPress={()=> removeAttrRow(idx)} aria-label="remove"><XMarkIcon className="w-5 h-5" /></Button>
              )}
            </div>
          </div>
        ))}
      </div>

      {combos.length>0 && (
        <div className="space-y-6">
          <div className="space-y-2">
            <div className="text-sm font-semibold">Generated variants</div>
            {combos.map(c=> {
              const k = keyOf(c)
              const ex = variantExtras[k] || { barcode:'', images:[], supply:0, markup:0, retail:0 }
              return (
                <div key={k} className="grid grid-cols-[1fr_260px_1fr_auto] items-center gap-3 py-1">
                  <div className="text-foreground text-sm">{c.join(' / ')}</div>
                  <Input isRequired label={"Barcode"} value={ex.barcode} onValueChange={(v)=> setExtra(k, { barcode: v })} variant="bordered" classNames={{ inputWrapper:'h-10' }} endContent={<button className="text-primary" onClick={()=>{ const gen = generateEAN13(); setExtra(k, { barcode: gen }) }}>Generate</button>} />
                  <div>
                    <CustomDocumentUpload label=" " value={ex.images} onChange={(urls)=> setExtra(k, { images: urls })} multiple maxFiles={3} compact />
                  </div>
                  <Button isIconOnly color="danger" variant="light" onPress={()=> { const next={...variantExtras}; delete next[k]; setVariantExtras(next) }}>
                    <XMarkIcon className="w-5 h-5" />
                  </Button>
                </div>
              )
            })}
          </div>

          <div className="space-y-2">
            <div className="text-sm font-semibold">Prices</div>
            <div className="grid grid-cols-12 gap-3 text-sm text-default-500 px-1">
              <div className="col-span-6">Variation</div>
              <div className="col-span-2">Supply price</div>
              <div className="col-span-2">Markup</div>
              <div className="col-span-2">Retail price</div>
            </div>
            {combos.map(c=> {
              const k = keyOf(c)
              const ex = variantExtras[k] || { barcode:'', images:[], supply:0, markup:0, retail:0 }
              return (
                <div key={k} className="grid grid-cols-12 gap-3 items-center">
                  <div className="col-span-6 text-foreground text-sm">{c.join(' / ')}</div>
                  <div className="col-span-2"><Input isRequired type="number" value={String(ex.supply||0)} onValueChange={(v)=> onSupplyChange(k, v)} variant="bordered" classNames={{ inputWrapper:'h-10' }} endContent={<span className="text-xs text-foreground/50">UZS</span>} /></div>
                  <div className="col-span-2"><Input type="number" value={String(ex.markup||0)} onValueChange={(v)=> onMarkupChange(k, v)} variant="bordered" classNames={{ inputWrapper:'h-10' }} endContent={<span className="text-xs text-foreground/50">%</span>} /></div>
                  <div className="col-span-2"><Input isRequired type="number" value={String(ex.retail||0)} onValueChange={(v)=> onRetailChange(k, v)} variant="bordered" classNames={{ inputWrapper:'h-10' }} endContent={<span className="text-xs text-foreground/50">UZS</span>} /></div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

function generateEAN13(): string {
  let base = '200' + String(Math.floor(100000000 + Math.random()*900000000))
  base = base.substring(0,12)
  let sum = 0
  for (let i=0; i<12; i++) { const n = parseInt(base[i],10); sum += (i % 2 === 0) ? n : n*3 }
  const check = (10 - (sum % 10)) % 10
  return base + String(check)
} 