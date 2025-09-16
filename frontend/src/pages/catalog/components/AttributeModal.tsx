import { useState, useEffect } from 'react'
import { useMutation } from '@tanstack/react-query'
import { attributesService, Attribute } from '../../../services/attributesService'
import CustomModal from '../../../components/common/CustomModal'
import { Input, Switch, Button } from '@heroui/react'
import { toast } from 'react-toastify'
import { useTranslation } from 'react-i18next'
import { XMarkIcon, PlusIcon } from '@heroicons/react/24/outline'

 type Props = {
  isOpen: boolean
  mode: 'create' | 'edit' | 'view'
  attribute?: Attribute
  onClose: () => void
  onSuccess: () => void
}

export default function AttributeModal({ isOpen, mode, attribute, onClose, onSuccess }: Props) {
  const { t } = useTranslation()
  const [name, setName] = useState('')
  const [values, setValues] = useState<string[]>([''])
  const [isActive, setIsActive] = useState(true)

  const createMutation = useMutation({
    mutationFn: (payload: { name: string; values: string[] }) => attributesService.create(payload),
    onSuccess: () => { toast.success(t('catalog.toast.created', { entity: t('catalog.entities.attribute') })); onSuccess(); resetForm() },
    onError: (error: any) => { toast.error(error?.response?.data?.message || t('catalog.toast.create_failed', { entity: t('catalog.entities.attribute') })) }
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => attributesService.update(id, data),
    onSuccess: () => { toast.success(t('catalog.toast.updated', { entity: t('catalog.entities.attribute') })); onSuccess() },
    onError: (error: any) => { toast.error(error?.response?.data?.message || t('catalog.toast.update_failed', { entity: t('catalog.entities.attribute') })) }
  })

  const resetForm = () => { setName(''); setValues(['']); setIsActive(true) }

  useEffect(() => {
    if (isOpen && mode !== 'create' && attribute) {
      setName(attribute.name); setValues(attribute.values?.length ? attribute.values : ['']); setIsActive(attribute.is_active)
    } else if (isOpen && mode === 'create') { resetForm() }
  }, [isOpen, mode, attribute])

  const handleSubmit = () => {
    if (!name.trim()) { toast.error(t('catalog.validation.name_required', { defaultValue: 'Attribute name is required' })); return }
    const cleaned = values.map(v => v.trim()).filter(v => v)
    if (cleaned.length === 0) { toast.error(t('catalog.validation.value_required', { defaultValue: 'At least one value is required' })); return }
    const payload: any = { name: name.trim(), values: cleaned }; if (mode === 'edit') payload.is_active = isActive
    if (mode === 'create') { createMutation.mutate(payload) } else if (mode === 'edit' && attribute) { updateMutation.mutate({ id: attribute.id, data: payload }) }
  }

  const handleClose = () => { onClose(); if (mode === 'create') resetForm() }
  const isSubmitting = createMutation.isPending || updateMutation.isPending
  const isReadOnly = mode === 'view'

  const setValueAt = (i: number, v: string) => { const next = values.slice(); next[i] = v; setValues(next) }
  const addRow = () => setValues(v => [...v, ''])
  const removeRow = (i: number) => { const next = values.slice(); next.splice(i,1); setValues(next.length? next : ['']) }

  return (
    <CustomModal isOpen={isOpen} onOpenChange={(open) => { if (!open) handleClose() }} title={mode === 'create' ? t('catalog.create.attribute') : mode === 'edit' ? t('common.edit') + ' ' + t('catalog.entities.attribute') : t('common.view') + ' ' + t('catalog.entities.attribute')} onSubmit={isReadOnly ? undefined : handleSubmit} submitLabel={mode === 'create' ? t('common.create') : t('common.update')} isSubmitting={isSubmitting} size="lg">
      <div className="space-y-4">
        <Input variant="bordered" label={t('catalog.table.name')} placeholder={t('catalog.attributes.name_placeholder', { defaultValue: 'Enter attribute name' })} value={name} onValueChange={setName} isRequired isReadOnly={isReadOnly} />

        <div>
          <div className="text-sm font-medium mb-2">{t('catalog.table.value', { defaultValue: 'Attribute value' })}</div>
          <div className="space-y-2">
            {values.map((val, idx) => (
              <div key={idx} className="flex gap-2 items-center">
                <Input variant="bordered" className="flex-1" placeholder={t('catalog.attributes.value_placeholder', { defaultValue: 'Enter value' })} value={val} onValueChange={(v)=> setValueAt(idx, v)} isReadOnly={isReadOnly} />
                {!isReadOnly && (
                  <Button isIconOnly variant="light" color="danger" onPress={()=> removeRow(idx)} aria-label="delete"><XMarkIcon className="w-5 h-5" /></Button>
                )}
              </div>
            ))}
            {!isReadOnly && (
              <div className="pt-2">
                <Button startContent={<PlusIcon className="w-4 h-4" />} variant="flat" className="w-full justify-start flex items-center justify-center" onPress={addRow}>Add</Button>
              </div>
            )}
          </div>
        </div>

        {mode === 'edit' && (<Switch isSelected={isActive} onValueChange={setIsActive} isDisabled={isReadOnly}>{t('catalog.common.active')}</Switch>)}
      </div>
    </CustomModal>
  )
} 