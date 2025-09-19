import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { productsService } from '../../../services/productsService'
import CustomModal from '../../../components/common/CustomModal'
import { Input, Button, Tabs, Tab, Pagination } from '@heroui/react'

export type SetSelectionItem = { product_id: string; name: string; sku: string; barcode: string; image?: string; cost_price?: number; qty: number }

export default function SetAddProductsModal({ isOpen, onOpenChange, initial, onConfirm }: { isOpen: boolean; onOpenChange: (v:boolean)=>void; initial: SetSelectionItem[]; onConfirm: (items: SetSelectionItem[])=>void }) {
  const [term, setTerm] = useState('')
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(5)
  const [tab, setTab] = useState<'all'|'added'>('all')
  const [sel, setSel] = useState<Record<string, SetSelectionItem>>({})

  useEffect(()=>{
    if (isOpen) {
      const map: Record<string, SetSelectionItem> = {}
      ;(initial||[]).forEach(it=> { map[it.product_id] = { ...it } })
      setSel(map)
      setTab('all')
      setTerm('')
      setPage(1)
    }
  }, [isOpen, initial])

  const { data, isLoading } = useQuery({
    queryKey: ['products-for-set', term, page, limit],
    queryFn: ()=> productsService.list({ page, limit, search: term, exclude_types:['SET','SERVICE'] }),
    placeholderData: (p)=> p,
    enabled: isOpen,
  })

  const rows = useMemo(()=> (data?.items||[]).map((p:any)=> ({ id: p.id, name: p.name, sku: p.sku, barcode: p.barcode, image: (p.images||[])[0], cost_price: Number(p.cost_price||0) })), [data])

  const selectedList = useMemo(()=> Object.values(sel).filter(x=> x && x.qty>0), [sel])

  const setQty = (id:string, base:any, qty:number) => {
    setSel(prev => ({ ...prev, [id]: { product_id: id, name: base.name, sku: base.sku, barcode: base.barcode, image: base.image, cost_price: base.cost_price, qty } }))
  }

  const body = (
    <div>
      <Tabs selectedKey={tab} onSelectionChange={(k)=> setTab(k as any)} aria-label="set-tabs" className="mb-3">
        <Tab key="all" title={`All (${data?.total||0})`} />
        <Tab key="added" title={`Added (${selectedList.length})`} />
      </Tabs>
      {tab==='all' ? (
        <>
          <div className="mb-3">
            <Input placeholder="SKU, barcode, name" value={term} onValueChange={setTerm} variant="bordered" classNames={{ inputWrapper:'h-12' }} />
          </div>
          <div className="divide-y divide-default-200 border rounded-xl">
            {rows.map((p:any)=> (
              <div key={p.id} className="flex items-center gap-4 p-3">
                <div className="w-10 h-10 rounded bg-default-200 overflow-hidden grid place-items-center">
                  {p.image ? <img src={p.image} className="w-full h-full object-cover" /> : <span className="text-default-500">🖼️</span>}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="truncate font-medium text-primary-600 hover:underline cursor-pointer" title={p.name}>{p.name}</div>
                  <div className="text-xs text-default-500">{p.sku} • {p.barcode}</div>
                </div>
                <div className="flex items-center gap-2">
                  <Input type="number" value={String(sel[p.id]?.qty||0)} onValueChange={(v)=> setQty(p.id, p, Math.max(0, Number(v||0)))} className="w-24" classNames={{ inputWrapper:'h-10' }} endContent={<span className="text-foreground/60 text-xs">шт</span>} />
                </div>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-center mt-3">
            <Pagination page={page} total={Math.max(1, Math.ceil((data?.total||0)/limit))} onChange={setPage} showControls size="sm" />
          </div>
        </>
      ) : (
        <div className="divide-y divide-default-200 border rounded-xl">
          {selectedList.length===0 ? <div className="p-6 text-default-500">No items added yet</div> : selectedList.map((p:any)=> (
            <div key={p.product_id} className="flex items-center gap-4 p-3">
              <div className="w-10 h-10 rounded bg-default-200 overflow-hidden grid place-items-center">
                {p.image ? <img src={p.image} className="w-full h-full object-cover" /> : <span className="text-default-500">🖼️</span>}
              </div>
              <div className="flex-1 min-w-0">
                <div className="truncate font-medium" title={p.name}>{p.name}</div>
                <div className="text-xs text-default-500">{p.sku} • {p.barcode}</div>
              </div>
              <Input type="number" value={String(p.qty||0)} onValueChange={(v)=> setQty(p.product_id, p, Math.max(0, Number(v||0)))} className="w-24" classNames={{ inputWrapper:'h-10' }} endContent={<span className="text-foreground/60 text-xs">шт</span>} />
              <Button color="danger" variant="flat" onPress={()=> setSel(prev => { const n={...prev}; delete n[p.product_id]; return n })}>
                Remove
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  )

  return (
    <CustomModal
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      title="Add products"
      onSubmit={()=> { onConfirm(Object.values(sel).filter(x=> x.qty>0)); onOpenChange(false) }}
      submitLabel="Add"
      size="3xl"
    >
      {body}
    </CustomModal>
  )
} 