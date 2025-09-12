import { useEffect, useMemo, useState } from 'react'
import CustomTable, { type CustomColumn } from '../../../../components/common/CustomTable'
import { Button, Dropdown, DropdownItem, DropdownMenu, DropdownTrigger } from '@heroui/react'
import { useNavigate } from 'react-router-dom'
import { shopServicesService, type ShopService } from '../../../../services/shopServicesService'
import { EllipsisVerticalIcon, EyeIcon, PencilSquareIcon } from '@heroicons/react/24/outline'

export default function ServicesTab({ customerId }: { customerId: string }) {
  const navigate = useNavigate()
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState('')
  const [items, setItems] = useState<ShopService[]>([])

  const load = async () => {
    const res = await shopServicesService.list({ page, limit, search, customer_id: customerId } as any)
    setItems(res.items || [])
    setTotal(res.total || 0)
  }
  useEffect(()=>{ load() }, [page, limit, search, customerId])

  const rows = useMemo(()=> (items||[]).map(s=> ({ id: s.id, estimate_number: s.estimate_number || '-', unit: s.unit_label || s.unit_id, subtotal: s.subtotal, total: s.total })), [items])

  const columns: CustomColumn[] = [
    { uid: 'estimate_number', name: 'Estimate #' },
    { uid: 'unit', name: 'Unit' },
    { uid: 'subtotal', name: 'Subtotal' },
    { uid: 'total', name: 'Total' },
    { uid: 'actions', name: 'Actions' },
  ]

  const renderCell = (item:any, key:string) => {
    switch (key) {
      case 'estimate_number':
        return <button className="text-primary underline-offset-2 hover:underline" onClick={()=> navigate(`/shop/service/${item.id}/estimate`)}>{item.estimate_number}</button>
      case 'actions':
        return (
          <Dropdown placement="bottom-end">
            <DropdownTrigger>
              <Button isIconOnly variant="light" size="sm" aria-label="actions"><EllipsisVerticalIcon className="w-5 h-5" /></Button>
            </DropdownTrigger>
            <DropdownMenu aria-label="Actions">
              <DropdownItem key="view" startContent={<EyeIcon className="w-4 h-4" />} onPress={()=> navigate(`/shop/service/${item.id}/view`)}>View</DropdownItem>
              <DropdownItem key="edit" startContent={<PencilSquareIcon className="w-4 h-4" />} onPress={()=> navigate(`/shop/service/${item.id}/edit`)}>Edit</DropdownItem>
            </DropdownMenu>
          </Dropdown>
        )
      default:
        return item[key]
    }
  }

  return (
    <CustomTable
      columns={columns}
      items={rows as any}
      total={total}
      page={page}
      limit={limit}
      onPageChange={setPage}
      onLimitChange={setLimit}
      onCreate={()=> navigate('/shop/service/create')}
      createLabel="Create Service"
      searchValue={search}
      onSearchChange={setSearch}
      renderCell={renderCell}
    />
  )
} 