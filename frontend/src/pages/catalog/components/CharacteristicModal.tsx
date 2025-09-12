import { useState, useEffect } from 'react'
import { useMutation } from '@tanstack/react-query'
import { characteristicsService, Characteristic } from '../../../services/characteristicsService'
import CustomModal from '../../../components/common/CustomModal'
import { Input, Select, SelectItem, Switch } from '@heroui/react'
import { toast } from 'react-toastify'
import { useTranslation } from 'react-i18next'

type Props = {
  isOpen: boolean
  mode: 'create' | 'edit' | 'view'
  characteristic?: Characteristic
  onClose: () => void
  onSuccess: () => void
}

const CHARACTERISTIC_TYPES = [
  { key: 'text', labelKey: 'catalog.characteristics.types.text' },
  { key: 'number', labelKey: 'catalog.characteristics.types.number' },
  { key: 'select', labelKey: 'catalog.characteristics.types.select' },
  { key: 'boolean', labelKey: 'catalog.characteristics.types.boolean' },
]

export default function CharacteristicModal({ isOpen, mode, characteristic, onClose, onSuccess }: Props) {
  const { t } = useTranslation()
  const [name, setName] = useState('')
  const [type, setType] = useState('text')
  const [isActive, setIsActive] = useState(true)

  const createMutation = useMutation({
    mutationFn: characteristicsService.create,
    onSuccess: () => {
      toast.success(t('catalog.toast.created', { entity: t('catalog.entities.characteristic') }))
      onSuccess()
      resetForm()
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || t('catalog.toast.create_failed', { entity: t('catalog.entities.characteristic') }))
    }
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => characteristicsService.update(id, data),
    onSuccess: () => {
      toast.success(t('catalog.toast.updated', { entity: t('catalog.entities.characteristic') }))
      onSuccess()
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || t('catalog.toast.update_failed', { entity: t('catalog.entities.characteristic') }))
    }
  })

  const resetForm = () => {
    setName('')
    setType('text')
    setIsActive(true)
  }

  useEffect(() => {
    if (isOpen && mode !== 'create' && characteristic) {
      setName(characteristic.name)
      setType(characteristic.type)
      setIsActive(characteristic.is_active)
    } else if (isOpen && mode === 'create') {
      resetForm()
    }
  }, [isOpen, mode, characteristic])

  const handleSubmit = () => {
    if (!name.trim()) {
      toast.error(t('catalog.validation.name_required', { defaultValue: 'Characteristic name is required' }))
      return
    }

    const payload = {
      name: name.trim(),
      type,
      ...(mode === 'edit' && { is_active: isActive })
    }

    if (mode === 'create') {
      createMutation.mutate(payload)
    } else if (mode === 'edit' && characteristic) {
      updateMutation.mutate({ id: characteristic.id, data: payload })
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
      title={mode === 'create' ? t('catalog.create.characteristic') : mode === 'edit' ? t('common.edit') + ' ' + t('catalog.entities.characteristic') : t('common.view') + ' ' + t('catalog.entities.characteristic')}
      onSubmit={isReadOnly ? undefined : handleSubmit}
      submitLabel={mode === 'create' ? t('common.create') : t('common.update')}
      isSubmitting={isSubmitting}
    >
      <div className="space-y-4">
        <Input
          label={t('catalog.table.name')}
          placeholder={t('catalog.characteristics.name_placeholder', { defaultValue: 'Enter characteristic name' })}
          value={name}
          onValueChange={setName}
          isRequired
          isReadOnly={isReadOnly}
        />

        <Select
          label={t('catalog.table.type')}
          placeholder={t('catalog.characteristics.type_placeholder', { defaultValue: 'Select characteristic type' })}
          selectedKeys={[type]}
          onSelectionChange={(keys) => setType(Array.from(keys)[0] as string)}
          isDisabled={isReadOnly}
        >
          {CHARACTERISTIC_TYPES.map(option => (
            <SelectItem key={option.key}>
              {t(option.labelKey)}
            </SelectItem>
          ))}
        </Select>

        {mode === 'edit' && (
          <Switch
            isSelected={isActive}
            onValueChange={setIsActive}
            isDisabled={isReadOnly}
          >
            {t('catalog.common.active')}
          </Switch>
        )}

        {mode === 'view' && characteristic && (
          <div className="space-y-2 text-sm text-default-600">
            <div>Type: {characteristic.type}</div>
            <div>Status: {characteristic.is_active ? t('catalog.common.active') : t('catalog.common.inactive')}</div>
            <div>Created: {new Date(characteristic.created_at).toLocaleDateString()}</div>
          </div>
        )}
      </div>
    </CustomModal>
  )
} 