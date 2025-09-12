import { useEffect, useMemo, useState } from 'react'
import { Tabs, Tab, Button, Input, Select, SelectItem, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from '@heroui/react'
import { useParams, useSearchParams } from 'react-router-dom'
import CustomMainBody from '../../../../components/common/CustomMainBody'
import CustomTable, { type CustomColumn } from '../../../../components/common/CustomTable'
import CustomModal from '../../../../components/common/CustomModal'
import ConfirmModal from '../../../../components/common/ConfirmModal'
import { shopCustomersService, type ShopUnit } from '../../../../services/shopCustomersService'
import { US_STATES } from '../../../../utils/usStates'
import { EllipsisVerticalIcon, PencilSquareIcon, TrashIcon } from '@heroicons/react/24/outline'
import { toast } from 'react-toastify'
import ServicesTab from './ServicesTab'
import DetailsTab from './DetailsTab'

const UNIT_TYPES = [
  'Aerial', 'Ambulance', 'Brush Truck', 'Bus', 'Equipment', 'Pumper Engine', 'Tanker', 'Tractor', 'Tractor / Semi / Day Cab', 'Tractor / Semi / Sleeper', 'Trailer', 'Truck'
]

export default function ShopCustomerParamsPage() {
  const { id } = useParams<{ id: string }>()
  const [sp, setSp] = useSearchParams()
  const tab = sp.get('tab') || 'units'
  const handleTabChange = (key: string) => setSp({ tab: key })

  return (
    <CustomMainBody>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold">Customer Details</h1>
      </div>
      <Tabs aria-label="Shop Customer Params" color="primary" variant="bordered" selectedKey={tab} onSelectionChange={(k)=>handleTabChange(k as string)} className="w-full" classNames={{ tabList: 'w-full h-14', tab: 'h-12' }}>
        <Tab key="units" title={<div className="flex items-center space-x-2"><span>Units</span></div>}>
          <div className="mt-4">{id ? <UnitsTab customerId={id} /> : null}</div>
        </Tab>
        <Tab key="services" title={<div className="flex items-center space-x-2"><span>Services</span></div>}>
          <div className="mt-4">{id ? <ServicesTab customerId={id} /> : null}</div>
        </Tab>
        <Tab key="contacts" title={<div className="flex items-center space-x-2"><span>Contacts</span></div>}>
          <div className="mt-4">{id ? <ContactsTab customerId={id} /> : null}</div>
        </Tab>
        <Tab key="details" title={<div className="flex items-center space-x-2"><span>Details</span></div>}>
          <div className="mt-4">{id ? <DetailsTab customerId={id} /> : null}</div>
        </Tab>
      </Tabs>
    </CustomMainBody>
  )
}

function UnitsTab({ customerId }: { customerId: string }) {
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState('')
  const [items, setItems] = useState<ShopUnit[]>([])
  const [open, setOpen] = useState(false)
  const [editId, setEditId] = useState<string|undefined>(undefined)
  const [confirm, setConfirm] = useState<{open:boolean; id?: string}>({open:false})

  const load = async () => {
    try {
      const res = await shopCustomersService.listUnits({ page, limit, search, customer_id: customerId })
      setItems(res.items || [])
      setTotal(res.total || 0)
    } catch (e:any) {
      toast.error(e?.response?.data?.error?.message || 'Failed to load units')
    }
  }
  useEffect(()=>{ load() }, [page, limit, search, customerId])

  const rows = useMemo(()=> (items||[]).map(u=>({
    id: u.id,
    unit_number: u.unit_number,
    type: u.type,
    vin: u.vin,
    year: u.year || '-',
    make: u.make || '-',
    model: u.model || '-',
    plate: u.license_plate || '-',
  })), [items])

  const columns: CustomColumn[] = [
    { uid: 'unit_number', name: 'Unit #' },
    { uid: 'type', name: 'Type' },
    { uid: 'vin', name: 'VIN' },
    { uid: 'year', name: 'Year' },
    { uid: 'make', name: 'Make' },
    { uid: 'model', name: 'Model' },
    { uid: 'plate', name: 'License Plate' },
    { uid: 'actions', name: 'Actions' },
  ]

  const renderCell = (item: any, key: string) => {
    switch (key) {
      case 'actions':
        return (
          <Dropdown placement="bottom-end">
            <DropdownTrigger>
              <Button isIconOnly variant="light" size="sm" aria-label="actions">
                <EllipsisVerticalIcon className="w-5 h-5" />
              </Button>
            </DropdownTrigger>
            <DropdownMenu aria-label="Actions">
              <DropdownItem key="edit" startContent={<PencilSquareIcon className="w-4 h-4" />} onPress={()=>{ setEditId(item.id); setOpen(true) }}>Edit</DropdownItem>
              <DropdownItem key="delete" className="text-danger" color="danger" startContent={<TrashIcon className="w-4 h-4" />} onPress={()=> setConfirm({open:true,id:item.id})}>Delete</DropdownItem>
            </DropdownMenu>
          </Dropdown>
        )
      default:
        return item[key]
    }
  }

  const handleConfirmDelete = async () => {
    if (!confirm.id) return
    try { await shopCustomersService.removeUnit(confirm.id); toast.success('Unit deleted') }
    catch(e:any){ toast.error(e?.response?.data?.error?.message||'Delete failed') }
    finally { setConfirm({open:false}); load() }
  }

  return (
    <>
      <CustomTable
        columns={columns}
        items={rows as any}
        total={total}
        page={page}
        limit={limit}
        onPageChange={setPage}
        onLimitChange={setLimit}
        onCreate={()=>{ setEditId(undefined); setOpen(true) }}
        createLabel="Create Unit"
        searchValue={search}
        onSearchChange={setSearch}
        renderCell={renderCell}
      />
      <CreateOrEditUnitModal open={open} setOpen={setOpen} customerId={customerId} unitId={editId} onChanged={()=>{ setOpen(false); load() }} />
      <ConfirmModal isOpen={confirm.open} title="Delete Unit?" description="This action cannot be undone." confirmText="Delete" confirmColor="danger" onConfirm={handleConfirmDelete} onClose={()=> setConfirm({open:false})} />
    </>
  )
}

function CreateOrEditUnitModal({ open, setOpen, customerId, unitId, onChanged }: { open: boolean; setOpen: (v:boolean)=>void; customerId: string; unitId?: string; onChanged: ()=>void }) {
  const isEdit = !!unitId
  const [saving, setSaving] = useState(false)
  const [type, setType] = useState('')
  const [vin, setVin] = useState('')
  const [year, setYear] = useState('')
  const [make, setMake] = useState('')
  const [model, setModel] = useState('')
  const [unitNumber, setUnitNumber] = useState('')
  const [unitNickname, setUnitNickname] = useState('')
  const [fleet, setFleet] = useState('')
  const [licensePlateState, setLicensePlateState] = useState('')
  const [licensePlate, setLicensePlate] = useState('')

  useEffect(()=>{
    if (!open) return
    if (!isEdit || !unitId) { setType(''); setVin(''); setYear(''); setMake(''); setModel(''); setUnitNumber(''); setUnitNickname(''); setFleet(''); setLicensePlateState(''); setLicensePlate(''); return }
    ;(async()=>{
      try {
        const it = await shopCustomersService.getUnit(unitId)
        setType(it.type||''); setVin(it.vin||''); setYear(it.year||''); setMake(it.make||''); setModel(it.model||''); setUnitNumber(it.unit_number||''); setUnitNickname(it.unit_nickname||''); setFleet(it.fleet||''); setLicensePlateState(it.license_plate_state||''); setLicensePlate(it.license_plate||'')
      } catch(e:any){ toast.error(e?.response?.data?.error?.message || 'Failed to load unit') }
    })()
  }, [open, isEdit, unitId])

  const submit = async () => {
    if (!type || !vin || !unitNumber) return
    setSaving(true)
    try {
      if (isEdit && unitId) {
        await shopCustomersService.updateUnit(unitId, { type, vin, year, make, model, unit_number: unitNumber, unit_nickname: unitNickname, fleet, license_plate_state: licensePlateState, license_plate: licensePlate })
        toast.success('Unit updated')
      } else {
        await shopCustomersService.createUnit({ customer_id: customerId, type, vin, year, make, model, unit_number: unitNumber, unit_nickname: unitNickname, fleet, license_plate_state: licensePlateState, license_plate: licensePlate })
        toast.success('Unit created')
      }
      onChanged()
    } catch (e:any) {
      toast.error(e?.response?.data?.error?.message || 'Save failed')
    } finally { setSaving(false) }
  }

  return (
    <CustomModal title={isEdit? 'Edit Unit' : 'Create Unit'} isOpen={open} onOpenChange={setOpen} onSubmit={submit} submitLabel={saving? 'Saving...' : (isEdit? 'Save' : 'Create')} isSubmitting={saving}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Select label="Type of unit *" selectedKeys={type? [type] : []} onSelectionChange={(k)=> setType(Array.from(k as Set<string>)[0]||'')} items={UNIT_TYPES.map(k=>({ key: k, label: k }))} variant="bordered">
          {(it:any)=> <SelectItem key={it.key}>{it.label}</SelectItem>}
        </Select>
        <Input label="VIN *" value={vin} onValueChange={setVin} variant="bordered" classNames={{ inputWrapper: 'h-14' }} />
        <Input label="Year" value={year} onValueChange={setYear} variant="bordered" classNames={{ inputWrapper: 'h-14' }} />
        <Input label="Make" value={make} onValueChange={setMake} variant="bordered" classNames={{ inputWrapper: 'h-14' }} />
        <Input label="Model" value={model} onValueChange={setModel} variant="bordered" classNames={{ inputWrapper: 'h-14' }} />
        <Input label="Unit Number *" value={unitNumber} onValueChange={setUnitNumber} variant="bordered" classNames={{ inputWrapper: 'h-14' }} />
        <Input label="Unit Nickname" value={unitNickname} onValueChange={setUnitNickname} variant="bordered" classNames={{ inputWrapper: 'h-14' }} />
        <Input label="Fleet #" value={fleet} onValueChange={setFleet} variant="bordered" classNames={{ inputWrapper: 'h-14' }} />
        <Select label="License Plate State" selectedKeys={licensePlateState? [licensePlateState] : []} onSelectionChange={(k)=> setLicensePlateState(Array.from(k as Set<string>)[0]||'')} items={US_STATES.map(s=>({ key: s.code, label: `${s.code} — ${s.name}` }))} variant="bordered">
          {(it:any)=> <SelectItem key={it.key}>{it.label}</SelectItem>}
        </Select>
        <Input label="License Plate" value={licensePlate} onValueChange={setLicensePlate} variant="bordered" classNames={{ inputWrapper: 'h-14' }} />
      </div>
    </CustomModal>
  )
}

function ContactsTab({ customerId }: { customerId: string }) {
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState('')
  const [items, setItems] = useState<any[]>([])
  const [open, setOpen] = useState(false)
  const [editId, setEditId] = useState<string|undefined>(undefined)
  const [confirm, setConfirm] = useState<{open:boolean; id?: string}>({open:false})

  const load = async () => {
    try {
      const res = await shopCustomersService.listContacts({ page, limit, search, customer_id: customerId })
      setItems(res.items || [])
      setTotal(res.total || 0)
    } catch (e:any) { toast.error(e?.response?.data?.error?.message || 'Failed to load contacts') }
  }
  useEffect(()=>{ load() }, [page, limit, search, customerId])

  const rows = useMemo(()=> (items||[]).map(c=>({ id: c.id, first_name: c.first_name, last_name: c.last_name || '-', email: c.email || '-', phone: c.phone || '-', cell_phone: c.cell_phone || '-' })), [items])
  const columns: CustomColumn[] = [
    { uid: 'first_name', name: 'First Name' },
    { uid: 'last_name', name: 'Last Name' },
    { uid: 'email', name: 'Email' },
    { uid: 'phone', name: 'Phone' },
    { uid: 'cell_phone', name: 'Cell Phone' },
    { uid: 'actions', name: 'Actions' },
  ]
  const renderCell = (item: any, key: string) => {
    switch (key) {
      case 'actions':
        return (
          <Dropdown placement="bottom-end">
            <DropdownTrigger>
              <Button isIconOnly variant="light" size="sm" aria-label="actions">
                <EllipsisVerticalIcon className="w-5 h-5" />
              </Button>
            </DropdownTrigger>
            <DropdownMenu aria-label="Actions">
              <DropdownItem key="edit" startContent={<PencilSquareIcon className="w-4 h-4" />} onPress={()=>{ setEditId(item.id); setOpen(true) }}>Edit</DropdownItem>
              <DropdownItem key="delete" className="text-danger" color="danger" startContent={<TrashIcon className="w-4 h-4" />} onPress={()=> setConfirm({open:true,id:item.id})}>Delete</DropdownItem>
            </DropdownMenu>
          </Dropdown>
        )
      default:
        return item[key]
    }
  }
  const handleConfirmDelete = async () => {
    if (!confirm.id) return
    try { await shopCustomersService.removeContact(confirm.id); toast.success('Contact deleted') }
    catch(e:any){ toast.error(e?.response?.data?.error?.message||'Delete failed') }
    finally { setConfirm({open:false}); load() }
  }

  return (
    <>
      <CustomTable
        columns={columns}
        items={rows as any}
        total={total}
        page={page}
        limit={limit}
        onPageChange={setPage}
        onLimitChange={setLimit}
        onCreate={()=>{ setEditId(undefined); setOpen(true) }}
        createLabel="Create Contact"
        searchValue={search}
        onSearchChange={setSearch}
        renderCell={renderCell}
      />
      <CreateOrEditContactModal open={open} setOpen={setOpen} customerId={customerId} contactId={editId} onChanged={()=>{ setOpen(false); load() }} />
      <ConfirmModal isOpen={confirm.open} title="Delete Contact?" description="This action cannot be undone." confirmText="Delete" confirmColor="danger" onConfirm={handleConfirmDelete} onClose={()=> setConfirm({open:false})} />
    </>
  )
}

function CreateOrEditContactModal({ open, setOpen, customerId, contactId, onChanged }: { open: boolean; setOpen: (v:boolean)=>void; customerId: string; contactId?: string; onChanged: ()=>void }) {
  const isEdit = !!contactId
  const [saving, setSaving] = useState(false)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [cellPhone, setCellPhone] = useState('')

  useEffect(()=>{
    if (!open) return
    if (!isEdit || !contactId) { setFirstName(''); setLastName(''); setEmail(''); setPhone(''); setCellPhone(''); return }
    ;(async()=>{
      try {
        const it = await shopCustomersService.getContact(contactId)
        setFirstName(it.first_name||''); setLastName(it.last_name||''); setEmail(it.email||''); setPhone(it.phone||''); setCellPhone(it.cell_phone||'')
      } catch(e:any){ toast.error(e?.response?.data?.error?.message || 'Failed to load contact') }
    })()
  }, [open, isEdit, contactId])

  const submit = async () => {
    if (!firstName) return
    setSaving(true)
    try {
      if (isEdit && contactId) {
        await shopCustomersService.updateContact(contactId, { first_name: firstName, last_name: lastName, email, phone, cell_phone: cellPhone })
        toast.success('Contact updated')
      } else {
        await shopCustomersService.createContact({ customer_id: customerId, first_name: firstName, last_name: lastName, email, phone, cell_phone: cellPhone })
        toast.success('Contact created')
      }
      onChanged()
    } catch (e:any) {
      toast.error(e?.response?.data?.error?.message || 'Save failed')
    } finally { setSaving(false) }
  }

  return (
    <CustomModal title={isEdit? 'Edit Contact' : 'Create Contact'} isOpen={open} onOpenChange={setOpen} onSubmit={submit} submitLabel={saving? 'Saving...' : (isEdit? 'Save' : 'Create')} isSubmitting={saving}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input isRequired label="First Name" value={firstName} onValueChange={setFirstName} variant="bordered" classNames={{ inputWrapper:'h-14' }} />
        <Input label="Last Name" value={lastName} onValueChange={setLastName} variant="bordered" classNames={{ inputWrapper:'h-14' }} />
        <Input label="Email" value={email} onValueChange={setEmail} type="email" variant="bordered" classNames={{ inputWrapper:'h-14' }} />
        <Input label="Phone" value={phone} onValueChange={setPhone} variant="bordered" classNames={{ inputWrapper:'h-14' }} />
        <Input label="Cell Phone" value={cellPhone} onValueChange={setCellPhone} variant="bordered" classNames={{ inputWrapper:'h-14' }} />
      </div>
    </CustomModal>
  )
} 