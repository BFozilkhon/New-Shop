import { useMemo, useState } from 'react'
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import { characteristicsService, Characteristic } from '../../../services/characteristicsService'
import CustomTable, { CustomColumn } from '../../../components/common/CustomTable'
import { useSearchParams } from 'react-router-dom'
import { Button, Chip, Dropdown, DropdownItem, DropdownMenu, DropdownTrigger } from '@heroui/react'
import { EllipsisVerticalIcon, EyeIcon, PencilSquareIcon, TrashIcon } from '@heroicons/react/24/outline'
import ConfirmModal from '../../../components/common/ConfirmModal'
import CharacteristicModal from './CharacteristicModal'
import { toast } from 'react-toastify'
import { useAuth } from '../../../store/auth'
import { useTranslation } from 'react-i18next'

export default function CharacteristicsTab() {
  const { t } = useTranslation()
  const qc = useQueryClient()
  const [sp, setSp] = useSearchParams()
  const page = Number(sp.get('page') || '1')
  const limit = Number(sp.get('limit') || '10')
  const search = sp.get('search') || ''
  const { auth } = useAuth()
  const can = (p: string) => auth.permissions.includes(p)
  
  const [confirm, setConfirm] = useState<{ open: boolean; id?: string; name?: string }>({ open: false })
  const [characteristicModal, setCharacteristicModal] = useState<{ open: boolean; mode: 'create' | 'edit' | 'view'; characteristic?: Characteristic }>({ open: false, mode: 'create' })

  const { data, isLoading } = useQuery({
    queryKey: ['characteristics', page, limit, search],
    queryFn: () => characteristicsService.list({ page, limit, search }),
    placeholderData: (prev) => prev,
  })

  const deleteMutation = useMutation({
    mutationFn: characteristicsService.remove,
    onSuccess: () => {
      toast.success(t('catalog.toast.deleted', { entity: t('catalog.entities.characteristic') }))
      qc.invalidateQueries({ queryKey: ['characteristics'] })
      setConfirm({ open: false })
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || t('catalog.toast.delete_failed', { entity: t('catalog.entities.characteristic') }))
    }
  })

  const items = useMemo(() => (data?.items || []).map((c: Characteristic) => ({
    id: c.id,
    name: c.name,
    type: c.type,
    values: (c.values || []).join(', '),
    status: c.is_active ? t('catalog.common.active') : t('catalog.common.inactive'),
    created_at: new Date(c.created_at).toLocaleDateString(),
  })), [data, t])

  const columns: CustomColumn[] = useMemo(() => [
    { uid: 'name', name: t('catalog.table.name'), sortable: true },
    { uid: 'type', name: t('catalog.table.type') },
    { uid: 'values', name: 'Values' },
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
      case 'type':
        return (
          <Chip className="capitalize" color="default" size="sm" variant="flat">{item.type}</Chip>
        )
      case 'values':
        return item.values ? <span className="text-default-600 text-sm truncate max-w-[320px] inline-block">{item.values}</span> : ''
      case 'status':
        return (
          <Chip className="capitalize border-none gap-1 text-default-600" color={item.status === t('catalog.common.active') ? 'success' : 'danger'} size="sm" variant="dot">{item.status}</Chip>
        )
      case 'actions': {
        const actions = [] as any[]
        actions.push(
          <DropdownItem key="view" startContent={<EyeIcon className="w-4 h-4" />} onPress={() => { const characteristic = data?.items.find((c: any) => c.id === item.id); if (characteristic) setCharacteristicModal({ open: true, mode: 'view', characteristic }) }}>{t('common.view')}</DropdownItem>
        )
        if (can('products.characteristics.update')) {
          actions.push(
            <DropdownItem key="edit" startContent={<PencilSquareIcon className="w-4 h-4" />} onPress={() => { const characteristic = data?.items.find((c: any) => c.id === item.id); if (characteristic) setCharacteristicModal({ open: true, mode: 'edit', characteristic }) }}>{t('common.edit')}</DropdownItem>
          )
        }
        if (can('products.characteristics.delete')) {
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
        onCreate={can('products.characteristics.create') ? () => setCharacteristicModal({ open: true, mode: 'create' }) : undefined}
        createLabel={t('catalog.create.characteristic')}
      />

      <ConfirmModal
        isOpen={confirm.open}
        title={t('catalog.confirm.delete_title', { entity: t('catalog.entities.characteristic') })}
        description={t('catalog.confirm.delete_desc', { name: confirm.name })}
        confirmText={t('common.delete')}
        confirmColor="danger"
        onConfirm={() => confirm.id && handleDelete(confirm.id)}
        onClose={() => setConfirm({ open: false })}
      />

      <CharacteristicModal
        isOpen={characteristicModal.open}
        mode={characteristicModal.mode}
        characteristic={characteristicModal.characteristic}
        onClose={() => setCharacteristicModal({ open: false, mode: 'create' })}
        onSuccess={() => { qc.invalidateQueries({ queryKey: ['characteristics'] }); setCharacteristicModal({ open: false, mode: 'create' }) }}
      />
    </>
  )
} 