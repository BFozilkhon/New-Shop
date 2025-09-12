import { apiClient } from './base/apiClient'

export type WriteOff = {
  id: string
  external_id: number
  name: string
  shop_id: string
  shop_name: string
  reason_id: string
  reason_name: string
  from_file: boolean
  status: 'NEW' | 'APPROVED' | 'REJECTED'
  total_qty: number
  total_supply_price: number
  total_retail_price: number
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

export const writeoffsService = {
  list: (params: { page?: number; limit?: number; search?: string; shop_id?: string; status?: string }) =>
    apiClient.get<{ data: Paginated<WriteOff> }>(`/api/writeoffs`, { params }).then(r => r.data.data),
  get: (id: string) => apiClient.get<{ data: WriteOff }>(`/api/writeoffs/${id}`).then(r => r.data.data),
  create: (payload: { name: string; from_file: boolean; shop_id: string; reason: string }) =>
    apiClient.post<{ data: WriteOff }>(`/api/writeoffs`, payload).then(r => r.data.data),
  update: (id: string, payload: Partial<{ name: string; items: WriteOff['items']; action: 'approve' | 'reject' }>) =>
    apiClient.patch<{ data: WriteOff }>(`/api/writeoffs/${id}`, payload).then(r => r.data.data),
  remove: (id: string) => apiClient.delete(`/api/writeoffs/${id}`).then(r => r.data),
} 