import { useMemo, useState } from 'react'
import CustomMainBody from '../../../components/common/CustomMainBody'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import CustomTable, { CustomColumn } from '../../../components/common/CustomTable'
import { shopServicesService, type ShopService } from '../../../services/shopServicesService'
import { Button, Dropdown, DropdownItem, DropdownMenu, DropdownTrigger } from '@heroui/react'
import { EllipsisVerticalIcon, EyeIcon, PencilSquareIcon, TrashIcon } from '@heroicons/react/24/outline'
import ConfirmModal from '../../../components/common/ConfirmModal'
import { toast } from 'react-toastify'

export default function ShopServicePage() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [sp, setSp] = useSearchParams()
  const page = Number(sp.get('page') || '1')
  const limit = Number(sp.get('limit') || '10')
  const search = sp.get('search') || ''
  const [confirm, setConfirm] = useState<{open:boolean; id?: string}>({open:false})

  const { data, isLoading } = useQuery({
    queryKey: ['shop_services', page, limit, search],
    queryFn: () => shopServicesService.list({ page, limit, search }),
    placeholderData: (prev) => prev,
  })

  const items = useMemo(() => (data?.items || []).map((s: ShopService) => ({
    id: s.id,
    estimate_number: s.estimate_number || '-',
    customer: s.customer_name || s.customer_id,
    unit: s.unit_label || s.unit_id,
    subtotal: s.subtotal,
    total: s.total,
  })), [data])

  const columns: CustomColumn[] = useMemo(() => [
    { uid: 'estimate_number', name: 'Estimate #', sortable: true },
    { uid: 'customer', name: 'Customer' },
    { uid: 'unit', name: 'Unit' },
    { uid: 'subtotal', name: 'Subtotal' },
    { uid: 'total', name: 'Total' },
    { uid: 'actions', name: 'Actions' },
  ], [])

  const updateParams = (patch: Record<string, string | number | null>) => {
    const next = new URLSearchParams(sp)
    Object.entries(patch).forEach(([k, v]) => {
      if (v === null || v === undefined || String(v) === '') next.delete(k)
      else next.set(k, String(v))
    })
    setSp(next)
  }

  const handleDelete = async (id: string) => {
    try { await shopServicesService.remove(id); toast.success('Service deleted') }
    catch(e:any){ toast.error(e?.response?.data?.error?.message||'Delete failed') }
    finally { qc.invalidateQueries({ queryKey: ['shop_services'] }); setConfirm({open:false}) }
  }

  const renderCell = (item: any, key: string) => {
    switch (key) {
      case 'estimate_number':
        return (
          <button className="text-primary underline-offset-2 hover:underline" onClick={()=>navigate(`/shop/service/${item.id}/view`)}>
            {item.estimate_number}
          </button>
        )
      case 'actions':
        return (
          <Dropdown placement="bottom-end">
            <DropdownTrigger>
              <Button isIconOnly variant="light" size="sm" aria-label="actions">
                <EllipsisVerticalIcon className="w-5 h-5" />
              </Button>
            </DropdownTrigger>
            <DropdownMenu aria-label="Actions">
              <DropdownItem key="view" startContent={<EyeIcon className="w-4 h-4" />} onPress={() => navigate(`/shop/service/${item.id}/view`)}>View</DropdownItem>
              <DropdownItem key="edit" startContent={<PencilSquareIcon className="w-4 h-4" />} onPress={() => navigate(`/shop/service/${item.id}/edit`)}>Edit</DropdownItem>
              <DropdownItem key="delete" className="text-danger" color="danger" startContent={<TrashIcon className="w-4 h-4" />} onPress={() => setConfirm({ open: true, id: item.id })}>Delete</DropdownItem>
            </DropdownMenu>
          </Dropdown>
        )
      default:
        return item[key] ?? '-'
    }
  }

  return (
    <CustomMainBody>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold">Shop Service</h1>
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
          onCreate={() => navigate('/shop/service/create')}
          createLabel="Create Service"
          renderCell={renderCell}
        />
      )}

      <ConfirmModal
        isOpen={confirm.open}
        title="Delete Service?"
        description="This action cannot be undone."
        confirmText="Delete"
        confirmColor="danger"
        onConfirm={() => { if (confirm.id) handleDelete(confirm.id) }}
        onClose={() => setConfirm({ open: false })}
      />
    </CustomMainBody>
  )
} 