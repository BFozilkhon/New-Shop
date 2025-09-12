import { useMemo, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import CustomMainBody from '../../components/common/CustomMainBody'
import CustomTable, { CustomColumn } from '../../components/common/CustomTable'
import { writeoffsService, type WriteOff } from '../../services/writeoffsService'
import { Button, Input, Modal, ModalBody, ModalContent, ModalHeader, ModalFooter, Select, SelectItem, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from '@heroui/react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { storesService } from '../../services/storesService'
import { EllipsisVerticalIcon, EyeIcon, PencilSquareIcon, TrashIcon } from '@heroicons/react/24/outline'
import ConfirmModal from '../../components/common/ConfirmModal'
import { useTranslation } from 'react-i18next'
import { usePreferences } from '../../store/prefs'

function CreateWriteOffModal({ isOpen, onOpenChange }: { isOpen: boolean; onOpenChange: (v:boolean)=>void }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [name, setName] = useState<string>(()=> `${t('writeoff.create_prefix')} ${new Date().toISOString().slice(0,16).replace('T',' ')}`)
  const [fromFile, setFromFile] = useState(false)
  const [shopId, setShopId] = useState('')
  const [reason, setReason] = useState('Defect')
  const stores = useQuery({ queryKey:['stores','all'], queryFn: ()=> storesService.list({ page:1, limit:200 }) })
  const storeItems = useMemo(()=> (stores.data?.items||[]).map((s:any)=> ({ key:s.id, label:s.title })), [stores.data])
  const reasons = ['Other','Defect','Loss','Write-off from catalog','Correction of assortment']
  const create = async () => {
    const created = await writeoffsService.create({ name, from_file: fromFile, shop_id: shopId, reason })
    onOpenChange(false)
    if (created?.id) navigate(`/products/writeoff/${created.id}`)
  }
  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="3xl">
      <ModalContent>
        {(close)=> (
          <>
            <ModalHeader>{t('writeoff.create_modal.title')}</ModalHeader>
            <ModalBody>
              <div className="grid grid-cols-2 gap-6">
                <Input isRequired label={t('writeoff.create_modal.name')} value={name} onValueChange={setName} variant="bordered" classNames={{ inputWrapper:'h-14' }} />
                <Select isRequired label={t('writeoff.create_modal.store')} selectedKeys={shopId?[shopId]:[]} onSelectionChange={(k)=> setShopId(Array.from(k)[0] as string)} variant="bordered" classNames={{ trigger:'h-14' }}>
                  {storeItems.map(it=> (<SelectItem key={it.key}>{it.label}</SelectItem>))}
                </Select>
                <div className="col-span-1">
                  <p className="text-sm text-default-500 mb-2">{t('writeoff.create_modal.from_file')}</p>
                  <div className="grid grid-cols-2 gap-0 rounded-xl overflow-hidden border border-default-200">
                    <Button radius="none" className={`h-12 ${fromFile?'bg-primary text-primary-foreground':'bg-default-100'}`} onPress={()=> setFromFile(true)}>{t('common.yes')||'Yes'}</Button>
                    <Button radius="none" className={`h-12 ${!fromFile?'bg-primary text-primary-foreground':'bg-default-100'}`} onPress={()=> setFromFile(false)}>{t('common.no')||'No'}</Button>
                  </div>
                </div>
                <Select isRequired label={t('writeoff.create_modal.reason')} selectedKeys={[reason]} onSelectionChange={(k)=> setReason(Array.from(k)[0] as string)} variant="bordered" classNames={{ trigger:'h-14' }}>
                  {reasons.map(r=> (<SelectItem key={r}>{r}</SelectItem>))}
                </Select>
              </div>
            </ModalBody>
            <ModalFooter>
              <Button variant="flat" onPress={()=> close()}>{t('common.cancel')}</Button>
              <Button color="primary" onPress={create} isDisabled={!name || !shopId}>{t('common.create')}</Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  )
}

export default function WriteOffPage() {
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

  const { data } = useQuery({ queryKey: ['writeoffs', page, limit, search, prefs.selectedStoreId||'__ALL__'], queryFn: () => writeoffsService.list({ page, limit, search, shop_id: prefs.selectedStoreId || undefined }), placeholderData: (p)=> p })

  const items = useMemo(()=> (data?.items || []).map((i: WriteOff)=> ({
    id: i.id,
    external_id: i.external_id,
    name: i.name,
    shop_name: i.shop_name,
    qty: (i.items||[]).reduce((s,it)=> s + (it.qty||0), 0),
    supply_total: i.total_supply_price || 0,
    retail_total: i.total_retail_price || 0,
    writeoff_type: i.reason_name || '-',
    created_user: i.created_by?.name || '-',
    status: i.status,
    created_at: i.created_at,
    finished_at: i.finished_at || '-',
  })), [data])

  const columns: CustomColumn[] = useMemo(()=> ([
    { uid: 'external_id', name: t('writeoff.list.id') },
    { uid: 'name', name: t('writeoff.list.name'), className: 'w-[32%] min-w-[320px]' },
    { uid: 'shop_name', name: t('writeoff.list.store') },
    { uid: 'qty', name: t('writeoff.list.quantity') },
    { uid: 'total', name: t('writeoff.list.total'), className: 'min-w-[220px]' },
    { uid: 'writeoff_type', name: t('writeoff.list.type') },
    { uid: 'created_user', name: t('writeoff.list.user') },
    { uid: 'status', name: t('writeoff.list.status') },
    { uid: 'created_at', name: t('writeoff.list.creation') },
    { uid: 'finished_at', name: t('writeoff.list.completion') },
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
      await writeoffsService.remove(id)
      setConfirm({ open: false })
      await qc.invalidateQueries({ queryKey: ['writeoffs'] })
    } catch {}
  }

  const renderCell = (row: any, key: string) => {
    switch (key) {
      case 'name':
        return <button className="text-primary underline-offset-2 hover:underline" onClick={()=> navigate(`/products/writeoff/${row.id}`)}>{row.name}</button>
      case 'total':
        return (
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-1 text-success-600"><span>↑</span><span>{Intl.NumberFormat('ru-RU').format(row.retail_total)} UZS</span></div>
            <div className="flex items-center gap-1 text-warning-600"><span>↓</span><span>{Intl.NumberFormat('ru-RU').format(row.supply_total)} UZS</span></div>
          </div>
        )
      case 'status':
        return row.status === 'APPROVED' ? <span className="px-3 py-1 rounded-full bg-success-100 text-success-700 text-xs">{t('writeoff.status.approved')}</span> : row.status==='REJECTED'? <span className="px-3 py-1 rounded-full bg-danger-100 text-danger-700 text-xs">{t('writeoff.status.rejected')}</span> : <span className="px-3 py-1 rounded-full bg-primary-100 text-primary-700 text-xs">{t('writeoff.status.new')}</span>
      // no actions column
      default:
        return row[key]
    }
  }

  return (
    <CustomMainBody>
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-xl font-semibold">{t('writeoff.header')}</h1>
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
        createLabel={t('writeoff.create_btn')}
      />
      <CreateWriteOffModal isOpen={open} onOpenChange={setOpen} />
      <ConfirmModal
        isOpen={confirm.open}
        title={t('writeoff.confirm_delete_title')}
        description={t('writeoff.confirm_delete_desc', { name: confirm.name })}
        confirmText={t('common.delete')}
        confirmColor="danger"
        onConfirm={() => { if (confirm.id) handleDelete(confirm.id) }}
        onClose={() => setConfirm({ open: false })}
      />
    </CustomMainBody>
  )
} 