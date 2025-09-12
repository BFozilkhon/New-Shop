import { apiClient } from './base/apiClient'

export type ShopVendor = {
  id: string
  tenant_id: string
  vendor_name: string
  first_name: string
  last_name?: string
  email?: string
  phone?: string
  cell_phone?: string
  created_at?: string
  updated_at?: string
}

export type Paginated<T> = { items: T[]; total: number }

export const shopVendorsService = {
  list: (params: { page?: number; limit?: number; search?: string } = {}) =>
    apiClient.get<{ data: Paginated<ShopVendor> }>(`/api/shop/vendors`, { params }).then(r => r.data.data),
  get: (id: string) => apiClient.get<{ data: ShopVendor }>(`/api/shop/vendors/${id}`).then(r => r.data.data),
  create: (payload: { vendor_name: string; first_name: string; last_name?: string; email?: string; phone?: string; cell_phone?: string }) =>
    apiClient.post<{ data: ShopVendor }>(`/api/shop/vendors`, payload).then(r => r.data.data),
  update: (id: string, payload: Partial<ShopVendor>) =>
    apiClient.patch<{ data: ShopVendor }>(`/api/shop/vendors/${id}`, payload).then(r => r.data.data),
  remove: (id: string) => apiClient.delete(`/api/shop/vendors/${id}`).then(r => r.data),
} 