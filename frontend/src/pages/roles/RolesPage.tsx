import { useQuery, useQueryClient } from '@tanstack/react-query'
import { rolesService, Role } from '../../services/rolesService'
import CustomTable, { CustomColumn } from '../../components/common/CustomTable'
import CustomMainBody from '../../components/common/CustomMainBody'
import { useMemo, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { Button, Dropdown, DropdownMenu, DropdownItem, DropdownTrigger, Chip } from '@heroui/react'
import { EllipsisVerticalIcon, EyeIcon, PencilSquareIcon, TrashIcon } from '@heroicons/react/24/outline'
import ConfirmModal from '../../components/common/ConfirmModal'
import { useAuth } from '../../store/auth'
import { useTranslation } from 'react-i18next'

export default function RolesPage() {
  const { t } = useTranslation()
  const qc = useQueryClient()
  const navigate = useNavigate()
  const [sp, setSp] = useSearchParams()
  const page = Number(sp.get('page') || '1')
  const limit = Number(sp.get('limit') || '10')
  const search = sp.get('search') || ''
  const [confirm, setConfirm] = useState<{ open: boolean; id?: string; name?: string }>({ open: false })
  const { auth } = useAuth()
  const can = (p: string) => auth.permissions.includes(p)

  const { data, isLoading } = useQuery({
    queryKey: ['roles', page, limit, search],
    queryFn: () => rolesService.list({ page, limit, search }),
    placeholderData: (prev) => prev,
    enabled: can('hr.roles.access'),
  })

  const items = useMemo(() => (data?.items || []).map(r => ({ id: r.id, name: r.name, key_: r.key, status: r.is_active ? t('users.status.active') : t('users.status.paused') })), [data, t])
  const columns: CustomColumn[] = useMemo(() => [
    { uid: 'name', name: t('roles.columns.name'), sortable: true },
    { uid: 'key_', name: t('roles.columns.key') },
    { uid: 'status', name: t('roles.columns.status'), sortable: true },
    { uid: 'actions', name: t('roles.columns.actions') },
  ], [t])

  const updateParams = (patch: Record<string, string | number | null>) => {
    const next = new URLSearchParams(sp)
    Object.entries(patch).forEach(([k, v]) => { if (v === null || v === undefined || String(v) === '') next.delete(k); else next.set(k, String(v)) })
    setSp(next)
  }

  const handleDelete = async (id: string) => { await rolesService.remove(id); qc.invalidateQueries({ queryKey: ['roles'] }) }

  const renderCell = (item: any, key: string) => {
    switch (key) {
      case 'status':
        return (<Chip className="capitalize border-none gap-1 text-default-600" color={item.status === t('users.status.active') ? 'success' : 'danger'} size="sm" variant="dot">{item.status}</Chip>)
      case 'actions':
        if (!can('hr.roles.update') && !can('hr.roles.delete')) return null
        return (
          <Dropdown placement="bottom-end">
            <DropdownTrigger>
              <Button isIconOnly variant="light" size="sm" aria-label={t('common.actions')}>
                <EllipsisVerticalIcon className="w-5 h-5" />
              </Button>
            </DropdownTrigger>
            <DropdownMenu aria-label={t('common.actions')}>
              <DropdownItem key="view" startContent={<EyeIcon className="w-4 h-4" />} onPress={() => navigate(`/hr-management/roles/${item.id}/view?mode=view`)}>{t('common.view')}</DropdownItem>
              {can('hr.roles.update') ? <DropdownItem key="edit" startContent={<PencilSquareIcon className="w-4 h-4" />} onPress={() => navigate(`/hr-management/roles/${item.id}/edit`)}>{t('common.edit')}</DropdownItem> : null}
              {can('hr.roles.delete') ? <DropdownItem key="delete" className="text-danger" color="danger" startContent={<TrashIcon className="w-4 h-4" />} onPress={() => setConfirm({ open: true, id: item.id, name: item.name })}>{t('common.delete')}</DropdownItem> : null}
            </DropdownMenu>
          </Dropdown>
        )
      default:
        return (item as any)[key]
    }
  }

  if (!can('hr.roles.access')) {
    return (
      <CustomMainBody>
        <h1 className="text-xl font-semibold">{t('roles.header')}</h1>
        <div className="mt-6 text-default-500">{t('users.no_access')}</div>
      </CustomMainBody>
    )
  }

  return (
    <CustomMainBody>
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-xl font-semibold">{t('roles.header')}</h1>
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
          onCreate={can('hr.roles.create') ? () => navigate('/hr-management/roles/create') : undefined}
          createLabel={t('roles.create')}
        />
      )}

      <ConfirmModal
        isOpen={confirm.open}
        title={t('roles.confirm_delete_title')}
        description={t('roles.confirm_delete_description', { name: confirm.name })}
        confirmText={t('common.delete')}
        confirmColor="danger"
        onConfirm={() => { if (confirm.id) handleDelete(confirm.id) }}
        onClose={() => setConfirm({ open: false })}
      />
    </CustomMainBody>
  )
}
