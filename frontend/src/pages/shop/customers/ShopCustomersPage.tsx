import { useMemo, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import CustomMainBody from '../../../components/common/CustomMainBody'
import CustomTable, { CustomColumn } from '../../../components/common/CustomTable'
import { Button, Dropdown, DropdownItem, DropdownMenu, DropdownTrigger } from '@heroui/react'
import { EllipsisVerticalIcon, EyeIcon, PencilSquareIcon, TrashIcon } from '@heroicons/react/24/outline'
import { useNavigate, useSearchParams } from 'react-router-dom'
import ConfirmModal from '../../../components/common/ConfirmModal'
import { shopCustomersService, type ShopCustomer } from '../../../services/shopCustomersService'

export default function ShopCustomersPage() {
  const qc = useQueryClient()
  const navigate = useNavigate()
  const [sp, setSp] = useSearchParams()
  const page = Number(sp.get('page') || '1')
  const limit = Number(sp.get('limit') || '10')
  const search = sp.get('search') || ''
  const [confirm, setConfirm] = useState<{ open: boolean; id?: string; name?: string }>({ open: false })

  const { data, isLoading } = useQuery({
    queryKey: ['shop_customers', page, limit, search],
    queryFn: () => shopCustomersService.list({ page, limit, search }),
    placeholderData: (prev) => prev,
  })

  const items = useMemo(() => (data?.items || []).map((c: ShopCustomer) => ({
    id: c.id,
    company_name: c.company_name,
    first_name: c.first_name,
    last_name: c.last_name || '-',
    phone: c.phone || '-',
    cell_phone: c.cell_phone || '-',
    email: c.email || '-',
    labor_rate: c.labor_rate,
  })), [data])

  const columns: CustomColumn[] = useMemo(() => [
    { uid: 'company_name', name: 'Company', sortable: true },
    { uid: 'first_name', name: 'First name', sortable: true },
    { uid: 'last_name', name: 'Last name', sortable: true },
    { uid: 'phone', name: 'Phone' },
    { uid: 'cell_phone', name: 'Cell Phone' },
    { uid: 'email', name: 'Email' },
    { uid: 'labor_rate', name: 'Labor Rate' },
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
    await shopCustomersService.remove(id)
    qc.invalidateQueries({ queryKey: ['shop_customers'] })
  }

  const renderCell = (item: any, key: string) => {
    switch (key) {
      case 'company_name':
        return (
          <button className="text-primary underline-offset-2 hover:underline" onClick={()=>navigate(`/shop/customers/${item.id}/view?tab=units`)}>{item.company_name}</button>
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
              <DropdownItem key="view" startContent={<EyeIcon className="w-4 h-4" />} onPress={() => navigate(`/shop/customers/${item.id}/view?mode=view`)}>View</DropdownItem>
              <DropdownItem key="edit" startContent={<PencilSquareIcon className="w-4 h-4" />} onPress={() => navigate(`/shop/customers/${item.id}/edit`)}>Edit</DropdownItem>
              <DropdownItem key="delete" className="text-danger" color="danger" startContent={<TrashIcon className="w-4 h-4" />} onPress={() => setConfirm({ open: true, id: item.id, name: `${item.company_name}` })}>Delete</DropdownItem>
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
          <h1 className="text-xl font-semibold">Shop Customers</h1>
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
            onCreate={() => navigate('/shop/customers/create')}
            createLabel="Create Shop Customer"
          />
        )}
      </CustomMainBody>

      <ConfirmModal
        isOpen={confirm.open}
        title="Delete Shop Customer?"
        description={`Are you sure you want to delete "${confirm.name}"? This action cannot be undone.`}
        confirmText="Delete"
        confirmColor="danger"
        onConfirm={() => { if (confirm.id) handleDelete(confirm.id) }}
        onClose={() => setConfirm({ open: false })}
      />
    </>
  )
} 