import { useState } from 'react'
import { Button, Input, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, Select, SelectItem, Checkbox } from '@heroui/react'
import { TrashIcon, PencilSquareIcon, TagIcon as TagOutlineIcon, ArchiveBoxArrowDownIcon } from '@heroicons/react/24/outline'
import { TagIcon, ArchiveBoxIcon } from '@heroicons/react/24/solid'
import ConfirmModal from '../../../components/common/ConfirmModal'
import { productsService } from '../../../services/productsService'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { brandsService } from '../../../services/brandsService'
import { categoriesService } from '../../../services/categoriesService'
import { toast } from 'react-toastify'
import { priceTagsService } from '../../../services/priceTagsService'
import { storesService } from '../../../services/storesService'
import { useNavigate } from 'react-router-dom'
import Barcode from 'react-barcode'

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
  const { data: stores } = useQuery({ queryKey: ['stores','all'], queryFn: () => storesService.list({ page:1, limit:1000 }).then(r=>r.items), staleTime: 5*60*1000 })

  const selectedTemplate = (templates || []).find((t:any)=> t.id===templateId) || (templates && templates[0])
  const templateOptions = (templates || []).map((t:any)=> ({ id: t.id, name: t.name, _create: false }))
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

  function valueFor(key: string) {
    // In future we will use selected product values. For now sample placeholders.
    switch (key) {
      case 'name': return 'Shirt Basic'
      case 'vendor_code': return 'SFY-02486'
      case 'price': return '199,900'
      case 'wholesale_price': return '120,000'
      case 'print_date': return new Date().toLocaleDateString()
      case 'expire_date': return new Date(Date.now()+86400000*365).toLocaleDateString()
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
              <div style={{fontWeight: p.bold?700:400, textAlign:p.align, fontSize:p.font_size}}>{valueFor(p.key) || p.label}</div>
            )}
          </div>
        ))}
      </div>
    )
  }

  function openPrint(copies: number) {
    const win = window.open('', 'printwin')
    if (!win || !selectedTemplate) return
    const page = `<!DOCTYPE html><html><head><title>Print</title><style>
      @page { size: A4; margin: 20mm; }
      body{margin:0;padding:0;font-family:system-ui,Arial;background:#fff}
      .label{width:600px;margin:20mm auto;position:relative}
      .slot{position:absolute;display:flex;align-items:center;justify-content:center}
      .page-break{page-break-after:always}
    </style></head><body></body></html>`
    win.document.open(); win.document.write(page); win.document.close()

    const addLabel = () => {
      const label = win.document.createElement('div')
      label.className = 'label page-break'
      const ratioW = 600
      const w = selectedTemplate.width_mm || 30
      const h = selectedTemplate.height_mm || 20
      const heightPx = (h/Math.max(w,1))*ratioW
      label.style.height = `${heightPx}px`
      label.style.width = `${ratioW}px`

      ;(selectedTemplate.properties||[]).forEach((p:any)=>{
        if (p.key === 'barcode') {
          const svg = win.document.createElementNS('http://www.w3.org/2000/svg','svg') as any
          svg.setAttribute('class','jsbarcode')
          svg.setAttribute('jsbarcode-value','2000000002893')
          svg.setAttribute('jsbarcode-format', (selectedTemplate.barcode_fmt==='EAN13'?'EAN13':'CODE128'))
          svg.style.position = 'absolute'
          svg.style.left = `${p.x*100}%`
          svg.style.top = `${p.y*100}%`
          svg.style.width = `${p.width*100}%`
          svg.style.height = `${p.height*100}%`
          label.appendChild(svg)
        } else {
          const div = win.document.createElement('div')
          div.className = 'slot'
          div.style.left = `${p.x*100}%`
          div.style.top = `${p.y*100}%`
          div.style.width = `${p.width*100}%`
          div.style.height = `${p.height*100}%`
          div.style.fontWeight = p.bold? '700':'400'
          div.style.textAlign = p.align || 'center'
          div.style.fontSize = `${p.font_size || 14}px`
          div.textContent = valueFor(p.key) || p.label
          label.appendChild(div)
        }
      })

      win.document.body.appendChild(label)
    }

    const count = Math.max(1, copies)
    for (let i=0;i<count;i++) addLabel()

    const script = win.document.createElement('script')
    script.src = 'https://cdn.jsdelivr.net/npm/jsbarcode@3.11.6/dist/JsBarcode.all.min.js'
    script.onload = () => {
      // initialize all generated barcode svgs
      // @ts-ignore
      if ((win as any).JsBarcode) (win as any).JsBarcode('.jsbarcode').init()
      win.focus(); win.print();
    }
    win.document.body.appendChild(script)
  }

  function handleTestPrint(){ openPrint(1) }
  function handlePrintAll(){ openPrint(countMode==='manual' ? Math.max(1, manualCount) : 1) }

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
                    {(brands || []).map((b: any) => (<SelectItem key={b.id}>{b.name}</SelectItem>))}
                  </Select>
                  <Select label="Category" selectedKeys={categoryId ? new Set([categoryId]) : new Set()} onSelectionChange={(k) => setCategoryId((k as Set<string>).values().next().value)} placeholder="Select category">
                    {(categories || []).map((c: any) => (<SelectItem key={c.id}>{c.name}</SelectItem>))}
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
          {(close)=>(
            <>
              <ModalHeader className="text-base">Print price tags</ModalHeader>
              <ModalBody>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-1 space-y-4">
                    <div>
                      <Select
                        label="Price tag template"
                        items={templateOptions as any}
                        selectedKeys={templateId ? new Set([templateId]) : (selectedTemplate? new Set([selectedTemplate.id]): new Set())}
                        onSelectionChange={(k)=>{
                          const val = (k as Set<string>).values().next().value
                          if (val === 'create') { close(); onOpenChange(false); navigate('/settings/pricetags/create'); return }
                          setTemplateId(val)
                        }}
                      >
                        {(item: any) => (
                          <SelectItem key={item.id} endContent={!item._create ? <PencilSquareIcon className="w-4 h-4" onClick={(e)=>{ e.stopPropagation(); close(); onOpenChange(false); navigate(`/settings/pricetags/${item.id}/edit`) }} /> : null}>
                            {item.name}
                          </SelectItem>
                        )}
                      </Select>
                    </div>
                    <Select label="Store" selectedKeys={storeId ? new Set([storeId]) : new Set()} onSelectionChange={(k)=>setStoreId((k as Set<string>).values().next().value)}>
                      {(stores || []).map((s:any)=> (<SelectItem key={s.id}>{s.title}</SelectItem>))}
                    </Select>

                    <div className="space-y-2 rounded-large border p-2">
                      <div className="grid grid-cols-2 gap-2">
                        <Button variant={countMode==='manual'?'solid':'flat'} onPress={()=>setCountMode('manual')}>Manual input</Button>
                        <Button variant={countMode==='leftovers'?'solid':'flat'} onPress={()=>setCountMode('leftovers')}>By leftovers</Button>
                      </div>
                      {countMode==='manual' ? (
                        <Input type="number" label="Amount of printing" value={String(manualCount)} onValueChange={(v)=>setManualCount(Number(v||0))} />
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
                <Button variant="flat" onPress={()=>handleTestPrint()}>Test print</Button>
                <Button color="primary" onPress={()=>handlePrintAll()}>Print all</Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  )
} 