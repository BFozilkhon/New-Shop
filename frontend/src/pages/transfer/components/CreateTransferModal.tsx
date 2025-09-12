import { useEffect, useMemo, useState } from 'react'
import { Modal, ModalBody, ModalContent, ModalHeader, Button, Input, Select, SelectItem } from '@heroui/react'
import { storesService } from '../../../services/storesService'
import { useQuery } from '@tanstack/react-query'
import { transfersService, Transfer } from '../../../services/transfersService'
import { useTranslation } from 'react-i18next'

export default function CreateTransferModal({ open, onOpenChange, onCreated }: { open: boolean; onOpenChange: (v:boolean)=>void; onCreated: (m: Transfer)=>void }) {
  const { t } = useTranslation()
  const [name, setName] = useState('')
  const [fromFile, setFromFile] = useState(false)
  const [depId, setDepId] = useState<string|undefined>()
  const [arrId, setArrId] = useState<string|undefined>()
  const { data: stores } = useQuery({ queryKey: ['stores-all'], queryFn: ()=> storesService.list({ page:1, limit:200 }) })

  useEffect(()=> { if (open) { setName(`${t('transfer.create_modal.title','New transfer')} ${new Date().toISOString().slice(0,16).replace('T',' ')}`) } }, [open])

  const storeItems = useMemo(()=> (stores?.items||[]).map(s=> ({ key: s.id, label: s.title })), [stores])
  const arrivalItems = useMemo(()=> storeItems.filter(s=> s.key !== depId), [storeItems, depId])

  const submit = async () => {
    if (!name || !depId || !arrId) return
    const m = await transfersService.create({ name, from_file: fromFile, departure_shop_id: depId!, arrival_shop_id: arrId! })
    onCreated(m); onOpenChange(false)
  }

  return (
    <Modal isOpen={open} onOpenChange={onOpenChange} size="3xl">
      <ModalContent>
        {close => (
          <>
            <ModalHeader>{t('transfer.create_modal.title','New transfer')}</ModalHeader>
            <ModalBody>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-sm mb-2">{t('transfer.create_modal.name','Name transfer')}</div>
                  <Input value={name} onValueChange={setName} classNames={{ inputWrapper:'h-14' }} aria-label={t('transfer.create_modal.name','Name transfer')} />
                </div>
                <div>
                  <div className="text-sm mb-2">{t('transfer.create_modal.from_file','Transfer from file')}</div>
                  <div className="grid grid-cols-2 gap-0 rounded-xl overflow-hidden border border-default-200">
                    <Button radius="none" className={`h-12 ${fromFile?'bg-primary text-primary-foreground':'bg-default-100'}`} onPress={()=> setFromFile(true)}>{t('common.yes','Yes')}</Button>
                    <Button radius="none" className={`h-12 ${!fromFile?'bg-primary text-primary-foreground':'bg-default-100'}`} onPress={()=> setFromFile(false)}>{t('common.no','No')}</Button>
                  </div>
                </div>
                <div>
                  <div className="text-sm mb-2">{t('transfer.create_modal.departure','Departure store')}</div>
                  <Select aria-label="departure-store" items={storeItems} selectedKeys={depId?[depId]:[]} onSelectionChange={(keys)=> setDepId(Array.from(keys)[0] as string)} classNames={{trigger:'h-14', popoverContent:'z-[1100]'}}>
                    {item => <SelectItem key={item.key}>{item.label}</SelectItem>}
                  </Select>
                </div>
                <div>
                  <div className="text-sm mb-2">{t('transfer.create_modal.arrival','Arrival store')}</div>
                  <Select aria-label="arrival-store" items={arrivalItems} selectedKeys={arrId?[arrId]:[]} onSelectionChange={(keys)=> setArrId(Array.from(keys)[0] as string)} classNames={{trigger:'h-14', popoverContent:'z-[1100]'}}>
                    {item => <SelectItem key={item.key}>{item.label}</SelectItem>}
                  </Select>
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <Button variant="flat" onPress={()=> close()}>{t('common.cancel','Cancel')}</Button>
                <Button color="primary" onPress={submit}>{t('common.create','Create')}</Button>
              </div>
            </ModalBody>
          </>
        )}
      </ModalContent>
    </Modal>
  )
} 