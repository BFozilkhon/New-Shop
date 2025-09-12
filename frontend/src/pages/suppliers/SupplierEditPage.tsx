import { useEffect, useMemo, useRef, useState } from 'react'
import CustomMainBody from '../../components/common/CustomMainBody'
import { Button, Input, Textarea } from '@heroui/react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { suppliersService, Supplier, SupplierAddress } from '../../services/suppliersService'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'
import { useParams, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

const sections = [
  { key: 'basic', labelKey: 'suppliers.form.basic' },
  { key: 'address', labelKey: 'suppliers.form.address' },
  { key: 'bank', labelKey: 'suppliers.form.bank' },
]

export default function SupplierEditPage() {
  const { t } = useTranslation()
  const [active, setActive] = useState('basic')
  const containerRef = useRef<HTMLDivElement>(null)
  const { id } = useParams()
  const [sp] = useSearchParams()
  const mode = sp.get('mode')
  const viewOnly = mode === 'view'

  const qc = useQueryClient()

  const q = useQuery({
    queryKey: ['supplier', id],
    queryFn: () => suppliersService.get(id!),
    enabled: !!id,
  })

  const [name, setName] = useState('')
  const [defaultMarkupPercentage, setDefaultMarkupPercentage] = useState<string>('0')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [notes, setNotes] = useState('')
  const [legalAddress, setLegalAddress] = useState<SupplierAddress>({ country: '', city: '', district: '', street: '', house: '' })
  const [bankAccount, setBankAccount] = useState('')
  const [bankNameBranch, setBankNameBranch] = useState('')
  const [inn, setInn] = useState('')
  const [mfo, setMfo] = useState('')

  useEffect(() => {
    if (q.data) {
      setName(q.data.name)
      setDefaultMarkupPercentage(String(q.data.default_markup_percentage ?? '0'))
      setPhone(q.data.phone || '')
      setEmail(q.data.email || '')
      setNotes(q.data.notes || '')
      setLegalAddress(q.data.legal_address || { country: '', city: '', district: '', street: '', house: '' })
      setBankAccount(q.data.bank_account || '')
      setBankNameBranch(q.data.bank_name_branch || '')
      setInn(q.data.inn || '')
      setMfo(q.data.mfo || '')
    }
  }, [q.data])

  useEffect(() => {
    const onScroll = () => {
      if (!containerRef.current) return
      const anchors = Array.from(containerRef.current.querySelectorAll('[data-section]')) as HTMLElement[]
      const top = containerRef.current.getBoundingClientRect().top
      let current = active
      for (const el of anchors) {
        const rect = el.getBoundingClientRect()
        if (rect.top - top <= 80) current = el.dataset.section || current
      }
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

  const updateMutation = useMutation({
    mutationFn: async () => {
      const payload: any = {
        name,
        default_markup_percentage: Number(defaultMarkupPercentage || '0'),
        phone,
        email,
        notes,
        legal_address: legalAddress,
        bank_account: bankAccount,
        bank_name_branch: bankNameBranch,
        inn,
        mfo,
      }
      return suppliersService.update(id!, payload)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['suppliers'] })
      window.location.href = '/products/suppliers'
    },
  } as any)

  return (
    <CustomMainBody>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold">{viewOnly ? t('common.view') + ' ' + t('suppliers.header').slice(0, -1) : t('common.edit') + ' ' + t('suppliers.header').slice(0, -1)}</h1>
        <Button color="primary" startContent={<ArrowLeftIcon className="w-4 h-4" />} onPress={() => window.history.back()}>{t('suppliers.form.back')}</Button>
      </div>
      <div className="grid grid-cols-[220px_1fr] gap-6">
        <aside className="sticky top-4 self-start rounded-lg border border-default-200 p-2 h-fit">
          <ul className="space-y-1">
            {sections.map(s => (
              <li key={s.key}>
                <button className={`w-full text-left px-3 py-2 rounded-md hover:bg-default-100 ${active === s.key ? 'bg-default-100 font-medium' : ''}`} onClick={() => handleSelect(s.key)}>
                  {t(s.labelKey)}
                </button>
              </li>
            ))}
          </ul>
        </aside>
        <div className="relative">
          <div ref={containerRef} className="min-h-[400px] rounded-lg border border-default-200 p-4 max-h-[70vh] overflow-auto space-y-10">
            <section id="sec-basic" data-section="basic" className="space-y-4">
              <h3 className="text-base font-semibold">{t('suppliers.form.basic')}</h3>
              <div className="grid grid-cols-2 gap-6">
                <Input isRequired isDisabled={viewOnly} label={t('suppliers.form.name')} placeholder={t('suppliers.form.name_ph')} variant="bordered" classNames={{ inputWrapper: 'h-14' }} labelPlacement="inside" value={name} onValueChange={setName} />
                <Input isRequired isDisabled={viewOnly} label={t('suppliers.form.default_markup')} placeholder={t('suppliers.form.default_markup_ph')} variant="bordered" classNames={{ inputWrapper: 'h-14' }} labelPlacement="inside" value={defaultMarkupPercentage} onValueChange={setDefaultMarkupPercentage} />
                <Input isDisabled={viewOnly} label={t('suppliers.form.phone')} placeholder={t('suppliers.form.phone_ph')} variant="bordered" classNames={{ inputWrapper: 'h-14' }} labelPlacement="inside" value={phone} onValueChange={setPhone} />
                <Input isDisabled={viewOnly} label={t('suppliers.form.email')} placeholder={t('suppliers.form.email_ph')} variant="bordered" classNames={{ inputWrapper: 'h-14' }} labelPlacement="inside" value={email} onValueChange={setEmail} />
                <div className="col-span-2">
                  <Textarea isDisabled={viewOnly} label={t('suppliers.form.notes')} placeholder={t('suppliers.form.notes_ph')} variant="bordered" classNames={{ inputWrapper: 'min-h-[3.5rem]' }} value={notes} onValueChange={setNotes} />
                </div>
              </div>
            </section>

            <section id="sec-address" data-section="address" className="space-y-4">
              <h3 className="text-base font-semibold">{t('suppliers.form.address')}</h3>
              <div className="grid grid-cols-2 gap-6">
                <Input isDisabled={viewOnly} label={t('suppliers.form.country')} variant="bordered" classNames={{ inputWrapper: 'h-14' }} labelPlacement="inside" value={legalAddress.country} onValueChange={(v) => setLegalAddress({ ...legalAddress, country: v })} />
                <Input isDisabled={viewOnly} label={t('suppliers.form.city')} variant="bordered" classNames={{ inputWrapper: 'h-14' }} labelPlacement="inside" value={legalAddress.city} onValueChange={(v) => setLegalAddress({ ...legalAddress, city: v })} />
                <Input isDisabled={viewOnly} label={t('suppliers.form.district')} variant="bordered" classNames={{ inputWrapper: 'h-14' }} labelPlacement="inside" value={legalAddress.district} onValueChange={(v) => setLegalAddress({ ...legalAddress, district: v })} />
                <Input isDisabled={viewOnly} label={t('suppliers.form.street')} variant="bordered" classNames={{ inputWrapper: 'h-14' }} labelPlacement="inside" value={legalAddress.street} onValueChange={(v) => setLegalAddress({ ...legalAddress, street: v })} />
                <Input isDisabled={viewOnly} label={t('suppliers.form.house')} variant="bordered" classNames={{ inputWrapper: 'h-14' }} labelPlacement="inside" value={legalAddress.house} onValueChange={(v) => setLegalAddress({ ...legalAddress, house: v })} />
              </div>
            </section>

            <section id="sec-bank" data-section="bank" className="space-y-4">
              <h3 className="text-base font-semibold">{t('suppliers.form.bank')}</h3>
              <div className="grid grid-cols-2 gap-6">
                <Input isDisabled={viewOnly} label={t('suppliers.form.bank_account')} variant="bordered" classNames={{ inputWrapper: 'h-14' }} labelPlacement="inside" value={bankAccount} onValueChange={setBankAccount} />
                <Input isDisabled={viewOnly} label={t('suppliers.form.bank_name')} variant="bordered" classNames={{ inputWrapper: 'h-14' }} labelPlacement="inside" value={bankNameBranch} onValueChange={setBankNameBranch} />
                <Input isDisabled={viewOnly} label={t('suppliers.form.inn')} variant="bordered" classNames={{ inputWrapper: 'h-14' }} labelPlacement="inside" value={inn} onValueChange={setInn} />
                <Input isDisabled={viewOnly} label={t('suppliers.form.mfo')} variant="bordered" classNames={{ inputWrapper: 'h-14' }} labelPlacement="inside" value={mfo} onValueChange={setMfo} />
              </div>
            </section>
          </div>

          {!viewOnly && (
            <div className="sticky bottom-0 mt-4 flex justify-end gap-2">
              <Button variant="flat" onPress={() => window.history.back()}>{t('suppliers.form.back')}</Button>
              <Button color="primary" onPress={() => updateMutation.mutate()}>{t('suppliers.form.save')}</Button>
            </div>
          )}
        </div>
      </div>
    </CustomMainBody>
  )
} 