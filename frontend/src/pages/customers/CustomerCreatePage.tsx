import { useEffect, useRef, useState } from 'react'
import CustomMainBody from '../../components/common/CustomMainBody'
import { Button, Input, Select, SelectItem, Textarea, DatePicker } from '@heroui/react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { customersService } from '../../services/customersService'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'

const sections = [
  { key: 'main', label: 'Main' },
  { key: 'address', label: 'Address' },
  { key: 'social', label: 'Social networks' },
]

export default function CustomerCreatePage() {
  const [active, setActive] = useState('main')
  const containerRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()
  const qc = useQueryClient()

  // Main
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [middleName, setMiddleName] = useState('')
  const [dobISO, setDobISO] = useState('')
  const [gender, setGender] = useState<'male' | 'female' | ''>('')
  const [phone, setPhone] = useState('')
  const [primaryLanguage, setPrimaryLanguage] = useState<'UZ'|'RU'|'EN'>('RU')

  // Address
  const [country, setCountry] = useState('UZ')
  const [city, setCity] = useState('')
  const [address, setAddress] = useState('')
  const [postIndex, setPostIndex] = useState('')
  const [note, setNote] = useState('')

  // Social
  const [email, setEmail] = useState('')
  const [telegram, setTelegram] = useState('')
  const [facebook, setFacebook] = useState('')
  const [instagram, setInstagram] = useState('')

  const createMutation = useMutation({
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
        address: { country, city, address, post_index: postIndex, note },
        email: email || undefined,
        telegram: telegram || undefined,
        facebook: facebook || undefined,
        instagram: instagram || undefined,
      }
      return customersService.create(payload)
    },
    onSuccess: () => { toast.success('Customer created'); qc.invalidateQueries({ queryKey: ['customers'] }); navigate('/customers') },
    onError: (e: any) => toast.error(e?.message || 'Failed to create customer')
  } as any)

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

  return (
    <CustomMainBody>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold">Create Customer</h1>
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
                <Input isRequired label="First name" placeholder="Enter first name" variant="bordered" classNames={{ inputWrapper: 'h-14' }} value={firstName} onValueChange={setFirstName} />
                <Input label="Last name" placeholder="Enter last name" variant="bordered" classNames={{ inputWrapper: 'h-14' }} value={lastName} onValueChange={setLastName} />
                <Input label="Middle name" placeholder="Enter middle name" variant="bordered" classNames={{ inputWrapper: 'h-14' }} value={middleName} onValueChange={setMiddleName} />
              </div>
              <div className="grid grid-cols-2 gap-6">
                <DatePicker variant='bordered' aria-label="Date of birth" label="Date of birth" onChange={(d: any) => {
                  try {
                    const s = typeof d?.toString === 'function' ? d.toString() : String(d)
                    const iso = new Date(`${s}T00:00:00Z`).toISOString()
                    setDobISO(iso)
                  } catch { setDobISO('') }
                }} />
                <Select label="Gender" placeholder="Select" variant="bordered" classNames={{ trigger: 'h-14' }} selectedKeys={[gender||'']} onSelectionChange={(keys) => setGender((Array.from(keys)[0] as any)||'')}>
                  <SelectItem key="male">Male</SelectItem>
                  <SelectItem key="female">Female</SelectItem>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <Input isRequired label="Phone number" placeholder="+998 XX XXX XX XX" variant="bordered" classNames={{ inputWrapper: 'h-14' }} value={phone} onValueChange={setPhone} />
                <Select label="Primary language" variant="bordered" classNames={{ trigger: 'h-14' }} selectedKeys={[primaryLanguage]} onSelectionChange={(keys)=>setPrimaryLanguage(Array.from(keys)[0] as any)}>
                  <SelectItem key="UZ">UZ</SelectItem>
                  <SelectItem key="RU">RU</SelectItem>
                  <SelectItem key="EN">EN</SelectItem>
                </Select>
              </div>
            </section>

            <section id="sec-address" data-section="address" className="space-y-4">
              <h3 className="text-base font-semibold">Address</h3>
              <div className="grid grid-cols-2 gap-6">
                <Select label="Country" variant="bordered" classNames={{ trigger: 'h-14' }} selectedKeys={[country]} onSelectionChange={(keys)=>setCountry(Array.from(keys)[0] as string)}>
                  <SelectItem key="UZ">UZ</SelectItem>
                  <SelectItem key="KAZ">KAZ</SelectItem>
                  <SelectItem key="QIR">QIR</SelectItem>
                </Select>
                <Input label="City" placeholder="Enter city" variant="bordered" classNames={{ inputWrapper: 'h-14' }} value={city} onValueChange={setCity} />
              </div>
              <Input label="Address" placeholder="Enter address" variant="bordered" classNames={{ inputWrapper: 'h-14' }} value={address} onValueChange={setAddress} />
              <div className="grid grid-cols-2 gap-6">
                <Input label="Post index" placeholder="Enter post index" variant="bordered" classNames={{ inputWrapper: 'h-14' }} value={postIndex} onValueChange={setPostIndex} />
                <Input label="Note" placeholder="Enter note" variant="bordered" classNames={{ inputWrapper: 'h-14' }} value={note} onValueChange={setNote} />
              </div>
            </section>

            <section id="sec-social" data-section="social" className="space-y-4">
              <h3 className="text-base font-semibold">Social networks</h3>
              <div className="grid grid-cols-2 gap-6">
                <Input label="Email" placeholder="Enter email" variant="bordered" classNames={{ inputWrapper: 'h-14' }} value={email} onValueChange={setEmail} />
                <Input label="Telegram" placeholder="Nickname or phone number" variant="bordered" classNames={{ inputWrapper: 'h-14' }} value={telegram} onValueChange={setTelegram} />
                <Input label="Facebook" placeholder="Nickname or link to profile" variant="bordered" classNames={{ inputWrapper: 'h-14' }} value={facebook} onValueChange={setFacebook} />
                <Input label="Instagram" placeholder="Enter nickname" variant="bordered" classNames={{ inputWrapper: 'h-14' }} value={instagram} onValueChange={setInstagram} />
              </div>
            </section>

          </div>
          <div className="sticky bottom-0 mt-4 flex justify-end gap-2">
            <Button variant="flat" onPress={() => navigate('/customers')}>Cancel</Button>
            <Button color="primary" onPress={() => createMutation.mutate()} isLoading={createMutation.isPending}>Create Customer</Button>
          </div>
        </div>
      </div>
    </CustomMainBody>
  )
} 