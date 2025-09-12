import { useEffect, useMemo, useRef, useState } from 'react'
import CustomMainBody from '../../components/common/CustomMainBody'
import { Button, Input, Textarea } from '@heroui/react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { rolesService } from '../../services/rolesService'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'
import PermissionSelector from '../../components/common/PermissionSelector'
import { useTranslation } from 'react-i18next'

export default function RoleCreatePage() {
  const { t } = useTranslation()
  const [active, setActive] = useState('basic')
  const containerRef = useRef<HTMLDivElement>(null)

  const [name, setName] = useState('')
  const [key, setKey] = useState('')
  const [description, setDescription] = useState('')
  const [permissions, setPermissions] = useState<string[]>([])

  const qc = useQueryClient()

  const permsQ = useQuery({ queryKey: ['permissions'], queryFn: rolesService.permissions, placeholderData: (p)=>p })

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
    mutationFn: async () => { if (!name || !key) throw new Error('Please fill required fields'); return rolesService.create({ name, key, description, permissions }) },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['roles'] }); window.location.href = '/hr-management/roles' },
  } as any)

  return (
    <CustomMainBody>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold">{t('roles.create_title')}</h1>
        <Button color="primary" startContent={<ArrowLeftIcon className="w-4 h-4" />} onPress={() => window.history.back()}>{t('common.back')}</Button>
      </div>
      <div className="grid grid-cols-[220px_1fr] gap-6">
        <aside className="sticky top-4 self-start rounded-lg border border-default-200 p-2 h-fit">
          <ul className="space-y-1">
            {[
              { key: 'basic', label: t('roles.sections.basic') },
              { key: 'permissions', label: t('roles.sections.permissions') },
            ].map(s => (
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
              <h3 className="text-base font-semibold">{t('roles.sections.basic')}</h3>
              <div className="grid grid-cols-2 gap-6">
                <Input isRequired label={t('roles.form.name_label')} placeholder={t('roles.form.name_placeholder')} variant="bordered" classNames={{ inputWrapper: 'h-14' }} labelPlacement="inside" value={name} onValueChange={setName} />
                <Input isRequired label={t('roles.form.key_label')} placeholder={t('roles.form.key_placeholder')} variant="bordered" classNames={{ inputWrapper: 'h-14' }} labelPlacement="inside" value={key} onValueChange={setKey} />
                <div className="col-span-2">
                  <Textarea label={t('roles.form.description_label')} placeholder={t('roles.form.description_placeholder')} variant="bordered" classNames={{ inputWrapper: 'min-h-[3.5rem]' }} value={description} onValueChange={setDescription} />
                </div>
              </div>
            </section>

            <section id="sec-permissions" data-section="permissions" className="space-y-4">
              <h3 className="text-base font-semibold">{t('roles.sections.permissions')}</h3>
              <PermissionSelector groups={permsQ.data || []} value={permissions} onChange={setPermissions} />
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