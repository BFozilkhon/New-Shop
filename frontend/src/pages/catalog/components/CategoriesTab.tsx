import { useMemo, useState } from 'react'
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import { categoriesService, Category } from '../../../services/categoriesService'
import CustomTable, { CustomColumn } from '../../../components/common/CustomTable'
import { useSearchParams } from 'react-router-dom'
import { Button, Chip, Dropdown, DropdownItem, DropdownMenu, DropdownTrigger } from '@heroui/react'
import { EllipsisVerticalIcon, PencilSquareIcon, ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/24/outline'
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
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})

  const { data: tree, isLoading } = useQuery({ queryKey: ['categories','tree'], queryFn: () => categoriesService.getTree() })

  const deleteMutation = useMutation({
    mutationFn: categoriesService.remove,
    onSuccess: () => { toast.success(t('catalog.toast.deleted', { entity: 'Category' })); qc.invalidateQueries({ queryKey: ['categories'] }); setConfirm({ open: false }) },
    onError: (error: any) => { toast.error(error?.response?.data?.message || t('catalog.toast.delete_failed', { entity: 'Category' })) }
  })

  const flattenVisible = (nodes: Category[], depth = 0): any[] => {
    const rows: any[] = []
    for (const n of nodes || []) {
      rows.push({
        id: n.id,
        name: n.name,
        depth,
        hasChildren: (n.children || []).length > 0,
        status: n.is_active ? t('catalog.common.active') : t('catalog.common.inactive'),
        created_at: new Date(n.created_at).toLocaleDateString(),
        raw: n,
        product_count: (n as any).product_count || 0,
      })
      if (expanded[n.id] && n.children?.length) rows.push(...flattenVisible(n.children, depth + 1))
    }
    return rows
  }

  const visibleItems = useMemo(()=> flattenVisible(tree || [], 0), [tree, expanded, t])

  const columns: CustomColumn[] = useMemo(() => [
    { uid: 'name', name: t('catalog.table.name'), sortable: false },
    { uid: 'product_count', name: t('catalog.table.num_products', { defaultValue: 'Number of products' }) },
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
      case 'name': {
        const open = !!expanded[item.id]
        return (
          <div className="flex items-center gap-2" style={{ paddingLeft: (item.depth || 0) * 20 }}>
            {item.hasChildren ? (
              <button className="p-1 rounded hover:bg-default-100" onClick={()=> setExpanded(s=> ({ ...s, [item.id]: !open }))} aria-label={open? 'collapse':'expand'}>
                {open ? <ChevronDownIcon className="w-4 h-4" /> : <ChevronRightIcon className="w-4 h-4" />}
              </button>
            ) : <span className="w-5" />}
            <span>{item.name}</span>
          </div>
        )
      }
      case 'status':
        return (<Chip className="capitalize border-none gap-1 text-default-600" color={item.status === t('catalog.common.active') ? 'success' : 'danger'} size="sm" variant="dot">{item.status}</Chip>)
      case 'actions': {
        if (item.depth > 0) return null // actions only for root rows
        const node = item.raw as Category
        const actions = [] as any[]
        if (can('products.categories.update')) {
          actions.push(
            <DropdownItem key="edit" startContent={<PencilSquareIcon className="w-4 h-4" />} onPress={() => setCategoryModal({ open: true, mode: 'edit', category: node })}>{t('common.edit')}</DropdownItem>
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
        items={visibleItems}
        total={visibleItems.length}
        page={page}
        limit={Math.max(limit, visibleItems.length)}
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