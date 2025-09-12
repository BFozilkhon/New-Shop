import { useEffect, useMemo, useRef, useState } from 'react'
import CustomMainBody from '../../components/common/CustomMainBody'
import { Button, Input, Select, SelectItem, Switch } from '@heroui/react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { storesService, WeekSchedule, StoreContacts } from '../../services/storesService'
import { companiesService } from '../../services/companiesService'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'
import { useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

export default function StoreEditPage() {
  const { t } = useTranslation()
  const [sp] = useSearchParams()
  const id = sp.get('edit') || sp.get('view') || ''
  const viewOnly = !!sp.get('view')
  const qc = useQueryClient()

  const [active, setActive] = useState('basic')
  const containerRef = useRef<HTMLDivElement>(null)

  const [companyId, setCompanyId] = useState('')
  const [title, setTitle] = useState('')
  const [square, setSquare] = useState('')
  const [tin, setTin] = useState('')
  const [working, setWorking] = useState<WeekSchedule>({ mon:{enabled:false,open:'',close:''}, tue:{enabled:false,open:'',close:''}, wed:{enabled:false,open:'',close:''}, thu:{enabled:false,open:'',close:''}, fri:{enabled:false,open:'',close:''}, sat:{enabled:false,open:'',close:''}, sun:{enabled:false,open:'',close:''} })
  const [contacts, setContacts] = useState<StoreContacts>({ phone:'', facebook:'', instagram:'', telegram:'', website:'' })

  const q = useQuery({ queryKey: ['store', id], queryFn: () => storesService.get(id), enabled: !!id })
  const companiesQ = useQuery({ queryKey: ['companies','for-store'], queryFn: () => companiesService.list({ page: 1, limit: 100, search: '' }) })
  const companiesItems = useMemo(() => (companiesQ.data?.items || []).map(c => ({ key: c.id, label: c.title })), [companiesQ.data])

  useEffect(() => { if (q.data) { setCompanyId(q.data.company_id); setTitle(q.data.title); setSquare(String(q.data.square)); setTin(q.data.tin); setWorking(q.data.working); setContacts(q.data.contacts) } }, [q.data])

  const DAY_LABELS: Record<keyof WeekSchedule, string> = useMemo(() => ({
    mon: t('stores.days.mon'),
    tue: t('stores.days.tue'),
    wed: t('stores.days.wed'),
    thu: t('stores.days.thu'),
    fri: t('stores.days.fri'),
    sat: t('stores.days.sat'),
    sun: t('stores.days.sun'),
  }), [t])

  const handleSelect = (key: string) => { setActive(key); document.getElementById(`sec-${key}`)?.scrollIntoView({ behavior:'smooth', block:'start' }) }

  const updateMutation = useMutation({
    mutationFn: async () => storesService.update(id, { company_id: companyId, title, square: Number(square||'0'), tin, working, contacts }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['stores'] }); window.history.back() },
  } as any)

  const sections = useMemo(() => ([
    { key: 'basic', label: t('stores.sections.basic') },
    { key: 'working', label: t('stores.sections.working') },
    { key: 'contacts', label: t('stores.sections.contacts') },
  ]), [t])

  return (
    <CustomMainBody>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold">{viewOnly ? t('stores.view_title') : t('stores.edit_title')}</h1>
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
              <h3 className="text-base font-semibold">{t('stores.sections.basic')}</h3>
              <div className="grid grid-cols-2 gap-6">
                <Select
                  aria-label={t('stores.form.company_label')}
                  label={t('stores.form.company_label')}
                  items={companiesItems}
                  selectedKeys={companyId ? [companyId] : []}
                  onSelectionChange={(keys) => setCompanyId(Array.from(keys as Set<string>)[0] || '')}
                  placeholder={t('stores.form.company_placeholder')}
                  variant="bordered"
                  classNames={{ trigger: 'h-14', popoverContent: 'z-[1100]' }}
                  isDisabled={viewOnly}
                >
                  {(item) => <SelectItem key={item.key}>{item.label}</SelectItem>}
                </Select>
                <Input isRequired label={t('stores.form.title_label')} placeholder={t('stores.form.title_placeholder')} variant="bordered" classNames={{ inputWrapper: 'h-14' }} labelPlacement="inside" value={title} onValueChange={setTitle} isDisabled={viewOnly} />
                <Input label={t('stores.form.square_label')} placeholder={t('stores.form.square_placeholder')} variant="bordered" classNames={{ inputWrapper: 'h-14' }} labelPlacement="inside" value={square} onValueChange={setSquare} isDisabled={viewOnly} />
                <Input label={t('stores.form.tin_label')} placeholder={t('stores.form.tin_placeholder')} variant="bordered" classNames={{ inputWrapper: 'h-14' }} labelPlacement="inside" value={tin} onValueChange={setTin} isDisabled={viewOnly} />
              </div>
            </section>
            <section id="sec-working" data-section="working" className="space-y-4">
              <h3 className="text-base font-semibold">{t('stores.sections.working')}</h3>
              <div className="grid grid-cols-2 gap-6">
                {Object.entries(working).map(([dayKey, d]) => {
                  const day = dayKey as keyof WeekSchedule
                  return (
                    <div key={day} className="rounded-xl border border-default-200 p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="font-medium">{(DAY_LABELS[day] || '').toUpperCase()}</div>
                        <Switch isSelected={d.enabled} onValueChange={(v) => setWorking({ ...working, [day]: { ...d, enabled: v } })} isDisabled={viewOnly}>
                          {d.enabled ? t('stores.form.enabled') : t('stores.form.disabled')}
                        </Switch>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <Input type="time" label={t('stores.form.open')} variant="bordered" classNames={{ inputWrapper: 'h-14' }} value={d.open} onValueChange={(v) => setWorking({ ...working, [day]: { ...d, open: v } })} isDisabled={viewOnly || !d.enabled} />
                        <Input type="time" label={t('stores.form.close')} variant="bordered" classNames={{ inputWrapper: 'h-14' }} value={d.close} onValueChange={(v) => setWorking({ ...working, [day]: { ...d, close: v } })} isDisabled={viewOnly || !d.enabled} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>
            <section id="sec-contacts" data-section="contacts" className="space-y-4">
              <h3 className="text-base font-semibold">{t('stores.sections.contacts')}</h3>
              <div className="grid grid-cols-2 gap-6">
                <Input label="Phone" variant="bordered" classNames={{ inputWrapper: 'h-14' }} labelPlacement="inside" value={contacts.phone} onValueChange={(v)=> setContacts({ ...contacts, phone: v })} isDisabled={viewOnly} />
                <Input label="Facebook" variant="bordered" classNames={{ inputWrapper: 'h-14' }} labelPlacement="inside" value={contacts.facebook} onValueChange={(v)=> setContacts({ ...contacts, facebook: v })} isDisabled={viewOnly} />
                <Input label="Instagram" variant="bordered" classNames={{ inputWrapper: 'h-14' }} labelPlacement="inside" value={contacts.instagram} onValueChange={(v)=> setContacts({ ...contacts, instagram: v })} isDisabled={viewOnly} />
                <Input label="Telegram" variant="bordered" classNames={{ inputWrapper: 'h-14' }} labelPlacement="inside" value={contacts.telegram} onValueChange={(v)=> setContacts({ ...contacts, telegram: v })} isDisabled={viewOnly} />
                <Input label="Website" variant="bordered" classNames={{ inputWrapper: 'h-14' }} labelPlacement="inside" value={contacts.website} onValueChange={(v)=> setContacts({ ...contacts, website: v })} isDisabled={viewOnly} />
              </div>
            </section>
          </div>
          {!viewOnly && (
            <div className="sticky bottom-0 mt-4 flex justify-end gap-2">
              <Button variant="flat" onPress={() => window.history.back()}>{t('common.back')}</Button>
              <Button color="primary" onPress={() => updateMutation.mutate()} isDisabled={!companyId || !title}>{t('common.save')}</Button>
            </div>
          )}
        </div>
      </div>
    </CustomMainBody>
  )
} 