import { useMemo, useState } from 'react'
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import { categoriesService, Category } from '../../../services/categoriesService'
import CustomTable, { CustomColumn } from '../../../components/common/CustomTable'
import { useSearchParams } from 'react-router-dom'
import { Button, Chip, Dropdown, DropdownItem, DropdownMenu, DropdownTrigger } from '@heroui/react'
import { EllipsisVerticalIcon, EyeIcon, PencilSquareIcon, TrashIcon } from '@heroicons/react/24/outline'
import ConfirmModal from '../../../components/common/ConfirmModal'
import CategoryModal from './CategoryModal'
import { toast } from 'react-toastify'
import { useAuth } from '../../../store/auth'
import { useTranslation } from 'react-i18next'

export default function CategoriesTab() {
  const { t } = useTranslation()
  const qc = useQueryClient()
  const [sp, setSp] = useSearchParams()
  const page = Number(sp.get('page') || '1')
  const limit = Number(sp.get('limit') || '10')
  const search = sp.get('search') || ''
  const { auth } = useAuth()
  const can = (p: string) => auth.permissions.includes(p)
  
  const [confirm, setConfirm] = useState<{ open: boolean; id?: string; name?: string }>({ open: false })
  const [categoryModal, setCategoryModal] = useState<{ open: boolean; mode: 'create' | 'edit' | 'view'; category?: Category }>({ open: false, mode: 'create' })

  const { data, isLoading } = useQuery({
    queryKey: ['categories', page, limit, search],
    queryFn: () => categoriesService.list({ page, limit, search }),
    placeholderData: (prev) => prev,
  })

  const deleteMutation = useMutation({
    mutationFn: categoriesService.remove,
    onSuccess: () => {
      toast.success(t('catalog.toast.deleted', { entity: 'Category' }))
      qc.invalidateQueries({ queryKey: ['categories'] })
      setConfirm({ open: false })
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || t('catalog.toast.delete_failed', { entity: 'Category' }))
    }
  })

  const items = useMemo(() => (data?.items || []).map((c: Category) => ({
    id: c.id,
    name: c.name,
    status: c.is_active ? t('catalog.common.active') : t('catalog.common.inactive'),
    created_at: new Date(c.created_at).toLocaleDateString(),
  })), [data, t])

  const columns: CustomColumn[] = useMemo(() => [
    { uid: 'name', name: t('catalog.table.name'), sortable: true },
    { uid: 'status', name: t('catalog.table.status') },
    { uid: 'created_at', name: t('catalog.table.created') },
    { uid: 'actions', name: t('catalog.table.actions') },
  ], [t])

  const updateParams = (patch: Record<string, string | number | null>) => {
    const next = new URLSearchParams(sp)
    Object.entries(patch).forEach(([k, v]) => { if (v === null || v === undefined || String(v) === '') next.delete(k); else next.set(k, String(v)) })
    setSp(next)
  }

  const handleDelete = (id: string) => { deleteMutation.mutate(id) }

  const renderCell = (item: any, key: string) => {
    switch (key) {
      // no level column
      case 'status':
        return (
          <Chip className="capitalize border-none gap-1 text-default-600" color={item.status === t('catalog.common.active') ? 'success' : 'danger'} size="sm" variant="dot">{item.status}</Chip>
        )
      case 'actions': {
        const actions = [] as any[]
        actions.push(
          <DropdownItem key="view" startContent={<EyeIcon className="w-4 h-4" />} onPress={() => { const category = data?.items.find((c: any) => c.id === item.id); if (category) setCategoryModal({ open: true, mode: 'view', category }) }}>{t('common.view')}</DropdownItem>
        )
        if (can('products.categories.update')) {
          actions.push(
            <DropdownItem key="edit" startContent={<PencilSquareIcon className="w-4 h-4" />} onPress={() => { const category = data?.items.find((c: any) => c.id === item.id); if (category) setCategoryModal({ open: true, mode: 'edit', category }) }}>{t('common.edit')}</DropdownItem>
          )
        }
        if (can('products.categories.delete')) {
          actions.push(
            <DropdownItem key="delete" className="text-danger" color="danger" startContent={<TrashIcon className="w-4 h-4" />} onPress={() => setConfirm({ open: true, id: item.id, name: item.name })}>{t('common.delete')}</DropdownItem>
          )
        }
        return (
          <Dropdown placement="bottom-end">
            <DropdownTrigger>
              <Button isIconOnly variant="light" size="sm" aria-label="actions">
                <EllipsisVerticalIcon className="w-5 h-5" />
              </Button>
            </DropdownTrigger>
            <DropdownMenu aria-label="Actions">{actions}</DropdownMenu>
          </Dropdown>
        )
      }
      default:
        return item[key]
    }
  }

  if (isLoading) return <div>Loading...</div>

  return (
    <>
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
        onCreate={can('products.categories.create') ? () => setCategoryModal({ open: true, mode: 'create' }) : undefined}
        createLabel={t('catalog.create.category')}
      />

      <ConfirmModal
        isOpen={confirm.open}
        title={t('catalog.confirm.delete_title', { entity: 'Category' })}
        description={t('catalog.confirm.delete_desc', { name: confirm.name })}
        confirmText={t('common.delete')}
        confirmColor="danger"
        onConfirm={() => confirm.id && handleDelete(confirm.id)}
        onClose={() => setConfirm({ open: false })}
      />

      <CategoryModal
        isOpen={categoryModal.open}
        mode={categoryModal.mode}
        category={categoryModal.category}
        onClose={() => setCategoryModal({ open: false, mode: 'create' })}
        onSuccess={() => { qc.invalidateQueries({ queryKey: ['categories'] }); setCategoryModal({ open: false, mode: 'create' }) }}
      />
    </>
  )
} 