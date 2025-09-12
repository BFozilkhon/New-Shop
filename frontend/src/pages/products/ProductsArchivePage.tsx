import { useMemo, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { productsService, Product } from '../../services/productsService'
import CustomMainBody from '../../components/common/CustomMainBody'
import CustomTable, { CustomColumn } from '../../components/common/CustomTable'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Button, Chip, Dropdown, DropdownItem, DropdownMenu, DropdownTrigger } from '@heroui/react'
import { EllipsisVerticalIcon, EyeIcon, ArrowUturnLeftIcon } from '@heroicons/react/24/outline'
import ConfirmModal from '../../components/common/ConfirmModal'
import { useAuth } from '../../store/auth'
import { useTranslation } from 'react-i18next'
import { usePreferences } from '../../store/prefs'
import Lightbox from 'yet-another-react-lightbox'
import 'yet-another-react-lightbox/styles.css'
import { toast } from 'react-toastify'

const nfUZS = new Intl.NumberFormat('en-US')

export default function ProductsArchivePage() {
  const { t } = useTranslation()
  const qc = useQueryClient()
  const navigate = useNavigate()
  const [sp, setSp] = useSearchParams()
  const page = Number(sp.get('page') || '1')
  const limit = Number(sp.get('limit') || '10')
  const search = sp.get('search') || ''
  const { auth } = useAuth()
  const can = (p: string) => auth.permissions.includes(p)
  const { prefs } = usePreferences()
  const [confirmUnarchive, setConfirmUnarchive] = useState<{ open: boolean; id?: string; name?: string }>({ open: false })

  const { data } = useQuery({
    queryKey: ['products-archived', page, limit, search, prefs.selectedStoreId],
    queryFn: () => productsService.list({ page, limit, search, store_id: prefs.selectedStoreId || undefined, archived: true }),
    placeholderData: (prev) => prev,
    enabled: can('products.catalog.access'),
  })

  const items = useMemo(() => (data?.items || []).map((p: Product) => ({
    id: p.id,
    images: p.images || [],
    name: p.name,
    sku: p.sku,
    barcode: p.barcode,
    category_name: p.category_name || '-',
    stock: p.stock,
    cost_price: p.cost_price,
    price: p.price,
    expiration_date: p.expiration_date || '-',
    status: p.status,
  })), [data])

  const columns: CustomColumn[] = useMemo(() => [
    { uid: 'photo', name: 'Photo' },
    { uid: 'name', name: t('products.columns.name') },
    { uid: 'sku', name: t('products.columns.sku') },
    { uid: 'barcode', name: t('repricing.detail.table.barcode','Barcode') },
    { uid: 'category_name', name: t('products.columns.category') },
    { uid: 'stock', name: t('products.columns.stock') },
    { uid: 'cost_price', name: 'Supply price' },
    { uid: 'price', name: 'Retail price' },
    { uid: 'expiration_date', name: 'Expire date' },
    { uid: 'actions', name: 'Actions' },
  ], [t])

  const [viewerOpen, setViewerOpen] = useState(false)
  const [viewerImages, setViewerImages] = useState<string[]>([])
  const [viewerIndex, setViewerIndex] = useState(0)

  const handleUnarchive = async (id: string) => {
    await productsService.bulkUnarchive([id])
    toast.success('Product unarchived')
    qc.invalidateQueries({ queryKey:['products-archived'] })
    qc.invalidateQueries({ queryKey:['products'] })
  }

  const renderCell = (item: any, key: string) => {
    switch (key) {
      case 'photo': {
        const first = (item.images || [])[0]
        return first ? (
          <img src={first} alt={item.name} className="w-12 h-12 rounded object-cover cursor-pointer" onClick={() => { setViewerImages(item.images || []); setViewerIndex(0); setViewerOpen(true) }} />
        ) : (
          <div className="w-12 h-12 border border-default-300 rounded grid place-items-center text-default-400">
            <span className="i-mdi-image-outline w-6 h-6" />
          </div>
        )
      }
      case 'cost_price': return `${nfUZS.format(Number(item.cost_price||0))} UZS`
      case 'price': return `${nfUZS.format(Number(item.price||0))} UZS`
      case 'stock': return (<Chip className="capitalize" color={item.stock > 0 ? 'success' : item.stock === 0 ? 'warning' : 'danger'} size="sm" variant="flat">{item.stock}</Chip>)
      case 'actions': {
        return (
          <Dropdown placement="bottom-end">
            <DropdownTrigger>
              <Button isIconOnly variant="light" size="sm" aria-label="actions">
                <EllipsisVerticalIcon className="w-5 h-5" />
              </Button>
            </DropdownTrigger>
            <DropdownMenu aria-label="Actions">
              <DropdownItem key="view" startContent={<EyeIcon className="w-4 h-4" />} onPress={() => navigate(`/products/catalog/${item.id}/view?mode=view`)}>{t('common.view')}</DropdownItem>
              <DropdownItem key="unarchive" startContent={<ArrowUturnLeftIcon className="w-4 h-4" />} onPress={()=> setConfirmUnarchive({ open:true, id:item.id, name:item.name })}>Unarchive</DropdownItem>
            </DropdownMenu>
          </Dropdown>
        )
      }
      default:
        return item[key]
    }
  }

  const updateParams = (patch: Record<string, string | number | null>) => {
    const next = new URLSearchParams(sp)
    Object.entries(patch).forEach(([k, v]) => {
      if (v === null || v === undefined || String(v) === '') next.delete(k)
      else next.set(k, String(v))
    })
    setSp(next)
  }

  return (
    <>
      <CustomMainBody>
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-xl font-semibold">Archived Products</h1>
          <div>
            <Button variant="flat" onPress={()=> navigate('/products/catalog')}>Back</Button>
          </div>
        </div>
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
        />
      </CustomMainBody>

      <ConfirmModal isOpen={confirmUnarchive.open} title={`Unarchive ${confirmUnarchive.name || 'product'}?`} description={`It will return to main products list.`} confirmText="Unarchive" onConfirm={()=> { if(confirmUnarchive.id) handleUnarchive(confirmUnarchive.id) }} onClose={()=> setConfirmUnarchive({ open:false })} />

      <Lightbox open={viewerOpen} close={() => setViewerOpen(false)} index={viewerIndex} slides={(viewerImages||[]).map(src => ({ src }))} />
    </>
  )
} 