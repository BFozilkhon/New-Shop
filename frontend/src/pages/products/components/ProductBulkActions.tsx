import { useState } from 'react'
import { Button, Input, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, Select, SelectItem, Checkbox } from '@heroui/react'
import { TrashIcon, PencilSquareIcon, TagIcon as TagOutlineIcon, ArchiveBoxArrowDownIcon } from '@heroicons/react/24/outline'
import ConfirmModal from '../../../components/common/ConfirmModal'
import { productsService } from '../../../services/productsService'
import type { Product } from '../../../services/productsService'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { brandsService } from '../../../services/brandsService'
import { categoriesService } from '../../../services/categoriesService'
import { toast } from 'react-toastify'
import { priceTagsService } from '../../../services/priceTagsService'
import { storesService } from '../../../services/storesService'
import { useNavigate } from 'react-router-dom'
import Barcode from 'react-barcode'
import CustomSelect from '../../../components/common/CustomSelect'

export default function ProductBulkActions({ selectedIds, isOpen, onOpenChange }: { selectedIds: string[]; isOpen: boolean; onOpenChange: (open: boolean) => void }) {
  const qc = useQueryClient()
  const navigate = useNavigate()
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [archiveOpen, setArchiveOpen] = useState(false)
  const [brandId, setBrandId] = useState<string|undefined>(undefined)
  const [categoryId, setCategoryId] = useState<string|undefined>(undefined)
  const [expiration, setExpiration] = useState<string>('')
  const [submitting, setSubmitting] = useState(false)
  const [printOpen, setPrintOpen] = useState(false)
  const [templateId, setTemplateId] = useState<string|undefined>(undefined)
  const [storeId, setStoreId] = useState<string|undefined>(undefined)
  const [countMode, setCountMode] = useState<'manual'|'leftovers'>('leftovers')
  const [manualCount, setManualCount] = useState<number>(0)
  const [showDiscount, setShowDiscount] = useState(false)
  const [discountValue, setDiscountValue] = useState<number>(0)
  const [printA4, setPrintA4] = useState(false)
  const [skipZero, setSkipZero] = useState(true)

  const { data: brands } = useQuery({ queryKey: ['brands', 'all'], queryFn: () => brandsService.list({ page: 1, limit: 1000 }).then(r => r.items), staleTime: 5*60*1000 })
  const { data: categories } = useQuery({ queryKey: ['categories', 'all'], queryFn: () => categoriesService.list({ page: 1, limit: 1000 }).then(r => r.items), staleTime: 5*60*1000 })
  const { data: templates } = useQuery({ queryKey: ['pricetags','all'], queryFn: () => priceTagsService.list({ page:1, limit:1000 }).then(r=>r.items), staleTime: 5*60*1000 })
  const { data: stores } = useQuery({ queryKey: ['stores','all'], queryFn: () => storesService.list({ page:1, limit:1000 }).then(r=> (r as any)?.items || []), staleTime: 5*60*1000 })

  const selectedTemplateRaw:any = (templates || []).find((t:any)=> t.id===templateId) || (Array.isArray(templates) ? templates[0] : undefined)
  const selectedTemplate = selectedTemplateRaw || undefined
  const templateOptions = (Array.isArray(templates)? templates: []).map((t:any)=> ({ id: t.id, name: t.name, _create: false }))
  templateOptions.unshift({ id: 'create', name: '+ Create new template', _create: true } as any)

  async function handleBulkDelete() {
    setSubmitting(true)
    try {
      await productsService.bulkDelete(selectedIds)
      toast.success(`Deleted ${selectedIds.length} products`)
      setDeleteOpen(false)
      onOpenChange(false)
      qc.invalidateQueries({ queryKey: ['products'] })
    } finally { setSubmitting(false) }
  }

  async function handleBulkEdit() {
    setSubmitting(true)
    try {
      await productsService.bulkEditProperties(selectedIds, { brand_id: brandId ?? null, category_id: categoryId ?? null, expiration_date: expiration || null })
      toast.success('Updated selected products')
      setEditOpen(false)
      onOpenChange(false)
      qc.invalidateQueries({ queryKey: ['products'] })
    } finally { setSubmitting(false) }
  }

  async function handleBulkArchive() {
    setSubmitting(true)
    try {
      await productsService.bulkArchive(selectedIds)
      toast.success(`Archived ${selectedIds.length} products`)
      setArchiveOpen(false)
      onOpenChange(false)
      qc.invalidateQueries({ queryKey: ['products'] })
    } finally { setSubmitting(false) }
  }

  const money = (n?: number) => new Intl.NumberFormat('en-US').format(Number(n||0))

  function valueFor(key: string, p?: Product) {
    switch (key) {
      case 'name': return p?.name || ''
      case 'vendor_code': return p?.sku || p?.part_number || ''
      case 'price': return money(p?.price)
      case 'wholesale_price': return money(p?.cost_price)
      case 'print_date': return new Date().toLocaleDateString()
      case 'expire_date': return p?.expiration_date ? new Date(p.expiration_date).toLocaleDateString() : ''
      default: return ''
    }
  }

  function renderPreview() {
    if (!selectedTemplate) return <div className="text-foreground/60">Preview will appear here</div>
    const ratioW = 420
    const w = selectedTemplate.width_mm || 30
    const h = selectedTemplate.height_mm || 20
    const heightPx = (h/Math.max(w,1))*ratioW
    return (
      <div style={{ width: ratioW, height: heightPx, position:'relative', background:'#fff', borderRadius:12 }} className="mx-auto">
        {(selectedTemplate.properties||[]).map((p:any, idx:number)=> (
          <div key={idx} style={{ position:'absolute', left:`${p.x*100}%`, top:`${p.y*100}%`, width:`${p.width*100}%`, height:`${p.height*100}%`, display:'flex', alignItems:'center', justifyContent:'center' }}>
            {p.key==='barcode' ? (
              <Barcode value={'2000000002893'} format={selectedTemplate.barcode_fmt==='EAN13'?'EAN13':'CODE128'} displayValue width={2} height={Math.max(20, p.height*heightPx)} margin={0} fontSize={14} />
            ) : (
              <div style={{fontWeight: p.bold?700:400, textAlign:p.align, fontSize:p.font_size}}>{p.label}</div>
            )}
          </div>
        ))}
      </div>
    )
  }

  function buildLabel(win: Window, tpl: any, product: Product) {
    const label = win.document.createElement('div')
    label.className = 'label page-break'
    label.style.width = `${tpl.width_mm || 30}mm`
    label.style.height = `${tpl.height_mm || 20}mm`
    label.style.position = 'relative'
    label.style.overflow = 'hidden'
    ;(tpl.properties||[]).forEach((p:any)=>{
      // Wrapper slot in mm units with small padding to make barcode slightly smaller
      const slot = win.document.createElement('div')
      slot.style.position = 'absolute'
      slot.style.left = `${(p.x || 0) * (tpl.width_mm || 0)}mm`
      slot.style.top = `${(p.y || 0) * (tpl.height_mm || 0)}mm`
      slot.style.width = `${(p.width || 0) * (tpl.width_mm || 0)}mm`
      slot.style.height = `${(p.height || 0) * (tpl.height_mm || 0)}mm`
      slot.style.overflow = 'hidden'
      slot.style.padding = '0.2mm'
      slot.style.boxSizing = 'border-box'

      if (p.key === 'barcode') {
        const svg = win.document.createElementNS('http://www.w3.org/2000/svg','svg') as any
        svg.setAttribute('class','jsbarcode')
        svg.setAttribute('jsbarcode-value', String(product.barcode || ''))
        svg.setAttribute('jsbarcode-format', (tpl.barcode_fmt==='EAN13'?'EAN13':'CODE128'))
        svg.setAttribute('jsbarcode-textmargin', '1')
        svg.setAttribute('jsbarcode-fontSize', String(Math.max(8, p.font_size || 12)))
        svg.setAttribute('jsbarcode-margin', '0')
        // Fill available height, keep aspect ratio
        svg.setAttribute('preserveAspectRatio','none')
        svg.style.width = '100%'
        svg.style.height = '100%'
        svg.style.display = 'block'
        slot.appendChild(svg)
      } else {
        const div = win.document.createElement('div')
        div.style.width = '100%'
        div.style.height = '100%'
        div.style.display = 'flex'
        div.style.alignItems = 'center'
        div.style.justifyContent = 'center'
        div.style.fontWeight = p.bold? '700':'400'
        div.style.textAlign = p.align || 'center'
        // Scale text to fit slot height
        const PX_PER_MM = 96/25.4
        const slotHpx = (p.height || 0) * (tpl.height_mm || 0) * PX_PER_MM
        
        div.style.fontSize = `${5}px`
        div.style.overflow = 'hidden'
        div.style.lineHeight = '1'
        div.style.whiteSpace = 'nowrap'
        div.style.textOverflow = 'ellipsis'
        div.textContent = valueFor(p.key, product) || p.label
        slot.appendChild(div)
      }
      label.appendChild(slot)
    })
    return label
  }

  async function openPrintFor(items: { product: Product; copies: number }[]) {
    if (!selectedTemplate) return
    const mmW = selectedTemplate.width_mm || 30
    const mmH = selectedTemplate.height_mm || 20
    const pageCss = printA4
      ? `@page { size: A4; margin: 10mm; } body{display:flex;flex-direction:column;align-items:center;}`
      : `@page { size: ${mmW}mm ${mmH}mm; margin: 0; } body{}`

    const win = window.open('', 'printwin')
    if (!win) return
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8" /><title>Print</title><style>
      ${pageCss}
      body{margin:0;padding:0;font-family:system-ui,Arial;background:#fff}
      .page-break{page-break-after:always}
    </style></head><body></body></html>`
    win.document.open(); win.document.write(html); win.document.close()

    // Append labels in batches to avoid blocking UI
    const BATCH = 40
    const queue:{ product: Product; copies: number }[] = []
    items.forEach(({ product, copies }) => {
      const count = Math.max(0, Number(copies||0))
      if (count<=0) return
      queue.push({ product, copies: count })
    })

    for (let qi=0; qi<queue.length; qi++) {
      const { product, copies } = queue[qi]
      let left = copies
      while (left > 0) {
        const take = Math.min(BATCH, left)
        const frag = win.document.createDocumentFragment()
        for (let i=0; i<take; i++) frag.appendChild(buildLabel(win, selectedTemplate, product))
        win.document.body.appendChild(frag)
        left -= take
        // yield so browser stays responsive
        await new Promise(res => setTimeout(res, 0))
      }
    }

    const script = win.document.createElement('script')
    script.src = 'https://cdn.jsdelivr.net/npm/jsbarcode@3.11.6/dist/JsBarcode.all.min.js'
    const done = new Promise<void>((resolve)=>{
      script.onload = () => { try { /* @ts-ignore */ if ((win as any).JsBarcode) (win as any).JsBarcode('.jsbarcode').init() } catch {} finally { resolve() } }
    })
    win.document.body.appendChild(script)
    await done
    win.focus(); win.print();
  }

  async function collectItemsForPrint(): Promise<{ product: Product; copies: number }[]> {
    const prods: Product[] = await Promise.all(selectedIds.map((id)=> productsService.get(id)))
    const filtered = prods.filter(p=> !skipZero || Number(p.stock||0) > 0)
    if (countMode==='manual') {
      return filtered.map(p=> ({ product: p, copies: Math.max(1, Number(manualCount||0)) }))
    }
    // leftovers mode: print per current stock
    return filtered.map(p=> ({ product: p, copies: Math.max(0, Number(p.stock||0)) }))
  }

  async function handlePrintAll(){
    if (!selectedTemplate) { toast.error('Choose a template'); return }
    if (countMode==='manual' && (!manualCount || manualCount<=0)) { toast.error('Enter copies'); return }
    try {
      const items = await collectItemsForPrint()
      if (!items.length) { toast.info('Nothing to print'); return }
      await openPrintFor(items)
    } catch {}
  }

  return (
    <>
      {/* Bulk operations modal */}
      <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="2xl">
        <ModalContent>
          {(close) => (
            <>
              <ModalHeader className="text-base">Bulk operations</ModalHeader>
              <ModalBody>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Button variant="flat" startContent={<PencilSquareIcon className="w-4 h-4" />} onPress={() => setEditOpen(true)}>Edit product properties</Button>
                  <Button color="danger" variant="flat" startContent={<TrashIcon className="w-4 h-4" />} onPress={() => setDeleteOpen(true)}>Delete products</Button>
                  <Button variant="flat" startContent={<TagOutlineIcon className="w-4 h-4" />} onPress={()=>setPrintOpen(true)}>Price tags</Button>
                  <Button variant="flat" startContent={<ArchiveBoxArrowDownIcon className="w-4 h-4" />} onPress={()=> setArchiveOpen(true)}>Product archiving</Button>
                </div>
              </ModalBody>
              <ModalFooter>
                <Button variant="flat" onPress={() => close()}>Close</Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      <ConfirmModal isOpen={deleteOpen} title={`Delete ${selectedIds.length} products?`} description={`This action cannot be undone.`} confirmText="Delete" confirmColor="danger" onConfirm={handleBulkDelete} onClose={() => setDeleteOpen(false)} />

      <ConfirmModal isOpen={archiveOpen} title={`Archive ${selectedIds.length} products?`} description={`You can restore them from Archive.`} confirmText="Archive" confirmColor="primary" onConfirm={handleBulkArchive} onClose={() => setArchiveOpen(false)} />

      {/* Edit props modal */}
      <Modal isOpen={editOpen} onOpenChange={setEditOpen} size="lg">
        <ModalContent>
          {(close) => (
            <>
              <ModalHeader className="text-base">Edit product properties</ModalHeader>
              <ModalBody>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Select label="Brand" selectedKeys={brandId ? new Set([brandId]) : new Set()} onSelectionChange={(k) => setBrandId((k as Set<string>).values().next().value)} placeholder="Select brand">
                    {(Array.isArray(brands)? brands: []).map((b: any) => (<SelectItem key={b.id}>{b.name}</SelectItem>))}
                  </Select>
                  <Select label="Category" selectedKeys={categoryId ? new Set([categoryId]) : new Set()} onSelectionChange={(k) => setCategoryId((k as Set<string>).values().next().value)} placeholder="Select category">
                    {(Array.isArray(categories)? categories: []).map((c: any) => (<SelectItem key={c.id}>{c.name}</SelectItem>))}
                  </Select>
                  <Input type="date" label="Expiration date" value={expiration} onValueChange={setExpiration} />
                </div>
              </ModalBody>
              <ModalFooter>
                <Button variant="flat" onPress={() => close()}>Cancel</Button>
                <Button color="primary" isLoading={submitting} onPress={handleBulkEdit}>Save</Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      {/* Price Tags Print Modal */}
      <Modal isOpen={printOpen} onOpenChange={setPrintOpen} size="3xl">
        <ModalContent>
          {(close)=> (
            <>
              <ModalHeader className="text-base">Print price tags</ModalHeader>
              <ModalBody>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-1 space-y-4">
                    <div>
                      <CustomSelect
                        label={'Price tag template'}
                        items={(templateOptions as any).map((t:any)=> ({ key: t.id, label: t.name }))}
                        value={templateId || (selectedTemplate ? selectedTemplate.id : undefined)}
                        onChange={(v)=> { if(v==='create'){ close(); onOpenChange(false); navigate('/settings/pricetags/create') } else { setTemplateId(v) } }}
                        allowCreate
                        onCreate={(term)=> { close(); onOpenChange(false); navigate(`/settings/pricetags/create?name=${encodeURIComponent(term)}`) }}
                      />
                    </div>
                    <Select variant="bordered" classNames={{ trigger: 'h-14' }} label="Store" selectedKeys={storeId ? new Set([storeId]) : new Set()} onSelectionChange={(k)=>setStoreId((k as Set<string>).values().next().value)}>
                      {(Array.isArray(stores)? stores: []).map((s:any)=> (<SelectItem key={s.id}>{s.title}</SelectItem>))}
                    </Select>

                    <div className="space-y-2 rounded-large border p-2">
                      <div className="grid grid-cols-2 gap-2">
                        <Button color={countMode==='manual'?'primary':'default'} variant={countMode==='manual'?'solid':'flat'} onPress={()=>setCountMode('manual')}>Manual input</Button>
                        <Button color={countMode==='leftovers'?'primary':'default'} variant={countMode==='leftovers'?'solid':'flat'} onPress={()=>setCountMode('leftovers')}>By leftovers</Button>
                      </div>
                      {countMode==='manual' ? (
                        <div className="grid grid-cols-1 gap-2">
                          <Input type="number" label="Copies" value={String(manualCount)} onValueChange={(v)=>setManualCount(Number(v||0))} />
                        </div>
                      ) : null}
                    </div>

                    <div className="space-y-2">
                      <Checkbox isSelected={showDiscount} onValueChange={setShowDiscount}>Display a discount on the price tag?</Checkbox>
                      {showDiscount ? (<Input type="number" label="Discount amount" value={String(discountValue)} onValueChange={(v)=>setDiscountValue(Number(v||0))} />) : null}
                      <Checkbox isSelected={printA4} onValueChange={setPrintA4}>Print on A4</Checkbox>
                      <Checkbox isSelected={skipZero} onValueChange={setSkipZero}>Skip zero stock</Checkbox>
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <div className="rounded-xl border h-[360px] flex items-center justify-center">
                      {renderPreview()}
                    </div>
                  </div>
                </div>
              </ModalBody>
              <ModalFooter>
                <Button variant="flat" onPress={()=>close()}>Close</Button>
                <Button color="primary" onPress={()=>handlePrintAll()}>Print all</Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  )
} 