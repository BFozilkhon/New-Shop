import { useState, useEffect } from 'react'
import { useMutation } from '@tanstack/react-query'
import { characteristicsService, Characteristic } from '../../../services/characteristicsService'
import CustomModal from '../../../components/common/CustomModal'
import { Input, Select, SelectItem, Switch, Button } from '@heroui/react'
import { toast } from 'react-toastify'
import { useTranslation } from 'react-i18next'
import { TrashIcon, PlusIcon } from '@heroicons/react/24/outline'

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
  const [type, setType] = useState('select')
  const [isActive, setIsActive] = useState(true)
  const [values, setValues] = useState<string[]>([''])

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
    setType('select')
    setIsActive(true)
    setValues([''])
  }

  useEffect(() => {
    if (isOpen && mode !== 'create' && characteristic) {
      setName(characteristic.name)
      setType(characteristic.type)
      setIsActive(characteristic.is_active)
      setValues(characteristic.values?.length ? characteristic.values : [''])
    } else if (isOpen && mode === 'create') {
      resetForm()
    }
  }, [isOpen, mode, characteristic])

  const handleSubmit = () => {
    if (!name.trim()) {
      toast.error(t('catalog.validation.name_required', { defaultValue: 'Characteristic name is required' }))
      return
    }

    const payload: any = {
      name: name.trim(),
      type,
    }

    if (type === 'select') {
      const cleaned = values.map(v => v.trim()).filter(v => v)
      if (cleaned.length === 0) {
        toast.error('At least one option is required')
        return
      }
      payload.values = cleaned
    }

    if (mode === 'create') {
      createMutation.mutate(payload)
    } else if (mode === 'edit' && characteristic) {
      payload.is_active = isActive
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

  const setValueAt = (i: number, v: string) => { const next = values.slice(); next[i] = v; setValues(next) }
  const addRow = () => setValues(v => [...v, ''])
  const removeRow = (i: number) => { const next = values.slice(); next.splice(i,1); setValues(next.length? next : ['']) }

  return (
    <CustomModal
      isOpen={isOpen}
      onOpenChange={(open) => { if (!open) handleClose() }}
      title={mode === 'create' ? t('catalog.create.characteristic') : mode === 'edit' ? t('common.edit') + ' ' + t('catalog.entities.characteristic') : t('common.view') + ' ' + t('catalog.entities.characteristic')}
      onSubmit={isReadOnly ? undefined : handleSubmit}
      submitLabel={mode === 'create' ? t('common.create') : t('common.update')}
      isSubmitting={isSubmitting}
      size="lg"
    >
      <div className="space-y-4">
        <Input
          label={t('catalog.table.name')}
          placeholder={t('catalog.characteristics.name_placeholder', { defaultValue: 'Enter characteristic name' })}
          value={name}
          onValueChange={setName}
          isRequired
          isReadOnly={isReadOnly}
          variant="bordered"
        />

        <Select
          label={t('catalog.table.type')}
          placeholder={t('catalog.characteristics.type_placeholder', { defaultValue: 'Select characteristic type' })}
          selectedKeys={[type]}
          onSelectionChange={(keys) => setType(Array.from(keys)[0] as string)}
          isDisabled={isReadOnly}
          variant="bordered"
          classNames={{ trigger:'h-14' }}
        >
          {CHARACTERISTIC_TYPES.map(option => (
            <SelectItem key={option.key}>
              {t(option.labelKey)}
            </SelectItem>
          ))}
        </Select>

        {type === 'select' && (
          <div>
            <div className="text-sm font-medium mb-2">Options</div>
            <div className="space-y-2">
              {values.map((v, idx) => (
                <div key={idx} className="flex gap-2 items-center">
                  <Input variant="bordered" className="flex-1" placeholder="Enter option" value={v} onValueChange={(val)=> setValueAt(idx, val)} isReadOnly={isReadOnly} classNames={{ inputWrapper:'h-12' }} />
                  {!isReadOnly && (
                    <Button isIconOnly variant="flat" color="danger" className="h-12 w-12" onPress={()=> removeRow(idx)} aria-label="delete"><TrashIcon className="w-5 h-5" /></Button>
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
        )}

        {mode === 'edit' && (
          <Switch
            isSelected={isActive}
            onValueChange={setIsActive}
            isDisabled={isReadOnly}
          >
            {t('catalog.common.active')}
          </Switch>
        )}
      </div>
    </CustomModal>
  )
} 