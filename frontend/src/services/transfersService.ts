import { apiClient } from './base/apiClient'

export type Transfer = {
  id: string
  external_id: number
  name: string
  departure_shop_id: string
  departure_shop_name: string
  arrival_shop_id: string
  arrival_shop_name: string
  from_file: boolean
  status: 'NEW' | 'APPROVED' | 'REJECTED'
  total_qty: number
  total_price: number
  created_at: string
  finished_at?: string
  created_by?: { id: string; name: string }
  finished_by?: { id: string; name: string }
  items?: Array<{
    id?: string
    product_id: string
    product_name: string
    product_sku: string
    barcode: string
    qty: number
    unit: string
    supply_price: number
    retail_price: number
  }>
}

export type Paginated<T> = { items: T[]; total: number }

export const transfersService = {
  list: (params: { page?: number; limit?: number; search?: string; departure_shop_id?: string; arrival_shop_id?: string; status?: string }) =>
    apiClient.get<{ data: Paginated<Transfer> }>(`/api/transfers`, { params }).then(r => r.data.data),
  get: (id: string) => apiClient.get<{ data: Transfer }>(`/api/transfers/${id}`).then(r => r.data.data),
  create: (payload: { name: string; from_file: boolean; departure_shop_id: string; arrival_shop_id: string }) =>
    apiClient.post<{ data: Transfer }>(`/api/transfers`, payload).then(r => r.data.data),
  update: (id: string, payload: Partial<{ name: string; items: Transfer['items']; action: 'approve' | 'reject' }>) =>
    apiClient.patch<{ data: Transfer }>(`/api/transfers/${id}`, payload).then(r => r.data.data),
  remove: (id: string) => apiClient.delete(`/api/transfers/${id}`).then(r => r.data),
} 