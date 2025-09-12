import { useMemo, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { productsService, Product } from '../../services/productsService'
import CustomMainBody from '../../components/common/CustomMainBody'
import CustomTable, { CustomColumn } from '../../components/common/CustomTable'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Button, Chip, Dropdown, DropdownItem, DropdownMenu, DropdownTrigger, Tooltip } from '@heroui/react'
import { EllipsisVerticalIcon, EyeIcon, PencilSquareIcon, TrashIcon, PhotoIcon, ArchiveBoxArrowDownIcon, PlusIcon, ChevronDownIcon, TagIcon, CubeIcon, BanknotesIcon, CurrencyDollarIcon } from '@heroicons/react/24/outline'
import ConfirmModal from '../../components/common/ConfirmModal'
import { useAuth } from '../../store/auth'
import { useTranslation } from 'react-i18next'
import { usePreferences } from '../../store/prefs'
import ProductBulkActions from './components/ProductBulkActions'
import Lightbox from 'yet-another-react-lightbox'
import 'yet-another-react-lightbox/styles.css'
import { toast } from 'react-toastify'

function BulkActions({ disabled, onOpen }: { disabled: boolean; onOpen: () => void }) {
  if (disabled) {
    return (
      <Tooltip content="Select rows to enable" placement="bottom">
        <span>
          <Button variant="bordered" isDisabled startContent={<ArchiveBoxArrowDownIcon className="w-4 h-4" />}>Bulk actions</Button>
        </span>
      </Tooltip>
    )
  }
  return (
    <Button variant="bordered" onPress={onOpen} startContent={<ArchiveBoxArrowDownIcon className="w-4 h-4" />}>Bulk actions</Button>
  )
}

const nfUZS = new Intl.NumberFormat('en-US')

export default function ProductsPage() {
  const { t } = useTranslation()
  const qc = useQueryClient()
  const navigate = useNavigate()
  const [sp, setSp] = useSearchParams()
  const page = Number(sp.get('page') || '1')
  const limit = Number(sp.get('limit') || '10')
  const search = sp.get('search') || ''
  const [confirm, setConfirm] = useState<{ open: boolean; id?: string; name?: string }>({ open: false })
  const [confirmArchive, setConfirmArchive] = useState<{ open: boolean; id?: string; name?: string }>({ open: false })
  const { auth } = useAuth()
  const can = (p: string) => auth.permissions.includes(p)
  const { prefs } = usePreferences()
  const [showStats, setShowStats] = useState(true)

  const status = sp.get('status') || 'all'
  const lowStock = sp.get('low_stock') === '1'
  const zeroStock = sp.get('zero_stock') === '1'
  const isReal = sp.get('is_realizatsiya') === '1'
  const isKons = sp.get('is_konsignatsiya') === '1'
  const isDirty = sp.get('is_dirty_core') === '1'

  // data list
  const { data, isLoading } = useQuery({
    queryKey: ['products', page, limit, search, prefs.selectedStoreId, status, lowStock, zeroStock, isReal, isKons, isDirty],
    queryFn: () => productsService.list({ page, limit, search, store_id: prefs.selectedStoreId || undefined, status: status==='all'? undefined : status, low_stock: lowStock? true: undefined, zero_stock: zeroStock? true: undefined, is_realizatsiya: isReal? true: undefined, is_konsignatsiya: isKons? true: undefined, is_dirty_core: isDirty? true: undefined }),
    placeholderData: (prev) => prev,
    enabled: can('products.catalog.access'),
  })

  // stats for tabs
  const statsQ = useQuery({
    queryKey: ['products-stats', prefs.selectedStoreId],
    queryFn: () => productsService.stats({ store_id: prefs.selectedStoreId || undefined }),
    enabled: can('products.catalog.access'),
    placeholderData: (p)=> p,
  })

  // summary cards
  const summaryQ = useQuery({
    queryKey: ['products-summary', prefs.selectedStoreId],
    queryFn: () => productsService.summary({ store_id: prefs.selectedStoreId || undefined }),
    enabled: can('products.catalog.access'),
    placeholderData: (p)=> p,
  })

  const items = useMemo(() => (data?.items || []).map((p: Product) => {
    const add = (p as any).additional_parameters || {}
    const volume = p.dimensions?.length && p.dimensions?.width && p.dimensions?.height
      ? Number(p.dimensions.length) * Number(p.dimensions.width) * Number(p.dimensions.height)
      : undefined
    return {
      id: p.id,
      images: p.images || [],
      name: p.name,
      sku: p.sku,
      barcode: p.barcode,
      category_name: p.category_name || '-',
      supplier_name: p.supplier_name || '-',
      brand_name: p.brand_name || '-',
      stock: p.stock,
      cost_price: p.cost_price,
      price: p.price,
      discount_price: add.discount_price ?? '-',
      wholesale_price: add.wholesale_price ?? '-',
      description: p.description || '-',
      volume: volume || '-',
      ikpu1: add.ikpu1 || add.IKPU1 || '-',
      expiration_date: p.expiration_date || '-',
      status: p.status,
      is_active: p.is_active,
    }
  }), [data])

  const columns: CustomColumn[] = useMemo(() => [
    { uid: 'photo', name: 'Photo' },
    { uid: 'name', name: t('products.columns.name'), sortable: true },
    { uid: 'sku', name: t('products.columns.sku'), sortable: true },
    { uid: 'barcode', name: t('repricing.detail.table.barcode','Barcode') },
    { uid: 'category_name', name: t('products.columns.category') },
    { uid: 'supplier_name', name: 'Suppliers' },
    { uid: 'stock', name: t('products.columns.stock'), sortable: true },
    { uid: 'cost_price', name: 'Supply price' },
    { uid: 'price', name: 'Retail price' },
    { uid: 'discount_price', name: 'Discount price' },
    { uid: 'brand_name', name: t('products.columns.brand') },
    { uid: 'description', name: 'Description' },
    { uid: 'expiration_date', name: 'Expire date' },
    { uid: 'actions', name: t('products.columns.actions') },
  ], [t])

  const topTabs = useMemo(()=>[
    { key: 'all', label: `All`, count: statsQ.data?.all },
    { key: 'active', label: 'Active', count: statsQ.data?.active },
    { key: 'inactive', label: 'Inactive', count: statsQ.data?.inactive },
    { key: 'low', label: 'Low stock', count: statsQ.data?.low },
    { key: 'zero', label: 'Zero stock', count: statsQ.data?.zero },
    { key: 'realizatsiya', label: 'Realizatsiya' },
    { key: 'konsignatsiya', label: 'Konsignatsiya' },
    { key: 'dirty', label: 'Dirty core' },
  ],[statsQ.data])

  const onTabChange = (key: string) => {
    const next = new URLSearchParams(sp)
    next.set('page','1')
    if (key==='all') { next.delete('status'); next.delete('low_stock'); next.delete('zero_stock'); next.delete('is_realizatsiya'); next.delete('is_konsignatsiya'); next.delete('is_dirty_core') }
    if (key==='active') { next.set('status','active'); next.delete('low_stock'); next.delete('zero_stock'); next.delete('is_realizatsiya'); next.delete('is_konsignatsiya'); next.delete('is_dirty_core') }
    if (key==='inactive') { next.set('status','inactive'); next.delete('low_stock'); next.delete('zero_stock'); next.delete('is_realizatsiya'); next.delete('is_konsignatsiya'); next.delete('is_dirty_core') }
    if (key==='low') { next.delete('status'); next.set('low_stock','1'); next.delete('zero_stock'); next.delete('is_realizatsiya'); next.delete('is_konsignatsiya'); next.delete('is_dirty_core') }
    if (key==='zero') { next.delete('status'); next.delete('low_stock'); next.set('zero_stock','1'); next.delete('is_realizatsiya'); next.delete('is_konsignatsiya'); next.delete('is_dirty_core') }
    if (key==='realizatsiya') { next.delete('status'); next.delete('low_stock'); next.delete('zero_stock'); next.set('is_realizatsiya','1'); next.delete('is_konsignatsiya'); next.delete('is_dirty_core') }
    if (key==='konsignatsiya') { next.delete('status'); next.delete('low_stock'); next.delete('zero_stock'); next.delete('is_realizatsiya'); next.set('is_konsignatsiya','1'); next.delete('is_dirty_core') }
    if (key==='dirty') { next.delete('status'); next.delete('low_stock'); next.delete('zero_stock'); next.delete('is_realizatsiya'); next.delete('is_konsignatsiya'); next.set('is_dirty_core','1') }
    setSp(next)
  }

  const activeTab = zeroStock ? 'zero' : lowStock ? 'low' : isReal ? 'realizatsiya' : isKons ? 'konsignatsiya' : isDirty ? 'dirty' : (status==='active'?'active': status==='inactive'?'inactive':'all')

  const updateParams = (patch: Record<string, string | number | null>) => {
    const next = new URLSearchParams(sp)
    Object.entries(patch).forEach(([k, v]) => {
      if (v === null || v === undefined || String(v) === '') next.delete(k)
      else next.set(k, String(v))
    })
    setSp(next)
  }

  const handleDelete = async (id: string) => {
    await productsService.remove(id)
    toast.success('Product deleted')
    qc.invalidateQueries({ queryKey: ['products'] })
  }

  const handleArchive = async (id: string) => {
    await productsService.bulkArchive([id])
    toast.success('Product archived')
    qc.invalidateQueries({ queryKey: ['products'] })
  }

  const [viewerOpen, setViewerOpen] = useState(false)
  const [viewerImages, setViewerImages] = useState<string[]>([])
  const [viewerIndex, setViewerIndex] = useState(0)

  const renderCell = (item: any, key: string) => {
    switch (key) {
      case 'photo': {
        const first = (item.images || [])[0]
        return first ? (
          <img
            src={first}
            alt={item.name}
            className="w-12 h-12 rounded object-cover cursor-pointer"
            onClick={() => { setViewerImages(item.images || []); setViewerIndex(0); setViewerOpen(true) }}
          />
        ) : (
          <div className="w-12 h-12 border border-default-300 rounded grid place-items-center text-default-400">
            <PhotoIcon className="w-6 h-6" />
          </div>
        )
      }
      case 'cost_price':
        return `${nfUZS.format(Number(item.cost_price||0))} UZS`
      case 'price':
        return `${nfUZS.format(Number(item.price||0))} UZS`
      case 'stock':
        return (
          <Chip className="capitalize" color={item.stock > 0 ? 'success' : item.stock === 0 ? 'warning' : 'danger'} size="sm" variant="flat">{item.stock}</Chip>
        )
      case 'status': {
        const statusColors = { active: 'success', inactive: 'warning', discontinued: 'danger' } as const
        return (
          <Chip className="capitalize border-none gap-1 text-default-600" color={statusColors[item.status as keyof typeof statusColors] || 'default'} size="sm" variant="dot">{item.status}</Chip>
        )
      }
      case 'actions': {
        const actions: any[] = []
        actions.push(
          <DropdownItem key="view" startContent={<EyeIcon className="w-4 h-4" />} onPress={() => navigate(`/products/catalog/${item.id}/view?mode=view`)}>{t('common.view')}</DropdownItem>
        )
        if (can('products.catalog.update')) {
          actions.push(
            <DropdownItem key="edit" startContent={<PencilSquareIcon className="w-4 h-4" />} onPress={() => navigate(`/products/catalog/${item.id}/edit`)}>{t('common.edit')}</DropdownItem>
          )
        }
        actions.push(
          <DropdownItem key="archive" startContent={<ArchiveBoxArrowDownIcon className="w-4 h-4" />} onPress={() => setConfirmArchive({ open: true, id: item.id, name: item.name })}>{'Archive'}</DropdownItem>
        )
        if (can('products.catalog.delete')) {
          actions.push(
            <DropdownItem key="delete" className="text-danger" color="danger" startContent={<TrashIcon className="w-4 h-4" />} onPress={() => setConfirm({ open: true, id: item.id, name: item.name })}>{t('common.delete')}</DropdownItem>
          )
        }
        return (
          <Dropdown placement="bottom-end">
            <DropdownTrigger>
              <Button isIconOnly variant="light" size="sm" aria-label="actions">
                <EllipsisVerticalIcon className="w-5 h-5" />
              </Button>
            </DropdownTrigger>
            <DropdownMenu aria-label="Actions">{actions}</DropdownMenu>
          </Dropdown>
        )
      }
      default:
        return item[key]
    }
  }

  const [selected, setSelected] = useState<Set<string>>(new Set())
  const selectedIds = Array.from(selected) as string[]
  const [bulkOpen, setBulkOpen] = useState(false)

  const bulkRight = (
    <div className="flex gap-2">
      <Button variant="flat" onPress={() => navigate('/products/catalog/archive')} startContent={<ArchiveBoxArrowDownIcon className="w-4 h-4" />}>Archive</Button>
      <BulkActions disabled={selected.size === 0} onOpen={() => setBulkOpen(true)} />
      {can('products.catalog.create') ? (
        <Button color="primary" onPress={() => navigate('/products/catalog/create')} startContent={<PlusIcon className="h-5 w-5" />}>{t('products.create')}</Button>
      ) : null}
    </div>
  )

  if (!can('products.catalog.access')) {
    return (
      <CustomMainBody>
        <h1 className="text-xl font-semibold">{t('products.header')}</h1>
        <div className="mt-6 text-default-500">{t('products.no_access')}</div>
      </CustomMainBody>
    )
  }

  return (
    <>
      <CustomMainBody>
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-xl font-semibold">{t('products.header')}</h1>
          <div role="button" aria-pressed={showStats} onClick={()=> setShowStats(s=>!s)} className="flex items-center gap-2 text-foreground/80 hover:text-foreground cursor-pointer select-none">
            <ChevronDownIcon className={`w-5 h-5 transition-transform ${showStats ? 'rotate-180' : ''}`} />
            <span>{showStats ? 'Hide statistics' : 'Show statistics'}</span>
          </div>
        </div>

        {/* Summary cards */}
        {showStats ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-2">
            <div className="rounded-2xl bg-gray-900 border border-gray-700 p-5 flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-200">Product titles</div>
                <div className="mt-2 text-2xl font-semibold tracking-wide"><span className="text-blue-500">{summaryQ.data?.titles || 0}</span> <span className="text-gray-400 text-base ml-1">pcs</span></div>
              </div>
              <div className="h-11 w-11 rounded-full bg-gray-800 grid place-items-center"><TagIcon className="h-6 w-6 text-blue-500" /></div>
            </div>
            <div className="rounded-2xl bg-gray-900 border border-gray-700 p-5 flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-200">Product units</div>
                <div className="mt-2 text-2xl font-semibold tracking-wide"><span className="text-blue-500">{summaryQ.data?.units || 0}</span> <span className="text-gray-400 text-base ml-1">units</span></div>
              </div>
              <div className="h-11 w-11 rounded-full bg-gray-800 grid place-items-center"><CubeIcon className="h-6 w-6 text-blue-500" /></div>
            </div>
            <div className="rounded-2xl bg-gray-900 border border-gray-700 p-5 flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-200">Amount at the supply price</div>
                <div className="mt-2 text-2xl font-semibold tracking-wide"><span className="text-blue-500">{nfUZS.format(Number(summaryQ.data?.supply || 0))}</span> <span className="text-gray-300 text-base ml-1">UZS</span></div>
              </div>
              <div className="h-11 w-11 rounded-full bg-gray-800 grid place-items-center"><BanknotesIcon className="h-6 w-6 text-blue-500" /></div>
            </div>
            <div className="rounded-2xl bg-gray-900 border border-gray-700 p-5 flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-200">Amount at the retail price</div>
                <div className="mt-2 text-2xl font-semibold tracking-wide"><span className="text-blue-500">{nfUZS.format(Number(summaryQ.data?.retail || 0))}</span> <span className="text-gray-300 text-base ml-1">UZS</span></div>
              </div>
              <div className="h-11 w-11 rounded-full bg-gray-800 grid place-items-center"><CurrencyDollarIcon className="h-6 w-6 text-blue-500" /></div>
            </div>
          </div>
        ) : null}

        {isLoading ? <div>Loading...</div> : (
          <CustomTable
            columns={columns}
            items={items}
            total={data?.total ?? 0}
            page={page}
            limit={limit}
            onPageChange={(p) => updateParams({ page: p })}
            onLimitChange={(l) => updateParams({ limit: l, page: 1 })}
            searchValue={search}
            onSearchChange={(v) => updateParams({ search: v, page: 1 })}
            onSearchClear={() => updateParams({ search: null, page: 1 })}
            renderCell={renderCell}
            rightAction={bulkRight}
            selectable
            selectedKeys={selected as any}
            onSelectionChange={(k) => setSelected(k as Set<string>)}
            topTabs={topTabs}
            activeTabKey={activeTab}
            onTabChange={onTabChange}
          />
        )}
      </CustomMainBody>

      <ConfirmModal
        isOpen={confirm.open}
        title={t('products.delete_confirm_title')}
        description={t('products.delete_confirm_desc', { name: confirm.name })}
        confirmText={t('common.delete')}
        confirmColor="danger"
        onConfirm={() => { if (confirm.id) handleDelete(confirm.id) }}
        onClose={() => setConfirm({ open: false })}
      />

      <ConfirmModal
        isOpen={confirmArchive.open}
        title={`Archive ${confirmArchive.name || 'product'}?`}
        description={`You can restore it from Archive page.`}
        confirmText={`Archive`}
        onConfirm={() => { if (confirmArchive.id) handleArchive(confirmArchive.id) }}
        onClose={() => setConfirmArchive({ open: false })}
      />

      <Lightbox open={viewerOpen} close={() => setViewerOpen(false)} index={viewerIndex} slides={(viewerImages||[]).map(src => ({ src }))} />

      <ProductBulkActions selectedIds={selectedIds} isOpen={bulkOpen} onOpenChange={setBulkOpen} />
    </>
  )
} 