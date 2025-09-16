import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { attributesService, Attribute } from '../../../services/attributesService'
import { Button, Input, Select, SelectItem } from '@heroui/react'
import { XMarkIcon } from '@heroicons/react/24/outline'

export type VariantAttribute = { attribute_id: string; name: string; values: string[] }
export type GeneratedVariant = {
  key: string
  name: string
  barcode: string
  attributes: { name: string; value: string }[]
  supplyPrice?: number
  markup?: number
  retailPrice?: number
}

export default function VariantsBuilder({
  value,
  onChange,
  baseSku,
}: {
  value?: GeneratedVariant[]
  onChange: (variants: GeneratedVariant[]) => void
  baseSku?: string
}) {
  const { data: attrs } = useQuery({ queryKey: ['attributes','all'], queryFn: () => attributesService.list({ page:1, limit:200 }), placeholderData:(p)=>p })
  const [rows, setRows] = useState<VariantAttribute[]>([{ attribute_id: '', name: '', values: [] }])
  const [variants, setVariants] = useState<GeneratedVariant[]>(value || [])

  useEffect(()=> { onChange(variants) }, [variants])

  const addAttrRow = () => setRows(r => [...r, { attribute_id: '', name: '', values: [] }])
  const removeAttrRow = (idx: number) => setRows(r => r.filter((_,i)=> i!==idx))

  const setAttr = (idx: number, id: string) => {
    const a = (attrs?.items || []).find(x => x.id === id) as Attribute | undefined
    setRows(r => r.map((row,i) => i===idx ? { attribute_id: id, name: a?.name || '', values: [] } : row))
  }

  const setValues = (idx: number, next: Set<string>) => {
    setRows(r => r.map((row,i) => i===idx ? { ...row, values: Array.from(next) } : row))
  }

  const combinations = useMemo(() => {
    const pools = rows.filter(r => r.attribute_id && r.values.length).map(r => ({ name: r.name, values: r.values }))
    if (!pools.length) return [] as { name: string; value: string }[][]
    const rec = (i: number): { name: string; value: string }[][] => {
      if (i === pools.length) return [[]]
      const out: { name: string; value: string }[][] = []
      for (const v of pools[i].values) {
        for (const rest of rec(i+1)) out.push([{ name: pools[i].name, value: v }, ...rest])
      }
      return out
    }
    return rec(0)
  }, [rows])

  useEffect(() => {
    const next: GeneratedVariant[] = combinations.map((attrsArr) => {
      const name = attrsArr.map(a => `${a.name}: ${a.value}`).join(' / ')
      const key = attrsArr.map(a => `${a.name}:${a.value}`).join('|')
      const existing = variants.find(v => v.key === key)
      return existing || { key, name, barcode: '', attributes: attrsArr, supplyPrice: 0, markup: 0, retailPrice: 0 }
    })
    setVariants(next)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [combinations])

  const updateBarcode = (i: number, val: string) => setVariants(v => v.map((x,idx)=> idx===i? { ...x, barcode: val }: x))

  const genEAN13 = () => {
    let base = '200' + String(Math.floor(100000000 + Math.random()*900000000))
    base = base.substring(0,12)
    let sum = 0
    for (let i=0; i<12; i++) { const n = parseInt(base[i],10); sum += (i%2===0) ? n : n*3 }
    const check = (10 - (sum % 10)) % 10
    return base + String(check)
  }

  const nfUZS = new Intl.NumberFormat('en-US')

  return (
    <div className="space-y-6">
      <div className="grid gap-4">
        {rows.map((row, idx) => (
          <div key={idx} className="grid grid-cols-[1fr_1fr_auto] gap-4 items-end">
            <Select variant="bordered" label={"Attribute (e.g. Color)"} placeholder="Choose attribute" selectedKeys={row.attribute_id? [row.attribute_id]: []} onSelectionChange={(keys)=> setAttr(idx, Array.from(keys)[0] as string || '')}>
              {(attrs?.items || []).map(a => (<SelectItem key={a.id}>{a.name}</SelectItem>))}
            </Select>
            <Select variant="bordered" label={"Values"} selectionMode="multiple" placeholder="Choose values" selectedKeys={new Set(row.values)} onSelectionChange={(keys)=> setValues(idx, keys as Set<string>)} isDisabled={!row.attribute_id}>
              {((attrs?.items || []).find(a => a.id === row.attribute_id)?.values || []).map(v => (<SelectItem key={v}>{v}</SelectItem>))}
            </Select>
            <div className="flex items-center justify-end gap-2 h-14">
              {rows.length>1 && (<Button isIconOnly variant="flat" color="danger" className="h-14 w-14" onPress={()=> removeAttrRow(idx)} aria-label="remove"><XMarkIcon className="w-5 h-5" /></Button>)}
              {idx===rows.length-1 && (<Button variant="flat" onPress={addAttrRow}>Add Attribute</Button>)}
            </div>
          </div>
        ))}
      </div>

      <div className="border-t border-default-200 pt-4">
        <div className="text-sm font-medium mb-2">Generated variants</div>
        <div className="space-y-3">
          {variants.map((v, idx) => (
            <div key={v.key} className="grid grid-cols-[1fr_260px_auto] gap-4 items-center">
              <div className="text-default-700">{v.name}</div>
              <div className="flex items-center gap-2">
                <Input label="Barcode" labelPlacement="inside" variant="bordered" classNames={{ inputWrapper:'h-11' }} value={v.barcode} onValueChange={(val)=> updateBarcode(idx, val)} />
                <Button variant="flat" onPress={()=> updateBarcode(idx, genEAN13())}>Generate</Button>
              </div>
              <div className="justify-self-end text-default-400 text-sm">{nfUZS.format((v.retailPrice||0))} UZS</div>
            </div>
          ))}
          {variants.length===0 && (<div className="text-default-500 text-sm">Select attribute(s) and values to see variants...</div>)}
        </div>
      </div>

      {variants.length>0 && (
        <div className="border-t border-default-200 pt-4 space-y-3">
          <div className="text-sm font-medium">Prices</div>
          <div className="grid grid-cols-[1fr_220px_180px_220px] gap-3 items-center text-sm text-default-600">
            <div>Variation</div>
            <div>Supply price</div>
            <div>Markup</div>
            <div>Retail price</div>
          </div>
          <div className="space-y-2">
            {variants.map((v, idx) => (
              <div key={v.key} className="grid grid-cols-[1fr_220px_180px_220px] gap-3 items-center">
                <div className="text-default-700">{v.name}</div>
                <Input type="number" variant="bordered" classNames={{ inputWrapper:'h-11' }} value={String(v.supplyPrice||0)} onValueChange={(val)=> {
                  const supply = parseFloat(val)||0
                  setVariants(list => list.map((x,i)=> i===idx ? { ...x, supplyPrice: supply, retailPrice: (x.markup||0)>0 ? Math.round(supply*(1+(x.markup||0)/100)) : (x.retailPrice||0) } : x))
                }} endContent={<span className="px-2 text-default-500">UZS</span>} />
                <Input type="number" variant="bordered" classNames={{ inputWrapper:'h-11' }} value={String(v.markup||0)} onValueChange={(val)=> {
                  const m = parseFloat(val)||0
                  setVariants(list => list.map((x,i)=> i===idx ? { ...x, markup: m, retailPrice: (x.supplyPrice||0)>0 ? Math.round((x.supplyPrice||0)*(1+m/100)) : (x.retailPrice||0) } : x))
                }} endContent={<span className="px-2 text-default-500">%</span>} />
                <Input type="number" variant="bordered" classNames={{ inputWrapper:'h-11' }} value={String(v.retailPrice||0)} onValueChange={(val)=> {
                  const p = parseFloat(val)||0
                  setVariants(list => list.map((x,i)=> i===idx ? { ...x, retailPrice: p, markup: (x.supplyPrice||0)>0 ? Math.round(((p - (x.supplyPrice||0))/(x.supplyPrice||0))*100) : (x.markup||0) } : x))
                }} endContent={<span className="px-2 text-default-500">UZS</span>} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
} 