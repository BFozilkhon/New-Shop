import { apiClient } from './base/apiClient'

export type ShopCustomer = { id: string; company_name: string; first_name: string; last_name?: string; phone?: string; cell_phone?: string; email?: string; labor_rate: string }
export type Paginated<T> = { items: T[]; total: number }

export type ShopUnit = {
  id: string
  tenant_id: string
  customer_id: string
  type: string
  vin: string
  year?: string
  make?: string
  model?: string
  unit_number: string
  unit_nickname?: string
  fleet?: string
  license_plate_state?: string
  license_plate?: string
  created_at?: string
  updated_at?: string
}

export type ShopContact = { id: string; customer_id: string; first_name: string; last_name?: string; email?: string; phone?: string; cell_phone?: string }

export const shopCustomersService = {
  list: (params: { page?: number; limit?: number; search?: string }) =>
    apiClient.get<{ data: Paginated<ShopCustomer> }>(`/api/shop/customers`, { params }).then(r => r.data.data),
  get: (id: string) => apiClient.get<{ data: ShopCustomer }>(`/api/shop/customers/${id}`).then(r => r.data.data),
  create: (payload: Partial<ShopCustomer>) => apiClient.post<{ data: ShopCustomer }>(`/api/shop/customers`, payload).then(r => r.data.data),
  update: (id: string, payload: Partial<ShopCustomer>) => apiClient.patch<{ data: ShopCustomer }>(`/api/shop/customers/${id}`, payload).then(r => r.data.data),
  remove: (id: string) => apiClient.delete(`/api/shop/customers/${id}`).then(r => r.data),
  laborRates: () => apiClient.get<{ data: string[] }>(`/api/shop/labor-rates`).then(r => r.data.data),
  // Units
  listUnits: (params: { page?: number; limit?: number; search?: string; customer_id: string }) =>
    apiClient.get<{ data: Paginated<ShopUnit> }>(`/api/shop/units`, { params }).then(r => r.data.data),
  getUnit: (id: string) => apiClient.get<{ data: ShopUnit }>(`/api/shop/units/${id}`).then(r => r.data.data),
  createUnit: (payload: any) => apiClient.post<{ data: ShopUnit }>(`/api/shop/units`, payload).then(r => r.data.data),
  updateUnit: (id: string, payload: any) => apiClient.patch<{ data: ShopUnit }>(`/api/shop/units/${id}`, payload).then(r => r.data.data),
  removeUnit: (id: string) => apiClient.delete(`/api/shop/units/${id}`).then(r => r.data),

  listContacts: (params: { page?: number; limit?: number; search?: string; customer_id: string }) =>
    apiClient.get<{ data: Paginated<ShopContact> }>(`/api/shop/contacts`, { params }).then(r => r.data.data),
  getContact: (id: string) => apiClient.get<{ data: ShopContact }>(`/api/shop/contacts/${id}`).then(r => r.data.data),
  createContact: (payload: Omit<ShopContact, 'id'>) => apiClient.post<{ data: ShopContact }>(`/api/shop/contacts`, payload).then(r => r.data.data),
  updateContact: (id: string, payload: Partial<ShopContact>) => apiClient.patch<{ data: ShopContact }>(`/api/shop/contacts/${id}`, payload).then(r => r.data.data),
  removeContact: (id: string) => apiClient.delete(`/api/shop/contacts/${id}`).then(r => r.data),
} 