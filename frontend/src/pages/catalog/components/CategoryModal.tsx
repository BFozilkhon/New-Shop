import { useState, useEffect } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { categoriesService, Category } from '../../../services/categoriesService'
import CustomModal from '../../../components/common/CustomModal'
import { Input, Switch } from '@heroui/react'
import { toast } from 'react-toastify'
import { useTranslation } from 'react-i18next'

type Props = {
  isOpen: boolean
  mode: 'create' | 'edit' | 'view'
  category?: Category
  onClose: () => void
  onSuccess: () => void
}

export default function CategoryModal({ isOpen, mode, category, onClose, onSuccess }: Props) {
  const { t } = useTranslation()
  const [name, setName] = useState('')
  const [image, setImage] = useState('')
  const [isActive, setIsActive] = useState(true)

  // No parent categories needed

  const createMutation = useMutation({
    mutationFn: categoriesService.create,
    onSuccess: () => {
      toast.success(t('catalog.toast.created', { entity: t('catalog.entities.category') }))
      onSuccess()
      resetForm()
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || t('catalog.toast.create_failed', { entity: t('catalog.entities.category') }))
    }
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => categoriesService.update(id, data),
    onSuccess: () => {
      toast.success(t('catalog.toast.updated', { entity: t('catalog.entities.category') }))
      onSuccess()
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || t('catalog.toast.update_failed', { entity: t('catalog.entities.category') }))
    }
  })

  const resetForm = () => {
    setName('')
    setImage('')
    setIsActive(true)
  }

  useEffect(() => {
    if (isOpen && mode !== 'create' && category) {
      setName(category.name)
      setImage(category.image || '')
      setIsActive(category.is_active)
    } else if (isOpen && mode === 'create') {
      resetForm()
    }
  }, [isOpen, mode, category])

  const handleSubmit = () => {
    if (!name.trim()) {
      toast.error(t('catalog.validation.name_required', { defaultValue: 'Category name is required' }))
      return
    }

    const payload = {
      name: name.trim(),
      image: image.trim() || undefined,
      ...(mode === 'edit' && { is_active: isActive })
    }

    if (mode === 'create') {
      createMutation.mutate(payload)
    } else if (mode === 'edit' && category) {
      updateMutation.mutate({ id: category.id, data: payload })
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

  // no parent selection

  return (
    <CustomModal
      isOpen={isOpen}
      onOpenChange={(open) => { if (!open) handleClose() }}
      title={mode === 'create' ? t('catalog.create.category') : mode === 'edit' ? t('common.edit') + ' ' + t('catalog.entities.category') : t('common.view') + ' ' + t('catalog.entities.category')}
      onSubmit={isReadOnly ? undefined : handleSubmit}
      submitLabel={mode === 'create' ? t('common.create') : t('common.update')}
      isSubmitting={isSubmitting}
    >
      <div className="space-y-4">
        <Input
          label={t('catalog.table.name')}
          placeholder={t('catalog.categories.name_placeholder', { defaultValue: 'Enter category name' })}
          value={name}
          onValueChange={setName}
          isRequired
          isReadOnly={isReadOnly}
        />

        {/* parent selection removed */}

        <Input
          label={t('catalog.form.image_url')}
          placeholder={t('catalog.categories.image_placeholder', { defaultValue: 'Enter image URL (optional)' })}
          value={image}
          onValueChange={setImage}
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

        {mode === 'view' && category && (
          <div className="space-y-2 text-sm text-default-600">
            <div>Status: {category.is_active ? t('catalog.common.active') : t('catalog.common.inactive')}</div>
            <div>Created: {new Date(category.created_at).toLocaleDateString()}</div>
          </div>
        )}
      </div>
    </CustomModal>
  )
} 