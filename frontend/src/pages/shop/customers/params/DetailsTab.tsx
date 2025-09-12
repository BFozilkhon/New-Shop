import CustomViewCard from '../../../../components/common/CustomViewCard'
import { useQuery } from '@tanstack/react-query'
import { shopCustomersService } from '../../../../services/shopCustomersService'

export default function DetailsTab({ customerId }: { customerId: string }) {
  const { data } = useQuery({ queryKey: ['shop_customer', customerId], queryFn: ()=> shopCustomersService.get(customerId) })

  const rows = [
    { label: 'Company', value: data?.company_name || '-' },
    { label: 'Primary Contact', value: `${data?.first_name||''}${data?.last_name? ' '+data?.last_name:''}` || '-' },
    { label: 'Email', value: data?.email || '-' },
    { label: 'Phone', value: data?.phone || data?.cell_phone || '-' },
    { label: 'Labor Rate', value: data?.labor_rate || '-' },
  ]

  return (
    <div className="grid grid-cols-1 gap-4">
      <CustomViewCard title="Customer" rows={rows} />
    </div>
  )
} 