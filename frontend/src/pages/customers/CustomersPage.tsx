import { useMemo, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import CustomMainBody from '../../components/common/CustomMainBody'
import CustomTable, { CustomColumn } from '../../components/common/CustomTable'
import { Button, Dropdown, DropdownItem, DropdownMenu, DropdownTrigger } from '@heroui/react'
import { EllipsisVerticalIcon, EyeIcon, PencilSquareIcon, TrashIcon } from '@heroicons/react/24/outline'
import { useNavigate, useSearchParams } from 'react-router-dom'
import ConfirmModal from '../../components/common/ConfirmModal'
import { customersService, Customer } from '../../services/customersService'
import { useTranslation } from 'react-i18next'

export default function CustomersPage() {
  const { t } = useTranslation()
  const qc = useQueryClient()
  const navigate = useNavigate()
  const [sp, setSp] = useSearchParams()
  const page = Number(sp.get('page') || '1')
  const limit = Number(sp.get('limit') || '10')
  const search = sp.get('search') || ''
  const [confirm, setConfirm] = useState<{ open: boolean; id?: string; name?: string }>({ open: false })

  const { data, isLoading } = useQuery({
    queryKey: ['customers', page, limit, search],
    queryFn: () => customersService.list({ page, limit, search }),
    placeholderData: (prev) => prev,
  })

  const items = useMemo(() => (data?.items || []).map((c: Customer) => ({
    id: c.id,
    first_name: c.first_name,
    last_name: c.last_name || '-',
    phone_number: c.phone_number,
    primary_language: c.primary_language || 'RU',
    city: c.address?.city || '-',
    email: c.email || '-',
  })), [data])

  const columns: CustomColumn[] = useMemo(() => [
    { uid: 'first_name', name: t('customers.columns.first_name'), sortable: true },
    { uid: 'last_name', name: t('customers.columns.last_name'), sortable: true },
    { uid: 'phone_number', name: t('customers.columns.phone') },
    { uid: 'email', name: 'Email' },
    { uid: 'city', name: t('customers.columns.city') },
    { uid: 'primary_language', name: t('customers.columns.language') },
    { uid: 'actions', name: t('customers.columns.actions') },
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
    await customersService.remove(id)
    qc.invalidateQueries({ queryKey: ['customers'] })
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
              <DropdownItem key="view" startContent={<EyeIcon className="w-4 h-4" />} onPress={() => navigate(`/customers/${item.id}/view?mode=view`)}>{t('common.view')}</DropdownItem>
              <DropdownItem key="edit" startContent={<PencilSquareIcon className="w-4 h-4" />} onPress={() => navigate(`/customers/${item.id}/edit`)}>{t('common.edit')}</DropdownItem>
              <DropdownItem key="delete" className="text-danger" color="danger" startContent={<TrashIcon className="w-4 h-4" />} onPress={() => setConfirm({ open: true, id: item.id, name: `${item.first_name} ${item.last_name||''}`.trim() })}>{t('common.delete')}</DropdownItem>
            </DropdownMenu>
          </Dropdown>
        )
      default:
        return item[key]
    }
  }

  return (
    <>
      <CustomMainBody>
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-xl font-semibold">{t('customers.header')}</h1>
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
            onCreate={() => navigate('/customers/create')}
            createLabel={t('customers.create')}
          />
        )}
      </CustomMainBody>

      <ConfirmModal
        isOpen={confirm.open}
        title={t('customers.delete_confirm_title')}
        description={t('customers.delete_confirm_desc', { name: confirm.name })}
        confirmText={t('common.delete')}
        confirmColor="danger"
        onConfirm={() => { if (confirm.id) handleDelete(confirm.id) }}
        onClose={() => setConfirm({ open: false })}
      />
    </>
  )
} 