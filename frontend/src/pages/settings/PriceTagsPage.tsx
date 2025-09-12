import { useMemo, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import CustomMainBody from '../../components/common/CustomMainBody'
import CustomTable, { CustomColumn } from '../../components/common/CustomTable'
import { priceTagsService, PriceTagTemplate } from '../../services/priceTagsService'
import { Button, Dropdown, DropdownItem, DropdownMenu, DropdownTrigger } from '@heroui/react'
import { EllipsisVerticalIcon, PencilSquareIcon, TrashIcon } from '@heroicons/react/24/outline'
import ConfirmModal from '../../components/common/ConfirmModal'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'react-toastify'

export default function PriceTagsPage() {
  const qc = useQueryClient()
  const navigate = useNavigate()
  const [sp, setSp] = useSearchParams()
  const page = Number(sp.get('page') || '1')
  const limit = Number(sp.get('limit') || '10')
  const search = sp.get('search') || ''
  const [confirm, setConfirm] = useState<{ open: boolean; id?: string; name?: string }>({ open: false })

  const { data } = useQuery({
    queryKey: ['pricetags', page, limit, search],
    queryFn: () => priceTagsService.list({ page, limit, search }),
    placeholderData: (p)=>p,
  })

  const items = useMemo(() => (data?.items || []).map((it: PriceTagTemplate) => ({
    id: it.id,
    name: it.name,
    size: `${it.width_mm}×${it.height_mm}`,
    barcode_fmt: it.barcode_fmt,
  })), [data])

  const columns: CustomColumn[] = useMemo(()=>([
    { uid: 'name', name: 'Name' },
    { uid: 'size', name: 'Size' },
    { uid: 'barcode_fmt', name: 'Barcode' },
    { uid: 'actions', name: 'Actions' },
  ]),[])

  const updateParams = (patch: Record<string, string | number | null>) => {
    const next = new URLSearchParams(sp)
    Object.entries(patch).forEach(([k, v]) => {
      if (v === null || v === undefined || String(v) === '') next.delete(k)
      else next.set(k, String(v))
    })
    setSp(next)
  }

  const handleDelete = async (id: string) => {
    await priceTagsService.remove(id)
    toast.success('Template deleted')
    qc.invalidateQueries({ queryKey: ['pricetags'] })
  }

  const rightAction = (
    <Button color="primary" onPress={()=>navigate('/settings/pricetags/create')}>New template</Button>
  )

  const renderCell = (item: any, key: string) => {
    switch (key) {
      case 'actions':
        return (
          <Dropdown placement="bottom-end">
            <DropdownTrigger>
              <Button isIconOnly variant="light" size="sm"><EllipsisVerticalIcon className="w-5 h-5" /></Button>
            </DropdownTrigger>
            <DropdownMenu aria-label="Actions">
              <DropdownItem key="edit" startContent={<PencilSquareIcon className="w-4 h-4" />} onPress={()=>navigate(`/settings/pricetags/${item.id}/edit`)}>Edit</DropdownItem>
              <DropdownItem key="delete" className="text-danger" color="danger" startContent={<TrashIcon className="w-4 h-4" />} onPress={()=>setConfirm({ open:true, id:item.id, name:item.name })}>Delete</DropdownItem>
            </DropdownMenu>
          </Dropdown>
        )
      default:
        return item[key]
    }
  }

  return (
    <CustomMainBody>
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-xl font-semibold">Price Tags</h1>
      </div>
      <CustomTable
        columns={columns}
        items={items}
        total={data?.total ?? 0}
        page={page}
        limit={limit}
        onPageChange={(p)=>updateParams({ page:p })}
        onLimitChange={(l)=>updateParams({ limit:l, page:1 })}
        searchValue={search}
        onSearchChange={(v)=>updateParams({ search:v, page:1 })}
        onSearchClear={()=>updateParams({ search:null, page:1 })}
        renderCell={renderCell}
        rightAction={rightAction}
      />
      <ConfirmModal
        isOpen={confirm.open}
        title={`Delete “${confirm.name}”?`}
        description={`This action cannot be undone.`}
        confirmText="Delete"
        confirmColor="danger"
        onConfirm={()=>{ if (confirm.id) handleDelete(confirm.id) }}
        onClose={()=>setConfirm({ open:false })}
      />
    </CustomMainBody>
  )
} 