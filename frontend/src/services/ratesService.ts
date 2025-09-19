import { apiClient } from './base/apiClient'
import { usePreferences } from '../store/prefs'

export type ExchangeRate = { id: string; rate: number; start_at: string; end_at?: string|null }
export type Paginated<T> = { items: T[]; total: number }

export async function fetchUsdToUzs(): Promise<number> {
  try {
    const res = await fetch('https://open.er-api.com/v6/latest/USD')
    const json = await res.json()
    const uzs = Number(json?.rates?.UZS || 0)
    if (uzs > 0) return uzs
  } catch {}
  return 12000
}

export async function refreshExchangeRate() {
  const rate = await fetchUsdToUzs()
  try {
    localStorage.setItem('pref_rate', String(rate))
    window.dispatchEvent(new StorageEvent('storage', { key: 'pref_rate', newValue: String(rate) }))
  } catch {}
  return rate
}

export const ratesService = {
  list: (params: { page?: number; limit?: number }) =>
    apiClient.get<{ data: { items: ExchangeRate[]; total: number } }>(`/api/exchange-rates`, { params }).then(r => r.data.data),
  create: (payload: { rate: number; start_at?: string }) =>
    apiClient.post<{ data: ExchangeRate }>(`/api/exchange-rates`, payload).then(r => r.data.data),
  getAt: (at: string) =>
    apiClient.get<{ data: ExchangeRate }>(`/api/exchange-rates/at`, { params: { at } }).then(r => r.data.data),
} 