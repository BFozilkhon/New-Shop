import { useState } from 'react'
import CustomMainBody from '../../components/common/CustomMainBody'
import { Button } from '@heroui/react'
import { PaperAirplaneIcon, CameraIcon, ChatBubbleLeftRightIcon, EnvelopeIcon, DevicePhoneMobileIcon, PhoneIcon, UserGroupIcon } from '@heroicons/react/24/outline'
import IntegrationConnectModal from './IntegrationConnectModal'
import ConfirmModal from '../../components/common/ConfirmModal'
import { useTranslation } from 'react-i18next'

export default function IntegrationsPage() {
  const { t } = useTranslation()
  const [opened, setOpened] = useState(false)
  const [target, setTarget] = useState<{ id: string; name: string } | null>(null)
  const [confirm, setConfirm] = useState<{ id: string; name: string } | null>(null)
  const [connected, setConnected] = useState<Record<string, boolean>>(()=>{ try { return JSON.parse(localStorage.getItem('integration_connected') || '{}') } catch { return {} } })

  const groups = [
    { id: 'telegram', title: 'Telegram', icon: PaperAirplaneIcon, items: [
      { id: 'telegram_main', name: t('integrations.telegram.account'), description: t('integrations.telegram.account_desc') },
      { id: 'telegram_bot', name: t('integrations.telegram.bot'), description: t('integrations.telegram.bot_desc') },
      { id: 'telegram_shop', name: t('integrations.telegram.shop'), description: t('integrations.telegram.shop_desc') },
    ] },
    { id: 'instagram', title: 'Instagram', icon: CameraIcon, items: [
      { id: 'instagram_business', name: t('integrations.instagram.business'), description: t('integrations.instagram.business_desc') },
    ] },
    { id: 'facebook', title: 'Facebook', icon: UserGroupIcon, items: [
      { id: 'facebook_page', name: t('integrations.facebook.page'), description: t('integrations.facebook.page_desc') },
    ] },
    { id: 'whatsapp', title: 'WhatsApp', icon: ChatBubbleLeftRightIcon, items: [
      { id: 'whatsapp_business', name: t('integrations.whatsapp.business'), description: t('integrations.whatsapp.business_desc') },
      { id: 'whatsapp', name: t('integrations.whatsapp.personal'), description: t('integrations.whatsapp.personal_desc') },
    ] },
    { id: 'email', title: t('integrations.email.title'), icon: EnvelopeIcon, items: [
      { id: 'email_account', name: t('integrations.email.account'), description: t('integrations.email.account_desc') },
    ] },
    { id: 'sms', title: t('integrations.sms.title'), icon: DevicePhoneMobileIcon, items: [
      { id: 'sms_oson', name: t('integrations.sms.oson'), description: t('integrations.sms.oson_desc') },
    ] },
    { id: 'telephony', title: t('integrations.telephony.title'), icon: PhoneIcon, items: [
      { id: 'telephony', name: t('integrations.telephony.item'), description: t('integrations.telephony.item_desc') },
    ] },
  ]

  const handleToggle = (item: { id: string; name: string }) => {
    const isConnected = !!connected[item.id]
    if (isConnected) { setConfirm(item) } else { setTarget(item); setOpened(true) }
  }

  const handleSubmit = ({ token, secret }: { token: string; secret: string }) => {
    if (!target) return
    const credsRaw = localStorage.getItem('integration_creds')
    let creds: Record<string, { token: string; secret: string }> = {}
    try { creds = JSON.parse(credsRaw || '{}') } catch {}
    creds[target.id] = { token, secret }
    localStorage.setItem('integration_creds', JSON.stringify(creds))
    const next = { ...connected, [target.id]: true }
    setConnected(next)
    localStorage.setItem('integration_connected', JSON.stringify(next))
  }

  return (
    <CustomMainBody>
      <div className="space-y-8">
        {groups.map(group => {
          const Icon = group.icon
          return (
            <div key={group.id} className="border rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b bg-background">
                <div className="text-lg font-semibold flex items-center gap-2">
                  <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-content2">
                    <Icon className="w-6 h-6 text-default-600 " />
                  </span>
                  {group.title}
                </div>
              </div>
              <div>
                {group.items.map((it) => (
                  <div key={it.id} className="flex items-center justify-between px-6 py-5">
                    <div>
                      <div className="font-medium text-default-900">{it.name}</div>
                      <div className="text-default-500 text-sm">{it.description}</div>
                    </div>
                    <Button color={connected[it.id] ? 'danger' : 'primary'} onPress={() => handleToggle({ id: it.id, name: it.name })}>
                      {connected[it.id] ? t('integrations.disconnect') : t('integrations.connect')}
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      <IntegrationConnectModal isOpen={opened} onOpenChange={setOpened} integration={target} onSubmit={handleSubmit} />
      <ConfirmModal
        isOpen={!!confirm}
        title={t('integrations.disconnect_title', { name: confirm?.name || '' })}
        description={t('integrations.disconnect_desc')}
        confirmText={t('integrations.disconnect')}
        confirmColor={'danger'}
        onConfirm={() => {
          if (!confirm) return
          const id = confirm.id
          const next = { ...connected, [id]: false }
          setConnected(next)
          localStorage.setItem('integration_connected', JSON.stringify(next))
          try {
            const raw = localStorage.getItem('integration_creds')
            const creds = raw ? JSON.parse(raw) : {}
            if (creds && typeof creds === 'object' && creds[id]) { delete creds[id]; localStorage.setItem('integration_creds', JSON.stringify(creds)) }
          } catch {}
          setConfirm(null)
        }}
        onClose={() => setConfirm(null)}
      />
    </CustomMainBody>
  )
} 