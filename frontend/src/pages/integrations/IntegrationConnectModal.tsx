import { useEffect, useState } from 'react'
import CustomModal from '../../components/common/CustomModal'
import { Input } from '@heroui/react'
import { useTranslation } from 'react-i18next'

export default function IntegrationConnectModal({ isOpen, onOpenChange, integration, onSubmit }: { isOpen: boolean; onOpenChange: (v:boolean)=>void; integration: { id: string; name: string } | null; onSubmit: (payload:{ token:string; secret:string })=>void }) {
  const { t } = useTranslation()
  const [token, setToken] = useState('')
  const [secret, setSecret] = useState('')

  useEffect(()=>{
    if (isOpen && integration) {
      try {
        const creds = JSON.parse(localStorage.getItem('integration_creds') || '{}')
        const prev = creds[integration.id] || {}
        setToken(prev.token || '')
        setSecret(prev.secret || '')
      } catch { setToken(''); setSecret('') }
    }
  }, [isOpen, integration?.id])

  const handleSubmit = () => { onSubmit({ token, secret }); onOpenChange(false); setToken(''); setSecret('') }

  return (
    <CustomModal
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      title={integration ? t('integrations.connect_title', { name: integration.name }) : t('integrations.connect')}
      onSubmit={handleSubmit}
      submitLabel={t('integrations.connect')}
    >
      <div className="space-y-4">
        <Input label={t('integrations.token')} value={token} onValueChange={setToken} variant="bordered" classNames={{ inputWrapper: 'h-12' }} />
        <Input label={t('integrations.secret')} value={secret} onValueChange={setSecret} variant="bordered" classNames={{ inputWrapper: 'h-12' }} />
      </div>
    </CustomModal>
  )
} 