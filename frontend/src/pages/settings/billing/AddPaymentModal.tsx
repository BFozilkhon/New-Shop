import { useState } from 'react'
import CustomModal from '../../../components/common/CustomModal'
import { Input, Select, SelectItem } from '@heroui/react'
import { toast } from 'react-toastify'
import { useTranslation } from 'react-i18next'

export default function AddPaymentModal({ isOpen, onOpenChange }: { isOpen: boolean; onOpenChange: (v: boolean) => void }) {
  const { t } = useTranslation()
  const [cardNumber, setCardNumber] = useState('')
  const [exp, setExp] = useState('')
  const [cvc, setCvc] = useState('')
  const [fullName, setFullName] = useState('')
  const [country, setCountry] = useState('US')
  const [address1, setAddress1] = useState('')
  const [saving, setSaving] = useState(false)

  const onSubmit = async () => {
    setSaving(true)
    try {
      await new Promise((r) => setTimeout(r, 700))
      toast.success(t('profile.billing.modal.saved'))
      onOpenChange(false)
    } catch (e) {
      toast.error(t('profile.billing.modal.failed'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <CustomModal
      isOpen={isOpen}
      onOpenChange={(open) => { if (!open) onOpenChange(false); else onOpenChange(true) }}
      title={t('profile.billing.modal.title')}
      onSubmit={onSubmit}
      submitLabel={t('common.save')}
      isSubmitting={saving}
    >
      <div className="space-y-4">
        <Input label={t('profile.billing.modal.card_number')} placeholder="1234 1234 1234 1234" value={cardNumber} onValueChange={setCardNumber} variant="bordered" classNames={{ inputWrapper: 'h-14' }} />
        <div className="grid grid-cols-3 gap-4">
          <Input label={t('profile.billing.modal.expiration')} placeholder="MM / YY" value={exp} onValueChange={setExp} variant="bordered" className="col-span-2" classNames={{ inputWrapper: 'h-14' }} />
          <Input label={t('profile.billing.modal.cvc')} placeholder="CVC" value={cvc} onValueChange={setCvc} variant="bordered" classNames={{ inputWrapper: 'h-14' }} />
        </div>
        <Input label={t('profile.billing.modal.full_name')} placeholder={t('profile.billing.modal.full_name')} value={fullName} onValueChange={setFullName} variant="bordered" classNames={{ inputWrapper: 'h-14' }} />
        <Select label={t('profile.billing.modal.country')} variant="bordered" className="w-full" classNames={{ trigger: 'h-14' }} selectedKeys={country ? new Set([country]) : new Set()} onSelectionChange={(keys) => { const k = Array.from(keys as Set<string>)[0] || ''; setCountry(k) }}>
          <SelectItem key="US">United States</SelectItem>
          <SelectItem key="GB">United Kingdom</SelectItem>
          <SelectItem key="DE">Germany</SelectItem>
          <SelectItem key="FR">France</SelectItem>
        </Select>
        <Input label={t('profile.billing.modal.address1')} placeholder={t('profile.billing.modal.address1')} value={address1} onValueChange={setAddress1} variant="bordered" classNames={{ inputWrapper: 'h-14' }} />
      </div>
    </CustomModal>
  )
} 