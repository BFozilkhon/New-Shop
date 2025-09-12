import { useEffect, useRef, useState } from 'react'
import CustomMainBody from '../../components/common/CustomMainBody'
import { Button, Input, Select, SelectItem, DatePicker } from '@heroui/react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { customersService } from '../../services/customersService'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { toast } from 'react-toastify'

const sections = [
  { key: 'main', label: 'Main' },
  { key: 'address', label: 'Address' },
  { key: 'social', label: 'Social networks' },
]

export default function CustomerEditPage() {
  const [active, setActive] = useState('main')
  const containerRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const [sp] = useSearchParams()
  const isViewMode = sp.get('mode') === 'view'
  const qc = useQueryClient()

  // State
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [middleName, setMiddleName] = useState('')
  const [dobISO, setDobISO] = useState('')
  const [gender, setGender] = useState<'male' | 'female' | ''>('')
  const [phone, setPhone] = useState('')
  const [primaryLanguage, setPrimaryLanguage] = useState<'UZ'|'RU'|'EN'>('RU')

  const [country, setCountry] = useState('UZ')
  const [city, setCity] = useState('')
  const [addr, setAddr] = useState('')
  const [postIndex, setPostIndex] = useState('')
  const [note, setNote] = useState('')

  const [email, setEmail] = useState('')
  const [telegram, setTelegram] = useState('')
  const [facebook, setFacebook] = useState('')
  const [instagram, setInstagram] = useState('')

  const { data: customer, isLoading } = useQuery({
    queryKey: ['customer', id],
    queryFn: () => customersService.get(id!),
    enabled: !!id,
  })

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!firstName || !phone) throw new Error('First name and phone are required')
      const dob = dobISO || undefined
      const payload: any = {
        first_name: firstName,
        last_name: lastName || undefined,
        middle_name: middleName || undefined,
        date_of_birth: dob,
        gender: gender || undefined,
        phone_number: phone,
        primary_language: primaryLanguage,
        address: { country, city, address: addr, post_index: postIndex, note },
        email: email || undefined,
        telegram: telegram || undefined,
        facebook: facebook || undefined,
        instagram: instagram || undefined,
      }
      return customersService.update(id!, payload)
    },
    onSuccess: () => { toast.success('Customer updated'); qc.invalidateQueries({ queryKey: ['customers'] }); qc.invalidateQueries({ queryKey: ['customer', id] }); navigate('/customers') },
    onError: (e: any) => toast.error(e?.message || 'Failed to update customer')
  } as any)

  useEffect(() => {
    if (customer) {
      setFirstName(customer.first_name)
      setLastName(customer.last_name || '')
      setMiddleName(customer.middle_name || '')
      if (customer.date_of_birth) { try { setDobISO(new Date(customer.date_of_birth as any).toISOString()) } catch {} }
      setGender((customer.gender as any) || '')
      setPhone(customer.phone_number)
      setPrimaryLanguage((customer.primary_language as any) || 'RU')
      setCountry(customer.address?.country || 'UZ')
      setCity(customer.address?.city || '')
      setAddr(customer.address?.address || '')
      setPostIndex(customer.address?.post_index || '')
      setNote(customer.address?.note || '')
      setEmail(customer.email || '')
      setTelegram(customer.telegram || '')
      setFacebook(customer.facebook || '')
      setInstagram(customer.instagram || '')
    }
  }, [customer])

  useEffect(() => {
    const onScroll = () => {
      if (!containerRef.current) return
      const anchors = Array.from(containerRef.current.querySelectorAll('[data-section]')) as HTMLElement[]
      const top = containerRef.current.getBoundingClientRect().top
      let current = active
      for (const el of anchors) { const rect = el.getBoundingClientRect(); if (rect.top - top <= 80) current = el.dataset.section || current }
      if (current !== active) setActive(current)
    }
    const el = containerRef.current
    el?.addEventListener('scroll', onScroll)
    return () => el?.removeEventListener('scroll', onScroll)
  }, [active])

  const handleSelect = (key: string) => {
    setActive(key)
    const el = document.getElementById(`sec-${key}`)
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  if (isLoading) return <div>Loading...</div>

  return (
    <CustomMainBody>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold">{isViewMode ? 'View Customer' : 'Edit Customer'}</h1>
        <Button color="primary" startContent={<ArrowLeftIcon className="w-4 h-4" />} onPress={() => navigate('/customers')}>Back</Button>
      </div>
      <div className="grid grid-cols-[220px_1fr] gap-6">
        <aside className="sticky top-4 self-start rounded-lg border border-default-200 p-2 h-fit">
          <ul className="space-y-1">
            {sections.map(s => (
              <li key={s.key}>
                <button className={`w-full text-left px-3 py-2 rounded-md hover:bg-default-100 ${active === s.key ? 'bg-default-100 font-medium' : ''}`} onClick={() => handleSelect(s.key)}>
                  {s.label}
                </button>
              </li>
            ))}
          </ul>
        </aside>
        <div className="relative">
          <div ref={containerRef} className="min-h-[400px] rounded-lg border border-default-200 p-4 max-h-[70vh] overflow-auto space-y-10">

            <section id="sec-main" data-section="main" className="space-y-4">
              <h3 className="text-base font-semibold">Main</h3>
              <div className="grid grid-cols-3 gap-6">
                <Input isRequired label="First name" variant="bordered" classNames={{ inputWrapper: 'h-14' }} value={firstName} onValueChange={setFirstName} isReadOnly={isViewMode} />
                <Input label="Last name" variant="bordered" classNames={{ inputWrapper: 'h-14' }} value={lastName} onValueChange={setLastName} isReadOnly={isViewMode} />
                <Input label="Middle name" variant="bordered" classNames={{ inputWrapper: 'h-14' }} value={middleName} onValueChange={setMiddleName} isReadOnly={isViewMode} />
              </div>
              <div className="grid grid-cols-2 gap-6">
                <DatePicker variant='bordered' aria-label="Date of birth" label="Date of birth" isDisabled={isViewMode} onChange={(d: any) => {
                  try { const s = typeof d?.toString === 'function' ? d.toString() : String(d); const iso = new Date(`${s}T00:00:00Z`).toISOString(); setDobISO(iso) } catch { setDobISO('') }
                }} />
                <Select label="Gender" placeholder="Select" variant="bordered" classNames={{ trigger: 'h-14' }} selectedKeys={[gender||'']} onSelectionChange={(keys) => setGender((Array.from(keys)[0] as any)||'')} isDisabled={isViewMode}>
                  <SelectItem key="male">Male</SelectItem>
                  <SelectItem key="female">Female</SelectItem>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <Input isRequired label="Phone number" variant="bordered" classNames={{ inputWrapper: 'h-14' }} value={phone} onValueChange={setPhone} isReadOnly={isViewMode} />
                <Select label="Primary language" variant="bordered" classNames={{ trigger: 'h-14' }} selectedKeys={[primaryLanguage]} onSelectionChange={(keys)=>setPrimaryLanguage(Array.from(keys)[0] as any)} isDisabled={isViewMode}>
                  <SelectItem key="UZ">UZ</SelectItem>
                  <SelectItem key="RU">RU</SelectItem>
                  <SelectItem key="EN">EN</SelectItem>
                </Select>
              </div>
            </section>

            <section id="sec-address" data-section="address" className="space-y-4">
              <h3 className="text-base font-semibold">Address</h3>
              <div className="grid grid-cols-2 gap-6">
                <Select label="Country" variant="bordered" classNames={{ trigger: 'h-14' }} selectedKeys={[country]} onSelectionChange={(keys)=>setCountry(Array.from(keys)[0] as string)} isDisabled={isViewMode}>
                  <SelectItem key="UZ">UZ</SelectItem>
                  <SelectItem key="KAZ">KAZ</SelectItem>
                  <SelectItem key="QIR">QIR</SelectItem>
                </Select>
                <Input label="City" variant="bordered" classNames={{ inputWrapper: 'h-14' }} value={city} onValueChange={setCity} isReadOnly={isViewMode} />
              </div>
              <Input label="Address" variant="bordered" classNames={{ inputWrapper: 'h-14' }} value={addr} onValueChange={setAddr} isReadOnly={isViewMode} />
              <div className="grid grid-cols-2 gap-6">
                <Input label="Post index" variant="bordered" classNames={{ inputWrapper: 'h-14' }} value={postIndex} onValueChange={setPostIndex} isReadOnly={isViewMode} />
                <Input label="Note" variant="bordered" classNames={{ inputWrapper: 'h-14' }} value={note} onValueChange={setNote} isReadOnly={isViewMode} />
              </div>
            </section>

            <section id="sec-social" data-section="social" className="space-y-4">
              <h3 className="text-base font-semibold">Social networks</h3>
              <div className="grid grid-cols-2 gap-6">
                <Input label="Email" variant="bordered" classNames={{ inputWrapper: 'h-14' }} value={email} onValueChange={setEmail} isReadOnly={isViewMode} />
                <Input label="Telegram" variant="bordered" classNames={{ inputWrapper: 'h-14' }} value={telegram} onValueChange={setTelegram} isReadOnly={isViewMode} />
                <Input label="Facebook" variant="bordered" classNames={{ inputWrapper: 'h-14' }} value={facebook} onValueChange={setFacebook} isReadOnly={isViewMode} />
                <Input label="Instagram" variant="bordered" classNames={{ inputWrapper: 'h-14' }} value={instagram} onValueChange={setInstagram} isReadOnly={isViewMode} />
              </div>
            </section>

          </div>
          <div className="sticky bottom-0 mt-4 flex justify-end gap-2">
            <Button variant="flat" onPress={() => navigate('/customers')}>Cancel</Button>
            {!isViewMode && (
              <Button color="primary" onPress={() => updateMutation.mutate()} isLoading={updateMutation.isPending}>Update Customer</Button>
            )}
          </div>
        </div>
      </div>
    </CustomMainBody>
  )
} 