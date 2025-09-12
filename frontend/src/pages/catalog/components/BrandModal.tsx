import { useState, useEffect } from 'react'
import { useMutation } from '@tanstack/react-query'
import { brandsService, Brand } from '../../../services/brandsService'
import CustomModal from '../../../components/common/CustomModal'
import { Input, Textarea, Switch } from '@heroui/react'
import { toast } from 'react-toastify'
import { useTranslation } from 'react-i18next'

type Props = {
  isOpen: boolean
  mode: 'create' | 'edit' | 'view'
  brand?: Brand
  onClose: () => void
  onSuccess: () => void
}

export default function BrandModal({ isOpen, mode, brand, onClose, onSuccess }: Props) {
  const { t } = useTranslation()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [logo, setLogo] = useState('')
  const [website, setWebsite] = useState('')
  const [isActive, setIsActive] = useState(true)

  const createMutation = useMutation({
    mutationFn: brandsService.create,
    onSuccess: () => {
      toast.success(t('catalog.toast.created', { entity: t('catalog.entities.brand') }))
      onSuccess()
      resetForm()
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || t('catalog.toast.create_failed', { entity: t('catalog.entities.brand') }))
    }
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => brandsService.update(id, data),
    onSuccess: () => {
      toast.success(t('catalog.toast.updated', { entity: t('catalog.entities.brand') }))
      onSuccess()
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || t('catalog.toast.update_failed', { entity: t('catalog.entities.brand') }))
    }
  })

  const resetForm = () => {
    setName('')
    setDescription('')
    setLogo('')
    setWebsite('')
    setIsActive(true)
  }

  useEffect(() => {
    if (isOpen && mode !== 'create' && brand) {
      setName(brand.name)
      setDescription(brand.description)
      setLogo(brand.logo)
      setWebsite(brand.website)
      setIsActive(brand.is_active)
    } else if (isOpen && mode === 'create') {
      resetForm()
    }
  }, [isOpen, mode, brand])

  const handleSubmit = () => {
    if (!name.trim()) {
      toast.error(t('catalog.validation.name_required', { defaultValue: 'Brand name is required' }))
      return
    }

    const payload = {
      name: name.trim(),
      description: description.trim(),
      logo: logo.trim(),
      images: [],
      website: website.trim(),
      ...(mode === 'edit' && { is_active: isActive })
    }

    if (mode === 'create') {
      createMutation.mutate(payload)
    } else if (mode === 'edit' && brand) {
      updateMutation.mutate({ id: brand.id, data: payload })
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
      title={mode === 'create' ? t('catalog.create.brand') : mode === 'edit' ? t('common.edit') + ' ' + t('catalog.entities.brand') : t('common.view') + ' ' + t('catalog.entities.brand')}
      onSubmit={isReadOnly ? undefined : handleSubmit}
      submitLabel={mode === 'create' ? t('common.create') : t('common.update')}
      isSubmitting={isSubmitting}
    >
      <div className="space-y-4">
        <Input
          label={t('catalog.table.name')}
          placeholder={t('catalog.brands.name_placeholder', { defaultValue: 'Enter brand name' })}
          value={name}
          onValueChange={setName}
          isRequired
          isReadOnly={isReadOnly}
        />

        <Textarea
          label={t('catalog.table.description')}
          placeholder={t('catalog.brands.description_placeholder', { defaultValue: 'Enter brand description' })}
          value={description}
          onValueChange={setDescription}
          isReadOnly={isReadOnly}
          minRows={3}
        />

        <Input
          label={t('catalog.form.logo_url')}
          placeholder={t('catalog.brands.logo_placeholder', { defaultValue: 'Enter logo URL (optional)' })}
          value={logo}
          onValueChange={setLogo}
          isReadOnly={isReadOnly}
        />

        <Input
          label={t('catalog.table.website')}
          placeholder={t('catalog.brands.website_placeholder', { defaultValue: 'Enter website URL (optional)' })}
          value={website}
          onValueChange={setWebsite}
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

        {mode === 'view' && brand && (
          <div className="space-y-2 text-sm text-default-600">
            <div>Product Count: {brand.product_count}</div>
            <div>Status: {brand.is_active ? t('catalog.common.active') : t('catalog.common.inactive')}</div>
            <div>Created: {new Date(brand.created_at).toLocaleDateString()}</div>
          </div>
        )}
      </div>
    </CustomModal>
  )
} 