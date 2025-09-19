import { useState, useEffect } from 'react'
import { Input, Textarea } from '@heroui/react'
import CustomModal from '../../../components/common/CustomModal'
import { suppliersService } from '../../../services/suppliersService'

export default function CreateSupplierModal({ isOpen, onOpenChange, onCreated, initialName }: { isOpen: boolean; onOpenChange: (v:boolean)=>void; onCreated?: (supplier:{id:string; name:string})=>void; initialName?: string }) {
  const [name, setName] = useState('')
  const [defaultMarkup, setDefaultMarkup] = useState<string>('0')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(()=>{ if (isOpen) setName(initialName||'') }, [isOpen, initialName])

  const canSubmit = name.trim() !== '' && defaultMarkup.trim() !== ''

  const onSubmit = async () => {
    if (!canSubmit || submitting) return
    setSubmitting(true)
    try {
      const created:any = await suppliersService.create({
        tenant_id: 'default',
        name: name.trim(),
        default_markup_percentage: Number(defaultMarkup || '0'),
        phone,
        email,
        notes,
        legal_address: { country:'', city:'', district:'', street:'', house:'' },
        bank_account: '',
        bank_name_branch: '',
        inn: '',
        mfo: '',
        documents: [],
      } as any)
      if (onCreated) onCreated({ id: created.id, name: created.name })
      onOpenChange(false)
      setName(''); setDefaultMarkup('0'); setPhone(''); setEmail(''); setNotes('')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <CustomModal isOpen={isOpen} onOpenChange={onOpenChange} title={'Create supplier'} onSubmit={onSubmit} isSubmitting={submitting} submitLabel={'Create'} submitDisabled={!canSubmit} size="lg">
      <div className="grid grid-cols-2 gap-4">
        <Input isRequired label={'Name'} variant="bordered" classNames={{ inputWrapper:'h-12' }} value={name} onValueChange={setName} />
        <Input isRequired label={'Default Markup'} type="number" variant="bordered" classNames={{ inputWrapper:'h-12' }} value={defaultMarkup} onValueChange={setDefaultMarkup} endContent={<span className="text-xs text-default-500">%</span>} />
        <Input label={'Phone'} variant="bordered" classNames={{ inputWrapper:'h-12' }} value={phone} onValueChange={setPhone} />
        <Input label={'Email'} type="email" variant="bordered" classNames={{ inputWrapper:'h-12' }} value={email} onValueChange={setEmail} />
        <div className="col-span-2"><Textarea label={'Notes'} variant="bordered" classNames={{ inputWrapper:'min-h-[3rem]' }} value={notes} onValueChange={setNotes} /></div>
      </div>
    </CustomModal>
  )
} 