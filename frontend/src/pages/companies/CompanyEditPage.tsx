import { useEffect, useMemo, useRef, useState } from 'react'
import CustomMainBody from '../../components/common/CustomMainBody'
import { Button, Input, Textarea } from '@heroui/react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { companiesService, CompanyRequisites } from '../../services/companiesService'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'
import { useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

export default function CompanyEditPage() {
  const { t } = useTranslation()
  const [sp] = useSearchParams()
  const id = sp.get('edit') || sp.get('view') || ''
  const viewOnly = !!sp.get('view')
  const qc = useQueryClient()

  const [active, setActive] = useState('basic')
  const containerRef = useRef<HTMLDivElement>(null)

  const [title, setTitle] = useState('')
  const [email, setEmail] = useState('')
  const [req, setReq] = useState<CompanyRequisites>({ legal_name: '', legal_address: '', country: '', zip_code: '', bank_account: '', bank_name: '', tin: '', ibt: '' })

  const q = useQuery({ queryKey: ['company', id], queryFn: () => companiesService.get(id), enabled: !!id })

  useEffect(() => {
    if (q.data) {
      setTitle(q.data.title); setEmail(q.data.email); setReq(q.data.requisites)
    }
  }, [q.data])

  useEffect(() => {
    const onScroll = () => {
      if (!containerRef.current) return
      const anchors = Array.from(containerRef.current.querySelectorAll('[data-section]')) as HTMLElement[]
      const top = containerRef.current.getBoundingClientRect().top
      let current = active
      for (const el of anchors) { const rect = el.getBoundingClientRect(); if (rect.top - top <= 80) current = el.dataset.section || current }
      if (current !== active) setActive(current)
    }
    const el = containerRef.current; el?.addEventListener('scroll', onScroll); return () => el?.removeEventListener('scroll', onScroll)
  }, [active])

  const handleSelect = (key: string) => { setActive(key); document.getElementById(`sec-${key}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }) }

  const updateMutation = useMutation({
    mutationFn: async () => companiesService.update(id, { title, email, requisites: req }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['companies'] }); window.history.back() },
  } as any)

  const sections = useMemo(() => ([
    { key: 'basic', label: t('companies.sections.basic') },
    { key: 'requisites', label: t('companies.sections.requisites') },
  ]), [t])

  return (
    <CustomMainBody>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold">{viewOnly ? t('companies.view_title') : t('companies.edit_title')}</h1>
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
                <Input isRequired label={t('companies.form.title_label')} placeholder={t('companies.form.title_placeholder')} variant="bordered" classNames={{ inputWrapper: 'h-14' }} labelPlacement="inside" value={title} onValueChange={setTitle} isDisabled={viewOnly} />
                <Input label={t('companies.form.email_label')} placeholder={t('companies.form.email_placeholder')} variant="bordered" classNames={{ inputWrapper: 'h-14' }} labelPlacement="inside" value={email} onValueChange={setEmail} isDisabled={viewOnly} />
              </div>
            </section>
            <section id="sec-requisites" data-section="requisites" className="space-y-4">
              <h3 className="text-base font-semibold">{t('companies.sections.requisites')}</h3>
              <div className="grid grid-cols-2 gap-6">
                <Input label={t('companies.form.legal_name')} variant="bordered" classNames={{ inputWrapper: 'h-14' }} labelPlacement="inside" value={req.legal_name} onValueChange={(v) => setReq({ ...req, legal_name: v })} isDisabled={viewOnly} />
                <Input label={t('companies.form.legal_address')} variant="bordered" classNames={{ inputWrapper: 'h-14' }} labelPlacement="inside" value={req.legal_address} onValueChange={(v) => setReq({ ...req, legal_address: v })} isDisabled={viewOnly} />
                <Input label={t('companies.form.country')} variant="bordered" classNames={{ inputWrapper: 'h-14' }} labelPlacement="inside" value={req.country} onValueChange={(v) => setReq({ ...req, country: v })} isDisabled={viewOnly} />
                <Input label={t('companies.form.zip_code')} variant="bordered" classNames={{ inputWrapper: 'h-14' }} labelPlacement="inside" value={req.zip_code} onValueChange={(v) => setReq({ ...req, zip_code: v })} isDisabled={viewOnly} />
                <Input label={t('companies.form.bank_account')} variant="bordered" classNames={{ inputWrapper: 'h-14' }} labelPlacement="inside" value={req.bank_account} onValueChange={(v) => setReq({ ...req, bank_account: v })} isDisabled={viewOnly} />
                <Input label={t('companies.form.bank_name')} variant="bordered" classNames={{ inputWrapper: 'h-14' }} labelPlacement="inside" value={req.bank_name} onValueChange={(v) => setReq({ ...req, bank_name: v })} isDisabled={viewOnly} />
                <Input label={t('companies.form.tin')} variant="bordered" classNames={{ inputWrapper: 'h-14' }} labelPlacement="inside" value={req.tin} onValueChange={(v) => setReq({ ...req, tin: v })} isDisabled={viewOnly} />
                <Input label={t('companies.form.ibt')} variant="bordered" classNames={{ inputWrapper: 'h-14' }} labelPlacement="inside" value={req.ibt} onValueChange={(v) => setReq({ ...req, ibt: v })} isDisabled={viewOnly} />
              </div>
            </section>
          </div>
          {!viewOnly && (
            <div className="sticky bottom-0 mt-4 flex justify-end gap-2">
              <Button variant="flat" onPress={() => window.history.back()}>{t('common.back')}</Button>
              <Button color="primary" onPress={() => updateMutation.mutate()}>{t('common.save')}</Button>
            </div>
          )}
        </div>
      </div>
    </CustomMainBody>
  )
} 