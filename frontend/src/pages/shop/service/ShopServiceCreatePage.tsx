import { useEffect, useMemo, useRef, useState } from 'react'
import CustomMainBody from '../../../components/common/CustomMainBody'
import { Button, Input, Select, SelectItem, Textarea, Autocomplete, AutocompleteItem, Card } from '@heroui/react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'
import { useMutation, useQuery } from '@tanstack/react-query'
import { shopServicesService, type ShopServiceItem, type ShopServiceMisc, type ShopServicePart } from '../../../services/shopServicesService'
import { shopCustomersService } from '../../../services/shopCustomersService'
import { usersService } from '../../../services/usersService'
import { productsService } from '../../../services/productsService'
import { toast } from 'react-toastify'

function PartProductSelect({ value, onPick }: { value: string; onPick: (p: any)=>void }) {
  const [term, setTerm] = useState('')
  const navigate = useNavigate()
  const { data } = useQuery({
    queryKey: ['products-search', term],
    queryFn: async () => term ? productsService.list({ page:1, limit:10, search: term }) : Promise.resolve({ items: [], total: 0 } as any),
    placeholderData: (prev) => prev,
  })
  const items = (data as any)?.items || []
  return (
    <Autocomplete label="Part Name" variant="bordered" inputValue={value}
      onInputChange={setTerm} defaultFilter={()=>true} allowsCustomValue
      onSelectionChange={(key)=>{ const prod = items.find((x:any)=> x.id===key); if (prod) onPick(prod) }}>
      {items.length > 0 ? (
        items.map((p:any)=> (
          <AutocompleteItem key={p.id} textValue={p.name}>
            <div className="flex flex-col">
              <span>{p.name}</span>
              <span className="text-xs text-default-500">{p.sku || p.part_number}</span>
            </div>
          </AutocompleteItem>
        ))
      ) : (
        <AutocompleteItem key="__no_results" textValue="no-results" isReadOnly>
          <div className="flex items-center justify-between w-full">
            <span className="text-default-500 text-sm">No products found for "{term}".</span>
            <Button size="sm" color="primary" onPress={()=> navigate('/products/catalog/create')}>Create Product</Button>
          </div>
        </AutocompleteItem>
      )}
    </Autocomplete>
  )
}

export default function ShopServiceCreatePage() {
  const navigate = useNavigate()
  const containerRef = useRef<HTMLDivElement>(null)

  const [customerId, setCustomerId] = useState('')
  const [contactId, setContactId] = useState('')
  const [unitId, setUnitId] = useState('')
  const [chassisMiles, setChassisMiles] = useState<number | undefined>()
  const [complaint, setComplaint] = useState('')
  const [technicianId, setTechnicianId] = useState('')
  const [notes, setNotes] = useState('')

  const [estimateNumber, setEstimateNumber] = useState('')
  const [authorizationNumber, setAuthorizationNumber] = useState('')
  const [poNumber, setPoNumber] = useState('')
  const [description, setDescription] = useState('')

  const [items, setItems] = useState<ShopServiceItem[]>([])
  const [extras, setExtras] = useState<ShopServiceMisc[]>([])
  const [shopSupplies, setShopSupplies] = useState<number>(0)
  const [taxLocation, setTaxLocation] = useState<'EXEMPT'|'LOCAL'>('EXEMPT')

  const { data: customers } = useQuery({ queryKey: ['shop_customers', 'all'], queryFn: ()=> shopCustomersService.list({ page:1, limit:1000 }) })
  const techsQuery = useQuery({ queryKey: ['users','technicians'], queryFn: ()=> usersService.list({ page:1, limit:1000, is_active: true, role_key: 'technician' }) })
  const unitsQuery = useQuery({ enabled: !!customerId, queryKey: ['shop_units', customerId], queryFn: ()=> shopCustomersService.listUnits({ customer_id: customerId, page:1, limit:1000 }) })
  const contactsQuery = useQuery({ enabled: !!customerId, queryKey: ['shop_contacts', customerId], queryFn: ()=> shopCustomersService.listContacts({ customer_id: customerId, page:1, limit:1000 }) })

  const customerItems = useMemo(()=> (customers?.items||[]).map((c:any)=>({key:c.id,label:c.company_name})) , [customers])
  const unitItems = useMemo(()=> (unitsQuery.data?.items||[]).map((u:any)=>({key:u.id,label:u.unit_number || u.vin || u.id})) , [unitsQuery.data])
  const technicianItems = useMemo(()=> (techsQuery.data?.items||[]).map((u:any)=>({key:u.id,label:u.name})) , [techsQuery.data])
  const contactItems = useMemo(()=> (contactsQuery.data?.items||[]).map((c:any)=>({key:c.id,label:`${c.first_name}${c.last_name? ' '+c.last_name:''}`})) , [contactsQuery.data])

  const addItem = () => setItems(prev => [...prev, { title: '', labor_hours: 0, labor_rate: 0, parts: [] }])
  const updateItem = (idx:number, patch: Partial<ShopServiceItem>) => setItems(prev => prev.map((it,i)=> i===idx ? { ...it, ...patch } : it))
  const addPart = (idx:number) => setItems(prev => prev.map((it,i)=> i===idx ? { ...it, parts: [...it.parts, { name:'', quantity:1, price:0 } as ShopServicePart ] } : it))
  const updatePart = (iIdx:number, pIdx:number, patch: Partial<ShopServicePart>) => setItems(prev => prev.map((it,i)=> i===iIdx ? { ...it, parts: it.parts.map((p,j)=> j===pIdx ? { ...p, ...patch } : p) } : it))

  const addExtra = () => setExtras(prev => [...prev, { name:'', amount:0 }])
  const updateExtra = (idx:number, patch: Partial<ShopServiceMisc>) => setExtras(prev => prev.map((e,i)=> i===idx ? { ...e, ...patch } : e))

  const laborTotal = useMemo(()=> items.reduce((sum, it)=> sum + (it.labor_hours||0) * (it.labor_rate||0), 0), [items])
  const partsTotal = useMemo(()=> items.reduce((sum, it)=> sum + (it.parts||[]).reduce((s,p)=> s + (p.quantity||0) * (p.price||0), 0), 0), [items])
  const extrasTotal = useMemo(()=> extras.reduce((s,e)=> s + (e.amount||0), 0), [extras])
  const subtotal = useMemo(()=> laborTotal + partsTotal + extrasTotal + (shopSupplies||0), [laborTotal, partsTotal, extrasTotal, shopSupplies])
  const taxRate = taxLocation === 'LOCAL' ? 0.075 : 0
  const taxAmount = useMemo(()=> subtotal * taxRate, [subtotal, taxRate])
  const grandTotal = useMemo(()=> subtotal + taxAmount, [subtotal, taxAmount])

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!customerId) throw new Error('Customer is required')
      if (!unitId) throw new Error('Unit is required')
      if (!technicianId) throw new Error('Technician is required')
      if (!contactId) throw new Error('Contact is required')
      if (!complaint) throw new Error('Customer Complaint is required')
      if (!estimateNumber) throw new Error('Estimate # is required')
      return shopServicesService.create({
        customer_id: customerId,
        unit_id: unitId,
        contact_id: contactId,
        chassis_miles: chassisMiles||0,
        customer_complaint: complaint,
        technician_id: technicianId,
        notes,
        estimate_number: estimateNumber,
        authorization_number: authorizationNumber,
        po_number: poNumber,
        description,
        items,
        shop_supplies: shopSupplies,
        extras,
        tax_location: taxLocation,
      })
    },
    onSuccess: (res:any) => { 
      toast.success('Service created')
      const id = (res?.data?.id) || (res?.id)
      if (id) navigate(`/shop/service/${id}/estimate`)
      else navigate('/shop/service')
    },
    onError: (e:any) => toast.error(e?.response?.data?.error?.message || e?.message || 'Create failed'),
  })

  return (
    <CustomMainBody>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold">Create Service</h1>
        <Button color="primary" startContent={<ArrowLeftIcon className="w-4 h-4" />} onPress={() => navigate('/shop/service')}>Back</Button>
      </div>

      <div ref={containerRef} className="space-y-8">
        <section className="space-y-4">
          <h3 className="text-base font-semibold">Details</h3>
          <div className="grid grid-cols-2 gap-6">
            <Select isRequired label="Customer" selectedKeys={customerId?[customerId]:[]} onSelectionChange={(keys)=> setCustomerId(Array.from(keys)[0] as string)} items={customerItems} variant="bordered" classNames={{ trigger: 'h-14' }}>
              {customerItems.map(it => (<SelectItem key={it.key}>{it.label}</SelectItem>))}
            </Select>
            <Select isRequired label="Unit" selectedKeys={unitId?[unitId]:[]} onSelectionChange={(keys)=> setUnitId(Array.from(keys)[0] as string)} items={unitItems} variant="bordered" classNames={{ trigger: 'h-14' }} isDisabled={!customerId}>
              {unitItems.map(it => (<SelectItem key={it.key}>{it.label}</SelectItem>))}
            </Select>
            <Input label="Chassis Miles" type="number" variant="bordered" classNames={{ inputWrapper: 'h-14' }} value={String(chassisMiles||'')} onValueChange={(v)=> setChassisMiles(v? Number(v): undefined)} />
            <Select isRequired label="Assign Technician" selectedKeys={technicianId?[technicianId]:[]} onSelectionChange={(keys)=> setTechnicianId(Array.from(keys)[0] as string)} items={technicianItems} variant="bordered" classNames={{ trigger: 'h-14' }}>
              {technicianItems.map(it => (<SelectItem key={it.key}>{it.label}</SelectItem>))}
            </Select>
            <Select isRequired label="Contact" selectedKeys={contactId?[contactId]:[]} onSelectionChange={(keys)=> setContactId(Array.from(keys)[0] as string)} items={contactItems} variant="bordered" classNames={{ trigger: 'h-14' }} isDisabled={!customerId}>
              {contactItems.map(it => (<SelectItem key={it.key}>{it.label}</SelectItem>))}
            </Select>
          </div>
          <Textarea isRequired label="Customer Complaint" variant="bordered" value={complaint} onValueChange={setComplaint} minRows={3} />
          <Textarea label="Notes" variant="bordered" value={notes} onValueChange={setNotes} minRows={3} />
        </section>

        <section className="space-y-4">
          <h3 className="text-base font-semibold">Identifiers</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input isRequired label="Estimate #" variant="bordered" classNames={{ inputWrapper: 'h-14' }} value={estimateNumber} onValueChange={setEstimateNumber} />
            <Input label="Authorization #" variant="bordered" classNames={{ inputWrapper: 'h-14' }} value={authorizationNumber} onValueChange={setAuthorizationNumber} />
            <Input label="PO #" variant="bordered" classNames={{ inputWrapper: 'h-14' }} value={poNumber} onValueChange={setPoNumber} />
            <Input label="Description" variant="bordered" classNames={{ inputWrapper: 'h-14' }} value={description} onValueChange={setDescription} />
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between"><h3 className="text-base font-semibold">Service Items</h3><Button size="sm" color="success" onPress={addItem}>Add Service</Button></div>
          <div className="space-y-6">
            {items.map((it, i)=> (
              <div key={i} className="rounded-lg border border-default-200 p-4 space-y-3">
                <div className="grid grid-cols-4 gap-4">
                  <Input label="Title" value={it.title} onValueChange={(v)=> updateItem(i,{ title:v })} variant="bordered" classNames={{ inputWrapper:'h-12' }} />
                  <Input label="Labor Hours" type="number" value={String(it.labor_hours)} onValueChange={(v)=> updateItem(i,{ labor_hours: Number(v||0) })} variant="bordered" classNames={{ inputWrapper:'h-12' }} />
                  <Input label="Labor Rate" type="number" value={String(it.labor_rate)} onValueChange={(v)=> updateItem(i,{ labor_rate: Number(v||0) })} variant="bordered" classNames={{ inputWrapper:'h-12' }} />
                  <div className="flex items-center justify-end">
                    <Button size="sm" color="danger" variant="flat" className="hover:bg-danger-100" onPress={()=> setItems(prev=> prev.filter((_,idx)=> idx!==i))}>Delete Service</Button>
                  </div>
                </div>
                <div className="flex items-center justify-between"><h4 className="font-medium">Parts</h4><Button size="sm" color="success" variant="flat" onPress={()=> addPart(i)}>Add Part</Button></div>
                <div className="space-y-2">
                  {it.parts.map((p, j)=> (
                    <div key={j} className="grid grid-cols-5 gap-3 items-center">
                      <PartProductSelect value={p.name} onPick={(prod)=> updatePart(i,j,{ name: prod.name, part_number: prod.part_number || prod.sku, cost: prod.cost_price, price: prod.price })} />
                      <Input label="Part #" value={p.part_number||''} onValueChange={(v)=> updatePart(i,j,{ part_number: v })} variant="bordered" classNames={{ inputWrapper:'h-12' }} />
                      <Input label="Qty" type="number" value={String(p.quantity)} onValueChange={(v)=> updatePart(i,j,{ quantity: Number(v||0) })} variant="bordered" classNames={{ inputWrapper:'h-12' }} />
                      <Input label="Cost" type="number" value={String(p.cost||0)} onValueChange={(v)=> updatePart(i,j,{ cost: Number(v||0) })} variant="bordered" classNames={{ inputWrapper:'h-12' }} />
                      <div className="flex gap-2 items-center">
                        <Input label="Price" type="number" value={String(p.price)} onValueChange={(v)=> updatePart(i,j,{ price: Number(v||0) })} variant="bordered" classNames={{ inputWrapper:'h-12' }} />
                        <Button size="sm" color="danger" variant="flat" className="hover:bg-danger-100" onPress={()=> setItems(prev=> prev.map((svc, svcIdx)=> svcIdx===i? { ...svc, parts: svc.parts.filter((_,ppIdx)=> ppIdx!==j) } : svc))}>Delete</Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <h3 className="text-base font-semibold">Financials</h3>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <Input label="Shop Supplies" type="number" variant="bordered" classNames={{ inputWrapper:'h-14' }} value={String(shopSupplies)} onValueChange={(v)=> setShopSupplies(Number(v||0))} />
              <div className="flex items-center justify-between"><h4 className="font-medium">Extra Misc</h4><Button size="sm" color="success" variant="flat" onPress={addExtra}>Add Misc</Button></div>
              <div className="space-y-2">
                {extras.map((e,i)=> (
                  <div key={i} className="grid grid-cols-3 gap-3 items-center">
                    <Input label="Name" value={e.name} onValueChange={(v)=> updateExtra(i,{ name: v })} variant="bordered" classNames={{ inputWrapper:'h-12' }} />
                    <Input label="Amount" type="number" value={String(e.amount)} onValueChange={(v)=> updateExtra(i,{ amount: Number(v||0) })} variant="bordered" classNames={{ inputWrapper:'h-12' }} />
                    <div className="flex justify-end">
                      <Button size="sm" color="danger" variant="flat" className="hover:bg-danger-100" onPress={()=> setExtras(prev=> prev.filter((_,idx)=> idx!==i))}>Delete</Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <Card className="p-4 h-fit">
              <div className="space-y-3">
                <div className="flex justify-between text-sm"><span className="text-default-500">Shop Supplies</span><span>${shopSupplies.toFixed(2)}</span></div>
                <div className="flex justify-between text-sm"><span className="text-default-500">Labor</span><span>${laborTotal.toFixed(2)}</span></div>
                <div className="flex justify-between text-sm"><span className="text-default-500">Parts</span><span>${partsTotal.toFixed(2)}</span></div>
                {extras.length > 0 && (
                  <>
                    <div className="text-sm font-medium mt-1">Misc</div>
                    <div className="space-y-1">
                      {extras.map((e, idx)=> (
                        <div key={idx} className="flex justify-between text-sm">
                          <span className="text-default-500">{e.name || 'Misc'}</span>
                          <span>${Number(e.amount||0).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
                <div className="border-t border-default-200 my-2" />
                <div className="flex justify-between text-sm"><span className="text-default-500">Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
                <Select label="Tax Location" selectedKeys={[taxLocation]} onSelectionChange={(k)=> setTaxLocation(Array.from(k)[0] as 'EXEMPT'|'LOCAL')} variant="bordered" classNames={{ trigger:'h-12' }}>
                  <SelectItem key="EXEMPT">Exempt</SelectItem>
                  <SelectItem key="LOCAL">Local</SelectItem>
                </Select>
                <div className="text-sm text-default-500">{taxLocation==='EXEMPT'? '0% of $'+subtotal.toFixed(2): '7.5% of $'+subtotal.toFixed(2)}</div>
                <div className="flex justify-between font-semibold"><span>Total</span><span>${grandTotal.toFixed(2)}</span></div>
              </div>
            </Card>
          </div>
        </section>
      </div>

      <div className="sticky bottom-0 mt-4 flex justify-end gap-2">
        <Button variant="flat" onPress={() => navigate('/shop/service')}>Back</Button>
        <Button color="primary" onPress={() => createMutation.mutate()} isLoading={createMutation.isPending} isDisabled={!complaint || !estimateNumber || !customerId || !unitId || !technicianId || !contactId}>Estimate & Create</Button>
      </div>
    </CustomMainBody>
  )
} 