import { useEffect, useMemo, useState } from 'react'
import { Modal, ModalContent, Button, Tabs, Tab, Input, Spinner } from '@heroui/react'
import { Link } from 'react-router-dom'
import { 
  UserIcon,
  CurrencyDollarIcon,
  CalendarIcon,
  XMarkIcon,
  PencilSquareIcon,
  TrashIcon,
  CogIcon,
  BuildingOfficeIcon,
  PhoneIcon,
  EnvelopeIcon,
  PlusIcon,
  CubeIcon,
} from '@heroicons/react/24/outline'
import { productsService } from '../../../services/productsService'
import { companiesService } from '../../../services/companiesService'

export default function LeadDrawer({ isOpen, onOpenChange, lead, stages }: { isOpen: boolean; onOpenChange: (v:boolean)=>void; lead: any; stages: any[] }) {
  const [tab, setTab] = useState<'overview'|'activity'>('overview')
  const [isAnimating, setIsAnimating] = useState(false)

  // Custom fields (local demo)
  const [customFields, setCustomFields] = useState<any[]>([])
  const [customData, setCustomData] = useState<Record<string, any>>({})

  // Customer search
  const [showCustomerSearch, setShowCustomerSearch] = useState(false)
  const [customerTerm, setCustomerTerm] = useState('')
  const [customers, setCustomers] = useState<any[]>([])
  const [loadingCustomers, setLoadingCustomers] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null)

  // Product search
  const [showProductSearch, setShowProductSearch] = useState(false)
  const [productTerm, setProductTerm] = useState('')
  const [products, setProducts] = useState<any[]>([])
  const [loadingProducts, setLoadingProducts] = useState(false)
  const [dealProducts, setDealProducts] = useState<any[]>([])

  useEffect(()=>{ if (isOpen) { setTab('overview'); setIsAnimating(true) } }, [isOpen, lead])

  useEffect(()=>{
    if (!isOpen || !lead) return
    try {
      const saved = JSON.parse(localStorage.getItem('leadCustomFields') || '[]')
      setCustomFields(Array.isArray(saved) ? saved.filter((f:any)=>f?.visible) : [])
      const data = JSON.parse(localStorage.getItem(`leadCustomData_${lead.id}`) || '{}')
      setCustomData(data || {})
    } catch { setCustomFields([]); setCustomData({}) }
  }, [isOpen, lead?.id])

  // Initialize selected customer from lead
  useEffect(()=>{
    if (!isOpen || !lead) return
    if (lead.customer) setSelectedCustomer(lead.customer)
    else if (lead.customer_name) setSelectedCustomer({ name: lead.customer_name })
    else setSelectedCustomer(null)
  }, [isOpen, lead])

  const stageObj = useMemo(()=> stages.find((s:any)=> (s.key === (lead?.stage || lead?.status))) , [stages, lead])

  const handleDelete = () => { onOpenChange(false) }

  const handleCustomFieldChange = (name:string, value:any) => {
    setCustomData(prev => ({ ...prev, [name]: value }))
    if (lead?.id) {
      const next = { ...customData, [name]: value }
      localStorage.setItem(`leadCustomData_${lead.id}`, JSON.stringify(next))
    }
  }

  // Customer search
  useEffect(()=>{
    let t:any
    if (showCustomerSearch && customerTerm.trim()) {
      setLoadingCustomers(true)
      t = setTimeout(async ()=>{
        try {
          const res = await companiesService.list({ page:1, limit:10, search: customerTerm })
          setCustomers(res.items || [])
        } catch { setCustomers([]) } finally { setLoadingCustomers(false) }
      }, 300)
    } else {
      setCustomers([])
    }
    return ()=> t && clearTimeout(t)
  }, [customerTerm, showCustomerSearch])

  const selectCustomer = (c:any) => { setSelectedCustomer(c); setShowCustomerSearch(false); setCustomerTerm('') }

  // Product search
  useEffect(()=>{
    let t:any
    if (showProductSearch && productTerm.trim()) {
      setLoadingProducts(true)
      t = setTimeout(async ()=>{
        try {
          const res = await productsService.list({ page:1, limit:10, search: productTerm })
          setProducts(res.items || [])
        } catch { setProducts([]) } finally { setLoadingProducts(false) }
      }, 300)
    } else {
      setProducts([])
    }
    return ()=> t && clearTimeout(t)
  }, [productTerm, showProductSearch])

  const addProduct = (p:any) => {
    if (dealProducts.find((x:any)=>x.id===p.id)) return
    setDealProducts(prev => [...prev, { id: p.id, name: p.name, sku: p.sku, price: p.price || 0, quantity: 1, totalPrice: p.price || 0 }])
    setShowProductSearch(false); setProductTerm(''); setProducts([])
  }
  const changeQty = (id:string, qty:number) => {
    setDealProducts(prev => prev.map(p => p.id===id ? { ...p, quantity: Math.max(1, qty), totalPrice: (p.price||0)*Math.max(1, qty) } : p))
  }
  const removeProduct = (id:string) => setDealProducts(prev => prev.filter(p => p.id!==id))

  if (!lead) return null

  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="full" backdrop="opaque" classNames={{ wrapper: 'z-[1200]' }}>
      <ModalContent>
        {(close)=> (
          <div className="flex h-[92vh]">
            {/* Left panel */}
            <div className="w-96 border-r border-default-200 flex flex-col">
              <div className="flex items-center justify-between p-4 border-b border-default-200 bg-content2">
                <div>
                  <div className="text-sm text-default-600">Lead</div>
                  <div className="text-base font-semibold text-default-900 line-clamp-1">{lead.title}</div>
                </div>
                <button onClick={()=>close()} className="p-2 text-default-400 hover:text-default-600"><XMarkIcon className="w-5 h-5" /></button>
              </div>
              <div className="p-4 space-y-4 overflow-y-auto">
                <div className="flex items-center justify-between"><div className="flex items-center gap-2 text-default-700"><CurrencyDollarIcon className="w-4 h-4" />Amount</div><div className="font-medium">{Number(lead.amount||lead.value||lead.price||0).toLocaleString()} {lead.currency ? String(lead.currency).toUpperCase() : ''}</div></div>
                <div className="flex items-center justify-between"><div className="flex items-center gap-2 text-default-700"><CalendarIcon className="w-4 h-4" />Expected close</div><div className="text-default-600">{(lead.expected_close_date||'').slice(0,10) || '-'}</div></div>
                <div className="flex items-center justify-between"><div className="flex items-center gap-2 text-default-700">Priority</div><div className="text-default-600 capitalize">{lead.priority || (typeof lead.priority_int === 'number' ? String(lead.priority_int) : '-') }</div></div>
                <div className="flex items-center justify-between"><div className="flex items-center gap-2 text-default-700">Source</div><div className="text-default-600">{lead.source || '-'}</div></div>
                <div className="flex items-center justify-between"><div className="flex items-center gap-2 text-default-700">Closing date</div><div className="text-default-600">{(lead.closing_date||'').slice(0,10) || '-'}</div></div>
                <div className="flex items-center justify-between"><div className="flex items-center gap-2 text-default-700"><UserIcon className="w-4 h-4" />Company</div><div className="text-default-600">{selectedCustomer?.name || lead.customer_name || lead.company || '-'}</div></div>
                {lead.description && (<div><div className="text-default-700 mb-1">Description</div><div className="text-default-600 text-sm whitespace-pre-wrap">{lead.description}</div></div>)}
                {Array.isArray(lead.tags) && lead.tags.length > 0 && (
                  <div>
                    <div className="text-default-700 mb-1">Tags</div>
                    <div className="flex gap-1 flex-wrap">
                      {lead.tags.map((t:string) => (<span key={t} className="text-xs px-2 py-0.5 rounded bg-content2 border">{t}</span>))}
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-2 pt-2"><Button variant="bordered" startContent={<PencilSquareIcon className="w-4 h-4" />}>Edit</Button><Button variant="bordered" color="danger" startContent={<TrashIcon className="w-4 h-4" />} onPress={handleDelete}>Delete</Button></div>
              </div>
            </div>
            {/* Right panel */}
            <div className="flex-1 flex flex-col">
              <div className="p-3 border-b border-default-200"><Tabs selectedKey={tab} onSelectionChange={(k)=>setTab(k as any)} aria-label="Lead tabs"><Tab key="overview" title="Overview" /><Tab key="activity" title="Activity" /></Tabs></div>
              <div className="flex-1 overflow-y-auto p-4">
                {tab === 'overview' ? (
                  <div className="grid grid-cols-3 gap-4">
                    {/* Stage/Owner */}
                    <div className="col-span-2 space-y-4">
                      <div className="bg-content2 rounded-lg p-3"><div className="text-sm text-default-600">Stage</div><div className="font-medium">{stageObj?.title || lead.stage || '-'}</div></div>
                      <div className="bg-content2 rounded-lg p-3"><div className="text-sm text-default-600">Owner</div><div className="font-medium">-</div></div>

                      {/* Products */}
                      <div className="bg-content2 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2"><div className="font-medium flex items-center gap-2"><CubeIcon className="w-4 h-4 text-default-400" />Products</div><Button size="sm" variant="bordered" onPress={()=>setShowProductSearch(true)} startContent={<PlusIcon className="w-4 h-4" />}>Add</Button></div>
                        {dealProducts.length === 0 ? (
                          <div className="text-default-500 text-sm py-6 text-center">No products</div>
                        ) : (
                          <div className="space-y-2">
                            {dealProducts.map(p => (
                              <div key={p.id} className="flex items-center justify-between p-2 rounded bg-background border">
                                <div className="min-w-0"><div className="text-sm font-medium truncate">{p.name}</div><div className="text-xs text-default-500">{p.sku}</div></div>
                                <div className="flex items-center gap-2 ml-3">
                                  <div className="flex items-center gap-1"><Button size="sm" variant="flat" onPress={()=>changeQty(p.id, p.quantity-1)}>-</Button><span className="w-8 text-center text-sm font-medium">{p.quantity}</span><Button size="sm" variant="flat" onPress={()=>changeQty(p.id, p.quantity+1)}>+</Button></div>
                                  <div className="text-sm font-medium">{Number(p.totalPrice||0).toLocaleString()}</div>
                                  <Button size="sm" color="danger" variant="light" onPress={()=>removeProduct(p.id)}><TrashIcon className="w-4 h-4" /></Button>
                                </div>
                              </div>
                            ))}
                            <div className="pt-2 border-t mt-2 flex justify-between text-sm font-semibold"><span>Total</span><span>{Number(dealProducts.reduce((s,p)=> s + (p.totalPrice||0), 0)).toLocaleString()}</span></div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Side info */}
                    <div className="space-y-4">
                      <div className="bg-content2 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2"><div className="text-sm text-default-600">Customer</div><Button size="sm" variant="bordered" onPress={()=>setShowCustomerSearch(true)}>Select</Button></div>
                        {!selectedCustomer ? (<div className="text-default-500 text-sm">No customer selected</div>) : (
                          <div className="space-y-2 text-sm">
                            <div className="flex items-center gap-2"><BuildingOfficeIcon className="w-4 h-4 text-default-400" /><span className="font-medium">{selectedCustomer.name}</span></div>
                            <div className="flex items-center gap-2"><UserIcon className="w-4 h-4 text-default-400" /><span>{selectedCustomer.contact_person || selectedCustomer.name || '-'}</span></div>
                            <div className="flex items-center gap-2"><PhoneIcon className="w-4 h-4 text-default-400" /><span>{selectedCustomer.phone || '-'}</span></div>
                            <div className="flex items-center gap-2"><EnvelopeIcon className="w-4 h-4 text-default-400" /><span>{selectedCustomer.email || '-'}</span></div>
                          </div>
                        )}
                      </div>

                      {/* Custom fields demo */}
                      <div className="bg-content2 rounded-lg p-3">
                        <div className="text-sm text-default-600 mb-2 flex items-center gap-2"><CogIcon className="w-4 h-4" />Custom fields</div>
                        {customFields.length === 0 ? (<div className="text-default-500 text-sm">No custom fields</div>) : (
                          <div className="space-y-2 text-sm">
                            {customFields.map((f:any)=> (
                              <div key={f.id} className="flex items-center justify-between border rounded px-2 py-1 bg-background">
                                <span>{f.label || f.name}</span>
                                <Input size="sm" variant="bordered" className="w-40" value={String(customData[f.name] || '')} onValueChange={(v)=>handleCustomFieldChange(f.name, v)} />
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Quick actions */}
                      <div className="space-y-2">
                        <Link to={`/crm/leads/${lead.id || ''}/view`} onClick={()=>onOpenChange(false)} className="block text-center px-4 py-2 bg-primary text-primary-foreground rounded">Open fully</Link>
                        <div className="grid grid-cols-2 gap-2">
                          <Button variant="bordered" startContent={<PencilSquareIcon className="w-4 h-4" />}>Edit</Button>
                          <Button variant="bordered" color="danger" startContent={<TrashIcon className="w-4 h-4" />} onPress={handleDelete}>Delete</Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-default-600">No activity yet.</div>
                )}
              </div>
            </div>
          </div>
        )}
      </ModalContent>

      {/* Customer Search Modal */}
      {showCustomerSearch && (
        <div className="fixed inset-0 z-[1300] bg-black/50 flex items-center justify-center">
          <div className="bg-background rounded-lg shadow p-4 w-96 max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between mb-2"><div className="font-medium">Search customers</div><button onClick={()=>setShowCustomerSearch(false)}><XMarkIcon className="w-5 h-5 text-default-400" /></button></div>
            <Input placeholder="Type to search..." value={customerTerm} onValueChange={setCustomerTerm} startContent={<UserIcon className="w-4 h-4 text-default-400" />} className="mb-2" />
            <div className="max-h-80 overflow-y-auto">
              {loadingCustomers ? (<div className="py-8 flex items-center justify-center"><Spinner size="sm" /></div>) : (
                customers.map(c => (
                  <div key={c.id} className="p-2 hover:bg-content2 cursor-pointer rounded flex items-center justify-between" onClick={()=>selectCustomer({ id:c.id, name:c.title, email:c.email })}>
                    <div className="min-w-0"><div className="text-sm font-medium truncate">{c.title}</div><div className="text-xs text-default-500">{c.email}</div></div>
                    <Button size="sm" variant="flat">Select</Button>
                  </div>
                ))
              )}
              {!loadingCustomers && customers.length === 0 && customerTerm && (<div className="text-center text-default-500 text-sm py-6">No results</div>)}
            </div>
          </div>
        </div>
      )}

      {/* Product Search Modal */}
      {showProductSearch && (
        <div className="fixed inset-0 z-[1300] bg-black/50 flex items-center justify-center">
          <div className="bg-background rounded-lg shadow p-4 w-96 max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between mb-2"><div className="font-medium">Search products</div><button onClick={()=>setShowProductSearch(false)}><XMarkIcon className="w-5 h-5 text-default-400" /></button></div>
            <Input placeholder="Type to search..." value={productTerm} onValueChange={setProductTerm} startContent={<CubeIcon className="w-4 h-4 text-default-400" />} className="mb-2" />
            <div className="max-h-80 overflow-y-auto">
              {loadingProducts ? (<div className="py-8 flex items-center justify-center"><Spinner size="sm" /></div>) : (
                products.map(p => (
                  <div key={p.id} className="p-2 hover:bg-content2 cursor-pointer rounded flex items-center justify-between" onClick={()=>addProduct({ id:p.id, name:p.name, sku:p.sku, price:p.price })}>
                    <div className="min-w-0"><div className="text-sm font-medium truncate">{p.name}</div><div className="text-xs text-default-500">{p.sku}</div></div>
                    <Button size="sm" variant="flat">Add</Button>
                  </div>
                ))
              )}
              {!loadingProducts && products.length === 0 && productTerm && (<div className="text-center text-default-500 text-sm py-6">No results</div>)}
            </div>
          </div>
        </div>
      )}
    </Modal>
  )
} 