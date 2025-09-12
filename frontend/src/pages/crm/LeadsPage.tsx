import { useEffect, useState, useMemo } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { leadsService, Lead } from '../../services/leadsService'
import CustomMainBody from '../../components/common/CustomMainBody'
import CustomTable, { CustomColumn } from '../../components/common/CustomTable'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Button, Dropdown, DropdownItem, DropdownMenu, DropdownTrigger } from '@heroui/react'
import { EllipsisVerticalIcon, EyeIcon, PencilSquareIcon, TrashIcon } from '@heroicons/react/24/outline'
import KanbanBoard from './components/KanbanBoard'
import { toast } from 'react-toastify'
import { useTranslation } from 'react-i18next'

export default function LeadsPage() {
  const { t } = useTranslation()
  const qc = useQueryClient()
  const navigate = useNavigate()
  const [sp, setSp] = useSearchParams()
  const page = Number(sp.get('page') || '1')
  const limit = Number(sp.get('limit') || '10')
  const search = sp.get('search') || ''
  const [view, setView] = useState<'kanban' | 'list'>('kanban')

  const stagesQ = useQuery({ queryKey: ['pipeline','stages'], queryFn: () => leadsService.getStages() })
  const { data, isLoading } = useQuery({ queryKey: ['leads', page, limit, search], queryFn: () => leadsService.list({ page, limit, search }) , placeholderData: (prev) => prev })

  const firstStageKey = stagesQ.data?.[0]?.key
  const items = useMemo(() => (data?.items || []).map((l: Lead) => ({
    id: l.id,
    title: l.title,
    company: l.company,
    amount: l.amount,
    description: l.description,
    expected_close_date: (l as any).expected_close_date,
    status: l.status || firstStageKey || 'new',
    stage: l.stage,
    owner_name: (l as any).owner_name || '-',
  })), [data, firstStageKey])

  const columns: CustomColumn[] = useMemo(() => [
    { uid: 'title', name: t('leads.columns.title'), sortable: true },
    { uid: 'company', name: t('leads.columns.company') },
    { uid: 'amount', name: t('leads.columns.amount') },
    { uid: 'status', name: t('leads.columns.status') },
    { uid: 'owner_name', name: t('leads.columns.owner') },
    { uid: 'actions', name: t('leads.columns.actions') },
  ], [t])

  const updateParams = (patch: Record<string, string | number | null>) => {
    const next = new URLSearchParams(sp)
    Object.entries(patch).forEach(([k, v]) => {
      if (v === null || v === undefined || String(v) === '') next.delete(k)
      else next.set(k, String(v))
    })
    setSp(next)
  }

  const handleDelete = async (id: string) => {
    try {
      toast.info(t('leads.toasts.delete_placeholder'))
      qc.invalidateQueries({ queryKey: ['leads'] })
    } catch (e) {
      toast.error(t('leads.toasts.failed'))
    }
  }

  const renderCell = (item: any, key: string) => {
    switch (key) {
      case 'actions':
        return (
          <Dropdown placement="bottom-end">
            <DropdownTrigger>
              <Button isIconOnly variant="light" size="sm" aria-label="actions">
                <EllipsisVerticalIcon className="w-5 h-5" />
              </Button>
            </DropdownTrigger>
            <DropdownMenu aria-label="Actions">
              <DropdownItem key="view" startContent={<EyeIcon className="w-4 h-4" />} onPress={() => navigate(`/crm/leads/${item.id}/view`)}>{t('common.view')}</DropdownItem>
              <DropdownItem key="edit" startContent={<PencilSquareIcon className="w-4 h-4" />} onPress={() => navigate(`/crm/leads/${item.id}/edit`)}>{t('common.edit')}</DropdownItem>
              <DropdownItem key="delete" className="text-danger" color="danger" startContent={<TrashIcon className="w-4 h-4" />} onPress={() => handleDelete(item.id)}>{t('common.delete')}</DropdownItem>
            </DropdownMenu>
          </Dropdown>
        )
      default:
        return (item as any)[key]
    }
  }

  return (
    <CustomMainBody>
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-xl font-semibold">{t('leads.header')}</h1>
        <div className="flex items-center gap-3">
          <Button variant="flat" onPress={() => setView(v => v === 'kanban' ? 'list' : 'kanban')}>{view === 'kanban' ? t('leads.switch_to_list') : t('leads.switch_to_kanban')}</Button>
        </div>
      </div>

      {view === 'kanban' ? (
        <KanbanBoard stages={stagesQ.data || []} leads={items || []} />
      ) : (
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
          onCreate={() => navigate('/crm/leads/create')}
          createLabel={t('leads.create')}
        />
      )}
    </CustomMainBody>
  )
} 