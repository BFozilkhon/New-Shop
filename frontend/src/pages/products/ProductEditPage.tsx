import { useEffect, useRef, useState } from 'react'
import CustomMainBody from '../../components/common/CustomMainBody'
import { Button, Input, Select, SelectItem, Textarea, Switch, DatePicker } from '@heroui/react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { categoriesService } from '../../services/categoriesService'
import { attributesService } from '../../services/attributesService'
import { characteristicsService } from '../../services/characteristicsService'
import { brandsService } from '../../services/brandsService'
import { suppliersService } from '../../services/suppliersService'
import { productsService, ProductDimensions } from '../../services/productsService'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { toast } from 'react-toastify'
import CustomDocumentUpload from '../../components/common/CustomDocumentUpload'
import { useTranslation } from 'react-i18next'
import { storesService } from '../../services/storesService'
import { companiesService } from '../../services/companiesService'

const sections = [
  { key: 'main', labelKey: 'products.form.main' },
  { key: 'prices', labelKey: 'products.form.prices' },
  { key: 'quantity', labelKey: 'products.form.quantity' },
  { key: 'characteristics', labelKey: 'products.form.characteristics' },
]

export default function ProductEditPage() {
  const { t } = useTranslation()
  const [active, setActive] = useState('main')
  const containerRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const [searchParams] = useSearchParams()
  const isViewMode = searchParams.get('mode') === 'view'
  const qc = useQueryClient()

  // Form state
  const [name, setName] = useState('')
  const [sku, setSku] = useState('')
  const [partNumber, setPartNumber] = useState('')
  const [description, setDescription] = useState('')
  const [categoryId, setCategoryId] = useState<string>('')
  const [brandId, setBrandId] = useState<string>('')
  const [supplierId, setSupplierId] = useState<string>('')
  const [companyId, setCompanyId] = useState<string>('')
  const [storeId, setStoreId] = useState<string>('')
  const [barcode, setBarcode] = useState('')
  const [unit, setUnit] = useState('')
  const [weight, setWeight] = useState(0)
  const [dimensions, setDimensions] = useState<ProductDimensions>({ length: 0, width: 0, height: 0, unit: 'cm' })
  const [price, setPrice] = useState(0)
  const [costPrice, setCostPrice] = useState(0)
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

  // Images
  const [images, setImages] = useState<string[]>([])

  // Load product data
  const { data: product, isLoading } = useQuery({ queryKey: ['product', id], queryFn: () => productsService.get(id!), enabled: !!id })

  // Load dropdown data
  const categoriesQuery = useQuery({ queryKey: ['categories', 1, 100, ''], queryFn: () => categoriesService.list({ page: 1, limit: 100 }), placeholderData: (prev) => prev })
  const brandsQuery = useQuery({ queryKey: ['brands', 1, 100, ''], queryFn: () => brandsService.list({ page: 1, limit: 100 }), placeholderData: (prev) => prev })
  const suppliersQuery = useQuery({ queryKey: ['suppliers', 1, 100, ''], queryFn: () => suppliersService.list({ page: 1, limit: 100 }), placeholderData: (prev) => prev })
  const companiesQuery = useQuery({ queryKey: ['companies',1,100,''], queryFn: ()=> companiesService.list({ page:1, limit:100, search:'' }), placeholderData:(p)=>p })
  const storesQuery = useQuery({ queryKey: ['stores',1,200,'', companyId], queryFn: ()=> storesService.list({ page:1, limit:200, company_id: companyId||undefined }), placeholderData:(p)=>p })
  const catalogAttributesQuery = useQuery({ queryKey: ['catalog-attributes', 1, 100, ''], queryFn: () => attributesService.list({ page: 1, limit: 100 }), placeholderData: (prev) => prev })
  const catalogCharacteristicsQuery = useQuery({ queryKey: ['catalog-characteristics', 1, 100, ''], queryFn: () => characteristicsService.list({ page: 1, limit: 100 }), placeholderData: (prev) => prev })

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!name || !sku || price <= 0) throw new Error('Please fill in all required fields')
      
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
        brand_id: brandId || undefined,
        supplier_id: supplierId || undefined,
        company_id: companyId || undefined,
        store_id: storeId || undefined,
        images,
        attributes: [],
        catalog_attributes: [],
        catalog_characteristics: [],
        barcode,
        status,
        is_published: isPublished,
        is_active: isActive,
        is_dirty_core: isDirtyCore,
        is_konsignatsiya: isKonsignatsiya,
        konsignatsiya_date: isKonsignatsiya && konsignatsiyaDate ? new Date(konsignatsiyaDate).toISOString() : undefined,
        expiration_date: expirationDate ? new Date(expirationDate).toISOString() : undefined,
      }

      return productsService.update(id!, payload)
    },
    onSuccess: () => {
      toast.success('Product updated successfully')
      qc.invalidateQueries({ queryKey: ['products'] })
      qc.invalidateQueries({ queryKey: ['product', id] })
      navigate('/products/catalog')
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to update product')
    }
  } as any)

  // Populate form when product data loads
  useEffect(() => {
    if (product) {
      setName(product.name)
      setSku(product.sku)
      setPartNumber(product.part_number || '')
      setDescription(product.description)
      setCategoryId(product.category_id || '')
      setBrandId(product.brand_id || '')
      setSupplierId(product.supplier_id || '')
      setCompanyId(product.company_id || '')
      setStoreId(product.store_id || '')
      setBarcode(product.barcode)
      setUnit(product.unit)
      setWeight(product.weight)
      setDimensions(product.dimensions)
      setPrice(product.price)
      setCostPrice(product.cost_price)
      setStock(product.stock)
      setMinStock(product.min_stock)
      setMaxStock(product.max_stock)
      setImages(product.images || [])
      setSelectedCatalogAttribute('')
      setSelectedCatalogCharacteristic('')
      setStatus(product.status)
      setIsPublished(product.is_published)
      setIsActive(product.is_active)
      setIsDirtyCore(!!product.is_dirty_core)
      setIsKonsignatsiya(!!product.is_konsignatsiya)
      setKonsignatsiyaDate(product.konsignatsiya_date ? product.konsignatsiya_date.slice(0,10) : '')
      setExpirationDate(product.expiration_date ? product.expiration_date.slice(0,10) : '')
    }
  }, [product])

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

  const handleSelect = (key: string) => {
    setActive(key)
    const el = document.getElementById(`sec-${key}`)
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }


  if (isLoading) return <div>Loading...</div>

  return (
    <CustomMainBody>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold">{isViewMode ? t('common.view') + ' ' + t('products.header').slice(0, -1) : t('common.edit') + ' ' + t('products.header').slice(0, -1)}</h1>
        <Button color="primary" startContent={<ArrowLeftIcon className="w-4 h-4" />} onPress={() => navigate('/products/catalog')}>{t('products.form.back')}</Button>
      </div>
      <div className="grid grid-cols-[220px_1fr] gap-6">
        <aside className="sticky top-4 self-start rounded-lg border border-default-200 p-2 h-fit">
          <ul className="space-y-1">
            {sections.map(s => (
              <li key={s.key}>
                <button className={`w-full text-left px-3 py-2 rounded-md hover:bg-default-100 ${active === s.key ? 'bg-default-100 font-medium' : ''}`} onClick={() => handleSelect(s.key)}>
                  {t(s.labelKey)}
                </button>
              </li>
            ))}
          </ul>
        </aside>
        <div className="relative">
          <div ref={containerRef} className="min-h-[400px] rounded-lg border border-default-200 p-4 max-h-[70vh] overflow-auto space-y-10">
            
            <section id="sec-main" data-section="main" className="space-y-4">
              <h3 className="text-base font-semibold">{t('products.form.main')}</h3>
              <div className="grid grid-cols-2 gap-6">
                <Input isRequired label={t('products.form.product_name')} placeholder={t('products.form.product_name_ph')} variant="bordered" classNames={{ inputWrapper: 'h-14' }} labelPlacement="inside" value={name} onValueChange={setName} isReadOnly={isViewMode} />
                <Input isRequired label={t('products.form.sku')} placeholder={t('products.form.sku_ph')} variant="bordered" classNames={{ inputWrapper: 'h-14' }} labelPlacement="inside" value={sku} onValueChange={setSku} isReadOnly={isViewMode} />
                <Input label={t('products.form.part_number')} placeholder={t('products.form.part_number_ph')} variant="bordered" classNames={{ inputWrapper: 'h-14' }} labelPlacement="inside" value={partNumber} onValueChange={setPartNumber} isReadOnly={isViewMode} />
                <Input label={t('products.form.barcode')} placeholder={t('products.form.barcode_ph')} variant="bordered" classNames={{ inputWrapper: 'h-14' }} labelPlacement="inside" value={barcode} onValueChange={setBarcode} isReadOnly={isViewMode} />
                
                <Select
                  label={t('products.form.category')}
                  placeholder={t('products.form.category_ph')}
                  variant="bordered"
                  classNames={{ trigger: 'h-14' }}
                  labelPlacement="inside"
                  selectedKeys={categoryId ? [categoryId] : []}
                  onSelectionChange={(keys) => setCategoryId(Array.from(keys)[0] as string || '')}
                  isDisabled={isViewMode}
                >
                  {(categoriesQuery.data?.items || []).map(category => (
                    <SelectItem key={category.id}>{category.name}</SelectItem>
                  ))}
                </Select>
                
                <Select
                  label={t('products.form.brand')}
                  placeholder={t('products.form.brand_ph')}
                  variant="bordered"
                  classNames={{ trigger: 'h-14' }}
                  labelPlacement="inside"
                  selectedKeys={brandId ? [brandId] : []}
                  onSelectionChange={(keys) => setBrandId(Array.from(keys)[0] as string || '')}
                  isDisabled={isViewMode}
                >
                  {(brandsQuery.data?.items || []).map(brand => (
                    <SelectItem key={brand.id}>{brand.name}</SelectItem>
                  ))}
                </Select>
                
                <Select
                  label={t('companies.header')}
                  variant="bordered"
                  classNames={{ trigger: 'h-14' }}
                  labelPlacement="inside"
                  selectedKeys={companyId ? [companyId] : []}
                  onSelectionChange={(keys) => setCompanyId(Array.from(keys)[0] as string || '')}
                  isDisabled={isViewMode}
                >
                  {(companiesQuery.data?.items || []).map(co => (<SelectItem key={co.id}>{co.title}</SelectItem>))}
                </Select>

                <Select
                  label={t('stores.header')}
                  variant="bordered"
                  classNames={{ trigger: 'h-14' }}
                  labelPlacement="inside"
                  selectedKeys={storeId ? [storeId] : []}
                  onSelectionChange={(keys) => setStoreId(Array.from(keys)[0] as string || '')}
                  isDisabled={isViewMode}
                >
                  {(storesQuery.data?.items || []).map(st => (<SelectItem key={st.id}>{st.title}</SelectItem>))}
                </Select>

                <Select
                  label={t('products.form.supplier')}
                  placeholder={t('products.form.supplier_ph')}
                  variant="bordered"
                  classNames={{ trigger: 'h-14' }}
                  labelPlacement="inside"
                  selectedKeys={supplierId ? [supplierId] : []}
                  onSelectionChange={(keys) => setSupplierId(Array.from(keys)[0] as string || '')}
                  isDisabled={isViewMode}
                >
                  {(suppliersQuery.data?.items || []).map(supplier => (
                    <SelectItem key={supplier.id}>{supplier.name}</SelectItem>
                  ))}
                </Select>
                
                <Input label={t('products.form.unit')} placeholder={t('products.form.unit_ph')} variant="bordered" classNames={{ inputWrapper: 'h-14' }} labelPlacement="inside" value={unit} onValueChange={setUnit} isReadOnly={isViewMode} />
                <Input label={t('products.form.weight')} placeholder={t('products.form.weight_ph')} type="number" variant="bordered" classNames={{ inputWrapper: 'h-14' }} labelPlacement="inside" value={weight.toString()} onValueChange={(v) => setWeight(parseFloat(v) || 0)} isReadOnly={isViewMode} />
                
                <DatePicker variant='bordered' aria-label="Expiration date" label="Expiration date" isDisabled={isViewMode} onChange={(d:any)=>{ try{ const s = typeof d?.toString==='function'? d.toString(): String(d); setExpirationDate(s.split('T')[0]) }catch{} }} />

                <div className="col-span-2">
                  <Textarea label={t('products.form.description')} placeholder={t('products.form.description_ph')} variant="bordered" classNames={{ inputWrapper: 'min-h-[3.5rem]' }} value={description} onValueChange={setDescription} isReadOnly={isViewMode} />
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium mb-4">{t('products.form.dimensions')}</h4>
                <div className="grid grid-cols-4 gap-4">
                  <Input label={t('products.form.length')} type="number" variant="bordered" classNames={{ inputWrapper: 'h-14' }} labelPlacement="inside" value={dimensions.length.toString()} onValueChange={(v) => setDimensions({...dimensions, length: parseFloat(v) || 0})} isReadOnly={isViewMode} />
                  <Input label={t('products.form.width')} type="number" variant="bordered" classNames={{ inputWrapper: 'h-14' }} labelPlacement="inside" value={dimensions.width.toString()} onValueChange={(v) => setDimensions({...dimensions, width: parseFloat(v) || 0})} isReadOnly={isViewMode} />
                  <Input label={t('products.form.height')} type="number" variant="bordered" classNames={{ inputWrapper: 'h-14' }} labelPlacement="inside" value={dimensions.height.toString()} onValueChange={(v) => setDimensions({...dimensions, height: parseFloat(v) || 0})} isReadOnly={isViewMode} />
                  <Select label={t('products.form.dim_unit')} variant="bordered" classNames={{ trigger: 'h-14' }} labelPlacement="inside" selectedKeys={[dimensions.unit]} onSelectionChange={(keys) => setDimensions({...dimensions, unit: Array.from(keys)[0] as string})} isDisabled={isViewMode}>
                    <SelectItem key="cm">cm</SelectItem>
                    <SelectItem key="mm">mm</SelectItem>
                    <SelectItem key="m">m</SelectItem>
                    <SelectItem key="in">in</SelectItem>
                  </Select>
                </div>
              </div>

              <div>
                <CustomDocumentUpload
                  label={t('products.form.images')}
                  accept="image/*"
                  multiple={true}
                  maxSize={10}
                  maxFiles={10}
                  value={images}
                  onChange={setImages}
                  isReadOnly={isViewMode}
                />
              </div>
            </section>

            <section id="sec-prices" data-section="prices" className="space-y-4">
              <h3 className="text-base font-semibold">{t('products.form.prices')}</h3>
              <div className="grid grid-cols-2 gap-6">
                <Input isRequired label={t('products.form.price')} placeholder={t('products.form.price_ph')} type="number" variant="bordered" classNames={{ inputWrapper: 'h-14' }} labelPlacement="inside" value={price.toString()} onValueChange={(v) => setPrice(parseFloat(v) || 0)} startContent={<span className="text-default-400">$</span>} isReadOnly={isViewMode} />
                <Input label={t('products.form.cost_price')} placeholder={t('products.form.cost_price_ph')} type="number" variant="bordered" classNames={{ inputWrapper: 'h-14' }} labelPlacement="inside" value={costPrice.toString()} onValueChange={(v) => setCostPrice(parseFloat(v) || 0)} startContent={<span className="text-default-400">$</span>} isReadOnly={isViewMode} />
              </div>
            </section>

            <section id="sec-quantity" data-section="quantity" className="space-y-4">
              <h3 className="text-base font-semibold">{t('products.form.quantity')}</h3>
              <div className="grid grid-cols-3 gap-6">
                <Input label={t('products.form.stock')} placeholder={t('products.form.stock_ph')} type="number" variant="bordered" classNames={{ inputWrapper: 'h-14' }} labelPlacement="inside" value={stock.toString()} onValueChange={(v) => setStock(parseInt(v) || 0)} isReadOnly={isViewMode} />
                <Input label={t('products.form.min_stock')} placeholder={t('products.form.min_stock_ph')} type="number" variant="bordered" classNames={{ inputWrapper: 'h-14' }} labelPlacement="inside" value={minStock.toString()} onValueChange={(v) => setMinStock(parseInt(v) || 0)} isReadOnly={isViewMode} />
                <Input label={t('products.form.max_stock')} placeholder={t('products.form.max_stock_ph')} type="number" variant="bordered" classNames={{ inputWrapper: 'h-14' }} labelPlacement="inside" value={maxStock.toString()} onValueChange={(v) => setMaxStock(parseInt(v) || 0)} isReadOnly={isViewMode} />
              </div>
            </section>

            <section id="sec-characteristics" data-section="characteristics" className="space-y-4">
              <h3 className="text-base font-semibold">{t('products.form.characteristics')}</h3>
              
              <div className="grid grid-cols-1 gap-6">
                <Select
                  label={t('products.form.status')}
                  variant="bordered"
                  classNames={{ trigger: 'h-14' }}
                  labelPlacement="inside"
                  selectedKeys={[status]}
                  onSelectionChange={(keys) => setStatus(Array.from(keys)[0] as string)}
                  isDisabled={isViewMode}
                >
                  <SelectItem key="active">{t('products.form.status_active')}</SelectItem>
                  <SelectItem key="inactive">{t('products.form.status_inactive')}</SelectItem>
                  <SelectItem key="discontinued">{t('products.form.status_discontinued')}</SelectItem>
                </Select>

                <Select
                  label={t('products.form.catalog_attribute')}
                  placeholder={t('products.form.catalog_attribute_ph')}
                  variant="bordered"
                  classNames={{ trigger: 'h-14' }}
                  labelPlacement="inside"
                  selectedKeys={selectedCatalogAttribute ? [selectedCatalogAttribute] : []}
                  onSelectionChange={(keys) => setSelectedCatalogAttribute(Array.from(keys)[0] as string || '')}
                  isDisabled={isViewMode}
                >
                  {(catalogAttributesQuery.data?.items || []).map(attr => (
                    <SelectItem key={attr.id}>{attr.name}</SelectItem>
                  ))}
                </Select>

                <Select
                  label={t('products.form.catalog_characteristic')}
                  placeholder={t('products.form.catalog_characteristic_ph')}
                  variant="bordered"
                  classNames={{ trigger: 'h-14' }}
                  labelPlacement="inside"
                  selectedKeys={selectedCatalogCharacteristic ? [selectedCatalogCharacteristic] : []}
                  onSelectionChange={(keys) => setSelectedCatalogCharacteristic(Array.from(keys)[0] as string || '')}
                  isDisabled={isViewMode}
                >
                  {(catalogCharacteristicsQuery.data?.items || []).map(char => (
                    <SelectItem key={char.id}>{char.name}</SelectItem>
                  ))}
                </Select>
              </div>

              <div className="flex flex-wrap items-center gap-6">
                <Switch isSelected={isPublished} onValueChange={setIsPublished} isDisabled={isViewMode}>{t('products.form.published')}</Switch>
                <Switch isSelected={isActive} onValueChange={setIsActive} isDisabled={isViewMode}>Is Active</Switch>
                <Switch isSelected={isDirtyCore} onValueChange={setIsDirtyCore} isDisabled={isViewMode}>Is Dirty Core</Switch>
                <Switch isSelected={isKonsignatsiya} onValueChange={setIsKonsignatsiya} isDisabled={isViewMode}>Is Konsignatsiya</Switch>
                {isKonsignatsiya ? (
                  <DatePicker variant='bordered' aria-label="Konsignatsiya date" label="Konsignatsiya date" isDisabled={isViewMode} onChange={(d:any)=>{ try{ const s = typeof d?.toString==='function'? d.toString(): String(d); setKonsignatsiyaDate(s.split('T')[0]) }catch{} }} />
                ) : null}
              </div>
            </section>
          </div>

          <div className="sticky bottom-0 mt-4 flex justify-end gap-2">
            <Button variant="flat" onPress={() => navigate('/products/catalog')}>{t('products.form.cancel')}</Button>
            {!isViewMode && (
              <Button color="primary" onPress={() => updateMutation.mutate()} isLoading={updateMutation.isPending}>
                {t('products.form.update_btn')}
              </Button>
            )}
          </div>
        </div>
      </div>
    </CustomMainBody>
  )
} 