import { useEffect, useRef, useState } from 'react'
import CustomMainBody from '../../../components/common/CustomMainBody'
import { Button, Input } from '@heroui/react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { shopVendorsService } from '../../../services/shopVendorsService'
import { toast } from 'react-toastify'

export default function ShopVendorCreatePage() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [active, setActive] = useState('main')
  const containerRef = useRef<HTMLDivElement>(null)

  const [vendorName, setVendorName] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [cellPhone, setCellPhone] = useState('')

  const sections = [
    { key: 'main', label: 'Main' },
  ]

  const handleSelect = (key: string) => {
    setActive(key)
    const el = containerRef.current?.querySelector(`[data-section="${key}"]`)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!vendorName || !firstName) throw new Error('Vendor name and First name required')
      return shopVendorsService.create({ vendor_name: vendorName, first_name: firstName, last_name: lastName, email, phone, cell_phone: cellPhone })
    },
    onSuccess: () => {
      toast.success('Vendor created')
      qc.invalidateQueries({ queryKey: ['shop_vendors'] })
      navigate('/shop/vendors')
    },
    onError: (e: any) => toast.error(e?.response?.data?.error?.message || e?.message || 'Create failed'),
  })

  useEffect(()=>{
    const onScroll = () => {
      const mainY = (containerRef.current?.querySelector('#sec-main') as HTMLElement)?.getBoundingClientRect().top ?? 0
      setActive(mainY <= 80 ? 'main' : 'main')
    }
    containerRef.current?.addEventListener('scroll', onScroll)
    return () => containerRef.current?.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <CustomMainBody>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold">Add New Vendor</h1>
        <Button color="primary" startContent={<ArrowLeftIcon className="w-4 h-4" />} onPress={() => navigate('/shop/vendors')}>Back</Button>
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
                <Input isRequired label="Vendor Name" variant="bordered" classNames={{ inputWrapper: 'h-14' }} value={vendorName} onValueChange={setVendorName} />
                <div />
                <Input isRequired label="First Name" variant="bordered" classNames={{ inputWrapper: 'h-14' }} value={firstName} onValueChange={setFirstName} />
                <Input label="Last Name" variant="bordered" classNames={{ inputWrapper: 'h-14' }} value={lastName} onValueChange={setLastName} />
                <Input label="Email" type="email" variant="bordered" classNames={{ inputWrapper: 'h-14' }} value={email} onValueChange={setEmail} />
                <Input label="Phone" variant="bordered" classNames={{ inputWrapper: 'h-14' }} value={phone} onValueChange={setPhone} />
                <Input label="Cell Phone" variant="bordered" classNames={{ inputWrapper: 'h-14' }} value={cellPhone} onValueChange={setCellPhone} />
              </div>
            </section>
          </div>
          <div className="sticky bottom-0 mt-4 flex justify-end gap-2">
            <Button variant="flat" onPress={() => navigate('/shop/vendors')}>Cancel</Button>
            <Button color="primary" onPress={() => createMutation.mutate()} isLoading={createMutation.isPending}>Create Vendor</Button>
          </div>
        </div>
      </div>
    </CustomMainBody>
  )
} 