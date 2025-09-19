import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Button, Chip } from '@heroui/react'
import CustomMainBody from '../../components/common/CustomMainBody'
import CustomTable, { CustomColumn } from '../../components/common/CustomTable'
import { transfersService } from '../../services/transfersService'
import CreateTransferModal from './components/CreateTransferModal'
import { useTranslation } from 'react-i18next'
import useCurrency from '../../hooks/useCurrency'
import MoneyAt from '../../components/common/MoneyAt'

export default function TransferPage() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(20)
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)
  const { format: fmt } = useCurrency()

  const { data } = useQuery({ queryKey: ['transfers', page, limit, search], queryFn: ()=> transfersService.list({ page, limit, search }), placeholderData: (p)=> p })
  const rows = useMemo(()=> (data?.items||[]), [data])

  const columns: CustomColumn[] = useMemo(()=> ([
    { uid: 'id', name: t('common.id') },
    { uid: 'name', name: t('transfer.list.name','Name'), className:'min-w-[320px]' },
    { uid: 'arrival_shop_name', name: t('transfer.list.arrival','Arrival store') },
    { uid: 'departure_shop_name', name: t('transfer.list.departure','Departured store') },
    { uid: 'total_qty', name: t('transfer.list.qty','Quantity') },
    { uid: 'status', name: t('transfer.list.status','Status') },
    { uid: 'created_by', name: t('transfer.list.created_by','Created by') },
    { uid: 'total_price', name: t('transfer.list.total','Total') },
    { uid: 'created_at', name: t('transfer.list.created_at','Departured date') },
    { uid: 'finished_at', name: t('transfer.list.finished_at','Accepted date') },
  ]), [t])

  const renderCell = (row:any, key:string) => {
    switch (key) {
      case 'id': return row.external_id || row.id
      case 'name': return <button className="text-primary underline-offset-2 hover:underline" onClick={()=> navigate(`/products/transfer/${row.id}`)}>{row.name}</button>
      case 'status': return <Chip color={row.status==='APPROVED'?'success':row.status==='REJECTED'?'danger':'default'} size="sm" variant="flat">{row.status}</Chip>
      case 'created_by': return row.created_by?.name || '-'
      case 'total_price': return <MoneyAt amount={Number(row.total_price||0)} date={row.created_at} />
      default: return row[key]
    }
  }

  return (
    <CustomMainBody>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold">{t('transfer.header','Transfer')}</h1>
      </div>

      <CustomTable
        columns={columns}
        items={rows}
        total={data?.total||0}
        page={page}
        limit={limit}
        onPageChange={setPage}
        onLimitChange={setLimit}
        renderCell={renderCell}
        searchValue={search}
        onSearchChange={setSearch}
        onSearchClear={()=> setSearch('')}
        rightAction={<Button color="primary" onPress={()=> setOpen(true)}>{t('transfer.create','New transfer')}</Button>}
        onCreate={()=> setOpen(true)}
        createLabel={t('transfer.create','New transfer')}
      />

      <CreateTransferModal open={open} onOpenChange={setOpen} onCreated={(m)=> navigate(`/products/transfer/${m.id}`)} />
    </CustomMainBody>
  )
} 