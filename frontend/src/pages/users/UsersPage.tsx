import { useQuery, useQueryClient } from '@tanstack/react-query'
import { usersService, User as AppUser } from '../../services/usersService'
import CustomTable, { CustomColumn } from '../../components/common/CustomTable'
import CustomMainBody from '../../components/common/CustomMainBody'
import { Button, Input, Pagination, Chip, User as HeroUser, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from '@heroui/react'
import { EllipsisVerticalIcon, EyeIcon, PencilSquareIcon, TrashIcon, Cog6ToothIcon } from '@heroicons/react/24/outline'
import { useMemo, useState } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import ConfirmModal from '../../components/common/ConfirmModal'
import { useAuth } from '../../store/auth'
import { useTranslation } from 'react-i18next'

export default function UsersPage() {
  const { t } = useTranslation()
  const qc = useQueryClient()
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const isEmployees = pathname.startsWith('/hr-management/')
  const [sp, setSp] = useSearchParams()
  const page = Number(sp.get('page') || '1')
  const limit = Number(sp.get('limit') || '10')
  const search = sp.get('search') || ''
  const [selectedKeys, setSelectedKeys] = useState<any>(new Set([]))
  const [visibleColumns, setVisibleColumns] = useState<any>(new Set(['name','email','role_name','status','actions']))
  const [confirm, setConfirm] = useState<{ open: boolean; id?: string; name?: string }>({ open: false })
  const { auth } = useAuth()
  const can = (p: string) => auth.permissions.includes(p)

  const { data, isLoading } = useQuery({
    queryKey: ['users', page, limit, search],
    queryFn: () => usersService.list({ page, limit, search }),
    placeholderData: (prev) => prev,
    enabled: isEmployees ? can('hr.users.access') : true,
  })

  const allColumns: CustomColumn[] = useMemo(() => [
    { name: t('users.columns.name'), uid: 'name', sortable: true },
    { name: t('users.columns.email'), uid: 'email' },
    { name: t('users.columns.role'), uid: 'role_name' },
    { name: t('users.columns.status'), uid: 'status', sortable: true, align: 'center' },
    { name: t('users.columns.actions'), uid: 'actions', align: 'center' },
  ], [t])

  const headerColumns = useMemo(() => {
    const cols = allColumns
    if (visibleColumns === 'all') return cols
    return cols.filter(c => Array.from(visibleColumns).includes(c.uid))
  }, [allColumns, visibleColumns])

  const items = (data?.items || []).map(u => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role_name: u.role_name,
    status: u.is_active ? t('users.status.active') : t('users.status.paused'),
    avatar: '',
  }))

  const handleDelete = async (id: string) => { await usersService.remove(id); qc.invalidateQueries({ queryKey: ['users'] }) }

  const renderCell = (user: any, columnKey: string) => {
    const cellValue = user[columnKey]
    switch (columnKey) {
      case 'name':
        return (
          <HeroUser
            avatarProps={{ radius: 'full', size: 'sm', src: user.avatar }}
            classNames={{ description: 'text-default-500' }}
            description={user.email}
            name={cellValue}
          />
        )
      case 'role_name':
        return <span className="capitalize">{cellValue}</span>
      case 'status':
        return (
          <Chip className="capitalize border-none gap-1 text-default-600" color={user.status === t('users.status.active') ? 'success' : 'danger'} size="sm" variant="dot">{cellValue}</Chip>
        )
      case 'actions':
        if (isEmployees && !can('hr.users.update') && !can('hr.users.delete')) return null
        return (
          <Dropdown placement="bottom-end">
            <DropdownTrigger>
              <Button isIconOnly variant="light" size="sm" aria-label={t('common.actions')}>
                <EllipsisVerticalIcon className="w-5 h-5" />
              </Button>
            </DropdownTrigger>
            <DropdownMenu aria-label={t('common.actions')}>
              <DropdownItem key="view" startContent={<EyeIcon className="w-4 h-4" />} onPress={() => navigate(`/hr-management/employees/${user.id}/view?mode=view`)}>{t('common.view')}</DropdownItem>
              {(!isEmployees || can('hr.users.update')) ? <DropdownItem key="edit" startContent={<PencilSquareIcon className="w-4 h-4" />} onPress={() => navigate(`/hr-management/employees/${user.id}/edit`)}>{t('common.edit')}</DropdownItem> : null}
              {(!isEmployees || can('hr.users.delete')) ? <DropdownItem key="delete" className="text-danger" color="danger" startContent={<TrashIcon className="w-4 h-4" />} onPress={() => setConfirm({ open: true, id: user.id, name: user.name })}>{t('common.delete')}</DropdownItem> : null}
            </DropdownMenu>
          </Dropdown>
        )
      default:
        return cellValue
    }
  }

  const updateParams = (patch: Record<string, string | number | null>) => {
    const next = new URLSearchParams(sp)
    Object.entries(patch).forEach(([k, v]) => { if (v === null || v === undefined || String(v) === '') next.delete(k); else next.set(k, String(v)) })
    setSp(next)
  }

  if (isEmployees && !can('hr.users.access')) {
    return (
      <CustomMainBody>
        <h1 className="text-xl font-semibold">{t('users.header_employees')}</h1>
        <div className="mt-6 text-default-500">{t('users.no_access')}</div>
      </CustomMainBody>
    )
  }

  return (
    <>
      <CustomMainBody>
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-xl font-semibold">{isEmployees ? t('users.header_employees') : t('users.header_users')}</h1>
        </div>
        {isLoading ? <div>Loading...</div> : (
          <CustomTable
            columns={headerColumns}
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
            onCreate={isEmployees && can('hr.users.create') ? () => navigate('/hr-management/employees/create') : undefined}
            createLabel={isEmployees ? t('users.create_employee') : t('users.create_user')}
          />
        )}
      </CustomMainBody>
      <ConfirmModal
        isOpen={confirm.open}
        title={t('users.confirm_delete_title')}
        description={t('users.confirm_delete_description', { name: confirm.name })}
        confirmText={t('common.delete')}
        confirmColor="danger"
        onConfirm={() => { if (confirm.id) handleDelete(confirm.id) }}
        onClose={() => setConfirm({ open: false })}
      />
    </>
  )
}
