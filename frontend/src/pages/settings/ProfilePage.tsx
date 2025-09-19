import { useState, useEffect, useRef } from 'react'
import { uploadService } from '../../services/uploadService'
import { usersService } from '../../services/usersService'
import { Button, Input, Switch, Select, SelectItem } from '@heroui/react'
import PricingPlans from './billing/PricingPlans'
import PrivacyContent from './PrivacyContent'
import TermsContent from './TermsContent'
import { useAuth } from '../../store/auth'
import { toast } from 'react-toastify'
import { PhotoIcon } from '@heroicons/react/24/outline'
import { usePreferences } from '../../store/prefs'
import { useTranslation } from 'react-i18next'
import { tenantsService } from '../../services/tenantsService'
import { refreshExchangeRate } from '../../services/ratesService'
import { useNavigate } from 'react-router-dom'

const sections = [
  { key: 'general', labelKey: 'profile.sections.general' },
  { key: 'billing', labelKey: 'profile.sections.billing' },
  { key: 'history', labelKey: 'profile.sections.history' },
  { key: 'contact', labelKey: 'profile.sections.contact' },
  { key: 'privacy', labelKey: 'profile.sections.privacy' },
  { key: 'terms', labelKey: 'profile.sections.terms' },
]

export default function ProfilePage() {
  const { t } = useTranslation()
  const [activeKey, setActiveKey] = useState('general')
  const navigate = useNavigate()

  // General form state
  const [name, setName] = useState('')
  const [username, setUsername] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [avatar, setAvatar] = useState<string[]>([])
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const { auth } = useAuth()
  const { prefs, setServiceMode: setSvcModePref, setLanguage: setLangPref, setCurrency, setExchangeRate } = usePreferences()

  // Preferences
  const [notifyEnabled, setNotifyEnabled] = useState<boolean>(() => localStorage.getItem('pref_notify') === '1')
  const [serviceMode, setServiceMode] = useState<boolean>(prefs.serviceMode)
  const [language, setLanguage] = useState<string>(prefs.language || 'EN')
  const [timezone, setTimezone] = useState<string>(() => localStorage.getItem('pref_timezone') || 'Asia/Tashkent')
  const [currency, setCurrencyState] = useState<'UZS'|'USD'>(prefs.currency || 'UZS')
  const [rate, setRate] = useState<number>(Number(prefs.exchangeRate || 12000))

  // keep track of created object URLs so we can revoke them
  const createdObjectUrlsRef = useRef<string[]>([])

  useEffect(() => {
    // load user data from auth store
    if (auth?.user) {
      setName(auth.user.name || '')
      setUsername((auth.user as any).username || '')
      setPhone((auth.user as any).phone || '')
      setEmail(auth.user.email || '')
      // if user has avatar field, set it
      const av = (auth.user as any).avatar
      if (av) setAvatar([av])
    }
    // load current tenant timezone
    tenantsService.getCurrent().then(t => { if (t?.settings?.timezone) { setTimezone(t.settings.timezone) } }).catch(()=>{})

    return () => {
      // revoke created object URLs on unmount
      createdObjectUrlsRef.current.forEach(u => { try { URL.revokeObjectURL(u) } catch {} })
      createdObjectUrlsRef.current = []
    }
  }, [auth])

  useEffect(() => { localStorage.setItem('pref_notify', notifyEnabled ? '1' : '0') }, [notifyEnabled])
  useEffect(() => { localStorage.setItem('pref_service_mode', serviceMode ? '1' : '0'); setSvcModePref(serviceMode) }, [serviceMode])
  useEffect(() => { localStorage.setItem('pref_language', language); setLangPref(language) }, [language])
  useEffect(() => { if (timezone) localStorage.setItem('pref_timezone', timezone) }, [timezone])
  useEffect(() => { setCurrency(currency); localStorage.setItem('pref_currency', currency) }, [currency])
  useEffect(() => { if (rate>0) { setExchangeRate(rate); localStorage.setItem('pref_rate', String(Math.round(rate))) } }, [rate])

  const [isSaving, setIsSaving] = useState(false)

  const onSave = async () => {
    try {
      if (!auth?.user?.id) return toast.error('No user found')
      setIsSaving(true)
      const payload: any = { name, email, password: password || undefined, phone, pref_service_mode: serviceMode, pref_language: language }
      if (avatar && avatar.length > 0) payload.avatar = avatar[0]
      const updated = await usersService.update(auth.user.id, payload)
      // save tenant timezone
      try { await tenantsService.updateCurrent({ settings: { timezone, currency } }) } catch {}
      localStorage.setItem('user', JSON.stringify(updated))
      // sync prefs to localStorage for immediate effect
      localStorage.setItem('pref_service_mode', serviceMode ? '1' : '0')
      localStorage.setItem('pref_language', language)
      localStorage.setItem('pref_timezone', timezone)
      // apply language immediately
      try { document.documentElement.lang = (language || 'EN').toLowerCase() } catch {}
      toast.success('Profile updated')
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to save')
    } finally {
      setIsSaving(false)
    }
  }

  const openAvatarDialog = () => {
    fileInputRef.current?.click()
  }

  const handleAvatarFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    const fileArray = Array.from(files)

    // immediate preview using object URL(s)
    const previewUrls = fileArray.map(f => {
      const u = URL.createObjectURL(f)
      createdObjectUrlsRef.current.push(u)
      return u
    })
    setAvatar(prev => [...prev, ...previewUrls])

    try {
      const uploaded = await uploadService.uploadImages(fileArray)
      // replace the preview URLs (blob:) with uploaded URLs in same order
      setAvatar(prev => {
        const result = [...prev]
        let i = 0
        for (let j = 0; j < result.length && i < uploaded.length; j++) {
          if (result[j].startsWith('blob:')) {
            result[j] = uploaded[i++]
          }
        }
        return result
      })
    } catch (err) {
      // upload failed, keep preview but could show toast
    }
  }

  const handleFetchRate = async () => {
    const r = await refreshExchangeRate()
    setRate(r)
  }

  return (
    <div className="w-full">
      <div className="mb-6">
        <div className="text-sm text-default-500">{t('profile.breadcrumb')}</div>
        <h1 className="text-3xl font-semibold mt-3">{t('profile.header')}</h1>
      </div>

      <div className="flex gap-6 items-start">
        <div className="w-72 self-start h-fit">
          <aside className="sticky top-6 self-start rounded-lg border border-default-200 p-3 bg-white shadow-sm">
            {sections.map(s => (
              <div key={s.key} className={`mb-3 ${activeKey === s.key ? 'bg-primary-50 rounded-md' : ''}`}> 
                <button className={`w-full text-left px-4 py-3 flex items-center gap-3 ${activeKey === s.key ? 'text-primary font-medium' : 'text-default-700'}`} onClick={() => setActiveKey(s.key)}>
                  <span className="w-5 h-5 rounded-full bg-default-200 flex items-center justify-center">{t(s.labelKey)[0]}</span>
                  <span>{t(s.labelKey)}</span>
                </button>
              </div>
            ))}
          </aside>
        </div>

        <div className="flex-1">
          <div className="relative">
            <div className="bg-white rounded-lg p-6 border border-default-200 shadow-sm">
              {activeKey === 'general' && (
                <div>
                  <div className="flex items-start gap-6">
                    <div className="w-28 h-28 rounded-full bg-default-100  flex items-center justify-center relative">
                      {avatar && avatar[0] ? (
                        <img src={avatar[0]} alt="avatar" className="w-full h-full object-cover rounded-full" onError={(e)=>{(e.target as HTMLImageElement).src='/assets/images/logo.jpg'}} />
                      ) : (
                        <div className="text-sm text-default-500">{t('profile.general.no_image')}</div>
                      )}
                      {/* edit button opens hidden file input */}
                      <button type="button" onClick={openAvatarDialog} className="absolute -bottom-2 -right-2 bg-primary text-white rounded-full p-2 shadow-lg border-4 border-white z-20">
                        <PhotoIcon className="w-4 h-4" />
                      </button>
                      <input ref={(el)=>fileInputRef.current = el} type="file" accept="image/*" className="hidden" onChange={(e) => handleAvatarFiles(e.target.files)} />
                    </div>
                    <div className="flex-1">
                      <div className="grid grid-cols-2 gap-4">
                        <Input label={t('profile.general.name')} value={name} onValueChange={(v) => setName(v)} variant="bordered" classNames={{ inputWrapper: 'h-14' }} />
                        <Input label={t('profile.general.phone')} value={phone} onValueChange={(v) => setPhone(v)} variant="bordered" classNames={{ inputWrapper: 'h-14' }} />
                        <Input label={t('profile.general.email')} value={email} onValueChange={(v) => setEmail(v)} className="col-span-2" variant="bordered" classNames={{ inputWrapper: 'h-14' }} />
                        <Input label={t('profile.general.password')} value={password} onValueChange={(v) => setPassword(v)} className="col-span-2" type="password" variant="bordered" classNames={{ inputWrapper: 'h-14' }} />
                      </div>

                      <div className="mt-6 grid grid-cols-2 gap-4">
                        <div className="flex items-center justify-between border rounded-lg p-3">
                          <div>
                            <div className="font-medium">{t('profile.general.notifications')}</div>
                            <div className="text-xs text-default-500">{t('profile.general.notifications_hint')}</div>
                          </div>
                          <Switch isSelected={notifyEnabled} onValueChange={setNotifyEnabled} aria-label="notifications" />
                        </div>
                        <div className="flex items-center justify-between border rounded-lg p-3">
                          <div>
                            <div className="font-medium">{t('profile.general.service_mode')}</div>
                            <div className="text-xs text-default-500">{t('profile.general.service_mode_hint')}</div>
                          </div>
                          <Switch isSelected={serviceMode} onValueChange={setServiceMode} aria-label="service mode" />
                        </div>
                        <div className="col-span-2">
                          <Select label={t('profile.general.language')} selectedKeys={[language]} onSelectionChange={(keys)=> setLanguage((Array.from(keys)[0] as string)||'EN')} variant="bordered" classNames={{ trigger: 'h-14' }}>
                            <SelectItem key="EN">English</SelectItem>
                            <SelectItem key="UZ">Uzbek</SelectItem>
                            <SelectItem key="RU">Russian</SelectItem>
                          </Select>
                        </div>
                        <div className="col-span-2">
                          <Select label="Timezone" selectedKeys={[timezone]} onSelectionChange={(keys)=> setTimezone((Array.from(keys)[0] as string)||'Asia/Tashkent')} variant="bordered" classNames={{ trigger: 'h-14' }}>
                            <SelectItem key="Asia/Tashkent">Uzbekistan (Asia/Tashkent)</SelectItem>
                            <SelectItem key="America/New_York">USA – Eastern (America/New_York)</SelectItem>
                            <SelectItem key="America/Chicago">USA – Central (America/Chicago)</SelectItem>
                            <SelectItem key="America/Denver">USA – Mountain (America/Denver)</SelectItem>
                            <SelectItem key="America/Los_Angeles">USA – Pacific (America/Los_Angeles)</SelectItem>
                            <SelectItem key="UTC">UTC</SelectItem>
                          </Select>
                        </div>
                        <div className="col-span-2 grid grid-cols-2 gap-4">
                          <Select label="Currency" selectedKeys={[currency]} onSelectionChange={(k)=> setCurrencyState((Array.from(k)[0] as 'UZS'|'USD')||'UZS')} variant="bordered" classNames={{ trigger:'h-14' }}>
                            <SelectItem key="UZS">UZS</SelectItem>
                            <SelectItem key="USD">USD</SelectItem>
                          </Select>
                          <div className="flex items-center gap-3">
                            <Button variant="flat" onPress={()=> navigate('/settings/exchange-rates')}>Manage Exchange Rate History</Button>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 flex justify-end">
                        <Button onPress={onSave} color="primary">{t('profile.general.save_changes')}</Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeKey === 'history' && (
                <div>
                  <h3 className="text-lg font-medium mb-4">{t('profile.history.title')}</h3>
                  <div className="bg-default-50 p-4 rounded border border-default-100">
                    <div className="py-3 border-b">August 16, 2025 at 03:00 PM — <span className="font-medium">{t('profile.history.paid')}</span> — 20.00 USD</div>
                    <div className="py-3">July 01, 2025 at 05:30 PM — <span className="font-medium">{t('profile.history.paid')}</span> — 150.00 USD</div>
                  </div>
                </div>
              )}

              {activeKey === 'contact' && (
                <div>
                  <h3 className="text-lg font-medium mb-4">{t('profile.contact.title')}</h3>
                  <p>{t('profile.contact.body1')} <a className="text-primary" href="mailto:support@example.com">support@example.com</a>.</p>
                  <p className="mt-3">{t('profile.contact.body2')}</p>
                </div>
              )}

              {activeKey === 'billing' && (
                <div>
                  <h3 className="text-lg font-medium mb-4">{t('profile.billing.title')}</h3>
                  <p className="mb-4 text-default-500">{t('profile.billing.desc')}</p>

                  <PricingPlans />
                </div>
              )}

              {activeKey === 'privacy' && (
                <div>
                  <h3 className="text-lg font-medium mb-4">{t('profile.privacy.title')}</h3>
                  <PrivacyContent />
                </div>
              )}

              {activeKey === 'terms' && (
                <div>
                  <h3 className="text-lg font-medium mb-4">{t('profile.terms.title')}</h3>
                  <TermsContent />
                </div>
              )}

            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 