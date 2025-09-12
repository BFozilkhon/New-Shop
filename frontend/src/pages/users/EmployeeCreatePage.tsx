import { useEffect, useRef, useState } from 'react'
import CustomMainBody from '../../components/common/CustomMainBody'
import { Button, Input, Select, SelectItem, DatePicker } from '@heroui/react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { rolesService } from '../../services/rolesService'
import { usersService } from '../../services/usersService'
import { companiesService } from '../../services/companiesService'
import { storesService } from '../../services/storesService'
import { ArrowLeftIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline'
import { useTranslation } from 'react-i18next'

export default function EmployeeCreatePage() {
  const { t } = useTranslation()
  const [active, setActive] = useState('profile')
  const containerRef = useRef<HTMLDivElement>(null)

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [roleId, setRoleId] = useState<string | undefined>()
  const [companyId, setCompanyId] = useState<string | undefined>()
  const [storeId, setStoreId] = useState<string | undefined>()
  const [dobISO, setDobISO] = useState('')
  const [gender, setGender] = useState<string | undefined>()

  const qc = useQueryClient()

  const rolesQuery = useQuery({ queryKey: ['roles', 1, 50, ''], queryFn: () => rolesService.list({ page: 1, limit: 50 }), placeholderData: (prev) => prev })
  const companiesQ = useQuery({ queryKey: ['companies', 1, 100, ''], queryFn: () => companiesService.list({ page: 1, limit: 100 }), placeholderData: (prev) => prev })
  const storesQ = useQuery({ queryKey: ['stores', 1, 200, companyId || ''], queryFn: () => storesService.list({ page: 1, limit: 200, company_id: companyId }), enabled: !!companyId, placeholderData: (prev) => prev })

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

  const handleSelect = (key: string) => { setActive(key); const el = document.getElementById(`sec-${key}`); el?.scrollIntoView({ behavior: 'smooth', block: 'start' }) }

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!firstName || !lastName || !email || !password || !confirm || !roleId) { throw new Error('Please fill all required fields') }
      if (password !== confirm) throw new Error('Passwords do not match')
      const name = `${firstName} ${lastName}`.trim()
      const dto = await usersService.create({ name, email, password, role_id: roleId, phone, gender, date_of_birth: dobISO })
      return dto
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['users'] }); window.location.href = '/hr-management/employees' },
  } as any)

  const roleItems = (rolesQuery.data?.items || []).map(r => ({ key: r.id, label: r.name }))
  const companyItems = (companiesQ.data?.items || []).map(c => ({ key: c.id, label: c.title }))
  const storeItems = (storesQ.data?.items || []).map(s => ({ key: s.id, label: s.title }))

  const sections = [
    { key: 'profile', label: t('users.sections.profile') },
    { key: 'stores_roles', label: t('users.sections.stores_roles') },
    { key: 'additional', label: t('users.sections.additional') },
  ]

  return (
    <CustomMainBody>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold">{t('users.new_title')}</h1>
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
            <section id="sec-profile" data-section="profile" className="space-y-4">
              <h3 className="text-base font-semibold">{t('users.sections.profile')}</h3>
              <div className="grid grid-cols-2 gap-6">
                <Input isRequired label={t('users.form.first_name_label')} placeholder={t('users.form.first_name_placeholder')} variant="bordered" classNames={{ inputWrapper: 'h-14' }} labelPlacement="inside" value={firstName} onValueChange={setFirstName} />
                <Input isRequired label={t('users.form.last_name_label')} placeholder={t('users.form.last_name_placeholder')} variant="bordered" classNames={{ inputWrapper: 'h-14' }} labelPlacement="inside" value={lastName} onValueChange={setLastName} />
                <Input isRequired label={t('users.form.phone_label')} placeholder={t('users.form.phone_placeholder')} variant="bordered" classNames={{ inputWrapper: 'h-14' }} labelPlacement="inside" value={phone} onValueChange={setPhone} />
                <Input isRequired label={t('users.form.email_label')} placeholder={t('users.form.email_placeholder')} variant="bordered" classNames={{ inputWrapper: 'h-14' }} labelPlacement="inside" value={email} onValueChange={setEmail} />
                <Input isRequired label={t('users.form.password_label')} placeholder={t('users.form.password_placeholder')} type={showPwd ? 'text' : 'password'} variant="bordered" classNames={{ inputWrapper: 'h-14' }} labelPlacement="inside" value={password} onValueChange={setPassword} endContent={<button type="button" onClick={() => setShowPwd(v=>!v)} aria-label="toggle password" className="focus:outline-none">{showPwd ? <EyeSlashIcon className="w-5 h-5 text-foreground/60" /> : <EyeIcon className="w-5 h-5 text-foreground/60" />}</button>} />
                <Input isRequired label={t('users.form.confirm_password_label')} placeholder={t('users.form.password_placeholder')} type={showConfirm ? 'text' : 'password'} variant="bordered" classNames={{ inputWrapper: 'h-14' }} labelPlacement="inside" value={confirm} onValueChange={setConfirm} endContent={<button type="button" onClick={() => setShowConfirm(v=>!v)} aria-label="toggle password" className="focus:outline-none">{showConfirm ? <EyeSlashIcon className="w-5 h-5 text-foreground/60" /> : <EyeIcon className="w-5 h-5 text-foreground/60" />}</button>} />
              </div>
            </section>

            <section id="sec-stores_roles" data-section="stores_roles" className="space-y-4">
              <h3 className="text-base font-semibold">{t('users.sections.stores_roles')}</h3>
              <div className="grid grid-cols-2 gap-6">
                <Select label={t('users.form.company_label')} placeholder={t('users.form.company_placeholder')} selectedKeys={companyId ? new Set([companyId]) : new Set()} onSelectionChange={(keys) => { const [k] = Array.from(keys as Set<string>); setCompanyId(k); setStoreId(undefined) }} variant="bordered" classNames={{ trigger: 'h-14' }} items={companyItems as any}>
                  {(item: any) => <SelectItem key={item.key}>{item.label}</SelectItem>}
                </Select>
                <Select label={t('users.form.store_label')} placeholder={companyId ? t('users.form.store_placeholder') : t('users.form.store_placeholder_first')} isDisabled={!companyId} selectedKeys={storeId ? new Set([storeId]) : new Set()} onSelectionChange={(keys) => { const [k] = Array.from(keys as Set<string>); setStoreId(k); if (k) localStorage.setItem('selected_store_id', k); else localStorage.removeItem('selected_store_id') }} variant="bordered" classNames={{ trigger: 'h-14' }} items={storeItems as any}>
                  {(item: any) => <SelectItem key={item.key}>{item.label}</SelectItem>}
                </Select>
                <Select isRequired label={t('users.form.role_label')} placeholder={t('users.form.role_placeholder')} selectedKeys={roleId ? new Set([roleId]) : new Set()} onSelectionChange={(keys) => { const [k] = Array.from(keys as Set<string>); setRoleId(k) }} variant="bordered" classNames={{ trigger: 'h-14' }} items={roleItems as any}>
                  {(item: any) => <SelectItem key={item.key}>{item.label}</SelectItem>}
                </Select>
              </div>
            </section>

            <section id="sec-additional" data-section="additional" className="space-y-4">
              <h3 className="text-base font-semibold">{t('users.sections.additional')}</h3>
              <div className="grid grid-cols-2 gap-6">
                <DatePicker variant='bordered' aria-label={t('users.form.date_of_birth_label')} label={t('users.form.date_of_birth_label')} onChange={(d: any) => { try { const s = typeof d?.toString === 'function' ? d.toString() : String(d); const iso = new Date(`${s}T00:00:00Z`).toISOString(); setDobISO(iso) } catch { setDobISO('') } }} />
                <Select label={t('users.form.gender_label')} placeholder={t('common.select')} selectedKeys={gender ? new Set([gender]) : new Set()} onSelectionChange={(keys) => { const [k] = Array.from(keys as Set<string>); setGender(k) }} variant="bordered" classNames={{ trigger: 'h-14' }}>
                  <SelectItem key="male">{t('users.form.male')}</SelectItem>
                  <SelectItem key="female">{t('users.form.female')}</SelectItem>
                </Select>
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