import { useQuery } from '@tanstack/react-query'
import { storesService, Store } from '../../services/storesService'
import CustomMainBody from '../../components/common/CustomMainBody'
import CustomTable, { CustomColumn } from '../../components/common/CustomTable'
import { useMemo, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { Button, Dropdown, DropdownItem, DropdownMenu, DropdownTrigger } from '@heroui/react'
import { EllipsisVerticalIcon, EyeIcon, PencilSquareIcon, TrashIcon } from '@heroicons/react/24/outline'
import ConfirmModal from '../../components/common/ConfirmModal'
import { useTranslation } from 'react-i18next'

export default function StoresPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [sp, setSp] = useSearchParams()
  const page = Number(sp.get('page') || '1')
  const limit = Number(sp.get('limit') || '10')
  const search = sp.get('search') || ''
  const company_id = sp.get('company_id') || undefined
  const [confirm, setConfirm] = useState<{ open: boolean; id?: string; name?: string }>({ open: false })

  const { data, isLoading } = useQuery({ queryKey: ['stores', page, limit, search, company_id], queryFn: () => storesService.list({ page, limit, search, company_id }), placeholderData: (p)=>p })

  const items = useMemo(() => (data?.items || []).map((s: Store) => ({ id: s.id, title: s.title, square: s.square, tin: s.tin })), [data])
  const columns: CustomColumn[] = useMemo(() => [
    { uid: 'title', name: t('stores.columns.title'), sortable: true },
    { uid: 'square', name: t('stores.columns.square') },
    { uid: 'tin', name: t('stores.columns.tin') },
    { uid: 'actions', name: t('stores.columns.actions') },
  ], [t])

  const updateParams = (patch: Record<string, string | number | null>) => {
    const next = new URLSearchParams(sp)
    Object.entries(patch).forEach(([k, v]) => { if (v === null || v === undefined || String(v) === '') next.delete(k); else next.set(k, String(v)) })
    setSp(next)
  }

  const renderCell = (item: any, key: string) => {
    switch (key) {
      case 'actions':
        return (
          <Dropdown placement="bottom-end">
            <DropdownTrigger>
              <Button isIconOnly variant="light" size="sm" aria-label={t('common.actions')}>
                <EllipsisVerticalIcon className="w-5 h-5" />
              </Button>
            </DropdownTrigger>
            <DropdownMenu aria-label={t('common.actions')}>
              <DropdownItem key="view" startContent={<EyeIcon className="w-4 h-4" />} onPress={() => navigate(`/settings/stores/view?view=${item.id}`)}>{t('common.view')}</DropdownItem>
              <DropdownItem key="edit" startContent={<PencilSquareIcon className="w-4 h-4" />} onPress={() => navigate(`/settings/stores/edit?edit=${item.id}`)}>{t('common.edit')}</DropdownItem>
              <DropdownItem key="delete" className="text-danger" color="danger" startContent={<TrashIcon className="w-4 h-4" />} onPress={() => setConfirm({ open: true, id: item.id, name: item.title })}>{t('common.delete')}</DropdownItem>
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
        <h1 className="text-xl font-semibold">{t('stores.header')}</h1>
      </div>
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
          onCreate={() => navigate('/settings/stores/create')}
          createLabel={t('stores.create')}
        />
      )}
      <ConfirmModal
        isOpen={confirm.open}
        title={t('stores.confirm_delete_title')}
        description={t('stores.confirm_delete_description', { name: confirm.name })}
        confirmText={t('common.delete')}
        confirmColor="danger"
        onConfirm={() => {/* TODO: call delete when implemented */}}
        onClose={() => setConfirm({ open: false })}
      />
    </CustomMainBody>
  )
} 