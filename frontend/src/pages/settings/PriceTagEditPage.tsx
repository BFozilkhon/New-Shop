import { useEffect, useMemo, useRef, useState } from 'react'
import CustomMainBody from '../../components/common/CustomMainBody'
import { Button, Input, Select, SelectItem, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from '@heroui/react'
import { useNavigate, useParams } from 'react-router-dom'
import { priceTagsService, PriceTagProperty } from '../../services/priceTagsService'
import Barcode from 'react-barcode'
import { ChevronLeftIcon, PlusIcon } from '@heroicons/react/24/outline'
import { toast } from 'react-toastify'

const PROPERTY_OPTIONS = [
  { key: 'name', label: 'Name' },
  { key: 'barcode', label: 'Barcode' },
  { key: 'price', label: 'Selling Price' },
  { key: 'vendor_code', label: 'Vendor Code' },
  { key: 'wholesale_price', label: 'Wholesale price' },
  { key: 'print_date', label: 'Print Date' },
  { key: 'expire_date', label: 'Expire Date' },
]

export default function PriceTagEditPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isCreate = !id
  const [name, setName] = useState('')
  const [width, setWidth] = useState<number | ''>('')
  const [height, setHeight] = useState<number | ''>('')
  const [barcode, setBarcode] = useState<'CODE128'|'EAN13'>('CODE128')
  const [propsList, setPropsList] = useState<PriceTagProperty[]>([])
  const [addOpen, setAddOpen] = useState(false)
  const [activeIdx, setActiveIdx] = useState<number | null>(null)
  const surfaceRef = useRef<HTMLDivElement>(null)

  useEffect(()=>{ (async()=>{
    if (!isCreate && id) {
      const t = await priceTagsService.get(id)
      setName(t.name); setWidth(t.width_mm); setHeight(t.height_mm); setBarcode(t.barcode_fmt); setPropsList(t.properties)
    }
  })() }, [id, isCreate])

  async function handleSave() {
    const w = Number(width || 0), h = Number(height || 0)
    if (!name || !w || !h) return
    if (isCreate) {
      try {
        await priceTagsService.create({ name, width_mm: w, height_mm: h, barcode_fmt: barcode, properties: propsList })
        toast.success('Template created')
        navigate('/settings/pricetags')
      } catch(e) { toast.error('Failed to create template') }
    } else if (id) {
      try {
        await priceTagsService.update(id, { name, width_mm: w, height_mm: h, barcode_fmt: barcode, properties: propsList })
        toast.success('Template updated')
      } catch(e) { toast.error('Failed to update template') }
    }
  }

  const preview = useMemo(()=>{
    const ratioW = 500
    const w = Number(width || 1)
    const h = Number(height || 1)
    const heightPx = (h / Math.max(w,1)) * ratioW
    const fakeProduct = { name: 'Shirt Basic', barcode: '2000000002893', price: 199900, vendor_code: 'SFY-02486', wholesale_price: 120000, print_date: new Date().toLocaleDateString(), expire_date: new Date(Date.now()+86400000*365).toLocaleDateString() }
    const textFor = (k: string) => {
      switch (k) {
        case 'name': return fakeProduct.name
        case 'price': return `${(fakeProduct.price/100).toFixed(2)}`
        case 'vendor_code': return fakeProduct.vendor_code
        case 'wholesale_price': return `${(fakeProduct.wholesale_price/100).toFixed(2)}`
        case 'print_date': return fakeProduct.print_date
        case 'expire_date': return fakeProduct.expire_date
        default: return ''
      }
    }
    return (
      <div className="bg-white rounded-xl shadow-sm border mx-auto" ref={surfaceRef} style={{ width: ratioW, height: heightPx, position:'relative' }}>
        {propsList.map((p, idx)=> (
          <Draggable key={idx} idx={idx} active={activeIdx===idx} onActive={(i)=>setActiveIdx(i)} onChange={(np)=>setPropsList(list=> list.map((it,i)=> i===idx?np:it))} surfaceRef={surfaceRef} prop={p}>
            {p.key === 'barcode' ? (
              <div className="w-full h-full flex items-center justify-center">
                <Barcode value={fakeProduct.barcode} format={barcode==='EAN13'?'EAN13':'CODE128'} displayValue width={2} height={Math.max(20, p.height*heightPx)} margin={0} fontSize={14} />
              </div>
            ) : (
              <div className="w-full h-full flex items-center justify-center" style={{ fontWeight: p.bold ? 700 : 400, textAlign: p.align as any, fontSize: p.font_size }}>
                <span className="text-black">{textFor(p.key)}</span>
              </div>
            )}
          </Draggable>
        ))}
      </div>
    )
  }, [propsList, width, height, barcode, activeIdx])

  function addProperty(key: string, label: string) {
    if (!width || !height) return
    setPropsList(list=> [...list, { key, label, x: .1, y: .1, width: .8, height: .15, font: 'Gilroy-Bold', font_size: 16, align: 'left', bold: key==='name' }])
  }

  return (
    <CustomMainBody>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Button variant="flat" onPress={()=>navigate(-1)}>Back</Button>
          <h1 className="text-xl font-semibold">Create Price Tag</h1>
        </div>
        <Button color="primary" onPress={handleSave}>Save</Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-4">
          <Input label="Name" value={name} onValueChange={setName} placeholder="Enter name" />
          <div className="grid grid-cols-2 gap-4">
            <Input type="number" label="Width (mm)" value={String(width)} onValueChange={(v)=>setWidth(v===''?'':Number(v))} placeholder="e.g. 30" />
            <Input type="number" label="Length (mm)" value={String(height)} onValueChange={(v)=>setHeight(v===''?'':Number(v))} placeholder="e.g. 20" />
          </div>
          <Select label="Barcode format" selectedKeys={new Set([barcode])} onSelectionChange={(k)=>setBarcode((k as Set<any>).values().next().value)}>
            <SelectItem key="CODE128">CODE128</SelectItem>
            <SelectItem key="EAN13">EAN13</SelectItem>
          </Select>

          <div className="rounded-xl border p-3">
            <div className="font-medium mb-2">Add properties to display</div>
            <div className="space-y-2">
              {propsList.map((p, idx)=> (
                <div key={idx} className={`flex items-center justify-between rounded-md px-3 py-2 cursor-pointer ${activeIdx===idx?'bg-primary/10':'bg-content1'}`} onClick={()=>setActiveIdx(idx)}>
                  <span>{p.label}</span>
                  <Button size="sm" variant="light" onPress={()=>setPropsList(list=>list.filter((_,i)=>i!==idx))}>✕</Button>
                </div>
              ))}
              <Dropdown isOpen={addOpen} onOpenChange={setAddOpen}>
                <DropdownTrigger>
                  <Button variant="flat">Add property</Button>
                </DropdownTrigger>
                <DropdownMenu aria-label="Add property" onAction={(key)=> {
                  const opt = PROPERTY_OPTIONS.find(o=>o.key===key)
                  if (opt) addProperty(opt.key, opt.label)
                }}>
                  {PROPERTY_OPTIONS.map(o=> <DropdownItem key={o.key}>{o.label}</DropdownItem>)}
                </DropdownMenu>
              </Dropdown>
            </div>
          </div>
        </div>
        <div className="lg:col-span-2">
          <div className="rounded-xl border p-4">
            <div className="text-center mb-2 text-foreground/70">Choose a layer for formatting</div>
            {preview}
          </div>
        </div>
      </div>
    </CustomMainBody>
  )
}

function Draggable({ prop, onChange, surfaceRef, children, idx, active, onActive }:{ prop: PriceTagProperty; onChange:(p:PriceTagProperty)=>void; surfaceRef: React.RefObject<HTMLDivElement>; children: React.ReactNode; idx:number; active:boolean; onActive:(i:number)=>void }) {
  const ref = useRef<HTMLDivElement>(null)
  const [dragging, setDragging] = useState(false)
  const [start, setStart] = useState<{x:number;y:number}>()

  function clamp(v:number, min:number, max:number){ return Math.max(min, Math.min(max, v)) }

  const onMouseDown = (e: React.MouseEvent) => {
    onActive(idx)
    setDragging(true)
    setStart({ x: e.clientX, y: e.clientY })
  }
  const onMouseMove = (e: React.MouseEvent) => {
    if (!dragging || !surfaceRef.current) return
    const dx = e.clientX - (start?.x||0)
    const dy = e.clientY - (start?.y||0)
    const rect = surfaceRef.current.getBoundingClientRect()
    const newX = clamp(prop.x + dx/rect.width, 0, 1 - prop.width)
    const newY = clamp(prop.y + dy/rect.height, 0, 1 - prop.height)
    setStart({ x: e.clientX, y: e.clientY })
    onChange({ ...prop, x: newX, y: newY })
  }
  const onMouseUp = () => setDragging(false)

  const style: React.CSSProperties = { left: `${prop.x*100}%`, top: `${prop.y*100}%`, width:`${prop.width*100}%`, height:`${prop.height*100}%`, position:'absolute', border: active? '2px solid var(--heroui-primary)' : '1px dashed rgba(0,0,0,.2)', cursor:'move', borderRadius: 6, background: 'transparent' }

  return (
    <div ref={ref} style={style} onMouseDown={onMouseDown} onMouseMove={onMouseMove} onMouseUp={onMouseUp}>
      {children}
    </div>
  )
} 