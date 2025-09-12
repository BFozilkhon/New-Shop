import { useEffect, useMemo, useRef, useState } from 'react'
import CustomMainBody from '../../components/common/CustomMainBody'
import { Button, Input, Select, SelectItem, Switch, DatePicker } from '@heroui/react'
import { useParams, useSearchParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { usersService } from '../../services/usersService'
import { rolesService } from '../../services/rolesService'
import { companiesService } from '../../services/companiesService'
import { storesService } from '../../services/storesService'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'
import { useTranslation } from 'react-i18next'

export default function EmployeeEditPage() {
  const { t } = useTranslation()
  const { id } = useParams()
  const [sp] = useSearchParams()
  const isView = useMemo(() => sp.get('mode') === 'view', [sp])
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [roleId, setRoleId] = useState<string | undefined>()
  const [phone, setPhone] = useState('')
  const [dob, setDob] = useState('')
  const [gender, setGender] = useState<string | undefined>()
  const [companyId, setCompanyId] = useState<string | undefined>()
  const [storeId, setStoreId] = useState<string | undefined>()
  const [active, setActive] = useState('profile')
  const containerRef = useRef<HTMLDivElement>(null)
  const qc = useQueryClient()

  const userQ = useQuery({ queryKey: ['user', id], queryFn: async () => usersService.get(id as string), enabled: !!id })
  const rolesQ = useQuery({ queryKey: ['roles', 1, 100, ''], queryFn: () => rolesService.list({ page: 1, limit: 100 }) })
  const companiesQ = useQuery({ queryKey: ['companies', 1, 100, ''], queryFn: () => companiesService.list({ page: 1, limit: 100 }), placeholderData: (prev) => prev })
  const storesQ = useQuery({ queryKey: ['stores', 1, 200, companyId || ''], queryFn: () => storesService.list({ page: 1, limit: 200, company_id: companyId }), enabled: !!companyId, placeholderData: (prev) => prev })

  useEffect(() => {
    const u = userQ.data
    if (u) {
      const parts = (u.name || '').split(' ')
      setFirstName(parts[0] || '')
      setLastName(parts.slice(1).join(' '))
      setEmail(u.email)
      setRoleId(u.role_id)
      setPhone(u.phone || '')
      setDob(u.date_of_birth || '')
      setGender(u.gender || undefined)
    }
  }, [userQ.data])

  useEffect(() => { localStorage.removeItem('selected_store_id') }, [])

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

  const roleItems = (rolesQ.data?.items || []).map(r => ({ key: r.id, label: r.name }))
  const companyItems = (companiesQ.data?.items || []).map(c => ({ key: c.id, label: c.title }))
  const storeItems = (storesQ.data?.items || []).map(s => ({ key: s.id, label: s.title }))

  const updateMut = useMutation({
    mutationFn: async () => { if (!id) return; const name = `${firstName} ${lastName}`.trim(); await usersService.update(id, { name, email, role_id: roleId, phone, gender, date_of_birth: dob }) },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['users'] }); window.history.back() },
  })

  const disabled = isView

  return (
    <CustomMainBody>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold">{isView ? t('users.view_title') : t('users.edit_title')}</h1>
        <div className="flex items-center gap-2">
          <Switch isSelected={!disabled} onValueChange={() => {}} isDisabled>{t('users.editable')}</Switch>
          <Button color="primary" startContent={<ArrowLeftIcon className="w-4 h-4" />} onPress={() => window.history.back()}>{t('common.back')}</Button>
        </div>
      </div>
      <div className="grid grid-cols-[220px_1fr] gap-6">
        <aside className="sticky top-4 self-start rounded-lg border border-default-200 p-2 h-fit">
          <ul className="space-y-1">
            {['profile','stores_roles','additional'].map(key => (
              <li key={key}>
                <button className={`w-full text-left px-3 py-2 rounded-md hover:bg-default-100 ${active === key ? 'bg-default-100 font-medium' : ''}`} onClick={() => document.getElementById(`sec-${key}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>
                  {key === 'profile' ? t('users.sections.profile') : key === 'stores_roles' ? t('users.sections.stores_roles') : t('users.sections.additional')}
                </button>
              </li>
            ))}
          </ul>
        </aside>
        <div className="relative">
          <div ref={containerRef} className="min-h-[400px] rounded-lg border border-default-200 p-4 max-h-[70vh] overflow-auto space-y-10">
            <section id="sec-profile" data-section="profile" className="space-y-4">
              <h3 className="text-base font-semibold">{t('users.sections.profile')}</h3>
              <div className="grid grid-cols-2 gap-6">
                <Input isRequired isDisabled={disabled} label={t('users.form.first_name_label')} placeholder={t('users.form.first_name_placeholder')} variant="bordered" classNames={{ inputWrapper: 'h-14' }} labelPlacement="inside" value={firstName} onValueChange={setFirstName} />
                <Input isRequired isDisabled={disabled} label={t('users.form.last_name_label')} placeholder={t('users.form.last_name_placeholder')} variant="bordered" classNames={{ inputWrapper: 'h-14' }} labelPlacement="inside" value={lastName} onValueChange={setLastName} />
                <Input isRequired isDisabled={disabled} label={t('users.form.email_label')} placeholder={t('users.form.email_placeholder')} variant="bordered" classNames={{ inputWrapper: 'h-14' }} labelPlacement="inside" value={email} onValueChange={setEmail} />
              </div>
            </section>
            <section id="sec-stores_roles" data-section="stores_roles" className="space-y-4">
              <h3 className="text-base font-semibold">{t('users.sections.stores_roles')}</h3>
              <div className="grid grid-cols-2 gap-6">
                <Select isDisabled={disabled} label={t('users.form.company_label')} placeholder={t('users.form.company_placeholder')} selectedKeys={companyId ? new Set([companyId]) : new Set()} onSelectionChange={(keys) => { const [k] = Array.from(keys as Set<string>); setCompanyId(k); setStoreId(undefined) }} variant="bordered" classNames={{ trigger: 'h-14' }} items={companyItems as any}>
                  {(item: any) => <SelectItem key={item.key}>{item.label}</SelectItem>}
                </Select>
                <Select isDisabled={disabled || !companyId} label={t('users.form.store_label')} placeholder={companyId ? t('users.form.store_placeholder') : t('users.form.store_placeholder_first')} selectedKeys={storeId ? new Set([storeId]) : new Set()} onSelectionChange={(keys) => { const [k] = Array.from(keys as Set<string>); setStoreId(k); if (k) localStorage.setItem('selected_store_id', k); else localStorage.removeItem('selected_store_id') }} variant="bordered" classNames={{ trigger: 'h-14' }} items={storeItems as any}>
                  {(item: any) => <SelectItem key={item.key}>{item.label}</SelectItem>}
                </Select>
                <Select isDisabled={disabled} label={t('users.form.role_label')} placeholder={t('users.form.role_placeholder')} selectedKeys={roleId ? new Set([roleId]) : new Set()} onSelectionChange={(keys) => { const [k] = Array.from(keys as Set<string>); setRoleId(k) }} variant="bordered" classNames={{ trigger: 'h-14' }} items={roleItems as any}>
                  {(item: any) => <SelectItem key={item.key}>{item.label}</SelectItem>}
                </Select>
              </div>
            </section>
            <section id="sec-additional" data-section="additional" className="space-y-4">
              <h3 className="text-base font-semibold">{t('users.sections.additional')}</h3>
              <div className="grid grid-cols-2 gap-6">
                <DatePicker variant='bordered' aria-label={t('users.form.date_of_birth_label')} label={t('users.form.date_of_birth_label')} isDisabled={disabled} onChange={(d: any) => { try { const s = typeof d?.toString === 'function' ? d.toString() : String(d); const iso = new Date(`${s}T00:00:00Z`).toISOString(); setDob(iso) } catch { setDob('') } }} />
                <Select isDisabled={disabled} label={t('users.form.gender_label')} placeholder={t('common.select')} variant="bordered" classNames={{ trigger: 'h-14' }}>
                  <SelectItem key="male">{t('users.form.male')}</SelectItem>
                  <SelectItem key="female">{t('users.form.female')}</SelectItem>
                </Select>
              </div>
            </section>
          </div>
          <div className="sticky bottom-0 mt-4 flex justify-end gap-2">
            <Button variant="flat" onPress={() => window.history.back()}>{t('common.back')}</Button>
            {!disabled && <Button color="primary" onPress={() => updateMut.mutate()}>{t('common.save')}</Button>}
          </div>
        </div>
      </div>
    </CustomMainBody>
  )
} 