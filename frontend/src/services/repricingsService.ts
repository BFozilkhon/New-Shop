import { apiClient } from './base/apiClient'

export type RepricingItem = {
  id?: string
  product_id: string
  product_name: string
  product_sku: string
  barcode: string
  currency: string
  supply_price: number
  retail_price: number
  qty: number
}

export type Repricing = {
  id: string
  external_id: number
  name: string
  shop_id: string
  shop_name: string
  from_file: boolean
  type: 'price_change' | 'currency_change' | 'delivery_price_change'
  status: 'NEW' | 'APPROVED' | 'REJECTED'
  total_items_count: number
  total: number
  created_at: string
  finished_at?: string
  created_by?: { id: string; name: string }
  finished_by?: { id: string; name: string }
  items?: RepricingItem[]
}

export type Paginated<T> = { items: T[]; total: number }

export const repricingsService = {
  list: (params: { page?: number; limit?: number; search?: string; shop_id?: string; status?: string }) =>
    apiClient.get<{ data: Paginated<Repricing> }>(`/api/repricings`, { params }).then(r => r.data.data),
  get: (id: string) => apiClient.get<{ data: Repricing }>(`/api/repricings/${id}`).then(r => r.data.data),
  create: (payload: { name: string; from_file: boolean; shop_id: string; type: string }) =>
    apiClient.post<{ data: Repricing }>(`/api/repricings`, payload).then(r => r.data.data),
  update: (id: string, payload: Partial<{ name: string; items: RepricingItem[]; action: 'approve' | 'reject' }>) =>
    apiClient.patch<{ data: Repricing }>(`/api/repricings/${id}`, payload).then(r => r.data.data),
  remove: (id: string) => apiClient.delete(`/api/repricings/${id}`).then(r => r.data),
} 