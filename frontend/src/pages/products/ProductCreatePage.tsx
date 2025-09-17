import { useEffect, useRef, useState } from 'react'
import CustomMainBody from '../../components/common/CustomMainBody'
import { Button, Input, Select, SelectItem, Textarea, Switch, DatePicker, RadioGroup, Radio } from '@heroui/react'
import CustomSelect from '../../components/common/CustomSelect'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { attributesService } from '../../services/attributesService'
import { characteristicsService } from '../../services/characteristicsService'
import { brandsService } from '../../services/brandsService'
import { suppliersService } from '../../services/suppliersService'
import { productsService, ProductDimensions } from '../../services/productsService'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import CustomDocumentUpload from '../../components/common/CustomDocumentUpload'
import { useTranslation } from 'react-i18next'
import { storesService } from '../../services/storesService'
import CategorySelector from './components/CategoryPicker'
import VariantsBuilder from './components/VariantsBuilder'
// no custom modal needed
import CharacteristicModal from '../catalog/components/CharacteristicModal'
import BrandModal from '../catalog/components/BrandModal'

const sections = [
  { key: 'main', labelKey: 'products.form.main' },
  { key: 'variations', labelKey: 'products.form.variations' },
  { key: 'prices', labelKey: 'products.form.prices' },
  { key: 'quantity', labelKey: 'products.form.quantity' },
  { key: 'characteristics', labelKey: 'products.form.characteristics' },
]

function generateSKU() {
  const prefix = ['ARP','IEB','MUD','KTX','ZQN'][Math.floor(Math.random()*5)]
  const num = String(Math.floor(10000 + Math.random()*90000))
  return `${prefix}-${num}`
}

function generateEAN13() {
  // base 12 digits with GS1 prefix 200
  let base = '200' + String(Math.floor(100000000 + Math.random()*900000000))
  base = base.substring(0,12)
  let sum = 0
  for (let i=0; i<12; i++) {
    const n = parseInt(base[i],10)
    sum += (i % 2 === 0) ? n : n*3
  }
  const check = (10 - (sum % 10)) % 10
  return base + String(check)
}

export default function ProductCreatePage({ embedded = false, onClose }: { embedded?: boolean; onClose?: ()=>void } = {}) {
  const { t } = useTranslation()
  const [active, setActive] = useState('main')
  const containerRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()
  const qc = useQueryClient()

  // Main Information
  const [name, setName] = useState('')
  const [sku, setSku] = useState('')
  const [partNumber, setPartNumber] = useState('')
  const [description, setDescription] = useState('')
  const [categoryId, setCategoryId] = useState<string>('')
  const [categoryIds, setCategoryIds] = useState<string[]>([])
  const [brandId, setBrandId] = useState<string>('')
  const [supplierId, setSupplierId] = useState<string>('')
  const [storeId, setStoreId] = useState<string>('')
  const [barcode, setBarcode] = useState('')
  const [unit, setUnit] = useState('')
  const [weight, setWeight] = useState(0)

  const [dimensions, setDimensions] = useState<ProductDimensions>({ length: 0, width: 0, height: 0, unit: 'cm' })
  const [price, setPrice] = useState(0)
  const [costPrice, setCostPrice] = useState(0)
  const [markup, setMarkup] = useState<number>(0)
  const [stock, setStock] = useState(0)
  const [minStock, setMinStock] = useState(0)
  const [maxStock, setMaxStock] = useState(0)

  const [selectedCatalogAttribute, setSelectedCatalogAttribute] = useState<string>('')
  const [selectedCatalogCharacteristic, setSelectedCatalogCharacteristic] = useState<string>('')
  const [status, setStatus] = useState('active')
  const [isPublished, setIsPublished] = useState(false)
  const [isActive, setIsActive] = useState(true)
  const [isDirtyCore, setIsDirtyCore] = useState(false)
  const [isKonsignatsiya, setIsKonsignatsiya] = useState(false)
  const [konsignatsiyaDate, setKonsignatsiyaDate] = useState('')
  const [expirationDate, setExpirationDate] = useState('')
  const [isRealizatsiya, setIsRealizatsiya] = useState(false)
  const [mode, setMode] = useState<'basic'|'variative'>('basic')
  const [variants, setVariants] = useState<any[]>([])
  const [variantExtras, setVariantExtras] = useState<any[]>([])

  const [images, setImages] = useState<string[]>([])
  const [brandModalOpen, setBrandModalOpen] = useState(false)
  const [brandPrefill, setBrandPrefill] = useState('')
  const [brandSelectKey, setBrandSelectKey] = useState(0)

  // Catalog characteristics values keyed by id
  const [charValues, setCharValues] = useState<Record<string, string>>({})
  const [charModalOpen, setCharModalOpen] = useState(false)
  const [editCharOpen, setEditCharOpen] = useState(false)
  const [editCharItem, setEditCharItem] = useState<any|null>(null)
  const [editCharNewValue, setEditCharNewValue] = useState('')
  const [charSelectKeys, setCharSelectKeys] = useState<Record<string, number>>({})

  const brandsQuery = useQuery({ queryKey: ['brands', 1, 100, ''], queryFn: () => brandsService.list({ page: 1, limit: 100 }), placeholderData: (prev) => prev })
  const suppliersQuery = useQuery({ queryKey: ['suppliers', 1, 100, ''], queryFn: () => suppliersService.list({ page: 1, limit: 100 }), placeholderData: (prev) => prev })
  const storesQuery = useQuery({ queryKey: ['stores',1,200,'', ''], queryFn: ()=> storesService.list({ page:1, limit:200, company_id: undefined }), placeholderData:(p)=>p })
  const catalogAttributesQuery = useQuery({ queryKey: ['catalog-attributes', 1, 100, ''], queryFn: () => attributesService.list({ page: 1, limit: 100 }), placeholderData: (prev) => prev })
  const catalogCharacteristicsQuery = useQuery({ queryKey: ['catalog-characteristics', 1, 100, ''], queryFn: () => characteristicsService.list({ page: 1, limit: 100 }), placeholderData: (prev) => prev })

  const createMutation = useMutation({
    mutationFn: async () => {
      if (mode==='variative') {
        if (!name || !sku) throw new Error('Please fill Name and SKU')
        if (!variantExtras || variantExtras.length===0) throw new Error('Add at least one variant with Barcode, Supply and Retail price')
        const invalid = (variantExtras as any[]).some((v:any)=> !v.barcode || Number(v.cost_price||0)<=0 || Number(v.price||0)<=0)
        if (invalid) throw new Error('Each variant must have Barcode, Supply price and Retail price')
        const payload:any = {
          name, sku, description, unit, brand_id: brandId||undefined, supplier_id: supplierId||undefined, category_id: categoryId||undefined, category_ids: (categoryIds&&categoryIds.length?categoryIds:undefined), store_id: storeId||undefined,
          variants: (variantExtras||[]).map((v:any)=> ({ name_suffix: v.name, barcode: v.barcode, images: v.images||[], cost_price: Number(v.cost_price||0), price: Number(v.price||0) }))
        }
        const created:any = await productsService.bulkCreateVariants(payload)
        return created
      }
      if (!name || !sku || !barcode || price <= 0) throw new Error('Please fill in all required fields')
      const payload = {
        name,
        sku,
        part_number: partNumber,
        description,
        price,
        cost_price: costPrice,
        stock,
        min_stock: minStock,
        max_stock: maxStock,
        unit,
        weight,
        dimensions,
        category_id: categoryId || undefined,
        category_ids: (categoryIds && categoryIds.length ? categoryIds : undefined),
        brand_id: brandId || undefined,
        supplier_id: supplierId || undefined,
        store_id: storeId || undefined,
        images,
        attributes: [],
        variants: [],
        warehouses: [],
        catalog_attributes: [],
        catalog_characteristics: Object.entries(charValues).filter(([_,v]) => v && v.trim()).map(([id, value]) => ({ characteristic_id: id, value })),
        catalog_parameters: [],
        type: 'single',
        is_bundle: false,
        barcode: mode==='basic'? barcode : '',
        is_dirty_core: isDirtyCore,
        is_realizatsiya: isRealizatsiya,
        is_konsignatsiya: isKonsignatsiya,
        konsignatsiya_date: isKonsignatsiya && konsignatsiyaDate ? new Date(konsignatsiyaDate).toISOString() : undefined,
        expiration_date: expirationDate ? new Date(expirationDate).toISOString() : undefined,
        additional_parameters: {},
        status,
        is_published: isPublished,
        is_active: isActive,
      }
      return productsService.create(payload)
    },
    onSuccess: () => { toast.success('Product created successfully'); qc.invalidateQueries({ queryKey: ['products'] }); navigate('/products/catalog') },
    onError: (error: any) => { toast.error(error?.message || 'Failed to create product') }
  } as any)

  useEffect(() => {
    const onScroll = () => {
      if (!containerRef.current) return
      const anchors = Array.from(containerRef.current.querySelectorAll('[data-section]')) as HTMLElement[]
      const top = containerRef.current.getBoundingClientRect().top
      let current = active
      for (const el of anchors) {
        const rect = el.getBoundingClientRect()
        if (rect.top - top <= 80) current = el.dataset.section || current
      }
      if (current !== active) setActive(current)
    }
    const el = containerRef.current
    el?.addEventListener('scroll', onScroll)
    return () => el?.removeEventListener('scroll', onScroll)
  }, [active])

  const handleSelect = (key: string) => { setActive(key); const el = document.getElementById(`sec-${key}`); el?.scrollIntoView({ behavior: 'smooth', block: 'start' }) }

  return (
    <CustomMainBody>
      {!embedded && (
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-semibold">{t('products.create')}</h1>
          <Button color="primary" startContent={<ArrowLeftIcon className="w-4 h-4" />} onPress={() => navigate('/products/catalog')}>{t('products.form.back')}</Button>
        </div>
      )}
      <div className="grid grid-cols-[220px_1fr] gap-6">
        <aside className="sticky top-4 self-start rounded-lg border border-default-200 p-2 h-fit">
          <ul className="space-y-1">
            {sections.map(s => (
              <li key={s.key}><button className={`w-full text-left px-3 py-2 rounded-md hover:bg-default-100 ${active === s.key ? 'bg-default-100 font-medium' : ''}`} onClick={() => handleSelect(s.key)}>{t(s.labelKey)}</button></li>
            ))}
          </ul>
        </aside>
        <div className="relative">
          <div ref={containerRef} className="min-h-[400px] rounded-lg border border-default-200 p-4 max-h-[70vh] overflow-auto space-y-10">
            
            <section id="sec-main" data-section="main" className="space-y-4">
              <h3 className="text-base font-semibold">{t('products.form.main')}</h3>
              <div className="col-span-2">
                  <div className="text-sm font-medium mb-2">Product variability</div>
                  <RadioGroup orientation="horizontal" value={mode} onValueChange={(v)=> setMode(v as any)}>
                    <Radio value="basic">Basic</Radio>
                    <Radio value="variative">Variative</Radio>
                  </RadioGroup>
                </div>
              <div className="grid grid-cols-2 gap-6">
                <Input isRequired label={t('products.form.product_name')} placeholder={t('products.form.product_name_ph')} variant="bordered" classNames={{ inputWrapper: 'h-14' }} labelPlacement="inside" value={name} onValueChange={setName} />
                <Select label={t('stores.header')} placeholder={t('stores.form.title_placeholder')} variant="bordered" classNames={{ trigger: 'h-14' }} labelPlacement="inside" selectedKeys={storeId ? [storeId] : []} onSelectionChange={(keys) => setStoreId(Array.from(keys)[0] as string || '')}>
                  {(storesQuery.data?.items || []).map(st => (<SelectItem key={st.id}>{st.title}</SelectItem>))}
                </Select>
                <Input label={t('products.form.part_number')} placeholder={t('products.form.part_number_ph')} variant="bordered" classNames={{ inputWrapper: 'h-14' }} labelPlacement="inside" value={partNumber} onValueChange={setPartNumber} />
                <DatePicker variant='bordered' aria-label="Expiration date" label="Expiration date" value={undefined} onChange={(d:any)=>{ try{ const s = typeof d?.toString==='function'? d.toString(): String(d); setExpirationDate(s.split('T')[0]) }catch{} }} />
                <div className="grid grid-cols-2 gap-3 col-span-2">
                  <Input isRequired label={t('products.form.sku')} placeholder={t('products.form.sku_ph')} variant="bordered" classNames={{ inputWrapper: 'h-14' }} labelPlacement="inside" value={sku} onValueChange={setSku} endContent={<button className="text-primary" onClick={()=> setSku(generateSKU())}>Generate</button>} />
                  {mode==='basic' && (
                    <Input isRequired label={t('products.form.barcode')} placeholder={t('products.form.barcode_ph')} variant="bordered" classNames={{ inputWrapper: 'h-14' }} labelPlacement="inside" value={barcode} onValueChange={setBarcode} endContent={<button className="text-primary" onClick={()=> setBarcode(generateEAN13())}>Generate</button>} />
                  )}
                </div>
                <CustomSelect
                  key={brandSelectKey}
                  label={t('products.form.brand')}
                  placeholder={t('products.form.brand_ph')}
                  items={(brandsQuery.data?.items||[]).map((b:any)=> ({ key: b.id, label: b.name }))}
                  value={brandId}
                  onChange={setBrandId}
                  allowCreate
                  onCreate={(term)=>{ setBrandPrefill(term); setBrandModalOpen(true); setBrandSelectKey(v=>v+1) }}
                />
                <CustomSelect
                  label={t('products.form.supplier')}
                  placeholder={t('products.form.supplier_ph')}
                  items={(suppliersQuery.data?.items||[]).map((s:any)=> ({ key: s.id, label: s.name }))}
                  value={supplierId}
                  onChange={setSupplierId}
                  allowCreate
                  onCreate={()=>{ window.location.href = '/products/suppliers/create' }}
                />
                <Select label={t('products.form.unit')} placeholder={t('products.form.unit_ph')} variant="bordered" classNames={{ trigger: 'h-14' }} labelPlacement="inside" selectedKeys={[unit]} onSelectionChange={(keys) => setUnit(Array.from(keys)[0] as string)}>
                  <SelectItem key="pcs">pcs</SelectItem>
                  <SelectItem key="kg">kg</SelectItem>
                  <SelectItem key="m">m</SelectItem>
                </Select>
                <Input label={t('products.form.weight')} placeholder={t('products.form.weight_ph')} type="number" variant="bordered" classNames={{ inputWrapper: 'h-14' }} labelPlacement="inside" value={weight.toString()} onValueChange={(v) => setWeight(parseFloat(v) || 0)} />
                <div className="col-span-2"><Textarea label={t('products.form.description')} placeholder={t('products.form.description_ph')} variant="bordered" classNames={{ inputWrapper: 'min-h-[3.5rem]' }} value={description} onValueChange={setDescription} /></div>
              </div>
              <div><h4 className="text-sm font-medium mb-4">{t('products.form.dimensions')}</h4>
                <div className="grid grid-cols-4 gap-4">
                  <Input label={t('products.form.length')} type="number" variant="bordered" classNames={{ inputWrapper: 'h-14' }} labelPlacement="inside" value={dimensions.length.toString()} onValueChange={(v) => setDimensions({...dimensions, length: parseFloat(v) || 0})} />
                  <Input label={t('products.form.width')} type="number" variant="bordered" classNames={{ inputWrapper: 'h-14' }} labelPlacement="inside" value={dimensions.width.toString()} onValueChange={(v) => setDimensions({...dimensions, width: parseFloat(v) || 0})} />
                  <Input label={t('products.form.height')} type="number" variant="bordered" classNames={{ inputWrapper: 'h-14' }} labelPlacement="inside" value={dimensions.height.toString()} onValueChange={(v) => setDimensions({...dimensions, height: parseFloat(v) || 0})} />
                  <Select label={t('products.form.dim_unit')} variant="bordered" classNames={{ trigger: 'h-14' }} labelPlacement="inside" selectedKeys={[dimensions.unit]} onSelectionChange={(keys) => setDimensions({...dimensions, unit: Array.from(keys)[0] as string})}>
                    <SelectItem key="cm">cm</SelectItem>
                    <SelectItem key="mm">mm</SelectItem>
                    <SelectItem key="m">m</SelectItem>
                    <SelectItem key="in">in</SelectItem>
                  </Select>
                </div>
              </div>
              {mode==='basic' && (<div><CustomDocumentUpload label={t('products.form.images')} accept="image/*" multiple={true} maxSize={10} maxFiles={10} value={images} onChange={setImages} /></div>)}
            </section>

            {mode==='variative' && (
              <section id="sec-variations" data-section="variations" className="space-y-4">
                <h3 className="text-base font-semibold">Variations</h3>
                <VariantsBuilder value={variants} onChange={(v:any)=> { setVariants(v as any) }} baseSku={sku} attributes={(catalogAttributesQuery.data?.items||[]).map((a:any)=> ({ id:a.id, name:a.name, values:a.values||[] }))} onExtrasChange={(items)=> setVariantExtras(items)} />
              </section>
            )}

            {mode==='basic' && (
            <section id="sec-prices" data-section="prices" className="space-y-4">
              <h3 className="text-base font-semibold">{t('products.form.prices')}</h3>
              <div className="grid grid-cols-3 gap-6">
                <Input isRequired label={t('products.form.cost_price') || 'Supply price'} placeholder={t('products.form.cost_price_ph')} type="number" variant="bordered" classNames={{ inputWrapper: 'h-14' }} labelPlacement="inside" value={costPrice.toString()} onValueChange={(v) => { const val = parseFloat(v)||0; setCostPrice(val); if (markup>0) setPrice(Math.round(val*(1+markup/100))) }} endContent={<span className="px-2 text-default-500">UZS</span>} />
                <Input label={'Markup'} placeholder={'0'} type="number" variant="bordered" classNames={{ inputWrapper: 'h-14' }} labelPlacement="inside" value={String(markup)} onValueChange={(v) => { const m = parseFloat(v)||0; setMarkup(m); if (costPrice>0) setPrice(Math.round(costPrice*(1+m/100))) }} endContent={<span className="px-2 text-default-500">%</span>} />
                <Input isRequired label={'Retail price'} placeholder={'0'} type="number" variant="bordered" classNames={{ inputWrapper: 'h-14' }} labelPlacement="inside" value={price.toString()} onValueChange={(v) => { const p = parseFloat(v)||0; setPrice(p); if (costPrice>0) setMarkup(Math.round(((p - costPrice)/costPrice)*100)) }} endContent={<span className="px-2 text-default-500">UZS</span>} />
              </div>
            </section>
            )}

            <section id="sec-quantity" data-section="quantity" className="space-y-4">
              <h3 className="text-base font-semibold">{t('products.form.quantity')}</h3>
              <div className="grid grid-cols-3 gap-6">
                <Input label={t('products.form.stock')} placeholder={t('products.form.stock_ph')} type="number" variant="bordered" classNames={{ inputWrapper: 'h-14' }} labelPlacement="inside" value={stock.toString()} onValueChange={(v) => setStock(parseInt(v) || 0)} />
                <Input label={t('products.form.min_stock')} placeholder={t('products.form.min_stock_ph')} type="number" variant="bordered" classNames={{ inputWrapper: 'h-14' }} labelPlacement="inside" value={minStock.toString()} onValueChange={(v) => setMinStock(parseInt(v) || 0)} />
                <Input label={t('products.form.max_stock')} placeholder={t('products.form.max_stock_ph')} type="number" variant="bordered" classNames={{ inputWrapper: 'h-14' }} labelPlacement="inside" value={maxStock.toString()} onValueChange={(v) => setMaxStock(parseInt(v) || 0)} />
              </div>
            </section>

            <section id="sec-characteristics" data-section="characteristics" className="space-y-4">
              <h3 className="text-base font-semibold">{t('products.form.characteristics')}</h3>

              <div className="grid grid-cols-2 gap-4">
                {(catalogCharacteristicsQuery.data?.items || []).filter(c=> c.is_active).map(c => (
                  <div key={c.id} className="flex flex-col gap-2">
                    {c.type === 'boolean' ? (
                      <Switch isSelected={(charValues[c.id]||'')==='true'} onValueChange={(checked)=> setCharValues(prev => ({ ...prev, [c.id]: checked ? 'true' : 'false' }))}>{''}</Switch>
                    ) : c.type === 'select' ? (
                      <CustomSelect
                        key={`${c.id}-${(charSelectKeys[c.id]||0)}`}
                        label={c.name}
                        placeholder={'Select'}
                        items={(c.values||[]).map((v:string)=> ({ key: v, label: v }))}
                        value={charValues[c.id] || ''}
                        onChange={(val)=> setCharValues(prev => ({ ...prev, [c.id]: val }))}
                        allowCreate
                        onCreate={(term)=> { setEditCharItem(c); setEditCharNewValue(term); setEditCharOpen(true); setCharSelectKeys(prev=> ({ ...prev, [c.id]: (prev[c.id]||0)+1 })) }}
                      />
                    ) : (
                      <Input labelPlacement="inside" label={c.name} variant="bordered" placeholder="Enter value" value={charValues[c.id] || ''} onValueChange={(v)=> setCharValues(prev => ({ ...prev, [c.id]: v }))} />
                    )}
                  </div>
                ))}
              </div>
              <div className="rounded-xl border border-default-300 p-4 flex items-center justify-between">
                <div>
                  <div className="font-medium">Optional field</div>
                  <div className="text-default-500 text-sm">An additional field that characterizes your product</div>
                </div>
                <Button variant="flat" onPress={()=> setCharModalOpen(true)}>+ Add field</Button>
              </div>

              <div className="grid grid-cols-1 gap-6">
                <Select label={t('products.form.status')} variant="bordered" classNames={{ trigger: 'h-14' }} labelPlacement="inside" selectedKeys={[status]} onSelectionChange={(keys) => setStatus(Array.from(keys)[0] as string)}>
                  <SelectItem key="active">{t('products.form.status_active')}</SelectItem>
                  <SelectItem key="inactive">{t('products.form.status_inactive')}</SelectItem>
                </Select>
           
              </div>
              <div>
                <label className="text-sm text-default-600 mb-2 block">{t('products.form.category')}</label>
                <CategorySelector value={categoryIds} onChange={(ids,_labels)=> { setCategoryIds(ids); setCategoryId(ids[ids.length-1] || '') }} />
              </div>
             
              <div className="flex flex-wrap items-center gap-6">
                <Switch isSelected={isPublished} onValueChange={setIsPublished}>{t('products.form.published')}</Switch>
                <Switch isSelected={isActive} onValueChange={setIsActive}>Is Active</Switch>
                <Switch isSelected={isDirtyCore} onValueChange={setIsDirtyCore}>Is Dirty Core</Switch>
                <Switch isSelected={isRealizatsiya} onValueChange={setIsRealizatsiya}>Is Realizatsiya</Switch>
                <Switch isSelected={isKonsignatsiya} onValueChange={setIsKonsignatsiya}>Is Konsignatsiya</Switch>
              </div>
            </section>
            <CharacteristicModal isOpen={charModalOpen} mode="create" onClose={()=> setCharModalOpen(false)} onSuccess={()=> { setCharModalOpen(false); qc.invalidateQueries({ queryKey: ['catalog-characteristics'] }) }} />
            {editCharItem && (
              <CharacteristicModal
                isOpen={editCharOpen}
                mode="edit"
                characteristic={editCharItem}
                onClose={()=> setEditCharOpen(false)}
                onSuccess={async ()=> {
                  setEditCharOpen(false)
                  const res:any = await catalogCharacteristicsQuery.refetch()
                  const updated = (res?.data?.items||[]).find((x:any)=> x.id===editCharItem.id)
                  if (updated && (updated.values||[]).includes(editCharNewValue)) {
                    setCharValues(prev=> ({ ...prev, [editCharItem.id]: editCharNewValue }))
                  }
                }}
              />
            )}
            <BrandModal prefillName={brandPrefill} isOpen={brandModalOpen} mode="create" onClose={()=> setBrandModalOpen(false)} onSuccess={async ()=> { setBrandModalOpen(false); await brandsQuery.refetch(); const created = (brandsQuery.data?.items||[]).find((b:any)=> String(b.name).toLowerCase() === brandPrefill.toLowerCase()); if (created?.id) setBrandId(created.id) }} />
            {/* Removed custom optional fields modal */}
            {isKonsignatsiya && (
              <section className="space-y-4">
                <div className="grid grid-cols-2 gap-6">
                  <DatePicker variant='bordered' aria-label="Konsignatsiya date" label="Konsignatsiya date" onChange={(d:any)=>{ try{ const s = typeof d?.toString==='function'? d.toString(): String(d); setKonsignatsiyaDate(s.split('T')[0]) }catch{} }} />
                </div>
              </section>
            )}
          </div>

          <div className={`sticky bottom-0 mt-4 flex justify-end gap-2 ${embedded ? 'bg-white border-t border-default-200 p-4' : ''}`}>
            <Button variant="flat" onPress={() => { if (embedded) { onClose && onClose() } else { navigate('/products/catalog') } }}>{t('products.form.cancel')}</Button>
            <Button color="primary" onPress={() => createMutation.mutate()} isLoading={createMutation.isPending}>{t('products.form.create_btn')}</Button>
          </div>
        </div>
      </div>
    </CustomMainBody>
  )
} 