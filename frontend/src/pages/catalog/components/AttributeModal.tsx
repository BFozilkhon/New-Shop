import { useState, useEffect } from 'react'
import { useMutation } from '@tanstack/react-query'
import { attributesService, Attribute } from '../../../services/attributesService'
import CustomModal from '../../../components/common/CustomModal'
import { Input, Switch } from '@heroui/react'
import { toast } from 'react-toastify'
import { useTranslation } from 'react-i18next'

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
  const [value, setValue] = useState('')
  const [isActive, setIsActive] = useState(true)

  const createMutation = useMutation({
    mutationFn: attributesService.create,
    onSuccess: () => {
      toast.success(t('catalog.toast.created', { entity: t('catalog.entities.attribute') }))
      onSuccess()
      resetForm()
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || t('catalog.toast.create_failed', { entity: t('catalog.entities.attribute') }))
    }
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => attributesService.update(id, data),
    onSuccess: () => {
      toast.success(t('catalog.toast.updated', { entity: t('catalog.entities.attribute') }))
      onSuccess()
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || t('catalog.toast.update_failed', { entity: t('catalog.entities.attribute') }))
    }
  })

  const resetForm = () => {
    setName('')
    setValue('')
    setIsActive(true)
  }

  useEffect(() => {
    if (isOpen && mode !== 'create' && attribute) {
      setName(attribute.name)
      setValue(attribute.value)
      setIsActive(attribute.is_active)
    } else if (isOpen && mode === 'create') {
      resetForm()
    }
  }, [isOpen, mode, attribute])

  const handleSubmit = () => {
    if (!name.trim()) {
      toast.error(t('catalog.validation.name_required', { defaultValue: 'Attribute name is required' }))
      return
    }
    if (!value.trim()) {
      toast.error(t('catalog.validation.value_required', { defaultValue: 'Attribute value is required' }))
      return
    }

    const payload = {
      name: name.trim(),
      value: value.trim(),
      ...(mode === 'edit' && { is_active: isActive })
    }

    if (mode === 'create') {
      createMutation.mutate(payload)
    } else if (mode === 'edit' && attribute) {
      updateMutation.mutate({ id: attribute.id, data: payload })
    }
  }

  const handleClose = () => {
    onClose()
    if (mode === 'create') {
      resetForm()
    }
  }

  const isSubmitting = createMutation.isPending || updateMutation.isPending
  const isReadOnly = mode === 'view'

  return (
    <CustomModal
      isOpen={isOpen}
      onOpenChange={(open) => { if (!open) handleClose() }}
      title={mode === 'create' ? t('catalog.create.attribute') : mode === 'edit' ? t('common.edit') + ' ' + t('catalog.entities.attribute') : t('common.view') + ' ' + t('catalog.entities.attribute')}
      onSubmit={isReadOnly ? undefined : handleSubmit}
      submitLabel={mode === 'create' ? t('common.create') : t('common.update')}
      isSubmitting={isSubmitting}
    >
      <div className="space-y-4">
        <Input
          label={t('catalog.table.name')}
          placeholder={t('catalog.attributes.name_placeholder', { defaultValue: 'Enter attribute name' })}
          value={name}
          onValueChange={setName}
          isRequired
          isReadOnly={isReadOnly}
        />

        <Input
          label={t('catalog.table.value')}
          placeholder={t('catalog.attributes.value_placeholder', { defaultValue: 'Enter attribute value' })}
          value={value}
          onValueChange={setValue}
          isRequired
          isReadOnly={isReadOnly}
        />

        {mode === 'edit' && (
          <Switch
            isSelected={isActive}
            onValueChange={setIsActive}
            isDisabled={isReadOnly}
          >
            {t('catalog.common.active')}
          </Switch>
        )}

        {mode === 'view' && attribute && (
          <div className="space-y-2 text-sm text-default-600">
            <div>Status: {attribute.is_active ? t('catalog.common.active') : t('catalog.common.inactive')}</div>
            <div>Created: {new Date(attribute.created_at).toLocaleDateString()}</div>
          </div>
        )}
      </div>
    </CustomModal>
  )
} 