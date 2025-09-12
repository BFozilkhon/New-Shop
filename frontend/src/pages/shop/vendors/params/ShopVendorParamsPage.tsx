import CustomMainBody from '../../../../components/common/CustomMainBody'
import { Tabs, Tab } from '@heroui/react'
import { useSearchParams } from 'react-router-dom'

export default function ShopVendorParamsPage() {
  const [sp, setSp] = useSearchParams()
  const tab = sp.get('tab') || 'orders'
  const handleTabChange = (key: string) => setSp({ tab: key })
  return (
    <CustomMainBody>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold">Vendor Details</h1>
      </div>
      <Tabs aria-label="Shop Vendor Params" color="primary" variant="bordered" selectedKey={tab} onSelectionChange={(k)=>handleTabChange(k as string)} className="w-full" classNames={{ tabList: 'w-full h-14', tab: 'h-12' }}>
        <Tab key="orders" title={<div className="flex items-center space-x-2"><span>Orders</span></div>}>
          <div className="p-4 text-default-500">Coming soon</div>
        </Tab>
        <Tab key="transactions" title={<div className="flex items-center space-x-2"><span>Transactions</span></div>}>
          <div className="p-4 text-default-500">Coming soon</div>
        </Tab>
        <Tab key="contacts" title={<div className="flex items-center space-x-2"><span>Contacts</span></div>}>
          <div className="p-4 text-default-500">Coming soon</div>
        </Tab>
        <Tab key="details" title={<div className="flex items-center space-x-2"><span>Details</span></div>}>
          <div className="p-4 text-default-500">Coming soon</div>
        </Tab>
      </Tabs>
    </CustomMainBody>
  )
} 