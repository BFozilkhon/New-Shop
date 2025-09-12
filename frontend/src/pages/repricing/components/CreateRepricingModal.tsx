import { useMemo, useState } from 'react'
import { Button, Input, Select, SelectItem } from '@heroui/react'
import CustomModal from '../../../components/common/CustomModal'
import { repricingsService } from '../../../services/repricingsService'
import { storesService } from '../../../services/storesService'
import { useQuery } from '@tanstack/react-query'

function generateDefaultName() {
  const d = new Date()
  const pad = (n:number)=> String(n).padStart(2,'0')
  const ts = `${d.getFullYear()}.${pad(d.getMonth()+1)}.${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
  return `Repricing ${ts}`
}

export default function CreateRepricingModal({ isOpen, onOpenChange, onCreated }: { isOpen: boolean; onOpenChange: (v:boolean)=>void; onCreated?: ()=>void }) {
  const [name, setName] = useState<string>(()=> generateDefaultName())
  const [fromFile, setFromFile] = useState(false)
  const [shopId, setShopId] = useState<string>('')
  const [rtype, setRtype] = useState<'price_change'|'currency_change'|'delivery_price_change'>('price_change')
  const shopsQ = useQuery({ queryKey: ['stores','all'], queryFn: ()=> storesService.list({ page:1, limit:100 }), placeholderData: (p)=> p })
  const shopItems = useMemo(()=> (shopsQ.data?.items||[]).map((s:any)=> ({ key: s.id, label: s.title||s.name })), [shopsQ.data])

  const handle = async () => {
    const created = await repricingsService.create({ name, from_file: fromFile, shop_id: shopId, type: rtype })
    onOpenChange(false)
    onCreated && onCreated()
    // reset for next open
    setName(generateDefaultName())
    setFromFile(false)
    setShopId('')
    setRtype('price_change')
  }

  return (
    <CustomModal isOpen={isOpen} onOpenChange={onOpenChange} title="New repricing" onSubmit={handle} submitDisabled={!name || !shopId || !rtype} size="3xl">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Input isRequired label="Name the repricing" value={name} onValueChange={setName} variant="bordered" classNames={{ inputWrapper:'h-14' }} />
        <Select isRequired label="In the store" selectedKeys={shopId?[shopId]:[]} onSelectionChange={(keys)=> setShopId(String(Array.from(keys)[0]||''))} variant="bordered" classNames={{ trigger:'h-14' }}>
          {shopItems.map(it=> (<SelectItem key={it.key}>{it.label}</SelectItem>))}
        </Select>
        <div className="col-span-1">
          <p className="text-sm text-default-500 mb-2">Repricing from a file</p>
          <div className="grid grid-cols-2 gap-0 rounded-xl overflow-hidden border border-default-200">
            <Button radius="none" className={`h-12 ${fromFile?'bg-primary text-primary-foreground':'bg-default-100'}`} onPress={()=> setFromFile(true)}>Yes</Button>
            <Button radius="none" className={`h-12 ${!fromFile?'bg-primary text-primary-foreground':'bg-default-100'}`} onPress={()=> setFromFile(false)}>No</Button>
          </div>
        </div>
        <Select isRequired label="Repricing type" selectedKeys={[rtype]} onSelectionChange={(keys)=> setRtype(String(Array.from(keys)[0]||'price_change') as any)} variant="bordered" classNames={{ trigger:'h-14' }}>
          <SelectItem key="currency_change">Change currency</SelectItem>
          <SelectItem key="price_change">Change the price</SelectItem>
          <SelectItem key="delivery_price_change">Change delivery price</SelectItem>
        </Select>
      </div>
    </CustomModal>
  )
} 