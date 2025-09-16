import { useMemo, useState } from 'react'
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import CustomMainBody from '../../components/common/CustomMainBody'
import CustomTable, { CustomColumn } from '../../components/common/CustomTable'
import { repricingsService, type Repricing } from '../../services/repricingsService'
import { Button, Dropdown, DropdownItem, DropdownMenu, DropdownTrigger } from '@heroui/react'
import { EllipsisVerticalIcon, TrashIcon } from '@heroicons/react/24/outline'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import CreateRepricingModal from './components/CreateRepricingModal'
import { usePreferences } from '../../store/prefs'
import ConfirmModal from '../../components/common/ConfirmModal'
import { useDateFormatter } from '../../hooks/useDateFormatter'

export default function RepricingPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [sp, setSp] = useSearchParams()
  const page = Number(sp.get('page') || '1')
  const limit = Number(sp.get('limit') || '10')
  const search = sp.get('search') || ''
  const { prefs } = usePreferences()
  const { format } = useDateFormatter()

  const [openCreate, setOpenCreate] = useState(false)
  const [confirm, setConfirm] = useState<{ open: boolean; id?: string }>(()=>({ open:false }))
  const { data, isLoading } = useQuery({ queryKey: ['repricings', page, limit, search, prefs.selectedStoreId||'__ALL__'], queryFn: ()=> repricingsService.list({ page, limit, search, shop_id: prefs.selectedStoreId || undefined }), placeholderData: (p)=> p })

  const items = useMemo(()=> (data?.items||[]).map((d: Repricing)=> ({
    id: d.id,
    external_id: d.external_id,
    name: d.name,
    shop_name: d.shop_name,
    type: d.type,
    total_items_count: d.total_items_count,
    status: d.status,
    created_by: d.created_by?.name || '-',
    finished_by: d.finished_by?.name || '-',
    created_at: d.created_at,
    finished_at: d.finished_at || '-',
  })), [data])

  const columns: CustomColumn[] = useMemo(()=> ([
    { uid: 'external_id', name: t('repricing.list.id','ID') },
    { uid: 'name', name: t('repricing.list.name','Name'), className: 'min-w-[260px]' },
    { uid: 'shop_name', name: t('repricing.list.store','Store'), className: 'min-w-[160px]' },
    { uid: 'type', name: t('repricing.list.type','Type'), className: 'min-w-[160px]' },
    { uid: 'total_items_count', name: t('repricing.list.quantity','Quantity') },
    { uid: 'status', name: t('repricing.list.status','Status'), className: 'min-w-[160px]' },
    { uid: 'created_by', name: t('repricing.list.created_by','Created by') },
    { uid: 'finished_by', name: t('repricing.list.finished_by','Finished by') },
    { uid: 'created_at', name: t('repricing.list.created_at','Creation date'), className: 'min-w-[160px]' },
    { uid: 'finished_at', name: t('repricing.list.finished_at','Completion date'), className: 'min-w-[160px]' },
    { uid: 'actions', name: 'Actions' },
  ]), [t])

  const updateParams = (patch: Record<string, string | number | null>) => {
    const next = new URLSearchParams(sp)
    Object.entries(patch).forEach(([k, v]) => { if (v === null || String(v) === '') next.delete(k); else next.set(k, String(v)) })
    setSp(next)
  }

  const removeMutation = useMutation({ mutationFn: (id: string)=> repricingsService.remove(id), onSuccess: ()=> qc.invalidateQueries({ queryKey: ['repricings'] }) })

  const renderCell = (row: any, key: string) => {
    switch (key) {
      case 'name':
        return <button className="text-primary underline-offset-2 hover:underline" onClick={()=> navigate(`/products/repricing/${row.id}`)}>{row.name}</button>
      case 'type': {
        const label = row.type === 'delivery_price_change' ? 'Supply price' : row.type === 'price_change' ? 'Retail price' : row.type
        return <span>{label}</span>
      }
      case 'status': {
        const statusKey = row.status === 'APPROVED' ? 'completed' : row.status === 'REJECTED' ? 'rejected' : 'in_progress'
        const text = statusKey === 'in_progress' ? 'In progress' : (row.status === 'APPROVED' ? 'Finished' : 'Rejected')
        const cls = row.status==='APPROVED'?'bg-success-100 text-success-700': row.status==='REJECTED'?'bg-danger-100 text-danger-700':'bg-warning-100 text-warning-700'
        return <span className={`px-2 py-1 rounded text-xs ${cls}`}>{text}</span>
      }
      case 'created_at': return <span>{format(row.created_at, { withTime: true })}</span>
      case 'finished_at': return <span>{row.finished_at && row.finished_at !== '-' ? format(row.finished_at, { withTime: true }) : '-'}</span>
      case 'actions': {
        const canDelete = row.status === 'REJECTED' || row.status === 'NEW'
        if (!canDelete) return null
        return (
          <Dropdown placement="bottom-end">
            <DropdownTrigger>
              <Button isIconOnly variant="light" size="sm" aria-label="actions">
                <EllipsisVerticalIcon className="w-5 h-5" />
              </Button>
            </DropdownTrigger>
            <DropdownMenu aria-label="Actions">
              <DropdownItem key="delete" className="text-danger" color="danger" startContent={<TrashIcon className="w-4 h-4" />} onPress={()=> setConfirm({ open:true, id: row.id })}>{t('common.delete','Delete')}</DropdownItem>
            </DropdownMenu>
          </Dropdown>
        )
      }
      default:
        return row[key]
    }
  }

  return (
    <CustomMainBody>
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-xl font-semibold">{t('repricing.header','Repricing')}</h1>
      </div>
      <CustomTable
        columns={columns}
        items={items}
        total={data?.total||0}
        page={page}
        limit={limit}
        onPageChange={(p)=> updateParams({ page: p })}
        onLimitChange={(l)=> updateParams({ limit: l, page: 1 })}
        searchValue={search}
        onSearchChange={(v)=> updateParams({ search: v, page: 1 })}
        onSearchClear={()=> updateParams({ search: null, page: 1 })}
        renderCell={renderCell}
        onCreate={()=> setOpenCreate(true)}
        createLabel={t('repricing.create','New repricing')}
      />
      <CreateRepricingModal isOpen={openCreate} onOpenChange={setOpenCreate} onCreated={(id?:string)=>{ qc.invalidateQueries({ queryKey: ['repricings'] }); if (id) navigate(`/products/repricing/${id}`) }} />
      <ConfirmModal
        isOpen={confirm.open}
        title={t('common.delete','Delete')}
        description={'Are you sure you want to delete this repricing?'}
        confirmText={t('common.delete','Delete')}
        confirmColor="danger"
        onConfirm={async ()=>{ if(confirm.id){ await removeMutation.mutateAsync(confirm.id); setConfirm({ open:false }) } }}
        onClose={()=> setConfirm({ open:false })}
      />
    </CustomMainBody>
  )
} 