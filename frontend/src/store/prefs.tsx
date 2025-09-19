import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import i18n from '../config/i18n'

export type Preferences = { serviceMode: boolean; language: string; selectedStoreId?: string | null; selectedStoreName?: string | null; currency?: 'UZS'|'USD'; exchangeRate?: number }

type PreferencesContextValue = {
  prefs: Preferences
  setServiceMode: (v: boolean) => void
  setLanguage: (lang: string) => void
  setSelectedStore: (id: string | null, name: string | null) => void
  setCurrency: (code: 'UZS'|'USD') => void
  setExchangeRate: (rate: number) => void
}

const PreferencesContext = createContext<PreferencesContextValue>({
  prefs: { serviceMode: false, language: 'EN', selectedStoreId: null, selectedStoreName: null, currency: 'UZS', exchangeRate: 12000 },
  setServiceMode: () => {},
  setLanguage: () => {},
  setSelectedStore: () => {},
  setCurrency: () => {},
  setExchangeRate: () => {},
})

export function PreferencesProvider({ children }: { children: React.ReactNode }) {
  const [prefs, setPrefs] = useState<Preferences>(() => ({
    serviceMode: typeof window !== 'undefined' ? localStorage.getItem('pref_service_mode') === '1' : false,
    language: typeof window !== 'undefined' ? (localStorage.getItem('pref_language') || 'EN') : 'EN',
    selectedStoreId: typeof window !== 'undefined' ? (localStorage.getItem('pref_store_id') || null) : null,
    selectedStoreName: typeof window !== 'undefined' ? (localStorage.getItem('pref_store_name') || null) : null,
    currency: typeof window !== 'undefined' ? ((localStorage.getItem('pref_currency') as 'UZS'|'USD') || 'UZS') : 'UZS',
    exchangeRate: typeof window !== 'undefined' ? (Number(localStorage.getItem('pref_rate') || '12000') || 12000) : 12000,
  }))

  const setServiceMode = (v: boolean) => {
    setPrefs(prev => ({ ...prev, serviceMode: v }))
    try { localStorage.setItem('pref_service_mode', v ? '1' : '0') } catch {}
  }

  const setLanguage = (lang: string) => {
    setPrefs(prev => ({ ...prev, language: lang }))
    try { localStorage.setItem('pref_language', lang) } catch {}
    try { if (typeof document !== 'undefined') document.documentElement.lang = (lang || 'EN').toLowerCase() } catch {}
    try { i18n.changeLanguage((lang || 'EN').toLowerCase()) } catch {}
  }

  const setSelectedStore = (id: string | null, name: string | null) => {
    setPrefs(prev => ({ ...prev, selectedStoreId: id, selectedStoreName: name }))
    try {
      if (id) localStorage.setItem('pref_store_id', id); else localStorage.removeItem('pref_store_id')
      if (name) localStorage.setItem('pref_store_name', name); else localStorage.removeItem('pref_store_name')
    } catch {}
  }

  const setCurrency = (code: 'UZS'|'USD') => {
    setPrefs(prev => ({ ...prev, currency: code }))
    try { localStorage.setItem('pref_currency', code) } catch {}
  }

  const setExchangeRate = (rate: number) => {
    const r = Math.round(Number(rate || 0))
    setPrefs(prev => ({ ...prev, exchangeRate: r > 0 ? r : prev.exchangeRate }))
    try { if (r > 0) localStorage.setItem('pref_rate', String(r)) } catch {}
  }

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'pref_service_mode') setPrefs(prev => ({ ...prev, serviceMode: e.newValue === '1' }))
      if (e.key === 'pref_language') {
        const lang = (e.newValue || 'EN')
        setPrefs(prev => ({ ...prev, language: lang }))
        try { document.documentElement.lang = lang.toLowerCase() } catch {}
        try { i18n.changeLanguage((lang || 'EN').toLowerCase()) } catch {}
      }
      if (e.key === 'pref_store_id') setPrefs(prev => ({ ...prev, selectedStoreId: e.newValue }))
      if (e.key === 'pref_store_name') setPrefs(prev => ({ ...prev, selectedStoreName: e.newValue }))
      if (e.key === 'pref_currency') setPrefs(prev => ({ ...prev, currency: (e.newValue as 'UZS'|'USD') || 'UZS' }))
      if (e.key === 'pref_rate') setPrefs(prev => ({ ...prev, exchangeRate: Number(e.newValue || '12000') }))
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const value = useMemo(() => ({ prefs, setServiceMode, setLanguage, setSelectedStore, setCurrency, setExchangeRate }), [prefs])
  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>
}

export function usePreferences() { return useContext(PreferencesContext) } 