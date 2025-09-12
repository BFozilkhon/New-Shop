import { useMemo, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { suppliersService, Supplier } from '../../services/suppliersService'
import CustomMainBody from '../../components/common/CustomMainBody'
import CustomTable, { CustomColumn } from '../../components/common/CustomTable'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Button, Chip, Dropdown, DropdownItem, DropdownMenu, DropdownTrigger } from '@heroui/react'
import { EllipsisVerticalIcon, EyeIcon, PencilSquareIcon, TrashIcon } from '@heroicons/react/24/outline'
import ConfirmModal from '../../components/common/ConfirmModal'
import { useTranslation } from 'react-i18next'
import { usePreferences } from '../../store/prefs'

export default function SuppliersPage() {
  const { t } = useTranslation()
  const qc = useQueryClient()
  const navigate = useNavigate()
  const [sp, setSp] = useSearchParams()
  const page = Number(sp.get('page') || '1')
  const limit = Number(sp.get('limit') || '10')
  const search = sp.get('search') || ''
  const [confirm, setConfirm] = useState<{ open: boolean; id?: string; name?: string }>({ open: false })
  const { prefs } = usePreferences()

  const { data, isLoading } = useQuery({
    queryKey: ['suppliers', page, limit, search, prefs.selectedStoreId||'__ALL__'],
    queryFn: () => suppliersService.list({ page, limit, search }),
    placeholderData: (prev) => prev,
  })

  const items = useMemo(() => (data?.items || []).map((s: Supplier) => ({ id: s.id, name: s.name, email: s.email, phone: s.phone, city: s.legal_address?.city || '' })), [data])

  const columns: CustomColumn[] = useMemo(() => [
    { uid: 'name', name: t('companies.form.title_label'), sortable: true },
    { uid: 'email', name: 'Email' },
    { uid: 'phone', name: t('users.form.phone_label') },
    { uid: 'city', name: t('stores.columns.title') === 'Title' ? 'City' : t('stores.columns.tin') === 'TIN' ? 'Город' : 'Shahar' },
    { uid: 'actions', name: t('common.actions') },
  ], [t])

  const updateParams = (patch: Record<string, string | number | null>) => {
    const next = new URLSearchParams(sp)
    Object.entries(patch).forEach(([k, v]) => { if (v === null || v === undefined || String(v) === '') next.delete(k); else next.set(k, String(v)) })
    setSp(next)
  }

  const handleDelete = async (id: string) => {
    await suppliersService.remove(id)
    qc.invalidateQueries({ queryKey: ['suppliers'] })
  }

  const renderCell = (item: any, key: string) => {
    switch (key) {
      case 'name':
        return <button className="text-primary underline-offset-2 hover:underline" onClick={()=> navigate(`/products/suppliers/${item.id}`)}>{item.name}</button>
      case 'actions':
        return (
          <Dropdown placement="bottom-end">
            <DropdownTrigger>
              <Button isIconOnly variant="light" size="sm" aria-label="actions">
                <EllipsisVerticalIcon className="w-5 h-5" />
              </Button>
            </DropdownTrigger>
            <DropdownMenu aria-label="Actions">
              <DropdownItem key="view" startContent={<EyeIcon className="w-4 h-4" />} onPress={() => navigate(`/products/suppliers/${item.id}/view?mode=view`)}>{t('common.view')}</DropdownItem>
              <DropdownItem key="edit" startContent={<PencilSquareIcon className="w-4 h-4" />} onPress={() => navigate(`/products/suppliers/${item.id}/edit`)}>{t('common.edit')}</DropdownItem>
              <DropdownItem key="delete" className="text-danger" color="danger" startContent={<TrashIcon className="w-4 h-4" />} onPress={() => setConfirm({ open: true, id: item.id, name: item.name })}>{t('common.delete')}</DropdownItem>
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
        <h1 className="text-xl font-semibold">{t('suppliers.header')}</h1>
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
          onCreate={() => (window.location.href = '/products/suppliers/create')}
          createLabel={t('suppliers.create')}
        />
      )}

      <ConfirmModal
        isOpen={confirm.open}
        title={t('suppliers.delete_confirm_title')}
        description={t('suppliers.delete_confirm_desc', { name: confirm.name })}
        confirmText={t('common.delete')}
        confirmColor="danger"
        onConfirm={() => { if (confirm.id) handleDelete(confirm.id) }}
        onClose={() => setConfirm({ open: false })}
      />
    </CustomMainBody>
  )
} 