import { useEffect, useMemo, useState } from 'react'
import { Button, Checkbox, CheckboxGroup, Input, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, Radio, RadioGroup, Select, SelectItem, Textarea } from '@heroui/react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { ordersService, type Order } from '../../../services/ordersService'
import { usePreferences } from '../../../store/prefs'

export default function SupplierPaymentModal({ supplierId, isOpen, onClose, onSuccess, debtUZS }: { supplierId: string; isOpen: boolean; onClose: ()=>void; onSuccess: ()=>void; debtUZS?: number }) {
  const { prefs } = usePreferences()
  const [paymentType, setPaymentType] = useState<'cash'|'cashless'>('cash')
  const [amount, setAmount] = useState<string>('')
  const [comment, setComment] = useState('')
  const [account, setAccount] = useState<string>('')

  useEffect(()=>{ if(!isOpen){ setPaymentType('cash'); setAmount(''); setComment(''); setAccount('') } }, [isOpen])

  const ordersQ = useQuery({
    queryKey: ['supplier-orders-unpaid', supplierId, prefs.selectedStoreId],
    queryFn: async ()=> ordersService.list({ page: 1, limit: 500, supplier_id: supplierId, shop_id: prefs.selectedStoreId||undefined, type: 'supplier_order' }),
    enabled: !!supplierId && isOpen,
  })

  const unpaidOrders = useMemo(()=> {
    const arr = (ordersQ.data?.items||[]) as Order[]
    return arr
      .filter(o => Number(o.total_paid_amount||0) < Number(o.total_price||0))
      .sort((a,b)=> new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
  }, [ordersQ.data])
  const [selectedOrders, setSelectedOrders] = useState<string[]>([])
  useEffect(()=>{ setSelectedOrders(unpaidOrders.map(o=> o.id)) }, [unpaidOrders])

  const addMutation = useMutation({
    mutationFn: async ()=> {
      let remaining = Number(amount||'0')
      if (remaining <= 0) return
      const method = paymentType === 'cash' ? 'cash' : 'cashless'
      for (const o of unpaidOrders.filter(o=> selectedOrders.includes(o.id))) {
        const debt = Math.max(0, Number(o.total_price||0) - Number(o.total_paid_amount||0))
        if (debt <= 0) continue
        const pay = Math.min(remaining, debt)
        if (pay > 0) {
          await ordersService.addPayment(o.id, { amount: pay, payment_method: method, description: comment, payment_date: new Date().toISOString() })
          remaining -= pay
        }
        if (remaining <= 0) break
      }
    },
    onSuccess: ()=> { onSuccess(); onClose() },
  } as any)

  const fmt = (v:number)=> Intl.NumberFormat('ru-RU').format(Number(v||0))

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="2xl" backdrop="blur">
      <ModalContent>
        <ModalHeader className="block">
          <div className="text-2xl font-semibold">Payment to the supplier</div>
          <div className="text-foreground/60 text-sm mt-1">Amount of debt: <span className="text-danger-500 font-semibold">{fmt(debtUZS||0)} UZS</span></div>
        </ModalHeader>
        <ModalBody>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Select label="Check" placeholder="Choose an account" selectedKeys={account? [account]: []} onSelectionChange={(keys)=> setAccount(String(Array.from(keys)[0]||''))} variant="bordered" classNames={{ trigger:'h-14' }}>
              <SelectItem key="acc-default">Main account</SelectItem>
              <SelectItem key="acc-cashbox">Cashbox</SelectItem>
            </Select>
            <div>
              <div className="text-sm font-medium mb-2">Payment type</div>
              <RadioGroup orientation="horizontal" value={paymentType} onValueChange={(v)=> setPaymentType(v as any)} classNames={{ wrapper:'gap-3' }}>
                <Radio value="cash">Cash</Radio>
                <Radio value="cashless">Cashless</Radio>
              </RadioGroup>
            </div>
            <div className="md:col-span-2">
              <Input type="number" label="Total" placeholder="Enter amount" value={amount} onValueChange={setAmount} variant="bordered" classNames={{ inputWrapper:'h-14' }} endContent={<div className="text-foreground/60 text-sm pr-1">UZS</div>} />
            </div>
            <div className="md:col-span-2">
              <div className="text-sm font-medium mb-2">Apply to orders</div>
              <div className="rounded-md border p-2 max-h-40 overflow-auto">
                <CheckboxGroup value={selectedOrders} onChange={(vals)=> setSelectedOrders(vals as string[])}>
                  {unpaidOrders.map(o=> {
                    const debt = Math.max(0, Number(o.total_price||0) - Number(o.total_paid_amount||0))
                    return (
                      <Checkbox key={o.id} value={o.id} className="py-1">
                        <div className="flex justify-between w-full text-sm"><span className="truncate mr-2">{o.name || `Order #${o.external_id||''}`}</span><span className="text-foreground/60">{Intl.NumberFormat('ru-RU').format(debt)} UZS</span></div>
                      </Checkbox>
                    )
                  })}
                </CheckboxGroup>
              </div>
            </div>
            <div className="md:col-span-2">
              <Textarea label="Comment" placeholder="Enter comment" value={comment} onValueChange={setComment} variant="bordered" classNames={{ inputWrapper:'min-h-[3.5rem]' }} />
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="flat" onPress={onClose}>Close</Button>
          <Button color="primary" onPress={()=> addMutation.mutate()} isDisabled={!amount || Number(amount)<=0 || unpaidOrders.length===0 || selectedOrders.length===0}>Pay</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
} 