import { useEffect, useRef, useState } from 'react'
import CustomMainBody from '../../../components/common/CustomMainBody'
import { Button, Input, Select, SelectItem } from '@heroui/react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { shopCustomersService } from '../../../services/shopCustomersService'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { LABOR_RATES, formatLaborRateLabel } from '../../../utils/laborRates'

const sections = [
  { key: 'main', label: 'Main' },
  { key: 'billing', label: 'Billing' },
]

export default function ShopCustomerCreatePage() {
  const [active, setActive] = useState('main')
  const containerRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()
  const qc = useQueryClient()

  // Main fields
  const [companyName, setCompanyName] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [phone, setPhone] = useState('')
  const [cellPhone, setCellPhone] = useState('')
  const [email, setEmail] = useState('')
  const [dotNumber, setDotNumber] = useState('')

  // Billing
  const [laborRate, setLaborRate] = useState<string>('MECHANICAL')

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!companyName || !firstName) throw new Error('Company name and first name are required')
      const payload: any = {
        company_name: companyName,
        first_name: firstName,
        last_name: lastName || undefined,
        phone: phone || undefined,
        cell_phone: cellPhone || undefined,
        email: email || undefined,
        dot_number: dotNumber || undefined,
        labor_rate: laborRate,
      }
      return shopCustomersService.create(payload)
    },
    onSuccess: () => { toast.success('Shop customer created'); qc.invalidateQueries({ queryKey: ['shop_customers'] }); navigate('/shop/customers') },
    onError: (e: any) => toast.error(e?.message || 'Failed to create shop customer')
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
        <h1 className="text-xl font-semibold">Create Shop Customer</h1>
        <Button color="primary" startContent={<ArrowLeftIcon className="w-4 h-4" />} onPress={() => navigate('/shop/customers')}>Back</Button>
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
              <div className="grid grid-cols-2 gap-6">
                <Input isRequired label="Company Name" variant="bordered" classNames={{ inputWrapper: 'h-14' }} value={companyName} onValueChange={setCompanyName} />
                <div />
                <Input isRequired label="First Name" variant="bordered" classNames={{ inputWrapper: 'h-14' }} value={firstName} onValueChange={setFirstName} />
                <Input label="Last Name" variant="bordered" classNames={{ inputWrapper: 'h-14' }} value={lastName} onValueChange={setLastName} />
                <Input label="Phone" variant="bordered" classNames={{ inputWrapper: 'h-14' }} value={phone} onValueChange={setPhone} />
                <Input label="Cell Phone" variant="bordered" classNames={{ inputWrapper: 'h-14' }} value={cellPhone} onValueChange={setCellPhone} />
                <Input label="Email" type="email" variant="bordered" classNames={{ inputWrapper: 'h-14' }} value={email} onValueChange={setEmail} />
                <Input label="DOT Number" variant="bordered" classNames={{ inputWrapper: 'h-14' }} value={dotNumber} onValueChange={setDotNumber} />
              </div>
            </section>

            <section id="sec-billing" data-section="billing" className="space-y-4">
              <h3 className="text-base font-semibold">Billing</h3>
              <Select label="Default Labor Rate" selectedKeys={[laborRate]} onSelectionChange={(keys)=>setLaborRate(Array.from(keys)[0] as string)} variant="bordered" className="max-w-xl" classNames={{ trigger: 'h-14' }}>
                {LABOR_RATES.map(it => (<SelectItem key={it.key}>{formatLaborRateLabel(it)}</SelectItem>))}
              </Select>
            </section>

          </div>
          <div className="sticky bottom-0 mt-4 flex justify-end gap-2">
            <Button variant="flat" onPress={() => navigate('/shop/customers')}>Cancel</Button>
            <Button color="primary" onPress={() => createMutation.mutate()} isLoading={createMutation.isPending}>Create Shop Customer</Button>
          </div>
        </div>
      </div>
    </CustomMainBody>
  )
} 