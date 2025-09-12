import { useEffect, useMemo, useRef, useState } from 'react'
import CustomMainBody from '../../../components/common/CustomMainBody'
import { Button, Input, Select, SelectItem, Textarea, Autocomplete, AutocompleteItem, Card } from '@heroui/react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'
import { useMutation, useQuery } from '@tanstack/react-query'
import { shopServicesService, type ShopServiceItem, type ShopServiceMisc, type ShopServicePart } from '../../../services/shopServicesService'
import { shopCustomersService } from '../../../services/shopCustomersService'
import { usersService } from '../../../services/usersService'
import { productsService } from '../../../services/productsService'
import { toast } from 'react-toastify'

function PartProductSelect({ value, onPick }: { value: string; onPick: (p: any)=>void }) {
  const [term, setTerm] = useState('')
  const { data } = useQuery({
    queryKey: ['products-search', term],
    queryFn: async () => term ? productsService.list({ page:1, limit:10, search: term }) : Promise.resolve({ items: [], total: 0 } as any),
    placeholderData: (prev)=> prev,
  })
  const navigate = useNavigate()
  const items = (data as any)?.items || []
  return (
    <Autocomplete label="Part Name" variant="bordered" inputValue={value}
      onInputChange={setTerm} defaultFilter={()=>true} allowsCustomValue>
      {items.length > 0 ? (
        items.map((p:any)=> (
          <AutocompleteItem key={p.id} textValue={p.name} onPress={()=> onPick(p)}>
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

export default function ShopServiceEditPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const [sp] = useSearchParams()
  const isViewMode = sp.get('mode') === 'view'

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

  useQuery({
    queryKey: ['shop_service', id],
    enabled: !!id,
    queryFn: async () => {
      const it = await shopServicesService.get(id!)
      setCustomerId(it.customer_id||'')
      setContactId(it.contact_id||'')
      setUnitId(it.unit_id||''); setChassisMiles(it.chassis_miles); setComplaint(it.customer_complaint||'')
      setTechnicianId(it.technician_id||''); setNotes(it.notes||'')
      setEstimateNumber(it.estimate_number||''); setAuthorizationNumber(it.authorization_number||''); setPoNumber(it.po_number||''); setDescription(it.description||'')
      setItems(it.items||[]); setExtras(it.extras||[]); setShopSupplies(it.shop_supplies||0); setTaxLocation(it.tax_location==='LOCAL'?'LOCAL':'EXEMPT')
      return it
    }
  })

  const customerItems = useMemo(()=> (customers?.items||[]).map((c:any)=>({key:c.id,label:c.company_name})) , [customers])
  const unitItems = useMemo(()=> (unitsQuery.data?.items||[]).map((u:any)=>({key:u.id,label:u.unit_number || u.vin || u.id})) , [unitsQuery.data])
  const technicianItems = useMemo(()=> (techsQuery.data?.items||[]).map((u:any)=>({key:u.id,label:u.name})) , [techsQuery.data])
  const contactItems = useMemo(()=> (contactsQuery.data?.items||[]).map((c:any)=>({key:c.id,label:`${c.first_name}${c.last_name? ' '+c.last_name:''}`})) , [contactsQuery.data])

  const laborTotal = useMemo(()=> items.reduce((sum, it)=> sum + (it.labor_hours||0) * (it.labor_rate||0), 0), [items])
  const partsTotal = useMemo(()=> items.reduce((sum, it)=> sum + (it.parts||[]).reduce((s,p)=> s + (p.quantity||0) * (p.price||0), 0), 0), [items])
  const extrasTotal = useMemo(()=> extras.reduce((s,e)=> s + (e.amount||0), 0), [extras])
  const subtotal = useMemo(()=> laborTotal + partsTotal + extrasTotal + (shopSupplies||0), [laborTotal, partsTotal, extrasTotal, shopSupplies])
  const taxRate = taxLocation === 'LOCAL' ? 0.075 : 0
  const taxAmount = useMemo(()=> subtotal * taxRate, [subtotal, taxRate])
  const grandTotal = useMemo(()=> subtotal + taxAmount, [subtotal, taxAmount])

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!id) return
      if (!complaint) throw new Error('Customer Complaint is required')
      if (!estimateNumber) throw new Error('Estimate # is required')
      return shopServicesService.update(id!, {
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
    onSuccess: () => { toast.success('Service updated'); navigate('/shop/service') },
    onError: (e:any) => toast.error(e?.response?.data?.error?.message || e?.message || 'Update failed'),
  })

  const addItem = () => setItems(prev => [...prev, { title: '', labor_hours: 0, labor_rate: 0, parts: [] }])
  const updateItem = (idx:number, patch: Partial<ShopServiceItem>) => setItems(prev => prev.map((it,i)=> i===idx ? { ...it, ...patch } : it))
  const addPart = (idx:number) => setItems(prev => prev.map((it,i)=> i===idx ? { ...it, parts: [...it.parts, { name:'', quantity:1, price:0 } as ShopServicePart ] } : it))
  const updatePart = (iIdx:number, pIdx:number, patch: Partial<ShopServicePart>) => setItems(prev => prev.map((it,i)=> i===iIdx ? { ...it, parts: it.parts.map((p,j)=> j===pIdx ? { ...p, ...patch } : p) } : it))

  return (
    <CustomMainBody>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold">{isViewMode ? 'View Service' : 'Edit Service'}</h1>
        <div className="flex gap-2">
          <Button color="primary" variant="flat" onPress={() => navigate('/shop/service')}>Back</Button>
          {id && <Button color="primary" onPress={() => navigate(`/shop/service/${id}/estimate`)}>Estimate</Button>}
        </div>
      </div>

      <section className="space-y-4">
        <h3 className="text-base font-semibold">Details</h3>
        <div className="grid grid-cols-2 gap-6">
          <Select label="Customer" selectedKeys={customerId?[customerId]:[]} onSelectionChange={(keys)=>!isViewMode && setCustomerId(Array.from(keys)[0] as string)} items={customerItems} variant="bordered" classNames={{ trigger: 'h-14' }} isDisabled={isViewMode} isRequired>
            {customerItems.map(it => (<SelectItem key={it.key}>{it.label}</SelectItem>))}
          </Select>
          <Select label="Unit" selectedKeys={unitId?[unitId]:[]} onSelectionChange={(keys)=>!isViewMode && setUnitId(Array.from(keys)[0] as string)} items={unitItems} variant="bordered" classNames={{ trigger: 'h-14' }} isDisabled={isViewMode || !customerId} isRequired>
            {unitItems.map(it => (<SelectItem key={it.key}>{it.label}</SelectItem>))}
          </Select>
          <Input label="Chassis Miles" type="number" variant="bordered" classNames={{ inputWrapper: 'h-14' }} value={String(chassisMiles||'')} onValueChange={(v)=> setChassisMiles(v? Number(v): undefined)} isReadOnly={isViewMode} />
          <Select label="Assign Technician" selectedKeys={technicianId?[technicianId]:[]} onSelectionChange={(keys)=>!isViewMode && setTechnicianId(Array.from(keys)[0] as string)} items={technicianItems} variant="bordered" classNames={{ trigger: 'h-14' }} isDisabled={isViewMode} isRequired>
            {technicianItems.map(it => (<SelectItem key={it.key}>{it.label}</SelectItem>))}
          </Select>
          <Select label="Contact" selectedKeys={contactId?[contactId]:[]} onSelectionChange={(keys)=>!isViewMode && setContactId(Array.from(keys)[0] as string)} items={contactItems} variant="bordered" classNames={{ trigger: 'h-14' }} isDisabled={isViewMode || !customerId} isRequired>
            {contactItems.map(it => (<SelectItem key={it.key}>{it.label}</SelectItem>))}
          </Select>
        </div>
        <Textarea isRequired label="Customer Complaint" variant="bordered" value={complaint} onValueChange={setComplaint} minRows={3} isReadOnly={isViewMode} />
        <Textarea label="Notes" variant="bordered" value={notes} onValueChange={setNotes} minRows={3} isReadOnly={isViewMode} />
      </section>

      <section className="space-y-4 mt-6">
        <h3 className="text-base font-semibold">Identifiers</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input isRequired label="Estimate #" variant="bordered" classNames={{ inputWrapper: 'h-14' }} value={estimateNumber} onValueChange={setEstimateNumber} isReadOnly={isViewMode} />
          <Input label="Authorization #" variant="bordered" classNames={{ inputWrapper: 'h-14' }} value={authorizationNumber} onValueChange={setAuthorizationNumber} isReadOnly={isViewMode} />
          <Input label="PO #" variant="bordered" classNames={{ inputWrapper: 'h-14' }} value={poNumber} onValueChange={setPoNumber} isReadOnly={isViewMode} />
          <Input label="Description" variant="bordered" classNames={{ inputWrapper: 'h-14' }} value={description} onValueChange={setDescription} isReadOnly={isViewMode} />
        </div>
      </section>

      <section className="space-y-4 mt-6">
        <div className="flex items-center justify-between"><h3 className="text-base font-semibold">Service Items</h3><Button size="sm" color="success" onPress={()=>!isViewMode && addItem()} isDisabled={isViewMode}>Add Service</Button></div>
        <div className="space-y-6">
          {items.map((it, i)=> (
            <div key={i} className="rounded-lg border border-default-200 p-4 space-y-3">
              <div className="grid grid-cols-4 gap-4">
                <Input label="Title" value={it.title} onValueChange={(v)=> updateItem(i,{ title:v })} variant="bordered" classNames={{ inputWrapper:'h-12' }} isReadOnly={isViewMode} />
                <Input label="Labor Hours" type="number" value={String(it.labor_hours)} onValueChange={(v)=> updateItem(i,{ labor_hours: Number(v||0) })} variant="bordered" classNames={{ inputWrapper:'h-12' }} isReadOnly={isViewMode} />
                <Input label="Labor Rate" type="number" value={String(it.labor_rate)} onValueChange={(v)=> updateItem(i,{ labor_rate: Number(v||0) })} variant="bordered" classNames={{ inputWrapper:'h-12' }} isReadOnly={isViewMode} />
                {!isViewMode && (<div className="flex items-center justify-end"><Button size="sm" color="danger" variant="flat" className="hover:bg-danger-100" onPress={()=> setItems(prev=> prev.filter((_,idx)=> idx!==i))}>Delete Service</Button></div>)}
              </div>
              <div className="flex items-center justify-between"><h4 className="font-medium">Parts</h4><Button size="sm" color="success" variant="flat" onPress={()=> !isViewMode && addPart(i)} isDisabled={isViewMode}>Add Part</Button></div>
              <div className="space-y-2">
                {it.parts.map((p, j)=> (
                  <div key={j} className="grid grid-cols-5 gap-3 items-center">
                    <PartProductSelect value={p.name} onPick={(prod)=> updatePart(i,j,{ name: prod.name, part_number: prod.part_number || prod.sku, cost: prod.cost_price, price: prod.price })} />
                    <Input label="Part #" value={p.part_number||''} onValueChange={(v)=> updatePart(i,j,{ part_number: v })} variant="bordered" classNames={{ inputWrapper:'h-12' }} isReadOnly={isViewMode} />
                    <Input label="Qty" type="number" value={String(p.quantity)} onValueChange={(v)=> updatePart(i,j,{ quantity: Number(v||0) })} variant="bordered" classNames={{ inputWrapper:'h-12' }} isReadOnly={isViewMode} />
                    <Input label="Cost" type="number" value={String(p.cost||0)} onValueChange={(v)=> updatePart(i,j,{ cost: Number(v||0) })} variant="bordered" classNames={{ inputWrapper:'h-12' }} isReadOnly={isViewMode} />
                    <div className="flex gap-2 items-center">
                    <Input label="Price" type="number" value={String(p.price)} onValueChange={(v)=> updatePart(i,j,{ price: Number(v||0) })} variant="bordered" classNames={{ inputWrapper:'h-12' }} isReadOnly={isViewMode} />
                    {!isViewMode && (<Button size="sm" color="danger" variant="flat" className="hover:bg-danger-100" onPress={()=> setItems(prev=> prev.map((svc, svcIdx)=> svcIdx===i? { ...svc, parts: svc.parts.filter((_,ppIdx)=> ppIdx!==j) } : svc))}>Delete</Button>)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4 mt-6">
        <h3 className="text-base font-semibold">Financials</h3>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <Input label="Shop Supplies" type="number" variant="bordered" classNames={{ inputWrapper:'h-14' }} value={String(shopSupplies)} onValueChange={(v)=> setShopSupplies(Number(v||0))} isReadOnly={isViewMode} />
            <div className="flex items-center justify-between"><h4 className="font-medium">Extra Misc</h4><Button size="sm" color="success" variant="flat" onPress={()=> !isViewMode && setExtras(prev=>[...prev,{ name:'', amount:0 }])} isDisabled={isViewMode}>Add Misc</Button></div>
            <div className="space-y-2">
              {extras.map((e,i)=> (
                <div key={i} className="grid grid-cols-3 gap-3 items-center">
                  <Input label="Name" value={e.name} onValueChange={(v)=> setExtras(prev=> prev.map((x,idx)=> idx===i?{...x,name:v}:x))} variant="bordered" classNames={{ inputWrapper:'h-12' }} isReadOnly={isViewMode} />
                  <Input label="Amount" type="number" value={String(e.amount)} onValueChange={(v)=> setExtras(prev=> prev.map((x,idx)=> idx===i?{...x,amount:Number(v||0)}:x))} variant="bordered" classNames={{ inputWrapper:'h-12' }} isReadOnly={isViewMode} />
                  {!isViewMode && (<div className="flex justify-end"><Button size="sm" color="danger" variant="flat" className="hover:bg-danger-100" onPress={()=> setExtras(prev=> prev.filter((_,idx)=> idx!==i))}>Delete</Button></div>)}
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
              <Select label="Tax Location" selectedKeys={[taxLocation]} onSelectionChange={(k)=> setTaxLocation(Array.from(k)[0] as 'EXEMPT'|'LOCAL')} variant="bordered" classNames={{ trigger:'h-12' }} isDisabled={isViewMode}>
                <SelectItem key="EXEMPT">Exempt</SelectItem>
                <SelectItem key="LOCAL">Local</SelectItem>
              </Select>
              <div className="text-sm text-default-500">{taxLocation==='EXEMPT'? '0% of $'+subtotal.toFixed(2): '7.5% of $'+subtotal.toFixed(2)}</div>
              <div className="flex justify-between font-semibold"><span>Total</span><span>${grandTotal.toFixed(2)}</span></div>
            </div>
          </Card>
        </div>
      </section>

      <div className="sticky bottom-0 mt-4 flex justify-end gap-2">
        <Button variant="flat" onPress={() => navigate('/shop/service')}>Back</Button>
        {!isViewMode && (<Button color="primary" onPress={() => updateMutation.mutate()} isLoading={updateMutation.isPending} isDisabled={!complaint || !estimateNumber}>Update Service</Button>)}
      </div>
    </CustomMainBody>
  )
} 