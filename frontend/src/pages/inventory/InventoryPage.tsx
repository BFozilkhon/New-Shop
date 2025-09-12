import { useMemo, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import CustomMainBody from '../../components/common/CustomMainBody'
import CustomTable, { CustomColumn } from '../../components/common/CustomTable'
import { inventoriesService, type Inventory } from '../../services/inventoriesService'
import { Button, Input, Modal, ModalBody, ModalContent, ModalHeader, ModalFooter, Select, SelectItem, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from '@heroui/react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { storesService } from '../../services/storesService'
import { EllipsisVerticalIcon, EyeIcon, PencilSquareIcon, TrashIcon } from '@heroicons/react/24/outline'
import ConfirmModal from '../../components/common/ConfirmModal'
import { useTranslation } from 'react-i18next'
import { usePreferences } from '../../store/prefs'

function CreateInventoryModal({ isOpen, onOpenChange }: { isOpen: boolean; onOpenChange: (v:boolean)=>void }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [name, setName] = useState<string>(()=> `${t('inventory.header')} ${new Date().toISOString().slice(0,16).replace('T',' ')}`)
  const [shopId, setShopId] = useState('')
  const [type, setType] = useState<'FULL'|'PARTIAL'>('FULL')
  const stores = useQuery({ queryKey:['stores','all'], queryFn: ()=> storesService.list({ page:1, limit:200 }) })
  const storeItems = useMemo(()=> (stores.data?.items||[]).map((s:any)=> ({ key:s.id, label:s.title })), [stores.data])
  const create = async () => {
    const created = await inventoriesService.create({ name, shop_id: shopId, type })
    onOpenChange(false)
    if (created?.id) navigate(`/products/inventory/${created.id}`)
  }
  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="3xl">
      <ModalContent>
        {(close)=> (
          <>
            <ModalHeader>{t('inventory.modal.title')}</ModalHeader>
            <ModalBody>
              <div className="grid grid-cols-2 gap-6">
                <Input label={t('inventory.modal.title_field')} value={name} onValueChange={setName} variant="bordered" classNames={{ inputWrapper:'h-14' }} />
                <Select label={t('inventory.modal.store')} selectedKeys={shopId?[shopId]:[]} onSelectionChange={(k)=> setShopId(Array.from(k)[0] as string)} variant="bordered" classNames={{ trigger:'h-14' }}>
                  {storeItems.map(it=> (<SelectItem key={it.key}>{it.label}</SelectItem>))}
                </Select>
                <div className="col-span-2">
                  <div className="grid grid-cols-2 gap-0 rounded-xl overflow-hidden border border-default-200">
                    <Button radius="none" className={`h-12 ${type==='FULL'?'bg-primary text-primary-foreground':'bg-default-100'}`} onPress={()=> setType('FULL')}>{t('inventory.modal.full')}</Button>
                    <Button radius="none" className={`h-12 ${type==='PARTIAL'?'bg-primary text-primary-foreground':'bg-default-100'}`} onPress={()=> setType('PARTIAL')}>{t('inventory.modal.partial')}</Button>
                  </div>
                </div>
              </div>
            </ModalBody>
            <ModalFooter>
              <Button variant="flat" onPress={()=> close()}>{t('inventory.modal.cancel')}</Button>
              <Button color="primary" onPress={create} isDisabled={!name || !shopId}>{t('inventory.modal.create')}</Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  )
}

export default function InventoryPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [sp, setSp] = useSearchParams()
  const page = Number(sp.get('page') || '1')
  const limit = Number(sp.get('limit') || '10')
  const search = sp.get('search') || ''
  const [open, setOpen] = useState(false)
  const [confirm, setConfirm] = useState<{ open: boolean; id?: string; name?: string }>({ open: false })
  const { prefs } = usePreferences()

  const { data, isLoading } = useQuery({
    queryKey: ['inventories', page, limit, search, prefs.selectedStoreId||'__ALL__'],
    queryFn: () => inventoriesService.list({ page, limit, search, shop_id: prefs.selectedStoreId || undefined }),
    placeholderData: (prev)=> prev,
  })

  const items = useMemo(()=> (data?.items || []).map((i: Inventory)=> ({
    id: i.id,
    external_id: i.external_id || '-',
    name: i.name,
    shop_name: i.shop_name || '-',
    total_measurement_value: i.total_measurement_value || 0,
    shortage: i.shortage || 0,
    surplus: i.surplus || 0,
    postponed: i.postponed || 0,
    difference_sum: i.difference_sum || 0,
    type: i.type,
    status: i.status_id ? t('inventory.status_completed') : '-',
    created_at: i.created_at,
    finished_at: i.finished_at || '-',
    created_by: i.created_by?.name || '-',
    finished_by: i.finished_by?.name || '-',
  })), [data, t])

  const columns: CustomColumn[] = useMemo(()=> ([
    { uid: 'external_id', name: t('inventory.columns.id') },
    { uid: 'name', name: t('inventory.columns.name'), className: 'w-[30%] min-w-[280px]' },
    { uid: 'shop_name', name: t('inventory.columns.store') },
    { uid: 'total_measurement_value', name: t('inventory.columns.qty') },
    { uid: 'difference', name: t('inventory.columns.difference') },
    { uid: 'difference_sum', name: t('inventory.columns.diff_amount') },
    { uid: 'type', name: t('inventory.columns.type') },
    { uid: 'status', name: t('inventory.columns.status') },
    { uid: 'created_at', name: t('inventory.columns.creation') },
    { uid: 'finished_at', name: t('inventory.columns.completion') },
    { uid: 'created_by', name: t('inventory.columns.created_by') },
    { uid: 'finished_by', name: t('inventory.columns.finished_by') },
  ]), [t])

  const updateParams = (p: any) => {
    const next = new URLSearchParams(sp)
    Object.entries(p).forEach(([k, v]) => {
      if (v === null || v === undefined || v === '') next.delete(k)
      else next.set(k, String(v))
    })
    setSp(next)
  }

  const handleDelete = async (id: string) => {
    try {
      await inventoriesService.remove(id)
      setConfirm({ open: false })
      await qc.invalidateQueries({ queryKey: ['inventories'] })
    } catch {}
  }

  const renderCell = (row: any, key: string) => {
    switch (key) {
      case 'name':
        return <button className="text-primary underline-offset-2 hover:underline" onClick={()=> navigate(`/products/inventory/${row.id}`)}>{row.name}</button>
      case 'status':
        return <span className="px-3 py-1 rounded-full bg-success-100 text-success-700 text-xs">{t('inventory.status_completed')}</span>
      case 'difference':
        return (
          <div className="flex items-center gap-2">
            <BadgeDot color="success" count={row.surplus} label="+" />
            <BadgeDot color="danger" count={row.shortage} label="-" />
            <BadgeDot color="primary" count={row.postponed} label="⧖" />
          </div>
        )
      case 'difference_sum': {
        const val = Number(row.difference_sum || 0)
        const cls = val > 0 ? 'text-success-600' : val < 0 ? 'text-danger-600' : 'text-foreground/60'
        return <span className={cls}>{Intl.NumberFormat('ru-RU').format(val)} UZS</span>
      }
      // no actions column
      default:
        return row[key]
    }
  }

  return (
    <CustomMainBody>
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-xl font-semibold">{t('inventory.header')}</h1>
      </div>
      <CustomTable
        columns={columns}
        items={items}
        total={data?.total ?? 0}
        page={page}
        limit={limit}
        onPageChange={(p)=> updateParams({ page: p })}
        onLimitChange={(l)=> updateParams({ limit: l, page: 1 })}
        searchValue={search}
        onSearchChange={(v)=> updateParams({ search: v, page: 1 })}
        onSearchClear={()=> updateParams({ search: null, page: 1 })}
        renderCell={renderCell}
        onCreate={()=> setOpen(true)}
        createLabel={t('inventory.create')}
      />
      <CreateInventoryModal isOpen={open} onOpenChange={setOpen} />
      <ConfirmModal
        isOpen={confirm.open}
        title={t('inventory.confirm_delete_title')}
        description={t('inventory.confirm_delete_desc', { name: confirm.name })}
        confirmText={t('common.delete')}
        confirmColor="danger"
        onConfirm={() => { if (confirm.id) handleDelete(confirm.id) }}
        onClose={() => setConfirm({ open: false })}
      />
    </CustomMainBody>
  )
}

function BadgeDot({ color, count, label }: { color:'success'|'danger'|'primary'; count:number; label:string }) {
  const cls = color==='success' ? 'bg-success-100 text-success-700' : color==='danger' ? 'bg-danger-100 text-danger-700' : 'bg-primary-100 text-primary-700'
  return (
    <div className={`px-2 h-7 rounded-full text-xs flex items-center gap-1 ${cls}`}>
      <span>{label}</span>
      <span className="font-semibold">{count ?? 0}</span>
    </div>
  )
} 