import { useRef, useState } from 'react'
import CustomMainBody from '../../components/common/CustomMainBody'
import { Button, Input } from '@heroui/react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { companiesService, CompanyRequisites } from '../../services/companiesService'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'
import { useTranslation } from 'react-i18next'

export default function CompanyCreatePage() {
  const { t } = useTranslation()
  const qc = useQueryClient()
  const [active, setActive] = useState('basic')
  const containerRef = useRef<HTMLDivElement>(null)

  const [title, setTitle] = useState('')
  const [email, setEmail] = useState('')
  const [req, setReq] = useState<CompanyRequisites>({ legal_name: '', legal_address: '', country: '', zip_code: '', bank_account: '', bank_name: '', tin: '', ibt: '' })

  const sections = [
    { key: 'basic', label: t('companies.sections.basic') },
    { key: 'requisites', label: t('companies.sections.requisites') },
  ]

  const handleSelect = (key: string) => { setActive(key); document.getElementById(`sec-${key}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }) }

  const createMutation = useMutation({
    mutationFn: async () => companiesService.create({ title, email, requisites: req }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['companies'] }); window.location.href = '/settings/company' },
  } as any)

  return (
    <CustomMainBody>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold">{t('companies.create_title')}</h1>
        <Button color="primary" startContent={<ArrowLeftIcon className="w-4 h-4" />} onPress={() => window.history.back()}>{t('common.back')}</Button>
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
            <section id="sec-basic" data-section="basic" className="space-y-4">
              <h3 className="text-base font-semibold">{t('companies.sections.basic')}</h3>
              <div className="grid grid-cols-2 gap-6">
                <Input isRequired label={t('companies.form.title_label')} placeholder={t('companies.form.title_placeholder')} variant="bordered" classNames={{ inputWrapper: 'h-14' }} labelPlacement="inside" value={title} onValueChange={setTitle} />
                <Input label={t('companies.form.email_label')} placeholder={t('companies.form.email_placeholder')} variant="bordered" classNames={{ inputWrapper: 'h-14' }} labelPlacement="inside" value={email} onValueChange={setEmail} />
              </div>
            </section>
            <section id="sec-requisites" data-section="requisites" className="space-y-4">
              <h3 className="text-base font-semibold">{t('companies.sections.requisites')}</h3>
              <div className="grid grid-cols-2 gap-6">
                <Input label={t('companies.form.legal_name')} variant="bordered" classNames={{ inputWrapper: 'h-14' }} labelPlacement="inside" value={req.legal_name} onValueChange={(v) => setReq({ ...req, legal_name: v })} />
                <Input label={t('companies.form.legal_address')} variant="bordered" classNames={{ inputWrapper: 'h-14' }} labelPlacement="inside" value={req.legal_address} onValueChange={(v) => setReq({ ...req, legal_address: v })} />
                <Input label={t('companies.form.country')} variant="bordered" classNames={{ inputWrapper: 'h-14' }} labelPlacement="inside" value={req.country} onValueChange={(v) => setReq({ ...req, country: v })} />
                <Input label={t('companies.form.zip_code')} variant="bordered" classNames={{ inputWrapper: 'h-14' }} labelPlacement="inside" value={req.zip_code} onValueChange={(v) => setReq({ ...req, zip_code: v })} />
                <Input label={t('companies.form.bank_account')} variant="bordered" classNames={{ inputWrapper: 'h-14' }} labelPlacement="inside" value={req.bank_account} onValueChange={(v) => setReq({ ...req, bank_account: v })} />
                <Input label={t('companies.form.bank_name')} variant="bordered" classNames={{ inputWrapper: 'h-14' }} labelPlacement="inside" value={req.bank_name} onValueChange={(v) => setReq({ ...req, bank_name: v })} />
                <Input label={t('companies.form.tin')} variant="bordered" classNames={{ inputWrapper: 'h-14' }} labelPlacement="inside" value={req.tin} onValueChange={(v) => setReq({ ...req, tin: v })} />
                <Input label={t('companies.form.ibt')} variant="bordered" classNames={{ inputWrapper: 'h-14' }} labelPlacement="inside" value={req.ibt} onValueChange={(v) => setReq({ ...req, ibt: v })} />
              </div>
            </section>
          </div>

          <div className="sticky bottom-0 mt-4 flex justify-end gap-2">
            <Button variant="flat" onPress={() => window.history.back()}>{t('common.back')}</Button>
            <Button color="primary" onPress={() => createMutation.mutate()}>{t('common.save')}</Button>
          </div>
        </div>
      </div>
    </CustomMainBody>
  )
} 