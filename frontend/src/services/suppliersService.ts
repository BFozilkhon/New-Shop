import { apiClient } from './base/apiClient'

export type SupplierAddress = {
  country: string
  city: string
  district: string
  street: string
  house: string
}

export type Supplier = {
  id: string
  tenant_id: string
  name: string
  default_markup_percentage: number
  phone: string
  email: string
  notes: string
  legal_address: SupplierAddress
  bank_account: string
  bank_name_branch: string
  inn: string
  mfo: string
  documents: string[]
  created_at: string
  updated_at: string
}

export type Paginated<T> = { items: T[]; total: number }

export const suppliersService = {
  list: (params: { page?: number; limit?: number; search?: string }) =>
    apiClient.get<{ data: Paginated<Supplier> }>(`/api/suppliers`, { params }).then(r => r.data.data),
  get: (id: string) =>
    apiClient.get<{ data: Supplier }>(`/api/suppliers/${id}`).then(r => r.data.data),
  create: (payload: Omit<Supplier, 'id' | 'created_at' | 'updated_at'>) =>
    apiClient.post<{ data: Supplier }>(`/api/suppliers`, payload).then(r => r.data.data),
  update: (id: string, payload: Partial<Omit<Supplier, 'id' | 'created_at' | 'updated_at'>>) =>
    apiClient.patch<{ data: Supplier }>(`/api/suppliers/${id}`, payload).then(r => r.data.data),
  remove: (id: string) =>
    apiClient.delete(`/api/suppliers/${id}`).then(r => r.data),

  products: (id: string, params: { page?: number; limit?: number; search?: string; shop_id?: string }) =>
    apiClient.get<{ data: Paginated<any> }>(`/api/suppliers/${id}/products`, { params }).then(r => r.data.data),
  stats: (id: string, params: { shop_id?: string }) =>
    apiClient.get<{ data: any }>(`/api/suppliers/${id}/stats`, { params }).then(r => r.data.data),
  payments: (id: string, params: { page?: number; limit?: number; shop_id?: string }) =>
    apiClient.get<{ data: Paginated<any> }>(`/api/suppliers/${id}/payments`, { params }).then(r => r.data.data),
} 